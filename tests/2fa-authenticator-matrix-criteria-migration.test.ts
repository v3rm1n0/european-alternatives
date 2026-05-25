import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "2fa-authenticator";
const migrationVersion = "024-2fa-authenticator-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/024-2fa-authenticator-matrix-criteria.sql",
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
    key: "supported_methods",
    labelEn: "Supported 2FA Methods",
    sortOrder: 100,
  },
  {
    key: "token_management",
    labelEn: "Token Management",
    sortOrder: 200,
  },
  {
    key: "security_protection",
    labelEn: "Security & Protection",
    sortOrder: 300,
  },
  {
    key: "backup_sync",
    labelEn: "Backup & Sync",
    sortOrder: 400,
  },
  {
    key: "platform_access",
    labelEn: "Platform & Access",
    sortOrder: 500,
  },
  {
    key: "migration_portability",
    labelEn: "Migration & Portability",
    sortOrder: 600,
  },
  {
    key: "usability_ux",
    labelEn: "Usability & UX",
    sortOrder: 700,
  },
  {
    key: "openness_audit",
    labelEn: "Openness & Audit",
    sortOrder: 800,
  },
  {
    key: "pricing_fit",
    labelEn: "Pricing & Fit",
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
  // Group 1: Supported 2FA Methods (100)
  {
    key: "totp_support",
    groupKey: "supported_methods",
    labelEn: "TOTP support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 1010,
  },
  {
    key: "hotp_support",
    groupKey: "supported_methods",
    labelEn: "HOTP support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "push_authentication",
    groupKey: "supported_methods",
    labelEn: "Push-based authentication",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "supported_otp_algorithms",
    groupKey: "supported_methods",
    labelEn: "Supported OTP algorithms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1040,
  },
  {
    key: "passkey_storage",
    groupKey: "supported_methods",
    labelEn: "Passkey or FIDO2 credential storage",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "steam_guard_support",
    groupKey: "supported_methods",
    labelEn: "Steam Guard token support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1060,
  },
  // Group 2: Token Management (200)
  {
    key: "token_entry_methods",
    groupKey: "token_management",
    labelEn: "Token entry methods",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2010,
  },
  {
    key: "token_organization",
    groupKey: "token_management",
    labelEn: "Token organization",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2020,
  },
  {
    key: "icon_or_logo_support",
    groupKey: "token_management",
    labelEn: "Service icon or logo display",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "search_capability",
    groupKey: "token_management",
    labelEn: "Token search",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "custom_token_period",
    groupKey: "token_management",
    labelEn: "Custom token period support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "custom_token_digits",
    groupKey: "token_management",
    labelEn: "Custom digit count support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2060,
  },
  // Group 3: Security & Protection (300)
  {
    key: "encryption_at_rest",
    groupKey: "security_protection",
    labelEn: "Encryption at rest",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 3010,
  },
  {
    key: "app_lock_method",
    groupKey: "security_protection",
    labelEn: "App lock method",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3020,
  },
  {
    key: "screenshot_protection",
    groupKey: "security_protection",
    labelEn: "Screenshot protection",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "tap_to_reveal",
    groupKey: "security_protection",
    labelEn: "Tap-to-reveal codes",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "clipboard_auto_clear",
    groupKey: "security_protection",
    labelEn: "Automatic clipboard clearing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "secure_storage_backend",
    groupKey: "security_protection",
    labelEn: "Secure storage backend",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3060,
  },
  // Group 4: Backup & Sync (400)
  {
    key: "sync_model",
    groupKey: "backup_sync",
    labelEn: "Sync model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "encrypted_backup",
    groupKey: "backup_sync",
    labelEn: "Encrypted backup",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 4020,
  },
  {
    key: "backup_methods",
    groupKey: "backup_sync",
    labelEn: "Backup methods",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4030,
  },
  {
    key: "multi_device_sync",
    groupKey: "backup_sync",
    labelEn: "Multi-device sync",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "offline_functionality",
    groupKey: "backup_sync",
    labelEn: "Offline functionality",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "automatic_backup",
    groupKey: "backup_sync",
    labelEn: "Automatic backup",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4060,
  },
  // Group 5: Platform & Access (500)
  {
    key: "supported_platforms",
    groupKey: "platform_access",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5010,
  },
  {
    key: "browser_extension",
    groupKey: "platform_access",
    labelEn: "Browser extension available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "desktop_app",
    groupKey: "platform_access",
    labelEn: "Desktop app available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "wearable_support",
    groupKey: "platform_access",
    labelEn: "Wearable device support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5040,
  },
  {
    key: "widget_support",
    groupKey: "platform_access",
    labelEn: "Home screen widget",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5050,
  },
  // Group 6: Migration & Portability (600)
  {
    key: "import_sources",
    groupKey: "migration_portability",
    labelEn: "Import sources",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6010,
  },
  {
    key: "export_formats",
    groupKey: "migration_portability",
    labelEn: "Export formats",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6020,
  },
  {
    key: "migration_ease",
    groupKey: "migration_portability",
    labelEn: "Migration ease",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "cross_app_uri_scheme",
    groupKey: "migration_portability",
    labelEn: "Standard otpauth URI scheme",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6040,
  },
  // Group 7: Usability & UX (700)
  {
    key: "auto_copy_to_clipboard",
    groupKey: "usability_ux",
    labelEn: "Auto-copy code to clipboard",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "token_countdown_display",
    groupKey: "usability_ux",
    labelEn: "Token countdown display",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "dark_mode",
    groupKey: "usability_ux",
    labelEn: "Dark mode support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "localization_languages",
    groupKey: "usability_ux",
    labelEn: "Localization support",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "accessibility_features",
    groupKey: "usability_ux",
    labelEn: "Accessibility features",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7050,
  },
  // Group 8: Openness & Audit (800)
  {
    key: "source_model",
    groupKey: "openness_audit",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "security_audit",
    groupKey: "openness_audit",
    labelEn: "Independent security audit",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "reproducible_builds",
    groupKey: "openness_audit",
    labelEn: "Reproducible builds",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8030,
  },
  {
    key: "license_type",
    groupKey: "openness_audit",
    labelEn: "License type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8040,
  },
  {
    key: "community_contributions",
    groupKey: "openness_audit",
    labelEn: "Community contributions accepted",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8050,
  },
  // Group 9: Pricing & Fit (900)
  {
    key: "free_tier_available",
    groupKey: "pricing_fit",
    labelEn: "Free tier available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9010,
  },
  {
    key: "pricing_model",
    groupKey: "pricing_fit",
    labelEn: "Pricing model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "premium_features_scope",
    groupKey: "pricing_fit",
    labelEn: "Premium features scope",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "fit_profiles",
    groupKey: "pricing_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9040,
  },
];

