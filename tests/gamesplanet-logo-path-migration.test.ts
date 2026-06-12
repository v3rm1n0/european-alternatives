import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "075-gamesplanet-logo-path";
const migrationUrl = new URL(
  "../scripts/migrations/075-gamesplanet-logo-path.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

describe("Gamesplanet logo path migration", () => {
  it("sets the Gamesplanet logo path", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toMatch(/UPDATE\s+`catalog_entries`/i);
    expect(sql).toContain("'gamesplanet'");
    expect(sql).toContain("'/logos/gamesplanet.svg'");
    expect(existsSync(new URL("../public/logos/gamesplanet.svg", import.meta.url))).toBe(true);
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
