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
// `CategoryMatrixView` owns component-local state. An SSR test cannot
// dispatch real events, so we intercept the seed values of the relevant
// `useState` calls.
//
// Existing useState calls (from the toolbar + decision-toggles tests):
//   - first `useState("")`             → criteria query
//   - first `useState("comfortable")`  → density
//   - first  `useState(false)`         → `showOnlyDifferences`
//   - second `useState(false)`         → `hideUnverified`
//
// New useState calls this issue adds:
//   - `useState<Set<string>>(new Set())`  OR  `useState<string[]>([])`
//        → the pinned-id set. We accept either shape so the implementer
//          can pick whichever fits.
//   - third `useState(false)`         → `focusedOnly` (the "Focus on pinned"
//          toggle). It defaults to `false` and is the third boolean seed.
//
// All later `useState(false)` calls (each `MatrixCell`'s popover-open
// state, etc.) fall through to the real React implementation so unrelated
// behaviour stays correct.

type PinHookSeeds = {
  query: string;
  density: "comfortable" | "compact";
  showOnlyDifferences: boolean;
  hideUnverified: boolean;
  focusedOnly: boolean;
  pinned: readonly string[];
  queryInjected: boolean;
  densityInjected: boolean;
  pinnedInjected: boolean;
  booleanSeedIndex: number;
};

