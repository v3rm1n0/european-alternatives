-- Migration 026: Define translation category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('translation', 'language_support', 'Language Support', 'Sprachunterstuetzung', 'Languages supported, German availability, rare language coverage, auto-detection, and pair restrictions.', 'Unterstuetzte Sprachen, Deutsch-Verfuegbarkeit, seltene Sprachen, automatische Erkennung und Paareinschraenkungen.', 100),
  ('translation', 'translation_capabilities', 'Translation Capabilities', 'Uebersetzungsfunktionen', 'Engine type, formality control, context awareness, real-time, website, and speech translation.', 'Engine-Typ, Foermlichkeitssteuerung, Kontextbewusstsein, Echtzeit-, Website- und Sprachuebersetzung.', 200),
  ('translation', 'input_output', 'Input & Output', 'Eingabe & Ausgabe', 'Document translation, file format support, image/OCR, batch processing, and character limits.', 'Dokumentenuebersetzung, Dateiformatunterstuetzung, Bild/OCR, Stapelverarbeitung und Zeichenlimits.', 300),
  ('translation', 'quality_customization', 'Quality & Customization', 'Qualitaet & Anpassung', 'Custom glossaries, translation memory, alternative suggestions, quality indicators, and domain specialization.', 'Benutzerdefinierte Glossare, Uebersetzungsspeicher, alternative Vorschlaege, Qualitaetsindikatoren und Fachgebietsspezialisierung.', 400),
  ('translation', 'integration_access', 'Integration & Access', 'Integration & Zugriff', 'API access, browser extension, platform support, CAT tool integration, and offline capability.', 'API-Zugriff, Browser-Erweiterung, Plattformunterstuetzung, CAT-Tool-Integration und Offline-Faehigkeit.', 500),
  ('translation', 'privacy_data', 'Privacy & Data Handling', 'Datenschutz & Datenverarbeitung', 'Text data retention, AI training policies, self-hosting, data processing location, and encryption.', 'Textdatenspeicherung, KI-Trainingsrichtlinien, Self-Hosting, Datenverarbeitungsstandort und Verschluesselung.', 600),
  ('translation', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Source code model, security audits, license type, and community contributions.', 'Quellcode-Modell, Sicherheitsaudits, Lizenztyp und Community-Beitraege.', 700),
  ('translation', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Free tier availability, pricing model, and target user profiles.', 'Verfuegbarkeit kostenloser Stufen, Preismodell und Zielgruppenprofile.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'translation' AS category_id, 'language_support' AS group_key, 'supported_language_count' AS criterion_key, 'Supported languages' AS label_en, 'Unterstuetzte Sprachen' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'How many languages are supported for translation.' AS help_text_en, 'Wie viele Sprachen fuer die Uebersetzung unterstuetzt werden.' AS help_text_de
  UNION ALL SELECT 'translation', 'language_support', 'german_support', 'German language support', 'Deutsche Sprachunterstuetzung', 'boolean', 'beneficial', 'must_match', 1020, 'Whether the German language is supported as source and target.', 'Ob die deutsche Sprache als Quell- und Zielsprache unterstuetzt wird.'
  UNION ALL SELECT 'translation', 'language_support', 'rare_language_support', 'Rare/less-common languages', 'Seltene/weniger verbreitete Sprachen', 'boolean', 'informational', 'optional', 1030, 'Whether rare or less-commonly spoken languages are available.', 'Ob seltene oder weniger verbreitete Sprachen verfuegbar sind.'
  UNION ALL SELECT 'translation', 'language_support', 'language_auto_detection', 'Automatic language detection', 'Automatische Spracherkennung', 'boolean', 'beneficial', 'optional', 1040, 'Whether the source language is automatically detected.', 'Ob die Quellsprache automatisch erkannt wird.'
  UNION ALL SELECT 'translation', 'language_support', 'language_pair_restrictions', 'Language pair restrictions', 'Sprachpaar-Einschraenkungen', 'enum', 'tradeoff', 'optional', 1050, 'Whether all language pairs are direct or require pivoting through English.', 'Ob alle Sprachpaare direkt sind oder ein Pivot ueber Englisch erfordern.'
  UNION ALL SELECT 'translation', 'translation_capabilities', 'translation_engine', 'Translation engine type', 'Uebersetzungs-Engine-Typ', 'enum', 'informational', 'optional', 2010, 'The underlying technology used for translation.', 'Die zugrundeliegende Technologie fuer die Uebersetzung.'
  UNION ALL SELECT 'translation', 'translation_capabilities', 'formality_control', 'Formality/tone control', 'Foermlichkeits-/Tonsteuerung', 'boolean', 'beneficial', 'optional', 2020, 'Whether formal or informal register can be selected.', 'Ob ein formeller oder informeller Stil gewaehlt werden kann.'
  UNION ALL SELECT 'translation', 'translation_capabilities', 'context_awareness', 'Context-aware translation', 'Kontextbewusste Uebersetzung', 'enum', 'informational', 'optional', 2030, 'Whether the engine considers surrounding context for better translations.', 'Ob die Engine den umgebenden Kontext fuer bessere Uebersetzungen beruecksichtigt.'
  UNION ALL SELECT 'translation', 'translation_capabilities', 'real_time_translation', 'Real-time/live translation', 'Echtzeit-/Live-Uebersetzung', 'boolean', 'informational', 'optional', 2040, 'Whether text is translated as you type.', 'Ob Text waehrend der Eingabe uebersetzt wird.'
  UNION ALL SELECT 'translation', 'translation_capabilities', 'website_translation', 'Full website/URL translation', 'Vollstaendige Website-/URL-Uebersetzung', 'boolean', 'informational', 'optional', 2050, 'Whether entire web pages can be translated by URL.', 'Ob ganze Webseiten per URL uebersetzt werden koennen.'
  UNION ALL SELECT 'translation', 'translation_capabilities', 'speech_translation', 'Speech/voice translation', 'Sprach-/Stimmuebersetzung', 'boolean', 'informational', 'optional', 2060, 'Whether voice or spoken language input is supported.', 'Ob Sprach- oder gesprochene Eingabe unterstuetzt wird.'
  UNION ALL SELECT 'translation', 'input_output', 'document_translation', 'Document file translation', 'Dokumentdatei-Uebersetzung', 'boolean', 'beneficial', 'optional', 3010, 'Whether uploaded document files can be translated.', 'Ob hochgeladene Dokumentdateien uebersetzt werden koennen.'
  UNION ALL SELECT 'translation', 'input_output', 'supported_file_formats', 'Supported file formats', 'Unterstuetzte Dateiformate', 'multi_enum', 'informational', 'multi_select', 3020, 'Which document file formats are accepted for translation.', 'Welche Dokumentformate fuer die Uebersetzung akzeptiert werden.'
  UNION ALL SELECT 'translation', 'input_output', 'image_translation', 'Image/OCR translation', 'Bild-/OCR-Uebersetzung', 'boolean', 'informational', 'optional', 3030, 'Whether text in images can be recognized and translated.', 'Ob Text in Bildern erkannt und uebersetzt werden kann.'
  UNION ALL SELECT 'translation', 'input_output', 'batch_translation', 'Batch/bulk translation', 'Stapel-/Massenuebersetzung', 'boolean', 'informational', 'optional', 3040, 'Whether multiple texts or files can be translated at once.', 'Ob mehrere Texte oder Dateien gleichzeitig uebersetzt werden koennen.'
  UNION ALL SELECT 'translation', 'input_output', 'character_limit', 'Character limit per request', 'Zeichenlimit pro Anfrage', 'enum', 'tradeoff', 'optional', 3050, 'The maximum number of characters per translation request.', 'Die maximale Zeichenanzahl pro Uebersetzungsanfrage.'
  UNION ALL SELECT 'translation', 'quality_customization', 'glossary_support', 'Custom glossary/terminology', 'Benutzerdefiniertes Glossar/Terminologie', 'boolean', 'beneficial', 'optional', 4010, 'Whether custom terminology and glossaries can be defined.', 'Ob benutzerdefinierte Terminologie und Glossare erstellt werden koennen.'
  UNION ALL SELECT 'translation', 'quality_customization', 'translation_memory', 'Translation memory', 'Uebersetzungsspeicher', 'boolean', 'beneficial', 'optional', 4020, 'Whether previously translated segments are reused.', 'Ob zuvor uebersetzte Segmente wiederverwendet werden.'
  UNION ALL SELECT 'translation', 'quality_customization', 'alternative_translations', 'Alternative translation suggestions', 'Alternative Uebersetzungsvorschlaege', 'boolean', 'informational', 'optional', 4030, 'Whether multiple translation options are shown.', 'Ob mehrere Uebersetzungsoptionen angezeigt werden.'
  UNION ALL SELECT 'translation', 'quality_customization', 'quality_estimation', 'Translation quality indicators', 'Uebersetzungsqualitaetsindikatoren', 'boolean', 'informational', 'optional', 4040, 'Whether translation quality scores or indicators are provided.', 'Ob Uebersetzungsqualitaetsbewertungen oder -indikatoren bereitgestellt werden.'
  UNION ALL SELECT 'translation', 'quality_customization', 'domain_specialization', 'Domain specialization', 'Fachgebietsspezialisierung', 'multi_enum', 'informational', 'multi_select', 4050, 'Whether specialized models for specific fields are available.', 'Ob spezialisierte Modelle fuer bestimmte Fachgebiete verfuegbar sind.'
  UNION ALL SELECT 'translation', 'integration_access', 'api_available', 'API available', 'API verfuegbar', 'boolean', 'beneficial', 'must_match', 5010, 'Whether a programmatic API is available for integration.', 'Ob eine programmatische API fuer die Integration verfuegbar ist.'
  UNION ALL SELECT 'translation', 'integration_access', 'browser_extension', 'Browser extension', 'Browser-Erweiterung', 'boolean', 'beneficial', 'optional', 5020, 'Whether a browser extension is available for inline translation.', 'Ob eine Browser-Erweiterung fuer Inline-Uebersetzung verfuegbar ist.'
  UNION ALL SELECT 'translation', 'integration_access', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 5030, 'Which operating systems and platforms are supported.', 'Welche Betriebssysteme und Plattformen unterstuetzt werden.'
  UNION ALL SELECT 'translation', 'integration_access', 'cat_tool_integration', 'CAT tool integration', 'CAT-Tool-Integration', 'boolean', 'informational', 'optional', 5040, 'Whether integration with professional CAT tools is supported.', 'Ob die Integration mit professionellen CAT-Tools unterstuetzt wird.'
  UNION ALL SELECT 'translation', 'integration_access', 'offline_capability', 'Offline capability', 'Offline-Faehigkeit', 'boolean', 'beneficial', 'optional', 5050, 'Whether translation works without an internet connection.', 'Ob die Uebersetzung ohne Internetverbindung funktioniert.'
  UNION ALL SELECT 'translation', 'privacy_data', 'text_data_retention', 'Text data retention', 'Textdatenspeicherung', 'enum', 'risk', 'must_match', 6010, 'How long submitted text is retained by the service.', 'Wie lange eingereichter Text vom Dienst gespeichert wird.'
  UNION ALL SELECT 'translation', 'privacy_data', 'ai_training_on_user_data', 'AI training on user data', 'KI-Training mit Nutzerdaten', 'boolean', 'risk', 'must_match', 6020, 'Whether submitted text is used to train AI models.', 'Ob eingereichter Text zum Trainieren von KI-Modellen verwendet wird.'
  UNION ALL SELECT 'translation', 'privacy_data', 'on_premise_option', 'On-premise or self-hosted option', 'Vor-Ort- oder Self-Hosting-Option', 'boolean', 'tradeoff', 'optional', 6030, 'Whether the tool can be self-hosted on own infrastructure.', 'Ob das Tool auf eigener Infrastruktur betrieben werden kann.'
  UNION ALL SELECT 'translation', 'privacy_data', 'gdpr_data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'optional', 6040, 'Where text data is processed geographically.', 'Wo Textdaten geographisch verarbeitet werden.'
  UNION ALL SELECT 'translation', 'privacy_data', 'encryption_in_transit', 'Encryption in transit', 'Verschluesselung bei Uebertragung', 'boolean', 'beneficial', 'optional', 6050, 'Whether data is encrypted during transmission.', 'Ob Daten waehrend der Uebertragung verschluesselt werden.'
  UNION ALL SELECT 'translation', 'openness_audit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'Whether the source code is open source, available, or proprietary.', 'Ob der Quellcode quelloffen, verfuegbar oder proprietaer ist.'
  UNION ALL SELECT 'translation', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhaengiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 7020, 'Whether an independent security audit has been completed.', 'Ob ein unabhaengiges Sicherheitsaudit abgeschlossen wurde.'
  UNION ALL SELECT 'translation', 'openness_audit', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7030, 'The software license under which the product is distributed.', 'Die Softwarelizenz, unter der das Produkt vertrieben wird.'
  UNION ALL SELECT 'translation', 'openness_audit', 'community_contributions', 'Community contributions accepted', 'Community-Beitraege akzeptiert', 'boolean', 'informational', 'optional', 7040, 'Whether external contributions are accepted.', 'Ob externe Beitraege akzeptiert werden.'
  UNION ALL SELECT 'translation', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfuegbar', 'boolean', 'informational', 'optional', 8010, 'Whether a free usage tier is available.', 'Ob eine kostenlose Nutzungsstufe verfuegbar ist.'
  UNION ALL SELECT 'translation', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8020, 'The pricing model used by the service.', 'Das vom Dienst verwendete Preismodell.'
  UNION ALL SELECT 'translation', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8030, 'Target user profiles the tool is designed for.', 'Zielnutzerprofile, fuer die das Tool konzipiert ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'translation' AS category_id, 'supported_language_count' AS criterion_key, 'under_ten' AS option_key, 'Under 10 languages' AS label_en, 'Unter 10 Sprachen' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'translation', 'supported_language_count', 'ten_to_thirty', '10-30 languages', '10-30 Sprachen', 'neutral', 20
  UNION ALL SELECT 'translation', 'supported_language_count', 'thirty_to_hundred', '30-100 languages', '30-100 Sprachen', 'neutral', 30
  UNION ALL SELECT 'translation', 'supported_language_count', 'hundred_plus', '100+ languages', '100+ Sprachen', 'neutral', 40
  UNION ALL SELECT 'translation', 'language_pair_restrictions', 'all_direct', 'All pairs direct', 'Alle Paare direkt', 'positive', 10
  UNION ALL SELECT 'translation', 'language_pair_restrictions', 'mostly_direct', 'Mostly direct', 'Ueberwiegend direkt', 'neutral', 20
  UNION ALL SELECT 'translation', 'language_pair_restrictions', 'pivot_required', 'Pivot through English', 'Pivot ueber Englisch', 'tradeoff', 30
  UNION ALL SELECT 'translation', 'language_pair_restrictions', 'limited_pairs', 'Limited language pairs', 'Begrenzte Sprachpaare', 'warning', 40
  UNION ALL SELECT 'translation', 'translation_engine', 'neural_mt', 'Neural machine translation', 'Neuronale maschinelle Uebersetzung', 'neutral', 10
  UNION ALL SELECT 'translation', 'translation_engine', 'rule_based', 'Rule-based', 'Regelbasiert', 'neutral', 20
  UNION ALL SELECT 'translation', 'translation_engine', 'hybrid', 'Hybrid (neural + rules)', 'Hybrid (neuronal + Regeln)', 'neutral', 30
  UNION ALL SELECT 'translation', 'translation_engine', 'llm_based', 'LLM-based', 'LLM-basiert', 'neutral', 40
  UNION ALL SELECT 'translation', 'context_awareness', 'sentence_level', 'Sentence-level only', 'Nur Satzebene', 'neutral', 10
  UNION ALL SELECT 'translation', 'context_awareness', 'paragraph_level', 'Paragraph-level', 'Absatzebene', 'neutral', 20
  UNION ALL SELECT 'translation', 'context_awareness', 'document_level', 'Document-level', 'Dokumentebene', 'neutral', 30
  UNION ALL SELECT 'translation', 'supported_file_formats', 'pdf', 'PDF', 'PDF', 'neutral', 10
  UNION ALL SELECT 'translation', 'supported_file_formats', 'docx', 'Word (DOCX)', 'Word (DOCX)', 'neutral', 20
  UNION ALL SELECT 'translation', 'supported_file_formats', 'pptx', 'PowerPoint (PPTX)', 'PowerPoint (PPTX)', 'neutral', 30
  UNION ALL SELECT 'translation', 'supported_file_formats', 'xlsx', 'Excel (XLSX)', 'Excel (XLSX)', 'neutral', 40
  UNION ALL SELECT 'translation', 'supported_file_formats', 'html', 'HTML', 'HTML', 'neutral', 50
  UNION ALL SELECT 'translation', 'supported_file_formats', 'txt', 'Plain text (TXT)', 'Reintext (TXT)', 'neutral', 60
  UNION ALL SELECT 'translation', 'supported_file_formats', 'xliff', 'XLIFF', 'XLIFF', 'neutral', 70
  UNION ALL SELECT 'translation', 'supported_file_formats', 'srt_subtitles', 'Subtitles (SRT/VTT)', 'Untertitel (SRT/VTT)', 'neutral', 80
  UNION ALL SELECT 'translation', 'character_limit', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'translation', 'character_limit', 'over_10k', 'Over 10,000 characters', 'Ueber 10.000 Zeichen', 'neutral', 20
  UNION ALL SELECT 'translation', 'character_limit', 'five_to_10k', '5,000-10,000 characters', '5.000-10.000 Zeichen', 'neutral', 30
  UNION ALL SELECT 'translation', 'character_limit', 'under_5k', 'Under 5,000 characters', 'Unter 5.000 Zeichen', 'warning', 40
  UNION ALL SELECT 'translation', 'domain_specialization', 'legal', 'Legal', 'Recht', 'neutral', 10
  UNION ALL SELECT 'translation', 'domain_specialization', 'medical', 'Medical', 'Medizin', 'neutral', 20
  UNION ALL SELECT 'translation', 'domain_specialization', 'technical', 'Technical', 'Technik', 'neutral', 30
  UNION ALL SELECT 'translation', 'domain_specialization', 'financial', 'Financial', 'Finanzen', 'neutral', 40
  UNION ALL SELECT 'translation', 'domain_specialization', 'marketing', 'Marketing', 'Marketing', 'neutral', 50
  UNION ALL SELECT 'translation', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'translation', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'translation', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'translation', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'translation', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'translation', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'translation', 'text_data_retention', 'no_retention', 'No retention', 'Keine Speicherung', 'positive', 10
  UNION ALL SELECT 'translation', 'text_data_retention', 'session_only', 'Session only', 'Nur Sitzung', 'neutral', 20
  UNION ALL SELECT 'translation', 'text_data_retention', 'short_term', 'Short-term', 'Kurzfristig', 'neutral', 30
  UNION ALL SELECT 'translation', 'text_data_retention', 'long_term', 'Long-term', 'Langfristig', 'warning', 40
  UNION ALL SELECT 'translation', 'text_data_retention', 'unspecified', 'Unspecified', 'Nicht spezifiziert', 'tradeoff', 50
  UNION ALL SELECT 'translation', 'gdpr_data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'translation', 'gdpr_data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'translation', 'gdpr_data_processing_location', 'global', 'Global', 'Global', 'neutral', 30
  UNION ALL SELECT 'translation', 'gdpr_data_processing_location', 'unspecified', 'Unspecified', 'Nicht spezifiziert', 'tradeoff', 40
  UNION ALL SELECT 'translation', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'translation', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'translation', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'translation', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'translation', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 10
  UNION ALL SELECT 'translation', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 20
  UNION ALL SELECT 'translation', 'license_type', 'apache', 'Apache', 'Apache', 'neutral', 30
  UNION ALL SELECT 'translation', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 40
  UNION ALL SELECT 'translation', 'license_type', 'bsd', 'BSD', 'BSD', 'neutral', 50
  UNION ALL SELECT 'translation', 'license_type', 'other_osi', 'Other OSI', 'Anderes OSI', 'neutral', 60
  UNION ALL SELECT 'translation', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 70
  UNION ALL SELECT 'translation', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'translation', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'translation', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'translation', 'pricing_model', 'pay_per_use', 'Pay per use', 'Nutzungsbasiert', 'neutral', 40
  UNION ALL SELECT 'translation', 'pricing_model', 'donation_based', 'Donation based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'translation', 'fit_profiles', 'casual_user', 'Casual user', 'Gelegenheitsnutzer', 'neutral', 10
  UNION ALL SELECT 'translation', 'fit_profiles', 'professional_translator', 'Professional translator', 'Professioneller Uebersetzer', 'neutral', 20
  UNION ALL SELECT 'translation', 'fit_profiles', 'business', 'Business', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'translation', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 40
  UNION ALL SELECT 'translation', 'fit_profiles', 'student', 'Student', 'Student', 'neutral', 50
  UNION ALL SELECT 'translation', 'fit_profiles', 'content_creator', 'Content creator', 'Inhaltsersteller', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'translation'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'translation'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('026-translation-matrix-criteria');
