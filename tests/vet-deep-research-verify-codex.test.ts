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
  "../scripts/lib/vet-deep-research-verify-codex.mjs",
  import.meta.url,
);
const runnerPath = resolve("scripts/vet-deep-research-verify-codex-run.mjs");
const shellScriptPath = resolve("scripts/vet-deep-research-verify-codex.sh");

const beginSentinel = "BEGIN_VET_VERIFY_JSON";
const endSentinel = "END_VET_VERIFY_JSON";

const ACCESSED_DATE = "2026-05-27";
const ENTRY_SLUG = "proton-mail";
const DOCUMENT_PATH = "tmp/deep/proton-mail.md";

type CatalogEntry = {
  slug: string;
  name: string;
  website_url?: string | null;
};

type LibModule = {
  VET_VERIFY_BEGIN_SENTINEL: string;
  VET_VERIFY_END_SENTINEL: string;
  BANNED_VERIFY_KEYS: readonly string[];
  AUDIT_QUOTE_MAX_LENGTH: number;
  buildScoringVerificationPrompt: (input: {
    extraction: Record<string, unknown>;
    entry: CatalogEntry;
    documentPath?: string;
    documentContent?: string;
    accessedDate?: string;
  }) => string;
  parseScoringVerificationResponse: (
    rawResponse: string,
    extraction: Record<string, unknown>,
    options?: { accessedDate?: string },
  ) => Record<string, unknown>;
  getVerifierCommand: (name: unknown) => { command: string; args: string[] };
};

const baselineEntry: CatalogEntry = {
  slug: ENTRY_SLUG,
  name: "Proton Mail",
  website_url: "https://proton.me",
};

const sourceUrls = Object.freeze({
  founders: "https://proton.me/about/team",
  transparency: "https://proton.me/blog/transparency-report-2025",
  audit: "https://proton.me/blog/security-audit-2024",
  warrant: "https://proton.me/legal/transparency",
  uptime: "https://status.proton.me/history",
  outage: "https://status.proton.me/incidents/2024-09-outage",
  contract: "https://proton.me/legal/terms",
  ad: "https://proton.me/blog/privacy-by-design",
  governance: "https://proton.foundation/about",
});

async function loadLibModule(): Promise<LibModule> {
  return (await import(libModuleUrl.href)) as LibModule;
}

function modelResponse(payload: unknown): string {
  return [
    "Verification complete.",
    beginSentinel,
    JSON.stringify(payload, null, 2),
    endSentinel,
  ].join("\n");
}

function makeProposedPositiveSignal(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    signal_key: "founders-known",
    dimension: "governance",
    amount: 2,
    text_en: "Founders publicly known.",
    text_de: null,
    source_url: sourceUrls.founders,
    ...overrides,
  };
}

function makeProposedReservation(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    reservation_key: "2024-outage",
    severity: "minor",
    event_date: "2024-09-12",
    penalty_tier: null,
    penalty_amount: null,
    is_structural: false,
    text_en: "Day-long outage in September 2024.",
    text_de: null,
    source_url: sourceUrls.outage,
    ...overrides,
  };
}

/**
 * Stage-2-shaped extraction that the verifier accepts as input.
 *
 * Baseline carries 5 positive_signals + 4 reservations = 9 total rows, so a
 * single rejection still leaves the survivors above the (≥4 / ≥1 / ≥8)
 * readiness threshold. Tests that exercise threshold-fail-closed shrink the
 * baseline first.
 */
function baselineExtraction(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    entrySlug: ENTRY_SLUG,
    documentPath: DOCUMENT_PATH,
    dryRun: false,
    accessedDate: ACCESSED_DATE,
    proposed: {
      positive_signals: [
        makeProposedPositiveSignal({
          signal_key: "founders-known",
          dimension: "governance",
          amount: 2,
          text_en: "Founders publicly known.",
          source_url: sourceUrls.founders,
        }),
        makeProposedPositiveSignal({
          signal_key: "regular-transparency-reports",
          dimension: "governance",
          amount: 2,
          text_en: "Quarterly transparency reports published since 2018.",
          source_url: sourceUrls.transparency,
        }),
        makeProposedPositiveSignal({
          signal_key: "independent-audits",
          dimension: "security",
          amount: 3,
          text_en: "External audit by Securitum in 2024.",
          source_url: sourceUrls.audit,
        }),
        makeProposedPositiveSignal({
          signal_key: "warrant-canary",
          dimension: "governance",
          amount: 1,
          text_en: "Active warrant canary on legal page.",
          source_url: sourceUrls.warrant,
        }),
        makeProposedPositiveSignal({
          signal_key: "long-uptime-history",
          dimension: "reliability",
          amount: 1,
          text_en: "Multi-year uptime history with public incident log.",
          source_url: sourceUrls.uptime,
        }),
      ],
      reservations: [
        makeProposedReservation({
          reservation_key: "2024-outage",
          source_url: sourceUrls.outage,
        }),
        makeProposedReservation({
          reservation_key: "contract-binding-arbitration",
          severity: "moderate",
          event_date: null,
          is_structural: true,
          text_en: "Binding-arbitration clause in standard contract.",
          source_url: sourceUrls.contract,
        }),
        makeProposedReservation({
          reservation_key: "ad-surveillance-history",
          severity: "minor",
          event_date: null,
          is_structural: false,
          text_en: "Previously used third-party fingerprinting (since removed).",
          source_url: sourceUrls.ad,
        }),
        makeProposedReservation({
          reservation_key: "foundation-governance",
          severity: "minor",
          event_date: null,
          is_structural: false,
          text_en: "Proton Foundation board composition not fully transparent.",
          source_url: sourceUrls.governance,
        }),
      ],
      scoring_metadata: {
        base_class_override: null,
        is_ad_surveillance: false,
        deep_research_path: DOCUMENT_PATH,
        worksheet_path: null,
      },
    },
    ...overrides,
  };
}

