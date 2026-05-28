import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

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
// i18n mock — extends the existing matrix-test translation table with the new
// inspector keys this issue introduces. Any new key must also be present in
// the locale JSON files (see `inspector i18n parity` tests at the bottom).
// ---------------------------------------------------------------------------
vi.mock("react-i18next", () => {
  const translations: Record<string, Record<string, string>> = {
    en: {
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
      "matrixView.popover.title": "Cell details",
      "matrixView.popover.openLabel":
        "Show details for {{product}} — {{criterion}}",
      "matrixView.popover.close": "Close",
      "matrixView.popover.product": "Product",
      "matrixView.popover.criterion": "Criterion",
      "matrixView.popover.value": "Value",
      "matrixView.popover.source": "Source",
      "matrixView.popover.noSource": "No public source available",
      "matrixView.inspector.primaryLabel": "Primary product",
      "matrixView.inspector.compareLabel": "Compare with",
      "matrixView.inspector.noSecondary": "No comparison",
      "matrixView.inspector.openSheet":
        "Show source for {{product}} — {{criterion}}",
    },
  };

  return {
    useTranslation: () => ({
      i18n: { language: "en" },
      t: (key: string, values?: Record<string, string | number>) => {
        const template = translations.en[key] ?? key;

        return template.replace(/\{\{(\w+)\}\}/gu, (_match, name: string) =>
          String(values?.[name] ?? ""),
        );
      },
    }),
  };
});

// ---------------------------------------------------------------------------
// Fixture: mirrors `tests/category-matrix-legend-and-popover.test.ts` so the
// behaviour the desktop matrix tests pin is also enforced for the mobile
// inspector. Two alternatives, one verified-positive boolean, one verified
// negative boolean, one verified enum with positive/warning tones, one
// unverified fact, one not_applicable fact, one URL-typed fact, one unsafe
// `javascript:` URL that must never reach the DOM.
// ---------------------------------------------------------------------------
function criterion(
  id: string,
  filterMode: MatrixFilterMode,
  overrides: Partial<MatrixCriterion> = {},
): MatrixCriterion {
  return {
    id,
    label: overrides.label ?? id,
    helpText: overrides.helpText ?? null,
    valueType: overrides.valueType ?? "boolean",
    semantics: overrides.semantics ?? "informational",
    filterMode,
    options: overrides.options ?? [],
  };
}

