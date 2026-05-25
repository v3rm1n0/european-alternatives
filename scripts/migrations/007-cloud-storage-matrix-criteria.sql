-- Migration 007: Define Cloud Storage category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('cloud-storage', 'storage_plans', 'Storage & Plans', 'Speicher & Tarife', 'Service model, quotas, file sizes, transfer policy, and pricing shape.', 'Dienstmodell, Kontingente, Dateigroessen, Transferregelung und Tarifstruktur.', 100),
  ('cloud-storage', 'sync_access', 'Sync & Access', 'Sync & Zugriff', 'Client coverage, sync model, offline access, and search or preview behavior.', 'Client-Abdeckung, Sync-Modell, Offline-Zugriff sowie Such- und Vorschauverhalten.', 200),
  ('cloud-storage', 'sharing_collaboration', 'Sharing & Collaboration', 'Freigabe & Zusammenarbeit', 'Links, folders, guest access, file requests, and document collaboration.', 'Links, Ordner, Gastzugriff, Dateianfragen und Zusammenarbeit an Dokumenten.', 300),
  ('cloud-storage', 'security_privacy', 'Security & Privacy', 'Sicherheit & Datenschutz', 'Encryption model, encrypted sharing, account security, recovery, and protection controls.', 'Verschluesselungsmodell, verschluesselte Freigabe, Kontosicherheit, Wiederherstellung und Schutzfunktionen.', 400),
  ('cloud-storage', 'data_location_compliance', 'Data Location & Compliance', 'Datenstandort & Compliance', 'EU and data-region choices, infrastructure model, DPA, and compliance profiles.', 'EU- und Datenregion-Auswahl, Infrastrukturmodell, AV-Vertrag und Compliance-Profile.', 500),
  ('cloud-storage', 'recovery_portability', 'Recovery & Portability', 'Wiederherstellung & Portabilitaet', 'Version history, deleted-file retention, export, import, and open protocols.', 'Versionsverlauf, Aufbewahrung geloeschter Dateien, Export, Import und offene Protokolle.', 600),
  ('cloud-storage', 'team_admin_integrations', 'Team Admin & Integrations', 'Team-Administration & Integrationen', 'Team workspaces, roles, admin policies, audit logs, SSO, and integrations.', 'Team-Arbeitsbereiche, Rollen, Admin-Richtlinien, Audit-Protokolle, SSO und Integrationen.', 700);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'cloud-storage' AS category_id, 'storage_plans' AS group_key, 'service_model' AS criterion_key, 'Service model' AS label_en, 'Dienstmodell' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The core delivery model for the storage service.' AS help_text_en, 'Das grundlegende Bereitstellungsmodell des Speicherdienstes.' AS help_text_de
  UNION ALL SELECT 'cloud-storage', 'storage_plans', 'free_tier_storage_gb', 'Free-tier storage (GB)', 'Speicher im Gratis-Tarif (GB)', 'number', 'informational', 'range', 1020, 'Documented storage included in a free plan, measured in gigabytes.', 'Dokumentierter Speicher im Gratis-Tarif, gemessen in Gigabyte.'
  UNION ALL SELECT 'cloud-storage', 'storage_plans', 'personal_plan_storage_gb', 'Personal plan storage (GB)', 'Speicher im Privattarif (GB)', 'number', 'informational', 'range', 1030, 'Documented storage included in a representative personal plan, measured in gigabytes.', 'Dokumentierter Speicher in einem repraesentativen Privattarif, gemessen in Gigabyte.'
  UNION ALL SELECT 'cloud-storage', 'storage_plans', 'max_single_file_size_gb', 'Maximum single-file size (GB)', 'Maximale Einzeldateigroesse (GB)', 'number', 'informational', 'range', 1040, 'Documented maximum size for a single uploaded or synchronized file.', 'Dokumentierte maximale Groesse einer einzelnen hochgeladenen oder synchronisierten Datei.'
  UNION ALL SELECT 'cloud-storage', 'storage_plans', 'storage_expansion_model', 'Storage expansion model', 'Modell zur Speichererweiterung', 'enum', 'tradeoff', 'optional', 1050, 'How users or teams can increase available storage capacity.', 'Wie Nutzer oder Teams die verfuegbare Speicherkapazitaet erhoehen koennen.'
  UNION ALL SELECT 'cloud-storage', 'storage_plans', 'bandwidth_transfer_policy', 'Bandwidth/transfer policy', 'Bandbreiten-/Transferregelung', 'enum', 'tradeoff', 'optional', 1060, 'How upload, download, or sharing transfer limits are documented.', 'Wie Upload-, Download- oder Freigabe-Transferlimits dokumentiert sind.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 2010, 'Operating systems, apps, and access paths with maintained support.', 'Betriebssysteme, Apps und Zugriffswege mit gepflegter Unterstuetzung.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'desktop_sync_client', 'Desktop sync client', 'Desktop-Sync-Client', 'boolean', 'beneficial', 'must_match', 2020, 'Whether maintained desktop synchronization clients are available.', 'Ob gepflegte Desktop-Synchronisierungsclients verfuegbar sind.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'browser_access', 'Browser access', 'Zugriff im Browser', 'boolean', 'beneficial', 'optional', 2030, 'Whether files can be accessed through a browser or web app.', 'Ob Dateien ueber einen Browser oder eine Web-App erreichbar sind.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'virtual_drive', 'Virtual drive mode', 'Virtuelles Laufwerk', 'boolean', 'informational', 'optional', 2040, 'Whether the desktop client can expose cloud files as an on-demand virtual drive.', 'Ob der Desktop-Client Cloud-Dateien als virtuelles Laufwerk bei Bedarf bereitstellen kann.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'selective_sync', 'Selective sync', 'Selektive Synchronisierung', 'boolean', 'beneficial', 'optional', 2050, 'Whether users can choose which folders synchronize locally.', 'Ob Nutzer auswaehlen koennen, welche Ordner lokal synchronisiert werden.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'offline_access', 'Offline access', 'Offline-Zugriff', 'boolean', 'beneficial', 'optional', 2060, 'Whether files or folders can be marked available without connectivity.', 'Ob Dateien oder Ordner ohne Verbindung verfuegbar gemacht werden koennen.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'automatic_camera_upload', 'Automatic camera upload', 'Automatischer Kamera-Upload', 'boolean', 'informational', 'optional', 2070, 'Whether mobile apps can automatically upload camera photos or videos.', 'Ob mobile Apps Kamera-Fotos oder -Videos automatisch hochladen koennen.'
  UNION ALL SELECT 'cloud-storage', 'sync_access', 'search_preview_scope', 'Search and preview scope', 'Such- und Vorschauumfang', 'enum', 'informational', 'optional', 2080, 'How file search and previews are supported.', 'Wie Dateisuche und Vorschauen unterstuetzt werden.'
  UNION ALL SELECT 'cloud-storage', 'sharing_collaboration', 'share_links', 'Share links', 'Freigabelinks', 'boolean', 'beneficial', 'must_match', 3010, 'Whether users can create links to share files or folders.', 'Ob Nutzer Links zum Freigeben von Dateien oder Ordnern erstellen koennen.'
  UNION ALL SELECT 'cloud-storage', 'sharing_collaboration', 'link_access_controls', 'Link access controls', 'Zugriffskontrollen fuer Links', 'multi_enum', 'beneficial', 'multi_select', 3020, 'Controls available for shared links.', 'Verfuegbare Zugriffskontrollen fuer Freigabelinks.'
  UNION ALL SELECT 'cloud-storage', 'sharing_collaboration', 'file_requests', 'File requests/drop folders', 'Dateianfragen/Upload-Ordner', 'boolean', 'beneficial', 'optional', 3030, 'Whether users can collect uploads from others through file requests or drop folders.', 'Ob Nutzer Uploads von anderen ueber Dateianfragen oder Upload-Ordner sammeln koennen.'
  UNION ALL SELECT 'cloud-storage', 'sharing_collaboration', 'shared_folders', 'Shared folders', 'Geteilte Ordner', 'boolean', 'beneficial', 'optional', 3040, 'Whether folders can be shared for ongoing collaboration.', 'Ob Ordner fuer fortlaufende Zusammenarbeit geteilt werden koennen.'
  UNION ALL SELECT 'cloud-storage', 'sharing_collaboration', 'external_collaboration_model', 'External collaboration model', 'Modell fuer externe Zusammenarbeit', 'enum', 'tradeoff', 'optional', 3050, 'How people outside the owner account or organization can collaborate.', 'Wie Personen ausserhalb des Besitzerkontos oder der Organisation zusammenarbeiten koennen.'
  UNION ALL SELECT 'cloud-storage', 'sharing_collaboration', 'collaborative_editing', 'Collaborative document editing', 'Gemeinsame Dokumentbearbeitung', 'enum', 'informational', 'optional', 3060, 'Whether the service includes or integrates collaborative document editing.', 'Ob der Dienst gemeinsame Dokumentbearbeitung enthaelt oder integriert.'
  UNION ALL SELECT 'cloud-storage', 'security_privacy', 'encryption_model', 'Encryption model', 'Verschluesselungsmodell', 'enum', 'tradeoff', 'must_match', 4010, 'How file content encryption is documented for normal use.', 'Wie die Verschluesselung von Dateiinhalten fuer normale Nutzung dokumentiert ist.'
  UNION ALL SELECT 'cloud-storage', 'security_privacy', 'encrypted_sharing_available', 'Encrypted sharing available', 'Verschluesselte Freigabe verfuegbar', 'boolean', 'beneficial', 'optional', 4020, 'Whether encrypted shares can be used without external tools.', 'Ob verschluesselte Freigaben ohne externe Werkzeuge genutzt werden koennen.'
  UNION ALL SELECT 'cloud-storage', 'security_privacy', 'two_factor_auth', 'Two-factor authentication', 'Zwei-Faktor-Authentifizierung', 'boolean', 'beneficial', 'optional', 4030, 'Whether accounts can require or enable two-factor authentication.', 'Ob Konten Zwei-Faktor-Authentifizierung erfordern oder aktivieren koennen.'
  UNION ALL SELECT 'cloud-storage', 'security_privacy', 'account_recovery_model', 'Account recovery model', 'Modell zur Kontowiederherstellung', 'enum', 'tradeoff', 'optional', 4040, 'How account or key recovery is handled.', 'Wie Konto- oder Schluesselwiederherstellung gehandhabt wird.'
  UNION ALL SELECT 'cloud-storage', 'security_privacy', 'customer_managed_keys', 'Customer-managed keys', 'Kundenseitig verwaltete Schluessel', 'boolean', 'tradeoff', 'optional', 4050, 'Whether customers can manage their own encryption keys.', 'Ob Kunden ihre eigenen Verschluesselungsschluessel verwalten koennen.'
  UNION ALL SELECT 'cloud-storage', 'security_privacy', 'ransomware_protection', 'Ransomware protection controls', 'Ransomware-Schutzfunktionen', 'multi_enum', 'beneficial', 'multi_select', 4060, 'Controls that help detect, limit, or restore from ransomware-style changes.', 'Funktionen, die Ransomware-aehnliche Aenderungen erkennen, begrenzen oder wiederherstellen helfen.'
  UNION ALL SELECT 'cloud-storage', 'data_location_compliance', 'storage_region_model', 'Storage region model', 'Speicherregion-Modell', 'enum', 'tradeoff', 'must_match', 5010, 'How storage location is selected or constrained.', 'Wie die Speicherregion ausgewaehlt oder eingeschraenkt wird.'
  UNION ALL SELECT 'cloud-storage', 'data_location_compliance', 'eu_storage_available', 'EU storage available', 'EU-Speicherung verfuegbar', 'boolean', 'beneficial', 'must_match', 5020, 'Whether file storage in the European Union is available.', 'Ob Speicherung von Dateien in der EU verfuegbar ist.'
  UNION ALL SELECT 'cloud-storage', 'data_location_compliance', 'user_selectable_region', 'User-selectable region', 'Nutzerwaehlbare Region', 'boolean', 'beneficial', 'optional', 5030, 'Whether users or admins can choose the storage region.', 'Ob Nutzer oder Administratoren die Speicherregion waehlen koennen.'
  UNION ALL SELECT 'cloud-storage', 'data_location_compliance', 'hosting_infrastructure_model', 'Hosting infrastructure model', 'Hosting-Infrastrukturmodell', 'enum', 'informational', 'optional', 5040, 'The documented infrastructure model used to host storage.', 'Das dokumentierte Infrastrukturmodell fuer das Hosting des Speichers.'
  UNION ALL SELECT 'cloud-storage', 'data_location_compliance', 'data_processing_agreement', 'Data processing agreement available', 'AV-Vertrag verfuegbar', 'boolean', 'informational', 'optional', 5050, 'Whether a data processing agreement is available for customers.', 'Ob ein AV-Vertrag fuer Kunden verfuegbar ist.'
  UNION ALL SELECT 'cloud-storage', 'data_location_compliance', 'compliance_profiles', 'Compliance profiles', 'Compliance-Profile', 'multi_enum', 'informational', 'multi_select', 5060, 'Documented compliance profiles or attestations relevant to storage customers.', 'Dokumentierte Compliance-Profile oder Nachweise fuer Speicherkunden.'
  UNION ALL SELECT 'cloud-storage', 'recovery_portability', 'file_versioning_available', 'File versioning available', 'Dateiversionierung verfuegbar', 'boolean', 'beneficial', 'optional', 6010, 'Whether earlier versions of files can be recovered.', 'Ob fruehere Versionen von Dateien wiederhergestellt werden koennen.'
  UNION ALL SELECT 'cloud-storage', 'recovery_portability', 'version_history_days', 'Version history retention (days)', 'Aufbewahrung von Versionen (Tage)', 'number', 'beneficial', 'range', 6020, 'Documented number of days that file versions are retained.', 'Dokumentierte Anzahl von Tagen, fuer die Versionen aufbewahrt werden.'
  UNION ALL SELECT 'cloud-storage', 'recovery_portability', 'deleted_file_retention_days', 'Deleted-file retention (days)', 'Aufbewahrung geloeschter Dateien (Tage)', 'number', 'beneficial', 'range', 6030, 'Documented number of days deleted files can be restored.', 'Dokumentierte Anzahl von Tagen, fuer die geloeschter Dateien wiederhergestellt werden koennen.'
  UNION ALL SELECT 'cloud-storage', 'recovery_portability', 'full_account_export', 'Full account export', 'Vollstaendiger Kontoexport', 'boolean', 'beneficial', 'optional', 6040, 'Whether users can export a complete account or storage dataset.', 'Ob Nutzer ein vollstaendiges Konto oder Speicherdaten exportieren koennen.'
  UNION ALL SELECT 'cloud-storage', 'recovery_portability', 'open_protocol_access', 'Open protocol access', 'Offener Protokollzugriff', 'multi_enum', 'informational', 'multi_select', 6050, 'Open or widely supported protocols and APIs for file access.', 'Offene oder breit unterstuetzte Protokolle und APIs fuer Dateizugriff.'
  UNION ALL SELECT 'cloud-storage', 'recovery_portability', 'migration_import_sources', 'Migration import sources', 'Quellen fuer Migrationsimport', 'multi_enum', 'informational', 'multi_select', 6060, 'Sources the service can import from during migration.', 'Quellen, aus denen der Dienst beim Migrationsimport importieren kann.'
  UNION ALL SELECT 'cloud-storage', 'team_admin_integrations', 'team_workspaces', 'Team workspaces', 'Team-Arbeitsbereiche', 'boolean', 'beneficial', 'optional', 7010, 'Whether shared team or organization workspaces are available.', 'Ob gemeinsame Team- oder Organisations-Arbeitsbereiche verfuegbar sind.'
  UNION ALL SELECT 'cloud-storage', 'team_admin_integrations', 'role_permissions', 'Role and permission model', 'Rollen- und Berechtigungsmodell', 'multi_enum', 'beneficial', 'multi_select', 7020, 'Roles and permission levels available for files, folders, teams, or guests.', 'Verfuegbare Rollen und Berechtigungsstufen fuer Dateien, Ordner, Teams oder Gaeste.'
  UNION ALL SELECT 'cloud-storage', 'team_admin_integrations', 'admin_console', 'Admin console', 'Administrationskonsole', 'boolean', 'beneficial', 'optional', 7030, 'Whether an administrative console is available for teams or organizations.', 'Ob eine Administrationskonsole fuer Teams oder Organisationen verfuegbar ist.'
  UNION ALL SELECT 'cloud-storage', 'team_admin_integrations', 'sharing_policy_controls', 'Sharing policy controls', 'Richtlinien fuer Freigaben', 'multi_enum', 'beneficial', 'multi_select', 7040, 'Administrative policies for controlling sharing behavior.', 'Administrative Richtlinien zur Steuerung von Freigaben.'
  UNION ALL SELECT 'cloud-storage', 'team_admin_integrations', 'audit_logs', 'Audit logs', 'Audit-Protokolle', 'boolean', 'beneficial', 'optional', 7050, 'Whether admins can view audit logs for storage and sharing activity.', 'Ob Administratoren Audit-Protokolle fuer Speicher- und Freigabeaktivitaeten einsehen koennen.'
  UNION ALL SELECT 'cloud-storage', 'team_admin_integrations', 'sso_available', 'SSO available', 'SSO verfuegbar', 'boolean', 'beneficial', 'optional', 7060, 'Whether single sign-on is available for team or business accounts.', 'Ob SSO fuer Team- oder Geschaeftskonten verfuegbar ist.'
  UNION ALL SELECT 'cloud-storage', 'team_admin_integrations', 'integration_support', 'Integration support', 'Integrationsunterstuetzung', 'multi_enum', 'informational', 'multi_select', 7070, 'Documented integrations, automation hooks, or tooling support.', 'Dokumentierte Integrationen, Automatisierungsschnittstellen oder Werkzeug-Unterstuetzung.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'cloud-storage' AS category_id, 'service_model' AS criterion_key, 'hosted_file_sync' AS option_key, 'Hosted file sync' AS label_en, 'Gehostete Dateisynchronisierung' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'cloud-storage', 'service_model', 'encrypted_drive', 'Encrypted drive', 'Verschluesselter Drive', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'service_model', 'self_hostable_platform', 'Self-hostable platform', 'Selbsthostbare Plattform', 'tradeoff', 30
  UNION ALL SELECT 'cloud-storage', 'service_model', 'storage_box', 'Storage box / network drive', 'Storage Box / Netzlaufwerk', 'tradeoff', 40
  UNION ALL SELECT 'cloud-storage', 'service_model', 'object_storage', 'Object storage', 'Objektspeicher', 'tradeoff', 50
  UNION ALL SELECT 'cloud-storage', 'storage_expansion_model', 'fixed_plans', 'Fixed storage plans', 'Feste Speichertarife', 'neutral', 10
  UNION ALL SELECT 'cloud-storage', 'storage_expansion_model', 'per_user_quota', 'Per-user quota', 'Kontingent pro Nutzer', 'neutral', 20
  UNION ALL SELECT 'cloud-storage', 'storage_expansion_model', 'pooled_team_storage', 'Pooled team storage', 'Gemeinsamer Teamspeicher', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'storage_expansion_model', 'usage_based', 'Usage-based billing', 'Nutzungsbasierte Abrechnung', 'tradeoff', 40
  UNION ALL SELECT 'cloud-storage', 'storage_expansion_model', 'self_hosted_capacity', 'Self-hosted capacity', 'Selbst bereitgestellte Kapazitaet', 'tradeoff', 50
  UNION ALL SELECT 'cloud-storage', 'bandwidth_transfer_policy', 'unmetered', 'Unmetered', 'Ohne festes Limit', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'bandwidth_transfer_policy', 'fair_use', 'Fair-use policy', 'Fair-Use-Regelung', 'tradeoff', 20
  UNION ALL SELECT 'cloud-storage', 'bandwidth_transfer_policy', 'fixed_quota', 'Fixed transfer quota', 'Festes Transferkontingent', 'warning', 30
  UNION ALL SELECT 'cloud-storage', 'bandwidth_transfer_policy', 'plan_dependent', 'Plan-dependent', 'Tarifabhaengig', 'neutral', 40
  UNION ALL SELECT 'cloud-storage', 'bandwidth_transfer_policy', 'throttled_after_limit', 'Throttled after limit', 'Drosselung nach Limit', 'warning', 50
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 20
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 30
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'linux', 'Linux', 'Linux', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 60
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 70
  UNION ALL SELECT 'cloud-storage', 'supported_platforms', 'nas', 'NAS', 'NAS', 'tradeoff', 80
  UNION ALL SELECT 'cloud-storage', 'search_preview_scope', 'none', 'No search/preview', 'Keine Suche/Vorschau', 'warning', 10
  UNION ALL SELECT 'cloud-storage', 'search_preview_scope', 'filename_only', 'Filename search only', 'Nur Dateinamensuche', 'neutral', 20
  UNION ALL SELECT 'cloud-storage', 'search_preview_scope', 'full_text', 'Full-text search', 'Volltextsuche', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'search_preview_scope', 'media_preview', 'Media preview', 'Medienvorschau', 'neutral', 40
  UNION ALL SELECT 'cloud-storage', 'search_preview_scope', 'office_preview', 'Office document preview', 'Office-Dokumentvorschau', 'neutral', 50
  UNION ALL SELECT 'cloud-storage', 'link_access_controls', 'password', 'Password protection', 'Passwortschutz', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'link_access_controls', 'expiration', 'Expiration date', 'Ablaufdatum', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'link_access_controls', 'download_disable', 'Disable downloads', 'Downloads deaktivieren', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'link_access_controls', 'upload_only', 'Upload-only links', 'Nur-Upload-Links', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'link_access_controls', 'recipient_allowlist', 'Recipient allowlist', 'Empfaenger-Zulassungsliste', 'positive', 50
  UNION ALL SELECT 'cloud-storage', 'link_access_controls', 'view_only', 'View-only links', 'Nur-Ansehen-Links', 'neutral', 60
  UNION ALL SELECT 'cloud-storage', 'external_collaboration_model', 'public_links', 'Public links', 'Oeffentliche Links', 'neutral', 10
  UNION ALL SELECT 'cloud-storage', 'external_collaboration_model', 'guest_accounts', 'Guest accounts', 'Gastkonten', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'external_collaboration_model', 'account_required', 'Account required', 'Konto erforderlich', 'tradeoff', 30
  UNION ALL SELECT 'cloud-storage', 'external_collaboration_model', 'federated_shares', 'Federated shares', 'Foederierte Freigaben', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'collaborative_editing', 'none', 'No collaborative editing', 'Keine gemeinsame Bearbeitung', 'neutral', 10
  UNION ALL SELECT 'cloud-storage', 'collaborative_editing', 'integrated_office', 'Integrated office suite', 'Integriertes Office-Paket', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'collaborative_editing', 'external_office_integration', 'External office integration', 'Externe Office-Integration', 'tradeoff', 30
  UNION ALL SELECT 'cloud-storage', 'collaborative_editing', 'comments_only', 'Comments/annotations only', 'Nur Kommentare/Anmerkungen', 'neutral', 40
  UNION ALL SELECT 'cloud-storage', 'encryption_model', 'server_side_encryption', 'Server-side encryption', 'Serverseitige Verschluesselung', 'neutral', 10
  UNION ALL SELECT 'cloud-storage', 'encryption_model', 'client_side_optional', 'Optional client-side encryption', 'Optionale clientseitige Verschluesselung', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'encryption_model', 'zero_knowledge_default', 'Zero-knowledge by default', 'Zero-Knowledge standardmaessig', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'encryption_model', 'user_managed_keys', 'User-managed keys', 'Nutzerverwaltete Schluessel', 'tradeoff', 40
  UNION ALL SELECT 'cloud-storage', 'encryption_model', 'external_encryption_required', 'External encryption required', 'Externe Verschluesselung erforderlich', 'warning', 50
  UNION ALL SELECT 'cloud-storage', 'account_recovery_model', 'provider_reset', 'Provider account reset', 'Anbieter-Kontoruecksetzung', 'neutral', 10
  UNION ALL SELECT 'cloud-storage', 'account_recovery_model', 'recovery_key', 'Recovery key', 'Wiederherstellungsschluessel', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'account_recovery_model', 'admin_recovery', 'Admin recovery', 'Admin-Wiederherstellung', 'tradeoff', 30
  UNION ALL SELECT 'cloud-storage', 'account_recovery_model', 'no_provider_recovery', 'No provider recovery', 'Keine Anbieter-Wiederherstellung', 'tradeoff', 40
  UNION ALL SELECT 'cloud-storage', 'ransomware_protection', 'version_history', 'Version history', 'Versionsverlauf', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'ransomware_protection', 'mass_restore', 'Mass restore', 'Massenwiederherstellung', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'ransomware_protection', 'suspicious_activity_detection', 'Suspicious activity detection', 'Erkennung verdaechtiger Aktivitaet', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'ransomware_protection', 'immutable_snapshots', 'Immutable snapshots', 'Unveraenderliche Snapshots', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'storage_region_model', 'eu_only', 'EU-only storage', 'Speicherung nur in der EU', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'storage_region_model', 'country_specific', 'Country-specific storage', 'Laenderspezifische Speicherung', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'storage_region_model', 'user_selectable_region', 'User-selectable region', 'Nutzerwaehlbare Region', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'storage_region_model', 'provider_selected_region', 'Provider-selected region', 'Anbietergewaehlte Region', 'neutral', 40
  UNION ALL SELECT 'cloud-storage', 'storage_region_model', 'global_or_mixed', 'Global or mixed regions', 'Globale oder gemischte Regionen', 'tradeoff', 50
  UNION ALL SELECT 'cloud-storage', 'storage_region_model', 'customer_controlled_self_hosted', 'Customer-controlled/self-hosted', 'Kundenseitig kontrolliert/selbst gehostet', 'tradeoff', 60
  UNION ALL SELECT 'cloud-storage', 'hosting_infrastructure_model', 'own_datacenters', 'Own data centers', 'Eigene Rechenzentren', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'hosting_infrastructure_model', 'eu_cloud_provider', 'EU cloud provider', 'EU-Cloud-Anbieter', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'hosting_infrastructure_model', 'hyperscaler', 'Hyperscaler infrastructure', 'Hyperscaler-Infrastruktur', 'tradeoff', 30
  UNION ALL SELECT 'cloud-storage', 'hosting_infrastructure_model', 'customer_controlled', 'Customer-controlled infrastructure', 'Kundenseitig kontrollierte Infrastruktur', 'tradeoff', 40
  UNION ALL SELECT 'cloud-storage', 'hosting_infrastructure_model', 'mixed', 'Mixed infrastructure', 'Gemischte Infrastruktur', 'neutral', 50
  UNION ALL SELECT 'cloud-storage', 'compliance_profiles', 'gdpr_dpa', 'GDPR DPA', 'DSGVO-AVV', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'compliance_profiles', 'iso_27001', 'ISO 27001', 'ISO 27001', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'compliance_profiles', 'soc2', 'SOC 2', 'SOC 2', 'neutral', 30
  UNION ALL SELECT 'cloud-storage', 'compliance_profiles', 'bsi_c5', 'BSI C5', 'BSI C5', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'compliance_profiles', 'hipaa', 'HIPAA', 'HIPAA', 'neutral', 50
  UNION ALL SELECT 'cloud-storage', 'open_protocol_access', 'webdav', 'WebDAV', 'WebDAV', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'open_protocol_access', 's3_compatible', 'S3-compatible API', 'S3-kompatible API', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'open_protocol_access', 'rclone_supported', 'rclone supported', 'rclone unterstuetzt', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'open_protocol_access', 'rsync_sftp', 'rsync/SFTP', 'rsync/SFTP', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'open_protocol_access', 'nextcloud_sync', 'Nextcloud sync protocol', 'Nextcloud-Sync-Protokoll', 'positive', 50
  UNION ALL SELECT 'cloud-storage', 'open_protocol_access', 'rest_api', 'REST API', 'REST-API', 'neutral', 60
  UNION ALL SELECT 'cloud-storage', 'open_protocol_access', 'proprietary_only', 'Proprietary only', 'Nur proprietaer', 'warning', 70
  UNION ALL SELECT 'cloud-storage', 'migration_import_sources', 'google_drive', 'Google Drive', 'Google Drive', 'neutral', 10
  UNION ALL SELECT 'cloud-storage', 'migration_import_sources', 'dropbox', 'Dropbox', 'Dropbox', 'neutral', 20
  UNION ALL SELECT 'cloud-storage', 'migration_import_sources', 'onedrive', 'OneDrive', 'OneDrive', 'neutral', 30
  UNION ALL SELECT 'cloud-storage', 'migration_import_sources', 'webdav', 'WebDAV', 'WebDAV', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'migration_import_sources', 'local_folder', 'Local folder upload', 'Lokaler Ordner-Upload', 'neutral', 50
  UNION ALL SELECT 'cloud-storage', 'migration_import_sources', 'other_cloud_import', 'Other cloud import', 'Anderer Cloud-Import', 'neutral', 60
  UNION ALL SELECT 'cloud-storage', 'role_permissions', 'owner_admin', 'Owner/admin', 'Owner/Admin', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'role_permissions', 'editor', 'Editor', 'Bearbeiter', 'neutral', 20
  UNION ALL SELECT 'cloud-storage', 'role_permissions', 'viewer', 'Viewer', 'Betrachter', 'neutral', 30
  UNION ALL SELECT 'cloud-storage', 'role_permissions', 'upload_only', 'Upload-only', 'Nur Upload', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'role_permissions', 'guest_external', 'External guest', 'Externer Gast', 'tradeoff', 50
  UNION ALL SELECT 'cloud-storage', 'role_permissions', 'granular_folder_roles', 'Granular folder roles', 'Granulare Ordnerrollen', 'positive', 60
  UNION ALL SELECT 'cloud-storage', 'sharing_policy_controls', 'disable_public_links', 'Disable public links', 'Oeffentliche Links deaktivieren', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'sharing_policy_controls', 'domain_allowlist', 'Domain allowlist', 'Domain-Zulassungsliste', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'sharing_policy_controls', 'expiry_required', 'Required expiration', 'Ablaufdatum erzwingen', 'positive', 30
  UNION ALL SELECT 'cloud-storage', 'sharing_policy_controls', 'download_restrictions', 'Download restrictions', 'Download-Beschraenkungen', 'positive', 40
  UNION ALL SELECT 'cloud-storage', 'sharing_policy_controls', 'remote_wipe', 'Remote wipe', 'Remote-Loeschung', 'tradeoff', 50
  UNION ALL SELECT 'cloud-storage', 'sharing_policy_controls', 'dlp', 'Data loss prevention', 'Data Loss Prevention', 'positive', 60
  UNION ALL SELECT 'cloud-storage', 'integration_support', 'office_suite', 'Office suite integration', 'Office-Paket-Integration', 'positive', 10
  UNION ALL SELECT 'cloud-storage', 'integration_support', 'backup_tools', 'Backup tools', 'Backup-Werkzeuge', 'positive', 20
  UNION ALL SELECT 'cloud-storage', 'integration_support', 'cli', 'CLI', 'CLI', 'neutral', 30
  UNION ALL SELECT 'cloud-storage', 'integration_support', 'webhooks', 'Webhooks', 'Webhooks', 'neutral', 40
  UNION ALL SELECT 'cloud-storage', 'integration_support', 'automation_platforms', 'Automation platforms', 'Automatisierungsplattformen', 'neutral', 50
  UNION ALL SELECT 'cloud-storage', 'integration_support', 'productivity_suite', 'Productivity suite', 'Produktivitaets-Suite', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'cloud-storage'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'cloud-storage'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('007-cloud-storage-matrix-criteria');
