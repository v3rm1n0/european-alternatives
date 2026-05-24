import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Alternative,
  Category,
  CategoryId,
  CategoryMatrixApiResponse,
  CategoryMatrixLoadResult,
  CategoryMatrixState,
  MatrixAlternative,
  MatrixCriterion,
  MatrixFact,
  MatrixFilterMode,
  MatrixGroup,
} from "../src/types";

type MatrixCriterionFilterSelectionForTest = {
  value?: boolean | string | number;
  values?: string[];
  min?: number;
  max?: number;
  includeUnverified: boolean;
};

type MatrixFilterSelectionsForTest = Record<
  string,
  MatrixCriterionFilterSelectionForTest
>;

type MatrixCriterionFilterChangeForTest =
  | { kind: "set-value"; value: string }
  | { kind: "toggle-value"; value: string; checked: boolean }
  | { kind: "set-min"; value: string }
  | { kind: "set-max"; value: string }
  | { kind: "set-include-unverified"; checked: boolean };

type CategoryMatrixFilterPanelModule = {
  default: ComponentType<{
    state: CategoryMatrixState;
    selectedFilters?: MatrixFilterSelectionsForTest;
    onFilterChange?: (filters: MatrixFilterSelectionsForTest) => void;
  }>;
  getRenderableMatrixFilterGroups: (
    matrix: CategoryMatrixApiResponse,
  ) => MatrixGroup[];
  updateMatrixCriterionFilterSelection?: (
    selectedFilters: MatrixFilterSelectionsForTest,
    criterion: Pick<MatrixCriterion, "id" | "valueType">,
    change: MatrixCriterionFilterChangeForTest,
  ) => MatrixFilterSelectionsForTest;
};

type BrowseEffect = () => void | (() => void);

type LoadedCategoryMatrixFixture = {
  category: CategoryId;
  language: string;
  result: CategoryMatrixLoadResult;
};

const panelComponentPath = "src/components/CategoryMatrixFilterPanel.tsx";

const browseTestMocks = vi.hoisted(() => ({
  catalog: null as unknown,
  cleanups: [] as Array<() => void>,
  effects: [] as BrowseEffect[],
  fetchCategoryMatrix: vi.fn(),
  language: "en",
  loadedCategoryMatrix: undefined as unknown,
  matrixFilters: undefined as MatrixFilterSelectionsForTest | undefined,
  matrixFiltersConsumed: false,
  search: "",
  setSearchParams: vi.fn(),
  bodyClassList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  windowAddEventListener: vi.fn(),
  windowRemoveEventListener: vi.fn(),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useEffect: (effect: BrowseEffect) => {
      browseTestMocks.effects.push(effect);
    },
    useState: <State>(initialState: State | (() => State)) => {
      const stateInitial =
        browseTestMocks.loadedCategoryMatrix !== undefined &&
        initialState === null
          ? (browseTestMocks.loadedCategoryMatrix as State)
          : initialState;
      const resolvedInitial =
        typeof stateInitial === "function"
          ? (stateInitial as () => unknown)()
          : stateInitial;
      const isEmptyPlainObject =
        resolvedInitial !== null &&
        typeof resolvedInitial === "object" &&
        Object.getPrototypeOf(resolvedInitial) === Object.prototype &&
        Object.keys(resolvedInitial).length === 0;

      if (
        browseTestMocks.matrixFilters !== undefined &&
        !browseTestMocks.matrixFiltersConsumed &&
        isEmptyPlainObject
      ) {
        browseTestMocks.matrixFiltersConsumed = true;
        return [browseTestMocks.matrixFilters as State, vi.fn()] as [
          State,
          Dispatch<SetStateAction<State>>,
        ];
      }

      return actual.useState(stateInitial);
    },
  };
});

vi.mock("react-i18next", () => {
  const translations: Record<string, string> = {
    title: "Browse alternatives",
    subtitle: "Find European alternatives",
    "matrixFilters.title": "Category fit filters",
    "matrixFilters.subtitle": "{{category}} criteria",
    "matrixFilters.loading": "Loading category criteria...",
    "matrixFilters.error":
      "Category criteria could not be loaded. Browse results remain available.",
    "matrixFilters.empty":
      "No category-specific fit filters are available for this category.",
    "matrixFilters.any": "Any",
    "matrixFilters.yes": "Yes",
    "matrixFilters.no": "No",
    "matrixFilters.minimum": "Minimum",
    "matrixFilters.maximum": "Maximum",
    "matrixFilters.minimumFor": "Minimum for {{criterion}}",
    "matrixFilters.maximumFor": "Maximum for {{criterion}}",
    "matrixFilters.valuePlaceholder": "Value",
    "matrixFilters.unverified": "Unverified",
    "matrixFilters.includeUnverified": "Include Unverified",
    "matrixFilters.unverifiedIncludedByDefault":
      "Unverified results stay visible by default.",
    "matrixFilters.modes.optional": "Optional",
    "matrixFilters.modes.must_match": "Must match",
    "matrixFilters.modes.range": "Range",
    "matrixFilters.modes.multi_select": "Multi-select",
  };

  return {
    useTranslation: () => ({
      i18n: { language: browseTestMocks.language },
      t: (key: string, values?: Record<string, string>) => {
        const template = translations[key] ?? key;

        return template.replace(
          /\{\{(\w+)\}\}/gu,
          (_match, name: string) => values?.[name] ?? "",
        );
      },
    }),
  };
});

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [
    new URLSearchParams(browseTestMocks.search),
    browseTestMocks.setSearchParams,
  ],
}));

