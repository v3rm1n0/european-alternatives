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

import { afterEach, describe, expect, it } from "vitest";

import {
  ISSUE_CLASSIFICATION_BEGIN_SENTINEL,
  ISSUE_CLASSIFICATION_END_SENTINEL,
} from "../scripts/lib/classify-issue-codex.mjs";
import {
  RESEARCH_FACT_BEGIN_SENTINEL,
  RESEARCH_FACT_END_SENTINEL,
} from "../scripts/lib/research-fact-codex.mjs";
import {
  VERIFY_FACT_BEGIN_SENTINEL,
  VERIFY_FACT_END_SENTINEL,
} from "../scripts/lib/verify-fact-codex.mjs";

const projectDir = resolve(".");
const orchestratorPath = resolve("scripts/process-suggestion-issue-codex.sh");
const realResearchIssue = resolve("scripts/research-issue-codex.sh");
const realResearchFact = resolve("scripts/research-fact-codex.sh");
const realVerifyFact = resolve("scripts/verify-fact-codex.sh");
const realFinalize = resolve("scripts/finalize-issue-codex.sh");
const SUBPROCESS_E2E_TIMEOUT_MS = 60_000;

// Banned scoring/trust-leak keys lifted from
// scripts/lib/finalize-issue-codex.mjs (BANNED_FINALIZER_KEYS) plus the
// research/verify-stage variants. The E2E layer asserts that none appear in
// *any* generated artifact for any successful path.
const BANNED_LEAK_KEYS = [
  "trustScore",
  "trust_score",
  "trustScoreStatus",
  "trust_score_status",
  "reservations",
  "reservation",
  "positiveSignals",
  "positive_signals",
  "positive_signal",
  "scoringMetadata",
  "scoring_metadata",
] as const;

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(join(tempRoot, prefix));
}

type IssuePayload = {
  number: number;
  title: string;
  body: string;
  comments: unknown[];
  url: string;
};

function defaultIssuePayload(issueNumber: number): IssuePayload {
  return {
    number: issueNumber,
    title: "E2E pipeline test issue",
    body: "Synthetic issue body used by the mocked E2E pipeline tests.",
    comments: [],
    url: `https://github.com/TheMorpheus407/european-alternatives/issues/${String(issueNumber)}`,
  };
}

function classificationMockResponse(
  issueNumber: number,
  action:
    | "new_alternative"
    | "catalog_fact_correction"
    | "unsupported_or_unclear",
  options: { proposedName?: string; targetEntrySlug?: string } = {},
): string {
  const classification: Record<string, unknown> = {
    action,
    reasoning: "synthetic test classification",
  };

  if (action === "new_alternative" && options.proposedName !== undefined) {
    classification.proposedName = options.proposedName;
  }

  if (
    action === "catalog_fact_correction" &&
    options.targetEntrySlug !== undefined
  ) {
    classification.targetEntrySlug = options.targetEntrySlug;
  }

  const payload = {
    issue: { number: issueNumber },
    classification,
  };

  return `${ISSUE_CLASSIFICATION_BEGIN_SENTINEL}\n${JSON.stringify(payload, null, 2)}\n${ISSUE_CLASSIFICATION_END_SENTINEL}\n`;
}

function researchNewAlternativeMockResponse(
  issueNumber: number,
  accessedDate: string,
): string {
  const payload = {
    issue: { number: issueNumber },
    classification: { action: "new_alternative" },
    accessedDate,
    newAlternative: {
      slug: "cryptee-e2e",
      name: "Cryptee",
      description_en: "Estonian E2EE document and photo storage.",
      country_code: "ee",
      website_url: "https://crypt.ee",
      status: "alternative",
      pricing: null,
      is_open_source: null,
      open_source_level: null,
      source_code_url: null,
      self_hostable: null,
      founded_year: null,
      headquarters_city: null,
      license_text: null,
      categories: [{ category_id: "cloud-storage", is_primary: true }],
      tags: null,
      replaces_us: null,
      sources: {
        name: {
          url: "https://crypt.ee/about",
          title: "Cryptee — About",
          accessedDate,
        },
        description_en: {
          url: "https://crypt.ee/about",
          title: "Cryptee — About",
          accessedDate,
        },
        country_code: {
          url: "https://crypt.ee/legal",
          title: "Cryptee — Legal",
          accessedDate,
        },
        website_url: {
          url: "https://crypt.ee/",
          title: "Cryptee",
          accessedDate,
        },
        categories: {
          url: "https://crypt.ee/products",
          title: "Cryptee — Products",
          accessedDate,
        },
      },
    },
  };

  return `${RESEARCH_FACT_BEGIN_SENTINEL}\n${JSON.stringify(payload, null, 2)}\n${RESEARCH_FACT_END_SENTINEL}\n`;
}

