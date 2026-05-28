-- Migration 027: Define Cloud & Hosting category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('hosting', 'service_type_infrastructure', 'Service Type & Infrastructure', 'Servicetyp & Infrastruktur', 'Core hosting model, server types, and infrastructure choices.', 'Grundlegendes Hosting-Modell, Servertypen und Infrastrukturauswahl.', 100),
  ('hosting', 'performance_resources', 'Performance & Resources', 'Leistung & Ressourcen', 'Hardware, bandwidth, and resource guarantees.', 'Hardware, Bandbreite und Ressourcengarantien.', 200),
  ('hosting', 'networking_connectivity', 'Networking & Connectivity', 'Netzwerk & Konnektivität', 'Network features critical for hosting decisions.', 'Netzwerkfunktionen, die für Hosting-Entscheidungen wichtig sind.', 300),
  ('hosting', 'data_location_compliance', 'Data Location & Compliance', 'Datenstandort & Compliance', 'Where data is stored, processed, and under which jurisdiction.', 'Wo Daten gespeichert und verarbeitet werden und unter welcher Gerichtsbarkeit.', 400),
  ('hosting', 'security_access', 'Security & Access', 'Sicherheit & Zugang', 'Account security, server hardening, and access controls.', 'Kontosicherheit, Server-Härtung und Zugangskontrollen.', 500),
  ('hosting', 'developer_experience', 'Developer Experience & Tooling', 'Entwicklererfahrung & Werkzeuge', 'APIs, automation, and developer-facing features.', 'APIs, Automatisierung und entwicklerorientierte Funktionen.', 600),
  ('hosting', 'openness_audit', 'Openness & Audit', 'Offenheit & Audit', 'Source code openness, auditability, and licensing.', 'Quellcode-Offenheit, Prüfbarkeit und Lizenzierung.', 700),
  ('hosting', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model and user profile targeting.', 'Preismodell und Zielgruppen-Eignung.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'hosting' AS category_id, 'service_type_infrastructure' AS group_key, 'hosting_type' AS criterion_key, 'Hosting type' AS label_en, 'Hosting-Typ' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The fundamental hosting model offered by the provider.' AS help_text_en, 'Das grundlegende Hosting-Modell des Anbieters.' AS help_text_de
  UNION ALL SELECT 'hosting', 'service_type_infrastructure', 'server_virtualization', 'Server virtualization', 'Server-Virtualisierung', 'enum', 'informational', 'optional', 1020, 'The virtualization technology used for server isolation.', 'Die verwendete Virtualisierungstechnologie für Server-Isolation.'
  UNION ALL SELECT 'hosting', 'service_type_infrastructure', 'root_access', 'Root/admin access', 'Root-/Admin-Zugang', 'boolean', 'tradeoff', 'optional', 1030, 'Whether full root or administrator access is available.', 'Ob vollständiger Root- oder Administratorzugang verfügbar ist.'
  UNION ALL SELECT 'hosting', 'service_type_infrastructure', 'managed_services', 'Managed services level', 'Verwaltungsgrad', 'enum', 'tradeoff', 'optional', 1040, 'The level of server management provided by the host.', 'Der Grad der Serververwaltung durch den Anbieter.'
  UNION ALL SELECT 'hosting', 'service_type_infrastructure', 'custom_iso_support', 'Custom ISO/OS image support', 'Eigene ISO-/OS-Image-Unterstützung', 'boolean', 'informational', 'optional', 1050, 'Whether users can install arbitrary operating system images.', 'Ob Nutzer eigene Betriebssystem-Images installieren können.'
  UNION ALL SELECT 'hosting', 'service_type_infrastructure', 'resource_scaling_model', 'Resource scaling model', 'Ressourcen-Skalierungsmodell', 'enum', 'tradeoff', 'optional', 1060, 'How server resources can be scaled up or down.', 'Wie Serverressourcen hoch- oder herunterskaliert werden können.'
  UNION ALL SELECT 'hosting', 'performance_resources', 'cpu_type', 'CPU type', 'CPU-Typ', 'enum', 'informational', 'optional', 2010, 'Whether CPU cores are shared, dedicated virtual, or dedicated physical.', 'Ob CPU-Kerne geteilt, dediziert virtuell oder dediziert physisch sind.'
  UNION ALL SELECT 'hosting', 'performance_resources', 'storage_type', 'Storage technology', 'Speichertechnologie', 'enum', 'informational', 'optional', 2020, 'The type of storage technology used for data.', 'Die verwendete Speichertechnologie für Daten.'
  UNION ALL SELECT 'hosting', 'performance_resources', 'bandwidth_model', 'Bandwidth model', 'Bandbreitenmodell', 'enum', 'tradeoff', 'optional', 2030, 'How network bandwidth and data transfer are metered or limited.', 'Wie Netzwerkbandbreite und Datentransfer gemessen oder begrenzt werden.'
  UNION ALL SELECT 'hosting', 'performance_resources', 'uptime_sla', 'Uptime SLA', 'Verfügbarkeits-SLA', 'boolean', 'beneficial', 'optional', 2040, 'Whether a formal uptime service level agreement is offered.', 'Ob eine formelle Verfügbarkeits-Dienstgütevereinbarung angeboten wird.'
  UNION ALL SELECT 'hosting', 'performance_resources', 'ddos_protection', 'DDoS protection', 'DDoS-Schutz', 'boolean', 'beneficial', 'optional', 2050, 'Whether built-in DDoS mitigation is included.', 'Ob integrierter DDoS-Schutz enthalten ist.'
  UNION ALL SELECT 'hosting', 'networking_connectivity', 'ipv6_support', 'IPv6 support', 'IPv6-Unterstützung', 'boolean', 'beneficial', 'optional', 3010, 'Whether IPv6 connectivity is supported.', 'Ob IPv6-Konnektivität unterstützt wird.'
  UNION ALL SELECT 'hosting', 'networking_connectivity', 'dedicated_ip', 'Dedicated IPv4 address', 'Dedizierte IPv4-Adresse', 'boolean', 'informational', 'optional', 3020, 'Whether a dedicated IPv4 address is included.', 'Ob eine dedizierte IPv4-Adresse enthalten ist.'
  UNION ALL SELECT 'hosting', 'networking_connectivity', 'private_networking', 'Private networking', 'Privates Netzwerk', 'boolean', 'beneficial', 'optional', 3030, 'Whether private VLAN or VPC networking between instances is available.', 'Ob privates VLAN- oder VPC-Netzwerk zwischen Instanzen verfügbar ist.'
  UNION ALL SELECT 'hosting', 'networking_connectivity', 'load_balancing', 'Load balancing available', 'Lastverteilung verfügbar', 'boolean', 'informational', 'optional', 3040, 'Whether a managed load balancer option is available.', 'Ob eine verwaltete Lastverteilungsoption verfügbar ist.'
  UNION ALL SELECT 'hosting', 'networking_connectivity', 'dns_management', 'DNS management included', 'DNS-Verwaltung enthalten', 'boolean', 'informational', 'optional', 3050, 'Whether built-in DNS hosting and management is included.', 'Ob integriertes DNS-Hosting und -Verwaltung enthalten ist.'
  UNION ALL SELECT 'hosting', 'data_location_compliance', 'datacenter_locations', 'Data center locations', 'Rechenzentrum-Standorte', 'multi_enum', 'informational', 'multi_select', 4010, 'Which geographic regions have data centers available.', 'In welchen geografischen Regionen Rechenzentren verfügbar sind.'
  UNION ALL SELECT 'hosting', 'data_location_compliance', 'eu_datacenter_available', 'EU data center available', 'EU-Rechenzentrum verfügbar', 'boolean', 'beneficial', 'must_match', 4020, 'Whether at least one data center is located within the EU.', 'Ob mindestens ein Rechenzentrum innerhalb der EU liegt.'
  UNION ALL SELECT 'hosting', 'data_location_compliance', 'data_processing_agreement', 'Data processing agreement available', 'Auftragsverarbeitungsvertrag verfügbar', 'boolean', 'informational', 'optional', 4030, 'Whether a GDPR-compliant data processing agreement is available.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag verfügbar ist.'
  UNION ALL SELECT 'hosting', 'data_location_compliance', 'compliance_certifications', 'Compliance certifications', 'Compliance-Zertifizierungen', 'multi_enum', 'informational', 'multi_select', 4040, 'Which compliance certifications the provider holds.', 'Welche Compliance-Zertifizierungen der Anbieter besitzt.'
  UNION ALL SELECT 'hosting', 'data_location_compliance', 'infrastructure_provider', 'Infrastructure provider model', 'Infrastruktur-Anbietermodell', 'enum', 'informational', 'optional', 4050, 'Whether the provider operates own hardware or resells third-party infrastructure.', 'Ob der Anbieter eigene Hardware betreibt oder Drittanbieter-Infrastruktur weiterverkauft.'
  UNION ALL SELECT 'hosting', 'security_access', 'two_factor_auth', 'Two-factor authentication', 'Zwei-Faktor-Authentifizierung', 'boolean', 'beneficial', 'optional', 5010, 'Whether two-factor authentication is available for account access.', 'Ob Zwei-Faktor-Authentifizierung für den Kontozugang verfügbar ist.'
  UNION ALL SELECT 'hosting', 'security_access', 'ssh_key_auth', 'SSH key authentication', 'SSH-Schlüssel-Authentifizierung', 'boolean', 'beneficial', 'optional', 5020, 'Whether SSH key-based authentication is supported for server access.', 'Ob SSH-schlüsselbasierte Authentifizierung für den Serverzugang unterstützt wird.'
  UNION ALL SELECT 'hosting', 'security_access', 'firewall_management', 'Firewall management', 'Firewall-Verwaltung', 'enum', 'informational', 'optional', 5030, 'The level of firewall management available.', 'Der verfügbare Grad der Firewall-Verwaltung.'
  UNION ALL SELECT 'hosting', 'security_access', 'backup_service', 'Backup service available', 'Backup-Dienst verfügbar', 'boolean', 'beneficial', 'optional', 5040, 'Whether provider-managed backup services are available.', 'Ob vom Anbieter verwaltete Backup-Dienste verfügbar sind.'
  UNION ALL SELECT 'hosting', 'security_access', 'snapshot_support', 'Snapshot/image support', 'Snapshot-/Image-Unterstützung', 'boolean', 'beneficial', 'optional', 5050, 'Whether VM snapshots or server images can be created for recovery.', 'Ob VM-Snapshots oder Server-Images zur Wiederherstellung erstellt werden können.'
  UNION ALL SELECT 'hosting', 'developer_experience', 'api_available', 'API available', 'API verfügbar', 'boolean', 'beneficial', 'optional', 6010, 'Whether a programmatic API for server management is available.', 'Ob eine programmatische API zur Serververwaltung verfügbar ist.'
  UNION ALL SELECT 'hosting', 'developer_experience', 'infrastructure_as_code', 'Infrastructure as Code support', 'Infrastructure-as-Code-Unterstützung', 'boolean', 'informational', 'optional', 6020, 'Whether Infrastructure as Code tools like Terraform or Ansible are supported.', 'Ob Infrastructure-as-Code-Werkzeuge wie Terraform oder Ansible unterstützt werden.'
  UNION ALL SELECT 'hosting', 'developer_experience', 'container_support', 'Container hosting support', 'Container-Hosting-Unterstützung', 'multi_enum', 'informational', 'multi_select', 6030, 'Which container technologies are supported for hosting workloads.', 'Welche Container-Technologien für Hosting-Workloads unterstützt werden.'
  UNION ALL SELECT 'hosting', 'developer_experience', 'one_click_apps', 'One-click app installation', 'Ein-Klick-App-Installation', 'boolean', 'informational', 'optional', 6040, 'Whether pre-configured application images are available for quick deployment.', 'Ob vorkonfigurierte Anwendungs-Images für schnelle Bereitstellung verfügbar sind.'
  UNION ALL SELECT 'hosting', 'developer_experience', 'supported_os', 'Supported operating systems', 'Unterstützte Betriebssysteme', 'multi_enum', 'informational', 'multi_select', 6050, 'Which operating system distributions are available for installation.', 'Welche Betriebssystem-Distributionen zur Installation verfügbar sind.'
  UNION ALL SELECT 'hosting', 'openness_audit', 'control_panel_source', 'Control panel source model', 'Control-Panel-Quellmodell', 'enum', 'tradeoff', 'optional', 7010, 'Whether the hosting control panel is open source, source available, or proprietary.', 'Ob das Hosting-Control-Panel quelloffen, quelleinsehbar oder proprietär ist.'
  UNION ALL SELECT 'hosting', 'openness_audit', 'security_audit', 'Independent security audit', 'Unabhängiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 7020, 'Whether an independent security audit has been completed.', 'Ob ein unabhängiges Sicherheitsaudit durchgeführt wurde.'
  UNION ALL SELECT 'hosting', 'openness_audit', 'transparency_report', 'Transparency report published', 'Transparenzbericht veröffentlicht', 'boolean', 'informational', 'optional', 7030, 'Whether a transparency report on government and law enforcement requests is published.', 'Ob ein Transparenzbericht über Behörden- und Strafverfolgungsanfragen veröffentlicht wird.'
  UNION ALL SELECT 'hosting', 'openness_audit', 'community_contributions', 'Community contributions accepted', 'Community-Beiträge akzeptiert', 'boolean', 'informational', 'optional', 7040, 'Whether the provider accepts community contributions or open-source engagement.', 'Ob der Anbieter Community-Beiträge oder Open-Source-Engagement akzeptiert.'
  UNION ALL SELECT 'hosting', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'The billing model used by the provider.', 'Das vom Anbieter verwendete Abrechnungsmodell.'
  UNION ALL SELECT 'hosting', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 8020, 'Whether a free plan or trial is available.', 'Ob ein kostenloser Tarif oder eine Testphase verfügbar ist.'
  UNION ALL SELECT 'hosting', 'pricing_fit', 'billing_currency', 'Billing in EUR available', 'Abrechnung in EUR verfügbar', 'boolean', 'informational', 'optional', 8030, 'Whether billing in euros is available.', 'Ob eine Abrechnung in Euro verfügbar ist.'
  UNION ALL SELECT 'hosting', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'Common user profiles the hosting service is well suited for.', 'Typische Nutzerprofile, für die der Hosting-Dienst gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'hosting' AS category_id, 'hosting_type' AS criterion_key, 'shared' AS option_key, 'Shared hosting' AS label_en, 'Shared Hosting' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'hosting', 'hosting_type', 'vps', 'VPS', 'VPS', 'neutral', 20
  UNION ALL SELECT 'hosting', 'hosting_type', 'dedicated', 'Dedicated server', 'Dedizierter Server', 'neutral', 30
  UNION ALL SELECT 'hosting', 'hosting_type', 'cloud_instances', 'Cloud instances', 'Cloud-Instanzen', 'neutral', 40
  UNION ALL SELECT 'hosting', 'hosting_type', 'managed_hosting', 'Managed hosting', 'Managed Hosting', 'neutral', 50
  UNION ALL SELECT 'hosting', 'server_virtualization', 'kvm', 'KVM', 'KVM', 'positive', 10
  UNION ALL SELECT 'hosting', 'server_virtualization', 'openvz_lxc', 'OpenVZ/LXC', 'OpenVZ/LXC', 'neutral', 20
  UNION ALL SELECT 'hosting', 'server_virtualization', 'vmware', 'VMware', 'VMware', 'neutral', 30
  UNION ALL SELECT 'hosting', 'server_virtualization', 'bare_metal', 'Bare metal', 'Bare Metal', 'neutral', 40
  UNION ALL SELECT 'hosting', 'server_virtualization', 'container_based', 'Container-based', 'Container-basiert', 'neutral', 50
  UNION ALL SELECT 'hosting', 'managed_services', 'unmanaged', 'Unmanaged', 'Unverwaltet', 'neutral', 10
  UNION ALL SELECT 'hosting', 'managed_services', 'semi_managed', 'Semi-managed', 'Teilverwaltet', 'neutral', 20
  UNION ALL SELECT 'hosting', 'managed_services', 'fully_managed', 'Fully managed', 'Vollverwaltet', 'neutral', 30
  UNION ALL SELECT 'hosting', 'resource_scaling_model', 'fixed_resources', 'Fixed resources', 'Feste Ressourcen', 'neutral', 10
  UNION ALL SELECT 'hosting', 'resource_scaling_model', 'manual_upgrade', 'Manual upgrade', 'Manuelles Upgrade', 'neutral', 20
  UNION ALL SELECT 'hosting', 'resource_scaling_model', 'auto_scaling', 'Auto-scaling', 'Auto-Skalierung', 'neutral', 30
  UNION ALL SELECT 'hosting', 'resource_scaling_model', 'burstable', 'Burstable', 'Burstable', 'tradeoff', 40
  UNION ALL SELECT 'hosting', 'cpu_type', 'shared_vcpu', 'Shared vCPU', 'Geteilte vCPU', 'neutral', 10
  UNION ALL SELECT 'hosting', 'cpu_type', 'dedicated_vcpu', 'Dedicated vCPU', 'Dedizierte vCPU', 'neutral', 20
  UNION ALL SELECT 'hosting', 'cpu_type', 'dedicated_physical', 'Dedicated physical', 'Dediziert physisch', 'neutral', 30
  UNION ALL SELECT 'hosting', 'storage_type', 'hdd', 'HDD', 'HDD', 'neutral', 10
  UNION ALL SELECT 'hosting', 'storage_type', 'ssd', 'SSD', 'SSD', 'neutral', 20
  UNION ALL SELECT 'hosting', 'storage_type', 'nvme', 'NVMe', 'NVMe', 'neutral', 30
  UNION ALL SELECT 'hosting', 'storage_type', 'mixed', 'Mixed', 'Gemischt', 'neutral', 40
  UNION ALL SELECT 'hosting', 'bandwidth_model', 'unmetered', 'Unmetered', 'Unlimitiert', 'positive', 10
  UNION ALL SELECT 'hosting', 'bandwidth_model', 'fair_use', 'Fair-use policy', 'Fair-Use-Richtlinie', 'tradeoff', 20
  UNION ALL SELECT 'hosting', 'bandwidth_model', 'fixed_quota', 'Fixed transfer quota', 'Festes Transferkontingent', 'neutral', 30
  UNION ALL SELECT 'hosting', 'bandwidth_model', 'pay_per_use', 'Pay per use', 'Nutzungsbasiert', 'neutral', 40
  UNION ALL SELECT 'hosting', 'bandwidth_model', 'throttled_after_limit', 'Throttled after limit', 'Gedrosselt nach Limit', 'warning', 50
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'germany', 'Germany', 'Deutschland', 'positive', 10
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'netherlands', 'Netherlands', 'Niederlande', 'positive', 20
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'france', 'France', 'Frankreich', 'positive', 30
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'finland', 'Finland', 'Finnland', 'positive', 40
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'other_eu', 'Other EU', 'Andere EU', 'neutral', 50
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'switzerland', 'Switzerland', 'Schweiz', 'neutral', 60
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'uk', 'United Kingdom', 'Vereinigtes Königreich', 'neutral', 70
  UNION ALL SELECT 'hosting', 'datacenter_locations', 'non_european', 'Non-European', 'Außereuropäisch', 'tradeoff', 80
  UNION ALL SELECT 'hosting', 'compliance_certifications', 'iso_27001', 'ISO 27001', 'ISO 27001', 'positive', 10
  UNION ALL SELECT 'hosting', 'compliance_certifications', 'soc2', 'SOC 2', 'SOC 2', 'neutral', 20
  UNION ALL SELECT 'hosting', 'compliance_certifications', 'bsi_c5', 'BSI C5', 'BSI C5', 'positive', 30
  UNION ALL SELECT 'hosting', 'compliance_certifications', 'gdpr_dpa', 'GDPR DPA', 'DSGVO-AVV', 'positive', 40
  UNION ALL SELECT 'hosting', 'compliance_certifications', 'pci_dss', 'PCI DSS', 'PCI DSS', 'neutral', 50
  UNION ALL SELECT 'hosting', 'compliance_certifications', 'hipaa', 'HIPAA', 'HIPAA', 'neutral', 60
  UNION ALL SELECT 'hosting', 'infrastructure_provider', 'own_hardware', 'Own data centers', 'Eigene Rechenzentren', 'positive', 10
  UNION ALL SELECT 'hosting', 'infrastructure_provider', 'eu_cloud_provider', 'EU cloud provider', 'EU-Cloud-Anbieter', 'positive', 20
  UNION ALL SELECT 'hosting', 'infrastructure_provider', 'hyperscaler', 'Hyperscaler infrastructure', 'Hyperscaler-Infrastruktur', 'tradeoff', 30
  UNION ALL SELECT 'hosting', 'infrastructure_provider', 'reseller', 'Reseller', 'Reseller', 'warning', 40
  UNION ALL SELECT 'hosting', 'infrastructure_provider', 'mixed_infra', 'Mixed infrastructure', 'Gemischte Infrastruktur', 'neutral', 50
  UNION ALL SELECT 'hosting', 'firewall_management', 'none_available', 'Not available', 'Nicht verfügbar', 'warning', 10
  UNION ALL SELECT 'hosting', 'firewall_management', 'basic', 'Basic', 'Einfach', 'neutral', 20
  UNION ALL SELECT 'hosting', 'firewall_management', 'advanced_configurable', 'Advanced configurable', 'Erweitert konfigurierbar', 'positive', 30
  UNION ALL SELECT 'hosting', 'container_support', 'docker', 'Docker', 'Docker', 'neutral', 10
  UNION ALL SELECT 'hosting', 'container_support', 'kubernetes_managed', 'Managed Kubernetes', 'Verwaltetes Kubernetes', 'neutral', 20
  UNION ALL SELECT 'hosting', 'container_support', 'kubernetes_self', 'Self-managed Kubernetes', 'Selbstverwaltetes Kubernetes', 'neutral', 30
  UNION ALL SELECT 'hosting', 'container_support', 'container_runtime', 'Container runtime', 'Container-Laufzeitumgebung', 'neutral', 40
  UNION ALL SELECT 'hosting', 'container_support', 'none_available', 'Not available', 'Nicht verfügbar', 'neutral', 50
  UNION ALL SELECT 'hosting', 'supported_os', 'debian', 'Debian', 'Debian', 'neutral', 10
  UNION ALL SELECT 'hosting', 'supported_os', 'ubuntu', 'Ubuntu', 'Ubuntu', 'neutral', 20
  UNION ALL SELECT 'hosting', 'supported_os', 'centos_rocky', 'CentOS/Rocky', 'CentOS/Rocky', 'neutral', 30
  UNION ALL SELECT 'hosting', 'supported_os', 'alma_linux', 'AlmaLinux', 'AlmaLinux', 'neutral', 40
  UNION ALL SELECT 'hosting', 'supported_os', 'fedora', 'Fedora', 'Fedora', 'neutral', 50
  UNION ALL SELECT 'hosting', 'supported_os', 'windows_server', 'Windows Server', 'Windows Server', 'neutral', 60
  UNION ALL SELECT 'hosting', 'supported_os', 'freebsd', 'FreeBSD', 'FreeBSD', 'neutral', 70
  UNION ALL SELECT 'hosting', 'supported_os', 'custom_iso', 'Custom ISO', 'Eigene ISO', 'neutral', 80
  UNION ALL SELECT 'hosting', 'control_panel_source', 'open_source_panel', 'Open source (e.g., Hestia, ISPConfig)', 'Quelloffen (z.B. Hestia, ISPConfig)', 'positive', 10
  UNION ALL SELECT 'hosting', 'control_panel_source', 'source_available_panel', 'Source available', 'Quelleinsehbar', 'neutral', 20
  UNION ALL SELECT 'hosting', 'control_panel_source', 'proprietary_panel', 'Proprietary (e.g., cPanel, Plesk)', 'Proprietär (z.B. cPanel, Plesk)', 'warning', 30
  UNION ALL SELECT 'hosting', 'control_panel_source', 'api_cli_only', 'API/CLI only', 'Nur API/CLI', 'neutral', 40
  UNION ALL SELECT 'hosting', 'control_panel_source', 'no_panel', 'No panel', 'Kein Panel', 'neutral', 50
  UNION ALL SELECT 'hosting', 'pricing_model', 'monthly', 'Monthly', 'Monatlich', 'neutral', 10
  UNION ALL SELECT 'hosting', 'pricing_model', 'hourly', 'Hourly/pay-as-you-go', 'Stündlich/nutzungsbasiert', 'neutral', 20
  UNION ALL SELECT 'hosting', 'pricing_model', 'yearly', 'Yearly', 'Jährlich', 'neutral', 30
  UNION ALL SELECT 'hosting', 'pricing_model', 'custom_contract', 'Custom contract', 'Individueller Vertrag', 'neutral', 40
  UNION ALL SELECT 'hosting', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 10
  UNION ALL SELECT 'hosting', 'fit_profiles', 'small_business', 'Small business', 'Kleinunternehmen', 'neutral', 20
  UNION ALL SELECT 'hosting', 'fit_profiles', 'enterprise', 'Enterprise', 'Großunternehmen', 'neutral', 30
  UNION ALL SELECT 'hosting', 'fit_profiles', 'agency', 'Agency', 'Agentur', 'neutral', 40
  UNION ALL SELECT 'hosting', 'fit_profiles', 'hobbyist', 'Hobbyist', 'Hobbyist', 'neutral', 50
  UNION ALL SELECT 'hosting', 'fit_profiles', 'e_commerce', 'E-commerce', 'E-Commerce', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'hosting'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'hosting'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('027-hosting-matrix-criteria');
