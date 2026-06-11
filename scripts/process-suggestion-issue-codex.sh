#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
    cat <<'USAGE'
Usage:
  scripts/process-suggestion-issue-codex.sh <issue-number> [--dry-run] [--repo <owner/name>] [--max-verification-attempts <n>]
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
       - new_alternative
           a. research-fact-codex.sh
           b. verify-fact-codex.sh
           c. insert-verified-alternative.sh
           d. finalize-issue-codex.sh
       - unsupported_or_unclear   → exit non-zero (untouched)

Stage artifacts and a `result.json` are written under
`tmp/issues/<issue-number>/`. The batch runner reads `result.json` to
surface classification and write outcome in its own log stream.

`--dry-run` propagates to every stage. With `--dry-run`, no GitHub
mutations and no DB writes occur.

`--max-verification-attempts` caps total research/verify attempts. The
default is EUROALT_MAX_VERIFICATION_ATTEMPTS or 2.

Environment overrides (test seams):
  EUROALT_REPO                  Default --repo target.
  EUROALT_RESEARCH_ISSUE_CMD    Override stage-1 classifier command.
  EUROALT_CATALOG_SNAPSHOT_CMD  Override catalog snapshot command.
  EUROALT_RESEARCH_FACT_CMD     Override stage-2 researcher command.
  EUROALT_VERIFY_FACT_CMD       Override stage-3 verifier command.
  EUROALT_APPLY_VERIFIED_CMD    Override stage-4 apply command (fact-correction).
  EUROALT_APPLY_NEW_ALT_CMD     Override stage-4 apply command (new_alternative).
  EUROALT_FINALIZE_ISSUE_CMD    Override stage-5 finalizer command.
  EUROALT_MAX_VERIFICATION_ATTEMPTS
                                Default total verification attempts.
USAGE
}

REPO="${EUROALT_REPO:-TheMorpheus407/european-alternatives}"
DRY_RUN=0
ISSUE_NUMBER=""
MAX_VERIFICATION_ATTEMPTS="${EUROALT_MAX_VERIFICATION_ATTEMPTS:-2}"

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
        --max-verification-attempts)
            if [[ "$#" -lt 2 ]]; then
                echo "error: --max-verification-attempts requires a value" >&2
                exit 64
            fi
            MAX_VERIFICATION_ATTEMPTS="$2"
            shift 2
            ;;
        --max-verification-attempts=*)
            MAX_VERIFICATION_ATTEMPTS="${1#--max-verification-attempts=}"
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

if [[ ! "$MAX_VERIFICATION_ATTEMPTS" =~ ^[1-9][0-9]*$ ]]; then
    echo "error: --max-verification-attempts must be a positive integer" >&2
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
SNAPSHOT_FILE="$ISSUE_DIR/catalog-snapshot.json"

RESEARCH_ISSUE_CMD="${EUROALT_RESEARCH_ISSUE_CMD:-bash $SCRIPT_DIR/research-issue-codex.sh}"
CATALOG_SNAPSHOT_CMD="${EUROALT_CATALOG_SNAPSHOT_CMD:-node $SCRIPT_DIR/catalog-suggestion-snapshot.mjs}"
RESEARCH_FACT_CMD="${EUROALT_RESEARCH_FACT_CMD:-bash $SCRIPT_DIR/research-fact-codex.sh}"
VERIFY_FACT_CMD="${EUROALT_VERIFY_FACT_CMD:-bash $SCRIPT_DIR/verify-fact-codex.sh}"
APPLY_VERIFIED_CMD="${EUROALT_APPLY_VERIFIED_CMD:-php $SCRIPT_DIR/apply-verified-action.php}"
APPLY_NEW_ALT_CMD="${EUROALT_APPLY_NEW_ALT_CMD:-bash $SCRIPT_DIR/insert-verified-alternative.sh}"
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

# Snapshot -------------------------------------------------------------------
TARGET_ENTRY_SLUG="$(node -e '
  const fs = require("fs");
  const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const slug = typeof data.targetEntrySlug === "string" ? data.targetEntrySlug : "";
  process.stdout.write(slug);
' "$CLASSIFICATION_FILE")"

SNAPSHOT_ARGS=()
if [[ "$CLASSIFICATION" == "catalog_fact_correction" && -n "$TARGET_ENTRY_SLUG" ]]; then
    SNAPSHOT_ARGS=(--entry-slug "$TARGET_ENTRY_SLUG")
fi

echo "[issue #${ISSUE_NUMBER}] stage 1b: catalog-snapshot"
set +e
# shellcheck disable=SC2086
$CATALOG_SNAPSHOT_CMD "${SNAPSHOT_ARGS[@]}" > "$SNAPSHOT_FILE" 2> "$ISSUE_DIR/catalog-snapshot.stderr.log"
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
    echo "[issue #${ISSUE_NUMBER}] catalog-snapshot failed rc=${rc}; continuing with empty snapshot" >&2
    cat "$ISSUE_DIR/catalog-snapshot.stderr.log" >&2 || true
    printf '{}\n' > "$SNAPSHOT_FILE"
fi

# Stage 2/3: research and verify with verifier-feedback retry ----------------
ATTEMPT=1
PREVIOUS_RESEARCH_FILE=""
PREVIOUS_FEEDBACK_FILE=""
VERIFICATION_SUCCEEDED=0

