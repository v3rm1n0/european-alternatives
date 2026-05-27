<?php
declare(strict_types=1);

/**
 * Apply verified deep-research scoring rows to the database transactionally.
 *
 * Stage 5 of the deep-research scoring pipeline. Consumes the verified
 * handoff produced by `scripts/vet-deep-research-verify-codex-run.mjs`
 * (stage 3) and the worksheet path emitted by
 * `scripts/vet-deep-research-worksheet-run.mjs` (stage 4), and persists the
 * surviving rows into `positive_signals`, `reservations`, and
 * `scoring_metadata` inside a single transaction.
 *
 * No stored trust-score value is written. The dynamic scorer in
 * `api/catalog/scoring.php` flips the entry to `ready` once a
 * `scoring_metadata` row (and/or any `positive_signals` row) exists.
 *
 * Usage:
 *   php scripts/apply-deep-research-scoring.php \
 *     --verified-action-json <json> --worksheet-path <path> [--replace-existing] [--dry-run]
 *   php scripts/apply-deep-research-scoring.php \
 *     --verified-action-file <path> --worksheet-path <path> [--replace-existing] [--dry-run]
 *
 * Exit codes:
 *   0   applied (or dry-run plan emitted)
 *   64  invalid CLI usage
 *   65  fail-closed: schema / threshold / banned-key / evidence rejection
 *   2   pre-existing scored entry without --replace-existing
 *   1   database / runtime failure (after rollback)
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script must be run from the command line.';
    exit(1);
}

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/db.php';
require_once __DIR__ . '/../api/cache.php';
require_once __DIR__ . '/../api/admin/auth.php';

const APPLY_SCORING_INVALID_USAGE = 64;
const APPLY_SCORING_FAIL_CLOSED = 65;
const APPLY_SCORING_ALREADY_SCORED = 2;
const APPLY_SCORING_RUNTIME_ERROR = 1;

const APPLY_SCORING_SCHEMA_VERSION = 1;
const APPLY_SCORING_MIN_TOTAL_ROWS = 8;
const APPLY_SCORING_MIN_POSITIVE_SIGNALS = 4;
const APPLY_SCORING_MIN_RESERVATIONS = 1;
const APPLY_SCORING_PATH_MAX_LEN = 512;
const APPLY_SCORING_KEY_MAX_LEN = 100;
const APPLY_SCORING_SLUG_REGEX = '/^[a-z0-9]([a-z0-9._-]{0,98}[a-z0-9])?$/u';

const APPLY_SCORING_DIMENSIONS = ['security', 'governance', 'reliability', 'contract'];
const APPLY_SCORING_SEVERITIES = ['minor', 'moderate', 'major'];
const APPLY_SCORING_BASE_CLASSES = ['foss', 'eu', 'nonEU', 'rest', 'us', 'autocracy'];

const APPLY_SCORING_BANNED_KEYS = [
    'trustScore',
    'trust_score',
    'trustScoreStatus',
    'trust_score_status',
];

try {
    runApplyDeepResearchScoring($argv);
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    exit(APPLY_SCORING_RUNTIME_ERROR);
}

/**
 * @param list<string> $argv
 */