function verifierRecord(
  echoField: "signal_key" | "reservation_key",
  key: string,
  url: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    [echoField]: key,
    verdict: "supports",
    source_title: `Source for ${key}`,
    source_url: url,
    accessed_at: ACCESSED_DATE,
    supporting_quote: `Quote from page confirming ${key}.`,
    verification_note: `Page confirms the ${key} claim.`,
    ...overrides,
  };
}

/**
 * Full "all supports" verifier response matching the baseline extraction.
 */
function fullSupportsVerifier(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const extraction = baselineExtraction();
  const proposed = extraction.proposed as Record<string, unknown>;
  const positiveSignals = proposed.positive_signals as Record<
    string,
    unknown
  >[];
  const reservations = proposed.reservations as Record<string, unknown>[];

  return {
    entrySlug: ENTRY_SLUG,
    accessedDate: ACCESSED_DATE,
    positive_signals: positiveSignals.map((row) =>
      verifierRecord(
        "signal_key",
        row.signal_key as string,
        row.source_url as string,
      ),
    ),
    reservations: reservations.map((row) =>
      verifierRecord(
        "reservation_key",
        row.reservation_key as string,
        row.source_url as string,
      ),
    ),
    scoring_metadata: {
      verdict: "supports",
      verification_note: "Metadata reflects the document accurately.",
    },
    ...overrides,
  };
}

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });

  return mkdtempSync(join(tempRoot, prefix));
}

function writeRunnerInputs(
  tempDir: string,
  extraction: Record<string, unknown>,
  entry: CatalogEntry,
  mockResponse: string,
): {
  extractionPath: string;
  entryPath: string;
  mockResponsePath: string;
} {
  const extractionPath = join(tempDir, "extraction.json");
  const entryPath = join(tempDir, "entry.json");
  const mockResponsePath = join(tempDir, "response.txt");

  writeFileSync(extractionPath, JSON.stringify(extraction), "utf8");
  writeFileSync(entryPath, JSON.stringify(entry), "utf8");
  writeFileSync(mockResponsePath, mockResponse, "utf8");

  return { extractionPath, entryPath, mockResponsePath };
}

function runRunner(args: string[], options: { cwd?: string } = {}) {
  return spawnSync(process.execPath, [runnerPath, ...args], {
    cwd: options.cwd ?? projectDir,
    encoding: "utf8",
  });
}

function parseJsonObject(stdout: string): Record<string, unknown> {
  return JSON.parse(stdout) as Record<string, unknown>;
}

describe("vet-deep-research-verify-codex prompt builder", () => {
  it("embeds entry context, sentinels, and the verifier verdict enum", async () => {
    const { buildScoringVerificationPrompt } = await loadLibModule();

    const prompt = buildScoringVerificationPrompt({
      extraction: baselineExtraction(),
      entry: baselineEntry,
      documentPath: DOCUMENT_PATH,
      accessedDate: ACCESSED_DATE,
    });

    expect(prompt).toContain(ENTRY_SLUG);
    expect(prompt).toContain("Proton Mail");
    expect(prompt).toContain(beginSentinel);
    expect(prompt).toContain(endSentinel);
    expect(prompt).toMatch(/supports/i);
    expect(prompt).toMatch(/contradicts/i);
    expect(prompt).toMatch(/inconclusive/i);
    expect(prompt).toMatch(/source.?inaccessible/i);
    expect(prompt).toMatch(/source.?url/i);
    expect(prompt).toMatch(/supporting.?quote/i);
    expect(prompt).toMatch(/verification.?note/i);
  });

  it("instructs the verifier to fetch each cited URL rather than re-quote the document", async () => {
    const { buildScoringVerificationPrompt } = await loadLibModule();

    const prompt = buildScoringVerificationPrompt({
      extraction: baselineExtraction(),
      entry: baselineEntry,
    });

    // The document is a lead only; the verifier must independently access each source URL.
    expect(prompt).toMatch(/lead|independent|fetch|access|web/i);
  });

  it("forbids stored trust-score fields in the verifier output", async () => {
    const { buildScoringVerificationPrompt } = await loadLibModule();

    const prompt = buildScoringVerificationPrompt({
      extraction: baselineExtraction(),
      entry: baselineEntry,
    });

    expect(prompt).toMatch(/trust.?score/i);
  });

  it("rejects a non-object extraction", async () => {
    const { buildScoringVerificationPrompt } = await loadLibModule();

    expect(() =>
      buildScoringVerificationPrompt({
        extraction: null as unknown as Record<string, unknown>,
        entry: baselineEntry,
      }),
    ).toThrow(/extraction|object/i);
  });

  it("rejects a non-object entry", async () => {
    const { buildScoringVerificationPrompt } = await loadLibModule();

    expect(() =>
      buildScoringVerificationPrompt({
        extraction: baselineExtraction(),
        entry: null as unknown as CatalogEntry,
      }),
    ).toThrow(/entry|object/i);
  });
});

