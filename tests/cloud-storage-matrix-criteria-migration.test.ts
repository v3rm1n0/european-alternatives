import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../scripts/migrations/007-cloud-storage-matrix-criteria.sql",
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
    key: "storage_plans",
    labelEn: "Storage & Plans",
    germanHints: ["speicher", "tarife"],
    sortOrder: 100,
  },
  {
    key: "sync_access",
    labelEn: "Sync & Access",
    germanHints: ["sync", "zugriff"],
    sortOrder: 200,
  },
  {
    key: "sharing_collaboration",
    labelEn: "Sharing & Collaboration",
    germanHints: ["freigabe", "zusammenarbeit"],
    sortOrder: 300,
  },
  {
    key: "security_privacy",
    labelEn: "Security & Privacy",
    germanHints: ["sicherheit", "datenschutz"],
    sortOrder: 400,
  },
  {
    key: "data_location_compliance",
    labelEn: "Data Location & Compliance",
    germanHints: ["datenstandort", "compliance"],
    sortOrder: 500,
  },
  {
    key: "recovery_portability",
    labelEn: "Recovery & Portability",
    germanHints: ["wiederherstellung", "portabilität"],
    sortOrder: 600,
  },
  {
    key: "team_admin_integrations",
    labelEn: "Team Admin & Integrations",
    germanHints: ["team-administration", "integrationen"],
    sortOrder: 700,
  },
] as const;

