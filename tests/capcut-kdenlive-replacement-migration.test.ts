import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  "scripts/migrations/066-capcut-kdenlive-replacement.sql",
);

function readMigration(): string {
  expect(
    existsSync(migrationPath),
    "Expected migration 066 to link Kdenlive to CapCut searches.",
  ).toBe(true);

  return readFileSync(migrationPath, "utf8");
}

describe("CapCut and Kdenlive replacement migration", () => {
  it("creates CapCut as a video-editing benchmark product", () => {
    const sql = readMigration();

    expect(sql).toMatch(/INSERT\s+INTO\s+`?countries`?/i);
    expect(sql).toContain("'cn', 'China', 'China'");
    expect(sql).toMatch(/INSERT\s+INTO\s+`?catalog_entries`?/i);
    expect(sql).toContain("'capcut'");
    expect(sql).toContain("'CapCut'");
    expect(sql).toMatch(/'us'\s*,\s*'us'\s*,\s*1\s*,\s*'CapCut'/i);
    expect(sql).toContain("'video-editing'");
    expect(sql).toMatch(/INSERT\s+INTO\s+`?category_us_vendors`?/i);
    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`?entry_categories`?/i);
    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`?us_vendor_aliases`?/i);
  });

  it("normalizes existing raw CapCut replacements and appends CapCut to Kdenlive", () => {
    const sql = readMigration();

    expect(sql).toMatch(/UPDATE\s+`?entry_replacements`?\s+er/i);
    expect(sql).toMatch(/LOWER\(er\.`?raw_name`?\)\s*=\s*'capcut'/i);
    expect(sql).toMatch(/er\.`?replaced_entry_id`?\s*=\s*capcut\.`?id`?/i);
    expect(sql).toMatch(/INSERT\s+INTO\s+`?entry_replacements`?/i);
    expect(sql).toMatch(/kdenlive\.`?slug`?\s*=\s*'kdenlive'/i);
    expect(sql).toMatch(/capcut\.`?slug`?\s*=\s*'capcut'/i);
    expect(sql).toMatch(/COALESCE\(MAX\(existing_er\.`?sort_order`?\),\s*-1\)\s*\+\s*1/i);
    expect(sql).toMatch(/NOT\s+EXISTS\s*\(/i);
  });

  it("initializes matrix facts and records the migration version", () => {
    const sql = readMigration();

    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?/i);
    expect(sql).toMatch(/mc\.`?category_id`?\s*=\s*'video-editing'/i);
    expect(sql).toMatch(
      /INSERT\s+INTO\s+`?schema_migrations`?\s*\(\s*`?version`?\s*\)\s*VALUES\s*\(\s*'066-capcut-kdenlive-replacement'\s*\)/i,
    );
  });
});
