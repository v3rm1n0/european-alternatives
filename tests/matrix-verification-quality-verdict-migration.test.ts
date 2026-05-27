import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "050-matrix-verification-quality-verdict";
const migrationUrl = new URL(
  "../scripts/migrations/050-matrix-verification-quality-verdict.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const rawMigration = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const migrationSql = stripSqlComments(rawMigration);
const normalizedMigration = normalizeSql(migrationSql);

const expectedVerdicts = [
  "supports",
  "contradicts",
  "inconclusive",
  "source-inaccessible",
  "source-quality-rejected",
  "not-applicable",
];

describe(`migration ${migrationVersion}`, () => {
  it("exists as a numbered migration file under scripts/migrations/", () => {
    expect(migrationExists, migrationUrl.pathname).toBe(true);
    expect(rawMigration.trim()).not.toBe("");
  });

  it("alters matrix_fact_verifications.verdict and not any other table or column", () => {
    expect(normalizedMigration).toMatch(
      /ALTER TABLE\s+`matrix_fact_verifications`/i,
    );
    expect(normalizedMigration).toMatch(/MODIFY COLUMN\s+`verdict`/i);
    expect(normalizedMigration).not.toMatch(/DROP\s+/i);
    expect(normalizedMigration).not.toMatch(/TRUNCATE\s+/i);
    expect(normalizedMigration).not.toMatch(/DELETE\s+FROM/i);
    expect(normalizedMigration).not.toMatch(
      /ALTER TABLE\s+`(?!matrix_fact_verifications`)/i,
    );
  });

  it("defines the verdict ENUM with exactly the six expected values, NOT NULL, in order", () => {
    const verdictEnumPattern = new RegExp(
      "`verdict`\\s+ENUM\\(\\s*" +
        expectedVerdicts
          .map((value) => `'${escapeRegExp(value)}'`)
          .join("\\s*,\\s*") +
        "\\s*\\)\\s+NOT NULL",
      "i",
    );

    expect(normalizedMigration).toMatch(verdictEnumPattern);

    for (const verdict of expectedVerdicts) {
      expect(normalizedMigration, `verdict ${verdict}`).toContain(
        `'${verdict}'`,
      );
    }
  });

  it("matches the db-schema.sql verdict ENUM definition for the verifications table", () => {
    const schemaUrl = new URL(
      "../scripts/db-schema.sql",
      import.meta.url,
    );
    const schema = normalizeSql(stripSqlComments(readFileSync(schemaUrl, "utf8")));

    const schemaEnumMatch = schema.match(
      /`verdict`\s+ENUM\(([^)]*)\)\s+NOT NULL/i,
    );

    expect(schemaEnumMatch, "db-schema.sql verdict ENUM").not.toBeNull();

    const migrationEnumMatch = normalizedMigration.match(
      /`verdict`\s+ENUM\(([^)]*)\)\s+NOT NULL/i,
    );

    expect(migrationEnumMatch, "migration verdict ENUM").not.toBeNull();

    const normalizeEnum = (raw: string): string[] =>
      raw
        .split(",")
        .map((piece) => piece.trim().replace(/^'(.*)'$/u, "$1"));

    expect(normalizeEnum((migrationEnumMatch ?? [])[1] ?? "")).toEqual(
      normalizeEnum((schemaEnumMatch ?? [])[1] ?? ""),
    );
  });

  it("is additive — keeps every pre-existing verdict value so no rows are invalidated", () => {
    for (const preExisting of [
      "supports",
      "contradicts",
      "inconclusive",
      "source-inaccessible",
      "not-applicable",
    ]) {
      expect(normalizedMigration, preExisting).toContain(`'${preExisting}'`);
    }
  });
});

function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
