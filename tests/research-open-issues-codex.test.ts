import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
// existsSync is kept because readCalls() probes whether the per-issue/gh
// record log file exists before reading.
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const projectDir = resolve(".");
const batchShellScriptPath = resolve("scripts/research-open-issues-codex.sh");
const baselineRepo = "TheMorpheus407/european-alternatives";

type IssueRecord = {
  number: number;
  title: string;
  body: string;
  url: string;
  labels?: Array<{ name: string }>;
};

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });

  return mkdtempSync(join(tempRoot, prefix));
}

/**
 * Writes a fake `gh` onto a temp directory and returns its location plus the
 * record-log path. The shim responds to `gh issue list ... --json ...` by
 * printing the JSON written to `<tempDir>/gh-issue-list.json`, and records
 * every invocation argv in `<tempDir>/gh-calls.log` (CALL-framed, one arg per
 * line — same layout as in tests/finalize-issue-codex.test.ts).
 */
function writeFakeGh(
  tempDir: string,
  issueListJsonPath: string,
): { fakeGhPath: string; recordPath: string } {
  const fakeGhPath = join(tempDir, "gh");
  const recordPath = join(tempDir, "gh-calls.log");

  writeFileSync(
    fakeGhPath,
    `#!/usr/bin/env bash
set -u
: "\${EUROALT_GH_RECORD:?fake gh requires EUROALT_GH_RECORD env var}"
printf 'CALL\\n' >> "$EUROALT_GH_RECORD"
for arg in "$@"; do
    printf '%s\\n' "$arg" >> "$EUROALT_GH_RECORD"
done
if [[ "\${1:-}" == "issue" && "\${2:-}" == "list" ]]; then
    cat ${JSON.stringify(issueListJsonPath)}
    exit 0
fi
printf '%s\\n' "EXIT=1 (unhandled gh subcommand: \${1:-} \${2:-})" >> "$EUROALT_GH_RECORD"
exit 1
`,
    "utf8",
  );
  chmodSync(fakeGhPath, 0o755);

  return { fakeGhPath, recordPath };
}

/**
 * Writes a fake "single-issue runner" shim. The batch runner is expected to
 * invoke this command (configurable via EUROALT_PROCESS_ISSUE_CMD) once per
 * selected issue, sequentially, with the issue number as the first positional
 * argv. The shim records every invocation argv (CALL-framed) and reads a
 * per-issue exit code from `<tempDir>/exits.json` keyed by issue number,
 * defaulting to 0.
 */
function writeFakeProcessIssue(
  tempDir: string,
  exitsByIssue: Record<string, number>,
): { processIssuePath: string; recordPath: string } {
  const processIssuePath = join(tempDir, "process-issue.sh");
  const recordPath = join(tempDir, "process-issue-calls.log");
  const exitsPath = join(tempDir, "exits.json");

  writeFileSync(exitsPath, JSON.stringify(exitsByIssue), "utf8");

  writeFileSync(
    processIssuePath,
    `#!/usr/bin/env bash
set -u
: "\${EUROALT_PROCESS_RECORD:?fake process-issue requires EUROALT_PROCESS_RECORD env var}"
printf 'CALL\\n' >> "$EUROALT_PROCESS_RECORD"
for arg in "$@"; do
    printf '%s\\n' "$arg" >> "$EUROALT_PROCESS_RECORD"
done
# First positional should be the issue number.
issue=""
for arg in "$@"; do
    if [[ "$arg" =~ ^[0-9]+$ ]]; then
        issue="$arg"
        break
    fi
done
exit_code=$(node -e "const m=JSON.parse(require('fs').readFileSync(${JSON.stringify(exitsPath)},'utf8')); process.stdout.write(String(m[process.argv[1]] ?? 0))" "$issue")
printf '%s\\n' "EXIT=\${exit_code}" >> "$EUROALT_PROCESS_RECORD"
exit "$exit_code"
`,
    "utf8",
  );
  chmodSync(processIssuePath, 0o755);

  return { processIssuePath, recordPath };
}

