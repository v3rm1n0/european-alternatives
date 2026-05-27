import { useTranslation } from "react-i18next";

export type MatrixDensity = "comfortable" | "compact";

interface CategoryMatrixToolbarProps {
  query: string;
  onQueryChange: (next: string) => void;
  density: MatrixDensity;
  onDensityChange: (next: MatrixDensity) => void;
  matchCount: number;
  totalCount: number;
  showOnlyDifferences: boolean;
  onShowOnlyDifferencesChange: (next: boolean) => void;
  hideUnverified: boolean;
  onHideUnverifiedChange: (next: boolean) => void;
}

export default function CategoryMatrixToolbar({
  query,
  onQueryChange,
  density,
  onDensityChange,
  matchCount,
  totalCount,
  showOnlyDifferences,
  onShowOnlyDifferencesChange,
  hideUnverified,
  onHideUnverifiedChange,
}: CategoryMatrixToolbarProps) {
  const { t } = useTranslation("browse");
  const searchLabel = t("matrixView.toolbar.searchLabel");
  const placeholder = t("matrixView.toolbar.searchPlaceholder");
  const clearLabel = t("matrixView.toolbar.clearSearch");
  const densityLabel = t("matrixView.toolbar.densityLabel");
  const comfortableLabel = t("matrixView.toolbar.densityComfortable");
  const compactLabel = t("matrixView.toolbar.densityCompact");
  const showDifferencesLabel = t("matrixView.toolbar.showDifferences");
  const hideUnverifiedLabel = t("matrixView.toolbar.hideUnverified");
  const hasQuery = query.trim() !== "";

  return (
    <div className="category-matrix-toolbar">
      <div className="category-matrix-toolbar-search">
        <svg
          className="category-matrix-toolbar-search-icon"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="search"
          className="category-matrix-toolbar-search-input"
          aria-label={searchLabel}
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {hasQuery && (
          <button
            type="button"
            className="category-matrix-toolbar-search-clear"
            aria-label={clearLabel}
            onClick={() => onQueryChange("")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="category-matrix-toolbar-search-clear-icon"
            >
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>
      {hasQuery && (
        <span
          className="category-matrix-toolbar-match-count"
          aria-live="polite"
        >
          {t("matrixView.toolbar.matchCount", {
            matched: matchCount,
            total: totalCount,
          })}
        </span>
      )}
      <div className="category-matrix-toolbar-toggles">
        <button
          type="button"
          aria-pressed={showOnlyDifferences ? "true" : "false"}
          className={
            showOnlyDifferences
              ? "category-matrix-toolbar-toggle is-active"
              : "category-matrix-toolbar-toggle"
          }
          onClick={() => onShowOnlyDifferencesChange(!showOnlyDifferences)}
        >
          {showDifferencesLabel}
        </button>
        <button
          type="button"
          aria-pressed={hideUnverified ? "true" : "false"}
          className={
            hideUnverified
              ? "category-matrix-toolbar-toggle is-active"
              : "category-matrix-toolbar-toggle"
          }
          onClick={() => onHideUnverifiedChange(!hideUnverified)}
        >
          {hideUnverifiedLabel}
        </button>
      </div>
      <div
        className="category-matrix-toolbar-density"
        role="radiogroup"
        aria-label={densityLabel}
      >
        <span
          className="category-matrix-toolbar-density-label"
          aria-hidden="true"
        >
          {densityLabel}
        </span>
        <button
          type="button"
          role="radio"
          aria-checked={density === "comfortable"}
          className={
            density === "comfortable"
              ? "category-matrix-toolbar-density-option is-active"
              : "category-matrix-toolbar-density-option"
          }
          onClick={() => onDensityChange("comfortable")}
        >
          {comfortableLabel}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={density === "compact"}
          className={
            density === "compact"
              ? "category-matrix-toolbar-density-option is-active"
              : "category-matrix-toolbar-density-option"
          }
          onClick={() => onDensityChange("compact")}
        >
          {compactLabel}
        </button>
      </div>
    </div>
  );
}
