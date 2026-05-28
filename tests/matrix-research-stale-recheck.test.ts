import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { chmodSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Issue #468 — stale fact recheck policy for matrices.
 *
 * Behavioral contract (TDD red phase):
 *   Selector
 *     - When invoked with --include-stale, picks a `verified` fact whose
 *       selected attempt is older than the configured threshold
 *       (MATRIX_FACT_STALE_AFTER_DAYS, default 180) and claims it (status
 *       flips to 'researching'). Existing value_* and selected_attempt_id
 *       columns are preserved on the row.
 *     - Without --include-stale, the same fact is not picked (current
 *       behavior preserved).
 *     - Threshold honors MATRIX_FACT_STALE_AFTER_DAYS env override.
 *   Persister
 *     - On an unresolved outcome (needs-deeper-research), if the fact
 *       already has a selected_attempt_id (i.e. a prior verified value),
 *       preserve value_*, public_source_*, and selected_attempt_id. Only
 *       transition status. This is the "do not erase the prior verified
 *       value" guarantee for failed rechecks.
 *     - Regression: when no selected_attempt_id is set, a needs-deeper-
 *       research outcome still NULLs every value column. The existing
 *       first-time-failed contract must remain intact.
 *   Loop
 *     - Forwards --include-stale to the selector subprocess.
 *   Public API
 *     - api/catalog/matrix.php renders the stored value as verified when
 *       value_* is populated AND selected_attempt_id is set, even when
 *       status is mid-recheck ('researching' or 'needs-deeper-research').
 */

const selectorScriptUrl = new URL(
  "../scripts/matrix-research-select.php",
  import.meta.url,
);
const persistenceScriptUrl = new URL(
  "../scripts/matrix-research-persist.php",
  import.meta.url,
);
const loopRunnerPath = resolve("scripts/matrix-research-loop.mjs");
const projectDir = resolve(".");
const matrixEndpointPath = resolve("api/catalog/matrix.php");
const cachePath = resolve("api/cache.php");
const helpersPath = resolve("api/catalog/helpers.php");
const scoringPath = resolve("api/catalog/scoring.php");

const selectorStateMarker = "__STALE_SELECTOR_STATE__";
const persistenceStateMarker = "__STALE_PERSISTENCE_STATE__";

let phpPromise: Promise<PHP> | undefined;

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime("8.3").then((runtime) => {
    const php = new PHP(runtime);
    useHostFilesystem(php);
    return php;
  });

  return phpPromise;
}

afterAll(async () => {
  if (phpPromise) {
    const php = await phpPromise;
    php.exit(0);
  }
});

// ---------- Shared PHP-source extraction helpers ----------

function readScript(url: URL, label: string): string {
  expect(existsSync(url), `Expected ${label} to exist`).toBe(true);
  return readFileSync(url, "utf8");
}

