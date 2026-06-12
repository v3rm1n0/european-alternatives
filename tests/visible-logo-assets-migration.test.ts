import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "079-visible-logo-assets";
const migrationUrl = new URL(
  "../scripts/migrations/079-visible-logo-assets.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

const expectedLogoPaths = [
  "/logos/vaultwarden-logo.svg",
  "/logos/codeberg-logo.svg",
  "/logos/iodeos-logo.svg",
  "/logos/piwik-pro-logo.svg",
];

describe("visible logo assets migration", () => {
  it("points the affected entries at cache-busting SVG logo assets", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toContain("UPDATE `catalog_entries`");

    for (const logoPath of expectedLogoPaths) {
      expect(normalizedSql).toContain(`THEN '${logoPath}'`);
    }
  });

  it("has checked-in assets for every referenced logo path", () => {
    for (const logoPath of expectedLogoPaths) {
      expect(existsSync(new URL(`../public${logoPath}`, import.meta.url))).toBe(true);
    }
  });

  it("uses self-contained SVGs without external image references", () => {
    for (const logoPath of expectedLogoPaths) {
      const svg = readFileSync(new URL(`../public${logoPath}`, import.meta.url), "utf8");
      expect(svg).toContain("<svg");
      expect(svg).not.toMatch(/<image\b/i);
      expect(svg).not.toMatch(/\bhref=/i);
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
