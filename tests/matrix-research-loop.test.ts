import { spawn, spawnSync } from "node:child_process";
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
const loopRunnerPath = resolve("scripts/matrix-research-loop.mjs");

type StageName = "selector" | "researcher" | "verifier" | "persister";

type StageStep = {
  exitCode?: number;
  stdout?: string;
  stderr?: string;
};

type StageRecord = {
  call: number;
  args: string[];
  stdin: string;
};

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });

  return mkdtempSync(join(tempRoot, prefix));
}

/**
 * Writes a single shared "fake stage" Node script that all four stages
 * (selector / researcher / verifier / persister) are pointed at by the
 * loop runner via its --selector-cmd / --researcher-cmd / --verifier-cmd /
 * --persister-cmd overrides. Each stage reads a JSON scenario file keyed
 * by 1-based call number, appends its call args + stdin to a record log,
 * then writes the canned stdout/stderr and exits with the configured code.
 */
function writeFakeStageRunner(tempDir: string): string {
  const fakeStagePath = join(tempDir, "fake-stage.mjs");
  writeFileSync(
    fakeStagePath,
    `#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const stage = process.env.FAKE_STAGE;
if (!stage) {
  process.stderr.write("FAKE_STAGE env var required\\n");
  process.exit(99);
}
const scenarioPath = process.env[\`FAKE_\${stage.toUpperCase()}_SCENARIO\`];
const recordPath = process.env[\`FAKE_\${stage.toUpperCase()}_RECORD\`];
const counterPath = process.env[\`FAKE_\${stage.toUpperCase()}_COUNTER\`];
if (!scenarioPath || !recordPath || !counterPath) {
  process.stderr.write(\`Missing scenario/record/counter env for stage \${stage}\\n\`);
  process.exit(99);
}

const previous = existsSync(counterPath)
  ? Number.parseInt(readFileSync(counterPath, "utf8"), 10) || 0
  : 0;
const callNum = previous + 1;
writeFileSync(counterPath, String(callNum));

let stdin = "";
if (stage !== "selector") {
  try {
    stdin = readFileSync(0, "utf8");
  } catch {
    stdin = "";
  }
}

const record = {
  call: callNum,
  args: process.argv.slice(2),
  stdin,
};
appendFileSync(recordPath, JSON.stringify(record) + "\\n");

const scenarios = JSON.parse(readFileSync(scenarioPath, "utf8"));
const step = scenarios[callNum - 1] ?? scenarios.default ?? {};

if (step.stdout) process.stdout.write(step.stdout);
if (step.stderr) process.stderr.write(step.stderr);
process.exit(typeof step.exitCode === "number" ? step.exitCode : 0);
`,
    "utf8",
  );
  chmodSync(fakeStagePath, 0o755);

  return fakeStagePath;
}

function targetPayload(
  factId: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    factId,
    categoryId: "email",
    categoryName: "Email",
    entrySlug: `entry-${factId}`,
    entryName: `Entry ${factId}`,
    criterionKey: "ownership",
    criterionLabel: "Ownership",
    valueType: "text",
    previousStatus: "open",
    status: "researching",
    dryRun: false,
    ...overrides,
  };
}

function attemptPayload(
  factId: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    factId,
    agent: "codex",
    model: null,
    command: "fake",
    proposedStatus: "verified",
    proposedValue: "yes",
    sourceUrl: "https://example.test/source",
    sourceTitle: "Source",
    accessedDate: "2026-05-27",
    auditQuote: "quoted",
    confidence: "high",
    status: "needs-verification",
    rawResponse: "raw",
    ...overrides,
  };
}

function decisionPayload(factId: number, factStatus: string) {
  const attemptStatus =
    factStatus === "verified"
      ? "accepted"
      : factStatus === "rejected"
        ? "rejected"
        : "needs-deeper-research";
  return {
    recommendedFactStatus: factStatus,
    recommendedAttemptStatus: attemptStatus,
    verifications: [],
    attempt: { factId },
  };
}

function persisterPayload(factId: number, factStatus: string) {
  const attemptStatus =
    factStatus === "verified"
      ? "accepted"
      : factStatus === "rejected"
        ? "rejected"
        : "needs-deeper-research";
  return {
    factId,
    attemptId: 1000 + factId,
    factStatus,
    attemptStatus,
    verifierRowsInserted: factStatus === "needs-deeper-research" ? 0 : 3,
    selectedAttemptId: factStatus === "verified" ? 1000 + factId : null,
  };
}

function jsonLine(value: unknown): string {
  return JSON.stringify(value) + "\n";
}

type ScenarioWriter = {
  fakeStagePath: string;
  scenarioPaths: Record<StageName, string>;
  recordPaths: Record<StageName, string>;
  counterPaths: Record<StageName, string>;
};

