#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  assertNoBannedKeys,
  buildAdminPayload,
  INSERT_ALLOWED_STATUSES,
} from "./lib/insert-verified-alternative.mjs";

const SUCCESS = 0;
const INVALID_USAGE = 64;
const FAIL_CLOSED = 65;

const ADMIN_ENDPOINT_PATH = "/api/admin/add-alternative.php";
const REQUEST_TIMEOUT_MS = 30_000;

function printUsage(stream) {
  stream.write(`Usage:
  node scripts/insert-verified-alternative-run.mjs --verified-action-file <path> [options]

Stage-4 of the catalog-suggestion pipeline. Inserts a verified
new_alternative through the admin API with status="alternative" by default and
trustScoreStatus=pending. Does not handle fact corrections (#477) and
does not comment/close (#478).

Options:
  --verified-action-file <path>   Read the stage-3 verified_action JSON.
  --verified-action-json <json>   Inline stage-3 verified_action JSON.
  --status <status>               Insert as one of: ${INSERT_ALLOWED_STATUSES.join(", ")}.
  --dry-run                       Print would-be payload without contacting the API.
  --repo <owner/name>             Source repo for downstream consumers (passthrough).
  --help, -h                      Show this help.

Environment:
  EUROALT_API_BASE                Base URL of the API host (required, no default).
  EUROALT_ADMIN_TOKEN             Admin bearer token (required for non-dry-run).

Exit codes:
  0   success
  64  invalid usage
  65  fail-closed (banned keys, wrong action, missing token, HTTP error, etc.)
`);
}