function runApplyDeepResearchScoring(array $argv): never
{
    try {
        $options = applyScoringParseArgs($argv);
    } catch (InvalidArgumentException $e) {
        fwrite(STDERR, 'Invalid usage: ' . $e->getMessage() . "\n");
        exit(APPLY_SCORING_INVALID_USAGE);
    }

    if ($options['help'] === true) {
        applyScoringPrintUsage();
        exit(0);
    }

    try {
        $handoff = applyScoringLoadHandoff($options);
        applyScoringValidate($handoff, $options);
    } catch (LogicException $e) {
        fwrite(STDERR, 'fail-closed: ' . $e->getMessage() . "\n");
        exit(APPLY_SCORING_FAIL_CLOSED);
    }

    $entrySlug = (string) $handoff['entrySlug'];
    $documentPath = is_string($handoff['documentPath'] ?? null)
        ? (string) $handoff['documentPath']
        : null;
    $worksheetPath = (string) $options['worksheetPath'];
    $replaceExisting = $options['replaceExisting'] === true;
    $dryRun = $options['dryRun'] === true || ($handoff['dryRun'] ?? false) === true;

    $accepted = $handoff['accepted'];
    $plan = applyScoringBuildPlan(
        $entrySlug,
        $accepted,
        $documentPath,
        $worksheetPath,
    );

    if ($dryRun) {
        $outcome = [
            'ok' => true,
            'entrySlug' => $entrySlug,
            'dryRun' => true,
            'replaceExisting' => $replaceExisting,
            'plan' => $plan,
            'changesApplied' => $plan,
        ];
        applyScoringEmitOutcome($outcome);
        exit(0);
    }

    $alreadyScoredRefusal = false;
    $replacedExisting = false;
    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();

    try {
        $entryRow = applyScoringLockEntry($pdo, $entrySlug);

        if ($entryRow === null) {
            throw new RuntimeException("catalog entry slug '{$entrySlug}' not found");
        }

        $entryId = (int) $entryRow['id'];

        $existingSignalsCount = applyScoringCountRows($pdo, 'positive_signals', $entryId);
        $existingReservationsCount = applyScoringCountRows($pdo, 'reservations', $entryId);
        $existingMeta = applyScoringFetchMetadata($pdo, $entryId);

        $alreadyScored = $existingMeta !== null
            || $existingSignalsCount > 0
            || $existingReservationsCount > 0;

        if ($alreadyScored && !$replaceExisting) {
            $alreadyScoredRefusal = true;
            throw new RuntimeException(
                "entry '{$entrySlug}' is already scored; pass --replace-existing to overwrite"
            );
        }

        if ($alreadyScored) {
            applyScoringDeleteExisting($pdo, $entryId);
            $replacedExisting = true;
        }

        applyScoringInsertPositiveSignals($pdo, $entryId, $accepted['positive_signals']);
        applyScoringInsertReservations($pdo, $entryId, $accepted['reservations']);
        applyScoringInsertMetadata(
            $pdo,
            $entryId,
            $accepted['scoring_metadata'] ?? null,
            $documentPath,
            $worksheetPath,
        );

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if ($alreadyScoredRefusal) {
            $outcome = [
                'ok' => false,
                'entrySlug' => $entrySlug,
                'dryRun' => false,
                'rolledBack' => true,
                'alreadyScored' => true,
                'requiresReplaceFlag' => true,
                'error' => $e->getMessage(),
            ];
            applyScoringEmitOutcome($outcome);
            exit(APPLY_SCORING_ALREADY_SCORED);
        }

        $outcome = [
            'ok' => false,
            'entrySlug' => $entrySlug,
            'dryRun' => false,
            'rolledBack' => true,
            'error' => $e->getMessage(),
        ];
        applyScoringEmitOutcome($outcome);
        exit(APPLY_SCORING_RUNTIME_ERROR);
    }

    invalidateCache();
    applyScoringLogAudit($entrySlug, $plan, $replacedExisting);

    $outcome = [
        'ok' => true,
        'entrySlug' => $entrySlug,
        'dryRun' => false,
        'replacedExisting' => $replacedExisting,
        'changesApplied' => $plan,
    ];
    applyScoringEmitOutcome($outcome);
    exit(0);
}

function applyScoringPrintUsage(): void
{
    $msg = "Usage:\n"
        . "  php scripts/apply-deep-research-scoring.php --verified-action-json <json> --worksheet-path <path> [--replace-existing] [--dry-run]\n"
        . "  php scripts/apply-deep-research-scoring.php --verified-action-file <path> --worksheet-path <path> [--replace-existing] [--dry-run]\n"
        . "\n"
        . "Exit codes:\n"
        . "  0   applied (or dry-run plan emitted)\n"
        . "  64  invalid CLI usage\n"
        . "  65  fail-closed (schema / threshold / banned-key / evidence rejection)\n"
        . "  2   pre-existing scored entry without --replace-existing\n"
        . "  1   database / runtime failure (after rollback)\n";
    fwrite(STDOUT, $msg);
}

