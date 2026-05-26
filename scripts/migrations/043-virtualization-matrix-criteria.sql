-- Migration 043: Define Virtualization category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('virtualization', 'hypervisor_architecture', 'Hypervisor & Architecture', 'Hypervisor & Architektur', 'Hypervisor type, virtualization technology, and supported CPU architectures.', 'Hypervisor-Typ, Virtualisierungstechnologie und unterstuetzte CPU-Architekturen.', 100),
  ('virtualization', 'guest_workload_support', 'Guest OS & Workload Support', 'Gast-Betriebssysteme & Workload-Unterstuetzung', 'Supported guest operating systems, container integration, VM templates, and nested virtualization.', 'Unterstuetzte Gast-Betriebssysteme, Container-Integration, VM-Vorlagen und verschachtelte Virtualisierung.', 200),
  ('virtualization', 'performance_hardware', 'Performance & Hardware Features', 'Leistung & Hardware-Funktionen', 'GPU passthrough, hardware acceleration, live migration, overcommitment, and vCPU limits.', 'GPU-Passthrough, Hardwarebeschleunigung, Live-Migration, Ueberzeichnung und vCPU-Limits.', 300),
  ('virtualization', 'management_administration', 'Management & Administration', 'Verwaltung & Administration', 'Management interfaces, cluster support, high availability, API access, and backup integration.', 'Verwaltungsoberflaechen, Clusterunterstuetzung, Hochverfuegbarkeit, API-Zugang und Backup-Integration.', 400),
  ('virtualization', 'networking_connectivity', 'Networking & Connectivity', 'Netzwerk & Konnektivitaet', 'Virtual networking modes, VLAN tagging, and software-defined networking capabilities.', 'Virtuelle Netzwerkmodi, VLAN-Tagging und Software-definierte Netzwerkfaehigkeiten.', 500),
  ('virtualization', 'storage_snapshots', 'Storage & Snapshots', 'Speicher & Snapshots', 'Storage backends, snapshot capabilities, disk formats, thin provisioning, and live resize.', 'Speicher-Backends, Snapshot-Faehigkeiten, Festplattenformate, Thin Provisioning und Live-Resize.', 600),
  ('virtualization', 'privacy_data_control', 'Privacy & Data Control', 'Privatsphaere & Datenkontrolle', 'Telemetry collection, data processing location, and data export capabilities.', 'Telemetrie-Erfassung, Datenverarbeitungsstandort und Datenexport-Moeglichkeiten.', 700),
  ('virtualization', 'openness_deployment', 'Openness & Deployment', 'Offenheit & Bereitstellung', 'Source code availability, licensing, self-hosting capability, and deployment models.', 'Quellcode-Verfuegbarkeit, Lizenzierung, Selbsthosting-Faehigkeit und Bereitstellungsmodelle.', 800),
  ('virtualization', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing structure, free tier availability, and target use case profiles.', 'Preisstruktur, Verfuegbarkeit kostenloser Versionen und Zielgruppen-Einsatzprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'virtualization' AS category_id, 'hypervisor_architecture' AS group_key, 'hypervisor_type' AS criterion_key, 'Hypervisor type' AS label_en, 'Hypervisor-Typ' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Whether the platform runs directly on hardware (Type 1), on top of a host OS (Type 2), uses container isolation, or a hybrid approach.' AS help_text_en, 'Ob die Plattform direkt auf Hardware (Typ 1), auf einem Host-Betriebssystem (Typ 2) laeuft, Container-Isolation nutzt oder einen hybriden Ansatz verfolgt.' AS help_text_de
  UNION ALL SELECT 'virtualization', 'hypervisor_architecture', 'virtualization_technology', 'Virtualization technology', 'Virtualisierungstechnologie', 'enum', 'informational', 'optional', 1020, 'The underlying virtualization method such as full virtualization, paravirtualization, or OS-level containerization.', 'Die zugrunde liegende Virtualisierungsmethode wie Vollvirtualisierung, Paravirtualisierung oder Containerisierung auf Betriebssystemebene.'
  UNION ALL SELECT 'virtualization', 'hypervisor_architecture', 'cpu_architecture_support', 'CPU architecture support', 'CPU-Architektur-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 1030, 'Which CPU instruction set architectures the hypervisor supports for running virtual machines.', 'Welche CPU-Befehlssatzarchitekturen der Hypervisor fuer den Betrieb virtueller Maschinen unterstuetzt.'
  UNION ALL SELECT 'virtualization', 'guest_workload_support', 'guest_os_support', 'Guest OS support', 'Gastbetriebssystem-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 2010, 'Which operating system families can run as guest virtual machines on this hypervisor.', 'Welche Betriebssystemfamilien als virtuelle Gastmaschinen auf diesem Hypervisor ausgefuehrt werden koennen.'
  UNION ALL SELECT 'virtualization', 'guest_workload_support', 'container_support', 'Container support', 'Container-Unterstuetzung', 'boolean', 'informational', 'optional', 2020, 'Whether the platform supports running container workloads alongside or instead of full virtual machines.', 'Ob die Plattform Container-Workloads neben oder anstelle vollstaendiger virtueller Maschinen unterstuetzt.'
  UNION ALL SELECT 'virtualization', 'guest_workload_support', 'vm_template_library', 'VM template library', 'VM-Vorlagenbibliothek', 'boolean', 'beneficial', 'optional', 2030, 'Whether pre-built virtual machine templates are available for quick deployment of common operating systems.', 'Ob vorgefertigte VM-Vorlagen fuer die schnelle Bereitstellung gaengiger Betriebssysteme verfuegbar sind.'
  UNION ALL SELECT 'virtualization', 'guest_workload_support', 'nested_virtualization', 'Nested virtualization', 'Verschachtelte Virtualisierung', 'boolean', 'informational', 'optional', 2040, 'Whether running a hypervisor inside a virtual machine is supported for development and testing purposes.', 'Ob das Ausfuehren eines Hypervisors innerhalb einer virtuellen Maschine fuer Entwicklungs- und Testzwecke unterstuetzt wird.'
  UNION ALL SELECT 'virtualization', 'performance_hardware', 'gpu_passthrough', 'GPU passthrough', 'GPU-Durchreichung', 'boolean', 'beneficial', 'optional', 3010, 'Whether physical GPU devices can be passed through directly to a virtual machine for hardware-accelerated graphics.', 'Ob physische GPU-Geraete direkt an eine virtuelle Maschine fuer hardwarebeschleunigte Grafik durchgereicht werden koennen.'
  UNION ALL SELECT 'virtualization', 'performance_hardware', 'hardware_acceleration', 'Hardware acceleration', 'Hardwarebeschleunigung', 'enum', 'informational', 'optional', 3020, 'The hardware-assisted virtualization extensions used by the hypervisor for improved performance.', 'Die hardwaregestuetzten Virtualisierungserweiterungen, die der Hypervisor fuer verbesserte Leistung nutzt.'
  UNION ALL SELECT 'virtualization', 'performance_hardware', 'live_migration', 'Live migration', 'Live-Migration', 'boolean', 'beneficial', 'optional', 3030, 'Whether running virtual machines can be moved between physical hosts without downtime.', 'Ob laufende virtuelle Maschinen ohne Ausfallzeit zwischen physischen Hosts verschoben werden koennen.'
  UNION ALL SELECT 'virtualization', 'performance_hardware', 'resource_overcommit', 'Resource overcommitment', 'Ressourcenueberzeichnung', 'boolean', 'informational', 'optional', 3040, 'Whether more virtual CPU or memory resources can be allocated than physically available on the host.', 'Ob mehr virtuelle CPU- oder Speicherressourcen zugewiesen werden koennen als physisch auf dem Host verfuegbar sind.'
  UNION ALL SELECT 'virtualization', 'performance_hardware', 'max_vcpu_per_vm', 'Max vCPUs per VM', 'Maximale vCPUs pro VM', 'enum', 'informational', 'optional', 3050, 'The maximum number of virtual CPU cores that can be assigned to a single virtual machine.', 'Die maximale Anzahl virtueller CPU-Kerne, die einer einzelnen virtuellen Maschine zugewiesen werden koennen.'
  UNION ALL SELECT 'virtualization', 'management_administration', 'management_interface', 'Management interface', 'Verwaltungsoberflaeche', 'multi_enum', 'informational', 'multi_select', 4010, 'The interfaces available for managing the hypervisor and its virtual machines.', 'Die verfuegbaren Oberflaechen zur Verwaltung des Hypervisors und seiner virtuellen Maschinen.'
  UNION ALL SELECT 'virtualization', 'management_administration', 'cluster_management', 'Cluster management', 'Clusterverwaltung', 'boolean', 'beneficial', 'optional', 4020, 'Whether multiple physical hosts can be managed as a unified cluster from a single interface.', 'Ob mehrere physische Hosts als einheitlicher Cluster ueber eine einzige Oberflaeche verwaltet werden koennen.'
  UNION ALL SELECT 'virtualization', 'management_administration', 'high_availability', 'High availability', 'Hochverfuegbarkeit', 'boolean', 'beneficial', 'optional', 4030, 'Whether the platform provides automatic failover and restart of virtual machines when a host fails.', 'Ob die Plattform automatisches Failover und Neustart virtueller Maschinen bei Hostausfall bereitstellt.'
  UNION ALL SELECT 'virtualization', 'management_administration', 'api_available', 'API available', 'API verfuegbar', 'boolean', 'beneficial', 'optional', 4040, 'Whether a programmable API is available for automating virtual machine and infrastructure management.', 'Ob eine programmierbare API fuer die Automatisierung der Verwaltung virtueller Maschinen und Infrastruktur verfuegbar ist.'
  UNION ALL SELECT 'virtualization', 'management_administration', 'backup_integration', 'Backup integration', 'Backup-Integration', 'boolean', 'beneficial', 'optional', 4050, 'Whether the platform offers built-in backup tools or integration with third-party backup solutions.', 'Ob die Plattform integrierte Backup-Werkzeuge oder Integration mit Backup-Loesungen von Drittanbietern bietet.'
  UNION ALL SELECT 'virtualization', 'networking_connectivity', 'virtual_networking', 'Virtual networking modes', 'Virtuelle Netzwerkmodi', 'multi_enum', 'informational', 'multi_select', 5010, 'The virtual network connection modes available for guest virtual machines.', 'Die verfuegbaren virtuellen Netzwerkverbindungsmodi fuer virtuelle Gastmaschinen.'
  UNION ALL SELECT 'virtualization', 'networking_connectivity', 'vlan_support', 'VLAN support', 'VLAN-Unterstuetzung', 'boolean', 'informational', 'optional', 5020, 'Whether the platform supports IEEE 802.1Q VLAN tagging for network traffic segmentation.', 'Ob die Plattform IEEE 802.1Q VLAN-Tagging zur Segmentierung des Netzwerkverkehrs unterstuetzt.'
  UNION ALL SELECT 'virtualization', 'networking_connectivity', 'sdn_support', 'Software-defined networking', 'Software-definiertes Netzwerk', 'boolean', 'informational', 'optional', 5030, 'Whether the platform integrates with software-defined networking controllers for advanced network management.', 'Ob die Plattform mit Software-definierten Netzwerk-Controllern fuer erweitertes Netzwerkmanagement integriert ist.'
  UNION ALL SELECT 'virtualization', 'storage_snapshots', 'storage_backends', 'Storage backends', 'Speicher-Backends', 'multi_enum', 'informational', 'multi_select', 6010, 'The storage technologies and protocols supported for storing virtual machine disk images.', 'Die Speichertechnologien und Protokolle, die fuer die Speicherung von VM-Festplattenabbildern unterstuetzt werden.'
  UNION ALL SELECT 'virtualization', 'storage_snapshots', 'snapshot_support', 'Snapshot support', 'Snapshot-Unterstuetzung', 'boolean', 'beneficial', 'optional', 6020, 'Whether point-in-time snapshots of virtual machine state and disk can be created and restored.', 'Ob zeitpunktbezogene Snapshots des VM-Zustands und der Festplatte erstellt und wiederhergestellt werden koennen.'
  UNION ALL SELECT 'virtualization', 'storage_snapshots', 'disk_format_support', 'Disk format support', 'Festplattenformat-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 6030, 'The virtual disk image formats that can be used or imported by the hypervisor.', 'Die virtuellen Festplattenabbildformate, die vom Hypervisor verwendet oder importiert werden koennen.'
  UNION ALL SELECT 'virtualization', 'storage_snapshots', 'thin_provisioning', 'Thin provisioning', 'Thin Provisioning', 'boolean', 'informational', 'optional', 6040, 'Whether disk space is allocated on demand rather than reserved upfront for virtual machine storage.', 'Ob Speicherplatz bei Bedarf zugewiesen wird, anstatt im Voraus fuer den VM-Speicher reserviert zu werden.'
  UNION ALL SELECT 'virtualization', 'storage_snapshots', 'storage_live_resize', 'Storage live resize', 'Speicher-Live-Groessenaenderung', 'boolean', 'informational', 'optional', 6050, 'Whether virtual disk volumes can be expanded while the virtual machine is still running.', 'Ob virtuelle Festplattenvolumes erweitert werden koennen, waehrend die virtuelle Maschine noch laeuft.'
  UNION ALL SELECT 'virtualization', 'privacy_data_control', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 7010, 'How the virtualization platform collects and transmits usage data and analytics.', 'Wie die Virtualisierungsplattform Nutzungsdaten und Analysen erfasst und uebertraegt.'
  UNION ALL SELECT 'virtualization', 'privacy_data_control', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 7020, 'The geographic region where management data and telemetry are processed by the vendor.', 'Die geografische Region, in der Verwaltungsdaten und Telemetrie vom Anbieter verarbeitet werden.'
  UNION ALL SELECT 'virtualization', 'privacy_data_control', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 7030, 'Whether VM configurations and metadata can be exported in a portable format for migration.', 'Ob VM-Konfigurationen und Metadaten in einem portablen Format fuer die Migration exportiert werden koennen.'
  UNION ALL SELECT 'virtualization', 'openness_deployment', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The availability and openness of the virtualization platform source code.', 'Die Verfuegbarkeit und Offenheit des Quellcodes der Virtualisierungsplattform.'
  UNION ALL SELECT 'virtualization', 'openness_deployment', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 8020, 'The software license under which the virtualization platform is distributed.', 'Die Softwarelizenz, unter der die Virtualisierungsplattform vertrieben wird.'
  UNION ALL SELECT 'virtualization', 'openness_deployment', 'self_hosting_option', 'Self-hosting option', 'Selbsthosting-Option', 'boolean', 'beneficial', 'must_match', 8030, 'Whether the virtualization platform can be installed and operated on user-owned hardware.', 'Ob die Virtualisierungsplattform auf eigener Hardware installiert und betrieben werden kann.'
  UNION ALL SELECT 'virtualization', 'openness_deployment', 'hosting_model', 'Hosting model', 'Hosting-Modell', 'enum', 'tradeoff', 'must_match', 8040, 'Whether the platform is available as a cloud service, for self-hosting, as a local application, or a combination.', 'Ob die Plattform als Cloud-Dienst, zum Selbst-Hosting, als lokale Anwendung oder als Kombination verfuegbar ist.'
  UNION ALL SELECT 'virtualization', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'The pricing structure for obtaining and using the virtualization platform.', 'Die Preisstruktur fuer den Erwerb und die Nutzung der Virtualisierungsplattform.'
  UNION ALL SELECT 'virtualization', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfuegbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a functional free version of the platform is available without payment or time limits.', 'Ob eine funktionsfaehige kostenlose Version der Plattform ohne Bezahlung oder Zeitlimits verfuegbar ist.'
  UNION ALL SELECT 'virtualization', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9030, 'Target use case profiles the platform is best suited for based on features and scale.', 'Zielgruppen-Einsatzprofile, fuer die die Plattform basierend auf Funktionen und Skalierung am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'virtualization' AS category_id, 'hypervisor_type' AS criterion_key, 'type_1_bare_metal' AS option_key, 'Type 1 (bare-metal)' AS label_en, 'Typ 1 (Bare-Metal)' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'virtualization', 'hypervisor_type', 'type_2_hosted', 'Type 2 (hosted)', 'Typ 2 (gehostet)', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'hypervisor_type', 'container_engine', 'Container engine', 'Container-Engine', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'hypervisor_type', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'virtualization_technology', 'full_virtualization', 'Full virtualization', 'Vollvirtualisierung', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'virtualization_technology', 'paravirtualization', 'Paravirtualization', 'Paravirtualisierung', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'virtualization_technology', 'os_level_containerization', 'OS-level containerization', 'Containerisierung auf Betriebssystemebene', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'virtualization_technology', 'hardware_assisted', 'Hardware-assisted', 'Hardwaregestuetzt', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'virtualization_technology', 'emulation', 'Emulation', 'Emulation', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'cpu_architecture_support', 'x86_64', 'x86_64', 'x86_64', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'cpu_architecture_support', 'arm64', 'ARM64 (AArch64)', 'ARM64 (AArch64)', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'cpu_architecture_support', 'arm32', 'ARM32', 'ARM32', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'cpu_architecture_support', 'risc_v', 'RISC-V', 'RISC-V', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'cpu_architecture_support', 'power', 'IBM POWER', 'IBM POWER', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'cpu_architecture_support', 's390x', 'IBM s390x', 'IBM s390x', 'neutral', 60
  UNION ALL SELECT 'virtualization', 'guest_os_support', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'guest_os_support', 'linux', 'Linux', 'Linux', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'guest_os_support', 'macos', 'macOS', 'macOS', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'guest_os_support', 'bsd_family', 'BSD family', 'BSD-Familie', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'guest_os_support', 'other_unix', 'Other Unix', 'Sonstiges Unix', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'guest_os_support', 'android', 'Android', 'Android', 'neutral', 60
  UNION ALL SELECT 'virtualization', 'hardware_acceleration', 'vt_x_amd_v', 'Intel VT-x / AMD-V', 'Intel VT-x / AMD-V', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'hardware_acceleration', 'arm_vhe', 'ARM VHE', 'ARM VHE', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'hardware_acceleration', 'none_required', 'None required', 'Nicht erforderlich', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'hardware_acceleration', 'software_only', 'Software only', 'Nur Software', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'max_vcpu_per_vm', 'up_to_8', 'Up to 8', 'Bis zu 8', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'max_vcpu_per_vm', 'up_to_32', 'Up to 32', 'Bis zu 32', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'max_vcpu_per_vm', 'up_to_128', 'Up to 128', 'Bis zu 128', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'max_vcpu_per_vm', 'up_to_256', 'Up to 256', 'Bis zu 256', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'max_vcpu_per_vm', 'unlimited', 'Unlimited', 'Unbegrenzt', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'management_interface', 'web_ui', 'Web UI', 'Web-Oberflaeche', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'management_interface', 'cli', 'CLI', 'Kommandozeile', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'management_interface', 'desktop_app', 'Desktop app', 'Desktop-Anwendung', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'management_interface', 'rest_api', 'REST API', 'REST-API', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'management_interface', 'graphical_console', 'Graphical console', 'Grafische Konsole', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'virtual_networking', 'nat', 'NAT', 'NAT', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'virtual_networking', 'bridged', 'Bridged', 'Netzwerkbruecke', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'virtual_networking', 'host_only', 'Host-only', 'Nur Host', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'virtual_networking', 'internal_network', 'Internal network', 'Internes Netzwerk', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'virtual_networking', 'macvlan', 'MACVLAN', 'MACVLAN', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'virtual_networking', 'overlay', 'Overlay', 'Overlay', 'neutral', 60
  UNION ALL SELECT 'virtualization', 'storage_backends', 'local_disk', 'Local disk', 'Lokale Festplatte', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'storage_backends', 'nfs', 'NFS', 'NFS', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'storage_backends', 'iscsi', 'iSCSI', 'iSCSI', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'storage_backends', 'ceph', 'Ceph', 'Ceph', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'storage_backends', 'zfs', 'ZFS', 'ZFS', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'storage_backends', 'glusterfs', 'GlusterFS', 'GlusterFS', 'neutral', 60
  UNION ALL SELECT 'virtualization', 'storage_backends', 'lvm', 'LVM', 'LVM', 'neutral', 70
  UNION ALL SELECT 'virtualization', 'disk_format_support', 'qcow2', 'QCOW2', 'QCOW2', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'disk_format_support', 'vmdk', 'VMDK', 'VMDK', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'disk_format_support', 'vdi', 'VDI', 'VDI', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'disk_format_support', 'raw_img', 'Raw / IMG', 'Raw / IMG', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'disk_format_support', 'vhd_vhdx', 'VHD / VHDX', 'VHD / VHDX', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'disk_format_support', 'iso', 'ISO', 'ISO', 'neutral', 60
  UNION ALL SELECT 'virtualization', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'virtualization', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'virtualization', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'virtualization', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'virtualization', 'data_processing_location', 'local_device', 'Local device', 'Lokales Geraet', 'positive', 40
  UNION ALL SELECT 'virtualization', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'virtualization', 'source_model', 'fully_open_source', 'Fully open source', 'Vollstaendig quelloffen', 'positive', 10
  UNION ALL SELECT 'virtualization', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'virtualization', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'hosting_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'hosting_model', 'self_hosted_only', 'Self-hosted only', 'Nur selbst gehostet', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'hosting_model', 'both', 'Both', 'Beides', 'positive', 30
  UNION ALL SELECT 'virtualization', 'hosting_model', 'local_app_only', 'Local app only', 'Nur lokale App', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'virtualization', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'pricing_model', 'subscription_only', 'Subscription only', 'Nur Abonnement', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'pricing_model', 'per_socket_cpu', 'Per socket / CPU', 'Pro Sockel / CPU', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'fit_profiles', 'home_lab', 'Home lab', 'Heimlabor', 'neutral', 10
  UNION ALL SELECT 'virtualization', 'fit_profiles', 'small_business', 'Small business', 'Kleinunternehmen', 'neutral', 20
  UNION ALL SELECT 'virtualization', 'fit_profiles', 'enterprise_datacenter', 'Enterprise / datacenter', 'Unternehmen / Rechenzentrum', 'neutral', 30
  UNION ALL SELECT 'virtualization', 'fit_profiles', 'developer_testing', 'Developer / testing', 'Entwicklung / Tests', 'neutral', 40
  UNION ALL SELECT 'virtualization', 'fit_profiles', 'education_training', 'Education / training', 'Bildung / Schulung', 'neutral', 50
  UNION ALL SELECT 'virtualization', 'fit_profiles', 'cloud_provider', 'Cloud provider', 'Cloud-Anbieter', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'virtualization'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'virtualization'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('043-virtualization-matrix-criteria');
