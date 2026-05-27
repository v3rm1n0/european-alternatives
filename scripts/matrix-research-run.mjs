#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildMatrixResearchPrompt,
  formatResearcherCommand,
  getResearcherCommand,
  parseMatrixResearchResponse,
} from "./lib/matrix-researcher.mjs";

const INVALID_USAGE = 64;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/matrix-research-run.mjs --researcher <codex|claude> --target-json <json> [options]
  node scripts/matrix-research-run.mjs --researcher <codex|claude> --target-file <path> [options]
  node scripts/matrix-research-run.mjs --researcher <codex|claude> --target-json-stdin [options]

Options:
  --researcher <codex|claude>  Researcher CLI to invoke.
  --target-json <json>         Selected matrix fact target JSON.
  --target-file <path>         Read selected target JSON from a file.
  --target-json-stdin          Read selected target JSON from stdin.
  --mock-response-file <path>  Read researcher output from a file instead of invoking a live CLI.
  --accessed-date <YYYY-MM-DD> Date to include in the researcher prompt.
  --model <name>               Optional model metadata to include in the parsed attempt.
  --help                       Show this help.
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

function parseArguments(argv) {
  const options = {
    researcher: "codex",
    targetJson: null,
    targetFile: null,
    targetJsonStdin: false,
    mockResponseFile: null,
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

    if (argument === "--researcher") {
      options.researcher = readRequiredOptionValue(argv, index, argument);
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

    if (argument === "--mock-response-file") {
      options.mockResponseFile = readRequiredOptionValue(argv, index, argument);
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

    if (argument.startsWith("--researcher=")) {
      options.researcher = argument.slice("--researcher=".length);
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

    if (argument.startsWith("--mock-response-file=")) {
      options.mockResponseFile = argument.slice("--mock-response-file=".length);
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

async function loadTarget(options) {
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

  return parseJson(await readStdin(), "--target-json-stdin");
}

export function buildPromptForTarget(target, options = {}) {
  const promptOptions = {
    accessedDate: options.accessedDate,
  };
  if (target?.previousStatus === "needs-deeper-research") {
    promptOptions.mode = "deeper-research";
  }
  return buildMatrixResearchPrompt(target, promptOptions);
}

function validateClaimedTarget(target) {
  if (target === null || typeof target !== "object" || Array.isArray(target)) {
    throw new Error("Selected target must be one JSON object");
  }

  if (target.dryRun === true) {
    throw new Error("Refusing to research a dry-run target");
  }

  if (target.status !== "researching") {
    throw new Error("Selected target status must be researching");
  }
}

function runResearcher(commandConfig, prompt) {
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
            `Researcher exited with ${signal ?? `status ${String(code)}`}${
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

  const commandConfig = getResearcherCommand(options.researcher);
  const target = await loadTarget(options);

  validateClaimedTarget(target);

  const prompt = buildPromptForTarget(target, {
    accessedDate: options.accessedDate,
  });
  const rawResponse =
    options.mockResponseFile === null
      ? await runResearcher(commandConfig, prompt)
      : await readFile(options.mockResponseFile, "utf8");

  const attempt = parseMatrixResearchResponse(rawResponse, target, {
    agent: options.researcher,
    command: formatResearcherCommand(commandConfig),
    model: options.model,
  });

  process.stdout.write(`${JSON.stringify(attempt, null, 2)}\n`);

  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const isUsageError =
        /requires a value|Unknown option|Unexpected positional|Provide exactly one target source|researcher/i.test(
          error.message,
        );

      process.stderr.write(
        `${isUsageError ? "Invalid usage" : "Parse error"}: ${error.message}\n`,
      );
      process.exitCode = isUsageError ? INVALID_USAGE : 1;
    });
}
