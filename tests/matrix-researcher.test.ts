import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const projectDir = resolve(".");
const researcherModuleUrl = new URL(
  "../scripts/lib/matrix-researcher.mjs",
  import.meta.url,
);
const researcherRunnerPath = resolve("scripts/matrix-research-run.mjs");
const beginSentinel = "BEGIN_MATRIX_FACT_RESEARCH_JSON";
const endSentinel = "END_MATRIX_FACT_RESEARCH_JSON";

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

type ResearcherCommand = {
  command: string;
  args: string[];
};

type PendingAttempt = {
  factId: number;
  agent: string;
  model: string | null;
  command: string;
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

type ResearcherModule = {
  buildMatrixResearchPrompt: (
    target: SelectedMatrixFactTarget,
    options?: { accessedDate?: string },
  ) => string;
  getResearcherCommand: (researcher: string) => ResearcherCommand;
  parseMatrixResearchResponse: (
    rawResponse: string,
    target: SelectedMatrixFactTarget,
    options: { agent: string; command: string; model?: string | null },
  ) => PendingAttempt;
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

function selectedTargetWith(
  overrides: Partial<SelectedMatrixFactTarget>,
): SelectedMatrixFactTarget {
  return { ...selectedTarget, ...overrides };
}

async function loadResearcherModule(): Promise<ResearcherModule> {
  return (await import(researcherModuleUrl.href)) as ResearcherModule;
}

function modelResponse(payload: unknown): string {
  return [
    "Research completed for the selected matrix fact.",
    beginSentinel,
    JSON.stringify(payload, null, 2),
    endSentinel,
  ].join("\n");
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    target: {
      factId: selectedTarget.factId,
      categoryId: selectedTarget.categoryId,
      entrySlug: selectedTarget.entrySlug,
      criterionKey: selectedTarget.criterionKey,
    },
    answer: {
      proposedStatus: "verified",
      proposedValue: true,
      sourceUrl: "https://example.test/element/security",
      sourceTitle: "Element security overview",
      accessedDate: "2026-05-25",
      auditQuote: "Private rooms are end-to-end encrypted by default.",
      confidence: "high",
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

describe("matrix one-fact researcher contract", () => {
  it("builds a prompt that constrains the researcher to exactly one selected fact", async () => {
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const prompt = buildMatrixResearchPrompt(selectedTarget, {
      accessedDate: "2026-05-25",
    });

    expect(prompt).toMatch(/one invocation answers one matrix fact only/i);
    expect(prompt).toMatch(
      /do not answer any other category, entry, product, or criterion/i,
    );
    expect(prompt).toContain("factId: 123");
    expect(prompt).toContain("categoryId: messaging");
    expect(prompt).toContain("entrySlug: element");
    expect(prompt).toContain("criterionKey: e2ee");
    expect(prompt).toContain("criterionLabel: End-to-end encryption");
    expect(prompt).toContain("valueType: boolean");
    expect(prompt).toMatch(/open an accessible source page/i);
    expect(prompt).toMatch(/exactly one source URL/i);
    expect(prompt).toMatch(/source title/i);
    expect(prompt).toMatch(/accessed date/i);
    expect(prompt).toMatch(/audit quote/i);
    expect(prompt).toMatch(/confidence/i);
    expect(prompt).toContain(beginSentinel);
    expect(prompt).toContain(endSentinel);
  });

  it("ranks preferred source classes and tells the researcher to bounce when none qualify", async () => {
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const prompt = buildMatrixResearchPrompt(selectedTarget, {
      accessedDate: "2026-05-25",
    });

    expect(prompt).toMatch(/preferred sources/i);
    expect(prompt).toMatch(/official (docs|documentation)/i);
    expect(prompt).toMatch(/(source repository|project's source repository)/i);
    expect(prompt).toMatch(/security whitepaper/i);
    expect(prompt).toMatch(/standards? document/i);
    expect(prompt).toMatch(/audited public documentation/i);
    expect(prompt).toMatch(/reputable third-party documentation/i);
    expect(prompt).toMatch(/(fallback|only when no official|in that order)/i);
    expect(prompt).toMatch(
      /(needs-deeper-research|do not invent).*(preferred|qualify|class)/is,
    );
    expect(prompt).toMatch(/quote/i);
  });

  it("exposes explicit codex and claude researcher command configurations without embedding prompt text", async () => {
    const { getResearcherCommand } = await loadResearcherModule();

    expect(getResearcherCommand("codex")).toMatchObject({
      command: "codex",
      args: expect.any(Array),
    });
    expect(getResearcherCommand("claude")).toMatchObject({
      command: "claude",
      args: expect.any(Array),
    });
    expect(getResearcherCommand("codex").args.join(" ")).not.toContain(
      "BEGIN_MATRIX_FACT_RESEARCH_JSON",
    );
    expect(() => getResearcherCommand("unknown")).toThrow(/researcher/i);
  });

  it("parses a valid verified answer into a pending attempt with audit fields and raw response", async () => {
    const { parseMatrixResearchResponse } = await loadResearcherModule();
    const rawResponse = modelResponse(validPayload());

    const attempt = parseMatrixResearchResponse(rawResponse, selectedTarget, {
      agent: "codex",
      command: "codex exec",
      model: "gpt-test",
    });

    expect(attempt).toMatchObject({
      factId: 123,
      agent: "codex",
      model: "gpt-test",
      command: "codex exec",
      proposedStatus: "verified",
      proposedValue: true,
      sourceUrl: "https://example.test/element/security",
      sourceTitle: "Element security overview",
      accessedDate: "2026-05-25",
      auditQuote: "Private rooms are end-to-end encrypted by default.",
      confidence: "high",
      status: "needs-verification",
    });
    expect(attempt.rawResponse).toBe(rawResponse);
  });

  it("keeps no-evidence answers out of verified pending-attempt state", async () => {
    const { parseMatrixResearchResponse } = await loadResearcherModule();
    const rawResponse = modelResponse(
      validPayload({
        proposedStatus: "needs-deeper-research",
        proposedValue: null,
        sourceUrl: "https://example.test/element/help",
        sourceTitle: "Element help center",
        auditQuote:
          "This page does not document the requested encryption scope.",
        confidence: "low",
      }),
    );

    const attempt = parseMatrixResearchResponse(rawResponse, selectedTarget, {
      agent: "claude",
      command: "claude",
    });

    expect(attempt.proposedStatus).toBe("needs-deeper-research");
    expect(attempt.proposedValue).toBeNull();
    expect(attempt.status).toBe("needs-deeper-research");
    expect(attempt.status).not.toBe("needs-verification");
  });

  it("rejects malformed, multi-fact, sourceless, quote-less, and mismatched responses", async () => {
    const { parseMatrixResearchResponse } = await loadResearcherModule();
    const invalidResponses = [
      {
        name: "missing sentinels",
        response: JSON.stringify(validPayload()),
        error: /sentinel|BEGIN_MATRIX_FACT_RESEARCH_JSON/i,
      },
      {
        name: "malformed json",
        response: `${beginSentinel}\n{"target":\n${endSentinel}`,
        error: /json/i,
      },
      {
        name: "multi-fact answers",
        response: modelResponse({ answers: [validPayload(), validPayload()] }),
        error: /multi|one|answers|plural/i,
      },
      {
        name: "missing source url",
        response: modelResponse(validPayload({ sourceUrl: "" })),
        error: /sourceUrl|source URL/i,
      },
      {
        name: "non-http source url",
        response: modelResponse(
          validPayload({ sourceUrl: "file:///tmp/source.html" }),
        ),
        error: /sourceUrl|http|https/i,
      },
      {
        name: "invalid accessed date",
        response: modelResponse(validPayload({ accessedDate: "25-05-2026" })),
        error: /accessedDate|YYYY-MM-DD/i,
      },
      {
        name: "missing audit quote",
        response: modelResponse(validPayload({ auditQuote: "" })),
        error: /auditQuote|audit quote/i,
      },
      {
        name: "invalid confidence",
        response: modelResponse(validPayload({ confidence: "certain" })),
        error: /confidence|high|medium|low/i,
      },
      {
        name: "mismatched target",
        response: modelResponse({
          ...validPayload(),
          target: {
            factId: 999,
            categoryId: "messaging",
            entrySlug: "element",
            criterionKey: "e2ee",
          },
        }),
        error: /target|factId/i,
      },
    ];

    for (const invalidResponse of invalidResponses) {
      expect(
        () =>
          parseMatrixResearchResponse(
            invalidResponse.response,
            selectedTarget,
            {
              agent: "codex",
              command: "codex exec",
            },
          ),
        invalidResponse.name,
      ).toThrow(invalidResponse.error);
    }
  });

  it("validates proposed values against the selected matrix value type", async () => {
    const { parseMatrixResearchResponse } = await loadResearcherModule();

    expect(() =>
      parseMatrixResearchResponse(
        modelResponse(validPayload({ proposedValue: "yes" })),
        selectedTarget,
        { agent: "codex", command: "codex exec" },
      ),
    ).toThrow(/boolean|valueType|proposedValue/i);

    const enumTarget = selectedTargetWith({
      criterionKey: "platforms",
      criterionLabel: "Supported platforms",
      valueType: "multi_enum",
    });
    const enumResponse = modelResponse({
      target: {
        factId: enumTarget.factId,
        categoryId: enumTarget.categoryId,
        entrySlug: enumTarget.entrySlug,
        criterionKey: enumTarget.criterionKey,
      },
      answer: {
        proposedStatus: "verified",
        proposedValue: ["web", "desktop"],
        sourceUrl: "https://example.test/element/platforms",
        sourceTitle: "Element platforms",
        accessedDate: "2026-05-25",
        auditQuote: "Element is available on Web, Desktop, iOS and Android.",
        confidence: "medium",
      },
    });

    expect(
      parseMatrixResearchResponse(enumResponse, enumTarget, {
        agent: "codex",
        command: "codex exec",
      }).proposedValue,
    ).toEqual(["web", "desktop"]);
  });

  it("accepts each scalar matrix value type with the expected value shape", async () => {
    const { parseMatrixResearchResponse } = await loadResearcherModule();
    const scalarCases: Array<{
      valueType: SelectedMatrixFactTarget["valueType"];
      criterionKey: string;
      proposedValue: number | string;
    }> = [
      { valueType: "number", criterionKey: "founded", proposedValue: 2016 },
      {
        valueType: "text",
        criterionKey: "license",
        proposedValue: "Apache-2.0",
      },
      { valueType: "enum", criterionKey: "hosting", proposedValue: "eu" },
      {
        valueType: "url",
        criterionKey: "securityPage",
        proposedValue: "https://example.test/security",
      },
      {
        valueType: "date",
        criterionKey: "lastAudit",
        proposedValue: "2026-05-25",
      },
    ];

    for (const scalarCase of scalarCases) {
      const target = selectedTargetWith({
        criterionKey: scalarCase.criterionKey,
        criterionLabel: scalarCase.criterionKey,
        valueType: scalarCase.valueType,
      });
      const response = modelResponse({
        target: {
          factId: target.factId,
          categoryId: target.categoryId,
          entrySlug: target.entrySlug,
          criterionKey: target.criterionKey,
        },
        answer: {
          proposedStatus: "verified",
          proposedValue: scalarCase.proposedValue,
          sourceUrl: "https://example.test/source",
          sourceTitle: "Example source",
          accessedDate: "2026-05-25",
          auditQuote: "This source supports the requested matrix fact.",
          confidence: "medium",
        },
      });

      expect(
        parseMatrixResearchResponse(response, target, {
          agent: "codex",
          command: "codex exec",
        }).proposedValue,
        scalarCase.valueType,
      ).toBe(scalarCase.proposedValue);
    }
  });
});

describe("matrix research runner CLI", () => {
  it("uses mocked researcher output to print one parsed pending attempt without a live model call", () => {
    const tempDir = makeProjectTempDir("matrix-researcher-");
    const mockResponsePath = join(tempDir, "response.txt");

    try {
      writeFileSync(mockResponsePath, modelResponse(validPayload()), "utf8");

      const result = spawnSync(
        process.execPath,
        [
          researcherRunnerPath,
          "--researcher",
          "claude",
          "--target-json",
          JSON.stringify(selectedTarget),
          "--mock-response-file",
          mockResponsePath,
          "--accessed-date",
          "2026-05-25",
        ],
        { cwd: projectDir, encoding: "utf8" },
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe("");
      expect(parseJsonObject(result.stdout)).toMatchObject({
        factId: 123,
        agent: "claude",
        proposedStatus: "verified",
        proposedValue: true,
        sourceUrl: "https://example.test/element/security",
        sourceTitle: "Element security overview",
        accessedDate: "2026-05-25",
        auditQuote: "Private rooms are end-to-end encrypted by default.",
        confidence: "high",
        status: "needs-verification",
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("loads mocked researcher targets from file and stdin", () => {
    const tempDir = makeProjectTempDir("matrix-researcher-");
    const mockResponsePath = join(tempDir, "response.txt");
    const targetPath = join(tempDir, "target.json");

    try {
      writeFileSync(mockResponsePath, modelResponse(validPayload()), "utf8");
      writeFileSync(targetPath, JSON.stringify(selectedTarget), "utf8");

      const fileResult = spawnSync(
        process.execPath,
        [
          researcherRunnerPath,
          "--researcher",
          "codex",
          "--target-file",
          targetPath,
          "--mock-response-file",
          mockResponsePath,
          "--accessed-date",
          "2026-05-25",
        ],
        { cwd: projectDir, encoding: "utf8" },
      );
      const stdinResult = spawnSync(
        process.execPath,
        [
          researcherRunnerPath,
          "--researcher",
          "codex",
          "--target-json-stdin",
          "--mock-response-file",
          mockResponsePath,
          "--accessed-date",
          "2026-05-25",
        ],
        {
          cwd: projectDir,
          encoding: "utf8",
          input: JSON.stringify(selectedTarget),
        },
      );

      expect(fileResult.status).toBe(0);
      expect(parseJsonObject(fileResult.stdout)).toMatchObject({
        factId: 123,
        status: "needs-verification",
      });
      expect(stdinResult.status).toBe(0);
      expect(parseJsonObject(stdinResult.stdout)).toMatchObject({
        factId: 123,
        status: "needs-verification",
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects dry-run and unclaimed selected targets before parsing a pending attempt", () => {
    const tempDir = makeProjectTempDir("matrix-researcher-");
    const mockResponsePath = join(tempDir, "response.txt");
    const rejectedTargets = [
      {
        name: "dry-run target",
        target: selectedTargetWith({ dryRun: true }),
        error: /dry-run/i,
      },
      {
        name: "open target",
        target: selectedTargetWith({ status: "open" }),
        error: /status|researching/i,
      },
    ];

    try {
      writeFileSync(mockResponsePath, modelResponse(validPayload()), "utf8");

      for (const rejectedTarget of rejectedTargets) {
        const result = spawnSync(
          process.execPath,
          [
            researcherRunnerPath,
            "--researcher",
            "codex",
            "--target-json",
            JSON.stringify(rejectedTarget.target),
            "--mock-response-file",
            mockResponsePath,
            "--accessed-date",
            "2026-05-25",
          ],
          { cwd: projectDir, encoding: "utf8" },
        );

        expect(result.status, rejectedTarget.name).not.toBe(0);
        expect(result.stdout, rejectedTarget.name).toBe("");
        expect(result.stderr, rejectedTarget.name).toMatch(
          rejectedTarget.error,
        );
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects invalid mocked output with a non-zero exit and parser error on stderr", () => {
    const tempDir = makeProjectTempDir("matrix-researcher-");
    const mockResponsePath = join(tempDir, "response.txt");

    try {
      writeFileSync(
        mockResponsePath,
        modelResponse(validPayload({ sourceUrl: "" })),
        "utf8",
      );

      const result = spawnSync(
        process.execPath,
        [
          researcherRunnerPath,
          "--researcher",
          "codex",
          "--target-json",
          JSON.stringify(selectedTarget),
          "--mock-response-file",
          mockResponsePath,
          "--accessed-date",
          "2026-05-25",
        ],
        { cwd: projectDir, encoding: "utf8" },
      );

      expect(result.status).not.toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toMatch(/sourceUrl|source URL|parse/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects mocked outputs that answer multiple facts or omit source quotes", () => {
    const invalidMockResponses = [
      {
        name: "multiple facts",
        response: modelResponse({
          answers: [validPayload(), validPayload({ proposedValue: false })],
        }),
        error: /multi|one|answers|plural|parse/i,
      },
      {
        name: "missing audit quote",
        response: modelResponse(validPayload({ auditQuote: "" })),
        error: /auditQuote|audit quote|parse/i,
      },
    ];

    for (const invalidMockResponse of invalidMockResponses) {
      const tempDir = makeProjectTempDir("matrix-researcher-");
      const mockResponsePath = join(tempDir, "response.txt");

      try {
        writeFileSync(mockResponsePath, invalidMockResponse.response, "utf8");

        const result = spawnSync(
          process.execPath,
          [
            researcherRunnerPath,
            "--researcher",
            "codex",
            "--target-json",
            JSON.stringify(selectedTarget),
            "--mock-response-file",
            mockResponsePath,
            "--accessed-date",
            "2026-05-25",
          ],
          { cwd: projectDir, encoding: "utf8" },
        );

        expect(result.status, invalidMockResponse.name).not.toBe(0);
        expect(result.stdout, invalidMockResponse.name).toBe("");
        expect(result.stderr, invalidMockResponse.name).toMatch(
          invalidMockResponse.error,
        );
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});
