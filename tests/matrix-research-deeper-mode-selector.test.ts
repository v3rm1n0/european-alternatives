import { existsSync, readFileSync } from "node:fs";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Tests for issue #471: the matrix-research selector must support a
 * --mode=deeper-research CLI flag that:
 *   1. Selects ONLY facts in `needs-deeper-research` (never `open`).
 *   2. Honors a per-fact backoff timestamp
 *      (`deeper_research_next_eligible_at`): a fact whose timestamp is in
 *      the future is invisible to the deeper-research queue.
 *   3. Mirrors the regression flip: the default mode (no --mode flag)
 *      stops auto-picking `needs-deeper-research` rows from the default
 *      `open` queue. Without an explicit deeper-research mode, the
 *      selector should leave the deeper queue alone.
 */

const selectorScriptUrl = new URL(
  "../scripts/matrix-research-select.php",
  import.meta.url,
);
const stateMarker = "__DEEPER_SELECTOR_STATE__";

let phpPromise: Promise<PHP> | undefined;

type MatrixFactStatus =
  | "open"
  | "researching"
  | "verified"
  | "rejected"
  | "needs-deeper-research"
  | "not-applicable";

type FactRow = {
  id: number;
  category_id: string;
  entry_id: number;
  criterion_id: number;
  status: MatrixFactStatus;
  deeper_research_attempt_count?: number;
  /** ISO datetime string (e.g. "2030-01-01 12:00:00") or null. */
  deeper_research_next_eligible_at?: string | null;
};

type SelectorScenario = {
  /** ISO datetime that the in-PHP NOW() should return. */
  now: string;
  categories: Array<{ id: string; name_en: string; sort_order: number }>;
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
  facts: FactRow[];
  transactions: string[];
  updates: Array<{ affected: number; factId: number | null }>;
  connections: number;
};

type SelectorPayload = {
  factId: number;
  categoryId: string;
  entrySlug: string;
  criterionKey: string;
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
    "Expected scripts/matrix-research-select.php to exist",
  ).toBe(true);

  return readFileSync(selectorScriptUrl, "utf8");
}

function baseScenario(): SelectorScenario {
  return {
    now: "2026-05-27 12:00:00",
    categories: [
      { id: "email", name_en: "Email", sort_order: 10 },
      { id: "browser", name_en: "Browsers", sort_order: 20 },
    ],
    entries: [
      {
        id: 1,
        slug: "alpha-mail",
        name: "Alpha Mail",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 2,
        slug: "bravo-mail",
        name: "Bravo Mail",
        status: "alternative",
        is_active: 1,
      },
      {
        id: 3,
        slug: "cool-browser",
        name: "Cool Browser",
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
        id: 20,
        category_id: "browser",
        criterion_key: "privacy",
        label_en: "Privacy",
        value_type: "rating",
        sort_order: 1,
      },
    ],
    facts: [],
    transactions: [],
    updates: [],
    connections: 0,
  };
}

