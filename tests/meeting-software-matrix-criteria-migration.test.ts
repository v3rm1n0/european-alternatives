import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "meeting-software";
const migrationVersion = "012-meeting-software-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/012-meeting-software-matrix-criteria.sql",
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
  { key: "joining_access", labelEn: "Joining & Access", sortOrder: 100 },
  {
    key: "platforms_devices",
    labelEn: "Platforms & Devices",
    sortOrder: 200,
  },
  { key: "capacity_formats", labelEn: "Capacity & Formats", sortOrder: 300 },
  {
    key: "collaboration_tools",
    labelEn: "Collaboration Tools",
    sortOrder: 400,
  },
  {
    key: "security_controls",
    labelEn: "Security & Host Controls",
    sortOrder: 500,
  },
  { key: "recording_data", labelEn: "Recording, Data & AI", sortOrder: 600 },
  {
    key: "admin_integrations",
    labelEn: "Admin & Integrations",
    sortOrder: 700,
  },
  {
    key: "deployment_interop",
    labelEn: "Deployment & Interop",
    sortOrder: 800,
  },
  {
    key: "accessibility_fit",
    labelEn: "Accessibility & Fit",
    sortOrder: 900,
  },
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
    key: "account_required_to_host",
    groupKey: "joining_access",
    labelEn: "Account required to host",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "guest_join_without_account",
    groupKey: "joining_access",
    labelEn: "Guest join without account",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 1020,
  },
  {
    key: "browser_join_supported",
    groupKey: "joining_access",
    labelEn: "Browser join supported",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1030,
  },
  {
    key: "invitation_join_methods",
    groupKey: "joining_access",
    labelEn: "Invitation and join methods",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1040,
  },
  {
    key: "waiting_room_or_lobby",
    groupKey: "joining_access",
    labelEn: "Waiting room or lobby",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "supported_platforms",
    groupKey: "platforms_devices",
    labelEn: "Supported platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2010,
  },
  {
    key: "desktop_apps",
    groupKey: "platforms_devices",
    labelEn: "Desktop apps",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2020,
  },
  {
    key: "mobile_apps",
    groupKey: "platforms_devices",
    labelEn: "Mobile apps",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2030,
  },
  {
    key: "room_system_support",
    groupKey: "platforms_devices",
    labelEn: "Room system support",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "pstn_dial_in",
    groupKey: "platforms_devices",
    labelEn: "PSTN dial-in",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 2050,
  },
  {
    key: "low_bandwidth_mode",
    groupKey: "platforms_devices",
    labelEn: "Low-bandwidth mode",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2060,
  },
  {
    key: "max_participants",
    groupKey: "capacity_formats",
    labelEn: "Maximum participants",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 3010,
  },
  {
    key: "meeting_duration_limit_minutes",
    groupKey: "capacity_formats",
    labelEn: "Meeting duration limit (minutes)",
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 3020,
  },
  {
    key: "recurring_meetings",
    groupKey: "capacity_formats",
    labelEn: "Recurring meetings",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "breakout_rooms",
    groupKey: "capacity_formats",
    labelEn: "Breakout rooms",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "webinar_or_town_hall_mode",
    groupKey: "capacity_formats",
    labelEn: "Webinar or town hall mode",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "registration_rsvp_support",
    groupKey: "capacity_formats",
    labelEn: "Registration or RSVP support",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3060,
  },
  {
    key: "scheduling_calendar_support",
    groupKey: "capacity_formats",
    labelEn: "Scheduling and calendar support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3070,
  },
  {
    key: "screen_sharing",
    groupKey: "collaboration_tools",
    labelEn: "Screen sharing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "remote_control",
    groupKey: "collaboration_tools",
    labelEn: "Remote control",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "whiteboard_or_canvas",
    groupKey: "collaboration_tools",
    labelEn: "Whiteboard or canvas",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "shared_notes_docs",
    groupKey: "collaboration_tools",
    labelEn: "Shared notes or documents",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4040,
  },
  {
    key: "in_meeting_chat",
    groupKey: "collaboration_tools",
    labelEn: "In-meeting chat",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "reactions_polls_qna",
    groupKey: "collaboration_tools",
    labelEn: "Reactions, polls, and Q&A",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4060,
  },
  {
    key: "file_sharing",
    groupKey: "collaboration_tools",
    labelEn: "File sharing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4070,
  },
  {
    key: "meeting_passcodes",
    groupKey: "security_controls",
    labelEn: "Meeting passcodes",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "e2ee_available",
    groupKey: "security_controls",
    labelEn: "E2EE availability",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5020,
  },
  {
    key: "host_moderation_controls",
    groupKey: "security_controls",
    labelEn: "Host moderation controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5030,
  },
  {
    key: "participant_permissions",
    groupKey: "security_controls",
    labelEn: "Participant permissions",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5040,
  },
  {
    key: "authenticated_participant_controls",
    groupKey: "security_controls",
    labelEn: "Authenticated participant controls",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5050,
  },
  {
    key: "abuse_reporting_controls",
    groupKey: "security_controls",
    labelEn: "Abuse reporting controls",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5060,
  },
  {
    key: "recording_available",
    groupKey: "recording_data",
    labelEn: "Recording availability",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "recording_consent_notice",
    groupKey: "recording_data",
    labelEn: "Recording consent notice",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "transcript_and_artifact_exports",
    groupKey: "recording_data",
    labelEn: "Transcript and artifact exports",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6030,
  },
  {
    key: "retention_controls",
    groupKey: "recording_data",
    labelEn: "Retention controls",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "data_residency_options",
    groupKey: "recording_data",
    labelEn: "Data residency options",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6050,
  },
  {
    key: "ai_meeting_features",
    groupKey: "recording_data",
    labelEn: "AI meeting features",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 6060,
  },
  {
    key: "admin_console",
    groupKey: "admin_integrations",
    labelEn: "Admin console",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "sso_support",
    groupKey: "admin_integrations",
    labelEn: "SSO support",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "user_provisioning",
    groupKey: "admin_integrations",
    labelEn: "User provisioning",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7030,
  },
  {
    key: "audit_logs",
    groupKey: "admin_integrations",
    labelEn: "Audit logs",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "calendar_integrations",
    groupKey: "admin_integrations",
    labelEn: "Calendar integrations",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7050,
  },
  {
    key: "app_marketplace_api",
    groupKey: "admin_integrations",
    labelEn: "Apps, APIs, and automation",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 7060,
  },
  {
    key: "lms_crm_integrations",
    groupKey: "admin_integrations",
    labelEn: "LMS/CRM integrations",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7070,
  },
  {
    key: "deployment_model",
    groupKey: "deployment_interop",
    labelEn: "Deployment model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "self_hosting_available",
    groupKey: "deployment_interop",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "protocol_interoperability",
    groupKey: "deployment_interop",
    labelEn: "Protocol interoperability",
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "federation_or_multi_server",
    groupKey: "deployment_interop",
    labelEn: "Federation or multi-server model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 8040,
  },
  {
    key: "deployment_requirements",
    groupKey: "deployment_interop",
    labelEn: "Deployment requirements",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8050,
  },
  {
    key: "accessibility_features",
    groupKey: "accessibility_fit",
    labelEn: "Accessibility features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 9010,
  },
  {
    key: "live_captions",
    groupKey: "accessibility_fit",
    labelEn: "Live captions",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "language_interpretation_translation",
    groupKey: "accessibility_fit",
    labelEn: "Interpretation and translation",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9030,
  },
  {
    key: "fit_profiles",
    groupKey: "accessibility_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9040,
  },
];