describe("vet-deep-research-verify-codex parser — happy path", () => {
  it("accepts a fully-supports verifier response and returns an admit-only handoff", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const result = parseScoringVerificationResponse(
      modelResponse(fullSupportsVerifier()),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    expect(result.entrySlug).toBe(ENTRY_SLUG);
    expect(result.schemaVersion).toBe(1);

    const accepted = result.accepted as Record<string, unknown>;
    expect(Array.isArray(accepted.positive_signals)).toBe(true);
    expect((accepted.positive_signals as unknown[]).length).toBe(5);
    expect(Array.isArray(accepted.reservations)).toBe(true);
    expect((accepted.reservations as unknown[]).length).toBe(4);
    expect(accepted.scoring_metadata).toBeDefined();

    const rejected = result.rejected as unknown[];
    expect(rejected.length).toBe(0);

    const thresholdCheck = result.thresholdCheck as Record<string, unknown>;
    expect(thresholdCheck.passed).toBe(true);
    expect(thresholdCheck.acceptedPositiveSignals).toBe(5);
    expect(thresholdCheck.acceptedReservations).toBe(4);
    expect(thresholdCheck.totalAcceptedRows).toBe(9);
  });

  it("preserves every DB-row field byte-identical from the extraction onto the accepted row", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const result = parseScoringVerificationResponse(
      modelResponse(fullSupportsVerifier()),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const accepted = result.accepted as Record<string, unknown>;
    const acceptedSignals = accepted.positive_signals as Record<
      string,
      unknown
    >[];
    const first = acceptedSignals[0] as Record<string, unknown>;
    const row = first.row as Record<string, unknown>;

    expect(row.signal_key).toBe("founders-known");
    expect(row.dimension).toBe("governance");
    expect(row.amount).toBe(2);
    expect(row.source_url).toBe(sourceUrls.founders);

    const verifier = first.verifier as Record<string, unknown>;
    expect(verifier.supporting_quote).toBeDefined();
    expect(verifier.source_url).toBe(sourceUrls.founders);
    expect(verifier.accessed_at).toBe(ACCESSED_DATE);
    expect(verifier.verification_note).toBeDefined();
  });
});

describe("vet-deep-research-verify-codex parser — per-AC rejection paths", () => {
  it("rejects a row when its verifier marks the source inaccessible (mocked inaccessible URL)", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].verdict = "source-inaccessible";
    signals[0].verification_note = "HTTP 404 at access time.";
    delete signals[0].supporting_quote;

    const result = parseScoringVerificationResponse(
      modelResponse(response),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const accepted = result.accepted as Record<string, unknown>;
    expect((accepted.positive_signals as unknown[]).length).toBe(4);

    const rejected = result.rejected as Record<string, unknown>[];
    expect(rejected.length).toBe(1);
    expect(rejected[0].table).toBe("positive_signals");
    expect(rejected[0].rowKey).toBe("founders-known");
    expect(rejected[0].verdict).toBe("source-inaccessible");

    const thresholdCheck = result.thresholdCheck as Record<string, unknown>;
    expect(thresholdCheck.passed).toBe(true);
  });

  it("rejects a row when verdict=supports but supporting_quote is missing (mocked unsupported quote)", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    delete signals[0].supporting_quote;

    const result = parseScoringVerificationResponse(
      modelResponse(response),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const accepted = result.accepted as Record<string, unknown>;
    expect((accepted.positive_signals as unknown[]).length).toBe(4);

    const rejected = result.rejected as Record<string, unknown>[];
    expect(rejected.length).toBe(1);
    expect(rejected[0].rowKey).toBe("founders-known");
    expect(rejected[0].verdict).toBe("missing-quote");
  });

  it("rejects a row when verdict=supports but supporting_quote is the empty string", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].supporting_quote = "   ";

    const result = parseScoringVerificationResponse(
      modelResponse(response),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const rejected = result.rejected as Record<string, unknown>[];
    expect(rejected.length).toBe(1);
    expect(rejected[0].verdict).toBe("missing-quote");
  });

  it("rejects a row when the verifier reports contradicts (mocked contradiction)", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const reservations = response.reservations as Record<string, unknown>[];
    reservations[0].verdict = "contradicts";
    reservations[0].verification_note =
      "Page actually states the outage lasted under an hour, not a day.";

    const result = parseScoringVerificationResponse(
      modelResponse(response),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const accepted = result.accepted as Record<string, unknown>;
    expect((accepted.reservations as unknown[]).length).toBe(3);

    const rejected = result.rejected as Record<string, unknown>[];
    expect(rejected.length).toBe(1);
    expect(rejected[0].table).toBe("reservations");
    expect(rejected[0].rowKey).toBe("2024-outage");
    expect(rejected[0].verdict).toBe("contradicts");

    const thresholdCheck = result.thresholdCheck as Record<string, unknown>;
    expect(thresholdCheck.passed).toBe(true);
  });

  it("rejects a row marked unsafe-url", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].verdict = "unsafe-url";
    signals[0].verification_note = "URL resolves to a private-network host.";

    const result = parseScoringVerificationResponse(
      modelResponse(response),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const rejected = result.rejected as Record<string, unknown>[];
    expect(rejected.length).toBe(1);
    expect(rejected[0].verdict).toBe("unsafe-url");
  });

  it("rejects a row marked inconclusive", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].verdict = "inconclusive";

    const result = parseScoringVerificationResponse(
      modelResponse(response),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const rejected = result.rejected as Record<string, unknown>[];
    expect(rejected.length).toBe(1);
    expect(rejected[0].verdict).toBe("inconclusive");
  });
});

