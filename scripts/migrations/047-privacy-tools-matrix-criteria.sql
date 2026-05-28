-- Migration 047: Define Privacy Tools category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('privacy-tools', 'protection_scope', 'Protection Scope & Methods', 'Schutzumfang & Methoden', 'Types of threats and tracking techniques the tool protects against, including ad blocking, malware defense, and fingerprint resistance.', 'Arten von Bedrohungen und Tracking-Techniken, gegen die das Werkzeug schützt, einschließlich Werbeblockierung, Malware-Abwehr und Fingerabdruck-Resistenz.', 100),
  ('privacy-tools', 'network_security', 'Network & Traffic Security', 'Netzwerk- & Verkehrssicherheit', 'Network-level privacy capabilities such as DNS encryption, firewall rule granularity, and traffic analysis prevention.', 'Datenschutzfähigkeiten auf Netzwerkebene wie DNS-Verschlüsselung, Firewall-Regelgranularität und Verhinderung von Verkehrsanalyse.', 200),
  ('privacy-tools', 'filter_rules', 'Filter Lists & Rule Engines', 'Filterlisten & Regel-Engines', 'How blocking rules are defined, maintained, and customized including built-in filter lists, custom rules, and update mechanisms.', 'Wie Blockierungsregeln definiert, gepflegt und angepasst werden, einschließlich integrierter Filterlisten, benutzerdefinierter Regeln und Aktualisierungsmechanismen.', 300),
  ('privacy-tools', 'privacy_data_handling', 'Privacy & Data Handling', 'Datenschutz & Datenverarbeitung', 'What data the tool itself collects and how it handles user information, including telemetry, retention, and third-party sharing policies.', 'Welche Daten das Werkzeug selbst erhebt und wie es Benutzerinformationen handhabt, einschließlich Telemetrie-, Aufbewahrungs- und Drittanbieter-Weitergaberichtlinien.', 400),
  ('privacy-tools', 'platform_integration', 'Platform & Integration', 'Plattform & Integration', 'Where and how the tool operates across different platforms, browsers, routers, and mobile devices.', 'Wo und wie das Werkzeug auf verschiedenen Plattformen, Browsern, Routern und mobilen Geräten arbeitet.', 500),
  ('privacy-tools', 'configuration_usability', 'Configuration & Usability', 'Konfiguration & Benutzerfreundlichkeit', 'Setup complexity, dashboard capabilities, parental controls, and ease of daily use for various user skill levels.', 'Einrichtungskomplexität, Dashboard-Fähigkeiten, Kindersicherungen und Benutzerfreundlichkeit im Alltag für verschiedene Kenntnisstufen.', 600),
  ('privacy-tools', 'architecture_control', 'Architecture & Control', 'Architektur & Kontrolle', 'Underlying processing architecture including cloud vs. local operation, self-hosting options, and update mechanisms.', 'Zugrunde liegende Verarbeitungsarchitektur einschließlich Cloud- vs. lokaler Verarbeitung, Selbst-Hosting-Optionen und Aktualisierungsmechanismen.', 700),
  ('privacy-tools', 'openness_governance', 'Openness & Governance', 'Offenheit & Governance', 'Source code availability, licensing model, independent security audits, and community contribution governance.', 'Quellcode-Verfügbarkeit, Lizenzmodell, unabhängige Sicherheitsprüfungen und Governance der Gemeinschaftsbeteiligung.', 800),
  ('privacy-tools', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Cost structure, account requirements, data processing location, and target user profiles for privacy-conscious audiences.', 'Kostenstruktur, Kontoanforderungen, Datenverarbeitungsstandort und Zielbenutzerprofile für datenschutzbewusste Zielgruppen.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'privacy-tools' AS category_id, 'protection_scope' AS group_key, 'protection_type' AS criterion_key, 'Protection type' AS label_en, 'Schutztyp' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'The categories of threats this tool addresses, such as tracker blocking, ad blocking, malware defense, or firewall capabilities.' AS help_text_en, 'Die Kategorien von Bedrohungen, die dieses Werkzeug adressiert, wie Tracker-Blockierung, Werbeblockierung, Malware-Abwehr oder Firewall-Fähigkeiten.' AS help_text_de
  UNION ALL SELECT 'privacy-tools', 'protection_scope', 'tracker_blocking_method', 'Tracker blocking method', 'Tracker-Blockierungsmethode', 'enum', 'informational', 'optional', 1020, 'The primary technical approach used to identify and block tracking requests, from DNS sinkholes to heuristic detection.', 'Der primäre technische Ansatz zur Identifizierung und Blockierung von Tracking-Anfragen, von DNS-Sinkhole bis heuristischer Erkennung.'
  UNION ALL SELECT 'privacy-tools', 'protection_scope', 'ad_blocking_included', 'Ad blocking included', 'Werbeblockierung enthalten', 'boolean', 'informational', 'optional', 1030, 'Whether the tool includes built-in advertisement blocking as part of its privacy protection features.', 'Ob das Werkzeug eine integrierte Werbeblockierung als Teil seiner Datenschutzfunktionen enthält.'
  UNION ALL SELECT 'privacy-tools', 'protection_scope', 'malware_protection', 'Malware/phishing protection', 'Malware-/Phishing-Schutz', 'boolean', 'beneficial', 'optional', 1040, 'Whether the tool actively blocks known malware distribution sites and phishing attempts to protect users from threats.', 'Ob das Werkzeug bekannte Malware-Verbreitungsseiten und Phishing-Versuche aktiv blockiert, um Benutzer vor Bedrohungen zu schützen.'
  UNION ALL SELECT 'privacy-tools', 'protection_scope', 'fingerprint_resistance', 'Fingerprint resistance', 'Fingerabdruck-Resistenz', 'boolean', 'beneficial', 'optional', 1050, 'Whether the tool reduces browser or device fingerprinting by masking or normalizing identifiable attributes.', 'Ob das Werkzeug Browser- oder Geräte-Fingerprinting durch Maskierung oder Normalisierung identifizierbarer Attribute reduziert.'
  UNION ALL SELECT 'privacy-tools', 'protection_scope', 'cookie_management', 'Cookie management', 'Cookie-Verwaltung', 'enum', 'informational', 'optional', 1060, 'How the tool handles browser cookies, from automatic deletion of third-party cookies to full cookie isolation.', 'Wie das Werkzeug Browser-Cookies behandelt, von automatischer Löschung von Drittanbieter-Cookies bis zur vollständigen Cookie-Isolation.'
  UNION ALL SELECT 'privacy-tools', 'network_security', 'dns_encryption', 'DNS encryption support', 'DNS-Verschlüsselungsunterstützung', 'multi_enum', 'beneficial', 'multi_select', 2010, 'The DNS encryption protocols supported to prevent DNS query interception and surveillance by network observers.', 'Die unterstützten DNS-Verschlüsselungsprotokolle zur Verhinderung von DNS-Abfrage-Abfangen und Überwachung durch Netzwerkbeobachter.'
  UNION ALL SELECT 'privacy-tools', 'network_security', 'firewall_granularity', 'Firewall rule granularity', 'Firewall-Regelgranularität', 'enum', 'informational', 'optional', 2020, 'The level of detail at which firewall rules can be defined, from broad application-level to fine-grained packet-level control.', 'Der Detaillierungsgrad, auf dem Firewall-Regeln definiert werden können, von breiter Anwendungsebene bis feingranularer Paketebenen-Kontrolle.'
  UNION ALL SELECT 'privacy-tools', 'network_security', 'traffic_inspection_model', 'Network traffic inspection', 'Netzwerkverkehr-Inspektion', 'enum', 'informational', 'optional', 2030, 'The depth of network traffic analysis the tool performs to identify and filter unwanted connections.', 'Die Tiefe der Netzwerkverkehrsanalyse, die das Werkzeug durchführt, um unerwünschte Verbindungen zu identifizieren und zu filtern.'
  UNION ALL SELECT 'privacy-tools', 'network_security', 'ip_leak_prevention', 'IP leak prevention', 'IP-Leck-Verhinderung', 'boolean', 'beneficial', 'optional', 2040, 'Whether the tool includes mechanisms to prevent accidental IP address leaks through WebRTC, DNS, or other side channels.', 'Ob das Werkzeug Mechanismen zur Verhinderung versehentlicher IP-Adress-Lecks durch WebRTC, DNS oder andere Seitenkanäle enthält.'
  UNION ALL SELECT 'privacy-tools', 'network_security', 'per_app_rules', 'Per-app/per-domain rules', 'Pro-App-/Pro-Domain-Regeln', 'boolean', 'beneficial', 'optional', 2050, 'Whether blocking and filtering rules can be configured individually for specific applications or domains.', 'Ob Blockierungs- und Filterregeln individuell für bestimmte Anwendungen oder Domains konfiguriert werden können.'
  UNION ALL SELECT 'privacy-tools', 'filter_rules', 'builtin_filter_lists', 'Built-in filter lists', 'Integrierte Filterlisten', 'multi_enum', 'informational', 'multi_select', 3010, 'The pre-installed filter list subscriptions available out of the box for blocking trackers, ads, and malware domains.', 'Die vorinstallierten Filterlisten-Abonnements, die direkt verfügbar sind, um Tracker, Werbung und Malware-Domains zu blockieren.'
  UNION ALL SELECT 'privacy-tools', 'filter_rules', 'custom_rule_support', 'Custom rule support', 'Benutzerdefinierte Regelunterstützung', 'boolean', 'beneficial', 'optional', 3020, 'Whether users can create their own blocking rules beyond the provided filter lists for tailored privacy protection.', 'Ob Benutzer eigene Blockierungsregeln über die bereitgestellten Filterlisten hinaus für maßgeschneiderten Datenschutz erstellen können.'
  UNION ALL SELECT 'privacy-tools', 'filter_rules', 'rule_syntax_compat', 'Rule syntax compatibility', 'Regelsyntax-Kompatibilität', 'multi_enum', 'informational', 'multi_select', 3030, 'Which filter rule syntax formats the tool understands, enabling reuse of community-maintained filter lists.', 'Welche Filterregel-Syntaxformate das Werkzeug versteht, um die Wiederverwendung von gemeinschaftlich gepflegten Filterlisten zu ermöglichen.'
  UNION ALL SELECT 'privacy-tools', 'filter_rules', 'filter_list_auto_update', 'Filter list auto-update', 'Filterlisten-Autoaktualisierung', 'boolean', 'beneficial', 'optional', 3040, 'Whether subscribed filter lists are automatically updated to include newly discovered trackers and threats.', 'Ob abonnierte Filterlisten automatisch aktualisiert werden, um neu entdeckte Tracker und Bedrohungen einzuschließen.'
  UNION ALL SELECT 'privacy-tools', 'filter_rules', 'allowlist_management', 'Allowlist/exception management', 'Freigabelisten-/Ausnahmeverwaltung', 'boolean', 'informational', 'optional', 3050, 'Whether the tool provides an interface for managing allowed sites or exceptions when blocking causes compatibility issues.', 'Ob das Werkzeug eine Oberfläche zur Verwaltung von erlaubten Seiten oder Ausnahmen bietet, wenn Blockierung Kompatibilitätsprobleme verursacht.'
  UNION ALL SELECT 'privacy-tools', 'privacy_data_handling', 'local_only_operation', 'Local-only operation', 'Nur-lokaler Betrieb', 'boolean', 'beneficial', 'must_match', 4010, 'Whether the tool processes all data locally on the device without sending queries or telemetry to external servers.', 'Ob das Werkzeug alle Daten lokal auf dem Gerät verarbeitet, ohne Abfragen oder Telemetrie an externe Server zu senden.'
  UNION ALL SELECT 'privacy-tools', 'privacy_data_handling', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 4020, 'How the tool collects and transmits usage analytics data to its developers, from no collection to mandatory reporting.', 'Wie das Werkzeug Nutzungsanalysedaten an seine Entwickler erhebt und überträgt, von keiner Erhebung bis zur Pflichtberichterstattung.'
  UNION ALL SELECT 'privacy-tools', 'privacy_data_handling', 'crash_reporting_model', 'Crash/diagnostic reporting', 'Absturz-/Diagnoseberichterstattung', 'enum', 'informational', 'optional', 4030, 'How the tool handles crash and diagnostic data collection, and whether users can control this behavior.', 'Wie das Werkzeug die Erfassung von Absturz- und Diagnosedaten handhabt und ob Benutzer dieses Verhalten steuern können.'
  UNION ALL SELECT 'privacy-tools', 'privacy_data_handling', 'data_retention_policy', 'Data retention policy', 'Datenaufbewahrungsrichtlinie', 'enum', 'risk', 'optional', 4040, 'How long the tool retains user data such as browsing history, blocked request logs, or DNS query records.', 'Wie lange das Werkzeug Benutzerdaten wie Browserverlauf, blockierte Anfrage-Protokolle oder DNS-Abfrageaufzeichnungen aufbewahrt.'
  UNION ALL SELECT 'privacy-tools', 'privacy_data_handling', 'third_party_data_sharing', 'Third-party data sharing', 'Drittanbieter-Datenweitergabe', 'boolean', 'risk', 'must_match', 4050, 'Whether the tool shares any collected user data with third-party companies for analytics, advertising, or other purposes.', 'Ob das Werkzeug gesammelte Benutzerdaten mit Drittunternehmen für Analysen, Werbung oder andere Zwecke teilt.'
  UNION ALL SELECT 'privacy-tools', 'platform_integration', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'The operating systems and device types on which the privacy tool can be installed and used.', 'Die Betriebssysteme und Gerätetypen, auf denen das Datenschutz-Werkzeug installiert und genutzt werden kann.'
  UNION ALL SELECT 'privacy-tools', 'platform_integration', 'integration_level', 'Integration level', 'Integrationsebene', 'enum', 'informational', 'must_match', 5020, 'At which system level the tool operates, from browser extension to system-wide or network-level integration.', 'Auf welcher Systemebene das Werkzeug arbeitet, von Browser-Erweiterung bis systemweiter oder Netzwerkebenen-Integration.'
  UNION ALL SELECT 'privacy-tools', 'platform_integration', 'browser_extensions', 'Browser extensions available', 'Verfügbare Browser-Erweiterungen', 'multi_enum', 'informational', 'multi_select', 5030, 'Which web browsers are supported through dedicated extension or add-on versions of the privacy tool.', 'Welche Webbrowser durch dedizierte Erweiterungs- oder Add-on-Versionen des Datenschutz-Werkzeugs unterstützt werden.'
  UNION ALL SELECT 'privacy-tools', 'platform_integration', 'router_deployment', 'Router/network-level deployment', 'Router-/Netzwerkebenen-Einsatz', 'boolean', 'informational', 'optional', 5040, 'Whether the tool can be deployed on a router or network appliance to protect all connected devices simultaneously.', 'Ob das Werkzeug auf einem Router oder Netzwerkgerät eingesetzt werden kann, um alle verbundenen Geräte gleichzeitig zu schützen.'
  UNION ALL SELECT 'privacy-tools', 'platform_integration', 'mobile_platform_support', 'Mobile platform support', 'Mobilplattform-Unterstützung', 'multi_enum', 'informational', 'multi_select', 5050, 'The mobile operating systems and platform-specific integration methods available for the privacy tool.', 'Die mobilen Betriebssysteme und plattformspezifischen Integrationsmethoden, die für das Datenschutz-Werkzeug verfügbar sind.'
  UNION ALL SELECT 'privacy-tools', 'configuration_usability', 'setup_complexity', 'Setup complexity', 'Einrichtungskomplexität', 'enum', 'tradeoff', 'optional', 6010, 'The level of technical knowledge and effort required to install and configure the tool for effective use.', 'Das Niveau an technischem Wissen und Aufwand, das für die Installation und Konfiguration des Werkzeugs für effektive Nutzung erforderlich ist.'
  UNION ALL SELECT 'privacy-tools', 'configuration_usability', 'dashboard_ui', 'Dashboard/reporting UI', 'Dashboard-/Berichtsoberfläche', 'boolean', 'informational', 'optional', 6020, 'Whether the tool provides a visual dashboard for monitoring blocking statistics, traffic patterns, and protection status.', 'Ob das Werkzeug ein visuelles Dashboard zur Überwachung von Blockierungsstatistiken, Verkehrsmustern und Schutzstatus bereitstellt.'
  UNION ALL SELECT 'privacy-tools', 'configuration_usability', 'parental_controls', 'Parental/family controls', 'Kindersicherung/Familienkontrollen', 'boolean', 'informational', 'optional', 6030, 'Whether the tool includes features for managing content filtering and access controls for family members or children.', 'Ob das Werkzeug Funktionen zur Verwaltung von Inhaltsfilterung und Zugangskontrollen für Familienmitglieder oder Kinder enthält.'
  UNION ALL SELECT 'privacy-tools', 'configuration_usability', 'scheduled_rules', 'Scheduled rules', 'Geplante Regeln', 'boolean', 'informational', 'optional', 6040, 'Whether blocking and filtering rules can be scheduled to activate or deactivate at specific times of day.', 'Ob Blockierungs- und Filterregeln geplant werden können, um zu bestimmten Tageszeiten aktiviert oder deaktiviert zu werden.'
  UNION ALL SELECT 'privacy-tools', 'configuration_usability', 'notifications_alerts', 'Notifications/alerts', 'Benachrichtigungen/Warnungen', 'boolean', 'informational', 'optional', 6050, 'Whether the tool sends notifications or alerts about blocked threats, filter list updates, or security events.', 'Ob das Werkzeug Benachrichtigungen oder Warnungen über blockierte Bedrohungen, Filterlistenaktualisierungen oder Sicherheitsereignisse sendet.'
  UNION ALL SELECT 'privacy-tools', 'architecture_control', 'processing_architecture', 'Processing architecture', 'Verarbeitungsarchitektur', 'enum', 'tradeoff', 'must_match', 7010, 'Whether blocking and filtering is performed locally on the device, in the cloud, or through a self-hosted server.', 'Ob Blockierung und Filterung lokal auf dem Gerät, in der Cloud oder über einen selbst gehosteten Server durchgeführt werden.'
  UNION ALL SELECT 'privacy-tools', 'architecture_control', 'self_hosting_available', 'Self-hosting available', 'Selbst-Hosting verfügbar', 'boolean', 'beneficial', 'must_match', 7020, 'Whether the tool can be installed and operated on self-managed infrastructure for full data sovereignty.', 'Ob das Werkzeug auf eigener Infrastruktur installiert und betrieben werden kann für vollständige Datensouveränität.'
  UNION ALL SELECT 'privacy-tools', 'architecture_control', 'update_mechanism', 'Update mechanism', 'Aktualisierungsmechanismus', 'enum', 'informational', 'optional', 7030, 'How the tool receives software updates, from automatic background updates to manual package manager installations.', 'Wie das Werkzeug Software-Updates erhält, von automatischen Hintergrundaktualisierungen bis manuellen Paketmanager-Installationen.'
  UNION ALL SELECT 'privacy-tools', 'architecture_control', 'api_automation_support', 'API/automation support', 'API-/Automatisierungsunterstützung', 'boolean', 'beneficial', 'optional', 7040, 'Whether the tool provides a programmable API or automation interface for scripted configuration and monitoring.', 'Ob das Werkzeug eine programmierbare API oder Automatisierungsschnittstelle für skriptgesteuerte Konfiguration und Überwachung bereitstellt.'
  UNION ALL SELECT 'privacy-tools', 'architecture_control', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 7050, 'Whether blocking logs, configuration, and statistics can be exported for backup or analysis in external tools.', 'Ob Blockierungsprotokolle, Konfiguration und Statistiken zur Sicherung oder Analyse in externen Werkzeugen exportiert werden können.'
  UNION ALL SELECT 'privacy-tools', 'openness_governance', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The availability and openness of the privacy tool source code for independent inspection and community contribution.', 'Die Verfügbarkeit und Offenheit des Datenschutz-Werkzeug-Quellcodes für unabhängige Einsicht und Gemeinschaftsbeteiligung.'
  UNION ALL SELECT 'privacy-tools', 'openness_governance', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 8020, 'The software license governing redistribution and use of the privacy tool, from copyleft to permissive to proprietary.', 'Die Softwarelizenz, die Weiterverbreitung und Nutzung des Datenschutz-Werkzeugs regelt, von Copyleft über permissiv bis proprietär.'
  UNION ALL SELECT 'privacy-tools', 'openness_governance', 'security_audit', 'Independent security audit', 'Unabhängige Sicherheitsprüfung', 'boolean', 'beneficial', 'optional', 8030, 'Whether the tool has undergone an independent third-party security audit with publicly available results.', 'Ob das Werkzeug einer unabhängigen Sicherheitsprüfung durch Dritte mit öffentlich verfügbaren Ergebnissen unterzogen wurde.'
  UNION ALL SELECT 'privacy-tools', 'openness_governance', 'bug_bounty_program', 'Bug bounty program', 'Bug-Bounty-Programm', 'boolean', 'informational', 'optional', 8040, 'Whether the developer operates a bug bounty program rewarding security researchers for discovering vulnerabilities.', 'Ob der Entwickler ein Bug-Bounty-Programm betreibt, das Sicherheitsforscher für die Entdeckung von Schwachstellen belohnt.'
  UNION ALL SELECT 'privacy-tools', 'openness_governance', 'community_model', 'Community contribution model', 'Gemeinschaftsbeitragsmodell', 'enum', 'informational', 'optional', 8050, 'How external developers and users can contribute to the privacy tool development through code, translations, or filter lists.', 'Wie externe Entwickler und Benutzer zur Entwicklung des Datenschutz-Werkzeugs durch Code, Übersetzungen oder Filterlisten beitragen können.'
  UNION ALL SELECT 'privacy-tools', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'The pricing structure for obtaining and using the privacy tool, such as free, freemium, subscription, or donation-based.', 'Die Preisstruktur für den Erwerb und die Nutzung des Datenschutz-Werkzeugs, wie kostenlos, Freemium, Abonnement oder spendenbasiert.'
  UNION ALL SELECT 'privacy-tools', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfügbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a functional free version of the privacy tool is available without payment or time-limited trial restrictions.', 'Ob eine funktionsfähige kostenlose Version des Datenschutz-Werkzeugs ohne Zahlungs- oder zeitlich begrenzte Testbeschränkungen verfügbar ist.'
  UNION ALL SELECT 'privacy-tools', 'pricing_fit', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 9030, 'Whether creating a user account is mandatory before the privacy tool can be downloaded or used.', 'Ob das Erstellen eines Benutzerkontos erforderlich ist, bevor das Datenschutz-Werkzeug heruntergeladen oder verwendet werden kann.'
  UNION ALL SELECT 'privacy-tools', 'pricing_fit', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 9040, 'The geographic region where any cloud-processed data is stored and handled, relevant for data sovereignty compliance.', 'Die geografische Region, in der cloudverarbeitete Daten gespeichert und gehandhabt werden, relevant für die Einhaltung der Datensouveränität.'
  UNION ALL SELECT 'privacy-tools', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Target user roles and use cases the privacy tool is best suited for based on its features and complexity.', 'Zielbenutzerrollen und Anwendungsfälle, für die das Datenschutz-Werkzeug basierend auf seinen Funktionen und seiner Komplexität am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'privacy-tools' AS category_id, 'protection_type' AS criterion_key, 'tracker_blocking' AS option_key, 'Tracker blocking' AS label_en, 'Tracker-Blockierung' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'privacy-tools', 'protection_type', 'ad_blocking', 'Ad blocking', 'Werbeblockierung', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'protection_type', 'malware_blocking', 'Malware blocking', 'Malware-Blockierung', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'protection_type', 'fingerprint_protection', 'Fingerprint protection', 'Fingerabdruck-Schutz', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'protection_type', 'cookie_control', 'Cookie control', 'Cookie-Kontrolle', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'protection_type', 'dns_filtering', 'DNS filtering', 'DNS-Filterung', 'neutral', 60
  UNION ALL SELECT 'privacy-tools', 'protection_type', 'firewall', 'Firewall', 'Firewall', 'neutral', 70
  UNION ALL SELECT 'privacy-tools', 'protection_type', 'script_blocking', 'Script blocking', 'Skript-Blockierung', 'neutral', 80
  UNION ALL SELECT 'privacy-tools', 'tracker_blocking_method', 'dns_sinkhole', 'DNS sinkhole', 'DNS-Sinkhole', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'tracker_blocking_method', 'request_interception', 'Request interception', 'Anfrage-Abfangen', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'tracker_blocking_method', 'cosmetic_filtering', 'Cosmetic filtering', 'Kosmetische Filterung', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'tracker_blocking_method', 'heuristic_detection', 'Heuristic detection', 'Heuristische Erkennung', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'tracker_blocking_method', 'list_based', 'List-based', 'Listenbasiert', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'cookie_management', 'auto_delete', 'Auto-delete', 'Automatisches Löschen', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'cookie_management', 'block_third_party', 'Block third-party', 'Drittanbieter blockieren', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'cookie_management', 'block_all', 'Block all', 'Alle blockieren', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'cookie_management', 'manual_control', 'Manual control', 'Manuelle Kontrolle', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'cookie_management', 'cookie_isolation', 'Cookie isolation', 'Cookie-Isolation', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'dns_encryption', 'dns_over_https', 'DNS over HTTPS', 'DNS über HTTPS', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'dns_encryption', 'dns_over_tls', 'DNS over TLS', 'DNS über TLS', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'dns_encryption', 'dnscrypt', 'DNSCrypt', 'DNSCrypt', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'dns_encryption', 'oblivious_doh', 'Oblivious DoH', 'Oblivious DoH', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'firewall_granularity', 'application_level', 'Application level', 'Anwendungsebene', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'firewall_granularity', 'port_level', 'Port level', 'Port-Ebene', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'firewall_granularity', 'packet_level', 'Packet level', 'Paketebene', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'firewall_granularity', 'domain_level', 'Domain level', 'Domain-Ebene', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'traffic_inspection_model', 'deep_packet', 'Deep packet inspection', 'Tiefe Paketinspektion', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'traffic_inspection_model', 'header_only', 'Header-only inspection', 'Nur-Header-Inspektion', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'traffic_inspection_model', 'dns_only', 'DNS-only inspection', 'Nur-DNS-Inspektion', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'traffic_inspection_model', 'no_inspection', 'No inspection', 'Keine Inspektion', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'easylist', 'EasyList', 'EasyList', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'easyprivacy', 'EasyPrivacy', 'EasyPrivacy', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'fanboy_annoyance', 'Fanboy Annoyance List', 'Fanboy-Störungsliste', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'peter_lowe', 'Peter Lowe list', 'Peter-Lowe-Liste', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'adguard_base', 'AdGuard Base', 'AdGuard-Basis', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'adguard_tracking', 'AdGuard Tracking Protection', 'AdGuard-Tracking-Schutz', 'neutral', 60
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'disconnect', 'Disconnect', 'Disconnect', 'neutral', 70
  UNION ALL SELECT 'privacy-tools', 'builtin_filter_lists', 'malware_domains', 'Malware Domains', 'Malware-Domains', 'neutral', 80
  UNION ALL SELECT 'privacy-tools', 'rule_syntax_compat', 'adblock_plus', 'Adblock Plus syntax', 'Adblock-Plus-Syntax', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'rule_syntax_compat', 'ublock_origin', 'uBlock Origin syntax', 'uBlock-Origin-Syntax', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'rule_syntax_compat', 'hosts_file', 'Hosts file format', 'Hosts-Dateiformat', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'rule_syntax_compat', 'regex', 'Regular expressions', 'Reguläre Ausdrücke', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'rule_syntax_compat', 'adguard', 'AdGuard syntax', 'AdGuard-Syntax', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'privacy-tools', 'crash_reporting_model', 'no_reporting', 'No reporting', 'Keine Berichterstattung', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'crash_reporting_model', 'opt_in_reporting', 'Opt-in reporting', 'Opt-in-Berichterstattung', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'crash_reporting_model', 'opt_out_reporting', 'Opt-out reporting', 'Opt-out-Berichterstattung', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'crash_reporting_model', 'mandatory_reporting', 'Mandatory reporting', 'Pflichtberichterstattung', 'warning', 40
  UNION ALL SELECT 'privacy-tools', 'data_retention_policy', 'no_retention', 'No retention', 'Keine Aufbewahrung', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'data_retention_policy', 'session_only', 'Session only', 'Nur Sitzungsdauer', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'data_retention_policy', 'limited_retention', 'Limited retention', 'Begrenzte Aufbewahrung', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'data_retention_policy', 'indefinite', 'Indefinite', 'Unbegrenzt', 'warning', 40
  UNION ALL SELECT 'privacy-tools', 'data_retention_policy', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'supported_platforms', 'browser_extension', 'Browser extension', 'Browser-Erweiterung', 'neutral', 60
  UNION ALL SELECT 'privacy-tools', 'supported_platforms', 'router', 'Router', 'Router', 'neutral', 70
  UNION ALL SELECT 'privacy-tools', 'integration_level', 'browser_extension', 'Browser extension', 'Browser-Erweiterung', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'integration_level', 'system_wide', 'System-wide', 'Systemweit', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'integration_level', 'network_level', 'Network level', 'Netzwerkebene', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'integration_level', 'application_level', 'Application level', 'Anwendungsebene', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'browser_extensions', 'chrome', 'Chrome', 'Chrome', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'browser_extensions', 'firefox', 'Firefox', 'Firefox', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'browser_extensions', 'safari', 'Safari', 'Safari', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'browser_extensions', 'edge', 'Edge', 'Edge', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'browser_extensions', 'opera', 'Opera', 'Opera', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'browser_extensions', 'brave', 'Brave', 'Brave', 'neutral', 60
  UNION ALL SELECT 'privacy-tools', 'mobile_platform_support', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'mobile_platform_support', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'mobile_platform_support', 'android_private_dns', 'Android Private DNS', 'Android Private DNS', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'mobile_platform_support', 'ios_content_blocker', 'iOS Content Blocker', 'iOS-Inhaltsblocker', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'setup_complexity', 'plug_and_play', 'Plug and play', 'Sofort einsatzbereit', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'setup_complexity', 'basic_configuration', 'Basic configuration', 'Grundkonfiguration', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'setup_complexity', 'moderate_setup', 'Moderate setup', 'Mittlere Einrichtung', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'setup_complexity', 'advanced_setup', 'Advanced setup', 'Erweiterte Einrichtung', 'tradeoff', 40
  UNION ALL SELECT 'privacy-tools', 'processing_architecture', 'local_only', 'Local only', 'Nur lokal', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'processing_architecture', 'cloud_based', 'Cloud-based', 'Cloudbasiert', 'tradeoff', 20
  UNION ALL SELECT 'privacy-tools', 'processing_architecture', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'processing_architecture', 'self_hosted_server', 'Self-hosted server', 'Selbst gehosteter Server', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'update_mechanism', 'auto_update', 'Auto-update', 'Automatische Aktualisierung', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'update_mechanism', 'manual_update', 'Manual update', 'Manuelle Aktualisierung', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'update_mechanism', 'package_manager', 'Package manager', 'Paketmanager', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'update_mechanism', 'rolling_release', 'Rolling release', 'Rolling Release', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'source_model', 'fully_open_source', 'Fully open source', 'Vollständig quelloffen', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'privacy-tools', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'license_type', 'mpl', 'MPL', 'MPL', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'neutral', 60
  UNION ALL SELECT 'privacy-tools', 'community_model', 'open_contributions', 'Open contributions', 'Offene Beiträge', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'community_model', 'managed_contributions', 'Managed contributions', 'Verwaltete Beiträge', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'community_model', 'enterprise_only', 'Enterprise only', 'Nur Unternehmen', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'community_model', 'no_contributions', 'No contributions', 'Keine Beiträge', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'pricing_model', 'donation_based', 'Donation-based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'privacy-tools', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primär', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'privacy-tools', 'data_processing_location', 'local_device', 'Local device', 'Lokales Gerät', 'positive', 40
  UNION ALL SELECT 'privacy-tools', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'privacy-tools', 'fit_profiles', 'privacy_enthusiast', 'Privacy enthusiast', 'Datenschutz-Enthusiast', 'neutral', 10
  UNION ALL SELECT 'privacy-tools', 'fit_profiles', 'family_household', 'Family/household', 'Familie/Haushalt', 'neutral', 20
  UNION ALL SELECT 'privacy-tools', 'fit_profiles', 'enterprise_network', 'Enterprise network', 'Unternehmensnetzwerk', 'neutral', 30
  UNION ALL SELECT 'privacy-tools', 'fit_profiles', 'developer_technical', 'Developer/technical', 'Entwickler/Technisch', 'neutral', 40
  UNION ALL SELECT 'privacy-tools', 'fit_profiles', 'casual_user', 'Casual user', 'Gelegenheitsnutzer', 'neutral', 50
  UNION ALL SELECT 'privacy-tools', 'fit_profiles', 'journalist_activist', 'Journalist/activist', 'Journalist/Aktivist', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'privacy-tools'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'privacy-tools'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('047-privacy-tools-matrix-criteria');