function getFunctionSource(
  source: string,
  functionName: string,
  label: string,
): string {
  const start = source.indexOf(`function ${functionName}(`);
  if (start < 0) {
    throw new Error(`Expected ${label} to define ${functionName}()`);
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

// ---------- Selector test harness ----------

type StaleMatrixFact = {
  id: number;
  category_id: string;
  entry_id: number;
  criterion_id: number;
  status: string;
  selected_attempt_id: number | null;
  value_text: string | null;
  public_source_url: string | null;
};

type StaleAttempt = {
  id: number;
  fact_id: number;
  created_at: string;
};

type SelectorScenario = {
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
  facts: StaleMatrixFact[];
  attempts: StaleAttempt[];
  transactions: string[];
  updates: Array<{ affected: number; factId: number | null }>;
  connections: number;
  staleAfterDays: number;
  nowDate: string;
};

type SelectorPayload = {
  factId: number;
  categoryId: string;
  entrySlug: string;
  criterionKey: string;
  previousStatus: string;
  status: string;
  dryRun: boolean;
};

type SelectorRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  payload?: SelectorPayload;
  state: SelectorScenario;
};

function selectorScenarioFixture(): SelectorScenario {
  return {
    categories: [{ id: "email", name_en: "Email", sort_order: 10 }],
    entries: [
      {
        id: 20,
        slug: "alpha-mail",
        name: "Alpha Mail",
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
    ],
    // Fact 200: stale verified — selected attempt is 365 days old.
    // Fact 201: fresh verified — selected attempt is 10 days old.
    facts: [
      {
        id: 200,
        category_id: "email",
        entry_id: 20,
        criterion_id: 10,
        status: "verified",
        selected_attempt_id: 9001,
        value_text: "Independent",
        public_source_url: "https://example.test/alpha-mail/ownership",
      },
      {
        id: 201,
        category_id: "email",
        entry_id: 20,
        criterion_id: 10,
        status: "verified",
        selected_attempt_id: 9002,
        value_text: "Independent (fresh)",
        public_source_url: "https://example.test/alpha-mail/fresh",
      },
    ],
    attempts: [
      { id: 9001, fact_id: 200, created_at: "2025-05-27 00:00:00" }, // 365d before nowDate
      { id: 9002, fact_id: 200, created_at: "2026-05-17 00:00:00" }, // 10d before nowDate
    ],
    transactions: [],
    updates: [],
    connections: 0,
    staleAfterDays: 180,
    nowDate: "2026-05-27",
  };
}

function buildSelectorBehaviorCode(
  args: string[],
  scenario: SelectorScenario,
  envOverrides: Record<string, string> = {},
): string {
  const argv = ["scripts/matrix-research-select.php", ...args];

  const envSetup = Object.entries(envOverrides)
    .map(
      ([key, value]) =>
        `putenv(${JSON.stringify(`${key}=${value}`)}); $_ENV[${JSON.stringify(key)}] = ${JSON.stringify(value)}; $_SERVER[${JSON.stringify(key)}] = ${JSON.stringify(value)};`,
    )
    .join("\n");

  return `<?php
declare(strict_types=1);

${envSetup}

$staleSelectorState = json_decode(${JSON.stringify(JSON.stringify(scenario))}, true, 512, JSON_THROW_ON_ERROR);
$argv = json_decode(${JSON.stringify(JSON.stringify(argv))}, true, 512, JSON_THROW_ON_ERROR);

if (!defined('STDERR')) {
    define('STDERR', fopen('php://stderr', 'wb'));
}
if (!defined('STDOUT')) {
    define('STDOUT', fopen('php://stdout', 'wb'));
}

register_shutdown_function(static function (): void {
    global $staleSelectorState;
    echo "\\n${selectorStateMarker}" . json_encode($staleSelectorState, JSON_THROW_ON_ERROR) . "\\n";
});

final class StaleSelectorTestPdo extends PDO
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
        return new StaleSelectorTestStatement($this->state, $query);
    }
}

final class StaleSelectorTestStatement extends PDOStatement
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
        $normalized = stale_normalize_sql($this->sql);

        if (str_contains($normalized, 'update matrix_facts')) {
            $this->affectedRows = stale_claim_fact($this->state, $normalized, $this->params);
            $this->rows = [];
            return true;
        }

        $this->rows = stale_select_rows($this->state, $normalized, $this->params);
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
    global $staleSelectorState;
    $staleSelectorState['connections']++;
    return new StaleSelectorTestPdo($staleSelectorState);
}

function stale_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function stale_param(array $params, array $names): mixed
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

function stale_select_rows(array $state, string $normalizedSql, array $params): array
{
    if (!str_contains($normalizedSql, 'from matrix_facts')) {
        return [];
    }

    // The new stale-recheck SQL must JOIN matrix_fact_attempts and pass
    // a stale_days parameter so the test can confirm staleness is computed
    // from the attempt's created_at, not from matrix_facts.updated_at.
    $isStaleAware = str_contains($normalizedSql, 'matrix_fact_attempts')
        && (str_contains($normalizedSql, 'stale_days')
            || stale_param($params, ['stale_days', 'staleDays']) !== null);

    $allowsVerified = $isStaleAware
        && (str_contains($normalizedSql, "'verified'") || str_contains($normalizedSql, '"verified"'));

    $thresholdDays = (int) ($state['staleAfterDays'] ?? 180);
    if (stale_param($params, ['stale_days', 'staleDays']) !== null) {
        $thresholdDays = (int) stale_param($params, ['stale_days', 'staleDays']);
    }
    $nowTs = strtotime((string) $state['nowDate']);
    $thresholdTs = $nowTs - ($thresholdDays * 86400);

    $rows = [];
    foreach ($state['facts'] as $fact) {
        $status = (string) $fact['status'];

        if ($status === 'open' || $status === 'needs-deeper-research') {
            // Always allowed under the existing selector contract.
        } elseif ($status === 'verified') {
            if (!$allowsVerified) {
                continue;
            }
            if ($fact['selected_attempt_id'] === null) {
                continue;
            }
            $attemptCreatedAt = null;
            foreach ($state['attempts'] as $attempt) {
                if ((int) $attempt['id'] === (int) $fact['selected_attempt_id']) {
                    $attemptCreatedAt = $attempt['created_at'];
                    break;
                }
            }
            if ($attemptCreatedAt === null) {
                continue;
            }
            if (strtotime((string) $attemptCreatedAt) >= $thresholdTs) {
                continue;
            }
        } else {
            continue;
        }

        $entry = null;
        foreach ($state['entries'] as $candidate) {
            if ((int) $candidate['id'] === (int) $fact['entry_id']) {
                $entry = $candidate;
                break;
            }
        }
        $category = null;
        foreach ($state['categories'] as $candidate) {
            if ($candidate['id'] === $fact['category_id']) {
                $category = $candidate;
                break;
            }
        }
        $criterion = null;
        foreach ($state['criteria'] as $candidate) {
            if ((int) $candidate['id'] === (int) $fact['criterion_id']) {
                $criterion = $candidate;
                break;
            }
        }

        if ($entry === null || $category === null || $criterion === null) {
            continue;
        }
        if (!in_array($entry['status'] ?? null, ['alternative', 'us'], true)) {
            continue;
        }
        if ((int) ($entry['is_active'] ?? 0) !== 1) {
            continue;
        }

        $rows[] = [
            'fact_id' => $fact['id'],
            'fact_status' => $fact['status'],
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

    if (str_contains($normalizedSql, 'order by')) {
        usort($rows, static function (array $left, array $right): int {
            $statusOrder = static function (string $status): int {
                if ($status === 'open') return 0;
                if ($status === 'needs-deeper-research') return 1;
                if ($status === 'verified') return 2;
                return 3;
            };
            return [
                $statusOrder((string) $left['fact_status']),
                (int) $left['category_sort_order'],
                (string) $left['category_id'],
                (string) $left['entry_name'],
                (int) $left['entry_id'],
                (int) $left['criterion_sort_order'],
                (int) $left['criterion_id'],
                (int) $left['fact_id'],
            ] <=> [
                $statusOrder((string) $right['fact_status']),
                (int) $right['category_sort_order'],
                (string) $right['category_id'],
                (string) $right['entry_name'],
                (int) $right['entry_id'],
                (int) $right['criterion_sort_order'],
                (int) $right['criterion_id'],
                (int) $right['fact_id'],
            ];
        });
    }

    if (str_contains($normalizedSql, 'limit 1')) {
        return array_slice($rows, 0, 1);
    }
    return $rows;
}

function stale_claim_fact(array &$state, string $normalizedSql, array $params): int
{
    $factId = stale_param($params, ['fact_id', 'factId', 'id']);
    $filtersById = preg_match('/\\bid\\s*=\\s*:fact_id\\b/', $normalizedSql) === 1;
    $setsResearching = preg_match('/\\bstatus\\s*=\\s*\\'researching\\'/', $normalizedSql) === 1;
    $allowsVerified = str_contains($normalizedSql, "'verified'");

    $affected = 0;
    foreach ($state['facts'] as &$fact) {
        if ($filtersById && (int) $fact['id'] !== (int) $factId) {
            continue;
        }
        if ($fact['status'] === 'verified') {
            if (!$allowsVerified) {
                continue;
            }
        } elseif (!in_array($fact['status'], ['open', 'needs-deeper-research'], true)) {
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

${[
  "runSelector",
  "parseCliArgs",
  "readRequiredOptionValue",
  "readInlineOptionValue",
  "printUsage",
  "stderr",
  "exitNoOpenFact",
  "selectOpenMatrixFact",
  "buildTargetFilters",
  "buildSelectionSql",
  "claimSelectedFact",
  "printSelectedFact",
]
  .map((fn) =>
    getFunctionSource(
      readScript(selectorScriptUrl, "scripts/matrix-research-select.php"),
      fn,
      "scripts/matrix-research-select.php",
    ),
  )
  .join("\n\n")}

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
`;
}

async function runSelector(
  args: string[],
  scenario: SelectorScenario = selectorScenarioFixture(),
  envOverrides: Record<string, string> = {},
): Promise<SelectorRunResult> {
  const php = await getPhp();
  const response = await php.runStream({
    code: buildSelectorBehaviorCode(args, scenario, envOverrides),
  });
  const stdout = await response.stdoutText;
  const stderr = await response.stderrText;
  const exitCode = await response.exitCode;

  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const stateLine = lines.find((line) => line.startsWith(selectorStateMarker));
  if (stateLine === undefined) {
    throw new Error(`Selector did not emit state: ${stdout}`);
  }
  const payloadLine = lines.find(
    (line) => !line.startsWith(selectorStateMarker) && line.startsWith("{"),
  );

  return {
    exitCode,
    stderr,
    stdout,
    payload: payloadLine
      ? (JSON.parse(payloadLine) as SelectorPayload)
      : undefined,
    state: JSON.parse(
      stateLine.slice(selectorStateMarker.length),
    ) as SelectorScenario,
  };
}

describe("matrix research selector — stale recheck eligibility (issue #468)", () => {
  it("claims a stale verified fact under --include-stale and preserves its prior value", async () => {
    const scenario = selectorScenarioFixture();
    const result = await runSelector(["--include-stale"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 200,
      categoryId: "email",
      entrySlug: "alpha-mail",
      criterionKey: "ownership",
      previousStatus: "verified",
      status: "researching",
      dryRun: false,
    });

    const claimedFact = result.state.facts.find((f) => f.id === 200);
    expect(claimedFact?.status).toBe("researching");
    // The prior verified value, source, and selected_attempt_id must not be
    // erased by the claim — those are the inputs the persister later reads
    // to decide whether to preserve the prior value on a failed recheck.
    expect(claimedFact?.value_text).toBe("Independent");
    expect(claimedFact?.public_source_url).toBe(
      "https://example.test/alpha-mail/ownership",
    );
    expect(claimedFact?.selected_attempt_id).toBe(9001);

    // The fresh-verified fact must not be picked.
    expect(result.state.facts.find((f) => f.id === 201)?.status).toBe(
      "verified",
    );
  });

  it("does NOT pick a stale verified fact when --include-stale is omitted (preserves default queue)", async () => {
    const scenario = selectorScenarioFixture();
    const result = await runSelector([], scenario);

    // No 'open' or 'needs-deeper-research' rows exist, so the selector must
    // exit 2 — it must not silently widen to include verified facts when
    // the operator did not opt in.
    expect(result.exitCode).toBe(2);
    expect(result.payload).toBeUndefined();
    expect(result.stderr).toContain(
      "No open matrix fact available for the requested scope.",
    );
    // Every fact must remain verified.
    expect(result.state.facts.every((f) => f.status === "verified")).toBe(true);
  });

  it("honors MATRIX_FACT_STALE_AFTER_DAYS to redefine the staleness threshold", async () => {
    const scenario = selectorScenarioFixture();
    // The "fresh" fact (id 201) was verified 10 days ago. With the default
    // 180-day threshold it must not be considered stale, but with a 5-day
    // threshold it becomes the freshest stale candidate alongside fact 200.
    const result = await runSelector(["--include-stale"], scenario, {
      MATRIX_FACT_STALE_AFTER_DAYS: "5",
    });

    expect(result.exitCode).toBe(0);
    // Either fact may be claimed first under deterministic ordering, but
    // exactly one must be claimed and it must be one of the two verified
    // facts — both of which are now stale under the 5-day threshold.
    expect(result.payload?.previousStatus).toBe("verified");
    expect([200, 201]).toContain(result.payload?.factId);
    expect(
      result.state.facts.filter((f) => f.status === "researching"),
    ).toHaveLength(1);
  });

  it("falls back to the 180-day default when MATRIX_FACT_STALE_AFTER_DAYS is invalid", async () => {
    // Build a scenario whose only candidate is 100 days old. With a valid
    // threshold of 5 days that fact would be picked; with the documented
    // 180-day fallback for invalid inputs it must NOT be picked.
    const scenario = selectorScenarioFixture();
    scenario.facts = [
      {
        id: 210,
        category_id: "email",
        entry_id: 20,
        criterion_id: 10,
        status: "verified",
        selected_attempt_id: 9100,
        value_text: "Independent (100d)",
        public_source_url: "https://example.test/alpha-mail/100d",
      },
    ];
    // 100 days before nowDate 2026-05-27 → 2026-02-16.
    scenario.attempts = [
      { id: 9100, fact_id: 210, created_at: "2026-02-16 00:00:00" },
    ];

    // "abc" is not an integer; "0" is below the min_range=1 floor; both must
    // fall back to 180 per the implementation's filter_var contract.
    for (const invalidValue of ["abc", "0", "-5"]) {
      const result = await runSelector(["--include-stale"], scenario, {
        MATRIX_FACT_STALE_AFTER_DAYS: invalidValue,
      });

      expect(
        result.exitCode,
        `invalid env value ${JSON.stringify(invalidValue)} should fall back to 180`,
      ).toBe(2);
      expect(result.payload).toBeUndefined();
      expect(result.state.facts[0].status).toBe("verified");
    }

    // Sanity check: a valid override of 5 days must pick the same fact.
    const fresh = selectorScenarioFixture();
    fresh.facts = scenario.facts.map((f) => ({ ...f }));
    fresh.attempts = scenario.attempts.map((a) => ({ ...a }));
    const validResult = await runSelector(["--include-stale"], fresh, {
      MATRIX_FACT_STALE_AFTER_DAYS: "5",
    });
    expect(validResult.exitCode).toBe(0);
    expect(validResult.payload?.factId).toBe(210);
  });

  it("prefers a needs-deeper-research retry over a stale verified fact under --include-stale", async () => {
    // Mixed-queue scenario: one `needs-deeper-research` retry on a second
    // active alternative plus the stale `verified` fact from the default
    // fixture. The documented contract (api/README.md Stale Fact Recheck
    // Policy) requires unverified facts to drain first — stale verified
    // rows are only appended AFTER the retry queue.
    const scenario = selectorScenarioFixture();
    scenario.entries.push({
      id: 21,
      slug: "beta-mail",
      name: "Beta Mail",
      status: "alternative",
      is_active: 1,
    });
    scenario.facts = [
      // Stale verified fact (would be picked first under the buggy ordering).
      {
        id: 200,
        category_id: "email",
        entry_id: 20,
        criterion_id: 10,
        status: "verified",
        selected_attempt_id: 9001,
        value_text: "Independent",
        public_source_url: "https://example.test/alpha-mail/ownership",
      },
      // needs-deeper-research retry that must be drained first.
      {
        id: 300,
        category_id: "email",
        entry_id: 21,
        criterion_id: 10,
        status: "needs-deeper-research",
        selected_attempt_id: null,
        value_text: null,
        public_source_url: null,
      },
    ];

    const result = await runSelector(["--include-stale"], scenario);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload?.factId).toBe(300);
    expect(result.payload?.previousStatus).toBe("needs-deeper-research");
    // The stale verified fact must remain untouched until the retry queue
    // is drained.
    expect(result.state.facts.find((f) => f.id === 200)?.status).toBe(
      "verified",
    );
  });
});

// ---------- Persister test harness ----------

type PersistMatrixFact = {
  id: number;
  status: string;
  value_bool: number | null;
  value_number: number | string | null;
  value_text: string | null;
  value_json: string | null;
  public_source_url: string | null;
  public_source_title: string | null;
  public_source_accessed_date: string | null;
  selected_attempt_id: number | null;
};

type PersistScenario = {
  facts: PersistMatrixFact[];
  attempts: Array<Record<string, unknown>>;
  verifications: Array<Record<string, unknown>>;
  transactions: string[];
  updates: Array<{
    affected: number;
    factId: number | null;
    status: string | null;
    valueColumnsPresent: boolean;
  }>;
  connections: number;
  nextAttemptId: number;
  nextVerificationId: number;
  lastInsertId: number;
};

type PersistPayload = {
  factId: number;
  attemptId: number;
  factStatus: string;
  attemptStatus: string;
  verifierRowsInserted: number;
  selectedAttemptId: number | null;
};

type PersistRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  payload?: PersistPayload;
  state: PersistScenario;
};

