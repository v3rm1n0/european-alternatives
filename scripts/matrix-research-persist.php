<?php
declare(strict_types=1);

/**
 * Matrix research persistence finalizer.
 *
 * Usage:
 *   php scripts/matrix-research-persist.php --attempt-json <json> [--decision-json <json>]
 *   php scripts/matrix-research-persist.php --attempt-file <path> [--decision-file <path>]
 *   php scripts/matrix-research-persist.php --attempt-json-stdin [--decision-json-stdin]
 *
 * Exit codes:
 *   0  Persisted one research attempt and settled the selected matrix fact.
 *   64 Invalid CLI usage.
 *   1  Database or runtime failure.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script must be run from the command line.';
    exit(1);
}

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/db.php';

const INVALID_USAGE = 64;

try {
    runPersistenceFinalizer($argv);
} catch (InvalidArgumentException $e) {
    stderr('Invalid usage: ' . $e->getMessage());
    stderr('Run with --help for usage.');
    exit(INVALID_USAGE);
} catch (Throwable $e) {
    stderr('Error: ' . $e->getMessage());
    exit(1);
}

/**
 * @param list<string> $argv
 */
function runPersistenceFinalizer(array $argv): never
{
    $options = parseCliArgs($argv);

    if ($options['help'] === true) {
        printUsage(STDOUT);
        exit(0);
    }

    $attempt = loadJsonInput($options, 'attempt');
    $decision = loadOptionalJsonInput($options, 'decision');
    $outcome = determinePersistenceOutcome($attempt, $decision);
    $pdo = getDatabaseConnection();

    $pdo->beginTransaction();

    try {
        $attemptId = insertMatrixFactAttempt($pdo, $attempt, $outcome['attemptStatus']);
        $verificationCount = insertMatrixFactVerifications($pdo, $attemptId, $outcome['verifications']);
        settleMatrixFact($pdo, $attempt, $attemptId, $outcome);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $e;
    }

    $payload = [
        'factId' => (int) $attempt['factId'],
        'attemptId' => $attemptId,
        'factStatus' => $outcome['factStatus'],
        'attemptStatus' => $outcome['attemptStatus'],
        'verifierRowsInserted' => $verificationCount,
        'selectedAttemptId' => $outcome['factStatus'] === 'verified' ? $attemptId : null,
    ];

    echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
    exit(0);
}

/**
 * @param list<string> $argv
 * @return array{
 *   attemptJson: ?string,
 *   attemptFile: ?string,
 *   attemptJsonStdin: bool,
 *   decisionJson: ?string,
 *   decisionFile: ?string,
 *   decisionJsonStdin: bool,
 *   help: bool
 * }
 */
