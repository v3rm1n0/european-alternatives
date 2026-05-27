import { join, relative, resolve, sep } from "node:path";

export const WORKSHEET_SCHEMA_VERSION = 1;
export const DEFAULT_OUTPUT_DIR = "tmp/scoring-worksheets";

export const BANNED_WORKSHEET_KEYS = Object.freeze([
  "trustScore",
  "trust_score",
  "trustScoreStatus",
  "trust_score_status",
]);

const ENTRY_SLUG_REGEX = /^[a-z0-9]([a-z0-9._-]{0,98}[a-z0-9])?$/u;

const REQUIRED_TOP_LEVEL_FIELDS = [
  "schemaVersion",
  "entrySlug",
  "documentPath",
  "accessedDate",
  "thresholdCheck",
  "accepted",
  "rejected",
];

function isPlainObject(value) {
  return (
    value !== null && typeof value === "object" && !Array.isArray(value)
  );
}

function assertNoBannedKeys(value, pathSegments) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      assertNoBannedKeys(value[index], [...pathSegments, `[${index}]`]);
    }
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const key of Object.keys(value)) {
    if (BANNED_WORKSHEET_KEYS.includes(key)) {
      const where = pathSegments.length === 0 ? "<root>" : pathSegments.join(".");
      throw new Error(
        `handoff contains banned trust-score key ${JSON.stringify(key)} at ${where}`,
      );
    }
    assertNoBannedKeys(value[key], [...pathSegments, key]);
  }
}

export function validateEntrySlug(slug) {
  if (typeof slug !== "string") {
    throw new Error("entrySlug must be a non-empty string");
  }

  if (slug.length === 0) {
    throw new Error("entrySlug must be a non-empty string");
  }

  if (slug.trim().length === 0) {
    throw new Error("entrySlug is invalid: whitespace-only");
  }

  if (slug.includes("/") || slug.includes("\\") || slug.includes("..")) {
    throw new Error(
      `entrySlug ${JSON.stringify(slug)} is invalid: path traversal characters are not allowed`,
    );
  }

  if (!ENTRY_SLUG_REGEX.test(slug)) {
    throw new Error(
      `entrySlug ${JSON.stringify(slug)} is invalid: must match ${ENTRY_SLUG_REGEX.source}`,
    );
  }
}

export function validateHandoff(handoff) {
  if (!isPlainObject(handoff)) {
    throw new Error("handoff must be a JSON object");
  }

  if (handoff.schemaVersion !== WORKSHEET_SCHEMA_VERSION) {
    throw new Error(
      `unsupported handoff schemaVersion ${JSON.stringify(
        handoff.schemaVersion,
      )} (expected ${WORKSHEET_SCHEMA_VERSION})`,
    );
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in handoff)) {
      throw new Error(`handoff is missing required field ${field}`);
    }
  }

  if (typeof handoff.entrySlug !== "string" || handoff.entrySlug.length === 0) {
    throw new Error("handoff.entrySlug must be a non-empty string");
  }

  if (typeof handoff.accessedDate !== "string" || handoff.accessedDate.length === 0) {
    throw new Error("handoff.accessedDate must be a non-empty string");
  }

  if (!isPlainObject(handoff.accepted)) {
    throw new Error("handoff.accepted must be an object");
  }

  if (!Array.isArray(handoff.rejected)) {
    throw new Error("handoff.rejected must be an array");
  }

  if (!isPlainObject(handoff.thresholdCheck)) {
    throw new Error("handoff.thresholdCheck must be an object");
  }

  assertNoBannedKeys(handoff, []);
}

