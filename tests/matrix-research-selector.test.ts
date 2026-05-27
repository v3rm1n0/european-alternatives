import { existsSync, readFileSync } from "node:fs";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

const selectorScriptUrl = new URL(
  "../scripts/matrix-research-select.php",
  import.meta.url,
);
const stateMarker = "__SELECTOR_STATE__";

let phpPromise: Promise<PHP> | undefined;

type MatrixFactStatus =
  | "open"
  | "researching"
  | "researched"
  | "verified"
  | "rejected"
  | "needs-deeper-research"
  | "not-applicable";

type SelectorScenario = {
  categories: Array<{
    id: string;
    name_en: string;
    sort_order: number;
  }>;
  entries: Array<{
    id: number;
    slug: string;
    name: string;
    status: string;
    is_active: number;
  }>;
  criteria: Array<{
    id: number;
    category_id: string;
    criterion_key: string;
    label_en: string;
    value_type: string;
    sort_order: number;
  }>;
  facts: Array<{
    id: number;
    category_id: string;
    entry_id: number;
    criterion_id: number;
    status: MatrixFactStatus;
  }>;
  transactions: string[];
  updates: Array<{
    affected: number;
    factId: number | null;
  }>;
  connections: number;
  forceZeroAffectedFactIds?: number[];
};

type SelectorPayload = {
  factId: number;
  categoryId: string;
  categoryName: string;
  entrySlug: string;
  entryName: string;
  criterionKey: string;
  criterionLabel: string;
  valueType: string;
  previousStatus: MatrixFactStatus;
  status: MatrixFactStatus;
  dryRun: boolean;
};

type SelectorRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  payload?: SelectorPayload;
  state: SelectorScenario;
};

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime("8.3").then((runtime) => {
    const php = new PHP(runtime);
    useHostFilesystem(php);
    return php;
  });

  return phpPromise;
}

function readSelectorScript(): string {
  expect(
    existsSync(selectorScriptUrl),
    "Expected scripts/matrix-research-select.php to define the matrix research selector CLI",
  ).toBe(true);

  return readFileSync(selectorScriptUrl, "utf8");
}

