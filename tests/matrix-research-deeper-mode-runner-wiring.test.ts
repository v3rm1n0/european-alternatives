import { describe, expect, it } from "vitest";

/**
 * Issue #471 regression test: end-to-end wiring between the selector
 * payload (which carries `previousStatus: 'needs-deeper-research'`) and
 * the researcher prompt produced by the runner.
 *
 * The unit test in tests/matrix-research-deeper-research-prompt.test.ts
 * verifies that `buildMatrixResearchPrompt` switches policy when called
 * with `mode: 'deeper-research'`. This test verifies that the production
 * code path in scripts/matrix-research-run.mjs actually passes that
 * `mode` through when the incoming target signals a deeper-research
 * retry — without this wiring check, the stricter prompt is dead code
 * in production (the original cause of the #471 review denial).
 */

const runnerModuleUrl = new URL(
  "../scripts/matrix-research-run.mjs",
  import.meta.url,
);

type Target = {
  factId: number;
  categoryId: string;
  categoryName: string;
  entrySlug: string;
  entryName: string;
  criterionKey: string;
  criterionLabel: string;
  valueType: string;
  previousStatus: string;
  status: string;
  dryRun: boolean;
};

type RunnerModule = {
  buildPromptForTarget: (
    target: Target,
    options?: { accessedDate?: string },
  ) => string;
};

function buildTarget(previousStatus: string): Target {
  return {
    factId: 42,
    categoryId: "messaging",
    categoryName: "Messaging",
    entrySlug: "element",
    entryName: "Element",
    criterionKey: "e2ee",
    criterionLabel: "End-to-end encryption",
    valueType: "boolean",
    previousStatus,
    status: "researching",
    dryRun: false,
  };
}

async function loadRunner(): Promise<RunnerModule> {
  return (await import(runnerModuleUrl.href)) as RunnerModule;
}

describe("matrix-research-run.mjs — deeper-research wiring", () => {
  it("emits the deeper-research prompt when target.previousStatus is 'needs-deeper-research'", async () => {
    const { buildPromptForTarget } = await loadRunner();

    const prompt = buildPromptForTarget(buildTarget("needs-deeper-research"), {
      accessedDate: "2026-05-27",
    });

    // The stricter source-quality clause from
    // scripts/lib/matrix-researcher.mjs:376-381 must be present.
    expect(prompt).toMatch(
      /(third-party|class\s*6)[\s\S]{0,200}?(forbidden|not allowed|must not|disallowed|do not use)/i,
    );
    // The retry context clause must also be present so the LLM understands
    // why the bar was raised.
    expect(prompt).toMatch(/(retry|previous attempt|previously|earlier attempt)/i);
  });

  it("emits the standard initial prompt when target.previousStatus is 'open'", async () => {
    const { buildPromptForTarget } = await loadRunner();

    const prompt = buildPromptForTarget(buildTarget("open"), {
      accessedDate: "2026-05-27",
    });

    // Initial mode still lists class 6 as a permitted fallback — no
    // "forbidden / must not / do not use" near it.
    expect(prompt).toMatch(/reputable third-party/i);
    expect(prompt).not.toMatch(
      /(third-party|class\s*6)[\s\S]{0,200}?(forbidden|not allowed|must not|disallowed|do not use)/i,
    );
    // No retry context in initial mode.
    expect(prompt).not.toMatch(/deeper.?research retry|previous attempt/i);
  });

  it("treats other previousStatus values (e.g. 'stale') as initial mode", async () => {
    const { buildPromptForTarget } = await loadRunner();

    const prompt = buildPromptForTarget(buildTarget("stale"), {
      accessedDate: "2026-05-27",
    });

    expect(prompt).not.toMatch(
      /(third-party|class\s*6)[\s\S]{0,200}?(forbidden|not allowed|must not|disallowed|do not use)/i,
    );
    expect(prompt).not.toMatch(/deeper.?research retry|previous attempt/i);
  });
});
