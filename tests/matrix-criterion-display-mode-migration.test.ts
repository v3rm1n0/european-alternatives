import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../scripts/migrations/063-matrix-criterion-display-mode.sql",
    import.meta.url,
  ),
  "utf8",
);
const schema = readFileSync(
  new URL("../scripts/db-schema.sql", import.meta.url),
  "utf8",
);
const api = readFileSync(
  new URL("../api/catalog/matrix.php", import.meta.url),
  "utf8",
);
const component = readFileSync(
  new URL("../src/components/CategoryMatrixView.tsx", import.meta.url),
  "utf8",
);
const types = readFileSync(
  new URL("../src/types/index.ts", import.meta.url),
  "utf8",
);

describe("matrix criterion display mode migration", () => {
  it("adds coverage display metadata to the schema and migration", () => {
    expect(schema).toContain("`display_mode`  ENUM('default','coverage')");
    expect(migration).toMatch(/ALTER\s+TABLE\s+`matrix_criteria`/i);
    expect(migration).toMatch(/ADD\s+COLUMN\s+`display_mode`\s+ENUM\('default','coverage'\)/i);
    expect(migration).toMatch(/`display_mode`\s*=\s*'coverage'/i);
    expect(migration).toContain("'supported_platforms'");
    expect(migration).toContain("'reactions_threads'");
    expect(migration).toContain("LIKE '%_features'");
    expect(migration).toContain("'063-matrix-criterion-display-mode'");
  });

  it("exposes displayMode through the API without hardcoded frontend criteria", () => {
    expect(api).toContain("COLUMN_NAME = 'display_mode'");
    expect(api).toContain("AS display_mode");
    expect(api).toContain("'displayMode' =>");
    expect(types).toContain('export type MatrixDisplayMode = "default" | "coverage"');
    expect(component).toContain('criterion.displayMode === "coverage"');
    expect(component).not.toContain("FULL_COVERAGE_MULTI_ENUM_CRITERIA");
  });
});
