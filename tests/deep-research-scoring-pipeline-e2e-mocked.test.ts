import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import {
  main as applyWrapperMain,
  WRAPPER_POST_CHECK_FAILED,
} from "../scripts/apply-deep-research-scoring-run.mjs";

// ---------------------------------------------------------------------------
// Cross-stage fail-closed safety contract for the deep-research scoring
// pipeline (#487).
//
// The pipeline composes five stages:
//   1. discover & match     (vet-deep-research-codex.sh)
//   2. codex extraction     (vet-deep-research-extract-codex.sh)
//   3. codex verification   (vet-deep-research-verify-codex.sh)
//   4. worksheet generation (vet-deep-research-worksheet.sh)
//   5. transactional DB write + API post-check
//                           (apply-deep-research-scoring-run.mjs)
//
// Each per-stage rule is already pinned by the per-stage test files. The
// scenarios here pin the COMPOSITION: every documented failure mode rejects
// the affected entry before any DB write; the happy path is observable as
// trustScoreStatus="ready" via the post-check; and no stored trust-score
// value ever leaks into any artifact for any path.
//
// To exercise the real validation logic where it matters, stages 2, 3, and
// 4 are driven through the orchestrator's env-override seam via small bash
// wrappers that exec the real per-stage entrypoint with --mock-response-file
// appended. Stages 1 and 5 use cheap recording shims because their per-stage
// behaviour is already covered exhaustively elsewhere; here we just need the
// orchestrator's classification of each shim outcome.
//
// AC0/AC13/AC14 (the DB writer + post-check paths) drive the apply wrapper's
// main() directly with the @php-wasm/node PDO stub as phpRunner and an
// injected fetchImpl. That avoids subprocess overhead and keeps the
// rollback / commit / cache-invalidation assertions deterministic.
// ---------------------------------------------------------------------------

const projectDir = resolve(".");
const orchestratorPath = resolve("scripts/score-deep-research-folder.sh");
const realExtract = resolve("scripts/vet-deep-research-extract-codex.sh");
const realVerify = resolve("scripts/vet-deep-research-verify-codex.sh");
const realWorksheet = resolve("scripts/vet-deep-research-worksheet.sh");
const applyScriptUrl = new URL(
  "../scripts/apply-deep-research-scoring.php",
  import.meta.url,
);

const ACCESSED_DATE = "2026-05-27";

// Keys that must never appear as JSON keys in any artifact. The post-check
// outcome legitimately echoes `trustScoreStatus: "ready"` as an *observed*
// API state — that single field is whitelisted in `apply-outcome.json` only
// (see scrubArtifactBanned() below).
const BANNED_LEAK_KEYS = [
  "trustScore",
  "trust_score",
  "trustScoreStatus",
  "trust_score_status",
] as const;

const VET_EXTRACT_BEGIN = "BEGIN_VET_EXTRACT_JSON";
const VET_EXTRACT_END = "END_VET_EXTRACT_JSON";
const VET_VERIFY_BEGIN = "BEGIN_VET_VERIFY_JSON";
const VET_VERIFY_END = "END_VET_VERIFY_JSON";

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(join(tempRoot, prefix));
}

function writeText(path: string, text: string): void {
  writeFileSync(path, text, "utf8");
}

function writeJson(path: string, value: unknown): void {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeExecutable(path: string, script: string): void {
  writeText(path, script);
  chmodSync(path, 0o755);
}

// ---------------------------------------------------------------------------
// Banned-key scanner (recursive walk of every JSON value)
// ---------------------------------------------------------------------------

function findBannedKey(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findBannedKey(item);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if ((BANNED_LEAK_KEYS as readonly string[]).includes(key)) {
        return key;
      }
    }
    for (const child of Object.values(record)) {
      const found = findBannedKey(child);
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

function walkJsonFiles(root: string): string[] {
  const out: string[] = [];
  if (!existsSync(root)) {
    return out;
  }
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (dir === undefined) {
      continue;
    }
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of entries) {
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push(full);
      } else if (st.isFile() && name.endsWith(".json")) {
        out.push(full);
      }
    }
  }
  return out;
}

