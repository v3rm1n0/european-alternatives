import type { MatrixAlternative, MatrixFact } from "../types";

export type MatrixColumnFilterStatus =
  | "verified"
  | "unverified"
  | "not_applicable";

export type MatrixColumnFilter =
  | {
      criterionId: string;
      kind: "boolean";
      value: boolean;
      includeUnverified: boolean;
    }
  | {
      criterionId: string;
      kind: "enum";
      values: string[];
      includeUnverified: boolean;
    }
  | {
      criterionId: string;
      kind: "multi_enum";
      values: string[];
      includeUnverified: boolean;
    }
  | {
      criterionId: string;
      kind: "status";
      statuses: MatrixColumnFilterStatus[];
    };

export const UNVERIFIED_MATRIX_FACT: MatrixFact = {
  status: "unverified",
  value: null,
};

export function applyMatrixColumnFilters<
  T extends Pick<MatrixAlternative, "facts">,
>(alternatives: readonly T[], filters: readonly MatrixColumnFilter[]): T[] {
  if (filters.length === 0) {
    return [...alternatives];
  }

  return alternatives.filter((alternative) =>
    filters.every((filter) =>
      matrixFactMatchesColumnFilter(
        alternative.facts[filter.criterionId] ?? UNVERIFIED_MATRIX_FACT,
        filter,
      ),
    ),
  );
}

export function matrixFactMatchesColumnFilter(
  fact: MatrixFact,
  filter: MatrixColumnFilter,
): boolean {
  if (filter.kind === "status") {
    return filter.statuses.some((status) =>
      status === "verified"
        ? fact.status === "verified" && fact.value !== null
        : fact.status === status,
    );
  }

  if (fact.status === "unverified") {
    return filter.includeUnverified;
  }

  if (fact.status !== "verified" || fact.value === null) {
    return false;
  }

  if (filter.kind === "boolean") {
    return typeof fact.value === "boolean" && fact.value === filter.value;
  }

  if (filter.kind === "enum") {
    return typeof fact.value === "string" && filter.values.includes(fact.value);
  }

  if (!Array.isArray(fact.value) || filter.values.length === 0) {
    return false;
  }

  const selected = new Set(fact.value);
  return filter.values.some((value) => selected.has(value));
}

export function withoutMatrixColumnFilter(
  filters: readonly MatrixColumnFilter[],
  criterionId: string,
): MatrixColumnFilter[] {
  return filters.filter((filter) => filter.criterionId !== criterionId);
}

export function upsertMatrixColumnFilter(
  filters: readonly MatrixColumnFilter[],
  nextFilter: MatrixColumnFilter,
): MatrixColumnFilter[] {
  return [
    ...withoutMatrixColumnFilter(filters, nextFilter.criterionId),
    nextFilter,
  ];
}