function matrixAlternative(
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

function fixture(): CategoryMatrixApiResponse {
  const groups = [
    {
      id: "privacy",
      label: "Privacy",
      description: null,
      criteria: [
        criterion("e2ee", "must_match", {
          label: "End-to-end encryption",
          valueType: "boolean",
          semantics: "beneficial",
        }),
        criterion("hosting_region", "must_match", {
          label: "Hosting region",
          valueType: "enum",
          options: [
            { id: "eu", label: "EU hosted", displayTone: "positive" },
            { id: "global", label: "Global", displayTone: "warning" },
          ],
        }),
        criterion("export_formats", "none", {
          label: "Data export formats",
          valueType: "multi_enum",
          options: [
            { id: "csv", label: "CSV export", displayTone: "positive" },
            { id: "json", label: "JSON export", displayTone: "neutral" },
          ],
        }),
        criterion("privacy_policy", "none", {
          label: "Privacy policy",
          valueType: "url",
        }),
      ],
    },
  ];

  const alternatives: MatrixAlternative[] = [
    matrixAlternative("zeta-chat", "Zeta Chat", {
      e2ee: {
        status: "verified",
        value: false,
        source: {
          url: "https://zeta-chat.example/encryption-report",
          title: "Zeta encryption report",
          accessedDate: "2026-05-24",
        },
        auditQuote:
          "Internal verification quote for Zeta encryption must stay private.",
        raw_response: "Never show verifier raw response for Zeta.",
      } as unknown as MatrixFact,
      hosting_region: { status: "verified", value: "global" },
      export_formats: {
        status: "unverified",
        value: null,
        source: {
          url: "https://zeta-chat.example/export-formats",
          title: "Zeta export format source",
        },
        auditQuote: "Internal unverified export quote must not become public.",
      } as unknown as MatrixFact,
      privacy_policy: {
        status: "verified",
        value: "https://zeta-chat.example/privacy",
      },
    }),
    matrixAlternative("alpha-chat", "Alpha Chat", {
      e2ee: {
        status: "verified",
        value: true,
        source: {
          url: "https://alpha-chat.example/security",
        },
      },
      hosting_region: {
        status: "verified",
        value: "eu",
        source: {
          url: "javascript:alert(99)",
          title: "Unsafe Alpha hosting source",
          accessedDate: "2026-05-23",
        },
      },
      export_formats: {
        status: "not_applicable",
        value: null,
        source: {
          url: "https://alpha-chat.example/export-na",
          title: "Alpha export NA source",
        },
        auditQuote:
          "Internal not-applicable export quote must not become public.",
      } as unknown as MatrixFact,
      privacy_policy: {
        status: "verified",
        value: "https://alpha-chat.example/privacy",
      },
    }),
  ];

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

async function renderMatrix(
  options: {
    visibleAlternativeIds?: ReadonlySet<string>;
    reducedMotion?: boolean;
  } = {},
): Promise<string> {
  const module = (await import("../src/components/CategoryMatrixView")) as {
    default: (props: {
      matrix: CategoryMatrixApiResponse;
      visibleAlternativeIds?: ReadonlySet<string>;
      reducedMotion?: boolean;
    }) => unknown;
  };
  return renderToStaticMarkup(
    createElement(module.default as never, { matrix: fixture(), ...options }),
  );
}

// The inspector subtree is identified by a stable data-testid that the
// implementation must apply to the mobile inspector wrapper. We slice a
// generous window starting at that marker so per-test assertions can
// disambiguate inspector content from the desktop table content (which
// renders in the same SSR pass for the dual-tree CSS swap).
function inspectorSubtree(html: string): string {
  const marker = 'data-testid="category-matrix-mobile-inspector"';
  const start = html.indexOf(marker);
  if (start === -1) {
    return "";
  }
  // Wide enough to span the full inspector content (selectors, group
  // headers, criterion rows, source affordances) without trying to balance
  // nested tags by regex. Matches the windowing approach used by
  // `popoverWindows` in `category-matrix-legend-and-popover.test.ts`.
  return html.slice(start, start + 12000);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mobile matrix inspector — structure", () => {
  it("renders the inspector subtree in SSR alongside the desktop table", async () => {
    // The mobile experience is delivered via dual-tree SSR + a CSS responsive
    // swap (per research.md, the chosen approach for SSR stability). Both
    // trees must therefore appear in the rendered markup; the actual
    // visibility swap happens in CSS at the breakpoint.
    const html = await renderMatrix();

    expect(html).toContain('data-testid="category-matrix-mobile-inspector"');
    // Desktop scrolling table must still be present — the inspector does not
    // REPLACE the table in markup, it sits beside it and CSS hides whichever
    // tree is inappropriate for the current viewport.
    expect(html).toContain("category-matrix-view-scroll");
  });

  it("lists every visible alternative inside the inspector subtree so users can pick a primary product", async () => {
    // The inspector's primary-product selector must list all visible
    // alternatives — otherwise a user can't switch which product they're
    // inspecting. We deliberately do not assert on a specific control type
    // (<select>, <button>, segmented) — only that both names appear within
    // the inspector subtree.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(inspector, "inspector subtree must be present").not.toBe("");
    expect(inspector).toContain("Zeta Chat");
    expect(inspector).toContain("Alpha Chat");
  });

  it("renders a localized compare-with affordance with a 'no comparison' default option", async () => {
    // Acceptance criterion: "Users can compare two products where practical."
    // The compare-with control must render in the inspector subtree, default
    // to "no comparison" so a single-product inspector is the entry state,
    // and use localized copy (not raw i18n keys).
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(inspector).toContain("Compare with");
    expect(inspector).toContain("No comparison");
    // Regression guard: localized strings must be resolved, not the i18n key.
    expect(inspector).not.toContain("matrixView.inspector.compareLabel");
    expect(inspector).not.toContain("matrixView.inspector.noSecondary");
  });

  it("honors visibleAlternativeIds so filtered-out products do not appear in the inspector", async () => {
    // The inspector must share the Browse filter context — if the user
    // filtered out Zeta in Browse, it must not be selectable in the
    // inspector either. Same contract as the desktop table (see
    // `tests/category-matrix-browse-view.test.ts` — "limits matrix rows to
    // the alternatives visible after browse filters").
    const html = await renderMatrix({
      visibleAlternativeIds: new Set(["alpha-chat"]),
    });
    const inspector = inspectorSubtree(html);

    expect(inspector).toContain("Alpha Chat");
    expect(inspector).not.toContain("Zeta Chat");
  });

  it("restricts the per-criterion cell strip to the focused primary alternative by default", async () => {
    // The inspector is a *focused* comparison surface — not a transposed
    // wide grid. With the fixture's two visible alternatives, the default
    // primary is the first (Zeta Chat) and the secondary is empty, so each
    // per-criterion strip must contain exactly one cell (the primary), not
    // one per visible alternative. If the selectors are dead UI and the
    // strip iterates `alternatives.map(...)` unconditionally, this guard
    // trips: the fixture has 4 criteria, so 2 alternatives would yield 8
    // cell divs while a properly focused render yields 4.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(inspector, "inspector subtree must be present").not.toBe("");

    const cellCount = (
      inspector.match(/class="category-matrix-mobile-inspector-cell"/gu) ?? []
    ).length;
    // 4 criteria in the fixture × 1 focused alternative (primary only,
    // secondary is the "No comparison" default) = 4 cells.
    expect(
      cellCount,
      "with primary-only focus, the cell strip must render one cell per criterion, not one per alternative",
    ).toBe(4);

    // Inside the cell strip the alternative-label must always be the
    // primary (Zeta Chat). The compare-with select still lists Alpha Chat
    // as an <option>, so we anchor on the cell-strip label class to
    // disambiguate cell content from selector options.
    const labelMatches = Array.from(
      inspector.matchAll(
        /class="category-matrix-mobile-inspector-alternative-label"[^>]*>([^<]+)</gu,
      ),
    ).map((match) => match[1]);

    expect(
      labelMatches.length,
      "expected an alternative-label inside every focused cell",
    ).toBe(4);
    for (const label of labelMatches) {
      expect(label).toBe("Zeta Chat");
    }
  });

  it("marks the primary alternative as selected via a controlled-select value", async () => {
    // The primary <select> must be a controlled component so onChange-driven
    // state actually drives the rendered cell strip. React renders a
    // controlled <select value="x"> by emitting `selected=""` on the
    // matching option in SSR — observable here. Without `value`/`onChange`
    // the inspector regresses to inert selectors and the focused-comparison
    // contract collapses.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(inspector, "inspector subtree must be present").not.toBe("");

    // The primary's default value is the first visible alternative
    // (zeta-chat). The controlled-select SSR contract puts `selected` on
    // the matching <option>, regardless of attribute order.
    const zetaOption = inspector.match(
      /<option[^>]*value="zeta-chat"[^>]*>[^<]*<\/option>/u,
    );
    expect(
      zetaOption,
      'expected an <option value="zeta-chat"> inside the inspector',
    ).not.toBeNull();
    expect(zetaOption?.[0]).toContain("selected");
  });

  it("collapses the focused strip to one cell per criterion when secondary equals primary", async () => {
    // Regression guard for the duplicate-key / duplicated-cell bug: a user
    // picks secondary=Zeta, then changes primary to Zeta. Both ids resolve
    // to "zeta-chat" and the cell strip would emit two <div key="zeta-chat">
    // per criterion, tripping React's duplicate-key warning and visually
    // doubling the column. The derivation must guard against this by
    // requiring `secondarySelection !== primaryId` before honoring secondary.
    //
    // SSR cannot seed `useState`, so we exercise the derivation directly.
    // The structural invariant — no two cells inside a single cell strip
    // share a data-alternative-id — is asserted on the default render as a
    // companion guard.
    const module = (await import("../src/components/CategoryMatrixView")) as {
      deriveFocusedAlternativeIds: (
        primarySelection: string,
        secondarySelection: string,
        alternatives: ReadonlyArray<{ id: string }>,
      ) => { primaryId: string; secondaryId: string };
    };

    const alternatives = [{ id: "alpha-chat" }, { id: "zeta-chat" }];

    // The exact bug shape: user-picked secondary equals user-picked primary.
    const collidingDerivation = module.deriveFocusedAlternativeIds(
      "zeta-chat",
      "zeta-chat",
      alternatives,
    );
    expect(collidingDerivation.primaryId).toBe("zeta-chat");
    expect(
      collidingDerivation.secondaryId,
      "secondary must resolve to empty when it equals the resolved primary",
    ).toBe("");

    // Adjacent positive case: distinct selections must both survive so the
    // guard above does not over-trigger.
    const distinctDerivation = module.deriveFocusedAlternativeIds(
      "zeta-chat",
      "alpha-chat",
      alternatives,
    );
    expect(distinctDerivation.primaryId).toBe("zeta-chat");
    expect(distinctDerivation.secondaryId).toBe("alpha-chat");

    // Edge case: secondarySelection points at a primary that fell back to
    // alternatives[0] because primarySelection was empty. The guard must
    // still strip the secondary so the rendered strip can't duplicate the
    // first visible alternative.
    const fallbackPrimaryDerivation = module.deriveFocusedAlternativeIds(
      "",
      "alpha-chat",
      alternatives,
    );
    expect(fallbackPrimaryDerivation.primaryId).toBe("alpha-chat");
    expect(
      fallbackPrimaryDerivation.secondaryId,
      "secondary must collapse to empty when it matches the fallback primary",
    ).toBe("");

    // Structural invariant on the rendered DOM: each cell strip block must
    // not contain two cells sharing the same alternative id, regardless of
    // which interaction reached that state. Pins the bug shape at the markup
    // level so future renderers can't reintroduce the duplicate key.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);
    const cellBlocks = Array.from(
      inspector.matchAll(
        /<div[^>]*class="category-matrix-mobile-inspector-cells"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gu,
      ),
    ).map((match) => match[1]);

    expect(
      cellBlocks.length,
      "expected at least one .category-matrix-mobile-inspector-cells block",
    ).toBeGreaterThan(0);

    for (const block of cellBlocks) {
      const ids = Array.from(
        block.matchAll(/data-alternative-id="([^"]+)"/gu),
      ).map((match) => match[1]);
      const seen = new Set<string>();
      const duplicates = ids.filter((id) => {
        if (seen.has(id)) {
          return true;
        }
        seen.add(id);
        return false;
      });
      expect(
        duplicates,
        `cell strip must not duplicate an alternative id, found duplicates: ${duplicates.join(", ")}`,
      ).toEqual([]);
    }
  });

  it("strips a stale secondary that no longer points at a visible alternative", async () => {
    // Companion guard to the secondary-equals-primary collision test. The
    // realistic trigger is the Browse filter narrowing the visible set after
    // the user picked a secondary: the secondary id stays in the
    // inspector's local state but no longer matches any alternative, so the
    // derivation must drop it. Without the `alternatives.some(...)` check
    // in `deriveFocusedAlternativeIds`, the rendered cell strip would later
    // call `alternatives.find(...)` on the stale id, get `undefined`, and
    // then the `.filter(Boolean)` would silently swallow it — but the
    // intermediate `secondaryId` returned by the helper would still be the
    // stale id, breaking any consumer (telemetry, popover ids) that trusts
    // the helper's contract.
    const module = (await import("../src/components/CategoryMatrixView")) as {
      deriveFocusedAlternativeIds: (
        primarySelection: string,
        secondarySelection: string,
        alternatives: ReadonlyArray<{ id: string }>,
      ) => { primaryId: string; secondaryId: string };
    };

    const alternatives = [{ id: "alpha-chat" }, { id: "zeta-chat" }];
    const staleSecondary = module.deriveFocusedAlternativeIds(
      "alpha-chat",
      "ghost-chat",
      alternatives,
    );

    expect(staleSecondary.primaryId).toBe("alpha-chat");
    expect(
      staleSecondary.secondaryId,
      "secondary must collapse to empty when its id is not present in alternatives",
    ).toBe("");
  });

  it("returns empty ids when no alternatives are available", async () => {
    // Edge case: every alternative is filtered out (e.g., a Browse filter
    // matched nothing). The helper must degrade gracefully — `primaryId`
    // falls back to `alternatives[0]?.id ?? ""` and `secondaryId` collapses
    // because `alternatives.some(...)` returns false for both checks.
    // Without this guard, `alternatives[0].id` would throw and the whole
    // matrix subtree would crash on Browse filter edge cases.
    const module = (await import("../src/components/CategoryMatrixView")) as {
      deriveFocusedAlternativeIds: (
        primarySelection: string,
        secondarySelection: string,
        alternatives: ReadonlyArray<{ id: string }>,
      ) => { primaryId: string; secondaryId: string };
    };

    const empty = module.deriveFocusedAlternativeIds(
      "anything",
      "something-else",
      [],
    );

    expect(empty.primaryId).toBe("");
    expect(empty.secondaryId).toBe("");
  });

  it("excludes the current primary alternative from the compare-with select options", async () => {
    // The compare-with select must not list the current primary so a user
    // cannot pick the same product on both sides — that would render the
    // focused comparison meaningless (two identical columns). The
    // implementation enforces this with a `.filter((alt) => alt.id !==
    // primaryId)` on the secondary options. Without that guard the
    // secondary select would include Zeta as an option even though Zeta is
    // already the primary, and "compare against a different product"
    // collapses into "compare against itself".
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(inspector, "inspector subtree must be present").not.toBe("");

    // Slice the secondary select specifically: it's the second <select> in
    // the inspector and carries the "Compare with" aria-label. Anchoring on
    // the aria-label keeps the assertion stable if the control order ever
    // changes.
    const secondarySelectMatch = inspector.match(
      /<select[^>]*aria-label="Compare with"[^>]*>[\s\S]*?<\/select>/u,
    );
    expect(
      secondarySelectMatch,
      'expected a compare-with <select aria-label="Compare with"> in the inspector',
    ).not.toBeNull();

    const secondarySelect = secondarySelectMatch?.[0] ?? "";
    // The primary defaults to zeta-chat, so the secondary must NOT offer
    // zeta-chat as an option — but Alpha must still be selectable.
    expect(
      secondarySelect,
      "secondary select must exclude the current primary (zeta-chat)",
    ).not.toMatch(/<option[^>]*value="zeta-chat"/u);
    expect(
      secondarySelect,
      "secondary select must still offer the other visible alternative (alpha-chat)",
    ).toMatch(/<option[^>]*value="alpha-chat"/u);
  });

  it("marks the no-comparison option as the selected default on the compare-with select", async () => {
    // Symmetric to the primary controlled-select test: the secondary
    // <select> must also be controlled (value="" + onChange) so users can
    // actually toggle a comparison on. React renders a controlled
    // <select value=""> by emitting `selected=""` on the matching empty
    // option in SSR. Without the controlled binding the secondary regresses
    // to an uncontrolled select, the focused-comparison toggle becomes
    // dead UI, and "compare two products where practical" silently breaks.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(inspector, "inspector subtree must be present").not.toBe("");

    const secondarySelectMatch = inspector.match(
      /<select[^>]*aria-label="Compare with"[^>]*>[\s\S]*?<\/select>/u,
    );
    expect(
      secondarySelectMatch,
      "expected a compare-with <select> in the inspector",
    ).not.toBeNull();

    const secondarySelect = secondarySelectMatch?.[0] ?? "";
    // The empty-value "no comparison" option must be present AND marked
    // selected. A controlled <select value=""> emits `selected=""` on the
    // <option value=""> in SSR.
    const noComparisonOption = secondarySelect.match(
      /<option[^>]*value=""[^>]*>[^<]*<\/option>/u,
    );
    expect(
      noComparisonOption,
      'expected an <option value=""> inside the compare-with select',
    ).not.toBeNull();
    expect(
      noComparisonOption?.[0],
      "the no-comparison option must be marked selected by the controlled value",
    ).toContain("selected");
    expect(
      noComparisonOption?.[0],
      "the no-comparison option must surface the localized label",
    ).toContain("No comparison");
  });

  it("renders each group label as a heading inside the inspector subtree", async () => {
    // Acceptance criterion: "Keep product identity, criterion group, fact
    // status, and source affordance clear." Without surfacing the group
    // label, the inspector collapses into an undifferentiated criterion
    // list and loses the grouping that the desktop colgroup headers
    // already provide.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(
      inspector,
      "inspector subtree must be present before group labels can be vetted",
    ).not.toBe("");
    // The fixture's single group is "Privacy"; it must appear as an h3
    // inside the inspector. We anchor on the heading + label class so a
    // later refactor that drops the heading (and only keeps an
    // aria-labelled section) trips the guard.
    expect(inspector).toMatch(
      /<h3[^>]*category-matrix-mobile-inspector-group-label[^>]*>[\s\S]{0,50}?Privacy[\s\S]{0,50}?<\/h3>/u,
    );
  });

  it("renders every group as its own heading when the category has multiple groups", async () => {
    // The single-group fixture above only exercises one iteration of
    // `groups.map(...)`. A regression that collapsed groups (e.g., dropped
    // the outer loop after refactoring to a flat criterion list) would
    // still pass that test because the first group survives. This guard
    // builds a two-group matrix and asserts that BOTH labels render as
    // h3 headings — the structural contract the desktop colgroup headers
    // satisfy must hold on mobile too.
    const multiGroupMatrix: CategoryMatrixApiResponse = {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: null,
          emoji: "chat",
        },
        groups: [
          {
            id: "privacy",
            label: "Privacy",
            description: null,
            criteria: [criterion("e2ee", "must_match", { label: "E2EE" })],
          },
          {
            id: "ops",
            label: "Operations",
            description: null,
            criteria: [
              criterion("self_host", "must_match", { label: "Self-host" }),
            ],
          },
        ],
        alternatives: [
          matrixAlternative("alpha-chat", "Alpha Chat", {
            e2ee: { status: "verified", value: true },
            self_host: { status: "verified", value: false },
          }),
        ],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 2,
        criterionCount: 2,
        alternativeCount: 1,
      },
    };

    const module = (await import("../src/components/CategoryMatrixView")) as {
      default: (props: { matrix: CategoryMatrixApiResponse }) => unknown;
    };
    const html = renderToStaticMarkup(
      createElement(module.default as never, { matrix: multiGroupMatrix }),
    );
    const inspector = inspectorSubtree(html);

    expect(inspector, "inspector subtree must be present").not.toBe("");
    // Both group labels must surface as inspector-scoped headings.
    expect(inspector).toMatch(
      /<h3[^>]*category-matrix-mobile-inspector-group-label[^>]*>[\s\S]{0,50}?Privacy[\s\S]{0,50}?<\/h3>/u,
    );
    expect(inspector).toMatch(
      /<h3[^>]*category-matrix-mobile-inspector-group-label[^>]*>[\s\S]{0,50}?Operations[\s\S]{0,50}?<\/h3>/u,
    );
  });
});

