import {
  defaultLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "../i18n";
import type {
  CategoryId,
  CategoryMatrixApiResponse,
  CategoryMatrixError,
  CategoryMatrixLoadResult,
  MatrixAlternative,
  MatrixCriterion,
  MatrixCriterionOption,
  MatrixDisplayTone,
  MatrixFact,
  MatrixFactValue,
  MatrixFilterMode,
  MatrixGroup,
  MatrixSemantics,
  MatrixSourceMetadata,
  MatrixValueType,
} from "../types";

const MATRIX_ENDPOINT = "/api/catalog/matrix";

const MATRIX_VALUE_TYPES: MatrixValueType[] = [
  "boolean",
  "enum",
  "multi_enum",
  "number",
  "text",
  "url",
  "date",
];

const MATRIX_SEMANTICS: MatrixSemantics[] = [
  "beneficial",
  "harmful",
  "neutral",
  "tradeoff",
  "informational",
  "risk",
];

const MATRIX_FILTER_MODES: MatrixFilterMode[] = [
  "none",
  "optional",
  "must_match",
  "range",
  "multi_select",
];

const MATRIX_DISPLAY_TONES: MatrixDisplayTone[] = [
  "positive",
  "warning",
  "negative",
  "neutral",
  "tradeoff",
];

const UNAVAILABLE_ERROR_CODES = new Set([
  "invalid_category",
  "missing_category",
  "not_found",
]);

export interface FetchCategoryMatrixOptions {
  fetcher?: typeof fetch;
}

export async function fetchCategoryMatrix(
  category: CategoryId | string,
  locale: SupportedLanguage | string = defaultLanguage,
  options: FetchCategoryMatrixOptions = {},
): Promise<CategoryMatrixLoadResult> {
  const resolvedLocale = isSupportedLanguage(locale) ? locale : defaultLanguage;
  const params = new URLSearchParams({ category, locale: resolvedLocale });
  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher(`${MATRIX_ENDPOINT}?${params.toString()}`);
    const payload = await readJson(response);

    if (!response.ok) {
      return classifyFailedResponse(payload, response.status);
    }

    if (!isCategoryMatrixApiResponse(payload)) {
      return {
        status: "error",
        matrix: null,
        error: createMatrixError(
          "invalid_payload",
          "Matrix API returned an invalid payload.",
          response.status,
        ),
      };
    }

    return {
      status: isEmptyMatrix(payload) ? "empty" : "ready",
      matrix: payload,
      error: null,
    };
  } catch (error) {
    return {
      status: "error",
      matrix: null,
      error: createMatrixError("network_error", getErrorMessage(error)),
    };
  }
}

function classifyFailedResponse(
  payload: unknown,
  httpStatus: number,
): CategoryMatrixLoadResult {
  const responseError = readApiError(payload, httpStatus);
  const status =
    httpStatus === 404 || UNAVAILABLE_ERROR_CODES.has(responseError.code)
      ? "unavailable"
      : "error";

  return {
    status,
    matrix: null,
    error: responseError,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readApiError(
  payload: unknown,
  httpStatus: number,
): CategoryMatrixError {
  if (!isRecord(payload)) {
    return createMatrixError(
      `http_${httpStatus}`,
      `Matrix API returned HTTP ${httpStatus}.`,
      httpStatus,
    );
  }

  const code =
    typeof payload.error === "string" ? payload.error : `http_${httpStatus}`;
  const message =
    typeof payload.detail === "string"
      ? payload.detail
      : typeof payload.message === "string"
        ? payload.message
        : `Matrix API returned HTTP ${httpStatus}.`;

  return createMatrixError(code, message, httpStatus);
}

function createMatrixError(
  code: string,
  message: string,
  httpStatus?: number,
): CategoryMatrixError {
  return httpStatus === undefined
    ? { code, message }
    : { code, message, httpStatus };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Matrix request failed.";
}

function isEmptyMatrix(matrix: CategoryMatrixApiResponse): boolean {
  return (
    matrix.meta.criterionCount === 0 ||
    matrix.meta.alternativeCount === 0 ||
    matrix.data.groups.length === 0 ||
    matrix.data.alternatives.length === 0 ||
    !matrix.data.groups.some((group) => group.criteria.length > 0)
  );
}

function isCategoryMatrixApiResponse(
  value: unknown,
): value is CategoryMatrixApiResponse {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.meta)) {
    return false;
  }

  const { data, meta } = value;
  return (
    isCategoryMatrixCategory(data.category) &&
    Array.isArray(data.groups) &&
    data.groups.every(isMatrixGroup) &&
    Array.isArray(data.alternatives) &&
    data.alternatives.every(isMatrixAlternative) &&
    isCategoryMatrixMeta(meta)
  );
}