function buildBehaviorCode(
  args: string[],
  scenario: SelectorScenario,
): string {
  const argv = ["scripts/matrix-research-select.php", ...args];
  const scriptSource = readSelectorScript();
  // Strip the bootstrap requires and the top-level dispatch so the script
  // can run inside the test harness (which provides its own PDO/getDatabaseConnection).
  const sanitized = scriptSource
    // Remove the opening `<?php` and `declare(strict_types=1);` — the
    // outer harness file already declares those.
    .replace(/^<\?php\s*/, "")
    .replace(/declare\(strict_types=1\);\s*/g, "")
    // Remove the bootstrap require lines.
    .replace(/require_once[^\n]*\n/g, "")
    // Remove the SAPI guard.
    .replace(
      /if \(php_sapi_name\(\) !== 'cli'\) \{[\s\S]*?\}\s*\n/,
      "",
    )
    // Remove the top-level try/catch that invokes runSelector — the harness
    // invokes it itself after defining the test PDO.
    .replace(
      /try \{\s*runSelector\(\$argv\);[\s\S]*?exit\(1\);\s*\}\s*\n/,
      "",
    );

  return `<?php
declare(strict_types=1);

$deeperSelectorScenario = json_decode(${JSON.stringify(JSON.stringify(scenario))}, true, 512, JSON_THROW_ON_ERROR);
$argv = json_decode(${JSON.stringify(JSON.stringify(argv))}, true, 512, JSON_THROW_ON_ERROR);

if (!defined('STDERR')) { define('STDERR', fopen('php://stderr', 'wb')); }
if (!defined('STDOUT')) { define('STDOUT', fopen('php://stdout', 'wb')); }

register_shutdown_function(static function (): void {
    global $deeperSelectorScenario;
    echo "\\n${stateMarker}" . json_encode($deeperSelectorScenario, JSON_THROW_ON_ERROR) . "\\n";
});

final class DeeperSelectorTestPdo extends PDO
{
    private array $state;
    private bool $transactionActive = false;

    public function __construct(array &$state) { $this->state =& $state; }

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

    public function inTransaction(): bool { return $this->transactionActive; }

    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return new DeeperSelectorTestStatement($this->state, $query);
    }
}

final class DeeperSelectorTestStatement extends PDOStatement
{
    private array $state;
    private string $sql;
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
        $params = $params ?? [];
        $normalized = deeper_selector_normalize_sql($this->sql);

        if (str_contains($normalized, 'update matrix_facts') && str_contains($normalized, "set status = 'researching'")) {
            $this->affectedRows = deeper_selector_claim_fact($this->state, $params);
            return true;
        }

        if (str_contains($normalized, 'from matrix_facts')) {
            $this->rows = deeper_selector_rows_for_select($this->state, $normalized, $params);
            $this->cursor = 0;
            return true;
        }

        return true;
    }

    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        if (!array_key_exists($this->cursor, $this->rows)) { return false; }
        return $this->rows[$this->cursor++];
    }

    public function rowCount(): int { return $this->affectedRows; }
}

function getDatabaseConnection(): PDO
{
    global $deeperSelectorScenario;
    $deeperSelectorScenario['connections']++;
    return new DeeperSelectorTestPdo($deeperSelectorScenario);
}

function deeper_selector_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function deeper_selector_rows_for_select(array $state, string $normalizedSql, array $params): array
{
    $rows = [];
    $now = strtotime($state['now']) ?: time();

    // Detect which queue the SQL is filtering for.
    $needsDeeperOnly = preg_match("/mf\\.status\\s*=\\s*'needs-deeper-research'/", $normalizedSql) === 1
        || (
            preg_match("/mf\\.status\\s+in\\s*\\(\\s*'needs-deeper-research'\\s*\\)/", $normalizedSql) === 1
        );
    $openOnly = !$needsDeeperOnly && preg_match("/mf\\.status\\s*=\\s*'open'(?!\\s*,)/", $normalizedSql) === 1;
    $unionQueue = !$needsDeeperOnly && !$openOnly
        && str_contains($normalizedSql, "'open'")
        && str_contains($normalizedSql, "'needs-deeper-research'");
    $honorsBackoff = str_contains($normalizedSql, 'deeper_research_next_eligible_at');

    foreach ($state['facts'] as $fact) {
        $factStatus = $fact['status'] ?? null;

        if ($needsDeeperOnly && $factStatus !== 'needs-deeper-research') { continue; }
        if ($openOnly && $factStatus !== 'open') { continue; }
        if ($unionQueue && !in_array($factStatus, ['open', 'needs-deeper-research'], true)) { continue; }

        if ($honorsBackoff && ($factStatus === 'needs-deeper-research')) {
            $eligibleAt = $fact['deeper_research_next_eligible_at'] ?? null;
            if ($eligibleAt !== null) {
                $eligibleTs = strtotime($eligibleAt);
                if ($eligibleTs !== false && $eligibleTs > $now) { continue; }
            }
        }

        $entry = null;
        foreach ($state['entries'] as $candidate) {
            if (($candidate['id'] ?? null) === ($fact['entry_id'] ?? null)) { $entry = $candidate; break; }
        }
        $criterion = null;
        foreach ($state['criteria'] as $candidate) {
            if (($candidate['id'] ?? null) === ($fact['criterion_id'] ?? null)) { $criterion = $candidate; break; }
        }
        $category = null;
        foreach ($state['categories'] as $candidate) {
            if (($candidate['id'] ?? null) === ($fact['category_id'] ?? null)) { $category = $candidate; break; }
        }

        if ($entry === null || $criterion === null || $category === null) { continue; }
        if (($entry['status'] ?? null) !== 'alternative') { continue; }
        if ((int) ($entry['is_active'] ?? 0) !== 1) { continue; }

        $rows[] = [
            'fact_id' => $fact['id'],
            'fact_status' => $factStatus,
            'category_id' => $fact['category_id'],
            'category_name' => $category['name_en'],
            'category_sort_order' => $category['sort_order'],
            'entry_id' => $entry['id'],
            'entry_slug' => $entry['slug'],
            'entry_name' => $entry['name'],
            'criterion_id' => $criterion['id'],
            'criterion_key' => $criterion['criterion_key'],
            'criterion_label' => $criterion['label_en'],
            'criterion_sort_order' => $criterion['sort_order'],
            'value_type' => $criterion['value_type'],
        ];
    }

    usort($rows, static fn (array $a, array $b): int => [
        $a['category_sort_order'], $a['entry_name'], $a['criterion_sort_order'], $a['fact_id'],
    ] <=> [
        $b['category_sort_order'], $b['entry_name'], $b['criterion_sort_order'], $b['fact_id'],
    ]);

    if (str_contains($normalizedSql, 'limit 1')) { return array_slice($rows, 0, 1); }
    return $rows;
}

function deeper_selector_claim_fact(array &$state, array $params): int
{
    $factId = $params[':fact_id'] ?? $params['fact_id'] ?? null;
    foreach ($state['facts'] as &$fact) {
        if ($fact['id'] === $factId) {
            $fact['status'] = 'researching';
            $state['updates'][] = ['affected' => 1, 'factId' => (int) $factId];
            return 1;
        }
    }
    unset($fact);
    $state['updates'][] = ['affected' => 0, 'factId' => is_numeric($factId) ? (int) $factId : null];
    return 0;
}

${sanitized}

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

function parseResult(
  stdout: string,
  stderr: string,
  exitCode: number,
): SelectorRunResult {
  if (exitCode === 255) {
    throw new Error(`PHP fatal:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const stateLine = lines.find((line) => line.startsWith(stateMarker));
  if (stateLine === undefined) {
    throw new Error(`harness did not emit state: ${stdout}`);
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
  scenario: SelectorScenario = baseScenario(),
): Promise<SelectorRunResult> {
  const php = await getPhp();
  const response = await php.runStream({
    code: buildBehaviorCode(args, scenario),
  });
  return parseResult(
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

describe("matrix research selector — --mode=deeper-research", () => {
  it("documents the --mode option in the script source", () => {
    const source = readSelectorScript();
    expect(source).toContain("--mode");
    expect(source).toContain("deeper-research");
  });

  it("with --mode=deeper-research picks a needs-deeper-research fact and ignores open facts", async () => {
    const scenario = baseScenario();
    scenario.facts = [
      {
        id: 200,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "open",
      },
      {
        id: 201,
        category_id: "email",
        entry_id: 2,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 1,
        deeper_research_next_eligible_at: null,
      },
    ];

    const result = await runSelector(["--mode=deeper-research"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.payload).toMatchObject({
      factId: 201,
      previousStatus: "needs-deeper-research",
      status: "researching",
    });
  });

  it("with no --mode flag picks an open fact and ignores deeper-research backlog", async () => {
    const scenario = baseScenario();
    scenario.facts = [
      {
        id: 300,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 1,
        deeper_research_next_eligible_at: null,
      },
      {
        id: 301,
        category_id: "email",
        entry_id: 2,
        criterion_id: 10,
        status: "open",
      },
    ];

    const result = await runSelector([], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.payload).toMatchObject({
      factId: 301,
      previousStatus: "open",
      status: "researching",
    });
  });

  it("with no --mode flag exits 2 (no-open) when only deeper-research facts exist", async () => {
    const scenario = baseScenario();
    scenario.facts = [
      {
        id: 400,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 1,
        deeper_research_next_eligible_at: null,
      },
    ];

    const result = await runSelector([], scenario);

    expect(result.exitCode).toBe(2);
    expect(result.payload).toBeUndefined();
  });

  it("with --mode=deeper-research skips a fact whose next_eligible_at is in the future", async () => {
    const scenario = baseScenario();
    scenario.now = "2026-05-27 12:00:00";
    scenario.facts = [
      {
        id: 500,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 2,
        // 5 days in the future from `now`.
        deeper_research_next_eligible_at: "2026-06-01 12:00:00",
      },
    ];

    const result = await runSelector(["--mode=deeper-research"], scenario);

    expect(result.exitCode).toBe(2);
    expect(result.payload).toBeUndefined();
    expect(result.stderr).toContain("No open matrix fact");
  });

  it("with --mode=deeper-research picks a fact whose next_eligible_at is in the past", async () => {
    const scenario = baseScenario();
    scenario.now = "2026-05-27 12:00:00";
    scenario.facts = [
      {
        id: 600,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 1,
        // 1 hour ago.
        deeper_research_next_eligible_at: "2026-05-27 11:00:00",
      },
    ];

    const result = await runSelector(["--mode=deeper-research"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.payload).toMatchObject({
      factId: 600,
      previousStatus: "needs-deeper-research",
      status: "researching",
    });
  });

  it("with --mode=deeper-research picks a fact whose next_eligible_at is NULL (never set)", async () => {
    const scenario = baseScenario();
    scenario.facts = [
      {
        id: 700,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 0,
        deeper_research_next_eligible_at: null,
      },
    ];

    const result = await runSelector(["--mode=deeper-research"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.payload?.factId).toBe(700);
  });

  it("rejects an unknown --mode value with the standard 64 usage exit", async () => {
    const result = await runSelector(
      ["--mode=does-not-exist"],
      baseScenario(),
    );

    expect(result.exitCode).toBe(64);
    expect(result.stderr).toContain("Invalid usage");
  });

  it("accepts the space-form '--mode deeper-research' identically to the equals-form", async () => {
    // CLI parser branch coverage: parseCliArgs has two distinct code paths
    // for `--mode <value>` (space-separated) and `--mode=<value>`
    // (equals-form). Only the equals-form is exercised by the other tests
    // in this file. Without this case a future refactor that breaks one
    // form while leaving the other working would slip through.
    const scenario = baseScenario();
    scenario.facts = [
      {
        id: 800,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 1,
        deeper_research_next_eligible_at: null,
      },
    ];

    const result = await runSelector(
      ["--mode", "deeper-research"],
      scenario,
    );

    expect(result.exitCode).toBe(0);
    expect(result.payload).toMatchObject({
      factId: 800,
      previousStatus: "needs-deeper-research",
      status: "researching",
    });
  });

  it("with --mode=deeper-research silently ignores --include-stale (documented no-op)", async () => {
    // The api/README.md "Deeper Research Policy" section documents that
    // --include-stale has no effect in --mode=deeper-research. Selector
    // implementation gates the stale_days parameter on
    // `$options['mode'] === 'initial' && $options['includeStale']`, so the
    // combined flags must (a) not throw an INVALID_USAGE / missing-param
    // error, and (b) still drain only the deeper-research queue. A stale
    // verified fact present in the scenario must NOT be picked.
    const scenario = baseScenario();
    scenario.facts = [
      {
        id: 900,
        category_id: "email",
        entry_id: 1,
        criterion_id: 10,
        // Pretend this is a stale verified fact — it would be picked by
        // --include-stale in initial mode but must be ignored in
        // deeper-research mode.
        status: "verified",
      },
      {
        id: 901,
        category_id: "email",
        entry_id: 2,
        criterion_id: 10,
        status: "needs-deeper-research",
        deeper_research_attempt_count: 1,
        deeper_research_next_eligible_at: null,
      },
    ];

    const result = await runSelector(
      ["--mode=deeper-research", "--include-stale"],
      scenario,
    );

    expect(result.exitCode).toBe(0);
    expect(result.payload?.factId).toBe(901);
    expect(result.payload?.previousStatus).toBe("needs-deeper-research");
  });
});
