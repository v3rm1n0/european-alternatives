import { readFileSync } from "node:fs";
import { createElement } from "react";
import type { Dispatch, SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import browseDe from "../src/i18n/locales/de/browse.json";
import browseEn from "../src/i18n/locales/en/browse.json";
import type {
  CategoryMatrixApiResponse,
  MatrixAlternative,
  MatrixCriterion,
  MatrixFact,
  MatrixFilterMode,
} from "../src/types";

// ---------------------------------------------------------------------------
// Test-side state injection
// ---------------------------------------------------------------------------
//
// The toggles live as component-local state in `CategoryMatrixView`. An SSR
// test cannot dispatch real input events, so we have to intercept the seed
// values of the relevant `useState` calls.
//
// What the existing toolbar test does:
//   - first `useState("")`         → criteria query
//   - first `useState("comfortable")` → density
//
// What we add here:
//   - first  `useState(false)` → `showOnlyDifferences`
//   - second `useState(false)` → `hideUnverified`
//
// Both new toggles default to `false`. To distinguish them we use call-order
// indexing on the boolean seed (first vs second). All subsequent
// `useState(false)` calls (e.g. each `MatrixCell`'s popover-open state) fall
// through to the real React implementation so unrelated behaviour stays
// correct.

type ToggleHookSeeds = {
  query: string;
  density: "comfortable" | "compact";
  showOnlyDifferences: boolean;
  hideUnverified: boolean;
  queryInjected: boolean;
  densityInjected: boolean;
  booleanSeedIndex: number;
};

const toggleHookSeeds: ToggleHookSeeds = vi.hoisted(() => ({
  query: "",
  density: "comfortable",
  showOnlyDifferences: false,
  hideUnverified: false,
  queryInjected: false,
  densityInjected: false,
  booleanSeedIndex: 0,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useState: <S>(initial: S | (() => S)) => {
      if (initial === "" && !toggleHookSeeds.queryInjected) {
        toggleHookSeeds.queryInjected = true;
        return [
          toggleHookSeeds.query as unknown as S,
          vi.fn() as Dispatch<SetStateAction<S>>,
        ];
      }
      if (initial === "comfortable" && !toggleHookSeeds.densityInjected) {
        toggleHookSeeds.densityInjected = true;
        return [
          toggleHookSeeds.density as unknown as S,
          vi.fn() as Dispatch<SetStateAction<S>>,
        ];
      }
      if (initial === false) {
        const index = toggleHookSeeds.booleanSeedIndex;
        toggleHookSeeds.booleanSeedIndex = index + 1;
        if (index === 0) {
          return [
            toggleHookSeeds.showOnlyDifferences as unknown as S,
            vi.fn() as Dispatch<SetStateAction<S>>,
          ];
        }
        if (index === 1) {
          return [
            toggleHookSeeds.hideUnverified as unknown as S,
            vi.fn() as Dispatch<SetStateAction<S>>,
          ];
        }
      }
      return actual.useState(initial);
    },
  };
});

vi.mock("react-i18next", () => {
  const translations: Record<string, string> = {
    "matrixView.title": "{{category}} comparison matrix",
    "matrixView.productColumn": "Product",
    "matrixView.criteriaColumn": "Criterion",
    "matrixView.yes": "Yes",
    "matrixView.no": "No",
    "matrixView.unverified": "Unverified",
    "matrixView.notApplicable": "Not applicable",
    "matrixView.source": "Source",
    "matrixView.accessedDate": "Accessed {{date}}",
    "matrixView.legend.title": "Legend",
    "matrixView.legend.positive": "Positive / supported",
    "matrixView.legend.warning": "Caution",
    "matrixView.legend.negative": "Negative / not supported",
    "matrixView.legend.neutral": "Neutral / informational",
    "matrixView.legend.tradeoff": "Trade-off",
    "matrixView.legend.unverified": "Unverified",
    "matrixView.legend.notApplicable": "Not applicable",
    "matrixView.popover.openLabel":
      "Show details for {{product}} - {{criterion}}",
    "matrixView.popover.close": "Close",
    "matrixView.inspector.primaryLabel": "Primary product",
    "matrixView.inspector.compareLabel": "Compare with",
    "matrixView.inspector.noSecondary": "No comparison",
    "matrixView.toolbar.searchPlaceholder": "Search criteria...",
    "matrixView.toolbar.searchLabel": "Search criteria",
    "matrixView.toolbar.clearSearch": "Clear criteria search",
    "matrixView.toolbar.matchCount": "{{matched}} of {{total}} criteria",
    "matrixView.toolbar.densityLabel": "Density",
    "matrixView.toolbar.densityCompact": "Compact",
    "matrixView.toolbar.densityComfortable": "Comfortable",
    "matrixView.toolbar.emptyTitle": "No criteria match",
    "matrixView.toolbar.emptyBody":
      "No criteria match the current search. Clear the search to see all criteria.",
    "matrixView.toolbar.showDifferences": "Show only differences",
    "matrixView.toolbar.hideUnverified": "Hide unverified",
    "matrixView.toolbar.resetToggles": "Reset toggles",
    "matrixView.toolbar.emptyBodyWithToggles":
      "No criteria match the active filters. Reset the toggles or clear the search to see more criteria.",
  };

  return {
    useTranslation: () => ({
      i18n: { language: "en" },
      t: (key: string, values?: Record<string, string | number>) => {
        const template = translations[key] ?? key;
        return template.replace(/\{\{(\w+)\}\}/gu, (_match, name: string) =>
          String(values?.[name] ?? ""),
        );
      },
    }),
  };
});

beforeEach(() => {
  toggleHookSeeds.query = "";
  toggleHookSeeds.density = "comfortable";
  toggleHookSeeds.showOnlyDifferences = false;
  toggleHookSeeds.hideUnverified = false;
  toggleHookSeeds.queryInjected = false;
  toggleHookSeeds.densityInjected = false;
  toggleHookSeeds.booleanSeedIndex = 0;
});

// ---------------------------------------------------------------------------
// Fixture — designed to exercise each decision branch
// ---------------------------------------------------------------------------

function criterion(
  id: string,
  overrides: Partial<MatrixCriterion> = {},
): MatrixCriterion {
  return {
    id,
    label: overrides.label ?? id,
    helpText: overrides.helpText ?? null,
    valueType: overrides.valueType ?? "boolean",
    semantics: overrides.semantics ?? "informational",
    filterMode: (overrides.filterMode ?? "none") as MatrixFilterMode,
    options: overrides.options ?? [],
  };
}

function alt(
  id: string,
  name: string,
  facts: Record<string, MatrixFact>,
): MatrixAlternative {
  return {
    id,
    name,
    website: `https://${id}.example`,
    logo: null,
    country: "de",
    category: "messaging",
    secondaryCategories: [],
    facts,
  };
}

const VERIFIED_TRUE: MatrixFact = { status: "verified", value: true };
const VERIFIED_FALSE: MatrixFact = { status: "verified", value: false };
const UNVERIFIED: MatrixFact = { status: "unverified", value: null };
const NOT_APPLICABLE: MatrixFact = { status: "not_applicable", value: null };

/**
 * Fixture exercises every branch we want the toggles to cover:
 *   - "everyone-true"      — all alternatives verified-true → equal under
 *                            Show only differences.
 *   - "everyone-unverified" → all alternatives unverified → all-unverified
 *                            bucket for Hide unverified, equal bucket for
 *                            Show only differences.
 *   - "differs"            — mixed booleans across alternatives.
 *   - "verified-vs-unverified" → mixed verified + unverified.
 *   - "multi-enum-equal"   — multi_enum values, same set in different orders.
 *   - "missing-key-equals-unverified" — one alternative has no key, one has
 *                            explicit unverified; treated identically.
 */
function fixture(): CategoryMatrixApiResponse {
  const groups = [
    {
      id: "decisive",
      label: "Decisive",
      description: null,
      criteria: [
        criterion("everyone-true", {
          label: "Everyone supports it",
          valueType: "boolean",
        }),
        criterion("differs", {
          label: "Differs across products",
          valueType: "boolean",
        }),
        criterion("verified-vs-unverified", {
          label: "Mixed verified and unverified",
          valueType: "boolean",
        }),
        criterion("multi-enum-equal", {
          label: "Multi enum same set different order",
          valueType: "multi_enum",
          options: [
            { id: "a", label: "Option A" },
            { id: "b", label: "Option B" },
          ],
        }),
        criterion("missing-key-equals-unverified", {
          label: "Missing key vs unverified",
          valueType: "boolean",
        }),
      ],
    },
    {
      id: "noise",
      label: "Noise",
      description: null,
      criteria: [
        criterion("everyone-unverified", {
          label: "Nobody has data yet",
          valueType: "boolean",
        }),
      ],
    },
  ];

  const alternatives: MatrixAlternative[] = [
    alt("alpha-chat", "Alpha Chat", {
      "everyone-true": VERIFIED_TRUE,
      differs: VERIFIED_TRUE,
      "verified-vs-unverified": VERIFIED_TRUE,
      "multi-enum-equal": {
        status: "verified",
        value: ["a", "b"],
      },
      "missing-key-equals-unverified": UNVERIFIED,
      "everyone-unverified": UNVERIFIED,
    }),
    alt("beta-chat", "Beta Chat", {
      "everyone-true": VERIFIED_TRUE,
      differs: VERIFIED_FALSE,
      "verified-vs-unverified": UNVERIFIED,
      "multi-enum-equal": {
        status: "verified",
        value: ["b", "a"],
      },
      // missing-key-equals-unverified: KEY ABSENT (substituted as unverified).
      "everyone-unverified": UNVERIFIED,
    }),
  ];

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
      criterionCount: groups.reduce(
        (count, group) => count + group.criteria.length,
        0,
      ),
      alternativeCount: alternatives.length,
    },
  };
}

