-- Migration 026: Define AI/ML (Large Language Models) category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('ai-ml', 'model_capabilities', 'Model Capabilities', 'Modellfähigkeiten', 'What the model can do: context window, modalities, languages, reasoning, and code generation.', 'Was das Modell kann: Kontextfenster, Modalitäten, Sprachen, logisches Denken und Code-Generierung.', 100),
  ('ai-ml', 'privacy_data', 'Privacy & Data Handling', 'Datenschutz & Datenverarbeitung', 'How user data and conversations are handled, stored, and protected.', 'Wie Nutzerdaten und Unterhaltungen verarbeitet, gespeichert und geschützt werden.', 200),
  ('ai-ml', 'pricing_access', 'Pricing & Access', 'Preise & Zugang', 'Pricing models, free tiers, and API availability.', 'Preismodelle, kostenlose Stufen und API-Verfügbarkeit.', 300),
  ('ai-ml', 'integration_ecosystem', 'Integration & Ecosystem', 'Integration & Ökosystem', 'Platform support, plugins, third-party integrations, and API compatibility.', 'Plattformunterstützung, Plugins, Drittanbieter-Integrationen und API-Kompatibilität.', 400),
  ('ai-ml', 'safety_alignment', 'Safety & Alignment', 'Sicherheit & Ausrichtung', 'Content filtering, safety documentation, and output attribution.', 'Inhaltsfilterung, Sicherheitsdokumentation und Ausgabezuordnung.', 500),
  ('ai-ml', 'performance_reliability', 'Performance & Reliability', 'Leistung & Zuverlässigkeit', 'Response speed, uptime guarantees, and streaming support.', 'Antwortgeschwindigkeit, Verfügbarkeitsgarantien und Streaming-Unterstützung.', 600),
  ('ai-ml', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Model weights availability, security audits, licensing, and model cards.', 'Verfügbarkeit der Modellgewichte, Sicherheitsaudits, Lizenzierung und Modellkarten.', 700),
  ('ai-ml', 'fit_use_cases', 'Fit & Use Cases', 'Eignung & Anwendungsfälle', 'Which user profiles the model is best suited for.', 'Für welche Nutzerprofile das Modell am besten geeignet ist.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'ai-ml' AS category_id, 'model_capabilities' AS group_key, 'context_window_size' AS criterion_key, 'Context window size' AS label_en, 'Kontextfenstergröße' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'Maximum number of tokens the model can process in a single request.' AS help_text_en, 'Maximale Anzahl an Tokens, die das Modell in einer einzelnen Anfrage verarbeiten kann.' AS help_text_de
  UNION ALL SELECT 'ai-ml', 'model_capabilities', 'supported_modalities', 'Supported modalities', 'Unterstützte Modalitäten', 'multi_enum', 'informational', 'multi_select', 1020, 'Input and output types supported by the model.', 'Vom Modell unterstützte Ein- und Ausgabetypen.'
  UNION ALL SELECT 'ai-ml', 'model_capabilities', 'multilingual_support', 'Multilingual support', 'Mehrsprachige Unterstützung', 'enum', 'informational', 'optional', 1030, 'Breadth and depth of language support beyond English.', 'Breite und Tiefe der Sprachunterstützung über Englisch hinaus.'
  UNION ALL SELECT 'ai-ml', 'model_capabilities', 'reasoning_capability', 'Reasoning capability', 'Schlussfolgerungsfähigkeit', 'boolean', 'informational', 'optional', 1040, 'Whether the model supports advanced reasoning or chain-of-thought.', 'Ob das Modell erweitertes logisches Denken oder Gedankenketten unterstützt.'
  UNION ALL SELECT 'ai-ml', 'model_capabilities', 'code_generation', 'Code generation', 'Code-Generierung', 'boolean', 'informational', 'optional', 1050, 'Whether the model can generate and analyze source code.', 'Ob das Modell Quellcode generieren und analysieren kann.'
  UNION ALL SELECT 'ai-ml', 'model_capabilities', 'fine_tuning_support', 'Fine-tuning support', 'Feinabstimmungs-Unterstützung', 'boolean', 'informational', 'optional', 1060, 'Whether users can fine-tune the model on custom data.', 'Ob Nutzer das Modell mit eigenen Daten feinabstimmen können.'
  UNION ALL SELECT 'ai-ml', 'privacy_data', 'training_data_transparency', 'Training data transparency', 'Trainingsdaten-Transparenz', 'enum', 'tradeoff', 'optional', 2010, 'How transparent the provider is about training data sources.', 'Wie transparent der Anbieter bezüglich der Trainingsdatenquellen ist.'
  UNION ALL SELECT 'ai-ml', 'privacy_data', 'user_data_retention', 'User data retention', 'Nutzerdaten-Speicherung', 'enum', 'risk', 'must_match', 2020, 'How long user inputs and conversations are stored.', 'Wie lange Nutzereingaben und Unterhaltungen gespeichert werden.'
  UNION ALL SELECT 'ai-ml', 'privacy_data', 'on_premise_option', 'On-premise or self-hosted option', 'On-Premise- oder Self-Hosted-Option', 'boolean', 'tradeoff', 'optional', 2030, 'Whether the model can be deployed on-premise or self-hosted.', 'Ob das Modell vor Ort oder selbst gehostet betrieben werden kann.'
  UNION ALL SELECT 'ai-ml', 'privacy_data', 'gdpr_data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'optional', 2040, 'Where user data is processed geographically.', 'Wo Nutzerdaten geographisch verarbeitet werden.'
  UNION ALL SELECT 'ai-ml', 'privacy_data', 'ai_training_on_user_data', 'AI training on user data', 'KI-Training mit Nutzerdaten', 'boolean', 'risk', 'must_match', 2050, 'Whether user inputs are used to train or improve AI models.', 'Ob Nutzereingaben zum Training oder zur Verbesserung von KI-Modellen verwendet werden.'
  UNION ALL SELECT 'ai-ml', 'privacy_data', 'conversation_history_control', 'Conversation history control', 'Unterhaltungsverlauf-Kontrolle', 'boolean', 'beneficial', 'optional', 2060, 'Whether users can view, export, or delete their conversation history.', 'Ob Nutzer ihren Unterhaltungsverlauf einsehen, exportieren oder löschen können.'
  UNION ALL SELECT 'ai-ml', 'pricing_access', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 3010, 'The pricing model used by the provider.', 'Das vom Anbieter verwendete Preismodell.'
  UNION ALL SELECT 'ai-ml', 'pricing_access', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 3020, 'Whether a free tier is available without payment.', 'Ob eine kostenlose Nutzungsstufe ohne Zahlung verfügbar ist.'
  UNION ALL SELECT 'ai-ml', 'pricing_access', 'api_access', 'API access', 'API-Zugang', 'boolean', 'beneficial', 'optional', 3030, 'Whether a developer API is available for programmatic access.', 'Ob eine Entwickler-API für programmatischen Zugang verfügbar ist.'
  UNION ALL SELECT 'ai-ml', 'pricing_access', 'rate_limits_transparency', 'Rate limits transparency', 'Ratenlimit-Transparenz', 'boolean', 'informational', 'optional', 3040, 'Whether rate limits and usage quotas are clearly documented.', 'Ob Ratenlimits und Nutzungskontingente klar dokumentiert sind.'
  UNION ALL SELECT 'ai-ml', 'integration_ecosystem', 'plugin_ecosystem', 'Plugin or extension ecosystem', 'Plugin- oder Erweiterungs-Ökosystem', 'boolean', 'informational', 'optional', 4010, 'Whether a plugin or extension ecosystem exists.', 'Ob ein Plugin- oder Erweiterungs-Ökosystem existiert.'
  UNION ALL SELECT 'ai-ml', 'integration_ecosystem', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 4020, 'Which platforms the model is available on.', 'Auf welchen Plattformen das Modell verfügbar ist.'
  UNION ALL SELECT 'ai-ml', 'integration_ecosystem', 'third_party_integrations', 'Third-party integrations', 'Drittanbieter-Integrationen', 'boolean', 'informational', 'optional', 4030, 'Whether integrations with third-party tools and services are available.', 'Ob Integrationen mit Drittanbieter-Werkzeugen und -Diensten verfügbar sind.'
  UNION ALL SELECT 'ai-ml', 'integration_ecosystem', 'api_standard_compatibility', 'API standard compatibility', 'API-Standard-Kompatibilität', 'boolean', 'informational', 'optional', 4040, 'Whether the API follows common standards like OpenAI-compatible endpoints.', 'Ob die API gängige Standards wie OpenAI-kompatible Endpunkte befolgt.'
  UNION ALL SELECT 'ai-ml', 'safety_alignment', 'content_filtering', 'Content filtering', 'Inhaltsfilterung', 'enum', 'tradeoff', 'optional', 5010, 'How content filtering and safety guardrails are applied.', 'Wie Inhaltsfilterung und Sicherheitsleitplanken angewendet werden.'
  UNION ALL SELECT 'ai-ml', 'safety_alignment', 'safety_documentation', 'Safety documentation', 'Sicherheitsdokumentation', 'boolean', 'beneficial', 'optional', 5020, 'Whether safety practices and policies are publicly documented.', 'Ob Sicherheitspraktiken und -richtlinien öffentlich dokumentiert sind.'
  UNION ALL SELECT 'ai-ml', 'safety_alignment', 'output_attribution', 'Output attribution', 'Ausgabezuordnung', 'boolean', 'informational', 'optional', 5030, 'Whether the model provides source attribution for generated content.', 'Ob das Modell Quellenangaben für generierte Inhalte bereitstellt.'
  UNION ALL SELECT 'ai-ml', 'performance_reliability', 'response_speed', 'Response speed', 'Antwortgeschwindigkeit', 'enum', 'informational', 'optional', 6010, 'Typical response speed for standard queries.', 'Typische Antwortgeschwindigkeit für Standardanfragen.'
  UNION ALL SELECT 'ai-ml', 'performance_reliability', 'uptime_sla', 'Uptime SLA', 'Verfügbarkeits-SLA', 'boolean', 'beneficial', 'optional', 6020, 'Whether a formal uptime service level agreement is offered.', 'Ob eine formelle Verfügbarkeits-Dienstgütevereinbarung angeboten wird.'
  UNION ALL SELECT 'ai-ml', 'performance_reliability', 'streaming_support', 'Streaming support', 'Streaming-Unterstützung', 'boolean', 'beneficial', 'optional', 6030, 'Whether streaming responses are supported for real-time output.', 'Ob Streaming-Antworten für Echtzeit-Ausgabe unterstützt werden.'
  UNION ALL SELECT 'ai-ml', 'openness_audit', 'model_weights_availability', 'Model weights availability', 'Verfügbarkeit der Modellgewichte', 'enum', 'tradeoff', 'optional', 7010, 'Whether the model weights are openly available for download.', 'Ob die Modellgewichte offen zum Herunterladen verfügbar sind.'
  UNION ALL SELECT 'ai-ml', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhängiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 7020, 'Whether an independent security audit has been completed.', 'Ob ein unabhängiges Sicherheitsaudit durchgeführt wurde.'
  UNION ALL SELECT 'ai-ml', 'openness_audit', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7030, 'The license under which the model is distributed.', 'Die Lizenz, unter der das Modell vertrieben wird.'
  UNION ALL SELECT 'ai-ml', 'openness_audit', 'model_card_published', 'Model card published', 'Modellkarte veröffentlicht', 'boolean', 'informational', 'optional', 7040, 'Whether a model card with capabilities and limitations is published.', 'Ob eine Modellkarte mit Fähigkeiten und Einschränkungen veröffentlicht wurde.'
  UNION ALL SELECT 'ai-ml', 'fit_use_cases', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8010, 'Common user profiles the model is well suited for.', 'Typische Nutzerprofile, für die das Modell gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'ai-ml' AS category_id, 'context_window_size' AS criterion_key, 'up_to_8k' AS option_key, 'Up to 8K tokens' AS label_en, 'Bis zu 8K Tokens' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'ai-ml', 'context_window_size', 'up_to_32k', 'Up to 32K tokens', 'Bis zu 32K Tokens', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'context_window_size', 'up_to_128k', 'Up to 128K tokens', 'Bis zu 128K Tokens', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'context_window_size', 'above_128k', 'Above 128K tokens', 'Über 128K Tokens', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'supported_modalities', 'text', 'Text', 'Text', 'neutral', 10
  UNION ALL SELECT 'ai-ml', 'supported_modalities', 'image', 'Image', 'Bild', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'supported_modalities', 'audio', 'Audio', 'Audio', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'supported_modalities', 'video', 'Video', 'Video', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'supported_modalities', 'file_upload', 'File upload', 'Datei-Upload', 'neutral', 50
  UNION ALL SELECT 'ai-ml', 'multilingual_support', 'single_language', 'Single language', 'Einzelne Sprache', 'neutral', 10
  UNION ALL SELECT 'ai-ml', 'multilingual_support', 'limited', 'Limited', 'Eingeschränkt', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'multilingual_support', 'broad', 'Broad', 'Breit', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'multilingual_support', 'comprehensive', 'Comprehensive', 'Umfassend', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'training_data_transparency', 'full_disclosure', 'Full disclosure', 'Vollständige Offenlegung', 'positive', 10
  UNION ALL SELECT 'ai-ml', 'training_data_transparency', 'partial_disclosure', 'Partial disclosure', 'Teilweise Offenlegung', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'training_data_transparency', 'minimal_disclosure', 'Minimal disclosure', 'Minimale Offenlegung', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'training_data_transparency', 'undisclosed', 'Undisclosed', 'Nicht offengelegt', 'warning', 40
  UNION ALL SELECT 'ai-ml', 'user_data_retention', 'no_retention', 'No retention', 'Keine Speicherung', 'positive', 10
  UNION ALL SELECT 'ai-ml', 'user_data_retention', 'session_only', 'Session only', 'Nur Sitzung', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'user_data_retention', 'short_term', 'Short-term', 'Kurzfristig', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'user_data_retention', 'long_term', 'Long-term', 'Langfristig', 'warning', 40
  UNION ALL SELECT 'ai-ml', 'user_data_retention', 'unspecified', 'Unspecified', 'Nicht spezifiziert', 'tradeoff', 50
  UNION ALL SELECT 'ai-ml', 'gdpr_data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'ai-ml', 'gdpr_data_processing_location', 'eu_primary', 'EU primary', 'EU primär', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'gdpr_data_processing_location', 'global', 'Global', 'Global', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'gdpr_data_processing_location', 'unspecified', 'Unspecified', 'Nicht spezifiziert', 'tradeoff', 40
  UNION ALL SELECT 'ai-ml', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'ai-ml', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'pricing_model', 'pay_per_use', 'Pay per use', 'Nutzungsbasiert', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'pricing_model', 'enterprise_custom', 'Enterprise custom', 'Unternehmen individuell', 'neutral', 50
  UNION ALL SELECT 'ai-ml', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'ai-ml', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 50
  UNION ALL SELECT 'ai-ml', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 60
  UNION ALL SELECT 'ai-ml', 'content_filtering', 'configurable', 'Configurable', 'Konfigurierbar', 'positive', 10
  UNION ALL SELECT 'ai-ml', 'content_filtering', 'fixed_strict', 'Fixed strict', 'Fest streng', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'content_filtering', 'fixed_moderate', 'Fixed moderate', 'Fest moderat', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'content_filtering', 'minimal', 'Minimal', 'Minimal', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'content_filtering', 'none', 'None', 'Keine', 'warning', 50
  UNION ALL SELECT 'ai-ml', 'response_speed', 'real_time', 'Real-time', 'Echtzeit', 'neutral', 10
  UNION ALL SELECT 'ai-ml', 'response_speed', 'fast', 'Fast', 'Schnell', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'response_speed', 'moderate', 'Moderate', 'Mittel', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'response_speed', 'slow', 'Slow', 'Langsam', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'model_weights_availability', 'open_weights', 'Open weights', 'Offene Gewichte', 'positive', 10
  UNION ALL SELECT 'ai-ml', 'model_weights_availability', 'partial_open', 'Partial open', 'Teilweise offen', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'model_weights_availability', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 30
  UNION ALL SELECT 'ai-ml', 'license_type', 'apache', 'Apache', 'Apache', 'neutral', 10
  UNION ALL SELECT 'ai-ml', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'license_type', 'llama_community', 'Llama Community', 'Llama Community', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'license_type', 'other_osi', 'Other OSI', 'Anderes OSI', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 50
  UNION ALL SELECT 'ai-ml', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 10
  UNION ALL SELECT 'ai-ml', 'fit_profiles', 'researcher', 'Researcher', 'Forscher', 'neutral', 20
  UNION ALL SELECT 'ai-ml', 'fit_profiles', 'business', 'Business', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'ai-ml', 'fit_profiles', 'creative_writer', 'Creative writer', 'Kreativautor', 'neutral', 40
  UNION ALL SELECT 'ai-ml', 'fit_profiles', 'student', 'Student', 'Student', 'neutral', 50
  UNION ALL SELECT 'ai-ml', 'fit_profiles', 'enterprise', 'Enterprise', 'Großunternehmen', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'ai-ml'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'ai-ml'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('026-ai-ml-matrix-criteria');
