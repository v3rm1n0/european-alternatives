#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildExtractionPrompt,
  getExtractorCommand,
  parseExtractionResponse,
} from "./lib/vet-deep-research-extract-codex.mjs";

const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/vet-deep-research-extract-codex-run.mjs --document-file <path> --entry-file <path> [options]
  node scripts/vet-deep-research-extract-codex-run.mjs --document-file <path> --entry-json <json> [options]

Options:
  --document-file <path>          Path to a deep-research Markdown document.
  --entry-file <path>             Path to a JSON file describing the matched catalog entry.
  --entry-json <json>             Inline JSON for the matched catalog entry.
  --mock-response-file <path>     Read extractor output from a file instead of invoking codex (test seam).
  --accessed-date <YYYY-MM-DD>    Override the accessed date used in the prompt and the emitted payload.
  --dry-run                       Tag the emitted extraction payload as dry-run.
  --help                          Show this help.
`);
}

function readRequiredOptionValue(argv, index, optionName) {
  const nextIndex = index + 1;
  const value = argv[nextIndex];

  if (value === undefined) {
    throw new Error(`${optionName} requires a value`);
  }

  return value;
}

function parseArguments(argv) {
  const options = {
    extractor: "codex",
    documentFile: null,
    entryFile: null,
    entryJson: null,
    mockResponseFile: null,
    accessedDate: null,
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
      { flag: "--document-file", key: "documentFile" },
      { flag: "--entry-file", key: "entryFile" },
      { flag: "--entry-json", key: "entryJson" },
      { flag: "--mock-response-file", key: "mockResponseFile" },
      { flag: "--accessed-date", key: "accessedDate" },
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

async function loadEntry(options) {
  const sources = [options.entryFile !== null, options.entryJson !== null].filter(
    Boolean,
  );

  if (sources.length === 0) {
    throw new Error(
      "Provide exactly one entry source: --entry-file or --entry-json",
    );
  }

  if (sources.length > 1) {
    throw new Error(
      "Provide exactly one entry source: --entry-file or --entry-json",
    );
  }

  if (options.entryFile !== null) {
    return parseJson(await readFile(options.entryFile, "utf8"), "--entry-file");
  }

  return parseJson(options.entryJson, "--entry-json");
}

function normalizeEntry(rawEntry) {
  if (rawEntry === null || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
    throw new Error("Entry payload must be a JSON object");
  }

  if (typeof rawEntry.slug !== "string" || rawEntry.slug.trim() === "") {
    throw new Error("Entry payload must include a non-empty slug");
  }

  if (typeof rawEntry.name !== "string" || rawEntry.name.trim() === "") {
    throw new Error("Entry payload must include a non-empty name");
  }

  return rawEntry;
}

function runExtractor(commandConfig, prompt) {
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
            `Extractor exited with ${signal ?? `status ${String(code)}`}${
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

  if (options.documentFile === null) {
    process.stderr.write(
      "Invalid usage: --document-file is required\n",
    );
    return INVALID_USAGE;
  }

  let document;

  try {
    document = await readFile(options.documentFile, "utf8");
  } catch (error) {
    process.stderr.write(`Invalid usage: --document-file: ${error.message}\n`);
    return INVALID_USAGE;
  }

  let entry;

  try {
    const rawEntry = await loadEntry(options);
    entry = normalizeEntry(rawEntry);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  let rawResponse;

  try {
    if (options.mockResponseFile !== null) {
      rawResponse = await readFile(options.mockResponseFile, "utf8");
    } else {
      const prompt = buildExtractionPrompt({
        document,
        entry,
        documentPath: options.documentFile,
        accessedDate: options.accessedDate ?? undefined,
      });

      const commandConfig = getExtractorCommand(options.extractor);
      rawResponse = await runExtractor(commandConfig, prompt);
    }
  } catch (error) {
    process.stderr.write(`Extractor error: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  let parsed;

  try {
    parsed = parseExtractionResponse(rawResponse, document, entry, {
      accessedDate: options.accessedDate ?? undefined,
      documentPath: options.documentFile,
    });
  } catch (error) {
    process.stderr.write(`Parse error: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  const result = {
    entrySlug: entry.slug,
    documentPath: options.documentFile,
    dryRun: options.dryRun,
    proposed: {
      positive_signals: parsed.positive_signals,
      reservations: parsed.reservations,
      scoring_metadata: parsed.scoring_metadata,
    },
  };

  if (options.accessedDate !== null) {
    result.accessedDate = options.accessedDate;
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

      process.stderr.write(`Error: ${message}\n`);
      process.exitCode = FAIL_CLOSED;
    });
}
