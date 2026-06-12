-- Migration 070: Add E-Readers category, comparison products, and matrix metadata.

INSERT IGNORE INTO `countries` (`code`, `label_en`, `label_de`, `sort_order`)
VALUES
  ('ca', 'Canada', 'Kanada', 25),
  ('cn', 'China', 'China', 30);

INSERT INTO `categories`
  (`id`, `emoji`, `name_en`, `name_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  (
    'e-readers',
    '📖',
    'E-Readers',
    'E-Reader',
    'Dedicated e-ink readers, ebook devices, and paper tablets',
    'Dedizierte E-Ink-Lesegeräte, E-Book-Geräte und Papier-Tablets',
    345
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
  'e-readers',
  COALESCE(MAX(lgc.`sort_order`), -1) + 1
FROM `landing_category_groups` lg
LEFT JOIN `landing_group_categories` lgc
  ON lgc.`group_id` = lg.`id`
WHERE lg.`slug` = 'social-entertainment'
GROUP BY lg.`id`;

INSERT INTO `catalog_entries`
  (`slug`, `status`, `source_file`, `is_active`, `name`, `description_en`, `description_de`, `country_code`, `website_url`, `pricing`, `is_open_source`, `open_source_level`, `self_hostable`, `founded_year`, `headquarters_city`)
VALUES
  (
    'amazon-kindle',
    'us',
    'us',
    1,
    'Amazon Kindle',
    'Amazon Kindle is included as the benchmark comparison product for e-reader alternatives.',
    'Amazon Kindle wird als Benchmark-Vergleichsprodukt für E-Reader-Alternativen geführt.',
    'us',
    'https://www.amazon.com/kindle-dbs/storefront',
    'paid',
    0,
    'none',
    0,
    NULL,
    NULL
  ),
  (
    'rakuten-kobo',
    'us',
    'us',
    1,
    'Rakuten Kobo',
    'Rakuten Kobo is a digital reading platform and e-reader brand offering Kobo eReaders, ebooks, audiobooks, and reading apps.',
    'Rakuten Kobo ist eine digitale Leseplattform und E-Reader-Marke für Kobo-E-Reader, E-Books, Hörbücher und Lese-Apps.',
    'ca',
    'https://www.kobo.com',
    'paid',
    0,
    'none',
    0,
    NULL,
    NULL
  ),
  (
    'boox',
    'us',
    'us',
    1,
    'BOOX',
    'BOOX is an Onyx-owned consumer electronics brand of Android-based E Ink e-readers and ePaper tablets for reading, writing, and productivity.',
    'BOOX ist eine zu Onyx gehörende Consumer-Electronics-Marke für Android-basierte E-Ink-E-Reader und ePaper-Tablets zum Lesen, Schreiben und Arbeiten.',
    'cn',
    'https://www.boox.com/',
    'paid',
    0,
    'none',
    0,
    NULL,
    NULL
  ),
  (
    'pocketbook',
    'alternative',
    'research',
    1,
    'PocketBook',
    'PocketBook is a brand of E Ink e-readers and e-notes produced by Pocketbook International SA.',
    'PocketBook ist eine Marke für E-Ink-E-Reader und E-Notes von Pocketbook International SA.',
    'ch',
    'https://pocketbook.ch/',
    'paid',
    0,
    'none',
    0,
    2007,
    'Lugano'
  ),
  (
    'remarkable',
    'alternative',
    'research',
    1,
    'reMarkable',
    'reMarkable makes paper tablets for focused handwriting, sketching, reading, and digital note-taking.',
    'reMarkable entwickelt Papier-Tablets für fokussiertes Schreiben, Skizzieren, Lesen und digitale Notizen.',
    'no',
    'https://remarkable.com/',
    'paid',
    0,
    'none',
    0,
    2013,
    'Oslo'
  )
ON DUPLICATE KEY UPDATE
  `status` = VALUES(`status`),
  `source_file` = VALUES(`source_file`),
  `is_active` = VALUES(`is_active`),
  `name` = VALUES(`name`),
  `description_en` = VALUES(`description_en`),
  `description_de` = VALUES(`description_de`),
  `country_code` = VALUES(`country_code`),
  `website_url` = VALUES(`website_url`),
  `pricing` = VALUES(`pricing`),
  `is_open_source` = VALUES(`is_open_source`),
  `open_source_level` = VALUES(`open_source_level`),
  `self_hostable` = VALUES(`self_hostable`),
  `founded_year` = VALUES(`founded_year`),
  `headquarters_city` = VALUES(`headquarters_city`);

INSERT INTO `category_us_vendors` (`category_id`, `entry_id`, `raw_name`, `sort_order`)
SELECT d.`category_id`, ce.`id`, d.`raw_name`, d.`sort_order`
FROM (
  SELECT 'e-readers' AS `category_id`, 'amazon-kindle' AS `slug`, 'Amazon Kindle' AS `raw_name`, 0 AS `sort_order`
  UNION ALL SELECT 'e-readers', 'rakuten-kobo', 'Rakuten Kobo', 1
  UNION ALL SELECT 'e-readers', 'boox', 'BOOX', 2
) d
JOIN `catalog_entries` ce
  ON ce.`slug` = d.`slug`
ON DUPLICATE KEY UPDATE
  `entry_id` = VALUES(`entry_id`),
  `raw_name` = VALUES(`raw_name`);

INSERT INTO `entry_categories` (`entry_id`, `category_id`, `is_primary`, `sort_order`)
SELECT
  ce.`id`,
  'e-readers',
  CASE WHEN ce.`slug` IN ('pocketbook', 'remarkable') THEN 1 ELSE 0 END,
  CASE ce.`slug`
    WHEN 'amazon-kindle' THEN 0
    WHEN 'rakuten-kobo' THEN 1
    WHEN 'boox' THEN 2
    WHEN 'pocketbook' THEN 10
    WHEN 'remarkable' THEN 20
    ELSE 99
  END
FROM `catalog_entries` ce
WHERE ce.`slug` IN ('amazon-kindle', 'rakuten-kobo', 'boox', 'pocketbook', 'remarkable')
ON DUPLICATE KEY UPDATE
  `is_primary` = VALUES(`is_primary`),
  `sort_order` = VALUES(`sort_order`);

INSERT IGNORE INTO `us_vendor_aliases` (`alias`, `entry_id`)
SELECT d.`alias`, ce.`id`
FROM (
  SELECT 'amazon-kindle' AS `slug`, 'Amazon Kindle' AS `alias`
  UNION ALL SELECT 'amazon-kindle', 'Kindle'
  UNION ALL SELECT 'rakuten-kobo', 'Rakuten Kobo'
  UNION ALL SELECT 'rakuten-kobo', 'Kobo'
  UNION ALL SELECT 'boox', 'BOOX'
  UNION ALL SELECT 'boox', 'Onyx BOOX'
) d
JOIN `catalog_entries` ce
  ON ce.`slug` = d.`slug`;

UPDATE `entry_replacements` er
JOIN `catalog_entries` kindle
  ON kindle.`slug` = 'amazon-kindle'
SET er.`raw_name` = 'Amazon Kindle',
    er.`replaced_entry_id` = kindle.`id`
WHERE LOWER(er.`raw_name`) IN ('amazon kindle', 'kindle')
   OR er.`replaced_entry_id` = kindle.`id`;

INSERT INTO `entry_replacements` (`entry_id`, `raw_name`, `replaced_entry_id`, `sort_order`)
SELECT
  alternative_entry.`id`,
  'Amazon Kindle',
  kindle.`id`,
  COALESCE(MAX(existing_er.`sort_order`), -1) + 1
FROM `catalog_entries` alternative_entry
JOIN `catalog_entries` kindle
  ON kindle.`slug` = 'amazon-kindle'
LEFT JOIN `entry_replacements` existing_er
  ON existing_er.`entry_id` = alternative_entry.`id`
WHERE alternative_entry.`slug` IN ('pocketbook', 'remarkable')
  AND NOT EXISTS (
    SELECT 1
    FROM `entry_replacements` duplicate_er
    WHERE duplicate_er.`entry_id` = alternative_entry.`id`
      AND (
        duplicate_er.`replaced_entry_id` = kindle.`id`
        OR LOWER(duplicate_er.`raw_name`) IN ('amazon kindle', 'kindle')
      )
  )
GROUP BY alternative_entry.`id`, kindle.`id`;

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('e-readers', 'device_reading', 'Device & Reading Hardware', 'Gerät & Lese-Hardware', 'Display technology, lighting, waterproofing, stylus support, and physical reading features.', 'Display-Technologie, Beleuchtung, Wasserschutz, Stiftunterstützung und physische Lesefunktionen.', 100),
  ('e-readers', 'format_ecosystem', 'Formats & Ecosystem', 'Formate & Ökosystem', 'Document formats, DRM, store integrations, library borrowing, sideloading, and audiobooks.', 'Dokumentformate, DRM, Store-Integrationen, Bibliotheksleihe, Sideloading und Hörbücher.', 200),
  ('e-readers', 'software_sync', 'Software & Sync', 'Software & Sync', 'Operating system model, app extensibility, cloud sync, notes export, and handwriting recognition.', 'Betriebssystemmodell, App-Erweiterbarkeit, Cloud-Sync, Notizexport und Handschrifterkennung.', 300),
  ('e-readers', 'privacy_account', 'Privacy & Account', 'Datenschutz & Konto', 'Account requirements, telemetry, data location, export, and account deletion.', 'Kontoanforderungen, Telemetrie, Datenstandort, Export und Konto-Löschung.', 400),
  ('e-readers', 'openness_repairability', 'Openness & Repairability', 'Offenheit & Reparierbarkeit', 'Source availability, repair model, storage expansion, and battery serviceability.', 'Quellcode-Verfügbarkeit, Reparaturmodell, Speichererweiterung und Akku-Wartbarkeit.', 500),
  ('e-readers', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Device price tier, subscription dependence, and common reader or note-taking fit profiles.', 'Gerätepreis, Abhängigkeit von Abos und typische Eignungsprofile für Lesen oder Notizen.', 600);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'e-readers' AS category_id, 'device_reading' AS group_key, 'screen_technology' AS criterion_key, 'Screen technology' AS label_en, 'Bildschirmtechnologie' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The primary display technology used for reading or note-taking.' AS help_text_en, 'Die primäre Display-Technologie für Lesen oder Notizen.' AS help_text_de
  UNION ALL SELECT 'e-readers', 'device_reading', 'screen_size_range', 'Screen size range', 'Bildschirmgröße', 'enum', 'informational', 'optional', 1020, 'The main screen size class of the current e-reader or paper tablet lineup.', 'Die wichtigste Bildschirmgrößenklasse der aktuellen E-Reader- oder Papier-Tablet-Reihe.'
  UNION ALL SELECT 'e-readers', 'device_reading', 'frontlight', 'Frontlight', 'Frontlicht', 'boolean', 'beneficial', 'optional', 1030, 'Whether the device lineup includes integrated front lighting for reading in low light.', 'Ob die Gerätereihe integriertes Frontlicht zum Lesen bei wenig Licht bietet.'
  UNION ALL SELECT 'e-readers', 'device_reading', 'warm_light', 'Warm light', 'Warmlicht', 'boolean', 'beneficial', 'optional', 1040, 'Whether adjustable warm light or color temperature controls are available.', 'Ob anpassbares Warmlicht oder Farbtemperatursteuerung verfügbar ist.'
  UNION ALL SELECT 'e-readers', 'device_reading', 'water_resistance', 'Water resistance', 'Wasserschutz', 'boolean', 'beneficial', 'optional', 1050, 'Whether at least one current mainstream device is rated for water resistance.', 'Ob mindestens ein aktuelles Hauptgerät einen Wasserschutz besitzt.'
  UNION ALL SELECT 'e-readers', 'device_reading', 'stylus_support', 'Stylus support', 'Stiftunterstützung', 'boolean', 'informational', 'must_match', 1060, 'Whether the product line supports handwritten notes with a stylus.', 'Ob die Produktreihe handschriftliche Notizen mit einem Stift unterstützt.'
  UNION ALL SELECT 'e-readers', 'device_reading', 'page_turn_buttons', 'Page-turn buttons', 'Blättertasten', 'boolean', 'informational', 'optional', 1070, 'Whether physical page-turn buttons are available on any current model.', 'Ob physische Blättertasten bei einem aktuellen Modell verfügbar sind.'
  UNION ALL SELECT 'e-readers', 'format_ecosystem', 'supported_formats', 'Supported formats', 'Unterstützte Formate', 'multi_enum', 'beneficial', 'multi_select', 2010, 'Document and ebook formats supported directly or through official tooling.', 'Dokument- und E-Book-Formate, die direkt oder über offizielle Werkzeuge unterstützt werden.'
  UNION ALL SELECT 'e-readers', 'format_ecosystem', 'drm_support', 'DRM support', 'DRM-Unterstützung', 'multi_enum', 'tradeoff', 'multi_select', 2020, 'DRM systems or DRM-free modes supported by the product ecosystem.', 'DRM-Systeme oder DRM-freie Modi, die vom Produktökosystem unterstützt werden.'
  UNION ALL SELECT 'e-readers', 'format_ecosystem', 'store_integration', 'Store integration', 'Store-Integration', 'multi_enum', 'informational', 'multi_select', 2030, 'Integrated stores or book sources available from the device or companion apps.', 'Integrierte Stores oder Buchquellen, die über Gerät oder Begleit-Apps verfügbar sind.'
  UNION ALL SELECT 'e-readers', 'format_ecosystem', 'library_borrowing', 'Library borrowing', 'Bibliotheksleihe', 'enum', 'beneficial', 'optional', 2040, 'Whether public-library borrowing is supported through OverDrive, Adobe DRM, or manual transfer.', 'Ob öffentliche Bibliotheksleihe über OverDrive, Adobe DRM oder manuelle Übertragung unterstützt wird.'
  UNION ALL SELECT 'e-readers', 'format_ecosystem', 'sideloading', 'Sideloading', 'Sideloading', 'boolean', 'beneficial', 'must_match', 2050, 'Whether users can load their own ebooks or documents without buying from the vendor store.', 'Ob Nutzer eigene E-Books oder Dokumente laden können, ohne im Anbieter-Store zu kaufen.'
  UNION ALL SELECT 'e-readers', 'format_ecosystem', 'audiobook_support', 'Audiobook support', 'Hörbuch-Unterstützung', 'boolean', 'informational', 'optional', 2060, 'Whether audiobooks can be played through the device or first-party reading ecosystem.', 'Ob Hörbücher über das Gerät oder das First-Party-Leseökosystem abgespielt werden können.'
  UNION ALL SELECT 'e-readers', 'software_sync', 'operating_system' AS criterion_key, 'Operating system', 'Betriebssystem', 'enum', 'informational', 'optional', 3010, 'The operating system or software base used by the device.', 'Das Betriebssystem oder die Software-Basis des Geräts.'
  UNION ALL SELECT 'e-readers', 'software_sync', 'third_party_apps', 'Third-party apps', 'Drittanbieter-Apps', 'enum', 'tradeoff', 'optional', 3020, 'Whether third-party apps can be installed or used on the device.', 'Ob Drittanbieter-Apps auf dem Gerät installiert oder genutzt werden können.'
  UNION ALL SELECT 'e-readers', 'software_sync', 'cloud_sync_model', 'Cloud sync model', 'Cloud-Sync-Modell', 'enum', 'tradeoff', 'must_match', 3030, 'How reading position, notes, documents, or libraries sync across devices.', 'Wie Leseposition, Notizen, Dokumente oder Bibliotheken zwischen Geräten synchronisiert werden.'
  UNION ALL SELECT 'e-readers', 'software_sync', 'note_export_formats', 'Note export formats', 'Notiz-Exportformate', 'multi_enum', 'beneficial', 'multi_select', 3040, 'Formats available for exporting notes, annotations, highlights, or handwritten pages.', 'Formate zum Export von Notizen, Anmerkungen, Markierungen oder handschriftlichen Seiten.'
  UNION ALL SELECT 'e-readers', 'software_sync', 'handwriting_recognition', 'Handwriting recognition', 'Handschrifterkennung', 'enum', 'informational', 'optional', 3050, 'Whether handwritten notes can be converted to typed text.', 'Ob handschriftliche Notizen in getippten Text umgewandelt werden können.'
  UNION ALL SELECT 'e-readers', 'privacy_account', 'account_requirement', 'Account requirement', 'Kontoanforderung', 'enum', 'risk', 'must_match', 4010, 'When a vendor account is required for setup, store use, sync, or reading.', 'Wann ein Anbieter-Konto für Einrichtung, Store-Nutzung, Sync oder Lesen erforderlich ist.'
  UNION ALL SELECT 'e-readers', 'privacy_account', 'telemetry_model', 'Telemetry model', 'Telemetrie-Modell', 'enum', 'risk', 'optional', 4020, 'How the vendor documents device, app, or reading telemetry.', 'Wie der Anbieter Geräte-, App- oder Lesetelemetrie dokumentiert.'
  UNION ALL SELECT 'e-readers', 'privacy_account', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 4030, 'Where account, sync, store, or reading data is primarily processed when cloud features are used.', 'Wo Konto-, Sync-, Store- oder Lesedaten bei Cloud-Funktionen hauptsaechlich verarbeitet werden.'
  UNION ALL SELECT 'e-readers', 'privacy_account', 'local_file_transfer', 'Local file transfer', 'Lokale Dateiübertragung', 'boolean', 'beneficial', 'optional', 4040, 'Whether documents can be transferred locally over USB or local network without a cloud upload.', 'Ob Dokumente lokal per USB oder lokalem Netzwerk ohne Cloud-Upload übertragen werden können.'
  UNION ALL SELECT 'e-readers', 'privacy_account', 'account_deletion', 'Account deletion', 'Konto-Löschung', 'boolean', 'beneficial', 'optional', 4050, 'Whether users can delete their account and associated personal data.', 'Ob Nutzer ihr Konto und zugehörige personenbezogene Daten löschen können.'
  UNION ALL SELECT 'e-readers', 'openness_repairability', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 5010, 'The availability and openness of device software or companion-app source code.', 'Die Verfügbarkeit und Offenheit von Gerätesoftware oder Begleit-App-Quellcode.'
  UNION ALL SELECT 'e-readers', 'openness_repairability', 'repairability_model', 'Repairability model', 'Reparierbarkeitsmodell', 'enum', 'tradeoff', 'optional', 5020, 'How repairs, parts, and service are handled for devices.', 'Wie Reparaturen, Ersatzteile und Service für Geräte gehandhabt werden.'
  UNION ALL SELECT 'e-readers', 'openness_repairability', 'storage_expandable', 'Expandable storage', 'Erweiterbarer Speicher', 'boolean', 'beneficial', 'optional', 5030, 'Whether users can expand storage with a removable memory card or similar option.', 'Ob Nutzer den Speicher mit Speicherkarte oder aehnlicher Option erweitern können.'
  UNION ALL SELECT 'e-readers', 'openness_repairability', 'battery_serviceable', 'Battery serviceable', 'Akku wartbar', 'boolean', 'beneficial', 'optional', 5040, 'Whether the battery can be serviced by the user, vendor, or authorized repair network.', 'Ob der Akku durch Nutzer, Anbieter oder autorisierte Reparaturstellen gewartet werden kann.'
  UNION ALL SELECT 'e-readers', 'pricing_fit', 'device_price_tier', 'Device price tier', 'Gerätepreis', 'enum', 'informational', 'optional', 6010, 'The broad price tier of the current device lineup.', 'Die grobe Preisklasse der aktuellen Gerätereihe.'
  UNION ALL SELECT 'e-readers', 'pricing_fit', 'subscription_required', 'Subscription required', 'Abo erforderlich', 'boolean', 'risk', 'must_match', 6020, 'Whether core reading, writing, sync, or export features require an ongoing subscription.', 'Ob Kernfunktionen für Lesen, Schreiben, Sync oder Export ein laufendes Abo erfordern.'
  UNION ALL SELECT 'e-readers', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 6030, 'Reader or note-taking workflows the product is especially suited for.', 'Lese- oder Notiz-Workflows, für die das Produkt besonders geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'e-readers' AS category_id, 'screen_technology' AS criterion_key, 'bw_eink' AS option_key, 'Black-and-white E Ink' AS label_en, 'Schwarz-weiss E Ink' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'e-readers', 'screen_technology', 'color_eink', 'Color E Ink', 'Farb-E-Ink', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'screen_technology', 'lcd_oled', 'LCD / OLED', 'LCD / OLED', 'warning', 30
  UNION ALL SELECT 'e-readers', 'screen_technology', 'paper_tablet', 'Paper tablet', 'Papier-Tablet', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'screen_size_range', 'under_7', 'Under 7 inches', 'Unter 7 Zoll', 'neutral', 10
  UNION ALL SELECT 'e-readers', 'screen_size_range', 'seven_to_eight', '7-8 inches', '7-8 Zoll', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'screen_size_range', 'nine_to_eleven', '9-11 inches', '9-11 Zoll', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'screen_size_range', 'over_eleven', 'Over 11 inches', 'Über 11 Zoll', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'supported_formats', 'epub', 'EPUB', 'EPUB', 'positive', 10
  UNION ALL SELECT 'e-readers', 'supported_formats', 'pdf', 'PDF', 'PDF', 'positive', 20
  UNION ALL SELECT 'e-readers', 'supported_formats', 'mobi_azw', 'MOBI / AZW', 'MOBI / AZW', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'supported_formats', 'cbz_cbr', 'CBZ / CBR', 'CBZ / CBR', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'supported_formats', 'docx', 'DOCX', 'DOCX', 'neutral', 50
  UNION ALL SELECT 'e-readers', 'supported_formats', 'txt', 'TXT', 'TXT', 'neutral', 60
  UNION ALL SELECT 'e-readers', 'drm_support', 'drm_free', 'DRM-free', 'DRM-frei', 'positive', 10
  UNION ALL SELECT 'e-readers', 'drm_support', 'adobe_drm', 'Adobe DRM', 'Adobe DRM', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'drm_support', 'kindle_drm', 'Kindle DRM', 'Kindle DRM', 'warning', 30
  UNION ALL SELECT 'e-readers', 'drm_support', 'kobo_drm', 'Kobo DRM', 'Kobo DRM', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'drm_support', 'library_drm', 'Library DRM', 'Bibliotheks-DRM', 'neutral', 50
  UNION ALL SELECT 'e-readers', 'store_integration', 'amazon_store', 'Amazon Kindle Store', 'Amazon Kindle Store', 'warning', 10
  UNION ALL SELECT 'e-readers', 'store_integration', 'kobo_store', 'Kobo Store', 'Kobo Store', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'store_integration', 'pocketbook_store', 'PocketBook Store', 'PocketBook Store', 'positive', 30
  UNION ALL SELECT 'e-readers', 'store_integration', 'google_play_books', 'Google Play Books', 'Google Play Books', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'store_integration', 'third_party_stores', 'Third-party stores', 'Drittanbieter-Stores', 'neutral', 50
  UNION ALL SELECT 'e-readers', 'store_integration', 'none', 'None', 'Keine', 'neutral', 60
  UNION ALL SELECT 'e-readers', 'library_borrowing', 'overdrive', 'OverDrive integrated', 'OverDrive integriert', 'positive', 10
  UNION ALL SELECT 'e-readers', 'library_borrowing', 'adobe_drm_libraries', 'Adobe DRM libraries', 'Adobe-DRM-Bibliotheken', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'library_borrowing', 'manual_transfer', 'Manual transfer', 'Manuelle Übertragung', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'library_borrowing', 'not_supported', 'Not supported', 'Nicht unterstützt', 'warning', 40
  UNION ALL SELECT 'e-readers', 'operating_system', 'proprietary', 'Proprietary', 'Proprietär', 'neutral', 10
  UNION ALL SELECT 'e-readers', 'operating_system', 'android', 'Android', 'Android', 'tradeoff', 20
  UNION ALL SELECT 'e-readers', 'operating_system', 'linux_based', 'Linux-based', 'Linux-basiert', 'positive', 30
  UNION ALL SELECT 'e-readers', 'operating_system', 'custom', 'Custom / other', 'Individuell / andere', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'third_party_apps', 'full_android', 'Full Android apps', 'Volle Android-Apps', 'tradeoff', 10
  UNION ALL SELECT 'e-readers', 'third_party_apps', 'limited_app_store', 'Limited app store', 'Eingeschränkter App Store', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'third_party_apps', 'none', 'None', 'Keine', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'cloud_sync_model', 'mandatory_vendor_cloud', 'Mandatory vendor cloud', 'Pflicht-Anbieter-Cloud', 'warning', 10
  UNION ALL SELECT 'e-readers', 'cloud_sync_model', 'optional_vendor_cloud', 'Optional vendor cloud', 'Optionale Anbieter-Cloud', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'cloud_sync_model', 'local_usb_only', 'Local / USB only', 'Lokal / nur USB', 'positive', 30
  UNION ALL SELECT 'e-readers', 'cloud_sync_model', 'third_party_cloud', 'Third-party cloud', 'Drittanbieter-Cloud', 'tradeoff', 40
  UNION ALL SELECT 'e-readers', 'cloud_sync_model', 'self_hostable_sync', 'Self-hostable sync', 'Selbsthostbarer Sync', 'positive', 50
  UNION ALL SELECT 'e-readers', 'note_export_formats', 'pdf', 'PDF', 'PDF', 'positive', 10
  UNION ALL SELECT 'e-readers', 'note_export_formats', 'png', 'PNG', 'PNG', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'note_export_formats', 'svg', 'SVG', 'SVG', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'note_export_formats', 'text', 'Text', 'Text', 'positive', 40
  UNION ALL SELECT 'e-readers', 'note_export_formats', 'markdown', 'Markdown', 'Markdown', 'positive', 50
  UNION ALL SELECT 'e-readers', 'note_export_formats', 'none', 'None', 'Keine', 'warning', 60
  UNION ALL SELECT 'e-readers', 'handwriting_recognition', 'built_in', 'Built in', 'Integriert', 'positive', 10
  UNION ALL SELECT 'e-readers', 'handwriting_recognition', 'cloud_based', 'Cloud-based', 'Cloud-basiert', 'tradeoff', 20
  UNION ALL SELECT 'e-readers', 'handwriting_recognition', 'app_dependent', 'App-dependent', 'App-abhängig', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'handwriting_recognition', 'not_supported', 'Not supported', 'Nicht unterstützt', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'account_requirement', 'no_account', 'No account', 'Kein Konto', 'positive', 10
  UNION ALL SELECT 'e-readers', 'account_requirement', 'optional', 'Optional', 'Optional', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'account_requirement', 'required_store', 'Required for store/sync', 'Für Store/Sync erforderlich', 'tradeoff', 30
  UNION ALL SELECT 'e-readers', 'account_requirement', 'required_device', 'Required for setup/device', 'Für Einrichtung/Gerät erforderlich', 'warning', 40
  UNION ALL SELECT 'e-readers', 'telemetry_model', 'none', 'None documented', 'Keine dokumentiert', 'positive', 10
  UNION ALL SELECT 'e-readers', 'telemetry_model', 'opt_in', 'Opt-in', 'Opt-in', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'telemetry_model', 'opt_out', 'Opt-out', 'Opt-out', 'warning', 30
  UNION ALL SELECT 'e-readers', 'telemetry_model', 'mandatory', 'Mandatory', 'Verpflichtend', 'negative', 40
  UNION ALL SELECT 'e-readers', 'telemetry_model', 'not_disclosed', 'Not disclosed', 'Nicht offengelegt', 'warning', 50
  UNION ALL SELECT 'e-readers', 'data_processing_location', 'local_only', 'Local only', 'Nur lokal', 'positive', 10
  UNION ALL SELECT 'e-readers', 'data_processing_location', 'europe', 'Europe', 'Europa', 'positive', 20
  UNION ALL SELECT 'e-readers', 'data_processing_location', 'canada', 'Canada', 'Kanada', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'data_processing_location', 'china', 'China', 'China', 'warning', 40
  UNION ALL SELECT 'e-readers', 'data_processing_location', 'global', 'Global', 'Global', 'tradeoff', 50
  UNION ALL SELECT 'e-readers', 'data_processing_location', 'not_disclosed', 'Not disclosed', 'Nicht offengelegt', 'warning', 60
  UNION ALL SELECT 'e-readers', 'source_model', 'fully_open', 'Fully open source', 'Vollständig quelloffen', 'positive', 10
  UNION ALL SELECT 'e-readers', 'source_model', 'partial_open', 'Partially open', 'Teilweise offen', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'e-readers', 'repairability_model', 'official_spares', 'Official spare parts', 'Offizielle Ersatzteile', 'positive', 10
  UNION ALL SELECT 'e-readers', 'repairability_model', 'repair_program', 'Repair program', 'Reparaturprogramm', 'positive', 20
  UNION ALL SELECT 'e-readers', 'repairability_model', 'limited_service', 'Limited vendor service', 'Begrenzter Anbieter-Service', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'repairability_model', 'sealed_device', 'Sealed device', 'Versiegeltes Gerät', 'warning', 40
  UNION ALL SELECT 'e-readers', 'repairability_model', 'not_disclosed', 'Not disclosed', 'Nicht offengelegt', 'warning', 50
  UNION ALL SELECT 'e-readers', 'device_price_tier', 'budget', 'Budget', 'Budget', 'positive', 10
  UNION ALL SELECT 'e-readers', 'device_price_tier', 'midrange', 'Mid-range', 'Mittelklasse', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'device_price_tier', 'premium', 'Premium', 'Premium', 'tradeoff', 30
  UNION ALL SELECT 'e-readers', 'device_price_tier', 'premium_subscription', 'Premium + subscription', 'Premium + Abo', 'warning', 40
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'ebook_reader', 'Ebook reader', 'E-Book-Lesen', 'neutral', 10
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'manga_comics', 'Manga / comics', 'Manga / Comics', 'neutral', 20
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'pdf_research', 'PDF research', 'PDF-Recherche', 'neutral', 30
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'handwritten_notes', 'Handwritten notes', 'Handschriftliche Notizen', 'neutral', 40
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'android_apps', 'Android apps', 'Android-Apps', 'tradeoff', 50
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'library_books', 'Library books', 'Bibliotheksbuecher', 'neutral', 60
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'audiobooks', 'Audiobooks', 'Hörbücher', 'neutral', 70
  UNION ALL SELECT 'e-readers', 'fit_profiles', 'distraction_free', 'Distraction-free writing', 'Ablenkungsfreies Schreiben', 'neutral', 80
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
 AND ec.`category_id` = 'e-readers'
JOIN `matrix_criteria` mc
  ON mc.`category_id` = 'e-readers'
WHERE ce.`status` IN ('alternative', 'us')
  AND ce.`is_active` = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('070-e-readers-category-matrix');
