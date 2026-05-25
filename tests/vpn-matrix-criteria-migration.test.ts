import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "vpn";
const migrationVersion = "019-vpn-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/019-vpn-matrix-criteria.sql",
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
    key: "network_infrastructure",
    labelEn: "Network & Infrastructure",
    sortOrder: 100,
  },
  {
    key: "encryption_protocols",
    labelEn: "Encryption & Protocols",
    sortOrder: 200,
  },
  {
    key: "privacy_logging",
    labelEn: "Privacy & Logging Policy",
    sortOrder: 300,
  },
  {
    key: "leak_protection",
    labelEn: "Leak Protection & Kill Switch",
    sortOrder: 400,
  },
  {
    key: "platform_apps",
    labelEn: "Platform & Apps",
    sortOrder: 500,
  },
  {
    key: "streaming_performance",
    labelEn: "Streaming & Performance",
    sortOrder: 600,
  },
  {
    key: "advanced_features",
    labelEn: "Advanced Features",
    sortOrder: 700,
  },
  {
    key: "account_payment",
    labelEn: "Account & Payment",
    sortOrder: 800,
  },
  {
    key: "openness_governance_fit",
    labelEn: "Openness, Governance & Fit",
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
  // Group 1: Network & Infrastructure (100)
  {
    key: "server_country_count",
    groupKey: "network_infrastructure",
    labelEn: "Server country count",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 1010,
  },
  {
    key: "server_count_range",
    groupKey: "network_infrastructure",
    labelEn: "Server count range",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1020,
  },
  {
    key: "owns_physical_servers",
    groupKey: "network_infrastructure",
    labelEn: "Owns physical servers",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "ram_only_servers",
    groupKey: "network_infrastructure",
    labelEn: "RAM-only (diskless) servers",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "network_type",
    groupKey: "network_infrastructure",
    labelEn: "Network type",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1050,
  },
  // Group 2: Encryption & Protocols (200)
  {
    key: "supported_vpn_protocols",
    groupKey: "encryption_protocols",
    labelEn: "Supported VPN protocols",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2010,
  },
  {
    key: "default_vpn_protocol",
    groupKey: "encryption_protocols",
    labelEn: "Default VPN protocol",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "cipher_strength",
    groupKey: "encryption_protocols",
    labelEn: "Cipher strength",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2030,
  },
  {
    key: "perfect_forward_secrecy",
    groupKey: "encryption_protocols",
    labelEn: "Perfect forward secrecy",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "post_quantum_readiness",
    groupKey: "encryption_protocols",
    labelEn: "Post-quantum readiness",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2050,
  },
  // Group 3: Privacy & Logging Policy (300)
  {
    key: "logging_policy",
    groupKey: "privacy_logging",
    labelEn: "Logging policy",
    valueType: "enum",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 3010,
  },
  {
    key: "independent_audit_status",
    groupKey: "privacy_logging",
    labelEn: "Independent audit status",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "jurisdiction",
    groupKey: "privacy_logging",
    labelEn: "Legal jurisdiction",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "warrant_canary",
    groupKey: "privacy_logging",
    labelEn: "Warrant canary",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "transparency_report",
    groupKey: "privacy_logging",
    labelEn: "Transparency report",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3050,
  },
  // Group 4: Leak Protection & Kill Switch (400)
  {
    key: "kill_switch",
    groupKey: "leak_protection",
    labelEn: "Kill switch",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "dns_leak_protection",
    groupKey: "leak_protection",
    labelEn: "DNS leak protection",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "ipv6_leak_protection",
    groupKey: "leak_protection",
    labelEn: "IPv6 leak protection",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "webrtc_leak_prevention",
    groupKey: "leak_protection",
    labelEn: "WebRTC leak prevention",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 4040,
  },
  {
    key: "custom_dns_support",
    groupKey: "leak_protection",
    labelEn: "Custom DNS support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4050,
  },
  // Group 5: Platform & Apps (500)
  {
    key: "supported_platforms",
    groupKey: "platform_apps",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5010,
  },
  {
    key: "browser_extension_available",
    groupKey: "platform_apps",
    labelEn: "Browser extension available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "simultaneous_connections",
    groupKey: "platform_apps",
    labelEn: "Simultaneous connections",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "router_firmware_support",
    groupKey: "platform_apps",
    labelEn: "Router firmware support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5040,
  },
  {
    key: "linux_gui_available",
    groupKey: "platform_apps",
    labelEn: "Linux GUI available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5050,
  },
  // Group 6: Streaming & Performance (600)
  {
    key: "bandwidth_limit",
    groupKey: "streaming_performance",
    labelEn: "Bandwidth limit",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "data_cap",
    groupKey: "streaming_performance",
    labelEn: "Monthly data cap",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "streaming_unblock_capability",
    groupKey: "streaming_performance",
    labelEn: "Streaming unblock capability",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "p2p_torrenting_allowed",
    groupKey: "streaming_performance",
    labelEn: "P2P/torrenting allowed",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6040,
  },
  // Group 7: Advanced Features (700)
  {
    key: "split_tunneling",
    groupKey: "advanced_features",
    labelEn: "Split tunneling",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "multi_hop",
    groupKey: "advanced_features",
    labelEn: "Multi-hop (double VPN)",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "tor_over_vpn",
    groupKey: "advanced_features",
    labelEn: "Tor-over-VPN",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "port_forwarding",
    groupKey: "advanced_features",
    labelEn: "Port forwarding",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "ad_tracker_blocker",
    groupKey: "advanced_features",
    labelEn: "Built-in ad/tracker blocker",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7050,
  },
  {
    key: "dedicated_ip_available",
    groupKey: "advanced_features",
    labelEn: "Dedicated IP available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7060,
  },
  // Group 8: Account & Payment (800)
  {
    key: "anonymous_signup",
    groupKey: "account_payment",
    labelEn: "Anonymous signup",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "cryptocurrency_payment",
    groupKey: "account_payment",
    labelEn: "Cryptocurrency payment",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "free_tier_available",
    groupKey: "account_payment",
    labelEn: "Free tier available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8030,
  },
  {
    key: "money_back_guarantee_days",
    groupKey: "account_payment",
    labelEn: "Money-back guarantee (days)",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 8040,
  },
  // Group 9: Openness, Governance & Fit (900)
  {
    key: "client_source_model",
    groupKey: "openness_governance_fit",
    labelEn: "Client source model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9010,
  },
  {
    key: "server_source_model",
    groupKey: "openness_governance_fit",
    labelEn: "Server source model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "governance_model",
    groupKey: "openness_governance_fit",
    labelEn: "Governance model",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "bug_bounty_program",
    groupKey: "openness_governance_fit",
    labelEn: "Bug bounty program",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 9040,
  },
  {
    key: "fit_profiles",
    groupKey: "openness_governance_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9050,
  },
];

