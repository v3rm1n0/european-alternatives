import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const projectDir = resolve(".");
const libModuleUrl = new URL(
  "../scripts/lib/vet-deep-research-worksheet.mjs",
  import.meta.url,
);
const runnerPath = resolve("scripts/vet-deep-research-worksheet-run.mjs");
const shellScriptPath = resolve("scripts/vet-deep-research-worksheet.sh");

const ACCESSED_DATE = "2026-05-27";
const ENTRY_SLUG = "proton-mail";
const DOCUMENT_PATH = "tmp/deep/proton-mail.md";

type LibModule = {
  WORKSHEET_SCHEMA_VERSION: number;
  DEFAULT_OUTPUT_DIR: string;
  BANNED_WORKSHEET_KEYS: readonly string[];
  buildWorksheetMarkdown: (
    handoff: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => string;
  buildEmittedMetadata: (
    handoff: Record<string, unknown>,
    worksheetPath: string,
    options?: Record<string, unknown>,
  ) => Record<string, unknown>;
  resolveWorksheetPath: (
    outputDir: string,
    entrySlug: string,
  ) => { worksheetPath: string; absoluteWorksheetPath: string };
  validateHandoff: (handoff: unknown) => void;
  validateEntrySlug: (slug: unknown) => void;
};

async function loadLibModule(): Promise<LibModule> {
  return (await import(libModuleUrl.href)) as LibModule;
}

function verifierBlock(
  url: string,
  key: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    source_title: `Source for ${key}`,
    source_url: url,
    accessed_at: ACCESSED_DATE,
    supporting_quote: `Quote from page confirming ${key}.`,
    verification_note: `Page confirms the ${key} claim.`,
    ...overrides,
  };
}

function acceptedPositive(
  key: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    row: {
      signal_key: key,
      dimension: "governance",
      amount: 2,
      text_en: `Positive signal: ${key}.`,
      text_de: null,
      source_url: `https://example.com/${key}`,
    },
    verifier: verifierBlock(`https://example.com/${key}`, key),
    ...overrides,
  };
}

function acceptedReservation(
  key: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    row: {
      reservation_key: key,
      severity: "minor",
      event_date: "2024-09-12",
      penalty_tier: null,
      penalty_amount: null,
      is_structural: false,
      text_en: `Reservation: ${key}.`,
      text_de: null,
      source_url: `https://example.com/${key}`,
    },
    verifier: verifierBlock(`https://example.com/${key}`, key),
    ...overrides,
  };
}

/**
 * Verified handoff shape matching the stage-3 verifier output.
 *
 * 5 positive_signals + 4 reservations + scoring_metadata = baseline.
 */
function baselineHandoff(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: 1,
    entrySlug: ENTRY_SLUG,
    documentPath: DOCUMENT_PATH,
    accessedDate: ACCESSED_DATE,
    dryRun: false,
    thresholdCheck: {
      totalAcceptedRows: 9,
      acceptedPositiveSignals: 5,
      acceptedReservations: 4,
      passed: true,
      thresholds: {
        minTotalRows: 8,
        minPositiveSignals: 4,
        minReservations: 1,
      },
    },
    accepted: {
      positive_signals: [
        acceptedPositive("founders-known"),
        acceptedPositive("regular-transparency-reports"),
        acceptedPositive("independent-audits"),
        acceptedPositive("warrant-canary"),
        acceptedPositive("long-uptime-history"),
      ],
      reservations: [
        acceptedReservation("2024-outage"),
        acceptedReservation("contract-binding-arbitration"),
        acceptedReservation("ad-surveillance-history"),
        acceptedReservation("foundation-governance"),
      ],
      scoring_metadata: {
        base_class_override: null,
        is_ad_surveillance: false,
        deep_research_path: DOCUMENT_PATH,
        worksheet_path: null,
      },
    },
    rejected: [],
    ...overrides,
  };
}

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(join(tempRoot, prefix));
}

