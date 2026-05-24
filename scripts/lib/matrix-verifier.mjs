export const MATRIX_VERIFICATION_BEGIN_SENTINEL =
  "BEGIN_MATRIX_FACT_VERIFICATION_JSON";
export const MATRIX_VERIFICATION_END_SENTINEL =
  "END_MATRIX_FACT_VERIFICATION_JSON";

const VERIFIER_VERDICTS = new Set([
  "supports",
  "contradicts",
  "inconclusive",
  "source-inaccessible",
  "not-applicable",
]);
const NEEDS_VERIFICATION_STATUS = "needs-verification";
const VERIFIED_STATUS = "verified";

const VERIFIER_COMMANDS = Object.freeze({
  codex: Object.freeze({
    command: "codex",
    args: Object.freeze(["exec"]),
  }),
  claude: Object.freeze({
    command: "claude",
    args: Object.freeze(["--print"]),
  }),
});

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be one JSON object`);
  }

  return value;
}

function assertAllowedKeys(value, allowedKeys, label) {
  const allowed = new Set(allowedKeys);
  const unexpectedKeys = Object.keys(value).filter((key) => !allowed.has(key));

  if (unexpectedKeys.length > 0) {
    throw new Error(
      `${label} contains unsupported fields: ${unexpectedKeys.join(", ")}`,
    );
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
}

function assertHttpUrl(value, label) {
  const url = assertNonEmptyString(value, label);
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`${label} must use an http or https URL`);
  }

  return url;
}

function normalizeOptionalHttpUrl(value, label) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return assertHttpUrl(value, label);
}

function isValidIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function assertIsoDate(value, label) {
  const date = assertNonEmptyString(value, label);

  if (!isValidIsoDate(date)) {
    throw new Error(`${label} must use YYYY-MM-DD format`);
  }

  return date;
}

function normalizeOptionalIsoDate(value, label) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return assertIsoDate(value, label);
}

function normalizeOptionalSourceTitle(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("sourceTitle must be a string or null");
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function validateAuditQuote(value) {
  const quote = assertNonEmptyString(value, "auditQuote");

  if (quote.length > 1000) {
    throw new Error("auditQuote must be short enough for audit storage");
  }

  return quote;
}

function normalizeOptionalAuditQuote(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return validateAuditQuote(value);
}

function normalizeVerifierIndex(value) {
  if (!Number.isInteger(value) || value < 1 || value > 3) {
    throw new Error("verifierIndex must identify slot 1, 2, or 3");
  }

  return value;
}

function normalizeVerdict(value) {
  const verdict = assertNonEmptyString(value, "verdict").toLowerCase();

  if (!VERIFIER_VERDICTS.has(verdict)) {
    throw new Error(
      `verdict must be one of ${Array.from(VERIFIER_VERDICTS).join(", ")}`,
    );
  }

  return verdict;
}

function stableJson(value) {
  return JSON.stringify(value);
}

function assertSameProposedValue(actual, expected) {
  if (stableJson(actual) !== stableJson(expected)) {
    throw new Error(
      `attempt proposedValue ${stableJson(
        actual,
      )} does not match pending attempt proposedValue ${stableJson(expected)}`,
    );
  }
}

function validateScalarStringValue(value, label) {
  return assertNonEmptyString(value, label);
}

function validateMultiEnumValue(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      "proposedValue must be an array of strings for valueType multi_enum",
    );
  }

  return value.map((item, index) =>
    assertNonEmptyString(item, `proposedValue[${index}]`),
  );
}

function validateVerifiedValue(value, valueType) {
  switch (valueType) {
    case "boolean":
      if (typeof value !== "boolean") {
        throw new Error("proposedValue must be boolean for valueType boolean");
      }

      return value;

    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(
          "proposedValue must be a finite number for valueType number",
        );
      }

      return value;

    case "enum":
      return validateScalarStringValue(value, "proposedValue");

    case "multi_enum":
      return validateMultiEnumValue(value);

    case "url":
      return assertHttpUrl(value, "proposedValue");

    case "date":
      return assertIsoDate(value, "proposedValue");

    case "text":
      return validateScalarStringValue(value, "proposedValue");

    default:
      throw new Error(`Unsupported matrix valueType ${String(valueType)}`);
  }
}

function extractDelimitedJson(rawResponse) {
  if (typeof rawResponse !== "string" || rawResponse.trim() === "") {
    throw new Error("raw response must be a non-empty string");
  }

  const beginIndex = rawResponse.indexOf(MATRIX_VERIFICATION_BEGIN_SENTINEL);
  const endIndex = rawResponse.indexOf(
    MATRIX_VERIFICATION_END_SENTINEL,
    beginIndex + MATRIX_VERIFICATION_BEGIN_SENTINEL.length,
  );

  if (beginIndex === -1 || endIndex === -1) {
    throw new Error(
      `Response must include ${MATRIX_VERIFICATION_BEGIN_SENTINEL} and ${MATRIX_VERIFICATION_END_SENTINEL} sentinels`,
    );
  }

  if (
    rawResponse.indexOf(
      MATRIX_VERIFICATION_BEGIN_SENTINEL,
      beginIndex + MATRIX_VERIFICATION_BEGIN_SENTINEL.length,
    ) !== -1 ||
    rawResponse.indexOf(
      MATRIX_VERIFICATION_END_SENTINEL,
      endIndex + MATRIX_VERIFICATION_END_SENTINEL.length,
    ) !== -1
  ) {
    throw new Error(
      "Response must contain exactly one sentinel-delimited verification",
    );
  }

  return rawResponse
    .slice(beginIndex + MATRIX_VERIFICATION_BEGIN_SENTINEL.length, endIndex)
    .trim();
}

function parseDelimitedPayload(rawResponse) {
  const jsonText = extractDelimitedJson(rawResponse);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Invalid matrix verification JSON: ${error.message}`);
  }
}

