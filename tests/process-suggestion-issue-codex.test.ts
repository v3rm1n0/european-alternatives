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

import { afterEach, describe, expect, it } from "vitest";

const projectDir = resolve(".");
const orchestratorPath = resolve("scripts/process-suggestion-issue-codex.sh");

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });

  return mkdtempSync(join(tempRoot, prefix));
}

/**
 * Writes a fake stage shim that records every invocation argv (CALL-framed,
 * one arg per line) into a single shared record file under `tempDir`. The
 * shim prints `stdoutPayload` to stdout (so the orchestrator captures it
 * into the next stage's input file) and exits with `exitCode`.
 *
 * `stageName` identifies the stage in the record so tests can distinguish
 * which stage was called and in which order.
 */
function writeFakeStage(
  tempDir: string,
  stageName: string,
  recordPath: string,
  stdoutPayload: string,
  exitCode: number,
): string {
  const shimPath = join(tempDir, `stage-${stageName}.sh`);
  const stdoutPath = join(tempDir, `stage-${stageName}.stdout`);
  writeFileSync(stdoutPath, stdoutPayload, "utf8");

  writeFileSync(
    shimPath,
    `#!/usr/bin/env bash
set -u
{
  printf 'CALL\\n'
  printf 'STAGE=%s\\n' ${JSON.stringify(stageName)}
  for arg in "$@"; do
      printf '%s\\n' "$arg"
  done
  printf 'EXIT=%s\\n' ${JSON.stringify(String(exitCode))}
} >> ${JSON.stringify(recordPath)}
cat ${JSON.stringify(stdoutPath)}
exit ${exitCode}
`,
    "utf8",
  );
  chmodSync(shimPath, 0o755);

  return shimPath;
}