type CriterionExpectation = {
  key: string;
  groupKey: (typeof expectedGroups)[number]["key"];
  labelEn: string;
  germanHints: string[];
  valueType: (typeof allowedValueTypes)[number];
  semantics: (typeof allowedSemantics)[number];
  filterMode: (typeof allowedFilterModes)[number];
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
  {
    key: "service_model",
    groupKey: "storage_plans",
    labelEn: "Service model",
    germanHints: ["dienstmodell"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "free_tier_storage_gb",
    groupKey: "storage_plans",
    labelEn: "Free-tier storage (GB)",
    germanHints: ["gratis", "speicher"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 1020,
  },
  {
    key: "personal_plan_storage_gb",
    groupKey: "storage_plans",
    labelEn: "Personal plan storage (GB)",
    germanHints: ["privattarif", "speicher"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 1030,
  },
  {
    key: "max_single_file_size_gb",
    groupKey: "storage_plans",
    labelEn: "Maximum single-file size (GB)",
    germanHints: ["maximale", "einzeldateigröße"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 1040,
  },
  {
    key: "storage_expansion_model",
    groupKey: "storage_plans",
    labelEn: "Storage expansion model",
    germanHints: ["speichererweiterung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "bandwidth_transfer_policy",
    groupKey: "storage_plans",
    labelEn: "Bandwidth/transfer policy",
    germanHints: ["bandbreiten", "transfer"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1060,
  },
  {
    key: "supported_platforms",
    groupKey: "sync_access",
    labelEn: "Supported platforms",
    germanHints: ["plattform"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2010,
  },
  {
    key: "desktop_sync_client",
    groupKey: "sync_access",
    labelEn: "Desktop sync client",
    germanHints: ["desktop", "sync"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2020,
  },
  {
    key: "browser_access",
    groupKey: "sync_access",
    labelEn: "Browser access",
    germanHints: ["browser"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "virtual_drive",
    groupKey: "sync_access",
    labelEn: "Virtual drive mode",
    germanHints: ["virtuelles", "laufwerk"],
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "selective_sync",
    groupKey: "sync_access",
    labelEn: "Selective sync",
    germanHints: ["selektive", "synchronisierung"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "offline_access",
    groupKey: "sync_access",
    labelEn: "Offline access",
    germanHints: ["offline"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2060,
  },
  {
    key: "automatic_camera_upload",
    groupKey: "sync_access",
    labelEn: "Automatic camera upload",
    germanHints: ["kamera", "upload"],
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2070,
  },
  {
    key: "search_preview_scope",
    groupKey: "sync_access",
    labelEn: "Search and preview scope",
    germanHints: ["such", "vorschau"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2080,
  },
  {
    key: "share_links",
    groupKey: "sharing_collaboration",
    labelEn: "Share links",
    germanHints: ["freigabelinks"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 3010,
  },
  {
    key: "link_access_controls",
    groupKey: "sharing_collaboration",
    labelEn: "Link access controls",
    germanHints: ["zugriffskontrollen", "links"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3020,
  },
  {
    key: "file_requests",
    groupKey: "sharing_collaboration",
    labelEn: "File requests/drop folders",
    germanHints: ["dateianfragen", "upload"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "shared_folders",
    groupKey: "sharing_collaboration",
    labelEn: "Shared folders",
    germanHints: ["geteilte", "ordner"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "external_collaboration_model",
    groupKey: "sharing_collaboration",
    labelEn: "External collaboration model",
    germanHints: ["externe", "zusammenarbeit"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "collaborative_editing",
    groupKey: "sharing_collaboration",
    labelEn: "Collaborative document editing",
    germanHints: ["gemeinsame", "dokumentbearbeitung"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3060,
  },
  {
    key: "encryption_model",
    groupKey: "security_privacy",
    labelEn: "Encryption model",
    germanHints: ["verschlüsselungsmodell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "encrypted_sharing_available",
    groupKey: "security_privacy",
    labelEn: "Encrypted sharing available",
    germanHints: ["verschlüsselte", "freigabe"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "two_factor_auth",
    groupKey: "security_privacy",
    labelEn: "Two-factor authentication",
    germanHints: ["zwei-faktor"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "account_recovery_model",
    groupKey: "security_privacy",
    labelEn: "Account recovery model",
    germanHints: ["kontowiederherstellung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "customer_managed_keys",
    groupKey: "security_privacy",
    labelEn: "Customer-managed keys",
    germanHints: ["kundenseitig", "schlüssel"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "ransomware_protection",
    groupKey: "security_privacy",
    labelEn: "Ransomware protection controls",
    germanHints: ["ransomware", "schutz"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4060,
  },
  {
    key: "storage_region_model",
    groupKey: "data_location_compliance",
    labelEn: "Storage region model",
    germanHints: ["speicherregion"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 5010,
  },
  {
    key: "eu_storage_available",
    groupKey: "data_location_compliance",
    labelEn: "EU storage available",
    germanHints: ["eu", "speicherung"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 5020,
  },
  {
    key: "user_selectable_region",
    groupKey: "data_location_compliance",
    labelEn: "User-selectable region",
    germanHints: ["nutzerwählbare", "region"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "hosting_infrastructure_model",
    groupKey: "data_location_compliance",
    labelEn: "Hosting infrastructure model",
    germanHints: ["hosting", "infrastruktur"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "data_processing_agreement",
    groupKey: "data_location_compliance",
    labelEn: "Data processing agreement available",
    germanHints: ["av-vertrag"],
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5050,
  },
  {
    key: "compliance_profiles",
    groupKey: "data_location_compliance",
    labelEn: "Compliance profiles",
    germanHints: ["compliance"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5060,
  },
  {
    key: "file_versioning_available",
    groupKey: "recovery_portability",
    labelEn: "File versioning available",
    germanHints: ["dateiversionierung"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "version_history_days",
    groupKey: "recovery_portability",
    labelEn: "Version history retention (days)",
    germanHints: ["versionen", "tage"],
    valueType: "number",
    semantics: "beneficial",
    filterMode: "range",
    sortOrder: 6020,
  },
  {
    key: "deleted_file_retention_days",
    groupKey: "recovery_portability",
    labelEn: "Deleted-file retention (days)",
    germanHints: ["gelöschter", "dateien"],
    valueType: "number",
    semantics: "beneficial",
    filterMode: "range",
    sortOrder: 6030,
  },
  {
    key: "full_account_export",
    groupKey: "recovery_portability",
    labelEn: "Full account export",
    germanHints: ["kontoexport"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "open_protocol_access",
    groupKey: "recovery_portability",
    labelEn: "Open protocol access",
    germanHints: ["offener", "protokoll"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6050,
  },
  {
    key: "migration_import_sources",
    groupKey: "recovery_portability",
    labelEn: "Migration import sources",
    germanHints: ["migrationsimport"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6060,
  },
  {
    key: "team_workspaces",
    groupKey: "team_admin_integrations",
    labelEn: "Team workspaces",
    germanHints: ["team-arbeitsbereiche"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "role_permissions",
    groupKey: "team_admin_integrations",
    labelEn: "Role and permission model",
    germanHints: ["rollen", "berechtigungsmodell"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "admin_console",
    groupKey: "team_admin_integrations",
    labelEn: "Admin console",
    germanHints: ["administrationskonsole"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "sharing_policy_controls",
    groupKey: "team_admin_integrations",
    labelEn: "Sharing policy controls",
    germanHints: ["richtlinien", "freigaben"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7040,
  },
  {
    key: "audit_logs",
    groupKey: "team_admin_integrations",
    labelEn: "Audit logs",
    germanHints: ["audit", "protokolle"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7050,
  },
  {
    key: "sso_available",
    groupKey: "team_admin_integrations",
    labelEn: "SSO available",
    germanHints: ["sso"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7060,
  },
  {
    key: "integration_support",
    groupKey: "team_admin_integrations",
    labelEn: "Integration support",
    germanHints: ["integrationsunterstützung"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7070,
  },
];

const requiredOptionsByCriterion = {
  service_model: [
    "hosted_file_sync",
    "encrypted_drive",
    "self_hostable_platform",
    "storage_box",
    "object_storage",
  ],
  storage_expansion_model: [
    "fixed_plans",
    "per_user_quota",
    "pooled_team_storage",
    "usage_based",
    "self_hosted_capacity",
  ],
  bandwidth_transfer_policy: [
    "unmetered",
    "fair_use",
    "fixed_quota",
    "plan_dependent",
    "throttled_after_limit",
  ],
  supported_platforms: [
    "web",
    "windows",
    "macos",
    "linux",
    "ios",
    "android",
    "f_droid",
    "nas",
  ],
  search_preview_scope: [
    "none",
    "filename_only",
    "full_text",
    "media_preview",
    "office_preview",
  ],
  link_access_controls: [
    "password",
    "expiration",
    "download_disable",
    "upload_only",
    "recipient_allowlist",
    "view_only",
  ],
  external_collaboration_model: [
    "public_links",
    "guest_accounts",
    "account_required",
    "federated_shares",
  ],
  collaborative_editing: [
    "none",
    "integrated_office",
    "external_office_integration",
    "comments_only",
  ],
  encryption_model: [
    "server_side_encryption",
    "client_side_optional",
    "zero_knowledge_default",
    "user_managed_keys",
    "external_encryption_required",
  ],
  account_recovery_model: [
    "provider_reset",
    "recovery_key",
    "admin_recovery",
    "no_provider_recovery",
  ],
  ransomware_protection: [
    "version_history",
    "mass_restore",
    "suspicious_activity_detection",
    "immutable_snapshots",
  ],
  storage_region_model: [
    "eu_only",
    "country_specific",
    "user_selectable_region",
    "provider_selected_region",
    "global_or_mixed",
    "customer_controlled_self_hosted",
  ],
  hosting_infrastructure_model: [
    "own_datacenters",
    "eu_cloud_provider",
    "hyperscaler",
    "customer_controlled",
    "mixed",
  ],
  compliance_profiles: ["gdpr_dpa", "iso_27001", "soc2", "bsi_c5", "hipaa"],
  open_protocol_access: [
    "webdav",
    "s3_compatible",
    "rclone_supported",
    "rsync_sftp",
    "nextcloud_sync",
    "rest_api",
    "proprietary_only",
  ],
  migration_import_sources: [
    "google_drive",
    "dropbox",
    "onedrive",
    "webdav",
    "local_folder",
    "other_cloud_import",
  ],
  role_permissions: [
    "owner_admin",
    "editor",
    "viewer",
    "upload_only",
    "guest_external",
    "granular_folder_roles",
  ],
  sharing_policy_controls: [
    "disable_public_links",
    "domain_allowlist",
    "expiry_required",
    "download_restrictions",
    "remote_wipe",
    "dlp",
  ],
  integration_support: [
    "office_suite",
    "backup_tools",
    "cli",
    "webhooks",
    "automation_platforms",
    "productivity_suite",
  ],
} as const;

const forbiddenGenericCriterionKeys = [
  "headquarters_country",
  "privacy_policy",
  "open_source",
  "business_model",
  "tracking",
  "gdpr_compliance",
  "eu_company",
] as const;

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\r\n]*/g, "");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function windowsForLiteral(value: string, radius = 700): string[] {
  const literal = sqlStringLiteral(value);
  const windows: string[] = [];
  let index = migrationSql.indexOf(literal);

  while (index !== -1) {
    windows.push(
      migrationSql.slice(
        Math.max(0, index - radius),
        Math.min(migrationSql.length, index + literal.length + radius),
      ),
    );
    index = migrationSql.indexOf(literal, index + literal.length);
  }

  return windows;
}

function windowForLiteral(
  value: string,
  requiredLiterals: string[] = [],
): string {
  const windows = windowsForLiteral(value);
  const required = requiredLiterals.map(sqlStringLiteral);

  return (
    windows.find((window) =>
      required.every((literal) => window.includes(literal)),
    ) ??
    windows[0] ??
    ""
  );
}

function expectSqlLiteral(value: string): void {
  expect(migrationSql).toContain(sqlStringLiteral(value));
}

function expectWindowContainsSqlLiterals(
  window: string,
  values: string[],
): void {
  for (const value of values) {
    expect(window).toContain(sqlStringLiteral(value));
  }
}

function expectWindowContainsGermanHints(
  window: string,
  hints: readonly string[],
): void {
  const lowerWindow = window.toLowerCase();

  for (const hint of hints) {
    expect(lowerWindow).toContain(hint);
  }
}

function expectWindowContainsNumber(window: string, value: number): void {
  expect(window).toMatch(new RegExp(`\\b${value}\\b`));
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

describe("cloud storage matrix criteria migration", () => {
  it("adds the repository-owned migration for Cloud Storage matrix metadata", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedMigration).toMatch(
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?matrix_criterion_groups`?/i,
    );
    expect(normalizedMigration).toMatch(
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?matrix_criteria`?/i,
    );
    expect(normalizedMigration).toMatch(
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?matrix_criterion_options`?/i,
    );
    expect(normalizedMigration).toMatch(
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?schema_migrations`?[\s\S]*'007-cloud-storage-matrix-criteria'/i,
    );
  });

  it("defines user-readable Cloud Storage criterion groups with English and German labels", () => {
    for (const group of expectedGroups) {
      const window = windowForLiteral(group.key, [group.labelEn]);

      expectSqlLiteral(group.key);
      expectWindowContainsSqlLiterals(window, ["cloud-storage", group.labelEn]);
      expectWindowContainsGermanHints(window, group.germanHints);
      expectWindowContainsNumber(window, group.sortOrder);
    }
  });

  it("defines category-native Cloud Storage criteria with valid metadata and localized labels", () => {
    const seenCriterionKeys = new Set<string>();
    const seenSortOrders = new Set<number>();

    expect(expectedCriteria).toHaveLength(45);

    for (const criterion of expectedCriteria) {
      const window = windowForLiteral(criterion.key, [criterion.labelEn]);

      expect(seenCriterionKeys.has(criterion.key)).toBe(false);
      seenCriterionKeys.add(criterion.key);
      expect(seenSortOrders.has(criterion.sortOrder)).toBe(false);
      seenSortOrders.add(criterion.sortOrder);
      expectSqlLiteral(criterion.key);
      expectWindowContainsSqlLiterals(window, [
        "cloud-storage",
        criterion.groupKey,
        criterion.labelEn,
        criterion.valueType,
        criterion.semantics,
        criterion.filterMode,
      ]);
      expectWindowContainsGermanHints(window, criterion.germanHints);
      expectWindowContainsNumber(window, criterion.sortOrder);
    }

    for (const valueType of allowedValueTypes) {
      if (
        !expectedCriteria.some((criterion) => criterion.valueType === valueType)
      ) {
        continue;
      }
      expectSqlLiteral(valueType);
    }

    for (const semantics of allowedSemantics) {
      if (
        !expectedCriteria.some((criterion) => criterion.semantics === semantics)
      ) {
        continue;
      }
      expectSqlLiteral(semantics);
    }

    for (const filterMode of allowedFilterModes) {
      if (
        !expectedCriteria.some(
          (criterion) => criterion.filterMode === filterMode,
        )
      ) {
        continue;
      }
      expectSqlLiteral(filterMode);
    }

    for (const forbiddenKey of forbiddenGenericCriterionKeys) {
      expect(normalizedMigration).not.toContain(sqlStringLiteral(forbiddenKey));
    }
  });

  it("keeps group and criterion seed rows scoped to only the reviewed Cloud Storage metadata", () => {
    const groupRows = parseGroupRows();
    const criterionRows = parseCriterionRows();
    const expectedGroupKeys = expectedGroups.map((group) => group.key);
    const expectedCriterionKeys = expectedCriteria.map(
      (criterion) => criterion.key,
    );

    expect(groupRows).toHaveLength(expectedGroups.length);
    expect(groupRows.map((group) => group.groupKey)).toEqual(expectedGroupKeys);

    for (const group of groupRows) {
      expect(group.categoryId).toBe("cloud-storage");
      expect(group.labelEn).not.toEqual("");
      expect(group.labelDe).not.toEqual("");
      expect(group.descriptionEn).not.toEqual("");
      expect(group.descriptionDe).not.toEqual("");
    }

    expect(criterionRows).toHaveLength(expectedCriteria.length);
    expect(criterionRows.map((criterion) => criterion.criterionKey)).toEqual(
      expectedCriterionKeys,
    );

    for (const criterion of criterionRows) {
      expect(criterion.categoryId).toBe("cloud-storage");
      expect(expectedGroupKeys).toContain(criterion.groupKey);
      expect(allowedValueTypes).toContain(
        criterion.valueType as (typeof allowedValueTypes)[number],
      );
      expect(allowedSemantics).toContain(
        criterion.semantics as (typeof allowedSemantics)[number],
      );
      expect(allowedFilterModes).toContain(
        criterion.filterMode as (typeof allowedFilterModes)[number],
      );
      expect(criterion.labelEn).not.toEqual("");
      expect(criterion.labelDe).not.toEqual("");
      expect(criterion.helpTextEn).not.toEqual("");
      expect(criterion.helpTextDe).not.toEqual("");
    }
  });

  it("provides concrete options for every enum and multi-enum criterion", () => {
    const optionsSql = insertStatementsFor("matrix_criterion_options").join(
      "\n",
    );
    const optionCriteria = new Set(Object.keys(requiredOptionsByCriterion));

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

    for (const [criterionKey, optionKeys] of Object.entries(
      requiredOptionsByCriterion,
    )) {
      expectSqlLiteral(criterionKey);

      for (const optionKey of optionKeys) {
        const window = windowForLiteral(criterionKey, [optionKey]);

        expectWindowContainsSqlLiterals(window, [criterionKey, optionKey]);
      }
    }

    expect(optionsSql).not.toContain(sqlStringLiteral("unknown"));
  });

  it("defines localized option metadata with valid display tones and stable ordering", () => {
    const optionRows = parseOptionRows();
    const optionRowsByCriterion = new Map<string, OptionRow[]>();

    expect(optionRows.length).toBeGreaterThan(0);

    for (const option of optionRows) {
      expect(option.categoryId).toBe("cloud-storage");
      expect(Object.keys(requiredOptionsByCriterion)).toContain(
        option.criterionKey,
      );
      expect(allowedDisplayTones).toContain(
        option.displayTone as (typeof allowedDisplayTones)[number],
      );
      expect(option.labelEn).not.toEqual("");
      expect(option.labelDe).not.toEqual("");
      expect(option.sortOrder).toBeGreaterThan(0);

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

      for (const option of rows) {
        expect(optionKeys).toContain(
          option.optionKey as (typeof optionKeys)[number],
        );
        expect(seenSortOrders.has(option.sortOrder)).toBe(false);
        seenSortOrders.add(option.sortOrder);
      }
    }
  });

  it("creates only open placeholder facts and avoids Trust Score or product fact values", () => {
    const factSql = insertStatementsFor("matrix_facts").join("\n");

    expect(factSql).not.toEqual("");
    expect(normalizeSql(factSql)).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?\s*\(\s*`?entry_id`?\s*,\s*`?category_id`?\s*,\s*`?criterion_id`?\s*,\s*`?status`?\s*\)/i,
    );
    expect(normalizeSql(factSql)).toMatch(/\bSELECT\b[\s\S]*'open'/i);
    expect(normalizeSql(factSql)).toMatch(
      /\bJOIN\s+`?entry_categories`?[\s\S]*'cloud-storage'/i,
    );
    expect(normalizeSql(factSql)).toMatch(
      /\bJOIN\s+`?matrix_criteria`?[\s\S]*'cloud-storage'/i,
    );
    expect(normalizeSql(factSql)).toMatch(/`?status`?\s*=\s*'alternative'/i);
    expect(normalizeSql(factSql)).toMatch(/`?is_active`?\s*=\s*1/i);

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
});
