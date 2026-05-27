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
  "../scripts/lib/vet-deep-research-extract-codex.mjs",
  import.meta.url,
);
const runnerPath = resolve("scripts/vet-deep-research-extract-codex-run.mjs");
const shellScriptPath = resolve("scripts/vet-deep-research-extract-codex.sh");

const beginSentinel = "BEGIN_VET_EXTRACT_JSON";
const endSentinel = "END_VET_EXTRACT_JSON";

type CatalogEntry = {
  slug: string;
  name: string;
  website_url?: string | null;
};

type ExtractorOptions = {
  accessedDate?: string;
  documentPath?: string;
};

type LibModule = {
  VET_EXTRACT_BEGIN_SENTINEL: string;
  VET_EXTRACT_END_SENTINEL: string;
  BANNED_EXTRACT_KEYS: readonly string[];
  buildExtractionPrompt: (input: {
    document: string;
    entry: CatalogEntry;
    documentPath?: string;
    accessedDate?: string;
  }) => string;
  parseExtractionResponse: (
    rawResponse: string,
    document: string,
    entry: CatalogEntry,
    options?: ExtractorOptions,
  ) => Record<string, unknown>;
  getExtractorCommand: (name: unknown) => { command: string; args: string[] };
};

const baselineEntry: CatalogEntry = {
  slug: "proton-mail",
  name: "Proton Mail",
  website_url: "https://proton.me",
};

const sourceUrls = Object.freeze({
  founders: "https://proton.me/about/team",
  transparency: "https://proton.me/blog/transparency-report-2025",
  audit: "https://proton.me/blog/security-audit-2024",
  warrant: "https://proton.me/legal/transparency",
  outage: "https://status.proton.me/incidents/2024-09-outage",
  contract: "https://proton.me/legal/terms",
  ad: "https://proton.me/blog/privacy-by-design",
  governance: "https://proton.foundation/about",
});

const baselineDocumentBody = [
  "# Proton Mail — deep research",
  "",
  "## Founders",
  `Source: ${sourceUrls.founders}`,
  "",
  "## Transparency reports",
  `Source: ${sourceUrls.transparency}`,
  "",
  "## Security audits",
  `Source: ${sourceUrls.audit}`,
  "",
  "## Warrant canary",
  `Source: ${sourceUrls.warrant}`,
  "",
  "## Past outage",
  `Source: ${sourceUrls.outage}`,
  "",
  "## Contract terms",
  `Source: ${sourceUrls.contract}`,
  "",
  "## Privacy-by-design",
  `Source: ${sourceUrls.ad}`,
  "",
  "## Governance — Proton Foundation",
  `Source: ${sourceUrls.governance}`,
  "",
].join("\n");

function modelResponse(payload: unknown): string {
  return [
    "Extraction complete.",
    beginSentinel,
    JSON.stringify(payload, null, 2),
    endSentinel,
  ].join("\n");
}

function makePositiveSignal(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    signal_key: "founders-known",
    dimension: "governance",
    amount: 2,
    text_en: "Founders publicly known and from CERN-affiliated background.",
    source_url: sourceUrls.founders,
    ...overrides,
  };
}

function makeReservation(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    reservation_key: "2024-outage",
    severity: "minor",
    event_date: "2024-09-12",
    is_structural: false,
    text_en: "Day-long outage in September 2024.",
    source_url: sourceUrls.outage,
    ...overrides,
  };
}

function validPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    positive_signals: [
      makePositiveSignal({
        signal_key: "founders-known",
        dimension: "governance",
        amount: 2,
        text_en: "Founders publicly known.",
        source_url: sourceUrls.founders,
      }),
      makePositiveSignal({
        signal_key: "regular-transparency-reports",
        dimension: "governance",
        amount: 2,
        text_en: "Quarterly transparency reports published since 2018.",
        source_url: sourceUrls.transparency,
      }),
      makePositiveSignal({
        signal_key: "independent-audits",
        dimension: "security",
        amount: 3,
        text_en: "External audit by Securitum in 2024.",
        source_url: sourceUrls.audit,
      }),
      makePositiveSignal({
        signal_key: "warrant-canary",
        dimension: "governance",
        amount: 1,
        text_en: "Active warrant canary on legal page.",
        source_url: sourceUrls.warrant,
      }),
    ],
    reservations: [
      makeReservation({
        reservation_key: "2024-outage",
        severity: "minor",
        event_date: "2024-09-12",
        is_structural: false,
        text_en: "Day-long outage in September 2024.",
        source_url: sourceUrls.outage,
      }),
      makeReservation({
        reservation_key: "contract-binding-arbitration",
        severity: "moderate",
        is_structural: true,
        text_en: "Binding-arbitration clause in standard contract.",
        source_url: sourceUrls.contract,
      }),
      makeReservation({
        reservation_key: "ad-surveillance-history",
        severity: "minor",
        is_structural: false,
        text_en: "Previously used third-party fingerprinting (since removed).",
        source_url: sourceUrls.ad,
      }),
      makeReservation({
        reservation_key: "foundation-governance",
        severity: "minor",
        is_structural: false,
        text_en: "Proton Foundation board composition not fully transparent.",
        source_url: sourceUrls.governance,
      }),
    ],
    scoring_metadata: {
      base_class_override: null,
      is_ad_surveillance: false,
      deep_research_path: "tmp/deep/proton-mail.md",
      worksheet_path: null,
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
  document: string,
  entry: CatalogEntry,
  mockResponse: string,
): {
  documentPath: string;
  entryPath: string;
  mockResponsePath: string;
} {
  const documentPath = join(tempDir, "document.md");
  const entryPath = join(tempDir, "entry.json");
  const mockResponsePath = join(tempDir, "response.txt");

  writeFileSync(documentPath, document, "utf8");
  writeFileSync(entryPath, JSON.stringify(entry), "utf8");
  writeFileSync(mockResponsePath, mockResponse, "utf8");

  return { documentPath, entryPath, mockResponsePath };
}

function runRunner(
  args: string[],
  options: { cwd?: string } = {},
) {
  return spawnSync(process.execPath, [runnerPath, ...args], {
    cwd: options.cwd ?? projectDir,
    encoding: "utf8",
  });
}

function parseJsonObject(stdout: string): Record<string, unknown> {
  return JSON.parse(stdout) as Record<string, unknown>;
}

async function loadLibModule(): Promise<LibModule> {
  return (await import(libModuleUrl.href)) as LibModule;
}

describe("vet-deep-research-extract-codex prompt builder", () => {
  it("embeds entry context, sentinels, and an explicit threshold requirement", async () => {
    const { buildExtractionPrompt } = await loadLibModule();

    const prompt = buildExtractionPrompt({
      document: baselineDocumentBody,
      entry: baselineEntry,
      documentPath: "tmp/deep/proton-mail.md",
      accessedDate: "2026-05-27",
    });

    expect(prompt).toContain("proton-mail");
    expect(prompt).toContain("Proton Mail");
    expect(prompt).toContain(beginSentinel);
    expect(prompt).toContain(endSentinel);
    expect(prompt).toMatch(/positive.?signals/i);
    expect(prompt).toMatch(/reservations/i);
    expect(prompt).toMatch(/scoring.?metadata/i);
    expect(prompt).toMatch(/source.?url/i);
    expect(prompt).toMatch(/(?:at least|≥|>=).{0,10}(?:8|eight)/i);
    expect(prompt).toMatch(/(?:at least|≥|>=).{0,10}(?:4|four)/i);
  });

  it("forbids stored trust-score fields in the prompt", async () => {
    const { buildExtractionPrompt } = await loadLibModule();

    const prompt = buildExtractionPrompt({
      document: baselineDocumentBody,
      entry: baselineEntry,
    });

    expect(prompt).toMatch(/trust.?score/i);
  });

  it("rejects a non-object entry", async () => {
    const { buildExtractionPrompt } = await loadLibModule();

    expect(() =>
      buildExtractionPrompt({
        document: baselineDocumentBody,
        entry: null as unknown as CatalogEntry,
      }),
    ).toThrow(/entry|object/i);
  });

  it("rejects a non-string document", async () => {
    const { buildExtractionPrompt } = await loadLibModule();

    expect(() =>
      buildExtractionPrompt({
        document: null as unknown as string,
        entry: baselineEntry,
      }),
    ).toThrow(/document|string/i);
  });
});

