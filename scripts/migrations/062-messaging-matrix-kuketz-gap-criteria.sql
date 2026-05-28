-- Migration 062: Add Messaging matrix criteria for Kuketz-scope coverage gaps.

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'messaging' AS category_id, 'platform_access' AS group_key, 'cost_pricing' AS criterion_key, 'Cost/pricing' AS label_en, 'Kosten/Preismodell' AS label_de, 'enum' AS value_type, 'tradeoff' AS semantics, 'optional' AS filter_mode, 2060 AS sort_order, 'The documented consumer or team pricing model for normal use.' AS help_text_en, 'Das dokumentierte Preis- oder Kostenmodell fuer normale Nutzung.' AS help_text_de
  UNION ALL SELECT 'messaging', 'security_privacy', 'post_quantum_encryption', 'Post-quantum encryption', 'Post-Quantum-Verschluesselung', 'boolean', 'beneficial', 'optional', 3080, 'Whether the messenger documents post-quantum or quantum-resistant protection for message encryption.', 'Ob der Messenger Post-Quantum- oder quantenresistente Schutzmechanismen fuer Nachrichtenverschluesselung dokumentiert.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'encryption_protocol_or_library', 'Encryption protocol/library', 'Verschluesselungsprotokoll/-bibliothek', 'text', 'informational', 'none', 3090, 'The named protocol, cryptographic library, or encryption design documented for message protection.', 'Das dokumentierte Protokoll, die Kryptobibliothek oder das Verschluesselungsdesign fuer Nachrichtenschutz.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'proprietary_libraries', 'Proprietary libraries', 'Proprietaere Bibliotheken', 'boolean', 'risk', 'optional', 3100, 'Whether maintained clients include proprietary libraries or closed-source dependencies relevant to privacy or security review.', 'Ob gepflegte Clients proprietaere Bibliotheken oder geschlossene Abhaengigkeiten enthalten, die fuer Datenschutz- oder Sicherheitspruefung relevant sind.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'tracker_or_ad_presence', 'Tracker/ad presence', 'Tracker-/Werbeanteile', 'enum', 'risk', 'optional', 3110, 'Documented presence of third-party trackers, advertising SDKs, behavioral ads, or explicit absence of them.', 'Dokumentierte Anwesenheit von Drittanbieter-Trackern, Werbe-SDKs, verhaltensbasierter Werbung oder deren ausdrueckliche Abwesenheit.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'latest_security_audit_year', 'Latest security audit year', 'Jahr des letzten Sicherheitsaudits', 'number', 'informational', 'range', 3120, 'The most recent year of a documented independent security audit, if one is documented.', 'Das neueste Jahr eines dokumentierten unabhaengigen Sicherheitsaudits, sofern dokumentiert.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'contact_key_change_warning', 'Key-change warning', 'Schluesselaenderungswarnung', 'boolean', 'beneficial', 'optional', 3130, 'Whether users are warned when a contact safety number, identity key, or verified device key changes.', 'Ob Nutzer gewarnt werden, wenn sich Sicherheitsnummer, Identitaetsschluessel oder verifizierter Geraeteschluessel eines Kontakts aendert.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'client_source_openness', 'Client source openness', 'Quelloffenheit der Clients', 'enum', 'beneficial', 'optional', 4060, 'How openly the maintained client applications are licensed and published.', 'Wie offen die gepflegten Client-Anwendungen lizenziert und veroeffentlicht sind.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'server_source_openness', 'Server source openness', 'Quelloffenheit der Server', 'enum', 'beneficial', 'optional', 4070, 'How openly the server-side components are licensed and published, or whether no server is required.', 'Wie offen serverseitige Komponenten lizenziert und veroeffentlicht sind oder ob kein Server erforderlich ist.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'infrastructure_hosting_provider', 'Infrastructure hosting/provider', 'Infrastruktur-Hosting/Provider', 'text', 'informational', 'none', 4080, 'The documented hosting provider, infrastructure operator, or deployment provider used for the default service.', 'Der dokumentierte Hosting-Provider, Infrastrukturbetrieber oder Bereitstellungsanbieter des Standarddienstes.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'legal_jurisdiction', 'Legal jurisdiction', 'Rechtsraum', 'text', 'informational', 'none', 4090, 'The legal/operator jurisdiction relevant to the messenger service or project.', 'Der fuer Messenger-Dienst oder Projekt relevante Rechts- oder Betreiberstandort.'
  UNION ALL SELECT 'messaging', 'backup_export', 'automatic_backup', 'Automatic backup', 'Automatisches Backup', 'boolean', 'tradeoff', 'optional', 8050, 'Whether chat history or account data can be backed up automatically without a manual export step.', 'Ob Chatverlauf oder Kontodaten automatisch ohne manuellen Export gesichert werden koennen.'
  UNION ALL SELECT 'messaging', 'backup_export', 'backup_storage_location', 'Backup storage location', 'Backup-Speicherort', 'enum', 'tradeoff', 'optional', 8060, 'Where documented backups are stored or controlled when backup is available.', 'Wo dokumentierte Backups gespeichert oder kontrolliert werden, wenn Backup verfuegbar ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'messaging' AS category_id, 'cost_pricing' AS criterion_key, 'free' AS option_key, 'Free' AS label_en, 'Kostenlos' AS label_de, 'positive' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'messaging', 'cost_pricing', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'messaging', 'cost_pricing', 'paid', 'Paid', 'Kostenpflichtig', 'tradeoff', 30
  UNION ALL SELECT 'messaging', 'cost_pricing', 'enterprise_only', 'Enterprise only', 'Nur Enterprise', 'warning', 40
  UNION ALL SELECT 'messaging', 'tracker_or_ad_presence', 'no_known_trackers_or_ads', 'No known trackers/ads', 'Keine bekannten Tracker/Werbung', 'positive', 10
  UNION ALL SELECT 'messaging', 'tracker_or_ad_presence', 'first_party_telemetry', 'First-party telemetry', 'Erstanbieter-Telemetrie', 'warning', 20
  UNION ALL SELECT 'messaging', 'tracker_or_ad_presence', 'third_party_trackers', 'Third-party trackers', 'Drittanbieter-Tracker', 'negative', 30
  UNION ALL SELECT 'messaging', 'tracker_or_ad_presence', 'advertising_sdk', 'Advertising SDK', 'Werbe-SDK', 'negative', 40
  UNION ALL SELECT 'messaging', 'tracker_or_ad_presence', 'behavioral_ads', 'Behavioral ads', 'Verhaltensbasierte Werbung', 'negative', 50
  UNION ALL SELECT 'messaging', 'client_source_openness', 'full_open_source', 'Full open source', 'Vollstaendig Open Source', 'positive', 10
  UNION ALL SELECT 'messaging', 'client_source_openness', 'partial_open_source', 'Partially open source', 'Teilweise Open Source', 'tradeoff', 20
  UNION ALL SELECT 'messaging', 'client_source_openness', 'source_available_no_license', 'Source available, unclear license', 'Quellcode verfuegbar, Lizenz unklar', 'warning', 30
  UNION ALL SELECT 'messaging', 'client_source_openness', 'proprietary', 'Proprietary', 'Proprietaer', 'negative', 40
  UNION ALL SELECT 'messaging', 'server_source_openness', 'full_open_source', 'Full open source', 'Vollstaendig Open Source', 'positive', 10
  UNION ALL SELECT 'messaging', 'server_source_openness', 'partial_open_source', 'Partially open source', 'Teilweise Open Source', 'tradeoff', 20
  UNION ALL SELECT 'messaging', 'server_source_openness', 'source_available_no_license', 'Source available, unclear license', 'Quellcode verfuegbar, Lizenz unklar', 'warning', 30
  UNION ALL SELECT 'messaging', 'server_source_openness', 'proprietary', 'Proprietary', 'Proprietaer', 'negative', 40
  UNION ALL SELECT 'messaging', 'server_source_openness', 'no_server_required', 'No server required', 'Kein Server erforderlich', 'positive', 50
  UNION ALL SELECT 'messaging', 'backup_storage_location', 'local_device', 'Local device', 'Lokales Geraet', 'positive', 10
  UNION ALL SELECT 'messaging', 'backup_storage_location', 'user_controlled_cloud', 'User-controlled cloud', 'Nutzerkontrollierte Cloud', 'positive', 20
  UNION ALL SELECT 'messaging', 'backup_storage_location', 'provider_cloud', 'Provider cloud', 'Anbieter-Cloud', 'warning', 30
  UNION ALL SELECT 'messaging', 'backup_storage_location', 'platform_cloud', 'Platform cloud', 'Plattform-Cloud', 'warning', 40
  UNION ALL SELECT 'messaging', 'backup_storage_location', 'self_hosted_server', 'Self-hosted server', 'Selbstgehosteter Server', 'positive', 50
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
 AND ec.`category_id` = 'messaging'
JOIN `matrix_criteria` mc
  ON mc.`category_id` = 'messaging'
WHERE ce.`status` IN ('alternative', 'us')
  AND ce.`is_active` = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('062-messaging-matrix-kuketz-gap-criteria');