describe("mobile matrix inspector — popover id uniqueness", () => {
  it("scopes inspector popover ids so they do not collide with the desktop table", async () => {
    // Both trees ship in the same SSR pass for the responsive CSS swap.
    // Without a scope suffix, `category-matrix-cell-popover-${alt}-${crit}`
    // would be emitted twice for the same fact (once in the table, once
    // in the inspector), producing duplicate element ids — invalid HTML
    // and ambiguous aria-controls resolution. The desktop wiring test
    // (`matrix cell popover wiring`) still passes against duplicates
    // because each id resolves to *an* element, so this contract needs
    // its own guard.
    const html = await renderMatrix();

    const popoverIds = Array.from(
      html.matchAll(
        /<[^>]*data-testid="category-matrix-cell-popover"[^>]*\sid="([^"]+)"[^>]*>/gu,
      ),
    ).map((match) => match[1]);
    const idsFromIdFirst = Array.from(
      html.matchAll(
        /<[^>]*\sid="([^"]+)"[^>]*data-testid="category-matrix-cell-popover"[^>]*>/gu,
      ),
    ).map((match) => match[1]);
    const allIds = [...popoverIds, ...idsFromIdFirst];

    expect(
      allIds.length,
      "expected at least one popover container with an id",
    ).toBeGreaterThan(0);

    const duplicates = allIds.filter(
      (id, index) => allIds.indexOf(id) !== index,
    );
    expect(
      duplicates,
      `popover ids must be unique across the dual SSR trees, found duplicates: ${duplicates.join(", ")}`,
    ).toEqual([]);
  });

  it("emits mobile-scoped popover ids inside the inspector subtree", async () => {
    // Regression guard for the `idScope="mobile"` suffix specifically.
    // The inspector subtree must contain at least one popover id ending
    // in `-mobile`; if the implementation drops the suffix, the dual-tree
    // ids collapse back into a collision.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(
      inspector,
      "inspector subtree must be present before mobile ids can be vetted",
    ).not.toBe("");
    expect(inspector).toMatch(
      /id="category-matrix-cell-popover-[^"]+-mobile"/u,
    );
  });

  it("wires inspector trigger aria-controls to its mobile-scoped popover id", async () => {
    // ARIA contract: the trigger's aria-controls must resolve to an
    // element id actually present in the same subtree. If the inspector
    // trigger points at the desktop popover's id (no -mobile suffix), a
    // screen reader following aria-controls would jump out of the
    // inspector entirely.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(
      inspector,
      "inspector subtree must be present before aria-controls can be vetted",
    ).not.toBe("");

    const triggerControls = Array.from(
      inspector.matchAll(/<button[^>]*aria-controls="([^"]+)"[^>]*>/gu),
    ).map((match) => match[1]);

    expect(
      triggerControls.length,
      "expected at least one inspector trigger button with aria-controls",
    ).toBeGreaterThan(0);

    for (const controlledId of triggerControls) {
      expect(
        controlledId.endsWith("-mobile"),
        `inspector aria-controls="${controlledId}" must end with -mobile to avoid colliding with the desktop popover`,
      ).toBe(true);
      expect(
        inspector.includes(`id="${controlledId}"`),
        `inspector aria-controls="${controlledId}" must resolve to an element id in the same subtree`,
      ).toBe(true);
    }
  });
});

