-- Migration 020: Define DNS Services category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('dns', 'resolver_infrastructure', 'Resolver Infrastructure', 'Resolver-Infrastruktur', 'Server network, geographic presence, and infrastructure operation model of the DNS resolver.', 'Servernetzwerk, geografische Präsenz und Betriebsmodell der Infrastruktur des DNS-Resolvers.', 100),
  ('dns', 'protocol_encryption', 'Protocol & Encryption', 'Protokoll & Verschlüsselung', 'Supported DNS transport protocols, encryption standards, and DNSSEC validation.', 'Unterstützte DNS-Transportprotokolle, Verschlüsselungsstandards und DNSSEC-Validierung.', 200),
  ('dns', 'privacy_logging', 'Privacy & Logging', 'Datenschutz & Protokollierung', 'Query logging policies, IP address retention, audit status, and data sharing practices.', 'Abfrageprotokollierungsrichtlinien, IP-Adress-Speicherung, Audit-Status und Datenweitergabepraktiken.', 300),
  ('dns', 'filtering_security', 'Filtering & Security', 'Filterung & Sicherheit', 'Malware blocking, ad filtering, parental controls, and content policy approach.', 'Malware-Blockierung, Werbefilterung, Kinderschutzfilter und Inhaltsrichtlinien-Ansatz.', 400),
  ('dns', 'platform_integration', 'Platform & Integration', 'Plattform & Integration', 'Supported operating systems, native apps, and network configuration options.', 'Unterstützte Betriebssysteme, native Apps und Netzwerkkonfigurationsoptionen.', 500),
  ('dns', 'performance_reliability', 'Performance & Reliability', 'Leistung & Zuverlässigkeit', 'Response latency, uptime guarantees, rate limits, and EDNS Client Subnet behavior.', 'Antwortlatenz, Verfügbarkeitsgarantien, Ratenlimits und EDNS-Client-Subnet-Verhalten.', 600),
  ('dns', 'customization_features', 'Customization & Features', 'Anpassung & Funktionen', 'Custom blocklists, allowlists, analytics, profiles, API access, and DNS rewrites.', 'Eigene Sperrlisten, Freigabelisten, Analysen, Profile, API-Zugang und DNS-Umschreibungen.', 700),
  ('dns', 'account_pricing', 'Account & Pricing', 'Konto & Preise', 'Free tier availability, account requirements, pricing models, and payment methods.', 'Verfügbarkeit kostenloser Stufen, Kontoanforderungen, Preismodelle und Zahlungsmethoden.', 800),
  ('dns', 'openness_governance_fit', 'Openness, Governance & Fit', 'Offenheit, Governance & Eignung', 'Source code openness, governance structure, self-hosting capability, and target user fit profiles.', 'Quellcode-Offenheit, Governance-Struktur, Self-Hosting-Fähigkeit und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'dns' AS category_id, 'resolver_infrastructure' AS group_key, 'server_location_count' AS criterion_key, 'Server location count' AS label_en, 'Serverstandortanzahl' AS label_de, 'number' AS value_type, 'informational' AS semantics, 'range' AS filter_mode, 1010 AS sort_order, 'Number of physical locations where the DNS resolver operates servers.' AS help_text_en, 'Anzahl der physischen Standorte, an denen der DNS-Resolver Server betreibt.' AS help_text_de
  UNION ALL SELECT 'dns', 'resolver_infrastructure', 'anycast_network', 'Anycast network', 'Anycast-Netzwerk', 'boolean', 'beneficial', 'optional', 1020, 'Whether the resolver uses anycast routing to direct queries to the nearest server.', 'Ob der Resolver Anycast-Routing verwendet, um Anfragen an den nächsten Server zu leiten.'
  UNION ALL SELECT 'dns', 'resolver_infrastructure', 'server_regions', 'Server regions', 'Serverregionen', 'multi_enum', 'informational', 'multi_select', 1030, 'Geographic regions where the DNS resolver has server presence.', 'Geografische Regionen, in denen der DNS-Resolver Serverpräsenz hat.'
  UNION ALL SELECT 'dns', 'resolver_infrastructure', 'infrastructure_operator', 'Infrastructure operator', 'Infrastrukturbetreiber', 'enum', 'tradeoff', 'optional', 1040, 'Who operates the physical server infrastructure behind the DNS resolver.', 'Wer die physische Serverinfrastruktur hinter dem DNS-Resolver betreibt.'
  UNION ALL SELECT 'dns', 'protocol_encryption', 'supported_protocols', 'Supported protocols', 'Unterstützte Protokolle', 'multi_enum', 'informational', 'multi_select', 2010, 'DNS transport protocols supported by the resolver for encrypted queries.', 'Vom Resolver unterstützte DNS-Transportprotokolle für verschlüsselte Anfragen.'
  UNION ALL SELECT 'dns', 'protocol_encryption', 'default_dns_protocol', 'Default DNS protocol', 'Standard-DNS-Protokoll', 'enum', 'tradeoff', 'optional', 2020, 'The DNS protocol used by default when connecting to the resolver.', 'Das standardmäßig beim Verbinden mit dem Resolver verwendete DNS-Protokoll.'
  UNION ALL SELECT 'dns', 'protocol_encryption', 'tls_version', 'Minimum TLS version', 'Minimale TLS-Version', 'enum', 'beneficial', 'optional', 2030, 'The minimum TLS version accepted by the resolver for encrypted connections.', 'Die minimale TLS-Version, die der Resolver für verschlüsselte Verbindungen akzeptiert.'
  UNION ALL SELECT 'dns', 'protocol_encryption', 'dnssec_validation', 'DNSSEC validation', 'DNSSEC-Validierung', 'boolean', 'beneficial', 'must_match', 2040, 'Whether the resolver performs DNSSEC validation to verify DNS response authenticity.', 'Ob der Resolver DNSSEC-Validierung durchführt, um die Authentizität von DNS-Antworten zu prüfen.'
  UNION ALL SELECT 'dns', 'protocol_encryption', 'encrypted_sni', 'Encrypted Client Hello (ECH) support', 'Encrypted Client Hello (ECH)-Unterstützung', 'enum', 'beneficial', 'optional', 2050, 'Whether the resolver supports Encrypted Client Hello to protect SNI from eavesdropping.', 'Ob der Resolver Encrypted Client Hello unterstützt, um SNI vor Abhören zu schützen.'
  UNION ALL SELECT 'dns', 'privacy_logging', 'query_logging_policy', 'Query logging policy', 'Abfrageprotokollierungsrichtlinie', 'enum', 'risk', 'must_match', 3010, 'How the resolver handles logging of DNS queries and associated metadata.', 'Wie der Resolver die Protokollierung von DNS-Anfragen und zugehörigen Metadaten handhabt.'
  UNION ALL SELECT 'dns', 'privacy_logging', 'ip_address_retention', 'IP address retention', 'IP-Adress-Speicherung', 'enum', 'risk', 'must_match', 3020, 'How the resolver handles storage and retention of client IP addresses.', 'Wie der Resolver die Speicherung und Aufbewahrung von Client-IP-Adressen handhabt.'
  UNION ALL SELECT 'dns', 'privacy_logging', 'independent_audit', 'Independent audit status', 'Unabhängiger Audit-Status', 'enum', 'beneficial', 'optional', 3030, 'Whether the resolver has undergone independent privacy or security audits.', 'Ob der Resolver unabhängige Datenschutz- oder Sicherheitsaudits durchlaufen hat.'
  UNION ALL SELECT 'dns', 'privacy_logging', 'jurisdiction', 'Legal jurisdiction', 'Rechtliche Zuständigkeit', 'enum', 'tradeoff', 'optional', 3040, 'The legal jurisdiction under which the DNS resolver operator is incorporated.', 'Die rechtliche Zuständigkeit, unter der der DNS-Resolver-Betreiber eingetragen ist.'
  UNION ALL SELECT 'dns', 'privacy_logging', 'transparency_report', 'Transparency report', 'Transparenzbericht', 'boolean', 'beneficial', 'optional', 3050, 'Whether the resolver operator publishes transparency reports on data requests.', 'Ob der Resolver-Betreiber Transparenzberichte über Datenanfragen veröffentlicht.'
  UNION ALL SELECT 'dns', 'privacy_logging', 'data_sharing_policy', 'Data sharing with third parties', 'Datenweitergabe an Dritte', 'enum', 'risk', 'optional', 3060, 'Whether and how the resolver shares query data with third parties.', 'Ob und wie der Resolver Anfragedaten an Dritte weitergibt.'
  UNION ALL SELECT 'dns', 'filtering_security', 'malware_blocking', 'Malware domain blocking', 'Malware-Domain-Blockierung', 'enum', 'beneficial', 'optional', 4010, 'Whether the resolver blocks access to known malware and phishing domains.', 'Ob der Resolver den Zugang zu bekannten Malware- und Phishing-Domains blockiert.'
  UNION ALL SELECT 'dns', 'filtering_security', 'ad_tracker_blocking', 'Ad & tracker blocking', 'Werbe- & Tracker-Blockierung', 'enum', 'informational', 'optional', 4020, 'Whether the resolver offers DNS-level blocking of ads and tracking domains.', 'Ob der Resolver DNS-basierte Blockierung von Werbe- und Tracking-Domains anbietet.'
  UNION ALL SELECT 'dns', 'filtering_security', 'parental_controls', 'Parental controls / family filter', 'Kinderschutzfilter', 'boolean', 'informational', 'optional', 4030, 'Whether the resolver offers a family-safe filtering profile for inappropriate content.', 'Ob der Resolver ein familienfreundliches Filterprofil für unangemessene Inhalte anbietet.'
  UNION ALL SELECT 'dns', 'filtering_security', 'threat_intelligence_source', 'Threat intelligence source', 'Bedrohungsintelligenz-Quelle', 'enum', 'informational', 'optional', 4040, 'Source of threat intelligence data used for malware and phishing detection.', 'Quelle der Bedrohungsintelligenz-Daten zur Erkennung von Malware und Phishing.'
  UNION ALL SELECT 'dns', 'filtering_security', 'censorship_policy', 'Censorship / content policy', 'Zensur- / Inhaltsrichtlinie', 'enum', 'tradeoff', 'optional', 4050, 'The content filtering and censorship approach applied by the resolver.', 'Der vom Resolver angewandte Ansatz zur Inhaltsfilterung und Zensur.'
  UNION ALL SELECT 'dns', 'platform_integration', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'Operating systems and device types supported by the DNS resolver.', 'Vom DNS-Resolver unterstützte Betriebssysteme und Gerätetypen.'
  UNION ALL SELECT 'dns', 'platform_integration', 'native_app_available', 'Native app available', 'Native App verfügbar', 'enum', 'beneficial', 'optional', 5020, 'Whether a dedicated application is available for device configuration.', 'Ob eine dedizierte Anwendung zur Gerätekonfiguration verfügbar ist.'
  UNION ALL SELECT 'dns', 'platform_integration', 'router_configuration', 'Router configuration support', 'Router-Konfigurationsunterstützung', 'boolean', 'informational', 'optional', 5030, 'Whether the resolver provides guidance or support for router-level configuration.', 'Ob der Resolver Anleitungen oder Unterstützung für Router-Konfiguration bietet.'
  UNION ALL SELECT 'dns', 'platform_integration', 'browser_extension_available', 'Browser extension available', 'Browser-Erweiterung verfügbar', 'boolean', 'beneficial', 'optional', 5040, 'Whether a browser extension is available for easy resolver configuration.', 'Ob eine Browser-Erweiterung für einfache Resolver-Konfiguration verfügbar ist.'
  UNION ALL SELECT 'dns', 'platform_integration', 'network_level_setup', 'Network-level setup guide', 'Netzwerkweite Einrichtungsanleitung', 'boolean', 'informational', 'optional', 5050, 'Whether the resolver provides documentation for network-wide DNS setup.', 'Ob der Resolver Dokumentation für netzwerkweite DNS-Einrichtung bereitstellt.'
  UNION ALL SELECT 'dns', 'performance_reliability', 'average_latency_europe', 'Average latency (Europe)', 'Durchschnittliche Latenz (Europa)', 'enum', 'informational', 'optional', 6010, 'Typical DNS query response time measured from European locations.', 'Typische DNS-Anfrage-Antwortzeit, gemessen von europäischen Standorten.'
  UNION ALL SELECT 'dns', 'performance_reliability', 'uptime_sla', 'Uptime SLA', 'Verfügbarkeits-SLA', 'enum', 'beneficial', 'optional', 6020, 'The uptime guarantee or service level agreement offered by the resolver.', 'Die vom Resolver angebotene Verfügbarkeitsgarantie oder Dienstgütevereinbarung.'
  UNION ALL SELECT 'dns', 'performance_reliability', 'rate_limiting', 'Rate limiting', 'Ratenbegrenzung', 'enum', 'informational', 'optional', 6030, 'Whether and how aggressively the resolver limits query rates per client.', 'Ob und wie aggressiv der Resolver Abfrageraten pro Client begrenzt.'
  UNION ALL SELECT 'dns', 'performance_reliability', 'ecs_support', 'EDNS Client Subnet (ECS) support', 'EDNS Client Subnet (ECS)-Unterstützung', 'enum', 'tradeoff', 'optional', 6040, 'Whether the resolver forwards client subnet information to authoritative servers for CDN optimization, trading privacy for performance.', 'Ob der Resolver Client-Subnetz-Informationen an autoritative Server zur CDN-Optimierung weiterleitet, wobei Datenschutz gegen Leistung getauscht wird.'
  UNION ALL SELECT 'dns', 'customization_features', 'custom_blocklists', 'Custom blocklists', 'Eigene Sperrlisten', 'boolean', 'beneficial', 'optional', 7010, 'Whether users can add custom domain blocklists to the resolver.', 'Ob Nutzer eigene Domain-Sperrlisten zum Resolver hinzufügen können.'
  UNION ALL SELECT 'dns', 'customization_features', 'allowlisting', 'Allowlisting (whitelist)', 'Freigabeliste (Whitelist)', 'boolean', 'beneficial', 'optional', 7020, 'Whether users can exempt specific domains from blocking rules.', 'Ob Nutzer bestimmte Domains von Blockierungsregeln ausnehmen können.'
  UNION ALL SELECT 'dns', 'customization_features', 'query_analytics_dashboard', 'Query analytics dashboard', 'Abfrageanalyse-Dashboard', 'boolean', 'informational', 'optional', 7030, 'Whether a dashboard is available to view DNS query statistics and logs.', 'Ob ein Dashboard zur Anzeige von DNS-Abfragestatistiken und -protokollen verfügbar ist.'
  UNION ALL SELECT 'dns', 'customization_features', 'multiple_profiles', 'Multiple DNS profiles', 'Mehrere DNS-Profile', 'boolean', 'informational', 'optional', 7040, 'Whether the resolver supports multiple configurations or filtering profiles.', 'Ob der Resolver mehrere Konfigurationen oder Filterprofile unterstützt.'
  UNION ALL SELECT 'dns', 'customization_features', 'api_access', 'API access', 'API-Zugang', 'boolean', 'beneficial', 'optional', 7050, 'Whether a programmatic API is available for managing resolver settings.', 'Ob eine programmatische API zur Verwaltung von Resolver-Einstellungen verfügbar ist.'
  UNION ALL SELECT 'dns', 'customization_features', 'rewrites_and_redirects', 'DNS rewrites & redirects', 'DNS-Umschreibungen & -Weiterleitungen', 'boolean', 'informational', 'optional', 7060, 'Whether the resolver allows custom DNS rewrites and domain redirects.', 'Ob der Resolver eigene DNS-Umschreibungen und Domain-Weiterleitungen erlaubt.'
  UNION ALL SELECT 'dns', 'account_pricing', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 8010, 'Whether a free tier is available without payment or time limits.', 'Ob eine kostenlose Stufe ohne Zahlung oder Zeitbegrenzung verfügbar ist.'
  UNION ALL SELECT 'dns', 'account_pricing', 'account_required', 'Account required', 'Konto erforderlich', 'enum', 'tradeoff', 'optional', 8020, 'Whether an account is needed to use the DNS resolver service.', 'Ob ein Konto zur Nutzung des DNS-Resolver-Dienstes erforderlich ist.'
  UNION ALL SELECT 'dns', 'account_pricing', 'premium_pricing_model', 'Premium pricing model', 'Premium-Preismodell', 'enum', 'informational', 'optional', 8030, 'The pricing model for premium or paid features of the resolver.', 'Das Preismodell für Premium- oder kostenpflichtige Funktionen des Resolvers.'
  UNION ALL SELECT 'dns', 'account_pricing', 'cryptocurrency_payment', 'Cryptocurrency payment', 'Kryptowährungszahlung', 'boolean', 'beneficial', 'optional', 8040, 'Whether cryptocurrency is accepted as a payment method.', 'Ob Kryptowährung als Zahlungsmethode akzeptiert wird.'
  UNION ALL SELECT 'dns', 'openness_governance_fit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The openness model of the DNS resolver source code.', 'Das Offenheitsmodell des DNS-Resolver-Quellcodes.'
  UNION ALL SELECT 'dns', 'openness_governance_fit', 'governance_model', 'Governance model', 'Governance-Modell', 'enum', 'informational', 'optional', 9020, 'The organizational and decision-making structure behind the DNS resolver.', 'Die Organisations- und Entscheidungsstruktur hinter dem DNS-Resolver.'
  UNION ALL SELECT 'dns', 'openness_governance_fit', 'self_hostable', 'Self-hostable resolver', 'Self-Hosting-fähiger Resolver', 'boolean', 'beneficial', 'optional', 9030, 'Whether the resolver software can be self-hosted on private infrastructure.', 'Ob die Resolver-Software auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'dns', 'openness_governance_fit', 'bug_bounty_program', 'Bug bounty program', 'Bug-Bounty-Programm', 'boolean', 'beneficial', 'optional', 9040, 'Whether the resolver operator runs a security vulnerability reward program.', 'Ob der Resolver-Betreiber ein Sicherheitslücken-Belohnungsprogramm betreibt.'
  UNION ALL SELECT 'dns', 'openness_governance_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user profiles or use cases the DNS resolver is well suited for.', 'Typische Nutzerprofile oder Anwendungsfälle, für die der DNS-Resolver gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'dns' AS category_id, 'server_regions' AS criterion_key, 'europe' AS option_key, 'Europe' AS label_en, 'Europa' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'dns', 'server_regions', 'north_america', 'North America', 'Nordamerika', 'neutral', 20
  UNION ALL SELECT 'dns', 'server_regions', 'asia_pacific', 'Asia-Pacific', 'Asien-Pazifik', 'neutral', 30
  UNION ALL SELECT 'dns', 'server_regions', 'south_america', 'South America', 'Südamerika', 'neutral', 40
  UNION ALL SELECT 'dns', 'server_regions', 'africa', 'Africa', 'Afrika', 'neutral', 50
  UNION ALL SELECT 'dns', 'server_regions', 'middle_east', 'Middle East', 'Naher Osten', 'neutral', 60
  UNION ALL SELECT 'dns', 'infrastructure_operator', 'self_operated', 'Self-operated', 'Selbst betrieben', 'positive', 10
  UNION ALL SELECT 'dns', 'infrastructure_operator', 'partner_hosted', 'Partner hosted', 'Partner-gehostet', 'neutral', 20
  UNION ALL SELECT 'dns', 'infrastructure_operator', 'cloud_provider', 'Cloud provider', 'Cloud-Anbieter', 'neutral', 30
  UNION ALL SELECT 'dns', 'infrastructure_operator', 'mixed', 'Mixed', 'Gemischt', 'neutral', 40
  UNION ALL SELECT 'dns', 'supported_protocols', 'dns_over_https', 'DNS over HTTPS (DoH)', 'DNS über HTTPS (DoH)', 'neutral', 10
  UNION ALL SELECT 'dns', 'supported_protocols', 'dns_over_tls', 'DNS over TLS (DoT)', 'DNS über TLS (DoT)', 'neutral', 20
  UNION ALL SELECT 'dns', 'supported_protocols', 'dns_over_quic', 'DNS over QUIC (DoQ)', 'DNS über QUIC (DoQ)', 'neutral', 30
  UNION ALL SELECT 'dns', 'supported_protocols', 'dnscrypt', 'DNSCrypt', 'DNSCrypt', 'neutral', 40
  UNION ALL SELECT 'dns', 'supported_protocols', 'plain_dns', 'Plain DNS', 'Unverschlüsseltes DNS', 'neutral', 50
  UNION ALL SELECT 'dns', 'supported_protocols', 'dns_over_https3', 'DNS over HTTP/3 (DoH3)', 'DNS über HTTP/3 (DoH3)', 'neutral', 60
  UNION ALL SELECT 'dns', 'default_dns_protocol', 'dns_over_https', 'DNS over HTTPS', 'DNS über HTTPS', 'neutral', 10
  UNION ALL SELECT 'dns', 'default_dns_protocol', 'dns_over_tls', 'DNS over TLS', 'DNS über TLS', 'neutral', 20
  UNION ALL SELECT 'dns', 'default_dns_protocol', 'dns_over_quic', 'DNS over QUIC', 'DNS über QUIC', 'neutral', 30
  UNION ALL SELECT 'dns', 'default_dns_protocol', 'plain_dns', 'Plain DNS', 'Unverschlüsseltes DNS', 'neutral', 40
  UNION ALL SELECT 'dns', 'tls_version', 'tls_1_3_only', 'TLS 1.3 only', 'Nur TLS 1.3', 'positive', 10
  UNION ALL SELECT 'dns', 'tls_version', 'tls_1_2_and_above', 'TLS 1.2 and above', 'TLS 1.2 und höher', 'neutral', 20
  UNION ALL SELECT 'dns', 'tls_version', 'tls_1_1_and_above', 'TLS 1.1 and above', 'TLS 1.1 und höher', 'warning', 30
  UNION ALL SELECT 'dns', 'encrypted_sni', 'supported', 'Supported', 'Unterstützt', 'positive', 10
  UNION ALL SELECT 'dns', 'encrypted_sni', 'planned', 'Planned', 'Geplant', 'neutral', 20
  UNION ALL SELECT 'dns', 'encrypted_sni', 'not_supported', 'Not supported', 'Nicht unterstützt', 'tradeoff', 30
  UNION ALL SELECT 'dns', 'query_logging_policy', 'no_logging', 'No logging', 'Keine Protokollierung', 'positive', 10
  UNION ALL SELECT 'dns', 'query_logging_policy', 'anonymized_aggregates', 'Anonymized aggregates', 'Anonymisierte Aggregate', 'tradeoff', 20
  UNION ALL SELECT 'dns', 'query_logging_policy', 'temporary_debug_logs', 'Temporary debug logs', 'Temporäre Debug-Protokolle', 'warning', 30
  UNION ALL SELECT 'dns', 'query_logging_policy', 'full_query_logging', 'Full query logging', 'Vollständige Abfrageprotokollierung', 'negative', 40
  UNION ALL SELECT 'dns', 'ip_address_retention', 'never_stored', 'Never stored', 'Nie gespeichert', 'positive', 10
  UNION ALL SELECT 'dns', 'ip_address_retention', 'hashed_or_truncated', 'Hashed or truncated', 'Gehasht oder gekürzt', 'tradeoff', 20
  UNION ALL SELECT 'dns', 'ip_address_retention', 'retained_short_term', 'Retained short-term', 'Kurzfristig gespeichert', 'warning', 30
  UNION ALL SELECT 'dns', 'ip_address_retention', 'retained_long_term', 'Retained long-term', 'Langfristig gespeichert', 'negative', 40
  UNION ALL SELECT 'dns', 'independent_audit', 'multiple_audits', 'Multiple audits', 'Mehrere Audits', 'positive', 10
  UNION ALL SELECT 'dns', 'independent_audit', 'single_audit', 'Single audit', 'Einzelner Audit', 'positive', 20
  UNION ALL SELECT 'dns', 'independent_audit', 'audit_planned', 'Audit planned', 'Audit geplant', 'neutral', 30
  UNION ALL SELECT 'dns', 'independent_audit', 'no_audit', 'No audit', 'Kein Audit', 'tradeoff', 40
  UNION ALL SELECT 'dns', 'jurisdiction', 'non_eyes_eu', 'Non-Eyes EU', 'Nicht-Eyes EU', 'positive', 10
  UNION ALL SELECT 'dns', 'jurisdiction', 'non_eyes_non_eu', 'Non-Eyes non-EU', 'Nicht-Eyes Nicht-EU', 'neutral', 20
  UNION ALL SELECT 'dns', 'jurisdiction', 'five_eyes', 'Five Eyes', 'Five Eyes', 'warning', 30
  UNION ALL SELECT 'dns', 'jurisdiction', 'nine_eyes', 'Nine Eyes', 'Nine Eyes', 'warning', 40
  UNION ALL SELECT 'dns', 'jurisdiction', 'fourteen_eyes', 'Fourteen Eyes', 'Fourteen Eyes', 'tradeoff', 50
  UNION ALL SELECT 'dns', 'data_sharing_policy', 'no_sharing', 'No sharing', 'Keine Weitergabe', 'positive', 10
  UNION ALL SELECT 'dns', 'data_sharing_policy', 'anonymized_sharing', 'Anonymized sharing', 'Anonymisierte Weitergabe', 'neutral', 20
  UNION ALL SELECT 'dns', 'data_sharing_policy', 'partner_sharing', 'Partner sharing', 'Partnerweitergabe', 'warning', 30
  UNION ALL SELECT 'dns', 'data_sharing_policy', 'unclear', 'Unclear', 'Unklar', 'warning', 40
  UNION ALL SELECT 'dns', 'malware_blocking', 'included_default', 'Included by default', 'Standardmäßig enthalten', 'positive', 10
  UNION ALL SELECT 'dns', 'malware_blocking', 'opt_in_profile', 'Opt-in profile', 'Opt-in-Profil', 'neutral', 20
  UNION ALL SELECT 'dns', 'malware_blocking', 'not_available', 'Not available', 'Nicht verfügbar', 'tradeoff', 30
  UNION ALL SELECT 'dns', 'ad_tracker_blocking', 'included_default', 'Included by default', 'Standardmäßig enthalten', 'neutral', 10
  UNION ALL SELECT 'dns', 'ad_tracker_blocking', 'opt_in_profile', 'Opt-in profile', 'Opt-in-Profil', 'neutral', 20
  UNION ALL SELECT 'dns', 'ad_tracker_blocking', 'not_available', 'Not available', 'Nicht verfügbar', 'neutral', 30
  UNION ALL SELECT 'dns', 'threat_intelligence_source', 'proprietary_curated', 'Proprietary curated', 'Proprietär kuratiert', 'neutral', 10
  UNION ALL SELECT 'dns', 'threat_intelligence_source', 'community_feeds', 'Community feeds', 'Community-Feeds', 'neutral', 20
  UNION ALL SELECT 'dns', 'threat_intelligence_source', 'mixed_sources', 'Mixed sources', 'Gemischte Quellen', 'neutral', 30
  UNION ALL SELECT 'dns', 'threat_intelligence_source', 'none', 'None', 'Keine', 'neutral', 40
  UNION ALL SELECT 'dns', 'censorship_policy', 'uncensored', 'Uncensored', 'Unzensiert', 'neutral', 10
  UNION ALL SELECT 'dns', 'censorship_policy', 'minimal_malware_only', 'Minimal (malware only)', 'Minimal (nur Malware)', 'neutral', 20
  UNION ALL SELECT 'dns', 'censorship_policy', 'moderate_filtering', 'Moderate filtering', 'Moderate Filterung', 'neutral', 30
  UNION ALL SELECT 'dns', 'censorship_policy', 'government_mandated', 'Government mandated', 'Staatlich vorgeschrieben', 'warning', 40
  UNION ALL SELECT 'dns', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'dns', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'dns', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'dns', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'dns', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'dns', 'supported_platforms', 'router', 'Router', 'Router', 'neutral', 60
  UNION ALL SELECT 'dns', 'native_app_available', 'full_app', 'Full app', 'Vollständige App', 'positive', 10
  UNION ALL SELECT 'dns', 'native_app_available', 'profile_installer', 'Profile installer', 'Profilinstallation', 'neutral', 20
  UNION ALL SELECT 'dns', 'native_app_available', 'configuration_only', 'Configuration only', 'Nur Konfiguration', 'neutral', 30
  UNION ALL SELECT 'dns', 'native_app_available', 'not_available', 'Not available', 'Nicht verfügbar', 'tradeoff', 40
  UNION ALL SELECT 'dns', 'average_latency_europe', 'under_10ms', 'Under 10 ms', 'Unter 10 ms', 'neutral', 10
  UNION ALL SELECT 'dns', 'average_latency_europe', '10_to_30ms', '10-30 ms', '10-30 ms', 'neutral', 20
  UNION ALL SELECT 'dns', 'average_latency_europe', '30_to_100ms', '30-100 ms', '30-100 ms', 'neutral', 30
  UNION ALL SELECT 'dns', 'average_latency_europe', 'over_100ms', 'Over 100 ms', 'Über 100 ms', 'neutral', 40
  UNION ALL SELECT 'dns', 'uptime_sla', 'sla_99_99', '99.99% SLA', '99,99% SLA', 'positive', 10
  UNION ALL SELECT 'dns', 'uptime_sla', 'sla_99_9', '99.9% SLA', '99,9% SLA', 'neutral', 20
  UNION ALL SELECT 'dns', 'uptime_sla', 'best_effort', 'Best effort', 'Nach bestem Bemühen', 'tradeoff', 30
  UNION ALL SELECT 'dns', 'uptime_sla', 'no_sla', 'No SLA', 'Kein SLA', 'neutral', 40
  UNION ALL SELECT 'dns', 'rate_limiting', 'no_limits', 'No limits', 'Keine Limits', 'neutral', 10
  UNION ALL SELECT 'dns', 'rate_limiting', 'generous_limits', 'Generous limits', 'Großzügige Limits', 'neutral', 20
  UNION ALL SELECT 'dns', 'rate_limiting', 'moderate_limits', 'Moderate limits', 'Moderate Limits', 'neutral', 30
  UNION ALL SELECT 'dns', 'rate_limiting', 'strict_limits', 'Strict limits', 'Strenge Limits', 'neutral', 40
  UNION ALL SELECT 'dns', 'ecs_support', 'full_ecs', 'Full ECS', 'Volles ECS', 'tradeoff', 10
  UNION ALL SELECT 'dns', 'ecs_support', 'privacy_ecs', 'Privacy ECS', 'Datenschutz-ECS', 'positive', 20
  UNION ALL SELECT 'dns', 'ecs_support', 'no_ecs', 'No ECS', 'Kein ECS', 'neutral', 30
  UNION ALL SELECT 'dns', 'account_required', 'no_account_needed', 'No account needed', 'Kein Konto erforderlich', 'positive', 10
  UNION ALL SELECT 'dns', 'account_required', 'optional_account', 'Optional account', 'Optionales Konto', 'neutral', 20
  UNION ALL SELECT 'dns', 'account_required', 'account_required', 'Account required', 'Konto erforderlich', 'tradeoff', 30
  UNION ALL SELECT 'dns', 'premium_pricing_model', 'donation_based', 'Donation based', 'Spendenbasiert', 'neutral', 10
  UNION ALL SELECT 'dns', 'premium_pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 20
  UNION ALL SELECT 'dns', 'premium_pricing_model', 'usage_based', 'Usage based', 'Nutzungsbasiert', 'neutral', 30
  UNION ALL SELECT 'dns', 'premium_pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 40
  UNION ALL SELECT 'dns', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'dns', 'source_model', 'source_available', 'Source available', 'Quellcode verfügbar', 'neutral', 20
  UNION ALL SELECT 'dns', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'dns', 'source_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 40
  UNION ALL SELECT 'dns', 'governance_model', 'community_driven', 'Community driven', 'Community-getrieben', 'positive', 10
  UNION ALL SELECT 'dns', 'governance_model', 'foundation_backed', 'Foundation backed', 'Stiftungsunterstützt', 'positive', 20
  UNION ALL SELECT 'dns', 'governance_model', 'nonprofit', 'Nonprofit', 'Gemeinnützig', 'positive', 30
  UNION ALL SELECT 'dns', 'governance_model', 'corporate_independent', 'Corporate independent', 'Unabhängiges Unternehmen', 'neutral', 40
  UNION ALL SELECT 'dns', 'governance_model', 'corporate_conglomerate', 'Corporate conglomerate', 'Unternehmenskonglomerat', 'tradeoff', 50
  UNION ALL SELECT 'dns', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'neutral', 10
  UNION ALL SELECT 'dns', 'fit_profiles', 'family_safety', 'Family safety', 'Familiensicherheit', 'neutral', 20
  UNION ALL SELECT 'dns', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'dns', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 40
  UNION ALL SELECT 'dns', 'fit_profiles', 'minimal_setup', 'Minimal setup', 'Minimale Einrichtung', 'neutral', 50
  UNION ALL SELECT 'dns', 'fit_profiles', 'advanced_customization', 'Advanced customization', 'Erweiterte Anpassung', 'neutral', 60
  UNION ALL SELECT 'dns', 'fit_profiles', 'censorship_circumvention', 'Censorship circumvention', 'Zensurumgehung', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'dns'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'dns'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('020-dns-matrix-criteria');
