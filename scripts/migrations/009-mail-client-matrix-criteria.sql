-- Migration 009: Define Mail Client category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('mail-client', 'client_model_platforms', 'Client Model & Platforms', 'Client-Modell & Plattformen', 'Client type, platform support, distribution, account handling, and offline use.', 'Client-Typ, Plattformunterstuetzung, Vertrieb, Kontenverwaltung und Offline-Nutzung.', 100),
  ('mail-client', 'accounts_protocols', 'Accounts & Protocols', 'Konten & Protokolle', 'Supported account types, mail protocols, authentication, identities, and setup.', 'Unterstuetzte Kontotypen, Mail-Protokolle, Authentifizierung, Identitaeten und Einrichtung.', 200),
  ('mail-client', 'reading_organization', 'Reading & Organization', 'Lesen & Organisation', 'Threading, folders, labels, local search, filters, notifications, and triage.', 'Konversationsansichten, Ordner, Labels, lokale Suche, Filter, Benachrichtigungen und Triage.', 300),
  ('mail-client', 'composing_productivity', 'Composing & Productivity', 'Schreiben & Produktivitaet', 'Compose formats, signatures, templates, scheduling, attachments, and shortcuts.', 'Schreibformate, Signaturen, Vorlagen, Zeitplanung, Anhaenge und Tastaturkurzbefehle.', 400),
  ('mail-client', 'security_privacy', 'Security & Privacy', 'Sicherheit & Datenschutz', 'Remote content controls, tracker protection, warnings, credential storage, app lock, and network privacy.', 'Kontrollen fuer externe Inhalte, Tracking-Schutz, Warnungen, Zugangsdaten-Speicherung, App-Sperre und Netzwerkdatenschutz.', 500),
  ('mail-client', 'encryption_signing', 'Encryption & Signing', 'Verschluesselung & Signaturen', 'OpenPGP, S/MIME, Autocrypt, key management, local encryption, and recipient policies.', 'OpenPGP, S/MIME, Autocrypt, Schluesselverwaltung, lokale Verschluesselung und Empfaengerrichtlinien.', 600),
  ('mail-client', 'data_portability_sync', 'Data, Portability & Sync', 'Daten, Portabilitaet & Sync', 'Import, export, local storage, profile portability, contacts, and calendars.', 'Import, Export, lokaler Speicher, Profil-Portabilitaet, Kontakte und Kalender.', 700),
  ('mail-client', 'customization_integrations', 'Customization & Integrations', 'Anpassung & Integrationen', 'Add-ons, layout options, external tools, and managed deployment capabilities.', 'Add-ons, Layoutoptionen, externe Werkzeuge und verwaltete Bereitstellung.', 800),
  ('mail-client', 'accessibility_fit', 'Accessibility & Fit', 'Barrierefreiheit & Eignung', 'Accessibility affordances, localization coverage, and common user fit profiles.', 'Barrierefreiheitsfunktionen, Lokalisierungsumfang und typische Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'mail-client' AS category_id, 'client_model_platforms' AS group_key, 'client_model' AS criterion_key, 'Client model' AS label_en, 'Client-Modell' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The main application model used to deliver the mail client experience.' AS help_text_en, 'Das grundlegende Client-Modell fuer die Mail-Client-Nutzung.' AS help_text_de
  UNION ALL SELECT 'mail-client', 'client_model_platforms', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 1020, 'Operating systems and app platforms with maintained client support.', 'Betriebssysteme und App-Plattformen mit gepflegter Client-Unterstuetzung.'
  UNION ALL SELECT 'mail-client', 'client_model_platforms', 'distribution_channels', 'Distribution channels', 'Vertriebskanaele', 'multi_enum', 'informational', 'multi_select', 1030, 'Documented ways users can install or receive the client application.', 'Dokumentierte Wege, ueber die Nutzer die Client-App installieren oder beziehen koennen.'
  UNION ALL SELECT 'mail-client', 'client_model_platforms', 'offline_mail_access', 'Offline mail access', 'Offline-Mailzugriff', 'boolean', 'beneficial', 'must_match', 1040, 'Whether messages remain readable and manageable without a live network connection.', 'Ob Nachrichten ohne aktive Netzwerkverbindung lesbar und verwaltbar bleiben.'
  UNION ALL SELECT 'mail-client', 'client_model_platforms', 'multi_account_support', 'Multiple accounts', 'Mehrere Konten', 'boolean', 'beneficial', 'must_match', 1050, 'Whether the client can manage more than one mail account in one profile or app.', 'Ob der Client mehr als ein Mail-Konto in einem Profil oder einer App verwalten kann.'
  UNION ALL SELECT 'mail-client', 'client_model_platforms', 'unified_inbox', 'Unified inbox', 'Gemeinsamer Posteingang', 'boolean', 'beneficial', 'optional', 1060, 'Whether mail from multiple accounts can be shown in a combined inbox view.', 'Ob Mail aus mehreren Konten in einer gemeinsamen Posteingangsansicht angezeigt werden kann.'
  UNION ALL SELECT 'mail-client', 'accounts_protocols', 'supported_account_types', 'Supported account types', 'Unterstuetzte Kontotypen', 'multi_enum', 'informational', 'multi_select', 2010, 'Mail account families the client documents as supported.', 'Mail-Kontotypen, die der Client als unterstuetzt dokumentiert.'
  UNION ALL SELECT 'mail-client', 'accounts_protocols', 'mail_protocols', 'Mail protocols', 'Mail-Protokolle', 'multi_enum', 'beneficial', 'multi_select', 2020, 'Mail access and submission protocols supported by the client.', 'Vom Client unterstuetzte Protokolle fuer Mail-Zugriff und Versand.'
  UNION ALL SELECT 'mail-client', 'accounts_protocols', 'oauth2_support', 'OAuth2 account support', 'OAuth2-Kontounterstuetzung', 'multi_enum', 'beneficial', 'multi_select', 2030, 'OAuth2 provider flows or generic OAuth2 support available during account setup.', 'OAuth2-Anbieterablaeufe oder generische OAuth2-Unterstuetzung bei der Kontoeinrichtung.'
  UNION ALL SELECT 'mail-client', 'accounts_protocols', 'automatic_account_setup', 'Automatic account setup', 'Automatische Kontoeinrichtung', 'boolean', 'beneficial', 'optional', 2040, 'Whether the client can discover server settings automatically during account setup.', 'Ob der Client Servereinstellungen bei der Kontoeinrichtung automatisch erkennen kann.'
  UNION ALL SELECT 'mail-client', 'accounts_protocols', 'identity_alias_management', 'Identity and alias management', 'Identitaets- und Aliasverwaltung', 'multi_enum', 'informational', 'multi_select', 2050, 'Controls for sender identities, signatures, aliases, and reply addresses.', 'Kontrollen fuer Absenderidentitaeten, Signaturen, Aliasse und Antwortadressen.'
  UNION ALL SELECT 'mail-client', 'reading_organization', 'conversation_threading', 'Conversation threading', 'Konversationsansicht', 'boolean', 'beneficial', 'optional', 3010, 'Whether related messages can be grouped into conversation threads.', 'Ob zusammengehoerige Nachrichten in Konversationsansichten gruppiert werden koennen.'
  UNION ALL SELECT 'mail-client', 'reading_organization', 'folder_label_model', 'Folder and label model', 'Ordner- und Label-Modell', 'enum', 'tradeoff', 'optional', 3020, 'How the client represents message organization through folders, labels, or virtual views.', 'Wie der Client Nachrichtenorganisation ueber Ordner, Labels oder virtuelle Ansichten abbildet.'
  UNION ALL SELECT 'mail-client', 'reading_organization', 'local_search_scope', 'Local search scope', 'Umfang der lokalen Suche', 'enum', 'informational', 'optional', 3030, 'What local search indexes can cover after mail is synchronized to the client.', 'Welche Inhalte lokale Suchindizes nach der Synchronisierung in den Client abdecken koennen.'
  UNION ALL SELECT 'mail-client', 'reading_organization', 'message_filter_rules', 'Message filter rules', 'Nachrichtenfilterregeln', 'multi_enum', 'beneficial', 'multi_select', 3040, 'Rule and filtering features that help organize or triage incoming mail.', 'Regel- und Filterfunktionen zur Organisation oder Triage eingehender Mail.'
  UNION ALL SELECT 'mail-client', 'reading_organization', 'saved_searches_smart_folders', 'Saved searches or smart folders', 'Gespeicherte Suchen oder intelligente Ordner', 'boolean', 'beneficial', 'optional', 3050, 'Whether reusable searches or smart folders can be saved in the client.', 'Ob wiederverwendbare Suchen oder intelligente Ordner im Client gespeichert werden koennen.'
  UNION ALL SELECT 'mail-client', 'reading_organization', 'notification_controls', 'Notification controls', 'Benachrichtigungskontrollen', 'multi_enum', 'informational', 'multi_select', 3060, 'Controls for account, folder, schedule, or priority-based notifications.', 'Kontrollen fuer konto-, ordner-, zeitplan- oder prioritaetsbasierte Benachrichtigungen.'
  UNION ALL SELECT 'mail-client', 'composing_productivity', 'compose_format_modes', 'Compose format modes', 'Schreibformat-Modi', 'multi_enum', 'informational', 'multi_select', 4010, 'Message composition formats and per-message compose controls.', 'Nachrichtenformate und Kontrollmoeglichkeiten beim Schreiben einzelner Nachrichten.'
  UNION ALL SELECT 'mail-client', 'composing_productivity', 'signatures_templates', 'Signatures and templates', 'Signaturen und Vorlagen', 'multi_enum', 'beneficial', 'multi_select', 4020, 'Reusable writing aids such as signatures, HTML signatures, templates, or stationery.', 'Wiederverwendbare Schreibhilfen wie Signaturen, HTML-Signaturen, Vorlagen oder Briefpapier.'
  UNION ALL SELECT 'mail-client', 'composing_productivity', 'scheduled_send_model', 'Scheduled send model', 'Modell fuer geplantes Senden', 'enum', 'tradeoff', 'optional', 4030, 'How the client supports composing now and sending later.', 'Wie der Client das Schreiben jetzt und Senden spaeter unterstuetzt.'
  UNION ALL SELECT 'mail-client', 'composing_productivity', 'attachment_handling', 'Attachment handling', 'Anhangsverwaltung', 'multi_enum', 'beneficial', 'multi_select', 4040, 'Attachment workflows and warnings available while composing mail.', 'Anhangsablaeufe und Warnungen, die beim Schreiben von Mail verfuegbar sind.'
  UNION ALL SELECT 'mail-client', 'composing_productivity', 'keyboard_shortcuts', 'Keyboard shortcuts', 'Tastaturkurzbefehle', 'boolean', 'beneficial', 'optional', 4050, 'Whether documented keyboard shortcuts support common reading and composing tasks.', 'Ob dokumentierte Tastaturkurzbefehle haeufige Lese- und Schreibaufgaben unterstuetzen.'
  UNION ALL SELECT 'mail-client', 'security_privacy', 'remote_content_blocking', 'Remote-content blocking', 'Blockieren externer Inhalte', 'boolean', 'beneficial', 'must_match', 5010, 'Whether remote images or external message content can be blocked by default.', 'Ob externe Bilder oder externe Nachrichteninhalte standardmaessig blockiert werden koennen.'
  UNION ALL SELECT 'mail-client', 'security_privacy', 'tracker_protection', 'Tracker protection', 'Tracking-Schutz', 'multi_enum', 'beneficial', 'multi_select', 5020, 'Client-side protections against tracking pixels, tracked links, or sender profiling.', 'Client-seitige Schutzfunktionen gegen Tracking-Pixel, getrackte Links oder Absenderprofile.'
  UNION ALL SELECT 'mail-client', 'security_privacy', 'phishing_malware_warnings', 'Phishing and malware warnings', 'Phishing- und Malware-Warnungen', 'multi_enum', 'beneficial', 'multi_select', 5030, 'Warnings for suspicious links, spoofing, risky attachments, or scanner integrations.', 'Warnungen fuer verdaechtige Links, Spoofing, riskante Anhaenge oder Scanner-Integrationen.'
  UNION ALL SELECT 'mail-client', 'security_privacy', 'credential_storage_model', 'Credential storage model', 'Modell zur Zugangsdaten-Speicherung', 'enum', 'risk', 'optional', 5040, 'How the client stores mail credentials, tokens, or profile secrets locally.', 'Wie der Client Mail-Zugangsdaten, Token oder Profilgeheimnisse lokal speichert.'
  UNION ALL SELECT 'mail-client', 'security_privacy', 'app_lock_or_profile_password', 'App lock or profile password', 'App-Sperre oder Profilpasswort', 'boolean', 'beneficial', 'optional', 5050, 'Whether the client can require an app lock, master password, or profile password.', 'Ob der Client eine App-Sperre, ein Master-Passwort oder ein Profilpasswort verlangen kann.'
  UNION ALL SELECT 'mail-client', 'security_privacy', 'proxy_tor_support', 'Proxy or Tor support', 'Proxy- oder Tor-Unterstuetzung', 'multi_enum', 'tradeoff', 'multi_select', 5060, 'Network proxy or Tor-related options documented for mail connections.', 'Dokumentierte Proxy- oder Tor-bezogene Optionen fuer Mail-Verbindungen.'
  UNION ALL SELECT 'mail-client', 'encryption_signing', 'openpgp_support', 'OpenPGP support', 'OpenPGP-Unterstuetzung', 'enum', 'tradeoff', 'must_match', 6010, 'How OpenPGP encryption and signing are supported by the client.', 'Wie OpenPGP-Verschluesselung und Signaturen durch den Client unterstuetzt werden.'
  UNION ALL SELECT 'mail-client', 'encryption_signing', 'smime_support', 'S/MIME support', 'S/MIME-Unterstuetzung', 'enum', 'tradeoff', 'optional', 6020, 'How S/MIME certificates and signing or encryption workflows are supported.', 'Wie S/MIME-Zertifikate sowie Signatur- oder Verschluesselungsablaeufe unterstuetzt werden.'
  UNION ALL SELECT 'mail-client', 'encryption_signing', 'autocrypt_support', 'Autocrypt support', 'Autocrypt-Unterstuetzung', 'boolean', 'beneficial', 'optional', 6030, 'Whether the client supports Autocrypt for key discovery and encrypted mail setup.', 'Ob der Client Autocrypt fuer Schluesselerkennung und Einrichtung verschluesselter Mail unterstuetzt.'
  UNION ALL SELECT 'mail-client', 'encryption_signing', 'key_management_model', 'Key management model', 'Modell zur Schluesselverwaltung', 'enum', 'tradeoff', 'optional', 6040, 'Where encryption keys are managed for signing and encryption workflows.', 'Wo Schluessel fuer Signatur- und Verschluesselungsablaeufe verwaltet werden.'
  UNION ALL SELECT 'mail-client', 'encryption_signing', 'encrypted_local_storage', 'Encrypted local storage', 'Verschluesselter lokaler Speicher', 'boolean', 'beneficial', 'optional', 6050, 'Whether the local mail store or profile can be encrypted by the client.', 'Ob der lokale Mail-Speicher oder das Profil durch den Client verschluesselt werden kann.'
  UNION ALL SELECT 'mail-client', 'encryption_signing', 'per_recipient_encryption_policy', 'Per-recipient encryption policy', 'Verschluesselungsrichtlinie pro Empfaenger', 'boolean', 'beneficial', 'optional', 6060, 'Whether encryption or signing defaults can be configured per recipient.', 'Ob Verschluesselungs- oder Signaturvorgaben pro Empfaenger konfiguriert werden koennen.'
  UNION ALL SELECT 'mail-client', 'data_portability_sync', 'import_sources', 'Import sources', 'Importquellen', 'multi_enum', 'informational', 'multi_select', 7010, 'Mail, profile, or contact sources the client can import from.', 'Mail-, Profil- oder Kontaktquellen, aus denen der Client importieren kann.'
  UNION ALL SELECT 'mail-client', 'data_portability_sync', 'export_formats', 'Export formats', 'Exportformate', 'multi_enum', 'beneficial', 'multi_select', 7020, 'Formats the client can export mail, contacts, or readable message copies to.', 'Formate, in die der Client Mail, Kontakte oder lesbare Nachrichtenkopien exportieren kann.'
  UNION ALL SELECT 'mail-client', 'data_portability_sync', 'local_storage_format', 'Local storage format', 'Lokales Speicherformat', 'enum', 'tradeoff', 'optional', 7030, 'The documented format used for local mail storage or synchronized cache data.', 'Das dokumentierte Format fuer lokale Mail-Speicherung oder synchronisierte Cache-Daten.'
  UNION ALL SELECT 'mail-client', 'data_portability_sync', 'profile_backup_portability', 'Profile backup and portability', 'Profil-Backup und Portabilitaet', 'enum', 'beneficial', 'optional', 7040, 'How client profiles and account settings can be backed up or moved.', 'Wie Client-Profile und Kontoeinstellungen gesichert oder verschoben werden koennen.'
  UNION ALL SELECT 'mail-client', 'data_portability_sync', 'contacts_sync_support', 'Contacts sync support', 'Kontakte-Sync-Unterstuetzung', 'multi_enum', 'beneficial', 'multi_select', 7050, 'Contact synchronization, import, or export paths supported by the client.', 'Vom Client unterstuetzte Wege fuer Kontakte-Sync, Import oder Export.'
  UNION ALL SELECT 'mail-client', 'data_portability_sync', 'calendar_sync_support', 'Calendar sync support', 'Kalender-Sync-Unterstuetzung', 'multi_enum', 'beneficial', 'multi_select', 7060, 'Calendar synchronization, import, export, or absence documented for the client.', 'Vom Client dokumentierte Kalender-Sync-, Import-, Export- oder Nichtverfuegbarkeitsoptionen.'
  UNION ALL SELECT 'mail-client', 'customization_integrations', 'add_on_extension_support', 'Add-on or extension support', 'Add-on- oder Erweiterungsunterstuetzung', 'boolean', 'tradeoff', 'optional', 8010, 'Whether the client supports add-ons, plugins, or extensions.', 'Ob der Client Add-ons, Plugins oder Erweiterungen unterstuetzt.'
  UNION ALL SELECT 'mail-client', 'customization_integrations', 'theming_layout_options', 'Theming and layout options', 'Theme- und Layoutoptionen', 'multi_enum', 'informational', 'multi_select', 8020, 'Layout, density, theme, or visual customization options available to users.', 'Layout-, Dichte-, Theme- oder visuelle Anpassungsoptionen fuer Nutzer.'
  UNION ALL SELECT 'mail-client', 'customization_integrations', 'external_tool_integration', 'External tool integration', 'Integration externer Werkzeuge', 'multi_enum', 'tradeoff', 'multi_select', 8030, 'Integration points for editors, command hooks, calendars, address books, or password managers.', 'Integrationspunkte fuer Editoren, Befehls-Hooks, Kalender, Adressbuecher oder Passwortmanager.'
  UNION ALL SELECT 'mail-client', 'customization_integrations', 'managed_deployment', 'Managed deployment', 'Verwaltete Bereitstellung', 'enum', 'informational', 'optional', 8040, 'Deployment or configuration management paths useful for teams or managed devices.', 'Bereitstellungs- oder Konfigurationsverwaltungswege fuer Teams oder verwaltete Geraete.'
  UNION ALL SELECT 'mail-client', 'accessibility_fit', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 9010, 'Accessibility affordances documented for keyboard, screen reader, contrast, type, or motion needs.', 'Dokumentierte Barrierefreiheitsfunktionen fuer Tastatur, Screenreader, Kontrast, Schrift oder Bewegung.'
  UNION ALL SELECT 'mail-client', 'accessibility_fit', 'localization_scope', 'Localization scope', 'Lokalisierungsumfang', 'enum', 'informational', 'optional', 9020, 'How broadly the client interface is localized for non-English users.', 'Wie breit die Client-Oberflaeche fuer nicht-englische Nutzer lokalisiert ist.'
  UNION ALL SELECT 'mail-client', 'accessibility_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9030, 'Common usage profiles the client is especially suited to support.', 'Typische Nutzungsprofile, fuer die der Client besonders geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'mail-client' AS category_id, 'client_model' AS criterion_key, 'native_desktop' AS option_key, 'Native desktop app' AS label_en, 'Native Desktop-App' AS label_de, 'positive' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'mail-client', 'client_model', 'native_mobile', 'Native mobile app', 'Native Mobile-App', 'positive', 20
  UNION ALL SELECT 'mail-client', 'client_model', 'cross_platform_app', 'Cross-platform app', 'Plattformuebergreifende App', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'client_model', 'terminal_or_text_client', 'Terminal/text client', 'Terminal-/Text-Client', 'tradeoff', 40
  UNION ALL SELECT 'mail-client', 'client_model', 'web_wrapper', 'Web wrapper', 'Web-Wrapper', 'warning', 50
  UNION ALL SELECT 'mail-client', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'supported_platforms', 'linux', 'Linux', 'Linux', 'positive', 30
  UNION ALL SELECT 'mail-client', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 50
  UNION ALL SELECT 'mail-client', 'supported_platforms', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 60
  UNION ALL SELECT 'mail-client', 'supported_platforms', 'bsd', 'BSD', 'BSD', 'tradeoff', 70
  UNION ALL SELECT 'mail-client', 'distribution_channels', 'vendor_download', 'Vendor download', 'Anbieter-Download', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'distribution_channels', 'app_store', 'App Store', 'App Store', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'distribution_channels', 'microsoft_store', 'Microsoft Store', 'Microsoft Store', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'distribution_channels', 'linux_package_manager', 'Linux package manager', 'Linux-Paketverwaltung', 'positive', 40
  UNION ALL SELECT 'mail-client', 'distribution_channels', 'flatpak', 'Flatpak', 'Flatpak', 'positive', 50
  UNION ALL SELECT 'mail-client', 'distribution_channels', 'snap', 'Snap', 'Snap', 'neutral', 60
  UNION ALL SELECT 'mail-client', 'distribution_channels', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 70
  UNION ALL SELECT 'mail-client', 'supported_account_types', 'generic_imap_smtp', 'Generic IMAP/SMTP', 'Generisches IMAP/SMTP', 'positive', 10
  UNION ALL SELECT 'mail-client', 'supported_account_types', 'pop3_mailbox', 'POP3 mailbox', 'POP3-Postfach', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'supported_account_types', 'microsoft_365_outlook', 'Microsoft 365/Outlook', 'Microsoft 365/Outlook', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'supported_account_types', 'gmail_google', 'Gmail/Google', 'Gmail/Google', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'supported_account_types', 'exchange_server', 'Exchange server', 'Exchange-Server', 'tradeoff', 50
  UNION ALL SELECT 'mail-client', 'supported_account_types', 'provider_specific', 'Provider-specific accounts', 'Anbieterspezifische Konten', 'tradeoff', 60
  UNION ALL SELECT 'mail-client', 'mail_protocols', 'imap', 'IMAP', 'IMAP', 'positive', 10
  UNION ALL SELECT 'mail-client', 'mail_protocols', 'smtp_submission', 'SMTP submission', 'SMTP-Submission', 'positive', 20
  UNION ALL SELECT 'mail-client', 'mail_protocols', 'pop3', 'POP3', 'POP3', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'mail_protocols', 'jmap', 'JMAP', 'JMAP', 'positive', 40
  UNION ALL SELECT 'mail-client', 'mail_protocols', 'exchange_activesync', 'Exchange ActiveSync', 'Exchange ActiveSync', 'tradeoff', 50
  UNION ALL SELECT 'mail-client', 'mail_protocols', 'ews', 'EWS', 'EWS', 'tradeoff', 60
  UNION ALL SELECT 'mail-client', 'mail_protocols', 'microsoft_graph', 'Microsoft Graph', 'Microsoft Graph', 'tradeoff', 70
  UNION ALL SELECT 'mail-client', 'oauth2_support', 'google', 'Google', 'Google', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'oauth2_support', 'microsoft', 'Microsoft', 'Microsoft', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'oauth2_support', 'yahoo', 'Yahoo', 'Yahoo', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'oauth2_support', 'generic_oauth2', 'Generic OAuth2', 'Generisches OAuth2', 'positive', 40
  UNION ALL SELECT 'mail-client', 'oauth2_support', 'no_oauth2', 'No OAuth2', 'Kein OAuth2', 'warning', 50
  UNION ALL SELECT 'mail-client', 'identity_alias_management', 'multiple_identities', 'Multiple identities', 'Mehrere Identitaeten', 'positive', 10
  UNION ALL SELECT 'mail-client', 'identity_alias_management', 'per_account_signatures', 'Per-account signatures', 'Signaturen pro Konto', 'positive', 20
  UNION ALL SELECT 'mail-client', 'identity_alias_management', 'reply_from_alias', 'Reply-from alias', 'Antworten-von-Alias', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'identity_alias_management', 'plus_address_awareness', 'Plus-address awareness', 'Plus-Adressierungsbewusstsein', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'folder_label_model', 'folders', 'Folders', 'Ordner', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'folder_label_model', 'labels', 'Labels', 'Labels', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'folder_label_model', 'folders_and_labels', 'Folders and labels', 'Ordner und Labels', 'positive', 30
  UNION ALL SELECT 'mail-client', 'folder_label_model', 'virtual_folders', 'Virtual folders', 'Virtuelle Ordner', 'tradeoff', 40
  UNION ALL SELECT 'mail-client', 'local_search_scope', 'headers_only', 'Headers only', 'Nur Kopfzeilen', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'local_search_scope', 'body_full_text', 'Body full-text', 'Volltext im Nachrichtentext', 'positive', 20
  UNION ALL SELECT 'mail-client', 'local_search_scope', 'attachments', 'Attachments', 'Anhaenge', 'positive', 30
  UNION ALL SELECT 'mail-client', 'local_search_scope', 'encrypted_index', 'Encrypted index', 'Verschluesselter Index', 'tradeoff', 40
  UNION ALL SELECT 'mail-client', 'message_filter_rules', 'local_rules', 'Local rules', 'Lokale Regeln', 'positive', 10
  UNION ALL SELECT 'mail-client', 'message_filter_rules', 'server_sieve', 'Server Sieve', 'Server-Sieve', 'positive', 20
  UNION ALL SELECT 'mail-client', 'message_filter_rules', 'smart_folders', 'Smart folders', 'Intelligente Ordner', 'positive', 30
  UNION ALL SELECT 'mail-client', 'message_filter_rules', 'bayesian_spam', 'Bayesian spam', 'Bayesscher Spamfilter', 'positive', 40
  UNION ALL SELECT 'mail-client', 'message_filter_rules', 'rule_templates', 'Rule templates', 'Regelvorlagen', 'neutral', 50
  UNION ALL SELECT 'mail-client', 'notification_controls', 'per_account', 'Per account', 'Pro Konto', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'notification_controls', 'per_folder', 'Per folder', 'Pro Ordner', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'notification_controls', 'quiet_hours', 'Quiet hours', 'Ruhezeiten', 'positive', 30
  UNION ALL SELECT 'mail-client', 'notification_controls', 'sender_priority', 'Sender priority', 'Absenderprioritaet', 'positive', 40
  UNION ALL SELECT 'mail-client', 'compose_format_modes', 'plain_text', 'Plain text', 'Nur Text', 'positive', 10
  UNION ALL SELECT 'mail-client', 'compose_format_modes', 'rich_text_html', 'Rich text/HTML', 'Rich Text/HTML', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'compose_format_modes', 'markdown', 'Markdown', 'Markdown', 'tradeoff', 30
  UNION ALL SELECT 'mail-client', 'compose_format_modes', 'per_message_mode', 'Per-message mode', 'Modus pro Nachricht', 'positive', 40
  UNION ALL SELECT 'mail-client', 'signatures_templates', 'signatures', 'Signatures', 'Signaturen', 'positive', 10
  UNION ALL SELECT 'mail-client', 'signatures_templates', 'html_signatures', 'HTML signatures', 'HTML-Signaturen', 'positive', 20
  UNION ALL SELECT 'mail-client', 'signatures_templates', 'templates', 'Templates', 'Vorlagen', 'positive', 30
  UNION ALL SELECT 'mail-client', 'signatures_templates', 'stationery', 'Stationery', 'Briefpapier', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'scheduled_send_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'scheduled_send_model', 'local_outbox', 'Local outbox only', 'Nur lokaler Postausgang', 'tradeoff', 20
  UNION ALL SELECT 'mail-client', 'scheduled_send_model', 'client_scheduler', 'Client scheduler', 'Client-Zeitplanung', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'scheduled_send_model', 'server_assisted', 'Server-assisted', 'Serverseitig unterstuetzt', 'positive', 40
  UNION ALL SELECT 'mail-client', 'attachment_handling', 'drag_drop', 'Drag and drop', 'Drag and drop', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'attachment_handling', 'attachment_reminders', 'Attachment reminders', 'Anhang-Erinnerungen', 'positive', 20
  UNION ALL SELECT 'mail-client', 'attachment_handling', 'large_file_warning', 'Large-file warning', 'Warnung bei grossen Dateien', 'positive', 30
  UNION ALL SELECT 'mail-client', 'attachment_handling', 'cloud_link_integration', 'Cloud-link integration', 'Cloud-Link-Integration', 'tradeoff', 40
  UNION ALL SELECT 'mail-client', 'attachment_handling', 'inline_image_controls', 'Inline image controls', 'Kontrollen fuer eingebettete Bilder', 'neutral', 50
  UNION ALL SELECT 'mail-client', 'tracker_protection', 'tracking_pixel_detection', 'Tracking-pixel detection', 'Tracking-Pixel-Erkennung', 'positive', 10
  UNION ALL SELECT 'mail-client', 'tracker_protection', 'link_tracking_warnings', 'Link-tracking warnings', 'Link-Tracking-Warnungen', 'positive', 20
  UNION ALL SELECT 'mail-client', 'tracker_protection', 'image_proxy', 'Image proxy', 'Bild-Proxy', 'tradeoff', 30
  UNION ALL SELECT 'mail-client', 'tracker_protection', 'sender_privacy_warnings', 'Sender privacy warnings', 'Datenschutzwarnungen pro Absender', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'phishing_malware_warnings', 'suspicious_link_warning', 'Suspicious link warning', 'Warnung bei verdaechtigen Links', 'positive', 10
  UNION ALL SELECT 'mail-client', 'phishing_malware_warnings', 'attachment_warning', 'Attachment warning', 'Anhangwarnung', 'positive', 20
  UNION ALL SELECT 'mail-client', 'phishing_malware_warnings', 'spoofing_warning', 'Spoofing warning', 'Spoofing-Warnung', 'positive', 30
  UNION ALL SELECT 'mail-client', 'phishing_malware_warnings', 'malware_scanner_integration', 'Malware scanner integration', 'Malware-Scanner-Integration', 'tradeoff', 40
  UNION ALL SELECT 'mail-client', 'credential_storage_model', 'system_keychain', 'System keychain', 'System-Schluesselbund', 'positive', 10
  UNION ALL SELECT 'mail-client', 'credential_storage_model', 'app_encrypted_store', 'App-encrypted store', 'App-verschluesselter Speicher', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'credential_storage_model', 'master_password_store', 'Master-password store', 'Master-Passwort-Speicher', 'positive', 30
  UNION ALL SELECT 'mail-client', 'credential_storage_model', 'profile_plaintext_risk', 'Profile plaintext risk', 'Klartext-Risiko im Profil', 'warning', 40
  UNION ALL SELECT 'mail-client', 'proxy_tor_support', 'http_proxy', 'HTTP proxy', 'HTTP-Proxy', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'proxy_tor_support', 'socks_proxy', 'SOCKS proxy', 'SOCKS-Proxy', 'positive', 20
  UNION ALL SELECT 'mail-client', 'proxy_tor_support', 'tor_documented', 'Tor documented', 'Tor dokumentiert', 'tradeoff', 30
  UNION ALL SELECT 'mail-client', 'proxy_tor_support', 'per_account_proxy', 'Per-account proxy', 'Proxy pro Konto', 'positive', 40
  UNION ALL SELECT 'mail-client', 'openpgp_support', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'openpgp_support', 'external_plugin', 'External plugin', 'Externes Plugin', 'tradeoff', 20
  UNION ALL SELECT 'mail-client', 'openpgp_support', 'built_in', 'Built-in', 'Integriert', 'positive', 30
  UNION ALL SELECT 'mail-client', 'openpgp_support', 'key_import_export', 'Key import/export', 'Schluesselimport/-export', 'positive', 40
  UNION ALL SELECT 'mail-client', 'openpgp_support', 'wkd_lookup', 'WKD lookup', 'WKD-Suche', 'positive', 50
  UNION ALL SELECT 'mail-client', 'smime_support', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'smime_support', 'certificate_import', 'Certificate import', 'Zertifikatimport', 'positive', 20
  UNION ALL SELECT 'mail-client', 'smime_support', 'system_certificate_store', 'System certificate store', 'System-Zertifikatsspeicher', 'positive', 30
  UNION ALL SELECT 'mail-client', 'smime_support', 'smartcard_token', 'Smartcard/token', 'Smartcard/Token', 'positive', 40
  UNION ALL SELECT 'mail-client', 'key_management_model', 'external_key_manager', 'External key manager', 'Externe Schluesselverwaltung', 'tradeoff', 10
  UNION ALL SELECT 'mail-client', 'key_management_model', 'integrated_key_manager', 'Integrated key manager', 'Integrierte Schluesselverwaltung', 'positive', 20
  UNION ALL SELECT 'mail-client', 'key_management_model', 'system_keychain', 'System keychain', 'System-Schluesselbund', 'positive', 30
  UNION ALL SELECT 'mail-client', 'key_management_model', 'hardware_token', 'Hardware token', 'Hardware-Token', 'positive', 40
  UNION ALL SELECT 'mail-client', 'key_management_model', 'manual_files', 'Manual key files', 'Manuelle Schluesseldateien', 'tradeoff', 50
  UNION ALL SELECT 'mail-client', 'import_sources', 'mbox', 'MBOX', 'MBOX', 'positive', 10
  UNION ALL SELECT 'mail-client', 'import_sources', 'eml', 'EML', 'EML', 'positive', 20
  UNION ALL SELECT 'mail-client', 'import_sources', 'maildir', 'Maildir', 'Maildir', 'positive', 30
  UNION ALL SELECT 'mail-client', 'import_sources', 'outlook_pst', 'Outlook PST', 'Outlook PST', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'import_sources', 'thunderbird_profile', 'Thunderbird profile', 'Thunderbird-Profil', 'positive', 50
  UNION ALL SELECT 'mail-client', 'import_sources', 'csv_contacts', 'CSV contacts', 'CSV-Kontakte', 'neutral', 60
  UNION ALL SELECT 'mail-client', 'export_formats', 'mbox', 'MBOX', 'MBOX', 'positive', 10
  UNION ALL SELECT 'mail-client', 'export_formats', 'eml', 'EML', 'EML', 'positive', 20
  UNION ALL SELECT 'mail-client', 'export_formats', 'maildir', 'Maildir', 'Maildir', 'positive', 30
  UNION ALL SELECT 'mail-client', 'export_formats', 'pdf_print', 'PDF/print', 'PDF/Druck', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'export_formats', 'csv_contacts', 'CSV contacts', 'CSV-Kontakte', 'neutral', 50
  UNION ALL SELECT 'mail-client', 'local_storage_format', 'mbox', 'MBOX', 'MBOX', 'positive', 10
  UNION ALL SELECT 'mail-client', 'local_storage_format', 'maildir', 'Maildir', 'Maildir', 'positive', 20
  UNION ALL SELECT 'mail-client', 'local_storage_format', 'sqlite_database', 'SQLite database', 'SQLite-Datenbank', 'tradeoff', 30
  UNION ALL SELECT 'mail-client', 'local_storage_format', 'proprietary_database', 'Proprietary database', 'Proprietaere Datenbank', 'warning', 40
  UNION ALL SELECT 'mail-client', 'local_storage_format', 'server_cache_only', 'Server cache only', 'Nur Server-Cache', 'tradeoff', 50
  UNION ALL SELECT 'mail-client', 'profile_backup_portability', 'manual_profile_copy', 'Manual profile copy', 'Manuelle Profilkopie', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'profile_backup_portability', 'built_in_backup_restore', 'Built-in backup/restore', 'Integriertes Backup/Wiederherstellung', 'positive', 20
  UNION ALL SELECT 'mail-client', 'profile_backup_portability', 'sync_account_settings', 'Synced account settings', 'Synchronisierte Kontoeinstellungen', 'tradeoff', 30
  UNION ALL SELECT 'mail-client', 'profile_backup_portability', 'no_documented_profile_backup', 'No documented profile backup', 'Kein dokumentiertes Profil-Backup', 'warning', 40
  UNION ALL SELECT 'mail-client', 'contacts_sync_support', 'local_address_book', 'Local address book', 'Lokales Adressbuch', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'contacts_sync_support', 'carddav', 'CardDAV', 'CardDAV', 'positive', 20
  UNION ALL SELECT 'mail-client', 'contacts_sync_support', 'google_contacts', 'Google Contacts', 'Google Kontakte', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'contacts_sync_support', 'exchange_contacts', 'Exchange contacts', 'Exchange-Kontakte', 'tradeoff', 40
  UNION ALL SELECT 'mail-client', 'contacts_sync_support', 'csv_vcard_import_export', 'CSV/vCard import/export', 'CSV-/vCard-Import/-Export', 'positive', 50
  UNION ALL SELECT 'mail-client', 'calendar_sync_support', 'caldav', 'CalDAV', 'CalDAV', 'positive', 10
  UNION ALL SELECT 'mail-client', 'calendar_sync_support', 'google_calendar', 'Google Calendar', 'Google Kalender', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'calendar_sync_support', 'exchange_calendar', 'Exchange calendar', 'Exchange-Kalender', 'tradeoff', 30
  UNION ALL SELECT 'mail-client', 'calendar_sync_support', 'ics_import_export', 'ICS import/export', 'ICS-Import/-Export', 'positive', 40
  UNION ALL SELECT 'mail-client', 'calendar_sync_support', 'no_calendar', 'No calendar', 'Kein Kalender', 'neutral', 50
  UNION ALL SELECT 'mail-client', 'theming_layout_options', 'density_controls', 'Density controls', 'Dichte-Einstellungen', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'theming_layout_options', 'dark_mode', 'Dark mode', 'Dunkelmodus', 'positive', 20
  UNION ALL SELECT 'mail-client', 'theming_layout_options', 'message_pane_layouts', 'Message pane layouts', 'Layouts fuer Nachrichtenbereich', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'theming_layout_options', 'custom_css_theme', 'Custom CSS/theme', 'Eigenes CSS/Theme', 'tradeoff', 40
  UNION ALL SELECT 'mail-client', 'external_tool_integration', 'external_editor', 'External editor', 'Externer Editor', 'tradeoff', 10
  UNION ALL SELECT 'mail-client', 'external_tool_integration', 'command_hooks', 'Command hooks', 'Befehls-Hooks', 'tradeoff', 20
  UNION ALL SELECT 'mail-client', 'external_tool_integration', 'calendar_app', 'Calendar app', 'Kalender-App', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'external_tool_integration', 'address_book_app', 'Address book app', 'Adressbuch-App', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'external_tool_integration', 'password_manager', 'Password manager', 'Passwortmanager', 'positive', 50
  UNION ALL SELECT 'mail-client', 'managed_deployment', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'managed_deployment', 'config_profiles', 'Configuration profiles', 'Konfigurationsprofile', 'positive', 20
  UNION ALL SELECT 'mail-client', 'managed_deployment', 'group_policy', 'Group Policy', 'Gruppenrichtlinien', 'positive', 30
  UNION ALL SELECT 'mail-client', 'managed_deployment', 'mdm', 'MDM', 'MDM', 'positive', 40
  UNION ALL SELECT 'mail-client', 'managed_deployment', 'portable_app', 'Portable app', 'Portable App', 'tradeoff', 50
  UNION ALL SELECT 'mail-client', 'accessibility_features', 'keyboard_navigation', 'Keyboard navigation', 'Tastaturnavigation', 'positive', 10
  UNION ALL SELECT 'mail-client', 'accessibility_features', 'screen_reader_docs', 'Screen reader documentation', 'Screenreader-Dokumentation', 'positive', 20
  UNION ALL SELECT 'mail-client', 'accessibility_features', 'high_contrast', 'High contrast', 'Hoher Kontrast', 'positive', 30
  UNION ALL SELECT 'mail-client', 'accessibility_features', 'font_scaling', 'Font scaling', 'Schriftskalierung', 'positive', 40
  UNION ALL SELECT 'mail-client', 'accessibility_features', 'reduced_motion', 'Reduced motion', 'Reduzierte Bewegung', 'positive', 50
  UNION ALL SELECT 'mail-client', 'localization_scope', 'english_only', 'English only', 'Nur Englisch', 'neutral', 10
  UNION ALL SELECT 'mail-client', 'localization_scope', 'major_languages', 'Major languages', 'Grosse Sprachen', 'neutral', 20
  UNION ALL SELECT 'mail-client', 'localization_scope', 'community_translations', 'Community translations', 'Community-Uebersetzungen', 'positive', 30
  UNION ALL SELECT 'mail-client', 'localization_scope', 'broad_localization', 'Broad localization', 'Breite Lokalisierung', 'positive', 40
  UNION ALL SELECT 'mail-client', 'fit_profiles', 'privacy_sensitive', 'Privacy-sensitive users', 'Datenschutzsensible Nutzer', 'positive', 10
  UNION ALL SELECT 'mail-client', 'fit_profiles', 'power_users', 'Power users', 'Power-Nutzer', 'tradeoff', 20
  UNION ALL SELECT 'mail-client', 'fit_profiles', 'teams_enterprise', 'Teams/enterprise', 'Teams/Unternehmen', 'neutral', 30
  UNION ALL SELECT 'mail-client', 'fit_profiles', 'lightweight_mobile', 'Lightweight mobile use', 'Leichte mobile Nutzung', 'neutral', 40
  UNION ALL SELECT 'mail-client', 'fit_profiles', 'terminal_workflows', 'Terminal workflows', 'Terminal-Workflows', 'tradeoff', 50
  UNION ALL SELECT 'mail-client', 'fit_profiles', 'accessibility_focused', 'Accessibility-focused use', 'Barrierefreiheitsfokus', 'positive', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'mail-client'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'mail-client'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('009-mail-client-matrix-criteria');
