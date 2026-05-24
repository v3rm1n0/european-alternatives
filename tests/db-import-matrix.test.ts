import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const importScript = readFileSync(
  new URL("../scripts/db-import.php", import.meta.url),
  "utf8",
);
const apiReadme = readFileSync(
  new URL("../api/README.md", import.meta.url),
  "utf8",
);

const matrixTables = [
  "matrix_criterion_groups",
  "matrix_criteria",
  "matrix_criterion_options",
  "matrix_facts",
  "matrix_fact_attempts",
  "matrix_fact_verifications",
] as const;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function getDeleteOrder(): string[] {
  const match = importScript.match(
    /const\s+DELETE_ORDER\s*=\s*\[([\s\S]*?)\];/,
  );

  if (!match) {
    throw new Error("Expected scripts/db-import.php to define DELETE_ORDER");
  }

  return [...match[1].matchAll(/'([^']+)'/g)].map(([, table]) => table);
}

function getFunctionSource(functionName: string): string {
  const start = importScript.indexOf(`function ${functionName}(`);
  if (start < 0) {
    throw new Error(
      `Expected scripts/db-import.php to define ${functionName}()`,
    );
  }

  let depth = 0;
  let bodyStarted = false;
  let inSingleQuotedString = false;
  let inDoubleQuotedString = false;

  for (let idx = start; idx < importScript.length; idx++) {
    const char = importScript[idx];
    if (inSingleQuotedString) {
      if (char === "\\") {
        idx++;
      } else if (char === "'") {
        inSingleQuotedString = false;
      }
      continue;
    }

    if (inDoubleQuotedString) {
      if (char === "\\") {
        idx++;
      } else if (char === '"') {
        inDoubleQuotedString = false;
      }
      continue;
    }

    if (char === "'") {
      inSingleQuotedString = true;
      continue;
    }

    if (char === '"') {
      inDoubleQuotedString = true;
      continue;
    }

    if (char === "{") {
      depth++;
      bodyStarted = true;
    } else if (char === "}") {
      depth--;
      if (bodyStarted && depth === 0) {
        return importScript.slice(start, idx + 1);
      }
    }
  }

  throw new Error(`Expected ${functionName}() to have a complete body`);
}

function expectBefore(source: string[], earlier: string, later: string): void {
  const earlierIndex = source.indexOf(earlier);
  const laterIndex = source.indexOf(later);

  expect(earlierIndex, `${earlier} should be present`).toBeGreaterThanOrEqual(
    0,
  );
  expect(laterIndex, `${later} should be present`).toBeGreaterThanOrEqual(0);
  expect(earlierIndex, `${earlier} should come before ${later}`).toBeLessThan(
    laterIndex,
  );
}

function expectTextBefore(text: string, earlier: string, later: string): void {
  const earlierIndex = text.indexOf(earlier);
  const laterIndex = text.indexOf(later);

  expect(earlierIndex, `${earlier} should be present`).toBeGreaterThanOrEqual(
    0,
  );
  expect(laterIndex, `${later} should be present`).toBeGreaterThanOrEqual(0);
  expect(earlierIndex, `${earlier} should come before ${later}`).toBeLessThan(
    laterIndex,
  );
}

function expectOptionalArrayRead(tableName: string): void {
  expect(importScript).toMatch(
    new RegExp(`\\$data\\['${tableName}'\\]\\s*\\?\\?\\s*\\[\\]`),
  );
}

function expectInsertInto(tableName: string): void {
  expect(importScript).toContain(`INSERT INTO \`${tableName}\``);
}

function expectSortOrderBinding(functionName: string): void {
  const functionSource = getFunctionSource(functionName);

  expect(
    functionSource,
    `${functionName} should preserve explicit sort_order with source-index fallback`,
  ).toMatch(/':sort_order'\s*=>\s*\$row\['sort_order'\]\s*\?\?\s*\$idx/);
}

