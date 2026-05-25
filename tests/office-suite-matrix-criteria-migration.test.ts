import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "office-suite";
const migrationVersion = "014-office-suite-matrix-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/014-office-suite-matrix-criteria.sql",
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
  { key: "suite_components", labelEn: "Suite Components", sortOrder: 100 },
  { key: "platform_access", labelEn: "Platform & Access", sortOrder: 200 },
  { key: "file_formats", labelEn: "File Formats", sortOrder: 300 },
  {
    key: "collaboration_review",
    labelEn: "Collaboration & Review",
    sortOrder: 400,
  },
  {
    key: "document_spreadsheet_depth",
    labelEn: "Document & Spreadsheet Depth",
    sortOrder: 500,
  },
  {
    key: "deployment_admin",
    labelEn: "Deployment & Administration",
    sortOrder: 600,
  },
  {
    key: "security_privacy",
    labelEn: "Security & Privacy Controls",
    sortOrder: 700,
  },
  {
    key: "integrations_portability",
    labelEn: "Integrations & Portability",
    sortOrder: 800,
  },
  { key: "accessibility_fit", labelEn: "Accessibility & Fit", sortOrder: 900 },
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
    key: "included_editors",
    groupKey: "suite_components",
    labelEn: "Included editors",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1010,
  },
  {
    key: "pdf_workflow",
    groupKey: "suite_components",
    labelEn: "PDF workflow",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 1020,
  },
  {
    key: "forms_database_tools",
    groupKey: "suite_components",
    labelEn: "Forms/database tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1030,
  },
  {
    key: "templates_available",
    groupKey: "suite_components",
    labelEn: "Templates available",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 1040,
  },
  {
    key: "equation_or_scientific_tools",
    groupKey: "suite_components",
    labelEn: "Equation/scientific tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 1050,
  },
  {
    key: "desktop_apps",
    groupKey: "platform_access",
    labelEn: "Desktop apps",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 2010,
  },
  {
    key: "web_editing",
    groupKey: "platform_access",
    labelEn: "Browser editing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2020,
  },
  {
    key: "mobile_platforms",
    groupKey: "platform_access",
    labelEn: "Mobile platforms",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 2030,
  },
  {
    key: "offline_editing",
    groupKey: "platform_access",
    labelEn: "Offline editing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 2040,
  },
  {
    key: "account_required_to_edit",
    groupKey: "platform_access",
    labelEn: "Account required to edit",
    valueType: "boolean",
    semantics: "risk",
    filterMode: "must_match",
    sortOrder: 2050,
  },
  {
    key: "native_format_model",
    groupKey: "file_formats",
    labelEn: "Native format model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 3010,
  },
  {
    key: "ooxml_compatibility",
    groupKey: "file_formats",
    labelEn: "OOXML compatibility",
    valueType: "enum",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 3020,
  },
  {
    key: "odf_support",
    groupKey: "file_formats",
    labelEn: "ODF support",
    valueType: "enum",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 3030,
  },
  {
    key: "legacy_format_support",
    groupKey: "file_formats",
    labelEn: "Legacy format support",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3040,
  },
  {
    key: "export_formats",
    groupKey: "file_formats",
    labelEn: "Export formats",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 3050,
  },
  {
    key: "format_fidelity_tools",
    groupKey: "file_formats",
    labelEn: "Format fidelity tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 3060,
  },
  {
    key: "real_time_coediting",
    groupKey: "collaboration_review",
    labelEn: "Real-time co-editing",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "must_match",
    sortOrder: 4010,
  },
  {
    key: "comments_mentions",
    groupKey: "collaboration_review",
    labelEn: "Comments and mentions",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4020,
  },
  {
    key: "track_changes_review",
    groupKey: "collaboration_review",
    labelEn: "Track changes/review mode",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4030,
  },
  {
    key: "sharing_link_controls",
    groupKey: "collaboration_review",
    labelEn: "Sharing link controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 4040,
  },
  {
    key: "external_guest_collaboration",
    groupKey: "collaboration_review",
    labelEn: "External guest collaboration",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 4050,
  },
  {
    key: "version_history",
    groupKey: "collaboration_review",
    labelEn: "Version history",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 4060,
  },
  {
    key: "collaboration_presence",
    groupKey: "collaboration_review",
    labelEn: "Collaboration presence",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 4070,
  },
  {
    key: "mail_merge",
    groupKey: "document_spreadsheet_depth",
    labelEn: "Mail merge",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 5010,
  },
  {
    key: "citation_bibliography_tools",
    groupKey: "document_spreadsheet_depth",
    labelEn: "Citation/bibliography tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5020,
  },
  {
    key: "advanced_layout_tools",
    groupKey: "document_spreadsheet_depth",
    labelEn: "Advanced layout tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5030,
  },
  {
    key: "spreadsheet_advanced_features",
    groupKey: "document_spreadsheet_depth",
    labelEn: "Advanced spreadsheet features",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 5040,
  },
  {
    key: "presentation_features",
    groupKey: "document_spreadsheet_depth",
    labelEn: "Presentation features",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 5050,
  },
  {
    key: "macro_scripting_model",
    groupKey: "document_spreadsheet_depth",
    labelEn: "Macro/scripting model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5060,
  },
  {
    key: "vba_macro_compatibility",
    groupKey: "document_spreadsheet_depth",
    labelEn: "VBA macro compatibility",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 5070,
  },
  {
    key: "deployment_model",
    groupKey: "deployment_admin",
    labelEn: "Deployment model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6010,
  },
  {
    key: "self_hosting_available",
    groupKey: "deployment_admin",
    labelEn: "Self-hosting available",
    valueType: "boolean",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6020,
  },
  {
    key: "storage_backend_model",
    groupKey: "deployment_admin",
    labelEn: "Storage backend model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 6030,
  },
  {
    key: "admin_console_available",
    groupKey: "deployment_admin",
    labelEn: "Admin console available",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6040,
  },
  {
    key: "role_access_controls",
    groupKey: "deployment_admin",
    labelEn: "Role/access controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 6050,
  },
  {
    key: "audit_logs",
    groupKey: "deployment_admin",
    labelEn: "Audit logs",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 6060,
  },
  {
    key: "data_residency_controls",
    groupKey: "deployment_admin",
    labelEn: "Data residency controls",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 6070,
  },
  {
    key: "document_password_protection",
    groupKey: "security_privacy",
    labelEn: "Document password protection",
    valueType: "boolean",
    semantics: "beneficial",
    filterMode: "optional",
    sortOrder: 7010,
  },
  {
    key: "client_side_encryption_model",
    groupKey: "security_privacy",
    labelEn: "Client-side encryption model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 7020,
  },
  {
    key: "sharing_security_controls",
    groupKey: "security_privacy",
    labelEn: "Sharing security controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7030,
  },
  {
    key: "dlp_retention_controls",
    groupKey: "security_privacy",
    labelEn: "DLP/retention controls",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 7040,
  },
  {
    key: "telemetry_control_model",
    groupKey: "security_privacy",
    labelEn: "Telemetry control model",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 7050,
  },
  {
    key: "developer_api",
    groupKey: "integrations_portability",
    labelEn: "Developer API",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8010,
  },
  {
    key: "extension_plugin_model",
    groupKey: "integrations_portability",
    labelEn: "Extension/plugin model",
    valueType: "enum",
    semantics: "tradeoff",
    filterMode: "optional",
    sortOrder: 8020,
  },
  {
    key: "cloud_storage_integrations",
    groupKey: "integrations_portability",
    labelEn: "Cloud storage integrations",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 8030,
  },
  {
    key: "bulk_import_migration",
    groupKey: "integrations_portability",
    labelEn: "Bulk import/migration",
    valueType: "multi_enum",
    semantics: "beneficial",
    filterMode: "multi_select",
    sortOrder: 8040,
  },
  {
    key: "standards_interoperability",
    groupKey: "integrations_portability",
    labelEn: "Standards interoperability",
    valueType: "multi_enum",
    semantics: "beneficial",
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
    key: "language_tools",
    groupKey: "accessibility_fit",
    labelEn: "Language tools",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9020,
  },
  {
    key: "right_to_left_support",
    groupKey: "accessibility_fit",
    labelEn: "Right-to-left support",
    valueType: "boolean",
    semantics: "informational",
    filterMode: "optional",
    sortOrder: 9030,
  },
  {
    key: "ai_assistance_model",
    groupKey: "accessibility_fit",
    labelEn: "AI assistance model",
    valueType: "enum",
    semantics: "risk",
    filterMode: "optional",
    sortOrder: 9040,
  },
  {
    key: "fit_profiles",
    groupKey: "accessibility_fit",
    labelEn: "Fit profiles",
    valueType: "multi_enum",
    semantics: "informational",
    filterMode: "multi_select",
    sortOrder: 9050,
  },
];

