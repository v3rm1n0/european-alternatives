#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildFactCorrectionVerificationPrompt,
  buildNewAlternativeVerificationPrompt,
  getVerifierCommand,
  mergeVerifiedAction,
  parseVerificationResponse,
  VerificationFeedbackError,
} from "./lib/verify-fact-codex.mjs";

const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/verify-fact-codex-run.mjs --issue-file <path> --classification-file <path> --research-file <path> [options]
  node scripts/verify-fact-codex-run.mjs --issue-json <json> --classification-json <json> --research-json <json> [options]

Options:
  --issue-file <path>             Read issue JSON (number, title, body, comments) from a file.
  --issue-json <json>             Inline issue JSON string.
  --issue-number <n>              Fetch the issue via gh from --repo.
  --classification-file <path>    Read stage-1 classification JSON from a file.
  --classification-json <json>    Inline classification JSON string.
  --research-file <path>          Read stage-2 research payload JSON from a file (required).
  --research-json <json>          Inline stage-2 research payload JSON string.
  --mock-response-file <path>     Read verifier output from a file instead of invoking codex (test seam).
  --raw-output-file <path>        Write raw verifier output before parsing.
  --feedback-output-file <path>   Write structured retry feedback for non-supporting verdicts.
  --accessed-date <YYYY-MM-DD>    Override the accessed date used in the prompt and the verified_action.
  --dry-run                       Tag the emitted verified_action as dry-run.
  --repo <owner/name>             Source repo for --issue-number (default TheMorpheus407/european-alternatives).
  --help                          Show this help.
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
    verifier: "codex",
    issueFile: null,
    issueJson: null,
    issueNumber: null,
    classificationFile: null,
    classificationJson: null,
    researchFile: null,
    researchJson: null,
    mockResponseFile: null,
    rawOutputFile: null,
    feedbackOutputFile: null,
    accessedDate: null,
    dryRun: false,
    repo: "TheMorpheus407/european-alternatives",
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

    const valueOptions = [
      { flag: "--issue-file", key: "issueFile" },
      { flag: "--issue-json", key: "issueJson" },
      { flag: "--issue-number", key: "issueNumber" },
      { flag: "--classification-file", key: "classificationFile" },
      { flag: "--classification-json", key: "classificationJson" },
      { flag: "--research-file", key: "researchFile" },
      { flag: "--research-json", key: "researchJson" },
      { flag: "--mock-response-file", key: "mockResponseFile" },
      { flag: "--raw-output-file", key: "rawOutputFile" },
      { flag: "--feedback-output-file", key: "feedbackOutputFile" },
      { flag: "--accessed-date", key: "accessedDate" },
      { flag: "--repo", key: "repo" },
    ];

    let matched = false;

    for (const { flag, key } of valueOptions) {
      if (argument === flag) {
        options[key] = readRequiredOptionValue(argv, index, argument);
        index++;
        matched = true;
        break;
      }
      if (argument.startsWith(`${flag}=`)) {
        options[key] = argument.slice(flag.length + 1);
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    if (argument.startsWith("--")) {
      throw new Error(`unknown option ${argument}`);
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
  return new Promise((resolvePromise, reject) => {
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

      resolvePromise(stdout);
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
    return parseJson(await readFile(options.issueFile, "utf8"), "--issue-file");
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

async function loadClassification(options) {
  const sources = [
    options.classificationFile !== null,
    options.classificationJson !== null,
  ].filter(Boolean);

  if (sources.length === 0) {
    throw new Error(
      "Provide exactly one classification source: --classification-file or --classification-json",
    );
  }

  if (sources.length > 1) {
    throw new Error(
      "Provide exactly one classification source: --classification-file or --classification-json",
    );
  }

  if (options.classificationFile !== null) {
    return parseJson(
      await readFile(options.classificationFile, "utf8"),
      "--classification-file",
    );
  }

  return parseJson(options.classificationJson, "--classification-json");
}

async function loadResearch(options) {
  const sources = [
    options.researchFile !== null,
    options.researchJson !== null,
  ].filter(Boolean);

  if (sources.length === 0) {
    throw new Error(
      "Provide exactly one research source: --research-file or --research-json",
    );
  }

  if (sources.length > 1) {
    throw new Error(
      "Provide exactly one research source: --research-file or --research-json",
    );
  }

  if (options.researchFile !== null) {
    return parseJson(
      await readFile(options.researchFile, "utf8"),
      "--research-file",
    );
  }

  return parseJson(options.researchJson, "--research-json");
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

function normalizeClassification(rawClassification) {
  if (rawClassification === null || typeof rawClassification !== "object") {
    throw new Error("Classification payload must be a JSON object");
  }

  if (typeof rawClassification.action !== "string") {
    throw new Error("Classification payload must include an action string");
  }

  return {
    issueNumber:
      typeof rawClassification.issueNumber === "number"
        ? rawClassification.issueNumber
        : null,
    action: rawClassification.action,
    dryRun: Boolean(rawClassification.dryRun),
    reasoning:
      typeof rawClassification.reasoning === "string"
        ? rawClassification.reasoning
        : undefined,
    proposedName:
      typeof rawClassification.proposedName === "string"
        ? rawClassification.proposedName
        : undefined,
    targetEntrySlug:
      typeof rawClassification.targetEntrySlug === "string"
        ? rawClassification.targetEntrySlug
        : undefined,
  };
}

function runVerifier(commandConfig, prompt) {
  return new Promise((resolvePromise, reject) => {
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

      resolvePromise(output);
    });

    child.stdin.end(prompt);
  });
}

function isUsageError(message) {
  return /unknown option|requires a value|Unexpected positional|Provide exactly one|must be valid JSON|must be a JSON object|must include a non-empty title|must include a positive integer number|must be a positive integer/i.test(
    message,
  );
}

async function writeFeedbackArtifact(filePath, feedback) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(feedback, null, 2)}\n`, "utf8");
}

async function writeRawOutputArtifact(filePath, rawResponse) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, rawResponse, "utf8");
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

  let classification;

  try {
    const rawClassification = await loadClassification(options);
    classification = normalizeClassification(rawClassification);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  let research;

  try {
    research = await loadResearch(options);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  if (
    classification.action !== "new_alternative" &&
    classification.action !== "catalog_fact_correction"
  ) {
    process.stderr.write(
      `Fail-closed: classification action ${JSON.stringify(classification.action)} is unsupported or unclear; verifier will not run.\n`,
    );
    return FAIL_CLOSED;
  }

  let rawResponse;

  try {
    if (options.mockResponseFile !== null) {
      rawResponse = await readFile(options.mockResponseFile, "utf8");
    } else {
      let prompt;

      if (classification.action === "new_alternative") {
        prompt = buildNewAlternativeVerificationPrompt(
          issue,
          classification,
          research,
          { accessedDate: options.accessedDate ?? undefined },
        );
      } else {
        prompt = buildFactCorrectionVerificationPrompt(
          issue,
          classification,
          research,
          { accessedDate: options.accessedDate ?? undefined },
        );
      }

      const commandConfig = getVerifierCommand(options.verifier);
      rawResponse = await runVerifier(commandConfig, prompt);
    }
  } catch (error) {
    process.stderr.write(`Verifier error: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  if (options.rawOutputFile !== null) {
    try {
      await writeRawOutputArtifact(options.rawOutputFile, rawResponse);
    } catch (error) {
      process.stderr.write(`Raw output error: ${error.message}\n`);
      return FAIL_CLOSED;
    }
  }

  let parsed;

  try {
    parsed = parseVerificationResponse(rawResponse, research, classification, {
      accessedDate: options.accessedDate ?? undefined,
    });
  } catch (error) {
    if (error instanceof VerificationFeedbackError) {
      if (options.feedbackOutputFile !== null) {
        try {
          await writeFeedbackArtifact(
            options.feedbackOutputFile,
            error.feedback,
          );
        } catch (writeError) {
          process.stderr.write(
            `Feedback error: ${writeError.message}\nParse error: ${error.message}\n`,
          );
          return FAIL_CLOSED;
        }
      }
      process.stderr.write(`Parse error: ${error.message}\n`);
      return FAIL_CLOSED;
    }

    process.stderr.write(`Parse error: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  let verifiedAction;

  try {
    verifiedAction = mergeVerifiedAction(research, parsed, {
      dryRun: options.dryRun,
      accessedDate: options.accessedDate ?? undefined,
    });
  } catch (error) {
    process.stderr.write(`Merge error: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  process.stdout.write(`${JSON.stringify(verifiedAction, null, 2)}\n`);

  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const exitCode = isUsageError(message) ? INVALID_USAGE : FAIL_CLOSED;

      process.stderr.write(
        `${exitCode === INVALID_USAGE ? "Invalid usage" : "Error"}: ${message}\n`,
      );
      process.exitCode = exitCode;
    });
}
