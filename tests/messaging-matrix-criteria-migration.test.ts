import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../scripts/migrations/006-messaging-matrix-criteria.sql",
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

const expectedGroups = [
  {
    key: "identity_contacts",
    labelEn: "Identity & Contacts",
    germanHints: ["identit", "kontakte"],
  },
  {
    key: "platform_access",
    labelEn: "Platform & Access",
    germanHints: ["plattform", "zugriff"],
  },
  {
    key: "security_privacy",
    labelEn: "Security & Privacy",
    germanHints: ["sicherheit", "datenschutz"],
  },
  {
    key: "architecture_control",
    labelEn: "Architecture & Control",
    germanHints: ["architektur", "kontrolle"],
  },
  {
    key: "messaging_usability",
    labelEn: "Messaging UX",
    germanHints: ["nachrichten"],
  },
  {
    key: "groups_communities",
    labelEn: "Groups & Communities",
    germanHints: ["gruppen"],
  },
  {
    key: "calls_media",
    labelEn: "Calls & Media",
    germanHints: ["anrufe", "medien"],
  },
  {
    key: "backup_export",
    labelEn: "Backup, Export & Portability",
    germanHints: ["backup", "export"],
  },
  {
    key: "interoperability_fit",
    labelEn: "Interoperability & Fit",
    germanHints: ["interoperabil", "eignung"],
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
};

const expectedCriteria: CriterionExpectation[] = [
  {
    key: "phone_number_required",
    groupKey: "identity_contacts",
    labelEn: "Phone number required",
    germanHints: ["telefon"],
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
  },
  {
    key: "address_book_upload_required",
    groupKey: "identity_contacts",
    labelEn: "Address book upload required",
    germanHints: ["adress"],
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
  },
  {
    key: "supported_identifiers",
    groupKey: "identity_contacts",
    labelEn: "Supported identifiers",
    germanHints: ["kennung"],
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
  },
  {
    key: "contact_discovery_methods",
    groupKey: "identity_contacts",
    labelEn: "Contact discovery methods",
    germanHints: ["kontakt"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
  },
  {
    key: "multiple_accounts",
    groupKey: "identity_contacts",
    labelEn: "Multiple accounts supported",
    germanHints: ["mehrere", "konten"],
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
  },
  {
    key: "supported_platforms",
    groupKey: "platform_access",
    labelEn: "Supported platforms",
    germanHints: ["plattform"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
  },
  {
    key: "browser_access",
    groupKey: "platform_access",
    labelEn: "Browser access",
    germanHints: ["browser"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "desktop_apps",
    groupKey: "platform_access",
    labelEn: "Desktop apps",
    germanHints: ["desktop"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "multi_device_model",
    groupKey: "platform_access",
    labelEn: "Multi-device model",
    germanHints: ["mehr", "modell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "push_delivery_model",
    groupKey: "platform_access",
    labelEn: "Push delivery model",
    germanHints: ["push"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "e2ee_direct_default",
    groupKey: "security_privacy",
    labelEn: "E2EE for direct chats by default",
    germanHints: ["direkt"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
  },
  {
    key: "e2ee_group_default",
    groupKey: "security_privacy",
    labelEn: "E2EE for groups by default",
    germanHints: ["gruppe"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
  },
  {
    key: "device_verification",
    groupKey: "security_privacy",
    labelEn: "Device or safety-number verification",
    germanHints: ["sicher"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "forward_secrecy_documented",
    groupKey: "security_privacy",
    labelEn: "Forward secrecy documented",
    germanHints: ["forward"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "disappearing_messages",
    groupKey: "security_privacy",
    labelEn: "Disappearing messages",
    germanHints: ["verschwind"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "metadata_protection_level",
    groupKey: "security_privacy",
    labelEn: "Metadata protection level",
    germanHints: ["metadatenschutz"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "screenshot_or_forwarding_controls",
    groupKey: "security_privacy",
    labelEn: "Screenshot/forwarding controls",
    germanHints: ["screenshot", "weiterleitung"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
  },
  {
    key: "network_architecture",
    groupKey: "architecture_control",
    labelEn: "Network architecture",
    germanHints: ["netzwerk"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "self_hosting_available",
    groupKey: "architecture_control",
    labelEn: "Self-hosting available",
    germanHints: ["selbsthosting"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "open_protocol",
    groupKey: "architecture_control",
    labelEn: "Open or documented protocol",
    germanHints: ["protokoll"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "third_party_clients",
    groupKey: "architecture_control",
    labelEn: "Third-party clients allowed",
    germanHints: ["drittanbieter"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "server_side_components",
    groupKey: "architecture_control",
    labelEn: "Server-side components",
    germanHints: ["server"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
  },
  {
    key: "message_editing",
    groupKey: "messaging_usability",
    labelEn: "Message editing",
    germanHints: ["nachrichten"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "message_deletion",
    groupKey: "messaging_usability",
    labelEn: "Message deletion controls",
    germanHints: ["loesch"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
  },
  {
    key: "reactions_threads",
    groupKey: "messaging_usability",
    labelEn: "Reactions and threads",
    germanHints: ["reaktionen", "threads"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
  },
  {
    key: "read_receipt_controls",
    groupKey: "messaging_usability",
    labelEn: "Read-receipt controls",
    germanHints: ["lesebestaetigung"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "scheduled_or_pinned_messages",
    groupKey: "messaging_usability",
    labelEn: "Scheduled or pinned messages",
    germanHints: ["geplante", "angepinnte"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
  },
  {
    key: "group_chat_support",
    groupKey: "groups_communities",
    labelEn: "Group chat support",
    germanHints: ["gruppenchat"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
  },
  {
    key: "max_group_members",
    groupKey: "groups_communities",
    labelEn: "Maximum group size",
    germanHints: ["gruppen"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
  },
  {
    key: "group_admin_tools",
    groupKey: "groups_communities",
    labelEn: "Group admin tools",
    germanHints: ["gruppen"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
  },
  {
    key: "public_rooms_or_channels",
    groupKey: "groups_communities",
    labelEn: "Public rooms or channels",
    germanHints: ["oeffentliche", "kanaele"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "community_discovery",
    groupKey: "groups_communities",
    labelEn: "Community discovery",
    germanHints: ["community"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "voice_calls",
    groupKey: "calls_media",
    labelEn: "Voice calls",
    germanHints: ["sprach"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "video_calls",
    groupKey: "calls_media",
    labelEn: "Video calls",
    germanHints: ["video"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "group_calls",
    groupKey: "calls_media",
    labelEn: "Group calls",
    germanHints: ["gruppenanrufe"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "voice_messages",
    groupKey: "calls_media",
    labelEn: "Voice messages",
    germanHints: ["sprachnachrichten"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "file_sharing",
    groupKey: "calls_media",
    labelEn: "File sharing",
    germanHints: ["datei"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "media_size_limit_mb",
    groupKey: "calls_media",
    labelEn: "Media/file size limit (MB)",
    germanHints: ["dateigroessenlimit"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
  },
  {
    key: "backup_model",
    groupKey: "backup_export",
    labelEn: "Backup model",
    germanHints: ["backup"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "encrypted_backup_available",
    groupKey: "backup_export",
    labelEn: "Encrypted backup available",
    germanHints: ["backup"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "chat_export_available",
    groupKey: "backup_export",
    labelEn: "Chat export available",
    germanHints: ["export"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "account_transfer_model",
    groupKey: "backup_export",
    labelEn: "Account transfer model",
    germanHints: ["kontouebertragung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "external_interoperability",
    groupKey: "interoperability_fit",
    labelEn: "External interoperability",
    germanHints: ["interoperabil"],
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
  },
  {
    key: "bot_integration_support",
    groupKey: "interoperability_fit",
    labelEn: "Bot/integration support",
    germanHints: ["bot", "integration"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
  },
  {
    key: "standards_based_protocol",
    groupKey: "interoperability_fit",
    labelEn: "Standards-based protocol",
    germanHints: ["standard"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
  },
  {
    key: "fit_profiles",
    groupKey: "interoperability_fit",
    labelEn: "Fit profiles",
    germanHints: ["eignung"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
  },
];

const requiredOptionsByCriterion = {
  supported_identifiers: ["phone_number", "username", "random_id"],
  contact_discovery_methods: [
    "address_book_matching",
    "username_search",
    "invite_link",
  ],
  supported_platforms: ["android", "ios", "web", "windows", "macos", "linux"],
  multi_device_model: ["single_device", "linked_devices", "full_sync"],
  push_delivery_model: [
    "platform_push",
    "vendor_push_proxy",
    "self_hostable_push",
  ],
  metadata_protection_level: ["basic", "minimized", "private_routing"],
  screenshot_or_forwarding_controls: [
    "screenshot_warning",
    "screenshot_blocking",
    "forwarding_limits",
  ],
  network_architecture: ["centralized", "federated", "peer_to_peer"],
  server_side_components: [
    "hosted_service",
    "self_hostable_server",
    "relay_server",
  ],
  message_deletion: ["local_only", "sender_recall", "everyone_with_timer"],
  reactions_threads: ["reactions", "replies", "threads"],
  scheduled_or_pinned_messages: [
    "scheduled_send",
    "pinned_messages",
    "bookmarks_saved",
  ],
  group_admin_tools: ["roles_permissions", "member_ban", "join_approval"],
  community_discovery: ["none", "invite_only", "searchable_public"],
  backup_model: ["local_only", "user_encrypted_cloud", "provider_cloud"],
  account_transfer_model: ["unsupported", "device_to_device", "cross_server"],
  external_interoperability: ["same_network_only", "federation", "bridges"],
  fit_profiles: ["friends_family", "privacy_sensitive", "workplace"],
} as const;

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

function insertStatementsFor(tableName: string): string[] {
  const pattern = new RegExp(
    `INSERT\\s+(?:IGNORE\\s+)?INTO\\s+\`?${escapeRegExp(
      tableName,
    )}\`?[\\s\\S]*?;`,
    "gi",
  );

  return [...migrationSql.matchAll(pattern)].map((match) => match[0]);
}

describe("messaging matrix criteria migration", () => {
  it("adds the repository-owned migration for messaging matrix metadata", () => {
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
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?schema_migrations`?[\s\S]*'006-messaging-matrix-criteria'/i,
    );
  });

  it("defines user-readable Messaging criterion groups with English and German labels", () => {
    for (const group of expectedGroups) {
      const window = windowForLiteral(group.key, [group.labelEn]);

      expectSqlLiteral(group.key);
      expectWindowContainsSqlLiterals(window, ["messaging", group.labelEn]);
      expectWindowContainsGermanHints(window, group.germanHints);
    }
  });

  it("defines category-native Messaging criteria with valid metadata and localized labels", () => {
    const seenCriterionKeys = new Set<string>();

    expect(expectedCriteria).toHaveLength(46);

    for (const criterion of expectedCriteria) {
      const window = windowForLiteral(criterion.key, [criterion.labelEn]);

      expect(seenCriterionKeys.has(criterion.key)).toBe(false);
      seenCriterionKeys.add(criterion.key);
      expectSqlLiteral(criterion.key);
      expectWindowContainsSqlLiterals(window, [
        "messaging",
        criterion.groupKey,
        criterion.labelEn,
        criterion.valueType,
        criterion.semantics,
        criterion.filterMode,
      ]);
      expectWindowContainsGermanHints(window, criterion.germanHints);
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
      expect(normalizedMigration).not.toMatch(
        new RegExp(`'${escapeRegExp(semantics)}'\\s*,\\s*'trust_score'`, "i"),
      );
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
  });

  it("provides concrete options for every required enum and multi-enum criterion", () => {
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
        expect(optionsSql).toContain(sqlStringLiteral(optionKey));
      }
    }

    expect(optionsSql).not.toContain(sqlStringLiteral("unknown"));
  });

  it("creates only open placeholder facts and avoids Trust Score or product fact values", () => {
    const factSql = insertStatementsFor("matrix_facts").join("\n");

    expect(factSql).not.toEqual("");
    expect(normalizeSql(factSql)).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?\s*\(\s*`?entry_id`?\s*,\s*`?category_id`?\s*,\s*`?criterion_id`?\s*,\s*`?status`?\s*\)/i,
    );
    expect(normalizeSql(factSql)).toMatch(/\bSELECT\b[\s\S]*'open'/i);
    expect(normalizeSql(factSql)).toMatch(
      /\bJOIN\s+`?entry_categories`?[\s\S]*'messaging'/i,
    );
    expect(normalizeSql(factSql)).toMatch(
      /\bJOIN\s+`?matrix_criteria`?[\s\S]*'messaging'/i,
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
