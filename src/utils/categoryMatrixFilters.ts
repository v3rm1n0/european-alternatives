import type {
  MatrixAlternative,
  MatrixCriterionFilterSelection,
  MatrixFact,
  MatrixFactValue,
  MatrixFilterSelections,
} from "../types";

const UNVERIFIED_FACT: MatrixFact = { status: "unverified", value: null };

export function isMatrixCriterionFilterActive(
  selection: MatrixCriterionFilterSelection | undefined,
): boolean {
  if (selection === undefined) {
    return false;
  }

  if (selection.value !== undefined) {
    return typeof selection.value !== "string" || selection.value.trim() !== "";
  }

  if (selection.values !== undefined && selection.values.length > 0) {
    return true;
  }

  return selection.min !== undefined || selection.max !== undefined;
}

export function hasActiveMatrixFilters(
  filters: MatrixFilterSelections,
): boolean {
  return Object.values(filters).some((selection) =>
    isMatrixCriterionFilterActive(selection),
  );
}

export function matrixAlternativeMatchesFilters(
  alternative: Pick<MatrixAlternative, "facts"> | undefined,
  filters: MatrixFilterSelections,
): boolean {
  return Object.entries(filters).every(([criterionId, selection]) => {
    if (!isMatrixCriterionFilterActive(selection)) {
      return true;
    }

    const fact = alternative?.facts[criterionId] ?? UNVERIFIED_FACT;

    if (fact.status === "unverified") {
      return selection.includeUnverified;
    }

    if (fact.status === "not_applicable") {
      return false;
    }

    return verifiedValueMatchesSelection(fact.value, selection);
  });
}

function verifiedValueMatchesSelection(
  value: MatrixFactValue,
  selection: MatrixCriterionFilterSelection,
): boolean {
  if (
    selection.value !== undefined &&
    !primitiveValueMatchesSelection(value, selection.value)
  ) {
    return false;
  }

  if (
    selection.values !== undefined &&
    selection.values.length > 0 &&
    !multiValueMatchesSelection(value, selection.values)
  ) {
    return false;
  }

  if (
    (selection.min !== undefined || selection.max !== undefined) &&
    !numberValueMatchesRange(value, selection)
  ) {
    return false;
  }

  return true;
}

function primitiveValueMatchesSelection(
  value: MatrixFactValue,
  selectedValue: boolean | number | string,
): boolean {
  return value === selectedValue;
}

function multiValueMatchesSelection(
  value: MatrixFactValue,
  selectedValues: string[],
): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => selectedValues.includes(item));
  }

  return typeof value === "string" && selectedValues.includes(value);
}

function numberValueMatchesRange(
  value: MatrixFactValue,
  selection: MatrixCriterionFilterSelection,
): boolean {
  if (typeof value !== "number") {
    return false;
  }

  if (selection.min !== undefined && value < selection.min) {
    return false;
  }

  if (selection.max !== undefined && value > selection.max) {
    return false;
  }

  return true;
}