function researchFactCorrectionMockResponse(
  issueNumber: number,
  accessedDate: string,
  options: { omitSource?: boolean } = {},
): string {
  const change: Record<string, unknown> = {
    table: "catalog_entries",
    column: "country_code",
    currentValue: "de",
    proposedValue: "fr",
  };

  if (!options.omitSource) {
    change.source = {
      url: "https://element.io/legal",
      title: "Element — Legal",
      accessedDate,
    };
  }

  const payload = {
    issue: { number: issueNumber },
    classification: { action: "catalog_fact_correction" },
    accessedDate,
    factCorrection: {
      targetEntrySlug: "element",
      changes: [change],
    },
  };

  return `${RESEARCH_FACT_BEGIN_SENTINEL}\n${JSON.stringify(payload, null, 2)}\n${RESEARCH_FACT_END_SENTINEL}\n`;
}

function verifyNewAlternativeMockResponse(
  issueNumber: number,
  accessedDate: string,
): string {
  const payload = {
    issue: { number: issueNumber },
    classification: { action: "new_alternative" },
    accessedDate,
    newAlternative: {
      evidence: {
        name: {
          verdict: "supports",
          sourceClass: "independent",
          sourceUrl: "https://en.wikipedia.org/wiki/Cryptee",
          sourceTitle: "Cryptee — Wikipedia",
          accessedDate,
          auditQuote: "Cryptee is an Estonian privacy-focused storage service.",
        },
        description_en: {
          verdict: "supports",
          sourceClass: "independent",
          sourceUrl: "https://en.wikipedia.org/wiki/Cryptee",
          sourceTitle: "Cryptee — Wikipedia",
          accessedDate,
          auditQuote: "Cryptee provides end-to-end encrypted storage.",
        },
        country_code: {
          verdict: "supports",
          sourceClass: "independent",
          sourceUrl: "https://e-estonia.com/cryptee",
          sourceTitle: "e-Estonia: Cryptee",
          accessedDate,
          auditQuote: "Headquartered in Tallinn, Estonia.",
        },
        website_url: {
          verdict: "supports",
          sourceClass: "independent",
          sourceUrl: "https://en.wikipedia.org/wiki/Cryptee",
          sourceTitle: "Cryptee — Wikipedia",
          accessedDate,
          auditQuote: "Their website is reachable at crypt.ee.",
        },
        categories: {
          verdict: "supports",
          sourceClass: "independent",
          sourceUrl: "https://en.wikipedia.org/wiki/Cryptee",
          sourceTitle: "Cryptee — Wikipedia",
          accessedDate,
          auditQuote: "Cryptee is a cloud storage product.",
        },
      },
    },
  };

  return `${VERIFY_FACT_BEGIN_SENTINEL}\n${JSON.stringify(payload, null, 2)}\n${VERIFY_FACT_END_SENTINEL}\n`;
}

function verifyFactCorrectionMockResponse(
  issueNumber: number,
  accessedDate: string,
  options: {
    sameSourceAsResearcher?: boolean;
    inconclusive?: boolean;
  } = {},
): string {
  const sourceUrl = options.sameSourceAsResearcher
    ? "https://element.io/blog/element-fr"
    : "https://societe.com/element-fr";

  const verdict = options.inconclusive ? "inconclusive" : "supports";

  const payload = {
    issue: { number: issueNumber },
    classification: { action: "catalog_fact_correction" },
    accessedDate,
    factCorrection: {
      targetEntrySlug: "element",
      evidence: [
        {
          table: "catalog_entries",
          column: "country_code",
          proposedValue: "fr",
          verdict,
          sourceUrl,
          sourceTitle: "Element — Société.com",
          accessedDate,
          auditQuote: "Element SAS, France.",
        },
      ],
    },
  };

  return `${VERIFY_FACT_BEGIN_SENTINEL}\n${JSON.stringify(payload, null, 2)}\n${VERIFY_FACT_END_SENTINEL}\n`;
}

function catalogSnapshotForNewAlternative(): Record<string, unknown> {
  return {
    categories: [{ id: "cloud-storage", name: "Cloud storage" }],
    countries: [{ code: "ee", name: "Estonia" }],
    entries: [],
  };
}

function catalogSnapshotForFactCorrection(): Record<string, unknown> {
  return {
    categories: [{ id: "messaging", name: "Messaging" }],
    countries: [{ code: "fr", name: "France" }],
    entries: [{ slug: "element", name: "Element" }],
    entry: { slug: "element", name: "Element" },
  };
}

