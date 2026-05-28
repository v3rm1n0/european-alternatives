import { existsSync, readFileSync } from "node:fs";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Issue #472 — Matrix research progress reporting.
 *
 * Behavioral contract (TDD red phase):
 *   A standalone CLI script `scripts/matrix-progress.php` produces a
 *   per-category progress report over `matrix_facts`. The report is
 *   read-only, source/evidence safe (no audit quotes), and supports a
 *   `--category` scope flag and `--json` machine-output flag.
 *
 *   Exit codes (mirrors scripts/init-missing-matrix-facts.php):
 *     0  Report emitted.
 *     64 Invalid CLI usage (unknown flag, empty value, unknown category).
 *     1  Database or runtime failure.
 */

const progressScriptUrl = new URL(
  "../scripts/matrix-progress.php",
  import.meta.url,
);
const stateMarker = "__MATRIX_PROGRESS_STATE__";

let phpPromise: Promise<PHP> | undefined;

type MatrixFactStatus =
  | "open"
  | "researching"
  | "verified"
  | "rejected"
  | "needs-deeper-research"
  | "not-applicable";

type CatalogEntry = {
  id: number;
  slug: string;
  name: string;
  status: string;
  is_active: number;
};

type EntryCategory = {
  entry_id: number;
  category_id: string;
};

type Category = {
  id: string;
  name_en: string;
  sort_order: number;
};

type MatrixCriterion = {
  id: number;
  category_id: string;
  criterion_key: string;
};

type MatrixFactAttempt = {
  id: number;
  fact_id: number;
  status: string;
  created_at: string;
  audit_quote: string | null;
  raw_response: string | null;
};

type MatrixFact = {
  id: number;
  entry_id: number;
  category_id: string;
  criterion_id: number;
  status: MatrixFactStatus;
  selected_attempt_id: number | null;
  deeper_research_next_eligible_at: string | null;
  source_url: string | null;
  evidence_excerpt: string | null;
};

type Scenario = {
  catalogEntries: CatalogEntry[];
  entryCategories: EntryCategory[];
  categories: Category[];
  matrixCriteria: MatrixCriterion[];
  matrixFacts: MatrixFact[];
  matrixFactAttempts: MatrixFactAttempt[];
  staleThresholdDays: number;
  connections: number;
};

type CategoryBucket = {
  categoryId: string;
  categoryName: string;
  expected: number;
  total: number;
  missing: number;
  verified: number;
  open: number;
  researching: number;
  needsDeeperResearch: number;
  deeperDue: number;
  deeperBackoff: number;
  staleDue: number;
  notApplicable: number;
  rejected: number;
};

type JsonPayload = {
  generatedAt: string;
  staleAfterDays: number;
  category: string | null;
  categories: Record<string, CategoryBucket>;
  totals: Omit<CategoryBucket, "categoryId" | "categoryName">;
  topUnresolved?: Array<{ categoryId: string; unresolved: number }>;
};

type ProgressRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  payload?: JsonPayload;
  state: Scenario;
};

const AUDIT_QUOTE_CANARY = "__AUDIT_QUOTE_CANARY_42__";
const RAW_RESPONSE_CANARY = "__RAW_RESPONSE_CANARY_42__";
const SOURCE_URL_CANARY = "https://canary.invalid/__SRC_CANARY_42__";
const EVIDENCE_EXCERPT_CANARY = "__EVIDENCE_EXCERPT_CANARY_42__";

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime("8.3").then((runtime) => {
    const php = new PHP(runtime);
    useHostFilesystem(php);
    return php;
  });

  return phpPromise;
}

function readProgressScript(): string {
  expect(
    existsSync(progressScriptUrl),
    "Expected scripts/matrix-progress.php to define the matrix-progress CLI",
  ).toBe(true);

  return readFileSync(progressScriptUrl, "utf8");
}