function validateTarget(payloadTarget, selectedTarget) {
  const target = assertPlainObject(payloadTarget, "target");

  assertAllowedKeys(
    target,
    ["factId", "categoryId", "entrySlug", "criterionKey"],
    "target",
  );

  if (target.factId !== selectedTarget.factId) {
    throw new Error(
      `target factId ${String(target.factId)} does not match selected factId ${String(
        selectedTarget.factId,
      )}`,
    );
  }

  for (const key of ["categoryId", "entrySlug", "criterionKey"]) {
    if (target[key] !== selectedTarget[key]) {
      throw new Error(
        `target ${key} ${String(target[key])} does not match selected ${key} ${String(
          selectedTarget[key],
        )}`,
      );
    }
  }
}

function validateAttempt(payloadAttempt, pendingAttempt) {
  const attempt = assertPlainObject(payloadAttempt, "attempt");

  assertAllowedKeys(
    attempt,
    ["factId", "proposedStatus", "proposedValue"],
    "attempt",
  );

  if (attempt.factId !== pendingAttempt.factId) {
    throw new Error(
      `attempt factId ${String(attempt.factId)} does not match pending attempt factId ${String(
        pendingAttempt.factId,
      )}`,
    );
  }

  if (attempt.proposedStatus !== pendingAttempt.proposedStatus) {
    throw new Error(
      `attempt proposedStatus ${String(
        attempt.proposedStatus,
      )} does not match pending attempt proposedStatus ${String(
        pendingAttempt.proposedStatus,
      )}`,
    );
  }

  assertSameProposedValue(attempt.proposedValue, pendingAttempt.proposedValue);
}

function normalizeReasoning(verification) {
  const reasoning =
    verification.reasoning === undefined
      ? verification.notes
      : verification.reasoning;

  return assertNonEmptyString(reasoning, "reasoning");
}

function normalizeVerification(verificationPayload, options) {
  const verification = assertPlainObject(verificationPayload, "verification");

  assertAllowedKeys(
    verification,
    [
      "verifierIndex",
      "verdict",
      "sourceUrl",
      "sourceTitle",
      "accessedDate",
      "auditQuote",
      "reasoning",
      "notes",
    ],
    "verification",
  );

  const verifierIndex = normalizeVerifierIndex(verification.verifierIndex);
  const expectedVerifierIndex = normalizeVerifierIndex(options.verifierIndex);

  if (verifierIndex !== expectedVerifierIndex) {
    throw new Error(
      `verification verifierIndex ${String(
        verifierIndex,
      )} does not match runner slot ${String(expectedVerifierIndex)}`,
    );
  }

  const verdict = normalizeVerdict(verification.verdict);
  const notes = normalizeReasoning(verification);
  const sourceTitle = normalizeOptionalSourceTitle(verification.sourceTitle);

  if (verdict === "source-inaccessible") {
    return {
      verifierIndex,
      verdict,
      sourceUrl: normalizeOptionalHttpUrl(verification.sourceUrl, "sourceUrl"),
      sourceTitle,
      accessedDate: normalizeOptionalIsoDate(
        verification.accessedDate,
        "accessedDate",
      ),
      auditQuote: normalizeOptionalAuditQuote(verification.auditQuote),
      notes,
      countsTowardAcceptance: false,
    };
  }

  const sourceUrl = assertHttpUrl(verification.sourceUrl, "sourceUrl");
  const accessedDate = assertIsoDate(verification.accessedDate, "accessedDate");
  const auditQuote = validateAuditQuote(verification.auditQuote);

  return {
    verifierIndex,
    verdict,
    sourceUrl,
    sourceTitle,
    accessedDate,
    auditQuote,
    notes,
    countsTowardAcceptance: verdict === "supports",
  };
}

