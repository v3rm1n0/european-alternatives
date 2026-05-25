-- Migration 028: Define Databases category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('databases', 'database_model_query', 'Database Model & Query Language', 'Datenbankmodell & Abfragesprache', 'Core database model, query language support, and data processing capabilities.', 'Grundlegendes Datenbankmodell, Abfragesprachunterstuetzung und Datenverarbeitungsfaehigkeiten.', 100),
  ('databases', 'performance_scalability', 'Performance & Scalability', 'Leistung & Skalierbarkeit', 'Replication, scaling, and performance characteristics.', 'Replikation, Skalierung und Leistungsmerkmale.', 200),
  ('databases', 'deployment_operations', 'Deployment & Operations', 'Bereitstellung & Betrieb', 'Deployment options, container support, and operational tooling.', 'Bereitstellungsoptionen, Container-Unterstuetzung und Betriebswerkzeuge.', 300),
  ('databases', 'data_protection_compliance', 'Data Protection & Compliance', 'Datenschutz & Compliance', 'Encryption, data residency, and compliance certifications.', 'Verschluesselung, Datenresidenz und Compliance-Zertifizierungen.', 400),
  ('databases', 'security_access_control', 'Security & Access Control', 'Sicherheit & Zugriffskontrolle', 'Authentication, authorization, and audit capabilities.', 'Authentifizierung, Autorisierung und Audit-Faehigkeiten.', 500),
  ('databases', 'ecosystem_integration', 'Ecosystem & Integration', 'Oekosystem & Integration', 'Client libraries, ORM support, and platform compatibility.', 'Client-Bibliotheken, ORM-Unterstuetzung und Plattformkompatibilitaet.', 600),
  ('databases', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Source code openness, licensing, and auditability.', 'Quellcode-Offenheit, Lizenzierung und Pruefbarkeit.', 700),
  ('databases', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model and user profile targeting.', 'Preismodell und Zielgruppen-Eignung.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'databases' AS category_id, 'database_model_query' AS group_key, 'database_type' AS criterion_key, 'Database type' AS label_en, 'Datenbanktyp' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The fundamental data model of the database.' AS help_text_en, 'Das grundlegende Datenmodell der Datenbank.' AS help_text_de
  UNION ALL SELECT 'databases', 'database_model_query', 'sql_compatibility', 'SQL compatibility', 'SQL-Kompatibilitaet', 'enum', 'informational', 'optional', 1020, 'The level of SQL support and wire-protocol compatibility.', 'Der Grad der SQL-Unterstuetzung und Drahtprotokoll-Kompatibilitaet.'
  UNION ALL SELECT 'databases', 'database_model_query', 'acid_compliance', 'ACID compliance', 'ACID-Konformitaet', 'boolean', 'beneficial', 'optional', 1030, 'Whether the database guarantees ACID transaction properties.', 'Ob die Datenbank ACID-Transaktionseigenschaften garantiert.'
  UNION ALL SELECT 'databases', 'database_model_query', 'json_document_support', 'JSON/document support', 'JSON-/Dokumentunterstuetzung', 'boolean', 'informational', 'optional', 1040, 'Whether native JSON or document storage is supported.', 'Ob nativer JSON- oder Dokumentspeicher unterstuetzt wird.'
  UNION ALL SELECT 'databases', 'database_model_query', 'full_text_search', 'Full-text search', 'Volltextsuche', 'boolean', 'informational', 'optional', 1050, 'Whether built-in full-text search capabilities are available.', 'Ob integrierte Volltextsuch-Faehigkeiten verfuegbar sind.'
  UNION ALL SELECT 'databases', 'database_model_query', 'geospatial_support', 'Geospatial support', 'Geodatenunterstuetzung', 'boolean', 'informational', 'optional', 1060, 'Whether geospatial data types and queries are supported.', 'Ob Geodatentypen und -abfragen unterstuetzt werden.'
  UNION ALL SELECT 'databases', 'database_model_query', 'time_series_support', 'Time-series support', 'Zeitreihenunterstuetzung', 'boolean', 'informational', 'optional', 1070, 'Whether optimized time-series data storage and queries are supported.', 'Ob optimierte Zeitreihen-Datenspeicherung und -abfragen unterstuetzt werden.'
  UNION ALL SELECT 'databases', 'performance_scalability', 'replication_model', 'Replication model', 'Replikationsmodell', 'enum', 'tradeoff', 'optional', 2010, 'The replication architecture used for data redundancy and availability.', 'Die Replikationsarchitektur fuer Datenredundanz und Verfuegbarkeit.'
  UNION ALL SELECT 'databases', 'performance_scalability', 'horizontal_scaling', 'Horizontal scaling', 'Horizontale Skalierung', 'boolean', 'informational', 'optional', 2020, 'Whether the database supports horizontal scaling across multiple nodes.', 'Ob die Datenbank horizontale Skalierung ueber mehrere Knoten unterstuetzt.'
  UNION ALL SELECT 'databases', 'performance_scalability', 'read_replicas', 'Read replicas supported', 'Lesereplikate unterstuetzt', 'boolean', 'informational', 'optional', 2030, 'Whether read replicas can be configured for scaling read workloads.', 'Ob Lesereplikate fuer die Skalierung von Lese-Workloads konfiguriert werden koennen.'
  UNION ALL SELECT 'databases', 'performance_scalability', 'connection_pooling', 'Built-in connection pooling', 'Integriertes Connection-Pooling', 'boolean', 'informational', 'optional', 2040, 'Whether built-in connection pooling is available.', 'Ob integriertes Connection-Pooling verfuegbar ist.'
  UNION ALL SELECT 'databases', 'performance_scalability', 'partitioning_support', 'Table partitioning', 'Tabellenpartitionierung', 'boolean', 'informational', 'optional', 2050, 'Whether table partitioning for large datasets is supported.', 'Ob Tabellenpartitionierung fuer grosse Datensaetze unterstuetzt wird.'
  UNION ALL SELECT 'databases', 'deployment_operations', 'self_hosting_available', 'Self-hosting available', 'Self-Hosting verfuegbar', 'boolean', 'beneficial', 'must_match', 3010, 'Whether the database can be self-hosted on own infrastructure.', 'Ob die Datenbank auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'databases', 'deployment_operations', 'managed_cloud_available', 'Managed cloud service available', 'Verwalteter Cloud-Dienst verfuegbar', 'boolean', 'informational', 'optional', 3020, 'Whether a managed cloud database service is available.', 'Ob ein verwalteter Cloud-Datenbankdienst verfuegbar ist.'
  UNION ALL SELECT 'databases', 'deployment_operations', 'container_image', 'Official container image available', 'Offizielles Container-Image verfuegbar', 'boolean', 'beneficial', 'optional', 3030, 'Whether an official Docker or OCI container image is provided.', 'Ob ein offizielles Docker- oder OCI-Container-Image bereitgestellt wird.'
  UNION ALL SELECT 'databases', 'deployment_operations', 'kubernetes_operator', 'Kubernetes operator available', 'Kubernetes-Operator verfuegbar', 'boolean', 'informational', 'optional', 3040, 'Whether a Kubernetes operator for automated deployment is available.', 'Ob ein Kubernetes-Operator fuer automatisierte Bereitstellung verfuegbar ist.'
  UNION ALL SELECT 'databases', 'deployment_operations', 'backup_tooling', 'Built-in backup tooling', 'Integrierte Backup-Werkzeuge', 'enum', 'informational', 'optional', 3050, 'The level of built-in backup and restore tooling.', 'Der Umfang der integrierten Backup- und Wiederherstellungswerkzeuge.'
  UNION ALL SELECT 'databases', 'deployment_operations', 'upgrade_path', 'Major version upgrade path', 'Upgrade-Pfad fuer Hauptversionen', 'enum', 'tradeoff', 'optional', 3060, 'How major version upgrades are performed.', 'Wie Upgrades auf Hauptversionen durchgefuehrt werden.'
  UNION ALL SELECT 'databases', 'data_protection_compliance', 'encryption_at_rest', 'Encryption at rest', 'Verschluesselung ruhender Daten', 'boolean', 'beneficial', 'optional', 4010, 'Whether data at rest is encrypted.', 'Ob ruhende Daten verschluesselt werden.'
  UNION ALL SELECT 'databases', 'data_protection_compliance', 'encryption_in_transit', 'Encryption in transit (TLS)', 'Verschluesselung bei Uebertragung (TLS)', 'boolean', 'beneficial', 'optional', 4020, 'Whether data in transit is encrypted via TLS.', 'Ob Daten bei der Uebertragung via TLS verschluesselt werden.'
  UNION ALL SELECT 'databases', 'data_protection_compliance', 'eu_managed_option', 'EU-hosted managed option', 'EU-gehostete verwaltete Option', 'boolean', 'beneficial', 'must_match', 4030, 'Whether a managed database option hosted in the EU is available.', 'Ob eine in der EU gehostete verwaltete Datenbankoption verfuegbar ist.'
  UNION ALL SELECT 'databases', 'data_protection_compliance', 'data_residency_control', 'Data residency control', 'Datenresidenz-Kontrolle', 'boolean', 'beneficial', 'optional', 4040, 'Whether the user can control where data is physically stored.', 'Ob der Nutzer kontrollieren kann, wo Daten physisch gespeichert werden.'
  UNION ALL SELECT 'databases', 'data_protection_compliance', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfuegbar', 'boolean', 'informational', 'optional', 4050, 'Whether a GDPR-compliant data processing agreement is available.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag verfuegbar ist.'
  UNION ALL SELECT 'databases', 'data_protection_compliance', 'compliance_certifications', 'Compliance certifications', 'Compliance-Zertifizierungen', 'multi_enum', 'informational', 'multi_select', 4060, 'Which compliance certifications the provider holds.', 'Welche Compliance-Zertifizierungen der Anbieter besitzt.'
  UNION ALL SELECT 'databases', 'security_access_control', 'authentication_methods', 'Authentication methods', 'Authentifizierungsmethoden', 'multi_enum', 'informational', 'multi_select', 5010, 'Supported authentication methods for database access.', 'Unterstuetzte Authentifizierungsmethoden fuer den Datenbankzugriff.'
  UNION ALL SELECT 'databases', 'security_access_control', 'role_based_access', 'Role-based access control', 'Rollenbasierte Zugriffskontrolle', 'boolean', 'beneficial', 'optional', 5020, 'Whether role-based access control is supported.', 'Ob rollenbasierte Zugriffskontrolle unterstuetzt wird.'
  UNION ALL SELECT 'databases', 'security_access_control', 'row_level_security', 'Row-level security', 'Sicherheit auf Zeilenebene', 'boolean', 'informational', 'optional', 5030, 'Whether row-level security policies can be defined.', 'Ob Sicherheitsrichtlinien auf Zeilenebene definiert werden koennen.'
  UNION ALL SELECT 'databases', 'security_access_control', 'audit_logging', 'Audit logging', 'Audit-Protokollierung', 'boolean', 'beneficial', 'optional', 5040, 'Whether audit logging of database operations is available.', 'Ob Audit-Protokollierung von Datenbankoperationen verfuegbar ist.'
  UNION ALL SELECT 'databases', 'security_access_control', 'field_level_encryption', 'Field-level encryption', 'Verschluesselung auf Feldebene', 'boolean', 'informational', 'optional', 5050, 'Whether individual fields or columns can be encrypted.', 'Ob einzelne Felder oder Spalten verschluesselt werden koennen.'
  UNION ALL SELECT 'databases', 'ecosystem_integration', 'client_library_languages', 'Client library languages', 'Client-Bibliothekssprachen', 'multi_enum', 'informational', 'multi_select', 6010, 'Programming languages with official or well-maintained client libraries.', 'Programmiersprachen mit offiziellen oder gut gepflegten Client-Bibliotheken.'
  UNION ALL SELECT 'databases', 'ecosystem_integration', 'orm_framework_support', 'ORM/framework support', 'ORM-/Framework-Unterstuetzung', 'boolean', 'informational', 'optional', 6020, 'Whether popular ORMs and frameworks support this database.', 'Ob populaere ORMs und Frameworks diese Datenbank unterstuetzen.'
  UNION ALL SELECT 'databases', 'ecosystem_integration', 'extensions_plugins', 'Extensions or plugin system', 'Erweiterungen oder Plugin-System', 'boolean', 'informational', 'optional', 6030, 'Whether an extension or plugin system is available.', 'Ob ein Erweiterungs- oder Plugin-System verfuegbar ist.'
  UNION ALL SELECT 'databases', 'ecosystem_integration', 'change_data_capture', 'Change data capture (CDC)', 'Change Data Capture (CDC)', 'boolean', 'informational', 'optional', 6040, 'Whether change data capture for streaming changes is supported.', 'Ob Change Data Capture fuer das Streaming von Aenderungen unterstuetzt wird.'
  UNION ALL SELECT 'databases', 'ecosystem_integration', 'supported_platforms', 'Supported server platforms', 'Unterstuetzte Serverplattformen', 'multi_enum', 'informational', 'multi_select', 6050, 'Server operating systems and platforms the database runs on.', 'Server-Betriebssysteme und Plattformen, auf denen die Datenbank laeuft.'
  UNION ALL SELECT 'databases', 'openness_audit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'Whether the source code is open source, source available, or proprietary.', 'Ob der Quellcode quelloffen, quelleinsehbar oder proprietaer ist.'
  UNION ALL SELECT 'databases', 'openness_audit', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7020, 'The software license under which the database is distributed.', 'Die Softwarelizenz, unter der die Datenbank vertrieben wird.'
  UNION ALL SELECT 'databases', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhaengiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 7030, 'Whether an independent security audit has been completed.', 'Ob ein unabhaengiges Sicherheitsaudit durchgefuehrt wurde.'
  UNION ALL SELECT 'databases', 'openness_audit', 'community_governance', 'Community governance', 'Community-Governance', 'boolean', 'informational', 'optional', 7040, 'Whether the project has community-driven governance.', 'Ob das Projekt eine Community-gesteuerte Governance hat.'
  UNION ALL SELECT 'databases', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'The billing model used by the provider.', 'Das vom Anbieter verwendete Abrechnungsmodell.'
  UNION ALL SELECT 'databases', 'pricing_fit', 'free_tier_available', 'Free tier or community edition', 'Kostenlose Stufe oder Community-Edition', 'boolean', 'informational', 'optional', 8020, 'Whether a free plan or community edition is available.', 'Ob ein kostenloser Tarif oder eine Community-Edition verfuegbar ist.'
  UNION ALL SELECT 'databases', 'pricing_fit', 'billing_currency', 'Billing in EUR available', 'Abrechnung in EUR verfuegbar', 'boolean', 'informational', 'optional', 8030, 'Whether billing in euros is available.', 'Ob eine Abrechnung in Euro verfuegbar ist.'
  UNION ALL SELECT 'databases', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'Common user profiles the database is well suited for.', 'Typische Nutzerprofile, fuer die die Datenbank gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'databases' AS category_id, 'database_type' AS criterion_key, 'relational' AS option_key, 'Relational' AS label_en, 'Relational' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'databases', 'database_type', 'document', 'Document', 'Dokument', 'neutral', 20
  UNION ALL SELECT 'databases', 'database_type', 'key_value', 'Key-value', 'Schluessel-Wert', 'neutral', 30
  UNION ALL SELECT 'databases', 'database_type', 'wide_column', 'Wide-column', 'Wide-Column', 'neutral', 40
  UNION ALL SELECT 'databases', 'database_type', 'graph', 'Graph', 'Graph', 'neutral', 50
  UNION ALL SELECT 'databases', 'database_type', 'time_series', 'Time-series', 'Zeitreihe', 'neutral', 60
  UNION ALL SELECT 'databases', 'database_type', 'multi_model', 'Multi-model', 'Multi-Modell', 'neutral', 70
  UNION ALL SELECT 'databases', 'sql_compatibility', 'full_sql', 'Full SQL', 'Volles SQL', 'neutral', 10
  UNION ALL SELECT 'databases', 'sql_compatibility', 'postgresql_wire', 'PostgreSQL wire-compatible', 'PostgreSQL-Drahtprotokoll-kompatibel', 'positive', 20
  UNION ALL SELECT 'databases', 'sql_compatibility', 'mysql_wire', 'MySQL wire-compatible', 'MySQL-Drahtprotokoll-kompatibel', 'positive', 30
  UNION ALL SELECT 'databases', 'sql_compatibility', 'sql_like', 'SQL-like dialect', 'SQL-aehnlicher Dialekt', 'neutral', 40
  UNION ALL SELECT 'databases', 'sql_compatibility', 'no_sql', 'No SQL interface', 'Keine SQL-Schnittstelle', 'neutral', 50
  UNION ALL SELECT 'databases', 'replication_model', 'single_node', 'Single node', 'Einzelknoten', 'neutral', 10
  UNION ALL SELECT 'databases', 'replication_model', 'primary_replica', 'Primary-replica', 'Primaer-Replikat', 'neutral', 20
  UNION ALL SELECT 'databases', 'replication_model', 'multi_primary', 'Multi-primary', 'Multi-Primaer', 'neutral', 30
  UNION ALL SELECT 'databases', 'replication_model', 'consensus_based', 'Consensus-based (Raft/Paxos)', 'Konsensbasiert (Raft/Paxos)', 'neutral', 40
  UNION ALL SELECT 'databases', 'backup_tooling', 'native_comprehensive', 'Native comprehensive', 'Nativ umfassend', 'positive', 10
  UNION ALL SELECT 'databases', 'backup_tooling', 'native_basic', 'Native basic', 'Nativ grundlegend', 'neutral', 20
  UNION ALL SELECT 'databases', 'backup_tooling', 'third_party_required', 'Third-party required', 'Drittanbieter erforderlich', 'neutral', 30
  UNION ALL SELECT 'databases', 'backup_tooling', 'cloud_managed_only', 'Cloud-managed only', 'Nur cloudverwaltet', 'neutral', 40
  UNION ALL SELECT 'databases', 'upgrade_path', 'in_place', 'In-place upgrade', 'In-Place-Upgrade', 'positive', 10
  UNION ALL SELECT 'databases', 'upgrade_path', 'rolling', 'Rolling upgrade', 'Rollierendes Upgrade', 'positive', 20
  UNION ALL SELECT 'databases', 'upgrade_path', 'migration_required', 'Migration required', 'Migration erforderlich', 'tradeoff', 30
  UNION ALL SELECT 'databases', 'upgrade_path', 'rebuild_required', 'Rebuild required', 'Neuaufbau erforderlich', 'warning', 40
  UNION ALL SELECT 'databases', 'compliance_certifications', 'iso_27001', 'ISO 27001', 'ISO 27001', 'positive', 10
  UNION ALL SELECT 'databases', 'compliance_certifications', 'soc2', 'SOC 2', 'SOC 2', 'neutral', 20
  UNION ALL SELECT 'databases', 'compliance_certifications', 'bsi_c5', 'BSI C5', 'BSI C5', 'positive', 30
  UNION ALL SELECT 'databases', 'compliance_certifications', 'hipaa', 'HIPAA', 'HIPAA', 'neutral', 40
  UNION ALL SELECT 'databases', 'compliance_certifications', 'pci_dss', 'PCI DSS', 'PCI DSS', 'neutral', 50
  UNION ALL SELECT 'databases', 'authentication_methods', 'password', 'Password', 'Passwort', 'neutral', 10
  UNION ALL SELECT 'databases', 'authentication_methods', 'certificate', 'Certificate / mTLS', 'Zertifikat / mTLS', 'positive', 20
  UNION ALL SELECT 'databases', 'authentication_methods', 'ldap', 'LDAP / Active Directory', 'LDAP / Active Directory', 'neutral', 30
  UNION ALL SELECT 'databases', 'authentication_methods', 'kerberos', 'Kerberos', 'Kerberos', 'neutral', 40
  UNION ALL SELECT 'databases', 'authentication_methods', 'iam_integration', 'Cloud IAM integration', 'Cloud-IAM-Integration', 'neutral', 50
  UNION ALL SELECT 'databases', 'client_library_languages', 'java', 'Java / JVM', 'Java / JVM', 'neutral', 10
  UNION ALL SELECT 'databases', 'client_library_languages', 'python', 'Python', 'Python', 'neutral', 20
  UNION ALL SELECT 'databases', 'client_library_languages', 'javascript', 'JavaScript / Node.js', 'JavaScript / Node.js', 'neutral', 30
  UNION ALL SELECT 'databases', 'client_library_languages', 'go', 'Go', 'Go', 'neutral', 40
  UNION ALL SELECT 'databases', 'client_library_languages', 'rust', 'Rust', 'Rust', 'neutral', 50
  UNION ALL SELECT 'databases', 'client_library_languages', 'csharp', 'C# / .NET', 'C# / .NET', 'neutral', 60
  UNION ALL SELECT 'databases', 'client_library_languages', 'php', 'PHP', 'PHP', 'neutral', 70
  UNION ALL SELECT 'databases', 'client_library_languages', 'ruby', 'Ruby', 'Ruby', 'neutral', 80
  UNION ALL SELECT 'databases', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 10
  UNION ALL SELECT 'databases', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'databases', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 30
  UNION ALL SELECT 'databases', 'supported_platforms', 'docker', 'Docker', 'Docker', 'neutral', 40
  UNION ALL SELECT 'databases', 'supported_platforms', 'kubernetes', 'Kubernetes', 'Kubernetes', 'neutral', 50
  UNION ALL SELECT 'databases', 'supported_platforms', 'cloud_only', 'Cloud-managed only', 'Nur cloudverwaltet', 'neutral', 60
  UNION ALL SELECT 'databases', 'source_model', 'open_source', 'Open source', 'Quelloffen', 'positive', 10
  UNION ALL SELECT 'databases', 'source_model', 'source_available', 'Source available', 'Quelleinsehbar', 'neutral', 20
  UNION ALL SELECT 'databases', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 30
  UNION ALL SELECT 'databases', 'source_model', 'open_core', 'Open core', 'Open Core', 'tradeoff', 40
  UNION ALL SELECT 'databases', 'license_type', 'apache', 'Apache 2.0', 'Apache 2.0', 'neutral', 10
  UNION ALL SELECT 'databases', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 20
  UNION ALL SELECT 'databases', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 30
  UNION ALL SELECT 'databases', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 40
  UNION ALL SELECT 'databases', 'license_type', 'bsl', 'Business Source License', 'Business Source License', 'tradeoff', 50
  UNION ALL SELECT 'databases', 'license_type', 'sspl', 'Server Side Public License', 'Server Side Public License', 'tradeoff', 60
  UNION ALL SELECT 'databases', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 70
  UNION ALL SELECT 'databases', 'license_type', 'other_osi', 'Other OSI-approved', 'Andere OSI-genehmigte', 'neutral', 80
  UNION ALL SELECT 'databases', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'databases', 'pricing_model', 'freemium', 'Freemium / community edition', 'Freemium / Community-Edition', 'neutral', 20
  UNION ALL SELECT 'databases', 'pricing_model', 'pay_per_use', 'Pay per use', 'Nutzungsbasiert', 'neutral', 30
  UNION ALL SELECT 'databases', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 40
  UNION ALL SELECT 'databases', 'pricing_model', 'enterprise_custom', 'Enterprise custom', 'Individuell fuer Unternehmen', 'neutral', 50
  UNION ALL SELECT 'databases', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 10
  UNION ALL SELECT 'databases', 'fit_profiles', 'startup', 'Startup', 'Startup', 'neutral', 20
  UNION ALL SELECT 'databases', 'fit_profiles', 'small_business', 'Small business', 'Kleinunternehmen', 'neutral', 30
  UNION ALL SELECT 'databases', 'fit_profiles', 'enterprise', 'Enterprise', 'Grossunternehmen', 'neutral', 40
  UNION ALL SELECT 'databases', 'fit_profiles', 'data_analyst', 'Data analyst', 'Datenanalyst', 'neutral', 50
  UNION ALL SELECT 'databases', 'fit_profiles', 'iot', 'IoT / edge', 'IoT / Edge', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'databases'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'databases'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('028-databases-matrix-criteria');
