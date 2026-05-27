#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const INVALID_USAGE = 64;
const SELECTOR_NO_OPEN = 2;

const DEFAULT_SELECTOR_CMD = "php scripts/matrix-research-select.php";
const DEFAULT_RESEARCHER_CMD =
  "node scripts/matrix-research-run.mjs --target-json-stdin";
const DEFAULT_VERIFIER_CMD = "node scripts/matrix-verify-run.mjs";
const DEFAULT_PERSISTER_CMD = "php scripts/matrix-research-persist.php";

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/matrix-research-loop.mjs [options]

Repeatedly invokes the one-fact matrix research pipeline
(selector -> researcher -> verifier -> persister) until either a
configured limit is reached or the selector reports no eligible facts.

Options:
  --max-facts N                    Stop after processing N facts.
  --max-runtime MIN                Stop after MIN minutes (fractional ok).
  --max-consecutive-failures N     Stop after N consecutive failed iterations.
  --category SLUG                  Forward --category SLUG to the selector.
  --selector-cmd <cmd>             Override the selector shell command.
  --researcher-cmd <cmd>           Override the researcher shell command.
  --verifier-cmd <cmd>             Override the verifier shell command.
  --persister-cmd <cmd>            Override the persister shell command.
  --help                           Show this help and exit.

The runner preserves the one-fact-per-invocation contract of the inner
scripts. With no limit flags it processes eligible facts until the
selector reports an empty queue (exit ${SELECTOR_NO_OPEN}).

Default verifier/persister wiring uses per-iteration temp files under
tmp/: the runner writes the bundle JSON to disk and appends
--attempt-bundle-file (verifier) or --attempt-file/--decision-file
(persister) to the command. When --verifier-cmd or --persister-cmd is
overridden, the runner instead pipes the bundle to the override on
stdin and does not inject any file flags — the operator owns the full
command.
`);
}

function readRequiredOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (value === undefined) {
    throw new Error(`${optionName} requires a value`);
  }
  return value;
}

function parsePositiveInt(raw, optionName) {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0 || String(value) !== raw.trim()) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return value;
}

function parsePositiveNumber(raw, optionName) {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${optionName} must be a positive number`);
  }
  return value;
}

