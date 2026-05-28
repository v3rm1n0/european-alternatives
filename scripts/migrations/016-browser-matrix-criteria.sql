-- Migration 016: Define Browser category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('browser', 'rendering_standards', 'Rendering Engine & Standards', 'Rendering-Engine & Standards', 'Engine choice, web standards compliance, PWA support, and extension API compatibility.', 'Engine-Wahl, Webstandards-Kompatibilität, PWA-Unterstützung und Erweiterungs-API-Kompatibilität.', 100),
  ('browser', 'privacy_tracking', 'Privacy & Tracking Protection', 'Datenschutz & Tracking-Schutz', 'Built-in tracking protection, fingerprinting resistance, cookie handling, DNS privacy, and private browsing.', 'Integrierter Tracking-Schutz, Fingerprinting-Abwehr, Cookie-Behandlung, DNS-Datenschutz und privates Surfen.', 200),
  ('browser', 'security_updates', 'Security & Updates', 'Sicherheit & Updates', 'Sandboxing architecture, automatic updates, release cadence, and security audit transparency.', 'Sandboxing-Architektur, automatische Updates, Release-Kadenz und Sicherheitsaudit-Transparenz.', 300),
  ('browser', 'data_sync_account', 'Data Sync & Account', 'Datensynchronisation & Konto', 'Account requirements, sync scope, encryption model, and data export capabilities.', 'Kontoanforderungen, Synchronisationsumfang, Verschlüsselungsmodell und Datenexportfunktionen.', 400),
  ('browser', 'content_blocking', 'Content Blocking & Filtering', 'Inhaltsblocker & Filterung', 'Native ad blocking, content filter extension support, filter list formats, and reader mode.', 'Nativer Werbeblocker, Unterstützung für Inhaltsfilter-Erweiterungen, Filterlistenformate und Lesemodus.', 500),
  ('browser', 'platform_distribution', 'Platform & Distribution', 'Plattform & Verteilung', 'Operating system support, mobile distribution channels, default browser settings, and portable mode.', 'Betriebssystemunterstützung, mobile Vertriebskanäle, Standard-Browser-Einstellungen und portabler Modus.', 600),
  ('browser', 'extensions_customization', 'Extensions & Customization', 'Erweiterungen & Anpassung', 'Extension store model, API compatibility, theme customization, and UI personalization.', 'Erweiterungsshop-Modell, API-Kompatibilität, Theme-Anpassung und UI-Personalisierung.', 700),
  ('browser', 'productivity_tools', 'Productivity & Built-in Tools', 'Produktivität & integrierte Werkzeuge', 'Tab management, PDF viewing, built-in utilities, and password management.', 'Tab-Verwaltung, PDF-Anzeige, integrierte Werkzeuge und Passwortverwaltung.', 800),
  ('browser', 'openness_architecture_fit', 'Openness, Architecture & Fit', 'Offenheit, Architektur & Eignung', 'Source code model, engine independence, protocol support, self-hosting, and user fit profiles.', 'Quellcode-Modell, Engine-Unabhängigkeit, Protokollunterstützung, Selbsthosting und Nutzereignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'browser' AS category_id, 'rendering_standards' AS group_key, 'rendering_engine' AS criterion_key, 'Rendering engine' AS label_en, 'Rendering-Engine' AS label_de, 'enum' AS value_type, 'tradeoff' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The layout engine used to render web pages, affecting compatibility and engine diversity.' AS help_text_en, 'Die Layout-Engine zum Rendern von Webseiten, mit Auswirkungen auf Kompatibilität und Engine-Vielfalt.' AS help_text_de
  UNION ALL SELECT 'browser', 'rendering_standards', 'web_standards_profile', 'Web standards profile', 'Webstandards-Profil', 'enum', 'informational', 'optional', 1020, 'The documented level of modern web standards compliance.', 'Der dokumentierte Grad der Einhaltung moderner Webstandards.'
  UNION ALL SELECT 'browser', 'rendering_standards', 'progressive_web_app_support', 'Progressive Web App support', 'Progressive-Web-App-Unterstützung', 'boolean', 'beneficial', 'optional', 1030, 'Whether the browser supports installing and running Progressive Web Apps.', 'Ob der Browser die Installation und Ausführung von Progressive Web Apps unterstützt.'
  UNION ALL SELECT 'browser', 'rendering_standards', 'webextensions_api_support', 'WebExtensions API support', 'WebExtensions-API-Unterstützung', 'boolean', 'beneficial', 'optional', 1040, 'Whether the browser supports the cross-browser WebExtensions API standard.', 'Ob der Browser den browserübergreifenden WebExtensions-API-Standard unterstützt.'
  UNION ALL SELECT 'browser', 'privacy_tracking', 'built_in_tracking_protection', 'Built-in tracking protection', 'Integrierter Tracking-Schutz', 'enum', 'beneficial', 'must_match', 2010, 'The level of built-in tracking protection provided by default or through settings.', 'Das Niveau des integrierten Tracking-Schutzes, standardmäßig oder über Einstellungen.'
  UNION ALL SELECT 'browser', 'privacy_tracking', 'fingerprinting_resistance', 'Fingerprinting resistance', 'Fingerprinting-Abwehr', 'enum', 'beneficial', 'optional', 2020, 'Whether the browser actively resists browser fingerprinting techniques.', 'Ob der Browser aktiv Browser-Fingerprinting-Techniken abwehrt.'
  UNION ALL SELECT 'browser', 'privacy_tracking', 'third_party_cookie_default', 'Third-party cookie default', 'Drittanbieter-Cookie-Standard', 'enum', 'tradeoff', 'optional', 2030, 'The default handling of third-party cookies without user intervention.', 'Die Standardbehandlung von Drittanbieter-Cookies ohne Nutzereingriff.'
  UNION ALL SELECT 'browser', 'privacy_tracking', 'dns_over_https_support', 'DNS-over-HTTPS support', 'DNS-über-HTTPS-Unterstützung', 'enum', 'beneficial', 'optional', 2040, 'The level of DNS-over-HTTPS or DNS-over-TLS support for encrypted DNS queries.', 'Das Niveau der DNS-über-HTTPS- oder DNS-über-TLS-Unterstützung für verschlüsselte DNS-Anfragen.'
  UNION ALL SELECT 'browser', 'privacy_tracking', 'private_browsing_model', 'Private browsing model', 'Privates-Surfen-Modell', 'enum', 'informational', 'optional', 2050, 'How the private or incognito browsing mode works and what protections it provides.', 'Wie der private oder Inkognito-Modus funktioniert und welche Schutzmaßnahmen er bietet.'
  UNION ALL SELECT 'browser', 'security_updates', 'sandboxing_model', 'Sandboxing model', 'Sandboxing-Modell', 'enum', 'tradeoff', 'optional', 3010, 'The process isolation and sandboxing architecture used by the browser.', 'Die Prozessisolations- und Sandboxing-Architektur des Browsers.'
  UNION ALL SELECT 'browser', 'security_updates', 'automatic_updates', 'Automatic updates', 'Automatische Updates', 'boolean', 'beneficial', 'optional', 3020, 'Whether the browser automatically updates itself to the latest version.', 'Ob der Browser sich automatisch auf die neueste Version aktualisiert.'
  UNION ALL SELECT 'browser', 'security_updates', 'update_cadence_weeks', 'Update cadence (weeks)', 'Update-Kadenz (Wochen)', 'number', 'informational', 'range', 3030, 'The documented release cycle frequency measured in weeks.', 'Die dokumentierte Release-Zyklusfrequenz in Wochen gemessen.'
  UNION ALL SELECT 'browser', 'security_updates', 'security_audit_transparency', 'Security audit transparency', 'Sicherheitsaudit-Transparenz', 'enum', 'informational', 'optional', 3040, 'Whether security audits or bug bounty results are publicly published.', 'Ob Sicherheitsaudits oder Bug-Bounty-Ergebnisse öffentlich veröffentlicht werden.'
  UNION ALL SELECT 'browser', 'data_sync_account', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 4010, 'Whether an account is required for basic browser usage.', 'Ob ein Konto für die grundlegende Browsernutzung erforderlich ist.'
  UNION ALL SELECT 'browser', 'data_sync_account', 'sync_features', 'Sync features', 'Synchronisationsfunktionen', 'multi_enum', 'informational', 'multi_select', 4020, 'Data types that can be synced across devices when using the browser sync feature.', 'Datentypen, die bei Nutzung der Browser-Synchronisation geräteübergreifend synchronisiert werden können.'
  UNION ALL SELECT 'browser', 'data_sync_account', 'sync_encryption_model', 'Sync encryption model', 'Synchronisations-Verschlüsselungsmodell', 'enum', 'tradeoff', 'optional', 4030, 'How synced browser data is encrypted during transfer and storage.', 'Wie synchronisierte Browserdaten bei Übertragung und Speicherung verschlüsselt werden.'
  UNION ALL SELECT 'browser', 'data_sync_account', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 4040, 'Whether users can export their browser data such as bookmarks, history, or passwords.', 'Ob Nutzer ihre Browserdaten wie Lesezeichen, Verlauf oder Passwörter exportieren können.'
  UNION ALL SELECT 'browser', 'content_blocking', 'built_in_ad_blocker', 'Built-in ad blocker', 'Integrierter Werbeblocker', 'boolean', 'beneficial', 'optional', 5010, 'Whether the browser has a native ad or content blocker built in.', 'Ob der Browser einen nativen Werbe- oder Inhaltsblocker integriert hat.'
  UNION ALL SELECT 'browser', 'content_blocking', 'content_filter_extension_support', 'Content filter extension support', 'Inhaltsfilter-Erweiterungsunterstützung', 'enum', 'tradeoff', 'optional', 5020, 'The level of support for content blocker extensions and their capabilities.', 'Das Unterstützungsniveau für Inhaltsblocker-Erweiterungen und deren Fähigkeiten.'
  UNION ALL SELECT 'browser', 'content_blocking', 'supported_filter_list_formats', 'Supported filter list formats', 'Unterstützte Filterlistenformate', 'multi_enum', 'informational', 'multi_select', 5030, 'Filter list formats that the browser or its extensions can consume for content blocking.', 'Filterlistenformate, die der Browser oder seine Erweiterungen für Inhaltsblockierung verwenden können.'
  UNION ALL SELECT 'browser', 'content_blocking', 'reader_mode_available', 'Reader mode available', 'Lesemodus verfügbar', 'boolean', 'beneficial', 'optional', 5040, 'Whether the browser offers a built-in reader or distraction-free mode.', 'Ob der Browser einen integrierten Lese- oder ablenkungsfreien Modus bietet.'
  UNION ALL SELECT 'browser', 'platform_distribution', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 6010, 'Operating systems and device types where the browser is available.', 'Betriebssysteme und Gerätetypen, auf denen der Browser verfügbar ist.'
  UNION ALL SELECT 'browser', 'platform_distribution', 'mobile_app_distribution', 'Mobile app distribution', 'Mobile App-Verteilung', 'multi_enum', 'informational', 'multi_select', 6020, 'Distribution channels for the mobile version of the browser.', 'Vertriebskanäle für die mobile Version des Browsers.'
  UNION ALL SELECT 'browser', 'platform_distribution', 'default_browser_settable', 'Default browser settable', 'Als Standard-Browser einstellbar', 'boolean', 'informational', 'optional', 6030, 'Whether the operating system allows setting this browser as the default.', 'Ob das Betriebssystem das Festlegen dieses Browsers als Standard erlaubt.'
  UNION ALL SELECT 'browser', 'platform_distribution', 'portable_mode_available', 'Portable mode available', 'Portabler Modus verfügbar', 'boolean', 'beneficial', 'optional', 6040, 'Whether a portable or USB version of the browser exists.', 'Ob eine portable oder USB-Version des Browsers existiert.'
  UNION ALL SELECT 'browser', 'extensions_customization', 'extension_store_model', 'Extension store model', 'Erweiterungsshop-Modell', 'enum', 'tradeoff', 'optional', 7010, 'How browser extensions are distributed and installed.', 'Wie Browser-Erweiterungen verteilt und installiert werden.'
  UNION ALL SELECT 'browser', 'extensions_customization', 'extension_api_compatibility', 'Extension API compatibility', 'Erweiterungs-API-Kompatibilität', 'multi_enum', 'informational', 'multi_select', 7020, 'Extension API standards that the browser supports for add-on development.', 'Erweiterungs-API-Standards, die der Browser für die Add-on-Entwicklung unterstützt.'
  UNION ALL SELECT 'browser', 'extensions_customization', 'theme_customization_level', 'Theme customization level', 'Theme-Anpassungsstufe', 'enum', 'informational', 'optional', 7030, 'The depth of visual theme customization available to users.', 'Die Tiefe der visuellen Theme-Anpassung, die Nutzern zur Verfügung steht.'
  UNION ALL SELECT 'browser', 'extensions_customization', 'ui_customization_features', 'UI customization features', 'UI-Anpassungsfunktionen', 'multi_enum', 'informational', 'multi_select', 7040, 'User interface customization options such as toolbar, sidebar, and tab bar settings.', 'Anpassungsoptionen der Benutzeroberfläche wie Symbolleiste, Seitenleiste und Tab-Leisten-Einstellungen.'
  UNION ALL SELECT 'browser', 'productivity_tools', 'tab_management_features', 'Tab management features', 'Tab-Verwaltungsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 8010, 'Tab organization and management features available in the browser.', 'Tab-Organisations- und Verwaltungsfunktionen, die im Browser verfügbar sind.'
  UNION ALL SELECT 'browser', 'productivity_tools', 'built_in_pdf_viewer', 'Built-in PDF viewer', 'Integrierter PDF-Betrachter', 'boolean', 'beneficial', 'optional', 8020, 'Whether the browser has a native PDF rendering capability.', 'Ob der Browser eine native PDF-Anzeigefunktion hat.'
  UNION ALL SELECT 'browser', 'productivity_tools', 'built_in_tools', 'Built-in tools', 'Integrierte Werkzeuge', 'multi_enum', 'informational', 'multi_select', 8030, 'Utilities and tools built into the browser such as screenshot, translate, or developer tools.', 'Im Browser integrierte Werkzeuge wie Screenshot, Übersetzer oder Entwicklerwerkzeuge.'
  UNION ALL SELECT 'browser', 'productivity_tools', 'password_manager_model', 'Password manager model', 'Passwortmanager-Modell', 'enum', 'informational', 'optional', 8040, 'The built-in password and credential management model.', 'Das integrierte Passwort- und Anmeldedaten-Verwaltungsmodell.'
  UNION ALL SELECT 'browser', 'openness_architecture_fit', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The openness model of the browser source code.', 'Das Offenheitsmodell des Browser-Quellcodes.'
  UNION ALL SELECT 'browser', 'openness_architecture_fit', 'engine_independence', 'Engine independence', 'Engine-Unabhängigkeit', 'enum', 'tradeoff', 'optional', 9020, 'Whether the browser maintains its own engine or is based on another project.', 'Ob der Browser eine eigene Engine pflegt oder auf einem anderen Projekt basiert.'
  UNION ALL SELECT 'browser', 'openness_architecture_fit', 'protocol_support', 'Protocol support', 'Protokollunterstützung', 'multi_enum', 'informational', 'multi_select', 9030, 'Network and application protocols supported beyond standard HTTP.', 'Netzwerk- und Anwendungsprotokolle, die über Standard-HTTP hinaus unterstützt werden.'
  UNION ALL SELECT 'browser', 'openness_architecture_fit', 'self_hosting_sync_server', 'Self-hosting sync server', 'Selbsthosting-Synchronisationsserver', 'boolean', 'tradeoff', 'optional', 9040, 'Whether the sync server infrastructure can be self-hosted.', 'Ob die Synchronisationsserver-Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'browser', 'openness_architecture_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user profiles or use cases the browser is well suited for.', 'Typische Nutzerprofile oder Anwendungsfälle, für die der Browser gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'browser' AS category_id, 'rendering_engine' AS criterion_key, 'blink' AS option_key, 'Blink' AS label_en, 'Blink' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'browser', 'rendering_engine', 'gecko', 'Gecko', 'Gecko', 'positive', 20
  UNION ALL SELECT 'browser', 'rendering_engine', 'webkit', 'WebKit', 'WebKit', 'neutral', 30
  UNION ALL SELECT 'browser', 'rendering_engine', 'goanna', 'Goanna', 'Goanna', 'neutral', 40
  UNION ALL SELECT 'browser', 'rendering_engine', 'servo', 'Servo', 'Servo', 'neutral', 50
  UNION ALL SELECT 'browser', 'rendering_engine', 'other', 'Other', 'Andere', 'neutral', 60
  UNION ALL SELECT 'browser', 'web_standards_profile', 'full_modern', 'Full modern', 'Vollständig modern', 'positive', 10
  UNION ALL SELECT 'browser', 'web_standards_profile', 'mostly_compliant', 'Mostly compliant', 'Weitgehend konform', 'neutral', 20
  UNION ALL SELECT 'browser', 'web_standards_profile', 'selective_support', 'Selective support', 'Selektive Unterstützung', 'tradeoff', 30
  UNION ALL SELECT 'browser', 'web_standards_profile', 'minimal', 'Minimal', 'Minimal', 'warning', 40
  UNION ALL SELECT 'browser', 'built_in_tracking_protection', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'browser', 'built_in_tracking_protection', 'basic', 'Basic', 'Einfach', 'neutral', 20
  UNION ALL SELECT 'browser', 'built_in_tracking_protection', 'enhanced', 'Enhanced', 'Erweitert', 'positive', 30
  UNION ALL SELECT 'browser', 'built_in_tracking_protection', 'aggressive', 'Aggressive', 'Aggressiv', 'positive', 40
  UNION ALL SELECT 'browser', 'fingerprinting_resistance', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'browser', 'fingerprinting_resistance', 'basic_mitigations', 'Basic mitigations', 'Einfache Gegenmaßnahmen', 'neutral', 20
  UNION ALL SELECT 'browser', 'fingerprinting_resistance', 'advanced_resistance', 'Advanced resistance', 'Fortgeschrittene Abwehr', 'positive', 30
  UNION ALL SELECT 'browser', 'fingerprinting_resistance', 'aggressive_blocking', 'Aggressive blocking', 'Aggressives Blockieren', 'positive', 40
  UNION ALL SELECT 'browser', 'third_party_cookie_default', 'allowed_by_default', 'Allowed by default', 'Standardmäßig erlaubt', 'warning', 10
  UNION ALL SELECT 'browser', 'third_party_cookie_default', 'partitioned', 'Partitioned', 'Partitioniert', 'neutral', 20
  UNION ALL SELECT 'browser', 'third_party_cookie_default', 'blocked_by_default', 'Blocked by default', 'Standardmäßig blockiert', 'positive', 30
  UNION ALL SELECT 'browser', 'third_party_cookie_default', 'all_cookies_blocked', 'All cookies blocked', 'Alle Cookies blockiert', 'tradeoff', 40
  UNION ALL SELECT 'browser', 'dns_over_https_support', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'browser', 'dns_over_https_support', 'opt_in', 'Opt-in', 'Opt-in', 'neutral', 20
  UNION ALL SELECT 'browser', 'dns_over_https_support', 'default_on', 'Default on', 'Standardmäßig aktiv', 'positive', 30
  UNION ALL SELECT 'browser', 'dns_over_https_support', 'enforced', 'Enforced', 'Erzwungen', 'positive', 40
  UNION ALL SELECT 'browser', 'dns_over_https_support', 'custom_provider', 'Custom provider', 'Benutzerdefinierter Anbieter', 'neutral', 50
  UNION ALL SELECT 'browser', 'private_browsing_model', 'basic_session_only', 'Basic session only', 'Nur einfache Sitzung', 'neutral', 10
  UNION ALL SELECT 'browser', 'private_browsing_model', 'enhanced_anti_tracking', 'Enhanced anti-tracking', 'Erweiterter Anti-Tracking', 'positive', 20
  UNION ALL SELECT 'browser', 'private_browsing_model', 'tor_integration', 'Tor integration', 'Tor-Integration', 'positive', 30
  UNION ALL SELECT 'browser', 'private_browsing_model', 'always_private', 'Always private', 'Immer privat', 'neutral', 40
  UNION ALL SELECT 'browser', 'sandboxing_model', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'browser', 'sandboxing_model', 'process_per_tab', 'Process per tab', 'Prozess pro Tab', 'neutral', 20
  UNION ALL SELECT 'browser', 'sandboxing_model', 'site_isolation', 'Site isolation', 'Seitenisolierung', 'positive', 30
  UNION ALL SELECT 'browser', 'sandboxing_model', 'full_os_sandbox', 'Full OS sandbox', 'Vollständige OS-Sandbox', 'positive', 40
  UNION ALL SELECT 'browser', 'security_audit_transparency', 'none_public', 'None public', 'Keine öffentlich', 'neutral', 10
  UNION ALL SELECT 'browser', 'security_audit_transparency', 'bug_bounty_only', 'Bug bounty only', 'Nur Bug-Bounty', 'neutral', 20
  UNION ALL SELECT 'browser', 'security_audit_transparency', 'periodic_audits', 'Periodic audits', 'Periodische Audits', 'positive', 30
  UNION ALL SELECT 'browser', 'security_audit_transparency', 'continuous_transparency', 'Continuous transparency', 'Kontinuierliche Transparenz', 'positive', 40
  UNION ALL SELECT 'browser', 'sync_features', 'bookmarks', 'Bookmarks', 'Lesezeichen', 'neutral', 10
  UNION ALL SELECT 'browser', 'sync_features', 'history', 'History', 'Verlauf', 'neutral', 20
  UNION ALL SELECT 'browser', 'sync_features', 'passwords', 'Passwords', 'Passwörter', 'neutral', 30
  UNION ALL SELECT 'browser', 'sync_features', 'open_tabs', 'Open tabs', 'Offene Tabs', 'neutral', 40
  UNION ALL SELECT 'browser', 'sync_features', 'extensions', 'Extensions', 'Erweiterungen', 'neutral', 50
  UNION ALL SELECT 'browser', 'sync_features', 'settings', 'Settings', 'Einstellungen', 'neutral', 60
  UNION ALL SELECT 'browser', 'sync_encryption_model', 'not_encrypted', 'Not encrypted', 'Nicht verschlüsselt', 'warning', 10
  UNION ALL SELECT 'browser', 'sync_encryption_model', 'transport_only', 'Transport only', 'Nur Transport', 'neutral', 20
  UNION ALL SELECT 'browser', 'sync_encryption_model', 'server_side', 'Server side', 'Serverseitig', 'neutral', 30
  UNION ALL SELECT 'browser', 'sync_encryption_model', 'e2ee', 'End-to-end encrypted', 'Ende-zu-Ende-verschlüsselt', 'positive', 40
  UNION ALL SELECT 'browser', 'content_filter_extension_support', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'browser', 'content_filter_extension_support', 'mv3_limited', 'MV3 limited', 'MV3 eingeschränkt', 'tradeoff', 20
  UNION ALL SELECT 'browser', 'content_filter_extension_support', 'mv3_full', 'MV3 full', 'MV3 vollständig', 'neutral', 30
  UNION ALL SELECT 'browser', 'content_filter_extension_support', 'mv2_full', 'MV2 full', 'MV2 vollständig', 'positive', 40
  UNION ALL SELECT 'browser', 'content_filter_extension_support', 'native_api', 'Native API', 'Native API', 'positive', 50
  UNION ALL SELECT 'browser', 'supported_filter_list_formats', 'adblock_plus', 'Adblock Plus', 'Adblock Plus', 'neutral', 10
  UNION ALL SELECT 'browser', 'supported_filter_list_formats', 'ublock_origin', 'uBlock Origin', 'uBlock Origin', 'neutral', 20
  UNION ALL SELECT 'browser', 'supported_filter_list_formats', 'hosts_file', 'Hosts file', 'Hosts-Datei', 'neutral', 30
  UNION ALL SELECT 'browser', 'supported_filter_list_formats', 'dns_blocklist', 'DNS blocklist', 'DNS-Blockliste', 'neutral', 40
  UNION ALL SELECT 'browser', 'supported_filter_list_formats', 'custom_rules', 'Custom rules', 'Benutzerdefinierte Regeln', 'neutral', 50
  UNION ALL SELECT 'browser', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'browser', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'browser', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'browser', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'browser', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'browser', 'supported_platforms', 'bsd', 'BSD', 'BSD', 'neutral', 60
  UNION ALL SELECT 'browser', 'mobile_app_distribution', 'app_store', 'App Store', 'App Store', 'neutral', 10
  UNION ALL SELECT 'browser', 'mobile_app_distribution', 'play_store', 'Play Store', 'Play Store', 'neutral', 20
  UNION ALL SELECT 'browser', 'mobile_app_distribution', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 30
  UNION ALL SELECT 'browser', 'mobile_app_distribution', 'direct_apk', 'Direct APK', 'Direktes APK', 'tradeoff', 40
  UNION ALL SELECT 'browser', 'mobile_app_distribution', 'pwa', 'PWA', 'PWA', 'neutral', 50
  UNION ALL SELECT 'browser', 'extension_store_model', 'own_store', 'Own store', 'Eigener Shop', 'positive', 10
  UNION ALL SELECT 'browser', 'extension_store_model', 'chrome_web_store', 'Chrome Web Store', 'Chrome Web Store', 'neutral', 20
  UNION ALL SELECT 'browser', 'extension_store_model', 'firefox_addons', 'Firefox Add-ons', 'Firefox-Add-ons', 'neutral', 30
  UNION ALL SELECT 'browser', 'extension_store_model', 'sideload_only', 'Sideload only', 'Nur Sideload', 'tradeoff', 40
  UNION ALL SELECT 'browser', 'extension_store_model', 'no_extensions', 'No extensions', 'Keine Erweiterungen', 'warning', 50
  UNION ALL SELECT 'browser', 'extension_api_compatibility', 'chrome_extensions', 'Chrome Extensions', 'Chrome-Erweiterungen', 'neutral', 10
  UNION ALL SELECT 'browser', 'extension_api_compatibility', 'firefox_extensions', 'Firefox Extensions', 'Firefox-Erweiterungen', 'neutral', 20
  UNION ALL SELECT 'browser', 'extension_api_compatibility', 'webextensions', 'WebExtensions', 'WebExtensions', 'neutral', 30
  UNION ALL SELECT 'browser', 'extension_api_compatibility', 'proprietary_api', 'Proprietary API', 'Proprietäre API', 'tradeoff', 40
  UNION ALL SELECT 'browser', 'extension_api_compatibility', 'userscripts', 'Userscripts', 'Userscripts', 'neutral', 50
  UNION ALL SELECT 'browser', 'theme_customization_level', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'browser', 'theme_customization_level', 'basic_themes', 'Basic themes', 'Einfache Themes', 'neutral', 20
  UNION ALL SELECT 'browser', 'theme_customization_level', 'advanced_theming', 'Advanced theming', 'Erweitertes Theming', 'positive', 30
  UNION ALL SELECT 'browser', 'theme_customization_level', 'full_css_customization', 'Full CSS customization', 'Vollständige CSS-Anpassung', 'positive', 40
  UNION ALL SELECT 'browser', 'ui_customization_features', 'toolbar_layout', 'Toolbar layout', 'Symbolleisten-Layout', 'neutral', 10
  UNION ALL SELECT 'browser', 'ui_customization_features', 'sidebar_panels', 'Sidebar panels', 'Seitenleisten-Panels', 'neutral', 20
  UNION ALL SELECT 'browser', 'ui_customization_features', 'tab_bar_position', 'Tab bar position', 'Tab-Leisten-Position', 'neutral', 30
  UNION ALL SELECT 'browser', 'ui_customization_features', 'keyboard_shortcuts', 'Keyboard shortcuts', 'Tastenkürzel', 'neutral', 40
  UNION ALL SELECT 'browser', 'ui_customization_features', 'custom_start_page', 'Custom start page', 'Benutzerdefinierte Startseite', 'neutral', 50
  UNION ALL SELECT 'browser', 'ui_customization_features', 'compact_mode', 'Compact mode', 'Kompaktmodus', 'neutral', 60
  UNION ALL SELECT 'browser', 'tab_management_features', 'tab_groups', 'Tab groups', 'Tab-Gruppen', 'positive', 10
  UNION ALL SELECT 'browser', 'tab_management_features', 'tree_tabs', 'Tree tabs', 'Baum-Tabs', 'positive', 20
  UNION ALL SELECT 'browser', 'tab_management_features', 'tab_stacking', 'Tab stacking', 'Tab-Stapel', 'neutral', 30
  UNION ALL SELECT 'browser', 'tab_management_features', 'session_management', 'Session management', 'Sitzungsverwaltung', 'positive', 40
  UNION ALL SELECT 'browser', 'tab_management_features', 'tab_hibernation', 'Tab hibernation', 'Tab-Ruhezustand', 'positive', 50
  UNION ALL SELECT 'browser', 'tab_management_features', 'split_view', 'Split view', 'Geteilte Ansicht', 'neutral', 60
  UNION ALL SELECT 'browser', 'built_in_tools', 'screenshot_tool', 'Screenshot tool', 'Screenshot-Werkzeug', 'neutral', 10
  UNION ALL SELECT 'browser', 'built_in_tools', 'developer_tools', 'Developer tools', 'Entwicklerwerkzeuge', 'neutral', 20
  UNION ALL SELECT 'browser', 'built_in_tools', 'page_translator', 'Page translator', 'Seitenübersetzer', 'neutral', 30
  UNION ALL SELECT 'browser', 'built_in_tools', 'reading_list', 'Reading list', 'Leseliste', 'neutral', 40
  UNION ALL SELECT 'browser', 'built_in_tools', 'notes', 'Notes', 'Notizen', 'neutral', 50
  UNION ALL SELECT 'browser', 'built_in_tools', 'vpn_proxy', 'VPN/proxy', 'VPN/Proxy', 'neutral', 60
  UNION ALL SELECT 'browser', 'password_manager_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'browser', 'password_manager_model', 'basic_save_fill', 'Basic save/fill', 'Einfaches Speichern/Ausfüllen', 'neutral', 20
  UNION ALL SELECT 'browser', 'password_manager_model', 'advanced_with_sync', 'Advanced with sync', 'Erweitert mit Synchronisation', 'positive', 30
  UNION ALL SELECT 'browser', 'password_manager_model', 'external_integration', 'External integration', 'Externe Integration', 'neutral', 40
  UNION ALL SELECT 'browser', 'source_code_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'browser', 'source_code_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'browser', 'source_code_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'browser', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'browser', 'engine_independence', 'independent_engine', 'Independent engine', 'Unabhängige Engine', 'positive', 10
  UNION ALL SELECT 'browser', 'engine_independence', 'chromium_fork', 'Chromium fork', 'Chromium-Fork', 'tradeoff', 20
  UNION ALL SELECT 'browser', 'engine_independence', 'webkit_fork', 'WebKit fork', 'WebKit-Fork', 'tradeoff', 30
  UNION ALL SELECT 'browser', 'engine_independence', 'gecko_based', 'Gecko based', 'Gecko-basiert', 'neutral', 40
  UNION ALL SELECT 'browser', 'engine_independence', 'custom_hybrid', 'Custom hybrid', 'Benutzerdefinierter Hybrid', 'neutral', 50
  UNION ALL SELECT 'browser', 'protocol_support', 'http3', 'HTTP/3', 'HTTP/3', 'neutral', 10
  UNION ALL SELECT 'browser', 'protocol_support', 'ipfs', 'IPFS', 'IPFS', 'neutral', 20
  UNION ALL SELECT 'browser', 'protocol_support', 'tor', 'Tor', 'Tor', 'neutral', 30
  UNION ALL SELECT 'browser', 'protocol_support', 'gemini', 'Gemini', 'Gemini', 'neutral', 40
  UNION ALL SELECT 'browser', 'protocol_support', 'dat', 'Dat', 'Dat', 'neutral', 50
  UNION ALL SELECT 'browser', 'protocol_support', 'i2p', 'I2P', 'I2P', 'neutral', 60
  UNION ALL SELECT 'browser', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'positive', 10
  UNION ALL SELECT 'browser', 'fit_profiles', 'everyday_browsing', 'Everyday browsing', 'Alltägliches Surfen', 'neutral', 20
  UNION ALL SELECT 'browser', 'fit_profiles', 'power_users', 'Power users', 'Power-Nutzer', 'neutral', 30
  UNION ALL SELECT 'browser', 'fit_profiles', 'developers', 'Developers', 'Entwickler', 'tradeoff', 40
  UNION ALL SELECT 'browser', 'fit_profiles', 'minimal_lightweight', 'Minimal/lightweight', 'Minimal/leichtgewichtig', 'neutral', 50
  UNION ALL SELECT 'browser', 'fit_profiles', 'accessibility_needs', 'Accessibility needs', 'Barrierefreiheitsbedarf', 'positive', 60
  UNION ALL SELECT 'browser', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 70
  UNION ALL SELECT 'browser', 'fit_profiles', 'education', 'Education', 'Bildung', 'neutral', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'browser'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'browser'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('016-browser-matrix-criteria');
