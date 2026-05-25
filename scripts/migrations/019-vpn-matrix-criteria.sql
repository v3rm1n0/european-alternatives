-- Migration 019: Define VPN category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('vpn', 'network_infrastructure', 'Network & Infrastructure', 'Netzwerk & Infrastruktur', 'Server network, geographic distribution, and core infrastructure of the VPN provider.', 'Servernetzwerk, geografische Verteilung und grundlegende Infrastruktur des VPN-Anbieters.', 100),
  ('vpn', 'encryption_protocols', 'Encryption & Protocols', 'Verschluesselung & Protokolle', 'VPN tunnel protocols, cipher strength, and key exchange mechanisms.', 'VPN-Tunnel-Protokolle, Verschluesselungsstaerke und Schluesselaustausch-Mechanismen.', 200),
  ('vpn', 'privacy_logging', 'Privacy & Logging Policy', 'Datenschutz & Protokollierungsrichtlinie', 'No-log policies, independent audits, and legal jurisdiction of the provider.', 'No-Log-Richtlinien, unabhaengige Audits und rechtliche Zustaendigkeit des Anbieters.', 300),
  ('vpn', 'leak_protection', 'Leak Protection & Kill Switch', 'Leckschutz & Kill Switch', 'DNS, IPv6, and WebRTC leak prevention and kill switch functionality.', 'DNS-, IPv6- und WebRTC-Leckschutz sowie Kill-Switch-Funktionalitaet.', 400),
  ('vpn', 'platform_apps', 'Platform & Apps', 'Plattform & Apps', 'Supported operating systems, router compatibility, and simultaneous connections.', 'Unterstuetzte Betriebssysteme, Router-Kompatibilitaet und gleichzeitige Verbindungen.', 500),
  ('vpn', 'streaming_performance', 'Streaming & Performance', 'Streaming & Leistung', 'Streaming unblocking, bandwidth limits, and data transfer allowances.', 'Streaming-Entsperrung, Bandbreitenlimits und Datentransfer-Volumina.', 600),
  ('vpn', 'advanced_features', 'Advanced Features', 'Erweiterte Funktionen', 'Split tunneling, multi-hop, Tor-over-VPN, port forwarding, and other power user features.', 'Split Tunneling, Multi-Hop, Tor-ueber-VPN, Portweiterleitung und weitere Funktionen fuer fortgeschrittene Nutzer.', 700),
  ('vpn', 'account_payment', 'Account & Payment', 'Konto & Bezahlung', 'Anonymous signup, payment methods, free tiers, and refund guarantees.', 'Anonyme Anmeldung, Zahlungsmethoden, kostenlose Stufen und Rueckerstattungsgarantien.', 800),
  ('vpn', 'openness_governance_fit', 'Openness, Governance & Fit', 'Offenheit, Governance & Eignung', 'Source code openness, governance structure, bug bounty programs, and target user fit profiles.', 'Quellcode-Offenheit, Governance-Struktur, Bug-Bounty-Programme und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'vpn' AS category_id, 'network_infrastructure' AS group_key, 'server_country_count' AS criterion_key, 'Server country count' AS label_en, 'Serverlaenderanzahl' AS label_de, 'number' AS value_type, 'informational' AS semantics, 'range' AS filter_mode, 1010 AS sort_order, 'Number of countries where the VPN provider operates servers.' AS help_text_en, 'Anzahl der Laender, in denen der VPN-Anbieter Server betreibt.' AS help_text_de
  UNION ALL SELECT 'vpn', 'network_infrastructure', 'server_count_range', 'Server count range', 'Serveranzahl-Bereich', 'enum', 'informational', 'optional', 1020, 'Approximate total number of servers in the provider network.', 'Ungefaehre Gesamtzahl der Server im Anbieternetzwerk.'
  UNION ALL SELECT 'vpn', 'network_infrastructure', 'owns_physical_servers', 'Owns physical servers', 'Eigene physische Server', 'enum', 'tradeoff', 'optional', 1030, 'Whether the provider owns or rents its server infrastructure.', 'Ob der Anbieter seine Serverinfrastruktur besitzt oder mietet.'
  UNION ALL SELECT 'vpn', 'network_infrastructure', 'ram_only_servers', 'RAM-only (diskless) servers', 'Nur-RAM-Server (festplattenlos)', 'boolean', 'beneficial', 'optional', 1040, 'Whether servers run entirely in RAM without persistent storage.', 'Ob Server vollstaendig im RAM ohne dauerhaften Speicher laufen.'
  UNION ALL SELECT 'vpn', 'network_infrastructure', 'network_type', 'Network type', 'Netzwerktyp', 'enum', 'informational', 'optional', 1050, 'Whether the VPN network is shared, dedicated, or hybrid.', 'Ob das VPN-Netzwerk gemeinsam genutzt, dediziert oder hybrid ist.'
  UNION ALL SELECT 'vpn', 'encryption_protocols', 'supported_vpn_protocols', 'Supported VPN protocols', 'Unterstuetzte VPN-Protokolle', 'multi_enum', 'informational', 'multi_select', 2010, 'VPN tunnel protocols supported by the provider.', 'Vom Anbieter unterstuetzte VPN-Tunnel-Protokolle.'
  UNION ALL SELECT 'vpn', 'encryption_protocols', 'default_vpn_protocol', 'Default VPN protocol', 'Standard-VPN-Protokoll', 'enum', 'tradeoff', 'optional', 2020, 'The VPN protocol used by default in client applications.', 'Das standardmaessig in Client-Anwendungen verwendete VPN-Protokoll.'
  UNION ALL SELECT 'vpn', 'encryption_protocols', 'cipher_strength', 'Cipher strength', 'Verschluesselungsstaerke', 'enum', 'beneficial', 'must_match', 2030, 'The encryption cipher used for the VPN tunnel.', 'Die fuer den VPN-Tunnel verwendete Verschluesselungschiffre.'
  UNION ALL SELECT 'vpn', 'encryption_protocols', 'perfect_forward_secrecy', 'Perfect forward secrecy', 'Perfect Forward Secrecy', 'boolean', 'beneficial', 'optional', 2040, 'Whether the VPN uses ephemeral keys to prevent retroactive decryption.', 'Ob das VPN ephemere Schluessel verwendet, um rueckwirkende Entschluesselung zu verhindern.'
  UNION ALL SELECT 'vpn', 'encryption_protocols', 'post_quantum_readiness', 'Post-quantum readiness', 'Post-Quanten-Bereitschaft', 'enum', 'informational', 'optional', 2050, 'Readiness for post-quantum cryptographic standards.', 'Bereitschaft fuer Post-Quanten-Kryptographiestandards.'
  UNION ALL SELECT 'vpn', 'privacy_logging', 'logging_policy', 'Logging policy', 'Protokollierungsrichtlinie', 'enum', 'risk', 'must_match', 3010, 'The type and extent of user activity and connection data logged by the provider.', 'Art und Umfang der vom Anbieter protokollierten Nutzeraktivitaets- und Verbindungsdaten.'
  UNION ALL SELECT 'vpn', 'privacy_logging', 'independent_audit_status', 'Independent audit status', 'Unabhaengiger Audit-Status', 'enum', 'beneficial', 'optional', 3020, 'Whether the provider has undergone independent security or no-log audits.', 'Ob der Anbieter unabhaengige Sicherheits- oder No-Log-Audits durchlaufen hat.'
  UNION ALL SELECT 'vpn', 'privacy_logging', 'jurisdiction', 'Legal jurisdiction', 'Rechtliche Zustaendigkeit', 'enum', 'tradeoff', 'optional', 3030, 'The legal jurisdiction under which the VPN provider operates.', 'Die rechtliche Zustaendigkeit, unter der der VPN-Anbieter operiert.'
  UNION ALL SELECT 'vpn', 'privacy_logging', 'warrant_canary', 'Warrant canary', 'Warrant Canary', 'boolean', 'beneficial', 'optional', 3040, 'Whether the provider publishes a warrant canary to signal absence of secret government orders.', 'Ob der Anbieter einen Warrant Canary veroeffentlicht, um das Fehlen geheimer Regierungsanordnungen zu signalisieren.'
  UNION ALL SELECT 'vpn', 'privacy_logging', 'transparency_report', 'Transparency report', 'Transparenzbericht', 'boolean', 'beneficial', 'optional', 3050, 'Whether the provider regularly publishes transparency reports on law enforcement requests.', 'Ob der Anbieter regelmaessig Transparenzberichte ueber Anfragen von Strafverfolgungsbehoerden veroeffentlicht.'
  UNION ALL SELECT 'vpn', 'leak_protection', 'kill_switch', 'Kill switch', 'Kill Switch', 'enum', 'beneficial', 'must_match', 4010, 'Whether the VPN includes a kill switch to block traffic if the connection drops.', 'Ob das VPN einen Kill Switch zum Blockieren des Datenverkehrs bei Verbindungsabbruch enthaelt.'
  UNION ALL SELECT 'vpn', 'leak_protection', 'dns_leak_protection', 'DNS leak protection', 'DNS-Leckschutz', 'boolean', 'beneficial', 'optional', 4020, 'Whether DNS queries are routed through the VPN tunnel to prevent leaks.', 'Ob DNS-Anfragen durch den VPN-Tunnel geleitet werden, um Lecks zu verhindern.'
  UNION ALL SELECT 'vpn', 'leak_protection', 'ipv6_leak_protection', 'IPv6 leak protection', 'IPv6-Leckschutz', 'enum', 'beneficial', 'optional', 4030, 'How the VPN handles IPv6 traffic to prevent address leaks.', 'Wie das VPN IPv6-Datenverkehr behandelt, um Adresslecks zu verhindern.'
  UNION ALL SELECT 'vpn', 'leak_protection', 'webrtc_leak_prevention', 'WebRTC leak prevention', 'WebRTC-Leckschutz', 'enum', 'informational', 'optional', 4040, 'Whether the VPN prevents WebRTC-based IP address leaks in browsers.', 'Ob das VPN WebRTC-basierte IP-Adresslecks in Browsern verhindert.'
  UNION ALL SELECT 'vpn', 'leak_protection', 'custom_dns_support', 'Custom DNS support', 'Eigene DNS-Unterstuetzung', 'boolean', 'beneficial', 'optional', 4050, 'Whether the VPN allows using custom DNS resolvers.', 'Ob das VPN die Nutzung eigener DNS-Resolver erlaubt.'
  UNION ALL SELECT 'vpn', 'platform_apps', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'Operating systems and platforms supported by the VPN client.', 'Vom VPN-Client unterstuetzte Betriebssysteme und Plattformen.'
  UNION ALL SELECT 'vpn', 'platform_apps', 'browser_extension_available', 'Browser extension available', 'Browser-Erweiterung verfuegbar', 'boolean', 'beneficial', 'optional', 5020, 'Whether a browser extension is available as a lightweight VPN proxy.', 'Ob eine Browser-Erweiterung als leichtgewichtiger VPN-Proxy verfuegbar ist.'
  UNION ALL SELECT 'vpn', 'platform_apps', 'simultaneous_connections', 'Simultaneous connections', 'Gleichzeitige Verbindungen', 'enum', 'informational', 'optional', 5030, 'Maximum number of devices that can connect simultaneously.', 'Maximale Anzahl von Geraeten, die gleichzeitig verbunden sein koennen.'
  UNION ALL SELECT 'vpn', 'platform_apps', 'router_firmware_support', 'Router firmware support', 'Router-Firmware-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 5040, 'Router firmware platforms supported for VPN configuration.', 'Unterstuetzte Router-Firmware-Plattformen fuer VPN-Konfiguration.'
  UNION ALL SELECT 'vpn', 'platform_apps', 'linux_gui_available', 'Linux GUI available', 'Linux-GUI verfuegbar', 'boolean', 'beneficial', 'optional', 5050, 'Whether a graphical user interface is available for the Linux client.', 'Ob eine grafische Benutzeroberflaeche fuer den Linux-Client verfuegbar ist.'
  UNION ALL SELECT 'vpn', 'streaming_performance', 'bandwidth_limit', 'Bandwidth limit', 'Bandbreitenlimit', 'enum', 'informational', 'optional', 6010, 'Whether the VPN imposes bandwidth speed limits.', 'Ob das VPN Bandbreiten-Geschwindigkeitslimits auferlegt.'
  UNION ALL SELECT 'vpn', 'streaming_performance', 'data_cap', 'Monthly data cap', 'Monatliches Datenlimit', 'enum', 'informational', 'optional', 6020, 'Monthly data transfer allowance for the VPN service.', 'Monatliches Datentransfervolumen fuer den VPN-Dienst.'
  UNION ALL SELECT 'vpn', 'streaming_performance', 'streaming_unblock_capability', 'Streaming unblock capability', 'Streaming-Entsperrfaehigkeit', 'enum', 'informational', 'optional', 6030, 'Ability to reliably access geo-restricted streaming content.', 'Faehigkeit, zuverlaessig auf geografisch eingeschraenkte Streaming-Inhalte zuzugreifen.'
  UNION ALL SELECT 'vpn', 'streaming_performance', 'p2p_torrenting_allowed', 'P2P/torrenting allowed', 'P2P/Torrenting erlaubt', 'enum', 'tradeoff', 'optional', 6040, 'Whether BitTorrent and peer-to-peer traffic is permitted on the network.', 'Ob BitTorrent- und Peer-to-Peer-Datenverkehr im Netzwerk erlaubt ist.'
  UNION ALL SELECT 'vpn', 'advanced_features', 'split_tunneling', 'Split tunneling', 'Split Tunneling', 'enum', 'beneficial', 'optional', 7010, 'Whether selected traffic can bypass the VPN tunnel.', 'Ob ausgewaehlter Datenverkehr den VPN-Tunnel umgehen kann.'
  UNION ALL SELECT 'vpn', 'advanced_features', 'multi_hop', 'Multi-hop (double VPN)', 'Multi-Hop (Doppel-VPN)', 'boolean', 'beneficial', 'optional', 7020, 'Whether traffic can be routed through two or more VPN servers.', 'Ob Datenverkehr ueber zwei oder mehr VPN-Server geleitet werden kann.'
  UNION ALL SELECT 'vpn', 'advanced_features', 'tor_over_vpn', 'Tor-over-VPN', 'Tor-ueber-VPN', 'boolean', 'informational', 'optional', 7030, 'Whether built-in Tor integration is available for additional anonymity.', 'Ob eine integrierte Tor-Integration fuer zusaetzliche Anonymitaet verfuegbar ist.'
  UNION ALL SELECT 'vpn', 'advanced_features', 'port_forwarding', 'Port forwarding', 'Portweiterleitung', 'boolean', 'informational', 'optional', 7040, 'Whether the VPN supports port forwarding for incoming connections.', 'Ob das VPN Portweiterleitung fuer eingehende Verbindungen unterstuetzt.'
  UNION ALL SELECT 'vpn', 'advanced_features', 'ad_tracker_blocker', 'Built-in ad/tracker blocker', 'Integrierter Werbe-/Tracker-Blocker', 'boolean', 'beneficial', 'optional', 7050, 'Whether the VPN includes DNS-level ad and tracker blocking.', 'Ob das VPN DNS-basierte Werbe- und Tracker-Blockierung enthaelt.'
  UNION ALL SELECT 'vpn', 'advanced_features', 'dedicated_ip_available', 'Dedicated IP available', 'Dedizierte IP verfuegbar', 'boolean', 'informational', 'optional', 7060, 'Whether a static dedicated IP address option is available.', 'Ob eine statische dedizierte IP-Adresse als Option verfuegbar ist.'
  UNION ALL SELECT 'vpn', 'account_payment', 'anonymous_signup', 'Anonymous signup', 'Anonyme Anmeldung', 'enum', 'beneficial', 'optional', 8010, 'Whether identity information is required to create an account.', 'Ob Identitaetsinformationen zur Kontoerstellung erforderlich sind.'
  UNION ALL SELECT 'vpn', 'account_payment', 'cryptocurrency_payment', 'Cryptocurrency payment', 'Kryptowaehrungszahlung', 'boolean', 'beneficial', 'optional', 8020, 'Whether cryptocurrency is accepted as a payment method.', 'Ob Kryptowaehrung als Zahlungsmethode akzeptiert wird.'
  UNION ALL SELECT 'vpn', 'account_payment', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfuegbar', 'boolean', 'informational', 'optional', 8030, 'Whether a meaningful free tier is available without payment.', 'Ob eine sinnvolle kostenlose Stufe ohne Zahlung verfuegbar ist.'
  UNION ALL SELECT 'vpn', 'account_payment', 'money_back_guarantee_days', 'Money-back guarantee (days)', 'Geld-zurueck-Garantie (Tage)', 'number', 'informational', 'range', 8040, 'Number of days for the money-back guarantee refund window.', 'Anzahl der Tage fuer das Rueckerstattungsfenster der Geld-zurueck-Garantie.'
  UNION ALL SELECT 'vpn', 'openness_governance_fit', 'client_source_model', 'Client source model', 'Client-Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The openness model of the VPN client application source code.', 'Das Offenheitsmodell des Quellcodes der VPN-Client-Anwendung.'
  UNION ALL SELECT 'vpn', 'openness_governance_fit', 'server_source_model', 'Server source model', 'Server-Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9020, 'The openness model of the VPN server-side source code.', 'Das Offenheitsmodell des serverseitigen VPN-Quellcodes.'
  UNION ALL SELECT 'vpn', 'openness_governance_fit', 'governance_model', 'Governance model', 'Governance-Modell', 'enum', 'informational', 'optional', 9030, 'The organizational and decision-making structure behind the VPN provider.', 'Die Organisations- und Entscheidungsstruktur hinter dem VPN-Anbieter.'
  UNION ALL SELECT 'vpn', 'openness_governance_fit', 'bug_bounty_program', 'Bug bounty program', 'Bug-Bounty-Programm', 'boolean', 'beneficial', 'optional', 9040, 'Whether the provider runs a security vulnerability reward program.', 'Ob der Anbieter ein Sicherheitsluecken-Belohnungsprogramm betreibt.'
  UNION ALL SELECT 'vpn', 'openness_governance_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user profiles or use cases the VPN service is well suited for.', 'Typische Nutzerprofile oder Anwendungsfaelle, fuer die der VPN-Dienst gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'vpn' AS category_id, 'server_count_range' AS criterion_key, 'under_500' AS option_key, 'Under 500' AS label_en, 'Unter 500' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'vpn', 'server_count_range', '500_to_1000', '500–1,000', '500–1.000', 'neutral', 20
  UNION ALL SELECT 'vpn', 'server_count_range', '1000_to_3000', '1,000–3,000', '1.000–3.000', 'neutral', 30
  UNION ALL SELECT 'vpn', 'server_count_range', '3000_to_5000', '3,000–5,000', '3.000–5.000', 'neutral', 40
  UNION ALL SELECT 'vpn', 'server_count_range', 'over_5000', 'Over 5,000', 'Ueber 5.000', 'neutral', 50
  UNION ALL SELECT 'vpn', 'owns_physical_servers', 'all_owned', 'All owned', 'Alle im Besitz', 'positive', 10
  UNION ALL SELECT 'vpn', 'owns_physical_servers', 'mostly_owned', 'Mostly owned', 'Ueberwiegend im Besitz', 'positive', 20
  UNION ALL SELECT 'vpn', 'owns_physical_servers', 'mixed', 'Mixed', 'Gemischt', 'neutral', 30
  UNION ALL SELECT 'vpn', 'owns_physical_servers', 'mostly_rented', 'Mostly rented', 'Ueberwiegend gemietet', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'owns_physical_servers', 'all_rented', 'All rented', 'Alle gemietet', 'tradeoff', 50
  UNION ALL SELECT 'vpn', 'network_type', 'shared', 'Shared', 'Gemeinsam genutzt', 'neutral', 10
  UNION ALL SELECT 'vpn', 'network_type', 'dedicated', 'Dedicated', 'Dediziert', 'positive', 20
  UNION ALL SELECT 'vpn', 'network_type', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'vpn', 'supported_vpn_protocols', 'wireguard', 'WireGuard', 'WireGuard', 'positive', 10
  UNION ALL SELECT 'vpn', 'supported_vpn_protocols', 'openvpn', 'OpenVPN', 'OpenVPN', 'positive', 20
  UNION ALL SELECT 'vpn', 'supported_vpn_protocols', 'ikev2_ipsec', 'IKEv2/IPSec', 'IKEv2/IPSec', 'neutral', 30
  UNION ALL SELECT 'vpn', 'supported_vpn_protocols', 'proprietary', 'Proprietary', 'Proprietaer', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'supported_vpn_protocols', 'sstp', 'SSTP', 'SSTP', 'neutral', 50
  UNION ALL SELECT 'vpn', 'supported_vpn_protocols', 'l2tp_ipsec', 'L2TP/IPSec', 'L2TP/IPSec', 'tradeoff', 60
  UNION ALL SELECT 'vpn', 'supported_vpn_protocols', 'pptp', 'PPTP', 'PPTP', 'warning', 70
  UNION ALL SELECT 'vpn', 'default_vpn_protocol', 'wireguard', 'WireGuard', 'WireGuard', 'positive', 10
  UNION ALL SELECT 'vpn', 'default_vpn_protocol', 'openvpn', 'OpenVPN', 'OpenVPN', 'positive', 20
  UNION ALL SELECT 'vpn', 'default_vpn_protocol', 'ikev2_ipsec', 'IKEv2/IPSec', 'IKEv2/IPSec', 'neutral', 30
  UNION ALL SELECT 'vpn', 'default_vpn_protocol', 'proprietary', 'Proprietary', 'Proprietaer', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'default_vpn_protocol', 'other', 'Other', 'Sonstige', 'neutral', 50
  UNION ALL SELECT 'vpn', 'cipher_strength', 'aes_256_gcm', 'AES-256-GCM', 'AES-256-GCM', 'positive', 10
  UNION ALL SELECT 'vpn', 'cipher_strength', 'chacha20_poly1305', 'ChaCha20-Poly1305', 'ChaCha20-Poly1305', 'positive', 20
  UNION ALL SELECT 'vpn', 'cipher_strength', 'aes_128', 'AES-128', 'AES-128', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'cipher_strength', 'proprietary_cipher', 'Proprietary cipher', 'Proprietaere Chiffre', 'warning', 40
  UNION ALL SELECT 'vpn', 'post_quantum_readiness', 'production_ready', 'Production ready', 'Produktionsbereit', 'positive', 10
  UNION ALL SELECT 'vpn', 'post_quantum_readiness', 'experimental', 'Experimental', 'Experimentell', 'neutral', 20
  UNION ALL SELECT 'vpn', 'post_quantum_readiness', 'announced', 'Announced', 'Angekuendigt', 'neutral', 30
  UNION ALL SELECT 'vpn', 'post_quantum_readiness', 'none', 'None', 'Keine', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'logging_policy', 'strict_no_logs', 'Strict no logs', 'Strikt keine Protokolle', 'positive', 10
  UNION ALL SELECT 'vpn', 'logging_policy', 'no_activity_logs', 'No activity logs', 'Keine Aktivitaetsprotokolle', 'positive', 20
  UNION ALL SELECT 'vpn', 'logging_policy', 'minimal_connection_logs', 'Minimal connection logs', 'Minimale Verbindungsprotokolle', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'logging_policy', 'session_logs', 'Session logs', 'Sitzungsprotokolle', 'warning', 40
  UNION ALL SELECT 'vpn', 'logging_policy', 'full_logs', 'Full logs', 'Vollstaendige Protokolle', 'negative', 50
  UNION ALL SELECT 'vpn', 'independent_audit_status', 'multiple_audits', 'Multiple audits', 'Mehrere Audits', 'positive', 10
  UNION ALL SELECT 'vpn', 'independent_audit_status', 'single_audit', 'Single audit', 'Einzelner Audit', 'positive', 20
  UNION ALL SELECT 'vpn', 'independent_audit_status', 'audit_planned', 'Audit planned', 'Audit geplant', 'neutral', 30
  UNION ALL SELECT 'vpn', 'independent_audit_status', 'no_audit', 'No audit', 'Kein Audit', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'jurisdiction', 'non_eyes_eu', 'Non-Eyes EU', 'Nicht-Eyes EU', 'positive', 10
  UNION ALL SELECT 'vpn', 'jurisdiction', 'non_eyes_non_eu', 'Non-Eyes non-EU', 'Nicht-Eyes Nicht-EU', 'neutral', 20
  UNION ALL SELECT 'vpn', 'jurisdiction', 'five_eyes', 'Five Eyes', 'Five Eyes', 'warning', 30
  UNION ALL SELECT 'vpn', 'jurisdiction', 'nine_eyes', 'Nine Eyes', 'Nine Eyes', 'warning', 40
  UNION ALL SELECT 'vpn', 'jurisdiction', 'fourteen_eyes', 'Fourteen Eyes', 'Fourteen Eyes', 'tradeoff', 50
  UNION ALL SELECT 'vpn', 'kill_switch', 'always_on', 'Always on', 'Immer aktiv', 'positive', 10
  UNION ALL SELECT 'vpn', 'kill_switch', 'app_level', 'App level', 'App-Ebene', 'neutral', 20
  UNION ALL SELECT 'vpn', 'kill_switch', 'not_available', 'Not available', 'Nicht verfuegbar', 'warning', 30
  UNION ALL SELECT 'vpn', 'ipv6_leak_protection', 'full_blocking', 'Full blocking', 'Vollstaendige Blockierung', 'positive', 10
  UNION ALL SELECT 'vpn', 'ipv6_leak_protection', 'tunnel_ipv6', 'Tunnel IPv6', 'IPv6-Tunnel', 'positive', 20
  UNION ALL SELECT 'vpn', 'ipv6_leak_protection', 'not_available', 'Not available', 'Nicht verfuegbar', 'warning', 30
  UNION ALL SELECT 'vpn', 'webrtc_leak_prevention', 'built_in_app', 'Built-in (app)', 'Integriert (App)', 'positive', 10
  UNION ALL SELECT 'vpn', 'webrtc_leak_prevention', 'browser_extension_only', 'Browser extension only', 'Nur Browser-Erweiterung', 'neutral', 20
  UNION ALL SELECT 'vpn', 'webrtc_leak_prevention', 'not_available', 'Not available', 'Nicht verfuegbar', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'vpn', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'vpn', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'vpn', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 40
  UNION ALL SELECT 'vpn', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'vpn', 'supported_platforms', 'router', 'Router', 'Router', 'neutral', 60
  UNION ALL SELECT 'vpn', 'simultaneous_connections', 'one', 'One', 'Eine', 'tradeoff', 10
  UNION ALL SELECT 'vpn', 'simultaneous_connections', 'up_to_5', 'Up to 5', 'Bis zu 5', 'neutral', 20
  UNION ALL SELECT 'vpn', 'simultaneous_connections', 'up_to_10', 'Up to 10', 'Bis zu 10', 'neutral', 30
  UNION ALL SELECT 'vpn', 'simultaneous_connections', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 40
  UNION ALL SELECT 'vpn', 'router_firmware_support', 'openwrt', 'OpenWrt', 'OpenWrt', 'neutral', 10
  UNION ALL SELECT 'vpn', 'router_firmware_support', 'ddwrt', 'DD-WRT', 'DD-WRT', 'neutral', 20
  UNION ALL SELECT 'vpn', 'router_firmware_support', 'pfsense', 'pfSense', 'pfSense', 'neutral', 30
  UNION ALL SELECT 'vpn', 'router_firmware_support', 'native_firmware', 'Native firmware', 'Native Firmware', 'neutral', 40
  UNION ALL SELECT 'vpn', 'router_firmware_support', 'manual_config', 'Manual config', 'Manuelle Konfiguration', 'neutral', 50
  UNION ALL SELECT 'vpn', 'bandwidth_limit', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'vpn', 'bandwidth_limit', 'throttled_free', 'Throttled (free)', 'Gedrosselt (kostenlos)', 'tradeoff', 20
  UNION ALL SELECT 'vpn', 'bandwidth_limit', 'capped', 'Capped', 'Begrenzt', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'data_cap', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'vpn', 'data_cap', 'over_10gb', 'Over 10 GB', 'Ueber 10 GB', 'neutral', 20
  UNION ALL SELECT 'vpn', 'data_cap', '1gb_to_10gb', '1–10 GB', '1–10 GB', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'data_cap', 'under_1gb', 'Under 1 GB', 'Unter 1 GB', 'warning', 40
  UNION ALL SELECT 'vpn', 'streaming_unblock_capability', 'reliable', 'Reliable', 'Zuverlaessig', 'positive', 10
  UNION ALL SELECT 'vpn', 'streaming_unblock_capability', 'partial', 'Partial', 'Teilweise', 'neutral', 20
  UNION ALL SELECT 'vpn', 'streaming_unblock_capability', 'limited', 'Limited', 'Eingeschraenkt', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'streaming_unblock_capability', 'none', 'None', 'Keine', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'p2p_torrenting_allowed', 'all_servers', 'All servers', 'Alle Server', 'positive', 10
  UNION ALL SELECT 'vpn', 'p2p_torrenting_allowed', 'dedicated_servers', 'Dedicated servers', 'Dedizierte Server', 'neutral', 20
  UNION ALL SELECT 'vpn', 'p2p_torrenting_allowed', 'restricted', 'Restricted', 'Eingeschraenkt', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'p2p_torrenting_allowed', 'not_allowed', 'Not allowed', 'Nicht erlaubt', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'split_tunneling', 'app_level', 'App level', 'App-Ebene', 'neutral', 10
  UNION ALL SELECT 'vpn', 'split_tunneling', 'url_level', 'URL level', 'URL-Ebene', 'neutral', 20
  UNION ALL SELECT 'vpn', 'split_tunneling', 'both', 'Both', 'Beides', 'positive', 30
  UNION ALL SELECT 'vpn', 'split_tunneling', 'not_available', 'Not available', 'Nicht verfuegbar', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'anonymous_signup', 'no_identity_required', 'No identity required', 'Keine Identitaet erforderlich', 'positive', 10
  UNION ALL SELECT 'vpn', 'anonymous_signup', 'email_only', 'Email only', 'Nur E-Mail', 'neutral', 20
  UNION ALL SELECT 'vpn', 'anonymous_signup', 'email_and_name', 'Email and name', 'E-Mail und Name', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'anonymous_signup', 'full_identity', 'Full identity', 'Vollstaendige Identitaet', 'warning', 40
  UNION ALL SELECT 'vpn', 'client_source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'vpn', 'client_source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'vpn', 'client_source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'client_source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'vpn', 'server_source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'vpn', 'server_source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'vpn', 'server_source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'vpn', 'server_source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'vpn', 'governance_model', 'community_driven', 'Community driven', 'Community-getrieben', 'positive', 10
  UNION ALL SELECT 'vpn', 'governance_model', 'foundation_backed', 'Foundation backed', 'Stiftungsunterstuetzt', 'positive', 20
  UNION ALL SELECT 'vpn', 'governance_model', 'corporate_independent', 'Corporate independent', 'Unabhaengiges Unternehmen', 'neutral', 30
  UNION ALL SELECT 'vpn', 'governance_model', 'corporate_conglomerate', 'Corporate conglomerate', 'Unternehmenskonglomerat', 'tradeoff', 40
  UNION ALL SELECT 'vpn', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'neutral', 10
  UNION ALL SELECT 'vpn', 'fit_profiles', 'streaming', 'Streaming', 'Streaming', 'neutral', 20
  UNION ALL SELECT 'vpn', 'fit_profiles', 'torrenting', 'Torrenting', 'Torrenting', 'neutral', 30
  UNION ALL SELECT 'vpn', 'fit_profiles', 'business', 'Business', 'Geschaeftlich', 'neutral', 40
  UNION ALL SELECT 'vpn', 'fit_profiles', 'travel', 'Travel', 'Reisen', 'neutral', 50
  UNION ALL SELECT 'vpn', 'fit_profiles', 'gaming', 'Gaming', 'Gaming', 'neutral', 60
  UNION ALL SELECT 'vpn', 'fit_profiles', 'censorship_circumvention', 'Censorship circumvention', 'Zensurumgehung', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'vpn'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'vpn'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('019-vpn-matrix-criteria');