async function renderMatrix(
  props: {
    matrix?: CategoryMatrixApiResponse;
    visibleAlternativeIds?: ReadonlySet<string>;
  } = {},
): Promise<string> {
  const module = (await import("../src/components/CategoryMatrixView")) as {
    default: (innerProps: {
      matrix: CategoryMatrixApiResponse;
      visibleAlternativeIds?: ReadonlySet<string>;
    }) => unknown;
  };
  return renderToStaticMarkup(
    createElement(module.default as never, {
      matrix: props.matrix ?? fixture(),
      visibleAlternativeIds: props.visibleAlternativeIds,
    }),
  );
}

function inMobileSlice(html: string): string {
  const start = html.indexOf('data-testid="category-matrix-mobile-inspector"');
  return start === -1 ? "" : html.slice(start);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("matrix decision toggles — default render (both off)", () => {
  it("renders both toggle controls with their localised labels", async () => {
    const html = await renderMatrix();

    // The two toggles must be visible in the toolbar surface with the
    // localised English labels — otherwise non-clicking users (screen reader,
    // touch with voice control) cannot discover them.
    expect(html).toContain("Show only differences");
    expect(html).toContain("Hide unverified");
  });

  it("renders the toggles inside the matrix toolbar surface (not a new filter panel)", async () => {
    const html = await renderMatrix();

    // The toggles must live under the existing `category-matrix-toolbar`
    // prefix; the removed filter panel's `category-matrix-filter-` prefix is
    // forbidden by the panel-removal contract.
    expect(html).toMatch(/category-matrix-toolbar/u);
    expect(html).not.toMatch(/category-matrix-filter[-\s"']/u);
  });

  it("exposes an off-state semantic for each toggle (aria-pressed or aria-checked)", async () => {
    const html = await renderMatrix();

    // The implementation may use either a pressed-button (aria-pressed) or a
    // checkbox (aria-checked / native checkbox). Either is acceptable — but
    // *some* off-state semantic must be present so screen readers know the
    // current toggle state.
    const showDiffSnippet =
      /(aria-pressed|aria-checked|type="checkbox")[^>]*"false"[^>]*>[\s\S]{0,200}?Show only differences/u.test(
        html,
      ) ||
      /Show only differences[\s\S]{0,200}?(aria-pressed|aria-checked|type="checkbox")[^>]*"false"/u.test(
        html,
      );
    const hideUnvSnippet =
      /(aria-pressed|aria-checked|type="checkbox")[^>]*"false"[^>]*>[\s\S]{0,200}?Hide unverified/u.test(
        html,
      ) ||
      /Hide unverified[\s\S]{0,200}?(aria-pressed|aria-checked|type="checkbox")[^>]*"false"/u.test(
        html,
      );

    expect(
      showDiffSnippet,
      "Show only differences must expose an off-state (aria-pressed/aria-checked false)",
    ).toBe(true);
    expect(
      hideUnvSnippet,
      "Hide unverified must expose an off-state (aria-pressed/aria-checked false)",
    ).toBe(true);
  });

  it("shows every criterion when both toggles are off (default render)", async () => {
    const html = await renderMatrix();

    expect(html).toContain("Everyone supports it");
    expect(html).toContain("Differs across products");
    expect(html).toContain("Mixed verified and unverified");
    expect(html).toContain("Multi enum same set different order");
    expect(html).toContain("Missing key vs unverified");
    expect(html).toContain("Nobody has data yet");
  });
});

describe("matrix decision toggles — Show only differences", () => {
  it("hides criteria where every visible alternative has the same verified value (equal-values case)", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    // Both alternatives are verified-true on this criterion → equal → hidden.
    expect(html).not.toContain("Everyone supports it");
    // The differing criterion must stay visible.
    expect(html).toContain("Differs across products");
  });

  it("keeps criteria where verified values differ across visible alternatives (mixed-values case)", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    // verified-vs-unverified mixes a verified-true and an unverified cell —
    // those are different effective states, so the criterion stays visible.
    expect(html).toContain("Mixed verified and unverified");
  });

  it("treats multi_enum values as equal regardless of option order", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    // ["a","b"] vs ["b","a"] are the same effective set; the criterion must
    // be treated as equal across alternatives and therefore hidden under
    // Show only differences.
    expect(html).not.toContain("Multi enum same set different order");
  });

  it("treats a missing fact key the same as an explicit unverified fact (bucket collapse)", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    // One alternative explicitly has {status:"unverified"}, the other has no
    // key at all (the renderer substitutes UNVERIFIED_FACT). Both must
    // collapse to the same "unverified" bucket → the criterion is equal and
    // gets hidden.
    expect(html).not.toContain("Missing key vs unverified");
  });

  it("hides a group header when all of the group's criteria are filtered out", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    // The "Noise" group only has the all-unverified criterion. With Show only
    // differences active, that criterion is equal across alternatives and
    // hidden — leaving the group with zero visible criteria, so the group
    // header must not render either.
    expect(html).not.toContain("Noise");
  });

  it("does not modify the row set (alternatives stay visible even when no criterion does)", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    // The toggles operate on the column axis. Row labels for the
    // alternatives must still render — otherwise the toggle is silently
    // dropping rows, which would break the Browse↔Matrix separation.
    expect(html).toContain("Alpha Chat");
    expect(html).toContain("Beta Chat");
  });

  it("keeps every criterion visible when only a single alternative is visible (degenerate case)", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix({
      visibleAlternativeIds: new Set(["alpha-chat"]),
    });

    // With one column there is nothing to "differ" against; the safer
    // default is to keep all criteria so the user can still inspect facts.
    expect(html).toContain("Everyone supports it");
    expect(html).toContain("Differs across products");
    expect(html).toContain("Mixed verified and unverified");
  });
});

