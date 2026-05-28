import { readFileSync } from "node:fs";
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
        auditQuote:
          "Internal unverified export quote must not become public.",
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

async function renderMatrix(): Promise<string> {
  const module = (await import("../src/components/CategoryMatrixView")) as {
    default: (props: { matrix: CategoryMatrixApiResponse }) => unknown;
  };
  return renderToStaticMarkup(
    createElement(module.default as never, { matrix: fixture() }),
  );
}

// Returns true if at least one popover container exists in the rendered
// markup. Detection is structural — we look for the data-testid that the
// implementation is required to expose on each popover surface.
function hasPopoverContainer(html: string): boolean {
  return /data-testid="category-matrix-cell-popover"/u.test(html);
}

// Returns a list of fixed-window slices (1500 chars) starting at each
// popover container's data-testid attribute. The window is generous enough
// to cover the popover's product/criterion/value/source block without
// trying to balance nested tags by regex.
function popoverWindows(html: string): string[] {
  const windows: string[] = [];
  const marker = 'data-testid="category-matrix-cell-popover"';
  let index = html.indexOf(marker);
  while (index !== -1) {
    windows.push(html.slice(index, index + 1500));
    index = html.indexOf(marker, index + marker.length);
  }
  return windows;
}

describe("matrix legend block", () => {
  it("renders a legend section listing each tone with both a label and an icon", async () => {
    const html = await renderMatrix();

    expect(html).toContain("category-matrix-legend");

    // Six legend entries: positive, warning, negative, neutral,
    // unverified, not-applicable. Each entry must carry a localized label
    // (color-independence: WCAG 1.4.1).
    expect(html).toContain("Positive / supported");
    expect(html).toContain("Caution");
    expect(html).toContain("Negative / not supported");
    expect(html).toContain("Neutral / informational");
    expect(html).toMatch(/category-matrix-legend[\s\S]*?Unverified/u);
    expect(html).toMatch(/category-matrix-legend[\s\S]*?Not applicable/u);

    // Each positive/negative legend item carries an inline SVG icon so users
    // can map the table icon back to its meaning without reading color.
    expect(html).toMatch(
      /category-matrix-legend-item[\s\S]{0,800}?--positive[\s\S]{0,500}?<svg/u,
    );
    expect(html).toMatch(
      /category-matrix-legend-item[\s\S]{0,800}?--negative[\s\S]{0,500}?<svg/u,
    );
  });

  it("pairs every legend entry with an inline SVG icon so the legend itself is not color-only", async () => {
    const html = await renderMatrix();

    // The legend is the color->meaning map. If its own warning / neutral /
    // unverified / not-applicable rows are not paired with an icon, the map
    // collapses back to "match this color against the cell" — which is
    // exactly what WCAG 1.4.1 prohibits and what the legend is meant to fix.
    const tones = [
      "positive",
      "warning",
      "negative",
      "neutral",
      "unverified",
      "not-applicable",
    ] as const;

    for (const tone of tones) {
      const itemPattern = new RegExp(
        `category-matrix-legend-item[\\s\\S]{0,800}?--${tone}[\\s\\S]{0,800}?<svg`,
        "u",
      );
      expect(
        html,
        `legend item for tone "${tone}" must contain an inline SVG icon`,
      ).toMatch(itemPattern);
    }
  });

  it("pins legend i18n copy in both browse locales", () => {
    const enLegend = (browseEn.matrixView as Record<string, unknown>).legend as
      | Record<string, string>
      | undefined;
    const deLegend = (browseDe.matrixView as Record<string, unknown>).legend as
      | Record<string, string>
      | undefined;

    expect(enLegend).toBeDefined();
    expect(deLegend).toBeDefined();

    const requiredKeys = [
      "positive",
      "warning",
      "negative",
      "neutral",
      "unverified",
      "notApplicable",
    ] as const;

    for (const key of requiredKeys) {
      expect(
        enLegend?.[key],
        `EN browse.matrixView.legend.${key} must be defined`,
      ).toBeTruthy();
      expect(
        deLegend?.[key],
        `DE browse.matrixView.legend.${key} must be defined`,
      ).toBeTruthy();
    }
  });
});

