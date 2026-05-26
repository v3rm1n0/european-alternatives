#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildIssueClassificationPrompt,
  getClassifierCommand,
  parseIssueClassificationResponse,
} from "./lib/classify-issue-codex.mjs";

const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/research-issue-codex-run.mjs --issue-file <path> [options]
  node scripts/research-issue-codex-run.mjs --issue-json <json> [options]
  node scripts/research-issue-codex-run.mjs --issue-number <n> [options]

Options:
  --issue-file <path>          Read issue JSON (number, title, body, comments) from a file.
  --issue-json <json>          Inline issue JSON string.
  --issue-number <n>           Fetch the issue via gh from --repo (default TheMorpheus407/european-alternatives).
  --repo <owner/name>          Source repo for --issue-number (default TheMorpheus407/european-alternatives).
  --mock-response-file <path>  Read classifier output from a file instead of invoking codex.
  --dry-run                    Tag the emitted classification as dry-run (no downstream side effects).
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
    classifier: "codex",
    issueFile: null,
    issueJson: null,
    issueNumber: null,
    repo: "TheMorpheus407/european-alternatives",
    mockResponseFile: null,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (argument === "--issue-file") {
      options.issueFile = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--issue-json") {
      options.issueJson = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--issue-number") {
      options.issueNumber = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--repo") {
      options.repo = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument === "--mock-response-file") {
      options.mockResponseFile = readRequiredOptionValue(argv, index, argument);
      index++;
      continue;
    }

    if (argument.startsWith("--issue-file=")) {
      options.issueFile = argument.slice("--issue-file=".length);
      continue;
    }

    if (argument.startsWith("--issue-json=")) {
      options.issueJson = argument.slice("--issue-json=".length);
      continue;
    }

    if (argument.startsWith("--issue-number=")) {
      options.issueNumber = argument.slice("--issue-number=".length);
      continue;
    }

    if (argument.startsWith("--repo=")) {
      options.repo = argument.slice("--repo=".length);
      continue;
    }

    if (argument.startsWith("--mock-response-file=")) {
      options.mockResponseFile = argument.slice(
        "--mock-response-file=".length,
      );
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`Unknown option ${argument}`);
    }

    throw new Error(`Unexpected positional argument ${argument}`);
  }

  return options;
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error.message}`);
  }
}

function fetchIssueViaGh(repo, issueNumber) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "gh",
      [
        "issue",
        "view",
        String(issueNumber),
        "--repo",
        repo,
        "--json",
        "number,title,body,comments,url",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const stdoutChunks = [];
    const stderrChunks = [];

    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to spawn gh: ${error.message}`));
    });

    child.on("close", (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();

      if (code !== 0) {
        reject(
          new Error(
            `gh exited with status ${String(code)}${
              stderr === "" ? "" : `: ${stderr}`
            }`,
          ),
        );
        return;
      }

      resolve(stdout);
    });
  });
}

async function loadIssue(options) {
  const sources = [
    options.issueFile !== null,
    options.issueJson !== null,
    options.issueNumber !== null,
  ].filter(Boolean);

  if (sources.length === 0) {
    throw new Error(
      "Provide exactly one issue source: --issue-file, --issue-json, or --issue-number",
    );
  }

  if (sources.length > 1) {
    throw new Error(
      "Provide exactly one issue source: --issue-file, --issue-json, or --issue-number",
    );
  }

  if (options.issueFile !== null) {
    return parseJson(
      await readFile(options.issueFile, "utf8"),
      "--issue-file",
    );
  }

  if (options.issueJson !== null) {
    return parseJson(options.issueJson, "--issue-json");
  }

  const issueNumber = Number.parseInt(String(options.issueNumber), 10);

  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error("--issue-number must be a positive integer");
  }

  const issueJson = await fetchIssueViaGh(options.repo, issueNumber);

  return parseJson(issueJson, "gh issue view output");
}

function normalizeIssue(rawIssue) {
  if (rawIssue === null || typeof rawIssue !== "object") {
    throw new Error("Issue payload must be a JSON object");
  }

  const number =
    typeof rawIssue.number === "number"
      ? rawIssue.number
      : Number.parseInt(String(rawIssue.number), 10);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error("Issue payload must include a positive integer number");
  }

  if (typeof rawIssue.title !== "string" || rawIssue.title.trim() === "") {
    throw new Error("Issue payload must include a non-empty title");
  }

  const body = typeof rawIssue.body === "string" ? rawIssue.body : "";
  const comments = Array.isArray(rawIssue.comments) ? rawIssue.comments : [];
  const url = typeof rawIssue.url === "string" ? rawIssue.url : undefined;

  return {
    number,
    title: rawIssue.title,
    body,
    comments,
    url,
  };
}

function runClassifier(commandConfig, prompt) {
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
            `Classifier exited with ${signal ?? `status ${String(code)}`}${
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

function isUsageError(message) {
  return /requires a value|Unknown option|Unexpected positional|Provide exactly one issue source|--issue-(file|json|number)|must be a positive integer|must include a non-empty title|must include a positive integer number|must be valid JSON|must be a JSON object/i.test(
    message,
  );
}

function isParseError(message) {
  return /sentinel|classifier|classification|JSON|payload|action/i.test(
    message,
  );
}

async function main(argv) {
  let options;

  try {
    options = parseArguments(argv);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  if (options.help) {
    printUsage(process.stdout);
    return 0;
  }

  let issue;

  try {
    const rawIssue = await loadIssue(options);
    issue = normalizeIssue(rawIssue);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  const prompt = buildIssueClassificationPrompt(issue);

  let rawResponse;

  try {
    if (options.mockResponseFile !== null) {
      rawResponse = await readFile(options.mockResponseFile, "utf8");
    } else {
      const commandConfig = getClassifierCommand(options.classifier);
      rawResponse = await runClassifier(commandConfig, prompt);
    }
  } catch (error) {
    process.stderr.write(`Classifier error: ${error.message}\n`);
    return 1;
  }

  let parsed;

  try {
    parsed = parseIssueClassificationResponse(rawResponse, issue);
  } catch (error) {
    process.stderr.write(`Parse error: ${error.message}\n`);
    return 1;
  }

  const result = {
    issueNumber: parsed.issueNumber,
    action: parsed.action,
    dryRun: options.dryRun,
  };

  if (typeof parsed.reasoning === "string") {
    result.reasoning = parsed.reasoning;
  }

  if (typeof parsed.proposedName === "string") {
    result.proposedName = parsed.proposedName;
  }

  if (typeof parsed.targetEntrySlug === "string") {
    result.targetEntrySlug = parsed.targetEntrySlug;
  }

  if (parsed.action === "unsupported_or_unclear") {
    process.stderr.write(
      `Fail-closed: issue #${issue.number} classified as unsupported_or_unclear; no downstream pipeline step will run.\n`,
    );
    return FAIL_CLOSED;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const exitCode = isUsageError(message)
        ? INVALID_USAGE
        : isParseError(message)
          ? 1
          : 1;

      process.stderr.write(
        `${exitCode === INVALID_USAGE ? "Invalid usage" : "Error"}: ${message}\n`,
      );
      process.exitCode = exitCode;
    });
}
