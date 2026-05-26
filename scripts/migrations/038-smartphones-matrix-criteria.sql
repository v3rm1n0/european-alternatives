-- Migration 038: Define Smartphones category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('smartphones', 'operating_system', 'Operating System', 'Betriebssystem', 'Operating system base, open-source status, custom ROM support, and bloatware level.', 'Betriebssystem-Basis, Open-Source-Status, Custom-ROM-Unterstuetzung und Bloatware-Niveau.', 100),
  ('smartphones', 'hardware_design', 'Hardware & Design', 'Hardware & Design', 'Physical hardware choices including chip origin, removable battery, expandable storage, and connectivity ports.', 'Physische Hardware-Auswahl einschliesslich Chip-Herkunft, austauschbarer Akku, erweiterbarer Speicher und Anschluesse.', 200),
  ('smartphones', 'privacy_data', 'Privacy & Data', 'Privatsphaere & Daten', 'Privacy controls, ad tracking defaults, location management, and data indicator features.', 'Datenschutzkontrollen, Werbetracking-Standardeinstellungen, Standortverwaltung und Datenindikatorfunktionen.', 300),
  ('smartphones', 'security_updates', 'Security & Updates', 'Sicherheit & Aktualisierungen', 'Security update cadence, guaranteed support duration, encryption, and biometric authentication options.', 'Sicherheitsaktualisierungsrhythmus, garantierte Unterstuetzungsdauer, Verschluesselung und biometrische Authentifizierungsoptionen.', 400),
  ('smartphones', 'repairability_longevity', 'Repairability & Longevity', 'Reparierbarkeit & Langlebigkeit', 'Repairability scoring, spare parts availability, official repair programs, and warranty terms.', 'Reparierbarkeit-Bewertung, Ersatzteilverfuegbarkeit, offizielle Reparaturprogramme und Garantiebedingungen.', 500),
  ('smartphones', 'connectivity_features', 'Connectivity & Features', 'Konnektivitaet & Funktionen', 'Wireless connectivity standards, USB type, NFC capability, and desktop mode support.', 'Drahtlose Konnektivitaetsstandards, USB-Typ, NFC-Faehigkeit und Desktop-Modus-Unterstuetzung.', 600),
  ('smartphones', 'sustainability_ethics', 'Sustainability & Ethics', 'Nachhaltigkeit & Ethik', 'Manufacturing origin, labor certifications, recycled materials use, and conflict mineral policies.', 'Herstellungsherkunft, Arbeitszertifizierungen, Verwendung recycelter Materialien und Konfliktmineralien-Richtlinien.', 700),
  ('smartphones', 'data_compliance', 'Data & Compliance', 'Daten & Compliance', 'Data processing location, GDPR compliance, account deletion, and local data export capabilities.', 'Datenverarbeitungsstandort, DSGVO-Konformitaet, Kontoloeschung und lokale Datenexportmoeglichkeiten.', 800),
  ('smartphones', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing tiers, carrier independence, and target audience fit profiles.', 'Preiskategorien, Netzbetreiberunabhaengigkeit und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'smartphones' AS category_id, 'operating_system' AS group_key, 'os_base' AS criterion_key, 'Operating system base' AS label_en, 'Betriebssystem-Basis' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The base operating system the smartphone ships with.' AS help_text_en, 'Das Basisbetriebssystem, mit dem das Smartphone ausgeliefert wird.' AS help_text_de
  UNION ALL SELECT 'smartphones', 'operating_system', 'os_open_source', 'Open-source OS', 'Open-Source-Betriebssystem', 'boolean', 'beneficial', 'must_match', 1020, 'Whether the operating system source code is publicly available under an open-source license.', 'Ob der Quellcode des Betriebssystems oeffentlich unter einer Open-Source-Lizenz verfuegbar ist.'
  UNION ALL SELECT 'smartphones', 'operating_system', 'custom_rom_support', 'Custom ROM support', 'Custom-ROM-Unterstuetzung', 'enum', 'tradeoff', 'optional', 1030, 'The level of support for installing alternative custom ROMs on the device.', 'Das Unterstuetzungsniveau fuer die Installation alternativer Custom-ROMs auf dem Geraet.'
  UNION ALL SELECT 'smartphones', 'operating_system', 'bootloader_unlockable', 'Bootloader unlockable', 'Bootloader entsperrbar', 'boolean', 'beneficial', 'optional', 1040, 'Whether the device bootloader can be officially unlocked by the user.', 'Ob der Geraete-Bootloader offiziell vom Benutzer entsperrt werden kann.'
  UNION ALL SELECT 'smartphones', 'operating_system', 'preinstalled_bloatware', 'Preinstalled bloatware', 'Vorinstallierte Bloatware', 'enum', 'risk', 'optional', 1050, 'The amount of non-removable preinstalled apps that ship with the device.', 'Die Menge nicht entfernbarer vorinstallierter Apps, die mit dem Geraet ausgeliefert werden.'
  UNION ALL SELECT 'smartphones', 'hardware_design', 'chip_origin', 'Chip origin', 'Chip-Herkunft', 'enum', 'informational', 'optional', 2010, 'The geographic origin of the main processor chip design.', 'Die geographische Herkunft des Hauptprozessor-Chipdesigns.'
  UNION ALL SELECT 'smartphones', 'hardware_design', 'removable_battery', 'Removable battery', 'Austauschbarer Akku', 'boolean', 'beneficial', 'optional', 2020, 'Whether the battery can be removed and replaced by the user without special tools.', 'Ob der Akku vom Benutzer ohne Spezialwerkzeug entfernt und ersetzt werden kann.'
  UNION ALL SELECT 'smartphones', 'hardware_design', 'storage_expandable', 'Expandable storage', 'Erweiterbarer Speicher', 'boolean', 'beneficial', 'optional', 2030, 'Whether the device supports expanding storage via a memory card slot.', 'Ob das Geraet die Speichererweiterung ueber einen Speicherkartensteckplatz unterstuetzt.'
  UNION ALL SELECT 'smartphones', 'hardware_design', 'headphone_jack', 'Headphone jack', 'Kopfhoereranschluss', 'boolean', 'informational', 'optional', 2040, 'Whether the device includes a standard 3.5mm headphone jack.', 'Ob das Geraet einen standardmaessigen 3,5-mm-Kopfhoereranschluss besitzt.'
  UNION ALL SELECT 'smartphones', 'hardware_design', 'dual_sim', 'Dual SIM support', 'Dual-SIM-Unterstuetzung', 'enum', 'informational', 'optional', 2050, 'The type of dual SIM capability supported by the device.', 'Die Art der vom Geraet unterstuetzten Dual-SIM-Faehigkeit.'
  UNION ALL SELECT 'smartphones', 'privacy_data', 'privacy_dashboard', 'Privacy dashboard', 'Datenschutz-Dashboard', 'boolean', 'beneficial', 'optional', 3010, 'Whether the OS provides a centralized dashboard to review app permission usage.', 'Ob das Betriebssystem ein zentrales Dashboard zur Ueberpruefung der App-Berechtigungsnutzung bietet.'
  UNION ALL SELECT 'smartphones', 'privacy_data', 'ad_tracking_default', 'Ad tracking default', 'Werbetracking-Standardeinstellung', 'enum', 'risk', 'optional', 3020, 'The default setting for advertising tracking when the device is first set up.', 'Die Standardeinstellung fuer Werbetracking bei der Ersteinrichtung des Geraets.'
  UNION ALL SELECT 'smartphones', 'privacy_data', 'location_tracking_controls', 'Location tracking controls', 'Standortverfolgungskontrollen', 'enum', 'tradeoff', 'optional', 3030, 'The granularity of controls available for managing location tracking by apps.', 'Die Granularitaet der verfuegbaren Kontrollen zur Verwaltung der Standortverfolgung durch Apps.'
  UNION ALL SELECT 'smartphones', 'privacy_data', 'cloud_backup_mandatory', 'Cloud backup mandatory', 'Cloud-Backup verpflichtend', 'boolean', 'risk', 'must_match', 3040, 'Whether the device requires data to be backed up to a cloud service.', 'Ob das Geraet eine Datensicherung in einem Cloud-Dienst voraussetzt.'
  UNION ALL SELECT 'smartphones', 'privacy_data', 'microphone_camera_indicators', 'Microphone & camera indicators', 'Mikrofon- & Kameraindikatoren', 'boolean', 'beneficial', 'optional', 3050, 'Whether the OS displays visual indicators when apps access the microphone or camera.', 'Ob das Betriebssystem visuelle Indikatoren anzeigt, wenn Apps auf Mikrofon oder Kamera zugreifen.'
  UNION ALL SELECT 'smartphones', 'security_updates', 'security_update_frequency', 'Security update frequency', 'Sicherheitsaktualisierungshaeufigkeit', 'enum', 'beneficial', 'optional', 4010, 'How frequently the manufacturer delivers security patches to the device.', 'Wie haeufig der Hersteller Sicherheitspatches fuer das Geraet bereitstellt.'
  UNION ALL SELECT 'smartphones', 'security_updates', 'guaranteed_update_years', 'Guaranteed update years', 'Garantierte Aktualisierungsjahre', 'enum', 'beneficial', 'optional', 4020, 'The number of years the manufacturer guarantees to provide software updates.', 'Die Anzahl der Jahre, fuer die der Hersteller Software-Aktualisierungen garantiert.'
  UNION ALL SELECT 'smartphones', 'security_updates', 'full_disk_encryption', 'Full-disk encryption', 'Vollstaendige Festplattenverschluesselung', 'boolean', 'beneficial', 'optional', 4030, 'Whether the device encrypts all stored data by default.', 'Ob das Geraet alle gespeicherten Daten standardmaessig verschluesselt.'
  UNION ALL SELECT 'smartphones', 'security_updates', 'secure_element', 'Secure element / hardware key store', 'Sicheres Element / Hardware-Schluesselablage', 'boolean', 'beneficial', 'optional', 4040, 'Whether the device includes a dedicated hardware secure element for cryptographic key storage.', 'Ob das Geraet ein dediziertes sicheres Hardwareelement fuer kryptografische Schluesselablage enthaelt.'
  UNION ALL SELECT 'smartphones', 'security_updates', 'biometric_auth', 'Biometric authentication', 'Biometrische Authentifizierung', 'multi_enum', 'informational', 'multi_select', 4050, 'The types of biometric authentication methods supported by the device.', 'Die Arten biometrischer Authentifizierungsmethoden, die das Geraet unterstuetzt.'
  UNION ALL SELECT 'smartphones', 'repairability_longevity', 'repairability_score', 'Repairability score', 'Reparierbarkeit-Bewertung', 'enum', 'beneficial', 'optional', 5010, 'The overall repairability rating of the device based on independent assessments.', 'Die Gesamtbewertung der Reparierbarkeit des Geraets basierend auf unabhaengigen Bewertungen.'
  UNION ALL SELECT 'smartphones', 'repairability_longevity', 'spare_parts_available', 'Spare parts available', 'Ersatzteile verfuegbar', 'boolean', 'beneficial', 'optional', 5020, 'Whether official spare parts are available for purchase by end users or repair shops.', 'Ob offizielle Ersatzteile fuer Endbenutzer oder Reparaturwerkstaetten zum Kauf verfuegbar sind.'
  UNION ALL SELECT 'smartphones', 'repairability_longevity', 'official_repair_program', 'Official repair program', 'Offizielles Reparaturprogramm', 'boolean', 'beneficial', 'optional', 5030, 'Whether the manufacturer offers an official self-repair or authorized repair program.', 'Ob der Hersteller ein offizielles Selbstreparatur- oder autorisiertes Reparaturprogramm anbietet.'
  UNION ALL SELECT 'smartphones', 'repairability_longevity', 'modular_design', 'Modular design', 'Modulares Design', 'boolean', 'beneficial', 'optional', 5040, 'Whether the device uses a modular design that allows individual component replacement.', 'Ob das Geraet ein modulares Design verwendet, das den Austausch einzelner Komponenten ermoeglicht.'
  UNION ALL SELECT 'smartphones', 'repairability_longevity', 'warranty_duration', 'Warranty duration', 'Garantiedauer', 'enum', 'informational', 'optional', 5050, 'The length of the manufacturer warranty included with the device.', 'Die Laenge der im Lieferumfang des Geraets enthaltenen Herstellergarantie.'
  UNION ALL SELECT 'smartphones', 'connectivity_features', 'five_g_support', '5G support', '5G-Unterstuetzung', 'boolean', 'informational', 'optional', 6010, 'Whether the device supports 5G mobile network connectivity.', 'Ob das Geraet 5G-Mobilfunkkonnektivitaet unterstuetzt.'
  UNION ALL SELECT 'smartphones', 'connectivity_features', 'wifi_standard', 'Wi-Fi standard', 'WLAN-Standard', 'enum', 'informational', 'optional', 6020, 'The latest Wi-Fi standard supported by the device.', 'Der neueste vom Geraet unterstuetzte WLAN-Standard.'
  UNION ALL SELECT 'smartphones', 'connectivity_features', 'usb_type', 'USB type', 'USB-Typ', 'enum', 'informational', 'optional', 6030, 'The type and version of USB connector used by the device.', 'Der Typ und die Version des vom Geraet verwendeten USB-Anschlusses.'
  UNION ALL SELECT 'smartphones', 'connectivity_features', 'nfc_support', 'NFC support', 'NFC-Unterstuetzung', 'boolean', 'informational', 'optional', 6040, 'Whether the device includes NFC for contactless communication and payments.', 'Ob das Geraet NFC fuer kontaktlose Kommunikation und Zahlungen enthaelt.'
  UNION ALL SELECT 'smartphones', 'connectivity_features', 'desktop_mode', 'Desktop mode', 'Desktop-Modus', 'boolean', 'informational', 'optional', 6050, 'Whether the device offers a desktop mode for use with external displays.', 'Ob das Geraet einen Desktop-Modus fuer die Nutzung mit externen Bildschirmen bietet.'
  UNION ALL SELECT 'smartphones', 'sustainability_ethics', 'manufacturing_origin', 'Manufacturing origin', 'Herstellungsherkunft', 'enum', 'informational', 'optional', 7010, 'The primary geographic region where the device is manufactured.', 'Die primaere geographische Region, in der das Geraet hergestellt wird.'
  UNION ALL SELECT 'smartphones', 'sustainability_ethics', 'fair_labor_certification', 'Fair labor certification', 'Fair-Labor-Zertifizierung', 'boolean', 'beneficial', 'optional', 7020, 'Whether the manufacturer holds fair labor or ethical supply chain certifications.', 'Ob der Hersteller Zertifizierungen fuer faire Arbeit oder ethische Lieferketten besitzt.'
  UNION ALL SELECT 'smartphones', 'sustainability_ethics', 'recycled_materials', 'Recycled materials used', 'Verwendung recycelter Materialien', 'boolean', 'beneficial', 'optional', 7030, 'Whether the device is manufactured using recycled or sustainably sourced materials.', 'Ob das Geraet unter Verwendung recycelter oder nachhaltig bezogener Materialien hergestellt wird.'
  UNION ALL SELECT 'smartphones', 'sustainability_ethics', 'take_back_program', 'Take-back / recycling program', 'Ruecknahme- / Recyclingprogramm', 'boolean', 'beneficial', 'optional', 7040, 'Whether the manufacturer offers a take-back or recycling program for end-of-life devices.', 'Ob der Hersteller ein Ruecknahme- oder Recyclingprogramm fuer ausgediente Geraete anbietet.'
  UNION ALL SELECT 'smartphones', 'sustainability_ethics', 'conflict_mineral_policy', 'Conflict mineral policy', 'Konfliktmineralien-Richtlinie', 'enum', 'informational', 'optional', 7050, 'The transparency and certification status of the manufacturer conflict mineral sourcing policy.', 'Der Transparenz- und Zertifizierungsstatus der Konfliktmineralien-Beschaffungsrichtlinie des Herstellers.'
  UNION ALL SELECT 'smartphones', 'data_compliance', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 8010, 'Where user data associated with the device cloud services is processed and stored.', 'Wo die mit den Cloud-Diensten des Geraets verbundenen Benutzerdaten verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'smartphones', 'data_compliance', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfuegbar', 'boolean', 'informational', 'optional', 8020, 'Whether the manufacturer provides a GDPR-compliant data processing agreement.', 'Ob der Hersteller einen DSGVO-konformen Auftragsverarbeitungsvertrag bereitstellt.'
  UNION ALL SELECT 'smartphones', 'data_compliance', 'account_deletion', 'Account deletion', 'Kontoloeschung', 'boolean', 'beneficial', 'optional', 8030, 'Whether users can fully delete their accounts and all associated personal data.', 'Ob Benutzer ihre Konten und alle zugehoerigen personenbezogenen Daten vollstaendig loeschen koennen.'
  UNION ALL SELECT 'smartphones', 'data_compliance', 'local_data_export', 'Local data export', 'Lokaler Datenexport', 'boolean', 'beneficial', 'optional', 8040, 'Whether all user data stored on the device or in cloud services can be exported locally.', 'Ob alle auf dem Geraet oder in Cloud-Diensten gespeicherten Benutzerdaten lokal exportiert werden koennen.'
  UNION ALL SELECT 'smartphones', 'pricing_fit', 'pricing_tier', 'Pricing tier', 'Preiskategorie', 'enum', 'informational', 'optional', 9010, 'The general pricing tier of the device relative to the smartphone market.', 'Die allgemeine Preiskategorie des Geraets im Vergleich zum Smartphone-Markt.'
  UNION ALL SELECT 'smartphones', 'pricing_fit', 'carrier_independent', 'Carrier-independent', 'Netzbetreiberunabhaengig', 'boolean', 'beneficial', 'optional', 9020, 'Whether the device is sold unlocked and independent of any mobile carrier.', 'Ob das Geraet entsperrt und unabhaengig von einem Mobilfunknetzbetreiber verkauft wird.'
  UNION ALL SELECT 'smartphones', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9030, 'Target audience profiles the smartphone is best suited for.', 'Zielgruppenprofile, fuer die das Smartphone am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'smartphones' AS category_id, 'os_base' AS criterion_key, 'android_aosp' AS option_key, 'Android AOSP' AS label_en, 'Android AOSP' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'smartphones', 'os_base', 'android_custom', 'Android custom', 'Android angepasst', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'os_base', 'linux_mobile', 'Linux mobile', 'Linux mobil', 'positive', 30
  UNION ALL SELECT 'smartphones', 'os_base', 'sailfish', 'Sailfish OS', 'Sailfish OS', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'os_base', 'harmonyos', 'HarmonyOS', 'HarmonyOS', 'neutral', 50
  UNION ALL SELECT 'smartphones', 'os_base', 'proprietary_other', 'Proprietary / other', 'Proprietaer / andere', 'neutral', 60
  UNION ALL SELECT 'smartphones', 'custom_rom_support', 'officially_supported', 'Officially supported', 'Offiziell unterstuetzt', 'positive', 10
  UNION ALL SELECT 'smartphones', 'custom_rom_support', 'community_supported', 'Community supported', 'Community-unterstuetzt', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'custom_rom_support', 'limited', 'Limited', 'Eingeschraenkt', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'custom_rom_support', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'smartphones', 'preinstalled_bloatware', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'smartphones', 'preinstalled_bloatware', 'minimal', 'Minimal', 'Minimal', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'preinstalled_bloatware', 'moderate', 'Moderate', 'Maessig', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'preinstalled_bloatware', 'heavy', 'Heavy', 'Stark', 'warning', 40
  UNION ALL SELECT 'smartphones', 'chip_origin', 'eu_designed', 'EU-designed', 'EU-entworfen', 'positive', 10
  UNION ALL SELECT 'smartphones', 'chip_origin', 'us_designed', 'US-designed', 'US-entworfen', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'chip_origin', 'asia_designed', 'Asia-designed', 'Asien-entworfen', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'chip_origin', 'mixed_origin', 'Mixed origin', 'Gemischte Herkunft', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'dual_sim', 'dual_physical', 'Dual physical SIM', 'Zwei physische SIMs', 'neutral', 10
  UNION ALL SELECT 'smartphones', 'dual_sim', 'physical_plus_esim', 'Physical + eSIM', 'Physisch + eSIM', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'dual_sim', 'dual_esim', 'Dual eSIM', 'Zwei eSIMs', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'dual_sim', 'single_only', 'Single SIM only', 'Nur eine SIM', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'ad_tracking_default', 'off_by_default', 'Off by default', 'Standardmaessig deaktiviert', 'positive', 10
  UNION ALL SELECT 'smartphones', 'ad_tracking_default', 'opt_in', 'Opt-in', 'Opt-in', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'ad_tracking_default', 'opt_out', 'Opt-out', 'Opt-out', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'ad_tracking_default', 'mandatory', 'Mandatory', 'Verpflichtend', 'warning', 40
  UNION ALL SELECT 'smartphones', 'location_tracking_controls', 'granular_per_app', 'Granular per app', 'Detailliert pro App', 'positive', 10
  UNION ALL SELECT 'smartphones', 'location_tracking_controls', 'basic_on_off', 'Basic on/off', 'Einfach ein/aus', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'location_tracking_controls', 'limited', 'Limited', 'Eingeschraenkt', 'warning', 30
  UNION ALL SELECT 'smartphones', 'security_update_frequency', 'monthly', 'Monthly', 'Monatlich', 'positive', 10
  UNION ALL SELECT 'smartphones', 'security_update_frequency', 'quarterly', 'Quarterly', 'Vierteljaehrlich', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'security_update_frequency', 'irregular', 'Irregular', 'Unregelmaessig', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'security_update_frequency', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'smartphones', 'guaranteed_update_years', 'seven_plus', '7+ years', '7+ Jahre', 'positive', 10
  UNION ALL SELECT 'smartphones', 'guaranteed_update_years', 'five_to_six', '5-6 years', '5-6 Jahre', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'guaranteed_update_years', 'three_to_four', '3-4 years', '3-4 Jahre', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'guaranteed_update_years', 'one_to_two', '1-2 years', '1-2 Jahre', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'guaranteed_update_years', 'none', 'None', 'Keine', 'warning', 50
  UNION ALL SELECT 'smartphones', 'biometric_auth', 'fingerprint', 'Fingerprint', 'Fingerabdruck', 'neutral', 10
  UNION ALL SELECT 'smartphones', 'biometric_auth', 'face_recognition', 'Face recognition', 'Gesichtserkennung', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'biometric_auth', 'iris_scan', 'Iris scan', 'Iris-Scan', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'biometric_auth', 'none', 'None', 'Keine', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'repairability_score', 'high', 'High', 'Hoch', 'positive', 10
  UNION ALL SELECT 'smartphones', 'repairability_score', 'medium', 'Medium', 'Mittel', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'repairability_score', 'low', 'Low', 'Niedrig', 'warning', 30
  UNION ALL SELECT 'smartphones', 'repairability_score', 'not_rated', 'Not rated', 'Nicht bewertet', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'warranty_duration', 'three_plus_years', '3+ years', '3+ Jahre', 'neutral', 10
  UNION ALL SELECT 'smartphones', 'warranty_duration', 'two_years', '2 years', '2 Jahre', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'warranty_duration', 'one_year', '1 year', '1 Jahr', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'warranty_duration', 'limited_other', 'Limited / other', 'Begrenzt / andere', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'wifi_standard', 'wifi_7', 'Wi-Fi 7', 'Wi-Fi 7', 'neutral', 10
  UNION ALL SELECT 'smartphones', 'wifi_standard', 'wifi_6e', 'Wi-Fi 6E', 'Wi-Fi 6E', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'wifi_standard', 'wifi_6', 'Wi-Fi 6', 'Wi-Fi 6', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'wifi_standard', 'wifi_5_or_older', 'Wi-Fi 5 or older', 'Wi-Fi 5 oder aelter', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'usb_type', 'usb_c_3', 'USB-C 3.x', 'USB-C 3.x', 'neutral', 10
  UNION ALL SELECT 'smartphones', 'usb_type', 'usb_c_2', 'USB-C 2.0', 'USB-C 2.0', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'usb_type', 'micro_usb', 'Micro USB', 'Micro-USB', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'usb_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'manufacturing_origin', 'eu', 'EU', 'EU', 'neutral', 10
  UNION ALL SELECT 'smartphones', 'manufacturing_origin', 'asia', 'Asia', 'Asien', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'manufacturing_origin', 'mixed', 'Mixed', 'Gemischt', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'manufacturing_origin', 'unspecified', 'Unspecified', 'Nicht angegeben', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'conflict_mineral_policy', 'certified_free', 'Certified conflict-free', 'Zertifiziert konfliktfrei', 'positive', 10
  UNION ALL SELECT 'smartphones', 'conflict_mineral_policy', 'published_policy', 'Published policy', 'Veroeffentlichte Richtlinie', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'conflict_mineral_policy', 'no_policy', 'No policy', 'Keine Richtlinie', 'warning', 30
  UNION ALL SELECT 'smartphones', 'conflict_mineral_policy', 'unspecified', 'Unspecified', 'Nicht angegeben', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'smartphones', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'smartphones', 'data_processing_location', 'self_hosted_choice', 'Self-hosted choice', 'Selbst gehostet (eigene Wahl)', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'data_processing_location', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'neutral', 50
  UNION ALL SELECT 'smartphones', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'smartphones', 'pricing_tier', 'budget', 'Budget', 'Budget', 'positive', 10
  UNION ALL SELECT 'smartphones', 'pricing_tier', 'mid_range', 'Mid-range', 'Mittelklasse', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'pricing_tier', 'flagship', 'Flagship', 'Flaggschiff', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'pricing_tier', 'ultra_premium', 'Ultra premium', 'Ultra-Premium', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'fit_profiles', 'personal', 'Personal', 'Persoenlich', 'neutral', 10
  UNION ALL SELECT 'smartphones', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 20
  UNION ALL SELECT 'smartphones', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'smartphones', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 40
  UNION ALL SELECT 'smartphones', 'fit_profiles', 'sustainability_minded', 'Sustainability-minded', 'Nachhaltigkeitsbewusst', 'neutral', 50
  UNION ALL SELECT 'smartphones', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'smartphones'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'smartphones'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('038-smartphones-matrix-criteria');
