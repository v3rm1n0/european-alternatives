import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "071-e-readers-logo-paths";
const migrationUrl = new URL(
  "../scripts/migrations/071-e-readers-logo-paths.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

const expectedLogoPaths = [
  "/logos/amazon-kindle.svg",
  "/logos/rakuten-kobo.svg",
  "/logos/boox.svg",
  "/logos/pocketbook.svg",
  "/logos/remarkable.svg",
];

describe("e-readers logo paths migration", () => {
  it("sets logo paths for all e-reader products", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toMatch(/UPDATE\s+`catalog_entries`/i);
    expect(normalizedSql).toMatch(/CASE\s+`slug`/i);

    for (const logoPath of expectedLogoPaths) {
      expect(sql).toContain(logoPath);
    }
  });

  it("has matching checked-in logo assets", () => {
    for (const logoPath of expectedLogoPaths) {
      const logoUrl = new URL(`../public${logoPath}`, import.meta.url);
      expect(existsSync(logoUrl), `Expected ${logoPath} to exist`).toBe(true);
    }
  });

  it("records the schema migration version", () => {
    expect(normalizedSql).toMatch(
      new RegExp(
        `INSERT\\s+INTO\\s+\`schema_migrations\`\\s+\\(\`version\`\\)\\s+VALUES\\s+\\('${migrationVersion}'\\)`,
        "i",
      ),
    );
  });
});
