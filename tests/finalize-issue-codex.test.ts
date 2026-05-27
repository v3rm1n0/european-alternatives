import { spawnSync } from "node:child_process";
import {
  chmodSync,
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
const finalizerModuleUrl = new URL(
  "../scripts/lib/finalize-issue-codex.mjs",
  import.meta.url,
);
const finalizerRunnerPath = resolve("scripts/finalize-issue-codex-run.mjs");
const finalizerShellScriptPath = resolve("scripts/finalize-issue-codex.sh");

type VerifiedAction = Record<string, unknown>;
type MutationOutcome = Record<string, unknown>;

type FinalizerModule = {
  GITHUB_COMMENT_MAX_LENGTH: number;
  BANNED_FINALIZER_KEYS: readonly string[];
  buildSuccessComment: (input: {
    verifiedAction: VerifiedAction;
    mutationOutcome: MutationOutcome;
  }) => string;
  validateFinalizerInputs: (input: {
    verifiedAction: VerifiedAction;
    mutationOutcome: MutationOutcome;
  }) => void;
};

const baselineIssueNumber = 4711;
const baselineRepo = "TheMorpheus407/european-alternatives";

function newAlternativeVerifiedAction(
  overrides: Record<string, unknown> = {},
): VerifiedAction {
  return {
    issueNumber: baselineIssueNumber,
    action: "new_alternative",
    dryRun: false,
    accessedDate: "2026-05-27",
    newAlternative: {
      slug: "cryptee",
      name: "Cryptee",
      description_en: "Estonian E2EE document and photo storage.",
      country_code: "ee",
      website_url: "https://crypt.ee",
      sources: {
        name: {
          url: "https://crypt.ee/about",
          title: "Cryptee — About",
          accessedDate: "2026-05-27",
        },
        country_code: {
          url: "https://crypt.ee/legal",
          title: "Cryptee — Legal",
          accessedDate: "2026-05-27",
        },
      },
    },
    verifierEvidence: {
      name: {
        verdict: "supports",
        sourceUrl: "https://e-estonia.com/cryptee",
        sourceTitle: "e-Estonia: Cryptee",
        accessedDate: "2026-05-27",
        auditQuote: "Cryptee is an Estonian privacy-focused storage service.",
      },
      country_code: {
        verdict: "supports",
        sourceUrl: "https://en.wikipedia.org/wiki/Cryptee",
        sourceTitle: "Cryptee — Wikipedia",
        accessedDate: "2026-05-27",
        auditQuote: "Headquartered in Tallinn, Estonia.",
      },
    },
    ...overrides,
  };
}

function newAlternativeMutationOutcome(
  overrides: Record<string, unknown> = {},
): MutationOutcome {
  return {
    ok: true,
    issueNumber: baselineIssueNumber,
    action: "new_alternative",
    dryRun: false,
    entry_id: 4242,
    slug: "cryptee",
    ...overrides,
  };
}

function factCorrectionVerifiedAction(
  overrides: Record<string, unknown> = {},
): VerifiedAction {
  return {
    issueNumber: baselineIssueNumber,
    action: "catalog_fact_correction",
    dryRun: false,
    accessedDate: "2026-05-27",
    factCorrection: {
      targetEntrySlug: "element",
      changes: [
        {
          table: "catalog_entries",
          column: "country_code",
          currentValue: "de",
          proposedValue: "fr",
          source: {
            url: "https://element.io/legal",
            title: "Element — legal",
            accessedDate: "2026-05-27",
          },
        },
      ],
    },
    verifierEvidence: [
      {
        table: "catalog_entries",
        column: "country_code",
        proposedValue: "fr",
        verdict: "supports",
        sourceUrl: "https://societe.com/element-fr",
        sourceTitle: "Element — Société.com",
        accessedDate: "2026-05-27",
        auditQuote: "Element SAS, France.",
      },
    ],
    ...overrides,
  };
}

function factCorrectionMutationOutcome(
  overrides: Record<string, unknown> = {},
): MutationOutcome {
  return {
    ok: true,
    issueNumber: baselineIssueNumber,
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
        accessedDate: "2026-05-27",
        auditQuote: "Element SAS, France.",
      },
    ],
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
  verifiedAction: VerifiedAction,
  mutationOutcome: MutationOutcome,
): { verifiedActionPath: string; mutationOutcomePath: string } {
  const verifiedActionPath = join(tempDir, "verified-action.json");
  const mutationOutcomePath = join(tempDir, "mutation-outcome.json");

  writeFileSync(verifiedActionPath, JSON.stringify(verifiedAction), "utf8");
  writeFileSync(mutationOutcomePath, JSON.stringify(mutationOutcome), "utf8");

  return { verifiedActionPath, mutationOutcomePath };
}

