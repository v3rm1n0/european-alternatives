import { existsSync, readFileSync } from "node:fs";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

const persistenceScriptUrl = new URL(
  "../scripts/matrix-research-persist.php",
  import.meta.url,
);
const stateMarker = "__PERSISTENCE_STATE__";

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
};

type AttemptRow = {
  id: number;
  fact_id: number;
  agent: string;
  model: string | null;
  command: string | null;
  proposed_status: string;
  proposed_value_bool: number | null;
  proposed_value_number: number | string | null;
  proposed_value_text: string | null;
  proposed_value_json: string | null;
  source_url: string;
  source_title: string | null;
  accessed_date: string;
  audit_quote: string;
  raw_response: string;
  status: string;
};

type VerificationRow = {
  id: number;
  attempt_id: number;
  verifier_index: number;
  agent: string;
  source_url: string;
  source_title: string | null;
  accessed_date: string;
  audit_quote: string;
  verdict: string;
  notes: string;
  raw_response: string;
};

type PersistenceScenario = {
  facts: MatrixFactRow[];
  attempts: AttemptRow[];
  verifications: VerificationRow[];
  transactions: string[];
  updates: Array<{
    affected: number;
    factId: number | null;
    status: string | null;
  }>;
  connections: number;
  nextAttemptId: number;
  nextVerificationId: number;
  lastInsertId: number;
};

type PersistencePayload = {
  factId: number;
  attemptId: number;
  factStatus: MatrixFactStatus;
  attemptStatus: string;
  verifierRowsInserted: number;
  selectedAttemptId: number | null;
};

type PersistenceRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  payload?: PersistencePayload;
  state: PersistenceScenario;
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

type VerificationRecord = {
  factId: number;
  verifierIndex: number;
  agent: string;
  model: string | null;
  command: string | null;
  sourceUrl: string;
  sourceTitle: string | null;
  accessedDate: string;
  auditQuote: string;
  verdict: string;
  notes: string;
  countsTowardAcceptance: boolean;
  rawResponse: string;
};

type VerificationDecision = {
  attempt: {
    factId: number;
    status: string;
  };
  accepted: boolean;
  recommendedAttemptStatus: string;
  recommendedFactStatus: string;
  countableVerifierCount: number;
  verifications: VerificationRecord[];
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
  expect(
    existsSync(persistenceScriptUrl),
    "Expected scripts/matrix-research-persist.php to define the runtime persistence finalizer",
  ).toBe(true);

  return readFileSync(persistenceScriptUrl, "utf8");
}

