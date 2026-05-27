import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "photo-management";
const migrationVersion = "049-photo-management-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/049-photo-management-matrix-criteria.sql",
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
    key: "library_organization",
    labelEn: "Library & Organization",
    sortOrder: 100,
  },
  {
    key: "storage_backup",
    labelEn: "Storage & Backup",
    sortOrder: 200,
  },
  {
    key: "sharing_collaboration",
    labelEn: "Sharing & Collaboration",
    sortOrder: 300,
  },
  {
    key: "editing_enhancement",
    labelEn: "Editing & Enhancement",
    sortOrder: 400,
  },
  {
    key: "platform_access",
    labelEn: "Platform & Access",
    sortOrder: 500,
  },
  {
    key: "privacy_data",
    labelEn: "Privacy & Data",
    sortOrder: 600,
  },
  {
    key: "openness_standards",
    labelEn: "Openness & Standards",
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
  // Group 1: Library & Organization (100)
  {
    key: "photo_import_sources",
    groupKey: "library_organization",
    labelEn: "Photo import sources",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1010,
  },
  {
    key: "auto_upload_mobile",
    groupKey: "library_organization",
    labelEn: "Auto-upload from mobile",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "ai_face_recognition",
    groupKey: "library_organization",
    labelEn: "AI face recognition",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "object_scene_search",
    groupKey: "library_organization",
    labelEn: "Object & scene search",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "album_organization_model",
    groupKey: "library_organization",
    labelEn: "Album organization model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "map_view_geotagging",
    groupKey: "library_organization",
    labelEn: "Map view / geotagging",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1060,
  },
  {
    key: "timeline_view",
    groupKey: "library_organization",
    labelEn: "Timeline view",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1070,
  },
  {
    key: "duplicate_detection",
    groupKey: "library_organization",
    labelEn: "Duplicate detection",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1080,
  },
  // Group 2: Storage & Backup (200)
  {
    key: "storage_type",
    groupKey: "storage_backup",
    labelEn: "Storage type",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 2010,
  },
  {
    key: "storage_quota_model",
    groupKey: "storage_backup",
    labelEn: "Storage quota model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "original_quality_preservation",
    groupKey: "storage_backup",
    labelEn: "Original quality preservation",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "backup_strategy",
    groupKey: "storage_backup",
    labelEn: "Backup strategy",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2040,
  },
  {
    key: "file_versioning",
    groupKey: "storage_backup",
    labelEn: "File versioning",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "trash_recovery",
    groupKey: "storage_backup",
    labelEn: "Trash / recovery",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2060,
  },
  // Group 3: Sharing & Collaboration (300)
  {
    key: "public_link_sharing",
    groupKey: "sharing_collaboration",
    labelEn: "Public link sharing",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "shared_albums",
    groupKey: "sharing_collaboration",
    labelEn: "Shared albums",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "family_sharing",
    groupKey: "sharing_collaboration",
    labelEn: "Family sharing / multi-user",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "access_control_model",
    groupKey: "sharing_collaboration",
    labelEn: "Access control model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "external_sharing_platforms",
    groupKey: "sharing_collaboration",
    labelEn: "External sharing platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3050,
  },
  // Group 4: Editing & Enhancement (400)
  {
    key: "built_in_editor",
    groupKey: "editing_enhancement",
    labelEn: "Built-in editor",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4010,
  },
  {
    key: "editing_capabilities",
    groupKey: "editing_enhancement",
    labelEn: "Editing capabilities",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4020,
  },
  {
    key: "raw_format_support",
    groupKey: "editing_enhancement",
    labelEn: "RAW format support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "must_match",
    sortOrder: 4030,
  },
  {
    key: "ai_enhancement",
    groupKey: "editing_enhancement",
    labelEn: "AI enhancement features",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "video_support",
    groupKey: "editing_enhancement",
    labelEn: "Video support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4050,
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
    key: "web_access",
    groupKey: "platform_access",
    labelEn: "Web access",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "offline_access",
    groupKey: "platform_access",
    labelEn: "Offline access",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "api_available",
    groupKey: "platform_access",
    labelEn: "API available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "third_party_integrations",
    groupKey: "platform_access",
    labelEn: "Third-party integrations",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5050,
  },
  // Group 6: Privacy & Data (600)
  {
    key: "data_processing_location",
    groupKey: "privacy_data",
    labelEn: "Data processing location",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 6010,
  },
  {
    key: "encryption_model",
    groupKey: "privacy_data",
    labelEn: "Encryption model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "face_recognition_privacy",
    groupKey: "privacy_data",
    labelEn: "Face recognition privacy",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "metadata_stripping_sharing",
    groupKey: "privacy_data",
    labelEn: "Metadata stripping on sharing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "account_required",
    groupKey: "privacy_data",
    labelEn: "Account required",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 6050,
  },
  {
    key: "data_export_available",
    groupKey: "privacy_data",
    labelEn: "Data export available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6060,
  },
  // Group 7: Openness & Standards (700)
  {
    key: "source_code_model",
    groupKey: "openness_standards",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "license_type",
    groupKey: "openness_standards",
    labelEn: "License type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "self_hosting_available",
    groupKey: "openness_standards",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 7030,
  },
  {
    key: "photo_format_support",
    groupKey: "openness_standards",
    labelEn: "Photo format support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7040,
  },
  {
    key: "export_format_options",
    groupKey: "openness_standards",
    labelEn: "Export format options",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
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
    filterMode: "must_match",
    sortOrder: 8020,
  },
  {
    key: "free_tier_limitations",
    groupKey: "pricing_fit",
    labelEn: "Free tier limitations",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
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
  photo_import_sources: [
    "mobile_app",
    "desktop_app",
    "web_upload",
    "folder_sync",
    "s3_compatible",
    "cloud_import",
  ],
  album_organization_model: [
    "manual_only",
    "auto_generated",
    "smart_albums",
    "folder_based",
  ],
  storage_type: ["cloud_only", "self_hosted", "hybrid", "local_device"],
  storage_quota_model: ["unlimited", "tiered", "pay_per_use", "fixed"],
  backup_strategy: [
    "automatic_cloud",
    "local_backup",
    "nas_sync",
    "redundant_copies",
    "export_archive",
  ],
  access_control_model: [
    "password_protected",
    "role_based",
    "link_expiry",
    "view_only",
  ],
  external_sharing_platforms: [
    "social_media",
    "email",
    "embed",
    "direct_download",
  ],
  editing_capabilities: [
    "crop_rotate",
    "exposure_color",
    "filters_presets",
    "retouching",
    "batch_editing",
    "non_destructive",
  ],
  supported_platforms: ["android", "ios", "windows", "macos", "linux", "web"],
  third_party_integrations: [
    "nextcloud",
    "synology",
    "nas_systems",
    "webdav",
    "s3",
  ],
  data_processing_location: [
    "eu_only",
    "eu_primary",
    "global",
    "local",
    "unspecified",
  ],
  encryption_model: ["end_to_end", "at_rest", "in_transit_only", "none"],
  face_recognition_privacy: [
    "on_device",
    "server_side_private",
    "cloud_processed",
    "not_available",
  ],
  source_code_model: [
    "fully_open",
    "source_available",
    "partially_open",
    "proprietary",
  ],
  license_type: [
    "gpl_family",
    "mit_bsd_apache",
    "agpl",
    "mpl",
    "custom_open",
    "proprietary",
  ],
  photo_format_support: [
    "jpeg",
    "png",
    "heif_heic",
    "webp",
    "raw",
    "avif",
    "tiff",
  ],
  export_format_options: [
    "original_format",
    "zip_archive",
    "google_takeout_compatible",
    "standard_folders",
  ],
  pricing_model: [
    "free_only",
    "freemium",
    "subscription",
    "one_time_purchase",
    "donation_based",
  ],
  free_tier_limitations: [
    "storage_cap",
    "feature_limited",
    "ads",
    "watermarks",
    "no_sharing",
  ],
  fit_profiles: [
    "casual_user",
    "photography_enthusiast",
    "professional_photographer",
    "family",
    "enterprise",
    "privacy_focused",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  storage_type: {
    self_hosted: "positive",
  },
  storage_quota_model: {
    unlimited: "positive",
  },
  encryption_model: {
    end_to_end: "positive",
    none: "warning",
  },
  face_recognition_privacy: {
    on_device: "positive",
    cloud_processed: "warning",
  },
  data_processing_location: {
    eu_only: "positive",
    local: "positive",
    global: "warning",
    unspecified: "warning",
  },
  source_code_model: {
    fully_open: "positive",
    proprietary: "warning",
  },
  pricing_model: {
    free_only: "positive",
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

describe("photo-management matrix criteria migration", () => {
  it("adds the repository-owned migration for photo-management matrix metadata", () => {
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

  it("defines ordered photo-management criterion groups with localized labels", () => {
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

  it("defines category-native photo-management criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'photo-management'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'photo-management'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(98);
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

    expect(expectedCriteria.length).toBe(44);
    expect(criterionRows).toHaveLength(44);
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

  it("has no unexpected non-neutral display tones beyond the caution tone map", () => {
    const expectedNonNeutralKeys = new Set(
      Object.entries(expectedCautionOptionTonesByCriterion).flatMap(
        ([criterionKey, optionTones]) =>
          Object.keys(optionTones).map(
            (optionKey) => `${criterionKey}:${optionKey}`,
          ),
      ),
    );

    const unexpectedNonNeutral = parseOptionRows().filter(
      (option) =>
        option.displayTone !== "neutral" &&
        !expectedNonNeutralKeys.has(
          `${option.criterionKey}:${option.optionKey}`,
        ),
    );

    expect(
      unexpectedNonNeutral.map(
        (o) => `${o.criterionKey}:${o.optionKey}:${o.displayTone}`,
      ),
    ).toEqual([]);
  });

  it("has unique help texts across all criteria to catch copy-paste errors", () => {
    const criterionRows = parseCriterionRows();
    const seenHelpTextsEn = new Map<string, string>();
    const seenHelpTextsDe = new Map<string, string>();

    for (const criterion of criterionRows) {
      const dupEn = seenHelpTextsEn.get(criterion.helpTextEn);
      expect(dupEn).toBeUndefined();
      seenHelpTextsEn.set(criterion.helpTextEn, criterion.criterionKey);

      const dupDe = seenHelpTextsDe.get(criterion.helpTextDe);
      expect(dupDe).toBeUndefined();
      seenHelpTextsDe.set(criterion.helpTextDe, criterion.criterionKey);
    }
  });

  it("records the exact migration version in schema_migrations", () => {
    const versionPattern = new RegExp(
      `INSERT\\s+INTO\\s+\`?schema_migrations\`?\\s*\\(\\s*\`?version\`?\\s*\\)\\s*VALUES\\s*\\(\\s*'${escapeRegExp(migrationVersion)}'\\s*\\)`,
      "i",
    );

    expect(migrationSql).toMatch(versionPattern);
  });

  it("has unique group descriptions to catch copy-paste errors", () => {
    const groupRows = parseGroupRows();
    const seenDescriptionsEn = new Map<string, string>();
    const seenDescriptionsDe = new Map<string, string>();

    for (const group of groupRows) {
      const dupEn = seenDescriptionsEn.get(group.descriptionEn);
      expect(dupEn).toBeUndefined();
      seenDescriptionsEn.set(group.descriptionEn, group.groupKey);

      const dupDe = seenDescriptionsDe.get(group.descriptionDe);
      expect(dupDe).toBeUndefined();
      seenDescriptionsDe.set(group.descriptionDe, group.groupKey);
    }
  });

  it("has unique criterion labels to catch copy-paste errors", () => {
    const criterionRows = parseCriterionRows();
    const seenLabelsEn = new Map<string, string>();
    const seenLabelsDe = new Map<string, string>();

    for (const criterion of criterionRows) {
      const dupEn = seenLabelsEn.get(criterion.labelEn);
      expect(dupEn).toBeUndefined();
      seenLabelsEn.set(criterion.labelEn, criterion.criterionKey);

      const dupDe = seenLabelsDe.get(criterion.labelDe);
      expect(dupDe).toBeUndefined();
      seenLabelsDe.set(criterion.labelDe, criterion.criterionKey);
    }
  });

  it("has unique group labels to catch copy-paste errors", () => {
    const groupRows = parseGroupRows();
    const seenLabelsEn = new Map<string, string>();
    const seenLabelsDe = new Map<string, string>();

    for (const group of groupRows) {
      const dupEn = seenLabelsEn.get(group.labelEn);
      expect(dupEn).toBeUndefined();
      seenLabelsEn.set(group.labelEn, group.groupKey);

      const dupDe = seenLabelsDe.get(group.labelDe);
      expect(dupDe).toBeUndefined();
      seenLabelsDe.set(group.labelDe, group.groupKey);
    }
  });

  it("has unique option labels within each criterion to catch copy-paste errors", () => {
    const optionRows = parseOptionRows();
    const optionsByKey = new Map<string, OptionRow[]>();

    for (const option of optionRows) {
      const rows = optionsByKey.get(option.criterionKey) ?? [];
      rows.push(option);
      optionsByKey.set(option.criterionKey, rows);
    }

    for (const [, rows] of optionsByKey) {
      const seenLabelsEn = new Set<string>();
      const seenLabelsDe = new Set<string>();

      for (const option of rows) {
        expect(seenLabelsEn.has(option.labelEn)).toBe(false);
        seenLabelsEn.add(option.labelEn);

        expect(seenLabelsDe.has(option.labelDe)).toBe(false);
        seenLabelsDe.add(option.labelDe);
      }
    }
  });
});
