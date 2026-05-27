<?php
declare(strict_types=1);

/**
 * Apply a verified catalog_fact_correction action to the database.
 *
 * Stage 4 of the Codex pipeline. Consumes the `verified_action` JSON
 * produced by `scripts/verify-fact-codex-run.mjs` (stage 3) and applies
 * allowlisted catalog mutations inside a single transaction.
 *
 * Usage:
 *   php scripts/apply-verified-action.php --verified-action-json <json> [--dry-run]
 *   php scripts/apply-verified-action.php --verified-action-file <path> [--dry-run]
 *   php scripts/apply-verified-action.php --verified-action-json-stdin   [--dry-run]
 *
 * Exit codes:
 *   0  Applied (or dry-run plan emitted).
 *   64 Invalid CLI usage.
 *   65 Fail-closed: payload/schema/allowlist/banned-key/evidence/openness rejection.
 *   1  Database / runtime failure (after rollback).
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

const APPLY_INVALID_USAGE = 64;
const APPLY_FAIL_CLOSED = 65;

const APPLY_ALLOWED_TABLES = [
    'catalog_entries',
    'entry_categories',
    'entry_tags',
    'entry_replacements',
    'us_vendor_aliases',
];

const APPLY_CATALOG_COLUMNS = [
    'description_en',
    'description_de',
    'country_code',
    'website_url',
    'pricing',
    'is_open_source',
    'open_source_level',
    'source_code_url',
    'self_hostable',
    'founded_year',
    'headquarters_city',
    'license_text',
];

const APPLY_BANNED_KEYS = [
    'trustScore',
    'trust_score',
    'trustScoreStatus',
    'trust_score_status',
    'reservations',
    'reservation',
    'positiveSignals',
    'positive_signals',
    'positive_signal',
    'scoringMetadata',
    'scoring_metadata',
    'baseClassOverride',
    'base_class_override',
    'isAdSurveillance',
    'is_ad_surveillance',
    'worksheetPath',
    'worksheet_path',
    'deepResearchPath',
    'deep_research_path',
];

const APPLY_PRICING_VALUES = ['free', 'freemium', 'paid'];
const APPLY_OPEN_SOURCE_LEVELS = ['full', 'partial', 'none'];

const APPLY_ENTRY_CATEGORIES_OPS = ['insert', 'delete', 'set_primary'];
const APPLY_ENTRY_TAGS_OPS = ['insert', 'delete'];
const APPLY_ENTRY_REPLACEMENTS_OPS = ['insert', 'delete'];
const APPLY_US_VENDOR_ALIASES_OPS = ['insert'];

const APPLY_TAG_SLUG_REGEX = '/^[a-z0-9]([a-z0-9-]{0,98}[a-z0-9])?$/u';

const APPLY_DESCRIPTION_MAX = 4096;
const APPLY_LICENSE_TEXT_MAX = 16384;
const APPLY_TAGS_PER_ENTRY_MAX = 20;

try {
    runApplyVerifiedAction($argv);
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    exit(1);
}

/**
 * @param list<string> $argv
 */
function runApplyVerifiedAction(array $argv): never
{
    try {
        $options = applyVerifiedActionParseArgs($argv);
    } catch (InvalidArgumentException $e) {
        fwrite(STDERR, 'Invalid usage: ' . $e->getMessage() . "\n");
        exit(APPLY_INVALID_USAGE);
    }

    if ($options['help'] === true) {
        applyVerifiedActionPrintUsage();
        exit(0);
    }

    try {
        $payload = applyVerifiedActionLoadPayload($options);
        applyVerifiedActionValidatePayload($payload);
        $plan = applyVerifiedActionBuildPlan($payload);
    } catch (LogicException $e) {
        fwrite(STDERR, 'fail-closed: ' . $e->getMessage() . "\n");
        exit(APPLY_FAIL_CLOSED);
    }

    $issueNumber = is_int($payload['issueNumber'] ?? null) ? (int) $payload['issueNumber'] : null;
    $targetSlug = (string) $payload['factCorrection']['targetEntrySlug'];
    $payloadDryRun = ($payload['dryRun'] ?? false) === true;
    $dryRun = ($options['dryRun'] === true) || $payloadDryRun;
    $sources = applyVerifiedActionSources($payload);

    if ($dryRun) {
        $outcome = [
            'ok' => true,
            'issueNumber' => $issueNumber,
            'targetEntrySlug' => $targetSlug,
            'dryRun' => true,
            'plan' => $plan,
            'changesApplied' => $plan,
            'sources' => $sources,
        ];
        applyVerifiedActionEmitOutcome($outcome);
        exit(0);
    }

    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();
    $applied = [];

    try {
        $entryRow = applyVerifiedActionLockEntry($pdo, $targetSlug);

        if ($entryRow === null) {
            throw new RuntimeException("targetEntrySlug '{$targetSlug}' not found in catalog_entries");
        }

        $entryId = (int) $entryRow['id'];
        applyVerifiedActionAssertOpennessAgainstRow($plan, $entryRow);
        $applied = applyVerifiedActionExecutePlan(
            $pdo,
            $entryId,
            $plan,
            $issueNumber,
            $targetSlug,
        );
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        $outcome = [
            'ok' => false,
            'issueNumber' => $issueNumber,
            'targetEntrySlug' => $targetSlug,
            'dryRun' => false,
            'rolledBack' => true,
            'error' => $e->getMessage(),
        ];
        applyVerifiedActionEmitOutcome($outcome);
        exit(1);
    }

    invalidateCache();

    $outcome = [
        'ok' => true,
        'issueNumber' => $issueNumber,
        'targetEntrySlug' => $targetSlug,
        'dryRun' => false,
        'changesApplied' => $applied,
        'sources' => $sources,
    ];
    applyVerifiedActionEmitOutcome($outcome);
    exit(0);
}

