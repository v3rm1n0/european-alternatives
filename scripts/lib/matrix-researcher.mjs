export const MATRIX_RESEARCH_BEGIN_SENTINEL = "BEGIN_MATRIX_FACT_RESEARCH_JSON";
export const MATRIX_RESEARCH_END_SENTINEL = "END_MATRIX_FACT_RESEARCH_JSON";

const CONFIDENCE_VALUES = new Set(["high", "medium", "low"]);
const VERIFIED_STATUS = "verified";
const NEEDS_DEEPER_RESEARCH_STATUS = "needs-deeper-research";

const RESEARCHER_COMMANDS = Object.freeze({
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

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
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

function normalizeConfidence(value) {
  const confidence = assertNonEmptyString(value, "confidence").toLowerCase();

  if (!CONFIDENCE_VALUES.has(confidence)) {
    throw new Error("confidence must be high, medium, or low");
  }

  return confidence;
}

function validateAuditQuote(value) {
  const quote = assertNonEmptyString(value, "auditQuote");

  if (quote.length > 1000) {
    throw new Error("auditQuote must be short enough for audit storage");
  }

  return quote;
}

function normalizeProposedStatus(value) {
  const status = assertNonEmptyString(value, "proposedStatus").toLowerCase();

  if (status !== VERIFIED_STATUS && status !== NEEDS_DEEPER_RESEARCH_STATUS) {
    throw new Error(
      `proposedStatus must be ${VERIFIED_STATUS} or ${NEEDS_DEEPER_RESEARCH_STATUS}`,
    );
  }

  return status;
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

function validateProposedValue(value, proposedStatus, valueType) {
  if (proposedStatus === NEEDS_DEEPER_RESEARCH_STATUS) {
    if (value !== null) {
      throw new Error(
        "proposedValue must be null when proposedStatus is needs-deeper-research",
      );
    }

    return null;
  }

  return validateVerifiedValue(value, valueType);
}

function extractDelimitedJson(rawResponse) {
  if (typeof rawResponse !== "string" || rawResponse.trim() === "") {
    throw new Error("raw response must be a non-empty string");
  }

  const beginIndex = rawResponse.indexOf(MATRIX_RESEARCH_BEGIN_SENTINEL);
  const endIndex = rawResponse.indexOf(
    MATRIX_RESEARCH_END_SENTINEL,
    beginIndex + MATRIX_RESEARCH_BEGIN_SENTINEL.length,
  );

  if (beginIndex === -1 || endIndex === -1) {
    throw new Error(
      `Response must include ${MATRIX_RESEARCH_BEGIN_SENTINEL} and ${MATRIX_RESEARCH_END_SENTINEL} sentinels`,
    );
  }

  if (
    rawResponse.indexOf(
      MATRIX_RESEARCH_BEGIN_SENTINEL,
      beginIndex + MATRIX_RESEARCH_BEGIN_SENTINEL.length,
    ) !== -1 ||
    rawResponse.indexOf(
      MATRIX_RESEARCH_END_SENTINEL,
      endIndex + MATRIX_RESEARCH_END_SENTINEL.length,
    ) !== -1
  ) {
    throw new Error(
      "Response must contain exactly one sentinel-delimited answer",
    );
  }

  return rawResponse
    .slice(beginIndex + MATRIX_RESEARCH_BEGIN_SENTINEL.length, endIndex)
    .trim();
}

function parseDelimitedPayload(rawResponse) {
  const jsonText = extractDelimitedJson(rawResponse);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Invalid matrix research JSON: ${error.message}`);
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

function normalizeAnswer(answer, selectedTarget) {
  const normalizedAnswer = assertPlainObject(answer, "answer");

  assertAllowedKeys(
    normalizedAnswer,
    [
      "proposedStatus",
      "proposedValue",
      "sourceUrl",
      "sourceTitle",
      "accessedDate",
      "auditQuote",
      "confidence",
    ],
    "answer",
  );

  const proposedStatus = normalizeProposedStatus(
    normalizedAnswer.proposedStatus,
  );
  const proposedValue = validateProposedValue(
    normalizedAnswer.proposedValue,
    proposedStatus,
    selectedTarget.valueType,
  );
  const sourceUrl = assertHttpUrl(normalizedAnswer.sourceUrl, "sourceUrl");
  const sourceTitle = normalizeOptionalSourceTitle(
    normalizedAnswer.sourceTitle,
  );
  const accessedDate = assertIsoDate(
    normalizedAnswer.accessedDate,
    "accessedDate",
  );
  const auditQuote = validateAuditQuote(normalizedAnswer.auditQuote);
  const confidence = normalizeConfidence(normalizedAnswer.confidence);

  return {
    proposedStatus,
    proposedValue,
    sourceUrl,
    sourceTitle,
    accessedDate,
    auditQuote,
    confidence,
  };
}

export function getResearcherCommand(researcher) {
  const normalizedResearcher = String(researcher ?? "")
    .trim()
    .toLowerCase();
  const config = RESEARCHER_COMMANDS[normalizedResearcher];

  if (!config) {
    throw new Error(`Unknown matrix researcher "${String(researcher)}"`);
  }

  return {
    command: config.command,
    args: [...config.args],
  };
}

export function formatResearcherCommand(commandConfig) {
  return [commandConfig.command, ...commandConfig.args].join(" ");
}

export function buildMatrixResearchPrompt(target, options = {}) {
  const accessedDate = options.accessedDate ?? currentUtcDate();
  const mode = options.mode === "deeper-research" ? "deeper-research" : "initial";
  const previousAttemptCount =
    typeof options.previousAttemptCount === "number" &&
    Number.isFinite(options.previousAttemptCount) &&
    options.previousAttemptCount > 0
      ? Math.floor(options.previousAttemptCount)
      : 0;

  const deeperResearchClause =
    mode === "deeper-research"
      ? `

Deeper-research retry context:
- This is a deeper-research retry of a previously unresolved fact. ${
          previousAttemptCount > 0
            ? `There have already been ${previousAttemptCount} earlier attempt(s) that ended in needs-deeper-research.`
            : "Earlier attempts ended in needs-deeper-research."
        }
- The previous attempt did not yield a verifiable answer at the standard source-quality bar. You must raise the bar this time.
- Class 6 (reputable third-party documentation as fallback) is forbidden in deeper-research mode. Do not use third-party fallback sources; only classes 1–5 are allowed.
- If no source from classes 1–5 is openable AND quotable, return needs-deeper-research with proposedValue null — do not downgrade to third-party fallback.`
      : "";

  const sourcePolicy =
    mode === "deeper-research"
      ? `Source-quality policy (deeper-research mode):
- Walk the preferred-source list in order. Stop at the first class (1 through 5) where you can open a page AND copy a short audit quote that directly supports the proposed value.
- Class 6 reputable-third-party fallback is not allowed in deeper-research mode — do not use it.
- Do not invent a value and do not pick a source from outside classes 1–5; if no source from any allowed class qualifies, return needs-deeper-research with proposedValue null.`
      : `Source-quality policy:
- Walk the preferred-source list in order. Stop at the first class where you can open a page AND copy a short audit quote that directly supports the proposed value.
- Do not invent a value and do not pick a source from outside the preferred classes; if no source from any preferred class qualifies, return needs-deeper-research with proposedValue null.`;

  return `You are researching one selected European Alternatives matrix fact.

Non-negotiable scope:
- One invocation answers one matrix fact only.
- Do not answer any other category, entry, product, or criterion.
- If evidence is unavailable or every useful source is inaccessible, do not invent a value and do not mark the fact as verified.${deeperResearchClause}

Selected fact:
- factId: ${target.factId}
- categoryId: ${target.categoryId}
- categoryName: ${target.categoryName ?? ""}
- entrySlug: ${target.entrySlug}
- entryName: ${target.entryName ?? ""}
- criterionKey: ${target.criterionKey}
- criterionLabel: ${target.criterionLabel ?? ""}
- valueType: ${target.valueType}

Evidence requirements:
- Open an accessible source page for the selected fact. If the first source is inaccessible, find another accessible source.
- Use exactly one source URL for the answer.
- Include the source title when available.
- Use accessed date ${accessedDate}.
- Include one short audit quote copied from the source. The audit quote is for verification only, not public UI copy.
- Include confidence as one of high, medium, or low.

Preferred sources, in priority order:
1. Official docs / official app pages on the project's own domain.
2. The project's source repository (README, SECURITY, docs/ directory, release notes).
3. Security whitepapers published by the project or an audited reviewer.
4. Standards documents (RFC, ISO, IETF, W3C, EU regulations).
5. Audited public documentation (third-party audits, transparency reports).
6. Reputable third-party documentation only as a fallback when no source from classes 1–5 is openable and quotable.

${sourcePolicy}

Return only this machine-readable JSON inside the fixed sentinels. Do not add any other JSON block.

${MATRIX_RESEARCH_BEGIN_SENTINEL}
{
  "target": {
    "factId": ${JSON.stringify(target.factId)},
    "categoryId": ${JSON.stringify(target.categoryId)},
    "entrySlug": ${JSON.stringify(target.entrySlug)},
    "criterionKey": ${JSON.stringify(target.criterionKey)}
  },
  "answer": {
    "proposedStatus": "verified",
    "proposedValue": null,
    "sourceUrl": "https://example.test/source",
    "sourceTitle": "Source title",
    "accessedDate": ${JSON.stringify(accessedDate)},
    "auditQuote": "Short quote from the source.",
    "confidence": "medium"
  }
}
${MATRIX_RESEARCH_END_SENTINEL}

For no evidence or inaccessible-source findings, set proposedStatus to "needs-deeper-research" and proposedValue to null.`;
}

export function parseMatrixResearchResponse(rawResponse, target, options) {
  const payload = assertPlainObject(
    parseDelimitedPayload(rawResponse),
    "matrix research payload",
  );

  if ("answers" in payload || "facts" in payload || "sources" in payload) {
    throw new Error(
      "Response must describe one fact only; plural answers, facts, or sources are not allowed",
    );
  }

  assertAllowedKeys(payload, ["target", "answer"], "matrix research payload");

  if (!("target" in payload) || !("answer" in payload)) {
    throw new Error("Response must include exactly one target and one answer");
  }

  validateTarget(payload.target, target);

  const answer = normalizeAnswer(payload.answer, target);
  const attemptStatus =
    answer.proposedStatus === VERIFIED_STATUS
      ? "needs-verification"
      : NEEDS_DEEPER_RESEARCH_STATUS;

  return {
    factId: target.factId,
    agent: assertNonEmptyString(options?.agent, "agent"),
    model: options?.model ?? null,
    command: options?.command ?? null,
    proposedStatus: answer.proposedStatus,
    proposedValue: answer.proposedValue,
    sourceUrl: answer.sourceUrl,
    sourceTitle: answer.sourceTitle,
    accessedDate: answer.accessedDate,
    auditQuote: answer.auditQuote,
    confidence: answer.confidence,
    status: attemptStatus,
    rawResponse,
  };
}
