import { existsSync, readFileSync } from "node:fs";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Tests for issue #471: when the persister settles a fact to
 * `needs-deeper-research`, it must:
 *   1. Increment `matrix_facts.deeper_research_attempt_count`.
 *   2. Set `matrix_facts.deeper_research_next_eligible_at` to a future
 *      timestamp following the schedule 1d / 3d / 7d / 30d-each-after.
 *
 * Conversely, settling the fact to `verified` must reset both columns
 * (count=0, next_eligible_at=NULL) — the fact has left the deeper
 * queue, so its backoff state is no longer meaningful.
 */

const persistenceScriptUrl = new URL(
  "../scripts/matrix-research-persist.php",
  import.meta.url,
);
const stateMarker = "__DEEPER_PERSISTENCE_STATE__";

let phpPromise: Promise<PHP> | undefined;

type MatrixFactStatus =
  | "open"
  | "researching"
  | "verified"
  | "rejected"
  | "needs-deeper-research"
  | "not-applicable";

type MatrixFactRow = {
  id: number;
  status: MatrixFactStatus;
  value_bool: number | null;
  value_number: number | string | null;
  value_text: string | null;
  value_json: string | null;
  public_source_url: string | null;
  public_source_title: string | null;
  public_source_accessed_date: string | null;
  selected_attempt_id: number | null;
  deeper_research_attempt_count: number;
  /** ISO datetime or null. */
  deeper_research_next_eligible_at: string | null;
};

type Scenario = {
  /** ISO datetime that the PHP NOW() should return. */
  now: string;
  facts: MatrixFactRow[];
  attempts: Array<Record<string, unknown>>;
  verifications: Array<Record<string, unknown>>;
  transactions: string[];
  updates: Array<{
    factId: number | null;
    setStatus: string | null;
    setAttemptCount: number | null;
    setNextEligibleAt: string | null;
  }>;
  nextAttemptId: number;
  nextVerificationId: number;
  lastInsertId: number;
};

type RunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  state: Scenario;
};

type ResearchAttempt = {
  factId: number;
  agent: string;
  model: string | null;
  command: string | null;
  proposedStatus: string;
  proposedValue: boolean | number | string | string[] | null;
  sourceUrl: string;
  sourceTitle: string | null;
  accessedDate: string;
  auditQuote: string;
  confidence: string;
  status: string;
  rawResponse: string;
};

type VerificationDecision = {
  attempt: { factId: number; status: string };
  accepted: boolean;
  recommendedAttemptStatus: string;
  recommendedFactStatus: string;
  countableVerifierCount: number;
  verifications: Array<Record<string, unknown>>;
};

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime("8.3").then((runtime) => {
    const php = new PHP(runtime);
    useHostFilesystem(php);
    return php;
  });
  return phpPromise;
}

function readPersistenceScript(): string {
  expect(existsSync(persistenceScriptUrl)).toBe(true);
  return readFileSync(persistenceScriptUrl, "utf8");
}

function baseScenario(
  factOverrides: Partial<MatrixFactRow> = {},
): Scenario {
  return {
    now: "2026-05-27 12:00:00",
    facts: [
      {
        id: 999,
        status: "researching",
        value_bool: null,
        value_number: null,
        value_text: null,
        value_json: null,
        public_source_url: null,
        public_source_title: null,
        public_source_accessed_date: null,
        selected_attempt_id: null,
        deeper_research_attempt_count: 0,
        deeper_research_next_eligible_at: null,
        ...factOverrides,
      },
    ],
    attempts: [],
    verifications: [],
    transactions: [],
    updates: [],
    nextAttemptId: 500,
    nextVerificationId: 800,
    lastInsertId: 0,
  };
}

function baseAttempt(
  overrides: Partial<ResearchAttempt> = {},
): ResearchAttempt {
  return {
    factId: 999,
    agent: "codex",
    model: "gpt-5",
    command: "codex exec",
    proposedStatus: "verified",
    proposedValue: "Owned by Foundation",
    sourceUrl: "https://example.test/source",
    sourceTitle: "Source Title",
    accessedDate: "2026-05-27",
    auditQuote: "Short quote.",
    confidence: "high",
    status: "needs-verification",
    rawResponse: "raw",
    ...overrides,
  };
}