describe("vet-deep-research-extract-codex parser — happy paths", () => {
  it("parses a complete extraction payload (≥4 positive_signals, ≥1 reservation, ≥8 total)", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const result = parseExtractionResponse(
      modelResponse(validPayload()),
      baselineDocumentBody,
      baselineEntry,
    );

    expect(Array.isArray(result.positive_signals)).toBe(true);
    expect((result.positive_signals as unknown[]).length).toBe(4);
    expect(Array.isArray(result.reservations)).toBe(true);
    expect((result.reservations as unknown[]).length).toBe(4);
    expect(typeof result.scoring_metadata).toBe("object");
    expect(result.scoring_metadata).not.toBeNull();
  });

  it("accepts an empty scoring_metadata object (no overrides applied)", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const result = parseExtractionResponse(
      modelResponse(validPayload({ scoring_metadata: {} })),
      baselineDocumentBody,
      baselineEntry,
    );

    expect(result.scoring_metadata).toEqual({});
  });
});

describe("vet-deep-research-extract-codex parser — readiness threshold", () => {
  it("rejects when total rows < 8 even if individual minima pass", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    (payload.positive_signals as unknown[]) = (
      payload.positive_signals as unknown[]
    ).slice(0, 4);
    (payload.reservations as unknown[]) = (
      payload.reservations as unknown[]
    ).slice(0, 3);

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/threshold|total|8/i);
  });

  it("rejects when positive_signals < 4", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    (payload.positive_signals as unknown[]) = (
      payload.positive_signals as unknown[]
    ).slice(0, 3);

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/positive_signals|threshold|4/i);
  });

  it("rejects when reservations = 0", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload({ reservations: [] });

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/reservations|threshold|1/i);
  });
});

describe("vet-deep-research-extract-codex parser — source URL provenance", () => {
  it("rejects a positive_signal missing source_url", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    delete signals[0].source_url;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/source_url|founders-known/i);
  });

  it("rejects a reservation missing source_url", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    delete reservations[0].source_url;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/source_url|2024-outage/i);
  });

  it("rejects a source_url that does not appear as a substring of the document", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].source_url = "https://proton.me/about/this-page-does-not-exist";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/source_url|document|provenance|substring/i);
  });

  it("rejects a private-host source_url even if it appears in the document", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const privateUrl = "http://192.168.1.1/internal";
    const doc = `${baselineDocumentBody}\nLeaked-internal: ${privateUrl}\n`;
    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].source_url = privateUrl;

    expect(() =>
      parseExtractionResponse(modelResponse(payload), doc, baselineEntry),
    ).toThrow(/url|host|source_url/i);
  });

  it("rejects a non-http source_url", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].source_url = "ftp://proton.me/files";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/url|source_url|http/i);
  });
});

describe("vet-deep-research-extract-codex parser — forbidden trust-score fields", () => {
  const bannedKeys = [
    "trustScore",
    "trust_score",
    "trustScoreStatus",
    "trust_score_status",
  ];

  for (const banned of bannedKeys) {
    it(`rejects ${banned} at the top level`, async () => {
      const { parseExtractionResponse } = await loadLibModule();

      const payload = validPayload({ [banned]: 8.5 });

      expect(() =>
        parseExtractionResponse(
          modelResponse(payload),
          baselineDocumentBody,
          baselineEntry,
        ),
      ).toThrow(new RegExp(`${banned}|banned`, "i"));
    });

    it(`rejects ${banned} nested inside scoring_metadata`, async () => {
      const { parseExtractionResponse } = await loadLibModule();

      const payload = validPayload();
      const meta = payload.scoring_metadata as Record<string, unknown>;
      meta[banned] = 9.1;

      expect(() =>
        parseExtractionResponse(
          modelResponse(payload),
          baselineDocumentBody,
          baselineEntry,
        ),
      ).toThrow(new RegExp(`${banned}|banned`, "i"));
    });
  }

  it("rejects a bogus score_override field inside scoring_metadata", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const meta = payload.scoring_metadata as Record<string, unknown>;
    meta.score_override = 9;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/score_override|scoring_metadata|allow/i);
  });

  it("exports a banned-keys denylist that pins every documented forbidden identifier", async () => {
    const { BANNED_EXTRACT_KEYS } = await loadLibModule();

    expect(Array.isArray(BANNED_EXTRACT_KEYS)).toBe(true);
    for (const key of [
      "trustScore",
      "trust_score",
      "trustScoreStatus",
      "trust_score_status",
    ]) {
      expect(BANNED_EXTRACT_KEYS).toContain(key);
    }
    for (const allowed of [
      "positive_signals",
      "reservations",
      "scoring_metadata",
    ]) {
      expect(BANNED_EXTRACT_KEYS).not.toContain(allowed);
    }
  });

  it("rejects a banned key buried deep inside a positive_signals row", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].trust_score = 8;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/trust_score|banned/i);
  });
});

