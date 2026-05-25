import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "browser";
const migrationVersion = "016-browser-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/016-browser-matrix-criteria.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const rawMigration = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const migrationSql = stripSqlComments(rawMigration);
const normalizedMigration = normalizeSql(migrationSql);

const allowedValueTypes = [
  "boolean",
  "enum",
  "multi_enum",
  "number",
  "text",
  "url",
  "date",
] as const;
const allowedSemantics = [
  "beneficial",
  "harmful",
  "neutral",
  "tradeoff",
  "informational",
  "risk",
] as const;
const allowedFilterModes = [
  "none",
  "optional",
  "must_match",
  "range",
  "multi_select",
] as const;
const allowedDisplayTones = [
  "positive",
  "warning",
  "negative",
  "neutral",
  "tradeoff",
] as const;

const expectedGroups = [
  {
    key: "rendering_standards",
    labelEn: "Rendering Engine & Standards",
    sortOrder: 100,
  },
  {
    key: "privacy_tracking",
    labelEn: "Privacy & Tracking Protection",
    sortOrder: 200,
  },
  {
    key: "security_updates",
    labelEn: "Security & Updates",
    sortOrder: 300,
  },
  {
    key: "data_sync_account",
    labelEn: "Data Sync & Account",
    sortOrder: 400,
  },
  {
    key: "content_blocking",
    labelEn: "Content Blocking & Filtering",
    sortOrder: 500,
  },
  {
    key: "platform_distribution",
    labelEn: "Platform & Distribution",
    sortOrder: 600,
  },
  {
    key: "extensions_customization",
    labelEn: "Extensions & Customization",
    sortOrder: 700,
  },
  {
    key: "productivity_tools",
    labelEn: "Productivity & Built-in Tools",
    sortOrder: 800,
  },
  {
    key: "openness_architecture_fit",
    labelEn: "Openness, Architecture & Fit",
    sortOrder: 900,
  },
] as const;

type GroupKey = (typeof expectedGroups)[number]["key"];
type ValueType = (typeof allowedValueTypes)[number];
type Semantics = (typeof allowedSemantics)[number];
type FilterMode = (typeof allowedFilterModes)[number];

type CriterionExpectation = {
  key: string;
  groupKey: GroupKey;
  labelEn: string;
  valueType: ValueType;
  semantics: Semantics;
  filterMode: FilterMode;
  sortOrder: number;
};

type GroupRow = {
  categoryId: string;
  groupKey: string;
  labelEn: string;
  labelDe: string;
  descriptionEn: string;
  descriptionDe: string;
  sortOrder: number;
};

type CriterionRow = {
  categoryId: string;
  groupKey: string;
  criterionKey: string;
  labelEn: string;
  labelDe: string;
  valueType: string;
  semantics: string;
  filterMode: string;
  sortOrder: number;
  helpTextEn: string;
  helpTextDe: string;
};

type OptionRow = {
  categoryId: string;
  criterionKey: string;
  optionKey: string;
  labelEn: string;
  labelDe: string;
  displayTone: string;
  sortOrder: number;
};

