#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { matchDocument } from "./lib/vet-deep-research-codex.mjs";

const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/vet-deep-research-codex-run.mjs --input-dir <path> [options]

Options:
  --input-dir <path>              Directory containing deep-research Markdown
                                  documents to discover (required).
  --catalog-snapshot-file <path>  Pre-fetched catalog snapshot file
                                  ({ entries: [{ slug, name, website }] }).
  --entry <slug>                  Force every discovered document to the
                                  given catalog entry slug; fails closed if
                                  the slug is not in the active snapshot.
  --dry-run                       Tag the emitted output as dry-run. This
                                  stage performs no DB write and no Codex
                                  call in any mode, so --dry-run is a label
                                  on the JSON output rather than a kill
                                  switch.
  --help                          Show this help.

Exit codes:
  0   success / dry-run completed
  64  invalid CLI usage
  65  fail-closed (snapshot parse error, unreadable input directory)
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
    inputDir: null,
    catalogSnapshotFile: null,
    forcedEntrySlug: null,
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
      { flag: "--input-dir", key: "inputDir" },
      { flag: "--catalog-snapshot-file", key: "catalogSnapshotFile" },
      { flag: "--entry", key: "forcedEntrySlug" },
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

async function loadSnapshot(snapshotPath) {
  if (snapshotPath === null) {
    return { entries: [] };
  }

  const raw = await readFile(snapshotPath, "utf8");
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`--catalog-snapshot-file is not valid JSON: ${message}`);
  }

  if (parsed === null || typeof parsed !== "object") {
    throw new Error("--catalog-snapshot-file must be a JSON object");
  }

  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];

  return { entries };
}

async function discoverMarkdownFiles(inputDir) {
  let dirEntries;

  try {
    dirEntries = await readdir(inputDir, { withFileTypes: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read --input-dir ${inputDir}: ${message}`);
  }

  const paths = [];

  for (const entry of dirEntries) {
    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.toLowerCase().endsWith(".md")) {
      continue;
    }

    paths.push(join(inputDir, entry.name));
  }

  paths.sort();
  return paths;
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

  if (options.inputDir === null) {
    process.stderr.write("Invalid usage: --input-dir is required\n");
    return INVALID_USAGE;
  }

  const inputDir = resolve(options.inputDir);

  let snapshot;

  try {
    snapshot = await loadSnapshot(options.catalogSnapshotFile);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return FAIL_CLOSED;
  }

  let documentPaths;

  try {
    documentPaths = await discoverMarkdownFiles(inputDir);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return FAIL_CLOSED;
  }

  const matches = [];
  const skipped = [];

  for (const documentPath of documentPaths) {
    let content = "";

    try {
      content = await readFile(documentPath, "utf8");
    } catch {
      content = "";
    }

    const result = matchDocument({
      documentPath,
      content,
      forcedEntrySlug: options.forcedEntrySlug,
      snapshotEntries: snapshot.entries,
    });

    if (result.entrySlug !== undefined) {
      matches.push(result);
    } else {
      skipped.push(result);
    }
  }

  const summary = {
    discovered: documentPaths.length,
    matched: matches.length,
    skipped: skipped.length,
  };

  const output = {
    inputDir,
    dryRun: options.dryRun,
    matches,
    skipped,
    summary,
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
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