const requiredOptionsByCriterion = {
  supported_otp_algorithms: ["sha1", "sha256", "sha512"],
  token_entry_methods: ["qr_scan", "manual_entry", "uri_import", "nfc"],
  token_organization: ["folders", "tags", "favorites", "custom_icons"],
  app_lock_method: ["biometric", "pin", "password", "device_lock"],
  secure_storage_backend: [
    "keystore_keychain",
    "encrypted_file",
    "custom_vault",
    "unspecified",
  ],
  sync_model: [
    "cloud_vendor",
    "self_hosted",
    "local_only",
    "third_party_cloud",
    "no_sync",
  ],
  backup_methods: [
    "cloud_backup",
    "encrypted_file_export",
    "qr_code_export",
    "manual_key_copy",
    "device_transfer",
  ],
  supported_platforms: ["android", "ios", "windows", "macos", "linux"],
  wearable_support: ["wear_os", "watchos", "none"],
  import_sources: [
    "google_authenticator",
    "authy",
    "aegis",
    "2fas",
    "andotp",
    "freeotp",
    "raivo",
    "generic_qr",
    "generic_uri",
    "generic_file",
  ],
  export_formats: ["encrypted_file", "plain_text_file", "qr_codes", "uri_list"],
  migration_ease: [
    "one_click_import",
    "file_based_import",
    "manual_reentry",
    "no_export",
  ],
  localization_languages: ["many_languages", "few_languages", "english_only"],
  source_model: [
    "open_source",
    "source_available",
    "partial_open",
    "proprietary",
  ],
  license_type: [
    "gpl",
    "agpl",
    "apache",
    "mit",
    "bsd",
    "other_osi",
    "proprietary",
  ],
  pricing_model: [
    "free_only",
    "freemium",
    "subscription",
    "one_time_purchase",
    "donation_based",
  ],
  premium_features_scope: [
    "all_free",
    "backup_sync_paid",
    "advanced_paid",
    "enterprise_only",
  ],
  fit_profiles: [
    "personal",
    "privacy_focused",
    "developer",
    "enterprise",
    "family",
    "self_hoster",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  source_model: {
    open_source: "positive",
    proprietary: "warning",
  },
  secure_storage_backend: {
    keystore_keychain: "positive",
    unspecified: "tradeoff",
  },
  migration_ease: {
    one_click_import: "positive",
    no_export: "warning",
  },
  license_type: {
    proprietary: "warning",
  },
} as const satisfies Record<
  string,
  Record<string, "warning" | "tradeoff" | "positive" | "neutral" | "negative">
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

describe("2fa-authenticator matrix criteria migration", () => {
  it("adds the repository-owned migration for 2fa-authenticator matrix metadata", () => {
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

  it("defines ordered 2fa-authenticator criterion groups with localized labels", () => {
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

  it("defines category-native 2fa-authenticator criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'2fa-authenticator'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'2fa-authenticator'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(84);
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
