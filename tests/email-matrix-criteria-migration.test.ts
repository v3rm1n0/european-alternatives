import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../scripts/migrations/008-email-matrix-criteria.sql",
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
    key: "service_plans",
    labelEn: "Service & Plans",
    germanHints: ["dienst", "tarife"],
    sortOrder: 100,
  },
  {
    key: "access_protocols",
    labelEn: "Access & Protocols",
    germanHints: ["zugriff", "protokolle"],
    sortOrder: 200,
  },
  {
    key: "domains_identity",
    labelEn: "Domains & Identity",
    germanHints: ["domains", "identitaet"],
    sortOrder: 300,
  },
  {
    key: "account_security",
    labelEn: "Account Security",
    germanHints: ["kontosicherheit"],
    sortOrder: 400,
  },
  {
    key: "encryption_privacy",
    labelEn: "Encryption & Privacy",
    germanHints: ["verschluesselung", "datenschutz"],
    sortOrder: 500,
  },
  {
    key: "data_location_compliance",
    labelEn: "Data Location & Compliance",
    germanHints: ["datenstandort", "compliance"],
    sortOrder: 600,
  },
  {
    key: "migration_portability",
    labelEn: "Migration & Portability",
    germanHints: ["migration", "portabilitaet"],
    sortOrder: 700,
  },
  {
    key: "suite_productivity",
    labelEn: "Suite & Productivity",
    germanHints: ["suite", "produktivitaet"],
    sortOrder: 800,
  },
  {
    key: "team_admin",
    labelEn: "Team Admin",
    germanHints: ["team-administration"],
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
    key: "service_model",
    groupKey: "service_plans",
    labelEn: "Service model",
    germanHints: ["dienstmodell"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "free_tier_mailbox_storage_gb",
    groupKey: "service_plans",
    labelEn: "Free-tier mailbox storage (GB)",
    germanHints: ["gratis", "postfachspeicher"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 1020,
  },
  {
    key: "personal_mailbox_storage_gb",
    groupKey: "service_plans",
    labelEn: "Personal mailbox storage (GB)",
    germanHints: ["privattarif", "postfachspeicher"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 1030,
  },
  {
    key: "max_attachment_size_mb",
    groupKey: "service_plans",
    labelEn: "Maximum attachment size (MB)",
    germanHints: ["maximale", "anhanggroesse"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 1040,
  },
  {
    key: "pricing_model",
    groupKey: "service_plans",
    labelEn: "Pricing model",
    germanHints: ["preismodell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 1050,
  },
  {
    key: "webmail_available",
    groupKey: "access_protocols",
    labelEn: "Webmail available",
    germanHints: ["webmail", "verfuegbar"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2010,
  },
  {
    key: "supported_apps",
    groupKey: "access_protocols",
    labelEn: "Supported apps",
    germanHints: ["unterstuetzte", "apps"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2020,
  },
  {
    key: "standard_mail_protocols",
    groupKey: "access_protocols",
    labelEn: "Standard mail protocols",
    germanHints: ["standard-mailprotokolle"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2030,
  },
  {
    key: "bridge_required_for_standard_clients",
    groupKey: "access_protocols",
    labelEn: "Bridge required for standard clients",
    germanHints: ["bridge", "standard-clients"],
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 2040,
  },
  {
    key: "server_side_filters",
    groupKey: "access_protocols",
    labelEn: "Server-side filters and rules",
    germanHints: ["serverseitige", "filter"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2050,
  },
  {
    key: "search_scope",
    groupKey: "access_protocols",
    labelEn: "Mail search scope",
    germanHints: ["mail-suche"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 2060,
  },
  {
    key: "custom_domains",
    groupKey: "domains_identity",
    labelEn: "Custom domains",
    germanHints: ["eigene", "domains"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 3010,
  },
  {
    key: "alias_support_model",
    groupKey: "domains_identity",
    labelEn: "Alias support model",
    germanHints: ["alias", "modell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "alias_limit",
    groupKey: "domains_identity",
    labelEn: "Alias limit",
    germanHints: ["alias-limit"],
    valueType: "number",
    semantics: "informational",
    filterMode: "range",
    sortOrder: 3030,
  },
  {
    key: "catch_all_address",
    groupKey: "domains_identity",
    labelEn: "Catch-all address",
    germanHints: ["catch-all-adresse"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3040,
  },
  {
    key: "disposable_masked_aliases",
    groupKey: "domains_identity",
    labelEn: "Disposable or masked aliases",
    germanHints: ["wegwerf", "maskierungsaliasse"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "domain_authentication_controls",
    groupKey: "domains_identity",
    labelEn: "Domain authentication controls",
    germanHints: ["domain-authentifizierung"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3060,
  },
  {
    key: "two_factor_auth",
    groupKey: "account_security",
    labelEn: "Two-factor authentication",
    germanHints: ["zwei-faktor"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4010,
  },
  {
    key: "hardware_security_key",
    groupKey: "account_security",
    labelEn: "Hardware security key support",
    germanHints: ["hardware-sicherheitsschluessel"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "account_recovery_model",
    groupKey: "account_security",
    labelEn: "Account recovery model",
    germanHints: ["kontowiederherstellung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "anti_abuse_protection",
    groupKey: "account_security",
    labelEn: "Spam, phishing, and malware controls",
    germanHints: ["spam", "phishing", "malware"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4040,
  },
  {
    key: "mailbox_encryption_model",
    groupKey: "encryption_privacy",
    labelEn: "Mailbox encryption model",
    germanHints: ["postfach", "verschluesselungsmodell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 5010,
  },
  {
    key: "e2ee_internal_default",
    groupKey: "encryption_privacy",
    labelEn: "E2EE within provider by default",
    germanHints: ["e2ee", "standardmaessig"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 5020,
  },
  {
    key: "encrypted_external_email",
    groupKey: "encryption_privacy",
    labelEn: "Encrypted external email",
    germanHints: ["verschluesselte", "externe"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5030,
  },
  {
    key: "openpgp_support",
    groupKey: "encryption_privacy",
    labelEn: "OpenPGP support",
    germanHints: ["openpgp", "unterstuetzung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "tracker_remote_content_protection",
    groupKey: "encryption_privacy",
    labelEn: "Tracker and remote-content protection",
    germanHints: ["tracker", "remote-inhalte"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5050,
  },
  {
    key: "metadata_protection_level",
    groupKey: "encryption_privacy",
    labelEn: "Metadata protection level",
    germanHints: ["metadatenschutz"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5060,
  },
  {
    key: "data_region_model",
    groupKey: "data_location_compliance",
    labelEn: "Mailbox data region model",
    germanHints: ["datenregion", "postfaecher"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 6010,
  },
  {
    key: "eu_mailbox_storage_available",
    groupKey: "data_location_compliance",
    labelEn: "EU mailbox storage available",
    germanHints: ["eu-postfachspeicherung", "verfuegbar"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 6020,
  },
  {
    key: "hosting_infrastructure_model",
    groupKey: "data_location_compliance",
    labelEn: "Hosting infrastructure model",
    germanHints: ["hosting-infrastrukturmodell"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "data_processing_agreement",
    groupKey: "data_location_compliance",
    labelEn: "Data processing agreement available",
    germanHints: ["av-vertrag", "verfuegbar"],
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "compliance_profiles",
    groupKey: "data_location_compliance",
    labelEn: "Compliance profiles",
    germanHints: ["compliance-profile"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 6050,
  },
  {
    key: "migration_import_sources",
    groupKey: "migration_portability",
    labelEn: "Migration import sources",
    germanHints: ["migrationsimport"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7010,
  },
  {
    key: "mailbox_export_available",
    groupKey: "migration_portability",
    labelEn: "Mailbox export available",
    germanHints: ["postfach-export", "verfuegbar"],
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "contacts_calendar_export",
    groupKey: "migration_portability",
    labelEn: "Contacts and calendar export",
    germanHints: ["kontakte", "kalenderexport"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7030,
  },
  {
    key: "mail_forwarding",
    groupKey: "migration_portability",
    labelEn: "Mail forwarding",
    germanHints: ["mail-weiterleitung"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "external_account_collection",
    groupKey: "migration_portability",
    labelEn: "External account collection",
    germanHints: ["externer", "konten"],
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 7050,
  },
  {
    key: "calendar_included",
    groupKey: "suite_productivity",
    labelEn: "Calendar included",
    germanHints: ["kalender", "enthalten"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "contacts_included",
    groupKey: "suite_productivity",
    labelEn: "Contacts included",
    germanHints: ["kontakte", "enthalten"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "productivity_suite_scope",
    groupKey: "suite_productivity",
    labelEn: "Productivity suite scope",
    germanHints: ["produktivitaets-suite"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "collaboration_features",
    groupKey: "suite_productivity",
    labelEn: "Collaboration features",
    germanHints: ["zusammenarbeit"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8040,
  },
  {
    key: "admin_console",
    groupKey: "team_admin",
    labelEn: "Admin console",
    germanHints: ["administrationskonsole"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 9010,
  },
  {
    key: "user_management_model",
    groupKey: "team_admin",
    labelEn: "User management model",
    germanHints: ["nutzerverwaltung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "sso_available",
    groupKey: "team_admin",
    labelEn: "SSO available",
    germanHints: ["sso", "verfuegbar"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "audit_logs",
    groupKey: "team_admin",
    labelEn: "Audit logs",
    germanHints: ["audit-protokolle"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 9040,
  },
  {
    key: "retention_ediscovery",
    groupKey: "team_admin",
    labelEn: "Retention and eDiscovery",
    germanHints: ["aufbewahrung", "ediscovery"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9050,
  },
];

const requiredOptionsByCriterion = {
  service_model: [
    "hosted_mailbox",
    "encrypted_mailbox",
    "business_email_suite",
    "domain_mail_hosting",
    "self_hostable_mail_stack",
    "transactional_delivery",
  ],
  pricing_model: [
    "free_paid_plans",
    "per_user",
    "per_domain",
    "usage_based",
    "self_hosted_infrastructure",
  ],
  supported_apps: [
    "web",
    "android",
    "ios",
    "windows",
    "macos",
    "linux",
    "f_droid",
  ],
  standard_mail_protocols: [
    "imap",
    "smtp_submission",
    "pop3",
    "jmap",
    "exchange_activesync",
  ],
  server_side_filters: [
    "folders",
    "labels",
    "rules_ui",
    "sieve",
    "vacation_responder",
    "templates",
  ],
  search_scope: [
    "basic_headers",
    "full_text_server",
    "encrypted_index",
    "local_client_only",
    "no_documented_search",
  ],
  alias_support_model: [
    "none",
    "limited_aliases",
    "unlimited_aliases",
    "domain_aliases",
    "plus_addressing_only",
  ],
  disposable_masked_aliases: [
    "none",
    "limited_builtin",
    "unlimited_builtin",
    "integrated_alias_service",
    "external_alias_integration",
  ],
  domain_authentication_controls: [
    "spf",
    "dkim",
    "dmarc",
    "mta_sts",
    "tls_rpt",
    "bimi",
  ],
  account_recovery_model: [
    "provider_reset",
    "recovery_email_phone",
    "recovery_key",
    "admin_recovery",
    "no_provider_recovery",
  ],
  anti_abuse_protection: [
    "spam_filtering",
    "phishing_detection",
    "malware_scanning",
    "attachment_scanning",
    "link_scanning",
    "allow_block_lists",
    "quarantine",
  ],
  mailbox_encryption_model: [
    "server_side_encryption",
    "zero_access_at_rest",
    "end_to_end_internal",
    "client_side_user_keys",
    "external_client_encryption_required",
  ],
  encrypted_external_email: [
    "none",
    "password_protected_portal",
    "pgp",
    "secure_link_expiry",
    "manual_key_exchange",
  ],
  openpgp_support: [
    "none",
    "external_client_only",
    "built_in_key_management",
    "key_import_export",
    "autocrypt",
  ],
  tracker_remote_content_protection: [
    "remote_content_blocking",
    "tracking_pixel_blocking",
    "image_proxy",
    "link_tracking_warnings",
  ],
  metadata_protection_level: [
    "standard_email_metadata",
    "reduced_logging",
    "encrypted_subject",
    "private_routing_proxy",
    "self_hosted_metadata_control",
  ],
  data_region_model: [
    "eu_only",
    "country_specific",
    "user_selectable_region",
    "provider_selected_region",
    "global_or_mixed",
    "self_hosted_customer_controlled",
  ],
  hosting_infrastructure_model: [
    "own_datacenters",
    "eu_cloud_provider",
    "hyperscaler",
    "customer_controlled",
    "mixed",
  ],
  compliance_profiles: ["gdpr_dpa", "iso_27001", "soc2", "bsi_c5", "hipaa"],
  migration_import_sources: [
    "imap",
    "gmail",
    "outlook",
    "yahoo",
    "csv_contacts",
    "calendar_ics",
    "provider_assisted",
  ],
  mailbox_export_available: [
    "none",
    "imap_download",
    "eml_export",
    "mbox_export",
    "full_account_export",
    "admin_export",
  ],
  contacts_calendar_export: [
    "csv_contacts",
    "vcard",
    "ics_calendar",
    "caldav_carddav_sync",
  ],
  productivity_suite_scope: [
    "mail_only",
    "calendar",
    "contacts",
    "drive_storage",
    "office_docs",
    "notes_tasks",
    "video_meetings",
  ],
  collaboration_features: [
    "shared_calendars",
    "shared_contacts",
    "shared_mailboxes",
    "delegated_mailbox_access",
    "distribution_lists",
    "team_groups",
  ],
  user_management_model: [
    "single_user",
    "multi_user_admin",
    "domain_admin",
    "directory_sync",
    "self_hosted_admin",
  ],
  retention_ediscovery: [
    "none",
    "retention_policies",
    "archive_mailbox",
    "legal_hold",
    "ediscovery_export",
  ],
} as const;

const forbiddenGenericCriterionKeys = [
  "headquarters_country",
  "privacy_policy",
  "open_source",
  "business_model",
  "tracking",
  "gdpr_compliance",
  "eu_company",
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

describe("email matrix criteria migration", () => {
  it("adds the repository-owned migration for Email matrix metadata", () => {
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
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?schema_migrations`?[\s\S]*'008-email-matrix-criteria'/i,
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

  it("defines user-readable Email criterion groups with English and German labels", () => {
    for (const group of expectedGroups) {
      const window = windowForLiteral(group.key, [group.labelEn]);

      expectSqlLiteral(group.key);
      expectWindowContainsSqlLiterals(window, ["email", group.labelEn]);
      expectWindowContainsGermanHints(window, group.germanHints);
      expectWindowContainsNumber(window, group.sortOrder);
    }
  });

  it("defines category-native Email criteria with valid metadata and localized labels", () => {
    const seenCriterionKeys = new Set<string>();
    const seenSortOrders = new Set<number>();

    expect(expectedCriteria).toHaveLength(46);

    for (const criterion of expectedCriteria) {
      const window = windowForLiteral(criterion.key, [criterion.labelEn]);

      expect(seenCriterionKeys.has(criterion.key)).toBe(false);
      seenCriterionKeys.add(criterion.key);
      expect(seenSortOrders.has(criterion.sortOrder)).toBe(false);
      seenSortOrders.add(criterion.sortOrder);
      expectSqlLiteral(criterion.key);
      expectWindowContainsSqlLiterals(window, [
        "email",
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

  it("keeps group and criterion seed rows scoped to only the reviewed Email metadata", () => {
    const groupRows = parseGroupRows();
    const criterionRows = parseCriterionRows();
    const expectedGroupKeys = expectedGroups.map((group) => group.key);
    const expectedCriterionKeys = expectedCriteria.map(
      (criterion) => criterion.key,
    );

    expect(groupRows).toHaveLength(expectedGroups.length);
    expect(groupRows.map((group) => group.groupKey)).toEqual(expectedGroupKeys);

    for (const group of groupRows) {
      expect(group.categoryId).toBe("email");
      expect(group.labelEn).not.toEqual("");
      expect(group.labelDe).not.toEqual("");
      expect(group.descriptionEn).not.toEqual("");
      expect(group.descriptionDe).not.toEqual("");
    }

    expect(criterionRows).toHaveLength(expectedCriteria.length);
    expect(criterionRows.map((criterion) => criterion.criterionKey)).toEqual(
      expectedCriterionKeys,
    );

    for (const criterion of criterionRows) {
      expect(criterion.categoryId).toBe("email");
      expect(expectedGroupKeys).toContain(criterion.groupKey);
      expect(allowedValueTypes).toContain(
        criterion.valueType as (typeof allowedValueTypes)[number],
      );
      expect(allowedSemantics).toContain(
        criterion.semantics as (typeof allowedSemantics)[number],
      );
      expect(allowedFilterModes).toContain(
        criterion.filterMode as (typeof allowedFilterModes)[number],
      );
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
      expect(option.categoryId).toBe("email");
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

    expect(factSql).not.toEqual("");
    expect(normalizeSql(factSql)).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`?matrix_facts`?\s*\(\s*`?entry_id`?\s*,\s*`?category_id`?\s*,\s*`?criterion_id`?\s*,\s*`?status`?\s*\)/i,
    );
    expect(normalizeSql(factSql)).toMatch(/\bSELECT\b[\s\S]*'open'/i);
    expect(normalizeSql(factSql)).toMatch(
      /\bJOIN\s+`?entry_categories`?[\s\S]*'email'/i,
    );
    expect(normalizeSql(factSql)).toMatch(
      /\bJOIN\s+`?matrix_criteria`?[\s\S]*'email'/i,
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