describe("vet-deep-research-extract-codex parser — enum validation", () => {
  it("rejects an unknown positive_signal dimension", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].dimension = "speed";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/dimension|speed|enum/i);
  });

  it("rejects an unknown reservation severity", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[0].severity = "critical";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/severity|critical|enum/i);
  });

  it("rejects an unknown base_class_override on scoring_metadata", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const meta = payload.scoring_metadata as Record<string, unknown>;
    meta.base_class_override = "asia";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/base_class_override|asia|enum/i);
  });

  it("rejects an invalid penalty_tier on a reservation", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[0].penalty_tier = "speed";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/penalty_tier|speed|dimension|enum/i);
  });

  it("rejects an invalid ISO event_date on a reservation", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[0].event_date = "2024/09/12";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/event_date|date|iso/i);
  });
});

describe("vet-deep-research-extract-codex parser — row shape and key uniqueness", () => {
  it("rejects duplicate signal_key within positive_signals", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[1].signal_key = signals[0].signal_key;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/duplicate|signal_key/i);
  });

  it("rejects duplicate reservation_key within reservations", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[1].reservation_key = reservations[0].reservation_key;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/duplicate|reservation_key/i);
  });

  it("rejects a positive_signal with a non-positive amount", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].amount = 0;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/amount|positive/i);
  });

  it("rejects a positive_signal with missing text_en", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    delete signals[0].text_en;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/text_en|required/i);
  });

  it("rejects a reservation missing is_structural (NOT NULL in the DB)", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    delete reservations[0].is_structural;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/is_structural|required|boolean/i);
  });

  it("rejects unknown fields inside a positive_signal row", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].extra_field = "unexpected";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/extra_field|unknown|allow/i);
  });

  it("rejects unknown top-level keys", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload({ rogue_block: { foo: "bar" } });

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/rogue_block|unknown|allow/i);
  });

  it("rejects an invalid signal_key (uppercase letters)", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].signal_key = "FoundersKnown";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/signal_key|regex|invalid/i);
  });
});

describe("vet-deep-research-extract-codex parser — sentinel handling", () => {
  it("rejects a response missing the sentinels", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    expect(() =>
      parseExtractionResponse(
        JSON.stringify(validPayload()),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(new RegExp(`sentinel|${beginSentinel}`, "i"));
  });

  it("rejects a response with duplicate sentinel-delimited blocks", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const doubled = [
      beginSentinel,
      JSON.stringify(validPayload()),
      endSentinel,
      beginSentinel,
      JSON.stringify(validPayload()),
      endSentinel,
    ].join("\n");

    expect(() =>
      parseExtractionResponse(doubled, baselineDocumentBody, baselineEntry),
    ).toThrow(/exactly one|duplicate|sentinel/i);
  });

  it("rejects malformed JSON inside the sentinel delimiters", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const broken = [beginSentinel, "{ not valid json", endSentinel].join("\n");

    expect(() =>
      parseExtractionResponse(broken, baselineDocumentBody, baselineEntry),
    ).toThrow(/json|invalid/i);
  });

  it("rejects a sentinel block whose top-level value is an array (not an object)", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const arrayBlock = [beginSentinel, JSON.stringify([1, 2, 3]), endSentinel].join(
      "\n",
    );

    expect(() =>
      parseExtractionResponse(arrayBlock, baselineDocumentBody, baselineEntry),
    ).toThrow(/object|payload/i);
  });
});

describe("vet-deep-research-extract-codex command lookup", () => {
  it("returns the codex command config and rejects unknown extractor names", async () => {
    const { getExtractorCommand } = await loadLibModule();

    const config = getExtractorCommand("codex");

    expect(config.command).toBe("codex");
    expect(config.args).toEqual(["exec"]);
    expect(() => getExtractorCommand("opencode")).toThrow(/unknown/i);
    expect(() => getExtractorCommand("minimax")).toThrow(/unknown/i);
  });

  it("returns a fresh args array so callers cannot mutate the frozen config", async () => {
    const { getExtractorCommand } = await loadLibModule();

    const config = getExtractorCommand("codex");
    config.args.push("--evil");

    const reloaded = getExtractorCommand("codex");
    expect(reloaded.args).toEqual(["exec"]);
  });
});

