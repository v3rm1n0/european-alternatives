import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeHref } from "../utils/sanitizeHref";
import type {
  CategoryMatrixApiResponse,
  MatrixCriterion,
  MatrixCriterionOption,
  MatrixFact,
  MatrixFactValue,
  MatrixSourceMetadata,
} from "../types";

interface CategoryMatrixViewProps {
  matrix: CategoryMatrixApiResponse;
  visibleAlternativeIds?: ReadonlySet<string>;
}

const UNVERIFIED_FACT: MatrixFact = {
  status: "unverified",
  value: null,
};

export default function CategoryMatrixView({
  matrix,
  visibleAlternativeIds,
}: CategoryMatrixViewProps) {
  const { t, i18n } = useTranslation("browse");
  const visibleAlternatives = useMemo(
    () =>
      visibleAlternativeIds === undefined
        ? matrix.data.alternatives
        : matrix.data.alternatives.filter((alternative) =>
            visibleAlternativeIds.has(alternative.id),
          ),
    [matrix.data.alternatives, visibleAlternativeIds],
  );
  const title = t("matrixView.title", {
    category: matrix.data.category.name,
  });
  const groupsWithCriteria = useMemo(
    () =>
      matrix.data.groups.filter((group) => group.criteria.length > 0),
    [matrix.data.groups],
  );
  const flatCriteria = useMemo(
    () => groupsWithCriteria.flatMap((group) => group.criteria),
    [groupsWithCriteria],
  );

  return (
    <section
      className="category-matrix-view"
      aria-labelledby="category-matrix-view-title"
    >
      <div className="category-matrix-view-header">
        <h2 id="category-matrix-view-title">{title}</h2>
      </div>
      <div className="category-matrix-view-scroll" tabIndex={0}>
        <table className="category-matrix-view-table" aria-label={title}>
          <thead>
            <tr className="category-matrix-view-group-row">
              <th
                scope="col"
                rowSpan={2}
                className="category-matrix-view-product-header category-matrix-view-corner"
              >
                {t("matrixView.productColumn")}
              </th>
              {groupsWithCriteria.map((group) => (
                <th
                  key={group.id}
                  scope="colgroup"
                  colSpan={group.criteria.length}
                  className="category-matrix-view-group-header"
                >
                  <span className="category-matrix-view-group-label">
                    {group.label}
                  </span>
                  {group.description !== null && (
                    <span className="category-matrix-view-group-description">
                      {group.description}
                    </span>
                  )}
                </th>
              ))}
            </tr>
            <tr className="category-matrix-view-criterion-row">
              {flatCriteria.map((criterion) => (
                <th
                  key={criterion.id}
                  scope="col"
                  className="category-matrix-view-criterion-header"
                >
                  <span className="category-matrix-view-criterion-label">
                    {criterion.label}
                  </span>
                  {criterion.helpText !== null && (
                    <span className="category-matrix-view-criterion-help">
                      {criterion.helpText}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleAlternatives.map((alternative) => (
              <tr key={alternative.id}>
                <th
                  scope="row"
                  className="category-matrix-view-alternative-label"
                >
                  {alternative.name}
                </th>
                {flatCriteria.map((criterion) => (
                  <td
                    key={criterion.id}
                    className="category-matrix-view-fact-cell"
                  >
                    {renderMatrixFact(
                      alternative.facts[criterion.id] ?? UNVERIFIED_FACT,
                      criterion,
                      t,
                      i18n.language,
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function renderMatrixFact(
  fact: MatrixFact,
  criterion: MatrixCriterion,
  t: ReturnType<typeof useTranslation<"browse">>["t"],
  language: string,
): ReactNode {
  if (fact.status === "unverified") {
    return (
      <span className="category-matrix-fact category-matrix-fact--unverified">
        {t("matrixView.unverified")}
      </span>
    );
  }

  if (fact.status === "not_applicable") {
    return (
      <span className="category-matrix-fact category-matrix-fact--not-applicable">
        {t("matrixView.notApplicable")}
      </span>
    );
  }

  const sourceLink = renderSourceLink(fact.source, t);

  if (sourceLink === null) {
    return renderVerifiedValue(fact.value, criterion, t, language);
  }

  return (
    <span className="category-matrix-fact-stack">
      <span className="category-matrix-fact-value">
        {renderVerifiedValue(fact.value, criterion, t, language)}
      </span>
      {sourceLink}
    </span>
  );
}

function renderVerifiedValue(
  value: MatrixFactValue,
  criterion: MatrixCriterion,
  t: ReturnType<typeof useTranslation<"browse">>["t"],
  language: string,
): ReactNode {
  if (value === null) {
    return (
      <span className="category-matrix-fact category-matrix-fact--unverified">
        {t("matrixView.unverified")}
      </span>
    );
  }

  switch (criterion.valueType) {
    case "boolean":
      return typeof value === "boolean"
        ? renderBooleanVerdict(value, t)
        : String(value);
    case "enum":
      return typeof value === "string"
        ? renderOption(criterion, value)
        : String(value);
    case "multi_enum":
      return Array.isArray(value) ? (
        <span className="category-matrix-option-list">
          {value.map((optionId) => renderOption(criterion, optionId))}
        </span>
      ) : (
        String(value)
      );
    case "number":
      return typeof value === "number"
        ? new Intl.NumberFormat(
            language.startsWith("de") ? "de-DE" : "en-US",
          ).format(value)
        : String(value);
    case "url":
      return typeof value === "string" ? renderUrlValue(value) : String(value);
    case "date":
    case "text":
    default:
      return Array.isArray(value) ? value.join(", ") : String(value);
  }
}

function renderBooleanVerdict(
  value: boolean,
  t: ReturnType<typeof useTranslation<"browse">>["t"],
): ReactNode {
  const toneClass = value
    ? "category-matrix-fact--positive"
    : "category-matrix-fact--negative";
  const label = t(value ? "matrixView.yes" : "matrixView.no");

  return (
    <span className={`category-matrix-fact ${toneClass}`}>
      <svg
        className="category-matrix-fact-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        {value ? (
          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        ) : (
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        )}
      </svg>
      <span className="category-matrix-fact-label">{label}</span>
    </span>
  );
}

function renderOption(criterion: MatrixCriterion, optionId: string): ReactNode {
  const option = criterion.options.find((entry) => entry.id === optionId);
  const label = option?.label ?? optionId;
  const tone = getOptionTone(option);

  return (
    <span
      key={optionId}
      className={`category-matrix-option category-matrix-option--${tone}`}
    >
      {label}
    </span>
  );
}

function getOptionTone(option: MatrixCriterionOption | undefined): string {
  return option?.displayTone ?? "neutral";
}

function renderUrlValue(value: string): ReactNode {
  const href = sanitizeHref(value);

  if (href === undefined) {
    return value;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {value}
    </a>
  );
}

function renderSourceLink(
  source: MatrixSourceMetadata | undefined,
  t: ReturnType<typeof useTranslation<"browse">>["t"],
): ReactNode {
  if (source === undefined) {
    return null;
  }

  const href = sanitizeHref(source.url);

  if (href === undefined) {
    return null;
  }

  const label = source.title?.trim() || t("matrixView.source");

  return (
    <span className="category-matrix-source">
      <a
        className="category-matrix-source-link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>
      {source.accessedDate !== undefined &&
        source.accessedDate.trim() !== "" && (
          <span className="category-matrix-source-accessed">
            {t("matrixView.accessedDate", { date: source.accessedDate })}
          </span>
        )}
    </span>
  );
}