function hasCountableSupportEvidence(record) {
  return (
    record !== null &&
    typeof record === "object" &&
    record.verdict === "supports" &&
    record.countsTowardAcceptance === true &&
    Number.isInteger(record.verifierIndex) &&
    record.verifierIndex >= 1 &&
    record.verifierIndex <= 3 &&
    typeof record.rawResponse === "string" &&
    record.rawResponse.trim() !== "" &&
    typeof record.notes === "string" &&
    record.notes.trim() !== "" &&
    typeof record.auditQuote === "string" &&
    record.auditQuote.trim() !== "" &&
    isValidIsoDate(record.accessedDate) &&
    typeof record.sourceUrl === "string" &&
    (() => {
      try {
        assertHttpUrl(record.sourceUrl, "sourceUrl");
        return true;
      } catch {
        return false;
      }
    })()
  );
}

export function getVerifierCommand(verifier) {
  const normalizedVerifier = String(verifier ?? "")
    .trim()
    .toLowerCase();
  const config = VERIFIER_COMMANDS[normalizedVerifier];

  if (!config) {
    throw new Error(`Unknown matrix verifier "${String(verifier)}"`);
  }

  return {
    command: config.command,
    args: [...config.args],
  };
}

export function formatVerifierCommand(commandConfig) {
  return [commandConfig.command, ...commandConfig.args].join(" ");
}

export function validatePendingVerificationInput(target, attempt) {
  const selectedTarget = assertPlainObject(target, "Selected target");
  const pendingAttempt = assertPlainObject(attempt, "Pending attempt");

  if (selectedTarget.dryRun === true) {
    throw new Error("Refusing to verify a dry-run target");
  }

  if (selectedTarget.status !== "researching") {
    throw new Error("Selected target status must be researching");
  }

  if (pendingAttempt.factId !== selectedTarget.factId) {
    throw new Error("Pending attempt factId must match selected target factId");
  }

  if (pendingAttempt.status !== NEEDS_VERIFICATION_STATUS) {
    throw new Error("Pending attempt status must be needs-verification");
  }

  if (pendingAttempt.proposedStatus !== VERIFIED_STATUS) {
    throw new Error("Pending attempt proposedStatus must be verified");
  }

  validateVerifiedValue(pendingAttempt.proposedValue, selectedTarget.valueType);
  assertHttpUrl(pendingAttempt.sourceUrl, "attempt sourceUrl");
  assertIsoDate(pendingAttempt.accessedDate, "attempt accessedDate");
  validateAuditQuote(pendingAttempt.auditQuote);

  return true;
}