function parseCliArgs(array $argv): array
{
    $options = [
        'attemptJson' => null,
        'attemptFile' => null,
        'attemptJsonStdin' => false,
        'decisionJson' => null,
        'decisionFile' => null,
        'decisionJsonStdin' => false,
        'help' => false,
    ];

    $count = count($argv);

    for ($i = 1; $i < $count; $i++) {
        $arg = $argv[$i];

        if ($arg === '--help') {
            $options['help'] = true;
            continue;
        }

        if ($arg === '--attempt-json-stdin') {
            $options['attemptJsonStdin'] = true;
            continue;
        }

        if ($arg === '--decision-json-stdin') {
            $options['decisionJsonStdin'] = true;
            continue;
        }

        if ($arg === '--attempt-json') {
            $options['attemptJson'] = readRequiredOptionValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if ($arg === '--attempt-file') {
            $options['attemptFile'] = readRequiredOptionValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if ($arg === '--decision-json') {
            $options['decisionJson'] = readRequiredOptionValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if ($arg === '--decision-file') {
            $options['decisionFile'] = readRequiredOptionValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if (str_starts_with($arg, '--attempt-json=')) {
            $options['attemptJson'] = readInlineOptionValue($arg, '--attempt-json');
            continue;
        }

        if (str_starts_with($arg, '--attempt-file=')) {
            $options['attemptFile'] = readInlineOptionValue($arg, '--attempt-file');
            continue;
        }

        if (str_starts_with($arg, '--decision-json=')) {
            $options['decisionJson'] = readInlineOptionValue($arg, '--decision-json');
            continue;
        }

        if (str_starts_with($arg, '--decision-file=')) {
            $options['decisionFile'] = readInlineOptionValue($arg, '--decision-file');
            continue;
        }

        if (str_starts_with($arg, '--')) {
            throw new InvalidArgumentException("Unknown option {$arg}");
        }

        throw new InvalidArgumentException("Unexpected positional argument {$arg}");
    }

    return $options;
}

/**
 * @param list<string> $argv
 */
function readRequiredOptionValue(array $argv, int $optionIndex, string $optionName): string
{
    $valueIndex = $optionIndex + 1;

    if (!array_key_exists($valueIndex, $argv) || str_starts_with($argv[$valueIndex], '--')) {
        throw new InvalidArgumentException("{$optionName} requires a value");
    }

    $value = trim($argv[$valueIndex]);

    if ($value === '') {
        throw new InvalidArgumentException("{$optionName} requires a non-empty value");
    }

    return $value;
}

function readInlineOptionValue(string $arg, string $optionName): string
{
    $value = trim(substr($arg, strlen($optionName) + 1));

    if ($value === '') {
        throw new InvalidArgumentException("{$optionName} requires a non-empty value");
    }

    return $value;
}

/**
 * @param resource $stream
 */
function printUsage($stream): void
{
    fwrite($stream, <<<TEXT
Usage:
  php scripts/matrix-research-persist.php --attempt-json <json> [--decision-json <json>]
  php scripts/matrix-research-persist.php --attempt-file <path> [--decision-file <path>]
  php scripts/matrix-research-persist.php --attempt-json-stdin [--decision-json-stdin]

Output:
  The persisted one-fact outcome is printed as JSON to stdout.

TEXT);
}

function stderr(string $message): void
{
    fwrite(STDERR, $message . "\n");
}

/**
 * @param array<string, mixed> $options
 * @return array<string, mixed>
 */
function loadJsonInput(array $options, string $prefix): array
{
    $jsonKey = $prefix . 'Json';
    $fileKey = $prefix . 'File';
    $stdinKey = $prefix . 'JsonStdin';
    $sources = [
        $options[$jsonKey] !== null,
        $options[$fileKey] !== null,
        $options[$stdinKey] === true,
    ];

    if (count(array_filter($sources)) !== 1) {
        throw new InvalidArgumentException("Provide exactly one {$prefix} source");
    }

    if ($options[$jsonKey] !== null) {
        return decodeJsonObject((string) $options[$jsonKey], "--{$prefix}-json");
    }

    if ($options[$fileKey] !== null) {
        $content = @file_get_contents((string) $options[$fileKey]);

        if ($content === false) {
            throw new RuntimeException("Could not read {$prefix} file");
        }

        return decodeJsonObject($content, "--{$prefix}-file");
    }

    return decodeJsonObject((string) file_get_contents('php://stdin'), "--{$prefix}-json-stdin");
}

/**
 * @param array<string, mixed> $options
 * @return array<string, mixed>|null
 */
function loadOptionalJsonInput(array $options, string $prefix): ?array
{
    $jsonKey = $prefix . 'Json';
    $fileKey = $prefix . 'File';
    $stdinKey = $prefix . 'JsonStdin';
    $sourceCount = count(array_filter([
        $options[$jsonKey] !== null,
        $options[$fileKey] !== null,
        $options[$stdinKey] === true,
    ]));

    if ($sourceCount === 0) {
        return null;
    }

    return loadJsonInput($options, $prefix);
}

/**
 * @return array<string, mixed>
 */
function decodeJsonObject(string $json, string $label): array
{
    try {
        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        throw new InvalidArgumentException("{$label} must be valid JSON: {$e->getMessage()}");
    }

    if (!is_array($decoded) || array_is_list($decoded)) {
        throw new InvalidArgumentException("{$label} must be one JSON object");
    }

    return $decoded;
}

/**
 * @param array<string, mixed> $attempt
 * @param array<string, mixed>|null $decision
 * @return array{
 *   factStatus: string,
 *   attemptStatus: string,
 *   verifications: list<array<string, mixed>>
 * }
 */
function determinePersistenceOutcome(array $attempt, ?array $decision): array
{
    validateAttemptPayload($attempt);

    if (($attempt['status'] ?? null) === 'needs-deeper-research') {
        if ($decision !== null) {
            validateDecisionPayload($decision);
            validateDecisionMatchesAttempt($decision, $attempt);
        }

        return [
            'factStatus' => 'needs-deeper-research',
            'attemptStatus' => 'needs-deeper-research',
            'verifications' => verificationsFromDecision($decision),
        ];
    }

    if (($attempt['status'] ?? null) === 'rejected') {
        if ($decision !== null) {
            validateDecisionPayload($decision);
            validateDecisionMatchesAttempt($decision, $attempt);
        }

        return [
            'factStatus' => 'rejected',
            'attemptStatus' => 'rejected',
            'verifications' => verificationsFromDecision($decision),
        ];
    }

    if ($decision === null) {
        throw new InvalidArgumentException('A verifier decision is required for pending verification attempts');
    }

    validateDecisionPayload($decision);
    validateDecisionMatchesAttempt($decision, $attempt);

    $factStatus = assertOutcomeStatus($decision['recommendedFactStatus'] ?? null, 'recommendedFactStatus');
    $attemptStatus = assertAttemptOutcomeStatus($decision['recommendedAttemptStatus'] ?? null, 'recommendedAttemptStatus');
    $verifications = verificationsFromDecision($decision);

    if ($factStatus === 'verified') {
        if ($attemptStatus !== 'accepted') {
            throw new InvalidArgumentException('Verified facts require an accepted attempt outcome');
        }

        validateAcceptedVerifierDecision($decision, $verifications);

        return [
            'factStatus' => 'verified',
            'attemptStatus' => 'accepted',
            'verifications' => $verifications,
        ];
    }

    if ($factStatus === 'rejected') {
        if ($attemptStatus !== 'rejected') {
            throw new InvalidArgumentException('Rejected facts require a rejected attempt outcome');
        }

        validateThreeVerifierRows($verifications);

        return [
            'factStatus' => 'rejected',
            'attemptStatus' => 'rejected',
            'verifications' => $verifications,
        ];
    }

    if ($attemptStatus !== 'needs-deeper-research') {
        throw new InvalidArgumentException('Retry outcomes require a needs-deeper-research attempt outcome');
    }

    validateThreeVerifierRows($verifications);

    return [
        'factStatus' => 'needs-deeper-research',
        'attemptStatus' => 'needs-deeper-research',
        'verifications' => $verifications,
    ];
}

/**
 * @param array<string, mixed> $attempt
 */
function validateAttemptPayload(array $attempt): void
{
    assertPositiveInt($attempt['factId'] ?? null, 'factId');
    assertNonEmptyString($attempt['agent'] ?? null, 'agent');
    assertOutcomeStatus($attempt['proposedStatus'] ?? null, 'proposedStatus');
    assertHttpUrl($attempt['sourceUrl'] ?? null, 'sourceUrl');
    assertIsoDate($attempt['accessedDate'] ?? null, 'accessedDate');
    assertNonEmptyString($attempt['auditQuote'] ?? null, 'auditQuote');
    assertNonEmptyString($attempt['rawResponse'] ?? null, 'rawResponse');

    $status = assertNonEmptyString($attempt['status'] ?? null, 'status');

    if (!in_array($status, ['needs-verification', 'needs-deeper-research', 'rejected'], true)) {
        throw new InvalidArgumentException('status must be needs-verification, needs-deeper-research, or rejected');
    }
}

/**
 * @param array<string, mixed> $decision
 */
function validateDecisionPayload(array $decision): void
{
    assertAttemptOutcomeStatus($decision['recommendedAttemptStatus'] ?? null, 'recommendedAttemptStatus');
    assertOutcomeStatus($decision['recommendedFactStatus'] ?? null, 'recommendedFactStatus');

    if (!array_key_exists('verifications', $decision) || !is_array($decision['verifications'])) {
        throw new InvalidArgumentException('verifications must be an array');
    }
}

/**
 * @param array<string, mixed> $decision
 * @param array<string, mixed> $attempt
 */
function validateDecisionMatchesAttempt(array $decision, array $attempt): void
{
    $factId = (int) $attempt['factId'];

    if (array_key_exists('attempt', $decision)) {
        if (!is_array($decision['attempt']) || array_is_list($decision['attempt'])) {
            throw new InvalidArgumentException('decision attempt must be one JSON object');
        }

        if (($decision['attempt']['factId'] ?? null) !== $factId) {
            throw new InvalidArgumentException('decision attempt factId must match the selected attempt');
        }

        if (
            array_key_exists('status', $decision['attempt'])
            && ($decision['attempt']['status'] ?? null) !== ($attempt['status'] ?? null)
        ) {
            throw new InvalidArgumentException('decision attempt status must match the selected attempt');
        }
    }

    foreach ($decision['verifications'] as $verification) {
        if (!is_array($verification) || array_is_list($verification)) {
            continue;
        }

        if (($verification['factId'] ?? null) !== $factId) {
            throw new InvalidArgumentException('verification factId must match the selected attempt');
        }
    }
}

function assertOutcomeStatus(mixed $value, string $label): string
{
    $status = assertNonEmptyString($value, $label);

    if (!in_array($status, ['verified', 'rejected', 'needs-deeper-research'], true)) {
        throw new InvalidArgumentException("{$label} must be verified, rejected, or needs-deeper-research");
    }

    return $status;
}

function assertAttemptOutcomeStatus(mixed $value, string $label): string
{
    $status = assertNonEmptyString($value, $label);

    if (!in_array($status, ['accepted', 'rejected', 'needs-deeper-research'], true)) {
        throw new InvalidArgumentException("{$label} must be accepted, rejected, or needs-deeper-research");
    }

    return $status;
}

/**
 * @param array<string, mixed>|null $decision
 * @return list<array<string, mixed>>
 */
function verificationsFromDecision(?array $decision): array
{
    if ($decision === null) {
        return [];
    }

    /** @var list<array<string, mixed>> $rows */
    $rows = [];

    foreach ($decision['verifications'] as $row) {
        if (!is_array($row) || array_is_list($row)) {
            throw new InvalidArgumentException('Each verification must be one JSON object');
        }

        validateVerificationPayload($row);
        $rows[] = $row;
    }

    return $rows;
}

/**
 * @param array<string, mixed> $verification
 */
function validateVerificationPayload(array $verification): void
{
    $index = assertPositiveInt($verification['verifierIndex'] ?? null, 'verifierIndex');

    if ($index < 1 || $index > 3) {
        throw new InvalidArgumentException('verifierIndex must be 1, 2, or 3');
    }

    assertNonEmptyString($verification['agent'] ?? null, 'verification agent');
    $verdict = assertNonEmptyString($verification['verdict'] ?? null, 'verification verdict');

    if (in_array($verdict, ['source-inaccessible', 'source-quality-rejected'], true)) {
        assertOptionalHttpUrl($verification['sourceUrl'] ?? null, 'verification sourceUrl');
        assertOptionalIsoDate($verification['accessedDate'] ?? null, 'verification accessedDate');
        assertOptionalNonEmptyString($verification['auditQuote'] ?? null, 'verification auditQuote');
    } else {
        assertHttpUrl($verification['sourceUrl'] ?? null, 'verification sourceUrl');
        assertIsoDate($verification['accessedDate'] ?? null, 'verification accessedDate');
        assertNonEmptyString($verification['auditQuote'] ?? null, 'verification auditQuote');
    }

    assertNonEmptyString($verification['notes'] ?? null, 'verification notes');
    assertNonEmptyString($verification['rawResponse'] ?? null, 'verification rawResponse');
}

/**
 * @param array<string, mixed> $decision
 * @param list<array<string, mixed>> $verifications
 */
function validateAcceptedVerifierDecision(array $decision, array $verifications): void
{
    if (($decision['accepted'] ?? null) !== true) {
        throw new InvalidArgumentException('Verified persistence requires an accepted verifier decision');
    }

    validateThreeVerifierRows($verifications);

    foreach ($verifications as $verification) {
        if (($verification['verdict'] ?? null) !== 'supports') {
            throw new InvalidArgumentException('Verified persistence requires supporting verifier records');
        }

        if (($verification['countsTowardAcceptance'] ?? null) !== true) {
            throw new InvalidArgumentException('Verified persistence requires countable verifier records');
        }
    }
}

/**
 * @param list<array<string, mixed>> $verifications
 */
function validateThreeVerifierRows(array $verifications): void
{
    if (count($verifications) !== 3) {
        throw new InvalidArgumentException('Persistence requires exactly three verifier records for a verifier decision');
    }

    $slots = [];

    foreach ($verifications as $verification) {
        $slots[] = (int) $verification['verifierIndex'];
    }

    sort($slots);

    if ($slots !== [1, 2, 3]) {
        throw new InvalidArgumentException('Verifier records must cover slots 1, 2, and 3 exactly once');
    }
}

function assertNonEmptyString(mixed $value, string $label): string
{
    if (!is_string($value) || trim($value) === '') {
        throw new InvalidArgumentException("{$label} must be a non-empty string");
    }

    return trim($value);
}

function assertOptionalNonEmptyString(mixed $value, string $label): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    return assertNonEmptyString($value, $label);
}

function assertPositiveInt(mixed $value, string $label): int
{
    if (!is_int($value) || $value < 1) {
        throw new InvalidArgumentException("{$label} must be a positive integer");
    }

    return $value;
}

function assertHttpUrl(mixed $value, string $label): string
{
    $url = assertNonEmptyString($value, $label);
    $parts = parse_url($url);
    $scheme = is_array($parts) ? strtolower((string) ($parts['scheme'] ?? '')) : '';

    if ($scheme !== 'http' && $scheme !== 'https') {
        throw new InvalidArgumentException("{$label} must use an http or https URL");
    }

    return $url;
}

function assertOptionalHttpUrl(mixed $value, string $label): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    return assertHttpUrl($value, $label);
}

function assertIsoDate(mixed $value, string $label): string
{
    $date = assertNonEmptyString($value, $label);
    $parts = explode('-', $date);

    if (
        count($parts) !== 3
        || !ctype_digit($parts[0])
        || !ctype_digit($parts[1])
        || !ctype_digit($parts[2])
        || !checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0])
        || sprintf('%04d-%02d-%02d', (int) $parts[0], (int) $parts[1], (int) $parts[2]) !== $date
    ) {
        throw new InvalidArgumentException("{$label} must use YYYY-MM-DD format");
    }

    return $date;
}

