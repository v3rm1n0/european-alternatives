-- Migration 036: Define Note-Taking category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('note-taking', 'editing_note_format', 'Editing & Note Format', 'Bearbeitung & Notizformat', 'Editor paradigm, markup support, and input modalities for composing notes.', 'Editor-Paradigma, Markup-Unterstuetzung und Eingabemodalitaeten fuer das Verfassen von Notizen.', 100),
  ('note-taking', 'organization_structure', 'Organization & Structure', 'Organisation & Struktur', 'How notes are organized, linked, and discovered within the product.', 'Wie Notizen innerhalb des Produkts organisiert, verlinkt und gefunden werden.', 200),
  ('note-taking', 'sync_storage', 'Sync & Storage', 'Synchronisation & Speicherung', 'Where data is stored, how it syncs, and whether self-hosting is possible.', 'Wo Daten gespeichert werden, wie sie synchronisiert werden und ob Self-Hosting moeglich ist.', 300),
  ('note-taking', 'platform_access', 'Platform & Access', 'Plattform & Zugang', 'Platform availability, web access, and integration points.', 'Plattformverfuegbarkeit, Webzugang und Integrationspunkte.', 400),
  ('note-taking', 'collaboration', 'Collaboration', 'Zusammenarbeit', 'Real-time editing, sharing, and team collaboration features.', 'Echtzeit-Bearbeitung, Freigabe und Team-Zusammenarbeitsfunktionen.', 500),
  ('note-taking', 'media_attachments', 'Media & Attachments', 'Medien & Anhaenge', 'Support for non-text content such as images, audio, and embedded media.', 'Unterstuetzung fuer Nicht-Text-Inhalte wie Bilder, Audio und eingebettete Medien.', 600),
  ('note-taking', 'import_export', 'Import & Export', 'Import & Export', 'Data portability through supported import and export formats.', 'Datenportabilitaet durch unterstuetzte Import- und Exportformate.', 700),
  ('note-taking', 'privacy_security', 'Privacy & Security', 'Datenschutz & Sicherheit', 'Encryption, authentication, GDPR compliance, and source code transparency.', 'Verschluesselung, Authentifizierung, DSGVO-Konformitaet und Quellcode-Transparenz.', 800),
  ('note-taking', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier availability, and target audience profiles.', 'Preismodell, Verfuegbarkeit kostenloser Stufen und Zielgruppenprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'note-taking' AS category_id, 'editing_note_format' AS group_key, 'editor_type' AS criterion_key, 'Editor type' AS label_en, 'Editor-Typ' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The primary editing paradigm used to compose notes.' AS help_text_en, 'Das primaere Bearbeitungsparadigma zum Verfassen von Notizen.' AS help_text_de
  UNION ALL SELECT 'note-taking', 'editing_note_format', 'markdown_support', 'Markdown support', 'Markdown-Unterstuetzung', 'boolean', 'beneficial', 'optional', 1020, 'Whether the product supports Markdown syntax for formatting notes.', 'Ob das Produkt Markdown-Syntax fuer die Formatierung von Notizen unterstuetzt.'
  UNION ALL SELECT 'note-taking', 'editing_note_format', 'rich_text_editing', 'Rich text editing', 'Rich-Text-Bearbeitung', 'boolean', 'informational', 'optional', 1030, 'Whether a visual rich text editor is available for formatted content.', 'Ob ein visueller Rich-Text-Editor fuer formatierte Inhalte verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'editing_note_format', 'code_block_syntax_highlighting', 'Code block syntax highlighting', 'Codeblock-Syntaxhervorhebung', 'boolean', 'informational', 'optional', 1040, 'Whether code blocks support language-aware syntax highlighting.', 'Ob Codebloecke sprachbezogene Syntaxhervorhebung unterstuetzen.'
  UNION ALL SELECT 'note-taking', 'editing_note_format', 'math_equation_support', 'Math equation support', 'Mathematische Formelunterstuetzung', 'boolean', 'informational', 'optional', 1050, 'Whether the product can render mathematical equations such as LaTeX.', 'Ob das Produkt mathematische Formeln wie LaTeX darstellen kann.'
  UNION ALL SELECT 'note-taking', 'editing_note_format', 'handwriting_input', 'Handwriting input', 'Handschrifteingabe', 'boolean', 'informational', 'optional', 1060, 'Whether handwriting or stylus input is supported for note creation.', 'Ob Handschrift- oder Stifteingabe fuer die Notizerstellung unterstuetzt wird.'
  UNION ALL SELECT 'note-taking', 'organization_structure', 'organization_model', 'Organization model', 'Organisationsmodell', 'multi_enum', 'informational', 'multi_select', 2010, 'The structural paradigms available for organizing notes.', 'Die verfuegbaren Strukturparadigmen zur Organisation von Notizen.'
  UNION ALL SELECT 'note-taking', 'organization_structure', 'bidirectional_links', 'Bidirectional links', 'Bidirektionale Verlinkungen', 'boolean', 'beneficial', 'optional', 2020, 'Whether notes can be linked in both directions to build a knowledge graph.', 'Ob Notizen in beide Richtungen verlinkt werden koennen, um einen Wissensgraphen aufzubauen.'
  UNION ALL SELECT 'note-taking', 'organization_structure', 'graph_view', 'Graph view', 'Graphansicht', 'boolean', 'informational', 'optional', 2030, 'Whether a visual graph of note connections is available for navigation.', 'Ob eine visuelle Graphdarstellung der Notizverbindungen zur Navigation verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'organization_structure', 'full_text_search', 'Full-text search', 'Volltextsuche', 'boolean', 'beneficial', 'must_match', 2040, 'Whether full-text search across all notes is available.', 'Ob eine Volltextsuche ueber alle Notizen verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'organization_structure', 'templates_support', 'Templates support', 'Vorlagenunterstuetzung', 'boolean', 'informational', 'optional', 2050, 'Whether pre-built or custom note templates can be used.', 'Ob vorgefertigte oder benutzerdefinierte Notizvorlagen verwendet werden koennen.'
  UNION ALL SELECT 'note-taking', 'sync_storage', 'sync_model', 'Sync model', 'Synchronisationsmodell', 'enum', 'tradeoff', 'must_match', 3010, 'How notes are synchronized across devices and where sync happens.', 'Wie Notizen zwischen Geraeten synchronisiert werden und wo die Synchronisation stattfindet.'
  UNION ALL SELECT 'note-taking', 'sync_storage', 'storage_format', 'Storage format', 'Speicherformat', 'enum', 'informational', 'optional', 3020, 'The underlying format used to persist notes on disk or in a database.', 'Das zugrundeliegende Format zur Speicherung von Notizen auf der Festplatte oder in einer Datenbank.'
  UNION ALL SELECT 'note-taking', 'sync_storage', 'offline_access', 'Offline access', 'Offline-Zugriff', 'boolean', 'beneficial', 'optional', 3030, 'Whether notes can be accessed and edited without an internet connection.', 'Ob Notizen ohne Internetverbindung abgerufen und bearbeitet werden koennen.'
  UNION ALL SELECT 'note-taking', 'sync_storage', 'self_hostable', 'Self-hostable', 'Selbst hostbar', 'boolean', 'beneficial', 'optional', 3040, 'Whether the product can be deployed on your own infrastructure.', 'Ob das Produkt auf eigener Infrastruktur betrieben werden kann.'
  UNION ALL SELECT 'note-taking', 'sync_storage', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 3050, 'Where user data is stored and processed geographically.', 'Wo Benutzerdaten geographisch gespeichert und verarbeitet werden.'
  UNION ALL SELECT 'note-taking', 'platform_access', 'platform_availability', 'Platform availability', 'Plattformverfuegbarkeit', 'multi_enum', 'informational', 'multi_select', 4010, 'Which desktop and mobile operating systems have native applications.', 'Fuer welche Desktop- und Mobilbetriebssysteme native Anwendungen existieren.'
  UNION ALL SELECT 'note-taking', 'platform_access', 'web_access', 'Web access', 'Webzugang', 'boolean', 'informational', 'optional', 4020, 'Whether notes can be accessed through a web browser.', 'Ob Notizen ueber einen Webbrowser abgerufen werden koennen.'
  UNION ALL SELECT 'note-taking', 'platform_access', 'web_clipper', 'Web clipper', 'Web-Clipper', 'boolean', 'informational', 'optional', 4030, 'Whether a browser extension is available for clipping web content into notes.', 'Ob eine Browsererweiterung zum Speichern von Webinhalten in Notizen verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'platform_access', 'api_available', 'API available', 'API verfuegbar', 'boolean', 'beneficial', 'optional', 4040, 'Whether a programmatic API is available for integrations and automation.', 'Ob eine programmatische API fuer Integrationen und Automatisierung verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'collaboration', 'real_time_collaboration', 'Real-time collaboration', 'Echtzeit-Zusammenarbeit', 'boolean', 'informational', 'optional', 5010, 'Whether multiple users can edit the same note simultaneously.', 'Ob mehrere Benutzer gleichzeitig dieselbe Notiz bearbeiten koennen.'
  UNION ALL SELECT 'note-taking', 'collaboration', 'sharing_publishing', 'Sharing & publishing', 'Teilen & Veroeffentlichen', 'multi_enum', 'informational', 'multi_select', 5020, 'Available methods for sharing notes with others or publishing them publicly.', 'Verfuegbare Methoden zum Teilen von Notizen mit anderen oder zur oeffentlichen Veroeffentlichung.'
  UNION ALL SELECT 'note-taking', 'collaboration', 'team_workspaces', 'Team workspaces', 'Team-Arbeitsbereiche', 'boolean', 'informational', 'optional', 5030, 'Whether shared workspaces for teams or groups are supported.', 'Ob gemeinsame Arbeitsbereiche fuer Teams oder Gruppen unterstuetzt werden.'
  UNION ALL SELECT 'note-taking', 'collaboration', 'comments_annotations', 'Comments & annotations', 'Kommentare & Anmerkungen', 'boolean', 'informational', 'optional', 5040, 'Whether inline comments or annotations can be added to notes.', 'Ob Inline-Kommentare oder Anmerkungen zu Notizen hinzugefuegt werden koennen.'
  UNION ALL SELECT 'note-taking', 'media_attachments', 'file_attachments', 'File attachments', 'Dateianhange', 'boolean', 'informational', 'optional', 6010, 'Whether files can be attached to notes for reference.', 'Ob Dateien als Referenz an Notizen angehaengt werden koennen.'
  UNION ALL SELECT 'note-taking', 'media_attachments', 'image_embedding', 'Image embedding', 'Bildeinbettung', 'boolean', 'informational', 'optional', 6020, 'Whether images can be embedded directly within note content.', 'Ob Bilder direkt in den Notizinhalt eingebettet werden koennen.'
  UNION ALL SELECT 'note-taking', 'media_attachments', 'audio_recording', 'Audio recording', 'Audioaufnahme', 'boolean', 'informational', 'optional', 6030, 'Whether audio can be recorded and attached to notes within the product.', 'Ob Audio innerhalb des Produkts aufgenommen und an Notizen angehaengt werden kann.'
  UNION ALL SELECT 'note-taking', 'media_attachments', 'drawing_sketching', 'Drawing & sketching', 'Zeichnen & Skizzieren', 'boolean', 'informational', 'optional', 6040, 'Whether a built-in drawing or sketching tool is available.', 'Ob ein integriertes Zeichen- oder Skizzenwerkzeug verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'media_attachments', 'embedded_content_types', 'Embedded content types', 'Eingebettete Inhaltstypen', 'multi_enum', 'informational', 'multi_select', 6050, 'Types of rich content that can be embedded inline within notes.', 'Arten von Rich Content, der inline in Notizen eingebettet werden kann.'
  UNION ALL SELECT 'note-taking', 'import_export', 'import_formats', 'Import formats', 'Importformate', 'multi_enum', 'informational', 'multi_select', 7010, 'File formats that can be imported to migrate existing notes.', 'Dateiformate, die zum Migrieren vorhandener Notizen importiert werden koennen.'
  UNION ALL SELECT 'note-taking', 'import_export', 'export_formats', 'Export formats', 'Exportformate', 'multi_enum', 'informational', 'multi_select', 7020, 'File formats available for exporting notes out of the product.', 'Dateiformate, die zum Exportieren von Notizen aus dem Produkt verfuegbar sind.'
  UNION ALL SELECT 'note-taking', 'import_export', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 7030, 'Whether a bulk data export function is available for all notes.', 'Ob eine Massenexportfunktion fuer alle Notizen verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'privacy_security', 'end_to_end_encryption', 'End-to-end encryption', 'Ende-zu-Ende-Verschluesselung', 'boolean', 'beneficial', 'must_match', 8010, 'Whether note content is encrypted end-to-end so the provider cannot read it.', 'Ob Notizinhalte Ende-zu-Ende-verschluesselt sind, sodass der Anbieter sie nicht lesen kann.'
  UNION ALL SELECT 'note-taking', 'privacy_security', 'local_encryption', 'Local encryption', 'Lokale Verschluesselung', 'boolean', 'beneficial', 'optional', 8020, 'Whether notes are encrypted at rest on the local device.', 'Ob Notizen im Ruhezustand auf dem lokalen Geraet verschluesselt sind.'
  UNION ALL SELECT 'note-taking', 'privacy_security', 'two_factor_auth', 'Two-factor authentication', 'Zwei-Faktor-Authentifizierung', 'boolean', 'beneficial', 'optional', 8030, 'Whether two-factor authentication is available for account security.', 'Ob Zwei-Faktor-Authentifizierung fuer die Kontosicherheit verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'privacy_security', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfuegbar', 'boolean', 'informational', 'optional', 8040, 'Whether a GDPR-compliant data processing agreement is offered.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag angeboten wird.'
  UNION ALL SELECT 'note-taking', 'privacy_security', 'account_deletion', 'Account deletion', 'Kontoloeschung', 'boolean', 'beneficial', 'optional', 8050, 'Whether users can fully delete their accounts and associated data.', 'Ob Benutzer ihre Konten und zugehoerigen Daten vollstaendig loeschen koennen.'
  UNION ALL SELECT 'note-taking', 'privacy_security', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8060, 'How the source code is licensed and made available for review.', 'Wie der Quellcode lizenziert und zur Einsicht bereitgestellt wird.'
  UNION ALL SELECT 'note-taking', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'How the product is priced and which billing model is used.', 'Wie das Produkt bepreist wird und welches Abrechnungsmodell verwendet wird.'
  UNION ALL SELECT 'note-taking', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfuegbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a free tier is available without requiring payment.', 'Ob eine kostenlose Stufe ohne Bezahlung verfuegbar ist.'
  UNION ALL SELECT 'note-taking', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9030, 'Target audience profiles the product is best suited for.', 'Zielgruppenprofile, fuer die das Produkt am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'note-taking' AS category_id, 'editor_type' AS criterion_key, 'wysiwyg' AS option_key, 'WYSIWYG' AS label_en, 'WYSIWYG' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'note-taking', 'editor_type', 'markdown_native', 'Markdown-native', 'Markdown-nativ', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'editor_type', 'block_based', 'Block-based', 'Blockbasiert', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'editor_type', 'plain_text', 'Plain text', 'Klartext', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'editor_type', 'hybrid', 'Hybrid (Markdown + WYSIWYG)', 'Hybrid (Markdown + WYSIWYG)', 'positive', 50
  UNION ALL SELECT 'note-taking', 'organization_model', 'folders', 'Folders / notebooks', 'Ordner / Notizbuecher', 'neutral', 10
  UNION ALL SELECT 'note-taking', 'organization_model', 'tags', 'Tags', 'Schlagwoerter', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'organization_model', 'backlinks', 'Backlinks', 'Backlinks', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'organization_model', 'hierarchical_pages', 'Hierarchical pages', 'Hierarchische Seiten', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'organization_model', 'databases_tables', 'Databases / tables', 'Datenbanken / Tabellen', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'sync_model', 'local_only', 'Local only', 'Nur lokal', 'tradeoff', 10
  UNION ALL SELECT 'note-taking', 'sync_model', 'self_hosted_sync', 'Self-hosted sync', 'Selbst gehostete Synchronisation', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'sync_model', 'vendor_cloud', 'Vendor cloud', 'Anbieter-Cloud', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'sync_model', 'third_party_cloud', 'Third-party cloud (Dropbox, WebDAV)', 'Drittanbieter-Cloud (Dropbox, WebDAV)', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'sync_model', 'e2ee_cloud', 'End-to-end encrypted cloud', 'Ende-zu-Ende-verschluesselte Cloud', 'positive', 50
  UNION ALL SELECT 'note-taking', 'storage_format', 'plain_files', 'Plain files (Markdown / text)', 'Einfache Dateien (Markdown / Text)', 'positive', 10
  UNION ALL SELECT 'note-taking', 'storage_format', 'database', 'Database', 'Datenbank', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'storage_format', 'proprietary', 'Proprietary format', 'Proprietaeres Format', 'warning', 30
  UNION ALL SELECT 'note-taking', 'storage_format', 'hybrid_format', 'Hybrid (files + metadata DB)', 'Hybrid (Dateien + Metadaten-DB)', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'note-taking', 'data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primaer, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'note-taking', 'data_processing_location', 'self_hosted_choice', 'Self-hosted (your choice)', 'Selbst gehostet (eigene Wahl)', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'data_processing_location', 'local_device', 'Local device only', 'Nur lokales Geraet', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'note-taking', 'platform_availability', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'note-taking', 'platform_availability', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'platform_availability', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'platform_availability', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'platform_availability', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'sharing_publishing', 'share_link', 'Share link', 'Freigabelink', 'neutral', 10
  UNION ALL SELECT 'note-taking', 'sharing_publishing', 'public_publish', 'Public publish', 'Oeffentliche Veroeffentlichung', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'sharing_publishing', 'pdf_export', 'PDF export', 'PDF-Export', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'sharing_publishing', 'permission_controls', 'Permission controls', 'Berechtigungssteuerung', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'embedded_content_types', 'images', 'Images', 'Bilder', 'neutral', 10
  UNION ALL SELECT 'note-taking', 'embedded_content_types', 'videos', 'Videos', 'Videos', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'embedded_content_types', 'pdfs', 'PDFs', 'PDFs', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'embedded_content_types', 'embeds_iframes', 'Embeds / iframes', 'Einbettungen / iframes', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'embedded_content_types', 'tables', 'Tables', 'Tabellen', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'import_formats', 'markdown', 'Markdown', 'Markdown', 'neutral', 10
  UNION ALL SELECT 'note-taking', 'import_formats', 'html', 'HTML', 'HTML', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'import_formats', 'evernote_enex', 'Evernote (ENEX)', 'Evernote (ENEX)', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'import_formats', 'plain_text', 'Plain text', 'Klartext', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'import_formats', 'docx', 'DOCX', 'DOCX', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'export_formats', 'markdown', 'Markdown', 'Markdown', 'neutral', 10
  UNION ALL SELECT 'note-taking', 'export_formats', 'html', 'HTML', 'HTML', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'export_formats', 'pdf', 'PDF', 'PDF', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'export_formats', 'plain_text', 'Plain text', 'Klartext', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'export_formats', 'json', 'JSON', 'JSON', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'note-taking', 'source_model', 'source_available', 'Source-available', 'Quelloffen', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'note-taking', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'note-taking', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'pricing_model', 'open_core', 'Open core', 'Open Core', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'pricing_model', 'self_hosted_free_cloud_paid', 'Self-hosted free, cloud paid', 'Selbst gehostet kostenlos, Cloud kostenpflichtig', 'tradeoff', 60
  UNION ALL SELECT 'note-taking', 'fit_profiles', 'personal', 'Personal', 'Persoenlich', 'neutral', 10
  UNION ALL SELECT 'note-taking', 'fit_profiles', 'student', 'Student', 'Studierende', 'neutral', 20
  UNION ALL SELECT 'note-taking', 'fit_profiles', 'professional', 'Professional', 'Professionell', 'neutral', 30
  UNION ALL SELECT 'note-taking', 'fit_profiles', 'team', 'Team', 'Team', 'neutral', 40
  UNION ALL SELECT 'note-taking', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 50
  UNION ALL SELECT 'note-taking', 'fit_profiles', 'researcher', 'Researcher', 'Forscher', 'neutral', 60
  UNION ALL SELECT 'note-taking', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'note-taking'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'note-taking'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('036-note-taking-matrix-criteria');
