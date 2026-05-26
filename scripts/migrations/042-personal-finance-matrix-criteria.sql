-- Migration 042: Define Personal Finance category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('personal-finance', 'budgeting_expense_management', 'Budgeting & Expense Management', 'Budgetierung & Ausgabenverwaltung', 'Budget methods, transaction categorization, recurring rules, and currency support.', 'Budgetmethoden, Transaktionskategorisierung, wiederkehrende Regeln und Waehrungsunterstuetzung.', 100),
  ('personal-finance', 'account_aggregation_import', 'Account Aggregation & Data Import', 'Kontoaggregation & Datenimport', 'Bank synchronization methods, multi-institution support, and file import formats.', 'Banksynchronisationsmethoden, Multi-Institutions-Unterstuetzung und Dateiimportformate.', 200),
  ('personal-finance', 'investment_portfolio_tracking', 'Investment & Portfolio Tracking', 'Investitionen & Portfolio-Tracking', 'Portfolio tracking, asset class coverage, performance metrics, and broker imports.', 'Portfolio-Tracking, Anlageklassenabdeckung, Performance-Kennzahlen und Broker-Importe.', 300),
  ('personal-finance', 'reporting_analytics', 'Reporting & Analytics', 'Berichte & Analysen', 'Net worth tracking, cash flow analysis, spending trends, and report exports.', 'Vermoegenserfassung, Cashflow-Analyse, Ausgabentrends und Berichtsexporte.', 400),
  ('personal-finance', 'financial_planning_goals', 'Financial Planning & Goals', 'Finanzplanung & Ziele', 'Savings goals, debt payoff planning, cash flow forecasting, and retirement projections.', 'Sparziele, Schuldenabbauplanung, Cashflow-Prognosen und Ruhestandsprojektionen.', 500),
  ('personal-finance', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Supported platforms, offline availability, household sharing, and mobile apps.', 'Unterstuetzte Plattformen, Offline-Verfuegbarkeit, Haushaltsfreigabe und mobile Apps.', 600),
  ('personal-finance', 'privacy_data_control', 'Privacy & Data Control', 'Privatsphaere & Datenkontrolle', 'Data storage model, credential handling, processing location, and telemetry.', 'Datenspeichermodell, Zugangsdatenhandhabung, Verarbeitungsstandort und Telemetrie.', 700),
  ('personal-finance', 'openness_deployment', 'Openness & Deployment', 'Offenheit & Bereitstellung', 'Source code availability, licensing, self-hosting, and deployment options.', 'Quellcode-Verfuegbarkeit, Lizenzierung, Selbst-Hosting und Bereitstellungsoptionen.', 800),
  ('personal-finance', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier availability, and target audience profiles.', 'Preismodell, Verfuegbarkeit kostenloser Versionen und Zielgruppenprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'personal-finance' AS category_id, 'budgeting_expense_management' AS group_key, 'budget_methodology' AS criterion_key, 'Budget methodology' AS label_en, 'Budgetmethodik' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The budgeting approach used by the tool, such as envelope-based, zero-based, or category tracking.' AS help_text_en, 'Der vom Tool verwendete Budgetierungsansatz, z.B. Umschlagmethode, Nullbasiert oder Kategorieverfolgung.' AS help_text_de
  UNION ALL SELECT 'personal-finance', 'budgeting_expense_management', 'automatic_categorization', 'Automatic transaction categorization', 'Automatische Transaktionskategorisierung', 'boolean', 'beneficial', 'optional', 1020, 'Whether the tool automatically categorizes transactions based on merchant data or rules.', 'Ob das Tool Transaktionen automatisch anhand von Haendlerdaten oder Regeln kategorisiert.'
  UNION ALL SELECT 'personal-finance', 'budgeting_expense_management', 'recurring_transaction_rules', 'Recurring transaction rules', 'Wiederkehrende Transaktionsregeln', 'boolean', 'beneficial', 'optional', 1030, 'Whether the tool supports rules for automatically handling recurring transactions.', 'Ob das Tool Regeln fuer die automatische Verarbeitung wiederkehrender Transaktionen unterstuetzt.'
  UNION ALL SELECT 'personal-finance', 'budgeting_expense_management', 'split_transactions', 'Split transactions', 'Geteilte Transaktionen', 'boolean', 'informational', 'optional', 1040, 'Whether a single transaction can be split across multiple categories or accounts.', 'Ob eine einzelne Transaktion auf mehrere Kategorien oder Konten aufgeteilt werden kann.'
  UNION ALL SELECT 'personal-finance', 'budgeting_expense_management', 'custom_categories', 'Custom categories / tags', 'Benutzerdefinierte Kategorien / Tags', 'boolean', 'beneficial', 'optional', 1050, 'Whether users can create their own transaction categories and tags beyond built-in defaults.', 'Ob Benutzer eigene Transaktionskategorien und Tags ueber die Standardvorgaben hinaus erstellen koennen.'
  UNION ALL SELECT 'personal-finance', 'budgeting_expense_management', 'multi_currency_support', 'Multi-currency support', 'Mehrwaehrungsunterstuetzung', 'boolean', 'informational', 'optional', 1060, 'Whether the tool can handle transactions and accounts in multiple currencies.', 'Ob das Tool Transaktionen und Konten in mehreren Waehrungen verarbeiten kann.'
  UNION ALL SELECT 'personal-finance', 'account_aggregation_import', 'bank_sync_method', 'Bank sync method', 'Banksynchronisierungsmethode', 'enum', 'informational', 'must_match', 2010, 'How the tool connects to bank accounts for transaction synchronization.', 'Wie das Tool sich mit Bankkonten zur Transaktionssynchronisierung verbindet.'
  UNION ALL SELECT 'personal-finance', 'account_aggregation_import', 'multi_institution_support', 'Multi-institution support', 'Multi-Institutions-Unterstuetzung', 'boolean', 'beneficial', 'must_match', 2020, 'Whether the tool supports connecting to multiple banks or financial institutions simultaneously.', 'Ob das Tool die Verbindung zu mehreren Banken oder Finanzinstituten gleichzeitig unterstuetzt.'
  UNION ALL SELECT 'personal-finance', 'account_aggregation_import', 'automatic_transaction_import', 'Automatic transaction import', 'Automatischer Transaktionsimport', 'boolean', 'beneficial', 'optional', 2030, 'Whether new transactions are automatically fetched from connected institutions.', 'Ob neue Transaktionen automatisch von verbundenen Institutionen abgerufen werden.'
  UNION ALL SELECT 'personal-finance', 'account_aggregation_import', 'supported_import_formats', 'Supported import formats', 'Unterstuetzte Importformate', 'multi_enum', 'informational', 'multi_select', 2040, 'The file formats supported for importing transaction data from external sources.', 'Die Dateiformate, die fuer den Import von Transaktionsdaten aus externen Quellen unterstuetzt werden.'
  UNION ALL SELECT 'personal-finance', 'account_aggregation_import', 'manual_transaction_entry', 'Manual transaction entry', 'Manuelle Transaktionseingabe', 'boolean', 'informational', 'optional', 2050, 'Whether users can manually add transactions when automatic import is unavailable.', 'Ob Benutzer Transaktionen manuell hinzufuegen koennen, wenn kein automatischer Import verfuegbar ist.'
  UNION ALL SELECT 'personal-finance', 'investment_portfolio_tracking', 'portfolio_tracking', 'Portfolio tracking', 'Portfolio-Tracking', 'boolean', 'beneficial', 'optional', 3010, 'Whether the tool tracks investment portfolio holdings, allocations, and values over time.', 'Ob das Tool Anlageportfolio-Bestaende, Allokationen und Werte im Zeitverlauf verfolgt.'
  UNION ALL SELECT 'personal-finance', 'investment_portfolio_tracking', 'asset_classes_tracked', 'Asset classes tracked', 'Verfolgte Anlageklassen', 'multi_enum', 'informational', 'multi_select', 3020, 'The types of investment asset classes the tool can track and report on.', 'Die Arten von Anlageklassen, die das Tool verfolgen und auswerten kann.'
  UNION ALL SELECT 'personal-finance', 'investment_portfolio_tracking', 'performance_calculation', 'Performance calculation method', 'Performance-Berechnungsmethode', 'enum', 'informational', 'optional', 3030, 'The method used to calculate investment portfolio performance returns.', 'Die Methode zur Berechnung der Anlageportfolio-Performance.'
  UNION ALL SELECT 'personal-finance', 'investment_portfolio_tracking', 'dividend_tracking', 'Dividend tracking', 'Dividendenverfolgung', 'boolean', 'informational', 'optional', 3040, 'Whether the tool tracks dividend income from portfolio holdings.', 'Ob das Tool Dividendeneinkuenfte aus Portfoliobestaenden verfolgt.'
  UNION ALL SELECT 'personal-finance', 'investment_portfolio_tracking', 'cost_basis_tracking', 'Cost basis tracking', 'Anschaffungskostenverfolgung', 'boolean', 'informational', 'optional', 3050, 'Whether the tool tracks the original purchase cost of investments for gain or loss calculation.', 'Ob das Tool die urspruenglichen Anschaffungskosten von Investitionen fuer die Gewinn- oder Verlustberechnung verfolgt.'
  UNION ALL SELECT 'personal-finance', 'investment_portfolio_tracking', 'broker_data_import', 'Broker data import', 'Broker-Datenimport', 'boolean', 'beneficial', 'optional', 3060, 'Whether the tool can import transaction data directly from brokerage accounts.', 'Ob das Tool Transaktionsdaten direkt von Brokerkonten importieren kann.'
  UNION ALL SELECT 'personal-finance', 'reporting_analytics', 'net_worth_dashboard', 'Net worth dashboard', 'Vermoegensuebersicht', 'boolean', 'beneficial', 'optional', 4010, 'Whether the tool provides a consolidated net worth overview across all accounts.', 'Ob das Tool eine konsolidierte Vermoegensuebersicht ueber alle Konten bietet.'
  UNION ALL SELECT 'personal-finance', 'reporting_analytics', 'cash_flow_analysis', 'Cash flow analysis', 'Cashflow-Analyse', 'boolean', 'beneficial', 'optional', 4020, 'Whether the tool analyzes income versus expenses to show cash flow patterns.', 'Ob das Tool Einnahmen gegenueber Ausgaben analysiert, um Cashflow-Muster aufzuzeigen.'
  UNION ALL SELECT 'personal-finance', 'reporting_analytics', 'spending_trend_reports', 'Spending trend reports', 'Ausgabentrendberichte', 'boolean', 'informational', 'optional', 4030, 'Whether the tool generates reports showing spending patterns and trends over time.', 'Ob das Tool Berichte erstellt, die Ausgabenmuster und Trends im Zeitverlauf zeigen.'
  UNION ALL SELECT 'personal-finance', 'reporting_analytics', 'tax_report_generation', 'Tax report generation', 'Steuerberichterstellung', 'boolean', 'informational', 'optional', 4040, 'Whether the tool can generate tax-relevant reports for investment gains or deductions.', 'Ob das Tool steuerrelevante Berichte fuer Anlagegewinne oder Abzuege erstellen kann.'
  UNION ALL SELECT 'personal-finance', 'reporting_analytics', 'custom_report_builder', 'Custom report builder', 'Benutzerdefinierter Berichtsersteller', 'boolean', 'informational', 'optional', 4050, 'Whether users can build custom reports with self-selected metrics and date ranges.', 'Ob Benutzer benutzerdefinierte Berichte mit selbst gewaehlten Kennzahlen und Zeitraeumen erstellen koennen.'
  UNION ALL SELECT 'personal-finance', 'reporting_analytics', 'report_export_formats', 'Report export formats', 'Berichtsexportformate', 'multi_enum', 'informational', 'multi_select', 4060, 'The file formats available for exporting generated reports.', 'Die Dateiformate, die fuer den Export erstellter Berichte verfuegbar sind.'
  UNION ALL SELECT 'personal-finance', 'financial_planning_goals', 'savings_goal_tracking', 'Savings goal tracking', 'Sparzielverfolgung', 'boolean', 'beneficial', 'optional', 5010, 'Whether the tool supports setting and tracking progress toward savings goals.', 'Ob das Tool das Setzen und Verfolgen von Fortschritten bei Sparzielen unterstuetzt.'
  UNION ALL SELECT 'personal-finance', 'financial_planning_goals', 'debt_payoff_planning', 'Debt payoff planning', 'Schuldenabbauplanung', 'boolean', 'informational', 'optional', 5020, 'Whether the tool provides planning tools for debt reduction strategies.', 'Ob das Tool Planungswerkzeuge fuer Schuldenabbaustrategien bereitstellt.'
  UNION ALL SELECT 'personal-finance', 'financial_planning_goals', 'cash_flow_forecasting', 'Cash flow forecasting', 'Cashflow-Prognose', 'boolean', 'informational', 'optional', 5030, 'Whether the tool can project future cash flow based on recurring transactions.', 'Ob das Tool zukuenftigen Cashflow basierend auf wiederkehrenden Transaktionen prognostizieren kann.'
  UNION ALL SELECT 'personal-finance', 'financial_planning_goals', 'retirement_projection', 'Retirement projection', 'Ruhestandsprojektion', 'boolean', 'informational', 'optional', 5040, 'Whether the tool offers retirement planning projections based on current savings.', 'Ob das Tool Ruhestandsplanungsprojektionen basierend auf aktuellem Sparvermoegen bietet.'
  UNION ALL SELECT 'personal-finance', 'platform_access', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 6010, 'The platforms on which the tool is available for use.', 'Die Plattformen, auf denen das Tool zur Nutzung verfuegbar ist.'
  UNION ALL SELECT 'personal-finance', 'platform_access', 'offline_access', 'Offline access', 'Offline-Zugriff', 'boolean', 'beneficial', 'optional', 6020, 'Whether the tool can function without an active internet connection.', 'Ob das Tool ohne aktive Internetverbindung funktionieren kann.'
  UNION ALL SELECT 'personal-finance', 'platform_access', 'multi_user_household', 'Multi-user / household support', 'Mehrbenutzer- / Haushaltsunterstuetzung', 'boolean', 'informational', 'optional', 6030, 'Whether multiple users or household members can share an account or data set.', 'Ob mehrere Benutzer oder Haushaltsmitglieder ein Konto oder einen Datensatz teilen koennen.'
  UNION ALL SELECT 'personal-finance', 'platform_access', 'mobile_app_available', 'Mobile app available', 'Mobile App verfuegbar', 'boolean', 'informational', 'optional', 6040, 'Whether a dedicated mobile application is available for the tool.', 'Ob eine dedizierte mobile Anwendung fuer das Tool verfuegbar ist.'
  UNION ALL SELECT 'personal-finance', 'privacy_data_control', 'data_storage_model', 'Data storage model', 'Datenspeichermodell', 'enum', 'tradeoff', 'must_match', 7010, 'Where the tool stores financial data, such as locally, cloud-hosted, or self-hosted.', 'Wo das Tool Finanzdaten speichert, z.B. lokal, Cloud-gehostet oder selbst gehostet.'
  UNION ALL SELECT 'personal-finance', 'privacy_data_control', 'bank_credential_handling', 'Bank credential handling', 'Umgang mit Bankzugangsdaten', 'enum', 'risk', 'optional', 7020, 'How the tool handles bank login credentials when connecting to financial institutions.', 'Wie das Tool Bankzugangsdaten bei der Verbindung mit Finanzinstituten handhabt.'
  UNION ALL SELECT 'personal-finance', 'privacy_data_control', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 7030, 'The geographic region where user financial data is processed and stored.', 'Die geografische Region, in der Finanznutzerdaten verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'personal-finance', 'privacy_data_control', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 7040, 'Whether all user data can be exported in a portable format for migration.', 'Ob alle Benutzerdaten in einem portablen Format fuer die Migration exportiert werden koennen.'
  UNION ALL SELECT 'personal-finance', 'privacy_data_control', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 7050, 'How the tool collects and transmits usage analytics and telemetry data.', 'Wie das Tool Nutzungsanalysen und Telemetriedaten erfasst und uebertraegt.'
  UNION ALL SELECT 'personal-finance', 'openness_deployment', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The availability and openness of the tool source code.', 'Die Verfuegbarkeit und Offenheit des Quellcodes des Tools.'
  UNION ALL SELECT 'personal-finance', 'openness_deployment', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 8020, 'The software license under which the tool is distributed.', 'Die Softwarelizenz, unter der das Tool vertrieben wird.'
  UNION ALL SELECT 'personal-finance', 'openness_deployment', 'self_hosting_option', 'Self-hosting option', 'Selbsthosting-Option', 'boolean', 'beneficial', 'must_match', 8030, 'Whether the tool can be self-hosted on personal or organizational infrastructure.', 'Ob das Tool auf eigener oder organisationseigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'personal-finance', 'openness_deployment', 'hosting_model', 'Hosting model', 'Hosting-Modell', 'enum', 'tradeoff', 'must_match', 8040, 'Whether the tool is available as cloud, self-hosted, local app, or a combination.', 'Ob das Tool als Cloud-Dienst, selbst gehostet, lokale App oder Kombination verfuegbar ist.'
  UNION ALL SELECT 'personal-finance', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'The pricing structure for accessing the tool and its features.', 'Die Preisstruktur fuer den Zugang zum Tool und seinen Funktionen.'
  UNION ALL SELECT 'personal-finance', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfuegbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a functional free version of the tool is available without payment.', 'Ob eine funktionsfaehige kostenlose Version des Tools ohne Bezahlung verfuegbar ist.'
  UNION ALL SELECT 'personal-finance', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9030, 'Target audience profiles the tool is best suited for based on features and focus.', 'Zielgruppenprofile, fuer die das Tool basierend auf Funktionen und Schwerpunkt am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'personal-finance' AS category_id, 'budget_methodology' AS criterion_key, 'envelope_based' AS option_key, 'Envelope-based' AS label_en, 'Umschlagbasiert' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'personal-finance', 'budget_methodology', 'zero_based', 'Zero-based', 'Nullbasiert', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'budget_methodology', 'goal_based', 'Goal-based', 'Zielbasiert', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'budget_methodology', 'category_tracking', 'Category tracking only', 'Nur Kategorieverfolgung', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'budget_methodology', 'no_budgeting', 'No budgeting features', 'Keine Budgetfunktionen', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'bank_sync_method', 'open_banking_psd2', 'Open Banking (PSD2)', 'Open Banking (PSD2)', 'positive', 10
  UNION ALL SELECT 'personal-finance', 'bank_sync_method', 'screen_scraping', 'Screen scraping', 'Screen Scraping', 'warning', 20
  UNION ALL SELECT 'personal-finance', 'bank_sync_method', 'file_import_only', 'File import only', 'Nur Dateiimport', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'bank_sync_method', 'api_integration', 'API integration', 'API-Integration', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'bank_sync_method', 'manual_only', 'Manual entry only', 'Nur manuelle Eingabe', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'supported_import_formats', 'csv', 'CSV', 'CSV', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'supported_import_formats', 'ofx_qfx', 'OFX / QFX', 'OFX / QFX', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'supported_import_formats', 'mt940', 'MT940', 'MT940', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'supported_import_formats', 'camt053', 'CAMT.053', 'CAMT.053', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'supported_import_formats', 'qif', 'QIF', 'QIF', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'supported_import_formats', 'json', 'JSON', 'JSON', 'neutral', 60
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'stocks', 'Stocks', 'Aktien', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'etfs', 'ETFs', 'ETFs', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'bonds', 'Bonds', 'Anleihen', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'mutual_funds', 'Mutual funds', 'Investmentfonds', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'crypto', 'Cryptocurrency', 'Kryptowaehrungen', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'real_estate', 'Real estate', 'Immobilien', 'neutral', 60
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'precious_metals', 'Precious metals', 'Edelmetalle', 'neutral', 70
  UNION ALL SELECT 'personal-finance', 'asset_classes_tracked', 'commodities', 'Commodities', 'Rohstoffe', 'neutral', 80
  UNION ALL SELECT 'personal-finance', 'performance_calculation', 'time_weighted', 'Time-weighted return (TWR)', 'Zeitgewichtete Rendite (TWR)', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'performance_calculation', 'money_weighted', 'Money-weighted return (IRR)', 'Geldgewichtete Rendite (IRR)', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'performance_calculation', 'both_methods', 'Both TWR and IRR', 'Beide TWR und IRR', 'positive', 30
  UNION ALL SELECT 'personal-finance', 'performance_calculation', 'simple_gain_loss', 'Simple gain/loss only', 'Einfacher Gewinn/Verlust', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'report_export_formats', 'csv', 'CSV', 'CSV', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'report_export_formats', 'pdf', 'PDF', 'PDF', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'report_export_formats', 'excel', 'Excel', 'Excel', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'report_export_formats', 'json', 'JSON', 'JSON', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 60
  UNION ALL SELECT 'personal-finance', 'data_storage_model', 'local_only', 'Local device only', 'Nur lokales Geraet', 'positive', 10
  UNION ALL SELECT 'personal-finance', 'data_storage_model', 'self_hosted', 'Self-hosted server', 'Selbst gehosteter Server', 'positive', 20
  UNION ALL SELECT 'personal-finance', 'data_storage_model', 'cloud_hosted', 'Cloud-hosted', 'Cloud-gehostet', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'data_storage_model', 'hybrid_local_sync', 'Hybrid (local + optional sync)', 'Hybrid (lokal + optionale Synchronisierung)', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'bank_credential_handling', 'credentials_not_needed', 'Credentials not needed', 'Zugangsdaten nicht erforderlich', 'positive', 10
  UNION ALL SELECT 'personal-finance', 'bank_credential_handling', 'open_banking_redirect', 'Open Banking redirect (no credentials shared)', 'Open Banking Weiterleitung (keine Zugangsdaten geteilt)', 'positive', 20
  UNION ALL SELECT 'personal-finance', 'bank_credential_handling', 'aggregator_stored', 'Stored by third-party aggregator', 'Von Drittanbieter-Aggregator gespeichert', 'warning', 30
  UNION ALL SELECT 'personal-finance', 'bank_credential_handling', 'locally_encrypted', 'Locally encrypted storage', 'Lokal verschluesselt gespeichert', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'personal-finance', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'personal-finance', 'data_processing_location', 'local_device', 'Local device', 'Lokales Geraet', 'positive', 40
  UNION ALL SELECT 'personal-finance', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'personal-finance', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'personal-finance', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'personal-finance', 'source_model', 'fully_open_source', 'Fully open source', 'Vollstaendig quelloffen', 'positive', 10
  UNION ALL SELECT 'personal-finance', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'personal-finance', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'hosting_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'hosting_model', 'self_hosted_only', 'Self-hosted only', 'Nur selbst gehostet', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'hosting_model', 'both', 'Both', 'Beides', 'positive', 30
  UNION ALL SELECT 'personal-finance', 'hosting_model', 'local_app_only', 'Local app only', 'Nur lokale App', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'personal-finance', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'pricing_model', 'subscription_only', 'Subscription only', 'Nur Abonnement', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'fit_profiles', 'budget_beginner', 'Budget beginner', 'Budget-Einsteiger', 'neutral', 10
  UNION ALL SELECT 'personal-finance', 'fit_profiles', 'power_budgeter', 'Power budgeter', 'Power-Budgetierer', 'neutral', 20
  UNION ALL SELECT 'personal-finance', 'fit_profiles', 'investor', 'Investor / portfolio tracker', 'Investor / Portfolio-Tracker', 'neutral', 30
  UNION ALL SELECT 'personal-finance', 'fit_profiles', 'household_planner', 'Household planner', 'Haushaltsplaner', 'neutral', 40
  UNION ALL SELECT 'personal-finance', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 50
  UNION ALL SELECT 'personal-finance', 'fit_profiles', 'self_hoster', 'Self-hoster', 'Selbst-Hoster', 'neutral', 60
  UNION ALL SELECT 'personal-finance', 'fit_profiles', 'financial_advisor', 'Financial advisor', 'Finanzberater', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'personal-finance'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'personal-finance'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('042-personal-finance-matrix-criteria');
