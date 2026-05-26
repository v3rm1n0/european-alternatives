import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "version-control";
const migrationVersion = "033-version-control-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/033-version-control-matrix-criteria.sql",
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
    key: "platform_model",
    labelEn: "Platform & Deployment",
    sortOrder: 100,
  },
  {
    key: "repository_features",
    labelEn: "Repository & Code Management",
    sortOrder: 200,
  },
  {
    key: "collaboration_workflow",
    labelEn: "Collaboration & Workflow",
    sortOrder: 300,
  },
  {
    key: "ecosystem_integration",
    labelEn: "Ecosystem & Integration",
    sortOrder: 400,
  },
  {
    key: "data_protection_privacy",
    labelEn: "Data Protection & Privacy",
    sortOrder: 500,
  },
  {
    key: "security_access",
    labelEn: "Security & Access",
    sortOrder: 600,
  },
  {
    key: "openness_governance",
    labelEn: "Openness & Governance",
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
  // Group 1: Platform & Deployment (100)
  {
    key: "hosting_model",
    groupKey: "platform_model",
    labelEn: "Hosting model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 1010,
  },
  {
    key: "self_hosting_available",
    groupKey: "platform_model",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "federation_support",
    groupKey: "platform_model",
    labelEn: "Federation support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "container_deployment",
    groupKey: "platform_model",
    labelEn: "Container deployment support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "migration_import_tools",
    groupKey: "platform_model",
    labelEn: "Migration / import tools",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1050,
  },
  // Group 2: Repository & Code Management (200)
  {
    key: "vcs_backend",
    groupKey: "repository_features",
    labelEn: "VCS backend",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2010,
  },
  {
    key: "repository_size_limit",
    groupKey: "repository_features",
    labelEn: "Repository size limit",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "lfs_support",
    groupKey: "repository_features",
    labelEn: "Git LFS support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "code_review_tools",
    groupKey: "repository_features",
    labelEn: "Built-in code review",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "code_search",
    groupKey: "repository_features",
    labelEn: "Code search",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "branch_protection",
    groupKey: "repository_features",
    labelEn: "Branch protection rules",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2060,
  },
  // Group 3: Collaboration & Workflow (300)
  {
    key: "issue_tracking",
    groupKey: "collaboration_workflow",
    labelEn: "Built-in issue tracking",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "project_boards",
    groupKey: "collaboration_workflow",
    labelEn: "Project boards / kanban",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "ci_cd_builtin",
    groupKey: "collaboration_workflow",
    labelEn: "Built-in CI/CD",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "wiki_support",
    groupKey: "collaboration_workflow",
    labelEn: "Built-in wiki / documentation",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "discussion_forum",
    groupKey: "collaboration_workflow",
    labelEn: "Discussion / forum feature",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "organization_support",
    groupKey: "collaboration_workflow",
    labelEn: "Organization / team management",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3060,
  },
  // Group 4: Ecosystem & Integration (400)
  {
    key: "package_registry",
    groupKey: "ecosystem_integration",
    labelEn: "Package registry",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4010,
  },
  {
    key: "api_available",
    groupKey: "ecosystem_integration",
    labelEn: "API available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "webhook_support",
    groupKey: "ecosystem_integration",
    labelEn: "Webhook support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "third_party_integrations",
    groupKey: "ecosystem_integration",
    labelEn: "Third-party integrations",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "pages_static_hosting",
    groupKey: "ecosystem_integration",
    labelEn: "Static site hosting (Pages)",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4050,
  },
  // Group 5: Data Protection & Privacy (500)
  {
    key: "data_processing_location",
    groupKey: "data_protection_privacy",
    labelEn: "Data processing location",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 5010,
  },
  {
    key: "gdpr_dpa_available",
    groupKey: "data_protection_privacy",
    labelEn: "GDPR DPA available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "data_portability",
    groupKey: "data_protection_privacy",
    labelEn: "Data portability",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "telemetry_opt_out",
    groupKey: "data_protection_privacy",
    labelEn: "Telemetry opt-out available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "private_repos_available",
    groupKey: "data_protection_privacy",
    labelEn: "Private repositories available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5050,
  },
  // Group 6: Security & Access (600)
  {
    key: "two_factor_auth",
    groupKey: "security_access",
    labelEn: "Two-factor authentication",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "ssh_key_auth",
    groupKey: "security_access",
    labelEn: "SSH key authentication",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "commit_signing",
    groupKey: "security_access",
    labelEn: "Commit signing support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "access_control_model",
    groupKey: "security_access",
    labelEn: "Access control model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "dependency_scanning",
    groupKey: "security_access",
    labelEn: "Dependency vulnerability scanning",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6050,
  },
  // Group 7: Openness & Governance (700)
  {
    key: "source_code_model",
    groupKey: "openness_governance",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "license_type",
    groupKey: "openness_governance",
    labelEn: "License type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "governance_model",
    groupKey: "openness_governance",
    labelEn: "Governance model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "community_contributions",
    groupKey: "openness_governance",
    labelEn: "Community contributions accepted",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "forge_software",
    groupKey: "openness_governance",
    labelEn: "Forge software used",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7050,
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
    labelEn: "Free tier available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "storage_quota",
    groupKey: "pricing_fit",
    labelEn: "Storage quota (free tier)",
    valueType: "enum",
    semantics: "tradeoff",
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
  hosting_model: ["saas", "self_hosted", "hybrid", "open_source_saas"],
  vcs_backend: ["git", "mercurial", "svn", "multi_vcs"],
  repository_size_limit: ["unlimited", "generous", "moderate", "restrictive"],
  package_registry: [
    "npm",
    "maven",
    "pypi",
    "nuget",
    "container",
    "generic",
    "none_available",
  ],
  data_processing_location: ["eu_only", "eu_primary", "global", "unspecified"],
  access_control_model: ["fine_grained", "role_based", "basic"],
  third_party_integrations: ["large", "medium", "small", "api_only"],
  source_code_model: [
    "open_source",
    "source_available",
    "proprietary",
    "open_core",
  ],
  license_type: [
    "mit",
    "gpl",
    "agpl",
    "apache",
    "proprietary",
    "bsl",
    "other_osi",
  ],
  governance_model: ["community", "foundation", "corporate", "single_vendor"],
  forge_software: ["forgejo", "gitea", "gitlab_ce", "custom"],
  pricing_model: [
    "free_open_source",
    "freemium",
    "subscription",
    "donation_based",
  ],
  storage_quota: ["unlimited", "generous", "moderate", "limited"],
  fit_profiles: [
    "open_source_project",
    "solo_developer",
    "small_team",
    "enterprise",
    "education",
    "nonprofit",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  hosting_model: {
    open_source_saas: "positive",
  },
  repository_size_limit: {
    unlimited: "positive",
    restrictive: "warning",
  },
  data_processing_location: {
    eu_only: "positive",
    global: "warning",
    unspecified: "warning",
  },
  access_control_model: {
    fine_grained: "positive",
  },
  third_party_integrations: {
    large: "positive",
  },
  source_code_model: {
    open_source: "positive",
    proprietary: "warning",
    open_core: "tradeoff",
  },
  license_type: {
    proprietary: "warning",
    bsl: "tradeoff",
  },
  governance_model: {
    community: "positive",
    foundation: "positive",
  },
  pricing_model: {
    free_open_source: "positive",
  },
  storage_quota: {
    unlimited: "positive",
    limited: "warning",
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

describe("version-control matrix criteria migration", () => {
  it("adds the repository-owned migration for version-control matrix metadata", () => {
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

  it("defines ordered version-control criterion groups with localized labels", () => {
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

  it("defines category-native version-control criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'version-control'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'version-control'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(63);
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

    expect(expectedCriteria.length).toBe(41);
    expect(criterionRows).toHaveLength(41);
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
