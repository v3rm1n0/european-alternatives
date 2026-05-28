-- Migration 030: Define Smart Home category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('smart-home', 'protocols_connectivity', 'Protocols & Connectivity', 'Protokolle & Konnektivität', 'Supported communication protocols and connectivity standards.', 'Unterstützte Kommunikationsprotokolle und Konnektivitätsstandards.', 100),
  ('smart-home', 'local_control_architecture', 'Local Control & Architecture', 'Lokale Steuerung & Architektur', 'Local operation capabilities, cloud dependency, and system architecture.', 'Lokale Betriebsfähigkeiten, Cloud-Abhängigkeit und Systemarchitektur.', 200),
  ('smart-home', 'automation_scenes', 'Automation & Scenes', 'Automatisierung & Szenen', 'Automation engines, scene management, and scheduling features.', 'Automatisierungs-Engines, Szenenverwaltung und Zeitplanungsfunktionen.', 300),
  ('smart-home', 'privacy_data', 'Privacy & Data', 'Privatsphäre & Daten', 'Data processing, telemetry controls, and privacy features.', 'Datenverarbeitung, Telemetriesteuerung und Datenschutzfunktionen.', 400),
  ('smart-home', 'openness_extensibility', 'Openness & Extensibility', 'Offenheit & Erweiterbarkeit', 'Source code model, licensing, integrations, and extensibility options.', 'Quellcode-Modell, Lizenzierung, Integrationen und Erweiterungsmöglichkeiten.', 500),
  ('smart-home', 'voice_assistant_ui', 'Voice Assistant & UI', 'Sprachassistent & Benutzeroberfläche', 'Voice assistant support, mobile apps, and dashboard features.', 'Sprachassistent-Unterstützung, mobile Apps und Dashboard-Funktionen.', 600),
  ('smart-home', 'hardware_deployment', 'Hardware & Deployment', 'Hardware & Bereitstellung', 'Hub hardware requirements, supported platforms, and backup options.', 'Hub-Hardware-Anforderungen, unterstützte Plattformen und Sicherungsoptionen.', 700),
  ('smart-home', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, subscription requirements, and target user profiles.', 'Preismodell, Abonnementanforderungen und Zielgruppen-Eignung.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'smart-home' AS category_id, 'protocols_connectivity' AS group_key, 'supported_protocols' AS criterion_key, 'Supported protocols' AS label_en, 'Unterstützte Protokolle' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Which communication protocols the platform supports.' AS help_text_en, 'Welche Kommunikationsprotokolle die Plattform unterstützt.' AS help_text_de
  UNION ALL SELECT 'smart-home', 'protocols_connectivity', 'matter_support', 'Matter support', 'Matter-Unterstützung', 'boolean', 'beneficial', 'optional', 1020, 'Whether the platform supports the Matter smart home standard.', 'Ob die Plattform den Matter-Smart-Home-Standard unterstützt.'
  UNION ALL SELECT 'smart-home', 'protocols_connectivity', 'thread_border_router', 'Thread border router', 'Thread-Border-Router', 'boolean', 'beneficial', 'optional', 1030, 'Whether the hub can act as a Thread border router.', 'Ob der Hub als Thread-Border-Router fungieren kann.'
  UNION ALL SELECT 'smart-home', 'protocols_connectivity', 'local_network_protocol', 'Local network protocol', 'Lokales Netzwerkprotokoll', 'enum', 'informational', 'optional', 1040, 'The network topology used for local device communication.', 'Die Netzwerktopologie für die lokale Gerätekommunikation.'
  UNION ALL SELECT 'smart-home', 'local_control_architecture', 'local_only_operation', 'Local-only operation', 'Nur-lokal-Betrieb', 'boolean', 'beneficial', 'must_match', 2010, 'Whether the system can operate entirely without cloud connectivity.', 'Ob das System vollständig ohne Cloud-Anbindung betrieben werden kann.'
  UNION ALL SELECT 'smart-home', 'local_control_architecture', 'cloud_dependency_level', 'Cloud dependency level', 'Cloud-Abhängigkeitsstufe', 'enum', 'tradeoff', 'optional', 2020, 'How much the platform depends on cloud services for core functionality.', 'Wie stark die Plattform für Kernfunktionen von Cloud-Diensten abhängt.'
  UNION ALL SELECT 'smart-home', 'local_control_architecture', 'self_hosting_available', 'Self-hosting available', 'Selbst-Hosting verfügbar', 'boolean', 'tradeoff', 'optional', 2030, 'Whether the platform can be self-hosted on user-owned hardware.', 'Ob die Plattform auf eigener Hardware selbst gehostet werden kann.'
  UNION ALL SELECT 'smart-home', 'local_control_architecture', 'network_architecture', 'Network architecture', 'Netzwerkarchitektur', 'enum', 'informational', 'optional', 2040, 'The system architecture for managing connected devices.', 'Die Systemarchitektur für die Verwaltung verbundener Geräte.'
  UNION ALL SELECT 'smart-home', 'local_control_architecture', 'offline_automation_execution', 'Offline automation execution', 'Offline-Automatisierungsausführung', 'boolean', 'beneficial', 'optional', 2050, 'Whether automations continue to execute when the internet is offline.', 'Ob Automatisierungen weiterlaufen, wenn das Internet offline ist.'
  UNION ALL SELECT 'smart-home', 'automation_scenes', 'automation_engine_type', 'Automation engine type', 'Automatisierungs-Engine-Typ', 'enum', 'informational', 'optional', 3010, 'The type of automation engine used for creating rules and routines.', 'Der Typ der Automatisierungs-Engine für die Erstellung von Regeln und Routinen.'
  UNION ALL SELECT 'smart-home', 'automation_scenes', 'scene_support', 'Scene support', 'Szenenunterstützung', 'boolean', 'informational', 'optional', 3020, 'Whether predefined scenes for controlling multiple devices are supported.', 'Ob vordefinierte Szenen zur Steuerung mehrerer Geräte unterstützt werden.'
  UNION ALL SELECT 'smart-home', 'automation_scenes', 'conditional_logic', 'Conditional logic', 'Bedingte Logik', 'boolean', 'informational', 'optional', 3030, 'Whether automations support conditional logic such as if-then rules.', 'Ob Automatisierungen bedingte Logik wie Wenn-Dann-Regeln unterstützen.'
  UNION ALL SELECT 'smart-home', 'automation_scenes', 'scheduling_support', 'Scheduling support', 'Zeitplanunterstützung', 'boolean', 'informational', 'optional', 3040, 'Whether time-based scheduling of automations is available.', 'Ob zeitbasierte Planung von Automatisierungen verfügbar ist.'
  UNION ALL SELECT 'smart-home', 'automation_scenes', 'energy_monitoring', 'Energy monitoring', 'Energieüberwachung', 'boolean', 'informational', 'optional', 3050, 'Whether energy consumption monitoring and reporting is supported.', 'Ob Energieverbrauchsüberwachung und -berichterstattung unterstützt wird.'
  UNION ALL SELECT 'smart-home', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 4010, 'Where user and device data is primarily processed.', 'Wo Benutzer- und Gerätedaten vorrangig verarbeitet werden.'
  UNION ALL SELECT 'smart-home', 'privacy_data', 'telemetry_opt_out', 'Telemetry opt-out', 'Telemetrie-Abmeldung', 'boolean', 'beneficial', 'optional', 4020, 'Whether users can opt out of telemetry and usage data collection.', 'Ob Benutzer die Telemetrie- und Nutzungsdatenerfassung abschalten können.'
  UNION ALL SELECT 'smart-home', 'privacy_data', 'account_requirement', 'Account requirement', 'Kontoanforderung', 'enum', 'tradeoff', 'optional', 4030, 'Whether a cloud account is required to use the platform.', 'Ob ein Cloud-Konto erforderlich ist, um die Plattform zu nutzen.'
  UNION ALL SELECT 'smart-home', 'privacy_data', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfügbar', 'boolean', 'informational', 'optional', 4040, 'Whether a GDPR-compliant data processing agreement is available.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag verfügbar ist.'
  UNION ALL SELECT 'smart-home', 'privacy_data', 'data_export', 'Data export', 'Datenexport', 'boolean', 'beneficial', 'optional', 4050, 'Whether users can export their data in a portable format.', 'Ob Benutzer ihre Daten in einem portablen Format exportieren können.'
  UNION ALL SELECT 'smart-home', 'openness_extensibility', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 5010, 'Whether the source code is open source, source available, or proprietary.', 'Ob der Quellcode quelloffen, quelleinsehbar oder proprietär ist.'
  UNION ALL SELECT 'smart-home', 'openness_extensibility', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 5020, 'The software license under which the product is distributed.', 'Die Softwarelizenz, unter der das Produkt vertrieben wird.'
  UNION ALL SELECT 'smart-home', 'openness_extensibility', 'third_party_integrations', 'Third-party integrations', 'Drittanbieter-Integrationen', 'multi_enum', 'informational', 'multi_select', 5030, 'Which third-party platforms and services can be integrated.', 'Welche Drittanbieter-Plattformen und -Dienste integriert werden können.'
  UNION ALL SELECT 'smart-home', 'openness_extensibility', 'api_available', 'API available', 'API verfügbar', 'boolean', 'beneficial', 'optional', 5040, 'Whether an API is available for custom integrations and development.', 'Ob eine API für individuelle Integrationen und Entwicklung verfügbar ist.'
  UNION ALL SELECT 'smart-home', 'openness_extensibility', 'custom_device_support', 'Custom device support', 'Unterstützung eigener Geräte', 'boolean', 'tradeoff', 'optional', 5050, 'Whether custom or DIY devices can be added to the platform.', 'Ob eigene oder selbstgebaute Geräte zur Plattform hinzugefügt werden können.'
  UNION ALL SELECT 'smart-home', 'openness_extensibility', 'plugin_addon_system', 'Plugin / add-on system', 'Plugin- / Add-on-System', 'boolean', 'beneficial', 'optional', 5060, 'Whether a plugin or add-on system for extending functionality exists.', 'Ob ein Plugin- oder Add-on-System zur Funktionserweiterung vorhanden ist.'
  UNION ALL SELECT 'smart-home', 'voice_assistant_ui', 'voice_assistant_support', 'Voice assistant support', 'Sprachassistent-Unterstützung', 'multi_enum', 'informational', 'multi_select', 6010, 'Which voice assistants are supported for voice control.', 'Welche Sprachassistenten für die Sprachsteuerung unterstützt werden.'
  UNION ALL SELECT 'smart-home', 'voice_assistant_ui', 'mobile_app', 'Mobile app', 'Mobile App', 'multi_enum', 'informational', 'multi_select', 6020, 'Which mobile platforms are supported with a native app.', 'Welche mobilen Plattformen mit einer nativen App unterstützt werden.'
  UNION ALL SELECT 'smart-home', 'voice_assistant_ui', 'web_dashboard', 'Web dashboard', 'Web-Dashboard', 'boolean', 'beneficial', 'optional', 6030, 'Whether a web-based dashboard for managing the smart home is available.', 'Ob ein webbasiertes Dashboard zur Verwaltung des Smart Home verfügbar ist.'
  UNION ALL SELECT 'smart-home', 'voice_assistant_ui', 'dashboard_customization', 'Dashboard customization', 'Dashboard-Anpassung', 'boolean', 'informational', 'optional', 6040, 'Whether the dashboard can be customized with widgets and layouts.', 'Ob das Dashboard mit Widgets und Layouts angepasst werden kann.'
  UNION ALL SELECT 'smart-home', 'hardware_deployment', 'hub_hardware_required', 'Hub hardware required', 'Hub-Hardware erforderlich', 'enum', 'tradeoff', 'optional', 7010, 'Whether dedicated hub hardware is required or generic hardware can be used.', 'Ob dedizierte Hub-Hardware erforderlich ist oder generische Hardware verwendet werden kann.'
  UNION ALL SELECT 'smart-home', 'hardware_deployment', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 7020, 'Which hardware platforms the smart home software can run on.', 'Auf welchen Hardware-Plattformen die Smart-Home-Software laufen kann.'
  UNION ALL SELECT 'smart-home', 'hardware_deployment', 'wireless_standard', 'Wireless standard', 'Funkstandard', 'multi_enum', 'informational', 'multi_select', 7030, 'Which wireless radio standards are supported for device connectivity.', 'Welche drahtlosen Funkstandards für die Geräteverbindung unterstützt werden.'
  UNION ALL SELECT 'smart-home', 'hardware_deployment', 'backup_and_restore', 'Backup and restore', 'Sicherung und Wiederherstellung', 'boolean', 'beneficial', 'optional', 7040, 'Whether configuration backup and restore functionality is available.', 'Ob Konfigurations-Sicherung und -Wiederherstellung verfügbar ist.'
  UNION ALL SELECT 'smart-home', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'The pricing model used by the platform.', 'Das von der Plattform verwendete Preismodell.'
  UNION ALL SELECT 'smart-home', 'pricing_fit', 'subscription_required_for_core', 'Subscription required for core features', 'Abonnement für Kernfunktionen erforderlich', 'boolean', 'risk', 'optional', 8020, 'Whether a paid subscription is required to use core smart home features.', 'Ob ein kostenpflichtiges Abonnement für die Nutzung der Smart-Home-Kernfunktionen erforderlich ist.'
  UNION ALL SELECT 'smart-home', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8030, 'Common user profiles the smart home platform is well suited for.', 'Typische Nutzerprofile, für die die Smart-Home-Plattform gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'smart-home' AS category_id, 'supported_protocols' AS criterion_key, 'matter' AS option_key, 'Matter' AS label_en, 'Matter' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'smart-home', 'supported_protocols', 'zigbee', 'Zigbee', 'Zigbee', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'supported_protocols', 'z_wave', 'Z-Wave', 'Z-Wave', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'supported_protocols', 'wifi', 'Wi-Fi', 'WLAN', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'supported_protocols', 'bluetooth_ble', 'Bluetooth / BLE', 'Bluetooth / BLE', 'neutral', 50
  UNION ALL SELECT 'smart-home', 'supported_protocols', 'thread', 'Thread', 'Thread', 'neutral', 60
  UNION ALL SELECT 'smart-home', 'supported_protocols', 'knx', 'KNX', 'KNX', 'neutral', 70
  UNION ALL SELECT 'smart-home', 'supported_protocols', 'enocean', 'EnOcean', 'EnOcean', 'neutral', 80
  UNION ALL SELECT 'smart-home', 'local_network_protocol', 'direct', 'Direct (point-to-point)', 'Direkt (Punkt-zu-Punkt)', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'local_network_protocol', 'mesh', 'Mesh network', 'Mesh-Netzwerk', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'local_network_protocol', 'star', 'Star topology', 'Stern-Topologie', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'cloud_dependency_level', 'required', 'Cloud required', 'Cloud erforderlich', 'warning', 10
  UNION ALL SELECT 'smart-home', 'cloud_dependency_level', 'optional', 'Cloud optional', 'Cloud optional', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'cloud_dependency_level', 'none', 'No cloud dependency', 'Keine Cloud-Abhängigkeit', 'positive', 30
  UNION ALL SELECT 'smart-home', 'network_architecture', 'central_hub', 'Central hub', 'Zentrale Steuereinheit', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'network_architecture', 'distributed', 'Distributed', 'Verteilt', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'network_architecture', 'software_only', 'Software only', 'Nur Software', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'automation_engine_type', 'visual_block', 'Visual / block-based', 'Visuell / blockbasiert', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'automation_engine_type', 'scripting_yaml', 'Scripting / YAML', 'Scripting / YAML', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'automation_engine_type', 'rule_based', 'Rule-based', 'Regelbasiert', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'automation_engine_type', 'node_based', 'Node-based (flow editor)', 'Knotenbasiert (Flow-Editor)', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'smart-home', 'data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primär, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'smart-home', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 40
  UNION ALL SELECT 'smart-home', 'account_requirement', 'required', 'Account required', 'Konto erforderlich', 'warning', 10
  UNION ALL SELECT 'smart-home', 'account_requirement', 'optional', 'Account optional', 'Konto optional', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'account_requirement', 'not_needed', 'No account needed', 'Kein Konto nötig', 'positive', 30
  UNION ALL SELECT 'smart-home', 'source_code_model', 'open_source', 'Open source', 'Quelloffen', 'positive', 10
  UNION ALL SELECT 'smart-home', 'source_code_model', 'source_available', 'Source available', 'Quelleinsehbar', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 30
  UNION ALL SELECT 'smart-home', 'source_code_model', 'open_core', 'Open core', 'Open Core', 'tradeoff', 40
  UNION ALL SELECT 'smart-home', 'license_type', 'apache', 'Apache 2.0', 'Apache 2.0', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 50
  UNION ALL SELECT 'smart-home', 'license_type', 'other_osi', 'Other OSI-approved', 'Andere OSI-genehmigte', 'neutral', 60
  UNION ALL SELECT 'smart-home', 'third_party_integrations', 'home_assistant', 'Home Assistant', 'Home Assistant', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'third_party_integrations', 'alexa', 'Amazon Alexa', 'Amazon Alexa', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'third_party_integrations', 'google_home', 'Google Home', 'Google Home', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'third_party_integrations', 'apple_homekit', 'Apple HomeKit', 'Apple HomeKit', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'third_party_integrations', 'ifttt', 'IFTTT', 'IFTTT', 'neutral', 50
  UNION ALL SELECT 'smart-home', 'third_party_integrations', 'mqtt', 'MQTT', 'MQTT', 'neutral', 60
  UNION ALL SELECT 'smart-home', 'third_party_integrations', 'node_red', 'Node-RED', 'Node-RED', 'neutral', 70
  UNION ALL SELECT 'smart-home', 'voice_assistant_support', 'alexa', 'Amazon Alexa', 'Amazon Alexa', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'voice_assistant_support', 'google_assistant', 'Google Assistant', 'Google Assistant', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'voice_assistant_support', 'siri_homekit', 'Siri / HomeKit', 'Siri / HomeKit', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'voice_assistant_support', 'local_only', 'Local-only voice', 'Nur lokale Sprache', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'voice_assistant_support', 'none', 'None', 'Keine', 'neutral', 50
  UNION ALL SELECT 'smart-home', 'mobile_app', 'ios', 'iOS', 'iOS', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'mobile_app', 'android', 'Android', 'Android', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'hub_hardware_required', 'dedicated_hub', 'Dedicated hub required', 'Dedizierter Hub erforderlich', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'hub_hardware_required', 'generic_hardware', 'Generic hardware (RPi, NUC)', 'Generische Hardware (RPi, NUC)', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'hub_hardware_required', 'software_only', 'Software only', 'Nur Software', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'supported_platforms', 'raspberry_pi', 'Raspberry Pi', 'Raspberry Pi', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'supported_platforms', 'x86_docker', 'x86 / Docker', 'x86 / Docker', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'supported_platforms', 'nas', 'NAS (Synology, QNAP)', 'NAS (Synology, QNAP)', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'supported_platforms', 'dedicated_appliance', 'Dedicated appliance', 'Dediziertes Gerät', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'wireless_standard', 'built_in_zigbee', 'Built-in Zigbee radio', 'Eingebauter Zigbee-Funk', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'wireless_standard', 'built_in_z_wave', 'Built-in Z-Wave radio', 'Eingebauter Z-Wave-Funk', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'wireless_standard', 'usb_dongle', 'USB dongle required', 'USB-Dongle erforderlich', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'wireless_standard', 'ip_only', 'IP-based only (Wi-Fi/Ethernet)', 'Nur IP-basiert (WLAN/Ethernet)', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'pricing_model', 'free_open_source', 'Free / open source', 'Kostenlos / quelloffen', 'positive', 10
  UNION ALL SELECT 'smart-home', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'fit_profiles', 'privacy_focused', 'Privacy-focused user', 'Datenschutzorientierter Nutzer', 'neutral', 10
  UNION ALL SELECT 'smart-home', 'fit_profiles', 'tinkerer_diy', 'Tinkerer / DIY enthusiast', 'Bastler / DIY-Enthusiast', 'neutral', 20
  UNION ALL SELECT 'smart-home', 'fit_profiles', 'family_simple', 'Family / simplicity-first', 'Familie / Einfachheit zuerst', 'neutral', 30
  UNION ALL SELECT 'smart-home', 'fit_profiles', 'professional_installer', 'Professional installer', 'Professioneller Installateur', 'neutral', 40
  UNION ALL SELECT 'smart-home', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 50
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'smart-home'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'smart-home'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('030-smart-home-matrix-criteria');