function writeFeedbackVerifierStage(
  tempDir: string,
  recordPath: string,
  issueNumber: number,
  options: { failuresBeforeSuccess: number },
): string {
  const shimPath = join(tempDir, "stage-verify-feedback.sh");
  const successPath = join(tempDir, "stage-verify-success.stdout");
  const feedbackPath = join(tempDir, "stage-verify-feedback.json");
  const countPath = join(tempDir, "stage-verify-count.txt");

  writeFileSync(successPath, verifiedStdout(issueNumber), "utf8");
  writeFileSync(
    feedbackPath,
    `${JSON.stringify(
      {
        issueNumber,
        action: "catalog_fact_correction",
        retryable: true,
        failedEvidence: [
          {
            path: "factCorrection.evidence[0]",
            changeIndex: 0,
            table: "catalog_entries",
            column: "country_code",
            proposedValue: "fr",
            verdict: "inconclusive",
            sourceUrl: "https://societe.com/element-fr",
            sourceTitle: "Element - Societe.com",
            auditQuote: "Element SAS, France.",
            reasoning:
              "The verifier could not confirm the proposed jurisdiction.",
          },
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  writeFileSync(
    shimPath,
    `#!/usr/bin/env bash
set -u
count=0
if [[ -f ${JSON.stringify(countPath)} ]]; then
  count="$(cat ${JSON.stringify(countPath)})"
fi
count=$((count + 1))
printf '%s\\n' "$count" > ${JSON.stringify(countPath)}

{
  printf 'CALL\\n'
  printf 'STAGE=verify\\n'
  for arg in "$@"; do
      printf '%s\\n' "$arg"
  done
} >> ${JSON.stringify(recordPath)}

feedback_file=""
previous=""
for arg in "$@"; do
  if [[ "$previous" == "--feedback-output-file" ]]; then
    feedback_file="$arg"
  fi
  previous="$arg"
done

if [[ ${String(options.failuresBeforeSuccess)} -ge 0 && "$count" -gt ${String(options.failuresBeforeSuccess)} ]]; then
  printf 'EXIT=0\\n' >> ${JSON.stringify(recordPath)}
  cat ${JSON.stringify(successPath)}
  exit 0
fi

if [[ -n "$feedback_file" ]]; then
  cp ${JSON.stringify(feedbackPath)} "$feedback_file"
fi
printf 'verifier feedback written for attempt %s\\n' "$count" >&2
printf 'EXIT=65\\n' >> ${JSON.stringify(recordPath)}
exit 65
`,
    "utf8",
  );
  chmodSync(shimPath, 0o755);

  return shimPath;
}

type StageCall = {
  stage: string;
  args: string[];
};

function argValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  return index === -1 ? undefined : args[index + 1];
}

function readStageCalls(recordPath: string): StageCall[] {
  if (!existsSync(recordPath)) {
    return [];
  }

  const text = readFileSync(recordPath, "utf8");
  const lines = text.split("\n");
  const calls: StageCall[] = [];
  let current: { stage: string; args: string[] } | null = null;

  for (const line of lines) {
    if (line === "CALL") {
      if (current !== null) {
        calls.push(current);
      }
      current = { stage: "", args: [] };
      continue;
    }
    if (current === null) {
      continue;
    }
    if (line.startsWith("STAGE=")) {
      current.stage = line.slice("STAGE=".length);
      continue;
    }
    if (line.startsWith("EXIT=")) {
      continue;
    }
    if (line !== "") {
      current.args.push(line);
    }
  }

  if (current !== null) {
    calls.push(current);
  }

  return calls;
}

function classificationStdout(action: string, issueNumber: number): string {
  return `${JSON.stringify(
    {
      issueNumber,
      action,
      dryRun: false,
      targetEntrySlug: action === "catalog_fact_correction" ? "vendor-x" : null,
    },
    null,
    2,
  )}\n`;
}

function researchStdout(issueNumber: number): string {
  return `${JSON.stringify(
    {
      issueNumber,
      action: "catalog_fact_correction",
      dryRun: false,
      factCorrection: {
        targetEntrySlug: "vendor-x",
        changes: [],
      },
    },
    null,
    2,
  )}\n`;
}

function verifiedStdout(issueNumber: number): string {
  return `${JSON.stringify(
    {
      issueNumber,
      action: "catalog_fact_correction",
      dryRun: false,
      factCorrection: {
        targetEntrySlug: "vendor-x",
        changes: [],
      },
      verifierEvidence: [],
    },
    null,
    2,
  )}\n`;
}

function outcomeStdout(issueNumber: number): string {
  return `${JSON.stringify(
    {
      ok: true,
      issueNumber,
      targetEntrySlug: "vendor-x",
      dryRun: false,
      changesApplied: [],
      sources: [],
    },
    null,
    2,
  )}\n`;
}

function snapshotStdout(): string {
  return `${JSON.stringify(
    {
      categories: [{ id: "cloud-storage", name: "Cloud Storage" }],
      countries: [{ code: "de", name: "Germany" }],
      entries: [{ slug: "vendor-x", name: "Vendor X" }],
    },
    null,
    2,
  )}\n`;
}

function runOrchestrator(args: string[], envOverrides: Record<string, string>) {
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    ...envOverrides,
  };
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

describe("process-suggestion-issue-codex orchestrator", () => {
  const createdIssueNumbers: number[] = [];

  afterEach(() => {
    for (const n of createdIssueNumbers) {
      cleanupIssueDir(n);
    }
    createdIssueNumbers.length = 0;
  });

  it("chains research → verify → apply → finalize for catalog_fact_correction and exits 0", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11001;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(
        tempDir,
        "verify",
        recordPath,
        verifiedStdout(issueNumber),
        0,
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(0);

      // All five stages must have run, in order.
      const stages = readStageCalls(recordPath).map((c) => c.stage);
      expect(stages).toEqual([
        "classify",
        "snapshot",
        "research",
        "verify",
        "apply",
        "finalize",
      ]);

      const resultJsonPath = join(
        projectDir,
        "tmp/issues",
        String(issueNumber),
        "result.json",
      );
      expect(existsSync(resultJsonPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(resultJsonPath, "utf8"));
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(true);
      expect(parsed.outcome).toBe("applied");
      expect(parsed.issueNumber).toBe(issueNumber);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("classification=unsupported_or_unclear exits non-zero without invoking apply or finalize", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11002;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("unsupported_or_unclear", issueNumber),
        0,
      );
      // Wire up shims for the later stages too so we can prove they were
      // NOT called. They'd exit 0 if invoked, leaving the orchestrator
      // success — so seeing it exit non-zero proves the branch.
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(
        tempDir,
        "verify",
        recordPath,
        verifiedStdout(issueNumber),
        0,
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).not.toBe(0);

      const stages = readStageCalls(recordPath).map((c) => c.stage);
      // Only the classifier ran; research/verify/apply/finalize must not
      // have been invoked.
      expect(stages).toEqual(["classify"]);
      expect(stages).not.toContain("apply");
      expect(stages).not.toContain("finalize");

      const resultJsonPath = join(
        projectDir,
        "tmp/issues",
        String(issueNumber),
        "result.json",
      );
      expect(existsSync(resultJsonPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(resultJsonPath, "utf8"));
      expect(parsed.classification).toBe("unsupported_or_unclear");
      expect(parsed.writes_applied).toBe(false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("defaults new_alternative stage 4 to the verified-alternative insert script", () => {
    const source = readFileSync(orchestratorPath, "utf8");

    expect(source).toContain(
      'APPLY_NEW_ALT_CMD="${EUROALT_APPLY_NEW_ALT_CMD:-bash $SCRIPT_DIR/insert-verified-alternative.sh}"',
    );
    expect(source).not.toContain("skipped_not_automated");
  });

  it("classification=new_alternative invokes research, verify, apply, and finalize", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11003;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("new_alternative", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(
        tempDir,
        "verify",
        recordPath,
        verifiedStdout(issueNumber),
        0,
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_NEW_ALT_CMD: `bash ${applyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(0);
      const stages = readStageCalls(recordPath).map((c) => c.stage);
      expect(stages).toEqual([
        "classify",
        "snapshot",
        "research",
        "verify",
        "apply",
        "finalize",
      ]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("--dry-run propagates --dry-run flag to every chained stage", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11004;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(
        tempDir,
        "verify",
        recordPath,
        verifiedStdout(issueNumber),
        0,
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator([String(issueNumber), "--dry-run"], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(0);

      const calls = readStageCalls(recordPath);
      // Every stage's argv must contain --dry-run.
      for (const call of calls) {
        if (call.stage !== "snapshot") {
          expect(call.args).toContain("--dry-run");
        }
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("retries research with verifier feedback after a retryable verification failure, then applies only after verification succeeds", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11010;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFeedbackVerifierStage(
        tempDir,
        recordPath,
        issueNumber,
        { failuresBeforeSuccess: 1 },
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator([String(issueNumber), "--dry-run"], {
        EUROALT_MAX_VERIFICATION_ATTEMPTS: "2",
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(0);

      const calls = readStageCalls(recordPath);
      expect(calls.map((c) => c.stage)).toEqual([
        "classify",
        "snapshot",
        "research",
        "verify",
        "research",
        "verify",
        "apply",
        "finalize",
      ]);

      const researchCalls = calls.filter((c) => c.stage === "research");
      expect(researchCalls).toHaveLength(2);
      expect(researchCalls[0].args).not.toContain("--previous-research-file");
      expect(researchCalls[0].args).not.toContain(
        "--verification-feedback-file",
      );
      expect(
        argValue(researchCalls[1].args, "--previous-research-file"),
      ).toMatch(/tmp\/issues\/11010\/research-1\.json$/);
      expect(
        argValue(researchCalls[1].args, "--verification-feedback-file"),
      ).toMatch(/tmp\/issues\/11010\/verification-feedback-1\.json$/);

      const verifyCalls = calls.filter((c) => c.stage === "verify");
      expect(verifyCalls).toHaveLength(2);
      expect(argValue(verifyCalls[0].args, "--feedback-output-file")).toMatch(
        /tmp\/issues\/11010\/verification-feedback-1\.json$/,
      );
      expect(argValue(verifyCalls[1].args, "--feedback-output-file")).toMatch(
        /tmp\/issues\/11010\/verification-feedback-2\.json$/,
      );

      for (const call of calls) {
        if (call.stage !== "snapshot") {
          expect(call.args).toContain("--dry-run");
        }
      }

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

      const parsed = JSON.parse(
        readFileSync(
          join(projectDir, "tmp/issues", String(issueNumber), "result.json"),
          "utf8",
        ),
      );
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.outcome).toBe("dry_run_applied");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exhausts retryable verifier feedback at the configured attempt limit without applying or finalizing", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11011;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFeedbackVerifierStage(
        tempDir,
        recordPath,
        issueNumber,
        { failuresBeforeSuccess: -1 },
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator(
        [String(issueNumber), "--max-verification-attempts", "2"],
        {
          EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
          EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
          EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
          EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
          EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
          EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
        },
      );

      expect(result.status).toBe(65);

      const calls = readStageCalls(recordPath);
      expect(calls.map((c) => c.stage)).toEqual([
        "classify",
        "snapshot",
        "research",
        "verify",
        "research",
        "verify",
      ]);
      expect(calls.map((c) => c.stage)).not.toContain("apply");
      expect(calls.map((c) => c.stage)).not.toContain("finalize");

      const parsed = JSON.parse(
        readFileSync(
          join(projectDir, "tmp/issues", String(issueNumber), "result.json"),
          "utf8",
        ),
      );
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.outcome).toBe("verification_retries_exhausted");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("does not retry verifier failures that do not produce current feedback", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11012;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(tempDir, "verify", recordPath, "", 65);
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );
      const issueDir = join(projectDir, "tmp/issues", String(issueNumber));
      mkdirSync(issueDir, { recursive: true });
      const staleFeedbackPath = join(issueDir, "verification-feedback-1.json");
      writeFileSync(
        staleFeedbackPath,
        JSON.stringify({
          retryable: true,
          failedEvidence: [{ verdict: "inconclusive" }],
        }),
        "utf8",
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_MAX_VERIFICATION_ATTEMPTS: "3",
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(65);

      const calls = readStageCalls(recordPath);
      expect(calls.map((c) => c.stage)).toEqual([
        "classify",
        "snapshot",
        "research",
        "verify",
      ]);

      const verifyCalls = calls.filter((c) => c.stage === "verify");
      expect(argValue(verifyCalls[0].args, "--feedback-output-file")).toMatch(
        /tmp\/issues\/11012\/verification-feedback-1\.json$/,
      );
      expect(existsSync(staleFeedbackPath)).toBe(false);

      const parsed = JSON.parse(
        readFileSync(
          join(projectDir, "tmp/issues", String(issueNumber), "result.json"),
          "utf8",
        ),
      );
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.outcome).toBe("verify_failed_rc_65");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("exits 64 on --help and prints usage", () => {
    const result = runOrchestrator(["--help"], {});
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/usage/i);
  });

  it("exits 64 when no issue number is provided", () => {
    const result = runOrchestrator([], {});
    expect(result.status).toBe(64);
  });

  it("classifier stage failure propagates rc and records classifier_failed_rc_N", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11005;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      // Classifier exits non-zero; subsequent stages must NOT be reached.
      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        "",
        2,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
      });

      expect(result.status).toBe(2);

      const stages = readStageCalls(recordPath).map((c) => c.stage);
      expect(stages).toEqual(["classify"]);

      const resultJsonPath = join(
        projectDir,
        "tmp/issues",
        String(issueNumber),
        "result.json",
      );
      expect(existsSync(resultJsonPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(resultJsonPath, "utf8"));
      expect(parsed.classification).toBe("error");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.outcome).toBe("classifier_failed_rc_2");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("apply stage failure exits with rc, leaves writes_applied=false, and does not invoke finalize", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11006;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(
        tempDir,
        "verify",
        recordPath,
        verifiedStdout(issueNumber),
        0,
      );
      // Apply fails — finalize must not run, writes_applied must stay false.
      const applyCmd = writeFakeStage(tempDir, "apply", recordPath, "", 3);
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(3);

      const stages = readStageCalls(recordPath).map((c) => c.stage);
      expect(stages).toEqual([
        "classify",
        "snapshot",
        "research",
        "verify",
        "apply",
      ]);
      expect(stages).not.toContain("finalize");

      const resultJsonPath = join(
        projectDir,
        "tmp/issues",
        String(issueNumber),
        "result.json",
      );
      expect(existsSync(resultJsonPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(resultJsonPath, "utf8"));
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.outcome).toBe("apply_failed_rc_3");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("finalize stage failure exits with rc but records writes_applied=true (apply already mutated the DB)", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11007;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(
        tempDir,
        "verify",
        recordPath,
        verifiedStdout(issueNumber),
        0,
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      // Finalize fails AFTER apply succeeded — DB writes have happened.
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        4,
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(4);

      const stages = readStageCalls(recordPath).map((c) => c.stage);
      expect(stages).toEqual([
        "classify",
        "snapshot",
        "research",
        "verify",
        "apply",
        "finalize",
      ]);

      const resultJsonPath = join(
        projectDir,
        "tmp/issues",
        String(issueNumber),
        "result.json",
      );
      expect(existsSync(resultJsonPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(resultJsonPath, "utf8"));
      expect(parsed.classification).toBe("catalog_fact_correction");
      // Apply already wrote to the DB before finalize failed — the manifest
      // must reflect that mutations were applied, even though finalization
      // (the GitHub-side comment / close) did not complete.
      expect(parsed.writes_applied).toBe(true);
      expect(parsed.outcome).toBe("finalize_failed_rc_4");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("successful --dry-run run records outcome=dry_run_applied and writes_applied=false", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11008;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("catalog_fact_correction", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );
      const snapshotCmd = writeFakeStage(
        tempDir,
        "snapshot",
        recordPath,
        snapshotStdout(),
        0,
      );
      const verifyCmd = writeFakeStage(
        tempDir,
        "verify",
        recordPath,
        verifiedStdout(issueNumber),
        0,
      );
      const applyCmd = writeFakeStage(
        tempDir,
        "apply",
        recordPath,
        outcomeStdout(issueNumber),
        0,
      );
      const finalizeCmd = writeFakeStage(
        tempDir,
        "finalize",
        recordPath,
        "",
        0,
      );

      const result = runOrchestrator([String(issueNumber), "--dry-run"], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_CATALOG_SNAPSHOT_CMD: `bash ${snapshotCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
        EUROALT_VERIFY_FACT_CMD: `bash ${verifyCmd}`,
        EUROALT_APPLY_VERIFIED_CMD: `bash ${applyCmd}`,
        EUROALT_FINALIZE_ISSUE_CMD: `bash ${finalizeCmd}`,
      });

      expect(result.status).toBe(0);

      const resultJsonPath = join(
        projectDir,
        "tmp/issues",
        String(issueNumber),
        "result.json",
      );
      expect(existsSync(resultJsonPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(resultJsonPath, "utf8"));
      // Dry-run must distinguish itself from a real apply at the manifest
      // level — outcome=dry_run_applied (not "applied"), writes_applied=false
      // so the batch driver can surface the correct write status to logs.
      expect(parsed.classification).toBe("catalog_fact_correction");
      expect(parsed.outcome).toBe("dry_run_applied");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.dryRun).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("unknown classification action exits 65 and records classification=unknown", () => {
    const tempDir = makeProjectTempDir("orchestrator-");
    const issueNumber = 11009;
    createdIssueNumbers.push(issueNumber);

    try {
      const recordPath = join(tempDir, "stage-calls.log");
      writeFileSync(recordPath, "", "utf8");

      // Classifier emits a bogus action — none of the known branches.
      const classifyCmd = writeFakeStage(
        tempDir,
        "classify",
        recordPath,
        classificationStdout("something_totally_made_up", issueNumber),
        0,
      );
      const researchCmd = writeFakeStage(
        tempDir,
        "research",
        recordPath,
        researchStdout(issueNumber),
        0,
      );

      const result = runOrchestrator([String(issueNumber)], {
        EUROALT_RESEARCH_ISSUE_CMD: `bash ${classifyCmd}`,
        EUROALT_RESEARCH_FACT_CMD: `bash ${researchCmd}`,
      });

      expect(result.status).toBe(65);

      const stages = readStageCalls(recordPath).map((c) => c.stage);
      // Only the classifier runs; no fact research or further stages.
      expect(stages).toEqual(["classify"]);

      const resultJsonPath = join(
        projectDir,
        "tmp/issues",
        String(issueNumber),
        "result.json",
      );
      expect(existsSync(resultJsonPath)).toBe(true);
      const parsed = JSON.parse(readFileSync(resultJsonPath, "utf8"));
      expect(parsed.classification).toBe("unknown");
      expect(parsed.writes_applied).toBe(false);
      expect(parsed.outcome).toBe("skipped_unknown_classification");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
