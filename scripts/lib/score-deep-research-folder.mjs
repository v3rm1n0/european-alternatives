/**
 * Pure helpers for the deep-research folder batch orchestrator.
 *
 * Kept dependency-free so the orchestrator's classification + summary
 * aggregation logic is unit-testable without spawning any subprocess.
 */

export const APPLY_EXIT_READY = 0;
export const APPLY_EXIT_ALREADY_SCORED = 2;
export const APPLY_EXIT_POST_CHECK_FAILED = 3;

/**
 * Classify a stage-5 (apply) exit code into one of: ready, skipped, failed.
 *
 * - 0 → ready
 * - 2 → skipped (intentional refusal because the entry was already scored
 *        and --replace-existing was not passed; not a failure)
 * - anything else → failed (covers 1 / 3 / 65 / other PHP rc)
 */
export function classifyApplyExit(exitCode) {
  if (exitCode === APPLY_EXIT_READY) {
    return "ready";
  }
  if (exitCode === APPLY_EXIT_ALREADY_SCORED) {
    return "skipped";
  }
  return "failed";
}

/**
 * Aggregate per-document records into the final summary counts.
 *
 * `documents` is an array of records each containing at least
 * `{ status: "ready" | "skipped" | "failed" }`.
 */
export function summarizeDocuments(documents) {
  const counts = { processed: 0, ready: 0, skipped: 0, failed: 0 };

  for (const doc of documents) {
    counts.processed += 1;
    if (doc.status === "ready") {
      counts.ready += 1;
    } else if (doc.status === "skipped") {
      counts.skipped += 1;
    } else if (doc.status === "failed") {
      counts.failed += 1;
    }
  }

  return counts;
}

/**
 * Filter the stage-1 matches array against orchestrator-level controls.
 *
 * - `--entry <slug>` keeps only the single matching record (if present).
 * - `--limit <n>` caps the result to the first n entries by sorted
 *   documentPath order (stage 1 already sorts, but we re-sort here for
 *   defence-in-depth so behaviour is deterministic even if a future stage
 *   change drops the guarantee).
 */
export function filterMatches(matches, { entrySlug, limit }) {
  const sorted = [...matches].sort((a, b) => {
    const pa = typeof a.documentPath === "string" ? a.documentPath : "";
    const pb = typeof b.documentPath === "string" ? b.documentPath : "";
    return pa.localeCompare(pb);
  });

  let filtered = sorted;
  if (entrySlug !== null && entrySlug !== undefined && entrySlug !== "") {
    filtered = filtered.filter((m) => m.entrySlug === entrySlug);
  }

  if (typeof limit === "number" && Number.isFinite(limit) && limit >= 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}