vi.mock("../src/contexts/CatalogContext", () => ({
  useCatalog: () => browseTestMocks.catalog,
}));

vi.mock("../src/data/categoryMatrix", () => ({
  fetchCategoryMatrix: browseTestMocks.fetchCategoryMatrix,
}));

vi.mock("../src/components/Filters", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: () =>
      React.createElement(
        "div",
        { className: "distro-filters", "data-browse-test": "global-filters" },
        "Global Filters",
      ),
  };
});

vi.mock("../src/components/AlternativeCard", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: ({ alternative }: { alternative: Alternative }) =>
      React.createElement(
        "article",
        { className: "alternative-card", "data-browse-test": "result-card" },
        alternative.name,
      ),
  };
});

vi.mock("framer-motion", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  const motionProps = new Set([
    "animate",
    "exit",
    "initial",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
  ]);
  const createMotionComponent =
    (tag: string) =>
    ({
      children,
      ...props
    }: Record<string, unknown> & { children?: ReactNode }) => {
      const domProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !motionProps.has(key)),
      );

      return React.createElement(tag, domProps, children);
    };

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get: (_target, tag) => createMotionComponent(String(tag)),
      },
    ),
  };
});

beforeEach(() => {
  browseTestMocks.catalog = createBrowseCatalog();
  browseTestMocks.cleanups = [];
  browseTestMocks.effects = [];
  browseTestMocks.language = "en";
  browseTestMocks.loadedCategoryMatrix = undefined;
  browseTestMocks.matrixFilters = undefined;
  browseTestMocks.matrixFiltersConsumed = false;
  browseTestMocks.search = "";
  browseTestMocks.fetchCategoryMatrix.mockReturnValue(new Promise(() => {}));
  vi.stubGlobal("document", {
    body: { classList: browseTestMocks.bodyClassList },
  });
  vi.stubGlobal("window", {
    addEventListener: browseTestMocks.windowAddEventListener,
    removeEventListener: browseTestMocks.windowRemoveEventListener,
  });
});