function relativeOutputDir(absoluteTempDir: string): string {
  // The runner must accept paths relative to project CWD; convert absolute
  // tmp/<dir> back to its CWD-relative form to test the resolution code-path.
  const rel = absoluteTempDir.startsWith(projectDir)
    ? absoluteTempDir.slice(projectDir.length).replace(/^\/+/, "")
    : absoluteTempDir;
  return rel;
}

function runRunner(args: string[], options: { cwd?: string; input?: string } = {}) {
  return spawnSync(process.execPath, [runnerPath, ...args], {
    cwd: options.cwd ?? projectDir,
    encoding: "utf8",
    input: options.input,
  });
}

function parseJsonObject(stdout: string): Record<string, unknown> {
  return JSON.parse(stdout) as Record<string, unknown>;
}

describe("vet-deep-research-worksheet — library exports", () => {
  it("pins schemaVersion=1, default output dir, and banned-keys denylist", async () => {
    const lib = await loadLibModule();

    expect(lib.WORKSHEET_SCHEMA_VERSION).toBe(1);
    expect(lib.DEFAULT_OUTPUT_DIR).toMatch(/scoring-worksheets/);
    expect(Array.isArray(lib.BANNED_WORKSHEET_KEYS)).toBe(true);
    for (const key of [
      "trustScore",
      "trust_score",
      "trustScoreStatus",
      "trust_score_status",
    ]) {
      expect(lib.BANNED_WORKSHEET_KEYS).toContain(key);
    }
  });
});

describe("vet-deep-research-worksheet — Markdown rendering (happy path)", () => {
  it("renders every accepted row, its verifier metadata, threshold summary, and 'no trust score stored' note", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const markdown = buildWorksheetMarkdown(baselineHandoff());

    expect(markdown).toContain(ENTRY_SLUG);
    expect(markdown).toContain(DOCUMENT_PATH);
    expect(markdown).toContain(ACCESSED_DATE);

    // Every accepted positive_signal key
    for (const key of [
      "founders-known",
      "regular-transparency-reports",
      "independent-audits",
      "warrant-canary",
      "long-uptime-history",
    ]) {
      expect(markdown).toContain(key);
      expect(markdown).toContain(`https://example.com/${key}`);
      expect(markdown).toContain(`Quote from page confirming ${key}.`);
      expect(markdown).toContain(`Page confirms the ${key} claim.`);
      expect(markdown).toContain(`Source for ${key}`);
    }

    // Every accepted reservation key
    for (const key of [
      "2024-outage",
      "contract-binding-arbitration",
      "ad-surveillance-history",
      "foundation-governance",
    ]) {
      expect(markdown).toContain(key);
    }

    // Threshold summary counts must appear in the rendered output
    expect(markdown).toMatch(/5\b/);
    expect(markdown).toMatch(/4\b/);
    expect(markdown).toMatch(/9\b|total/i);

    // Explicit note that no trust-score value is stored
    expect(markdown).toMatch(/no\s+trust.?score|trust.?score\s+(value\s+)?is\s+not\s+stored/i);
  });

  it("renders rejected rows with their verdict, source URL, and rejection note", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const handoff = baselineHandoff({
      rejected: [
        {
          table: "positive_signals",
          rowKey: "fabricated-row",
          verdict: "contradicts",
          source_url: "https://example.com/bad",
          verification_note: "Page actually says the opposite.",
        },
        {
          table: "reservations",
          rowKey: "stale-reservation",
          verdict: "source-inaccessible",
          source_url: "https://example.com/410",
          verification_note: "HTTP 410 at access time.",
        },
      ],
    });

    const markdown = buildWorksheetMarkdown(handoff);

    expect(markdown).toContain("fabricated-row");
    expect(markdown).toContain("contradicts");
    expect(markdown).toContain("Page actually says the opposite.");
    expect(markdown).toContain("stale-reservation");
    expect(markdown).toContain("source-inaccessible");
    expect(markdown).toContain("HTTP 410 at access time.");
  });

  it("does NOT embed any stored numeric trust-score value alongside the explanatory note", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const markdown = buildWorksheetMarkdown(baselineHandoff());

    // No `trustScore: 8.5`, no `trust_score = 9`, no `**Trust score:** 7` etc.
    expect(markdown).not.toMatch(/trust[_ ]?score\s*[:=]\s*\d/i);
    expect(markdown).not.toMatch(/\*\*\s*trust[_ ]?score\s*[:*]+\s*\d/i);
  });

  it("renders scoring_metadata as REJECTED with the rejection note when the verifier rejected it", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const handoff = baselineHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    delete accepted.scoring_metadata;
    (handoff.rejected as unknown[]) = [
      {
        table: "scoring_metadata",
        rowKey: null,
        verdict: "inconclusive",
        source_url: null,
        verification_note: "Cannot verify metadata claims at this time.",
      },
    ];

    const markdown = buildWorksheetMarkdown(handoff);

    expect(markdown).toMatch(/scoring_metadata/i);
    expect(markdown).toMatch(/rejected|inconclusive/i);
    expect(markdown).toContain("Cannot verify metadata claims at this time.");
  });
});

