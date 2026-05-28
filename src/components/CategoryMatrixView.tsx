import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeHref } from "../utils/sanitizeHref";
import CategoryMatrixToolbar, {
  type MatrixDensity,
} from "./CategoryMatrixToolbar";
import type {
  CategoryMatrixApiResponse,
  MatrixCriterion,
  MatrixCriterionOption,
  MatrixDisplayTone,
  MatrixFact,
  MatrixFactValue,
  MatrixGroup,
} from "../types";

type TranslateFn = ReturnType<typeof useTranslation<"browse">>["t"];

interface CategoryMatrixViewProps {
  matrix: CategoryMatrixApiResponse;
  visibleAlternativeIds?: ReadonlySet<string>;
  reducedMotion?: boolean;
}

const UNVERIFIED_FACT: MatrixFact = {
  status: "unverified",
  value: null,
};

const FULL_COVERAGE_MULTI_ENUM_CRITERIA = new Set([
  "supported_platforms",
  "reactions_threads",
]);

function effectiveFactKey(fact: MatrixFact): string {
  if (fact.status === "unverified") {
    return "u";
  }
  if (fact.status === "not_applicable") {
    return "na";
  }
  const value = fact.value;
  if (value === null) {
    return "v:null";
  }
  if (Array.isArray(value)) {
    const sorted = [...value].sort();
    return `v:arr:${JSON.stringify(sorted)}`;
  }
  return `v:${typeof value}:${JSON.stringify(value)}`;
}

function cellCustomProps(rowIndex: number, colIndex: number): CSSProperties {
  return {
    ["--cell-row" as never]: rowIndex,
    ["--cell-col" as never]: colIndex,
  };
}