const pinHookSeeds: PinHookSeeds = vi.hoisted(() => ({
  query: "",
  density: "comfortable",
  showOnlyDifferences: false,
  hideUnverified: false,
  focusedOnly: false,
  pinned: [],
  queryInjected: false,
  densityInjected: false,
  pinnedInjected: false,
  booleanSeedIndex: 0,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    useState: <S>(initial: S | (() => S)) => {
      if (initial === "" && !pinHookSeeds.queryInjected) {
        pinHookSeeds.queryInjected = true;
        return [
          pinHookSeeds.query as unknown as S,
          vi.fn() as Dispatch<SetStateAction<S>>,
        ];
      }
      if (initial === "comfortable" && !pinHookSeeds.densityInjected) {
        pinHookSeeds.densityInjected = true;
        return [
          pinHookSeeds.density as unknown as S,
          vi.fn() as Dispatch<SetStateAction<S>>,
        ];
      }
      // Pinned-id state: accept either `Set<string>` (empty) or `string[]`
      // (empty) as the implementer's initial shape. The first such call is
      // taken as the pinned-ids hook.
      if (
        !pinHookSeeds.pinnedInjected &&
        initial instanceof Set &&
        (initial as Set<unknown>).size === 0
      ) {
        pinHookSeeds.pinnedInjected = true;
        return [
          new Set(pinHookSeeds.pinned) as unknown as S,
          vi.fn() as Dispatch<SetStateAction<S>>,
        ];
      }
      if (
        !pinHookSeeds.pinnedInjected &&
        Array.isArray(initial) &&
        (initial as unknown[]).length === 0
      ) {
        pinHookSeeds.pinnedInjected = true;
        return [
          [...pinHookSeeds.pinned] as unknown as S,
          vi.fn() as Dispatch<SetStateAction<S>>,
        ];
      }
      if (initial === false) {
        const index = pinHookSeeds.booleanSeedIndex;
        pinHookSeeds.booleanSeedIndex = index + 1;
        if (index === 0) {
          return [
            pinHookSeeds.showOnlyDifferences as unknown as S,
            vi.fn() as Dispatch<SetStateAction<S>>,
          ];
        }
        if (index === 1) {
          return [
            pinHookSeeds.hideUnverified as unknown as S,
            vi.fn() as Dispatch<SetStateAction<S>>,
          ];
        }
        if (index === 2) {
          return [
            pinHookSeeds.focusedOnly as unknown as S,
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
    "matrixView.toolbar.focusOnly": "Focus on pinned",
    "matrixView.toolbar.clearPins": "Clear pins",
    "matrixView.toolbar.pinnedCount": "{{count}} pinned",
    "matrixView.pinAction": "Pin {{product}}",
    "matrixView.unpinAction": "Unpin {{product}}",
    "matrixView.pinnedBadge": "Pinned",
    "matrixView.focusedEmptyTitle": "No pinned products visible",
    "matrixView.focusedEmptyBody":
      "Your pinned products are filtered out. Exit focus mode to see them again.",
    "matrixView.exitFocus": "Exit focus mode",
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
  pinHookSeeds.query = "";
  pinHookSeeds.density = "comfortable";
  pinHookSeeds.showOnlyDifferences = false;
  pinHookSeeds.hideUnverified = false;
  pinHookSeeds.focusedOnly = false;
  pinHookSeeds.pinned = [];
  pinHookSeeds.queryInjected = false;
  pinHookSeeds.densityInjected = false;
  pinHookSeeds.pinnedInjected = false;
  pinHookSeeds.booleanSeedIndex = 0;
});

// ---------------------------------------------------------------------------
// Fixture — three alternatives so that pinning a strict subset is meaningful
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

function fixture(): CategoryMatrixApiResponse {
  const groups = [
    {
      id: "core",
      label: "Core",
      description: null,
      criteria: [
        criterion("e2ee", { label: "End-to-end encryption" }),
        criterion("self-host", { label: "Self-hostable" }),
        criterion("federated", { label: "Federated" }),
      ],
    },
  ];

  const alternatives: MatrixAlternative[] = [
    alt("alpha-chat", "Alpha Chat", {
      e2ee: VERIFIED_TRUE,
      "self-host": VERIFIED_TRUE,
      federated: VERIFIED_FALSE,
    }),
    alt("beta-chat", "Beta Chat", {
      e2ee: VERIFIED_TRUE,
      "self-host": VERIFIED_FALSE,
      federated: VERIFIED_TRUE,
    }),
    alt("gamma-chat", "Gamma Chat", {
      e2ee: VERIFIED_TRUE,
      "self-host": UNVERIFIED,
      federated: VERIFIED_FALSE,
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

function tbodySlice(html: string): string {
  const start = html.indexOf("<tbody");
  if (start === -1) return "";
  const end = html.indexOf("</tbody>", start);
  return end === -1 ? html.slice(start) : html.slice(start, end);
}

function mobileSlice(html: string): string {
  const start = html.indexOf('data-testid="category-matrix-mobile-inspector"');
  return start === -1 ? "" : html.slice(start);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("matrix pin controls — per-row pin button", () => {
  it("renders a localised icon-only pin button for each alternative row in the default state", async () => {
    const html = await renderMatrix();

    // Every alternative gets a pin affordance. The accessible name must
    // mention the product so screen-reader users can distinguish them,
    // while the visible control remains an icon instead of a text button.
    expect(html).toContain('aria-label="Pin Alpha Chat"');
    expect(html).toContain('aria-label="Pin Beta Chat"');
    expect(html).toContain('aria-label="Pin Gamma Chat"');
    expect(html).toContain("category-matrix-pin-icon");
    expect(html).not.toMatch(/<button[^>]*category-matrix-pin-button[^>]*>\s*Pin Alpha Chat\s*<\/button>/u);
  });

  it("flips the icon button accessible label to the localised Unpin string for already-pinned rows", async () => {
    pinHookSeeds.pinned = ["alpha-chat"];

    const html = await renderMatrix();

    // Alpha is pinned → its button advertises the inverse action.
    expect(html).toContain('aria-label="Unpin Alpha Chat"');
    // The other rows still offer Pin (unchanged).
    expect(html).toContain('aria-label="Pin Beta Chat"');
    expect(html).toContain('aria-label="Pin Gamma Chat"');
  });

  it("exposes aria-pressed state on the pin button (true for pinned, false for unpinned)", async () => {
    pinHookSeeds.pinned = ["beta-chat"];

    const html = await renderMatrix();

    // Beta's pin button must indicate it is pressed (pinned).
    expect(html).toMatch(
      /aria-pressed="true"[^>]*aria-label="Unpin Beta Chat"|aria-label="Unpin Beta Chat"[^>]*aria-pressed="true"/u,
    );
    // Alpha (not pinned) must show the off state next to its accessible Pin label.
    expect(html).toMatch(
      /aria-pressed="false"[^>]*aria-label="Pin Alpha Chat"|aria-label="Pin Alpha Chat"[^>]*aria-pressed="false"/u,
    );
  });
});

describe("matrix pin controls — row ordering", () => {
  it("preserves API order when nothing is pinned", async () => {
    const html = await renderMatrix();
    const body = tbodySlice(html);

    const alphaIndex = body.indexOf("Alpha Chat");
    const betaIndex = body.indexOf("Beta Chat");
    const gammaIndex = body.indexOf("Gamma Chat");

    expect(alphaIndex).toBeGreaterThanOrEqual(0);
    expect(betaIndex).toBeGreaterThan(alphaIndex);
    expect(gammaIndex).toBeGreaterThan(betaIndex);
  });

  it("moves pinned rows to the top while preserving relative order within each group", async () => {
    // Pin Gamma (last) — it should jump to the top. Alpha + Beta keep their
    // original relative order below it.
    pinHookSeeds.pinned = ["gamma-chat"];

    const html = await renderMatrix();
    const body = tbodySlice(html);

    const gammaIndex = body.indexOf("Gamma Chat");
    const alphaIndex = body.indexOf("Alpha Chat");
    const betaIndex = body.indexOf("Beta Chat");

    expect(gammaIndex).toBeGreaterThanOrEqual(0);
    expect(alphaIndex).toBeGreaterThan(gammaIndex);
    expect(betaIndex).toBeGreaterThan(alphaIndex);
  });

  it("orders multiple pinned rows by original API order, not by pin time", async () => {
    // Pin Beta first, then Alpha — but the rendered order must follow the
    // matrix's original API order (Alpha before Beta), not the user's pin
    // sequence. Otherwise the UI flickers around as users toggle pins.
    pinHookSeeds.pinned = ["beta-chat", "alpha-chat"];

    const html = await renderMatrix();
    const body = tbodySlice(html);

    const alphaIndex = body.indexOf("Alpha Chat");
    const betaIndex = body.indexOf("Beta Chat");
    const gammaIndex = body.indexOf("Gamma Chat");

    expect(alphaIndex).toBeGreaterThanOrEqual(0);
    expect(betaIndex).toBeGreaterThan(alphaIndex);
    expect(gammaIndex).toBeGreaterThan(betaIndex);
  });
});

describe("matrix pin controls — focus mode toggle", () => {
  it("renders the Focus on pinned toggle in the toolbar with an off-state semantic", async () => {
    const html = await renderMatrix();

    // The toggle label must be present (toolbar i18n surface).
    expect(html).toContain("Focus on pinned");
    // Must live inside the existing toolbar; the forbidden filter-panel
    // prefix must not reappear.
    expect(html).toMatch(/category-matrix-toolbar/u);
    expect(html).not.toMatch(/category-matrix-filter[-\s"']/u);
  });

  it("disables the Focus on pinned toggle when nothing is pinned", async () => {
    const html = await renderMatrix();

    // With zero pins the toggle has no meaningful action. It must be
    // visibly disabled to communicate the dependency on at least one pin.
    expect(html).toMatch(
      /(disabled|aria-disabled="true")[^>]*>[\s\S]{0,400}?Focus on pinned|Focus on pinned[\s\S]{0,400}?(disabled|aria-disabled="true")/u,
    );
  });

  it("filters rows to the pinned set when focus mode is on", async () => {
    pinHookSeeds.pinned = ["alpha-chat", "gamma-chat"];
    pinHookSeeds.focusedOnly = true;

    const html = await renderMatrix();
    const body = tbodySlice(html);

    // Only pinned rows render in the table body.
    expect(body).toContain("Alpha Chat");
    expect(body).toContain("Gamma Chat");
    expect(body).not.toContain("Beta Chat");
  });
});

describe("matrix pin controls — composition with decision toggles", () => {
  it("recomputes Show only differences against the focused (pinned) set, not the full catalog", async () => {
    // Pin Alpha + Gamma. Both agree on `e2ee` (verified-true) and `federated`
    // (verified-false). They differ on `self-host` (true vs unverified).
    // Under focus mode the toggle must hide e2ee + federated even though
    // Beta (excluded) would have changed the result.
    pinHookSeeds.pinned = ["alpha-chat", "gamma-chat"];
    pinHookSeeds.focusedOnly = true;
    pinHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    // `self-host` differs between Alpha and Gamma → visible.
    expect(html).toContain("Self-hostable");
    // `e2ee` is identical across Alpha + Gamma → must be hidden.
    expect(html).not.toContain("End-to-end encryption");
    // `federated` is identical across Alpha + Gamma → must be hidden.
    expect(html).not.toContain("Federated");
  });

  it("keeps every criterion visible when the focused set has exactly one product (degenerate case)", async () => {
    // With a single product there is nothing to "differ" against. The
    // toggle must not hide every column — same rule as the existing
    // single-alternative degenerate case for showOnlyDifferences.
    pinHookSeeds.pinned = ["alpha-chat"];
    pinHookSeeds.focusedOnly = true;
    pinHookSeeds.showOnlyDifferences = true;

    const html = await renderMatrix();

    expect(html).toContain("End-to-end encryption");
    expect(html).toContain("Self-hostable");
    expect(html).toContain("Federated");
  });
});

describe("matrix pin controls — Browse filter isolation", () => {
  it("intersects the pinned set with visibleAlternativeIds — filtered-out pins do not render", async () => {
    // User pinned Alpha, then switched to Browse and filtered Alpha out.
    // Returning to Matrix: Alpha must NOT render, the matrix must not
    // throw, and Beta + Gamma render normally.
    pinHookSeeds.pinned = ["alpha-chat"];

    const html = await renderMatrix({
      visibleAlternativeIds: new Set(["beta-chat", "gamma-chat"]),
    });
    const body = tbodySlice(html);

    expect(body).not.toContain("Alpha Chat");
    expect(body).toContain("Beta Chat");
    expect(body).toContain("Gamma Chat");
  });

  it("silently ignores stale pinned ids that no longer exist in the matrix payload", async () => {
    // The pin set contains an id that isn't in the matrix (e.g. came from
    // a previous category). It must be dropped silently, the matrix must
    // still render, and the present products must appear in normal order.
    pinHookSeeds.pinned = ["does-not-exist-xyz"];

    const html = await renderMatrix();
    const body = tbodySlice(html);

    expect(body).toContain("Alpha Chat");
    expect(body).toContain("Beta Chat");
    expect(body).toContain("Gamma Chat");
  });

  it("renders an empty-state recovery affordance when focus mode hides every row (intersection is empty)", async () => {
    // User pinned Alpha + Beta and turned on focus mode. Then a Browse
    // filter excluded both. The matrix would otherwise render an empty
    // table; instead it must show a recovery affordance so the user can
    // exit focus mode without resorting to URL surgery.
    pinHookSeeds.pinned = ["alpha-chat", "beta-chat"];
    pinHookSeeds.focusedOnly = true;

    const html = await renderMatrix({
      visibleAlternativeIds: new Set(["gamma-chat"]),
    });

    // The recovery button is keyed off `matrixView.exitFocus`.
    expect(html).toContain("Exit focus mode");
    // The data table must not render with zero rows.
    expect(html).not.toMatch(
      /<tbody[^>]*>\s*(<tr[\s>][^<]*Alpha Chat|<tr[\s>][^<]*Beta Chat|<tr[\s>][^<]*Gamma Chat)/u,
    );
  });
});

describe("matrix pin controls — mobile inspector", () => {
  it("renders pinned products vertically in the mobile inspector when at least one pin is set", async () => {
    pinHookSeeds.pinned = ["alpha-chat", "gamma-chat"];

    const html = await renderMatrix();
    const mobile = mobileSlice(html);

    expect(mobile).not.toBe("");
    // Both pinned products' facts surface in the inspector. The mobile
    // inspector renders `data-alternative-id` per product; assert both
    // pinned products appear (Beta — unpinned — must not).
    expect(mobile).toContain('data-alternative-id="alpha-chat"');
    expect(mobile).toContain('data-alternative-id="gamma-chat"');
    expect(mobile).not.toContain('data-alternative-id="beta-chat"');
  });

  it("falls back to the primary/secondary select pattern when zero products are pinned", async () => {
    // Existing behaviour must not change for users who never discover
    // pinning — the inspector still renders the two-select fallback so
    // mobile users have a way to scope the comparison.
    const html = await renderMatrix();
    const mobile = mobileSlice(html);

    expect(mobile).not.toBe("");
    expect(mobile).toContain("Primary product");
    expect(mobile).toContain("Compare with");
  });
});

describe("matrix pin controls — i18n parity", () => {
  it("ships the new toolbar keys in both English and German browse bundles", () => {
    const enToolbar = (browseEn.matrixView as Record<string, unknown>)
      .toolbar as Record<string, string> | undefined;
    const deToolbar = (browseDe.matrixView as Record<string, unknown>)
      .toolbar as Record<string, string> | undefined;

    expect(enToolbar).toBeDefined();
    expect(deToolbar).toBeDefined();

    const requiredToolbarKeys = [
      "focusOnly",
      "clearPins",
      "pinnedCount",
    ] as const;
    for (const key of requiredToolbarKeys) {
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

  it("ships the per-row pin/unpin action keys in both bundles", () => {
    const enMatrix = browseEn.matrixView as Record<string, unknown>;
    const deMatrix = browseDe.matrixView as Record<string, unknown>;

    for (const key of ["pinAction", "unpinAction"] as const) {
      expect(
        enMatrix[key],
        `EN browse.matrixView.${key} must be a non-empty string`,
      ).toBeTruthy();
      expect(
        deMatrix[key],
        `DE browse.matrixView.${key} must be a non-empty string`,
      ).toBeTruthy();
    }
  });

  it("uses native German umlauts for pin and focus strings", () => {
    const deToolbar = (browseDe.matrixView as Record<string, unknown>)
      .toolbar as Record<string, string> | undefined;
    const deMatrix = browseDe.matrixView as Record<string, unknown>;
    expect(deToolbar).toBeDefined();

    expect(deToolbar?.focusOnly).toBe("Fokus auf Angeheftete");
    expect(deToolbar?.clearPins).toBe("Anheftungen löschen");
    expect(deToolbar?.pinnedCount).toBe("{{count}} angeheftet");
    expect(deMatrix.pinAction).toBe("{{product}} anheften");
    expect(deMatrix.unpinAction).toBe("{{product}} lösen");
  });
});

describe("matrix pin controls — toolbar pinned state", () => {
  it("flips the Focus on pinned toggle to aria-pressed=true when focus mode is on", async () => {
    // The off-state is already asserted (disabled-when-empty). This asserts
    // the on-state: with pins set and focus mode active, the toolbar toggle
    // must advertise its pressed state for assistive tech and styling.
    pinHookSeeds.pinned = ["alpha-chat"];
    pinHookSeeds.focusedOnly = true;

    const html = await renderMatrix();

    expect(html).toMatch(
      /aria-pressed="true"[^>]*>[\s\S]{0,400}?Focus on pinned|Focus on pinned[\s\S]{0,400}?aria-pressed="true"/u,
    );
  });

  it("renders the localised pinned-count label with the actual count when pins are present", async () => {
    // The toolbar i18n template is `{{count}} pinned`. Asserting the
    // rendered string (not just the i18n key) confirms the count is wired
    // through and that the toolbar exposes the live counter when needed.
    pinHookSeeds.pinned = ["alpha-chat", "gamma-chat"];

    const html = await renderMatrix();

    expect(html).toContain("2 pinned");
  });

  it("renders the Clear pins affordance when at least one product is pinned", async () => {
    // The clear-pins button is the user's only way back to an empty pin
    // set without toggling every row. With pins set, the localised label
    // must appear in the toolbar surface.
    pinHookSeeds.pinned = ["alpha-chat"];

    const html = await renderMatrix();

    expect(html).toContain("Clear pins");
  });

  it("hides the Clear pins affordance and pinned-count label when nothing is pinned", async () => {
    // When the pin set is empty, neither the live counter nor the clear
    // button should render — they would be noisy and meaningless. Only
    // the disabled Focus on pinned toggle stays put.
    const html = await renderMatrix();

    expect(html).not.toContain("Clear pins");
    // The localised counter template would render "0 pinned"; assert it
    // does not appear so users do not see a zero-count badge.
    expect(html).not.toContain("0 pinned");
  });
});

describe("matrix pin controls — Hide unverified composition", () => {
  it("recomputes Hide unverified against the focused (pinned) set, not the full catalog", async () => {
    // Pin Gamma alone. In the full catalog, `self-host` is verified for
    // Alpha and Beta, so Hide unverified leaves it visible. Under focus
    // mode the reference set is just Gamma, whose `self-host` fact is
    // unverified — the criterion must therefore be hidden. This mirrors
    // the showOnlyDifferences composition check, guarding the symmetric
    // `comparisonAlternatives` rewiring in `filteredGroups`.
    pinHookSeeds.pinned = ["gamma-chat"];
    pinHookSeeds.focusedOnly = true;
    pinHookSeeds.hideUnverified = true;

    const html = await renderMatrix();

    // `e2ee` is verified for Gamma → visible.
    expect(html).toContain("End-to-end encryption");
    // `federated` is verified for Gamma → visible.
    expect(html).toContain("Federated");
    // `self-host` is unverified for the focused set (Gamma alone) → hidden.
    expect(html).not.toContain("Self-hostable");
  });
});

describe("matrix pin controls — naming contract", () => {
  it("does not resurrect the forbidden category-matrix-filter- prefix", async () => {
    // The pin/focus surface must use a new prefix (research suggests
    // `category-matrix-pin-` / `category-matrix-focused-`) — not the
    // removed filter panel's prefix, which is forbidden by a separate
    // contract test.
    pinHookSeeds.pinned = ["alpha-chat"];

    const html = await renderMatrix();

    expect(html).not.toMatch(/category-matrix-filter[-\s"']/u);
  });

  it("does not introduce a matrixFilters block in either locale bundle", () => {
    expect(browseEn).not.toHaveProperty("matrixFilters");
    expect(browseDe).not.toHaveProperty("matrixFilters");
  });
});