describe("vet-deep-research-worksheet — Markdown injection guards", () => {
  it("renders multi-line supporting_quote with each line blockquote-prefixed", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const handoff = baselineHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Record<string, unknown>[];
    const verifier = signals[0].verifier as Record<string, unknown>;
    verifier.supporting_quote = "First line of quote.\nSecond line.\nThird line.";

    const markdown = buildWorksheetMarkdown(handoff);

    expect(markdown).toContain("> First line of quote.");
    expect(markdown).toContain("> Second line.");
    expect(markdown).toContain("> Third line.");
  });

  it("neutralises a supporting_quote that tries to inject a heading", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const handoff = baselineHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Record<string, unknown>[];
    const verifier = signals[0].verifier as Record<string, unknown>;
    verifier.supporting_quote = "## Fake Heading Injected\nMore text.";

    const markdown = buildWorksheetMarkdown(handoff);

    // The injected '## Fake Heading' must be quoted, not a real heading.
    // Look for the line where it appears: it should be prefixed with `> `.
    const lines = markdown.split("\n");
    const offendingLine = lines.find((line) =>
      line.includes("Fake Heading Injected"),
    );
    expect(offendingLine).toBeDefined();
    expect(offendingLine!.startsWith("> ")).toBe(true);
  });
});

describe("vet-deep-research-worksheet — handoff validation", () => {
  it("accepts a fully-formed baseline handoff", async () => {
    const { validateHandoff } = await loadLibModule();
    expect(() => validateHandoff(baselineHandoff())).not.toThrow();
  });

  it("rejects a handoff with an unsupported schemaVersion", async () => {
    const { validateHandoff } = await loadLibModule();
    expect(() =>
      validateHandoff(baselineHandoff({ schemaVersion: 2 })),
    ).toThrow(/schemaVersion|version/i);
  });

  it("rejects a handoff missing entrySlug", async () => {
    const { validateHandoff } = await loadLibModule();
    const handoff = baselineHandoff();
    delete (handoff as Record<string, unknown>).entrySlug;
    expect(() => validateHandoff(handoff)).toThrow(/entrySlug|required|missing/i);
  });

  it("rejects a handoff missing accessedDate", async () => {
    const { validateHandoff } = await loadLibModule();
    const handoff = baselineHandoff();
    delete (handoff as Record<string, unknown>).accessedDate;
    expect(() => validateHandoff(handoff)).toThrow(
      /accessedDate|required|missing/i,
    );
  });

  it("rejects a handoff with a banned trust_score key buried inside accepted rows", async () => {
    const { validateHandoff } = await loadLibModule();
    const handoff = baselineHandoff();
    const accepted = handoff.accepted as Record<string, unknown>;
    const signals = accepted.positive_signals as Record<string, unknown>[];
    (signals[0].verifier as Record<string, unknown>).trust_score = 8.5;
    expect(() => validateHandoff(handoff)).toThrow(/trust_score|banned/i);
  });

  it("rejects a handoff with a banned trustScore key at the top level", async () => {
    const { validateHandoff } = await loadLibModule();
    const handoff = baselineHandoff({ trustScore: 7.2 });
    expect(() => validateHandoff(handoff)).toThrow(/trustScore|banned/i);
  });

  it("rejects a non-object handoff", async () => {
    const { validateHandoff } = await loadLibModule();
    expect(() => validateHandoff(null)).toThrow(/object|handoff/i);
    expect(() => validateHandoff("oops")).toThrow(/object|handoff/i);
  });
});

