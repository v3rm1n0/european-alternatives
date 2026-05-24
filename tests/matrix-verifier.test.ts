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
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const projectDir = resolve(".");
const verifierModuleUrl = new URL(
  "../scripts/lib/matrix-verifier.mjs",
  import.meta.url,
);
const verifierRunnerPath = resolve("scripts/matrix-verify-run.mjs");
const beginSentinel = "BEGIN_MATRIX_FACT_VERIFICATION_JSON";
const endSentinel = "END_MATRIX_FACT_VERIFICATION_JSON";

type SelectedMatrixFactTarget = {
  factId: number;
  categoryId: string;
  categoryName: string;
  entrySlug: string;
  entryName: string;
  criterionKey: string;
  criterionLabel: string;
  valueType:
    | "boolean"
    | "enum"
    | "multi_enum"
    | "number"
    | "text"
    | "url"
    | "date";
  previousStatus: string;
  status: string;
  dryRun: boolean;
};

type PendingAttempt = {
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
  sourceUrl: string | null;
  sourceTitle: string | null;
  accessedDate: string | null;
  auditQuote: string | null;
  verdict:
    | "supports"
    | "contradicts"
    | "inconclusive"
    | "source-inaccessible"
    | "not-applicable";
  notes: string;
  countsTowardAcceptance: boolean;
  rawResponse: string;
};

type VerificationDecision = {
  accepted: boolean;
  recommendedAttemptStatus: string;
  recommendedFactStatus: string;
  countableVerifierCount: number;
  reason?: string;
  verifications?: VerificationRecord[];
};

type VerifierModule = {
  buildMatrixVerificationPrompt: (
    target: SelectedMatrixFactTarget,
    attempt: PendingAttempt,
    options: { verifierIndex: number; accessedDate?: string },
  ) => string;
  parseMatrixVerificationResponse: (
    rawResponse: string,
    target: SelectedMatrixFactTarget,
    attempt: PendingAttempt,
    options: {
      verifierIndex: number;
      agent: string;
      command: string;
      model?: string | null;
    },
  ) => VerificationRecord;
  decideMatrixVerificationOutcome: (
    attempt: PendingAttempt,
    records: VerificationRecord[],
  ) => VerificationDecision;
  validatePendingVerificationInput: (
    target: SelectedMatrixFactTarget,
    attempt: PendingAttempt,
  ) => boolean;
};

const selectedTarget: SelectedMatrixFactTarget = {
  factId: 123,
  categoryId: "messaging",
  categoryName: "Messaging",
  entrySlug: "element",
  entryName: "Element",
  criterionKey: "e2ee",
  criterionLabel: "End-to-end encryption",
  valueType: "boolean",
  previousStatus: "open",
  status: "researching",
  dryRun: false,
};

const pendingAttempt: PendingAttempt = {
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
};

async function loadVerifierModule(): Promise<VerifierModule> {
  return (await import(verifierModuleUrl.href)) as VerifierModule;
}

function modelResponse(payload: unknown): string {
  return [
    "Verification completed for the selected matrix fact attempt.",
    beginSentinel,
    JSON.stringify(payload, null, 2),
    endSentinel,
  ].join("\n");
}

function validPayload(
  verifierIndex: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    target: {
      factId: selectedTarget.factId,
      categoryId: selectedTarget.categoryId,
      entrySlug: selectedTarget.entrySlug,
      criterionKey: selectedTarget.criterionKey,
    },
    attempt: {
      factId: pendingAttempt.factId,
      proposedStatus: pendingAttempt.proposedStatus,
      proposedValue: pendingAttempt.proposedValue,
    },
    verification: {
      verifierIndex,
      verdict: "supports",
      sourceUrl: `https://example.test/element/security-${verifierIndex}`,
      sourceTitle: "Element security overview",
      accessedDate: "2026-05-25",
      auditQuote: "Private rooms are end-to-end encrypted by default.",
      reasoning: "The opened source supports the proposed boolean value.",
      ...overrides,
    },
  };
}