describe("matrix cell detail popover", () => {
  it("renders every verified value cell as a focusable button with dialog popover semantics", async () => {
    const html = await renderMatrix();

    // The cell trigger must be a real <button> so Tab + Enter / Space work,
    // and it must declare popover semantics so screen readers announce it.
    expect(html).toMatch(
      /<button[^>]*type="button"[^>]*aria-haspopup="dialog"[^>]*aria-expanded="false"/u,
    );

    // The accessible name on at least one trigger must combine product +
    // criterion so the user knows which intersection the details refer to.
    expect(html).toMatch(
      /<button[^>]*aria-label="[^"]*Zeta Chat[^"]*End-to-end encryption[^"]*"/u,
    );
    expect(html).toMatch(
      /<button[^>]*aria-label="[^"]*Alpha Chat[^"]*Hosting region[^"]*"/u,
    );
  });

  it("statically renders a popover container per cell carrying product, criterion, value, and safe source data", async () => {
    const html = await renderMatrix();

    expect(
      hasPopoverContainer(html),
      "at least one popover container must be in the DOM",
    ).toBe(true);

    const windows = popoverWindows(html);
    const merged = windows.join("\n");

    // The popover for the verified Zeta e2ee cell must expose the public
    // source link, accessed date, product name, and criterion label.
    expect(merged).toContain("Zeta Chat");
    expect(merged).toContain("End-to-end encryption");
    expect(merged).toContain(
      'href="https://zeta-chat.example/encryption-report"',
    );
    expect(merged).toContain("Zeta encryption report");
    expect(merged).toContain("Accessed 2026-05-24");
  });

  it("never renders an unsafe javascript: source URL as a clickable link anywhere in the matrix", async () => {
    const html = await renderMatrix();

    // Defence-in-depth: every URL must route through sanitizeHref. If the
    // scheme is rejected, no <a href> may be emitted — neither inside a
    // popover nor anywhere else in the rendered matrix.
    expect(html).not.toContain('href="javascript:alert(99)"');
    expect(html).not.toContain("Unsafe Alpha hosting source");
    expect(html).not.toContain("Accessed 2026-05-23");
  });

  it("omits source-link affordances for unverified and not_applicable cells", async () => {
    const html = await renderMatrix();

    // Source <a> tags must never be emitted for cells whose status is
    // unverified or not_applicable — these statuses carry no public claim
    // that can be backed by a citation.
    expect(html).not.toContain(
      'href="https://zeta-chat.example/export-formats"',
    );
    expect(html).not.toContain("Zeta export format source");
    expect(html).not.toContain('href="https://alpha-chat.example/export-na"');
    expect(html).not.toContain("Alpha export NA source");
  });

  it("never leaks internal audit / verifier text anywhere in the rendered matrix", async () => {
    const html = await renderMatrix();

    const forbidden = [
      "Internal verification quote for Zeta encryption must stay private.",
      "Never show verifier raw response for Zeta.",
      "Internal unverified export quote must not become public.",
      "Internal not-applicable export quote must not become public.",
      "auditQuote",
      "raw_response",
    ];

    for (const phrase of forbidden) {
      expect(html, `rendered HTML must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("pins popover i18n copy in both browse locales", () => {
    const enPopover = (browseEn.matrixView as Record<string, unknown>)
      .popover as Record<string, string> | undefined;
    const dePopover = (browseDe.matrixView as Record<string, unknown>)
      .popover as Record<string, string> | undefined;

    expect(enPopover).toBeDefined();
    expect(dePopover).toBeDefined();

    const requiredKeys = ["openLabel", "close"] as const;

    for (const key of requiredKeys) {
      expect(
        enPopover?.[key],
        `EN browse.matrixView.popover.${key} must be defined`,
      ).toBeTruthy();
      expect(
        dePopover?.[key],
        `DE browse.matrixView.popover.${key} must be defined`,
      ).toBeTruthy();
    }
  });
});

describe("matrix cell color-independence", () => {
  it("pairs every enum chip with a non-color affordance (icon or accessible label)", async () => {
    const html = await renderMatrix();

    // EU hosted (positive) and Global (warning) are both enum chips.
    // Each chip must carry either an inline icon or a textual aria-label
    // describing the tone — colour alone is not allowed (WCAG 1.4.1).
    const positiveChip = html.match(
      /<[^>]*category-matrix-option--positive[\s\S]{0,500}?<\/(span|button|div|li)>/u,
    );
    const warningChip = html.match(
      /<[^>]*category-matrix-option--warning[\s\S]{0,500}?<\/(span|button|div|li)>/u,
    );

    expect(positiveChip, "expected a positive enum chip").not.toBeNull();
    expect(warningChip, "expected a warning enum chip").not.toBeNull();

    const hasNonColorAffordance = (chunk: string) =>
      /<svg/u.test(chunk) || /aria-label="[^"]+"/u.test(chunk);

    expect(
      hasNonColorAffordance(positiveChip?.[0] ?? ""),
      "positive enum chip must carry an icon or aria-label, not color alone",
    ).toBe(true);
    expect(
      hasNonColorAffordance(warningChip?.[0] ?? ""),
      "warning enum chip must carry an icon or aria-label, not color alone",
    ).toBe(true);
  });

  it("prefixes every option chip aria-label with its localized tone description", async () => {
    const html = await renderMatrix();

    // Color-independence regression guard: the aria-label of an enum chip
    // must NAME the tone semantics, not just repeat the option label.
    // Without this, a screen-reader user only hears "EU hosted" without
    // any signal that it is the positive/recommended option. The exact
    // format is `${toneLabel}: ${label}`.
    expect(html).toMatch(
      /<[^>]*category-matrix-option--positive[^>]*aria-label="Positive \/ supported: EU hosted"/u,
    );
    expect(html).toMatch(
      /<[^>]*category-matrix-option--warning[^>]*aria-label="Caution: Global"/u,
    );
  });
});

describe("matrix cell popover wiring", () => {
  it("styles the popover as an opaque high-contrast surface over the dense table", () => {
    const css = readFileSync(
      new URL("../src/index.css", import.meta.url),
      "utf8",
    );
    const rule = css.match(
      /\.category-matrix-cell-popover\s*\{[\s\S]*?\n\}/u,
    )?.[0];

    expect(rule, "expected the popover CSS rule to exist").toBeDefined();
    expect(rule).toMatch(/background(?:-color)?\s*:\s*#[0-9a-f]{6}/iu);
    expect(rule).toMatch(/opacity\s*:\s*1/u);
    expect(rule).toMatch(/box-shadow\s*:/u);
  });

  it("wires aria-controls on every trigger to a popover container whose id matches", async () => {
    const html = await renderMatrix();

    // ARIA contract: the cell trigger must point its aria-controls at the
    // popover surface it opens. A drifted id (e.g. trigger pointing at a
    // non-existent id, or popover missing its id) silently breaks screen
    // reader announcement even though the cell still "looks right".
    const triggerControls = Array.from(
      html.matchAll(/<button[^>]*aria-controls="([^"]+)"[^>]*>/gu),
    ).map((match) => match[1]);

    expect(
      triggerControls.length,
      "expected at least one trigger button with aria-controls",
    ).toBeGreaterThan(0);

    for (const controlledId of triggerControls) {
      // Each controlled id must point at a popover container actually in
      // the DOM. We assert by direct string presence to keep the test
      // resilient to attribute ordering.
      expect(
        html.includes(`id="${controlledId}"`),
        `aria-controls="${controlledId}" must resolve to an element id in the DOM`,
      ).toBe(true);
    }
  });

  it("declares role=dialog on every popover container so screen readers announce the surface", async () => {
    const html = await renderMatrix();

    // The trigger advertises aria-haspopup="dialog"; the popover container
    // itself must therefore carry role="dialog" so the announcement matches
    // the affordance.
    const popoverContainers = html.match(
      /<[^>]*data-testid="category-matrix-cell-popover"[^>]*>/gu,
    );

    expect(
      popoverContainers,
      "expected at least one popover container",
    ).not.toBeNull();

    for (const tag of popoverContainers ?? []) {
      expect(
        /role="dialog"/u.test(tag),
        `popover container must carry role="dialog" (got: ${tag})`,
      ).toBe(true);
    }
  });

  it("renders every popover container as initially hidden so cells do not all expand at once", async () => {
    const html = await renderMatrix();

    // Critical regression guard: if the implementation forgets the `hidden`
    // attribute (or renders the popover only when open), users either see
    // every cell's popover stacked on initial paint, or the static SSR
    // safety assertions stop being load-bearing. Either failure mode is
    // catastrophic, so we assert the closed-state contract directly.
    const popoverContainers = html.match(
      /<[^>]*data-testid="category-matrix-cell-popover"[^>]*>/gu,
    );

    expect(popoverContainers).not.toBeNull();
    expect(popoverContainers?.length ?? 0).toBeGreaterThan(0);

    for (const tag of popoverContainers ?? []) {
      // React serializes the boolean attribute as bare `hidden` or
      // `hidden=""`; accept either form.
      expect(
        /\shidden(?:=""|=|\s|>)/u.test(tag),
        `closed popover must carry the hidden attribute (got: ${tag})`,
      ).toBe(true);
    }

    // aria-expanded on every trigger must agree with the hidden popover.
    expect(html).not.toMatch(/aria-expanded="true"/u);
  });

  it("renders a close affordance inside every popover so keyboard users can dismiss it", async () => {
    const html = await renderMatrix();

    // Acceptance criterion: keyboard users must be able to open and close
    // cell details. The static contract requires a focusable <button> with
    // the localized close label inside the popover surface.
    const windows = popoverWindows(html);
    expect(windows.length, "expected at least one popover window").toBeGreaterThan(
      0,
    );

    for (const window of windows) {
      expect(
        /<button[^>]*>[\s\S]{0,200}?Close[\s\S]{0,200}?<\/button>/u.test(window),
        "each popover must contain a Close <button> for keyboard dismissal",
      ).toBe(true);
    }
  });

  it("wraps unverified and not_applicable cells in the same trigger + popover scaffold (without source affordances)", async () => {
    const html = await renderMatrix();

    // Even though unverified / not_applicable cells must not show a source
    // link, the keyboard contract still applies — users must be able to
    // open a detail surface that names the product + criterion, so they
    // know exactly which intersection is unverified.
    expect(html).toMatch(
      /<button[^>]*aria-label="[^"]*Zeta Chat[^"]*Data export formats[^"]*"/u,
    );

    // The popover surface for these statuses must still be in the DOM and
    // must still carry the product + criterion identification, just without
    // any source <a> tag for the suppressed URL.
    const windows = popoverWindows(html);
    const merged = windows.join("\n");

    expect(merged).toContain("Data export formats");
    // Suppressed-source URLs must not appear inside any popover window.
    for (const window of windows) {
      expect(window).not.toContain(
        'href="https://zeta-chat.example/export-formats"',
      );
      expect(window).not.toContain(
        'href="https://alpha-chat.example/export-na"',
      );
    }
  });

  it("renders url-valueType cells as plain text in the trigger button and as a real anchor only inside the popover", async () => {
    const html = await renderMatrix();

    // Regression guard: the cell trigger is a <button>, whose HTML5 content
    // model forbids interactive descendants. Rendering an <a href> inside
    // it (which is what the URL-typed cell renderer normally produces)
    // would be invalid HTML, trip React's validateDOMNesting, AND cause a
    // real click conflict (anchor navigates + bubbles up to the button's
    // popover toggle). The trigger must therefore show the raw URL as
    // plain text; the real anchor lives only inside the popover surface.
    const triggerRegex =
      /<button[^>]*class="category-matrix-cell-trigger"[^>]*>([\s\S]*?)<\/button>/gu;
    const triggers = Array.from(html.matchAll(triggerRegex));

    expect(
      triggers.length,
      "expected at least one cell trigger button",
    ).toBeGreaterThan(0);

    for (const [, triggerBody] of triggers) {
      expect(
        triggerBody,
        "cell trigger button must not contain an <a> descendant (invalid <button><a> nesting)",
      ).not.toMatch(/<a[\s>]/u);
    }

    // The verified URL must appear as plain text inside at least one trigger.
    const triggerBodies = triggers.map(([, body]) => body).join("\n");
    expect(triggerBodies).toContain("https://zeta-chat.example/privacy");

    // The popover for a verified url-valueType cell must still expose the
    // real clickable anchor — that affordance moves from the cell to the
    // popover instead of disappearing entirely.
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/zeta-chat\.example\/privacy"[^>]*target="_blank"[^>]*>/u,
    );
  });

  it("renders the unverified status text inside the popover body for unverified cells", async () => {
    const html = await renderMatrix();

    // The popover body for an unverified cell must communicate the status
    // so the user knows why no value is shown. Asserting only that the
    // criterion label appears (which the earlier test already does) is not
    // enough — the popover could lose its body and still pass that check.
    const windows = popoverWindows(html);
    const merged = windows.join("\n");

    expect(merged).toContain("Data export formats");
    // At least one popover must carry the "Unverified" body text, anchored
    // inside the popover surface (not just somewhere else in the matrix
    // markup that happens to share the same i18n string).
    const hasUnverifiedBody = windows.some((window) =>
      window.includes("Unverified"),
    );
    expect(
      hasUnverifiedBody,
      "at least one popover surface must carry the 'Unverified' body text",
    ).toBe(true);
  });

  it("renders the not-applicable status text inside the popover body for not_applicable cells", async () => {
    const html = await renderMatrix();

    // Same regression guard as above, mirrored for not_applicable. Alpha
    // export_formats is the fixture's not_applicable cell.
    const windows = popoverWindows(html);
    const hasNotApplicableBody = windows.some((window) =>
      window.includes("Not applicable"),
    );
    expect(
      hasNotApplicableBody,
      "at least one popover surface must carry the 'Not applicable' body text",
    ).toBe(true);
  });

  it("falls back to the localized 'Source' label when the source has no title", async () => {
    const html = await renderMatrix();

    // Alpha e2ee has a verified source with only a URL (no title). The
    // popover must still surface a clickable link, using the localized
    // 'Source' label as the anchor text rather than rendering the bare
    // URL or no text at all. This exercises the
    // `source.title?.trim() || t("matrixView.source")` fallback.
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/alpha-chat\.example\/security"[^>]*>\s*Source\s*<\/a>/u,
    );
  });

  it("opens verified source links in a new tab with safe rel attributes", async () => {
    const html = await renderMatrix();

    // Cross-window safety: every external source link must carry both
    // target="_blank" AND rel="noopener noreferrer". A regression here
    // exposes window.opener to the linked site (reverse-tabnabbing).
    const sourceLink = html.match(
      /<a[^>]*href="https:\/\/zeta-chat\.example\/encryption-report"[^>]*>/u,
    );

    expect(sourceLink, "expected the Zeta encryption-report source link").not.toBeNull();
    expect(sourceLink?.[0]).toContain('target="_blank"');
    expect(sourceLink?.[0]).toContain('rel="noopener noreferrer"');
  });
});