function assertOptionalIsoDate(mixed $value, string $label): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    return assertIsoDate($value, $label);
}

/**
 * @param array<string, mixed> $attempt
 */
function insertMatrixFactAttempt(PDO $pdo, array $attempt, string $status): int
{
    $values = typedValueColumns($attempt['proposedValue'] ?? null);
    $stmt = $pdo->prepare(
        'INSERT INTO `matrix_fact_attempts` (
            `fact_id`, `agent`, `model`, `command`, `proposed_status`,
            `proposed_value_bool`, `proposed_value_number`, `proposed_value_text`,
            `proposed_value_json`, `source_url`, `source_title`, `accessed_date`,
            `audit_quote`, `raw_response`, `status`
        ) VALUES (
            :fact_id, :agent, :model, :command, :proposed_status,
            :proposed_value_bool, :proposed_value_number, :proposed_value_text,
            :proposed_value_json, :source_url, :source_title, :accessed_date,
            :audit_quote, :raw_response, :status
        )'
    );

    $stmt->execute([
        ':fact_id' => (int) $attempt['factId'],
        ':agent' => $attempt['agent'],
        ':model' => $attempt['model'] ?? null,
        ':command' => $attempt['command'] ?? null,
        ':proposed_status' => $attempt['proposedStatus'],
        ':proposed_value_bool' => $values['bool'],
        ':proposed_value_number' => $values['number'],
        ':proposed_value_text' => $values['text'],
        ':proposed_value_json' => $values['json'],
        ':source_url' => $attempt['sourceUrl'],
        ':source_title' => $attempt['sourceTitle'] ?? null,
        ':accessed_date' => $attempt['accessedDate'],
        ':audit_quote' => $attempt['auditQuote'],
        ':raw_response' => $attempt['rawResponse'],
        ':status' => $status,
    ]);

    return (int) $pdo->lastInsertId();
}

