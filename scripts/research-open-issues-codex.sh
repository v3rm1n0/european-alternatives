#!/usr/bin/env bash

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
    cat <<'USAGE'
Usage:
  scripts/research-open-issues-codex.sh [--dry-run] [--repo <owner/name>] [--limit <n>]
  scripts/research-open-issues-codex.sh --help

Sequential batch driver for the European Alternatives Codex catalog
suggestion pipeline. Queries open GitHub issues via `gh issue list`,
filters proposal / correction candidates client-side, deduplicates by
issue number, and invokes the single-issue orchestrator once per
selected issue, sequentially. Per-issue failures are logged and skipped;
the batch run continues.

Per-issue artifacts (stage outputs, stdout/stderr logs, `result.json`)
are written under `tmp/issues/<n>/`. A run-level summary is appended to
`tmp/research-open-issues-<timestamp>.log`.

Environment:
  EUROALT_REPO                Default --repo target.
  EUROALT_PROCESS_ISSUE_CMD   Override the per-issue command
                              (default: bash scripts/process-suggestion-issue-codex.sh).

Options:
  --dry-run    Propagate --dry-run to every per-issue invocation. The
               batch driver itself never invokes `gh issue comment` or
               `gh issue close`.
  --repo       GitHub repo (default from EUROALT_REPO or
               TheMorpheus407/european-alternatives).
  --limit      Maximum issues returned by `gh issue list` (default 500).
USAGE
}

REPO="${EUROALT_REPO:-TheMorpheus407/european-alternatives}"
LIMIT=500
DRY_RUN=0

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
        --limit)
            if [[ "$#" -lt 2 ]]; then
                echo "error: --limit requires a value" >&2
                exit 64
            fi
            LIMIT="$2"
            shift 2
            ;;
        --limit=*)
            LIMIT="${1#--limit=}"
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

for tool in node gh; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "error: missing required tool: $tool" >&2
        exit 1
    fi
done

PROCESS_CMD="${EUROALT_PROCESS_ISSUE_CMD:-bash $SCRIPT_DIR/process-suggestion-issue-codex.sh}"

cd "$REPO_ROOT"

mkdir -p tmp

RUN_TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SUMMARY_LOG="tmp/research-open-issues-${RUN_TIMESTAMP}.log"
: > "$SUMMARY_LOG"

gh_output="$(gh issue list --repo "$REPO" --state open --limit "$LIMIT" --json number,title,body,url,labels)"
gh_exit=$?
if [[ "$gh_exit" -ne 0 ]]; then
    echo "error: gh issue list failed (exit $gh_exit)" >&2
    exit "$gh_exit"
fi

selected="$(printf '%s' "$gh_output" | node -e '
  let data = "";
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => {
    let issues;
    try {
      issues = data.trim() === "" ? [] : JSON.parse(data);
    } catch (err) {
      process.stderr.write("error: invalid JSON from gh: " + err.message + "\n");
      process.exit(1);
    }
    if (!Array.isArray(issues)) {
      process.stderr.write("error: gh did not return a JSON array\n");
      process.exit(1);
    }
    const seen = new Set();
    const selected = [];
    for (const issue of issues) {
      if (!issue || typeof issue !== "object") continue;
      const num = typeof issue.number === "number" ? issue.number : NaN;
      if (!Number.isFinite(num)) continue;
      if (seen.has(num)) continue;
      const body = typeof issue.body === "string" ? issue.body : "";
      const title = typeof issue.title === "string" ? issue.title : "";
      const matches =
        body.includes("### Name") ||
        /^\s*new alternative/i.test(title) ||
        /^\s*\[alternative\]/i.test(title) ||
        /\b(wrong|missing|correction|incorrect)\b/i.test(title);
      if (!matches) continue;
      seen.add(num);
      selected.push(num);
    }
    if (selected.length > 0) {
      process.stdout.write(selected.join("\n") + "\n");
    }
  });
')"
filter_exit=$?
if [[ "$filter_exit" -ne 0 ]]; then
    echo "error: discovery filter failed (exit $filter_exit)" >&2
    exit "$filter_exit"
fi

if [[ -z "$selected" ]]; then
    echo "no candidate issues found"
    echo "no candidate issues found" >> "$SUMMARY_LOG"
    exit 0
fi

echo "discovered candidate issues:"
printf '%s\n' "$selected" | sed 's/^/  #/'

processed=0
applied=0
skipped=0

while IFS= read -r issue_number; do
    [[ -z "$issue_number" ]] && continue
    processed=$((processed + 1))
    issue_dir="tmp/issues/${issue_number}"
    mkdir -p "$issue_dir"
    pipeline_log="${issue_dir}/pipeline.log"
    result_file="${issue_dir}/result.json"
    rm -f "$result_file"
    if [[ "$DRY_RUN" -eq 1 ]]; then
        echo "==> issue #${issue_number} (dry-run)"
        # shellcheck disable=SC2086
        $PROCESS_CMD "$issue_number" --dry-run >"$pipeline_log" 2>&1
        rc=$?
    else
        echo "==> issue #${issue_number}"
        # shellcheck disable=SC2086
        $PROCESS_CMD "$issue_number" >"$pipeline_log" 2>&1
        rc=$?
    fi

    # Read result.json side-channel manifest if the orchestrator wrote one.
    classification="unknown"
    writes="no"
    outcome="unknown"
    if [[ -f "$result_file" ]]; then
        read -r classification writes outcome < <(node -e '
          const fs = require("fs");
          try {
            const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
            const c = typeof data.classification === "string" ? data.classification : "unknown";
            const w = data.writes_applied === true ? "yes" : "no";
            const o = typeof data.outcome === "string" ? data.outcome : "unknown";
            process.stdout.write(`${c} ${w} ${o}`);
          } catch (err) {
            process.stdout.write("unknown no parse_error");
          }
        ' "$result_file")
    fi

    if [[ "$rc" -eq 0 ]]; then
        applied=$((applied + 1))
        line="issue #${issue_number} classification=${classification} outcome=${outcome} writes=${writes} rc=0"
        echo "    ${line}"
        echo "$line" >> "$SUMMARY_LOG"
    else
        skipped=$((skipped + 1))
        line="issue #${issue_number} classification=${classification} outcome=${outcome} writes=${writes} rc=${rc}"
        echo "    ${line}"
        echo "$line" >> "$SUMMARY_LOG"
    fi
done <<< "$selected"

summary="done: processed=${processed} applied=${applied} skipped=${skipped}"
echo "$summary"
echo "$summary" >> "$SUMMARY_LOG"
echo "summary log: $SUMMARY_LOG"
exit 0