function applyVerifiedActionPrintUsage(): void
{
    fwrite(STDOUT, <<<TEXT
Usage:
  php scripts/apply-verified-action.php --verified-action-json <json> [--dry-run]
  php scripts/apply-verified-action.php --verified-action-file <path> [--dry-run]
  php scripts/apply-verified-action.php --verified-action-json-stdin   [--dry-run]

Exit codes:
  0   applied (or dry-run plan emitted)
  64  invalid CLI usage
  65  fail-closed (schema / allowlist / banned-key / evidence / openness)
  1   database / runtime failure (after rollback)

TEXT);
}

/**
 * @param list<string> $argv
 * @return array{
 *   verifiedActionJson: ?string,
 *   verifiedActionFile: ?string,
 *   verifiedActionStdin: bool,
 *   dryRun: bool,
 *   help: bool
 * }
 */
function applyVerifiedActionParseArgs(array $argv): array
{
    $options = [
        'verifiedActionJson' => null,
        'verifiedActionFile' => null,
        'verifiedActionStdin' => false,
        'dryRun' => false,
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

        if ($arg === '--verified-action-json-stdin') {
            $options['verifiedActionStdin'] = true;
            continue;
        }

        if ($arg === '--verified-action-json') {
            $options['verifiedActionJson'] = applyVerifiedActionReadRequiredValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if ($arg === '--verified-action-file') {
            $options['verifiedActionFile'] = applyVerifiedActionReadRequiredValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if (str_starts_with($arg, '--verified-action-json=')) {
            $options['verifiedActionJson'] = applyVerifiedActionReadInlineValue($arg, '--verified-action-json');
            continue;
        }

        if (str_starts_with($arg, '--verified-action-file=')) {
            $options['verifiedActionFile'] = applyVerifiedActionReadInlineValue($arg, '--verified-action-file');
            continue;
        }

        throw new InvalidArgumentException("Unknown option {$arg}");
    }

    return $options;
}

/**
 * @param list<string> $argv
 */
function applyVerifiedActionReadRequiredValue(array $argv, int $optionIndex, string $optionName): string
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

function applyVerifiedActionReadInlineValue(string $arg, string $optionName): string
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
function applyVerifiedActionLoadPayload(array $options): array
{
    $sources = [
        $options['verifiedActionJson'] !== null,
        $options['verifiedActionFile'] !== null,
        $options['verifiedActionStdin'] === true,
    ];

    $provided = count(array_filter($sources));

    if ($provided !== 1) {
        throw new LogicException('Provide exactly one of --verified-action-json, --verified-action-file, --verified-action-json-stdin');
    }

    if ($options['verifiedActionJson'] !== null) {
        return applyVerifiedActionDecodeJson((string) $options['verifiedActionJson'], '--verified-action-json');
    }

    if ($options['verifiedActionFile'] !== null) {
        $content = @file_get_contents((string) $options['verifiedActionFile']);

        if ($content === false) {
            throw new LogicException('Could not read --verified-action-file');
        }

        return applyVerifiedActionDecodeJson($content, '--verified-action-file');
    }

    $stdin = file_get_contents('php://stdin');

    if (!is_string($stdin) || $stdin === '') {
        throw new LogicException('--verified-action-json-stdin received empty payload');
    }

    return applyVerifiedActionDecodeJson($stdin, '--verified-action-json-stdin');
}

/**
 * @return array<string, mixed>
 */
function applyVerifiedActionDecodeJson(string $json, string $label): array
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
 * @param array<string, mixed> $payload
 */
function applyVerifiedActionValidatePayload(array $payload): void
{
    $action = $payload['action'] ?? null;

    if ($action !== 'catalog_fact_correction') {
        throw new LogicException(
            "unsupported action " . json_encode($action) . " (only catalog_fact_correction is supported; new_alternative goes through api/admin/add-alternative.php)"
        );
    }

    applyVerifiedActionAssertNoBannedKeys($payload, 'verified_action');

    $factCorrection = $payload['factCorrection'] ?? null;

    if (!is_array($factCorrection) || array_is_list($factCorrection)) {
        throw new LogicException('factCorrection must be one JSON object');
    }

    $targetSlug = $factCorrection['targetEntrySlug'] ?? null;

    if (!is_string($targetSlug) || trim($targetSlug) === '') {
        throw new LogicException('factCorrection.targetEntrySlug must be a non-empty string');
    }

    $changes = $factCorrection['changes'] ?? null;

    if (!is_array($changes) || !array_is_list($changes) || count($changes) === 0) {
        throw new LogicException('factCorrection.changes must be a non-empty array');
    }

    $evidence = $payload['verifierEvidence'] ?? null;

    if (!is_array($evidence) || !array_is_list($evidence)) {
        throw new LogicException('verifierEvidence must be an array');
    }

    if (count($evidence) !== count($changes)) {
        throw new LogicException(
            sprintf(
                'verifierEvidence coverage mismatch: %d evidence record(s) for %d change(s)',
                count($evidence),
                count($changes),
            )
        );
    }

    foreach ($changes as $index => $change) {
        applyVerifiedActionValidateChange($change, $index);
    }

    foreach ($evidence as $index => $record) {
        applyVerifiedActionValidateEvidence($record, $index);
    }

    applyVerifiedActionAssertOpennessFromPayload($changes);
}

/**
 * @param array<string, mixed>|mixed $change
 */
function applyVerifiedActionValidateChange(mixed $change, int $index): void
{
    if (!is_array($change) || array_is_list($change)) {
        throw new LogicException("changes[{$index}] must be one JSON object");
    }

    $table = $change['table'] ?? null;

    if (!is_string($table) || !in_array($table, APPLY_ALLOWED_TABLES, true)) {
        throw new LogicException(
            "changes[{$index}].table " . json_encode($table) . " is not in the allowlist (allowed: " . implode(', ', APPLY_ALLOWED_TABLES) . ')'
        );
    }

    $source = $change['source'] ?? null;

    if (!is_array($source) || array_is_list($source)) {
        throw new LogicException("changes[{$index}].source must be one JSON object");
    }

    $sourceUrl = $source['url'] ?? null;

    if (!is_string($sourceUrl) || !applyVerifiedActionIsPublicHttpUrl($sourceUrl)) {
        throw new LogicException("changes[{$index}].source.url must be a public http(s) URL");
    }

    if ($table === 'catalog_entries') {
        $column = $change['column'] ?? null;

        if (!is_string($column) || !in_array($column, APPLY_CATALOG_COLUMNS, true)) {
            throw new LogicException(
                "changes[{$index}].column " . json_encode($column) . " is not allowed for catalog_entries (allowed: " . implode(', ', APPLY_CATALOG_COLUMNS) . ')'
            );
        }

        applyVerifiedActionValidateCatalogValue($column, $change['proposedValue'] ?? null, $index);
        return;
    }

    $op = $change['op'] ?? null;
    $allowedOps = applyVerifiedActionAllowedOpsForTable($table);

    if (!is_string($op) || !in_array($op, $allowedOps, true)) {
        throw new LogicException(
            "changes[{$index}].op " . json_encode($op) . " is not allowed for table {$table} (allowed: " . implode(', ', $allowedOps) . ')'
        );
    }

    $proposed = $change['proposedValue'] ?? null;

    if ($table === 'entry_tags') {
        if (!is_string($proposed) || trim($proposed) === '') {
            throw new LogicException("changes[{$index}].proposedValue must be a non-empty tag slug string");
        }

        if (!preg_match(APPLY_TAG_SLUG_REGEX, $proposed)) {
            throw new LogicException("changes[{$index}].proposedValue is not a valid tag slug ('{$proposed}'); tag slugs must match " . APPLY_TAG_SLUG_REGEX);
        }
        return;
    }

    if ($table === 'entry_categories') {
        if (!is_string($proposed) || trim($proposed) === '') {
            throw new LogicException("changes[{$index}].proposedValue must be a non-empty category id string");
        }
        return;
    }

    if ($table === 'entry_replacements') {
        if (!is_string($proposed) || trim($proposed) === '') {
            throw new LogicException("changes[{$index}].proposedValue must be a non-empty US vendor name string");
        }
        return;
    }

    if ($table === 'us_vendor_aliases') {
        if (!is_array($proposed) || array_is_list($proposed)) {
            throw new LogicException("changes[{$index}].proposedValue must be an object with alias + entrySlug");
        }
        $alias = $proposed['alias'] ?? null;
        $entrySlug = $proposed['entrySlug'] ?? ($proposed['targetEntrySlug'] ?? null);
        if (!is_string($alias) || trim($alias) === '') {
            throw new LogicException("changes[{$index}].proposedValue.alias must be a non-empty string");
        }
        if (!is_string($entrySlug) || trim($entrySlug) === '') {
            throw new LogicException("changes[{$index}].proposedValue.entrySlug must be a non-empty string");
        }
        return;
    }
}

/**
 * @return list<string>
 */
function applyVerifiedActionAllowedOpsForTable(string $table): array
{
    if ($table === 'entry_categories') {
        return APPLY_ENTRY_CATEGORIES_OPS;
    }
    if ($table === 'entry_tags') {
        return APPLY_ENTRY_TAGS_OPS;
    }
    if ($table === 'entry_replacements') {
        return APPLY_ENTRY_REPLACEMENTS_OPS;
    }
    if ($table === 'us_vendor_aliases') {
        return APPLY_US_VENDOR_ALIASES_OPS;
    }

    return [];
}

function applyVerifiedActionValidateCatalogValue(string $column, mixed $value, int $index): void
{
    $label = "changes[{$index}].proposedValue";

    if ($column === 'description_en' || $column === 'description_de') {
        if ($value !== null && !is_string($value)) {
            throw new LogicException("{$label} for {$column} must be a string or null");
        }
        if (is_string($value) && strlen($value) > APPLY_DESCRIPTION_MAX) {
            throw new LogicException("{$label} for {$column} exceeds " . APPLY_DESCRIPTION_MAX . ' bytes');
        }
        return;
    }

    if ($column === 'country_code') {
        if (!is_string($value) || !preg_match('/^[a-z]{2,5}$/', $value)) {
            throw new LogicException("{$label} for country_code must be a 2-5 letter lowercase code");
        }
        return;
    }

    if ($column === 'website_url' || $column === 'source_code_url') {
        if ($value === null) {
            if ($column === 'website_url') {
                throw new LogicException("{$label} for website_url must not be null");
            }
            return;
        }

        if (!is_string($value) || !applyVerifiedActionIsPublicHttpUrl($value)) {
            throw new LogicException("{$label} for {$column} must be a public http(s) URL");
        }
        return;
    }

    if ($column === 'pricing') {
        if ($value !== null && !in_array($value, APPLY_PRICING_VALUES, true)) {
            throw new LogicException("{$label} for pricing must be one of " . implode(', ', APPLY_PRICING_VALUES) . ' or null');
        }
        return;
    }

    if ($column === 'is_open_source' || $column === 'self_hostable') {
        if ($value !== null && !is_bool($value) && $value !== 0 && $value !== 1) {
            throw new LogicException("{$label} for {$column} must be boolean or null");
        }
        return;
    }

    if ($column === 'open_source_level') {
        if ($value !== null && !in_array($value, APPLY_OPEN_SOURCE_LEVELS, true)) {
            throw new LogicException("{$label} for open_source_level must be one of " . implode(', ', APPLY_OPEN_SOURCE_LEVELS) . ' or null');
        }
        return;
    }

    if ($column === 'founded_year') {
        if ($value !== null && (!is_int($value) || $value < 1900 || $value > ((int) date('Y')) + 1)) {
            throw new LogicException("{$label} for founded_year must be between 1900 and next year");
        }
        return;
    }

    if ($column === 'headquarters_city') {
        if ($value !== null && (!is_string($value) || strlen($value) > 200)) {
            throw new LogicException("{$label} for headquarters_city must be a string up to 200 chars or null");
        }
        return;
    }

    if ($column === 'license_text') {
        if ($value !== null && (!is_string($value) || strlen($value) > APPLY_LICENSE_TEXT_MAX)) {
            throw new LogicException("{$label} for license_text must be a string up to " . APPLY_LICENSE_TEXT_MAX . ' bytes or null');
        }
        return;
    }
}

/**
 * @param array<string, mixed>|mixed $record
 */
function applyVerifiedActionValidateEvidence(mixed $record, int $index): void
{
    if (!is_array($record) || array_is_list($record)) {
        throw new LogicException("verifierEvidence[{$index}] must be one JSON object");
    }

    $verdict = $record['verdict'] ?? null;

    if ($verdict !== 'supports') {
        throw new LogicException(
            "verifierEvidence[{$index}].verdict must be \"supports\" (got " . json_encode($verdict) . '); coverage rejected'
        );
    }

    $sourceUrl = $record['sourceUrl'] ?? null;

    if (!is_string($sourceUrl) || !applyVerifiedActionIsPublicHttpUrl($sourceUrl)) {
        throw new LogicException("verifierEvidence[{$index}].sourceUrl must be a public http(s) URL");
    }
}

/**
 * @param list<array<string, mixed>> $changes
 */
function applyVerifiedActionAssertOpennessFromPayload(array $changes): void
{
    $isOpenSource = null;
    $openSourceLevel = null;
    $hasIs = false;
    $hasLevel = false;

    foreach ($changes as $change) {
        if (($change['table'] ?? null) !== 'catalog_entries') {
            continue;
        }
        $column = $change['column'] ?? null;
        $value = $change['proposedValue'] ?? null;

        if ($column === 'is_open_source') {
            $hasIs = true;
            $isOpenSource = is_bool($value) ? $value : ($value === 1 ? true : ($value === 0 ? false : null));
        }

        if ($column === 'open_source_level') {
            $hasLevel = true;
            $openSourceLevel = $value;
        }
    }

    if (!$hasIs && !$hasLevel) {
        return;
    }

    if ($hasIs && $hasLevel) {
        $valid =
            ($isOpenSource === null && $openSourceLevel === null) ||
            ($isOpenSource === false && $openSourceLevel === 'none') ||
            ($isOpenSource === true && in_array($openSourceLevel, ['full', 'partial'], true));

        if (!$valid) {
            throw new LogicException(
                'inconsistent openness pair: is_open_source=' . json_encode($isOpenSource) . ', open_source_level=' . json_encode($openSourceLevel)
            );
        }
    }
}

/**
 * @param list<array<string, mixed>> $plan
 * @param array<string, mixed> $entryRow
 */
function applyVerifiedActionAssertOpennessAgainstRow(array $plan, array $entryRow): void
{
    $newIs = $entryRow['is_open_source'] ?? null;
    if ($newIs !== null) {
        $newIs = (int) $newIs === 1;
    }
    $newLevel = $entryRow['open_source_level'] ?? null;

    foreach ($plan as $step) {
        if (($step['table'] ?? null) !== 'catalog_entries') {
            continue;
        }
        $column = $step['column'] ?? null;
        $value = $step['proposedValue'] ?? null;

        if ($column === 'is_open_source') {
            $newIs = is_bool($value)
                ? $value
                : ($value === 1 ? true : ($value === 0 ? false : null));
        }
        if ($column === 'open_source_level') {
            $newLevel = $value;
        }
    }

    $valid =
        ($newIs === null && $newLevel === null) ||
        ($newIs === false && $newLevel === 'none') ||
        ($newIs === true && in_array($newLevel, ['full', 'partial'], true));

    if (!$valid) {
        throw new RuntimeException(
            'openness invariant violation after applying changes: is_open_source=' . json_encode($newIs) . ', open_source_level=' . json_encode($newLevel)
        );
    }
}

/**
 * @param mixed $value
 */
function applyVerifiedActionAssertNoBannedKeys(mixed $value, string $path): void
{
    if (is_array($value)) {
        foreach ($value as $key => $child) {
            if (is_string($key) && in_array($key, APPLY_BANNED_KEYS, true)) {
                throw new LogicException("banned key '{$key}' is forbidden in {$path}");
            }
            applyVerifiedActionAssertNoBannedKeys($child, $path . '.' . (string) $key);
        }
    }
}

function applyVerifiedActionIsPublicHttpUrl(string $url): bool
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
 * @param array<string, mixed> $payload
 * @return list<array<string, mixed>>
 */
function applyVerifiedActionBuildPlan(array $payload): array
{
    $plan = [];
    $changes = $payload['factCorrection']['changes'];
    $evidence = $payload['verifierEvidence'] ?? [];

    foreach ($changes as $index => $change) {
        $step = [
            'index' => $index,
            'table' => $change['table'],
            'op' => $change['table'] === 'catalog_entries' ? 'update' : ($change['op'] ?? 'update'),
            'proposedValue' => $change['proposedValue'] ?? null,
            'source' => $change['source'] ?? null,
        ];

        if ($change['table'] === 'catalog_entries') {
            $step['column'] = $change['column'];
            if (array_key_exists('currentValue', $change)) {
                $step['currentValue'] = $change['currentValue'];
            }
        }

        if (isset($evidence[$index]) && is_array($evidence[$index])) {
            $step['evidence'] = $evidence[$index];
        }

        $plan[] = $step;
    }

    return $plan;
}

/**
 * @param array<string, mixed> $payload
 * @return list<array<string, mixed>>
 */
function applyVerifiedActionSources(array $payload): array
{
    $evidence = $payload['verifierEvidence'] ?? [];

    if (!is_array($evidence) || !array_is_list($evidence)) {
        return [];
    }

    return $evidence;
}

/**
 * @return array<string, mixed>|null
 */
function applyVerifiedActionLockEntry(PDO $pdo, string $slug): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, slug, name, status, is_open_source, open_source_level
         FROM catalog_entries
         WHERE slug = :slug
         FOR UPDATE'
    );
    $stmt->execute([':slug' => $slug]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row === false ? null : $row;
}

/**
 * @param list<array<string, mixed>> $plan
 * @return list<array<string, mixed>>
 */
function applyVerifiedActionExecutePlan(
    PDO $pdo,
    int $entryId,
    array $plan,
    ?int $issueNumber,
    string $targetSlug,
): array {
    $applied = [];

    foreach ($plan as $step) {
        $table = (string) $step['table'];

        if ($table === 'catalog_entries') {
            $appliedStep = applyVerifiedActionApplyCatalogUpdate($pdo, $entryId, $step);
        } elseif ($table === 'entry_categories') {
            $appliedStep = applyVerifiedActionApplyEntryCategoryStep($pdo, $entryId, $step);
        } elseif ($table === 'entry_tags') {
            $appliedStep = applyVerifiedActionApplyEntryTagStep($pdo, $entryId, $step);
        } elseif ($table === 'entry_replacements') {
            $appliedStep = applyVerifiedActionApplyEntryReplacementStep($pdo, $entryId, $step);
        } elseif ($table === 'us_vendor_aliases') {
            $appliedStep = applyVerifiedActionApplyUsVendorAliasStep($pdo, $step);
        } else {
            throw new RuntimeException("Unknown table '{$table}' in plan step");
        }

        applyVerifiedActionLogAudit($issueNumber, $targetSlug, $appliedStep);
        $applied[] = $appliedStep;
    }

    return $applied;
}

/**
 * @param array<string, mixed> $step
 * @return array<string, mixed>
 */
function applyVerifiedActionApplyCatalogUpdate(PDO $pdo, int $entryId, array $step): array
{
    $column = (string) $step['column'];
    $value = applyVerifiedActionNormalizeCatalogValue($column, $step['proposedValue'] ?? null);
    $sql = "UPDATE catalog_entries SET {$column} = :{$column} WHERE id = :entry_id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ":{$column}" => $value,
        ':entry_id' => $entryId,
    ]);

    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException("UPDATE catalog_entries affected {$stmt->rowCount()} rows (expected 1)");
    }

    return [
        'table' => 'catalog_entries',
        'op' => 'update',
        'column' => $column,
        'entry_id' => $entryId,
        'proposedValue' => $value,
        'applied' => true,
    ];
}