function parseJsonObject(stdout: string): Record<string, unknown> {
  return JSON.parse(stdout) as Record<string, unknown>;
}

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });

  return mkdtempSync(join(tempRoot, prefix));
}

describe("matrix verifier contract", () => {
  it("builds an independent verifier prompt for one slot and one pending attempt", async () => {
    const { buildMatrixVerificationPrompt } = await loadVerifierModule();

    const prompt = buildMatrixVerificationPrompt(
      selectedTarget,
      pendingAttempt,
      {
        verifierIndex: 2,
        accessedDate: "2026-05-25",
      },
    );

    expect(prompt).toMatch(/verifierIndex:\s*2/i);
    expect(prompt).toMatch(/independent/i);
    expect(prompt).toMatch(/do not rely on other verifier outputs/i);
    expect(prompt).toMatch(/one pending research attempt/i);
    expect(prompt).toContain("factId: 123");
    expect(prompt).toContain("categoryId: messaging");
    expect(prompt).toContain("entrySlug: element");
    expect(prompt).toContain("criterionKey: e2ee");
    expect(prompt).toContain("criterionLabel: End-to-end encryption");
    expect(prompt).toContain("valueType: boolean");
    expect(prompt).toContain(pendingAttempt.sourceUrl);
    expect(prompt).toContain(pendingAttempt.auditQuote);
    expect(prompt).toMatch(/open the researcher's cited source/i);
    expect(prompt).toMatch(/alternative accessible source/i);
    expect(prompt).toMatch(/accessible source URL/i);
    expect(prompt).toMatch(/audit quote/i);
    expect(prompt).toMatch(/reasoning/i);
    expect(prompt).toMatch(/does not count/i);
    expect(prompt).toContain(beginSentinel);
    expect(prompt).toContain(endSentinel);
    expect(prompt).not.toContain("BEGIN_MATRIX_FACT_RESEARCH_JSON");
  });

  it("parses a supporting verifier output into a countable verification record", async () => {
    const { parseMatrixVerificationResponse } = await loadVerifierModule();
    const rawResponse = modelResponse(validPayload(1));

    const record = parseMatrixVerificationResponse(
      rawResponse,
      selectedTarget,
      pendingAttempt,
      {
        verifierIndex: 1,
        agent: "codex",
        command: "codex exec",
        model: "gpt-verify",
      },
    );

    expect(record).toMatchObject({
      factId: 123,
      verifierIndex: 1,
      agent: "codex",
      model: "gpt-verify",
      command: "codex exec",
      sourceUrl: "https://example.test/element/security-1",
      sourceTitle: "Element security overview",
      accessedDate: "2026-05-25",
      auditQuote: "Private rooms are end-to-end encrypted by default.",
      verdict: "supports",
      notes: "The opened source supports the proposed boolean value.",
      countsTowardAcceptance: true,
    });
    expect(record.rawResponse).toBe(rawResponse);
  });

  it("records source-inaccessible verifier output as non-counting evidence", async () => {
    const { parseMatrixVerificationResponse } = await loadVerifierModule();

    const record = parseMatrixVerificationResponse(
      modelResponse(
        validPayload(2, {
          verdict: "source-inaccessible",
          sourceUrl: pendingAttempt.sourceUrl,
          sourceTitle: null,
          auditQuote: null,
          reasoning:
            "The cited source and no alternative accessible source could be opened.",
        }),
      ),
      selectedTarget,
      pendingAttempt,
      {
        verifierIndex: 2,
        agent: "claude",
        command: "claude --print",
      },
    );

    expect(record).toMatchObject({
      factId: 123,
      verifierIndex: 2,
      verdict: "source-inaccessible",
      sourceUrl: pendingAttempt.sourceUrl,
      sourceTitle: null,
      auditQuote: null,
      countsTowardAcceptance: false,
      notes:
        "The cited source and no alternative accessible source could be opened.",
    });
  });

  it("validates pending verification inputs before verifier execution", async () => {
    const { validatePendingVerificationInput } = await loadVerifierModule();

    expect(
      validatePendingVerificationInput(selectedTarget, pendingAttempt),
    ).toBe(true);

    const invalidInputs = [
      {
        name: "dry-run target",
        target: { ...selectedTarget, dryRun: true },
        attempt: pendingAttempt,
        error: /dry-run/i,
      },
      {
        name: "target not being researched",
        target: { ...selectedTarget, status: "open" },
        attempt: pendingAttempt,
        error: /status.*researching/i,
      },
      {
        name: "attempt fact mismatch",
        target: selectedTarget,
        attempt: { ...pendingAttempt, factId: 999 },
        error: /factId.*match/i,
      },
      {
        name: "attempt not pending verification",
        target: selectedTarget,
        attempt: { ...pendingAttempt, status: "accepted" },
        error: /needs-verification/i,
      },
      {
        name: "attempt proposed status is not verified",
        target: selectedTarget,
        attempt: { ...pendingAttempt, proposedStatus: "unverified" },
        error: /proposedStatus.*verified/i,
      },
      {
        name: "attempt lacks researcher audit quote",
        target: selectedTarget,
        attempt: { ...pendingAttempt, auditQuote: "" },
        error: /auditQuote/i,
      },
    ];

    for (const invalidInput of invalidInputs) {
      expect(
        () =>
          validatePendingVerificationInput(
            invalidInput.target,
            invalidInput.attempt,
          ),
        invalidInput.name,
      ).toThrow(invalidInput.error);
    }
  });

  it("rejects malformed, multi-record, missing-quote, and mismatched verifier outputs", async () => {
    const { parseMatrixVerificationResponse } = await loadVerifierModule();
    const invalidResponses = [
      {
        name: "missing sentinels",
        response: JSON.stringify(validPayload(1)),
        error: /sentinel|BEGIN_MATRIX_FACT_VERIFICATION_JSON/i,
      },
      {
        name: "multi-verification output",
        response: modelResponse({
          verifications: [validPayload(1), validPayload(2)],
        }),
        error: /multi|one|verifications|plural/i,
      },
      {
        name: "missing quote on countable verdict",
        response: modelResponse(validPayload(1, { auditQuote: "" })),
        error: /auditQuote|audit quote/i,
      },
      {
        name: "mismatched attempt value",
        response: modelResponse({
          ...validPayload(1),
          attempt: {
            factId: 123,
            proposedStatus: "verified",
            proposedValue: false,
          },
        }),
        error: /attempt|proposedValue/i,
      },
      {
        name: "slot mismatch",
        response: modelResponse(validPayload(3)),
        error: /verifierIndex|slot/i,
      },
      {
        name: "target mismatch",
        response: modelResponse({
          ...validPayload(1),
          target: {
            factId: 123,
            categoryId: "messaging",
            entrySlug: "signal",
            criterionKey: "e2ee",
          },
        }),
        error: /target.*entrySlug/i,
      },
      {
        name: "unknown verdict",
        response: modelResponse(
          validPayload(1, { verdict: "mostly-supports" }),
        ),
        error: /verdict.*one of/i,
      },
      {
        name: "non-http evidence URL",
        response: modelResponse(
          validPayload(1, { sourceUrl: "file:///tmp/source" }),
        ),
        error: /sourceUrl.*http/i,
      },
      {
        name: "invalid accessed date",
        response: modelResponse(
          validPayload(1, { accessedDate: "2026-02-30" }),
        ),
        error: /accessedDate.*YYYY-MM-DD/i,
      },
      {
        name: "missing reasoning",
        response: modelResponse(validPayload(1, { reasoning: "" })),
        error: /reasoning/i,
      },
    ];

    for (const invalidResponse of invalidResponses) {
      expect(
        () =>
          parseMatrixVerificationResponse(
            invalidResponse.response,
            selectedTarget,
            pendingAttempt,
            {
              verifierIndex: invalidResponse.name === "slot mismatch" ? 2 : 1,
              agent: "codex",
              command: "codex exec",
            },
          ),
        invalidResponse.name,
      ).toThrow(invalidResponse.error);
    }
  });

  it("accepts only three unique, countable supporting verifier records", async () => {
    const { decideMatrixVerificationOutcome, parseMatrixVerificationResponse } =
      await loadVerifierModule();
    const supports = [1, 2, 3].map((verifierIndex) =>
      parseMatrixVerificationResponse(
        modelResponse(validPayload(verifierIndex)),
        selectedTarget,
        pendingAttempt,
        {
          verifierIndex,
          agent: "codex",
          command: "codex exec",
        },
      ),
    );
    const inaccessible = parseMatrixVerificationResponse(
      modelResponse(
        validPayload(3, {
          verdict: "source-inaccessible",
          auditQuote: null,
          reasoning: "No accessible source could be opened for this fact.",
        }),
      ),
      selectedTarget,
      pendingAttempt,
      { verifierIndex: 3, agent: "codex", command: "codex exec" },
    );
    const contradicts = parseMatrixVerificationResponse(
      modelResponse(
        validPayload(3, {
          verdict: "contradicts",
          auditQuote: "The feature is not available for encrypted rooms.",
          reasoning: "The opened source contradicts the proposed value.",
        }),
      ),
      selectedTarget,
      pendingAttempt,
      { verifierIndex: 3, agent: "codex", command: "codex exec" },
    );

    expect(
      decideMatrixVerificationOutcome(pendingAttempt, supports),
    ).toMatchObject({
      accepted: true,
      recommendedAttemptStatus: "accepted",
      recommendedFactStatus: "verified",
      countableVerifierCount: 3,
    });

    for (const records of [
      supports.slice(0, 2),
      [supports[0], supports[1], inaccessible],
      [supports[0], supports[1], contradicts],
      [supports[0], supports[1], { ...supports[2], verifierIndex: 2 }],
    ]) {
      const decision = decideMatrixVerificationOutcome(pendingAttempt, records);

      expect(decision.accepted).toBe(false);
      expect(decision.recommendedAttemptStatus).toBe("needs-deeper-research");
      expect(decision.recommendedFactStatus).toBe("needs-deeper-research");
      expect(decision.countableVerifierCount).toBeLessThan(3);
      expect(decision.reason).toMatch(/three|3|countable|independent/i);
    }
  });
});

describe("matrix verification runner CLI", () => {
  it("uses mocked response files with bundled input without spawning a verifier", () => {
    const tempDir = makeProjectTempDir("matrix-verifier-mock-");
    const bundlePath = join(tempDir, "bundle.json");
    const fakeCodexPath = join(tempDir, "codex");
    const spawnedPath = join(tempDir, "spawned.txt");
    const responsePaths = [1, 2, 3].map((verifierIndex) =>
      join(tempDir, `response-${verifierIndex}.txt`),
    );

    try {
      writeFileSync(
        bundlePath,
        JSON.stringify({ target: selectedTarget, attempt: pendingAttempt }),
        "utf8",
      );
      for (const [idx, responsePath] of responsePaths.entries()) {
        writeFileSync(
          responsePath,
          modelResponse(validPayload(idx + 1)),
          "utf8",
        );
      }
      writeFileSync(
        fakeCodexPath,
        `#!/usr/bin/env bash
printf 'spawned' > "$MATRIX_VERIFIER_SPAWNED_FILE"
exit 99
`,
        "utf8",
      );
      chmodSync(fakeCodexPath, 0o755);

      const result = spawnSync(
        process.execPath,
        [
          verifierRunnerPath,
          "--verifier",
          "codex",
          "--attempt-bundle-file",
          bundlePath,
          "--mock-response-files",
          responsePaths.join(","),
        ],
        {
          cwd: projectDir,
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${tempDir}:${process.env.PATH ?? ""}`,
            MATRIX_VERIFIER_SPAWNED_FILE: spawnedPath,
          },
        },
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(existsSync(spawnedPath)).toBe(false);
      expect(parseJsonObject(result.stdout)).toMatchObject({
        accepted: true,
        countableVerifierCount: 3,
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("runs three separate verifier invocations and prints an accepted decision bundle", () => {
    const tempDir = makeProjectTempDir("matrix-verifier-");
    const fakeCodexPath = join(tempDir, "codex");
    const countPath = join(tempDir, "count.txt");
    const promptLogPath = join(tempDir, "prompts.log");
    const responsePaths = [1, 2, 3].map((verifierIndex) =>
      join(tempDir, `response-${verifierIndex}.txt`),
    );

    try {
      for (const [idx, responsePath] of responsePaths.entries()) {
        writeFileSync(
          responsePath,
          modelResponse(validPayload(idx + 1)),
          "utf8",
        );
      }
      writeFileSync(
        fakeCodexPath,
        `#!/usr/bin/env bash
set -euo pipefail
count=0
if [ -f "$MATRIX_VERIFIER_COUNT_FILE" ]; then
  count="$(cat "$MATRIX_VERIFIER_COUNT_FILE")"
fi
count="$((count + 1))"
printf '%s' "$count" > "$MATRIX_VERIFIER_COUNT_FILE"
prompt="$(cat)"
{
  printf 'CALL %s\\n' "$count"
  printf '%s\\n' "$prompt"
  printf 'END_CALL %s\\n' "$count"
} >> "$MATRIX_VERIFIER_PROMPT_LOG"
case "$count" in
  1) cat "$MATRIX_VERIFIER_RESPONSE_1" ;;
  2) cat "$MATRIX_VERIFIER_RESPONSE_2" ;;
  3) cat "$MATRIX_VERIFIER_RESPONSE_3" ;;
  *) echo "unexpected verifier invocation $count" >&2; exit 90 ;;
esac
`,
        "utf8",
      );
      chmodSync(fakeCodexPath, 0o755);

      const result = spawnSync(
        process.execPath,
        [
          verifierRunnerPath,
          "--verifier",
          "codex",
          "--target-json",
          JSON.stringify(selectedTarget),
          "--attempt-json",
          JSON.stringify(pendingAttempt),
          "--accessed-date",
          "2026-05-25",
          "--model",
          "gpt-verify",
        ],
        {
          cwd: projectDir,
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${tempDir}:${process.env.PATH ?? ""}`,
            MATRIX_VERIFIER_COUNT_FILE: countPath,
            MATRIX_VERIFIER_PROMPT_LOG: promptLogPath,
            MATRIX_VERIFIER_RESPONSE_1: responsePaths[0],
            MATRIX_VERIFIER_RESPONSE_2: responsePaths[1],
            MATRIX_VERIFIER_RESPONSE_3: responsePaths[2],
          },
        },
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(readFileSync(countPath, "utf8")).toBe("3");
      expect(readFileSync(promptLogPath, "utf8")).toMatch(
        /verifierIndex:\s*1/i,
      );
      expect(readFileSync(promptLogPath, "utf8")).toMatch(
        /verifierIndex:\s*2/i,
      );
      expect(readFileSync(promptLogPath, "utf8")).toMatch(
        /verifierIndex:\s*3/i,
      );

      const decision = parseJsonObject(result.stdout);
      expect(decision).toMatchObject({
        accepted: true,
        recommendedAttemptStatus: "accepted",
        recommendedFactStatus: "verified",
        countableVerifierCount: 3,
      });
      expect(
        (decision.verifications as Array<{ verifierIndex: number }>).map(
          (record) => record.verifierIndex,
        ),
      ).toEqual([1, 2, 3]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