describe("mobile matrix inspector — color-independence chips", () => {
  it("reuses the same tone classes as the desktop matrix for verified facts", async () => {
    // Acceptance criterion: "Green/yellow/red/neutral states remain easy to
    // spot." The inspector must reuse `category-matrix-fact--*` and
    // `category-matrix-option--*` so the color-independence contract from
    // the desktop popover tests automatically applies (icons + tone classes).
    // The inspector is focused on the primary alternative, so we exercise
    // both products by toggling visibleAlternativeIds (which seeds the
    // primary state) — Zeta surfaces the negative / warning tones, Alpha
    // surfaces the positive tones.
    const zetaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["zeta-chat"]) }),
    );
    const alphaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["alpha-chat"]) }),
    );

    // Alpha e2ee is verified=true → positive verdict chip.
    expect(alphaInspector).toMatch(/category-matrix-fact--positive/u);
    // Zeta e2ee is verified=false → negative verdict chip.
    expect(zetaInspector).toMatch(/category-matrix-fact--negative/u);
    // Alpha hosting_region resolves to the EU enum option (positive tone).
    expect(alphaInspector).toMatch(/category-matrix-option--positive/u);
    // Zeta hosting_region resolves to Global (warning tone).
    expect(zetaInspector).toMatch(/category-matrix-option--warning/u);
  });

  it("renders an inline SVG icon on every verdict chip inside the inspector", async () => {
    // Without an icon paired with the tone class, the chip degrades to
    // color-only — a WCAG 1.4.1 failure. The desktop popover tests pin this
    // for the table; the same contract applies to the inspector. Because
    // the inspector focuses on a single primary at a time, we render twice
    // so both verdict tones are exercised.
    const zetaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["zeta-chat"]) }),
    );
    const alphaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["alpha-chat"]) }),
    );

    expect(alphaInspector).toMatch(
      /category-matrix-fact--positive[\s\S]{0,500}?<svg/u,
    );
    expect(zetaInspector).toMatch(
      /category-matrix-fact--negative[\s\S]{0,500}?<svg/u,
    );
  });
});

