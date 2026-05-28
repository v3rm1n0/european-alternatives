-- Migration 037: Define App Stores category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('app-stores', 'distribution_platform', 'Distribution & Platform', 'Verteilung & Plattform', 'How the store distributes apps, which platforms are supported, and which installation methods are available.', 'Wie der Store Apps verteilt, welche Plattformen unterstützt werden und welche Installationsmethoden verfügbar sind.', 100),
  ('app-stores', 'app_catalog_curation', 'App Catalog & Curation', 'App-Katalog & Kuratierung', 'App catalog scope, curation approach, review process, and discovery features.', 'Umfang des App-Katalogs, Kuratierungsansatz, Prüfprozess und Entdeckungsfunktionen.', 200),
  ('app-stores', 'privacy_tracking', 'Privacy & Tracking', 'Privatsphäre & Tracking', 'Privacy protections, tracker detection, account requirements, and telemetry behavior of the store.', 'Datenschutzmaßnahmen, Tracker-Erkennung, Kontoanforderungen und Telemetrieverhalten des Stores.', 300),
  ('app-stores', 'security_updates', 'Security & Updates', 'Sicherheit & Aktualisierungen', 'Security measures for app verification, update delivery, and build integrity.', 'Sicherheitsmaßnahmen für App-Verifizierung, Update-Bereitstellung und Build-Integrität.', 400),
  ('app-stores', 'developer_ecosystem', 'Developer Ecosystem', 'Entwickler-Ökosystem', 'Developer onboarding, fees, revenue models, and documentation quality.', 'Entwickler-Onboarding, Gebühren, Erlösmodelle und Dokumentationsqualität.', 500),
  ('app-stores', 'user_experience', 'User Experience', 'Benutzererfahrung', 'Storefront features, search and discovery, permissions display, and parental controls.', 'Storefront-Funktionen, Suche und Entdeckung, Berechtigungsanzeige und Kindersicherung.', 600),
  ('app-stores', 'openness_transparency', 'Openness & Transparency', 'Offenheit & Transparenz', 'Source code availability, metadata openness, governance, and independent audits.', 'Quellcodeverfügbarkeit, Metadatenoffenheit, Governance und unabhängige Prüfungen.', 700),
  ('app-stores', 'data_compliance', 'Data & Compliance', 'Daten & Compliance', 'Data processing location, GDPR compliance, account deletion, and self-hosting options.', 'Datenverarbeitungsstandort, DSGVO-Konformität, Kontolöschung und Self-Hosting-Optionen.', 800),
  ('app-stores', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing structure, free tier availability, and target audience fit profiles.', 'Preisstruktur, Verfügbarkeit kostenloser Stufen und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'app-stores' AS category_id, 'distribution_platform' AS group_key, 'target_platform' AS criterion_key, 'Target platform' AS label_en, 'Zielplattform' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Operating systems and platforms the app store natively supports.' AS help_text_en, 'Betriebssysteme und Plattformen, die der App Store nativ unterstützt.' AS help_text_de
  UNION ALL SELECT 'app-stores', 'distribution_platform', 'distribution_model', 'Distribution model', 'Verteilungsmodell', 'enum', 'tradeoff', 'optional', 1020, 'How apps are distributed, whether centrally, through repositories, or in a decentralized manner.', 'Wie Apps verteilt werden, ob zentral, über Repositories oder dezentral.'
  UNION ALL SELECT 'app-stores', 'distribution_platform', 'installation_method', 'Installation method', 'Installationsmethode', 'multi_enum', 'informational', 'multi_select', 1030, 'Technical methods available for installing apps from the store.', 'Technische Methoden, die für die Installation von Apps aus dem Store verfügbar sind.'
  UNION ALL SELECT 'app-stores', 'distribution_platform', 'sideloading_support', 'Sideloading support', 'Sideloading-Unterstützung', 'boolean', 'beneficial', 'optional', 1040, 'Whether the store allows installing apps from sources outside its own catalog.', 'Ob der Store die Installation von Apps aus Quellen außerhalb des eigenen Katalogs erlaubt.'
  UNION ALL SELECT 'app-stores', 'distribution_platform', 'offline_app_install', 'Offline app installation', 'Offline-App-Installation', 'boolean', 'informational', 'optional', 1050, 'Whether apps can be installed without an active internet connection.', 'Ob Apps ohne aktive Internetverbindung installiert werden können.'
  UNION ALL SELECT 'app-stores', 'app_catalog_curation', 'review_process', 'App review process', 'App-Prüfprozess', 'enum', 'tradeoff', 'optional', 2010, 'How submitted apps are reviewed before being listed in the store.', 'Wie eingereichte Apps geprüft werden, bevor sie im Store gelistet werden.'
  UNION ALL SELECT 'app-stores', 'app_catalog_curation', 'foss_focus', 'FOSS app focus', 'FOSS-App-Fokus', 'boolean', 'informational', 'optional', 2020, 'Whether the store primarily focuses on free and open-source software.', 'Ob der Store sich primär auf freie und quelloffene Software konzentriert.'
  UNION ALL SELECT 'app-stores', 'app_catalog_curation', 'anti_feature_flags', 'Anti-feature flags', 'Anti-Feature-Kennzeichnung', 'boolean', 'beneficial', 'optional', 2030, 'Whether the store labels apps that contain anti-features such as ads, tracking, or non-free dependencies.', 'Ob der Store Apps kennzeichnet, die Anti-Features wie Werbung, Tracking oder unfreie Abhängigkeiten enthalten.'
  UNION ALL SELECT 'app-stores', 'app_catalog_curation', 'user_ratings_reviews', 'User ratings & reviews', 'Nutzerbewertungen & Rezensionen', 'boolean', 'informational', 'optional', 2040, 'Whether users can rate and review apps within the store.', 'Ob Nutzer Apps innerhalb des Stores bewerten und rezensieren können.'
  UNION ALL SELECT 'app-stores', 'app_catalog_curation', 'editorial_recommendations', 'Editorial recommendations', 'Redaktionelle Empfehlungen', 'boolean', 'informational', 'optional', 2050, 'Whether the store offers editorially curated app recommendations.', 'Ob der Store redaktionell kuratierte App-Empfehlungen anbietet.'
  UNION ALL SELECT 'app-stores', 'app_catalog_curation', 'app_categories_available', 'App category breadth', 'App-Kategoriebreite', 'enum', 'informational', 'optional', 2060, 'The breadth of app categories available in the store catalog.', 'Die Breite der im Store-Katalog verfügbaren App-Kategorien.'
  UNION ALL SELECT 'app-stores', 'privacy_tracking', 'tracker_detection', 'Tracker detection labels', 'Tracker-Erkennungslabels', 'boolean', 'beneficial', 'must_match', 3010, 'Whether the store provides labels or warnings about trackers embedded in apps.', 'Ob der Store Labels oder Warnungen zu in Apps eingebetteten Trackern bereitstellt.'
  UNION ALL SELECT 'app-stores', 'privacy_tracking', 'privacy_labels', 'App privacy labels', 'App-Datenschutzlabels', 'boolean', 'beneficial', 'optional', 3020, 'Whether apps display structured privacy labels summarizing data collection practices.', 'Ob Apps strukturierte Datenschutzlabels anzeigen, die Datenerhebungspraktiken zusammenfassen.'
  UNION ALL SELECT 'app-stores', 'privacy_tracking', 'account_required_browse', 'Account required to browse', 'Konto zum Durchsuchen erforderlich', 'boolean', 'risk', 'must_match', 3030, 'Whether a user account is required just to browse the app catalog.', 'Ob ein Benutzerkonto erforderlich ist, um den App-Katalog zu durchsuchen.'
  UNION ALL SELECT 'app-stores', 'privacy_tracking', 'account_required_install', 'Account required to install', 'Konto zum Installieren erforderlich', 'boolean', 'risk', 'must_match', 3040, 'Whether a user account is required to download and install apps.', 'Ob ein Benutzerkonto erforderlich ist, um Apps herunterzuladen und zu installieren.'
  UNION ALL SELECT 'app-stores', 'privacy_tracking', 'store_telemetry', 'Store telemetry', 'Store-Telemetrie', 'enum', 'tradeoff', 'optional', 3050, 'The degree to which the store itself collects usage telemetry from users.', 'In welchem Umfang der Store selbst Nutzungstelemetrie von Benutzern erhebt.'
  UNION ALL SELECT 'app-stores', 'security_updates', 'code_signing_verification', 'Code signing verification', 'Code-Signatur-Verifizierung', 'boolean', 'beneficial', 'optional', 4010, 'Whether the store verifies cryptographic code signatures on distributed apps.', 'Ob der Store kryptografische Code-Signaturen bei verteilten Apps verifiziert.'
  UNION ALL SELECT 'app-stores', 'security_updates', 'malware_scanning', 'Malware scanning', 'Malware-Scanning', 'boolean', 'beneficial', 'optional', 4020, 'Whether submitted apps are scanned for malware before distribution.', 'Ob eingereichte Apps vor der Verteilung auf Malware gescannt werden.'
  UNION ALL SELECT 'app-stores', 'security_updates', 'reproducible_builds', 'Reproducible builds support', 'Reproduzierbare-Builds-Unterstützung', 'boolean', 'beneficial', 'optional', 4030, 'Whether the store supports reproducible builds to verify binary-to-source correspondence.', 'Ob der Store reproduzierbare Builds unterstützt, um die Übereinstimmung von Binärdatei und Quellcode zu verifizieren.'
  UNION ALL SELECT 'app-stores', 'security_updates', 'auto_update_mechanism', 'Auto-update mechanism', 'Auto-Update-Mechanismus', 'enum', 'informational', 'optional', 4040, 'How the store handles automatic updates for installed apps.', 'Wie der Store automatische Aktualisierungen für installierte Apps handhabt.'
  UNION ALL SELECT 'app-stores', 'security_updates', 'update_notification', 'Update notifications', 'Update-Benachrichtigungen', 'boolean', 'informational', 'optional', 4050, 'Whether the store notifies users when app updates are available.', 'Ob der Store Benutzer benachrichtigt, wenn App-Aktualisierungen verfügbar sind.'
  UNION ALL SELECT 'app-stores', 'security_updates', 'delta_updates', 'Delta / incremental updates', 'Delta- / inkrementelle Updates', 'boolean', 'informational', 'optional', 4060, 'Whether the store supports delta updates that download only changed portions of an app.', 'Ob der Store Delta-Updates unterstützt, die nur geänderte Teile einer App herunterladen.'
  UNION ALL SELECT 'app-stores', 'developer_ecosystem', 'developer_registration_fee', 'Developer registration fee', 'Entwickler-Registrierungsgebühr', 'enum', 'informational', 'optional', 5010, 'The fee structure required for developers to register and publish apps.', 'Die Gebührenstruktur, die für Entwickler zur Registrierung und Veröffentlichung von Apps erforderlich ist.'
  UNION ALL SELECT 'app-stores', 'developer_ecosystem', 'revenue_share_model', 'Revenue share model', 'Erlösteilungsmodell', 'enum', 'informational', 'optional', 5020, 'How revenue from paid apps or in-app purchases is shared between developer and store.', 'Wie Einnahmen aus kostenpflichtigen Apps oder In-App-Käufen zwischen Entwickler und Store aufgeteilt werden.'
  UNION ALL SELECT 'app-stores', 'developer_ecosystem', 'developer_api', 'Developer API available', 'Entwickler-API verfügbar', 'boolean', 'informational', 'optional', 5030, 'Whether a programmatic API is available for developers to manage listings and metadata.', 'Ob eine programmatische API für Entwickler zur Verwaltung von Einträgen und Metadaten verfügbar ist.'
  UNION ALL SELECT 'app-stores', 'developer_ecosystem', 'app_submission_process', 'App submission process', 'App-Einreichungsprozess', 'enum', 'informational', 'optional', 5040, 'The workflow developers use to submit new apps or updates to the store.', 'Der Arbeitsablauf, den Entwickler verwenden, um neue Apps oder Updates im Store einzureichen.'
  UNION ALL SELECT 'app-stores', 'developer_ecosystem', 'developer_documentation', 'Developer documentation', 'Entwicklerdokumentation', 'enum', 'informational', 'optional', 5050, 'The quality and completeness of documentation available for developers.', 'Die Qualität und Vollständigkeit der für Entwickler verfügbaren Dokumentation.'
  UNION ALL SELECT 'app-stores', 'user_experience', 'web_storefront', 'Web storefront', 'Web-Storefront', 'boolean', 'informational', 'optional', 6010, 'Whether apps can be browsed and discovered through a web-based storefront.', 'Ob Apps über eine webbasierte Storefront durchsucht und entdeckt werden können.'
  UNION ALL SELECT 'app-stores', 'user_experience', 'search_discovery', 'Search & discovery features', 'Such- & Entdeckungsfunktionen', 'multi_enum', 'informational', 'multi_select', 6020, 'Discovery mechanisms available to help users find relevant apps in the store.', 'Entdeckungsmechanismen, die Nutzern helfen, relevante Apps im Store zu finden.'
  UNION ALL SELECT 'app-stores', 'user_experience', 'app_permissions_display', 'App permissions display', 'App-Berechtigungsanzeige', 'boolean', 'beneficial', 'optional', 6030, 'Whether the store displays the permissions an app requests before installation.', 'Ob der Store die von einer App angeforderten Berechtigungen vor der Installation anzeigt.'
  UNION ALL SELECT 'app-stores', 'user_experience', 'multiple_app_sources', 'Multiple repository / source support', 'Mehrere Repositorys / Quellen', 'boolean', 'informational', 'optional', 6040, 'Whether the store supports adding multiple repositories or app sources.', 'Ob der Store das Hinzufügen mehrerer Repositorys oder App-Quellen unterstützt.'
  UNION ALL SELECT 'app-stores', 'user_experience', 'parental_controls', 'Parental controls', 'Kindersicherung', 'boolean', 'informational', 'optional', 6050, 'Whether parental controls or content filtering options are available.', 'Ob Kindersicherung oder Inhaltsfilterungsoptionen verfügbar sind.'
  UNION ALL SELECT 'app-stores', 'openness_transparency', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'How the store application source code is licensed and made available.', 'Wie der Quellcode der Store-Anwendung lizenziert und bereitgestellt wird.'
  UNION ALL SELECT 'app-stores', 'openness_transparency', 'app_metadata_transparency', 'App metadata transparency', 'App-Metadaten-Transparenz', 'enum', 'informational', 'optional', 7020, 'Whether app metadata such as descriptions and changelogs are openly accessible.', 'Ob App-Metadaten wie Beschreibungen und Änderungsprotokolle offen zugänglich sind.'
  UNION ALL SELECT 'app-stores', 'openness_transparency', 'community_governance', 'Community governance', 'Community-Governance', 'boolean', 'informational', 'optional', 7030, 'Whether the store is governed by a community or follows a transparent decision process.', 'Ob der Store von einer Community geleitet wird oder einem transparenten Entscheidungsprozess folgt.'
  UNION ALL SELECT 'app-stores', 'openness_transparency', 'independent_security_audit', 'Independent security audit', 'Unabhängiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 7040, 'Whether the store has undergone an independent security audit by a third party.', 'Ob der Store ein unabhängiges Sicherheitsaudit durch einen Dritten durchlaufen hat.'
  UNION ALL SELECT 'app-stores', 'data_compliance', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 8010, 'Where user data collected by the store is processed and stored geographically.', 'Wo die vom Store erhobenen Benutzerdaten geographisch verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'app-stores', 'data_compliance', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfügbar', 'boolean', 'informational', 'optional', 8020, 'Whether a GDPR-compliant data processing agreement is offered to users or developers.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag für Nutzer oder Entwickler angeboten wird.'
  UNION ALL SELECT 'app-stores', 'data_compliance', 'account_deletion', 'Account deletion', 'Kontolöschung', 'boolean', 'beneficial', 'optional', 8030, 'Whether users can fully delete their accounts and all associated data.', 'Ob Benutzer ihre Konten und alle zugehörigen Daten vollständig löschen können.'
  UNION ALL SELECT 'app-stores', 'data_compliance', 'self_hostable', 'Self-hostable', 'Selbst hostbar', 'boolean', 'beneficial', 'optional', 8040, 'Whether the store platform can be deployed on your own infrastructure.', 'Ob die Store-Plattform auf eigener Infrastruktur betrieben werden kann.'
  UNION ALL SELECT 'app-stores', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'How the store is priced for end users.', 'Wie der Store für Endnutzer bepreist wird.'
  UNION ALL SELECT 'app-stores', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'must_match', 9020, 'Whether the store offers a free tier without requiring payment.', 'Ob der Store eine kostenlose Stufe ohne Bezahlung anbietet.'
  UNION ALL SELECT 'app-stores', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9030, 'Target audience profiles the store is best suited for.', 'Zielgruppenprofile, für die der Store am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'app-stores' AS category_id, 'target_platform' AS criterion_key, 'android' AS option_key, 'Android' AS label_en, 'Android' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'app-stores', 'target_platform', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'target_platform', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'target_platform', 'windows', 'Windows', 'Windows', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'target_platform', 'macos', 'macOS', 'macOS', 'neutral', 50
  UNION ALL SELECT 'app-stores', 'target_platform', 'harmonyos', 'HarmonyOS', 'HarmonyOS', 'neutral', 60
  UNION ALL SELECT 'app-stores', 'distribution_model', 'centralized', 'Centralized', 'Zentralisiert', 'neutral', 10
  UNION ALL SELECT 'app-stores', 'distribution_model', 'decentralized_federated', 'Decentralized / federated', 'Dezentralisiert / föderiert', 'positive', 20
  UNION ALL SELECT 'app-stores', 'distribution_model', 'repository_based', 'Repository-based', 'Repository-basiert', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'distribution_model', 'web_only', 'Web only', 'Nur Web', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'installation_method', 'native_package', 'Native package', 'Natives Paket', 'neutral', 10
  UNION ALL SELECT 'app-stores', 'installation_method', 'apk_sideload', 'APK sideload', 'APK-Sideload', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'installation_method', 'flatpak', 'Flatpak', 'Flatpak', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'installation_method', 'snap', 'Snap', 'Snap', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'installation_method', 'appimage', 'AppImage', 'AppImage', 'neutral', 50
  UNION ALL SELECT 'app-stores', 'installation_method', 'msi_exe', 'MSI / EXE', 'MSI / EXE', 'neutral', 60
  UNION ALL SELECT 'app-stores', 'installation_method', 'browser_pwa', 'Browser PWA', 'Browser-PWA', 'neutral', 70
  UNION ALL SELECT 'app-stores', 'review_process', 'manual_review', 'Manual review', 'Manuelle Prüfung', 'positive', 10
  UNION ALL SELECT 'app-stores', 'review_process', 'automated_scan', 'Automated scan', 'Automatisierter Scan', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'review_process', 'community_review', 'Community review', 'Community-Prüfung', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'review_process', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'app-stores', 'app_categories_available', 'comprehensive', 'Comprehensive', 'Umfassend', 'neutral', 10
  UNION ALL SELECT 'app-stores', 'app_categories_available', 'focused_niche', 'Focused niche', 'Fokussierte Nische', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'app_categories_available', 'limited', 'Limited', 'Begrenzt', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'store_telemetry', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'app-stores', 'store_telemetry', 'opt_in', 'Opt-in', 'Opt-in', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'store_telemetry', 'opt_out', 'Opt-out', 'Opt-out', 'warning', 30
  UNION ALL SELECT 'app-stores', 'store_telemetry', 'mandatory', 'Mandatory', 'Verpflichtend', 'warning', 40
  UNION ALL SELECT 'app-stores', 'auto_update_mechanism', 'automatic_background', 'Automatic background', 'Automatisch im Hintergrund', 'neutral', 10
  UNION ALL SELECT 'app-stores', 'auto_update_mechanism', 'user_triggered', 'User-triggered', 'Vom Benutzer ausgelöst', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'auto_update_mechanism', 'manual_only', 'Manual only', 'Nur manuell', 'warning', 30
  UNION ALL SELECT 'app-stores', 'auto_update_mechanism', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'developer_registration_fee', 'free', 'Free', 'Kostenlos', 'positive', 10
  UNION ALL SELECT 'app-stores', 'developer_registration_fee', 'one_time_low', 'One-time low', 'Einmalig niedrig', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'developer_registration_fee', 'one_time_high', 'One-time high', 'Einmalig hoch', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'developer_registration_fee', 'annual_fee', 'Annual fee', 'Jahresgebühr', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'revenue_share_model', 'no_commission', 'No commission', 'Keine Provision', 'positive', 10
  UNION ALL SELECT 'app-stores', 'revenue_share_model', 'low_commission', 'Low commission', 'Niedrige Provision', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'revenue_share_model', 'standard_commission', 'Standard commission', 'Standardprovision', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'revenue_share_model', 'custom_negotiable', 'Custom negotiable', 'Individuell verhandelbar', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'revenue_share_model', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'neutral', 50
  UNION ALL SELECT 'app-stores', 'app_submission_process', 'automated_pipeline', 'Automated pipeline', 'Automatisierte Pipeline', 'neutral', 10
  UNION ALL SELECT 'app-stores', 'app_submission_process', 'manual_submission', 'Manual submission', 'Manuelle Einreichung', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'app_submission_process', 'pull_request_metadata', 'Pull request metadata', 'Pull-Request-Metadaten', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'app_submission_process', 'self_publish', 'Self-publish', 'Selbstveröffentlichung', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'developer_documentation', 'comprehensive', 'Comprehensive', 'Umfassend', 'positive', 10
  UNION ALL SELECT 'app-stores', 'developer_documentation', 'adequate', 'Adequate', 'Ausreichend', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'developer_documentation', 'minimal', 'Minimal', 'Minimal', 'warning', 30
  UNION ALL SELECT 'app-stores', 'developer_documentation', 'community_maintained', 'Community-maintained', 'Community-gepflegt', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'search_discovery', 'keyword_search', 'Keyword search', 'Stichwortsuche', 'neutral', 10
  UNION ALL SELECT 'app-stores', 'search_discovery', 'category_browsing', 'Category browsing', 'Kategorie-Browsing', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'search_discovery', 'staff_picks', 'Staff picks', 'Redaktionsauswahl', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'search_discovery', 'trending_charts', 'Trending charts', 'Trendlisten', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'search_discovery', 'personalized_recommendations', 'Personalized recommendations', 'Personalisierte Empfehlungen', 'neutral', 50
  UNION ALL SELECT 'app-stores', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'app-stores', 'source_model', 'source_available', 'Source-available', 'Quelloffen', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'app-stores', 'app_metadata_transparency', 'fully_open', 'Fully open', 'Vollständig offen', 'positive', 10
  UNION ALL SELECT 'app-stores', 'app_metadata_transparency', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'app_metadata_transparency', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 30
  UNION ALL SELECT 'app-stores', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'app-stores', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primär', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'app-stores', 'data_processing_location', 'self_hosted_choice', 'Self-hosted choice', 'Selbst gehostet (eigene Wahl)', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'data_processing_location', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'neutral', 50
  UNION ALL SELECT 'app-stores', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'app-stores', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'app-stores', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'pricing_model', 'open_core', 'Open core', 'Open Core', 'neutral', 50
  UNION ALL SELECT 'app-stores', 'fit_profiles', 'personal', 'Personal', 'Persönlich', 'neutral', 10
  UNION ALL SELECT 'app-stores', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 20
  UNION ALL SELECT 'app-stores', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 30
  UNION ALL SELECT 'app-stores', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 40
  UNION ALL SELECT 'app-stores', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 50
  UNION ALL SELECT 'app-stores', 'fit_profiles', 'educator', 'Educator', 'Bildungsbereich', 'neutral', 60
  UNION ALL SELECT 'app-stores', 'fit_profiles', 'foss_advocate', 'FOSS advocate', 'FOSS-Befürworter', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'app-stores'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'app-stores'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('037-app-stores-matrix-criteria');