function persistenceScenarioRecheck(): PersistScenario {
  return {
    // Fact 300: mid-recheck — already had a verified value before claim.
    //   The selector flipped status to 'researching' but PRESERVED
    //   value_text + public_source_* + selected_attempt_id.
    // Fact 301: first-time researching, never had a verified value.
    facts: [
      {
        id: 300,
        status: "researching",
        value_bool: null,
        value_number: null,
        value_text: "Independent",
        value_json: null,
        public_source_url: "https://example.test/alpha/old-ownership",
        public_source_title: "Old ownership source",
        public_source_accessed_date: "2025-05-27",
        selected_attempt_id: 9001,
      },
      {
        id: 301,
        status: "researching",
        value_bool: null,
        value_number: null,
        value_text: null,
        value_json: null,
        public_source_url: null,
        public_source_title: null,
        public_source_accessed_date: null,
        selected_attempt_id: null,
      },
    ],
    attempts: [],
    verifications: [],
    transactions: [],
    updates: [],
    connections: 0,
    nextAttemptId: 7000,
    nextVerificationId: 9000,
    lastInsertId: 0,
  };
}

function buildPersistenceBehaviorCode(
  args: string[],
  scenario: PersistScenario,
): string {
  const argv = ["scripts/matrix-research-persist.php", ...args];

  const requiredFunctions = [
    "runPersistenceFinalizer",
    "parseCliArgs",
    "readRequiredOptionValue",
    "readInlineOptionValue",
    "printUsage",
    "stderr",
    "loadJsonInput",
    "loadOptionalJsonInput",
    "decodeJsonObject",
    "determinePersistenceOutcome",
    "validateAttemptPayload",
    "validateDecisionPayload",
    "validateDecisionMatchesAttempt",
    "assertOutcomeStatus",
    "assertAttemptOutcomeStatus",
    "verificationsFromDecision",
    "validateVerificationPayload",
    "validateAcceptedVerifierDecision",
    "validateThreeVerifierRows",
    "assertNonEmptyString",
    "assertPositiveInt",
    "assertHttpUrl",
    "assertIsoDate",
    "insertMatrixFactAttempt",
    "insertMatrixFactVerifications",
    "settleMatrixFact",
    "settleVerifiedMatrixFact",
    "settleUnresolvedMatrixFact",
    "computeDeeperResearchNextEligibleAt",
    "readDeeperResearchAttemptCount",
    "typedValueColumns",
  ];

  const source = readScript(
    persistenceScriptUrl,
    "scripts/matrix-research-persist.php",
  );
  const extracted = requiredFunctions
    .map((fn) =>
      getFunctionSource(source, fn, "scripts/matrix-research-persist.php"),
    )
    .join("\n\n");

  return `<?php
declare(strict_types=1);

$staleP = json_decode(${JSON.stringify(JSON.stringify(scenario))}, true, 512, JSON_THROW_ON_ERROR);
$argv = json_decode(${JSON.stringify(JSON.stringify(argv))}, true, 512, JSON_THROW_ON_ERROR);

if (!defined('STDERR')) {
    define('STDERR', fopen('php://stderr', 'wb'));
}
if (!defined('STDOUT')) {
    define('STDOUT', fopen('php://stdout', 'wb'));
}

register_shutdown_function(static function (): void {
    global $staleP;
    echo "\\n${persistenceStateMarker}" . json_encode($staleP, JSON_THROW_ON_ERROR) . "\\n";
});

final class StalePersistTestPdo extends PDO
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
        return new StalePersistTestStatement($this->state, $query);
    }

    public function lastInsertId(?string $name = null): string|false
    {
        return (string) $this->state['lastInsertId'];
    }
}

final class StalePersistTestStatement extends PDOStatement
{
    private array $state;
    private string $sql;
    private int $affectedRows = 0;
    private array $rows = [];
    private int $cursor = 0;

    public function __construct(array &$state, string $sql)
    {
        $this->state =& $state;
        $this->sql = $sql;
    }

    public function execute(?array $params = null): bool
    {
        $params = $params ?? [];
        $normalized = stale_p_normalize_sql($this->sql);

        if (str_contains($normalized, 'insert into matrix_fact_attempts')) {
            $id = $this->state['nextAttemptId']++;
            $this->state['lastInsertId'] = $id;
            $this->state['attempts'][] = ['id' => $id] + $params;
            $this->affectedRows = 1;
            return true;
        }

        if (str_contains($normalized, 'insert into matrix_fact_verifications')) {
            $id = $this->state['nextVerificationId']++;
            $this->state['lastInsertId'] = $id;
            $this->state['verifications'][] = ['id' => $id] + $params;
            $this->affectedRows = 1;
            return true;
        }

        if (str_contains($normalized, 'select') && str_contains($normalized, 'from matrix_facts')) {
            $this->rows = stale_p_select_facts($this->state, $params);
            $this->cursor = 0;
            $this->affectedRows = count($this->rows);
            return true;
        }

        if (str_contains($normalized, 'update matrix_facts')) {
            $this->affectedRows = stale_p_update_fact($this->state, $normalized, $params);
            return true;
        }

        throw new RuntimeException('Unexpected SQL in persistence test: ' . $this->sql);
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

    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        return $this->rows;
    }

    public function rowCount(): int
    {
        return $this->affectedRows;
    }
}

function getDatabaseConnection(): PDO
{
    global $staleP;
    $staleP['connections']++;
    return new StalePersistTestPdo($staleP);
}

function stale_p_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function stale_p_param(array $params, string $name): mixed
{
    foreach ([$name, ':' . $name] as $key) {
        if (array_key_exists($key, $params)) {
            return $params[$key];
        }
    }
    return null;
}

function stale_p_select_facts(array $state, array $params): array
{
    $factId = stale_p_param($params, 'fact_id');
    if ($factId === null) {
        $factId = stale_p_param($params, 'id');
    }
    foreach ($state['facts'] as $fact) {
        if ((int) $fact['id'] === (int) $factId) {
            return [$fact];
        }
    }
    return [];
}

function stale_p_param_keys(array $params, string $needle): bool
{
    foreach ($params as $key => $_) {
        $normalized = ltrim((string) $key, ':');
        if (str_contains($normalized, $needle)) {
            return true;
        }
    }
    return false;
}

function stale_p_update_fact(array &$state, string $normalizedSql, array $params): int
{
    $factId = stale_p_param($params, 'fact_id');
    $newStatus = stale_p_param($params, 'status');
    $requiredStatus = stale_p_param($params, 'required_status');

    // The fix for issue #468: when an unresolved outcome lands on a fact
    // that still carries a selected_attempt_id, the persister must NOT
    // overwrite value_* / public_source_* / selected_attempt_id with
    // NULL. For each column, this fake honors what the SQL actually does:
    //   - "<col> = null"   → write NULL (current pre-fix behavior).
    //   - "<col> = :param" → write the bound param value.
    //   - column absent    → leave the row's existing value alone
    //     (the cleanest implementation of the preserve-on-recheck rule).
    $columns = [
      'value_bool', 'value_number', 'value_text', 'value_json',
      'public_source_url', 'public_source_title',
      'public_source_accessed_date', 'selected_attempt_id',
    ];

    $affected = 0;
    foreach ($state['facts'] as &$fact) {
        if ((int) $fact['id'] !== (int) $factId) {
            continue;
        }
        if ($requiredStatus !== null && $fact['status'] !== $requiredStatus) {
            continue;
        }

        $fact['status'] = (string) $newStatus;

        foreach ($columns as $col) {
            $quoted = preg_quote($col, '/');
            // "<col> = null"
            if (preg_match('/\\b' . $quoted . '\\b\\s*=\\s*null\\b/', $normalizedSql) === 1) {
                $fact[$col] = null;
                continue;
            }
            // "<col> = :placeholder"
            if (preg_match('/\\b' . $quoted . '\\b\\s*=\\s*:([a-z_][a-z0-9_]*)/', $normalizedSql, $m) === 1) {
                $paramName = $m[1];
                $bound = null;
                foreach ([$paramName, ':' . $paramName] as $key) {
                    if (array_key_exists($key, $params)) {
                        $bound = $params[$key];
                        break;
                    }
                }
                $fact[$col] = $bound;
                continue;
            }
            // Column absent from SQL — preserve existing value.
        }

        $affected++;
    }
    unset($fact);

    $state['updates'][] = [
        'affected' => $affected,
        'factId' => is_numeric($factId) ? (int) $factId : null,
        'status' => $newStatus === null ? null : (string) $newStatus,
        'valueColumnsPresent' => true,
    ];

    return $affected;
}

const INVALID_USAGE = 64;

${extracted}

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
`;
}

