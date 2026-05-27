import { BANNED_VERIFY_KEYS } from "./verify-fact-codex.mjs";

export const BANNED_INSERT_KEYS = Object.freeze(
  Array.from(
    new Set([
      ...BANNED_VERIFY_KEYS,
      "trustScore",
      "trust_score",
      "trustScoreStatus",
      "trust_score_status",
      "reservations",
      "positive_signals",
      "positiveSignals",
      "scoring_metadata",
      "scoringMetadata",
    ]),
  ),
);

const ENVELOPE_METADATA_KEYS = Object.freeze([
  "issueNumber",
  "action",
  "dryRun",
  "accessedDate",
  "verifierEvidence",
  "newAlternative",
  "issue",
  "classification",
]);

const NEW_ALTERNATIVE_BODY_STRIP_KEYS = Object.freeze(["sources"]);

const FORCED_STATUS = "alternative";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function findBannedKeyRecursive(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findBannedKeyRecursive(item);

      if (found !== null) {
        return found;
      }
    }
    return null;
  }

  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      if (BANNED_INSERT_KEYS.includes(key)) {
        return key;
      }
    }
    for (const child of Object.values(value)) {
      const found = findBannedKeyRecursive(child);

      if (found !== null) {
        return found;
      }
    }
  }

  return null;
}

export function assertNoBannedKeys(value) {
  const banned = findBannedKeyRecursive(value);

  if (banned !== null) {
    throw new Error(
      `banned key in verified_action payload: ${banned} (insert step must not emit trust score, reservations, positive signals, or scoring metadata)`,
    );
  }
}

export function buildAdminPayload(verifiedAction) {
  if (!isPlainObject(verifiedAction)) {
    throw new Error("verified_action must be a JSON object");
  }

  if (verifiedAction.action !== "new_alternative") {
    throw new Error(
      `verified_action.action must be "new_alternative" (got ${JSON.stringify(verifiedAction.action)})`,
    );
  }

  const newAlternative = verifiedAction.newAlternative;

  if (!isPlainObject(newAlternative)) {
    throw new Error("verified_action.newAlternative must be a JSON object");
  }

  const verifierEvidence = verifiedAction.verifierEvidence;

  if (!isPlainObject(verifierEvidence) || Object.keys(verifierEvidence).length === 0) {
    throw new Error(
      "verified_action.verifierEvidence must be a non-empty JSON object",
    );
  }

  assertNoBannedKeys(verifiedAction);

  const payload = {};

  for (const [key, value] of Object.entries(newAlternative)) {
    if (NEW_ALTERNATIVE_BODY_STRIP_KEYS.includes(key)) {
      continue;
    }
    if (ENVELOPE_METADATA_KEYS.includes(key)) {
      continue;
    }
    payload[key] = value;
  }

  payload.status = FORCED_STATUS;

  return payload;
}
