import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

// Target files (do not exist yet — these tests are the contract for #486).
const projectDir = resolve(".");
const orchestratorPath = resolve("scripts/score-deep-research-folder.sh");

// ---------------------------------------------------------------------------
// Test harness
//
// The batch orchestrator composes five existing per-stage subprocesses. To
// keep the tests deterministic (no codex, no DB, no network) we shim each
// stage with a small bash script that:
//   - records every invocation (argv) to a log file
//   - emits canned JSON on stdout (and, for the verify stage, writes to
//     --output-file if requested)
//   - exits with a configurable exit code
// The orchestrator picks up each shim via the following EUROALT_*_CMD env
// vars; the implementer is expected to honour these names (they extend the
// established naming pattern from process-suggestion-issue-codex.sh).
//
//   EUROALT_VET_DEEP_RESEARCH_CMD            stage 1 (discover & match)
//   EUROALT_VET_DEEP_RESEARCH_EXTRACT_CMD    stage 2 (codex extraction)
//   EUROALT_VET_DEEP_RESEARCH_VERIFY_CMD     stage 3 (codex verification)
//   EUROALT_VET_DEEP_RESEARCH_WORKSHEET_CMD  stage 4 (worksheet generation)
//   EUROALT_APPLY_DEEP_RESEARCH_SCORING_CMD  stage 5 (DB write + post-check)
//
// The orchestrator must also accept --catalog-snapshot-file so the tests
// never need to hit the catalog HTTP endpoint.
// ---------------------------------------------------------------------------

const STAGE_ENV_VARS = {
  match: "EUROALT_VET_DEEP_RESEARCH_CMD",
  extract: "EUROALT_VET_DEEP_RESEARCH_EXTRACT_CMD",
  verify: "EUROALT_VET_DEEP_RESEARCH_VERIFY_CMD",
  worksheet: "EUROALT_VET_DEEP_RESEARCH_WORKSHEET_CMD",
  apply: "EUROALT_APPLY_DEEP_RESEARCH_SCORING_CMD",
} as const;

type StageName = keyof typeof STAGE_ENV_VARS;

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(join(tempRoot, prefix));
}

function writeDoc(dir: string, slug: string, body?: string): string {
  const path = join(dir, `${slug}.md`);
  writeFileSync(
    path,
    body ??
      `---\nentry_slug: ${slug}\n---\n# ${slug}\n\nDeep research document for ${slug}.\n`,
    "utf8",
  );
  return path;
}

function writeSnapshot(
  tempDir: string,
  slugs: readonly string[],
): string {
  const snapshotPath = join(tempDir, "snapshot.json");
  const entries = slugs.map((slug, index) => ({
    id: 1000 + index,
    slug,
    name: slug,
    website_url: `https://${slug}.example.org`,
  }));
  writeFileSync(snapshotPath, JSON.stringify({ entries }), "utf8");
  return snapshotPath;
}

type ShimOptions = {
  exitCode?: number;
  stdoutPayload?: unknown;
  // When set, the shim writes the same payload to whatever path follows
  // --output-file in its argv. Used for the verify stage.
  writeToOutputFile?: boolean;
  // Per-doc exit code override (keyed by entry slug discovered from argv).
  perSlug?: Record<string, { exitCode: number; stdoutPayload?: unknown }>;
};

type ShimResult = {
  shimPath: string;
  recordPath: string;
};

/**
 * Build a bash shim for a stage. Records every invocation to a log file and
 * emits the configured payload on stdout.
 *
 * Per-slug behaviour: the shim inspects each --entry-file / --document-file
 * / --verified-action-file argument and, if any of those file paths contains
 * a slug from `perSlug`, uses that slug's override. This lets a single shim
 * stub different docs differently within one test run.
 */