describe("vet-deep-research-verify-codex parser — threshold fail-closed", () => {
  it("throws when surviving positive_signals drop below 4 after rejections", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    // Shrink baseline to exactly 4 positives so one rejection drops to 3.
    const extraction = baselineExtraction();
    const proposed = extraction.proposed as Record<string, unknown>;
    (proposed.positive_signals as unknown[]) = (
      proposed.positive_signals as unknown[]
    ).slice(0, 4);

    const response = fullSupportsVerifier();
    response.positive_signals = (
      response.positive_signals as Record<string, unknown>[]
    ).slice(0, 4);
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].verdict = "source-inaccessible";
    delete signals[0].supporting_quote;

    expect(() =>
      parseScoringVerificationResponse(modelResponse(response), extraction, {
        accessedDate: ACCESSED_DATE,
      }),
    ).toThrow(/threshold|positive_signals|4/i);
  });

  it("throws when surviving reservations drop below 1", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const extraction = baselineExtraction();
    const proposed = extraction.proposed as Record<string, unknown>;
    (proposed.positive_signals as unknown[]) = (
      proposed.positive_signals as unknown[]
    ).slice(0, 7); // pad to keep ≥8 with 7 positives + 1 reservation rejected
    // Replace with 7 valid positives
    proposed.positive_signals = [
      makeProposedPositiveSignal({ signal_key: "p1" }),
      makeProposedPositiveSignal({ signal_key: "p2" }),
      makeProposedPositiveSignal({ signal_key: "p3" }),
      makeProposedPositiveSignal({ signal_key: "p4" }),
      makeProposedPositiveSignal({ signal_key: "p5" }),
      makeProposedPositiveSignal({ signal_key: "p6" }),
      makeProposedPositiveSignal({ signal_key: "p7" }),
    ];
    proposed.reservations = [
      makeProposedReservation({ reservation_key: "r1" }),
    ];

    const response: Record<string, unknown> = {
      entrySlug: ENTRY_SLUG,
      accessedDate: ACCESSED_DATE,
      positive_signals: (proposed.positive_signals as Record<string, unknown>[]).map(
        (row) =>
          verifierRecord(
            "signal_key",
            row.signal_key as string,
            row.source_url as string,
          ),
      ),
      reservations: [
        verifierRecord("reservation_key", "r1", sourceUrls.outage, {
          verdict: "contradicts",
        }),
      ],
      scoring_metadata: {
        verdict: "supports",
        verification_note: "ok",
      },
    };

    expect(() =>
      parseScoringVerificationResponse(modelResponse(response), extraction, {
        accessedDate: ACCESSED_DATE,
      }),
    ).toThrow(/threshold|reservations|1/i);
  });

  it("throws when total accepted rows drop below 8 even if per-bucket minima are met", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    // 4 positives + 4 reservations = 8. Reject two and total falls to 6.
    const extraction = baselineExtraction();
    const proposed = extraction.proposed as Record<string, unknown>;
    (proposed.positive_signals as unknown[]) = (
      proposed.positive_signals as unknown[]
    ).slice(0, 4);

    const response = fullSupportsVerifier();
    response.positive_signals = (
      response.positive_signals as Record<string, unknown>[]
    ).slice(0, 4);
    // Reject one positive AND one reservation — drops 4→3 positives so it
    // would already fail by the per-bucket check. To exercise the "total<8"
    // branch specifically, reject two reservations instead.
    response.positive_signals = (
      response.positive_signals as Record<string, unknown>[]
    );
    const reservations = response.reservations as Record<string, unknown>[];
    reservations[0].verdict = "contradicts";
    reservations[1].verdict = "source-inaccessible";
    delete reservations[1].supporting_quote;

    expect(() =>
      parseScoringVerificationResponse(modelResponse(response), extraction, {
        accessedDate: ACCESSED_DATE,
      }),
    ).toThrow(/threshold|total|8/i);
  });
});

