import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "social-media";
const migrationVersion = "011-social-media-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/011-social-media-matrix-criteria.sql",
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
  { key: "identity_profiles", labelEn: "Identity & Profiles", sortOrder: 100 },
  {
    key: "graph_discovery",
    labelEn: "Social Graph & Discovery",
    sortOrder: 200,
  },
  {
    key: "content_publishing",
    labelEn: "Content & Publishing",
    sortOrder: 300,
  },
  { key: "feeds_algorithms", labelEn: "Feeds & Algorithms", sortOrder: 400 },
  { key: "privacy_safety", labelEn: "Privacy & Safety", sortOrder: 500 },
  {
    key: "moderation_governance",
    labelEn: "Moderation & Governance",
    sortOrder: 600,
  },
  {
    key: "interoperability_portability",
    labelEn: "Interoperability & Portability",
    sortOrder: 700,
  },
  {
    key: "monetization_creator",
    labelEn: "Monetization & Creator Tools",
    sortOrder: 800,
  },
  { key: "access_fit", labelEn: "Access & Fit", sortOrder: 900 },
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
    key: "real_name_required",
    groupKey: "identity_profiles",
    labelEn: "Real name required",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 1010,
  },
  {
    key: "account_signup_methods",
    groupKey: "identity_profiles",
    labelEn: "Account sign-up methods",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 1020,
  },
  {
    key: "pseudonymous_accounts",
    groupKey: "identity_profiles",
    labelEn: "Pseudonymous accounts supported",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "profile_verification_model",
    groupKey: "identity_profiles",
    labelEn: "Profile verification model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "social_graph_model",
    groupKey: "graph_discovery",
    labelEn: "Social graph model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2010,
  },
  {
    key: "relationship_model",
    groupKey: "graph_discovery",
    labelEn: "Relationship model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "discovery_methods",
    groupKey: "graph_discovery",
    labelEn: "Discovery methods",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2030,
  },
  {
    key: "hashtags_mentions_support",
    groupKey: "graph_discovery",
    labelEn: "Hashtags and mentions",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2040,
  },
  {
    key: "post_content_types",
    groupKey: "content_publishing",
    labelEn: "Post content types",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3010,
  },
  {
    key: "max_text_post_length",
    groupKey: "content_publishing",
    labelEn: "Maximum text post length",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 3020,
  },
  {
    key: "media_upload_types",
    groupKey: "content_publishing",
    labelEn: "Media upload types",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3030,
  },
  {
    key: "ephemeral_or_story_posts",
    groupKey: "content_publishing",
    labelEn: "Stories or ephemeral posts",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "live_streaming_or_events",
    groupKey: "content_publishing",
    labelEn: "Live streaming or events",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3050,
  },
  {
    key: "interaction_features",
    groupKey: "content_publishing",
    labelEn: "Interaction features",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3060,
  },
  {
    key: "default_feed_model",
    groupKey: "feeds_algorithms",
    labelEn: "Default feed model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4010,
  },
  {
    key: "chronological_feed_available",
    groupKey: "feeds_algorithms",
    labelEn: "Chronological feed available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "feed_algorithm_controls",
    groupKey: "feeds_algorithms",
    labelEn: "Feed algorithm controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4030,
  },
  {
    key: "recommendation_controls",
    groupKey: "feeds_algorithms",
    labelEn: "Recommendation controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4040,
  },
  {
    key: "account_visibility_controls",
    groupKey: "privacy_safety",
    labelEn: "Account visibility controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5010,
  },
  {
    key: "post_audience_controls",
    groupKey: "privacy_safety",
    labelEn: "Post audience controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5020,
  },
  {
    key: "direct_message_model",
    groupKey: "privacy_safety",
    labelEn: "Direct message model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "blocking_mute_controls",
    groupKey: "privacy_safety",
    labelEn: "Blocking and mute controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5040,
  },
  {
    key: "sensitive_content_controls",
    groupKey: "privacy_safety",
    labelEn: "Sensitive-content controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5050,
  },
  {
    key: "moderation_model",
    groupKey: "moderation_governance",
    labelEn: "Moderation model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "community_admin_tools",
    groupKey: "moderation_governance",
    labelEn: "Community admin tools",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6020,
  },
  {
    key: "reporting_enforcement_tools",
    groupKey: "moderation_governance",
    labelEn: "Reporting and enforcement tools",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6030,
  },
  {
    key: "moderation_transparency",
    groupKey: "moderation_governance",
    labelEn: "Moderation transparency",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "appeal_process_documented",
    groupKey: "moderation_governance",
    labelEn: "Appeal process documented",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6050,
  },
  {
    key: "network_architecture",
    groupKey: "interoperability_portability",
    labelEn: "Network architecture",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "federation_protocols",
    groupKey: "interoperability_portability",
    labelEn: "Federation protocols",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "data_export_available",
    groupKey: "interoperability_portability",
    labelEn: "Data export available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "account_migration_supported",
    groupKey: "interoperability_portability",
    labelEn: "Account migration support",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "ads_model",
    groupKey: "monetization_creator",
    labelEn: "Ads model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "ad_personalization_controls",
    groupKey: "monetization_creator",
    labelEn: "Ad personalization controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 8020,
  },
  {
    key: "creator_monetization_tools",
    groupKey: "monetization_creator",
    labelEn: "Creator monetization tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "commerce_fundraising_tools",
    groupKey: "monetization_creator",
    labelEn: "Commerce and fundraising tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8040,
  },
  {
    key: "supported_platforms",
    groupKey: "access_fit",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9010,
  },
  {
    key: "developer_api",
    groupKey: "access_fit",
    labelEn: "Developer API",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "self_hosting_available",
    groupKey: "access_fit",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "accessibility_features",
    groupKey: "access_fit",
    labelEn: "Accessibility features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 9040,
  },
  {
    key: "fit_profiles",
    groupKey: "access_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9050,
  },
];

