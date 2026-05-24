import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { isMatrixCriterionFilterActive } from "../utils/categoryMatrixFilters";
import type {
  CategoryMatrixApiResponse,
  CategoryMatrixState,
  MatrixCriterionFilterSelection,
  MatrixCriterion,
  MatrixFilterSelections,
  MatrixGroup,
} from "../types";

type BrowseTranslator = ReturnType<typeof useTranslation<"browse">>["t"];

export type MatrixCriterionFilterChange =
  | { kind: "set-value"; value: string }
  | { kind: "toggle-value"; value: string; checked: boolean }
  | { kind: "set-min"; value: string }
  | { kind: "set-max"; value: string }
  | { kind: "set-include-unverified"; checked: boolean };

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

// eslint-disable-next-line react-refresh/only-export-components -- Tests import this pure helper from the panel module.
export function updateMatrixCriterionFilterSelection(
  selectedFilters: MatrixFilterSelections,
  criterion: Pick<MatrixCriterion, "id" | "valueType">,
  change: MatrixCriterionFilterChange,
): MatrixFilterSelections {
  const currentSelection = selectedFilters[criterion.id];
  const nextSelection: MatrixCriterionFilterSelection = {
    ...currentSelection,
    includeUnverified: currentSelection?.includeUnverified ?? true,
  };

  switch (change.kind) {
    case "set-value": {
      const value = parseCriterionValue(criterion, change.value);
      delete nextSelection.values;
      delete nextSelection.min;
      delete nextSelection.max;

      if (value === undefined) {
        delete nextSelection.value;
      } else {
        nextSelection.value = value;
      }
      break;
    }
    case "toggle-value": {
      const selectedValues = new Set(currentSelection?.values ?? []);
      delete nextSelection.value;
      delete nextSelection.min;
      delete nextSelection.max;

      if (change.checked) {
        selectedValues.add(change.value);
      } else {
        selectedValues.delete(change.value);
      }

      const values = Array.from(selectedValues);
      if (values.length === 0) {
        delete nextSelection.values;
      } else {
        nextSelection.values = values;
      }
      break;
    }
    case "set-min": {
      const min = parseOptionalNumber(change.value);
      delete nextSelection.value;
      delete nextSelection.values;

      if (min === undefined) {
        delete nextSelection.min;
      } else {
        nextSelection.min = min;
      }
      break;
    }
    case "set-max": {
      const max = parseOptionalNumber(change.value);
      delete nextSelection.value;
      delete nextSelection.values;

      if (max === undefined) {
        delete nextSelection.max;
      } else {
        nextSelection.max = max;
      }
      break;
    }
    case "set-include-unverified":
      nextSelection.includeUnverified = change.checked;
      break;
  }

  const nextFilters = { ...selectedFilters };
  if (isMatrixCriterionFilterActive(nextSelection)) {
    nextFilters[criterion.id] = nextSelection;
  } else {
    delete nextFilters[criterion.id];
  }

  return nextFilters;
}

interface CategoryMatrixFilterPanelProps {
  state: CategoryMatrixState;
  selectedFilters?: MatrixFilterSelections;
  onFilterChange?: (filters: MatrixFilterSelections) => void;
}