function prepareScenarios(tempDir: string): ScenarioWriter {
  const fakeStagePath = writeFakeStageRunner(tempDir);
  const stages: StageName[] = [
    "selector",
    "researcher",
    "verifier",
    "persister",
  ];
  const scenarioPaths = {} as Record<StageName, string>;
  const recordPaths = {} as Record<StageName, string>;
  const counterPaths = {} as Record<StageName, string>;
  for (const stage of stages) {
    scenarioPaths[stage] = join(tempDir, `${stage}-scenarios.json`);
    recordPaths[stage] = join(tempDir, `${stage}-record.jsonl`);
    counterPaths[stage] = join(tempDir, `${stage}-counter.txt`);
    // Default scenario: empty array (callers must write the real one).
    writeFileSync(scenarioPaths[stage], "[]", "utf8");
  }

  return { fakeStagePath, scenarioPaths, recordPaths, counterPaths };
}

function writeScenario(
  writer: ScenarioWriter,
  stage: StageName,
  steps: StageStep[],
) {
  writeFileSync(writer.scenarioPaths[stage], JSON.stringify(steps), "utf8");
}

function readRecord(writer: ScenarioWriter, stage: StageName): StageRecord[] {
  const path = writer.recordPaths[stage];
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as StageRecord);
}

function runLoop(
  args: string[],
  writer: ScenarioWriter,
  extraEnv: Record<string, string> = {},
) {
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    FAKE_SELECTOR_SCENARIO: writer.scenarioPaths.selector,
    FAKE_SELECTOR_RECORD: writer.recordPaths.selector,
    FAKE_SELECTOR_COUNTER: writer.counterPaths.selector,
    FAKE_RESEARCHER_SCENARIO: writer.scenarioPaths.researcher,
    FAKE_RESEARCHER_RECORD: writer.recordPaths.researcher,
    FAKE_RESEARCHER_COUNTER: writer.counterPaths.researcher,
    FAKE_VERIFIER_SCENARIO: writer.scenarioPaths.verifier,
    FAKE_VERIFIER_RECORD: writer.recordPaths.verifier,
    FAKE_VERIFIER_COUNTER: writer.counterPaths.verifier,
    FAKE_PERSISTER_SCENARIO: writer.scenarioPaths.persister,
    FAKE_PERSISTER_RECORD: writer.recordPaths.persister,
    FAKE_PERSISTER_COUNTER: writer.counterPaths.persister,
    ...extraEnv,
  };

  // Each stage is invoked by the loop runner via a shell command override.
  // We point each at the same fake-stage.mjs but with FAKE_STAGE set so it
  // knows which scenario file to read. The runner is expected to honor
  // --selector-cmd / --researcher-cmd / --verifier-cmd / --persister-cmd
  // as shell-style commands the runner will spawn (and pipe stdin/stdout
  // through).
  const overrideArgs = [
    "--selector-cmd",
    `FAKE_STAGE=selector node ${writer.fakeStagePath}`,
    "--researcher-cmd",
    `FAKE_STAGE=researcher node ${writer.fakeStagePath}`,
    "--verifier-cmd",
    `FAKE_STAGE=verifier node ${writer.fakeStagePath}`,
    "--persister-cmd",
    `FAKE_STAGE=persister node ${writer.fakeStagePath}`,
  ];

  return spawnSync("node", [loopRunnerPath, ...overrideArgs, ...args], {
    cwd: projectDir,
    encoding: "utf8",
    env,
  });
}

const NO_OPEN_STDERR =
  "No open matrix fact available for the requested scope.\n";

