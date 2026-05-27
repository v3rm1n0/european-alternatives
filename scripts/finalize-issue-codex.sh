#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/finalize-issue-codex-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/finalize-issue-codex.sh --verified-action-file <path> --mutation-outcome-file <path> [--repo <owner/name>] [--dry-run]
  scripts/finalize-issue-codex.sh --help

Stage-5 finalizer for the European Alternatives Codex catalog suggestion
pipeline. Reads the stage-3 verified action and the stage-4 mutation
outcome; on success, posts one source-backed comment on the originating
GitHub issue and then closes it. Fails closed without commenting or
closing on any earlier pipeline error.

Options:
  --verified-action-file <path>    Stage-3 verified_action JSON (required).
  --mutation-outcome-file <path>   Stage-4 mutation outcome JSON (required).
  --repo <owner/name>              GitHub repo (default from EUROALT_REPO
                                   or TheMorpheus407/european-alternatives).
  --dry-run                        Render the would-be comment as a JSON
                                   envelope on stdout; never invoke gh.
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: provide --verified-action-file and --mutation-outcome-file" >&2
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
        --verified-action-file|--mutation-outcome-file)
            if [[ "$#" -lt 2 ]]; then
                echo "error: $1 requires a value" >&2
                exit 64
            fi
            ARGS+=("$1" "$2")
            shift 2
            ;;
        --verified-action-file=*|--mutation-outcome-file=*)
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
