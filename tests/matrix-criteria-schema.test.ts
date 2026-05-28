import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const schema = readFileSync(
  new URL("../scripts/db-schema.sql", import.meta.url),
  "utf8",
);
const tableTail =
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

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

function getSectionComment(tableName: string): string {
  const start = getTableStart(tableName);

  if (start === -1) {
    throw new Error(`Expected ${tableName} table in scripts/db-schema.sql`);
  }

  const separator =
    "-- ---------------------------------------------------------------------------";
  const prefix = schema.slice(0, start);
  const commentStart = prefix.lastIndexOf(separator);

  return commentStart === -1 ? "" : prefix.slice(commentStart, start);
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

function expectPrimaryAutoIncrementId(block: string): void {
  expectColumn(block, "id", /BIGINT\s+UNSIGNED\s+NOT NULL\s+AUTO_INCREMENT/);
  expect(normalizeSql(block)).toMatch(/PRIMARY KEY \(`id`\)/);
}

function columnsPattern(columns: string[]): string {
  return columns.map((column) => `\`${column}\``).join("\\s*,\\s*");
}

function expectUniqueKey(block: string, columns: string[]): void {
  expect(normalizeSql(block)).toMatch(
    new RegExp("UNIQUE KEY `[^`]+` \\(" + columnsPattern(columns) + "\\)"),
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

describe("matrix criteria database schema", () => {
  it("defines the matrix metadata tables after categories and before catalog entries", () => {
    const categoriesIndex = getTableStart("categories");
    const groupsIndex = getTableStart("matrix_criterion_groups");
    const criteriaIndex = getTableStart("matrix_criteria");
    const optionsIndex = getTableStart("matrix_criterion_options");
    const entriesIndex = getTableStart("catalog_entries");

    expect(categoriesIndex).toBeGreaterThan(-1);
    expect(groupsIndex).toBeGreaterThan(categoriesIndex);
    expect(criteriaIndex).toBeGreaterThan(groupsIndex);
    expect(optionsIndex).toBeGreaterThan(criteriaIndex);
    expect(entriesIndex).toBeGreaterThan(optionsIndex);

    for (const tableName of [
      "matrix_criterion_groups",
      "matrix_criteria",
      "matrix_criterion_options",
    ]) {
      const comment = getSectionComment(tableName).toLowerCase();
      const humanName = tableName.split("_").slice(1).join(" ");

      expect(comment).toContain("matrix");
      expect(comment.includes(tableName) || comment.includes(humanName)).toBe(
        true,
      );
    }
  });

  it("defines normalized IDs and localized display metadata for matrix rows", () => {
    const groups = getTableBlock("matrix_criterion_groups");
    const criteria = getTableBlock("matrix_criteria");
    const options = getTableBlock("matrix_criterion_options");

    for (const block of [groups, criteria, options]) {
      expectPrimaryAutoIncrementId(block);
      expectColumn(block, "label_en", /VARCHAR\(\d+\)\s+NOT NULL/);
      expectColumn(block, "label_de", /VARCHAR\(\d+\)\s+NOT NULL/);
    }

    expectColumn(groups, "description_en", /TEXT\s+DEFAULT NULL/);
    expectColumn(groups, "description_de", /TEXT\s+DEFAULT NULL/);
    expectColumn(criteria, "help_text_en", /TEXT\s+DEFAULT NULL/);
    expectColumn(criteria, "help_text_de", /TEXT\s+DEFAULT NULL/);
    expect(normalizeSql(options)).toMatch(
      /`display_tone`\s+ENUM\([^)]*'positive'[^)]*'warning'[^)]*'negative'[^)]*'neutral'[^)]*'tradeoff'[^)]*\)\s+DEFAULT\s+NULL/,
    );
  });

  it("keeps criterion groups and criteria category-owned with category-scoped uniqueness", () => {
    const groups = getTableBlock("matrix_criterion_groups");
    const criteria = getTableBlock("matrix_criteria");

    expectColumn(groups, "category_id", /VARCHAR\(50\)\s+NOT NULL/);
    expectColumn(groups, "group_key", /VARCHAR\(\d+\)\s+NOT NULL/);
    expectColumn(groups, "sort_order", /INT\s+NOT NULL/);
    expectForeignKey(groups, ["category_id"], "categories", ["id"]);
    expectUniqueKey(groups, ["category_id", "group_key"]);
    expectUniqueKey(groups, ["category_id", "sort_order"]);
    expectUniqueKey(groups, ["category_id", "id"]);

    expectColumn(criteria, "category_id", /VARCHAR\(50\)\s+NOT NULL/);
    expectColumn(criteria, "group_id", /BIGINT\s+UNSIGNED\s+NOT NULL/);
    expectColumn(criteria, "criterion_key", /VARCHAR\(\d+\)\s+NOT NULL/);
    expectColumn(criteria, "sort_order", /INT\s+NOT NULL/);
    expectForeignKey(criteria, ["category_id"], "categories", ["id"]);
    expectForeignKey(
      criteria,
      ["category_id", "group_id"],
      "matrix_criterion_groups",
      ["category_id", "id"],
    );
    expectUniqueKey(criteria, ["category_id", "criterion_key"]);
    expectUniqueKey(criteria, ["category_id", "sort_order"]);
  });

  it("models criterion value types, semantics, and filter modes as matrix metadata", () => {
    const criteria = getTableBlock("matrix_criteria");

    expectEnumColumn(criteria, "value_type", [
      "boolean",
      "enum",
      "multi_enum",
      "number",
      "text",
      "url",
      "date",
    ]);
    expectEnumColumn(criteria, "semantics", [
      "beneficial",
      "harmful",
      "neutral",
      "tradeoff",
      "informational",
      "risk",
    ]);
    expect(normalizeSql(criteria)).toMatch(
      /`semantics`\s+ENUM\([^)]*'neutral'[^)]*'tradeoff'[^)]*'informational'[^)]*\)\s+NOT NULL\s+DEFAULT\s+'neutral'/,
    );
    expectEnumColumn(criteria, "filter_mode", [
      "none",
      "optional",
      "must_match",
      "range",
      "multi_select",
    ]);
    expect(normalizeSql(criteria)).toMatch(
      /`filter_mode`\s+ENUM\([^)]*'none'[^)]*'optional'[^)]*'must_match'[^)]*'range'[^)]*'multi_select'[^)]*\)\s+NOT NULL\s+DEFAULT\s+'none'/,
    );
    expectEnumColumn(criteria, "display_mode", ["default", "coverage"]);
    expect(normalizeSql(criteria)).toMatch(
      /`display_mode`\s+ENUM\([^)]*'default'[^)]*'coverage'[^)]*\)\s+NOT NULL\s+DEFAULT\s+'default'/,
    );
  });

  it("scopes enum options to one criterion without linking matrix metadata to products or Trust Score tables", () => {
    const groups = getTableBlock("matrix_criterion_groups");
    const criteria = getTableBlock("matrix_criteria");
    const options = getTableBlock("matrix_criterion_options");
    const matrixBlocks = [groups, criteria, options].join("\n");

    expectColumn(options, "criterion_id", /BIGINT\s+UNSIGNED\s+NOT NULL/);
    expectColumn(options, "option_key", /VARCHAR\(\d+\)\s+NOT NULL/);
    expectColumn(options, "sort_order", /INT\s+NOT NULL/);
    expectEnumColumn(options, "display_tone", [
      "positive",
      "warning",
      "negative",
      "neutral",
      "tradeoff",
    ]);
    expectForeignKey(options, ["criterion_id"], "matrix_criteria", ["id"]);
    expectUniqueKey(options, ["criterion_id", "option_key"]);
    expectUniqueKey(options, ["criterion_id", "sort_order"]);

    expect(matrixBlocks).not.toContain("`entry_id`");
    expect(matrixBlocks).not.toContain("`catalog_entries`");
    expect(matrixBlocks).not.toContain("`reservations`");
    expect(matrixBlocks).not.toContain("`positive_signals`");
    expect(matrixBlocks).not.toContain("`scoring_metadata`");
    expect(getTableBlock("reservations")).toContain(
      "CREATE TABLE `reservations`",
    );
    expect(getTableBlock("positive_signals")).toContain(
      "CREATE TABLE `positive_signals`",
    );
    expect(getTableBlock("scoring_metadata")).toContain(
      "CREATE TABLE `scoring_metadata`",
    );
  });
});
