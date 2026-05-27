import { existsSync, readFileSync } from "node:fs";

import { loadNodeRuntime, useHostFilesystem } from "@php-wasm/node";
import { PHP } from "@php-wasm/universal";
import { afterAll, describe, expect, it } from "vitest";

const scriptUrl = new URL(
  "../scripts/apply-verified-action.php",
  import.meta.url,
);
const stateMarker = "__APPLY_VERIFIED_ACTION_STATE__";

let phpPromise: Promise<PHP> | undefined;

type EntryRow = {
  id: number;
  slug: string;
  name: string;
  status: "alternative" | "us" | "denied" | "draft" | "archived";
  country_code: string | null;
  description_en: string | null;
  description_de: string | null;
  website_url: string | null;
  pricing: string | null;
  is_open_source: number | null;
  open_source_level: string | null;
  source_code_url: string | null;
  self_hostable: number | null;
  founded_year: number | null;
  headquarters_city: string | null;
  license_text: string | null;
};

type EntryCategoryRow = {
  entry_id: number;
  category_id: string;
  is_primary: number;
  sort_order: number;
};

type TagRow = {
  id: number;
  slug: string;
};

type EntryTagRow = {
  entry_id: number;
  tag_id: number;
  sort_order: number;
};

type ReplacementRow = {
  entry_id: number;
  raw_name: string;
  replaced_entry_id: number | null;
  sort_order: number;
};

type UsVendorAliasRow = {
  id: number;
  alias: string;
  entry_id: number;
};

type Scenario = {
  catalog_entries: EntryRow[];
  entry_categories: EntryCategoryRow[];
  tags: TagRow[];
  entry_tags: EntryTagRow[];
  entry_replacements: ReplacementRow[];
  us_vendor_aliases: UsVendorAliasRow[];
  countries: string[];
  categories: string[];
  transactions: string[];
  statements: Array<{ sql: string; params: Record<string, unknown> }>;
  invalidate_cache_calls: number;
  admin_log: string[];
  for_update_locks: number[];
  next_id: number;
  fail_next_execute_with: string | null;
};

type ApplyOutcome = {
  ok: boolean;
  issueNumber?: number | null;
  targetEntrySlug?: string;
  dryRun?: boolean;
  changesApplied?: Array<Record<string, unknown>>;
  plan?: Array<Record<string, unknown>>;
  rolledBack?: boolean;
  error?: string;
  sources?: Array<Record<string, unknown>>;
};

type ApplyRunResult = {
  exitCode: number;
  stderr: string;
  stdout: string;
  outcome?: ApplyOutcome;
  state: Scenario;
};

function getPhp(): Promise<PHP> {
  phpPromise ??= loadNodeRuntime("8.3").then((runtime) => {
    const php = new PHP(runtime);
    useHostFilesystem(php);
    return php;
  });

  return phpPromise;
}

function readScript(): string {
  expect(
    existsSync(scriptUrl),
    "Expected scripts/apply-verified-action.php to define the verified-action mutation runner",
  ).toBe(true);

  return readFileSync(scriptUrl, "utf8");
}

function getFunctionSource(source: string, functionName: string): string {
  const start = source.search(
    new RegExp(`function\\s+${functionName}\\s*\\(`),
  );

  if (start < 0) {
    throw new Error(
      `Expected scripts/apply-verified-action.php to define ${functionName}()`,
    );
  }

  let depth = 0;
  let bodyStarted = false;
  let inSingleQuotedString = false;
  let inDoubleQuotedString = false;

  for (let idx = start; idx < source.length; idx++) {
    const char = source[idx];
    if (inSingleQuotedString) {
      if (char === "\\") {
        idx++;
      } else if (char === "'") {
        inSingleQuotedString = false;
      }
      continue;
    }

    if (inDoubleQuotedString) {
      if (char === "\\") {
        idx++;
      } else if (char === '"') {
        inDoubleQuotedString = false;
      }
      continue;
    }

    if (char === "'") {
      inSingleQuotedString = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuotedString = true;
      continue;
    }

    if (char === "{") {
      depth++;
      bodyStarted = true;
    } else if (char === "}") {
      depth--;
      if (bodyStarted && depth === 0) {
        return source.slice(start, idx + 1);
      }
    }
  }

  throw new Error(`Expected ${functionName}() to have a complete body`);
}

function extractAllFunctions(source: string): string {
  const regex = /(?<!::|->|\w)function\s+([A-Za-z_]\w*)\s*\(/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    names.add(match[1]);
  }

  const bodies: string[] = [];
  for (const name of names) {
    bodies.push(getFunctionSource(source, name));
  }

  return bodies.join("\n\n");
}

function extractConstants(source: string): string {
  const matches = source.match(/^const\s+\w+\s*=\s*[^;]+;/gm) ?? [];
  return matches.join("\n");
}

function baseScenario(): Scenario {
  return {
    catalog_entries: [
      {
        id: 401,
        slug: "element",
        name: "Element",
        status: "alternative",
        country_code: "de",
        description_en: "Existing description",
        description_de: null,
        website_url: "https://element.io",
        pricing: "freemium",
        is_open_source: 1,
        open_source_level: "full",
        source_code_url: "https://github.com/element-hq",
        self_hostable: 1,
        founded_year: 2014,
        headquarters_city: "London",
        license_text: "Apache-2.0",
      },
      {
        id: 901,
        slug: "slack",
        name: "Slack",
        status: "us",
        country_code: "us",
        description_en: null,
        description_de: null,
        website_url: "https://slack.com",
        pricing: null,
        is_open_source: 0,
        open_source_level: "none",
        source_code_url: null,
        self_hostable: 0,
        founded_year: 2009,
        headquarters_city: "San Francisco",
        license_text: null,
      },
    ],
    entry_categories: [
      { entry_id: 401, category_id: "messaging", is_primary: 1, sort_order: 0 },
      { entry_id: 401, category_id: "meeting-software", is_primary: 0, sort_order: 1 },
    ],
    tags: [{ id: 11, slug: "open-source" }],
    entry_tags: [{ entry_id: 401, tag_id: 11, sort_order: 0 }],
    entry_replacements: [],
    us_vendor_aliases: [{ id: 5001, alias: "Slack", entry_id: 901 }],
    countries: ["de", "fr", "us", "eu", "oss"],
    categories: ["messaging", "meeting-software", "office-suite"],
    transactions: [],
    statements: [],
    invalidate_cache_calls: 0,
    admin_log: [],
    for_update_locks: [],
    next_id: 7000,
    fail_next_execute_with: null,
  };
}

