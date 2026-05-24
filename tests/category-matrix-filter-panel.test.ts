import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import type { ComponentType, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Alternative,
  Category,
  CategoryId,
  CategoryMatrixApiResponse,
  CategoryMatrixLoadResult,
  CategoryMatrixState,
  MatrixCriterion,
  MatrixFilterMode,
  MatrixGroup,
} from "../src/types";

type CategoryMatrixFilterPanelModule = {
  default: ComponentType<{ state: CategoryMatrixState }>;
  getRenderableMatrixFilterGroups: (
    matrix: CategoryMatrixApiResponse,
  ) => MatrixGroup[];
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

async function renderPanel(state: CategoryMatrixState): Promise<string> {
  const { default: CategoryMatrixFilterPanel } = await loadPanelModule();

  return renderToStaticMarkup(
    createElement(CategoryMatrixFilterPanel, { state }),
  );
}

async function renderBrowsePage(
  options: {
    language?: string;
    loadedCategoryMatrix?: LoadedCategoryMatrixFixture;
    search?: string;
  } = {},
): Promise<string> {
  browseTestMocks.effects = [];
  browseTestMocks.language = options.language ?? "en";
  browseTestMocks.loadedCategoryMatrix =
    options.loadedCategoryMatrix ?? undefined;
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

function matrix(groups: MatrixGroup[]): CategoryMatrixApiResponse {
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
      alternatives: [
        {
          id: "primary-chat",
          name: "Primary Chat",
          website: "https://primary-chat.example",
          logo: null,
          country: "de",
          category: "messaging",
          secondaryCategories: [],
          facts: {},
        },
      ],
    },
    meta: {
      category: "messaging",
      locale: "en",
      groupCount: groups.length,
      criterionCount,
      alternativeCount: 1,
    },
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

function expectPanelBetweenFiltersAndResults(html: string): void {
  const filtersIndex = html.indexOf('data-browse-test="global-filters"');
  const panelIndex = html.indexOf("category-matrix-filter-panel");
  const resultsIndex = html.indexOf('data-browse-test="result-card"');

  expect(filtersIndex).toBeGreaterThanOrEqual(0);
  expect(panelIndex).toBeGreaterThan(filtersIndex);
  expect(resultsIndex).toBeGreaterThan(panelIndex);
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

describe("category matrix filter panel browse integration", () => {
  it("does not fetch or render the matrix panel when no category is selected", async () => {
    const html = await renderBrowsePage();

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Primary Chat");
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

  it("does not fetch or render the matrix panel for the other category", async () => {
    const html = await renderBrowsePage({ search: "category=other" });

    runBrowseEffects();

    expect(browseTestMocks.fetchCategoryMatrix).not.toHaveBeenCalled();
    expectNoMatrixPanel(html);
    expectNormalResults(html, "Other Option");
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

  it("keeps category matrix state separate from global filters and result filtering", () => {
    const browseSource = readProjectFile("src/components/BrowsePage.tsx");
    const filtersSource = readProjectFile("src/components/Filters.tsx");
    const typesSource = readProjectFile("src/types/index.ts");

    const filteredAlternativesStart = browseSource.indexOf(
      "const filteredAlternatives",
    );
    const filteredAlternativesEnd = browseSource.indexOf(
      "const expandedAlternatives",
      filteredAlternativesStart,
    );
    const filteredAlternativesSource = browseSource.slice(
      filteredAlternativesStart,
      filteredAlternativesEnd,
    );

    expect(filteredAlternativesStart).toBeGreaterThanOrEqual(0);
    expect(filteredAlternativesEnd).toBeGreaterThan(filteredAlternativesStart);
    expect(filteredAlternativesSource).not.toMatch(/matrix/i);
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
    ) as unknown;
    const germanBrowse = JSON.parse(
      readProjectFile("src/i18n/locales/de/browse.json"),
    ) as unknown;

    expect(JSON.stringify(englishBrowse)).toContain("Unverified");
    expect(JSON.stringify(germanBrowse)).toContain("Unverified");
  });
});
