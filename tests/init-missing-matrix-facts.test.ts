import { existsSync, readFileSync } from "node:fs";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Issue #469 — Automatically initialize matrix facts for new entries and criteria.
 *
 * Behavioral contract (TDD red phase):
 *   A standalone CLI script `scripts/init-missing-matrix-facts.php` closes
 *   the gap between catalog state and `matrix_facts`. It is idempotent,
 *   decoupled from import/migration boot, and preserves any existing fact
 *   row regardless of status.
 *
 *   Inputs / flags:
 *     --category <id>   Restrict work to one matrix-enabled category.
 *     --dry-run         Compute gap counts; insert nothing.
 *     --help            Print usage; exit 0.
 *
 *   Exit codes (matches `scripts/matrix-research-select.php`):
 *     0  Success.
 *     64 Invalid CLI usage (unknown flag, empty value, unknown category).
 *     1  Database or runtime failure.
 *
 *   Output:
 *     A JSON payload to stdout containing at minimum:
 *       { inserted: <int>, dryRun: <bool>, category: <id|null>,
 *         perCategory: { <category_id>: <int>, ... } }
 *
 *   Rows seeded for each (entry_id, category_id, criterion_id) tuple
 *   where:
 *     - ce.status IN ('alternative', 'us') AND ce.is_active = 1
 *     - ec.entry_id = ce.id (the entry is mapped to category_id)
 *     - mc.category_id = ec.category_id (criterion lives in that category)
 *     - no existing matrix_facts row for (entry_id, criterion_id)
 *   Inserted facts have status = 'open'.
 */

const initScriptUrl = new URL(
  "../scripts/init-missing-matrix-facts.php",
  import.meta.url,
);
const stateMarker = "__INIT_FACTS_STATE__";

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

type MatrixCriterion = {
  id: number;
  category_id: string;
  criterion_key: string;
};

type MatrixFact = {
  id: number;
  entry_id: number;
  category_id: string;
  criterion_id: number;
  status: MatrixFactStatus;
  value_text: string | null;
  selected_attempt_id: number | null;
};

type Scenario = {
  catalogEntries: CatalogEntry[];
  entryCategories: EntryCategory[];
  matrixCriteria: MatrixCriterion[];
  matrixFacts: MatrixFact[];
  transactions: string[];
  inserts: Array<{
    entry_id: number;
    category_id: string;
    criterion_id: number;
    status: MatrixFactStatus;
  }>;
  connections: number;
  nextFactId: number;
};

type InitPayload = {
  inserted: number;
  dryRun: boolean;
  category: string | null;
  perCategory: Record<string, number>;
};

type InitRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  payload?: InitPayload;
  state: Scenario;
};

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime("8.3").then((runtime) => {
    const php = new PHP(runtime);
    useHostFilesystem(php);
    return php;
  });

  return phpPromise;
}

