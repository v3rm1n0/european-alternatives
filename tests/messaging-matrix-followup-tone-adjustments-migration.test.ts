import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "054-messaging-matrix-followup-tone-adjustments";
const migrationUrl = new URL(
  "../scripts/migrations/054-messaging-matrix-followup-tone-adjustments.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const rawMigration = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const migrationSql = stripSqlComments(rawMigration);
const normalizedMigration = normalizeSql(migrationSql);

const expectedOptionToneUpdates = [
  ["network_architecture", "local_mesh", "positive"],
  ["network_architecture", "email_based", "tradeoff"],
  ["server_side_components", "hosted_service", "negative"],
  ["server_side_components", "no_central_server", "positive"],
  ["metadata_protection_level", "p2p_or_local", "positive"],
  ["push_delivery_model", "local_polling", "positive"],
  ["group_admin_tools", "invite_links", "positive"],
  ["external_interoperability", "bridges", "positive"],
] as const;

describe(`migration ${migrationVersion}`, () => {
  it("exists as a numbered migration file under scripts/migrations/", () => {
    expect(migrationExists, migrationUrl.pathname).toBe(true);
    expect(rawMigration.trim()).not.toBe("");
  });

  it("marks bot integrations as a beneficial Messaging feature", () => {
    expect(normalizedMigration).toMatch(/UPDATE\s+`matrix_criteria`/i);
    expect(normalizedMigration).toContain("'messaging'");
    expect(normalizedMigration).toContain("'bot_integration_support'");
    expect(normalizedMigration).toMatch(/SET\s+`semantics`\s+=\s+'beneficial'/i);
  });

  it("updates the confirmed follow-up Messaging option tones", () => {
    expect(normalizedMigration).toMatch(
      /UPDATE\s+`matrix_criterion_options`\s+mco\s+JOIN\s+`matrix_criteria`\s+mc/i,
    );

    for (const [criterionKey, optionKey, displayTone] of expectedOptionToneUpdates) {
      expect(normalizedMigration).toContain(`'${criterionKey}'`);
      expect(normalizedMigration).toContain(`'${optionKey}'`);
      expect(normalizedMigration).toMatch(
        new RegExp(
          `'${escapeRegExp(criterionKey)}'[\\s\\S]{0,140}'${escapeRegExp(
            optionKey,
          )}'[\\s\\S]{0,80}THEN\\s+'${escapeRegExp(displayTone)}'`,
          "i",
        ),
      );
    }
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
      /INSERT\s+INTO\s+`schema_migrations`\s+\(`version`\)\s+VALUES\s+\('054-messaging-matrix-followup-tone-adjustments'\)/i,
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