function scrubArtifactBanned(filePath: string, parsed: unknown): string | null {
  // The wrapper's post-check echo legitimately contains a top-level
  // `trustScoreStatus: "ready"` observed-state field. That single occurrence
  // is whitelisted by location: only when the file basename is
  // `apply-outcome.json` and the key is exactly the top-level
  // `trustScoreStatus`. Every other appearance is a leak.
  if (parsed === null || typeof parsed !== "object") {
    return null;
  }
  const isApplyOutcome = filePath.endsWith("apply-outcome.json");
  const record = parsed as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if ((BANNED_LEAK_KEYS as readonly string[]).includes(key)) {
      if (isApplyOutcome && key === "trustScoreStatus") {
        continue; // whitelist
      }
      return key;
    }
  }
  for (const child of Object.values(record)) {
    const found = findBannedKey(child);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

function assertNoBannedKeysUnder(root: string): void {
  for (const file of walkJsonFiles(root)) {
    const text = readFileSync(file, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue;
    }
    const leak = scrubArtifactBanned(file, parsed);
    expect(leak, `banned key ${String(leak)} in ${file}`).toBeNull();
  }
}

// ---------------------------------------------------------------------------
// Stage shims (record argv + emit canned JSON payload).
// Used for stages whose per-stage behaviour is not the test focus.
// ---------------------------------------------------------------------------

type ShimResult = { shimPath: string; recordPath: string };

function buildStageShim(
  tempDir: string,
  stage: string,
  options: {
    exitCode?: number;
    stdoutPayload?: unknown;
    writeToOutputFile?: boolean;
  } = {},
): ShimResult {
  const exitCode = options.exitCode ?? 0;
  const payload = options.stdoutPayload ?? { ok: true, stage };
  const shimPath = join(tempDir, `shim-${stage}.sh`);
  const recordPath = join(tempDir, `shim-${stage}.log`);
  const payloadPath = join(tempDir, `shim-${stage}.payload.json`);

  writeText(recordPath, "");
  writeText(payloadPath, JSON.stringify(payload));

  const writeOutput = options.writeToOutputFile === true;

  writeExecutable(
    shimPath,
    `#!/usr/bin/env bash
set -u
RECORD=${JSON.stringify(recordPath)}
PAYLOAD=${JSON.stringify(payloadPath)}
{
  printf 'CALL\\n'
  for arg in "$@"; do
    printf '%s\\n' "$arg"
  done
  printf 'EXIT=${String(exitCode)}\\n'
} >> "$RECORD"

${
  writeOutput
    ? `PREV=""
for arg in "$@"; do
  if [[ "$PREV" == "--output-file" ]]; then
    cp "$PAYLOAD" "$arg"
  fi
  PREV="$arg"
done
`
    : ""
}cat "$PAYLOAD"
echo
exit ${String(exitCode)}
`,
  );
  return { shimPath, recordPath };
}

type StageCall = { argv: string[]; exit: number | null };

function readStageCalls(recordPath: string): StageCall[] {
  if (!existsSync(recordPath)) {
    return [];
  }
  const lines = readFileSync(recordPath, "utf8").split("\n");
  const calls: StageCall[] = [];
  let current: StageCall | null = null;
  for (const line of lines) {
    if (line === "CALL") {
      if (current !== null) {
        calls.push(current);
      }
      current = { argv: [], exit: null };
      continue;
    }
    if (current === null) {
      continue;
    }
    if (line.startsWith("EXIT=")) {
      const n = Number.parseInt(line.slice("EXIT=".length), 10);
      current.exit = Number.isNaN(n) ? null : n;
      continue;
    }
    if (line !== "") {
      current.argv.push(line);
    }
  }
  if (current !== null) {
    calls.push(current);
  }
  return calls;
}

// ---------------------------------------------------------------------------
// Real-stage wrapper: exec the real per-stage entrypoint with extra args
// appended (typically --mock-response-file <path>). Lets us drive the real
// validator with a controlled mock response.
// ---------------------------------------------------------------------------

function buildRealWrapper(
  tempDir: string,
  stage: string,
  realScript: string,
  extraArgs: string[],
): string {
  const wrapperPath = join(tempDir, `wrap-${stage}.sh`);
  const extras = extraArgs.map((a) => JSON.stringify(a)).join(" ");
  writeExecutable(
    wrapperPath,
    `#!/usr/bin/env bash
exec bash ${JSON.stringify(realScript)} "$@" ${extras}
`,
  );
  return wrapperPath;
}

// ---------------------------------------------------------------------------
// Fixture builders for stage 2/3 mock responses.
// ---------------------------------------------------------------------------

type SignalSpec = {
  signal_key: string;
  dimension: "security" | "governance" | "reliability" | "contract";
  amount: number;
  text_en: string;
  source_url: string;
};

type ReservationSpec = {
  reservation_key: string;
  severity: "minor" | "moderate" | "major";
  is_structural: boolean;
  text_en: string;
  source_url: string;
};

function defaultSignals(): SignalSpec[] {
  return [
    {
      signal_key: "sig-eu-jurisdiction",
      dimension: "governance",
      amount: 1.0,
      text_en: "EU jurisdiction confirmed.",
      source_url: "https://example.eu/about-jurisdiction",
    },
    {
      signal_key: "sig-e2ee",
      dimension: "security",
      amount: 1.0,
      text_en: "End-to-end encryption documented.",
      source_url: "https://example.eu/security-e2ee",
    },
    {
      signal_key: "sig-open-source",
      dimension: "governance",
      amount: 1.0,
      text_en: "Source code is published openly.",
      source_url: "https://example.eu/source",
    },
    {
      signal_key: "sig-uptime",
      dimension: "reliability",
      amount: 1.0,
      text_en: "Uptime exceeds 99.9% historically.",
      source_url: "https://example.eu/uptime",
    },
  ];
}

function defaultReservations(): ReservationSpec[] {
  return [
    {
      reservation_key: "res-no-soc2",
      severity: "minor",
      is_structural: false,
      text_en: "No SOC 2 attestation published.",
      source_url: "https://example.eu/compliance",
    },
    {
      reservation_key: "res-self-host",
      severity: "minor",
      is_structural: false,
      text_en: "Self-hosting requires non-trivial expertise.",
      source_url: "https://example.eu/self-host",
    },
    {
      reservation_key: "res-incident",
      severity: "moderate",
      is_structural: false,
      text_en: "One historical outage in 2024.",
      source_url: "https://example.eu/incidents",
    },
    {
      reservation_key: "res-mobile",
      severity: "minor",
      is_structural: true,
      text_en: "Mobile parity lags desktop.",
      source_url: "https://example.eu/mobile",
    },
  ];
}

function allUrls(
  signals: SignalSpec[],
  reservations: ReservationSpec[],
): string[] {
  return [
    ...signals.map((s) => s.source_url),
    ...reservations.map((r) => r.source_url),
  ];
}

function buildDeepResearchDocument(slug: string, urls: string[]): string {
  // The document must contain every cited source_url verbatim — the stage-2
  // validator requires substring presence as a provenance check.
  const urlList = urls.map((u) => `- ${u}`).join("\n");
  return `---
entry_slug: ${slug}
---
# Deep research for ${slug}

This synthetic document is used by the mocked E2E pipeline tests.

## Cited sources

${urlList}
`;
}

function buildExtractMockResponse(
  signals: SignalSpec[],
  reservations: ReservationSpec[],
  options: {
    metadataOverride?: Record<string, unknown>;
    rawTextOverride?: string;
  } = {},
): string {
  if (typeof options.rawTextOverride === "string") {
    return options.rawTextOverride;
  }
  const payload = {
    positive_signals: signals.map((s) => ({ ...s, text_de: null })),
    reservations: reservations.map((r) => ({
      ...r,
      event_date: null,
      penalty_tier: null,
      penalty_amount: null,
      text_de: null,
    })),
    scoring_metadata: options.metadataOverride ?? {
      base_class_override: null,
      is_ad_surveillance: null,
      deep_research_path: null,
      worksheet_path: null,
    },
  };
  return `${VET_EXTRACT_BEGIN}\n${JSON.stringify(payload, null, 2)}\n${VET_EXTRACT_END}\n`;
}

type VerifyRecordOverride = {
  verdict?:
    | "supports"
    | "contradicts"
    | "inconclusive"
    | "source-inaccessible"
    | "unsafe-url"
    | "missing-quote";
  supporting_quote?: string;
};

function buildVerifyMockResponse(
  entrySlug: string,
  signals: SignalSpec[],
  reservations: ReservationSpec[],
  options: {
    signalOverrides?: Record<string, VerifyRecordOverride>;
    reservationOverrides?: Record<string, VerifyRecordOverride>;
    metadataVerdict?: "supports" | "contradicts" | "inconclusive";
  } = {},
): string {
  const buildRecord = (
    key: string,
    keyField: "signal_key" | "reservation_key",
    sourceUrl: string,
    override: VerifyRecordOverride | undefined,
  ): Record<string, unknown> => {
    const verdict = override?.verdict ?? "supports";
    const quote =
      override?.supporting_quote !== undefined
        ? override.supporting_quote
        : verdict === "supports"
          ? `Quoted evidence for ${key}.`
          : "";
    return {
      [keyField]: key,
      verdict,
      source_title: "Source",
      source_url: sourceUrl,
      accessed_at: ACCESSED_DATE,
      supporting_quote: quote,
      verification_note: `Verified ${key} (${verdict}).`,
    };
  };

  const payload = {
    entrySlug,
    accessedDate: ACCESSED_DATE,
    positive_signals: signals.map((s) =>
      buildRecord(
        s.signal_key,
        "signal_key",
        s.source_url,
        options.signalOverrides?.[s.signal_key],
      ),
    ),
    reservations: reservations.map((r) =>
      buildRecord(
        r.reservation_key,
        "reservation_key",
        r.source_url,
        options.reservationOverrides?.[r.reservation_key],
      ),
    ),
    scoring_metadata: {
      verdict: options.metadataVerdict ?? "supports",
      verification_note: "Metadata reviewed.",
    },
  };

  return `${VET_VERIFY_BEGIN}\n${JSON.stringify(payload, null, 2)}\n${VET_VERIFY_END}\n`;
}

// ---------------------------------------------------------------------------
// Orchestrator harness
// ---------------------------------------------------------------------------

type StageEnvName =
  | "EUROALT_VET_DEEP_RESEARCH_CMD"
  | "EUROALT_VET_DEEP_RESEARCH_EXTRACT_CMD"
  | "EUROALT_VET_DEEP_RESEARCH_VERIFY_CMD"
  | "EUROALT_VET_DEEP_RESEARCH_WORKSHEET_CMD"
  | "EUROALT_APPLY_DEEP_RESEARCH_SCORING_CMD";

function defaultMatchPayload(
  inputDir: string,
  slugs: readonly string[],
): Record<string, unknown> {
  return {
    inputDir,
    dryRun: false,
    matches: slugs.map((slug, index) => ({
      documentPath: join(inputDir, `${slug}.md`),
      entrySlug: slug,
      entryName: slug,
      entryId: 1000 + index,
      matchedVia: ["filename"],
    })),
    skipped: [],
    summary: { discovered: slugs.length, matched: slugs.length, skipped: 0 },
  };
}

function defaultApplyOutcome(slug: string): Record<string, unknown> {
  return {
    ok: true,
    entrySlug: slug,
    dryRun: false,
    replacedExisting: false,
    postCheckPassed: true,
    trustScoreStatus: "ready",
  };
}

function runOrchestrator(
  args: string[],
  envOverrides: Record<string, string>,
) {
  return spawnSync("bash", [orchestratorPath, ...args], {
    cwd: projectDir,
    encoding: "utf8",
    env: { ...process.env, ...envOverrides } as Record<string, string>,
  });
}

function readSummary(outputDir: string): Record<string, unknown> {
  const direct = join(outputDir, "summary.json");
  if (existsSync(direct)) {
    return JSON.parse(readFileSync(direct, "utf8")) as Record<string, unknown>;
  }
  throw new Error(`summary.json not found under ${outputDir}`);
}

// ---------------------------------------------------------------------------
// PHP-wasm harness for AC0 / AC13 / AC14 wrapper-level tests.
// Ported from tests/apply-deep-research-scoring.test.ts (single shared PHP
// runtime, in-memory PDO stub with fail_next_execute_with support).
// ---------------------------------------------------------------------------

const stateMarker = "__APPLY_DEEP_RESEARCH_SCORING_STATE__";

let phpPromise: Promise<PHP> | undefined;

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime("8.3").then((runtime) => {
    const php = new PHP(runtime);
    useHostFilesystem(php);
    return php;
  });
  return phpPromise;
}