while [[ "$ATTEMPT" -le "$MAX_VERIFICATION_ATTEMPTS" ]]; do
    ATTEMPT_RESEARCH_FILE="$ISSUE_DIR/research-${ATTEMPT}.json"
    ATTEMPT_RESEARCH_STDERR="$ISSUE_DIR/research-fact-${ATTEMPT}.stderr.log"
    ATTEMPT_VERIFIED_FILE="$ISSUE_DIR/verified-action-${ATTEMPT}.json"
    ATTEMPT_VERIFY_STDERR="$ISSUE_DIR/verify-fact-${ATTEMPT}.stderr.log"
    ATTEMPT_FEEDBACK_FILE="$ISSUE_DIR/verification-feedback-${ATTEMPT}.json"

    RESEARCH_ARGS=(
        --issue-number "$ISSUE_NUMBER"
        --classification-file "$CLASSIFICATION_FILE"
        --catalog-snapshot-file "$SNAPSHOT_FILE"
        "${DRY_RUN_FLAG[@]}"
        --repo "$REPO"
    )

    if [[ "$ATTEMPT" -gt 1 ]]; then
        RESEARCH_ARGS+=(
            --previous-research-file "$PREVIOUS_RESEARCH_FILE"
            --verification-feedback-file "$PREVIOUS_FEEDBACK_FILE"
        )
    fi

    echo "[issue #${ISSUE_NUMBER}] stage 2: research-fact attempt ${ATTEMPT}/${MAX_VERIFICATION_ATTEMPTS}"
    set +e
    # shellcheck disable=SC2086
    $RESEARCH_FACT_CMD "${RESEARCH_ARGS[@]}" > "$ATTEMPT_RESEARCH_FILE" 2> "$ATTEMPT_RESEARCH_STDERR"
    rc=$?
    set -e
    cp "$ATTEMPT_RESEARCH_STDERR" "$ISSUE_DIR/research-fact.stderr.log" 2>/dev/null || true
    if [[ "$rc" -ne 0 ]]; then
        echo "[issue #${ISSUE_NUMBER}] research-fact failed rc=${rc}" >&2
        cat "$ATTEMPT_RESEARCH_STDERR" >&2 || true
        write_result "$CLASSIFICATION" "no" "research_failed_rc_${rc}"
        exit "$rc"
    fi
    cp "$ATTEMPT_RESEARCH_FILE" "$RESEARCH_FILE"

    rm -f "$ATTEMPT_FEEDBACK_FILE"

    echo "[issue #${ISSUE_NUMBER}] stage 3: verify-fact attempt ${ATTEMPT}/${MAX_VERIFICATION_ATTEMPTS}"
    set +e
    # shellcheck disable=SC2086
    $VERIFY_FACT_CMD --issue-number "$ISSUE_NUMBER" --classification-file "$CLASSIFICATION_FILE" --research-file "$ATTEMPT_RESEARCH_FILE" "${DRY_RUN_FLAG[@]}" --repo "$REPO" --feedback-output-file "$ATTEMPT_FEEDBACK_FILE" > "$ATTEMPT_VERIFIED_FILE" 2> "$ATTEMPT_VERIFY_STDERR"
    rc=$?
    set -e
    cp "$ATTEMPT_VERIFY_STDERR" "$ISSUE_DIR/verify-fact.stderr.log" 2>/dev/null || true
    if [[ "$rc" -eq 0 ]]; then
        cp "$ATTEMPT_VERIFIED_FILE" "$VERIFIED_FILE"
        VERIFICATION_SUCCEEDED=1
        break
    fi

    echo "[issue #${ISSUE_NUMBER}] verify-fact failed rc=${rc}" >&2
    cat "$ATTEMPT_VERIFY_STDERR" >&2 || true

    if [[ -s "$ATTEMPT_FEEDBACK_FILE" ]]; then
        if [[ "$ATTEMPT" -lt "$MAX_VERIFICATION_ATTEMPTS" ]]; then
            PREVIOUS_RESEARCH_FILE="$ATTEMPT_RESEARCH_FILE"
            PREVIOUS_FEEDBACK_FILE="$ATTEMPT_FEEDBACK_FILE"
            ATTEMPT=$((ATTEMPT + 1))
            continue
        fi

        write_result "$CLASSIFICATION" "no" "verification_retries_exhausted"
        exit 65
    fi

    write_result "$CLASSIFICATION" "no" "verify_failed_rc_${rc}"
    exit "$rc"
done

if [[ "$VERIFICATION_SUCCEEDED" -ne 1 ]]; then
    write_result "$CLASSIFICATION" "no" "verification_retries_exhausted"
    exit 65
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
    if [[ "$DRY_RUN" -eq 1 ]]; then
        write_result "$CLASSIFICATION" "no" "finalize_failed_rc_${rc}"
    else
        write_result "$CLASSIFICATION" "yes" "finalize_failed_rc_${rc}"
    fi
    exit "$rc"
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
    write_result "$CLASSIFICATION" "no" "dry_run_applied"
else
    write_result "$CLASSIFICATION" "yes" "applied"
fi
echo "[issue #${ISSUE_NUMBER}] done"
exit 0