function buildStageShim(
  tempDir: string,
  stage: StageName,
  options: ShimOptions = {},
): ShimResult {
  const exitCode = options.exitCode ?? 0;
  const stdoutPayload = options.stdoutPayload ?? { ok: true, stage };
  const shimPath = join(tempDir, `shim-${stage}.sh`);
  const recordPath = join(tempDir, `shim-${stage}.log`);
  const defaultPayloadPath = join(tempDir, `shim-${stage}.payload.json`);

  writeFileSync(recordPath, "", "utf8");
  writeFileSync(defaultPayloadPath, JSON.stringify(stdoutPayload), "utf8");

  // Materialise per-slug overrides to disk.
  const perSlugEntries: { slug: string; payloadPath: string; exitCode: number }[] = [];
  if (options.perSlug !== undefined) {
    for (const [slug, override] of Object.entries(options.perSlug)) {
      const p = join(tempDir, `shim-${stage}.${slug}.payload.json`);
      writeFileSync(
        p,
        JSON.stringify(override.stdoutPayload ?? stdoutPayload),
        "utf8",
      );
      perSlugEntries.push({
        slug,
        payloadPath: p,
        exitCode: override.exitCode,
      });
    }
  }

  const perSlugBash = perSlugEntries
    .map(
      ({ slug, payloadPath, exitCode: rc }) =>
        `if [[ "$ALL_ARGS" == *"${slug}"* ]]; then PAYLOAD=${JSON.stringify(payloadPath)}; RC=${String(rc)}; fi`,
    )
    .join("\n");

  const writeToOutput = options.writeToOutputFile === true;

  writeFileSync(
    shimPath,
    `#!/usr/bin/env bash
set -u
RECORD=${JSON.stringify(recordPath)}
PAYLOAD=${JSON.stringify(defaultPayloadPath)}
RC=${String(exitCode)}
ALL_ARGS="$*"
${perSlugBash}

{
  printf 'CALL\\n'
  for arg in "$@"; do
    printf '%s\\n' "$arg"
  done
  printf 'EXIT=%s\\n' "$RC"
} >> "$RECORD"

${
  writeToOutput
    ? `# If --output-file <path> is in argv, copy the payload there as well.
PREV=""
for arg in "$@"; do
  if [[ "$PREV" == "--output-file" ]]; then
    cp "$PAYLOAD" "$arg"
  fi
  PREV="$arg"
done
`
    : ""
}
cat "$PAYLOAD"
echo
exit "$RC"
`,
    "utf8",
  );
  chmodSync(shimPath, 0o755);

  return { shimPath, recordPath };
}

type StageCall = { argv: string[]; exit: number | null };

