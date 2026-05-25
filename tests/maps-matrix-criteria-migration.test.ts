import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "maps";
const migrationVersion = "015-maps-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/015-maps-matrix-criteria.sql",
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
    key: "map_data_coverage",
    labelEn: "Map Data & Coverage",
    sortOrder: 100,
  },
  {
    key: "routing_navigation",
    labelEn: "Routing & Navigation",
    sortOrder: 200,
  },
  {
    key: "offline_resilience",
    labelEn: "Offline & Resilience",
    sortOrder: 300,
  },
  {
    key: "privacy_location",
    labelEn: "Privacy & Location Data",
    sortOrder: 400,
  },
  {
    key: "places_discovery",
    labelEn: "Places & Local Discovery",
    sortOrder: 500,
  },
  {
    key: "transport_mobility",
    labelEn: "Transport & Mobility",
    sortOrder: 600,
  },
  {
    key: "platforms_accessibility",
    labelEn: "Platforms & Accessibility",
    sortOrder: 700,
  },
  {
    key: "customization_portability",
    labelEn: "Customization & Portability",
    sortOrder: 800,
  },
  {
    key: "openness_operations",
    labelEn: "Openness, APIs & Fit",
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
  {
    key: "map_data_source_model",
    groupKey: "map_data_coverage",
    labelEn: "Map data source model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "geographic_coverage_scope",
    groupKey: "map_data_coverage",
    labelEn: "Geographic coverage scope",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "address_geocoding_support",
    groupKey: "map_data_coverage",
    labelEn: "Address search/geocoding",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "poi_database_features",
    groupKey: "map_data_coverage",
    labelEn: "POI database features",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1040,
  },
  {
    key: "map_update_model",
    groupKey: "map_data_coverage",
    labelEn: "Map update model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "map_layers_available",
    groupKey: "map_data_coverage",
    labelEn: "Map layers available",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1060,
  },
  {
    key: "turn_by_turn_navigation",
    groupKey: "routing_navigation",
    labelEn: "Turn-by-turn navigation",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2010,
  },
  {
    key: "routing_modes",
    groupKey: "routing_navigation",
    labelEn: "Routing modes",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2020,
  },
  {
    key: "live_traffic_routing",
    groupKey: "routing_navigation",
    labelEn: "Live traffic routing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "public_transit_routing_model",
    groupKey: "routing_navigation",
    labelEn: "Public transit routing model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "route_optimization_features",
    groupKey: "routing_navigation",
    labelEn: "Route optimization features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2050,
  },
  {
    key: "guidance_features",
    groupKey: "routing_navigation",
    labelEn: "Guidance features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2060,
  },
  {
    key: "max_route_stops",
    groupKey: "routing_navigation",
    labelEn: "Maximum route stops",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 2070,
  },
  {
    key: "offline_maps_available",
    groupKey: "offline_resilience",
    labelEn: "Offline maps available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 3010,
  },
  {
    key: "offline_routing_available",
    groupKey: "offline_resilience",
    labelEn: "Offline routing available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "offline_search_available",
    groupKey: "offline_resilience",
    labelEn: "Offline search available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "offline_download_model",
    groupKey: "offline_resilience",
    labelEn: "Offline download model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "offline_update_controls",
    groupKey: "offline_resilience",
    labelEn: "Offline update controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3050,
  },
  {
    key: "low_connectivity_mode",
    groupKey: "offline_resilience",
    labelEn: "Low-connectivity mode",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3060,
  },
  {
    key: "account_required_for_navigation",
    groupKey: "privacy_location",
    labelEn: "Account required for navigation",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "location_history_model",
    groupKey: "privacy_location",
    labelEn: "Location history model",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "location_data_retention",
    groupKey: "privacy_location",
    labelEn: "Location data retention",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "third_party_tracking_on_map",
    groupKey: "privacy_location",
    labelEn: "Third-party tracking on map",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "live_location_sharing",
    groupKey: "privacy_location",
    labelEn: "Live location sharing",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "personalization_ads_model",
    groupKey: "privacy_location",
    labelEn: "Personalization/ads model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4060,
  },
  {
    key: "place_search_available",
    groupKey: "places_discovery",
    labelEn: "Place search available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "place_detail_fields",
    groupKey: "places_discovery",
    labelEn: "Place detail fields",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5020,
  },
  {
    key: "review_rating_model",
    groupKey: "places_discovery",
    labelEn: "Review/rating model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "business_listing_management",
    groupKey: "places_discovery",
    labelEn: "Business listing management",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "booking_commerce_integrations",
    groupKey: "places_discovery",
    labelEn: "Booking/commerce integrations",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 5050,
  },
  {
    key: "indoor_maps_available",
    groupKey: "places_discovery",
    labelEn: "Indoor maps available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5060,
  },
  {
    key: "realtime_transit_available",
    groupKey: "transport_mobility",
    labelEn: "Real-time transit available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "supported_mobility_services",
    groupKey: "transport_mobility",
    labelEn: "Supported mobility services",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6020,
  },
  {
    key: "ev_routing_charging_features",
    groupKey: "transport_mobility",
    labelEn: "EV routing/charging features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6030,
  },
  {
    key: "cycling_features",
    groupKey: "transport_mobility",
    labelEn: "Cycling features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6040,
  },
  {
    key: "walking_hiking_features",
    groupKey: "transport_mobility",
    labelEn: "Walking/hiking features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6050,
  },
  {
    key: "truck_or_professional_routing",
    groupKey: "transport_mobility",
    labelEn: "Truck/professional routing",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6060,
  },
  {
    key: "supported_platforms",
    groupKey: "platforms_accessibility",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7010,
  },
  {
    key: "mobile_app_distribution",
    groupKey: "platforms_accessibility",
    labelEn: "Mobile app distribution",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "vehicle_integration",
    groupKey: "platforms_accessibility",
    labelEn: "Vehicle integration",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7030,
  },
  {
    key: "accessibility_features",
    groupKey: "platforms_accessibility",
    labelEn: "Accessibility features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7040,
  },
  {
    key: "voice_language_support",
    groupKey: "platforms_accessibility",
    labelEn: "Voice/language support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7050,
  },
  {
    key: "saved_places_lists",
    groupKey: "customization_portability",
    labelEn: "Saved places/lists",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "custom_maps_layers",
    groupKey: "customization_portability",
    labelEn: "Custom maps/layers",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8020,
  },
  {
    key: "import_export_formats",
    groupKey: "customization_portability",
    labelEn: "Import/export formats",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "sharing_collaboration_features",
    groupKey: "customization_portability",
    labelEn: "Sharing/collaboration features",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8040,
  },
  {
    key: "data_export_available",
    groupKey: "customization_portability",
    labelEn: "Data export available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8050,
  },
  {
    key: "contribution_editing_model",
    groupKey: "openness_operations",
    labelEn: "Contribution/editing model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9010,
  },
  {
    key: "self_hosting_or_local_server",
    groupKey: "openness_operations",
    labelEn: "Self-hosting/local server",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "map_tile_api_embedding",
    groupKey: "openness_operations",
    labelEn: "Map tile API/embedding",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "open_data_attribution_visible",
    groupKey: "openness_operations",
    labelEn: "Data attribution visible",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9040,
  },
  {
    key: "fit_profiles",
    groupKey: "openness_operations",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9050,
  },
];

