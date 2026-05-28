-- Migration 025: Define Writing Assistant category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('writing-assistant', 'language_coverage', 'Language & Coverage', 'Sprachen & Abdeckung', 'Which languages and dialects are supported and at what depth.', 'Welche Sprachen und Dialekte in welcher Tiefe unterstützt werden.', 100),
  ('writing-assistant', 'writing_features', 'Writing Assistance Features', 'Schreibhilfe-Funktionen', 'Core writing assistance capabilities: grammar, spelling, style, tone, and advanced features.', 'Kernfunktionen der Schreibhilfe: Grammatik, Rechtschreibung, Stil, Ton und erweiterte Funktionen.', 200),
  ('writing-assistant', 'ai_processing', 'AI & Processing Model', 'KI & Verarbeitungsmodell', 'How text analysis is performed, whether locally or in the cloud, and what AI technologies are used.', 'Wie die Textanalyse durchgeführt wird, ob lokal oder in der Cloud, und welche KI-Technologien verwendet werden.', 300),
  ('writing-assistant', 'integration_access', 'Integration & Access', 'Integration & Zugriff', 'Where the writing assistant can be used: browser, office suite, desktop, mobile, API.', 'Wo die Schreibhilfe verwendet werden kann: Browser, Office-Paket, Desktop, Mobil, API.', 400),
  ('writing-assistant', 'privacy_data', 'Privacy & Data Handling', 'Datenschutz & Datenverarbeitung', 'How user text is processed, stored, and protected.', 'Wie Nutzertexte verarbeitet, gespeichert und geschützt werden.', 500),
  ('writing-assistant', 'customization', 'Customization & Teams', 'Anpassung & Teams', 'Personal dictionaries, style guides, terminology, team collaboration, and domain presets.', 'Persönliche Wörterbücher, Stilrichtlinien, Terminologie, Team-Zusammenarbeit und Fachbereichs-Vorlagen.', 600),
  ('writing-assistant', 'output_quality', 'Output & Feedback Quality', 'Ausgabe- & Feedback-Qualität', 'Quality and depth of suggestions, explanations, and correction behavior.', 'Qualität und Tiefe der Vorschläge, Erklärungen und Korrekturverhalten.', 700),
  ('writing-assistant', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Source code openness, security audits, and licensing.', 'Quellcode-Offenheit, Sicherheitsaudits und Lizenzierung.', 800),
  ('writing-assistant', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model and target user profiles.', 'Preismodell und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'writing-assistant' AS category_id, 'language_coverage' AS group_key, 'supported_languages_count' AS criterion_key, 'Supported languages' AS label_en, 'Unterstützte Sprachen' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'How many languages the writing assistant supports.' AS help_text_en, 'Wie viele Sprachen die Schreibhilfe unterstützt.' AS help_text_de
  UNION ALL SELECT 'writing-assistant', 'language_coverage', 'german_support', 'German language support', 'Deutsche Sprachunterstützung', 'boolean', 'beneficial', 'must_match', 1020, 'Whether German language checking is supported.', 'Ob deutsche Sprachprüfung unterstützt wird.'
  UNION ALL SELECT 'writing-assistant', 'language_coverage', 'language_depth_model', 'Language check depth', 'Sprachprüfungstiefe', 'enum', 'tradeoff', 'optional', 1030, 'Depth of language analysis from basic spelling to full linguistic analysis.', 'Tiefe der Sprachanalyse von einfacher Rechtschreibung bis zur vollständigen linguistischen Analyse.'
  UNION ALL SELECT 'writing-assistant', 'language_coverage', 'dialect_variant_support', 'Dialect and variant support', 'Dialekt- und Variantenunterstützung', 'boolean', 'beneficial', 'optional', 1040, 'Whether regional dialects and language variants are supported.', 'Ob regionale Dialekte und Sprachvarianten unterstützt werden.'
  UNION ALL SELECT 'writing-assistant', 'language_coverage', 'specialized_terminology', 'Specialized terminology support', 'Unterstützung für Fachterminologie', 'boolean', 'informational', 'optional', 1050, 'Whether specialized terminology for medical, legal, or technical fields is supported.', 'Ob Fachterminologie für medizinische, juristische oder technische Bereiche unterstützt wird.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'grammar_checking', 'Grammar checking', 'Grammatikprüfung', 'boolean', 'beneficial', 'must_match', 2010, 'Whether grammar checking is available.', 'Ob Grammatikprüfung verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'spelling_checking', 'Spelling checking', 'Rechtschreibprüfung', 'boolean', 'beneficial', 'must_match', 2020, 'Whether spelling checking is available.', 'Ob Rechtschreibprüfung verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'style_suggestions', 'Style suggestions', 'Stilvorschläge', 'boolean', 'beneficial', 'optional', 2030, 'Whether writing style suggestions are provided.', 'Ob Stilvorschläge für das Schreiben bereitgestellt werden.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'tone_detection', 'Tone detection', 'Tonerkennung', 'boolean', 'informational', 'optional', 2040, 'Whether the tone of writing is detected and reported.', 'Ob der Ton des Geschriebenen erkannt und angezeigt wird.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'readability_scoring', 'Readability scoring', 'Lesbarkeits-Bewertung', 'boolean', 'informational', 'optional', 2050, 'Whether readability metrics are calculated.', 'Ob Lesbarkeitskennzahlen berechnet werden.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'plagiarism_detection', 'Plagiarism detection', 'Plagiatserkennung', 'boolean', 'informational', 'optional', 2060, 'Whether plagiarism detection is available.', 'Ob Plagiatserkennung verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'paraphrasing_tool', 'Paraphrasing or rewrite tool', 'Umschreibungs- oder Umformulierungswerkzeug', 'boolean', 'informational', 'optional', 2070, 'Whether a paraphrasing or rewrite tool is available.', 'Ob ein Umschreibungs- oder Umformulierungswerkzeug verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'writing_features', 'auto_correction', 'Auto-correction', 'Autokorrektur', 'boolean', 'tradeoff', 'optional', 2080, 'Whether automatic correction without user confirmation is available.', 'Ob automatische Korrektur ohne Nutzerbestätigung verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'ai_processing', 'processing_model', 'Processing model', 'Verarbeitungsmodell', 'enum', 'tradeoff', 'must_match', 3010, 'Whether text is processed in the cloud, locally, or with a hybrid approach.', 'Ob Text in der Cloud, lokal oder mit einem hybriden Ansatz verarbeitet wird.'
  UNION ALL SELECT 'writing-assistant', 'ai_processing', 'llm_powered', 'LLM-powered features', 'LLM-basierte Funktionen', 'boolean', 'tradeoff', 'optional', 3020, 'Whether large language models are used for text analysis.', 'Ob große Sprachmodelle für die Textanalyse verwendet werden.'
  UNION ALL SELECT 'writing-assistant', 'ai_processing', 'offline_capability', 'Offline capability', 'Offline-Fähigkeit', 'boolean', 'beneficial', 'optional', 3030, 'Whether the tool can work without an internet connection.', 'Ob das Tool ohne Internetverbindung funktioniert.'
  UNION ALL SELECT 'writing-assistant', 'ai_processing', 'ai_training_on_user_data', 'AI training on user data', 'KI-Training mit Nutzerdaten', 'boolean', 'risk', 'must_match', 3040, 'Whether user text is used to train AI models.', 'Ob Nutzertexte zum Training von KI-Modellen verwendet werden.'
  UNION ALL SELECT 'writing-assistant', 'integration_access', 'browser_extension', 'Browser extension', 'Browser-Erweiterung', 'boolean', 'beneficial', 'optional', 4010, 'Whether a browser extension is available.', 'Ob eine Browser-Erweiterung verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'integration_access', 'office_suite_integration', 'Office suite integration', 'Office-Paket-Integration', 'multi_enum', 'informational', 'multi_select', 4020, 'Which office suites are supported.', 'Welche Office-Pakete unterstützt werden.'
  UNION ALL SELECT 'writing-assistant', 'integration_access', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 4030, 'Which operating systems are supported.', 'Welche Betriebssysteme unterstützt werden.'
  UNION ALL SELECT 'writing-assistant', 'integration_access', 'mobile_keyboard', 'Mobile keyboard app', 'Mobile Tastatur-App', 'boolean', 'informational', 'optional', 4040, 'Whether a mobile keyboard integration is available.', 'Ob eine mobile Tastatur-Integration verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'integration_access', 'api_available', 'API available', 'API verfügbar', 'boolean', 'beneficial', 'optional', 4050, 'Whether a developer API is available.', 'Ob eine Entwickler-API verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'integration_access', 'web_editor', 'Web editor', 'Web-Editor', 'boolean', 'beneficial', 'optional', 4060, 'Whether a standalone web-based editor is provided.', 'Ob ein eigenständiger webbasierter Editor bereitgestellt wird.'
  UNION ALL SELECT 'writing-assistant', 'privacy_data', 'text_data_retention', 'Text data retention', 'Textdaten-Speicherung', 'enum', 'risk', 'must_match', 5010, 'How long user text is stored server-side.', 'Wie lange Nutzertexte serverseitig gespeichert werden.'
  UNION ALL SELECT 'writing-assistant', 'privacy_data', 'encryption_in_transit', 'Encryption in transit', 'Verschlüsselung bei Übertragung', 'boolean', 'beneficial', 'optional', 5020, 'Whether text is encrypted during transmission.', 'Ob Texte bei der Übertragung verschlüsselt werden.'
  UNION ALL SELECT 'writing-assistant', 'privacy_data', 'on_premise_option', 'On-premise or self-hosted option', 'On-Premise- oder Self-Hosted-Option', 'boolean', 'tradeoff', 'optional', 5030, 'Whether an on-premise or self-hosted deployment is available.', 'Ob eine On-Premise- oder Self-Hosted-Installation verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'privacy_data', 'gdpr_data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'optional', 5040, 'Where user text data is processed geographically.', 'Wo Nutzertextdaten geographisch verarbeitet werden.'
  UNION ALL SELECT 'writing-assistant', 'customization', 'personal_dictionary', 'Personal dictionary', 'Persönliches Wörterbuch', 'boolean', 'beneficial', 'optional', 6010, 'Whether a personal dictionary for custom words is available.', 'Ob ein persönliches Wörterbuch für benutzerdefinierte Wörter verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'customization', 'style_guide_support', 'Style guide support', 'Stilrichtlinien-Unterstützung', 'boolean', 'beneficial', 'optional', 6020, 'Whether custom or predefined style guides are supported.', 'Ob benutzerdefinierte oder vordefinierte Stilrichtlinien unterstützt werden.'
  UNION ALL SELECT 'writing-assistant', 'customization', 'team_shared_rules', 'Team-shared rules', 'Team-geteilte Regeln', 'boolean', 'informational', 'optional', 6030, 'Whether shared rules and dictionaries for teams are supported.', 'Ob geteilte Regeln und Wörterbücher für Teams unterstützt werden.'
  UNION ALL SELECT 'writing-assistant', 'customization', 'terminology_database', 'Terminology database', 'Terminologie-Datenbank', 'boolean', 'informational', 'optional', 6040, 'Whether a terminology database for managing approved terms is available.', 'Ob eine Terminologie-Datenbank zur Verwaltung genehmigter Begriffe verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'customization', 'genre_domain_presets', 'Genre or domain presets', 'Genre- oder Fachbereichs-Vorlagen', 'boolean', 'informational', 'optional', 6050, 'Whether presets for academic, business, creative, or technical writing are available.', 'Ob Vorlagen für akademisches, geschäftliches, kreatives oder technisches Schreiben verfügbar sind.'
  UNION ALL SELECT 'writing-assistant', 'output_quality', 'explanation_depth', 'Explanation depth', 'Erklärungstiefe', 'enum', 'tradeoff', 'optional', 7010, 'How detailed the rule explanations for corrections are.', 'Wie detailliert die Regelerklärungen für Korrekturen sind.'
  UNION ALL SELECT 'writing-assistant', 'output_quality', 'suggestion_categories', 'Suggestion categories shown', 'Angezeigte Vorschlagskategorien', 'multi_enum', 'informational', 'multi_select', 7020, 'Which categories of suggestions are shown to the user.', 'Welche Kategorien von Vorschlägen dem Nutzer angezeigt werden.'
  UNION ALL SELECT 'writing-assistant', 'output_quality', 'confidence_indicators', 'Confidence indicators', 'Konfidenzindikatoren', 'boolean', 'informational', 'optional', 7030, 'Whether the tool shows certainty levels for suggestions.', 'Ob das Tool Sicherheitsstufen für Vorschläge anzeigt.'
  UNION ALL SELECT 'writing-assistant', 'output_quality', 'statistics_reporting', 'Writing statistics or reports', 'Schreibstatistiken oder Berichte', 'boolean', 'informational', 'optional', 7040, 'Whether writing statistics or improvement reports are provided.', 'Ob Schreibstatistiken oder Verbesserungsberichte bereitgestellt werden.'
  UNION ALL SELECT 'writing-assistant', 'openness_audit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The openness model of the source code.', 'Das Offenheitsmodell des Quellcodes.'
  UNION ALL SELECT 'writing-assistant', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhängiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 8020, 'Whether an independent security audit has been completed.', 'Ob ein unabhängiges Sicherheitsaudit durchgeführt wurde.'
  UNION ALL SELECT 'writing-assistant', 'openness_audit', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 8030, 'The software license under which the tool is distributed.', 'Die Softwarelizenz, unter der das Tool vertrieben wird.'
  UNION ALL SELECT 'writing-assistant', 'openness_audit', 'community_contributions', 'Community contributions accepted', 'Community-Beiträge akzeptiert', 'boolean', 'informational', 'optional', 8040, 'Whether external contributions are accepted.', 'Ob externe Beiträge akzeptiert werden.'
  UNION ALL SELECT 'writing-assistant', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 9010, 'Whether a free tier is available without payment requirements.', 'Ob eine kostenlose Nutzungsstufe ohne Zahlungspflicht verfügbar ist.'
  UNION ALL SELECT 'writing-assistant', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9020, 'The pricing model used by the tool.', 'Das vom Tool verwendete Preismodell.'
  UNION ALL SELECT 'writing-assistant', 'pricing_fit', 'premium_features_scope', 'Premium features scope', 'Umfang der Premium-Funktionen', 'enum', 'informational', 'optional', 9030, 'Which features require a paid subscription.', 'Welche Funktionen ein kostenpflichtiges Abonnement erfordern.'
  UNION ALL SELECT 'writing-assistant', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Common user profiles the tool is well suited for.', 'Typische Nutzerprofile, für die das Tool gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'writing-assistant' AS category_id, 'supported_languages_count' AS criterion_key, 'single_language' AS option_key, 'Single language' AS label_en, 'Einzelne Sprache' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'writing-assistant', 'supported_languages_count', 'two_to_five', '2-5 languages', '2-5 Sprachen', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'supported_languages_count', 'six_to_twenty', '6-20 languages', '6-20 Sprachen', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'supported_languages_count', 'twenty_plus', '20+ languages', '20+ Sprachen', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'language_depth_model', 'spelling_only', 'Spelling only', 'Nur Rechtschreibung', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'language_depth_model', 'grammar_basic', 'Basic grammar', 'Grundlegende Grammatik', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'language_depth_model', 'grammar_advanced', 'Advanced grammar and style', 'Erweiterte Grammatik und Stil', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'language_depth_model', 'full_linguistic', 'Full linguistic analysis', 'Vollständige linguistische Analyse', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'processing_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'processing_model', 'local_only', 'Local only', 'Nur lokal', 'positive', 20
  UNION ALL SELECT 'writing-assistant', 'processing_model', 'hybrid', 'Hybrid (local + cloud)', 'Hybrid (lokal + Cloud)', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'processing_model', 'user_choice', 'User choice', 'Nutzerwahl', 'positive', 40
  UNION ALL SELECT 'writing-assistant', 'office_suite_integration', 'microsoft_word', 'Microsoft Word', 'Microsoft Word', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'office_suite_integration', 'google_docs', 'Google Docs', 'Google Docs', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'office_suite_integration', 'libreoffice', 'LibreOffice', 'LibreOffice', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'office_suite_integration', 'apple_pages', 'Apple Pages', 'Apple Pages', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'office_suite_integration', 'outlook_email', 'Outlook/Email', 'Outlook/E-Mail', 'neutral', 50
  UNION ALL SELECT 'writing-assistant', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'writing-assistant', 'text_data_retention', 'no_retention', 'No retention', 'Keine Speicherung', 'positive', 10
  UNION ALL SELECT 'writing-assistant', 'text_data_retention', 'session_only', 'Session only', 'Nur Sitzung', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'text_data_retention', 'short_term', 'Short-term', 'Kurzfristig', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'text_data_retention', 'long_term', 'Long-term', 'Langfristig', 'warning', 40
  UNION ALL SELECT 'writing-assistant', 'text_data_retention', 'unspecified', 'Unspecified', 'Nicht spezifiziert', 'tradeoff', 50
  UNION ALL SELECT 'writing-assistant', 'gdpr_data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'writing-assistant', 'gdpr_data_processing_location', 'eu_primary', 'EU primary', 'EU primär', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'gdpr_data_processing_location', 'global', 'Global', 'Global', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'gdpr_data_processing_location', 'unspecified', 'Unspecified', 'Nicht spezifiziert', 'tradeoff', 40
  UNION ALL SELECT 'writing-assistant', 'explanation_depth', 'correction_only', 'Correction only', 'Nur Korrektur', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'explanation_depth', 'brief_explanation', 'Brief explanation', 'Kurze Erklärung', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'explanation_depth', 'detailed_rules', 'Detailed rules', 'Detaillierte Regeln', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'explanation_depth', 'learning_oriented', 'Learning-oriented', 'Lernorientiert', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'suggestion_categories', 'grammar', 'Grammar', 'Grammatik', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'suggestion_categories', 'spelling', 'Spelling', 'Rechtschreibung', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'suggestion_categories', 'style', 'Style', 'Stil', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'suggestion_categories', 'clarity', 'Clarity', 'Klarheit', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'suggestion_categories', 'conciseness', 'Conciseness', 'Prägnanz', 'neutral', 50
  UNION ALL SELECT 'writing-assistant', 'suggestion_categories', 'tone', 'Tone', 'Tonalität', 'neutral', 60
  UNION ALL SELECT 'writing-assistant', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'writing-assistant', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'writing-assistant', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'license_type', 'apache', 'Apache', 'Apache', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'license_type', 'bsd', 'BSD', 'BSD', 'neutral', 50
  UNION ALL SELECT 'writing-assistant', 'license_type', 'other_osi', 'Other OSI', 'Anderes OSI', 'neutral', 60
  UNION ALL SELECT 'writing-assistant', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 70
  UNION ALL SELECT 'writing-assistant', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'pricing_model', 'donation_based', 'Donation based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'writing-assistant', 'premium_features_scope', 'all_free', 'All free', 'Alles kostenlos', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'premium_features_scope', 'advanced_checks_paid', 'Advanced checks paid', 'Erweiterte Prüfungen kostenpflichtig', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'premium_features_scope', 'team_features_paid', 'Team features paid', 'Team-Funktionen kostenpflichtig', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'premium_features_scope', 'enterprise_only', 'Enterprise only', 'Nur Unternehmen', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'fit_profiles', 'student', 'Student', 'Student', 'neutral', 10
  UNION ALL SELECT 'writing-assistant', 'fit_profiles', 'professional_writer', 'Professional writer', 'Professioneller Autor', 'neutral', 20
  UNION ALL SELECT 'writing-assistant', 'fit_profiles', 'business', 'Business', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'writing-assistant', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 40
  UNION ALL SELECT 'writing-assistant', 'fit_profiles', 'language_learner', 'Language learner', 'Sprachlernender', 'neutral', 50
  UNION ALL SELECT 'writing-assistant', 'fit_profiles', 'team', 'Team', 'Team', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'writing-assistant'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'writing-assistant'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('025-writing-assistant-matrix-criteria');
