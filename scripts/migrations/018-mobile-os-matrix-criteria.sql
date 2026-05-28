-- Migration 018: Define Mobile Operating Systems category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('mobile-os', 'platform_hardware', 'Platform & Hardware', 'Plattform & Hardware', 'Core platform capabilities including CPU architecture support, device compatibility model, and supported form factors.', 'Kernplattform-Fähigkeiten einschließlich CPU-Architektur-Unterstützung, Gerätekompatibilitätsmodell und unterstützte Formfaktoren.', 100),
  ('mobile-os', 'installation_provisioning', 'Installation & Provisioning', 'Installation & Bereitstellung', 'How the operating system is obtained and installed, including bootloader requirements, installation methods, and carrier activation.', 'Wie das Betriebssystem bezogen und installiert wird, einschließlich Bootloader-Anforderungen, Installationsmethoden und Carrier-Aktivierung.', 200),
  ('mobile-os', 'security_updates', 'Security & Updates', 'Sicherheit & Updates', 'Security posture including update delivery, patch cadence, verified boot, sandboxing, and encryption.', 'Sicherheitslage einschließlich Update-Bereitstellung, Patch-Kadenz, Verified Boot, Sandboxing und Verschlüsselung.', 300),
  ('mobile-os', 'privacy_permissions', 'Privacy & Permissions', 'Datenschutz & Berechtigungen', 'Privacy controls including telemetry defaults, permission granularity, location privacy, advertising ID, and account requirements.', 'Datenschutzkontrollen einschließlich Telemetrie-Standards, Berechtigungsgranularität, Standort-Datenschutz, Werbe-ID und Kontoanforderungen.', 400),
  ('mobile-os', 'app_ecosystem', 'App Ecosystem', 'App-Ökosystem', 'Application availability, distribution model, sideloading policy, compatibility layers, and alternative app stores.', 'Anwendungsverfügbarkeit, Verteilungsmodell, Sideloading-Richtlinie, Kompatibilitätsschichten und alternative App-Stores.', 500),
  ('mobile-os', 'connectivity_telephony', 'Connectivity & Telephony', 'Konnektivität & Telefonie', 'Cellular, wireless, and telephony capabilities including baseband model, VoLTE, eSIM, Bluetooth, and Wi-Fi standards.', 'Mobilfunk-, Drahtlos- und Telefonie-Fähigkeiten einschließlich Baseband-Modell, VoLTE, eSIM, Bluetooth und Wi-Fi-Standards.', 600),
  ('mobile-os', 'user_experience', 'User Experience & Accessibility', 'Nutzererfahrung & Barrierefreiheit', 'User interface customization, accessibility features, multi-user support, and notification architecture.', 'Benutzeroberflächen-Anpassung, Barrierefreiheitsfunktionen, Mehrbenutzer-Unterstützung und Benachrichtigungsarchitektur.', 700),
  ('mobile-os', 'data_portability', 'Data Portability & Backup', 'Datenportabilität & Backup', 'Backup model, encrypted backups, data export, and device-to-device migration support.', 'Backup-Modell, verschlüsselte Backups, Datenexport und Gerät-zu-Gerät-Migrationsunterstützung.', 800),
  ('mobile-os', 'openness_governance', 'Openness, Governance & Fit', 'Offenheit, Governance & Eignung', 'Source code model, governance structure, commercial support availability, and target user fit profiles.', 'Quellcode-Modell, Governance-Struktur, Verfügbarkeit von kommerziellem Support und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'mobile-os' AS category_id, 'platform_hardware' AS group_key, 'supported_cpu_architectures' AS criterion_key, 'Supported CPU architectures' AS label_en, 'Unterstützte CPU-Architekturen' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Processor architectures officially supported by the mobile operating system.' AS help_text_en, 'Offiziell vom mobilen Betriebssystem unterstützte Prozessorarchitekturen.' AS help_text_de
  UNION ALL SELECT 'mobile-os', 'platform_hardware', 'device_compatibility_model', 'Device compatibility model', 'Gerätekompatibilitätsmodell', 'enum', 'tradeoff', 'optional', 1020, 'Whether the OS is locked to specific devices or supports generic hardware.', 'Ob das Betriebssystem an bestimmte Geräte gebunden ist oder generische Hardware unterstützt.'
  UNION ALL SELECT 'mobile-os', 'platform_hardware', 'minimum_ram_gb', 'Minimum RAM (GB)', 'Minimaler RAM (GB)', 'number', 'informational', 'range', 1030, 'The documented minimum RAM requirement in gigabytes.', 'Die dokumentierte Mindest-RAM-Anforderung in Gigabyte.'
  UNION ALL SELECT 'mobile-os', 'platform_hardware', 'supported_device_form_factors', 'Supported device form factors', 'Unterstützte Geräteformfaktoren', 'multi_enum', 'informational', 'multi_select', 1040, 'Device form factors supported by the operating system.', 'Vom Betriebssystem unterstützte Geräteformfaktoren.'
  UNION ALL SELECT 'mobile-os', 'installation_provisioning', 'bootloader_unlock_required', 'Bootloader unlock required', 'Bootloader-Entsperrung erforderlich', 'boolean', 'tradeoff', 'optional', 2010, 'Whether unlocking the bootloader is required to install the operating system.', 'Ob das Entsperren des Bootloaders erforderlich ist, um das Betriebssystem zu installieren.'
  UNION ALL SELECT 'mobile-os', 'installation_provisioning', 'installation_method', 'Installation method', 'Installationsmethode', 'multi_enum', 'informational', 'multi_select', 2020, 'Methods available for installing the operating system on a device.', 'Verfügbare Methoden zur Installation des Betriebssystems auf einem Gerät.'
  UNION ALL SELECT 'mobile-os', 'installation_provisioning', 'carrier_activation_support', 'Carrier activation support', 'Carrier-Aktivierungsunterstützung', 'enum', 'tradeoff', 'optional', 2030, 'Whether the OS supports carrier provisioning and activation workflows.', 'Ob das Betriebssystem Carrier-Bereitstellungs- und Aktivierungs-Workflows unterstützt.'
  UNION ALL SELECT 'mobile-os', 'installation_provisioning', 'factory_image_available', 'Factory image available', 'Werksabbild verfügbar', 'boolean', 'beneficial', 'optional', 2040, 'Whether official factory images are available for restoring the device to a known-good state.', 'Ob offizielle Werksabbilder verfügbar sind, um das Gerät in einen bekannten guten Zustand zurückzusetzen.'
  UNION ALL SELECT 'mobile-os', 'security_updates', 'security_update_cadence', 'Security update cadence', 'Sicherheitsupdate-Kadenz', 'enum', 'beneficial', 'must_match', 3010, 'How frequently security patches are released by the vendor.', 'Wie häufig Sicherheitspatches vom Anbieter veröffentlicht werden.'
  UNION ALL SELECT 'mobile-os', 'security_updates', 'update_delivery_model', 'Update delivery model', 'Update-Bereitstellungsmodell', 'enum', 'tradeoff', 'optional', 3020, 'How operating system updates are delivered to end-user devices.', 'Wie Betriebssystem-Updates an Endgeräte ausgeliefert werden.'
  UNION ALL SELECT 'mobile-os', 'security_updates', 'verified_boot', 'Verified boot', 'Verified Boot', 'boolean', 'beneficial', 'optional', 3030, 'Whether the OS supports a verified boot chain to ensure system integrity.', 'Ob das Betriebssystem eine verifizierte Boot-Kette zur Sicherstellung der Systemintegrität unterstützt.'
  UNION ALL SELECT 'mobile-os', 'security_updates', 'application_sandboxing', 'Application sandboxing', 'Anwendungssandboxing', 'enum', 'beneficial', 'optional', 3040, 'The application isolation and sandboxing model used by the operating system.', 'Das Anwendungsisolations- und Sandboxing-Modell des Betriebssystems.'
  UNION ALL SELECT 'mobile-os', 'security_updates', 'full_disk_encryption_default', 'Full-disk encryption default', 'Vollverschlüsselung-Standard', 'enum', 'beneficial', 'optional', 3050, 'Whether full-disk encryption is enabled by default on the device.', 'Ob die Vollverschlüsselung standardmäßig auf dem Gerät aktiviert ist.'
  UNION ALL SELECT 'mobile-os', 'security_updates', 'biometric_authentication', 'Biometric authentication', 'Biometrische Authentifizierung', 'multi_enum', 'informational', 'multi_select', 3060, 'Biometric authentication methods supported by the operating system.', 'Vom Betriebssystem unterstützte biometrische Authentifizierungsmethoden.'
  UNION ALL SELECT 'mobile-os', 'privacy_permissions', 'telemetry_default', 'Telemetry default', 'Telemetrie-Standard', 'enum', 'risk', 'must_match', 4010, 'The default telemetry and data collection level when the operating system is first used.', 'Das Standard-Telemetrie- und Datenerfassungsniveau bei der ersten Nutzung des Betriebssystems.'
  UNION ALL SELECT 'mobile-os', 'privacy_permissions', 'telemetry_opt_out', 'Telemetry opt-out', 'Telemetrie-Opt-out', 'enum', 'beneficial', 'optional', 4020, 'Whether and how telemetry can be reduced or fully disabled by the user.', 'Ob und wie Telemetrie vom Nutzer reduziert oder vollständig deaktiviert werden kann.'
  UNION ALL SELECT 'mobile-os', 'privacy_permissions', 'permission_granularity', 'Permission granularity', 'Berechtigungsgranularität', 'enum', 'tradeoff', 'optional', 4030, 'The level of fine-grained control over individual app permissions.', 'Der Grad der feingranularen Kontrolle über einzelne App-Berechtigungen.'
  UNION ALL SELECT 'mobile-os', 'privacy_permissions', 'location_privacy_controls', 'Location privacy controls', 'Standort-Datenschutzkontrollen', 'multi_enum', 'beneficial', 'multi_select', 4040, 'Available controls for managing location data access by apps and the system.', 'Verfügbare Kontrollen zur Verwaltung des Standortdatenzugriffs durch Apps und das System.'
  UNION ALL SELECT 'mobile-os', 'privacy_permissions', 'advertising_id_controls', 'Advertising ID controls', 'Werbe-ID-Kontrollen', 'enum', 'beneficial', 'optional', 4050, 'Controls available for managing the device advertising identifier.', 'Verfügbare Kontrollen zur Verwaltung der Geräte-Werbe-ID.'
  UNION ALL SELECT 'mobile-os', 'privacy_permissions', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 4060, 'Whether an online account is required for basic usage of the operating system.', 'Ob ein Online-Konto für die grundlegende Nutzung des Betriebssystems erforderlich ist.'
  UNION ALL SELECT 'mobile-os', 'app_ecosystem', 'primary_app_store', 'Primary app store', 'Primärer App-Store', 'enum', 'tradeoff', 'optional', 5010, 'The default or primary app store bundled with the operating system.', 'Der Standard- oder primäre App-Store, der mit dem Betriebssystem ausgeliefert wird.'
  UNION ALL SELECT 'mobile-os', 'app_ecosystem', 'sideloading_support', 'Sideloading support', 'Sideloading-Unterstützung', 'enum', 'tradeoff', 'optional', 5020, 'Whether and how easily apps can be installed from sources outside the primary app store.', 'Ob und wie einfach Apps aus Quellen außerhalb des primären App-Stores installiert werden können.'
  UNION ALL SELECT 'mobile-os', 'app_ecosystem', 'android_app_compatibility', 'Android app compatibility', 'Android-App-Kompatibilität', 'enum', 'informational', 'optional', 5030, 'The level of compatibility with Android applications.', 'Der Grad der Kompatibilität mit Android-Anwendungen.'
  UNION ALL SELECT 'mobile-os', 'app_ecosystem', 'progressive_web_app_support', 'Progressive Web App support', 'Progressive-Web-App-Unterstützung', 'boolean', 'beneficial', 'optional', 5040, 'Whether Progressive Web Apps can be installed and used as first-class applications.', 'Ob Progressive Web Apps als vollwertige Anwendungen installiert und genutzt werden können.'
  UNION ALL SELECT 'mobile-os', 'app_ecosystem', 'app_store_alternatives_allowed', 'App store alternatives allowed', 'Alternative App-Stores erlaubt', 'boolean', 'tradeoff', 'optional', 5050, 'Whether alternative app stores can be installed alongside or instead of the primary store.', 'Ob alternative App-Stores neben oder anstelle des primären Stores installiert werden können.'
  UNION ALL SELECT 'mobile-os', 'connectivity_telephony', 'baseband_firmware_model', 'Baseband firmware model', 'Baseband-Firmware-Modell', 'enum', 'tradeoff', 'optional', 6010, 'Whether the baseband/modem firmware is integrated or separated from the main OS, affecting security isolation.', 'Ob die Baseband-/Modem-Firmware integriert oder vom Haupt-Betriebssystem getrennt ist, mit Auswirkungen auf die Sicherheitsisolierung.'
  UNION ALL SELECT 'mobile-os', 'connectivity_telephony', 'volte_support', 'VoLTE support', 'VoLTE-Unterstützung', 'enum', 'informational', 'optional', 6020, 'The level of Voice over LTE support for modern carrier voice calls.', 'Der Grad der Voice-over-LTE-Unterstützung für moderne Carrier-Sprachanrufe.'
  UNION ALL SELECT 'mobile-os', 'connectivity_telephony', 'esim_support', 'eSIM support', 'eSIM-Unterstützung', 'boolean', 'informational', 'optional', 6030, 'Whether the operating system supports embedded SIM provisioning.', 'Ob das Betriebssystem eingebettete SIM-Bereitstellung unterstützt.'
  UNION ALL SELECT 'mobile-os', 'connectivity_telephony', 'bluetooth_version', 'Bluetooth version', 'Bluetooth-Version', 'enum', 'informational', 'optional', 6040, 'The highest Bluetooth standard version supported by the operating system stack.', 'Die höchste vom Betriebssystem-Stack unterstützte Bluetooth-Standardversion.'
  UNION ALL SELECT 'mobile-os', 'connectivity_telephony', 'wifi_standards', 'Wi-Fi standards supported', 'Unterstützte Wi-Fi-Standards', 'multi_enum', 'informational', 'multi_select', 6050, 'Wi-Fi standards supported by the operating system network stack.', 'Vom Betriebssystem-Netzwerk-Stack unterstützte Wi-Fi-Standards.'
  UNION ALL SELECT 'mobile-os', 'user_experience', 'ui_customization_level', 'UI customization level', 'UI-Anpassungsgrad', 'enum', 'informational', 'optional', 7010, 'The level of user interface customization available to the user.', 'Der Grad der Benutzeroberflächen-Anpassung, der dem Nutzer zur Verfügung steht.'
  UNION ALL SELECT 'mobile-os', 'user_experience', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 7020, 'Built-in accessibility features for users with disabilities.', 'Integrierte Barrierefreiheitsfunktionen für Nutzer mit Behinderungen.'
  UNION ALL SELECT 'mobile-os', 'user_experience', 'multi_user_support', 'Multi-user support', 'Mehrbenutzer-Unterstützung', 'boolean', 'informational', 'optional', 7030, 'Whether the operating system supports multiple user profiles on a single device.', 'Ob das Betriebssystem mehrere Benutzerprofile auf einem Gerät unterstützt.'
  UNION ALL SELECT 'mobile-os', 'user_experience', 'notification_model', 'Notification model', 'Benachrichtigungsmodell', 'enum', 'tradeoff', 'optional', 7040, 'The push notification architecture and its privacy and battery implications.', 'Die Push-Benachrichtigungsarchitektur und ihre Datenschutz- und Akku-Auswirkungen.'
  UNION ALL SELECT 'mobile-os', 'data_portability', 'backup_model', 'Backup model', 'Backup-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The primary backup model supported by the operating system.', 'Das primäre vom Betriebssystem unterstützte Backup-Modell.'
  UNION ALL SELECT 'mobile-os', 'data_portability', 'encrypted_backup_available', 'Encrypted backup available', 'Verschlüsseltes Backup verfügbar', 'boolean', 'beneficial', 'optional', 8020, 'Whether end-to-end encrypted backups are available.', 'Ob Ende-zu-Ende-verschlüsselte Backups verfügbar sind.'
  UNION ALL SELECT 'mobile-os', 'data_portability', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 8030, 'Whether a built-in mechanism exists for exporting user data in a portable format.', 'Ob ein integrierter Mechanismus zum Exportieren von Nutzerdaten in einem portablen Format existiert.'
  UNION ALL SELECT 'mobile-os', 'data_portability', 'device_migration_model', 'Device migration model', 'Gerätemigrationsmodell', 'enum', 'tradeoff', 'optional', 8040, 'The supported method for transferring data when switching to a new device.', 'Die unterstützte Methode zur Datenübertragung beim Wechsel auf ein neues Gerät.'
  UNION ALL SELECT 'mobile-os', 'openness_governance', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The openness model of the operating system source code.', 'Das Offenheitsmodell des Betriebssystem-Quellcodes.'
  UNION ALL SELECT 'mobile-os', 'openness_governance', 'governance_model', 'Governance model', 'Governance-Modell', 'enum', 'informational', 'optional', 9020, 'The organizational and decision-making structure behind the operating system.', 'Die Organisations- und Entscheidungsstruktur hinter dem Betriebssystem.'
  UNION ALL SELECT 'mobile-os', 'openness_governance', 'commercial_support_available', 'Commercial support available', 'Kommerzieller Support verfügbar', 'boolean', 'informational', 'optional', 9030, 'Whether paid professional support contracts or enterprise support tiers are available.', 'Ob bezahlte professionelle Support-Verträge oder Enterprise-Support-Stufen verfügbar sind.'
  UNION ALL SELECT 'mobile-os', 'openness_governance', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Common user profiles or use cases the operating system is well suited for.', 'Typische Nutzerprofile oder Anwendungsfälle, für die das Betriebssystem gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'mobile-os' AS category_id, 'supported_cpu_architectures' AS criterion_key, 'arm64' AS option_key, 'ARM64' AS label_en, 'ARM64' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'mobile-os', 'supported_cpu_architectures', 'arm32', 'ARM32', 'ARM32', 'tradeoff', 20
  UNION ALL SELECT 'mobile-os', 'supported_cpu_architectures', 'x86_64', 'x86_64', 'x86_64', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'supported_cpu_architectures', 'x86_32', 'x86 (32-bit)', 'x86 (32-Bit)', 'tradeoff', 40
  UNION ALL SELECT 'mobile-os', 'supported_cpu_architectures', 'riscv64', 'RISC-V 64', 'RISC-V 64', 'neutral', 50
  UNION ALL SELECT 'mobile-os', 'device_compatibility_model', 'vendor_locked', 'Vendor-locked', 'Herstellergebunden', 'tradeoff', 10
  UNION ALL SELECT 'mobile-os', 'device_compatibility_model', 'device_specific_builds', 'Device-specific builds', 'Gerätespezifische Builds', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'device_compatibility_model', 'generic_hardware', 'Generic hardware', 'Generische Hardware', 'positive', 30
  UNION ALL SELECT 'mobile-os', 'device_compatibility_model', 'pre_installed_only', 'Pre-installed only', 'Nur vorinstalliert', 'tradeoff', 40
  UNION ALL SELECT 'mobile-os', 'supported_device_form_factors', 'smartphone', 'Smartphone', 'Smartphone', 'neutral', 10
  UNION ALL SELECT 'mobile-os', 'supported_device_form_factors', 'tablet', 'Tablet', 'Tablet', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'supported_device_form_factors', 'wearable', 'Wearable', 'Wearable', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'supported_device_form_factors', 'tv', 'TV', 'TV', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'supported_device_form_factors', 'automotive', 'Automotive', 'Automotive', 'neutral', 50
  UNION ALL SELECT 'mobile-os', 'installation_method', 'oem_pre_installed', 'OEM pre-installed', 'OEM-vorinstalliert', 'neutral', 10
  UNION ALL SELECT 'mobile-os', 'installation_method', 'vendor_flasher_tool', 'Vendor flasher tool', 'Hersteller-Flash-Tool', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'installation_method', 'fastboot_flash', 'Fastboot flash', 'Fastboot-Flash', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'installation_method', 'recovery_sideload', 'Recovery sideload', 'Recovery-Sideload', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'installation_method', 'sd_card_image', 'SD card image', 'SD-Karten-Image', 'neutral', 50
  UNION ALL SELECT 'mobile-os', 'carrier_activation_support', 'full_support', 'Full support', 'Volle Unterstützung', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'carrier_activation_support', 'partial_support', 'Partial support', 'Teilweise Unterstützung', 'tradeoff', 20
  UNION ALL SELECT 'mobile-os', 'carrier_activation_support', 'manual_apn_only', 'Manual APN only', 'Nur manuelles APN', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'carrier_activation_support', 'not_supported', 'Not supported', 'Nicht unterstützt', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'security_update_cadence', 'monthly', 'Monthly', 'Monatlich', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'security_update_cadence', 'quarterly', 'Quarterly', 'Quartalsweise', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'security_update_cadence', 'irregular', 'Irregular', 'Unregelmäßig', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'security_update_cadence', 'rolling', 'Rolling', 'Fortlaufend', 'positive', 40
  UNION ALL SELECT 'mobile-os', 'security_update_cadence', 'vendor_dependent', 'Vendor dependent', 'Herstellerabhängig', 'warning', 50
  UNION ALL SELECT 'mobile-os', 'update_delivery_model', 'ota_vendor', 'OTA from vendor', 'OTA vom Anbieter', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'update_delivery_model', 'ota_carrier_gated', 'OTA carrier-gated', 'OTA Carrier-gesteuert', 'tradeoff', 20
  UNION ALL SELECT 'mobile-os', 'update_delivery_model', 'app_store_update', 'App-store-like update', 'App-Store-ähnliches Update', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'update_delivery_model', 'manual_flash', 'Manual flash', 'Manueller Flash', 'tradeoff', 40
  UNION ALL SELECT 'mobile-os', 'application_sandboxing', 'full_selinux', 'Full SELinux', 'Vollständiges SELinux', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'application_sandboxing', 'app_sandbox', 'App Sandbox', 'App-Sandbox', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'application_sandboxing', 'container_based', 'Container-based', 'Containerbasiert', 'positive', 30
  UNION ALL SELECT 'mobile-os', 'application_sandboxing', 'partial', 'Partial', 'Teilweise', 'tradeoff', 40
  UNION ALL SELECT 'mobile-os', 'application_sandboxing', 'none', 'None', 'Keine', 'warning', 50
  UNION ALL SELECT 'mobile-os', 'full_disk_encryption_default', 'always_encrypted', 'Always encrypted', 'Immer verschlüsselt', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'full_disk_encryption_default', 'default_on', 'Default on', 'Standardmäßig aktiv', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'full_disk_encryption_default', 'opt_in', 'Opt-in', 'Opt-in', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'full_disk_encryption_default', 'not_available', 'Not available', 'Nicht verfügbar', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'biometric_authentication', 'fingerprint', 'Fingerprint', 'Fingerabdruck', 'neutral', 10
  UNION ALL SELECT 'mobile-os', 'biometric_authentication', 'face_recognition', 'Face recognition', 'Gesichtserkennung', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'biometric_authentication', 'iris_scan', 'Iris scan', 'Iris-Scan', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'biometric_authentication', 'voice_recognition', 'Voice recognition', 'Spracherkennung', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'biometric_authentication', 'none', 'None', 'Keine', 'neutral', 50
  UNION ALL SELECT 'mobile-os', 'telemetry_default', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'telemetry_default', 'opt_in_only', 'Opt-in only', 'Nur Opt-in', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'telemetry_default', 'minimal_default', 'Minimal default', 'Minimaler Standard', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'telemetry_default', 'moderate_default', 'Moderate default', 'Moderater Standard', 'tradeoff', 40
  UNION ALL SELECT 'mobile-os', 'telemetry_default', 'extensive_default', 'Extensive default', 'Umfangreicher Standard', 'warning', 50
  UNION ALL SELECT 'mobile-os', 'telemetry_opt_out', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'telemetry_opt_out', 'fully_disableable', 'Fully disableable', 'Vollständig deaktivierbar', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'telemetry_opt_out', 'partially_disableable', 'Partially disableable', 'Teilweise deaktivierbar', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'telemetry_opt_out', 'not_disableable', 'Not disableable', 'Nicht deaktivierbar', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'permission_granularity', 'per_permission_runtime', 'Per-permission runtime', 'Laufzeit-Einzelberechtigung', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'permission_granularity', 'grouped_permissions', 'Grouped permissions', 'Gruppierte Berechtigungen', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'permission_granularity', 'all_or_nothing', 'All-or-nothing', 'Alles-oder-nichts', 'warning', 30
  UNION ALL SELECT 'mobile-os', 'location_privacy_controls', 'precise_approximate_toggle', 'Precise/approximate toggle', 'Präzise/ungefähr-Umschalter', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'location_privacy_controls', 'per_app_control', 'Per-app control', 'Pro-App-Kontrolle', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'location_privacy_controls', 'usage_indicator', 'Usage indicator', 'Nutzungsanzeige', 'positive', 30
  UNION ALL SELECT 'mobile-os', 'location_privacy_controls', 'while_using_only', 'While-using-only option', 'Nur-bei-Nutzung-Option', 'positive', 40
  UNION ALL SELECT 'mobile-os', 'location_privacy_controls', 'global_off_only', 'Global off only', 'Nur global deaktivierbar', 'warning', 50
  UNION ALL SELECT 'mobile-os', 'advertising_id_controls', 'absent', 'Absent', 'Nicht vorhanden', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'advertising_id_controls', 'removable', 'Removable', 'Entfernbar', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'advertising_id_controls', 'resettable', 'Resettable', 'Zurücksetzbar', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'advertising_id_controls', 'permanent', 'Permanent', 'Permanent', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'primary_app_store', 'google_play', 'Google Play', 'Google Play', 'neutral', 10
  UNION ALL SELECT 'mobile-os', 'primary_app_store', 'apple_app_store', 'Apple App Store', 'Apple App Store', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'primary_app_store', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 30
  UNION ALL SELECT 'mobile-os', 'primary_app_store', 'aurora_store', 'Aurora Store', 'Aurora Store', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'primary_app_store', 'vendor_store', 'Vendor store', 'Hersteller-Store', 'neutral', 50
  UNION ALL SELECT 'mobile-os', 'primary_app_store', 'none', 'None', 'Keiner', 'tradeoff', 60
  UNION ALL SELECT 'mobile-os', 'sideloading_support', 'freely_allowed', 'Freely allowed', 'Frei erlaubt', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'sideloading_support', 'allowed_with_warning', 'Allowed with warning', 'Erlaubt mit Warnung', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'sideloading_support', 'restricted', 'Restricted', 'Eingeschränkt', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'sideloading_support', 'blocked', 'Blocked', 'Blockiert', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'android_app_compatibility', 'native', 'Native', 'Nativ', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'android_app_compatibility', 'compatibility_layer', 'Compatibility layer', 'Kompatibilitätsschicht', 'tradeoff', 20
  UNION ALL SELECT 'mobile-os', 'android_app_compatibility', 'limited', 'Limited', 'Eingeschränkt', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'android_app_compatibility', 'none', 'None', 'Keine', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'baseband_firmware_model', 'separated', 'Separated', 'Getrennt', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'baseband_firmware_model', 'integrated', 'Integrated', 'Integriert', 'tradeoff', 20
  UNION ALL SELECT 'mobile-os', 'baseband_firmware_model', 'vendor_dependent', 'Vendor dependent', 'Herstellerabhängig', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'volte_support', 'full_support', 'Full support', 'Volle Unterstützung', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'volte_support', 'carrier_dependent', 'Carrier dependent', 'Carrier-abhängig', 'tradeoff', 20
  UNION ALL SELECT 'mobile-os', 'volte_support', 'partial', 'Partial', 'Teilweise', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'volte_support', 'not_supported', 'Not supported', 'Nicht unterstützt', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'bluetooth_version', 'bt_5_3', 'Bluetooth 5.3+', 'Bluetooth 5.3+', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'bluetooth_version', 'bt_5_0', 'Bluetooth 5.0–5.2', 'Bluetooth 5.0–5.2', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'bluetooth_version', 'bt_4_x', 'Bluetooth 4.x', 'Bluetooth 4.x', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'bluetooth_version', 'driver_dependent', 'Driver dependent', 'Treiberabhängig', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'wifi_standards', 'wifi_7', 'Wi-Fi 7', 'Wi-Fi 7', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'wifi_standards', 'wifi_6e', 'Wi-Fi 6E', 'Wi-Fi 6E', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'wifi_standards', 'wifi_6', 'Wi-Fi 6', 'Wi-Fi 6', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'wifi_standards', 'wifi_5', 'Wi-Fi 5', 'Wi-Fi 5', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'wifi_standards', 'wifi_4', 'Wi-Fi 4', 'Wi-Fi 4', 'tradeoff', 50
  UNION ALL SELECT 'mobile-os', 'ui_customization_level', 'extensive', 'Extensive', 'Umfangreich', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'ui_customization_level', 'moderate', 'Moderate', 'Mäßig', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'ui_customization_level', 'minimal', 'Minimal', 'Minimal', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'accessibility_features', 'screen_reader', 'Screen reader', 'Screenreader', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'accessibility_features', 'magnification', 'Magnification', 'Vergrößerung', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'accessibility_features', 'high_contrast', 'High contrast', 'Hoher Kontrast', 'positive', 30
  UNION ALL SELECT 'mobile-os', 'accessibility_features', 'voice_control', 'Voice control', 'Sprachsteuerung', 'positive', 40
  UNION ALL SELECT 'mobile-os', 'accessibility_features', 'switch_control', 'Switch control', 'Schaltersteuerung', 'positive', 50
  UNION ALL SELECT 'mobile-os', 'accessibility_features', 'haptic_feedback', 'Haptic feedback', 'Haptisches Feedback', 'positive', 60
  UNION ALL SELECT 'mobile-os', 'accessibility_features', 'color_filters', 'Color filters', 'Farbfilter', 'positive', 70
  UNION ALL SELECT 'mobile-os', 'notification_model', 'push_google', 'Google push (FCM)', 'Google-Push (FCM)', 'tradeoff', 10
  UNION ALL SELECT 'mobile-os', 'notification_model', 'push_apple', 'Apple push (APNs)', 'Apple-Push (APNs)', 'tradeoff', 20
  UNION ALL SELECT 'mobile-os', 'notification_model', 'unified_push', 'UnifiedPush', 'UnifiedPush', 'positive', 30
  UNION ALL SELECT 'mobile-os', 'notification_model', 'polling', 'Polling', 'Polling', 'tradeoff', 40
  UNION ALL SELECT 'mobile-os', 'notification_model', 'none', 'None', 'Keine', 'warning', 50
  UNION ALL SELECT 'mobile-os', 'backup_model', 'cloud_vendor', 'Cloud (vendor)', 'Cloud (Anbieter)', 'tradeoff', 10
  UNION ALL SELECT 'mobile-os', 'backup_model', 'cloud_third_party', 'Cloud (third-party)', 'Cloud (Drittanbieter)', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'backup_model', 'local_only', 'Local only', 'Nur lokal', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'backup_model', 'local_and_cloud', 'Local and cloud', 'Lokal und Cloud', 'positive', 40
  UNION ALL SELECT 'mobile-os', 'backup_model', 'none', 'None', 'Keines', 'warning', 50
  UNION ALL SELECT 'mobile-os', 'device_migration_model', 'phone_to_phone_transfer', 'Phone-to-phone transfer', 'Telefon-zu-Telefon-Übertragung', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'device_migration_model', 'cloud_restore', 'Cloud restore', 'Cloud-Wiederherstellung', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'device_migration_model', 'manual_backup_restore', 'Manual backup/restore', 'Manuelles Backup/Wiederherstellen', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'device_migration_model', 'not_supported', 'Not supported', 'Nicht unterstützt', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'source_code_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'source_code_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'source_code_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'mobile-os', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'mobile-os', 'governance_model', 'community_driven', 'Community driven', 'Community-getrieben', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'governance_model', 'foundation_backed', 'Foundation backed', 'Stiftungsunterstützt', 'positive', 20
  UNION ALL SELECT 'mobile-os', 'governance_model', 'corporate_open', 'Corporate open', 'Unternehmen offen', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'governance_model', 'single_vendor', 'Single vendor', 'Einzelanbieter', 'tradeoff', 40
  UNION ALL SELECT 'mobile-os', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'positive', 10
  UNION ALL SELECT 'mobile-os', 'fit_profiles', 'everyday_user', 'Everyday user', 'Alltagsnutzer', 'neutral', 20
  UNION ALL SELECT 'mobile-os', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 30
  UNION ALL SELECT 'mobile-os', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 40
  UNION ALL SELECT 'mobile-os', 'fit_profiles', 'degoogled', 'De-Googled', 'Entgoogelt', 'positive', 50
  UNION ALL SELECT 'mobile-os', 'fit_profiles', 'enthusiast', 'Enthusiast', 'Enthusiast', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'mobile-os'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'mobile-os'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('018-mobile-os-matrix-criteria');
