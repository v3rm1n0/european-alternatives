import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "gis";
const migrationVersion = "046-gis-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/046-gis-matrix-criteria.sql",
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
    key: "spatial_data_formats",
    labelEn: "Spatial Data Formats",
    sortOrder: 100,
  },
  {
    key: "analysis_processing",
    labelEn: "Analysis & Processing",
    sortOrder: 200,
  },
  {
    key: "visualization_cartography",
    labelEn: "Visualization & Cartography",
    sortOrder: 300,
  },
  {
    key: "coordinate_projection",
    labelEn: "Coordinate Systems & Projection",
    sortOrder: 400,
  },
  {
    key: "data_management",
    labelEn: "Data Management & Storage",
    sortOrder: 500,
  },
  {
    key: "field_mobile",
    labelEn: "Field & Mobile Capabilities",
    sortOrder: 600,
  },
  {
    key: "extensibility_automation",
    labelEn: "Extensibility & Automation",
    sortOrder: 700,
  },
  {
    key: "platform_deployment",
    labelEn: "Platform & Deployment",
    sortOrder: 800,
  },
  {
    key: "openness_pricing",
    labelEn: "Openness & Pricing",
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
  // Group 1: Spatial Data Formats (100)
  {
    key: "vector_format_support",
    groupKey: "spatial_data_formats",
    labelEn: "Vector format support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1010,
  },
  {
    key: "raster_format_support",
    groupKey: "spatial_data_formats",
    labelEn: "Raster format support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1020,
  },
  {
    key: "point_cloud_support",
    groupKey: "spatial_data_formats",
    labelEn: "Point cloud support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "gps_track_support",
    groupKey: "spatial_data_formats",
    labelEn: "GPS track/waypoint support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "wms_wfs_support",
    groupKey: "spatial_data_formats",
    labelEn: "WMS/WFS/WMTS support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1050,
  },
  {
    key: "database_connectivity",
    groupKey: "spatial_data_formats",
    labelEn: "Spatial database connectivity",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1060,
  },
  {
    key: "cad_format_support",
    groupKey: "spatial_data_formats",
    labelEn: "CAD format support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1070,
  },
  // Group 2: Analysis & Processing (200)
  {
    key: "vector_analysis_tools",
    groupKey: "analysis_processing",
    labelEn: "Vector analysis tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2010,
  },
  {
    key: "raster_analysis_tools",
    groupKey: "analysis_processing",
    labelEn: "Raster analysis tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2020,
  },
  {
    key: "spatial_statistics",
    groupKey: "analysis_processing",
    labelEn: "Spatial statistics",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "geocoding_support",
    groupKey: "analysis_processing",
    labelEn: "Geocoding/reverse geocoding",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "terrain_analysis",
    groupKey: "analysis_processing",
    labelEn: "Terrain/elevation analysis",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "network_analysis",
    groupKey: "analysis_processing",
    labelEn: "Network/routing analysis",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2060,
  },
  {
    key: "batch_processing",
    groupKey: "analysis_processing",
    labelEn: "Batch/bulk processing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2070,
  },
  // Group 3: Visualization & Cartography (300)
  {
    key: "map_rendering_type",
    groupKey: "visualization_cartography",
    labelEn: "Map rendering type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "thematic_mapping",
    groupKey: "visualization_cartography",
    labelEn: "Thematic mapping",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3020,
  },
  {
    key: "labeling_engine",
    groupKey: "visualization_cartography",
    labelEn: "Labeling engine",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "print_layout_composer",
    groupKey: "visualization_cartography",
    labelEn: "Print layout/map composer",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "3d_visualization",
    groupKey: "visualization_cartography",
    labelEn: "3D visualization",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "temporal_visualization",
    groupKey: "visualization_cartography",
    labelEn: "Temporal/time-series visualization",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3060,
  },
  {
    key: "basemap_providers",
    groupKey: "visualization_cartography",
    labelEn: "Basemap providers",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3070,
  },
  // Group 4: Coordinate Systems & Projection (400)
  {
    key: "crs_support_model",
    groupKey: "coordinate_projection",
    labelEn: "CRS support model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4010,
  },
  {
    key: "on_the_fly_reprojection",
    groupKey: "coordinate_projection",
    labelEn: "On-the-fly reprojection",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "custom_crs_definition",
    groupKey: "coordinate_projection",
    labelEn: "Custom CRS definition",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "datum_transformation",
    groupKey: "coordinate_projection",
    labelEn: "Datum transformation support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4040,
  },
  // Group 5: Data Management & Storage (500)
  {
    key: "spatial_indexing",
    groupKey: "data_management",
    labelEn: "Spatial indexing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "versioned_editing",
    groupKey: "data_management",
    labelEn: "Versioned editing/history",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "attribute_table_editing",
    groupKey: "data_management",
    labelEn: "Attribute table editing",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "topology_tools",
    groupKey: "data_management",
    labelEn: "Topology validation tools",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "data_catalog_metadata",
    groupKey: "data_management",
    labelEn: "Data catalog/metadata management",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5050,
  },
  {
    key: "max_dataset_scale",
    groupKey: "data_management",
    labelEn: "Maximum dataset scale",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5060,
  },
  // Group 6: Field & Mobile Capabilities (600)
  {
    key: "mobile_data_collection",
    groupKey: "field_mobile",
    labelEn: "Mobile data collection",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 6010,
  },
  {
    key: "offline_field_editing",
    groupKey: "field_mobile",
    labelEn: "Offline field editing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "gps_integration",
    groupKey: "field_mobile",
    labelEn: "GPS/GNSS integration",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "field_form_designer",
    groupKey: "field_mobile",
    labelEn: "Field form designer",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "field_sync_model",
    groupKey: "field_mobile",
    labelEn: "Field-to-server sync model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6050,
  },
  // Group 7: Extensibility & Automation (700)
  {
    key: "plugin_ecosystem",
    groupKey: "extensibility_automation",
    labelEn: "Plugin/extension ecosystem",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "scripting_language",
    groupKey: "extensibility_automation",
    labelEn: "Scripting language support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "processing_framework",
    groupKey: "extensibility_automation",
    labelEn: "Processing/model framework",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "rest_api_available",
    groupKey: "extensibility_automation",
    labelEn: "REST API available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "cli_tools",
    groupKey: "extensibility_automation",
    labelEn: "Command-line tools",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7050,
  },
  // Group 8: Platform & Deployment (800)
  {
    key: "supported_platforms",
    groupKey: "platform_deployment",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8010,
  },
  {
    key: "deployment_model",
    groupKey: "platform_deployment",
    labelEn: "Deployment model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 8020,
  },
  {
    key: "self_hosting_available",
    groupKey: "platform_deployment",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 8030,
  },
  {
    key: "data_processing_location",
    groupKey: "platform_deployment",
    labelEn: "Data processing location",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 8040,
  },
  {
    key: "account_required",
    groupKey: "platform_deployment",
    labelEn: "Account required",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 8050,
  },
  {
    key: "telemetry_model",
    groupKey: "platform_deployment",
    labelEn: "Telemetry model",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 8060,
  },
  // Group 9: Openness & Pricing (900)
  {
    key: "source_model",
    groupKey: "openness_pricing",
    labelEn: "Source code model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9010,
  },
  {
    key: "license_type",
    groupKey: "openness_pricing",
    labelEn: "License type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "ogc_compliance",
    groupKey: "openness_pricing",
    labelEn: "OGC standards compliance",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 9030,
  },
  {
    key: "pricing_model",
    groupKey: "openness_pricing",
    labelEn: "Pricing model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9040,
  },
  {
    key: "free_tier_available",
    groupKey: "openness_pricing",
    labelEn: "Free tier available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "must_match",
    sortOrder: 9050,
  },
  {
    key: "fit_profiles",
    groupKey: "openness_pricing",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9060,
  },
];