describe("mobile matrix inspector — source safety and audit suppression", () => {
  it("renders verified source links inside the inspector with target=_blank and a safe rel", async () => {
    // Compact source detail is required by AC ("Source detail behavior
    // remains available but compact"). When the inspector surfaces a source
    // link, it must follow the same cross-window-safety contract as the
    // desktop popover — target="_blank" AND rel="noopener noreferrer".
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    const sourceLink = inspector.match(
      /<a[^>]*href="https:\/\/zeta-chat\.example\/encryption-report"[^>]*>/u,
    );

    expect(
      sourceLink,
      "inspector must surface the verified Zeta encryption-report source",
    ).not.toBeNull();
    expect(sourceLink?.[0]).toContain('target="_blank"');
    expect(sourceLink?.[0]).toContain('rel="noopener noreferrer"');
  });

  it("suppresses unsafe javascript: source URLs and their titles inside the inspector", async () => {
    // Defence-in-depth: every URL surfaced by the inspector must route
    // through sanitizeHref. A rejected scheme must not become a clickable
    // <a href>, and its associated title / accessedDate must not leak as
    // visible text either (they belong to the rejected source). The unsafe
    // URL lives on Alpha's hosting_region, so we render with Alpha as the
    // sole visible alternative — that promotes it to primary in the
    // focused inspector and forces the contract to be exercised, not just
    // skipped because Zeta happened to be primary.
    const html = await renderMatrix({
      visibleAlternativeIds: new Set(["alpha-chat"]),
    });
    const inspector = inspectorSubtree(html);

    expect(
      inspector,
      "inspector subtree must exist before its content can be vetted",
    ).not.toBe("");
    // Sanity: Alpha's verified Hosting region row IS rendered so the
    // negative assertion below is meaningful and not vacuous.
    expect(inspector).toContain("Hosting region");
    expect(inspector).not.toContain('href="javascript:alert(99)"');
    expect(inspector).not.toContain("Unsafe Alpha hosting source");
    expect(inspector).not.toContain("Accessed 2026-05-23");
  });

  it("omits source-link anchors for unverified and not_applicable inspector cells", async () => {
    // The desktop popover already pins this contract; the inspector must
    // mirror it. A cell whose status is unverified or not_applicable has
    // no public claim and therefore no citation — the URL must be dropped
    // even though the inspector still surfaces the criterion label.
    // Zeta's export_formats is unverified, Alpha's is not_applicable, so
    // we render with each as the sole visible alternative to actually
    // exercise both branches under the focused-primary contract.
    const zetaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["zeta-chat"]) }),
    );
    const alphaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["alpha-chat"]) }),
    );

    // Criterion labels stay visible in both renders.
    expect(zetaInspector).toContain("Data export formats");
    expect(alphaInspector).toContain("Data export formats");

    // Zeta's unverified export-formats source must be suppressed.
    expect(zetaInspector).not.toContain(
      'href="https://zeta-chat.example/export-formats"',
    );
    expect(zetaInspector).not.toContain("Zeta export format source");

    // Alpha's not_applicable export-na source must be suppressed.
    expect(alphaInspector).not.toContain(
      'href="https://alpha-chat.example/export-na"',
    );
    expect(alphaInspector).not.toContain("Alpha export NA source");
  });

  it("never leaks internal audit / verifier text inside the inspector subtree", async () => {
    // The mobile inspector reuses the same fact data as the desktop table.
    // The desktop test for this lives in
    // `category-matrix-legend-and-popover.test.ts` — we duplicate the
    // assertion here, scoped to the inspector subtree, so a future change
    // that surfaces `auditQuote` / `raw_response` only in the inspector
    // (and not in the table) still trips a guard. Render once per primary
    // so both alternatives' internal text is checked under the focused
    // contract.
    const zetaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["zeta-chat"]) }),
    );
    const alphaInspector = inspectorSubtree(
      await renderMatrix({ visibleAlternativeIds: new Set(["alpha-chat"]) }),
    );

    expect(
      zetaInspector,
      "zeta-focused inspector subtree must exist before its content can be vetted",
    ).not.toBe("");
    expect(
      alphaInspector,
      "alpha-focused inspector subtree must exist before its content can be vetted",
    ).not.toBe("");

    const forbidden = [
      "Internal verification quote for Zeta encryption must stay private.",
      "Never show verifier raw response for Zeta.",
      "Internal unverified export quote must not become public.",
      "Internal not-applicable export quote must not become public.",
      "auditQuote",
      "raw_response",
    ];

    for (const phrase of forbidden) {
      expect(
        zetaInspector,
        `zeta-focused inspector subtree must not contain "${phrase}"`,
      ).not.toContain(phrase);
      expect(
        alphaInspector,
        `alpha-focused inspector subtree must not contain "${phrase}"`,
      ).not.toContain(phrase);
    }
  });
});

