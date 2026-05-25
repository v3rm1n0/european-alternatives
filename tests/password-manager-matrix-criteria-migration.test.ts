import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "password-manager";
const migrationVersion = "023-password-manager-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/023-password-manager-matrix-criteria.sql",
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
    key: "vault_credential_types",
    labelEn: "Vault & Credential Types",
    sortOrder: 100,
  },
  {
    key: "security_encryption",
    labelEn: "Security & Encryption",
    sortOrder: 200,
  },
  {
    key: "authentication_access",
    labelEn: "Authentication & Access",
    sortOrder: 300,
  },
  {
    key: "platform_autofill",
    labelEn: "Platform & Autofill",
    sortOrder: 400,
  },
  {
    key: "sharing_team_features",
    labelEn: "Sharing & Team Features",
    sortOrder: 500,
  },
  {
    key: "sync_architecture",
    labelEn: "Sync & Architecture",
    sortOrder: 600,
  },
  {
    key: "import_export_portability",
    labelEn: "Import, Export & Portability",
    sortOrder: 700,
  },
  {
    key: "password_generation_tools",
    labelEn: "Password Generation & Tools",
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
  // Group 1: Vault & Credential Types (100)
  {
    key: "credential_types",
    groupKey: "vault_credential_types",
    labelEn: "Supported credential types",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1010,
  },
  {
    key: "custom_fields",
    groupKey: "vault_credential_types",
    labelEn: "Custom fields",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "folder_organization",
    groupKey: "vault_credential_types",
    labelEn: "Folder or collection organization",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "tags_support",
    groupKey: "vault_credential_types",
    labelEn: "Tag-based organization",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "secure_notes",
    groupKey: "vault_credential_types",
    labelEn: "Secure notes",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "file_attachments",
    groupKey: "vault_credential_types",
    labelEn: "Encrypted file attachments",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1060,
  },
  // Group 2: Security & Encryption (200)
  {
    key: "encryption_model",
    groupKey: "security_encryption",
    labelEn: "Encryption model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 2010,
  },
  {
    key: "key_derivation",
    groupKey: "security_encryption",
    labelEn: "Key derivation function",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "zero_knowledge",
    groupKey: "security_encryption",
    labelEn: "Zero-knowledge architecture",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2030,
  },
  {
    key: "security_audit",
    groupKey: "security_encryption",
    labelEn: "Independent security audit",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "breach_monitoring",
    groupKey: "security_encryption",
    labelEn: "Breach monitoring",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "password_health_report",
    groupKey: "security_encryption",
    labelEn: "Password health report",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2060,
  },
  {
    key: "e2ee_sharing",
    groupKey: "security_encryption",
    labelEn: "End-to-end encrypted sharing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2070,
  },
  // Group 3: Authentication & Access (300)
  {
    key: "master_password_model",
    groupKey: "authentication_access",
    labelEn: "Master password model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "biometric_unlock",
    groupKey: "authentication_access",
    labelEn: "Biometric unlock",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "hardware_key_support",
    groupKey: "authentication_access",
    labelEn: "Hardware security key support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "two_factor_methods",
    groupKey: "authentication_access",
    labelEn: "Supported 2FA methods",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3040,
  },
  {
    key: "passwordless_unlock",
    groupKey: "authentication_access",
    labelEn: "Passwordless unlock option",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "emergency_access",
    groupKey: "authentication_access",
    labelEn: "Emergency access",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3060,
  },
  // Group 4: Platform & Autofill (400)
  {
    key: "supported_platforms",
    groupKey: "platform_autofill",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4010,
  },
  {
    key: "browser_extensions",
    groupKey: "platform_autofill",
    labelEn: "Browser extensions",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4020,
  },
  {
    key: "autofill_capability",
    groupKey: "platform_autofill",
    labelEn: "Autofill capability",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4030,
  },
  {
    key: "offline_access",
    groupKey: "platform_autofill",
    labelEn: "Offline vault access",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "cli_available",
    groupKey: "platform_autofill",
    labelEn: "CLI client available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4050,
  },
  // Group 5: Sharing & Team Features (500)
  {
    key: "password_sharing",
    groupKey: "sharing_team_features",
    labelEn: "Password sharing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "shared_vaults",
    groupKey: "sharing_team_features",
    labelEn: "Shared vaults or collections",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "organization_support",
    groupKey: "sharing_team_features",
    labelEn: "Organization or team support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "role_based_access",
    groupKey: "sharing_team_features",
    labelEn: "Role-based access control",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "sharing_granularity",
    groupKey: "sharing_team_features",
    labelEn: "Sharing permission granularity",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5050,
  },
  // Group 6: Sync & Architecture (600)
  {
    key: "sync_model",
    groupKey: "sync_architecture",
    labelEn: "Sync model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 6010,
  },
  {
    key: "self_hosting_available",
    groupKey: "sync_architecture",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 6020,
  },
  {
    key: "local_only_option",
    groupKey: "sync_architecture",
    labelEn: "Local-only vault option",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "open_protocol_or_format",
    groupKey: "sync_architecture",
    labelEn: "Open vault format or protocol",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "third_party_clients",
    groupKey: "sync_architecture",
    labelEn: "Third-party clients allowed",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6050,
  },
  // Group 7: Import, Export & Portability (700)
  {
    key: "import_formats",
    groupKey: "import_export_portability",
    labelEn: "Import formats",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7010,
  },
  {
    key: "export_formats",
    groupKey: "import_export_portability",
    labelEn: "Export formats",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "encrypted_export",
    groupKey: "import_export_portability",
    labelEn: "Encrypted export available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "data_portability",
    groupKey: "import_export_portability",
    labelEn: "Data portability to other managers",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7040,
  },
  // Group 8: Password Generation & Tools (800)
  {
    key: "password_generator",
    groupKey: "password_generation_tools",
    labelEn: "Password generator",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "passphrase_generator",
    groupKey: "password_generation_tools",
    labelEn: "Passphrase generator",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "username_generator",
    groupKey: "password_generation_tools",
    labelEn: "Username or email alias generator",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8030,
  },
  {
    key: "built_in_totp",
    groupKey: "password_generation_tools",
    labelEn: "Built-in TOTP authenticator",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8040,
  },
  {
    key: "send_or_secure_share",
    groupKey: "password_generation_tools",
    labelEn: "Secure one-time sharing",
    valueType: "boolean",
    semantics: "beneficial",
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
    key: "family_plan",
    groupKey: "pricing_fit",
    labelEn: "Family plan available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "source_model",
    groupKey: "pricing_fit",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9040,
  },
  {
    key: "fit_profiles",
    groupKey: "pricing_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9050,
  },
];