describe("matrix decision toggles — Hide unverified", () => {
  it("hides a criterion where every visible alternative is unverified (all-unverified case)", async () => {
    toggleHookSeeds.hideUnverified = true;

    const html = await renderMatrix();

    // Both alternatives are unverified on `everyone-unverified` → entire
    // criterion is noise → hidden.
    expect(html).not.toContain("Nobody has data yet");
  });

  it("keeps a criterion that has at least one verified cell, even if other cells are unverified", async () => {
    toggleHookSeeds.hideUnverified = true;

    const html = await renderMatrix();

    // `verified-vs-unverified` has a verified-true and an unverified cell.
    // It must remain visible so the verified fact is comparable; the
    // unverified cell stays muted in its existing style (not red/negative)
    // to avoid implying "missing = bad".
    expect(html).toContain("Mixed verified and unverified");
  });

  it("leaves verified-only criteria untouched", async () => {
    toggleHookSeeds.hideUnverified = true;

    const html = await renderMatrix();

    expect(html).toContain("Everyone supports it");
    expect(html).toContain("Differs across products");
  });

  it("does not modify the stored matrix payload (toggling off restores everything)", async () => {
    toggleHookSeeds.hideUnverified = true;
    const withToggleOn = await renderMatrix();
    expect(withToggleOn).not.toContain("Nobody has data yet");

    // Reset and re-render with the toggle off — the hidden criterion must
    // come back. If the implementation mutated the matrix payload, this
    // assertion would fail.
    toggleHookSeeds.hideUnverified = false;
    toggleHookSeeds.booleanSeedIndex = 0;
    const withToggleOff = await renderMatrix();
    expect(withToggleOff).toContain("Nobody has data yet");
  });
});