export default function CategoryMatrixView({
  matrix,
  visibleAlternativeIds,
  reducedMotion = false,
}: CategoryMatrixViewProps) {
  const [query, setQuery] = useState("");
  const [density, setDensity] = useState<MatrixDensity>("comfortable");
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [hideUnverified, setHideUnverified] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set<string>());
  const [focusedOnly, setFocusedOnly] = useState(false);
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const bottomScrollRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [scrollSpacerWidth, setScrollSpacerWidth] = useState(0);
  const { t, i18n } = useTranslation("browse");
  const browseFilteredAlternatives = useMemo(
    () =>
      visibleAlternativeIds === undefined
        ? matrix.data.alternatives
        : matrix.data.alternatives.filter((alternative) =>
            visibleAlternativeIds.has(alternative.id),
          ),
    [matrix.data.alternatives, visibleAlternativeIds],
  );
  const pinnedAlternatives = useMemo(
    () =>
      browseFilteredAlternatives.filter((alternative) =>
        pinnedIds.has(alternative.id),
      ),
    [browseFilteredAlternatives, pinnedIds],
  );
  const orderedAlternatives = useMemo(() => {
    if (pinnedAlternatives.length === 0) {
      return browseFilteredAlternatives;
    }
    const pinnedSet = new Set(pinnedAlternatives.map((alt) => alt.id));
    const unpinned = browseFilteredAlternatives.filter(
      (alternative) => !pinnedSet.has(alternative.id),
    );
    return [...pinnedAlternatives, ...unpinned];
  }, [browseFilteredAlternatives, pinnedAlternatives]);
  const focusMode = focusedOnly && pinnedAlternatives.length > 0;
  const visibleAlternatives = focusMode
    ? pinnedAlternatives
    : orderedAlternatives;
  const comparisonAlternatives = focusMode
    ? pinnedAlternatives
    : browseFilteredAlternatives;
  const focusedEmpty = focusedOnly && pinnedAlternatives.length === 0;
  const pinnedCount = useMemo(
    () =>
      matrix.data.alternatives.filter((alternative) =>
        pinnedIds.has(alternative.id),
      ).length,
    [matrix.data.alternatives, pinnedIds],
  );
  const togglePin = (alternativeId: string) => {
    setPinnedIds((previous) => {
      const next = new Set(previous);
      if (next.has(alternativeId)) {
        next.delete(alternativeId);
      } else {
        next.add(alternativeId);
      }
      return next;
    });
  };
  const clearPins = () => {
    setPinnedIds(new Set<string>());
    setFocusedOnly(false);
  };
  const exitFocus = () => {
    setFocusedOnly(false);
  };
  const title = t("matrixView.title", {
    category: matrix.data.category.name,
  });
  const groupsWithCriteria = useMemo(
    () => matrix.data.groups.filter((group) => group.criteria.length > 0),
    [matrix.data.groups],
  );
  const totalCriterionCount = useMemo(
    () =>
      groupsWithCriteria.reduce(
        (count, group) => count + group.criteria.length,
        0,
      ),
    [groupsWithCriteria],
  );
  const tokens = useMemo(
    () =>
      query
        .trim()
        .toLowerCase()
        .split(/\s+/u)
        .filter((token) => token.length > 0),
    [query],
  );
  const isQuerying = tokens.length > 0;
  const filteredGroups = useMemo<MatrixGroup[]>(() => {
    const applyDifferences =
      showOnlyDifferences && comparisonAlternatives.length > 1;
    const applyHideUnverified = hideUnverified;
    const applySearch = isQuerying;

    if (!applyDifferences && !applyHideUnverified && !applySearch) {
      return groupsWithCriteria;
    }

    const next: MatrixGroup[] = [];
    for (const group of groupsWithCriteria) {
      const groupLabelLower = group.label.toLowerCase();
      const criteria = group.criteria.filter((criterion) => {
        if (applyHideUnverified) {
          const allUnverified = comparisonAlternatives.every((alternative) => {
            const fact = alternative.facts[criterion.id] ?? UNVERIFIED_FACT;
            return fact.status === "unverified";
          });
          if (allUnverified && comparisonAlternatives.length > 0) {
            return false;
          }
        }
        if (applyDifferences) {
          const firstKey = effectiveFactKey(
            comparisonAlternatives[0]?.facts[criterion.id] ?? UNVERIFIED_FACT,
          );
          const allSame = comparisonAlternatives.every(
            (alternative) =>
              effectiveFactKey(
                alternative.facts[criterion.id] ?? UNVERIFIED_FACT,
              ) === firstKey,
          );
          if (allSame) {
            return false;
          }
        }
        if (applySearch) {
          const labelLower = criterion.label.toLowerCase();
          const helpLower = (criterion.helpText ?? "").toLowerCase();
          return tokens.every(
            (token) =>
              labelLower.includes(token) ||
              helpLower.includes(token) ||
              groupLabelLower.includes(token),
          );
        }
        return true;
      });
      if (criteria.length > 0) {
        next.push({ ...group, criteria });
      }
    }
    return next;
  }, [
    groupsWithCriteria,
    isQuerying,
    tokens,
    showOnlyDifferences,
    hideUnverified,
    comparisonAlternatives,
  ]);
  const filteredCriteria = useMemo(
    () => filteredGroups.flatMap((group) => group.criteria),
    [filteredGroups],
  );
  const togglesActive = showOnlyDifferences || hideUnverified;
  const showEmptyState =
    filteredCriteria.length === 0 && (isQuerying || togglesActive);
  const updateScrollSpacerWidth = useCallback(() => {
    const width = tableRef.current?.scrollWidth ?? 0;
    setScrollSpacerWidth((previous) => (previous === width ? previous : width));

    const topScroller = topScrollRef.current;
    const bottomScroller = bottomScrollRef.current;
    if (
      topScroller !== null &&
      bottomScroller !== null &&
      Math.abs(topScroller.scrollLeft - bottomScroller.scrollLeft) > 1
    ) {
      topScroller.scrollLeft = bottomScroller.scrollLeft;
    }
  }, []);
  const syncScroll = useCallback((source: "top" | "bottom") => {
    const sourceElement =
      source === "top" ? topScrollRef.current : bottomScrollRef.current;
    const targetElement =
      source === "top" ? bottomScrollRef.current : topScrollRef.current;

    if (sourceElement === null || targetElement === null) {
      return;
    }

    if (Math.abs(targetElement.scrollLeft - sourceElement.scrollLeft) > 1) {
      targetElement.scrollLeft = sourceElement.scrollLeft;
    }
  }, []);

  useEffect(() => {
    updateScrollSpacerWidth();
  });

  useEffect(() => {
    updateScrollSpacerWidth();

    if (typeof ResizeObserver === "undefined" || tableRef.current === null) {
      return undefined;
    }

    const observer = new ResizeObserver(updateScrollSpacerWidth);
    observer.observe(tableRef.current);
    if (bottomScrollRef.current !== null) {
      observer.observe(bottomScrollRef.current);
    }

    return () => observer.disconnect();
  }, [
    filteredCriteria.length,
    focusedEmpty,
    showEmptyState,
    updateScrollSpacerWidth,
    visibleAlternatives.length,
  ]);

  return (
    <section
      className="category-matrix-view"
      aria-labelledby="category-matrix-view-title"
      data-density={density}
    >
      <div className="category-matrix-view-header">
        <h2 id="category-matrix-view-title">{title}</h2>
      </div>
      <MatrixLegend t={t} />
      <CategoryMatrixToolbar
        query={query}
        onQueryChange={setQuery}
        density={density}
        onDensityChange={setDensity}
        matchCount={filteredCriteria.length}
        totalCount={totalCriterionCount}
        showOnlyDifferences={showOnlyDifferences}
        onShowOnlyDifferencesChange={setShowOnlyDifferences}
        hideUnverified={hideUnverified}
        onHideUnverifiedChange={setHideUnverified}
        pinnedCount={pinnedCount}
        focusedOnly={focusedOnly}
        onFocusedOnlyChange={setFocusedOnly}
        onClearPins={clearPins}
      />
      {focusedEmpty ? (
        <div
          className="category-matrix-focused-empty"
          role="status"
          data-testid="category-matrix-focused-empty"
        >
          <h3 className="category-matrix-focused-empty-title">
            {t("matrixView.focusedEmptyTitle")}
          </h3>
          <p className="category-matrix-focused-empty-body">
            {t("matrixView.focusedEmptyBody")}
          </p>
          <button
            type="button"
            className="category-matrix-focused-empty-exit"
            onClick={exitFocus}
          >
            {t("matrixView.exitFocus")}
          </button>
        </div>
      ) : showEmptyState ? (
        <div
          className="category-matrix-toolbar-empty"
          role="status"
          data-testid="category-matrix-toolbar-empty"
        >
          <h3 className="category-matrix-toolbar-empty-title">
            {t("matrixView.toolbar.emptyTitle")}
          </h3>
          <p className="category-matrix-toolbar-empty-body">
            {togglesActive
              ? t("matrixView.toolbar.emptyBodyWithToggles")
              : t("matrixView.toolbar.emptyBody")}
          </p>
          {togglesActive && (
            <button
              type="button"
              className="category-matrix-toolbar-empty-reset"
              onClick={() => {
                setShowOnlyDifferences(false);
                setHideUnverified(false);
              }}
            >
              {t("matrixView.toolbar.resetToggles")}
            </button>
          )}
          {isQuerying && (
            <button
              type="button"
              className="category-matrix-toolbar-empty-clear"
              onClick={() => setQuery("")}
            >
              {t("matrixView.toolbar.clearSearch")}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="category-matrix-view-scroll-frame">
            <div
              className="category-matrix-view-scrollbar-top"
              aria-hidden="true"
              ref={topScrollRef}
              onScroll={() => syncScroll("top")}
            >
              <div
                className="category-matrix-view-scrollbar-spacer"
                style={
                  scrollSpacerWidth > 0
                    ? { width: scrollSpacerWidth }
                    : undefined
                }
              />
            </div>
            <div
              className="category-matrix-view-scroll"
              tabIndex={0}
              ref={bottomScrollRef}
              onScroll={() => syncScroll("bottom")}
            >
              <table
                ref={tableRef}
                className="category-matrix-view-table"
                aria-label={title}
              >
                <thead className="category-matrix-view-head">
                  <tr className="category-matrix-view-group-row">
                    <th
                      scope="col"
                      rowSpan={2}
                      className="category-matrix-view-product-header category-matrix-view-corner"
                    >
                      {t("matrixView.productColumn")}
                    </th>
                    {filteredGroups.map((group) => (
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
                    {filteredCriteria.map((criterion) => (
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
                  {visibleAlternatives.map((alternative, rowIndex) => {
                    const isPinned = pinnedIds.has(alternative.id);
                    const pinLabel = t(
                      isPinned
                        ? "matrixView.unpinAction"
                        : "matrixView.pinAction",
                      { product: alternative.name },
                    );
                    const rowClassName = isPinned
                      ? "category-matrix-view-row is-pinned"
                      : "category-matrix-view-row";
                    return (
                      <tr key={alternative.id} className={rowClassName}>
                        <th
                          scope="row"
                          className="category-matrix-view-alternative-label"
                          data-morph-id={
                            reducedMotion
                              ? undefined
                              : `alt-name-${alternative.id}`
                          }
                          data-pinned={isPinned ? "true" : "false"}
                          style={cellCustomProps(rowIndex, 0)}
                        >
                          <span className="category-matrix-view-alternative-name">
                            {alternative.name}
                          </span>
                          <button
                            type="button"
                            aria-pressed={isPinned ? "true" : "false"}
                            aria-label={pinLabel}
                            title={pinLabel}
                            className={
                              isPinned
                                ? "category-matrix-pin-button is-pinned"
                                : "category-matrix-pin-button"
                            }
                            onClick={() => togglePin(alternative.id)}
                          >
                            {renderPinIcon(isPinned)}
                          </button>
                        </th>
                        {filteredCriteria.map((criterion, colIndex) => (
                          <td
                            key={criterion.id}
                            className="category-matrix-view-fact-cell"
                            style={cellCustomProps(rowIndex, colIndex + 1)}
                          >
                            <MatrixCell
                              fact={
                                alternative.facts[criterion.id] ??
                                UNVERIFIED_FACT
                              }
                              criterion={criterion}
                              alternativeName={alternative.name}
                              t={t}
                              language={i18n.language}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <MobileMatrixInspector
            groups={filteredGroups}
            alternatives={orderedAlternatives}
            pinnedAlternatives={pinnedAlternatives}
            t={t}
            language={i18n.language}
          />
        </>
      )}
    </section>
  );
}

function renderPinIcon(isPinned: boolean): ReactNode {
  return (
    <svg
      className="category-matrix-pin-icon"
      viewBox="0 0 24 24"
      fill={isPinned ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 3l5 5-4 4v5l-2 2-5-5-4 4-2-2 4-4-5-5 2-2h5l4-4z" />
    </svg>
  );
}

interface MobileMatrixInspectorProps {
  groups: CategoryMatrixApiResponse["data"]["groups"];
  alternatives: CategoryMatrixApiResponse["data"]["alternatives"];
  pinnedAlternatives?: CategoryMatrixApiResponse["data"]["alternatives"];
  t: TranslateFn;
  language: string;
}

export function deriveFocusedAlternativeIds(
  primarySelection: string,
  secondarySelection: string,
  alternatives: ReadonlyArray<{ id: string }>,
): { primaryId: string; secondaryId: string } {
  const primaryId = alternatives.some(
    (alternative) => alternative.id === primarySelection,
  )
    ? primarySelection
    : (alternatives[0]?.id ?? "");
  const secondaryId =
    secondarySelection !== "" &&
    secondarySelection !== primaryId &&
    alternatives.some((alternative) => alternative.id === secondarySelection)
      ? secondarySelection
      : "";
  return { primaryId, secondaryId };
}

function MobileMatrixInspector({
  groups,
  alternatives,
  pinnedAlternatives,
  t,
  language,
}: MobileMatrixInspectorProps) {
  const primaryLabel = t("matrixView.inspector.primaryLabel");
  const compareLabel = t("matrixView.inspector.compareLabel");
  const noSecondaryLabel = t("matrixView.inspector.noSecondary");

  const [primarySelection, setPrimaryId] = useState<string>("");
  const [secondarySelection, setSecondaryId] = useState<string>("");

  const { primaryId, secondaryId } = deriveFocusedAlternativeIds(
    primarySelection,
    secondarySelection,
    alternatives,
  );

  const usePinned =
    pinnedAlternatives !== undefined && pinnedAlternatives.length > 0;

  const focusedAlternatives = usePinned
    ? pinnedAlternatives
    : ([
        alternatives.find((alternative) => alternative.id === primaryId),
        secondaryId === ""
          ? undefined
          : alternatives.find((alternative) => alternative.id === secondaryId),
      ].filter((alternative): alternative is (typeof alternatives)[number] =>
        Boolean(alternative),
      ) as CategoryMatrixApiResponse["data"]["alternatives"]);

  return (
    <div
      className="category-matrix-mobile-inspector"
      data-testid="category-matrix-mobile-inspector"
      data-mode={usePinned ? "pinned" : "select"}
    >
      {!usePinned && (
        <div className="category-matrix-mobile-inspector-controls">
          <label className="category-matrix-mobile-inspector-control">
            <span className="category-matrix-mobile-inspector-control-label">
              {primaryLabel}
            </span>
            <select
              className="category-matrix-mobile-inspector-select"
              aria-label={primaryLabel}
              value={primaryId}
              onChange={(event) => setPrimaryId(event.target.value)}
            >
              {alternatives.map((alternative) => (
                <option key={alternative.id} value={alternative.id}>
                  {alternative.name}
                </option>
              ))}
            </select>
          </label>
          <label className="category-matrix-mobile-inspector-control">
            <span className="category-matrix-mobile-inspector-control-label">
              {compareLabel}
            </span>
            <select
              className="category-matrix-mobile-inspector-select"
              aria-label={compareLabel}
              value={secondaryId}
              onChange={(event) => setSecondaryId(event.target.value)}
            >
              <option value="">{noSecondaryLabel}</option>
              {alternatives
                .filter((alternative) => alternative.id !== primaryId)
                .map((alternative) => (
                  <option key={alternative.id} value={alternative.id}>
                    {alternative.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}
      {groups.map((group) => (
        <section
          key={group.id}
          className="category-matrix-mobile-inspector-group"
          aria-label={group.label}
        >
          <h3 className="category-matrix-mobile-inspector-group-label">
            {group.label}
          </h3>
          {group.criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="category-matrix-mobile-inspector-row"
            >
              <span className="category-matrix-mobile-inspector-criterion-label">
                {criterion.label}
              </span>
              <div className="category-matrix-mobile-inspector-cells">
                {focusedAlternatives.map((alternative) => (
                  <div
                    key={alternative.id}
                    className="category-matrix-mobile-inspector-cell"
                    data-alternative-id={alternative.id}
                  >
                    <span className="category-matrix-mobile-inspector-alternative-label">
                      {alternative.name}
                    </span>
                    <MatrixCell
                      fact={alternative.facts[criterion.id] ?? UNVERIFIED_FACT}
                      criterion={criterion}
                      alternativeName={alternative.name}
                      t={t}
                      language={language}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

interface MatrixLegendProps {
  t: TranslateFn;
}

function MatrixLegend({ t }: MatrixLegendProps) {
  const entries: ReadonlyArray<{
    tone:
      | "positive"
      | "warning"
      | "negative"
      | "neutral"
      | "unverified"
      | "not-applicable";
    labelKey: string;
  }> = [
    { tone: "positive", labelKey: "matrixView.legend.positive" },
    { tone: "warning", labelKey: "matrixView.legend.warning" },
    { tone: "negative", labelKey: "matrixView.legend.negative" },
    { tone: "neutral", labelKey: "matrixView.legend.neutral" },
    { tone: "unverified", labelKey: "matrixView.legend.unverified" },
    { tone: "not-applicable", labelKey: "matrixView.legend.notApplicable" },
  ];

  return (
    <div className="category-matrix-legend" role="list">
      <span className="category-matrix-legend-title">
        {t("matrixView.legend.title")}
      </span>
      {entries.map((entry) => (
        <span
          key={entry.tone}
          role="listitem"
          className={`category-matrix-legend-item category-matrix-legend-item--${entry.tone}`}
        >
          {renderLegendIcon(entry.tone)}
          <span className="category-matrix-legend-label">
            {t(entry.labelKey)}
          </span>
        </span>
      ))}
    </div>
  );
}

function renderLegendIcon(
  tone:
    | "positive"
    | "warning"
    | "negative"
    | "neutral"
    | "unverified"
    | "not-applicable",
): ReactNode {
  const className = "category-matrix-legend-icon";
  switch (tone) {
    case "positive":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      );
    case "negative":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      );
    case "warning":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2 1 21h22L12 2zm0 5 7.53 13H4.47L12 7zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z" />
        </svg>
      );
    case "unverified":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M11 7h2v6h-2zm0 8h2v2h-2zM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
        </svg>
      );
    case "not-applicable":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5 11h14v2H5z" />
        </svg>
      );
    case "neutral":
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}

interface MatrixCellProps {
  fact: MatrixFact;
  criterion: MatrixCriterion;
  alternativeName: string;
  t: TranslateFn;
  language: string;
}

function MatrixCell({
  fact,
  criterion,
  alternativeName,
  t,
  language,
}: MatrixCellProps) {
  const body = renderFactBody(fact, criterion, t, language);
  const sourceHref = getVerifiedSourceHref(fact);

  if (sourceHref !== undefined) {
    return (
      <span className="category-matrix-cell">
        <a
          className="category-matrix-cell-source-link"
          href={sourceHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("matrixView.openSourceLabel", {
            product: alternativeName,
            criterion: criterion.label,
          })}
        >
          {renderSourceLinkBody(fact, criterion, body)}
        </a>
      </span>
    );
  }

  return <span className="category-matrix-cell">{body}</span>;
}

function getVerifiedSourceHref(fact: MatrixFact): string | undefined {
  if (fact.status !== "verified") {
    return undefined;
  }
  const source = fact.source;
  if (source === undefined) {
    return undefined;
  }

  return sanitizeHref(source.url);
}

function renderSourceLinkBody(
  fact: MatrixFact,
  criterion: MatrixCriterion,
  body: ReactNode,
): ReactNode {
  if (
    criterion.valueType === "url" &&
    fact.status === "verified" &&
    typeof fact.value === "string"
  ) {
    return fact.value;
  }

  return body;
}

function renderFactBody(
  fact: MatrixFact,
  criterion: MatrixCriterion,
  t: TranslateFn,
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
  t: TranslateFn,
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
        ? renderBooleanVerdict(value, criterion, t)
        : String(value);
    case "enum":
      return typeof value === "string"
        ? renderOption(criterion, value, t)
        : String(value);
    case "multi_enum":
      return Array.isArray(value) ? (
        renderMultiEnumValue(value, criterion, t)
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

function renderMultiEnumValue(
  value: string[],
  criterion: MatrixCriterion,
  t: TranslateFn,
): ReactNode {
  if (FULL_COVERAGE_MULTI_ENUM_CRITERIA.has(criterion.id)) {
    return renderFullCoverageOptions(value, criterion, t);
  }

  return (
    <span className="category-matrix-option-list">
      {value.map((optionId) => renderOption(criterion, optionId, t))}
    </span>
  );
}

function renderFullCoverageOptions(
  value: string[],
  criterion: MatrixCriterion,
  t: TranslateFn,
): ReactNode {
  const selected = new Set(value);
  const knownOptionIds = new Set(criterion.options.map((option) => option.id));
  const unknownSelected = value.filter((optionId) => !knownOptionIds.has(optionId));

  return (
    <span className="category-matrix-option-list category-matrix-option-list--coverage">
      {criterion.options.map((option) =>
        renderOption(criterion, option.id, t, {
          tone: selected.has(option.id) ? "positive" : "negative",
        }),
      )}
      {unknownSelected.map((optionId) =>
        renderOption(criterion, optionId, t, { tone: "positive" }),
      )}
    </span>
  );
}

type MatrixBooleanTone = "positive" | "warning" | "negative" | "neutral";

function renderBooleanVerdict(
  value: boolean,
  criterion: MatrixCriterion,
  t: TranslateFn,
): ReactNode {
  const tone = booleanVerdictTone(value, criterion.semantics);
  const toneClass = `category-matrix-fact--${tone}`;
  const label = t(value ? "matrixView.yes" : "matrixView.no");

  return (
    <span className={`category-matrix-fact ${toneClass}`}>
      {renderBooleanVerdictIcon(tone)}
      <span className="category-matrix-fact-label">{label}</span>
    </span>
  );
}

function booleanVerdictTone(
  value: boolean,
  semantics: MatrixCriterion["semantics"],
): MatrixBooleanTone {
  switch (semantics) {
    case "beneficial":
      return value ? "positive" : "negative";
    case "harmful":
    case "risk":
      return value ? "negative" : "positive";
    case "tradeoff":
      return "warning";
    case "informational":
    case "neutral":
    default:
      return "neutral";
  }
}

function renderBooleanVerdictIcon(tone: MatrixBooleanTone): ReactNode {
  const className = "category-matrix-fact-icon";

  switch (tone) {
    case "positive":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      );
    case "negative":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      );
    case "warning":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      );
    case "neutral":
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5 11h14v2H5z" />
        </svg>
      );
  }
}

function renderOption(
  criterion: MatrixCriterion,
  optionId: string,
  t: TranslateFn,
  overrides: { tone?: MatrixDisplayTone } = {},
): ReactNode {
  const option = criterion.options.find((entry) => entry.id === optionId);
  const label = option?.label ?? optionId;
  const tone = overrides.tone ?? getOptionTone(option);
  const toneLabel = t(`matrixView.legend.${toneLabelKey(tone)}`);

  return (
    <span
      key={optionId}
      className={`category-matrix-option category-matrix-option--${tone}`}
      aria-label={`${toneLabel}: ${label}`}
    >
      {renderOptionIcon(tone)}
      <span className="category-matrix-option-label">{label}</span>
    </span>
  );
}

function toneLabelKey(tone: string): string {
  switch (tone) {
    case "positive":
      return "positive";
    case "warning":
      return "warning";
    case "negative":
      return "negative";
    case "tradeoff":
      return "tradeoff";
    case "neutral":
    default:
      return "neutral";
  }
}

function renderOptionIcon(tone: string): ReactNode {
  const className = "category-matrix-option-icon";
  switch (tone) {
    case "positive":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      );
    case "negative":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      );
    case "warning":
    case "tradeoff":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2 1 21h22L12 2zm-1 6h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      );
    case "neutral":
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
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
