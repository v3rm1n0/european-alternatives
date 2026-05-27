#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyApplyExit,
  filterMatches,
  summarizeDocuments,
} from "./lib/score-deep-research-folder.mjs";

const INVALID_USAGE = 64;
const PREFLIGHT_FAILED = 65;

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const STAGE_ENV_VAR = {
  match: "EUROALT_VET_DEEP_RESEARCH_CMD",
  extract: "EUROALT_VET_DEEP_RESEARCH_EXTRACT_CMD",
  verify: "EUROALT_VET_DEEP_RESEARCH_VERIFY_CMD",
  worksheet: "EUROALT_VET_DEEP_RESEARCH_WORKSHEET_CMD",
  apply: "EUROALT_APPLY_DEEP_RESEARCH_SCORING_CMD",
};

const STAGE_DEFAULT_CMD = {
  match: `bash ${join(SCRIPT_DIR, "vet-deep-research-codex.sh")}`,
  extract: `bash ${join(SCRIPT_DIR, "vet-deep-research-extract-codex.sh")}`,
  verify: `bash ${join(SCRIPT_DIR, "vet-deep-research-verify-codex.sh")}`,
  worksheet: `bash ${join(SCRIPT_DIR, "vet-deep-research-worksheet.sh")}`,
  apply: `node ${join(SCRIPT_DIR, "apply-deep-research-scoring-run.mjs")}`,
};

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/score-deep-research-folder-run.mjs \\
    --input-dir <path> \\
    --catalog-snapshot-file <path> \\
    --api-base-url <url> \\
    --output-dir <path> \\
    [--entry <slug>] [--limit <n>] \\
    [--dry-run] [--continue-on-error] [--replace-existing] \\
    [--accessed-date YYYY-MM-DD] [--php <bin>] [--help]

Top-level batch orchestrator for the deep-research trust-scoring pipeline.
Walks the folder of deep-research Markdown documents, matches each to a
catalog entry, and runs the full per-document pipeline (extract → verify →
worksheet → DB write + API post-check) sequentially.

Exit codes:
  0   all matched docs reached ready / skipped (skipped includes already-scored)
  1   one or more docs failed (only reachable with --continue-on-error)
  64  invalid CLI usage
  65  pre-flight failed (input dir unreadable, snapshot unreadable)
  <n> with --continue-on-error off, the first failing doc's exit code is
      propagated verbatim.
