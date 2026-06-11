#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/research-fact-codex-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/research-fact-codex.sh --issue-file <path> --classification-file <path> [options]
  scripts/research-fact-codex.sh --issue-json <json> --classification-json <json> [options]
  scripts/research-fact-codex.sh --help

Stage-2 Codex-only web researcher for the European Alternatives catalog
suggestion pipeline. Reads the issue and the stage-1 classification, invokes
codex exec with a basic-research prompt grounded in the catalog snapshot, and
emits a validated research payload on stdout. No DB writes, no GitHub
mutations.

Options:
  --issue-file <path>             Issue JSON (number, title, body, comments).
  --issue-json <json>             Inline issue JSON.
  --issue-number <n>              Fetch issue via gh from --repo.
  --classification-file <path>    Stage-1 classification JSON.
  --classification-json <json>    Inline classification JSON.
  --catalog-snapshot-file <path>  Pre-fetched catalog snapshot.
  --previous-research-file <path> Previous research JSON for a retry attempt.
  --verification-feedback-file <path> Verifier feedback JSON for a retry attempt.
  --mock-response-file <path>     Read researcher output from a file (test seam).
  --accessed-date <YYYY-MM-DD>    Accessed date for the research run.
  --dry-run                       Tag the emitted payload as dry-run.
  --repo <owner/name>             Source repo for --issue-number.
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: provide an issue source and a classification source" >&2
    exit 64
fi

REPO="${EUROALT_REPO:-TheMorpheus407/european-alternatives}"
ARGS=()

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        --dry-run)
            ARGS+=("--dry-run")
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
        --issue-number|--issue-file|--issue-json|--classification-file|--classification-json|--catalog-snapshot-file|--previous-research-file|--verification-feedback-file|--mock-response-file|--accessed-date)
            if [[ "$#" -lt 2 ]]; then
                echo "error: $1 requires a value" >&2
                exit 64
            fi
            ARGS+=("$1" "$2")
            shift 2
            ;;
        --issue-number=*|--issue-file=*|--issue-json=*|--classification-file=*|--classification-json=*|--catalog-snapshot-file=*|--previous-research-file=*|--verification-feedback-file=*|--mock-response-file=*|--accessed-date=*)
            ARGS+=("$1")
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
            echo "error: unexpected positional argument $1" >&2
            exit 64
            ;;
    esac
done

for tool in node; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "error: missing required tool: $tool" >&2
        exit 1
    fi
done

ARGS+=("--repo" "$REPO")

cd "$REPO_ROOT"
exec node "$RUNNER" "${ARGS[@]}"