describe("vet-deep-research-worksheet — slug validation", () => {
  it("accepts the canonical lowercase slug", async () => {
    const { validateEntrySlug } = await loadLibModule();
    expect(() => validateEntrySlug("proton-mail")).not.toThrow();
    expect(() => validateEntrySlug("kde")).not.toThrow();
    expect(() => validateEntrySlug("nextcloud-hub")).not.toThrow();
  });

  it("rejects path-traversal in the slug", async () => {
    const { validateEntrySlug } = await loadLibModule();
    expect(() => validateEntrySlug("../etc/passwd")).toThrow(
      /slug|invalid|traversal/i,
    );
    expect(() => validateEntrySlug("..")).toThrow(/slug|invalid/i);
    expect(() => validateEntrySlug("foo/bar")).toThrow(/slug|invalid/i);
    expect(() => validateEntrySlug("foo\\bar")).toThrow(/slug|invalid/i);
  });

  it("rejects empty or whitespace-only slugs", async () => {
    const { validateEntrySlug } = await loadLibModule();
    expect(() => validateEntrySlug("")).toThrow(/slug|invalid|empty|required/i);
    expect(() => validateEntrySlug("   ")).toThrow(/slug|invalid/i);
  });

  it("rejects slugs with uppercase or special characters", async () => {
    const { validateEntrySlug } = await loadLibModule();
    expect(() => validateEntrySlug("Proton Mail")).toThrow(/slug|invalid/i);
    expect(() => validateEntrySlug("proton_mail!")).toThrow(/slug|invalid/i);
  });

  it("rejects null and non-string slugs", async () => {
    const { validateEntrySlug } = await loadLibModule();
    expect(() => validateEntrySlug(null)).toThrow(/slug|string|invalid/i);
    expect(() =>
      validateEntrySlug(123 as unknown as string),
    ).toThrow(/slug|string|invalid/i);
  });
});

describe("vet-deep-research-worksheet — path resolution determinism", () => {
  it("returns the same worksheetPath for repeated calls with the same inputs", async () => {
    const { resolveWorksheetPath } = await loadLibModule();
    const first = resolveWorksheetPath("tmp/scoring-worksheets", ENTRY_SLUG);
    const second = resolveWorksheetPath("tmp/scoring-worksheets", ENTRY_SLUG);
    expect(first.worksheetPath).toBe(second.worksheetPath);
    expect(first.absoluteWorksheetPath).toBe(second.absoluteWorksheetPath);
  });

  it("uses the entry slug as the filename with a .md extension", async () => {
    const { resolveWorksheetPath } = await loadLibModule();
    const { worksheetPath } = resolveWorksheetPath(
      "tmp/scoring-worksheets",
      ENTRY_SLUG,
    );
    expect(worksheetPath).toMatch(new RegExp(`${ENTRY_SLUG}\\.md$`));
  });

  it("rejects an output dir that escapes the project root", async () => {
    const { resolveWorksheetPath } = await loadLibModule();
    expect(() => resolveWorksheetPath("/etc", ENTRY_SLUG)).toThrow(
      /output|outside|escape|project|invalid/i,
    );
    expect(() =>
      resolveWorksheetPath("../../../etc", ENTRY_SLUG),
    ).toThrow(/output|outside|escape|project|invalid/i);
  });
});

