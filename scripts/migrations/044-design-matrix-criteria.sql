-- Migration 044: Define Design & Graphics category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('design', 'design_capabilities', 'Design Capabilities', 'Design-Fähigkeiten', 'Core design capabilities including vector editing, raster editing, prototyping, and layout support.', 'Kerndesign-Fähigkeiten einschließlich Vektorbearbeitung, Rasterbearbeitung, Prototyping und Layout-Unterstützung.', 100),
  ('design', 'canvas_output', 'Canvas & Output', 'Leinwand & Ausgabe', 'Canvas resolution, color model support, and available export formats for design output.', 'Leinwandauflösung, Farbmodell-Unterstützung und verfügbare Exportformate für die Designausgabe.', 200),
  ('design', 'prototyping_interaction', 'Prototyping & Interaction', 'Prototyping & Interaktion', 'Interactive prototyping, animation, developer handoff, and design token capabilities.', 'Interaktives Prototyping, Animation, Entwicklerübergabe und Design-Token-Fähigkeiten.', 300),
  ('design', 'collaboration_workflow', 'Collaboration & Workflow', 'Zusammenarbeit & Workflow', 'Real-time collaboration, feedback tools, version history, and design system support.', 'Echtzeit-Zusammenarbeit, Feedbackwerkzeuge, Versionsverlauf und Designsystem-Unterstützung.', 400),
  ('design', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Supported operating systems, offline editing, plugin ecosystem, and API availability.', 'Unterstützte Betriebssysteme, Offline-Bearbeitung, Plugin-Ökosystem und API-Verfügbarkeit.', 500),
  ('design', 'file_compatibility', 'File Compatibility', 'Dateikompatibilität', 'Import and export format support and interoperability with other design tools.', 'Import- und Exportformat-Unterstützung und Interoperabilität mit anderen Design-Werkzeugen.', 600),
  ('design', 'privacy_data', 'Privacy & Data Handling', 'Datenschutz & Datenverarbeitung', 'Telemetry collection, data processing location, and data export capabilities.', 'Telemetrie-Erfassung, Datenverarbeitungsstandort und Datenexport-Möglichkeiten.', 700),
  ('design', 'openness_licensing', 'Openness & Licensing', 'Offenheit & Lizenzierung', 'Source code availability, licensing, self-hosting capability, and deployment models.', 'Quellcode-Verfügbarkeit, Lizenzierung, Selbsthosting-Fähigkeit und Bereitstellungsmodelle.', 800),
  ('design', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing structure, free tier availability, and target user profiles.', 'Preisstruktur, Verfügbarkeit kostenloser Versionen und Zielgruppen-Benutzerprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'design' AS category_id, 'design_capabilities' AS group_key, 'primary_design_type' AS criterion_key, 'Primary design type' AS label_en, 'Primärer Designtyp' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'The main design disciplines this tool is built for, such as UI/UX, illustration, photo editing, or motion graphics.' AS help_text_en, 'Die Hauptdesign-Disziplinen, für die dieses Werkzeug entwickelt wurde, wie UI/UX, Illustration, Fotobearbeitung oder Bewegtgrafik.' AS help_text_de
  UNION ALL SELECT 'design', 'design_capabilities', 'vector_editing', 'Vector editing', 'Vektorbearbeitung', 'boolean', 'informational', 'optional', 1020, 'Whether the tool provides native vector path creation and editing capabilities.', 'Ob das Werkzeug native Vektorpfad-Erstellungs- und Bearbeitungsfunktionen bietet.'
  UNION ALL SELECT 'design', 'design_capabilities', 'raster_editing', 'Raster/photo editing', 'Raster-/Fotobearbeitung', 'boolean', 'informational', 'optional', 1030, 'Whether the tool supports pixel-based image editing for photographs and raster artwork.', 'Ob das Werkzeug pixelbasierte Bildbearbeitung für Fotografien und Rastergrafiken unterstützt.'
  UNION ALL SELECT 'design', 'design_capabilities', 'prototyping_support', 'Prototyping support', 'Prototyping-Unterstützung', 'boolean', 'informational', 'optional', 1040, 'Whether the tool includes features for creating interactive design prototypes.', 'Ob das Werkzeug Funktionen zum Erstellen interaktiver Design-Prototypen enthält.'
  UNION ALL SELECT 'design', 'design_capabilities', 'layout_desktop_publishing', 'Layout/desktop publishing', 'Layout/Desktop-Publishing', 'boolean', 'informational', 'optional', 1050, 'Whether the tool supports multi-page layouts for print publications and documents.', 'Ob das Werkzeug mehrseitige Layouts für Druckpublikationen und Dokumente unterstützt.'
  UNION ALL SELECT 'design', 'canvas_output', 'color_model_support', 'Color model support', 'Farbmodell-Unterstützung', 'multi_enum', 'informational', 'multi_select', 2010, 'Which color models and spaces the tool natively supports for color selection and output.', 'Welche Farbmodelle und Farbräume das Werkzeug nativ für Farbauswahl und Ausgabe unterstützt.'
  UNION ALL SELECT 'design', 'canvas_output', 'max_canvas_resolution', 'Maximum canvas resolution', 'Maximale Leinwandauflösung', 'enum', 'informational', 'optional', 2020, 'The maximum canvas or artboard resolution supported by the tool.', 'Die maximale Leinwand- oder Zeichenflächen-Auflösung, die das Werkzeug unterstützt.'
  UNION ALL SELECT 'design', 'canvas_output', 'export_formats', 'Export formats', 'Exportformate', 'multi_enum', 'informational', 'multi_select', 2030, 'The file formats available when exporting finished designs from the tool.', 'Die Dateiformate, die beim Exportieren fertiger Designs aus dem Werkzeug verfügbar sind.'
  UNION ALL SELECT 'design', 'canvas_output', 'print_ready_output', 'Print-ready output (CMYK/PDF)', 'Druckfertige Ausgabe (CMYK/PDF)', 'boolean', 'informational', 'optional', 2040, 'Whether the tool can produce print-ready output with CMYK color profiles and PDF export.', 'Ob das Werkzeug druckfertige Ausgaben mit CMYK-Farbprofilen und PDF-Export erstellen kann.'
  UNION ALL SELECT 'design', 'prototyping_interaction', 'interactive_prototyping', 'Interactive prototyping', 'Interaktives Prototyping', 'boolean', 'informational', 'optional', 3010, 'Whether the tool allows creating clickable prototypes with linked screens and interactions.', 'Ob das Werkzeug das Erstellen klickbarer Prototypen mit verlinkten Bildschirmen und Interaktionen ermöglicht.'
  UNION ALL SELECT 'design', 'prototyping_interaction', 'animation_support', 'Animation support', 'Animationsunterstützung', 'boolean', 'informational', 'optional', 3020, 'Whether the tool includes animation timeline or motion design capabilities for UI transitions.', 'Ob das Werkzeug Animationszeitleisten oder Motion-Design-Funktionen für UI-Übergänge enthält.'
  UNION ALL SELECT 'design', 'prototyping_interaction', 'developer_handoff', 'Developer handoff', 'Entwicklerübergabe', 'boolean', 'beneficial', 'optional', 3030, 'Whether the tool provides features to generate CSS, code snippets, or specs for developers.', 'Ob das Werkzeug Funktionen bietet, um CSS, Code-Snippets oder Spezifikationen für Entwickler zu generieren.'
  UNION ALL SELECT 'design', 'prototyping_interaction', 'design_token_support', 'Design token support', 'Design-Token-Unterstützung', 'boolean', 'informational', 'optional', 3040, 'Whether the tool supports design tokens for systematic color, spacing, and typography management.', 'Ob das Werkzeug Design-Tokens für systematisches Farb-, Abstands- und Typografie-Management unterstützt.'
  UNION ALL SELECT 'design', 'collaboration_workflow', 'real_time_collaboration', 'Real-time collaboration', 'Echtzeit-Zusammenarbeit', 'boolean', 'beneficial', 'must_match', 4010, 'Whether multiple users can simultaneously edit the same design file in real time.', 'Ob mehrere Benutzer gleichzeitig dieselbe Designdatei in Echtzeit bearbeiten können.'
  UNION ALL SELECT 'design', 'collaboration_workflow', 'comment_feedback', 'Comment & feedback tools', 'Kommentar- & Feedbackwerkzeuge', 'boolean', 'beneficial', 'optional', 4020, 'Whether the tool provides in-context commenting and feedback annotation features.', 'Ob das Werkzeug kontextbezogene Kommentar- und Feedback-Anmerkungsfunktionen bietet.'
  UNION ALL SELECT 'design', 'collaboration_workflow', 'version_history', 'Version history', 'Versionsverlauf', 'boolean', 'beneficial', 'optional', 4030, 'Whether the tool tracks and allows restoration of previous versions of a design file.', 'Ob das Werkzeug frühere Versionen einer Designdatei nachverfolgt und deren Wiederherstellung ermöglicht.'
  UNION ALL SELECT 'design', 'collaboration_workflow', 'design_system_support', 'Design system / component library', 'Designsystem / Komponentenbibliothek', 'boolean', 'beneficial', 'optional', 4040, 'Whether the tool supports reusable component libraries and shared design system assets.', 'Ob das Werkzeug wiederverwendbare Komponentenbibliotheken und gemeinsame Designsystem-Assets unterstützt.'
  UNION ALL SELECT 'design', 'collaboration_workflow', 'asset_management', 'Asset management', 'Asset-Verwaltung', 'boolean', 'informational', 'optional', 4050, 'Whether the tool includes features for organizing, tagging, and sharing design assets across projects.', 'Ob das Werkzeug Funktionen zum Organisieren, Taggen und Teilen von Design-Assets über Projekte hinweg enthält.'
  UNION ALL SELECT 'design', 'platform_access', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'The operating systems and platforms on which the design tool is available.', 'Die Betriebssysteme und Plattformen, auf denen das Design-Werkzeug verfügbar ist.'
  UNION ALL SELECT 'design', 'platform_access', 'offline_editing', 'Offline editing', 'Offline-Bearbeitung', 'boolean', 'beneficial', 'must_match', 5020, 'Whether the tool allows editing designs without an active internet connection.', 'Ob das Werkzeug das Bearbeiten von Designs ohne aktive Internetverbindung ermöglicht.'
  UNION ALL SELECT 'design', 'platform_access', 'plugin_ecosystem', 'Plugin / extension ecosystem', 'Plugin-/Erweiterungs-Ökosystem', 'boolean', 'beneficial', 'optional', 5030, 'Whether the tool supports third-party plugins or extensions to add functionality.', 'Ob das Werkzeug Drittanbieter-Plugins oder Erweiterungen zur Funktionserweiterung unterstützt.'
  UNION ALL SELECT 'design', 'platform_access', 'api_available', 'API available', 'API verfügbar', 'boolean', 'beneficial', 'optional', 5040, 'Whether a programmable API is available for automating design operations and integrations.', 'Ob eine programmierbare API für die Automatisierung von Design-Operationen und Integrationen verfügbar ist.'
  UNION ALL SELECT 'design', 'file_compatibility', 'import_formats', 'Import formats', 'Importformate', 'multi_enum', 'informational', 'multi_select', 6010, 'The file formats that can be imported into the tool for editing or reference.', 'Die Dateiformate, die in das Werkzeug zum Bearbeiten oder als Referenz importiert werden können.'
  UNION ALL SELECT 'design', 'file_compatibility', 'sketch_file_import', 'Sketch file import', 'Sketch-Datei-Import', 'boolean', 'informational', 'optional', 6020, 'Whether the tool can open and edit Sketch (.sketch) files natively.', 'Ob das Werkzeug Sketch-Dateien (.sketch) nativ öffnen und bearbeiten kann.'
  UNION ALL SELECT 'design', 'file_compatibility', 'figma_file_import', 'Figma file import', 'Figma-Datei-Import', 'boolean', 'informational', 'optional', 6030, 'Whether the tool can import designs from Figma files or the Figma API.', 'Ob das Werkzeug Designs aus Figma-Dateien oder der Figma-API importieren kann.'
  UNION ALL SELECT 'design', 'file_compatibility', 'psd_file_import', 'PSD file import', 'PSD-Datei-Import', 'boolean', 'informational', 'optional', 6040, 'Whether the tool can open and edit Adobe Photoshop (.psd) files with layer support.', 'Ob das Werkzeug Adobe-Photoshop-Dateien (.psd) mit Ebenenunterstützung öffnen und bearbeiten kann.'
  UNION ALL SELECT 'design', 'privacy_data', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 7010, 'How the design tool collects and transmits usage data and analytics to the vendor.', 'Wie das Design-Werkzeug Nutzungsdaten und Analysen an den Anbieter erfasst und überträgt.'
  UNION ALL SELECT 'design', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 7020, 'The geographic region where design data and account information are processed and stored.', 'Die geografische Region, in der Designdaten und Kontoinformationen verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'design', 'privacy_data', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 7030, 'Whether all design files and account data can be exported in portable formats for migration.', 'Ob alle Designdateien und Kontodaten in portablen Formaten für die Migration exportiert werden können.'
  UNION ALL SELECT 'design', 'openness_licensing', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The availability and openness of the design tool source code.', 'Die Verfügbarkeit und Offenheit des Quellcodes des Design-Werkzeugs.'
  UNION ALL SELECT 'design', 'openness_licensing', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 8020, 'The software license under which the design tool is distributed.', 'Die Softwarelizenz, unter der das Design-Werkzeug vertrieben wird.'
  UNION ALL SELECT 'design', 'openness_licensing', 'self_hosting_option', 'Self-hosting option', 'Selbsthosting-Option', 'boolean', 'beneficial', 'must_match', 8030, 'Whether the design tool or its collaboration server can be self-hosted on user-owned infrastructure.', 'Ob das Design-Werkzeug oder sein Kollaborationsserver auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'design', 'openness_licensing', 'hosting_model', 'Hosting model', 'Hosting-Modell', 'enum', 'tradeoff', 'must_match', 8040, 'Whether the tool is available as a cloud service, for self-hosting, as a local application, or a combination.', 'Ob das Werkzeug als Cloud-Dienst, zum Selbst-Hosting, als lokale Anwendung oder als Kombination verfügbar ist.'
  UNION ALL SELECT 'design', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'The pricing structure for obtaining and using the design tool.', 'Die Preisstruktur für den Erwerb und die Nutzung des Design-Werkzeugs.'
  UNION ALL SELECT 'design', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfügbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a functional free version of the tool is available without payment or time limits.', 'Ob eine funktionsfähige kostenlose Version des Werkzeugs ohne Bezahlung oder Zeitlimits verfügbar ist.'
  UNION ALL SELECT 'design', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9030, 'Target user profiles and roles the design tool is best suited for based on features and workflow.', 'Zielgruppen-Benutzerprofile und Rollen, für die das Design-Werkzeug basierend auf Funktionen und Arbeitsablauf am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'design' AS category_id, 'primary_design_type' AS criterion_key, 'ui_ux_design' AS option_key, 'UI/UX design' AS label_en, 'UI/UX-Design' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'design', 'primary_design_type', 'vector_illustration', 'Vector illustration', 'Vektorillustration', 'neutral', 20
  UNION ALL SELECT 'design', 'primary_design_type', 'photo_editing', 'Photo editing', 'Fotobearbeitung', 'neutral', 30
  UNION ALL SELECT 'design', 'primary_design_type', 'print_layout', 'Print & layout', 'Druck & Layout', 'neutral', 40
  UNION ALL SELECT 'design', 'primary_design_type', 'motion_graphics', 'Motion graphics', 'Bewegtgrafik', 'neutral', 50
  UNION ALL SELECT 'design', 'primary_design_type', '3d_design', '3D design', '3D-Design', 'neutral', 60
  UNION ALL SELECT 'design', 'primary_design_type', 'whiteboarding', 'Whiteboarding', 'Whiteboarding', 'neutral', 70
  UNION ALL SELECT 'design', 'color_model_support', 'rgb', 'RGB', 'RGB', 'neutral', 10
  UNION ALL SELECT 'design', 'color_model_support', 'cmyk', 'CMYK', 'CMYK', 'neutral', 20
  UNION ALL SELECT 'design', 'color_model_support', 'hsl_hsb', 'HSL/HSB', 'HSL/HSB', 'neutral', 30
  UNION ALL SELECT 'design', 'color_model_support', 'pantone', 'Pantone', 'Pantone', 'neutral', 40
  UNION ALL SELECT 'design', 'color_model_support', 'lab', 'Lab', 'Lab', 'neutral', 50
  UNION ALL SELECT 'design', 'max_canvas_resolution', 'up_to_4k', 'Up to 4K', 'Bis zu 4K', 'neutral', 10
  UNION ALL SELECT 'design', 'max_canvas_resolution', 'up_to_8k', 'Up to 8K', 'Bis zu 8K', 'neutral', 20
  UNION ALL SELECT 'design', 'max_canvas_resolution', 'above_8k', 'Above 8K', 'Über 8K', 'neutral', 30
  UNION ALL SELECT 'design', 'max_canvas_resolution', 'unlimited_vector', 'Unlimited (vector)', 'Unbegrenzt (Vektor)', 'neutral', 40
  UNION ALL SELECT 'design', 'export_formats', 'svg', 'SVG', 'SVG', 'neutral', 10
  UNION ALL SELECT 'design', 'export_formats', 'png', 'PNG', 'PNG', 'neutral', 20
  UNION ALL SELECT 'design', 'export_formats', 'jpg', 'JPG', 'JPG', 'neutral', 30
  UNION ALL SELECT 'design', 'export_formats', 'pdf', 'PDF', 'PDF', 'neutral', 40
  UNION ALL SELECT 'design', 'export_formats', 'psd', 'PSD', 'PSD', 'neutral', 50
  UNION ALL SELECT 'design', 'export_formats', 'eps', 'EPS', 'EPS', 'neutral', 60
  UNION ALL SELECT 'design', 'export_formats', 'webp', 'WebP', 'WebP', 'neutral', 70
  UNION ALL SELECT 'design', 'export_formats', 'tiff', 'TIFF', 'TIFF', 'neutral', 80
  UNION ALL SELECT 'design', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'design', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 20
  UNION ALL SELECT 'design', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 30
  UNION ALL SELECT 'design', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 40
  UNION ALL SELECT 'design', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'design', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 60
  UNION ALL SELECT 'design', 'supported_platforms', 'ipad_os', 'iPadOS', 'iPadOS', 'neutral', 70
  UNION ALL SELECT 'design', 'import_formats', 'svg', 'SVG', 'SVG', 'neutral', 10
  UNION ALL SELECT 'design', 'import_formats', 'png', 'PNG', 'PNG', 'neutral', 20
  UNION ALL SELECT 'design', 'import_formats', 'jpg', 'JPG', 'JPG', 'neutral', 30
  UNION ALL SELECT 'design', 'import_formats', 'pdf', 'PDF', 'PDF', 'neutral', 40
  UNION ALL SELECT 'design', 'import_formats', 'ai', 'Adobe Illustrator (AI)', 'Adobe Illustrator (AI)', 'neutral', 50
  UNION ALL SELECT 'design', 'import_formats', 'eps', 'EPS', 'EPS', 'neutral', 60
  UNION ALL SELECT 'design', 'import_formats', 'psd', 'PSD', 'PSD', 'neutral', 70
  UNION ALL SELECT 'design', 'import_formats', 'raw', 'Camera RAW', 'Camera RAW', 'neutral', 80
  UNION ALL SELECT 'design', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'design', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'design', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'design', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'design', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'design', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primär', 'neutral', 20
  UNION ALL SELECT 'design', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'design', 'data_processing_location', 'local_device', 'Local device', 'Lokales Gerät', 'positive', 40
  UNION ALL SELECT 'design', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'design', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'design', 'source_model', 'fully_open_source', 'Fully open source', 'Vollständig quelloffen', 'positive', 10
  UNION ALL SELECT 'design', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'design', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'design', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'design', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'design', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'design', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'design', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'design', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'neutral', 50
  UNION ALL SELECT 'design', 'hosting_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'design', 'hosting_model', 'self_hosted_only', 'Self-hosted only', 'Nur selbst gehostet', 'neutral', 20
  UNION ALL SELECT 'design', 'hosting_model', 'both', 'Both', 'Beides', 'positive', 30
  UNION ALL SELECT 'design', 'hosting_model', 'local_app_only', 'Local app only', 'Nur lokale App', 'neutral', 40
  UNION ALL SELECT 'design', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'design', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'design', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'design', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'design', 'pricing_model', 'per_seat', 'Per seat', 'Pro Arbeitsplatz', 'neutral', 50
  UNION ALL SELECT 'design', 'fit_profiles', 'ui_ux_designer', 'UI/UX designer', 'UI/UX-Designer', 'neutral', 10
  UNION ALL SELECT 'design', 'fit_profiles', 'graphic_designer', 'Graphic designer', 'Grafikdesigner', 'neutral', 20
  UNION ALL SELECT 'design', 'fit_profiles', 'photographer', 'Photographer', 'Fotograf', 'neutral', 30
  UNION ALL SELECT 'design', 'fit_profiles', 'illustrator', 'Illustrator', 'Illustrator', 'neutral', 40
  UNION ALL SELECT 'design', 'fit_profiles', 'marketing_team', 'Marketing team', 'Marketing-Team', 'neutral', 50
  UNION ALL SELECT 'design', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 60
  UNION ALL SELECT 'design', 'fit_profiles', 'hobbyist', 'Hobbyist', 'Hobbyist', 'neutral', 70
  UNION ALL SELECT 'design', 'fit_profiles', 'enterprise', 'Enterprise', 'Großunternehmen', 'neutral', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'design'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'design'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('044-design-matrix-criteria');