describe("vet-deep-research-verify-codex parser — coverage check", () => {
  it("rejects when the verifier omits a row that was in the extraction", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    response.positive_signals = (
      response.positive_signals as Record<string, unknown>[]
    ).slice(0, 4);

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/coverage|missing|long-uptime-history/i);
  });

  it("rejects when the verifier invents a row that was not in the extraction", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals.push(
      verifierRecord("signal_key", "fabricated-row", sourceUrls.founders),
    );

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/coverage|unknown|fabricated-row|extra/i);
  });

  it("rejects when the verifier emits duplicate signal_key records", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[1].signal_key = signals[0].signal_key;

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/duplicate|signal_key/i);
  });
});

describe("vet-deep-research-verify-codex parser — coverage check (symmetric reservations + key shape)", () => {
  it("rejects when the verifier emits duplicate reservation_key records", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const reservations = response.reservations as Record<string, unknown>[];
    reservations[1].reservation_key = reservations[0].reservation_key;

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/duplicate|reservation_key/i);
  });

  it("rejects when the verifier omits a reservation_key that was in the extraction", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    response.reservations = (
      response.reservations as Record<string, unknown>[]
    ).slice(0, 3);

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/coverage|missing|reservation_key|foundation-governance/i);
  });

  it("rejects when the verifier invents a reservation_key that was not in the extraction", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const reservations = response.reservations as Record<string, unknown>[];
    reservations.push(
      verifierRecord(
        "reservation_key",
        "fabricated-reservation",
        sourceUrls.outage,
      ),
    );

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/coverage|unknown|fabricated-reservation|extra/i);
  });

  it("rejects when a signal_key fails the lowercase-slug regex", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].signal_key = "Founders Known!";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/signal_key|invalid|slug/i);
  });

  it("rejects when a reservation_key fails the lowercase-slug regex", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const reservations = response.reservations as Record<string, unknown>[];
    reservations[0].reservation_key = "BAD KEY";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/reservation_key|invalid|slug/i);
  });
});

describe("vet-deep-research-verify-codex parser — top-level payload shape", () => {
  it("rejects a verifier payload missing the scoring_metadata top-level key", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    delete response.scoring_metadata;

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/scoring_metadata|missing|required/i);
  });

  it("rejects a verifier payload that adds an unexpected top-level key", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier({ extra_field: "not allowed" });

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/unexpected|extra_field|top-level/i);
  });

  it("rejects when positive_signals is not an array", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    (response as Record<string, unknown>).positive_signals = {
      "founders-known": "supports",
    };

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/positive_signals|array/i);
  });

  it("rejects when reservations is not an array", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    (response as Record<string, unknown>).reservations = "not-an-array";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/reservations|array/i);
  });

  it("rejects a positive_signals element that is not a plain object", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as unknown[];
    signals[0] = "supports";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/positive_signals|object/i);
  });

  it("rejects when scoring_metadata.verdict is not in the allowed enum", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const meta = response.scoring_metadata as Record<string, unknown>;
    meta.verdict = "maybe-ok";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/scoring_metadata|verdict|enum|maybe-ok/i);
  });
});

describe("vet-deep-research-verify-codex parser — additional private-IP host rejection", () => {
  it("rejects source_url pointing at 192.168.x (LAN private)", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].source_url = "http://192.168.1.1/admin";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/source_url|host|public/i);
  });

  it("rejects source_url pointing at 127.0.0.1 (loopback)", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].source_url = "http://127.0.0.1:8080/internal";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/source_url|host|public/i);
  });

  it("rejects a non-http(s) source_url scheme (file://)", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].source_url = "file:///etc/passwd";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/source_url|host|public/i);
  });
});

describe("vet-deep-research-verify-codex parser — banned keys", () => {
  const bannedKeys = [
    "trustScore",
    "trust_score",
    "trustScoreStatus",
    "trust_score_status",
  ];

  for (const banned of bannedKeys) {
    it(`rejects ${banned} at the top level`, async () => {
      const { parseScoringVerificationResponse } = await loadLibModule();

      const response = fullSupportsVerifier({ [banned]: 8.5 });

      expect(() =>
        parseScoringVerificationResponse(
          modelResponse(response),
          baselineExtraction(),
          { accessedDate: ACCESSED_DATE },
        ),
      ).toThrow(new RegExp(`${banned}|banned`, "i"));
    });
  }

  it("rejects a banned key buried inside scoring_metadata", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const meta = response.scoring_metadata as Record<string, unknown>;
    meta.trust_score = 9.1;

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/trust_score|banned/i);
  });

  it("rejects a banned key buried deep inside a positive_signals verifier row", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].trust_score = 8;

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/trust_score|banned/i);
  });

  it("exports a banned-keys denylist that pins trust-score fields but allows the scoring table names", async () => {
    const { BANNED_VERIFY_KEYS } = await loadLibModule();

    expect(Array.isArray(BANNED_VERIFY_KEYS)).toBe(true);
    for (const key of [
      "trustScore",
      "trust_score",
      "trustScoreStatus",
      "trust_score_status",
    ]) {
      expect(BANNED_VERIFY_KEYS).toContain(key);
    }
    for (const allowed of [
      "positive_signals",
      "reservations",
      "scoring_metadata",
    ]) {
      expect(BANNED_VERIFY_KEYS).not.toContain(allowed);
    }
  });
});