const requiredOptionsByCriterion = {
  map_data_source_model: [
    "openstreetmap_based",
    "proprietary_provider",
    "mixed_sources",
    "government_open_data",
    "community_contributed",
    "provider_api",
  ],
  geographic_coverage_scope: [
    "global",
    "regional",
    "country_specific",
    "city_local",
    "outdoor_specialized",
  ],
  poi_database_features: [
    "categories",
    "opening_hours",
    "contact_details",
    "accessibility_details",
    "photos",
    "user_reviews",
    "business_updates",
  ],
  map_update_model: [
    "community_live",
    "provider_live",
    "periodic_releases",
    "offline_package_updates",
    "manual_imports",
  ],
  map_layers_available: [
    "standard",
    "satellite",
    "terrain",
    "public_transport",
    "cycling",
    "traffic",
    "indoor",
    "cadastre",
    "weather",
  ],
  routing_modes: [
    "driving",
    "walking",
    "cycling",
    "public_transit",
    "motorcycle",
    "truck",
    "wheelchair",
    "hiking",
  ],
  public_transit_routing_model: [
    "none",
    "static_schedules",
    "realtime_departures",
    "multimodal",
    "regional_only",
  ],
  route_optimization_features: [
    "alternative_routes",
    "multi_stop",
    "avoid_tolls",
    "avoid_highways",
    "avoid_ferries",
    "waypoint_reordering",
    "round_trip",
  ],
  guidance_features: [
    "voice_guidance",
    "lane_assist",
    "speed_limits",
    "speed_cameras",
    "hazard_alerts",
    "automatic_rerouting",
    "compass",
  ],
  offline_download_model: [
    "none",
    "country_region_packages",
    "user_selected_areas",
    "route_corridor",
    "cache_only",
  ],
  offline_update_controls: [
    "manual_updates",
    "auto_updates_wifi",
    "update_notifications",
    "storage_management",
    "differential_updates",
  ],
  location_history_model: [
    "none",
    "local_only",
    "opt_in_cloud",
    "default_on_cloud",
    "account_required_history",
  ],
  location_data_retention: [
    "not_logged",
    "short_retention",
    "account_history_optional",
    "retained_for_service",
    "retained_for_ads",
  ],
  personalization_ads_model: [
    "none",
    "contextual",
    "account_personalized",
    "location_based_ads",
    "subscription_no_ads",
  ],
  place_detail_fields: [
    "opening_hours",
    "phone_website",
    "photos",
    "menus",
    "accessibility_info",
    "business_claims",
  ],
  review_rating_model: [
    "none",
    "first_party_reviews",
    "partner_reviews",
    "community_notes",
    "external_linkout",
  ],
  business_listing_management: [
    "none",
    "provider_portal",
    "community_edits",
    "owner_claiming",
    "partner_feed",
  ],
  booking_commerce_integrations: [
    "reservations",
    "tickets",
    "food_ordering",
    "ride_hailing",
    "hotel_booking",
    "paid_promotions",
  ],
  supported_mobility_services: [
    "public_transport",
    "bike_share",
    "scooter_share",
    "car_share",
    "ride_hailing",
    "taxi",
    "parking",
    "ev_charging",
  ],
  ev_routing_charging_features: [
    "station_search",
    "connector_filters",
    "live_availability",
    "battery_planning",
    "payment_info",
    "route_charging_stops",
  ],
  cycling_features: [
    "bike_lanes",
    "cycling_networks",
    "surface_quality",
    "elevation_profile",
    "bike_parking",
    "turn_by_turn_cycling",
  ],
  walking_hiking_features: [
    "footpaths",
    "trails",
    "elevation_profile",
    "step_free_routes",
    "crosswalks",
    "hiking_routes",
    "offline_topo",
  ],
  truck_or_professional_routing: [
    "height_weight_restrictions",
    "hazmat",
    "delivery_windows",
    "fleet_routes",
    "toll_costs",
    "professional_profiles",
  ],
  supported_platforms: [
    "web",
    "android",
    "ios",
    "desktop",
    "pwa",
    "wearables",
    "carplay",
    "android_auto",
  ],
  mobile_app_distribution: [
    "app_store",
    "play_store",
    "f_droid",
    "direct_apk",
    "pwa",
    "repository_packages",
  ],
  vehicle_integration: [
    "carplay",
    "android_auto",
    "bluetooth_audio",
    "built_in_automotive_os",
    "ev_infotainment",
  ],
  accessibility_features: [
    "screen_reader",
    "high_contrast",
    "voice_control",
    "wheelchair_routing",
    "step_free_routes",
    "reduced_motion",
  ],
  voice_language_support: [
    "voice_guidance",
    "multiple_voice_languages",
    "street_name_announcements",
    "offline_tts",
    "regional_localization",
  ],
  custom_maps_layers: [
    "pins",
    "routes",
    "overlays",
    "annotations",
    "collections",
    "measurement_tools",
  ],
  import_export_formats: [
    "gpx",
    "kml_kmz",
    "geojson",
    "csv",
    "osm",
    "favorites_export",
  ],
  sharing_collaboration_features: [
    "route_sharing",
    "location_sharing",
    "shared_lists",
    "public_maps",
    "embed",
  ],
  contribution_editing_model: [
    "none",
    "osm_editor_link",
    "in_app_edits",
    "provider_feedback",
    "community_moderated",
  ],
  map_tile_api_embedding: [
    "none",
    "static_embed",
    "web_sdk",
    "tile_api",
    "geocoding_api",
    "routing_api",
    "self_hosted_tiles",
  ],
  fit_profiles: [
    "everyday_driving",
    "offline_travel",
    "privacy_sensitive",
    "transit_commuters",
    "cyclists_walkers",
    "outdoor_hiking",
    "ev_drivers",
    "accessibility_needs",
    "developers",
    "businesses",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  map_data_source_model: {
    proprietary_provider: "warning",
    community_contributed: "tradeoff",
    provider_api: "tradeoff",
  },
  geographic_coverage_scope: {
    outdoor_specialized: "tradeoff",
  },
  poi_database_features: {
    user_reviews: "tradeoff",
    business_updates: "tradeoff",
  },
  map_update_model: {
    manual_imports: "tradeoff",
  },
  public_transit_routing_model: {
    none: "warning",
    regional_only: "tradeoff",
  },
  guidance_features: {
    speed_cameras: "tradeoff",
  },
  offline_download_model: {
    none: "warning",
    cache_only: "tradeoff",
  },
  location_history_model: {
    default_on_cloud: "warning",
    account_required_history: "tradeoff",
  },
  location_data_retention: {
    account_history_optional: "tradeoff",
    retained_for_service: "tradeoff",
    retained_for_ads: "warning",
  },
  personalization_ads_model: {
    account_personalized: "tradeoff",
    location_based_ads: "warning",
    subscription_no_ads: "tradeoff",
  },
  place_detail_fields: {
    business_claims: "tradeoff",
  },
  review_rating_model: {
    first_party_reviews: "tradeoff",
    partner_reviews: "tradeoff",
  },
  business_listing_management: {
    provider_portal: "tradeoff",
    owner_claiming: "tradeoff",
    partner_feed: "tradeoff",
  },
  booking_commerce_integrations: {
    reservations: "tradeoff",
    tickets: "tradeoff",
    food_ordering: "tradeoff",
    ride_hailing: "tradeoff",
    hotel_booking: "tradeoff",
    paid_promotions: "warning",
  },
  supported_mobility_services: {
    ride_hailing: "tradeoff",
  },
  truck_or_professional_routing: {
    professional_profiles: "tradeoff",
  },
  mobile_app_distribution: {
    direct_apk: "tradeoff",
    repository_packages: "tradeoff",
  },
  vehicle_integration: {
    built_in_automotive_os: "tradeoff",
  },
  sharing_collaboration_features: {
    location_sharing: "tradeoff",
    public_maps: "tradeoff",
  },
  contribution_editing_model: {
    in_app_edits: "tradeoff",
  },
  map_tile_api_embedding: {
    web_sdk: "tradeoff",
    tile_api: "tradeoff",
    geocoding_api: "tradeoff",
    routing_api: "tradeoff",
  },
  fit_profiles: {
    developers: "tradeoff",
  },
} as const satisfies Record<string, Record<string, "warning" | "tradeoff">>;

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

describe("maps matrix criteria migration", () => {
  it("adds the repository-owned migration for Maps & Navigation matrix metadata", () => {
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

  it("defines ordered Maps & Navigation criterion groups with localized labels", () => {
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

  it("defines category-native Maps & Navigation criteria with valid metadata and localized copy", () => {
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
      .filter(
        (option) =>
          option.displayTone === "warning" || option.displayTone === "tradeoff",
      )
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'maps'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'maps'\s+WHERE\b/i,
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
});