export function resolveWorksheetPath(outputDir, slug) {
  validateEntrySlug(slug);

  if (typeof outputDir !== "string" || outputDir.length === 0) {
    throw new Error("output directory must be a non-empty string");
  }

  const projectRoot = resolve(process.cwd());
  const absoluteDir = resolve(projectRoot, outputDir);

  if (
    absoluteDir !== projectRoot &&
    !absoluteDir.startsWith(`${projectRoot}${sep}`)
  ) {
    throw new Error(
      `output directory ${JSON.stringify(outputDir)} resolves outside the project root`,
    );
  }

  const absoluteWorksheetPath = join(absoluteDir, `${slug}.md`);
  let worksheetPath = relative(projectRoot, absoluteWorksheetPath);

  if (sep !== "/") {
    worksheetPath = worksheetPath.split(sep).join("/");
  }

  return { worksheetPath, absoluteWorksheetPath };
}

function escapePipes(text) {
  return text.replace(/\|/g, "\\|");
}

function blockquote(text) {
  if (text === null || text === undefined) {
    return "> _(none)_";
  }

  const asString = String(text);

  if (asString.length === 0) {
    return "> _(empty)_";
  }

  return asString
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function renderValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function renderVerifierBlock(verifier) {
  if (!isPlainObject(verifier)) {
    return [
      "- **Verifier metadata:** _(missing)_",
    ].join("\n");
  }

  const lines = [
    `- **Verifier source title:** ${renderValue(verifier.source_title)}`,
    `- **Verifier source URL:** ${renderValue(verifier.source_url)}`,
    `- **Accessed at:** ${renderValue(verifier.accessed_at)}`,
    "- **Supporting quote:**",
    blockquote(verifier.supporting_quote),
    `- **Verification note:** ${renderValue(verifier.verification_note)}`,
  ];

  return lines.join("\n");
}

function renderPositiveSignal(item) {
  const row = isPlainObject(item.row) ? item.row : {};
  const verifier = isPlainObject(item.verifier) ? item.verifier : {};

  const headingKey = row.signal_key ?? "(unknown signal)";
  const dimension = renderValue(row.dimension);
  const amount = renderValue(row.amount);

  const lines = [
    `### ${headingKey} — dimension: ${dimension}, amount: ${amount}`,
    "",
    `- **Claim (en):** ${renderValue(row.text_en)}`,
    `- **Claim (de):** ${renderValue(row.text_de)}`,
    `- **Cited source URL:** ${renderValue(row.source_url)}`,
    renderVerifierBlock(verifier),
  ];

  return lines.join("\n");
}

function renderReservation(item) {
  const row = isPlainObject(item.row) ? item.row : {};
  const verifier = isPlainObject(item.verifier) ? item.verifier : {};

  const headingKey = row.reservation_key ?? "(unknown reservation)";
  const severity = renderValue(row.severity);
  const structural = renderValue(row.is_structural);

  const lines = [
    `### ${headingKey} — severity: ${severity}, structural: ${structural}`,
    "",
    `- **Event date:** ${renderValue(row.event_date)}`,
    `- **Penalty tier:** ${renderValue(row.penalty_tier)}`,
    `- **Penalty amount:** ${renderValue(row.penalty_amount)}`,
    `- **Claim (en):** ${renderValue(row.text_en)}`,
    `- **Claim (de):** ${renderValue(row.text_de)}`,
    `- **Cited source URL:** ${renderValue(row.source_url)}`,
    renderVerifierBlock(verifier),
  ];

  return lines.join("\n");
}

function renderScoringMetadata(meta) {
  if (!isPlainObject(meta)) {
    return "_No accepted scoring_metadata row in this run._";
  }

  return [
    `- **base_class_override:** ${renderValue(meta.base_class_override)}`,
    `- **is_ad_surveillance:** ${renderValue(meta.is_ad_surveillance)}`,
    `- **deep_research_path:** ${renderValue(meta.deep_research_path)}`,
    "- **Verifier verdict:** supports",
  ].join("\n");
}

function renderRejected(rejected) {
  if (!Array.isArray(rejected) || rejected.length === 0) {
    return "_None._";
  }

  const grouped = new Map();

  for (const row of rejected) {
    if (!isPlainObject(row)) {
      continue;
    }

    const table = typeof row.table === "string" ? row.table : "(unknown)";

    if (!grouped.has(table)) {
      grouped.set(table, []);
    }

    grouped.get(table).push(row);
  }

  const sections = [];

  for (const [table, rows] of grouped) {
    sections.push(`### ${table}`);

    for (const row of rows) {
      const rowKey = row.rowKey ?? "(no key)";
      const verdict = renderValue(row.verdict);
      const sourceUrl = renderValue(row.source_url);
      const note = renderValue(row.verification_note);

      sections.push(
        [
          `- **Row key:** ${renderValue(rowKey)}`,
          `  - **Verdict:** ${verdict}`,
          `  - **Cited source URL:** ${sourceUrl}`,
          `  - **Rejection reason:** ${note}`,
        ].join("\n"),
      );
    }
  }

  return sections.join("\n\n");
}

function deriveCounts(handoff) {
  const accepted = isPlainObject(handoff.accepted) ? handoff.accepted : {};
  const positives = Array.isArray(accepted.positive_signals)
    ? accepted.positive_signals
    : [];
  const reservations = Array.isArray(accepted.reservations)
    ? accepted.reservations
    : [];
  const rejected = Array.isArray(handoff.rejected) ? handoff.rejected : [];

  const acceptedPositiveSignals = positives.length;
  const acceptedReservations = reservations.length;
  const totalAcceptedRows = acceptedPositiveSignals + acceptedReservations;
  const rejectedRows = rejected.length;

  return {
    totalAcceptedRows,
    acceptedPositiveSignals,
    acceptedReservations,
    rejectedRows,
  };
}

export function buildWorksheetMarkdown(handoff, options = {}) {
  validateHandoff(handoff);

  const accepted = handoff.accepted;
  const positives = Array.isArray(accepted.positive_signals)
    ? accepted.positive_signals
    : [];
  const reservations = Array.isArray(accepted.reservations)
    ? accepted.reservations
    : [];
  const rejected = Array.isArray(handoff.rejected) ? handoff.rejected : [];
  const scoringMetadata = accepted.scoring_metadata;

  const counts = deriveCounts(handoff);

  const thresholdCheck = isPlainObject(handoff.thresholdCheck)
    ? handoff.thresholdCheck
    : {};
  const thresholds = isPlainObject(thresholdCheck.thresholds)
    ? thresholdCheck.thresholds
    : {};
  const minTotalRows = renderValue(thresholds.minTotalRows);
  const minPositiveSignals = renderValue(thresholds.minPositiveSignals);
  const minReservations = renderValue(thresholds.minReservations);

  const entryName = renderValue(
    isPlainObject(options.entry) ? options.entry.name : handoff.entryName,
  );
  const entryId = renderValue(
    isPlainObject(options.entry) ? options.entry.id : handoff.entryId,
  );
  const generatedAt =
    typeof options.generatedAt === "string"
      ? options.generatedAt
      : new Date().toISOString();

  const rejectedScoringMetadata = rejected.find(
    (row) => isPlainObject(row) && row.table === "scoring_metadata",
  );

  const sections = [];

  sections.push(`# Trust scoring worksheet — ${renderValue(handoff.entrySlug)}`);
  sections.push("");
  sections.push(
    "> **No trust-score value is stored.** Trust scores are computed dynamically by the scoring engine from the accepted `positive_signals`, `reservations`, and `scoring_metadata` rows below. This worksheet is the durable audit record of what survived stage-3 source verification.",
  );
  sections.push("");
  sections.push(`- **Entry slug:** \`${escapePipes(String(handoff.entrySlug))}\``);
  sections.push(`- **Entry name:** ${entryName}`);
  sections.push(`- **Entry id:** ${entryId}`);
  sections.push(`- **Deep-research document:** \`${renderValue(handoff.documentPath)}\``);
  sections.push(`- **Verification accessed date:** ${renderValue(handoff.accessedDate)}`);
  sections.push(`- **Schema version:** ${WORKSHEET_SCHEMA_VERSION}`);
  sections.push(`- **Generated at:** ${generatedAt}`);
  sections.push("");

  sections.push("## Threshold summary");
  sections.push("");
  sections.push("| Metric | Surviving count | Required |");
  sections.push("|---|---:|---:|");
  sections.push(`| Total rows | ${counts.totalAcceptedRows} | ${minTotalRows} |`);
  sections.push(
    `| Positive signals | ${counts.acceptedPositiveSignals} | ${minPositiveSignals} |`,
  );
  sections.push(
    `| Reservations | ${counts.acceptedReservations} | ${minReservations} |`,
  );
  sections.push("");
  sections.push(
    `Status: **${thresholdCheck.passed === false ? "FAILED" : "PASSED"}** _(the stage-3 verifier fails closed below threshold; this row is informational)._`,
  );
  sections.push("");

  sections.push(`## Accepted — positive_signals (${positives.length})`);
  sections.push("");

  if (positives.length === 0) {
    sections.push("_None._");
    sections.push("");
  } else {
    for (const item of positives) {
      sections.push(renderPositiveSignal(item));
      sections.push("");
    }
  }

  sections.push(`## Accepted — reservations (${reservations.length})`);
  sections.push("");

  if (reservations.length === 0) {
    sections.push("_None._");
    sections.push("");
  } else {
    for (const item of reservations) {
      sections.push(renderReservation(item));
      sections.push("");
    }
  }

  sections.push("## scoring_metadata");
  sections.push("");

  if (rejectedScoringMetadata !== undefined) {
    sections.push(
      `**REJECTED** — verdict: ${renderValue(rejectedScoringMetadata.verdict)}`,
    );
    sections.push("");
    sections.push(
      `- **Rejection reason:** ${renderValue(rejectedScoringMetadata.verification_note)}`,
    );
    sections.push("");
  } else if (isPlainObject(scoringMetadata)) {
    sections.push(renderScoringMetadata(scoringMetadata));
    sections.push("");
  } else {
    sections.push("_No accepted scoring_metadata row in this run._");
    sections.push("");
  }

  sections.push(`## Rejected rows (${rejected.length})`);
  sections.push("");
  sections.push(renderRejected(rejected));
  sections.push("");

  sections.push("---");
  sections.push("");
  sections.push(
    "_Generated by `scripts/vet-deep-research-worksheet-run.mjs` from the stage-3 verified scoring action handoff._",
  );
  sections.push("");

  return sections.join("\n");
}

export function buildEmittedMetadata(handoff, worksheetPath, options = {}) {
  validateHandoff(handoff);

  const counts = deriveCounts(handoff);
  const projectRoot = resolve(process.cwd());
  const absoluteWorksheetPath = resolve(projectRoot, worksheetPath);

  let portableWorksheetPath = worksheetPath;

  if (sep !== "/") {
    portableWorksheetPath = portableWorksheetPath.split(sep).join("/");
  }

  const metadata = {
    schemaVersion: WORKSHEET_SCHEMA_VERSION,
    entrySlug: handoff.entrySlug,
    worksheetPath: portableWorksheetPath,
    absoluteWorksheetPath,
    dryRun: Boolean(options.dryRun),
    wrote: Boolean(options.wrote),
    summary: {
      totalAcceptedRows: counts.totalAcceptedRows,
      acceptedPositiveSignals: counts.acceptedPositiveSignals,
      acceptedReservations: counts.acceptedReservations,
      rejectedRows: counts.rejectedRows,
    },
    passthrough: {
      documentPath: handoff.documentPath ?? null,
      accessedDate: handoff.accessedDate ?? null,
    },
  };

  return metadata;
}