type PdoScenario = {
  catalog_entries: { id: number; slug: string; name: string }[];
  positive_signals: Record<string, unknown>[];
  reservations: Record<string, unknown>[];
  scoring_metadata: Record<string, unknown>[];
  transactions: string[];
  statements: { sql: string; params: Record<string, unknown> }[];
  invalidate_cache_calls: number;
  admin_log: string[];
  for_update_locks: number[];
  next_id: number;
  fail_next_execute_with: string | null;
};

function baseScenario(slug: string): PdoScenario {
  return {
    catalog_entries: [{ id: 701, slug, name: slug }],
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

function readScript(): string {
  return readFileSync(applyScriptUrl, "utf8");
}

function getFunctionSource(source: string, functionName: string): string {
  const start = source.search(new RegExp(`function\\s+${functionName}\\s*\\(`));
  if (start < 0) {
    throw new Error(`Expected ${functionName}() in apply-deep-research-scoring.php`);
  }
  let depth = 0;
  let bodyStarted = false;
  let inSingleQuotedString = false;
  let inDoubleQuotedString = false;
  for (let idx = start; idx < source.length; idx++) {
    const ch = source[idx];
    if (inSingleQuotedString) {
      if (ch === "\\") {
        idx++;
      } else if (ch === "'") {
        inSingleQuotedString = false;
      }
      continue;
    }
    if (inDoubleQuotedString) {
      if (ch === "\\") {
        idx++;
      } else if (ch === '"') {
        inDoubleQuotedString = false;
      }
      continue;
    }
    if (ch === "'") {
      inSingleQuotedString = true;
      continue;
    }
    if (ch === '"') {
      inDoubleQuotedString = true;
      continue;
    }
    if (ch === "{") {
      depth++;
      bodyStarted = true;
    } else if (ch === "}") {
      depth--;
      if (bodyStarted && depth === 0) {
        return source.slice(start, idx + 1);
      }
    }
  }
  throw new Error(`Unterminated function body for ${functionName}`);
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

function buildHarnessCode(args: string[], scenario: PdoScenario): string {
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

type PhpRunOutput = {
  exitCode: number;
  stdout: string;
  stderr: string;
  state: PdoScenario;
};

function parsePhpOutput(
  stdout: string,
  stderr: string,
  exitCode: number,
  fallbackScenario: PdoScenario,
): PhpRunOutput {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim());
  const stateLine = lines.find((line) => line.startsWith(stateMarker));
  const state =
    stateLine !== undefined
      ? (JSON.parse(stateLine.slice(stateMarker.length)) as PdoScenario)
      : fallbackScenario;
  return { exitCode, stdout, stderr, state };
}

function makeWasmPhpRunner(scenario: PdoScenario): {
  runner: (input: { phpBinary: string; args: string[] }) => Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>;
  getState: () => PdoScenario;
} {
  let lastState: PdoScenario = scenario;
  const runner = async (input: { phpBinary: string; args: string[] }) => {
    // Drop the leading script path (input.args[0]) — buildHarnessCode adds
    // its own argv[0].
    const phpArgs = input.args.slice(1);
    const php = await getPhp();
    const response = await php.runStream({
      code: buildHarnessCode(phpArgs, scenario),
    });
    const stdout = await response.stdoutText;
    const stderr = await response.stderrText;
    const exitCode = await response.exitCode;
    const parsed = parsePhpOutput(stdout, stderr, exitCode, scenario);
    lastState = parsed.state;
    // Strip the state marker line from stdout so the wrapper can parse the
    // PHP outcome JSON normally.
    const cleanedStdout = stdout
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith(stateMarker))
      .join("\n");
    return { exitCode, stdout: cleanedStdout, stderr };
  };
  return { runner, getState: () => lastState };
}

function makeFetchImpl(
  handler: (url: string) => Promise<Response>,
): {
  impl: (url: string, init?: RequestInit) => Promise<Response>;
  calls: { url: string }[];
} {
  const calls: { url: string }[] = [];
  return {
    impl: async (url) => {
      calls.push({ url });
      return handler(url);
    },
    calls,
  };
}

function captureStdio(): {
  stdout: string[];
  stderr: string[];
  restore: () => void;
} {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const origStdout = process.stdout.write.bind(process.stdout);
  const origStderr = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: unknown) => {
    stdout.push(typeof chunk === "string" ? chunk : String(chunk));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    stderr.push(typeof chunk === "string" ? chunk : String(chunk));
    return true;
  }) as typeof process.stderr.write;

  return {
    stdout,
    stderr,
    restore: () => {
      process.stdout.write = origStdout;
      process.stderr.write = origStderr;
    },
  };
}

