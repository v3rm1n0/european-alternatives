import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

const scriptUrl = new URL(
  "../scripts/apply-deep-research-scoring.php",
  import.meta.url,
);
const stateMarker = "__APPLY_DEEP_RESEARCH_SCORING_STATE__";

let phpPromise: Promise<PHP> | undefined;

type CatalogEntryRow = {
  id: number;
  slug: string;
  name: string;
};

type PositiveSignalRow = {
  id: number;
  entry_id: number;
  signal_key: string;
  sort_order: number;
  dimension: string;
  amount: number | string;
  text_en: string;
  text_de: string | null;
  source_url: string | null;
};

type ReservationRow = {
  id: number;
  entry_id: number;
  reservation_key: string;
  sort_order: number;
  severity: string;
  event_date: string | null;
  penalty_tier: string | null;
  penalty_amount: number | string | null;
  is_structural: number;
  text_en: string;
  text_de: string | null;
  source_url: string | null;
};

type ScoringMetadataRow = {
  entry_id: number;
  base_class_override: string | null;
  is_ad_surveillance: number | null;
  deep_research_path: string | null;
  worksheet_path: string | null;
};

type Scenario = {
  catalog_entries: CatalogEntryRow[];
  positive_signals: PositiveSignalRow[];
  reservations: ReservationRow[];
  scoring_metadata: ScoringMetadataRow[];
  transactions: string[];
  statements: Array<{ sql: string; params: Record<string, unknown> }>;
  invalidate_cache_calls: number;
  admin_log: string[];
  for_update_locks: number[];
  next_id: number;
  fail_next_execute_with: string | null;
};

type ApplyOutcome = {
  ok?: boolean;
  entrySlug?: string;
  dryRun?: boolean;
  rolledBack?: boolean;
  alreadyScored?: boolean;
  requiresReplaceFlag?: boolean;
  replacedExisting?: boolean;
  error?: string;
  changesApplied?: Array<Record<string, unknown>>;
  plan?: Array<Record<string, unknown>>;
};

type ApplyRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  outcome?: ApplyOutcome;
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

function readScript(): string {
  expect(
    existsSync(scriptUrl),
    "Expected scripts/apply-deep-research-scoring.php to define the deep-research scoring DB-write runner",
  ).toBe(true);

  return readFileSync(scriptUrl, "utf8");
}

