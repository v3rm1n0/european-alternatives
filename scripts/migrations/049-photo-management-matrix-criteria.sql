-- Migration 049: Define Photo Management category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('photo-management', 'library_organization', 'Library & Organization', 'Bibliothek & Organisation', 'How users browse, search, and organize their photo library through tagging, albums, and view modes.', 'Wie Nutzer ihre Fotobibliothek mit Verschlagwortung, Alben und Ansichtsmodi durchsuchen und organisieren.', 100),
  ('photo-management', 'storage_backup', 'Storage & Backup', 'Speicher & Backup', 'Where photos are stored, how storage quotas work, and which backup strategies are available.', 'Wo Fotos gespeichert werden, wie Speicherkontingente funktionieren und welche Backup-Strategien verfügbar sind.', 200),
  ('photo-management', 'sharing_collaboration', 'Sharing & Collaboration', 'Teilen & Zusammenarbeit', 'Mechanisms for sharing photos with others through public links, shared albums, and access controls.', 'Mechanismen zum Teilen von Fotos mit anderen über öffentliche Links, geteilte Alben und Zugriffskontrollen.', 300),
  ('photo-management', 'editing_enhancement', 'Editing & Enhancement', 'Bearbeitung & Verbesserung', 'Built-in editing tools, RAW workflow support, and AI-driven enhancement features for photo refinement.', 'Integrierte Bearbeitungswerkzeuge, RAW-Workflow-Unterstützung und KI-gestützte Verbesserungsfunktionen zur Fotooptimierung.', 400),
  ('photo-management', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Operating systems, web access, offline use, and third-party integrations supported by the photo tool.', 'Betriebssysteme, Web-Zugriff, Offline-Nutzung und Drittanbieter-Integrationen, die vom Foto-Werkzeug unterstützt werden.', 500),
  ('photo-management', 'privacy_data', 'Privacy & Data', 'Datenschutz & Daten', 'Data processing jurisdiction, encryption guarantees, and how the tool handles sensitive metadata and accounts.', 'Datenverarbeitungs-Zuständigkeit, Verschlüsselungsgarantien und wie das Werkzeug sensible Metadaten und Konten behandelt.', 600),
  ('photo-management', 'openness_standards', 'Openness & Standards', 'Offenheit & Standards', 'Source code transparency, licensing terms, self-hosting feasibility, and adherence to open photo formats.', 'Quellcode-Transparenz, Lizenzbedingungen, Selbsthosting-Möglichkeit und Einhaltung offener Fotoformate.', 700),
  ('photo-management', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Cost structure, free tier availability, free tier limitations, and target user profiles for the photo tool.', 'Kostenstruktur, Verfügbarkeit der kostenlosen Stufe, deren Einschränkungen und Zielnutzerprofile für das Foto-Werkzeug.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'photo-management' AS category_id, 'library_organization' AS group_key, 'photo_import_sources' AS criterion_key, 'Photo import sources' AS label_en, 'Foto-Importquellen' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Channels through which photos can enter the library, such as mobile capture, desktop apps, or external sources.' AS help_text_en, 'Kanäle, über die Fotos in die Bibliothek gelangen können, zum Beispiel mobile Aufnahme, Desktop-Apps oder externe Quellen.' AS help_text_de
  UNION ALL SELECT 'photo-management', 'library_organization', 'auto_upload_mobile', 'Auto-upload from mobile', 'Auto-Upload vom Mobilgerät', 'boolean', 'beneficial', 'optional', 1020, 'Whether the mobile companion app can automatically back up new photos taken on the device.', 'Ob die mobile Begleit-App neue auf dem Gerät aufgenommene Fotos automatisch sichern kann.'
  UNION ALL SELECT 'photo-management', 'library_organization', 'ai_face_recognition', 'AI face recognition', 'KI-Gesichtserkennung', 'boolean', 'informational', 'optional', 1030, 'Whether the platform groups photos by detected faces using machine-learning models.', 'Ob die Plattform Fotos anhand erkannter Gesichter mit Machine-Learning-Modellen gruppiert.'
  UNION ALL SELECT 'photo-management', 'library_organization', 'object_scene_search', 'Object & scene search', 'Objekt- & Szenensuche', 'boolean', 'informational', 'optional', 1040, 'Whether photos can be searched by detected objects, scenes, or visual content without manual tagging.', 'Ob Fotos anhand erkannter Objekte, Szenen oder visueller Inhalte ohne manuelle Verschlagwortung gesucht werden können.'
  UNION ALL SELECT 'photo-management', 'library_organization', 'album_organization_model', 'Album organization model', 'Album-Organisationsmodell', 'enum', 'informational', 'optional', 1050, 'How albums are created and maintained in the library, from manual curation to smart automatic grouping.', 'Wie Alben in der Bibliothek erstellt und gepflegt werden, von manueller Kuration bis zu intelligenter automatischer Gruppierung.'
  UNION ALL SELECT 'photo-management', 'library_organization', 'map_view_geotagging', 'Map view / geotagging', 'Kartenansicht / Geotagging', 'boolean', 'informational', 'optional', 1060, 'Whether photos can be browsed on a map view based on embedded geolocation metadata.', 'Ob Fotos in einer Kartenansicht basierend auf eingebetteten Geolokalisierungs-Metadaten durchsucht werden können.'
  UNION ALL SELECT 'photo-management', 'library_organization', 'timeline_view', 'Timeline view', 'Zeitachsen-Ansicht', 'boolean', 'informational', 'optional', 1070, 'Whether the library offers a chronological timeline view for browsing photos by capture date.', 'Ob die Bibliothek eine chronologische Zeitachsen-Ansicht zum Durchsuchen von Fotos nach Aufnahmedatum bietet.'
  UNION ALL SELECT 'photo-management', 'library_organization', 'duplicate_detection', 'Duplicate detection', 'Duplikaterkennung', 'boolean', 'beneficial', 'optional', 1080, 'Whether the tool identifies and helps deduplicate visually similar or identical photos in the library.', 'Ob das Werkzeug visuell ähnliche oder identische Fotos in der Bibliothek identifiziert und beim Deduplizieren hilft.'
  UNION ALL SELECT 'photo-management', 'storage_backup', 'storage_type', 'Storage type', 'Speichertyp', 'enum', 'tradeoff', 'must_match', 2010, 'The fundamental storage architecture of the service, from pure cloud hosting to fully self-hosted deployments.', 'Die grundlegende Speicherarchitektur des Dienstes, von reinem Cloud-Hosting bis zu vollständig selbstgehosteten Bereitstellungen.'
  UNION ALL SELECT 'photo-management', 'storage_backup', 'storage_quota_model', 'Storage quota model', 'Speicherkontingent-Modell', 'enum', 'tradeoff', 'optional', 2020, 'How storage capacity is allocated and charged to users, including unlimited and tiered options.', 'Wie Speicherkapazität zugewiesen und Nutzern berechnet wird, einschließlich unbegrenzter und gestaffelter Optionen.'
  UNION ALL SELECT 'photo-management', 'storage_backup', 'original_quality_preservation', 'Original quality preservation', 'Erhalt der Originalqualität', 'boolean', 'beneficial', 'optional', 2030, 'Whether the service stores uploaded photos in their original quality without recompression.', 'Ob der Dienst hochgeladene Fotos in ihrer Originalqualität ohne erneute Komprimierung speichert.'
  UNION ALL SELECT 'photo-management', 'storage_backup', 'backup_strategy', 'Backup strategy', 'Backup-Strategie', 'multi_enum', 'informational', 'multi_select', 2040, 'Available approaches for safeguarding the photo library against loss through multiple copies or sync.', 'Verfügbare Ansätze zum Schutz der Fotobibliothek vor Verlust durch mehrere Kopien oder Synchronisation.'
  UNION ALL SELECT 'photo-management', 'storage_backup', 'file_versioning', 'File versioning', 'Datei-Versionierung', 'boolean', 'informational', 'optional', 2050, 'Whether the tool keeps prior versions of edited photos so earlier states can be restored.', 'Ob das Werkzeug frühere Versionen bearbeiteter Fotos aufbewahrt, sodass ein früherer Zustand wiederhergestellt werden kann.'
  UNION ALL SELECT 'photo-management', 'storage_backup', 'trash_recovery', 'Trash / recovery', 'Papierkorb / Wiederherstellung', 'boolean', 'beneficial', 'optional', 2060, 'Whether deleted photos can be recovered from a trash or recycle bin within a retention window.', 'Ob gelöschte Fotos innerhalb eines Aufbewahrungsfensters aus einem Papierkorb wiederhergestellt werden können.'
  UNION ALL SELECT 'photo-management', 'sharing_collaboration', 'public_link_sharing', 'Public link sharing', 'Öffentliches Link-Teilen', 'boolean', 'informational', 'optional', 3010, 'Whether photos or albums can be shared via public hyperlinks accessible without an account.', 'Ob Fotos oder Alben über öffentliche Hyperlinks geteilt werden können, die ohne Konto zugänglich sind.'
  UNION ALL SELECT 'photo-management', 'sharing_collaboration', 'shared_albums', 'Shared albums', 'Geteilte Alben', 'boolean', 'beneficial', 'optional', 3020, 'Whether multiple users can contribute to and view the same album with synchronized updates.', 'Ob mehrere Nutzer zum selben Album beitragen und es mit synchronisierten Aktualisierungen ansehen können.'
  UNION ALL SELECT 'photo-management', 'sharing_collaboration', 'family_sharing', 'Family sharing / multi-user', 'Familien-Teilen / Mehrbenutzer', 'boolean', 'beneficial', 'optional', 3030, 'Whether the service includes household plans or multi-user accounts for family or group use.', 'Ob der Dienst Haushaltspläne oder Mehrbenutzerkonten für Familien- oder Gruppennutzung umfasst.'
  UNION ALL SELECT 'photo-management', 'sharing_collaboration', 'access_control_model', 'Access control model', 'Zugriffskontrollmodell', 'enum', 'informational', 'optional', 3040, 'How access to shared photos and albums is restricted through passwords, roles, or expiry rules.', 'Wie der Zugriff auf geteilte Fotos und Alben durch Passwörter, Rollen oder Ablaufregeln eingeschränkt wird.'
  UNION ALL SELECT 'photo-management', 'sharing_collaboration', 'external_sharing_platforms', 'External sharing platforms', 'Externe Teilen-Plattformen', 'multi_enum', 'informational', 'multi_select', 3050, 'Outbound channels supported for sharing photos to other services like social media or email.', 'Ausgehende Kanäle zum Teilen von Fotos an andere Dienste wie soziale Medien oder E-Mail.'
  UNION ALL SELECT 'photo-management', 'editing_enhancement', 'built_in_editor', 'Built-in editor', 'Integrierter Editor', 'boolean', 'informational', 'optional', 4010, 'Whether the platform includes an integrated photo editor without needing external software.', 'Ob die Plattform einen integrierten Foto-Editor enthält, ohne dass externe Software benötigt wird.'
  UNION ALL SELECT 'photo-management', 'editing_enhancement', 'editing_capabilities', 'Editing capabilities', 'Bearbeitungsfunktionen', 'multi_enum', 'informational', 'multi_select', 4020, 'The categories of editing operations the built-in editor supports, from crop to non-destructive edits.', 'Die Kategorien von Bearbeitungsoperationen, die der integrierte Editor unterstützt, von Zuschnitt bis hin zu nicht-destruktiven Bearbeitungen.'
  UNION ALL SELECT 'photo-management', 'editing_enhancement', 'raw_format_support', 'RAW format support', 'RAW-Format-Unterstützung', 'boolean', 'informational', 'must_match', 4030, 'Whether the platform can ingest, render, and process camera RAW files end-to-end.', 'Ob die Plattform Kamera-RAW-Dateien durchgängig aufnehmen, darstellen und verarbeiten kann.'
  UNION ALL SELECT 'photo-management', 'editing_enhancement', 'ai_enhancement', 'AI enhancement features', 'KI-Verbesserungsfunktionen', 'boolean', 'informational', 'optional', 4040, 'Whether the tool offers AI-powered enhancement features such as upscaling, denoising, or auto-fix.', 'Ob das Werkzeug KI-gestützte Verbesserungsfunktionen wie Hochskalierung, Rauschunterdrückung oder Auto-Korrektur bietet.'
  UNION ALL SELECT 'photo-management', 'editing_enhancement', 'video_support', 'Video support', 'Video-Unterstützung', 'boolean', 'informational', 'optional', 4050, 'Whether the photo tool also stores, plays, and manages video clips alongside still images.', 'Ob das Foto-Werkzeug auch Videoclips neben Standbildern speichert, abspielt und verwaltet.'
  UNION ALL SELECT 'photo-management', 'platform_access', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'Operating systems and device types on which the photo tool has native applications.', 'Betriebssysteme und Gerätetypen, für die das Foto-Werkzeug native Anwendungen bietet.'
  UNION ALL SELECT 'photo-management', 'platform_access', 'web_access', 'Web access', 'Web-Zugriff', 'boolean', 'beneficial', 'optional', 5020, 'Whether the photo library can be browsed and managed entirely through a web browser.', 'Ob die Fotobibliothek vollständig über einen Webbrowser durchsucht und verwaltet werden kann.'
  UNION ALL SELECT 'photo-management', 'platform_access', 'offline_access', 'Offline access', 'Offline-Zugriff', 'boolean', 'beneficial', 'optional', 5030, 'Whether photos can be viewed and worked with while the device has no network connection.', 'Ob Fotos angesehen und bearbeitet werden können, während das Gerät keine Netzwerkverbindung hat.'
  UNION ALL SELECT 'photo-management', 'platform_access', 'api_available', 'API available', 'API verfügbar', 'boolean', 'beneficial', 'optional', 5040, 'Whether the platform exposes a public API for automation, scripting, and external integrations.', 'Ob die Plattform eine öffentliche API für Automatisierung, Skripting und externe Integrationen bereitstellt.'
  UNION ALL SELECT 'photo-management', 'platform_access', 'third_party_integrations', 'Third-party integrations', 'Drittanbieter-Integrationen', 'multi_enum', 'informational', 'multi_select', 5050, 'Which external storage systems and protocols the tool integrates with for sync or backup.', 'Mit welchen externen Speichersystemen und Protokollen sich das Werkzeug für Synchronisation oder Backup verbindet.'
  UNION ALL SELECT 'photo-management', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsort', 'enum', 'tradeoff', 'must_match', 6010, 'The geographic region where photo uploads and account data are processed and stored.', 'Die geografische Region, in der Foto-Uploads und Kontodaten verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'photo-management', 'privacy_data', 'encryption_model', 'Encryption model', 'Verschlüsselungsmodell', 'enum', 'tradeoff', 'optional', 6020, 'The encryption guarantees protecting photos from unauthorized access in transit and at rest.', 'Die Verschlüsselungsgarantien, die Fotos vor unbefugtem Zugriff bei der Übertragung und Speicherung schützen.'
  UNION ALL SELECT 'photo-management', 'privacy_data', 'face_recognition_privacy', 'Face recognition privacy', 'Datenschutz der Gesichtserkennung', 'enum', 'risk', 'optional', 6030, 'Where facial-recognition processing happens and how privacy-preserving the implementation is.', 'Wo die Gesichtserkennungs-Verarbeitung stattfindet und wie datenschutzfreundlich die Implementierung ist.'
  UNION ALL SELECT 'photo-management', 'privacy_data', 'metadata_stripping_sharing', 'Metadata stripping on sharing', 'Metadaten-Entfernung beim Teilen', 'boolean', 'beneficial', 'optional', 6040, 'Whether sensitive EXIF metadata such as GPS coordinates is removed when photos are shared externally.', 'Ob sensible EXIF-Metadaten wie GPS-Koordinaten beim externen Teilen von Fotos entfernt werden.'
  UNION ALL SELECT 'photo-management', 'privacy_data', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 6050, 'Whether using the photo tool requires creating an account with the provider.', 'Ob die Nutzung des Foto-Werkzeugs die Erstellung eines Kontos beim Anbieter erfordert.'
  UNION ALL SELECT 'photo-management', 'privacy_data', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 6060, 'Whether users can export their full library, including originals and metadata, in standard formats.', 'Ob Nutzer ihre vollständige Bibliothek, einschließlich Originale und Metadaten, in Standardformaten exportieren können.'
  UNION ALL SELECT 'photo-management', 'openness_standards', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'The openness of the underlying source code, from fully open to closed proprietary releases.', 'Die Offenheit des zugrundeliegenden Quellcodes, von vollständig offen bis hin zu geschlossenen proprietären Versionen.'
  UNION ALL SELECT 'photo-management', 'openness_standards', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7020, 'The software license that governs redistribution and modification of the photo tool.', 'Die Softwarelizenz, die die Weitergabe und Änderung des Foto-Werkzeugs regelt.'
  UNION ALL SELECT 'photo-management', 'openness_standards', 'self_hosting_available', 'Self-hosting available', 'Selbsthosting verfügbar', 'boolean', 'beneficial', 'must_match', 7030, 'Whether the photo platform can be installed and operated on user-controlled infrastructure.', 'Ob die Foto-Plattform auf nutzergesteuerter Infrastruktur installiert und betrieben werden kann.'
  UNION ALL SELECT 'photo-management', 'openness_standards', 'photo_format_support', 'Photo format support', 'Foto-Format-Unterstützung', 'multi_enum', 'informational', 'multi_select', 7040, 'Which image file formats the tool accepts for upload and displays without conversion.', 'Welche Bilddatei-Formate das Werkzeug zum Hochladen akzeptiert und ohne Konvertierung anzeigt.'
  UNION ALL SELECT 'photo-management', 'openness_standards', 'export_format_options', 'Export format options', 'Export-Formatoptionen', 'multi_enum', 'informational', 'multi_select', 7050, 'The output formats and bundle structures available when exporting the library or albums.', 'Die Ausgabeformate und Paketstrukturen, die beim Exportieren der Bibliothek oder von Alben verfügbar sind.'
  UNION ALL SELECT 'photo-management', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'The cost structure of the photo tool, from free to subscription to one-time purchase.', 'Die Kostenstruktur des Foto-Werkzeugs, von kostenlos über Abonnement bis zum Einmalkauf.'
  UNION ALL SELECT 'photo-management', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'must_match', 8020, 'Whether the photo tool offers a non-trial free tier usable for everyday photo management.', 'Ob das Foto-Werkzeug eine dauerhaft kostenlose Stufe bietet, die für die tägliche Foto-Verwaltung nutzbar ist.'
  UNION ALL SELECT 'photo-management', 'pricing_fit', 'free_tier_limitations', 'Free tier limitations', 'Einschränkungen der kostenlosen Stufe', 'multi_enum', 'tradeoff', 'multi_select', 8030, 'The restrictions imposed on the free tier compared to the paid versions of the photo tool.', 'Die Einschränkungen, die für die kostenlose Stufe im Vergleich zu den kostenpflichtigen Versionen des Foto-Werkzeugs gelten.'
  UNION ALL SELECT 'photo-management', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'User profiles and use cases the photo tool is best matched to based on its overall feature set.', 'Nutzerprofile und Anwendungsfälle, für die das Foto-Werkzeug aufgrund seines Gesamtfunktionsumfangs am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'photo-management' AS category_id, 'photo_import_sources' AS criterion_key, 'mobile_app' AS option_key, 'Mobile app upload' AS label_en, 'Mobile-App-Upload' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'photo-management', 'photo_import_sources', 'desktop_app', 'Desktop app upload', 'Desktop-App-Upload', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'photo_import_sources', 'web_upload', 'Web upload', 'Web-Upload', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'photo_import_sources', 'folder_sync', 'Folder sync', 'Ordner-Synchronisation', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'photo_import_sources', 's3_compatible', 'S3-compatible source', 'S3-kompatible Quelle', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'photo_import_sources', 'cloud_import', 'Cloud import', 'Cloud-Import', 'neutral', 60
  UNION ALL SELECT 'photo-management', 'album_organization_model', 'manual_only', 'Manual only', 'Nur manuell', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'album_organization_model', 'auto_generated', 'Auto-generated', 'Automatisch generiert', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'album_organization_model', 'smart_albums', 'Smart albums', 'Intelligente Alben', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'album_organization_model', 'folder_based', 'Folder-based', 'Ordnerbasiert', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'storage_type', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'storage_type', 'self_hosted', 'Self-hosted', 'Selbstgehostet', 'positive', 20
  UNION ALL SELECT 'photo-management', 'storage_type', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'storage_type', 'local_device', 'Local device', 'Lokales Gerät', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'storage_quota_model', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'photo-management', 'storage_quota_model', 'tiered', 'Tiered', 'Gestaffelt', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'storage_quota_model', 'pay_per_use', 'Pay-per-use', 'Nutzungsbasiert', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'storage_quota_model', 'fixed', 'Fixed', 'Fest', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'backup_strategy', 'automatic_cloud', 'Automatic cloud', 'Automatische Cloud', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'backup_strategy', 'local_backup', 'Local backup', 'Lokales Backup', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'backup_strategy', 'nas_sync', 'NAS sync', 'NAS-Synchronisation', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'backup_strategy', 'redundant_copies', 'Redundant copies', 'Redundante Kopien', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'backup_strategy', 'export_archive', 'Export archive', 'Export-Archiv', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'access_control_model', 'password_protected', 'Password-protected', 'Passwortgeschützt', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'access_control_model', 'role_based', 'Role-based', 'Rollenbasiert', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'access_control_model', 'link_expiry', 'Link expiry', 'Link-Ablauf', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'access_control_model', 'view_only', 'View only', 'Nur Ansicht', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'external_sharing_platforms', 'social_media', 'Social media', 'Soziale Medien', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'external_sharing_platforms', 'email', 'Email', 'E-Mail', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'external_sharing_platforms', 'embed', 'Embed', 'Einbetten', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'external_sharing_platforms', 'direct_download', 'Direct download', 'Direkter Download', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'editing_capabilities', 'crop_rotate', 'Crop & rotate', 'Zuschneiden & drehen', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'editing_capabilities', 'exposure_color', 'Exposure & color', 'Belichtung & Farbe', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'editing_capabilities', 'filters_presets', 'Filters & presets', 'Filter & Voreinstellungen', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'editing_capabilities', 'retouching', 'Retouching', 'Retusche', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'editing_capabilities', 'batch_editing', 'Batch editing', 'Stapelbearbeitung', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'editing_capabilities', 'non_destructive', 'Non-destructive edits', 'Nicht-destruktive Bearbeitung', 'neutral', 60
  UNION ALL SELECT 'photo-management', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'photo-management', 'third_party_integrations', 'nextcloud', 'Nextcloud', 'Nextcloud', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'third_party_integrations', 'synology', 'Synology', 'Synology', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'third_party_integrations', 'nas_systems', 'NAS systems', 'NAS-Systeme', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'third_party_integrations', 'webdav', 'WebDAV', 'WebDAV', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'third_party_integrations', 's3', 'S3 storage', 'S3-Speicher', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'photo-management', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primär', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'photo-management', 'data_processing_location', 'local', 'Local', 'Lokal', 'positive', 40
  UNION ALL SELECT 'photo-management', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 50
  UNION ALL SELECT 'photo-management', 'encryption_model', 'end_to_end', 'End-to-end', 'Ende-zu-Ende', 'positive', 10
  UNION ALL SELECT 'photo-management', 'encryption_model', 'at_rest', 'At rest', 'Bei der Speicherung', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'encryption_model', 'in_transit_only', 'In-transit only', 'Nur bei Übertragung', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'encryption_model', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'photo-management', 'face_recognition_privacy', 'on_device', 'On-device', 'Auf dem Gerät', 'positive', 10
  UNION ALL SELECT 'photo-management', 'face_recognition_privacy', 'server_side_private', 'Server-side private', 'Server-seitig privat', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'face_recognition_privacy', 'cloud_processed', 'Cloud-processed', 'Cloud-verarbeitet', 'warning', 30
  UNION ALL SELECT 'photo-management', 'face_recognition_privacy', 'not_available', 'Not available', 'Nicht verfügbar', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'source_code_model', 'fully_open', 'Fully open', 'Vollständig offen', 'positive', 10
  UNION ALL SELECT 'photo-management', 'source_code_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'source_code_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'photo-management', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'license_type', 'mpl', 'MPL', 'MPL', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'license_type', 'proprietary', 'Proprietary license', 'Proprietäre Lizenz', 'neutral', 60
  UNION ALL SELECT 'photo-management', 'photo_format_support', 'jpeg', 'JPEG', 'JPEG', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'photo_format_support', 'png', 'PNG', 'PNG', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'photo_format_support', 'heif_heic', 'HEIF / HEIC', 'HEIF / HEIC', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'photo_format_support', 'webp', 'WebP', 'WebP', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'photo_format_support', 'raw', 'RAW', 'RAW', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'photo_format_support', 'avif', 'AVIF', 'AVIF', 'neutral', 60
  UNION ALL SELECT 'photo-management', 'photo_format_support', 'tiff', 'TIFF', 'TIFF', 'neutral', 70
  UNION ALL SELECT 'photo-management', 'export_format_options', 'original_format', 'Original format', 'Originalformat', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'export_format_options', 'zip_archive', 'ZIP archive', 'ZIP-Archiv', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'export_format_options', 'google_takeout_compatible', 'Google Takeout compatible', 'Google-Takeout-kompatibel', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'export_format_options', 'standard_folders', 'Standard folders', 'Standardordner', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'photo-management', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'pricing_model', 'donation_based', 'Donation-based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'free_tier_limitations', 'storage_cap', 'Storage cap', 'Speicherbegrenzung', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'free_tier_limitations', 'feature_limited', 'Feature-limited', 'Funktionsbegrenzt', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'free_tier_limitations', 'ads', 'Ads', 'Werbung', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'free_tier_limitations', 'watermarks', 'Watermarks', 'Wasserzeichen', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'free_tier_limitations', 'no_sharing', 'No sharing', 'Kein Teilen', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'fit_profiles', 'casual_user', 'Casual user', 'Gelegenheitsnutzer', 'neutral', 10
  UNION ALL SELECT 'photo-management', 'fit_profiles', 'photography_enthusiast', 'Photography enthusiast', 'Foto-Enthusiast', 'neutral', 20
  UNION ALL SELECT 'photo-management', 'fit_profiles', 'professional_photographer', 'Professional photographer', 'Profi-Fotograf', 'neutral', 30
  UNION ALL SELECT 'photo-management', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 40
  UNION ALL SELECT 'photo-management', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 50
  UNION ALL SELECT 'photo-management', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzorientiert', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'photo-management'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'photo-management'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('049-photo-management-matrix-criteria');
