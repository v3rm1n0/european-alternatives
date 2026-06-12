import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "076-playnite-logo-path";
const migrationUrl = new URL(
  "../scripts/migrations/076-playnite-logo-path.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

describe("Playnite logo path migration", () => {
  it("sets the Playnite logo path", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toMatch(/UPDATE\s+`catalog_entries`/i);
    expect(sql).toContain("'playnite'");
    expect(sql).toContain("'/logos/playnite.svg'");
    expect(existsSync(new URL("../public/logos/playnite.svg", import.meta.url))).toBe(true);
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
