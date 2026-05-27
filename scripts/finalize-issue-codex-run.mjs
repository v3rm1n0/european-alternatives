#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSuccessComment,
  validateFinalizerInputs,
} from "./lib/finalize-issue-codex.mjs";

const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;
const DEFAULT_REPO = "TheMorpheus407/european-alternatives";

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/finalize-issue-codex-run.mjs --verified-action-file <path> --mutation-outcome-file <path> --repo <owner/name> [--dry-run]
  node scripts/finalize-issue-codex-run.mjs --help

Stage-5 finalizer for the Codex catalog suggestion pipeline. Reads the
verified action (stage 3) and the mutation outcome (stage 4); on success,
posts a single source-backed comment to the originating GitHub issue and
then closes the issue. Fails closed without commenting or closing on any
earlier pipeline error.

Options:
  --verified-action-file <path>    Stage-3 verified_action JSON (required).
  --mutation-outcome-file <path>   Stage-4 mutation outcome JSON (required).
  --repo <owner/name>              GitHub repo to comment/close on
                                   (default ${DEFAULT_REPO}).
  --dry-run                        Render the would-be comment as a JSON
                                   envelope on stdout and never invoke gh.
  --help                           Show this help.

Exit codes:
  0    success (comment posted and issue closed), or dry-run rendered.
  64   invalid CLI usage.
  65   fail-closed (validation failed, comment or close failed, etc.).
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
    verifiedActionFile: null,
    mutationOutcomeFile: null,
    repo: DEFAULT_REPO,
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

    const valueOptions = [
      { flag: "--verified-action-file", key: "verifiedActionFile" },
      { flag: "--mutation-outcome-file", key: "mutationOutcomeFile" },
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

    throw new Error(`unexpected positional argument ${argument}`);
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

async function loadJsonFile(path, label) {
  let text;

  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    throw new Error(`failed to read ${label} ${path}: ${error.message}`);
  }

  return parseJson(text, label);
}

function resolveIssueNumber(verifiedAction, mutationOutcome) {
  const fromAction =
    typeof verifiedAction.issueNumber === "number"
      ? verifiedAction.issueNumber
      : Number.parseInt(String(verifiedAction.issueNumber), 10);

  if (Number.isInteger(fromAction) && fromAction > 0) {
    return fromAction;
  }

  const fromOutcome =
    typeof mutationOutcome.issueNumber === "number"
      ? mutationOutcome.issueNumber
      : Number.parseInt(String(mutationOutcome.issueNumber), 10);

  if (Number.isInteger(fromOutcome) && fromOutcome > 0) {
    return fromOutcome;
  }

  throw new Error(
    "could not determine issue number from verifiedAction.issueNumber or mutationOutcome.issueNumber",
  );
}

function runGh(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("gh", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdoutChunks = [];
    const stderrChunks = [];

    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderrChunks.push(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      resolvePromise({
        status: typeof code === "number" ? code : 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });
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

  if (options.verifiedActionFile === null) {
    process.stderr.write(
      "Invalid usage: --verified-action-file is required; please provide one.\n",
    );
    return INVALID_USAGE;
  }

  if (options.mutationOutcomeFile === null) {
    process.stderr.write(
      "Invalid usage: --mutation-outcome-file is required; please provide one.\n",
    );
    return INVALID_USAGE;
  }

  let verifiedAction;
  let mutationOutcome;

  try {
    verifiedAction = await loadJsonFile(
      options.verifiedActionFile,
      "--verified-action-file",
    );
    mutationOutcome = await loadJsonFile(
      options.mutationOutcomeFile,
      "--mutation-outcome-file",
    );
  } catch (error) {
    process.stderr.write(`Fail-closed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  const dryRun =
    options.dryRun ||
    (verifiedAction !== null &&
      typeof verifiedAction === "object" &&
      verifiedAction.dryRun === true) ||
    (mutationOutcome !== null &&
      typeof mutationOutcome === "object" &&
      mutationOutcome.dryRun === true);

  let issueNumber;

  try {
    issueNumber = resolveIssueNumber(verifiedAction, mutationOutcome);
  } catch (error) {
    process.stderr.write(`Fail-closed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  if (dryRun) {
    let commentBody;

    try {
      commentBody = buildSuccessComment({ verifiedAction, mutationOutcome });
    } catch (error) {
      process.stderr.write(`Fail-closed: ${error.message}\n`);
      return FAIL_CLOSED;
    }

    const envelope = {
      dryRun: true,
      issueNumber,
      repo: options.repo,
      commentBody,
      willClose: true,
    };

    process.stdout.write(JSON.stringify(envelope));

    return 0;
  }

  try {
    validateFinalizerInputs({ verifiedAction, mutationOutcome });
  } catch (error) {
    process.stderr.write(`Fail-closed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  let commentBody;

  try {
    commentBody = buildSuccessComment({ verifiedAction, mutationOutcome });
  } catch (error) {
    process.stderr.write(`Fail-closed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  const tempDir = await mkdtemp(join(tmpdir(), "finalize-issue-codex-"));
  const bodyFilePath = join(tempDir, "comment-body.md");

  try {
    await writeFile(bodyFilePath, commentBody, "utf8");

    const commentResult = await runGh([
      "issue",
      "comment",
      String(issueNumber),
      "--repo",
      options.repo,
      "--body-file",
      bodyFilePath,
    ]);

    if (commentResult.status !== 0) {
      const detail =
        commentResult.stderr.trim() !== ""
          ? `: ${commentResult.stderr.trim()}`
          : "";

      process.stderr.write(
        `Fail-closed: gh issue comment failed with exit ${String(commentResult.status)}${detail}\n`,
      );
      return FAIL_CLOSED;
    }

    const closeResult = await runGh([
      "issue",
      "close",
      String(issueNumber),
      "--repo",
      options.repo,
    ]);

    if (closeResult.status !== 0) {
      const detail =
        closeResult.stderr.trim() !== ""
          ? `: ${closeResult.stderr.trim()}`
          : "";

      process.stderr.write(
        `Fail-closed: gh issue close failed with exit ${String(closeResult.status)}${detail} — comment was already posted; not retrying.\n`,
      );
      return FAIL_CLOSED;
    }

    return 0;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);

      process.stderr.write(`Fail-closed: ${message}\n`);
      process.exitCode = FAIL_CLOSED;
    });
}
