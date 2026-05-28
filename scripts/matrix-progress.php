<?php
declare(strict_types=1);

/**
 * Matrix research progress report (issue #472).
 *
 * Read-only per-category report over `matrix_facts`. Summarizes how complete
 * each matrix category is and where the automated research loop still has
 * work to do. Designed for maintainer use at the CLI; the public/admin UI
 * surface is intentionally deferred until operator demand emerges.
 *
 * Per category, surfaces these counts:
 *   - expected            universe size (active alternatives/US benchmarks x category criteria)
 *   - total               rows already initialized in matrix_facts
 *   - missing             expected - total (gap rows init script would create)
 *   - verified            mf.status = 'verified'
 *   - open                mf.status = 'open'           (unverified)
 *   - researching         mf.status = 'researching'
 *   - needs-deeper-research
 *       deeper-due        backoff timer past or NULL (re-pickable now)
 *       deeper-backoff    backoff timer still in the future
 *   - stale/due-for-recheck
 *                         verified + selected attempt older than the
 *                         configured stale threshold (default 180 days,
 *                         overridable via MATRIX_FACT_STALE_AFTER_DAYS).
 *                         Same predicate as scripts/matrix-research-select.php.
 *   - not-applicable      mf.status = 'not-applicable'
 *   - rejected            mf.status = 'rejected'      (terminal at fact level)
 *
 * Also reports a "top unresolved" ranking, ordered by
 *   open + needs-deeper-research + stale-due  desc,
 *   with an alphabetical tiebreaker on category id.
 *
 * Source-safety: this report queries counts and metadata only. Verbatim
 * source columns from the audit chain are never selected or printed.
 *
 * Out of scope (deferred):
 *   - Per-criterion breakdown (separate follow-up issue).
 *   - Public / admin UI surface.
 *   - Trust Score changes.
 *   - Product fact research.
 *   - Attempt-level rejection counts (the "rejected" bucket here is
 *     fact-status level; per-attempt history is part of the deferred
 *     per-criterion breakdown).
 *
 * Usage:
 *   php scripts/matrix-progress.php [--category <id>] [--json] [--help]
 *
 * Exit codes (mirrors scripts/init-missing-matrix-facts.php):
 *   0   Report emitted.
 *   64  Invalid CLI usage (unknown flag, empty value, unknown category).
 *   1   Database or runtime failure.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script must be run from the command line.';
    exit(1);
}

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/db.php';

try {
    runProgress($argv);
} catch (InvalidArgumentException $e) {
    progressStderr('Invalid usage: ' . $e->getMessage());
    progressStderr('Run with --help for usage.');
    exit(64);
} catch (Throwable $e) {
    progressStderr('Error: ' . $e->getMessage());
    exit(1);
}

/**
 * @param list<string> $argv
 */
function runProgress(array $argv): never
{
    $options = parseProgressCliArgs($argv);

    if ($options['help'] === true) {
        printProgressUsage(STDOUT);
        exit(0);
    }

    $staleDays = resolveProgressStaleThresholdDays();
    $pdo = getDatabaseConnection();

    if ($options['category'] !== null && !validateProgressCategory($pdo, $options['category'])) {
        throw new InvalidArgumentException(
            'category "' . $options['category'] . '" has no matrix criteria defined'
        );
    }

    $rows = fetchProgressRows($pdo, $options['category'], $staleDays);
    $payload = buildProgressPayload($rows, $options['category'], $staleDays);

    if ($options['json'] === true) {
        emitProgressJson($payload);
    } else {
        renderProgressText($payload);
    }

    exit(0);
}

/**
 * @param list<string> $argv
 * @return array{category: ?string, json: bool, help: bool}
 */
