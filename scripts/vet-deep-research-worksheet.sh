#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/vet-deep-research-worksheet-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/vet-deep-research-worksheet.sh --verified-action-file <path> [options]
  scripts/vet-deep-research-worksheet.sh --verified-action-json <json> [options]
  scripts/vet-deep-research-worksheet.sh --help

Stage-4 worksheet generator for the European Alternatives catalog deep-research
scoring pipeline. Consumes the verified scoring action handoff from stage-3 and
writes one Markdown worksheet per catalog entry under tmp/scoring-worksheets/
by default. Emits the worksheet path on stdout for stage-5 (DB write). No DB
writes, no codex calls, no network access, no stored trust-score values.

Options:
  --verified-action-file <path>   Stage-3 verified scoring action JSON.
  --verified-action-json <json>   Inline stage-3 verified scoring action JSON.
  --output-dir <path>             Worksheet output directory (default: tmp/scoring-worksheets).
  --dry-run                       Print intended path + summary; write nothing.
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: provide a verified scoring action source" >&2
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
        --verified-action-file|--verified-action-json|--output-dir)
            if [[ "$#" -lt 2 ]]; then
                echo "error: $1 requires a value" >&2
                exit 64
            fi
            ARGS+=("$1" "$2")
            shift 2
            ;;
        --verified-action-file=*|--verified-action-json=*|--output-dir=*)
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