describe("matrix decision toggles — combined behaviour", () => {
  it("applies both toggles together — only differing AND verified-bearing criteria survive", async () => {
    toggleHookSeeds.showOnlyDifferences = true;
    toggleHookSeeds.hideUnverified = true;

    const html = await renderMatrix();

    // `differs` has two distinct verified booleans → survives both filters.
    expect(html).toContain("Differs across products");
    // `verified-vs-unverified` differs AND has a verified cell → survives.
    expect(html).toContain("Mixed verified and unverified");
    // `everyone-true` is equal across alternatives → filtered by diff.
    expect(html).not.toContain("Everyone supports it");
    // `everyone-unverified` is all-unverified → filtered by hide-unverified
    // (and also equal under diff).
    expect(html).not.toContain("Nobody has data yet");
    // `multi-enum-equal` is equal across alternatives → filtered by diff.
    expect(html).not.toContain("Multi enum same set different order");
  });

  it("composes with criteria search — search AND toggles intersect", async () => {
    toggleHookSeeds.showOnlyDifferences = true;
    toggleHookSeeds.query = "everyone";

    const html = await renderMatrix();

    // The search would have matched two criteria ("Everyone supports it" and
    // "Nobody has data yet" via the `everyone` id substring is not in the
    // labels, so only the label "Everyone supports it" matches). With Show
    // only differences also active, "Everyone supports it" is equal across
    // alternatives and must be hidden — leaving nothing.
    expect(html).not.toContain("Everyone supports it");
    // Other criteria from outside the search must remain hidden by the
    // search filter (not surfaced by the toggle).
    expect(html).not.toContain("Differs across products");
  });

  it("composes with Browse filters — toggles re-evaluate on the reduced row set", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    // Scoping to a single alternative makes every column trivially "not
    // different" — but the degenerate single-alternative rule from
    // §3.1 says we show all criteria in that case.
    const html = await renderMatrix({
      visibleAlternativeIds: new Set(["beta-chat"]),
    });

    // Therefore the differing column is still visible.
    expect(html).toContain("Differs across products");
    // Alpha must not be a row in the table (Browse filter dropped it).
    expect(html).not.toContain("Alpha Chat");
    expect(html).toContain("Beta Chat");
  });

  it("renders a recognisable empty state when toggles hide every criterion", async () => {
    // Use a fixture where every criterion is equal across alternatives so
    // Show only differences hides everything.
    const allEqual: CategoryMatrixApiResponse = {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: "Secure messaging and chat apps",
          emoji: "chat",
        },
        groups: [
          {
            id: "g",
            label: "All same",
            description: null,
            criteria: [
              criterion("a", { label: "All true" }),
              criterion("b", { label: "All false" }),
            ],
          },
        ],
        alternatives: [
          alt("alpha", "Alpha", { a: VERIFIED_TRUE, b: VERIFIED_FALSE }),
          alt("beta", "Beta", { a: VERIFIED_TRUE, b: VERIFIED_FALSE }),
        ],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 1,
        criterionCount: 2,
        alternativeCount: 2,
      },
    };
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix({ matrix: allEqual });

    // The data table must not render with zero columns — the empty-state
    // surface (the same `category-matrix-toolbar-empty` block used for the
    // search empty state) takes over.
    expect(html).toMatch(/category-matrix-toolbar-empty/u);
    expect(html).not.toMatch(/<table[^>]*category-matrix-view-table/u);
    // The toolbar itself must stay rendered so the user can recover by
    // toggling off the controls.
    expect(html).toContain("Show only differences");
    expect(html).toContain("Hide unverified");
  });

  it("filters the mobile inspector in lockstep with the desktop table", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();
    const mobile = inMobileSlice(html);

    expect(mobile).not.toBe("");
    // Equal-value criterion absent from the mobile inspector too.
    expect(mobile).not.toContain("Everyone supports it");
    // Differing criterion present.
    expect(mobile).toContain("Differs across products");
  });
});