const requiredOptionsByCriterion = {
  server_count_range: [
    "under_500",
    "500_to_1000",
    "1000_to_3000",
    "3000_to_5000",
    "over_5000",
  ],
  owns_physical_servers: [
    "all_owned",
    "mostly_owned",
    "mixed",
    "mostly_rented",
    "all_rented",
  ],
  network_type: ["shared", "dedicated", "hybrid"],
  supported_vpn_protocols: [
    "wireguard",
    "openvpn",
    "ikev2_ipsec",
    "proprietary",
    "sstp",
    "l2tp_ipsec",
    "pptp",
  ],
  default_vpn_protocol: [
    "wireguard",
    "openvpn",
    "ikev2_ipsec",
    "proprietary",
    "other",
  ],
  cipher_strength: [
    "aes_256_gcm",
    "chacha20_poly1305",
    "aes_128",
    "proprietary_cipher",
  ],
  post_quantum_readiness: [
    "production_ready",
    "experimental",
    "announced",
    "none",
  ],
  logging_policy: [
    "strict_no_logs",
    "no_activity_logs",
    "minimal_connection_logs",
    "session_logs",
    "full_logs",
  ],
  independent_audit_status: [
    "multiple_audits",
    "single_audit",
    "audit_planned",
    "no_audit",
  ],
  jurisdiction: [
    "non_eyes_eu",
    "non_eyes_non_eu",
    "five_eyes",
    "nine_eyes",
    "fourteen_eyes",
  ],
  kill_switch: ["always_on", "app_level", "not_available"],
  ipv6_leak_protection: ["full_blocking", "tunnel_ipv6", "not_available"],
  webrtc_leak_prevention: [
    "built_in_app",
    "browser_extension_only",
    "not_available",
  ],
  supported_platforms: [
    "windows",
    "macos",
    "linux",
    "android",
    "ios",
    "router",
  ],
  simultaneous_connections: ["one", "up_to_5", "up_to_10", "unlimited"],
  router_firmware_support: [
    "openwrt",
    "ddwrt",
    "pfsense",
    "native_firmware",
    "manual_config",
  ],
  bandwidth_limit: ["unlimited", "throttled_free", "capped"],
  data_cap: ["unlimited", "over_10gb", "1gb_to_10gb", "under_1gb"],
  streaming_unblock_capability: ["reliable", "partial", "limited", "none"],
  p2p_torrenting_allowed: [
    "all_servers",
    "dedicated_servers",
    "restricted",
    "not_allowed",
  ],
  split_tunneling: ["app_level", "url_level", "both", "not_available"],
  anonymous_signup: [
    "no_identity_required",
    "email_only",
    "email_and_name",
    "full_identity",
  ],
  client_source_model: [
    "open_source",
    "source_available",
    "partial_open",
    "proprietary",
  ],
  server_source_model: [
    "open_source",
    "source_available",
    "partial_open",
    "proprietary",
  ],
  governance_model: [
    "community_driven",
    "foundation_backed",
    "corporate_independent",
    "corporate_conglomerate",
  ],
  fit_profiles: [
    "privacy_focused",
    "streaming",
    "torrenting",
    "business",
    "travel",
    "gaming",
    "censorship_circumvention",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  supported_vpn_protocols: {
    wireguard: "positive",
    openvpn: "positive",
    pptp: "warning",
    l2tp_ipsec: "tradeoff",
    proprietary: "tradeoff",
  },
  cipher_strength: {
    aes_256_gcm: "positive",
    chacha20_poly1305: "positive",
    aes_128: "tradeoff",
    proprietary_cipher: "warning",
  },
  logging_policy: {
    strict_no_logs: "positive",
    no_activity_logs: "positive",
    minimal_connection_logs: "tradeoff",
    session_logs: "warning",
    full_logs: "negative",
  },
  jurisdiction: {
    non_eyes_eu: "positive",
    five_eyes: "warning",
    nine_eyes: "warning",
    fourteen_eyes: "tradeoff",
  },
  kill_switch: {
    always_on: "positive",
    not_available: "warning",
  },
  client_source_model: {
    open_source: "positive",
    proprietary: "warning",
  },
  server_source_model: {
    open_source: "positive",
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

describe("vpn matrix criteria migration", () => {
  it("adds the repository-owned migration for VPN matrix metadata", () => {
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

  it("defines ordered VPN criterion groups with localized labels", () => {
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

  it("defines category-native VPN criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'vpn'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'vpn'\s+WHERE\b/i,
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

    expect(expectedTotal).toBe(113);
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

  it("records the exact migration version in schema_migrations", () => {
    const versionPattern = new RegExp(
      `INSERT\\s+INTO\\s+\`?schema_migrations\`?\\s*\\(\\s*\`?version\`?\\s*\\)\\s*VALUES\\s*\\(\\s*'${escapeRegExp(migrationVersion)}'\\s*\\)`,
      "i",
    );

    expect(migrationSql).toMatch(versionPattern);
  });
});