describe("vet-deep-research-worksheet — emitted metadata for the DB-write stage", () => {
  it("returns the worksheetPath and schemaVersion needed by stage 5", async () => {
    const { buildEmittedMetadata } = await loadLibModule();

    const metadata = buildEmittedMetadata(
      baselineHandoff(),
      "tmp/scoring-worksheets/proton-mail.md",
      { dryRun: false, wrote: true },
    );

    expect(metadata.schemaVersion).toBe(1);
    expect(metadata.entrySlug).toBe(ENTRY_SLUG);
    expect(metadata.worksheetPath).toBe("tmp/scoring-worksheets/proton-mail.md");
    expect(metadata.dryRun).toBe(false);
    expect(metadata.wrote).toBe(true);

    const summary = metadata.summary as Record<string, unknown>;
    expect(summary.totalAcceptedRows).toBe(9);
    expect(summary.acceptedPositiveSignals).toBe(5);
    expect(summary.acceptedReservations).toBe(4);
    expect(summary.rejectedRows).toBe(0);
  });

  it("marks dryRun and wrote=false in the emitted metadata under dry-run", async () => {
    const { buildEmittedMetadata } = await loadLibModule();

    const metadata = buildEmittedMetadata(
      baselineHandoff(),
      "tmp/scoring-worksheets/proton-mail.md",
      { dryRun: true, wrote: false },
    );

    expect(metadata.dryRun).toBe(true);
    expect(metadata.wrote).toBe(false);
  });

  it("does NOT emit any banned trust-score keys in the metadata", async () => {
    const { buildEmittedMetadata } = await loadLibModule();

    const metadata = buildEmittedMetadata(
      baselineHandoff(),
      "tmp/scoring-worksheets/proton-mail.md",
      { dryRun: false, wrote: true },
    );

    const serialised = JSON.stringify(metadata);
    expect(serialised).not.toMatch(/trust[_]?[sS]core/);
  });
});

