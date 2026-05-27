#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/vet-deep-research-extract-codex-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/vet-deep-research-extract-codex.sh --document-file <path> --entry-file <path> [options]
  scripts/vet-deep-research-extract-codex.sh --document-file <path> --entry-json <json> [options]
  scripts/vet-deep-research-extract-codex.sh --help

Stage-2 codex-only trust-scoring evidence extractor for the European
Alternatives catalog deep-research pipeline. Reads one deep-research
Markdown document plus the matched catalog entry, delegates the extractor
invocation to the runner (which spawns codex), and emits a validated
extraction payload on stdout. No DB writes, no URL fetches, no truth
decisions — those belong to later pipeline stages.

Options:
  --document-file <path>          Path to a deep-research Markdown document.
  --entry-file <path>             Path to a JSON file describing the matched entry.
  --entry-json <json>             Inline JSON for the matched entry.
  --mock-response-file <path>     Read extractor output from a file (test seam).
  --accessed-date <YYYY-MM-DD>    Accessed date for this extraction run.
  --dry-run                       Tag the emitted payload as dry-run.
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: provide --document-file and an entry source" >&2
    exit 64
fi

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
        --document-file|--entry-file|--entry-json|--mock-response-file|--accessed-date)
            if [[ "$#" -lt 2 ]]; then
                echo "error: $1 requires a value" >&2
                exit 64
            fi
            ARGS+=("$1" "$2")
            shift 2
            ;;
        --document-file=*|--entry-file=*|--entry-json=*|--mock-response-file=*|--accessed-date=*)
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

cd "$REPO_ROOT"
exec node "$RUNNER" "${ARGS[@]}"