function verifierRow(verifierIndex: number, overrides: Record<string, unknown> = {}) {
  return {
    factId: 999,
    verifierIndex,
    agent: "codex",
    model: "gpt-5",
    command: "codex exec",
    sourceUrl: `https://example.test/v-${verifierIndex}`,
    sourceTitle: "Source",
    accessedDate: "2026-05-27",
    auditQuote: `Verifier ${verifierIndex} quote.`,
    verdict: "supports",
    notes: `Verifier ${verifierIndex} confirmed.`,
    countsTowardAcceptance: true,
    rawResponse: `raw-v-${verifierIndex}`,
    ...overrides,
  };
}

function deeperDecision(): VerificationDecision {
  return {
    attempt: { factId: 999, status: "needs-verification" },
    accepted: false,
    recommendedAttemptStatus: "needs-deeper-research",
    recommendedFactStatus: "needs-deeper-research",
    countableVerifierCount: 1,
    verifications: [
      verifierRow(1),
      verifierRow(2, { verdict: "inconclusive", countsTowardAcceptance: false }),
      verifierRow(3, { verdict: "inconclusive", countsTowardAcceptance: false }),
    ],
  };
}

function acceptedDecision(): VerificationDecision {
  return {
    attempt: { factId: 999, status: "needs-verification" },
    accepted: true,
    recommendedAttemptStatus: "accepted",
    recommendedFactStatus: "verified",
    countableVerifierCount: 3,
    verifications: [verifierRow(1), verifierRow(2), verifierRow(3)],
  };
}

function rejectedDecision(): VerificationDecision {
  return {
    attempt: { factId: 999, status: "needs-verification" },
    accepted: false,
    recommendedAttemptStatus: "rejected",
    recommendedFactStatus: "rejected",
    countableVerifierCount: 1,
    verifications: [
      verifierRow(1, { verdict: "contradicts", countsTowardAcceptance: false }),
      verifierRow(2, { verdict: "contradicts", countsTowardAcceptance: false }),
      verifierRow(3, { verdict: "contradicts", countsTowardAcceptance: false }),
    ],
  };
}