describe("mobile matrix inspector — accessibility", () => {
  it("renders a localized close affordance for the compact source surface", async () => {
    // Acceptance criterion: "keyboard/touch accessibility are respected" +
    // "Source detail behavior remains available but compact". The compact
    // source surface (bottom sheet or inline expander, implementation's
    // choice) must contain a focusable <button> with the localized close
    // label so keyboard users can dismiss it without trapping focus.
    const html = await renderMatrix();
    const inspector = inspectorSubtree(html);

    expect(inspector).toMatch(
      /<button[^>]*>[\s\S]{0,200}?Close[\s\S]{0,200}?<\/button>/u,
    );
  });

  it("does not emit morph animation hooks inside the inspector when reducedMotion is true", async () => {
    // The existing matrix already passes `reducedMotion` through and omits
    // `data-morph-id` on the alternative-label cells when reduced (see
    // CategoryMatrixView.tsx). The inspector must follow the same pattern
    // — any animation-participation hooks (`data-morph`, inline
    // `animation-delay` styles, `--cell-row` / `--cell-col` custom
    // properties used by the morph CSS) must be absent inside the
    // inspector subtree when reducedMotion is requested.
    const html = await renderMatrix({ reducedMotion: true });
    const inspector = inspectorSubtree(html);

    expect(
      inspector,
      "inspector subtree must be present even with reducedMotion=true",
    ).not.toBe("");
    expect(inspector).not.toMatch(/data-morph-id=/u);
    expect(inspector).not.toMatch(/animation-delay/u);
    expect(inspector).not.toMatch(/--cell-row/u);
    expect(inspector).not.toMatch(/--cell-col/u);
  });
});