/**
 * @param list<array<string, mixed>> $verifications
 */
function insertMatrixFactVerifications(PDO $pdo, int $attemptId, array $verifications): int
{
    if ($verifications === []) {
        return 0;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO `matrix_fact_verifications` (
            `attempt_id`, `verifier_index`, `agent`, `source_url`, `source_title`,
            `accessed_date`, `audit_quote`, `verdict`, `notes`, `raw_response`
        ) VALUES (
            :attempt_id, :verifier_index, :agent, :source_url, :source_title,
            :accessed_date, :audit_quote, :verdict, :notes, :raw_response
        )'
    );
    $count = 0;

    foreach ($verifications as $verification) {
        $stmt->execute([
            ':attempt_id' => $attemptId,
            ':verifier_index' => $verification['verifierIndex'],
            ':agent' => $verification['agent'],
            ':source_url' => $verification['sourceUrl'],
            ':source_title' => $verification['sourceTitle'] ?? null,
            ':accessed_date' => $verification['accessedDate'],
            ':audit_quote' => $verification['auditQuote'],
            ':verdict' => $verification['verdict'],
            ':notes' => $verification['notes'],
            ':raw_response' => $verification['rawResponse'],
        ]);
        $count++;
    }

    return $count;
}

/**
 * @param array<string, mixed> $attempt
 * @param array{factStatus: string, attemptStatus: string, verifications: list<array<string, mixed>>} $outcome
 */