async function runPersist(
  attempt: Record<string, unknown>,
  decision: Record<string, unknown> | null,
  scenario: PersistScenario = persistenceScenarioRecheck(),
): Promise<PersistRunResult> {
  const args = ["--attempt-json", JSON.stringify(attempt)];
  if (decision !== null) {
    args.push("--decision-json", JSON.stringify(decision));
  }

  const php = await getPhp();
  const response = await php.runStream({
    code: buildPersistenceBehaviorCode(args, scenario),
  });
  const stdout = await response.stdoutText;
  const stderr = await response.stderrText;
  const exitCode = await response.exitCode;

  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const stateLine = lines.find((line) =>
    line.startsWith(persistenceStateMarker),
  );
  if (stateLine === undefined) {
    throw new Error(`Persister did not emit state: ${stdout}`);
  }
  const payloadLine = lines.find(
    (line) => !line.startsWith(persistenceStateMarker) && line.startsWith("{"),
  );

  return {
    exitCode,
    stderr,
    stdout,
    payload: payloadLine
      ? (JSON.parse(payloadLine) as PersistPayload)
      : undefined,
    state: JSON.parse(
      stateLine.slice(persistenceStateMarker.length),
    ) as PersistScenario,
  };
}

function baseRecheckAttempt(
  factId: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    factId,
    agent: "codex",
    model: null,
    command: "codex exec",
    proposedStatus: "needs-deeper-research",
    proposedValue: null,
    sourceUrl: "https://example.test/alpha/recheck-source",
    sourceTitle: "Recheck source",
    accessedDate: "2026-05-27",
    auditQuote: "Verifier could not confirm the prior value.",
    confidence: "low",
    status: "needs-deeper-research",
    rawResponse: "recheck raw response",
    ...overrides,
  };
}

