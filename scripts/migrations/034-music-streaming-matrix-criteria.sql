-- Migration 034: Define Music Streaming category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('music-streaming', 'catalog_content', 'Catalog & Content', 'Katalog & Inhalte', 'Music catalog size, genre coverage, and additional content types.', 'Musikkataloggröße, Genre-Abdeckung und zusätzliche Inhaltstypen.', 100),
  ('music-streaming', 'audio_quality_playback', 'Audio Quality & Playback', 'Audioqualität & Wiedergabe', 'Audio quality settings, lossless support, and playback features.', 'Audioqualitätseinstellungen, Lossless-Unterstützung und Wiedergabefunktionen.', 200),
  ('music-streaming', 'discovery_personalization', 'Discovery & Personalization', 'Entdeckung & Personalisierung', 'Recommendation engines, playlists, and listening history controls.', 'Empfehlungsalgorithmen, Playlists und Hörverlauf-Steuerungen.', 300),
  ('music-streaming', 'platform_apps', 'Platform & Apps', 'Plattform & Apps', 'Platform support, apps, smart speakers, and device integrations.', 'Plattformunterstützung, Apps, Smart Speaker und Geräteintegrationen.', 400),
  ('music-streaming', 'social_community', 'Social & Community', 'Soziales & Community', 'Social listening, profiles, sharing, and third-party integrations.', 'Soziales Hören, Profile, Teilen und Drittanbieter-Integrationen.', 500),
  ('music-streaming', 'privacy_data', 'Privacy & Data', 'Privatsphäre & Daten', 'Data processing location, tracking model, data export, and privacy controls.', 'Datenverarbeitungsstandort, Tracking-Modell, Datenexport und Datenschutzkontrollen.', 600),
  ('music-streaming', 'artist_creator_support', 'Artist & Creator Support', 'Künstler- & Kreativenunterstützung', 'Artist payout models, transparency, and creator tools.', 'Künstler-Vergütungsmodelle, Transparenz und Kreativ-Tools.', 700),
  ('music-streaming', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier, plans, and target user profiles.', 'Preismodell, kostenlose Stufe, Tarife und Zielgruppen-Nutzerprofile.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'music-streaming' AS category_id, 'catalog_content' AS group_key, 'catalog_size' AS criterion_key, 'Catalog size' AS label_en, 'Kataloggröße' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'Approximate number of tracks available in the music catalog.' AS help_text_en, 'Ungefähre Anzahl der im Musikkatalog verfügbaren Titel.' AS help_text_de
  UNION ALL SELECT 'music-streaming', 'catalog_content', 'music_genres_coverage', 'Music genres coverage', 'Musikgenre-Abdeckung', 'enum', 'informational', 'optional', 1020, 'Breadth and focus of music genres available on the platform.', 'Breite und Schwerpunkt der auf der Plattform verfügbaren Musikgenres.'
  UNION ALL SELECT 'music-streaming', 'catalog_content', 'podcasts_available', 'Podcasts available', 'Podcasts verfügbar', 'boolean', 'informational', 'optional', 1030, 'Whether podcasts are available on the platform.', 'Ob Podcasts auf der Plattform verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'catalog_content', 'audiobooks_available', 'Audiobooks available', 'Hörbücher verfügbar', 'boolean', 'informational', 'optional', 1040, 'Whether audiobooks are available on the platform.', 'Ob Hörbücher auf der Plattform verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'catalog_content', 'live_radio_available', 'Live radio available', 'Live-Radio verfügbar', 'boolean', 'informational', 'optional', 1050, 'Whether live radio stations are available.', 'Ob Live-Radiosender verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'catalog_content', 'exclusive_content', 'Exclusive content model', 'Exklusivinhalte-Modell', 'enum', 'tradeoff', 'optional', 1060, 'How the platform handles exclusive content and originals.', 'Wie die Plattform exklusive Inhalte und Originale handhabt.'
  UNION ALL SELECT 'music-streaming', 'audio_quality_playback', 'max_audio_quality', 'Maximum audio quality', 'Maximale Audioqualität', 'enum', 'tradeoff', 'optional', 2010, 'Highest audio quality tier available for streaming.', 'Höchste verfügbare Audioqualitätsstufe für Streaming.'
  UNION ALL SELECT 'music-streaming', 'audio_quality_playback', 'lossless_available', 'Lossless audio available', 'Verlustfreies Audio verfügbar', 'boolean', 'beneficial', 'optional', 2020, 'Whether lossless audio streaming is supported.', 'Ob verlustfreies Audio-Streaming unterstützt wird.'
  UNION ALL SELECT 'music-streaming', 'audio_quality_playback', 'spatial_audio', 'Spatial audio support', 'Raumklang-Unterstützung', 'boolean', 'informational', 'optional', 2030, 'Whether spatial or immersive audio formats are supported.', 'Ob Raumklang- oder immersive Audioformate unterstützt werden.'
  UNION ALL SELECT 'music-streaming', 'audio_quality_playback', 'gapless_playback', 'Gapless playback', 'Lückenlose Wiedergabe', 'boolean', 'beneficial', 'optional', 2040, 'Whether gapless playback between tracks is supported.', 'Ob lückenlose Wiedergabe zwischen Titeln unterstützt wird.'
  UNION ALL SELECT 'music-streaming', 'audio_quality_playback', 'crossfade_support', 'Crossfade support', 'Crossfade-Unterstützung', 'boolean', 'informational', 'optional', 2050, 'Whether crossfade between tracks is supported.', 'Ob Crossfade zwischen Titeln unterstützt wird.'
  UNION ALL SELECT 'music-streaming', 'audio_quality_playback', 'offline_playback', 'Offline playback', 'Offline-Wiedergabe', 'boolean', 'beneficial', 'must_match', 2060, 'Whether tracks can be downloaded for offline listening.', 'Ob Titel zum Offline-Hören heruntergeladen werden können.'
  UNION ALL SELECT 'music-streaming', 'audio_quality_playback', 'streaming_codec', 'Streaming codec', 'Streaming-Codec', 'multi_enum', 'informational', 'multi_select', 2070, 'Audio codecs used for streaming.', 'Audiocodecs, die für das Streaming verwendet werden.'
  UNION ALL SELECT 'music-streaming', 'discovery_personalization', 'recommendation_engine', 'Recommendation engine', 'Empfehlungsalgorithmus', 'enum', 'tradeoff', 'optional', 3010, 'How the platform generates music recommendations.', 'Wie die Plattform Musikempfehlungen generiert.'
  UNION ALL SELECT 'music-streaming', 'discovery_personalization', 'curated_playlists', 'Curated playlists', 'Kuratierte Playlists', 'boolean', 'informational', 'optional', 3020, 'Whether editorially curated playlists are available.', 'Ob redaktionell kuratierte Playlists verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'discovery_personalization', 'user_generated_playlists', 'User-generated playlists', 'Nutzererstellte Playlists', 'boolean', 'beneficial', 'optional', 3030, 'Whether users can create and manage their own playlists.', 'Ob Nutzer eigene Playlists erstellen und verwalten können.'
  UNION ALL SELECT 'music-streaming', 'discovery_personalization', 'radio_stations', 'Auto-generated radio / stations', 'Automatisch generiertes Radio / Sender', 'boolean', 'informational', 'optional', 3040, 'Whether auto-generated radio or station features are available.', 'Ob automatisch generierte Radio- oder Senderfunktionen verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'discovery_personalization', 'lyrics_display', 'Lyrics display', 'Songtextanzeige', 'boolean', 'informational', 'optional', 3050, 'Whether synchronized or static lyrics are displayed.', 'Ob synchronisierte oder statische Songtexte angezeigt werden.'
  UNION ALL SELECT 'music-streaming', 'discovery_personalization', 'listening_history_controls', 'Listening history controls', 'Hörverlauf-Steuerungen', 'multi_enum', 'beneficial', 'multi_select', 3060, 'Available controls for managing listening history data.', 'Verfügbare Steuerungen zur Verwaltung von Hörverlaufsdaten.'
  UNION ALL SELECT 'music-streaming', 'platform_apps', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 4010, 'Operating systems and platforms with native app support.', 'Betriebssysteme und Plattformen mit nativer App-Unterstützung.'
  UNION ALL SELECT 'music-streaming', 'platform_apps', 'web_player_available', 'Web player available', 'Web-Player verfügbar', 'boolean', 'beneficial', 'optional', 4020, 'Whether a browser-based web player is available.', 'Ob ein browserbasierter Web-Player verfügbar ist.'
  UNION ALL SELECT 'music-streaming', 'platform_apps', 'desktop_app_available', 'Desktop app available', 'Desktop-App verfügbar', 'boolean', 'informational', 'optional', 4030, 'Whether a dedicated desktop application is available.', 'Ob eine dedizierte Desktop-Anwendung verfügbar ist.'
  UNION ALL SELECT 'music-streaming', 'platform_apps', 'smart_speaker_support', 'Smart speaker support', 'Smart-Speaker-Unterstützung', 'multi_enum', 'informational', 'multi_select', 4040, 'Supported smart speaker platforms and protocols.', 'Unterstützte Smart-Speaker-Plattformen und -Protokolle.'
  UNION ALL SELECT 'music-streaming', 'platform_apps', 'car_integration', 'Car integration', 'Fahrzeugintegration', 'multi_enum', 'informational', 'multi_select', 4050, 'Supported car and vehicle integration standards.', 'Unterstützte Fahrzeug-Integrationsstandards.'
  UNION ALL SELECT 'music-streaming', 'platform_apps', 'wearable_support', 'Wearable / smartwatch support', 'Wearable- / Smartwatch-Unterstützung', 'boolean', 'informational', 'optional', 4060, 'Whether smartwatch or wearable apps are available.', 'Ob Smartwatch- oder Wearable-Apps verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'social_community', 'social_listening', 'Social / collaborative listening', 'Soziales / kollaboratives Hören', 'boolean', 'informational', 'optional', 5010, 'Whether social or collaborative listening sessions are supported.', 'Ob soziale oder kollaborative Hörsitzungen unterstützt werden.'
  UNION ALL SELECT 'music-streaming', 'social_community', 'public_profiles', 'Public profiles', 'Öffentliche Profile', 'boolean', 'tradeoff', 'optional', 5020, 'Whether user profiles are publicly visible.', 'Ob Nutzerprofile öffentlich sichtbar sind.'
  UNION ALL SELECT 'music-streaming', 'social_community', 'playlist_sharing', 'Playlist sharing model', 'Playlist-Freigabemodell', 'enum', 'informational', 'optional', 5030, 'How playlists can be shared with other users.', 'Wie Playlists mit anderen Nutzern geteilt werden können.'
  UNION ALL SELECT 'music-streaming', 'social_community', 'scrobbling_support', 'Scrobbling / Last.fm support', 'Scrobbling- / Last.fm-Unterstützung', 'boolean', 'informational', 'optional', 5040, 'Whether scrobbling to Last.fm or similar services is supported.', 'Ob Scrobbling zu Last.fm oder ähnlichen Diensten unterstützt wird.'
  UNION ALL SELECT 'music-streaming', 'social_community', 'connect_api_integrations', 'Connect / API integrations', 'Connect- / API-Integrationen', 'boolean', 'informational', 'optional', 5050, 'Whether connect or API integrations with third-party apps are available.', 'Ob Connect- oder API-Integrationen mit Drittanbieter-Apps verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 6010, 'Where user data is stored and processed.', 'Wo Nutzerdaten gespeichert und verarbeitet werden.'
  UNION ALL SELECT 'music-streaming', 'privacy_data', 'listening_data_collection', 'Listening data collection model', 'Hördaten-Erfassungsmodell', 'enum', 'risk', 'optional', 6020, 'How listening behavior data is collected and used.', 'Wie Hörverhaltensdaten erfasst und genutzt werden.'
  UNION ALL SELECT 'music-streaming', 'privacy_data', 'ad_tracking_model', 'Ad / tracking model', 'Werbe- / Tracking-Modell', 'enum', 'risk', 'optional', 6030, 'How advertising and user tracking are handled.', 'Wie Werbung und Nutzerverfolgung gehandhabt werden.'
  UNION ALL SELECT 'music-streaming', 'privacy_data', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 6040, 'Whether personal data can be exported.', 'Ob persönliche Daten exportiert werden können.'
  UNION ALL SELECT 'music-streaming', 'privacy_data', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfügbar', 'boolean', 'informational', 'optional', 6050, 'Whether a GDPR data processing agreement is available.', 'Ob ein DSGVO-Auftragsverarbeitungsvertrag verfügbar ist.'
  UNION ALL SELECT 'music-streaming', 'privacy_data', 'account_deletion', 'Account deletion available', 'Kontolöschung verfügbar', 'boolean', 'beneficial', 'optional', 6060, 'Whether full account deletion is available.', 'Ob eine vollständige Kontolöschung verfügbar ist.'
  UNION ALL SELECT 'music-streaming', 'artist_creator_support', 'artist_payout_model', 'Artist payout model', 'Künstler-Vergütungsmodell', 'enum', 'tradeoff', 'optional', 7010, 'How artists are compensated for streams.', 'Wie Künstler für Streams vergütet werden.'
  UNION ALL SELECT 'music-streaming', 'artist_creator_support', 'artist_payout_transparency', 'Artist payout transparency', 'Künstler-Vergütungstransparenz', 'enum', 'informational', 'optional', 7020, 'How transparent the platform is about artist payout rates.', 'Wie transparent die Plattform bezüglich Künstler-Vergütungsraten ist.'
  UNION ALL SELECT 'music-streaming', 'artist_creator_support', 'direct_artist_support', 'Direct artist support features', 'Direkte Künstlerunterstützungsfunktionen', 'boolean', 'beneficial', 'optional', 7030, 'Whether features for direct artist support are available.', 'Ob Funktionen zur direkten Künstlerunterstützung verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'artist_creator_support', 'independent_artist_uploads', 'Independent artist uploads', 'Unabhängige Künstler-Uploads', 'boolean', 'informational', 'optional', 7040, 'Whether independent artists can upload music directly.', 'Ob unabhängige Künstler Musik direkt hochladen können.'
  UNION ALL SELECT 'music-streaming', 'artist_creator_support', 'artist_analytics', 'Artist analytics available', 'Künstler-Analysen verfügbar', 'boolean', 'informational', 'optional', 7050, 'Whether analytics dashboards for artists are available.', 'Ob Analyse-Dashboards für Künstler verfügbar sind.'
  UNION ALL SELECT 'music-streaming', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'How the service is priced.', 'Wie der Dienst bepreist wird.'
  UNION ALL SELECT 'music-streaming', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'must_match', 8020, 'Whether a free tier is available without payment.', 'Ob eine kostenlose Stufe ohne Bezahlung verfügbar ist.'
  UNION ALL SELECT 'music-streaming', 'pricing_fit', 'free_tier_limitations', 'Free tier limitations', 'Einschränkungen der kostenlosen Stufe', 'multi_enum', 'tradeoff', 'multi_select', 8030, 'Limitations that apply to the free tier.', 'Einschränkungen, die für die kostenlose Stufe gelten.'
  UNION ALL SELECT 'music-streaming', 'pricing_fit', 'family_plan_available', 'Family plan available', 'Familientarif verfügbar', 'boolean', 'informational', 'optional', 8040, 'Whether a family plan for multiple users is available.', 'Ob ein Familientarif für mehrere Nutzer verfügbar ist.'
  UNION ALL SELECT 'music-streaming', 'pricing_fit', 'student_discount', 'Student discount available', 'Studentenrabatt verfügbar', 'boolean', 'informational', 'optional', 8050, 'Whether a student discount is available.', 'Ob ein Studentenrabatt verfügbar ist.'
  UNION ALL SELECT 'music-streaming', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8060, 'Target user profiles the service is designed for.', 'Zielgruppen-Nutzerprofile, für die der Dienst konzipiert ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'music-streaming' AS category_id, 'catalog_size' AS criterion_key, 'very_large' AS option_key, 'Very large (>80M tracks)' AS label_en, 'Sehr groß (>80M Titel)' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'music-streaming', 'catalog_size', 'large', 'Large (40-80M tracks)', 'Groß (40-80M Titel)', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'catalog_size', 'medium', 'Medium (10-40M tracks)', 'Mittel (10-40M Titel)', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'catalog_size', 'small', 'Small (<10M tracks)', 'Klein (<10M Titel)', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'music_genres_coverage', 'broad_mainstream', 'Broad mainstream', 'Breiter Mainstream', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'music_genres_coverage', 'indie_niche_strong', 'Indie / niche strong', 'Indie / Nische stark', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'music_genres_coverage', 'classical_focus', 'Classical focus', 'Klassik-Schwerpunkt', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'music_genres_coverage', 'electronic_focus', 'Electronic focus', 'Elektronik-Schwerpunkt', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'music_genres_coverage', 'regional_local', 'Regional / local', 'Regional / lokal', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'music_genres_coverage', 'specialized_other', 'Specialized / other', 'Spezialisiert / andere', 'neutral', 60
  UNION ALL SELECT 'music-streaming', 'exclusive_content', 'none', 'No exclusive content', 'Keine exklusiven Inhalte', 'positive', 10
  UNION ALL SELECT 'music-streaming', 'exclusive_content', 'minor_exclusives', 'Minor exclusives', 'Wenige Exklusivinhalte', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'exclusive_content', 'significant_exclusives', 'Significant exclusives', 'Erhebliche Exklusivinhalte', 'tradeoff', 30
  UNION ALL SELECT 'music-streaming', 'exclusive_content', 'platform_originals', 'Platform originals', 'Plattform-Originale', 'tradeoff', 40
  UNION ALL SELECT 'music-streaming', 'max_audio_quality', 'hifi_lossless', 'HiFi / lossless (>1411 kbps)', 'HiFi / verlustfrei (>1411 kbps)', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'max_audio_quality', 'high', 'High (320 kbps)', 'Hoch (320 kbps)', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'max_audio_quality', 'standard', 'Standard (128-256 kbps)', 'Standard (128-256 kbps)', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'max_audio_quality', 'low', 'Low (<128 kbps)', 'Niedrig (<128 kbps)', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'streaming_codec', 'aac', 'AAC', 'AAC', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'streaming_codec', 'ogg_vorbis', 'Ogg Vorbis', 'Ogg Vorbis', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'streaming_codec', 'flac', 'FLAC', 'FLAC', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'streaming_codec', 'alac', 'ALAC', 'ALAC', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'streaming_codec', 'mp3', 'MP3', 'MP3', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'streaming_codec', 'opus', 'Opus', 'Opus', 'neutral', 60
  UNION ALL SELECT 'music-streaming', 'streaming_codec', 'mqa', 'MQA', 'MQA', 'neutral', 70
  UNION ALL SELECT 'music-streaming', 'recommendation_engine', 'algorithmic_personalized', 'Algorithmic / personalized', 'Algorithmisch / personalisiert', 'tradeoff', 10
  UNION ALL SELECT 'music-streaming', 'recommendation_engine', 'collaborative_filtering', 'Collaborative filtering', 'Kollaboratives Filtern', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'recommendation_engine', 'editorial_curated', 'Editorial / curated', 'Redaktionell / kuratiert', 'positive', 30
  UNION ALL SELECT 'music-streaming', 'recommendation_engine', 'minimal_or_none', 'Minimal or none', 'Minimal oder keine', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'listening_history_controls', 'view_history', 'View history', 'Verlauf anzeigen', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'listening_history_controls', 'delete_history', 'Delete history', 'Verlauf löschen', 'positive', 20
  UNION ALL SELECT 'music-streaming', 'listening_history_controls', 'pause_history', 'Pause history', 'Verlauf pausieren', 'positive', 30
  UNION ALL SELECT 'music-streaming', 'listening_history_controls', 'export_history', 'Export history', 'Verlauf exportieren', 'positive', 40
  UNION ALL SELECT 'music-streaming', 'listening_history_controls', 'private_session', 'Private session', 'Private Sitzung', 'positive', 50
  UNION ALL SELECT 'music-streaming', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 60
  UNION ALL SELECT 'music-streaming', 'smart_speaker_support', 'alexa', 'Amazon Alexa', 'Amazon Alexa', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'smart_speaker_support', 'google_assistant', 'Google Assistant', 'Google Assistant', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'smart_speaker_support', 'sonos', 'Sonos', 'Sonos', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'smart_speaker_support', 'apple_airplay', 'Apple AirPlay', 'Apple AirPlay', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'smart_speaker_support', 'chromecast', 'Chromecast', 'Chromecast', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'smart_speaker_support', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 60
  UNION ALL SELECT 'music-streaming', 'car_integration', 'android_auto', 'Android Auto', 'Android Auto', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'car_integration', 'apple_carplay', 'Apple CarPlay', 'Apple CarPlay', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'car_integration', 'built_in_infotainment', 'Built-in infotainment', 'Integriertes Infotainment', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'car_integration', 'bluetooth_only', 'Bluetooth only', 'Nur Bluetooth', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'car_integration', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'playlist_sharing', 'public_shareable', 'Public / shareable', 'Öffentlich / teilbar', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'playlist_sharing', 'link_sharing', 'Link sharing', 'Link-Freigabe', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'playlist_sharing', 'collaborative_playlists', 'Collaborative playlists', 'Kollaborative Playlists', 'positive', 30
  UNION ALL SELECT 'music-streaming', 'playlist_sharing', 'no_sharing', 'No sharing', 'Kein Teilen', 'warning', 40
  UNION ALL SELECT 'music-streaming', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'music-streaming', 'data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primär, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'music-streaming', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 40
  UNION ALL SELECT 'music-streaming', 'listening_data_collection', 'minimal_anonymous', 'Minimal / anonymous', 'Minimal / anonym', 'positive', 10
  UNION ALL SELECT 'music-streaming', 'listening_data_collection', 'aggregated_analytics', 'Aggregated analytics', 'Aggregierte Analysen', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'listening_data_collection', 'personal_profiling', 'Personal profiling', 'Persönliches Profiling', 'warning', 30
  UNION ALL SELECT 'music-streaming', 'listening_data_collection', 'sold_to_third_parties', 'Sold to third parties', 'An Dritte verkauft', 'negative', 40
  UNION ALL SELECT 'music-streaming', 'ad_tracking_model', 'no_ads_no_tracking', 'No ads, no tracking', 'Keine Werbung, kein Tracking', 'positive', 10
  UNION ALL SELECT 'music-streaming', 'ad_tracking_model', 'contextual_ads', 'Contextual ads', 'Kontextbezogene Werbung', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'ad_tracking_model', 'personalized_ads', 'Personalized ads', 'Personalisierte Werbung', 'warning', 30
  UNION ALL SELECT 'music-streaming', 'ad_tracking_model', 'unclear', 'Unclear', 'Unklar', 'warning', 40
  UNION ALL SELECT 'music-streaming', 'artist_payout_model', 'user_centric', 'User-centric', 'Nutzerzentriert', 'positive', 10
  UNION ALL SELECT 'music-streaming', 'artist_payout_model', 'pro_rata', 'Pro-rata', 'Pro-rata', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'artist_payout_model', 'hybrid', 'Hybrid', 'Hybrid', 'tradeoff', 30
  UNION ALL SELECT 'music-streaming', 'artist_payout_model', 'undisclosed', 'Undisclosed', 'Nicht offengelegt', 'warning', 40
  UNION ALL SELECT 'music-streaming', 'artist_payout_transparency', 'public_rates', 'Public rates', 'Öffentliche Raten', 'positive', 10
  UNION ALL SELECT 'music-streaming', 'artist_payout_transparency', 'estimated_ranges', 'Estimated ranges', 'Geschätzte Bereiche', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'artist_payout_transparency', 'partner_only', 'Partner only', 'Nur für Partner', 'tradeoff', 30
  UNION ALL SELECT 'music-streaming', 'artist_payout_transparency', 'opaque', 'Opaque', 'Intransparent', 'warning', 40
  UNION ALL SELECT 'music-streaming', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'music-streaming', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'pricing_model', 'subscription_only', 'Subscription only', 'Nur Abonnement', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'pricing_model', 'pay_per_track', 'Pay per track', 'Bezahlung pro Titel', 'tradeoff', 40
  UNION ALL SELECT 'music-streaming', 'pricing_model', 'donation_based', 'Donation-based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'free_tier_limitations', 'ads', 'Ads', 'Werbung', 'warning', 10
  UNION ALL SELECT 'music-streaming', 'free_tier_limitations', 'shuffle_only', 'Shuffle only', 'Nur Zufallswiedergabe', 'warning', 20
  UNION ALL SELECT 'music-streaming', 'free_tier_limitations', 'limited_skips', 'Limited skips', 'Begrenzte Titelsprünge', 'warning', 30
  UNION ALL SELECT 'music-streaming', 'free_tier_limitations', 'lower_quality', 'Lower quality', 'Niedrigere Qualität', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'free_tier_limitations', 'no_offline', 'No offline mode', 'Kein Offline-Modus', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'free_tier_limitations', 'time_limited', 'Time-limited', 'Zeitlich begrenzt', 'warning', 60
  UNION ALL SELECT 'music-streaming', 'fit_profiles', 'casual_listener', 'Casual listener', 'Gelegenheitshörer', 'neutral', 10
  UNION ALL SELECT 'music-streaming', 'fit_profiles', 'music_enthusiast', 'Music enthusiast', 'Musikliebhaber', 'neutral', 20
  UNION ALL SELECT 'music-streaming', 'fit_profiles', 'audiophile', 'Audiophile', 'Audiophiler Hörer', 'neutral', 30
  UNION ALL SELECT 'music-streaming', 'fit_profiles', 'family', 'Family', 'Familie', 'neutral', 40
  UNION ALL SELECT 'music-streaming', 'fit_profiles', 'student', 'Student', 'Student', 'neutral', 50
  UNION ALL SELECT 'music-streaming', 'fit_profiles', 'artist_creator', 'Artist / creator', 'Künstler / Kreativer', 'neutral', 60
  UNION ALL SELECT 'music-streaming', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'music-streaming'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'music-streaming'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('034-music-streaming-matrix-criteria');