describe("vet-deep-research-extract-codex runner CLI", () => {
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

  it("emits a parsed extraction payload when Codex output is mocked", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        "2026-05-27",
      ]);

      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      const parsed = parseJsonObject(result.stdout);

      expect(parsed.entrySlug).toBe("proton-mail");
      expect(parsed.proposed).toBeDefined();
      const proposed = parsed.proposed as Record<string, unknown>;
      expect(Array.isArray(proposed.positive_signals)).toBe(true);
      expect((proposed.positive_signals as unknown[]).length).toBe(4);
      expect(Array.isArray(proposed.reservations)).toBe(true);
      expect((proposed.reservations as unknown[]).length).toBe(4);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when extraction is below threshold", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const tooFew = validPayload();
      (tooFew.positive_signals as unknown[]) = (
        tooFew.positive_signals as unknown[]
      ).slice(0, 3);

      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(tooFew),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
      ]);

      expect(result.status).not.toBe(0);
      expect(result.status).not.toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/threshold|positive_signals|4/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when a row is missing source_url", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const missing = validPayload();
      const signals = missing.positive_signals as Record<string, unknown>[];
      delete signals[0].source_url;

      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(missing),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
      ]);

      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/source_url|founders-known/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when a forbidden trust-score field is present", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload({ trust_score: 8.5 })),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
      ]);

      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/trust_score|banned/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when a source_url is not present in the document", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const fabricated = validPayload();
      const signals = fabricated.positive_signals as Record<string, unknown>[];
      signals[0].source_url = "https://proton.me/about/this-page-does-not-exist";

      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(fabricated),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
      ]);

      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/source_url|document|provenance|substring/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("--dry-run sets dryRun: true on the emitted payload", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--dry-run",
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.dryRun).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("accepts --entry-json as an inline alternative to --entry-file", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const documentPath = join(tempDir, "document.md");
      const mockResponsePath = join(tempDir, "response.txt");

      writeFileSync(documentPath, baselineDocumentBody, "utf8");
      writeFileSync(
        mockResponsePath,
        modelResponse(validPayload()),
        "utf8",
      );

      const result = runRunner([
        "--document-file",
        documentPath,
        "--entry-json",
        JSON.stringify(baselineEntry),
        "--mock-response-file",
        mockResponsePath,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.entrySlug).toBe("proton-mail");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when --mock-response-file points at a missing file (simulates codex failure)", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );
      const missingPath = join(tempDir, "does-not-exist.txt");

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        missingPath,
      ]);

      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toBe("");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects a value-bearing flag that has no value (e.g. --document-file with nothing after)", () => {
    const result = runRunner(["--document-file"]);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/requires|value|document-file/i);
  });

  it("rejects malformed --entry-json with a usage error", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const documentPath = join(tempDir, "document.md");
      const mockResponsePath = join(tempDir, "response.txt");

      writeFileSync(documentPath, baselineDocumentBody, "utf8");
      writeFileSync(
        mockResponsePath,
        modelResponse(validPayload()),
        "utf8",
      );

      const result = runRunner([
        "--document-file",
        documentPath,
        "--entry-json",
        "{not json",
        "--mock-response-file",
        mockResponsePath,
      ]);

      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/json|usage|entry/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("vet-deep-research-extract-codex bash entrypoint", () => {
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

  it.skipIf(!scriptExists)(
    "supports --help without invoking node with required inputs",
    () => {
      const result = spawnSync("bash", [shellScriptPath, "--help"], {
        cwd: projectDir,
        encoding: "utf8",
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/usage/i);
    },
  );

  it.skipIf(!scriptExists)(
    "exits with usage error code 64 when invoked with no arguments",
    () => {
      const result = spawnSync("bash", [shellScriptPath], {
        cwd: projectDir,
        encoding: "utf8",
      });

      expect(result.status).toBe(64);
    },
  );

  it.skipIf(!scriptExists)(
    "exits with usage error code 64 when an unknown option is supplied",
    () => {
      const result = spawnSync(
        "bash",
        [shellScriptPath, "--no-such-flag"],
        { cwd: projectDir, encoding: "utf8" },
      );

      expect(result.status).toBe(64);
      expect(result.stderr).toMatch(/unknown/i);
    },
  );
});

describe("vet-deep-research-extract-codex parser — scoring_metadata branches", () => {
  it("rejects scoring_metadata as an array", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload({ scoring_metadata: [] });

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/scoring_metadata|object/i);
  });

  it("rejects scoring_metadata as null", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload({ scoring_metadata: null });

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/scoring_metadata|object/i);
  });

  it("rejects is_ad_surveillance when it is a string instead of a boolean", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const meta = payload.scoring_metadata as Record<string, unknown>;
    meta.is_ad_surveillance = "yes";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/is_ad_surveillance|boolean/i);
  });

  it("rejects an empty-string deep_research_path on scoring_metadata", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const meta = payload.scoring_metadata as Record<string, unknown>;
    meta.deep_research_path = "   ";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/deep_research_path|string/i);
  });

  it("rejects a non-string worksheet_path on scoring_metadata", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const meta = payload.scoring_metadata as Record<string, unknown>;
    meta.worksheet_path = 42;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/worksheet_path|string/i);
  });

  it("accepts a fully populated scoring_metadata with all optional fields", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload({
      scoring_metadata: {
        base_class_override: "eu",
        is_ad_surveillance: true,
        deep_research_path: "tmp/deep/proton-mail.md",
        worksheet_path: "tmp/worksheets/proton-mail.md",
      },
    });

    const result = parseExtractionResponse(
      modelResponse(payload),
      baselineDocumentBody,
      baselineEntry,
    );

    expect((result.scoring_metadata as Record<string, unknown>).base_class_override).toBe(
      "eu",
    );
    expect(
      (result.scoring_metadata as Record<string, unknown>).is_ad_surveillance,
    ).toBe(true);
  });
});

