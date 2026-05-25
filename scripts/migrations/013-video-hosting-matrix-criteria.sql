-- Migration 013: Define Video Hosting category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('video-hosting', 'accounts_channels', 'Accounts & Channels', 'Konten & Kanaele', 'Account requirements, channel models, and creator identity controls.', 'Kontoanforderungen, Kanalmodelle und Kontrollen fuer Creator-Identitaet.', 100),
  ('video-hosting', 'upload_ingest', 'Upload & Ingest', 'Upload & Ingest', 'How videos are uploaded, imported, transcoded, and limited.', 'Wie Videos hochgeladen, importiert, transkodiert und begrenzt werden.', 200),
  ('video-hosting', 'playback_delivery', 'Playback & Delivery', 'Wiedergabe & Auslieferung', 'Player, streaming, embed, quality, download, and device support.', 'Player, Streaming, Einbettung, Qualitaet, Download und Geraeteunterstuetzung.', 300),
  ('video-hosting', 'live_streaming', 'Live Streaming', 'Livestreaming', 'Native live, RTMP ingest, scheduling, chat, latency, and archiving.', 'Native Livestreams, RTMP-Ingest, Planung, Chat, Latenz und Archivierung.', 400),
  ('video-hosting', 'discovery_engagement', 'Discovery & Engagement', 'Auffindbarkeit & Interaktion', 'Search, feeds, recommendations, comments, playlists, and viewer interaction.', 'Suche, Feeds, Empfehlungen, Kommentare, Playlists und Zuschauerinteraktion.', 500),
  ('video-hosting', 'moderation_safety', 'Moderation & Safety', 'Moderation & Sicherheit', 'Creator moderation, user reporting, copyright handling, and sensitive-content controls.', 'Creator-Moderation, Nutzermeldungen, Urheberrechtsverfahren und Kontrollen fuer sensible Inhalte.', 600),
  ('video-hosting', 'privacy_data_ads', 'Privacy, Data & Ads', 'Datenschutz, Daten & Werbung', 'Visibility, tracking, ad model, user controls, exports, and analytics.', 'Sichtbarkeit, Tracking, Anzeigenmodell, Nutzerkontrollen, Exporte und Analysen.', 700),
  ('video-hosting', 'creator_business', 'Creator & Business Tools', 'Creator- & Geschaeftswerkzeuge', 'Monetization, paid content, publishing workflow, and creator support features.', 'Monetarisierung, bezahlte Inhalte, Veroeffentlichungsablauf und Creator-Unterstuetzung.', 800),
  ('video-hosting', 'interoperability_portability', 'Interoperability & Portability', 'Interoperabilitaet & Portabilitaet', 'Federation, APIs, embeds, syndication, import, export, and migration.', 'Foederation, APIs, Einbettung, Syndikation, Import, Export und Migration.', 900),
  ('video-hosting', 'deployment_fit', 'Deployment & Fit', 'Bereitstellung & Eignung', 'Hosted or self-hosted operation, admin controls, accessibility, and user-fit profiles.', 'Gehosteter oder selbstgehosteter Betrieb, Administrationskontrollen, Barrierefreiheit und Eignungsprofile.', 1000);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'video-hosting' AS category_id, 'accounts_channels' AS group_key, 'account_required_to_watch' AS criterion_key, 'Account required to watch' AS label_en, 'Konto zum Ansehen erforderlich' AS label_de, 'boolean' AS value_type, 'risk' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Whether viewers must create or sign in to an account before watching videos.' AS help_text_en, 'Ob Zuschauer ein Konto erstellen oder sich anmelden muessen, bevor sie Videos ansehen koennen.' AS help_text_de
  UNION ALL SELECT 'video-hosting', 'accounts_channels', 'account_required_to_upload', 'Account required to upload', 'Konto zum Hochladen erforderlich', 'boolean', 'informational', 'optional', 1020, 'Whether creators must have an account before uploading or publishing videos.', 'Ob Creator ein Konto benoetigen, bevor sie Videos hochladen oder veroeffentlichen koennen.'
  UNION ALL SELECT 'video-hosting', 'accounts_channels', 'channel_profile_model', 'Channel/profile model', 'Kanal-/Profilmodell', 'enum', 'informational', 'optional', 1030, 'The documented model for creator channels, public profiles, organization channels, or instance accounts.', 'Das dokumentierte Modell fuer Creator-Kanaele, oeffentliche Profile, Organisationskanaele oder Instanzkonten.'
  UNION ALL SELECT 'video-hosting', 'accounts_channels', 'pseudonymous_channels_supported', 'Pseudonymous channels supported', 'Pseudonyme Kanaele unterstuetzt', 'boolean', 'beneficial', 'optional', 1040, 'Whether creators can publish through a channel or profile that does not require a real-name public identity.', 'Ob Creator ueber einen Kanal oder ein Profil veroeffentlichen koennen, das keine oeffentliche Klarnamenidentitaet verlangt.'
  UNION ALL SELECT 'video-hosting', 'accounts_channels', 'organization_or_brand_accounts', 'Organization/brand accounts', 'Organisations-/Markenkonten', 'boolean', 'informational', 'optional', 1050, 'Whether the platform supports channels or accounts intended for organizations, teams, or brands.', 'Ob die Plattform Kanaele oder Konten fuer Organisationen, Teams oder Marken unterstuetzt.'
  UNION ALL SELECT 'video-hosting', 'upload_ingest', 'supported_upload_methods', 'Supported upload methods', 'Unterstuetzte Upload-Methoden', 'multi_enum', 'informational', 'multi_select', 2010, 'Documented ways creators can upload, import, or ingest video content.', 'Dokumentierte Wege, wie Creator Videoinhalte hochladen, importieren oder einspeisen koennen.'
  UNION ALL SELECT 'video-hosting', 'upload_ingest', 'supported_input_formats', 'Supported input formats', 'Unterstuetzte Eingabeformate', 'multi_enum', 'informational', 'multi_select', 2020, 'Documented media input formats accepted for video or audio uploads.', 'Dokumentierte Medieneingabeformate, die fuer Video- oder Audio-Uploads akzeptiert werden.'
  UNION ALL SELECT 'video-hosting', 'upload_ingest', 'max_video_file_size_mb', 'Maximum video file size (MB)', 'Maximale Videodateigroesse (MB)', 'number', 'informational', 'range', 2030, 'Documented maximum uploaded video file size in megabytes for standard creator uploads.', 'Dokumentierte maximale hochgeladene Videodateigroesse in Megabyte fuer normale Creator-Uploads.'
  UNION ALL SELECT 'video-hosting', 'upload_ingest', 'max_video_duration_minutes', 'Maximum video duration (minutes)', 'Maximale Videolaenge (Minuten)', 'number', 'informational', 'range', 2040, 'Documented maximum video duration in minutes for standard uploads.', 'Dokumentierte maximale Videolaenge in Minuten fuer normale Uploads.'
  UNION ALL SELECT 'video-hosting', 'upload_ingest', 'storage_quota_model', 'Storage quota model', 'Speicherkontingent-Modell', 'enum', 'tradeoff', 'optional', 2050, 'How storage or upload capacity limits are documented for creator accounts or instances.', 'Wie Speicher- oder Uploadkapazitaetsgrenzen fuer Creator-Konten oder Instanzen dokumentiert sind.'
  UNION ALL SELECT 'video-hosting', 'upload_ingest', 'transcoding_delivery_model', 'Transcoding and delivery model', 'Transcoding- und Auslieferungsmodell', 'enum', 'tradeoff', 'optional', 2060, 'How the platform transcodes uploaded media and delivers playable video streams or files.', 'Wie die Plattform hochgeladene Medien transkodiert und abspielbare Videostreams oder Dateien ausliefert.'
  UNION ALL SELECT 'video-hosting', 'upload_ingest', 'thumbnail_and_metadata_tools', 'Thumbnail and metadata tools', 'Thumbnail- und Metadatenwerkzeuge', 'multi_enum', 'beneficial', 'multi_select', 2070, 'Tools creators can use to manage thumbnails, tags, chapters, scheduling, and video metadata.', 'Werkzeuge, mit denen Creator Thumbnails, Tags, Kapitel, Planung und Videometadaten verwalten koennen.'
  UNION ALL SELECT 'video-hosting', 'playback_delivery', 'embedded_player_available', 'Embedded player available', 'Eingebetteter Player verfuegbar', 'boolean', 'beneficial', 'optional', 3010, 'Whether videos can be embedded through a documented player on external sites.', 'Ob Videos ueber einen dokumentierten Player auf externen Websites eingebettet werden koennen.'
  UNION ALL SELECT 'video-hosting', 'playback_delivery', 'adaptive_streaming_available', 'Adaptive streaming available', 'Adaptives Streaming verfuegbar', 'boolean', 'beneficial', 'optional', 3020, 'Whether playback can adapt stream quality to device or network conditions.', 'Ob die Wiedergabe die Streamqualitaet an Geraet oder Netzwerkbedingungen anpassen kann.'
  UNION ALL SELECT 'video-hosting', 'playback_delivery', 'playback_quality_options', 'Playback quality options', 'Wiedergabequalitaetsoptionen', 'multi_enum', 'informational', 'multi_select', 3030, 'Documented playback resolutions, quality selectors, or quality tiers available to viewers.', 'Dokumentierte Wiedergabeaufloesungen, Qualitaetsauswahl oder Qualitaetsstufen fuer Zuschauer.'
  UNION ALL SELECT 'video-hosting', 'playback_delivery', 'player_distribution_channels', 'Player distribution channels', 'Player-Vertriebskanaele', 'multi_enum', 'informational', 'multi_select', 3040, 'Documented channels for distributing videos outside the main web player.', 'Dokumentierte Kanaele zur Verbreitung von Videos ausserhalb des primaeren Webplayers.'
  UNION ALL SELECT 'video-hosting', 'playback_delivery', 'offline_download_model', 'Offline/download model', 'Offline-/Download-Modell', 'enum', 'tradeoff', 'optional', 3050, 'How creators or viewers can download videos or use offline playback, if documented.', 'Wie Creator oder Zuschauer Videos herunterladen oder Offline-Wiedergabe nutzen koennen, sofern dokumentiert.'
  UNION ALL SELECT 'video-hosting', 'playback_delivery', 'drm_or_restricted_playback', 'DRM or restricted playback', 'DRM oder eingeschraenkte Wiedergabe', 'boolean', 'risk', 'must_match', 3060, 'Whether playback is documented as using DRM, app-only playback, or other access restrictions.', 'Ob die Wiedergabe laut Dokumentation DRM, App-Zwang oder andere Zugriffsbeschraenkungen verwendet.'
  UNION ALL SELECT 'video-hosting', 'live_streaming', 'live_streaming_model', 'Live streaming model', 'Livestreaming-Modell', 'enum', 'tradeoff', 'optional', 4010, 'How live streaming is supported, including native live, RTMP ingest, premieres, or restreaming.', 'Wie Livestreaming unterstuetzt wird, einschliesslich nativer Livestreams, RTMP-Ingest, Premieren oder Restreaming.'
  UNION ALL SELECT 'video-hosting', 'live_streaming', 'external_rtmp_ingest', 'External RTMP ingest', 'Externer RTMP-Ingest', 'boolean', 'beneficial', 'optional', 4020, 'Whether creators can send a live stream from external encoder software over RTMP.', 'Ob Creator einen Livestream aus externer Encoder-Software per RTMP einspeisen koennen.'
  UNION ALL SELECT 'video-hosting', 'live_streaming', 'scheduled_streams_or_premieres', 'Scheduled streams or premieres', 'Geplante Streams oder Premieren', 'boolean', 'informational', 'optional', 4030, 'Whether creators can schedule live streams, premieres, or planned live events.', 'Ob Creator Livestreams, Premieren oder geplante Live-Events terminieren koennen.'
  UNION ALL SELECT 'video-hosting', 'live_streaming', 'live_interaction_tools', 'Live interaction tools', 'Live-Interaktionswerkzeuge', 'multi_enum', 'informational', 'multi_select', 4040, 'Viewer interaction and moderation tools available during live streams.', 'Interaktions- und Moderationswerkzeuge fuer Zuschauer waehrend Livestreams.'
  UNION ALL SELECT 'video-hosting', 'live_streaming', 'stream_recording_archive', 'Stream recording/archive', 'Stream-Aufzeichnung/-Archiv', 'boolean', 'beneficial', 'optional', 4050, 'Whether completed live streams can be recorded, archived, or published as replay videos.', 'Ob abgeschlossene Livestreams aufgezeichnet, archiviert oder als Replay-Videos veroeffentlicht werden koennen.'
  UNION ALL SELECT 'video-hosting', 'live_streaming', 'low_latency_streaming', 'Low-latency streaming', 'Streaming mit geringer Latenz', 'boolean', 'informational', 'optional', 4060, 'Whether the platform documents low-latency or reduced-delay streaming modes.', 'Ob die Plattform Modi fuer geringe Latenz oder reduzierte Verzoegerung beim Streaming dokumentiert.'
  UNION ALL SELECT 'video-hosting', 'discovery_engagement', 'search_available', 'Search available', 'Suche verfuegbar', 'boolean', 'beneficial', 'optional', 5010, 'Whether viewers can search for videos, channels, or public media within the platform.', 'Ob Zuschauer innerhalb der Plattform nach Videos, Kanaelen oder oeffentlichen Medien suchen koennen.'
  UNION ALL SELECT 'video-hosting', 'discovery_engagement', 'discovery_feed_model', 'Discovery/feed model', 'Entdeckungs-/Feed-Modell', 'enum', 'tradeoff', 'optional', 5020, 'How the platform presents feeds, subscriptions, recommendations, or curated discovery.', 'Wie die Plattform Feeds, Abos, Empfehlungen oder kuratierte Auffindbarkeit darstellt.'
  UNION ALL SELECT 'video-hosting', 'discovery_engagement', 'recommendation_controls', 'Recommendation controls', 'Empfehlungskontrollen', 'multi_enum', 'beneficial', 'multi_select', 5030, 'Controls viewers or creators can use to influence recommendations, autoplay, history, or feeds.', 'Kontrollen, mit denen Zuschauer oder Creator Empfehlungen, Autoplay, Verlauf oder Feeds beeinflussen koennen.'
  UNION ALL SELECT 'video-hosting', 'discovery_engagement', 'interaction_features', 'Interaction features', 'Interaktionsfunktionen', 'multi_enum', 'informational', 'multi_select', 5040, 'Documented viewer interaction features such as likes, replies, shares, bookmarks, or playlists.', 'Dokumentierte Zuschauerinteraktionen wie Likes, Antworten, Teilen, Lesezeichen oder Playlists.'
  UNION ALL SELECT 'video-hosting', 'discovery_engagement', 'comment_model', 'Comment model', 'Kommentarmodell', 'enum', 'tradeoff', 'optional', 5050, 'How comments are supported and moderated for videos, if comments are available.', 'Wie Kommentare fuer Videos unterstuetzt und moderiert werden, sofern Kommentare verfuegbar sind.'
  UNION ALL SELECT 'video-hosting', 'discovery_engagement', 'playlists_or_collections', 'Playlists or collections', 'Playlists oder Sammlungen', 'boolean', 'beneficial', 'optional', 5060, 'Whether users can organize videos into playlists, collections, channels, or similar groups.', 'Ob Nutzer Videos in Playlists, Sammlungen, Kanaelen oder aehnlichen Gruppen organisieren koennen.'
  UNION ALL SELECT 'video-hosting', 'moderation_safety', 'creator_moderation_tools', 'Creator moderation tools', 'Creator-Moderationswerkzeuge', 'multi_enum', 'beneficial', 'multi_select', 6010, 'Moderation controls creators can apply to their videos, comments, viewers, or channel space.', 'Moderationskontrollen, die Creator auf ihre Videos, Kommentare, Zuschauer oder Kanalbereiche anwenden koennen.'
  UNION ALL SELECT 'video-hosting', 'moderation_safety', 'reporting_enforcement_tools', 'Reporting and enforcement tools', 'Melde- und Durchsetzungswerkzeuge', 'multi_enum', 'beneficial', 'multi_select', 6020, 'Tools for users or moderators to report, review, or enforce against unsafe or infringing content.', 'Werkzeuge fuer Nutzer oder Moderatoren, um unsichere oder rechtsverletzende Inhalte zu melden, zu pruefen oder durchzusetzen.'
  UNION ALL SELECT 'video-hosting', 'moderation_safety', 'content_policy_transparency', 'Content policy transparency', 'Transparenz der Inhaltsregeln', 'enum', 'informational', 'optional', 6030, 'How clearly platform content rules, enforcement notices, and transparency reporting are documented.', 'Wie klar Inhaltsregeln, Durchsetzungshinweise und Transparenzberichte der Plattform dokumentiert sind.'
  UNION ALL SELECT 'video-hosting', 'moderation_safety', 'copyright_handling_model', 'Copyright handling model', 'Urheberrechtsmodell', 'enum', 'tradeoff', 'optional', 6040, 'How copyright complaints, takedowns, automated matching, claims, or creator licensing are documented.', 'Wie Urheberrechtsbeschwerden, Entfernungen, automatischer Abgleich, Ansprueche oder Creator-Lizenzen dokumentiert sind.'
  UNION ALL SELECT 'video-hosting', 'moderation_safety', 'sensitive_content_controls', 'Sensitive-content controls', 'Kontrollen fuer sensible Inhalte', 'multi_enum', 'beneficial', 'multi_select', 6050, 'Controls for age gates, content warnings, sensitive media labels, or parental restrictions.', 'Kontrollen fuer Altersabfragen, Inhaltswarnungen, Sensibel-Labels oder Jugendschutzbeschraenkungen.'
  UNION ALL SELECT 'video-hosting', 'moderation_safety', 'appeal_process_documented', 'Appeal process documented', 'Einspruchsverfahren dokumentiert', 'boolean', 'beneficial', 'optional', 6060, 'Whether users or creators have a documented appeal process for moderation or enforcement actions.', 'Ob Nutzer oder Creator ein dokumentiertes Einspruchsverfahren gegen Moderations- oder Durchsetzungsmassnahmen haben.'
  UNION ALL SELECT 'video-hosting', 'privacy_data_ads', 'default_video_visibility', 'Default video visibility', 'Standard-Sichtbarkeit fuer Videos', 'enum', 'tradeoff', 'optional', 7010, 'The documented default visibility for newly uploaded or newly published videos.', 'Die dokumentierte Standardsichtbarkeit fuer neu hochgeladene oder neu veroeffentlichte Videos.'
  UNION ALL SELECT 'video-hosting', 'privacy_data_ads', 'video_visibility_controls', 'Video visibility controls', 'Sichtbarkeitskontrollen fuer Videos', 'multi_enum', 'beneficial', 'multi_select', 7020, 'Visibility controls creators can apply to individual videos, releases, or audiences.', 'Sichtbarkeitskontrollen, die Creator auf einzelne Videos, Veroeffentlichungen oder Zielgruppen anwenden koennen.'
  UNION ALL SELECT 'video-hosting', 'privacy_data_ads', 'ads_tracking_model', 'Ads/tracking model', 'Anzeigen-/Tracking-Modell', 'enum', 'risk', 'optional', 7030, 'How advertising, sponsorship, personalization, or viewer tracking are documented for the platform.', 'Wie Anzeigen, Sponsoring, Personalisierung oder Zuschauertracking fuer die Plattform dokumentiert sind.'
  UNION ALL SELECT 'video-hosting', 'privacy_data_ads', 'ad_personalization_controls', 'Ad personalization controls', 'Kontrollen fuer Anzeigenpersonalisierung', 'multi_enum', 'beneficial', 'multi_select', 7040, 'Controls users have over personalized ads, interests, third-party tracking, or no-ads tiers.', 'Kontrollen der Nutzer ueber personalisierte Anzeigen, Interessen, Drittanbieter-Tracking oder werbefreie Tarife.'
  UNION ALL SELECT 'video-hosting', 'privacy_data_ads', 'data_export_formats', 'Data export formats', 'Datenexportformate', 'multi_enum', 'beneficial', 'multi_select', 7050, 'Documented export options for account data, videos, metadata, subtitles, analytics, or comments.', 'Dokumentierte Exportoptionen fuer Kontodaten, Videos, Metadaten, Untertitel, Analysen oder Kommentare.'
  UNION ALL SELECT 'video-hosting', 'privacy_data_ads', 'analytics_depth', 'Analytics depth', 'Analyseumfang', 'enum', 'informational', 'optional', 7060, 'The level of viewer, engagement, retention, geography, or realtime analytics documented for creators.', 'Der dokumentierte Umfang von Zuschauer-, Engagement-, Retention-, Geografie- oder Echtzeit-Analysen fuer Creator.'
  UNION ALL SELECT 'video-hosting', 'creator_business', 'monetization_tools', 'Monetization tools', 'Monetarisierungswerkzeuge', 'multi_enum', 'informational', 'multi_select', 8010, 'Documented ways creators can earn money or receive support through the platform.', 'Dokumentierte Wege, wie Creator ueber die Plattform Einnahmen erzielen oder Unterstuetzung erhalten koennen.'
  UNION ALL SELECT 'video-hosting', 'creator_business', 'paid_content_support', 'Paid content support', 'Unterstuetzung fuer bezahlte Inhalte', 'multi_enum', 'informational', 'multi_select', 8020, 'Paid video, subscription, rental, ticketed live, or private-sale models documented for creators.', 'Bezahlvideo-, Abo-, Leih-, Ticket-Livestream- oder Privatverkaufsmodelle, die fuer Creator dokumentiert sind.'
  UNION ALL SELECT 'video-hosting', 'creator_business', 'creator_support_tools', 'Creator support tools', 'Creator-Unterstuetzungswerkzeuge', 'multi_enum', 'informational', 'multi_select', 8030, 'Publishing workflow tools that support creators before or after publishing videos.', 'Veroeffentlichungswerkzeuge, die Creator vor oder nach der Veroeffentlichung von Videos unterstuetzen.'
  UNION ALL SELECT 'video-hosting', 'creator_business', 'revenue_share_transparency', 'Revenue-share transparency', 'Transparenz der Umsatzbeteiligung', 'enum', 'informational', 'optional', 8040, 'How clearly revenue share rates, monetization eligibility, or partner-only limits are documented.', 'Wie klar Umsatzbeteiligungssaetze, Monetarisierungsberechtigung oder Partnerbeschraenkungen dokumentiert sind.'
  UNION ALL SELECT 'video-hosting', 'interoperability_portability', 'federation_protocols', 'Federation and syndication protocols', 'Foederations- und Syndikationsprotokolle', 'multi_enum', 'tradeoff', 'multi_select', 9010, 'Documented federation, syndication, feed, or embed protocols supported by the platform.', 'Dokumentierte Foederations-, Syndikations-, Feed- oder Einbettungsprotokolle, die die Plattform unterstuetzt.'
  UNION ALL SELECT 'video-hosting', 'interoperability_portability', 'embed_oembed_support', 'Embed/oEmbed support', 'Embed-/oEmbed-Unterstuetzung', 'boolean', 'beneficial', 'optional', 9020, 'Whether the platform documents oEmbed or comparable embed discovery support.', 'Ob die Plattform oEmbed oder vergleichbare Unterstuetzung fuer Einbettungserkennung dokumentiert.'
  UNION ALL SELECT 'video-hosting', 'interoperability_portability', 'developer_api', 'Developer API', 'Entwickler-API', 'enum', 'tradeoff', 'optional', 9030, 'The documented API level available for reading, uploading, administration, or paid access.', 'Der dokumentierte API-Umfang fuer Lesen, Uploads, Administration oder bezahlten Zugriff.'
  UNION ALL SELECT 'video-hosting', 'interoperability_portability', 'portability_migration', 'Portability and migration', 'Portabilitaet und Migration', 'multi_enum', 'beneficial', 'multi_select', 9040, 'Documented options for account export, video import, channel migration, redirects, or bulk download.', 'Dokumentierte Optionen fuer Kontoexport, Videoimport, Kanalmigration, Weiterleitungen oder Massendownload.'
  UNION ALL SELECT 'video-hosting', 'interoperability_portability', 'import_from_external_platforms', 'Import from external platforms', 'Import von externen Plattformen', 'boolean', 'informational', 'optional', 9050, 'Whether creators can import videos or channels from external video platforms.', 'Ob Creator Videos oder Kanaele von externen Videoplattformen importieren koennen.'
  UNION ALL SELECT 'video-hosting', 'deployment_fit', 'deployment_model', 'Deployment model', 'Bereitstellungsmodell', 'enum', 'tradeoff', 'optional', 10010, 'The primary hosted, self-hosted, federated, hybrid, or managed deployment model.', 'Das primaere gehostete, selbstgehostete, foederierte, hybride oder verwaltete Bereitstellungsmodell.'
  UNION ALL SELECT 'video-hosting', 'deployment_fit', 'self_hosting_available', 'Self-hosting available', 'Selbsthosting verfuegbar', 'boolean', 'tradeoff', 'optional', 10020, 'Whether organizations or communities can operate the video hosting software themselves.', 'Ob Organisationen oder Communities die Video-Hosting-Software selbst betreiben koennen.'
  UNION ALL SELECT 'video-hosting', 'deployment_fit', 'admin_controls', 'Admin controls', 'Administrationskontrollen', 'multi_enum', 'beneficial', 'multi_select', 10030, 'Administrative controls available for users, quotas, moderation, policies, logs, or storage.', 'Administrationskontrollen fuer Nutzer, Kontingente, Moderation, Regeln, Protokolle oder Speicher.'
  UNION ALL SELECT 'video-hosting', 'deployment_fit', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 10040, 'Documented accessibility features for watching, navigating, captioning, transcripts, or metadata.', 'Dokumentierte Barrierefreiheitsfunktionen fuer Ansehen, Navigation, Untertitel, Transkripte oder Metadaten.'
  UNION ALL SELECT 'video-hosting', 'deployment_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 10050, 'Common viewer, creator, organization, community, education, live, or archive use cases the platform fits.', 'Typische Zuschauer-, Creator-, Organisations-, Community-, Bildungs-, Live- oder Archiv-Anwendungsfaelle, fuer die die Plattform geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'video-hosting' AS category_id, 'channel_profile_model' AS criterion_key, 'personal_channels' AS option_key, 'Personal channels' AS label_en, 'Persoenliche Kanaele' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'video-hosting', 'channel_profile_model', 'organization_channels', 'Organization channels', 'Organisationskanaele', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'channel_profile_model', 'brand_channels', 'Brand channels', 'Marken-Kanaele', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'channel_profile_model', 'instance_accounts', 'Instance accounts', 'Instanzkonten', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'channel_profile_model', 'no_public_channels', 'No public channels', 'Keine oeffentlichen Kanaele', 'warning', 50
  UNION ALL SELECT 'video-hosting', 'supported_upload_methods', 'web_upload', 'Web upload', 'Web-Upload', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'supported_upload_methods', 'mobile_upload', 'Mobile upload', 'Mobiler Upload', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'supported_upload_methods', 'api_upload', 'API upload', 'API-Upload', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'supported_upload_methods', 'bulk_import', 'Bulk import', 'Massenimport', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'supported_upload_methods', 'remote_url_import', 'Remote URL import', 'Remote-URL-Import', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'supported_upload_methods', 'rss_import', 'RSS import', 'RSS-Import', 'tradeoff', 60
  UNION ALL SELECT 'video-hosting', 'supported_input_formats', 'mp4', 'MP4', 'MP4', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'supported_input_formats', 'webm', 'WebM', 'WebM', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'supported_input_formats', 'mov', 'MOV', 'MOV', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'supported_input_formats', 'mkv', 'MKV', 'MKV', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'supported_input_formats', 'audio_only', 'Audio-only uploads', 'Nur-Audio-Uploads', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'storage_quota_model', 'per_video_limit', 'Per-video limit', 'Limit je Video', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'storage_quota_model', 'account_quota', 'Account quota', 'Kontokontingent', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'storage_quota_model', 'plan_based_quota', 'Plan-based quota', 'Tarifbasiertes Kontingent', 'tradeoff', 30
  UNION ALL SELECT 'video-hosting', 'storage_quota_model', 'admin_configurable', 'Admin configurable', 'Durch Admin konfigurierbar', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'storage_quota_model', 'not_documented', 'Not documented', 'Nicht dokumentiert', 'warning', 50
  UNION ALL SELECT 'video-hosting', 'transcoding_delivery_model', 'provider_transcoding', 'Provider transcoding', 'Anbieter-Transcoding', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'transcoding_delivery_model', 'self_hosted_transcoding', 'Self-hosted transcoding', 'Selbstgehostetes Transcoding', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'transcoding_delivery_model', 'direct_file_serving', 'Direct file serving', 'Direkte Dateiauslieferung', 'tradeoff', 30
  UNION ALL SELECT 'video-hosting', 'transcoding_delivery_model', 'adaptive_streaming', 'Adaptive streaming', 'Adaptives Streaming', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'transcoding_delivery_model', 'external_encoder_required', 'External encoder required', 'Externer Encoder erforderlich', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'thumbnail_and_metadata_tools', 'custom_thumbnail', 'Custom thumbnail', 'Eigenes Thumbnail', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'thumbnail_and_metadata_tools', 'auto_thumbnail', 'Automatic thumbnail', 'Automatisches Thumbnail', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'thumbnail_and_metadata_tools', 'tags_categories', 'Tags/categories', 'Tags/Kategorien', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'thumbnail_and_metadata_tools', 'chapters', 'Chapters', 'Kapitel', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'thumbnail_and_metadata_tools', 'scheduled_publish', 'Scheduled publishing', 'Geplante Veroeffentlichung', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'playback_quality_options', 'sd_480p', 'SD/480p', 'SD/480p', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'playback_quality_options', 'hd_720p', 'HD/720p', 'HD/720p', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'playback_quality_options', 'full_hd_1080p', 'Full HD/1080p', 'Full HD/1080p', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'playback_quality_options', 'uhd_4k', '4K/UHD', '4K/UHD', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'playback_quality_options', 'manual_quality_selector', 'Manual quality selector', 'Manuelle Qualitaetsauswahl', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'player_distribution_channels', 'iframe_embed', 'iframe embed', 'iframe-Einbettung', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'player_distribution_channels', 'oembed', 'oEmbed', 'oEmbed', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'player_distribution_channels', 'rss_atom_feeds', 'RSS/Atom feeds', 'RSS-/Atom-Feeds', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'player_distribution_channels', 'casting', 'Casting', 'Casting', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'player_distribution_channels', 'tv_apps', 'TV apps', 'TV-Apps', 'neutral', 50
  UNION ALL SELECT 'video-hosting', 'offline_download_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'offline_download_model', 'creator_downloads', 'Creator-controlled downloads', 'Creator-gesteuerte Downloads', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'offline_download_model', 'viewer_downloads', 'Viewer downloads', 'Downloads fuer Zuschauer', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'offline_download_model', 'paid_offline', 'Paid/offline app mode', 'Bezahlter Offline-App-Modus', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'offline_download_model', 'app_cache_only', 'App cache only', 'Nur App-Cache', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'live_streaming_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'live_streaming_model', 'native_live', 'Native live streaming', 'Native Livestreams', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'live_streaming_model', 'rtmp_ingest', 'RTMP ingest', 'RTMP-Ingest', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'live_streaming_model', 'scheduled_premieres', 'Scheduled premieres', 'Geplante Premieren', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'live_streaming_model', 'restreaming', 'Restreaming', 'Restreaming', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'live_interaction_tools', 'live_chat', 'Live chat', 'Live-Chat', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'live_interaction_tools', 'reactions', 'Reactions', 'Reaktionen', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'live_interaction_tools', 'polls', 'Polls', 'Umfragen', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'live_interaction_tools', 'qna', 'Q&A', 'Q&A', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'live_interaction_tools', 'moderation_queue', 'Moderation queue', 'Moderationswarteschlange', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'discovery_feed_model', 'search_only', 'Search only', 'Nur Suche', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'discovery_feed_model', 'chronological_subscriptions', 'Chronological subscriptions', 'Chronologische Abos', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'discovery_feed_model', 'algorithmic_recommendations', 'Algorithmic recommendations', 'Algorithmische Empfehlungen', 'tradeoff', 30
  UNION ALL SELECT 'video-hosting', 'discovery_feed_model', 'editorial_curated', 'Editorial curated', 'Redaktionell kuratiert', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'discovery_feed_model', 'federated_timeline', 'Federated timeline', 'Foederierte Timeline', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'recommendation_controls', 'disable_autoplay', 'Disable autoplay', 'Autoplay deaktivieren', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'recommendation_controls', 'hide_recommendations', 'Hide recommendations', 'Empfehlungen ausblenden', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'recommendation_controls', 'chronological_subscriptions', 'Chronological subscriptions', 'Chronologische Abos', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'recommendation_controls', 'topic_controls', 'Topic controls', 'Themenkontrollen', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'recommendation_controls', 'history_controls', 'History controls', 'Verlaufskontrollen', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'interaction_features', 'likes', 'Likes', 'Likes', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'interaction_features', 'dislikes', 'Dislikes', 'Dislikes', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'interaction_features', 'comments', 'Comments', 'Kommentare', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'interaction_features', 'replies', 'Replies', 'Antworten', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'interaction_features', 'shares', 'Shares', 'Teilen', 'neutral', 50
  UNION ALL SELECT 'video-hosting', 'interaction_features', 'bookmarks', 'Bookmarks', 'Lesezeichen', 'positive', 60
  UNION ALL SELECT 'video-hosting', 'interaction_features', 'playlists', 'Playlists', 'Playlists', 'positive', 70
  UNION ALL SELECT 'video-hosting', 'comment_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'comment_model', 'hosted_comments', 'Hosted comments', 'Gehostete Kommentare', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'comment_model', 'federated_comments', 'Federated comments', 'Foederierte Kommentare', 'tradeoff', 30
  UNION ALL SELECT 'video-hosting', 'comment_model', 'external_comments', 'External comments', 'Externe Kommentare', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'comment_model', 'creator_moderated', 'Creator moderated', 'Durch Creator moderiert', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'creator_moderation_tools', 'comment_moderation', 'Comment moderation', 'Kommentarmoderation', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'creator_moderation_tools', 'block_users', 'Block users', 'Nutzer blockieren', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'creator_moderation_tools', 'keyword_filters', 'Keyword filters', 'Stichwortfilter', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'creator_moderation_tools', 'age_restriction', 'Age restriction', 'Altersbeschraenkung', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'creator_moderation_tools', 'geo_restriction', 'Geo restriction', 'Geobeschraenkung', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'creator_moderation_tools', 'manual_approval', 'Manual approval', 'Manuelle Freigabe', 'positive', 60
  UNION ALL SELECT 'video-hosting', 'reporting_enforcement_tools', 'user_reports', 'User reports', 'Nutzermeldungen', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'reporting_enforcement_tools', 'spam_abuse_reports', 'Spam/abuse reports', 'Spam-/Missbrauchsmeldungen', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'reporting_enforcement_tools', 'copyright_reports', 'Copyright reports', 'Urheberrechtsmeldungen', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'reporting_enforcement_tools', 'trusted_flaggers', 'Trusted flaggers', 'Vertrauenswuerdige Melder', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'reporting_enforcement_tools', 'appeal_process', 'Appeal process', 'Einspruchsverfahren', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'content_policy_transparency', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'video-hosting', 'content_policy_transparency', 'public_rules', 'Public rules', 'Oeffentliche Regeln', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'content_policy_transparency', 'transparency_report', 'Transparency report', 'Transparenzbericht', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'content_policy_transparency', 'action_notices', 'Action notices', 'Massnahmenhinweise', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'content_policy_transparency', 'public_modlog', 'Public moderation log', 'Oeffentliches Moderationsprotokoll', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'copyright_handling_model', 'notice_takedown', 'Notice and takedown', 'Notice-and-Takedown', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'copyright_handling_model', 'automated_matching', 'Automated matching', 'Automatischer Abgleich', 'tradeoff', 20
  UNION ALL SELECT 'video-hosting', 'copyright_handling_model', 'manual_claims', 'Manual claims', 'Manuelle Ansprueche', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'copyright_handling_model', 'creator_licenses', 'Creator licenses', 'Creator-Lizenzen', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'copyright_handling_model', 'unclear', 'Unclear', 'Unklar', 'warning', 50
  UNION ALL SELECT 'video-hosting', 'sensitive_content_controls', 'content_warnings', 'Content warnings', 'Inhaltswarnungen', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'sensitive_content_controls', 'age_gate', 'Age gate', 'Altersabfrage', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'sensitive_content_controls', 'nsfw_labels', 'NSFW/sensitive labels', 'NSFW-/Sensibel-Labels', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'sensitive_content_controls', 'parental_controls', 'Parental controls', 'Jugendschutzkontrollen', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'sensitive_content_controls', 'media_blur', 'Media blur', 'Medien weichzeichnen', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'default_video_visibility', 'public', 'Public', 'Oeffentlich', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'default_video_visibility', 'unlisted', 'Unlisted', 'Ungelistet', 'tradeoff', 20
  UNION ALL SELECT 'video-hosting', 'default_video_visibility', 'private', 'Private', 'Privat', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'default_video_visibility', 'followers_only', 'Followers/subscribers only', 'Nur Follower/Abonnenten', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'default_video_visibility', 'instance_local', 'Instance-local', 'Instanzlokal', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'video_visibility_controls', 'public', 'Public', 'Oeffentlich', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'video_visibility_controls', 'unlisted_link', 'Unlisted link', 'Ungelisteter Link', 'tradeoff', 20
  UNION ALL SELECT 'video-hosting', 'video_visibility_controls', 'private', 'Private', 'Privat', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'video_visibility_controls', 'password_protected', 'Password protected', 'Passwortgeschuetzt', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'video_visibility_controls', 'members_only', 'Members only', 'Nur Mitglieder', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'video_visibility_controls', 'scheduled_release', 'Scheduled release', 'Geplante Veroeffentlichung', 'neutral', 60
  UNION ALL SELECT 'video-hosting', 'ads_tracking_model', 'no_ads', 'No ads', 'Keine Anzeigen', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'ads_tracking_model', 'contextual_ads', 'Contextual ads', 'Kontextanzeigen', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'ads_tracking_model', 'personalized_ads', 'Personalized ads', 'Personalisierte Anzeigen', 'warning', 30
  UNION ALL SELECT 'video-hosting', 'ads_tracking_model', 'creator_sponsorships', 'Creator sponsorships', 'Creator-Sponsoring', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'ads_tracking_model', 'unclear', 'Unclear', 'Unklar', 'warning', 50
  UNION ALL SELECT 'video-hosting', 'ad_personalization_controls', 'opt_out_personalized_ads', 'Personalized-ads opt-out', 'Opt-out fuer personalisierte Anzeigen', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'ad_personalization_controls', 'interest_controls', 'Interest controls', 'Interessenkontrollen', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'ad_personalization_controls', 'third_party_tracking_controls', 'Third-party tracking controls', 'Kontrollen fuer Drittanbieter-Tracking', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'ad_personalization_controls', 'no_ads_paid_tier', 'No-ads paid tier', 'Anzeigenfreier Bezahltarif', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'ad_personalization_controls', 'not_applicable', 'Not applicable/no ads', 'Nicht anwendbar/keine Anzeigen', 'neutral', 50
  UNION ALL SELECT 'video-hosting', 'data_export_formats', 'account_export', 'Account export', 'Kontoexport', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'data_export_formats', 'video_file_export', 'Video file export', 'Videodatei-Export', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'data_export_formats', 'metadata_json_csv', 'Metadata JSON/CSV', 'Metadaten JSON/CSV', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'data_export_formats', 'subtitles_export', 'Subtitles export', 'Untertitel-Export', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'data_export_formats', 'analytics_export', 'Analytics export', 'Analyse-Export', 'neutral', 50
  UNION ALL SELECT 'video-hosting', 'data_export_formats', 'comments_export', 'Comments export', 'Kommentar-Export', 'neutral', 60
  UNION ALL SELECT 'video-hosting', 'analytics_depth', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'analytics_depth', 'basic_views', 'Basic views', 'Basis-Aufrufe', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'analytics_depth', 'engagement_metrics', 'Engagement metrics', 'Engagement-Metriken', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'analytics_depth', 'audience_geography', 'Audience/geography', 'Publikum/Geografie', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'analytics_depth', 'retention_graphs', 'Retention graphs', 'Retention-Grafiken', 'neutral', 50
  UNION ALL SELECT 'video-hosting', 'analytics_depth', 'realtime_analytics', 'Realtime analytics', 'Echtzeit-Analysen', 'neutral', 60
  UNION ALL SELECT 'video-hosting', 'monetization_tools', 'donations_tips', 'Donations/tips', 'Spenden/Trinkgelder', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'monetization_tools', 'subscriptions', 'Subscriptions', 'Abos', 'tradeoff', 20
  UNION ALL SELECT 'video-hosting', 'monetization_tools', 'ads_revenue_share', 'Ads revenue share', 'Anzeigen-Umsatzbeteiligung', 'tradeoff', 30
  UNION ALL SELECT 'video-hosting', 'monetization_tools', 'memberships', 'Memberships', 'Mitgliedschaften', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'monetization_tools', 'paid_videos', 'Paid videos', 'Bezahlte Videos', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'monetization_tools', 'merch_links', 'Merch links', 'Merch-Links', 'neutral', 60
  UNION ALL SELECT 'video-hosting', 'monetization_tools', 'crowdfunding', 'Crowdfunding', 'Crowdfunding', 'neutral', 70
  UNION ALL SELECT 'video-hosting', 'paid_content_support', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'paid_content_support', 'pay_per_view', 'Pay-per-view', 'Pay-per-View', 'tradeoff', 20
  UNION ALL SELECT 'video-hosting', 'paid_content_support', 'subscriptions', 'Subscriptions', 'Abos', 'tradeoff', 30
  UNION ALL SELECT 'video-hosting', 'paid_content_support', 'rentals', 'Rentals', 'Leihen', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'paid_content_support', 'ticketed_live', 'Ticketed live streams', 'Ticket-Livestreams', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'paid_content_support', 'private_sales', 'Private sales', 'Privatverkaeufe', 'tradeoff', 60
  UNION ALL SELECT 'video-hosting', 'creator_support_tools', 'custom_thumbnails', 'Custom thumbnails', 'Eigene Thumbnails', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'creator_support_tools', 'chapters', 'Chapters', 'Kapitel', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'creator_support_tools', 'end_screens_cards', 'End screens/cards', 'Endbildschirme/Karten', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'creator_support_tools', 'creator_studio', 'Creator studio', 'Creator-Studio', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'creator_support_tools', 'bulk_editing', 'Bulk editing', 'Massenbearbeitung', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'creator_support_tools', 'scheduled_publish', 'Scheduled publishing', 'Geplante Veroeffentlichung', 'positive', 60
  UNION ALL SELECT 'video-hosting', 'revenue_share_transparency', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'revenue_share_transparency', 'published_rates', 'Published rates', 'Veroeffentlichte Saetze', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'revenue_share_transparency', 'tier_dependent', 'Tier dependent', 'Tarifabhaengig', 'tradeoff', 30
  UNION ALL SELECT 'video-hosting', 'revenue_share_transparency', 'invite_or_partner_only', 'Invite/partner only', 'Nur Einladung/Partner', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'revenue_share_transparency', 'unclear', 'Unclear', 'Unklar', 'warning', 50
  UNION ALL SELECT 'video-hosting', 'federation_protocols', 'activitypub', 'ActivityPub', 'ActivityPub', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'federation_protocols', 'websub', 'WebSub', 'WebSub', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'federation_protocols', 'rss_atom', 'RSS/Atom', 'RSS/Atom', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'federation_protocols', 'oembed', 'oEmbed', 'oEmbed', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'federation_protocols', 'custom_bridge', 'Custom bridge', 'Eigene Bridge', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'developer_api', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'developer_api', 'read_only', 'Read-only API', 'Nur-lesende API', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'developer_api', 'public_write_api', 'Public write/upload API', 'Oeffentliche Schreib-/Upload-API', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'developer_api', 'admin_api', 'Admin API', 'Admin-API', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'developer_api', 'paid_api', 'Paid API', 'Bezahlte API', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'developer_api', 'undocumented', 'Undocumented/limited', 'Nicht dokumentiert/begrenzt', 'warning', 60
  UNION ALL SELECT 'video-hosting', 'portability_migration', 'account_export', 'Account export', 'Kontoexport', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'portability_migration', 'video_import', 'Video import', 'Videoimport', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'portability_migration', 'channel_import', 'Channel import', 'Kanalimport', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'portability_migration', 'federation_followers', 'Federation followers', 'Foederierte Follower', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'portability_migration', 'redirects', 'Redirects', 'Weiterleitungen', 'neutral', 50
  UNION ALL SELECT 'video-hosting', 'portability_migration', 'bulk_download', 'Bulk download', 'Massendownload', 'positive', 60
  UNION ALL SELECT 'video-hosting', 'deployment_model', 'hosted_saas', 'Hosted SaaS', 'Gehostetes SaaS', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'deployment_model', 'self_hosted', 'Self-hosted', 'Selbstgehostet', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'deployment_model', 'federated_instance', 'Federated instance', 'Foederierte Instanz', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'deployment_model', 'hybrid', 'Hybrid', 'Hybrid', 'tradeoff', 40
  UNION ALL SELECT 'video-hosting', 'deployment_model', 'managed_hosting', 'Managed hosting', 'Managed Hosting', 'tradeoff', 50
  UNION ALL SELECT 'video-hosting', 'admin_controls', 'user_management', 'User management', 'Nutzerverwaltung', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'admin_controls', 'quotas', 'Quotas', 'Kontingente', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'admin_controls', 'instance_moderation', 'Instance moderation', 'Instanzmoderation', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'admin_controls', 'custom_policies', 'Custom policies', 'Eigene Regeln', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'admin_controls', 'audit_logs', 'Audit logs', 'Audit-Protokolle', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'admin_controls', 'storage_backends', 'Storage backends', 'Speicher-Backends', 'tradeoff', 60
  UNION ALL SELECT 'video-hosting', 'accessibility_features', 'captions_subtitles', 'Captions/subtitles', 'Untertitel', 'positive', 10
  UNION ALL SELECT 'video-hosting', 'accessibility_features', 'transcripts', 'Transcripts', 'Transkripte', 'positive', 20
  UNION ALL SELECT 'video-hosting', 'accessibility_features', 'audio_descriptions', 'Audio descriptions', 'Audiodeskriptionen', 'positive', 30
  UNION ALL SELECT 'video-hosting', 'accessibility_features', 'keyboard_controls', 'Keyboard controls', 'Tastatursteuerung', 'positive', 40
  UNION ALL SELECT 'video-hosting', 'accessibility_features', 'screen_reader_labels', 'Screen-reader labels', 'Screenreader-Labels', 'positive', 50
  UNION ALL SELECT 'video-hosting', 'accessibility_features', 'multilingual_metadata', 'Multilingual metadata', 'Mehrsprachige Metadaten', 'neutral', 60
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'viewers', 'Viewers', 'Zuschauer', 'neutral', 10
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'creators', 'Creators', 'Creator', 'neutral', 20
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'educators', 'Educators', 'Bildung', 'neutral', 30
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'organizations', 'Organizations', 'Organisationen', 'neutral', 40
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'live_streamers', 'Live streamers', 'Livestreamer', 'neutral', 50
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'communities', 'Communities', 'Communities', 'tradeoff', 60
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'self_hosters', 'Self-hosters', 'Selbsthoster', 'tradeoff', 70
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'privacy_sensitive', 'Privacy-sensitive publishing', 'Datenschutzsensible Veroeffentlichung', 'positive', 80
  UNION ALL SELECT 'video-hosting', 'fit_profiles', 'public_media_archive', 'Public media archive', 'Oeffentliches Medienarchiv', 'tradeoff', 90
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'video-hosting'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'video-hosting'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('013-video-hosting-matrix-criteria');