function applyVerifiedActionNormalizeCatalogValue(string $column, mixed $value): mixed
{
    if ($column === 'is_open_source' || $column === 'self_hostable') {
        if ($value === null) {
            return null;
        }
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }
        return ((int) $value) === 1 ? 1 : 0;
    }

    return $value;
}

/**
 * @param array<string, mixed> $step
 * @return array<string, mixed>
 */
function applyVerifiedActionApplyEntryCategoryStep(PDO $pdo, int $entryId, array $step): array
{
    $op = (string) $step['op'];
    $categoryId = (string) $step['proposedValue'];

    if ($op === 'insert') {
        $stmt = $pdo->prepare(
            'INSERT INTO entry_categories (entry_id, category_id, is_primary, sort_order)
             VALUES (:entry_id, :category_id, :is_primary, :sort_order)'
        );
        $stmt->execute([
            ':entry_id' => $entryId,
            ':category_id' => $categoryId,
            ':is_primary' => 0,
            ':sort_order' => 0,
        ]);
    } elseif ($op === 'delete') {
        $stmt = $pdo->prepare(
            'DELETE FROM entry_categories WHERE entry_id = :entry_id AND category_id = :category_id'
        );
        $stmt->execute([
            ':entry_id' => $entryId,
            ':category_id' => $categoryId,
        ]);
    } elseif ($op === 'set_primary') {
        // Demote all categories on the entry first so the uq_primary unique
        // constraint on the generated primary_entry_id column never sees two
        // primary rows at once. Rows that were already non-primary stay 0.
        $demote = $pdo->prepare(
            'UPDATE entry_categories
             SET is_primary = :is_primary
             WHERE entry_id = :entry_id'
        );
        $demote->execute([
            ':is_primary' => 0,
            ':entry_id' => $entryId,
        ]);

        $promote = $pdo->prepare(
            'UPDATE entry_categories
             SET is_primary = :is_primary
             WHERE entry_id = :entry_id AND category_id = :category_id'
        );
        $promote->execute([
            ':is_primary' => 1,
            ':entry_id' => $entryId,
            ':category_id' => $categoryId,
        ]);
    } else {
        throw new RuntimeException("Unsupported entry_categories op '{$op}'");
    }

    return [
        'table' => 'entry_categories',
        'op' => $op,
        'entry_id' => $entryId,
        'category_id' => $categoryId,
        'applied' => true,
    ];
}

