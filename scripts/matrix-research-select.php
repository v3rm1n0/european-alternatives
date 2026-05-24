<?php
declare(strict_types=1);

/**
 * Matrix research selector.
 *
 * Usage:
 *   php scripts/matrix-research-select.php [--category <category_id>] [--entry <entry_slug>] [--criterion <criterion_key>] [--dry-run]
 *
 * Exit codes:
 *   0  Selected a matrix fact, or dry-run found the fact that would be selected.
 *   2  No open matrix fact available for the requested scope.
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

const NO_OPEN_FACT = 2;
const INVALID_USAGE = 64;

try {
    runSelector($argv);
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
function runSelector(array $argv): never
{
    $options = parseCliArgs($argv);

    if ($options['help'] === true) {
        printUsage(STDOUT);
        exit(0);
    }

    $isDryRun = $options['dryRun'] === true;
    $pdo = getDatabaseConnection();

    if ($isDryRun) {
        $row = selectOpenMatrixFact($pdo, $options, false);

        if ($row === null) {
            exitNoOpenFact();
        }

        printSelectedFact($row, true);
        exit(0);
    }

    $pdo->beginTransaction();

    try {
        $row = selectOpenMatrixFact($pdo, $options, true);

        if ($row === null) {
            $pdo->rollBack();
            exitNoOpenFact();
        }

        if (!$isDryRun) {
            claimSelectedFact($pdo, (int) $row['fact_id']);
        }

        $pdo->commit();
        printSelectedFact($row, false);
        exit(0);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $e;
    }
}

/**
 * @param list<string> $argv
 * @return array{category: ?string, entrySlug: ?string, criterion: ?string, dryRun: bool, help: bool}
 */
function parseCliArgs(array $argv): array
{
    $options = [
        'category' => null,
        'entrySlug' => null,
        'criterion' => null,
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
            $options['category'] = readRequiredOptionValue($argv, $i, '--category');
            $i++;
            continue;
        }

        if ($arg === '--entry' || $arg === '--entry-slug') {
            $options['entrySlug'] = readRequiredOptionValue($argv, $i, $arg);
            $i++;
            continue;
        }

        if ($arg === '--criterion') {
            $options['criterion'] = readRequiredOptionValue($argv, $i, '--criterion');
            $i++;
            continue;
        }

        if (str_starts_with($arg, '--category=')) {
            $options['category'] = readInlineOptionValue($arg, '--category');
            continue;
        }

        if (str_starts_with($arg, '--entry=')) {
            $options['entrySlug'] = readInlineOptionValue($arg, '--entry');
            continue;
        }

        if (str_starts_with($arg, '--entry-slug=')) {
            $options['entrySlug'] = readInlineOptionValue($arg, '--entry-slug');
            continue;
        }

        if (str_starts_with($arg, '--criterion=')) {
            $options['criterion'] = readInlineOptionValue($arg, '--criterion');
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
  php scripts/matrix-research-select.php [options]

Options:
  --category <category_id>      Select within one matrix category.
  --entry <entry_slug>          Select within one catalog entry.
  --entry-slug <entry_slug>     Alias for --entry.
  --criterion <criterion_key>   Select one criterion key.
  --dry-run                     Print the selected target without writing.
  --help                        Show this help.

Output:
  A selected target is printed as JSON to stdout.

No open facts:
  When no open matrix fact matches the requested scope, the script prints
  "No open matrix fact available for the requested scope." to stderr and exits 2.

TEXT);
}

function stderr(string $message): void
{
    fwrite(STDERR, $message . "\n");
}

function exitNoOpenFact(): never
{
    stderr('No open matrix fact available for the requested scope.');
    exit(NO_OPEN_FACT);
}

/**
 * @param array{category: ?string, entrySlug: ?string, criterion: ?string, dryRun: bool, help: bool} $options
 * @return array<string, mixed>|null
 */
function selectOpenMatrixFact(PDO $pdo, array $options, bool $forUpdate): ?array
{
    [$targetSql, $params] = buildTargetFilters($options);
    $sql = buildSelectionSql($targetSql, $forUpdate);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return is_array($row) ? $row : null;
}

