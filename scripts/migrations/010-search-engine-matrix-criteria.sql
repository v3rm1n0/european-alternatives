-- Migration 010: Define Search Engine category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('search-engine', 'result_source', 'Result Source & Index', 'Ergebnisquelle & Index', 'Where search results come from, including index ownership, upstream sources, freshness, and regional controls.', 'Woher Suchergebnisse stammen, einschließlich Index-Eigentum, Upstream-Quellen, Aktualität und Regionskontrollen.', 100),
  ('search-engine', 'privacy_personalization', 'Privacy & Personalization', 'Datenschutz & Personalisierung', 'Search-specific account requirements, query logs, IP handling, cookies, trackers, and personalization behavior.', 'Suchspezifische Kontoanforderungen, Suchlogs, IP-Umgang, Cookies, Tracker und Personalisierungsverhalten.', 200),
  ('search-engine', 'query_controls', 'Query Controls', 'Suchsteuerung', 'Advanced operators, filters, ranking controls, result-page aids, and query assistance.', 'Erweiterte Operatoren, Filter, Ranking-Kontrollen, Hilfen auf der Ergebnisseite und Anfragehilfe.', 300),
  ('search-engine', 'result_types', 'Result Types & Verticals', 'Ergebnistypen & Vertikale', 'Supported search verticals and controls for images, news, maps, local, and multimedia results.', 'Unterstützte Suchvertikale und Kontrollen für Bilder, Nachrichten, Karten, lokale und Multimedia-Ergebnisse.', 400),
  ('search-engine', 'ai_answers', 'AI & Answer Features', 'KI- & Antwortfunktionen', 'AI summaries, source citations, data-use controls, and non-AI instant answer features.', 'KI-Zusammenfassungen, Quellenangaben, Datennutzungskontrollen und Nicht-KI-Sofortantworten.', 500),
  ('search-engine', 'ads_commercial', 'Ads & Commercial Model', 'Anzeigen & Geschäftsmodell', 'Search ads, labeling, affiliate or shopping links, subscriptions, and paid access models.', 'Suchanzeigen, Kennzeichnung, Affiliate- oder Shopping-Links, Abos und Bezahlmodelle.', 600),
  ('search-engine', 'access_integrations', 'Access & Integrations', 'Zugriff & Integrationen', 'Ways to access the search engine, browser integration, APIs, self-hosting, and OpenSearch support.', 'Zugriffswege zur Suchmaschine, Browser-Integration, APIs, Selbsthosting und OpenSearch-Unterstützung.', 700),
  ('search-engine', 'safety_transparency', 'Safety & Transparency', 'Sicherheit & Transparenz', 'Safe search, malware warnings, removal transparency, and visible result transparency signals.', 'Safe Search, Malware-Warnungen, Transparenz bei Entfernungen und sichtbare Transparenzsignale in Ergebnissen.', 800),
  ('search-engine', 'fit_profiles', 'Fit Profiles', 'Eignungsprofile', 'Common user profiles and query types the search engine is suited to support.', 'Typische Nutzerprofile und Anfragearten, für die die Suchmaschine geeignet ist.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'search-engine' AS category_id, 'result_source' AS group_key, 'search_source_model' AS criterion_key, 'Search source model' AS label_en, 'Suchquellenmodell' AS label_de, 'enum' AS value_type, 'tradeoff' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The documented model used to source web results, such as own index, metasearch, upstream API, hybrid, vertical, or self-hosted mode.' AS help_text_en, 'Das dokumentierte Modell für Web-Ergebnisse, etwa eigener Index, Metasuche, Upstream-API, Hybrid, vertikal oder selbstgehostet.' AS help_text_de
  UNION ALL SELECT 'search-engine', 'result_source', 'upstream_result_sources', 'Upstream result sources', 'Upstream-Ergebnisquellen', 'multi_enum', 'informational', 'multi_select', 1020, 'Search result providers or upstream indexes documented as feeding the result set.', 'Dokumentierte Anbieter oder Upstream-Indizes, die den Ergebnisbestand speisen.'
  UNION ALL SELECT 'search-engine', 'result_source', 'own_web_index', 'Own web index', 'Eigener Webindex', 'boolean', 'informational', 'optional', 1030, 'Whether the service documents crawling or operating its own general web index.', 'Ob der Dienst dokumentiert, einen eigenen allgemeinen Webindex zu crawlen oder zu betreiben.'
  UNION ALL SELECT 'search-engine', 'result_source', 'result_freshness_controls', 'Result freshness controls', 'Frische-Kontrollen für Ergebnisse', 'multi_enum', 'beneficial', 'multi_select', 1040, 'Controls users can apply to prefer recent, date-limited, sorted, or cached results.', 'Kontrollen, mit denen Nutzer aktuelle, zeitlich begrenzte, sortierte oder zwischengespeicherte Ergebnisse bevorzugen können.'
  UNION ALL SELECT 'search-engine', 'result_source', 'regional_language_controls', 'Region and language controls', 'Regions- und Sprachkontrollen', 'multi_enum', 'beneficial', 'multi_select', 1050, 'Controls for country, region, interface language, result language, location override, or location bias.', 'Kontrollen für Land, Region, Oberflächensprache, Ergebnissprache, Standortvorgabe oder Standortgewichtung.'
  UNION ALL SELECT 'search-engine', 'privacy_personalization', 'account_required_for_search', 'Account required for search', 'Konto für Suche erforderlich', 'boolean', 'risk', 'must_match', 2010, 'Whether ordinary web searches require signing in before results can be viewed.', 'Ob normale Websuchen eine Anmeldung erfordern, bevor Ergebnisse angezeigt werden.'
  UNION ALL SELECT 'search-engine', 'privacy_personalization', 'query_logging_retention', 'Query logging retention', 'Speicherdauer für Suchanfragen', 'enum', 'risk', 'optional', 2020, 'The documented retention model for search queries or personal search history.', 'Das dokumentierte Aufbewahrungsmodell für Suchanfragen oder persönliche Suchhistorie.'
  UNION ALL SELECT 'search-engine', 'privacy_personalization', 'ip_address_handling', 'IP address handling', 'Umgang mit IP-Adressen', 'enum', 'risk', 'optional', 2030, 'How IP addresses are logged, anonymized, proxied, retained, or used for personalization in search.', 'Wie IP-Adressen bei der Suche gespeichert, anonymisiert, weitergeleitet, aufbewahrt oder für Personalisierung genutzt werden.'
  UNION ALL SELECT 'search-engine', 'privacy_personalization', 'personalized_results', 'Personalized results', 'Personalisierte Ergebnisse', 'enum', 'tradeoff', 'optional', 2040, 'Whether result ranking or suggestions are personalized, optional, account based, on by default, or unclear.', 'Ob Ergebnisranking oder Vorschläge personalisiert, optional, kontobasiert, standardmäßig aktiv oder unklar sind.'
  UNION ALL SELECT 'search-engine', 'privacy_personalization', 'cookie_free_search', 'Cookie-free search', 'Suche ohne Cookies', 'boolean', 'beneficial', 'optional', 2050, 'Whether basic web search can be used without accepting or relying on cookies.', 'Ob grundlegende Websuche ohne Akzeptieren oder Nutzen von Cookies möglich ist.'
  UNION ALL SELECT 'search-engine', 'privacy_personalization', 'third_party_trackers_on_results', 'Third-party trackers on result pages', 'Drittanbieter-Tracker auf Ergebnisseiten', 'boolean', 'risk', 'optional', 2060, 'Whether search result pages document or expose third-party tracking scripts, pixels, or similar trackers.', 'Ob Suchergebnisseiten Drittanbieter-Tracking-Skripte, Pixel oder ähnliche Tracker dokumentieren oder ausliefern.'
  UNION ALL SELECT 'search-engine', 'query_controls', 'advanced_search_operators', 'Advanced search operators', 'Erweiterte Suchoperatoren', 'multi_enum', 'beneficial', 'multi_select', 3010, 'Advanced query syntax documented for exact matches, exclusions, site limits, file types, Boolean logic, title, or URL matching.', 'Dokumentierte erweiterte Suchsyntax für exakte Treffer, Ausschlüsse, Site-Begrenzung, Dateitypen, Boolesche Logik, Titel oder URL-Treffer.'
  UNION ALL SELECT 'search-engine', 'query_controls', 'search_filter_controls', 'Search filter controls', 'Suchfilter-Kontrollen', 'multi_enum', 'beneficial', 'multi_select', 3020, 'Search filters users can apply for date, region, language, safe search, content type, license, or source.', 'Suchfilter für Datum, Region, Sprache, Safe Search, Inhaltstyp, Lizenz oder Quelle.'
  UNION ALL SELECT 'search-engine', 'query_controls', 'ranking_customization', 'Ranking customization', 'Ranking-Anpassung', 'multi_enum', 'tradeoff', 'multi_select', 3030, 'User controls that block, boost, lens, prefer, rerank, or disable ranking customization.', 'Nutzerkontrollen zum Blockieren, Hervorheben, Linsen, Bevorzugen, Neusortieren oder Deaktivieren von Ranking-Anpassung.'
  UNION ALL SELECT 'search-engine', 'query_controls', 'result_page_features', 'Result page features', 'Funktionen der Ergebnisseite', 'multi_enum', 'informational', 'multi_select', 3040, 'Result page aids such as snippets, cached pages, knowledge panels, related questions, suggestions, or source labels.', 'Hilfen auf der Ergebnisseite wie Auszüge, Cache-Seiten, Wissenspanels, verwandte Fragen, Vorschläge oder Quellenhinweise.'
  UNION ALL SELECT 'search-engine', 'query_controls', 'spelling_query_assistance', 'Spelling and query assistance', 'Rechtschreib- und Anfragehilfe', 'multi_enum', 'informational', 'multi_select', 3050, 'Assistance features for spelling correction, autocomplete, related searches, or synonym expansion.', 'Hilfsfunktionen für Rechtschreibkorrektur, Autovervollständigung, verwandte Suchanfragen oder Synonymerweiterung.'
  UNION ALL SELECT 'search-engine', 'result_types', 'vertical_search_types', 'Vertical search types', 'Vertikale Suchtypen', 'multi_enum', 'informational', 'multi_select', 4010, 'Dedicated or documented verticals such as web, images, video, news, maps, shopping, academic, forums, or code.', 'Eigene oder dokumentierte Vertikale wie Web, Bilder, Video, Nachrichten, Karten, Shopping, Wissenschaft, Foren oder Code.'
  UNION ALL SELECT 'search-engine', 'result_types', 'image_search_filters', 'Image search filters', 'Bildsuchfilter', 'multi_enum', 'beneficial', 'multi_select', 4020, 'Image search controls for size, color, type, license, freshness, or safe search.', 'Bildsuchkontrollen für Größe, Farbe, Typ, Lizenz, Aktualität oder Safe Search.'
  UNION ALL SELECT 'search-engine', 'result_types', 'news_search_controls', 'News search controls', 'Nachrichten-Suchkontrollen', 'multi_enum', 'informational', 'multi_select', 4030, 'News search controls for a dedicated vertical, source, date, region, or publisher labels.', 'Nachrichten-Suchkontrollen für eine eigene Vertikale, Quelle, Datum, Region oder Herausgeberhinweise.'
  UNION ALL SELECT 'search-engine', 'result_types', 'maps_local_model', 'Maps and local search model', 'Karten- und Lokalsuchmodell', 'enum', 'tradeoff', 'optional', 4040, 'How maps and local results are provided, absent, built in, partner sourced, OpenStreetMap based, or linked externally.', 'Wie Karten- und Lokalergebnisse bereitgestellt werden, nicht vorhanden, integriert, partnerbasiert, OpenStreetMap-basiert oder extern verlinkt.'
  UNION ALL SELECT 'search-engine', 'result_types', 'multimedia_search_controls', 'Multimedia search controls', 'Multimedia-Suchkontrollen', 'multi_enum', 'informational', 'multi_select', 4050, 'Controls for multimedia results such as duration, source site, resolution, reverse image upload, transcript, or caption search.', 'Kontrollen für Multimedia-Ergebnisse wie Dauer, Quellseite, Auflösung, Rückwärtsbild-Upload, Transkript- oder Untertitelsuche.'
  UNION ALL SELECT 'search-engine', 'ai_answers', 'ai_answer_mode', 'AI answer mode', 'KI-Antwortmodus', 'enum', 'tradeoff', 'optional', 5010, 'Whether AI answers are absent, optional, separate, shown by default, or default with opt-out.', 'Ob KI-Antworten fehlen, optional sind, separat angeboten werden, standardmäßig erscheinen oder mit Opt-out aktiv sind.'
  UNION ALL SELECT 'search-engine', 'ai_answers', 'ai_source_citations', 'AI source citations', 'Quellenangaben für KI', 'enum', 'informational', 'optional', 5020, 'How AI answer sources are shown, such as links, inline citations, quotes, not applicable, or unclear.', 'Wie Quellen für KI-Antworten angezeigt werden, etwa Links, Inline-Quellenangaben, Zitate, nicht anwendbar oder unklar.'
  UNION ALL SELECT 'search-engine', 'ai_answers', 'ai_data_use_controls', 'AI data-use controls', 'Kontrollen zur KI-Datennutzung', 'enum', 'risk', 'optional', 5030, 'Controls or policies for whether search data is used for AI training or related AI features.', 'Kontrollen oder Richtlinien dazu, ob Suchdaten für KI-Training oder verwandte KI-Funktionen genutzt werden.'
  UNION ALL SELECT 'search-engine', 'ai_answers', 'non_ai_instant_answers', 'Non-AI instant answers', 'Nicht-KI-Sofortantworten', 'multi_enum', 'informational', 'multi_select', 5040, 'Non-AI answer modules such as calculator, conversion, weather, dictionary, encyclopedia, finance, sports, or time zones.', 'Nicht-KI-Antwortmodule wie Rechner, Umrechnung, Wetter, Wörterbuch, Enzyklopädie, Finanzen, Sport oder Zeitzonen.'
  UNION ALL SELECT 'search-engine', 'ads_commercial', 'search_ads_model', 'Search ads model', 'Suchanzeigenmodell', 'enum', 'tradeoff', 'optional', 6010, 'The documented model for ads in search results, including none, contextual, keyword, personalized, shopping, or unclear modes.', 'Das dokumentierte Modell für Anzeigen in Suchergebnissen, einschließlich keine, kontextbezogen, Keyword, personalisiert, Shopping oder unklar.'
  UNION ALL SELECT 'search-engine', 'ads_commercial', 'ad_labeling_clarity', 'Ad labeling clarity', 'Klarheit der Anzeigenkennzeichnung', 'enum', 'informational', 'optional', 6020, 'How sponsored results are labeled or separated from organic search results.', 'Wie gesponserte Ergebnisse gekennzeichnet oder von organischen Suchergebnissen getrennt werden.'
  UNION ALL SELECT 'search-engine', 'ads_commercial', 'affiliate_shopping_links', 'Affiliate or shopping links', 'Affiliate- oder Shopping-Links', 'boolean', 'tradeoff', 'optional', 6030, 'Whether result pages include documented affiliate links, shopping placements, or similar commercial links.', 'Ob Ergebnisseiten dokumentierte Affiliate-Links, Shopping-Platzierungen oder ähnliche kommerzielle Links enthalten.'
  UNION ALL SELECT 'search-engine', 'ads_commercial', 'subscription_or_paid_tier', 'Subscription or paid tier', 'Abo- oder Bezahlmodell', 'enum', 'tradeoff', 'optional', 6040, 'Whether search is free only, has a paid tier, requires payment, accepts donations, or is self-hosted free software.', 'Ob die Suche nur kostenlos ist, einen Bezahltarif hat, Zahlung verlangt, Spenden annimmt oder selbstgehostete freie Software ist.'
  UNION ALL SELECT 'search-engine', 'access_integrations', 'access_paths', 'Access paths', 'Zugriffswege', 'multi_enum', 'informational', 'multi_select', 7010, 'Documented ways to use the search engine, including web, mobile web, extensions, apps, onion service, API, or self-hosted deployment.', 'Dokumentierte Nutzungswege der Suchmaschine, einschließlich Web, mobiles Web, Erweiterungen, Apps, Onion-Dienst, API oder selbstgehostete Bereitstellung.'
  UNION ALL SELECT 'search-engine', 'access_integrations', 'browser_default_support', 'Browser default-search support', 'Unterstützung als Browser-Standardsuche', 'boolean', 'beneficial', 'optional', 7020, 'Whether the service documents support for use as a browser default search engine.', 'Ob der Dienst die Nutzung als Browser-Standardsuche dokumentiert.'
  UNION ALL SELECT 'search-engine', 'access_integrations', 'developer_api', 'Developer API', 'Entwickler-API', 'enum', 'tradeoff', 'optional', 7030, 'The documented availability and model of search APIs for developers or teams.', 'Die dokumentierte Verfügbarkeit und das Modell von Such-APIs für Entwickler oder Teams.'
  UNION ALL SELECT 'search-engine', 'access_integrations', 'self_hosting_available', 'Self-hosting available', 'Selbsthosting verfügbar', 'boolean', 'tradeoff', 'optional', 7040, 'Whether users can deploy or operate the search engine or metasearch software themselves.', 'Ob Nutzer die Suchmaschine oder Metasuchsoftware selbst bereitstellen oder betreiben können.'
  UNION ALL SELECT 'search-engine', 'access_integrations', 'opensearch_description_support', 'OpenSearch description support', 'OpenSearch-Description-Unterstützung', 'boolean', 'beneficial', 'optional', 7050, 'Whether an OpenSearch description is documented for browser search integration.', 'Ob eine OpenSearch-Description für Browser-Suchintegration dokumentiert ist.'
  UNION ALL SELECT 'search-engine', 'safety_transparency', 'safe_search_controls', 'Safe search controls', 'Safe-Search-Kontrollen', 'enum', 'informational', 'optional', 8010, 'The documented model for safe search controls, from none to granular or lockable profiles.', 'Das dokumentierte Modell für Safe-Search-Kontrollen, von keine bis granular oder sperrbare Profile.'
  UNION ALL SELECT 'search-engine', 'safety_transparency', 'malware_phishing_warnings', 'Malware and phishing warnings', 'Malware- und Phishing-Warnungen', 'boolean', 'beneficial', 'optional', 8020, 'Whether result pages document warnings for malware, phishing, unsafe links, or similar threats.', 'Ob Ergebnisseiten Warnungen vor Malware, Phishing, unsicheren Links oder ähnlichen Bedrohungen dokumentieren.'
  UNION ALL SELECT 'search-engine', 'safety_transparency', 'content_removal_transparency', 'Content removal transparency', 'Transparenz bei Inhaltsentfernung', 'enum', 'informational', 'optional', 8030, 'How the service documents removal policies, reports, per-result notices, or appeal processes.', 'Wie der Dienst Entfernungsrichtlinien, Berichte, Hinweise pro Ergebnis oder Einspruchsverfahren dokumentiert.'
  UNION ALL SELECT 'search-engine', 'safety_transparency', 'result_transparency_signals', 'Result transparency signals', 'Transparenzsignale in Ergebnissen', 'multi_enum', 'informational', 'multi_select', 8040, 'Visible signals in results such as source ownership, publication date, cache, ranking explanation, ad disclosure, or AI disclosure.', 'Sichtbare Signale in Ergebnissen wie Quelleninhaber, Veröffentlichungsdatum, Cache, Ranking-Erklärung, Anzeigenhinweis oder KI-Hinweis.'
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9010, 'Common user profiles the search engine is especially suited to support.', 'Typische Nutzerprofile, für die die Suchmaschine besonders geeignet ist.'
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'best_query_types', 'Best query types', 'Beste Anfragearten', 'multi_enum', 'informational', 'multi_select', 9020, 'Query types where the service documents or commonly supports a strong product fit.', 'Anfragearten, für die der Dienst eine starke Eignung dokumentiert oder typischerweise unterstützt.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'search-engine' AS category_id, 'search_source_model' AS criterion_key, 'own_index' AS option_key, 'Own web index' AS label_en, 'Eigener Webindex' AS label_de, 'positive' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'search-engine', 'search_source_model', 'metasearch', 'Metasearch aggregator', 'Metasuch-Aggregator', 'tradeoff', 20
  UNION ALL SELECT 'search-engine', 'search_source_model', 'upstream_api_proxy', 'Upstream API/proxy', 'Upstream-API/Proxy', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'search_source_model', 'hybrid', 'Hybrid index and upstream sources', 'Hybrid aus Index und Upstream-Quellen', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'search_source_model', 'curated_vertical', 'Curated or vertical index', 'Kuratierter oder vertikaler Index', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'search_source_model', 'self_hosted_instance', 'Self-hosted instance', 'Selbstgehostete Instanz', 'tradeoff', 60
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'own_index', 'Own index', 'Eigener Index', 'positive', 10
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'bing', 'Bing', 'Bing', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'google', 'Google', 'Google', 'warning', 30
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'brave_search', 'Brave Search', 'Brave Search', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'mojeek', 'Mojeek', 'Mojeek', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'open_web_index', 'Open web index', 'Offener Webindex', 'positive', 60
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'wikimedia', 'Wikimedia/Wikipedia', 'Wikimedia/Wikipedia', 'neutral', 70
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'openstreetmap', 'OpenStreetMap', 'OpenStreetMap', 'positive', 80
  UNION ALL SELECT 'search-engine', 'upstream_result_sources', 'user_configured', 'User-configured engines', 'Nutzerkonfigurierte Suchmaschinen', 'tradeoff', 90
  UNION ALL SELECT 'search-engine', 'result_freshness_controls', 'date_range', 'Date range filter', 'Zeitraumfilter', 'positive', 10
  UNION ALL SELECT 'search-engine', 'result_freshness_controls', 'recent_results', 'Recent results filter', 'Filter für aktuelle Ergebnisse', 'positive', 20
  UNION ALL SELECT 'search-engine', 'result_freshness_controls', 'news_freshness', 'News freshness sorting', 'Aktualitätssortierung für Nachrichten', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'result_freshness_controls', 'sort_by_date', 'Sort by date', 'Nach Datum sortieren', 'positive', 40
  UNION ALL SELECT 'search-engine', 'result_freshness_controls', 'cached_snapshot', 'Cached snapshot', 'Zwischengespeicherte Kopie', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'regional_language_controls', 'country_region', 'Country or region selector', 'Länder- oder Regionsauswahl', 'positive', 10
  UNION ALL SELECT 'search-engine', 'regional_language_controls', 'interface_language', 'Interface language', 'Oberflächensprache', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'regional_language_controls', 'result_language', 'Result language filter', 'Ergebnissprache-Filter', 'positive', 30
  UNION ALL SELECT 'search-engine', 'regional_language_controls', 'location_override', 'Manual location override', 'Manuelle Standortvorgabe', 'positive', 40
  UNION ALL SELECT 'search-engine', 'regional_language_controls', 'no_location_bias', 'No location bias option', 'Option ohne Standortgewichtung', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'query_logging_retention', 'no_personal_logs', 'No personal query logs', 'Keine personenbezogenen Suchlogs', 'positive', 10
  UNION ALL SELECT 'search-engine', 'query_logging_retention', 'short_retention', 'Short retention window', 'Kurze Speicherdauer', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'query_logging_retention', 'anonymized_aggregate', 'Anonymized aggregate logs', 'Anonymisierte aggregierte Logs', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'query_logging_retention', 'account_history_optional', 'Optional account history', 'Optionale Kontohistorie', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'query_logging_retention', 'personalized_history', 'Personalized search history', 'Personalisierte Suchhistorie', 'warning', 50
  UNION ALL SELECT 'search-engine', 'query_logging_retention', 'unclear', 'Unclear policy', 'Unklare Richtlinie', 'warning', 60
  UNION ALL SELECT 'search-engine', 'ip_address_handling', 'not_logged', 'Not logged', 'Nicht gespeichert', 'positive', 10
  UNION ALL SELECT 'search-engine', 'ip_address_handling', 'anonymized', 'Anonymized or truncated', 'Anonymisiert oder gekürzt', 'positive', 20
  UNION ALL SELECT 'search-engine', 'ip_address_handling', 'proxied_to_upstream', 'Proxied to upstream', 'An Upstream weitergeleitet', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'ip_address_handling', 'retained_for_security', 'Retained for security', 'Für Sicherheit gespeichert', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'ip_address_handling', 'retained_for_personalization', 'Retained for personalization', 'Für Personalisierung gespeichert', 'warning', 50
  UNION ALL SELECT 'search-engine', 'ip_address_handling', 'unclear', 'Unclear', 'Unklar', 'warning', 60
  UNION ALL SELECT 'search-engine', 'personalized_results', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'search-engine', 'personalized_results', 'optional', 'Optional', 'Optional', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'personalized_results', 'account_based', 'Account-based', 'Kontobasiert', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'personalized_results', 'default_on', 'On by default', 'Standardmäßig aktiv', 'warning', 40
  UNION ALL SELECT 'search-engine', 'personalized_results', 'unclear', 'Unclear', 'Unklar', 'warning', 50
  UNION ALL SELECT 'search-engine', 'advanced_search_operators', 'exact_phrase', 'Exact phrase', 'Exakte Phrase', 'positive', 10
  UNION ALL SELECT 'search-engine', 'advanced_search_operators', 'exclude_terms', 'Exclude terms', 'Begriffe ausschließen', 'positive', 20
  UNION ALL SELECT 'search-engine', 'advanced_search_operators', 'site_operator', 'Site operator', 'Site-Operator', 'positive', 30
  UNION ALL SELECT 'search-engine', 'advanced_search_operators', 'filetype_operator', 'File type operator', 'Dateityp-Operator', 'positive', 40
  UNION ALL SELECT 'search-engine', 'advanced_search_operators', 'boolean_operators', 'Boolean operators', 'Boolesche Operatoren', 'positive', 50
  UNION ALL SELECT 'search-engine', 'advanced_search_operators', 'title_url_operators', 'Title or URL operators', 'Titel- oder URL-Operatoren', 'neutral', 60
  UNION ALL SELECT 'search-engine', 'search_filter_controls', 'date', 'Date filter', 'Datumsfilter', 'positive', 10
  UNION ALL SELECT 'search-engine', 'search_filter_controls', 'region', 'Region filter', 'Regionsfilter', 'positive', 20
  UNION ALL SELECT 'search-engine', 'search_filter_controls', 'language', 'Language filter', 'Sprachfilter', 'positive', 30
  UNION ALL SELECT 'search-engine', 'search_filter_controls', 'safe_search', 'Safe search filter', 'Safe-Search-Filter', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'search_filter_controls', 'content_type', 'Content type filter', 'Inhaltstypfilter', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'search_filter_controls', 'license', 'License filter', 'Lizenzfilter', 'positive', 60
  UNION ALL SELECT 'search-engine', 'search_filter_controls', 'source', 'Source filter', 'Quellenfilter', 'neutral', 70
  UNION ALL SELECT 'search-engine', 'ranking_customization', 'block_domains', 'Block domains', 'Domains blockieren', 'positive', 10
  UNION ALL SELECT 'search-engine', 'ranking_customization', 'boost_domains', 'Boost domains', 'Domains hervorheben', 'tradeoff', 20
  UNION ALL SELECT 'search-engine', 'ranking_customization', 'custom_lenses', 'Custom lenses', 'Eigene Linsen', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'ranking_customization', 'preferred_sources', 'Preferred sources', 'Bevorzugte Quellen', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'ranking_customization', 'result_reranking', 'Result reranking', 'Ergebnis-Neusortierung', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'ranking_customization', 'no_customization', 'No customization', 'Keine Anpassung', 'neutral', 60
  UNION ALL SELECT 'search-engine', 'result_page_features', 'snippets', 'Result snippets', 'Ergebnisauszüge', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'result_page_features', 'cached_pages', 'Cached pages', 'Zwischengespeicherte Seiten', 'tradeoff', 20
  UNION ALL SELECT 'search-engine', 'result_page_features', 'knowledge_panels', 'Knowledge panels', 'Wissenspanels', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'result_page_features', 'related_questions', 'Related questions', 'Verwandte Fragen', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'result_page_features', 'query_suggestions', 'Query suggestions', 'Suchvorschläge', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'result_page_features', 'source_labels', 'Source labels', 'Quellenhinweise', 'positive', 60
  UNION ALL SELECT 'search-engine', 'spelling_query_assistance', 'spelling_correction', 'Spelling correction', 'Rechtschreibkorrektur', 'positive', 10
  UNION ALL SELECT 'search-engine', 'spelling_query_assistance', 'autocomplete', 'Autocomplete', 'Autovervollständigung', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'spelling_query_assistance', 'related_searches', 'Related searches', 'Verwandte Suchanfragen', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'spelling_query_assistance', 'synonym_expansion', 'Synonym expansion', 'Synonymerweiterung', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'images', 'Images', 'Bilder', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'videos', 'Videos', 'Videos', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'news', 'News', 'Nachrichten', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'maps_local', 'Maps/local', 'Karten/lokal', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'shopping', 'Shopping', 'Shopping', 'tradeoff', 60
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'academic', 'Academic', 'Wissenschaft', 'positive', 70
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'forums_discussions', 'Forums/discussions', 'Foren/Diskussionen', 'neutral', 80
  UNION ALL SELECT 'search-engine', 'vertical_search_types', 'code', 'Code', 'Code', 'neutral', 90
  UNION ALL SELECT 'search-engine', 'image_search_filters', 'size', 'Size', 'Größe', 'positive', 10
  UNION ALL SELECT 'search-engine', 'image_search_filters', 'color', 'Color', 'Farbe', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'image_search_filters', 'type', 'Type', 'Typ', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'image_search_filters', 'license', 'License', 'Lizenz', 'positive', 40
  UNION ALL SELECT 'search-engine', 'image_search_filters', 'freshness', 'Freshness', 'Aktualität', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'image_search_filters', 'safe_search', 'Safe search', 'Safe Search', 'neutral', 60
  UNION ALL SELECT 'search-engine', 'news_search_controls', 'dedicated_news', 'Dedicated news vertical', 'Eigene Nachrichten-Vertikale', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'news_search_controls', 'source_filter', 'Source filter', 'Quellenfilter', 'positive', 20
  UNION ALL SELECT 'search-engine', 'news_search_controls', 'date_filter', 'Date filter', 'Datumsfilter', 'positive', 30
  UNION ALL SELECT 'search-engine', 'news_search_controls', 'region_filter', 'Region filter', 'Regionsfilter', 'positive', 40
  UNION ALL SELECT 'search-engine', 'news_search_controls', 'publisher_labels', 'Publisher labels', 'Herausgeberhinweise', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'maps_local_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'maps_local_model', 'built_in', 'Built-in maps/local results', 'Integrierte Karten-/Lokalergebnisse', 'positive', 20
  UNION ALL SELECT 'search-engine', 'maps_local_model', 'partner_results', 'Partner results', 'Partnerergebnisse', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'maps_local_model', 'openstreetmap_based', 'OpenStreetMap-based', 'Auf OpenStreetMap-Basis', 'positive', 40
  UNION ALL SELECT 'search-engine', 'maps_local_model', 'external_linkout', 'External link-out', 'Externe Weiterleitung', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'multimedia_search_controls', 'duration', 'Duration filter', 'Dauerfilter', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'multimedia_search_controls', 'source_site', 'Source site filter', 'Quellseitenfilter', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'multimedia_search_controls', 'resolution', 'Resolution filter', 'Auflösungsfilter', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'multimedia_search_controls', 'upload_reverse_image', 'Upload/reverse image search', 'Upload-/Rückwärtsbildsuche', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'multimedia_search_controls', 'transcript_or_caption', 'Transcript or caption search', 'Transkript- oder Untertitelsuche', 'positive', 50
  UNION ALL SELECT 'search-engine', 'ai_answer_mode', 'none', 'No AI answers', 'Keine KI-Antworten', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'ai_answer_mode', 'optional_on_demand', 'Optional on demand', 'Optional auf Abruf', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'ai_answer_mode', 'separate_assistant', 'Separate assistant', 'Separater Assistent', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'ai_answer_mode', 'default_summarization', 'Default summarization', 'Standardmäßige Zusammenfassung', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'ai_answer_mode', 'default_with_opt_out', 'Default with opt-out', 'Standard mit Opt-out', 'warning', 50
  UNION ALL SELECT 'search-engine', 'ai_source_citations', 'not_applicable', 'Not applicable', 'Nicht anwendbar', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'ai_source_citations', 'links_only', 'Links only', 'Nur Links', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'ai_source_citations', 'inline_citations', 'Inline citations', 'Inline-Quellenangaben', 'positive', 30
  UNION ALL SELECT 'search-engine', 'ai_source_citations', 'source_quotes', 'Source quotes', 'Quellenzitate', 'positive', 40
  UNION ALL SELECT 'search-engine', 'ai_source_citations', 'unclear', 'Unclear', 'Unklar', 'warning', 50
  UNION ALL SELECT 'search-engine', 'ai_data_use_controls', 'not_used_for_ai', 'Not used for AI training', 'Nicht für KI-Training genutzt', 'positive', 10
  UNION ALL SELECT 'search-engine', 'ai_data_use_controls', 'opt_in_training', 'Opt-in training', 'Opt-in für Training', 'positive', 20
  UNION ALL SELECT 'search-engine', 'ai_data_use_controls', 'opt_out_available', 'Opt-out available', 'Opt-out verfügbar', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'ai_data_use_controls', 'account_based_controls', 'Account-based controls', 'Kontobasierte Kontrollen', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'ai_data_use_controls', 'unclear', 'Unclear', 'Unklar', 'warning', 50
  UNION ALL SELECT 'search-engine', 'non_ai_instant_answers', 'calculator', 'Calculator', 'Rechner', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'non_ai_instant_answers', 'unit_conversion', 'Unit conversion', 'Einheitenumrechnung', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'non_ai_instant_answers', 'weather', 'Weather', 'Wetter', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'non_ai_instant_answers', 'dictionary', 'Dictionary', 'Wörterbuch', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'non_ai_instant_answers', 'encyclopedia', 'Encyclopedia', 'Enzyklopädie', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'non_ai_instant_answers', 'sports_finance', 'Sports/finance', 'Sport/Finanzen', 'neutral', 60
  UNION ALL SELECT 'search-engine', 'non_ai_instant_answers', 'time_zone', 'Time zone', 'Zeitzone', 'neutral', 70
  UNION ALL SELECT 'search-engine', 'search_ads_model', 'no_ads', 'No search ads', 'Keine Suchanzeigen', 'positive', 10
  UNION ALL SELECT 'search-engine', 'search_ads_model', 'contextual_ads', 'Contextual ads', 'Kontextbezogene Anzeigen', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'search_ads_model', 'keyword_ads', 'Keyword ads', 'Keyword-Anzeigen', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'search_ads_model', 'personalized_ads', 'Personalized ads', 'Personalisierte Anzeigen', 'warning', 40
  UNION ALL SELECT 'search-engine', 'search_ads_model', 'shopping_promotions', 'Shopping promotions', 'Shopping-Platzierungen', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'search_ads_model', 'unclear', 'Unclear', 'Unklar', 'warning', 60
  UNION ALL SELECT 'search-engine', 'ad_labeling_clarity', 'not_applicable', 'Not applicable', 'Nicht anwendbar', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'ad_labeling_clarity', 'explicit_labels', 'Explicit labels', 'Klare Kennzeichnung', 'positive', 20
  UNION ALL SELECT 'search-engine', 'ad_labeling_clarity', 'separated_ads', 'Visually separated ads', 'Optisch getrennte Anzeigen', 'positive', 30
  UNION ALL SELECT 'search-engine', 'ad_labeling_clarity', 'mixed_sponsored', 'Mixed sponsored results', 'Gemischte gesponserte Ergebnisse', 'warning', 40
  UNION ALL SELECT 'search-engine', 'ad_labeling_clarity', 'unclear', 'Unclear', 'Unklar', 'warning', 50
  UNION ALL SELECT 'search-engine', 'subscription_or_paid_tier', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'subscription_or_paid_tier', 'free_with_paid_tier', 'Free with paid tier', 'Kostenlos mit Bezahltarif', 'tradeoff', 20
  UNION ALL SELECT 'search-engine', 'subscription_or_paid_tier', 'paid_required', 'Paid required', 'Zahlung erforderlich', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'subscription_or_paid_tier', 'donation_supported', 'Donation supported', 'Spendenfinanziert', 'positive', 40
  UNION ALL SELECT 'search-engine', 'subscription_or_paid_tier', 'self_hosted_free', 'Self-hosted/free software', 'Selbstgehostet/freie Software', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'access_paths', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'access_paths', 'mobile_web', 'Mobile web', 'Mobiles Web', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'access_paths', 'browser_extension', 'Browser extension', 'Browser-Erweiterung', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'access_paths', 'android_app', 'Android app', 'Android-App', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'access_paths', 'ios_app', 'iOS app', 'iOS-App', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'access_paths', 'desktop_app', 'Desktop app', 'Desktop-App', 'neutral', 60
  UNION ALL SELECT 'search-engine', 'access_paths', 'tor_onion', 'Tor onion service', 'Tor-Onion-Dienst', 'positive', 70
  UNION ALL SELECT 'search-engine', 'access_paths', 'api', 'API', 'API', 'tradeoff', 80
  UNION ALL SELECT 'search-engine', 'access_paths', 'self_hosted', 'Self-hosted deployment', 'Selbstgehostete Bereitstellung', 'tradeoff', 90
  UNION ALL SELECT 'search-engine', 'developer_api', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'developer_api', 'public_search_api', 'Public search API', 'Öffentliche Such-API', 'positive', 20
  UNION ALL SELECT 'search-engine', 'developer_api', 'paid_search_api', 'Paid search API', 'Bezahlte Such-API', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'developer_api', 'self_hosted_api', 'Self-hosted API', 'Selbstgehostete API', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'developer_api', 'enterprise_api', 'Enterprise API', 'Enterprise-API', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'safe_search_controls', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'safe_search_controls', 'basic_toggle', 'Basic toggle', 'Einfacher Schalter', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'safe_search_controls', 'granular_controls', 'Granular controls', 'Granulare Kontrollen', 'positive', 30
  UNION ALL SELECT 'search-engine', 'safe_search_controls', 'locked_profiles', 'Lockable profiles', 'Sperrbare Profile', 'positive', 40
  UNION ALL SELECT 'search-engine', 'safe_search_controls', 'default_strict', 'Strict by default', 'Standardmäßig streng', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'content_removal_transparency', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'content_removal_transparency', 'policy_only', 'Policy only', 'Nur Richtlinie', 'neutral', 20
  UNION ALL SELECT 'search-engine', 'content_removal_transparency', 'transparency_report', 'Transparency report', 'Transparenzbericht', 'positive', 30
  UNION ALL SELECT 'search-engine', 'content_removal_transparency', 'per_result_notice', 'Per-result notice', 'Hinweis pro Ergebnis', 'positive', 40
  UNION ALL SELECT 'search-engine', 'content_removal_transparency', 'appeal_process', 'Appeal process', 'Einspruchsverfahren', 'positive', 50
  UNION ALL SELECT 'search-engine', 'result_transparency_signals', 'source_owner_label', 'Source owner label', 'Hinweis zum Quelleninhaber', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'result_transparency_signals', 'date_published', 'Date published', 'Veröffentlichungsdatum', 'positive', 20
  UNION ALL SELECT 'search-engine', 'result_transparency_signals', 'cached_source', 'Cached source', 'Zwischengespeicherte Quelle', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'result_transparency_signals', 'ranking_explanation', 'Ranking explanation', 'Ranking-Erklärung', 'positive', 40
  UNION ALL SELECT 'search-engine', 'result_transparency_signals', 'ad_disclosure', 'Ad disclosure', 'Anzeigenhinweis', 'positive', 50
  UNION ALL SELECT 'search-engine', 'result_transparency_signals', 'ai_disclosure', 'AI disclosure', 'KI-Hinweis', 'positive', 60
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'privacy_focused', 'Privacy-focused users', 'Datenschutzfokus', 'positive', 10
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'independent_index', 'Independent-index preference', 'Präferenz für unabhängigen Index', 'positive', 20
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'metasearch', 'Metasearch users', 'Metasuch-Nutzer', 'tradeoff', 30
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'self_hosters', 'Self-hosters', 'Selbsthoster', 'tradeoff', 40
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'general_web', 'General web search', 'Allgemeine Websuche', 'neutral', 50
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'research_power_users', 'Research power users', 'Recherche-Power-Nutzer', 'tradeoff', 60
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'family_safe', 'Family-safe use', 'Familiengeeignete Nutzung', 'neutral', 70
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'ai_answer_users', 'AI-answer users', 'KI-Antwort-Nutzer', 'tradeoff', 80
  UNION ALL SELECT 'search-engine', 'fit_profiles', 'developer_api_users', 'Developer/API users', 'Entwickler-/API-Nutzer', 'tradeoff', 90
  UNION ALL SELECT 'search-engine', 'best_query_types', 'general_web', 'General web', 'Allgemeines Web', 'neutral', 10
  UNION ALL SELECT 'search-engine', 'best_query_types', 'technical_docs', 'Technical documentation', 'Technische Dokumentation', 'positive', 20
  UNION ALL SELECT 'search-engine', 'best_query_types', 'current_news', 'Current news', 'Aktuelle Nachrichten', 'neutral', 30
  UNION ALL SELECT 'search-engine', 'best_query_types', 'local_places', 'Local places', 'Lokale Orte', 'neutral', 40
  UNION ALL SELECT 'search-engine', 'best_query_types', 'shopping_products', 'Shopping/products', 'Shopping/Produkte', 'tradeoff', 50
  UNION ALL SELECT 'search-engine', 'best_query_types', 'academic_research', 'Academic research', 'Wissenschaftliche Recherche', 'positive', 60
  UNION ALL SELECT 'search-engine', 'best_query_types', 'images_video', 'Images/video', 'Bilder/Video', 'neutral', 70
  UNION ALL SELECT 'search-engine', 'best_query_types', 'forums_communities', 'Forums/communities', 'Foren/Communities', 'neutral', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'search-engine'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'search-engine'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('010-search-engine-matrix-criteria');
