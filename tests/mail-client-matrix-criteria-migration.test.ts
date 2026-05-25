import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../scripts/migrations/009-mail-client-matrix-criteria.sql",
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
    key: "client_model_platforms",
    labelEn: "Client Model & Platforms",
    germanHints: ["client-modell", "plattformen"],
    sortOrder: 100,
  },
  {
    key: "accounts_protocols",
    labelEn: "Accounts & Protocols",
    germanHints: ["konten", "protokolle"],
    sortOrder: 200,
  },
  {
    key: "reading_organization",
    labelEn: "Reading & Organization",
    germanHints: ["lesen", "organisation"],
    sortOrder: 300,
  },
  {
    key: "composing_productivity",
    labelEn: "Composing & Productivity",
    germanHints: ["schreiben", "produktivitaet"],
    sortOrder: 400,
  },
  {
    key: "security_privacy",
    labelEn: "Security & Privacy",
    germanHints: ["sicherheit", "datenschutz"],
    sortOrder: 500,
  },
  {
    key: "encryption_signing",
    labelEn: "Encryption & Signing",
    germanHints: ["verschluesselung", "signaturen"],
    sortOrder: 600,
  },
  {
    key: "data_portability_sync",
    labelEn: "Data, Portability & Sync",
    germanHints: ["daten", "portabilitaet"],
    sortOrder: 700,
  },
  {
    key: "customization_integrations",
    labelEn: "Customization & Integrations",
    germanHints: ["anpassung", "integrationen"],
    sortOrder: 800,
  },
  {
    key: "accessibility_fit",
    labelEn: "Accessibility & Fit",
    germanHints: ["barrierefreiheit", "eignung"],
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
    key: "client_model",
    groupKey: "client_model_platforms",
    labelEn: "Client model",
    germanHints: ["client-modell"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 1010,
  },
  {
    key: "supported_platforms",
    groupKey: "client_model_platforms",
    labelEn: "Supported platforms",
    germanHints: ["unterstuetzte", "plattformen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1020,
  },
  {
    key: "distribution_channels",
    groupKey: "client_model_platforms",
    labelEn: "Distribution channels",
    germanHints: ["vertriebskanaele"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1030,
  },
  {
    key: "offline_mail_access",
    groupKey: "client_model_platforms",
    labelEn: "Offline mail access",
    germanHints: ["offline-mailzugriff"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 1040,
  },
  {
    key: "multi_account_support",
    groupKey: "client_model_platforms",
    labelEn: "Multiple accounts",
    germanHints: ["mehrere", "konten"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 1050,
  },
  {
    key: "unified_inbox",
    groupKey: "client_model_platforms",
    labelEn: "Unified inbox",
    germanHints: ["gemeinsamer", "posteingang"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1060,
  },
  {
    key: "supported_account_types",
    groupKey: "accounts_protocols",
    labelEn: "Supported account types",
    germanHints: ["unterstuetzte", "kontotypen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2010,
  },
  {
    key: "mail_protocols",
    groupKey: "accounts_protocols",
    labelEn: "Mail protocols",
    germanHints: ["mail-protokolle"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2020,
  },
  {
    key: "oauth2_support",
    groupKey: "accounts_protocols",
    labelEn: "OAuth2 account support",
    germanHints: ["oauth2", "kontounterstuetzung"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 2030,
  },
  {
    key: "automatic_account_setup",
    groupKey: "accounts_protocols",
    labelEn: "Automatic account setup",
    germanHints: ["automatische", "kontoeinrichtung"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2040,
  },
  {
    key: "identity_alias_management",
    groupKey: "accounts_protocols",
    labelEn: "Identity and alias management",
    germanHints: ["identitaets", "aliasverwaltung"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2050,
  },
  {
    key: "conversation_threading",
    groupKey: "reading_organization",
    labelEn: "Conversation threading",
    germanHints: ["konversationsansicht"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "folder_label_model",
    groupKey: "reading_organization",
    labelEn: "Folder and label model",
    germanHints: ["ordner", "label-modell"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "local_search_scope",
    groupKey: "reading_organization",
    labelEn: "Local search scope",
    germanHints: ["umfang", "lokalen", "suche"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "message_filter_rules",
    groupKey: "reading_organization",
    labelEn: "Message filter rules",
    germanHints: ["nachrichtenfilterregeln"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3040,
  },
  {
    key: "saved_searches_smart_folders",
    groupKey: "reading_organization",
    labelEn: "Saved searches or smart folders",
    germanHints: ["gespeicherte", "suchen"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3050,
  },
  {
    key: "notification_controls",
    groupKey: "reading_organization",
    labelEn: "Notification controls",
    germanHints: ["benachrichtigungskontrollen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3060,
  },
  {
    key: "compose_format_modes",
    groupKey: "composing_productivity",
    labelEn: "Compose format modes",
    germanHints: ["schreibformat-modi"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4010,
  },
  {
    key: "signatures_templates",
    groupKey: "composing_productivity",
    labelEn: "Signatures and templates",
    germanHints: ["signaturen", "vorlagen"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4020,
  },
  {
    key: "scheduled_send_model",
    groupKey: "composing_productivity",
    labelEn: "Scheduled send model",
    germanHints: ["geplantes", "senden"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "attachment_handling",
    groupKey: "composing_productivity",
    labelEn: "Attachment handling",
    germanHints: ["anhangsverwaltung"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4040,
  },
  {
    key: "keyboard_shortcuts",
    groupKey: "composing_productivity",
    labelEn: "Keyboard shortcuts",
    germanHints: ["tastaturkurzbefehle"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "remote_content_blocking",
    groupKey: "security_privacy",
    labelEn: "Remote-content blocking",
    germanHints: ["blockieren", "externer", "inhalte"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 5010,
  },
  {
    key: "tracker_protection",
    groupKey: "security_privacy",
    labelEn: "Tracker protection",
    germanHints: ["tracking-schutz"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5020,
  },
  {
    key: "phishing_malware_warnings",
    groupKey: "security_privacy",
    labelEn: "Phishing and malware warnings",
    germanHints: ["phishing", "malware-warnungen"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5030,
  },
  {
    key: "credential_storage_model",
    groupKey: "security_privacy",
    labelEn: "Credential storage model",
    germanHints: ["zugangsdaten", "speicherung"],
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 5040,
  },
  {
    key: "app_lock_or_profile_password",
    groupKey: "security_privacy",
    labelEn: "App lock or profile password",
    germanHints: ["app-sperre", "profilpasswort"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5050,
  },
  {
    key: "proxy_tor_support",
    groupKey: "security_privacy",
    labelEn: "Proxy or Tor support",
    germanHints: ["proxy", "tor-unterstuetzung"],
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 5060,
  },
  {
    key: "openpgp_support",
    groupKey: "encryption_signing",
    labelEn: "OpenPGP support",
    germanHints: ["openpgp", "unterstuetzung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "must_match",
    sortOrder: 6010,
  },
  {
    key: "smime_support",
    groupKey: "encryption_signing",
    labelEn: "S/MIME support",
    germanHints: ["s/mime", "unterstuetzung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "autocrypt_support",
    groupKey: "encryption_signing",
    labelEn: "Autocrypt support",
    germanHints: ["autocrypt", "unterstuetzung"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "key_management_model",
    groupKey: "encryption_signing",
    labelEn: "Key management model",
    germanHints: ["schluesselverwaltung"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "encrypted_local_storage",
    groupKey: "encryption_signing",
    labelEn: "Encrypted local storage",
    germanHints: ["verschluesselter", "lokaler", "speicher"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6050,
  },
  {
    key: "per_recipient_encryption_policy",
    groupKey: "encryption_signing",
    labelEn: "Per-recipient encryption policy",
    germanHints: ["verschluesselungsrichtlinie", "empfaenger"],
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6060,
  },
  {
    key: "import_sources",
    groupKey: "data_portability_sync",
    labelEn: "Import sources",
    germanHints: ["importquellen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 7010,
  },
  {
    key: "export_formats",
    groupKey: "data_portability_sync",
    labelEn: "Export formats",
    germanHints: ["exportformate"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7020,
  },
  {
    key: "local_storage_format",
    groupKey: "data_portability_sync",
    labelEn: "Local storage format",
    germanHints: ["lokales", "speicherformat"],
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7030,
  },
  {
    key: "profile_backup_portability",
    groupKey: "data_portability_sync",
    labelEn: "Profile backup and portability",
    germanHints: ["profil-backup", "portabilitaet"],
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7040,
  },
  {
    key: "contacts_sync_support",
    groupKey: "data_portability_sync",
    labelEn: "Contacts sync support",
    germanHints: ["kontakte-sync", "unterstuetzung"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7050,
  },
  {
    key: "calendar_sync_support",
    groupKey: "data_portability_sync",
    labelEn: "Calendar sync support",
    germanHints: ["kalender-sync", "unterstuetzung"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7060,
  },
  {
    key: "add_on_extension_support",
    groupKey: "customization_integrations",
    labelEn: "Add-on or extension support",
    germanHints: ["add-on", "erweiterungsunterstuetzung"],
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 8010,
  },
  {
    key: "theming_layout_options",
    groupKey: "customization_integrations",
    labelEn: "Theming and layout options",
    germanHints: ["theme", "layoutoptionen"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8020,
  },
  {
    key: "external_tool_integration",
    groupKey: "customization_integrations",
    labelEn: "External tool integration",
    germanHints: ["integration", "externer", "werkzeuge"],
    valueType: "multi_enum",
    semantics: "tradeoff",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "managed_deployment",
    groupKey: "customization_integrations",
    labelEn: "Managed deployment",
    germanHints: ["verwaltete", "bereitstellung"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 8040,
  },
  {
    key: "accessibility_features",
    groupKey: "accessibility_fit",
    labelEn: "Accessibility features",
    germanHints: ["barrierefreiheitsfunktionen"],
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 9010,
  },
  {
    key: "localization_scope",
    groupKey: "accessibility_fit",
    labelEn: "Localization scope",
    germanHints: ["lokalisierungsumfang"],
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9020,
  },
  {
    key: "fit_profiles",
    groupKey: "accessibility_fit",
    labelEn: "Fit profiles",
    germanHints: ["eignungsprofile"],
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9030,
  },
];

const requiredOptionsByCriterion = {
  client_model: [
    "native_desktop",
    "native_mobile",
    "cross_platform_app",
    "terminal_or_text_client",
    "web_wrapper",
  ],
  supported_platforms: [
    "windows",
    "macos",
    "linux",
    "ios",
    "android",
    "f_droid",
    "bsd",
  ],
  distribution_channels: [
    "vendor_download",
    "app_store",
    "microsoft_store",
    "linux_package_manager",
    "flatpak",
    "snap",
    "f_droid",
  ],
  supported_account_types: [
    "generic_imap_smtp",
    "pop3_mailbox",
    "microsoft_365_outlook",
    "gmail_google",
    "exchange_server",
    "provider_specific",
  ],
  mail_protocols: [
    "imap",
    "smtp_submission",
    "pop3",
    "jmap",
    "exchange_activesync",
    "ews",
    "microsoft_graph",
  ],
  oauth2_support: [
    "google",
    "microsoft",
    "yahoo",
    "generic_oauth2",
    "no_oauth2",
  ],
  identity_alias_management: [
    "multiple_identities",
    "per_account_signatures",
    "reply_from_alias",
    "plus_address_awareness",
  ],
  folder_label_model: [
    "folders",
    "labels",
    "folders_and_labels",
    "virtual_folders",
  ],
  local_search_scope: [
    "headers_only",
    "body_full_text",
    "attachments",
    "encrypted_index",
  ],
  message_filter_rules: [
    "local_rules",
    "server_sieve",
    "smart_folders",
    "bayesian_spam",
    "rule_templates",
  ],
  notification_controls: [
    "per_account",
    "per_folder",
    "quiet_hours",
    "sender_priority",
  ],
  compose_format_modes: [
    "plain_text",
    "rich_text_html",
    "markdown",
    "per_message_mode",
  ],
  signatures_templates: [
    "signatures",
    "html_signatures",
    "templates",
    "stationery",
  ],
  scheduled_send_model: [
    "none",
    "local_outbox",
    "client_scheduler",
    "server_assisted",
  ],
  attachment_handling: [
    "drag_drop",
    "attachment_reminders",
    "large_file_warning",
    "cloud_link_integration",
    "inline_image_controls",
  ],
  tracker_protection: [
    "tracking_pixel_detection",
    "link_tracking_warnings",
    "image_proxy",
    "sender_privacy_warnings",
  ],
  phishing_malware_warnings: [
    "suspicious_link_warning",
    "attachment_warning",
    "spoofing_warning",
    "malware_scanner_integration",
  ],
  credential_storage_model: [
    "system_keychain",
    "app_encrypted_store",
    "master_password_store",
    "profile_plaintext_risk",
  ],
  proxy_tor_support: [
    "http_proxy",
    "socks_proxy",
    "tor_documented",
    "per_account_proxy",
  ],
  openpgp_support: [
    "none",
    "external_plugin",
    "built_in",
    "key_import_export",
    "wkd_lookup",
  ],
  smime_support: [
    "none",
    "certificate_import",
    "system_certificate_store",
    "smartcard_token",
  ],
  key_management_model: [
    "external_key_manager",
    "integrated_key_manager",
    "system_keychain",
    "hardware_token",
    "manual_files",
  ],
  import_sources: [
    "mbox",
    "eml",
    "maildir",
    "outlook_pst",
    "thunderbird_profile",
    "csv_contacts",
  ],
  export_formats: ["mbox", "eml", "maildir", "pdf_print", "csv_contacts"],
  local_storage_format: [
    "mbox",
    "maildir",
    "sqlite_database",
    "proprietary_database",
    "server_cache_only",
  ],
  profile_backup_portability: [
    "manual_profile_copy",
    "built_in_backup_restore",
    "sync_account_settings",
    "no_documented_profile_backup",
  ],
  contacts_sync_support: [
    "local_address_book",
    "carddav",
    "google_contacts",
    "exchange_contacts",
    "csv_vcard_import_export",
  ],
  calendar_sync_support: [
    "caldav",
    "google_calendar",
    "exchange_calendar",
    "ics_import_export",
    "no_calendar",
  ],
  theming_layout_options: [
    "density_controls",
    "dark_mode",
    "message_pane_layouts",
    "custom_css_theme",
  ],
  external_tool_integration: [
    "external_editor",
    "command_hooks",
    "calendar_app",
    "address_book_app",
    "password_manager",
  ],
  managed_deployment: [
    "none",
    "config_profiles",
    "group_policy",
    "mdm",
    "portable_app",
  ],
  accessibility_features: [
    "keyboard_navigation",
    "screen_reader_docs",
    "high_contrast",
    "font_scaling",
    "reduced_motion",
  ],
  localization_scope: [
    "english_only",
    "major_languages",
    "community_translations",
    "broad_localization",
  ],
  fit_profiles: [
    "privacy_sensitive",
    "power_users",
    "teams_enterprise",
    "lightweight_mobile",
    "terminal_workflows",
    "accessibility_focused",
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

const forbiddenHostedEmailCriterionKeys = [
  "service_model",
  "free_tier_mailbox_storage_gb",
  "personal_mailbox_storage_gb",
  "max_attachment_size_mb",
  "pricing_model",
  "webmail_available",
  "standard_mail_protocols",
  "bridge_required_for_standard_clients",
  "server_side_filters",
  "custom_domains",
  "alias_support_model",
  "alias_limit",
  "catch_all_address",
  "disposable_masked_aliases",
  "domain_authentication_controls",
  "two_factor_auth",
  "hardware_security_key",
  "account_recovery_model",
  "mailbox_encryption_model",
  "e2ee_internal_default",
  "encrypted_external_email",
  "data_region_model",
  "eu_mailbox_storage_available",
  "hosting_infrastructure_model",
  "data_processing_agreement",
  "compliance_profiles",
  "mailbox_export_available",
  "mail_forwarding",
  "external_account_collection",
  "calendar_included",
  "contacts_included",
  "productivity_suite_scope",
  "collaboration_features",
  "admin_console",
  "user_management_model",
  "sso_available",
  "audit_logs",
  "retention_ediscovery",
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

describe("mail client matrix criteria migration", () => {
  it("adds the repository-owned migration for Mail Client matrix metadata", () => {
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
      /INSERT\s+(?:IGNORE\s+)?INTO\s+`?schema_migrations`?[\s\S]*'009-mail-client-matrix-criteria'/i,
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

  it("defines user-readable Mail Client criterion groups with English and German labels", () => {
    for (const group of expectedGroups) {
      const window = windowForLiteral(group.key, [group.labelEn]);

      expectSqlLiteral(group.key);
      expectWindowContainsSqlLiterals(window, ["mail-client", group.labelEn]);
      expectWindowContainsGermanHints(window, group.germanHints);
      expectWindowContainsNumber(window, group.sortOrder);
    }
  });

  it("defines category-native Mail Client criteria with valid metadata and localized labels", () => {
    const seenCriterionKeys = new Set<string>();
    const seenSortOrders = new Set<number>();

    expect(expectedCriteria).toHaveLength(47);

    for (const criterion of expectedCriteria) {
      const window = windowForLiteral(criterion.key, [criterion.labelEn]);

      expect(seenCriterionKeys.has(criterion.key)).toBe(false);
      seenCriterionKeys.add(criterion.key);
      expect(seenSortOrders.has(criterion.sortOrder)).toBe(false);
      seenSortOrders.add(criterion.sortOrder);
      expectSqlLiteral(criterion.key);
      expectWindowContainsSqlLiterals(window, [
        "mail-client",
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

    for (const forbiddenKey of [
      ...forbiddenGenericCriterionKeys,
      ...forbiddenHostedEmailCriterionKeys,
    ]) {
      expect(normalizedMigration).not.toContain(sqlStringLiteral(forbiddenKey));
    }
  });

  it("keeps group and criterion seed rows scoped to only the reviewed Mail Client metadata", () => {
    const groupRows = parseGroupRows();
    const criterionRows = parseCriterionRows();
    const expectedGroupKeys = expectedGroups.map((group) => group.key);
    const expectedCriterionKeys = expectedCriteria.map(
      (criterion) => criterion.key,
    );

    expect(groupRows).toHaveLength(expectedGroups.length);
    expect(groupRows.map((group) => group.groupKey)).toEqual(expectedGroupKeys);

    for (const group of groupRows) {
      expect(group.categoryId).toBe("mail-client");
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
      expect(criterion.categoryId).toBe("mail-client");
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
      expect(option.categoryId).toBe("mail-client");
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
      /\bJOIN\s+`?entry_categories`?[\s\S]*'mail-client'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'mail-client'\s+WHERE\b/i,
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