afterEach(() => {
  for (const cleanup of browseTestMocks.cleanups.toReversed()) {
    cleanup();
  }
  browseTestMocks.cleanups = [];
  browseTestMocks.effects = [];
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function readProjectFile(relativePath: string): string {
  const absolutePath = resolve(relativePath);
  expect(
    existsSync(absolutePath),
    `${relativePath} should exist for issue #412`,
  ).toBe(true);

  return readFileSync(absolutePath, "utf8");
}

async function loadPanelModule(): Promise<CategoryMatrixFilterPanelModule> {
  readProjectFile(panelComponentPath);

  const panelModule =
    (await import("../src/components/CategoryMatrixFilterPanel")) as Partial<CategoryMatrixFilterPanelModule>;

  expect(
    typeof panelModule.getRenderableMatrixFilterGroups,
    "CategoryMatrixFilterPanel should export getRenderableMatrixFilterGroups() so the renderable filtering contract is unit-testable",
  ).toBe("function");
  expect(
    typeof panelModule.default,
    "CategoryMatrixFilterPanel should export the panel component",
  ).toBe("function");

  return panelModule as CategoryMatrixFilterPanelModule;
}

async function renderPanel(
  state: CategoryMatrixState,
  props: {
    selectedFilters?: MatrixFilterSelectionsForTest;
    onFilterChange?: (filters: MatrixFilterSelectionsForTest) => void;
  } = {},
): Promise<string> {
  const { default: CategoryMatrixFilterPanel } = await loadPanelModule();

  return renderToStaticMarkup(
    createElement(CategoryMatrixFilterPanel, {
      state,
      selectedFilters: {},
      onFilterChange: vi.fn(),
      ...props,
    }),
  );
}

async function renderBrowsePage(
  options: {
    language?: string;
    loadedCategoryMatrix?: LoadedCategoryMatrixFixture;
    matrixFilters?: MatrixFilterSelectionsForTest;
    search?: string;
  } = {},
): Promise<string> {
  browseTestMocks.effects = [];
  browseTestMocks.language = options.language ?? "en";
  browseTestMocks.loadedCategoryMatrix =
    options.loadedCategoryMatrix ?? undefined;
  browseTestMocks.matrixFilters = options.matrixFilters;
  browseTestMocks.matrixFiltersConsumed = false;
  browseTestMocks.search = options.search ?? "";

  const browseModule = (await import("../src/components/BrowsePage")) as {
    default: ComponentType;
  };

  return renderToStaticMarkup(createElement(browseModule.default));
}

function runBrowseEffects(): void {
  const effects = browseTestMocks.effects.splice(0);

  for (const effect of effects) {
    const cleanup = effect();
    if (typeof cleanup === "function") {
      browseTestMocks.cleanups.push(cleanup);
    }
  }
}

function criterion(
  id: string,
  filterMode: MatrixFilterMode,
  overrides: Partial<MatrixCriterion> = {},
): MatrixCriterion {
  return {
    id,
    label: overrides.label ?? id.replaceAll("_", " "),
    helpText: overrides.helpText ?? null,
    valueType: overrides.valueType ?? "boolean",
    semantics: overrides.semantics ?? "informational",
    filterMode,
    options: overrides.options ?? [],
  };
}

function matrix(
  groups: MatrixGroup[],
  alternatives: MatrixAlternative[] = [matrixAlternative("primary-chat", {})],
): CategoryMatrixApiResponse {
  const criterionCount = groups.reduce(
    (count, group) => count + group.criteria.length,
    0,
  );

  return {
    data: {
      category: {
        id: "messaging",
        name: "Messaging",
        description: "Secure messaging and chat apps",
        emoji: "chat",
      },
      groups,
      alternatives,
    },
    meta: {
      category: "messaging",
      locale: "en",
      groupCount: groups.length,
      criterionCount,
      alternativeCount: alternatives.length,
    },
  };
}

function matrixAlternative(
  id: string,
  facts: Record<string, MatrixFact>,
): MatrixAlternative {
  return {
    id,
    name: id
      .split("-")
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" "),
    website: `https://${id}.example`,
    logo: null,
    country: "de",
    category: "messaging",
    secondaryCategories: [],
    facts,
  };
}

function readyMatrixResult(): CategoryMatrixLoadResult {
  return {
    status: "ready",
    matrix: matrix([
      {
        id: "privacy",
        label: "Privacy",
        description: "Privacy fit",
        criteria: [
          criterion("e2ee", "must_match", {
            label: "End-to-end encryption",
          }),
        ],
      },
    ]),
    error: null,
  };
}

function matrixFilteringResult(): CategoryMatrixLoadResult {
  return {
    status: "ready",
    matrix: matrix(
      [
        {
          id: "privacy",
          label: "Privacy",
          description: "Privacy fit",
          criteria: [
            criterion("e2ee", "must_match", {
              label: "End-to-end encryption",
              valueType: "boolean",
            }),
          ],
        },
      ],
      [
        matrixAlternative("primary-chat", {
          e2ee: { status: "verified", value: true },
        }),
        matrixAlternative("legacy-chat", {
          e2ee: { status: "verified", value: false },
        }),
        matrixAlternative("unknown-chat", {
          e2ee: { status: "unverified", value: null },
        }),
      ],
    ),
    error: null,
  };
}

function errorMatrixResult(): CategoryMatrixLoadResult {
  return {
    status: "error",
    matrix: null,
    error: {
      code: "network_error",
      message: "Network failed",
    },
  };
}

function unavailableMatrixResult(): CategoryMatrixLoadResult {
  return {
    status: "unavailable",
    matrix: null,
    error: {
      code: "not_found",
      message: "Matrix unavailable",
    },
  };
}

function emptyMatrixResult(): CategoryMatrixLoadResult {
  return {
    status: "empty",
    matrix: matrix([]),
    error: null,
  };
}

function loadedMatrix(
  category: CategoryId,
  result: CategoryMatrixLoadResult,
  language = "en",
): LoadedCategoryMatrixFixture {
  return { category, language, result };
}

function createBrowseCatalog() {
  const categories: Category[] = [
    {
      id: "messaging",
      name: "Messaging",
      description: "Secure messaging",
      usGiants: [],
      emoji: "chat",
    },
    {
      id: "email",
      name: "Email",
      description: "Email providers",
      usGiants: [],
      emoji: "mail",
    },
    {
      id: "other",
      name: "Other",
      description: "Other tools",
      usGiants: [],
      emoji: "other",
    },
  ];
  const alternatives: Alternative[] = [
    browseAlternative("primary-chat", "Primary Chat", "messaging"),
    browseAlternative("legacy-chat", "Legacy Chat", "messaging"),
    browseAlternative("unknown-chat", "Unknown Chat", "messaging"),
    browseAlternative(
      "matrix-missing-chat",
      "Matrix Missing Chat",
      "messaging",
    ),
    browseAlternative("inbox-eu", "Inbox EU", "email"),
    browseAlternative("other-option", "Other Option", "other"),
  ];

  return {
    alternatives,
    categories,
    deniedAlternatives: [],
    error: null,
    furtherReadingResources: [],
    landingCategoryGroups: [],
    loading: false,
    usVendors: [],
  };
}

function browseAlternative(
  id: string,
  name: string,
  category: CategoryId,
): Alternative {
  return {
    id,
    name,
    description: `${name} description`,
    website: `https://${id}.example`,
    country: "de",
    category,
    secondaryCategories: [],
    replacesUS: [],
    isOpenSource: true,
    pricing: "free",
    tags: [category],
    trustScoreStatus: "ready",
    trustScore: 90,
  };
}

function expectStateBranch(source: string, state: string): void {
  const statePattern = new RegExp(
    `(status\\s*={2,3}\\s*['"]${state}['"]|case\\s+['"]${state}['"])`,
    "u",
  );

  expect(
    statePattern.test(source),
    `CategoryMatrixFilterPanel should render a ${state} state`,
  ).toBe(true);
}

function expectNoMatrixPanel(html: string): void {
  expect(html).not.toContain("category-matrix-filter-panel");
  expect(html).not.toContain("Category fit filters");
}

function expectNormalResults(html: string, expectedName: string): void {
  expect(html).toContain('data-browse-test="result-card"');
  expect(html).toContain(expectedName);
}

function activeE2eeMatrixFilters(): MatrixFilterSelectionsForTest {
  return {
    e2ee: { value: true, includeUnverified: true },
  };
}

function expectPanelBetweenFiltersAndResults(html: string): void {
  const filtersIndex = html.indexOf('data-browse-test="global-filters"');
  const panelIndex = html.indexOf("category-matrix-filter-panel");
  const resultsIndex = html.indexOf('data-browse-test="result-card"');

  expect(filtersIndex).toBeGreaterThanOrEqual(0);
  expect(panelIndex).toBeGreaterThan(filtersIndex);
  expect(resultsIndex).toBeGreaterThan(panelIndex);
}

async function loadMatrixSelectionReducer(): Promise<
  NonNullable<
    CategoryMatrixFilterPanelModule["updateMatrixCriterionFilterSelection"]
  >
> {
  const panelModule = await loadPanelModule();

  expect(
    typeof panelModule.updateMatrixCriterionFilterSelection,
    "CategoryMatrixFilterPanel should export updateMatrixCriterionFilterSelection() so input-to-filter payload behavior is testable without a DOM test renderer",
  ).toBe("function");

  return panelModule.updateMatrixCriterionFilterSelection!;
}

describe("category matrix filter panel renderable groups", () => {
  it("preserves API group and criterion order while removing non-renderable criteria and empty groups", async () => {
    const { getRenderableMatrixFilterGroups } = await loadPanelModule();

    const renderableGroups = getRenderableMatrixFilterGroups(
      matrix([
        {
          id: "privacy",
          label: "Privacy",
          description: "Privacy fit",
          criteria: [
            criterion("internal_notes", "none"),
            criterion("e2ee", "must_match"),
            criterion("hosting_region", "optional"),
          ],
        },
        {
          id: "empty-after-filtering",
          label: "Internal only",
          description: null,
          criteria: [criterion("research_notes", "none")],
        },
        {
          id: "portability",
          label: "Portability",
          description: null,
          criteria: [
            criterion("export_formats", "multi_select", {
              valueType: "multi_enum",
              options: [
                { id: "csv", label: "CSV", displayTone: "positive" },
                { id: "json", label: "JSON", displayTone: "neutral" },
              ],
            }),
            criterion("api_documentation", "none"),
          ],
        },
      ]),
    );

    expect(renderableGroups.map((group) => group.id)).toEqual([
      "privacy",
      "portability",
    ]);
    expect(renderableGroups[0]?.criteria.map((item) => item.id)).toEqual([
      "e2ee",
      "hosting_region",
    ]);
    expect(renderableGroups[1]?.criteria.map((item) => item.id)).toEqual([
      "export_formats",
    ]);
    expect(
      renderableGroups.flatMap((group) =>
        group.criteria.map((item) => item.filterMode),
      ),
    ).not.toContain("none");
  });

  it("returns no renderable groups when the matrix has no filterable criteria", async () => {
    const { getRenderableMatrixFilterGroups } = await loadPanelModule();

    expect(getRenderableMatrixFilterGroups(matrix([]))).toEqual([]);
    expect(
      getRenderableMatrixFilterGroups(
        matrix([
          {
            id: "internal",
            label: "Internal",
            description: null,
            criteria: [criterion("research_status", "none")],
          },
        ]),
      ),
    ).toEqual([]);
  });
});

describe("category matrix filter panel selection reducer", () => {
  it("builds active callback payloads for boolean and enum selections", async () => {
    const updateSelection = await loadMatrixSelectionReducer();

    expect(
      updateSelection(
        {},
        criterion("e2ee", "must_match", { valueType: "boolean" }),
        { kind: "set-value", value: "true" },
      ),
    ).toEqual({
      e2ee: { value: true, includeUnverified: true },
    });
    expect(
      updateSelection(
        {},
        criterion("e2ee", "must_match", { valueType: "boolean" }),
        { kind: "set-value", value: "false" },
      ),
    ).toEqual({
      e2ee: { value: false, includeUnverified: true },
    });
    expect(
      updateSelection(
        {},
        criterion("hosting_region", "optional", {
          valueType: "enum",
          options: [
            { id: "eu", label: "EU", displayTone: "positive" },
            { id: "efta", label: "EFTA", displayTone: "neutral" },
          ],
        }),
        { kind: "set-value", value: "eu" },
      ),
    ).toEqual({
      hosting_region: { value: "eu", includeUnverified: true },
    });
  });

  it("adds and removes multi-select values while preserving OR-within-criterion payloads", async () => {
    const updateSelection = await loadMatrixSelectionReducer();
    const formatsCriterion = criterion("export_formats", "multi_select", {
      valueType: "multi_enum",
      options: [
        { id: "csv", label: "CSV", displayTone: "positive" },
        { id: "json", label: "JSON", displayTone: "neutral" },
      ],
    });

    const withCsv = updateSelection({}, formatsCriterion, {
      kind: "toggle-value",
      value: "csv",
      checked: true,
    });
    const withCsvAndJson = updateSelection(withCsv, formatsCriterion, {
      kind: "toggle-value",
      value: "json",
      checked: true,
    });
    const withJsonOnly = updateSelection(withCsvAndJson, formatsCriterion, {
      kind: "toggle-value",
      value: "csv",
      checked: false,
    });

    expect(withCsv).toEqual({
      export_formats: { values: ["csv"], includeUnverified: true },
    });
    expect(withCsvAndJson).toEqual({
      export_formats: { values: ["csv", "json"], includeUnverified: true },
    });
    expect(withJsonOnly).toEqual({
      export_formats: { values: ["json"], includeUnverified: true },
    });
    expect(
      updateSelection(withJsonOnly, formatsCriterion, {
        kind: "toggle-value",
        value: "json",
        checked: false,
      }),
    ).toEqual({});
  });

  it("parses and clears numeric min and max range inputs", async () => {
    const updateSelection = await loadMatrixSelectionReducer();
    const storageCriterion = criterion("storage_included", "range", {
      valueType: "number",
    });

    const withMin = updateSelection({}, storageCriterion, {
      kind: "set-min",
      value: "5",
    });
    const withRange = updateSelection(withMin, storageCriterion, {
      kind: "set-max",
      value: "20",
    });
    const withMaxOnly = updateSelection(withRange, storageCriterion, {
      kind: "set-min",
      value: "",
    });

    expect(withMin).toEqual({
      storage_included: { min: 5, includeUnverified: true },
    });
    expect(withRange).toEqual({
      storage_included: { min: 5, max: 20, includeUnverified: true },
    });
    expect(withMaxOnly).toEqual({
      storage_included: { max: 20, includeUnverified: true },
    });
    expect(
      updateSelection(withMaxOnly, storageCriterion, {
        kind: "set-max",
        value: "",
      }),
    ).toEqual({});
  });

  it("sets and clears text and URL values", async () => {
    const updateSelection = await loadMatrixSelectionReducer();
    const urlCriterion = criterion("retention_policy", "optional", {
      valueType: "url",
    });

    const withUrl = updateSelection({}, urlCriterion, {
      kind: "set-value",
      value: "https://retention.example/policy",
    });

    expect(withUrl).toEqual({
      retention_policy: {
        value: "https://retention.example/policy",
        includeUnverified: true,
      },
    });
    expect(
      updateSelection(withUrl, urlCriterion, {
        kind: "set-value",
        value: "",
      }),
    ).toEqual({});
  });

  it("toggles include-unverified only while a concrete filter remains active", async () => {
    const updateSelection = await loadMatrixSelectionReducer();
    const e2eeCriterion = criterion("e2ee", "must_match", {
      valueType: "boolean",
    });

    expect(
      updateSelection(activeE2eeMatrixFilters(), e2eeCriterion, {
        kind: "set-include-unverified",
        checked: false,
      }),
    ).toEqual({
      e2ee: { value: true, includeUnverified: false },
    });
    expect(
      updateSelection({}, e2eeCriterion, {
        kind: "set-include-unverified",
        checked: false,
      }),
    ).toEqual({});
  });

  it("removes a criterion from the callback payload when the concrete value is cleared", async () => {
    const updateSelection = await loadMatrixSelectionReducer();
    const currentFilters: MatrixFilterSelectionsForTest = {
      e2ee: { value: true, includeUnverified: false },
      hosting_region: { value: "eu", includeUnverified: true },
    };

    expect(
      updateSelection(
        currentFilters,
        criterion("e2ee", "must_match", { valueType: "boolean" }),
        { kind: "set-value", value: "" },
      ),
    ).toEqual({
      hosting_region: { value: "eu", includeUnverified: true },
    });
  });
});

describe("category matrix filter panel browse integration", () => {
  it("does not fetch or render the matrix panel when no category is selected", async () => {
    const html = await renderBrowsePage();

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Primary Chat");
  });

  it("ignores stale active matrix filters when no category is selected", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", matrixFilteringResult()),
      matrixFilters: activeE2eeMatrixFilters(),
    });

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Primary Chat");
    expectNormalResults(html, "Legacy Chat");
    expectNormalResults(html, "Inbox EU");
    expectNormalResults(html, "Other Option");
  });

  it("does not fetch or render the matrix panel when multiple categories are selected", async () => {
    const html = await renderBrowsePage({
      search: "category=messaging&category=email",
    });

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Primary Chat");
    expectNormalResults(html, "Inbox EU");
  });

  it("ignores stale active matrix filters when multiple categories are selected", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", matrixFilteringResult()),
      matrixFilters: activeE2eeMatrixFilters(),
      search: "category=messaging&category=email",
    });

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Primary Chat");
    expectNormalResults(html, "Legacy Chat");
    expectNormalResults(html, "Inbox EU");
    expect(html).not.toContain("Other Option");
  });

  it("does not fetch or render the matrix panel for the other category", async () => {
    const html = await renderBrowsePage({ search: "category=other" });

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Other Option");
  });

  it("ignores stale active matrix filters for the other category", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", matrixFilteringResult()),
      matrixFilters: activeE2eeMatrixFilters(),
      search: "category=other",
    });

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Other Option");
    expect(html).not.toContain("Primary Chat");
    expect(html).not.toContain("Legacy Chat");
  });

  it("fetches a single matrix-enabled category with the active language while keeping results visible", async () => {
    const html = await renderBrowsePage({
      language: "de",
      search: "category=messaging",
    });

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).toHaveBeenCalledTimes(1);
    expect(browseTestMocks.fetchCategoryMatrix).toHaveBeenCalledWith(
      "messaging",
      "de",
    );
    expect(html).toContain("Loading category criteria...");
    expectPanelBetweenFiltersAndResults(html);
    expectNormalResults(html, "Primary Chat");
  });

  it("renders a ready matrix below global filters without replacing normal browse results", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", readyMatrixResult()),
      search: "category=messaging",
    });

    expect(html).toContain("Category fit filters");
    expect(html).toContain("Privacy");
    expect(html).toContain("End-to-end encryption");
    expectPanelBetweenFiltersAndResults(html);
    expectNormalResults(html, "Primary Chat");
  });

  it("applies active matrix filters to one selected category while keeping unverified and missing facts visible by default", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", matrixFilteringResult()),
      matrixFilters: activeE2eeMatrixFilters(),
      search: "category=messaging",
    });

    expect(html).toContain("Category fit filters");
    expectNormalResults(html, "Primary Chat");
    expectNormalResults(html, "Unknown Chat");
    expectNormalResults(html, "Matrix Missing Chat");
    expect(html).not.toContain("Legacy Chat");
    expect(html).not.toContain("Inbox EU");
  });

  it("excludes unverified and matrix-missing rows when the matrix filter asks for verified matches only", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", matrixFilteringResult()),
      matrixFilters: {
        e2ee: { value: true, includeUnverified: false },
      },
      search: "category=messaging",
    });

    expect(html).toContain("Category fit filters");
    expectNormalResults(html, "Primary Chat");
    expect(html).not.toContain("Unknown Chat");
    expect(html).not.toContain("Matrix Missing Chat");
    expect(html).not.toContain("Legacy Chat");
    expect(html).not.toContain("Inbox EU");
  });

  it("composes active matrix filters with existing search filtering", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", matrixFilteringResult()),
      matrixFilters: activeE2eeMatrixFilters(),
      search: "category=messaging&q=Unknown",
    });

    expect(html).toContain("Category fit filters");
    expectNormalResults(html, "Unknown Chat");
    expect(html).not.toContain("Primary Chat");
    expect(html).not.toContain("Legacy Chat");
    expect(html).not.toContain("Matrix Missing Chat");
    expect(html).not.toContain("Inbox EU");
  });

  it("keeps normal browse results visible for failed and unavailable matrix loads", async () => {
    const errorHtml = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", errorMatrixResult()),
      search: "category=messaging",
    });
    const unavailableHtml = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix(
        "messaging",
        unavailableMatrixResult(),
      ),
      search: "category=messaging",
    });

    expect(errorHtml).toContain(
      "Category criteria could not be loaded. Browse results remain available.",
    );
    expectPanelBetweenFiltersAndResults(errorHtml);
    expectNormalResults(errorHtml, "Primary Chat");
    expectNoMatrixPanel(unavailableHtml);
    expectNormalResults(unavailableHtml, "Primary Chat");
  });

  it("renders an empty matrix state below global filters without replacing browse results", async () => {
    const html = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("messaging", emptyMatrixResult()),
      search: "category=messaging",
    });

    expect(html).toContain(
      "No category-specific fit filters are available for this category.",
    );
    expectPanelBetweenFiltersAndResults(html);
    expectNormalResults(html, "Primary Chat");
  });

  it("does not render stale loaded matrix data for a different category or language", async () => {
    const staleCategoryHtml = await renderBrowsePage({
      loadedCategoryMatrix: loadedMatrix("email", readyMatrixResult()),
      search: "category=messaging",
    });

    runBrowseEffects();

    expect(staleCategoryHtml).toContain("Loading category criteria...");
    expect(staleCategoryHtml).not.toContain("Privacy");
    expect(browseTestMocks.fetchCategoryMatrix).toHaveBeenCalledWith(
      "messaging",
      "en",
    );

    vi.clearAllMocks();

    const staleLanguageHtml = await renderBrowsePage({
      language: "en",
      loadedCategoryMatrix: loadedMatrix(
        "messaging",
        readyMatrixResult(),
        "de",
      ),
      search: "category=messaging",
    });

    runBrowseEffects();

    expect(staleLanguageHtml).toContain("Loading category criteria...");
    expect(staleLanguageHtml).not.toContain("Privacy");
    expect(browseTestMocks.fetchCategoryMatrix).toHaveBeenCalledWith(
      "messaging",
      "en",
    );
  });

  it("keeps category matrix selections separate from global filter state", () => {
    const browseSource = readProjectFile("src/components/BrowsePage.tsx");
    const filtersSource = readProjectFile("src/components/Filters.tsx");
    const typesSource = readProjectFile("src/types/index.ts");

    expect(browseSource).toContain("CategoryMatrixFilterPanel");
    expect(filtersSource).not.toMatch(
      /CategoryMatrix|fetchCategoryMatrix|matrixFilter/i,
    );
    expect(typesSource).toMatch(
      /export interface SelectedFilters\s*\{\s*category: CategoryId\[\];\s*country: CountryCode\[\];\s*pricing: string\[\];\s*openSourceOnly: boolean;\s*\}/u,
    );
  });
});

