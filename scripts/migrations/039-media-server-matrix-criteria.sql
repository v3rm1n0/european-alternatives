-- Migration 039: Define Media Server category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('media-server', 'library_media_support', 'Library & Media Support', 'Bibliothek & Medienunterstuetzung', 'Media type support, metadata fetching, file format compatibility, and library organization.', 'Medientyp-Unterstuetzung, Metadatenabruf, Dateiformatkompatibilitaet und Bibliotheksorganisation.', 100),
  ('media-server', 'transcoding_playback', 'Transcoding & Playback', 'Transkodierung & Wiedergabe', 'Real-time transcoding capabilities, hardware acceleration, HDR handling, and streaming quality.', 'Echtzeit-Transkodierungsfaehigkeiten, Hardwarebeschleunigung, HDR-Verarbeitung und Streaming-Qualitaet.', 200),
  ('media-server', 'client_apps_devices', 'Client Apps & Devices', 'Client-Apps & Geraete', 'Available client applications, supported platforms, smart TV apps, and casting protocols.', 'Verfuegbare Client-Anwendungen, unterstuetzte Plattformen, Smart-TV-Apps und Casting-Protokolle.', 300),
  ('media-server', 'user_management', 'User Management', 'Benutzerverwaltung', 'Multi-user support, user profiles, parental controls, and library sharing capabilities.', 'Mehrbenutzerbetrieb, Benutzerprofile, Kindersicherung und Bibliotheksfreigabe-Funktionen.', 400),
  ('media-server', 'live_tv_dvr', 'Live TV & DVR', 'Live-TV & DVR', 'Live television streaming, TV tuner integration, program guide, and recording features.', 'Live-Fernsehstreaming, TV-Tuner-Integration, Programmfuehrer und Aufnahmefunktionen.', 500),
  ('media-server', 'privacy_data', 'Privacy & Data', 'Privatsphaere & Daten', 'Account requirements, telemetry policies, data processing location, and phone-home behavior.', 'Kontoanforderungen, Telemetrie-Richtlinien, Datenverarbeitungsstandort und Nachhausetelefonieren-Verhalten.', 600),
  ('media-server', 'openness_extensibility', 'Openness & Extensibility', 'Offenheit & Erweiterbarkeit', 'Source code availability, licensing terms, plugin ecosystem, and API access.', 'Quellcode-Verfuegbarkeit, Lizenzbedingungen, Plugin-Oekosystem und API-Zugang.', 700),
  ('media-server', 'deployment_hosting', 'Deployment & Hosting', 'Bereitstellung & Hosting', 'Installation methods, Docker support, NAS compatibility, and hardware requirements.', 'Installationsmethoden, Docker-Unterstuetzung, NAS-Kompatibilitaet und Hardwareanforderungen.', 800),
  ('media-server', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing structure, free tier availability, paid feature scope, and target audience fit.', 'Preisstruktur, Verfuegbarkeit kostenloser Versionen, Umfang kostenpflichtiger Funktionen und Zielgruppeneignung.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'media-server' AS category_id, 'library_media_support' AS group_key, 'supported_media_types' AS criterion_key, 'Supported media types' AS label_en, 'Unterstuetzte Medientypen' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'The types of media content the server can organize and stream.' AS help_text_en, 'Die Arten von Medieninhalten, die der Server organisieren und streamen kann.' AS help_text_de
  UNION ALL SELECT 'media-server', 'library_media_support', 'metadata_provider_support', 'Metadata provider support', 'Metadatenanbieter-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 1020, 'External metadata services the server can query for media information and artwork.', 'Externe Metadaten-Dienste, die der Server fuer Medieninformationen und Artwork abfragen kann.'
  UNION ALL SELECT 'media-server', 'library_media_support', 'automatic_metadata_fetching', 'Automatic metadata fetching', 'Automatischer Metadatenabruf', 'boolean', 'beneficial', 'optional', 1030, 'Whether the server automatically downloads metadata, artwork, and descriptions for media files.', 'Ob der Server automatisch Metadaten, Artwork und Beschreibungen fuer Mediendateien abruft.'
  UNION ALL SELECT 'media-server', 'library_media_support', 'supported_file_formats', 'Supported file formats', 'Unterstuetzte Dateiformate', 'enum', 'informational', 'optional', 1040, 'The breadth of audio and video file formats the server can handle without conversion.', 'Die Bandbreite der Audio- und Videodateiformate, die der Server ohne Konvertierung verarbeiten kann.'
  UNION ALL SELECT 'media-server', 'library_media_support', 'subtitle_support', 'Subtitle support', 'Untertitel-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 1050, 'The subtitle formats and integrations supported for playback.', 'Die unterstuetzten Untertitelformate und Integrationen fuer die Wiedergabe.'
  UNION ALL SELECT 'media-server', 'library_media_support', 'library_organization', 'Library organization model', 'Bibliotheksorganisationsmodell', 'enum', 'informational', 'optional', 1060, 'How the server discovers and organizes media files into browsable libraries.', 'Wie der Server Mediendateien erkennt und in durchsuchbare Bibliotheken organisiert.'
  UNION ALL SELECT 'media-server', 'transcoding_playback', 'realtime_transcoding', 'Real-time transcoding', 'Echtzeit-Transkodierung', 'boolean', 'beneficial', 'must_match', 2010, 'Whether the server can transcode media on-the-fly to match client device capabilities.', 'Ob der Server Medien in Echtzeit transkodieren kann, um sie an die Faehigkeiten des Client-Geraets anzupassen.'
  UNION ALL SELECT 'media-server', 'transcoding_playback', 'hardware_acceleration', 'Hardware acceleration support', 'Hardwarebeschleunigung', 'multi_enum', 'beneficial', 'multi_select', 2020, 'The hardware acceleration technologies supported for faster media transcoding.', 'Die unterstuetzten Hardwarebeschleunigungstechnologien fuer schnellere Medientranskodierung.'
  UNION ALL SELECT 'media-server', 'transcoding_playback', 'hdr_support', 'HDR support', 'HDR-Unterstuetzung', 'boolean', 'informational', 'optional', 2030, 'Whether the server can handle HDR content and tone-map for non-HDR displays.', 'Ob der Server HDR-Inhalte verarbeiten und Tone-Mapping fuer Nicht-HDR-Bildschirme durchfuehren kann.'
  UNION ALL SELECT 'media-server', 'transcoding_playback', 'direct_play', 'Direct play / direct stream', 'Direktwiedergabe / Direct Stream', 'boolean', 'beneficial', 'optional', 2040, 'Whether the server can stream media directly without transcoding when the client supports the format.', 'Ob der Server Medien direkt ohne Transkodierung streamen kann, wenn der Client das Format unterstuetzt.'
  UNION ALL SELECT 'media-server', 'transcoding_playback', 'max_streaming_quality', 'Maximum streaming quality', 'Maximale Streaming-Qualitaet', 'enum', 'informational', 'optional', 2050, 'The maximum video resolution the server supports for streaming.', 'Die maximale Videoaufloesung, die der Server beim Streaming unterstuetzt.'
  UNION ALL SELECT 'media-server', 'transcoding_playback', 'offline_sync', 'Offline sync / download', 'Offline-Synchronisation / Download', 'boolean', 'beneficial', 'optional', 2060, 'Whether the server allows downloading media to client devices for offline playback.', 'Ob der Server das Herunterladen von Medien auf Client-Geraete fuer die Offline-Wiedergabe erlaubt.'
  UNION ALL SELECT 'media-server', 'client_apps_devices', 'supported_client_platforms', 'Supported client platforms', 'Unterstuetzte Client-Plattformen', 'multi_enum', 'informational', 'multi_select', 3010, 'The operating systems and platforms that have dedicated client apps for this server.', 'Die Betriebssysteme und Plattformen, die dedizierte Client-Apps fuer diesen Server haben.'
  UNION ALL SELECT 'media-server', 'client_apps_devices', 'web_player_available', 'Web player available', 'Webplayer verfuegbar', 'boolean', 'beneficial', 'optional', 3020, 'Whether the server provides a built-in web-based player accessible from any browser.', 'Ob der Server einen integrierten webbasierten Player bietet, der ueber jeden Browser zugaenglich ist.'
  UNION ALL SELECT 'media-server', 'client_apps_devices', 'smart_tv_support', 'Smart TV support', 'Smart-TV-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 3030, 'The smart TV platforms that have native apps for this media server.', 'Die Smart-TV-Plattformen, die native Apps fuer diesen Medienserver haben.'
  UNION ALL SELECT 'media-server', 'client_apps_devices', 'dlna_upnp_support', 'DLNA / UPnP support', 'DLNA / UPnP-Unterstuetzung', 'boolean', 'informational', 'optional', 3040, 'Whether the server supports DLNA or UPnP protocols for network media sharing.', 'Ob der Server DLNA- oder UPnP-Protokolle fuer die Netzwerk-Medienfreigabe unterstuetzt.'
  UNION ALL SELECT 'media-server', 'client_apps_devices', 'chromecast_support', 'Chromecast support', 'Chromecast-Unterstuetzung', 'boolean', 'informational', 'optional', 3050, 'Whether the server supports casting media to Chromecast devices.', 'Ob der Server das Streamen von Medien auf Chromecast-Geraete unterstuetzt.'
  UNION ALL SELECT 'media-server', 'client_apps_devices', 'remote_access', 'Remote access', 'Fernzugriff', 'enum', 'tradeoff', 'optional', 3060, 'How the server enables access from outside the local network.', 'Wie der Server den Zugriff von ausserhalb des lokalen Netzwerks ermoeglicht.'
  UNION ALL SELECT 'media-server', 'user_management', 'multi_user_support', 'Multi-user support', 'Mehrbenutzer-Unterstuetzung', 'boolean', 'beneficial', 'must_match', 4010, 'Whether the server supports multiple user accounts with separate libraries and settings.', 'Ob der Server mehrere Benutzerkonten mit separaten Bibliotheken und Einstellungen unterstuetzt.'
  UNION ALL SELECT 'media-server', 'user_management', 'user_profiles', 'User profiles', 'Benutzerprofile', 'boolean', 'beneficial', 'optional', 4020, 'Whether individual users can have personalized profiles with their own watch history and preferences.', 'Ob einzelne Benutzer personalisierte Profile mit eigenem Wiedergabeverlauf und eigenen Voreinstellungen haben koennen.'
  UNION ALL SELECT 'media-server', 'user_management', 'parental_controls', 'Parental controls', 'Kindersicherung', 'boolean', 'informational', 'optional', 4030, 'Whether the server offers content filtering or access restrictions for child accounts.', 'Ob der Server Inhaltsfilterung oder Zugriffsbeschraenkungen fuer Kinderkonten bietet.'
  UNION ALL SELECT 'media-server', 'user_management', 'library_sharing', 'Library sharing model', 'Bibliotheksfreigabemodell', 'enum', 'tradeoff', 'optional', 4040, 'How the server allows sharing media libraries with other users.', 'Wie der Server die Freigabe von Medienbibliotheken an andere Benutzer ermoeglicht.'
  UNION ALL SELECT 'media-server', 'user_management', 'watch_history_tracking', 'Watch history tracking', 'Wiedergabeverlauf-Verfolgung', 'boolean', 'informational', 'optional', 4050, 'Whether the server tracks watch progress and history across devices.', 'Ob der Server den Wiedergabefortschritt und die Historie ueber verschiedene Geraete hinweg verfolgt.'
  UNION ALL SELECT 'media-server', 'live_tv_dvr', 'live_tv_support', 'Live TV support', 'Live-TV-Unterstuetzung', 'boolean', 'informational', 'optional', 5010, 'Whether the server can stream live television channels.', 'Ob der Server Live-Fernsehkanaele streamen kann.'
  UNION ALL SELECT 'media-server', 'live_tv_dvr', 'tv_tuner_support', 'TV tuner support', 'TV-Tuner-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 5020, 'The TV tuner hardware and IPTV input methods supported by the server.', 'Die vom Server unterstuetzten TV-Tuner-Hardware und IPTV-Eingabemethoden.'
  UNION ALL SELECT 'media-server', 'live_tv_dvr', 'epg_guide', 'Electronic program guide (EPG)', 'Elektronischer Programmfuehrer (EPG)', 'boolean', 'informational', 'optional', 5030, 'Whether the server provides an electronic program guide for browsing scheduled TV content.', 'Ob der Server einen elektronischen Programmfuehrer zum Durchsuchen geplanter TV-Inhalte bietet.'
  UNION ALL SELECT 'media-server', 'live_tv_dvr', 'dvr_recording', 'DVR recording', 'DVR-Aufnahme', 'boolean', 'informational', 'optional', 5040, 'Whether the server can record live TV programs for later viewing.', 'Ob der Server Live-TV-Sendungen fuer spaeteres Ansehen aufzeichnen kann.'
  UNION ALL SELECT 'media-server', 'privacy_data', 'account_requirement', 'Account requirement', 'Kontoanforderung', 'enum', 'risk', 'optional', 6010, 'Whether the server requires creating an account to use its features.', 'Ob der Server die Erstellung eines Kontos fuer die Nutzung seiner Funktionen erfordert.'
  UNION ALL SELECT 'media-server', 'privacy_data', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 6020, 'How the server handles collection and transmission of usage data.', 'Wie der Server die Erfassung und Uebermittlung von Nutzungsdaten handhabt.'
  UNION ALL SELECT 'media-server', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 6030, 'Where media metadata and user data are processed and stored.', 'Wo Medienmetadaten und Benutzerdaten verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'media-server', 'privacy_data', 'phone_home_behavior', 'Phone-home behavior', 'Nachhausetelefonieren-Verhalten', 'enum', 'risk', 'optional', 6040, 'Whether the server contacts external servers during normal operation.', 'Ob der Server im Normalbetrieb externe Server kontaktiert.'
  UNION ALL SELECT 'media-server', 'privacy_data', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 6050, 'Whether user data and media metadata can be exported in a portable format.', 'Ob Benutzerdaten und Medienmetadaten in einem portablen Format exportiert werden koennen.'
  UNION ALL SELECT 'media-server', 'openness_extensibility', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'The openness of the server source code and its availability to the public.', 'Die Offenheit des Server-Quellcodes und seine oeffentliche Verfuegbarkeit.'
  UNION ALL SELECT 'media-server', 'openness_extensibility', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7020, 'The software license under which the server is distributed.', 'Die Softwarelizenz, unter der der Server vertrieben wird.'
  UNION ALL SELECT 'media-server', 'openness_extensibility', 'plugin_system', 'Plugin / add-on system', 'Plugin- / Add-on-System', 'boolean', 'beneficial', 'optional', 7030, 'Whether the server supports extending functionality through plugins or add-ons.', 'Ob der Server die Erweiterung der Funktionalitaet durch Plugins oder Add-ons unterstuetzt.'
  UNION ALL SELECT 'media-server', 'openness_extensibility', 'api_available', 'API available', 'API verfuegbar', 'boolean', 'beneficial', 'optional', 7040, 'Whether the server exposes a documented API for third-party integration.', 'Ob der Server eine dokumentierte API fuer Drittanbieter-Integration bereitstellt.'
  UNION ALL SELECT 'media-server', 'openness_extensibility', 'community_ecosystem', 'Community ecosystem', 'Community-Oekosystem', 'enum', 'informational', 'optional', 7050, 'The size and activity level of the community around the server project.', 'Die Groesse und Aktivitaet der Community rund um das Server-Projekt.'
  UNION ALL SELECT 'media-server', 'deployment_hosting', 'deployment_model', 'Deployment model', 'Bereitstellungsmodell', 'multi_enum', 'informational', 'multi_select', 8010, 'The installation and deployment methods available for the server.', 'Die verfuegbaren Installations- und Bereitstellungsmethoden fuer den Server.'
  UNION ALL SELECT 'media-server', 'deployment_hosting', 'docker_support', 'Docker support', 'Docker-Unterstuetzung', 'boolean', 'beneficial', 'optional', 8020, 'Whether an official or well-maintained Docker image is available for the server.', 'Ob ein offizielles oder gut gepflegtes Docker-Image fuer den Server verfuegbar ist.'
  UNION ALL SELECT 'media-server', 'deployment_hosting', 'nas_compatibility', 'NAS compatibility', 'NAS-Kompatibilitaet', 'multi_enum', 'informational', 'multi_select', 8030, 'The NAS platforms that officially support running this media server.', 'Die NAS-Plattformen, die den Betrieb dieses Medienservers offiziell unterstuetzen.'
  UNION ALL SELECT 'media-server', 'deployment_hosting', 'minimum_hardware_requirements', 'Minimum hardware requirements', 'Minimale Hardwareanforderungen', 'enum', 'informational', 'optional', 8040, 'The minimum hardware tier needed to run the server for basic media streaming.', 'Die minimale Hardware-Klasse, die fuer grundlegendes Medienstreaming mit dem Server erforderlich ist.'
  UNION ALL SELECT 'media-server', 'deployment_hosting', 'reverse_proxy_support', 'Reverse proxy support', 'Reverse-Proxy-Unterstuetzung', 'boolean', 'informational', 'optional', 8050, 'Whether the server works correctly behind a reverse proxy for secure remote access.', 'Ob der Server hinter einem Reverse-Proxy fuer sicheren Fernzugriff korrekt funktioniert.'
  UNION ALL SELECT 'media-server', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'The pricing structure of the server software and any associated services.', 'Die Preisstruktur der Server-Software und der zugehoerigen Dienste.'
  UNION ALL SELECT 'media-server', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfuegbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a fully functional free version of the server is available.', 'Ob eine voll funktionsfaehige kostenlose Version des Servers verfuegbar ist.'
  UNION ALL SELECT 'media-server', 'pricing_fit', 'paid_features_scope', 'Paid features scope', 'Umfang kostenpflichtiger Funktionen', 'enum', 'tradeoff', 'optional', 9030, 'How much core functionality is restricted to paid plans or premium tiers.', 'Wie viel Kernfunktionalitaet auf kostenpflichtige Plaene oder Premium-Stufen beschraenkt ist.'
  UNION ALL SELECT 'media-server', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Target audience profiles the media server is best suited for.', 'Zielgruppenprofile, fuer die der Medienserver am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'media-server' AS category_id, 'supported_media_types' AS criterion_key, 'movies' AS option_key, 'Movies' AS label_en, 'Filme' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'media-server', 'supported_media_types', 'tv_shows', 'TV shows', 'TV-Serien', 'neutral', 20
  UNION ALL SELECT 'media-server', 'supported_media_types', 'music', 'Music', 'Musik', 'neutral', 30
  UNION ALL SELECT 'media-server', 'supported_media_types', 'photos', 'Photos', 'Fotos', 'neutral', 40
  UNION ALL SELECT 'media-server', 'supported_media_types', 'audiobooks', 'Audiobooks', 'Hoerbuecher', 'neutral', 50
  UNION ALL SELECT 'media-server', 'supported_media_types', 'ebooks', 'E-books', 'E-Books', 'neutral', 60
  UNION ALL SELECT 'media-server', 'metadata_provider_support', 'tmdb', 'TMDb', 'TMDb', 'neutral', 10
  UNION ALL SELECT 'media-server', 'metadata_provider_support', 'tvdb', 'TheTVDB', 'TheTVDB', 'neutral', 20
  UNION ALL SELECT 'media-server', 'metadata_provider_support', 'imdb', 'IMDb', 'IMDb', 'neutral', 30
  UNION ALL SELECT 'media-server', 'metadata_provider_support', 'musicbrainz', 'MusicBrainz', 'MusicBrainz', 'neutral', 40
  UNION ALL SELECT 'media-server', 'metadata_provider_support', 'fanart_tv', 'Fanart.tv', 'Fanart.tv', 'neutral', 50
  UNION ALL SELECT 'media-server', 'metadata_provider_support', 'custom_provider', 'Custom provider', 'Benutzerdefinierter Anbieter', 'neutral', 60
  UNION ALL SELECT 'media-server', 'supported_file_formats', 'very_broad', 'Very broad (50+ formats)', 'Sehr breit (50+ Formate)', 'neutral', 10
  UNION ALL SELECT 'media-server', 'supported_file_formats', 'broad', 'Broad (20-50 formats)', 'Breit (20-50 Formate)', 'neutral', 20
  UNION ALL SELECT 'media-server', 'supported_file_formats', 'moderate', 'Moderate (10-20 formats)', 'Maessig (10-20 Formate)', 'neutral', 30
  UNION ALL SELECT 'media-server', 'supported_file_formats', 'limited', 'Limited (fewer than 10)', 'Begrenzt (weniger als 10)', 'neutral', 40
  UNION ALL SELECT 'media-server', 'subtitle_support', 'srt', 'SRT', 'SRT', 'neutral', 10
  UNION ALL SELECT 'media-server', 'subtitle_support', 'ass_ssa', 'ASS / SSA', 'ASS / SSA', 'neutral', 20
  UNION ALL SELECT 'media-server', 'subtitle_support', 'vobsub', 'VobSub', 'VobSub', 'neutral', 30
  UNION ALL SELECT 'media-server', 'subtitle_support', 'pgs', 'PGS', 'PGS', 'neutral', 40
  UNION ALL SELECT 'media-server', 'subtitle_support', 'embedded_mkv', 'Embedded MKV', 'Eingebettet in MKV', 'neutral', 50
  UNION ALL SELECT 'media-server', 'subtitle_support', 'opensubtitles_integration', 'OpenSubtitles integration', 'OpenSubtitles-Integration', 'neutral', 60
  UNION ALL SELECT 'media-server', 'library_organization', 'automatic_scan', 'Automatic scan', 'Automatischer Scan', 'neutral', 10
  UNION ALL SELECT 'media-server', 'library_organization', 'manual_curated', 'Manual / curated', 'Manuell / kuratiert', 'neutral', 20
  UNION ALL SELECT 'media-server', 'library_organization', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'media-server', 'hardware_acceleration', 'nvidia_nvenc', 'NVIDIA NVENC', 'NVIDIA NVENC', 'neutral', 10
  UNION ALL SELECT 'media-server', 'hardware_acceleration', 'intel_quicksync', 'Intel Quick Sync', 'Intel Quick Sync', 'neutral', 20
  UNION ALL SELECT 'media-server', 'hardware_acceleration', 'amd_amf', 'AMD AMF', 'AMD AMF', 'neutral', 30
  UNION ALL SELECT 'media-server', 'hardware_acceleration', 'vaapi', 'VA-API', 'VA-API', 'neutral', 40
  UNION ALL SELECT 'media-server', 'hardware_acceleration', 'videotoolbox', 'VideoToolbox', 'VideoToolbox', 'neutral', 50
  UNION ALL SELECT 'media-server', 'hardware_acceleration', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 60
  UNION ALL SELECT 'media-server', 'max_streaming_quality', 'uhd_4k', 'UHD 4K', 'UHD 4K', 'neutral', 10
  UNION ALL SELECT 'media-server', 'max_streaming_quality', 'hd_1080p', 'HD 1080p', 'HD 1080p', 'neutral', 20
  UNION ALL SELECT 'media-server', 'max_streaming_quality', 'hd_720p', 'HD 720p', 'HD 720p', 'neutral', 30
  UNION ALL SELECT 'media-server', 'max_streaming_quality', 'sd', 'SD', 'SD', 'neutral', 40
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'windows', 'Windows', 'Windows', 'neutral', 30
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'macos', 'macOS', 'macOS', 'neutral', 40
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'linux', 'Linux', 'Linux', 'neutral', 50
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'android_tv', 'Android TV', 'Android TV', 'neutral', 70
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'apple_tv', 'Apple TV', 'Apple TV', 'neutral', 80
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'fire_tv', 'Fire TV', 'Fire TV', 'neutral', 90
  UNION ALL SELECT 'media-server', 'supported_client_platforms', 'roku', 'Roku', 'Roku', 'neutral', 100
  UNION ALL SELECT 'media-server', 'smart_tv_support', 'samsung_tizen', 'Samsung Tizen', 'Samsung Tizen', 'neutral', 10
  UNION ALL SELECT 'media-server', 'smart_tv_support', 'lg_webos', 'LG webOS', 'LG webOS', 'neutral', 20
  UNION ALL SELECT 'media-server', 'smart_tv_support', 'android_tv', 'Android TV', 'Android TV', 'neutral', 30
  UNION ALL SELECT 'media-server', 'smart_tv_support', 'apple_tv', 'Apple TV', 'Apple TV', 'neutral', 40
  UNION ALL SELECT 'media-server', 'smart_tv_support', 'fire_tv', 'Fire TV', 'Fire TV', 'neutral', 50
  UNION ALL SELECT 'media-server', 'smart_tv_support', 'roku', 'Roku', 'Roku', 'neutral', 60
  UNION ALL SELECT 'media-server', 'smart_tv_support', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 70
  UNION ALL SELECT 'media-server', 'remote_access', 'built_in', 'Built-in', 'Integriert', 'neutral', 10
  UNION ALL SELECT 'media-server', 'remote_access', 'via_third_party_relay', 'Via third-party relay', 'Ueber Drittanbieter-Relay', 'neutral', 20
  UNION ALL SELECT 'media-server', 'remote_access', 'manual_port_forward', 'Manual port forward', 'Manuelle Portweiterleitung', 'neutral', 30
  UNION ALL SELECT 'media-server', 'remote_access', 'not_supported', 'Not supported', 'Nicht unterstuetzt', 'neutral', 40
  UNION ALL SELECT 'media-server', 'library_sharing', 'local_users_only', 'Local users only', 'Nur lokale Benutzer', 'neutral', 10
  UNION ALL SELECT 'media-server', 'library_sharing', 'remote_sharing', 'Remote sharing', 'Fernfreigabe', 'neutral', 20
  UNION ALL SELECT 'media-server', 'library_sharing', 'federated_sharing', 'Federated sharing', 'Foederierte Freigabe', 'neutral', 30
  UNION ALL SELECT 'media-server', 'library_sharing', 'no_sharing', 'No sharing', 'Keine Freigabe', 'neutral', 40
  UNION ALL SELECT 'media-server', 'tv_tuner_support', 'hdhomerun', 'HDHomeRun', 'HDHomeRun', 'neutral', 10
  UNION ALL SELECT 'media-server', 'tv_tuner_support', 'dvb_usb', 'DVB USB', 'DVB-USB', 'neutral', 20
  UNION ALL SELECT 'media-server', 'tv_tuner_support', 'iptv_m3u', 'IPTV / M3U', 'IPTV / M3U', 'neutral', 30
  UNION ALL SELECT 'media-server', 'tv_tuner_support', 'sat_ip', 'SAT>IP', 'SAT>IP', 'neutral', 40
  UNION ALL SELECT 'media-server', 'tv_tuner_support', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 50
  UNION ALL SELECT 'media-server', 'account_requirement', 'no_account_needed', 'No account needed', 'Kein Konto erforderlich', 'positive', 10
  UNION ALL SELECT 'media-server', 'account_requirement', 'local_account', 'Local account', 'Lokales Konto', 'neutral', 20
  UNION ALL SELECT 'media-server', 'account_requirement', 'optional_cloud_account', 'Optional cloud account', 'Optionales Cloud-Konto', 'neutral', 30
  UNION ALL SELECT 'media-server', 'account_requirement', 'mandatory_cloud_account', 'Mandatory cloud account', 'Pflicht-Cloud-Konto', 'warning', 40
  UNION ALL SELECT 'media-server', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'media-server', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'media-server', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'media-server', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'media-server', 'data_processing_location', 'local_only', 'Local only', 'Nur lokal', 'positive', 10
  UNION ALL SELECT 'media-server', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'neutral', 20
  UNION ALL SELECT 'media-server', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 30
  UNION ALL SELECT 'media-server', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 40
  UNION ALL SELECT 'media-server', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'media-server', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'media-server', 'phone_home_behavior', 'no_phone_home', 'No phone home', 'Kein Nachhausetelefonieren', 'positive', 10
  UNION ALL SELECT 'media-server', 'phone_home_behavior', 'optional_update_check', 'Optional update check', 'Optionale Aktualisierungspruefung', 'neutral', 20
  UNION ALL SELECT 'media-server', 'phone_home_behavior', 'mandatory_connection', 'Mandatory connection', 'Pflichtverbindung', 'warning', 30
  UNION ALL SELECT 'media-server', 'phone_home_behavior', 'cloud_dependent', 'Cloud-dependent', 'Cloud-abhaengig', 'warning', 40
  UNION ALL SELECT 'media-server', 'source_model', 'fully_open_source', 'Fully open source', 'Vollstaendig quelloffen', 'positive', 10
  UNION ALL SELECT 'media-server', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'media-server', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'media-server', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'media-server', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'media-server', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'media-server', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'media-server', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'media-server', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 50
  UNION ALL SELECT 'media-server', 'community_ecosystem', 'large_active', 'Large and active', 'Gross und aktiv', 'neutral', 10
  UNION ALL SELECT 'media-server', 'community_ecosystem', 'medium_active', 'Medium and active', 'Mittelgross und aktiv', 'neutral', 20
  UNION ALL SELECT 'media-server', 'community_ecosystem', 'small_niche', 'Small / niche', 'Klein / Nische', 'neutral', 30
  UNION ALL SELECT 'media-server', 'community_ecosystem', 'minimal', 'Minimal', 'Minimal', 'neutral', 40
  UNION ALL SELECT 'media-server', 'deployment_model', 'docker', 'Docker', 'Docker', 'neutral', 10
  UNION ALL SELECT 'media-server', 'deployment_model', 'bare_metal', 'Bare metal', 'Bare Metal', 'neutral', 20
  UNION ALL SELECT 'media-server', 'deployment_model', 'package_manager', 'Package manager', 'Paketmanager', 'neutral', 30
  UNION ALL SELECT 'media-server', 'deployment_model', 'snap_flatpak', 'Snap / Flatpak', 'Snap / Flatpak', 'neutral', 40
  UNION ALL SELECT 'media-server', 'deployment_model', 'windows_installer', 'Windows installer', 'Windows-Installationsprogramm', 'neutral', 50
  UNION ALL SELECT 'media-server', 'deployment_model', 'managed_cloud', 'Managed cloud', 'Verwaltete Cloud', 'neutral', 60
  UNION ALL SELECT 'media-server', 'nas_compatibility', 'synology', 'Synology', 'Synology', 'neutral', 10
  UNION ALL SELECT 'media-server', 'nas_compatibility', 'qnap', 'QNAP', 'QNAP', 'neutral', 20
  UNION ALL SELECT 'media-server', 'nas_compatibility', 'unraid', 'Unraid', 'Unraid', 'neutral', 30
  UNION ALL SELECT 'media-server', 'nas_compatibility', 'truenas', 'TrueNAS', 'TrueNAS', 'neutral', 40
  UNION ALL SELECT 'media-server', 'nas_compatibility', 'asustor', 'ASUSTOR', 'ASUSTOR', 'neutral', 50
  UNION ALL SELECT 'media-server', 'nas_compatibility', 'generic_linux', 'Generic Linux', 'Generisches Linux', 'neutral', 60
  UNION ALL SELECT 'media-server', 'minimum_hardware_requirements', 'very_low', 'Very low (RPi-class)', 'Sehr niedrig (RPi-Klasse)', 'positive', 10
  UNION ALL SELECT 'media-server', 'minimum_hardware_requirements', 'low', 'Low (entry NAS)', 'Niedrig (Einsteiger-NAS)', 'neutral', 20
  UNION ALL SELECT 'media-server', 'minimum_hardware_requirements', 'moderate', 'Moderate (mid-range)', 'Maessig (Mittelklasse)', 'neutral', 30
  UNION ALL SELECT 'media-server', 'minimum_hardware_requirements', 'high', 'High (dedicated server)', 'Hoch (dedizierter Server)', 'neutral', 40
  UNION ALL SELECT 'media-server', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'media-server', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'media-server', 'pricing_model', 'subscription_only', 'Subscription only', 'Nur Abonnement', 'neutral', 30
  UNION ALL SELECT 'media-server', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'media-server', 'pricing_model', 'donation_based', 'Donation-based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'media-server', 'paid_features_scope', 'no_paid_features', 'No paid features', 'Keine kostenpflichtigen Funktionen', 'positive', 10
  UNION ALL SELECT 'media-server', 'paid_features_scope', 'cosmetic_convenience', 'Cosmetic / convenience', 'Kosmetisch / Komfort', 'neutral', 20
  UNION ALL SELECT 'media-server', 'paid_features_scope', 'significant_features_locked', 'Significant features locked', 'Wesentliche Funktionen gesperrt', 'neutral', 30
  UNION ALL SELECT 'media-server', 'paid_features_scope', 'core_features_locked', 'Core features locked', 'Kernfunktionen gesperrt', 'warning', 40
  UNION ALL SELECT 'media-server', 'fit_profiles', 'home_media_enthusiast', 'Home media enthusiast', 'Heimmedien-Enthusiast', 'neutral', 10
  UNION ALL SELECT 'media-server', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 20
  UNION ALL SELECT 'media-server', 'fit_profiles', 'power_user', 'Power user', 'Power-Benutzer', 'neutral', 30
  UNION ALL SELECT 'media-server', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 40
  UNION ALL SELECT 'media-server', 'fit_profiles', 'music_collector', 'Music collector', 'Musiksammler', 'neutral', 50
  UNION ALL SELECT 'media-server', 'fit_profiles', 'cord_cutter', 'Cord cutter', 'Kabelabschneider', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'media-server'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'media-server'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('039-media-server-matrix-criteria');