function getFunctionSource(source: string, functionName: string): string {
  const start = source.search(new RegExp(`function\\s+${functionName}\\s*\\(`));

  if (start < 0) {
    throw new Error(
      `Expected scripts/apply-deep-research-scoring.php to define ${functionName}()`,
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

function extractAllFunctions(source: string): string {
  const regex = /(?<!::|->|\w)function\s+([A-Za-z_]\w*)\s*\(/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    names.add(match[1]);
  }

  const bodies: string[] = [];
  for (const name of names) {
    bodies.push(getFunctionSource(source, name));
  }

  return bodies.join("\n\n");
}

function extractConstants(source: string): string {
  const matches = source.match(/^const\s+\w+\s*=\s*[^;]+;/gm) ?? [];
  return matches.join("\n");
}

function baseScenario(): Scenario {
  return {
    catalog_entries: [
      { id: 501, slug: "proton-mail", name: "Proton Mail" },
      { id: 502, slug: "tutanota", name: "Tutanota" },
    ],
    positive_signals: [],
    reservations: [],
    scoring_metadata: [],
    transactions: [],
    statements: [],
    invalidate_cache_calls: 0,
    admin_log: [],
    for_update_locks: [],
    next_id: 9000,
    fail_next_execute_with: null,
  };
}

function buildVerifierBlock(sourceUrl: string): Record<string, unknown> {
  return {
    source_title: "Reference",
    source_url: sourceUrl,
    accessed_at: "2026-05-27",
    supporting_quote: "Quoted supporting evidence.",
    verification_note: "Verified directly from the source page.",
  };
}

function buildPositiveSignal(
  index: number,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const dimension = ["security", "governance", "reliability", "contract"][
    index % 4
  ];

  return {
    row: {
      signal_key: `signal-${index}`,
      dimension,
      amount: 1.0,
      text_en: `Positive signal ${index} (EN).`,
      text_de: `Positives Signal ${index} (DE).`,
      source_url: `https://example.com/signals/${index}`,
      ...((overrides.row as Record<string, unknown> | undefined) ?? {}),
    },
    verifier: buildVerifierBlock(
      `https://example.com/signals/${index}/verifier`,
    ),
  };
}

function buildReservation(
  index: number,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const severity = ["minor", "moderate", "major"][index % 3];

  return {
    row: {
      reservation_key: `reservation-${index}`,
      severity,
      event_date: "2026-04-01",
      penalty_tier: "security",
      penalty_amount: 0.5,
      is_structural: false,
      text_en: `Reservation ${index} (EN).`,
      text_de: `Vorbehalt ${index} (DE).`,
      source_url: `https://example.com/reservations/${index}`,
      ...((overrides.row as Record<string, unknown> | undefined) ?? {}),
    },
    verifier: buildVerifierBlock(
      `https://example.com/reservations/${index}/verifier`,
    ),
  };
}

function buildHandoff(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const positives = Array.from({ length: 4 }, (_, i) => buildPositiveSignal(i));
  const reservations = Array.from({ length: 4 }, (_, i) => buildReservation(i));

  const handoff: Record<string, unknown> = {
    schemaVersion: 1,
    entrySlug: "proton-mail",
    documentPath: "deep-research/proton-mail.md",
    accessedDate: "2026-05-27",
    dryRun: false,
    thresholdCheck: {
      totalAcceptedRows: positives.length + reservations.length,
      acceptedPositiveSignals: positives.length,
      acceptedReservations: reservations.length,
      passed: true,
      thresholds: {
        minTotalRows: 8,
        minPositiveSignals: 4,
        minReservations: 1,
      },
    },
    accepted: {
      positive_signals: positives,
      reservations,
      scoring_metadata: {
        base_class_override: "eu",
        is_ad_surveillance: false,
        deep_research_path: "deep-research/proton-mail.md",
        worksheet_path: "tmp/scoring-worksheets/proton-mail.md",
      },
    },
    rejected: [],
    ...overrides,
  };

  return handoff;
}

function buildHarnessCode(args: string[], scenario: Scenario): string {
  const argv = ["scripts/apply-deep-research-scoring.php", ...args];
  const script = readScript();
  const functions = extractAllFunctions(script);
  const constants = extractConstants(script);

  return `<?php
declare(strict_types=1);

$applyScoringState = json_decode(${JSON.stringify(
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
    global $applyScoringState;
    echo "\\n${stateMarker}" . json_encode($applyScoringState, JSON_THROW_ON_ERROR) . "\\n";
});

final class ApplyScoringTestPdo extends PDO
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
        return new ApplyScoringTestStatement($this->state, $query);
    }

    public function lastInsertId(?string $name = null): string|false
    {
        return (string) ($this->state['next_id'] - 1);
    }
}

final class ApplyScoringTestStatement extends PDOStatement
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
        $normalized = apply_scoring_test_normalize_sql($this->sql);
        $this->state['statements'][] = [
            'sql' => $normalized,
            'params' => $params,
        ];

        if ($this->state['fail_next_execute_with'] !== null) {
            $tag = $this->state['fail_next_execute_with'];
            if (str_contains($normalized, $tag)) {
                $this->state['fail_next_execute_with'] = null;
                throw new PDOException('forced test failure on ' . $tag);
            }
        }

        $this->rows = [];
        $this->cursor = 0;
        $this->affectedRows = 0;

        // SELECT ... FROM catalog_entries WHERE slug = :slug [FOR UPDATE]
        if (
            str_contains($normalized, 'from catalog_entries')
            && str_contains($normalized, 'where slug')
        ) {
            $slug = apply_scoring_test_param($params, 'slug')
                ?? apply_scoring_test_param($params, 'entry_slug');
            $forUpdate = str_contains($normalized, 'for update');
            foreach ($this->state['catalog_entries'] as $row) {
                if ($row['slug'] === $slug) {
                    $this->rows[] = $row;
                    if ($forUpdate) {
                        $this->state['for_update_locks'][] = (int) $row['id'];
                    }
                    break;
                }
            }
            return true;
        }

        if (
            str_contains($normalized, 'count(')
            && str_contains($normalized, 'from positive_signals')
        ) {
            $entryId = (int) (apply_scoring_test_param($params, 'entry_id') ?? 0);
            $count = 0;
            foreach ($this->state['positive_signals'] as $row) {
                if ((int) $row['entry_id'] === $entryId) {
                    $count++;
                }
            }
            $this->rows[] = ['c' => $count];
            return true;
        }

        if (
            str_contains($normalized, 'count(')
            && str_contains($normalized, 'from reservations')
        ) {
            $entryId = (int) (apply_scoring_test_param($params, 'entry_id') ?? 0);
            $count = 0;
            foreach ($this->state['reservations'] as $row) {
                if ((int) $row['entry_id'] === $entryId) {
                    $count++;
                }
            }
            $this->rows[] = ['c' => $count];
            return true;
        }

        if (
            str_contains($normalized, 'from scoring_metadata')
            && str_contains($normalized, 'where entry_id')
        ) {
            $entryId = (int) (apply_scoring_test_param($params, 'entry_id') ?? 0);
            foreach ($this->state['scoring_metadata'] as $row) {
                if ((int) $row['entry_id'] === $entryId) {
                    $this->rows[] = $row;
                    break;
                }
            }
            return true;
        }

        if (str_starts_with($normalized, 'delete from positive_signals')) {
            $entryId = (int) (apply_scoring_test_param($params, 'entry_id') ?? 0);
            $removed = 0;
            foreach ($this->state['positive_signals'] as $i => $row) {
                if ((int) $row['entry_id'] === $entryId) {
                    unset($this->state['positive_signals'][$i]);
                    $removed++;
                }
            }
            $this->state['positive_signals'] = array_values(
                $this->state['positive_signals'],
            );
            $this->affectedRows = $removed;
            return true;
        }

        if (str_starts_with($normalized, 'delete from reservations')) {
            $entryId = (int) (apply_scoring_test_param($params, 'entry_id') ?? 0);
            $removed = 0;
            foreach ($this->state['reservations'] as $i => $row) {
                if ((int) $row['entry_id'] === $entryId) {
                    unset($this->state['reservations'][$i]);
                    $removed++;
                }
            }
            $this->state['reservations'] = array_values(
                $this->state['reservations'],
            );
            $this->affectedRows = $removed;
            return true;
        }

        if (str_starts_with($normalized, 'delete from scoring_metadata')) {
            $entryId = (int) (apply_scoring_test_param($params, 'entry_id') ?? 0);
            $removed = 0;
            foreach ($this->state['scoring_metadata'] as $i => $row) {
                if ((int) $row['entry_id'] === $entryId) {
                    unset($this->state['scoring_metadata'][$i]);
                    $removed++;
                }
            }
            $this->state['scoring_metadata'] = array_values(
                $this->state['scoring_metadata'],
            );
            $this->affectedRows = $removed;
            return true;
        }

        if (str_starts_with($normalized, 'insert into positive_signals')) {
            $newId = $this->state['next_id']++;
            $this->state['positive_signals'][] = [
                'id' => $newId,
                'entry_id' => (int) apply_scoring_test_param($params, 'entry_id'),
                'signal_key' => (string) apply_scoring_test_param($params, 'signal_key'),
                'sort_order' => (int) apply_scoring_test_param($params, 'sort_order'),
                'dimension' => (string) apply_scoring_test_param($params, 'dimension'),
                'amount' => apply_scoring_test_param($params, 'amount'),
                'text_en' => (string) apply_scoring_test_param($params, 'text_en'),
                'text_de' => apply_scoring_test_param($params, 'text_de'),
                'source_url' => apply_scoring_test_param($params, 'source_url'),
            ];
            $this->affectedRows = 1;
            return true;
        }

        if (str_starts_with($normalized, 'insert into reservations')) {
            $newId = $this->state['next_id']++;
            $this->state['reservations'][] = [
                'id' => $newId,
                'entry_id' => (int) apply_scoring_test_param($params, 'entry_id'),
                'reservation_key' => (string) apply_scoring_test_param($params, 'reservation_key'),
                'sort_order' => (int) apply_scoring_test_param($params, 'sort_order'),
                'severity' => (string) apply_scoring_test_param($params, 'severity'),
                'event_date' => apply_scoring_test_param($params, 'event_date'),
                'penalty_tier' => apply_scoring_test_param($params, 'penalty_tier'),
                'penalty_amount' => apply_scoring_test_param($params, 'penalty_amount'),
                'is_structural' => (int) (apply_scoring_test_param($params, 'is_structural') ?? 0),
                'text_en' => (string) apply_scoring_test_param($params, 'text_en'),
                'text_de' => apply_scoring_test_param($params, 'text_de'),
                'source_url' => apply_scoring_test_param($params, 'source_url'),
            ];
            $this->affectedRows = 1;
            return true;
        }

        if (str_starts_with($normalized, 'insert into scoring_metadata')) {
            // Replace any existing row for this entry_id to model ON DUPLICATE
            // KEY UPDATE / INSERT-after-DELETE semantics. The script may either
            // INSERT after DELETE or use ON DUPLICATE; both should converge on
            // a single row per entry_id.
            $entryId = (int) apply_scoring_test_param($params, 'entry_id');
            foreach ($this->state['scoring_metadata'] as $i => $row) {
                if ((int) $row['entry_id'] === $entryId) {
                    unset($this->state['scoring_metadata'][$i]);
                }
            }
            $this->state['scoring_metadata'] = array_values(
                $this->state['scoring_metadata'],
            );
            $this->state['scoring_metadata'][] = [
                'entry_id' => $entryId,
                'base_class_override' => apply_scoring_test_param($params, 'base_class_override'),
                'is_ad_surveillance' => apply_scoring_test_param($params, 'is_ad_surveillance'),
                'deep_research_path' => apply_scoring_test_param($params, 'deep_research_path'),
                'worksheet_path' => apply_scoring_test_param($params, 'worksheet_path'),
            ];
            $this->affectedRows = 1;
            return true;
        }

        // Unknown SQL — record and treat as no-op rather than throw, so tests
        // can still introspect what the script tried to do.
        return true;
    }

    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        if (!isset($this->rows[$this->cursor])) {
            return false;
        }
        return $this->rows[$this->cursor++];
    }

    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        $rest = array_slice($this->rows, $this->cursor);
        $this->cursor = count($this->rows);
        return $rest;
    }

    public function fetchColumn(int $column = 0): mixed
    {
        $row = $this->fetch();
        if ($row === false) {
            return false;
        }
        if (is_array($row)) {
            $values = array_values($row);
            return $values[$column] ?? false;
        }
        return false;
    }

    public function rowCount(): int
    {
        return $this->affectedRows;
    }
}

function apply_scoring_test_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function apply_scoring_test_param(array $params, string $name): mixed
{
    foreach ([$name, ':' . $name] as $key) {
        if (array_key_exists($key, $params)) {
            return $params[$key];
        }
    }
    return null;
}

function getDatabaseConnection(): PDO
{
    global $applyScoringState;
    return new ApplyScoringTestPdo($applyScoringState);
}

function invalidateCache(): void
{
    global $applyScoringState;
    $applyScoringState['invalidate_cache_calls']++;
}

function logAdminMessage(string $message): void
{
    global $applyScoringState;
    $applyScoringState['admin_log'][] = $message;
}

${constants}

${functions}

try {
    runApplyDeepResearchScoring($argv);
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
): ApplyRunResult {
  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout.split(/\r?\n/).map((line) => line.trim());
  const stateLine = lines.find((line) => line.startsWith(stateMarker));

  if (stateLine === undefined) {
    throw new Error(`Test harness did not emit state: ${stdout}`);
  }

  const jsonCandidates = lines.filter(
    (line) =>
      !line.startsWith(stateMarker) &&
      line.length > 0 &&
      (line.startsWith("{") || line.startsWith("[")),
  );
  const outcomeLine = jsonCandidates[jsonCandidates.length - 1];

  let outcome: ApplyOutcome | undefined;
  if (outcomeLine !== undefined) {
    try {
      outcome = JSON.parse(outcomeLine) as ApplyOutcome;
    } catch {
      outcome = undefined;
    }
  }

  return {
    exitCode,
    stderr,
    stdout,
    outcome,
    state: JSON.parse(stateLine.slice(stateMarker.length)) as Scenario,
  };
}

async function runApply(
  handoff: Record<string, unknown>,
  scenario: Scenario = baseScenario(),
  extraArgs: string[] = [],
  worksheetPath: string = "tmp/scoring-worksheets/proton-mail.md",
): Promise<ApplyRunResult> {
  const args = [
    "--verified-action-json",
    JSON.stringify(handoff),
    "--worksheet-path",
    worksheetPath,
    ...extraArgs,
  ];

  const php = await getPhp();
  const response = await php.runStream({
    code: buildHarnessCode(args, scenario),
  });

  return parseRun(
    await response.stdoutText,
    await response.stderrText,
    await response.exitCode,
  );
}

async function runApplyWithRawArgs(
  args: string[],
  scenario: Scenario = baseScenario(),
): Promise<ApplyRunResult> {
  const php = await getPhp();
  const response = await php.runStream({
    code: buildHarnessCode(args, scenario),
  });

  return parseRun(
    await response.stdoutText,
    await response.stderrText,
    await response.exitCode,
  );
}

afterAll(async () => {
  if (phpPromise !== undefined) {
    const php = await phpPromise;
    php.exit();
  }
});

describe("apply-deep-research-scoring DB writer", () => {
  it("inserts positive_signals, reservations, and scoring_metadata in a single transaction", async () => {
    const result = await runApply(buildHandoff());

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);
    expect(result.state.for_update_locks).toContain(501);

    expect(
      result.state.positive_signals.filter((r) => r.entry_id === 501).length,
      "all 4 positive signals must be inserted",
    ).toBe(4);
    expect(
      result.state.reservations.filter((r) => r.entry_id === 501).length,
      "all 4 reservations must be inserted",
    ).toBe(4);
    expect(
      result.state.scoring_metadata.filter((r) => r.entry_id === 501).length,
      "exactly one scoring_metadata row must exist",
    ).toBe(1);

    const meta = result.state.scoring_metadata.find((r) => r.entry_id === 501);
    expect(meta?.deep_research_path).toBe("deep-research/proton-mail.md");
    expect(meta?.worksheet_path).toBe("tmp/scoring-worksheets/proton-mail.md");

    // sort_order must equal the array index for both tables (stable derivation).
    const insertedSignals = result.state.positive_signals
      .filter((r) => r.entry_id === 501)
      .sort((a, b) => a.sort_order - b.sort_order);
    expect(insertedSignals.map((r) => r.signal_key)).toEqual([
      "signal-0",
      "signal-1",
      "signal-2",
      "signal-3",
    ]);
    expect(insertedSignals.map((r) => r.sort_order)).toEqual([0, 1, 2, 3]);

    const insertedReservations = result.state.reservations
      .filter((r) => r.entry_id === 501)
      .sort((a, b) => a.sort_order - b.sort_order);
    expect(insertedReservations.map((r) => r.reservation_key)).toEqual([
      "reservation-0",
      "reservation-1",
      "reservation-2",
      "reservation-3",
    ]);
    expect(insertedReservations.map((r) => r.sort_order)).toEqual([0, 1, 2, 3]);

    expect(result.outcome?.ok).toBe(true);
    expect(result.outcome?.dryRun).toBe(false);
  });

  it("--dry-run plans without mutating the DB or invalidating cache", async () => {
    const result = await runApply(buildHandoff(), baseScenario(), [
      "--dry-run",
    ]);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.positive_signals.length).toBe(0);
    expect(result.state.reservations.length).toBe(0);
    expect(result.state.scoring_metadata.length).toBe(0);

    // No INSERT/DELETE statements should have been issued.
    const mutating = result.state.statements.filter(
      (s) =>
        s.sql.startsWith("insert into ") || s.sql.startsWith("delete from "),
    );
    expect(mutating, "dry-run must issue no INSERT/DELETE").toEqual([]);

    expect(result.outcome?.ok).toBe(true);
    expect(result.outcome?.dryRun).toBe(true);
    expect(
      Array.isArray(result.outcome?.plan) ||
        Array.isArray(result.outcome?.changesApplied),
      "dry-run must expose a plan in the outcome JSON",
    ).toBe(true);
  });

  it("rejects fail-closed when a positive_signal is missing source_url (no transaction opened)", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Array<Record<string, unknown>>;
    (signals[0].row as Record<string, unknown>).source_url = null;

    const result = await runApply(handoff);

    expect(
      result.exitCode,
      "must fail-closed before opening a transaction",
    ).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.positive_signals.length).toBe(0);
    expect(result.state.reservations.length).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/source_url|url/);
  });

  it("rejects fail-closed when a banned trust-score key appears anywhere in the handoff", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const meta = accepted.scoring_metadata as Record<string, unknown>;
    meta.trustScore = 8.5;

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(
      /banned|trust_score|trustscore|forbidden/,
    );
  });

  it("rejects fail-closed when the surviving rows are below the threshold (< 4 positives)", async () => {
    const handoff = buildHandoff({
      accepted: {
        positive_signals: [
          buildPositiveSignal(0),
          buildPositiveSignal(1),
          buildPositiveSignal(2),
        ],
        reservations: [
          buildReservation(0),
          buildReservation(1),
          buildReservation(2),
          buildReservation(3),
          buildReservation(4),
        ],
        scoring_metadata: {
          base_class_override: null,
          is_ad_surveillance: null,
          deep_research_path: "deep-research/proton-mail.md",
          worksheet_path: "tmp/scoring-worksheets/proton-mail.md",
        },
      },
    });

    const result = await runApply(handoff);

    expect(result.exitCode, "below-threshold handoff must fail closed").toBe(
      65,
    );
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.positive_signals.length).toBe(0);
    expect(result.state.reservations.length).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(
      /threshold|positive_signals|minimum/,
    );
  });

  it("rolls back the transaction and skips cache invalidation when a DB INSERT fails", async () => {
    const scenario = baseScenario();
    scenario.fail_next_execute_with = "insert into reservations";

    const result = await runApply(buildHandoff(), scenario);

    expect(
      result.exitCode,
      "DB failure must propagate as non-zero exit",
    ).not.toBe(0);
    expect(result.state.transactions).toContain("begin");
    expect(result.state.transactions).toContain("rollback");
    expect(result.state.transactions).not.toContain("commit");
    expect(result.state.invalidate_cache_calls).toBe(0);

    // Partial inserts must not survive — even though the fake PDO mutated state
    // before the throw, the runner's contract is to report rolledBack=true; we
    // verify the user-visible outcome rather than try to undo state in the fake.
    expect(result.outcome?.ok).toBe(false);
    expect(result.outcome?.rolledBack).toBe(true);
    expect(result.outcome?.error).toBeTruthy();
  });

  it("refuses to overwrite a pre-existing scored entry without --replace-existing", async () => {
    const scenario = baseScenario();
    scenario.positive_signals.push({
      id: 1,
      entry_id: 501,
      signal_key: "legacy-signal",
      sort_order: 0,
      dimension: "security",
      amount: 1.0,
      text_en: "Legacy signal",
      text_de: null,
      source_url: "https://example.com/legacy",
    });
    scenario.scoring_metadata.push({
      entry_id: 501,
      base_class_override: null,
      is_ad_surveillance: null,
      deep_research_path: "deep-research/legacy.md",
      worksheet_path: "tmp/scoring-worksheets/legacy.md",
    });

    const result = await runApply(buildHandoff(), scenario);

    expect(
      result.exitCode,
      "pre-existing scored entry must not be overwritten silently",
    ).not.toBe(0);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.transactions).not.toContain("commit");

    // The legacy row must remain; no new inserts for this entry.
    const finalSignals = result.state.positive_signals.filter(
      (r) => r.entry_id === 501,
    );
    expect(
      finalSignals.length,
      "no new positive_signals must be inserted",
    ).toBe(1);
    expect(finalSignals[0].signal_key).toBe("legacy-signal");

    expect(
      result.stderr.toLowerCase() +
        JSON.stringify(result.outcome ?? {}).toLowerCase(),
    ).toMatch(/replace|exist|already.*scored|scored.*already/);
  });

  it("replaces pre-existing rows with --replace-existing inside one transaction", async () => {
    const scenario = baseScenario();
    scenario.positive_signals.push({
      id: 1,
      entry_id: 501,
      signal_key: "legacy-signal",
      sort_order: 0,
      dimension: "security",
      amount: 1.0,
      text_en: "Legacy signal",
      text_de: null,
      source_url: "https://example.com/legacy",
    });
    scenario.reservations.push({
      id: 1,
      entry_id: 501,
      reservation_key: "legacy-reservation",
      sort_order: 0,
      severity: "minor",
      event_date: null,
      penalty_tier: null,
      penalty_amount: null,
      is_structural: 0,
      text_en: "Legacy reservation",
      text_de: null,
      source_url: "https://example.com/legacy-res",
    });
    scenario.scoring_metadata.push({
      entry_id: 501,
      base_class_override: null,
      is_ad_surveillance: null,
      deep_research_path: "deep-research/legacy.md",
      worksheet_path: "tmp/scoring-worksheets/legacy.md",
    });

    const result = await runApply(buildHandoff(), scenario, [
      "--replace-existing",
    ]);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    // Legacy rows must be gone; new fresh set must be present.
    const remainingLegacy = result.state.positive_signals.find(
      (r) => r.signal_key === "legacy-signal",
    );
    expect(remainingLegacy, "legacy signal must be deleted").toBeUndefined();

    expect(
      result.state.positive_signals.filter((r) => r.entry_id === 501).length,
    ).toBe(4);
    expect(
      result.state.reservations.filter((r) => r.entry_id === 501).length,
    ).toBe(4);
    expect(
      result.state.scoring_metadata.filter((r) => r.entry_id === 501).length,
    ).toBe(1);

    const newMeta = result.state.scoring_metadata.find(
      (r) => r.entry_id === 501,
    );
    expect(newMeta?.worksheet_path).toBe(
      "tmp/scoring-worksheets/proton-mail.md",
    );

    // DELETEs for the three scoring tables must have run before any new INSERTs
    // (uq_sig_order / uq_res_order would otherwise collide).
    const sqls = result.state.statements.map((s) => s.sql);
    const firstInsertSignals = sqls.findIndex((s) =>
      s.startsWith("insert into positive_signals"),
    );
    const lastDeleteSignals = sqls
      .map((s, i) => (s.startsWith("delete from positive_signals") ? i : -1))
      .filter((i) => i >= 0)
      .pop();
    expect(
      lastDeleteSignals,
      "DELETE FROM positive_signals must run with --replace-existing",
    ).toBeGreaterThanOrEqual(0);
    expect(
      lastDeleteSignals!,
      "DELETE must come before the first INSERT to satisfy unique constraints",
    ).toBeLessThan(firstInsertSignals);
  });

  it("rolls back when the target entry slug does not exist in catalog_entries", async () => {
    const handoff = buildHandoff({ entrySlug: "does-not-exist" });
    const result = await runApply(handoff);

    expect(result.exitCode, "unknown slug must not succeed").not.toBe(0);
    expect(result.state.transactions).not.toContain("commit");
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.positive_signals.length).toBe(0);
    expect(result.state.reservations.length).toBe(0);
    expect(result.state.scoring_metadata.length).toBe(0);
  });

  it("still writes a scoring_metadata row (with NULL ENUMs) when accepted.scoring_metadata is absent", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    delete accepted.scoring_metadata;

    const result = await runApply(handoff);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    // A scoring_metadata row must exist so computeEntryTrustScore() flips
    // the entry to "ready". When the verifier rejected the proposed metadata,
    // base_class_override and is_ad_surveillance must be NULL.
    const meta = result.state.scoring_metadata.find((r) => r.entry_id === 501);
    expect(
      meta,
      "metadata row must be inserted even when verifier rejected the proposed metadata",
    ).toBeDefined();
    expect(meta?.base_class_override).toBeNull();
    expect(meta?.is_ad_surveillance).toBeNull();
    expect(meta?.worksheet_path).toBe("tmp/scoring-worksheets/proton-mail.md");
  });

  it("exits 64 on an unknown CLI option", async () => {
    const result = await runApplyWithRawArgs([
      "--verified-action-json",
      JSON.stringify(buildHandoff()),
      "--worksheet-path",
      "tmp/scoring-worksheets/proton-mail.md",
      "--no-such-flag",
    ]);

    expect(result.exitCode, "unknown CLI option must yield exit 64").toBe(64);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/unknown|invalid/);
  });

  it("rejects when --worksheet-path is missing", async () => {
    const result = await runApplyWithRawArgs([
      "--verified-action-json",
      JSON.stringify(buildHandoff()),
    ]);

    expect(
      result.exitCode,
      "missing --worksheet-path must not succeed",
    ).not.toBe(0);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/worksheet/);
  });

  it("rejects fail-closed when both --verified-action-json and --verified-action-file are supplied", async () => {
    const result = await runApplyWithRawArgs([
      "--verified-action-json",
      JSON.stringify(buildHandoff()),
      "--verified-action-file",
      "/nonexistent/handoff.json",
      "--worksheet-path",
      "tmp/scoring-worksheets/proton-mail.md",
    ]);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
  });

  it("rejects fail-closed when neither --verified-action-json nor --verified-action-file is supplied", async () => {
    const result = await runApplyWithRawArgs([
      "--worksheet-path",
      "tmp/scoring-worksheets/proton-mail.md",
    ]);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
  });

  it("rejects fail-closed when the handoff JSON is malformed", async () => {
    const result = await runApplyWithRawArgs([
      "--verified-action-json",
      "{not-json",
      "--worksheet-path",
      "tmp/scoring-worksheets/proton-mail.md",
    ]);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.stderr.toLowerCase()).toMatch(/json/);
  });

  it("rejects fail-closed when schemaVersion is not 1", async () => {
    const result = await runApply(buildHandoff({ schemaVersion: 2 }));

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/schema/);
  });

  it("rejects fail-closed when entrySlug contains path traversal characters", async () => {
    const result = await runApply(buildHandoff({ entrySlug: "../etc/passwd" }));

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/slug|traversal/);
  });

  it("rejects fail-closed when a source_url points at localhost", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Array<Record<string, unknown>>;
    (signals[0].row as Record<string, unknown>).source_url =
      "http://localhost/secret";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/url|public/);
  });

  it("rejects fail-closed when a source_url points at a private IPv4 host", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const reservations = accepted.reservations as Array<
      Record<string, unknown>
    >;
    (reservations[0].row as Record<string, unknown>).source_url =
      "https://10.0.0.5/internal";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/url|public/);
  });

  it("rejects fail-closed when a banned trust-score key is nested inside a positive_signal row", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Array<Record<string, unknown>>;
    (signals[0].row as Record<string, unknown>).trust_score = 9.0;

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(
      /banned|trust_score|trustscore|forbidden/,
    );
  });

  it("rejects fail-closed when two positive_signals share the same signal_key", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Array<Record<string, unknown>>;
    const firstKey = (signals[0].row as Record<string, unknown>).signal_key;
    (signals[1].row as Record<string, unknown>).signal_key = firstKey;

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/duplicate|signal_key/);
  });

  it("rejects fail-closed when a positive_signal has an unknown dimension", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Array<Record<string, unknown>>;
    (signals[0].row as Record<string, unknown>).dimension =
      "not-a-real-dimension";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/dimension/);
  });

  it("rejects fail-closed when a reservation omits the required is_structural flag", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const reservations = accepted.reservations as Array<
      Record<string, unknown>
    >;
    const row = reservations[0].row as Record<string, unknown>;
    delete row.is_structural;

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/is_structural/);
  });

  it("rejects fail-closed when reservation event_date is not YYYY-MM-DD", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const reservations = accepted.reservations as Array<
      Record<string, unknown>
    >;
    (reservations[0].row as Record<string, unknown>).event_date =
      "April 1, 2026";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/event_date/);
  });

  it("rejects fail-closed when there are zero reservations (min-reservations threshold)", async () => {
    const handoff = buildHandoff({
      accepted: {
        positive_signals: Array.from({ length: 8 }, (_, i) =>
          buildPositiveSignal(i),
        ),
        reservations: [],
        scoring_metadata: {
          base_class_override: "eu",
          is_ad_surveillance: false,
          deep_research_path: "deep-research/proton-mail.md",
          worksheet_path: "tmp/scoring-worksheets/proton-mail.md",
        },
      },
    });

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(
      /reservation|threshold|minimum/,
    );
  });

  it("treats handoff.dryRun=true as a dry-run even without the --dry-run flag", async () => {
    const handoff = buildHandoff({ dryRun: true });
    const result = await runApply(handoff);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.positive_signals.length).toBe(0);
    expect(result.state.reservations.length).toBe(0);
    expect(result.state.scoring_metadata.length).toBe(0);
    expect(result.outcome?.dryRun).toBe(true);
  });

  it("emits an admin audit line after a successful insert", async () => {
    const result = await runApply(buildHandoff());

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.admin_log.length).toBe(1);
    const line = result.state.admin_log[0];
    expect(line).toContain("euroalt-admin:");
    expect(line).toContain("proton-mail");
    expect(line.toLowerCase()).toMatch(/insert|applied/);
    expect(line).toContain("positive_signals=4");
    expect(line).toContain("reservations=4");
  });

  it("loads the handoff via --verified-action-file when the JSON flag is not supplied", async () => {
    const dir = mkdtempSync(join(tmpdir(), "apply-deep-research-scoring-"));
    const file = join(dir, "handoff.json");
    writeFileSync(file, JSON.stringify(buildHandoff()));

    const result = await runApplyWithRawArgs([
      "--verified-action-file",
      file,
      "--worksheet-path",
      "tmp/scoring-worksheets/proton-mail.md",
    ]);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);
    expect(
      result.state.positive_signals.filter((r) => r.entry_id === 501).length,
    ).toBe(4);
    expect(
      result.state.reservations.filter((r) => r.entry_id === 501).length,
    ).toBe(4);
  });

  it("rejects fail-closed when --verified-action-file points at a missing file", async () => {
    const result = await runApplyWithRawArgs([
      "--verified-action-file",
      "/nonexistent/path/to/handoff.json",
      "--worksheet-path",
      "tmp/scoring-worksheets/proton-mail.md",
    ]);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/read|file/);
  });

  it("rejects fail-closed when accepted.scoring_metadata.base_class_override is not in the allowed enum", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const meta = accepted.scoring_metadata as Record<string, unknown>;
    meta.base_class_override = "not-a-real-base-class";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/base_class_override|base class/);
  });

  it("rejects fail-closed when accepted.scoring_metadata.is_ad_surveillance is not a boolean", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const meta = accepted.scoring_metadata as Record<string, unknown>;
    meta.is_ad_surveillance = "yes";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/is_ad_surveillance|boolean/);
  });

  it("rejects fail-closed when two reservations share the same reservation_key", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const reservations = accepted.reservations as Array<
      Record<string, unknown>
    >;
    const firstKey = (reservations[0].row as Record<string, unknown>)
      .reservation_key;
    (reservations[1].row as Record<string, unknown>).reservation_key = firstKey;

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/duplicate|reservation_key/);
  });

  it("rejects fail-closed when a reservation severity is not in {minor,moderate,major}", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const reservations = accepted.reservations as Array<
      Record<string, unknown>
    >;
    (reservations[0].row as Record<string, unknown>).severity = "catastrophic";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/severity/);
  });

  it("rejects fail-closed when a reservation penalty_tier is not one of the dimension ENUMs", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const reservations = accepted.reservations as Array<
      Record<string, unknown>
    >;
    (reservations[0].row as Record<string, unknown>).penalty_tier =
      "unknown-tier";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/penalty_tier/);
  });

  it("rejects fail-closed when a positive_signal amount is not numeric", async () => {
    const handoff = buildHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Array<Record<string, unknown>>;
    (signals[0].row as Record<string, unknown>).amount = "not-a-number";

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/amount/);
  });

  it("rejects fail-closed when sub-thresholds pass but total surviving rows is below 8", async () => {
    const handoff = buildHandoff({
      accepted: {
        positive_signals: Array.from({ length: 4 }, (_, i) =>
          buildPositiveSignal(i),
        ),
        reservations: Array.from({ length: 3 }, (_, i) => buildReservation(i)),
        scoring_metadata: {
          base_class_override: null,
          is_ad_surveillance: null,
          deep_research_path: "deep-research/proton-mail.md",
          worksheet_path: "tmp/scoring-worksheets/proton-mail.md",
        },
      },
    });

    const result = await runApply(handoff);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/total|threshold|minimum/);
  });
});
