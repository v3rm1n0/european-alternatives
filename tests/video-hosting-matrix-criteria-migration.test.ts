import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "video-hosting";
const migrationVersion = "013-video-hosting-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/013-video-hosting-matrix-criteria.sql",
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
  { key: "accounts_channels", labelEn: "Accounts & Channels", sortOrder: 100 },
  { key: "upload_ingest", labelEn: "Upload & Ingest", sortOrder: 200 },
  {
    key: "playback_delivery",
    labelEn: "Playback & Delivery",
    sortOrder: 300,
  },
  { key: "live_streaming", labelEn: "Live Streaming", sortOrder: 400 },
  {
    key: "discovery_engagement",
    labelEn: "Discovery & Engagement",
    sortOrder: 500,
  },
  {
    key: "moderation_safety",
    labelEn: "Moderation & Safety",
    sortOrder: 600,
  },
  { key: "privacy_data_ads", labelEn: "Privacy, Data & Ads", sortOrder: 700 },
  {
    key: "creator_business",
    labelEn: "Creator & Business Tools",
    sortOrder: 800,
  },
  {
    key: "interoperability_portability",
    labelEn: "Interoperability & Portability",
    sortOrder: 900,
  },
  { key: "deployment_fit", labelEn: "Deployment & Fit", sortOrder: 1000 },
] as const;

type CriterionExpectation = {
  key: string;
  groupKey: (typeof expectedGroups)[number]["key"];
  labelEn: string;
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
    key: "account_required_to_watch",
    groupKey: "accounts_channels",
    labelEn: "Account required to watch",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 1010,
  },
  {
    key: "account_required_to_upload",
    groupKey: "accounts_channels",
    labelEn: "Account required to upload",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "channel_profile_model",
    groupKey: "accounts_channels",
    labelEn: "Channel/profile model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "pseudonymous_channels_supported",
    groupKey: "accounts_channels",
    labelEn: "Pseudonymous channels supported",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "organization_or_brand_accounts",
    groupKey: "accounts_channels",
    labelEn: "Organization/brand accounts",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "supported_upload_methods",
    groupKey: "upload_ingest",
    labelEn: "Supported upload methods",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2010,
  },
  {
    key: "supported_input_formats",
    groupKey: "upload_ingest",
    labelEn: "Supported input formats",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2020,
  },
  {
    key: "max_video_file_size_mb",
    groupKey: "upload_ingest",
    labelEn: "Maximum video file size (MB)",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 2030,
  },
  {
    key: "max_video_duration_minutes",
    groupKey: "upload_ingest",
    labelEn: "Maximum video duration (minutes)",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 2040,
  },
  {
    key: "storage_quota_model",
    groupKey: "upload_ingest",
    labelEn: "Storage quota model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "transcoding_delivery_model",
    groupKey: "upload_ingest",
    labelEn: "Transcoding and delivery model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2060,
  },
  {
    key: "thumbnail_and_metadata_tools",
    groupKey: "upload_ingest",
    labelEn: "Thumbnail and metadata tools",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2070,
  },
  {
    key: "embedded_player_available",
    groupKey: "playback_delivery",
    labelEn: "Embedded player available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "adaptive_streaming_available",
    groupKey: "playback_delivery",
    labelEn: "Adaptive streaming available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "playback_quality_options",
    groupKey: "playback_delivery",
    labelEn: "Playback quality options",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3030,
  },
  {
    key: "player_distribution_channels",
    groupKey: "playback_delivery",
    labelEn: "Player distribution channels",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3040,
  },
  {
    key: "offline_download_model",
    groupKey: "playback_delivery",
    labelEn: "Offline/download model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "drm_or_restricted_playback",
    groupKey: "playback_delivery",
    labelEn: "DRM or restricted playback",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 3060,
  },
  {
    key: "live_streaming_model",
    groupKey: "live_streaming",
    labelEn: "Live streaming model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4010,
  },
  {
    key: "external_rtmp_ingest",
    groupKey: "live_streaming",
    labelEn: "External RTMP ingest",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "scheduled_streams_or_premieres",
    groupKey: "live_streaming",
    labelEn: "Scheduled streams or premieres",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "live_interaction_tools",
    groupKey: "live_streaming",
    labelEn: "Live interaction tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4040,
  },
  {
    key: "stream_recording_archive",
    groupKey: "live_streaming",
    labelEn: "Stream recording/archive",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "low_latency_streaming",
    groupKey: "live_streaming",
    labelEn: "Low-latency streaming",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4060,
  },
  {
    key: "search_available",
    groupKey: "discovery_engagement",
    labelEn: "Search available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "discovery_feed_model",
    groupKey: "discovery_engagement",
    labelEn: "Discovery/feed model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "recommendation_controls",
    groupKey: "discovery_engagement",
    labelEn: "Recommendation controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5030,
  },
  {
    key: "interaction_features",
    groupKey: "discovery_engagement",
    labelEn: "Interaction features",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5040,
  },
  {
    key: "comment_model",
    groupKey: "discovery_engagement",
    labelEn: "Comment model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5050,
  },
  {
    key: "playlists_or_collections",
    groupKey: "discovery_engagement",
    labelEn: "Playlists or collections",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5060,
  },
  {
    key: "creator_moderation_tools",
    groupKey: "moderation_safety",
    labelEn: "Creator moderation tools",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6010,
  },
  {
    key: "reporting_enforcement_tools",
    groupKey: "moderation_safety",
    labelEn: "Reporting and enforcement tools",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6020,
  },
  {
    key: "content_policy_transparency",
    groupKey: "moderation_safety",
    labelEn: "Content policy transparency",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "copyright_handling_model",
    groupKey: "moderation_safety",
    labelEn: "Copyright handling model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "sensitive_content_controls",
    groupKey: "moderation_safety",
    labelEn: "Sensitive-content controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6050,
  },
  {
    key: "appeal_process_documented",
    groupKey: "moderation_safety",
    labelEn: "Appeal process documented",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6060,
  },
  {
    key: "default_video_visibility",
    groupKey: "privacy_data_ads",
    labelEn: "Default video visibility",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "video_visibility_controls",
    groupKey: "privacy_data_ads",
    labelEn: "Video visibility controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "ads_tracking_model",
    groupKey: "privacy_data_ads",
    labelEn: "Ads/tracking model",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "ad_personalization_controls",
    groupKey: "privacy_data_ads",
    labelEn: "Ad personalization controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7040,
  },
  {
    key: "data_export_formats",
    groupKey: "privacy_data_ads",
    labelEn: "Data export formats",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7050,
  },
  {
    key: "analytics_depth",
    groupKey: "privacy_data_ads",
    labelEn: "Analytics depth",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7060,
  },
  {
    key: "monetization_tools",
    groupKey: "creator_business",
    labelEn: "Monetization tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8010,
  },
  {
    key: "paid_content_support",
    groupKey: "creator_business",
    labelEn: "Paid content support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8020,
  },
  {
    key: "creator_support_tools",
    groupKey: "creator_business",
    labelEn: "Creator support tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "revenue_share_transparency",
    groupKey: "creator_business",
    labelEn: "Revenue-share transparency",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8040,
  },
  {
    key: "federation_protocols",
    groupKey: "interoperability_portability",
    labelEn: "Federation and syndication protocols",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 9010,
  },
  {
    key: "embed_oembed_support",
    groupKey: "interoperability_portability",
    labelEn: "Embed/oEmbed support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "developer_api",
    groupKey: "interoperability_portability",
    labelEn: "Developer API",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "portability_migration",
    groupKey: "interoperability_portability",
    labelEn: "Portability and migration",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 9040,
  },
  {
    key: "import_from_external_platforms",
    groupKey: "interoperability_portability",
    labelEn: "Import from external platforms",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9050,
  },
  {
    key: "deployment_model",
    groupKey: "deployment_fit",
    labelEn: "Deployment model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 10010,
  },
  {
    key: "self_hosting_available",
    groupKey: "deployment_fit",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 10020,
  },
  {
    key: "admin_controls",
    groupKey: "deployment_fit",
    labelEn: "Admin controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 10030,
  },
  {
    key: "accessibility_features",
    groupKey: "deployment_fit",
    labelEn: "Accessibility features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 10040,
  },
  {
    key: "fit_profiles",
    groupKey: "deployment_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 10050,
  },
];

