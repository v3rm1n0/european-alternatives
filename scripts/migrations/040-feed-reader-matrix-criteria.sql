-- Migration 040: Define Feed Reader category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('feed-reader', 'feed_support_import', 'Feed Support & Import', 'Feed-Unterstützung & Import', 'Feed protocol support, import and export formats, and subscription management capabilities.', 'Feed-Protokoll-Unterstützung, Import- und Export-Formate sowie Abonnementverwaltungsfunktionen.', 100),
  ('feed-reader', 'reading_experience', 'Reading Experience', 'Leseerlebnis', 'Article presentation, navigation, search, and content organization features.', 'Artikeldarstellung, Navigation, Suche und Funktionen zur Inhaltsorganisation.', 200),
  ('feed-reader', 'client_apps_access', 'Client Apps & Access', 'Client-Apps & Zugang', 'Available client applications, platform support, and access methods.', 'Verfügbare Client-Anwendungen, Plattformunterstützung und Zugangsmöglichkeiten.', 300),
  ('feed-reader', 'sync_sharing', 'Sync & Sharing', 'Synchronisation & Teilen', 'Cross-device synchronization, sharing capabilities, and collaboration features.', 'Geräteübergreifende Synchronisation, Freigabefunktionen und Zusammenarbeit.', 400),
  ('feed-reader', 'filtering_automation', 'Filtering & Automation', 'Filterung & Automatisierung', 'Content filtering rules, subscription limits, and automation integrations.', 'Inhaltsfilterregeln, Abonnementlimits und Automatisierungsintegrationen.', 500),
  ('feed-reader', 'privacy_data', 'Privacy & Data', 'Privatsphäre & Daten', 'Account requirements, telemetry policies, data location, and feed fetching privacy.', 'Kontoanforderungen, Telemetrie-Richtlinien, Datenstandort und Feed-Abruf-Privatsphäre.', 600),
  ('feed-reader', 'openness_extensibility', 'Openness & Extensibility', 'Offenheit & Erweiterbarkeit', 'Source code availability, licensing terms, plugin support, and community ecosystem.', 'Quellcode-Verfügbarkeit, Lizenzbedingungen, Plugin-Unterstützung und Community-Ökosystem.', 700),
  ('feed-reader', 'deployment_hosting', 'Deployment & Hosting', 'Bereitstellung & Hosting', 'Hosting models, deployment options, database requirements, and server resource needs.', 'Hosting-Modelle, Bereitstellungsoptionen, Datenbankanforderungen und Server-Ressourcenbedarf.', 800),
  ('feed-reader', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing structure, free tier availability, paid feature scope, and target audience fit.', 'Preisstruktur, Verfügbarkeit kostenloser Versionen, Umfang kostenpflichtiger Funktionen und Zielgruppeneignung.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'feed-reader' AS category_id, 'feed_support_import' AS group_key, 'supported_feed_formats' AS criterion_key, 'Supported feed formats' AS label_en, 'Unterstützte Feed-Formate' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'The feed protocols and formats supported for subscription and reading.' AS help_text_en, 'Die unterstützten Feed-Protokolle und Formate für Abonnement und Lesen.' AS help_text_de
  UNION ALL SELECT 'feed-reader', 'feed_support_import', 'feed_discovery', 'Feed discovery', 'Feed-Erkennung', 'enum', 'informational', 'optional', 1020, 'How the reader discovers feeds from website URLs without requiring manual feed address input.', 'Wie der Reader Feeds von Website-URLs erkennt, ohne manuelle Eingabe von Feed-Adressen.'
  UNION ALL SELECT 'feed-reader', 'feed_support_import', 'opml_support', 'OPML import / export', 'OPML-Import / -Export', 'enum', 'beneficial', 'optional', 1030, 'Whether subscriptions can be imported or exported using the OPML standard format.', 'Ob Abonnements im OPML-Standardformat importiert oder exportiert werden können.'
  UNION ALL SELECT 'feed-reader', 'feed_support_import', 'full_text_extraction', 'Full-text extraction', 'Volltext-Extraktion', 'boolean', 'beneficial', 'optional', 1040, 'Whether the reader can extract full article content from feeds that only provide summaries.', 'Ob der Reader den vollständigen Artikelinhalt aus Feeds extrahieren kann, die nur Zusammenfassungen liefern.'
  UNION ALL SELECT 'feed-reader', 'feed_support_import', 'feed_update_frequency', 'Feed update frequency', 'Feed-Aktualisierungshäufigkeit', 'enum', 'informational', 'optional', 1050, 'How often the reader checks for new feed content and whether it supports push-based updates.', 'Wie oft der Reader auf neue Feed-Inhalte prüft und ob Push-basierte Aktualisierungen unterstützt werden.'
  UNION ALL SELECT 'feed-reader', 'feed_support_import', 'podcast_support', 'Podcast support', 'Podcast-Unterstützung', 'boolean', 'informational', 'optional', 1060, 'Whether the reader can subscribe to and play podcast audio feeds.', 'Ob der Reader Podcast-Audio-Feeds abonnieren und abspielen kann.'
  UNION ALL SELECT 'feed-reader', 'reading_experience', 'reading_view', 'Reading view', 'Lese-Ansicht', 'enum', 'informational', 'optional', 2010, 'The primary layout used to display articles and feed content in the reader interface.', 'Das primäre Layout zur Anzeige von Artikeln und Feed-Inhalten in der Reader-Oberfläche.'
  UNION ALL SELECT 'feed-reader', 'reading_experience', 'offline_reading', 'Offline reading', 'Offline-Lesen', 'boolean', 'beneficial', 'optional', 2020, 'Whether articles can be saved for reading without an active internet connection.', 'Ob Artikel zum Lesen ohne aktive Internetverbindung gespeichert werden können.'
  UNION ALL SELECT 'feed-reader', 'reading_experience', 'search_capability', 'Search capability', 'Suchfunktion', 'enum', 'informational', 'optional', 2030, 'The search functionality available for finding content across subscribed feeds.', 'Die Suchfunktion zum Auffinden von Inhalten in abonnierten Feeds.'
  UNION ALL SELECT 'feed-reader', 'reading_experience', 'tagging_labeling', 'Tagging / labeling', 'Tagging / Beschriftung', 'boolean', 'beneficial', 'optional', 2040, 'Whether articles can be tagged or labeled for personal organization beyond folders.', 'Ob Artikel für die persönliche Organisation über Ordner hinaus mit Tags oder Labels versehen werden können.'
  UNION ALL SELECT 'feed-reader', 'reading_experience', 'folder_organization', 'Folder / category organization', 'Ordner- / Kategorieorganisation', 'boolean', 'beneficial', 'optional', 2050, 'Whether feeds can be grouped into folders or categories for structured browsing.', 'Ob Feeds zur strukturierten Navigation in Ordner oder Kategorien gruppiert werden können.'
  UNION ALL SELECT 'feed-reader', 'reading_experience', 'saved_articles', 'Saved articles / read-later', 'Gespeicherte Artikel / Später lesen', 'boolean', 'beneficial', 'optional', 2060, 'Whether individual articles can be bookmarked or saved for later reading.', 'Ob einzelne Artikel als Lesezeichen gespeichert oder für späteres Lesen vorgemerkt werden können.'
  UNION ALL SELECT 'feed-reader', 'reading_experience', 'keyboard_shortcuts', 'Keyboard shortcuts', 'Tastenkürzel', 'boolean', 'informational', 'optional', 2070, 'Whether the reader provides keyboard shortcuts for navigating and managing feeds.', 'Ob der Reader Tastenkürzel zur Navigation und Verwaltung von Feeds bereitstellt.'
  UNION ALL SELECT 'feed-reader', 'client_apps_access', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 3010, 'The operating systems and platforms with native or dedicated client applications.', 'Die Betriebssysteme und Plattformen mit nativen oder dedizierten Client-Anwendungen.'
  UNION ALL SELECT 'feed-reader', 'client_apps_access', 'web_interface', 'Web interface available', 'Weboberfläche verfügbar', 'boolean', 'beneficial', 'optional', 3020, 'Whether the reader offers a browser-based interface accessible from any device.', 'Ob der Reader eine browserbasierte Oberfläche bietet, die von jedem Gerät zugänglich ist.'
  UNION ALL SELECT 'feed-reader', 'client_apps_access', 'api_access', 'API access', 'API-Zugang', 'enum', 'informational', 'optional', 3030, 'The type of API available for third-party client integration and automation.', 'Die Art der verfügbaren API für Drittanbieter-Client-Integration und Automatisierung.'
  UNION ALL SELECT 'feed-reader', 'client_apps_access', 'browser_extension', 'Browser extension', 'Browser-Erweiterung', 'boolean', 'informational', 'optional', 3040, 'Whether a browser extension is available for subscribing to feeds or reading articles.', 'Ob eine Browser-Erweiterung zum Abonnieren von Feeds oder Lesen von Artikeln verfügbar ist.'
  UNION ALL SELECT 'feed-reader', 'client_apps_access', 'notification_support', 'Notification support', 'Benachrichtigungsunterstützung', 'multi_enum', 'informational', 'multi_select', 3050, 'The notification methods available for alerting users about new feed content.', 'Die verfügbaren Benachrichtigungsmethoden zur Information über neue Feed-Inhalte.'
  UNION ALL SELECT 'feed-reader', 'sync_sharing', 'cross_device_sync', 'Cross-device sync', 'Geräteübergreifende Synchronisation', 'boolean', 'beneficial', 'must_match', 4010, 'Whether read status and subscriptions synchronize across multiple devices.', 'Ob Lesestatus und Abonnements über mehrere Geräte hinweg synchronisiert werden.'
  UNION ALL SELECT 'feed-reader', 'sync_sharing', 'sharing_options', 'Sharing options', 'Freigabeoptionen', 'multi_enum', 'informational', 'multi_select', 4020, 'The methods available for sharing articles with others or saving to external services.', 'Die verfügbaren Methoden zum Teilen von Artikeln oder Speichern in externen Diensten.'
  UNION ALL SELECT 'feed-reader', 'sync_sharing', 'collaboration_features', 'Collaboration features', 'Zusammenarbeitsfunktionen', 'boolean', 'informational', 'optional', 4030, 'Whether the reader supports shared feeds or collaborative reading with other users.', 'Ob der Reader gemeinsame Feeds oder kollaboratives Lesen mit anderen Benutzern unterstützt.'
  UNION ALL SELECT 'feed-reader', 'sync_sharing', 'newsletter_email_feeds', 'Newsletter / email-to-feed', 'Newsletter / E-Mail-zu-Feed', 'boolean', 'informational', 'optional', 4040, 'Whether email newsletters can be converted into feed subscriptions within the reader.', 'Ob E-Mail-Newsletter innerhalb des Readers in Feed-Abonnements umgewandelt werden können.'
  UNION ALL SELECT 'feed-reader', 'filtering_automation', 'content_filtering', 'Content filtering / rules', 'Inhaltsfilterung / Regeln', 'enum', 'informational', 'optional', 5010, 'The rule-based filtering capabilities for hiding or highlighting specific feed content.', 'Die regelbasierten Filterfunktionen zum Ausblenden oder Hervorheben bestimmter Feed-Inhalte.'
  UNION ALL SELECT 'feed-reader', 'filtering_automation', 'feed_categories_limit', 'Feed / subscription limit', 'Feed- / Abonnementlimit', 'enum', 'informational', 'optional', 5020, 'The maximum number of feed subscriptions allowed by the reader.', 'Die maximale Anzahl von Feed-Abonnements, die der Reader erlaubt.'
  UNION ALL SELECT 'feed-reader', 'filtering_automation', 'automation_integrations', 'Automation integrations', 'Automatisierungsintegrationen', 'multi_enum', 'informational', 'multi_select', 5030, 'The automation and workflow tools that can connect to the feed reader.', 'Die Automatisierungs- und Workflow-Tools, die mit dem Feed-Reader verbunden werden können.'
  UNION ALL SELECT 'feed-reader', 'filtering_automation', 'ai_features', 'AI features', 'KI-Funktionen', 'multi_enum', 'informational', 'multi_select', 5040, 'AI-powered features available for content processing and organization.', 'KI-gestützte Funktionen für die Inhaltsverarbeitung und Organisation.'
  UNION ALL SELECT 'feed-reader', 'privacy_data', 'account_requirement', 'Account requirement', 'Kontoanforderung', 'enum', 'risk', 'optional', 6010, 'Whether the reader requires creating an account to use its core features.', 'Ob der Reader die Erstellung eines Kontos für die Nutzung seiner Kernfunktionen erfordert.'
  UNION ALL SELECT 'feed-reader', 'privacy_data', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 6020, 'How the reader handles collection and transmission of usage data.', 'Wie der Reader die Erfassung und Übermittlung von Nutzungsdaten handhabt.'
  UNION ALL SELECT 'feed-reader', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 6030, 'Where feed content and user data are processed and stored.', 'Wo Feed-Inhalte und Benutzerdaten verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'feed-reader', 'privacy_data', 'feed_fetching_model', 'Feed fetching model', 'Feed-Abrufmodell', 'enum', 'tradeoff', 'optional', 6040, 'Whether feed content is fetched by the server or directly by the client application.', 'Ob Feed-Inhalte vom Server oder direkt von der Client-Anwendung abgerufen werden.'
  UNION ALL SELECT 'feed-reader', 'privacy_data', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 6050, 'Whether user data and subscriptions can be exported in a portable format.', 'Ob Benutzerdaten und Abonnements in einem portablen Format exportiert werden können.'
  UNION ALL SELECT 'feed-reader', 'openness_extensibility', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'The openness of the reader source code and its availability to the public.', 'Die Offenheit des Reader-Quellcodes und seine öffentliche Verfügbarkeit.'
  UNION ALL SELECT 'feed-reader', 'openness_extensibility', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7020, 'The software license under which the reader is distributed.', 'Die Softwarelizenz, unter der der Reader vertrieben wird.'
  UNION ALL SELECT 'feed-reader', 'openness_extensibility', 'plugin_theme_support', 'Plugin / theme support', 'Plugin- / Theme-Unterstützung', 'boolean', 'beneficial', 'optional', 7030, 'Whether the reader supports extending functionality through plugins or custom themes.', 'Ob der Reader die Erweiterung der Funktionalität durch Plugins oder benutzerdefinierte Themes unterstützt.'
  UNION ALL SELECT 'feed-reader', 'openness_extensibility', 'self_hosting_option', 'Self-hosting option', 'Selbsthosting-Option', 'boolean', 'beneficial', 'must_match', 7040, 'Whether the reader can be self-hosted on personal infrastructure.', 'Ob der Reader auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'feed-reader', 'openness_extensibility', 'community_ecosystem', 'Community ecosystem', 'Community-Ökosystem', 'enum', 'informational', 'optional', 7050, 'The size and activity level of the community around the reader project.', 'Die Größe und Aktivität der Community rund um das Reader-Projekt.'
  UNION ALL SELECT 'feed-reader', 'deployment_hosting', 'hosting_model', 'Hosting model', 'Hosting-Modell', 'enum', 'tradeoff', 'must_match', 8010, 'Whether the reader is available as a cloud service, self-hosted, or both.', 'Ob der Reader als Cloud-Dienst, selbstgehostet oder beides verfügbar ist.'
  UNION ALL SELECT 'feed-reader', 'deployment_hosting', 'deployment_options', 'Deployment options', 'Bereitstellungsoptionen', 'multi_enum', 'informational', 'multi_select', 8020, 'The installation and deployment methods available for the reader.', 'Die verfügbaren Installations- und Bereitstellungsmethoden für den Reader.'
  UNION ALL SELECT 'feed-reader', 'deployment_hosting', 'database_requirement', 'Database requirement', 'Datenbankanforderung', 'enum', 'informational', 'optional', 8030, 'The database backend required or supported by the reader for data storage.', 'Das Datenbank-Backend, das vom Reader für die Datenspeicherung benötigt oder unterstützt wird.'
  UNION ALL SELECT 'feed-reader', 'deployment_hosting', 'minimum_server_requirements', 'Minimum server requirements', 'Minimale Serveranforderungen', 'enum', 'informational', 'optional', 8040, 'The minimum hardware tier needed to run the reader for basic operation.', 'Die minimale Hardware-Klasse, die für den grundlegenden Betrieb des Readers erforderlich ist.'
  UNION ALL SELECT 'feed-reader', 'deployment_hosting', 'mobile_data_efficiency', 'Mobile data efficiency', 'Mobile Dateneffizienz', 'enum', 'informational', 'optional', 8050, 'How efficiently the reader uses mobile data when fetching and displaying feed content.', 'Wie effizient der Reader mobile Daten beim Abrufen und Anzeigen von Feed-Inhalten nutzt.'
  UNION ALL SELECT 'feed-reader', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'The pricing structure of the reader software and any associated services.', 'Die Preisstruktur der Reader-Software und der zugehörigen Dienste.'
  UNION ALL SELECT 'feed-reader', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfügbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a fully functional free version of the reader is available.', 'Ob eine voll funktionsfähige kostenlose Version des Readers verfügbar ist.'
  UNION ALL SELECT 'feed-reader', 'pricing_fit', 'paid_features_scope', 'Paid features scope', 'Umfang kostenpflichtiger Funktionen', 'enum', 'tradeoff', 'optional', 9030, 'How much core functionality is restricted to paid plans or premium tiers.', 'Wie viel Kernfunktionalität auf kostenpflichtige Pläne oder Premium-Stufen beschränkt ist.'
  UNION ALL SELECT 'feed-reader', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Target audience profiles the feed reader is best suited for.', 'Zielgruppenprofile, für die der Feed-Reader am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'feed-reader' AS category_id, 'supported_feed_formats' AS criterion_key, 'rss_2' AS option_key, 'RSS 2.0' AS label_en, 'RSS 2.0' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'feed-reader', 'supported_feed_formats', 'atom', 'Atom', 'Atom', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'supported_feed_formats', 'json_feed', 'JSON Feed', 'JSON Feed', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'supported_feed_formats', 'rss_1', 'RSS 1.0', 'RSS 1.0', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'supported_feed_formats', 'h_feed', 'h-feed (Microformats)', 'h-feed (Microformats)', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'feed_discovery', 'automatic', 'Automatic', 'Automatisch', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'feed_discovery', 'manual_only', 'Manual only', 'Nur manuell', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'feed_discovery', 'both', 'Both', 'Beides', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'opml_support', 'import_and_export', 'Import and export', 'Import und Export', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'opml_support', 'import_only', 'Import only', 'Nur Import', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'opml_support', 'not_supported', 'Not supported', 'Nicht unterstützt', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'feed_update_frequency', 'realtime_websub', 'Realtime (WebSub)', 'Echtzeit (WebSub)', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'feed_update_frequency', 'configurable_interval', 'Configurable interval', 'Konfigurierbares Intervall', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'feed_update_frequency', 'fixed_interval', 'Fixed interval', 'Festes Intervall', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'feed_update_frequency', 'manual_only', 'Manual only', 'Nur manuell', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'reading_view', 'magazine_view', 'Magazine view', 'Magazin-Ansicht', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'reading_view', 'list_view', 'List view', 'Listen-Ansicht', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'reading_view', 'card_view', 'Card view', 'Karten-Ansicht', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'reading_view', 'multiple_views', 'Multiple views', 'Mehrere Ansichten', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'search_capability', 'full_text_search', 'Full-text search', 'Volltextsuche', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'search_capability', 'title_only', 'Title only', 'Nur Titel', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'search_capability', 'no_search', 'No search', 'Keine Suche', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'feed-reader', 'api_access', 'public_documented', 'Public documented', 'Öffentlich dokumentiert', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'api_access', 'undocumented', 'Undocumented', 'Undokumentiert', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'api_access', 'fever_api', 'Fever API', 'Fever-API', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'api_access', 'google_reader_api', 'Google Reader API', 'Google-Reader-API', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'api_access', 'none', 'None', 'Keine', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'notification_support', 'push_notification', 'Push notification', 'Push-Benachrichtigung', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'notification_support', 'email_digest', 'Email digest', 'E-Mail-Zusammenfassung', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'notification_support', 'in_app', 'In-app', 'In-App', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'notification_support', 'desktop_notification', 'Desktop notification', 'Desktop-Benachrichtigung', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'notification_support', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'sharing_options', 'social_media_share', 'Social media share', 'Social-Media-Teilen', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'sharing_options', 'email_share', 'Email share', 'E-Mail-Teilen', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'sharing_options', 'public_shared_links', 'Public shared links', 'Öffentliche geteilte Links', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'sharing_options', 'integration_readwise', 'Readwise integration', 'Readwise-Integration', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'sharing_options', 'integration_pocket', 'Pocket integration', 'Pocket-Integration', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'sharing_options', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 60
  UNION ALL SELECT 'feed-reader', 'content_filtering', 'advanced_rules', 'Advanced rules', 'Erweiterte Regeln', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'content_filtering', 'basic_filters', 'Basic filters', 'Einfache Filter', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'content_filtering', 'no_filtering', 'No filtering', 'Keine Filterung', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'feed_categories_limit', 'unlimited', 'Unlimited', 'Unbegrenzt', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'feed_categories_limit', 'generous', 'Generous (500+)', 'Großzügig (500+)', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'feed_categories_limit', 'moderate', 'Moderate (100-500)', 'Mäßig (100-500)', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'feed_categories_limit', 'limited', 'Limited (under 100)', 'Begrenzt (unter 100)', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'automation_integrations', 'webhooks', 'Webhooks', 'Webhooks', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'automation_integrations', 'zapier_ifttt', 'Zapier / IFTTT', 'Zapier / IFTTT', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'automation_integrations', 'custom_scripts', 'Custom scripts', 'Benutzerdefinierte Skripte', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'automation_integrations', 'api_based', 'API-based', 'API-basiert', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'automation_integrations', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'ai_features', 'ai_summary', 'AI summary', 'KI-Zusammenfassung', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'ai_features', 'ai_categorization', 'AI categorization', 'KI-Kategorisierung', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'ai_features', 'ai_recommendations', 'AI recommendations', 'KI-Empfehlungen', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'ai_features', 'ai_translation', 'AI translation', 'KI-Übersetzung', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'ai_features', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'account_requirement', 'no_account_needed', 'No account needed', 'Kein Konto erforderlich', 'positive', 10
  UNION ALL SELECT 'feed-reader', 'account_requirement', 'local_account', 'Local account', 'Lokales Konto', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'account_requirement', 'optional_cloud_account', 'Optional cloud account', 'Optionales Cloud-Konto', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'account_requirement', 'mandatory_cloud_account', 'Mandatory cloud account', 'Pflicht-Cloud-Konto', 'warning', 40
  UNION ALL SELECT 'feed-reader', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'feed-reader', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'feed-reader', 'data_processing_location', 'local_only', 'Local only', 'Nur lokal', 'positive', 10
  UNION ALL SELECT 'feed-reader', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primär', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 40
  UNION ALL SELECT 'feed-reader', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'feed-reader', 'feed_fetching_model', 'server_side', 'Server-side', 'Serverseitig', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'feed_fetching_model', 'client_side', 'Client-side', 'Clientseitig', 'positive', 20
  UNION ALL SELECT 'feed-reader', 'feed_fetching_model', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'source_model', 'fully_open_source', 'Fully open source', 'Vollständig quelloffen', 'positive', 10
  UNION ALL SELECT 'feed-reader', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'feed-reader', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'community_ecosystem', 'large_active', 'Large and active', 'Groß und aktiv', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'community_ecosystem', 'medium_active', 'Medium and active', 'Mittelgroß und aktiv', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'community_ecosystem', 'small_niche', 'Small / niche', 'Klein / Nische', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'community_ecosystem', 'minimal', 'Minimal', 'Minimal', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'hosting_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'hosting_model', 'self_hosted_only', 'Self-hosted only', 'Nur selbst gehostet', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'hosting_model', 'both', 'Both', 'Beides', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'deployment_options', 'docker', 'Docker', 'Docker', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'deployment_options', 'bare_metal', 'Bare metal', 'Bare Metal', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'deployment_options', 'package_manager', 'Package manager', 'Paketmanager', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'deployment_options', 'snap_flatpak', 'Snap / Flatpak', 'Snap / Flatpak', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'deployment_options', 'managed_cloud', 'Managed cloud', 'Verwaltete Cloud', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'deployment_options', 'shared_hosting_php', 'Shared hosting (PHP)', 'Shared Hosting (PHP)', 'neutral', 60
  UNION ALL SELECT 'feed-reader', 'database_requirement', 'no_database', 'No database (file-based)', 'Keine Datenbank (dateibasiert)', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'database_requirement', 'sqlite', 'SQLite', 'SQLite', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'database_requirement', 'mysql_mariadb', 'MySQL / MariaDB', 'MySQL / MariaDB', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'database_requirement', 'postgresql', 'PostgreSQL', 'PostgreSQL', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'database_requirement', 'multiple_supported', 'Multiple supported', 'Mehrere unterstützt', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'minimum_server_requirements', 'very_low', 'Very low (RPi-class)', 'Sehr niedrig (RPi-Klasse)', 'positive', 10
  UNION ALL SELECT 'feed-reader', 'minimum_server_requirements', 'low', 'Low (shared hosting)', 'Niedrig (Shared Hosting)', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'minimum_server_requirements', 'moderate', 'Moderate (VPS)', 'Mäßig (VPS)', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'minimum_server_requirements', 'high', 'High (dedicated)', 'Hoch (dediziert)', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'mobile_data_efficiency', 'very_efficient', 'Very efficient', 'Sehr effizient', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'mobile_data_efficiency', 'moderate', 'Moderate', 'Mäßig', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'mobile_data_efficiency', 'data_heavy', 'Data heavy', 'Datenintensiv', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'feed-reader', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'pricing_model', 'subscription_only', 'Subscription only', 'Nur Abonnement', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'pricing_model', 'donation_based', 'Donation-based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'paid_features_scope', 'no_paid_features', 'No paid features', 'Keine kostenpflichtigen Funktionen', 'positive', 10
  UNION ALL SELECT 'feed-reader', 'paid_features_scope', 'cosmetic_convenience', 'Cosmetic / convenience', 'Kosmetisch / Komfort', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'paid_features_scope', 'significant_features_locked', 'Significant features locked', 'Wesentliche Funktionen gesperrt', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'paid_features_scope', 'core_features_locked', 'Core features locked', 'Kernfunktionen gesperrt', 'warning', 40
  UNION ALL SELECT 'feed-reader', 'fit_profiles', 'power_reader', 'Power reader', 'Power-Leser', 'neutral', 10
  UNION ALL SELECT 'feed-reader', 'fit_profiles', 'casual_reader', 'Casual reader', 'Gelegenheitsleser', 'neutral', 20
  UNION ALL SELECT 'feed-reader', 'fit_profiles', 'researcher', 'Researcher', 'Forscher', 'neutral', 30
  UNION ALL SELECT 'feed-reader', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 40
  UNION ALL SELECT 'feed-reader', 'fit_profiles', 'self_hoster', 'Self-hoster', 'Selbst-Hoster', 'neutral', 50
  UNION ALL SELECT 'feed-reader', 'fit_profiles', 'news_junkie', 'News junkie', 'Nachrichtenjunkie', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'feed-reader'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'feed-reader'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('040-feed-reader-matrix-criteria');