function writeFakeGh(
  tempDir: string,
  options: {
    issueFile: string;
    commentExit: number;
    closeExit: number;
  },
): { fakeGhPath: string; recordPath: string } {
  const fakeGhPath = join(tempDir, "gh");
  const recordPath = join(tempDir, "gh-calls.log");
  writeFileSync(recordPath, "", "utf8");

  const script = `#!/usr/bin/env bash
set -u
RECORD=${JSON.stringify(recordPath)}
ISSUE_FILE=${JSON.stringify(options.issueFile)}
{
  printf 'CALL\\n'
  for arg in "$@"; do
    printf '%s\\n' "$arg"
  done
  prev=""
  for arg in "$@"; do
    if [[ "$prev" == "--body-file" ]]; then
      printf 'BODY_FILE_CONTENT_BEGIN\\n'
      cat "$arg" || true
      printf '\\nBODY_FILE_CONTENT_END\\n'
    fi
    prev="$arg"
  done
} >> "$RECORD"

if [[ "\${1:-}" != "issue" ]]; then
    printf 'EXIT=1 (non-issue subcommand)\\n' >> "$RECORD"
    exit 1
fi

case "\${2:-}" in
    view)
        cat "$ISSUE_FILE"
        printf 'EXIT=0\\n' >> "$RECORD"
        exit 0
        ;;
    comment)
        printf 'EXIT=${String(options.commentExit)}\\n' >> "$RECORD"
        exit ${String(options.commentExit)}
        ;;
    close)
        printf 'EXIT=${String(options.closeExit)}\\n' >> "$RECORD"
        exit ${String(options.closeExit)}
        ;;
    *)
        printf 'EXIT=1 (unhandled subcommand)\\n' >> "$RECORD"
        exit 1
        ;;
esac
`;

  writeFileSync(fakeGhPath, script, "utf8");
  chmodSync(fakeGhPath, 0o755);

  return { fakeGhPath, recordPath };
}

function writeStageWrapper(
  tempDir: string,
  stageName: string,
  realScript: string,
  extraArgs: string[],
): string {
  const wrapperPath = join(tempDir, `wrap-${stageName}.sh`);
  const extras = extraArgs.map((a) => JSON.stringify(a)).join(" ");

  writeFileSync(
    wrapperPath,
    `#!/usr/bin/env bash
exec bash ${JSON.stringify(realScript)} "$@" ${extras}
`,
    "utf8",
  );
  chmodSync(wrapperPath, 0o755);
  return wrapperPath;
}

type ApplyShimOptions = {
  exitCode: number;
  outcomePayload: Record<string, unknown>;
};

function writeApplyShim(
  tempDir: string,
  stageName: string,
  options: ApplyShimOptions,
): { shimPath: string; recordPath: string } {
  const shimPath = join(tempDir, `apply-shim-${stageName}.sh`);
  const recordPath = join(tempDir, `apply-record-${stageName}.log`);
  const outcomePath = join(tempDir, `apply-outcome-${stageName}.json`);

  writeFileSync(recordPath, "", "utf8");
  writeFileSync(outcomePath, JSON.stringify(options.outcomePayload), "utf8");

  writeFileSync(
    shimPath,
    `#!/usr/bin/env bash
set -u
RECORD=${JSON.stringify(recordPath)}
OUTCOME=${JSON.stringify(outcomePath)}
{
  printf 'CALL\\n'
  for arg in "$@"; do
    printf '%s\\n' "$arg"
  done
  printf 'EXIT=${String(options.exitCode)}\\n'
} >> "$RECORD"
# If --dry-run is in the args, emit a dry-run outcome instead.
DRY=0
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY=1
  fi
done
if [[ "$DRY" -eq 1 ]]; then
  # Tag the outcome as dry-run so the finalizer sees it.
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    data.dryRun = true;
    process.stdout.write(JSON.stringify(data));
  ' "$OUTCOME"
else
  cat "$OUTCOME"
fi
exit ${String(options.exitCode)}
`,
    "utf8",
  );
  chmodSync(shimPath, 0o755);

  return { shimPath, recordPath };
}

function runOrchestrator(
  args: string[],
  envOverrides: Record<string, string>,
  pathPrefix?: string,
) {
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    ...envOverrides,
  };
  if (pathPrefix !== undefined) {
    env.PATH = `${pathPrefix}:${process.env.PATH ?? ""}`;
  }
  return spawnSync("bash", [orchestratorPath, ...args], {
    cwd: projectDir,
    encoding: "utf8",
    env,
  });
}

function cleanupIssueDir(issueNumber: number): void {
  rmSync(join(projectDir, "tmp/issues", String(issueNumber)), {
    recursive: true,
    force: true,
  });
}

type GhCall = {
  argv: string[];
  bodyContent: string | null;
  exit: number | null;
};