function needsDeeperDecision(factId: number) {
  return {
    attempt: { factId, status: "needs-deeper-research" },
    accepted: false,
    recommendedAttemptStatus: "needs-deeper-research",
    recommendedFactStatus: "needs-deeper-research",
    countableVerifierCount: 2,
    verifications: [1, 2, 3].map((idx) => ({
      factId,
      verifierIndex: idx,
      agent: "codex",
      model: null,
      command: "codex exec",
      sourceUrl: `https://example.test/v${idx}`,
      sourceTitle: `v${idx}`,
      accessedDate: "2026-05-27",
      auditQuote: `verifier ${idx} could not confirm.`,
      verdict: idx === 3 ? "inconclusive" : "supports",
      notes: `verifier ${idx} notes`,
      countsTowardAcceptance: idx !== 3,
      rawResponse: `v${idx} raw`,
    })),
  };
}

describe("matrix research persister — recheck-failure value preservation (issue #468)", () => {
  it("does not erase the prior verified value when a recheck fails on a fact with selected_attempt_id", async () => {
    const scenario = persistenceScenarioRecheck();
    const result = await runPersist(
      baseRecheckAttempt(300),
      needsDeeperDecision(300),
      scenario,
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload?.factStatus).toBe("needs-deeper-research");

    const fact = result.state.facts.find((f) => f.id === 300);
    // The "no erase" guarantee: value, source, and the previously
    // selected_attempt_id must all still be on the row after a failed
    // recheck. Only `status` legitimately changes.
    expect(fact?.status).toBe("needs-deeper-research");
    expect(fact?.value_text).toBe("Independent");
    expect(fact?.public_source_url).toBe(
      "https://example.test/alpha/old-ownership",
    );
    expect(fact?.public_source_title).toBe("Old ownership source");
    expect(fact?.public_source_accessed_date).toBe("2025-05-27");
    expect(fact?.selected_attempt_id).toBe(9001);
  });

  it("still NULLs values when a fact without a prior selected_attempt_id fails (no regression)", async () => {
    const scenario = persistenceScenarioRecheck();
    const result = await runPersist(
      baseRecheckAttempt(301),
      needsDeeperDecision(301),
      scenario,
    );

    expect(result.exitCode).toBe(0);
    expect(result.payload?.factStatus).toBe("needs-deeper-research");

    const fact = result.state.facts.find((f) => f.id === 301);
    expect(fact?.status).toBe("needs-deeper-research");
    // First-time-failure path: values stay NULL. This is the existing
    // contract for facts that never made it to 'verified'.
    expect(fact?.value_text).toBeNull();
    expect(fact?.public_source_url).toBeNull();
    expect(fact?.selected_attempt_id).toBeNull();
  });
});

// ---------- Loop test: --include-stale forwarding ----------

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(join(tempRoot, prefix));
}

function writeFakeStageRunner(tempDir: string): string {
  const fakeStagePath = join(tempDir, "fake-stage.mjs");
  writeFileSync(
    fakeStagePath,
    `#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
const stage = process.env.FAKE_STAGE;
if (!stage) { process.stderr.write("FAKE_STAGE env var required\\n"); process.exit(99); }
const scenarioPath = process.env[\`FAKE_\${stage.toUpperCase()}_SCENARIO\`];
const recordPath = process.env[\`FAKE_\${stage.toUpperCase()}_RECORD\`];
const counterPath = process.env[\`FAKE_\${stage.toUpperCase()}_COUNTER\`];
if (!scenarioPath || !recordPath || !counterPath) {
  process.stderr.write(\`Missing env for stage \${stage}\\n\`);
  process.exit(99);
}
const previous = existsSync(counterPath) ? Number.parseInt(readFileSync(counterPath, "utf8"), 10) || 0 : 0;
const callNum = previous + 1;
writeFileSync(counterPath, String(callNum));
let stdin = "";
if (stage !== "selector") { try { stdin = readFileSync(0, "utf8"); } catch { stdin = ""; } }
appendFileSync(recordPath, JSON.stringify({ call: callNum, args: process.argv.slice(2), stdin }) + "\\n");
const scenarios = JSON.parse(readFileSync(scenarioPath, "utf8"));
const step = scenarios[callNum - 1] ?? scenarios.default ?? {};
if (step.stdout) process.stdout.write(step.stdout);
if (step.stderr) process.stderr.write(step.stderr);
process.exit(typeof step.exitCode === "number" ? step.exitCode : 0);
`,
    "utf8",
  );
  chmodSync(fakeStagePath, 0o755);
  return fakeStagePath;
}