/**
 * @param list<string> $argv
 * @return array{
 *   verifiedActionJson: ?string,
 *   verifiedActionFile: ?string,
 *   worksheetPath: ?string,
 *   dryRun: bool,
 *   replaceExisting: bool,
 *   help: bool
 * }
 */
function applyScoringParseArgs(array $argv): array
{
    $options = [
        'verifiedActionJson' => null,
        'verifiedActionFile' => null,
        'worksheetPath' => null,
        'dryRun' => false,
        'replaceExisting' => false,
        'help' => false,
    ];

    $count = count($argv);

    for ($i = 1; $i < $count; $i++) {
        $arg = $argv[$i];

        if ($arg === '--help' || $arg === '-h') {
            $options['help'] = true;
            continue;
        }

        if ($arg === '--dry-run') {
            $options['dryRun'] = true;
            continue;
        }

        if ($arg === '--replace-existing') {
            $options['replaceExisting'] = true;
            continue;
        }

        if ($arg === '--verified-action-json') {
            $options['verifiedActionJson'] = applyScoringReadRequiredValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if ($arg === '--verified-action-file') {
            $options['verifiedActionFile'] = applyScoringReadRequiredValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if ($arg === '--worksheet-path') {
            $options['worksheetPath'] = applyScoringReadRequiredValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if (str_starts_with($arg, '--verified-action-json=')) {
            $options['verifiedActionJson'] = applyScoringReadInlineValue($arg, '--verified-action-json');
            continue;
        }

        if (str_starts_with($arg, '--verified-action-file=')) {
            $options['verifiedActionFile'] = applyScoringReadInlineValue($arg, '--verified-action-file');
            continue;
        }

        if (str_starts_with($arg, '--worksheet-path=')) {
            $options['worksheetPath'] = applyScoringReadInlineValue($arg, '--worksheet-path');
            continue;
        }

        throw new InvalidArgumentException("Unknown option {$arg}");
    }

    return $options;
}

/**
 * @param list<string> $argv
 */
function applyScoringReadRequiredValue(array $argv, int $optionIndex, string $optionName): string
{
    $valueIndex = $optionIndex + 1;

    if (!array_key_exists($valueIndex, $argv)) {
        throw new InvalidArgumentException("{$optionName} requires a value");
    }

    $value = $argv[$valueIndex];

    if (!is_string($value) || $value === '') {
        throw new InvalidArgumentException("{$optionName} requires a non-empty value");
    }

    return $value;
}

function applyScoringReadInlineValue(string $arg, string $optionName): string
{
    $value = substr($arg, strlen($optionName) + 1);

    if ($value === '' || $value === false) {
        throw new InvalidArgumentException("{$optionName} requires a non-empty value");
    }

    return $value;
}

/**
 * @param array<string, mixed> $options
 * @return array<string, mixed>
 */
function applyScoringLoadHandoff(array $options): array
{
    $sources = [
        $options['verifiedActionJson'] !== null,
        $options['verifiedActionFile'] !== null,
    ];

    $provided = count(array_filter($sources));

    if ($provided !== 1) {
        throw new LogicException(
            'Provide exactly one of --verified-action-json or --verified-action-file'
        );
    }

    if ($options['verifiedActionJson'] !== null) {
        return applyScoringDecodeJson(
            (string) $options['verifiedActionJson'],
            '--verified-action-json',
        );
    }

    $content = @file_get_contents((string) $options['verifiedActionFile']);

    if ($content === false) {
        throw new LogicException('Could not read --verified-action-file');
    }

    return applyScoringDecodeJson($content, '--verified-action-file');
}

/**
 * @return array<string, mixed>
 */
function applyScoringDecodeJson(string $json, string $label): array
{
    try {
        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new LogicException("{$label} must be valid JSON: " . $e->getMessage());
    }

    if (!is_array($decoded) || array_is_list($decoded)) {
        throw new LogicException("{$label} must be one JSON object");
    }

    return $decoded;
}

/**
 * @param array<string, mixed> $handoff
 * @param array<string, mixed> $options
 */
function applyScoringValidate(array $handoff, array $options): void
{
    if (($handoff['schemaVersion'] ?? null) !== APPLY_SCORING_SCHEMA_VERSION) {
        throw new LogicException(
            'schemaVersion must be ' . APPLY_SCORING_SCHEMA_VERSION
        );
    }

    $entrySlug = $handoff['entrySlug'] ?? null;

    if (!is_string($entrySlug) || $entrySlug === '') {
        throw new LogicException('entrySlug must be a non-empty string');
    }

    if (
        str_contains($entrySlug, '/')
        || str_contains($entrySlug, '\\')
        || str_contains($entrySlug, '..')
    ) {
        throw new LogicException("entrySlug '{$entrySlug}' contains path traversal characters");
    }

    if (!preg_match(APPLY_SCORING_SLUG_REGEX, $entrySlug)) {
        throw new LogicException("entrySlug '{$entrySlug}' is not a valid slug");
    }

    $documentPath = $handoff['documentPath'] ?? null;

    if ($documentPath !== null && !is_string($documentPath)) {
        throw new LogicException('documentPath must be a string or null');
    }

    if (is_string($documentPath) && strlen($documentPath) > APPLY_SCORING_PATH_MAX_LEN) {
        throw new LogicException(
            'documentPath exceeds ' . APPLY_SCORING_PATH_MAX_LEN . ' characters'
        );
    }

    $worksheetPath = $options['worksheetPath'] ?? null;

    if (!is_string($worksheetPath) || $worksheetPath === '') {
        throw new LogicException('--worksheet-path must be a non-empty string');
    }

    if (strlen($worksheetPath) > APPLY_SCORING_PATH_MAX_LEN) {
        throw new LogicException(
            '--worksheet-path exceeds ' . APPLY_SCORING_PATH_MAX_LEN . ' characters'
        );
    }

    applyScoringAssertNoBannedKeys($handoff, 'handoff');

    if (!isset($handoff['accepted']) || !is_array($handoff['accepted'])) {
        throw new LogicException('handoff.accepted must be an object');
    }

    $accepted = $handoff['accepted'];
    $positives = $accepted['positive_signals'] ?? null;
    $reservations = $accepted['reservations'] ?? null;

    if (!is_array($positives) || !array_is_list($positives)) {
        throw new LogicException('handoff.accepted.positive_signals must be an array');
    }

    if (!is_array($reservations) || !array_is_list($reservations)) {
        throw new LogicException('handoff.accepted.reservations must be an array');
    }

    $positiveCount = count($positives);
    $reservationCount = count($reservations);
    $totalCount = $positiveCount + $reservationCount;

    if ($positiveCount < APPLY_SCORING_MIN_POSITIVE_SIGNALS) {
        throw new LogicException(sprintf(
            'threshold not met: %d positive_signals (minimum %d required)',
            $positiveCount,
            APPLY_SCORING_MIN_POSITIVE_SIGNALS,
        ));
    }

    if ($reservationCount < APPLY_SCORING_MIN_RESERVATIONS) {
        throw new LogicException(sprintf(
            'threshold not met: %d reservations (minimum %d required)',
            $reservationCount,
            APPLY_SCORING_MIN_RESERVATIONS,
        ));
    }

    if ($totalCount < APPLY_SCORING_MIN_TOTAL_ROWS) {
        throw new LogicException(sprintf(
            'threshold not met: %d total rows (minimum %d required)',
            $totalCount,
            APPLY_SCORING_MIN_TOTAL_ROWS,
        ));
    }

    $signalKeys = [];
    foreach ($positives as $index => $entry) {
        applyScoringValidatePositiveSignal($entry, $index, $signalKeys);
    }

    $reservationKeys = [];
    foreach ($reservations as $index => $entry) {
        applyScoringValidateReservation($entry, $index, $reservationKeys);
    }

    if (
        array_key_exists('scoring_metadata', $accepted)
        && $accepted['scoring_metadata'] !== null
    ) {
        applyScoringValidateScoringMeta($accepted['scoring_metadata']);
    }
}

/**
 * @param mixed $entry
 * @param array<string, bool> $signalKeys
 */
function applyScoringValidatePositiveSignal(mixed $entry, int $index, array &$signalKeys): void
{
    if (!is_array($entry) || array_is_list($entry)) {
        throw new LogicException("accepted.positive_signals[{$index}] must be an object");
    }

    $row = $entry['row'] ?? null;

    if (!is_array($row) || array_is_list($row)) {
        throw new LogicException("accepted.positive_signals[{$index}].row must be an object");
    }

    $signalKey = $row['signal_key'] ?? null;

    if (!is_string($signalKey) || $signalKey === '' || strlen($signalKey) > APPLY_SCORING_KEY_MAX_LEN) {
        throw new LogicException("accepted.positive_signals[{$index}].row.signal_key must be a non-empty string (max 100 chars)");
    }

    if (isset($signalKeys[$signalKey])) {
        throw new LogicException("accepted.positive_signals[{$index}].row.signal_key '{$signalKey}' is duplicated");
    }
    $signalKeys[$signalKey] = true;

    $dimension = $row['dimension'] ?? null;

    if (!is_string($dimension) || !in_array($dimension, APPLY_SCORING_DIMENSIONS, true)) {
        throw new LogicException("accepted.positive_signals[{$index}].row.dimension must be one of: " . implode(',', APPLY_SCORING_DIMENSIONS));
    }

    $amount = $row['amount'] ?? null;

    if (!is_numeric($amount)) {
        throw new LogicException("accepted.positive_signals[{$index}].row.amount must be numeric");
    }

    $textEn = $row['text_en'] ?? null;

    if (!is_string($textEn) || trim($textEn) === '') {
        throw new LogicException("accepted.positive_signals[{$index}].row.text_en must be a non-empty string");
    }

    $textDe = $row['text_de'] ?? null;

    if ($textDe !== null && !is_string($textDe)) {
        throw new LogicException("accepted.positive_signals[{$index}].row.text_de must be a string or null");
    }

    $sourceUrl = $row['source_url'] ?? null;

    if (!is_string($sourceUrl) || $sourceUrl === '' || !applyScoringIsPublicHttpUrl($sourceUrl)) {
        throw new LogicException("accepted.positive_signals[{$index}].row.source_url is missing or not a public http(s) URL");
    }
}

/**
 * @param mixed $entry
 * @param array<string, bool> $reservationKeys
 */
function applyScoringValidateReservation(mixed $entry, int $index, array &$reservationKeys): void
{
    if (!is_array($entry) || array_is_list($entry)) {
        throw new LogicException("accepted.reservations[{$index}] must be an object");
    }

    $row = $entry['row'] ?? null;

    if (!is_array($row) || array_is_list($row)) {
        throw new LogicException("accepted.reservations[{$index}].row must be an object");
    }

    $resKey = $row['reservation_key'] ?? null;

    if (!is_string($resKey) || $resKey === '' || strlen($resKey) > APPLY_SCORING_KEY_MAX_LEN) {
        throw new LogicException("accepted.reservations[{$index}].row.reservation_key must be a non-empty string (max 100 chars)");
    }

    if (isset($reservationKeys[$resKey])) {
        throw new LogicException("accepted.reservations[{$index}].row.reservation_key '{$resKey}' is duplicated");
    }
    $reservationKeys[$resKey] = true;

    $severity = $row['severity'] ?? null;

    if (!is_string($severity) || !in_array($severity, APPLY_SCORING_SEVERITIES, true)) {
        throw new LogicException("accepted.reservations[{$index}].row.severity must be one of: " . implode(',', APPLY_SCORING_SEVERITIES));
    }

    $eventDate = $row['event_date'] ?? null;

    if ($eventDate !== null) {
        if (!is_string($eventDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $eventDate)) {
            throw new LogicException("accepted.reservations[{$index}].row.event_date must be YYYY-MM-DD or null");
        }
    }

    $penaltyTier = $row['penalty_tier'] ?? null;

    if ($penaltyTier !== null) {
        if (!is_string($penaltyTier) || !in_array($penaltyTier, APPLY_SCORING_DIMENSIONS, true)) {
            throw new LogicException("accepted.reservations[{$index}].row.penalty_tier must be one of: " . implode(',', APPLY_SCORING_DIMENSIONS) . ' or null');
        }
    }

    $penaltyAmount = $row['penalty_amount'] ?? null;

    if ($penaltyAmount !== null && !is_numeric($penaltyAmount)) {
        throw new LogicException("accepted.reservations[{$index}].row.penalty_amount must be numeric or null");
    }

    if (!array_key_exists('is_structural', $row)) {
        throw new LogicException("accepted.reservations[{$index}].row.is_structural is required");
    }

    $isStructural = $row['is_structural'];

    if (!is_bool($isStructural) && $isStructural !== 0 && $isStructural !== 1) {
        throw new LogicException("accepted.reservations[{$index}].row.is_structural must be a boolean");
    }

    $textEn = $row['text_en'] ?? null;

    if (!is_string($textEn) || trim($textEn) === '') {
        throw new LogicException("accepted.reservations[{$index}].row.text_en must be a non-empty string");
    }

    $textDe = $row['text_de'] ?? null;

    if ($textDe !== null && !is_string($textDe)) {
        throw new LogicException("accepted.reservations[{$index}].row.text_de must be a string or null");
    }

    $sourceUrl = $row['source_url'] ?? null;

    if (!is_string($sourceUrl) || $sourceUrl === '' || !applyScoringIsPublicHttpUrl($sourceUrl)) {
        throw new LogicException("accepted.reservations[{$index}].row.source_url is missing or not a public http(s) URL");
    }
}

function applyScoringValidateScoringMeta(mixed $meta): void
{
    if (!is_array($meta) || array_is_list($meta)) {
        throw new LogicException('accepted.scoring_metadata must be an object');
    }

    if (array_key_exists('base_class_override', $meta)) {
        $baseClass = $meta['base_class_override'];

        if (
            $baseClass !== null
            && (!is_string($baseClass) || !in_array($baseClass, APPLY_SCORING_BASE_CLASSES, true))
        ) {
            throw new LogicException(
                'accepted.scoring_metadata.base_class_override must be one of: '
                . implode(',', APPLY_SCORING_BASE_CLASSES) . ' or null'
            );
        }
    }

    if (array_key_exists('is_ad_surveillance', $meta)) {
        $isAd = $meta['is_ad_surveillance'];

        if ($isAd !== null && !is_bool($isAd) && $isAd !== 0 && $isAd !== 1) {
            throw new LogicException(
                'accepted.scoring_metadata.is_ad_surveillance must be boolean or null'
            );
        }
    }
}

function applyScoringAssertNoBannedKeys(mixed $value, string $path): void
{
    if (is_array($value)) {
        foreach ($value as $key => $child) {
            if (is_string($key) && in_array($key, APPLY_SCORING_BANNED_KEYS, true)) {
                throw new LogicException("banned trust-score key '{$key}' is forbidden in {$path}");
            }

            applyScoringAssertNoBannedKeys($child, $path . '.' . (string) $key);
        }
    }
}

function applyScoringIsPublicHttpUrl(string $url): bool
{
    $url = trim($url);

    if ($url === '') {
        return false;
    }

    if (!preg_match('#^https?://#i', $url)) {
        return false;
    }

    $parts = parse_url($url);

    if (!is_array($parts) || empty($parts['host'])) {
        return false;
    }

    $host = strtolower(trim((string) $parts['host'], '[]'));

    if ($host === '' || $host === 'localhost') {
        return false;
    }

    $isIpv4 = filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false;
    $isIpv6 = filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false;

    if ($isIpv4) {
        if (
            $host === '0.0.0.0'
            || preg_match('/^127\./', $host)
            || str_starts_with($host, '10.')
            || str_starts_with($host, '169.254.')
            || str_starts_with($host, '192.168.')
            || str_starts_with($host, '0.')
            || preg_match('/^172\.(1[6-9]|2[0-9]|3[01])\./', $host)
            || preg_match('/^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./', $host)
            || preg_match('/^198\.1[89]\./', $host)
        ) {
            return false;
        }
    } elseif ($isIpv6) {
        if (
            $host === '::1'
            || str_starts_with($host, 'fe80:')
            || str_starts_with($host, 'fd00:')
            || str_starts_with($host, 'fc00:')
            || str_starts_with($host, '::ffff:')
        ) {
            return false;
        }
    } else {
        if (
            preg_match('/^(0x[0-9a-f]+|0[0-7]+|[0-9]+)$/i', $host)
            || preg_match('/^[\d.]+$/', $host)
        ) {
            return false;
        }
    }

    return true;
}

/**
 * @param array<string, mixed> $accepted
 * @return list<array<string, mixed>>
 */
function applyScoringBuildPlan(
    string $entrySlug,
    array $accepted,
    ?string $documentPath,
    string $worksheetPath,
): array {
    $plan = [];

    foreach ($accepted['positive_signals'] as $index => $entry) {
        $row = $entry['row'];
        $plan[] = [
            'table' => 'positive_signals',
            'op' => 'insert',
            'entrySlug' => $entrySlug,
            'sort_order' => $index,
            'signal_key' => (string) $row['signal_key'],
            'dimension' => (string) $row['dimension'],
        ];
    }

    foreach ($accepted['reservations'] as $index => $entry) {
        $row = $entry['row'];
        $plan[] = [
            'table' => 'reservations',
            'op' => 'insert',
            'entrySlug' => $entrySlug,
            'sort_order' => $index,
            'reservation_key' => (string) $row['reservation_key'],
            'severity' => (string) $row['severity'],
        ];
    }

    $meta = $accepted['scoring_metadata'] ?? null;
    $baseClass = is_array($meta) ? ($meta['base_class_override'] ?? null) : null;
    $isAd = is_array($meta) ? ($meta['is_ad_surveillance'] ?? null) : null;

    $plan[] = [
        'table' => 'scoring_metadata',
        'op' => 'insert',
        'entrySlug' => $entrySlug,
        'base_class_override' => $baseClass,
        'is_ad_surveillance' => $isAd,
        'deep_research_path' => $documentPath,
        'worksheet_path' => $worksheetPath,
    ];

    return $plan;
}

/**
 * @return array<string, mixed>|null
 */
function applyScoringLockEntry(PDO $pdo, string $slug): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, slug FROM catalog_entries WHERE slug = :slug FOR UPDATE'
    );
    $stmt->execute([':slug' => $slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row === false ? null : $row;
}

function applyScoringCountRows(PDO $pdo, string $table, int $entryId): int
{
    if ($table === 'positive_signals') {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) AS c FROM positive_signals WHERE entry_id = :entry_id'
        );
    } elseif ($table === 'reservations') {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) AS c FROM reservations WHERE entry_id = :entry_id'
        );
    } else {
        throw new RuntimeException("Unsupported table for count: {$table}");
    }

    $stmt->execute([':entry_id' => $entryId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row !== false ? (int) ($row['c'] ?? 0) : 0;
}

/**
 * @return array<string, mixed>|null
 */
function applyScoringFetchMetadata(PDO $pdo, int $entryId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT entry_id FROM scoring_metadata WHERE entry_id = :entry_id'
    );
    $stmt->execute([':entry_id' => $entryId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row === false ? null : $row;
}

function applyScoringDeleteExisting(PDO $pdo, int $entryId): void
{
    $stmt = $pdo->prepare('DELETE FROM positive_signals WHERE entry_id = :entry_id');
    $stmt->execute([':entry_id' => $entryId]);

    $stmt = $pdo->prepare('DELETE FROM reservations WHERE entry_id = :entry_id');
    $stmt->execute([':entry_id' => $entryId]);

    $stmt = $pdo->prepare('DELETE FROM scoring_metadata WHERE entry_id = :entry_id');
    $stmt->execute([':entry_id' => $entryId]);
}

/**
 * @param list<array<string, mixed>> $items
 */
function applyScoringInsertPositiveSignals(PDO $pdo, int $entryId, array $items): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO positive_signals '
        . '(entry_id, signal_key, sort_order, dimension, amount, text_en, text_de, source_url) '
        . 'VALUES (:entry_id, :signal_key, :sort_order, :dimension, :amount, :text_en, :text_de, :source_url)'
    );

    foreach ($items as $index => $item) {
        $row = $item['row'];
        $textDe = $row['text_de'] ?? null;
        $stmt->execute([
            ':entry_id' => $entryId,
            ':signal_key' => (string) $row['signal_key'],
            ':sort_order' => $index,
            ':dimension' => (string) $row['dimension'],
            ':amount' => applyScoringFormatDecimal($row['amount']),
            ':text_en' => (string) $row['text_en'],
            ':text_de' => $textDe === null ? null : (string) $textDe,
            ':source_url' => (string) $row['source_url'],
        ]);
    }
}

