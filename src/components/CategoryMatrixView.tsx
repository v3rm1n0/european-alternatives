import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeHref } from "../utils/sanitizeHref";
import type {
  CategoryMatrixApiResponse,
  MatrixCriterion,
  MatrixCriterionOption,
  MatrixFact,
  MatrixFactValue,
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
    () => matrix.data.groups.filter((group) => group.criteria.length > 0),
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
      <MatrixLegend t={t} />
      <div className="category-matrix-view-scroll" tabIndex={0}>
        <table className="category-matrix-view-table" aria-label={title}>
          <thead className="category-matrix-view-head">
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
            {visibleAlternatives.map((alternative, rowIndex) => (
              <tr key={alternative.id}>
                <th
                  scope="row"
                  className="category-matrix-view-alternative-label"
                  data-morph-id={
                    reducedMotion ? undefined : `alt-name-${alternative.id}`
                  }
                  style={cellCustomProps(rowIndex, 0)}
                >
                  {alternative.name}
                </th>
                {flatCriteria.map((criterion, colIndex) => (
                  <td
                    key={criterion.id}
                    className="category-matrix-view-fact-cell"
                    style={cellCustomProps(rowIndex, colIndex + 1)}
                  >
                    <MatrixCell
                      fact={alternative.facts[criterion.id] ?? UNVERIFIED_FACT}
                      criterion={criterion}
                      alternativeId={alternative.id}
                      alternativeName={alternative.name}
                      t={t}
                      language={i18n.language}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MobileMatrixInspector
        groups={groupsWithCriteria}
        alternatives={visibleAlternatives}
        t={t}
        language={i18n.language}
      />
    </section>
  );
}

interface MobileMatrixInspectorProps {
  groups: CategoryMatrixApiResponse["data"]["groups"];
  alternatives: CategoryMatrixApiResponse["data"]["alternatives"];
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

  const focusedAlternatives = [
    alternatives.find((alternative) => alternative.id === primaryId),
    secondaryId === ""
      ? undefined
      : alternatives.find((alternative) => alternative.id === secondaryId),
  ].filter((alternative): alternative is (typeof alternatives)[number] =>
    Boolean(alternative),
  );

  return (
    <div
      className="category-matrix-mobile-inspector"
      data-testid="category-matrix-mobile-inspector"
    >
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
                      alternativeId={alternative.id}
                      alternativeName={alternative.name}
                      t={t}
                      language={language}
                      idScope="mobile"
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
  alternativeId: string;
  alternativeName: string;
  t: TranslateFn;
  language: string;
  idScope?: string;
}

function MatrixCell({
  fact,
  criterion,
  alternativeId,
  alternativeName,
  t,
  language,
  idScope,
}: MatrixCellProps) {
  const [open, setOpen] = useState(false);
  const scopeSuffix = idScope === undefined ? "" : `-${idScope}`;
  const popoverId = `category-matrix-cell-popover-${alternativeId}-${criterion.id}${scopeSuffix}`;
  const triggerLabel = t("matrixView.popover.openLabel", {
    product: alternativeName,
    criterion: criterion.label,
  });
  const popoverBody = renderFactBody(fact, criterion, t, language);
  const triggerBody = renderTriggerBody(fact, criterion, popoverBody);

  return (
    <span className="category-matrix-cell">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open ? "true" : "false"}
        aria-controls={popoverId}
        aria-label={triggerLabel}
        className="category-matrix-cell-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        {triggerBody}
      </button>
      <span
        id={popoverId}
        role="dialog"
        aria-label={triggerLabel}
        data-testid="category-matrix-cell-popover"
        className="category-matrix-cell-popover"
        hidden={!open}
      >
        <span className="category-matrix-cell-popover-header">
          <span className="category-matrix-cell-popover-product">
            {alternativeName}
          </span>
          <span className="category-matrix-cell-popover-criterion">
            {criterion.label}
          </span>
          <button
            type="button"
            className="category-matrix-cell-popover-close"
            onClick={() => setOpen(false)}
          >
            {t("matrixView.popover.close")}
          </button>
        </span>
        <span className="category-matrix-cell-popover-value">
          {popoverBody}
        </span>
        {renderPopoverSource(fact, t)}
      </span>
    </span>
  );
}

// The trigger is a <button>, whose content model forbids interactive
// descendants. For url-valueType cells the verified value would otherwise
// render as an <a>, producing invalid <button><a> nesting and a real click
// conflict (anchor navigates + bubbles to the button's toggle). Render the
// raw URL text inside the trigger and let the anchor live only inside the
// popover body, which is not nested in a button.
function renderTriggerBody(
  fact: MatrixFact,
  criterion: MatrixCriterion,
  popoverBody: ReactNode,
): ReactNode {
  if (
    criterion.valueType === "url" &&
    fact.status === "verified" &&
    typeof fact.value === "string"
  ) {
    return fact.value;
  }
  return popoverBody;
}

function renderPopoverSource(fact: MatrixFact, t: TranslateFn): ReactNode {
  if (fact.status !== "verified") {
    return null;
  }
  const source = fact.source;
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
        ? renderBooleanVerdict(value, t)
        : String(value);
    case "enum":
      return typeof value === "string"
        ? renderOption(criterion, value, t)
        : String(value);
    case "multi_enum":
      return Array.isArray(value) ? (
        <span className="category-matrix-option-list">
          {value.map((optionId) => renderOption(criterion, optionId, t))}
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

function renderBooleanVerdict(value: boolean, t: TranslateFn): ReactNode {
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

function renderOption(
  criterion: MatrixCriterion,
  optionId: string,
  t: TranslateFn,
): ReactNode {
  const option = criterion.options.find((entry) => entry.id === optionId);
  const label = option?.label ?? optionId;
  const tone = getOptionTone(option);
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