const requiredOptionsByCriterion = {
  credential_types: [
    "passwords",
    "passkeys",
    "totp_codes",
    "credit_cards",
    "identities",
    "secure_notes",
    "ssh_keys",
    "api_keys",
  ],
  encryption_model: ["aes_256", "xchacha20", "aes_256_gcm", "other_documented"],
  key_derivation: ["argon2", "pbkdf2", "scrypt", "bcrypt", "other"],
  master_password_model: [
    "single_master_password",
    "key_file_only",
    "master_plus_key_file",
    "account_key_model",
  ],
  two_factor_methods: [
    "totp",
    "hardware_key_u2f",
    "email",
    "push_notification",
    "duo",
  ],
  supported_platforms: ["windows", "macos", "linux", "android", "ios", "web"],
  browser_extensions: ["chrome", "firefox", "safari", "edge", "brave"],
  autofill_capability: [
    "browser_extension",
    "system_autofill",
    "mobile_autofill",
    "passkey_autofill",
  ],
  sharing_granularity: [
    "read_only",
    "read_write",
    "custom_permissions",
    "no_sharing",
  ],
  sync_model: [
    "cloud_vendor",
    "self_hosted_server",
    "local_file_sync",
    "p2p_sync",
    "no_sync",
  ],
  import_formats: [
    "csv",
    "json",
    "bitwarden_json",
    "lastpass_csv",
    "onepassword_1pux",
    "keepass_kdbx",
    "chrome_csv",
  ],
  export_formats: ["csv", "json", "encrypted_json", "keepass_kdbx"],
  data_portability: [
    "easy_standard_format",
    "vendor_specific_export",
    "manual_csv_only",
    "no_export",
  ],
  pricing_model: [
    "free_only",
    "freemium",
    "subscription",
    "one_time_license",
    "donation_based",
  ],
  source_model: [
    "open_source",
    "source_available",
    "partial_open",
    "proprietary",
  ],
  fit_profiles: [
    "personal",
    "family",
    "small_team",
    "enterprise",
    "developer",
    "privacy_focused",
    "self_hoster",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  encryption_model: {
    aes_256_gcm: "positive",
    other_documented: "tradeoff",
  },
  key_derivation: {
    argon2: "positive",
    other: "tradeoff",
  },
  master_password_model: {
    master_plus_key_file: "positive",
    key_file_only: "tradeoff",
  },
  sharing_granularity: {
    custom_permissions: "positive",
    no_sharing: "tradeoff",
  },
  data_portability: {
    easy_standard_format: "positive",
    no_export: "warning",
  },
  source_model: {
    open_source: "positive",
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

describe("password-manager matrix criteria migration", () => {
  it("adds the repository-owned migration for password-manager matrix metadata", () => {
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

  it("defines ordered password-manager criterion groups with localized labels", () => {
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

  it("defines category-native password-manager criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'password-manager'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'password-manager'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(81);
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
