-- Migration 006: Define Messaging category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('messaging', 'identity_contacts', 'Identity & Contacts', 'Identität & Kontakte', 'How users identify, find, and invite contacts.', 'Wie Nutzer sich identifizieren, Kontakte finden und Einladungen teilen.', 100),
  ('messaging', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Where the messenger can be used and how accounts and devices work.', 'Wo der Messenger genutzt werden kann und wie Konten und Geräte funktionieren.', 200),
  ('messaging', 'security_privacy', 'Security & Privacy', 'Sicherheit & Datenschutz', 'Message protection, verification, metadata, and privacy controls.', 'Nachrichtenschutz, Verifikation, Metadaten und Datenschutzkontrollen.', 300),
  ('messaging', 'architecture_control', 'Architecture & Control', 'Architektur & Kontrolle', 'Centralization, federation, self-hosting, protocols, and client choice.', 'Zentralisierung, Föderation, Selbsthosting, Protokolle und Client-Auswahl.', 400),
  ('messaging', 'messaging_usability', 'Messaging UX', 'Nachrichtenkomfort', 'Everyday chat features and user controls.', 'Alltägliche Chat-Funktionen und Nutzerkontrollen.', 500),
  ('messaging', 'groups_communities', 'Groups & Communities', 'Gruppen & Communities', 'Group size, roles, rooms, channels, and moderation.', 'Gruppengröße, Rollen, Räume, Kanäle und Moderation.', 600),
  ('messaging', 'calls_media', 'Calls & Media', 'Anrufe & Medien', 'Voice and video calls, media sharing, and file limits.', 'Sprach- und Videoanrufe, Medienfreigabe und Dateigrenzen.', 700),
  ('messaging', 'backup_export', 'Backup, Export & Portability', 'Backup, Export & Portabilität', 'Recovery, migration, and export support.', 'Wiederherstellung, Migration und Export-Unterstützung.', 800),
  ('messaging', 'interoperability_fit', 'Interoperability & Fit', 'Interoperabilität & Eignung', 'Bridges, standards, integrations, and user-fit profiles.', 'Bridges, Standards, Integrationen und Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'messaging' AS category_id, 'identity_contacts' AS group_key, 'phone_number_required' AS criterion_key, 'Phone number required' AS label_en, 'Telefonnummer erforderlich' AS label_de, 'boolean' AS value_type, 'risk' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Whether creating or using an account requires a mobile phone number.' AS help_text_en, 'Ob für Erstellung oder Nutzung eines Kontos eine Mobiltelefonnummer erforderlich ist.' AS help_text_de
  UNION ALL SELECT 'messaging', 'identity_contacts', 'address_book_upload_required', 'Address book upload required', 'Adressbuch-Upload erforderlich', 'boolean', 'risk', 'must_match', 1020, 'Whether normal contact discovery requires uploading address book contacts.', 'Ob die normale Kontaktsuche einen Upload von Adressbuchkontakten erfordert.'
  UNION ALL SELECT 'messaging', 'identity_contacts', 'supported_identifiers', 'Supported identifiers', 'Unterstützte Kennungen', 'multi_enum', 'tradeoff', 'multi_select', 1030, 'Identifiers users can use to create an account or be reached by others.', 'Kennungen, mit denen Nutzer ein Konto erstellen oder von anderen erreicht werden können.'
  UNION ALL SELECT 'messaging', 'identity_contacts', 'contact_discovery_methods', 'Contact discovery methods', 'Methoden zur Kontaktsuche', 'multi_enum', 'informational', 'multi_select', 1040, 'Documented ways users can find or invite contacts.', 'Dokumentierte Wege, wie Nutzer Kontakte finden oder einladen können.'
  UNION ALL SELECT 'messaging', 'identity_contacts', 'multiple_accounts', 'Multiple accounts supported', 'Mehrere Konten unterstützt', 'boolean', 'informational', 'optional', 1050, 'Whether one installation or client can manage more than one account.', 'Ob eine Installation oder ein Client mehr als ein Konto verwalten kann.'
  UNION ALL SELECT 'messaging', 'platform_access', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 2010, 'Operating systems, stores, and access paths with maintained clients.', 'Betriebssysteme, Stores und Zugriffswege mit gepflegten Clients.'
  UNION ALL SELECT 'messaging', 'platform_access', 'browser_access', 'Browser access', 'Zugriff im Browser', 'boolean', 'beneficial', 'optional', 2020, 'Whether messaging is available through a browser or web app.', 'Ob Messaging über einen Browser oder eine Web-App verfügbar ist.'
  UNION ALL SELECT 'messaging', 'platform_access', 'desktop_apps', 'Desktop apps', 'Desktop-Apps', 'boolean', 'beneficial', 'optional', 2030, 'Whether maintained desktop applications are available.', 'Ob gepflegte Desktop-Anwendungen verfügbar sind.'
  UNION ALL SELECT 'messaging', 'platform_access', 'multi_device_model', 'Multi-device model', 'Mehrgeräte-Modell', 'enum', 'tradeoff', 'optional', 2040, 'How the service supports multiple devices and message synchronization.', 'Wie der Dienst mehrere Geräte und Nachrichtensynchronisierung unterstützt.'
  UNION ALL SELECT 'messaging', 'platform_access', 'push_delivery_model', 'Push delivery model', 'Push-Zustellmodell', 'enum', 'tradeoff', 'optional', 2050, 'How notifications or background delivery are handled.', 'Wie Benachrichtigungen oder Hintergrundzustellung gehandhabt werden.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'e2ee_direct_default', 'E2EE for direct chats by default', 'E2EE für Direktchats standardmäßig', 'boolean', 'beneficial', 'must_match', 3010, 'Whether one-to-one content is end-to-end encrypted without changing default settings.', 'Ob Eins-zu-eins-Inhalte ohne Änderung der Standardeinstellungen Ende-zu-Ende-verschlüsselt sind.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'e2ee_group_default', 'E2EE for groups by default', 'E2EE für Gruppen standardmäßig', 'boolean', 'beneficial', 'must_match', 3020, 'Whether group message content is end-to-end encrypted without changing default settings.', 'Ob Gruppeninhalte ohne Änderung der Standardeinstellungen Ende-zu-Ende-verschlüsselt sind.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'device_verification', 'Device or safety-number verification', 'Geräte- oder Sicherheitsnummern-Prüfung', 'boolean', 'beneficial', 'optional', 3030, 'Whether users can verify devices, sessions, or safety numbers.', 'Ob Nutzer Geräte, Sitzungen oder Sicherheitsnummern prüfen können.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'forward_secrecy_documented', 'Forward secrecy documented', 'Forward Secrecy dokumentiert', 'boolean', 'beneficial', 'optional', 3040, 'Whether the service documents forward secrecy for message encryption.', 'Ob der Dienst Forward Secrecy für Nachrichtenverschlüsselung dokumentiert.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'disappearing_messages', 'Disappearing messages', 'Verschwindende Nachrichten', 'boolean', 'beneficial', 'optional', 3050, 'Whether users can configure messages to disappear automatically.', 'Ob Nutzer Nachrichten automatisch verschwinden lassen können.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'metadata_protection_level', 'Metadata protection level', 'Metadatenschutz-Niveau', 'enum', 'tradeoff', 'optional', 3060, 'How strongly the service claims to reduce exposure of social graph, sender, recipient, or timing metadata.', 'Wie stark der Dienst die Offenlegung von Social Graph, Absender, Empfänger oder Zeitmetadaten reduziert.'
  UNION ALL SELECT 'messaging', 'security_privacy', 'screenshot_or_forwarding_controls', 'Screenshot/forwarding controls', 'Screenshot-/Weiterleitungs-Kontrollen', 'multi_enum', 'informational', 'multi_select', 3070, 'Controls that warn about, block, or limit screenshots, forwarding, or downloads.', 'Kontrollen, die Screenshots, Weiterleitungen oder Downloads warnen, sperren oder begrenzen.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'network_architecture', 'Network architecture', 'Netzwerkarchitektur', 'enum', 'tradeoff', 'optional', 4010, 'Whether messaging depends on a central service, federation, peer-to-peer transport, local mesh, or another architecture.', 'Ob Messaging von einem zentralen Dienst, Föderation, Peer-to-peer-Transport, lokalem Mesh oder einer anderen Architektur abhängt.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'self_hosting_available', 'Self-hosting available', 'Selbsthosting verfügbar', 'boolean', 'tradeoff', 'optional', 4020, 'Whether users or organizations can operate compatible server infrastructure themselves.', 'Ob Nutzer oder Organisationen kompatible Server-Infrastruktur selbst betreiben können.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'open_protocol', 'Open or documented protocol', 'Offenes oder dokumentiertes Protokoll', 'boolean', 'beneficial', 'optional', 4030, 'Whether the core messaging protocol is openly specified or documented.', 'Ob das zentrale Messaging-Protokoll offen spezifiziert oder dokumentiert ist.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'third_party_clients', 'Third-party clients allowed', 'Drittanbieter-Clients erlaubt', 'boolean', 'tradeoff', 'optional', 4040, 'Whether compatible third-party clients are allowed or supported.', 'Ob kompatible Drittanbieter-Clients erlaubt oder unterstützt werden.'
  UNION ALL SELECT 'messaging', 'architecture_control', 'server_side_components', 'Server-side components', 'Serverseitige Komponenten', 'enum', 'informational', 'optional', 4050, 'The server-side infrastructure model required for normal operation.', 'Das serverseitige Infrastrukturmodell für den normalen Betrieb.'
  UNION ALL SELECT 'messaging', 'messaging_usability', 'message_editing', 'Message editing', 'Nachrichten bearbeiten', 'boolean', 'beneficial', 'optional', 5010, 'Whether sent messages can be edited.', 'Ob gesendete Nachrichten bearbeitet werden können.'
  UNION ALL SELECT 'messaging', 'messaging_usability', 'message_deletion', 'Message deletion controls', 'Löschkontrollen für Nachrichten', 'enum', 'informational', 'optional', 5020, 'How sent messages can be deleted or recalled.', 'Wie gesendete Nachrichten gelöscht oder zurückgerufen werden können.'
  UNION ALL SELECT 'messaging', 'messaging_usability', 'reactions_threads', 'Reactions and threads', 'Reaktionen und Threads', 'multi_enum', 'informational', 'multi_select', 5030, 'Conversation features such as reactions, replies, threads, or quoted replies.', 'Unterhaltungsfunktionen wie Reaktionen, Antworten, Threads oder Zitatantworten.'
  UNION ALL SELECT 'messaging', 'messaging_usability', 'read_receipt_controls', 'Read-receipt controls', 'Lesebestätigungs-Kontrollen', 'boolean', 'beneficial', 'optional', 5040, 'Whether users can disable or control read receipts.', 'Ob Nutzer Lesebestätigungen deaktivieren oder kontrollieren können.'
  UNION ALL SELECT 'messaging', 'messaging_usability', 'scheduled_or_pinned_messages', 'Scheduled or pinned messages', 'Geplante oder angepinnte Nachrichten', 'multi_enum', 'informational', 'multi_select', 5050, 'Productivity features such as scheduled sending, pinned messages, or saved messages.', 'Produktivitätsfunktionen wie geplantes Senden, angepinnte Nachrichten oder gespeicherte Nachrichten.'
  UNION ALL SELECT 'messaging', 'groups_communities', 'group_chat_support', 'Group chat support', 'Gruppenchat-Unterstützung', 'boolean', 'beneficial', 'must_match', 6010, 'Whether the messenger supports group conversations.', 'Ob der Messenger Gruppenunterhaltungen unterstützt.'
  UNION ALL SELECT 'messaging', 'groups_communities', 'max_group_members', 'Maximum group size', 'Maximale Gruppengröße', 'number', 'informational', 'range', 6020, 'Documented maximum number of members in a group.', 'Dokumentierte maximale Anzahl von Mitgliedern in einer Gruppe.'
  UNION ALL SELECT 'messaging', 'groups_communities', 'group_admin_tools', 'Group admin tools', 'Gruppenverwaltungs-Werkzeuge', 'multi_enum', 'beneficial', 'multi_select', 6030, 'Administration and moderation controls available for groups.', 'Verwaltungs- und Moderationskontrollen für Gruppen.'
  UNION ALL SELECT 'messaging', 'groups_communities', 'public_rooms_or_channels', 'Public rooms or channels', 'Öffentliche Räume oder Kanäle', 'boolean', 'tradeoff', 'optional', 6040, 'Whether the service supports public rooms, channels, or broadcast spaces.', 'Ob der Dienst öffentliche Räume, Kanäle oder Broadcast-Bereiche unterstützt.'
  UNION ALL SELECT 'messaging', 'groups_communities', 'community_discovery', 'Community discovery', 'Community-Suche', 'enum', 'tradeoff', 'optional', 6050, 'How public or semi-public communities can be discovered.', 'Wie öffentliche oder halb-öffentliche Communities gefunden werden können.'
  UNION ALL SELECT 'messaging', 'calls_media', 'voice_calls', 'Voice calls', 'Sprachanrufe', 'boolean', 'beneficial', 'optional', 7010, 'Whether one-to-one voice calls are supported.', 'Ob Eins-zu-eins-Sprachanrufe unterstützt werden.'
  UNION ALL SELECT 'messaging', 'calls_media', 'video_calls', 'Video calls', 'Videoanrufe', 'boolean', 'beneficial', 'optional', 7020, 'Whether one-to-one video calls are supported.', 'Ob Eins-zu-eins-Videoanrufe unterstützt werden.'
  UNION ALL SELECT 'messaging', 'calls_media', 'group_calls', 'Group calls', 'Gruppenanrufe', 'boolean', 'beneficial', 'optional', 7030, 'Whether calls with multiple participants are supported.', 'Ob Anrufe mit mehreren Teilnehmenden unterstützt werden.'
  UNION ALL SELECT 'messaging', 'calls_media', 'voice_messages', 'Voice messages', 'Sprachnachrichten', 'boolean', 'beneficial', 'optional', 7040, 'Whether users can send recorded voice messages.', 'Ob Nutzer aufgezeichnete Sprachnachrichten senden können.'
  UNION ALL SELECT 'messaging', 'calls_media', 'file_sharing', 'File sharing', 'Dateifreigabe', 'boolean', 'beneficial', 'optional', 7050, 'Whether users can share files in chats.', 'Ob Nutzer Dateien in Chats teilen können.'
  UNION ALL SELECT 'messaging', 'calls_media', 'media_size_limit_mb', 'Media/file size limit (MB)', 'Medien-/Dateigrößenlimit (MB)', 'number', 'informational', 'range', 7060, 'Documented maximum upload or transfer size in megabytes.', 'Dokumentierte maximale Upload- oder Übertragungsgröße in Megabyte.'
  UNION ALL SELECT 'messaging', 'backup_export', 'backup_model', 'Backup model', 'Backup-Modell', 'enum', 'tradeoff', 'optional', 8010, 'How chat history and key recovery are backed up, if at all.', 'Wie Chatverlauf und Schlüsselwiederherstellung gesichert werden, falls überhaupt.'
  UNION ALL SELECT 'messaging', 'backup_export', 'encrypted_backup_available', 'Encrypted backup available', 'Verschlüsseltes Backup verfügbar', 'boolean', 'beneficial', 'optional', 8020, 'Whether backups can be encrypted before storage or upload.', 'Ob Backups vor Speicherung oder Upload verschlüsselt werden können.'
  UNION ALL SELECT 'messaging', 'backup_export', 'chat_export_available', 'Chat export available', 'Chat-Export verfügbar', 'boolean', 'beneficial', 'optional', 8030, 'Whether users can export chat history in a documented way.', 'Ob Nutzer Chatverläufe dokumentiert exportieren können.'
  UNION ALL SELECT 'messaging', 'backup_export', 'account_transfer_model', 'Account transfer model', 'Modell zur Kontoübertragung', 'enum', 'tradeoff', 'optional', 8040, 'How users can move accounts, chats, or keys between devices or servers.', 'Wie Nutzer Konten, Chats oder Schlüssel zwischen Geräten oder Servern übertragen können.'
  UNION ALL SELECT 'messaging', 'interoperability_fit', 'external_interoperability', 'External interoperability', 'Externe Interoperabilität', 'multi_enum', 'tradeoff', 'multi_select', 9010, 'Documented ways to communicate with users outside the messenger native network.', 'Dokumentierte Wege zur Kommunikation mit Nutzern außerhalb des nativen Messenger-Netzwerks.'
  UNION ALL SELECT 'messaging', 'interoperability_fit', 'bot_integration_support', 'Bot/integration support', 'Bot-/Integrations-Unterstützung', 'boolean', 'tradeoff', 'optional', 9020, 'Whether bots, automation, or integration APIs are supported.', 'Ob Bots, Automatisierung oder Integrations-APIs unterstützt werden.'
  UNION ALL SELECT 'messaging', 'interoperability_fit', 'standards_based_protocol', 'Standards-based protocol', 'Standardbasiertes Protokoll', 'boolean', 'beneficial', 'optional', 9030, 'Whether the messenger is built on a recognized open standard.', 'Ob der Messenger auf einem anerkannten offenen Standard basiert.'
  UNION ALL SELECT 'messaging', 'interoperability_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'User needs the product is explicitly designed for or strongly suited to.', 'Nutzerbedürfnisse, für die das Produkt ausdrücklich entworfen oder besonders geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'messaging' AS category_id, 'supported_identifiers' AS criterion_key, 'phone_number' AS option_key, 'Phone number' AS label_en, 'Telefonnummer' AS label_de, 'warning' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'messaging', 'supported_identifiers', 'email', 'Email address', 'E-Mail-Adresse', 'neutral', 20
  UNION ALL SELECT 'messaging', 'supported_identifiers', 'username', 'Username', 'Benutzername', 'neutral', 30
  UNION ALL SELECT 'messaging', 'supported_identifiers', 'random_id', 'Random/private ID', 'Zufalls-/Privat-ID', 'positive', 40
  UNION ALL SELECT 'messaging', 'supported_identifiers', 'protocol_address', 'Protocol address', 'Protokolladresse', 'tradeoff', 50
  UNION ALL SELECT 'messaging', 'supported_identifiers', 'device_local', 'Device-local identity', 'Gerätelokale Identität', 'tradeoff', 60
  UNION ALL SELECT 'messaging', 'contact_discovery_methods', 'address_book_matching', 'Address book matching', 'Adressbuch-Abgleich', 'warning', 10
  UNION ALL SELECT 'messaging', 'contact_discovery_methods', 'username_search', 'Username search', 'Benutzernamensuche', 'neutral', 20
  UNION ALL SELECT 'messaging', 'contact_discovery_methods', 'invite_link', 'Invite links', 'Einladungslinks', 'neutral', 30
  UNION ALL SELECT 'messaging', 'contact_discovery_methods', 'qr_code', 'QR code', 'QR-Code', 'neutral', 40
  UNION ALL SELECT 'messaging', 'contact_discovery_methods', 'public_directory', 'Public directory', 'Öffentliches Verzeichnis', 'tradeoff', 50
  UNION ALL SELECT 'messaging', 'contact_discovery_methods', 'manual_id_exchange', 'Manual ID exchange', 'Manueller ID-Austausch', 'positive', 60
  UNION ALL SELECT 'messaging', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'messaging', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'messaging', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 30
  UNION ALL SELECT 'messaging', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 40
  UNION ALL SELECT 'messaging', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 50
  UNION ALL SELECT 'messaging', 'supported_platforms', 'linux', 'Linux', 'Linux', 'positive', 60
  UNION ALL SELECT 'messaging', 'supported_platforms', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 70
  UNION ALL SELECT 'messaging', 'multi_device_model', 'single_device', 'Single device', 'Einzelgerät', 'warning', 10
  UNION ALL SELECT 'messaging', 'multi_device_model', 'linked_devices', 'Linked devices', 'Verknüpfte Geräte', 'neutral', 20
  UNION ALL SELECT 'messaging', 'multi_device_model', 'full_sync', 'Full multi-device sync', 'Vollständige Mehrgeräte-Synchronisierung', 'positive', 30
  UNION ALL SELECT 'messaging', 'multi_device_model', 'device_independent', 'Device-independent account', 'Geräteunabhängiges Konto', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'push_delivery_model', 'platform_push', 'Platform push service', 'Plattform-Pushdienst', 'neutral', 10
  UNION ALL SELECT 'messaging', 'push_delivery_model', 'vendor_push_proxy', 'Vendor push proxy', 'Anbieter-Pushproxy', 'tradeoff', 20
  UNION ALL SELECT 'messaging', 'push_delivery_model', 'self_hostable_push', 'Self-hostable push', 'Selbsthostbarer Push', 'positive', 30
  UNION ALL SELECT 'messaging', 'push_delivery_model', 'local_polling', 'Local polling/no push', 'Lokales Polling/kein Push', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'metadata_protection_level', 'basic', 'Basic', 'Basis', 'neutral', 10
  UNION ALL SELECT 'messaging', 'metadata_protection_level', 'minimized', 'Minimized collection', 'Minimierte Erfassung', 'positive', 20
  UNION ALL SELECT 'messaging', 'metadata_protection_level', 'private_routing', 'Private routing/sealed sender', 'Privates Routing/Sealed Sender', 'positive', 30
  UNION ALL SELECT 'messaging', 'metadata_protection_level', 'p2p_or_local', 'Peer-to-peer/local-first', 'Peer-to-peer/lokal zuerst', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'screenshot_or_forwarding_controls', 'screenshot_warning', 'Screenshot warning', 'Screenshot-Warnung', 'neutral', 10
  UNION ALL SELECT 'messaging', 'screenshot_or_forwarding_controls', 'screenshot_blocking', 'Screenshot blocking', 'Screenshot-Sperre', 'tradeoff', 20
  UNION ALL SELECT 'messaging', 'screenshot_or_forwarding_controls', 'forwarding_limits', 'Forwarding limits', 'Weiterleitungsgrenzen', 'neutral', 30
  UNION ALL SELECT 'messaging', 'screenshot_or_forwarding_controls', 'download_restrictions', 'Download restrictions', 'Download-Beschränkungen', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'network_architecture', 'centralized', 'Centralized', 'Zentralisiert', 'neutral', 10
  UNION ALL SELECT 'messaging', 'network_architecture', 'federated', 'Federated', 'Föderiert', 'positive', 20
  UNION ALL SELECT 'messaging', 'network_architecture', 'peer_to_peer', 'Peer-to-peer', 'Peer-to-peer', 'tradeoff', 30
  UNION ALL SELECT 'messaging', 'network_architecture', 'local_mesh', 'Local mesh', 'Lokales Mesh', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'network_architecture', 'email_based', 'Email-based', 'E-Mail-basiert', 'tradeoff', 50
  UNION ALL SELECT 'messaging', 'server_side_components', 'hosted_service', 'Hosted service', 'Gehosteter Dienst', 'neutral', 10
  UNION ALL SELECT 'messaging', 'server_side_components', 'self_hostable_server', 'Self-hostable server', 'Selbsthostbarer Server', 'positive', 20
  UNION ALL SELECT 'messaging', 'server_side_components', 'relay_server', 'Relay server', 'Relay-Server', 'tradeoff', 30
  UNION ALL SELECT 'messaging', 'server_side_components', 'no_central_server', 'No central server', 'Kein zentraler Server', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'message_deletion', 'local_only', 'Local only', 'Nur lokal', 'warning', 10
  UNION ALL SELECT 'messaging', 'message_deletion', 'sender_recall', 'Sender recall', 'Rückruf durch Absender', 'neutral', 20
  UNION ALL SELECT 'messaging', 'message_deletion', 'everyone_with_timer', 'For everyone with timer/window', 'Für alle mit Zeitfenster', 'positive', 30
  UNION ALL SELECT 'messaging', 'message_deletion', 'admin_moderated', 'Admin/moderator removal', 'Admin-/Moderator-Löschung', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'reactions_threads', 'reactions', 'Reactions', 'Reaktionen', 'neutral', 10
  UNION ALL SELECT 'messaging', 'reactions_threads', 'replies', 'Replies', 'Antworten', 'neutral', 20
  UNION ALL SELECT 'messaging', 'reactions_threads', 'threads', 'Threads', 'Threads', 'neutral', 30
  UNION ALL SELECT 'messaging', 'reactions_threads', 'quotes', 'Quote replies', 'Zitatantworten', 'neutral', 40
  UNION ALL SELECT 'messaging', 'scheduled_or_pinned_messages', 'scheduled_send', 'Scheduled send', 'Geplantes Senden', 'neutral', 10
  UNION ALL SELECT 'messaging', 'scheduled_or_pinned_messages', 'pinned_messages', 'Pinned messages', 'Angepinnte Nachrichten', 'neutral', 20
  UNION ALL SELECT 'messaging', 'scheduled_or_pinned_messages', 'bookmarks_saved', 'Bookmarks/saved messages', 'Lesezeichen/gespeicherte Nachrichten', 'neutral', 30
  UNION ALL SELECT 'messaging', 'group_admin_tools', 'roles_permissions', 'Roles/permissions', 'Rollen/Berechtigungen', 'positive', 10
  UNION ALL SELECT 'messaging', 'group_admin_tools', 'member_ban', 'Member removal/ban', 'Mitglieder entfernen/sperren', 'positive', 20
  UNION ALL SELECT 'messaging', 'group_admin_tools', 'join_approval', 'Join approval', 'Beitrittsfreigabe', 'positive', 30
  UNION ALL SELECT 'messaging', 'group_admin_tools', 'invite_links', 'Invite links', 'Einladungslinks', 'neutral', 40
  UNION ALL SELECT 'messaging', 'group_admin_tools', 'moderation_log', 'Moderation log', 'Moderationsprotokoll', 'positive', 50
  UNION ALL SELECT 'messaging', 'community_discovery', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'messaging', 'community_discovery', 'invite_only', 'Invite-only', 'Nur Einladung', 'neutral', 20
  UNION ALL SELECT 'messaging', 'community_discovery', 'searchable_public', 'Searchable public spaces', 'Durchsuchbare öffentliche Bereiche', 'tradeoff', 30
  UNION ALL SELECT 'messaging', 'community_discovery', 'curated_directory', 'Curated directory', 'Kuratiertes Verzeichnis', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'backup_model', 'none', 'No backup', 'Kein Backup', 'warning', 10
  UNION ALL SELECT 'messaging', 'backup_model', 'local_only', 'Local backup only', 'Nur lokales Backup', 'tradeoff', 20
  UNION ALL SELECT 'messaging', 'backup_model', 'user_encrypted_cloud', 'User-controlled encrypted cloud backup', 'Nutzerkontrolliertes verschlüsseltes Cloud-Backup', 'positive', 30
  UNION ALL SELECT 'messaging', 'backup_model', 'provider_cloud', 'Provider cloud backup', 'Anbieter-Cloud-Backup', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'backup_model', 'platform_backup', 'Platform backup dependent', 'Plattform-Backup abhängig', 'warning', 50
  UNION ALL SELECT 'messaging', 'account_transfer_model', 'unsupported', 'Unsupported', 'Nicht unterstützt', 'warning', 10
  UNION ALL SELECT 'messaging', 'account_transfer_model', 'same_account_only', 'Same account only', 'Nur dasselbe Konto', 'neutral', 20
  UNION ALL SELECT 'messaging', 'account_transfer_model', 'device_to_device', 'Device-to-device transfer', 'Gerät-zu-Gerät-Transfer', 'positive', 30
  UNION ALL SELECT 'messaging', 'account_transfer_model', 'cross_server', 'Cross-server/account migration', 'Server-/kontoübergreifende Migration', 'positive', 40
  UNION ALL SELECT 'messaging', 'external_interoperability', 'same_network_only', 'Same network only', 'Nur eigenes Netzwerk', 'neutral', 10
  UNION ALL SELECT 'messaging', 'external_interoperability', 'federation', 'Federation', 'Föderation', 'positive', 20
  UNION ALL SELECT 'messaging', 'external_interoperability', 'bridges', 'Bridges', 'Bridges', 'tradeoff', 30
  UNION ALL SELECT 'messaging', 'external_interoperability', 'email_gateway', 'Email gateway', 'E-Mail-Gateway', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'external_interoperability', 'sms_gateway', 'SMS gateway', 'SMS-Gateway', 'warning', 50
  UNION ALL SELECT 'messaging', 'external_interoperability', 'regulated_interop', 'Regulated interoperability', 'Regulierte Interoperabilität', 'tradeoff', 60
  UNION ALL SELECT 'messaging', 'fit_profiles', 'friends_family', 'Friends and family', 'Freunde und Familie', 'neutral', 10
  UNION ALL SELECT 'messaging', 'fit_profiles', 'privacy_sensitive', 'Privacy-sensitive everyday use', 'Datenschutzsensibler Alltag', 'positive', 20
  UNION ALL SELECT 'messaging', 'fit_profiles', 'activists_journalists', 'Activists or journalists', 'Aktivisten oder Journalisten', 'tradeoff', 30
  UNION ALL SELECT 'messaging', 'fit_profiles', 'communities', 'Public communities', 'Öffentliche Communities', 'tradeoff', 40
  UNION ALL SELECT 'messaging', 'fit_profiles', 'workplace', 'Workplace/team chat', 'Arbeitsplatz/Teamchat', 'neutral', 50
  UNION ALL SELECT 'messaging', 'fit_profiles', 'self_hosters', 'Self-hosters', 'Selbsthoster', 'tradeoff', 60
  UNION ALL SELECT 'messaging', 'fit_profiles', 'low_connectivity', 'Low-connectivity/offline use', 'Schlechte Verbindung/Offline-Nutzung', 'tradeoff', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'messaging'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'messaging'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('006-messaging-matrix-criteria');
