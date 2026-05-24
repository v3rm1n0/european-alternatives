import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const schema = readFileSync(
  new URL("../scripts/db-schema.sql", import.meta.url),
  "utf8",
);
const tableTail =
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

const factStatuses = [
  "open",
  "researching",
  "verified",
  "rejected",
  "needs-deeper-research",
  "not-applicable",
];

const proposedFactStatuses = [
  "open",
  "verified",
  "rejected",
  "needs-deeper-research",
  "not-applicable",
];

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function getTableStart(tableName: string): number {
  return schema.indexOf(`CREATE TABLE \`${tableName}\``);
}

function getTableBlock(tableName: string): string {
  const start = getTableStart(tableName);

  if (start === -1) {
    throw new Error(`Expected ${tableName} table in scripts/db-schema.sql`);
  }

  const end = schema.indexOf(tableTail, start);

  if (end === -1) {
    throw new Error(`Expected complete ${tableName} CREATE TABLE statement`);
  }

  return schema.slice(start, end + tableTail.length);
}

function expectColumn(
  block: string,
  columnName: string,
  definitionPattern: RegExp,
): void {
  expect(normalizeSql(block)).toMatch(
    new RegExp(`\`${columnName}\`\\s+${definitionPattern.source}`),
  );
}

function columnsPattern(columns: string[]): string {
  return columns.map((column) => `\`${column}\``).join("\\s*,\\s*");
}

function expectPrimaryAutoIncrementId(block: string): void {
  expectColumn(block, "id", /BIGINT\s+UNSIGNED\s+NOT NULL\s+AUTO_INCREMENT/);
  expect(normalizeSql(block)).toMatch(/PRIMARY KEY \(`id`\)/);
}

function expectUniqueKey(block: string, columns: string[]): void {
  expect(normalizeSql(block)).toMatch(
    new RegExp("UNIQUE KEY `[^`]+` \\(" + columnsPattern(columns) + "\\)"),
  );
}

function expectIndex(block: string, columns: string[]): void {
  expect(normalizeSql(block)).toMatch(
    new RegExp("(?:KEY|INDEX) `[^`]+` \\(" + columnsPattern(columns) + "\\)"),
  );
}

function expectForeignKey(
  block: string,
  columns: string[],
  referencedTable: string,
  referencedColumns: string[],
): void {
  expect(normalizeSql(block)).toMatch(
    new RegExp(
      "FOREIGN KEY \\(" +
        columnsPattern(columns) +
        "\\) REFERENCES `" +
        referencedTable +
        "` \\(" +
        columnsPattern(referencedColumns) +
        "\\) ON DELETE CASCADE",
    ),
  );
}

function expectEnumColumn(
  block: string,
  columnName: string,
  values: string[],
): void {
  expect(normalizeSql(block)).toMatch(
    new RegExp(
      `\`${columnName}\`\\s+ENUM\\(` +
        values.map((value) => `'${value}'`).join("\\s*,\\s*") +
        "\\)",
    ),
  );
}

function expectVerifierIndexCheck(block: string): void {
  const normalizedBlock = normalizeSql(block);

  expect(
    /CHECK \(`verifier_index` BETWEEN 1 AND 3\)/.test(normalizedBlock) ||
      /CHECK \(`verifier_index` IN \(1\s*,\s*2\s*,\s*3\)\)/.test(
        normalizedBlock,
      ) ||
      /CHECK \(`verifier_index` >= 1 AND `verifier_index` <= 3\)/.test(
        normalizedBlock,
      ),
  ).toBe(true);
}

