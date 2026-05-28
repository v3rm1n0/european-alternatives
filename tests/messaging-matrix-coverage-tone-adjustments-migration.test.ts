import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "055-messaging-matrix-coverage-tone-adjustments";
const migrationUrl = new URL(
  "../scripts/migrations/055-messaging-matrix-coverage-tone-adjustments.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const rawMigration = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const migrationSql = stripSqlComments(rawMigration);
const normalizedMigration = normalizeSql(migrationSql);

const expectedOptionToneUpdates = [
  ["supported_identifiers", "protocol_address", "positive"],
  ["supported_identifiers", "device_local", "positive"],
  ["contact_discovery_methods", "invite_link", "positive"],
  ["contact_discovery_methods", "qr_code", "positive"],
  ["screenshot_or_forwarding_controls", "screenshot_warning", "positive"],
  ["screenshot_or_forwarding_controls", "screenshot_blocking", "positive"],
  ["screenshot_or_forwarding_controls", "forwarding_limits", "positive"],
  ["backup_model", "none", "negative"],
  ["account_transfer_model", "unsupported", "negative"],
] as const;

describe(`migration ${migrationVersion}`, () => {
  it("exists as a numbered migration file under scripts/migrations/", () => {
    expect(migrationExists, migrationUrl.pathname).toBe(true);
    expect(rawMigration.trim()).not.toBe("");
  });

  it("marks public rooms/channels as beneficial when present", () => {
    expect(normalizedMigration).toMatch(/UPDATE\s+`matrix_criteria`/i);
    expect(normalizedMigration).toContain("'messaging'");
    expect(normalizedMigration).toContain("'public_rooms_or_channels'");
    expect(normalizedMigration).toMatch(/SET\s+`semantics`\s+=\s+'beneficial'/i);
  });

  it("updates the confirmed Messaging option tones", () => {
    expect(normalizedMigration).toMatch(
      /UPDATE\s+`matrix_criterion_options`\s+mco\s+JOIN\s+`matrix_criteria`\s+mc/i,
    );

    for (const [criterionKey, optionKey, displayTone] of expectedOptionToneUpdates) {
      expect(normalizedMigration).toContain(`'${criterionKey}'`);
      expect(normalizedMigration).toContain(`'${optionKey}'`);
      expect(normalizedMigration).toMatch(
        new RegExp(
          `'${escapeRegExp(criterionKey)}'[\\s\\S]{0,180}'${escapeRegExp(
            optionKey,
          )}'[\\s\\S]{0,100}THEN\\s+'${escapeRegExp(displayTone)}'`,
          "i",
        ),
      );
    }
  });

  it("leaves download restrictions as an explicit tradeoff rather than making every restriction green", () => {
    expect(normalizedMigration).not.toMatch(
      /'download_restrictions'[\s\S]{0,80}THEN\s+'positive'/i,
    );
  });

  it("does not alter matrix facts, scoring, or product research data", () => {
    for (const forbiddenTable of [
      "matrix_facts",
      "matrix_fact_attempts",
      "matrix_fact_verifications",
      "reservations",
      "positive_signals",
      "scoring_metadata",
    ]) {
      expect(normalizedMigration).not.toMatch(
        new RegExp(
          `\\b(?:INSERT|UPDATE|DELETE|ALTER)\\b[\\s\\S]{0,80}\\b\`?${escapeRegExp(
            forbiddenTable,
          )}\`?\\b`,
          "i",
        ),
      );
    }

    expect(normalizedMigration).not.toMatch(/\btrust_score\b/i);
    expect(normalizedMigration).not.toMatch(/\bpenalty\b/i);
  });

  it("records the schema migration version", () => {
    expect(normalizedMigration).toMatch(
      /INSERT\s+INTO\s+`schema_migrations`\s+\(`version`\)\s+VALUES\s+\('055-messaging-matrix-coverage-tone-adjustments'\)/i,
    );
  });
});

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\r\n]*/g, "");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