function buildVerifiedAction(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    issueNumber: 4711,
    action: "catalog_fact_correction",
    dryRun: false,
    accessedDate: "2026-05-27",
    factCorrection: {
      targetEntrySlug: "element",
      changes: [
        {
          table: "catalog_entries",
          column: "country_code",
          currentValue: "de",
          proposedValue: "fr",
          source: {
            url: "https://element.io/about",
            title: "Element about",
            accessedDate: "2026-05-27",
          },
        },
      ],
    },
    verifierEvidence: [
      {
        table: "catalog_entries",
        column: "country_code",
        proposedValue: "fr",
        verdict: "supports",
        sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
        sourceTitle: "Element (software) — Wikipedia",
        accessedDate: "2026-05-27",
        auditQuote: "Element is a matrix client developed by ...",
      },
    ],
    ...overrides,
  };
}

function buildHarnessCode(args: string[], scenario: Scenario): string {
  const argv = ["scripts/apply-verified-action.php", ...args];
  const script = readScript();
  const functions = extractAllFunctions(script);
  const constants = extractConstants(script);

  return `<?php
declare(strict_types=1);

$applyVerifiedActionState = json_decode(${JSON.stringify(
    JSON.stringify(scenario),
  )}, true, 512, JSON_THROW_ON_ERROR);
$argv = json_decode(${JSON.stringify(JSON.stringify(argv))}, true, 512, JSON_THROW_ON_ERROR);

if (!defined('STDERR')) {
    define('STDERR', fopen('php://stderr', 'wb'));
}

if (!defined('STDOUT')) {
    define('STDOUT', fopen('php://stdout', 'wb'));
}

register_shutdown_function(static function (): void {
    global $applyVerifiedActionState;
    echo "\\n${stateMarker}" . json_encode($applyVerifiedActionState, JSON_THROW_ON_ERROR) . "\\n";
});

final class ApplyVerifiedActionTestPdo extends PDO
{
    private array $state;
    private bool $transactionActive = false;

    public function __construct(array &$state)
    {
        $this->state =& $state;
    }

    public function beginTransaction(): bool
    {
        $this->transactionActive = true;
        $this->state['transactions'][] = 'begin';

        return true;
    }

    public function commit(): bool
    {
        $this->transactionActive = false;
        $this->state['transactions'][] = 'commit';

        return true;
    }

    public function rollBack(): bool
    {
        $this->transactionActive = false;
        $this->state['transactions'][] = 'rollback';

        return true;
    }

    public function inTransaction(): bool
    {
        return $this->transactionActive;
    }

    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return new ApplyVerifiedActionTestStatement($this->state, $query);
    }

    public function lastInsertId(?string $name = null): string|false
    {
        return (string) ($this->state['next_id'] - 1);
    }
}

final class ApplyVerifiedActionTestStatement extends PDOStatement
{
    private array $state;
    private string $sql;
    private array $rows = [];
    private int $cursor = 0;
    private int $affectedRows = 0;

    public function __construct(array &$state, string $sql)
    {
        $this->state =& $state;
        $this->sql = $sql;
    }

    public function execute(?array $params = null): bool
    {
        $params = $params ?? [];
        $normalized = apply_verified_action_test_normalize_sql($this->sql);
        $this->state['statements'][] = [
            'sql' => $normalized,
            'params' => $params,
        ];

        if ($this->state['fail_next_execute_with'] !== null) {
            $tag = $this->state['fail_next_execute_with'];
            if (str_contains($normalized, $tag)) {
                $this->state['fail_next_execute_with'] = null;
                throw new PDOException('forced test failure on ' . $tag);
            }
        }

        $this->rows = [];
        $this->cursor = 0;
        $this->affectedRows = 0;

        // SELECT id, ... FROM catalog_entries WHERE slug = :slug ... FOR UPDATE
        if (str_contains($normalized, 'from catalog_entries') && str_contains($normalized, 'where slug')) {
            $slug = apply_verified_action_test_param($params, 'slug')
                ?? apply_verified_action_test_param($params, 'target_slug');
            $forUpdate = str_contains($normalized, 'for update');
            foreach ($this->state['catalog_entries'] as $row) {
                if ($row['slug'] === $slug) {
                    $this->rows[] = $row;
                    if ($forUpdate) {
                        $this->state['for_update_locks'][] = (int) $row['id'];
                    }
                    break;
                }
            }
            return true;
        }

        // SELECT id FROM catalog_entries WHERE name = :name AND status = :status
        if (str_contains($normalized, 'from catalog_entries') && str_contains($normalized, 'where name')) {
            $name = apply_verified_action_test_param($params, 'name');
            $status = apply_verified_action_test_param($params, 'status');
            foreach ($this->state['catalog_entries'] as $row) {
                if ($row['name'] === $name && ($status === null || $row['status'] === $status)) {
                    $this->rows[] = ['id' => $row['id']];
                    break;
                }
            }
            return true;
        }

        if (str_contains($normalized, 'from us_vendor_aliases') && str_contains($normalized, 'where alias')) {
            $alias = apply_verified_action_test_param($params, 'alias');
            foreach ($this->state['us_vendor_aliases'] as $row) {
                if ($row['alias'] === $alias) {
                    $this->rows[] = ['entry_id' => $row['entry_id']];
                    break;
                }
            }
            return true;
        }

        if (str_contains($normalized, 'from countries') && str_contains($normalized, 'where code')) {
            $code = apply_verified_action_test_param($params, 'code')
                ?? apply_verified_action_test_param($params, 'country_code');
            if (in_array($code, $this->state['countries'], true)) {
                $this->rows[] = ['code' => $code];
            }
            return true;
        }

        if (str_contains($normalized, 'from categories') && str_contains($normalized, 'where id')) {
            $id = apply_verified_action_test_param($params, 'id')
                ?? apply_verified_action_test_param($params, 'category_id');
            if (in_array($id, $this->state['categories'], true)) {
                $this->rows[] = ['id' => $id];
            }
            return true;
        }

        if (str_contains($normalized, 'from tags') && str_contains($normalized, 'where slug')) {
            $slug = apply_verified_action_test_param($params, 'slug');
            foreach ($this->state['tags'] as $row) {
                if ($row['slug'] === $slug) {
                    $this->rows[] = ['id' => $row['id']];
                    break;
                }
            }
            return true;
        }

        if (str_contains($normalized, 'count(') && str_contains($normalized, 'from entry_tags')) {
            $entryId = apply_verified_action_test_param($params, 'entry_id');
            $count = 0;
            foreach ($this->state['entry_tags'] as $row) {
                if ((int) $row['entry_id'] === (int) $entryId) {
                    $count++;
                }
            }
            $this->rows[] = ['c' => $count];
            return true;
        }

        if (str_contains($normalized, 'max(sort_order)') && str_contains($normalized, 'from entry_tags')) {
            $entryId = apply_verified_action_test_param($params, 'entry_id');
            $next = 0;
            foreach ($this->state['entry_tags'] as $row) {
                if ((int) $row['entry_id'] === (int) $entryId) {
                    $candidate = ((int) $row['sort_order']) + 1;
                    if ($candidate > $next) {
                        $next = $candidate;
                    }
                }
            }
            $this->rows[] = ['next' => $next];
            return true;
        }

        if (str_contains($normalized, 'max(sort_order)') && str_contains($normalized, 'from entry_replacements')) {
            $entryId = apply_verified_action_test_param($params, 'entry_id');
            $next = 0;
            foreach ($this->state['entry_replacements'] as $row) {
                if ((int) $row['entry_id'] === (int) $entryId) {
                    $candidate = ((int) $row['sort_order']) + 1;
                    if ($candidate > $next) {
                        $next = $candidate;
                    }
                }
            }
            $this->rows[] = ['next' => $next];
            return true;
        }

        if (str_starts_with($normalized, 'update catalog_entries')) {
            $entryId = apply_verified_action_test_param($params, 'entry_id')
                ?? apply_verified_action_test_param($params, 'id');
            foreach ($this->state['catalog_entries'] as &$row) {
                if ((int) $row['id'] === (int) $entryId) {
                    foreach ($params as $key => $value) {
                        $col = ltrim((string) $key, ':');
                        if ($col === 'entry_id' || $col === 'id') {
                            continue;
                        }
                        if (array_key_exists($col, $row)) {
                            $row[$col] = $value;
                        }
                    }
                    $this->affectedRows++;
                }
            }
            unset($row);
            return true;
        }

        if (str_starts_with($normalized, 'insert into tags')) {
            $newId = $this->state['next_id']++;
            $this->state['tags'][] = [
                'id' => $newId,
                'slug' => (string) apply_verified_action_test_param($params, 'slug'),
            ];
            $this->affectedRows = 1;
            return true;
        }

        if (str_starts_with($normalized, 'insert into entry_tags')) {
            $this->state['entry_tags'][] = [
                'entry_id' => (int) apply_verified_action_test_param($params, 'entry_id'),
                'tag_id' => (int) apply_verified_action_test_param($params, 'tag_id'),
                'sort_order' => (int) (apply_verified_action_test_param($params, 'sort_order') ?? 0),
            ];
            $this->affectedRows = 1;
            return true;
        }

        if (str_starts_with($normalized, 'delete from entry_tags')) {
            $entryId = (int) apply_verified_action_test_param($params, 'entry_id');
            $tagId = (int) apply_verified_action_test_param($params, 'tag_id');
            $removed = 0;
            foreach ($this->state['entry_tags'] as $i => $row) {
                if ((int) $row['entry_id'] === $entryId && (int) $row['tag_id'] === $tagId) {
                    unset($this->state['entry_tags'][$i]);
                    $removed++;
                }
            }
            $this->state['entry_tags'] = array_values($this->state['entry_tags']);
            $this->affectedRows = $removed;
            return true;
        }

        if (str_starts_with($normalized, 'insert into entry_categories')) {
            $this->state['entry_categories'][] = [
                'entry_id' => (int) apply_verified_action_test_param($params, 'entry_id'),
                'category_id' => (string) apply_verified_action_test_param($params, 'category_id'),
                'is_primary' => (int) (apply_verified_action_test_param($params, 'is_primary') ?? 0),
                'sort_order' => (int) (apply_verified_action_test_param($params, 'sort_order') ?? 0),
            ];
            $this->affectedRows = 1;
            return true;
        }

        if (str_starts_with($normalized, 'update entry_categories')) {
            $entryId = (int) apply_verified_action_test_param($params, 'entry_id');
            $categoryId = apply_verified_action_test_param($params, 'category_id');
            $isPrimary = apply_verified_action_test_param($params, 'is_primary');
            $affected = 0;
            foreach ($this->state['entry_categories'] as &$row) {
                if ((int) $row['entry_id'] !== $entryId) {
                    continue;
                }
                if ($categoryId !== null && $row['category_id'] !== $categoryId) {
                    continue;
                }
                if (str_contains($normalized, 'is_primary = 1') && (int) $row['is_primary'] !== 1) {
                    continue;
                }
                if ($isPrimary !== null) {
                    $row['is_primary'] = (int) $isPrimary;
                } elseif (str_contains($normalized, 'is_primary = 0')) {
                    $row['is_primary'] = 0;
                } elseif (str_contains($normalized, 'is_primary = 1')) {
                    $row['is_primary'] = 1;
                }
                $affected++;
            }
            unset($row);
            $this->affectedRows = $affected;
            return true;
        }

        if (str_starts_with($normalized, 'delete from entry_categories')) {
            $entryId = (int) apply_verified_action_test_param($params, 'entry_id');
            $categoryId = (string) apply_verified_action_test_param($params, 'category_id');
            $removed = 0;
            foreach ($this->state['entry_categories'] as $i => $row) {
                if ((int) $row['entry_id'] === $entryId && $row['category_id'] === $categoryId) {
                    unset($this->state['entry_categories'][$i]);
                    $removed++;
                }
            }
            $this->state['entry_categories'] = array_values($this->state['entry_categories']);
            $this->affectedRows = $removed;
            return true;
        }

        if (str_starts_with($normalized, 'insert into entry_replacements')) {
            $this->state['entry_replacements'][] = [
                'entry_id' => (int) apply_verified_action_test_param($params, 'entry_id'),
                'raw_name' => (string) apply_verified_action_test_param($params, 'raw_name'),
                'replaced_entry_id' => apply_verified_action_test_param($params, 'replaced_entry_id') !== null
                    ? (int) apply_verified_action_test_param($params, 'replaced_entry_id')
                    : null,
                'sort_order' => (int) (apply_verified_action_test_param($params, 'sort_order') ?? 0),
            ];
            $this->affectedRows = 1;
            return true;
        }

        if (str_starts_with($normalized, 'delete from entry_replacements')) {
            $entryId = (int) apply_verified_action_test_param($params, 'entry_id');
            $rawName = (string) apply_verified_action_test_param($params, 'raw_name');
            $removed = 0;
            foreach ($this->state['entry_replacements'] as $i => $row) {
                if ((int) $row['entry_id'] === $entryId && $row['raw_name'] === $rawName) {
                    unset($this->state['entry_replacements'][$i]);
                    $removed++;
                }
            }
            $this->state['entry_replacements'] = array_values($this->state['entry_replacements']);
            $this->affectedRows = $removed;
            return true;
        }

        if (str_starts_with($normalized, 'insert into us_vendor_aliases')) {
            $newId = $this->state['next_id']++;
            $this->state['us_vendor_aliases'][] = [
                'id' => $newId,
                'alias' => (string) apply_verified_action_test_param($params, 'alias'),
                'entry_id' => (int) apply_verified_action_test_param($params, 'entry_id'),
            ];
            $this->affectedRows = 1;
            return true;
        }

        if (str_starts_with($normalized, 'insert into catalog_entries')) {
            $newId = $this->state['next_id']++;
            $this->state['catalog_entries'][] = [
                'id' => $newId,
                'slug' => (string) apply_verified_action_test_param($params, 'slug'),
                'name' => (string) apply_verified_action_test_param($params, 'name'),
                'status' => (string) (apply_verified_action_test_param($params, 'status') ?? 'us'),
                'country_code' => apply_verified_action_test_param($params, 'country_code'),
                'description_en' => null,
                'description_de' => null,
                'website_url' => null,
                'pricing' => null,
                'is_open_source' => null,
                'open_source_level' => null,
                'source_code_url' => null,
                'self_hostable' => null,
                'founded_year' => null,
                'headquarters_city' => null,
                'license_text' => null,
            ];
            $this->affectedRows = 1;
            return true;
        }

        // Unknown SQL — record and treat as no-op rather than throw, so tests can
        // still introspect what the script tried to do.
        return true;
    }

    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        if (!isset($this->rows[$this->cursor])) {
            return false;
        }

        return $this->rows[$this->cursor++];
    }

    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        $rest = array_slice($this->rows, $this->cursor);
        $this->cursor = count($this->rows);
        return $rest;
    }

    public function fetchColumn(int $column = 0): mixed
    {
        $row = $this->fetch();
        if ($row === false) {
            return false;
        }
        if (is_array($row)) {
            $values = array_values($row);
            return $values[$column] ?? false;
        }
        return false;
    }

    public function rowCount(): int
    {
        return $this->affectedRows;
    }
}

function apply_verified_action_test_normalize_sql(string $sql): string
{
    return str_replace(chr(96), '', strtolower(preg_replace('/\\s+/', ' ', $sql) ?? $sql));
}

function apply_verified_action_test_param(array $params, string $name): mixed
{
    foreach ([$name, ':' . $name] as $key) {
        if (array_key_exists($key, $params)) {
            return $params[$key];
        }
    }

    return null;
}

function getDatabaseConnection(): PDO
{
    global $applyVerifiedActionState;
    return new ApplyVerifiedActionTestPdo($applyVerifiedActionState);
}

function invalidateCache(): void
{
    global $applyVerifiedActionState;
    $applyVerifiedActionState['invalidate_cache_calls']++;
}

function logAdminMessage(string $message): void
{
    global $applyVerifiedActionState;
    $applyVerifiedActionState['admin_log'][] = $message;
}

${constants}

${functions}

try {
    runApplyVerifiedAction($argv);
} catch (Throwable $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\\n");
    exit(1);
}
`;
}