describe("vet-deep-research-extract-codex parser — additional row validation", () => {
  it("rejects a reservation with a non-positive penalty_amount", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[0].penalty_amount = 0;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/penalty_amount|positive/i);
  });

  it("rejects a reservation with a string penalty_amount", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[0].penalty_amount = "5";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/penalty_amount|positive|number/i);
  });

  it("rejects an event_date that is well-formed ISO but not a real calendar date (2024-02-30)", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[0].event_date = "2024-02-30";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/event_date|date|iso/i);
  });

  it("rejects an empty-string text_de on a positive_signal", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const signals = payload.positive_signals as Record<string, unknown>[];
    signals[0].text_de = "   ";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/text_de|string|null/i);
  });

  it("rejects an empty-string text_de on a reservation", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload();
    const reservations = payload.reservations as Record<string, unknown>[];
    reservations[0].text_de = "";

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/text_de|string|null/i);
  });

  it("rejects a missing required top-level positive_signals key", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload() as Record<string, unknown>;
    delete payload.positive_signals;

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/positive_signals|required/i);
  });

  it("rejects positive_signals when it is an object instead of an array", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    const payload = validPayload({ positive_signals: { not: "an array" } });

    expect(() =>
      parseExtractionResponse(
        modelResponse(payload),
        baselineDocumentBody,
        baselineEntry,
      ),
    ).toThrow(/positive_signals|array/i);
  });
});

describe("vet-deep-research-extract-codex parser — guard preconditions", () => {
  it("throws when document is not a string", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    expect(() =>
      parseExtractionResponse(
        modelResponse(validPayload()),
        null as unknown as string,
        baselineEntry,
      ),
    ).toThrow(/document|string/i);
  });

  it("throws when entry is not a plain object", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    expect(() =>
      parseExtractionResponse(
        modelResponse(validPayload()),
        baselineDocumentBody,
        [] as unknown as CatalogEntry,
      ),
    ).toThrow(/entry|object/i);
  });

  it("throws on an empty raw response", async () => {
    const { parseExtractionResponse } = await loadLibModule();

    expect(() =>
      parseExtractionResponse("", baselineDocumentBody, baselineEntry),
    ).toThrow(/non-empty|response/i);
  });
});

describe("vet-deep-research-extract-codex getExtractorCommand — additional inputs", () => {
  it("normalizes the extractor name case-insensitively", async () => {
    const { getExtractorCommand } = await loadLibModule();

    expect(getExtractorCommand("CODEX").command).toBe("codex");
    expect(getExtractorCommand("  Codex  ").args).toEqual(["exec"]);
  });

  it("rejects null and undefined extractor names", async () => {
    const { getExtractorCommand } = await loadLibModule();

    expect(() => getExtractorCommand(null)).toThrow(/unknown/i);
    expect(() => getExtractorCommand(undefined)).toThrow(/unknown/i);
  });
});