describe("matrix-research-loop — --help and usage errors", () => {
  it("prints usage on --help and does not invoke any inner stage", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);
      const result = runLoop(["--help"], writer);

      expect(result.status).toBe(0);
      expect(result.stdout + result.stderr).toMatch(/usage/i);
      for (const stage of [
        "selector",
        "researcher",
        "verifier",
        "persister",
      ] as StageName[]) {
        expect(readRecord(writer, stage)).toEqual([]);
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — empty queue", () => {
  it("exits 0 with no-open=1 when the selector reports no eligible facts on the first call", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);
      writeScenario(writer, "selector", [
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);

      const result = runLoop([], writer);

      expect(result.status).toBe(0);

      // The selector was called exactly once; downstream stages never ran.
      expect(readRecord(writer, "selector").length).toBe(1);
      expect(readRecord(writer, "researcher")).toEqual([]);
      expect(readRecord(writer, "verifier")).toEqual([]);
      expect(readRecord(writer, "persister")).toEqual([]);

      // End summary must mention each counter and report no-open=1.
      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/no-open[^\d]*1/);
      expect(summary).toMatch(/verified[^\d]*0/);
      expect(summary).toMatch(/rejected[^\d]*0/);
      expect(summary).toMatch(/needs-deeper-research[^\d]*0/);
      expect(summary).toMatch(/failed[^\d]*0/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — mixed outcomes", () => {
  it("aggregates verified, rejected, and needs-deeper-research counters from the persister's factStatus", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Three facts, then queue empty.
      writeScenario(writer, "selector", [
        { exitCode: 0, stdout: jsonLine(targetPayload(101)) },
        { exitCode: 0, stdout: jsonLine(targetPayload(102)) },
        { exitCode: 0, stdout: jsonLine(targetPayload(103)) },
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);
      writeScenario(writer, "researcher", [
        { exitCode: 0, stdout: jsonLine(attemptPayload(101)) },
        {
          exitCode: 0,
          stdout: jsonLine(attemptPayload(102, { status: "rejected" })),
        },
        {
          exitCode: 0,
          stdout: jsonLine(
            attemptPayload(103, { status: "needs-deeper-research" }),
          ),
        },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 0, stdout: jsonLine(decisionPayload(101, "verified")) },
      ]);
      writeScenario(writer, "persister", [
        { exitCode: 0, stdout: jsonLine(persisterPayload(101, "verified")) },
        { exitCode: 0, stdout: jsonLine(persisterPayload(102, "rejected")) },
        {
          exitCode: 0,
          stdout: jsonLine(persisterPayload(103, "needs-deeper-research")),
        },
      ]);

      const result = runLoop([], writer);

      expect(result.status).toBe(0);

      // One-fact-per-iteration: each downstream stage called exactly once
      // per selected fact. Selector called once more to discover the
      // empty queue.
      expect(readRecord(writer, "selector").length).toBe(4);
      expect(readRecord(writer, "researcher").length).toBe(3);
      expect(readRecord(writer, "verifier").length).toBe(1);
      expect(readRecord(writer, "persister").length).toBe(3);

      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/verified[^\d]*1/);
      expect(summary).toMatch(/rejected[^\d]*1/);
      expect(summary).toMatch(/needs-deeper-research[^\d]*1/);
      expect(summary).toMatch(/no-open[^\d]*1/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — limits", () => {
  it("stops after --max-facts iterations and does not call the selector again", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Queue has 5 facts available — runner must stop after 2.
      writeScenario(
        writer,
        "selector",
        [201, 202, 203, 204, 205].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(targetPayload(id)),
        })),
      );
      writeScenario(
        writer,
        "researcher",
        [201, 202, 203, 204, 205].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(attemptPayload(id)),
        })),
      );
      writeScenario(
        writer,
        "verifier",
        [201, 202, 203, 204, 205].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(decisionPayload(id, "verified")),
        })),
      );
      writeScenario(
        writer,
        "persister",
        [201, 202, 203, 204, 205].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(persisterPayload(id, "verified")),
        })),
      );

      const result = runLoop(["--max-facts", "2"], writer);

      expect(result.status).toBe(0);

      // Selector called exactly twice — not a third time to discover
      // empty queue.
      expect(readRecord(writer, "selector").length).toBe(2);
      expect(readRecord(writer, "persister").length).toBe(2);

      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/verified[^\d]*2/);
      // no-open=0 because the queue was not drained.
      expect(summary).toMatch(/no-open[^\d]*0/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("stops after --max-consecutive-failures and resets the streak on success", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Sequence the runner observes per iteration (researcher behavior):
      //   1. fail   (consecutive=1)
      //   2. succeed (consecutive resets to 0)
      //   3. fail   (consecutive=1)
      //   4. fail   (consecutive=2 → stop with --max-consecutive-failures=2)
      // Selector therefore must serve 4 facts before the loop stops.
      writeScenario(
        writer,
        "selector",
        [301, 302, 303, 304, 305].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(targetPayload(id)),
        })),
      );
      writeScenario(writer, "researcher", [
        { exitCode: 1, stderr: "boom\n" },
        { exitCode: 0, stdout: jsonLine(attemptPayload(302)) },
        { exitCode: 1, stderr: "boom\n" },
        { exitCode: 1, stderr: "boom\n" },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 0, stdout: jsonLine(decisionPayload(302, "verified")) },
      ]);
      writeScenario(writer, "persister", [
        { exitCode: 0, stdout: jsonLine(persisterPayload(302, "verified")) },
      ]);

      const result = runLoop(["--max-consecutive-failures", "2"], writer);

      expect(result.status).toBe(0);

      // Exactly 4 selector calls — one per attempted fact. The streak
      // reset on the 2nd success means the loop went past it.
      expect(readRecord(writer, "selector").length).toBe(4);
      expect(readRecord(writer, "researcher").length).toBe(4);
      // Verifier + persister only ran for the successful iteration.
      expect(readRecord(writer, "verifier").length).toBe(1);
      expect(readRecord(writer, "persister").length).toBe(1);

      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/verified[^\d]*1/);
      expect(summary).toMatch(/failed[^\d]*3/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — category passthrough", () => {
  it("forwards --category to the selector subprocess", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);
      writeScenario(writer, "selector", [
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);

      const result = runLoop(["--category", "email"], writer);

      expect(result.status).toBe(0);
      const selectorCalls = readRecord(writer, "selector");
      expect(selectorCalls.length).toBe(1);
      // The selector subprocess receives --category email as forwarded
      // args (either as two tokens "--category" "email" or fused as
      // "--category=email" — both forms must be accepted by the
      // underlying selector script).
      const argv = selectorCalls[0].args;
      const fused = argv.includes("--category=email");
      const split =
        argv.includes("--category") &&
        argv[argv.indexOf("--category") + 1] === "email";
      expect(fused || split).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — selector fatal-error handling", () => {
  it("terminates with a non-zero exit and does not treat selector exit 64 as no-open", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);
      writeScenario(writer, "selector", [
        { exitCode: 64, stderr: "Invalid usage: bogus flag\n" },
      ]);

      const result = runLoop([], writer);

      expect(result.status).not.toBe(0);

      // Selector must have actually been spawned (otherwise the
      // non-zero exit could just be the runner failing to start).
      expect(readRecord(writer, "selector").length).toBe(1);

      // Downstream stages must not have been invoked.
      expect(readRecord(writer, "researcher")).toEqual([]);
      expect(readRecord(writer, "verifier")).toEqual([]);
      expect(readRecord(writer, "persister")).toEqual([]);

      const summary = result.stdout + result.stderr;
      // The summary, if it printed, must not have labeled the usage
      // error as a soft "no-open" stop.
      expect(summary).not.toMatch(/no-open[^\d]*1/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — --max-runtime guard", () => {
  it("stops the loop once wall-clock runtime exceeds --max-runtime", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Plenty of facts available; the loop must stop on the runtime
      // budget, not on queue exhaustion.
      writeScenario(
        writer,
        "selector",
        [401, 402, 403, 404, 405, 406, 407, 408, 409, 410].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(targetPayload(id)),
        })),
      );
      // Researcher injects a per-call delay (~250 ms) so the runner
      // actually crosses the runtime budget after a couple iterations.
      // We do this by overriding the researcher-cmd to a tiny inline
      // script rather than the shared fake-stage (which has no sleep).
      // The other three stages keep using the shared fake-stage.
      const researcherCmd = `node -e "setTimeout(()=>{process.stdout.write(JSON.stringify({factId:0,proposedStatus:'verified'})+'\\n');},250)"`;

      writeScenario(
        writer,
        "verifier",
        [401, 402, 403, 404, 405, 406, 407, 408, 409, 410].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(decisionPayload(id, "verified")),
        })),
      );
      writeScenario(
        writer,
        "persister",
        [401, 402, 403, 404, 405, 406, 407, 408, 409, 410].map((id) => ({
          exitCode: 0,
          stdout: jsonLine(persisterPayload(id, "verified")),
        })),
      );

      // --max-runtime accepts fractional minutes. 0.01 min == 600 ms.
      // The researcher sleeps 250 ms each iteration, so we expect the
      // loop to complete at most ~3 iterations before the budget fires.
      const start = Date.now();
      const result = spawnSync(
        "node",
        [
          loopRunnerPath,
          "--selector-cmd",
          `FAKE_STAGE=selector node ${writer.fakeStagePath}`,
          "--researcher-cmd",
          researcherCmd,
          "--verifier-cmd",
          `FAKE_STAGE=verifier node ${writer.fakeStagePath}`,
          "--persister-cmd",
          `FAKE_STAGE=persister node ${writer.fakeStagePath}`,
          "--max-runtime",
          "0.01",
        ],
        {
          cwd: projectDir,
          encoding: "utf8",
          env: {
            ...(process.env as Record<string, string>),
            FAKE_SELECTOR_SCENARIO: writer.scenarioPaths.selector,
            FAKE_SELECTOR_RECORD: writer.recordPaths.selector,
            FAKE_SELECTOR_COUNTER: writer.counterPaths.selector,
            FAKE_VERIFIER_SCENARIO: writer.scenarioPaths.verifier,
            FAKE_VERIFIER_RECORD: writer.recordPaths.verifier,
            FAKE_VERIFIER_COUNTER: writer.counterPaths.verifier,
            FAKE_PERSISTER_SCENARIO: writer.scenarioPaths.persister,
            FAKE_PERSISTER_RECORD: writer.recordPaths.persister,
            FAKE_PERSISTER_COUNTER: writer.counterPaths.persister,
          },
        },
      );
      const elapsedMs = Date.now() - start;

      expect(result.status).toBe(0);

      // The loop must have stopped before draining the 10-fact queue.
      // With a 250 ms researcher and a 600 ms budget, fewer than 10
      // selector calls is the strict proof the runtime budget fired.
      const selectorCalls = readRecord(writer, "selector").length;
      expect(selectorCalls).toBeLessThan(10);
      expect(selectorCalls).toBeGreaterThanOrEqual(1);

      // Wall-clock sanity check: the run must not have taken
      // dramatically longer than the budget + one in-flight iteration.
      expect(elapsedMs).toBeLessThan(10_000);

      // The end summary still prints all the standard counters,
      // including no-open=0 (we never drained the queue).
      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/no-open[^\d]*0/);
      expect(summary).toMatch(/verified[^\d]*\d/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — production default verifier wiring", () => {
  it("invokes scripts/matrix-verify-run.mjs with --attempt-bundle-file pointing at a readable temp file when no --verifier-cmd override is supplied", async () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Selector emits one fact, then is never called again because --max-facts=1
      // stops the loop after one iteration.
      writeScenario(writer, "selector", [
        { exitCode: 0, stdout: jsonLine(targetPayload(601)) },
      ]);
      // Researcher emits a stub attempt for that fact.
      writeScenario(writer, "researcher", [
        { exitCode: 0, stdout: jsonLine(attemptPayload(601)) },
      ]);
      // Verifier and persister are NOT overridden — the runner will spawn the
      // real scripts. The real verifier may take a long time (it can call out
      // to codex/claude), but we don't need it to finish: the runner logs the
      // constructed verifier command line to stderr BEFORE invoking it, so we
      // can detect the log line via streaming stderr and kill the runner as
      // soon as we have what we need.

      const env: Record<string, string> = {
        ...(process.env as Record<string, string>),
        FAKE_SELECTOR_SCENARIO: writer.scenarioPaths.selector,
        FAKE_SELECTOR_RECORD: writer.recordPaths.selector,
        FAKE_SELECTOR_COUNTER: writer.counterPaths.selector,
        FAKE_RESEARCHER_SCENARIO: writer.scenarioPaths.researcher,
        FAKE_RESEARCHER_RECORD: writer.recordPaths.researcher,
        FAKE_RESEARCHER_COUNTER: writer.counterPaths.researcher,
        // Skip temp-file cleanup so the test can inspect the bundle file
        // the runner wrote for the verifier.
        MATRIX_LOOP_KEEP_TEMP: "1",
      };

      const verifierLogPattern =
        /spawn verifier:\s+(node scripts\/matrix-verify-run\.mjs\s+--attempt-bundle-file\s+(\S+))/;

      const verifierLog = await new Promise<{
        commandLine: string;
        bundlePath: string;
      }>((resolvePromise, rejectPromise) => {
        const child = spawn(
          "node",
          [
            loopRunnerPath,
            "--selector-cmd",
            `FAKE_STAGE=selector node ${writer.fakeStagePath}`,
            "--researcher-cmd",
            `FAKE_STAGE=researcher node ${writer.fakeStagePath}`,
            "--max-facts",
            "1",
          ],
          {
            cwd: projectDir,
            env,
            stdio: ["ignore", "pipe", "pipe"],
          },
        );

        let stderrBuffer = "";
        let resolved = false;

        const killTimer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            child.kill("SIGKILL");
            rejectPromise(
              new Error(
                `Runner did not log a verifier spawn within 15s. Captured stderr:\n${stderrBuffer}`,
              ),
            );
          }
        }, 15_000);

        child.stderr.on("data", (chunk: Buffer) => {
          stderrBuffer += chunk.toString("utf8");
          const match = stderrBuffer.match(verifierLogPattern);
          if (match && !resolved) {
            resolved = true;
            clearTimeout(killTimer);
            child.kill("SIGKILL");
            resolvePromise({ commandLine: match[1], bundlePath: match[2] });
          }
        });

        child.on("error", (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(killTimer);
            rejectPromise(error);
          }
        });

        child.on("close", () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(killTimer);
            rejectPromise(
              new Error(
                `Runner exited before logging a verifier spawn. Captured stderr:\n${stderrBuffer}`,
              ),
            );
          }
        });
      });

      // The runner logs the constructed shell command for the verifier
      // spawn. It must start with the default bare command and end with
      // --attempt-bundle-file <path>.
      expect(verifierLog.commandLine).toMatch(
        /^node scripts\/matrix-verify-run\.mjs\s+--attempt-bundle-file\s+\S+$/,
      );

      const bundlePath = verifierLog.bundlePath;
      // The path must point under the project's tmp/ directory and match the
      // documented matrix-loop-<pid>-<iter>-verify.json shape.
      expect(bundlePath).toMatch(
        /[/\\]tmp[/\\]matrix-loop-\d+-\d+-verify\.json$/,
      );

      // The bundle file must exist (the runner wrote it before spawning
      // the verifier) and parse as a JSON object with target + attempt.
      expect(existsSync(bundlePath)).toBe(true);
      const bundle = JSON.parse(readFileSync(bundlePath, "utf8")) as {
        target?: { factId?: number };
        attempt?: { factId?: number };
      };
      expect(bundle.target).toBeDefined();
      expect(bundle.attempt).toBeDefined();
      expect(bundle.target?.factId).toBe(601);
      expect(bundle.attempt?.factId).toBe(601);

      // Cleanup: the runner did not get a chance to clean up because we
      // killed it mid-iteration (and MATRIX_LOOP_KEEP_TEMP=1 would have
      // suppressed cleanup anyway).
      rmSync(bundlePath, { force: true });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 20_000);

  it("persists a researcher-level needs-deeper-research attempt without invoking verifiers", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      writeScenario(writer, "selector", [
        { exitCode: 0, stdout: jsonLine(targetPayload(104)) },
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);
      writeScenario(writer, "researcher", [
        {
          exitCode: 0,
          stdout: jsonLine(
            attemptPayload(104, {
              proposedStatus: "needs-deeper-research",
              proposedValue: null,
              status: "needs-deeper-research",
            }),
          ),
        },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 99, stderr: "verifier must not run\n" },
      ]);
      writeScenario(writer, "persister", [
        {
          exitCode: 0,
          stdout: jsonLine(persisterPayload(104, "needs-deeper-research")),
        },
      ]);

      const result = runLoop([], writer);

      expect(result.status).toBe(0);
      expect(readRecord(writer, "selector").length).toBe(2);
      expect(readRecord(writer, "researcher").length).toBe(1);
      expect(readRecord(writer, "verifier")).toEqual([]);
      expect(readRecord(writer, "persister").length).toBe(1);

      const persisterStdin = JSON.parse(
        readRecord(writer, "persister")[0].stdin,
      ) as { decision?: unknown };
      expect(persisterStdin.decision).toBeNull();

      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/needs-deeper-research[^\d]*1/);
      expect(summary).toMatch(/failed[^\d]*0/);
      expect(summary).toMatch(/no-open[^\d]*1/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — verifier failure path", () => {
  it("counts a non-zero verifier exit as failed and skips the persister for that iteration", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Two facts available; the verifier explodes on the first one,
      // then the loop continues to the second fact and finishes it cleanly.
      writeScenario(writer, "selector", [
        { exitCode: 0, stdout: jsonLine(targetPayload(701)) },
        { exitCode: 0, stdout: jsonLine(targetPayload(702)) },
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);
      writeScenario(writer, "researcher", [
        { exitCode: 0, stdout: jsonLine(attemptPayload(701)) },
        { exitCode: 0, stdout: jsonLine(attemptPayload(702)) },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 1, stderr: "verifier blew up\n" },
        { exitCode: 0, stdout: jsonLine(decisionPayload(702, "verified")) },
      ]);
      writeScenario(writer, "persister", [
        { exitCode: 0, stdout: jsonLine(persisterPayload(702, "verified")) },
      ]);

      const result = runLoop([], writer);

      expect(result.status).toBe(0);

      // Researcher ran twice (once per fact). Verifier ran twice as well,
      // but the persister only ran for the second fact — the first
      // iteration short-circuited at the failed verifier.
      expect(readRecord(writer, "researcher").length).toBe(2);
      expect(readRecord(writer, "verifier").length).toBe(2);
      expect(readRecord(writer, "persister").length).toBe(1);

      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/failed[^\d]*1/);
      expect(summary).toMatch(/verified[^\d]*1/);
      // The aborted iteration is not silently classified as anything else.
      expect(summary).toMatch(/rejected[^\d]*0/);
      expect(summary).toMatch(/needs-deeper-research[^\d]*0/);
      expect(summary).toMatch(/skipped[^\d]*0/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — persister failure path", () => {
  it("counts a non-zero persister exit as failed and continues with the next fact", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      writeScenario(writer, "selector", [
        { exitCode: 0, stdout: jsonLine(targetPayload(801)) },
        { exitCode: 0, stdout: jsonLine(targetPayload(802)) },
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);
      writeScenario(writer, "researcher", [
        { exitCode: 0, stdout: jsonLine(attemptPayload(801)) },
        { exitCode: 0, stdout: jsonLine(attemptPayload(802)) },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 0, stdout: jsonLine(decisionPayload(801, "verified")) },
        { exitCode: 0, stdout: jsonLine(decisionPayload(802, "verified")) },
      ]);
      writeScenario(writer, "persister", [
        { exitCode: 1, stderr: "persister blew up\n" },
        { exitCode: 0, stdout: jsonLine(persisterPayload(802, "verified")) },
      ]);

      const result = runLoop([], writer);

      expect(result.status).toBe(0);

      // Both facts went through researcher + verifier + persister.
      expect(readRecord(writer, "researcher").length).toBe(2);
      expect(readRecord(writer, "verifier").length).toBe(2);
      expect(readRecord(writer, "persister").length).toBe(2);

      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/failed[^\d]*1/);
      // The second iteration succeeded.
      expect(summary).toMatch(/verified[^\d]*1/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — selector soft-failure path", () => {
  it("counts a selector exit that is neither 0/2/64 as failed and continues", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Selector hard-fails on first call (e.g. DB error exit 1),
      // succeeds on second call, then reports queue empty.
      writeScenario(writer, "selector", [
        { exitCode: 1, stderr: "transient db error\n" },
        { exitCode: 0, stdout: jsonLine(targetPayload(901)) },
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);
      writeScenario(writer, "researcher", [
        { exitCode: 0, stdout: jsonLine(attemptPayload(901)) },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 0, stdout: jsonLine(decisionPayload(901, "verified")) },
      ]);
      writeScenario(writer, "persister", [
        { exitCode: 0, stdout: jsonLine(persisterPayload(901, "verified")) },
      ]);

      const result = runLoop([], writer);

      // Exit 0 — selector exit 1 is a soft failure, not a fatal usage error.
      expect(result.status).toBe(0);

      // Selector ran 3 times (fail, success, empty). Downstream only ran
      // for the successful selector call.
      expect(readRecord(writer, "selector").length).toBe(3);
      expect(readRecord(writer, "researcher").length).toBe(1);
      expect(readRecord(writer, "verifier").length).toBe(1);
      expect(readRecord(writer, "persister").length).toBe(1);

      const summary = result.stdout + result.stderr;
      expect(summary).toMatch(/failed[^\d]*1/);
      expect(summary).toMatch(/verified[^\d]*1/);
      expect(summary).toMatch(/no-open[^\d]*1/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("matrix-research-loop — production default persister wiring", () => {
  it("invokes scripts/matrix-research-persist.php with --attempt-file and --decision-file pointing at readable temp files when no --persister-cmd override is supplied", async () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // Selector and researcher are overridden via the shared fake stage.
      // Verifier is also overridden so the runner reaches the persister
      // quickly and produces deterministic data for it.
      writeScenario(writer, "selector", [
        { exitCode: 0, stdout: jsonLine(targetPayload(1001)) },
      ]);
      writeScenario(writer, "researcher", [
        { exitCode: 0, stdout: jsonLine(attemptPayload(1001)) },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 0, stdout: jsonLine(decisionPayload(1001, "verified")) },
      ]);
      // Persister is NOT overridden — the runner spawns the real PHP
      // script. We don't need it to finish; the runner logs the
      // constructed command to stderr before spawning, and we capture
      // and kill the runner once we have the log line.

      const env: Record<string, string> = {
        ...(process.env as Record<string, string>),
        FAKE_SELECTOR_SCENARIO: writer.scenarioPaths.selector,
        FAKE_SELECTOR_RECORD: writer.recordPaths.selector,
        FAKE_SELECTOR_COUNTER: writer.counterPaths.selector,
        FAKE_RESEARCHER_SCENARIO: writer.scenarioPaths.researcher,
        FAKE_RESEARCHER_RECORD: writer.recordPaths.researcher,
        FAKE_RESEARCHER_COUNTER: writer.counterPaths.researcher,
        FAKE_VERIFIER_SCENARIO: writer.scenarioPaths.verifier,
        FAKE_VERIFIER_RECORD: writer.recordPaths.verifier,
        FAKE_VERIFIER_COUNTER: writer.counterPaths.verifier,
        // Keep the temp files around so the test can inspect them.
        MATRIX_LOOP_KEEP_TEMP: "1",
      };

      const persisterLogPattern =
        /spawn persister:\s+(php scripts\/matrix-research-persist\.php\s+--attempt-file\s+(\S+)\s+--decision-file\s+(\S+))/;

      const persisterLog = await new Promise<{
        commandLine: string;
        attemptPath: string;
        decisionPath: string;
      }>((resolvePromise, rejectPromise) => {
        const child = spawn(
          "node",
          [
            loopRunnerPath,
            "--selector-cmd",
            `FAKE_STAGE=selector node ${writer.fakeStagePath}`,
            "--researcher-cmd",
            `FAKE_STAGE=researcher node ${writer.fakeStagePath}`,
            "--verifier-cmd",
            `FAKE_STAGE=verifier node ${writer.fakeStagePath}`,
            "--max-facts",
            "1",
          ],
          {
            cwd: projectDir,
            env,
            stdio: ["ignore", "pipe", "pipe"],
          },
        );

        let stderrBuffer = "";
        let resolved = false;

        const killTimer = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            child.kill("SIGKILL");
            rejectPromise(
              new Error(
                `Runner did not log a persister spawn within 15s. Captured stderr:\n${stderrBuffer}`,
              ),
            );
          }
        }, 15_000);

        child.stderr.on("data", (chunk: Buffer) => {
          stderrBuffer += chunk.toString("utf8");
          const match = stderrBuffer.match(persisterLogPattern);
          if (match && !resolved) {
            resolved = true;
            clearTimeout(killTimer);
            child.kill("SIGKILL");
            resolvePromise({
              commandLine: match[1],
              attemptPath: match[2],
              decisionPath: match[3],
            });
          }
        });

        child.on("error", (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(killTimer);
            rejectPromise(error);
          }
        });

        child.on("close", () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(killTimer);
            rejectPromise(
              new Error(
                `Runner exited before logging a persister spawn. Captured stderr:\n${stderrBuffer}`,
              ),
            );
          }
        });
      });

      // The constructed command must be the bare default plus both
      // file flags — no stdin piping in the default path.
      expect(persisterLog.commandLine).toMatch(
        /^php scripts\/matrix-research-persist\.php\s+--attempt-file\s+\S+\s+--decision-file\s+\S+$/,
      );

      // Both paths must live under the project's tmp/ directory and
      // follow the documented matrix-loop-<pid>-<iter>-(attempt|decision).json shape.
      expect(persisterLog.attemptPath).toMatch(
        /[/\\]tmp[/\\]matrix-loop-\d+-\d+-attempt\.json$/,
      );
      expect(persisterLog.decisionPath).toMatch(
        /[/\\]tmp[/\\]matrix-loop-\d+-\d+-decision\.json$/,
      );

      // Both files must exist and round-trip JSON for the expected fact.
      expect(existsSync(persisterLog.attemptPath)).toBe(true);
      expect(existsSync(persisterLog.decisionPath)).toBe(true);

      const attemptBundle = JSON.parse(
        readFileSync(persisterLog.attemptPath, "utf8"),
      ) as { factId?: number };
      const decisionBundle = JSON.parse(
        readFileSync(persisterLog.decisionPath, "utf8"),
      ) as { recommendedFactStatus?: string };

      expect(attemptBundle.factId).toBe(1001);
      expect(decisionBundle.recommendedFactStatus).toBe("verified");

      rmSync(persisterLog.attemptPath, { force: true });
      rmSync(persisterLog.decisionPath, { force: true });
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }, 20_000);
});