function readGhCalls(recordPath: string): GhCall[] {
  if (!existsSync(recordPath)) {
    return [];
  }

  const text = readFileSync(recordPath, "utf8");
  const lines = text.split("\n");
  const calls: GhCall[] = [];
  let current: GhCall | null = null;
  let inBody = false;
  let bodyLines: string[] = [];

  for (const line of lines) {
    if (line === "CALL") {
      if (current !== null) {
        if (bodyLines.length > 0) {
          current.bodyContent = bodyLines.join("\n");
        }
        calls.push(current);
      }
      current = { argv: [], bodyContent: null, exit: null };
      inBody = false;
      bodyLines = [];
      continue;
    }
    if (line === "BODY_FILE_CONTENT_BEGIN") {
      inBody = true;
      continue;
    }
    if (line === "BODY_FILE_CONTENT_END") {
      inBody = false;
      continue;
    }
    if (line.startsWith("EXIT=")) {
      if (current !== null) {
        const numericExit = Number.parseInt(line.slice("EXIT=".length), 10);
        current.exit = Number.isNaN(numericExit) ? null : numericExit;
      }
      continue;
    }
    if (inBody) {
      bodyLines.push(line);
      continue;
    }
    if (current !== null && line !== "") {
      current.argv.push(line);
    }
  }

  if (current !== null) {
    if (bodyLines.length > 0) {
      current.bodyContent = bodyLines.join("\n");
    }
    calls.push(current);
  }

  return calls;
}

type ApplyCall = { argv: string[]; exit: number | null };