function extractAllPhpFunctions(source: string): string {
  const out: string[] = [];
  const regex = /\bfunction\s+\w+\s*\(/g;
  let match: RegExpExecArray | null;
  let position = 0;

  while ((match = regex.exec(source)) !== null) {
    if (match.index < position) {
      continue;
    }
    const body = readBraceBody(source, match.index);
    out.push(body);
    position = match.index + body.length;
    regex.lastIndex = position;
  }

  return out.join("\n\n");
}

function readBraceBody(source: string, start: number): string {
  let depth = 0;
  let bodyStarted = false;
  let inSingleQuotedString = false;
  let inDoubleQuotedString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inHeredoc = false;
  let heredocTag = "";

  for (let idx = start; idx < source.length; idx++) {
    const char = source[idx];
    const next = source[idx + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        idx++;
        inBlockComment = false;
      }
      continue;
    }

    if (inHeredoc) {
      if (
        char === "\n" &&
        source.slice(idx + 1, idx + 1 + heredocTag.length) === heredocTag &&
        /[^A-Za-z0-9_]/.test(source[idx + 1 + heredocTag.length] ?? ";")
      ) {
        idx += heredocTag.length;
        inHeredoc = false;
      }
      continue;
    }

    if (inSingleQuotedString) {
      if (char === "\\") {
        idx++;
      } else if (char === "'") {
        inSingleQuotedString = false;
      }
      continue;
    }

    if (inDoubleQuotedString) {
      if (char === "\\") {
        idx++;
      } else if (char === '"') {
        inDoubleQuotedString = false;
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      idx++;
      continue;
    }

    if (char === "#" && next !== "[") {
      inLineComment = true;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      idx++;
      continue;
    }

    if (char === "<" && source.slice(idx, idx + 3) === "<<<") {
      const tagMatch = /^<<<[ \t]*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?/.exec(
        source.slice(idx),
      );
      if (tagMatch !== null) {
        heredocTag = tagMatch[1];
        inHeredoc = true;
        idx += tagMatch[0].length - 1;
        continue;
      }
    }

    if (char === "'") {
      inSingleQuotedString = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuotedString = true;
      continue;
    }

    if (char === "{") {
      depth++;
      bodyStarted = true;
    } else if (char === "}") {
      depth--;
      if (bodyStarted && depth === 0) {
        return source.slice(start, idx + 1);
      }
    }
  }

  throw new Error(
    `Expected function body starting at ${start} to have a complete body`,
  );
}

function isoDaysAgo(days: number): string {
  const ms = Date.now() - days * 86400000;
  return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

function isoDaysFromNow(days: number): string {
  return isoDaysAgo(-days);
}

/**
 * Two categories ("messaging", "browser") with active alternatives and one
 * active US benchmark entry.
 * Diverse statuses to exercise every bucket.
 */
function baselineScenario(): Scenario {
  return {
    catalogEntries: [
      {
        id: 1,
        slug: "alpha-msg",
        name: "Alpha Msg",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 2,
        slug: "bravo-msg",
        name: "Bravo Msg",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 3,
        slug: "ciao-browse",
        name: "Ciao Browse",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 4,
        slug: "delta-browse",
        name: "Delta Browse",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 5,
        slug: "us-vendor",
        name: "US Vendor",
        status: "us",
        is_active: 1,
      },
      {
        id: 6,
        slug: "inactive",
        name: "Inactive",
        status: "alternative",
        is_active: 0,
      },
    ],
    entryCategories: [
      { entry_id: 1, category_id: "messaging" },
      { entry_id: 2, category_id: "messaging" },
      { entry_id: 3, category_id: "browser" },
      { entry_id: 4, category_id: "browser" },
      { entry_id: 5, category_id: "messaging" },
      { entry_id: 6, category_id: "messaging" },
    ],
    categories: [
      { id: "messaging", name_en: "Messaging", sort_order: 10 },
      { id: "browser", name_en: "Browser", sort_order: 20 },
    ],
    matrixCriteria: [
      { id: 100, category_id: "messaging", criterion_key: "ownership" },
      { id: 101, category_id: "messaging", criterion_key: "privacy" },
      { id: 200, category_id: "browser", criterion_key: "open-source" },
      { id: 201, category_id: "browser", criterion_key: "telemetry" },
    ],
    // messaging: 3 active matrix entries × 2 criteria = 6 universe rows
    // browser:   2 active alternatives × 2 criteria = 4 universe rows
    matrixFacts: [
      // messaging — entry 1: 1 verified-fresh, 1 verified-stale (counted as stale)
      {
        id: 1,
        entry_id: 1,
        category_id: "messaging",
        criterion_id: 100,
        status: "verified",
        selected_attempt_id: 11,
        deeper_research_next_eligible_at: null,
        source_url: SOURCE_URL_CANARY,
        evidence_excerpt: EVIDENCE_EXCERPT_CANARY,
      },
      {
        id: 2,
        entry_id: 1,
        category_id: "messaging",
        criterion_id: 101,
        status: "verified",
        selected_attempt_id: 12,
        deeper_research_next_eligible_at: null,
        source_url: null,
        evidence_excerpt: null,
      },
      // messaging — entry 2: 1 open, 1 needs-deeper-research (due now)
      {
        id: 3,
        entry_id: 2,
        category_id: "messaging",
        criterion_id: 100,
        status: "open",
        selected_attempt_id: null,
        deeper_research_next_eligible_at: null,
        source_url: null,
        evidence_excerpt: null,
      },
      {
        id: 4,
        entry_id: 2,
        category_id: "messaging",
        criterion_id: 101,
        status: "needs-deeper-research",
        selected_attempt_id: null,
        deeper_research_next_eligible_at: null,
        source_url: null,
        evidence_excerpt: null,
      },
      // browser — entry 3: 1 researching, 1 needs-deeper-research (on backoff)
      {
        id: 5,
        entry_id: 3,
        category_id: "browser",
        criterion_id: 200,
        status: "researching",
        selected_attempt_id: null,
        deeper_research_next_eligible_at: null,
        source_url: null,
        evidence_excerpt: null,
      },
      {
        id: 6,
        entry_id: 3,
        category_id: "browser",
        criterion_id: 201,
        status: "needs-deeper-research",
        selected_attempt_id: null,
        deeper_research_next_eligible_at: isoDaysFromNow(7),
        source_url: null,
        evidence_excerpt: null,
      },
      // browser — entry 4: 1 not-applicable, 1 rejected
      {
        id: 7,
        entry_id: 4,
        category_id: "browser",
        criterion_id: 200,
        status: "not-applicable",
        selected_attempt_id: null,
        deeper_research_next_eligible_at: null,
        source_url: null,
        evidence_excerpt: null,
      },
      {
        id: 8,
        entry_id: 4,
        category_id: "browser",
        criterion_id: 201,
        status: "rejected",
        selected_attempt_id: null,
        deeper_research_next_eligible_at: null,
        source_url: null,
        evidence_excerpt: null,
      },
    ],
    matrixFactAttempts: [
      // Verified-fresh: attempt 11 is 5 days old (< 180-day default stale threshold).
      {
        id: 11,
        fact_id: 1,
        status: "accepted",
        created_at: isoDaysAgo(5),
        audit_quote: AUDIT_QUOTE_CANARY,
        raw_response: RAW_RESPONSE_CANARY,
      },
      // Verified-stale: attempt 12 is 365 days old (> 180-day default threshold).
      {
        id: 12,
        fact_id: 2,
        status: "accepted",
        created_at: isoDaysAgo(365),
        audit_quote: AUDIT_QUOTE_CANARY,
        raw_response: RAW_RESPONSE_CANARY,
      },
    ],
    staleThresholdDays: 180,
    connections: 0,
  };
}

function buildBehaviorCode(
  args: string[],
  scenario: Scenario,
  env: Record<string, string> = {},
): string {
  const argv = ["scripts/matrix-progress.php", ...args];

  return `<?php
declare(strict_types=1);

$matrixProgressState = json_decode(${JSON.stringify(JSON.stringify(scenario))}, true, 512, JSON_THROW_ON_ERROR);
$argv = json_decode(${JSON.stringify(JSON.stringify(argv))}, true, 512, JSON_THROW_ON_ERROR);

foreach (json_decode(${JSON.stringify(JSON.stringify(env))}, true, 512, JSON_THROW_ON_ERROR) as $k => $v) {
    putenv($k . '=' . $v);
    $_ENV[$k] = $v;
    $_SERVER[$k] = $v;
}

if (!defined('STDERR')) {
    define('STDERR', fopen('php://stderr', 'wb'));
}
if (!defined('STDOUT')) {
    define('STDOUT', fopen('php://stdout', 'wb'));
}

register_shutdown_function(static function (): void {
    global $matrixProgressState;
    echo "\\n${stateMarker}" . json_encode($matrixProgressState, JSON_THROW_ON_ERROR) . "\\n";
});

final class MatrixProgressTestPdo extends PDO
{
    private array $state;

    public function __construct(array &$state)
    {
        $this->state =& $state;
    }

    public function beginTransaction(): bool { return true; }
    public function commit(): bool { return true; }
    public function rollBack(): bool { return true; }
    public function inTransaction(): bool { return false; }

    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return new MatrixProgressTestStatement($this->state, $query);
    }

    public function exec(string $statement): int|false
    {
        $stmt = new MatrixProgressTestStatement($this->state, $statement);
        $stmt->execute();
        return $stmt->rowCount();
    }
}

final class MatrixProgressTestStatement extends PDOStatement
{
    private array $state;
    private string $sql;
    private array $params = [];
    private array $rows = [];
    private int $cursor = 0;

    public function __construct(array &$state, string $sql)
    {
        $this->state =& $state;
        $this->sql = $sql;
    }

    public function execute(?array $params = null): bool
    {
        $this->params = $params ?? [];
        $sql = mp_norm_sql($this->sql);

        // Forbidden columns — if the implementation tries to select these, we
        // surface a structural violation by returning them filled with canary
        // values. The audit-quote/source-safety tests assert no canary leaks.
        if (
            str_contains($sql, 'audit_quote')
            || str_contains($sql, 'raw_response')
            || str_contains($sql, 'evidence_excerpt')
        ) {
            $this->rows = [[
                'audit_quote' => '${AUDIT_QUOTE_CANARY}',
                'raw_response' => '${RAW_RESPONSE_CANARY}',
                'evidence_excerpt' => '${EVIDENCE_EXCERPT_CANARY}',
                'source_url' => '${SOURCE_URL_CANARY}',
            ]];
            return true;
        }

        // Category validation: SELECT 1 / COUNT(*) / LIMIT 1 from matrix_criteria
        if (
            str_contains($sql, 'matrix_criteria')
            && !str_contains($sql, 'matrix_facts')
            && (
                str_contains($sql, 'select 1')
                || str_contains($sql, 'limit 1')
                || str_contains($sql, 'count(')
            )
        ) {
            $this->rows = mp_validate_category($this->state, $this->params);
            $this->cursor = 0;
            return true;
        }

        // Aggregation query: joins categories ↔ matrix_criteria ↔ matrix_facts
        // and aggregates buckets. Returns one row per category.
        if (
            (str_contains($sql, 'matrix_facts') || str_contains($sql, 'matrix_criteria'))
            && (str_contains($sql, 'group by') || str_contains($sql, 'sum(') || str_contains($sql, 'count('))
        ) {
            $this->rows = mp_aggregate($this->state, $this->sql, $this->params);
            $this->cursor = 0;
            return true;
        }

        $this->rows = [];
        return true;
    }

    public function fetch(
        int $mode = PDO::FETCH_DEFAULT,
        int $cursorOrientation = PDO::FETCH_ORI_NEXT,
        int $cursorOffset = 0,
    ): mixed {
        if (!array_key_exists($this->cursor, $this->rows)) {
            return false;
        }
        return $this->rows[$this->cursor++];
    }

    public function fetchAll(
        int $mode = PDO::FETCH_DEFAULT,
        mixed ...$args,
    ): array {
        $result = array_slice($this->rows, $this->cursor);
        $this->cursor = count($this->rows);
        return $result;
    }

    public function fetchColumn(int $column = 0): mixed
    {
        if (!array_key_exists($this->cursor, $this->rows)) {
            return false;
        }
        $row = $this->rows[$this->cursor++];
        $values = array_values($row);
        return $values[$column] ?? false;
    }

    public function rowCount(): int
    {
        return count($this->rows);
    }
}

function getDatabaseConnection(): PDO
{
    global $matrixProgressState;
    $matrixProgressState['connections']++;
    return new MatrixProgressTestPdo($matrixProgressState);
}

function mp_norm_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function mp_param(array $params, array $names): mixed
{
    foreach ($names as $name) {
        foreach ([$name, ':' . $name] as $key) {
            if (array_key_exists($key, $params)) {
                return $params[$key];
            }
        }
    }
    return null;
}

function mp_resolve_category(array $params): ?string
{
    $value = mp_param($params, ['category', 'category_id', 'categoryId']);
    return is_string($value) && $value !== '' ? $value : null;
}

function mp_validate_category(array $state, array $params): array
{
    $category = mp_resolve_category($params);
    if ($category === null) {
        return [];
    }
    foreach ($state['matrixCriteria'] as $mc) {
        if ($mc['category_id'] === $category) {
            return [['exists' => 1, 'count' => 1, 'category_id' => $category]];
        }
    }
    return [];
}

function mp_aggregate(array $state, string $rawSql, array $params): array
{
    $categoryFilter = null;
    $normalized = mp_norm_sql($rawSql);
    if (str_contains($normalized, ':category')) {
        $categoryFilter = mp_resolve_category($params);
    }

    $staleDays = mp_param($params, ['stale_days', 'staleDays', 'days']);
    if (!is_int($staleDays) && !ctype_digit((string) $staleDays)) {
        $staleDays = (int) ($state['staleThresholdDays'] ?? 180);
    } else {
        $staleDays = (int) $staleDays;
    }

    $now = time();
    $rows = [];

    foreach ($state['categories'] as $category) {
        if ($categoryFilter !== null && $category['id'] !== $categoryFilter) {
            continue;
        }

        $criteriaIds = [];
        foreach ($state['matrixCriteria'] as $mc) {
            if ($mc['category_id'] === $category['id']) {
                $criteriaIds[] = (int) $mc['id'];
            }
        }
        if ($criteriaIds === []) {
            continue;
        }

        $entryIds = [];
        foreach ($state['entryCategories'] as $ec) {
            if ($ec['category_id'] !== $category['id']) {
                continue;
            }
            foreach ($state['catalogEntries'] as $entry) {
                if (
                    (int) $entry['id'] === (int) $ec['entry_id']
                    && in_array($entry['status'] ?? null, ['alternative', 'us'], true)
                    && (int) ($entry['is_active'] ?? 0) === 1
                ) {
                    $entryIds[] = (int) $entry['id'];
                }
            }
        }

        $expected = count($entryIds) * count($criteriaIds);
        $bucket = [
            'verified' => 0, 'open' => 0, 'researching' => 0,
            'needs_deeper_research' => 0, 'deeper_due' => 0, 'deeper_backoff' => 0,
            'stale_due' => 0, 'not_applicable' => 0, 'rejected' => 0,
            'total' => 0,
        ];

        foreach ($state['matrixFacts'] as $fact) {
            if (!in_array((int) $fact['entry_id'], $entryIds, true)) continue;
            if (!in_array((int) $fact['criterion_id'], $criteriaIds, true)) continue;
            $bucket['total']++;
            $status = (string) $fact['status'];
            switch ($status) {
                case 'verified':
                    $bucket['verified']++;
                    if ($fact['selected_attempt_id'] !== null) {
                        foreach ($state['matrixFactAttempts'] as $att) {
                            if ((int) $att['id'] === (int) $fact['selected_attempt_id']) {
                                $createdTs = strtotime((string) $att['created_at']);
                                if ($createdTs !== false && $createdTs < ($now - $staleDays * 86400)) {
                                    $bucket['stale_due']++;
                                }
                                break;
                            }
                        }
                    }
                    break;
                case 'open':
                    $bucket['open']++;
                    break;
                case 'researching':
                    $bucket['researching']++;
                    break;
                case 'needs-deeper-research':
                    $bucket['needs_deeper_research']++;
                    $next = $fact['deeper_research_next_eligible_at'] ?? null;
                    if ($next === null || strtotime((string) $next) <= $now) {
                        $bucket['deeper_due']++;
                    } else {
                        $bucket['deeper_backoff']++;
                    }
                    break;
                case 'not-applicable':
                    $bucket['not_applicable']++;
                    break;
                case 'rejected':
                    $bucket['rejected']++;
                    break;
            }
        }

        $missing = max(0, $expected - $bucket['total']);

        // Emit several aliases so the implementation can use any of them.
        $rows[] = [
            'category_id' => (string) $category['id'],
            'category_name' => (string) $category['name_en'],
            'expected' => (int) $expected,
            'total' => (int) $bucket['total'],
            'missing' => (int) $missing,
            'verified' => (int) $bucket['verified'],
            'open' => (int) $bucket['open'],
            'open_count' => (int) $bucket['open'],
            'researching' => (int) $bucket['researching'],
            'needs_deeper_research' => (int) $bucket['needs_deeper_research'],
            'needs-deeper-research' => (int) $bucket['needs_deeper_research'],
            'deeper_due' => (int) $bucket['deeper_due'],
            'deeper_backoff' => (int) $bucket['deeper_backoff'],
            'stale_due' => (int) $bucket['stale_due'],
            'not_applicable' => (int) $bucket['not_applicable'],
            'rejected' => (int) $bucket['rejected'],
            'sort_order' => (int) $category['sort_order'],
        ];
    }

    usort($rows, static function ($a, $b) {
        if ($a['sort_order'] !== $b['sort_order']) {
            return $a['sort_order'] <=> $b['sort_order'];
        }
        return strcmp($a['category_id'], $b['category_id']);
    });

    return $rows;
}

${extractAllPhpFunctions(readProgressScript())}

try {
    if (function_exists('runProgress')) {
        runProgress($argv);
    } elseif (function_exists('runMatrixProgress')) {
        runMatrixProgress($argv);
    } else {
        fwrite(STDERR, "Test harness: no recognized entry point function. Define runProgress(\\$argv).\\n");
        exit(1);
    }
} catch (InvalidArgumentException $e) {
    fwrite(STDERR, 'Invalid usage: ' . $e->getMessage() . "\\n");
    fwrite(STDERR, "Run with --help for usage.\\n");
    exit(64);
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\\n");
    exit(1);
}
`;
}

function parseRun(
  stdout: string,
  stderr: string,
  exitCode: number,
): ProgressRunResult {
  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout.split(/\r?\n/);
  const stateLine = lines.find((line) => line.trim().startsWith(stateMarker));

  if (stateLine === undefined) {
    throw new Error(
      `Progress test harness did not emit state. STDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
    );
  }

  const state = JSON.parse(
    stateLine.trim().slice(stateMarker.length),
  ) as Scenario;

  // Strip the state marker line from stdout before downstream parsing.
  const cleanStdout = lines
    .filter((line) => !line.trim().startsWith(stateMarker))
    .join("\n");

  let payload: JsonPayload | undefined;
  const jsonStart = cleanStdout.indexOf("{");
  if (jsonStart !== -1) {
    try {
      payload = JSON.parse(cleanStdout.slice(jsonStart)) as JsonPayload;
    } catch {
      payload = undefined;
    }
  }

  return { exitCode, stderr, stdout: cleanStdout, payload, state };
}

async function runProgress(
  args: string[],
  scenario: Scenario = baselineScenario(),
  env: Record<string, string> = {},
): Promise<ProgressRunResult> {
  const php = await getPhp();
  const response = await php.runStream({
    code: buildBehaviorCode(args, scenario, env),
  });

  return parseRun(
    await response.stdoutText,
    await response.stderrText,
    await response.exitCode,
  );
}

afterAll(async () => {
  if (phpPromise) {
    const php = await phpPromise;
    php.exit(0);
  }
});

describe("matrix-progress CLI contract", () => {
  it("defines the expected PHP CLI entrypoint and reuses the shared DB bootstrap", () => {
    const source = readProgressScript();

    expect(source).toContain("php_sapi_name()");
    expect(source).toContain("require_once __DIR__ . '/../api/bootstrap.php'");
    expect(source).toContain("require_once __DIR__ . '/../api/db.php'");
    expect(source).toContain("getDatabaseConnection()");

    for (const flag of ["--category", "--json", "--help"]) {
      expect(source).toContain(flag);
    }
  });

  it("does not select audit_quote, raw_response, or evidence_excerpt anywhere in the source", () => {
    const source = readProgressScript();
    expect(source).not.toMatch(/audit_quote/i);
    expect(source).not.toMatch(/raw_response/i);
    expect(source).not.toMatch(/evidence_excerpt/i);
  });
});

describe("matrix-progress --help and CLI surface", () => {
  it("--help exits 0, prints usage to stdout, opens no DB connection", async () => {
    const result = await runProgress(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.state.connections).toBe(0);
    expect(result.stdout).toMatch(/--category/);
    expect(result.stdout).toMatch(/--json/);
  });

  it("rejects unknown flags with exit 64 and Invalid usage on stderr", async () => {
    for (const args of [
      ["--unknown"],
      ["positional"],
      ["--category"],
      ["--category", ""],
      ["--category="],
      ["--category", "--json"],
    ]) {
      const result = await runProgress(args);
      expect(result.exitCode, `args=${JSON.stringify(args)}`).toBe(64);
      expect(result.stderr).toContain("Invalid usage:");
    }
  });

  it("exits 64 when --category names a category with no matrix criteria", async () => {
    const result = await runProgress(["--category", "no-such-category"]);
    expect(result.exitCode).toBe(64);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});

describe("matrix-progress aggregate counts", () => {
  it("emits per-category counts that match the fixture statuses (default text + --json agree)", async () => {
    const textResult = await runProgress([]);
    expect(textResult.exitCode).toBe(0);
    expect(textResult.stderr).toBe("");
    expect(textResult.stdout).toMatch(/messaging/);
    expect(textResult.stdout).toMatch(/browser/);

    const jsonResult = await runProgress(["--json"]);
    expect(jsonResult.exitCode).toBe(0);
    expect(jsonResult.payload).toBeDefined();
    const payload = jsonResult.payload!;

    expect(payload.staleAfterDays).toBe(180);
    expect(payload.category).toBeNull();

    const messaging = payload.categories.messaging;
    expect(messaging).toBeDefined();
    expect(messaging.expected).toBe(6); // 3 active matrix entries × 2 criteria
    expect(messaging.total).toBe(4); // US benchmark facts are not seeded in the fixture
    expect(messaging.missing).toBe(2);
    expect(messaging.verified).toBe(2);
    expect(messaging.open).toBe(1);
    expect(messaging.researching).toBe(0);
    expect(messaging.needsDeeperResearch).toBe(1);
    expect(messaging.deeperDue).toBe(1);
    expect(messaging.deeperBackoff).toBe(0);
    expect(messaging.staleDue).toBe(1); // verified-but-365-days-old
    expect(messaging.notApplicable).toBe(0);
    expect(messaging.rejected).toBe(0);

    const browser = payload.categories.browser;
    expect(browser).toBeDefined();
    expect(browser.expected).toBe(4);
    expect(browser.total).toBe(4);
    expect(browser.verified).toBe(0);
    expect(browser.open).toBe(0);
    expect(browser.researching).toBe(1);
    expect(browser.needsDeeperResearch).toBe(1);
    expect(browser.deeperDue).toBe(0);
    expect(browser.deeperBackoff).toBe(1); // next_eligible_at in the future
    expect(browser.staleDue).toBe(0);
    expect(browser.notApplicable).toBe(1);
    expect(browser.rejected).toBe(1);

    // Totals match the sum across categories.
    expect(payload.totals.verified).toBe(2);
    expect(payload.totals.open).toBe(1);
    expect(payload.totals.researching).toBe(1);
    expect(payload.totals.needsDeeperResearch).toBe(2);
    expect(payload.totals.staleDue).toBe(1);
    expect(payload.totals.rejected).toBe(1);
    expect(payload.totals.notApplicable).toBe(1);
  });

  it("includes active US benchmark entries and excludes inactive entries from expected and total", async () => {
    // Baseline has entry 5 (status='us') and entry 6 (is_active=0) — both
    // assigned to messaging. The US entry counts; the inactive one does not.
    const result = await runProgress(["--json"]);
    expect(result.exitCode).toBe(0);
    const messaging = result.payload!.categories.messaging;
    expect(messaging.expected).toBe(6); // entries 1, 2, and active US entry 5 count
    expect(messaging.total).toBe(4);
  });

  it("scopes the report to a single category when --category is supplied", async () => {
    const result = await runProgress(["--category", "browser", "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = result.payload!;
    expect(payload.category).toBe("browser");
    expect(Object.keys(payload.categories)).toEqual(["browser"]);
    expect(payload.categories.messaging).toBeUndefined();
    // Totals reflect only the in-scope category.
    expect(payload.totals.researching).toBe(1);
    expect(payload.totals.rejected).toBe(1);
    expect(payload.totals.verified).toBe(0);
  });

  it("--json output is parseable JSON; default text output is NOT pure JSON", async () => {
    const jsonResult = await runProgress(["--json"]);
    expect(jsonResult.exitCode).toBe(0);
    expect(jsonResult.payload).toBeDefined();
    // payload must include the required envelope keys.
    expect(jsonResult.payload).toHaveProperty("generatedAt");
    expect(jsonResult.payload).toHaveProperty("staleAfterDays");
    expect(jsonResult.payload).toHaveProperty("category");
    expect(jsonResult.payload).toHaveProperty("categories");
    expect(jsonResult.payload).toHaveProperty("totals");

    const textResult = await runProgress([]);
    expect(textResult.exitCode).toBe(0);
    // Text output must contain human-readable lines, not a single JSON doc.
    expect(textResult.stdout).toMatch(/messaging/);
    expect(textResult.stdout).toMatch(/verified/i);
    expect(() => JSON.parse(textResult.stdout.trim())).toThrow();
  });
});

describe("matrix-progress source/evidence safety", () => {
  it("never leaks audit_quote, raw_response, evidence_excerpt, or source_url canaries to stdout/stderr (text mode)", async () => {
    const result = await runProgress([]);
    expect(result.exitCode).toBe(0);
    const combined = result.stdout + result.stderr;
    expect(combined).not.toContain(AUDIT_QUOTE_CANARY);
    expect(combined).not.toContain(RAW_RESPONSE_CANARY);
    expect(combined).not.toContain(EVIDENCE_EXCERPT_CANARY);
    expect(combined).not.toContain(SOURCE_URL_CANARY);
  });

  it("never leaks audit_quote, raw_response, evidence_excerpt, or source_url canaries (JSON mode)", async () => {
    const result = await runProgress(["--json"]);
    expect(result.exitCode).toBe(0);
    const combined = result.stdout + result.stderr;
    expect(combined).not.toContain(AUDIT_QUOTE_CANARY);
    expect(combined).not.toContain(RAW_RESPONSE_CANARY);
    expect(combined).not.toContain(EVIDENCE_EXCERPT_CANARY);
    expect(combined).not.toContain(SOURCE_URL_CANARY);
  });
});

describe("matrix-progress bucket distinctness", () => {
  it("counts stale/recheck-due as a subset of verified, distinct from open and needs-deeper-research", async () => {
    const result = await runProgress(["--json"]);
    expect(result.exitCode).toBe(0);
    const m = result.payload!.categories.messaging;
    // stale_due is only counted from verified — never from open or needs-deeper-research
    expect(m.staleDue).toBeLessThanOrEqual(m.verified);
    expect(m.staleDue + m.open + m.needsDeeperResearch).toBeLessThanOrEqual(
      m.total,
    );
    // verified + open + researching + needs-deeper-research + not-applicable + rejected == total
    const summed =
      m.verified +
      m.open +
      m.researching +
      m.needsDeeperResearch +
      m.notApplicable +
      m.rejected;
    expect(summed).toBe(m.total);
    // deeper_due + deeper_backoff == needs_deeper_research
    expect(m.deeperDue + m.deeperBackoff).toBe(m.needsDeeperResearch);
  });
});

describe("matrix-progress empty matrix edge case", () => {
  it("returns zero counts (no crash) when the universe is empty", async () => {
    const scenario = baselineScenario();
    scenario.catalogEntries = [];
    scenario.entryCategories = [];
    scenario.matrixFacts = [];
    scenario.matrixFactAttempts = [];

    const result = await runProgress(["--json"], scenario);
    expect(result.exitCode).toBe(0);
    expect(result.payload).toBeDefined();
    expect(result.payload!.totals.verified).toBe(0);
    expect(result.payload!.totals.open).toBe(0);
    expect(result.payload!.totals.needsDeeperResearch).toBe(0);
    expect(result.payload!.totals.staleDue).toBe(0);
  });
});

describe("matrix-progress stale threshold override", () => {
  it("respects MATRIX_FACT_STALE_AFTER_DAYS env var (smaller threshold flips more verified rows to stale)", async () => {
    // Default 180-day threshold → 1 stale row (365 days old).
    // With threshold=3 → both verified attempts (5 days, 365 days) are stale.
    const result = await runProgress(["--json"], baselineScenario(), {
      MATRIX_FACT_STALE_AFTER_DAYS: "3",
    });

    expect(result.exitCode).toBe(0);
    expect(result.payload!.staleAfterDays).toBe(3);
    expect(result.payload!.categories.messaging.staleDue).toBe(2);
  });
});

describe("matrix-progress top unresolved categories", () => {
  it("--json includes a top-unresolved list ordered by unresolved-count descending with alphabetical tiebreaker", async () => {
    // Baseline messaging: open=1, needs-deeper-research=1, stale=1 → unresolved=3.
    // Baseline browser:   researching=1, needs-deeper-research=1 → unresolved=2.
    // Messaging therefore ranks before browser.
    const result = await runProgress(["--json"]);
    expect(result.exitCode).toBe(0);
    const top = result.payload!.topUnresolved;
    expect(top).toBeDefined();
    expect(Array.isArray(top)).toBe(true);
    expect(top!.length).toBeGreaterThanOrEqual(2);
    // Descending order
    for (let i = 1; i < top!.length; i++) {
      expect(top![i - 1].unresolved).toBeGreaterThanOrEqual(top![i].unresolved);
    }
    const browserIdx = top!.findIndex((t) => t.categoryId === "browser");
    const messagingIdx = top!.findIndex((t) => t.categoryId === "messaging");
    expect(browserIdx).toBeGreaterThanOrEqual(0);
    expect(messagingIdx).toBeGreaterThanOrEqual(0);
    expect(messagingIdx).toBeLessThan(browserIdx);
  });

  it("reports unresolved counts equal to open + needsDeeperResearch + staleDue per category", async () => {
    // Baseline messaging: open=1, needsDeeperResearch=1, staleDue=1 → 3
    // Baseline browser:   open=0, needsDeeperResearch=1, staleDue=0 → 1
    const result = await runProgress(["--json"]);
    expect(result.exitCode).toBe(0);
    const top = result.payload!.topUnresolved!;
    const lookup = Object.fromEntries(
      top.map((t) => [t.categoryId, t.unresolved]),
    );
    expect(lookup.messaging).toBe(3);
    expect(lookup.browser).toBe(1);
    // Highest first: messaging (3) before browser (1).
    expect(top[0].categoryId).toBe("messaging");
    expect(top[1].categoryId).toBe("browser");
  });
});

describe("matrix-progress inline --category= form", () => {
  it("accepts --category=<id> inline form and scopes the report", async () => {
    const result = await runProgress(["--category=browser", "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = result.payload!;
    expect(payload.category).toBe("browser");
    expect(Object.keys(payload.categories)).toEqual(["browser"]);
    expect(payload.categories.browser.researching).toBe(1);
    expect(payload.categories.browser.rejected).toBe(1);
  });

  it("rejects an unknown category supplied via inline --category=<id> form with exit 64", async () => {
    const result = await runProgress(["--category=no-such-category"]);
    expect(result.exitCode).toBe(64);
    expect(result.stderr).toContain("Invalid usage:");
  });
});

describe("matrix-progress text mode renders the actual counts", () => {
  it("text output shows per-category, totals, and top-unresolved counts that match the JSON payload", async () => {
    const textResult = await runProgress([]);
    expect(textResult.exitCode).toBe(0);
    const out = textResult.stdout;

    // Per-category block — messaging: verified=2, open=1, researching=0,
    // needs-deeper-research=1 (due now=1, on backoff=0), stale-due=1.
    expect(out).toMatch(/messaging\b/);
    expect(out).toMatch(/Messaging/);
    expect(out).toMatch(/verified:\s*2/);
    expect(out).toMatch(/open:\s*1/);
    expect(out).toMatch(/needs-deeper-research:\s*1/);
    expect(out).toMatch(/due now:\s*1/);
    expect(out).toMatch(/on backoff:\s*1/); // from the browser block
    expect(out).toMatch(/stale\/due-for-recheck:\s*1/);

    // Totals section — sum across categories.
    expect(out).toMatch(/Totals/);
    // Top-unresolved list — messaging dominates with unresolved=3.
    expect(out).toMatch(/Top unresolved categories/);
    expect(out).toMatch(/messaging:\s*unresolved=3/);
    expect(out).toMatch(/browser:\s*unresolved=1/);

    // Stale threshold echoed in the header.
    expect(out).toMatch(/Stale threshold:\s*180 days/);
    // No category filter when none supplied.
    expect(out).toMatch(/Category filter:\s*none/);
  });
});

describe("matrix-progress browser bucket invariants", () => {
  it("browser status buckets sum to total and deeper_due + deeper_backoff == needsDeeperResearch", async () => {
    const result = await runProgress(["--json"]);
    expect(result.exitCode).toBe(0);
    const b = result.payload!.categories.browser;
    const summed =
      b.verified +
      b.open +
      b.researching +
      b.needsDeeperResearch +
      b.notApplicable +
      b.rejected;
    expect(summed).toBe(b.total);
    expect(b.deeperDue + b.deeperBackoff).toBe(b.needsDeeperResearch);
    // Browser has no verified facts, so stale-due must be zero.
    expect(b.staleDue).toBe(0);
    expect(b.verified).toBe(0);
  });
});

describe("matrix-progress invalid stale-threshold env var", () => {
  it("falls back to the 180-day default when MATRIX_FACT_STALE_AFTER_DAYS is non-integer", async () => {
    const result = await runProgress(["--json"], baselineScenario(), {
      MATRIX_FACT_STALE_AFTER_DAYS: "not-a-number",
    });
    expect(result.exitCode).toBe(0);
    expect(result.payload!.staleAfterDays).toBe(180);
    // With the 180-day default, only the 365-day-old verified fact is stale.
    expect(result.payload!.categories.messaging.staleDue).toBe(1);
  });

  it("falls back to the 180-day default when MATRIX_FACT_STALE_AFTER_DAYS is zero or negative", async () => {
    const result = await runProgress(["--json"], baselineScenario(), {
      MATRIX_FACT_STALE_AFTER_DAYS: "0",
    });
    expect(result.exitCode).toBe(0);
    expect(result.payload!.staleAfterDays).toBe(180);
  });
});
