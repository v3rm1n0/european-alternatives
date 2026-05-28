-- Migration 014: Define Office Suite category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('office-suite', 'suite_components', 'Suite Components', 'Suite-Komponenten', 'Which editors and document tools are included in the suite.', 'Welche Editoren und Dokumentwerkzeuge im Paket enthalten sind.', 100),
  ('office-suite', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Where users can edit documents and whether offline or account-based access is required.', 'Wo Nutzer Dokumente bearbeiten können und ob Offline- oder kontobasierter Zugriff erforderlich ist.', 200),
  ('office-suite', 'file_formats', 'File Formats', 'Dateiformate', 'Compatibility with office formats, PDF workflows, export formats, and legacy files.', 'Kompatibilität mit Office-Formaten, PDF-Workflows, Exportformaten und alten Dateien.', 300),
  ('office-suite', 'collaboration_review', 'Collaboration & Review', 'Zusammenarbeit & Prüfung', 'Co-editing, comments, sharing, version history, and review workflows.', 'Gemeinsame Bearbeitung, Kommentare, Freigaben, Versionsverlauf und Prüf-Workflows.', 400),
  ('office-suite', 'document_spreadsheet_depth', 'Document & Spreadsheet Depth', 'Dokument- & Tabellenfunktionen', 'Advanced authoring, spreadsheet, presentation, template, and automation features.', 'Erweiterte Funktionen für Textverarbeitung, Tabellen, Präsentationen, Vorlagen und Automatisierung.', 500),
  ('office-suite', 'deployment_admin', 'Deployment & Administration', 'Bereitstellung & Administration', 'Hosted or self-hosted deployment, storage, accounts, roles, logs, and admin controls.', 'Gehostete oder selbstgehostete Bereitstellung, Speicher, Konten, Rollen, Protokolle und Administrationskontrollen.', 600),
  ('office-suite', 'security_privacy', 'Security & Privacy Controls', 'Sicherheits- & Datenschutzkontrollen', 'Document protection, link security, DLP, retention, encryption, and telemetry controls.', 'Dokumentschutz, Link-Sicherheit, DLP, Aufbewahrung, Verschlüsselung und Telemetrie-Kontrollen.', 700),
  ('office-suite', 'integrations_portability', 'Integrations & Portability', 'Integrationen & Portabilität', 'APIs, extensions, storage integrations, migration paths, and interoperability standards.', 'APIs, Erweiterungen, Speicher-Integrationen, Migrationswege und Interoperabilitätsstandards.', 800),
  ('office-suite', 'accessibility_fit', 'Accessibility & Fit', 'Barrierefreiheit & Eignung', 'Accessibility, language tools, RTL support, AI assistance model, and common fit profiles.', 'Barrierefreiheit, Sprachwerkzeuge, RTL-Unterstützung, KI-Assistenzmodell und typische Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'office-suite' AS category_id, 'suite_components' AS group_key, 'included_editors' AS criterion_key, 'Included editors' AS label_en, 'Enthaltene Editoren' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Editors or document tools that are included as first-party parts of the suite.' AS help_text_en, 'Editoren oder Dokumentwerkzeuge, die als eigene Bestandteile des Pakets enthalten sind.' AS help_text_de
  UNION ALL SELECT 'office-suite', 'suite_components', 'pdf_workflow', 'PDF workflow', 'PDF-Workflow', 'multi_enum', 'beneficial', 'multi_select', 1020, 'PDF-related capabilities such as export, import, editing, forms, signing, redaction, or OCR.', 'PDF-bezogene Funktionen wie Export, Import, Bearbeitung, Formulare, Signatur, Schwärzung oder OCR.'
  UNION ALL SELECT 'office-suite', 'suite_components', 'forms_database_tools', 'Forms/database tools', 'Formular-/Datenbankwerkzeuge', 'multi_enum', 'informational', 'multi_select', 1030, 'Form builders, survey tools, database apps, data-source connections, or reporting tools included with the suite.', 'Formular-Builder, Umfragewerkzeuge, Datenbank-Apps, Datenquellen-Anbindungen oder Berichtswerkzeuge im Paket.'
  UNION ALL SELECT 'office-suite', 'suite_components', 'templates_available', 'Templates available', 'Vorlagen verfügbar', 'boolean', 'beneficial', 'optional', 1040, 'Whether the suite provides built-in or officially documented templates for common documents.', 'Ob das Paket eingebaute oder offiziell dokumentierte Vorlagen für häufige Dokumente bereitstellt.'
  UNION ALL SELECT 'office-suite', 'suite_components', 'equation_or_scientific_tools', 'Equation/scientific tools', 'Formel-/Wissenschaftswerkzeuge', 'multi_enum', 'informational', 'multi_select', 1050, 'Scientific writing features such as equation editors, LaTeX input, symbols, cross-references, or notes.', 'Wissenschaftliche Schreibfunktionen wie Formeleditoren, LaTeX-Eingabe, Symbole, Querverweise oder Notizen.'
  UNION ALL SELECT 'office-suite', 'platform_access', 'desktop_apps', 'Desktop apps', 'Desktop-Apps', 'boolean', 'beneficial', 'optional', 2010, 'Whether full editing applications are available for desktop operating systems.', 'Ob vollwertige Bearbeitungsprogramme für Desktop-Betriebssysteme verfügbar sind.'
  UNION ALL SELECT 'office-suite', 'platform_access', 'web_editing', 'Browser editing', 'Bearbeitung im Browser', 'boolean', 'beneficial', 'must_match', 2020, 'Whether users can create or edit office documents in a web browser.', 'Ob Nutzer Office-Dokumente in einem Webbrowser erstellen oder bearbeiten können.'
  UNION ALL SELECT 'office-suite', 'platform_access', 'mobile_platforms', 'Mobile platforms', 'Mobile Plattformen', 'multi_enum', 'informational', 'multi_select', 2030, 'Mobile platforms or app distribution channels with documented editing support.', 'Mobile Plattformen oder App-Vertriebskanäle mit dokumentierter Bearbeitungsunterstützung.'
  UNION ALL SELECT 'office-suite', 'platform_access', 'offline_editing', 'Offline editing', 'Offline-Bearbeitung', 'boolean', 'beneficial', 'must_match', 2040, 'Whether documents can be edited without an active network connection after setup.', 'Ob Dokumente nach der Einrichtung ohne aktive Netzwerkverbindung bearbeitet werden können.'
  UNION ALL SELECT 'office-suite', 'platform_access', 'account_required_to_edit', 'Account required to edit', 'Konto zum Bearbeiten erforderlich', 'boolean', 'risk', 'must_match', 2050, 'Whether creating or editing documents requires signing in to an account.', 'Ob das Erstellen oder Bearbeiten von Dokumenten eine Anmeldung mit einem Konto verlangt.'
  UNION ALL SELECT 'office-suite', 'file_formats', 'native_format_model', 'Native format model', 'Natives Formatmodell', 'enum', 'tradeoff', 'optional', 3010, 'The default or primary file format model used for saved documents.', 'Das standardmäßige oder primäre Dateiformatmodell für gespeicherte Dokumente.'
  UNION ALL SELECT 'office-suite', 'file_formats', 'ooxml_compatibility', 'OOXML compatibility', 'OOXML-Kompatibilität', 'enum', 'informational', 'optional', 3020, 'The documented level of Microsoft Office OOXML view, edit, import, export, or native support.', 'Der dokumentierte Umfang von Anzeige, Bearbeitung, Import, Export oder nativer Unterstützung für Microsoft-Office-OOXML.'
  UNION ALL SELECT 'office-suite', 'file_formats', 'odf_support', 'ODF support', 'ODF-Unterstützung', 'enum', 'beneficial', 'optional', 3030, 'The documented level of OpenDocument Format support or certification.', 'Der dokumentierte Umfang der Unterstützung oder Zertifizierung für das OpenDocument-Format.'
  UNION ALL SELECT 'office-suite', 'file_formats', 'legacy_format_support', 'Legacy format support', 'Unterstützung alter Formate', 'multi_enum', 'informational', 'multi_select', 3040, 'Older or compatibility formats the suite can open, save, or convert.', 'Ältere oder kompatibilitätsbezogene Formate, die das Paket öffnen, speichern oder konvertieren kann.'
  UNION ALL SELECT 'office-suite', 'file_formats', 'export_formats', 'Export formats', 'Exportformate', 'multi_enum', 'beneficial', 'multi_select', 3050, 'Documented export formats available from the suite.', 'Dokumentierte Exportformate, die aus dem Paket verfügbar sind.'
  UNION ALL SELECT 'office-suite', 'file_formats', 'format_fidelity_tools', 'Format fidelity tools', 'Werkzeuge für Format-Treue', 'multi_enum', 'informational', 'multi_select', 3060, 'Tools or warnings that help preserve layout and formatting across conversions.', 'Werkzeuge oder Warnungen, die Layout und Formatierung bei Konvertierungen erhalten helfen.'
  UNION ALL SELECT 'office-suite', 'collaboration_review', 'real_time_coediting', 'Real-time co-editing', 'Echtzeit-Zusammenarbeit', 'boolean', 'beneficial', 'must_match', 4010, 'Whether multiple users can edit the same document at the same time.', 'Ob mehrere Nutzer dasselbe Dokument gleichzeitig bearbeiten können.'
  UNION ALL SELECT 'office-suite', 'collaboration_review', 'comments_mentions', 'Comments and mentions', 'Kommentare und Erwähnungen', 'boolean', 'beneficial', 'optional', 4020, 'Whether documents support comments, replies, or mentions for collaboration.', 'Ob Dokumente Kommentare, Antworten oder Erwähnungen für Zusammenarbeit unterstützen.'
  UNION ALL SELECT 'office-suite', 'collaboration_review', 'track_changes_review', 'Track changes/review mode', 'Änderungsverfolgung/Prüfmodus', 'boolean', 'beneficial', 'optional', 4030, 'Whether documents support tracked changes, suggestions, or a review mode.', 'Ob Dokumente Änderungsverfolgung, Vorschläge oder einen Prüfmodus unterstützen.'
  UNION ALL SELECT 'office-suite', 'collaboration_review', 'sharing_link_controls', 'Sharing link controls', 'Kontrollen für Freigabelinks', 'multi_enum', 'beneficial', 'multi_select', 4040, 'Controls available for document sharing links and invitation permissions.', 'Kontrollen für Dokument-Freigabelinks und Einladungsberechtigungen.'
  UNION ALL SELECT 'office-suite', 'collaboration_review', 'external_guest_collaboration', 'External guest collaboration', 'Externe Gast-Zusammenarbeit', 'enum', 'tradeoff', 'optional', 4050, 'How the suite supports collaboration with people outside the owning workspace or organization.', 'Wie das Paket Zusammenarbeit mit Personen außerhalb des besitzenden Arbeitsbereichs oder der Organisation unterstützt.'
  UNION ALL SELECT 'office-suite', 'collaboration_review', 'version_history', 'Version history', 'Versionsverlauf', 'boolean', 'beneficial', 'optional', 4060, 'Whether documents have a recoverable version history or revision timeline.', 'Ob Dokumente einen wiederherstellbaren Versionsverlauf oder eine Revisionshistorie haben.'
  UNION ALL SELECT 'office-suite', 'collaboration_review', 'collaboration_presence', 'Collaboration presence', 'Präsenz bei Zusammenarbeit', 'multi_enum', 'informational', 'multi_select', 4070, 'Presence and activity features that help collaborators see document activity.', 'Präsenz- und Aktivitätsfunktionen, mit denen Beteiligte Dokumentaktivitäten sehen können.'
  UNION ALL SELECT 'office-suite', 'document_spreadsheet_depth', 'mail_merge', 'Mail merge', 'Serienbriefe', 'boolean', 'beneficial', 'optional', 5010, 'Whether the word processor supports mail merge or equivalent bulk document generation.', 'Ob die Textverarbeitung Serienbriefe oder gleichwertige Massendokument-Erstellung unterstützt.'
  UNION ALL SELECT 'office-suite', 'document_spreadsheet_depth', 'citation_bibliography_tools', 'Citation/bibliography tools', 'Zitations-/Bibliografiewerkzeuge', 'multi_enum', 'informational', 'multi_select', 5020, 'Citation, bibliography, reference-management, or scholarly document features.', 'Zitations-, Bibliografie-, Literaturverwaltungs- oder wissenschaftliche Dokumentfunktionen.'
  UNION ALL SELECT 'office-suite', 'document_spreadsheet_depth', 'advanced_layout_tools', 'Advanced layout tools', 'Erweiterte Layout-Werkzeuge', 'multi_enum', 'informational', 'multi_select', 5030, 'Advanced document layout and publishing tools available in the suite.', 'Erweiterte Werkzeuge für Dokumentlayout und Publikation im Paket.'
  UNION ALL SELECT 'office-suite', 'document_spreadsheet_depth', 'spreadsheet_advanced_features', 'Advanced spreadsheet features', 'Erweiterte Tabellenfunktionen', 'multi_enum', 'beneficial', 'multi_select', 5040, 'Advanced spreadsheet analysis, validation, charting, or data features.', 'Erweiterte Tabellenfunktionen für Analyse, Validierung, Diagramme oder Daten.'
  UNION ALL SELECT 'office-suite', 'document_spreadsheet_depth', 'presentation_features', 'Presentation features', 'Präsentationsfunktionen', 'multi_enum', 'informational', 'multi_select', 5050, 'Presentation authoring or delivery features beyond basic slide editing.', 'Funktionen für Erstellung oder Vortrag von Präsentationen jenseits einfacher Folienbearbeitung.'
  UNION ALL SELECT 'office-suite', 'document_spreadsheet_depth', 'macro_scripting_model', 'Macro/scripting model', 'Makro-/Skriptmodell', 'enum', 'tradeoff', 'optional', 5060, 'The documented automation or scripting model for documents and spreadsheets.', 'Das dokumentierte Automatisierungs- oder Skriptmodell für Dokumente und Tabellen.'
  UNION ALL SELECT 'office-suite', 'document_spreadsheet_depth', 'vba_macro_compatibility', 'VBA macro compatibility', 'VBA-Makro-Kompatibilität', 'enum', 'tradeoff', 'optional', 5070, 'The documented level of compatibility with Microsoft Office VBA macros.', 'Der dokumentierte Kompatibilitätsumfang mit Microsoft-Office-VBA-Makros.'
  UNION ALL SELECT 'office-suite', 'deployment_admin', 'deployment_model', 'Deployment model', 'Bereitstellungsmodell', 'enum', 'tradeoff', 'optional', 6010, 'The primary hosted, desktop, self-hosted, hybrid, or mobile-only deployment model.', 'Das primäre gehostete, Desktop-, selbstgehostete, hybride oder nur mobile Bereitstellungsmodell.'
  UNION ALL SELECT 'office-suite', 'deployment_admin', 'self_hosting_available', 'Self-hosting available', 'Selbsthosting verfügbar', 'boolean', 'tradeoff', 'optional', 6020, 'Whether organizations can operate the office suite or collaboration server themselves.', 'Ob Organisationen das Office-Paket oder den Kollaborationsserver selbst betreiben können.'
  UNION ALL SELECT 'office-suite', 'deployment_admin', 'storage_backend_model', 'Storage backend model', 'Speicher-Backend-Modell', 'enum', 'tradeoff', 'optional', 6030, 'How documents are stored, including local files, provider storage, or configurable backends.', 'Wie Dokumente gespeichert werden, einschließlich lokaler Dateien, Anbieterspeicher oder konfigurierbarer Backends.'
  UNION ALL SELECT 'office-suite', 'deployment_admin', 'admin_console_available', 'Admin console available', 'Administrationskonsole verfügbar', 'boolean', 'informational', 'optional', 6040, 'Whether administrators have a documented management console for users or settings.', 'Ob Administratoren eine dokumentierte Verwaltungskonsole für Nutzer oder Einstellungen haben.'
  UNION ALL SELECT 'office-suite', 'deployment_admin', 'role_access_controls', 'Role/access controls', 'Rollen-/Zugriffskontrollen', 'multi_enum', 'beneficial', 'multi_select', 6050, 'Role, permission, workspace, folder, locking, or public-access controls for documents.', 'Rollen-, Berechtigungs-, Arbeitsbereichs-, Ordner-, Sperr- oder Öffentlichkeitskontrollen für Dokumente.'
  UNION ALL SELECT 'office-suite', 'deployment_admin', 'audit_logs', 'Audit logs', 'Audit-Protokolle', 'boolean', 'beneficial', 'optional', 6060, 'Whether administrators can review documented audit logs for document or account activity.', 'Ob Administratoren dokumentierte Audit-Protokolle für Dokument- oder Kontoaktivitäten einsehen können.'
  UNION ALL SELECT 'office-suite', 'deployment_admin', 'data_residency_controls', 'Data residency controls', 'Datenresidenz-Kontrollen', 'boolean', 'informational', 'optional', 6070, 'Whether administrators can control or choose where office data is hosted.', 'Ob Administratoren kontrollieren oder wählen können, wo Office-Daten gehostet werden.'
  UNION ALL SELECT 'office-suite', 'security_privacy', 'document_password_protection', 'Document password protection', 'Dokument-Passwortschutz', 'boolean', 'beneficial', 'optional', 7010, 'Whether individual documents can be protected with passwords or similar access controls.', 'Ob einzelne Dokumente mit Passwörtern oder ähnlichen Zugriffskontrollen geschützt werden können.'
  UNION ALL SELECT 'office-suite', 'security_privacy', 'client_side_encryption_model', 'Client-side encryption model', 'Clientseitiges Verschlüsselungsmodell', 'enum', 'tradeoff', 'optional', 7020, 'How client-side encryption is documented and how it affects collaboration.', 'Wie clientseitige Verschlüsselung dokumentiert ist und wie sie Zusammenarbeit beeinflusst.'
  UNION ALL SELECT 'office-suite', 'security_privacy', 'sharing_security_controls', 'Sharing security controls', 'Sicherheitskontrollen für Freigaben', 'multi_enum', 'beneficial', 'multi_select', 7030, 'Security controls that protect shared documents and shared links.', 'Sicherheitskontrollen, die geteilte Dokumente und Freigabelinks schützen.'
  UNION ALL SELECT 'office-suite', 'security_privacy', 'dlp_retention_controls', 'DLP/retention controls', 'DLP-/Aufbewahrungskontrollen', 'multi_enum', 'beneficial', 'multi_select', 7040, 'Administrative controls for data loss prevention, retention, labels, scanning, or sessions.', 'Administrationskontrollen für DLP, Aufbewahrung, Labels, Scans oder Sitzungen.'
  UNION ALL SELECT 'office-suite', 'security_privacy', 'telemetry_control_model', 'Telemetry control model', 'Telemetrie-Kontrollmodell', 'enum', 'risk', 'optional', 7050, 'How product telemetry is documented and whether users or administrators can control it.', 'Wie Produkttelemetrie dokumentiert ist und ob Nutzer oder Administratoren sie steuern können.'
  UNION ALL SELECT 'office-suite', 'integrations_portability', 'developer_api', 'Developer API', 'Entwickler-API', 'multi_enum', 'informational', 'multi_select', 8010, 'Developer interfaces for documents, administration, storage, events, or SDK-based automation.', 'Entwicklerschnittstellen für Dokumente, Administration, Speicher, Ereignisse oder SDK-basierte Automatisierung.'
  UNION ALL SELECT 'office-suite', 'integrations_portability', 'extension_plugin_model', 'Extension/plugin model', 'Erweiterungs-/Plugin-Modell', 'enum', 'tradeoff', 'optional', 8020, 'The documented model for extensions, plugins, add-ins, marketplaces, or managed add-ons.', 'Das dokumentierte Modell für Erweiterungen, Plugins, Add-ins, Marktplatzangebote oder verwaltete Add-ons.'
  UNION ALL SELECT 'office-suite', 'integrations_portability', 'cloud_storage_integrations', 'Cloud storage integrations', 'Cloud-Speicher-Integrationen', 'multi_enum', 'informational', 'multi_select', 8030, 'Storage locations and connectors the suite can use for documents.', 'Speicherorte und Konnektoren, die das Paket für Dokumente nutzen kann.'
  UNION ALL SELECT 'office-suite', 'integrations_portability', 'bulk_import_migration', 'Bulk import/migration', 'Massenimport/-migration', 'multi_enum', 'beneficial', 'multi_select', 8040, 'Bulk import, workspace migration, upload, or drive-import paths documented for moving documents in.', 'Dokumentierte Wege für Massenimport, Arbeitsbereichsmigration, Upload oder Drive-Import zum Umzug von Dokumenten.'
  UNION ALL SELECT 'office-suite', 'integrations_portability', 'standards_interoperability', 'Standards interoperability', 'Standard-Interoperabilität', 'multi_enum', 'beneficial', 'multi_select', 8050, 'Standards or protocols supported for document formats, storage, embedding, or content management.', 'Unterstützte Standards oder Protokolle für Dokumentformate, Speicher, Einbettung oder Content-Management.'
  UNION ALL SELECT 'office-suite', 'accessibility_fit', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 9010, 'Documented accessibility features for navigating, reading, editing, checking, or tagging documents.', 'Dokumentierte Barrierefreiheitsfunktionen für Navigation, Lesen, Bearbeiten, Prüfung oder Auszeichnung von Dokumenten.'
  UNION ALL SELECT 'office-suite', 'accessibility_fit', 'language_tools', 'Language tools', 'Sprachwerkzeuge', 'multi_enum', 'informational', 'multi_select', 9020, 'Writing and interface language tools such as spelling, grammar, hyphenation, thesaurus, translation, or multilingual UI.', 'Sprachwerkzeuge für Schreiben und Oberfläche wie Rechtschreibung, Grammatik, Silbentrennung, Thesaurus, Übersetzung oder mehrsprachige UI.'
  UNION ALL SELECT 'office-suite', 'accessibility_fit', 'right_to_left_support', 'Right-to-left support', 'Rechts-nach-links-Unterstützung', 'boolean', 'informational', 'optional', 9030, 'Whether the suite documents support for right-to-left scripts in editing or layout.', 'Ob das Paket Unterstützung für Rechts-nach-links-Schriften bei Bearbeitung oder Layout dokumentiert.'
  UNION ALL SELECT 'office-suite', 'accessibility_fit', 'ai_assistance_model', 'AI assistance model', 'KI-Assistenzmodell', 'enum', 'risk', 'optional', 9040, 'How AI writing or analysis assistance is provided, controlled, or disabled.', 'Wie KI-Schreib- oder Analyseassistenz bereitgestellt, gesteuert oder deaktiviert wird.'
  UNION ALL SELECT 'office-suite', 'accessibility_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user or organization profiles the suite is designed to fit.', 'Typische Nutzer- oder Organisationsprofile, für die das Paket geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'office-suite' AS category_id, 'included_editors' AS criterion_key, 'word_processor' AS option_key, 'Word processor' AS label_en, 'Textverarbeitung' AS label_de, 'positive' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'office-suite', 'included_editors', 'spreadsheet', 'Spreadsheet', 'Tabellenkalkulation', 'positive', 20
  UNION ALL SELECT 'office-suite', 'included_editors', 'presentation', 'Presentation', 'Präsentation', 'positive', 30
  UNION ALL SELECT 'office-suite', 'included_editors', 'drawing', 'Drawing', 'Zeichnung', 'neutral', 40
  UNION ALL SELECT 'office-suite', 'included_editors', 'database', 'Database', 'Datenbank', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'included_editors', 'forms', 'Forms', 'Formulare', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'included_editors', 'notes', 'Notes', 'Notizen', 'neutral', 70
  UNION ALL SELECT 'office-suite', 'included_editors', 'whiteboard', 'Whiteboard', 'Whiteboard', 'neutral', 80
  UNION ALL SELECT 'office-suite', 'pdf_workflow', 'pdf_export', 'PDF export', 'PDF-Export', 'positive', 10
  UNION ALL SELECT 'office-suite', 'pdf_workflow', 'pdf_import', 'PDF import', 'PDF-Import', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'pdf_workflow', 'pdf_editing', 'PDF editing', 'PDF-Bearbeitung', 'positive', 30
  UNION ALL SELECT 'office-suite', 'pdf_workflow', 'pdf_forms', 'PDF forms', 'PDF-Formulare', 'positive', 40
  UNION ALL SELECT 'office-suite', 'pdf_workflow', 'pdf_signing', 'PDF signing', 'PDF-Signatur', 'positive', 50
  UNION ALL SELECT 'office-suite', 'pdf_workflow', 'pdf_redaction', 'PDF redaction', 'PDF-Schwärzung', 'positive', 60
  UNION ALL SELECT 'office-suite', 'pdf_workflow', 'pdf_ocr', 'PDF OCR', 'PDF-OCR', 'neutral', 70
  UNION ALL SELECT 'office-suite', 'forms_database_tools', 'forms_builder', 'Forms builder', 'Formular-Builder', 'positive', 10
  UNION ALL SELECT 'office-suite', 'forms_database_tools', 'surveys', 'Surveys', 'Umfragen', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'forms_database_tools', 'database_app', 'Database app', 'Datenbank-App', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'forms_database_tools', 'data_sources', 'Data sources', 'Datenquellen', 'neutral', 40
  UNION ALL SELECT 'office-suite', 'forms_database_tools', 'reports', 'Reports', 'Berichte', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'equation_or_scientific_tools', 'equation_editor', 'Equation editor', 'Formeleditor', 'positive', 10
  UNION ALL SELECT 'office-suite', 'equation_or_scientific_tools', 'latex_input', 'LaTeX input', 'LaTeX-Eingabe', 'positive', 20
  UNION ALL SELECT 'office-suite', 'equation_or_scientific_tools', 'symbol_palette', 'Symbol palette', 'Symbolpalette', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'equation_or_scientific_tools', 'cross_references', 'Cross-references', 'Querverweise', 'positive', 40
  UNION ALL SELECT 'office-suite', 'equation_or_scientific_tools', 'footnotes_endnotes', 'Footnotes/endnotes', 'Fuß-/Endnoten', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'mobile_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'mobile_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'mobile_platforms', 'tablet_optimized', 'Tablet optimized', 'Tablet-optimiert', 'positive', 30
  UNION ALL SELECT 'office-suite', 'mobile_platforms', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 40
  UNION ALL SELECT 'office-suite', 'native_format_model', 'open_standard_default', 'Open standard default', 'Offener Standard als Standard', 'positive', 10
  UNION ALL SELECT 'office-suite', 'native_format_model', 'proprietary_default', 'Proprietary default', 'Proprietärer Standard', 'warning', 20
  UNION ALL SELECT 'office-suite', 'native_format_model', 'cloud_native', 'Cloud native', 'Cloud-nativ', 'tradeoff', 30
  UNION ALL SELECT 'office-suite', 'native_format_model', 'mixed_formats', 'Mixed formats', 'Gemischte Formate', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'ooxml_compatibility', 'not_supported', 'Not supported', 'Nicht unterstützt', 'warning', 10
  UNION ALL SELECT 'office-suite', 'ooxml_compatibility', 'view_import_only', 'View/import only', 'Nur Anzeige/Import', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'ooxml_compatibility', 'basic_edit_export', 'Basic edit/export', 'Einfache Bearbeitung/Export', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'ooxml_compatibility', 'high_fidelity', 'High fidelity', 'Hohe Format-Treue', 'positive', 40
  UNION ALL SELECT 'office-suite', 'ooxml_compatibility', 'native_ooxml', 'Native OOXML', 'Natives OOXML', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'odf_support', 'not_supported', 'Not supported', 'Nicht unterstützt', 'warning', 10
  UNION ALL SELECT 'office-suite', 'odf_support', 'import_export', 'Import/export', 'Import/Export', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'odf_support', 'native_default', 'Native default', 'Nativ als Standard', 'positive', 30
  UNION ALL SELECT 'office-suite', 'odf_support', 'certified_or_documented', 'Certified or documented', 'Zertifiziert oder dokumentiert', 'positive', 40
  UNION ALL SELECT 'office-suite', 'legacy_format_support', 'doc_xls_ppt', 'DOC/XLS/PPT', 'DOC/XLS/PPT', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'legacy_format_support', 'rtf', 'RTF', 'RTF', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'legacy_format_support', 'csv_tsv', 'CSV/TSV', 'CSV/TSV', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'legacy_format_support', 'legacy_templates', 'Legacy templates', 'Alte Vorlagen', 'neutral', 40
  UNION ALL SELECT 'office-suite', 'legacy_format_support', 'macros_legacy', 'Legacy macros', 'Alte Makros', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'export_formats', 'odf', 'ODF', 'ODF', 'positive', 10
  UNION ALL SELECT 'office-suite', 'export_formats', 'ooxml', 'OOXML', 'OOXML', 'positive', 20
  UNION ALL SELECT 'office-suite', 'export_formats', 'pdf', 'PDF', 'PDF', 'positive', 30
  UNION ALL SELECT 'office-suite', 'export_formats', 'pdf_a', 'PDF/A', 'PDF/A', 'positive', 40
  UNION ALL SELECT 'office-suite', 'export_formats', 'html', 'HTML', 'HTML', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'export_formats', 'csv_tsv', 'CSV/TSV', 'CSV/TSV', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'export_formats', 'markdown', 'Markdown', 'Markdown', 'neutral', 70
  UNION ALL SELECT 'office-suite', 'export_formats', 'epub', 'EPUB', 'EPUB', 'neutral', 80
  UNION ALL SELECT 'office-suite', 'format_fidelity_tools', 'compatibility_checker', 'Compatibility checker', 'Kompatibilitätsprüfung', 'positive', 10
  UNION ALL SELECT 'office-suite', 'format_fidelity_tools', 'font_substitution_warnings', 'Font substitution warnings', 'Warnungen zu Schrift-Ersetzung', 'positive', 20
  UNION ALL SELECT 'office-suite', 'format_fidelity_tools', 'layout_preservation', 'Layout preservation', 'Layout-Erhalt', 'positive', 30
  UNION ALL SELECT 'office-suite', 'format_fidelity_tools', 'change_summary', 'Change summary', 'Änderungszusammenfassung', 'neutral', 40
  UNION ALL SELECT 'office-suite', 'format_fidelity_tools', 'conversion_report', 'Conversion report', 'Konvertierungsbericht', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'sharing_link_controls', 'view_edit_permissions', 'View/edit permissions', 'Anzeige-/Bearbeitungsrechte', 'positive', 10
  UNION ALL SELECT 'office-suite', 'sharing_link_controls', 'comment_only', 'Comment only', 'Nur Kommentar', 'positive', 20
  UNION ALL SELECT 'office-suite', 'sharing_link_controls', 'password_protected_links', 'Password protected links', 'Passwortgeschützte Links', 'positive', 30
  UNION ALL SELECT 'office-suite', 'sharing_link_controls', 'link_expiration', 'Link expiration', 'Link-Ablauf', 'positive', 40
  UNION ALL SELECT 'office-suite', 'sharing_link_controls', 'download_disable', 'Download disable', 'Download deaktivieren', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'sharing_link_controls', 'domain_restriction', 'Domain restriction', 'Domain-Beschränkung', 'positive', 60
  UNION ALL SELECT 'office-suite', 'sharing_link_controls', 'invite_only', 'Invite only', 'Nur Einladung', 'neutral', 70
  UNION ALL SELECT 'office-suite', 'external_guest_collaboration', 'not_supported', 'Not supported', 'Nicht unterstützt', 'warning', 10
  UNION ALL SELECT 'office-suite', 'external_guest_collaboration', 'public_link_only', 'Public link only', 'Nur öffentlicher Link', 'tradeoff', 20
  UNION ALL SELECT 'office-suite', 'external_guest_collaboration', 'guest_accounts', 'Guest accounts', 'Gastkonten', 'positive', 30
  UNION ALL SELECT 'office-suite', 'external_guest_collaboration', 'account_required', 'Account required', 'Konto erforderlich', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'external_guest_collaboration', 'federated_external', 'Federated external', 'Föderiert extern', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'collaboration_presence', 'presence_indicators', 'Presence indicators', 'Präsenzanzeigen', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'collaboration_presence', 'live_cursors', 'Live cursors', 'Live-Cursor', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'collaboration_presence', 'activity_feed', 'Activity feed', 'Aktivitätsfeed', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'collaboration_presence', 'assignment_mentions', 'Assignment mentions', 'Aufgaben-Erwähnungen', 'positive', 40
  UNION ALL SELECT 'office-suite', 'collaboration_presence', 'notifications', 'Notifications', 'Benachrichtigungen', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'citation_bibliography_tools', 'citations', 'Citations', 'Zitationen', 'positive', 10
  UNION ALL SELECT 'office-suite', 'citation_bibliography_tools', 'bibliography', 'Bibliography', 'Bibliografie', 'positive', 20
  UNION ALL SELECT 'office-suite', 'citation_bibliography_tools', 'zotero_integration', 'Zotero integration', 'Zotero-Integration', 'positive', 30
  UNION ALL SELECT 'office-suite', 'citation_bibliography_tools', 'endnote_integration', 'EndNote integration', 'EndNote-Integration', 'neutral', 40
  UNION ALL SELECT 'office-suite', 'citation_bibliography_tools', 'cross_references', 'Cross-references', 'Querverweise', 'positive', 50
  UNION ALL SELECT 'office-suite', 'citation_bibliography_tools', 'footnotes_endnotes', 'Footnotes/endnotes', 'Fuß-/Endnoten', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'advanced_layout_tools', 'styles', 'Styles', 'Formatvorlagen', 'positive', 10
  UNION ALL SELECT 'office-suite', 'advanced_layout_tools', 'section_layouts', 'Section layouts', 'Abschnittslayouts', 'positive', 20
  UNION ALL SELECT 'office-suite', 'advanced_layout_tools', 'master_pages', 'Master pages', 'Masterseiten', 'positive', 30
  UNION ALL SELECT 'office-suite', 'advanced_layout_tools', 'desktop_publishing', 'Desktop publishing', 'Desktop-Publishing', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'advanced_layout_tools', 'drawing_objects', 'Drawing objects', 'Zeichnungsobjekte', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'advanced_layout_tools', 'mail_merge_fields', 'Mail merge fields', 'Serienbrief-Felder', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'spreadsheet_advanced_features', 'pivot_tables', 'Pivot tables', 'Pivot-Tabellen', 'positive', 10
  UNION ALL SELECT 'office-suite', 'spreadsheet_advanced_features', 'charts', 'Charts', 'Diagramme', 'positive', 20
  UNION ALL SELECT 'office-suite', 'spreadsheet_advanced_features', 'conditional_formatting', 'Conditional formatting', 'Bedingte Formatierung', 'positive', 30
  UNION ALL SELECT 'office-suite', 'spreadsheet_advanced_features', 'data_validation', 'Data validation', 'Datenvalidierung', 'positive', 40
  UNION ALL SELECT 'office-suite', 'spreadsheet_advanced_features', 'solver', 'Solver', 'Solver', 'positive', 50
  UNION ALL SELECT 'office-suite', 'spreadsheet_advanced_features', 'external_data', 'External data', 'Externe Daten', 'tradeoff', 60
  UNION ALL SELECT 'office-suite', 'spreadsheet_advanced_features', 'collaborative_filters', 'Collaborative filters', 'Kollaborative Filter', 'neutral', 70
  UNION ALL SELECT 'office-suite', 'presentation_features', 'speaker_notes', 'Speaker notes', 'Sprechernotizen', 'positive', 10
  UNION ALL SELECT 'office-suite', 'presentation_features', 'presenter_view', 'Presenter view', 'Präsentationsansicht', 'positive', 20
  UNION ALL SELECT 'office-suite', 'presentation_features', 'animations_transitions', 'Animations/transitions', 'Animationen/Übergänge', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'presentation_features', 'master_slides', 'Master slides', 'Masterfolien', 'positive', 40
  UNION ALL SELECT 'office-suite', 'presentation_features', 'recording', 'Recording', 'Aufzeichnung', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'presentation_features', 'live_present', 'Live present', 'Live-Präsentation', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'macro_scripting_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'macro_scripting_model', 'basic_macros', 'Basic macros', 'Basic-Makros', 'positive', 20
  UNION ALL SELECT 'office-suite', 'macro_scripting_model', 'javascript_api', 'JavaScript API', 'JavaScript-API', 'tradeoff', 30
  UNION ALL SELECT 'office-suite', 'macro_scripting_model', 'python_scripting', 'Python scripting', 'Python-Skripting', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'macro_scripting_model', 'vba_compatible', 'VBA compatible', 'VBA-kompatibel', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'macro_scripting_model', 'server_side_automation', 'Server-side automation', 'Serverseitige Automatisierung', 'tradeoff', 60
  UNION ALL SELECT 'office-suite', 'vba_macro_compatibility', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'vba_macro_compatibility', 'partial', 'Partial', 'Teilweise', 'tradeoff', 20
  UNION ALL SELECT 'office-suite', 'vba_macro_compatibility', 'high', 'High', 'Hoch', 'positive', 30
  UNION ALL SELECT 'office-suite', 'vba_macro_compatibility', 'sandboxed_only', 'Sandboxed only', 'Nur Sandbox', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'vba_macro_compatibility', 'blocked_by_policy', 'Blocked by policy', 'Durch Richtlinie blockiert', 'warning', 50
  UNION ALL SELECT 'office-suite', 'deployment_model', 'desktop_only', 'Desktop only', 'Nur Desktop', 'tradeoff', 10
  UNION ALL SELECT 'office-suite', 'deployment_model', 'hosted_saas', 'Hosted SaaS', 'Gehostetes SaaS', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'deployment_model', 'self_hosted_web', 'Self-hosted web', 'Selbstgehostetes Web', 'positive', 30
  UNION ALL SELECT 'office-suite', 'deployment_model', 'hybrid', 'Hybrid', 'Hybrid', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'deployment_model', 'mobile_app_only', 'Mobile app only', 'Nur mobile App', 'warning', 50
  UNION ALL SELECT 'office-suite', 'storage_backend_model', 'local_files', 'Local files', 'Lokale Dateien', 'positive', 10
  UNION ALL SELECT 'office-suite', 'storage_backend_model', 'provider_cloud', 'Provider cloud', 'Anbieter-Cloud', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'storage_backend_model', 'self_hosted_storage', 'Self-hosted storage', 'Selbstgehosteter Speicher', 'positive', 30
  UNION ALL SELECT 'office-suite', 'storage_backend_model', 'external_storage_connector', 'External storage connector', 'Externer Speicher-Konnektor', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'storage_backend_model', 'user_selected_storage', 'User-selected storage', 'Vom Nutzer gewählter Speicher', 'positive', 50
  UNION ALL SELECT 'office-suite', 'role_access_controls', 'viewer_editor_commenter', 'Viewer/editor/commenter', 'Betrachter/Bearbeiter/Kommentator', 'positive', 10
  UNION ALL SELECT 'office-suite', 'role_access_controls', 'owner_admin_roles', 'Owner/admin roles', 'Eigentümer-/Admin-Rollen', 'positive', 20
  UNION ALL SELECT 'office-suite', 'role_access_controls', 'group_permissions', 'Group permissions', 'Gruppenberechtigungen', 'positive', 30
  UNION ALL SELECT 'office-suite', 'role_access_controls', 'document_locking', 'Document locking', 'Dokumentsperre', 'positive', 40
  UNION ALL SELECT 'office-suite', 'role_access_controls', 'folder_workspace_permissions', 'Folder/workspace permissions', 'Ordner-/Arbeitsbereichsrechte', 'positive', 50
  UNION ALL SELECT 'office-suite', 'role_access_controls', 'public_access_controls', 'Public access controls', 'Öffentlichkeitskontrollen', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'client_side_encryption_model', 'none_documented', 'None documented', 'Keine dokumentiert', 'warning', 10
  UNION ALL SELECT 'office-suite', 'client_side_encryption_model', 'transport_at_rest_only', 'Transport/at-rest only', 'Nur Transport/Ruhezustand', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'client_side_encryption_model', 'client_side_optional', 'Client-side optional', 'Clientseitig optional', 'positive', 30
  UNION ALL SELECT 'office-suite', 'client_side_encryption_model', 'client_side_default', 'Client-side default', 'Clientseitig als Standard', 'positive', 40
  UNION ALL SELECT 'office-suite', 'client_side_encryption_model', 'limited_collaboration_when_encrypted', 'Limited collaboration when encrypted', 'Begrenzte Zusammenarbeit bei Verschlüsselung', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'sharing_security_controls', 'passwords', 'Passwords', 'Passwörter', 'positive', 10
  UNION ALL SELECT 'office-suite', 'sharing_security_controls', 'expiration', 'Expiration', 'Ablauf', 'positive', 20
  UNION ALL SELECT 'office-suite', 'sharing_security_controls', 'download_blocking', 'Download blocking', 'Download-Sperre', 'tradeoff', 30
  UNION ALL SELECT 'office-suite', 'sharing_security_controls', 'watermarking', 'Watermarking', 'Wasserzeichen', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'sharing_security_controls', 'domain_allowlist', 'Domain allowlist', 'Domain-Erlaubnisliste', 'positive', 50
  UNION ALL SELECT 'office-suite', 'sharing_security_controls', 'revocation', 'Revocation', 'Widerruf', 'positive', 60
  UNION ALL SELECT 'office-suite', 'dlp_retention_controls', 'retention_policies', 'Retention policies', 'Aufbewahrungsregeln', 'positive', 10
  UNION ALL SELECT 'office-suite', 'dlp_retention_controls', 'legal_hold', 'Legal hold', 'Legal Hold', 'positive', 20
  UNION ALL SELECT 'office-suite', 'dlp_retention_controls', 'dlp_rules', 'DLP rules', 'DLP-Regeln', 'positive', 30
  UNION ALL SELECT 'office-suite', 'dlp_retention_controls', 'classification_labels', 'Classification labels', 'Klassifizierungslabels', 'positive', 40
  UNION ALL SELECT 'office-suite', 'dlp_retention_controls', 'malware_scanning', 'Malware scanning', 'Malware-Scan', 'positive', 50
  UNION ALL SELECT 'office-suite', 'dlp_retention_controls', 'device_session_controls', 'Device/session controls', 'Geräte-/Sitzungskontrollen', 'tradeoff', 60
  UNION ALL SELECT 'office-suite', 'telemetry_control_model', 'undocumented', 'Undocumented', 'Undokumentiert', 'warning', 10
  UNION ALL SELECT 'office-suite', 'telemetry_control_model', 'provider_default', 'Provider default', 'Anbieter-Standard', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'telemetry_control_model', 'opt_out', 'Opt-out', 'Opt-out', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'telemetry_control_model', 'admin_controlled', 'Admin controlled', 'Durch Admin steuerbar', 'positive', 40
  UNION ALL SELECT 'office-suite', 'telemetry_control_model', 'disabled_by_default', 'Disabled by default', 'Standardmäßig deaktiviert', 'positive', 50
  UNION ALL SELECT 'office-suite', 'developer_api', 'document_api', 'Document API', 'Dokument-API', 'positive', 10
  UNION ALL SELECT 'office-suite', 'developer_api', 'admin_api', 'Admin API', 'Admin-API', 'positive', 20
  UNION ALL SELECT 'office-suite', 'developer_api', 'storage_api', 'Storage API', 'Speicher-API', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'developer_api', 'webhooks', 'Webhooks', 'Webhooks', 'positive', 40
  UNION ALL SELECT 'office-suite', 'developer_api', 'sdk', 'SDK', 'SDK', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'extension_plugin_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'extension_plugin_model', 'built_in_extensions', 'Built-in extensions', 'Eingebaute Erweiterungen', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'extension_plugin_model', 'marketplace', 'Marketplace', 'Marktplatz', 'tradeoff', 30
  UNION ALL SELECT 'office-suite', 'extension_plugin_model', 'sideloaded_extensions', 'Sideloaded extensions', 'Manuell installierte Erweiterungen', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'extension_plugin_model', 'admin_managed_addins', 'Admin-managed add-ins', 'Durch Admin verwaltete Add-ins', 'positive', 50
  UNION ALL SELECT 'office-suite', 'cloud_storage_integrations', 'local_files', 'Local files', 'Lokale Dateien', 'positive', 10
  UNION ALL SELECT 'office-suite', 'cloud_storage_integrations', 'webdav', 'WebDAV', 'WebDAV', 'positive', 20
  UNION ALL SELECT 'office-suite', 'cloud_storage_integrations', 'nextcloud_owncloud', 'Nextcloud/ownCloud', 'Nextcloud/ownCloud', 'positive', 30
  UNION ALL SELECT 'office-suite', 'cloud_storage_integrations', 's3_compatible', 'S3-compatible', 'S3-kompatibel', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'cloud_storage_integrations', 'third_party_cloud_drives', 'Third-party cloud drives', 'Drittanbieter-Cloud-Drives', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'cloud_storage_integrations', 'network_shares', 'Network shares', 'Netzwerkfreigaben', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'bulk_import_migration', 'desktop_file_import', 'Desktop file import', 'Desktop-Dateiimport', 'positive', 10
  UNION ALL SELECT 'office-suite', 'bulk_import_migration', 'batch_upload', 'Batch upload', 'Batch-Upload', 'positive', 20
  UNION ALL SELECT 'office-suite', 'bulk_import_migration', 'workspace_import', 'Workspace import', 'Arbeitsbereichsimport', 'positive', 30
  UNION ALL SELECT 'office-suite', 'bulk_import_migration', 'admin_migration_tool', 'Admin migration tool', 'Admin-Migrationswerkzeug', 'positive', 40
  UNION ALL SELECT 'office-suite', 'bulk_import_migration', 'cloud_drive_import', 'Cloud drive import', 'Cloud-Drive-Import', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'standards_interoperability', 'odf', 'ODF', 'ODF', 'positive', 10
  UNION ALL SELECT 'office-suite', 'standards_interoperability', 'ooxml', 'OOXML', 'OOXML', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'standards_interoperability', 'pdf_a', 'PDF/A', 'PDF/A', 'positive', 30
  UNION ALL SELECT 'office-suite', 'standards_interoperability', 'webdav', 'WebDAV', 'WebDAV', 'positive', 40
  UNION ALL SELECT 'office-suite', 'standards_interoperability', 'wopi', 'WOPI', 'WOPI', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'standards_interoperability', 'cmis', 'CMIS', 'CMIS', 'tradeoff', 60
  UNION ALL SELECT 'office-suite', 'accessibility_features', 'keyboard_navigation', 'Keyboard navigation', 'Tastaturnavigation', 'positive', 10
  UNION ALL SELECT 'office-suite', 'accessibility_features', 'screen_reader_labels', 'Screen reader labels', 'Screenreader-Labels', 'positive', 20
  UNION ALL SELECT 'office-suite', 'accessibility_features', 'high_contrast', 'High contrast', 'Hoher Kontrast', 'positive', 30
  UNION ALL SELECT 'office-suite', 'accessibility_features', 'accessibility_checker', 'Accessibility checker', 'Barrierefreiheitsprüfung', 'positive', 40
  UNION ALL SELECT 'office-suite', 'accessibility_features', 'alt_text_tools', 'Alt text tools', 'Alt-Text-Werkzeuge', 'positive', 50
  UNION ALL SELECT 'office-suite', 'accessibility_features', 'document_language_tags', 'Document language tags', 'Dokument-Sprachtags', 'positive', 60
  UNION ALL SELECT 'office-suite', 'language_tools', 'spellcheck', 'Spellcheck', 'Rechtschreibprüfung', 'positive', 10
  UNION ALL SELECT 'office-suite', 'language_tools', 'grammar_check', 'Grammar check', 'Grammatikprüfung', 'neutral', 20
  UNION ALL SELECT 'office-suite', 'language_tools', 'hyphenation', 'Hyphenation', 'Silbentrennung', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'language_tools', 'thesaurus', 'Thesaurus', 'Thesaurus', 'neutral', 40
  UNION ALL SELECT 'office-suite', 'language_tools', 'translation', 'Translation', 'Übersetzung', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'language_tools', 'multilingual_ui', 'Multilingual UI', 'Mehrsprachige UI', 'positive', 60
  UNION ALL SELECT 'office-suite', 'ai_assistance_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'ai_assistance_model', 'local_model', 'Local model', 'Lokales Modell', 'positive', 20
  UNION ALL SELECT 'office-suite', 'ai_assistance_model', 'provider_hosted', 'Provider hosted', 'Beim Anbieter gehostet', 'tradeoff', 30
  UNION ALL SELECT 'office-suite', 'ai_assistance_model', 'third_party_model', 'Third-party model', 'Drittanbieter-Modell', 'warning', 40
  UNION ALL SELECT 'office-suite', 'ai_assistance_model', 'bring_your_own_key', 'Bring your own key', 'Eigener Schlüssel', 'tradeoff', 50
  UNION ALL SELECT 'office-suite', 'ai_assistance_model', 'admin_disable_available', 'Admin disable available', 'Durch Admin deaktivierbar', 'positive', 60
  UNION ALL SELECT 'office-suite', 'fit_profiles', 'personal_offline', 'Personal offline', 'Persönlich offline', 'neutral', 10
  UNION ALL SELECT 'office-suite', 'fit_profiles', 'privacy_sensitive', 'Privacy sensitive', 'Datenschutzsensibel', 'positive', 20
  UNION ALL SELECT 'office-suite', 'fit_profiles', 'team_collaboration', 'Team collaboration', 'Team-Zusammenarbeit', 'neutral', 30
  UNION ALL SELECT 'office-suite', 'fit_profiles', 'self_hosters', 'Self-hosters', 'Selbsthoster', 'tradeoff', 40
  UNION ALL SELECT 'office-suite', 'fit_profiles', 'schools_universities', 'Schools/universities', 'Schulen/Hochschulen', 'neutral', 50
  UNION ALL SELECT 'office-suite', 'fit_profiles', 'enterprises', 'Enterprises', 'Unternehmen', 'neutral', 60
  UNION ALL SELECT 'office-suite', 'fit_profiles', 'ms_office_compatibility', 'MS Office compatibility', 'MS-Office-Kompatibilität', 'tradeoff', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'office-suite'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'office-suite'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('014-office-suite-matrix-criteria');
