-- Migration 017: Define Desktop Operating Systems category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('desktop-os', 'kernel_architecture', 'Kernel & Architecture', 'Kernel & Architektur', 'Core technical foundation including kernel type, CPU architecture support, init system, and real-time capability.', 'Technische Grundlage einschliesslich Kernel-Typ, CPU-Architektur-Unterstuetzung, Init-System und Echtzeitfaehigkeit.', 100),
  ('desktop-os', 'installation_setup', 'Installation & Setup', 'Installation & Einrichtung', 'Acquisition, installation methods, disk encryption, system requirements, and live mode availability.', 'Beschaffung, Installationsmethoden, Festplattenverschluesselung, Systemanforderungen und Live-Modus-Verfuegbarkeit.', 200),
  ('desktop-os', 'desktop_environment_ux', 'Desktop Environment & UX', 'Desktop-Umgebung & UX', 'User-facing interface, default desktop environment, customizability, accessibility, and touchscreen support.', 'Benutzeroberflaeche, Standard-Desktop-Umgebung, Anpassbarkeit, Barrierefreiheit und Touchscreen-Unterstuetzung.', 300),
  ('desktop-os', 'package_management', 'Package Management & Software', 'Paketverwaltung & Software', 'Software distribution, package manager, universal formats, release model, and update automation.', 'Software-Verteilung, Paketmanager, universelle Formate, Release-Modell und Update-Automatisierung.', 400),
  ('desktop-os', 'security_hardening', 'Security & Hardening', 'Sicherheit & Haertung', 'Mandatory access control, application sandboxing, secure boot, verified boot, and firewall.', 'Mandatory Access Control, Anwendungssandboxing, Secure Boot, Verified Boot und Firewall.', 500),
  ('desktop-os', 'privacy_telemetry', 'Privacy & Telemetry', 'Datenschutz & Telemetrie', 'Default telemetry level, opt-out options, account requirements, and local account availability.', 'Standard-Telemetrielevel, Opt-out-Optionen, Kontoanforderungen und Verfuegbarkeit lokaler Konten.', 600),
  ('desktop-os', 'hardware_drivers', 'Hardware & Driver Support', 'Hardware & Treiberunterstuetzung', 'GPU driver model, peripheral compatibility, Bluetooth support, and printer support.', 'GPU-Treibermodell, Peripherie-Kompatibilitaet, Bluetooth-Unterstuetzung und Druckerunterstuetzung.', 700),
  ('desktop-os', 'interoperability_migration', 'Interoperability & Migration', 'Interoperabilitaet & Migration', 'Cross-platform app compatibility, default file system, and file sharing protocols.', 'Plattformuebergreifende App-Kompatibilitaet, Standard-Dateisystem und Dateifreigabeprotokolle.', 800),
  ('desktop-os', 'openness_governance_fit', 'Openness, Governance & Fit', 'Offenheit, Governance & Eignung', 'Source code model, governance, commercial support, and target user fit profiles.', 'Quellcode-Modell, Governance, kommerzieller Support und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'desktop-os' AS category_id, 'kernel_architecture' AS group_key, 'kernel_type' AS criterion_key, 'Kernel type' AS label_en, 'Kernel-Typ' AS label_de, 'enum' AS value_type, 'tradeoff' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The kernel architecture used by the operating system, affecting performance, security model, and driver ecosystem.' AS help_text_en, 'Die Kernel-Architektur des Betriebssystems mit Auswirkungen auf Leistung, Sicherheitsmodell und Treiber-Oekosystem.' AS help_text_de
  UNION ALL SELECT 'desktop-os', 'kernel_architecture', 'cpu_architecture_support', 'CPU architecture support', 'CPU-Architektur-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 1020, 'Processor architectures officially supported by the operating system.', 'Offiziell vom Betriebssystem unterstuetzte Prozessorarchitekturen.'
  UNION ALL SELECT 'desktop-os', 'kernel_architecture', 'init_system', 'Init system', 'Init-System', 'enum', 'informational', 'optional', 1030, 'The service manager and init system used to bootstrap and manage system services.', 'Der Service-Manager und das Init-System zum Starten und Verwalten von Systemdiensten.'
  UNION ALL SELECT 'desktop-os', 'kernel_architecture', 'real_time_capable', 'Real-time capable', 'Echtzeitfaehig', 'boolean', 'informational', 'optional', 1040, 'Whether the operating system supports real-time kernel scheduling or an RT-capable kernel variant.', 'Ob das Betriebssystem Echtzeit-Kernel-Scheduling oder eine echtzeitfaehige Kernel-Variante unterstuetzt.'
  UNION ALL SELECT 'desktop-os', 'installation_setup', 'installation_method', 'Installation method', 'Installationsmethode', 'multi_enum', 'informational', 'multi_select', 2010, 'Methods available for installing the operating system on hardware.', 'Verfuegbare Methoden zur Installation des Betriebssystems auf Hardware.'
  UNION ALL SELECT 'desktop-os', 'installation_setup', 'disk_encryption_setup', 'Disk encryption setup', 'Festplattenverschluesselung bei Einrichtung', 'enum', 'beneficial', 'optional', 2020, 'Whether full-disk encryption is offered or enabled by default during installation.', 'Ob Vollverschluesselung der Festplatte bei der Installation angeboten oder standardmaessig aktiviert wird.'
  UNION ALL SELECT 'desktop-os', 'installation_setup', 'system_requirements_ram_gb', 'Minimum RAM (GB)', 'Minimaler RAM (GB)', 'number', 'informational', 'range', 2030, 'The documented minimum RAM requirement in gigabytes.', 'Die dokumentierte Mindest-RAM-Anforderung in Gigabyte.'
  UNION ALL SELECT 'desktop-os', 'installation_setup', 'live_mode_available', 'Live mode available', 'Live-Modus verfuegbar', 'boolean', 'beneficial', 'optional', 2040, 'Whether the operating system can be booted and tried from removable media without installation.', 'Ob das Betriebssystem von Wechselmedien gestartet und getestet werden kann, ohne es zu installieren.'
  UNION ALL SELECT 'desktop-os', 'desktop_environment_ux', 'default_desktop_environment', 'Default desktop environment', 'Standard-Desktop-Umgebung', 'enum', 'tradeoff', 'optional', 3010, 'The desktop environment or shell shipped by default with the operating system.', 'Die standardmaessig mit dem Betriebssystem ausgelieferte Desktop-Umgebung oder Shell.'
  UNION ALL SELECT 'desktop-os', 'desktop_environment_ux', 'desktop_environment_swappable', 'Desktop environment swappable', 'Desktop-Umgebung austauschbar', 'boolean', 'tradeoff', 'optional', 3020, 'Whether the desktop environment can be replaced with an alternative.', 'Ob die Desktop-Umgebung durch eine Alternative ersetzt werden kann.'
  UNION ALL SELECT 'desktop-os', 'desktop_environment_ux', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 3030, 'Built-in accessibility features for users with disabilities.', 'Integrierte Barrierefreiheitsfunktionen fuer Nutzer mit Behinderungen.'
  UNION ALL SELECT 'desktop-os', 'desktop_environment_ux', 'touchscreen_support', 'Touchscreen support', 'Touchscreen-Unterstuetzung', 'boolean', 'informational', 'optional', 3040, 'Whether the operating system provides native touchscreen and tablet mode support.', 'Ob das Betriebssystem native Touchscreen- und Tablet-Modus-Unterstuetzung bietet.'
  UNION ALL SELECT 'desktop-os', 'package_management', 'package_manager_type', 'Package manager type', 'Paketmanager-Typ', 'enum', 'informational', 'optional', 4010, 'The primary system package manager used for software installation and updates.', 'Der primaere Systempaketmanager fuer Softwareinstallation und -updates.'
  UNION ALL SELECT 'desktop-os', 'package_management', 'universal_package_formats', 'Universal package formats', 'Universelle Paketformate', 'multi_enum', 'informational', 'multi_select', 4020, 'Cross-distribution or universal software packaging formats supported.', 'Unterstuetzte distributionsuebergreifende oder universelle Software-Paketformate.'
  UNION ALL SELECT 'desktop-os', 'package_management', 'rolling_release', 'Rolling release', 'Rolling Release', 'boolean', 'tradeoff', 'optional', 4030, 'Whether the operating system uses a rolling release model with continuous updates instead of versioned point releases.', 'Ob das Betriebssystem ein Rolling-Release-Modell mit kontinuierlichen Updates statt versionierter Punktreleases verwendet.'
  UNION ALL SELECT 'desktop-os', 'package_management', 'unattended_updates', 'Unattended updates', 'Unbeaufsichtigte Updates', 'enum', 'beneficial', 'optional', 4040, 'The level of automatic or unattended update capability provided by the operating system.', 'Der Grad der automatischen oder unbeaufsichtigten Update-Faehigkeit des Betriebssystems.'
  UNION ALL SELECT 'desktop-os', 'security_hardening', 'mandatory_access_control', 'Mandatory access control', 'Mandatory Access Control', 'enum', 'beneficial', 'optional', 5010, 'The mandatory access control framework used for process and file-level security policies.', 'Das Mandatory-Access-Control-Framework fuer Prozess- und Datei-Sicherheitsrichtlinien.'
  UNION ALL SELECT 'desktop-os', 'security_hardening', 'application_sandboxing', 'Application sandboxing', 'Anwendungssandboxing', 'enum', 'beneficial', 'optional', 5020, 'The application isolation and sandboxing model used by the operating system.', 'Das Anwendungsisolations- und Sandboxing-Modell des Betriebssystems.'
  UNION ALL SELECT 'desktop-os', 'security_hardening', 'secure_boot_support', 'Secure Boot support', 'Secure-Boot-Unterstuetzung', 'boolean', 'beneficial', 'optional', 5030, 'Whether the operating system supports UEFI Secure Boot.', 'Ob das Betriebssystem UEFI Secure Boot unterstuetzt.'
  UNION ALL SELECT 'desktop-os', 'security_hardening', 'verified_boot', 'Verified boot', 'Verified Boot', 'boolean', 'beneficial', 'optional', 5040, 'Whether the operating system supports a full verified or measured boot chain.', 'Ob das Betriebssystem eine vollstaendig verifizierte oder gemessene Boot-Kette unterstuetzt.'
  UNION ALL SELECT 'desktop-os', 'security_hardening', 'firewall_included', 'Firewall included', 'Firewall enthalten', 'boolean', 'beneficial', 'optional', 5050, 'Whether a firewall is included and available out of the box.', 'Ob eine Firewall enthalten und sofort einsatzbereit ist.'
  UNION ALL SELECT 'desktop-os', 'privacy_telemetry', 'telemetry_default', 'Telemetry default', 'Telemetrie-Standard', 'enum', 'risk', 'must_match', 6010, 'The default telemetry and data collection level when the operating system is first used.', 'Das Standard-Telemetrie- und Datenerfassungsniveau bei der ersten Nutzung des Betriebssystems.'
  UNION ALL SELECT 'desktop-os', 'privacy_telemetry', 'telemetry_opt_out', 'Telemetry opt-out', 'Telemetrie-Opt-out', 'enum', 'beneficial', 'optional', 6020, 'Whether and how telemetry can be reduced or fully disabled by the user.', 'Ob und wie Telemetrie vom Nutzer reduziert oder vollstaendig deaktiviert werden kann.'
  UNION ALL SELECT 'desktop-os', 'privacy_telemetry', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 6030, 'Whether an online account is required for basic usage of the operating system.', 'Ob ein Online-Konto fuer die grundlegende Nutzung des Betriebssystems erforderlich ist.'
  UNION ALL SELECT 'desktop-os', 'privacy_telemetry', 'local_account_option', 'Local account option', 'Lokales Konto moeglich', 'boolean', 'beneficial', 'optional', 6040, 'Whether a fully offline local account can be used without connecting to an online service.', 'Ob ein vollstaendig offline lokales Konto ohne Verbindung zu einem Online-Dienst genutzt werden kann.'
  UNION ALL SELECT 'desktop-os', 'hardware_drivers', 'gpu_driver_model', 'GPU driver model', 'GPU-Treibermodell', 'enum', 'tradeoff', 'optional', 7010, 'The primary model for GPU driver support and distribution.', 'Das primaere Modell fuer GPU-Treiberunterstuetzung und -verteilung.'
  UNION ALL SELECT 'desktop-os', 'hardware_drivers', 'peripheral_plug_and_play', 'Peripheral plug-and-play', 'Peripherie-Plug-and-Play', 'enum', 'informational', 'optional', 7020, 'How well peripherals such as USB devices, webcams, and input devices work out of the box.', 'Wie gut Peripheriegeraete wie USB-Geraete, Webcams und Eingabegeraete sofort funktionieren.'
  UNION ALL SELECT 'desktop-os', 'hardware_drivers', 'bluetooth_support', 'Bluetooth support', 'Bluetooth-Unterstuetzung', 'boolean', 'informational', 'optional', 7030, 'Whether a built-in Bluetooth stack is available for device pairing and audio.', 'Ob ein integrierter Bluetooth-Stack fuer Geraetekopplung und Audio verfuegbar ist.'
  UNION ALL SELECT 'desktop-os', 'hardware_drivers', 'printer_support_model', 'Printer support model', 'Druckerunterstuetzungsmodell', 'enum', 'informational', 'optional', 7040, 'The printing subsystem and driver model used for printer support.', 'Das Drucksubsystem und Treibermodell fuer Druckerunterstuetzung.'
  UNION ALL SELECT 'desktop-os', 'interoperability_migration', 'windows_app_compatibility', 'Windows app compatibility', 'Windows-App-Kompatibilitaet', 'enum', 'informational', 'optional', 8010, 'The documented level of compatibility for running Windows applications.', 'Der dokumentierte Grad der Kompatibilitaet zum Ausfuehren von Windows-Anwendungen.'
  UNION ALL SELECT 'desktop-os', 'interoperability_migration', 'linux_app_compatibility', 'Linux app compatibility', 'Linux-App-Kompatibilitaet', 'enum', 'informational', 'optional', 8020, 'The documented level of compatibility for running Linux applications.', 'Der dokumentierte Grad der Kompatibilitaet zum Ausfuehren von Linux-Anwendungen.'
  UNION ALL SELECT 'desktop-os', 'interoperability_migration', 'file_system_default', 'Default file system', 'Standard-Dateisystem', 'enum', 'informational', 'optional', 8030, 'The default file system used for the root or system partition.', 'Das Standard-Dateisystem fuer die Root- oder Systempartition.'
  UNION ALL SELECT 'desktop-os', 'interoperability_migration', 'cross_platform_file_sharing', 'Cross-platform file sharing', 'Plattformuebergreifende Dateifreigabe', 'multi_enum', 'informational', 'multi_select', 8040, 'Network file sharing protocols supported for cross-platform interoperability.', 'Unterstuetzte Netzwerk-Dateifreigabeprotokolle fuer plattformuebergreifende Interoperabilitaet.'
  UNION ALL SELECT 'desktop-os', 'openness_governance_fit', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The openness model of the operating system source code.', 'Das Offenheitsmodell des Betriebssystem-Quellcodes.'
  UNION ALL SELECT 'desktop-os', 'openness_governance_fit', 'governance_model', 'Governance model', 'Governance-Modell', 'enum', 'informational', 'optional', 9020, 'The organizational and decision-making structure behind the operating system.', 'Die Organisations- und Entscheidungsstruktur hinter dem Betriebssystem.'
  UNION ALL SELECT 'desktop-os', 'openness_governance_fit', 'commercial_support_available', 'Commercial support available', 'Kommerzieller Support verfuegbar', 'boolean', 'informational', 'optional', 9030, 'Whether paid professional support contracts or enterprise support tiers are available.', 'Ob bezahlte professionelle Support-Vertraege oder Enterprise-Support-Stufen verfuegbar sind.'
  UNION ALL SELECT 'desktop-os', 'openness_governance_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Common user profiles or use cases the operating system is well suited for.', 'Typische Nutzerprofile oder Anwendungsfaelle, fuer die das Betriebssystem gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'desktop-os' AS category_id, 'kernel_type' AS criterion_key, 'monolithic' AS option_key, 'Monolithic' AS label_en, 'Monolithisch' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'desktop-os', 'kernel_type', 'microkernel', 'Microkernel', 'Mikrokernel', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'kernel_type', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'kernel_type', 'exokernel', 'Exokernel', 'Exokernel', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'cpu_architecture_support', 'x86_64', 'x86_64', 'x86_64', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'cpu_architecture_support', 'arm64', 'ARM64', 'ARM64', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'cpu_architecture_support', 'riscv64', 'RISC-V 64', 'RISC-V 64', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'cpu_architecture_support', 'x86_32', 'x86 (32-bit)', 'x86 (32-Bit)', 'tradeoff', 40
  UNION ALL SELECT 'desktop-os', 'cpu_architecture_support', 'ppc64', 'PowerPC 64', 'PowerPC 64', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'init_system', 'systemd', 'systemd', 'systemd', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'init_system', 'openrc', 'OpenRC', 'OpenRC', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'init_system', 'runit', 'runit', 'runit', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'init_system', 'launchd', 'launchd', 'launchd', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'init_system', 'windows_scm', 'Windows SCM', 'Windows SCM', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'init_system', 'other', 'Other', 'Andere', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'installation_method', 'graphical_installer', 'Graphical installer', 'Grafischer Installer', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'installation_method', 'text_installer', 'Text installer', 'Text-Installer', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'installation_method', 'automated_script', 'Automated script', 'Automatisiertes Skript', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'installation_method', 'pre_installed', 'Pre-installed', 'Vorinstalliert', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'installation_method', 'network_install', 'Network install', 'Netzwerkinstallation', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'disk_encryption_setup', 'not_offered', 'Not offered', 'Nicht angeboten', 'warning', 10
  UNION ALL SELECT 'desktop-os', 'disk_encryption_setup', 'opt_in_during_install', 'Opt-in during install', 'Opt-in bei Installation', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'disk_encryption_setup', 'default_on', 'Default on', 'Standardmaessig aktiv', 'positive', 30
  UNION ALL SELECT 'desktop-os', 'disk_encryption_setup', 'always_encrypted', 'Always encrypted', 'Immer verschluesselt', 'positive', 40
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'gnome', 'GNOME', 'GNOME', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'kde_plasma', 'KDE Plasma', 'KDE Plasma', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'xfce', 'Xfce', 'Xfce', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'cinnamon', 'Cinnamon', 'Cinnamon', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'mate', 'MATE', 'MATE', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'aqua', 'Aqua (macOS)', 'Aqua (macOS)', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'windows_shell', 'Windows Shell', 'Windows Shell', 'neutral', 70
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'tiling_wm', 'Tiling WM', 'Tiling-WM', 'tradeoff', 80
  UNION ALL SELECT 'desktop-os', 'default_desktop_environment', 'other', 'Other', 'Andere', 'neutral', 90
  UNION ALL SELECT 'desktop-os', 'accessibility_features', 'screen_reader', 'Screen reader', 'Screenreader', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'accessibility_features', 'magnification', 'Magnification', 'Vergroesserung', 'positive', 20
  UNION ALL SELECT 'desktop-os', 'accessibility_features', 'high_contrast', 'High contrast', 'Hoher Kontrast', 'positive', 30
  UNION ALL SELECT 'desktop-os', 'accessibility_features', 'voice_control', 'Voice control', 'Sprachsteuerung', 'positive', 40
  UNION ALL SELECT 'desktop-os', 'accessibility_features', 'on_screen_keyboard', 'On-screen keyboard', 'Bildschirmtastatur', 'positive', 50
  UNION ALL SELECT 'desktop-os', 'accessibility_features', 'color_filters', 'Color filters', 'Farbfilter', 'positive', 60
  UNION ALL SELECT 'desktop-os', 'accessibility_features', 'sticky_keys', 'Sticky keys', 'Einrastfunktion', 'positive', 70
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'apt_dpkg', 'APT/dpkg', 'APT/dpkg', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'dnf_rpm', 'DNF/RPM', 'DNF/RPM', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'pacman', 'pacman', 'pacman', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'zypper', 'zypper', 'zypper', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'portage', 'Portage', 'Portage', 'tradeoff', 50
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'homebrew', 'Homebrew', 'Homebrew', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'msi_msix', 'MSI/MSIX', 'MSI/MSIX', 'neutral', 70
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'nix', 'Nix', 'Nix', 'neutral', 80
  UNION ALL SELECT 'desktop-os', 'package_manager_type', 'other', 'Other', 'Andere', 'neutral', 90
  UNION ALL SELECT 'desktop-os', 'universal_package_formats', 'flatpak', 'Flatpak', 'Flatpak', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'universal_package_formats', 'snap', 'Snap', 'Snap', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'universal_package_formats', 'appimage', 'AppImage', 'AppImage', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'universal_package_formats', 'dmg', '.dmg', '.dmg', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'universal_package_formats', 'exe_msi', '.exe/.msi', '.exe/.msi', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'universal_package_formats', 'nix_packages', 'Nix packages', 'Nix-Pakete', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'unattended_updates', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'desktop-os', 'unattended_updates', 'manual_only', 'Manual only', 'Nur manuell', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'unattended_updates', 'opt_in_auto', 'Opt-in auto', 'Opt-in automatisch', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'unattended_updates', 'default_auto', 'Default auto', 'Standardmaessig automatisch', 'positive', 40
  UNION ALL SELECT 'desktop-os', 'unattended_updates', 'forced', 'Forced', 'Erzwungen', 'tradeoff', 50
  UNION ALL SELECT 'desktop-os', 'mandatory_access_control', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'desktop-os', 'mandatory_access_control', 'selinux', 'SELinux', 'SELinux', 'positive', 20
  UNION ALL SELECT 'desktop-os', 'mandatory_access_control', 'apparmor', 'AppArmor', 'AppArmor', 'positive', 30
  UNION ALL SELECT 'desktop-os', 'mandatory_access_control', 'macos_sandbox', 'macOS Sandbox', 'macOS Sandbox', 'positive', 40
  UNION ALL SELECT 'desktop-os', 'mandatory_access_control', 'windows_mic', 'Windows MIC', 'Windows MIC', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'mandatory_access_control', 'tomoyo', 'TOMOYO', 'TOMOYO', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'application_sandboxing', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'desktop-os', 'application_sandboxing', 'flatpak_sandbox', 'Flatpak sandbox', 'Flatpak-Sandbox', 'positive', 20
  UNION ALL SELECT 'desktop-os', 'application_sandboxing', 'snap_confinement', 'Snap confinement', 'Snap-Confinement', 'positive', 30
  UNION ALL SELECT 'desktop-os', 'application_sandboxing', 'macos_app_sandbox', 'macOS App Sandbox', 'macOS-App-Sandbox', 'positive', 40
  UNION ALL SELECT 'desktop-os', 'application_sandboxing', 'windows_sandbox', 'Windows Sandbox', 'Windows Sandbox', 'positive', 50
  UNION ALL SELECT 'desktop-os', 'application_sandboxing', 'firejail_bubblewrap', 'Firejail/Bubblewrap', 'Firejail/Bubblewrap', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'telemetry_default', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'telemetry_default', 'opt_in_only', 'Opt-in only', 'Nur Opt-in', 'positive', 20
  UNION ALL SELECT 'desktop-os', 'telemetry_default', 'minimal_default', 'Minimal default', 'Minimaler Standard', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'telemetry_default', 'moderate_default', 'Moderate default', 'Moderater Standard', 'tradeoff', 40
  UNION ALL SELECT 'desktop-os', 'telemetry_default', 'extensive_default', 'Extensive default', 'Umfangreicher Standard', 'warning', 50
  UNION ALL SELECT 'desktop-os', 'telemetry_opt_out', 'not_applicable', 'Not applicable', 'Nicht zutreffend', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'telemetry_opt_out', 'fully_disableable', 'Fully disableable', 'Vollstaendig deaktivierbar', 'positive', 20
  UNION ALL SELECT 'desktop-os', 'telemetry_opt_out', 'partially_disableable', 'Partially disableable', 'Teilweise deaktivierbar', 'tradeoff', 30
  UNION ALL SELECT 'desktop-os', 'telemetry_opt_out', 'not_disableable', 'Not disableable', 'Nicht deaktivierbar', 'warning', 40
  UNION ALL SELECT 'desktop-os', 'gpu_driver_model', 'open_source_mesa', 'Open-source Mesa', 'Open-Source Mesa', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'gpu_driver_model', 'proprietary_drivers', 'Proprietary drivers', 'Proprietaere Treiber', 'tradeoff', 20
  UNION ALL SELECT 'desktop-os', 'gpu_driver_model', 'hybrid_open_proprietary', 'Hybrid open/proprietary', 'Hybrid offen/proprietaer', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'gpu_driver_model', 'vendor_integrated', 'Vendor integrated', 'Herstellerintegriert', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'peripheral_plug_and_play', 'excellent', 'Excellent', 'Ausgezeichnet', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'peripheral_plug_and_play', 'good', 'Good', 'Gut', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'peripheral_plug_and_play', 'moderate', 'Moderate', 'Maessig', 'tradeoff', 30
  UNION ALL SELECT 'desktop-os', 'peripheral_plug_and_play', 'limited', 'Limited', 'Eingeschraenkt', 'warning', 40
  UNION ALL SELECT 'desktop-os', 'printer_support_model', 'cups', 'CUPS', 'CUPS', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'printer_support_model', 'native_drivers', 'Native drivers', 'Native Treiber', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'printer_support_model', 'ipp_everywhere', 'IPP Everywhere', 'IPP Everywhere', 'positive', 30
  UNION ALL SELECT 'desktop-os', 'printer_support_model', 'limited', 'Limited', 'Eingeschraenkt', 'warning', 40
  UNION ALL SELECT 'desktop-os', 'windows_app_compatibility', 'native', 'Native', 'Nativ', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'windows_app_compatibility', 'wine_proton', 'Wine/Proton', 'Wine/Proton', 'tradeoff', 20
  UNION ALL SELECT 'desktop-os', 'windows_app_compatibility', 'vm_only', 'VM only', 'Nur VM', 'tradeoff', 30
  UNION ALL SELECT 'desktop-os', 'windows_app_compatibility', 'wsl_reverse', 'WSL (reverse)', 'WSL (umgekehrt)', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'windows_app_compatibility', 'none', 'None', 'Keine', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'linux_app_compatibility', 'native', 'Native', 'Nativ', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'linux_app_compatibility', 'wsl', 'WSL', 'WSL', 'tradeoff', 20
  UNION ALL SELECT 'desktop-os', 'linux_app_compatibility', 'docker_container', 'Docker/container', 'Docker/Container', 'tradeoff', 30
  UNION ALL SELECT 'desktop-os', 'linux_app_compatibility', 'vm_only', 'VM only', 'Nur VM', 'tradeoff', 40
  UNION ALL SELECT 'desktop-os', 'linux_app_compatibility', 'none', 'None', 'Keine', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'file_system_default', 'ext4', 'ext4', 'ext4', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'file_system_default', 'btrfs', 'Btrfs', 'Btrfs', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'file_system_default', 'xfs', 'XFS', 'XFS', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'file_system_default', 'zfs', 'ZFS', 'ZFS', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'file_system_default', 'apfs', 'APFS', 'APFS', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'file_system_default', 'ntfs', 'NTFS', 'NTFS', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'file_system_default', 'other', 'Other', 'Andere', 'neutral', 70
  UNION ALL SELECT 'desktop-os', 'cross_platform_file_sharing', 'smb_cifs', 'SMB/CIFS', 'SMB/CIFS', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'cross_platform_file_sharing', 'nfs', 'NFS', 'NFS', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'cross_platform_file_sharing', 'sshfs_sftp', 'SSHFS/SFTP', 'SSHFS/SFTP', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'cross_platform_file_sharing', 'airdrop', 'AirDrop', 'AirDrop', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'cross_platform_file_sharing', 'nearby_share', 'Nearby Share', 'Nearby Share', 'neutral', 50
  UNION ALL SELECT 'desktop-os', 'cross_platform_file_sharing', 'webdav', 'WebDAV', 'WebDAV', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'source_code_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'source_code_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'source_code_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'desktop-os', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'desktop-os', 'governance_model', 'community_driven', 'Community driven', 'Community-getrieben', 'positive', 10
  UNION ALL SELECT 'desktop-os', 'governance_model', 'foundation_backed', 'Foundation backed', 'Stiftungsunterstuetzt', 'positive', 20
  UNION ALL SELECT 'desktop-os', 'governance_model', 'corporate_open', 'Corporate open', 'Unternehmen offen', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'governance_model', 'single_vendor', 'Single vendor', 'Einzelanbieter', 'tradeoff', 40
  UNION ALL SELECT 'desktop-os', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 10
  UNION ALL SELECT 'desktop-os', 'fit_profiles', 'creative_professional', 'Creative professional', 'Kreativprofi', 'neutral', 20
  UNION ALL SELECT 'desktop-os', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'desktop-os', 'fit_profiles', 'education', 'Education', 'Bildung', 'neutral', 40
  UNION ALL SELECT 'desktop-os', 'fit_profiles', 'privacy_focused', 'Privacy focused', 'Datenschutzorientiert', 'positive', 50
  UNION ALL SELECT 'desktop-os', 'fit_profiles', 'beginner', 'Beginner', 'Anfaenger', 'neutral', 60
  UNION ALL SELECT 'desktop-os', 'fit_profiles', 'server_crossover', 'Server crossover', 'Server-Crossover', 'tradeoff', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'desktop-os'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'desktop-os'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('017-desktop-os-matrix-criteria');