const requiredOptionsByCriterion = {
  included_editors: [
    "word_processor",
    "spreadsheet",
    "presentation",
    "drawing",
    "database",
    "forms",
    "notes",
    "whiteboard",
  ],
  pdf_workflow: [
    "pdf_export",
    "pdf_import",
    "pdf_editing",
    "pdf_forms",
    "pdf_signing",
    "pdf_redaction",
    "pdf_ocr",
  ],
  forms_database_tools: [
    "forms_builder",
    "surveys",
    "database_app",
    "data_sources",
    "reports",
  ],
  equation_or_scientific_tools: [
    "equation_editor",
    "latex_input",
    "symbol_palette",
    "cross_references",
    "footnotes_endnotes",
  ],
  mobile_platforms: ["android", "ios", "tablet_optimized", "f_droid"],
  native_format_model: [
    "open_standard_default",
    "proprietary_default",
    "cloud_native",
    "mixed_formats",
  ],
  ooxml_compatibility: [
    "not_supported",
    "view_import_only",
    "basic_edit_export",
    "high_fidelity",
    "native_ooxml",
  ],
  odf_support: [
    "not_supported",
    "import_export",
    "native_default",
    "certified_or_documented",
  ],
  legacy_format_support: [
    "doc_xls_ppt",
    "rtf",
    "csv_tsv",
    "legacy_templates",
    "macros_legacy",
  ],
  export_formats: [
    "odf",
    "ooxml",
    "pdf",
    "pdf_a",
    "html",
    "csv_tsv",
    "markdown",
    "epub",
  ],
  format_fidelity_tools: [
    "compatibility_checker",
    "font_substitution_warnings",
    "layout_preservation",
    "change_summary",
    "conversion_report",
  ],
  sharing_link_controls: [
    "view_edit_permissions",
    "comment_only",
    "password_protected_links",
    "link_expiration",
    "download_disable",
    "domain_restriction",
    "invite_only",
  ],
  external_guest_collaboration: [
    "not_supported",
    "public_link_only",
    "guest_accounts",
    "account_required",
    "federated_external",
  ],
  collaboration_presence: [
    "presence_indicators",
    "live_cursors",
    "activity_feed",
    "assignment_mentions",
    "notifications",
  ],
  citation_bibliography_tools: [
    "citations",
    "bibliography",
    "zotero_integration",
    "endnote_integration",
    "cross_references",
    "footnotes_endnotes",
  ],
  advanced_layout_tools: [
    "styles",
    "section_layouts",
    "master_pages",
    "desktop_publishing",
    "drawing_objects",
    "mail_merge_fields",
  ],
  spreadsheet_advanced_features: [
    "pivot_tables",
    "charts",
    "conditional_formatting",
    "data_validation",
    "solver",
    "external_data",
    "collaborative_filters",
  ],
  presentation_features: [
    "speaker_notes",
    "presenter_view",
    "animations_transitions",
    "master_slides",
    "recording",
    "live_present",
  ],
  macro_scripting_model: [
    "none",
    "basic_macros",
    "javascript_api",
    "python_scripting",
    "vba_compatible",
    "server_side_automation",
  ],
  vba_macro_compatibility: [
    "none",
    "partial",
    "high",
    "sandboxed_only",
    "blocked_by_policy",
  ],
  deployment_model: [
    "desktop_only",
    "hosted_saas",
    "self_hosted_web",
    "hybrid",
    "mobile_app_only",
  ],
  storage_backend_model: [
    "local_files",
    "provider_cloud",
    "self_hosted_storage",
    "external_storage_connector",
    "user_selected_storage",
  ],
  role_access_controls: [
    "viewer_editor_commenter",
    "owner_admin_roles",
    "group_permissions",
    "document_locking",
    "folder_workspace_permissions",
    "public_access_controls",
  ],
  client_side_encryption_model: [
    "none_documented",
    "transport_at_rest_only",
    "client_side_optional",
    "client_side_default",
    "limited_collaboration_when_encrypted",
  ],
  sharing_security_controls: [
    "passwords",
    "expiration",
    "download_blocking",
    "watermarking",
    "domain_allowlist",
    "revocation",
  ],
  dlp_retention_controls: [
    "retention_policies",
    "legal_hold",
    "dlp_rules",
    "classification_labels",
    "malware_scanning",
    "device_session_controls",
  ],
  telemetry_control_model: [
    "undocumented",
    "provider_default",
    "opt_out",
    "admin_controlled",
    "disabled_by_default",
  ],
  developer_api: [
    "document_api",
    "admin_api",
    "storage_api",
    "webhooks",
    "sdk",
  ],
  extension_plugin_model: [
    "none",
    "built_in_extensions",
    "marketplace",
    "sideloaded_extensions",
    "admin_managed_addins",
  ],
  cloud_storage_integrations: [
    "local_files",
    "webdav",
    "nextcloud_owncloud",
    "s3_compatible",
    "third_party_cloud_drives",
    "network_shares",
  ],
  bulk_import_migration: [
    "desktop_file_import",
    "batch_upload",
    "workspace_import",
    "admin_migration_tool",
    "cloud_drive_import",
  ],
  standards_interoperability: [
    "odf",
    "ooxml",
    "pdf_a",
    "webdav",
    "wopi",
    "cmis",
  ],
  accessibility_features: [
    "keyboard_navigation",
    "screen_reader_labels",
    "high_contrast",
    "accessibility_checker",
    "alt_text_tools",
    "document_language_tags",
  ],
  language_tools: [
    "spellcheck",
    "grammar_check",
    "hyphenation",
    "thesaurus",
    "translation",
    "multilingual_ui",
  ],
  ai_assistance_model: [
    "none",
    "local_model",
    "provider_hosted",
    "third_party_model",
    "bring_your_own_key",
    "admin_disable_available",
  ],
  fit_profiles: [
    "personal_offline",
    "privacy_sensitive",
    "team_collaboration",
    "self_hosters",
    "schools_universities",
    "enterprises",
    "ms_office_compatibility",
  ],
} as const satisfies Record<string, readonly string[]>;

