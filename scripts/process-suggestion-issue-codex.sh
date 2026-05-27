#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
    cat <<'USAGE'
Usage:
  scripts/process-suggestion-issue-codex.sh <issue-number> [--dry-run] [--repo <owner/name>]
  scripts/process-suggestion-issue-codex.sh --help

Single-issue orchestrator for the European Alternatives Codex catalog
suggestion pipeline. Chains the per-stage scripts sequentially:

  1. research-issue-codex.sh  (classifier)
  2. branch on action:
       - catalog_fact_correction
           a. research-fact-codex.sh
           b. verify-fact-codex.sh
           c. apply-verified-action.php
           d. finalize-issue-codex.sh
       - new_alternative          → exit non-zero (untouched)
       - unsupported_or_unclear   → exit non-zero (untouched)

Stage artifacts and a `result.json` are written under
`tmp/issues/<issue-number>/`. The batch runner reads `result.json` to
surface classification and write outcome in its own log stream.

`--dry-run` propagates to every stage. With `--dry-run`, no GitHub
mutations and no DB writes occur.

Environment overrides (test seams):
  EUROALT_REPO                  Default --repo target.
  EUROALT_RESEARCH_ISSUE_CMD    Override stage-1 classifier command.
  EUROALT_RESEARCH_FACT_CMD     Override stage-2 researcher command.
  EUROALT_VERIFY_FACT_CMD       Override stage-3 verifier command.
  EUROALT_APPLY_VERIFIED_CMD    Override stage-4 apply command (fact-correction).
  EUROALT_APPLY_NEW_ALT_CMD     Override stage-4 apply command (new_alternative);
                                if unset, new_alternative still exits 65 with
                                outcome skipped_not_automated (the default).
  EUROALT_FINALIZE_ISSUE_CMD    Override stage-5 finalizer command.
USAGE
}

REPO="${EUROALT_REPO:-TheMorpheus407/european-alternatives}"
DRY_RUN=0
ISSUE_NUMBER=""

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        --repo)
            if [[ "$#" -lt 2 ]]; then
                echo "error: --repo requires a value" >&2
                exit 64
            fi
            REPO="$2"
            shift 2
            ;;
        --repo=*)
            REPO="${1#--repo=}"
            shift
            ;;
        --)
            shift
            break
            ;;
        --*)
            echo "error: unknown option $1" >&2
            exit 64
            ;;
        *)
            if [[ -z "$ISSUE_NUMBER" && "$1" =~ ^[0-9]+$ ]]; then
                ISSUE_NUMBER="$1"
                shift
            else
                echo "error: unexpected positional argument $1" >&2
                exit 64
            fi
            ;;
    esac
done

if [[ -z "$ISSUE_NUMBER" ]]; then
    echo "error: provide an issue number" >&2
    exit 64
fi

cd "$REPO_ROOT"

ISSUE_DIR="tmp/issues/${ISSUE_NUMBER}"
mkdir -p "$ISSUE_DIR"

CLASSIFICATION_FILE="$ISSUE_DIR/classification.json"
RESEARCH_FILE="$ISSUE_DIR/research.json"
VERIFIED_FILE="$ISSUE_DIR/verified-action.json"
OUTCOME_FILE="$ISSUE_DIR/mutation-outcome.json"
RESULT_FILE="$ISSUE_DIR/result.json"

RESEARCH_ISSUE_CMD="${EUROALT_RESEARCH_ISSUE_CMD:-bash $SCRIPT_DIR/research-issue-codex.sh}"
RESEARCH_FACT_CMD="${EUROALT_RESEARCH_FACT_CMD:-bash $SCRIPT_DIR/research-fact-codex.sh}"
VERIFY_FACT_CMD="${EUROALT_VERIFY_FACT_CMD:-bash $SCRIPT_DIR/verify-fact-codex.sh}"
APPLY_VERIFIED_CMD="${EUROALT_APPLY_VERIFIED_CMD:-php $SCRIPT_DIR/apply-verified-action.php}"
APPLY_NEW_ALT_CMD="${EUROALT_APPLY_NEW_ALT_CMD:-}"
FINALIZE_ISSUE_CMD="${EUROALT_FINALIZE_ISSUE_CMD:-bash $SCRIPT_DIR/finalize-issue-codex.sh}"

DRY_RUN_FLAG=()
if [[ "$DRY_RUN" -eq 1 ]]; then
    DRY_RUN_FLAG=(--dry-run)
fi

write_result() {
    local classification="$1"
    local writes_applied="$2"
    local outcome="$3"
    node -e '
      const fs = require("fs");
      const [, file, classification, writesApplied, outcome, issueNumber, dryRun] = process.argv;
      const payload = {
        issueNumber: Number(issueNumber),
        classification,
        writes_applied: writesApplied === "yes",
        outcome,
        dryRun: dryRun === "1",
      };
      fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n");
    ' "$RESULT_FILE" "$classification" "$writes_applied" "$outcome" "$ISSUE_NUMBER" "$DRY_RUN"
}

