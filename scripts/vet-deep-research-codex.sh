#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/vet-deep-research-codex-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/vet-deep-research-codex.sh --input-dir <path> [options]
  scripts/vet-deep-research-codex.sh --help

Stage-1 deep-research document discovery and catalog entry matching. Walks
the input folder, matches each Markdown document to exactly one active
catalog alternative by filename slug (with optional YAML front-matter
override and body-URL host corroboration), and emits a JSON summary on
stdout. No Codex calls, no DB writes, no GitHub mutations.

Options:
  --input-dir <path>              Directory containing deep-research
                                  Markdown documents (required).
  --catalog-snapshot-file <path>  Pre-fetched catalog snapshot file.
  --entry <slug>                  Force discovered documents to the given
                                  catalog entry slug.
  --dry-run                       Tag the emitted JSON output as dry-run.
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: --input-dir is required" >&2
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
        --input-dir|--catalog-snapshot-file|--entry)
            if [[ "$#" -lt 2 ]]; then
                echo "error: $1 requires a value" >&2
                exit 64
            fi
            ARGS+=("$1" "$2")
            shift 2
            ;;
        --input-dir=*|--catalog-snapshot-file=*|--entry=*)
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