describe("matrix decision toggles — mode gating", () => {
  it("never references the toggle labels at module top level (toolbar-only surface)", () => {
    // The toolbar is mounted only inside `CategoryMatrixView`, which only
    // BrowsePage renders in matrix mode. The toggle labels must therefore
    // not appear in BrowsePage source. This is a static check; the
    // panel-removal test file already covers the rendered-DOM mode gate for
    // browse mode.
    const browsePageSource = readFileSync(
      new URL("../src/components/BrowsePage.tsx", import.meta.url),
      "utf8",
    );
    expect(browsePageSource).not.toContain("showDifferences");
    expect(browsePageSource).not.toContain("hideUnverified");
    expect(browsePageSource).not.toContain("Show only differences");
    expect(browsePageSource).not.toContain("Hide unverified");
  });
});

describe("matrix decision toggles — i18n key parity", () => {
  it("ships the new toggle keys in both English and German browse bundles", () => {
    const enToolbar = (browseEn.matrixView as Record<string, unknown>)
      .toolbar as Record<string, string> | undefined;
    const deToolbar = (browseDe.matrixView as Record<string, unknown>)
      .toolbar as Record<string, string> | undefined;

    expect(enToolbar).toBeDefined();
    expect(deToolbar).toBeDefined();

    const requiredKeys = ["showDifferences", "hideUnverified"] as const;
    for (const key of requiredKeys) {
      expect(
        enToolbar?.[key],
        `EN browse.matrixView.toolbar.${key} must be a non-empty string`,
      ).toBeTruthy();
      expect(
        deToolbar?.[key],
        `DE browse.matrixView.toolbar.${key} must be a non-empty string`,
      ).toBeTruthy();
    }
  });

  it("keeps the German toolbar bundle ASCII-only for umlauts (matches existing convention)", () => {
    const deToolbar = (browseDe.matrixView as Record<string, unknown>)
      .toolbar as Record<string, string> | undefined;
    expect(deToolbar).toBeDefined();

    // The German matrix block uses ASCII transliterations
    // (`unterstuetzt`, not `unterstützt`). New toggle copy must follow
    // suit — there is an existing test enforcing this for the whole
    // toolbar block; this assertion specifically pins the new keys.
    const umlautPattern = /[äöüÄÖÜß]/u;
    for (const key of ["showDifferences", "hideUnverified"] as const) {
      const value = deToolbar?.[key];
      if (value === undefined) continue;
      expect(
        umlautPattern.test(String(value)),
        `DE browse.matrixView.toolbar.${key} must not contain raw umlauts: ${String(value)}`,
      ).toBe(false);
    }
  });

  it("does not introduce a `matrixFilters` namespace (panel-removal contract)", () => {
    expect(browseEn).not.toHaveProperty("matrixFilters");
    expect(browseDe).not.toHaveProperty("matrixFilters");
  });
});