/**
 * @param list<array<string, mixed>> $items
 */
function applyScoringInsertReservations(PDO $pdo, int $entryId, array $items): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO reservations '
        . '(entry_id, reservation_key, sort_order, severity, event_date, penalty_tier, '
        . 'penalty_amount, is_structural, text_en, text_de, source_url) '
        . 'VALUES (:entry_id, :reservation_key, :sort_order, :severity, :event_date, :penalty_tier, '
        . ':penalty_amount, :is_structural, :text_en, :text_de, :source_url)'
    );

    foreach ($items as $index => $item) {
        $row = $item['row'];
        $textDe = $row['text_de'] ?? null;
        $penaltyAmount = $row['penalty_amount'] ?? null;
        $isStructural = $row['is_structural'] ?? false;
        $stmt->execute([
            ':entry_id' => $entryId,
            ':reservation_key' => (string) $row['reservation_key'],
            ':sort_order' => $index,
            ':severity' => (string) $row['severity'],
            ':event_date' => $row['event_date'] ?? null,
            ':penalty_tier' => $row['penalty_tier'] ?? null,
            ':penalty_amount' => $penaltyAmount === null ? null : applyScoringFormatDecimal($penaltyAmount),
            ':is_structural' => (int) (bool) $isStructural,
            ':text_en' => (string) $row['text_en'],
            ':text_de' => $textDe === null ? null : (string) $textDe,
            ':source_url' => (string) $row['source_url'],
        ]);
    }
}