export default function CategoryMatrixFilterPanel({
  state,
  selectedFilters = {},
  onFilterChange,
}: CategoryMatrixFilterPanelProps) {
  const { t } = useTranslation("browse");

  const renderableGroups = useMemo(
    () =>
      state.matrix === null
        ? []
        : getRenderableMatrixFilterGroups(state.matrix),
    [state.matrix],
  );

  const handleCriterionChange = useCallback(
    (criterion: MatrixCriterion, change: MatrixCriterionFilterChange) => {
      if (onFilterChange === undefined) {
        return;
      }

      onFilterChange(
        updateMatrixCriterionFilterSelection(
          selectedFilters,
          criterion,
          change,
        ),
      );
    },
    [onFilterChange, selectedFilters],
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
          <p className="category-matrix-filter-note">
            {t("matrixFilters.unverifiedIncludedByDefault")}
          </p>
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
                    {renderCriterionControl(
                      criterion,
                      t,
                      labelId,
                      selectedFilters[criterion.id],
                      handleCriterionChange,
                    )}
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
  selection: MatrixCriterionFilterSelection | undefined,
  onSelectionChange: (
    criterion: MatrixCriterion,
    change: MatrixCriterionFilterChange,
  ) => void,
) {
  const controlId = `matrix-filter-${criterion.id}`;

  if (criterion.filterMode === "range" || criterion.valueType === "number") {
    return (
      <div className="category-matrix-filter-range">
        <input
          id={controlId}
          type="number"
          inputMode="decimal"
          value={selection?.min ?? ""}
          onChange={(event) =>
            onSelectionChange(criterion, {
              kind: "set-min",
              value: event.currentTarget.value,
            })
          }
          placeholder={t("matrixFilters.minimum")}
          aria-label={t("matrixFilters.minimumFor", {
            criterion: criterion.label,
          })}
        />
        <input
          type="number"
          inputMode="decimal"
          value={selection?.max ?? ""}
          onChange={(event) =>
            onSelectionChange(criterion, {
              kind: "set-max",
              value: event.currentTarget.value,
            })
          }
          placeholder={t("matrixFilters.maximum")}
          aria-label={t("matrixFilters.maximumFor", {
            criterion: criterion.label,
          })}
        />
        {renderIncludeUnverifiedControl(
          criterion,
          t,
          selection,
          onSelectionChange,
        )}
      </div>
    );
  }

  if (
    criterion.filterMode === "multi_select" ||
    criterion.valueType === "multi_enum"
  ) {
    return (
      <div
        className="category-matrix-filter-options"
        id={controlId}
        role="group"
        aria-labelledby={labelId}
      >
        {criterion.options.map((option) => (
          <label key={option.id} className="category-matrix-filter-option">
            <input
              type="checkbox"
              checked={(selection?.values ?? []).includes(option.id)}
              onChange={(event) =>
                onSelectionChange(criterion, {
                  kind: "toggle-value",
                  value: option.id,
                  checked: event.currentTarget.checked,
                })
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
        {renderIncludeUnverifiedControl(
          criterion,
          t,
          selection,
          onSelectionChange,
        )}
      </div>
    );
  }

  if (criterion.valueType === "boolean" || criterion.valueType === "enum") {
    return (
      <>
        <select
          id={controlId}
          className="category-matrix-filter-select"
          value={selection?.value === undefined ? "" : String(selection.value)}
          onChange={(event) =>
            onSelectionChange(criterion, {
              kind: "set-value",
              value: event.currentTarget.value,
            })
          }
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
        </select>
        {renderIncludeUnverifiedControl(
          criterion,
          t,
          selection,
          onSelectionChange,
        )}
      </>
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
        value={typeof selection?.value === "string" ? selection.value : ""}
        onChange={(event) =>
          onSelectionChange(criterion, {
            kind: "set-value",
            value: event.currentTarget.value,
          })
        }
        placeholder={t("matrixFilters.valuePlaceholder")}
        aria-labelledby={labelId}
      />
      {renderIncludeUnverifiedControl(
        criterion,
        t,
        selection,
        onSelectionChange,
      )}
    </div>
  );
}

function renderIncludeUnverifiedControl(
  criterion: MatrixCriterion,
  t: BrowseTranslator,
  selection: MatrixCriterionFilterSelection | undefined,
  onSelectionChange: (
    criterion: MatrixCriterion,
    change: MatrixCriterionFilterChange,
  ) => void,
) {
  return (
    <label className="category-matrix-filter-inline-option">
      <input
        type="checkbox"
        checked={selection?.includeUnverified ?? true}
        onChange={(event) =>
          onSelectionChange(criterion, {
            kind: "set-include-unverified",
            checked: event.currentTarget.checked,
          })
        }
      />
      <span>{t("matrixFilters.includeUnverified")}</span>
    </label>
  );
}

function parseCriterionValue(
  criterion: Pick<MatrixCriterion, "valueType">,
  value: string,
): boolean | number | string | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  if (criterion.valueType === "boolean") {
    return value === "true";
  }

  if (criterion.valueType === "number") {
    return parseOptionalNumber(value);
  }

  return value;
}

function parseOptionalNumber(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