describe("matrix decision toggles — not_applicable handling", () => {
  it("does not hide a not_applicable cell under Hide unverified (NA is its own bucket)", async () => {
    // Fixture: a single criterion where every cell is `not_applicable`. If
    // Hide unverified incorrectly bucketed NA as unverified, this would be
    // hidden. NA is a meaningful product fact ("not relevant to this
    // product"), not absent data — it must stay visible.
    const naMatrix: CategoryMatrixApiResponse = {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: null,
          emoji: "chat",
        },
        groups: [
          {
            id: "g",
            label: "G",
            description: null,
            criteria: [criterion("na-only", { label: "Not applicable here" })],
          },
        ],
        alternatives: [
          alt("alpha", "Alpha", { "na-only": NOT_APPLICABLE }),
          alt("beta", "Beta", { "na-only": NOT_APPLICABLE }),
        ],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 1,
        criterionCount: 1,
        alternativeCount: 2,
      },
    };
    toggleHookSeeds.hideUnverified = true;

    const html = await renderMatrix({ matrix: naMatrix });

    // The criterion must still be visible — NA is not unverified.
    expect(html).toContain("Not applicable here");
  });

  it("treats not_applicable as a distinct bucket from unverified under Show only differences", async () => {
    // Show only differences must NOT collapse NA and unverified into the same
    // bucket. The rationale: NA is a meaningful product fact ("not relevant
    // here"), unverified is absent data. If `effectiveFactKey` returned the
    // same key for both, this criterion would be hidden — silently dropping
    // the NA fact from the user's comparison.
    const naVsUnverified: CategoryMatrixApiResponse = {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: null,
          emoji: "chat",
        },
        groups: [
          {
            id: "g",
            label: "G",
            description: null,
            criteria: [
              criterion("na-vs-unverified", { label: "NA versus unverified" }),
            ],
          },
        ],
        alternatives: [
          alt("alpha", "Alpha", { "na-vs-unverified": NOT_APPLICABLE }),
          alt("beta", "Beta", { "na-vs-unverified": UNVERIFIED }),
        ],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 1,
        criterionCount: 1,
        alternativeCount: 2,
      },
    };
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix({ matrix: naVsUnverified });

    expect(html).toContain("NA versus unverified");
  });
});