type FakeGhConfig = {
  /**
   * Map from the first non-flag positional after `gh issue` to an exit code.
   * For example { comment: 0, close: 0 } makes both calls succeed.
   */
  exitFor: Record<string, number>;
};

function writeFakeGh(tempDir: string, config: FakeGhConfig): {
  fakeGhPath: string;
  recordPath: string;
} {
  const fakeGhPath = join(tempDir, "gh");
  const recordPath = join(tempDir, "gh-calls.log");

  // Build a bash case statement mapping subcommand to exit codes.
  const cases = Object.entries(config.exitFor)
    .map(
      ([subcommand, exitCode]) =>
        `        ${JSON.stringify(subcommand)}) printf '%s\\n' "EXIT=${String(exitCode)}" >> "$EUROALT_GH_RECORD"; exit ${String(exitCode)} ;;`,
    )
    .join("\n");

  writeFileSync(
    fakeGhPath,
    `#!/usr/bin/env bash
set -u
: "\${EUROALT_GH_RECORD:?fake gh requires EUROALT_GH_RECORD env var}"
# Record argv, one argument per line, framed by a CALL marker.
printf 'CALL\\n' >> "$EUROALT_GH_RECORD"
for arg in "$@"; do
    printf '%s\\n' "$arg" >> "$EUROALT_GH_RECORD"
done
# When a --body-file is supplied, also record its content.
prev=""
for arg in "$@"; do
    if [[ "$prev" == "--body-file" ]]; then
        printf 'BODY_FILE_CONTENT_BEGIN\\n' >> "$EUROALT_GH_RECORD"
        cat "$arg" >> "$EUROALT_GH_RECORD" || true
        printf '\\nBODY_FILE_CONTENT_END\\n' >> "$EUROALT_GH_RECORD"
    fi
    prev="$arg"
done
# Determine which gh subcommand is being run (issue comment / issue close / ...)
# argv example: issue comment 4711 --repo X --body-file Y
if [[ "\${1:-}" != "issue" ]]; then
    printf '%s\\n' "EXIT=1 (non-issue subcommand)" >> "$EUROALT_GH_RECORD"
    exit 1
fi
case "\${2:-}" in
${cases}
    *) printf '%s\\n' "EXIT=1 (unhandled subcommand: \${2:-})" >> "$EUROALT_GH_RECORD"; exit 1 ;;
esac
`,
    "utf8",
  );
  chmodSync(fakeGhPath, 0o755);

  return { fakeGhPath, recordPath };
}

function runFinalizerRunner(
  args: string[],
  options: { pathPrefix?: string; recordPath?: string } = {},
) {
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;

  if (options.pathPrefix !== undefined) {
    env.PATH = `${options.pathPrefix}:${process.env.PATH ?? ""}`;
  }

  if (options.recordPath !== undefined) {
    env.EUROALT_GH_RECORD = options.recordPath;
  }

  return spawnSync(process.execPath, [finalizerRunnerPath, ...args], {
    cwd: projectDir,
    encoding: "utf8",
    env,
  });
}

