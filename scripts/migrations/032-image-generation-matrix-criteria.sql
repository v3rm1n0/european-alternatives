-- Migration 032: Define Image Generation category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('image-generation', 'generation_capabilities', 'Generation Capabilities', 'Generierungsfähigkeiten', 'Core image generation abilities including resolution, styles, and modalities.', 'Kernfähigkeiten der Bildgenerierung einschließlich Auflösung, Stile und Modalitäten.', 100),
  ('image-generation', 'model_architecture', 'Model & Architecture', 'Modell & Architektur', 'Underlying model type, fine-tuning options, and training data transparency.', 'Zugrundeliegender Modelltyp, Feinabstimmungsoptionen und Trainingsdaten-Transparenz.', 200),
  ('image-generation', 'input_control', 'Input & Control', 'Eingabe & Steuerung', 'Prompt types, editing features, and advanced control mechanisms.', 'Prompt-Typen, Bearbeitungsfunktionen und erweiterte Steuerungsmechanismen.', 300),
  ('image-generation', 'output_usage', 'Output & Usage Rights', 'Ausgabe & Nutzungsrechte', 'Output formats, commercial licensing, ownership, and watermarking policies.', 'Ausgabeformate, kommerzielle Lizenzierung, Eigentumsrechte und Wasserzeichen-Richtlinien.', 400),
  ('image-generation', 'privacy_data', 'Privacy & Data Handling', 'Datenschutz & Datenverarbeitung', 'Data retention, training on user content, and processing location.', 'Datenaufbewahrung, Training mit Nutzerinhalten und Verarbeitungsstandort.', 500),
  ('image-generation', 'integration_access', 'Integration & Access', 'Integration & Zugang', 'API access, supported platforms, plugin ecosystem, and creative tool integrations.', 'API-Zugang, unterstützte Plattformen, Plugin-Ökosystem und Kreativtool-Integrationen.', 600),
  ('image-generation', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Model weights, source code availability, licensing, and security audits.', 'Modellgewichte, Quellcode-Verfügbarkeit, Lizenzierung und Sicherheitsaudits.', 700),
  ('image-generation', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier, credit system, and target user profiles.', 'Preismodell, kostenlose Stufe, Credit-System und Zielgruppen-Nutzerprofile.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'image-generation' AS category_id, 'generation_capabilities' AS group_key, 'max_output_resolution' AS criterion_key, 'Maximum output resolution' AS label_en, 'Maximale Ausgabeauflösung' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The highest image resolution the tool can generate.' AS help_text_en, 'Die höchste Bildauflösung, die das Tool generieren kann.' AS help_text_de
  UNION ALL SELECT 'image-generation', 'generation_capabilities', 'supported_styles', 'Supported artistic styles', 'Unterstützte künstlerische Stile', 'multi_enum', 'informational', 'multi_select', 1020, 'Which artistic styles the tool supports for image generation.', 'Welche künstlerischen Stile das Tool für die Bildgenerierung unterstützt.'
  UNION ALL SELECT 'image-generation', 'generation_capabilities', 'image_to_image', 'Image-to-image generation', 'Bild-zu-Bild-Generierung', 'boolean', 'informational', 'optional', 1030, 'Whether existing images can be used as input for transformation.', 'Ob bestehende Bilder als Eingabe für Transformationen verwendet werden können.'
  UNION ALL SELECT 'image-generation', 'generation_capabilities', 'video_generation', 'Video generation', 'Videogenerierung', 'boolean', 'informational', 'optional', 1040, 'Whether the tool supports generating video content.', 'Ob das Tool die Generierung von Videoinhalten unterstützt.'
  UNION ALL SELECT 'image-generation', 'generation_capabilities', 'batch_generation', 'Batch generation', 'Stapelgenerierung', 'boolean', 'beneficial', 'optional', 1050, 'Whether multiple images can be generated in a single batch.', 'Ob mehrere Bilder in einem einzigen Stapel generiert werden können.'
  UNION ALL SELECT 'image-generation', 'generation_capabilities', 'generation_speed', 'Generation speed', 'Generierungsgeschwindigkeit', 'enum', 'informational', 'optional', 1060, 'Typical time to generate a single image.', 'Typische Zeit zur Generierung eines einzelnen Bildes.'
  UNION ALL SELECT 'image-generation', 'model_architecture', 'model_type', 'Model architecture type', 'Modellarchitekturtyp', 'enum', 'informational', 'optional', 2010, 'The underlying model architecture used for image generation.', 'Die zugrundeliegende Modellarchitektur für die Bildgenerierung.'
  UNION ALL SELECT 'image-generation', 'model_architecture', 'fine_tuning_support', 'Fine-tuning support', 'Feinabstimmungs-Unterstützung', 'boolean', 'informational', 'optional', 2020, 'Whether the model can be fine-tuned on custom data.', 'Ob das Modell mit eigenen Daten feinabgestimmt werden kann.'
  UNION ALL SELECT 'image-generation', 'model_architecture', 'training_data_transparency', 'Training data transparency', 'Trainingsdaten-Transparenz', 'enum', 'tradeoff', 'optional', 2030, 'How transparent the provider is about training data sources.', 'Wie transparent der Anbieter bezüglich der Trainingsdatenquellen ist.'
  UNION ALL SELECT 'image-generation', 'model_architecture', 'custom_model_training', 'Custom model training', 'Benutzerdefiniertes Modelltraining', 'boolean', 'informational', 'optional', 2040, 'Whether users can train entirely custom models.', 'Ob Nutzer vollständig eigene Modelle trainieren können.'
  UNION ALL SELECT 'image-generation', 'input_control', 'prompt_type', 'Prompt input type', 'Prompt-Eingabetyp', 'multi_enum', 'informational', 'multi_select', 3010, 'Which input types are accepted for directing image generation.', 'Welche Eingabetypen für die Steuerung der Bildgenerierung akzeptiert werden.'
  UNION ALL SELECT 'image-generation', 'input_control', 'negative_prompts', 'Negative prompt support', 'Negativ-Prompt-Unterstützung', 'boolean', 'informational', 'optional', 3020, 'Whether negative prompts can be used to exclude unwanted elements.', 'Ob Negativ-Prompts verwendet werden können, um unerwünschte Elemente auszuschließen.'
  UNION ALL SELECT 'image-generation', 'input_control', 'inpainting', 'Inpainting support', 'Inpainting-Unterstützung', 'boolean', 'informational', 'optional', 3030, 'Whether specific regions of an image can be edited.', 'Ob bestimmte Bereiche eines Bildes bearbeitet werden können.'
  UNION ALL SELECT 'image-generation', 'input_control', 'outpainting', 'Outpainting support', 'Outpainting-Unterstützung', 'boolean', 'informational', 'optional', 3040, 'Whether images can be extended beyond their original borders.', 'Ob Bilder über ihre ursprünglichen Grenzen hinaus erweitert werden können.'
  UNION ALL SELECT 'image-generation', 'input_control', 'controlnet_support', 'ControlNet or guided generation', 'ControlNet oder geführte Generierung', 'boolean', 'informational', 'optional', 3050, 'Whether advanced structural control like pose or depth guidance is supported.', 'Ob erweiterte strukturelle Steuerung wie Pose- oder Tiefenführung unterstützt wird.'
  UNION ALL SELECT 'image-generation', 'input_control', 'upscaling', 'Image upscaling', 'Bildhochskalierung', 'boolean', 'beneficial', 'optional', 3060, 'Whether the tool can enhance image resolution.', 'Ob das Tool die Bildauflösung verbessern kann.'
  UNION ALL SELECT 'image-generation', 'output_usage', 'output_formats', 'Output formats', 'Ausgabeformate', 'multi_enum', 'informational', 'multi_select', 4010, 'Which image file formats are supported for output.', 'Welche Bilddateiformate für die Ausgabe unterstützt werden.'
  UNION ALL SELECT 'image-generation', 'output_usage', 'commercial_use_allowed', 'Commercial use of output', 'Kommerzielle Nutzung der Ausgabe', 'enum', 'tradeoff', 'must_match', 4020, 'Whether generated images may be used commercially.', 'Ob generierte Bilder kommerziell genutzt werden dürfen.'
  UNION ALL SELECT 'image-generation', 'output_usage', 'output_ownership', 'Output ownership model', 'Ausgabe-Eigentumsmodell', 'enum', 'tradeoff', 'optional', 4030, 'Who owns the rights to generated images.', 'Wer die Rechte an generierten Bildern besitzt.'
  UNION ALL SELECT 'image-generation', 'output_usage', 'watermark_policy', 'Watermark policy', 'Wasserzeichen-Richtlinie', 'enum', 'tradeoff', 'optional', 4040, 'Whether and how outputs are watermarked.', 'Ob und wie Ausgaben mit Wasserzeichen versehen werden.'
  UNION ALL SELECT 'image-generation', 'output_usage', 'ai_content_labeling', 'AI content labeling', 'KI-Inhaltskennzeichnung', 'enum', 'informational', 'optional', 4050, 'Whether generated images include AI content metadata such as C2PA.', 'Ob generierte Bilder KI-Inhaltsmetadaten wie C2PA enthalten.'
  UNION ALL SELECT 'image-generation', 'privacy_data', 'user_content_retention', 'User content retention', 'Aufbewahrung von Nutzerinhalten', 'enum', 'risk', 'must_match', 5010, 'Whether and how long uploaded or generated images are stored.', 'Ob und wie lange hochgeladene oder generierte Bilder gespeichert werden.'
  UNION ALL SELECT 'image-generation', 'privacy_data', 'ai_training_on_user_content', 'AI training on user content', 'KI-Training mit Nutzerinhalten', 'boolean', 'risk', 'must_match', 5020, 'Whether user images or prompts are used to train the model.', 'Ob Nutzerbilder oder Prompts zum Training des Modells verwendet werden.'
  UNION ALL SELECT 'image-generation', 'privacy_data', 'gdpr_data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'optional', 5030, 'Where image data is processed geographically.', 'Wo Bilddaten geografisch verarbeitet werden.'
  UNION ALL SELECT 'image-generation', 'privacy_data', 'on_premise_option', 'On-premise or self-hosted option', 'On-Premise- oder Self-Hosting-Option', 'boolean', 'tradeoff', 'optional', 5040, 'Whether the tool can be self-hosted on own infrastructure.', 'Ob das Tool auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'image-generation', 'privacy_data', 'prompt_logging', 'Prompt logging policy', 'Prompt-Protokollierungsrichtlinie', 'enum', 'risk', 'optional', 5050, 'Whether and how user prompts are logged by the provider.', 'Ob und wie Nutzer-Prompts vom Anbieter protokolliert werden.'
  UNION ALL SELECT 'image-generation', 'integration_access', 'api_access', 'API access', 'API-Zugang', 'boolean', 'beneficial', 'optional', 6010, 'Whether programmatic API access is available.', 'Ob programmatischer API-Zugang verfügbar ist.'
  UNION ALL SELECT 'image-generation', 'integration_access', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 6020, 'Which platforms and operating systems are supported.', 'Welche Plattformen und Betriebssysteme unterstützt werden.'
  UNION ALL SELECT 'image-generation', 'integration_access', 'plugin_ecosystem', 'Plugin or extension ecosystem', 'Plugin- oder Erweiterungs-Ökosystem', 'boolean', 'informational', 'optional', 6030, 'Whether a plugin or extension ecosystem is available.', 'Ob ein Plugin- oder Erweiterungs-Ökosystem verfügbar ist.'
  UNION ALL SELECT 'image-generation', 'integration_access', 'creative_tool_integrations', 'Creative tool integrations', 'Kreativtool-Integrationen', 'multi_enum', 'informational', 'multi_select', 6040, 'Which creative and design tools have integrations.', 'Welche Kreativ- und Design-Tools Integrationen haben.'
  UNION ALL SELECT 'image-generation', 'openness_audit', 'model_weights_availability', 'Model weights availability', 'Verfügbarkeit der Modellgewichte', 'enum', 'tradeoff', 'optional', 7010, 'Whether model weights are publicly available.', 'Ob Modellgewichte öffentlich verfügbar sind.'
  UNION ALL SELECT 'image-generation', 'openness_audit', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7020, 'Whether the platform source code is open source, source available, or proprietary.', 'Ob der Plattform-Quellcode quelloffen, quelleinsehbar oder proprietär ist.'
  UNION ALL SELECT 'image-generation', 'openness_audit', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7030, 'The software license under which the tool is distributed.', 'Die Softwarelizenz, unter der das Tool vertrieben wird.'
  UNION ALL SELECT 'image-generation', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhängiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 7040, 'Whether a third-party security audit has been performed.', 'Ob ein Sicherheitsaudit durch Dritte durchgeführt wurde.'
  UNION ALL SELECT 'image-generation', 'openness_audit', 'model_card_published', 'Model card published', 'Modellkarte veröffentlicht', 'boolean', 'informational', 'optional', 7050, 'Whether a model card documenting capabilities and limitations is published.', 'Ob eine Modellkarte mit Fähigkeiten und Einschränkungen veröffentlicht ist.'
  UNION ALL SELECT 'image-generation', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'How the service is priced.', 'Wie der Dienst bepreist wird.'
  UNION ALL SELECT 'image-generation', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 8020, 'Whether a free tier is available without payment.', 'Ob eine kostenlose Stufe ohne Bezahlung verfügbar ist.'
  UNION ALL SELECT 'image-generation', 'pricing_fit', 'credit_system', 'Credit or token system', 'Credit- oder Token-System', 'boolean', 'informational', 'optional', 8030, 'Whether usage is metered via a credit or token system.', 'Ob die Nutzung über ein Credit- oder Token-System gemessen wird.'
  UNION ALL SELECT 'image-generation', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'Target user profiles the tool is designed for.', 'Zielgruppen-Nutzerprofile, für die das Tool konzipiert ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'image-generation' AS category_id, 'max_output_resolution' AS criterion_key, 'up_to_512' AS option_key, 'Up to 512px' AS label_en, 'Bis zu 512px' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'image-generation', 'max_output_resolution', 'up_to_1024', 'Up to 1024px', 'Bis zu 1024px', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'max_output_resolution', 'up_to_2048', 'Up to 2048px', 'Bis zu 2048px', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'max_output_resolution', 'above_2048', 'Above 2048px', 'Über 2048px', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'supported_styles', 'photorealistic', 'Photorealistic', 'Fotorealistisch', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'supported_styles', 'illustration', 'Illustration', 'Illustration', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'supported_styles', 'anime', 'Anime', 'Anime', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'supported_styles', 'abstract', 'Abstract', 'Abstrakt', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'supported_styles', 'pixel_art', 'Pixel art', 'Pixelkunst', 'neutral', 50
  UNION ALL SELECT 'image-generation', 'supported_styles', '3d_render', '3D render', '3D-Rendering', 'neutral', 60
  UNION ALL SELECT 'image-generation', 'generation_speed', 'real_time', 'Real-time (<5s)', 'Echtzeit (<5s)', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'generation_speed', 'fast', 'Fast (5-15s)', 'Schnell (5-15s)', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'generation_speed', 'moderate', 'Moderate (15-60s)', 'Mittel (15-60s)', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'generation_speed', 'slow', 'Slow (>60s)', 'Langsam (>60s)', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'model_type', 'diffusion', 'Diffusion', 'Diffusion', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'model_type', 'gan', 'GAN', 'GAN', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'model_type', 'autoregressive', 'Autoregressive', 'Autoregressiv', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'model_type', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'training_data_transparency', 'full_disclosure', 'Full disclosure', 'Vollständige Offenlegung', 'positive', 10
  UNION ALL SELECT 'image-generation', 'training_data_transparency', 'partial_disclosure', 'Partial disclosure', 'Teilweise Offenlegung', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'training_data_transparency', 'minimal_disclosure', 'Minimal disclosure', 'Minimale Offenlegung', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'training_data_transparency', 'undisclosed', 'Undisclosed', 'Nicht offengelegt', 'warning', 40
  UNION ALL SELECT 'image-generation', 'prompt_type', 'text', 'Text', 'Text', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'prompt_type', 'image', 'Image', 'Bild', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'prompt_type', 'sketch', 'Sketch', 'Skizze', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'prompt_type', 'audio', 'Audio', 'Audio', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'prompt_type', '3d_model', '3D model', '3D-Modell', 'neutral', 50
  UNION ALL SELECT 'image-generation', 'output_formats', 'png', 'PNG', 'PNG', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'output_formats', 'jpeg', 'JPEG', 'JPEG', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'output_formats', 'webp', 'WebP', 'WebP', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'output_formats', 'svg', 'SVG', 'SVG', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'output_formats', 'tiff', 'TIFF', 'TIFF', 'neutral', 50
  UNION ALL SELECT 'image-generation', 'commercial_use_allowed', 'full_commercial', 'Full commercial use', 'Volle kommerzielle Nutzung', 'positive', 10
  UNION ALL SELECT 'image-generation', 'commercial_use_allowed', 'limited_commercial', 'Limited commercial use', 'Eingeschränkte kommerzielle Nutzung', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'commercial_use_allowed', 'non_commercial', 'Non-commercial only', 'Nur nicht-kommerziell', 'warning', 30
  UNION ALL SELECT 'image-generation', 'commercial_use_allowed', 'license_dependent', 'License-dependent', 'Lizenzabhängig', 'tradeoff', 40
  UNION ALL SELECT 'image-generation', 'output_ownership', 'user_owns', 'User owns output', 'Nutzer besitzt Ausgabe', 'positive', 10
  UNION ALL SELECT 'image-generation', 'output_ownership', 'shared_rights', 'Shared rights', 'Geteilte Rechte', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'output_ownership', 'platform_owns', 'Platform owns output', 'Plattform besitzt Ausgabe', 'warning', 30
  UNION ALL SELECT 'image-generation', 'output_ownership', 'varies_by_plan', 'Varies by plan', 'Abhängig vom Tarif', 'tradeoff', 40
  UNION ALL SELECT 'image-generation', 'watermark_policy', 'no_watermark', 'No watermark', 'Kein Wasserzeichen', 'positive', 10
  UNION ALL SELECT 'image-generation', 'watermark_policy', 'optional_watermark', 'Optional watermark', 'Optionales Wasserzeichen', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'watermark_policy', 'mandatory_removable', 'Mandatory but removable', 'Pflicht, aber entfernbar', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'watermark_policy', 'mandatory_permanent', 'Mandatory and permanent', 'Pflicht und dauerhaft', 'warning', 40
  UNION ALL SELECT 'image-generation', 'ai_content_labeling', 'c2pa_metadata', 'C2PA metadata', 'C2PA-Metadaten', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'ai_content_labeling', 'visible_label', 'Visible label', 'Sichtbare Kennzeichnung', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'ai_content_labeling', 'both', 'Both (C2PA + visible)', 'Beides (C2PA + sichtbar)', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'ai_content_labeling', 'none', 'None', 'Keine', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'user_content_retention', 'no_retention', 'No retention', 'Keine Aufbewahrung', 'positive', 10
  UNION ALL SELECT 'image-generation', 'user_content_retention', 'session_only', 'Session only', 'Nur Sitzungsdauer', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'user_content_retention', 'short_term', 'Short-term', 'Kurzfristig', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'user_content_retention', 'long_term', 'Long-term', 'Langfristig', 'warning', 40
  UNION ALL SELECT 'image-generation', 'user_content_retention', 'unspecified', 'Unspecified', 'Nicht angegeben', 'tradeoff', 50
  UNION ALL SELECT 'image-generation', 'gdpr_data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'image-generation', 'gdpr_data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primär, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'gdpr_data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'image-generation', 'gdpr_data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 40
  UNION ALL SELECT 'image-generation', 'prompt_logging', 'no_logging', 'No logging', 'Keine Protokollierung', 'positive', 10
  UNION ALL SELECT 'image-generation', 'prompt_logging', 'anonymized', 'Anonymized', 'Anonymisiert', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'prompt_logging', 'full_logging', 'Full logging', 'Vollständige Protokollierung', 'warning', 30
  UNION ALL SELECT 'image-generation', 'prompt_logging', 'unspecified', 'Unspecified', 'Nicht angegeben', 'tradeoff', 40
  UNION ALL SELECT 'image-generation', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 50
  UNION ALL SELECT 'image-generation', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 60
  UNION ALL SELECT 'image-generation', 'creative_tool_integrations', 'photoshop', 'Photoshop', 'Photoshop', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'creative_tool_integrations', 'figma', 'Figma', 'Figma', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'creative_tool_integrations', 'blender', 'Blender', 'Blender', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'creative_tool_integrations', 'comfyui', 'ComfyUI', 'ComfyUI', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'creative_tool_integrations', 'automatic1111', 'Automatic1111', 'Automatic1111', 'neutral', 50
  UNION ALL SELECT 'image-generation', 'model_weights_availability', 'open_weights', 'Open weights', 'Offene Gewichte', 'positive', 10
  UNION ALL SELECT 'image-generation', 'model_weights_availability', 'partial_open', 'Partially open', 'Teilweise offen', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'model_weights_availability', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 30
  UNION ALL SELECT 'image-generation', 'source_code_model', 'open_source', 'Open source', 'Quelloffen', 'positive', 10
  UNION ALL SELECT 'image-generation', 'source_code_model', 'source_available', 'Source available', 'Quelleinsehbar', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'source_code_model', 'partial_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'image-generation', 'license_type', 'apache', 'Apache 2.0', 'Apache 2.0', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'license_type', 'creativeml', 'CreativeML', 'CreativeML', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'license_type', 'other_osi', 'Other OSI-approved', 'Andere OSI-genehmigte', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 50
  UNION ALL SELECT 'image-generation', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'image-generation', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'pricing_model', 'pay_per_use', 'Pay per use', 'Nutzungsbasiert', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'pricing_model', 'enterprise_custom', 'Enterprise / custom', 'Enterprise / individuell', 'neutral', 50
  UNION ALL SELECT 'image-generation', 'fit_profiles', 'artist', 'Artist', 'Künstler', 'neutral', 10
  UNION ALL SELECT 'image-generation', 'fit_profiles', 'designer', 'Designer', 'Designer', 'neutral', 20
  UNION ALL SELECT 'image-generation', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 30
  UNION ALL SELECT 'image-generation', 'fit_profiles', 'marketer', 'Marketer', 'Marketer', 'neutral', 40
  UNION ALL SELECT 'image-generation', 'fit_profiles', 'hobbyist', 'Hobbyist', 'Hobbyist', 'neutral', 50
  UNION ALL SELECT 'image-generation', 'fit_profiles', 'enterprise', 'Enterprise', 'Großunternehmen', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'image-generation'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'image-generation'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('032-image-generation-matrix-criteria');
