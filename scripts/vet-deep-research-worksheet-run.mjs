#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_OUTPUT_DIR,
  buildEmittedMetadata,
  buildWorksheetMarkdown,
  resolveWorksheetPath,
  validateEntrySlug,
  validateHandoff,
} from "./lib/vet-deep-research-worksheet.mjs";

const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/vet-deep-research-worksheet-run.mjs --verified-action-file <path> [options]
  node scripts/vet-deep-research-worksheet-run.mjs --verified-action-json <json> [options]

Stage-4 worksheet generator for the European Alternatives catalog deep-research
scoring pipeline. Consumes the verified scoring action handoff from stage-3 and
writes one Markdown worksheet per catalog entry under tmp/scoring-worksheets/
(by default). Emits the worksheet path on stdout for stage-5 (DB write). No DB
writes, no codex calls, no network access, no stored trust-score values.

Options:
  --verified-action-file <path>   Stage-3 verified scoring action JSON.
  --verified-action-json <json>   Inline stage-3 verified scoring action JSON.
  --output-dir <path>             Worksheet output directory (default: ${DEFAULT_OUTPUT_DIR}).
  --dry-run                       Print the intended worksheet path and summary; write nothing.
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
    verifiedActionFile: null,
    verifiedActionJson: null,
    outputDir: DEFAULT_OUTPUT_DIR,
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
      { flag: "--verified-action-json", key: "verifiedActionJson" },
      { flag: "--output-dir", key: "outputDir" },
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

async function loadHandoff(options) {
  const sources = [
    options.verifiedActionFile !== null,
    options.verifiedActionJson !== null,
  ].filter(Boolean);

  if (sources.length === 0) {
    throw new Error(
      "Provide exactly one handoff source: --verified-action-file or --verified-action-json",
    );
  }

  if (sources.length > 1) {
    throw new Error(
      "Provide exactly one handoff source: --verified-action-file or --verified-action-json (not both)",
    );
  }

  if (options.verifiedActionFile !== null) {
    let text;

    try {
      text = await readFile(options.verifiedActionFile, "utf8");
    } catch (error) {
      throw new Error(`--verified-action-file: ${error.message}`);
    }

    return parseJson(text, "--verified-action-file");
  }

  return parseJson(options.verifiedActionJson, "--verified-action-json");
}

async function writeWorksheetAtomic(targetPath, contents) {
  await mkdir(dirname(targetPath), { recursive: true });

  const suffix = randomBytes(6).toString("hex");
  const tempPath = `${targetPath}.${process.pid}.${suffix}.tmp`;

  try {
    await writeFile(tempPath, contents, "utf8");
    await rename(tempPath, targetPath);
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
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

  let handoff;

  try {
    handoff = await loadHandoff(options);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  try {
    validateHandoff(handoff);
  } catch (error) {
    process.stderr.write(`Handoff validation failed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  try {
    validateEntrySlug(handoff.entrySlug);
  } catch (error) {
    process.stderr.write(`Handoff validation failed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  let resolved;

  try {
    resolved = resolveWorksheetPath(options.outputDir, handoff.entrySlug);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  let markdown;

  try {
    markdown = buildWorksheetMarkdown(handoff);
  } catch (error) {
    process.stderr.write(`Worksheet render failed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  let wrote = false;

  if (!options.dryRun) {
    try {
      await writeWorksheetAtomic(resolved.absoluteWorksheetPath, markdown);
      wrote = true;
    } catch (error) {
      process.stderr.write(`Worksheet write failed: ${error.message}\n`);
      return FAIL_CLOSED;
    }
  }

  const metadata = buildEmittedMetadata(handoff, resolved.worksheetPath, {
    dryRun: options.dryRun,
    wrote,
  });

  process.stdout.write(`${JSON.stringify(metadata, null, 2)}\n`);
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

export { main };