function readGhCalls(recordPath: string): string[][] {
  if (!existsSync(recordPath)) {
    return [];
  }

  const text = readFileSync(recordPath, "utf8");
  const lines = text.split("\n");
  const calls: string[][] = [];
  let current: string[] | null = null;
  let inBody = false;

  for (const line of lines) {
    if (line === "CALL") {
      if (current !== null) {
        calls.push(current);
      }
      current = [];
      inBody = false;
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
      continue;
    }
    if (inBody) {
      continue;
    }
    if (current !== null && line !== "") {
      current.push(line);
    }
  }

  if (current !== null) {
    calls.push(current);
  }

  return calls;
}

function readRecordedBody(recordPath: string): string | null {
  if (!existsSync(recordPath)) {
    return null;
  }

  const text = readFileSync(recordPath, "utf8");
  const begin = text.indexOf("BODY_FILE_CONTENT_BEGIN\n");

  if (begin === -1) {
    return null;
  }

  const after = text.slice(begin + "BODY_FILE_CONTENT_BEGIN\n".length);
  const end = after.indexOf("\nBODY_FILE_CONTENT_END");

  if (end === -1) {
    return null;
  }

  return after.slice(0, end);
}

async function loadFinalizerModule(): Promise<FinalizerModule> {
  return (await import(finalizerModuleUrl.href)) as FinalizerModule;
}

function parseJsonObject(stdout: string): Record<string, unknown> {
  return JSON.parse(stdout) as Record<string, unknown>;
}

describe("finalize-issue-codex buildSuccessComment — new_alternative", () => {
  it("renders the Trust Score Pending banner and the inserted slug", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const body = buildSuccessComment({
      verifiedAction: newAlternativeVerifiedAction(),
      mutationOutcome: newAlternativeMutationOutcome(),
    });

    expect(body).toMatch(/trust score/i);
    expect(body).toMatch(/pending/i);
    expect(body).toContain("cryptee");
  });

  it("includes researcher source URLs in a distinct section", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const body = buildSuccessComment({
      verifiedAction: newAlternativeVerifiedAction(),
      mutationOutcome: newAlternativeMutationOutcome(),
    });

    expect(body).toContain("https://crypt.ee/about");
    expect(body).toContain("https://crypt.ee/legal");
    expect(body).toMatch(/researcher/i);
  });

  it("includes independent verifier source URLs in a distinct section", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const body = buildSuccessComment({
      verifiedAction: newAlternativeVerifiedAction(),
      mutationOutcome: newAlternativeMutationOutcome(),
    });

    expect(body).toContain("https://e-estonia.com/cryptee");
    expect(body).toContain("https://en.wikipedia.org/wiki/Cryptee");
    expect(body).toMatch(/verifier/i);
    expect(body).toMatch(/independent/i);
  });

  it("renders one bullet per verifier evidence entry (so the audit is complete)", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const body = buildSuccessComment({
      verifiedAction: newAlternativeVerifiedAction(),
      mutationOutcome: newAlternativeMutationOutcome(),
    });

    // Two evidence keys (name, country_code) → at least two bullet lines.
    const bulletCount = (body.match(/^- /gmu) ?? []).length;
    expect(bulletCount).toBeGreaterThanOrEqual(2);
  });
});