function readRequiredOptionValue(argv, index, optionName) {
  const nextIndex = index + 1;
  const value = argv[nextIndex];

  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${optionName} requires a value`);
  }

  return value;
}

function parseArguments(argv) {
  const options = {
    verifiedActionFile: null,
    verifiedActionJson: null,
    dryRun: false,
    repo: null,
    status: null,
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

    if (
      argument === "--token" ||
      argument.startsWith("--token=") ||
      argument === "--admin-token" ||
      argument.startsWith("--admin-token=")
    ) {
      throw new Error(
        "--token must not be supplied on the CLI; set EUROALT_ADMIN_TOKEN in the environment instead",
      );
    }

    const valueOptions = [
      { flag: "--verified-action-file", key: "verifiedActionFile" },
      { flag: "--verified-action-json", key: "verifiedActionJson" },
      { flag: "--repo", key: "repo" },
      { flag: "--status", key: "status" },
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

async function loadVerifiedAction(options) {
  const sources = [
    options.verifiedActionFile !== null,
    options.verifiedActionJson !== null,
  ].filter(Boolean);

  if (sources.length === 0) {
    throw new Error(
      "Provide exactly one verified_action source: --verified-action-file or --verified-action-json",
    );
  }

  if (sources.length > 1) {
    throw new Error(
      "Provide exactly one verified_action source: --verified-action-file or --verified-action-json",
    );
  }

  if (options.verifiedActionFile !== null) {
    return parseJson(
      await readFile(options.verifiedActionFile, "utf8"),
      "--verified-action-file",
    );
  }

  return parseJson(options.verifiedActionJson, "--verified-action-json");
}

function trimTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function postToAdminEndpoint(baseUrl, token, payload) {
  const endpointUrl = `${trimTrailingSlash(baseUrl)}${ADMIN_ENDPOINT_PATH}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    throw new Error(
      `admin endpoint request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  let parsed = null;

  if (text.trim() !== "") {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  return { status: response.status, body: parsed, rawBody: text };
}

function extractEntryId(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  if (typeof body.entry_id === "number") {
    return body.entry_id;
  }
  if (typeof body.entryId === "number") {
    return body.entryId;
  }
  return null;
}

function extractSlug(body, fallback) {
  if (body && typeof body === "object" && typeof body.slug === "string") {
    return body.slug;
  }
  return fallback;
}

function buildEnvelope(verifiedAction, payload, options, result) {
  const newAlternative =
    typeof verifiedAction.newAlternative === "object" &&
    verifiedAction.newAlternative !== null
      ? verifiedAction.newAlternative
      : {};

  const envelope = {
    issueNumber:
      typeof verifiedAction.issueNumber === "number"
        ? verifiedAction.issueNumber
        : null,
    action: "new_alternative",
    dryRun: options.dryRun,
    accessedDate:
      typeof verifiedAction.accessedDate === "string"
        ? verifiedAction.accessedDate
        : null,
    result,
    request: {
      endpoint: ADMIN_ENDPOINT_PATH,
      payload,
    },
    researchSources:
      typeof newAlternative.sources === "object" &&
      newAlternative.sources !== null
        ? newAlternative.sources
        : {},
    verifierEvidence:
      typeof verifiedAction.verifierEvidence === "object" &&
      verifiedAction.verifierEvidence !== null
        ? verifiedAction.verifierEvidence
        : {},
  };

  if (options.repo !== null) {
    envelope.repo = options.repo;
  }

  return envelope;
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
    return SUCCESS;
  }

  let verifiedAction;

  try {
    verifiedAction = await loadVerifiedAction(options);
  } catch (error) {
    process.stderr.write(`Invalid usage: ${error.message}\n`);
    return INVALID_USAGE;
  }

  let payload;

  try {
    assertNoBannedKeys(verifiedAction);
    payload = buildAdminPayload(verifiedAction, {
      statusOverride: options.status,
    });
  } catch (error) {
    process.stderr.write(`Fail-closed: ${error.message}\n`);
    return FAIL_CLOSED;
  }

  if (options.dryRun) {
    const envelope = buildEnvelope(verifiedAction, payload, options, {
      ok: false,
      dryRun: true,
      trustScoreStatus: "pending",
    });
    process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
    return SUCCESS;
  }

  const apiBase = process.env.EUROALT_API_BASE;

  if (typeof apiBase !== "string" || apiBase.trim() === "") {
    process.stderr.write(
      "Fail-closed: EUROALT_API_BASE must be set for a non-dry-run\n",
    );
    return FAIL_CLOSED;
  }

  const token = process.env.EUROALT_ADMIN_TOKEN;

  if (typeof token !== "string" || token.trim() === "") {
    process.stderr.write(
      "Fail-closed: EUROALT_ADMIN_TOKEN must be set for a non-dry-run\n",
    );
    return FAIL_CLOSED;
  }

  let response;

  try {
    response = await postToAdminEndpoint(apiBase, token, payload);
  } catch (error) {
    process.stderr.write(
      `Fail-closed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return FAIL_CLOSED;
  }

  if (response.status !== 201) {
    process.stderr.write(
      `Fail-closed: admin endpoint returned HTTP ${response.status}${
        response.rawBody.trim() === "" ? "" : `: ${response.rawBody.trim()}`
      }\n`,
    );
    return FAIL_CLOSED;
  }

  if (
    !response.body ||
    typeof response.body !== "object" ||
    response.body.ok !== true
  ) {
    process.stderr.write(
      `Fail-closed: admin endpoint responded with HTTP 201 but body lacked ok=true: ${response.rawBody}\n`,
    );
    return FAIL_CLOSED;
  }

  const entryId = extractEntryId(response.body);

  if (entryId === null) {
    process.stderr.write(
      `Fail-closed: admin endpoint responded ok=true but did not include an entry_id: ${response.rawBody}\n`,
    );
    return FAIL_CLOSED;
  }

  const envelope = buildEnvelope(verifiedAction, payload, options, {
    ok: true,
    entryId,
    slug: extractSlug(response.body, payload.slug),
    trustScoreStatus: "pending",
  });

  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
  return SUCCESS;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Fail-closed: ${message}\n`);
      process.exit(FAIL_CLOSED);
    });
}