const requiredOptionsByCriterion = {
  channel_profile_model: [
    "personal_channels",
    "organization_channels",
    "brand_channels",
    "instance_accounts",
    "no_public_channels",
  ],
  supported_upload_methods: [
    "web_upload",
    "mobile_upload",
    "api_upload",
    "bulk_import",
    "remote_url_import",
    "rss_import",
  ],
  supported_input_formats: ["mp4", "webm", "mov", "mkv", "audio_only"],
  storage_quota_model: [
    "per_video_limit",
    "account_quota",
    "plan_based_quota",
    "admin_configurable",
    "not_documented",
  ],
  transcoding_delivery_model: [
    "provider_transcoding",
    "self_hosted_transcoding",
    "direct_file_serving",
    "adaptive_streaming",
    "external_encoder_required",
  ],
  thumbnail_and_metadata_tools: [
    "custom_thumbnail",
    "auto_thumbnail",
    "tags_categories",
    "chapters",
    "scheduled_publish",
  ],
  playback_quality_options: [
    "sd_480p",
    "hd_720p",
    "full_hd_1080p",
    "uhd_4k",
    "manual_quality_selector",
  ],
  player_distribution_channels: [
    "iframe_embed",
    "oembed",
    "rss_atom_feeds",
    "casting",
    "tv_apps",
  ],
  offline_download_model: [
    "none",
    "creator_downloads",
    "viewer_downloads",
    "paid_offline",
    "app_cache_only",
  ],
  live_streaming_model: [
    "none",
    "native_live",
    "rtmp_ingest",
    "scheduled_premieres",
    "restreaming",
  ],
  live_interaction_tools: [
    "live_chat",
    "reactions",
    "polls",
    "qna",
    "moderation_queue",
  ],
  discovery_feed_model: [
    "search_only",
    "chronological_subscriptions",
    "algorithmic_recommendations",
    "editorial_curated",
    "federated_timeline",
  ],
  recommendation_controls: [
    "disable_autoplay",
    "hide_recommendations",
    "chronological_subscriptions",
    "topic_controls",
    "history_controls",
  ],
  interaction_features: [
    "likes",
    "dislikes",
    "comments",
    "replies",
    "shares",
    "bookmarks",
    "playlists",
  ],
  comment_model: [
    "none",
    "hosted_comments",
    "federated_comments",
    "external_comments",
    "creator_moderated",
  ],
  creator_moderation_tools: [
    "comment_moderation",
    "block_users",
    "keyword_filters",
    "age_restriction",
    "geo_restriction",
    "manual_approval",
  ],
  reporting_enforcement_tools: [
    "user_reports",
    "spam_abuse_reports",
    "copyright_reports",
    "trusted_flaggers",
    "appeal_process",
  ],
  content_policy_transparency: [
    "none",
    "public_rules",
    "transparency_report",
    "action_notices",
    "public_modlog",
  ],
  copyright_handling_model: [
    "notice_takedown",
    "automated_matching",
    "manual_claims",
    "creator_licenses",
    "unclear",
  ],
  sensitive_content_controls: [
    "content_warnings",
    "age_gate",
    "nsfw_labels",
    "parental_controls",
    "media_blur",
  ],
  default_video_visibility: [
    "public",
    "unlisted",
    "private",
    "followers_only",
    "instance_local",
  ],
  video_visibility_controls: [
    "public",
    "unlisted_link",
    "private",
    "password_protected",
    "members_only",
    "scheduled_release",
  ],
  ads_tracking_model: [
    "no_ads",
    "contextual_ads",
    "personalized_ads",
    "creator_sponsorships",
    "unclear",
  ],
  ad_personalization_controls: [
    "opt_out_personalized_ads",
    "interest_controls",
    "third_party_tracking_controls",
    "no_ads_paid_tier",
    "not_applicable",
  ],
  data_export_formats: [
    "account_export",
    "video_file_export",
    "metadata_json_csv",
    "subtitles_export",
    "analytics_export",
    "comments_export",
  ],
  analytics_depth: [
    "none",
    "basic_views",
    "engagement_metrics",
    "audience_geography",
    "retention_graphs",
    "realtime_analytics",
  ],
  monetization_tools: [
    "donations_tips",
    "subscriptions",
    "ads_revenue_share",
    "memberships",
    "paid_videos",
    "merch_links",
    "crowdfunding",
  ],
  paid_content_support: [
    "none",
    "pay_per_view",
    "subscriptions",
    "rentals",
    "ticketed_live",
    "private_sales",
  ],
  creator_support_tools: [
    "custom_thumbnails",
    "chapters",
    "end_screens_cards",
    "creator_studio",
    "bulk_editing",
    "scheduled_publish",
  ],
  revenue_share_transparency: [
    "none",
    "published_rates",
    "tier_dependent",
    "invite_or_partner_only",
    "unclear",
  ],
  federation_protocols: [
    "activitypub",
    "websub",
    "rss_atom",
    "oembed",
    "custom_bridge",
  ],
  developer_api: [
    "none",
    "read_only",
    "public_write_api",
    "admin_api",
    "paid_api",
    "undocumented",
  ],
  portability_migration: [
    "account_export",
    "video_import",
    "channel_import",
    "federation_followers",
    "redirects",
    "bulk_download",
  ],
  deployment_model: [
    "hosted_saas",
    "self_hosted",
    "federated_instance",
    "hybrid",
    "managed_hosting",
  ],
  admin_controls: [
    "user_management",
    "quotas",
    "instance_moderation",
    "custom_policies",
    "audit_logs",
    "storage_backends",
  ],
  accessibility_features: [
    "captions_subtitles",
    "transcripts",
    "audio_descriptions",
    "keyboard_controls",
    "screen_reader_labels",
    "multilingual_metadata",
  ],
  fit_profiles: [
    "viewers",
    "creators",
    "educators",
    "organizations",
    "live_streamers",
    "communities",
    "self_hosters",
    "privacy_sensitive",
    "public_media_archive",
  ],
} as const satisfies Record<string, readonly string[]>;

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

describe("video hosting matrix criteria migration", () => {
  it("adds the repository-owned migration for Video Hosting matrix metadata", () => {
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

  it("defines user-readable Video Hosting criterion groups with localized labels", () => {
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

  it("defines category-native Video Hosting criteria with valid metadata and localized copy", () => {
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

    for (const forbiddenKey of forbiddenGenericCriterionKeys) {
      expect(normalizedMigration).not.toContain(`'${forbiddenKey}'`);
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'video-hosting'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'video-hosting'\s+WHERE\b/i,
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
