import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "073-game-stores-german-category-description";
const migrationUrl = new URL(
  "../scripts/migrations/073-game-stores-german-category-description.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

describe("game stores German category description migration", () => {
  it("updates the already-applied category row with native German spelling", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toMatch(/UPDATE\s+`categories`/i);
    expect(sql).toContain("'game-stores'");
    expect(sql).toContain(
      "'Game-Stores, Launcher, Bibliotheksmanager und Kompatibilitäts-Runner'",
    );
    expect(sql).not.toContain("Kompatibilitaets");
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
