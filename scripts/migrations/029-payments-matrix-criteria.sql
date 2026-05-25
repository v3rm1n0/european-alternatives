-- Migration 029: Define Payments category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('payments', 'payment_methods_capabilities', 'Payment Methods & Capabilities', 'Zahlungsmethoden & Faehigkeiten', 'Supported payment methods, recurring billing, and commerce capabilities.', 'Unterstuetzte Zahlungsmethoden, wiederkehrende Abrechnung und Commerce-Faehigkeiten.', 100),
  ('payments', 'integration_developer_experience', 'Integration & Developer Experience', 'Integration & Entwicklererfahrung', 'API types, SDK languages, and developer tools for payment integration.', 'API-Typen, SDK-Sprachen und Entwicklerwerkzeuge fuer die Zahlungsintegration.', 200),
  ('payments', 'regulatory_licensing', 'Regulatory & Licensing', 'Regulierung & Lizenzierung', 'Payment licensing, EU compliance, and regulatory frameworks.', 'Zahlungslizenzierung, EU-Konformitaet und regulatorische Rahmenbedingungen.', 300),
  ('payments', 'data_protection_privacy', 'Data Protection & Privacy', 'Datenschutz & Privatsphaere', 'Data processing location, encryption, and privacy controls.', 'Datenverarbeitungsstandort, Verschluesselung und Datenschutzkontrollen.', 400),
  ('payments', 'fraud_risk_management', 'Fraud & Risk Management', 'Betrug & Risikomanagement', 'Fraud detection, chargeback handling, and risk assessment tools.', 'Betrugserkennung, Rueckbuchungsverwaltung und Risikobewertungswerkzeuge.', 500),
  ('payments', 'settlement_payouts', 'Settlement & Payouts', 'Abrechnung & Auszahlungen', 'Settlement timing, payout currencies, and pricing transparency.', 'Abrechnungszeitraum, Auszahlungswaehrungen und Preistransparenz.', 600),
  ('payments', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Source code openness, licensing, and auditability.', 'Quellcode-Offenheit, Lizenzierung und Pruefbarkeit.', 700),
  ('payments', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model and target user profiles.', 'Preismodell und Zielgruppen-Eignung.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'payments' AS category_id, 'payment_methods_capabilities' AS group_key, 'payment_methods_supported' AS criterion_key, 'Supported payment methods' AS label_en, 'Unterstuetzte Zahlungsmethoden' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'Which payment methods the provider supports.' AS help_text_en, 'Welche Zahlungsmethoden der Anbieter unterstuetzt.' AS help_text_de
  UNION ALL SELECT 'payments', 'payment_methods_capabilities', 'recurring_billing', 'Recurring billing / subscriptions', 'Wiederkehrende Abrechnung / Abonnements', 'boolean', 'informational', 'optional', 1020, 'Whether recurring billing and subscription management is supported.', 'Ob wiederkehrende Abrechnung und Abonnementverwaltung unterstuetzt wird.'
  UNION ALL SELECT 'payments', 'payment_methods_capabilities', 'one_click_checkout', 'One-click checkout', 'Ein-Klick-Checkout', 'boolean', 'informational', 'optional', 1030, 'Whether one-click checkout for returning customers is available.', 'Ob Ein-Klick-Checkout fuer wiederkehrende Kunden verfuegbar ist.'
  UNION ALL SELECT 'payments', 'payment_methods_capabilities', 'multi_currency_support', 'Multi-currency support', 'Multi-Waehrungsunterstuetzung', 'boolean', 'informational', 'optional', 1040, 'Whether transactions in multiple currencies are supported.', 'Ob Transaktionen in mehreren Waehrungen unterstuetzt werden.'
  UNION ALL SELECT 'payments', 'payment_methods_capabilities', 'in_person_payments', 'In-person / POS payments', 'Zahlungen vor Ort / POS', 'boolean', 'informational', 'optional', 1050, 'Whether in-person or point-of-sale payments are supported.', 'Ob Zahlungen vor Ort oder am Point-of-Sale unterstuetzt werden.'
  UNION ALL SELECT 'payments', 'payment_methods_capabilities', 'invoicing_support', 'Invoicing support', 'Rechnungsstellung', 'boolean', 'informational', 'optional', 1060, 'Whether built-in invoicing capabilities are available.', 'Ob integrierte Rechnungsstellungsfunktionen verfuegbar sind.'
  UNION ALL SELECT 'payments', 'payment_methods_capabilities', 'marketplace_split_payments', 'Marketplace / split payments', 'Marktplatz- / Split-Zahlungen', 'boolean', 'informational', 'optional', 1070, 'Whether marketplace or split payment flows are supported.', 'Ob Marktplatz- oder Split-Zahlungsfluesse unterstuetzt werden.'
  UNION ALL SELECT 'payments', 'integration_developer_experience', 'api_type', 'API type', 'API-Typ', 'enum', 'informational', 'optional', 2010, 'The type of API offered for payment integration.', 'Der Typ der fuer die Zahlungsintegration angebotenen API.'
  UNION ALL SELECT 'payments', 'integration_developer_experience', 'sdk_languages', 'SDK languages', 'SDK-Sprachen', 'multi_enum', 'informational', 'multi_select', 2020, 'Programming languages for which official SDKs are available.', 'Programmiersprachen, fuer die offizielle SDKs verfuegbar sind.'
  UNION ALL SELECT 'payments', 'integration_developer_experience', 'prebuilt_checkout_ui', 'Pre-built checkout UI', 'Vorgefertigte Checkout-Oberflaeche', 'boolean', 'informational', 'optional', 2030, 'Whether a pre-built hosted checkout page or drop-in UI is available.', 'Ob eine vorgefertigte gehostete Checkout-Seite oder Drop-in-Oberflaeche verfuegbar ist.'
  UNION ALL SELECT 'payments', 'integration_developer_experience', 'webhook_support', 'Webhook event support', 'Webhook-Ereignisunterstuetzung', 'boolean', 'informational', 'optional', 2040, 'Whether webhook notifications for payment events are available.', 'Ob Webhook-Benachrichtigungen fuer Zahlungsereignisse verfuegbar sind.'
  UNION ALL SELECT 'payments', 'integration_developer_experience', 'sandbox_environment', 'Sandbox / test environment', 'Sandbox- / Testumgebung', 'boolean', 'beneficial', 'optional', 2050, 'Whether a sandbox or test environment is provided for development.', 'Ob eine Sandbox- oder Testumgebung fuer die Entwicklung bereitgestellt wird.'
  UNION ALL SELECT 'payments', 'integration_developer_experience', 'documentation_quality', 'Documentation quality', 'Dokumentationsqualitaet', 'enum', 'informational', 'optional', 2060, 'The quality and completeness of developer documentation.', 'Die Qualitaet und Vollstaendigkeit der Entwicklerdokumentation.'
  UNION ALL SELECT 'payments', 'regulatory_licensing', 'payment_license_type', 'Payment license type', 'Zahlungslizenztyp', 'enum', 'informational', 'optional', 3010, 'The type of payment license held by the provider.', 'Der Typ der vom Anbieter gehaltenen Zahlungslizenz.'
  UNION ALL SELECT 'payments', 'regulatory_licensing', 'licensed_in_eu', 'Licensed in EU/EEA', 'In der EU/EWR lizenziert', 'boolean', 'beneficial', 'must_match', 3020, 'Whether the provider holds a payment license in the EU or EEA.', 'Ob der Anbieter eine Zahlungslizenz in der EU oder dem EWR haelt.'
  UNION ALL SELECT 'payments', 'regulatory_licensing', 'psd2_compliant', 'PSD2 compliant', 'PSD2-konform', 'boolean', 'beneficial', 'optional', 3030, 'Whether the provider is compliant with the EU Payment Services Directive 2.', 'Ob der Anbieter die EU-Zahlungsdiensterichtlinie PSD2 erfuellt.'
  UNION ALL SELECT 'payments', 'regulatory_licensing', 'sca_support', 'Strong Customer Authentication (SCA)', 'Starke Kundenauthentifizierung (SCA)', 'boolean', 'beneficial', 'optional', 3040, 'Whether Strong Customer Authentication as required by PSD2 is supported.', 'Ob die von PSD2 geforderte starke Kundenauthentifizierung unterstuetzt wird.'
  UNION ALL SELECT 'payments', 'regulatory_licensing', 'pci_dss_level', 'PCI DSS compliance level', 'PCI-DSS-Konformitaetsstufe', 'enum', 'informational', 'optional', 3050, 'The PCI DSS compliance level of the provider.', 'Die PCI-DSS-Konformitaetsstufe des Anbieters.'
  UNION ALL SELECT 'payments', 'data_protection_privacy', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 4010, 'Where payment and transaction data is primarily processed.', 'Wo Zahlungs- und Transaktionsdaten vorrangig verarbeitet werden.'
  UNION ALL SELECT 'payments', 'data_protection_privacy', 'encryption_at_rest', 'Encryption at rest', 'Verschluesselung ruhender Daten', 'boolean', 'beneficial', 'optional', 4020, 'Whether stored payment data is encrypted at rest.', 'Ob gespeicherte Zahlungsdaten im Ruhezustand verschluesselt werden.'
  UNION ALL SELECT 'payments', 'data_protection_privacy', 'encryption_in_transit', 'Encryption in transit (TLS)', 'Verschluesselung bei Uebertragung (TLS)', 'boolean', 'beneficial', 'optional', 4030, 'Whether data in transit is encrypted via TLS.', 'Ob Daten bei der Uebertragung via TLS verschluesselt werden.'
  UNION ALL SELECT 'payments', 'data_protection_privacy', 'tokenization', 'Card tokenization', 'Kartentokenisierung', 'boolean', 'beneficial', 'optional', 4040, 'Whether card data is tokenized to reduce PCI scope for merchants.', 'Ob Kartendaten tokenisiert werden, um den PCI-Umfang fuer Haendler zu reduzieren.'
  UNION ALL SELECT 'payments', 'data_protection_privacy', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfuegbar', 'boolean', 'informational', 'optional', 4050, 'Whether a GDPR-compliant data processing agreement is available.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag verfuegbar ist.'
  UNION ALL SELECT 'payments', 'data_protection_privacy', 'data_retention_policy', 'Data retention policy', 'Datenaufbewahrungsrichtlinie', 'enum', 'informational', 'optional', 4060, 'How long transaction and payment data is retained.', 'Wie lange Transaktions- und Zahlungsdaten aufbewahrt werden.'
  UNION ALL SELECT 'payments', 'fraud_risk_management', 'fraud_detection', 'Built-in fraud detection', 'Integrierte Betrugserkennung', 'boolean', 'beneficial', 'optional', 5010, 'Whether built-in fraud detection capabilities are available.', 'Ob integrierte Betrugserkennungsfunktionen verfuegbar sind.'
  UNION ALL SELECT 'payments', 'fraud_risk_management', 'chargeback_management', 'Chargeback management', 'Rueckbuchungsverwaltung', 'boolean', 'informational', 'optional', 5020, 'Whether chargeback and dispute management tools are provided.', 'Ob Werkzeuge zur Rueckbuchungs- und Streitfallverwaltung bereitgestellt werden.'
  UNION ALL SELECT 'payments', 'fraud_risk_management', 'risk_scoring', 'Transaction risk scoring', 'Transaktions-Risikobewertung', 'boolean', 'informational', 'optional', 5030, 'Whether real-time transaction risk scoring is available.', 'Ob Echtzeit-Transaktions-Risikobewertung verfuegbar ist.'
  UNION ALL SELECT 'payments', 'fraud_risk_management', 'three_d_secure', '3D Secure support', '3D-Secure-Unterstuetzung', 'boolean', 'beneficial', 'optional', 5040, 'Whether 3D Secure card authentication is supported.', 'Ob 3D-Secure-Kartenauthentifizierung unterstuetzt wird.'
  UNION ALL SELECT 'payments', 'fraud_risk_management', 'velocity_checks', 'Velocity / rate limiting', 'Geschwindigkeits- / Ratenbegrenzung', 'boolean', 'informational', 'optional', 5050, 'Whether velocity checks and rate limiting for abuse prevention are available.', 'Ob Geschwindigkeitspruefungen und Ratenbegrenzung zur Missbrauchspraevention verfuegbar sind.'
  UNION ALL SELECT 'payments', 'settlement_payouts', 'settlement_speed', 'Settlement speed', 'Abrechnungsgeschwindigkeit', 'enum', 'informational', 'optional', 6010, 'How quickly funds are settled and available to the merchant.', 'Wie schnell Gelder abgerechnet und dem Haendler zur Verfuegung gestellt werden.'
  UNION ALL SELECT 'payments', 'settlement_payouts', 'payout_currencies', 'Payout currencies', 'Auszahlungswaehrungen', 'multi_enum', 'informational', 'multi_select', 6020, 'Which currencies are supported for merchant payouts.', 'Welche Waehrungen fuer Haendlerauszahlungen unterstuetzt werden.'
  UNION ALL SELECT 'payments', 'settlement_payouts', 'sepa_payouts', 'SEPA payouts supported', 'SEPA-Auszahlungen unterstuetzt', 'boolean', 'beneficial', 'optional', 6030, 'Whether SEPA payouts to European bank accounts are supported.', 'Ob SEPA-Auszahlungen auf europaeische Bankkonten unterstuetzt werden.'
  UNION ALL SELECT 'payments', 'settlement_payouts', 'transparent_pricing', 'Transparent pricing', 'Transparente Preisgestaltung', 'enum', 'tradeoff', 'optional', 6040, 'The pricing transparency model used by the provider.', 'Das Preistransparenzmodell des Anbieters.'
  UNION ALL SELECT 'payments', 'settlement_payouts', 'multi_account_payouts', 'Multi-account payouts', 'Multi-Konto-Auszahlungen', 'boolean', 'informational', 'optional', 6050, 'Whether payouts to multiple bank accounts are supported.', 'Ob Auszahlungen auf mehrere Bankkonten unterstuetzt werden.'
  UNION ALL SELECT 'payments', 'openness_audit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'Whether the source code is open source, source available, or proprietary.', 'Ob der Quellcode quelloffen, quelleinsehbar oder proprietaer ist.'
  UNION ALL SELECT 'payments', 'openness_audit', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7020, 'The software license under which the product is distributed.', 'Die Softwarelizenz, unter der das Produkt vertrieben wird.'
  UNION ALL SELECT 'payments', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhaengiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 7030, 'Whether an independent security audit has been completed.', 'Ob ein unabhaengiges Sicherheitsaudit durchgefuehrt wurde.'
  UNION ALL SELECT 'payments', 'openness_audit', 'community_governance', 'Community governance', 'Community-Governance', 'boolean', 'informational', 'optional', 7040, 'Whether the project has community-driven governance.', 'Ob das Projekt eine Community-gesteuerte Governance hat.'
  UNION ALL SELECT 'payments', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'The billing model used by the provider.', 'Das vom Anbieter verwendete Abrechnungsmodell.'
  UNION ALL SELECT 'payments', 'pricing_fit', 'free_tier_available', 'Free tier or test account', 'Kostenlose Stufe oder Testkonto', 'boolean', 'informational', 'optional', 8020, 'Whether a free plan or test account is available.', 'Ob ein kostenloser Tarif oder ein Testkonto verfuegbar ist.'
  UNION ALL SELECT 'payments', 'pricing_fit', 'billing_currency', 'Billing in EUR available', 'Abrechnung in EUR verfuegbar', 'boolean', 'informational', 'optional', 8030, 'Whether billing in euros is available.', 'Ob eine Abrechnung in Euro verfuegbar ist.'
  UNION ALL SELECT 'payments', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'Common user profiles the payment provider is well suited for.', 'Typische Nutzerprofile, fuer die der Zahlungsanbieter gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'payments' AS category_id, 'payment_methods_supported' AS criterion_key, 'credit_debit_card' AS option_key, 'Credit/debit cards' AS label_en, 'Kredit-/Debitkarten' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'payments', 'payment_methods_supported', 'sepa_direct_debit', 'SEPA Direct Debit', 'SEPA-Lastschrift', 'neutral', 20
  UNION ALL SELECT 'payments', 'payment_methods_supported', 'sepa_credit_transfer', 'SEPA Credit Transfer', 'SEPA-Ueberweisung', 'neutral', 30
  UNION ALL SELECT 'payments', 'payment_methods_supported', 'bank_redirect', 'Bank redirect (iDEAL, Bancontact, etc.)', 'Bank-Redirect (iDEAL, Bancontact usw.)', 'neutral', 40
  UNION ALL SELECT 'payments', 'payment_methods_supported', 'digital_wallet', 'Digital wallets (Apple Pay, Google Pay)', 'Digitale Wallets (Apple Pay, Google Pay)', 'neutral', 50
  UNION ALL SELECT 'payments', 'payment_methods_supported', 'buy_now_pay_later', 'Buy Now Pay Later', 'Kauf auf Rechnung / Ratenzahlung', 'neutral', 60
  UNION ALL SELECT 'payments', 'payment_methods_supported', 'crypto', 'Cryptocurrency', 'Kryptowaehrung', 'neutral', 70
  UNION ALL SELECT 'payments', 'payment_methods_supported', 'direct_carrier_billing', 'Direct carrier billing', 'Direktabrechnung ueber Mobilfunkanbieter', 'neutral', 80
  UNION ALL SELECT 'payments', 'api_type', 'rest', 'REST API', 'REST-API', 'neutral', 10
  UNION ALL SELECT 'payments', 'api_type', 'graphql', 'GraphQL API', 'GraphQL-API', 'neutral', 20
  UNION ALL SELECT 'payments', 'api_type', 'sdk_only', 'SDK only (no direct API)', 'Nur SDK (keine direkte API)', 'neutral', 30
  UNION ALL SELECT 'payments', 'api_type', 'rest_and_graphql', 'REST + GraphQL', 'REST + GraphQL', 'neutral', 40
  UNION ALL SELECT 'payments', 'sdk_languages', 'javascript', 'JavaScript / Node.js', 'JavaScript / Node.js', 'neutral', 10
  UNION ALL SELECT 'payments', 'sdk_languages', 'python', 'Python', 'Python', 'neutral', 20
  UNION ALL SELECT 'payments', 'sdk_languages', 'php', 'PHP', 'PHP', 'neutral', 30
  UNION ALL SELECT 'payments', 'sdk_languages', 'ruby', 'Ruby', 'Ruby', 'neutral', 40
  UNION ALL SELECT 'payments', 'sdk_languages', 'java', 'Java / JVM', 'Java / JVM', 'neutral', 50
  UNION ALL SELECT 'payments', 'sdk_languages', 'go', 'Go', 'Go', 'neutral', 60
  UNION ALL SELECT 'payments', 'sdk_languages', 'csharp', 'C# / .NET', 'C# / .NET', 'neutral', 70
  UNION ALL SELECT 'payments', 'sdk_languages', 'ios', 'iOS (Swift/Obj-C)', 'iOS (Swift/Obj-C)', 'neutral', 80
  UNION ALL SELECT 'payments', 'sdk_languages', 'android', 'Android (Kotlin/Java)', 'Android (Kotlin/Java)', 'neutral', 90
  UNION ALL SELECT 'payments', 'documentation_quality', 'comprehensive', 'Comprehensive with examples', 'Umfassend mit Beispielen', 'positive', 10
  UNION ALL SELECT 'payments', 'documentation_quality', 'adequate', 'Adequate', 'Ausreichend', 'neutral', 20
  UNION ALL SELECT 'payments', 'documentation_quality', 'minimal', 'Minimal', 'Minimal', 'warning', 30
  UNION ALL SELECT 'payments', 'documentation_quality', 'api_reference_only', 'API reference only', 'Nur API-Referenz', 'neutral', 40
  UNION ALL SELECT 'payments', 'payment_license_type', 'emi', 'E-Money Institution (EMI)', 'E-Geld-Institut (EMI)', 'neutral', 10
  UNION ALL SELECT 'payments', 'payment_license_type', 'pi', 'Payment Institution (PI)', 'Zahlungsinstitut (PI)', 'neutral', 20
  UNION ALL SELECT 'payments', 'payment_license_type', 'banking_license', 'Full banking license', 'Vollbanklizenz', 'neutral', 30
  UNION ALL SELECT 'payments', 'payment_license_type', 'agent_model', 'Agent/partner model', 'Agenten-/Partnermodell', 'neutral', 40
  UNION ALL SELECT 'payments', 'payment_license_type', 'no_license_required', 'No license required', 'Keine Lizenz erforderlich', 'neutral', 50
  UNION ALL SELECT 'payments', 'pci_dss_level', 'level_1', 'PCI DSS Level 1', 'PCI DSS Level 1', 'positive', 10
  UNION ALL SELECT 'payments', 'pci_dss_level', 'level_2', 'PCI DSS Level 2', 'PCI DSS Level 2', 'neutral', 20
  UNION ALL SELECT 'payments', 'pci_dss_level', 'level_3_4', 'PCI DSS Level 3-4', 'PCI DSS Level 3-4', 'neutral', 30
  UNION ALL SELECT 'payments', 'pci_dss_level', 'not_disclosed', 'Not disclosed', 'Nicht offengelegt', 'warning', 40
  UNION ALL SELECT 'payments', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'payments', 'data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primaer, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'payments', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'payments', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 40
  UNION ALL SELECT 'payments', 'data_retention_policy', 'minimal_required', 'Minimal / regulatory minimum', 'Minimal / gesetzliches Minimum', 'positive', 10
  UNION ALL SELECT 'payments', 'data_retention_policy', 'configurable', 'Configurable by merchant', 'Vom Haendler konfigurierbar', 'positive', 20
  UNION ALL SELECT 'payments', 'data_retention_policy', 'fixed_period', 'Fixed retention period', 'Feste Aufbewahrungsfrist', 'neutral', 30
  UNION ALL SELECT 'payments', 'data_retention_policy', 'indefinite', 'Indefinite', 'Unbegrenzt', 'warning', 40
  UNION ALL SELECT 'payments', 'data_retention_policy', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 50
  UNION ALL SELECT 'payments', 'settlement_speed', 'same_day', 'Same day (T+0)', 'Gleicher Tag (T+0)', 'positive', 10
  UNION ALL SELECT 'payments', 'settlement_speed', 'next_day', 'Next business day (T+1)', 'Naechster Werktag (T+1)', 'neutral', 20
  UNION ALL SELECT 'payments', 'settlement_speed', 'two_to_three_days', 'T+2 to T+3', 'T+2 bis T+3', 'neutral', 30
  UNION ALL SELECT 'payments', 'settlement_speed', 'weekly', 'Weekly', 'Woechentlich', 'neutral', 40
  UNION ALL SELECT 'payments', 'settlement_speed', 'custom', 'Custom / negotiable', 'Individuell / verhandelbar', 'neutral', 50
  UNION ALL SELECT 'payments', 'payout_currencies', 'eur', 'EUR', 'EUR', 'neutral', 10
  UNION ALL SELECT 'payments', 'payout_currencies', 'gbp', 'GBP', 'GBP', 'neutral', 20
  UNION ALL SELECT 'payments', 'payout_currencies', 'usd', 'USD', 'USD', 'neutral', 30
  UNION ALL SELECT 'payments', 'payout_currencies', 'chf', 'CHF', 'CHF', 'neutral', 40
  UNION ALL SELECT 'payments', 'payout_currencies', 'sek', 'SEK', 'SEK', 'neutral', 50
  UNION ALL SELECT 'payments', 'payout_currencies', 'dkk', 'DKK', 'DKK', 'neutral', 60
  UNION ALL SELECT 'payments', 'payout_currencies', 'pln', 'PLN', 'PLN', 'neutral', 70
  UNION ALL SELECT 'payments', 'payout_currencies', 'czk', 'CZK', 'CZK', 'neutral', 80
  UNION ALL SELECT 'payments', 'payout_currencies', 'nok', 'NOK', 'NOK', 'neutral', 90
  UNION ALL SELECT 'payments', 'transparent_pricing', 'interchange_plus', 'Interchange++', 'Interchange++', 'positive', 10
  UNION ALL SELECT 'payments', 'transparent_pricing', 'blended', 'Blended rate', 'Mischkalkulation', 'neutral', 20
  UNION ALL SELECT 'payments', 'transparent_pricing', 'tiered', 'Tiered pricing', 'Gestaffelte Preise', 'neutral', 30
  UNION ALL SELECT 'payments', 'transparent_pricing', 'custom_only', 'Custom/negotiated only', 'Nur individuell/verhandelt', 'neutral', 40
  UNION ALL SELECT 'payments', 'source_model', 'open_source', 'Open source', 'Quelloffen', 'positive', 10
  UNION ALL SELECT 'payments', 'source_model', 'source_available', 'Source available', 'Quelleinsehbar', 'neutral', 20
  UNION ALL SELECT 'payments', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 30
  UNION ALL SELECT 'payments', 'source_model', 'open_core', 'Open core', 'Open Core', 'tradeoff', 40
  UNION ALL SELECT 'payments', 'license_type', 'apache', 'Apache 2.0', 'Apache 2.0', 'neutral', 10
  UNION ALL SELECT 'payments', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 20
  UNION ALL SELECT 'payments', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 30
  UNION ALL SELECT 'payments', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 40
  UNION ALL SELECT 'payments', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 50
  UNION ALL SELECT 'payments', 'license_type', 'other_osi', 'Other OSI-approved', 'Andere OSI-genehmigte', 'neutral', 60
  UNION ALL SELECT 'payments', 'pricing_model', 'per_transaction', 'Per transaction', 'Pro Transaktion', 'neutral', 10
  UNION ALL SELECT 'payments', 'pricing_model', 'subscription', 'Monthly subscription', 'Monatliches Abonnement', 'neutral', 20
  UNION ALL SELECT 'payments', 'pricing_model', 'subscription_plus_transaction', 'Subscription + per-transaction', 'Abonnement + pro Transaktion', 'neutral', 30
  UNION ALL SELECT 'payments', 'pricing_model', 'custom', 'Custom / enterprise', 'Individuell / Unternehmen', 'neutral', 40
  UNION ALL SELECT 'payments', 'pricing_model', 'free_open_source', 'Free / open source', 'Kostenlos / quelloffen', 'neutral', 50
  UNION ALL SELECT 'payments', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 10
  UNION ALL SELECT 'payments', 'fit_profiles', 'startup', 'Startup', 'Startup', 'neutral', 20
  UNION ALL SELECT 'payments', 'fit_profiles', 'small_business', 'Small business', 'Kleinunternehmen', 'neutral', 30
  UNION ALL SELECT 'payments', 'fit_profiles', 'enterprise', 'Enterprise', 'Grossunternehmen', 'neutral', 40
  UNION ALL SELECT 'payments', 'fit_profiles', 'marketplace', 'Marketplace / platform', 'Marktplatz / Plattform', 'neutral', 50
  UNION ALL SELECT 'payments', 'fit_profiles', 'freelancer', 'Freelancer', 'Freiberufler', 'neutral', 60
  UNION ALL SELECT 'payments', 'fit_profiles', 'nonprofit', 'Non-profit', 'Gemeinnuetzig', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'payments'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'payments'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('029-payments-matrix-criteria');