/**
 * @param array{category: ?string, entrySlug: ?string, criterion: ?string, dryRun: bool, help: bool} $options
 * @return array{0: string, 1: array<string, string>}
 */
function buildTargetFilters(array $options): array
{
    $conditions = [];
    $params = [];

    if ($options['category'] !== null) {
        $conditions[] = '  AND mf.category_id = :category';
        $params[':category'] = $options['category'];
    }

    if ($options['entrySlug'] !== null) {
        $conditions[] = '  AND ce.slug = :entry_slug';
        $params[':entry_slug'] = $options['entrySlug'];
    }

    if ($options['criterion'] !== null) {
        $conditions[] = '  AND mc.criterion_key = :criterion';
        $params[':criterion'] = $options['criterion'];
    }

    return [
        $conditions === [] ? '' : "\n" . implode("\n", $conditions),
        $params,
    ];
}

function buildSelectionSql(string $targetSql, bool $forUpdate): string
{
    if ($forUpdate) {
        return <<<SQL
SELECT
  mf.id AS fact_id,
  mf.status AS fact_status,
  mf.category_id,
  c.name_en AS category_name,
  ce.slug AS entry_slug,
  ce.name AS entry_name,
  mc.criterion_key,
  mc.label_en AS criterion_label,
  mc.value_type
FROM `matrix_facts` mf
JOIN `catalog_entries` ce ON ce.id = mf.entry_id
JOIN `categories` c ON c.id = mf.category_id
JOIN `matrix_criteria` mc ON mc.id = mf.criterion_id
                         AND mc.category_id = mf.category_id
WHERE mf.status = 'open'
  AND ce.status = 'alternative'
  AND ce.is_active = 1{$targetSql}
ORDER BY
  c.sort_order ASC,
  c.id ASC,
  ce.name ASC,
  ce.id ASC,
  mc.sort_order ASC,
  mc.id ASC,
  mf.id ASC
LIMIT 1
FOR UPDATE SKIP LOCKED
SQL;
    }

    return <<<SQL
SELECT
  mf.id AS fact_id,
  mf.status AS fact_status,
  mf.category_id,
  c.name_en AS category_name,
  ce.slug AS entry_slug,
  ce.name AS entry_name,
  mc.criterion_key,
  mc.label_en AS criterion_label,
  mc.value_type
FROM `matrix_facts` mf
JOIN `catalog_entries` ce ON ce.id = mf.entry_id
JOIN `categories` c ON c.id = mf.category_id
JOIN `matrix_criteria` mc ON mc.id = mf.criterion_id
                         AND mc.category_id = mf.category_id
WHERE mf.status = 'open'
  AND ce.status = 'alternative'
  AND ce.is_active = 1{$targetSql}
ORDER BY
  c.sort_order ASC,
  c.id ASC,
  ce.name ASC,
  ce.id ASC,
  mc.sort_order ASC,
  mc.id ASC,
  mf.id ASC
LIMIT 1
SQL;
}

function claimSelectedFact(PDO $pdo, int $factId): void
{
    $stmt = $pdo->prepare(
        "UPDATE `matrix_facts`
         SET `status` = 'researching'
         WHERE `id` = :fact_id
           AND `status` = 'open'"
    );
    $stmt->execute([':fact_id' => $factId]);

    if ($stmt->rowCount() !== 1) {
        throw new RuntimeException('Selected matrix fact could not be marked as researching.');
    }
}

/**
 * @param array<string, mixed> $row
 */
function printSelectedFact(array $row, bool $dryRun): void
{
    $previousStatus = (string) $row['fact_status'];
    $payload = [
        'factId' => (int) $row['fact_id'],
        'categoryId' => (string) $row['category_id'],
        'categoryName' => (string) $row['category_name'],
        'entrySlug' => (string) $row['entry_slug'],
        'entryName' => (string) $row['entry_name'],
        'criterionKey' => (string) $row['criterion_key'],
        'criterionLabel' => (string) $row['criterion_label'],
        'valueType' => (string) $row['value_type'],
        'previousStatus' => $previousStatus,
        'status' => $dryRun ? $previousStatus : 'researching',
        'dryRun' => $dryRun,
    ];

    echo json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
}