# Stage 1: classify ----------------------------------------------------------
echo "[issue #${ISSUE_NUMBER}] stage 1: classify"
set +e
# shellcheck disable=SC2086
$RESEARCH_ISSUE_CMD "$ISSUE_NUMBER" "${DRY_RUN_FLAG[@]}" --repo "$REPO" > "$CLASSIFICATION_FILE" 2> "$ISSUE_DIR/classify.stderr.log"
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
    echo "[issue #${ISSUE_NUMBER}] classifier failed rc=${rc}" >&2
    cat "$ISSUE_DIR/classify.stderr.log" >&2 || true
    write_result "error" "no" "classifier_failed_rc_${rc}"
    exit "$rc"
fi

CLASSIFICATION="$(node -e '
  const fs = require("fs");
  const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const action = typeof data.action === "string" ? data.action : "";
  process.stdout.write(action);
' "$CLASSIFICATION_FILE")"

echo "[issue #${ISSUE_NUMBER}] classification=${CLASSIFICATION}"

case "$CLASSIFICATION" in
    catalog_fact_correction)
        ;;
    new_alternative)
        if [[ -z "$APPLY_NEW_ALT_CMD" ]]; then
            echo "[issue #${ISSUE_NUMBER}] new_alternative not yet automated; leaving issue untouched" >&2
            write_result "new_alternative" "no" "skipped_not_automated"
            exit 65
        fi
        ;;
    unsupported_or_unclear)
        echo "[issue #${ISSUE_NUMBER}] unsupported_or_unclear; leaving issue untouched" >&2
        write_result "unsupported_or_unclear" "no" "skipped_unsupported"
        exit 65
        ;;
    *)
        echo "[issue #${ISSUE_NUMBER}] unknown classification '${CLASSIFICATION}'" >&2
        write_result "unknown" "no" "skipped_unknown_classification"
        exit 65
        ;;
esac

# Stage 2: research ----------------------------------------------------------
echo "[issue #${ISSUE_NUMBER}] stage 2: research-fact"
set +e
# shellcheck disable=SC2086
$RESEARCH_FACT_CMD --issue-number "$ISSUE_NUMBER" --classification-file "$CLASSIFICATION_FILE" "${DRY_RUN_FLAG[@]}" --repo "$REPO" > "$RESEARCH_FILE" 2> "$ISSUE_DIR/research-fact.stderr.log"
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
    echo "[issue #${ISSUE_NUMBER}] research-fact failed rc=${rc}" >&2
    cat "$ISSUE_DIR/research-fact.stderr.log" >&2 || true
    write_result "$CLASSIFICATION" "no" "research_failed_rc_${rc}"
    exit "$rc"
fi

# Stage 3: verify ------------------------------------------------------------
echo "[issue #${ISSUE_NUMBER}] stage 3: verify-fact"
set +e
# shellcheck disable=SC2086
$VERIFY_FACT_CMD --issue-number "$ISSUE_NUMBER" --classification-file "$CLASSIFICATION_FILE" --research-file "$RESEARCH_FILE" "${DRY_RUN_FLAG[@]}" --repo "$REPO" > "$VERIFIED_FILE" 2> "$ISSUE_DIR/verify-fact.stderr.log"
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
    echo "[issue #${ISSUE_NUMBER}] verify-fact failed rc=${rc}" >&2
    cat "$ISSUE_DIR/verify-fact.stderr.log" >&2 || true
    write_result "$CLASSIFICATION" "no" "verify_failed_rc_${rc}"
    exit "$rc"
fi

# Stage 4: apply -------------------------------------------------------------
echo "[issue #${ISSUE_NUMBER}] stage 4: apply"
if [[ "$CLASSIFICATION" == "new_alternative" ]]; then
    APPLY_CMD="$APPLY_NEW_ALT_CMD"
else
    APPLY_CMD="$APPLY_VERIFIED_CMD"
fi
set +e
# shellcheck disable=SC2086
$APPLY_CMD --verified-action-file "$VERIFIED_FILE" "${DRY_RUN_FLAG[@]}" > "$OUTCOME_FILE" 2> "$ISSUE_DIR/apply.stderr.log"
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
    echo "[issue #${ISSUE_NUMBER}] apply failed rc=${rc}" >&2
    cat "$ISSUE_DIR/apply.stderr.log" >&2 || true
    write_result "$CLASSIFICATION" "no" "apply_failed_rc_${rc}"
    exit "$rc"
fi

# Stage 5: finalize ----------------------------------------------------------
echo "[issue #${ISSUE_NUMBER}] stage 5: finalize"
set +e
# shellcheck disable=SC2086
$FINALIZE_ISSUE_CMD --verified-action-file "$VERIFIED_FILE" --mutation-outcome-file "$OUTCOME_FILE" "${DRY_RUN_FLAG[@]}" --repo "$REPO" > "$ISSUE_DIR/finalize.stdout.log" 2> "$ISSUE_DIR/finalize.stderr.log"
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
    echo "[issue #${ISSUE_NUMBER}] finalize failed rc=${rc}" >&2
    cat "$ISSUE_DIR/finalize.stderr.log" >&2 || true
    write_result "$CLASSIFICATION" "yes" "finalize_failed_rc_${rc}"
    exit "$rc"
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
    write_result "$CLASSIFICATION" "no" "dry_run_applied"
else
    write_result "$CLASSIFICATION" "yes" "applied"
fi
echo "[issue #${ISSUE_NUMBER}] done"
exit 0