/**
 * @param array<string, mixed> $step
 * @return array<string, mixed>
 */
function applyVerifiedActionApplyEntryTagStep(PDO $pdo, int $entryId, array $step): array
{
    $op = (string) $step['op'];
    $tagSlug = (string) $step['proposedValue'];

    if ($op === 'insert') {
        $tagId = applyVerifiedActionResolveOrCreateTagId($pdo, $tagSlug);

        $countStmt = $pdo->prepare('SELECT COUNT(*) AS c FROM entry_tags WHERE entry_id = :entry_id');
        $countStmt->execute([':entry_id' => $entryId]);
        $countRow = $countStmt->fetch(PDO::FETCH_ASSOC);
        $existing = $countRow !== false ? (int) ($countRow['c'] ?? 0) : 0;

        if ($existing >= APPLY_TAGS_PER_ENTRY_MAX) {
            throw new RuntimeException(
                "entry already has {$existing} tags (max " . APPLY_TAGS_PER_ENTRY_MAX . ')'
            );
        }

        $nextStmt = $pdo->prepare(
            'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM entry_tags WHERE entry_id = :entry_id'
        );
        $nextStmt->execute([':entry_id' => $entryId]);
        $nextRow = $nextStmt->fetch(PDO::FETCH_ASSOC);
        $nextSortOrder = $nextRow !== false ? (int) ($nextRow['next'] ?? 0) : 0;

        $stmt = $pdo->prepare(
            'INSERT INTO entry_tags (entry_id, tag_id, sort_order)
             VALUES (:entry_id, :tag_id, :sort_order)'
        );
        $stmt->execute([
            ':entry_id' => $entryId,
            ':tag_id' => $tagId,
            ':sort_order' => $nextSortOrder,
        ]);

        return [
            'table' => 'entry_tags',
            'op' => 'insert',
            'entry_id' => $entryId,
            'tag_id' => $tagId,
            'tag_slug' => $tagSlug,
            'applied' => true,
        ];
    }

    if ($op === 'delete') {
        $tagStmt = $pdo->prepare('SELECT id FROM tags WHERE slug = :slug');
        $tagStmt->execute([':slug' => $tagSlug]);
        $tagRow = $tagStmt->fetch(PDO::FETCH_ASSOC);

        if ($tagRow === false) {
            throw new RuntimeException("Tag slug '{$tagSlug}' does not exist");
        }

        $tagId = (int) $tagRow['id'];

        $stmt = $pdo->prepare(
            'DELETE FROM entry_tags WHERE entry_id = :entry_id AND tag_id = :tag_id'
        );
        $stmt->execute([
            ':entry_id' => $entryId,
            ':tag_id' => $tagId,
        ]);

        return [
            'table' => 'entry_tags',
            'op' => 'delete',
            'entry_id' => $entryId,
            'tag_id' => $tagId,
            'tag_slug' => $tagSlug,
            'applied' => true,
        ];
    }

    throw new RuntimeException("Unsupported entry_tags op '{$op}'");
}