function getFunctionSource(source: string, functionName: string): string {
  const start = source.indexOf(`function ${functionName}(`);
  if (start < 0) {
    throw new Error(
      `Expected scripts/matrix-research-persist.php to define ${functionName}()`,
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

function extractPersistenceRuntimeSource(source: string): string {
  const constants = source.match(/const INVALID_USAGE = 64;/);

  if (constants === null) {
    throw new Error("Expected persistence exit-code constants to be defined");
  }

  const functions = [
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
  ].map((functionName) => getFunctionSource(source, functionName));

  return [constants[0], ...functions].join("\n\n");
}

function persistenceScenario(): PersistenceScenario {
  return {
    facts: [
      {
        id: 123,
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
      {
        id: 124,
        status: "researching",
        value_bool: null,
        value_number: null,
        value_text: "existing unrelated value",
        value_json: null,
        public_source_url: "https://example.test/existing",
        public_source_title: "Existing source",
        public_source_accessed_date: "2026-01-01",
        selected_attempt_id: 88,
      },
      {
        id: 125,
        status: "open",
        value_bool: null,
        value_number: null,
        value_text: null,
        value_json: null,
        public_source_url: null,
        public_source_title: null,
        public_source_accessed_date: null,
        selected_attempt_id: null,
      },
      {
        id: 126,
        status: "needs-deeper-research",
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
    nextAttemptId: 700,
    nextVerificationId: 900,
    lastInsertId: 0,
  };
}

function baseAttempt(
  overrides: Partial<ResearchAttempt> = {},
): ResearchAttempt {
  return {
    factId: 123,
    agent: "codex",
    model: "gpt-research",
    command: "codex exec",
    proposedStatus: "verified",
    proposedValue: true,
    sourceUrl: "https://example.test/element/security",
    sourceTitle: "Element security overview",
    accessedDate: "2026-05-25",
    auditQuote: "Private rooms are end-to-end encrypted by default.",
    confidence: "high",
    status: "needs-verification",
    rawResponse: "researcher raw response",
    ...overrides,
  };
}

function verificationRecord(
  verifierIndex: number,
  overrides: Partial<VerificationRecord> = {},
): VerificationRecord {
  return {
    factId: 123,
    verifierIndex,
    agent: "codex",
    model: "gpt-verifier",
    command: "codex exec",
    sourceUrl: `https://example.test/element/security-${verifierIndex}`,
    sourceTitle: "Element security overview",
    accessedDate: "2026-05-25",
    auditQuote: `Verifier ${verifierIndex} copied a source quote.`,
    verdict: "supports",
    notes: `Verifier ${verifierIndex} checked the selected source.`,
    countsTowardAcceptance: true,
    rawResponse: `verifier ${verifierIndex} raw response`,
    ...overrides,
  };
}

function acceptedDecision(): VerificationDecision {
  return {
    attempt: {
      factId: 123,
      status: "needs-verification",
    },
    accepted: true,
    recommendedAttemptStatus: "accepted",
    recommendedFactStatus: "verified",
    countableVerifierCount: 3,
    verifications: [1, 2, 3].map((index) => verificationRecord(index)),
  };
}

function rejectedDecision(): VerificationDecision {
  return {
    attempt: {
      factId: 123,
      status: "needs-verification",
    },
    accepted: false,
    recommendedAttemptStatus: "rejected",
    recommendedFactStatus: "rejected",
    countableVerifierCount: 1,
    verifications: [
      verificationRecord(1),
      verificationRecord(2, {
        verdict: "contradicts",
        countsTowardAcceptance: false,
        notes: "The source contradicts the proposed value.",
      }),
      verificationRecord(3, {
        verdict: "inconclusive",
        countsTowardAcceptance: false,
        notes: "The source does not establish the proposed value.",
      }),
    ],
  };
}

function needsDeeperResearchDecision(): VerificationDecision {
  return {
    attempt: {
      factId: 123,
      status: "needs-verification",
    },
    accepted: false,
    recommendedAttemptStatus: "needs-deeper-research",
    recommendedFactStatus: "needs-deeper-research",
    countableVerifierCount: 2,
    verifications: [
      verificationRecord(1),
      verificationRecord(2),
      verificationRecord(3, {
        verdict: "inconclusive",
        countsTowardAcceptance: false,
        notes: "The verifier could not confirm the selected fact.",
      }),
    ],
  };
}

function buildPersistenceBehaviorCode(
  args: string[],
  scenario: PersistenceScenario,
): string {
  const argv = ["scripts/matrix-research-persist.php", ...args];

  return `<?php
declare(strict_types=1);

$matrixResearchPersistenceState = json_decode(${JSON.stringify(
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
    global $matrixResearchPersistenceState;
    echo "\\n${stateMarker}" . json_encode($matrixResearchPersistenceState, JSON_THROW_ON_ERROR) . "\\n";
});

final class MatrixResearchPersistenceTestPdo extends PDO
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
        return new MatrixResearchPersistenceTestStatement($this->state, $query);
    }

    public function lastInsertId(?string $name = null): string|false
    {
        return (string) $this->state['lastInsertId'];
    }
}

final class MatrixResearchPersistenceTestStatement extends PDOStatement
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
        $normalized = matrix_research_persistence_test_normalize_sql($this->sql);

        if (str_contains($normalized, 'insert into matrix_fact_attempts')) {
            $this->affectedRows = matrix_research_persistence_test_insert_attempt($this->state, $params);

            return true;
        }

        if (str_contains($normalized, 'insert into matrix_fact_verifications')) {
            $this->affectedRows = matrix_research_persistence_test_insert_verification($this->state, $params);

            return true;
        }

        if (str_contains($normalized, 'update matrix_facts')) {
            $this->affectedRows = matrix_research_persistence_test_update_fact($this->state, $normalized, $params);

            return true;
        }

        if (str_contains($normalized, 'from matrix_facts')) {
            $this->rows = matrix_research_persistence_test_select_facts($this->state, $params);
            $this->cursor = 0;
            $this->affectedRows = count($this->rows);

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

    public function rowCount(): int
    {
        return $this->affectedRows;
    }
}

function getDatabaseConnection(): PDO
{
    global $matrixResearchPersistenceState;
    $matrixResearchPersistenceState['connections']++;

    return new MatrixResearchPersistenceTestPdo($matrixResearchPersistenceState);
}

function matrix_research_persistence_test_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function matrix_research_persistence_test_param(array $params, string $name): mixed
{
    foreach ([$name, ':' . $name] as $key) {
        if (array_key_exists($key, $params)) {
            return $params[$key];
        }
    }

    return null;
}

function matrix_research_persistence_test_insert_attempt(array &$state, array $params): int
{
    $id = $state['nextAttemptId'];
    $state['nextAttemptId']++;
    $state['lastInsertId'] = $id;
    $state['attempts'][] = [
        'id' => $id,
        'fact_id' => matrix_research_persistence_test_param($params, 'fact_id'),
        'agent' => matrix_research_persistence_test_param($params, 'agent'),
        'model' => matrix_research_persistence_test_param($params, 'model'),
        'command' => matrix_research_persistence_test_param($params, 'command'),
        'proposed_status' => matrix_research_persistence_test_param($params, 'proposed_status'),
        'proposed_value_bool' => matrix_research_persistence_test_param($params, 'proposed_value_bool'),
        'proposed_value_number' => matrix_research_persistence_test_param($params, 'proposed_value_number'),
        'proposed_value_text' => matrix_research_persistence_test_param($params, 'proposed_value_text'),
        'proposed_value_json' => matrix_research_persistence_test_param($params, 'proposed_value_json'),
        'source_url' => matrix_research_persistence_test_param($params, 'source_url'),
        'source_title' => matrix_research_persistence_test_param($params, 'source_title'),
        'accessed_date' => matrix_research_persistence_test_param($params, 'accessed_date'),
        'audit_quote' => matrix_research_persistence_test_param($params, 'audit_quote'),
        'raw_response' => matrix_research_persistence_test_param($params, 'raw_response'),
        'status' => matrix_research_persistence_test_param($params, 'status'),
    ];

    return 1;
}

function matrix_research_persistence_test_insert_verification(array &$state, array $params): int
{
    $id = $state['nextVerificationId'];
    $state['nextVerificationId']++;
    $state['lastInsertId'] = $id;
    $state['verifications'][] = [
        'id' => $id,
        'attempt_id' => matrix_research_persistence_test_param($params, 'attempt_id'),
        'verifier_index' => matrix_research_persistence_test_param($params, 'verifier_index'),
        'agent' => matrix_research_persistence_test_param($params, 'agent'),
        'source_url' => matrix_research_persistence_test_param($params, 'source_url'),
        'source_title' => matrix_research_persistence_test_param($params, 'source_title'),
        'accessed_date' => matrix_research_persistence_test_param($params, 'accessed_date'),
        'audit_quote' => matrix_research_persistence_test_param($params, 'audit_quote'),
        'verdict' => matrix_research_persistence_test_param($params, 'verdict'),
        'notes' => matrix_research_persistence_test_param($params, 'notes'),
        'raw_response' => matrix_research_persistence_test_param($params, 'raw_response'),
    ];

    return 1;
}

function matrix_research_persistence_test_select_facts(array $state, array $params): array
{
    $factId = matrix_research_persistence_test_param($params, 'fact_id');
    if ($factId === null) {
        $factId = matrix_research_persistence_test_param($params, 'id');
    }
    $rows = [];
    foreach ($state['facts'] as $fact) {
        if ($factId !== null && (int) $fact['id'] !== (int) $factId) {
            continue;
        }
        $rows[] = $fact + [
            'deeper_research_attempt_count' => 0,
            'attempt_count' => 0,
            'deeper_research_next_eligible_at' => null,
        ];
    }
    return $rows;
}

function matrix_research_persistence_test_update_fact(array &$state, string $normalizedSql, array $params): int
{
    $factId = matrix_research_persistence_test_param($params, 'fact_id');
    $requiredStatus = matrix_research_persistence_test_param($params, 'required_status');
    $filtersById = preg_match('/\\bid\\s*=\\s*:fact_id\\b/', $normalizedSql) === 1;
    $filtersRequiredStatus = preg_match('/\\bstatus\\s*=\\s*:required_status\\b/', $normalizedSql) === 1;
    $affected = 0;

    foreach ($state['facts'] as &$fact) {
        if ($filtersById && $fact['id'] !== $factId) {
            continue;
        }

        if ($filtersRequiredStatus && $fact['status'] !== $requiredStatus) {
            continue;
        }

        $fact['status'] = matrix_research_persistence_test_param($params, 'status');
        $fact['value_bool'] = matrix_research_persistence_test_param($params, 'value_bool');
        $fact['value_number'] = matrix_research_persistence_test_param($params, 'value_number');
        $fact['value_text'] = matrix_research_persistence_test_param($params, 'value_text');
        $fact['value_json'] = matrix_research_persistence_test_param($params, 'value_json');
        $fact['public_source_url'] = matrix_research_persistence_test_param($params, 'public_source_url');
        $fact['public_source_title'] = matrix_research_persistence_test_param($params, 'public_source_title');
        $fact['public_source_accessed_date'] = matrix_research_persistence_test_param($params, 'public_source_accessed_date');
        $fact['selected_attempt_id'] = matrix_research_persistence_test_param($params, 'selected_attempt_id');
        $affected++;
    }
    unset($fact);

    $state['updates'][] = [
        'affected' => $affected,
        'factId' => is_numeric($factId) ? (int) $factId : null,
        'status' => matrix_research_persistence_test_param($params, 'status'),
    ];

    return $affected;
}

${extractPersistenceRuntimeSource(readPersistenceScript())}

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

function parsePersistenceRun(
  stdout: string,
  stderr: string,
  exitCode: number,
): PersistenceRunResult {
  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const stateLine = lines.find((line) => line.startsWith(stateMarker));

  if (stateLine === undefined) {
    throw new Error(`Persistence test harness did not emit state: ${stdout}`);
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
        : (JSON.parse(payloadLine) as PersistencePayload),
    state: JSON.parse(
      stateLine.slice(stateMarker.length),
    ) as PersistenceScenario,
  };
}

async function runPersistence(
  attempt: ResearchAttempt,
  decision: VerificationDecision | null,
  scenario: PersistenceScenario = persistenceScenario(),
): Promise<PersistenceRunResult> {
  const args = ["--attempt-json", JSON.stringify(attempt)];

  if (decision !== null) {
    args.push("--decision-json", JSON.stringify(decision));
  }

  const php = await getPhp();
  const response = await php.runStream({
    code: buildPersistenceBehaviorCode(args, scenario),
  });

  return parsePersistenceRun(
    await response.stdoutText,
    await response.stderrText,
    await response.exitCode,
  );
}

function factById(state: PersistenceScenario, factId: number): MatrixFactRow {
  const fact = state.facts.find((candidate) => candidate.id === factId);

  if (fact === undefined) {
    throw new Error(`Missing fact ${String(factId)}`);
  }

  return fact;
}

function expectUnrelatedFactsUnchanged(state: PersistenceScenario): void {
  expect(factById(state, 124)).toMatchObject({
    status: "researching",
    value_text: "existing unrelated value",
    public_source_url: "https://example.test/existing",
    selected_attempt_id: 88,
  });
  expect(factById(state, 125)).toMatchObject({
    status: "open",
    selected_attempt_id: null,
  });
  expect(factById(state, 126)).toMatchObject({
    status: "needs-deeper-research",
    selected_attempt_id: null,
  });
}

function expectSingleSelectedAttempt(state: PersistenceScenario): AttemptRow {
  expect(state.attempts).toHaveLength(1);
  expect(state.attempts[0].fact_id).toBe(123);

  return state.attempts[0];
}

function expectSelectedVerifierRows(state: PersistenceScenario): void {
  expect(state.verifications).toHaveLength(3);
  expect(state.verifications.map((row) => row.attempt_id)).toEqual([
    700, 700, 700,
  ]);
  expect(state.verifications.map((row) => row.verifier_index)).toEqual([
    1, 2, 3,
  ]);
  expect(
    state.verifications.every((row) => row.source_url.startsWith("https://")),
  ).toBe(true);
  expect(state.verifications.every((row) => row.audit_quote.length > 0)).toBe(
    true,
  );
  expect(state.verifications.every((row) => row.raw_response.length > 0)).toBe(
    true,
  );
}

afterAll(async () => {
  if (phpPromise !== undefined) {
    const php = await phpPromise;
    php.exit();
  }
});

describe("matrix research persistence finalizer", () => {
  it("persists a verified outcome with selected attempt and verifier audit rows", async () => {
    const result = await runPersistence(baseAttempt(), acceptedDecision());

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "verified",
      attemptStatus: "accepted",
      verifierRowsInserted: 3,
      selectedAttemptId: 700,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.updates).toEqual([
      { affected: 1, factId: 123, status: "verified" },
    ]);

    expect(factById(result.state, 123)).toMatchObject({
      status: "verified",
      value_bool: 1,
      public_source_url: "https://example.test/element/security",
      public_source_title: "Element security overview",
      public_source_accessed_date: "2026-05-25",
      selected_attempt_id: 700,
    });
    expect(expectSingleSelectedAttempt(result.state)).toMatchObject({
      status: "accepted",
      source_url: "https://example.test/element/security",
      audit_quote: "Private rooms are end-to-end encrypted by default.",
      raw_response: "researcher raw response",
    });
    expectSelectedVerifierRows(result.state);
    expectUnrelatedFactsUnchanged(result.state);
  });

  it("persists a rejected outcome without publishing the proposed value", async () => {
    const result = await runPersistence(baseAttempt(), rejectedDecision());

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "rejected",
      attemptStatus: "rejected",
      verifierRowsInserted: 3,
      selectedAttemptId: null,
    });

    expect(factById(result.state, 123)).toMatchObject({
      status: "rejected",
      value_bool: null,
      value_number: null,
      value_text: null,
      value_json: null,
      public_source_url: null,
      public_source_title: null,
      public_source_accessed_date: null,
      selected_attempt_id: null,
    });
    expect(expectSingleSelectedAttempt(result.state)).toMatchObject({
      status: "rejected",
      source_url: "https://example.test/element/security",
      audit_quote: "Private rooms are end-to-end encrypted by default.",
    });
    expectSelectedVerifierRows(result.state);
    expectUnrelatedFactsUnchanged(result.state);
  });

  it("persists a rejected outcome when verifier verdicts include contradicts and not-applicable", async () => {
    const decision: VerificationDecision = {
      attempt: {
        factId: 123,
        status: "needs-verification",
      },
      accepted: false,
      recommendedAttemptStatus: "rejected",
      recommendedFactStatus: "rejected",
      countableVerifierCount: 1,
      verifications: [
        verificationRecord(1),
        verificationRecord(2, {
          verdict: "contradicts",
          countsTowardAcceptance: false,
          notes: "The source explicitly contradicts the proposed value.",
        }),
        verificationRecord(3, {
          verdict: "not-applicable",
          countsTowardAcceptance: false,
          notes:
            "The fact does not apply to the offering documented at this source.",
        }),
      ],
    };

    const result = await runPersistence(baseAttempt(), decision);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "rejected",
      attemptStatus: "rejected",
      verifierRowsInserted: 3,
      selectedAttemptId: null,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.updates).toEqual([
      { affected: 1, factId: 123, status: "rejected" },
    ]);

    expect(factById(result.state, 123)).toMatchObject({
      status: "rejected",
      value_bool: null,
      value_number: null,
      value_text: null,
      value_json: null,
      public_source_url: null,
      public_source_title: null,
      public_source_accessed_date: null,
      selected_attempt_id: null,
    });

    expect(expectSingleSelectedAttempt(result.state)).toMatchObject({
      fact_id: 123,
      status: "rejected",
      source_url: "https://example.test/element/security",
      audit_quote: "Private rooms are end-to-end encrypted by default.",
      raw_response: "researcher raw response",
    });

    expectSelectedVerifierRows(result.state);

    const contradictsRow = result.state.verifications.find(
      (row) => row.verifier_index === 2,
    );
    expect(contradictsRow, "verifier slot 2 row").toBeDefined();
    expect(contradictsRow).toMatchObject({
      attempt_id: 700,
      verdict: "contradicts",
      notes: "The source explicitly contradicts the proposed value.",
      source_url: "https://example.test/element/security-2",
      audit_quote: "Verifier 2 copied a source quote.",
    });
    expect(contradictsRow?.raw_response.length).toBeGreaterThan(0);

    const notApplicableRow = result.state.verifications.find(
      (row) => row.verifier_index === 3,
    );
    expect(notApplicableRow, "verifier slot 3 row").toBeDefined();
    expect(notApplicableRow).toMatchObject({
      attempt_id: 700,
      verdict: "not-applicable",
      notes:
        "The fact does not apply to the offering documented at this source.",
      source_url: "https://example.test/element/security-3",
      audit_quote: "Verifier 3 copied a source quote.",
    });
    expect(notApplicableRow?.raw_response.length).toBeGreaterThan(0);

    expectUnrelatedFactsUnchanged(result.state);
  });

  it("persists failed verifier evidence as a needs-deeper-research retry outcome", async () => {
    const result = await runPersistence(
      baseAttempt(),
      needsDeeperResearchDecision(),
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "needs-deeper-research",
      attemptStatus: "needs-deeper-research",
      verifierRowsInserted: 3,
      selectedAttemptId: null,
    });

    expect(factById(result.state, 123)).toMatchObject({
      status: "needs-deeper-research",
      value_bool: null,
      public_source_url: null,
      selected_attempt_id: null,
    });
    expect(expectSingleSelectedAttempt(result.state)).toMatchObject({
      status: "needs-deeper-research",
      source_url: "https://example.test/element/security",
      audit_quote: "Private rooms are end-to-end encrypted by default.",
    });
    expectSelectedVerifierRows(result.state);
    expectUnrelatedFactsUnchanged(result.state);
  });

  it("persists a source-quality-rejected verification and bounces the fact to needs-deeper-research", async () => {
    const decision: VerificationDecision = {
      attempt: {
        factId: 123,
        status: "needs-verification",
      },
      accepted: false,
      recommendedAttemptStatus: "needs-deeper-research",
      recommendedFactStatus: "needs-deeper-research",
      countableVerifierCount: 2,
      verifications: [
        verificationRecord(1),
        verificationRecord(2),
        verificationRecord(3, {
          verdict: "source-quality-rejected",
          sourceUrl: "https://example.test/element/security",
          sourceTitle: "Random third-party blog",
          auditQuote:
            "Element is a great chat app and we love using it every day.",
          notes:
            "Cited page is a third-party blog post; no official-class source supports the proposed value.",
          countsTowardAcceptance: false,
        }),
      ],
    };

    const result = await runPersistence(baseAttempt(), decision);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "needs-deeper-research",
      attemptStatus: "needs-deeper-research",
      verifierRowsInserted: 3,
      selectedAttemptId: null,
    });

    expect(factById(result.state, 123)).toMatchObject({
      status: "needs-deeper-research",
      value_bool: null,
      public_source_url: null,
      selected_attempt_id: null,
    });

    const qualityRow = result.state.verifications.find(
      (row) => row.verifier_index === 3,
    );

    expect(qualityRow, "verifier slot 3 row").toBeDefined();
    expect(qualityRow).toMatchObject({
      verdict: "source-quality-rejected",
    });
    expect(qualityRow?.notes).toMatch(/third-party|official|no.*source/i);
    expectUnrelatedFactsUnchanged(result.state);
  });

  it("persists no-evidence researcher attempts without verifier rows", async () => {
    const result = await runPersistence(
      baseAttempt({
        proposedStatus: "needs-deeper-research",
        proposedValue: null,
        sourceUrl: "https://example.test/element/help",
        sourceTitle: "Element help center",
        auditQuote:
          "This page does not document the requested encryption scope.",
        confidence: "low",
        status: "needs-deeper-research",
      }),
      null,
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "needs-deeper-research",
      attemptStatus: "needs-deeper-research",
      verifierRowsInserted: 0,
      selectedAttemptId: null,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.verifications).toEqual([]);
    expect(factById(result.state, 123)).toMatchObject({
      status: "needs-deeper-research",
      value_bool: null,
      public_source_url: null,
      selected_attempt_id: null,
    });
    expect(expectSingleSelectedAttempt(result.state)).toMatchObject({
      proposed_status: "needs-deeper-research",
      proposed_value_bool: null,
      status: "needs-deeper-research",
      source_url: "https://example.test/element/help",
      audit_quote:
        "This page does not document the requested encryption scope.",
    });
    expectUnrelatedFactsUnchanged(result.state);
  });

  it("persists a researcher-rejected attempt without verifier rows and settles the fact to rejected", async () => {
    const result = await runPersistence(
      baseAttempt({ status: "rejected" }),
      null,
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "rejected",
      attemptStatus: "rejected",
      verifierRowsInserted: 0,
      selectedAttemptId: null,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.verifications).toEqual([]);

    const attempt = expectSingleSelectedAttempt(result.state);
    expect(attempt).toMatchObject({
      fact_id: 123,
      status: "rejected",
      source_url: "https://example.test/element/security",
      audit_quote: "Private rooms are end-to-end encrypted by default.",
      raw_response: "researcher raw response",
    });

    expect(factById(result.state, 123)).toMatchObject({
      status: "rejected",
      value_bool: null,
      value_number: null,
      value_text: null,
      value_json: null,
      public_source_url: null,
      public_source_title: null,
      public_source_accessed_date: null,
      selected_attempt_id: null,
    });

    expectUnrelatedFactsUnchanged(result.state);
  });

  it("forces a rejected researcher attempt to settle as rejected even when a verifier decision recommends verification", async () => {
    const decision: VerificationDecision = {
      attempt: {
        factId: 123,
        status: "rejected",
      },
      accepted: true,
      recommendedAttemptStatus: "accepted",
      recommendedFactStatus: "verified",
      countableVerifierCount: 3,
      verifications: [1, 2, 3].map((index) => verificationRecord(index)),
    };

    const result = await runPersistence(
      baseAttempt({ status: "rejected" }),
      decision,
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.payload).toMatchObject({
      factId: 123,
      attemptId: 700,
      factStatus: "rejected",
      attemptStatus: "rejected",
      verifierRowsInserted: 3,
      selectedAttemptId: null,
    });
    expect(result.state.transactions).toEqual(["begin", "commit"]);

    expect(factById(result.state, 123)).toMatchObject({
      status: "rejected",
      value_bool: null,
      value_number: null,
      value_text: null,
      value_json: null,
      public_source_url: null,
      public_source_title: null,
      public_source_accessed_date: null,
      selected_attempt_id: null,
    });

    expect(expectSingleSelectedAttempt(result.state)).toMatchObject({
      fact_id: 123,
      status: "rejected",
      source_url: "https://example.test/element/security",
      audit_quote: "Private rooms are end-to-end encrypted by default.",
    });

    expectSelectedVerifierRows(result.state);
    expectUnrelatedFactsUnchanged(result.state);
  });

  it("rejects forged accepted decisions before database writes", async () => {
    for (const decision of [
      {
        name: "missing source URL",
        decision: {
          ...acceptedDecision(),
          verifications: [
            verificationRecord(1, { sourceUrl: "" }),
            verificationRecord(2),
            verificationRecord(3),
          ],
        },
        error: /sourceUrl|source URL|http/i,
      },
      {
        name: "missing audit quote",
        decision: {
          ...acceptedDecision(),
          verifications: [
            verificationRecord(1, { auditQuote: "" }),
            verificationRecord(2),
            verificationRecord(3),
          ],
        },
        error: /auditQuote|quote/i,
      },
      {
        name: "fewer than three verifier rows",
        decision: {
          ...acceptedDecision(),
          verifications: [verificationRecord(1), verificationRecord(2)],
        },
        error: /exactly three/i,
      },
      {
        name: "duplicate verifier slot",
        decision: {
          ...acceptedDecision(),
          verifications: [
            verificationRecord(1),
            verificationRecord(1),
            verificationRecord(3),
          ],
        },
        error: /slots 1, 2, and 3/i,
      },
      {
        name: "non-countable support",
        decision: {
          ...acceptedDecision(),
          verifications: [
            verificationRecord(1, { countsTowardAcceptance: false }),
            verificationRecord(2),
            verificationRecord(3),
          ],
        },
        error: /countable/i,
      },
      {
        name: "non-supporting verdict",
        decision: {
          ...acceptedDecision(),
          verifications: [
            verificationRecord(1, { verdict: "inconclusive" }),
            verificationRecord(2),
            verificationRecord(3),
          ],
        },
        error: /supporting/i,
      },
      {
        name: "decision attempt for another fact",
        decision: {
          ...acceptedDecision(),
          attempt: {
            factId: 124,
            status: "needs-verification",
          },
        },
        error: /decision attempt factId/i,
      },
      {
        name: "verifier record for another fact",
        decision: {
          ...acceptedDecision(),
          verifications: [
            verificationRecord(1, { factId: 124 }),
            verificationRecord(2),
            verificationRecord(3),
          ],
        },
        error: /verification factId/i,
      },
    ]) {
      const result = await runPersistence(baseAttempt(), decision.decision);

      expect(result.exitCode, decision.name).not.toBe(0);
      expect(result.payload, decision.name).toBeUndefined();
      expect(result.stderr, decision.name).toMatch(decision.error);
      expect(result.state.transactions, decision.name).toEqual([]);
      expect(result.state.attempts, decision.name).toEqual([]);
      expect(result.state.verifications, decision.name).toEqual([]);
      expect(factById(result.state, 123).status, decision.name).toBe(
        "researching",
      );
      expectUnrelatedFactsUnchanged(result.state);
    }
  });
});
