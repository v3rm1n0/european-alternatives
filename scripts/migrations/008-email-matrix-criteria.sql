-- Migration 008: Define Email category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('email', 'service_plans', 'Service & Plans', 'Dienst & Tarife', 'Service model, mailbox quotas, attachment limits, and pricing shape.', 'Dienstmodell, Postfachkontingente, Anhangslimits und Tarifstruktur.', 100),
  ('email', 'access_protocols', 'Access & Protocols', 'Zugriff & Protokolle', 'Webmail, apps, standard protocols, bridges, filters, and search.', 'Webmail, Apps, Standardprotokolle, Bridges, Filter und Suche.', 200),
  ('email', 'domains_identity', 'Domains & Identity', 'Domains & Identität', 'Custom domains, aliases, catch-all addresses, and domain authentication.', 'Eigene Domains, Aliasse, Catch-all-Adressen und Domain-Authentifizierung.', 300),
  ('email', 'account_security', 'Account Security', 'Kontosicherheit', 'Login protection, recovery, and anti-abuse controls.', 'Anmeldeschutz, Wiederherstellung und Missbrauchsschutz.', 400),
  ('email', 'encryption_privacy', 'Encryption & Privacy', 'Verschlüsselung & Datenschutz', 'Mailbox encryption, E2EE, external secure mail, OpenPGP, trackers, and metadata.', 'Postfach-Verschlüsselung, E2EE, sichere externe Mail, OpenPGP, Tracker und Metadaten.', 500),
  ('email', 'data_location_compliance', 'Data Location & Compliance', 'Datenstandort & Compliance', 'Mailbox data region, hosting model, DPA, and compliance profiles.', 'Postfach-Datenregion, Hostingmodell, AV-Vertrag und Compliance-Profile.', 600),
  ('email', 'migration_portability', 'Migration & Portability', 'Migration & Portabilität', 'Import, export, forwarding, and account collection.', 'Import, Export, Weiterleitung und Abruf externer Konten.', 700),
  ('email', 'suite_productivity', 'Suite & Productivity', 'Suite & Produktivität', 'Calendar, contacts, suite scope, and collaboration features.', 'Kalender, Kontakte, Suite-Umfang und Zusammenarbeitsfunktionen.', 800),
  ('email', 'team_admin', 'Team Admin', 'Team-Administration', 'Admin console, user management, SSO, audit logs, and retention or eDiscovery.', 'Administrationskonsole, Nutzerverwaltung, SSO, Audit-Protokolle sowie Aufbewahrung oder eDiscovery.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'email' AS category_id, 'service_plans' AS group_key, 'service_model' AS criterion_key, 'Service model' AS label_en, 'Dienstmodell' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The core delivery model for the email service.' AS help_text_en, 'Das grundlegende Bereitstellungsmodell des E-Mail-Dienstes.' AS help_text_de
  UNION ALL SELECT 'email', 'service_plans', 'free_tier_mailbox_storage_gb', 'Free-tier mailbox storage (GB)', 'Postfachspeicher im Gratis-Tarif (GB)', 'number', 'informational', 'range', 1020, 'Documented mailbox storage included in a free plan, measured in gigabytes.', 'Dokumentierter Postfachspeicher im Gratis-Tarif, gemessen in Gigabyte.'
  UNION ALL SELECT 'email', 'service_plans', 'personal_mailbox_storage_gb', 'Personal mailbox storage (GB)', 'Postfachspeicher im Privattarif (GB)', 'number', 'informational', 'range', 1030, 'Documented mailbox storage included in a representative personal plan, measured in gigabytes.', 'Dokumentierter Postfachspeicher in einem repräsentativen Privattarif, gemessen in Gigabyte.'
  UNION ALL SELECT 'email', 'service_plans', 'max_attachment_size_mb', 'Maximum attachment size (MB)', 'Maximale Anhanggröße (MB)', 'number', 'informational', 'range', 1040, 'Documented maximum size for one sent or received attachment.', 'Dokumentierte maximale Größe eines gesendeten oder empfangenen Anhangs.'
  UNION ALL SELECT 'email', 'service_plans', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'tradeoff', 'optional', 1050, 'How the service prices mailboxes, domains, usage, or infrastructure.', 'Wie der Dienst Postfächer, Domains, Nutzung oder Infrastruktur bepreist.'
  UNION ALL SELECT 'email', 'access_protocols', 'webmail_available', 'Webmail available', 'Webmail verfügbar', 'boolean', 'beneficial', 'optional', 2010, 'Whether mail can be read and managed through a browser or web app.', 'Ob Mail über einen Browser oder eine Web-App gelesen und verwaltet werden kann.'
  UNION ALL SELECT 'email', 'access_protocols', 'supported_apps', 'Supported apps', 'Unterstützte Apps', 'multi_enum', 'informational', 'multi_select', 2020, 'Maintained app platforms and access paths documented by the provider.', 'Vom Anbieter dokumentierte gepflegte App-Plattformen und Zugriffswege.'
  UNION ALL SELECT 'email', 'access_protocols', 'standard_mail_protocols', 'Standard mail protocols', 'Standard-Mailprotokolle', 'multi_enum', 'beneficial', 'multi_select', 2030, 'Standard or widely supported mail protocols available for clients.', 'Standardisierte oder breit unterstützte Mailprotokolle für Clients.'
  UNION ALL SELECT 'email', 'access_protocols', 'bridge_required_for_standard_clients', 'Bridge required for standard clients', 'Bridge für Standard-Clients erforderlich', 'boolean', 'risk', 'must_match', 2040, 'Whether standard IMAP or SMTP-style clients require a local or vendor bridge.', 'Ob Standard-Clients für IMAP oder SMTP eine lokale oder Anbieter-Bridge erfordern.'
  UNION ALL SELECT 'email', 'access_protocols', 'server_side_filters', 'Server-side filters and rules', 'Serverseitige Filter und Regeln', 'multi_enum', 'beneficial', 'multi_select', 2050, 'Filter and rule capabilities that run on the provider side.', 'Filter- und Regelfunktionen, die serverseitig beim Anbieter laufen.'
  UNION ALL SELECT 'email', 'access_protocols', 'search_scope', 'Mail search scope', 'Umfang der Mail-Suche', 'enum', 'informational', 'optional', 2060, 'How mail search is supported for messages and encrypted mailboxes.', 'Wie die Mail-Suche für Nachrichten und verschlüsselte Postfächer unterstützt wird.'
  UNION ALL SELECT 'email', 'domains_identity', 'custom_domains', 'Custom domains', 'Eigene Domains', 'boolean', 'beneficial', 'must_match', 3010, 'Whether users can use their own domains for mailbox addresses.', 'Ob Nutzer eigene Domains für Postfachadressen verwenden können.'
  UNION ALL SELECT 'email', 'domains_identity', 'alias_support_model', 'Alias support model', 'Alias-Unterstützungsmodell', 'enum', 'tradeoff', 'optional', 3020, 'How additional email aliases are provided and limited.', 'Wie zusätzliche E-Mail-Aliasse bereitgestellt und begrenzt werden.'
  UNION ALL SELECT 'email', 'domains_identity', 'alias_limit', 'Alias limit', 'Alias-Limit', 'number', 'informational', 'range', 3030, 'Documented maximum number of aliases for a representative account or mailbox.', 'Dokumentierte maximale Anzahl von Aliassen für ein repräsentatives Konto oder Postfach.'
  UNION ALL SELECT 'email', 'domains_identity', 'catch_all_address', 'Catch-all address', 'Catch-all-Adresse', 'boolean', 'beneficial', 'optional', 3040, 'Whether a domain can route unmatched local parts to a mailbox.', 'Ob eine Domain nicht zugeordnete lokale Adressteile an ein Postfach weiterleiten kann.'
  UNION ALL SELECT 'email', 'domains_identity', 'disposable_masked_aliases', 'Disposable or masked aliases', 'Wegwerf- oder Maskierungsaliasse', 'enum', 'tradeoff', 'optional', 3050, 'How the service supports disposable, masked, or privacy aliases.', 'Wie der Dienst Wegwerf-, Maskierungs- oder Datenschutzaliasse unterstützt.'
  UNION ALL SELECT 'email', 'domains_identity', 'domain_authentication_controls', 'Domain authentication controls', 'Domain-Authentifizierungskontrollen', 'multi_enum', 'beneficial', 'multi_select', 3060, 'Domain-level authentication and deliverability controls available to customers.', 'Domainweite Authentifizierungs- und Zustellbarkeitskontrollen für Kunden.'
  UNION ALL SELECT 'email', 'account_security', 'two_factor_auth', 'Two-factor authentication', 'Zwei-Faktor-Authentifizierung', 'boolean', 'beneficial', 'optional', 4010, 'Whether accounts can enable or require two-factor authentication.', 'Ob Konten Zwei-Faktor-Authentifizierung aktivieren oder erzwingen können.'
  UNION ALL SELECT 'email', 'account_security', 'hardware_security_key', 'Hardware security key support', 'Hardware-Sicherheitsschlüssel', 'boolean', 'beneficial', 'optional', 4020, 'Whether accounts can use hardware security keys for login protection.', 'Ob Konten Hardware-Sicherheitsschlüssel für den Anmeldeschutz verwenden können.'
  UNION ALL SELECT 'email', 'account_security', 'account_recovery_model', 'Account recovery model', 'Modell zur Kontowiederherstellung', 'enum', 'tradeoff', 'optional', 4030, 'How account or mailbox recovery is handled.', 'Wie Konto- oder Postfachwiederherstellung gehandhabt wird.'
  UNION ALL SELECT 'email', 'account_security', 'anti_abuse_protection', 'Spam, phishing, and malware controls', 'Spam-, Phishing- und Malware-Kontrollen', 'multi_enum', 'beneficial', 'multi_select', 4040, 'Inbound and outbound controls for spam, phishing, malware, and abusive mail.', 'Ein- und ausgehende Kontrollen für Spam, Phishing, Malware und missbräuchliche Mail.'
  UNION ALL SELECT 'email', 'encryption_privacy', 'mailbox_encryption_model', 'Mailbox encryption model', 'Postfach-Verschlüsselungsmodell', 'enum', 'tradeoff', 'must_match', 5010, 'How mailbox content encryption is documented for normal use.', 'Wie die Verschlüsselung von Postfachinhalten für normale Nutzung dokumentiert ist.'
  UNION ALL SELECT 'email', 'encryption_privacy', 'e2ee_internal_default', 'E2EE within provider by default', 'E2EE innerhalb des Anbieters standardmäßig', 'boolean', 'beneficial', 'must_match', 5020, 'Whether same-provider messages are end-to-end encrypted by default.', 'Ob Nachrichten innerhalb des Anbieters standardmäßig Ende-zu-Ende-verschlüsselt sind.'
  UNION ALL SELECT 'email', 'encryption_privacy', 'encrypted_external_email', 'Encrypted external email', 'Verschlüsselte externe E-Mail', 'enum', 'tradeoff', 'optional', 5030, 'How encrypted messages can be sent to recipients outside the provider.', 'Wie verschlüsselte Nachrichten an Empfänger außerhalb des Anbieters gesendet werden können.'
  UNION ALL SELECT 'email', 'encryption_privacy', 'openpgp_support', 'OpenPGP support', 'OpenPGP-Unterstützung', 'enum', 'tradeoff', 'optional', 5040, 'How OpenPGP is supported through built-in tools or external clients.', 'Wie OpenPGP über integrierte Werkzeuge oder externe Clients unterstützt wird.'
  UNION ALL SELECT 'email', 'encryption_privacy', 'tracker_remote_content_protection', 'Tracker and remote-content protection', 'Tracker- und Remote-Inhalte-Schutz', 'multi_enum', 'beneficial', 'multi_select', 5050, 'Controls for remote images, tracking pixels, proxies, and link tracking warnings.', 'Kontrollen für externe Bilder, Tracking-Pixel, Proxies und Link-Tracking-Warnungen.'
  UNION ALL SELECT 'email', 'encryption_privacy', 'metadata_protection_level', 'Metadata protection level', 'Metadatenschutz-Niveau', 'enum', 'tradeoff', 'optional', 5060, 'How strongly the service reduces exposure of email metadata.', 'Wie stark der Dienst die Offenlegung von E-Mail-Metadaten reduziert.'
  UNION ALL SELECT 'email', 'data_location_compliance', 'data_region_model', 'Mailbox data region model', 'Datenregion-Modell für Postfächer', 'enum', 'tradeoff', 'must_match', 6010, 'How mailbox storage location is selected or constrained.', 'Wie die Datenregion für Postfächer ausgewählt oder eingeschränkt wird.'
  UNION ALL SELECT 'email', 'data_location_compliance', 'eu_mailbox_storage_available', 'EU mailbox storage available', 'EU-Postfachspeicherung verfügbar', 'boolean', 'beneficial', 'must_match', 6020, 'Whether mailbox storage in the European Union is available.', 'Ob EU-Postfachspeicherung verfügbar ist.'
  UNION ALL SELECT 'email', 'data_location_compliance', 'hosting_infrastructure_model', 'Hosting infrastructure model', 'Hosting-Infrastrukturmodell', 'enum', 'informational', 'optional', 6030, 'The documented infrastructure model used to host mailbox data.', 'Das dokumentierte Hosting-Infrastrukturmodell für Postfachdaten.'
  UNION ALL SELECT 'email', 'data_location_compliance', 'data_processing_agreement', 'Data processing agreement available', 'AV-Vertrag verfügbar', 'boolean', 'informational', 'optional', 6040, 'Whether a data processing agreement is available for customers.', 'Ob ein AV-Vertrag für Kunden verfügbar ist.'
  UNION ALL SELECT 'email', 'data_location_compliance', 'compliance_profiles', 'Compliance profiles', 'Compliance-Profile', 'multi_enum', 'informational', 'multi_select', 6050, 'Documented compliance profiles or attestations relevant to email customers.', 'Dokumentierte Compliance-Profile oder Nachweise für E-Mail-Kunden.'
  UNION ALL SELECT 'email', 'migration_portability', 'migration_import_sources', 'Migration import sources', 'Quellen für Migrationsimport', 'multi_enum', 'informational', 'multi_select', 7010, 'Sources the service can import from during mailbox or account migration.', 'Quellen, aus denen der Dienst beim Migrationsimport für Postfächer oder Konten importieren kann.'
  UNION ALL SELECT 'email', 'migration_portability', 'mailbox_export_available', 'Mailbox export available', 'Postfach-Export verfügbar', 'enum', 'beneficial', 'optional', 7020, 'How users or admins can export mailbox contents.', 'Wie Nutzer oder Administratoren Postfachinhalte exportieren können.'
  UNION ALL SELECT 'email', 'migration_portability', 'contacts_calendar_export', 'Contacts and calendar export', 'Kontakte- und Kalenderexport', 'multi_enum', 'beneficial', 'multi_select', 7030, 'Documented export or sync formats for contacts and calendars.', 'Dokumentierte Export- oder Sync-Formate für Kontakte und Kalender.'
  UNION ALL SELECT 'email', 'migration_portability', 'mail_forwarding', 'Mail forwarding', 'Mail-Weiterleitung', 'boolean', 'beneficial', 'optional', 7040, 'Whether incoming mail can be forwarded to another address.', 'Ob eingehende Mail an eine andere Adresse weitergeleitet werden kann.'
  UNION ALL SELECT 'email', 'migration_portability', 'external_account_collection', 'External account collection', 'Abruf externer Konten', 'boolean', 'informational', 'optional', 7050, 'Whether the service can collect mail from external accounts.', 'Ob der Dienst Mail von externer Konten abrufen kann.'
  UNION ALL SELECT 'email', 'suite_productivity', 'calendar_included', 'Calendar included', 'Kalender enthalten', 'boolean', 'beneficial', 'optional', 8010, 'Whether a calendar is included with the email service.', 'Ob ein Kalender im E-Mail-Dienst enthalten ist.'
  UNION ALL SELECT 'email', 'suite_productivity', 'contacts_included', 'Contacts included', 'Kontakte enthalten', 'boolean', 'beneficial', 'optional', 8020, 'Whether contacts or an address book are included with the email service.', 'Ob Kontakte oder ein Adressbuch im E-Mail-Dienst enthalten sind.'
  UNION ALL SELECT 'email', 'suite_productivity', 'productivity_suite_scope', 'Productivity suite scope', 'Umfang der Produktivitäts-Suite', 'multi_enum', 'informational', 'multi_select', 8030, 'Productivity tools bundled with or tightly integrated into the email service.', 'Produktivitäts-Suite-Werkzeuge, die im E-Mail-Dienst enthalten oder eng integriert sind.'
  UNION ALL SELECT 'email', 'suite_productivity', 'collaboration_features', 'Collaboration features', 'Zusammenarbeitsfunktionen', 'multi_enum', 'informational', 'multi_select', 8040, 'Team and collaboration features around mail, calendars, contacts, and groups.', 'Zusammenarbeitsfunktionen rund um Mail, Kalender, Kontakte und Gruppen.'
  UNION ALL SELECT 'email', 'team_admin', 'admin_console', 'Admin console', 'Administrationskonsole', 'boolean', 'beneficial', 'optional', 9010, 'Whether an administrative console is available for teams or organizations.', 'Ob eine Administrationskonsole für Teams oder Organisationen verfügbar ist.'
  UNION ALL SELECT 'email', 'team_admin', 'user_management_model', 'User management model', 'Nutzerverwaltungsmodell', 'enum', 'tradeoff', 'optional', 9020, 'How users, domains, and directory accounts are managed.', 'Wie Nutzer, Domains und Verzeichniskonten verwaltet werden.'
  UNION ALL SELECT 'email', 'team_admin', 'sso_available', 'SSO available', 'SSO verfügbar', 'boolean', 'beneficial', 'optional', 9030, 'Whether single sign-on is available for team or business accounts.', 'Ob SSO für Team- oder Geschäftskonten verfügbar ist.'
  UNION ALL SELECT 'email', 'team_admin', 'audit_logs', 'Audit logs', 'Audit-Protokolle', 'boolean', 'beneficial', 'optional', 9040, 'Whether admins can view audit logs for email account and admin activity.', 'Ob Administratoren Audit-Protokolle für E-Mail-Konto- und Admin-Aktivitäten einsehen können.'
  UNION ALL SELECT 'email', 'team_admin', 'retention_ediscovery', 'Retention and eDiscovery', 'Aufbewahrung und eDiscovery', 'enum', 'informational', 'optional', 9050, 'Whether retention, archive, legal hold, or eDiscovery workflows are available.', 'Ob Aufbewahrung, Archivierung, Legal Hold oder eDiscovery-Workflows verfügbar sind.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'email' AS category_id, 'service_model' AS criterion_key, 'hosted_mailbox' AS option_key, 'Hosted mailbox' AS label_en, 'Gehostetes Postfach' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'email', 'service_model', 'encrypted_mailbox', 'Encrypted mailbox service', 'Verschlüsselter Postfachdienst', 'positive', 20
  UNION ALL SELECT 'email', 'service_model', 'business_email_suite', 'Business email suite', 'Business-E-Mail-Suite', 'neutral', 30
  UNION ALL SELECT 'email', 'service_model', 'domain_mail_hosting', 'Domain mail hosting', 'Domain-Mailhosting', 'neutral', 40
  UNION ALL SELECT 'email', 'service_model', 'self_hostable_mail_stack', 'Self-hostable mail stack', 'Selbsthostbarer Mail-Stack', 'tradeoff', 50
  UNION ALL SELECT 'email', 'service_model', 'transactional_delivery', 'Transactional delivery', 'Transaktionale Zustellung', 'tradeoff', 60
  UNION ALL SELECT 'email', 'pricing_model', 'free_paid_plans', 'Free and paid plans', 'Gratis- und Bezahltarife', 'neutral', 10
  UNION ALL SELECT 'email', 'pricing_model', 'per_user', 'Per user', 'Pro Nutzer', 'neutral', 20
  UNION ALL SELECT 'email', 'pricing_model', 'per_domain', 'Per domain', 'Pro Domain', 'neutral', 30
  UNION ALL SELECT 'email', 'pricing_model', 'usage_based', 'Usage-based', 'Nutzungsbasiert', 'tradeoff', 40
  UNION ALL SELECT 'email', 'pricing_model', 'self_hosted_infrastructure', 'Self-hosted infrastructure', 'Selbst gehostete Infrastruktur', 'tradeoff', 50
  UNION ALL SELECT 'email', 'supported_apps', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'email', 'supported_apps', 'android', 'Android', 'Android', 'neutral', 20
  UNION ALL SELECT 'email', 'supported_apps', 'ios', 'iOS', 'iOS', 'neutral', 30
  UNION ALL SELECT 'email', 'supported_apps', 'windows', 'Windows', 'Windows', 'neutral', 40
  UNION ALL SELECT 'email', 'supported_apps', 'macos', 'macOS', 'macOS', 'neutral', 50
  UNION ALL SELECT 'email', 'supported_apps', 'linux', 'Linux', 'Linux', 'positive', 60
  UNION ALL SELECT 'email', 'supported_apps', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 70
  UNION ALL SELECT 'email', 'standard_mail_protocols', 'imap', 'IMAP', 'IMAP', 'positive', 10
  UNION ALL SELECT 'email', 'standard_mail_protocols', 'smtp_submission', 'SMTP submission', 'SMTP-Submission', 'positive', 20
  UNION ALL SELECT 'email', 'standard_mail_protocols', 'pop3', 'POP3', 'POP3', 'neutral', 30
  UNION ALL SELECT 'email', 'standard_mail_protocols', 'jmap', 'JMAP', 'JMAP', 'positive', 40
  UNION ALL SELECT 'email', 'standard_mail_protocols', 'exchange_activesync', 'Exchange ActiveSync', 'Exchange ActiveSync', 'tradeoff', 50
  UNION ALL SELECT 'email', 'server_side_filters', 'folders', 'Folders', 'Ordner', 'neutral', 10
  UNION ALL SELECT 'email', 'server_side_filters', 'labels', 'Labels', 'Labels', 'neutral', 20
  UNION ALL SELECT 'email', 'server_side_filters', 'rules_ui', 'Rules UI', 'Regeloberfläche', 'positive', 30
  UNION ALL SELECT 'email', 'server_side_filters', 'sieve', 'Sieve', 'Sieve', 'positive', 40
  UNION ALL SELECT 'email', 'server_side_filters', 'vacation_responder', 'Vacation responder', 'Abwesenheitsnotiz', 'positive', 50
  UNION ALL SELECT 'email', 'server_side_filters', 'templates', 'Templates', 'Vorlagen', 'neutral', 60
  UNION ALL SELECT 'email', 'search_scope', 'basic_headers', 'Basic/header search', 'Basis-/Header-Suche', 'neutral', 10
  UNION ALL SELECT 'email', 'search_scope', 'full_text_server', 'Server full-text search', 'Server-Volltextsuche', 'positive', 20
  UNION ALL SELECT 'email', 'search_scope', 'encrypted_index', 'Encrypted index search', 'Verschlüsselte Indexsuche', 'tradeoff', 30
  UNION ALL SELECT 'email', 'search_scope', 'local_client_only', 'Local-client search only', 'Nur lokale Client-Suche', 'tradeoff', 40
  UNION ALL SELECT 'email', 'search_scope', 'no_documented_search', 'No documented search', 'Keine dokumentierte Suche', 'warning', 50
  UNION ALL SELECT 'email', 'alias_support_model', 'none', 'No aliases', 'Keine Aliasse', 'warning', 10
  UNION ALL SELECT 'email', 'alias_support_model', 'limited_aliases', 'Limited aliases', 'Begrenzte Aliasse', 'neutral', 20
  UNION ALL SELECT 'email', 'alias_support_model', 'unlimited_aliases', 'Unlimited aliases', 'Unbegrenzte Aliasse', 'positive', 30
  UNION ALL SELECT 'email', 'alias_support_model', 'domain_aliases', 'Domain aliases', 'Domain-Aliasse', 'positive', 40
  UNION ALL SELECT 'email', 'alias_support_model', 'plus_addressing_only', 'Plus-addressing only', 'Nur Plus-Adressierung', 'tradeoff', 50
  UNION ALL SELECT 'email', 'disposable_masked_aliases', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'email', 'disposable_masked_aliases', 'limited_builtin', 'Limited built-in aliases', 'Begrenzte integrierte Aliasse', 'neutral', 20
  UNION ALL SELECT 'email', 'disposable_masked_aliases', 'unlimited_builtin', 'Unlimited built-in aliases', 'Unbegrenzte integrierte Aliasse', 'positive', 30
  UNION ALL SELECT 'email', 'disposable_masked_aliases', 'integrated_alias_service', 'Integrated alias service', 'Integrierter Aliasdienst', 'positive', 40
  UNION ALL SELECT 'email', 'disposable_masked_aliases', 'external_alias_integration', 'External alias integration', 'Externe Alias-Integration', 'tradeoff', 50
  UNION ALL SELECT 'email', 'domain_authentication_controls', 'spf', 'SPF', 'SPF', 'positive', 10
  UNION ALL SELECT 'email', 'domain_authentication_controls', 'dkim', 'DKIM', 'DKIM', 'positive', 20
  UNION ALL SELECT 'email', 'domain_authentication_controls', 'dmarc', 'DMARC', 'DMARC', 'positive', 30
  UNION ALL SELECT 'email', 'domain_authentication_controls', 'mta_sts', 'MTA-STS', 'MTA-STS', 'positive', 40
  UNION ALL SELECT 'email', 'domain_authentication_controls', 'tls_rpt', 'TLS-RPT', 'TLS-RPT', 'positive', 50
  UNION ALL SELECT 'email', 'domain_authentication_controls', 'bimi', 'BIMI', 'BIMI', 'neutral', 60
  UNION ALL SELECT 'email', 'account_recovery_model', 'provider_reset', 'Provider reset', 'Anbieter-Rücksetzung', 'neutral', 10
  UNION ALL SELECT 'email', 'account_recovery_model', 'recovery_email_phone', 'Recovery email/phone', 'Wiederherstellungs-E-Mail/Telefon', 'neutral', 20
  UNION ALL SELECT 'email', 'account_recovery_model', 'recovery_key', 'Recovery key', 'Wiederherstellungsschlüssel', 'positive', 30
  UNION ALL SELECT 'email', 'account_recovery_model', 'admin_recovery', 'Admin recovery', 'Admin-Wiederherstellung', 'tradeoff', 40
  UNION ALL SELECT 'email', 'account_recovery_model', 'no_provider_recovery', 'No provider recovery', 'Keine Anbieter-Wiederherstellung', 'tradeoff', 50
  UNION ALL SELECT 'email', 'anti_abuse_protection', 'spam_filtering', 'Spam filtering', 'Spamfilterung', 'positive', 10
  UNION ALL SELECT 'email', 'anti_abuse_protection', 'phishing_detection', 'Phishing detection', 'Phishing-Erkennung', 'positive', 20
  UNION ALL SELECT 'email', 'anti_abuse_protection', 'malware_scanning', 'Malware scanning', 'Malware-Scan', 'positive', 30
  UNION ALL SELECT 'email', 'anti_abuse_protection', 'attachment_scanning', 'Attachment scanning', 'Anhang-Scan', 'positive', 40
  UNION ALL SELECT 'email', 'anti_abuse_protection', 'link_scanning', 'Link scanning', 'Link-Scan', 'tradeoff', 50
  UNION ALL SELECT 'email', 'anti_abuse_protection', 'allow_block_lists', 'Allow/block lists', 'Erlauben-/Blockierlisten', 'positive', 60
  UNION ALL SELECT 'email', 'anti_abuse_protection', 'quarantine', 'Quarantine', 'Quarantäne', 'positive', 70
  UNION ALL SELECT 'email', 'mailbox_encryption_model', 'server_side_encryption', 'Server-side encryption', 'Serverseitige Verschlüsselung', 'neutral', 10
  UNION ALL SELECT 'email', 'mailbox_encryption_model', 'zero_access_at_rest', 'Zero-access at rest', 'Zero-Access im Ruhezustand', 'positive', 20
  UNION ALL SELECT 'email', 'mailbox_encryption_model', 'end_to_end_internal', 'End-to-end internal mail', 'Ende-zu-Ende intern', 'positive', 30
  UNION ALL SELECT 'email', 'mailbox_encryption_model', 'client_side_user_keys', 'Client-side user keys', 'Clientseitige Nutzerschlüssel', 'tradeoff', 40
  UNION ALL SELECT 'email', 'mailbox_encryption_model', 'external_client_encryption_required', 'External client encryption required', 'Externe Client-Verschlüsselung erforderlich', 'warning', 50
  UNION ALL SELECT 'email', 'encrypted_external_email', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'email', 'encrypted_external_email', 'password_protected_portal', 'Password-protected portal', 'Passwortgeschütztes Portal', 'tradeoff', 20
  UNION ALL SELECT 'email', 'encrypted_external_email', 'pgp', 'PGP/OpenPGP', 'PGP/OpenPGP', 'positive', 30
  UNION ALL SELECT 'email', 'encrypted_external_email', 'secure_link_expiry', 'Expiring secure link', 'Ablaufender sicherer Link', 'tradeoff', 40
  UNION ALL SELECT 'email', 'encrypted_external_email', 'manual_key_exchange', 'Manual key exchange', 'Manueller Schlüsselaustausch', 'tradeoff', 50
  UNION ALL SELECT 'email', 'openpgp_support', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'email', 'openpgp_support', 'external_client_only', 'External client only', 'Nur externer Client', 'tradeoff', 20
  UNION ALL SELECT 'email', 'openpgp_support', 'built_in_key_management', 'Built-in key management', 'Integrierte Schlüsselverwaltung', 'positive', 30
  UNION ALL SELECT 'email', 'openpgp_support', 'key_import_export', 'Key import/export', 'Schlüsselimport/-export', 'positive', 40
  UNION ALL SELECT 'email', 'openpgp_support', 'autocrypt', 'Autocrypt', 'Autocrypt', 'positive', 50
  UNION ALL SELECT 'email', 'tracker_remote_content_protection', 'remote_content_blocking', 'Remote-content blocking', 'Blockieren externer Inhalte', 'positive', 10
  UNION ALL SELECT 'email', 'tracker_remote_content_protection', 'tracking_pixel_blocking', 'Tracking-pixel blocking', 'Tracking-Pixel-Blockierung', 'positive', 20
  UNION ALL SELECT 'email', 'tracker_remote_content_protection', 'image_proxy', 'Image proxy', 'Bild-Proxy', 'positive', 30
  UNION ALL SELECT 'email', 'tracker_remote_content_protection', 'link_tracking_warnings', 'Link-tracking warnings', 'Link-Tracking-Warnungen', 'neutral', 40
  UNION ALL SELECT 'email', 'metadata_protection_level', 'standard_email_metadata', 'Standard email metadata', 'Standard-E-Mail-Metadaten', 'neutral', 10
  UNION ALL SELECT 'email', 'metadata_protection_level', 'reduced_logging', 'Reduced logging', 'Reduzierte Protokollierung', 'positive', 20
  UNION ALL SELECT 'email', 'metadata_protection_level', 'encrypted_subject', 'Encrypted subject support', 'Verschlüsselte Betreffzeile', 'positive', 30
  UNION ALL SELECT 'email', 'metadata_protection_level', 'private_routing_proxy', 'Private routing/proxy', 'Privates Routing/Proxy', 'tradeoff', 40
  UNION ALL SELECT 'email', 'metadata_protection_level', 'self_hosted_metadata_control', 'Self-hosted metadata control', 'Selbst gehostete Metadatenkontrolle', 'tradeoff', 50
  UNION ALL SELECT 'email', 'data_region_model', 'eu_only', 'EU-only storage', 'Speicherung nur in der EU', 'positive', 10
  UNION ALL SELECT 'email', 'data_region_model', 'country_specific', 'Country-specific storage', 'Länderspezifische Speicherung', 'positive', 20
  UNION ALL SELECT 'email', 'data_region_model', 'user_selectable_region', 'User-selectable region', 'Nutzerwählbare Region', 'positive', 30
  UNION ALL SELECT 'email', 'data_region_model', 'provider_selected_region', 'Provider-selected region', 'Anbietergewählte Region', 'neutral', 40
  UNION ALL SELECT 'email', 'data_region_model', 'global_or_mixed', 'Global or mixed regions', 'Globale oder gemischte Regionen', 'tradeoff', 50
  UNION ALL SELECT 'email', 'data_region_model', 'self_hosted_customer_controlled', 'Self-hosted/customer controlled', 'Selbst gehostet/kundenseitig kontrolliert', 'tradeoff', 60
  UNION ALL SELECT 'email', 'hosting_infrastructure_model', 'own_datacenters', 'Own data centers', 'Eigene Rechenzentren', 'positive', 10
  UNION ALL SELECT 'email', 'hosting_infrastructure_model', 'eu_cloud_provider', 'EU cloud provider', 'EU-Cloud-Anbieter', 'positive', 20
  UNION ALL SELECT 'email', 'hosting_infrastructure_model', 'hyperscaler', 'Hyperscaler infrastructure', 'Hyperscaler-Infrastruktur', 'tradeoff', 30
  UNION ALL SELECT 'email', 'hosting_infrastructure_model', 'customer_controlled', 'Customer-controlled infrastructure', 'Kundenseitig kontrollierte Infrastruktur', 'tradeoff', 40
  UNION ALL SELECT 'email', 'hosting_infrastructure_model', 'mixed', 'Mixed infrastructure', 'Gemischte Infrastruktur', 'neutral', 50
  UNION ALL SELECT 'email', 'compliance_profiles', 'gdpr_dpa', 'GDPR DPA', 'DSGVO-AVV', 'positive', 10
  UNION ALL SELECT 'email', 'compliance_profiles', 'iso_27001', 'ISO 27001', 'ISO 27001', 'positive', 20
  UNION ALL SELECT 'email', 'compliance_profiles', 'soc2', 'SOC 2', 'SOC 2', 'neutral', 30
  UNION ALL SELECT 'email', 'compliance_profiles', 'bsi_c5', 'BSI C5', 'BSI C5', 'positive', 40
  UNION ALL SELECT 'email', 'compliance_profiles', 'hipaa', 'HIPAA', 'HIPAA', 'neutral', 50
  UNION ALL SELECT 'email', 'migration_import_sources', 'imap', 'IMAP import', 'IMAP-Import', 'positive', 10
  UNION ALL SELECT 'email', 'migration_import_sources', 'gmail', 'Gmail', 'Gmail', 'neutral', 20
  UNION ALL SELECT 'email', 'migration_import_sources', 'outlook', 'Outlook', 'Outlook', 'neutral', 30
  UNION ALL SELECT 'email', 'migration_import_sources', 'yahoo', 'Yahoo Mail', 'Yahoo Mail', 'neutral', 40
  UNION ALL SELECT 'email', 'migration_import_sources', 'csv_contacts', 'CSV contacts', 'CSV-Kontakte', 'neutral', 50
  UNION ALL SELECT 'email', 'migration_import_sources', 'calendar_ics', 'ICS calendars', 'ICS-Kalender', 'neutral', 60
  UNION ALL SELECT 'email', 'migration_import_sources', 'provider_assisted', 'Provider-assisted migration', 'Anbieterunterstützte Migration', 'positive', 70
  UNION ALL SELECT 'email', 'mailbox_export_available', 'none', 'No documented export', 'Kein dokumentierter Export', 'warning', 10
  UNION ALL SELECT 'email', 'mailbox_export_available', 'imap_download', 'IMAP download', 'IMAP-Download', 'positive', 20
  UNION ALL SELECT 'email', 'mailbox_export_available', 'eml_export', 'EML export', 'EML-Export', 'positive', 30
  UNION ALL SELECT 'email', 'mailbox_export_available', 'mbox_export', 'MBOX export', 'MBOX-Export', 'positive', 40
  UNION ALL SELECT 'email', 'mailbox_export_available', 'full_account_export', 'Full account export', 'Vollständiger Kontoexport', 'positive', 50
  UNION ALL SELECT 'email', 'mailbox_export_available', 'admin_export', 'Admin export', 'Admin-Export', 'positive', 60
  UNION ALL SELECT 'email', 'contacts_calendar_export', 'csv_contacts', 'CSV contacts', 'CSV-Kontakte', 'neutral', 10
  UNION ALL SELECT 'email', 'contacts_calendar_export', 'vcard', 'vCard', 'vCard', 'positive', 20
  UNION ALL SELECT 'email', 'contacts_calendar_export', 'ics_calendar', 'ICS calendar', 'ICS-Kalender', 'positive', 30
  UNION ALL SELECT 'email', 'contacts_calendar_export', 'caldav_carddav_sync', 'CalDAV/CardDAV sync', 'CalDAV-/CardDAV-Sync', 'positive', 40
  UNION ALL SELECT 'email', 'productivity_suite_scope', 'mail_only', 'Mail only', 'Nur Mail', 'neutral', 10
  UNION ALL SELECT 'email', 'productivity_suite_scope', 'calendar', 'Calendar', 'Kalender', 'positive', 20
  UNION ALL SELECT 'email', 'productivity_suite_scope', 'contacts', 'Contacts', 'Kontakte', 'positive', 30
  UNION ALL SELECT 'email', 'productivity_suite_scope', 'drive_storage', 'Drive/storage', 'Drive/Speicher', 'tradeoff', 40
  UNION ALL SELECT 'email', 'productivity_suite_scope', 'office_docs', 'Office documents', 'Office-Dokumente', 'tradeoff', 50
  UNION ALL SELECT 'email', 'productivity_suite_scope', 'notes_tasks', 'Notes/tasks', 'Notizen/Aufgaben', 'neutral', 60
  UNION ALL SELECT 'email', 'productivity_suite_scope', 'video_meetings', 'Video meetings', 'Videomeetings', 'tradeoff', 70
  UNION ALL SELECT 'email', 'collaboration_features', 'shared_calendars', 'Shared calendars', 'Geteilte Kalender', 'positive', 10
  UNION ALL SELECT 'email', 'collaboration_features', 'shared_contacts', 'Shared contacts', 'Geteilte Kontakte', 'positive', 20
  UNION ALL SELECT 'email', 'collaboration_features', 'shared_mailboxes', 'Shared mailboxes', 'Geteilte Postfächer', 'positive', 30
  UNION ALL SELECT 'email', 'collaboration_features', 'delegated_mailbox_access', 'Delegated mailbox access', 'Delegierter Postfachzugriff', 'positive', 40
  UNION ALL SELECT 'email', 'collaboration_features', 'distribution_lists', 'Distribution lists', 'Verteilerlisten', 'positive', 50
  UNION ALL SELECT 'email', 'collaboration_features', 'team_groups', 'Team groups', 'Team-Gruppen', 'neutral', 60
  UNION ALL SELECT 'email', 'user_management_model', 'single_user', 'Single user', 'Einzelner Nutzer', 'neutral', 10
  UNION ALL SELECT 'email', 'user_management_model', 'multi_user_admin', 'Multi-user admin', 'Mehrnutzer-Administration', 'positive', 20
  UNION ALL SELECT 'email', 'user_management_model', 'domain_admin', 'Domain admin', 'Domain-Administration', 'positive', 30
  UNION ALL SELECT 'email', 'user_management_model', 'directory_sync', 'Directory sync', 'Verzeichnis-Sync', 'positive', 40
  UNION ALL SELECT 'email', 'user_management_model', 'self_hosted_admin', 'Self-hosted admin', 'Selbst gehostete Administration', 'tradeoff', 50
  UNION ALL SELECT 'email', 'retention_ediscovery', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'email', 'retention_ediscovery', 'retention_policies', 'Retention policies', 'Aufbewahrungsrichtlinien', 'positive', 20
  UNION ALL SELECT 'email', 'retention_ediscovery', 'archive_mailbox', 'Archive mailbox', 'Archivpostfach', 'positive', 30
  UNION ALL SELECT 'email', 'retention_ediscovery', 'legal_hold', 'Legal hold', 'Legal Hold', 'tradeoff', 40
  UNION ALL SELECT 'email', 'retention_ediscovery', 'ediscovery_export', 'eDiscovery export', 'eDiscovery-Export', 'tradeoff', 50
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'email'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'email'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('008-email-matrix-criteria');