const requiredOptionsByCriterion = {
  account_signup_methods: [
    "email",
    "phone_number",
    "username_only",
    "invite_required",
    "organization_sso",
    "cryptographic_key",
  ],
  profile_verification_model: [
    "none",
    "platform_badge",
    "paid_badge",
    "domain_link_verification",
    "organization_verification",
    "decentralized_identity",
  ],
  social_graph_model: [
    "follower_graph",
    "mutual_friends",
    "topic_community_graph",
    "professional_graph",
    "instance_graph",
  ],
  relationship_model: [
    "one_way_follow",
    "mutual_connection",
    "group_membership",
    "subscription_channel",
    "professional_connection",
  ],
  discovery_methods: [
    "username_search",
    "contact_import",
    "public_directory",
    "recommendations",
    "invite_links",
    "qr_code",
  ],
  hashtags_mentions_support: [
    "hashtags",
    "mentions",
    "topics",
    "lists",
    "trends",
  ],
  post_content_types: [
    "short_posts",
    "long_posts",
    "threads",
    "articles",
    "link_posts",
    "polls",
  ],
  media_upload_types: [
    "images",
    "short_video",
    "long_video",
    "audio",
    "documents",
    "albums_galleries",
  ],
  live_streaming_or_events: [
    "live_video",
    "scheduled_events",
    "audio_spaces",
    "premieres",
    "event_pages",
  ],
  interaction_features: [
    "likes",
    "reposts",
    "quote_posts",
    "comments_replies",
    "reactions",
    "bookmarks",
  ],
  default_feed_model: [
    "chronological",
    "algorithmic",
    "hybrid",
    "community_curated",
    "user_configured",
  ],
  feed_algorithm_controls: [
    "chronological_toggle",
    "custom_feeds",
    "mute_keywords",
    "hide_reposts",
    "topic_filters",
    "recommended_content_toggle",
  ],
  recommendation_controls: [
    "opt_out_recommendations",
    "interest_controls",
    "follow_suggestions",
    "trending_controls",
    "sensitive_recommendation_filters",
  ],
  account_visibility_controls: [
    "public_profile",
    "private_profile",
    "unlisted_profile",
    "follower_approval",
    "search_indexing_toggle",
  ],
  post_audience_controls: [
    "public_posts",
    "followers_only",
    "mentioned_only",
    "local_instance_only",
    "custom_circles",
  ],
  direct_message_model: [
    "none",
    "followers_only",
    "mutuals_only",
    "open_inbox",
    "encrypted_dm",
  ],
  blocking_mute_controls: [
    "block_accounts",
    "mute_accounts",
    "mute_keywords",
    "block_domains_instances",
    "hide_replies",
    "restrict_accounts",
  ],
  sensitive_content_controls: [
    "content_warnings",
    "nsfw_labels",
    "media_blur",
    "age_gate",
    "user_filters",
    "parental_controls",
  ],
  moderation_model: [
    "centralized_platform",
    "federated_instance",
    "community_moderated",
    "user_moderated",
    "hybrid",
  ],
  community_admin_tools: [
    "roles_permissions",
    "member_bans",
    "moderation_queue",
    "pinned_posts",
    "rule_posts",
    "moderator_logs",
  ],
  reporting_enforcement_tools: [
    "user_reports",
    "spam_reports",
    "abuse_reports",
    "copyright_reports",
    "trusted_flaggers",
  ],
  moderation_transparency: [
    "none",
    "public_rules_only",
    "transparency_report",
    "per_action_notices",
    "public_modlog",
  ],
  network_architecture: [
    "centralized_hosted",
    "federated",
    "decentralized_protocol",
    "peer_to_peer",
    "self_hosted_instance",
  ],
  federation_protocols: [
    "activitypub",
    "at_protocol",
    "nostr",
    "diaspora_protocol",
    "rss_websub",
    "custom_bridge",
  ],
  account_migration_supported: [
    "unsupported",
    "data_export_only",
    "handle_redirect",
    "follower_migration",
    "full_account_move",
  ],
  ads_model: [
    "none",
    "contextual_ads",
    "personalized_ads",
    "promoted_posts",
    "creator_sponsored",
    "unclear",
  ],
  ad_personalization_controls: [
    "opt_out_personalized_ads",
    "interest_controls",
    "third_party_tracking_controls",
    "ad_topic_controls",
    "no_ads_paid_tier",
    "not_applicable",
  ],
  creator_monetization_tools: [
    "tips_donations",
    "subscriptions",
    "paid_posts",
    "revenue_share",
    "paid_events",
    "creator_marketplace",
  ],
  commerce_fundraising_tools: [
    "shop_links",
    "product_catalog",
    "fundraisers",
    "ticketed_events",
    "lead_forms",
  ],
  supported_platforms: [
    "web",
    "android",
    "ios",
    "windows",
    "macos",
    "linux",
    "f_droid",
  ],
  developer_api: [
    "none",
    "read_only",
    "public_write_api",
    "paid_api",
    "self_hosted_api",
    "undocumented",
  ],
  accessibility_features: [
    "alt_text",
    "captions",
    "keyboard_navigation",
    "screen_reader_labels",
    "reduced_motion",
    "language_translation",
  ],
  fit_profiles: [
    "friends_family",
    "creators",
    "journalists_public_figures",
    "communities",
    "professional_networking",
    "nonprofits_campaigns",
    "self_hosters",
    "low_algorithm_users",
  ],
} as const;

const forbiddenGenericCriterionKeys = [
  "headquarters_country",
  "ownership_model",
  "privacy_policy_quality",
  "open_source_status",
  "gdpr_compliance",
  "business_model",
  "trust_score",
];

function stripSqlComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insertStatementsFor(tableName: string): string[] {
  const pattern = new RegExp(
    `\\bINSERT\\s+(?:IGNORE\\s+)?INTO\\s+\`?${escapeRegExp(
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

describe("social media matrix criteria migration", () => {
  it("adds the repository-owned migration for Social Media matrix metadata", () => {
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

  it("defines user-readable Social Media criterion groups with localized labels", () => {
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

  it("defines category-native Social Media criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'social-media'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'social-media'\s+WHERE\b/i,
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