describe("matrix catalog import contract", () => {
  it("clears matrix tables in child-before-parent dependency order", () => {
    const deleteOrder = getDeleteOrder();

    for (const tableName of matrixTables) {
      expect(deleteOrder).toContain(tableName);
    }

    expectBefore(
      deleteOrder,
      "matrix_fact_verifications",
      "matrix_fact_attempts",
    );
    expectBefore(deleteOrder, "matrix_fact_attempts", "matrix_facts");
    expectBefore(deleteOrder, "matrix_facts", "entry_categories");
    expectBefore(deleteOrder, "matrix_facts", "catalog_entries");
    expectBefore(deleteOrder, "matrix_criterion_options", "matrix_criteria");
    expectBefore(deleteOrder, "matrix_criteria", "matrix_criterion_groups");
    expectBefore(deleteOrder, "matrix_criterion_groups", "categories");
  });

  it("treats every matrix JSON array as optional while inserting each matrix table", () => {
    for (const tableName of matrixTables) {
      expectOptionalArrayRead(tableName);
      expectInsertInto(tableName);
    }
  });

  it("imports matrix rows in FK-safe order and defers selected attempts until attempts exist", () => {
    expectTextBefore(
      importScript,
      "$data['categories'] ?? []",
      "$data['matrix_criterion_groups'] ?? []",
    );
    expectTextBefore(
      importScript,
      "$data['matrix_criterion_groups'] ?? []",
      "$data['matrix_criteria'] ?? []",
    );
    expectTextBefore(
      importScript,
      "$data['matrix_criteria'] ?? []",
      "$data['matrix_criterion_options'] ?? []",
    );
    expectTextBefore(
      importScript,
      "$data['matrix_criterion_options'] ?? []",
      "$data['catalog_entries'] ?? []",
    );
    expectTextBefore(
      importScript,
      "$data['entry_categories'] ?? []",
      "$data['matrix_facts'] ?? []",
    );
    expectTextBefore(
      importScript,
      "$data['matrix_facts'] ?? []",
      "$data['matrix_fact_attempts'] ?? []",
    );
    expectTextBefore(
      importScript,
      "$data['matrix_fact_attempts'] ?? []",
      "$data['matrix_fact_verifications'] ?? []",
    );

    expect(importScript).toContain("selected_attempt_source_id");
    expect(importScript).toMatch(
      /UPDATE\s+`matrix_facts`[\s\S]*`selected_attempt_id`\s*=/,
    );
  });

  it("preserves the existing non-matrix import sequence", () => {
    const existingImportArrays = [
      "countries",
      "categories",
      "tags",
      "catalog_entries",
      "entry_categories",
      "entry_tags",
      "category_us_vendors",
      "entry_replacements",
      "reservations",
      "positive_signals",
      "scoring_metadata",
      "denied_decisions",
      "further_reading_resources",
      "landing_category_groups",
      "landing_group_categories",
    ];

    for (let idx = 0; idx < existingImportArrays.length - 1; idx++) {
      expectTextBefore(
        importScript,
        `$data['${existingImportArrays[idx]}'] ?? []`,
        `$data['${existingImportArrays[idx + 1]}'] ?? []`,
      );
    }
  });

  it("resolves selected attempts by source id after attempts are imported", () => {
    const importMatrixFacts = getFunctionSource("importMatrixFacts");
    const updateMatrixFactSelectedAttempts = getFunctionSource(
      "updateMatrixFactSelectedAttempts",
    );

    expect(importMatrixFacts).toContain("selected_attempt_source_id");
    expect(importMatrixFacts).toContain("'fact_id' => $factId");
    expect(importMatrixFacts).toContain(
      "'attempt_source_id' => (string) $row['selected_attempt_source_id']",
    );
    expect(importMatrixFacts).toContain(
      "'pending_selected_attempts' => $pendingSelectedAttempts",
    );

    expectTextBefore(
      importScript,
      "$data['matrix_fact_verifications'] ?? []",
      "$matrixFactImport['pending_selected_attempts']",
    );
    expect(updateMatrixFactSelectedAttempts).toContain(
      "$attemptSourceId = $pendingSelection['attempt_source_id'];",
    );
    expect(updateMatrixFactSelectedAttempts).toMatch(
      /':selected_attempt_id'\s*=>\s*\$attemptId/,
    );
    expect(updateMatrixFactSelectedAttempts).toMatch(
      /':fact_id'\s*=>\s*\$pendingSelection\['fact_id'\]/,
    );
  });

  it("preserves sort order for matrix criterion metadata rows", () => {
    expectSortOrderBinding("importMatrixCriterionGroups");
    expectSortOrderBinding("importMatrixCriteria");
    expectSortOrderBinding("importMatrixCriterionOptions");
  });

  it("uses stable natural keys instead of requiring database ids in matrix JSON", () => {
    const matrixScopedLookupKey = getFunctionSource("matrixScopedLookupKey");
    const matrixFactLookupKey = getFunctionSource("matrixFactLookupKey");
    const importMatrixCriterionGroups = getFunctionSource(
      "importMatrixCriterionGroups",
    );
    const importMatrixCriteria = getFunctionSource("importMatrixCriteria");
    const importMatrixCriterionOptions = getFunctionSource(
      "importMatrixCriterionOptions",
    );
    const importMatrixFacts = getFunctionSource("importMatrixFacts");
    const resolveMatrixFactId = getFunctionSource("resolveMatrixFactId");

    expect(matrixScopedLookupKey).toContain(
      "return $categoryId . '|' . $sourceKey;",
    );
    expect(matrixFactLookupKey).toContain(
      "return $entrySlug . '|' . $categoryId . '|' . $criterionKey;",
    );

    expect(importMatrixCriterionGroups).toContain(
      "matrixScopedLookupKey((string) $row['category_id'], (string) $row['group_key'])",
    );
    expect(importMatrixCriteria).toContain(
      "matrixScopedLookupKey((string) $row['category_id'], (string) $row['group_key'])",
    );
    expect(importMatrixCriteria).toContain(
      "matrixScopedLookupKey((string) $row['category_id'], (string) $row['criterion_key'])",
    );
    expect(importMatrixCriterionOptions).toContain(
      "matrixScopedLookupKey((string) $row['category_id'], (string) $row['criterion_key'])",
    );

    expect(importMatrixFacts).toContain(
      "matrixFactLookupKey((string) $row['entry_slug'], (string) $row['category_id'], (string) $row['criterion_key'])",
    );
    expect(importMatrixFacts).toContain(
      "$factIdMap[(string) $row['source_id']]",
    );

    expect(resolveMatrixFactId).toContain("$row['fact_source_id']");
    expect(resolveMatrixFactId).toContain(
      "matrixFactLookupKey(\n            (string) $row['entry_slug'],\n            (string) $row['category_id'],\n            (string) $row['criterion_key']",
    );
  });

  it("normalizes typed matrix values and inserts facts before selecting attempts", () => {
    const boolColumnValue = getFunctionSource("boolColumnValue");
    const importMatrixFacts = getFunctionSource("importMatrixFacts");
    const importMatrixFactAttempts = getFunctionSource(
      "importMatrixFactAttempts",
    );
    const updateMatrixFactSelectedAttempts = getFunctionSource(
      "updateMatrixFactSelectedAttempts",
    );

    expect(boolColumnValue).toContain("if ($value === null)");
    expect(boolColumnValue).toContain("return $value ? 1 : 0;");

    expect(importMatrixFacts).toContain("`selected_attempt_id`");
    expect(importMatrixFacts).toMatch(
      /`public_source_accessed_date`, `selected_attempt_id`[\s\S]*:public_source_accessed_date, NULL/,
    );
    expect(importMatrixFacts).toContain(
      "':value_bool'                   => boolColumnValue($row['value_bool'] ?? null)",
    );
    expect(importMatrixFacts).toContain(
      "':value_json'                   => jsonColumnValue($row['value_json'] ?? null)",
    );

    expect(importMatrixFactAttempts).toContain(
      "':proposed_value_bool'    => boolColumnValue($row['proposed_value_bool'] ?? null)",
    );
    expect(importMatrixFactAttempts).toContain(
      "':proposed_value_json'    => jsonColumnValue($row['proposed_value_json'] ?? null)",
    );
    expect(updateMatrixFactSelectedAttempts).toContain(
      "$attemptId = $attemptIdMap[$attemptSourceId] ?? null;",
    );
  });

  it("skips unresolved matrix references before inserting dependent rows", () => {
    const unresolvedReferenceFunctions = [
      ["importMatrixCriteria", "unknown group"],
      ["importMatrixCriterionOptions", "unknown criterion"],
      ["importMatrixFacts", "unknown entry slug"],
      ["importMatrixFacts", "unknown criterion"],
      ["importMatrixFactAttempts", "unknown fact"],
      ["importMatrixFactVerifications", "unknown attempt source_id"],
      ["updateMatrixFactSelectedAttempts", "unknown attempt"],
    ] as const;

    for (const [functionName, warningText] of unresolvedReferenceFunctions) {
      const functionSource = getFunctionSource(functionName);
      const warningIndex = functionSource.indexOf(warningText);
      const continueIndex = functionSource.indexOf("continue;", warningIndex);

      expect(
        warningIndex,
        `${functionName} should warn for ${warningText}`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        continueIndex,
        `${functionName} should skip ${warningText}`,
      ).toBeGreaterThan(warningIndex);
    }
  });

  it("stores audit-only attempt and verification fields without putting them on public facts", () => {
    const normalizedScript = normalizeText(importScript);
    const factsInsert = normalizedScript.match(
      /INSERT INTO `matrix_facts` \(([\s\S]*?)\) VALUES/,
    );
    const attemptsInsert = normalizedScript.match(
      /INSERT INTO `matrix_fact_attempts` \(([\s\S]*?)\) VALUES/,
    );
    const verificationsInsert = normalizedScript.match(
      /INSERT INTO `matrix_fact_verifications` \(([\s\S]*?)\) VALUES/,
    );

    expect(factsInsert, "matrix_facts insert should exist").not.toBeNull();
    expect(
      attemptsInsert,
      "matrix_fact_attempts insert should exist",
    ).not.toBeNull();
    expect(
      verificationsInsert,
      "matrix_fact_verifications insert should exist",
    ).not.toBeNull();

    expect(factsInsert?.[1]).toContain("`public_source_url`");
    expect(factsInsert?.[1]).toContain("`public_source_title`");
    expect(factsInsert?.[1]).toContain("`public_source_accessed_date`");
    expect(factsInsert?.[1]).not.toContain("`audit_quote`");
    expect(factsInsert?.[1]).not.toContain("`raw_response`");

    for (const insertColumns of [
      attemptsInsert?.[1],
      verificationsInsert?.[1],
    ]) {
      expect(insertColumns).toContain("`audit_quote`");
      expect(insertColumns).toContain("`raw_response`");
    }
  });
});

describe("matrix table documentation", () => {
  it("documents the matrix tables and no longer claims the old 16-table schema", () => {
    expect(apiReadme).toMatch(/\b23\b[\w\s-]*tables/i);
    expect(apiReadme).not.toMatch(/\b16\b[\w\s-]*tables/i);

    for (const tableName of matrixTables) {
      expect(apiReadme).toContain(`\`${tableName}\``);
    }

    expect(apiReadme.toLowerCase()).toContain("matrix");
    expect(apiReadme.toLowerCase()).toContain("audit");
  });
});
