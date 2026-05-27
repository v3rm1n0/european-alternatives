import { describe, expect, it } from "vitest";

/**
 * Tests for issue #471: `buildMatrixResearchPrompt` must accept a
 * `mode` option. When `mode === 'deeper-research'`, the emitted prompt
 * must be stricter than the default (initial) prompt:
 *   - It must explicitly mention that this is a deeper-research retry.
 *   - It must forbid the class-6 reputable-third-party-fallback that
 *     the initial prompt allows.
 *
 * The initial prompt (no mode, or mode='initial') must remain unchanged
 * in that it still allows the class-6 fallback — this is the regression
 * check that keeps the new mode behavior orthogonal to the existing
 * source-quality-only flow.
 */

const researcherModuleUrl = new URL(
  "../scripts/lib/matrix-researcher.mjs",
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

type ResearcherModule = {
  buildMatrixResearchPrompt: (
    target: Target,
    options?: {
      accessedDate?: string;
      mode?: "initial" | "deeper-research";
      previousAttemptCount?: number;
    },
  ) => string;
};

const baseTarget: Target = {
  factId: 42,
  categoryId: "messaging",
  categoryName: "Messaging",
  entrySlug: "element",
  entryName: "Element",
  criterionKey: "e2ee",
  criterionLabel: "End-to-end encryption",
  valueType: "boolean",
  previousStatus: "needs-deeper-research",
  status: "researching",
  dryRun: false,
};

async function loadResearcherModule(): Promise<ResearcherModule> {
  return (await import(researcherModuleUrl.href)) as ResearcherModule;
}

describe("buildMatrixResearchPrompt — deeper-research mode", () => {
  it("default (initial) mode keeps the class-6 reputable-third-party fallback allowance", async () => {
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const initial = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
    });

    expect(initial).toMatch(/reputable third-party/i);
    // The initial prompt allows class-6 as a fallback — there must NOT be
    // a "forbidden" or "must not use" clause for it.
    expect(initial).not.toMatch(
      /(forbidden|must not|no fallback|class\s*6\s*is\s*not\s*allowed)/i,
    );
  });

  it("deeper-research mode marks itself as a retry of a previously unresolved fact", async () => {
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const initial = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
    });
    const deeper = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
      mode: "deeper-research",
      previousAttemptCount: 2,
    });

    // The deeper-research prompt must add explicit retry language that the
    // initial prompt does NOT contain. We assert the difference rather than
    // just a regex match — otherwise the initial prompt already contains
    // "needs-deeper-research" in policy text and the test passes trivially.
    expect(deeper).toMatch(/(retry|previous attempt|previously|earlier attempt)/i);
    expect(initial).not.toMatch(
      /(retry|previous attempt|previously|earlier attempt)/i,
    );
  });

  it("deeper-research mode forbids the class-6 reputable-third-party fallback", async () => {
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const deeper = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
      mode: "deeper-research",
    });

    // The deeper-research prompt must explicitly raise the source-quality
    // bar: third-party / class-6 fallback is no longer acceptable.
    expect(deeper).toMatch(
      /(third-party|class\s*6)[\s\S]{0,200}?(forbidden|not allowed|must not|disallowed|do not use)/i,
    );
  });

  it("does not include the deeper-research clause when mode is omitted (regression)", async () => {
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const initial = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
    });

    // No mention of "deeper research retry" or "previous attempt" in
    // initial mode — that language belongs only to deeper-research mode.
    expect(initial).not.toMatch(/deeper.?research retry|previous attempt/i);
  });

  it("treats explicit mode='initial' identically to an omitted mode option", async () => {
    // The implementation defaults to 'initial' via:
    //   const mode = options.mode === "deeper-research" ? "deeper-research" : "initial";
    // so any value other than 'deeper-research' (including the explicit
    // string 'initial') must produce the standard prompt. Without this
    // assertion a future refactor that introduces a third mode token, or
    // that switches to a stricter equality, could quietly break callers
    // that pass the option explicitly.
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const omitted = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
    });
    const explicit = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
      mode: "initial",
    });

    expect(explicit).toBe(omitted);
  });

  it("includes the previousAttemptCount in the deeper-research retry context when provided", async () => {
    // The implementation emits one of two retry-context sentences based on
    // previousAttemptCount: the specific count when > 0, or a generic
    // fallback when 0/undefined. The other deeper-research tests assert
    // the general retry shape but do not verify that a non-zero count
    // actually surfaces in the prompt — without this case the count
    // parameter could be silently dropped and the test suite would still
    // pass.
    const { buildMatrixResearchPrompt } = await loadResearcherModule();

    const withCount = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
      mode: "deeper-research",
      previousAttemptCount: 4,
    });
    const withoutCount = buildMatrixResearchPrompt(baseTarget, {
      accessedDate: "2026-05-27",
      mode: "deeper-research",
    });

    expect(withCount).toMatch(/4 earlier attempt/i);
    expect(withoutCount).not.toMatch(/\b\d+ earlier attempt/i);
    // The generic fallback wording is still present when no count is given.
    expect(withoutCount).toMatch(/earlier attempts? ended in needs-deeper-research/i);
  });
});
