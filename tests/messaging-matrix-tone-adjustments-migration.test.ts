import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "053-messaging-matrix-tone-adjustments";
const migrationUrl = new URL(
  "../scripts/migrations/053-messaging-matrix-tone-adjustments.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const rawMigration = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const migrationSql = stripSqlComments(rawMigration);
const normalizedMigration = normalizeSql(migrationSql);

describe(`migration ${migrationVersion}`, () => {
  it("exists as a numbered migration file under scripts/migrations/", () => {
    expect(migrationExists, migrationUrl.pathname).toBe(true);
    expect(rawMigration.trim()).not.toBe("");
  });

  it("marks confirmed Messaging feature criteria as beneficial", () => {
    expect(normalizedMigration).toMatch(/UPDATE\s+`matrix_criteria`/i);
    expect(normalizedMigration).toContain("'messaging'");

    for (const criterionKey of [
      "multiple_accounts",
      "self_hosting_available",
      "third_party_clients",
    ]) {
      expect(normalizedMigration).toContain(`'${criterionKey}' THEN 'beneficial'`);
      expect(normalizedMigration).toContain(`'${criterionKey}'`);
    }
  });

  it("updates confirmed Messaging option tones from the user perspective", () => {
    expect(normalizedMigration).toMatch(
      /UPDATE\s+`matrix_criterion_options`\s+mco\s+JOIN\s+`matrix_criteria`\s+mc/i,
    );

    expect(normalizedMigration).toContain("'centralized'");
    expect(normalizedMigration).toContain("THEN 'negative'");
    expect(normalizedMigration).toMatch(
      /'federated'\s*,\s*'peer_to_peer'[\s\S]{0,80}THEN\s+'positive'/i,
    );
    expect(normalizedMigration).toMatch(
      /'platform_push'[\s\S]{0,80}THEN\s+'warning'/i,
    );
    expect(normalizedMigration).toMatch(
      /'reactions'\s*,\s*'replies'\s*,\s*'threads'\s*,\s*'quotes'[\s\S]{0,80}THEN\s+'positive'/i,
    );
    expect(normalizedMigration).toMatch(
      /'scheduled_send'\s*,\s*'pinned_messages'\s*,\s*'bookmarks_saved'[\s\S]{0,80}THEN\s+'positive'/i,
    );
    expect(normalizedMigration).toMatch(
      /'fit_profiles'[\s\S]{0,80}THEN\s+'neutral'/i,
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
      /INSERT\s+INTO\s+`schema_migrations`\s+\(`version`\)\s+VALUES\s+\('053-messaging-matrix-tone-adjustments'\)/i,
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
