import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "078-normalize-t-cloud-public-logo-path";
const logoPath = "/logos/t-cloud-public.svg";
const migrationUrl = new URL(
  "../scripts/migrations/078-normalize-t-cloud-public-logo-path.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

describe("T Cloud Public logo path migration", () => {
  it("normalizes the catalog logo path to a rooted static asset path", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toContain("UPDATE `catalog_entries`");
    expect(normalizedSql).toContain("WHERE `slug` = 't-cloud-public'");
    expect(normalizedSql).toContain(`SET \`logo_path\` = '${logoPath}'`);
    expect(normalizedSql).not.toContain("'logos/t-cloud-public.svg'");
  });

  it("has the referenced logo asset checked in", () => {
    expect(existsSync(new URL(`../public${logoPath}`, import.meta.url))).toBe(true);
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