const expectedCriteria: CriterionExpectation[] = [
  // Group 1: Rendering Engine & Standards (100)
  {
    key: "rendering_engine",
    groupKey: "rendering_standards",
    labelEn: "Rendering engine",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "web_standards_profile",
    groupKey: "rendering_standards",
    labelEn: "Web standards profile",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "progressive_web_app_support",
    groupKey: "rendering_standards",
    labelEn: "Progressive Web App support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "webextensions_api_support",
    groupKey: "rendering_standards",
    labelEn: "WebExtensions API support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1040,
  },
  // Group 2: Privacy & Tracking Protection (200)
  {
    key: "built_in_tracking_protection",
    groupKey: "privacy_tracking",
    labelEn: "Built-in tracking protection",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2010,
  },
  {
    key: "fingerprinting_resistance",
    groupKey: "privacy_tracking",
    labelEn: "Fingerprinting resistance",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "third_party_cookie_default",
    groupKey: "privacy_tracking",
    labelEn: "Third-party cookie default",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "dns_over_https_support",
    groupKey: "privacy_tracking",
    labelEn: "DNS-over-HTTPS support",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "private_browsing_model",
    groupKey: "privacy_tracking",
    labelEn: "Private browsing model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  // Group 3: Security & Updates (300)
  {
    key: "sandboxing_model",
    groupKey: "security_updates",
    labelEn: "Sandboxing model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "automatic_updates",
    groupKey: "security_updates",
    labelEn: "Automatic updates",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "update_cadence_weeks",
    groupKey: "security_updates",
    labelEn: "Update cadence (weeks)",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 3030,
  },
  {
    key: "security_audit_transparency",
    groupKey: "security_updates",
    labelEn: "Security audit transparency",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3040,
  },
  // Group 4: Data Sync & Account (400)
  {
    key: "account_required",
    groupKey: "data_sync_account",
    labelEn: "Account required",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "sync_features",
    groupKey: "data_sync_account",
    labelEn: "Sync features",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4020,
  },
  {
    key: "sync_encryption_model",
    groupKey: "data_sync_account",
    labelEn: "Sync encryption model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "data_export_available",
    groupKey: "data_sync_account",
    labelEn: "Data export available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4040,
  },
  // Group 5: Content Blocking & Filtering (500)
  {
    key: "built_in_ad_blocker",
    groupKey: "content_blocking",
    labelEn: "Built-in ad blocker",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "content_filter_extension_support",
    groupKey: "content_blocking",
    labelEn: "Content filter extension support",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "supported_filter_list_formats",
    groupKey: "content_blocking",
    labelEn: "Supported filter list formats",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5030,
  },
  {
    key: "reader_mode_available",
    groupKey: "content_blocking",
    labelEn: "Reader mode available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5040,
  },
  // Group 6: Platform & Distribution (600)
  {
    key: "supported_platforms",
    groupKey: "platform_distribution",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6010,
  },
  {
    key: "mobile_app_distribution",
    groupKey: "platform_distribution",
    labelEn: "Mobile app distribution",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6020,
  },
  {
    key: "default_browser_settable",
    groupKey: "platform_distribution",
    labelEn: "Default browser settable",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "portable_mode_available",
    groupKey: "platform_distribution",
    labelEn: "Portable mode available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6040,
  },
  // Group 7: Extensions & Customization (700)
  {
    key: "extension_store_model",
    groupKey: "extensions_customization",
    labelEn: "Extension store model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "extension_api_compatibility",
    groupKey: "extensions_customization",
    labelEn: "Extension API compatibility",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "theme_customization_level",
    groupKey: "extensions_customization",
    labelEn: "Theme customization level",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "ui_customization_features",
    groupKey: "extensions_customization",
    labelEn: "UI customization features",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7040,
  },
  // Group 8: Productivity & Built-in Tools (800)
  {
    key: "tab_management_features",
    groupKey: "productivity_tools",
    labelEn: "Tab management features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 8010,
  },
  {
    key: "built_in_pdf_viewer",
    groupKey: "productivity_tools",
    labelEn: "Built-in PDF viewer",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "built_in_tools",
    groupKey: "productivity_tools",
    labelEn: "Built-in tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "password_manager_model",
    groupKey: "productivity_tools",
    labelEn: "Password manager model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8040,
  },
  // Group 9: Openness, Architecture & Fit (900)
  {
    key: "source_code_model",
    groupKey: "openness_architecture_fit",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9010,
  },
  {
    key: "engine_independence",
    groupKey: "openness_architecture_fit",
    labelEn: "Engine independence",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "protocol_support",
    groupKey: "openness_architecture_fit",
    labelEn: "Protocol support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9030,
  },
  {
    key: "self_hosting_sync_server",
    groupKey: "openness_architecture_fit",
    labelEn: "Self-hosting sync server",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9040,
  },
  {
    key: "fit_profiles",
    groupKey: "openness_architecture_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9050,
  },
];

const requiredOptionsByCriterion = {
  rendering_engine: ["blink", "gecko", "webkit", "goanna", "servo", "other"],
  web_standards_profile: [
    "full_modern",
    "mostly_compliant",
    "selective_support",
    "minimal",
  ],
  built_in_tracking_protection: ["none", "basic", "enhanced", "aggressive"],
  fingerprinting_resistance: [
    "none",
    "basic_mitigations",
    "advanced_resistance",
    "aggressive_blocking",
  ],
  third_party_cookie_default: [
    "allowed_by_default",
    "partitioned",
    "blocked_by_default",
    "all_cookies_blocked",
  ],
  dns_over_https_support: [
    "none",
    "opt_in",
    "default_on",
    "enforced",
    "custom_provider",
  ],
  private_browsing_model: [
    "basic_session_only",
    "enhanced_anti_tracking",
    "tor_integration",
    "always_private",
  ],
  sandboxing_model: [
    "none",
    "process_per_tab",
    "site_isolation",
    "full_os_sandbox",
  ],
  security_audit_transparency: [
    "none_public",
    "bug_bounty_only",
    "periodic_audits",
    "continuous_transparency",
  ],
  sync_features: [
    "bookmarks",
    "history",
    "passwords",
    "open_tabs",
    "extensions",
    "settings",
  ],
  sync_encryption_model: [
    "not_encrypted",
    "transport_only",
    "server_side",
    "e2ee",
  ],
  content_filter_extension_support: [
    "none",
    "mv3_limited",
    "mv3_full",
    "mv2_full",
    "native_api",
  ],
  supported_filter_list_formats: [
    "adblock_plus",
    "ublock_origin",
    "hosts_file",
    "dns_blocklist",
    "custom_rules",
  ],
  supported_platforms: ["windows", "macos", "linux", "android", "ios", "bsd"],
  mobile_app_distribution: [
    "app_store",
    "play_store",
    "f_droid",
    "direct_apk",
    "pwa",
  ],
  extension_store_model: [
    "own_store",
    "chrome_web_store",
    "firefox_addons",
    "sideload_only",
    "no_extensions",
  ],
  extension_api_compatibility: [
    "chrome_extensions",
    "firefox_extensions",
    "webextensions",
    "proprietary_api",
    "userscripts",
  ],
  theme_customization_level: [
    "none",
    "basic_themes",
    "advanced_theming",
    "full_css_customization",
  ],
  ui_customization_features: [
    "toolbar_layout",
    "sidebar_panels",
    "tab_bar_position",
    "keyboard_shortcuts",
    "custom_start_page",
    "compact_mode",
  ],
  tab_management_features: [
    "tab_groups",
    "tree_tabs",
    "tab_stacking",
    "session_management",
    "tab_hibernation",
    "split_view",
  ],
  built_in_tools: [
    "screenshot_tool",
    "developer_tools",
    "page_translator",
    "reading_list",
    "notes",
    "vpn_proxy",
  ],
  password_manager_model: [
    "none",
    "basic_save_fill",
    "advanced_with_sync",
    "external_integration",
  ],
  source_code_model: [
    "open_source",
    "source_available",
    "partial_open",
    "proprietary",
  ],
  engine_independence: [
    "independent_engine",
    "chromium_fork",
    "webkit_fork",
    "gecko_based",
    "custom_hybrid",
  ],
  protocol_support: ["http3", "ipfs", "tor", "gemini", "dat", "i2p"],
  fit_profiles: [
    "privacy_focused",
    "everyday_browsing",
    "power_users",
    "developers",
    "minimal_lightweight",
    "accessibility_needs",
    "enterprise",
    "education",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  rendering_engine: {
    blink: "neutral",
    gecko: "positive",
  },
  built_in_tracking_protection: {
    none: "warning",
  },
  fingerprinting_resistance: {
    none: "warning",
  },
  third_party_cookie_default: {
    allowed_by_default: "warning",
    blocked_by_default: "positive",
    all_cookies_blocked: "tradeoff",
  },
  dns_over_https_support: {
    none: "warning",
  },
  private_browsing_model: {
    tor_integration: "positive",
  },
  sandboxing_model: {
    none: "warning",
    full_os_sandbox: "positive",
  },
  sync_encryption_model: {
    not_encrypted: "warning",
    e2ee: "positive",
  },
  content_filter_extension_support: {
    none: "warning",
    mv3_limited: "tradeoff",
    mv2_full: "positive",
  },
  source_code_model: {
    proprietary: "warning",
    open_source: "positive",
  },
  engine_independence: {
    independent_engine: "positive",
    chromium_fork: "tradeoff",
    webkit_fork: "tradeoff",
  },
  fit_profiles: {
    developers: "tradeoff",
  },
} as const satisfies Record<
  string,
  Record<string, "warning" | "tradeoff" | "positive" | "neutral">
>;

const forbiddenGenericCriterionKeys = [
  "headquarters_country",
  "company_country",
  "ownership_model",
  "open_source",
  "source_available",
  "privacy_policy",
  "privacy_policy_quality",
  "terms_of_service",
  "trust_score",
  "positive_signals",
  "reservations",
  "gdpr_compliance",
  "business_model",
] as const;

function stripSqlComments(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insertStatementsFor(tableName: string): string[] {
  const pattern = new RegExp(
    `INSERT\\s+(?:IGNORE\\s+)?INTO\\s+\`?${escapeRegExp(
      tableName,
    )}\`?[\\s\\S]*?;`,
    "gi",
  );

  return [...migrationSql.matchAll(pattern)].map((match) => match[0]);
}

function sqlStringLiteralsIn(sql: string): string[] {
  return [...sql.matchAll(/'((?:''|[^'])*)'/g)].map((match) =>
    match[1].replace(/''/g, "'"),
  );
}

function trailingSortOrderIn(sql: string): number {
  const sqlWithoutStrings = sql.replace(/'(?:''|[^'])*'/g, "''");
  const matches = [...sqlWithoutStrings.matchAll(/\b\d+\b/g)];

  expect(matches.length).toBeGreaterThan(0);
  return Number(matches.at(-1)?.[0]);
}

