import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  "scripts/migrations/056-category-benchmark-memberships.sql",
);

function readMigration(): string {
  expect(
    existsSync(migrationPath),
    "Expected migration 056 to backfill category benchmark memberships.",
  ).toBe(true);

  return readFileSync(migrationPath, "utf8");
}

describe("category benchmark membership migration", () => {
  it("maps category_us_vendors rows to regular category memberships", () => {
    const sql = readMigration();

    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`?entry_categories`?/i);
    expect(sql).toMatch(/FROM\s+`?category_us_vendors`?\s+cuv/i);
    expect(sql).toMatch(/JOIN\s+`?catalog_entries`?\s+ce/i);
    expect(sql).toMatch(/ce\.`?status`?\s*=\s*'us'/i);
    expect(sql).toMatch(/ce\.`?is_active`?\s*=\s*1/i);
    expect(sql).toMatch(/cuv\.`?sort_order`?/i);
  });

  it("initializes missing matrix facts for active alternative and US category members", () => {
    const sql = readMigration();

    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?/i);
    expect(sql).toMatch(/JOIN\s+`?entry_categories`?\s+ec/i);
    expect(sql).toMatch(/JOIN\s+`?matrix_criteria`?\s+mc/i);
    expect(sql).toMatch(
      /ce\.`?status`?\s+IN\s*\(\s*'alternative'\s*,\s*'us'\s*\)/i,
    );
  });

  it("records the schema migration version", () => {
    const sql = readMigration();

    expect(sql).toMatch(
      /INSERT\s+INTO\s+`?schema_migrations`?\s*\(\s*`?version`?\s*\)\s*VALUES\s*\(\s*'056-category-benchmark-memberships'\s*\)/i,
    );
  });
});
