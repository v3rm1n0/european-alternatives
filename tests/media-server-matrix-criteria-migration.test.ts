import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "media-server";
const migrationVersion = "039-media-server-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/039-media-server-matrix-criteria.sql",
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
    key: "library_media_support",
    labelEn: "Library & Media Support",
    sortOrder: 100,
  },
  {
    key: "transcoding_playback",
    labelEn: "Transcoding & Playback",
    sortOrder: 200,
  },
  {
    key: "client_apps_devices",
    labelEn: "Client Apps & Devices",
    sortOrder: 300,
  },
  {
    key: "user_management",
    labelEn: "User Management",
    sortOrder: 400,
  },
  {
    key: "live_tv_dvr",
    labelEn: "Live TV & DVR",
    sortOrder: 500,
  },
  {
    key: "privacy_data",
    labelEn: "Privacy & Data",
    sortOrder: 600,
  },
  {
    key: "openness_extensibility",
    labelEn: "Openness & Extensibility",
    sortOrder: 700,
  },
  {
    key: "deployment_hosting",
    labelEn: "Deployment & Hosting",
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
  // Group 1: Library & Media Support (100)
  {
    key: "supported_media_types",
    groupKey: "library_media_support",
    labelEn: "Supported media types",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1010,
  },
  {
    key: "metadata_provider_support",
    groupKey: "library_media_support",
    labelEn: "Metadata provider support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1020,
  },
  {
    key: "automatic_metadata_fetching",
    groupKey: "library_media_support",
    labelEn: "Automatic metadata fetching",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "supported_file_formats",
    groupKey: "library_media_support",
    labelEn: "Supported file formats",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "subtitle_support",
    groupKey: "library_media_support",
    labelEn: "Subtitle support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1050,
  },
  {
    key: "library_organization",
    groupKey: "library_media_support",
    labelEn: "Library organization model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1060,
  },
  // Group 2: Transcoding & Playback (200)
  {
    key: "realtime_transcoding",
    groupKey: "transcoding_playback",
    labelEn: "Real-time transcoding",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2010,
  },
  {
    key: "hardware_acceleration",
    groupKey: "transcoding_playback",
    labelEn: "Hardware acceleration support",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2020,
  },
  {
    key: "hdr_support",
    groupKey: "transcoding_playback",
    labelEn: "HDR support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "direct_play",
    groupKey: "transcoding_playback",
    labelEn: "Direct play / direct stream",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "max_streaming_quality",
    groupKey: "transcoding_playback",
    labelEn: "Maximum streaming quality",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "offline_sync",
    groupKey: "transcoding_playback",
    labelEn: "Offline sync / download",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2060,
  },
  // Group 3: Client Apps & Devices (300)
  {
    key: "supported_client_platforms",
    groupKey: "client_apps_devices",
    labelEn: "Supported client platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3010,
  },
  {
    key: "web_player_available",
    groupKey: "client_apps_devices",
    labelEn: "Web player available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "smart_tv_support",
    groupKey: "client_apps_devices",
    labelEn: "Smart TV support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3030,
  },
  {
    key: "dlna_upnp_support",
    groupKey: "client_apps_devices",
    labelEn: "DLNA / UPnP support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "chromecast_support",
    groupKey: "client_apps_devices",
    labelEn: "Chromecast support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "remote_access",
    groupKey: "client_apps_devices",
    labelEn: "Remote access",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3060,
  },
  // Group 4: User Management (400)
  {
    key: "multi_user_support",
    groupKey: "user_management",
    labelEn: "Multi-user support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "user_profiles",
    groupKey: "user_management",
    labelEn: "User profiles",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "parental_controls",
    groupKey: "user_management",
    labelEn: "Parental controls",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "library_sharing",
    groupKey: "user_management",
    labelEn: "Library sharing model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "watch_history_tracking",
    groupKey: "user_management",
    labelEn: "Watch history tracking",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4050,
  },
  // Group 5: Live TV & DVR (500)
  {
    key: "live_tv_support",
    groupKey: "live_tv_dvr",
    labelEn: "Live TV support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "tv_tuner_support",
    groupKey: "live_tv_dvr",
    labelEn: "TV tuner support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5020,
  },
  {
    key: "epg_guide",
    groupKey: "live_tv_dvr",
    labelEn: "Electronic program guide (EPG)",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "dvr_recording",
    groupKey: "live_tv_dvr",
    labelEn: "DVR recording",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5040,
  },
  // Group 6: Privacy & Data (600)
  {
    key: "account_requirement",
    groupKey: "privacy_data",
    labelEn: "Account requirement",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "telemetry_model",
    groupKey: "privacy_data",
    labelEn: "Telemetry model",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "data_processing_location",
    groupKey: "privacy_data",
    labelEn: "Data processing location",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 6030,
  },
  {
    key: "phone_home_behavior",
    groupKey: "privacy_data",
    labelEn: "Phone-home behavior",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "data_export_available",
    groupKey: "privacy_data",
    labelEn: "Data export available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6050,
  },
  // Group 7: Openness & Extensibility (700)
  {
    key: "source_model",
    groupKey: "openness_extensibility",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "license_type",
    groupKey: "openness_extensibility",
    labelEn: "License type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "plugin_system",
    groupKey: "openness_extensibility",
    labelEn: "Plugin / add-on system",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "api_available",
    groupKey: "openness_extensibility",
    labelEn: "API available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "community_ecosystem",
    groupKey: "openness_extensibility",
    labelEn: "Community ecosystem",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7050,
  },
  // Group 8: Deployment & Hosting (800)
  {
    key: "deployment_model",
    groupKey: "deployment_hosting",
    labelEn: "Deployment model",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8010,
  },
  {
    key: "docker_support",
    groupKey: "deployment_hosting",
    labelEn: "Docker support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "nas_compatibility",
    groupKey: "deployment_hosting",
    labelEn: "NAS compatibility",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "minimum_hardware_requirements",
    groupKey: "deployment_hosting",
    labelEn: "Minimum hardware requirements",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8040,
  },
  {
    key: "reverse_proxy_support",
    groupKey: "deployment_hosting",
    labelEn: "Reverse proxy support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8050,
  },
  // Group 9: Pricing & Fit (900)
  {
    key: "pricing_model",
    groupKey: "pricing_fit",
    labelEn: "Pricing model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9010,
  },
  {
    key: "free_tier_available",
    groupKey: "pricing_fit",
    labelEn: "Free tier available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "must_match",
    sortOrder: 9020,
  },
  {
    key: "paid_features_scope",
    groupKey: "pricing_fit",
    labelEn: "Paid features scope",
    valueType: "enum",
    semantics: "tradeoff",
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
  supported_media_types: [
    "movies",
    "tv_shows",
    "music",
    "photos",
    "audiobooks",
    "ebooks",
  ],
  metadata_provider_support: [
    "tmdb",
    "tvdb",
    "imdb",
    "musicbrainz",
    "fanart_tv",
    "custom_provider",
  ],
  supported_file_formats: ["very_broad", "broad", "moderate", "limited"],
  subtitle_support: [
    "srt",
    "ass_ssa",
    "vobsub",
    "pgs",
    "embedded_mkv",
    "opensubtitles_integration",
  ],
  library_organization: ["automatic_scan", "manual_curated", "hybrid"],
  hardware_acceleration: [
    "nvidia_nvenc",
    "intel_quicksync",
    "amd_amf",
    "vaapi",
    "videotoolbox",
    "none_documented",
  ],
  max_streaming_quality: ["uhd_4k", "hd_1080p", "hd_720p", "sd"],
  supported_client_platforms: [
    "android",
    "ios",
    "windows",
    "macos",
    "linux",
    "web",
    "android_tv",
    "apple_tv",
    "fire_tv",
    "roku",
  ],
  smart_tv_support: [
    "samsung_tizen",
    "lg_webos",
    "android_tv",
    "apple_tv",
    "fire_tv",
    "roku",
    "none_documented",
  ],
  remote_access: [
    "built_in",
    "via_third_party_relay",
    "manual_port_forward",
    "not_supported",
  ],
  library_sharing: [
    "local_users_only",
    "remote_sharing",
    "federated_sharing",
    "no_sharing",
  ],
  tv_tuner_support: [
    "hdhomerun",
    "dvb_usb",
    "iptv_m3u",
    "sat_ip",
    "none_documented",
  ],
  account_requirement: [
    "no_account_needed",
    "local_account",
    "optional_cloud_account",
    "mandatory_cloud_account",
  ],
  telemetry_model: [
    "no_telemetry",
    "opt_in_telemetry",
    "opt_out_telemetry",
    "mandatory_telemetry",
  ],
  data_processing_location: [
    "local_only",
    "eu_only",
    "eu_primary",
    "global",
    "user_configured",
    "unspecified",
  ],
  phone_home_behavior: [
    "no_phone_home",
    "optional_update_check",
    "mandatory_connection",
    "cloud_dependent",
  ],
  source_model: [
    "fully_open_source",
    "source_available",
    "partially_open",
    "proprietary",
  ],
  license_type: [
    "gpl_family",
    "mit_bsd_apache",
    "agpl",
    "custom_open",
    "proprietary",
  ],
  community_ecosystem: [
    "large_active",
    "medium_active",
    "small_niche",
    "minimal",
  ],
  deployment_model: [
    "docker",
    "bare_metal",
    "package_manager",
    "snap_flatpak",
    "windows_installer",
    "managed_cloud",
  ],
  nas_compatibility: [
    "synology",
    "qnap",
    "unraid",
    "truenas",
    "asustor",
    "generic_linux",
  ],
  minimum_hardware_requirements: ["very_low", "low", "moderate", "high"],
  pricing_model: [
    "free_only",
    "freemium",
    "subscription_only",
    "one_time_purchase",
    "donation_based",
  ],
  paid_features_scope: [
    "no_paid_features",
    "cosmetic_convenience",
    "significant_features_locked",
    "core_features_locked",
  ],
  fit_profiles: [
    "home_media_enthusiast",
    "family",
    "power_user",
    "privacy_focused",
    "music_collector",
    "cord_cutter",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  account_requirement: {
    no_account_needed: "positive",
    mandatory_cloud_account: "warning",
  },
  telemetry_model: {
    no_telemetry: "positive",
    mandatory_telemetry: "warning",
  },
  data_processing_location: {
    local_only: "positive",
    global: "warning",
    unspecified: "warning",
  },
  phone_home_behavior: {
    no_phone_home: "positive",
    mandatory_connection: "warning",
    cloud_dependent: "warning",
  },
  source_model: {
    fully_open_source: "positive",
    proprietary: "warning",
  },
  pricing_model: {
    free_only: "positive",
  },
  paid_features_scope: {
    no_paid_features: "positive",
    core_features_locked: "warning",
  },
  minimum_hardware_requirements: {
    very_low: "positive",
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

describe("media-server matrix criteria migration", () => {
  it("adds the repository-owned migration for media-server matrix metadata", () => {
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

  it("defines ordered media-server criterion groups with localized labels", () => {
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

  it("defines category-native media-server criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'media-server'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'media-server'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(127);
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

    expect(expectedCriteria.length).toBe(46);
    expect(criterionRows).toHaveLength(46);
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
