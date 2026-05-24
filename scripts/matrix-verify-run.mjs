#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildMatrixVerificationPrompt,
  decideMatrixVerificationOutcome,
  formatVerifierCommand,
  getVerifierCommand,
  parseMatrixVerificationResponse,
  validatePendingVerificationInput,
} from "./lib/matrix-verifier.mjs";

const INVALID_USAGE = 64;
const VERIFIER_INDICES = Object.freeze([1, 2, 3]);

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/matrix-verify-run.mjs --verifier <codex|claude> --target-json <json> --attempt-json <json> [options]
  node scripts/matrix-verify-run.mjs --verifier <codex|claude> --target-file <path> --attempt-file <path> [options]
  node scripts/matrix-verify-run.mjs --verifier <codex|claude> --attempt-bundle-file <path> [options]

Options:
  --verifier <codex|claude>         Verifier CLI to invoke.
  --target-json <json>              Selected matrix fact target JSON.
  --target-file <path>              Read selected target JSON from a file.
  --target-json-stdin               Read selected target JSON from stdin.
  --attempt-json <json>             Pending research attempt JSON.
  --attempt-file <path>             Read pending attempt JSON from a file.
  --attempt-json-stdin              Read pending attempt JSON from stdin.
  --attempt-bundle-file <path>      Read { "target": ..., "attempt": ... } from a file.
  --mock-response-file <path>       Add one mocked verifier output file. Repeat three times.
  --mock-response-files <paths>     Comma-separated mocked verifier output files.
  --mock-response-dir <path>        Read response-1.txt, response-2.txt, response-3.txt.
  --accessed-date <YYYY-MM-DD>      Date to include in verifier prompts.
  --model <name>                    Optional model metadata for parsed records.
  --help                            Show this help.
`);
}

function readRequiredOptionValue(argv, index, optionName) {
  const nextIndex = index + 1;
  const value = argv[nextIndex];

  if (value === undefined || value.startsWith("--") || value.trim() === "") {
    throw new Error(`${optionName} requires a value`);
  }

  return value;
}

function splitPathList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArguments(argv) {
  const options = {
    verifier: "codex",
    targetJson: null,
    targetFile: null,
    targetJsonStdin: false,
    attemptJson: null,
    attemptFile: null,
    attemptJsonStdin: false,
    attemptBundleFile: null,
    mockResponseFiles: [],
    mockResponseDir: null,
    accessedDate: undefined,
    model: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    if (argument === "--help") {
      options.help = true;
      continue;
    }

    if (argument === "--target-json-stdin") {
      options.targetJsonStdin = true;
      continue;
    }

    if (argument === "--attempt-json-stdin") {
      options.attemptJsonStdin = true;
      continue;
    }

    if (argument === "--verifier") {
      options.verifier = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--target-json") {
      options.targetJson = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--target-file") {
      options.targetFile = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--attempt-json") {
      options.attemptJson = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--attempt-file") {
      options.attemptFile = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--attempt-bundle-file") {
      options.attemptBundleFile = readRequiredOptionValue(
        argv,
        index,
        argument,
      );
      index++;
      continue;
    }

    if (argument === "--mock-response-file") {
      options.mockResponseFiles.push(
        readRequiredOptionValue(argv, index, argument),
      );
      index++;
      continue;
    }

    if (argument === "--mock-response-files") {
      options.mockResponseFiles.push(
        ...splitPathList(readRequiredOptionValue(argv, index, argument)),
      );
      index++;
      continue;
    }

    if (argument === "--mock-response-dir") {
      options.mockResponseDir = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--accessed-date") {
      options.accessedDate = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--model") {
      options.model = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument.startsWith("--verifier=")) {
      options.verifier = argument.slice("--verifier=".length);
      continue;
    }

    if (argument.startsWith("--target-json=")) {
      options.targetJson = argument.slice("--target-json=".length);
      continue;
    }

    if (argument.startsWith("--target-file=")) {
      options.targetFile = argument.slice("--target-file=".length);
      continue;
    }

    if (argument.startsWith("--attempt-json=")) {
      options.attemptJson = argument.slice("--attempt-json=".length);
      continue;
    }

    if (argument.startsWith("--attempt-file=")) {
      options.attemptFile = argument.slice("--attempt-file=".length);
      continue;
    }

    if (argument.startsWith("--attempt-bundle-file=")) {
      options.attemptBundleFile = argument.slice(
        "--attempt-bundle-file=".length,
      );
      continue;
    }

    if (argument.startsWith("--mock-response-file=")) {
      options.mockResponseFiles.push(
        argument.slice("--mock-response-file=".length),
      );
      continue;
    }

    if (argument.startsWith("--mock-response-files=")) {
      options.mockResponseFiles.push(
        ...splitPathList(argument.slice("--mock-response-files=".length)),
      );
      continue;
    }

    if (argument.startsWith("--mock-response-dir=")) {
      options.mockResponseDir = argument.slice("--mock-response-dir=".length);
      continue;
    }

    if (argument.startsWith("--accessed-date=")) {
      options.accessedDate = argument.slice("--accessed-date=".length);
      continue;
    }

    if (argument.startsWith("--model=")) {
      options.model = argument.slice("--model=".length);
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown option ${argument}`);
    }

    throw new Error(`Unexpected positional argument ${argument}`);
  }

  return options;
}

