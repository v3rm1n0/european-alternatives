import { describe, expect, it } from "vitest";

import {
  hasActiveMatrixFilters,
  isMatrixCriterionFilterActive,
  matrixAlternativeMatchesFilters,
} from "../src/utils/categoryMatrixFilters";
import type { MatrixAlternative } from "../src/types";

type MatrixCriterionFilterSelectionForTest = {
  value?: boolean | string | number;
  values?: string[];
  min?: number;
  max?: number;
  includeUnverified: boolean;
};

type MatrixFilterSelectionsForTest = Record<
  string,
  MatrixCriterionFilterSelectionForTest
>;

function alternative(
  facts: MatrixAlternative["facts"],
): Pick<MatrixAlternative, "facts"> {
  return { facts };
}

describe("category matrix filter predicates", () => {
  it("treats only concrete values, selected values, or numeric bounds as active filters", () => {
    expect(isMatrixCriterionFilterActive(undefined)).toBe(false);
    expect(isMatrixCriterionFilterActive({ includeUnverified: true })).toBe(
      false,
    );
    expect(isMatrixCriterionFilterActive({ includeUnverified: false })).toBe(
      false,
    );
    expect(
      isMatrixCriterionFilterActive({ value: "", includeUnverified: true }),
    ).toBe(false);
    expect(
      isMatrixCriterionFilterActive({ values: [], includeUnverified: true }),
    ).toBe(false);
    expect(
      isMatrixCriterionFilterActive({ value: false, includeUnverified: true }),
    ).toBe(true);
    expect(
      isMatrixCriterionFilterActive({ value: 0, includeUnverified: true }),
    ).toBe(true);
    expect(
      isMatrixCriterionFilterActive({ min: 0, includeUnverified: true }),
    ).toBe(true);
    expect(
      hasActiveMatrixFilters({
        empty: { includeUnverified: true },
        active: { values: ["csv"], includeUnverified: true },
      }),
    ).toBe(true);
  });

  it("requires verified primitive facts to match every active criterion", () => {
    const filters: MatrixFilterSelectionsForTest = {
      e2ee: { value: true, includeUnverified: true },
      hosting_region: { value: "eu", includeUnverified: true },
    };

    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          e2ee: { status: "verified", value: true },
          hosting_region: { status: "verified", value: "eu" },
        }),
        filters,
      ),
    ).toBe(true);
    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          e2ee: { status: "verified", value: false },
          hosting_region: { status: "verified", value: "eu" },
        }),
        filters,
      ),
    ).toBe(false);
    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          e2ee: { status: "verified", value: true },
          hosting_region: { status: "verified", value: "us" },
        }),
        filters,
      ),
    ).toBe(false);
  });

  it("matches any selected multi-enum value within one criterion", () => {
    const filters: MatrixFilterSelectionsForTest = {
      export_formats: {
        values: ["csv", "json"],
        includeUnverified: true,
      },
    };

    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          export_formats: { status: "verified", value: ["pdf", "json"] },
        }),
        filters,
      ),
    ).toBe(true);
    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          export_formats: { status: "verified", value: "csv" },
        }),
        filters,
      ),
    ).toBe(true);
    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          export_formats: { status: "verified", value: ["pdf", "xml"] },
        }),
        filters,
      ),
    ).toBe(false);
  });

  it("applies inclusive numeric range bounds and rejects non-number facts for range filters", () => {
    const filters: MatrixFilterSelectionsForTest = {
      storage_included: { min: 5, max: 20, includeUnverified: true },
    };

    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          storage_included: { status: "verified", value: 5 },
        }),
        filters,
      ),
    ).toBe(true);
    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          storage_included: { status: "verified", value: 20 },
        }),
        filters,
      ),
    ).toBe(true);
    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          storage_included: { status: "verified", value: 21 },
        }),
        filters,
      ),
    ).toBe(false);
    expect(
      matrixAlternativeMatchesFilters(
        alternative({
          storage_included: { status: "verified", value: "20" },
        }),
        filters,
      ),
    ).toBe(false);
  });

  it("keeps unverified and missing facts visible by default but excludes them when requested", () => {
    const includeUnverified: MatrixFilterSelectionsForTest = {
      e2ee: { value: true, includeUnverified: true },
    };
    const excludeUnverified: MatrixFilterSelectionsForTest = {
      e2ee: { value: true, includeUnverified: false },
    };

    expect(
      matrixAlternativeMatchesFilters(
        alternative({ e2ee: { status: "unverified", value: null } }),
        includeUnverified,
      ),
    ).toBe(true);
    expect(
      matrixAlternativeMatchesFilters(alternative({}), includeUnverified),
    ).toBe(true);
    expect(matrixAlternativeMatchesFilters(undefined, includeUnverified)).toBe(
      true,
    );
    expect(
      matrixAlternativeMatchesFilters(
        alternative({ e2ee: { status: "unverified", value: null } }),
        excludeUnverified,
      ),
    ).toBe(false);
    expect(
      matrixAlternativeMatchesFilters(alternative({}), excludeUnverified),
    ).toBe(false);
    expect(matrixAlternativeMatchesFilters(undefined, excludeUnverified)).toBe(
      false,
    );
  });

  it("does not treat confirmed not-applicable facts as unknown matches", () => {
    expect(
      matrixAlternativeMatchesFilters(
        alternative({ e2ee: { status: "not_applicable", value: null } }),
        { e2ee: { value: true, includeUnverified: true } },
      ),
    ).toBe(false);
  });
});
