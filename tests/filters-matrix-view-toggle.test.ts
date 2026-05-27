import { createElement } from "react";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

import Filters from "../src/components/Filters";
import type { CardViewMode, SelectedFilters, SortBy } from "../src/types";

type FiltersPropsForTest = {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilters: SelectedFilters;
  onFilterChange: (
    filterType: keyof SelectedFilters,
    values: string[] | boolean,
  ) => void;
  onClearAll: () => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  viewMode: CardViewMode;
  onViewModeChange: (mode: CardViewMode) => void;
  totalCount: number;
  filteredCount: number;
  matrixViewAvailable?: boolean;
};

const filtersMocks = vi.hoisted(() => ({
  onViewModeChange: vi.fn(),
}));

vi.mock("../src/contexts/CatalogContext", () => ({
  useCatalog: () => ({
    alternatives: [
      {
        id: "primary-chat",
        country: "de",
      },
    ],
    categories: [
      {
        id: "messaging",
        name: "Messaging",
        description: "Secure messaging",
        usGiants: [],
        emoji: "chat",
      },
    ],
  }),
}));

vi.mock("react-i18next", () => {
  const translations: Record<string, string> = {
    "browse:filters.searchPlaceholder": "Search alternatives...",
    "browse:filters.searchLabel": "Search alternatives",
    "browse:filters.count": "{{filtered}} of {{total}} alternatives",
    "browse:filters.sortBy": "Sort by",
    "browse:filters.sortTrustScore": "Trust score",
    "browse:filters.sortName": "Name",
    "browse:filters.sortCountry": "Country",
    "browse:filters.sortCategory": "Category",
    "browse:filters.gridView": "Grid view",
    "browse:filters.listView": "List view",
    "browse:filters.filters": "Filters",
    "browse:filters.clearAll": "Clear all filters",
  };

  return {
    useTranslation: () => ({
      t: (key: string, values?: Record<string, string | number>) => {
        const template = translations[key] ?? key;

        return template.replace(/\{\{(\w+)\}\}/gu, (_match, name: string) =>
          String(values?.[name] ?? ""),
        );
      },
    }),
  };
});

vi.mock("framer-motion", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: {
      div: ({
        children,
        ...props
      }: Record<string, unknown> & { children?: React.ReactNode }) =>
        React.createElement("div", props, children),
    },
  };
});

function renderFilters(
  options: {
    matrixViewAvailable?: boolean;
    viewMode?: CardViewMode;
  } = {},
): string {
  filtersMocks.onViewModeChange.mockClear();
  const FiltersForTest = Filters as unknown as ComponentType<FiltersPropsForTest>;

  return renderToStaticMarkup(
    createElement(FiltersForTest, {
      searchTerm: "",
      onSearchChange: vi.fn(),
      selectedFilters: {
        category: [],
        country: [],
        pricing: [],
        openSourceOnly: false,
      },
      onFilterChange: vi.fn(),
      onClearAll: vi.fn(),
      sortBy: "trustScore",
      onSortChange: vi.fn(),
      viewMode: options.viewMode ?? "grid",
      onViewModeChange: filtersMocks.onViewModeChange,
      totalCount: 1,
      filteredCount: 1,
      matrixViewAvailable: options.matrixViewAvailable,
    }),
  );
}

describe("filters card layout toggle", () => {
  it("never offers the matrix view button regardless of matrix availability", () => {
    // After issue #500 the Browse/Matrix choice is a top-level result-mode
    // switch — Filters owns only the grid-vs-list layout preference, not the
    // surface kind. The matrix button must not leak back into the Filters
    // toggle group even when the caller still passes matrixViewAvailable.
    const htmlAvailable = renderFilters({ matrixViewAvailable: true });
    const htmlUnavailable = renderFilters({ matrixViewAvailable: false });

    for (const html of [htmlAvailable, htmlUnavailable]) {
      expect(html).not.toContain('aria-label="Matrix view"');
      expect(html).not.toContain("filters.matrixView");
      // The view toggle should contain exactly two buttons (grid + list).
      const toggleSection = html.match(
        /<div\b[^>]*class="filters-view-toggle"[^>]*>([\s\S]*?)<\/div>/u,
      )?.[1];
      expect(toggleSection).toBeDefined();
      const buttonCount = (toggleSection ?? "").match(/<button\b/gu)?.length ?? 0;
      expect(buttonCount).toBe(2);
    }
  });

  it("keeps the grid and list layout buttons in the Filters toggle group", () => {
    const html = renderFilters({ matrixViewAvailable: true, viewMode: "list" });

    expect(html).toContain('aria-label="Grid view"');
    expect(html).toContain('aria-label="List view"');

    const listButton = html.match(
      /<button\b(?=[^>]*aria-label="List view")[^>]*>/u,
    )?.[0];
    expect(listButton).toContain("view-toggle-button");
    expect(listButton).toContain("active");
  });
});