`);
}

function parseArguments(argv) {
  const options = {
    inputDir: null,
    catalogSnapshotFile: null,
    apiBaseUrl: null,
    outputDir: null,
    entrySlug: null,
    limit: null,
    accessedDate: null,
    phpBinary: null,
    dryRun: false,
    continueOnError: false,
    replaceExisting: false,
    help: false,
  };

  const valueFlags = [
    { flag: "--input-dir", key: "inputDir" },
    { flag: "--catalog-snapshot-file", key: "catalogSnapshotFile" },
    { flag: "--api-base-url", key: "apiBaseUrl" },
    { flag: "--output-dir", key: "outputDir" },
    { flag: "--entry", key: "entrySlug" },
    { flag: "--limit", key: "limit" },
    { flag: "--accessed-date", key: "accessedDate" },
    { flag: "--php", key: "phpBinary" },
  ];

  const boolFlags = [
    { flag: "--dry-run", key: "dryRun" },
    { flag: "--continue-on-error", key: "continueOnError" },
    { flag: "--replace-existing", key: "replaceExisting" },
  ];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    let matched = false;

    for (const { flag, key } of boolFlags) {
      if (arg === flag) {
        options[key] = true;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    for (const { flag, key } of valueFlags) {
      if (arg === flag) {
        const value = argv[i + 1];
        if (value === undefined) {
          throw new Error(`${flag} requires a value`);
        }
        options[key] = value;
        i++;
        matched = true;
        break;
      }
      if (arg.startsWith(`${flag}=`)) {
        options[key] = arg.slice(flag.length + 1);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    throw new Error(`unknown option ${arg}`);
  }

  if (options.limit !== null) {
    const n = Number.parseInt(options.limit, 10);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`--limit must be a non-negative integer (got ${options.limit})`);
    }
    options.limit = n;
  }

  return options;
}

function resolveStageCommand(stage) {
  const fromEnv = process.env[STAGE_ENV_VAR[stage]];
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv;
  }
  return STAGE_DEFAULT_CMD[stage];
}

function spawnStage(stage, args) {
  const cmd = resolveStageCommand(stage);
  return new Promise((resolvePromise) => {
    const child = spawn("bash", ["-c", `${cmd} "$@"`, "bash", ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    const stdoutChunks = [];
    const stderrChunks = [];

    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    child.on("error", (error) => {
      resolvePromise({
        exitCode: 1,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
      });
    });

    child.on("close", (code, signal) => {
      const exitCode = code ?? (signal !== null ? 128 : 1);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      resolvePromise({ exitCode, stdout, stderr });
    });
  });
}

function parseJsonLoose(text) {
  // The wrapper scripts often emit JSON followed by a trailing newline /
  // log lines. Try parsing as-is first; if that fails, search for the
  // first balanced JSON object/array.
  if (text === undefined || text === null) {
    return null;
  }
  const trimmed = text.trim();
  if (trimmed === "") {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    // try to extract first JSON object/array
    const firstBrace = trimmed.search(/[\[{]/);
    if (firstBrace < 0) {
      return null;
    }
    const candidate = trimmed.slice(firstBrace);
    // Try greedy parse by walking back from the end until JSON parses.
    for (let end = candidate.length; end > 0; end--) {
      try {
        return JSON.parse(candidate.slice(0, end));
      } catch {
        // continue
      }
    }
    return null;
  }
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function writeJson(path, payload) {
  await ensureDir(dirname(path));
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function preflight(options) {
  if (options.inputDir === null) {
    return { ok: false, code: INVALID_USAGE, message: "--input-dir is required" };
  }
  if (options.outputDir === null) {
    return { ok: false, code: INVALID_USAGE, message: "--output-dir is required" };
  }
  if (!options.dryRun && (options.apiBaseUrl === null || options.apiBaseUrl === "")) {
    return {
      ok: false,
      code: INVALID_USAGE,
      message: "--api-base-url is required for non-dry-run invocations",
    };
  }

  const inputDir = resolve(options.inputDir);
  try {
    const st = await stat(inputDir);
    if (!st.isDirectory()) {
      return {
        ok: false,
        code: PREFLIGHT_FAILED,
        message: `--input-dir is not a directory: ${inputDir}`,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      code: PREFLIGHT_FAILED,
      message: `--input-dir is unreadable: ${message}`,
    };
  }

  if (options.catalogSnapshotFile !== null) {
    const snapPath = resolve(options.catalogSnapshotFile);
    if (!(await pathExists(snapPath))) {
      return {
        ok: false,
        code: PREFLIGHT_FAILED,
        message: `--catalog-snapshot-file does not exist: ${snapPath}`,
      };
    }
  }

  return { ok: true };
}

async function runMatchStage(options) {
  const args = ["--input-dir", resolve(options.inputDir)];
  if (options.catalogSnapshotFile !== null) {
    args.push("--catalog-snapshot-file", resolve(options.catalogSnapshotFile));
  }
  if (options.dryRun) {
    args.push("--dry-run");
  }

  const result = await spawnStage("match", args);
  if (result.exitCode !== 0) {
    return { ok: false, exitCode: result.exitCode, stderr: result.stderr };
  }
  const payload = parseJsonLoose(result.stdout);
  if (payload === null || typeof payload !== "object") {
    return {
      ok: false,
      exitCode: 1,
      stderr: `stage 1 emitted invalid JSON: ${result.stdout.slice(0, 200)}`,
    };
  }
  return { ok: true, payload };
}

async function runExtractStage({
  documentPath,
  entryFile,
  workDir,
  options,
}) {
  const args = [
    "--document-file",
    documentPath,
    "--entry-file",
    entryFile,
  ];
  if (options.accessedDate !== null) {
    args.push("--accessed-date", options.accessedDate);
  }
  if (options.dryRun) {
    args.push("--dry-run");
  }

  const result = await spawnStage("extract", args);
  const stderrPath = join(workDir, "stage-extract.stderr.log");
  if (result.stderr !== "") {
    await writeFile(stderrPath, result.stderr, "utf8");
  }
  return result;
}

async function runVerifyStage({
  extractionFile,
  entryFile,
  documentPath,
  outputFile,
  workDir,
  options,
}) {
  const args = [
    "--extraction-file",
    extractionFile,
    "--entry-file",
    entryFile,
    "--document-file",
    documentPath,
    "--output-file",
    outputFile,
  ];
  if (options.accessedDate !== null) {
    args.push("--accessed-date", options.accessedDate);
  }
  if (options.dryRun) {
    args.push("--dry-run");
  }

  const result = await spawnStage("verify", args);
  if (result.stderr !== "") {
    await writeFile(join(workDir, "stage-verify.stderr.log"), result.stderr, "utf8");
  }
  return result;
}

async function runWorksheetStage({
  verifiedActionFile,
  workDir,
  options,
}) {
  const args = ["--verified-action-file", verifiedActionFile];
  if (options.dryRun) {
    args.push("--dry-run");
  }

  const result = await spawnStage("worksheet", args);
  if (result.stderr !== "") {
    await writeFile(join(workDir, "stage-worksheet.stderr.log"), result.stderr, "utf8");
  }
  return result;
}

async function runApplyStage({
  verifiedActionFile,
  worksheetPath,
  workDir,
  options,
}) {
  const args = [
    "--verified-action-file",
    verifiedActionFile,
    "--worksheet-path",
    worksheetPath,
    "--api-base-url",
    options.apiBaseUrl ?? "",
  ];
  if (options.replaceExisting) {
    args.push("--replace-existing");
  }
  if (options.dryRun) {
    args.push("--dry-run");
  }
  if (options.phpBinary !== null) {
    args.push("--php", options.phpBinary);
  }

  const result = await spawnStage("apply", args);
  if (result.stderr !== "") {
    await writeFile(join(workDir, "stage-apply.stderr.log"), result.stderr, "utf8");
  }
  return result;
}

function buildEntryRecord(match) {
  // Stage 2/3 expect an entry-file describing the matched catalog entry.
  // The stage-1 match record carries the fields they need; pass them
  // through.
  const entry = {
    id: typeof match.entryId === "number" ? match.entryId : null,
    slug: match.entrySlug,
    name: typeof match.entryName === "string" ? match.entryName : match.entrySlug,
  };
  return entry;
}

async function writeSummary(summaryPath, summary) {
  await writeJson(summaryPath, summary);
}

async function processDocument({
  match,
  options,
  outputRoot,
}) {
  const slug = match.entrySlug;
  const workDir = join(outputRoot, slug);
  await ensureDir(workDir);

  const documentPath = match.documentPath;
  const matchFile = join(workDir, "match.json");
  const entryFile = join(workDir, "entry.json");
  const extractionFile = join(workDir, "extraction.json");
  const verifiedActionFile = join(workDir, "verified-action.json");
  const worksheetMetaFile = join(workDir, "worksheet-meta.json");
  const applyOutcomeFile = join(workDir, "apply-outcome.json");
  const statusFile = join(workDir, "status.json");

  const docResult = {
    documentPath,
    entrySlug: slug,
    status: "failed",
    failedStage: null,
    exitCode: null,
    reason: null,
    worksheetPath: null,
  };

  const finalize = async () => {
    const statusPayload = {
      entrySlug: slug,
      documentPath,
      status: docResult.status,
    };
    if (docResult.failedStage !== null) {
      statusPayload.failedStage = docResult.failedStage;
    }
    if (docResult.exitCode !== null) {
      statusPayload.exitCode = docResult.exitCode;
    }
    if (docResult.reason !== null) {
      statusPayload.reason = docResult.reason;
    }
    if (docResult.worksheetPath !== null) {
      statusPayload.worksheetPath = docResult.worksheetPath;
    }
    await writeJson(statusFile, statusPayload);
  };

  try {
    await writeJson(matchFile, match);
    await writeJson(entryFile, buildEntryRecord(match));

    // Stage 2 — extract
    const extractResult = await runExtractStage({
      documentPath,
      entryFile,
      workDir,
      options,
    });
    if (extractResult.exitCode !== 0) {
      docResult.status = "failed";
      docResult.failedStage = "extract";
      docResult.exitCode = extractResult.exitCode;
      docResult.reason = extractResult.stderr.slice(0, 500) || null;
      await finalize();
      return docResult;
    }
    const extractPayload = parseJsonLoose(extractResult.stdout);
    if (extractPayload !== null) {
      await writeJson(extractionFile, extractPayload);
    } else {
      await writeFile(extractionFile, extractResult.stdout, "utf8");
    }

    // Stage 3 — verify
    const verifyResult = await runVerifyStage({
      extractionFile,
      entryFile,
      documentPath,
      outputFile: verifiedActionFile,
      workDir,
      options,
    });
    if (verifyResult.exitCode !== 0) {
      docResult.status = "failed";
      docResult.failedStage = "verify";
      docResult.exitCode = verifyResult.exitCode;
      docResult.reason = verifyResult.stderr.slice(0, 500) || null;
      await finalize();
      return docResult;
    }
    // If the verify wrapper did not write the --output-file (e.g. test shim
    // without writeToOutputFile), fall back to its stdout.
    if (!(await pathExists(verifiedActionFile))) {
      const verifiedPayload = parseJsonLoose(verifyResult.stdout);
      if (verifiedPayload !== null) {
        await writeJson(verifiedActionFile, verifiedPayload);
      } else {
        await writeFile(verifiedActionFile, verifyResult.stdout, "utf8");
      }
    }

    // Stage 4 — worksheet
    const worksheetResult = await runWorksheetStage({
      verifiedActionFile,
      workDir,
      options,
    });
    if (worksheetResult.exitCode !== 0) {
      docResult.status = "failed";
      docResult.failedStage = "worksheet";
      docResult.exitCode = worksheetResult.exitCode;
      docResult.reason = worksheetResult.stderr.slice(0, 500) || null;
      await finalize();
      return docResult;
    }
    const worksheetPayload = parseJsonLoose(worksheetResult.stdout);
    if (worksheetPayload !== null) {
      await writeJson(worksheetMetaFile, worksheetPayload);
    } else {
      await writeFile(worksheetMetaFile, worksheetResult.stdout, "utf8");
    }
    const worksheetPath =
      worksheetPayload !== null &&
      typeof worksheetPayload.worksheetPath === "string"
        ? worksheetPayload.worksheetPath
        : `tmp/scoring-worksheets/${slug}.md`;
    docResult.worksheetPath = worksheetPath;

    // Stage 5 — apply
    const applyResult = await runApplyStage({
      verifiedActionFile,
      worksheetPath,
      workDir,
      options,
    });
    const applyPayload = parseJsonLoose(applyResult.stdout);
    if (applyPayload !== null) {
      await writeJson(applyOutcomeFile, applyPayload);
    } else if (applyResult.stdout !== "") {
      await writeFile(applyOutcomeFile, applyResult.stdout, "utf8");
    }

    const klass = classifyApplyExit(applyResult.exitCode);
    if (klass === "ready") {
      docResult.status = "ready";
    } else if (klass === "skipped") {
      docResult.status = "skipped";
      docResult.reason = "already_scored_no_replace_flag";
    } else {
      docResult.status = "failed";
      docResult.failedStage = "apply";
      docResult.exitCode = applyResult.exitCode;
      docResult.reason = applyResult.stderr.slice(0, 500) || null;
    }
  } finally {
    await finalize();
  }

  return docResult;
}

export async function main(argv) {
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
  if (options.outputDir === null) {
    process.stderr.write("Invalid usage: --output-dir is required\n");
    return INVALID_USAGE;
  }

  const preflightResult = await preflight(options);
  if (!preflightResult.ok) {
    process.stderr.write(`${preflightResult.message}\n`);
    return preflightResult.code;
  }

  const outputRoot = resolve(options.outputDir);
  await ensureDir(outputRoot);
  const summaryPath = join(outputRoot, "summary.json");

  // Stage 1 — match
  const matchOutcome = await runMatchStage(options);
  if (!matchOutcome.ok) {
    process.stderr.write(
      `stage 1 (match) failed (rc=${matchOutcome.exitCode}): ${matchOutcome.stderr}\n`,
    );
    const summary = {
      inputDir: resolve(options.inputDir),
      outputDir: outputRoot,
      dryRun: options.dryRun,
      counts: { processed: 0, ready: 0, skipped: 0, failed: 0 },
      documents: [],
      preflightError: matchOutcome.stderr.slice(0, 500),
    };
    await writeSummary(summaryPath, summary);
    return matchOutcome.exitCode === 0 ? 1 : matchOutcome.exitCode;
  }

  const matchPayload = matchOutcome.payload;
  const rawMatches = Array.isArray(matchPayload.matches) ? matchPayload.matches : [];
  const stageOneSkipped = Array.isArray(matchPayload.skipped) ? matchPayload.skipped : [];

  await writeJson(join(outputRoot, "match.json"), matchPayload);

  const filteredMatches = filterMatches(rawMatches, {
    entrySlug: options.entrySlug,
    limit: options.limit,
  });

  const stageOneSkippedDocs = stageOneSkipped.map((skip) => ({
    documentPath: typeof skip.documentPath === "string" ? skip.documentPath : null,
    entrySlug: typeof skip.entrySlug === "string" ? skip.entrySlug : null,
    status: "skipped",
    reason: typeof skip.reason === "string" ? skip.reason : "unmatched",
  }));

  const processedDocs = [];

  let aborted = false;
  let abortExitCode = 0;

  for (const match of filteredMatches) {
    const docResult = await processDocument({
      match,
      options,
      outputRoot,
    });
    processedDocs.push(docResult);

    if (
      docResult.status === "failed" &&
      !options.continueOnError
    ) {
      aborted = true;
      abortExitCode =
        typeof docResult.exitCode === "number" && docResult.exitCode !== 0
          ? docResult.exitCode
          : 1;
      break;
    }
  }

  // `processed` counts docs the runner actually attempted post-match;
  // stage-1 skips (no_match / ambiguous) count toward `skipped` only.
  const counts = summarizeDocuments(processedDocs);
  counts.skipped += stageOneSkippedDocs.length;
  const documents = [...stageOneSkippedDocs, ...processedDocs];
  const summary = {
    inputDir: resolve(options.inputDir),
    outputDir: outputRoot,
    dryRun: options.dryRun,
    counts,
    documents,
  };
  await writeSummary(summaryPath, summary);

  if (aborted) {
    return abortExitCode;
  }
  if (counts.failed > 0) {
    return 1;
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${message}\n`);
      process.exitCode = 1;
    });
}