function buildBehaviorCode(args: string[], scenario: Scenario): string {
  const argv = ["scripts/matrix-research-persist.php", ...args];
  const sanitized = readPersistenceScript()
    // Strip the leading `<?php` and `declare(strict_types=1);` — the
    // outer harness file already declares those.
    .replace(/^<\?php\s*/, "")
    .replace(/declare\(strict_types=1\);\s*/g, "")
    .replace(/require_once[^\n]*\n/g, "")
    .replace(
      /if \(php_sapi_name\(\) !== 'cli'\) \{[\s\S]*?\}\s*\n/,
      "",
    )
    .replace(
      /try \{\s*runPersistenceFinalizer\(\$argv\);[\s\S]*?exit\(1\);\s*\}\s*\n/,
      "",
    );

  return `<?php
declare(strict_types=1);

$deeperPersistenceState = json_decode(${JSON.stringify(JSON.stringify(scenario))}, true, 512, JSON_THROW_ON_ERROR);
$argv = json_decode(${JSON.stringify(JSON.stringify(argv))}, true, 512, JSON_THROW_ON_ERROR);

if (!defined('STDERR')) { define('STDERR', fopen('php://stderr', 'wb')); }
if (!defined('STDOUT')) { define('STDOUT', fopen('php://stdout', 'wb')); }

register_shutdown_function(static function (): void {
    global $deeperPersistenceState;
    echo "\\n${stateMarker}" . json_encode($deeperPersistenceState, JSON_THROW_ON_ERROR) . "\\n";
});

final class DeeperPersistenceTestPdo extends PDO
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
        return new DeeperPersistenceTestStatement($this->state, $query);
    }

    public function lastInsertId(?string $name = null): string|false
    {
        return (string) $this->state['lastInsertId'];
    }
}

final class DeeperPersistenceTestStatement extends PDOStatement
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
        $normalized = deeper_persistence_normalize_sql($this->sql);

        if (str_contains($normalized, 'insert into matrix_fact_attempts')) {
            $id = $this->state['nextAttemptId']++;
            $this->state['lastInsertId'] = $id;
            $this->state['attempts'][] = ['id' => $id, 'params' => $params];
            $this->affectedRows = 1;
            return true;
        }

        if (str_contains($normalized, 'insert into matrix_fact_verifications')) {
            $id = $this->state['nextVerificationId']++;
            $this->state['lastInsertId'] = $id;
            $this->state['verifications'][] = ['id' => $id, 'params' => $params];
            $this->affectedRows = 1;
            return true;
        }

        if (str_contains($normalized, 'update matrix_facts')) {
            $this->affectedRows = deeper_persistence_update_fact($this->state, $params);
            return true;
        }

        if (str_contains($normalized, 'from matrix_facts')) {
            $this->rows = deeper_persistence_select_fact_rows($this->state, $params);
            $this->cursor = 0;
            return true;
        }

        throw new RuntimeException('Unexpected SQL: ' . $this->sql);
    }

    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        if (!array_key_exists($this->cursor, $this->rows)) { return false; }
        return $this->rows[$this->cursor++];
    }

    public function rowCount(): int { return $this->affectedRows; }
}

function deeper_persistence_select_fact_rows(array $state, array $params): array
{
    $factId = deeper_persistence_param($params, 'fact_id');
    $rows = [];
    foreach ($state['facts'] as $fact) {
        if ($factId !== null && $fact['id'] !== $factId) { continue; }
        $rows[] = [
            'id' => $fact['id'],
            'status' => $fact['status'],
            'selected_attempt_id' => $fact['selected_attempt_id'] ?? null,
            'deeper_research_attempt_count' => $fact['deeper_research_attempt_count'] ?? 0,
            'deeper_research_next_eligible_at' => $fact['deeper_research_next_eligible_at'] ?? null,
            'attempt_count' => $fact['deeper_research_attempt_count'] ?? 0,
        ];
    }
    return $rows;
}

function getDatabaseConnection(): PDO
{
    global $deeperPersistenceState;
    return new DeeperPersistenceTestPdo($deeperPersistenceState);
}

function deeper_persistence_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function deeper_persistence_param(array $params, string $name): mixed
{
    foreach ([$name, ':' . $name] as $key) {
        if (array_key_exists($key, $params)) { return $params[$key]; }
    }
    return null;
}

function deeper_persistence_resolve_next_eligible_at(array $state, mixed $rawValue): ?string
{
    if ($rawValue === null) { return null; }
    if (is_string($rawValue)) {
        // The implementation may pass an absolute datetime string already
        // computed in PHP (via date()/DateTimeImmutable). We accept it as-is.
        // If it is a relative interval like "1 day" we also let it through,
        // but the typical pattern is an absolute YYYY-MM-DD HH:MM:SS string.
        return $rawValue;
    }
    return null;
}

function deeper_persistence_update_fact(array &$state, array $params): int
{
    $factId = deeper_persistence_param($params, 'fact_id');
    $requiredStatus = deeper_persistence_param($params, 'required_status');
    $affected = 0;

    foreach ($state['facts'] as &$fact) {
        if ($fact['id'] !== $factId) { continue; }
        if ($requiredStatus !== null && $fact['status'] !== $requiredStatus) { continue; }

        $newStatus = deeper_persistence_param($params, 'status');
        $fact['status'] = $newStatus;

        // Always re-derive value_* / public_source_* from params so the existing
        // happy-path persistence behavior is preserved.
        foreach ([
            'value_bool',
            'value_number',
            'value_text',
            'value_json',
            'public_source_url',
            'public_source_title',
            'public_source_accessed_date',
            'selected_attempt_id',
        ] as $col) {
            if (deeper_persistence_param($params, $col) !== null || array_key_exists(':' . $col, $params) || array_key_exists($col, $params)) {
                $fact[$col] = deeper_persistence_param($params, $col);
            }
        }

        // Pick up backoff bookkeeping if the UPDATE supplied either column.
        $rawCount = deeper_persistence_param($params, 'deeper_research_attempt_count');
        if ($rawCount !== null) {
            $fact['deeper_research_attempt_count'] = (int) $rawCount;
        }
        $rawEligible = deeper_persistence_param($params, 'deeper_research_next_eligible_at');
        $resolvedEligible = deeper_persistence_resolve_next_eligible_at($state, $rawEligible);
        if (array_key_exists(':deeper_research_next_eligible_at', $params) || array_key_exists('deeper_research_next_eligible_at', $params)) {
            $fact['deeper_research_next_eligible_at'] = $resolvedEligible;
        }

        $state['updates'][] = [
            'factId' => (int) $factId,
            'setStatus' => $newStatus,
            'setAttemptCount' => array_key_exists(':deeper_research_attempt_count', $params) || array_key_exists('deeper_research_attempt_count', $params)
                ? (int) $rawCount
                : null,
            'setNextEligibleAt' => $resolvedEligible,
        ];

        $affected++;
    }
    unset($fact);

    return $affected;
}

${sanitized}

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

function parseRun(stdout: string, stderr: string, exitCode: number): RunResult {
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
  return {
    exitCode,
    stderr,
    stdout,
    state: JSON.parse(stateLine.slice(stateMarker.length)) as Scenario,
  };
}

async function runPersistence(
  attempt: ResearchAttempt,
  decision: VerificationDecision | null,
  scenario: Scenario,
): Promise<RunResult> {
  const args = ["--attempt-json", JSON.stringify(attempt)];
  if (decision !== null) {
    args.push("--decision-json", JSON.stringify(decision));
  }
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

// The PHP persister evaluates DateTimeImmutable('now') against real wall-clock,
// not the scenario.now field. To keep these tests stable across calendar dates,
// anchor the expected offset to a Date.now() snapshot captured immediately
// before invoking the persister.
function wallClockDeltaDays(beforeMs: number, toIso: string): number {
  const target = Date.parse(toIso.replace(" ", "T") + "Z");
  return (target - beforeMs) / (1000 * 60 * 60 * 24);
}

afterAll(async () => {
  if (phpPromise) {
    const php = await phpPromise;
    php.exit(0);
  }
});

describe("matrix research persistence — deeper-research backoff", () => {
  it("on the 1st settle to needs-deeper-research sets attempt_count=1 and next_eligible_at ≈ +1 day", async () => {
    const scenario = baseScenario({
      deeper_research_attempt_count: 0,
      deeper_research_next_eligible_at: null,
    });

    const beforeMs = Date.now();
    const result = await runPersistence(baseAttempt(), deeperDecision(), scenario);

    expect(result.exitCode).toBe(0);
    const fact = result.state.facts[0];
    expect(fact.status).toBe("needs-deeper-research");
    expect(fact.deeper_research_attempt_count).toBe(1);
    expect(fact.deeper_research_next_eligible_at).not.toBeNull();
    const delta = wallClockDeltaDays(
      beforeMs,
      fact.deeper_research_next_eligible_at as string,
    );
    // Tolerance window is anchored to wall-clock at test start, not to the
    // unused scenario.now field — the PHP implementation reads real time.
    expect(delta).toBeGreaterThanOrEqual(0.9);
    expect(delta).toBeLessThanOrEqual(1.5);
  });

  it("on the 2nd settle to needs-deeper-research advances next_eligible_at to ≈ +3 days", async () => {
    const scenario = baseScenario({
      deeper_research_attempt_count: 1,
      deeper_research_next_eligible_at: "2026-05-26 12:00:00",
    });

    const beforeMs = Date.now();
    const result = await runPersistence(baseAttempt(), deeperDecision(), scenario);

    expect(result.exitCode).toBe(0);
    const fact = result.state.facts[0];
    expect(fact.deeper_research_attempt_count).toBe(2);
    const delta = wallClockDeltaDays(
      beforeMs,
      fact.deeper_research_next_eligible_at as string,
    );
    expect(delta).toBeGreaterThanOrEqual(2.9);
    expect(delta).toBeLessThanOrEqual(3.5);
  });

  it("on the 3rd settle to needs-deeper-research advances next_eligible_at to ≈ +7 days", async () => {
    const scenario = baseScenario({
      deeper_research_attempt_count: 2,
      deeper_research_next_eligible_at: "2026-05-26 12:00:00",
    });

    const beforeMs = Date.now();
    const result = await runPersistence(baseAttempt(), deeperDecision(), scenario);

    expect(result.exitCode).toBe(0);
    const fact = result.state.facts[0];
    expect(fact.deeper_research_attempt_count).toBe(3);
    const delta = wallClockDeltaDays(
      beforeMs,
      fact.deeper_research_next_eligible_at as string,
    );
    expect(delta).toBeGreaterThanOrEqual(6.9);
    expect(delta).toBeLessThanOrEqual(7.5);
  });

  it("on the 4th and subsequent settles uses the 30-day plateau indefinitely", async () => {
    for (const prevCount of [3, 4, 16]) {
      const scenario = baseScenario({
        deeper_research_attempt_count: prevCount,
        deeper_research_next_eligible_at: "2026-05-26 12:00:00",
      });

      const beforeMs = Date.now();
      const result = await runPersistence(
        baseAttempt(),
        deeperDecision(),
        scenario,
      );

      expect(result.exitCode, `prev=${String(prevCount)}`).toBe(0);
      const fact = result.state.facts[0];
      expect(
        fact.deeper_research_attempt_count,
        `prev=${String(prevCount)}`,
      ).toBe(prevCount + 1);
      const delta = wallClockDeltaDays(
        beforeMs,
        fact.deeper_research_next_eligible_at as string,
      );
      expect(delta, `prev=${String(prevCount)}`).toBeGreaterThanOrEqual(29.5);
      expect(delta, `prev=${String(prevCount)}`).toBeLessThanOrEqual(30.5);
    }
  });

  it("on settle to verified resets attempt_count to 0 and next_eligible_at to NULL", async () => {
    const scenario = baseScenario({
      deeper_research_attempt_count: 3,
      deeper_research_next_eligible_at: "2026-06-03 12:00:00",
    });

    const result = await runPersistence(
      baseAttempt(),
      acceptedDecision(),
      scenario,
    );

    expect(result.exitCode).toBe(0);
    const fact = result.state.facts[0];
    expect(fact.status).toBe("verified");
    expect(fact.deeper_research_attempt_count).toBe(0);
    expect(fact.deeper_research_next_eligible_at).toBeNull();
  });

  it("on settle to rejected (non-deeper-research unresolved) leaves prior backoff bookkeeping untouched", async () => {
    // Implementation contract from #471: only the `needs-deeper-research`
    // settle branch advances the backoff counters. Any other unresolved
    // status — `rejected` is the canonical case — must NOT touch
    // deeper_research_attempt_count or deeper_research_next_eligible_at.
    // If the persister accidentally wrote these columns on a rejected
    // settle, a fact that has cycled through deeper-research could either
    // be reset (losing audit context) or re-cooled-down incorrectly.
    const priorEligibleAt = "2026-06-03 12:00:00";
    const scenario = baseScenario({
      deeper_research_attempt_count: 2,
      deeper_research_next_eligible_at: priorEligibleAt,
    });

    const result = await runPersistence(
      baseAttempt(),
      rejectedDecision(),
      scenario,
    );

    expect(result.exitCode).toBe(0);
    const fact = result.state.facts[0];
    expect(fact.status).toBe("rejected");
    // Backoff state must be frozen at the prior values.
    expect(fact.deeper_research_attempt_count).toBe(2);
    expect(fact.deeper_research_next_eligible_at).toBe(priorEligibleAt);
    // And the UPDATE itself must not carry backoff params at all — the
    // recorded update row should reflect that the persister picked the
    // non-deeper-research code path.
    const updateRow = result.state.updates.find((u) => u.factId === 999);
    expect(updateRow).toBeDefined();
    expect(updateRow?.setStatus).toBe("rejected");
    expect(updateRow?.setAttemptCount).toBeNull();
  });

  it("preserves prior attempt history: a successful settle after two failed attempts leaves the old attempt rows intact", async () => {
    // Start with two prior failed attempts already in the table to mimic
    // two earlier deeper-research cycles. The third (success) attempt
    // must not delete or rewrite them.
    const scenario = baseScenario({
      deeper_research_attempt_count: 2,
      deeper_research_next_eligible_at: "2026-06-03 12:00:00",
    });
    scenario.attempts = [
      { id: 100, params: { fact_id: 999, status: "needs-deeper-research" } },
      { id: 101, params: { fact_id: 999, status: "needs-deeper-research" } },
    ];
    scenario.nextAttemptId = 500;

    const result = await runPersistence(
      baseAttempt(),
      acceptedDecision(),
      scenario,
    );

    expect(result.exitCode).toBe(0);
    // The two prior attempt rows must still be present, plus the new
    // (id=500) success row inserted by the persister.
    expect(result.state.attempts.map((a) => a.id).sort()).toEqual([100, 101, 500]);
  });
});