function buildValidHandoff(slug: string): Record<string, unknown> {
  const signals = defaultSignals();
  const reservations = defaultReservations();
  return {
    schemaVersion: 1,
    entrySlug: slug,
    documentPath: `deep-research/${slug}.md`,
    accessedDate: ACCESSED_DATE,
    dryRun: false,
    thresholdCheck: {
      totalAcceptedRows: signals.length + reservations.length,
      acceptedPositiveSignals: signals.length,
      acceptedReservations: reservations.length,
      passed: true,
      thresholds: {
        minTotalRows: 8,
        minPositiveSignals: 4,
        minReservations: 1,
      },
    },
    accepted: {
      positive_signals: signals.map((s) => ({
        row: { ...s, text_de: null },
        verifier: {
          source_title: "Source",
          source_url: s.source_url,
          accessed_at: ACCESSED_DATE,
          supporting_quote: `Quoted evidence for ${s.signal_key}.`,
          verification_note: `Verified ${s.signal_key}.`,
        },
      })),
      reservations: reservations.map((r) => ({
        row: {
          ...r,
          event_date: null,
          penalty_tier: null,
          penalty_amount: null,
          text_de: null,
        },
        verifier: {
          source_title: "Source",
          source_url: r.source_url,
          accessed_at: ACCESSED_DATE,
          supporting_quote: `Quoted evidence for ${r.reservation_key}.`,
          verification_note: `Verified ${r.reservation_key}.`,
        },
      })),
      scoring_metadata: {
        base_class_override: "eu",
        is_ad_surveillance: false,
        deep_research_path: `deep-research/${slug}.md`,
        worksheet_path: `tmp/scoring-worksheets/${slug}.md`,
      },
    },
    rejected: [],
  };
}

// ---------------------------------------------------------------------------
// Orchestrator harness setup
// ---------------------------------------------------------------------------

type OrchestratorEnv = Record<StageEnvName, string>;

type OrchestratorHarness = {
  tempDir: string;
  inputDir: string;
  snapshotPath: string;
  outputDir: string;
  env: OrchestratorEnv;
  records: {
    match: string;
    extract: string | null;
    verify: string | null;
    worksheet: string | null;
    apply: string;
  };
};

type OrchestratorOptions = {
  slug?: string;
  matchPayload?: Record<string, unknown>;
  extractMock?: string;
  extractUseShim?: boolean;
  extractShimExitCode?: number;
  extractShimPayload?: unknown;
  verifyMock?: string;
  verifyUseShim?: boolean;
  verifyShimExitCode?: number;
  verifyShimPayload?: unknown;
  worksheetUseShim?: boolean;
  worksheetShimExitCode?: number;
  worksheetShimPayload?: unknown;
  worksheetForceFailure?: boolean;
  applyShimExitCode?: number;
  applyShimPayload?: unknown;
  documentUrls?: string[];
};

