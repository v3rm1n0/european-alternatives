-- Migration 048: Define Podcasts category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('podcasts', 'content_access', 'Content Access & Discovery', 'Inhaltszugang & Entdeckung', 'How users find, subscribe to, and access podcast content through feeds, directories, and import/export capabilities.', 'Wie Benutzer Podcast-Inhalte ueber Feeds, Verzeichnisse und Import-/Exportfunktionen finden, abonnieren und darauf zugreifen.', 100),
  ('podcasts', 'playback_listening', 'Playback & Listening', 'Wiedergabe & Hoeren', 'Audio playback features for podcast listeners including speed control, downloads, timers, and transcript support.', 'Audio-Wiedergabefunktionen fuer Podcast-Hoerer einschliesslich Geschwindigkeitssteuerung, Downloads, Timer und Transkript-Unterstuetzung.', 200),
  ('podcasts', 'hosting_publishing', 'Hosting & Publishing', 'Hosting & Veroeffentlichung', 'Features for podcast creators to host, distribute, and manage their show files, feeds, and analytics.', 'Funktionen fuer Podcast-Ersteller zum Hosten, Verteilen und Verwalten ihrer Sendungsdateien, Feeds und Analysen.', 300),
  ('podcasts', 'monetization_creator', 'Monetization & Creator Tools', 'Monetarisierung & Creator-Werkzeuge', 'Revenue generation and audience engagement tools available to podcast creators and publishers.', 'Einnahmegenerierung und Publikumsbindungswerkzeuge fuer Podcast-Ersteller und Herausgeber.', 400),
  ('podcasts', 'platform_apps', 'Platform & Apps', 'Plattform & Apps', 'Operating systems, devices, and platform integrations where the podcast tool is available.', 'Betriebssysteme, Geraete und Plattformintegrationen, auf denen das Podcast-Werkzeug verfuegbar ist.', 500),
  ('podcasts', 'privacy_data', 'Privacy & Data', 'Datenschutz & Daten', 'Data collection practices, tracking behavior, and user privacy protections in the podcast tool.', 'Datenerfassungspraktiken, Tracking-Verhalten und Datenschutz im Podcast-Werkzeug.', 600),
  ('podcasts', 'openness_standards', 'Openness & Standards', 'Offenheit & Standards', 'Source code availability, licensing, and adherence to open podcasting standards and protocols.', 'Quellcode-Verfuegbarkeit, Lizenzierung und Einhaltung offener Podcasting-Standards und Protokolle.', 700),
  ('podcasts', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Cost structure, free tier availability, and target user profiles for the podcast tool.', 'Kostenstruktur, Verfuegbarkeit kostenloser Versionen und Zielbenutzerprofile fuer das Podcast-Werkzeug.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'podcasts' AS category_id, 'content_access' AS group_key, 'feed_protocol_support' AS criterion_key, 'Feed protocol support' AS label_en, 'Feed-Protokoll-Unterstuetzung' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'The feed protocols supported for subscribing to and receiving podcast episode updates.' AS help_text_en, 'Die unterstuetzten Feed-Protokolle zum Abonnieren und Empfangen von Podcast-Episoden-Updates.' AS help_text_de
  UNION ALL SELECT 'podcasts', 'content_access', 'directory_integration', 'Podcast directory integration', 'Podcast-Verzeichnisintegration', 'multi_enum', 'informational', 'multi_select', 1020, 'Which podcast directories and indexes are integrated for discovering and subscribing to shows.', 'Welche Podcast-Verzeichnisse und Indizes fuer das Entdecken und Abonnieren von Sendungen integriert sind.'
  UNION ALL SELECT 'podcasts', 'content_access', 'search_discovery_model', 'Search & discovery model', 'Such- und Entdeckungsmodell', 'enum', 'tradeoff', 'optional', 1030, 'How the platform helps users find new podcasts, from algorithmic recommendations to open index search.', 'Wie die Plattform Benutzern hilft, neue Podcasts zu finden, von algorithmischen Empfehlungen bis zur offenen Indexsuche.'
  UNION ALL SELECT 'podcasts', 'content_access', 'exclusive_content_model', 'Exclusive content model', 'Exklusivinhalt-Modell', 'enum', 'tradeoff', 'optional', 1040, 'Whether the platform locks content behind its own ecosystem or keeps all shows available via open feeds.', 'Ob die Plattform Inhalte hinter ihrem eigenen Oekosystem sperrt oder alle Sendungen ueber offene Feeds verfuegbar haelt.'
  UNION ALL SELECT 'podcasts', 'content_access', 'opml_import_export', 'OPML import/export', 'OPML-Import/Export', 'boolean', 'beneficial', 'optional', 1050, 'Whether podcast subscriptions can be imported and exported via OPML files for portability between apps.', 'Ob Podcast-Abonnements ueber OPML-Dateien fuer die Portabilitaet zwischen Apps importiert und exportiert werden koennen.'
  UNION ALL SELECT 'podcasts', 'content_access', 'chapter_support', 'Chapter support', 'Kapitel-Unterstuetzung', 'boolean', 'informational', 'optional', 1060, 'Whether the player or platform supports in-episode chapter markers for navigation within episodes.', 'Ob der Player oder die Plattform In-Episoden-Kapitelmarker fuer die Navigation innerhalb von Episoden unterstuetzt.'
  UNION ALL SELECT 'podcasts', 'playback_listening', 'variable_playback_speed', 'Variable playback speed', 'Variable Wiedergabegeschwindigkeit', 'boolean', 'beneficial', 'optional', 2010, 'Whether the player supports adjusting audio playback speed for faster or slower listening.', 'Ob der Player die Anpassung der Audio-Wiedergabegeschwindigkeit fuer schnelleres oder langsameres Hoeren unterstuetzt.'
  UNION ALL SELECT 'podcasts', 'playback_listening', 'offline_download', 'Offline download', 'Offline-Download', 'boolean', 'beneficial', 'must_match', 2020, 'Whether episodes can be downloaded for offline listening without an active internet connection.', 'Ob Episoden zum Offline-Hoeren ohne aktive Internetverbindung heruntergeladen werden koennen.'
  UNION ALL SELECT 'podcasts', 'playback_listening', 'sleep_timer', 'Sleep timer', 'Schlaftimer', 'boolean', 'informational', 'optional', 2030, 'Whether the player includes a sleep timer that automatically pauses playback after a set duration.', 'Ob der Player einen Schlaftimer enthaelt, der die Wiedergabe nach einer festgelegten Dauer automatisch pausiert.'
  UNION ALL SELECT 'podcasts', 'playback_listening', 'queue_management', 'Queue management', 'Warteschlangenverwaltung', 'enum', 'informational', 'optional', 2040, 'The level of control users have over their episode playback queue and ordering.', 'Das Kontrollniveau, das Benutzer ueber ihre Episoden-Wiedergabewarteschlange und -reihenfolge haben.'
  UNION ALL SELECT 'podcasts', 'playback_listening', 'transcript_support', 'Transcript support', 'Transkript-Unterstuetzung', 'enum', 'informational', 'optional', 2050, 'Whether the platform supports episode transcripts and how they are generated or provided.', 'Ob die Plattform Episoden-Transkripte unterstuetzt und wie diese generiert oder bereitgestellt werden.'
  UNION ALL SELECT 'podcasts', 'playback_listening', 'silence_trimming', 'Silence trimming/skip', 'Stille-Kuerzung/Uebersprung', 'boolean', 'informational', 'optional', 2060, 'Whether the player can automatically detect and skip or shorten silent passages in episodes.', 'Ob der Player stille Passagen in Episoden automatisch erkennen und ueberspringen oder verkuerzen kann.'
  UNION ALL SELECT 'podcasts', 'hosting_publishing', 'hosting_type', 'Hosting type', 'Hosting-Typ', 'enum', 'informational', 'must_match', 3010, 'The type of podcast hosting service provided, from full media hosting to feed-only management.', 'Die Art des bereitgestellten Podcast-Hosting-Dienstes, von vollstaendigem Medienhosting bis zur reinen Feed-Verwaltung.'
  UNION ALL SELECT 'podcasts', 'hosting_publishing', 'storage_model', 'Storage model', 'Speichermodell', 'enum', 'tradeoff', 'optional', 3020, 'How storage space for podcast media files is allocated and limited on the hosting platform.', 'Wie Speicherplatz fuer Podcast-Mediendateien auf der Hosting-Plattform zugeteilt und begrenzt wird.'
  UNION ALL SELECT 'podcasts', 'hosting_publishing', 'rss_feed_ownership', 'RSS feed ownership', 'RSS-Feed-Eigentuemerschaft', 'boolean', 'beneficial', 'optional', 3030, 'Whether the podcast creator retains full ownership and control over their RSS feed URL.', 'Ob der Podcast-Ersteller die volle Eigentumsrechte und Kontrolle ueber seine RSS-Feed-URL behaelt.'
  UNION ALL SELECT 'podcasts', 'hosting_publishing', 'distribution_directories', 'Distribution to directories', 'Verteilung an Verzeichnisse', 'multi_enum', 'informational', 'multi_select', 3040, 'Which major podcast directories the hosting platform can automatically submit and distribute shows to.', 'An welche grossen Podcast-Verzeichnisse die Hosting-Plattform Sendungen automatisch uebermitteln und verteilen kann.'
  UNION ALL SELECT 'podcasts', 'hosting_publishing', 'custom_domain_support', 'Custom domain support', 'Benutzerdefinierte-Domain-Unterstuetzung', 'boolean', 'informational', 'optional', 3050, 'Whether the hosting platform allows podcasters to use their own custom domain for their podcast page.', 'Ob die Hosting-Plattform Podcastern erlaubt, ihre eigene benutzerdefinierte Domain fuer ihre Podcast-Seite zu verwenden.'
  UNION ALL SELECT 'podcasts', 'hosting_publishing', 'analytics_dashboard', 'Analytics dashboard', 'Analyse-Dashboard', 'boolean', 'informational', 'optional', 3060, 'Whether the platform provides a dashboard with listener statistics and episode performance metrics.', 'Ob die Plattform ein Dashboard mit Hoererstatistiken und Episoden-Leistungskennzahlen bereitstellt.'
  UNION ALL SELECT 'podcasts', 'monetization_creator', 'monetization_model', 'Monetization model', 'Monetarisierungsmodell', 'multi_enum', 'informational', 'multi_select', 4010, 'The revenue generation methods available to podcast creators on the platform.', 'Die Einnahmegenerierungsmethoden, die Podcast-Erstellern auf der Plattform zur Verfuegung stehen.'
  UNION ALL SELECT 'podcasts', 'monetization_creator', 'value_4_value_payments', 'Value 4 Value / Podcasting 2.0 payments', 'Value-4-Value / Podcasting-2.0-Zahlungen', 'boolean', 'informational', 'optional', 4020, 'Whether the platform supports Podcasting 2.0 Value 4 Value streaming payments via Bitcoin or Lightning.', 'Ob die Plattform Podcasting-2.0-Value-4-Value-Streaming-Zahlungen ueber Bitcoin oder Lightning unterstuetzt.'
  UNION ALL SELECT 'podcasts', 'monetization_creator', 'listener_engagement', 'Listener engagement features', 'Hoerer-Engagement-Funktionen', 'multi_enum', 'informational', 'multi_select', 4030, 'Interactive features that allow listeners to engage with podcast creators beyond passive listening.', 'Interaktive Funktionen, die es Hoerern ermoeglichen, ueber passives Hoeren hinaus mit Podcast-Erstellern zu interagieren.'
  UNION ALL SELECT 'podcasts', 'monetization_creator', 'collaboration_tools', 'Collaboration tools', 'Zusammenarbeitswerkzeuge', 'boolean', 'informational', 'optional', 4040, 'Whether the platform provides tools for remote recording, multi-host production, or collaborative editing.', 'Ob die Plattform Werkzeuge fuer Fernaufnahme, Mehrfach-Host-Produktion oder gemeinschaftliche Bearbeitung bereitstellt.'
  UNION ALL SELECT 'podcasts', 'monetization_creator', 'embeddable_player', 'Embeddable player', 'Einbettbarer Player', 'boolean', 'informational', 'optional', 4050, 'Whether the platform offers an embeddable audio player widget for use on external websites.', 'Ob die Plattform ein einbettbares Audio-Player-Widget zur Verwendung auf externen Webseiten anbietet.'
  UNION ALL SELECT 'podcasts', 'platform_apps', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'The operating systems and device platforms on which the podcast app or service is available.', 'Die Betriebssysteme und Geraeteplattformen, auf denen die Podcast-App oder der Dienst verfuegbar ist.'
  UNION ALL SELECT 'podcasts', 'platform_apps', 'web_player_available', 'Web player available', 'Web-Player verfuegbar', 'boolean', 'beneficial', 'optional', 5020, 'Whether the service provides a browser-based web player for listening without installing an app.', 'Ob der Dienst einen browserbasierten Web-Player zum Hoeren ohne App-Installation bereitstellt.'
  UNION ALL SELECT 'podcasts', 'platform_apps', 'smart_speaker_support', 'Smart speaker support', 'Smart-Speaker-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 5030, 'Which smart speaker ecosystems are supported for voice-controlled podcast playback.', 'Welche Smart-Speaker-Oekosysteme fuer sprachgesteuerte Podcast-Wiedergabe unterstuetzt werden.'
  UNION ALL SELECT 'podcasts', 'platform_apps', 'car_integration', 'Car integration', 'Auto-Integration', 'multi_enum', 'informational', 'multi_select', 5040, 'Which automotive infotainment integrations are supported for in-car podcast listening.', 'Welche Automobil-Infotainment-Integrationen fuer das Podcast-Hoeren im Auto unterstuetzt werden.'
  UNION ALL SELECT 'podcasts', 'platform_apps', 'api_available', 'API available', 'API verfuegbar', 'boolean', 'beneficial', 'optional', 5050, 'Whether the platform provides a public API for developers to build integrations and extensions.', 'Ob die Plattform eine oeffentliche API fuer Entwickler zum Erstellen von Integrationen und Erweiterungen bereitstellt.'
  UNION ALL SELECT 'podcasts', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 6010, 'The geographic region where user data and listening analytics are processed and stored.', 'Die geografische Region, in der Benutzerdaten und Hoeranalysen verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'podcasts', 'privacy_data', 'listening_data_collection', 'Listening data collection', 'Hoerdaten-Erfassung', 'enum', 'risk', 'optional', 6020, 'How much listening behavior data the platform collects and how it is used or shared.', 'Wie viele Hoerverhaltensdaten die Plattform sammelt und wie diese verwendet oder weitergegeben werden.'
  UNION ALL SELECT 'podcasts', 'privacy_data', 'ad_tracking_model', 'Ad tracking model', 'Werbe-Tracking-Modell', 'enum', 'risk', 'optional', 6030, 'The advertising and user tracking approach used by the platform, if any.', 'Der von der Plattform verwendete Werbe- und Benutzer-Tracking-Ansatz, falls vorhanden.'
  UNION ALL SELECT 'podcasts', 'privacy_data', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 6040, 'Whether creating a user account is required before the podcast tool can be used.', 'Ob das Erstellen eines Benutzerkontos erforderlich ist, bevor das Podcast-Werkzeug verwendet werden kann.'
  UNION ALL SELECT 'podcasts', 'privacy_data', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 6050, 'Whether users can export their listening history, subscriptions, and personal data from the platform.', 'Ob Benutzer ihren Hoerverlauf, Abonnements und persoenliche Daten von der Plattform exportieren koennen.'
  UNION ALL SELECT 'podcasts', 'openness_standards', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'The availability and openness of the podcast tool source code for independent review and contribution.', 'Die Verfuegbarkeit und Offenheit des Podcast-Werkzeug-Quellcodes fuer unabhaengige Ueberpruefung und Beitraege.'
  UNION ALL SELECT 'podcasts', 'openness_standards', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7020, 'The software license governing the redistribution and use of the podcast tool.', 'Die Softwarelizenz, die die Weiterverbreitung und Nutzung des Podcast-Werkzeugs regelt.'
  UNION ALL SELECT 'podcasts', 'openness_standards', 'podcasting_2_0_support', 'Podcasting 2.0 support', 'Podcasting-2.0-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 7030, 'Which Podcasting 2.0 namespace features are supported by the player or hosting platform.', 'Welche Podcasting-2.0-Namespace-Funktionen vom Player oder der Hosting-Plattform unterstuetzt werden.'
  UNION ALL SELECT 'podcasts', 'openness_standards', 'open_protocol_commitment', 'Open protocol commitment', 'Offenes-Protokoll-Engagement', 'enum', 'informational', 'optional', 7040, 'Whether the platform prioritizes open RSS-based distribution or proprietary delivery channels.', 'Ob die Plattform offene RSS-basierte Verbreitung oder proprietaere Vertriebskanaele priorisiert.'
  UNION ALL SELECT 'podcasts', 'openness_standards', 'self_hosting_available', 'Self-hosting available', 'Selbst-Hosting verfuegbar', 'boolean', 'beneficial', 'must_match', 7050, 'Whether the podcast platform can be installed and operated on self-managed infrastructure.', 'Ob die Podcast-Plattform auf selbstverwalteter Infrastruktur installiert und betrieben werden kann.'
  UNION ALL SELECT 'podcasts', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'The pricing structure for using the podcast tool, from free to subscription to pay-per-use.', 'Die Preisstruktur fuer die Nutzung des Podcast-Werkzeugs, von kostenlos ueber Abonnement bis Nutzungsgebuehr.'
  UNION ALL SELECT 'podcasts', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfuegbar', 'boolean', 'informational', 'must_match', 8020, 'Whether a functional free version is available without payment or time-limited trial restrictions.', 'Ob eine funktionsfaehige kostenlose Version ohne Zahlungs- oder zeitlich begrenzte Testbeschraenkungen verfuegbar ist.'
  UNION ALL SELECT 'podcasts', 'pricing_fit', 'free_tier_limitations', 'Free tier limitations', 'Einschraenkungen der kostenlosen Version', 'multi_enum', 'tradeoff', 'multi_select', 8030, 'The restrictions and limitations imposed on the free tier of the podcast tool.', 'Die Einschraenkungen und Begrenzungen, die fuer die kostenlose Version des Podcast-Werkzeugs gelten.'
  UNION ALL SELECT 'podcasts', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'Target user roles and use cases the podcast tool is best suited for based on its feature set.', 'Zielbenutzerrollen und Anwendungsfaelle, fuer die das Podcast-Werkzeug basierend auf seinem Funktionsumfang am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'podcasts' AS category_id, 'feed_protocol_support' AS criterion_key, 'rss' AS option_key, 'RSS' AS label_en, 'RSS' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'podcasts', 'feed_protocol_support', 'atom', 'Atom', 'Atom', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'feed_protocol_support', 'podcasting_2_0', 'Podcasting 2.0', 'Podcasting 2.0', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'feed_protocol_support', 'proprietary', 'Proprietary feed', 'Proprietaerer Feed', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'directory_integration', 'apple_podcasts', 'Apple Podcasts', 'Apple Podcasts', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'directory_integration', 'podcastindex', 'Podcast Index', 'Podcast Index', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'directory_integration', 'spotify', 'Spotify', 'Spotify', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'directory_integration', 'custom_self_hosted', 'Custom/self-hosted', 'Benutzerdefiniert/selbst gehostet', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'search_discovery_model', 'algorithmic', 'Algorithmic', 'Algorithmisch', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'search_discovery_model', 'editorial', 'Editorial', 'Redaktionell', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'search_discovery_model', 'manual_only', 'Manual only', 'Nur manuell', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'search_discovery_model', 'open_index', 'Open index', 'Offener Index', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'exclusive_content_model', 'none', 'No exclusives', 'Keine Exklusivinhalte', 'positive', 10
  UNION ALL SELECT 'podcasts', 'exclusive_content_model', 'minor', 'Minor exclusives', 'Geringe Exklusivinhalte', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'exclusive_content_model', 'significant', 'Significant exclusives', 'Erhebliche Exklusivinhalte', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'exclusive_content_model', 'platform_locked', 'Platform locked', 'Plattformgebunden', 'warning', 40
  UNION ALL SELECT 'podcasts', 'queue_management', 'basic', 'Basic', 'Einfach', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'queue_management', 'advanced_reorder', 'Advanced reorder', 'Erweiterte Neuordnung', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'queue_management', 'smart_queue', 'Smart queue', 'Intelligente Warteschlange', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'transcript_support', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'transcript_support', 'auto_generated', 'Auto-generated', 'Automatisch generiert', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'transcript_support', 'manual', 'Manual', 'Manuell', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'transcript_support', 'both', 'Both', 'Beides', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'hosting_type', 'full_hosting', 'Full hosting', 'Vollstaendiges Hosting', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'hosting_type', 'feed_only', 'Feed only', 'Nur Feed', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'hosting_type', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'hosting_type', 'player_only', 'Player only', 'Nur Player', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'storage_model', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'podcasts', 'storage_model', 'tiered_limit', 'Tiered limit', 'Gestaffelte Begrenzung', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'storage_model', 'per_episode', 'Per episode', 'Pro Episode', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'distribution_directories', 'apple', 'Apple Podcasts', 'Apple Podcasts', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'distribution_directories', 'spotify', 'Spotify', 'Spotify', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'distribution_directories', 'google', 'Google Podcasts', 'Google Podcasts', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'distribution_directories', 'auto_submit', 'Auto-submit', 'Automatische Einreichung', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'monetization_model', 'listener_donations', 'Listener donations', 'Hoerer-Spenden', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'monetization_model', 'premium_episodes', 'Premium episodes', 'Premium-Episoden', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'monetization_model', 'dynamic_ads', 'Dynamic ads', 'Dynamische Werbung', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'monetization_model', 'sponsorship_marketplace', 'Sponsorship marketplace', 'Sponsoring-Marktplatz', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'monetization_model', 'none', 'None', 'Keine', 'neutral', 50
  UNION ALL SELECT 'podcasts', 'listener_engagement', 'comments', 'Comments', 'Kommentare', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'listener_engagement', 'boostagrams', 'Boostagrams', 'Boostagrams', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'listener_engagement', 'polls', 'Polls', 'Umfragen', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'listener_engagement', 'q_and_a', 'Q&A', 'Fragen und Antworten', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 50
  UNION ALL SELECT 'podcasts', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'podcasts', 'smart_speaker_support', 'alexa', 'Alexa', 'Alexa', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'smart_speaker_support', 'google_assistant', 'Google Assistant', 'Google Assistant', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'smart_speaker_support', 'sonos', 'Sonos', 'Sonos', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'car_integration', 'android_auto', 'Android Auto', 'Android Auto', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'car_integration', 'carplay', 'CarPlay', 'CarPlay', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'podcasts', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'podcasts', 'data_processing_location', 'local', 'Local', 'Lokal', 'positive', 40
  UNION ALL SELECT 'podcasts', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 50
  UNION ALL SELECT 'podcasts', 'listening_data_collection', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'podcasts', 'listening_data_collection', 'anonymous_aggregate', 'Anonymous aggregate', 'Anonyme Aggregation', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'listening_data_collection', 'personal_profiling', 'Personal profiling', 'Persoenliche Profilierung', 'warning', 30
  UNION ALL SELECT 'podcasts', 'listening_data_collection', 'sold', 'Sold to third parties', 'An Dritte verkauft', 'warning', 40
  UNION ALL SELECT 'podcasts', 'ad_tracking_model', 'no_ads_no_tracking', 'No ads, no tracking', 'Keine Werbung, kein Tracking', 'positive', 10
  UNION ALL SELECT 'podcasts', 'ad_tracking_model', 'contextual', 'Contextual', 'Kontextbezogen', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'ad_tracking_model', 'personalized', 'Personalized', 'Personalisiert', 'warning', 30
  UNION ALL SELECT 'podcasts', 'ad_tracking_model', 'unclear', 'Unclear', 'Unklar', 'warning', 40
  UNION ALL SELECT 'podcasts', 'source_code_model', 'fully_open', 'Fully open', 'Vollstaendig offen', 'positive', 10
  UNION ALL SELECT 'podcasts', 'source_code_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'source_code_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'podcasts', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'license_type', 'mpl', 'MPL', 'MPL', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 50
  UNION ALL SELECT 'podcasts', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 60
  UNION ALL SELECT 'podcasts', 'podcasting_2_0_support', 'chapters', 'Chapters', 'Kapitel', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'podcasting_2_0_support', 'transcripts', 'Transcripts', 'Transkripte', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'podcasting_2_0_support', 'value', 'Value', 'Value', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'podcasting_2_0_support', 'soundbites', 'Soundbites', 'Soundbites', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'podcasting_2_0_support', 'live', 'Live', 'Live', 'neutral', 50
  UNION ALL SELECT 'podcasts', 'open_protocol_commitment', 'rss_first', 'RSS first', 'RSS zuerst', 'positive', 10
  UNION ALL SELECT 'podcasts', 'open_protocol_commitment', 'proprietary_first', 'Proprietary first', 'Proprietaer zuerst', 'warning', 20
  UNION ALL SELECT 'podcasts', 'open_protocol_commitment', 'both_equal', 'Both equal', 'Beide gleichwertig', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'podcasts', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'pricing_model', 'pay_per_use', 'Pay per use', 'Nutzungsbasiert', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'pricing_model', 'donation_based', 'Donation-based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'podcasts', 'free_tier_limitations', 'ads', 'Ads', 'Werbung', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'free_tier_limitations', 'episode_limit', 'Episode limit', 'Episodenbegrenzung', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'free_tier_limitations', 'storage_cap', 'Storage cap', 'Speicherbegrenzung', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'free_tier_limitations', 'analytics_limited', 'Limited analytics', 'Eingeschraenkte Analysen', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'free_tier_limitations', 'bandwidth_cap', 'Bandwidth cap', 'Bandbreitenbegrenzung', 'neutral', 50
  UNION ALL SELECT 'podcasts', 'fit_profiles', 'casual_listener', 'Casual listener', 'Gelegenheitshoerer', 'neutral', 10
  UNION ALL SELECT 'podcasts', 'fit_profiles', 'power_listener', 'Power listener', 'Intensivhoerer', 'neutral', 20
  UNION ALL SELECT 'podcasts', 'fit_profiles', 'indie_podcaster', 'Indie podcaster', 'Indie-Podcaster', 'neutral', 30
  UNION ALL SELECT 'podcasts', 'fit_profiles', 'professional_podcaster', 'Professional podcaster', 'Professioneller Podcaster', 'neutral', 40
  UNION ALL SELECT 'podcasts', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 50
  UNION ALL SELECT 'podcasts', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzorientiert', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'podcasts'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'podcasts'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('048-podcasts-matrix-criteria');