describe("mobile matrix inspector — responsive CSS contract", () => {
  it("includes a phone-width media query that swaps the desktop table for the mobile inspector", () => {
    // Acceptance criterion: "Responsive tests or screenshots cover the
    // mobile Matrix state." Without a Playwright pipeline in this repo, we
    // assert the responsive swap at the CSS-source level — the rendered
    // dual-tree alone is not enough, the breakpoint must actually drive
    // the visibility swap.
    const cssPath = path.resolve(__dirname, "..", "src", "index.css");
    const css = readFileSync(cssPath, "utf8");

    // A phone-width media query must exist and must contain a rule
    // touching both the desktop scroll container and the mobile inspector
    // wrapper. We do not pin the exact display values (none/block/flex/
    // grid) so the implementation can pick whichever fits its layout.
    const phoneBlockPattern =
      /@media\s*\(max-width:\s*767px\)\s*\{[\s\S]*?category-matrix-view-scroll[\s\S]*?category-matrix-mobile-inspector[\s\S]*?\}/u;
    const phoneBlockPatternAlt =
      /@media\s*\(max-width:\s*767px\)\s*\{[\s\S]*?category-matrix-mobile-inspector[\s\S]*?category-matrix-view-scroll[\s\S]*?\}/u;

    expect(
      phoneBlockPattern.test(css) || phoneBlockPatternAlt.test(css),
      "src/index.css must contain a @media (max-width: 767px) block that " +
        "references both .category-matrix-view-scroll and " +
        ".category-matrix-mobile-inspector so the responsive swap is wired",
    ).toBe(true);
  });
});

describe("mobile matrix inspector — i18n parity", () => {
  it("defines the inspector copy in both browse locales", () => {
    // New user-facing strings must land in both locales; a half-translated
    // ship would fall back to raw keys in DE which is the failure mode the
    // existing browse i18n tests guard against.
    const enInspector = (browseEn.matrixView as Record<string, unknown>)
      .inspector as Record<string, string> | undefined;
    const deInspector = (browseDe.matrixView as Record<string, unknown>)
      .inspector as Record<string, string> | undefined;

    expect(
      enInspector,
      "EN browse.matrixView.inspector block must exist",
    ).toBeDefined();
    expect(
      deInspector,
      "DE browse.matrixView.inspector block must exist",
    ).toBeDefined();

    const requiredKeys = [
      "primaryLabel",
      "compareLabel",
      "noSecondary",
    ] as const;

    for (const key of requiredKeys) {
      expect(
        enInspector?.[key],
        `EN browse.matrixView.inspector.${key} must be defined`,
      ).toBeTruthy();
      expect(
        deInspector?.[key],
        `DE browse.matrixView.inspector.${key} must be defined`,
      ).toBeTruthy();
    }
  });
});