describe("vet-deep-research-worksheet runner CLI", () => {
  it("--help prints usage and exits 0", () => {
    const result = runRunner(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/usage/i);
  });

  it("missing required flags exits 64", () => {
    const result = runRunner([]);
    expect(result.status).toBe(64);
    expect(result.stderr).not.toBe("");
  });

  it("rejects unknown options with exit 64", () => {
    const result = runRunner(["--no-such-flag"]);
    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/unknown/i);
  });

  it("rejects a value-bearing flag with no value (exit 64)", () => {
    const result = runRunner(["--verified-action-file"]);
    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/requires|value|verified-action-file/i);
  });

  it("rejects both --verified-action-file and --verified-action-json together (exit 64)", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "handoff.json");
      writeFileSync(handoffPath, JSON.stringify(baselineHandoff()), "utf8");

      const result = runRunner([
        "--verified-action-file",
        handoffPath,
        "--verified-action-json",
        JSON.stringify(baselineHandoff()),
      ]);

      expect(result.status).toBe(64);
      expect(result.stderr).toMatch(/exactly one|both|verified-action/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("writes a worksheet to disk and emits metadata JSON on stdout (happy path)", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      writeFileSync(handoffPath, JSON.stringify(baselineHandoff()), "utf8");

      const outputDir = relativeOutputDir(tempDir);
      const result = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        outputDir,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.entrySlug).toBe(ENTRY_SLUG);
      expect(parsed.dryRun).toBe(false);
      expect(parsed.wrote).toBe(true);
      expect(typeof parsed.worksheetPath).toBe("string");

      // File must exist at the emitted path
      const worksheetPath = parsed.worksheetPath as string;
      const onDisk = resolve(projectDir, worksheetPath);
      expect(existsSync(onDisk)).toBe(true);

      const contents = readFileSync(onDisk, "utf8");
      expect(contents).toContain(ENTRY_SLUG);
      expect(contents).toContain("founders-known");
      expect(contents).toMatch(/no\s+trust.?score|trust.?score\s+(value\s+)?is\s+not\s+stored/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("--dry-run writes no file and emits wrote: false", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      writeFileSync(handoffPath, JSON.stringify(baselineHandoff()), "utf8");

      const outputDir = relativeOutputDir(tempDir);
      const result = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        outputDir,
        "--dry-run",
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.dryRun).toBe(true);
      expect(parsed.wrote).toBe(false);
      expect(typeof parsed.worksheetPath).toBe("string");

      const worksheetPath = parsed.worksheetPath as string;
      const onDisk = resolve(projectDir, worksheetPath);
      expect(existsSync(onDisk)).toBe(false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("accepts --verified-action-json as an inline alternative", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const outputDir = relativeOutputDir(tempDir);
      const result = runRunner([
        "--verified-action-json",
        JSON.stringify(baselineHandoff()),
        "--output-dir",
        outputDir,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.entrySlug).toBe(ENTRY_SLUG);
      expect(parsed.wrote).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits 64 when --verified-action-file points at a missing path", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const result = runRunner([
        "--verified-action-file",
        join(tempDir, "missing.json"),
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/verified-action-file|ENOENT|no such file/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits 64 on malformed --verified-action-json", () => {
    const result = runRunner(["--verified-action-json", "{not json"]);
    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/json|usage|verified-action/i);
  });

  it("fails closed (exit 65) when the handoff has an unsupported schemaVersion", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      writeFileSync(
        handoffPath,
        JSON.stringify(baselineHandoff({ schemaVersion: 2 })),
        "utf8",
      );

      const result = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        relativeOutputDir(tempDir),
      ]);

      expect(result.status).toBe(65);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/schemaVersion|version/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed (exit 65) when the handoff smuggles a banned trust_score key", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      const handoff = baselineHandoff();
      const accepted = handoff.accepted as Record<string, unknown>;
      const signals = accepted.positive_signals as Record<string, unknown>[];
      (signals[0].verifier as Record<string, unknown>).trust_score = 8.5;
      writeFileSync(handoffPath, JSON.stringify(handoff), "utf8");

      const result = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        relativeOutputDir(tempDir),
      ]);

      expect(result.status).toBe(65);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/trust_score|banned/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed (exit 65) when the handoff has a path-traversal entrySlug", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      writeFileSync(
        handoffPath,
        JSON.stringify(baselineHandoff({ entrySlug: "../etc/passwd" })),
        "utf8",
      );

      const result = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        relativeOutputDir(tempDir),
      ]);

      expect(result.status).toBe(65);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/slug|invalid/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits 64 when --output-dir escapes the project root", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      writeFileSync(handoffPath, JSON.stringify(baselineHandoff()), "utf8");

      const result = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        "/etc",
      ]);

      expect([64, 65]).toContain(result.status);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/output|outside|escape|invalid|project/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("overwriting an existing worksheet yields a clean replacement (idempotent re-run)", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      writeFileSync(handoffPath, JSON.stringify(baselineHandoff()), "utf8");

      const outputDir = relativeOutputDir(tempDir);
      const first = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        outputDir,
      ]);
      expect(first.status).toBe(0);

      const firstParsed = parseJsonObject(first.stdout);
      const worksheetPath = firstParsed.worksheetPath as string;
      const onDisk = resolve(projectDir, worksheetPath);

      // Now mutate the handoff: drop one positive_signal. Re-run.
      const handoff = baselineHandoff();
      const accepted = handoff.accepted as Record<string, unknown>;
      (accepted.positive_signals as unknown[]) = (
        accepted.positive_signals as unknown[]
      ).slice(0, 1);
      (handoff.thresholdCheck as Record<string, unknown>).acceptedPositiveSignals = 1;
      writeFileSync(handoffPath, JSON.stringify(handoff), "utf8");

      const second = runRunner([
        "--verified-action-file",
        handoffPath,
        "--output-dir",
        outputDir,
      ]);
      expect(second.status).toBe(0);

      const contents = readFileSync(onDisk, "utf8");
      expect(contents).toContain("founders-known");
      // The rows dropped between the two runs must not still appear.
      expect(contents).not.toContain("regular-transparency-reports");
      expect(contents).not.toContain("warrant-canary");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("vet-deep-research-worksheet — additional coverage", () => {
  it("buildEmittedMetadata forwards documentPath and accessedDate through passthrough", async () => {
    const { buildEmittedMetadata } = await loadLibModule();

    const metadata = buildEmittedMetadata(
      baselineHandoff(),
      "tmp/scoring-worksheets/proton-mail.md",
      { dryRun: false, wrote: true },
    );

    const passthrough = metadata.passthrough as Record<string, unknown>;
    expect(passthrough).toBeDefined();
    expect(passthrough.documentPath).toBe(DOCUMENT_PATH);
    expect(passthrough.accessedDate).toBe(ACCESSED_DATE);
  });

  it("buildEmittedMetadata exposes an absoluteWorksheetPath that resolves under the project root", async () => {
    const { buildEmittedMetadata } = await loadLibModule();

    const metadata = buildEmittedMetadata(
      baselineHandoff(),
      "tmp/scoring-worksheets/proton-mail.md",
      { dryRun: false, wrote: true },
    );

    const abs = metadata.absoluteWorksheetPath as string;
    expect(typeof abs).toBe("string");
    expect(abs.startsWith(projectDir)).toBe(true);
    expect(abs.endsWith("proton-mail.md")).toBe(true);
  });

  it("buildEmittedMetadata.summary.rejectedRows reflects the actual rejected count", async () => {
    const { buildEmittedMetadata } = await loadLibModule();

    const handoff = baselineHandoff({
      rejected: [
        {
          table: "positive_signals",
          rowKey: "row-a",
          verdict: "contradicts",
          source_url: "https://example.com/a",
          verification_note: "Page disagrees.",
        },
        {
          table: "reservations",
          rowKey: "row-b",
          verdict: "source-inaccessible",
          source_url: "https://example.com/b",
          verification_note: "410 Gone.",
        },
        {
          table: "scoring_metadata",
          rowKey: null,
          verdict: "inconclusive",
          source_url: null,
          verification_note: "Cannot determine.",
        },
      ],
    });

    const metadata = buildEmittedMetadata(
      handoff,
      "tmp/scoring-worksheets/proton-mail.md",
      { dryRun: false, wrote: true },
    );

    const summary = metadata.summary as Record<string, unknown>;
    expect(summary.rejectedRows).toBe(3);
    // Accepted counts must still reflect the baseline (rejected is separate).
    expect(summary.acceptedPositiveSignals).toBe(5);
    expect(summary.acceptedReservations).toBe(4);
    expect(summary.totalAcceptedRows).toBe(9);
  });

  it("buildWorksheetMarkdown renders threshold status as FAILED when thresholdCheck.passed is false", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const markdown = buildWorksheetMarkdown(
      baselineHandoff({
        thresholdCheck: {
          totalAcceptedRows: 2,
          acceptedPositiveSignals: 1,
          acceptedReservations: 1,
          passed: false,
          thresholds: {
            minTotalRows: 8,
            minPositiveSignals: 4,
            minReservations: 1,
          },
        },
      }),
    );

    expect(markdown).toMatch(/Status:\s*\*\*FAILED\*\*/);
    expect(markdown).not.toMatch(/Status:\s*\*\*PASSED\*\*/);
  });

  it("buildWorksheetMarkdown renders threshold status as PASSED when thresholdCheck.passed is true", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const markdown = buildWorksheetMarkdown(baselineHandoff());

    expect(markdown).toMatch(/Status:\s*\*\*PASSED\*\*/);
  });

  it("renderRejected groups rejected rows under a per-table heading", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const handoff = baselineHandoff({
      rejected: [
        {
          table: "positive_signals",
          rowKey: "ps-1",
          verdict: "contradicts",
          source_url: "https://example.com/ps1",
          verification_note: "Page disagrees with ps-1.",
        },
        {
          table: "positive_signals",
          rowKey: "ps-2",
          verdict: "source-inaccessible",
          source_url: "https://example.com/ps2",
          verification_note: "ps-2 source 410.",
        },
        {
          table: "reservations",
          rowKey: "res-1",
          verdict: "contradicts",
          source_url: "https://example.com/res1",
          verification_note: "res-1 inverted.",
        },
      ],
    });

    const markdown = buildWorksheetMarkdown(handoff);

    // Each rejected table must have its own subheading.
    expect(markdown).toMatch(/^###\s+positive_signals\s*$/m);
    expect(markdown).toMatch(/^###\s+reservations\s*$/m);

    // Under the positive_signals heading, ps-1 must come before res-1 (grouping
    // must preserve same-table rows together rather than interleaving).
    const psIdx = markdown.indexOf("ps-1");
    const ps2Idx = markdown.indexOf("ps-2");
    const resIdx = markdown.indexOf("res-1");
    expect(psIdx).toBeGreaterThan(-1);
    expect(ps2Idx).toBeGreaterThan(-1);
    expect(resIdx).toBeGreaterThan(-1);
    expect(ps2Idx).toBeGreaterThan(psIdx);
    expect(resIdx).toBeGreaterThan(ps2Idx);
  });

  it("buildWorksheetMarkdown renders '_None._' when there are no accepted positive_signals or reservations", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const handoff = baselineHandoff({
      thresholdCheck: {
        totalAcceptedRows: 0,
        acceptedPositiveSignals: 0,
        acceptedReservations: 0,
        passed: false,
        thresholds: {
          minTotalRows: 8,
          minPositiveSignals: 4,
          minReservations: 1,
        },
      },
      accepted: {
        positive_signals: [],
        reservations: [],
        scoring_metadata: null,
      },
      rejected: [],
    });

    const markdown = buildWorksheetMarkdown(handoff);

    // The positive_signals and reservations sections must each render "_None._".
    expect(markdown).toMatch(
      /##\s+Accepted\s+—\s+positive_signals\s+\(0\)[\s\S]*?_None\._/,
    );
    expect(markdown).toMatch(
      /##\s+Accepted\s+—\s+reservations\s+\(0\)[\s\S]*?_None\._/,
    );
    // scoring_metadata section must report the "no accepted row" note when
    // neither an accepted object nor a rejected row exists.
    expect(markdown).toMatch(/No accepted scoring_metadata row in this run\./);
  });

  it("buildWorksheetMarkdown honours options.entry overrides for name and id", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const markdown = buildWorksheetMarkdown(baselineHandoff(), {
      entry: { name: "Proton Mail (catalog)", id: "ent-9001" },
    });

    expect(markdown).toContain("Proton Mail (catalog)");
    expect(markdown).toContain("ent-9001");
  });

  it("buildWorksheetMarkdown honours options.generatedAt for deterministic test output", async () => {
    const { buildWorksheetMarkdown } = await loadLibModule();

    const stamp = "2026-05-27T12:34:56.000Z";
    const markdown = buildWorksheetMarkdown(baselineHandoff(), {
      generatedAt: stamp,
    });

    expect(markdown).toContain(stamp);
  });
});

