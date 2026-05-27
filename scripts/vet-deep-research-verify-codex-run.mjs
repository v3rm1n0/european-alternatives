#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildScoringVerificationPrompt,
  getVerifierCommand,
  parseScoringVerificationResponse,
} from "./lib/vet-deep-research-verify-codex.mjs";

const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/vet-deep-research-verify-codex-run.mjs --extraction-file <path> --entry-file <path> [options]
  node scripts/vet-deep-research-verify-codex-run.mjs --extraction-json <json> --entry-json <json> [options]

Stage-3 codex-only independent source verifier for the European Alternatives
catalog deep-research scoring pipeline. Reads the stage-2 extraction and the
matched catalog entry, invokes codex exec with a verification prompt that
requires the verifier to fetch every cited source URL itself, and emits a
validated verified_scoring_action handoff on stdout. No DB writes, no GitHub
mutations, no truth decisions outside the verifier's own web research.

Options:
  --extraction-file <path>         Stage-2 extraction JSON.
  --extraction-json <json>         Inline stage-2 extraction JSON.
  --entry-file <path>              Matched catalog entry JSON.
  --entry-json <json>              Inline catalog entry JSON.
  --document-file <path>           Optional deep-research Markdown document for prompt context.
  --mock-response-file <path>      Read verifier output from a file instead of invoking codex (test seam).
  --accessed-date <YYYY-MM-DD>     Accessed date for the verification run.
  --output-file <path>             Write the verified scoring action JSON to disk in addition to stdout.
  --dry-run                        Tag the emitted handoff as dry-run.
  --help                           Show this help.
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
    verifier: "codex",
    extractionFile: null,
    extractionJson: null,
    entryFile: null,
    entryJson: null,
    documentFile: null,
    mockResponseFile: null,
    accessedDate: null,
    outputFile: null,
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
      { flag: "--extraction-file", key: "extractionFile" },
      { flag: "--extraction-json", key: "extractionJson" },
      { flag: "--entry-file", key: "entryFile" },
      { flag: "--entry-json", key: "entryJson" },
      { flag: "--document-file", key: "documentFile" },
      { flag: "--mock-response-file", key: "mockResponseFile" },
      { flag: "--accessed-date", key: "accessedDate" },
      { flag: "--output-file", key: "outputFile" },
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

async function loadExtraction(options) {
  const sources = [
    options.extractionFile !== null,
    options.extractionJson !== null,
  ].filter(Boolean);

  if (sources.length === 0) {
    throw new Error(
      "Provide exactly one extraction source: --extraction-file or --extraction-json",
    );
  }

  if (sources.length > 1) {
    throw new Error(
      "Provide exactly one extraction source: --extraction-file or --extraction-json",
    );
  }

  if (options.extractionFile !== null) {
    let text;

    try {
      text = await readFile(options.extractionFile, "utf8");
    } catch (error) {
      throw new Error(`--extraction-file: ${error.message}`);
    }

    return parseJson(text, "--extraction-file");
  }

  return parseJson(options.extractionJson, "--extraction-json");
}

async function loadEntry(options) {
  const sources = [
    options.entryFile !== null,
    options.entryJson !== null,
  ].filter(Boolean);

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
    let text;

    try {
      text = await readFile(options.entryFile, "utf8");
    } catch (error) {
      throw new Error(`--entry-file: ${error.message}`);
    }

    return parseJson(text, "--entry-file");
  }

  return parseJson(options.entryJson, "--entry-json");
}

function runVerifier(commandConfig, prompt) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(commandConfig.command, commandConfig.args, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
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

    child.on("close", (code, signal) => {
      const output = Buffer.concat(stdoutChunks).toString("utf8");
      const errorOutput = Buffer.concat(stderrChunks).toString("utf8").trim();

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

  let extraction;

  try {
    extraction = await loadExtraction(options);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  let entry;

  try {
    entry = await loadEntry(options);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  let documentContent;

  if (options.documentFile !== null) {
    try {
      documentContent = await readFile(options.documentFile, "utf8");
    } catch (error) {
      process.stderr.write(`Invalid usage: --document-file: ${error.message}\n`);
      return INVALID_USAGE;
    }
  }

  let rawResponse;

  try {
    if (options.mockResponseFile !== null) {
      rawResponse = await readFile(options.mockResponseFile, "utf8");
    } else {
      const prompt = buildScoringVerificationPrompt({
        extraction,
        entry,
        documentPath: options.documentFile ?? undefined,
        documentContent,
        accessedDate: options.accessedDate ?? undefined,
      });

      const commandConfig = getVerifierCommand(options.verifier);

      rawResponse = await runVerifier(commandConfig, prompt);
    }
  } catch (error) {
    process.stderr.write(`Verifier error: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  let parsed;

  try {
    parsed = parseScoringVerificationResponse(rawResponse, extraction, {
      accessedDate: options.accessedDate ?? undefined,
    });
  } catch (error) {
    process.stderr.write(`Parse error: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  if (options.dryRun) {
    parsed.dryRun = true;
  }

  const json = JSON.stringify(parsed, null, 2);

  if (options.outputFile !== null) {
    try {
      await writeFile(options.outputFile, `${json}\n`, "utf8");
    } catch (error) {
      process.stderr.write(`Output error: ${error.message}\n`);
      return FAIL_CLOSED;
    }
  }

  process.stdout.write(`${json}\n`);

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
