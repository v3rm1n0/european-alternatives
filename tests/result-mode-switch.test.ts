import { createElement } from "react";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

type ResultMode = "browse" | "matrix";

type ResultModeSwitchPropsForTest = {
  mode: ResultMode;
  onChange: (mode: ResultMode) => void;
  matrixAvailable: boolean;
};

vi.mock("react-i18next", () => {
  const translations: Record<string, string> = {
    "browse:resultMode.label": "Show alternatives as",
    "browse:resultMode.browse": "Browse",
    "browse:resultMode.matrix": "Matrix",
  };

  return {
    useTranslation: () => ({
      t: (key: string) => translations[key] ?? key,
    }),
  };
});

async function renderResultModeSwitch(
  options: { mode?: ResultMode; matrixAvailable?: boolean } = {},
): Promise<string> {
  const module = (await import("../src/components/ResultModeSwitch")) as {
    default: ComponentType<ResultModeSwitchPropsForTest>;
  };

  return renderToStaticMarkup(
    createElement(module.default, {
      mode: options.mode ?? "browse",
      onChange: vi.fn(),
      matrixAvailable: options.matrixAvailable ?? true,
    }),
  );
}

describe("ResultModeSwitch", () => {
  it("renders a radiogroup with a localized accessible label when matrix is available", async () => {
    const html = await renderResultModeSwitch({ matrixAvailable: true });

    // The switch is a single semantic group describing the user choice
    // "Browse vs Matrix". Using role=radiogroup over tablist is deliberate:
    // both options curate the same underlying data — only the rendering
    // changes — so a radio group describes the choice more accurately.
    expect(html).toMatch(
      /<[a-z]+[^>]*role="radiogroup"[^>]*aria-label="Show alternatives as"/u,
    );
  });

  it("renders exactly two radio buttons for browse and matrix", async () => {
    const html = await renderResultModeSwitch({ matrixAvailable: true });

    const radioButtons = html.match(/role="radio"/gu) ?? [];
    expect(radioButtons.length).toBe(2);
    expect(html).toContain("Browse");
    expect(html).toContain("Matrix");
  });

  it("marks the active mode with aria-checked=true when the browse option is selected", async () => {
    const html = await renderResultModeSwitch({
      mode: "browse",
      matrixAvailable: true,
    });

    // Browse radio is checked; matrix radio is unchecked.
    expect(html).toMatch(
      /<button[^>]*role="radio"[^>]*aria-checked="true"[^>]*>[\s\S]*?Browse[\s\S]*?<\/button>/u,
    );
    expect(html).toMatch(
      /<button[^>]*role="radio"[^>]*aria-checked="false"[^>]*>[\s\S]*?Matrix[\s\S]*?<\/button>/u,
    );
  });

  it("marks the active mode with aria-checked=true when the matrix option is selected", async () => {
    const html = await renderResultModeSwitch({
      mode: "matrix",
      matrixAvailable: true,
    });

    expect(html).toMatch(
      /<button[^>]*role="radio"[^>]*aria-checked="true"[^>]*>[\s\S]*?Matrix[\s\S]*?<\/button>/u,
    );
    expect(html).toMatch(
      /<button[^>]*role="radio"[^>]*aria-checked="false"[^>]*>[\s\S]*?Browse[\s\S]*?<\/button>/u,
    );
  });

  it("renders nothing when matrix is not available", async () => {
    const html = await renderResultModeSwitch({ matrixAvailable: false });

    // When the category has no matrix data, the gate from issue #499 must
    // suppress the switch entirely — no error UI, no disabled control.
    expect(html).not.toContain("radiogroup");
    expect(html).not.toContain('role="radio"');
    expect(html).toBe("");
  });

  it("applies a roving tabIndex so only the active radio is in the tab order", async () => {
    // WAI-ARIA radiogroup pattern: exactly one radio should be tabbable at a
    // time; arrow keys cycle between siblings. Without roving tabindex the
    // user would have to tab through every option to leave the group.
    const browseHtml = await renderResultModeSwitch({
      mode: "browse",
      matrixAvailable: true,
    });
    expect(browseHtml).toMatch(
      /<button[^>]*aria-checked="true"[^>]*tabindex="0"[^>]*>[\s\S]*?Browse[\s\S]*?<\/button>/u,
    );
    expect(browseHtml).toMatch(
      /<button[^>]*aria-checked="false"[^>]*tabindex="-1"[^>]*>[\s\S]*?Matrix[\s\S]*?<\/button>/u,
    );

    const matrixHtml = await renderResultModeSwitch({
      mode: "matrix",
      matrixAvailable: true,
    });
    expect(matrixHtml).toMatch(
      /<button[^>]*aria-checked="true"[^>]*tabindex="0"[^>]*>[\s\S]*?Matrix[\s\S]*?<\/button>/u,
    );
    expect(matrixHtml).toMatch(
      /<button[^>]*aria-checked="false"[^>]*tabindex="-1"[^>]*>[\s\S]*?Browse[\s\S]*?<\/button>/u,
    );
  });

  it("declares type=button on both radio buttons so they never submit a parent form", async () => {
    // The switch may render inside a search/filters region that contains a
    // form. Buttons without an explicit type default to "submit", which would
    // navigate the page when the user picks a result mode.
    const html = await renderResultModeSwitch({ matrixAvailable: true });

    const buttonTypes = html.match(/<button[^>]*type="button"/gu) ?? [];
    expect(buttonTypes.length).toBe(2);
  });
});
