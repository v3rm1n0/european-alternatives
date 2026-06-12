import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "077-active-catalog-logo-backfill";
const migrationUrl = new URL(
  "../scripts/migrations/077-active-catalog-logo-backfill.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();
function parseConcatArgs(args: string): string {
  return [...args.matchAll(/'([^']*)'/g)].map((match) => match[1]).join("");
}

const literalLogoPaths = [...sql.matchAll(/THEN '([^']+)'/g)].map((match) => match[1]);
const concatLogoPaths = [...sql.matchAll(/THEN CONCAT\(([^)]*)\)/g)].map((match) =>
  parseConcatArgs(match[1]),
);
const logoPaths = [...literalLogoPaths, ...concatLogoPaths];

describe("active catalog logo backfill migration", () => {
  it("updates active catalog entries that previously had no logo path", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toMatch(/UPDATE\s+`catalog_entries`/i);
    expect(normalizedSql).toMatch(/CASE\s+`slug`/i);
    expect(logoPaths.length).toBe(512);
    expect(new Set(logoPaths).size).toBe(logoPaths.length);
  });

  it("has checked-in assets for every backfilled logo path", () => {
    for (const logoPath of logoPaths) {
      const logoUrl = new URL(`../public${logoPath}`, import.meta.url);
      expect(existsSync(logoUrl), `Expected ${logoPath} to exist`).toBe(true);
    }
  });

  it("records the schema migration version", () => {
    expect(normalizedSql).toMatch(
      new RegExp(
        `INSERT\\s+INTO\\s+` +
          "`schema_migrations`" +
          `\\s+\\(` +
          "`version`" +
          `\\)\\s+VALUES\\s+\\('${migrationVersion}'\\)`,
        "i",
      ),
    );
  });
});
