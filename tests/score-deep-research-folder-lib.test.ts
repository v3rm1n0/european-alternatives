import { describe, expect, it } from "vitest";

// Direct unit tests for the pure helpers in
// scripts/lib/score-deep-research-folder.mjs. The end-to-end orchestrator
// test (tests/score-deep-research-folder.test.ts) exercises these helpers
// indirectly through real subprocess fan-out, but several edge cases —
// limit: 0, entrySlug filter miss, unsorted input, empty document arrays,
// non-listed exit codes — are not reachable through that surface. Pinning
// them here protects classification + filtering against silent regressions
// during refactors.

const libraryModuleUrl = new URL(
  "../scripts/lib/score-deep-research-folder.mjs",
  import.meta.url,
);

type LibraryModule = {
  APPLY_EXIT_READY: number;
  APPLY_EXIT_ALREADY_SCORED: number;
  APPLY_EXIT_POST_CHECK_FAILED: number;
  classifyApplyExit: (exitCode: number) => "ready" | "skipped" | "failed";
  summarizeDocuments: (docs: ReadonlyArray<{ status: string }>) => {
    processed: number;
    ready: number;
    skipped: number;
    failed: number;
  };
  filterMatches: (
    matches: ReadonlyArray<{ documentPath?: string; entrySlug?: string }>,
    options: { entrySlug: string | null; limit: number | null },
  ) => Array<{ documentPath?: string; entrySlug?: string }>;
};

async function loadLib(): Promise<LibraryModule> {
  return (await import(libraryModuleUrl.href)) as LibraryModule;
}

describe("score-deep-research-folder lib — classifyApplyExit", () => {
  it("returns 'ready' for exit code 0", async () => {
    const lib = await loadLib();
    expect(lib.classifyApplyExit(0)).toBe("ready");
  });

  it("returns 'skipped' for exit code 2 (already-scored refusal)", async () => {
    const lib = await loadLib();
    expect(lib.classifyApplyExit(2)).toBe("skipped");
  });

  it("returns 'failed' for exit code 1 (generic DB failure)", async () => {
    const lib = await loadLib();
    expect(lib.classifyApplyExit(1)).toBe("failed");
  });

  it("returns 'failed' for exit code 3 (post-check failure)", async () => {
    const lib = await loadLib();
    expect(lib.classifyApplyExit(3)).toBe("failed");
  });

  it("returns 'failed' for any other non-zero/non-2 exit code (e.g. 65)", async () => {
    const lib = await loadLib();
    expect(lib.classifyApplyExit(65)).toBe("failed");
    expect(lib.classifyApplyExit(127)).toBe("failed");
  });

  it("exposes the documented exit-code constants", async () => {
    const lib = await loadLib();
    expect(lib.APPLY_EXIT_READY).toBe(0);
    expect(lib.APPLY_EXIT_ALREADY_SCORED).toBe(2);
    expect(lib.APPLY_EXIT_POST_CHECK_FAILED).toBe(3);
  });
});

describe("score-deep-research-folder lib — summarizeDocuments", () => {
  it("returns all-zero counts for an empty document list", async () => {
    const lib = await loadLib();
    expect(lib.summarizeDocuments([])).toEqual({
      processed: 0,
      ready: 0,
      skipped: 0,
      failed: 0,
    });
  });

  it("counts mixed ready / skipped / failed statuses correctly", async () => {
    const lib = await loadLib();
    const counts = lib.summarizeDocuments([
      { status: "ready" },
      { status: "ready" },
      { status: "skipped" },
      { status: "failed" },
      { status: "failed" },
      { status: "failed" },
    ]);
    expect(counts).toEqual({ processed: 6, ready: 2, skipped: 1, failed: 3 });
  });

  it("ignores unknown status values for the category counters but still bumps processed", async () => {
    const lib = await loadLib();
    // An unknown status (e.g. due to a future stage adding a new category)
    // must not be silently miscounted into ready/skipped/failed. `processed`
    // still reflects that the runner attempted the doc.
    const counts = lib.summarizeDocuments([
      { status: "ready" },
      { status: "in-progress" },
    ]);
    expect(counts.processed).toBe(2);
    expect(counts.ready).toBe(1);
    expect(counts.skipped).toBe(0);
    expect(counts.failed).toBe(0);
  });
});

describe("score-deep-research-folder lib — filterMatches", () => {
  const sample = [
    { documentPath: "/in/charlie.md", entrySlug: "charlie" },
    { documentPath: "/in/alpha.md", entrySlug: "alpha" },
    { documentPath: "/in/bravo.md", entrySlug: "bravo" },
    { documentPath: "/in/delta.md", entrySlug: "delta" },
  ];

  it("sorts unsorted input by documentPath when no filters are provided", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, { entrySlug: null, limit: null });
    expect(out.map((m) => m.entrySlug)).toEqual([
      "alpha",
      "bravo",
      "charlie",
      "delta",
    ]);
  });

  it("--entry selects only the single matching record", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, { entrySlug: "bravo", limit: null });
    expect(out.length).toBe(1);
    expect(out[0].entrySlug).toBe("bravo");
  });

  it("--entry returns an empty list when no record matches", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, {
      entrySlug: "does-not-exist",
      limit: null,
    });
    expect(out).toEqual([]);
  });

  it("--limit caps the result after sorting", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, { entrySlug: null, limit: 2 });
    expect(out.map((m) => m.entrySlug)).toEqual(["alpha", "bravo"]);
  });

  it("--limit 0 returns an empty list (caller asked for no docs)", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, { entrySlug: null, limit: 0 });
    expect(out).toEqual([]);
  });

  it("--limit greater than length returns the entire sorted list", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, { entrySlug: null, limit: 99 });
    expect(out.map((m) => m.entrySlug)).toEqual([
      "alpha",
      "bravo",
      "charlie",
      "delta",
    ]);
  });

  it("--entry combined with --limit applies both filters", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, { entrySlug: "alpha", limit: 5 });
    expect(out.length).toBe(1);
    expect(out[0].entrySlug).toBe("alpha");
  });

  it("does not mutate the input array", async () => {
    const lib = await loadLib();
    const input = [...sample];
    const before = input.map((m) => m.entrySlug);
    lib.filterMatches(input, { entrySlug: null, limit: 2 });
    expect(input.map((m) => m.entrySlug)).toEqual(before);
  });

  it("treats empty-string entrySlug as 'no filter' (matching the orchestrator's CLI default)", async () => {
    const lib = await loadLib();
    const out = lib.filterMatches(sample, { entrySlug: "", limit: null });
    expect(out.length).toBe(sample.length);
  });
});
