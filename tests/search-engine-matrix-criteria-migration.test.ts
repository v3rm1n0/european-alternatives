import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../scripts/migrations/010-search-engine-matrix-criteria.sql",
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
    key: "result_source",
    labelEn: "Result Source & Index",
    germanHints: ["ergebnisquelle", "index"],
    sortOrder: 100,
  },
  {
    key: "privacy_personalization",
    labelEn: "Privacy & Personalization",
    germanHints: ["datenschutz", "personalisierung"],
    sortOrder: 200,
  },
  {
    key: "query_controls",
    labelEn: "Query Controls",
    germanHints: ["suchsteuerung"],
    sortOrder: 300,
  },
  {
    key: "result_types",
    labelEn: "Result Types & Verticals",
    germanHints: ["ergebnistypen", "vertikale"],
    sortOrder: 400,
  },
  {
    key: "ai_answers",
    labelEn: "AI & Answer Features",
    germanHints: ["ki", "antwortfunktionen"],
    sortOrder: 500,
  },
  {
    key: "ads_commercial",
    labelEn: "Ads & Commercial Model",
    germanHints: ["anzeigen", "geschaeftsmodell"],
    sortOrder: 600,
  },
  {
    key: "access_integrations",
    labelEn: "Access & Integrations",
    germanHints: ["zugriff", "integrationen"],
    sortOrder: 700,
  },
  {
    key: "safety_transparency",
    labelEn: "Safety & Transparency",
    germanHints: ["sicherheit", "transparenz"],
    sortOrder: 800,
  },
  {
    key: "fit_profiles",
    labelEn: "Fit Profiles",
    germanHints: ["eignungsprofile"],
    sortOrder: 900,
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
    key: "search_source_model",
    groupKey: "result_source",
    labelEn: "Search source model",
    germanHints: ["suchquellenmodell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "upstream_result_sources",
    groupKey: "result_source",
    labelEn: "Upstream result sources",
    germanHints: ["upstream", "ergebnisquellen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1020,
  },
  {
    key: "own_web_index",
    groupKey: "result_source",
    labelEn: "Own web index",
    germanHints: ["eigener", "webindex"],
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "result_freshness_controls",
    groupKey: "result_source",
    labelEn: "Result freshness controls",
    germanHints: ["frische", "kontrollen"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 1040,
  },
  {
    key: "regional_language_controls",
    groupKey: "result_source",
    labelEn: "Region and language controls",
    germanHints: ["regions", "sprachkontrollen"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 1050,
  },
  {
    key: "account_required_for_search",
    groupKey: "privacy_personalization",
    labelEn: "Account required for search",
    germanHints: ["konto", "erforderlich"],
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 2010,
  },
  {
    key: "query_logging_retention",
    groupKey: "privacy_personalization",
    labelEn: "Query logging retention",
    germanHints: ["speicherdauer", "suchanfragen"],
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "ip_address_handling",
    groupKey: "privacy_personalization",
    labelEn: "IP address handling",
    germanHints: ["ip-adressen"],
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "personalized_results",
    groupKey: "privacy_personalization",
    labelEn: "Personalized results",
    germanHints: ["personalisierte", "ergebnisse"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "cookie_free_search",
    groupKey: "privacy_personalization",
    labelEn: "Cookie-free search",
    germanHints: ["cookies"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "third_party_trackers_on_results",
    groupKey: "privacy_personalization",
    labelEn: "Third-party trackers on result pages",
    germanHints: ["drittanbieter-tracker"],
    valueType: "boolean",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 2060,
  },
  {
    key: "advanced_search_operators",
    groupKey: "query_controls",
    labelEn: "Advanced search operators",
    germanHints: ["suchoperatoren"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3010,
  },
  {
    key: "search_filter_controls",
    groupKey: "query_controls",
    labelEn: "Search filter controls",
    germanHints: ["suchfilter-kontrollen"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3020,
  },
  {
    key: "ranking_customization",
    groupKey: "query_controls",
    labelEn: "Ranking customization",
    germanHints: ["ranking-anpassung"],
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 3030,
  },
  {
    key: "result_page_features",
    groupKey: "query_controls",
    labelEn: "Result page features",
    germanHints: ["ergebnisseite"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3040,
  },
  {
    key: "spelling_query_assistance",
    groupKey: "query_controls",
    labelEn: "Spelling and query assistance",
    germanHints: ["rechtschreib", "anfragehilfe"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3050,
  },
  {
    key: "vertical_search_types",
    groupKey: "result_types",
    labelEn: "Vertical search types",
    germanHints: ["vertikale", "suchtypen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4010,
  },
  {
    key: "image_search_filters",
    groupKey: "result_types",
    labelEn: "Image search filters",
    germanHints: ["bildsuchfilter"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4020,
  },
  {
    key: "news_search_controls",
    groupKey: "result_types",
    labelEn: "News search controls",
    germanHints: ["nachrichten", "suchkontrollen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4030,
  },
  {
    key: "maps_local_model",
    groupKey: "result_types",
    labelEn: "Maps and local search model",
    germanHints: ["karten", "lokalsuchmodell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "multimedia_search_controls",
    groupKey: "result_types",
    labelEn: "Multimedia search controls",
    germanHints: ["multimedia"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4050,
  },
  {
    key: "ai_answer_mode",
    groupKey: "ai_answers",
    labelEn: "AI answer mode",
    germanHints: ["ki-antwortmodus"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "ai_source_citations",
    groupKey: "ai_answers",
    labelEn: "AI source citations",
    germanHints: ["quellenangaben", "ki"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "ai_data_use_controls",
    groupKey: "ai_answers",
    labelEn: "AI data-use controls",
    germanHints: ["ki-datennutzung"],
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "non_ai_instant_answers",
    groupKey: "ai_answers",
    labelEn: "Non-AI instant answers",
    germanHints: ["nicht-ki", "sofortantworten"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5040,
  },
  {
    key: "search_ads_model",
    groupKey: "ads_commercial",
    labelEn: "Search ads model",
    germanHints: ["suchanzeigenmodell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "ad_labeling_clarity",
    groupKey: "ads_commercial",
    labelEn: "Ad labeling clarity",
    germanHints: ["anzeigenkennzeichnung"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "affiliate_shopping_links",
    groupKey: "ads_commercial",
    labelEn: "Affiliate or shopping links",
    germanHints: ["affiliate", "shopping-links"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "subscription_or_paid_tier",
    groupKey: "ads_commercial",
    labelEn: "Subscription or paid tier",
    germanHints: ["abo", "bezahlmodell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "access_paths",
    groupKey: "access_integrations",
    labelEn: "Access paths",
    germanHints: ["zugriffswege"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7010,
  },
  {
    key: "browser_default_support",
    groupKey: "access_integrations",
    labelEn: "Browser default-search support",
    germanHints: ["browser-standardsuche"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "developer_api",
    groupKey: "access_integrations",
    labelEn: "Developer API",
    germanHints: ["entwickler-api"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "self_hosting_available",
    groupKey: "access_integrations",
    labelEn: "Self-hosting available",
    germanHints: ["selbsthosting", "verfuegbar"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "opensearch_description_support",
    groupKey: "access_integrations",
    labelEn: "OpenSearch description support",
    germanHints: ["opensearch-description"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7050,
  },
  {
    key: "safe_search_controls",
    groupKey: "safety_transparency",
    labelEn: "Safe search controls",
    germanHints: ["safe-search-kontrollen"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "malware_phishing_warnings",
    groupKey: "safety_transparency",
    labelEn: "Malware and phishing warnings",
    germanHints: ["malware", "phishing-warnungen"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "content_removal_transparency",
    groupKey: "safety_transparency",
    labelEn: "Content removal transparency",
    germanHints: ["inhaltsentfernung"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8030,
  },
  {
    key: "result_transparency_signals",
    groupKey: "safety_transparency",
    labelEn: "Result transparency signals",
    germanHints: ["transparenzsignale"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8040,
  },
  {
    key: "fit_profiles",
    groupKey: "fit_profiles",
    labelEn: "Fit profiles",
    germanHints: ["eignungsprofile"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9010,
  },
  {
    key: "best_query_types",
    groupKey: "fit_profiles",
    labelEn: "Best query types",
    germanHints: ["beste", "anfragearten"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9020,
  },
];

const requiredOptionsByCriterion = {
  search_source_model: [
    "own_index",
    "metasearch",
    "upstream_api_proxy",
    "hybrid",
    "curated_vertical",
    "self_hosted_instance",
  ],
  upstream_result_sources: [
    "own_index",
    "bing",
    "google",
    "brave_search",
    "mojeek",
    "open_web_index",
    "wikimedia",
    "openstreetmap",
    "user_configured",
  ],
  result_freshness_controls: [
    "date_range",
    "recent_results",
    "news_freshness",
    "sort_by_date",
    "cached_snapshot",
  ],
  regional_language_controls: [
    "country_region",
    "interface_language",
    "result_language",
    "location_override",
    "no_location_bias",
  ],
  query_logging_retention: [
    "no_personal_logs",
    "short_retention",
    "anonymized_aggregate",
    "account_history_optional",
    "personalized_history",
    "unclear",
  ],
  ip_address_handling: [
    "not_logged",
    "anonymized",
    "proxied_to_upstream",
    "retained_for_security",
    "retained_for_personalization",
    "unclear",
  ],
  personalized_results: [
    "none",
    "optional",
    "account_based",
    "default_on",
    "unclear",
  ],
  advanced_search_operators: [
    "exact_phrase",
    "exclude_terms",
    "site_operator",
    "filetype_operator",
    "boolean_operators",
    "title_url_operators",
  ],
  search_filter_controls: [
    "date",
    "region",
    "language",
    "safe_search",
    "content_type",
    "license",
    "source",
  ],
  ranking_customization: [
    "block_domains",
    "boost_domains",
    "custom_lenses",
    "preferred_sources",
    "result_reranking",
    "no_customization",
  ],
  result_page_features: [
    "snippets",
    "cached_pages",
    "knowledge_panels",
    "related_questions",
    "query_suggestions",
    "source_labels",
  ],
  spelling_query_assistance: [
    "spelling_correction",
    "autocomplete",
    "related_searches",
    "synonym_expansion",
  ],
  vertical_search_types: [
    "web",
    "images",
    "videos",
    "news",
    "maps_local",
    "shopping",
    "academic",
    "forums_discussions",
    "code",
  ],
  image_search_filters: [
    "size",
    "color",
    "type",
    "license",
    "freshness",
    "safe_search",
  ],
  news_search_controls: [
    "dedicated_news",
    "source_filter",
    "date_filter",
    "region_filter",
    "publisher_labels",
  ],
  maps_local_model: [
    "none",
    "built_in",
    "partner_results",
    "openstreetmap_based",
    "external_linkout",
  ],
  multimedia_search_controls: [
    "duration",
    "source_site",
    "resolution",
    "upload_reverse_image",
    "transcript_or_caption",
  ],
  ai_answer_mode: [
    "none",
    "optional_on_demand",
    "separate_assistant",
    "default_summarization",
    "default_with_opt_out",
  ],
  ai_source_citations: [
    "not_applicable",
    "links_only",
    "inline_citations",
    "source_quotes",
    "unclear",
  ],
  ai_data_use_controls: [
    "not_used_for_ai",
    "opt_in_training",
    "opt_out_available",
    "account_based_controls",
    "unclear",
  ],
  non_ai_instant_answers: [
    "calculator",
    "unit_conversion",
    "weather",
    "dictionary",
    "encyclopedia",
    "sports_finance",
    "time_zone",
  ],
  search_ads_model: [
    "no_ads",
    "contextual_ads",
    "keyword_ads",
    "personalized_ads",
    "shopping_promotions",
    "unclear",
  ],
  ad_labeling_clarity: [
    "not_applicable",
    "explicit_labels",
    "separated_ads",
    "mixed_sponsored",
    "unclear",
  ],
  subscription_or_paid_tier: [
    "free_only",
    "free_with_paid_tier",
    "paid_required",
    "donation_supported",
    "self_hosted_free",
  ],
  access_paths: [
    "web",
    "mobile_web",
    "browser_extension",
    "android_app",
    "ios_app",
    "desktop_app",
    "tor_onion",
    "api",
    "self_hosted",
  ],
  developer_api: [
    "none",
    "public_search_api",
    "paid_search_api",
    "self_hosted_api",
    "enterprise_api",
  ],
  safe_search_controls: [
    "none",
    "basic_toggle",
    "granular_controls",
    "locked_profiles",
    "default_strict",
  ],
  content_removal_transparency: [
    "none_documented",
    "policy_only",
    "transparency_report",
    "per_result_notice",
    "appeal_process",
  ],
  result_transparency_signals: [
    "source_owner_label",
    "date_published",
    "cached_source",
    "ranking_explanation",
    "ad_disclosure",
    "ai_disclosure",
  ],
  fit_profiles: [
    "privacy_focused",
    "independent_index",
    "metasearch",
    "self_hosters",
    "general_web",
    "research_power_users",
    "family_safe",
    "ai_answer_users",
    "developer_api_users",
  ],
  best_query_types: [
    "general_web",
    "technical_docs",
    "current_news",
    "local_places",
    "shopping_products",
    "academic_research",
    "images_video",
    "forums_communities",
  ],
} as const;

const forbiddenGenericCriterionKeys = [
  "headquarters_country",
  "ownership",
  "privacy_policy",
  "privacy_policy_quality",
  "open_source",
  "open_source_status",
  "business_model",
  "gdpr_compliance",
  "eu_company",
  "founded_year",
  "country_code",
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

function insertTargetTables(): string[] {
  return [
    ...migrationSql.matchAll(/\bINSERT\s+(?:IGNORE\s+)?INTO\s+`?([a-z_]+)`?/gi),
  ].map((match) => match[1]);
}

describe("search engine matrix criteria migration", () => {
  it("adds the repository-owned migration for Search Engine matrix metadata", () => {
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
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?schema_migrations`?[\s\S]*'010-search-engine-matrix-criteria'/i,
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

  it("defines user-readable Search Engine criterion groups with English and German labels", () => {
    for (const group of expectedGroups) {
      const window = windowForLiteral(group.key, [group.labelEn]);

      expectSqlLiteral(group.key);
      expectWindowContainsSqlLiterals(window, ["search-engine", group.labelEn]);
      expectWindowContainsGermanHints(window, group.germanHints);
      expectWindowContainsNumber(window, group.sortOrder);
    }
  });

  it("defines category-native Search Engine criteria with valid metadata and localized labels", () => {
    const seenCriterionKeys = new Set<string>();
    const seenSortOrders = new Set<number>();

    expect(expectedCriteria).toHaveLength(40);

    for (const criterion of expectedCriteria) {
      const window = windowForLiteral(criterion.key, [criterion.labelEn]);

      expect(seenCriterionKeys.has(criterion.key)).toBe(false);
      seenCriterionKeys.add(criterion.key);
      expect(seenSortOrders.has(criterion.sortOrder)).toBe(false);
      seenSortOrders.add(criterion.sortOrder);
      expectSqlLiteral(criterion.key);
      expectWindowContainsSqlLiterals(window, [
        "search-engine",
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

  it("keeps group and criterion seed rows scoped to only the reviewed Search Engine metadata", () => {
    const groupRows = parseGroupRows();
    const criterionRows = parseCriterionRows();
    const expectedGroupKeys = expectedGroups.map((group) => group.key);
    const expectedCriterionKeys = expectedCriteria.map(
      (criterion) => criterion.key,
    );

    expect(groupRows).toHaveLength(expectedGroups.length);
    expect(groupRows.map((group) => group.groupKey)).toEqual(expectedGroupKeys);
    expect(groupRows.map((group) => group.sortOrder)).toEqual(
      expectedGroups.map((group) => group.sortOrder),
    );

    for (const group of groupRows) {
      expect(group.categoryId).toBe("search-engine");
      expect(group.labelEn).not.toEqual("");
      expect(group.labelDe).not.toEqual("");
      expect(group.descriptionEn).not.toEqual("");
      expect(group.descriptionDe).not.toEqual("");
    }

    expect(criterionRows).toHaveLength(expectedCriteria.length);
    expect(criterionRows.map((criterion) => criterion.criterionKey)).toEqual(
      expectedCriterionKeys,
    );
    expect(criterionRows.map((criterion) => criterion.sortOrder)).toEqual(
      expectedCriteria.map((criterion) => criterion.sortOrder),
    );

    for (const criterion of criterionRows) {
      const expectedCriterion = expectedCriteria.find(
        (expected) => expected.key === criterion.criterionKey,
      );

      expect(expectedCriterion).toBeDefined();
      expect(criterion.categoryId).toBe("search-engine");
      expect(criterion.groupKey).toBe(expectedCriterion?.groupKey);
      expect(criterion.valueType).toBe(expectedCriterion?.valueType);
      expect(criterion.semantics).toBe(expectedCriterion?.semantics);
      expect(criterion.filterMode).toBe(expectedCriterion?.filterMode);
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
      expect(option.categoryId).toBe("search-engine");
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
    const normalizedFactSql = normalizeSql(factSql);

    expect(factSql).not.toEqual("");
    expect(normalizedFactSql).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?\s*\(\s*`?entry_id`?\s*,\s*`?category_id`?\s*,\s*`?criterion_id`?\s*,\s*`?status`?\s*\)/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bSELECT\s+ce\.id\s*,\s*mc\.category_id\s*,\s*mc\.id\s*,\s*'open'\s+FROM\s+`?catalog_entries`?\s+ce\b/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?entry_categories`?[\s\S]*'search-engine'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'search-engine'\s+WHERE\b/i,
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