function applyScoringInsertMetadata(
    PDO $pdo,
    int $entryId,
    mixed $meta,
    ?string $documentPath,
    string $worksheetPath,
): void {
    $baseClass = null;
    $isAd = null;

    if (is_array($meta)) {
        $rawBase = $meta['base_class_override'] ?? null;
        if (is_string($rawBase) && $rawBase !== '') {
            $baseClass = $rawBase;
        }

        $rawAd = $meta['is_ad_surveillance'] ?? null;
        if (is_bool($rawAd)) {
            $isAd = $rawAd ? 1 : 0;
        } elseif ($rawAd === 0 || $rawAd === 1) {
            $isAd = (int) $rawAd;
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO scoring_metadata '
        . '(entry_id, base_class_override, is_ad_surveillance, deep_research_path, worksheet_path) '
        . 'VALUES (:entry_id, :base_class_override, :is_ad_surveillance, :deep_research_path, :worksheet_path)'
    );
    $stmt->execute([
        ':entry_id' => $entryId,
        ':base_class_override' => $baseClass,
        ':is_ad_surveillance' => $isAd,
        ':deep_research_path' => $documentPath,
        ':worksheet_path' => $worksheetPath,
    ]);
}

function applyScoringFormatDecimal(mixed $value): string
{
    return number_format((float) $value, 2, '.', '');
}

/**
 * @param list<array<string, mixed>> $plan
 */
function applyScoringLogAudit(string $entrySlug, array $plan, bool $replacedExisting): void
{
    $signalCount = 0;
    $reservationCount = 0;

    foreach ($plan as $step) {
        $table = (string) ($step['table'] ?? '');
        if ($table === 'positive_signals') {
            $signalCount++;
        } elseif ($table === 'reservations') {
            $reservationCount++;
        }
    }

    $action = $replacedExisting ? 'replaced' : 'inserted';
    logAdminMessage(
        "euroalt-admin: deep-research-scoring slug={$entrySlug} action={$action} "
        . "positive_signals={$signalCount} reservations={$reservationCount}"
    );
}

/**
 * @param array<string, mixed> $outcome
 */
function applyScoringEmitOutcome(array $outcome): void
{
    echo json_encode(
        $outcome,
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
    ) . "\n";
}