describe("vet-deep-research-extract-codex runner CLI — additional coverage", () => {
  it("fails with usage code 64 when neither --entry-file nor --entry-json is supplied", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const documentPath = join(tempDir, "document.md");
      writeFileSync(documentPath, baselineDocumentBody, "utf8");

      const result = runRunner([
        "--document-file",
        documentPath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/entry/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails with usage code 64 when BOTH --entry-file and --entry-json are supplied", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--entry-json",
        JSON.stringify(baselineEntry),
        "--mock-response-file",
        inputs.mockResponsePath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/entry|exactly one/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails with usage code 64 when the entry JSON is missing a slug", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const documentPath = join(tempDir, "document.md");
      const mockResponsePath = join(tempDir, "response.txt");

      writeFileSync(documentPath, baselineDocumentBody, "utf8");
      writeFileSync(mockResponsePath, modelResponse(validPayload()), "utf8");

      const result = runRunner([
        "--document-file",
        documentPath,
        "--entry-json",
        JSON.stringify({ name: "Only name, no slug" }),
        "--mock-response-file",
        mockResponsePath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/slug/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails with usage code 64 when --document-file points at a missing path", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );
      const missingDocPath = join(tempDir, "does-not-exist.md");

      const result = runRunner([
        "--document-file",
        missingDocPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/document-file|ENOENT|no such file/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("echoes --accessed-date on the emitted payload when provided", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
        "--accessed-date",
        "2026-05-27",
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.accessedDate).toBe("2026-05-27");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("omits accessedDate from the emitted payload when --accessed-date is absent", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );

      const result = runRunner([
        "--document-file",
        inputs.documentPath,
        "--entry-file",
        inputs.entryPath,
        "--mock-response-file",
        inputs.mockResponsePath,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect("accessedDate" in parsed).toBe(false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("accepts --document-file=<path> equals-form flags", () => {
    const tempDir = makeProjectTempDir("vet-extract-codex-");

    try {
      const inputs = writeRunnerInputs(
        tempDir,
        baselineDocumentBody,
        baselineEntry,
        modelResponse(validPayload()),
      );

      const result = runRunner([
        `--document-file=${inputs.documentPath}`,
        `--entry-file=${inputs.entryPath}`,
        `--mock-response-file=${inputs.mockResponsePath}`,
      ]);

      expect(result.status).toBe(0);
      const parsed = parseJsonObject(result.stdout);
      expect(parsed.entrySlug).toBe("proton-mail");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects unexpected positional arguments with usage code 64", () => {
    const result = runRunner(["bare-positional"]);

    expect(result.status).toBe(64);
    expect(result.stdout).toBe("");
    expect(result.stderr).toMatch(/positional|unexpected/i);
  });
});

describe("vet-deep-research-extract-codex bash entrypoint — additional coverage", () => {
  const scriptExists = existsSync(shellScriptPath);

  it.skipIf(!scriptExists)(
    "forwards mocked extraction inputs to the runner end-to-end",
    () => {
      const tempDir = makeProjectTempDir("vet-extract-codex-bash-");

      try {
        const inputs = writeRunnerInputs(
          tempDir,
          baselineDocumentBody,
          baselineEntry,
          modelResponse(validPayload()),
        );

        const result = spawnSync(
          "bash",
          [
            shellScriptPath,
            "--document-file",
            inputs.documentPath,
            "--entry-file",
            inputs.entryPath,
            "--mock-response-file",
            inputs.mockResponsePath,
          ],
          { cwd: projectDir, encoding: "utf8" },
        );

        expect(result.status).toBe(0);
        const parsed = parseJsonObject(result.stdout);
        expect(parsed.entrySlug).toBe("proton-mail");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    },
  );

  it.skipIf(!scriptExists)(
    "exits 64 when a value-bearing flag is supplied without a value",
    () => {
      const result = spawnSync(
        "bash",
        [shellScriptPath, "--document-file"],
        { cwd: projectDir, encoding: "utf8" },
      );

      expect(result.status).toBe(64);
      expect(result.stderr).toMatch(/requires|value|document-file/i);
    },
  );
});