describe("finalize-issue-codex buildSuccessComment — catalog_fact_correction", () => {
  it("renders one bullet per change in changesApplied", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const verifiedAction = factCorrectionVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "country_code",
            currentValue: "de",
            proposedValue: "fr",
            source: { url: "https://element.io/legal", accessedDate: "2026-05-27" },
          },
          {
            table: "entry_tags",
            op: "add",
            tagSlug: "decentralized",
            source: { url: "https://element.io/blog", accessedDate: "2026-05-27" },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "country_code",
          proposedValue: "fr",
          verdict: "supports",
          sourceUrl: "https://societe.com/element-fr",
          sourceTitle: "Element — Société.com",
          accessedDate: "2026-05-27",
          auditQuote: "Element SAS, France.",
        },
        {
          table: "entry_tags",
          op: "add",
          tagSlug: "decentralized",
          verdict: "supports",
          sourceUrl: "https://matrix.org/blog/element",
          sourceTitle: "Matrix blog",
          accessedDate: "2026-05-27",
          auditQuote: "Element uses decentralised Matrix infrastructure.",
        },
      ],
    });

    const mutationOutcome = factCorrectionMutationOutcome({
      changesApplied: [
        {
          table: "catalog_entries",
          op: "update",
          column: "country_code",
          entry_id: 17,
          proposedValue: "fr",
          applied: true,
        },
        {
          table: "entry_tags",
          op: "insert",
          tag_slug: "decentralized",
          entry_id: 17,
          applied: true,
        },
      ],
    });

    const body = buildSuccessComment({ verifiedAction, mutationOutcome });

    expect(body).toContain("catalog_entries");
    expect(body).toContain("country_code");
    expect(body).toContain("entry_tags");
    expect(body).toContain("decentralized");
  });

  it("renders the basic fact-correction action label, not the new-alternative banner", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const body = buildSuccessComment({
      verifiedAction: factCorrectionVerifiedAction(),
      mutationOutcome: factCorrectionMutationOutcome(),
    });

    expect(body).toMatch(/fact correction|catalog_fact_correction/i);
    expect(body).not.toMatch(/inserted as new alternative/i);
  });

  it("still includes the Trust Score remains pending note for fact corrections", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const body = buildSuccessComment({
      verifiedAction: factCorrectionVerifiedAction(),
      mutationOutcome: factCorrectionMutationOutcome(),
    });

    expect(body).toMatch(/trust score/i);
    expect(body).toMatch(/pending/i);
  });

  it("wraps audit quotes in a Markdown blockquote", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const body = buildSuccessComment({
      verifiedAction: factCorrectionVerifiedAction(),
      mutationOutcome: factCorrectionMutationOutcome(),
    });

    // The default audit quote should appear inside a blockquote line.
    expect(body).toMatch(/^> .*Element SAS, France/mu);
  });

  it("defuses triple-backticks inside audit quotes so they cannot break out of any fence", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const hostile = factCorrectionVerifiedAction({
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "country_code",
          proposedValue: "fr",
          verdict: "supports",
          sourceUrl: "https://societe.com/element-fr",
          sourceTitle: "Element — Société.com",
          accessedDate: "2026-05-27",
          auditQuote: "```js\nconsole.log('escape')\n```",
        },
      ],
    });

    const body = buildSuccessComment({
      verifiedAction: hostile,
      mutationOutcome: factCorrectionMutationOutcome(),
    });

    expect(body).not.toMatch(/^```/mu);
  });
});

describe("finalize-issue-codex buildSuccessComment — length and safety", () => {
  it("keeps comment body under GitHub's 65_536 byte limit even for 30 max-length entries", async () => {
    const { buildSuccessComment, GITHUB_COMMENT_MAX_LENGTH } =
      await loadFinalizerModule();

    expect(GITHUB_COMMENT_MAX_LENGTH).toBeLessThanOrEqual(65_536);

    const longQuote = "x".repeat(1000);
    const changes: Record<string, unknown>[] = [];
    const evidence: Record<string, unknown>[] = [];

    for (let i = 0; i < 30; i++) {
      changes.push({
        table: "catalog_entries",
        column: "headquarters_city",
        currentValue: "Berlin",
        proposedValue: `City-${String(i)}`,
        source: {
          url: `https://example.org/source-${String(i)}`,
          accessedDate: "2026-05-27",
        },
      });
      evidence.push({
        table: "catalog_entries",
        column: "headquarters_city",
        proposedValue: `City-${String(i)}`,
        verdict: "supports",
        sourceUrl: `https://wikipedia.example/${String(i)}`,
        sourceTitle: `Wikipedia ${String(i)}`,
        accessedDate: "2026-05-27",
        auditQuote: longQuote,
      });
    }

    const verifiedAction = factCorrectionVerifiedAction({
      factCorrection: { targetEntrySlug: "element", changes },
      verifierEvidence: evidence,
    });

    const mutationOutcome = factCorrectionMutationOutcome({
      changesApplied: changes.map((change, index) => ({
        table: "catalog_entries",
        op: "update",
        column: change.column,
        entry_id: 17,
        proposedValue: `City-${String(index)}`,
        applied: true,
      })),
    });

    const body = buildSuccessComment({ verifiedAction, mutationOutcome });

    expect(Buffer.byteLength(body, "utf8")).toBeLessThan(
      GITHUB_COMMENT_MAX_LENGTH,
    );
  });

  it("rejects a verified action containing a banned scoring key (defense in depth)", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const tainted = newAlternativeVerifiedAction({
      trust_score: 80,
    });

    expect(() =>
      buildSuccessComment({
        verifiedAction: tainted,
        mutationOutcome: newAlternativeMutationOutcome(),
      }),
    ).toThrow(/trust_score|banned/i);
  });

  it("exports a banned-key denylist that includes the well-known scoring identifiers", async () => {
    const { BANNED_FINALIZER_KEYS } = await loadFinalizerModule();

    expect(Array.isArray(BANNED_FINALIZER_KEYS)).toBe(true);
    for (const key of [
      "trust_score",
      "trustScore",
      "reservations",
      "positive_signals",
      "positiveSignals",
      "scoring_metadata",
      "scoringMetadata",
    ]) {
      expect(BANNED_FINALIZER_KEYS).toContain(key);
    }
  });
});

