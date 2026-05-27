#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Orchestrator wrapper for `scripts/apply-deep-research-scoring.php`.
 *
 * Runs the stage-5 transactional DB writer and, on a successful real-mode
 * write, fetches `api/catalog/entry.php?slug=<entrySlug>` to assert that the
 * dynamic scoring path now reports `trustScoreStatus === "ready"` with a
 * non-null `trustScoreBreakdown`. This is the post-write API assertion from
 * the issue acceptance criteria; the PHP writer itself does not hit HTTP.
 *
 * Usage:
 *   node scripts/apply-deep-research-scoring-run.mjs \
 *     (--verified-action-json <json> | --verified-action-file <path>) \
 *     --worksheet-path <relative-path> \
 *     --api-base-url <url> \
 *     [--replace-existing] [--dry-run] [--php <bin>] [--help]
 *
 * Exit codes:
 *   0   applied (or dry-run plan emitted) and post-check passed (if applicable)
 *   64  invalid CLI usage (wrapper-level)
 *   65  PHP fail-closed pass-through (schema / threshold / banned-key)
 *   2   PHP refusal pass-through (pre-existing scored entry without
 *       --replace-existing)
 *   1   PHP database / runtime failure pass-through (after rollback)
 *   3   post-check failed (API not reporting ready trust-score state)
 */

export const WRAPPER_INVALID_USAGE = 64;
export const WRAPPER_POST_CHECK_FAILED = 3;

const VALUE_OPTIONS = [
  { flag: "--verified-action-json", key: "verifiedActionJson" },
  { flag: "--verified-action-file", key: "verifiedActionFile" },
  { flag: "--worksheet-path", key: "worksheetPath" },
  { flag: "--api-base-url", key: "apiBaseUrl" },
  { flag: "--php", key: "phpBinary" },
];

const BOOL_OPTIONS = [
  { flag: "--replace-existing", key: "replaceExisting" },
  { flag: "--dry-run", key: "dryRun" },
];

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/apply-deep-research-scoring-run.mjs \\
    (--verified-action-json <json> | --verified-action-file <path>) \\
    --worksheet-path <relative-path> \\
    --api-base-url <url> \\
    [--replace-existing] [--dry-run] [--php <bin>] [--help]

Runs the stage-5 PHP DB writer for deep-research trust scoring, then (on a
successful real-mode write) GETs <api-base-url>/api/catalog/entry.php?slug=...
and asserts trustScoreStatus="ready" with a non-null trustScoreBreakdown.

Exit codes:
  0   applied (or dry-run plan emitted) and post-check passed (if applicable)
  64  invalid CLI usage (wrapper-level)
  65  PHP fail-closed pass-through
  2   PHP refusal pass-through (already-scored without --replace-existing)
  1   PHP database / runtime failure pass-through
  3   post-check failed (API not reporting ready trust-score state)