const requiredOptionsByCriterion = {
  invitation_join_methods: [
    "meeting_link",
    "meeting_id_passcode",
    "calendar_invite",
    "email_invite",
    "qr_code",
    "phone_invite",
  ],
  supported_platforms: [
    "web",
    "windows",
    "macos",
    "linux",
    "android",
    "ios",
    "room_devices",
  ],
  room_system_support: [
    "none",
    "sip_h323_gateway",
    "dedicated_room_devices",
    "vendor_room_system",
  ],
  webinar_or_town_hall_mode: ["none", "webinar", "town_hall", "live_streaming"],
  scheduling_calendar_support: [
    "built_in_scheduler",
    "ical",
    "caldav",
    "google_calendar",
    "microsoft_365",
    "nextcloud",
  ],
  shared_notes_docs: [
    "shared_notes",
    "collaborative_docs",
    "agendas",
    "action_items",
  ],
  reactions_polls_qna: [
    "reactions",
    "hand_raise",
    "polls",
    "qna",
    "emoji_feedback",
  ],
  e2ee_available: [
    "none",
    "direct_calls_only",
    "optional_meetings",
    "default_meetings",
    "limited_modes",
  ],
  host_moderation_controls: [
    "mute_participants",
    "remove_participants",
    "lock_meeting",
    "assign_cohosts",
    "spotlight_pin",
    "disable_video",
  ],
  participant_permissions: [
    "screen_share_control",
    "chat_control",
    "mic_camera_control",
    "file_share_control",
    "recording_permission",
    "name_change_control",
  ],
  recording_available: [
    "none",
    "local_recording",
    "cloud_recording",
    "local_and_cloud",
  ],
  transcript_and_artifact_exports: [
    "transcript_export",
    "captions_saved",
    "chat_export",
    "attendance_report",
    "ai_summary_export",
    "whiteboard_export",
  ],
  retention_controls: [
    "none",
    "fixed_provider_retention",
    "user_configurable",
    "admin_configurable",
  ],
  data_residency_options: [
    "none_documented",
    "regional_selection",
    "eu_region",
    "self_hosted_control",
    "enterprise_only",
  ],
  ai_meeting_features: [
    "ai_summary",
    "meeting_assistant",
    "action_items",
    "real_time_translation",
    "sentiment_or_insights",
  ],
  sso_support: ["none", "saml", "oidc", "oauth_workspace", "enterprise_only"],
  user_provisioning: [
    "scim",
    "directory_sync",
    "just_in_time",
    "group_sync",
    "domain_claim",
  ],
  calendar_integrations: [
    "ical",
    "caldav",
    "nextcloud",
    "google_calendar",
    "microsoft_365",
  ],
  app_marketplace_api: [
    "public_api",
    "webhooks",
    "bots_apps",
    "sdk",
    "marketplace",
    "automation_connectors",
  ],
  lms_crm_integrations: [
    "lti",
    "moodle",
    "canvas",
    "blackboard",
    "salesforce",
    "generic_crm",
  ],
  deployment_model: [
    "hosted_saas",
    "self_hosted",
    "hybrid",
    "appliance",
    "peer_to_peer",
  ],
  protocol_interoperability: [
    "webrtc",
    "sip",
    "h323",
    "rtmp",
    "xmpp",
    "calendar_standards",
  ],
  federation_or_multi_server: [
    "centralized",
    "single_self_hosted_instance",
    "federated",
    "peer_to_peer",
    "hybrid",
  ],
  deployment_requirements: [
    "stun_turn",
    "reverse_proxy",
    "database",
    "object_storage",
    "recording_bridge",
    "kubernetes",
    "ldap_smtp",
  ],
  accessibility_features: [
    "keyboard_navigation",
    "screen_reader_support",
    "captions",
    "high_contrast",
    "reduced_motion",
  ],
  language_interpretation_translation: [
    "simultaneous_interpretation",
    "translated_captions",
    "live_translation",
    "multilingual_ui",
    "rtl_support",
  ],
  fit_profiles: [
    "small_team_meetings",
    "public_webinars",
    "classrooms_training",
    "self_hosted_orgs",
    "privacy_sensitive",
    "large_enterprise",
    "low_bandwidth_regions",
    "healthcare_consulting",
  ],
} as const satisfies Record<string, readonly string[]>;

const forbiddenGenericCriterionKeys = [
  "headquarters_country",
  "company_country",
  "open_source",
  "source_available",
  "privacy_policy",
  "terms_of_service",
  "trust_score",
  "positive_signals",
  "reservations",
  "gdpr_compliance",
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

describe("meeting software matrix criteria migration", () => {
  it("adds the repository-owned migration for Meeting Software matrix metadata", () => {
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

  it("defines user-readable Meeting Software criterion groups with localized labels", () => {
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

  it("defines category-native Meeting Software criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'meeting-software'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'meeting-software'\s+WHERE\b/i,
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