function parseRun(
  stdout: string,
  stderr: string,
  exitCode: number,
): ApplyRunResult {
  if (exitCode === 255) {
    throw new Error(`PHP fatal error:\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const lines = stdout.split(/\r?\n/).map((line) => line.trim());
  const stateLine = lines.find((line) => line.startsWith(stateMarker));

  if (stateLine === undefined) {
    throw new Error(`Test harness did not emit state: ${stdout}`);
  }

  const jsonCandidates = lines.filter(
    (line) =>
      !line.startsWith(stateMarker) &&
      line.length > 0 &&
      (line.startsWith("{") || line.startsWith("[")),
  );
  const outcomeLine = jsonCandidates[jsonCandidates.length - 1];

  let outcome: ApplyOutcome | undefined;
  if (outcomeLine !== undefined) {
    try {
      outcome = JSON.parse(outcomeLine) as ApplyOutcome;
    } catch {
      outcome = undefined;
    }
  }

  return {
    exitCode,
    stderr,
    stdout,
    outcome,
    state: JSON.parse(stateLine.slice(stateMarker.length)) as Scenario,
  };
}

async function runApply(
  verifiedAction: Record<string, unknown>,
  scenario: Scenario = baseScenario(),
  extraArgs: string[] = [],
): Promise<ApplyRunResult> {
  const args = [
    "--verified-action-json",
    JSON.stringify(verifiedAction),
    ...extraArgs,
  ];

  const php = await getPhp();
  const response = await php.runStream({
    code: buildHarnessCode(args, scenario),
  });

  return parseRun(
    await response.stdoutText,
    await response.stderrText,
    await response.exitCode,
  );
}

afterAll(async () => {
  if (phpPromise !== undefined) {
    const php = await phpPromise;
    php.exit();
  }
});

describe("apply-verified-action mutation runner", () => {
  it("applies a verified catalog_entries column update inside a transaction", async () => {
    const result = await runApply(buildVerifiedAction());

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);
    expect(result.state.for_update_locks).toContain(401);

    const element = result.state.catalog_entries.find((row) => row.id === 401);
    expect(element?.country_code).toBe("fr");

    expect(result.outcome).toBeDefined();
    expect(result.outcome?.ok).toBe(true);
    expect(result.outcome?.targetEntrySlug).toBe("element");
    expect(result.outcome?.dryRun).toBe(false);
    expect(Array.isArray(result.outcome?.changesApplied)).toBe(true);
    expect(result.outcome?.changesApplied?.length).toBe(1);
  });

  it("rejects new_alternative actions fail-closed without opening a transaction", async () => {
    const result = await runApply(
      buildVerifiedAction({
        action: "new_alternative",
        factCorrection: undefined,
        newAlternative: { slug: "should-not-be-applied" },
        verifierEvidence: {},
      }),
    );

    expect(result.exitCode).not.toBe(0);
    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.statements).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(
      /new_alternative|catalog_fact_correction|unsupported/,
    );
  });

  it("rejects forbidden catalog_entries columns (slug, name, logo_path) fail-closed", async () => {
    for (const forbiddenColumn of ["slug", "name", "logo_path", "status"]) {
      const result = await runApply(
        buildVerifiedAction({
          factCorrection: {
            targetEntrySlug: "element",
            changes: [
              {
                table: "catalog_entries",
                column: forbiddenColumn,
                currentValue: "element",
                proposedValue: "renamed",
                source: {
                  url: "https://example.test/x",
                  title: "Source",
                  accessedDate: "2026-05-27",
                },
              },
            ],
          },
          verifierEvidence: [
            {
              table: "catalog_entries",
              column: forbiddenColumn,
              proposedValue: "renamed",
              verdict: "supports",
              sourceUrl: "https://en.wikipedia.org/wiki/Element",
              sourceTitle: "Element",
              accessedDate: "2026-05-27",
              auditQuote: "...",
            },
          ],
        }),
      );

      expect(result.exitCode, `forbidden column ${forbiddenColumn}`).toBe(65);
      expect(result.state.transactions, forbiddenColumn).toEqual([]);
      expect(result.state.invalidate_cache_calls, forbiddenColumn).toBe(0);
    }
  });

  it("rejects payloads containing banned scoring/trust keys anywhere", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        trust_score: 0.5,
        changes: [
          {
            table: "catalog_entries",
            column: "country_code",
            currentValue: "de",
            proposedValue: "fr",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/banned|trust_score|forbidden/);
  });

  it("rejects payloads whose verifier evidence count does not match the changes count", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "country_code",
            currentValue: "de",
            proposedValue: "fr",
            source: {
              url: "https://element.io",
              title: "Element",
              accessedDate: "2026-05-27",
            },
          },
          {
            table: "catalog_entries",
            column: "description_en",
            currentValue: "old",
            proposedValue: "new",
            source: {
              url: "https://element.io/help",
              title: "Help",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "country_code",
          proposedValue: "fr",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/evidence|coverage|mismatch/);
  });

  it("rejects payloads whose verifier evidence has a non-supporting verdict", async () => {
    const payload = buildVerifiedAction({
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "country_code",
          proposedValue: "fr",
          verdict: "contradicts",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
  });

  it("--dry-run prints the action plan and performs no writes", async () => {
    const payload = buildVerifiedAction({ dryRun: true });
    const result = await runApply(payload, baseScenario(), ["--dry-run"]);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.statements).toEqual([]);

    const element = result.state.catalog_entries.find((row) => row.id === 401);
    expect(element?.country_code).toBe("de");

    expect(result.outcome).toBeDefined();
    expect(result.outcome?.dryRun).toBe(true);
    expect(result.outcome?.ok).toBe(true);
    expect(
      Array.isArray(result.outcome?.changesApplied) ||
        Array.isArray(result.outcome?.plan),
    ).toBe(true);
  });

  it("inserts a new entry_tag and auto-creates the tag row when the slug is new", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_tags",
            op: "insert",
            proposedValue: "privacy-focused",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_tags",
          op: "insert",
          proposedValue: "privacy-focused",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "Element emphasizes privacy ...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    const tag = result.state.tags.find((row) => row.slug === "privacy-focused");
    expect(tag, "expected new tag row").toBeDefined();
    expect(
      result.state.entry_tags.some(
        (row) => row.entry_id === 401 && row.tag_id === tag?.id,
      ),
      "expected entry_tags row to be inserted",
    ).toBe(true);
  });

  it("rejects entry_tags inserts whose tag slug violates the stricter tag-slug regex", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_tags",
            op: "insert",
            proposedValue: "Invalid_Tag.Slug",
            source: {
              url: "https://example.test/x",
              title: "Source",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_tags",
          op: "insert",
          proposedValue: "Invalid_Tag.Slug",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/tag|slug/);
  });

  it("entry_categories set_primary demotes the existing primary before promoting the new one", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_categories",
            op: "set_primary",
            proposedValue: "meeting-software",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_categories",
          op: "set_primary",
          proposedValue: "meeting-software",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);

    const updateStatements = result.state.statements.filter((s) =>
      s.sql.startsWith("update entry_categories"),
    );
    expect(
      updateStatements.length,
      "set_primary must decompose into at least demote+promote",
    ).toBeGreaterThanOrEqual(2);

    const demoteIndex = updateStatements.findIndex((s) =>
      s.sql.includes("is_primary = 0") || s.params.is_primary === 0 || s.params[":is_primary"] === 0,
    );
    const promoteIndex = updateStatements.findIndex((s) =>
      s.sql.includes("is_primary = 1") || s.params.is_primary === 1 || s.params[":is_primary"] === 1,
    );
    expect(demoteIndex, "demote should appear in updates").toBeGreaterThanOrEqual(0);
    expect(promoteIndex, "promote should appear in updates").toBeGreaterThanOrEqual(0);
    expect(
      demoteIndex,
      "demote-old must execute before promote-new to avoid uq_primary",
    ).toBeLessThan(promoteIndex);

    const promoted = result.state.entry_categories.find(
      (row) => row.entry_id === 401 && row.category_id === "meeting-software",
    );
    const demoted = result.state.entry_categories.find(
      (row) => row.entry_id === 401 && row.category_id === "messaging",
    );
    expect(promoted?.is_primary).toBe(1);
    expect(demoted?.is_primary).toBe(0);
  });

  it("rolls back the transaction and skips cache invalidation when a write fails", async () => {
    const scenario = baseScenario();
    scenario.fail_next_execute_with = "update catalog_entries";

    const result = await runApply(buildVerifiedAction(), scenario);

    expect(result.exitCode).not.toBe(0);
    expect(result.state.transactions).toContain("begin");
    expect(result.state.transactions).toContain("rollback");
    expect(result.state.transactions).not.toContain("commit");
    expect(result.state.invalidate_cache_calls).toBe(0);

    if (result.outcome) {
      expect(result.outcome.ok).toBe(false);
      expect(result.outcome.rolledBack).toBe(true);
    }
  });

  it("rejects openness updates that violate chk_openness before opening a transaction", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "is_open_source",
            currentValue: 1,
            proposedValue: true,
            source: {
              url: "https://element.io",
              title: "Element",
              accessedDate: "2026-05-27",
            },
          },
          {
            table: "catalog_entries",
            column: "open_source_level",
            currentValue: "full",
            proposedValue: "none",
            source: {
              url: "https://element.io",
              title: "Element",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "is_open_source",
          proposedValue: true,
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
        {
          table: "catalog_entries",
          column: "open_source_level",
          proposedValue: "none",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Open-source_software",
          sourceTitle: "OSS",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(
      /openness|open_source|is_open_source/,
    );
  });

  it("rejects updates targeting a slug that does not exist in catalog_entries", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "does-not-exist",
        changes: [
          {
            table: "catalog_entries",
            column: "country_code",
            currentValue: "de",
            proposedValue: "fr",
            source: {
              url: "https://example.test",
              title: "Source",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
    });

    const result = await runApply(payload);

    expect(result.exitCode).not.toBe(0);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.state.transactions).not.toContain("commit");
  });

  it("rejects updates targeting tables outside the 5-table allowlist", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "scoring_metadata",
            op: "insert",
            proposedValue: "foss",
            source: {
              url: "https://example.test",
              title: "Source",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "scoring_metadata",
          op: "insert",
          proposedValue: "foss",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(
      /scoring_metadata|allowlist|not allowed/,
    );
  });

  it("entry_replacements insert resolves to an existing US vendor by name without auto-creating", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_replacements",
            op: "insert",
            proposedValue: "Slack",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_replacements",
          op: "insert",
          proposedValue: "Slack",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "Element replaces Slack ...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    const replacement = result.state.entry_replacements.find(
      (row) => row.entry_id === 401 && row.raw_name === "Slack",
    );
    expect(replacement, "expected entry_replacements row").toBeDefined();
    expect(
      replacement?.replaced_entry_id,
      "must resolve to Slack's catalog id (901)",
    ).toBe(901);

    // Should NOT have auto-created a new us catalog entry — Slack already exists.
    const usEntries = result.state.catalog_entries.filter(
      (row) => row.status === "us",
    );
    expect(usEntries.length, "no new us vendor should be auto-created").toBe(1);

    const applied = result.outcome?.changesApplied?.[0] ?? {};
    expect(applied.autoCreatedUsVendor).toBeUndefined();
  });

  it("entry_replacements insert resolves via us_vendor_aliases when the name does not match a catalog entry", async () => {
    const scenario = baseScenario();
    scenario.us_vendor_aliases.push({
      id: 5002,
      alias: "Slack Technologies",
      entry_id: 901,
    });

    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_replacements",
            op: "insert",
            proposedValue: "Slack Technologies",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_replacements",
          op: "insert",
          proposedValue: "Slack Technologies",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload, scenario);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);

    const replacement = result.state.entry_replacements.find(
      (row) => row.entry_id === 401 && row.raw_name === "Slack Technologies",
    );
    expect(replacement, "expected entry_replacements row").toBeDefined();
    expect(
      replacement?.replaced_entry_id,
      "alias 'Slack Technologies' must resolve to Slack's catalog id (901)",
    ).toBe(901);

    const usEntries = result.state.catalog_entries.filter(
      (row) => row.status === "us",
    );
    expect(
      usEntries.length,
      "alias resolution must not trigger auto-create",
    ).toBe(1);

    const applied = result.outcome?.changesApplied?.[0] ?? {};
    expect(applied.autoCreatedUsVendor).toBeUndefined();
  });

  it("entry_replacements insert auto-creates a US vendor entry when both name and alias miss", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_replacements",
            op: "insert",
            proposedValue: "Zoom Communications",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_replacements",
          op: "insert",
          proposedValue: "Zoom Communications",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Zoom_Communications",
          sourceTitle: "Zoom",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    const created = result.state.catalog_entries.find(
      (row) => row.name === "Zoom Communications",
    );
    expect(created, "expected new us catalog entry to be inserted").toBeDefined();
    expect(created?.status).toBe("us");
    expect(created?.slug).toBe("zoom-communications");

    const replacement = result.state.entry_replacements.find(
      (row) => row.raw_name === "Zoom Communications",
    );
    expect(replacement?.replaced_entry_id).toBe(created?.id);

    const applied = result.outcome?.changesApplied?.[0] ?? {};
    expect(applied.autoCreatedUsVendor).toBeDefined();
    expect(
      (applied.autoCreatedUsVendor as Record<string, unknown>).slug,
    ).toBe("zoom-communications");
    expect(
      (applied.autoCreatedUsVendor as Record<string, unknown>).name,
    ).toBe("Zoom Communications");
  });

  it("entry_replacements delete removes the matching replacement row", async () => {
    const scenario = baseScenario();
    scenario.entry_replacements.push({
      entry_id: 401,
      raw_name: "Slack",
      replaced_entry_id: 901,
      sort_order: 0,
    });

    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_replacements",
            op: "delete",
            proposedValue: "Slack",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_replacements",
          op: "delete",
          proposedValue: "Slack",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload, scenario);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    const remaining = result.state.entry_replacements.find(
      (row) => row.entry_id === 401 && row.raw_name === "Slack",
    );
    expect(remaining, "Slack replacement row must be deleted").toBeUndefined();
  });

  it("us_vendor_aliases insert adds the alias when the target slug is a us entry", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "us_vendor_aliases",
            op: "insert",
            proposedValue: {
              alias: "Slack, Inc.",
              entrySlug: "slack",
            },
            source: {
              url: "https://slack.com/about",
              title: "Slack about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "us_vendor_aliases",
          op: "insert",
          proposedValue: { alias: "Slack, Inc.", entrySlug: "slack" },
          verdict: "supports",
          sourceUrl: "https://slack.com/about",
          sourceTitle: "Slack",
          accessedDate: "2026-05-27",
          auditQuote: "Slack, Inc. is the legal name.",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    const alias = result.state.us_vendor_aliases.find(
      (row) => row.alias === "Slack, Inc." && row.entry_id === 901,
    );
    expect(alias, "expected new alias row pointing to Slack (901)").toBeDefined();
  });

  it("us_vendor_aliases insert rolls back when the target slug is not a us entry", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "us_vendor_aliases",
            op: "insert",
            proposedValue: {
              alias: "Element Matrix",
              entrySlug: "element",
            },
            source: {
              url: "https://element.io",
              title: "Element",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "us_vendor_aliases",
          op: "insert",
          proposedValue: { alias: "Element Matrix", entrySlug: "element" },
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, "non-us target must fail-closed").not.toBe(0);
    expect(result.state.transactions).toContain("begin");
    expect(result.state.transactions).toContain("rollback");
    expect(result.state.transactions).not.toContain("commit");
    expect(result.state.invalidate_cache_calls).toBe(0);

    const alias = result.state.us_vendor_aliases.find(
      (row) => row.alias === "Element Matrix",
    );
    expect(alias, "alias row must NOT be inserted").toBeUndefined();
  });

  it("entry_categories insert appends a non-primary category row", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_categories",
            op: "insert",
            proposedValue: "office-suite",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_categories",
          op: "insert",
          proposedValue: "office-suite",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);

    const added = result.state.entry_categories.find(
      (row) => row.entry_id === 401 && row.category_id === "office-suite",
    );
    expect(added, "expected entry_categories row").toBeDefined();
    expect(added?.is_primary, "insert must default to non-primary").toBe(0);
  });

  it("entry_categories delete removes the matching category row", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_categories",
            op: "delete",
            proposedValue: "meeting-software",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_categories",
          op: "delete",
          proposedValue: "meeting-software",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);

    const remaining = result.state.entry_categories.find(
      (row) =>
        row.entry_id === 401 && row.category_id === "meeting-software",
    );
    expect(remaining, "meeting-software row must be deleted").toBeUndefined();
  });

  it("entry_tags delete removes the matching entry_tags row by slug", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_tags",
            op: "delete",
            proposedValue: "open-source",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_tags",
          op: "delete",
          proposedValue: "open-source",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.state.transactions).toEqual(["begin", "commit"]);

    const remaining = result.state.entry_tags.find(
      (row) => row.entry_id === 401 && row.tag_id === 11,
    );
    expect(remaining, "open-source entry_tags row must be deleted").toBeUndefined();
  });

  it("success outcome JSON carries verifier sources for the finalize stage", async () => {
    const result = await runApply(buildVerifiedAction());

    expect(result.exitCode, result.stderr).toBe(0);
    expect(result.outcome?.sources, "outcome must expose sources").toBeDefined();
    expect(Array.isArray(result.outcome?.sources)).toBe(true);
    expect(result.outcome?.sources?.length).toBe(1);
    expect(result.outcome?.sources?.[0]?.sourceUrl).toBe(
      "https://en.wikipedia.org/wiki/Element_(software)",
    );
  });

  it("entry_replacements insert uses MAX(sort_order)+1 when an entry already has a replacement at sort_order=0", async () => {
    const scenario = baseScenario();
    scenario.entry_replacements.push({
      entry_id: 401,
      raw_name: "Slack",
      replaced_entry_id: 901,
      sort_order: 0,
    });
    scenario.catalog_entries.push({
      id: 902,
      slug: "zoom",
      name: "Zoom",
      status: "us",
      country_code: "us",
      description_en: null,
      description_de: null,
      website_url: "https://zoom.us",
      pricing: null,
      is_open_source: 0,
      open_source_level: "none",
      source_code_url: null,
      self_hostable: 0,
      founded_year: 2011,
      headquarters_city: "San Jose",
      license_text: null,
    });

    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_replacements",
            op: "insert",
            proposedValue: "Zoom",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_replacements",
          op: "insert",
          proposedValue: "Zoom",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "Element also replaces Zoom ...",
        },
      ],
    });

    const result = await runApply(payload, scenario);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(
      result.state.transactions,
      "transaction must commit (not rollback on uq_er_order)",
    ).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    const newRow = result.state.entry_replacements.find(
      (row) => row.entry_id === 401 && row.raw_name === "Zoom",
    );
    expect(newRow, "expected new entry_replacements row").toBeDefined();
    expect(
      newRow?.sort_order,
      "second replacement on entry must take sort_order=1 (MAX+1), not 0",
    ).toBe(1);
  });

  it("entry_tags insert uses MAX(sort_order)+1 — survives gaps left by prior deletes", async () => {
    const scenario = baseScenario();
    // Replace seeded entry_tags with rows at sort_order=0 and sort_order=2 (gap at 1, as if 1 was deleted).
    scenario.entry_tags = [
      { entry_id: 401, tag_id: 11, sort_order: 0 },
      { entry_id: 401, tag_id: 12, sort_order: 2 },
    ];
    scenario.tags.push({ id: 12, slug: "matrix" });

    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_tags",
            op: "insert",
            proposedValue: "federated",
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_tags",
          op: "insert",
          proposedValue: "federated",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "Element is a federated client ...",
        },
      ],
    });

    const result = await runApply(payload, scenario);

    expect(result.exitCode, result.stderr).toBe(0);
    expect(
      result.state.transactions,
      "transaction must commit (COUNT(*) would have collided with sort_order=2)",
    ).toEqual(["begin", "commit"]);
    expect(result.state.invalidate_cache_calls).toBe(1);

    const inserted = result.state.entry_tags.find(
      (row) =>
        row.entry_id === 401 &&
        row.sort_order !== 0 &&
        row.sort_order !== 2,
    );
    expect(inserted, "expected new entry_tags row").toBeDefined();
    expect(
      inserted?.sort_order,
      "new tag must take MAX(sort_order)+1 = 3, not COUNT(*) = 2",
    ).toBe(3);
  });

  it("rejects changes whose source.url is not a public http(s) URL (localhost)", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "country_code",
            currentValue: "de",
            proposedValue: "fr",
            source: {
              url: "http://localhost/about",
              title: "Internal",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/url|public|http/);
  });

  it("rejects verifierEvidence whose sourceUrl resolves to a private IPv4 host", async () => {
    const payload = buildVerifiedAction({
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "country_code",
          proposedValue: "fr",
          verdict: "supports",
          sourceUrl: "https://192.168.1.5/wiki",
          sourceTitle: "Private",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
  });

  it("rejects single-column open_source_level update that breaks the openness invariant against current row", async () => {
    // Base row: is_open_source=1, open_source_level='full'.
    // Proposed change: only open_source_level='none'. Pre-payload check
    // sees a single column and cannot detect the conflict; the post-lock
    // check against the locked row (with is_open_source=true projected
    // forward) must fail-closed inside the transaction.
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "open_source_level",
            currentValue: "full",
            proposedValue: "none",
            source: {
              url: "https://element.io",
              title: "Element",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "open_source_level",
          proposedValue: "none",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode, "must fail-closed inside transaction").not.toBe(0);
    expect(result.state.transactions).toContain("begin");
    expect(result.state.transactions).toContain("rollback");
    expect(result.state.transactions).not.toContain("commit");
    expect(result.state.invalidate_cache_calls).toBe(0);
    if (result.outcome) {
      expect(result.outcome.ok).toBe(false);
      expect(result.outcome.rolledBack).toBe(true);
    }

    const element = result.state.catalog_entries.find((row) => row.id === 401);
    expect(
      element?.open_source_level,
      "row must not have been mutated",
    ).toBe("full");
  });

  it("rejects entry_tags insert when the entry already has APPLY_TAGS_PER_ENTRY_MAX tags", async () => {
    const scenario = baseScenario();
    scenario.entry_tags = [];
    scenario.tags = [];
    for (let i = 0; i < 20; i++) {
      scenario.tags.push({ id: 100 + i, slug: `t${i}` });
      scenario.entry_tags.push({
        entry_id: 401,
        tag_id: 100 + i,
        sort_order: i,
      });
    }

    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "entry_tags",
            op: "insert",
            proposedValue: "overflow",
            source: {
              url: "https://element.io/about",
              title: "Element",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "entry_tags",
          op: "insert",
          proposedValue: "overflow",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload, scenario);

    expect(result.exitCode, "tag cap must trigger fail-closed").not.toBe(0);
    expect(result.state.transactions).toContain("begin");
    expect(result.state.transactions).toContain("rollback");
    expect(result.state.transactions).not.toContain("commit");
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(
      result.state.entry_tags.length,
      "21st tag must NOT be inserted",
    ).toBe(20);
  });

  it("rejects payload whose factCorrection.changes is an empty array", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [],
      },
      verifierEvidence: [],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.statements).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/changes|empty|non-empty/);
  });

  it("rejects catalog_entries.founded_year outside the 1900..now+1 range", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "founded_year",
            currentValue: 2014,
            proposedValue: 1800,
            source: {
              url: "https://element.io/about",
              title: "Element about",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "founded_year",
          proposedValue: 1800,
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/founded_year|year|1900/);
  });

  it("rejects catalog_entries.description_en payloads exceeding the 4 KiB cap (DoS defense)", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "description_en",
            currentValue: "Existing description",
            proposedValue: "x".repeat(4097),
            source: {
              url: "https://element.io/about",
              title: "Element",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "description_en",
          proposedValue: "x".repeat(4097),
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/description|4096|exceeds|bytes/);
  });

  it("rejects catalog_entries.pricing values outside the enum (free/freemium/paid)", async () => {
    const payload = buildVerifiedAction({
      factCorrection: {
        targetEntrySlug: "element",
        changes: [
          {
            table: "catalog_entries",
            column: "pricing",
            currentValue: "freemium",
            proposedValue: "premium",
            source: {
              url: "https://element.io/pricing",
              title: "Element pricing",
              accessedDate: "2026-05-27",
            },
          },
        ],
      },
      verifierEvidence: [
        {
          table: "catalog_entries",
          column: "pricing",
          proposedValue: "premium",
          verdict: "supports",
          sourceUrl: "https://en.wikipedia.org/wiki/Element_(software)",
          sourceTitle: "Element",
          accessedDate: "2026-05-27",
          auditQuote: "...",
        },
      ],
    });

    const result = await runApply(payload);

    expect(result.exitCode).toBe(65);
    expect(result.state.transactions).toEqual([]);
    expect(result.state.invalidate_cache_calls).toBe(0);
    expect(result.stderr.toLowerCase()).toMatch(/pricing|free|freemium|paid/);
  });
});