const expectedCautionOptionTonesByCriterion = {
  native_format_model: {
    proprietary_default: "warning",
    cloud_native: "tradeoff",
    mixed_formats: "tradeoff",
  },
  ooxml_compatibility: {
    not_supported: "warning",
    native_ooxml: "tradeoff",
  },
  odf_support: {
    not_supported: "warning",
  },
  legacy_format_support: {
    macros_legacy: "tradeoff",
  },
  sharing_link_controls: {
    download_disable: "tradeoff",
  },
  external_guest_collaboration: {
    not_supported: "warning",
    public_link_only: "tradeoff",
    account_required: "tradeoff",
    federated_external: "tradeoff",
  },
  advanced_layout_tools: {
    desktop_publishing: "tradeoff",
  },
  spreadsheet_advanced_features: {
    external_data: "tradeoff",
  },
  macro_scripting_model: {
    javascript_api: "tradeoff",
    python_scripting: "tradeoff",
    vba_compatible: "tradeoff",
    server_side_automation: "tradeoff",
  },
  vba_macro_compatibility: {
    partial: "tradeoff",
    sandboxed_only: "tradeoff",
    blocked_by_policy: "warning",
  },
  deployment_model: {
    desktop_only: "tradeoff",
    hybrid: "tradeoff",
    mobile_app_only: "warning",
  },
  storage_backend_model: {
    external_storage_connector: "tradeoff",
  },
  client_side_encryption_model: {
    none_documented: "warning",
    limited_collaboration_when_encrypted: "tradeoff",
  },
  sharing_security_controls: {
    download_blocking: "tradeoff",
    watermarking: "tradeoff",
  },
  dlp_retention_controls: {
    device_session_controls: "tradeoff",
  },
  telemetry_control_model: {
    undocumented: "warning",
  },
  extension_plugin_model: {
    marketplace: "tradeoff",
    sideloaded_extensions: "tradeoff",
  },
  cloud_storage_integrations: {
    s3_compatible: "tradeoff",
    third_party_cloud_drives: "tradeoff",
  },
  bulk_import_migration: {
    cloud_drive_import: "tradeoff",
  },
  standards_interoperability: {
    wopi: "tradeoff",
    cmis: "tradeoff",
  },
  language_tools: {
    translation: "tradeoff",
  },
  ai_assistance_model: {
    provider_hosted: "tradeoff",
    third_party_model: "warning",
    bring_your_own_key: "tradeoff",
  },
  fit_profiles: {
    self_hosters: "tradeoff",
    ms_office_compatibility: "tradeoff",
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

describe("office suite matrix criteria migration", () => {
  it("adds the repository-owned migration for Office Suite matrix metadata", () => {
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

  it("defines ordered Office Suite criterion groups with localized labels", () => {
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

  it("defines category-native Office Suite criteria with valid metadata and localized copy", () => {
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
      /\bJOIN\s+`?entry_categories`?\s+ec\s+ON\s+ec\.entry_id\s*=\s*ce\.id\s+AND\s+ec\.category_id\s*=\s*'office-suite'/i,
    );
    expect(normalizedFactSql).toMatch(
      /\bJOIN\s+`?matrix_criteria`?\s+mc\s+ON\s+mc\.category_id\s*=\s*'office-suite'\s+WHERE\b/i,
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