function valueRowsForInsert(tableName: string): string[] {
  const statement = insertStatementsFor(tableName)[0] ?? "";
  const match = statement.match(/\bVALUES\s*([\s\S]*?);/i);

  return (match?.[1] ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("("));
}

function derivedSelectRowsForInsert(tableName: string): string[] {
  const statement = insertStatementsFor(tableName)[0] ?? "";
  const match = statement.match(/\bFROM\s*\(\s*([\s\S]*?)\s*\)\s+AS\s+d/i);

  return (match?.[1] ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^(?:UNION\s+ALL\s+)?SELECT\b/i.test(line));
}

function parseGroupRows(): GroupRow[] {
  return valueRowsForInsert("matrix_criterion_groups").map((row) => {
    const literals = sqlStringLiteralsIn(row);

    expect(literals).toHaveLength(6);
    return {
      categoryId: literals[0],
      groupKey: literals[1],
      labelEn: literals[2],
      labelDe: literals[3],
      descriptionEn: literals[4],
      descriptionDe: literals[5],
      sortOrder: trailingSortOrderIn(row),
    };
  });
}

function parseCriterionRows(): CriterionRow[] {
  return derivedSelectRowsForInsert("matrix_criteria").map((row) => {
    const literals = sqlStringLiteralsIn(row);

    expect(literals).toHaveLength(10);
    return {
      categoryId: literals[0],
      groupKey: literals[1],
      criterionKey: literals[2],
      labelEn: literals[3],
      labelDe: literals[4],
      valueType: literals[5],
      semantics: literals[6],
      filterMode: literals[7],
      sortOrder: trailingSortOrderIn(row),
      helpTextEn: literals[8],
      helpTextDe: literals[9],
    };
  });
}