async function readStdin() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error.message}`);
  }
}

async function loadBundle(options) {
  if (options.attemptBundleFile === null) {
    return null;
  }

  const bundle = parseJson(
    await readFile(options.attemptBundleFile, "utf8"),
    "--attempt-bundle-file",
  );

  if (bundle === null || typeof bundle !== "object" || Array.isArray(bundle)) {
    throw new Error("--attempt-bundle-file must contain one JSON object");
  }

  if (!("target" in bundle) || !("attempt" in bundle)) {
    throw new Error(
      "--attempt-bundle-file must contain target and attempt objects",
    );
  }

  return {
    target: bundle.target,
    attempt: bundle.attempt,
  };
}

async function loadTarget(options, stdinText) {
  const targetSources = [
    options.targetJson !== null,
    options.targetFile !== null,
    options.targetJsonStdin,
  ].filter(Boolean);

  if (targetSources.length !== 1) {
    throw new Error(
      "Provide exactly one target source: --target-json, --target-file, or --target-json-stdin",
    );
  }

  if (options.targetJson !== null) {
    return parseJson(options.targetJson, "--target-json");
  }

  if (options.targetFile !== null) {
    return parseJson(
      await readFile(options.targetFile, "utf8"),
      "--target-file",
    );
  }

  return parseJson(stdinText, "--target-json-stdin");
}

async function loadAttempt(options, stdinText) {
  const attemptSources = [
    options.attemptJson !== null,
    options.attemptFile !== null,
    options.attemptJsonStdin,
  ].filter(Boolean);

  if (attemptSources.length !== 1) {
    throw new Error(
      "Provide exactly one attempt source: --attempt-json, --attempt-file, or --attempt-json-stdin",
    );
  }

  if (options.attemptJson !== null) {
    return parseJson(options.attemptJson, "--attempt-json");
  }

  if (options.attemptFile !== null) {
    return parseJson(
      await readFile(options.attemptFile, "utf8"),
      "--attempt-file",
    );
  }

  return parseJson(stdinText, "--attempt-json-stdin");
}

async function loadInputs(options) {
  const bundle = await loadBundle(options);

  if (bundle !== null) {
    const hasTargetSource =
      options.targetJson !== null ||
      options.targetFile !== null ||
      options.targetJsonStdin;
    const hasAttemptSource =
      options.attemptJson !== null ||
      options.attemptFile !== null ||
      options.attemptJsonStdin;

    if (hasTargetSource || hasAttemptSource) {
      throw new Error(
        "Do not combine --attempt-bundle-file with target or attempt sources",
      );
    }

    return bundle;
  }

  if (options.targetJsonStdin && options.attemptJsonStdin) {
    throw new Error("stdin can only be used for one JSON source");
  }

  const stdinText =
    options.targetJsonStdin || options.attemptJsonStdin
      ? await readStdin()
      : "";

  return {
    target: await loadTarget(options, stdinText),
    attempt: await loadAttempt(options, stdinText),
  };
}

function resolveMockResponseFiles(options) {
  if (
    options.mockResponseDir !== null &&
    options.mockResponseFiles.length > 0
  ) {
    throw new Error(
      "Use either --mock-response-dir or --mock-response-file(s), not both",
    );
  }

  if (options.mockResponseDir !== null) {
    return VERIFIER_INDICES.map(
      (verifierIndex) =>
        `${options.mockResponseDir}/response-${String(verifierIndex)}.txt`,
    );
  }

  if (options.mockResponseFiles.length === 0) {
    return null;
  }

  if (options.mockResponseFiles.length !== 3) {
    throw new Error("Mock verification requires exactly three response files");
  }

  return options.mockResponseFiles;
}

function runVerifier(commandConfig, prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(commandConfig.command, commandConfig.args, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on("data", (chunk) => {
      stdout.push(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr.push(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code, signal) => {
      const output = Buffer.concat(stdout).toString("utf8");
      const errorOutput = Buffer.concat(stderr).toString("utf8").trim();

      if (code !== 0) {
        reject(
          new Error(
            `Verifier exited with ${signal ?? `status ${String(code)}`}${
              errorOutput === "" ? "" : `: ${errorOutput}`
            }`,
          ),
        );
        return;
      }

      resolve(output);
    });

    child.stdin.end(prompt);
  });
}

async function main(argv) {
  const options = parseArguments(argv);

  if (options.help) {
    printUsage(process.stdout);
    return 0;
  }

  const commandConfig = getVerifierCommand(options.verifier);
  const { target, attempt } = await loadInputs(options);
  const mockResponseFiles = resolveMockResponseFiles(options);

  validatePendingVerificationInput(target, attempt);

  const records = [];

  for (const verifierIndex of VERIFIER_INDICES) {
    const prompt = buildMatrixVerificationPrompt(target, attempt, {
      verifierIndex,
      accessedDate: options.accessedDate,
    });
    const rawResponse =
      mockResponseFiles === null
        ? await runVerifier(commandConfig, prompt)
        : await readFile(mockResponseFiles[verifierIndex - 1], "utf8");

    records.push(
      parseMatrixVerificationResponse(rawResponse, target, attempt, {
        verifierIndex,
        agent: options.verifier,
        command: formatVerifierCommand(commandConfig),
        model: options.model,
      }),
    );
  }

  const decision = decideMatrixVerificationOutcome(attempt, records);

  process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);

  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const isUsageError =
        /requires a value|Unknown option|Unexpected positional|Provide exactly one|Do not combine|stdin can only|Mock verification|Unknown matrix verifier|Use either/i.test(
          error.message,
        );

      process.stderr.write(
        `${isUsageError ? "Invalid usage" : "Parse error"}: ${error.message}\n`,
      );
      process.exitCode = isUsageError ? INVALID_USAGE : 1;
    });
}