describe("category matrix filter panel states and copy", () => {
  it("renders no panel markup for idle and unavailable states", async () => {
    expect(
      await renderPanel({ status: "idle", matrix: null, error: null }),
    ).toBe("");
    expect(
      await renderPanel({
        status: "unavailable",
        matrix: null,
        error: { code: "not_found", message: "Matrix unavailable" },
      }),
    ).toBe("");
  });

  it("renders loading, error, and empty state copy with non-blocking roles", async () => {
    const loadingHtml = await renderPanel({
      status: "loading",
      matrix: null,
      error: null,
    });
    const errorHtml = await renderPanel({
      status: "error",
      matrix: null,
      error: { code: "network_error", message: "Network failed" },
    });
    const emptyHtml = await renderPanel({
      status: "ready",
      matrix: matrix([
        {
          id: "internal",
          label: "Internal",
          description: null,
          criteria: [criterion("research_status", "none")],
        },
      ]),
      error: null,
    });

    expect(loadingHtml).toContain("Category fit filters");
    expect(loadingHtml).toContain('role="status"');
    expect(loadingHtml).toContain("Loading category criteria...");
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain(
      "Category criteria could not be loaded. Browse results remain available.",
    );
    expect(emptyHtml).toContain('role="status"');
    expect(emptyHtml).toContain(
      "No category-specific fit filters are available for this category.",
    );
    expect(emptyHtml).not.toContain("research status");
  });

  it("explains that unverified results remain visible by default when fit filters are available", async () => {
    const readyHtml = await renderPanel({
      status: "ready",
      matrix: matrix([
        {
          id: "privacy",
          label: "Privacy",
          description: "Privacy fit",
          criteria: [
            criterion("e2ee", "must_match", {
              label: "End-to-end encryption",
              valueType: "boolean",
            }),
          ],
        },
      ]),
      error: null,
    });

    expect(readyHtml).toContain("Unverified results stay visible by default.");
    expect(readyHtml).toContain("Include Unverified");
  });

  it("renders ready grouped controls while omitting non-renderable criteria", async () => {
    const readyHtml = await renderPanel({
      status: "ready",
      matrix: matrix([
        {
          id: "privacy",
          label: "Privacy",
          description: "Privacy fit",
          criteria: [
            criterion("internal_notes", "none", {
              label: "Internal notes",
            }),
            criterion("e2ee", "must_match", {
              label: "End-to-end encryption",
              valueType: "boolean",
            }),
            criterion("hosting_region", "optional", {
              label: "Hosting region",
              valueType: "enum",
              options: [
                { id: "eu", label: "EU", displayTone: "positive" },
                { id: "efta", label: "EFTA", displayTone: "neutral" },
              ],
            }),
          ],
        },
        {
          id: "portability",
          label: "Portability",
          description: null,
          criteria: [
            criterion("export_formats", "multi_select", {
              label: "Export formats",
              valueType: "multi_enum",
              options: [
                { id: "csv", label: "CSV", displayTone: "positive" },
                { id: "json", label: "JSON", displayTone: "neutral" },
              ],
            }),
            criterion("storage_included", "range", {
              label: "Storage included",
              valueType: "number",
            }),
            criterion("retention_policy", "optional", {
              label: "Retention policy URL",
              valueType: "url",
            }),
          ],
        },
      ]),
      error: null,
    });

    expect(readyHtml).toContain("Category fit filters");
    expect(readyHtml).toContain("Messaging criteria");
    expect(readyHtml).toContain("Privacy");
    expect(readyHtml).toContain("Portability");
    expect(readyHtml).toContain("End-to-end encryption");
    expect(readyHtml).toContain("Hosting region");
    expect(readyHtml).toContain("Export formats");
    expect(readyHtml).toContain("Storage included");
    expect(readyHtml).toContain("Retention policy URL");
    expect(readyHtml).not.toContain("Internal notes");
    expect(readyHtml).toContain("Must match");
    expect(readyHtml).toContain("Optional");
    expect(readyHtml).toContain("Multi-select");
    expect(readyHtml).toContain("Range");
    expect(readyHtml).toMatch(/<select[\s\S]*matrix-filter-e2ee/u);
    expect(readyHtml).toContain("Yes");
    expect(readyHtml).toContain("No");
    expect(readyHtml).toContain("EU");
    expect(readyHtml).toContain("CSV");
    expect(readyHtml).toContain('role="group"');
    expect(readyHtml).toContain('type="number"');
    expect(readyHtml).toContain('aria-label="Minimum for Storage included"');
    expect(readyHtml).toContain('type="url"');
    expect(readyHtml).toContain("Value");
    expect(readyHtml).toContain("Unverified");
  });

  it("renders selected matrix filters as controlled input values", async () => {
    const readyHtml = await renderPanel(
      {
        status: "ready",
        matrix: matrix([
          {
            id: "privacy",
            label: "Privacy",
            description: "Privacy fit",
            criteria: [
              criterion("e2ee", "must_match", {
                label: "End-to-end encryption",
                valueType: "boolean",
              }),
              criterion("hosting_region", "optional", {
                label: "Hosting region",
                valueType: "enum",
                options: [
                  { id: "eu", label: "EU", displayTone: "positive" },
                  { id: "efta", label: "EFTA", displayTone: "neutral" },
                ],
              }),
              criterion("export_formats", "multi_select", {
                label: "Export formats",
                valueType: "multi_enum",
                options: [
                  { id: "csv", label: "CSV", displayTone: "positive" },
                  { id: "json", label: "JSON", displayTone: "neutral" },
                ],
              }),
              criterion("storage_included", "range", {
                label: "Storage included",
                valueType: "number",
              }),
              criterion("retention_policy", "optional", {
                label: "Retention policy URL",
                valueType: "url",
              }),
            ],
          },
        ]),
        error: null,
      },
      {
        selectedFilters: {
          e2ee: { value: false, includeUnverified: false },
          hosting_region: { value: "efta", includeUnverified: true },
          export_formats: { values: ["json"], includeUnverified: true },
          storage_included: { min: 5, max: 20, includeUnverified: true },
          retention_policy: {
            value: "https://retention.example/policy",
            includeUnverified: true,
          },
        },
      },
    );

    expect(readyHtml).toMatch(
      /<option value="false" selected="">No<\/option>/u,
    );
    expect(readyHtml).toMatch(
      /<option value="efta" selected="">EFTA<\/option>/u,
    );
    expect(readyHtml).not.toMatch(
      /type="checkbox" checked=""\/><span>CSV<\/span>/u,
    );
    expect(readyHtml).toMatch(
      /type="checkbox" checked=""\/><span>JSON<\/span>/u,
    );
    expect(readyHtml).toMatch(
      /aria-label="Minimum for Storage included"[^>]*value="5"/u,
    );
    expect(readyHtml).toMatch(
      /aria-label="Maximum for Storage included"[^>]*value="20"/u,
    );
    expect(readyHtml).toContain('value="https://retention.example/policy"');
  });

  it("renders loading, error, and empty states as non-blocking panel states", () => {
    const panelSource = readProjectFile(panelComponentPath);

    expectStateBranch(panelSource, "idle");
    expectStateBranch(panelSource, "loading");
    expectStateBranch(panelSource, "error");
    expectStateBranch(panelSource, "empty");
    expect(panelSource).toMatch(/\brole=["']status["']/u);
    expect(panelSource).toMatch(/\brole=["']alert["']/u);
  });

  it("defines exact Unverified copy for category matrix unknown states in both browse locales", () => {
    const englishBrowse = JSON.parse(
      readProjectFile("src/i18n/locales/en/browse.json"),
    ) as { matrixFilters?: Record<string, unknown> };
    const germanBrowse = JSON.parse(
      readProjectFile("src/i18n/locales/de/browse.json"),
    ) as { matrixFilters?: Record<string, unknown> };

    expect(JSON.stringify(englishBrowse)).toContain("Unverified");
    expect(JSON.stringify(germanBrowse)).toContain("Unverified");
    expect(englishBrowse.matrixFilters).toMatchObject({
      includeUnverified: "Include Unverified",
      unverifiedIncludedByDefault:
        "Unverified results stay visible by default.",
    });
    expect(germanBrowse.matrixFilters).toHaveProperty("includeUnverified");
    expect(germanBrowse.matrixFilters).toHaveProperty(
      "unverifiedIncludedByDefault",
    );
  });
});