function readStageCalls(recordPath: string): StageCall[] {
  if (!existsSync(recordPath)) {
    return [];
  }
  const text = readFileSync(recordPath, "utf8");
  const lines = text.split("\n");
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

function defaultExtractPayload(slug: string): Record<string, unknown> {
  return {
    entrySlug: slug,
    documentPath: `tmp/deep-research/${slug}.md`,
    dryRun: false,
    proposed: {
      positive_signals: [],
      reservations: [],
      scoring_metadata: {},
    },
    accessedDate: "2026-05-27",
  };
}

function defaultVerifiedPayload(slug: string): Record<string, unknown> {
  return {
    schemaVersion: 1,
    entrySlug: slug,
    accessedDate: "2026-05-27",
    positiveSignals: [],
    reservations: [],
    scoringMetadata: {},
  };
}

function defaultWorksheetPayload(slug: string): Record<string, unknown> {
  return {
    entrySlug: slug,
    worksheetPath: `tmp/scoring-worksheets/${slug}.md`,
    absoluteWorksheetPath: join(
      projectDir,
      `tmp/scoring-worksheets/${slug}.md`,
    ),
    dryRun: false,
    wrote: true,
    summary: {},
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

type Harness = {
  tempDir: string;
  inputDir: string;
  snapshotPath: string;
  outputDir: string;
  env: Record<string, string>;
  records: Record<StageName, string>;
};

type HarnessOptions = {
  slugs: readonly string[];
  matchOverride?: Record<string, unknown>;
  extract?: ShimOptions;
  verify?: ShimOptions;
  worksheet?: ShimOptions;
  apply?: ShimOptions;
  match?: ShimOptions;
};

function setupHarness(options: HarnessOptions): Harness {
  const tempDir = makeProjectTempDir("score-deep-research-batch-");
  const inputDir = join(tempDir, "deep-research-input");
  mkdirSync(inputDir, { recursive: true });
  for (const slug of options.slugs) {
    writeDoc(inputDir, slug);
  }
  const snapshotPath = writeSnapshot(tempDir, options.slugs);
  const outputDir = join(tempDir, "batch-out");

  const matchPayload =
    options.matchOverride ?? defaultMatchPayload(inputDir, options.slugs);

  const matchShim = buildStageShim(tempDir, "match", {
    stdoutPayload: matchPayload,
    ...options.match,
  });

  // Default per-slug payloads for the other stages, so a single shim can
  // serve docs whose slug appears in their argv.
  const extractPerSlug: ShimOptions["perSlug"] = {};
  const verifyPerSlug: ShimOptions["perSlug"] = {};
  const worksheetPerSlug: ShimOptions["perSlug"] = {};
  const applyPerSlug: ShimOptions["perSlug"] = {};
  for (const slug of options.slugs) {
    extractPerSlug[slug] = { exitCode: 0, stdoutPayload: defaultExtractPayload(slug) };
    verifyPerSlug[slug] = { exitCode: 0, stdoutPayload: defaultVerifiedPayload(slug) };
    worksheetPerSlug[slug] = {
      exitCode: 0,
      stdoutPayload: defaultWorksheetPayload(slug),
    };
    applyPerSlug[slug] = { exitCode: 0, stdoutPayload: defaultApplyOutcome(slug) };
  }

  // Merge caller overrides on top of the defaults.
  for (const slug of Object.keys(options.extract?.perSlug ?? {})) {
    extractPerSlug[slug] = options.extract!.perSlug![slug];
  }
  for (const slug of Object.keys(options.verify?.perSlug ?? {})) {
    verifyPerSlug[slug] = options.verify!.perSlug![slug];
  }
  for (const slug of Object.keys(options.worksheet?.perSlug ?? {})) {
    worksheetPerSlug[slug] = options.worksheet!.perSlug![slug];
  }
  for (const slug of Object.keys(options.apply?.perSlug ?? {})) {
    applyPerSlug[slug] = options.apply!.perSlug![slug];
  }

  const extractShim = buildStageShim(tempDir, "extract", {
    perSlug: extractPerSlug,
    ...options.extract,
    stdoutPayload:
      options.extract?.stdoutPayload ?? defaultExtractPayload("__unused__"),
  });
  const verifyShim = buildStageShim(tempDir, "verify", {
    perSlug: verifyPerSlug,
    writeToOutputFile: true,
    ...options.verify,
    stdoutPayload:
      options.verify?.stdoutPayload ?? defaultVerifiedPayload("__unused__"),
  });
  const worksheetShim = buildStageShim(tempDir, "worksheet", {
    perSlug: worksheetPerSlug,
    ...options.worksheet,
    stdoutPayload:
      options.worksheet?.stdoutPayload ?? defaultWorksheetPayload("__unused__"),
  });
  const applyShim = buildStageShim(tempDir, "apply", {
    perSlug: applyPerSlug,
    ...options.apply,
    stdoutPayload:
      options.apply?.stdoutPayload ?? defaultApplyOutcome("__unused__"),
  });

  const env: Record<string, string> = {
    [STAGE_ENV_VARS.match]: `bash ${matchShim.shimPath}`,
    [STAGE_ENV_VARS.extract]: `bash ${extractShim.shimPath}`,
    [STAGE_ENV_VARS.verify]: `bash ${verifyShim.shimPath}`,
    [STAGE_ENV_VARS.worksheet]: `bash ${worksheetShim.shimPath}`,
    [STAGE_ENV_VARS.apply]: `bash ${applyShim.shimPath}`,
  };

  return {
    tempDir,
    inputDir,
    snapshotPath,
    outputDir,
    env,
    records: {
      match: matchShim.recordPath,
      extract: extractShim.recordPath,
      verify: verifyShim.recordPath,
      worksheet: worksheetShim.recordPath,
      apply: applyShim.recordPath,
    },
  };
}

function runOrchestrator(
  args: string[],
  envOverrides: Record<string, string>,
) {
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    ...envOverrides,
  };
  return spawnSync("bash", [orchestratorPath, ...args], {
    cwd: projectDir,
    encoding: "utf8",
    env,
  });
}

function readSummary(outputDir: string): Record<string, unknown> {
  // The orchestrator either writes summary.json directly into --output-dir
  // or into a timestamped subdirectory; accept either layout.
  const directPath = join(outputDir, "summary.json");
  if (existsSync(directPath)) {
    return JSON.parse(readFileSync(directPath, "utf8")) as Record<
      string,
      unknown
    >;
  }
  const entries = existsSync(outputDir) ? readdirSync(outputDir) : [];
  for (const name of entries) {
    const candidate = join(outputDir, name, "summary.json");
    if (existsSync(candidate)) {
      return JSON.parse(readFileSync(candidate, "utf8")) as Record<
        string,
        unknown
      >;
    }
  }
  throw new Error(`summary.json not found under ${outputDir}`);
}

function batchArgs(harness: Harness, extra: string[] = []): string[] {
  return [
    "--input-dir",
    harness.inputDir,
    "--catalog-snapshot-file",
    harness.snapshotPath,
    "--api-base-url",
    "http://api.local",
    "--output-dir",
    harness.outputDir,
    ...extra,
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("score-deep-research-folder batch orchestrator (#486)", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("prints usage on --help and exits 0", () => {
    if (!existsSync(orchestratorPath)) {
      // Fail descriptively so the implementer sees what is missing.
      expect.fail(
        `Orchestrator entrypoint missing: expected ${orchestratorPath} (issue #486 has not been implemented yet)`,
      );
    }
    const result = spawnSync("bash", [orchestratorPath, "--help"], {
      cwd: projectDir,
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toMatch(/--input-dir/);
  });

  it("rejects invocation without --input-dir with exit 64", () => {
    if (!existsSync(orchestratorPath)) {
      expect.fail(`Orchestrator entrypoint missing: ${orchestratorPath}`);
    }
    const result = spawnSync("bash", [orchestratorPath], {
      cwd: projectDir,
      encoding: "utf8",
    });
    expect(result.status).toBe(64);
  });

  it("happy path: processes multiple docs sequentially and marks each ready", () => {
    const harness = setupHarness({ slugs: ["alpha", "bravo", "charlie"] });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(batchArgs(harness), harness.env);
    expect(
      result.status,
      `stdout: ${result.stdout}\nstderr: ${result.stderr}`,
    ).toBe(0);

    // Each non-stage-1 shim was invoked once per matched doc.
    expect(readStageCalls(harness.records.extract).length).toBe(3);
    expect(readStageCalls(harness.records.verify).length).toBe(3);
    expect(readStageCalls(harness.records.worksheet).length).toBe(3);
    expect(readStageCalls(harness.records.apply).length).toBe(3);

    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({
      processed: 3,
      ready: 3,
      skipped: 0,
      failed: 0,
    });
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs.length).toBe(3);
    expect(docs.map((d) => d.status)).toEqual(["ready", "ready", "ready"]);

    // Sequential ordering: doc list reflects sorted filename order
    // (alpha, bravo, charlie).
    expect(docs.map((d) => d.entrySlug)).toEqual(["alpha", "bravo", "charlie"]);
  });

  it("--dry-run: propagates to every stage, summary reports dryRun=true, exit 0", () => {
    const harness = setupHarness({ slugs: ["alpha"] });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      batchArgs(harness, ["--dry-run"]),
      harness.env,
    );
    expect(result.status).toBe(0);

    // --dry-run must be present in stage-5 invocation argv so the PHP writer
    // doesn't touch the DB.
    const applyCalls = readStageCalls(harness.records.apply);
    expect(applyCalls.length).toBe(1);
    expect(applyCalls[0].argv).toContain("--dry-run");

    const summary = readSummary(harness.outputDir);
    expect(summary.dryRun).toBe(true);
  });

  it("failure in any pre-apply stage classifies the doc as failed and never invokes stage-5 for it", () => {
    // Verify (stage 3) fails for "bravo" only; the other two should still
    // reach stage 5 because --continue-on-error is set.
    const harness = setupHarness({
      slugs: ["alpha", "bravo", "charlie"],
      verify: {
        perSlug: {
          bravo: {
            exitCode: 65,
            stdoutPayload: { ok: false, error: "verify failed for bravo" },
          },
        },
      },
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      batchArgs(harness, ["--continue-on-error"]),
      harness.env,
    );
    // With --continue-on-error, batch finishes with non-zero exit because
    // at least one doc failed.
    expect(result.status).not.toBe(0);

    // Stage 5 was invoked for alpha and charlie, but NOT for bravo.
    const applyCalls = readStageCalls(harness.records.apply);
    expect(applyCalls.length).toBe(2);
    const applySlugs = applyCalls
      .map((c) => c.argv.join(" "))
      .map((s) => (s.includes("bravo") ? "bravo" : s.includes("alpha") ? "alpha" : "charlie"));
    expect(applySlugs.sort()).toEqual(["alpha", "charlie"]);

    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({
      processed: 3,
      ready: 2,
      failed: 1,
    });
    const docs = summary.documents as Array<Record<string, unknown>>;
    const bravo = docs.find((d) => d.entrySlug === "bravo");
    expect(bravo?.status).toBe("failed");
    expect(bravo?.failedStage).toBe("verify");
    expect(bravo?.exitCode).toBe(65);
  });

  it("without --continue-on-error, the first failure aborts the batch with that doc's exit code", () => {
    const harness = setupHarness({
      slugs: ["alpha", "bravo", "charlie"],
      extract: {
        perSlug: {
          alpha: {
            exitCode: 65,
            stdoutPayload: { ok: false, error: "extract failed for alpha" },
          },
        },
      },
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(batchArgs(harness), harness.env);
    // Batch exits with the failing doc's exit code (65 from extract).
    expect(result.status).toBe(65);

    // Only the first doc (alpha) was processed before abort.
    const extractCalls = readStageCalls(harness.records.extract);
    expect(extractCalls.length).toBe(1);

    // No downstream stage ran for bravo/charlie because the batch halted.
    const applyCalls = readStageCalls(harness.records.apply);
    expect(applyCalls.length).toBe(0);

    // Partial summary is still written so the operator can drill in.
    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({ failed: 1 });
  });

  it("stage-5 exit 2 (already-scored without --replace-existing) is classified as skipped, not failed, and does NOT abort the batch", () => {
    const harness = setupHarness({
      slugs: ["alpha", "bravo"],
      apply: {
        perSlug: {
          alpha: {
            exitCode: 2,
            stdoutPayload: {
              ok: false,
              entrySlug: "alpha",
              reason: "already_scored",
            },
          },
        },
      },
    });
    tempDirs.push(harness.tempDir);

    // No --continue-on-error: skipped docs must not abort the batch.
    const result = runOrchestrator(batchArgs(harness), harness.env);
    expect(
      result.status,
      `stdout: ${result.stdout}\nstderr: ${result.stderr}`,
    ).toBe(0);

    // Both docs reached stage 5 (alpha skipped, bravo applied).
    expect(readStageCalls(harness.records.apply).length).toBe(2);

    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({
      processed: 2,
      ready: 1,
      skipped: 1,
      failed: 0,
    });
    const docs = summary.documents as Array<Record<string, unknown>>;
    const alpha = docs.find((d) => d.entrySlug === "alpha");
    expect(alpha?.status).toBe("skipped");
  });

  it("--replace-existing is forwarded to stage 5 only (not to earlier stages)", () => {
    const harness = setupHarness({ slugs: ["alpha"] });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      batchArgs(harness, ["--replace-existing"]),
      harness.env,
    );
    expect(result.status).toBe(0);

    const applyCalls = readStageCalls(harness.records.apply);
    expect(applyCalls.length).toBe(1);
    expect(applyCalls[0].argv).toContain("--replace-existing");

    // The earlier stages must NOT see --replace-existing — it is a stage-5
    // semantic only and forwarding it elsewhere is a bug.
    for (const stage of ["extract", "verify", "worksheet"] as const) {
      const calls = readStageCalls(harness.records[stage]);
      for (const call of calls) {
        expect(call.argv).not.toContain("--replace-existing");
      }
    }
  });

  it("--limit caps the number of processed docs to the first N sorted by filename", () => {
    const harness = setupHarness({
      slugs: ["alpha", "bravo", "charlie", "delta"],
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      batchArgs(harness, ["--limit", "2"]),
      harness.env,
    );
    expect(result.status).toBe(0);

    // Only the first two docs (sorted) reached the extract stage.
    const extractCalls = readStageCalls(harness.records.extract);
    expect(extractCalls.length).toBe(2);

    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({ processed: 2, ready: 2 });
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs.map((d) => d.entrySlug)).toEqual(["alpha", "bravo"]);
  });

  it("--entry restricts processing to the single document matching that slug", () => {
    const harness = setupHarness({
      slugs: ["alpha", "bravo", "charlie"],
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      batchArgs(harness, ["--entry", "bravo"]),
      harness.env,
    );
    expect(result.status).toBe(0);

    // Only bravo was processed end-to-end.
    expect(readStageCalls(harness.records.extract).length).toBe(1);
    expect(readStageCalls(harness.records.apply).length).toBe(1);

    const summary = readSummary(harness.outputDir);
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs.length).toBe(1);
    expect(docs[0].entrySlug).toBe("bravo");
  });

  it("docs skipped by stage 1 (no_match / ambiguous_match) are counted as skipped, not failed", () => {
    const harness = setupHarness({
      slugs: ["alpha"],
      // Override the stage-1 match payload to report one matched and one
      // ambiguous skip.
      matchOverride: {
        inputDir: "tmp/dummy",
        dryRun: false,
        matches: [
          {
            documentPath: "tmp/dummy/alpha.md",
            entrySlug: "alpha",
            entryName: "alpha",
            entryId: 1000,
            matchedVia: ["filename"],
          },
        ],
        skipped: [
          {
            documentPath: "tmp/dummy/zeta.md",
            reason: "ambiguous_match",
            candidates: ["zeta-one", "zeta-two"],
          },
        ],
        summary: { discovered: 2, matched: 1, skipped: 1 },
      },
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(batchArgs(harness), harness.env);
    expect(result.status).toBe(0);

    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({
      processed: 1,
      ready: 1,
      skipped: 1,
      failed: 0,
    });
  });

  it("stage-5 post-check failure (exit 3) is classified as failed with failedStage='apply'", () => {
    const harness = setupHarness({
      slugs: ["alpha"],
      apply: {
        perSlug: {
          alpha: {
            exitCode: 3,
            stdoutPayload: {
              ok: false,
              postCheckFailed: true,
              entrySlug: "alpha",
              reason: "trustScoreStatus is 'pending', expected 'ready'",
            },
          },
        },
      },
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(batchArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({ ready: 0, failed: 1 });
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].status).toBe("failed");
    expect(docs[0].failedStage).toBe("apply");
    expect(docs[0].exitCode).toBe(3);
  });

  it("pre-flight: unreadable --input-dir exits with non-zero code and never invokes any stage", () => {
    if (!existsSync(orchestratorPath)) {
      expect.fail(`Orchestrator entrypoint missing: ${orchestratorPath}`);
    }
    const tempDir = makeProjectTempDir("score-batch-preflight-");
    tempDirs.push(tempDir);
    const snapshotPath = writeSnapshot(tempDir, []);
    const outputDir = join(tempDir, "out");

    // No shims set — if the orchestrator gets past pre-flight, the run will
    // crash because the env vars are unset; either way the assertion below
    // must hold (no successful exit, no DB writes).
    const result = spawnSync(
      "bash",
      [
        orchestratorPath,
        "--input-dir",
        join(tempDir, "does-not-exist"),
        "--catalog-snapshot-file",
        snapshotPath,
        "--api-base-url",
        "http://api.local",
        "--output-dir",
        outputDir,
      ],
      {
        cwd: projectDir,
        encoding: "utf8",
        env: { ...process.env } as Record<string, string>,
      },
    );

    expect(result.status).not.toBe(0);
  });

  it("per-document artifact directory contains a status.json describing the doc outcome", () => {
    const harness = setupHarness({
      slugs: ["alpha"],
      apply: {
        perSlug: {
          alpha: {
            exitCode: 1,
            stdoutPayload: {
              ok: false,
              entrySlug: "alpha",
              reason: "synthetic DB failure",
            },
          },
        },
      },
    });
    tempDirs.push(harness.tempDir);

    runOrchestrator(
      batchArgs(harness, ["--continue-on-error"]),
      harness.env,
    );

    // Find the per-doc artifact directory under outputDir (the runner may
    // nest it under a batchId subdir).
    const candidates: string[] = [];
    const stack = [harness.outputDir];
    while (stack.length > 0) {
      const dir = stack.pop();
      if (dir === undefined || !existsSync(dir)) {
        continue;
      }
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (name === "status.json") {
          candidates.push(full);
        } else if (
          existsSync(full) &&
          readdirSync(harness.outputDir).length > 0
        ) {
          try {
            const stat = readFileSync(full, "utf8");
            // not a directory — skip
            void stat;
          } catch {
            stack.push(full);
          }
        }
      }
    }
    // Best-effort discovery: at least one status.json must exist somewhere
    // under the batch output directory.
    const found = findStatusJson(harness.outputDir);
    expect(found.length).toBeGreaterThan(0);
    const status = JSON.parse(readFileSync(found[0], "utf8")) as Record<
      string,
      unknown
    >;
    expect(status.entrySlug).toBe("alpha");
    expect(status.status).toBe("failed");
  });

  it("rejects an unknown option with non-zero exit (CLI usage)", () => {
    if (!existsSync(orchestratorPath)) {
      expect.fail(`Orchestrator entrypoint missing: ${orchestratorPath}`);
    }
    const result = spawnSync(
      "bash",
      [orchestratorPath, "--input-dir", "/tmp/x", "--definitely-not-a-flag"],
      {
        cwd: projectDir,
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.status).toBe(64);
  });

  it("rejects a non-numeric --limit value with exit 64", () => {
    if (!existsSync(orchestratorPath)) {
      expect.fail(`Orchestrator entrypoint missing: ${orchestratorPath}`);
    }
    const result = spawnSync(
      "bash",
      [
        orchestratorPath,
        "--input-dir",
        "/tmp/x",
        "--catalog-snapshot-file",
        "/tmp/x.json",
        "--api-base-url",
        "http://api.local",
        "--output-dir",
        "/tmp/out",
        "--limit",
        "not-a-number",
      ],
      {
        cwd: projectDir,
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(64);
  });

  it("rejects a negative --limit value with exit 64", () => {
    if (!existsSync(orchestratorPath)) {
      expect.fail(`Orchestrator entrypoint missing: ${orchestratorPath}`);
    }
    const result = spawnSync(
      "bash",
      [
        orchestratorPath,
        "--input-dir",
        "/tmp/x",
        "--catalog-snapshot-file",
        "/tmp/x.json",
        "--api-base-url",
        "http://api.local",
        "--output-dir",
        "/tmp/out",
        "--limit",
        "-1",
      ],
      {
        cwd: projectDir,
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(64);
  });

  it("requires --output-dir with exit 64", () => {
    if (!existsSync(orchestratorPath)) {
      expect.fail(`Orchestrator entrypoint missing: ${orchestratorPath}`);
    }
    const result = spawnSync(
      "bash",
      [
        orchestratorPath,
        "--input-dir",
        "/tmp/x",
        "--catalog-snapshot-file",
        "/tmp/x.json",
        "--api-base-url",
        "http://api.local",
      ],
      {
        cwd: projectDir,
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(64);
  });

  it("requires --api-base-url for non-dry-run invocations (exit 64)", () => {
    const harness = setupHarness({ slugs: ["alpha"] });
    tempDirs.push(harness.tempDir);

    const result = spawnSync(
      "bash",
      [
        orchestratorPath,
        "--input-dir",
        harness.inputDir,
        "--catalog-snapshot-file",
        harness.snapshotPath,
        "--output-dir",
        harness.outputDir,
      ],
      {
        cwd: projectDir,
        encoding: "utf8",
        env: { ...process.env, ...harness.env } as Record<string, string>,
      },
    );
    expect(result.status).toBe(64);
  });

  it("does NOT require --api-base-url when --dry-run is set", () => {
    const harness = setupHarness({ slugs: ["alpha"] });
    tempDirs.push(harness.tempDir);

    const result = spawnSync(
      "bash",
      [
        orchestratorPath,
        "--input-dir",
        harness.inputDir,
        "--catalog-snapshot-file",
        harness.snapshotPath,
        "--output-dir",
        harness.outputDir,
        "--dry-run",
      ],
      {
        cwd: projectDir,
        encoding: "utf8",
        env: { ...process.env, ...harness.env } as Record<string, string>,
      },
    );
    expect(
      result.status,
      `stdout: ${result.stdout}\nstderr: ${result.stderr}`,
    ).toBe(0);
  });

  it("--accessed-date is forwarded to stages 2 (extract) and 3 (verify), and NOT to stage 5 (apply)", () => {
    const harness = setupHarness({ slugs: ["alpha"] });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      batchArgs(harness, ["--accessed-date", "2026-01-15"]),
      harness.env,
    );
    expect(result.status).toBe(0);

    const extractCalls = readStageCalls(harness.records.extract);
    const verifyCalls = readStageCalls(harness.records.verify);
    const applyCalls = readStageCalls(harness.records.apply);

    expect(extractCalls.length).toBe(1);
    expect(extractCalls[0].argv).toContain("--accessed-date");
    expect(extractCalls[0].argv).toContain("2026-01-15");

    expect(verifyCalls.length).toBe(1);
    expect(verifyCalls[0].argv).toContain("--accessed-date");
    expect(verifyCalls[0].argv).toContain("2026-01-15");

    // Stage 5 has no notion of accessed-date; forwarding it would be wrong.
    expect(applyCalls.length).toBe(1);
    expect(applyCalls[0].argv).not.toContain("--accessed-date");
  });

  it("--php is forwarded to stage 5 only", () => {
    const harness = setupHarness({ slugs: ["alpha"] });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(
      batchArgs(harness, ["--php", "/usr/local/bin/php8.3"]),
      harness.env,
    );
    expect(result.status).toBe(0);

    const applyCalls = readStageCalls(harness.records.apply);
    expect(applyCalls.length).toBe(1);
    expect(applyCalls[0].argv).toContain("--php");
    expect(applyCalls[0].argv).toContain("/usr/local/bin/php8.3");

    // Earlier stages must not see --php — it's a stage-5 wrapper concern.
    for (const stage of ["extract", "verify", "worksheet"] as const) {
      const calls = readStageCalls(harness.records[stage]);
      for (const call of calls) {
        expect(call.argv).not.toContain("--php");
        expect(call.argv).not.toContain("/usr/local/bin/php8.3");
      }
    }
  });

  it("stage-4 (worksheet) failure classifies the doc as failed with failedStage='worksheet'", () => {
    const harness = setupHarness({
      slugs: ["alpha"],
      worksheet: {
        perSlug: {
          alpha: {
            exitCode: 65,
            stdoutPayload: { ok: false, error: "worksheet stage failed" },
          },
        },
      },
    });
    tempDirs.push(harness.tempDir);

    const result = runOrchestrator(batchArgs(harness), harness.env);
    expect(result.status).not.toBe(0);

    // Stage 5 must not run when stage 4 fails.
    expect(readStageCalls(harness.records.apply).length).toBe(0);

    const summary = readSummary(harness.outputDir);
    expect(summary.counts).toMatchObject({ ready: 0, failed: 1 });
    const docs = summary.documents as Array<Record<string, unknown>>;
    expect(docs[0].status).toBe("failed");
    expect(docs[0].failedStage).toBe("worksheet");
    expect(docs[0].exitCode).toBe(65);
  });
});

function findStatusJson(root: string): string[] {
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
      // readdirSync of a file throws; we use that as a directory test.
      try {
        const sub = readdirSync(full);
        // it's a directory
        stack.push(full);
        if (name === "" && sub.length === 0) {
          // unreachable
        }
      } catch {
        if (name === "status.json") {
          out.push(full);
        }
      }
    }
  }
  return out;
}
