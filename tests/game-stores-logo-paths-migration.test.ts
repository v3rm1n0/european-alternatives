import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "072-game-stores-logo-paths";
const migrationUrl = new URL(
  "../scripts/migrations/072-game-stores-logo-paths.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

const expectedLogoPaths = [
  "/logos/steam.svg",
  "/logos/epic-games-store.svg",
  "/logos/ea-app.svg",
  "/logos/ubisoft-connect.svg",
  "/logos/battle.net.svg",
  "/logos/xbox-app.svg",
  "/logos/playstation-store.svg",
  "/logos/amazon-game-studios.svg",
  "/logos/humble-bundle.svg",
  "/logos/gog.svg",
  "/logos/heroic-games-launcher.svg",
  "/logos/lutris.svg",
  "/logos/pegasus-frontend.svg",
  "/logos/eneba.svg",
  "/logos/gamegator.svg",
  "/logos/game-jolt.svg",
  "/logos/itch.io.svg",
];

describe("game stores logo paths migration", () => {
  it("sets logo paths for all game-store products and benchmarks", () => {
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
