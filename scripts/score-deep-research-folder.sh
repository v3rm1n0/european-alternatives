#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/score-deep-research-folder-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/score-deep-research-folder.sh \
    --input-dir <path> \
    --catalog-snapshot-file <path> \
    --api-base-url <url> \
    --output-dir <path> \
    [--entry <slug>] [--limit <n>] \
    [--dry-run] [--continue-on-error] [--replace-existing] \
    [--accessed-date YYYY-MM-DD] [--php <bin>]
  scripts/score-deep-research-folder.sh --help

Top-level autonomous batch runner for the European Alternatives deep-research
trust-scoring pipeline. Walks a folder of deep-research Markdown documents
and processes each sequentially through the established five-stage pipeline:

  1. discover & match     (vet-deep-research-codex.sh)
  2. codex extraction     (vet-deep-research-extract-codex.sh)
  3. codex verification   (vet-deep-research-verify-codex.sh)
  4. worksheet generation (vet-deep-research-worksheet.sh)
  5. transactional DB write + API post-check
                          (apply-deep-research-scoring-run.mjs)

Per-document artifacts (match.json, entry.json, extraction.json,
verified-action.json, worksheet-meta.json, apply-outcome.json, status.json)
are written under <output-dir>/<entrySlug>/ and a final summary.json is
written to <output-dir>/summary.json.

Options:
  --input-dir <path>              Folder of deep-research Markdown documents.
  --catalog-snapshot-file <path>  Pre-fetched catalog snapshot for stage 1.
  --api-base-url <url>            API base URL for the stage-5 post-check.
  --output-dir <path>             Per-batch artifact root.
  --entry <slug>                  Restrict processing to the single document
                                  whose stage-1 match resolves to this slug.
  --limit <n>                     Cap the number of processed docs after
                                  matching (sorted by filename).
  --dry-run                       Propagated to every stage; no DB writes.
  --continue-on-error             Do not abort the batch on the first
                                  failure; finish all docs and report.
  --replace-existing              Forwarded to stage 5 only; re-score an
                                  already-scored entry.
  --accessed-date YYYY-MM-DD      Forwarded to stages 2 and 3.
  --php <bin>                     Forwarded to stage 5 wrapper.
  -h, --help                      Show this help.

Exit codes:
  0   all matched docs reached ready (or were intentionally skipped)
  1   one or more docs failed (only reachable with --continue-on-error)
  64  invalid CLI usage
  65  pre-flight failed (input dir unreadable, snapshot unreadable)
  <n> with --continue-on-error off, the first failing doc's exit code is
      propagated verbatim.

Environment overrides (test seams — extend the established naming pattern):
  EUROALT_VET_DEEP_RESEARCH_CMD            stage 1 (discover & match)
  EUROALT_VET_DEEP_RESEARCH_EXTRACT_CMD    stage 2 (codex extraction)
  EUROALT_VET_DEEP_RESEARCH_VERIFY_CMD     stage 3 (codex verification)
  EUROALT_VET_DEEP_RESEARCH_WORKSHEET_CMD  stage 4 (worksheet generation)
  EUROALT_APPLY_DEEP_RESEARCH_SCORING_CMD  stage 5 (DB write + post-check)
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: --input-dir is required" >&2
    exit 64
fi

case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
esac

for tool in node; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "error: missing required tool: $tool" >&2
        exit 1
    fi
done

cd "$REPO_ROOT"
exec node "$RUNNER" "$@"