describe("finalize-issue-codex validateFinalizerInputs", () => {
  it("rejects when mutationOutcome.ok is not true", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: factCorrectionVerifiedAction(),
        mutationOutcome: factCorrectionMutationOutcome({ ok: false }),
      }),
    ).toThrow(/ok|mutation|outcome/i);
  });

  it("rejects when verifiedAction.action is missing", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    const missingAction = factCorrectionVerifiedAction();
    delete (missingAction as Record<string, unknown>).action;

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: missingAction,
        mutationOutcome: factCorrectionMutationOutcome(),
      }),
    ).toThrow(/action/i);
  });

  it("rejects when verifiedAction.action is unsupported", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: factCorrectionVerifiedAction({
          action: "delete_entry",
        }),
        mutationOutcome: factCorrectionMutationOutcome(),
      }),
    ).toThrow(/action|unsupported|new_alternative|catalog_fact_correction/i);
  });

  it("rejects when verifierEvidence is empty for a fact correction", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: factCorrectionVerifiedAction({ verifierEvidence: [] }),
        mutationOutcome: factCorrectionMutationOutcome(),
      }),
    ).toThrow(/evidence|verifier|empty/i);
  });

  it("rejects when researcher sources block is missing on a new_alternative", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    const noSources = newAlternativeVerifiedAction({
      newAlternative: { slug: "cryptee", name: "Cryptee" },
    });

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: noSources,
        mutationOutcome: newAlternativeMutationOutcome(),
      }),
    ).toThrow(/source|researcher|missing|empty/i);
  });
});