`);
}

function parseArguments(argv) {
  const options = {
    verifiedActionJson: null,
    verifiedActionFile: null,
    worksheetPath: null,
    apiBaseUrl: null,
    phpBinary: "php",
    replaceExisting: false,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    let matched = false;

    for (const { flag, key } of BOOL_OPTIONS) {
      if (argument === flag) {
        options[key] = true;
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    for (const { flag, key } of VALUE_OPTIONS) {
      if (argument === flag) {
        const value = argv[index + 1];
        if (value === undefined) {
          throw new Error(`${flag} requires a value`);
        }
        options[key] = value;
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

    throw new Error(`unknown option ${argument}`);
  }

  const sources = [
    options.verifiedActionJson !== null,
    options.verifiedActionFile !== null,
  ].filter(Boolean);

  if (sources.length !== 1) {
    throw new Error(
      "Provide exactly one of --verified-action-json or --verified-action-file",
    );
  }

  if (options.worksheetPath === null || options.worksheetPath === "") {
    throw new Error("--worksheet-path is required");
  }

  if (!options.dryRun && (options.apiBaseUrl === null || options.apiBaseUrl === "")) {
    throw new Error("--api-base-url is required for non-dry-run invocations");
  }

  return options;
}

function buildPhpArgs(options) {
  const args = ["scripts/apply-deep-research-scoring.php"];

  if (options.verifiedActionJson !== null) {
    args.push("--verified-action-json", options.verifiedActionJson);
  } else {
    args.push("--verified-action-file", options.verifiedActionFile);
  }

  args.push("--worksheet-path", options.worksheetPath);

  if (options.replaceExisting) {
    args.push("--replace-existing");
  }
  if (options.dryRun) {
    args.push("--dry-run");
  }

  return args;
}

function defaultPhpRunner({ phpBinary, args }) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(phpBinary, args, {
      cwd: process.cwd(),
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

    child.on("close", (code, signal) => {
      resolvePromise({
        exitCode: code ?? (signal !== null ? 128 : 1),
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });
}

function parsePhpOutcome(stdout) {
  const trimmed = stdout.trim();
  if (trimmed === "") {
    return null;
  }
  const lastNewline = trimmed.lastIndexOf("\n");
  const candidate = lastNewline === -1 ? trimmed : trimmed.slice(lastNewline + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function emitOutcome(outcome) {
  process.stdout.write(`${JSON.stringify(outcome)}\n`);
}

function buildEntryUrl(apiBaseUrl, slug) {
  const trimmedBase = apiBaseUrl.replace(/\/+$/, "");
  return `${trimmedBase}/api/catalog/entry.php?slug=${encodeURIComponent(slug)}`;
}

async function performPostCheck({ apiBaseUrl, entrySlug, fetchImpl }) {
  const url = buildEntryUrl(apiBaseUrl, entrySlug);

  let response;
  try {
    response = await fetchImpl(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      postCheckFailed: true,
      reason: `network error fetching ${url}: ${message}`,
      entrySlug,
      httpStatus: null,
      observedStatus: null,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      postCheckFailed: true,
      reason: `non-200 response from ${url}: HTTP ${String(response.status)}`,
      entrySlug,
      httpStatus: response.status,
      observedStatus: null,
    };
  }

  let body;
  try {
    body = await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      postCheckFailed: true,
      reason: `response body from ${url} is not valid JSON: ${message}`,
      entrySlug,
      httpStatus: response.status,
      observedStatus: null,
    };
  }

  const observedStatus = body && typeof body === "object"
    ? body.trustScoreStatus ?? null
    : null;
  const breakdown = body && typeof body === "object"
    ? body.trustScoreBreakdown ?? null
    : null;

  if (observedStatus !== "ready") {
    return {
      ok: false,
      postCheckFailed: true,
      reason: `trustScoreStatus is "${String(observedStatus)}", expected "ready"`,
      entrySlug,
      httpStatus: response.status,
      observedStatus,
    };
  }

  if (breakdown === null || typeof breakdown !== "object") {
    return {
      ok: false,
      postCheckFailed: true,
      reason: "trustScoreBreakdown is missing or not an object",
      entrySlug,
      httpStatus: response.status,
      observedStatus,
    };
  }

  return {
    ok: true,
    postCheckPassed: true,
    entrySlug,
    trustScoreStatus: "ready",
  };
}

export async function main(argv, deps = {}) {
  const phpRunner = deps.phpRunner ?? defaultPhpRunner;
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;

  let options;
  try {
    options = parseArguments(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Invalid usage: ${message}\n`);
    return WRAPPER_INVALID_USAGE;
  }

  if (options.help) {
    printUsage(process.stdout);
    return 0;
  }

  const phpArgs = buildPhpArgs(options);

  let phpResult;
  try {
    phpResult = await phpRunner({
      phpBinary: options.phpBinary,
      args: phpArgs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Failed to invoke PHP: ${message}\n`);
    return 1;
  }

  if (phpResult.stderr !== "") {
    process.stderr.write(phpResult.stderr);
  }
  if (phpResult.stdout !== "") {
    process.stdout.write(phpResult.stdout.endsWith("\n") ? phpResult.stdout : `${phpResult.stdout}\n`);
  }

  if (phpResult.exitCode !== 0) {
    return phpResult.exitCode;
  }

  if (options.dryRun) {
    return 0;
  }

  const phpOutcome = parsePhpOutcome(phpResult.stdout);

  if (phpOutcome === null || typeof phpOutcome.entrySlug !== "string" || phpOutcome.entrySlug === "") {
    const failure = {
      ok: false,
      postCheckFailed: true,
      reason: "PHP outcome did not include a usable entrySlug for the post-check",
      entrySlug: null,
      httpStatus: null,
      observedStatus: null,
    };
    emitOutcome(failure);
    return WRAPPER_POST_CHECK_FAILED;
  }

  if (phpOutcome.dryRun === true) {
    return 0;
  }

  if (typeof fetchImpl !== "function") {
    const failure = {
      ok: false,
      postCheckFailed: true,
      reason: "no fetch implementation available for post-check",
      entrySlug: phpOutcome.entrySlug,
      httpStatus: null,
      observedStatus: null,
    };
    emitOutcome(failure);
    return WRAPPER_POST_CHECK_FAILED;
  }

  const postCheck = await performPostCheck({
    apiBaseUrl: options.apiBaseUrl,
    entrySlug: phpOutcome.entrySlug,
    fetchImpl,
  });

  emitOutcome(postCheck);

  return postCheck.ok ? 0 : WRAPPER_POST_CHECK_FAILED;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${message}\n`);
      process.exitCode = 1;
    });
}