export function buildMatrixVerificationPrompt(target, attempt, options = {}) {
  const verifierIndex = normalizeVerifierIndex(options.verifierIndex);
  const accessedDate = options.accessedDate ?? currentUtcDate();

  return `You are verifier slot ${verifierIndex} for one pending research attempt in the European Alternatives matrix.

Non-negotiable scope:
- verifierIndex: ${verifierIndex}
- This invocation must be independent.
- Do not rely on other verifier outputs.
- Verify exactly one pending research attempt.
- Do not answer adjacent facts, products, categories, or criteria.
- If you cannot open an accessible page and quote evidence, the verifier record does not count.

Selected fact:
- factId: ${target.factId}
- categoryId: ${target.categoryId}
- categoryName: ${target.categoryName ?? ""}
- entrySlug: ${target.entrySlug}
- entryName: ${target.entryName ?? ""}
- criterionKey: ${target.criterionKey}
- criterionLabel: ${target.criterionLabel ?? ""}
- valueType: ${target.valueType}

Pending attempt to verify:
- factId: ${attempt.factId}
- proposedStatus: ${attempt.proposedStatus}
- proposedValue: ${JSON.stringify(attempt.proposedValue)}
- researcherSourceUrl: ${attempt.sourceUrl}
- researcherSourceTitle: ${attempt.sourceTitle ?? ""}
- researcherAccessedDate: ${attempt.accessedDate}
- researcherAuditQuote: ${attempt.auditQuote}
- researcherConfidence: ${attempt.confidence ?? ""}

Verification requirements:
- Open the researcher's cited source first: ${attempt.sourceUrl}
- If that page is inaccessible, find an alternative accessible source for the same fact.
- Return a verdict as one of supports, contradicts, inconclusive, source-inaccessible, or not-applicable.
- For every verdict except source-inaccessible, include an accessible source URL, accessed date ${accessedDate}, one short audit quote copied from the source, and reasoning.
- If no accessible source can be opened and quoted, return source-inaccessible with reasoning; it does not count.

Return only this machine-readable JSON inside the fixed sentinels. Do not add any other JSON block.

${MATRIX_VERIFICATION_BEGIN_SENTINEL}
{
  "target": {
    "factId": ${JSON.stringify(target.factId)},
    "categoryId": ${JSON.stringify(target.categoryId)},
    "entrySlug": ${JSON.stringify(target.entrySlug)},
    "criterionKey": ${JSON.stringify(target.criterionKey)}
  },
  "attempt": {
    "factId": ${JSON.stringify(attempt.factId)},
    "proposedStatus": ${JSON.stringify(attempt.proposedStatus)},
    "proposedValue": ${JSON.stringify(attempt.proposedValue)}
  },
  "verification": {
    "verifierIndex": ${verifierIndex},
    "verdict": "supports",
    "sourceUrl": "https://example.test/source",
    "sourceTitle": "Source title",
    "accessedDate": ${JSON.stringify(accessedDate)},
    "auditQuote": "Short quote from the source.",
    "reasoning": "Why this source supports or does not support the pending attempt."
  }
}
${MATRIX_VERIFICATION_END_SENTINEL}`;
}

export function parseMatrixVerificationResponse(
  rawResponse,
  target,
  attempt,
  options,
) {
  const payload = assertPlainObject(
    parseDelimitedPayload(rawResponse),
    "matrix verification payload",
  );

  if (
    "verifications" in payload ||
    "answers" in payload ||
    "facts" in payload ||
    "sources" in payload
  ) {
    throw new Error(
      "Response must describe one verifier record only; plural verifications, answers, facts, or sources are not allowed",
    );
  }

  assertAllowedKeys(
    payload,
    ["target", "attempt", "verification"],
    "matrix verification payload",
  );

  if (
    !("target" in payload) ||
    !("attempt" in payload) ||
    !("verification" in payload)
  ) {
    throw new Error(
      "Response must include exactly one target, one attempt, and one verification",
    );
  }

  validateTarget(payload.target, target);
  validateAttempt(payload.attempt, attempt);

  const verification = normalizeVerification(payload.verification, options);

  return {
    factId: target.factId,
    verifierIndex: verification.verifierIndex,
    agent: assertNonEmptyString(options?.agent, "agent"),
    model: options?.model ?? null,
    command: options?.command ?? null,
    sourceUrl: verification.sourceUrl,
    sourceTitle: verification.sourceTitle,
    accessedDate: verification.accessedDate,
    auditQuote: verification.auditQuote,
    verdict: verification.verdict,
    notes: verification.notes,
    countsTowardAcceptance: verification.countsTowardAcceptance,
    rawResponse,
  };
}

export function decideMatrixVerificationOutcome(attempt, records) {
  const verifications = Array.isArray(records) ? records : [];
  const countableSlots = new Set();

  for (const record of verifications) {
    if (hasCountableSupportEvidence(record)) {
      countableSlots.add(record.verifierIndex);
    }
  }

  const hasAllVerifierSlots =
    countableSlots.has(1) && countableSlots.has(2) && countableSlots.has(3);
  const accepted =
    verifications.length === 3 &&
    hasAllVerifierSlots &&
    countableSlots.size === 3;

  return {
    attempt: {
      factId: attempt?.factId ?? null,
      status: attempt?.status ?? null,
    },
    verifications,
    accepted,
    recommendedAttemptStatus: accepted ? "accepted" : "needs-deeper-research",
    recommendedFactStatus: accepted ? "verified" : "needs-deeper-research",
    countableVerifierCount: countableSlots.size,
    ...(accepted
      ? {}
      : {
          reason:
            "A research attempt requires three independent, countable supporting verifier records.",
        }),
  };
}
