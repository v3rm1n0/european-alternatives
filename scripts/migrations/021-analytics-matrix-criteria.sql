-- Migration 021: Define Analytics category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('analytics', 'data_collection', 'Data Collection & Tracking', 'Datenerfassung & Tracking', 'Methods and technologies used to collect visitor and usage data.', 'Methoden und Technologien zur Erfassung von Besucher- und Nutzungsdaten.', 100),
  ('analytics', 'privacy_compliance', 'Privacy & Compliance', 'Datenschutz & Compliance', 'Privacy features, data handling practices, and regulatory compliance.', 'Datenschutzfunktionen, Datenverarbeitungspraktiken und regulatorische Compliance.', 200),
  ('analytics', 'data_storage_ownership', 'Data Storage & Ownership', 'Datenspeicherung & Eigentum', 'Data ownership rights, retention policies, and export capabilities.', 'Dateneigentumsrechte, Aufbewahrungsrichtlinien und Exportmöglichkeiten.', 300),
  ('analytics', 'hosting_deployment', 'Hosting & Deployment', 'Hosting & Bereitstellung', 'Hosting models, deployment options, and infrastructure choices.', 'Hosting-Modelle, Bereitstellungsoptionen und Infrastrukturentscheidungen.', 400),
  ('analytics', 'reporting_analysis', 'Reporting & Analysis', 'Berichte & Analyse', 'Reporting capabilities, analysis features, and data visualization options.', 'Berichtsfähigkeiten, Analysefunktionen und Datenvisualisierungsoptionen.', 500),
  ('analytics', 'integration_implementation', 'Integration & Implementation', 'Integration & Implementierung', 'Implementation methods, APIs, plugins, and migration support.', 'Implementierungsmethoden, APIs, Plugins und Migrationsunterstützung.', 600),
  ('analytics', 'scale_pricing', 'Scale & Pricing', 'Skalierung & Preise', 'Pricing models, usage limits, and scaling options.', 'Preismodelle, Nutzungslimits und Skalierungsoptionen.', 700),
  ('analytics', 'features_ux', 'Features & User Experience', 'Funktionen & Nutzererlebnis', 'Advanced features, behavioral analysis tools, and tracking script characteristics.', 'Erweiterte Funktionen, Verhaltensanalyse-Tools und Tracking-Skript-Eigenschaften.', 800),
  ('analytics', 'openness_governance_fit', 'Openness, Governance & Fit', 'Offenheit, Governance & Eignung', 'Source code openness, governance structure, community engagement, and target user fit profiles.', 'Quellcode-Offenheit, Governance-Struktur, Community-Engagement und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'analytics' AS category_id, 'data_collection' AS group_key, 'tracking_method' AS criterion_key, 'Tracking method' AS label_en, 'Tracking-Methode' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Which methods the analytics tool uses to collect visitor data.' AS help_text_en, 'Welche Methoden das Analysetool zur Erfassung von Besucherdaten verwendet.' AS help_text_de
  UNION ALL SELECT 'analytics', 'data_collection', 'cookie_requirement', 'Cookie requirement', 'Cookie-Anforderung', 'enum', 'risk', 'must_match', 1020, 'Whether the analytics tool requires cookies to function.', 'Ob das Analysetool Cookies zum Funktionieren benötigt.'
  UNION ALL SELECT 'analytics', 'data_collection', 'consent_required', 'Consent banner required', 'Einwilligungsbanner erforderlich', 'enum', 'tradeoff', 'must_match', 1030, 'Whether a consent banner is legally required when using this analytics tool.', 'Ob ein Einwilligungsbanner bei Nutzung dieses Analysetools rechtlich erforderlich ist.'
  UNION ALL SELECT 'analytics', 'data_collection', 'cross_domain_tracking', 'Cross-domain tracking', 'Cross-Domain-Tracking', 'boolean', 'informational', 'optional', 1040, 'Whether the tool supports tracking users across multiple domains.', 'Ob das Tool das Tracking von Nutzern über mehrere Domains hinweg unterstützt.'
  UNION ALL SELECT 'analytics', 'data_collection', 'event_tracking', 'Custom event tracking', 'Benutzerdefiniertes Event-Tracking', 'boolean', 'informational', 'optional', 1050, 'Whether custom events beyond page views can be tracked.', 'Ob benutzerdefinierte Ereignisse über Seitenaufrufe hinaus erfasst werden können.'
  UNION ALL SELECT 'analytics', 'privacy_compliance', 'personal_data_collection', 'Personal data collection', 'Erhebung personenbezogener Daten', 'enum', 'risk', 'must_match', 2010, 'The level of personal data collected by the analytics tool.', 'Der Umfang der vom Analysetool erhobenen personenbezogenen Daten.'
  UNION ALL SELECT 'analytics', 'privacy_compliance', 'ip_handling', 'IP address handling', 'IP-Adress-Behandlung', 'enum', 'risk', 'must_match', 2020, 'How the analytics tool handles visitor IP addresses.', 'Wie das Analysetool die IP-Adressen der Besucher behandelt.'
  UNION ALL SELECT 'analytics', 'privacy_compliance', 'data_residency_options', 'Data residency options', 'Optionen für Datenresidenz', 'multi_enum', 'tradeoff', 'multi_select', 2030, 'Geographic regions where analytics data can be stored.', 'Geografische Regionen, in denen Analysedaten gespeichert werden können.'
  UNION ALL SELECT 'analytics', 'privacy_compliance', 'privacy_audit', 'Independent privacy audit', 'Unabhängiges Datenschutz-Audit', 'enum', 'beneficial', 'optional', 2040, 'Whether the analytics tool has undergone independent privacy audits.', 'Ob das Analysetool unabhängige Datenschutz-Audits durchlaufen hat.'
  UNION ALL SELECT 'analytics', 'privacy_compliance', 'data_processor_agreement', 'Data processor agreement (DPA)', 'Auftragsverarbeitungsvertrag (AVV)', 'boolean', 'beneficial', 'optional', 2050, 'Whether a data processor agreement is available for GDPR compliance.', 'Ob ein Auftragsverarbeitungsvertrag für die DSGVO-Compliance verfügbar ist.'
  UNION ALL SELECT 'analytics', 'data_storage_ownership', 'data_ownership_model', 'Data ownership model', 'Dateneigentumsmodell', 'enum', 'tradeoff', 'optional', 3010, 'Who owns the collected analytics data and associated processing rights.', 'Wem die gesammelten Analysedaten und zugehörigen Verarbeitungsrechte gehören.'
  UNION ALL SELECT 'analytics', 'data_storage_ownership', 'data_retention_policy', 'Data retention policy', 'Datenaufbewahrungsrichtlinie', 'enum', 'informational', 'optional', 3020, 'How long the analytics tool retains collected data.', 'Wie lange das Analysetool die gesammelten Daten aufbewahrt.'
  UNION ALL SELECT 'analytics', 'data_storage_ownership', 'raw_data_access', 'Raw data access', 'Rohdatenzugriff', 'enum', 'beneficial', 'optional', 3030, 'Whether raw analytics data can be accessed directly by the customer.', 'Ob Roh-Analysedaten direkt vom Kunden abgerufen werden können.'
  UNION ALL SELECT 'analytics', 'data_storage_ownership', 'data_export_format', 'Data export format', 'Datenexportformat', 'multi_enum', 'informational', 'multi_select', 3040, 'Formats available for exporting analytics data.', 'Verfügbare Formate für den Export von Analysedaten.'
  UNION ALL SELECT 'analytics', 'data_storage_ownership', 'data_deletion_capability', 'Data deletion on request', 'Datenlöschung auf Anfrage', 'boolean', 'beneficial', 'optional', 3050, 'Whether analytics data can be deleted on request.', 'Ob Analysedaten auf Anfrage gelöscht werden können.'
  UNION ALL SELECT 'analytics', 'hosting_deployment', 'hosting_model', 'Hosting model', 'Hosting-Modell', 'enum', 'tradeoff', 'must_match', 4010, 'The hosting options available for the analytics tool.', 'Die verfügbaren Hosting-Optionen für das Analysetool.'
  UNION ALL SELECT 'analytics', 'hosting_deployment', 'self_hosting_available', 'Self-hosting available', 'Self-Hosting verfügbar', 'boolean', 'beneficial', 'must_match', 4020, 'Whether the analytics tool can be self-hosted on private infrastructure.', 'Ob das Analysetool auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'analytics', 'hosting_deployment', 'cloud_regions', 'Cloud hosting regions', 'Cloud-Hosting-Regionen', 'multi_enum', 'informational', 'multi_select', 4030, 'Geographic regions where cloud hosting is available.', 'Geografische Regionen, in denen Cloud-Hosting verfügbar ist.'
  UNION ALL SELECT 'analytics', 'hosting_deployment', 'docker_deployment', 'Docker deployment', 'Docker-Bereitstellung', 'boolean', 'beneficial', 'optional', 4040, 'Whether the analytics tool supports deployment via Docker containers.', 'Ob das Analysetool die Bereitstellung über Docker-Container unterstützt.'
  UNION ALL SELECT 'analytics', 'hosting_deployment', 'managed_updates', 'Managed updates', 'Verwaltete Updates', 'boolean', 'informational', 'optional', 4050, 'Whether the analytics tool provides managed updates and maintenance.', 'Ob das Analysetool verwaltete Updates und Wartung bietet.'
  UNION ALL SELECT 'analytics', 'reporting_analysis', 'real_time_reporting', 'Real-time reporting', 'Echtzeit-Berichte', 'boolean', 'informational', 'optional', 5010, 'Whether the analytics tool provides real-time data reporting.', 'Ob das Analysetool Echtzeit-Datenberichte bereitstellt.'
  UNION ALL SELECT 'analytics', 'reporting_analysis', 'funnel_analysis', 'Funnel analysis', 'Trichteranalyse', 'boolean', 'informational', 'optional', 5020, 'Whether conversion funnel analysis is supported.', 'Ob Conversion-Trichteranalyse unterstützt wird.'
  UNION ALL SELECT 'analytics', 'reporting_analysis', 'segmentation', 'User segmentation', 'Nutzersegmentierung', 'boolean', 'informational', 'optional', 5030, 'Whether visitor data can be segmented by attributes or behavior.', 'Ob Besucherdaten nach Attributen oder Verhalten segmentiert werden können.'
  UNION ALL SELECT 'analytics', 'reporting_analysis', 'custom_dashboards', 'Custom dashboards', 'Benutzerdefinierte Dashboards', 'boolean', 'informational', 'optional', 5040, 'Whether custom dashboards can be created for data visualization.', 'Ob benutzerdefinierte Dashboards zur Datenvisualisierung erstellt werden können.'
  UNION ALL SELECT 'analytics', 'reporting_analysis', 'goal_tracking', 'Goal / conversion tracking', 'Ziel- / Conversion-Tracking', 'boolean', 'informational', 'optional', 5050, 'Whether goal and conversion tracking is supported.', 'Ob Ziel- und Conversion-Tracking unterstützt wird.'
  UNION ALL SELECT 'analytics', 'integration_implementation', 'implementation_method', 'Implementation method', 'Implementierungsmethode', 'multi_enum', 'informational', 'multi_select', 6010, 'Methods available for implementing the analytics tracking code.', 'Verfügbare Methoden zur Implementierung des Analyse-Tracking-Codes.'
  UNION ALL SELECT 'analytics', 'integration_implementation', 'api_available', 'Public API', 'Öffentliche API', 'boolean', 'beneficial', 'optional', 6020, 'Whether a public API is available for programmatic data access.', 'Ob eine öffentliche API für programmatischen Datenzugriff verfügbar ist.'
  UNION ALL SELECT 'analytics', 'integration_implementation', 'cms_plugins', 'CMS plugins available', 'CMS-Plugins verfügbar', 'multi_enum', 'informational', 'multi_select', 6030, 'Content management systems with official plugin support.', 'Content-Management-Systeme mit offizieller Plugin-Unterstützung.'
  UNION ALL SELECT 'analytics', 'integration_implementation', 'tag_manager_support', 'Tag manager support', 'Tag-Manager-Unterstützung', 'boolean', 'informational', 'optional', 6040, 'Whether integration via tag managers is supported.', 'Ob die Integration über Tag-Manager unterstützt wird.'
  UNION ALL SELECT 'analytics', 'integration_implementation', 'import_from_ga', 'Import from Google Analytics', 'Import aus Google Analytics', 'boolean', 'informational', 'optional', 6050, 'Whether historical data can be imported from Google Analytics.', 'Ob historische Daten aus Google Analytics importiert werden können.'
  UNION ALL SELECT 'analytics', 'scale_pricing', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 7010, 'Whether a free tier is available without payment requirements.', 'Ob eine kostenlose Stufe ohne Zahlungsanforderungen verfügbar ist.'
  UNION ALL SELECT 'analytics', 'scale_pricing', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 7020, 'The pricing model used by the analytics tool.', 'Das vom Analysetool verwendete Preismodell.'
  UNION ALL SELECT 'analytics', 'scale_pricing', 'pricing_metric', 'Pricing metric', 'Preismetrik', 'enum', 'tradeoff', 'optional', 7030, 'The primary metric used to calculate pricing.', 'Die primäre Metrik zur Berechnung der Preise.'
  UNION ALL SELECT 'analytics', 'scale_pricing', 'monthly_pageview_limit', 'Monthly pageview limit (free tier)', 'Monatliches Seitenaufruf-Limit (kostenlose Stufe)', 'enum', 'informational', 'optional', 7040, 'The monthly pageview limit included in the free tier.', 'Das monatliche Seitenaufruf-Limit in der kostenlosen Stufe.'
  UNION ALL SELECT 'analytics', 'scale_pricing', 'team_seats', 'Team seats', 'Team-Plätze', 'enum', 'informational', 'optional', 7050, 'The number of team member seats included.', 'Die Anzahl der enthaltenen Team-Mitglieder-Plätze.'
  UNION ALL SELECT 'analytics', 'features_ux', 'heatmaps', 'Heatmaps', 'Heatmaps', 'boolean', 'informational', 'optional', 8010, 'Whether click and scroll heatmaps are available.', 'Ob Klick- und Scroll-Heatmaps verfügbar sind.'
  UNION ALL SELECT 'analytics', 'features_ux', 'session_recordings', 'Session recordings', 'Sitzungsaufzeichnungen', 'boolean', 'tradeoff', 'optional', 8020, 'Whether visitor session recordings are available for behavioral analysis.', 'Ob Besucher-Sitzungsaufzeichnungen zur Verhaltensanalyse verfügbar sind.'
  UNION ALL SELECT 'analytics', 'features_ux', 'ab_testing', 'A/B testing', 'A/B-Tests', 'boolean', 'informational', 'optional', 8030, 'Whether built-in A/B testing functionality is available.', 'Ob integrierte A/B-Test-Funktionalität verfügbar ist.'
  UNION ALL SELECT 'analytics', 'features_ux', 'user_flow_analysis', 'User flow analysis', 'Nutzerflussanalyse', 'boolean', 'informational', 'optional', 8040, 'Whether user flow and navigation path analysis is supported.', 'Ob Nutzerfluss- und Navigationspfad-Analyse unterstützt wird.'
  UNION ALL SELECT 'analytics', 'features_ux', 'lightweight_script', 'Lightweight tracking script', 'Leichtgewichtiges Tracking-Skript', 'enum', 'beneficial', 'optional', 8050, 'The approximate size of the tracking script loaded in the browser.', 'Die ungefähre Größe des im Browser geladenen Tracking-Skripts.'
  UNION ALL SELECT 'analytics', 'openness_governance_fit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The openness model of the analytics tool source code.', 'Das Offenheitsmodell des Analysetool-Quellcodes.'
  UNION ALL SELECT 'analytics', 'openness_governance_fit', 'governance_model', 'Governance model', 'Governance-Modell', 'enum', 'informational', 'optional', 9020, 'The organizational and decision-making structure behind the analytics tool.', 'Die Organisations- und Entscheidungsstruktur hinter dem Analysetool.'
  UNION ALL SELECT 'analytics', 'openness_governance_fit', 'community_size', 'Community size', 'Community-Größe', 'enum', 'informational', 'optional', 9030, 'The size of the open-source community around the analytics tool.', 'Die Größe der Open-Source-Community rund um das Analysetool.'
  UNION ALL SELECT 'analytics', 'openness_governance_fit', 'bug_bounty_program', 'Bug bounty program', 'Bug-Bounty-Programm', 'boolean', 'beneficial', 'optional', 9040, 'Whether the analytics tool operator runs a security vulnerability reward program.', 'Ob der Analysetool-Betreiber ein Sicherheitslücken-Belohnungsprogramm betreibt.'
  UNION ALL SELECT 'analytics', 'openness_governance_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user profiles or use cases the analytics tool is well suited for.', 'Typische Nutzerprofile oder Anwendungsfälle, für die das Analysetool gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'analytics' AS category_id, 'tracking_method' AS criterion_key, 'javascript_snippet' AS option_key, 'JavaScript snippet' AS label_en, 'JavaScript-Snippet' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'analytics', 'tracking_method', 'server_side', 'Server-side', 'Serverseitig', 'neutral', 20
  UNION ALL SELECT 'analytics', 'tracking_method', 'log_based', 'Log-based', 'Logbasiert', 'neutral', 30
  UNION ALL SELECT 'analytics', 'tracking_method', 'pixel', 'Tracking pixel', 'Tracking-Pixel', 'neutral', 40
  UNION ALL SELECT 'analytics', 'tracking_method', 'api_only', 'API only', 'Nur API', 'neutral', 50
  UNION ALL SELECT 'analytics', 'cookie_requirement', 'no_cookies', 'No cookies', 'Keine Cookies', 'positive', 10
  UNION ALL SELECT 'analytics', 'cookie_requirement', 'first_party_only', 'First-party only', 'Nur Erstanbieter', 'neutral', 20
  UNION ALL SELECT 'analytics', 'cookie_requirement', 'third_party_optional', 'Third-party optional', 'Drittanbieter optional', 'tradeoff', 30
  UNION ALL SELECT 'analytics', 'cookie_requirement', 'third_party_required', 'Third-party required', 'Drittanbieter erforderlich', 'warning', 40
  UNION ALL SELECT 'analytics', 'consent_required', 'no_consent_needed', 'No consent needed', 'Keine Einwilligung nötig', 'positive', 10
  UNION ALL SELECT 'analytics', 'consent_required', 'consent_recommended', 'Consent recommended', 'Einwilligung empfohlen', 'neutral', 20
  UNION ALL SELECT 'analytics', 'consent_required', 'consent_required', 'Consent required', 'Einwilligung erforderlich', 'tradeoff', 30
  UNION ALL SELECT 'analytics', 'personal_data_collection', 'no_personal_data', 'No personal data', 'Keine personenbezogenen Daten', 'positive', 10
  UNION ALL SELECT 'analytics', 'personal_data_collection', 'pseudonymized', 'Pseudonymized', 'Pseudonymisiert', 'neutral', 20
  UNION ALL SELECT 'analytics', 'personal_data_collection', 'identifiable_optional', 'Identifiable (optional)', 'Identifizierbar (optional)', 'tradeoff', 30
  UNION ALL SELECT 'analytics', 'personal_data_collection', 'identifiable_default', 'Identifiable (default)', 'Identifizierbar (Standard)', 'warning', 40
  UNION ALL SELECT 'analytics', 'ip_handling', 'not_collected', 'Not collected', 'Nicht erfasst', 'positive', 10
  UNION ALL SELECT 'analytics', 'ip_handling', 'anonymized', 'Anonymized', 'Anonymisiert', 'neutral', 20
  UNION ALL SELECT 'analytics', 'ip_handling', 'hashed', 'Hashed', 'Gehasht', 'tradeoff', 30
  UNION ALL SELECT 'analytics', 'ip_handling', 'stored', 'Stored', 'Gespeichert', 'warning', 40
  UNION ALL SELECT 'analytics', 'data_residency_options', 'eu', 'EU', 'EU', 'neutral', 10
  UNION ALL SELECT 'analytics', 'data_residency_options', 'us', 'US', 'US', 'neutral', 20
  UNION ALL SELECT 'analytics', 'data_residency_options', 'asia_pacific', 'Asia-Pacific', 'Asien-Pazifik', 'neutral', 30
  UNION ALL SELECT 'analytics', 'data_residency_options', 'self_hosted', 'Self-hosted (user-controlled)', 'Self-hosted (nutzerkontrolliert)', 'neutral', 40
  UNION ALL SELECT 'analytics', 'privacy_audit', 'multiple_audits', 'Multiple audits', 'Mehrere Audits', 'positive', 10
  UNION ALL SELECT 'analytics', 'privacy_audit', 'single_audit', 'Single audit', 'Einzelner Audit', 'positive', 20
  UNION ALL SELECT 'analytics', 'privacy_audit', 'audit_planned', 'Audit planned', 'Audit geplant', 'neutral', 30
  UNION ALL SELECT 'analytics', 'privacy_audit', 'no_audit', 'No audit', 'Kein Audit', 'tradeoff', 40
  UNION ALL SELECT 'analytics', 'data_ownership_model', 'full_customer_ownership', 'Full customer ownership', 'Volles Kundeneigentum', 'positive', 10
  UNION ALL SELECT 'analytics', 'data_ownership_model', 'shared_rights', 'Shared processing rights', 'Geteilte Verarbeitungsrechte', 'tradeoff', 20
  UNION ALL SELECT 'analytics', 'data_ownership_model', 'vendor_retains_rights', 'Vendor retains rights', 'Anbieter behält Rechte', 'warning', 30
  UNION ALL SELECT 'analytics', 'data_retention_policy', 'user_configurable', 'User-configurable', 'Nutzerkonfigurierbar', 'positive', 10
  UNION ALL SELECT 'analytics', 'data_retention_policy', 'fixed_short', 'Fixed (under 1 year)', 'Fest (unter 1 Jahr)', 'neutral', 20
  UNION ALL SELECT 'analytics', 'data_retention_policy', 'fixed_long', 'Fixed (1 year or more)', 'Fest (1 Jahr oder mehr)', 'neutral', 30
  UNION ALL SELECT 'analytics', 'data_retention_policy', 'indefinite', 'Indefinite', 'Unbefristet', 'tradeoff', 40
  UNION ALL SELECT 'analytics', 'raw_data_access', 'full_access', 'Full access', 'Voller Zugang', 'positive', 10
  UNION ALL SELECT 'analytics', 'raw_data_access', 'limited_access', 'Limited access', 'Eingeschränkter Zugang', 'neutral', 20
  UNION ALL SELECT 'analytics', 'raw_data_access', 'no_access', 'No access', 'Kein Zugang', 'tradeoff', 30
  UNION ALL SELECT 'analytics', 'data_export_format', 'csv', 'CSV', 'CSV', 'neutral', 10
  UNION ALL SELECT 'analytics', 'data_export_format', 'json', 'JSON', 'JSON', 'neutral', 20
  UNION ALL SELECT 'analytics', 'data_export_format', 'sql_dump', 'SQL dump', 'SQL-Dump', 'neutral', 30
  UNION ALL SELECT 'analytics', 'data_export_format', 'api_export', 'API export', 'API-Export', 'neutral', 40
  UNION ALL SELECT 'analytics', 'hosting_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'analytics', 'hosting_model', 'self_hosted_only', 'Self-hosted only', 'Nur Self-hosted', 'neutral', 20
  UNION ALL SELECT 'analytics', 'hosting_model', 'cloud_and_self_hosted', 'Cloud and self-hosted', 'Cloud und Self-hosted', 'positive', 30
  UNION ALL SELECT 'analytics', 'cloud_regions', 'eu', 'EU', 'EU', 'neutral', 10
  UNION ALL SELECT 'analytics', 'cloud_regions', 'us', 'US', 'US', 'neutral', 20
  UNION ALL SELECT 'analytics', 'cloud_regions', 'asia_pacific', 'Asia-Pacific', 'Asien-Pazifik', 'neutral', 30
  UNION ALL SELECT 'analytics', 'cloud_regions', 'other', 'Other', 'Andere', 'neutral', 40
  UNION ALL SELECT 'analytics', 'implementation_method', 'javascript_tag', 'JavaScript tag', 'JavaScript-Tag', 'neutral', 10
  UNION ALL SELECT 'analytics', 'implementation_method', 'server_sdk', 'Server SDK', 'Server-SDK', 'neutral', 20
  UNION ALL SELECT 'analytics', 'implementation_method', 'mobile_sdk', 'Mobile SDK', 'Mobiles SDK', 'neutral', 30
  UNION ALL SELECT 'analytics', 'implementation_method', 'rest_api', 'REST API', 'REST-API', 'neutral', 40
  UNION ALL SELECT 'analytics', 'implementation_method', 'proxy_mode', 'Proxy mode', 'Proxy-Modus', 'neutral', 50
  UNION ALL SELECT 'analytics', 'cms_plugins', 'wordpress', 'WordPress', 'WordPress', 'neutral', 10
  UNION ALL SELECT 'analytics', 'cms_plugins', 'shopify', 'Shopify', 'Shopify', 'neutral', 20
  UNION ALL SELECT 'analytics', 'cms_plugins', 'webflow', 'Webflow', 'Webflow', 'neutral', 30
  UNION ALL SELECT 'analytics', 'cms_plugins', 'squarespace', 'Squarespace', 'Squarespace', 'neutral', 40
  UNION ALL SELECT 'analytics', 'cms_plugins', 'ghost', 'Ghost', 'Ghost', 'neutral', 50
  UNION ALL SELECT 'analytics', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'analytics', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'analytics', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'analytics', 'pricing_model', 'one_time_license', 'One-time license', 'Einmallizenz', 'neutral', 40
  UNION ALL SELECT 'analytics', 'pricing_model', 'donation_based', 'Donation based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'analytics', 'pricing_metric', 'pageviews', 'Pageviews', 'Seitenaufrufe', 'neutral', 10
  UNION ALL SELECT 'analytics', 'pricing_metric', 'events', 'Events', 'Ereignisse', 'neutral', 20
  UNION ALL SELECT 'analytics', 'pricing_metric', 'sessions', 'Sessions', 'Sitzungen', 'neutral', 30
  UNION ALL SELECT 'analytics', 'pricing_metric', 'flat_rate', 'Flat rate', 'Pauschalpreis', 'neutral', 40
  UNION ALL SELECT 'analytics', 'pricing_metric', 'self_hosted_free', 'Self-hosted (free)', 'Self-hosted (kostenlos)', 'positive', 50
  UNION ALL SELECT 'analytics', 'monthly_pageview_limit', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'analytics', 'monthly_pageview_limit', 'over_100k', 'Over 100k', 'Über 100k', 'neutral', 20
  UNION ALL SELECT 'analytics', 'monthly_pageview_limit', '10k_to_100k', '10k-100k', '10k-100k', 'neutral', 30
  UNION ALL SELECT 'analytics', 'monthly_pageview_limit', 'under_10k', 'Under 10k', 'Unter 10k', 'neutral', 40
  UNION ALL SELECT 'analytics', 'monthly_pageview_limit', 'no_free_tier', 'No free tier', 'Keine kostenlose Stufe', 'tradeoff', 50
  UNION ALL SELECT 'analytics', 'team_seats', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'analytics', 'team_seats', 'generous', 'Generous (10+)', 'Großzügig (10+)', 'neutral', 20
  UNION ALL SELECT 'analytics', 'team_seats', 'limited', 'Limited (under 10)', 'Begrenzt (unter 10)', 'neutral', 30
  UNION ALL SELECT 'analytics', 'team_seats', 'single_user', 'Single user', 'Einzelnutzer', 'tradeoff', 40
  UNION ALL SELECT 'analytics', 'lightweight_script', 'under_5kb', 'Under 5 KB', 'Unter 5 KB', 'positive', 10
  UNION ALL SELECT 'analytics', 'lightweight_script', '5_to_30kb', '5-30 KB', '5-30 KB', 'neutral', 20
  UNION ALL SELECT 'analytics', 'lightweight_script', '30_to_100kb', '30-100 KB', '30-100 KB', 'neutral', 30
  UNION ALL SELECT 'analytics', 'lightweight_script', 'over_100kb', 'Over 100 KB', 'Über 100 KB', 'tradeoff', 40
  UNION ALL SELECT 'analytics', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'analytics', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'analytics', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'analytics', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'analytics', 'governance_model', 'community_driven', 'Community driven', 'Community-getrieben', 'positive', 10
  UNION ALL SELECT 'analytics', 'governance_model', 'foundation_backed', 'Foundation backed', 'Stiftungsunterstützt', 'positive', 20
  UNION ALL SELECT 'analytics', 'governance_model', 'nonprofit', 'Nonprofit', 'Gemeinnützig', 'positive', 30
  UNION ALL SELECT 'analytics', 'governance_model', 'corporate_independent', 'Corporate independent', 'Unabhängiges Unternehmen', 'neutral', 40
  UNION ALL SELECT 'analytics', 'governance_model', 'corporate_conglomerate', 'Corporate conglomerate', 'Unternehmenskonglomerat', 'tradeoff', 50
  UNION ALL SELECT 'analytics', 'community_size', 'large', 'Large (10k+ stars)', 'Groß (10k+ Sterne)', 'neutral', 10
  UNION ALL SELECT 'analytics', 'community_size', 'medium', 'Medium (1k-10k stars)', 'Mittel (1k-10k Sterne)', 'neutral', 20
  UNION ALL SELECT 'analytics', 'community_size', 'small', 'Small (under 1k stars)', 'Klein (unter 1k Sterne)', 'neutral', 30
  UNION ALL SELECT 'analytics', 'community_size', 'closed', 'Closed source', 'Geschlossener Quellcode', 'neutral', 40
  UNION ALL SELECT 'analytics', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'neutral', 10
  UNION ALL SELECT 'analytics', 'fit_profiles', 'simple_analytics', 'Simple analytics', 'Einfache Analyse', 'neutral', 20
  UNION ALL SELECT 'analytics', 'fit_profiles', 'advanced_analytics', 'Advanced analytics', 'Erweiterte Analyse', 'neutral', 30
  UNION ALL SELECT 'analytics', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 40
  UNION ALL SELECT 'analytics', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 50
  UNION ALL SELECT 'analytics', 'fit_profiles', 'marketing', 'Marketing', 'Marketing', 'neutral', 60
  UNION ALL SELECT 'analytics', 'fit_profiles', 'ecommerce', 'E-commerce', 'E-Commerce', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'analytics'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'analytics'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('021-analytics-matrix-criteria');