describe("matrix fact database schema", () => {
  it("defines fact, attempt, and verification tables in dependency order", () => {
    const entryCategoriesIndex = getTableStart("entry_categories");
    const factsIndex = getTableStart("matrix_facts");
    const attemptsIndex = getTableStart("matrix_fact_attempts");
    const verificationsIndex = getTableStart("matrix_fact_verifications");
    const entryTagsIndex = getTableStart("entry_tags");

    expect(entryCategoriesIndex).toBeGreaterThan(-1);
    expect(factsIndex).toBeGreaterThan(entryCategoriesIndex);
    expect(attemptsIndex).toBeGreaterThan(factsIndex);
    expect(verificationsIndex).toBeGreaterThan(attemptsIndex);
    expect(entryTagsIndex).toBeGreaterThan(verificationsIndex);
  });

  it("stores one current fact per entry and criterion with category-safe foreign keys", () => {
    const facts = getTableBlock("matrix_facts");
    const criteria = getTableBlock("matrix_criteria");

    expectPrimaryAutoIncrementId(facts);
    expectColumn(facts, "entry_id", /BIGINT\s+UNSIGNED\s+NOT NULL/);
    expectColumn(facts, "category_id", /VARCHAR\(50\)\s+NOT NULL/);
    expectColumn(facts, "criterion_id", /BIGINT\s+UNSIGNED\s+NOT NULL/);
    expectUniqueKey(facts, ["entry_id", "criterion_id"]);
    expectForeignKey(facts, ["entry_id"], "catalog_entries", ["id"]);
    expectForeignKey(facts, ["entry_id", "category_id"], "entry_categories", [
      "entry_id",
      "category_id",
    ]);
    expectForeignKey(
      facts,
      ["category_id", "criterion_id"],
      "matrix_criteria",
      ["category_id", "id"],
    );
    expectUniqueKey(criteria, ["category_id", "id"]);
  });

  it("represents unverified and deeper-research fact states without deleting fact rows", () => {
    const facts = getTableBlock("matrix_facts");

    expectEnumColumn(facts, "status", factStatuses);
    expect(normalizeSql(facts)).toMatch(
      /`status`\s+ENUM\([^)]*'open'[^)]*'needs-deeper-research'[^)]*\)\s+NOT NULL\s+DEFAULT\s+'open'/,
    );
    expect(facts).not.toContain("'unverified'");
    expectColumn(facts, "value_bool", /TINYINT\(1\)\s+DEFAULT NULL/);
    expectColumn(facts, "value_number", /DECIMAL\(12,4\)\s+DEFAULT NULL/);
    expectColumn(facts, "value_text", /TEXT\s+DEFAULT NULL/);
    expectColumn(facts, "value_json", /JSON\s+DEFAULT NULL/);
  });

  it("keeps public fact source metadata separate from audit quotes and raw responses", () => {
    const facts = getTableBlock("matrix_facts");
    const attempts = getTableBlock("matrix_fact_attempts");
    const verifications = getTableBlock("matrix_fact_verifications");

    expectColumn(facts, "public_source_url", /VARCHAR\(2048\)\s+DEFAULT NULL/);
    expectColumn(facts, "public_source_title", /VARCHAR\(500\)\s+DEFAULT NULL/);
    expectColumn(facts, "public_source_accessed_date", /DATE\s+DEFAULT NULL/);
    expectColumn(
      facts,
      "selected_attempt_id",
      /BIGINT\s+UNSIGNED\s+DEFAULT NULL/,
    );
    expect(facts).not.toContain("`audit_quote`");
    expect(facts).not.toContain("`raw_response`");

    for (const block of [attempts, verifications]) {
      expectColumn(block, "source_url", /VARCHAR\(2048\)\s+DEFAULT NULL/);
      expectColumn(block, "source_title", /VARCHAR\(500\)\s+DEFAULT NULL/);
      expectColumn(block, "accessed_date", /DATE\s+DEFAULT NULL/);
      expectColumn(block, "audit_quote", /TEXT\s+DEFAULT NULL/);
      expectColumn(block, "raw_response", /LONGTEXT\s+DEFAULT NULL/);
    }
  });

  it("timestamps current facts, research attempts, and verification records", () => {
    for (const tableName of [
      "matrix_facts",
      "matrix_fact_attempts",
      "matrix_fact_verifications",
    ]) {
      const block = getTableBlock(tableName);

      expectColumn(
        block,
        "created_at",
        /DATETIME\s+NOT NULL\s+DEFAULT CURRENT_TIMESTAMP/,
      );
      expectColumn(
        block,
        "updated_at",
        /DATETIME\s+NOT NULL\s+DEFAULT CURRENT_TIMESTAMP\s+ON UPDATE CURRENT_TIMESTAMP/,
      );
    }
  });

  it("records proposed fact values and lifecycle state for each research attempt", () => {
    const attempts = getTableBlock("matrix_fact_attempts");

    expectPrimaryAutoIncrementId(attempts);
    expectColumn(attempts, "fact_id", /BIGINT\s+UNSIGNED\s+NOT NULL/);
    expectColumn(attempts, "agent", /VARCHAR\(100\)\s+NOT NULL/);
    expectColumn(attempts, "model", /VARCHAR\(100\)\s+DEFAULT NULL/);
    expectColumn(attempts, "command", /TEXT\s+DEFAULT NULL/);
    expectEnumColumn(attempts, "proposed_status", proposedFactStatuses);
    expectColumn(
      attempts,
      "proposed_value_bool",
      /TINYINT\(1\)\s+DEFAULT NULL/,
    );
    expectColumn(
      attempts,
      "proposed_value_number",
      /DECIMAL\(12,4\)\s+DEFAULT NULL/,
    );
    expectColumn(attempts, "proposed_value_text", /TEXT\s+DEFAULT NULL/);
    expectColumn(attempts, "proposed_value_json", /JSON\s+DEFAULT NULL/);
    expectEnumColumn(attempts, "status", [
      "proposed",
      "accepted",
      "rejected",
      "needs-verification",
      "needs-deeper-research",
      "error",
    ]);
    expect(normalizeSql(attempts)).toMatch(
      /`status`\s+ENUM\([^)]*'proposed'[^)]*'needs-deeper-research'[^)]*'error'[^)]*\)\s+NOT NULL\s+DEFAULT\s+'proposed'/,
    );
    expectForeignKey(attempts, ["fact_id"], "matrix_facts", ["id"]);
    expectIndex(attempts, ["fact_id", "status"]);
  });

  it("allows three independent verifier records per attempt with bounded slots", () => {
    const verifications = getTableBlock("matrix_fact_verifications");

    expectPrimaryAutoIncrementId(verifications);
    expectColumn(verifications, "attempt_id", /BIGINT\s+UNSIGNED\s+NOT NULL/);
    expectColumn(
      verifications,
      "verifier_index",
      /TINYINT\s+UNSIGNED\s+NOT NULL/,
    );
    expectColumn(verifications, "agent", /VARCHAR\(100\)\s+NOT NULL/);
    expectEnumColumn(verifications, "verdict", [
      "supports",
      "contradicts",
      "inconclusive",
      "source-inaccessible",
      "not-applicable",
    ]);
    expectColumn(verifications, "notes", /TEXT\s+DEFAULT NULL/);
    expectForeignKey(verifications, ["attempt_id"], "matrix_fact_attempts", [
      "id",
    ]);
    expectUniqueKey(verifications, ["attempt_id", "verifier_index"]);
    expectVerifierIndexCheck(verifications);
  });

  it("links selected public facts back to attempts without involving Trust Score tables", () => {
    const facts = getTableBlock("matrix_facts");
    const attempts = getTableBlock("matrix_fact_attempts");
    const verifications = getTableBlock("matrix_fact_verifications");
    const matrixFactBlocks = [facts, attempts, verifications].join("\n");
    const normalizedSchema = normalizeSql(schema);

    expectUniqueKey(attempts, ["id", "fact_id"]);
    expectIndex(facts, ["selected_attempt_id", "id"]);
    expect(normalizedSchema).toMatch(
      /FOREIGN KEY \(`selected_attempt_id`\s*,\s*`id`\) REFERENCES `matrix_fact_attempts` \(`id`\s*,\s*`fact_id`\)/,
    );
    expect(normalizedSchema).not.toMatch(
      /FOREIGN KEY \(`selected_attempt_id`\) REFERENCES `matrix_fact_attempts` \(`id`\)/,
    );
    expect(getTableBlock("reservations")).toContain(
      "CREATE TABLE `reservations`",
    );
    expect(getTableBlock("positive_signals")).toContain(
      "CREATE TABLE `positive_signals`",
    );
    expect(getTableBlock("scoring_metadata")).toContain(
      "CREATE TABLE `scoring_metadata`",
    );

    for (const forbidden of [
      "`reservations`",
      "`positive_signals`",
      "`scoring_metadata`",
      "`penalty_tier`",
      "`penalty_amount`",
      "`base_class_override`",
      "`is_ad_surveillance`",
    ]) {
      expect(matrixFactBlocks).not.toContain(forbidden);
    }
  });
});
