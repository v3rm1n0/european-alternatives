import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  CategoryMatrixApiResponse,
  CategoryMatrixState,
  MatrixCriterion,
  MatrixGroup,
} from "../types";

type BrowseTranslator = ReturnType<typeof useTranslation<"browse">>["t"];

// eslint-disable-next-line react-refresh/only-export-components -- Tests import this pure helper from the panel module.
export function getRenderableMatrixFilterGroups(
  matrix: CategoryMatrixApiResponse,
): MatrixGroup[] {
  return matrix.data.groups
    .map((group) => ({
      ...group,
      criteria: group.criteria.filter(
        (criterion) => criterion.filterMode !== "none",
      ),
    }))
    .filter((group) => group.criteria.length > 0);
}

interface CategoryMatrixFilterPanelProps {
  state: CategoryMatrixState;
}

export default function CategoryMatrixFilterPanel({
  state,
}: CategoryMatrixFilterPanelProps) {
  const { t } = useTranslation("browse");

  const renderableGroups = useMemo(
    () =>
      state.matrix === null
        ? []
        : getRenderableMatrixFilterGroups(state.matrix),
    [state.matrix],
  );

  if (state.status === "idle" || state.status === "unavailable") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <section
        className="category-matrix-filter-panel category-matrix-filter-panel--state"
        aria-labelledby="category-matrix-filter-title"
      >
        <div className="category-matrix-filter-header">
          <h2 id="category-matrix-filter-title">{t("matrixFilters.title")}</h2>
        </div>
        <p className="category-matrix-filter-message" role="status">
          {t("matrixFilters.loading")}
        </p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section
        className="category-matrix-filter-panel category-matrix-filter-panel--state"
        aria-labelledby="category-matrix-filter-title"
      >
        <div className="category-matrix-filter-header">
          <h2 id="category-matrix-filter-title">{t("matrixFilters.title")}</h2>
        </div>
        <p
          className="category-matrix-filter-message category-matrix-filter-message--error"
          role="alert"
        >
          {t("matrixFilters.error")}
        </p>
      </section>
    );
  }

  if (state.status === "empty" || renderableGroups.length === 0) {
    return (
      <section
        className="category-matrix-filter-panel category-matrix-filter-panel--state"
        aria-labelledby="category-matrix-filter-title"
      >
        <div className="category-matrix-filter-header">
          <h2 id="category-matrix-filter-title">{t("matrixFilters.title")}</h2>
        </div>
        <p className="category-matrix-filter-message" role="status">
          {t("matrixFilters.empty")}
        </p>
      </section>
    );
  }

  const category = state.matrix.data.category;

  return (
    <section
      className="category-matrix-filter-panel"
      aria-labelledby="category-matrix-filter-title"
    >
      <div className="category-matrix-filter-header">
        <div>
          <h2 id="category-matrix-filter-title">{t("matrixFilters.title")}</h2>
          <p>{t("matrixFilters.subtitle", { category: category.name })}</p>
        </div>
        {category.emoji !== null && (
          <span className="category-matrix-filter-emoji" aria-hidden="true">
            {category.emoji}
          </span>
        )}
      </div>

      <div className="category-matrix-filter-groups">
        {renderableGroups.map((group) => (
          <fieldset key={group.id} className="category-matrix-filter-group">
            <legend>{group.label}</legend>
            {group.description !== null && (
              <p className="category-matrix-filter-group-description">
                {group.description}
              </p>
            )}
            <div className="category-matrix-filter-criteria">
              {group.criteria.map((criterion) => {
                const labelId = `matrix-filter-label-${criterion.id}`;

                return (
                  <div
                    key={criterion.id}
                    className="category-matrix-filter-criterion"
                  >
                    <div className="category-matrix-filter-criterion-header">
                      <span
                        id={labelId}
                        className="category-matrix-filter-criterion-title"
                      >
                        {criterion.label}
                      </span>
                      <span className="category-matrix-filter-mode">
                        {t(`matrixFilters.modes.${criterion.filterMode}`)}
                      </span>
                    </div>
                    {criterion.helpText !== null && (
                      <p className="category-matrix-filter-help">
                        {criterion.helpText}
                      </p>
                    )}
                    {renderCriterionControl(criterion, t, labelId)}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  );
}

function renderCriterionControl(
  criterion: MatrixCriterion,
  t: BrowseTranslator,
  labelId: string,
) {
  const controlId = `matrix-filter-${criterion.id}`;

  if (criterion.filterMode === "range" || criterion.valueType === "number") {
    return (
      <div className="category-matrix-filter-range">
        <input
          id={controlId}
          type="number"
          inputMode="decimal"
          placeholder={t("matrixFilters.minimum")}
          aria-label={t("matrixFilters.minimumFor", {
            criterion: criterion.label,
          })}
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder={t("matrixFilters.maximum")}
          aria-label={t("matrixFilters.maximumFor", {
            criterion: criterion.label,
          })}
        />
        <label className="category-matrix-filter-inline-option">
          <input type="checkbox" />
          <span>{t("matrixFilters.unverified")}</span>
        </label>
      </div>
    );
  }

  if (
    criterion.filterMode === "multi_select" ||
    criterion.valueType === "multi_enum"
  ) {
    const options =
      criterion.options.length > 0
        ? criterion.options
        : [{ id: "unverified", label: t("matrixFilters.unverified") }];

    return (
      <div
        className="category-matrix-filter-options"
        id={controlId}
        role="group"
        aria-labelledby={labelId}
      >
        {options.map((option) => (
          <label key={option.id} className="category-matrix-filter-option">
            <input type="checkbox" />
            <span>{option.label}</span>
          </label>
        ))}
        {criterion.options.length > 0 && (
          <label className="category-matrix-filter-option">
            <input type="checkbox" />
            <span>{t("matrixFilters.unverified")}</span>
          </label>
        )}
      </div>
    );
  }

  if (criterion.valueType === "boolean" || criterion.valueType === "enum") {
    return (
      <select
        id={controlId}
        className="category-matrix-filter-select"
        defaultValue=""
        aria-labelledby={labelId}
      >
        <option value="">{t("matrixFilters.any")}</option>
        {criterion.valueType === "boolean" ? (
          <>
            <option value="true">{t("matrixFilters.yes")}</option>
            <option value="false">{t("matrixFilters.no")}</option>
          </>
        ) : (
          criterion.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))
        )}
        <option value="unverified">{t("matrixFilters.unverified")}</option>
      </select>
    );
  }

  return (
    <div className="category-matrix-filter-text">
      <input
        id={controlId}
        type={
          criterion.valueType === "date"
            ? "date"
            : criterion.valueType === "url"
              ? "url"
              : "text"
        }
        placeholder={t("matrixFilters.valuePlaceholder")}
        aria-labelledby={labelId}
      />
      <label className="category-matrix-filter-inline-option">
        <input type="checkbox" />
        <span>{t("matrixFilters.unverified")}</span>
      </label>
    </div>
  );
}