function parseOptionRows(): OptionRow[] {
  return derivedSelectRowsForInsert("matrix_criterion_options").map((row) => {
    const literals = sqlStringLiteralsIn(row);

    expect(literals).toHaveLength(6);
    return {
      categoryId: literals[0],
      criterionKey: literals[1],
      optionKey: literals[2],
      labelEn: literals[3],
      labelDe: literals[4],
      displayTone: literals[5],
      sortOrder: trailingSortOrderIn(row),
    };
  });
}

function insertTargetTables(): string[] {
  return [
    ...migrationSql.matchAll(/\bINSERT\s+(?:IGNORE\s+)?INTO\s+`?([a-z_]+)`?/gi),
  ].map((match) => match[1]);
}

function insertColumnsFor(tableName: string): string[] {
  const statement = insertStatementsFor(tableName)[0] ?? "";
  const pattern = new RegExp(
    `INSERT\\s+(?:IGNORE\\s+)?INTO\\s+\`?${escapeRegExp(
      tableName,
    )}\`?\\s*\\(([\\s\\S]*?)\\)`,
    "i",
  );
  const match = statement.match(pattern);

  return (match?.[1] ?? "")
    .split(",")
    .map((column) => column.replace(/`/g, "").trim())
    .filter(Boolean);
}

describe("browser matrix criteria migration", () => {
  it("adds the repository-owned migration for Browser matrix metadata", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedMigration).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_criterion_groups`?/i,
    );
    expect(normalizedMigration).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_criteria`?/i,
    );
    expect(normalizedMigration).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_criterion_options`?/i,
    );
    expect(normalizedMigration).toMatch(
      new RegExp(
        `INSERT\\s+(?:IGNORE\\s+)?INTO\\s+\`?schema_migrations\`?[\\s\\S]*'${migrationVersion}'`,
        "i",
      ),
    );
  });

  it("uses category-scoped natural-key joins for shared matrix metadata keys", () => {
    const criteriaSql = normalizeSql(
      insertStatementsFor("matrix_criteria").join("\n"),
    );
    const optionsSql = normalizeSql(
      insertStatementsFor("matrix_criterion_options").join("\n"),
    );

    expect(criteriaSql).toMatch(
      /\bJOIN\s+`?matrix_criterion_groups`?\s+g\s+ON\s+g\.category_id\s*=\s*d\.category_id\s+AND\s+g\.group_key\s*=\s*d\.group_key\b/i,
    );
    expect(optionsSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*d\.category_id\s+AND\s+mc\.criterion_key\s*=\s*d\.criterion_key\b/i,
    );
  });

  it("only writes the approved matrix metadata, placeholder fact, and migration tables", () => {
    expect(insertTargetTables()).toEqual([
      "matrix_criterion_groups",
      "matrix_criteria",
      "matrix_criterion_options",
      "matrix_facts",
      "schema_migrations",
    ]);
  });

  it("targets the matrix metadata schema columns that carry localized copy and option IDs", () => {
    expect(insertColumnsFor("matrix_criterion_groups")).toEqual([
      "category_id",
      "group_key",
      "label_en",
      "label_de",
      "description_en",
      "description_de",
      "sort_order",
    ]);
    expect(insertColumnsFor("matrix_criteria")).toEqual([
      "category_id",
      "group_id",
      "criterion_key",
      "label_en",
      "label_de",
      "value_type",
      "semantics",
      "filter_mode",
      "sort_order",
      "help_text_en",
      "help_text_de",
    ]);
    expect(insertColumnsFor("matrix_criterion_options")).toEqual([
      "criterion_id",
      "option_key",
      "label_en",
      "label_de",
      "display_tone",
      "sort_order",
    ]);

    const criteriaSql = normalizeSql(
      insertStatementsFor("matrix_criteria").join("\n"),
    );
    const optionsSql = normalizeSql(
      insertStatementsFor("matrix_criterion_options").join("\n"),
    );

    expect(criteriaSql).toMatch(
      /\bSELECT\s+d\.category_id\s*,\s*g\.id\s*,\s*d\.criterion_key\s*,\s*d\.label_en\s*,\s*d\.label_de\s*,\s*d\.value_type\s*,\s*d\.semantics\s*,\s*d\.filter_mode\s*,\s*d\.sort_order\s*,\s*d\.help_text_en\s*,\s*d\.help_text_de\s+FROM\b/i,
    );
    expect(optionsSql).toMatch(
      /\bSELECT\s+mc\.id\s*,\s*d\.option_key\s*,\s*d\.label_en\s*,\s*d\.label_de\s*,\s*d\.display_tone\s*,\s*d\.sort_order\s+FROM\b/i,
    );
  });

  it("defines ordered Browser criterion groups with localized labels", () => {
    const groupRows = parseGroupRows();

    expect(groupRows).toHaveLength(expectedGroups.length);
    expect(groupRows.map((group) => group.groupKey)).toEqual(
      expectedGroups.map((group) => group.key),
    );
    expect(groupRows.map((group) => group.sortOrder)).toEqual(
      expectedGroups.map((group) => group.sortOrder),
    );

    for (const group of groupRows) {
      const expectedGroup = expectedGroups.find(
        (expected) => expected.key === group.groupKey,
      );

      expect(expectedGroup).toBeDefined();
      expect(group.categoryId).toBe(categoryId);
      expect(group.labelEn).toBe(expectedGroup?.labelEn);
      expect(group.labelDe.trim()).not.toEqual("");
      expect(group.descriptionEn.trim()).not.toEqual("");
      expect(group.descriptionDe.trim()).not.toEqual("");
    }
  });

  it("defines category-native Browser criteria with valid metadata and localized copy", () => {
    const criterionRows = parseCriterionRows();
    const seenCriterionKeys = new Set<string>();
    const seenSortOrders = new Set<number>();

    expect(criterionRows).toHaveLength(expectedCriteria.length);
    expect(criterionRows.map((criterion) => criterion.criterionKey)).toEqual(
      expectedCriteria.map((criterion) => criterion.key),
    );

    for (const criterion of criterionRows) {
      const expectedCriterion = expectedCriteria.find(
        (expected) => expected.key === criterion.criterionKey,
      );

      expect(expectedCriterion).toBeDefined();
      expect(seenCriterionKeys.has(criterion.criterionKey)).toBe(false);
      seenCriterionKeys.add(criterion.criterionKey);
      expect(seenSortOrders.has(criterion.sortOrder)).toBe(false);
      seenSortOrders.add(criterion.sortOrder);
      expect(criterion.categoryId).toBe(categoryId);
      expect(criterion.groupKey).toBe(expectedCriterion?.groupKey);
      expect(criterion.labelEn).toBe(expectedCriterion?.labelEn);
      expect(criterion.labelDe.trim()).not.toEqual("");
      expect(criterion.valueType).toBe(expectedCriterion?.valueType);
      expect(allowedValueTypes).toContain(
        criterion.valueType as (typeof allowedValueTypes)[number],
      );
      expect(criterion.semantics).toBe(expectedCriterion?.semantics);
      expect(allowedSemantics).toContain(
        criterion.semantics as (typeof allowedSemantics)[number],
      );
      expect(criterion.filterMode).toBe(expectedCriterion?.filterMode);
      expect(allowedFilterModes).toContain(
        criterion.filterMode as (typeof allowedFilterModes)[number],
      );
      expect(criterion.sortOrder).toBe(expectedCriterion?.sortOrder);
      expect(criterion.helpTextEn.trim()).not.toEqual("");
      expect(criterion.helpTextDe.trim()).not.toEqual("");
    }

    const criterionKeys = criterionRows.map(
      (criterion) => criterion.criterionKey,
    );

    for (const forbiddenKey of forbiddenGenericCriterionKeys) {
      expect(criterionKeys).not.toContain(forbiddenKey);
    }
  });

  it("provides concrete options for every enum and multi-enum criterion", () => {
    const optionCriteria = new Set(Object.keys(requiredOptionsByCriterion));
    const optionsSql = insertStatementsFor("matrix_criterion_options").join(
      "\n",
    );

    expect(optionsSql).not.toEqual("");

    for (const criterion of expectedCriteria) {
      if (
        criterion.valueType === "enum" ||
        criterion.valueType === "multi_enum"
      ) {
        expect(optionCriteria.has(criterion.key)).toBe(true);
      } else {
        expect(optionCriteria.has(criterion.key)).toBe(false);
      }
    }

    expect(optionsSql).not.toContain("'unknown'");
  });

  it("defines localized option metadata with valid display tones and stable ordering", () => {
    const optionRows = parseOptionRows();
    const optionRowsByCriterion = new Map<string, OptionRow[]>();

    expect(optionRows.length).toBeGreaterThan(0);

    for (const option of optionRows) {
      expect(option.categoryId).toBe(categoryId);
      expect(Object.keys(requiredOptionsByCriterion)).toContain(
        option.criterionKey,
      );
      expect(allowedDisplayTones).toContain(
        option.displayTone as (typeof allowedDisplayTones)[number],
      );
      expect(option.labelEn.trim()).not.toEqual("");
      expect(option.labelDe.trim()).not.toEqual("");
      expect(option.sortOrder).toBeGreaterThan(0);
      expect(option.optionKey).not.toBe("unknown");

      const rows = optionRowsByCriterion.get(option.criterionKey) ?? [];
      rows.push(option);
      optionRowsByCriterion.set(option.criterionKey, rows);
    }

    for (const [criterionKey, optionKeys] of Object.entries(
      requiredOptionsByCriterion,
    )) {
      const rows = optionRowsByCriterion.get(criterionKey) ?? [];
      const seenSortOrders = new Set<number>();

      expect(rows.map((option) => option.optionKey)).toEqual([...optionKeys]);
      expect(rows.map((option) => option.sortOrder)).toEqual(
        optionKeys.map((_, index) => (index + 1) * 10),
      );

      for (const option of rows) {
        expect(optionKeys).toContain(
          option.optionKey as (typeof optionKeys)[number],
        );
        expect(seenSortOrders.has(option.sortOrder)).toBe(false);
        seenSortOrders.add(option.sortOrder);
      }
    }
  });

  it("keeps warning and tradeoff tones attached to the intended sensitive options", () => {
    const actualCautionTones = parseOptionRows()
      .filter((option) => {
        const expectedTones =
          expectedCautionOptionTonesByCriterion[
            option.criterionKey as keyof typeof expectedCautionOptionTonesByCriterion
          ];
        if (!expectedTones) return false;
        return option.optionKey in expectedTones;
      })
      .map(
        (option) =>
          `${option.criterionKey}:${option.optionKey}:${option.displayTone}`,
      )
      .sort();
    const expectedCautionTones = Object.entries(
      expectedCautionOptionTonesByCriterion,
    )
      .flatMap(([criterionKey, optionTones]) =>
        Object.entries(optionTones).map(
          ([optionKey, displayTone]) =>
            `${criterionKey}:${optionKey}:${displayTone}`,
        ),
      )
      .sort();

    expect(actualCautionTones).toEqual(expectedCautionTones);
  });

  it("creates only open placeholder facts and avoids Trust Score or product fact values", () => {
    const factSql = insertStatementsFor("matrix_facts").join("\n");
    const normalizedFactSql = normalizeSql(factSql);

    expect(factSql).not.toEqual("");
    expect(normalizedFactSql).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?\s*\(\s*`?entry_id`?\s*,\s*`?category_id`?\s*,\s*`?criterion_id`?\s*,\s*`?status`?\s*\)/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bSELECT\s+ce\.id\s*,\s*mc\.category_id\s*,\s*mc\.id\s*,\s*'open'\s+FROM\s+`?catalog_entries`?\s+ce\b/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'browser'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'browser'\s+WHERE\b/i,
    );
    expect(normalizedFactSql).not.toMatch(/\bmc\.criterion_key\b/i);
    expect(normalizedFactSql).toMatch(/`?status`?\s*=\s*'alternative'/i);
    expect(normalizedFactSql).toMatch(/`?is_active`?\s*=\s*1/i);

    for (const forbiddenColumn of [
      "value_bool",
      "value_number",
      "value_text",
      "value_json",
      "public_source_url",
      "public_source_title",
      "public_source_accessed_date",
      "selected_attempt_id",
    ]) {
      expect(factSql).not.toMatch(new RegExp(`\\b${forbiddenColumn}\\b`, "i"));
    }

    for (const forbiddenTable of [
      "reservations",
      "positive_signals",
      "scoring_metadata",
      "matrix_fact_attempts",
      "matrix_fact_verifications",
    ]) {
      expect(normalizedMigration).not.toMatch(
        new RegExp(
          `\\b(?:INSERT|UPDATE|DELETE|ALTER)\\b[\\s\\S]{0,80}\\b\`?${escapeRegExp(
            forbiddenTable,
          )}\`?\\b`,
          "i",
        ),
      );
    }

    expect(normalizedMigration).not.toMatch(/\btrust_score\b/i);
    expect(normalizedMigration).not.toMatch(/\bpenalty\b/i);
  });

  it("does not destructively rewrite existing matrix metadata or facts", () => {
    expect(normalizedMigration).not.toEqual("");

    for (const tableName of [
      "matrix_criterion_groups",
      "matrix_criteria",
      "matrix_criterion_options",
      "matrix_facts",
    ]) {
      expect(normalizedMigration).not.toMatch(
        new RegExp(
          `\\b(?:UPDATE|DELETE\\s+FROM|ALTER\\s+TABLE|DROP\\s+TABLE|TRUNCATE\\s+TABLE)\\s+\`?${escapeRegExp(
            tableName,
          )}\`?\\b`,
          "i",
        ),
      );
    }
  });

  it("contains the expected total number of option rows across all criteria", () => {
    const optionRows = parseOptionRows();
    const expectedTotal = Object.values(requiredOptionsByCriterion).reduce(
      (sum, keys) => sum + keys.length,
      0,
    );

    expect(expectedTotal).toBe(129);
    expect(optionRows).toHaveLength(expectedTotal);
  });

  it("uses ASCII replacements for German umlauts and eszett in all localized text", () => {
    const unicodeUmlautPattern = /[äöüÄÖÜß]/;

    for (const row of parseGroupRows()) {
      expect(row.labelDe).not.toMatch(unicodeUmlautPattern);
      expect(row.descriptionDe).not.toMatch(unicodeUmlautPattern);
    }

    for (const row of parseCriterionRows()) {
      expect(row.labelDe).not.toMatch(unicodeUmlautPattern);
      expect(row.helpTextDe).not.toMatch(unicodeUmlautPattern);
    }

    for (const row of parseOptionRows()) {
      expect(row.labelDe).not.toMatch(unicodeUmlautPattern);
    }
  });

  it("records the exact migration version in schema_migrations", () => {
    const versionPattern = new RegExp(
      `INSERT\\s+INTO\\s+\`?schema_migrations\`?\\s*\\(\\s*\`?version\`?\\s*\\)\\s*VALUES\\s*\\(\\s*'${escapeRegExp(migrationVersion)}'\\s*\\)`,
      "i",
    );

    expect(migrationSql).toMatch(versionPattern);
  });
});