const requiredOptionsByCriterion = {
  vector_format_support: [
    "shapefile",
    "geojson",
    "geopackage",
    "kml_kmz",
    "gml",
    "geotiff_vector",
    "flatgeobuf",
    "csv_xy",
  ],
  raster_format_support: [
    "geotiff",
    "jpeg2000",
    "ecw",
    "mrsid",
    "netcdf",
    "hdf",
    "ascii_grid",
    "cloud_optimized_geotiff",
  ],
  wms_wfs_support: ["wms", "wfs", "wmts", "wcs", "wps", "ogc_api_features"],
  database_connectivity: [
    "postgis",
    "spatialite",
    "oracle_spatial",
    "mssql_spatial",
    "geopackage_db",
  ],
  vector_analysis_tools: [
    "buffer",
    "overlay",
    "dissolve",
    "spatial_join",
    "voronoi",
    "convex_hull",
    "clip",
  ],
  raster_analysis_tools: [
    "reclassify",
    "map_algebra",
    "interpolation",
    "viewshed",
    "watershed",
    "zonal_statistics",
    "ndvi_indices",
  ],
  map_rendering_type: [
    "static_2d",
    "interactive_2d",
    "webgl_accelerated",
    "server_side_rendered",
  ],
  thematic_mapping: [
    "choropleth",
    "graduated_symbols",
    "dot_density",
    "heat_map",
    "proportional_symbols",
    "bivariate",
  ],
  labeling_engine: ["manual_only", "rule_based", "pal_engine"],
  basemap_providers: [
    "osm",
    "stamen_stadia",
    "mapbox",
    "google",
    "bing",
    "esri",
    "custom_xyz",
    "offline_basemaps",
  ],
  crs_support_model: ["limited_crs", "epsg_registry", "custom_and_epsg"],
  max_dataset_scale: ["small", "medium", "large", "enterprise"],
  field_sync_model: ["manual_sync", "cloud_push_pull", "real_time_sync"],
  scripting_language: [
    "python",
    "r_language",
    "javascript",
    "sql",
    "graphical_modeler",
  ],
  supported_platforms: ["windows", "macos", "linux", "web", "ios", "android"],
  deployment_model: ["desktop_only", "client_server", "saas_cloud", "hybrid"],
  data_processing_location: [
    "eu_only",
    "eu_primary",
    "global",
    "local_device",
    "user_configured",
    "unspecified",
  ],
  telemetry_model: [
    "no_telemetry",
    "opt_in_telemetry",
    "opt_out_telemetry",
    "mandatory_telemetry",
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
  ogc_compliance: [
    "ogc_simple_features",
    "ogc_wms",
    "ogc_wfs",
    "ogc_geopackage",
    "ogc_api",
  ],
  pricing_model: [
    "free_only",
    "freemium",
    "subscription",
    "one_time_purchase",
    "per_seat",
  ],
  fit_profiles: [
    "researcher",
    "urban_planner",
    "environmental_analyst",
    "surveyor",
    "utility_management",
    "developer",
    "hobbyist",
    "enterprise_gis",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  raster_format_support: {
    cloud_optimized_geotiff: "positive",
  },
  wms_wfs_support: {
    ogc_api_features: "positive",
  },
  database_connectivity: {
    postgis: "positive",
  },
  labeling_engine: {
    manual_only: "warning",
    pal_engine: "positive",
  },
  crs_support_model: {
    limited_crs: "warning",
    custom_and_epsg: "positive",
  },
  max_dataset_scale: {
    enterprise: "positive",
    small: "warning",
  },
  field_sync_model: {
    real_time_sync: "positive",
  },
  deployment_model: {
    saas_cloud: "tradeoff",
  },
  data_processing_location: {
    eu_only: "positive",
    local_device: "positive",
    global: "warning",
    unspecified: "warning",
  },
  telemetry_model: {
    no_telemetry: "positive",
    mandatory_telemetry: "warning",
  },
  source_model: {
    fully_open_source: "positive",
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

describe("gis matrix criteria migration", () => {
  it("adds the repository-owned migration for gis matrix metadata", () => {
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

  it("defines ordered gis criterion groups with localized labels", () => {
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

  it("defines category-native gis criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'gis'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'gis'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(124);
    expect(optionRows).toHaveLength(expectedTotal);
  });

  it("uses native German umlauts and eszett in localized text", () => {
    const asciiUmlautFallbackPattern =
      /\b(?:fuer|unterstuetz|verfueg|verschluess|schluess|vollstaend|standardmaess|groess|gross|ausser|oeff|ueber|aender|primaer|sphaer|souveraen|foeder|domaen|erklaer|pruef|faeh|moeg|geraet|rueck|gaeng|laeuf|waehr|koenn|fuehr|fueg|erfuell|frueh|spaet|loesch|loes|zugaeng|abhaeng|traeg|geschaeft|schuetz|guelt|itaet|saech|schraenk|haeufig|vorschlaeg|temporaer|verkaeuf|gelaend|anfaeng|sued|europae|naech|foerm|koenig|jaehr|stuend|populaer|woech|koerb|koern|schaetz|bloeck|binaer|werkstaett|erzaehl|titelsprueng|anhaeng|bestaet|kanael|raeum|paed|prae|persoen|plaetz|wuerd|spruech|saetz|oepnv|behoerd|laess|hoer|mueh|guet|kuen|abzueg|fluess|stuerz|gruen|gerae|huell|regulaer|unerwuensch|gebuehr|stuetz|massstab|massnahm|massgeschneid|fuss|strass)\w*/i;
    const localizedText = [
      ...parseGroupRows().flatMap((row) => [row.labelDe, row.descriptionDe]),
      ...parseCriterionRows().flatMap((row) => [row.labelDe, row.helpTextDe]),
      ...parseOptionRows().map((row) => row.labelDe),
    ];

    for (const value of localizedText) {
      expect(value).not.toMatch(asciiUmlautFallbackPattern);
    }
  });

  it("contains the expected total number of criteria rows across all groups", () => {
    const criterionRows = parseCriterionRows();

    expect(expectedCriteria.length).toBe(53);
    expect(criterionRows).toHaveLength(53);
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