describe("finalize-issue-codex runner CLI — success path", () => {
  it("posts a comment then closes the issue (exit 0) and records both gh calls in order", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction(),
        factCorrectionMutationOutcome(),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");

      const calls = readGhCalls(recordPath);
      expect(calls.length).toBe(2);
      // First: issue comment <n> --repo <r> --body-file <p>
      expect(calls[0]).toContain("issue");
      expect(calls[0]).toContain("comment");
      expect(calls[0]).toContain(String(baselineIssueNumber));
      expect(calls[0]).toContain("--repo");
      expect(calls[0]).toContain(baselineRepo);
      expect(calls[0]).toContain("--body-file");
      // Second: issue close <n> --repo <r>
      expect(calls[1]).toContain("issue");
      expect(calls[1]).toContain("close");
      expect(calls[1]).toContain(String(baselineIssueNumber));
      expect(calls[1]).toContain("--repo");
      expect(calls[1]).toContain(baselineRepo);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("passes a body-file whose content matches the rendered success comment", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction(),
        factCorrectionMutationOutcome(),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(0);

      const body = readRecordedBody(recordPath);
      expect(body).not.toBeNull();
      expect(body).toMatch(/trust score/i);
      expect(body).toContain("https://societe.com/element-fr");
      expect(body).toContain("country_code");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("finalize-issue-codex runner CLI — failure paths", () => {
  it("fails closed (exit 65) when gh issue comment fails and never invokes gh issue close", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction(),
        factCorrectionMutationOutcome(),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 1, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(65);
      expect(result.stderr).not.toBe("");

      const calls = readGhCalls(recordPath);
      expect(calls.length).toBe(1);
      expect(calls[0]).toContain("comment");
      // No close call recorded.
      for (const call of calls) {
        expect(call).not.toContain("close");
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed (exit 65) when gh issue close fails after a successful comment; never re-posts", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction(),
        factCorrectionMutationOutcome(),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 1 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(65);
      expect(result.stderr).toMatch(/close|gh/i);

      const calls = readGhCalls(recordPath);
      // Exactly one comment call and one close call — no comment retry.
      const commentCalls = calls.filter((argv) => argv.includes("comment"));
      const closeCalls = calls.filter((argv) => argv.includes("close"));
      expect(commentCalls.length).toBe(1);
      expect(closeCalls.length).toBe(1);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("refuses to invoke gh when mutationOutcome.ok is not true (defense in depth)", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction(),
        factCorrectionMutationOutcome({ ok: false }),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(65);
      expect(result.stderr).toMatch(/ok|mutation|outcome|fail.?closed/i);
      expect(readGhCalls(recordPath).length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("finalize-issue-codex runner CLI — dry-run", () => {
  it("--dry-run never invokes gh and prints a JSON envelope with the would-be comment body", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction({ dryRun: true }),
        factCorrectionMutationOutcome({ dryRun: true }),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
          "--dry-run",
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(0);
      expect(readGhCalls(recordPath).length).toBe(0);

      const envelope = parseJsonObject(result.stdout);
      expect(envelope.dryRun).toBe(true);
      expect(envelope.issueNumber).toBe(baselineIssueNumber);
      expect(envelope.repo).toBe(baselineRepo);
      expect(typeof envelope.commentBody).toBe("string");
      expect(String(envelope.commentBody)).toMatch(/trust score/i);
      expect(envelope.willClose).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("treats verifiedAction.dryRun: true the same as --dry-run (never invokes gh)", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction({ dryRun: true }),
        factCorrectionMutationOutcome({ dryRun: true }),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(0);
      expect(readGhCalls(recordPath).length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("finalize-issue-codex runner CLI — argument handling", () => {
  it("prints --help usage without invoking gh", () => {
    const result = runFinalizerRunner(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/usage/i);
    expect(result.stderr).toBe("");
  });

  it("rejects unknown options with exit code 64", () => {
    const result = runFinalizerRunner(["--no-such-option"]);

    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/unknown option/i);
    expect(result.stdout).toBe("");
  });

  it("rejects invocation missing --verified-action-file (exit 64)", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const mutationOutcomePath = join(tempDir, "outcome.json");
      writeFileSync(
        mutationOutcomePath,
        JSON.stringify(factCorrectionMutationOutcome()),
        "utf8",
      );

      const result = runFinalizerRunner([
        "--mutation-outcome-file",
        mutationOutcomePath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stderr).toMatch(/verified.?action|provide/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects invocation missing --mutation-outcome-file outside of --dry-run (exit 64)", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const verifiedActionPath = join(tempDir, "verified.json");
      writeFileSync(
        verifiedActionPath,
        JSON.stringify(factCorrectionVerifiedAction()),
        "utf8",
      );

      const result = runFinalizerRunner([
        "--verified-action-file",
        verifiedActionPath,
      ]);

      expect(result.status).toBe(64);
      expect(result.stderr).toMatch(/mutation.?outcome|provide/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("finalize-issue-codex bash entrypoint", () => {
  const scriptExists = existsSync(finalizerShellScriptPath);

  it.skipIf(!scriptExists)(
    "supports --help without any network or model call",
    () => {
      const result = spawnSync("bash", [finalizerShellScriptPath, "--help"], {
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
      const result = spawnSync("bash", [finalizerShellScriptPath], {
        cwd: projectDir,
        encoding: "utf8",
      });

      expect(result.status).toBe(64);
    },
  );

  it.skipIf(!scriptExists)(
    "exits with usage error code 64 on unknown options",
    () => {
      const result = spawnSync(
        "bash",
        [finalizerShellScriptPath, "--no-such-flag"],
        { cwd: projectDir, encoding: "utf8" },
      );

      expect(result.status).toBe(64);
      expect(result.stderr).toMatch(/unknown/i);
    },
  );
});

describe("finalize-issue-codex buildSuccessComment — defensive paths", () => {
  it("truncates and appends a truncation note when the rendered body crosses the 65 KB limit", async () => {
    const { buildSuccessComment, GITHUB_COMMENT_MAX_LENGTH } =
      await loadFinalizerModule();

    // Push the body well past 65 KB by stuffing one verifier evidence entry
    // with a multi-hundred-KB audit quote. Triggers the truncation branch.
    const giantQuote = "y".repeat(200_000);
    const verifiedAction = factCorrectionVerifiedAction({
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "country_code",
          proposedValue: "fr",
          verdict: "supports",
          sourceUrl: "https://societe.com/element-fr",
          sourceTitle: "Element — Société.com",
          accessedDate: "2026-05-27",
          auditQuote: giantQuote,
        },
      ],
    });

    const body = buildSuccessComment({
      verifiedAction,
      mutationOutcome: factCorrectionMutationOutcome(),
    });

    expect(Buffer.byteLength(body, "utf8")).toBeLessThanOrEqual(
      GITHUB_COMMENT_MAX_LENGTH,
    );
    expect(body).toMatch(/truncated/i);
  });

  it("rejects a nested banned scoring key (recursive defense in depth)", async () => {
    const { buildSuccessComment } = await loadFinalizerModule();

    const tainted = newAlternativeVerifiedAction({
      newAlternative: {
        slug: "cryptee",
        name: "Cryptee",
        sources: {
          name: {
            url: "https://crypt.ee/about",
            scoringMetadata: { hint: "should never be here" },
          },
        },
      },
    });

    expect(() =>
      buildSuccessComment({
        verifiedAction: tainted,
        mutationOutcome: newAlternativeMutationOutcome(),
      }),
    ).toThrow(/scoringMetadata|banned/i);
  });
});

describe("finalize-issue-codex validateFinalizerInputs — additional contract", () => {
  it("rejects when verifiedAction is not a plain object", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: null as unknown as VerifiedAction,
        mutationOutcome: factCorrectionMutationOutcome(),
      }),
    ).toThrow(/verifiedAction/);

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: [] as unknown as VerifiedAction,
        mutationOutcome: factCorrectionMutationOutcome(),
      }),
    ).toThrow(/verifiedAction/);
  });

  it("rejects when mutationOutcome is not a plain object", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: factCorrectionVerifiedAction(),
        mutationOutcome: null as unknown as MutationOutcome,
      }),
    ).toThrow(/mutationOutcome/);
  });

  it("rejects when verifierEvidence is empty for a new_alternative", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: newAlternativeVerifiedAction({ verifierEvidence: {} }),
        mutationOutcome: newAlternativeMutationOutcome(),
      }),
    ).toThrow(/evidence|verifier|empty/i);
  });

  it("rejects when factCorrection.changes is empty for a catalog_fact_correction", async () => {
    const { validateFinalizerInputs } = await loadFinalizerModule();

    expect(() =>
      validateFinalizerInputs({
        verifiedAction: factCorrectionVerifiedAction({
          factCorrection: { targetEntrySlug: "element", changes: [] },
        }),
        mutationOutcome: factCorrectionMutationOutcome(),
      }),
    ).toThrow(/changes|empty/i);
  });
});

describe("finalize-issue-codex runner CLI — input loading and issue number", () => {
  it("fails closed (exit 65) when --verified-action-file points at a nonexistent path", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction(),
        factCorrectionMutationOutcome(),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          join(tempDir, "does-not-exist.json"),
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(65);
      expect(result.stderr).toMatch(/fail.?closed|read|verified.?action/i);
      // Never reaches gh.
      expect(readGhCalls(recordPath).length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed (exit 65) when --verified-action-file contains invalid JSON", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const verifiedActionPath = join(tempDir, "bad.json");
      writeFileSync(verifiedActionPath, "{not valid json", "utf8");
      const mutationOutcomePath = join(tempDir, "outcome.json");
      writeFileSync(
        mutationOutcomePath,
        JSON.stringify(factCorrectionMutationOutcome()),
        "utf8",
      );

      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(65);
      expect(result.stderr).toMatch(/json|fail.?closed/i);
      expect(readGhCalls(recordPath).length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("falls back to mutationOutcome.issueNumber when verifiedAction omits it", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const verifiedAction = factCorrectionVerifiedAction();
      delete (verifiedAction as Record<string, unknown>).issueNumber;
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        verifiedAction,
        factCorrectionMutationOutcome({ issueNumber: 9999 }),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(0);

      const calls = readGhCalls(recordPath);
      expect(calls.length).toBe(2);
      expect(calls[0]).toContain("9999");
      expect(calls[1]).toContain("9999");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed (exit 65) when neither input carries a valid issue number", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const verifiedAction = factCorrectionVerifiedAction();
      delete (verifiedAction as Record<string, unknown>).issueNumber;
      const mutationOutcome = factCorrectionMutationOutcome();
      delete (mutationOutcome as Record<string, unknown>).issueNumber;

      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        verifiedAction,
        mutationOutcome,
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          "--verified-action-file",
          verifiedActionPath,
          "--mutation-outcome-file",
          mutationOutcomePath,
          "--repo",
          baselineRepo,
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(65);
      expect(result.stderr).toMatch(/issue.?number|fail.?closed/i);
      expect(readGhCalls(recordPath).length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("accepts --repo=<value> as an alternative to --repo <value>", () => {
    const tempDir = makeProjectTempDir("finalize-issue-codex-");

    try {
      const { verifiedActionPath, mutationOutcomePath } = writeRunnerInputs(
        tempDir,
        factCorrectionVerifiedAction(),
        factCorrectionMutationOutcome(),
      );
      const { recordPath } = writeFakeGh(tempDir, {
        exitFor: { comment: 0, close: 0 },
      });

      const result = runFinalizerRunner(
        [
          `--verified-action-file=${verifiedActionPath}`,
          `--mutation-outcome-file=${mutationOutcomePath}`,
          "--repo=other-owner/other-repo",
        ],
        { pathPrefix: tempDir, recordPath },
      );

      expect(result.status).toBe(0);

      const calls = readGhCalls(recordPath);
      expect(calls.length).toBe(2);
      expect(calls[0]).toContain("other-owner/other-repo");
      expect(calls[1]).toContain("other-owner/other-repo");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
