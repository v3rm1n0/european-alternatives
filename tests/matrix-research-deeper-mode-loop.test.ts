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

/**
 * Issue #471: the matrix-research loop runner must forward
 * --mode=deeper-research to the selector subprocess verbatim, so the
 * loop can be driven against the deeper-research backlog without
 * touching the open queue.
 *
 * Modeled directly on the existing --include-stale forwarding test
 * at tests/matrix-research-stale-recheck.test.ts:1435.
 */

const projectDir = resolve(".");
const loopRunnerPath = resolve("scripts/matrix-research-loop.mjs");

function makeProjectTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(join(tempRoot, prefix));
}

function writeFakeStageRunner(tempDir: string): string {
  const fakeStagePath = join(tempDir, "fake-stage.mjs");
  writeFileSync(
    fakeStagePath,
    `#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
const stage = process.env.FAKE_STAGE;
if (!stage) { process.stderr.write("FAKE_STAGE env var required\\n"); process.exit(99); }
const scenarioPath = process.env[\`FAKE_\${stage.toUpperCase()}_SCENARIO\`];
const recordPath = process.env[\`FAKE_\${stage.toUpperCase()}_RECORD\`];
const counterPath = process.env[\`FAKE_\${stage.toUpperCase()}_COUNTER\`];
if (!scenarioPath || !recordPath || !counterPath) {
  process.stderr.write(\`Missing env for stage \${stage}\\n\`);
  process.exit(99);
}
const previous = existsSync(counterPath) ? Number.parseInt(readFileSync(counterPath, "utf8"), 10) || 0 : 0;
const callNum = previous + 1;
writeFileSync(counterPath, String(callNum));
let stdin = "";
if (stage !== "selector") { try { stdin = readFileSync(0, "utf8"); } catch { stdin = ""; } }
appendFileSync(recordPath, JSON.stringify({ call: callNum, args: process.argv.slice(2), stdin }) + "\\n");
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

describe("matrix-research-loop — --mode=deeper-research forwarding (issue #471)", () => {
  it("forwards --mode=deeper-research verbatim to the selector subprocess", () => {
    const tempDir = makeProjectTempDir("matrix-loop-deeper-");
    try {
      const fakeStagePath = writeFakeStageRunner(tempDir);
      const stages = ["selector", "researcher", "verifier", "persister"] as const;
      const scenarioPaths: Record<string, string> = {};
      const recordPaths: Record<string, string> = {};
      const counterPaths: Record<string, string> = {};
      for (const stage of stages) {
        scenarioPaths[stage] = join(tempDir, `${stage}-scenarios.json`);
        recordPaths[stage] = join(tempDir, `${stage}-record.jsonl`);
        counterPaths[stage] = join(tempDir, `${stage}-counter.txt`);
        writeFileSync(scenarioPaths[stage], "[]", "utf8");
      }

      // Selector reports "no open" on its first call so the loop exits
      // after a single selector invocation — that one call is what we
      // inspect for the forwarded --mode flag.
      writeFileSync(
        scenarioPaths.selector,
        JSON.stringify([
          {
            exitCode: 2,
            stderr: "No open matrix fact available for the requested scope.\n",
          },
        ]),
        "utf8",
      );

      const env = {
        ...(process.env as Record<string, string>),
        FAKE_SELECTOR_SCENARIO: scenarioPaths.selector,
        FAKE_SELECTOR_RECORD: recordPaths.selector,
        FAKE_SELECTOR_COUNTER: counterPaths.selector,
        FAKE_RESEARCHER_SCENARIO: scenarioPaths.researcher,
        FAKE_RESEARCHER_RECORD: recordPaths.researcher,
        FAKE_RESEARCHER_COUNTER: counterPaths.researcher,
        FAKE_VERIFIER_SCENARIO: scenarioPaths.verifier,
        FAKE_VERIFIER_RECORD: recordPaths.verifier,
        FAKE_VERIFIER_COUNTER: counterPaths.verifier,
        FAKE_PERSISTER_SCENARIO: scenarioPaths.persister,
        FAKE_PERSISTER_RECORD: recordPaths.persister,
        FAKE_PERSISTER_COUNTER: counterPaths.persister,
      };

      const result = spawnSync(
        "node",
        [
          loopRunnerPath,
          "--selector-cmd",
          `FAKE_STAGE=selector node ${fakeStagePath}`,
          "--researcher-cmd",
          `FAKE_STAGE=researcher node ${fakeStagePath}`,
          "--verifier-cmd",
          `FAKE_STAGE=verifier node ${fakeStagePath}`,
          "--persister-cmd",
          `FAKE_STAGE=persister node ${fakeStagePath}`,
          "--mode=deeper-research",
        ],
        { cwd: projectDir, encoding: "utf8", env },
      );

      expect(result.status).toBe(0);

      const selectorRecord = existsSync(recordPaths.selector)
        ? readFileSync(recordPaths.selector, "utf8")
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) => JSON.parse(line) as { call: number; args: string[] })
        : [];
      expect(selectorRecord.length).toBe(1);
      const argv = selectorRecord[0].args;
      // Accept either equals-form or space-form forwarding.
      const fused =
        argv.includes("--mode=deeper-research") ||
        (argv.includes("--mode") &&
          argv[argv.indexOf("--mode") + 1] === "deeper-research");
      expect(fused).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects an unknown --mode value with a non-zero exit and never spawns the selector", () => {
    const tempDir = makeProjectTempDir("matrix-loop-deeper-bad-");
    try {
      const fakeStagePath = writeFakeStageRunner(tempDir);
      const stages = ["selector", "researcher", "verifier", "persister"] as const;
      const scenarioPaths: Record<string, string> = {};
      const recordPaths: Record<string, string> = {};
      const counterPaths: Record<string, string> = {};
      for (const stage of stages) {
        scenarioPaths[stage] = join(tempDir, `${stage}-scenarios.json`);
        recordPaths[stage] = join(tempDir, `${stage}-record.jsonl`);
        counterPaths[stage] = join(tempDir, `${stage}-counter.txt`);
        writeFileSync(scenarioPaths[stage], "[]", "utf8");
      }

      const env = {
        ...(process.env as Record<string, string>),
        FAKE_SELECTOR_SCENARIO: scenarioPaths.selector,
        FAKE_SELECTOR_RECORD: recordPaths.selector,
        FAKE_SELECTOR_COUNTER: counterPaths.selector,
        FAKE_RESEARCHER_SCENARIO: scenarioPaths.researcher,
        FAKE_RESEARCHER_RECORD: recordPaths.researcher,
        FAKE_RESEARCHER_COUNTER: counterPaths.researcher,
        FAKE_VERIFIER_SCENARIO: scenarioPaths.verifier,
        FAKE_VERIFIER_RECORD: recordPaths.verifier,
        FAKE_VERIFIER_COUNTER: counterPaths.verifier,
        FAKE_PERSISTER_SCENARIO: scenarioPaths.persister,
        FAKE_PERSISTER_RECORD: recordPaths.persister,
        FAKE_PERSISTER_COUNTER: counterPaths.persister,
      };

      const result = spawnSync(
        "node",
        [
          loopRunnerPath,
          "--selector-cmd",
          `FAKE_STAGE=selector node ${fakeStagePath}`,
          "--researcher-cmd",
          `FAKE_STAGE=researcher node ${fakeStagePath}`,
          "--verifier-cmd",
          `FAKE_STAGE=verifier node ${fakeStagePath}`,
          "--persister-cmd",
          `FAKE_STAGE=persister node ${fakeStagePath}`,
          "--mode=does-not-exist",
        ],
        { cwd: projectDir, encoding: "utf8", env },
      );

      // CLI usage errors must fail fast — never spawn the pipeline.
      expect(result.status).not.toBe(0);
      expect(existsSync(recordPaths.selector)).toBe(false);
      expect(`${result.stdout}${result.stderr}`).toMatch(/--mode/);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("omits --mode from the forwarded selector argv when no --mode is set (regression)", () => {
    const tempDir = makeProjectTempDir("matrix-loop-no-mode-");
    try {
      const fakeStagePath = writeFakeStageRunner(tempDir);
      const stages = ["selector", "researcher", "verifier", "persister"] as const;
      const scenarioPaths: Record<string, string> = {};
      const recordPaths: Record<string, string> = {};
      const counterPaths: Record<string, string> = {};
      for (const stage of stages) {
        scenarioPaths[stage] = join(tempDir, `${stage}-scenarios.json`);
        recordPaths[stage] = join(tempDir, `${stage}-record.jsonl`);
        counterPaths[stage] = join(tempDir, `${stage}-counter.txt`);
        writeFileSync(scenarioPaths[stage], "[]", "utf8");
      }

      // Selector returns no-open on its only call so the loop exits cleanly.
      writeFileSync(
        scenarioPaths.selector,
        JSON.stringify([
          {
            exitCode: 2,
            stderr: "No open matrix fact available for the requested scope.\n",
          },
        ]),
        "utf8",
      );

      const env = {
        ...(process.env as Record<string, string>),
        FAKE_SELECTOR_SCENARIO: scenarioPaths.selector,
        FAKE_SELECTOR_RECORD: recordPaths.selector,
        FAKE_SELECTOR_COUNTER: counterPaths.selector,
        FAKE_RESEARCHER_SCENARIO: scenarioPaths.researcher,
        FAKE_RESEARCHER_RECORD: recordPaths.researcher,
        FAKE_RESEARCHER_COUNTER: counterPaths.researcher,
        FAKE_VERIFIER_SCENARIO: scenarioPaths.verifier,
        FAKE_VERIFIER_RECORD: recordPaths.verifier,
        FAKE_VERIFIER_COUNTER: counterPaths.verifier,
        FAKE_PERSISTER_SCENARIO: scenarioPaths.persister,
        FAKE_PERSISTER_RECORD: recordPaths.persister,
        FAKE_PERSISTER_COUNTER: counterPaths.persister,
      };

      const result = spawnSync(
        "node",
        [
          loopRunnerPath,
          "--selector-cmd",
          `FAKE_STAGE=selector node ${fakeStagePath}`,
          "--researcher-cmd",
          `FAKE_STAGE=researcher node ${fakeStagePath}`,
          "--verifier-cmd",
          `FAKE_STAGE=verifier node ${fakeStagePath}`,
          "--persister-cmd",
          `FAKE_STAGE=persister node ${fakeStagePath}`,
        ],
        { cwd: projectDir, encoding: "utf8", env },
      );

      expect(result.status).toBe(0);

      const selectorRecord = existsSync(recordPaths.selector)
        ? readFileSync(recordPaths.selector, "utf8")
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) => JSON.parse(line) as { call: number; args: string[] })
        : [];
      expect(selectorRecord.length).toBe(1);
      const argv = selectorRecord[0].args;
      // Without an explicit --mode the loop must not synthesize one — the
      // selector falls back to its own default ('initial').
      expect(argv.some((a) => a === "--mode" || a.startsWith("--mode="))).toBe(
        false,
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
