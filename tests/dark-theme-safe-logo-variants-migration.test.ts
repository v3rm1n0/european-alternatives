import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "080-dark-theme-safe-logo-variants";
const migrationUrl = new URL(
  "../scripts/migrations/080-dark-theme-safe-logo-variants.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

const expectedLogoPaths = [
  "/logos/bluecode-dark-safe.png",
  "/logos/collabora-online-dark-safe.png",
  "/logos/deepl-dark-safe.png",
  "/logos/disroot-dark-safe.png",
  "/logos/duplicati-dark-safe.png",
  "/logos/filen-dark-safe.png",
  "/logos/freebsd-dark-safe.png",
  "/logos/gnu-taler-dark-safe.png",
  "/logos/hedgedoc-dark-safe.png",
  "/logos/hostinger-dark-safe.png",
  "/logos/internxt-dark-safe.png",
  "/logos/ionos-dark-safe.png",
  "/logos/matomo-dark-safe.png",
  "/logos/mattermost-dark-safe.png",
  "/logos/mullvad-browser-dark-safe.png",
  "/logos/mullvad-vpn-dark-safe.png",
  "/logos/netcup-dark-safe.png",
  "/logos/opencloud-dark-safe.png",
  "/logos/opensearch-dark-safe.png",
  "/logos/organic-maps-dark-safe.png",
  "/logos/ovhcloud-dark-safe.png",
  "/logos/paperless-ngx-dark-safe.png",
  "/logos/pexip-dark-safe.png",
  "/logos/piper-dark-safe.png",
  "/logos/qobuz-dark-safe.png",
  "/logos/sailfish-os-dark-safe.png",
  "/logos/scaleway-dark-safe.png",
  "/logos/tor-browser-dark-safe.png",
  "/logos/tuta-dark-safe.png",
  "/logos/xmpp-dark-safe.png",
  "/logos/zen-browser-dark-safe.png",
];

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("dark-theme-safe logo variants migration", () => {
  it("points low-contrast logo entries at their dark-safe variants", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toContain("UPDATE `catalog_entries`");

    for (const logoPath of expectedLogoPaths) {
      expect(normalizedSql).toContain(`THEN '${logoPath}'`);
    }
  });

  it("has checked-in PNG assets for every referenced logo path", () => {
    for (const logoPath of expectedLogoPaths) {
      const logoUrl = new URL(`../public${logoPath}`, import.meta.url);
      expect(existsSync(logoUrl), `Expected ${logoPath} to exist`).toBe(true);

      const bytes = readFileSync(logoUrl).subarray(0, pngSignature.length);
      expect(bytes.equals(pngSignature), `Expected ${logoPath} to be a PNG`).toBe(true);
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