describe("vet-deep-research-verify-codex parser — per-record validation", () => {
  it("rejects a record with an unknown verdict enum value", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].verdict = "maybe";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/verdict|maybe|enum/i);
  });

  it("rejects an invalid source_url (non-public host) on an accepted row", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].source_url = "http://localhost/internal";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/source_url|host|url|public/i);
  });

  it("rejects an invalid source_url (private IP) on an accepted row", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].source_url = "http://10.0.0.1/internal";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/source_url|host|url|public/i);
  });

  it("rejects an accessed_at that disagrees with the run's accessed-date", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].accessed_at = "2020-01-01";

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/accessed_at|date|mismatch/i);
  });

  it("rejects a supporting_quote longer than AUDIT_QUOTE_MAX_LENGTH", async () => {
    const { parseScoringVerificationResponse, AUDIT_QUOTE_MAX_LENGTH } =
      await loadLibModule();

    expect(AUDIT_QUOTE_MAX_LENGTH).toBe(1000);

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    signals[0].supporting_quote = "x".repeat(AUDIT_QUOTE_MAX_LENGTH + 1);

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/quote|length|1000/i);
  });

  it("rejects a missing verification_note on a supports verdict", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const signals = response.positive_signals as Record<string, unknown>[];
    delete signals[0].verification_note;

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/verification_note|required/i);
  });

  it("rejects when verifier.entrySlug differs from the extraction", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier({ entrySlug: "different-product" });

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/entrySlug|slug|mismatch/i);
  });

  it("rejects when verifier.accessedDate differs from the run accessedDate", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier({ accessedDate: "2020-01-01" });

    expect(() =>
      parseScoringVerificationResponse(
        modelResponse(response),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(/accessedDate|date|mismatch/i);
  });
});

describe("vet-deep-research-verify-codex parser — scoring_metadata", () => {
  it("includes scoring_metadata in accepted when its verdict is supports", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const result = parseScoringVerificationResponse(
      modelResponse(fullSupportsVerifier()),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const accepted = result.accepted as Record<string, unknown>;
    expect(accepted.scoring_metadata).toBeDefined();
    const meta = accepted.scoring_metadata as Record<string, unknown>;
    expect(meta.deep_research_path).toBe(DOCUMENT_PATH);
  });

  it("omits scoring_metadata from accepted and pushes a rejection entry when verdict is not supports — but does NOT fail the run on its own", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const response = fullSupportsVerifier();
    const meta = response.scoring_metadata as Record<string, unknown>;
    meta.verdict = "inconclusive";
    meta.verification_note = "Cannot verify metadata claims.";

    const result = parseScoringVerificationResponse(
      modelResponse(response),
      baselineExtraction(),
      { accessedDate: ACCESSED_DATE },
    );

    const accepted = result.accepted as Record<string, unknown>;
    expect(accepted.scoring_metadata).toBeUndefined();

    const rejected = result.rejected as Record<string, unknown>[];
    expect(
      rejected.some((entry) => entry.table === "scoring_metadata"),
    ).toBe(true);

    const thresholdCheck = result.thresholdCheck as Record<string, unknown>;
    expect(thresholdCheck.passed).toBe(true);
  });
});

describe("vet-deep-research-verify-codex parser — sentinel handling", () => {
  it("rejects a response missing the sentinels", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    expect(() =>
      parseScoringVerificationResponse(
        JSON.stringify(fullSupportsVerifier()),
        baselineExtraction(),
        { accessedDate: ACCESSED_DATE },
      ),
    ).toThrow(new RegExp(`sentinel|${beginSentinel}`, "i"));
  });

  it("rejects duplicate sentinel-delimited blocks", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const doubled = [
      beginSentinel,
      JSON.stringify(fullSupportsVerifier()),
      endSentinel,
      beginSentinel,
      JSON.stringify(fullSupportsVerifier()),
      endSentinel,
    ].join("\n");

    expect(() =>
      parseScoringVerificationResponse(doubled, baselineExtraction(), {
        accessedDate: ACCESSED_DATE,
      }),
    ).toThrow(/duplicate|exactly one|sentinel/i);
  });

  it("rejects malformed JSON inside the sentinel delimiters", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const broken = [beginSentinel, "{ not valid json", endSentinel].join("\n");

    expect(() =>
      parseScoringVerificationResponse(broken, baselineExtraction(), {
        accessedDate: ACCESSED_DATE,
      }),
    ).toThrow(/json|invalid/i);
  });

  it("rejects a sentinel block whose top-level value is an array", async () => {
    const { parseScoringVerificationResponse } = await loadLibModule();

    const arrayBlock = [
      beginSentinel,
      JSON.stringify([1, 2, 3]),
      endSentinel,
    ].join("\n");

    expect(() =>
      parseScoringVerificationResponse(arrayBlock, baselineExtraction(), {
        accessedDate: ACCESSED_DATE,
      }),
    ).toThrow(/object|payload/i);
  });
});