function parseArguments(argv) {
  const options = {
    maxFacts: null,
    maxRuntimeMs: null,
    maxConsecutiveFailures: null,
    category: null,
    selectorCmd: DEFAULT_SELECTOR_CMD,
    researcherCmd: DEFAULT_RESEARCHER_CMD,
    verifierCmd: DEFAULT_VERIFIER_CMD,
    persisterCmd: DEFAULT_PERSISTER_CMD,
    verifierCmdOverridden: false,
    persisterCmdOverridden: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    if (argument === "--max-facts") {
      options.maxFacts = parsePositiveInt(
        readRequiredOptionValue(argv, index, argument),
        argument,
      );
      index++;
      continue;
    }
    if (argument.startsWith("--max-facts=")) {
      options.maxFacts = parsePositiveInt(
        argument.slice("--max-facts=".length),
        "--max-facts",
      );
      continue;
    }

    if (argument === "--max-runtime") {
      options.maxRuntimeMs =
        parsePositiveNumber(
          readRequiredOptionValue(argv, index, argument),
          argument,
        ) * 60_000;
      index++;
      continue;
    }
    if (argument.startsWith("--max-runtime=")) {
      options.maxRuntimeMs =
        parsePositiveNumber(
          argument.slice("--max-runtime=".length),
          "--max-runtime",
        ) * 60_000;
      continue;
    }

    if (argument === "--max-consecutive-failures") {
      options.maxConsecutiveFailures = parsePositiveInt(
        readRequiredOptionValue(argv, index, argument),
        argument,
      );
      index++;
      continue;
    }
    if (argument.startsWith("--max-consecutive-failures=")) {
      options.maxConsecutiveFailures = parsePositiveInt(
        argument.slice("--max-consecutive-failures=".length),
        "--max-consecutive-failures",
      );
      continue;
    }

    if (argument === "--category") {
      options.category = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }
    if (argument.startsWith("--category=")) {
      options.category = argument.slice("--category=".length);
      continue;
    }

    if (argument === "--selector-cmd") {
      options.selectorCmd = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }
    if (argument.startsWith("--selector-cmd=")) {
      options.selectorCmd = argument.slice("--selector-cmd=".length);
      continue;
    }

    if (argument === "--researcher-cmd") {
      options.researcherCmd = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }
    if (argument.startsWith("--researcher-cmd=")) {
      options.researcherCmd = argument.slice("--researcher-cmd=".length);
      continue;
    }

    if (argument === "--verifier-cmd") {
      options.verifierCmd = readRequiredOptionValue(argv, index, argument);
      options.verifierCmdOverridden = true;
      index++;
      continue;
    }
    if (argument.startsWith("--verifier-cmd=")) {
      options.verifierCmd = argument.slice("--verifier-cmd=".length);
      options.verifierCmdOverridden = true;
      continue;
    }

    if (argument === "--persister-cmd") {
      options.persisterCmd = readRequiredOptionValue(argv, index, argument);
      options.persisterCmdOverridden = true;
      index++;
      continue;
    }
    if (argument.startsWith("--persister-cmd=")) {
      options.persisterCmd = argument.slice("--persister-cmd=".length);
      options.persisterCmdOverridden = true;
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown option ${argument}`);
    }

    throw new Error(`Unexpected positional argument ${argument}`);
  }

  return options;
}

function shellQuote(value) {
  if (value === "") return "''";
  if (/^[A-Za-z0-9_\-./=:]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildShellCommand(baseCmd, extraArgs) {
  const trimmed = baseCmd.trim();
  if (extraArgs.length === 0) return trimmed;
  const suffix = extraArgs.map(shellQuote).join(" ");
  return `${trimmed} ${suffix}`;
}

function tempFilePath(iteration, suffix) {
  const tmpDir = resolve("tmp");
  mkdirSync(tmpDir, { recursive: true });
  return resolve(
    tmpDir,
    `matrix-loop-${process.pid}-${iteration}-${suffix}.json`,
  );
}

function cleanupTempFiles(paths) {
  if (process.env.MATRIX_LOOP_KEEP_TEMP === "1") return;
  for (const path of paths) {
    try {
      unlinkSync(path);
    } catch {
      // Ignore — file may already be gone if the stage cleaned it up.
    }
  }
}

function buildVerifierInvocation(options, iteration, target, attempt) {
  if (options.verifierCmdOverridden) {
    return {
      cmd: options.verifierCmd,
      stdin: `${JSON.stringify({ target, attempt })}\n`,
      tempFiles: [],
    };
  }
  const bundlePath = tempFilePath(iteration, "verify");
  writeFileSync(bundlePath, JSON.stringify({ target, attempt }), "utf8");
  return {
    cmd: buildShellCommand(options.verifierCmd, [
      "--attempt-bundle-file",
      bundlePath,
    ]),
    stdin: null,
    tempFiles: [bundlePath],
  };
}

function buildPersisterInvocation(options, iteration, attempt, decision) {
  if (options.persisterCmdOverridden) {
    return {
      cmd: options.persisterCmd,
      stdin: `${JSON.stringify({ attempt, decision })}\n`,
      tempFiles: [],
    };
  }
  const attemptPath = tempFilePath(iteration, "attempt");
  const decisionPath = tempFilePath(iteration, "decision");
  writeFileSync(attemptPath, JSON.stringify(attempt), "utf8");
  writeFileSync(decisionPath, JSON.stringify(decision), "utf8");
  return {
    cmd: buildShellCommand(options.persisterCmd, [
      "--attempt-file",
      attemptPath,
      "--decision-file",
      decisionPath,
    ]),
    stdin: null,
    tempFiles: [attemptPath, decisionPath],
  };
}

function runStage(shellCommand, stdinPayload) {
  return new Promise((resolvePromise) => {
    const child = spawn(shellCommand, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdoutChunks = [];
    const stderrChunks = [];
    let spawnError = null;

    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      spawnError = error;
    });

    child.on("close", (code, signal) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      resolvePromise({
        code: typeof code === "number" ? code : null,
        signal,
        stdout,
        stderr,
        spawnError,
      });
    });

    if (child.stdin) {
      child.stdin.on("error", () => {
        // Ignore EPIPE etc. — surfaced via exit code/stderr.
      });
      if (stdinPayload !== null && stdinPayload !== undefined) {
        child.stdin.end(stdinPayload);
      } else {
        child.stdin.end();
      }
    }
  });
}

function parseJsonOrThrow(text, stageLabel) {
  const trimmed = text.trim();
  if (trimmed === "") {
    throw new Error(`${stageLabel} produced empty stdout`);
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`${stageLabel} produced invalid JSON: ${error.message}`);
  }
}

function formatSummary(state) {
  const lines = [
    "Matrix research loop summary:",
    `  processed: ${state.processed}`,
    `  verified: ${state.counters.verified}`,
    `  rejected: ${state.counters.rejected}`,
    `  needs-deeper-research: ${state.counters["needs-deeper-research"]}`,
    `  skipped: ${state.counters.skipped}`,
    `  failed: ${state.counters.failed}`,
    `  no-open: ${state.counters["no-open"]}`,
    `  elapsed-ms: ${state.elapsedMs}`,
  ];
  return `${lines.join("\n")}\n`;
}

function shouldStopForLimits(options, state) {
  if (options.maxFacts !== null && state.processed >= options.maxFacts) {
    return "max-facts reached";
  }
  if (
    options.maxRuntimeMs !== null &&
    Date.now() - state.startMs >= options.maxRuntimeMs
  ) {
    return "max-runtime reached";
  }
  return null;
}

async function runIteration(options, state) {
  const iteration = state.processed + 1;

  const selectorExtraArgs = [];
  if (options.category !== null) {
    selectorExtraArgs.push("--category", options.category);
  }
  const selectorCmd = buildShellCommand(options.selectorCmd, selectorExtraArgs);

  const selectorResult = await runStage(selectorCmd, null);

  if (selectorResult.spawnError) {
    process.stderr.write(
      `Selector spawn error: ${selectorResult.spawnError.message}\n`,
    );
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  if (selectorResult.code === SELECTOR_NO_OPEN) {
    state.counters["no-open"] += 1;
    return { continue: false, reason: "no-open" };
  }

  if (selectorResult.code === INVALID_USAGE) {
    process.stderr.write(
      `Selector reported invalid usage (exit ${INVALID_USAGE}). Aborting.\n`,
    );
    if (selectorResult.stderr) process.stderr.write(selectorResult.stderr);
    return { continue: false, reason: "selector-usage-error", fatal: true };
  }

  if (selectorResult.code !== 0) {
    process.stderr.write(
      `Selector exited with status ${String(selectorResult.code)}\n`,
    );
    if (selectorResult.stderr) process.stderr.write(selectorResult.stderr);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  let target;
  try {
    target = parseJsonOrThrow(selectorResult.stdout, "Selector");
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  const factLabel =
    target && typeof target === "object" && "factId" in target
      ? `fact=${String(target.factId)}`
      : "fact=?";

  const researcherResult = await runStage(
    options.researcherCmd,
    `${JSON.stringify(target)}\n`,
  );
  if (
    researcherResult.spawnError ||
    researcherResult.code !== 0 ||
    researcherResult.stdout.trim() === ""
  ) {
    process.stderr.write(
      `[iter ${iteration}] ${factLabel} researcher failed (exit ${String(researcherResult.code)})\n`,
    );
    if (researcherResult.stderr) process.stderr.write(researcherResult.stderr);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  let attempt;
  try {
    attempt = parseJsonOrThrow(researcherResult.stdout, "Researcher");
  } catch (error) {
    process.stderr.write(`[iter ${iteration}] ${error.message}\n`);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  const verifierInvocation = buildVerifierInvocation(
    options,
    iteration,
    target,
    attempt,
  );
  process.stderr.write(
    `[iter ${iteration}] spawn verifier: ${verifierInvocation.cmd}\n`,
  );
  let verifierResult;
  try {
    verifierResult = await runStage(
      verifierInvocation.cmd,
      verifierInvocation.stdin,
    );
  } finally {
    cleanupTempFiles(verifierInvocation.tempFiles);
  }
  if (
    verifierResult.spawnError ||
    verifierResult.code !== 0 ||
    verifierResult.stdout.trim() === ""
  ) {
    process.stderr.write(
      `[iter ${iteration}] ${factLabel} verifier failed (exit ${String(verifierResult.code)})\n`,
    );
    if (verifierResult.stderr) process.stderr.write(verifierResult.stderr);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  let decision;
  try {
    decision = parseJsonOrThrow(verifierResult.stdout, "Verifier");
  } catch (error) {
    process.stderr.write(`[iter ${iteration}] ${error.message}\n`);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  const persisterInvocation = buildPersisterInvocation(
    options,
    iteration,
    attempt,
    decision,
  );
  process.stderr.write(
    `[iter ${iteration}] spawn persister: ${persisterInvocation.cmd}\n`,
  );
  let persisterResult;
  try {
    persisterResult = await runStage(
      persisterInvocation.cmd,
      persisterInvocation.stdin,
    );
  } finally {
    cleanupTempFiles(persisterInvocation.tempFiles);
  }
  if (
    persisterResult.spawnError ||
    persisterResult.code !== 0 ||
    persisterResult.stdout.trim() === ""
  ) {
    process.stderr.write(
      `[iter ${iteration}] ${factLabel} persister failed (exit ${String(persisterResult.code)})\n`,
    );
    if (persisterResult.stderr) process.stderr.write(persisterResult.stderr);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  let persistOutcome;
  try {
    persistOutcome = parseJsonOrThrow(persisterResult.stdout, "Persister");
  } catch (error) {
    process.stderr.write(`[iter ${iteration}] ${error.message}\n`);
    state.counters.failed += 1;
    state.consecutiveFailures += 1;
    state.processed += 1;
    return { continue: true };
  }

  const factStatus =
    persistOutcome && typeof persistOutcome === "object"
      ? persistOutcome.factStatus
      : null;

  if (
    factStatus === "verified" ||
    factStatus === "rejected" ||
    factStatus === "needs-deeper-research"
  ) {
    state.counters[factStatus] += 1;
  } else {
    state.counters.skipped += 1;
  }

  state.consecutiveFailures = 0;
  state.processed += 1;

  process.stdout.write(
    `[iter ${state.processed}] ${factLabel} status=${String(factStatus)}\n`,
  );

  return { continue: true };
}

async function runLoop(options) {
  const state = {
    counters: {
      verified: 0,
      rejected: 0,
      "needs-deeper-research": 0,
      skipped: 0,
      failed: 0,
      "no-open": 0,
    },
    processed: 0,
    consecutiveFailures: 0,
    startMs: Date.now(),
    elapsedMs: 0,
  };

  let fatal = false;

  while (true) {
    const stopReason = shouldStopForLimits(options, state);
    if (stopReason) {
      process.stdout.write(`Loop stop: ${stopReason}\n`);
      break;
    }

    const iteration = await runIteration(options, state);

    if (iteration.fatal) {
      fatal = true;
      break;
    }
    if (!iteration.continue) {
      break;
    }

    if (
      options.maxConsecutiveFailures !== null &&
      state.consecutiveFailures >= options.maxConsecutiveFailures
    ) {
      process.stdout.write(
        `Loop stop: max-consecutive-failures reached (${state.consecutiveFailures})\n`,
      );
      break;
    }
  }

  state.elapsedMs = Date.now() - state.startMs;
  process.stdout.write(formatSummary(state));

  return fatal ? 1 : 0;
}

async function main(argv) {
  const options = parseArguments(argv);

  if (options.help) {
    printUsage(process.stdout);
    return 0;
  }

  return await runLoop(options);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const isUsageError =
        /requires a value|Unknown option|Unexpected positional|must be a positive/i.test(
          error.message,
        );
      process.stderr.write(
        `${isUsageError ? "Invalid usage" : "Loop error"}: ${error.message}\n`,
      );
      process.exitCode = isUsageError ? INVALID_USAGE : 1;
    });
}