describe("matrix-research-loop — --include-stale forwarding (issue #468)", () => {
  it("forwards --include-stale to the selector subprocess", () => {
    const tempDir = makeProjectTempDir("matrix-loop-stale-");
    try {
      const fakeStagePath = writeFakeStageRunner(tempDir);
      const stages = [
        "selector",
        "researcher",
        "verifier",
        "persister",
      ] as const;
      const scenarioPaths: Record<string, string> = {};
      const recordPaths: Record<string, string> = {};
      const counterPaths: Record<string, string> = {};
      for (const stage of stages) {
        scenarioPaths[stage] = join(tempDir, `${stage}-scenarios.json`);
        recordPaths[stage] = join(tempDir, `${stage}-record.jsonl`);
        counterPaths[stage] = join(tempDir, `${stage}-counter.txt`);
        writeFileSync(scenarioPaths[stage], "[]", "utf8");
      }

      // Make the selector report "no open" on its first call so the loop
      // exits after one selector invocation; that one invocation is what
      // we want to inspect for the forwarded flag.
      writeFileSync(
        scenarioPaths.selector,
        JSON.stringify([
          {
            exitCode: 2,
            stderr: "No open matrix fact available for the requested scope.\n",
          },
        ]),
        "utf8",
      );

      const env = {
        ...(process.env as Record<string, string>),
        FAKE_SELECTOR_SCENARIO: scenarioPaths.selector,
        FAKE_SELECTOR_RECORD: recordPaths.selector,
        FAKE_SELECTOR_COUNTER: counterPaths.selector,
        FAKE_RESEARCHER_SCENARIO: scenarioPaths.researcher,
        FAKE_RESEARCHER_RECORD: recordPaths.researcher,
        FAKE_RESEARCHER_COUNTER: counterPaths.researcher,
        FAKE_VERIFIER_SCENARIO: scenarioPaths.verifier,
        FAKE_VERIFIER_RECORD: recordPaths.verifier,
        FAKE_VERIFIER_COUNTER: counterPaths.verifier,
        FAKE_PERSISTER_SCENARIO: scenarioPaths.persister,
        FAKE_PERSISTER_RECORD: recordPaths.persister,
        FAKE_PERSISTER_COUNTER: counterPaths.persister,
      };

      const result = spawnSync(
        "node",
        [
          loopRunnerPath,
          "--selector-cmd",
          `FAKE_STAGE=selector node ${fakeStagePath}`,
          "--researcher-cmd",
          `FAKE_STAGE=researcher node ${fakeStagePath}`,
          "--verifier-cmd",
          `FAKE_STAGE=verifier node ${fakeStagePath}`,
          "--persister-cmd",
          `FAKE_STAGE=persister node ${fakeStagePath}`,
          "--include-stale",
        ],
        { cwd: projectDir, encoding: "utf8", env },
      );

      expect(result.status).toBe(0);

      const selectorRecord = existsSync(recordPaths.selector)
        ? readFileSync(recordPaths.selector, "utf8")
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) => JSON.parse(line) as { call: number; args: string[] })
        : [];
      expect(selectorRecord.length).toBe(1);
      const argv = selectorRecord[0].args;
      const fused = argv.includes("--include-stale");
      expect(fused).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

// ---------- Public API: visibility during mid-recheck windows ----------

type ApiScenarioFact = {
  id: number;
  entry_id: number;
  category_id: string;
  criterion_id: number;
  criterion_key: string;
  status: string;
  value_bool: number | null;
  value_number: number | null;
  value_text: string | null;
  value_json: string | null;
  public_source_url: string | null;
  public_source_title: string | null;
  public_source_accessed_date: string | null;
  selected_attempt_id: number | null;
};

type ApiResponse = {
  status: number;
  json: {
    data: {
      alternatives: Array<{
        id: string;
        facts: Record<string, { status: string; value: unknown }>;
      }>;
    };
  };
};

function apiScenarioWith(factStatus: string): {
  category: Record<string, unknown>;
  groups: Array<Record<string, unknown>>;
  criteria: Array<Record<string, unknown>>;
  options: Array<Record<string, unknown>>;
  alternatives: Array<Record<string, unknown>>;
  facts: ApiScenarioFact[];
} {
  return {
    category: {
      id: "email",
      emoji: null,
      name: "Email",
      name_en: "Email",
      name_de: "Email",
      description: "Email category",
      description_en: "Email category",
      description_de: "Email",
      sort_order: 1,
    },
    groups: [
      {
        id: 10,
        category_id: "email",
        group_key: "ownership",
        label: "Ownership",
        label_en: "Ownership",
        label_de: "Ownership",
        description: null,
        description_en: null,
        description_de: null,
        sort_order: 1,
      },
    ],
    criteria: [
      {
        id: 100,
        category_id: "email",
        group_id: 10,
        criterion_key: "ownership",
        label: "Ownership",
        label_en: "Ownership",
        label_de: "Ownership",
        helpText: null,
        help_text: null,
        help_text_en: null,
        help_text_de: null,
        value_type: "text",
        semantics: "informational",
        filter_mode: "optional",
        sort_order: 1,
      },
    ],
    options: [],
    alternatives: [
      {
        id: 501,
        slug: "alpha-mail",
        name: "Alpha Mail",
        status: "alternative",
        is_active: 1,
        country_code: "de",
        website_url: "https://alpha-mail.example",
        logo_path: "/logos/alpha-mail.svg",
        memberships: [
          {
            entry_id: 501,
            category_id: "email",
            is_primary: 1,
            sort_order: 1,
          },
        ],
      },
    ],
    facts: [
      {
        id: 9001,
        entry_id: 501,
        category_id: "email",
        criterion_id: 100,
        criterion_key: "ownership",
        status: factStatus,
        value_bool: null,
        value_number: null,
        value_text: "Independent",
        value_json: null,
        public_source_url: "https://alpha-mail.example/ownership",
        public_source_title: "Alpha ownership",
        public_source_accessed_date: "2025-05-27",
        selected_attempt_id: 7777,
      },
    ],
  };
}

async function runMatrixApi(
  category: string,
  scenario: ReturnType<typeof apiScenarioWith>,
  cacheDir: string,
): Promise<ApiResponse> {
  const php = await getPhp();
  const code = `<?php
declare(strict_types=1);
define('EUROALT_CACHE_DIR', ${JSON.stringify(`${cacheDir}/`)});
define('EUROALT_CACHE_TTL', 300);
require ${JSON.stringify(cachePath)};
require ${JSON.stringify(helpersPath)};
require ${JSON.stringify(scoringPath)};

$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET = ['category' => ${JSON.stringify(category)}, 'locale' => 'en'];
$scenario = json_decode(${JSON.stringify(JSON.stringify(scenario))}, true, 512, JSON_THROW_ON_ERROR);

final class StaleApiTestStatement
{
    private array $params = [];
    private bool $fetched = false;
    public function __construct(private array $scenario, private string $sql) {}
    public function execute(?array $params = null): bool { $this->params = $params ?? []; return true; }
    public function fetch(int $mode = 0): mixed { if ($this->fetched) return false; $this->fetched = true; $rows = $this->rows(); return $rows[0] ?? false; }
    public function fetchAll(int $mode = 0): array { return $this->rows(); }
    public function fetchColumn(int $column = 0): mixed { $row = $this->fetch(); if (!is_array($row)) return false; $values = array_values($row); return $values[$column] ?? false; }
    private function rows(): array { return stale_api_rows_for_sql($this->sql, $this->params, $this->scenario); }
}

final class StaleApiTestPdo
{
    public function __construct(private array $scenario) {}
    public function prepare(string $sql): StaleApiTestStatement { return new StaleApiTestStatement($this->scenario, $sql); }
    public function query(string $sql): StaleApiTestStatement { $s = new StaleApiTestStatement($this->scenario, $sql); $s->execute(); return $s; }
}

function getDatabaseConnection(): StaleApiTestPdo
{
    global $scenario;
    return new StaleApiTestPdo($scenario);
}

function stale_api_rows_for_sql(string $sql, array $params, array $scenario): array
{
    $normalized = strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql);

    if (str_contains($normalized, 'information_schema.columns')) {
        return [['COUNT(*)' => 1]];
    }

    if (str_contains($normalized, 'from matrix_facts')) {
        // The fix for issue #468: api/catalog/matrix.php must SELECT the
        // selected_attempt_id column so the renderer can decide whether
        // to treat the stored value as still-verified during a recheck.
        if (!str_contains($normalized, 'selected_attempt_id')) {
            // Returning the rows without selected_attempt_id is acceptable
            // for the test — but the renderer will then fail the assertion
            // because it cannot identify a recheck-in-flight row.
        }
        $rows = [];
        foreach ($scenario['facts'] as $fact) {
            if ($fact['category_id'] !== $scenario['category']['id']) continue;
            $rows[] = $fact;
        }
        return $rows;
    }

    if (str_contains($normalized, 'matrix_criteria') && str_contains($normalized, 'matrix_criterion_groups')) {
        return array_map(static fn(array $c): array => [
            'id' => $c['id'], 'group_id' => $c['group_id'], 'criterion_key' => $c['criterion_key'],
            'label' => $c['label_en'], 'help_text' => $c['help_text_en'], 'value_type' => $c['value_type'],
            'semantics' => $c['semantics'], 'filter_mode' => $c['filter_mode'],
            'display_mode' => $c['display_mode'] ?? 'default',
            'sort_order' => $c['sort_order'] ?? 0,
        ], $scenario['criteria']);
    }
    if (str_contains($normalized, 'matrix_criterion_options')) return [];
    if (str_contains($normalized, 'matrix_criterion_groups')) {
        return array_map(static fn(array $g): array => [
            'id' => $g['id'], 'group_key' => $g['group_key'], 'label' => $g['label_en'],
            'description' => $g['description_en'], 'sort_order' => $g['sort_order'] ?? 0,
        ], $scenario['groups']);
    }
    if (str_contains($normalized, 'catalog_entries')) {
        $rows = [];
        foreach ($scenario['alternatives'] as $entry) {
            if (($entry['status'] ?? null) !== 'alternative') continue;
            if ((int)($entry['is_active'] ?? 0) !== 1) continue;
            $belongs = false;
            foreach ($entry['memberships'] ?? [] as $m) {
                if (($m['category_id'] ?? null) === ($scenario['category']['id'] ?? null)) {
                    $belongs = true; break;
                }
            }
            if (!$belongs) continue;
            $rows[] = $entry;
        }
        return $rows;
    }
    if (str_contains($normalized, 'entry_categories')) {
        $memberships = [];
        foreach ($scenario['alternatives'] as $entry) {
            foreach ($entry['memberships'] ?? [] as $m) {
                $memberships[] = $m + ['entry_id' => $entry['id']];
            }
        }
        return $memberships;
    }
    if (str_contains($normalized, 'from categories') || str_contains($normalized, ' categories ')) {
        $c = $scenario['category'];
        return [['id' => $c['id'], 'emoji' => $c['emoji'] ?? null, 'name' => $c['name_en'], 'description' => $c['description_en']]];
    }
    return [];
}

${(() => {
  const src = readFileSync(matrixEndpointPath, "utf8")
    .replace(/^<\?php\s*/, "")
    .replace(/declare\(strict_types=1\);\s*/, "")
    .replace(
      /require(?:_once)?\s+__DIR__\s*\.\s*['"]\/\.\.\/(?:bootstrap|db|cache)\.php['"];\s*/g,
      "",
    )
    .replace(
      /require(?:_once)?\s+__DIR__\s*\.\s*['"]\/(?:helpers|scoring)\.php['"];\s*/g,
      "",
    );
  return src;
})()}
`;
  const response = await php.runStream({
    code,
    method: "GET",
    $_SERVER: { REQUEST_METHOD: "GET" },
  });

  const stdoutText = await response.stdoutText;
  const stderr = await response.stderrText;
  const exitCode = await response.exitCode;

  if (exitCode !== 0) {
    throw new Error(`PHP exited ${exitCode}: ${stderr}\n${stdoutText}`);
  }

  return {
    status: await response.httpStatusCode,
    json: JSON.parse(stdoutText) as ApiResponse["json"],
  };
}

describe("catalog matrix API — value visibility during recheck (issue #468)", () => {
  it("still renders the stored verified value when a fact is mid-recheck (status=researching, selected_attempt_id set)", async () => {
    const tempRoot = resolve("tmp");
    mkdirSync(tempRoot, { recursive: true });
    const cacheDir = mkdtempSync(join(tempRoot, "stale-api-cache-"));
    try {
      const scenario = apiScenarioWith("researching");
      const response = await runMatrixApi("email", scenario, cacheDir);

      expect(response.status).toBe(200);
      const alternative = response.json.data.alternatives.find(
        (alt) => alt.id === "alpha-mail",
      );
      const fact = alternative?.facts.ownership;
      // The "no perceived erasure" guarantee: when a recheck is mid-flight
      // (status='researching') AND the row still carries a populated
      // value + selected_attempt_id, the public API must keep showing the
      // last verified value rather than flashing it to Unverified.
      expect(fact?.status).toBe("verified");
      expect(fact?.value).toBe("Independent");
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("still renders the stored verified value after a failed recheck (status=needs-deeper-research, value preserved)", async () => {
    const tempRoot = resolve("tmp");
    mkdirSync(tempRoot, { recursive: true });
    const cacheDir = mkdtempSync(join(tempRoot, "stale-api-cache-"));
    try {
      const scenario = apiScenarioWith("needs-deeper-research");
      const response = await runMatrixApi("email", scenario, cacheDir);

      expect(response.status).toBe(200);
      const alternative = response.json.data.alternatives.find(
        (alt) => alt.id === "alpha-mail",
      );
      const fact = alternative?.facts.ownership;
      // Failed recheck must not visibly downgrade a prior verified value
      // — the persister preserved it on the row; the API must too.
      expect(fact?.status).toBe("verified");
      expect(fact?.value).toBe("Independent");
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("renders as unverified for a first-time researching row with no selected_attempt_id", async () => {
    const tempRoot = resolve("tmp");
    mkdirSync(tempRoot, { recursive: true });
    const cacheDir = mkdtempSync(join(tempRoot, "stale-api-cache-"));
    try {
      const scenario = apiScenarioWith("researching");
      // No prior verified value exists — never made it to 'verified' before.
      // The "preserve through recheck" branch must NOT fire and the public
      // matrix must continue to report the fact as unverified.
      scenario.facts[0].selected_attempt_id = null;
      scenario.facts[0].value_text = null;
      scenario.facts[0].public_source_url = null;
      scenario.facts[0].public_source_title = null;
      scenario.facts[0].public_source_accessed_date = null;

      const response = await runMatrixApi("email", scenario, cacheDir);

      expect(response.status).toBe(200);
      const alternative = response.json.data.alternatives.find(
        (alt) => alt.id === "alpha-mail",
      );
      const fact = alternative?.facts.ownership;
      expect(fact?.status).toBe("unverified");
      expect(fact?.value).toBeNull();
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it("renders as unverified when selected_attempt_id is set but every value column is empty (defense-in-depth)", async () => {
    const tempRoot = resolve("tmp");
    mkdirSync(tempRoot, { recursive: true });
    const cacheDir = mkdtempSync(join(tempRoot, "stale-api-cache-"));
    try {
      const scenario = apiScenarioWith("needs-deeper-research");
      // Corrupted-row case: selected_attempt_id is populated (the cleanup of
      // a verified row was incomplete somewhere upstream), but all value
      // columns are NULL/empty. The renderer must not promote a
      // verified-blank cell — it must report unverified.
      scenario.facts[0].selected_attempt_id = 7777;
      scenario.facts[0].value_bool = null;
      scenario.facts[0].value_number = null;
      scenario.facts[0].value_text = null;
      scenario.facts[0].value_json = null;

      const response = await runMatrixApi("email", scenario, cacheDir);

      expect(response.status).toBe(200);
      const alternative = response.json.data.alternatives.find(
        (alt) => alt.id === "alpha-mail",
      );
      const fact = alternative?.facts.ownership;
      expect(fact?.status).toBe("unverified");
      expect(fact?.value).toBeNull();
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  // Coverage gap (post-implementation): the predicate in matrixPublicFact() has
  // four branches — value_bool, value_number, value_text, value_json — but the
  // tests above only exercise the value_text branch with a populated value
  // during recheck. If a future refactor were to collapse the predicate to
  // check only value_text (or break any single branch), boolean / numeric /
  // multi_enum criteria mid-recheck would silently flip to Unverified, taking
  // verified cells offline for the duration of the recheck window. The
  // following cases lock in each branch with a populated, mid-recheck value.

  it("preserves a verified boolean value (including false=0) through a mid-recheck window", async () => {
    const tempRoot = resolve("tmp");
    mkdirSync(tempRoot, { recursive: true });

    // Both true and false must be treated as a prior verified value. The
    // `0` case is the load-bearing one: a naive `!empty(...)` check would
    // misclassify false as "no value".
    for (const [storedBool, expectedValue] of [
      [1, true],
      [0, false],
    ] as const) {
      const cacheDir = mkdtempSync(join(tempRoot, "stale-api-cache-bool-"));
      try {
        const scenario = apiScenarioWith("researching");
        scenario.criteria[0].value_type = "boolean";
        scenario.facts[0].value_text = null;
        scenario.facts[0].value_bool = storedBool;
        scenario.facts[0].selected_attempt_id = 7777;

        const response = await runMatrixApi("email", scenario, cacheDir);

        expect(response.status).toBe(200);
        const alternative = response.json.data.alternatives.find(
          (alt) => alt.id === "alpha-mail",
        );
        const fact = alternative?.facts.ownership;
        expect(
          fact?.status,
          `boolean ${storedBool} mid-recheck must render as verified`,
        ).toBe("verified");
        expect(fact?.value).toBe(expectedValue);
      } finally {
        rmSync(cacheDir, { recursive: true, force: true });
      }
    }
  });

  it("preserves a verified numeric value (including 0) through a failed-recheck window", async () => {
    const tempRoot = resolve("tmp");
    mkdirSync(tempRoot, { recursive: true });

    // 0 is the tricky case here too: a naive truthy check on value_number
    // would treat 0 as "no value", but a verified 0 is a real, meaningful
    // result for criteria like "ad-tracker count".
    for (const stored of [0, 42] as const) {
      const cacheDir = mkdtempSync(join(tempRoot, "stale-api-cache-num-"));
      try {
        const scenario = apiScenarioWith("needs-deeper-research");
        scenario.criteria[0].value_type = "number";
        scenario.facts[0].value_text = null;
        scenario.facts[0].value_number = stored;
        scenario.facts[0].selected_attempt_id = 7777;

        const response = await runMatrixApi("email", scenario, cacheDir);

        expect(response.status).toBe(200);
        const alternative = response.json.data.alternatives.find(
          (alt) => alt.id === "alpha-mail",
        );
        const fact = alternative?.facts.ownership;
        expect(
          fact?.status,
          `numeric ${stored} after a failed recheck must render as verified`,
        ).toBe("verified");
        expect(fact?.value).toBe(stored);
      } finally {
        rmSync(cacheDir, { recursive: true, force: true });
      }
    }
  });

  it("preserves a verified multi_enum (JSON) value through a mid-recheck window", async () => {
    const tempRoot = resolve("tmp");
    mkdirSync(tempRoot, { recursive: true });
    const cacheDir = mkdtempSync(join(tempRoot, "stale-api-cache-json-"));
    try {
      const scenario = apiScenarioWith("researching");
      scenario.criteria[0].value_type = "multi_enum";
      scenario.facts[0].value_text = null;
      scenario.facts[0].value_json = JSON.stringify(["eu", "self_hosted"]);
      scenario.facts[0].selected_attempt_id = 7777;

      const response = await runMatrixApi("email", scenario, cacheDir);

      expect(response.status).toBe(200);
      const alternative = response.json.data.alternatives.find(
        (alt) => alt.id === "alpha-mail",
      );
      const fact = alternative?.facts.ownership;
      expect(fact?.status).toBe("verified");
      expect(fact?.value).toEqual(["eu", "self_hosted"]);
    } finally {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });
});
