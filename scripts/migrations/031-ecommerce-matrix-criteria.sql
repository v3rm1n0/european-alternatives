-- Migration 031: Define E-Commerce category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('ecommerce', 'platform_architecture', 'Platform & Architecture', 'Plattform & Architektur', 'Hosting model, multi-store, headless support, and international capabilities.', 'Hosting-Modell, Multi-Store, Headless-Unterstützung und internationale Fähigkeiten.', 100),
  ('ecommerce', 'storefront_catalog', 'Storefront & Catalog', 'Schaufenster & Katalog', 'Product catalog, variants, search, and theme system.', 'Produktkatalog, Varianten, Suche und Theme-System.', 200),
  ('ecommerce', 'checkout_payments', 'Checkout & Payments', 'Kasse & Zahlungen', 'Payment gateways, checkout customization, and cart features.', 'Zahlungsgateways, Kassenanpassung und Warenkorb-Funktionen.', 300),
  ('ecommerce', 'order_fulfillment', 'Order Management & Fulfillment', 'Bestellmanagement & Abwicklung', 'Order processing, shipping integrations, inventory management, and returns.', 'Bestellabwicklung, Versandintegrationen, Lagerverwaltung und Retouren.', 400),
  ('ecommerce', 'data_protection_privacy', 'Data Protection & Privacy', 'Datenschutz & Privatsphäre', 'Data processing location, GDPR DPA, cookie consent, and data portability.', 'Datenverarbeitungsstandort, DSGVO-AVV, Cookie-Consent und Datenportabilität.', 500),
  ('ecommerce', 'openness_extensibility', 'Openness & Extensibility', 'Offenheit & Erweiterbarkeit', 'Source code model, API availability, plugin ecosystem, and theme customization.', 'Quellcode-Modell, API-Verfügbarkeit, Plugin-Ökosystem und Theme-Anpassung.', 600),
  ('ecommerce', 'marketing_analytics', 'Marketing & Analytics', 'Marketing & Analyse', 'SEO, analytics, email marketing, discount system, and marketplaces.', 'SEO, Analysen, E-Mail-Marketing, Rabattsystem und Marktplätze.', 700),
  ('ecommerce', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, transaction fees, free tier, and target seller profiles.', 'Preismodell, Transaktionsgebühren, kostenlose Stufe und Zielgruppen-Verkäuferprofile.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'ecommerce' AS category_id, 'platform_architecture' AS group_key, 'hosting_model' AS criterion_key, 'Hosting model' AS label_en, 'Hosting-Modell' AS label_de, 'enum' AS value_type, 'tradeoff' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Which hosting model the platform offers.' AS help_text_en, 'Welches Hosting-Modell die Plattform anbietet.' AS help_text_de
  UNION ALL SELECT 'ecommerce', 'platform_architecture', 'self_hosting_available', 'Self-hosting available', 'Self-Hosting verfügbar', 'boolean', 'tradeoff', 'optional', 1020, 'Whether the platform can run on user-owned infrastructure.', 'Ob die Plattform auf eigener Infrastruktur betrieben werden kann.'
  UNION ALL SELECT 'ecommerce', 'platform_architecture', 'headless_commerce', 'Headless commerce support', 'Headless-Commerce-Unterstützung', 'boolean', 'informational', 'optional', 1030, 'Whether the platform supports headless or API-first architecture.', 'Ob die Plattform eine Headless- oder API-first-Architektur unterstützt.'
  UNION ALL SELECT 'ecommerce', 'platform_architecture', 'multi_store_support', 'Multi-store support', 'Multi-Store-Unterstützung', 'boolean', 'informational', 'optional', 1040, 'Whether multiple storefronts can be managed from one backend.', 'Ob mehrere Shops von einem Backend verwaltet werden können.'
  UNION ALL SELECT 'ecommerce', 'platform_architecture', 'multi_language_storefront', 'Multi-language storefront', 'Mehrsprachiges Schaufenster', 'boolean', 'informational', 'optional', 1050, 'Whether the storefront natively supports multiple languages.', 'Ob das Schaufenster nativ mehrere Sprachen unterstützt.'
  UNION ALL SELECT 'ecommerce', 'platform_architecture', 'multi_currency_support', 'Multi-currency support', 'Multi-Währungs-Unterstützung', 'boolean', 'informational', 'optional', 1060, 'Whether prices and transactions in multiple currencies are supported.', 'Ob Preise und Transaktionen in mehreren Währungen unterstützt werden.'
  UNION ALL SELECT 'ecommerce', 'storefront_catalog', 'product_types_supported', 'Product types supported', 'Unterstützte Produkttypen', 'multi_enum', 'informational', 'multi_select', 2010, 'Which product types can be sold on the platform.', 'Welche Produkttypen auf der Plattform verkauft werden können.'
  UNION ALL SELECT 'ecommerce', 'storefront_catalog', 'product_variants', 'Product variants', 'Produktvarianten', 'boolean', 'informational', 'optional', 2020, 'Whether product variants such as size and color are supported.', 'Ob Produktvarianten wie Größe und Farbe unterstützt werden.'
  UNION ALL SELECT 'ecommerce', 'storefront_catalog', 'product_search', 'Built-in product search', 'Eingebaute Produktsuche', 'boolean', 'informational', 'optional', 2030, 'Whether the platform includes built-in search functionality.', 'Ob die Plattform eine eingebaute Suchfunktion bietet.'
  UNION ALL SELECT 'ecommerce', 'storefront_catalog', 'theme_system', 'Theme / template system', 'Theme- / Vorlagensystem', 'enum', 'informational', 'optional', 2040, 'The customization approach for storefront design.', 'Der Anpassungsansatz für das Schaufenster-Design.'
  UNION ALL SELECT 'ecommerce', 'storefront_catalog', 'product_import_export', 'Product import / export', 'Produktimport / -export', 'boolean', 'beneficial', 'optional', 2050, 'Whether bulk product data import and export is available.', 'Ob Massenimport und -export von Produktdaten verfügbar ist.'
  UNION ALL SELECT 'ecommerce', 'checkout_payments', 'payment_gateways_supported', 'Payment gateways supported', 'Unterstützte Zahlungsgateways', 'multi_enum', 'informational', 'multi_select', 3010, 'Which payment processors are integrated.', 'Welche Zahlungsanbieter integriert sind.'
  UNION ALL SELECT 'ecommerce', 'checkout_payments', 'checkout_customization', 'Checkout customization', 'Kassenanpassung', 'enum', 'informational', 'optional', 3020, 'Degree of checkout flow customization.', 'Grad der Anpassbarkeit des Bezahlvorgangs.'
  UNION ALL SELECT 'ecommerce', 'checkout_payments', 'guest_checkout', 'Guest checkout', 'Gastkasse', 'boolean', 'beneficial', 'optional', 3030, 'Whether customers can buy without creating an account.', 'Ob Kunden ohne Konto einkaufen können.'
  UNION ALL SELECT 'ecommerce', 'checkout_payments', 'tax_calculation', 'Automatic tax calculation', 'Automatische Steuerberechnung', 'boolean', 'informational', 'optional', 3040, 'Whether EU VAT and tax calculation is automated.', 'Ob EU-Mehrwertsteuer und Steuerberechnung automatisiert sind.'
  UNION ALL SELECT 'ecommerce', 'checkout_payments', 'abandoned_cart_recovery', 'Abandoned cart recovery', 'Warenkorbabbruch-Wiederherstellung', 'boolean', 'informational', 'optional', 3050, 'Whether abandoned cart recovery features are available.', 'Ob Funktionen zur Wiederherstellung abgebrochener Warenkörbe verfügbar sind.'
  UNION ALL SELECT 'ecommerce', 'order_fulfillment', 'inventory_management', 'Inventory management', 'Lagerverwaltung', 'boolean', 'informational', 'optional', 4010, 'Whether built-in inventory tracking is available.', 'Ob eine eingebaute Bestandsverfolgung verfügbar ist.'
  UNION ALL SELECT 'ecommerce', 'order_fulfillment', 'shipping_integrations', 'Shipping integrations', 'Versandintegrationen', 'multi_enum', 'informational', 'multi_select', 4020, 'Which shipping providers are integrated.', 'Welche Versanddienstleister integriert sind.'
  UNION ALL SELECT 'ecommerce', 'order_fulfillment', 'returns_management', 'Returns management', 'Retourenmanagement', 'boolean', 'informational', 'optional', 4030, 'Whether built-in return and refund workflows are available.', 'Ob eingebaute Retouren- und Erstattungsabläufe verfügbar sind.'
  UNION ALL SELECT 'ecommerce', 'order_fulfillment', 'order_status_tracking', 'Order status tracking', 'Bestellstatus-Verfolgung', 'boolean', 'informational', 'optional', 4040, 'Whether customers can track order status.', 'Ob Kunden den Bestellstatus verfolgen können.'
  UNION ALL SELECT 'ecommerce', 'order_fulfillment', 'multi_warehouse', 'Multi-warehouse support', 'Multi-Lager-Unterstützung', 'boolean', 'informational', 'optional', 4050, 'Whether inventory across multiple warehouses is supported.', 'Ob Lagerbestände über mehrere Lager verwaltet werden können.'
  UNION ALL SELECT 'ecommerce', 'data_protection_privacy', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 5010, 'Where customer and order data is processed.', 'Wo Kunden- und Bestelldaten verarbeitet werden.'
  UNION ALL SELECT 'ecommerce', 'data_protection_privacy', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfügbar', 'boolean', 'informational', 'optional', 5020, 'Whether a GDPR-compliant data processing agreement is available.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag verfügbar ist.'
  UNION ALL SELECT 'ecommerce', 'data_protection_privacy', 'cookie_consent_builtin', 'Built-in cookie consent', 'Eingebautes Cookie-Consent', 'boolean', 'informational', 'optional', 5030, 'Whether GDPR-compliant cookie consent is built in.', 'Ob DSGVO-konformes Cookie-Consent eingebaut ist.'
  UNION ALL SELECT 'ecommerce', 'data_protection_privacy', 'customer_data_portability', 'Customer data portability', 'Kundendaten-Portabilität', 'boolean', 'beneficial', 'optional', 5040, 'Whether customer data can be exported in a standard format.', 'Ob Kundendaten in einem Standardformat exportiert werden können.'
  UNION ALL SELECT 'ecommerce', 'data_protection_privacy', 'data_retention_controls', 'Data retention controls', 'Datenaufbewahrungssteuerung', 'boolean', 'informational', 'optional', 5050, 'Whether sellers can configure data retention policies.', 'Ob Verkäufer Datenaufbewahrungsrichtlinien konfigurieren können.'
  UNION ALL SELECT 'ecommerce', 'openness_extensibility', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 6010, 'Whether the source code is open source, source available, or proprietary.', 'Ob der Quellcode quelloffen, quelleinsehbar oder proprietär ist.'
  UNION ALL SELECT 'ecommerce', 'openness_extensibility', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 6020, 'The software license under which the product is distributed.', 'Die Softwarelizenz, unter der das Produkt vertrieben wird.'
  UNION ALL SELECT 'ecommerce', 'openness_extensibility', 'api_available', 'API available', 'API verfügbar', 'boolean', 'beneficial', 'optional', 6030, 'Whether an API is available for custom integrations.', 'Ob eine API für individuelle Integrationen verfügbar ist.'
  UNION ALL SELECT 'ecommerce', 'openness_extensibility', 'plugin_app_ecosystem', 'Plugin / app ecosystem', 'Plugin- / App-Ökosystem', 'enum', 'informational', 'optional', 6040, 'Size and maturity of the plugin and extension ecosystem.', 'Größe und Reife des Plugin- und Erweiterungs-Ökosystems.'
  UNION ALL SELECT 'ecommerce', 'openness_extensibility', 'theme_customization_depth', 'Theme customization depth', 'Theme-Anpassungstiefe', 'enum', 'informational', 'optional', 6050, 'How deeply themes can be customized.', 'Wie tiefgreifend Themes angepasst werden können.'
  UNION ALL SELECT 'ecommerce', 'openness_extensibility', 'webhook_support', 'Webhook support', 'Webhook-Unterstützung', 'boolean', 'informational', 'optional', 6060, 'Whether webhook event notifications are available.', 'Ob Webhook-Ereignisbenachrichtigungen verfügbar sind.'
  UNION ALL SELECT 'ecommerce', 'marketing_analytics', 'built_in_seo', 'Built-in SEO tools', 'Eingebaute SEO-Tools', 'boolean', 'informational', 'optional', 7010, 'Whether SEO features such as meta tags and sitemaps are built in.', 'Ob SEO-Funktionen wie Meta-Tags und Sitemaps eingebaut sind.'
  UNION ALL SELECT 'ecommerce', 'marketing_analytics', 'built_in_analytics', 'Built-in analytics', 'Eingebaute Analyse', 'boolean', 'informational', 'optional', 7020, 'Whether sales analytics and reporting are built in.', 'Ob Verkaufsanalysen und Berichte eingebaut sind.'
  UNION ALL SELECT 'ecommerce', 'marketing_analytics', 'discount_coupon_system', 'Discount / coupon system', 'Rabatt- / Gutscheinsystem', 'boolean', 'informational', 'optional', 7030, 'Whether a native discount and coupon system is available.', 'Ob ein natives Rabatt- und Gutscheinsystem verfügbar ist.'
  UNION ALL SELECT 'ecommerce', 'marketing_analytics', 'email_marketing_integration', 'Email marketing integration', 'E-Mail-Marketing-Integration', 'boolean', 'informational', 'optional', 7040, 'Whether email marketing tools are integrated.', 'Ob E-Mail-Marketing-Tools integriert sind.'
  UNION ALL SELECT 'ecommerce', 'marketing_analytics', 'marketplace_selling', 'Marketplace channel selling', 'Marktplatz-Kanalverkauf', 'boolean', 'informational', 'optional', 7050, 'Whether selling on external marketplaces is supported.', 'Ob der Verkauf auf externen Marktplätzen unterstützt wird.'
  UNION ALL SELECT 'ecommerce', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'The pricing model used by the platform.', 'Das von der Plattform verwendete Preismodell.'
  UNION ALL SELECT 'ecommerce', 'pricing_fit', 'transaction_fee', 'Transaction fee', 'Transaktionsgebühr', 'enum', 'tradeoff', 'optional', 8020, 'Whether the platform charges additional transaction fees.', 'Ob die Plattform zusätzliche Transaktionsgebühren erhebt.'
  UNION ALL SELECT 'ecommerce', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 8030, 'Whether a free plan is available for small sellers.', 'Ob ein kostenloser Tarif für kleine Verkäufer verfügbar ist.'
  UNION ALL SELECT 'ecommerce', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'Target seller profiles the platform is designed for.', 'Zielgruppen-Verkäuferprofile, für die die Plattform konzipiert ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'ecommerce' AS category_id, 'hosting_model' AS criterion_key, 'saas' AS option_key, 'SaaS (hosted)' AS label_en, 'SaaS (gehostet)' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'ecommerce', 'hosting_model', 'self_hosted', 'Self-hosted', 'Selbst-gehostet', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'hosting_model', 'hybrid', 'Hybrid (SaaS + self-hosted)', 'Hybrid (SaaS + Selbst-gehostet)', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'hosting_model', 'open_source_saas', 'Open-source with hosted option', 'Quelloffen mit gehosteter Option', 'positive', 40
  UNION ALL SELECT 'ecommerce', 'product_types_supported', 'physical', 'Physical products', 'Physische Produkte', 'neutral', 10
  UNION ALL SELECT 'ecommerce', 'product_types_supported', 'digital', 'Digital products', 'Digitale Produkte', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'product_types_supported', 'subscriptions', 'Subscriptions', 'Abonnements', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'product_types_supported', 'services', 'Services', 'Dienstleistungen', 'neutral', 40
  UNION ALL SELECT 'ecommerce', 'product_types_supported', 'bundles', 'Bundles', 'Bundles', 'neutral', 50
  UNION ALL SELECT 'ecommerce', 'theme_system', 'template_based', 'Template-based', 'Vorlagenbasiert', 'neutral', 10
  UNION ALL SELECT 'ecommerce', 'theme_system', 'drag_and_drop', 'Drag-and-drop builder', 'Drag-and-Drop-Editor', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'theme_system', 'code_based', 'Code-based', 'Codebasiert', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'theme_system', 'headless_only', 'Headless only (no built-in frontend)', 'Nur Headless (kein eingebautes Frontend)', 'neutral', 40
  UNION ALL SELECT 'ecommerce', 'payment_gateways_supported', 'stripe', 'Stripe', 'Stripe', 'neutral', 10
  UNION ALL SELECT 'ecommerce', 'payment_gateways_supported', 'paypal', 'PayPal', 'PayPal', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'payment_gateways_supported', 'mollie', 'Mollie', 'Mollie', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'payment_gateways_supported', 'adyen', 'Adyen', 'Adyen', 'neutral', 40
  UNION ALL SELECT 'ecommerce', 'payment_gateways_supported', 'klarna', 'Klarna', 'Klarna', 'neutral', 50
  UNION ALL SELECT 'ecommerce', 'payment_gateways_supported', 'sepa_direct', 'SEPA Direct Debit', 'SEPA-Lastschrift', 'neutral', 60
  UNION ALL SELECT 'ecommerce', 'payment_gateways_supported', 'custom_gateway', 'Custom / third-party gateway', 'Benutzerdefiniertes / Drittanbieter-Gateway', 'neutral', 70
  UNION ALL SELECT 'ecommerce', 'checkout_customization', 'full', 'Fully customizable', 'Vollständig anpassbar', 'positive', 10
  UNION ALL SELECT 'ecommerce', 'checkout_customization', 'limited', 'Limited customization', 'Eingeschränkt anpassbar', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'checkout_customization', 'none', 'No customization', 'Keine Anpassung', 'warning', 30
  UNION ALL SELECT 'ecommerce', 'shipping_integrations', 'dhl', 'DHL', 'DHL', 'neutral', 10
  UNION ALL SELECT 'ecommerce', 'shipping_integrations', 'dpd', 'DPD', 'DPD', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'shipping_integrations', 'ups', 'UPS', 'UPS', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'shipping_integrations', 'gls', 'GLS', 'GLS', 'neutral', 40
  UNION ALL SELECT 'ecommerce', 'shipping_integrations', 'post_national', 'National postal service', 'Nationale Post', 'neutral', 50
  UNION ALL SELECT 'ecommerce', 'shipping_integrations', 'custom_shipping', 'Custom / third-party shipping', 'Benutzerdefinierter / Drittanbieter-Versand', 'neutral', 60
  UNION ALL SELECT 'ecommerce', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'ecommerce', 'data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primär, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'ecommerce', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 40
  UNION ALL SELECT 'ecommerce', 'source_code_model', 'open_source', 'Open source', 'Quelloffen', 'positive', 10
  UNION ALL SELECT 'ecommerce', 'source_code_model', 'source_available', 'Source available', 'Quelleinsehbar', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 30
  UNION ALL SELECT 'ecommerce', 'source_code_model', 'open_core', 'Open core', 'Open Core', 'tradeoff', 40
  UNION ALL SELECT 'ecommerce', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 10
  UNION ALL SELECT 'ecommerce', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'license_type', 'apache', 'Apache 2.0', 'Apache 2.0', 'neutral', 40
  UNION ALL SELECT 'ecommerce', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 50
  UNION ALL SELECT 'ecommerce', 'license_type', 'bsl', 'BSL / SSPL', 'BSL / SSPL', 'tradeoff', 60
  UNION ALL SELECT 'ecommerce', 'license_type', 'other_osi', 'Other OSI-approved', 'Andere OSI-genehmigte', 'neutral', 70
  UNION ALL SELECT 'ecommerce', 'plugin_app_ecosystem', 'large', 'Large ecosystem (1000+ plugins)', 'Großes Ökosystem (1000+ Plugins)', 'positive', 10
  UNION ALL SELECT 'ecommerce', 'plugin_app_ecosystem', 'medium', 'Medium ecosystem (100–1000 plugins)', 'Mittleres Ökosystem (100-1000 Plugins)', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'plugin_app_ecosystem', 'small', 'Small ecosystem (<100 plugins)', 'Kleines Ökosystem (<100 Plugins)', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'plugin_app_ecosystem', 'none', 'No plugin system', 'Kein Plugin-System', 'warning', 40
  UNION ALL SELECT 'ecommerce', 'theme_customization_depth', 'full_code_access', 'Full code access', 'Voller Code-Zugriff', 'positive', 10
  UNION ALL SELECT 'ecommerce', 'theme_customization_depth', 'template_editing', 'Template editing', 'Vorlagenbearbeitung', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'theme_customization_depth', 'limited_css_only', 'Limited (CSS only)', 'Eingeschränkt (nur CSS)', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'theme_customization_depth', 'none', 'No customization', 'Keine Anpassung', 'warning', 40
  UNION ALL SELECT 'ecommerce', 'pricing_model', 'free_open_source', 'Free / open source', 'Kostenlos / quelloffen', 'positive', 10
  UNION ALL SELECT 'ecommerce', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'ecommerce', 'transaction_fee', 'no_fee', 'No platform transaction fee', 'Keine Plattform-Transaktionsgebühr', 'positive', 10
  UNION ALL SELECT 'ecommerce', 'transaction_fee', 'percentage', 'Percentage fee', 'Prozentuale Gebühr', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'transaction_fee', 'tiered', 'Tiered (depends on plan)', 'Gestaffelt (abhängig vom Tarif)', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'fit_profiles', 'small_business', 'Small business / solo', 'Kleinunternehmen / Solo', 'neutral', 10
  UNION ALL SELECT 'ecommerce', 'fit_profiles', 'mid_market', 'Mid-market', 'Mittelstand', 'neutral', 20
  UNION ALL SELECT 'ecommerce', 'fit_profiles', 'enterprise', 'Enterprise', 'Großunternehmen', 'neutral', 30
  UNION ALL SELECT 'ecommerce', 'fit_profiles', 'developer', 'Developer / technical', 'Entwickler / technisch', 'neutral', 40
  UNION ALL SELECT 'ecommerce', 'fit_profiles', 'dropshipping', 'Dropshipping', 'Dropshipping', 'neutral', 50
  UNION ALL SELECT 'ecommerce', 'fit_profiles', 'digital_goods', 'Digital goods seller', 'Digitale-Güter-Verkäufer', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'ecommerce'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'ecommerce'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('031-ecommerce-matrix-criteria');