function readApplyCalls(recordPath: string): ApplyCall[] {
  if (!existsSync(recordPath)) {
    return [];
  }

  const text = readFileSync(recordPath, "utf8");
  const lines = text.split("\n");
  const calls: ApplyCall[] = [];
  let current: ApplyCall | null = null;

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
      const numericExit = Number.parseInt(line.slice("EXIT=".length), 10);
      current.exit = Number.isNaN(numericExit) ? null : numericExit;
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

function assertNoBannedKeysInArtifacts(
  issueNumber: number,
  ghCalls: GhCall[],
): void {
  const issueDir = join(projectDir, "tmp/issues", String(issueNumber));
  if (existsSync(issueDir)) {
    const entries = readdirSync(issueDir);
    for (const name of entries) {
      if (!name.endsWith(".json")) {
        continue;
      }
      const fullPath = join(issueDir, name);
      if (!statSync(fullPath).isFile()) {
        continue;
      }
      const text = readFileSync(fullPath, "utf8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        continue;
      }
      const banned = findBannedKey(parsed);
      expect(banned, `banned key in ${fullPath}`).toBeNull();
    }
  }

  // The finalize success comment legitimately mentions terms like
  // "scoring metadata" and "reservations" in plain English (in the
  // disclaimer line: "no scoring metadata, reservations, or positive
  // signals were created"). The contract we want to enforce is "no
  // scoring **payload** leaked into the body", so we look for the
  // JSON-key-style occurrence of each banned key — either quoted
  // ("trust_score") or followed by `:` ('trust_score:') — not the
  // English word.
  for (const call of ghCalls) {
    if (call.bodyContent === null) {
      continue;
    }
    for (const key of BANNED_LEAK_KEYS) {
      expect(
        call.bodyContent.includes(`"${key}"`),
        `quoted banned key ${JSON.stringify(key)} appears in gh comment body`,
      ).toBe(false);
      expect(
        call.bodyContent.includes(`${key}:`),
        `banned key ${key}: appears as a JSON-style key in gh comment body`,
      ).toBe(false);
    }
  }
}

type HarnessOptions = {
  issueNumber: number;
  classification:
    | "new_alternative"
    | "catalog_fact_correction"
    | "unsupported_or_unclear";
  classificationMock?: string;
  researchMock?: string;
  verifyMock?: string;
  catalogSnapshot?: Record<string, unknown>;
  ghCommentExit?: number;
  ghCloseExit?: number;
  applyExitCode?: number;
  applyOutcome?: Record<string, unknown>;
  applyNewAltExitCode?: number;
  applyNewAltOutcome?: Record<string, unknown>;
  configureNewAlt?: boolean;
};

type Harness = {
  tempDir: string;
  recordPath: string;
  applyRecordPath: string | null;
  applyNewAltRecordPath: string | null;
  env: Record<string, string>;
  pathPrefix: string;
};

function setupPipelineHarness(options: HarnessOptions): Harness {
  const tempDir = makeProjectTempDir("e2e-pipeline-");

  // Issue payload for `gh issue view`.
  const issuePayload = defaultIssuePayload(options.issueNumber);
  const issueFile = join(tempDir, "issue.json");
  writeFileSync(issueFile, JSON.stringify(issuePayload), "utf8");

  // gh shim.
  const { recordPath } = writeFakeGh(tempDir, {
    issueFile,
    commentExit: options.ghCommentExit ?? 0,
    closeExit: options.ghCloseExit ?? 0,
  });

  // Mock response files for each Codex stage.
  const accessedDate = "2026-05-27";
  const classifierMockFile = join(tempDir, "classifier-mock.txt");
  writeFileSync(
    classifierMockFile,
    options.classificationMock ??
      classificationMockResponse(options.issueNumber, options.classification, {
        proposedName:
          options.classification === "new_alternative" ? "Cryptee" : undefined,
        targetEntrySlug:
          options.classification === "catalog_fact_correction"
            ? "element"
            : undefined,
      }),
    "utf8",
  );

  const researchMockFile = join(tempDir, "research-mock.txt");
  writeFileSync(
    researchMockFile,
    options.researchMock ??
      (options.classification === "new_alternative"
        ? researchNewAlternativeMockResponse(options.issueNumber, accessedDate)
        : researchFactCorrectionMockResponse(
            options.issueNumber,
            accessedDate,
          )),
    "utf8",
  );

  const verifyMockFile = join(tempDir, "verify-mock.txt");
  writeFileSync(
    verifyMockFile,
    options.verifyMock ??
      (options.classification === "new_alternative"
        ? verifyNewAlternativeMockResponse(options.issueNumber, accessedDate)
        : verifyFactCorrectionMockResponse(options.issueNumber, accessedDate)),
    "utf8",
  );

  // Catalog snapshot for the research stage.
  const snapshotFile = join(tempDir, "snapshot.json");
  writeFileSync(
    snapshotFile,
    JSON.stringify(
      options.catalogSnapshot ??
        (options.classification === "new_alternative"
          ? catalogSnapshotForNewAlternative()
          : catalogSnapshotForFactCorrection()),
    ),
    "utf8",
  );

  // Wrapper scripts that inject --mock-response-file (+ snapshot for research).
  const researchIssueWrap = writeStageWrapper(
    tempDir,
    "research-issue",
    realResearchIssue,
    ["--mock-response-file", classifierMockFile],
  );
  const researchFactWrap = writeStageWrapper(
    tempDir,
    "research-fact",
    realResearchFact,
    [
      "--mock-response-file",
      researchMockFile,
      "--catalog-snapshot-file",
      snapshotFile,
    ],
  );
  const verifyFactWrap = writeStageWrapper(
    tempDir,
    "verify-fact",
    realVerifyFact,
    ["--mock-response-file", verifyMockFile],
  );
  const finalizeWrap = writeStageWrapper(tempDir, "finalize", realFinalize, []);

  // Apply shims (for both branches).
  const applyOutcome: Record<string, unknown> = options.applyOutcome ?? {
    ok: true,
    issueNumber: options.issueNumber,
    targetEntrySlug: "element",
    dryRun: false,
    changesApplied: [
      {
        table: "catalog_entries",
        op: "update",
        column: "country_code",
        entry_id: 17,
        proposedValue: "fr",
        applied: true,
      },
    ],
    sources: [
      {
        verdict: "supports",
        sourceUrl: "https://societe.com/element-fr",
        sourceTitle: "Element — Société.com",
        accessedDate,
        auditQuote: "Element SAS, France.",
      },
    ],
  };

  const apply = writeApplyShim(tempDir, "fact", {
    exitCode: options.applyExitCode ?? 0,
    outcomePayload: applyOutcome,
  });

  let applyNewAltRecord: string | null = null;
  let applyNewAltShim: string | null = null;
  if (options.configureNewAlt || options.classification === "new_alternative") {
    const newAltOutcome: Record<string, unknown> =
      options.applyNewAltOutcome ?? {
        ok: true,
        issueNumber: options.issueNumber,
        action: "new_alternative",
        dryRun: false,
        entry_id: 4242,
        slug: "cryptee-e2e",
      };
    const applyNewAlt = writeApplyShim(tempDir, "new-alt", {
      exitCode: options.applyNewAltExitCode ?? 0,
      outcomePayload: newAltOutcome,
    });
    applyNewAltRecord = applyNewAlt.recordPath;
    applyNewAltShim = applyNewAlt.shimPath;
  }

  const env: Record<string, string> = {
    EUROALT_RESEARCH_ISSUE_CMD: `bash ${researchIssueWrap}`,
    EUROALT_RESEARCH_FACT_CMD: `bash ${researchFactWrap}`,
    EUROALT_VERIFY_FACT_CMD: `bash ${verifyFactWrap}`,
    EUROALT_APPLY_VERIFIED_CMD: `bash ${apply.shimPath}`,
    EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeWrap}`,
  };

  if (applyNewAltShim !== null) {
    env.EUROALT_APPLY_NEW_ALT_CMD = `bash ${applyNewAltShim}`;
  }

  return {
    tempDir,
    recordPath,
    applyRecordPath: apply.recordPath,
    applyNewAltRecordPath: applyNewAltRecord,
    env,
    pathPrefix: tempDir,
  };
}

function readResultJson(issueNumber: number): Record<string, unknown> {
  const path = join(
    projectDir,
    "tmp/issues",
    String(issueNumber),
    "result.json",
  );
  expect(existsSync(path), `result.json missing at ${path}`).toBe(true);
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("codex pipeline E2E (mocked) — fail-closed safety contract", () => {
  const createdIssueNumbers: number[] = [];

  afterEach(() => {
    for (const n of createdIssueNumbers) {
      cleanupIssueDir(n);
    }
    createdIssueNumbers.length = 0;
  });

  // AC1: new_alternative success — exactly one write, one comment, one close.
  it(
    "AC1: new_alternative happy path writes once, comments once, closes once",
    () => {
      const issueNumber = 11_801;
      createdIssueNumbers.push(issueNumber);
      const harness = setupPipelineHarness({
        issueNumber,
        classification: "new_alternative",
      });

      try {
        const result = runOrchestrator(
          [String(issueNumber)],
          harness.env,
          harness.pathPrefix,
        );
        expect(result.status, `orchestrator stderr: ${result.stderr}`).toBe(0);

        // Exactly one apply call to the new-alternative branch.
        expect(harness.applyNewAltRecordPath).not.toBeNull();
        const applyCalls = readApplyCalls(harness.applyNewAltRecordPath ?? "");
        expect(applyCalls.length).toBe(1);

        // gh: issue view (twice during research+verify if both call it), then
        // exactly one comment then exactly one close.
        const ghCalls = readGhCalls(harness.recordPath);
        const commentCalls = ghCalls.filter((c) => c.argv[1] === "comment");
        const closeCalls = ghCalls.filter((c) => c.argv[1] === "close");
        expect(commentCalls.length).toBe(1);
        expect(closeCalls.length).toBe(1);

        // Order: the comment was recorded before the close (so the audit comment
        // is in place before the issue closes).
        const commentIdx = ghCalls.findIndex((c) => c.argv[1] === "comment");
        const closeIdx = ghCalls.findIndex((c) => c.argv[1] === "close");
        expect(commentIdx).toBeGreaterThanOrEqual(0);
        expect(closeIdx).toBeGreaterThan(commentIdx);

        // The fact-correction apply shim must NOT have been invoked.
        const factApplyCalls = readApplyCalls(harness.applyRecordPath ?? "");
        expect(factApplyCalls.length).toBe(0);

        const parsed = readResultJson(issueNumber);
        expect(parsed.classification).toBe("new_alternative");
        expect(parsed.writes_applied).toBe(true);
        expect(parsed.outcome).toBe("applied");

        assertNoBannedKeysInArtifacts(issueNumber, ghCalls);
      } finally {
        rmSync(harness.tempDir, { recursive: true, force: true });
      }
    },
    SUBPROCESS_E2E_TIMEOUT_MS,
  );

  // AC2: catalog_fact_correction success — exactly one write, comment, close.
  it("AC2: catalog_fact_correction happy path writes once, comments once, closes once", () => {
    const issueNumber = 11_802;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status, `orchestrator stderr: ${result.stderr}`).toBe(0);

      const applyCalls = readApplyCalls(harness.applyRecordPath ?? "");
      expect(applyCalls.length).toBe(1);
      // Apply must have received --verified-action-file pointing to the
      // verifier output.
      const verifiedFileArg = applyCalls[0].argv.find((a) =>
        a.endsWith("verified-action.json"),
      );
      expect(verifiedFileArg).toBeDefined();

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(1);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(1);

      const parsed = readResultJson(issueNumber);
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(true);
      expect(parsed.outcome).toBe("applied");

      assertNoBannedKeysInArtifacts(issueNumber, ghCalls);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // AC3: dry-run for both paths — zero writes, zero comments, zero closes.
  it("AC3a: --dry-run on fact-correction never mutates GH and records dry_run_applied", () => {
    const issueNumber = 11_803;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber), "--dry-run"],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      // gh issue view may still be called, but no comment/close.
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.outcome).toBe("dry_run_applied");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.dryRun).toBe(true);

      assertNoBannedKeysInArtifacts(issueNumber, ghCalls);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  it("AC3b: --dry-run on new_alternative never mutates GH and records dry_run_applied", () => {
    const issueNumber = 11_804;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "new_alternative",
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber), "--dry-run"],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.outcome).toBe("dry_run_applied");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.dryRun).toBe(true);

      assertNoBannedKeysInArtifacts(issueNumber, ghCalls);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // AC4: malformed JSON at each stage → zero downstream writes/comments/closes.
  it("AC4a: malformed classifier JSON fails at stage 1 with no gh mutations", () => {
    const issueNumber = 11_805;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      classificationMock: "not a sentinel-wrapped JSON payload at all",
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      // Apply must not run.
      expect(readApplyCalls(harness.applyRecordPath ?? "").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.writes_applied).toBe(false);
      expect(String(parsed.outcome)).toMatch(/^classifier_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  it("AC4b: malformed researcher JSON fails at stage 2 with no gh mutations", () => {
    const issueNumber = 11_806;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      researchMock: `${RESEARCH_FACT_BEGIN_SENTINEL}\n{ this is not valid json\n${RESEARCH_FACT_END_SENTINEL}\n`,
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      expect(readApplyCalls(harness.applyRecordPath ?? "").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.writes_applied).toBe(false);
      expect(String(parsed.outcome)).toMatch(/^research_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  it("AC4c: malformed verifier JSON fails at stage 3 with no gh mutations", () => {
    const issueNumber = 11_807;
    createdIssueNumbers.push(issueNumber);
    // Build a verifier payload missing required `evidence` array entirely.
    const malformedVerifyMock = `${VERIFY_FACT_BEGIN_SENTINEL}\n${JSON.stringify(
      {
        issue: { number: issueNumber },
        classification: { action: "catalog_fact_correction" },
        accessedDate: "2026-05-27",
        factCorrection: {
          targetEntrySlug: "element",
          // evidence intentionally omitted
        },
      },
    )}\n${VERIFY_FACT_END_SENTINEL}\n`;
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      verifyMock: malformedVerifyMock,
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      expect(readApplyCalls(harness.applyRecordPath ?? "").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.writes_applied).toBe(false);
      expect(String(parsed.outcome)).toMatch(/^verify_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // AC5: missing/unverified source evidence → zero writes, comments, closes.
  it("AC5a: researcher emits a change with no source — research stage rejects", () => {
    const issueNumber = 11_808;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      researchMock: researchFactCorrectionMockResponse(
        issueNumber,
        "2026-05-27",
        { omitSource: true },
      ),
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      expect(readApplyCalls(harness.applyRecordPath ?? "").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.writes_applied).toBe(false);
      expect(String(parsed.outcome)).toMatch(/^research_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  it("AC5b: verifier emits inconclusive verdicts through the retry budget with no mutations", () => {
    const issueNumber = 11_809;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      verifyMock: verifyFactCorrectionMockResponse(issueNumber, "2026-05-27", {
        inconclusive: true,
      }),
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        { ...harness.env, EUROALT_MAX_VERIFICATION_ATTEMPTS: "2" },
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      expect(readApplyCalls(harness.applyRecordPath ?? "").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.outcome).toBe("verification_retries_exhausted");
      expect(
        existsSync(
          join(
            projectDir,
            "tmp/issues",
            String(issueNumber),
            "verification-feedback-1.json",
          ),
        ),
      ).toBe(true);
      expect(
        existsSync(
          join(
            projectDir,
            "tmp/issues",
            String(issueNumber),
            "verification-feedback-2.json",
          ),
        ),
      ).toBe(true);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  it("AC5c: verifier reuses researcher domain — verify stage rejects (same-source)", () => {
    const issueNumber = 11_810;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      verifyMock: verifyFactCorrectionMockResponse(issueNumber, "2026-05-27", {
        sameSourceAsResearcher: true,
      }),
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      expect(readApplyCalls(harness.applyRecordPath ?? "").length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(String(parsed.outcome)).toMatch(/^verify_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // AC6: DB write failure → zero comments, zero closes.
  it("AC6: apply step failure leaves writes_applied=false and never invokes finalize/gh", () => {
    const issueNumber = 11_811;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      applyExitCode: 1,
      applyOutcome: {
        ok: false,
        issueNumber,
        targetEntrySlug: "element",
        dryRun: false,
        rolledBack: true,
        error: "synthetic apply failure",
      },
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      // Apply was attempted exactly once.
      const applyCalls = readApplyCalls(harness.applyRecordPath ?? "");
      expect(applyCalls.length).toBe(1);

      const parsed = readResultJson(issueNumber);
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(false);
      expect(String(parsed.outcome)).toMatch(/^apply_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // AC7: GitHub comment failure → does not close the issue.
  it("AC7a: gh issue comment failure prevents gh issue close (issue stays open)", () => {
    const issueNumber = 11_812;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      ghCommentExit: 1,
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      const commentCalls = ghCalls.filter((c) => c.argv[1] === "comment");
      const closeCalls = ghCalls.filter((c) => c.argv[1] === "close");
      // Comment was attempted once and failed; close was never attempted.
      expect(commentCalls.length).toBe(1);
      expect(closeCalls.length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.classification).toBe("catalog_fact_correction");
      // Apply succeeded before finalize failed — writes_applied=true.
      expect(parsed.writes_applied).toBe(true);
      expect(String(parsed.outcome)).toMatch(/^finalize_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  it("AC7b: gh issue close failure after a successful comment still records writes_applied=true", () => {
    const issueNumber = 11_813;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      ghCommentExit: 0,
      ghCloseExit: 1,
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      const commentCalls = ghCalls.filter((c) => c.argv[1] === "comment");
      const closeCalls = ghCalls.filter((c) => c.argv[1] === "close");
      // Comment succeeded once; close was attempted once but failed.
      expect(commentCalls.length).toBe(1);
      expect(closeCalls.length).toBe(1);

      const parsed = readResultJson(issueNumber);
      expect(parsed.writes_applied).toBe(true);
      expect(String(parsed.outcome)).toMatch(/^finalize_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // AC8: banned-key scan over every artifact. Already covered as part of the
  // happy-path tests (AC1+AC2) — this dedicated test makes the contract
  // explicit and exercises the helper on its own.
  it("AC8: no banned scoring/trust-leak key appears in any generated artifact for a success", () => {
    const issueNumber = 11_814;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).toBe(0);

      const ghCalls = readGhCalls(harness.recordPath);
      // The success comment exists and is non-empty.
      const commentCall = ghCalls.find((c) => c.argv[1] === "comment");
      expect(commentCall).toBeDefined();
      expect(commentCall?.bodyContent ?? "").not.toBe("");

      // Walk every artifact and every recorded comment body.
      assertNoBannedKeysInArtifacts(issueNumber, ghCalls);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // Coverage gap: failure-path classification preservation on the
  // new_alternative branch. The orchestrator's write_result() calls inside
  // the research/verify/apply/finalize stages were switched from a hard-coded
  // "catalog_fact_correction" literal to "$CLASSIFICATION". If that regresses,
  // a new_alternative apply failure would silently report
  // classification="catalog_fact_correction" in result.json, hiding the real
  // branch the pipeline took. The fact-correction equivalent is covered by
  // AC6, so this test pins the symmetric new_alternative behavior.
  it("apply failure on new_alternative branch records classification=new_alternative in result.json", () => {
    const issueNumber = 11_815;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "new_alternative",
      applyNewAltExitCode: 1,
      applyNewAltOutcome: {
        ok: false,
        issueNumber,
        action: "new_alternative",
        dryRun: false,
        error: "synthetic new-alt apply failure",
      },
    });

    try {
      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status).not.toBe(0);

      // The new-alternative apply shim was invoked exactly once and failed;
      // the fact-correction shim must not have been touched.
      expect(harness.applyNewAltRecordPath).not.toBeNull();
      const newAltApplyCalls = readApplyCalls(
        harness.applyNewAltRecordPath ?? "",
      );
      expect(newAltApplyCalls.length).toBe(1);
      expect(readApplyCalls(harness.applyRecordPath ?? "").length).toBe(0);

      // No comment/close — finalize must not have run.
      const ghCalls = readGhCalls(harness.recordPath);
      expect(ghCalls.filter((c) => c.argv[1] === "comment").length).toBe(0);
      expect(ghCalls.filter((c) => c.argv[1] === "close").length).toBe(0);

      // The critical assertion: classification must round-trip as
      // "new_alternative", NOT the fact-correction literal that previously
      // lived in this branch. Pair with apply_failed_rc_* so we know the
      // failure was recorded against the correct stage.
      const parsed = readResultJson(issueNumber);
      expect(parsed.classification).toBe("new_alternative");
      expect(parsed.writes_applied).toBe(false);
      expect(String(parsed.outcome)).toMatch(/^apply_failed_rc_/);
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });

  // Coverage gap: stage-4 dispatch correctness when both APPLY_* env vars are
  // configured and classification is catalog_fact_correction. AC2 covers the
  // happy fact-correction path without EUROALT_APPLY_NEW_ALT_CMD set; this
  // test ensures the new branch (introduced for #480) does not accidentally
  // route fact-corrections through the new_alternative apply command. AC1
  // covers the inverse direction (new_alt happy path does not call the
  // fact-correction shim).
  it("fact-correction classification uses fact-correction apply even when EUROALT_APPLY_NEW_ALT_CMD is also set", () => {
    const issueNumber = 11_816;
    createdIssueNumbers.push(issueNumber);
    const harness = setupPipelineHarness({
      issueNumber,
      classification: "catalog_fact_correction",
      configureNewAlt: true,
    });

    try {
      // Sanity-check the harness wiring — both env vars should be set so this
      // test actually exercises the dispatch decision, not a missing-shim
      // fallback.
      expect(harness.env.EUROALT_APPLY_VERIFIED_CMD).toBeDefined();
      expect(harness.env.EUROALT_APPLY_NEW_ALT_CMD).toBeDefined();

      const result = runOrchestrator(
        [String(issueNumber)],
        harness.env,
        harness.pathPrefix,
      );
      expect(result.status, `orchestrator stderr: ${result.stderr}`).toBe(0);

      // Only the fact-correction apply shim was invoked; the new-alt shim
      // must stay untouched on this branch.
      const factApplyCalls = readApplyCalls(harness.applyRecordPath ?? "");
      expect(factApplyCalls.length).toBe(1);
      expect(harness.applyNewAltRecordPath).not.toBeNull();
      const newAltApplyCalls = readApplyCalls(
        harness.applyNewAltRecordPath ?? "",
      );
      expect(newAltApplyCalls.length).toBe(0);

      const parsed = readResultJson(issueNumber);
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(true);
      expect(parsed.outcome).toBe("applied");
    } finally {
      rmSync(harness.tempDir, { recursive: true, force: true });
    }
  });
});
