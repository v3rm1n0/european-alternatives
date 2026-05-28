-- Migration 023: Define Password Manager category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('password-manager', 'vault_credential_types', 'Vault & Credential Types', 'Tresor & Anmeldedaten-Typen', 'What kinds of data the manager stores and how it structures them.', 'Welche Arten von Daten der Manager speichert und wie sie strukturiert sind.', 100),
  ('password-manager', 'security_encryption', 'Security & Encryption', 'Sicherheit & Verschlüsselung', 'Encryption model, key derivation, and security architecture.', 'Verschlüsselungsmodell, Schlüsselableitung und Sicherheitsarchitektur.', 200),
  ('password-manager', 'authentication_access', 'Authentication & Access', 'Authentifizierung & Zugriff', 'How users authenticate and protect their vault.', 'Wie Nutzer sich authentifizieren und ihren Tresor schützen.', 300),
  ('password-manager', 'platform_autofill', 'Platform & Autofill', 'Plattform & Autofill', 'Client availability, browser integration, and autofill quality.', 'Client-Verfügbarkeit, Browser-Integration und Autofill-Qualität.', 400),
  ('password-manager', 'sharing_team_features', 'Sharing & Team Features', 'Teilen & Team-Funktionen', 'Password sharing, organizations, and team management.', 'Passwort-Freigabe, Organisationen und Teamverwaltung.', 500),
  ('password-manager', 'sync_architecture', 'Sync & Architecture', 'Synchronisierung & Architektur', 'How data is stored and synchronized.', 'Wie Daten gespeichert und synchronisiert werden.', 600),
  ('password-manager', 'import_export_portability', 'Import, Export & Portability', 'Import, Export & Portabilität', 'Data migration and export capabilities.', 'Datenmigration und Exportmöglichkeiten.', 700),
  ('password-manager', 'password_generation_tools', 'Password Generation & Tools', 'Passwort-Generierung & Werkzeuge', 'Built-in security tools beyond storage.', 'Integrierte Sicherheitswerkzeuge über die Speicherung hinaus.', 800),
  ('password-manager', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model and target user profiles.', 'Preismodell und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'password-manager' AS category_id, 'vault_credential_types' AS group_key, 'credential_types' AS criterion_key, 'Supported credential types' AS label_en, 'Unterstützte Anmeldedaten-Typen' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Which types of credentials and data can be stored.' AS help_text_en, 'Welche Arten von Anmeldedaten und Daten gespeichert werden können.' AS help_text_de
  UNION ALL SELECT 'password-manager', 'vault_credential_types', 'custom_fields', 'Custom fields', 'Benutzerdefinierte Felder', 'boolean', 'beneficial', 'optional', 1020, 'Whether custom data fields can be added to entries.', 'Ob benutzerdefinierte Datenfelder zu Einträgen hinzugefügt werden können.'
  UNION ALL SELECT 'password-manager', 'vault_credential_types', 'folder_organization', 'Folder or collection organization', 'Ordner- oder Sammlungsorganisation', 'boolean', 'beneficial', 'optional', 1030, 'Whether entries can be organized in folders or collections.', 'Ob Einträge in Ordnern oder Sammlungen organisiert werden können.'
  UNION ALL SELECT 'password-manager', 'vault_credential_types', 'tags_support', 'Tag-based organization', 'Tag-basierte Organisation', 'boolean', 'beneficial', 'optional', 1040, 'Whether entries can be organized with tags.', 'Ob Einträge mit Tags organisiert werden können.'
  UNION ALL SELECT 'password-manager', 'vault_credential_types', 'secure_notes', 'Secure notes', 'Sichere Notizen', 'boolean', 'beneficial', 'optional', 1050, 'Whether secure notes can be stored.', 'Ob sichere Notizen gespeichert werden können.'
  UNION ALL SELECT 'password-manager', 'vault_credential_types', 'file_attachments', 'Encrypted file attachments', 'Verschlüsselte Dateianhänge', 'boolean', 'beneficial', 'optional', 1060, 'Whether encrypted file attachments can be stored.', 'Ob verschlüsselte Dateianhänge gespeichert werden können.'
  UNION ALL SELECT 'password-manager', 'security_encryption', 'encryption_model', 'Encryption model', 'Verschlüsselungsmodell', 'enum', 'tradeoff', 'must_match', 2010, 'Which encryption algorithm is used to protect stored data.', 'Welches Verschlüsselungsverfahren zum Schutz der gespeicherten Daten verwendet wird.'
  UNION ALL SELECT 'password-manager', 'security_encryption', 'key_derivation', 'Key derivation function', 'Schlüsselableitungsfunktion', 'enum', 'informational', 'optional', 2020, 'Which function is used to derive the encryption key from the master password.', 'Welche Funktion zur Ableitung des Verschlüsselungsschlüssels aus dem Master-Passwort verwendet wird.'
  UNION ALL SELECT 'password-manager', 'security_encryption', 'zero_knowledge', 'Zero-knowledge architecture', 'Zero-Knowledge-Architektur', 'boolean', 'beneficial', 'must_match', 2030, 'Whether the provider has no access to stored data.', 'Ob der Anbieter keinen Zugriff auf die gespeicherten Daten hat.'
  UNION ALL SELECT 'password-manager', 'security_encryption', 'security_audit', 'Independent security audit', 'Unabhängiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 2040, 'Whether an independent security audit has been completed.', 'Ob ein unabhängiges Sicherheitsaudit durchgeführt wurde.'
  UNION ALL SELECT 'password-manager', 'security_encryption', 'breach_monitoring', 'Breach monitoring', 'Datenleck-Überwachung', 'boolean', 'beneficial', 'optional', 2050, 'Whether monitoring for compromised credentials is offered.', 'Ob eine Überwachung auf kompromittierte Zugangsdaten angeboten wird.'
  UNION ALL SELECT 'password-manager', 'security_encryption', 'password_health_report', 'Password health report', 'Passwort-Gesundheitsbericht', 'boolean', 'beneficial', 'optional', 2060, 'Whether a report on password strength and reuse is generated.', 'Ob ein Bericht zur Stärke und Wiederverwendung von Passwörtern erstellt wird.'
  UNION ALL SELECT 'password-manager', 'security_encryption', 'e2ee_sharing', 'End-to-end encrypted sharing', 'Ende-zu-Ende-verschlüsseltes Teilen', 'boolean', 'beneficial', 'optional', 2070, 'Whether shared entries are transmitted with end-to-end encryption.', 'Ob geteilte Einträge Ende-zu-Ende-verschlüsselt übertragen werden.'
  UNION ALL SELECT 'password-manager', 'authentication_access', 'master_password_model', 'Master password model', 'Master-Passwort-Modell', 'enum', 'tradeoff', 'optional', 3010, 'How the master password for vault unlocking works.', 'Wie das Master-Passwort zur Tresor-Entsperrung funktioniert.'
  UNION ALL SELECT 'password-manager', 'authentication_access', 'biometric_unlock', 'Biometric unlock', 'Biometrische Entsperrung', 'boolean', 'beneficial', 'optional', 3020, 'Whether the vault can be unlocked via fingerprint or face recognition.', 'Ob der Tresor per Fingerabdruck oder Gesichtserkennung entsperrt werden kann.'
  UNION ALL SELECT 'password-manager', 'authentication_access', 'hardware_key_support', 'Hardware security key support', 'Hardware-Sicherheitsschlüssel-Unterstützung', 'boolean', 'beneficial', 'optional', 3030, 'Whether hardware security keys are supported for authentication.', 'Ob Hardware-Sicherheitsschlüssel zur Authentifizierung unterstützt werden.'
  UNION ALL SELECT 'password-manager', 'authentication_access', 'two_factor_methods', 'Supported 2FA methods', 'Unterstützte 2FA-Methoden', 'multi_enum', 'beneficial', 'multi_select', 3040, 'Which two-factor authentication methods are supported.', 'Welche Zwei-Faktor-Authentifizierungsmethoden unterstützt werden.'
  UNION ALL SELECT 'password-manager', 'authentication_access', 'passwordless_unlock', 'Passwordless unlock option', 'Passwortlose Entsperroption', 'boolean', 'informational', 'optional', 3050, 'Whether the vault can be unlocked without a master password.', 'Ob der Tresor ohne Master-Passwort entsperrt werden kann.'
  UNION ALL SELECT 'password-manager', 'authentication_access', 'emergency_access', 'Emergency access', 'Notfallzugriff', 'boolean', 'beneficial', 'optional', 3060, 'Whether a trusted contact can gain access in an emergency.', 'Ob ein vertrauenswürdiger Kontakt im Notfall Zugriff erhalten kann.'
  UNION ALL SELECT 'password-manager', 'platform_autofill', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 4010, 'Which platforms the manager is available on.', 'Auf welchen Plattformen der Manager verfügbar ist.'
  UNION ALL SELECT 'password-manager', 'platform_autofill', 'browser_extensions', 'Browser extensions', 'Browser-Erweiterungen', 'multi_enum', 'informational', 'multi_select', 4020, 'Which browser extensions are available.', 'Für welche Browser Erweiterungen verfügbar sind.'
  UNION ALL SELECT 'password-manager', 'platform_autofill', 'autofill_capability', 'Autofill capability', 'Autofill-Fähigkeit', 'multi_enum', 'beneficial', 'multi_select', 4030, 'Which autofill methods are supported.', 'Welche Autofill-Methoden unterstützt werden.'
  UNION ALL SELECT 'password-manager', 'platform_autofill', 'offline_access', 'Offline vault access', 'Offline-Tresorzugriff', 'boolean', 'beneficial', 'optional', 4040, 'Whether the vault can be accessed without an internet connection.', 'Ob auf den Tresor ohne Internetverbindung zugegriffen werden kann.'
  UNION ALL SELECT 'password-manager', 'platform_autofill', 'cli_available', 'CLI client available', 'CLI-Client verfügbar', 'boolean', 'informational', 'optional', 4050, 'Whether a command-line client is available.', 'Ob ein Kommandozeilen-Client verfügbar ist.'
  UNION ALL SELECT 'password-manager', 'sharing_team_features', 'password_sharing', 'Password sharing', 'Passwort-Freigabe', 'boolean', 'beneficial', 'optional', 5010, 'Whether individual passwords can be shared with other users.', 'Ob einzelne Passwörter mit anderen Nutzern geteilt werden können.'
  UNION ALL SELECT 'password-manager', 'sharing_team_features', 'shared_vaults', 'Shared vaults or collections', 'Geteilte Tresore oder Sammlungen', 'boolean', 'beneficial', 'optional', 5020, 'Whether shared vaults or collections can be created.', 'Ob gemeinsam genutzte Tresore oder Sammlungen erstellt werden können.'
  UNION ALL SELECT 'password-manager', 'sharing_team_features', 'organization_support', 'Organization or team support', 'Organisations- oder Team-Unterstützung', 'boolean', 'beneficial', 'optional', 5030, 'Whether organizations or teams can be managed.', 'Ob Organisationen oder Teams verwaltet werden können.'
  UNION ALL SELECT 'password-manager', 'sharing_team_features', 'role_based_access', 'Role-based access control', 'Rollenbasierte Zugriffskontrolle', 'boolean', 'beneficial', 'optional', 5040, 'Whether different permission roles can be assigned.', 'Ob verschiedene Berechtigungsrollen zugewiesen werden können.'
  UNION ALL SELECT 'password-manager', 'sharing_team_features', 'sharing_granularity', 'Sharing permission granularity', 'Freigabe-Berechtigungsgranularität', 'enum', 'informational', 'optional', 5050, 'How granularly sharing permissions can be configured.', 'Wie feingranular Freigabeberechtigungen eingestellt werden können.'
  UNION ALL SELECT 'password-manager', 'sync_architecture', 'sync_model', 'Sync model', 'Synchronisierungsmodell', 'enum', 'tradeoff', 'must_match', 6010, 'How data is synchronized between devices.', 'Wie Daten zwischen Geräten synchronisiert werden.'
  UNION ALL SELECT 'password-manager', 'sync_architecture', 'self_hosting_available', 'Self-hosting available', 'Self-Hosting verfügbar', 'boolean', 'beneficial', 'must_match', 6020, 'Whether the manager can be operated on private infrastructure.', 'Ob der Manager auf eigener Infrastruktur betrieben werden kann.'
  UNION ALL SELECT 'password-manager', 'sync_architecture', 'local_only_option', 'Local-only vault option', 'Lokale Tresor-Option', 'boolean', 'tradeoff', 'optional', 6030, 'Whether the vault can be used locally without cloud synchronization.', 'Ob der Tresor ausschließlich lokal ohne Cloud-Synchronisierung genutzt werden kann.'
  UNION ALL SELECT 'password-manager', 'sync_architecture', 'open_protocol_or_format', 'Open vault format or protocol', 'Offenes Tresorformat oder Protokoll', 'boolean', 'beneficial', 'optional', 6040, 'Whether an open file format or synchronization protocol is used.', 'Ob ein offenes Dateiformat oder Synchronisierungsprotokoll verwendet wird.'
  UNION ALL SELECT 'password-manager', 'sync_architecture', 'third_party_clients', 'Third-party clients allowed', 'Drittanbieter-Clients erlaubt', 'boolean', 'tradeoff', 'optional', 6050, 'Whether alternative clients are allowed to access the vault.', 'Ob alternative Clients zur Nutzung des Tresors erlaubt sind.'
  UNION ALL SELECT 'password-manager', 'import_export_portability', 'import_formats', 'Import formats', 'Importformate', 'multi_enum', 'informational', 'multi_select', 7010, 'Which formats are supported for data import.', 'Welche Formate für den Datenimport unterstützt werden.'
  UNION ALL SELECT 'password-manager', 'import_export_portability', 'export_formats', 'Export formats', 'Exportformate', 'multi_enum', 'informational', 'multi_select', 7020, 'Which formats are supported for data export.', 'Welche Formate für den Datenexport unterstützt werden.'
  UNION ALL SELECT 'password-manager', 'import_export_portability', 'encrypted_export', 'Encrypted export available', 'Verschlüsselter Export verfügbar', 'boolean', 'beneficial', 'optional', 7030, 'Whether data can be exported in encrypted form.', 'Ob Daten verschlüsselt exportiert werden können.'
  UNION ALL SELECT 'password-manager', 'import_export_portability', 'data_portability', 'Data portability to other managers', 'Datenportabilität zu anderen Managern', 'enum', 'tradeoff', 'optional', 7040, 'How easy it is to switch to another password manager.', 'Wie einfach der Wechsel zu einem anderen Passwort-Manager ist.'
  UNION ALL SELECT 'password-manager', 'password_generation_tools', 'password_generator', 'Password generator', 'Passwort-Generator', 'boolean', 'beneficial', 'optional', 8010, 'Whether a built-in password generator is available.', 'Ob ein integrierter Passwort-Generator verfügbar ist.'
  UNION ALL SELECT 'password-manager', 'password_generation_tools', 'passphrase_generator', 'Passphrase generator', 'Passphrasen-Generator', 'boolean', 'beneficial', 'optional', 8020, 'Whether a word-based passphrase generator is available.', 'Ob ein Generator für Passphrasen aus Wörtern verfügbar ist.'
  UNION ALL SELECT 'password-manager', 'password_generation_tools', 'username_generator', 'Username or email alias generator', 'Benutzernamen- oder E-Mail-Alias-Generator', 'boolean', 'beneficial', 'optional', 8030, 'Whether a username or email alias generator is available.', 'Ob ein Generator für Benutzernamen oder E-Mail-Aliase verfügbar ist.'
  UNION ALL SELECT 'password-manager', 'password_generation_tools', 'built_in_totp', 'Built-in TOTP authenticator', 'Integrierter TOTP-Authentifikator', 'boolean', 'informational', 'optional', 8040, 'Whether a built-in TOTP authenticator for two-factor codes is available.', 'Ob ein integrierter TOTP-Authentifikator für Zwei-Faktor-Codes verfügbar ist.'
  UNION ALL SELECT 'password-manager', 'password_generation_tools', 'send_or_secure_share', 'Secure one-time sharing', 'Sicheres einmaliges Teilen', 'boolean', 'beneficial', 'optional', 8050, 'Whether data can be securely shared once with third parties.', 'Ob Daten sicher einmalig mit Dritten geteilt werden können.'
  UNION ALL SELECT 'password-manager', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 9010, 'Whether a free tier is available without payment requirements.', 'Ob eine kostenlose Nutzungsstufe ohne Zahlungspflicht verfügbar ist.'
  UNION ALL SELECT 'password-manager', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9020, 'The pricing model used by the manager.', 'Das vom Manager verwendete Preismodell.'
  UNION ALL SELECT 'password-manager', 'pricing_fit', 'family_plan', 'Family plan available', 'Familientarif verfügbar', 'boolean', 'informational', 'optional', 9030, 'Whether a dedicated family plan is offered.', 'Ob ein spezieller Familientarif angeboten wird.'
  UNION ALL SELECT 'password-manager', 'pricing_fit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9040, 'The openness model of the source code.', 'Das Offenheitsmodell des Quellcodes.'
  UNION ALL SELECT 'password-manager', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user profiles the manager is well suited for.', 'Typische Nutzerprofile, für die der Manager gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'password-manager' AS category_id, 'credential_types' AS criterion_key, 'passwords' AS option_key, 'Passwords' AS label_en, 'Passwörter' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'password-manager', 'credential_types', 'passkeys', 'Passkeys', 'Passkeys', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'credential_types', 'totp_codes', 'TOTP codes', 'TOTP-Codes', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'credential_types', 'credit_cards', 'Credit cards', 'Kreditkarten', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'credential_types', 'identities', 'Identities', 'Identitäten', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'credential_types', 'secure_notes', 'Secure notes', 'Sichere Notizen', 'neutral', 60
  UNION ALL SELECT 'password-manager', 'credential_types', 'ssh_keys', 'SSH keys', 'SSH-Schlüssel', 'neutral', 70
  UNION ALL SELECT 'password-manager', 'credential_types', 'api_keys', 'API keys', 'API-Schlüssel', 'neutral', 80
  UNION ALL SELECT 'password-manager', 'encryption_model', 'aes_256', 'AES-256', 'AES-256', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'encryption_model', 'xchacha20', 'XChaCha20', 'XChaCha20', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'encryption_model', 'aes_256_gcm', 'AES-256-GCM', 'AES-256-GCM', 'positive', 30
  UNION ALL SELECT 'password-manager', 'encryption_model', 'other_documented', 'Other documented', 'Anderes dokumentiertes', 'tradeoff', 40
  UNION ALL SELECT 'password-manager', 'key_derivation', 'argon2', 'Argon2', 'Argon2', 'positive', 10
  UNION ALL SELECT 'password-manager', 'key_derivation', 'pbkdf2', 'PBKDF2', 'PBKDF2', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'key_derivation', 'scrypt', 'scrypt', 'scrypt', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'key_derivation', 'bcrypt', 'bcrypt', 'bcrypt', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'key_derivation', 'other', 'Other', 'Anderes', 'tradeoff', 50
  UNION ALL SELECT 'password-manager', 'master_password_model', 'single_master_password', 'Single master password', 'Einzelnes Master-Passwort', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'master_password_model', 'key_file_only', 'Key file only', 'Nur Schlüsseldatei', 'tradeoff', 20
  UNION ALL SELECT 'password-manager', 'master_password_model', 'master_plus_key_file', 'Master password plus key file', 'Master-Passwort plus Schlüsseldatei', 'positive', 30
  UNION ALL SELECT 'password-manager', 'master_password_model', 'account_key_model', 'Account key model', 'Kontoschlüssel-Modell', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'two_factor_methods', 'totp', 'TOTP', 'TOTP', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'two_factor_methods', 'hardware_key_u2f', 'Hardware key (U2F)', 'Hardware-Schlüssel (U2F)', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'two_factor_methods', 'email', 'Email', 'E-Mail', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'two_factor_methods', 'push_notification', 'Push notification', 'Push-Benachrichtigung', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'two_factor_methods', 'duo', 'Duo', 'Duo', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'password-manager', 'browser_extensions', 'chrome', 'Chrome', 'Chrome', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'browser_extensions', 'firefox', 'Firefox', 'Firefox', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'browser_extensions', 'safari', 'Safari', 'Safari', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'browser_extensions', 'edge', 'Edge', 'Edge', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'browser_extensions', 'brave', 'Brave', 'Brave', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'autofill_capability', 'browser_extension', 'Browser extension', 'Browser-Erweiterung', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'autofill_capability', 'system_autofill', 'System autofill', 'System-Autofill', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'autofill_capability', 'mobile_autofill', 'Mobile autofill', 'Mobiles Autofill', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'autofill_capability', 'passkey_autofill', 'Passkey autofill', 'Passkey-Autofill', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'sharing_granularity', 'read_only', 'Read only', 'Nur Lesen', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'sharing_granularity', 'read_write', 'Read and write', 'Lesen und Schreiben', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'sharing_granularity', 'custom_permissions', 'Custom permissions', 'Benutzerdefinierte Berechtigungen', 'positive', 30
  UNION ALL SELECT 'password-manager', 'sharing_granularity', 'no_sharing', 'No sharing', 'Kein Teilen', 'tradeoff', 40
  UNION ALL SELECT 'password-manager', 'sync_model', 'cloud_vendor', 'Cloud vendor', 'Cloud-Anbieter', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'sync_model', 'self_hosted_server', 'Self-hosted server', 'Selbstgehosteter Server', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'sync_model', 'local_file_sync', 'Local file sync', 'Lokale Dateisynchronisierung', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'sync_model', 'p2p_sync', 'Peer-to-peer sync', 'Peer-to-Peer-Synchronisierung', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'sync_model', 'no_sync', 'No sync', 'Keine Synchronisierung', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'import_formats', 'csv', 'CSV', 'CSV', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'import_formats', 'json', 'JSON', 'JSON', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'import_formats', 'bitwarden_json', 'Bitwarden JSON', 'Bitwarden-JSON', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'import_formats', 'lastpass_csv', 'LastPass CSV', 'LastPass-CSV', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'import_formats', 'onepassword_1pux', '1Password 1PUX', '1Password-1PUX', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'import_formats', 'keepass_kdbx', 'KeePass KDBX', 'KeePass-KDBX', 'neutral', 60
  UNION ALL SELECT 'password-manager', 'import_formats', 'chrome_csv', 'Chrome CSV', 'Chrome-CSV', 'neutral', 70
  UNION ALL SELECT 'password-manager', 'export_formats', 'csv', 'CSV', 'CSV', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'export_formats', 'json', 'JSON', 'JSON', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'export_formats', 'encrypted_json', 'Encrypted JSON', 'Verschlüsseltes JSON', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'export_formats', 'keepass_kdbx', 'KeePass KDBX', 'KeePass-KDBX', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'data_portability', 'easy_standard_format', 'Easy standard format', 'Einfaches Standardformat', 'positive', 10
  UNION ALL SELECT 'password-manager', 'data_portability', 'vendor_specific_export', 'Vendor-specific export', 'Anbieterspezifischer Export', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'data_portability', 'manual_csv_only', 'Manual CSV only', 'Nur manuelles CSV', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'data_portability', 'no_export', 'No export', 'Kein Export', 'warning', 40
  UNION ALL SELECT 'password-manager', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'pricing_model', 'one_time_license', 'One-time license', 'Einmallizenz', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'pricing_model', 'donation_based', 'Donation based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'password-manager', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'password-manager', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'password-manager', 'fit_profiles', 'personal', 'Personal', 'Persönlich', 'neutral', 10
  UNION ALL SELECT 'password-manager', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 20
  UNION ALL SELECT 'password-manager', 'fit_profiles', 'small_team', 'Small team', 'Kleines Team', 'neutral', 30
  UNION ALL SELECT 'password-manager', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 40
  UNION ALL SELECT 'password-manager', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 50
  UNION ALL SELECT 'password-manager', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'neutral', 60
  UNION ALL SELECT 'password-manager', 'fit_profiles', 'self_hoster', 'Self-hoster', 'Self-Hoster', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'password-manager'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'password-manager'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('023-password-manager-matrix-criteria');