function applyVerifiedActionResolveOrCreateTagId(PDO $pdo, string $tagSlug): int
{
    $tagStmt = $pdo->prepare('SELECT id FROM tags WHERE slug = :slug');
    $tagStmt->execute([':slug' => $tagSlug]);
    $row = $tagStmt->fetch(PDO::FETCH_ASSOC);

    if ($row !== false) {
        return (int) $row['id'];
    }

    $insert = $pdo->prepare('INSERT INTO tags (slug) VALUES (:slug)');
    $insert->execute([':slug' => $tagSlug]);

    return (int) $pdo->lastInsertId();
}

/**
 * @param array<string, mixed> $step
 * @return array<string, mixed>
 */
function applyVerifiedActionApplyEntryReplacementStep(PDO $pdo, int $entryId, array $step): array
{
    $op = (string) $step['op'];
    $rawName = (string) $step['proposedValue'];
    $autoCreated = null;

    if ($op === 'insert') {
        $resolveStmt = $pdo->prepare(
            'SELECT id FROM catalog_entries WHERE name = :name AND status = :status LIMIT 1'
        );
        $resolveStmt->execute([':name' => $rawName, ':status' => 'us']);
        $usRow = $resolveStmt->fetch(PDO::FETCH_ASSOC);
        $replacedEntryId = $usRow !== false ? (int) $usRow['id'] : null;

        if ($replacedEntryId === null) {
            $aliasStmt = $pdo->prepare(
                'SELECT entry_id FROM us_vendor_aliases WHERE alias = :alias LIMIT 1'
            );
            $aliasStmt->execute([':alias' => $rawName]);
            $aliasRow = $aliasStmt->fetch(PDO::FETCH_ASSOC);
            $replacedEntryId = $aliasRow !== false ? (int) $aliasRow['entry_id'] : null;
        }

        if ($replacedEntryId === null) {
            $vendorSlug = strtolower(trim((string) preg_replace('/[^a-z0-9]+/i', '-', $rawName), '-'));

            if ($vendorSlug === '') {
                throw new RuntimeException("Cannot derive vendor slug from '{$rawName}'");
            }

            $createVendor = $pdo->prepare(
                'INSERT INTO catalog_entries (slug, name, status, country_code, is_active, source_file)
                 VALUES (:slug, :name, :status, :country_code, :is_active, :source_file)'
            );
            $createVendor->execute([
                ':slug' => $vendorSlug,
                ':name' => $rawName,
                ':status' => 'us',
                ':country_code' => 'us',
                ':is_active' => 1,
                ':source_file' => 'auto',
            ]);
            $replacedEntryId = (int) $pdo->lastInsertId();

            $createAlias = $pdo->prepare(
                'INSERT IGNORE INTO us_vendor_aliases (alias, entry_id) VALUES (:alias, :entry_id)'
            );
            $createAlias->execute([
                ':alias' => $rawName,
                ':entry_id' => $replacedEntryId,
            ]);
            $autoCreated = [
                'entry_id' => $replacedEntryId,
                'slug' => $vendorSlug,
                'name' => $rawName,
            ];
        }

        $nextStmt = $pdo->prepare(
            'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM entry_replacements WHERE entry_id = :entry_id'
        );
        $nextStmt->execute([':entry_id' => $entryId]);
        $nextRow = $nextStmt->fetch(PDO::FETCH_ASSOC);
        $nextSortOrder = $nextRow !== false ? (int) ($nextRow['next'] ?? 0) : 0;

        $stmt = $pdo->prepare(
            'INSERT INTO entry_replacements (entry_id, raw_name, replaced_entry_id, sort_order)
             VALUES (:entry_id, :raw_name, :replaced_entry_id, :sort_order)'
        );
        $stmt->execute([
            ':entry_id' => $entryId,
            ':raw_name' => $rawName,
            ':replaced_entry_id' => $replacedEntryId,
            ':sort_order' => $nextSortOrder,
        ]);

        $result = [
            'table' => 'entry_replacements',
            'op' => 'insert',
            'entry_id' => $entryId,
            'raw_name' => $rawName,
            'replaced_entry_id' => $replacedEntryId,
            'applied' => true,
        ];

        if ($autoCreated !== null) {
            $result['autoCreatedUsVendor'] = $autoCreated;
        }

        return $result;
    }

    if ($op === 'delete') {
        $stmt = $pdo->prepare(
            'DELETE FROM entry_replacements WHERE entry_id = :entry_id AND raw_name = :raw_name'
        );
        $stmt->execute([
            ':entry_id' => $entryId,
            ':raw_name' => $rawName,
        ]);

        return [
            'table' => 'entry_replacements',
            'op' => 'delete',
            'entry_id' => $entryId,
            'raw_name' => $rawName,
            'applied' => true,
        ];
    }

    throw new RuntimeException("Unsupported entry_replacements op '{$op}'");
}