function isCategoryMatrixCategory(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    isNullableString(value.emoji)
  );
}

function isCategoryMatrixMeta(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.category === "string" &&
    isSupportedLanguage(value.locale) &&
    isFiniteNumber(value.groupCount) &&
    isFiniteNumber(value.criterionCount) &&
    isFiniteNumber(value.alternativeCount)
  );
}

function isMatrixGroup(value: unknown): value is MatrixGroup {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isNullableString(value.description) &&
    Array.isArray(value.criteria) &&
    value.criteria.every(isMatrixCriterion)
  );
}

function isMatrixCriterion(value: unknown): value is MatrixCriterion {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    isNullableString(value.helpText) &&
    isMatrixValueType(value.valueType) &&
    isMatrixSemantics(value.semantics) &&
    isMatrixFilterMode(value.filterMode) &&
    Array.isArray(value.options) &&
    value.options.every(isMatrixCriterionOption)
  );
}

function isMatrixCriterionOption(
  value: unknown,
): value is MatrixCriterionOption {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.displayTone === undefined || isMatrixDisplayTone(value.displayTone))
  );
}

function isMatrixAlternative(value: unknown): value is MatrixAlternative {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.status === undefined ||
      value.status === "alternative" ||
      value.status === "us") &&
    isNullableString(value.website) &&
    isNullableString(value.logo) &&
    isNullableString(value.country) &&
    isNullableString(value.category) &&
    Array.isArray(value.secondaryCategories) &&
    value.secondaryCategories.every(
      (category) => typeof category === "string",
    ) &&
    isRecord(value.facts) &&
    Object.values(value.facts).every(isMatrixFact)
  );
}

function isMatrixFact(value: unknown): value is MatrixFact {
  if (!isRecord(value) || typeof value.status !== "string") {
    return false;
  }

  if (value.status === "verified") {
    return (
      isMatrixFactValue(value.value) &&
      (value.source === undefined || isMatrixSourceMetadata(value.source))
    );
  }

  return (
    (value.status === "unverified" || value.status === "not_applicable") &&
    value.value === null
  );
}

function isMatrixFactValue(value: unknown): value is MatrixFactValue {
  return (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function isMatrixSourceMetadata(value: unknown): value is MatrixSourceMetadata {
  return (
    isRecord(value) &&
    typeof value.url === "string" &&
    (value.title === undefined || typeof value.title === "string") &&
    (value.accessedDate === undefined || typeof value.accessedDate === "string")
  );
}

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage);
}

function isMatrixValueType(value: unknown): value is MatrixValueType {
  return MATRIX_VALUE_TYPES.includes(value as MatrixValueType);
}

function isMatrixSemantics(value: unknown): value is MatrixSemantics {
  return MATRIX_SEMANTICS.includes(value as MatrixSemantics);
}

function isMatrixFilterMode(value: unknown): value is MatrixFilterMode {
  return MATRIX_FILTER_MODES.includes(value as MatrixFilterMode);
}

function isMatrixDisplayTone(value: unknown): value is MatrixDisplayTone {
  return MATRIX_DISPLAY_TONES.includes(value as MatrixDisplayTone);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isFiniteNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}