describe("matrix-research-loop — skipped counter", () => {
  it("increments skipped when the persister returns an unrecognized factStatus", () => {
    const tempDir = makeProjectTempDir("matrix-loop-");
    try {
      const writer = prepareScenarios(tempDir);

      // One fact, then queue empty.
      writeScenario(writer, "selector", [
        { exitCode: 0, stdout: jsonLine(targetPayload(501)) },
        { exitCode: 2, stderr: NO_OPEN_STDERR },
      ]);
      writeScenario(writer, "researcher", [
        { exitCode: 0, stdout: jsonLine(attemptPayload(501)) },
      ]);
      writeScenario(writer, "verifier", [
        { exitCode: 0, stdout: jsonLine(decisionPayload(501, "verified")) },
      ]);
      // Persister returns a factStatus the runner does not recognize.
      // The runner treats this as "skipped" — it did process the fact
      // but cannot bucket the outcome into verified/rejected/needs-deeper.
      writeScenario(writer, "persister", [
        {
          exitCode: 0,
          stdout: jsonLine({
            factId: 501,
            attemptId: 1501,
            factStatus: "open",
            attemptStatus: "needs-deeper-research",
            verifierRowsInserted: 0,
            selectedAttemptId: null,
          }),
        },
      ]);

      const result = runLoop([], writer);

      expect(result.status).toBe(0);

      // The fact was actually run end-to-end: 1 of each downstream stage.
      expect(readRecord(writer, "researcher").length).toBe(1);
      expect(readRecord(writer, "verifier").length).toBe(1);
      expect(readRecord(writer, "persister").length).toBe(1);

      const summary = result.stdout + result.stderr;
      // skipped=1 because the persister's factStatus was unrecognized.
      expect(summary).toMatch(/skipped[^\d]*1/);
      // The three "real" outcome buckets stay at zero.
      expect(summary).toMatch(/verified[^\d]*0/);
      expect(summary).toMatch(/rejected[^\d]*0/);
      expect(summary).toMatch(/needs-deeper-research[^\d]*0/);
      // failed must NOT be incremented — the pipeline ran cleanly.
      expect(summary).toMatch(/failed[^\d]*0/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