/**
 * @param array<string, mixed> $step
 * @return array<string, mixed>
 */
function applyVerifiedActionApplyUsVendorAliasStep(PDO $pdo, array $step): array
{
    $proposed = $step['proposedValue'];

    if (!is_array($proposed)) {
        throw new RuntimeException('us_vendor_aliases proposedValue must be an object');
    }

    $alias = (string) ($proposed['alias'] ?? '');
    $entrySlug = (string) ($proposed['entrySlug'] ?? ($proposed['targetEntrySlug'] ?? ''));

    $lookup = $pdo->prepare(
        'SELECT id, status FROM catalog_entries WHERE slug = :slug LIMIT 1'
    );
    $lookup->execute([':slug' => $entrySlug]);
    $row = $lookup->fetch(PDO::FETCH_ASSOC);

    if ($row === false) {
        throw new RuntimeException("us_vendor_aliases target entry slug '{$entrySlug}' not found");
    }

    if (($row['status'] ?? null) !== 'us') {
        throw new RuntimeException("us_vendor_aliases.entry_id must reference a status='us' catalog entry");
    }

    $vendorEntryId = (int) $row['id'];

    $stmt = $pdo->prepare(
        'INSERT INTO us_vendor_aliases (alias, entry_id) VALUES (:alias, :entry_id)'
    );
    $stmt->execute([
        ':alias' => $alias,
        ':entry_id' => $vendorEntryId,
    ]);

    return [
        'table' => 'us_vendor_aliases',
        'op' => 'insert',
        'alias' => $alias,
        'entry_id' => $vendorEntryId,
        'applied' => true,
    ];
}

