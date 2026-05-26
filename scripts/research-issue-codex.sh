#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNNER="$SCRIPT_DIR/research-issue-codex-run.mjs"

usage() {
    cat <<'USAGE'
Usage:
  scripts/research-issue-codex.sh <issue-number> [--dry-run] [--repo <owner/name>]
  scripts/research-issue-codex.sh --issue-number <n> [--dry-run] [--repo <owner/name>]
  scripts/research-issue-codex.sh --issue-file <path> [--dry-run]
  scripts/research-issue-codex.sh --help

Single-issue Codex-only intake classifier for the European Alternatives catalog
suggestion pipeline. Fetches one GitHub issue, invokes codex exec to classify
it into one of three actions (new_alternative, catalog_fact_correction,
unsupported_or_unclear), and emits validated JSON on stdout.

Environment:
  EUROALT_REPO  Override the source repository (default TheMorpheus407/european-alternatives).
USAGE
}

if [[ "$#" -eq 0 ]]; then
    usage >&2
    echo "error: provide an issue number or --issue-file/--issue-json/--issue-number" >&2
    exit 64
fi

REPO="${EUROALT_REPO:-TheMorpheus407/european-alternatives}"
ARGS=()
HAS_ISSUE_SOURCE=0

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
        --issue-number|--issue-file|--issue-json|--mock-response-file)
            if [[ "$#" -lt 2 ]]; then
                echo "error: $1 requires a value" >&2
                exit 64
            fi
            ARGS+=("$1" "$2")
            if [[ "$1" == "--issue-number" || "$1" == "--issue-file" || "$1" == "--issue-json" ]]; then
                HAS_ISSUE_SOURCE=1
            fi
            shift 2
            ;;
        --issue-number=*|--issue-file=*|--issue-json=*|--mock-response-file=*)
            ARGS+=("$1")
            case "$1" in
                --issue-number=*|--issue-file=*|--issue-json=*)
                    HAS_ISSUE_SOURCE=1
                    ;;
            esac
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
            if [[ "$HAS_ISSUE_SOURCE" -eq 0 && "$1" =~ ^[0-9]+$ ]]; then
                ARGS+=("--issue-number" "$1")
                HAS_ISSUE_SOURCE=1
                shift
            else
                echo "error: unexpected positional argument $1" >&2
                exit 64
            fi
            ;;
    esac
done

if [[ "$HAS_ISSUE_SOURCE" -eq 0 ]]; then
    echo "error: provide an issue source via --issue-file, --issue-json, or --issue-number" >&2
    exit 64
fi

for tool in node; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "error: missing required tool: $tool" >&2
        exit 1
    fi
done

ARGS+=("--repo" "$REPO")

cd "$REPO_ROOT"
exec node "$RUNNER" "${ARGS[@]}"