function readCalls(recordPath: string): string[][] {
  if (!existsSync(recordPath)) {
    return [];
  }

  const text = readFileSync(recordPath, "utf8");
  const lines = text.split("\n");
  const calls: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    if (line === "CALL") {
      if (current !== null) {
        calls.push(current);
      }
      current = [];
      continue;
    }
    if (line.startsWith("EXIT=")) {
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

function runBatch(
  args: string[],
  options: {
    pathPrefix?: string;
    ghRecordPath?: string;
    processCmd?: string;
    processRecordPath?: string;
    repoEnv?: string;
  } = {},
) {
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;

  if (options.pathPrefix !== undefined) {
    env.PATH = `${options.pathPrefix}:${process.env.PATH ?? ""}`;
  }
  if (options.ghRecordPath !== undefined) {
    env.EUROALT_GH_RECORD = options.ghRecordPath;
  }
  if (options.processCmd !== undefined) {
    env.EUROALT_PROCESS_ISSUE_CMD = options.processCmd;
  }
  if (options.processRecordPath !== undefined) {
    env.EUROALT_PROCESS_RECORD = options.processRecordPath;
  }
  if (options.repoEnv !== undefined) {
    env.EUROALT_REPO = options.repoEnv;
  }

  return spawnSync("bash", [batchShellScriptPath, ...args], {
    cwd: projectDir,
    encoding: "utf8",
    env,
  });
}

describe("research-open-issues-codex bash entrypoint", () => {
  it("prints --help usage without invoking gh or the per-issue runner", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        join(tempDir, "issues.json"),
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});
      // No issues.json needed for --help.
      writeFileSync(join(tempDir, "issues.json"), "[]", "utf8");

      const result = runBatch(["--help"], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/usage/i);
      expect(readCalls(ghRecordPath).length).toBe(0);
      expect(readCalls(processRecordPath).length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits with usage error code 64 on unknown options", () => {
    const result = spawnSync("bash", [batchShellScriptPath, "--no-such-flag"], {
      cwd: projectDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/unknown/i);
  });
});

describe("research-open-issues-codex — discovery filtering", () => {
  it("selects proposal-template, legacy proposal-title, [Alternative]-prefix, correction-title issues and skips off-topic issues", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      const issues: IssueRecord[] = [
        {
          number: 101,
          title: "New Alternative: Foo",
          body: "manual proposal text",
          url: "https://example/101",
        },
        {
          number: 102,
          title: "Some unrelated label",
          body: "### Name\n\nBar\n\n### Website\n\n_No response_",
          url: "https://example/102",
        },
        {
          number: 103,
          title: "Wrong information for DNS.SB",
          body: "Country is listed as DE but the company is registered in NL.",
          url: "https://example/103",
        },
        {
          number: 104,
          title: "[Alternative]: Baz",
          body: "manual proposal in new title style",
          url: "https://example/104",
        },
        {
          number: 105,
          title: "Feature request: dark mode toggle",
          body: "Please add a dark-mode switch in the header.",
          url: "https://example/105",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      const processCalls = readCalls(processRecordPath);
      const calledIssueNumbers = processCalls
        .map((argv) => argv.find((arg) => /^\d+$/.test(arg)))
        .filter((n): n is string => typeof n === "string");

      // 101, 102, 103, 104 selected; 105 skipped.
      expect(new Set(calledIssueNumbers)).toEqual(
        new Set(["101", "102", "103", "104"]),
      );
      expect(calledIssueNumbers).not.toContain("105");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("deduplicates a number that appears twice in the discovery payload", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      const issues: IssueRecord[] = [
        {
          number: 222,
          title: "New Alternative: Dup",
          body: "first copy",
          url: "https://example/222a",
        },
        {
          number: 222,
          title: "New Alternative: Dup",
          body: "second copy",
          url: "https://example/222b",
        },
        {
          number: 333,
          title: "New Alternative: Other",
          body: "",
          url: "https://example/333",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      const calls = readCalls(processRecordPath);
      const calledFor222 = calls.filter((argv) => argv.includes("222"));
      const calledFor333 = calls.filter((argv) => argv.includes("333"));

      expect(calledFor222.length).toBe(1);
      expect(calledFor333.length).toBe(1);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("research-open-issues-codex — sequencing and fail-closed propagation", () => {
  it("invokes the single-issue runner sequentially in discovery order", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      const issues: IssueRecord[] = [
        {
          number: 401,
          title: "New Alternative: First",
          body: "",
          url: "https://example/401",
        },
        {
          number: 402,
          title: "New Alternative: Second",
          body: "",
          url: "https://example/402",
        },
        {
          number: 403,
          title: "Wrong information for X",
          body: "",
          url: "https://example/403",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      const calls = readCalls(processRecordPath);
      // Three sequential calls, in discovery order.
      expect(calls.length).toBe(3);
      const orderedNumbers = calls.map(
        (argv) => argv.find((arg) => /^\d+$/.test(arg)) ?? "",
      );
      expect(orderedNumbers).toEqual(["401", "402", "403"]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("continues to the next issue when the single-issue runner exits 65 (fail-closed/unsupported)", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      const issues: IssueRecord[] = [
        {
          number: 501,
          title: "New Alternative: A",
          body: "",
          url: "https://example/501",
        },
        {
          number: 502,
          title: "New Alternative: B",
          body: "",
          url: "https://example/502",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, { "501": 65 });

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      // Batch must not abort on a per-issue 65 — both issues are processed,
      // and the overall run exits 0 (per AC "Failed/unsupported/unverified
      // issues remain open and uncommented" — that is a per-issue skip,
      // not a batch failure).
      expect(result.status).toBe(0);

      const calls = readCalls(processRecordPath);
      const numbers = calls
        .map((argv) => argv.find((arg) => /^\d+$/.test(arg)))
        .filter((n): n is string => typeof n === "string");
      expect(numbers).toEqual(["501", "502"]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("continues to the next issue when the single-issue runner exits 1 (generic error)", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      const issues: IssueRecord[] = [
        {
          number: 601,
          title: "New Alternative: A",
          body: "",
          url: "https://example/601",
        },
        {
          number: 602,
          title: "Wrong information for B",
          body: "",
          url: "https://example/602",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, { "601": 1 });

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      const calls = readCalls(processRecordPath);
      const numbers = calls
        .map((argv) => argv.find((arg) => /^\d+$/.test(arg)))
        .filter((n): n is string => typeof n === "string");
      expect(numbers).toEqual(["601", "602"]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("research-open-issues-codex — dry-run", () => {
  it("passes --dry-run through to every per-issue invocation", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      const issues: IssueRecord[] = [
        {
          number: 701,
          title: "New Alternative: First",
          body: "",
          url: "https://example/701",
        },
        {
          number: 702,
          title: "Wrong information for Second",
          body: "",
          url: "https://example/702",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const result = runBatch(["--dry-run"], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      const calls = readCalls(processRecordPath);
      expect(calls.length).toBe(2);
      for (const argv of calls) {
        expect(argv).toContain("--dry-run");
      }

      // gh discovery is read-only — it must still be called exactly once
      // (single `gh issue list` invocation), and there must be zero
      // `gh issue comment` or `gh issue close` calls from the batch
      // runner itself.
      const ghCalls = readCalls(ghRecordPath);
      const listCalls = ghCalls.filter(
        (argv) => argv.includes("list") && argv.includes("issue"),
      );
      const mutationCalls = ghCalls.filter(
        (argv) =>
          argv.includes("issue") &&
          (argv.includes("comment") || argv.includes("close")),
      );
      expect(listCalls.length).toBeGreaterThanOrEqual(1);
      expect(mutationCalls.length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("research-open-issues-codex — CLI option propagation", () => {
  it("forwards --repo CLI argument to gh issue list (overriding EUROALT_REPO default)", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      writeFileSync(issueListJsonPath, "[]", "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const overrideRepo = "some-other-owner/some-other-repo";
      const result = runBatch(["--repo", overrideRepo], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      const ghCalls = readCalls(ghRecordPath);
      const listCall = ghCalls.find(
        (argv) => argv.includes("issue") && argv.includes("list"),
      );
      expect(listCall).toBeDefined();
      const listArgv = listCall ?? [];
      const repoFlagIndex = listArgv.indexOf("--repo");
      expect(repoFlagIndex).toBeGreaterThanOrEqual(0);
      expect(listArgv[repoFlagIndex + 1]).toBe(overrideRepo);
      // The CLI override wins — the env-provided baselineRepo must not
      // appear as the --repo value.
      expect(listArgv[repoFlagIndex + 1]).not.toBe(baselineRepo);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("forwards --limit CLI argument to gh issue list", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      writeFileSync(issueListJsonPath, "[]", "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const result = runBatch(["--limit", "42"], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      const ghCalls = readCalls(ghRecordPath);
      const listCall = ghCalls.find(
        (argv) => argv.includes("issue") && argv.includes("list"),
      );
      expect(listCall).toBeDefined();
      const listArgv = listCall ?? [];
      const limitFlagIndex = listArgv.indexOf("--limit");
      expect(limitFlagIndex).toBeGreaterThanOrEqual(0);
      expect(listArgv[limitFlagIndex + 1]).toBe("42");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits 64 when --repo is given without a value", () => {
    const result = spawnSync("bash", [batchShellScriptPath, "--repo"], {
      cwd: projectDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/--repo/);
  });

  it("exits 64 when --limit is given without a value", () => {
    const result = spawnSync("bash", [batchShellScriptPath, "--limit"], {
      cwd: projectDir,
      encoding: "utf8",
    });

    expect(result.status).toBe(64);
    expect(result.stderr).toMatch(/--limit/);
  });
});

describe("research-open-issues-codex — empty discovery", () => {
  it("emits 'no candidate issues found' and skips the per-issue runner when discovery returns zero matches", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      // Three issues — none match any discovery heuristic.
      const issues: IssueRecord[] = [
        {
          number: 801,
          title: "Feature request: better dark mode",
          body: "I would love a darker shade in the header bar.",
          url: "https://example/801",
        },
        {
          number: 802,
          title: "Question: how do I export data?",
          body: "Is there a CSV export anywhere?",
          url: "https://example/802",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/no candidate issues found/i);
      expect(readCalls(processRecordPath).length).toBe(0);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("research-open-issues-codex — result.json surfacing", () => {
  it("reads classification + writes_applied from tmp/issues/<n>/result.json and echoes a structured line", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      const issues: IssueRecord[] = [
        {
          number: 901,
          title: "Wrong information for Vendor X",
          body: "country is wrong",
          url: "https://example/901",
        },
        {
          number: 902,
          title: "New Alternative: Foo",
          body: "manual proposal",
          url: "https://example/902",
        },
      ];
      writeFileSync(issueListJsonPath, JSON.stringify(issues), "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );

      // Custom shim that writes a result.json next to where the batch
      // runner reads it: tmp/issues/<n>/result.json under the project root.
      const shimPath = join(tempDir, "process-issue-with-result.sh");
      const shimScript = `#!/usr/bin/env bash
set -u
issue="$1"
mkdir -p "tmp/issues/$issue"
if [[ "$issue" == "901" ]]; then
    cat > "tmp/issues/$issue/result.json" <<EOF
{"issueNumber": 901, "classification": "catalog_fact_correction", "writes_applied": true, "outcome": "applied", "dryRun": false}
EOF
    exit 0
else
    cat > "tmp/issues/$issue/result.json" <<EOF
{"issueNumber": $issue, "classification": "unsupported_or_unclear", "writes_applied": false, "outcome": "skipped_unsupported", "dryRun": false}
EOF
    exit 65
fi
`;
      writeFileSync(shimPath, shimScript, "utf8");
      chmodSync(shimPath, 0o755);

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${shimPath}`,
        repoEnv: baselineRepo,
      });

      expect(result.status).toBe(0);

      // The structured line for the fact-correction issue must mention
      // its classification AND that writes were applied.
      expect(result.stdout).toMatch(
        /issue #901.*classification=catalog_fact_correction.*writes=yes/,
      );
      // The unsupported issue must mention its classification AND
      // writes=no.
      expect(result.stdout).toMatch(
        /issue #902.*classification=unsupported_or_unclear.*writes=no/,
      );

      // Clean up the per-issue tmp dirs the shim created under the
      // project root (the test framework only owns tempDir).
      rmSync(join(projectDir, "tmp/issues/901"), {
        recursive: true,
        force: true,
      });
      rmSync(join(projectDir, "tmp/issues/902"), {
        recursive: true,
        force: true,
      });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("research-open-issues-codex — default per-issue command", () => {
  it("ships scripts/process-suggestion-issue-codex.sh as the executable default orchestrator", () => {
    const defaultOrchestrator = resolve(
      "scripts/process-suggestion-issue-codex.sh",
    );

    // The batch runner's default EUROALT_PROCESS_ISSUE_CMD invokes this
    // file. If it is missing or not executable, a clean checkout will
    // skip every selected issue with rc=127 — the regression we are
    // guarding against.
    expect(existsSync(defaultOrchestrator)).toBe(true);

    const mode = statSync(defaultOrchestrator).mode;
    // Owner-execute bit must be set.
    expect((mode & 0o100) !== 0).toBe(true);
  });
});

describe("research-open-issues-codex — discovery query shape", () => {
  it("queries gh issue list with --state open and requests number/title/body/url JSON fields", () => {
    const tempDir = makeProjectTempDir("batch-runner-");

    try {
      const issueListJsonPath = join(tempDir, "issues.json");
      writeFileSync(issueListJsonPath, "[]", "utf8");

      const { recordPath: ghRecordPath } = writeFakeGh(
        tempDir,
        issueListJsonPath,
      );
      const { processIssuePath, recordPath: processRecordPath } =
        writeFakeProcessIssue(tempDir, {});

      const result = runBatch([], {
        pathPrefix: tempDir,
        ghRecordPath,
        processCmd: `bash ${processIssuePath}`,
        processRecordPath,
        repoEnv: baselineRepo,
      });

      // No issues to process — exit 0 with no per-issue calls.
      expect(result.status).toBe(0);
      expect(readCalls(processRecordPath).length).toBe(0);

      const ghCalls = readCalls(ghRecordPath);
      expect(ghCalls.length).toBeGreaterThanOrEqual(1);
      const listCall = ghCalls.find(
        (argv) => argv.includes("issue") && argv.includes("list"),
      );
      expect(listCall).toBeDefined();
      const listArgv = listCall ?? [];
      expect(listArgv).toContain("--state");
      expect(listArgv).toContain("open");
      // Discovery must include enough JSON fields to apply all three
      // discovery heuristics (body + title + number + url).
      const jsonFlagIndex = listArgv.indexOf("--json");
      expect(jsonFlagIndex).toBeGreaterThanOrEqual(0);
      const jsonFieldsArg = listArgv[jsonFlagIndex + 1] ?? "";
      expect(jsonFieldsArg).toMatch(/number/);
      expect(jsonFieldsArg).toMatch(/title/);
      expect(jsonFieldsArg).toMatch(/body/);
      // --repo must be passed so the runner is repo-portable.
      expect(listArgv).toContain("--repo");
      expect(listArgv).toContain(baselineRepo);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
