import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeHref } from "../utils/sanitizeHref";
import type {
  CategoryMatrixApiResponse,
  MatrixAlternative,
  MatrixCriterion,
  MatrixCriterionOption,
  MatrixFact,
  MatrixFactValue,
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
            <tr>
              <th scope="col" className="category-matrix-view-criterion-header">
                {t("matrixView.criteriaColumn")}
              </th>
              {visibleAlternatives.map((alternative) => (
                <th
                  key={alternative.id}
                  scope="col"
                  className="category-matrix-view-alternative-header"
                >
                  {alternative.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.data.groups.map((group) => (
              <FragmentRows
                key={group.id}
                groupLabel={group.label}
                groupDescription={group.description}
                criteria={group.criteria}
                alternatives={visibleAlternatives}
                columnCount={visibleAlternatives.length + 1}
                renderFact={(fact, criterion) =>
                  renderMatrixFact(fact, criterion, t, i18n.language)
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface FragmentRowsProps {
  groupLabel: string;
  groupDescription: string | null;
  criteria: MatrixCriterion[];
  alternatives: MatrixAlternative[];
  columnCount: number;
  renderFact: (fact: MatrixFact, criterion: MatrixCriterion) => ReactNode;
}

function FragmentRows({
  groupLabel,
  groupDescription,
  criteria,
  alternatives,
  columnCount,
  renderFact,
}: FragmentRowsProps) {
  return (
    <>
      <tr className="category-matrix-view-group-row">
        <th scope="rowgroup" colSpan={columnCount}>
          <span>{groupLabel}</span>
          {groupDescription !== null && (
            <span className="category-matrix-view-group-description">
              {groupDescription}
            </span>
          )}
        </th>
      </tr>
      {criteria.map((criterion) => (
        <tr key={criterion.id}>
          <th scope="row" className="category-matrix-view-criterion-cell">
            <span className="category-matrix-view-criterion-label">
              {criterion.label}
            </span>
            {criterion.helpText !== null && (
              <span className="category-matrix-view-criterion-help">
                {criterion.helpText}
              </span>
            )}
          </th>
          {alternatives.map((alternative) => (
            <td key={alternative.id} className="category-matrix-view-fact-cell">
              {renderFact(
                alternative.facts[criterion.id] ?? UNVERIFIED_FACT,
                criterion,
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
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

  return renderVerifiedValue(fact.value, criterion, t, language);
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
        ? t(value ? "matrixView.yes" : "matrixView.no")
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