function parseProgressCliArgs(array $argv): array
{
    $options = [
        'category' => null,
        'json' => false,
        'help' => false,
    ];

    $count = count($argv);

    for ($i = 1; $i < $count; $i++) {
        $arg = $argv[$i];

        if ($arg === '--help') {
            $options['help'] = true;
            continue;
        }

        if ($arg === '--json') {
            $options['json'] = true;
            continue;
        }

        if ($arg === '--category') {
            $options['category'] = readProgressOptionValue($argv, $i, '--category');
            $i++;
            continue;
        }

        if (str_starts_with($arg, '--category=')) {
            $options['category'] = readProgressInlineValue($arg, '--category');
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
function readProgressOptionValue(array $argv, int $optionIndex, string $optionName): string
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

function readProgressInlineValue(string $arg, string $optionName): string
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
function printProgressUsage($stream): void
{
    fwrite($stream, <<<TEXT
Usage:
  php scripts/matrix-progress.php [options]

Options:
  --category <id>   Restrict the report to one matrix-enabled category.
                    Accepts --category <id> or --category=<id>.
  --json            Emit a machine-readable JSON payload on stdout.
                    Default output is human-readable text.
  --help            Show this help and exit 0.

Output:
  Per-category counts over matrix_facts:
    expected, total, missing,
    verified, open, researching,
    needs-deeper-research (split into due-now and on-backoff),
    stale/due-for-recheck, not-applicable, rejected.
  Also a "top unresolved" list, ordered by
    open + needs-deeper-research + stale-due
  descending, with an alphabetical tiebreaker on category id.

Source safety:
  The report queries counts and metadata only. Verbatim source columns
  from the audit chain are never selected or printed.

Stale threshold:
  Default 180 days. Override via MATRIX_FACT_STALE_AFTER_DAYS environment
  variable (positive integer).

Out of scope (deferred):
  - Per-criterion breakdown (separate follow-up issue).
  - Public / admin UI surface.
  - Trust Score changes.
  - Product fact research.
  - Attempt-level rejection counts.

Exit codes:
  0   Report emitted.
  64  Invalid CLI usage (unknown flag, empty value, unknown category).
  1   Database or runtime failure.

TEXT);
}

function progressStderr(string $message): void
{
    fwrite(STDERR, $message . "\n");
}

function resolveProgressStaleThresholdDays(): int
{
    $raw = getenv('MATRIX_FACT_STALE_AFTER_DAYS');

    if ($raw === false || $raw === '') {
        $raw = $_ENV['MATRIX_FACT_STALE_AFTER_DAYS']
            ?? $_SERVER['MATRIX_FACT_STALE_AFTER_DAYS']
            ?? null;
    }

    if ($raw === null || $raw === '') {
        return 180;
    }

    $parsed = filter_var(
        $raw,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    return $parsed === false ? 180 : $parsed;
}

function validateProgressCategory(PDO $pdo, string $category): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM `matrix_criteria` WHERE `category_id` = :category LIMIT 1');
    $stmt->execute([':category' => $category]);

    return is_array($stmt->fetch(PDO::FETCH_ASSOC));
}

/**
 * @return list<array<string, mixed>>
 */
function fetchProgressRows(PDO $pdo, ?string $category, int $staleDays): array
{
    $where = $category !== null ? "\nWHERE c.`id` = :category" : '';

    $sql = <<<SQL
SELECT
  c.`id`        AS `category_id`,
  c.`name_en`   AS `category_name`,
  c.`sort_order` AS `sort_order`,
  COUNT(*) AS `expected`,
  SUM(CASE WHEN mf.`id` IS NOT NULL THEN 1 ELSE 0 END) AS `total`,
  SUM(CASE WHEN mf.`id` IS NULL THEN 1 ELSE 0 END) AS `missing`,
  SUM(CASE WHEN mf.`status` = 'verified' THEN 1 ELSE 0 END) AS `verified`,
  SUM(CASE WHEN mf.`status` = 'open' THEN 1 ELSE 0 END) AS `open_count`,
  SUM(CASE WHEN mf.`status` = 'researching' THEN 1 ELSE 0 END) AS `researching`,
  SUM(CASE WHEN mf.`status` = 'needs-deeper-research' THEN 1 ELSE 0 END) AS `needs_deeper_research`,
  SUM(CASE WHEN mf.`status` = 'needs-deeper-research'
            AND (mf.`deeper_research_next_eligible_at` IS NULL
                 OR mf.`deeper_research_next_eligible_at` <= NOW())
           THEN 1 ELSE 0 END) AS `deeper_due`,
  SUM(CASE WHEN mf.`status` = 'needs-deeper-research'
            AND mf.`deeper_research_next_eligible_at` > NOW()
           THEN 1 ELSE 0 END) AS `deeper_backoff`,
  SUM(CASE WHEN mf.`status` = 'verified'
            AND mf.`selected_attempt_id` IS NOT NULL
            AND sa.`created_at` < (NOW() - INTERVAL :stale_days DAY)
           THEN 1 ELSE 0 END) AS `stale_due`,
  SUM(CASE WHEN mf.`status` = 'not-applicable' THEN 1 ELSE 0 END) AS `not_applicable`,
  SUM(CASE WHEN mf.`status` = 'rejected' THEN 1 ELSE 0 END) AS `rejected`
FROM `categories` c
JOIN `matrix_criteria` mc ON mc.`category_id` = c.`id`
JOIN `entry_categories` ec ON ec.`category_id` = c.`id`
JOIN `catalog_entries` ce
  ON ce.`id` = ec.`entry_id`
 AND ce.`status` IN ('alternative', 'us')
 AND ce.`is_active` = 1
LEFT JOIN `matrix_facts` mf
  ON mf.`entry_id` = ce.`id`
 AND mf.`criterion_id` = mc.`id`
LEFT JOIN `matrix_fact_attempts` sa
  ON sa.`id` = mf.`selected_attempt_id`{$where}
GROUP BY c.`id`, c.`name_en`, c.`sort_order`
ORDER BY c.`sort_order` ASC, c.`id` ASC
SQL;

    $params = [':stale_days' => $staleDays];
    if ($category !== null) {
        $params[':category'] = $category;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return is_array($rows) ? $rows : [];
}

/**
 * @param list<array<string, mixed>> $rows
 * @return array<string, mixed>
 */
function buildProgressPayload(array $rows, ?string $category, int $staleDays): array
{
    $categories = [];
    $totals = makeEmptyProgressBucket();
    $topUnresolved = [];

    foreach ($rows as $row) {
        $bucket = mapRowToProgressBucket($row);
        $id = $bucket['categoryId'];
        if ($id === '') {
            continue;
        }
        $categories[$id] = $bucket;
        accumulateProgressTotals($totals, $bucket);
        $topUnresolved[] = [
            'categoryId' => $id,
            'unresolved' => $bucket['open'] + $bucket['needsDeeperResearch'] + $bucket['staleDue'],
        ];
    }

    usort($topUnresolved, static function (array $a, array $b): int {
        if ($a['unresolved'] === $b['unresolved']) {
            return strcmp($a['categoryId'], $b['categoryId']);
        }
        return $b['unresolved'] <=> $a['unresolved'];
    });

    return [
        'generatedAt' => gmdate('Y-m-d\\TH:i:s\\Z'),
        'staleAfterDays' => $staleDays,
        'category' => $category,
        'categories' => $categories,
        'totals' => $totals,
        'topUnresolved' => $topUnresolved,
    ];
}

/**
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function mapRowToProgressBucket(array $row): array
{
    $open = (int) ($row['open'] ?? $row['open_count'] ?? 0);
    $needsDeeper = (int) (
        $row['needs_deeper_research']
        ?? $row['needs-deeper-research']
        ?? 0
    );

    return [
        'categoryId' => (string) ($row['category_id'] ?? ''),
        'categoryName' => (string) ($row['category_name'] ?? ''),
        'expected' => (int) ($row['expected'] ?? 0),
        'total' => (int) ($row['total'] ?? 0),
        'missing' => (int) ($row['missing'] ?? 0),
        'verified' => (int) ($row['verified'] ?? 0),
        'open' => $open,
        'researching' => (int) ($row['researching'] ?? 0),
        'needsDeeperResearch' => $needsDeeper,
        'deeperDue' => (int) ($row['deeper_due'] ?? 0),
        'deeperBackoff' => (int) ($row['deeper_backoff'] ?? 0),
        'staleDue' => (int) ($row['stale_due'] ?? 0),
        'notApplicable' => (int) ($row['not_applicable'] ?? 0),
        'rejected' => (int) ($row['rejected'] ?? 0),
    ];
}

/**
 * @return array<string, int>
 */
function makeEmptyProgressBucket(): array
{
    return [
        'expected' => 0,
        'total' => 0,
        'missing' => 0,
        'verified' => 0,
        'open' => 0,
        'researching' => 0,
        'needsDeeperResearch' => 0,
        'deeperDue' => 0,
        'deeperBackoff' => 0,
        'staleDue' => 0,
        'notApplicable' => 0,
        'rejected' => 0,
    ];
}

/**
 * @param array<string, int> $totals
 * @param array<string, mixed> $bucket
 */
function accumulateProgressTotals(array &$totals, array $bucket): void
{
    foreach ($totals as $key => $current) {
        $totals[$key] = $current + (int) ($bucket[$key] ?? 0);
    }
}

/**
 * @param array<string, mixed> $payload
 */
function emitProgressJson(array $payload): void
{
    $copy = $payload;
    $copy['categories'] = (object) $payload['categories'];
    echo json_encode(
        $copy,
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    ) . "\n";
}

/**
 * @param array<string, mixed> $payload
 */
function renderProgressText(array $payload): void
{
    echo "Matrix research progress report\n";
    echo "Generated: " . $payload['generatedAt'] . "\n";
    echo "Stale threshold: " . $payload['staleAfterDays'] . " days\n";

    if ($payload['category'] !== null) {
        echo "Category filter: " . $payload['category'] . "\n";
    } else {
        echo "Category filter: none\n";
    }
    echo "\n";

    if ($payload['categories'] === []) {
        echo "No matrix-enabled categories with active matrix entries found.\n";
        return;
    }

    foreach ($payload['categories'] as $bucket) {
        renderProgressCategoryBlock($bucket);
        echo "\n";
    }

    echo "Totals\n";
    renderProgressBucketLines($payload['totals']);
    echo "\n";

    echo "Top unresolved categories\n";
    if ($payload['topUnresolved'] === []) {
        echo "  (none)\n";
        return;
    }
    foreach ($payload['topUnresolved'] as $entry) {
        echo "  - " . $entry['categoryId'] . ": unresolved=" . $entry['unresolved'] . "\n";
    }
}

/**
 * @param array<string, mixed> $bucket
 */
function renderProgressCategoryBlock(array $bucket): void
{
    echo $bucket['categoryId'] . " (" . $bucket['categoryName'] . ")\n";
    renderProgressBucketLines($bucket);
}

/**
 * @param array<string, mixed> $b
 */
function renderProgressBucketLines(array $b): void
{
    echo "  expected: " . (int) ($b['expected'] ?? 0)
        . "   total: " . (int) ($b['total'] ?? 0)
        . "   missing: " . (int) ($b['missing'] ?? 0) . "\n";
    echo "  verified: " . (int) ($b['verified'] ?? 0)
        . "   open: " . (int) ($b['open'] ?? 0)
        . "   researching: " . (int) ($b['researching'] ?? 0) . "\n";
    echo "  needs-deeper-research: " . (int) ($b['needsDeeperResearch'] ?? 0)
        . "  (due now: " . (int) ($b['deeperDue'] ?? 0)
        . ", on backoff: " . (int) ($b['deeperBackoff'] ?? 0) . ")\n";
    echo "  stale/due-for-recheck: " . (int) ($b['staleDue'] ?? 0) . "\n";
    echo "  not-applicable: " . (int) ($b['notApplicable'] ?? 0)
        . "   rejected: " . (int) ($b['rejected'] ?? 0) . "\n";
}
