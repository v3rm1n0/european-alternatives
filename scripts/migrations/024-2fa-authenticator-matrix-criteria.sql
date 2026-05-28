-- Migration 024: Define 2FA Authenticator category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('2fa-authenticator', 'supported_methods', 'Supported 2FA Methods', 'Unterstützte 2FA-Methoden', 'Which second-factor authentication methods and algorithms are supported.', 'Welche Zweitfaktor-Authentifizierungsmethoden und Algorithmen unterstützt werden.', 100),
  ('2fa-authenticator', 'token_management', 'Token Management', 'Token-Verwaltung', 'How tokens and entries are added, organized, and displayed.', 'Wie Token und Einträge hinzugefügt, organisiert und angezeigt werden.', 200),
  ('2fa-authenticator', 'security_protection', 'Security & Protection', 'Sicherheit & Schutz', 'Encryption, app locking, and code protection measures.', 'Verschlüsselung, App-Sperrung und Schutz von Codes.', 300),
  ('2fa-authenticator', 'backup_sync', 'Backup & Sync', 'Backup & Synchronisierung', 'How token data is backed up and synchronized across devices.', 'Wie Token-Daten gesichert und zwischen Geräten synchronisiert werden.', 400),
  ('2fa-authenticator', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Supported operating systems, devices, and access methods.', 'Unterstützte Betriebssysteme, Geräte und Zugriffsmethoden.', 500),
  ('2fa-authenticator', 'migration_portability', 'Migration & Portability', 'Migration & Portabilität', 'Importing from other apps and exporting token data.', 'Import aus anderen Apps und Export von Token-Daten.', 600),
  ('2fa-authenticator', 'usability_ux', 'Usability & UX', 'Bedienbarkeit & UX', 'Daily use convenience, accessibility, and interface quality.', 'Komfort im täglichen Gebrauch, Barrierefreiheit und Oberflächen-Qualität.', 700),
  ('2fa-authenticator', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Source code openness, security audits, and licensing.', 'Quellcode-Offenheit, Sicherheitsaudits und Lizenzierung.', 800),
  ('2fa-authenticator', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model and target user profiles.', 'Preismodell und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT '2fa-authenticator' AS category_id, 'supported_methods' AS group_key, 'totp_support' AS criterion_key, 'TOTP support' AS label_en, 'TOTP-Unterstützung' AS label_de, 'boolean' AS value_type, 'beneficial' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Whether time-based one-time passwords are supported.' AS help_text_en, 'Ob zeitbasierte Einmalpasswörter unterstützt werden.' AS help_text_de
  UNION ALL SELECT '2fa-authenticator', 'supported_methods', 'hotp_support', 'HOTP support', 'HOTP-Unterstützung', 'boolean', 'informational', 'optional', 1020, 'Whether HMAC-based one-time passwords are supported.', 'Ob HMAC-basierte Einmalpasswörter unterstützt werden.'
  UNION ALL SELECT '2fa-authenticator', 'supported_methods', 'push_authentication', 'Push-based authentication', 'Push-basierte Authentifizierung', 'boolean', 'informational', 'optional', 1030, 'Whether push notification authentication is supported.', 'Ob Push-Benachrichtigungs-Authentifizierung unterstützt wird.'
  UNION ALL SELECT '2fa-authenticator', 'supported_methods', 'supported_otp_algorithms', 'Supported OTP algorithms', 'Unterstützte OTP-Algorithmen', 'multi_enum', 'informational', 'multi_select', 1040, 'Which hash algorithms are supported for OTP generation.', 'Welche Hash-Algorithmen für die OTP-Generierung unterstützt werden.'
  UNION ALL SELECT '2fa-authenticator', 'supported_methods', 'passkey_storage', 'Passkey or FIDO2 credential storage', 'Passkey- oder FIDO2-Speicherung', 'boolean', 'informational', 'optional', 1050, 'Whether passkeys or FIDO2 credentials can be stored.', 'Ob Passkeys oder FIDO2-Anmeldedaten gespeichert werden können.'
  UNION ALL SELECT '2fa-authenticator', 'supported_methods', 'steam_guard_support', 'Steam Guard token support', 'Steam-Guard-Token-Unterstützung', 'boolean', 'informational', 'optional', 1060, 'Whether Steam Guard tokens can be managed.', 'Ob Steam-Guard-Token verwaltet werden können.'
  UNION ALL SELECT '2fa-authenticator', 'token_management', 'token_entry_methods', 'Token entry methods', 'Token-Eingabemethoden', 'multi_enum', 'informational', 'multi_select', 2010, 'How new tokens can be added to the app.', 'Wie neue Token zur App hinzugefügt werden können.'
  UNION ALL SELECT '2fa-authenticator', 'token_management', 'token_organization', 'Token organization', 'Token-Organisation', 'multi_enum', 'beneficial', 'multi_select', 2020, 'How tokens can be organized and grouped.', 'Wie Token organisiert und gruppiert werden können.'
  UNION ALL SELECT '2fa-authenticator', 'token_management', 'icon_or_logo_support', 'Service icon or logo display', 'Dienst-Icon- oder Logo-Anzeige', 'boolean', 'beneficial', 'optional', 2030, 'Whether service icons or logos are displayed for entries.', 'Ob Dienst-Icons oder Logos für Einträge angezeigt werden.'
  UNION ALL SELECT '2fa-authenticator', 'token_management', 'search_capability', 'Token search', 'Token-Suche', 'boolean', 'beneficial', 'optional', 2040, 'Whether tokens can be searched by name or issuer.', 'Ob Token nach Name oder Aussteller durchsucht werden können.'
  UNION ALL SELECT '2fa-authenticator', 'token_management', 'custom_token_period', 'Custom token period support', 'Benutzerdefinierte Token-Periode', 'boolean', 'informational', 'optional', 2050, 'Whether custom token refresh periods can be configured.', 'Ob benutzerdefinierte Token-Aktualisierungsperioden eingestellt werden können.'
  UNION ALL SELECT '2fa-authenticator', 'token_management', 'custom_token_digits', 'Custom digit count support', 'Benutzerdefinierte Stellenanzahl', 'boolean', 'informational', 'optional', 2060, 'Whether the number of OTP digits can be customized.', 'Ob die Anzahl der OTP-Stellen angepasst werden kann.'
  UNION ALL SELECT '2fa-authenticator', 'security_protection', 'encryption_at_rest', 'Encryption at rest', 'Verschlüsselung im Ruhezustand', 'boolean', 'beneficial', 'must_match', 3010, 'Whether stored tokens are encrypted on the device.', 'Ob gespeicherte Token auf dem Gerät verschlüsselt werden.'
  UNION ALL SELECT '2fa-authenticator', 'security_protection', 'app_lock_method', 'App lock method', 'App-Sperrmethode', 'multi_enum', 'beneficial', 'multi_select', 3020, 'Which methods are available to lock the app.', 'Welche Methoden zum Sperren der App verfügbar sind.'
  UNION ALL SELECT '2fa-authenticator', 'security_protection', 'screenshot_protection', 'Screenshot protection', 'Screenshot-Schutz', 'boolean', 'beneficial', 'optional', 3030, 'Whether screenshots of OTP codes are prevented.', 'Ob Screenshots von OTP-Codes verhindert werden.'
  UNION ALL SELECT '2fa-authenticator', 'security_protection', 'tap_to_reveal', 'Tap-to-reveal codes', 'Tippen-zum-Anzeigen', 'boolean', 'beneficial', 'optional', 3040, 'Whether codes are hidden until tapped.', 'Ob Codes erst nach Antippen angezeigt werden.'
  UNION ALL SELECT '2fa-authenticator', 'security_protection', 'clipboard_auto_clear', 'Automatic clipboard clearing', 'Automatische Zwischenablage-Leerung', 'boolean', 'beneficial', 'optional', 3050, 'Whether copied codes are automatically removed from the clipboard.', 'Ob kopierte Codes automatisch aus der Zwischenablage entfernt werden.'
  UNION ALL SELECT '2fa-authenticator', 'security_protection', 'secure_storage_backend', 'Secure storage backend', 'Sicheres Speicher-Backend', 'enum', 'tradeoff', 'optional', 3060, 'Which secure storage mechanism is used for key material.', 'Welcher sichere Speichermechanismus für Schlüsselmaterial verwendet wird.'
  UNION ALL SELECT '2fa-authenticator', 'backup_sync', 'sync_model', 'Sync model', 'Synchronisierungsmodell', 'enum', 'tradeoff', 'must_match', 4010, 'How token data is synchronized between devices.', 'Wie Token-Daten zwischen Geräten synchronisiert werden.'
  UNION ALL SELECT '2fa-authenticator', 'backup_sync', 'encrypted_backup', 'Encrypted backup', 'Verschlüsseltes Backup', 'boolean', 'beneficial', 'must_match', 4020, 'Whether backups are encrypted.', 'Ob Backups verschlüsselt werden.'
  UNION ALL SELECT '2fa-authenticator', 'backup_sync', 'backup_methods', 'Backup methods', 'Backup-Methoden', 'multi_enum', 'informational', 'multi_select', 4030, 'Which backup methods are available.', 'Welche Backup-Methoden verfügbar sind.'
  UNION ALL SELECT '2fa-authenticator', 'backup_sync', 'multi_device_sync', 'Multi-device sync', 'Mehrgeräte-Synchronisierung', 'boolean', 'beneficial', 'optional', 4040, 'Whether tokens can be synced across multiple devices.', 'Ob Token über mehrere Geräte synchronisiert werden können.'
  UNION ALL SELECT '2fa-authenticator', 'backup_sync', 'offline_functionality', 'Offline functionality', 'Offline-Funktionalität', 'boolean', 'beneficial', 'optional', 4050, 'Whether codes can be generated without an internet connection.', 'Ob Codes ohne Internetverbindung generiert werden können.'
  UNION ALL SELECT '2fa-authenticator', 'backup_sync', 'automatic_backup', 'Automatic backup', 'Automatisches Backup', 'boolean', 'beneficial', 'optional', 4060, 'Whether backups are created automatically.', 'Ob Backups automatisch erstellt werden.'
  UNION ALL SELECT '2fa-authenticator', 'platform_access', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'Which operating systems are supported.', 'Welche Betriebssysteme unterstützt werden.'
  UNION ALL SELECT '2fa-authenticator', 'platform_access', 'browser_extension', 'Browser extension available', 'Browser-Erweiterung verfügbar', 'boolean', 'beneficial', 'optional', 5020, 'Whether a browser extension is available.', 'Ob eine Browser-Erweiterung verfügbar ist.'
  UNION ALL SELECT '2fa-authenticator', 'platform_access', 'desktop_app', 'Desktop app available', 'Desktop-App verfügbar', 'boolean', 'beneficial', 'optional', 5030, 'Whether a standalone desktop application is available.', 'Ob eine eigenständige Desktop-Anwendung verfügbar ist.'
  UNION ALL SELECT '2fa-authenticator', 'platform_access', 'wearable_support', 'Wearable device support', 'Wearable-Geräte-Unterstützung', 'multi_enum', 'informational', 'multi_select', 5040, 'Which wearable platforms are supported.', 'Welche Wearable-Plattformen unterstützt werden.'
  UNION ALL SELECT '2fa-authenticator', 'platform_access', 'widget_support', 'Home screen widget', 'Startbildschirm-Widget', 'boolean', 'beneficial', 'optional', 5050, 'Whether a home screen widget for quick code access is available.', 'Ob ein Startbildschirm-Widget für schnellen Code-Zugriff verfügbar ist.'
  UNION ALL SELECT '2fa-authenticator', 'migration_portability', 'import_sources', 'Import sources', 'Import-Quellen', 'multi_enum', 'informational', 'multi_select', 6010, 'From which other authenticator apps tokens can be imported.', 'Aus welchen anderen Authentifikator-Apps Token importiert werden können.'
  UNION ALL SELECT '2fa-authenticator', 'migration_portability', 'export_formats', 'Export formats', 'Export-Formate', 'multi_enum', 'informational', 'multi_select', 6020, 'In which formats token data can be exported.', 'In welchen Formaten Token-Daten exportiert werden können.'
  UNION ALL SELECT '2fa-authenticator', 'migration_portability', 'migration_ease', 'Migration ease', 'Migrationserleichterung', 'enum', 'tradeoff', 'optional', 6030, 'How easy it is to migrate from another authenticator.', 'Wie einfach der Umzug von einem anderen Authentifikator ist.'
  UNION ALL SELECT '2fa-authenticator', 'migration_portability', 'cross_app_uri_scheme', 'Standard otpauth URI scheme', 'Standard-otpauth-URI-Schema', 'boolean', 'beneficial', 'optional', 6040, 'Whether the standard otpauth URI scheme is supported.', 'Ob das Standard-otpauth-URI-Schema unterstützt wird.'
  UNION ALL SELECT '2fa-authenticator', 'usability_ux', 'auto_copy_to_clipboard', 'Auto-copy code to clipboard', 'Code automatisch kopieren', 'boolean', 'beneficial', 'optional', 7010, 'Whether generated codes are automatically copied to the clipboard.', 'Ob generierte Codes automatisch in die Zwischenablage kopiert werden.'
  UNION ALL SELECT '2fa-authenticator', 'usability_ux', 'token_countdown_display', 'Token countdown display', 'Token-Countdown-Anzeige', 'boolean', 'beneficial', 'optional', 7020, 'Whether a visual countdown for token expiration is displayed.', 'Ob ein visueller Countdown für den Token-Ablauf angezeigt wird.'
  UNION ALL SELECT '2fa-authenticator', 'usability_ux', 'dark_mode', 'Dark mode support', 'Dunkelmodus-Unterstützung', 'boolean', 'informational', 'optional', 7030, 'Whether a dark mode or theme is available.', 'Ob ein Dunkelmodus oder Theme verfügbar ist.'
  UNION ALL SELECT '2fa-authenticator', 'usability_ux', 'localization_languages', 'Localization support', 'Lokalisierungsunterstützung', 'enum', 'informational', 'optional', 7040, 'How many languages the app is available in.', 'In wie vielen Sprachen die App verfügbar ist.'
  UNION ALL SELECT '2fa-authenticator', 'usability_ux', 'accessibility_features', 'Accessibility features', 'Barrierefreiheits-Funktionen', 'boolean', 'informational', 'optional', 7050, 'Whether accessibility features like screen reader support are available.', 'Ob Barrierefreiheits-Funktionen wie Screenreader-Unterstützung verfügbar sind.'
  UNION ALL SELECT '2fa-authenticator', 'openness_audit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The openness model of the source code.', 'Das Offenheitsmodell des Quellcodes.'
  UNION ALL SELECT '2fa-authenticator', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhängiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 8020, 'Whether an independent security audit has been completed.', 'Ob ein unabhängiges Sicherheitsaudit durchgeführt wurde.'
  UNION ALL SELECT '2fa-authenticator', 'openness_audit', 'reproducible_builds', 'Reproducible builds', 'Reproduzierbare Builds', 'boolean', 'beneficial', 'optional', 8030, 'Whether builds can be independently verified.', 'Ob Builds unabhängig verifiziert werden können.'
  UNION ALL SELECT '2fa-authenticator', 'openness_audit', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 8040, 'The software license under which the app is distributed.', 'Die Softwarelizenz, unter der die App vertrieben wird.'
  UNION ALL SELECT '2fa-authenticator', 'openness_audit', 'community_contributions', 'Community contributions accepted', 'Community-Beiträge akzeptiert', 'boolean', 'informational', 'optional', 8050, 'Whether external contributions are accepted.', 'Ob externe Beiträge akzeptiert werden.'
  UNION ALL SELECT '2fa-authenticator', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 9010, 'Whether a free tier is available without payment requirements.', 'Ob eine kostenlose Nutzungsstufe ohne Zahlungspflicht verfügbar ist.'
  UNION ALL SELECT '2fa-authenticator', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9020, 'The pricing model used by the app.', 'Das von der App verwendete Preismodell.'
  UNION ALL SELECT '2fa-authenticator', 'pricing_fit', 'premium_features_scope', 'Premium features scope', 'Umfang der Premium-Funktionen', 'enum', 'informational', 'optional', 9030, 'Which features require a paid subscription.', 'Welche Funktionen ein kostenpflichtiges Abonnement erfordern.'
  UNION ALL SELECT '2fa-authenticator', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Common user profiles the app is well suited for.', 'Typische Nutzerprofile, für die die App gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT '2fa-authenticator' AS category_id, 'supported_otp_algorithms' AS criterion_key, 'sha1' AS option_key, 'SHA-1' AS label_en, 'SHA-1' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT '2fa-authenticator', 'supported_otp_algorithms', 'sha256', 'SHA-256', 'SHA-256', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'supported_otp_algorithms', 'sha512', 'SHA-512', 'SHA-512', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'token_entry_methods', 'qr_scan', 'QR code scan', 'QR-Code-Scan', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'token_entry_methods', 'manual_entry', 'Manual entry', 'Manuelle Eingabe', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'token_entry_methods', 'uri_import', 'URI import', 'URI-Import', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'token_entry_methods', 'nfc', 'NFC', 'NFC', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'token_organization', 'folders', 'Folders', 'Ordner', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'token_organization', 'tags', 'Tags', 'Tags', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'token_organization', 'favorites', 'Favorites', 'Favoriten', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'token_organization', 'custom_icons', 'Custom icons', 'Benutzerdefinierte Icons', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'app_lock_method', 'biometric', 'Biometric', 'Biometrisch', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'app_lock_method', 'pin', 'PIN', 'PIN', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'app_lock_method', 'password', 'Password', 'Passwort', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'app_lock_method', 'device_lock', 'Device lock', 'Gerätesperre', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'secure_storage_backend', 'keystore_keychain', 'Keystore or Keychain', 'Keystore oder Keychain', 'positive', 10
  UNION ALL SELECT '2fa-authenticator', 'secure_storage_backend', 'encrypted_file', 'Encrypted file', 'Verschlüsselte Datei', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'secure_storage_backend', 'custom_vault', 'Custom vault', 'Benutzerdefinierter Tresor', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'secure_storage_backend', 'unspecified', 'Unspecified', 'Nicht spezifiziert', 'tradeoff', 40
  UNION ALL SELECT '2fa-authenticator', 'sync_model', 'cloud_vendor', 'Cloud vendor', 'Cloud-Anbieter', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'sync_model', 'self_hosted', 'Self-hosted', 'Selbstgehostet', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'sync_model', 'local_only', 'Local only', 'Nur lokal', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'sync_model', 'third_party_cloud', 'Third-party cloud', 'Drittanbieter-Cloud', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'sync_model', 'no_sync', 'No sync', 'Keine Synchronisierung', 'neutral', 50
  UNION ALL SELECT '2fa-authenticator', 'backup_methods', 'cloud_backup', 'Cloud backup', 'Cloud-Backup', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'backup_methods', 'encrypted_file_export', 'Encrypted file export', 'Verschlüsselter Dateiexport', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'backup_methods', 'qr_code_export', 'QR code export', 'QR-Code-Export', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'backup_methods', 'manual_key_copy', 'Manual key copy', 'Manuelle Schlüsselkopie', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'backup_methods', 'device_transfer', 'Device transfer', 'Geräteübertragung', 'neutral', 50
  UNION ALL SELECT '2fa-authenticator', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 50
  UNION ALL SELECT '2fa-authenticator', 'wearable_support', 'wear_os', 'Wear OS', 'Wear OS', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'wearable_support', 'watchos', 'watchOS', 'watchOS', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'wearable_support', 'none', 'None', 'Keine', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'google_authenticator', 'Google Authenticator', 'Google Authenticator', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'authy', 'Authy', 'Authy', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'aegis', 'Aegis', 'Aegis', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'import_sources', '2fas', '2FAS', '2FAS', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'andotp', 'andOTP', 'andOTP', 'neutral', 50
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'freeotp', 'FreeOTP', 'FreeOTP', 'neutral', 60
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'raivo', 'Raivo', 'Raivo', 'neutral', 70
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'generic_qr', 'Generic QR code', 'Generischer QR-Code', 'neutral', 80
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'generic_uri', 'Generic URI', 'Generischer URI', 'neutral', 90
  UNION ALL SELECT '2fa-authenticator', 'import_sources', 'generic_file', 'Generic file', 'Generische Datei', 'neutral', 100
  UNION ALL SELECT '2fa-authenticator', 'export_formats', 'encrypted_file', 'Encrypted file', 'Verschlüsselte Datei', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'export_formats', 'plain_text_file', 'Plain text file', 'Klartextdatei', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'export_formats', 'qr_codes', 'QR codes', 'QR-Codes', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'export_formats', 'uri_list', 'URI list', 'URI-Liste', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'migration_ease', 'one_click_import', 'One-click import', 'Ein-Klick-Import', 'positive', 10
  UNION ALL SELECT '2fa-authenticator', 'migration_ease', 'file_based_import', 'File-based import', 'Dateibasierter Import', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'migration_ease', 'manual_reentry', 'Manual re-entry', 'Manuelle Neueingabe', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'migration_ease', 'no_export', 'No export', 'Kein Export', 'warning', 40
  UNION ALL SELECT '2fa-authenticator', 'localization_languages', 'many_languages', 'Many languages', 'Viele Sprachen', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'localization_languages', 'few_languages', 'Few languages', 'Wenige Sprachen', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'localization_languages', 'english_only', 'English only', 'Nur Englisch', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT '2fa-authenticator', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT '2fa-authenticator', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'license_type', 'apache', 'Apache', 'Apache', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'license_type', 'bsd', 'BSD', 'BSD', 'neutral', 50
  UNION ALL SELECT '2fa-authenticator', 'license_type', 'other_osi', 'Other OSI', 'Anderes OSI', 'neutral', 60
  UNION ALL SELECT '2fa-authenticator', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 70
  UNION ALL SELECT '2fa-authenticator', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'pricing_model', 'donation_based', 'Donation based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT '2fa-authenticator', 'premium_features_scope', 'all_free', 'All free', 'Alles kostenlos', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'premium_features_scope', 'backup_sync_paid', 'Backup and sync paid', 'Backup und Sync kostenpflichtig', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'premium_features_scope', 'advanced_paid', 'Advanced paid', 'Erweitert kostenpflichtig', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'premium_features_scope', 'enterprise_only', 'Enterprise only', 'Nur Unternehmen', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'fit_profiles', 'personal', 'Personal', 'Persönlich', 'neutral', 10
  UNION ALL SELECT '2fa-authenticator', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'neutral', 20
  UNION ALL SELECT '2fa-authenticator', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 30
  UNION ALL SELECT '2fa-authenticator', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 40
  UNION ALL SELECT '2fa-authenticator', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 50
  UNION ALL SELECT '2fa-authenticator', 'fit_profiles', 'self_hoster', 'Self-hoster', 'Self-Hoster', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = '2fa-authenticator'
JOIN `matrix_criteria` mc
  ON mc.category_id = '2fa-authenticator'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('024-2fa-authenticator-matrix-criteria');
