-- Migration 067: Add Game Stores category and matrix metadata.

INSERT INTO `countries` (`code`, `label_en`, `label_de`, `sort_order`)
VALUES ('br', 'Brazil', 'Brasilien', 31)
ON DUPLICATE KEY UPDATE
  `label_en` = VALUES(`label_en`),
  `label_de` = VALUES(`label_de`),
  `sort_order` = VALUES(`sort_order`);

INSERT INTO `categories`
  (`id`, `emoji`, `name_en`, `name_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  (
    'game-stores',
    '🎮',
    'Game Stores & Launchers',
    'Game-Stores & Launcher',
    'Game storefronts, launchers, library managers, and compatibility runners',
    'Game-Stores, Launcher, Bibliotheksmanager und Kompatibilitäts-Runner',
    315
  )
ON DUPLICATE KEY UPDATE
  `emoji` = VALUES(`emoji`),
  `name_en` = VALUES(`name_en`),
  `name_de` = VALUES(`name_de`),
  `description_en` = VALUES(`description_en`),
  `description_de` = VALUES(`description_de`),
  `sort_order` = VALUES(`sort_order`);

INSERT IGNORE INTO `landing_group_categories` (`group_id`, `category_id`, `sort_order`)
SELECT
  lg.`id`,
  'game-stores',
  COALESCE(MAX(lgc.`sort_order`), -1) + 1
FROM `landing_category_groups` lg
LEFT JOIN `landing_group_categories` lgc
  ON lgc.`group_id` = lg.`id`
WHERE lg.`slug` = 'social-entertainment'
GROUP BY lg.`id`;

INSERT INTO `category_us_vendors` (`category_id`, `entry_id`, `raw_name`, `sort_order`)
VALUES
  ('game-stores', NULL, 'Steam', 0),
  ('game-stores', NULL, 'Epic Games Store', 1),
  ('game-stores', NULL, 'EA app', 2),
  ('game-stores', NULL, 'Ubisoft Connect', 3),
  ('game-stores', NULL, 'Battle.net', 4),
  ('game-stores', NULL, 'Xbox app', 5),
  ('game-stores', NULL, 'PlayStation Store', 6),
  ('game-stores', NULL, 'Amazon Games', 7),
  ('game-stores', NULL, 'Humble Bundle', 8)
ON DUPLICATE KEY UPDATE
  `raw_name` = VALUES(`raw_name`);

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('game-stores', 'store_catalog', 'Store & Catalog', 'Store & Katalog', 'Storefront scope, catalog model, marketplace role, and DRM-free availability.', 'Storefront-Umfang, Katalogmodell, Marktplatzrolle und DRM-freie Verfügbarkeit.', 100),
  ('game-stores', 'launcher_runner', 'Launcher & Compatibility', 'Launcher & Kompatibilität', 'Library aggregation, external launcher support, compatibility layers, and runner management.', 'Bibliotheksaggregation, externe Launcher-Unterstützung, Kompatibilitätsschichten und Runner-Verwaltung.', 200),
  ('game-stores', 'ownership_access', 'Ownership & Access', 'Besitz & Zugriff', 'DRM model, offline play, account requirements, and export or backup options.', 'DRM-Modell, Offline-Spiel, Kontoanforderungen sowie Export- oder Backup-Optionen.', 300),
  ('game-stores', 'platforms_devices', 'Platforms & Devices', 'Plattformen & Geräte', 'Supported operating systems, device classes, web access, and handheld compatibility.', 'Unterstützte Betriebssysteme, Geräteklassen, Webzugriff und Handheld-Kompatibilität.', 400),
  ('game-stores', 'social_multiplayer', 'Social & Multiplayer', 'Social & Multiplayer', 'Social, multiplayer, achievements, community, and parental-control features.', 'Social-, Multiplayer-, Achievement-, Community- und Kinderschutzfunktionen.', 500),
  ('game-stores', 'creator_developer', 'Creator & Developer', 'Creator & Entwickler', 'Developer publishing, revenue share, payout reach, analytics, and community page support.', 'Entwicklerpublishing, Umsatzbeteiligung, Auszahlungsreichweite, Analytics und Community-Seiten.', 600),
  ('game-stores', 'privacy_account', 'Privacy & Account', 'Datenschutz & Konto', 'Account requirements, store telemetry, profile visibility, data export, and account deletion.', 'Kontoanforderungen, Store-Telemetrie, Profilsichtbarkeit, Datenexport und Konto-Löschung.', 700),
  ('game-stores', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free access, and common user profiles the product is best suited for.', 'Preismodell, kostenloser Zugriff und typische Nutzerprofile, für die das Produkt geeignet ist.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'game-stores' AS category_id, 'store_catalog' AS group_key, 'catalog_role' AS criterion_key, 'Catalog role' AS label_en, 'Katalogrolle' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'Primary role of the product: store, launcher, runner, key marketplace, or community game host.' AS help_text_en, 'Primäre Rolle des Produkts: Store, Launcher, Runner, Key-Marktplatz oder Community-Game-Host.' AS help_text_de
  UNION ALL SELECT 'game-stores', 'store_catalog', 'game_catalog_model', 'Game catalog model', 'Game-Katalogmodell', 'enum', 'tradeoff', 'optional', 1020, 'How games are listed, sold, indexed, or managed by the product.', 'Wie Spiele im Produkt gelistet, verkauft, indexiert oder verwaltet werden.'
  UNION ALL SELECT 'game-stores', 'store_catalog', 'direct_game_sales', 'Direct game sales', 'Direkter Spieleverkauf', 'boolean', 'informational', 'optional', 1030, 'Whether the product directly sells games to end users.', 'Ob das Produkt Spiele direkt an Endnutzer verkauft.'
  UNION ALL SELECT 'game-stores', 'store_catalog', 'third_party_key_sales', 'Third-party key marketplace', 'Drittanbieter-Key-Marktplatz', 'boolean', 'tradeoff', 'optional', 1040, 'Whether the product sells or brokers third-party activation keys rather than operating only as a direct storefront.', 'Ob das Produkt Drittanbieter-Aktivierungsschlüssel verkauft oder vermittelt, statt nur als direkter Store zu arbeiten.'
  UNION ALL SELECT 'game-stores', 'store_catalog', 'drm_free_catalog', 'DRM-free catalog', 'DRM-freier Katalog', 'boolean', 'beneficial', 'must_match', 1050, 'Whether the product offers a meaningful DRM-free catalog or DRM-free distribution path.', 'Ob das Produkt einen relevanten DRM-freien Katalog oder DRM-freien Vertriebsweg bietet.'
  UNION ALL SELECT 'game-stores', 'store_catalog', 'user_generated_games', 'User-generated games', 'Nutzergenerierte Spiele', 'boolean', 'informational', 'optional', 1060, 'Whether users or creators can publish community-made games or game jam entries.', 'Ob Nutzer oder Creator Community-Spiele oder Game-Jam-Beiträge veröffentlichen können.'
  UNION ALL SELECT 'game-stores', 'launcher_runner', 'library_aggregation', 'Library aggregation', 'Bibliotheksaggregation', 'multi_enum', 'beneficial', 'multi_select', 2010, 'External libraries or sources the product can aggregate into one launcher or collection.', 'Externe Bibliotheken oder Quellen, die das Produkt in einem Launcher oder einer Sammlung zusammenführen kann.'
  UNION ALL SELECT 'game-stores', 'launcher_runner', 'external_store_launch', 'External store launching', 'Start externer Stores', 'boolean', 'beneficial', 'optional', 2020, 'Whether the product can launch or manage games from external storefronts.', 'Ob das Produkt Spiele aus externen Storefronts starten oder verwalten kann.'
  UNION ALL SELECT 'game-stores', 'launcher_runner', 'compatibility_layer_support', 'Compatibility layer support', 'Kompatibilitätsschichten', 'multi_enum', 'beneficial', 'multi_select', 2030, 'Compatibility technologies documented for running games across platforms.', 'Dokumentierte Kompatibilitätstechnologien zum plattformübergreifenden Ausführen von Spielen.'
  UNION ALL SELECT 'game-stores', 'launcher_runner', 'runner_management', 'Runner management', 'Runner-Verwaltung', 'boolean', 'beneficial', 'optional', 2040, 'Whether the product manages Wine, Proton, emulator, or other runner versions for games.', 'Ob das Produkt Wine-, Proton-, Emulator- oder andere Runner-Versionen für Spiele verwaltet.'
  UNION ALL SELECT 'game-stores', 'launcher_runner', 'cloud_saves_sync', 'Cloud saves / sync', 'Cloud-Saves / Sync', 'boolean', 'informational', 'optional', 2050, 'Whether save-game sync or cloud save support is documented.', 'Ob Savegame-Synchronisierung oder Cloud-Save-Unterstützung dokumentiert ist.'
  UNION ALL SELECT 'game-stores', 'ownership_access', 'drm_model', 'DRM model', 'DRM-Modell', 'enum', 'tradeoff', 'must_match', 3010, 'How DRM, launcher checks, or external entitlement systems affect game access.', 'Wie DRM, Launcher-Prüfungen oder externe Berechtigungssysteme den Spielzugriff beeinflussen.'
  UNION ALL SELECT 'game-stores', 'ownership_access', 'offline_play', 'Offline play', 'Offline-Spiel', 'boolean', 'beneficial', 'must_match', 3020, 'Whether installed games can be played offline according to product documentation.', 'Ob installierte Spiele laut Produktdokumentation offline gespielt werden können.'
  UNION ALL SELECT 'game-stores', 'ownership_access', 'account_required_play', 'Account required to play', 'Konto zum Spielen erforderlich', 'enum', 'risk', 'must_match', 3030, 'When an account is required for browsing, download, launching, or continued play.', 'Wann ein Konto zum Durchsuchen, Herunterladen, Starten oder Weiterspielen erforderlich ist.'
  UNION ALL SELECT 'game-stores', 'ownership_access', 'game_backup_export', 'Game backup / export', 'Spiel-Backup / Export', 'boolean', 'beneficial', 'optional', 3040, 'Whether users can back up installers, export libraries, or preserve games outside the service client.', 'Ob Nutzer Installer sichern, Bibliotheken exportieren oder Spiele außerhalb des Dienstclients erhalten können.'
  UNION ALL SELECT 'game-stores', 'platforms_devices', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 4010, 'Operating systems, web surfaces, handhelds, or consoles the product supports.', 'Betriebssysteme, Web-Oberflächen, Handhelds oder Konsolen, die das Produkt unterstützt.'
  UNION ALL SELECT 'game-stores', 'platforms_devices', 'native_linux_support', 'Native Linux support', 'Native Linux-Unterstützung', 'boolean', 'beneficial', 'optional', 4020, 'Whether native Linux support is documented for the store, launcher, or runner.', 'Ob native Linux-Unterstützung für Store, Launcher oder Runner dokumentiert ist.'
  UNION ALL SELECT 'game-stores', 'platforms_devices', 'web_storefront', 'Web storefront', 'Web-Storefront', 'boolean', 'informational', 'optional', 4030, 'Whether games can be browsed or bought through a web storefront.', 'Ob Spiele über eine Web-Storefront durchsucht oder gekauft werden können.'
  UNION ALL SELECT 'game-stores', 'platforms_devices', 'mobile_app', 'Mobile app', 'Mobile App', 'boolean', 'informational', 'optional', 4040, 'Whether a companion or storefront mobile app is available.', 'Ob eine Companion- oder Storefront-Mobile-App verfügbar ist.'
  UNION ALL SELECT 'game-stores', 'social_multiplayer', 'friends_chat', 'Friends & chat', 'Freunde & Chat', 'boolean', 'informational', 'optional', 5010, 'Whether friend lists, chat, or presence features are built into the product.', 'Ob Freundeslisten, Chat oder Präsenzfunktionen im Produkt integriert sind.'
  UNION ALL SELECT 'game-stores', 'social_multiplayer', 'achievements', 'Achievements', 'Achievements', 'boolean', 'informational', 'optional', 5020, 'Whether achievement tracking or profile badges are supported.', 'Ob Achievement-Tracking oder Profilabzeichen unterstützt werden.'
  UNION ALL SELECT 'game-stores', 'social_multiplayer', 'multiplayer_matchmaking', 'Multiplayer matchmaking', 'Multiplayer-Matchmaking', 'boolean', 'informational', 'optional', 5030, 'Whether the product provides multiplayer matchmaking or related network services.', 'Ob das Produkt Multiplayer-Matchmaking oder zugehörige Netzwerkdienste bietet.'
  UNION ALL SELECT 'game-stores', 'social_multiplayer', 'mods_addons_support', 'Mods / add-ons support', 'Mods / Add-ons', 'boolean', 'beneficial', 'optional', 5040, 'Whether mod, add-on, or workshop-style distribution is supported.', 'Ob Mod-, Add-on- oder Workshop-ähnliche Distribution unterstützt wird.'
  UNION ALL SELECT 'game-stores', 'social_multiplayer', 'parental_controls', 'Parental controls', 'Kinderschutz', 'boolean', 'informational', 'optional', 5050, 'Whether parental controls or age/content controls are documented.', 'Ob Kinderschutz- oder Alters-/Inhaltskontrollen dokumentiert sind.'
  UNION ALL SELECT 'game-stores', 'creator_developer', 'developer_publishing', 'Developer publishing', 'Entwicklerpublishing', 'boolean', 'informational', 'optional', 6010, 'Whether developers or creators can publish games through the product.', 'Ob Entwickler oder Creator Spiele über das Produkt veröffentlichen können.'
  UNION ALL SELECT 'game-stores', 'creator_developer', 'revenue_share_model', 'Revenue share model', 'Umsatzbeteiligung', 'enum', 'tradeoff', 'optional', 6020, 'How game sales revenue is shared between creators, publishers, and the platform.', 'Wie Umsätze aus Spieleverkäufen zwischen Creatorn, Publishern und Plattform aufgeteilt werden.'
  UNION ALL SELECT 'game-stores', 'creator_developer', 'payout_regions', 'Payout region reach', 'Auszahlungsregionen', 'enum', 'informational', 'optional', 6030, 'Geographic reach of creator or developer payouts where documented.', 'Geografische Reichweite von Creator- oder Entwicklerauszahlungen, sofern dokumentiert.'
  UNION ALL SELECT 'game-stores', 'creator_developer', 'developer_analytics', 'Developer analytics', 'Entwickler-Analytics', 'boolean', 'informational', 'optional', 6040, 'Whether developers receive dashboards, sales analytics, or audience metrics.', 'Ob Entwickler Dashboards, Verkaufsanalysen oder Zielgruppenmetriken erhalten.'
  UNION ALL SELECT 'game-stores', 'creator_developer', 'community_pages', 'Community pages', 'Community-Seiten', 'boolean', 'informational', 'optional', 6050, 'Whether games can have community pages, forums, reviews, or announcements.', 'Ob Spiele Community-Seiten, Foren, Bewertungen oder Ankündigungen haben können.'
  UNION ALL SELECT 'game-stores', 'privacy_account', 'account_required_browse', 'Account required to browse', 'Konto zum Durchsuchen erforderlich', 'boolean', 'risk', 'must_match', 7010, 'Whether browsing the catalog requires a user account.', 'Ob das Durchsuchen des Katalogs ein Benutzerkonto erfordert.'
  UNION ALL SELECT 'game-stores', 'privacy_account', 'store_telemetry', 'Store telemetry', 'Store-Telemetrie', 'enum', 'risk', 'optional', 7020, 'How the product documents telemetry or usage-data collection by the store or launcher.', 'Wie das Produkt Telemetrie oder Nutzungsdatenerfassung durch Store oder Launcher dokumentiert.'
  UNION ALL SELECT 'game-stores', 'privacy_account', 'public_profile_controls', 'Public profile controls', 'Profil-Sichtbarkeitskontrollen', 'boolean', 'beneficial', 'optional', 7030, 'Whether users can control public profile, activity, or library visibility.', 'Ob Nutzer die Sichtbarkeit von Profil, Aktivität oder Bibliothek steuern können.'
  UNION ALL SELECT 'game-stores', 'privacy_account', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 7040, 'Whether personal account or purchase data can be exported.', 'Ob persönliche Konto- oder Kaufdaten exportiert werden können.'
  UNION ALL SELECT 'game-stores', 'privacy_account', 'account_deletion', 'Account deletion', 'Konto-Löschung', 'boolean', 'beneficial', 'optional', 7050, 'Whether users can delete their account and associated personal data.', 'Ob Nutzer ihr Konto und zugehörige personenbezogene Daten löschen können.'
  UNION ALL SELECT 'game-stores', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'How the product is priced for players or creators.', 'Wie das Produkt für Spieler oder Creator bepreist wird.'
  UNION ALL SELECT 'game-stores', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'must_match', 8020, 'Whether the product can be used without payment.', 'Ob das Produkt ohne Zahlung genutzt werden kann.'
  UNION ALL SELECT 'game-stores', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8030, 'Common user profiles or gaming workflows the product is especially suited for.', 'Typische Nutzerprofile oder Gaming-Workflows, für die das Produkt besonders geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'game-stores' AS category_id, 'catalog_role' AS criterion_key, 'direct_storefront' AS option_key, 'Direct storefront' AS label_en, 'Direkte Storefront' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'game-stores', 'catalog_role', 'launcher_library', 'Launcher / library manager', 'Launcher / Bibliotheksmanager', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'catalog_role', 'compatibility_runner', 'Compatibility runner', 'Kompatibilitäts-Runner', 'positive', 30
  UNION ALL SELECT 'game-stores', 'catalog_role', 'key_marketplace', 'Key marketplace', 'Key-Marktplatz', 'tradeoff', 40
  UNION ALL SELECT 'game-stores', 'catalog_role', 'community_hosting', 'Community game hosting', 'Community-Game-Hosting', 'neutral', 50
  UNION ALL SELECT 'game-stores', 'game_catalog_model', 'curated_store', 'Curated store', 'Kuratierter Store', 'neutral', 10
  UNION ALL SELECT 'game-stores', 'game_catalog_model', 'open_marketplace', 'Open marketplace', 'Offener Marktplatz', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'game_catalog_model', 'key_reseller', 'Key reseller', 'Key-Reseller', 'tradeoff', 30
  UNION ALL SELECT 'game-stores', 'game_catalog_model', 'personal_library', 'Personal library', 'Persönliche Bibliothek', 'neutral', 40
  UNION ALL SELECT 'game-stores', 'game_catalog_model', 'compatibility_database', 'Compatibility database', 'Kompatibilitätsdatenbank', 'positive', 50
  UNION ALL SELECT 'game-stores', 'library_aggregation', 'steam', 'Steam', 'Steam', 'neutral', 10
  UNION ALL SELECT 'game-stores', 'library_aggregation', 'epic', 'Epic Games Store', 'Epic Games Store', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'library_aggregation', 'gog', 'GOG', 'GOG', 'neutral', 30
  UNION ALL SELECT 'game-stores', 'library_aggregation', 'amazon', 'Amazon Games', 'Amazon Games', 'neutral', 40
  UNION ALL SELECT 'game-stores', 'library_aggregation', 'humble', 'Humble Bundle', 'Humble Bundle', 'neutral', 50
  UNION ALL SELECT 'game-stores', 'library_aggregation', 'local_files', 'Local files', 'Lokale Dateien', 'positive', 60
  UNION ALL SELECT 'game-stores', 'library_aggregation', 'emulators', 'Emulators', 'Emulatoren', 'positive', 70
  UNION ALL SELECT 'game-stores', 'compatibility_layer_support', 'wine', 'Wine', 'Wine', 'positive', 10
  UNION ALL SELECT 'game-stores', 'compatibility_layer_support', 'proton', 'Proton', 'Proton', 'positive', 20
  UNION ALL SELECT 'game-stores', 'compatibility_layer_support', 'dosbox', 'DOSBox', 'DOSBox', 'positive', 30
  UNION ALL SELECT 'game-stores', 'compatibility_layer_support', 'emulator', 'Emulator', 'Emulator', 'positive', 40
  UNION ALL SELECT 'game-stores', 'compatibility_layer_support', 'native_only', 'Native only', 'Nur nativ', 'neutral', 50
  UNION ALL SELECT 'game-stores', 'drm_model', 'drm_free_only', 'DRM-free only', 'Nur DRM-frei', 'positive', 10
  UNION ALL SELECT 'game-stores', 'drm_model', 'drm_free_optional', 'DRM-free optional', 'DRM-frei optional', 'positive', 20
  UNION ALL SELECT 'game-stores', 'drm_model', 'mixed', 'Mixed', 'Gemischt', 'neutral', 30
  UNION ALL SELECT 'game-stores', 'drm_model', 'mandatory_drm', 'Mandatory DRM', 'Pflicht-DRM', 'warning', 40
  UNION ALL SELECT 'game-stores', 'drm_model', 'external_drm', 'External DRM / launcher', 'Externes DRM / Launcher', 'warning', 50
  UNION ALL SELECT 'game-stores', 'drm_model', 'not_disclosed', 'Not disclosed', 'Nicht offengelegt', 'warning', 60
  UNION ALL SELECT 'game-stores', 'account_required_play', 'no_account', 'No account', 'Kein Konto', 'positive', 10
  UNION ALL SELECT 'game-stores', 'account_required_play', 'download_only', 'Account for download', 'Konto zum Download', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'account_required_play', 'launch_required', 'Account to launch', 'Konto zum Starten', 'warning', 30
  UNION ALL SELECT 'game-stores', 'account_required_play', 'always_online', 'Always online', 'Immer online', 'negative', 40
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'linux', 'Linux', 'Linux', 'positive', 30
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'steam_deck', 'Steam Deck', 'Steam Deck', 'positive', 70
  UNION ALL SELECT 'game-stores', 'supported_platforms', 'console', 'Console', 'Konsole', 'neutral', 80
  UNION ALL SELECT 'game-stores', 'revenue_share_model', 'no_commission', 'No commission', 'Keine Provision', 'positive', 10
  UNION ALL SELECT 'game-stores', 'revenue_share_model', 'low_commission', 'Low commission', 'Niedrige Provision', 'positive', 20
  UNION ALL SELECT 'game-stores', 'revenue_share_model', 'standard_commission', 'Standard commission', 'Standardprovision', 'neutral', 30
  UNION ALL SELECT 'game-stores', 'revenue_share_model', 'variable', 'Variable / negotiated', 'Variabel / verhandelt', 'tradeoff', 40
  UNION ALL SELECT 'game-stores', 'revenue_share_model', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'neutral', 50
  UNION ALL SELECT 'game-stores', 'payout_regions', 'broad_global', 'Broad global', 'Breit global', 'positive', 10
  UNION ALL SELECT 'game-stores', 'payout_regions', 'eu_eea', 'EU/EEA', 'EU/EWR', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'payout_regions', 'limited', 'Limited', 'Begrenzt', 'warning', 30
  UNION ALL SELECT 'game-stores', 'payout_regions', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'neutral', 40
  UNION ALL SELECT 'game-stores', 'store_telemetry', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'game-stores', 'store_telemetry', 'opt_in', 'Opt-in', 'Opt-in', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'store_telemetry', 'opt_out', 'Opt-out', 'Opt-out', 'warning', 30
  UNION ALL SELECT 'game-stores', 'store_telemetry', 'mandatory', 'Mandatory', 'Verpflichtend', 'negative', 40
  UNION ALL SELECT 'game-stores', 'store_telemetry', 'not_disclosed', 'Not disclosed', 'Nicht offengelegt', 'warning', 50
  UNION ALL SELECT 'game-stores', 'pricing_model', 'free', 'Free', 'Kostenlos', 'positive', 10
  UNION ALL SELECT 'game-stores', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'pricing_model', 'paid', 'Paid', 'Kostenpflichtig', 'neutral', 30
  UNION ALL SELECT 'game-stores', 'pricing_model', 'commission_marketplace', 'Commission marketplace', 'Provisionsmarktplatz', 'tradeoff', 40
  UNION ALL SELECT 'game-stores', 'pricing_model', 'key_resale_marketplace', 'Key resale marketplace', 'Key-Weiterverkaufsmarktplatz', 'tradeoff', 50
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'drm_free_buyers', 'DRM-free buyers', 'DRM-frei-Käufer', 'neutral', 10
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'linux_gaming', 'Linux gaming', 'Linux-Gaming', 'neutral', 20
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'retro_emulation', 'Retro / emulation', 'Retro / Emulation', 'neutral', 30
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'indie_creators', 'Indie creators', 'Indie-Creator', 'neutral', 40
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'key_shoppers', 'Key shoppers', 'Key-Käufer', 'neutral', 50
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'library_unification', 'Library unification', 'Bibliotheksbündelung', 'neutral', 60
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'mainstream_aaa', 'Mainstream AAA', 'Mainstream-AAA', 'neutral', 70
  UNION ALL SELECT 'game-stores', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT
  ce.`id`,
  mc.`category_id`,
  mc.`id`,
  'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.`entry_id` = ce.`id`
 AND ec.`category_id` = 'game-stores'
JOIN `matrix_criteria` mc
  ON mc.`category_id` = 'game-stores'
WHERE ce.`status` IN ('alternative', 'us')
  AND ce.`is_active` = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('067-game-stores-category-matrix');