describe("vet-deep-research-worksheet bash entrypoint", () => {
  const scriptExists = existsSync(shellScriptPath);

  it.skipIf(!scriptExists)("--help exits 0 and prints usage", () => {
    const result = spawnSync("bash", [shellScriptPath, "--help"], {
      cwd: projectDir,
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/usage/i);
  });

  it.skipIf(!scriptExists)("no args exits 64", () => {
    const result = spawnSync("bash", [shellScriptPath], {
      cwd: projectDir,
      encoding: "utf8",
    });
    expect(result.status).toBe(64);
  });

  it.skipIf(!scriptExists)("uses set -euo pipefail", () => {
    const text = readFileSync(shellScriptPath, "utf8");
    expect(text).toMatch(/set\s+-euo\s+pipefail/);
  });

  it.skipIf(!scriptExists)("delegates to the node runner (no inline rendering)", () => {
    const text = readFileSync(shellScriptPath, "utf8");
    expect(text).toMatch(/vet-deep-research-worksheet-run\.mjs/);
    expect(text).toMatch(/\bexec\s+node\b/);
  });

  it.skipIf(!scriptExists)("forwards a happy-path invocation to the runner end-to-end", () => {
    const tempDir = makeProjectTempDir("vet-worksheet-bash-");
    try {
      const handoffPath = join(tempDir, "verified_scoring_action.json");
      writeFileSync(handoffPath, JSON.stringify(baselineHandoff()), "utf8");
      const outputDir = relativeOutputDir(tempDir);

      const result = spawnSync(
        "bash",
        [
          shellScriptPath,
          "--verified-action-file",
          handoffPath,
          "--output-dir",
          outputDir,
        ],
        { cwd: projectDir, encoding: "utf8" },
      );

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.entrySlug).toBe(ENTRY_SLUG);
      expect(parsed.wrote).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