describe("vet-deep-research-verify-codex command lookup", () => {
  it("returns the codex command config and rejects unknown verifier names", async () => {
    const { getVerifierCommand } = await loadLibModule();

    const config = getVerifierCommand("codex");

    expect(config.command).toBe("codex");
    expect(config.args).toEqual(["exec"]);
    expect(() => getVerifierCommand("opencode")).toThrow(/unknown/i);
    expect(() => getVerifierCommand("minimax")).toThrow(/unknown/i);
  });

  it("returns a fresh args array so callers cannot mutate the frozen config", async () => {
    const { getVerifierCommand } = await loadLibModule();

    const config = getVerifierCommand("codex");
    config.args.push("--evil");

    const reloaded = getVerifierCommand("codex");
    expect(reloaded.args).toEqual(["exec"]);
  });
});

describe("vet-deep-research-verify-codex runner CLI", () => {
  it("--help prints usage and exits 0", () => {
    const result = runRunner(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/usage/i);
    expect(result.stderr).toBe("");
  });

  it("missing required flags exits with usage code 64", () => {
    const result = runRunner([]);

    expect(result.status).toBe(64);
    expect(result.stderr).not.toBe("");
  });

  it("rejects unknown options before doing any work", () => {
    const result = runRunner(["--no-such-flag"]);

    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/unknown/i);
  });

  it("emits a verified scoring action when verifier output is mocked", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineExtraction(),
        baselineEntry,
        modelResponse(fullSupportsVerifier()),
      );

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);

      expect(parsed.entrySlug).toBe(ENTRY_SLUG);
      expect(parsed.schemaVersion).toBe(1);

      const accepted = parsed.accepted as Record<string, unknown>;
      expect((accepted.positive_signals as unknown[]).length).toBe(5);
      expect((accepted.reservations as unknown[]).length).toBe(4);

      const thresholdCheck = parsed.thresholdCheck as Record<string, unknown>;
      expect(thresholdCheck.passed).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed (exit 65) when surviving rows fall below threshold", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      // 4 positives in extraction; reject one → 3 positives, below threshold.
      const extraction = baselineExtraction();
      const proposed = extraction.proposed as Record<string, unknown>;
      (proposed.positive_signals as unknown[]) = (
        proposed.positive_signals as unknown[]
      ).slice(0, 4);

      const response = fullSupportsVerifier();
      response.positive_signals = (
        response.positive_signals as Record<string, unknown>[]
      ).slice(0, 4);
      const signals = response.positive_signals as Record<string, unknown>[];
      signals[0].verdict = "source-inaccessible";
      delete signals[0].supporting_quote;

      const inputs = writeRunnerInputs(
        tempDir,
        extraction,
        baselineEntry,
        modelResponse(response),
      );

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
      ]);

      expect(result.status).toBe(65);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/threshold|positive_signals|4/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when the verifier emits a banned trust-score field", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineExtraction(),
        baselineEntry,
        modelResponse(fullSupportsVerifier({ trust_score: 8.5 })),
      );

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
      ]);

      expect(result.status).toBe(65);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/trust_score|banned/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("--dry-run sets dryRun: true on the emitted payload", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineExtraction(),
        baselineEntry,
        modelResponse(fullSupportsVerifier()),
      );

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
        "--dry-run",
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.dryRun).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("--output-file writes the handoff JSON to disk in addition to stdout", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineExtraction(),
        baselineEntry,
        modelResponse(fullSupportsVerifier()),
      );
      const outputFile = join(tempDir, "verified_scoring_action.json");

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
        "--output-file",
        outputFile,
      ]);

      expect(result.status).toBe(0);
      expect(existsSync(outputFile)).toBe(true);
      const written = JSON.parse(readFileSync(outputFile, "utf8")) as Record<
        string,
        unknown
      >;
      expect(written.entrySlug).toBe(ENTRY_SLUG);
      expect(written.schemaVersion).toBe(1);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("accepts --extraction-json as an inline alternative to --extraction-file", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const entryPath = join(tempDir, "entry.json");
      const mockResponsePath = join(tempDir, "response.txt");
      writeFileSync(entryPath, JSON.stringify(baselineEntry), "utf8");
      writeFileSync(
        mockResponsePath,
        modelResponse(fullSupportsVerifier()),
        "utf8",
      );

      const result = runRunner([
        "--extraction-json",
        JSON.stringify(baselineExtraction()),
        "--entry-file",
        entryPath,
        "--mock-response-file",
        mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.entrySlug).toBe(ENTRY_SLUG);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails with usage code 64 when --extraction-file points at a missing path", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const entryPath = join(tempDir, "entry.json");
      const mockResponsePath = join(tempDir, "response.txt");
      writeFileSync(entryPath, JSON.stringify(baselineEntry), "utf8");
      writeFileSync(
        mockResponsePath,
        modelResponse(fullSupportsVerifier()),
        "utf8",
      );

      const result = runRunner([
        "--extraction-file",
        join(tempDir, "does-not-exist.json"),
        "--entry-file",
        entryPath,
        "--mock-response-file",
        mockResponsePath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/extraction-file|ENOENT|no such file/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects malformed --extraction-json with a usage error", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const entryPath = join(tempDir, "entry.json");
      const mockResponsePath = join(tempDir, "response.txt");
      writeFileSync(entryPath, JSON.stringify(baselineEntry), "utf8");
      writeFileSync(
        mockResponsePath,
        modelResponse(fullSupportsVerifier()),
        "utf8",
      );

      const result = runRunner([
        "--extraction-json",
        "{not json",
        "--entry-file",
        entryPath,
        "--mock-response-file",
        mockResponsePath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/json|usage|extraction/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects a value-bearing flag that has no value", () => {
    const result = runRunner(["--extraction-file"]);

    expect(result.status).toBe(64);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/requires|value|extraction-file/i);
  });

  it("threads --document-file through to the runner and emits a valid handoff", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineExtraction(),
        baselineEntry,
        modelResponse(fullSupportsVerifier()),
      );
      const documentPath = join(tempDir, "deep-research.md");
      writeFileSync(
        documentPath,
        "# Deep research\n\nLead document content for verifier context.\n",
        "utf8",
      );

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
        "--document-file",
        documentPath,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.entrySlug).toBe(ENTRY_SLUG);
      expect(parsed.schemaVersion).toBe(1);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits 64 with usage error when --document-file points at a missing path", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineExtraction(),
        baselineEntry,
        modelResponse(fullSupportsVerifier()),
      );

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        ACCESSED_DATE,
        "--document-file",
        join(tempDir, "does-not-exist.md"),
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/document-file|ENOENT|no such file/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when the mocked verifier response file is missing (simulates codex failure)", () => {
    const tempDir = makeProjectTempDir("vet-verify-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineExtraction(),
        baselineEntry,
        modelResponse(fullSupportsVerifier()),
      );

      const result = runRunner([
        "--extraction-file",
        inputs.extractionPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        join(tempDir, "does-not-exist.txt"),
      ]);

      expect(result.status).toBe(65);
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toBe("");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("vet-deep-research-verify-codex bash entrypoint", () => {
  const scriptExists = existsSync(shellScriptPath);

  it.skipIf(!scriptExists)(
    "is a Codex-only entrypoint that never shells out to opencode or MiniMax",
    () => {
      const scriptText = readFileSync(shellScriptPath, "utf8");

      expect(scriptText).not.toMatch(/\bopencode\b/);
      expect(scriptText).not.toMatch(/minimax/i);
      expect(scriptText).toMatch(/\bcodex\b/);
    },
  );

  it.skipIf(!scriptExists)(
    "delegates the codex exec invocation to the runner (no inline codex exec call)",
    () => {
      const scriptText = readFileSync(shellScriptPath, "utf8");

      expect(scriptText).not.toMatch(/\bcodex\s+exec\b/);
    },
  );

  it.skipIf(!scriptExists)("supports --help", () => {
    const result = spawnSync("bash", [shellScriptPath, "--help"], {
      cwd: projectDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/usage/i);
  });

  it.skipIf(!scriptExists)("exits 64 with no arguments", () => {
    const result = spawnSync("bash", [shellScriptPath], {
      cwd: projectDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(64);
  });

  it.skipIf(!scriptExists)("exits 64 on an unknown option", () => {
    const result = spawnSync("bash", [shellScriptPath, "--no-such-flag"], {
      cwd: projectDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/unknown/i);
  });

  it.skipIf(!scriptExists)(
    "forwards mocked verifier inputs to the runner end-to-end",
    () => {
      const tempDir = makeProjectTempDir("vet-verify-codex-bash-");

      try {
        const inputs = writeRunnerInputs(
          tempDir,
          baselineExtraction(),
          baselineEntry,
          modelResponse(fullSupportsVerifier()),
        );

        const result = spawnSync(
          "bash",
          [
            shellScriptPath,
            "--extraction-file",
            inputs.extractionPath,
            "--entry-file",
            inputs.entryPath,
            "--mock-response-file",
            inputs.mockResponsePath,
            "--accessed-date",
            ACCESSED_DATE,
          ],
          { cwd: projectDir, encoding: "utf8" },
        );

        expect(result.status).toBe(0);
        const parsed = parseJsonObject(result.stdout);
        expect(parsed.entrySlug).toBe(ENTRY_SLUG);
        expect(parsed.schemaVersion).toBe(1);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    },
  );
});