function setupOrchestratorHarness(
  options: OrchestratorOptions,
): OrchestratorHarness {
  const slug = options.slug ?? "alpha";
  const tempDir = makeProjectTempDir("e2e-scoring-pipeline-");
  const inputDir = join(tempDir, "deep-research-input");
  mkdirSync(inputDir, { recursive: true });

  const urls =
    options.documentUrls ??
    allUrls(defaultSignals(), defaultReservations());
  writeText(join(inputDir, `${slug}.md`), buildDeepResearchDocument(slug, urls));

  const snapshotPath = join(tempDir, "snapshot.json");
  writeJson(snapshotPath, {
    entries: [{ id: 1000, slug, name: slug }],
  });

  const outputDir = join(tempDir, "out");

  // ----- stage 1 (match) -----
  const matchPayload =
    options.matchPayload ?? defaultMatchPayload(inputDir, [slug]);
  const matchShim = buildStageShim(tempDir, "match", {
    stdoutPayload: matchPayload,
  });

  // ----- stage 2 (extract) -----
  let extractEnv: string;
  let extractRecord: string | null = null;
  if (options.extractUseShim === true) {
    const shim = buildStageShim(tempDir, "extract", {
      exitCode: options.extractShimExitCode ?? 0,
      stdoutPayload: options.extractShimPayload ?? {
        entrySlug: slug,
        documentPath: `${inputDir}/${slug}.md`,
        dryRun: false,
        proposed: {
          positive_signals: defaultSignals().map((s) => ({
            ...s,
            text_de: null,
          })),
          reservations: defaultReservations().map((r) => ({
            ...r,
            text_de: null,
            event_date: null,
            penalty_tier: null,
            penalty_amount: null,
          })),
          scoring_metadata: {
            base_class_override: null,
            is_ad_surveillance: null,
            deep_research_path: null,
            worksheet_path: null,
          },
        },
      },
    });
    extractEnv = `bash ${shim.shimPath}`;
    extractRecord = shim.recordPath;
  } else {
    const mockPath = join(tempDir, "extract-mock.txt");
    writeText(
      mockPath,
      options.extractMock ??
        buildExtractMockResponse(defaultSignals(), defaultReservations()),
    );
    const wrap = buildRealWrapper(tempDir, "extract", realExtract, [
      "--mock-response-file",
      mockPath,
    ]);
    extractEnv = `bash ${wrap}`;
  }

  // ----- stage 3 (verify) -----
  let verifyEnv: string;
  let verifyRecord: string | null = null;
  if (options.verifyUseShim === true) {
    const shim = buildStageShim(tempDir, "verify", {
      exitCode: options.verifyShimExitCode ?? 0,
      stdoutPayload: options.verifyShimPayload ?? buildValidHandoff(slug),
      writeToOutputFile: true,
    });
    verifyEnv = `bash ${shim.shimPath}`;
    verifyRecord = shim.recordPath;
  } else {
    const mockPath = join(tempDir, "verify-mock.txt");
    writeText(
      mockPath,
      options.verifyMock ??
        buildVerifyMockResponse(
          slug,
          defaultSignals(),
          defaultReservations(),
        ),
    );
    const wrap = buildRealWrapper(tempDir, "verify", realVerify, [
      "--mock-response-file",
      mockPath,
    ]);
    verifyEnv = `bash ${wrap}`;
  }

  // ----- stage 4 (worksheet) -----
  let worksheetEnv: string;
  let worksheetRecord: string | null = null;
  if (options.worksheetUseShim === true) {
    const shim = buildStageShim(tempDir, "worksheet", {
      exitCode: options.worksheetShimExitCode ?? 0,
      stdoutPayload: options.worksheetShimPayload ?? {
        entrySlug: slug,
        worksheetPath: `tmp/scoring-worksheets/${slug}.md`,
        absoluteWorksheetPath: `${projectDir}/tmp/scoring-worksheets/${slug}.md`,
        dryRun: false,
        wrote: true,
        summary: {},
      },
    });
    worksheetEnv = `bash ${shim.shimPath}`;
    worksheetRecord = shim.recordPath;
  } else {
    // Real stage-4 runs against the verified-action.json the orchestrator
    // wrote from stage 3. To force a failure, inject an extra flag that
    // resolves the worksheet path outside the project root.
    const extras = options.worksheetForceFailure === true
      ? ["--output-dir", "/etc"]
      : [];
    const wrap = buildRealWrapper(
      tempDir,
      "worksheet",
      realWorksheet,
      extras,
    );
    worksheetEnv = `bash ${wrap}`;
  }

  // ----- stage 5 (apply) -----
  const applyShim = buildStageShim(tempDir, "apply", {
    exitCode: options.applyShimExitCode ?? 0,
    stdoutPayload: options.applyShimPayload ?? defaultApplyOutcome(slug),
  });

  const env: OrchestratorEnv = {
    EUROALT_VET_DEEP_RESEARCH_CMD: `bash ${matchShim.shimPath}`,
    EUROALT_VET_DEEP_RESEARCH_EXTRACT_CMD: extractEnv,
    EUROALT_VET_DEEP_RESEARCH_VERIFY_CMD: verifyEnv,
    EUROALT_VET_DEEP_RESEARCH_WORKSHEET_CMD: worksheetEnv,
    EUROALT_APPLY_DEEP_RESEARCH_SCORING_CMD: `bash ${applyShim.shimPath}`,
  };

  return {
    tempDir,
    inputDir,
    snapshotPath,
    outputDir,
    env,
    records: {
      match: matchShim.recordPath,
      extract: extractRecord,
      verify: verifyRecord,
      worksheet: worksheetRecord,
      apply: applyShim.recordPath,
    },
  };
}