function getFunctionSource(source: string, functionName: string): string {
  const start = source.indexOf(`function ${functionName}(`);
  if (start < 0) {
    throw new Error(
      `Expected scripts/matrix-research-select.php to define ${functionName}()`,
    );
  }

  let depth = 0;
  let bodyStarted = false;
  let inSingleQuotedString = false;
  let inDoubleQuotedString = false;

  for (let idx = start; idx < source.length; idx++) {
    const char = source[idx];
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

  throw new Error(`Expected ${functionName}() to have a complete body`);
}

function extractSelectorRuntimeSource(source: string): string {
  const constants = source.match(
    /const NO_OPEN_FACT = 2;\s*const INVALID_USAGE = 64;/,
  );

  if (constants === null) {
    throw new Error("Expected selector exit-code constants to be defined");
  }

  const functions = [
    "runSelector",
    "parseCliArgs",
    "readRequiredOptionValue",
    "readInlineOptionValue",
    "readSelectorMode",
    "printUsage",
    "stderr",
    "exitNoOpenFact",
    "selectOpenMatrixFact",
    "buildTargetFilters",
    "buildSelectionSql",
    "claimSelectedFact",
    "printSelectedFact",
  ].map((functionName) => getFunctionSource(source, functionName));

  return [constants[0], ...functions].join("\n\n");
}

function selectorScenario(): SelectorScenario {
  return {
    categories: [
      { id: "browser", name_en: "Browsers", sort_order: 20 },
      { id: "email", name_en: "Email", sort_order: 10 },
    ],
    entries: [
      {
        id: 1,
        slug: "inactive-mail",
        name: "Aardvark Inactive",
        status: "alternative",
        is_active: 0,
      },
      {
        id: 2,
        slug: "alpha-mail",
        name: "Alpha Mail",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 3,
        slug: "zeta-mail",
        name: "Zeta Mail",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 4,
        slug: "us-mail",
        name: "A US Vendor",
        status: "us",
        is_active: 1,
      },
      {
        id: 5,
        slug: "bravo-browser",
        name: "Bravo Browser",
        status: "alternative",
        is_active: 1,
      },
    ],
    criteria: [
      {
        id: 10,
        category_id: "email",
        criterion_key: "ownership",
        label_en: "Ownership",
        value_type: "text",
        sort_order: 5,
      },
      {
        id: 11,
        category_id: "email",
        criterion_key: "privacy",
        label_en: "Privacy",
        value_type: "rating",
        sort_order: 10,
      },
      {
        id: 20,
        category_id: "browser",
        criterion_key: "privacy",
        label_en: "Privacy",
        value_type: "rating",
        sort_order: 1,
      },
    ],
    facts: [
      {
        id: 104,
        category_id: "browser",
        entry_id: 5,
        criterion_id: 20,
        status: "open",
      },
      {
        id: 101,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "open",
      },
      {
        id: 102,
        category_id: "email",
        entry_id: 4,
        criterion_id: 10,
        status: "open",
      },
      {
        id: 103,
        category_id: "email",
        entry_id: 3,
        criterion_id: 10,
        status: "open",
      },
      {
        id: 100,
        category_id: "email",
        entry_id: 2,
        criterion_id: 11,
        status: "open",
      },
      {
        id: 99,
        category_id: "email",
        entry_id: 2,
        criterion_id: 10,
        status: "researched",
      },
      {
        id: 105,
        category_id: "email",
        entry_id: 2,
        criterion_id: 10,
        status: "open",
      },
    ],
    transactions: [],
    updates: [],
    connections: 0,
  };
}

function scenarioWithoutOpenFacts(): SelectorScenario {
  const scenario = selectorScenario();
  scenario.facts = scenario.facts.map((fact) => ({
    ...fact,
    status: fact.status === "open" ? "researched" : fact.status,
  }));

  return scenario;
}

function scenarioWithOnlyNeedsDeeperResearchFact(): SelectorScenario {
  const scenario = scenarioWithoutOpenFacts();
  scenario.facts = scenario.facts.map((fact) =>
    fact.id === 105 ? { ...fact, status: "needs-deeper-research" } : fact,
  );

  return scenario;
}

function scenarioWithOpenAndNeedsDeeperResearchFacts(): SelectorScenario {
  const scenario = selectorScenario();
  scenario.facts = scenario.facts.map((fact) =>
    fact.id === 99 ? { ...fact, status: "needs-deeper-research" } : fact,
  );

  return scenario;
}

function buildSelectorBehaviorCode(
  args: string[],
  scenario: SelectorScenario,
): string {
  const argv = ["scripts/matrix-research-select.php", ...args];

  return `<?php
declare(strict_types=1);

$matrixResearchSelectorState = json_decode(${JSON.stringify(
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
    global $matrixResearchSelectorState;
    echo "\\n${stateMarker}" . json_encode($matrixResearchSelectorState, JSON_THROW_ON_ERROR) . "\\n";
});

final class MatrixResearchSelectorTestPdo extends PDO
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
        return new MatrixResearchSelectorTestStatement($this->state, $query);
    }
}

final class MatrixResearchSelectorTestStatement extends PDOStatement
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
        $normalized = matrix_research_selector_test_normalize_sql($this->sql);

        if (str_contains($normalized, 'update matrix_facts')) {
            $this->affectedRows = matrix_research_selector_test_claim_fact(
                $this->state,
                $normalized,
                $this->params,
            );
            $this->rows = [];

            return true;
        }

        $this->rows = matrix_research_selector_test_rows_for_sql(
            $this->state,
            $normalized,
            $this->params,
        );
        $this->cursor = 0;

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

    public function rowCount(): int
    {
        return $this->affectedRows;
    }
}

function getDatabaseConnection(): PDO
{
    global $matrixResearchSelectorState;
    $matrixResearchSelectorState['connections']++;

    return new MatrixResearchSelectorTestPdo($matrixResearchSelectorState);
}

function matrix_research_selector_test_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function matrix_research_selector_test_param(array $params, array $names): mixed
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

function matrix_research_selector_test_find_row(array $rows, string $key, mixed $value): ?array
{
    foreach ($rows as $row) {
        if (($row[$key] ?? null) === $value) {
            return $row;
        }
    }

    return null;
}

function matrix_research_selector_test_rows_for_sql(
    array $state,
    string $normalizedSql,
    array $params,
): array {
    if (!str_contains($normalizedSql, 'from matrix_facts')) {
        return [];
    }

    $category = matrix_research_selector_test_param($params, ['category', 'category_id', 'categoryId']);
    $entrySlug = matrix_research_selector_test_param($params, ['entry_slug', 'entrySlug', 'entry']);
    $criterion = matrix_research_selector_test_param($params, ['criterion', 'criterion_key', 'criterionKey']);
    $rows = [];

    foreach ($state['facts'] as $fact) {
        if (
            str_contains($normalizedSql, "mf.status = 'open'")
            && ($fact['status'] ?? null) !== 'open'
        ) {
            continue;
        }

        if (
            str_contains($normalizedSql, "mf.status = 'needs-deeper-research'")
            && ($fact['status'] ?? null) !== 'needs-deeper-research'
        ) {
            continue;
        }

        if (
            str_contains($normalizedSql, 'mf.status in')
            && str_contains($normalizedSql, "'needs-deeper-research'")
            && !in_array($fact['status'] ?? null, ['open', 'needs-deeper-research'], true)
        ) {
            continue;
        }

        if (
            preg_match('/mf\\.category_id\\s*=\\s*:category\\b/', $normalizedSql) === 1
            && $fact['category_id'] !== $category
        ) {
            continue;
        }

        $entry = matrix_research_selector_test_find_row($state['entries'], 'id', $fact['entry_id']);
        $categoryRow = matrix_research_selector_test_find_row($state['categories'], 'id', $fact['category_id']);
        $criterionRow = matrix_research_selector_test_find_row($state['criteria'], 'id', $fact['criterion_id']);

        if ($entry === null || $categoryRow === null || $criterionRow === null) {
            continue;
        }

        if ($criterionRow['category_id'] !== $fact['category_id']) {
            continue;
        }

        if (
            str_contains($normalizedSql, "ce.status = 'alternative'")
            && ($entry['status'] ?? null) !== 'alternative'
        ) {
            continue;
        }

        if (
            str_contains($normalizedSql, 'ce.is_active = 1')
            && (int) ($entry['is_active'] ?? 0) !== 1
        ) {
            continue;
        }

        if (
            preg_match('/ce\\.slug\\s*=\\s*:entry_slug\\b/', $normalizedSql) === 1
            && $entry['slug'] !== $entrySlug
        ) {
            continue;
        }

        if (
            preg_match('/mc\\.criterion_key\\s*=\\s*:criterion\\b/', $normalizedSql) === 1
            && $criterionRow['criterion_key'] !== $criterion
        ) {
            continue;
        }

        $rows[] = [
            'fact_id' => $fact['id'],
            'fact_status' => $fact['status'],
            'category_id' => $fact['category_id'],
            'category_name' => $categoryRow['name_en'],
            'category_sort_order' => $categoryRow['sort_order'],
            'entry_id' => $entry['id'],
            'entry_slug' => $entry['slug'],
            'entry_name' => $entry['name'],
            'criterion_id' => $criterionRow['id'],
            'criterion_key' => $criterionRow['criterion_key'],
            'criterion_label' => $criterionRow['label_en'],
            'criterion_sort_order' => $criterionRow['sort_order'],
            'value_type' => $criterionRow['value_type'],
        ];
    }

    if (str_contains($normalizedSql, 'order by')) {
        $prioritizesOpenStatus = str_contains(
            $normalizedSql,
            "case mf.status when 'open' then 0 else 1 end",
        );

        usort(
            $rows,
            static fn (array $left, array $right): int => [
                ($prioritizesOpenStatus && $left['fact_status'] === 'open') ? 0 : 1,
                $left['category_sort_order'],
                $left['category_id'],
                $left['entry_name'],
                $left['entry_id'],
                $left['criterion_sort_order'],
                $left['criterion_id'],
                $left['fact_id'],
            ] <=> [
                ($prioritizesOpenStatus && $right['fact_status'] === 'open') ? 0 : 1,
                $right['category_sort_order'],
                $right['category_id'],
                $right['entry_name'],
                $right['entry_id'],
                $right['criterion_sort_order'],
                $right['criterion_id'],
                $right['fact_id'],
            ],
        );
    }

    if (str_contains($normalizedSql, 'limit 1')) {
        return array_slice($rows, 0, 1);
    }

    return $rows;
}

function matrix_research_selector_test_claim_fact(
    array &$state,
    string $normalizedSql,
    array $params,
): int {
    $factId = matrix_research_selector_test_param($params, ['fact_id', 'factId', 'id']);
    $filtersById = preg_match('/\\bid\\s*=\\s*:fact_id\\b/', $normalizedSql) === 1;
    $filtersOpen = preg_match('/\\bstatus\\s*=\\s*\\'open\\'/', $normalizedSql) === 1;
    $filtersRetryable = str_contains($normalizedSql, 'status in')
        && str_contains($normalizedSql, "'open'")
        && str_contains($normalizedSql, "'needs-deeper-research'");
    $setsResearching = preg_match('/\\bstatus\\s*=\\s*\\'researching\\'/', $normalizedSql) === 1;
    $affected = 0;

    if (in_array($factId, $state['forceZeroAffectedFactIds'] ?? [], true)) {
        $state['updates'][] = [
            'affected' => 0,
            'factId' => is_numeric($factId) ? (int) $factId : null,
        ];

        return 0;
    }

    foreach ($state['facts'] as &$fact) {
        if ($filtersById && $fact['id'] !== $factId) {
            continue;
        }

        if ($filtersOpen && ($fact['status'] ?? null) !== 'open') {
            continue;
        }

        if (
            $filtersRetryable
            && !in_array($fact['status'] ?? null, ['open', 'needs-deeper-research'], true)
        ) {
            continue;
        }

        if ($setsResearching) {
            $fact['status'] = 'researching';
            $affected++;
        }
    }
    unset($fact);

    $state['updates'][] = [
        'affected' => $affected,
        'factId' => is_numeric($factId) ? (int) $factId : null,
    ];

    return $affected;
}

${extractSelectorRuntimeSource(readSelectorScript())}

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
`;
}

function parseSelectorRun(
  stdout: string,
  stderr: string,
  exitCode: number,
): SelectorRunResult {
  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const stateLine = lines.find((line) => line.startsWith(stateMarker));

  if (stateLine === undefined) {
    throw new Error(`Selector test harness did not emit state: ${stdout}`);
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
        : (JSON.parse(payloadLine) as SelectorPayload),
    state: JSON.parse(stateLine.slice(stateMarker.length)) as SelectorScenario,
  };
}

async function runSelector(
  args: string[],
  scenario: SelectorScenario = selectorScenario(),
): Promise<SelectorRunResult> {
  const php = await getPhp();
  const response = await php.runStream({
    code: buildSelectorBehaviorCode(args, scenario),
  });

  return parseSelectorRun(
    await response.stdoutText,
    await response.stderrText,
    await response.exitCode,
  );
}

function factStatusById(
  scenario: SelectorScenario,
): Record<string, MatrixFactStatus> {
  return Object.fromEntries(
    scenario.facts.map((fact) => [String(fact.id), fact.status]),
  ) as Record<string, MatrixFactStatus>;
}

afterAll(async () => {
  if (phpPromise) {
    const php = await phpPromise;
    php.exit(0);
  }
});

describe("matrix research selector contract", () => {
  it("defines the expected PHP CLI entrypoint and supported operator flags", () => {
    const source = readSelectorScript();

    expect(source).toContain("php_sapi_name()");
    expect(source).toContain("require_once __DIR__ . '/../api/bootstrap.php'");
    expect(source).toContain("require_once __DIR__ . '/../api/db.php'");
    expect(source).toContain("getDatabaseConnection()");

    for (const option of [
      "--category",
      "--entry",
      "--entry-slug",
      "--criterion",
      "--dry-run",
      "--help",
    ]) {
      expect(source).toContain(option);
    }
  });

  it("automatically selects one deterministic open fact for an active alternative and claims only that fact", async () => {
    const original = selectorScenario();
    const result = await runSelector([], original);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 105,
      categoryId: "email",
      categoryName: "Email",
      entrySlug: "alpha-mail",
      entryName: "Alpha Mail",
      criterionKey: "ownership",
      criterionLabel: "Ownership",
      valueType: "text",
      previousStatus: "open",
      status: "researching",
      dryRun: false,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.updates).toEqual([{ affected: 1, factId: 105 }]);
    expect(factStatusById(result.state)).toEqual({
      ...factStatusById(original),
      "105": "researching",
    });
  });

  it("applies combined category, entry, and criterion targets to select the matching fact", async () => {
    const entrySlugResult = await runSelector([
      "--category",
      "browser",
      "--entry-slug",
      "bravo-browser",
      "--criterion",
      "privacy",
    ]);

    expect(entrySlugResult.exitCode).toBe(0);
    expect(entrySlugResult.payload).toMatchObject({
      factId: 104,
      categoryId: "browser",
      entrySlug: "bravo-browser",
      criterionKey: "privacy",
      status: "researching",
      dryRun: false,
    });
    expect(entrySlugResult.state.updates).toEqual([
      { affected: 1, factId: 104 },
    ]);

    const entryAliasResult = await runSelector([
      "--category=email",
      "--entry=alpha-mail",
      "--criterion=privacy",
    ]);

    expect(entryAliasResult.exitCode).toBe(0);
    expect(entryAliasResult.payload).toMatchObject({
      factId: 100,
      categoryId: "email",
      entrySlug: "alpha-mail",
      criterionKey: "privacy",
      status: "researching",
      dryRun: false,
    });
    expect(entryAliasResult.state.updates).toEqual([
      { affected: 1, factId: 100 },
    ]);
  });

  it("applies partial category, entry, and criterion targets without requiring a full target", async () => {
    const categoryResult = await runSelector(["--category", "browser"]);

    expect(categoryResult.exitCode).toBe(0);
    expect(categoryResult.payload).toMatchObject({
      factId: 104,
      categoryId: "browser",
      entrySlug: "bravo-browser",
      criterionKey: "privacy",
      status: "researching",
    });
    expect(categoryResult.state.updates).toEqual([
      { affected: 1, factId: 104 },
    ]);

    const entryResult = await runSelector(["--entry", "zeta-mail"]);

    expect(entryResult.exitCode).toBe(0);
    expect(entryResult.payload).toMatchObject({
      factId: 103,
      categoryId: "email",
      entrySlug: "zeta-mail",
      criterionKey: "ownership",
      status: "researching",
    });
    expect(entryResult.state.updates).toEqual([{ affected: 1, factId: 103 }]);

    const criterionResult = await runSelector(["--criterion", "privacy"]);

    expect(criterionResult.exitCode).toBe(0);
    expect(criterionResult.payload).toMatchObject({
      factId: 100,
      categoryId: "email",
      entrySlug: "alpha-mail",
      criterionKey: "privacy",
      status: "researching",
    });
    expect(criterionResult.state.updates).toEqual([
      { affected: 1, factId: 100 },
    ]);
  });

  it("returns the same selected target in dry-run while leaving facts unchanged", async () => {
    const dryRunScenario = selectorScenario();
    const dryRunResult = await runSelector(["--dry-run"], dryRunScenario);
    const realResult = await runSelector([]);

    expect(dryRunResult.exitCode).toBe(0);
    expect(dryRunResult.stderr).toBe("");
    expect(dryRunResult.payload).toMatchObject({
      factId: realResult.payload?.factId,
      previousStatus: "open",
      status: "open",
      dryRun: true,
    });
    expect(dryRunResult.state.transactions).toEqual([]);
    expect(dryRunResult.state.updates).toEqual([]);
    expect(factStatusById(dryRunResult.state)).toEqual(
      factStatusById(dryRunScenario),
    );
  });

  it("claims a needs-deeper-research fact as an automated retry when --mode=deeper-research is set", async () => {
    const scenario = scenarioWithOnlyNeedsDeeperResearchFact();
    const result = await runSelector(
      [
        "--mode=deeper-research",
        "--category",
        "email",
        "--entry",
        "alpha-mail",
        "--criterion",
        "ownership",
      ],
      scenario,
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 105,
      categoryId: "email",
      entrySlug: "alpha-mail",
      criterionKey: "ownership",
      previousStatus: "needs-deeper-research",
      status: "researching",
      dryRun: false,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.updates).toEqual([{ affected: 1, factId: 105 }]);
    expect(factStatusById(result.state)).toEqual({
      ...factStatusById(scenario),
      "105": "researching",
    });
  });

  it("prefers open facts over needs-deeper-research retries in the same target scope", async () => {
    const scenario = scenarioWithOpenAndNeedsDeeperResearchFacts();
    const targetArgs = [
      "--category",
      "email",
      "--entry",
      "alpha-mail",
      "--criterion",
      "ownership",
    ];

    const dryRunResult = await runSelector(
      ["--dry-run", ...targetArgs],
      scenario,
    );
    expect(dryRunResult.exitCode).toBe(0);
    expect(dryRunResult.stderr).toBe("");
    expect(dryRunResult.payload).toMatchObject({
      factId: 105,
      previousStatus: "open",
      status: "open",
      dryRun: true,
    });
    expect(dryRunResult.state.updates).toEqual([]);
    expect(factStatusById(dryRunResult.state)).toEqual(
      factStatusById(scenario),
    );

    const result = await runSelector(targetArgs, scenario);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 105,
      previousStatus: "open",
      status: "researching",
      dryRun: false,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.updates).toEqual([{ affected: 1, factId: 105 }]);
    expect(factStatusById(result.state)).toEqual({
      ...factStatusById(scenario),
      "105": "researching",
    });
  });

  it("exits 2 from dry-run without starting a transaction when no open fact matches", async () => {
    const scenario = scenarioWithoutOpenFacts();
    const result = await runSelector(["--dry-run"], scenario);

    expect(result.exitCode).toBe(2);
    expect(result.payload).toBeUndefined();
    expect(result.stderr).toContain(
      "No open matrix fact available for the requested scope.",
    );
    expect(result.state.transactions).toEqual([]);
    expect(result.state.updates).toEqual([]);
    expect(factStatusById(result.state)).toEqual(factStatusById(scenario));
  });

  it("exits 2 with the documented message and no writes when no open fact matches", async () => {
    const scenario = scenarioWithoutOpenFacts();
    const result = await runSelector([], scenario);

    expect(result.exitCode).toBe(2);
    expect(result.payload).toBeUndefined();
    expect(result.stderr).toContain(
      "No open matrix fact available for the requested scope.",
    );
    expect(result.state.transactions).toEqual(["begin", "rollback"]);
    expect(result.state.updates).toEqual([]);
    expect(factStatusById(result.state)).toEqual(factStatusById(scenario));
  });

  it("rolls back and reports failure when the selected open fact cannot be claimed", async () => {
    const scenario = selectorScenario();
    scenario.forceZeroAffectedFactIds = [105];
    const result = await runSelector([], scenario);

    expect(result.exitCode).toBe(1);
    expect(result.payload).toBeUndefined();
    expect(result.stderr).toContain(
      "Selected matrix fact could not be marked as researching.",
    );
    expect(result.state.transactions).toEqual(["begin", "rollback"]);
    expect(result.state.updates).toEqual([{ affected: 0, factId: 105 }]);
    expect(factStatusById(result.state)).toEqual(factStatusById(scenario));
  });

  it("exits 64 for invalid or empty target arguments without claiming unrelated facts", async () => {
    for (const args of [
      ["--category", ""],
      ["--entry-slug="],
      ["--criterion"],
      ["--unknown"],
    ]) {
      const scenario = selectorScenario();
      const result = await runSelector(args, scenario);

      expect(result.exitCode).toBe(64);
      expect(result.payload).toBeUndefined();
      expect(result.stderr).toContain("Invalid usage:");
      expect(result.state.connections).toBe(0);
      expect(result.state.transactions).toEqual([]);
      expect(result.state.updates).toEqual([]);
      expect(factStatusById(result.state)).toEqual(factStatusById(scenario));
    }
  });

  it("does not create research attempts or touch unrelated Trust Score tables", () => {
    const source = readSelectorScript();

    expect(source).not.toMatch(
      /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+`?matrix_fact_attempts`?/i,
    );
    expect(source).not.toMatch(
      /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+`?matrix_fact_verifications`?/i,
    );

    for (const table of [
      "reservations",
      "positive_signals",
      "scoring_metadata",
    ]) {
      expect(source).not.toMatch(
        new RegExp(
          `\\b(?:INSERT\\s+INTO|UPDATE|DELETE\\s+FROM)\\s+\`?${table}\`?`,
          "i",
        ),
      );
    }
  });
});
