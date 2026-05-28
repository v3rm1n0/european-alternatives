<?php
declare(strict_types=1);

/**
 * Initialize missing matrix_facts rows for active matrix entries.
 *
 * Closes the gap between catalog state and `matrix_facts`. For every
 * (entry, criterion) pair where the entry is an active alternative or US
 * benchmark mapped to a matrix-enabled category and no fact row exists, inserts an
 * 'open' fact so the research pipeline can pick it up.
 *
 * Idempotent: re-runs insert zero new rows. Existing facts (in any status)
 * are never overwritten — the `uq_mf_entry_criterion (entry_id, criterion_id)`
 * unique key plus `INSERT IGNORE` guarantee that.
 *
 * Usage:
 *   php scripts/init-missing-matrix-facts.php [--category <id>] [--dry-run] [--help]
 *
 * Exit codes:
 *   0  Success.
 *   64 Invalid CLI usage (unknown flag, missing/empty value, unknown category).
 *   1  Database or runtime failure.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script must be run from the command line.';
    exit(1);
}

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/db.php';

try {
    runInit($argv);
} catch (InvalidArgumentException $e) {
    initStderr('Invalid usage: ' . $e->getMessage());
    initStderr('Run with --help for usage.');
    exit(64);
} catch (Throwable $e) {
    initStderr('Error: ' . $e->getMessage());
    exit(1);
}

/**
 * @param list<string> $argv
 */
function runInit(array $argv): never
{
    $options = parseInitCliArgs($argv);

    if ($options['help'] === true) {
        printInitUsage(STDOUT);
        exit(0);
    }

    $pdo = getDatabaseConnection();

    if ($options['category'] !== null && !validateInitCategory($pdo, $options['category'])) {
        initStderr('Invalid usage: category "' . $options['category'] . '" has no matrix criteria defined.');
        initStderr('Run with --help for usage.');
        exit(64);
    }

    $perCategory = gatherInitGapCounts($pdo, $options['category']);

    if ($options['dryRun'] === true) {
        emitInitPayload(0, true, $options['category'], $perCategory);
        exit(0);
    }

    $pdo->beginTransaction();

    try {
        $inserted = performInitInsert($pdo, $options['category']);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    emitInitPayload($inserted, false, $options['category'], $perCategory);
    exit(0);
}

/**
 * @param list<string> $argv
 * @return array{category: ?string, dryRun: bool, help: bool}
 */
function parseInitCliArgs(array $argv): array
{
    $options = [
        'category' => null,
        'dryRun' => false,
        'help' => false,
    ];

    $count = count($argv);

    for ($i = 1; $i < $count; $i++) {
        $arg = $argv[$i];

        if ($arg === '--help') {
            $options['help'] = true;
            continue;
        }

        if ($arg === '--dry-run') {
            $options['dryRun'] = true;
            continue;
        }

        if ($arg === '--category') {
            $options['category'] = readInitOptionValue($argv, $i, '--category');
            $i++;
            continue;
        }

        if (str_starts_with($arg, '--category=')) {
            $options['category'] = readInitInlineValue($arg, '--category');
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
function readInitOptionValue(array $argv, int $optionIndex, string $optionName): string
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

function readInitInlineValue(string $arg, string $optionName): string
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
function printInitUsage($stream): void
{
    fwrite($stream, <<<TEXT
Usage:
  php scripts/init-missing-matrix-facts.php [options]

Options:
  --category <id>   Restrict work to one matrix-enabled category.
                    Accepts --category <id> or --category=<id>.
  --dry-run         Compute the per-category gap count without inserting.
  --help            Show this help.

Output:
  JSON payload on stdout with keys: inserted, dryRun, category, perCategory.
  perCategory maps category_id -> gap-row count (pre-insert).

TEXT);
}

function initStderr(string $message): void
{
    fwrite(STDERR, $message . "\n");
}

function validateInitCategory(PDO $pdo, string $category): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM `matrix_criteria` WHERE `category_id` = :category LIMIT 1');
    $stmt->execute([':category' => $category]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return is_array($row);
}

/**
 * @return array<string, int>
 */
function gatherInitGapCounts(PDO $pdo, ?string $category): array
{
    $where = "WHERE ce.`status` IN ('alternative', 'us')\n  AND ce.`is_active` = 1\n  AND mf.`id` IS NULL";
    $params = [];

    if ($category !== null) {
        $where .= "\n  AND ec.`category_id` = :category";
        $params[':category'] = $category;
    }

    $sql = <<<SQL
SELECT ec.`category_id` AS `category_id`, COUNT(*) AS `missing_facts`
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.`entry_id` = ce.`id`
JOIN `matrix_criteria` mc
  ON mc.`category_id` = ec.`category_id`
LEFT JOIN `matrix_facts` mf
  ON mf.`entry_id` = ce.`id`
 AND mf.`criterion_id` = mc.`id`
{$where}
GROUP BY ec.`category_id`
ORDER BY ec.`category_id`
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $result = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $cat = (string) ($row['category_id'] ?? '');
        if ($cat === '') {
            continue;
        }
        $result[$cat] = (int) ($row['missing_facts'] ?? 0);
    }

    return $result;
}

function performInitInsert(PDO $pdo, ?string $category): int
{
    $where = "WHERE ce.`status` IN ('alternative', 'us')\n  AND ce.`is_active` = 1";
    $params = [];

    if ($category !== null) {
        $where .= "\n  AND ec.`category_id` = :category";
        $params[':category'] = $category;
    }

    $sql = <<<SQL
INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.`id`, mc.`category_id`, mc.`id`, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.`entry_id` = ce.`id`
JOIN `matrix_criteria` mc
  ON mc.`category_id` = ec.`category_id`
{$where}
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->rowCount();
}

/**
 * @param array<string, int> $perCategory
 */
function emitInitPayload(int $inserted, bool $dryRun, ?string $category, array $perCategory): void
{
    $payload = [
        'inserted' => $inserted,
        'dryRun' => $dryRun,
        'category' => $category,
        'perCategory' => (object) $perCategory,
    ];

    echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
}
