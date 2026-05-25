import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "databases";
const migrationVersion = "028-databases-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/028-databases-matrix-criteria.sql",
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
    key: "database_model_query",
    labelEn: "Database Model & Query Language",
    sortOrder: 100,
  },
  {
    key: "performance_scalability",
    labelEn: "Performance & Scalability",
    sortOrder: 200,
  },
  {
    key: "deployment_operations",
    labelEn: "Deployment & Operations",
    sortOrder: 300,
  },
  {
    key: "data_protection_compliance",
    labelEn: "Data Protection & Compliance",
    sortOrder: 400,
  },
  {
    key: "security_access_control",
    labelEn: "Security & Access Control",
    sortOrder: 500,
  },
  {
    key: "ecosystem_integration",
    labelEn: "Ecosystem & Integration",
    sortOrder: 600,
  },
  {
    key: "openness_audit",
    labelEn: "Openness & Audit",
    sortOrder: 700,
  },
  {
    key: "pricing_fit",
    labelEn: "Pricing & Fit",
    sortOrder: 800,
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
  // Group 1: Database Model & Query Language (100)
  {
    key: "database_type",
    groupKey: "database_model_query",
    labelEn: "Database type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "sql_compatibility",
    groupKey: "database_model_query",
    labelEn: "SQL compatibility",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "acid_compliance",
    groupKey: "database_model_query",
    labelEn: "ACID compliance",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "json_document_support",
    groupKey: "database_model_query",
    labelEn: "JSON/document support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "full_text_search",
    groupKey: "database_model_query",
    labelEn: "Full-text search",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "geospatial_support",
    groupKey: "database_model_query",
    labelEn: "Geospatial support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1060,
  },
  {
    key: "time_series_support",
    groupKey: "database_model_query",
    labelEn: "Time-series support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1070,
  },
  // Group 2: Performance & Scalability (200)
  {
    key: "replication_model",
    groupKey: "performance_scalability",
    labelEn: "Replication model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2010,
  },
  {
    key: "horizontal_scaling",
    groupKey: "performance_scalability",
    labelEn: "Horizontal scaling",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "read_replicas",
    groupKey: "performance_scalability",
    labelEn: "Read replicas supported",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "connection_pooling",
    groupKey: "performance_scalability",
    labelEn: "Built-in connection pooling",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "partitioning_support",
    groupKey: "performance_scalability",
    labelEn: "Table partitioning",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  // Group 3: Deployment & Operations (300)
  {
    key: "self_hosting_available",
    groupKey: "deployment_operations",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 3010,
  },
  {
    key: "managed_cloud_available",
    groupKey: "deployment_operations",
    labelEn: "Managed cloud service available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "container_image",
    groupKey: "deployment_operations",
    labelEn: "Official container image available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "kubernetes_operator",
    groupKey: "deployment_operations",
    labelEn: "Kubernetes operator available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "backup_tooling",
    groupKey: "deployment_operations",
    labelEn: "Built-in backup tooling",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "upgrade_path",
    groupKey: "deployment_operations",
    labelEn: "Major version upgrade path",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3060,
  },
  // Group 4: Data Protection & Compliance (400)
  {
    key: "encryption_at_rest",
    groupKey: "data_protection_compliance",
    labelEn: "Encryption at rest",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4010,
  },
  {
    key: "encryption_in_transit",
    groupKey: "data_protection_compliance",
    labelEn: "Encryption in transit (TLS)",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "eu_managed_option",
    groupKey: "data_protection_compliance",
    labelEn: "EU-hosted managed option",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 4030,
  },
  {
    key: "data_residency_control",
    groupKey: "data_protection_compliance",
    labelEn: "Data residency control",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "gdpr_dpa_available",
    groupKey: "data_protection_compliance",
    labelEn: "GDPR DPA available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "compliance_certifications",
    groupKey: "data_protection_compliance",
    labelEn: "Compliance certifications",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4060,
  },
  // Group 5: Security & Access Control (500)
  {
    key: "authentication_methods",
    groupKey: "security_access_control",
    labelEn: "Authentication methods",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5010,
  },
  {
    key: "role_based_access",
    groupKey: "security_access_control",
    labelEn: "Role-based access control",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "row_level_security",
    groupKey: "security_access_control",
    labelEn: "Row-level security",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "audit_logging",
    groupKey: "security_access_control",
    labelEn: "Audit logging",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "field_level_encryption",
    groupKey: "security_access_control",
    labelEn: "Field-level encryption",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5050,
  },
  // Group 6: Ecosystem & Integration (600)
  {
    key: "client_library_languages",
    groupKey: "ecosystem_integration",
    labelEn: "Client library languages",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6010,
  },
  {
    key: "orm_framework_support",
    groupKey: "ecosystem_integration",
    labelEn: "ORM/framework support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "extensions_plugins",
    groupKey: "ecosystem_integration",
    labelEn: "Extensions or plugin system",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "change_data_capture",
    groupKey: "ecosystem_integration",
    labelEn: "Change data capture (CDC)",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "supported_platforms",
    groupKey: "ecosystem_integration",
    labelEn: "Supported server platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6050,
  },
  // Group 7: Openness & Audit (700)
  {
    key: "source_model",
    groupKey: "openness_audit",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "license_type",
    groupKey: "openness_audit",
    labelEn: "License type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "security_audit",
    groupKey: "openness_audit",
    labelEn: "Independent security audit",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "community_governance",
    groupKey: "openness_audit",
    labelEn: "Community governance",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7040,
  },
  // Group 8: Pricing & Fit (800)
  {
    key: "pricing_model",
    groupKey: "pricing_fit",
    labelEn: "Pricing model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "free_tier_available",
    groupKey: "pricing_fit",
    labelEn: "Free tier or community edition",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "billing_currency",
    groupKey: "pricing_fit",
    labelEn: "Billing in EUR available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8030,
  },
  {
    key: "fit_profiles",
    groupKey: "pricing_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8040,
  },
];

const requiredOptionsByCriterion = {
  database_type: [
    "relational",
    "document",
    "key_value",
    "wide_column",
    "graph",
    "time_series",
    "multi_model",
  ],
  sql_compatibility: [
    "full_sql",
    "postgresql_wire",
    "mysql_wire",
    "sql_like",
    "no_sql",
  ],
  replication_model: [
    "single_node",
    "primary_replica",
    "multi_primary",
    "consensus_based",
  ],
  backup_tooling: [
    "native_comprehensive",
    "native_basic",
    "third_party_required",
    "cloud_managed_only",
  ],
  upgrade_path: [
    "in_place",
    "rolling",
    "migration_required",
    "rebuild_required",
  ],
  compliance_certifications: [
    "iso_27001",
    "soc2",
    "bsi_c5",
    "hipaa",
    "pci_dss",
  ],
  authentication_methods: [
    "password",
    "certificate",
    "ldap",
    "kerberos",
    "iam_integration",
  ],
  client_library_languages: [
    "java",
    "python",
    "javascript",
    "go",
    "rust",
    "csharp",
    "php",
    "ruby",
  ],
  supported_platforms: [
    "linux",
    "macos",
    "windows",
    "docker",
    "kubernetes",
    "cloud_only",
  ],
  source_model: ["open_source", "source_available", "proprietary", "open_core"],
  license_type: [
    "apache",
    "mit",
    "gpl",
    "agpl",
    "bsl",
    "sspl",
    "proprietary",
    "other_osi",
  ],
  pricing_model: [
    "free_only",
    "freemium",
    "pay_per_use",
    "subscription",
    "enterprise_custom",
  ],
  fit_profiles: [
    "developer",
    "startup",
    "small_business",
    "enterprise",
    "data_analyst",
    "iot",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  sql_compatibility: {
    postgresql_wire: "positive",
    mysql_wire: "positive",
  },
  backup_tooling: {
    native_comprehensive: "positive",
  },
  upgrade_path: {
    in_place: "positive",
    rolling: "positive",
    migration_required: "tradeoff",
    rebuild_required: "warning",
  },
  compliance_certifications: {
    iso_27001: "positive",
    bsi_c5: "positive",
  },
  authentication_methods: {
    certificate: "positive",
  },
  source_model: {
    open_source: "positive",
    proprietary: "warning",
    open_core: "tradeoff",
  },
  license_type: {
    bsl: "tradeoff",
    sspl: "tradeoff",
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

describe("databases matrix criteria migration", () => {
  it("adds the repository-owned migration for databases matrix metadata", () => {
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

  it("defines ordered databases criterion groups with localized labels", () => {
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

  it("defines category-native databases criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'databases'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'databases'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(71);
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

  it("contains the expected total number of criteria rows across all groups", () => {
    const criterionRows = parseCriterionRows();

    expect(expectedCriteria.length).toBe(42);
    expect(criterionRows).toHaveLength(42);
  });

  it("uses every defined group in at least one criterion", () => {
    const criterionRows = parseCriterionRows();
    const usedGroupKeys = new Set(criterionRows.map((c) => c.groupKey));

    for (const group of expectedGroups) {
      expect(usedGroupKeys.has(group.key)).toBe(true);
    }
  });

  it("keeps criteria sort orders within the numeric range of their parent group", () => {
    const criterionRows = parseCriterionRows();
    const groupSortOrderByKey = new Map(
      expectedGroups.map((g) => [g.key, g.sortOrder]),
    );

    for (const criterion of criterionRows) {
      const groupSortOrder = groupSortOrderByKey.get(criterion.groupKey);

      expect(groupSortOrder).toBeDefined();

      const rangeMin = groupSortOrder! * 10 + 1;
      const rangeMax = groupSortOrder! * 10 + 99;

      expect(criterion.sortOrder).toBeGreaterThanOrEqual(rangeMin);
      expect(criterion.sortOrder).toBeLessThanOrEqual(rangeMax);
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
