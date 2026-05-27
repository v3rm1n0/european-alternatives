export const GITHUB_COMMENT_MAX_LENGTH = 65_536;

export const BANNED_FINALIZER_KEYS = Object.freeze([
  "trustScore",
  "trust_score",
  "trustScoreStatus",
  "trust_score_status",
  "reservations",
  "reservation",
  "positiveSignals",
  "positive_signals",
  "positive_signal",
  "scoringMetadata",
  "scoring_metadata",
  "baseClassOverride",
  "base_class_override",
  "isAdSurveillance",
  "is_ad_surveillance",
]);

export const FINALIZER_SUPPORTED_ACTIONS = Object.freeze([
  "new_alternative",
  "catalog_fact_correction",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertNoBannedKeys(value, path) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      assertNoBannedKeys(value[index], `${path}[${String(index)}]`);
    }

    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (BANNED_FINALIZER_KEYS.includes(key)) {
      throw new Error(
        `banned scoring key ${JSON.stringify(key)} appears in ${path} — refusing to finalize`,
      );
    }

    assertNoBannedKeys(child, path === "" ? key : `${path}.${key}`);
  }
}

function defuseAuditQuote(rawQuote) {
  if (typeof rawQuote !== "string") {
    return null;
  }

  const trimmed = rawQuote.trim();

  if (trimmed === "") {
    return null;
  }

  // Render each source line as a `> ` blockquote line. This neutralises any
  // leading triple-backtick fence inside the quote (the line will start with
  // `> ` not ```, so it cannot escape an enclosing Markdown fence) and keeps
  // backtick content visually intact.
  return rawQuote
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function formatSourceBullet(url, title, accessedDate) {
  const trimmedUrl = typeof url === "string" ? url.trim() : "";
  const safeTitle =
    typeof title === "string" && title.trim() !== ""
      ? title.trim()
      : trimmedUrl;
  const datePart =
    typeof accessedDate === "string" && accessedDate.trim() !== ""
      ? ` (accessed ${accessedDate.trim()})`
      : "";

  return `- ${trimmedUrl} — ${safeTitle}${datePart}`;
}

function renderResearcherSourcesForNewAlternative(sources) {
  if (!isPlainObject(sources)) {
    return [];
  }

  const lines = [];

  for (const [field, source] of Object.entries(sources)) {
    if (!isPlainObject(source) || typeof source.url !== "string") {
      continue;
    }

    const title =
      typeof source.title === "string" && source.title.trim() !== ""
        ? source.title
        : `Researcher source for ${field}`;

    lines.push(formatSourceBullet(source.url, title, source.accessedDate));
  }

  return lines;
}

function renderResearcherSourcesForFactCorrection(changes) {
  if (!Array.isArray(changes)) {
    return [];
  }

  const lines = [];

  for (const change of changes) {
    if (!isPlainObject(change)) {
      continue;
    }

    const source = isPlainObject(change.source) ? change.source : null;

    if (source === null || typeof source.url !== "string") {
      continue;
    }

    const fallbackTitle =
      typeof change.column === "string"
        ? `${typeof change.table === "string" ? change.table : "catalog_entries"}.${change.column}`
        : "researcher source";
    const title =
      typeof source.title === "string" && source.title.trim() !== ""
        ? source.title
        : fallbackTitle;

    lines.push(formatSourceBullet(source.url, title, source.accessedDate));
  }

  return lines;
}

function renderVerifierEvidenceEntries(evidenceEntries) {
  const lines = [];

  for (const entry of evidenceEntries) {
    if (!isPlainObject(entry) || typeof entry.sourceUrl !== "string") {
      continue;
    }

    const title =
      typeof entry.sourceTitle === "string" && entry.sourceTitle.trim() !== ""
        ? entry.sourceTitle
        : typeof entry.column === "string"
          ? entry.column
          : "verifier source";

    lines.push(formatSourceBullet(entry.sourceUrl, title, entry.accessedDate));

    const quote = defuseAuditQuote(entry.auditQuote);

    if (quote !== null) {
      lines.push(quote);
    }
  }

  return lines;
}

function renderChangesAppliedForFactCorrection(changesApplied) {
  if (!Array.isArray(changesApplied)) {
    return [];
  }

  const lines = [];

  for (const change of changesApplied) {
    if (!isPlainObject(change)) {
      continue;
    }

    const table = typeof change.table === "string" ? change.table : "?";
    const op = typeof change.op === "string" ? change.op : "update";

    if (op === "insert" || op === "add" || op === "create") {
      const tagSlug =
        typeof change.tag_slug === "string"
          ? change.tag_slug
          : typeof change.tagSlug === "string"
            ? change.tagSlug
            : "";

      if (tagSlug !== "") {
        lines.push(`- \`${table}\`: added \`${tagSlug}\``);
        continue;
      }

      const aliasValue =
        typeof change.alias === "string"
          ? change.alias
          : typeof change.raw_name === "string"
            ? change.raw_name
            : "";

      if (aliasValue !== "") {
        lines.push(`- \`${table}\`: added \`${aliasValue}\``);
        continue;
      }

      const insertedColumn =
        typeof change.column === "string" ? change.column : "row";

      lines.push(`- \`${table}\`: inserted ${insertedColumn}`);
      continue;
    }

    const column = typeof change.column === "string" ? change.column : "";
    const proposedValue =
      change.proposedValue !== undefined
        ? JSON.stringify(change.proposedValue)
        : "?";
    const columnPath = column === "" ? table : `${table}.${column}`;

    lines.push(`- \`${columnPath}\` → ${proposedValue}`);
  }

  return lines;
}

function assertInputsAreObjects(verifiedAction, mutationOutcome) {
  if (!isPlainObject(verifiedAction)) {
    throw new Error("verifiedAction must be a JSON object");
  }

  if (!isPlainObject(mutationOutcome)) {
    throw new Error("mutationOutcome must be a JSON object");
  }
}

export function validateFinalizerInputs({ verifiedAction, mutationOutcome }) {
  assertInputsAreObjects(verifiedAction, mutationOutcome);

  if (mutationOutcome.ok !== true) {
    throw new Error(
      "mutationOutcome.ok must be true; nothing to finalize (fail-closed)",
    );
  }

  const action = verifiedAction.action;

  if (typeof action !== "string" || action.trim() === "") {
    throw new Error("verifiedAction.action is required");
  }

  if (!FINALIZER_SUPPORTED_ACTIONS.includes(action)) {
    throw new Error(
      `unsupported verifiedAction.action ${JSON.stringify(action)}; expected one of: ${FINALIZER_SUPPORTED_ACTIONS.join(", ")}`,
    );
  }

  assertNoBannedKeys(verifiedAction, "verifiedAction");
  assertNoBannedKeys(mutationOutcome, "mutationOutcome");

  if (action === "new_alternative") {
    const newAlternative = verifiedAction.newAlternative;

    if (!isPlainObject(newAlternative)) {
      throw new Error("verifiedAction.newAlternative is required");
    }

    if (
      !isPlainObject(newAlternative.sources) ||
      Object.keys(newAlternative.sources).length === 0
    ) {
      throw new Error(
        "verifiedAction.newAlternative.sources is missing or empty; researcher sources required",
      );
    }

    const evidence = verifiedAction.verifierEvidence;
    const evidenceCount = isPlainObject(evidence)
      ? Object.keys(evidence).length
      : Array.isArray(evidence)
        ? evidence.length
        : 0;

    if (evidenceCount === 0) {
      throw new Error(
        "verifiedAction.verifierEvidence is empty; verifier evidence required",
      );
    }

    return;
  }

  const factCorrection = verifiedAction.factCorrection;

  if (!isPlainObject(factCorrection)) {
    throw new Error("verifiedAction.factCorrection is required");
  }

  if (
    !Array.isArray(factCorrection.changes) ||
    factCorrection.changes.length === 0
  ) {
    throw new Error("verifiedAction.factCorrection.changes is empty");
  }

  const evidence = verifiedAction.verifierEvidence;

  if (!Array.isArray(evidence) || evidence.length === 0) {
    throw new Error(
      "verifiedAction.verifierEvidence is empty; verifier evidence required",
    );
  }
}

function buildNewAlternativeBody(verifiedAction, mutationOutcome) {
  const newAlternative = isPlainObject(verifiedAction.newAlternative)
    ? verifiedAction.newAlternative
    : {};
  const slug =
    typeof newAlternative.slug === "string" && newAlternative.slug.trim() !== ""
      ? newAlternative.slug
      : typeof mutationOutcome.slug === "string"
        ? mutationOutcome.slug
        : "?";
  const entryId =
    mutationOutcome.entry_id !== undefined &&
    mutationOutcome.entry_id !== null
      ? String(mutationOutcome.entry_id)
      : "?";
  const name =
    typeof newAlternative.name === "string" && newAlternative.name.trim() !== ""
      ? newAlternative.name
      : slug;

  const lines = [];

  lines.push("**Action:** Inserted as new alternative — Trust Score Pending");
  lines.push("");

  lines.push("**Changes applied:**");
  lines.push(
    `- Inserted new alternative \`${slug}\` (${name}, entry id ${entryId}).`,
  );
  lines.push("");

  lines.push("**Researcher sources:**");
  const researcherLines = renderResearcherSourcesForNewAlternative(
    newAlternative.sources,
  );

  if (researcherLines.length === 0) {
    lines.push("- (none recorded)");
  } else {
    lines.push(...researcherLines);
  }

  lines.push("");

  lines.push("**Independent verifier sources:**");
  const verifierEvidence = verifiedAction.verifierEvidence;
  const evidenceArray = isPlainObject(verifierEvidence)
    ? Object.values(verifierEvidence)
    : Array.isArray(verifierEvidence)
      ? verifierEvidence
      : [];
  const verifierLines = renderVerifierEvidenceEntries(evidenceArray);

  if (verifierLines.length === 0) {
    lines.push("- (none recorded)");
  } else {
    lines.push(...verifierLines);
  }

  lines.push("");

  return lines;
}

function buildFactCorrectionBody(verifiedAction, mutationOutcome) {
  const factCorrection = isPlainObject(verifiedAction.factCorrection)
    ? verifiedAction.factCorrection
    : {};
  const slug =
    typeof factCorrection.targetEntrySlug === "string" &&
    factCorrection.targetEntrySlug.trim() !== ""
      ? factCorrection.targetEntrySlug
      : typeof mutationOutcome.targetEntrySlug === "string"
        ? mutationOutcome.targetEntrySlug
        : "?";

  const lines = [];

  lines.push(`**Action:** Basic fact correction on \`${slug}\``);
  lines.push("");

  lines.push("**Changes applied:**");
  const changesApplied = Array.isArray(mutationOutcome.changesApplied)
    ? mutationOutcome.changesApplied
    : [];
  const changeLines = renderChangesAppliedForFactCorrection(changesApplied);

  if (changeLines.length === 0) {
    lines.push("- (none recorded)");
  } else {
    lines.push(...changeLines);
  }

  lines.push("");

  lines.push("**Researcher sources:**");
  const researcherLines = renderResearcherSourcesForFactCorrection(
    factCorrection.changes,
  );

  if (researcherLines.length === 0) {
    lines.push("- (none recorded)");
  } else {
    lines.push(...researcherLines);
  }

  lines.push("");

  lines.push("**Independent verifier sources:**");
  const verifierEvidence = Array.isArray(verifiedAction.verifierEvidence)
    ? verifiedAction.verifierEvidence
    : [];
  const verifierLines = renderVerifierEvidenceEntries(verifierEvidence);

  if (verifierLines.length === 0) {
    lines.push("- (none recorded)");
  } else {
    lines.push(...verifierLines);
  }

  lines.push("");

  return lines;
}

export function buildSuccessComment({ verifiedAction, mutationOutcome }) {
  assertInputsAreObjects(verifiedAction, mutationOutcome);

  assertNoBannedKeys(verifiedAction, "verifiedAction");
  assertNoBannedKeys(mutationOutcome, "mutationOutcome");

  const action = verifiedAction.action;

  if (!FINALIZER_SUPPORTED_ACTIONS.includes(action)) {
    throw new Error(
      `unsupported verifiedAction.action ${JSON.stringify(action)}; expected one of: ${FINALIZER_SUPPORTED_ACTIONS.join(", ")}`,
    );
  }

  const lines = [];

  lines.push("✅ **Catalog updated for this suggestion.**");
  lines.push("");

  if (action === "new_alternative") {
    lines.push(...buildNewAlternativeBody(verifiedAction, mutationOutcome));
  } else {
    lines.push(...buildFactCorrectionBody(verifiedAction, mutationOutcome));
  }

  lines.push(
    "**Trust Score:** remains *pending*. No scoring metadata, reservations, or positive signals were created.",
  );
  lines.push("");
  lines.push(
    "— automated by the European Alternatives Codex suggestion pipeline",
  );

  const body = lines.join("\n");

  if (Buffer.byteLength(body, "utf8") >= GITHUB_COMMENT_MAX_LENGTH) {
    const truncationNote =
      "\n\n…(comment truncated to fit GitHub's 65 KB issue-comment limit)";
    const truncationBudget = Buffer.byteLength(truncationNote, "utf8") + 4;
    const allowance = GITHUB_COMMENT_MAX_LENGTH - truncationBudget;
    const truncated = Buffer.from(body, "utf8")
      .slice(0, allowance)
      .toString("utf8");

    return `${truncated}${truncationNote}`;
  }

  return body;
}
