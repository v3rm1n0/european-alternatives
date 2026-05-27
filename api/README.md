# European Alternatives — API & Database

Developer reference for the PHP read API and MySQL database.

---

## Quick Start

### Prerequisites

- PHP 8.1+ (CLI)
- MySQL 8.0+ (InnoDB, utf8mb4)
- Database credentials configured (see [Production Secrets](#production-secrets) below)

### npm Scripts

| npm script   | Command                                                      | Description                                                                  |
| ------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `db:import`  | `php scripts/db-import.php --source tmp/export/catalog.json` | Seed catalog and matrix MySQL tables from exported JSON (single transaction) |
| `db:backup`  | `bash scripts/db-backup.sh`                                  | Backup the database                                                          |
| `db:restore` | `bash scripts/db-restore.sh`                                 | Restore a database backup                                                    |

---

## API Endpoints

Catalog endpoints are read-only, return JSON, and are cached for 5 minutes (`Cache-Control: public, max-age=300`). Operational health endpoints are uncached and may require authentication.

| Method | URL                            | Query Params                                                           | Description                                                                                                                       |
| ------ | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/catalog/entries`         | `status` (alternative\|us\|denied\|draft\|archived), `locale` (en\|de) | List all active entries for a given status. Default: `status=alternative`, `locale=en`.                                           |
| GET    | `/api/catalog/entry`           | `slug`, `locale` (en\|de)                                              | Fetch a single entry by slug with full detail (reservations, signals, comparisons).                                               |
| GET    | `/api/catalog/matrix`          | `category`, `locale` (en\|de)                                          | Fetch one category's matrix groups, criteria, options, active alternatives, and public fact states. Default: `locale=en`.         |
| GET    | `/api/catalog/categories`      | `locale` (en\|de)                                                      | List all categories with i18n names and descriptions.                                                                             |
| GET    | `/api/catalog/countries`       | `locale` (en\|de)                                                      | List all countries with i18n labels.                                                                                              |
| GET    | `/api/catalog/tags`            | --                                                                     | List all tags with slugs and optional labels.                                                                                     |
| GET    | `/api/catalog/further-reading` | --                                                                     | List curated further-reading resources.                                                                                           |
| GET    | `/api/catalog/landing-groups`  | `locale` (en\|de)                                                      | Landing page category groups with nested category IDs.                                                                            |
| GET    | `/api/health/db`               | --                                                                     | Operational database readiness check (no caching, requires admin Bearer token, includes transport probe metadata when available). |

Response envelope for list endpoints:

```json
{
  "data": [ ... ],
  "meta": { "count": 234, "locale": "en" }
}
```

### Catalog Matrix Response

`GET /api/catalog/matrix?category=messaging&locale=en` returns the comparison matrix for exactly one category. `category` is required and must match an existing category ID. `locale` defaults to `en` and must be `en` or `de`.

Success responses use the catalog `{ "data": ..., "meta": ... }` envelope. `meta` includes the requested `category`, resolved `locale`, `groupCount`, `criterionCount`, and `alternativeCount`.

The response includes:

- `data.category` with localized category metadata
- `data.groups[]` in matrix sort order, each with nested `criteria[]` and ordered `options[]`
- `data.alternatives[]` for active alternatives assigned to the requested category, including secondary category assignments
- `alternatives[].facts`, keyed by criterion ID, with one fact cell for every returned criterion

Fact cells use a public status and value:

```json
{
  "status": "verified",
  "value": true,
  "source": {
    "url": "https://example.com/source",
    "title": "Source title",
    "accessedDate": "2026-05-24"
  }
}
```

Missing, open, researching, rejected, or otherwise unresolved facts are returned as `{ "status": "unverified", "value": null }`. Facts that do not apply are returned as `{ "status": "not_applicable", "value": null }`. Verified facts expose public source metadata when available, but never audit quotes or raw agent/verifier output.

Locale fallback: when `locale=de` and no German translation exists for a field, the English value is returned via `COALESCE(column_de, column_en)`.

### Category Matrix Concepts

Category matrix criteria are category-native product-fit facts, not Trust Score inputs. Category matrix facts do not affect Trust Score. Criterion groups, criteria, and enum options belong to one category; the API and UI load them only when exactly one category is selected. The `other` category is a catch-all bucket and non-matrix: it does not have matrix criteria, matrix view mode, or category-specific fit filters.

Criteria describe comparison rows for a category:

- `value_type` defines the stored value shape: `boolean`, `enum`, `multi_enum`, `number`, `text`, `url`, or `date`.
- `semantics` describes how maintainers should interpret the row for display and review: `beneficial`, `harmful`, `neutral`, `tradeoff`, `informational`, or `risk`.
- `filter_mode` controls whether the criterion can become a category-specific fit filter: `none`, `optional`, `must_match`, `range`, or `multi_select`.

Fit filters are browsing aids for product-fit comparisons. They compose with the normal browse filters, are active only in a single matrix-enabled category, and include `Unverified` results by default so unknown/open facts do not disappear from browse results. Unknown/open facts appear as `Unverified` and are included by default by fit filters. Matrix facts and fit filters do not change the Trust Score formula; Trust Score remains computed only from reservations, positive signals, and scoring metadata.

Public fact state is intentionally narrower than internal research state:

| Internal state                                                                  | Public API/UI state                         |
| ------------------------------------------------------------------------------- | ------------------------------------------- |
| `verified`                                                                      | `verified` with the typed value and optional public source metadata |
| `not-applicable`                                                                | `not_applicable` with `value: null`         |
| Missing fact, `open`, `researching`, `rejected`, `needs-deeper-research`, other unresolved state | `unverified` / `Unverified` with `value: null` |

Public source links may be displayed in normal UI for verified facts. Audit quotes, raw researcher output, raw verifier output, and verifier notes are stored in `matrix_fact_attempts` or `matrix_fact_verifications` for review and audit only; the public matrix API does not return them. In short: public source links are UI-safe, while audit-only quotes and raw agent output are private review records.

---

## Database Schema

23 tables on MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci). Full DDL in `scripts/db-schema.sql`.

### Core Entities

| Table               | PK                     | Purpose                                                                   |
| ------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `catalog_entries`   | Auto ID, unique `slug` | Unified entity table for alternatives, US vendors, denied entries, drafts |
| `categories`        | Slug ID                | Category definitions with emoji, i18n name/description                    |
| `countries`         | ISO alpha-2 code       | Country lookup with i18n labels                                           |
| `tags`              | Auto ID, unique `slug` | Normalized tag slugs                                                      |
| `schema_migrations` | Version string         | Tracks applied schema versions                                            |

### Relationships

| Table                | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `entry_categories`   | M:N entries-to-categories (with `is_primary` flag)                              |
| `entry_tags`         | M:N entries-to-tags (ordered)                                                   |
| `entry_replacements` | Which US vendors an alternative replaces (ordered, with optional FK resolution) |

### Matrix Criteria & Facts

| Table                       | Purpose                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `matrix_criterion_groups`   | Category-owned groups for comparison matrix rows                                         |
| `matrix_criteria`           | Category-specific matrix criteria, value types, filter modes, and sort order             |
| `matrix_criterion_options`  | Allowed enum or multi-enum options for matrix criteria                                   |
| `matrix_facts`              | Current public fact value per entry and criterion, with public source metadata           |
| `matrix_fact_attempts`      | Audit trail of research attempts, proposed values, audit quotes, and raw model responses |
| `matrix_fact_verifications` | Independent audit verification records for research attempts                             |

### Display & Mapping

| Table                 | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `category_us_vendors` | Per-category "Replaces X, Y, Z" display order |

### Trust & Scoring

| Table              | Purpose                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `reservations`     | Trust penalty evidence per entry (severity, penalty tier/amount, i18n text) |
| `positive_signals` | Trust-positive evidence per entry (dimension, amount, i18n text)            |
| `scoring_metadata` | Per-entry scoring config (base class override, ad-surveillance flag)        |

Trust scores are dynamically computed on every API request by `api/catalog/scoring.php` from reservations, positive signals, and scoring metadata. No scores are stored in the database.

### Editorial & Landing

| Table                       | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `denied_decisions`          | Denial reasoning for rejected alternatives (failed gateways, sources) |
| `further_reading_resources` | Curated external resource links                                       |
| `landing_category_groups`   | Groups for landing page display                                       |
| `landing_group_categories`  | M:N landing groups-to-categories                                      |

### Key Constraints

- `catalog_entries.chk_openness`: `is_open_source` and `open_source_level` must be mutually consistent.
- `entry_categories`: at most one primary category per entry (enforced via generated column + unique index).
- All i18n columns use column-based storage (`_en` / `_de` suffixes), not a separate translations table.

---

## Scripts Reference

| Script                               | Language | Purpose                                                                                        |
| ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `scripts/db-schema.sql`              | SQL      | Full DDL for all 23 tables (run via `mysql` CLI)                                               |
| `scripts/db-import.php`              | PHP      | Read `catalog.json`, seed catalog and matrix tables in a single transaction with advisory lock |
| `scripts/matrix-research-select.php` | PHP      | Select and claim one open or retry matrix fact for the external research loop, with targeting and dry-run support |
| `scripts/matrix-research-run.mjs`    | Node.js  | Run one `codex` or `claude` researcher against one selected fact, with mock response support   |
| `scripts/matrix-verify-run.mjs`      | Node.js  | Run three independent `codex` or `claude` verifier slots for one pending attempt, with mock response support |
| `scripts/matrix-research-persist.php` | PHP     | Persist one research attempt, optional verifier decision, audit rows, and final fact status    |
| `scripts/matrix-research-loop.mjs`   | Node.js  | Repeatedly drive the one-fact matrix research pipeline until a limit fires or the queue is empty |
| `scripts/db-backup.sh`               | Bash     | Backup the MySQL database                                                                      |
| `scripts/db-restore.sh`              | Bash     | Restore a database backup                                                                      |

### Matrix Research Selector

Use the selector when an operator or automation loop needs exactly one open or `needs-deeper-research` matrix fact to research:

```bash
php scripts/matrix-research-select.php [--category messaging] [--entry primary-chat] [--criterion e2ee] [--dry-run]
```

Target options can be combined:

- `--category <category_id>` selects within one matrix category.
- `--entry <entry_slug>` or `--entry-slug <entry_slug>` selects within one catalog entry.
- `--criterion <criterion_key>` selects within one criterion key.

Without target options, the selector chooses the next open fact, then retry facts marked `needs-deeper-research`, across active alternatives. Partial targets choose the next eligible fact within that scope. A real run marks the selected fact as `researching`; `--dry-run` prints the target that would be selected without writing to the database.

Successful selections print JSON to stdout:

```json
{
  "factId": 123,
  "categoryId": "messaging",
  "categoryName": "Messaging",
  "entrySlug": "primary-chat",
  "entryName": "Primary Chat",
  "criterionKey": "e2ee",
  "criterionLabel": "End-to-end encryption",
  "valueType": "boolean",
  "previousStatus": "open",
  "status": "researching",
  "dryRun": false
}
```

In dry-run mode, `dryRun` is `true` and `status` remains the previous fact status.

| Exit code | Meaning                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `0`       | A fact was selected, or dry-run found the fact that would be selected.                                                                 |
| `2`       | No open or retry matrix fact matched the requested scope. The script prints `No open matrix fact available for the requested scope.` to stderr. |
| `64`      | Invalid CLI usage, such as an unknown option or a missing option value.                                                                |
| `1`       | Database or unexpected runtime failure.                                                                                                |

### One-Fact Matrix Research Workflow

The matrix research loop is deliberately one fact at a time. One script invocation researches one fact only and must not batch multiple categories, entries, criteria, products, or adjacent facts.

1. Select and claim one target:

   ```bash
   php scripts/matrix-research-select.php --category messaging --entry primary-chat --criterion e2ee
   ```

   Store the selected target JSON for the next step. The target includes the fact ID, category, entry slug, criterion key, value type, previous status, and current `researching` status.

2. Research exactly that selected fact:

   ```bash
   node scripts/matrix-research-run.mjs --researcher codex --target-file ./tmp/matrix-target.json
   ```

   `--researcher` supports `codex` and `claude`. The researcher output must answer one fact only and include an accessible source URL, source title when available, accessed date, one short audit quote copied from the source, confidence, and raw response metadata. A sourced proposed value becomes a `needs-verification` attempt. No evidence, an inaccessible source, or an unsuitable answer becomes `needs-deeper-research`.

   Deterministic tests can pass `--mock-response-file <path>` instead of invoking a live CLI. Mock files are test fixtures, not live research evidence.

3. If the attempt status is `needs-verification`, run three independent verifier slots:

   ```bash
   node scripts/matrix-verify-run.mjs --verifier codex --attempt-bundle-file ./tmp/matrix-attempt-bundle.json
   ```

   `--verifier` supports `codex` and `claude`. The three independent verifier rule requires each verifier slot to independently verify the same one pending attempt without relying on other verifier outputs. To count, each verifier record must satisfy the accessible-source quote requirement: it must use an accessible source and include its own source URL, accessed date, audit quote, verdict, notes, and raw response. Verified persistence requires three countable verifier records, one from each slot. Missing, inaccessible, or non-counting verifier evidence leaves the fact unresolved and normally returns it to `needs-deeper-research`.

   Tests can use `--mock-response-file` three times, `--mock-response-files <paths>`, or `--mock-response-dir <path>` containing `response-1.txt`, `response-2.txt`, and `response-3.txt`.

4. Persist the one-fact outcome:

   ```bash
   php scripts/matrix-research-persist.php --attempt-file ./tmp/matrix-attempt.json --decision-file ./tmp/matrix-decision.json
   ```

   Persistence writes the attempt, optional verifier decision, verifier audit rows, and final `matrix_facts` status in one transaction. A `needs-deeper-research` research attempt can be persisted without verifier rows. Pending verification attempts require a verifier decision. Verified outcomes publish the typed value and public source metadata to `matrix_facts`; rejected and retry outcomes keep the public value and public source fields empty so the API continues to show `Unverified`.

### Matrix Research Loop Runner

`scripts/matrix-research-loop.mjs` is an automation wrapper around the one-fact workflow above. It calls the selector, researcher, verifier, and persister in sequence, one fact per iteration, and continues until either a configured limit fires or the selector reports no eligible facts remain. The wrapper never bypasses the one-fact-per-invocation contract of the inner scripts; every stage is spawned as a separate subprocess.

```bash
node scripts/matrix-research-loop.mjs [options]
```

Default behavior with no flags: process eligible facts until the selector returns exit `2` ("no open matrix fact available").

Options (all opt-in; no implicit defaults are applied when a flag is absent):

- `--max-facts N` — stop after `N` processed iterations.
- `--max-runtime MIN` — stop when wall-clock elapsed reaches `MIN` minutes (fractional minutes accepted).
- `--max-consecutive-failures N` — stop after `N` failed iterations in a row. A successful iteration resets the streak.
- `--category SLUG` — forwarded to the selector as `--category SLUG` so only facts in that category are processed.
- `--selector-cmd <cmd>`, `--researcher-cmd <cmd>`, `--verifier-cmd <cmd>`, `--persister-cmd <cmd>` — override the shell command for each stage. Used by tests; production runs leave these unset.

Both `--flag value` and `--flag=value` forms are accepted for every option.

The runner's default stage wiring matches the manual workflow above. The verifier and persister each take their structured inputs through the file-based flags the inner scripts already expose: the runner writes the `{ target, attempt }` bundle to a per-iteration temp file under `tmp/` and appends `--attempt-bundle-file <path>` to the verifier command, and writes the attempt and decision to two separate temp files and appends `--attempt-file <path> --decision-file <path>` to the persister command. Temp files are cleaned up after each iteration. When `--verifier-cmd` or `--persister-cmd` is supplied, the runner does not inject any file flags — the operator owns the full command and receives the bundle on stdin instead.

The runner prints one compact line per completed iteration to stdout (`[iter 12] fact=987 status=verified`) and a final end summary with counts for `verified`, `rejected`, `needs-deeper-research`, `skipped`, `failed`, `no-open`, plus `processed` and `elapsed-ms`. `skipped` covers persister outcomes that fall outside the three real fact statuses; `failed` covers any non-zero exit, empty stdout, or invalid JSON from selector, researcher, verifier, or persister.

| Exit code | Meaning                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `0`       | The loop reached a stop condition cleanly (queue empty, limit hit, or consecutive-failure cap reached).                                |
| `1`       | The selector reported invalid usage (exit `64`), or the runner itself encountered an unexpected error.                                 |
| `64`      | Invalid runner CLI usage, such as an unknown option or a non-positive value for a numeric flag.                                        |

---

## Production Secrets

Database credentials are stored outside the web root on Hostinger:

```
/home/u688914453/.secrets/euroalt-db-env.php
```

Uses `putenv(...)` format.

Required variables:

- `EUROALT_DB_HOST`
- `EUROALT_DB_PORT`
- `EUROALT_DB_NAME`
- `EUROALT_DB_USER`
- `EUROALT_DB_PASS`
- `EUROALT_DB_CHARSET`

Optional TLS variables for remote MySQL:

- `EUROALT_DB_SSL_CA`
- `EUROALT_DB_SSL_CAPATH`
- `EUROALT_DB_SSL_CERT`
- `EUROALT_DB_SSL_KEY`
- `EUROALT_DB_SSL_CIPHER`
- `EUROALT_DB_SSL_VERIFY_SERVER_CERT`
- `EUROALT_DB_REQUIRE_TLS`

Loopback development (`localhost`, `127.0.0.1`, `::1`) may leave these unset, empty, or `0`.

Remote database hosts must set `EUROALT_DB_REQUIRE_TLS=1`, must provide `EUROALT_DB_SSL_CA` (or `EUROALT_DB_SSL_CAPATH`), and must set `EUROALT_DB_SSL_VERIFY_SERVER_CERT=1`. The app rejects non-loopback DB configs that do not meet that contract.

Remote deployments should also keep MySQL secure transport mandatory on the server or account side (`require_secure_transport=ON`, `REQUIRE SSL`, or `REQUIRE X509`). PDO's TLS attributes add the client materials and verification settings, while the server-side requirement prevents fallback to plaintext if encrypted transport cannot be established.

See `api/config/db.env.example.php` for the template.

For local development, set environment variables or point `EUROALT_ENV_LOADER` to a local env loader file.

---

## Architecture Overview

```
MySQL 8.0  <---  PHP API endpoints (read-only, batch queries, 5min cache)
                        |
                        v
                  React Frontend (fetches on mount via CatalogContext)
```

Import is idempotent: each run deletes all rows (in reverse FK order) and re-inserts within the same transaction. Concurrent imports are prevented by a MySQL advisory lock.
