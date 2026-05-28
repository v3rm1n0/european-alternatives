-- Migration 011: Define Social Media category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('social-media', 'identity_profiles', 'Identity & Profiles', 'Identität & Profile', 'Account identity, sign-up, pseudonymity, and profile verification controls.', 'Kontoidentität, Registrierung, Pseudonymität und Kontrollen zur Profilverifikation.', 100),
  ('social-media', 'graph_discovery', 'Social Graph & Discovery', 'Sozialer Graph & Auffindbarkeit', 'How people connect, follow, find accounts, and discover topics or communities.', 'Wie Menschen sich verbinden, folgen, Konten finden und Themen oder Communities entdecken.', 200),
  ('social-media', 'content_publishing', 'Content & Publishing', 'Inhalte & Veröffentlichung', 'Supported post types, media formats, stories, live content, and interaction primitives.', 'Unterstützte Beitragstypen, Medienformate, Storys, Live-Inhalte und Interaktionsfunktionen.', 300),
  ('social-media', 'feeds_algorithms', 'Feeds & Algorithms', 'Feeds & Algorithmen', 'Default feed behavior, chronological views, recommendations, and algorithm controls.', 'Standard-Feed-Verhalten, chronologische Ansichten, Empfehlungen und Algorithmus-Kontrollen.', 400),
  ('social-media', 'privacy_safety', 'Privacy & Safety', 'Privatsphäre & Sicherheit', 'Profile visibility, audience controls, direct messages, blocking, and sensitive-content controls.', 'Profilsichtbarkeit, Zielgruppen-Kontrollen, Direktnachrichten, Blockieren und Kontrollen für sensible Inhalte.', 500),
  ('social-media', 'moderation_governance', 'Moderation & Governance', 'Moderation & Governance', 'Platform, instance, or community moderation model and process transparency.', 'Moderationsmodell der Plattform, Instanz oder Community sowie Prozesstransparenz.', 600),
  ('social-media', 'interoperability_portability', 'Interoperability & Portability', 'Interoperabilität & Portabilität', 'Federation, protocol support, export, account migration, and portability behavior.', 'Föderation, Protokollunterstützung, Export, Kontomigration und Portabilitätsverhalten.', 700),
  ('social-media', 'monetization_creator', 'Monetization & Creator Tools', 'Monetarisierung & Creator-Werkzeuge', 'Ads, personalization controls, creator income tools, commerce, and fundraising features.', 'Anzeigen, Personalisierungskontrollen, Creator-Einnahmewerkzeuge, Commerce und Fundraising-Funktionen.', 800),
  ('social-media', 'access_fit', 'Access & Fit', 'Zugriff & Eignung', 'Platform support, APIs, self-hosting, accessibility, and common user-fit profiles.', 'Plattformunterstützung, APIs, Selbsthosting, Barrierefreiheit und typische Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'social-media' AS category_id, 'identity_profiles' AS group_key, 'real_name_required' AS criterion_key, 'Real name required' AS label_en, 'Klarnamen erforderlich' AS label_de, 'boolean' AS value_type, 'risk' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Whether ordinary account use requires a real legal name or comparable identity disclosure.' AS help_text_en, 'Ob die normale Kontonutzung einen echten rechtlichen Namen oder vergleichbare Identitätsoffenlegung erfordert.' AS help_text_de
  UNION ALL SELECT 'social-media', 'identity_profiles', 'account_signup_methods', 'Account sign-up methods', 'Registrierungsmethoden', 'multi_enum', 'tradeoff', 'multi_select', 1020, 'Documented methods users can use to create or join an account.', 'Dokumentierte Methoden, mit denen Nutzer ein Konto erstellen oder beitreten können.'
  UNION ALL SELECT 'social-media', 'identity_profiles', 'pseudonymous_accounts', 'Pseudonymous accounts supported', 'Pseudonyme Konten unterstützt', 'boolean', 'beneficial', 'optional', 1030, 'Whether users can operate accounts under handles or pseudonyms without public real-name display.', 'Ob Nutzer Konten unter Handles oder Pseudonymen ohne öffentliche Klarnamenanzeige betreiben können.'
  UNION ALL SELECT 'social-media', 'identity_profiles', 'profile_verification_model', 'Profile verification model', 'Profilverifikation', 'enum', 'informational', 'optional', 1040, 'How profiles, people, organizations, domains, or identities can be verified or badged.', 'Wie Profile, Personen, Organisationen, Domains oder Identitäten verifiziert oder markiert werden können.'
  UNION ALL SELECT 'social-media', 'graph_discovery', 'social_graph_model', 'Social graph model', 'Modell des sozialen Graphen', 'enum', 'tradeoff', 'optional', 2010, 'The main graph structure the service uses for accounts, communities, topics, or professional contacts.', 'Die wichtigste Graph-Struktur, die der Dienst für Konten, Communities, Themen oder berufliche Kontakte nutzt.'
  UNION ALL SELECT 'social-media', 'graph_discovery', 'relationship_model', 'Relationship model', 'Beziehungsmodell', 'enum', 'tradeoff', 'optional', 2020, 'How user relationships are formed, such as following, mutual connections, groups, subscriptions, or professional links.', 'Wie Nutzerbeziehungen entstehen, etwa Folgen, gegenseitige Verbindungen, Gruppen, Abos oder berufliche Kontakte.'
  UNION ALL SELECT 'social-media', 'graph_discovery', 'discovery_methods', 'Discovery methods', 'Auffindbarkeitsmethoden', 'multi_enum', 'informational', 'multi_select', 2030, 'Documented ways users can find accounts, communities, contacts, or topics.', 'Dokumentierte Wege, wie Nutzer Konten, Communities, Kontakte oder Themen finden können.'
  UNION ALL SELECT 'social-media', 'graph_discovery', 'hashtags_mentions_support', 'Hashtags and mentions', 'Hashtags und Erwähnungen', 'multi_enum', 'beneficial', 'multi_select', 2040, 'Discovery and reference primitives such as hashtags, mentions, topics, lists, or trends.', 'Auffindbarkeits- und Referenzfunktionen wie Hashtags, Erwähnungen, Themen, Listen oder Trends.'
  UNION ALL SELECT 'social-media', 'content_publishing', 'post_content_types', 'Post content types', 'Beitragstypen', 'multi_enum', 'informational', 'multi_select', 3010, 'Types of posts the service supports for normal publishing.', 'Arten von Beiträgen, die der Dienst für normale Veröffentlichungen unterstützt.'
  UNION ALL SELECT 'social-media', 'content_publishing', 'max_text_post_length', 'Maximum text post length', 'Maximale Textlänge', 'number', 'informational', 'range', 3020, 'Documented maximum number of characters or comparable text length for a normal text post.', 'Dokumentierte maximale Zeichenanzahl oder vergleichbare Textlänge für einen normalen Textbeitrag.'
  UNION ALL SELECT 'social-media', 'content_publishing', 'media_upload_types', 'Media upload types', 'Medien-Uploads', 'multi_enum', 'informational', 'multi_select', 3030, 'Media formats users can upload or attach to posts.', 'Medienformate, die Nutzer hochladen oder Beiträgen anhängen können.'
  UNION ALL SELECT 'social-media', 'content_publishing', 'ephemeral_or_story_posts', 'Stories or ephemeral posts', 'Storys oder temporäre Beiträge', 'boolean', 'informational', 'optional', 3040, 'Whether the service supports time-limited stories or other ephemeral post formats.', 'Ob der Dienst zeitlich begrenzte Storys oder andere temporäre Beitragsformate unterstützt.'
  UNION ALL SELECT 'social-media', 'content_publishing', 'live_streaming_or_events', 'Live streaming or events', 'Livestreaming oder Events', 'multi_enum', 'informational', 'multi_select', 3050, 'Live, scheduled, or event-based publishing features documented for users or creators.', 'Live-, Planungs- oder Event-Funktionen, die für Nutzer oder Creator dokumentiert sind.'
  UNION ALL SELECT 'social-media', 'content_publishing', 'interaction_features', 'Interaction features', 'Interaktionsfunktionen', 'multi_enum', 'informational', 'multi_select', 3060, 'Supported interaction primitives such as likes, reposts, quotes, replies, reactions, or bookmarks.', 'Unterstützte Interaktionsfunktionen wie Likes, Reposts, Zitate, Antworten, Reaktionen oder Lesezeichen.'
  UNION ALL SELECT 'social-media', 'feeds_algorithms', 'default_feed_model', 'Default feed model', 'Standard-Feed-Modell', 'enum', 'tradeoff', 'optional', 4010, 'The default feed ordering or curation model users encounter in normal use.', 'Das standardmäßige Feed-Sortierungs- oder Kurationsmodell, das Nutzer im normalen Gebrauch sehen.'
  UNION ALL SELECT 'social-media', 'feeds_algorithms', 'chronological_feed_available', 'Chronological feed available', 'Chronologischer Feed verfügbar', 'boolean', 'beneficial', 'optional', 4020, 'Whether users can view posts in a chronological or reverse-chronological feed.', 'Ob Nutzer Beiträge in einem chronologischen oder umgekehrt chronologischen Feed sehen können.'
  UNION ALL SELECT 'social-media', 'feeds_algorithms', 'feed_algorithm_controls', 'Feed algorithm controls', 'Feed-/Algorithmus-Kontrollen', 'multi_enum', 'beneficial', 'multi_select', 4030, 'User controls for feed ranking, custom feeds, keyword mutes, repost visibility, topics, or recommendations.', 'Nutzerkontrollen für Feed-Ranking, eigene Feeds, Stichwort-Stummschaltung, Repost-Sichtbarkeit, Themen oder Empfehlungen.'
  UNION ALL SELECT 'social-media', 'feeds_algorithms', 'recommendation_controls', 'Recommendation controls', 'Empfehlungskontrollen', 'multi_enum', 'beneficial', 'multi_select', 4040, 'Controls for suggested accounts, interests, trending content, or sensitive recommendations.', 'Kontrollen für Kontovorschläge, Interessen, Trends oder sensible Empfehlungen.'
  UNION ALL SELECT 'social-media', 'privacy_safety', 'account_visibility_controls', 'Account visibility controls', 'Kontosichtbarkeit', 'multi_enum', 'beneficial', 'multi_select', 5010, 'Controls for public, private, unlisted, approved-follower, or search-indexed profiles.', 'Kontrollen für öffentliche, private, ungelistete, freigegebene oder suchindexierte Profile.'
  UNION ALL SELECT 'social-media', 'privacy_safety', 'post_audience_controls', 'Post audience controls', 'Zielgruppen für Beiträge', 'multi_enum', 'beneficial', 'multi_select', 5020, 'Audience controls users can apply to posts, such as public, followers-only, mentioned users, local instance, or circles.', 'Zielgruppenkontrollen für Beiträge, etwa öffentlich, nur Follower, erwähnte Nutzer, lokale Instanz oder Kreise.'
  UNION ALL SELECT 'social-media', 'privacy_safety', 'direct_message_model', 'Direct message model', 'Direktnachrichten-Modell', 'enum', 'tradeoff', 'optional', 5030, 'How private or direct messaging works, including absent, restricted, open, or encrypted modes.', 'Wie private oder direkte Nachrichten funktionieren, einschließlich fehlend, eingeschränkt, offen oder verschlüsselt.'
  UNION ALL SELECT 'social-media', 'privacy_safety', 'blocking_mute_controls', 'Blocking and mute controls', 'Blockier- und Stummschaltkontrollen', 'multi_enum', 'beneficial', 'multi_select', 5040, 'User safety controls for blocking, muting, keyword filtering, domain or instance blocks, hidden replies, or account restrictions.', 'Nutzer-Sicherheitskontrollen für Blockieren, Stummschalten, Stichwortfilter, Domain- oder Instanzblocks, ausgeblendete Antworten oder Kontoeinschränkungen.'
  UNION ALL SELECT 'social-media', 'privacy_safety', 'sensitive_content_controls', 'Sensitive-content controls', 'Kontrollen für sensible Inhalte', 'multi_enum', 'beneficial', 'multi_select', 5050, 'Controls for content warnings, sensitive labels, media blur, age gates, filters, or parental settings.', 'Kontrollen für Inhaltswarnungen, Sensibel-Labels, Medienweichzeichnung, Altersabfragen, Filter oder Jugendschutzeinstellungen.'
  UNION ALL SELECT 'social-media', 'moderation_governance', 'moderation_model', 'Moderation model', 'Moderationsmodell', 'enum', 'tradeoff', 'optional', 6010, 'The primary moderation model for the service, instance, community, users, or hybrid governance.', 'Das primäre Moderationsmodell für Dienst, Instanz, Community, Nutzer oder hybride Governance.'
  UNION ALL SELECT 'social-media', 'moderation_governance', 'community_admin_tools', 'Community admin tools', 'Community-Verwaltungswerkzeuge', 'multi_enum', 'beneficial', 'multi_select', 6020, 'Administration tools for groups or communities, including roles, bans, queues, pinned posts, rules, or logs.', 'Verwaltungswerkzeuge für Gruppen oder Communities, einschließlich Rollen, Sperren, Warteschlangen, angepinnter Beiträge, Regeln oder Protokolle.'
  UNION ALL SELECT 'social-media', 'moderation_governance', 'reporting_enforcement_tools', 'Reporting and enforcement tools', 'Melde- und Durchsetzungswerkzeuge', 'multi_enum', 'beneficial', 'multi_select', 6030, 'User reporting and enforcement paths for spam, abuse, copyright, or trusted flagger workflows.', 'Melde- und Durchsetzungswege für Spam, Missbrauch, Urheberrecht oder vertrauenswürdige Melder.'
  UNION ALL SELECT 'social-media', 'moderation_governance', 'moderation_transparency', 'Moderation transparency', 'Moderationstransparenz', 'enum', 'informational', 'optional', 6040, 'How moderation rules, reports, action notices, or moderation logs are documented or exposed.', 'Wie Moderationsregeln, Berichte, Maßnahmenhinweise oder Moderationsprotokolle dokumentiert oder sichtbar gemacht werden.'
  UNION ALL SELECT 'social-media', 'moderation_governance', 'appeal_process_documented', 'Appeal process documented', 'Einspruchsverfahren dokumentiert', 'boolean', 'beneficial', 'optional', 6050, 'Whether users can find a documented process for appealing moderation decisions.', 'Ob Nutzer ein dokumentiertes Verfahren zum Einspruch gegen Moderationsentscheidungen finden können.'
  UNION ALL SELECT 'social-media', 'interoperability_portability', 'network_architecture', 'Network architecture', 'Netzwerkarchitektur', 'enum', 'tradeoff', 'optional', 7010, 'Whether the network is centralized, federated, protocol-based, peer-to-peer, self-hosted, or another architecture.', 'Ob das Netzwerk zentralisiert, föderiert, protokollbasiert, Peer-to-peer, selbstgehostet oder anders aufgebaut ist.'
  UNION ALL SELECT 'social-media', 'interoperability_portability', 'federation_protocols', 'Federation protocols', 'Föderationsprotokolle', 'multi_enum', 'tradeoff', 'multi_select', 7020, 'Federation, syndication, or bridge protocols supported by the product or network.', 'Föderations-, Syndikations- oder Bridge-Protokolle, die Produkt oder Netzwerk unterstützen.'
  UNION ALL SELECT 'social-media', 'interoperability_portability', 'data_export_available', 'Data export available', 'Datenexport verfügbar', 'boolean', 'beneficial', 'optional', 7030, 'Whether users can export account data or content through a documented process.', 'Ob Nutzer Kontodaten oder Inhalte über einen dokumentierten Prozess exportieren können.'
  UNION ALL SELECT 'social-media', 'interoperability_portability', 'account_migration_supported', 'Account migration support', 'Kontomigration unterstützt', 'enum', 'tradeoff', 'optional', 7040, 'How account, profile, handle, follower, or full-account migration is supported.', 'Wie Konto-, Profil-, Handle-, Follower- oder vollständige Kontomigration unterstützt wird.'
  UNION ALL SELECT 'social-media', 'monetization_creator', 'ads_model', 'Ads model', 'Anzeigenmodell', 'enum', 'tradeoff', 'optional', 8010, 'The documented model for ads, promoted posts, personalized ads, creator sponsorships, or no ads.', 'Das dokumentierte Modell für Anzeigen, gesponserte Beiträge, personalisierte Anzeigen, Creator-Sponsoring oder keine Anzeigen.'
  UNION ALL SELECT 'social-media', 'monetization_creator', 'ad_personalization_controls', 'Ad personalization controls', 'Kontrollen für Anzeigenpersonalisierung', 'multi_enum', 'beneficial', 'multi_select', 8020, 'User controls for personalized ads, interests, tracking, ad topics, paid ad-free tiers, or no-ads states.', 'Nutzerkontrollen für personalisierte Anzeigen, Interessen, Tracking, Anzeigenthemen, bezahlte anzeigenfreie Tarife oder Keine-Anzeigen-Zustände.'
  UNION ALL SELECT 'social-media', 'monetization_creator', 'creator_monetization_tools', 'Creator monetization tools', 'Creator-Monetarisierung', 'multi_enum', 'informational', 'multi_select', 8030, 'Creator income features such as tips, subscriptions, paid posts, revenue share, paid events, or marketplaces.', 'Creator-Einnahmefunktionen wie Trinkgelder, Abos, bezahlte Beiträge, Umsatzbeteiligung, bezahlte Events oder Marktplätze.'
  UNION ALL SELECT 'social-media', 'monetization_creator', 'commerce_fundraising_tools', 'Commerce and fundraising tools', 'Commerce- und Fundraising-Werkzeuge', 'multi_enum', 'informational', 'multi_select', 8040, 'Commerce, product, fundraising, ticketing, or lead-generation tools documented for accounts or creators.', 'Commerce-, Produkt-, Spenden-, Ticket- oder Lead-Generierungswerkzeuge, die für Konten oder Creator dokumentiert sind.'
  UNION ALL SELECT 'social-media', 'access_fit', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 9010, 'Maintained platforms, operating systems, stores, or access paths for ordinary users.', 'Gepflegte Plattformen, Betriebssysteme, Stores oder Zugriffswege für normale Nutzer.'
  UNION ALL SELECT 'social-media', 'access_fit', 'developer_api', 'Developer API', 'Entwickler-API', 'enum', 'tradeoff', 'optional', 9020, 'The documented availability and model of APIs for developers, integrations, or automation.', 'Die dokumentierte Verfügbarkeit und das Modell von APIs für Entwickler, Integrationen oder Automatisierung.'
  UNION ALL SELECT 'social-media', 'access_fit', 'self_hosting_available', 'Self-hosting available', 'Selbsthosting verfügbar', 'boolean', 'tradeoff', 'optional', 9030, 'Whether users or organizations can operate compatible server infrastructure themselves.', 'Ob Nutzer oder Organisationen kompatible Server-Infrastruktur selbst betreiben können.'
  UNION ALL SELECT 'social-media', 'access_fit', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 9040, 'Documented accessibility support such as alt text, captions, keyboard navigation, screen-reader labels, reduced motion, or translation.', 'Dokumentierte Barrierefreiheitsunterstützung wie Alternativtext, Untertitel, Tastaturnavigation, Screenreader-Labels, reduzierte Bewegung oder Übersetzung.'
  UNION ALL SELECT 'social-media', 'access_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user needs or audience profiles the social media product is especially suited to support.', 'Typische Nutzerbedürfnisse oder Zielgruppenprofile, für die das Social-Media-Produkt besonders geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'social-media' AS category_id, 'account_signup_methods' AS criterion_key, 'email' AS option_key, 'Email address' AS label_en, 'E-Mail-Adresse' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'social-media', 'account_signup_methods', 'phone_number', 'Phone number', 'Telefonnummer', 'warning', 20
  UNION ALL SELECT 'social-media', 'account_signup_methods', 'username_only', 'Username only', 'Nur Benutzername', 'positive', 30
  UNION ALL SELECT 'social-media', 'account_signup_methods', 'invite_required', 'Invite required', 'Einladung erforderlich', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'account_signup_methods', 'organization_sso', 'Organization SSO', 'Organisations-SSO', 'neutral', 50
  UNION ALL SELECT 'social-media', 'account_signup_methods', 'cryptographic_key', 'Cryptographic key', 'Kryptografischer Schlüssel', 'tradeoff', 60
  UNION ALL SELECT 'social-media', 'profile_verification_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'social-media', 'profile_verification_model', 'platform_badge', 'Platform-reviewed badge', 'Plattformgeprüftes Badge', 'neutral', 20
  UNION ALL SELECT 'social-media', 'profile_verification_model', 'paid_badge', 'Paid verification badge', 'Bezahltes Verifikations-Badge', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'profile_verification_model', 'domain_link_verification', 'Domain or link verification', 'Domain- oder Link-Verifikation', 'positive', 40
  UNION ALL SELECT 'social-media', 'profile_verification_model', 'organization_verification', 'Organization verification', 'Organisationsverifikation', 'neutral', 50
  UNION ALL SELECT 'social-media', 'profile_verification_model', 'decentralized_identity', 'Decentralized identity', 'Dezentrale Identität', 'tradeoff', 60
  UNION ALL SELECT 'social-media', 'social_graph_model', 'follower_graph', 'Follower graph', 'Follower-Graph', 'neutral', 10
  UNION ALL SELECT 'social-media', 'social_graph_model', 'mutual_friends', 'Mutual friends graph', 'Gegenseitige-Freunde-Graph', 'neutral', 20
  UNION ALL SELECT 'social-media', 'social_graph_model', 'topic_community_graph', 'Topic/community graph', 'Themen-/Community-Graph', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'social_graph_model', 'professional_graph', 'Professional graph', 'Berufsnetzwerk-Graph', 'neutral', 40
  UNION ALL SELECT 'social-media', 'social_graph_model', 'instance_graph', 'Instance/community graph', 'Instanz-/Community-Graph', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'relationship_model', 'one_way_follow', 'One-way follow', 'Einseitiges Folgen', 'neutral', 10
  UNION ALL SELECT 'social-media', 'relationship_model', 'mutual_connection', 'Mutual connection', 'Gegenseitige Verbindung', 'neutral', 20
  UNION ALL SELECT 'social-media', 'relationship_model', 'group_membership', 'Group/community membership', 'Gruppen-/Community-Mitgliedschaft', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'relationship_model', 'subscription_channel', 'Subscription or channel', 'Abo oder Kanal', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'relationship_model', 'professional_connection', 'Professional connection', 'Berufliche Verbindung', 'neutral', 50
  UNION ALL SELECT 'social-media', 'discovery_methods', 'username_search', 'Username search', 'Benutzernamensuche', 'neutral', 10
  UNION ALL SELECT 'social-media', 'discovery_methods', 'contact_import', 'Contact import', 'Kontaktimport', 'warning', 20
  UNION ALL SELECT 'social-media', 'discovery_methods', 'public_directory', 'Public directory', 'Öffentliches Verzeichnis', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'discovery_methods', 'recommendations', 'Recommendations', 'Empfehlungen', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'discovery_methods', 'invite_links', 'Invite links', 'Einladungslinks', 'neutral', 50
  UNION ALL SELECT 'social-media', 'discovery_methods', 'qr_code', 'QR code', 'QR-Code', 'neutral', 60
  UNION ALL SELECT 'social-media', 'hashtags_mentions_support', 'hashtags', 'Hashtags', 'Hashtags', 'positive', 10
  UNION ALL SELECT 'social-media', 'hashtags_mentions_support', 'mentions', 'Mentions', 'Erwähnungen', 'positive', 20
  UNION ALL SELECT 'social-media', 'hashtags_mentions_support', 'topics', 'Topics', 'Themen', 'neutral', 30
  UNION ALL SELECT 'social-media', 'hashtags_mentions_support', 'lists', 'Lists', 'Listen', 'positive', 40
  UNION ALL SELECT 'social-media', 'hashtags_mentions_support', 'trends', 'Trends', 'Trends', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'post_content_types', 'short_posts', 'Short posts', 'Kurzbeiträge', 'neutral', 10
  UNION ALL SELECT 'social-media', 'post_content_types', 'long_posts', 'Long posts', 'Lange Beiträge', 'neutral', 20
  UNION ALL SELECT 'social-media', 'post_content_types', 'threads', 'Threads', 'Threads', 'neutral', 30
  UNION ALL SELECT 'social-media', 'post_content_types', 'articles', 'Articles', 'Artikel', 'neutral', 40
  UNION ALL SELECT 'social-media', 'post_content_types', 'link_posts', 'Link posts', 'Link-Beiträge', 'neutral', 50
  UNION ALL SELECT 'social-media', 'post_content_types', 'polls', 'Polls', 'Umfragen', 'neutral', 60
  UNION ALL SELECT 'social-media', 'media_upload_types', 'images', 'Images', 'Bilder', 'neutral', 10
  UNION ALL SELECT 'social-media', 'media_upload_types', 'short_video', 'Short video', 'Kurzvideo', 'neutral', 20
  UNION ALL SELECT 'social-media', 'media_upload_types', 'long_video', 'Long video', 'Langvideo', 'neutral', 30
  UNION ALL SELECT 'social-media', 'media_upload_types', 'audio', 'Audio', 'Audio', 'neutral', 40
  UNION ALL SELECT 'social-media', 'media_upload_types', 'documents', 'Documents', 'Dokumente', 'neutral', 50
  UNION ALL SELECT 'social-media', 'media_upload_types', 'albums_galleries', 'Albums/galleries', 'Alben/Galerien', 'neutral', 60
  UNION ALL SELECT 'social-media', 'live_streaming_or_events', 'live_video', 'Live video', 'Live-Video', 'neutral', 10
  UNION ALL SELECT 'social-media', 'live_streaming_or_events', 'scheduled_events', 'Scheduled events', 'Geplante Events', 'neutral', 20
  UNION ALL SELECT 'social-media', 'live_streaming_or_events', 'audio_spaces', 'Audio spaces', 'Audio-Räume', 'neutral', 30
  UNION ALL SELECT 'social-media', 'live_streaming_or_events', 'premieres', 'Premieres', 'Premieren', 'neutral', 40
  UNION ALL SELECT 'social-media', 'live_streaming_or_events', 'event_pages', 'Event pages', 'Event-Seiten', 'neutral', 50
  UNION ALL SELECT 'social-media', 'interaction_features', 'likes', 'Likes', 'Likes', 'neutral', 10
  UNION ALL SELECT 'social-media', 'interaction_features', 'reposts', 'Reposts', 'Reposts', 'neutral', 20
  UNION ALL SELECT 'social-media', 'interaction_features', 'quote_posts', 'Quote posts', 'Zitat-Beiträge', 'neutral', 30
  UNION ALL SELECT 'social-media', 'interaction_features', 'comments_replies', 'Comments/replies', 'Kommentare/Antworten', 'neutral', 40
  UNION ALL SELECT 'social-media', 'interaction_features', 'reactions', 'Reactions', 'Reaktionen', 'neutral', 50
  UNION ALL SELECT 'social-media', 'interaction_features', 'bookmarks', 'Bookmarks', 'Lesezeichen', 'positive', 60
  UNION ALL SELECT 'social-media', 'default_feed_model', 'chronological', 'Chronological', 'Chronologisch', 'positive', 10
  UNION ALL SELECT 'social-media', 'default_feed_model', 'algorithmic', 'Algorithmic', 'Algorithmisch', 'tradeoff', 20
  UNION ALL SELECT 'social-media', 'default_feed_model', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'social-media', 'default_feed_model', 'community_curated', 'Community-curated', 'Community-kuratiert', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'default_feed_model', 'user_configured', 'User-configured', 'Nutzerkonfiguriert', 'positive', 50
  UNION ALL SELECT 'social-media', 'feed_algorithm_controls', 'chronological_toggle', 'Chronological toggle', 'Chronologie-Schalter', 'positive', 10
  UNION ALL SELECT 'social-media', 'feed_algorithm_controls', 'custom_feeds', 'Custom feeds', 'Eigene Feeds', 'positive', 20
  UNION ALL SELECT 'social-media', 'feed_algorithm_controls', 'mute_keywords', 'Mute keywords', 'Stichwörter stummschalten', 'positive', 30
  UNION ALL SELECT 'social-media', 'feed_algorithm_controls', 'hide_reposts', 'Hide reposts', 'Reposts ausblenden', 'positive', 40
  UNION ALL SELECT 'social-media', 'feed_algorithm_controls', 'topic_filters', 'Topic filters', 'Themenfilter', 'positive', 50
  UNION ALL SELECT 'social-media', 'feed_algorithm_controls', 'recommended_content_toggle', 'Recommended-content toggle', 'Empfehlungsinhalte umschalten', 'positive', 60
  UNION ALL SELECT 'social-media', 'recommendation_controls', 'opt_out_recommendations', 'Recommendation opt-out', 'Opt-out für Empfehlungen', 'positive', 10
  UNION ALL SELECT 'social-media', 'recommendation_controls', 'interest_controls', 'Interest controls', 'Interessenkontrollen', 'positive', 20
  UNION ALL SELECT 'social-media', 'recommendation_controls', 'follow_suggestions', 'Follow suggestions', 'Folgevorschläge', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'recommendation_controls', 'trending_controls', 'Trending controls', 'Trend-Kontrollen', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'recommendation_controls', 'sensitive_recommendation_filters', 'Sensitive recommendation filters', 'Filter für sensible Empfehlungen', 'positive', 50
  UNION ALL SELECT 'social-media', 'account_visibility_controls', 'public_profile', 'Public profile', 'Öffentliches Profil', 'neutral', 10
  UNION ALL SELECT 'social-media', 'account_visibility_controls', 'private_profile', 'Private profile', 'Privates Profil', 'positive', 20
  UNION ALL SELECT 'social-media', 'account_visibility_controls', 'unlisted_profile', 'Unlisted profile', 'Ungelistetes Profil', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'account_visibility_controls', 'follower_approval', 'Follower approval', 'Follower-Freigabe', 'positive', 40
  UNION ALL SELECT 'social-media', 'account_visibility_controls', 'search_indexing_toggle', 'Search indexing toggle', 'Suchindexierung umschalten', 'positive', 50
  UNION ALL SELECT 'social-media', 'post_audience_controls', 'public_posts', 'Public posts', 'Öffentliche Beiträge', 'neutral', 10
  UNION ALL SELECT 'social-media', 'post_audience_controls', 'followers_only', 'Followers only', 'Nur Follower', 'positive', 20
  UNION ALL SELECT 'social-media', 'post_audience_controls', 'mentioned_only', 'Mentioned users only', 'Nur erwähnte Nutzer', 'positive', 30
  UNION ALL SELECT 'social-media', 'post_audience_controls', 'local_instance_only', 'Local instance only', 'Nur lokale Instanz', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'post_audience_controls', 'custom_circles', 'Custom circles/lists', 'Eigene Kreise/Listen', 'positive', 50
  UNION ALL SELECT 'social-media', 'direct_message_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'social-media', 'direct_message_model', 'followers_only', 'Followers only', 'Nur Follower', 'neutral', 20
  UNION ALL SELECT 'social-media', 'direct_message_model', 'mutuals_only', 'Mutuals only', 'Nur Gegenseitige', 'positive', 30
  UNION ALL SELECT 'social-media', 'direct_message_model', 'open_inbox', 'Open inbox', 'Offener Posteingang', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'direct_message_model', 'encrypted_dm', 'Encrypted direct messages', 'Verschlüsselte Direktnachrichten', 'positive', 50
  UNION ALL SELECT 'social-media', 'blocking_mute_controls', 'block_accounts', 'Block accounts', 'Konten blockieren', 'positive', 10
  UNION ALL SELECT 'social-media', 'blocking_mute_controls', 'mute_accounts', 'Mute accounts', 'Konten stummschalten', 'positive', 20
  UNION ALL SELECT 'social-media', 'blocking_mute_controls', 'mute_keywords', 'Mute keywords', 'Stichwörter stummschalten', 'positive', 30
  UNION ALL SELECT 'social-media', 'blocking_mute_controls', 'block_domains_instances', 'Block domains/instances', 'Domains/Instanzen blockieren', 'positive', 40
  UNION ALL SELECT 'social-media', 'blocking_mute_controls', 'hide_replies', 'Hide replies', 'Antworten ausblenden', 'positive', 50
  UNION ALL SELECT 'social-media', 'blocking_mute_controls', 'restrict_accounts', 'Restrict accounts', 'Konten einschränken', 'positive', 60
  UNION ALL SELECT 'social-media', 'sensitive_content_controls', 'content_warnings', 'Content warnings', 'Inhaltswarnungen', 'positive', 10
  UNION ALL SELECT 'social-media', 'sensitive_content_controls', 'nsfw_labels', 'NSFW/sensitive labels', 'NSFW-/Sensibel-Labels', 'positive', 20
  UNION ALL SELECT 'social-media', 'sensitive_content_controls', 'media_blur', 'Media blur', 'Medien weichzeichnen', 'positive', 30
  UNION ALL SELECT 'social-media', 'sensitive_content_controls', 'age_gate', 'Age gate', 'Altersabfrage', 'neutral', 40
  UNION ALL SELECT 'social-media', 'sensitive_content_controls', 'user_filters', 'User filters', 'Nutzerfilter', 'positive', 50
  UNION ALL SELECT 'social-media', 'sensitive_content_controls', 'parental_controls', 'Parental controls', 'Jugendschutzkontrollen', 'neutral', 60
  UNION ALL SELECT 'social-media', 'moderation_model', 'centralized_platform', 'Centralized platform', 'Zentralisierte Plattform', 'neutral', 10
  UNION ALL SELECT 'social-media', 'moderation_model', 'federated_instance', 'Federated instance', 'Föderierte Instanz', 'tradeoff', 20
  UNION ALL SELECT 'social-media', 'moderation_model', 'community_moderated', 'Community-moderated', 'Community-moderiert', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'moderation_model', 'user_moderated', 'User-moderated', 'Nutzer-moderiert', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'moderation_model', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 50
  UNION ALL SELECT 'social-media', 'community_admin_tools', 'roles_permissions', 'Roles/permissions', 'Rollen/Berechtigungen', 'positive', 10
  UNION ALL SELECT 'social-media', 'community_admin_tools', 'member_bans', 'Member bans/removal', 'Mitglieder sperren/entfernen', 'positive', 20
  UNION ALL SELECT 'social-media', 'community_admin_tools', 'moderation_queue', 'Moderation queue', 'Moderationswarteschlange', 'positive', 30
  UNION ALL SELECT 'social-media', 'community_admin_tools', 'pinned_posts', 'Pinned posts', 'Angepinnte Beiträge', 'neutral', 40
  UNION ALL SELECT 'social-media', 'community_admin_tools', 'rule_posts', 'Published rules', 'Veröffentlichte Regeln', 'positive', 50
  UNION ALL SELECT 'social-media', 'community_admin_tools', 'moderator_logs', 'Moderator logs', 'Moderationsprotokolle', 'positive', 60
  UNION ALL SELECT 'social-media', 'reporting_enforcement_tools', 'user_reports', 'User reports', 'Nutzermeldungen', 'positive', 10
  UNION ALL SELECT 'social-media', 'reporting_enforcement_tools', 'spam_reports', 'Spam reports', 'Spam-Meldungen', 'positive', 20
  UNION ALL SELECT 'social-media', 'reporting_enforcement_tools', 'abuse_reports', 'Abuse/harassment reports', 'Missbrauchs-/Belästigungsmeldungen', 'positive', 30
  UNION ALL SELECT 'social-media', 'reporting_enforcement_tools', 'copyright_reports', 'Copyright reports', 'Urheberrechtsmeldungen', 'neutral', 40
  UNION ALL SELECT 'social-media', 'reporting_enforcement_tools', 'trusted_flaggers', 'Trusted flaggers', 'Vertrauenswürdige Melder', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'moderation_transparency', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'social-media', 'moderation_transparency', 'public_rules_only', 'Public rules only', 'Nur öffentliche Regeln', 'neutral', 20
  UNION ALL SELECT 'social-media', 'moderation_transparency', 'transparency_report', 'Transparency report', 'Transparenzbericht', 'positive', 30
  UNION ALL SELECT 'social-media', 'moderation_transparency', 'per_action_notices', 'Per-action notices', 'Hinweise je Maßnahme', 'positive', 40
  UNION ALL SELECT 'social-media', 'moderation_transparency', 'public_modlog', 'Public moderation log', 'Öffentliches Moderationsprotokoll', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'network_architecture', 'centralized_hosted', 'Centralized hosted service', 'Zentral gehosteter Dienst', 'neutral', 10
  UNION ALL SELECT 'social-media', 'network_architecture', 'federated', 'Federated', 'Föderiert', 'positive', 20
  UNION ALL SELECT 'social-media', 'network_architecture', 'decentralized_protocol', 'Decentralized protocol', 'Dezentrales Protokoll', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'network_architecture', 'peer_to_peer', 'Peer-to-peer', 'Peer-to-peer', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'network_architecture', 'self_hosted_instance', 'Self-hosted instance', 'Selbstgehostete Instanz', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'federation_protocols', 'activitypub', 'ActivityPub', 'ActivityPub', 'positive', 10
  UNION ALL SELECT 'social-media', 'federation_protocols', 'at_protocol', 'AT Protocol', 'AT Protocol', 'tradeoff', 20
  UNION ALL SELECT 'social-media', 'federation_protocols', 'nostr', 'Nostr', 'Nostr', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'federation_protocols', 'diaspora_protocol', 'Diaspora protocol', 'Diaspora-Protokoll', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'federation_protocols', 'rss_websub', 'RSS/WebSub', 'RSS/WebSub', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'federation_protocols', 'custom_bridge', 'Custom bridge', 'Eigene Bridge', 'tradeoff', 60
  UNION ALL SELECT 'social-media', 'account_migration_supported', 'unsupported', 'Unsupported', 'Nicht unterstützt', 'warning', 10
  UNION ALL SELECT 'social-media', 'account_migration_supported', 'data_export_only', 'Data export only', 'Nur Datenexport', 'neutral', 20
  UNION ALL SELECT 'social-media', 'account_migration_supported', 'handle_redirect', 'Handle/profile redirect', 'Handle-/Profil-Weiterleitung', 'neutral', 30
  UNION ALL SELECT 'social-media', 'account_migration_supported', 'follower_migration', 'Follower migration', 'Follower-Migration', 'positive', 40
  UNION ALL SELECT 'social-media', 'account_migration_supported', 'full_account_move', 'Full account move', 'Vollständiger Kontoumzug', 'positive', 50
  UNION ALL SELECT 'social-media', 'ads_model', 'none', 'No ads', 'Keine Anzeigen', 'positive', 10
  UNION ALL SELECT 'social-media', 'ads_model', 'contextual_ads', 'Contextual ads', 'Kontextanzeigen', 'neutral', 20
  UNION ALL SELECT 'social-media', 'ads_model', 'personalized_ads', 'Personalized ads', 'Personalisierte Anzeigen', 'warning', 30
  UNION ALL SELECT 'social-media', 'ads_model', 'promoted_posts', 'Promoted posts', 'Gesponserte Beiträge', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'ads_model', 'creator_sponsored', 'Creator-sponsored content', 'Creator-Sponsoring', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'ads_model', 'unclear', 'Unclear', 'Unklar', 'warning', 60
  UNION ALL SELECT 'social-media', 'ad_personalization_controls', 'opt_out_personalized_ads', 'Personalized-ads opt-out', 'Opt-out für personalisierte Anzeigen', 'positive', 10
  UNION ALL SELECT 'social-media', 'ad_personalization_controls', 'interest_controls', 'Ad interest controls', 'Anzeigeninteressen-Kontrollen', 'positive', 20
  UNION ALL SELECT 'social-media', 'ad_personalization_controls', 'third_party_tracking_controls', 'Third-party tracking controls', 'Kontrollen für Drittanbieter-Tracking', 'positive', 30
  UNION ALL SELECT 'social-media', 'ad_personalization_controls', 'ad_topic_controls', 'Ad topic controls', 'Anzeigen-Themenkontrollen', 'positive', 40
  UNION ALL SELECT 'social-media', 'ad_personalization_controls', 'no_ads_paid_tier', 'No-ads paid tier', 'Anzeigenfreier Bezahltarif', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'ad_personalization_controls', 'not_applicable', 'Not applicable/no ads', 'Nicht anwendbar/keine Anzeigen', 'neutral', 60
  UNION ALL SELECT 'social-media', 'creator_monetization_tools', 'tips_donations', 'Tips/donations', 'Trinkgelder/Spenden', 'neutral', 10
  UNION ALL SELECT 'social-media', 'creator_monetization_tools', 'subscriptions', 'Subscriptions', 'Abos', 'tradeoff', 20
  UNION ALL SELECT 'social-media', 'creator_monetization_tools', 'paid_posts', 'Paid posts', 'Bezahlte Beiträge', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'creator_monetization_tools', 'revenue_share', 'Revenue share', 'Umsatzbeteiligung', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'creator_monetization_tools', 'paid_events', 'Paid events', 'Bezahlte Events', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'creator_monetization_tools', 'creator_marketplace', 'Creator marketplace', 'Creator-Marktplatz', 'tradeoff', 60
  UNION ALL SELECT 'social-media', 'commerce_fundraising_tools', 'shop_links', 'Shop links', 'Shop-Links', 'neutral', 10
  UNION ALL SELECT 'social-media', 'commerce_fundraising_tools', 'product_catalog', 'Product catalog', 'Produktkatalog', 'neutral', 20
  UNION ALL SELECT 'social-media', 'commerce_fundraising_tools', 'fundraisers', 'Fundraisers', 'Spendenaktionen', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'commerce_fundraising_tools', 'ticketed_events', 'Ticketed events', 'Ticket-Events', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'commerce_fundraising_tools', 'lead_forms', 'Lead forms', 'Lead-Formulare', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'social-media', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 20
  UNION ALL SELECT 'social-media', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 30
  UNION ALL SELECT 'social-media', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 40
  UNION ALL SELECT 'social-media', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 50
  UNION ALL SELECT 'social-media', 'supported_platforms', 'linux', 'Linux', 'Linux', 'positive', 60
  UNION ALL SELECT 'social-media', 'supported_platforms', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 70
  UNION ALL SELECT 'social-media', 'developer_api', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'social-media', 'developer_api', 'read_only', 'Read-only API', 'Nur-lesende API', 'neutral', 20
  UNION ALL SELECT 'social-media', 'developer_api', 'public_write_api', 'Public write API', 'Öffentliche Schreib-API', 'positive', 30
  UNION ALL SELECT 'social-media', 'developer_api', 'paid_api', 'Paid API', 'Bezahlte API', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'developer_api', 'self_hosted_api', 'Self-hosted API', 'Selbstgehostete API', 'tradeoff', 50
  UNION ALL SELECT 'social-media', 'developer_api', 'undocumented', 'Undocumented/limited', 'Nicht dokumentiert/begrenzt', 'warning', 60
  UNION ALL SELECT 'social-media', 'accessibility_features', 'alt_text', 'Alt text', 'Alternativtext', 'positive', 10
  UNION ALL SELECT 'social-media', 'accessibility_features', 'captions', 'Captions/subtitles', 'Untertitel', 'positive', 20
  UNION ALL SELECT 'social-media', 'accessibility_features', 'keyboard_navigation', 'Keyboard navigation', 'Tastaturnavigation', 'positive', 30
  UNION ALL SELECT 'social-media', 'accessibility_features', 'screen_reader_labels', 'Screen-reader labels', 'Screenreader-Labels', 'positive', 40
  UNION ALL SELECT 'social-media', 'accessibility_features', 'reduced_motion', 'Reduced motion', 'Reduzierte Bewegung', 'positive', 50
  UNION ALL SELECT 'social-media', 'accessibility_features', 'language_translation', 'Language translation', 'Sprachübersetzung', 'neutral', 60
  UNION ALL SELECT 'social-media', 'fit_profiles', 'friends_family', 'Friends and family', 'Freunde und Familie', 'neutral', 10
  UNION ALL SELECT 'social-media', 'fit_profiles', 'creators', 'Creators', 'Creator', 'neutral', 20
  UNION ALL SELECT 'social-media', 'fit_profiles', 'journalists_public_figures', 'Journalists/public figures', 'Journalisten/öffentliche Personen', 'tradeoff', 30
  UNION ALL SELECT 'social-media', 'fit_profiles', 'communities', 'Communities', 'Communities', 'tradeoff', 40
  UNION ALL SELECT 'social-media', 'fit_profiles', 'professional_networking', 'Professional networking', 'Berufliches Netzwerken', 'neutral', 50
  UNION ALL SELECT 'social-media', 'fit_profiles', 'nonprofits_campaigns', 'Nonprofits/campaigns', 'Gemeinnützige/Kampagnen', 'tradeoff', 60
  UNION ALL SELECT 'social-media', 'fit_profiles', 'self_hosters', 'Self-hosters', 'Selbsthoster', 'tradeoff', 70
  UNION ALL SELECT 'social-media', 'fit_profiles', 'low_algorithm_users', 'Low-algorithm users', 'Nutzer mit wenig Algorithmus', 'positive', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'social-media'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'social-media'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('011-social-media-matrix-criteria');