/**
 * @param array<string, mixed> $applied
 */
function applyVerifiedActionLogAudit(?int $issueNumber, string $targetSlug, array $applied): void
{
    $issue = $issueNumber !== null ? (string) $issueNumber : 'unknown';
    $table = (string) ($applied['table'] ?? 'unknown');
    $op = (string) ($applied['op'] ?? 'unknown');
    $detail = '';

    if ($table === 'catalog_entries') {
        $detail = ' column=' . ((string) ($applied['column'] ?? ''));
    } elseif ($table === 'entry_tags') {
        $detail = ' tag=' . ((string) ($applied['tag_slug'] ?? ''));
    } elseif ($table === 'entry_categories') {
        $detail = ' category=' . ((string) ($applied['category_id'] ?? ''));
    } elseif ($table === 'entry_replacements') {
        $detail = ' raw_name=' . ((string) ($applied['raw_name'] ?? ''));
    } elseif ($table === 'us_vendor_aliases') {
        $detail = ' alias=' . ((string) ($applied['alias'] ?? ''));
    }

    logAdminMessage(
        "euroalt-admin: fact-correction issue={$issue} slug={$targetSlug} table={$table} op={$op}{$detail}"
    );
}

/**
 * @param array<string, mixed> $outcome
 */
function applyVerifiedActionEmitOutcome(array $outcome): void
{
    echo json_encode(
        $outcome,
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
    ) . "\n";
}