function orchestratorArgs(
  harness: OrchestratorHarness,
  extra: string[] = [],
): string[] {
  return [
    "--input-dir",
    harness.inputDir,
    "--catalog-snapshot-file",
    harness.snapshotPath,
    "--api-base-url",
    "http://api.local",
    "--output-dir",
    harness.outputDir,
    "--accessed-date",
    ACCESSED_DATE,
    ...extra,
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("deep-research scoring pipeline E2E (mocked) — fail-closed safety contract (#487)", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  afterAll(async () => {
    if (phpPromise !== undefined) {
      const php = await phpPromise;
      php.exit();
    }
  });

  // -------------------------------------------------------------------------
  // AC0 — happy path through the apply wrapper. PHP-wasm in-memory PDO sees
  // one transaction with begin+commit, one cache invalidation, all rows
  // inserted, and the post-check observes trustScoreStatus="ready".
  // -------------------------------------------------------------------------
  it("AC0: happy path inserts 4+4+1 rows, commits, invalidates cache, post-check sees ready", async () => {
    const slug = "ac0-alpha";
    const scenario = baseScenario(slug);
    const { runner, getState } = makeWasmPhpRunner(scenario);
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      return new Response(
        JSON.stringify({
          id: slug,
          trustScore: 42,
          trustScoreStatus: "ready",
          trustScoreBreakdown: {
            base: 50,
            signals: 4,
            reservations: -12,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const handoff = buildValidHandoff(slug);
    const args = [
      "--verified-action-json",
      JSON.stringify(handoff),
      "--worksheet-path",
      `tmp/scoring-worksheets/${slug}.md`,
      "--api-base-url",
      "http://api.local",
    ];

    const captures = captureStdio();
    let exitCode: number;
    try {
      exitCode = await applyWrapperMain(args, {
        phpRunner: runner,
        fetchImpl,
      });
    } finally {
      captures.restore();
    }

    expect(
      exitCode,
      `stdout: ${captures.stdout.join("")}\nstderr: ${captures.stderr.join("")}`,
    ).toBe(0);

    const state = getState();
    expect(state.transactions).toEqual(["begin", "commit"]);
    expect(state.invalidate_cache_calls).toBe(1);
    expect(state.for_update_locks).toContain(701);

    const insertedSignals = state.positive_signals.filter(
      (r) => (r as { entry_id: number }).entry_id === 701,
    );
    const insertedReservations = state.reservations.filter(
      (r) => (r as { entry_id: number }).entry_id === 701,
    );
    const insertedMeta = state.scoring_metadata.filter(
      (r) => (r as { entry_id: number }).entry_id === 701,
    );

    expect(insertedSignals.length).toBe(4);
    expect(insertedReservations.length).toBe(4);
    expect(insertedMeta.length).toBe(1);

    expect(fetchCalls.length).toBe(1);
    expect(fetchCalls[0]?.url).toBe(
      `http://api.local/api/catalog/entry.php?slug=${slug}`,
    );

    // Admin audit line was emitted exactly once.
    expect(state.admin_log.length).toBe(1);
    expect(state.admin_log[0]).toContain("euroalt-admin:");
    expect(state.admin_log[0]).toContain(slug);
    expect(state.admin_log[0]).toContain("positive_signals=4");
    expect(state.admin_log[0]).toContain("reservations=4");
  });

  // -------------------------------------------------------------------------
  // AC1 — --dry-run propagates through every stage, post-check is skipped,
  // and the orchestrator reports dryRun=true.
  // -------------------------------------------------------------------------
  it("AC1: --dry-run propagates to stage 5, summary reports dryRun=true, no DB writes", () => {
    const harness = setupOrchestratorHarness({
      extractUseShim: true,
      verifyUseShim: true,
      worksheetUseShim: true,
      applyShimPayload: {
        ok: true,
        entrySlug: "alpha",
        dryRun: true,
        plan: [],
      },
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      orchestratorArgs(harness, ["--dry-run"]),
      harness.env,
    );
    expect(
      result.status,
      `stdout: ${result.stdout}\nstderr: ${result.stderr}`,
    ).toBe(0);

    const applyCalls = readStageCalls(harness.records.apply);
    expect(applyCalls.length).toBe(1);
    expect(applyCalls[0].argv).toContain("--dry-run");

    const summary = readSummary(harness.outputDir);
    expect(summary.dryRun).toBe(true);
    const counts = summary.counts as Record<string, number>;
    expect(counts.ready).toBe(1);
    expect(counts.failed).toBe(0);
  });

  // -------------------------------------------------------------------------
  // AC2 — stage-1 ambiguous_match: the affected doc never enters the
  // processing loop. No per-doc work dir is created and no downstream stage
  // is invoked for it.
  // -------------------------------------------------------------------------
  it("AC2: stage-1 ambiguous_match counts as skipped, zero downstream invocations for that doc", () => {
    const slug = "ambig-doc";
    const harness = setupOrchestratorHarness({
      slug,
      matchPayload: {
        inputDir: "tmp/dummy",
        dryRun: false,
        matches: [],
        skipped: [
          {
            documentPath: `tmp/dummy/${slug}.md`,
            reason: "ambiguous_match",
            candidates: ["one", "two"],
          },
        ],
        summary: { discovered: 1, matched: 0, skipped: 1 },
      },
      extractUseShim: true,
      verifyUseShim: true,
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).toBe(0);

    expect(readStageCalls(harness.records.extract ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.verify ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.worksheet ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const counts = summary.counts as Record<string, number>;
    expect(counts.skipped).toBe(1);
    expect(counts.ready).toBe(0);
    expect(counts.failed).toBe(0);

    expect(existsSync(join(harness.outputDir, slug))).toBe(false);
  });

  // -------------------------------------------------------------------------
  // AC3 — stage-1 no_match: same shape as AC2 but reason is no_match.
  // -------------------------------------------------------------------------
  it("AC3: stage-1 no_match counts as skipped, downstream stages never invoked", () => {
    const slug = "no-match-doc";
    const harness = setupOrchestratorHarness({
      slug,
      matchPayload: {
        inputDir: "tmp/dummy",
        dryRun: false,
        matches: [],
        skipped: [
          {
            documentPath: `tmp/dummy/${slug}.md`,
            reason: "no_match",
          },
        ],
        summary: { discovered: 1, matched: 0, skipped: 1 },
      },
      extractUseShim: true,
      verifyUseShim: true,
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).toBe(0);

    expect(readStageCalls(harness.records.extract ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const counts = summary.counts as Record<string, number>;
    expect(counts.skipped).toBe(1);
    expect(counts.failed).toBe(0);
  });

  // -------------------------------------------------------------------------
  // AC4 — stage-2 emits malformed JSON inside the sentinel block. The real
  // stage-2 entrypoint must fail; stages 3+ must never run.
  // -------------------------------------------------------------------------
  it("AC4: stage-2 malformed sentinel block → failed, stage 3+ never invoked", () => {
    const harness = setupOrchestratorHarness({
      extractMock: `${VET_EXTRACT_BEGIN}\n{ this is not valid json\n${VET_EXTRACT_END}\n`,
      verifyUseShim: true,
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    expect(readStageCalls(harness.records.verify ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.worksheet ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].status).toBe("failed");
    expect(docs[0].failedStage).toBe("extract");
  });

  // -------------------------------------------------------------------------
  // AC5 — stage-2 emits a banned trust-score key anywhere in the payload.
  // The real extractor's banned-key denylist must reject it.
  // -------------------------------------------------------------------------
  it("AC5: stage-2 emits banned trust-score key → failed, stage 3+ never invoked", () => {
    const sigs = defaultSignals();
    const res = defaultReservations();
    const payload = {
      positive_signals: sigs.map((s, i) => ({
        ...s,
        text_de: null,
        ...(i === 0 ? { trust_score: 9.0 } : {}),
      })),
      reservations: res.map((r) => ({
        ...r,
        text_de: null,
        event_date: null,
        penalty_tier: null,
        penalty_amount: null,
      })),
      scoring_metadata: {
        base_class_override: null,
        is_ad_surveillance: null,
        deep_research_path: null,
        worksheet_path: null,
      },
    };
    const harness = setupOrchestratorHarness({
      extractMock: `${VET_EXTRACT_BEGIN}\n${JSON.stringify(payload)}\n${VET_EXTRACT_END}\n`,
      verifyUseShim: true,
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    expect(readStageCalls(harness.records.verify ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].status).toBe("failed");
    expect(docs[0].failedStage).toBe("extract");
  });

  // -------------------------------------------------------------------------
  // AC6 — stage-2 emits a positive_signal with a missing source_url. The
  // real extractor's source_url check must reject it.
  // -------------------------------------------------------------------------
  it("AC6: stage-2 positive_signal missing source_url → failed, stage 3+ never invoked", () => {
    const sigs = defaultSignals();
    const res = defaultReservations();
    const payload = {
      positive_signals: sigs.map((s, i) => ({
        ...s,
        text_de: null,
        ...(i === 0 ? { source_url: null } : {}),
      })),
      reservations: res.map((r) => ({
        ...r,
        text_de: null,
        event_date: null,
        penalty_tier: null,
        penalty_amount: null,
      })),
      scoring_metadata: {
        base_class_override: null,
        is_ad_surveillance: null,
        deep_research_path: null,
        worksheet_path: null,
      },
    };
    const harness = setupOrchestratorHarness({
      extractMock: `${VET_EXTRACT_BEGIN}\n${JSON.stringify(payload)}\n${VET_EXTRACT_END}\n`,
      verifyUseShim: true,
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    expect(readStageCalls(harness.records.verify ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].failedStage).toBe("extract");
  });

  // -------------------------------------------------------------------------
  // AC7 — verifier marks a row as source-inaccessible, dropping a row below
  // the threshold. The real stage-3 lib must throw threshold fail-closed.
  // -------------------------------------------------------------------------
  it("AC7: verifier marks row source-inaccessible → threshold fail → failed, stage 4+ never invoked", () => {
    const sigs = defaultSignals();
    const res = defaultReservations();
    const slug = "alpha";

    // 4 positives + 4 reservations = 8. Marking one positive as
    // source-inaccessible drops surviving positives to 3 (< MIN_POSITIVE_SIGNALS).
    const harness = setupOrchestratorHarness({
      slug,
      verifyMock: buildVerifyMockResponse(slug, sigs, res, {
        signalOverrides: {
          [sigs[0].signal_key]: { verdict: "source-inaccessible" },
        },
      }),
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    expect(readStageCalls(harness.records.worksheet ?? "").length).toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].failedStage).toBe("verify");
  });

  // -------------------------------------------------------------------------
  // AC8 — verifier returns a "supports" row but with an empty
  // supporting_quote. effectiveVerdictFor() downgrades it to missing-quote
  // and drops the row.
  // -------------------------------------------------------------------------
  it("AC8: verifier supports verdict with empty supporting_quote → row dropped → threshold fail", () => {
    const sigs = defaultSignals();
    const res = defaultReservations();
    const slug = "alpha";

    const harness = setupOrchestratorHarness({
      slug,
      verifyMock: buildVerifyMockResponse(slug, sigs, res, {
        signalOverrides: {
          [sigs[0].signal_key]: {
            verdict: "supports",
            supporting_quote: "",
          },
        },
      }),
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].failedStage).toBe("verify");
  });

  // -------------------------------------------------------------------------
  // AC9 — verifier drops accepted evidence below MIN_TOTAL_ROWS=8.
  // Setup: 4 positives + 5 reservations in extraction; verifier rejects 4
  // reservations → 4 positives + 1 reservation = 5 total < 8.
  // -------------------------------------------------------------------------
  it("AC9: verifier drops surviving rows below MIN_TOTAL_ROWS=8 → failed, stage 5 never invoked", () => {
    const sigs = defaultSignals();
    const slug = "alpha";

    // 4 positives + 5 reservations in extraction; verifier rejects 4 of 5
    // reservations → 4 + 1 = 5 surviving < MIN_TOTAL_ROWS=8.
    const extraRes: ReservationSpec = {
      reservation_key: "res-extra",
      severity: "minor",
      is_structural: false,
      text_en: "Extra reservation for AC9.",
      source_url: "https://example.eu/extra-reservation",
    };
    const reservations = [...defaultReservations(), extraRes];
    const urls = allUrls(sigs, reservations);

    const harness = setupOrchestratorHarness({
      slug,
      documentUrls: urls,
      extractMock: buildExtractMockResponse(sigs, reservations),
      verifyMock: buildVerifyMockResponse(slug, sigs, reservations, {
        reservationOverrides: {
          [reservations[0].reservation_key]: { verdict: "contradicts" },
          [reservations[1].reservation_key]: { verdict: "contradicts" },
          [reservations[2].reservation_key]: { verdict: "contradicts" },
          [reservations[3].reservation_key]: { verdict: "contradicts" },
        },
      }),
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].failedStage).toBe("verify");
  });

  // -------------------------------------------------------------------------
  // AC10 — verifier drops accepted evidence below MIN_POSITIVE_SIGNALS=4.
  // -------------------------------------------------------------------------
  it("AC10: verifier drops surviving positives below MIN_POSITIVE_SIGNALS=4 → failed", () => {
    const sigs = defaultSignals();
    const res = defaultReservations();
    const slug = "alpha";

    const harness = setupOrchestratorHarness({
      slug,
      verifyMock: buildVerifyMockResponse(slug, sigs, res, {
        signalOverrides: {
          [sigs[0].signal_key]: { verdict: "contradicts" },
        },
      }),
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].failedStage).toBe("verify");
  });

  // -------------------------------------------------------------------------
  // AC11 — verifier drops accepted evidence below MIN_RESERVATIONS=1.
  // -------------------------------------------------------------------------
  it("AC11: verifier drops surviving reservations to zero → failed (MIN_RESERVATIONS=1)", () => {
    const slug = "alpha";

    // 7 positives + 1 reservation in extraction (passes MIN counts: total=8).
    // Verifier rejects the single reservation → 7 + 0 fails MIN_RESERVATIONS.
    const sigs: SignalSpec[] = [
      ...defaultSignals(),
      {
        signal_key: "sig-extra-a",
        dimension: "security",
        amount: 1.0,
        text_en: "Extra signal A.",
        source_url: "https://example.eu/extra-a",
      },
      {
        signal_key: "sig-extra-b",
        dimension: "security",
        amount: 1.0,
        text_en: "Extra signal B.",
        source_url: "https://example.eu/extra-b",
      },
      {
        signal_key: "sig-extra-c",
        dimension: "security",
        amount: 1.0,
        text_en: "Extra signal C.",
        source_url: "https://example.eu/extra-c",
      },
    ];
    const reservations: ReservationSpec[] = [
      {
        reservation_key: "res-only",
        severity: "minor",
        is_structural: false,
        text_en: "The only reservation.",
        source_url: "https://example.eu/only-reservation",
      },
    ];
    const urls = allUrls(sigs, reservations);

    const harness = setupOrchestratorHarness({
      slug,
      documentUrls: urls,
      extractMock: buildExtractMockResponse(sigs, reservations),
      verifyMock: buildVerifyMockResponse(slug, sigs, reservations, {
        reservationOverrides: {
          [reservations[0].reservation_key]: { verdict: "contradicts" },
        },
      }),
      worksheetUseShim: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].failedStage).toBe("verify");
  });

  // -------------------------------------------------------------------------
  // AC12 — stage-4 worksheet failure prevents stage-5. We run the REAL
  // stage-4 with --output-dir set outside the project root so the path-safety
  // check throws.
  // -------------------------------------------------------------------------
  it("AC12: real stage-4 rejects path-traversing output dir → failed, stage 5 never invoked", () => {
    const harness = setupOrchestratorHarness({
      worksheetForceFailure: true,
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(result.status).not.toBe(0);
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].failedStage).toBe("worksheet");
  });

  // -------------------------------------------------------------------------
  // AC13 — DB INSERT failure rolls back the transaction, skips cache
  // invalidation, and the wrapper passes through exit 1.
  // -------------------------------------------------------------------------
  it("AC13: DB INSERT failure → transactions=[begin,rollback], no cache invalidation, exit 1", async () => {
    const slug = "ac13-alpha";
    const scenario = baseScenario(slug);
    scenario.fail_next_execute_with = "insert into reservations";

    const { runner, getState } = makeWasmPhpRunner(scenario);
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called after rollback");
    });

    const handoff = buildValidHandoff(slug);
    const args = [
      "--verified-action-json",
      JSON.stringify(handoff),
      "--worksheet-path",
      `tmp/scoring-worksheets/${slug}.md`,
      "--api-base-url",
      "http://api.local",
    ];

    const captures = captureStdio();
    let exitCode: number;
    try {
      exitCode = await applyWrapperMain(args, {
        phpRunner: runner,
        fetchImpl,
      });
    } finally {
      captures.restore();
    }

    expect(exitCode).not.toBe(0);
    expect(fetchCalls.length).toBe(0);

    const state = getState();
    expect(state.transactions).toContain("begin");
    expect(state.transactions).toContain("rollback");
    expect(state.transactions).not.toContain("commit");
    expect(state.invalidate_cache_calls).toBe(0);
  });

  // -------------------------------------------------------------------------
  // AC14 — API post-check failure: PHP succeeds (rows persisted, cache
  // invalidated), but the API still reports trustScoreStatus="pending".
  // The wrapper exits with WRAPPER_POST_CHECK_FAILED (3) and the DB state
  // is intentionally NOT rolled back — the failure is at the API layer.
  // -------------------------------------------------------------------------
  it("AC14: API post-check sees pending status → wrapper exit 3, rows persist", async () => {
    const slug = "ac14-alpha";
    const scenario = baseScenario(slug);
    const { runner, getState } = makeWasmPhpRunner(scenario);
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      return new Response(
        JSON.stringify({
          id: slug,
          trustScore: null,
          trustScoreStatus: "pending",
          trustScoreBreakdown: null,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const handoff = buildValidHandoff(slug);
    const args = [
      "--verified-action-json",
      JSON.stringify(handoff),
      "--worksheet-path",
      `tmp/scoring-worksheets/${slug}.md`,
      "--api-base-url",
      "http://api.local",
    ];

    const captures = captureStdio();
    let exitCode: number;
    try {
      exitCode = await applyWrapperMain(args, {
        phpRunner: runner,
        fetchImpl,
      });
    } finally {
      captures.restore();
    }

    expect(exitCode).toBe(WRAPPER_POST_CHECK_FAILED);
    expect(fetchCalls.length).toBe(1);

    const state = getState();
    // DB writes ARE persisted on this path — the failure is downstream.
    expect(state.transactions).toEqual(["begin", "commit"]);
    expect(state.invalidate_cache_calls).toBe(1);
    expect(
      state.positive_signals.filter(
        (r) => (r as { entry_id: number }).entry_id === 701,
      ).length,
    ).toBe(4);
    expect(
      state.reservations.filter(
        (r) => (r as { entry_id: number }).entry_id === 701,
      ).length,
    ).toBe(4);
  });

  // -------------------------------------------------------------------------
  // AC15 — banned-key sweep: a happy-path orchestrator run must not leak
  // any stored trust-score key into any JSON artifact (match.json,
  // entry.json, extraction.json, verified-action.json, worksheet-meta.json,
  // apply-outcome.json, status.json, summary.json). The single legitimate
  // top-level `trustScoreStatus: "ready"` echo in apply-outcome.json is
  // whitelisted by location.
  // -------------------------------------------------------------------------
  it("AC15: no banned trust-score key leaks into any orchestrator artifact for the happy path", () => {
    const harness = setupOrchestratorHarness({});
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(orchestratorArgs(harness), harness.env);
    expect(
      result.status,
      `stdout: ${result.stdout}\nstderr: ${result.stderr}`,
    ).toBe(0);

    const summary = readSummary(harness.outputDir);
    const counts = summary.counts as Record<string, number>;
    expect(counts.ready).toBe(1);

    assertNoBannedKeysUnder(harness.outputDir);
  });
});