function settleMatrixFact(PDO $pdo, array $attempt, int $attemptId, array $outcome): void
{
    if ($outcome['factStatus'] === 'verified') {
        settleVerifiedMatrixFact($pdo, $attempt, $attemptId);
        return;
    }

    settleUnresolvedMatrixFact($pdo, (int) $attempt['factId'], $outcome['factStatus']);
}

/**
 * Compute the next backoff datetime for a matrix fact entering
 * needs-deeper-research, given the post-increment attempt count.
 *
 * Schedule (issue #471):
 *   count=1 → +1 day, count=2 → +3 days, count=3 → +7 days,
 *   count >= 4 → +30 days indefinitely. No retry ceiling.
 */
function computeDeeperResearchNextEligibleAt(int $newAttemptCount): string
{
    $daysByCount = [1 => 1, 2 => 3, 3 => 7];
    $days = $daysByCount[$newAttemptCount] ?? 30;

    return (new DateTimeImmutable('now'))
        ->add(new DateInterval('P' . $days . 'D'))
        ->format('Y-m-d H:i:s');
}

/**
 * Read the current deeper-research attempt count for a fact. Returns 0 if
 * the fact is missing or the column has no value (fresh row).
 */
function readDeeperResearchAttemptCount(PDO $pdo, int $factId): int
{
    $stmt = $pdo->prepare(
        'SELECT `deeper_research_attempt_count` AS attempt_count
         FROM `matrix_facts`
         WHERE `id` = :fact_id'
    );
    $stmt->execute([':fact_id' => $factId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!is_array($row)) {
        return 0;
    }

    $count = $row['attempt_count'] ?? 0;

    return is_numeric($count) ? (int) $count : 0;
}

/**
 * @param array<string, mixed> $attempt
 */
function settleVerifiedMatrixFact(PDO $pdo, array $attempt, int $attemptId): void
{
    $values = typedValueColumns($attempt['proposedValue'] ?? null);
    // Issue #471: a fact that leaves the deeper-research queue (here, by
    // becoming verified) resets its backoff bookkeeping — the count/timer
    // is only meaningful while the fact is still in needs-deeper-research.
    $stmt = $pdo->prepare(
        'UPDATE `matrix_facts`
         SET `status` = :status,
             `value_bool` = :value_bool,
             `value_number` = :value_number,
             `value_text` = :value_text,
             `value_json` = :value_json,
             `public_source_url` = :public_source_url,
             `public_source_title` = :public_source_title,
             `public_source_accessed_date` = :public_source_accessed_date,
             `selected_attempt_id` = :selected_attempt_id,
             `deeper_research_attempt_count` = :deeper_research_attempt_count,
             `deeper_research_next_eligible_at` = :deeper_research_next_eligible_at
         WHERE `id` = :fact_id
           AND `status` = :required_status'
    );

    $stmt->execute([
        ':status' => 'verified',
        ':value_bool' => $values['bool'],
        ':value_number' => $values['number'],
        ':value_text' => $values['text'],
        ':value_json' => $values['json'],
        ':public_source_url' => $attempt['sourceUrl'],
        ':public_source_title' => $attempt['sourceTitle'] ?? null,
        ':public_source_accessed_date' => $attempt['accessedDate'],
        ':selected_attempt_id' => $attemptId,
        ':deeper_research_attempt_count' => 0,
        ':deeper_research_next_eligible_at' => null,
        ':fact_id' => (int) $attempt['factId'],
        ':required_status' => 'researching',
    ]);

    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('Selected matrix fact could not be settled.');
    }
}