function readInitScript(): string {
  expect(
    existsSync(initScriptUrl),
    "Expected scripts/init-missing-matrix-facts.php to define the init-missing-matrix-facts CLI",
  ).toBe(true);

  return readFileSync(initScriptUrl, "utf8");
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

function baselineScenario(): Scenario {
  return {
    catalogEntries: [
      {
        id: 1,
        slug: "alpha-mail",
        name: "Alpha Mail",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 2,
        slug: "bravo-browser",
        name: "Bravo Browser",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 3,
        slug: "inactive-mail",
        name: "Inactive Mail",
        status: "alternative",
        is_active: 0,
      },
      {
        id: 4,
        slug: "us-vendor",
        name: "A US Vendor",
        status: "us",
        is_active: 1,
      },
      {
        id: 5,
        slug: "denied-vendor",
        name: "Denied Vendor",
        status: "denied",
        is_active: 1,
      },
    ],
    entryCategories: [
      { entry_id: 1, category_id: "email" },
      { entry_id: 2, category_id: "browser" },
      { entry_id: 3, category_id: "email" },
      { entry_id: 4, category_id: "email" },
      { entry_id: 5, category_id: "browser" },
    ],
    matrixCriteria: [
      { id: 10, category_id: "email", criterion_key: "ownership" },
      { id: 11, category_id: "email", criterion_key: "privacy" },
      { id: 20, category_id: "browser", criterion_key: "privacy" },
    ],
    matrixFacts: [
      {
        id: 100,
        entry_id: 1,
        category_id: "email",
        criterion_id: 10,
        status: "verified",
        value_text: "preserved-by-script",
        selected_attempt_id: 999,
      },
      {
        id: 101,
        entry_id: 1,
        category_id: "email",
        criterion_id: 11,
        status: "researching",
        value_text: null,
        selected_attempt_id: null,
      },
    ],
    transactions: [],
    inserts: [],
    connections: 0,
    nextFactId: 1000,
  };
}

function cloneScenario(s: Scenario): Scenario {
  return JSON.parse(JSON.stringify(s)) as Scenario;
}

function buildBehaviorCode(args: string[], scenario: Scenario): string {
  const argv = ["scripts/init-missing-matrix-facts.php", ...args];

  return `<?php
declare(strict_types=1);

$initMatrixFactsState = json_decode(${JSON.stringify(
    JSON.stringify(scenario),
  )}, true, 512, JSON_THROW_ON_ERROR);
$argv = json_decode(${JSON.stringify(JSON.stringify(argv))}, true, 512, JSON_THROW_ON_ERROR);

if (!defined('STDERR')) {
    define('STDERR', fopen('php://stderr', 'wb'));
}

if (!defined('STDOUT')) {
    define('STDOUT', fopen('php://stdout', 'wb'));
}

register_shutdown_function(static function (): void {
    global $initMatrixFactsState;
    echo "\\n${stateMarker}" . json_encode($initMatrixFactsState, JSON_THROW_ON_ERROR) . "\\n";
});

final class InitMatrixFactsTestPdo extends PDO
{
    private array $state;
    private bool $transactionActive = false;

    public function __construct(array &$state)
    {
        $this->state =& $state;
    }

    public function beginTransaction(): bool
    {
        $this->transactionActive = true;
        $this->state['transactions'][] = 'begin';
        return true;
    }

    public function commit(): bool
    {
        $this->transactionActive = false;
        $this->state['transactions'][] = 'commit';
        return true;
    }

    public function rollBack(): bool
    {
        $this->transactionActive = false;
        $this->state['transactions'][] = 'rollback';
        return true;
    }

    public function inTransaction(): bool
    {
        return $this->transactionActive;
    }

    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return new InitMatrixFactsTestStatement($this->state, $query);
    }

    public function exec(string $statement): int|false
    {
        $stmt = new InitMatrixFactsTestStatement($this->state, $statement);
        $stmt->execute();
        return $stmt->rowCount();
    }
}

final class InitMatrixFactsTestStatement extends PDOStatement
{
    private array $state;
    private string $sql;
    private array $params = [];
    private array $rows = [];
    private int $cursor = 0;
    private int $affectedRows = 0;

    public function __construct(array &$state, string $sql)
    {
        $this->state =& $state;
        $this->sql = $sql;
    }

    public function execute(?array $params = null): bool
    {
        $this->params = $params ?? [];
        $sql = init_facts_test_normalize_sql($this->sql);

        if (str_contains($sql, 'insert') && str_contains($sql, 'matrix_facts')) {
            $this->affectedRows = init_facts_test_perform_insert($this->state, $sql, $this->params);
            $this->rows = [];
            return true;
        }

        if (
            str_contains($sql, 'left join')
            && str_contains($sql, 'matrix_facts')
            && str_contains($sql, 'is null')
        ) {
            $this->rows = init_facts_test_gap_count_rows($this->state, $sql, $this->params);
            $this->cursor = 0;
            return true;
        }

        if (
            str_contains($sql, 'matrix_facts')
            && (str_contains($sql, 'count(') || str_contains($sql, 'group by'))
        ) {
            $this->rows = init_facts_test_gap_count_rows($this->state, $sql, $this->params);
            $this->cursor = 0;
            return true;
        }

        if (
            str_contains($sql, 'matrix_criteria')
            && (str_contains($sql, 'count(') || str_contains($sql, 'limit 1') || str_contains($sql, 'select 1'))
        ) {
            $this->rows = init_facts_test_validate_category($this->state, $this->params);
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
        return $this->affectedRows;
    }
}

function getDatabaseConnection(): PDO
{
    global $initMatrixFactsState;
    $initMatrixFactsState['connections']++;
    return new InitMatrixFactsTestPdo($initMatrixFactsState);
}

function init_facts_test_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function init_facts_test_param(array $params, array $names): mixed
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

/**
 * @return list<array{entry_id:int, category_id:string, criterion_id:int}>
 */
function init_facts_test_candidate_tuples(array $state, ?string $categoryFilter): array
{
    $tuples = [];
    foreach ($state['catalogEntries'] as $entry) {
        if (!in_array($entry['status'] ?? null, ['alternative', 'us'], true)) {
            continue;
        }
        if ((int) ($entry['is_active'] ?? 0) !== 1) {
            continue;
        }
        foreach ($state['entryCategories'] as $ec) {
            if ((int) $ec['entry_id'] !== (int) $entry['id']) {
                continue;
            }
            if ($categoryFilter !== null && $ec['category_id'] !== $categoryFilter) {
                continue;
            }
            foreach ($state['matrixCriteria'] as $mc) {
                if ($mc['category_id'] !== $ec['category_id']) {
                    continue;
                }
                $tuples[] = [
                    'entry_id' => (int) $entry['id'],
                    'category_id' => (string) $ec['category_id'],
                    'criterion_id' => (int) $mc['id'],
                ];
            }
        }
    }
    return $tuples;
}

function init_facts_test_existing_pair(array $state, int $entryId, int $criterionId): bool
{
    foreach ($state['matrixFacts'] as $fact) {
        if ((int) $fact['entry_id'] === $entryId && (int) $fact['criterion_id'] === $criterionId) {
            return true;
        }
    }
    return false;
}

function init_facts_test_resolve_category_filter(string $sql, array $params): ?string
{
    if (!str_contains($sql, ':category')) {
        return null;
    }
    $value = init_facts_test_param($params, ['category', 'category_id', 'categoryId']);
    return is_string($value) ? $value : null;
}

function init_facts_test_perform_insert(array &$state, string $sql, array $params): int
{
    $categoryFilter = init_facts_test_resolve_category_filter($sql, $params);
    $tuples = init_facts_test_candidate_tuples($state, $categoryFilter);
    $inserted = 0;

    foreach ($tuples as $tuple) {
        if (init_facts_test_existing_pair($state, $tuple['entry_id'], $tuple['criterion_id'])) {
            continue;
        }

        $newId = (int) $state['nextFactId'];
        $state['nextFactId'] = $newId + 1;

        $state['matrixFacts'][] = [
            'id' => $newId,
            'entry_id' => $tuple['entry_id'],
            'category_id' => $tuple['category_id'],
            'criterion_id' => $tuple['criterion_id'],
            'status' => 'open',
            'value_text' => null,
            'selected_attempt_id' => null,
        ];

        $state['inserts'][] = [
            'entry_id' => $tuple['entry_id'],
            'category_id' => $tuple['category_id'],
            'criterion_id' => $tuple['criterion_id'],
            'status' => 'open',
        ];

        $inserted++;
    }

    return $inserted;
}

function init_facts_test_gap_count_rows(array $state, string $sql, array $params): array
{
    $categoryFilter = init_facts_test_resolve_category_filter($sql, $params);
    $tuples = init_facts_test_candidate_tuples($state, $categoryFilter);

    $perCategory = [];
    foreach ($tuples as $tuple) {
        if (init_facts_test_existing_pair($state, $tuple['entry_id'], $tuple['criterion_id'])) {
            continue;
        }
        $cat = $tuple['category_id'];
        $perCategory[$cat] = ($perCategory[$cat] ?? 0) + 1;
    }

    $rows = [];
    foreach ($perCategory as $cat => $count) {
        $rows[] = [
            'category_id' => $cat,
            'missing_facts' => $count,
            'gap' => $count,
            'count' => $count,
        ];
    }

    ksort($rows);
    return $rows;
}

function init_facts_test_validate_category(array $state, array $params): array
{
    $category = init_facts_test_param($params, ['category', 'category_id', 'categoryId']);
    if (!is_string($category) || $category === '') {
        return [];
    }
    foreach ($state['matrixCriteria'] as $mc) {
        if ($mc['category_id'] === $category) {
            return [['exists' => 1, 'count' => 1, 'category_id' => $category]];
        }
    }
    return [];
}

${extractAllPhpFunctions(readInitScript())}

try {
    if (function_exists('runInit')) {
        runInit($argv);
    } elseif (function_exists('runInitMissingMatrixFacts')) {
        runInitMissingMatrixFacts($argv);
    } else {
        fwrite(STDERR, "Test harness: no recognized entry point function. Define runInit(\\$argv).\\n");
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
): InitRunResult {
  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const stateLine = lines.find((line) => line.startsWith(stateMarker));

  if (stateLine === undefined) {
    throw new Error(`Init test harness did not emit state: ${stdout}`);
  }

  const payloadLine = lines.find(
    (line) => !line.startsWith(stateMarker) && line.startsWith("{"),
  );

  return {
    exitCode,
    stderr,
    stdout,
    payload:
      payloadLine === undefined
        ? undefined
        : (JSON.parse(payloadLine) as InitPayload),
    state: JSON.parse(stateLine.slice(stateMarker.length)) as Scenario,
  };
}

async function runInit(
  args: string[],
  scenario: Scenario = baselineScenario(),
): Promise<InitRunResult> {
  const php = await getPhp();
  const response = await php.runStream({
    code: buildBehaviorCode(args, scenario),
  });

  return parseRun(
    await response.stdoutText,
    await response.stderrText,
    await response.exitCode,
  );
}

function insertsByCategory(
  state: Scenario,
): Record<string, Array<{ entry_id: number; criterion_id: number }>> {
  const grouped: Record<
    string,
    Array<{ entry_id: number; criterion_id: number }>
  > = {};
  for (const ins of state.inserts) {
    grouped[ins.category_id] ??= [];
    grouped[ins.category_id].push({
      entry_id: ins.entry_id,
      criterion_id: ins.criterion_id,
    });
  }
  return grouped;
}

afterAll(async () => {
  if (phpPromise) {
    const php = await phpPromise;
    php.exit(0);
  }
});

describe("init-missing-matrix-facts CLI contract", () => {
  it("defines the expected PHP CLI entrypoint, requires the shared DB bootstrap, and supports operator flags", () => {
    const source = readInitScript();

    expect(source).toContain("php_sapi_name()");
    expect(source).toContain("require_once __DIR__ . '/../api/bootstrap.php'");
    expect(source).toContain("require_once __DIR__ . '/../api/db.php'");
    expect(source).toContain("getDatabaseConnection()");
    expect(source).toMatch(/INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?/i);
    expect(source).toMatch(/'open'/);

    for (const flag of ["--category", "--dry-run", "--help"]) {
      expect(source).toContain(flag);
    }
  });

  it("opens a database connection and inserts only the gap rows for the baseline scenario", async () => {
    const scenario = baselineScenario();
    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.state.connections).toBeGreaterThan(0);

    // Baseline: entry 1 already has facts for both email criteria.
    // Entries 3 and 5 are inactive/denied. Gaps are entry 2/browser and entry 4/email.
    expect(result.state.inserts).toEqual([
      {
        entry_id: 2,
        category_id: "browser",
        criterion_id: 20,
        status: "open",
      },
      {
        entry_id: 4,
        category_id: "email",
        criterion_id: 10,
        status: "open",
      },
      {
        entry_id: 4,
        category_id: "email",
        criterion_id: 11,
        status: "open",
      },
    ]);
  });
});

describe("init-missing-matrix-facts seeding behavior", () => {
  it("creates a fact for every criterion in every matrix-enabled category for a fully ungapped entry", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);

    const grouped = insertsByCategory(result.state);

    expect(grouped.email).toEqual(
      expect.arrayContaining([
        { entry_id: 1, criterion_id: 10 },
        { entry_id: 1, criterion_id: 11 },
        { entry_id: 4, criterion_id: 10 },
        { entry_id: 4, criterion_id: 11 },
      ]),
    );
    expect(grouped.email).toHaveLength(4);

    expect(grouped.browser).toEqual([{ entry_id: 2, criterion_id: 20 }]);

    expect(result.state.inserts.every((ins) => ins.status === "open")).toBe(
      true,
    );
  });

  it("creates exactly one new fact when a single criterion is added to an existing category", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [
      {
        id: 200,
        entry_id: 1,
        category_id: "email",
        criterion_id: 10,
        status: "verified",
        value_text: "preserved",
        selected_attempt_id: 1,
      },
      {
        id: 201,
        entry_id: 1,
        category_id: "email",
        criterion_id: 11,
        status: "open",
        value_text: null,
        selected_attempt_id: null,
      },
      {
        id: 202,
        entry_id: 2,
        category_id: "browser",
        criterion_id: 20,
        status: "open",
        value_text: null,
        selected_attempt_id: null,
      },
      {
        id: 203,
        entry_id: 4,
        category_id: "email",
        criterion_id: 10,
        status: "open",
        value_text: null,
        selected_attempt_id: null,
      },
      {
        id: 204,
        entry_id: 4,
        category_id: "email",
        criterion_id: 11,
        status: "open",
        value_text: null,
        selected_attempt_id: null,
      },
    ];
    scenario.matrixCriteria.push({
      id: 21,
      category_id: "browser",
      criterion_key: "open-source",
    });

    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.state.inserts).toEqual([
      {
        entry_id: 2,
        category_id: "browser",
        criterion_id: 21,
        status: "open",
      },
    ]);
  });

  it("preserves existing facts in any status — verified rows keep their values, non-open rows are not duplicated", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [
      {
        id: 300,
        entry_id: 1,
        category_id: "email",
        criterion_id: 10,
        status: "verified",
        value_text: "preserved-verified-value",
        selected_attempt_id: 555,
      },
      {
        id: 301,
        entry_id: 1,
        category_id: "email",
        criterion_id: 11,
        status: "researching",
        value_text: null,
        selected_attempt_id: null,
      },
      {
        id: 302,
        entry_id: 2,
        category_id: "browser",
        criterion_id: 20,
        status: "rejected",
        value_text: "rejected-text",
        selected_attempt_id: 777,
      },
      {
        id: 303,
        entry_id: 4,
        category_id: "email",
        criterion_id: 10,
        status: "open",
        value_text: null,
        selected_attempt_id: null,
      },
      {
        id: 304,
        entry_id: 4,
        category_id: "email",
        criterion_id: 11,
        status: "open",
        value_text: null,
        selected_attempt_id: null,
      },
    ];

    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.state.inserts).toEqual([]);

    const verified = result.state.matrixFacts.find((f) => f.id === 300);
    expect(verified).toMatchObject({
      status: "verified",
      value_text: "preserved-verified-value",
      selected_attempt_id: 555,
    });

    const researching = result.state.matrixFacts.find((f) => f.id === 301);
    expect(researching?.status).toBe("researching");

    const rejected = result.state.matrixFacts.find((f) => f.id === 302);
    expect(rejected).toMatchObject({
      status: "rejected",
      value_text: "rejected-text",
      selected_attempt_id: 777,
    });
  });

  it("is idempotent — re-running on a fixture where no gaps remain inserts zero rows", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const first = await runInit([], cloneScenario(scenario));
    expect(first.exitCode).toBe(0);
    expect(first.state.inserts.length).toBeGreaterThan(0);

    const sealed = cloneScenario(scenario);
    sealed.matrixFacts = first.state.matrixFacts.map((fact) => ({
      ...fact,
    }));
    sealed.nextFactId = first.state.nextFactId;

    const second = await runInit([], sealed);
    expect(second.exitCode).toBe(0);
    expect(second.state.inserts).toEqual([]);
  });

  it("creates facts for every matrix-enabled category an entry belongs to (primary + secondary memberships)", async () => {
    const scenario = baselineScenario();
    scenario.catalogEntries = [
      {
        id: 7,
        slug: "multi-cat",
        name: "Multi Cat",
        status: "alternative",
        is_active: 1,
      },
    ];
    scenario.entryCategories = [
      { entry_id: 7, category_id: "email" },
      { entry_id: 7, category_id: "browser" },
    ];
    scenario.matrixFacts = [];

    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);

    const grouped = insertsByCategory(result.state);
    expect(grouped.email).toEqual(
      expect.arrayContaining([
        { entry_id: 7, criterion_id: 10 },
        { entry_id: 7, criterion_id: 11 },
      ]),
    );
    expect(grouped.email).toHaveLength(2);
    expect(grouped.browser).toEqual([{ entry_id: 7, criterion_id: 20 }]);
  });

  it("does not create facts for inactive or denied entries, but includes active US entries", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);

    const insertedEntryIds = new Set(
      result.state.inserts.map((i) => i.entry_id),
    );

    expect(insertedEntryIds.has(3)).toBe(false);
    expect(insertedEntryIds.has(5)).toBe(false);

    expect(insertedEntryIds.has(1)).toBe(true);
    expect(insertedEntryIds.has(2)).toBe(true);
    expect(insertedEntryIds.has(4)).toBe(true);
  });
});

describe("init-missing-matrix-facts --dry-run", () => {
  it("performs no inserts and emits a per-category gap count payload to stdout", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit(["--dry-run"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.state.inserts).toEqual([]);
    expect(result.state.matrixFacts).toEqual([]);
    expect(result.state.transactions).not.toContain("commit");

    expect(result.payload).toBeDefined();
    const payload = result.payload!;
    expect(payload.dryRun).toBe(true);
    expect(payload.inserted).toBe(0);
    expect(payload.perCategory.email).toBe(4);
    expect(payload.perCategory.browser).toBe(1);
  });
});

describe("init-missing-matrix-facts --category", () => {
  it("inserts gap facts only for the named category when --category is supplied", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit(["--category", "email"], scenario);

    expect(result.exitCode).toBe(0);

    const insertedCategories = new Set(
      result.state.inserts.map((i) => i.category_id),
    );
    expect(insertedCategories.has("email")).toBe(true);
    expect(insertedCategories.has("browser")).toBe(false);
  });

  it("supports the --category=<id> inline syntax", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit(["--category=browser"], scenario);

    expect(result.exitCode).toBe(0);

    const insertedCategories = new Set(
      result.state.inserts.map((i) => i.category_id),
    );
    expect(insertedCategories.has("browser")).toBe(true);
    expect(insertedCategories.has("email")).toBe(false);
  });

  it("exits 64 with a helpful stderr message and no inserts when --category names a category that has no matrix criteria", async () => {
    const scenario = baselineScenario();

    const result = await runInit(["--category", "no-such-category"], scenario);

    expect(result.exitCode).toBe(64);
    expect(result.state.inserts).toEqual([]);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});

describe("init-missing-matrix-facts CLI surface", () => {
  it("--help exits 0 with usage text on stdout and performs no work", async () => {
    const scenario = baselineScenario();
    const result = await runInit(["--help"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.state.inserts).toEqual([]);
    expect(result.state.transactions).toEqual([]);
    expect(result.stdout).toMatch(/--category/);
    expect(result.stdout).toMatch(/--dry-run/);
  });

  it("rejects unknown flags and positional arguments with exit 64 and no inserts", async () => {
    for (const args of [
      ["--unknown"],
      ["positional"],
      ["--category"],
      ["--category", ""],
    ]) {
      const scenario = baselineScenario();
      const result = await runInit(args, scenario);

      expect(result.exitCode).toBe(64);
      expect(result.state.inserts).toEqual([]);
      expect(result.stderr).toContain("Invalid usage:");
    }
  });

  it("rejects --category= with an empty inline value (exit 64, no inserts)", async () => {
    const scenario = baselineScenario();
    const result = await runInit(["--category="], scenario);

    expect(result.exitCode).toBe(64);
    expect(result.state.inserts).toEqual([]);
    expect(result.stderr).toContain("Invalid usage:");
  });

  it("rejects --category when the next token is another flag (exit 64, no inserts)", async () => {
    const scenario = baselineScenario();
    const result = await runInit(["--category", "--dry-run"], scenario);

    expect(result.exitCode).toBe(64);
    expect(result.state.inserts).toEqual([]);
    expect(result.stderr).toContain("Invalid usage:");
  });

  it("--help does not open a database connection", async () => {
    const scenario = baselineScenario();
    const result = await runInit(["--help"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.state.connections).toBe(0);
  });
});

describe("init-missing-matrix-facts JSON payload and transaction lifecycle", () => {
  it("emits a payload with the correct inserted/dryRun/category/perCategory shape for a normal insert run", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.payload).toBeDefined();

    const payload = result.payload!;
    expect(payload.dryRun).toBe(false);
    expect(payload.category).toBeNull();
    expect(payload.inserted).toBe(result.state.inserts.length);
    expect(payload.inserted).toBe(5); // entries 1 and 4 × 2 email criteria + entry 2 × 1 browser criterion
    expect(payload.perCategory.email).toBe(4);
    expect(payload.perCategory.browser).toBe(1);
  });

  it("wraps the insert path in a begin/commit transaction", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit([], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.state.transactions).toContain("begin");
    expect(result.state.transactions).toContain("commit");
    expect(result.state.transactions).not.toContain("rollback");
    // begin must precede commit
    expect(result.state.transactions.indexOf("begin")).toBeLessThan(
      result.state.transactions.indexOf("commit"),
    );
  });

  it("reflects the supplied --category in the payload and restricts perCategory to that category", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit(["--category", "browser"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.payload).toBeDefined();

    const payload = result.payload!;
    expect(payload.category).toBe("browser");
    expect(payload.dryRun).toBe(false);
    expect(payload.perCategory.browser).toBe(1);
    expect(payload.perCategory.email).toBeUndefined();
  });

  it("--dry-run combined with --category reports only that category's gap count and inserts nothing", async () => {
    const scenario = baselineScenario();
    scenario.matrixFacts = [];

    const result = await runInit(["--dry-run", "--category=email"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.state.inserts).toEqual([]);
    expect(result.state.transactions).not.toContain("commit");

    expect(result.payload).toBeDefined();
    const payload = result.payload!;
    expect(payload.dryRun).toBe(true);
    expect(payload.inserted).toBe(0);
    expect(payload.category).toBe("email");
    expect(payload.perCategory.email).toBe(4);
    expect(payload.perCategory.browser).toBeUndefined();
  });
});
