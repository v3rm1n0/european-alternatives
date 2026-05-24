import { createElement } from "react";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

import Filters from "../src/components/Filters";
import type { SelectedFilters, SortBy, ViewMode } from "../src/types";

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
  viewMode: ViewMode | "matrix";
  onViewModeChange: (mode: ViewMode | "matrix") => void;
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
    "browse:filters.matrixView": "Matrix view",
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
    viewMode?: ViewMode | "matrix";
  } = {},
): string {
  filtersMocks.onViewModeChange.mockClear();
  const FiltersForTest = Filters as ComponentType<FiltersPropsForTest>;

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

describe("filters matrix view toggle", () => {
  it("does not offer the matrix view when the browse page marks it unavailable", () => {
    const html = renderFilters({ matrixViewAvailable: false });

    expect(html).toContain('aria-label="Grid view"');
    expect(html).toContain('aria-label="List view"');
    expect(html).not.toContain('aria-label="Matrix view"');
  });

  it("offers matrix mode as a third view toggle only when matrix content is available", () => {
    const html = renderFilters({
      matrixViewAvailable: true,
      viewMode: "matrix",
    });

    expect(html).toContain('aria-label="Grid view"');
    expect(html).toContain('aria-label="List view"');
    expect(html).toContain('aria-label="Matrix view"');

    const matrixButton = html.match(
      /<button\b(?=[^>]*aria-label="Matrix view")[^>]*>/u,
    )?.[0];

    expect(matrixButton).toContain("view-toggle-button");
    expect(matrixButton).toContain("active");
  });
});