describe("matrix decision toggles — Show only differences (value type coverage)", () => {
  it("distinguishes verified numbers with different values (number bucket uses JSON-encoded value)", async () => {
    // The implementation's `effectiveFactKey` encodes verified scalar facts as
    // `v:<type>:<JSON>`. Boolean and multi_enum equality are covered upstream;
    // this test pins the number-type path so a regression in the
    // type-aware scalar key (e.g. dropping the typeof tag) would surface.
    const numericMatrix: CategoryMatrixApiResponse = {
      data: {
        category: {
          id: "hosting",
          name: "Hosting",
          description: null,
          emoji: "cloud",
        },
        groups: [
          {
            id: "g",
            label: "Pricing",
            description: null,
            criteria: [
              criterion("price-eq", {
                label: "Monthly price equal",
                valueType: "number",
              }),
              criterion("price-diff", {
                label: "Monthly price differs",
                valueType: "number",
              }),
            ],
          },
        ],
        alternatives: [
          alt("alpha", "Alpha", {
            "price-eq": { status: "verified", value: 5 },
            "price-diff": { status: "verified", value: 5 },
          }),
          alt("beta", "Beta", {
            "price-eq": { status: "verified", value: 5 },
            "price-diff": { status: "verified", value: 9 },
          }),
        ],
      },
      meta: {
        category: "hosting",
        locale: "en",
        groupCount: 1,
        criterionCount: 2,
        alternativeCount: 2,
      },
    };
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix({ matrix: numericMatrix });

    // 5 vs 5 → equal → hidden.
    expect(html).not.toContain("Monthly price equal");
    // 5 vs 9 → different → visible.
    expect(html).toContain("Monthly price differs");
  });

  it("distinguishes verified string-scalar facts with different values (text/enum bucket)", async () => {
    // Same path as the numeric test above but for string scalars (enum, url,
    // text, date all route through the same `v:string:<JSON>` branch). If the
    // implementation ever flattened the scalar key it would surface here.
    const stringMatrix: CategoryMatrixApiResponse = {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: null,
          emoji: "chat",
        },
        groups: [
          {
            id: "g",
            label: "Status",
            description: null,
            criteria: [
              criterion("status-eq", {
                label: "Status equal",
                valueType: "text",
              }),
              criterion("status-diff", {
                label: "Status differs",
                valueType: "text",
              }),
            ],
          },
        ],
        alternatives: [
          alt("alpha", "Alpha", {
            "status-eq": { status: "verified", value: "open-source" },
            "status-diff": { status: "verified", value: "open-source" },
          }),
          alt("beta", "Beta", {
            "status-eq": { status: "verified", value: "open-source" },
            "status-diff": { status: "verified", value: "proprietary" },
          }),
        ],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 1,
        criterionCount: 2,
        alternativeCount: 2,
      },
    };
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix({ matrix: stringMatrix });

    expect(html).not.toContain("Status equal");
    expect(html).toContain("Status differs");
  });
});

