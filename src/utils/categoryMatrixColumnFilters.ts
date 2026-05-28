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
      matchMode: "all" | "any";
      includeUnverified: boolean;
    }
  | {
      criterionId: string;
      kind: "status";
      status: MatrixColumnFilterStatus;
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
    if (filter.status === "verified") {
      return fact.status === "verified" && fact.value !== null;
    }

    return fact.status === filter.status;
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
  if (filter.matchMode === "any") {
    return filter.values.some((value) => selected.has(value));
  }

  return filter.values.every((value) => selected.has(value));
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
