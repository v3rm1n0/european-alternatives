#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/vet-deep-research-verify-codex-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/vet-deep-research-verify-codex.sh --extraction-file <path> --entry-file <path> [options]
  scripts/vet-deep-research-verify-codex.sh --extraction-json <json> --entry-json <json> [options]
  scripts/vet-deep-research-verify-codex.sh --help

Stage-3 codex-only independent source verifier for the European Alternatives
catalog deep-research scoring pipeline. Reads the stage-2 extraction and the
matched catalog entry, delegates the verifier invocation to the runner (which
spawns codex), and emits a validated verified_scoring_action handoff on stdout.
No DB writes, no GitHub mutations, no truth decisions outside the verifier's
own web research.

Options:
  --extraction-file <path>         Stage-2 extraction JSON.
  --extraction-json <json>         Inline stage-2 extraction JSON.
  --entry-file <path>              Matched catalog entry JSON.
  --entry-json <json>              Inline catalog entry JSON.
  --document-file <path>           Optional deep-research Markdown document.
  --mock-response-file <path>     Read verifier output from a file (test seam).
  --accessed-date <YYYY-MM-DD>     Accessed date for the verification run.
  --output-file <path>             Write the handoff JSON to disk in addition to stdout.
  --dry-run                        Tag the emitted handoff as dry-run.
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: provide an extraction source and an entry source" >&2
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
        --extraction-file|--extraction-json|--entry-file|--entry-json|--document-file|--mock-response-file|--accessed-date|--output-file)
            if [[ "$#" -lt 2 ]]; then
                echo "error: $1 requires a value" >&2
                exit 64
            fi
            ARGS+=("$1" "$2")
            shift 2
            ;;
        --extraction-file=*|--extraction-json=*|--entry-file=*|--entry-json=*|--document-file=*|--mock-response-file=*|--accessed-date=*|--output-file=*)
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