describe("matrix decision toggles — empty-state recovery affordances", () => {
  function allEqualMatrix(): CategoryMatrixApiResponse {
    return {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: null,
          emoji: "chat",
        },
        groups: [
          {
            id: "g",
            label: "All same",
            description: null,
            criteria: [criterion("a", { label: "All true" })],
          },
        ],
        alternatives: [
          alt("alpha", "Alpha", { a: VERIFIED_TRUE }),
          alt("beta", "Beta", { a: VERIFIED_TRUE }),
        ],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 1,
        criterionCount: 1,
        alternativeCount: 2,
      },
    };
  }

  it("renders a Reset toggles button in the empty state when toggles are active", async () => {
    toggleHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix({ matrix: allEqualMatrix() });

    // The button copy comes from `matrixView.toolbar.resetToggles`. It must
    // appear so the user has a recovery affordance distinct from clearing
    // the search.
    expect(html).toContain("Reset toggles");
    expect(html).toMatch(/category-matrix-toolbar-empty-reset/u);
  });

  it("uses the toggle-aware empty body copy when only toggles are active (not the search copy)", async () => {
    toggleHookSeeds.hideUnverified = true;

    // All-unverified single criterion → Hide unverified empties the matrix.
    const allUnverified: CategoryMatrixApiResponse = {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: null,
          emoji: "chat",
        },
        groups: [
          {
            id: "g",
            label: "G",
            description: null,
            criteria: [criterion("u", { label: "Unverified everywhere" })],
          },
        ],
        alternatives: [
          alt("alpha", "Alpha", { u: UNVERIFIED }),
          alt("beta", "Beta", { u: UNVERIFIED }),
        ],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 1,
        criterionCount: 1,
        alternativeCount: 2,
      },
    };

    const html = await renderMatrix({ matrix: allUnverified });

    // The toggle-specific body copy must be used. The plain `emptyBody` copy
    // tells the user to "clear the search" — wrong instruction when there is
    // no search; pinning the right branch prevents that regression.
    expect(html).toContain(
      "No criteria match the active filters. Reset the toggles or clear the search to see more criteria.",
    );
    expect(html).not.toContain(
      "No criteria match the current search. Clear the search to see all criteria.",
    );
  });

  it("renders both Reset toggles and Clear search buttons when search and toggles are both active", async () => {
    // Combined recovery affordances: the user can recover by either path. The
    // implementation conditionally renders each button, so this pins the
    // intersection — a regression that ANDed (instead of ORed) the
    // conditions would drop one of the buttons.
    toggleHookSeeds.showOnlyDifferences = true;
    toggleHookSeeds.query = "nothing-matches-this-query-xyz";

    const html = await renderMatrix({ matrix: allEqualMatrix() });

    expect(html).toMatch(/category-matrix-toolbar-empty-reset/u);
    expect(html).toContain("Reset toggles");
    expect(html).toMatch(/category-matrix-toolbar-empty-clear/u);
    expect(html).toContain("Clear criteria search");
  });
});