function settleUnresolvedMatrixFact(PDO $pdo, int $factId, string $status): void
{
    // Issue #471: when settling a fact into needs-deeper-research, advance
    // the backoff bookkeeping so the --mode=deeper-research selector path
    // cools the fact down for 1/3/7/30 days. For any other unresolved
    // settle (e.g. rejected), leave the backoff columns alone.
    $isDeeperResearch = $status === 'needs-deeper-research';
    $newCount = null;
    $nextEligibleAt = null;

    if ($isDeeperResearch) {
        $previousCount = readDeeperResearchAttemptCount($pdo, $factId);
        $newCount = $previousCount + 1;
        $nextEligibleAt = computeDeeperResearchNextEligibleAt($newCount);
    }

    // Issue #468: a recheck failure must not erase the prior verified
    // value. We branch on whether the row already carries a
    // selected_attempt_id (i.e. a previously verified attempt). The
    // SQL guards itself row-side so a single UPDATE handles both:
    //   - First-time failure (selected_attempt_id IS NULL):
    //       blank value_* / public_source_* / selected_attempt_id, as before.
    //   - Recheck failure (selected_attempt_id IS NOT NULL):
    //       keep value_* / public_source_* / selected_attempt_id intact.
    // Only `status` legitimately changes on a failed recheck.
    if ($isDeeperResearch) {
        $stmt = $pdo->prepare(
            'UPDATE `matrix_facts`
             SET `status` = :status,
                 `value_bool` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_bool` END,
                 `value_number` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_number` END,
                 `value_text` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_text` END,
                 `value_json` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_json` END,
                 `public_source_url` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `public_source_url` END,
                 `public_source_title` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `public_source_title` END,
                 `public_source_accessed_date` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `public_source_accessed_date` END,
                 `deeper_research_attempt_count` = :deeper_research_attempt_count,
                 `deeper_research_next_eligible_at` = :deeper_research_next_eligible_at
             WHERE `id` = :fact_id
               AND `status` = :required_status'
        );

        $stmt->execute([
            ':status' => $status,
            ':deeper_research_attempt_count' => $newCount,
            ':deeper_research_next_eligible_at' => $nextEligibleAt,
            ':fact_id' => $factId,
            ':required_status' => 'researching',
        ]);
    } else {
        $stmt = $pdo->prepare(
            'UPDATE `matrix_facts`
             SET `status` = :status,
                 `value_bool` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_bool` END,
                 `value_number` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_number` END,
                 `value_text` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_text` END,
                 `value_json` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `value_json` END,
                 `public_source_url` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `public_source_url` END,
                 `public_source_title` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `public_source_title` END,
                 `public_source_accessed_date` = CASE WHEN `selected_attempt_id` IS NULL THEN NULL ELSE `public_source_accessed_date` END
             WHERE `id` = :fact_id
               AND `status` = :required_status'
        );

        $stmt->execute([
            ':status' => $status,
            ':fact_id' => $factId,
            ':required_status' => 'researching',
        ]);
    }

    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('Selected matrix fact could not be settled.');
    }
}

/**
 * @return array{bool: ?int, number: int|float|string|null, text: ?string, json: ?string}
 */
function typedValueColumns(mixed $value): array
{
    if (is_bool($value)) {
        return ['bool' => $value ? 1 : 0, 'number' => null, 'text' => null, 'json' => null];
    }

    if (is_int($value) || is_float($value)) {
        return ['bool' => null, 'number' => $value, 'text' => null, 'json' => null];
    }

    if (is_string($value)) {
        return ['bool' => null, 'number' => null, 'text' => $value, 'json' => null];
    }

    if (is_array($value)) {
        return [
            'bool' => null,
            'number' => null,
            'text' => null,
            'json' => json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ];
    }

    return ['bool' => null, 'number' => null, 'text' => null, 'json' => null];
}
