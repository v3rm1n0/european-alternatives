-- Migration 015: Define Maps & Navigation category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('maps', 'map_data_coverage', 'Map Data & Coverage', 'Kartendaten & Abdeckung', 'Data source, geographic scope, POI coverage, update model, and map layers.', 'Datenquelle, geografische Abdeckung, POI-Abdeckung, Aktualisierungsmodell und Kartenebenen.', 100),
  ('maps', 'routing_navigation', 'Routing & Navigation', 'Routing & Navigation', 'Turn-by-turn support, route modes, traffic, transit, route controls, and guidance features.', 'Schrittweise Navigation, Routenmodi, Verkehr, OePNV, Routensteuerung und Navigationshinweise.', 200),
  ('maps', 'offline_resilience', 'Offline & Resilience', 'Offline & Ausfallsicherheit', 'Offline maps, offline routing/search, update controls, and low-connectivity behavior.', 'Offline-Karten, Offline-Routing/Suche, Aktualisierungskontrollen und Verhalten bei schlechter Verbindung.', 300),
  ('maps', 'privacy_location', 'Privacy & Location Data', 'Datenschutz & Standortdaten', 'Account requirements, location history, retention, tracking, sharing, ads, and personalization.', 'Kontoanforderungen, Standortverlauf, Aufbewahrung, Tracking, Freigabe, Werbung und Personalisierung.', 400),
  ('maps', 'places_discovery', 'Places & Local Discovery', 'Orte & lokale Suche', 'Place search, details, reviews, business listings, commerce hooks, and indoor maps.', 'Ortssuche, Details, Bewertungen, Unternehmenseintraege, Commerce-Anbindungen und Innenraumkarten.', 500),
  ('maps', 'transport_mobility', 'Transport & Mobility', 'Verkehr & Mobilitaet', 'Public transit, mobility services, EV routing, cycling, walking, hiking, and professional routing.', 'Oeffentlicher Verkehr, Mobilitaetsdienste, EV-Routing, Radfahren, Fusswege, Wandern und professionelles Routing.', 600),
  ('maps', 'platforms_accessibility', 'Platforms & Accessibility', 'Plattformen & Barrierefreiheit', 'Device support, app distribution, vehicle integrations, accessibility, and voice/language support.', 'Geraeteunterstuetzung, App-Verteilung, Fahrzeugintegration, Barrierefreiheit und Sprachunterstuetzung.', 700),
  ('maps', 'customization_portability', 'Customization & Portability', 'Anpassung & Portabilitaet', 'Saved places, custom maps, import/export, route/list sharing, and personal data export.', 'Gespeicherte Orte, eigene Karten, Import/Export, Teilen von Routen/Listen und Export persoenlicher Daten.', 800),
  ('maps', 'openness_operations', 'Openness, APIs & Fit', 'Offenheit, APIs & Eignung', 'Contribution model, self-hosting, map APIs, attribution, and common fit profiles.', 'Beitragsmodell, Selbsthosting, Karten-APIs, Quellenhinweise und typische Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'maps' AS category_id, 'map_data_coverage' AS group_key, 'map_data_source_model' AS criterion_key, 'Map data source model' AS label_en, 'Kartendaten-Quellenmodell' AS label_de, 'enum' AS value_type, 'tradeoff' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The documented source model for map geometry, addresses, POIs, and provider data.' AS help_text_en, 'Das dokumentierte Quellenmodell fuer Kartengeometrie, Adressen, POIs und Anbieterdaten.' AS help_text_de
  UNION ALL SELECT 'maps', 'map_data_coverage', 'geographic_coverage_scope', 'Geographic coverage scope', 'Geografischer Abdeckungsumfang', 'enum', 'informational', 'optional', 1020, 'The documented geographic scope where map data and navigation are available.', 'Der dokumentierte geografische Umfang, in dem Kartendaten und Navigation verfuegbar sind.'
  UNION ALL SELECT 'maps', 'map_data_coverage', 'address_geocoding_support', 'Address search/geocoding', 'Adresssuche/Geocoding', 'boolean', 'beneficial', 'optional', 1030, 'Whether the product documents address search or geocoding for finding locations.', 'Ob das Produkt Adresssuche oder Geocoding zum Finden von Orten dokumentiert.'
  UNION ALL SELECT 'maps', 'map_data_coverage', 'poi_database_features', 'POI database features', 'POI-Datenbankfunktionen', 'multi_enum', 'informational', 'multi_select', 1040, 'Documented place or point-of-interest data fields available in search or map views.', 'Dokumentierte Orts- oder Point-of-Interest-Datenfelder in Suche oder Kartenansichten.'
  UNION ALL SELECT 'maps', 'map_data_coverage', 'map_update_model', 'Map update model', 'Kartenaktualisierungsmodell', 'enum', 'informational', 'optional', 1050, 'How map data updates are delivered, reviewed, imported, or packaged.', 'Wie Kartendaten-Aktualisierungen bereitgestellt, geprueft, importiert oder paketiert werden.'
  UNION ALL SELECT 'maps', 'map_data_coverage', 'map_layers_available', 'Map layers available', 'Kartenebenen verfuegbar', 'multi_enum', 'informational', 'multi_select', 1060, 'Documented map layers such as standard, satellite, terrain, transit, cycling, or traffic.', 'Dokumentierte Kartenebenen wie Standard, Satellit, Gelaende, OePNV, Fahrrad oder Verkehr.'
  UNION ALL SELECT 'maps', 'routing_navigation', 'turn_by_turn_navigation', 'Turn-by-turn navigation', 'Schrittweise Navigation', 'boolean', 'beneficial', 'must_match', 2010, 'Whether the product provides turn-by-turn navigation for at least one travel mode.', 'Ob das Produkt schrittweise Navigation fuer mindestens einen Reisemodus bereitstellt.'
  UNION ALL SELECT 'maps', 'routing_navigation', 'routing_modes', 'Routing modes', 'Routing-Modi', 'multi_enum', 'beneficial', 'multi_select', 2020, 'Travel modes with documented route planning or navigation support.', 'Reisemodi mit dokumentierter Routenplanung oder Navigationsunterstuetzung.'
  UNION ALL SELECT 'maps', 'routing_navigation', 'live_traffic_routing', 'Live traffic routing', 'Routing mit Echtzeitverkehr', 'boolean', 'beneficial', 'optional', 2030, 'Whether routing can use live traffic or current road conditions.', 'Ob Routing Echtzeitverkehr oder aktuelle Strassenbedingungen nutzen kann.'
  UNION ALL SELECT 'maps', 'routing_navigation', 'public_transit_routing_model', 'Public transit routing model', 'OePNV-Routingmodell', 'enum', 'informational', 'optional', 2040, 'The documented level of public transit routing support and real-time data.', 'Der dokumentierte Umfang der OePNV-Routing-Unterstuetzung und Echtzeitdaten.'
  UNION ALL SELECT 'maps', 'routing_navigation', 'route_optimization_features', 'Route optimization features', 'Routenoptimierungsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 2050, 'Route controls and optimization options available during trip planning.', 'Routensteuerungen und Optimierungsoptionen, die bei der Reiseplanung verfuegbar sind.'
  UNION ALL SELECT 'maps', 'routing_navigation', 'guidance_features', 'Guidance features', 'Navigationshinweise', 'multi_enum', 'beneficial', 'multi_select', 2060, 'Navigation guidance features documented for active trips.', 'Dokumentierte Navigationshinweise fuer aktive Fahrten.'
  UNION ALL SELECT 'maps', 'routing_navigation', 'max_route_stops', 'Maximum route stops', 'Maximale Routenstopps', 'number', 'informational', 'range', 2070, 'The documented maximum number of stops or waypoints in one route.', 'Die dokumentierte maximale Anzahl von Stopps oder Wegpunkten in einer Route.'
  UNION ALL SELECT 'maps', 'offline_resilience', 'offline_maps_available', 'Offline maps available', 'Offline-Karten verfuegbar', 'boolean', 'beneficial', 'must_match', 3010, 'Whether map areas can be downloaded or used without an active network connection.', 'Ob Kartengebiete ohne aktive Netzwerkverbindung heruntergeladen oder genutzt werden koennen.'
  UNION ALL SELECT 'maps', 'offline_resilience', 'offline_routing_available', 'Offline routing available', 'Offline-Routing verfuegbar', 'boolean', 'beneficial', 'optional', 3020, 'Whether route planning or navigation works with downloaded data while offline.', 'Ob Routenplanung oder Navigation mit heruntergeladenen Daten offline funktioniert.'
  UNION ALL SELECT 'maps', 'offline_resilience', 'offline_search_available', 'Offline search available', 'Offline-Suche verfuegbar', 'boolean', 'beneficial', 'optional', 3030, 'Whether address or place search is documented for offline map data.', 'Ob Adress- oder Ortssuche fuer Offline-Kartendaten dokumentiert ist.'
  UNION ALL SELECT 'maps', 'offline_resilience', 'offline_download_model', 'Offline download model', 'Offline-Downloadmodell', 'enum', 'tradeoff', 'optional', 3040, 'How users select, receive, or cache offline map data.', 'Wie Nutzer Offline-Kartendaten auswaehlen, erhalten oder zwischenspeichern.'
  UNION ALL SELECT 'maps', 'offline_resilience', 'offline_update_controls', 'Offline update controls', 'Offline-Aktualisierungskontrollen', 'multi_enum', 'beneficial', 'multi_select', 3050, 'Controls for updating, refreshing, or managing downloaded map data.', 'Kontrollen zum Aktualisieren, Auffrischen oder Verwalten heruntergeladener Kartendaten.'
  UNION ALL SELECT 'maps', 'offline_resilience', 'low_connectivity_mode', 'Low-connectivity mode', 'Modus fuer schlechte Verbindung', 'boolean', 'informational', 'optional', 3060, 'Whether the product documents behavior optimized for weak or intermittent connections.', 'Ob das Produkt Verhalten fuer schwache oder unterbrochene Verbindungen dokumentiert.'
  UNION ALL SELECT 'maps', 'privacy_location', 'account_required_for_navigation', 'Account required for navigation', 'Konto fuer Navigation erforderlich', 'boolean', 'risk', 'must_match', 4010, 'Whether using navigation requires signing in to an account.', 'Ob die Nutzung der Navigation eine Anmeldung mit einem Konto erfordert.'
  UNION ALL SELECT 'maps', 'privacy_location', 'location_history_model', 'Location history model', 'Standortverlaufsmodell', 'enum', 'risk', 'optional', 4020, 'How the product documents location history, timeline, or saved movement records.', 'Wie das Produkt Standortverlauf, Zeitachse oder gespeicherte Bewegungsdaten dokumentiert.'
  UNION ALL SELECT 'maps', 'privacy_location', 'location_data_retention', 'Location data retention', 'Speicherdauer fuer Standortdaten', 'enum', 'risk', 'optional', 4030, 'The documented retention model for location data or navigation activity.', 'Das dokumentierte Aufbewahrungsmodell fuer Standortdaten oder Navigationsaktivitaeten.'
  UNION ALL SELECT 'maps', 'privacy_location', 'third_party_tracking_on_map', 'Third-party tracking on map', 'Drittanbieter-Tracking auf Karten', 'boolean', 'risk', 'optional', 4040, 'Whether third-party tracking, advertising, or analytics is documented in map surfaces.', 'Ob Drittanbieter-Tracking, Werbung oder Analyse in Kartenoberflaechen dokumentiert ist.'
  UNION ALL SELECT 'maps', 'privacy_location', 'live_location_sharing', 'Live location sharing', 'Live-Standortfreigabe', 'boolean', 'tradeoff', 'optional', 4050, 'Whether users can share their live location with other people.', 'Ob Nutzer ihren Live-Standort mit anderen Personen teilen koennen.'
  UNION ALL SELECT 'maps', 'privacy_location', 'personalization_ads_model', 'Personalization/ads model', 'Personalisierungs-/Anzeigenmodell', 'enum', 'tradeoff', 'optional', 4060, 'How personalization, recommendations, promotions, or ads are documented for the map product.', 'Wie Personalisierung, Empfehlungen, Werbung oder Anzeigen fuer das Kartenprodukt dokumentiert sind.'
  UNION ALL SELECT 'maps', 'places_discovery', 'place_search_available', 'Place search available', 'Ortssuche verfuegbar', 'boolean', 'beneficial', 'optional', 5010, 'Whether the product supports searching for places or local businesses.', 'Ob das Produkt die Suche nach Orten oder lokalen Unternehmen unterstuetzt.'
  UNION ALL SELECT 'maps', 'places_discovery', 'place_detail_fields', 'Place detail fields', 'Detailfelder fuer Orte', 'multi_enum', 'informational', 'multi_select', 5020, 'Documented details available on place pages or local search results.', 'Dokumentierte Details auf Ortsseiten oder in lokalen Suchergebnissen.'
  UNION ALL SELECT 'maps', 'places_discovery', 'review_rating_model', 'Review/rating model', 'Bewertungsmodell', 'enum', 'tradeoff', 'optional', 5030, 'How place reviews, ratings, notes, or external review links are documented.', 'Wie Ortsbewertungen, Ratings, Hinweise oder externe Bewertungslinks dokumentiert sind.'
  UNION ALL SELECT 'maps', 'places_discovery', 'business_listing_management', 'Business listing management', 'Verwaltung von Unternehmenseintraegen', 'enum', 'tradeoff', 'optional', 5040, 'How businesses can claim, update, or feed listing data.', 'Wie Unternehmen Eintraege beanspruchen, aktualisieren oder per Feed bereitstellen koennen.'
  UNION ALL SELECT 'maps', 'places_discovery', 'booking_commerce_integrations', 'Booking/commerce integrations', 'Buchungs-/Commerce-Integrationen', 'multi_enum', 'tradeoff', 'multi_select', 5050, 'Commerce or booking integrations shown in place discovery or map results.', 'Commerce- oder Buchungsintegrationen in Ortssuche oder Kartenergebnissen.'
  UNION ALL SELECT 'maps', 'places_discovery', 'indoor_maps_available', 'Indoor maps available', 'Innenraumkarten verfuegbar', 'boolean', 'informational', 'optional', 5060, 'Whether indoor venue maps or floor-level maps are documented.', 'Ob Innenraumkarten oder etagenbezogene Karten dokumentiert sind.'
  UNION ALL SELECT 'maps', 'transport_mobility', 'realtime_transit_available', 'Real-time transit available', 'Echtzeit-OePNV verfuegbar', 'boolean', 'beneficial', 'optional', 6010, 'Whether public transit information includes documented real-time departures or disruptions.', 'Ob OePNV-Informationen dokumentierte Echtzeit-Abfahrten oder Stoerungen enthalten.'
  UNION ALL SELECT 'maps', 'transport_mobility', 'supported_mobility_services', 'Supported mobility services', 'Unterstuetzte Mobilitaetsdienste', 'multi_enum', 'informational', 'multi_select', 6020, 'Mobility services integrated into routing, search, or map views.', 'Mobilitaetsdienste, die in Routing, Suche oder Kartenansichten integriert sind.'
  UNION ALL SELECT 'maps', 'transport_mobility', 'ev_routing_charging_features', 'EV routing/charging features', 'EV-Routing-/Ladefunktionen', 'multi_enum', 'beneficial', 'multi_select', 6030, 'Electric-vehicle routing, charger search, availability, or charging stop features.', 'Funktionen fuer EV-Routing, Ladesaeulensuche, Verfuegbarkeit oder Ladestopps.'
  UNION ALL SELECT 'maps', 'transport_mobility', 'cycling_features', 'Cycling features', 'Fahrradfunktionen', 'multi_enum', 'beneficial', 'multi_select', 6040, 'Cycling-specific map, routing, safety, or elevation features.', 'Fahrradspezifische Karten-, Routing-, Sicherheits- oder Hoehenfunktionen.'
  UNION ALL SELECT 'maps', 'transport_mobility', 'walking_hiking_features', 'Walking/hiking features', 'Fuss-/Wanderfunktionen', 'multi_enum', 'beneficial', 'multi_select', 6050, 'Walking, hiking, trail, elevation, or step-free route features.', 'Fussweg-, Wander-, Pfad-, Hoehen- oder stufenfreie Routenfunktionen.'
  UNION ALL SELECT 'maps', 'transport_mobility', 'truck_or_professional_routing', 'Truck/professional routing', 'Lkw-/Profi-Routing', 'multi_enum', 'informational', 'multi_select', 6060, 'Professional routing capabilities for trucks, fleets, deliveries, tolls, or restrictions.', 'Professionelle Routing-Funktionen fuer Lkw, Flotten, Lieferungen, Maut oder Beschraenkungen.'
  UNION ALL SELECT 'maps', 'platforms_accessibility', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 7010, 'Platforms where the product documents app, web, or navigation support.', 'Plattformen, auf denen das Produkt App-, Web- oder Navigationsunterstuetzung dokumentiert.'
  UNION ALL SELECT 'maps', 'platforms_accessibility', 'mobile_app_distribution', 'Mobile app distribution', 'Mobile App-Verteilung', 'multi_enum', 'informational', 'multi_select', 7020, 'Distribution channels documented for mobile apps or installable packages.', 'Dokumentierte Vertriebskanaele fuer mobile Apps oder installierbare Pakete.'
  UNION ALL SELECT 'maps', 'platforms_accessibility', 'vehicle_integration', 'Vehicle integration', 'Fahrzeugintegration', 'multi_enum', 'informational', 'multi_select', 7030, 'Vehicle, infotainment, or in-car audio integrations documented by the product.', 'Vom Produkt dokumentierte Fahrzeug-, Infotainment- oder Audiointegrationen.'
  UNION ALL SELECT 'maps', 'platforms_accessibility', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 7040, 'Accessibility features documented for map use, routing, or navigation.', 'Dokumentierte Barrierefreiheitsfunktionen fuer Kartennutzung, Routing oder Navigation.'
  UNION ALL SELECT 'maps', 'platforms_accessibility', 'voice_language_support', 'Voice/language support', 'Sprach-/Stimmenunterstuetzung', 'multi_enum', 'informational', 'multi_select', 7050, 'Voice guidance, speech, localization, or language support documented for navigation.', 'Dokumentierte Sprachfuehrung, Sprachausgabe, Lokalisierung oder Sprachunterstuetzung fuer Navigation.'
  UNION ALL SELECT 'maps', 'customization_portability', 'saved_places_lists', 'Saved places/lists', 'Gespeicherte Orte/Listen', 'boolean', 'beneficial', 'optional', 8010, 'Whether users can save places, favorites, collections, or lists.', 'Ob Nutzer Orte, Favoriten, Sammlungen oder Listen speichern koennen.'
  UNION ALL SELECT 'maps', 'customization_portability', 'custom_maps_layers', 'Custom maps/layers', 'Eigene Karten/Ebenen', 'multi_enum', 'informational', 'multi_select', 8020, 'User-created maps, layers, pins, routes, overlays, or annotation features.', 'Von Nutzern erstellte Karten, Ebenen, Pins, Routen, Overlays oder Anmerkungsfunktionen.'
  UNION ALL SELECT 'maps', 'customization_portability', 'import_export_formats', 'Import/export formats', 'Import-/Exportformate', 'multi_enum', 'beneficial', 'multi_select', 8030, 'Documented geospatial, route, favorite, or place import and export formats.', 'Dokumentierte Geodaten-, Routen-, Favoriten- oder Ortsformate fuer Import und Export.'
  UNION ALL SELECT 'maps', 'customization_portability', 'sharing_collaboration_features', 'Sharing/collaboration features', 'Teilen-/Zusammenarbeitsfunktionen', 'multi_enum', 'informational', 'multi_select', 8040, 'Ways to share routes, locations, lists, public maps, or embedded map views.', 'Moeglichkeiten zum Teilen von Routen, Standorten, Listen, oeffentlichen Karten oder eingebetteten Kartenansichten.'
  UNION ALL SELECT 'maps', 'customization_portability', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 8050, 'Whether users can export personal map data, saved places, or account map activity.', 'Ob Nutzer persoenliche Kartendaten, gespeicherte Orte oder Konto-Kartenaktivitaeten exportieren koennen.'
  UNION ALL SELECT 'maps', 'openness_operations', 'contribution_editing_model', 'Contribution/editing model', 'Beitrags-/Bearbeitungsmodell', 'enum', 'tradeoff', 'optional', 9010, 'How users can contribute map edits, corrections, feedback, or community changes.', 'Wie Nutzer Kartenbearbeitungen, Korrekturen, Feedback oder Community-Aenderungen beitragen koennen.'
  UNION ALL SELECT 'maps', 'openness_operations', 'self_hosting_or_local_server', 'Self-hosting/local server', 'Selbsthosting/lokaler Server', 'boolean', 'tradeoff', 'optional', 9020, 'Whether the map stack, tiles, routing, or local server can be operated by the user or organization.', 'Ob Kartenstack, Kacheln, Routing oder lokaler Server durch Nutzer oder Organisation betrieben werden koennen.'
  UNION ALL SELECT 'maps', 'openness_operations', 'map_tile_api_embedding', 'Map tile API/embedding', 'Kartenkachel-API/Einbettung', 'enum', 'tradeoff', 'optional', 9030, 'The documented embedding, SDK, tile, geocoding, routing, or self-hosted tile model.', 'Das dokumentierte Modell fuer Einbettung, SDK, Kacheln, Geocoding, Routing oder selbstgehostete Kacheln.'
  UNION ALL SELECT 'maps', 'openness_operations', 'open_data_attribution_visible', 'Data attribution visible', 'Datenquellen-Hinweis sichtbar', 'boolean', 'informational', 'optional', 9040, 'Whether the map UI visibly documents data attribution or source credits.', 'Ob die Kartenoberflaeche Datenquellen oder Quellenhinweise sichtbar dokumentiert.'
  UNION ALL SELECT 'maps', 'openness_operations', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user profiles or use cases the map product is well suited for.', 'Typische Nutzerprofile oder Anwendungsfaelle, fuer die das Kartenprodukt gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'maps' AS category_id, 'map_data_source_model' AS criterion_key, 'openstreetmap_based' AS option_key, 'OpenStreetMap based' AS label_en, 'OpenStreetMap-basiert' AS label_de, 'positive' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'maps', 'map_data_source_model', 'proprietary_provider', 'Proprietary provider', 'Proprietaerer Anbieter', 'warning', 20
  UNION ALL SELECT 'maps', 'map_data_source_model', 'mixed_sources', 'Mixed sources', 'Gemischte Quellen', 'neutral', 30
  UNION ALL SELECT 'maps', 'map_data_source_model', 'government_open_data', 'Government open data', 'Staatliche offene Daten', 'positive', 40
  UNION ALL SELECT 'maps', 'map_data_source_model', 'community_contributed', 'Community contributed', 'Community-Beitraege', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'map_data_source_model', 'provider_api', 'Provider API', 'Anbieter-API', 'tradeoff', 60
  UNION ALL SELECT 'maps', 'geographic_coverage_scope', 'global', 'Global', 'Global', 'neutral', 10
  UNION ALL SELECT 'maps', 'geographic_coverage_scope', 'regional', 'Regional', 'Regional', 'neutral', 20
  UNION ALL SELECT 'maps', 'geographic_coverage_scope', 'country_specific', 'Country specific', 'Laenderspezifisch', 'neutral', 30
  UNION ALL SELECT 'maps', 'geographic_coverage_scope', 'city_local', 'City/local', 'Stadt/lokal', 'neutral', 40
  UNION ALL SELECT 'maps', 'geographic_coverage_scope', 'outdoor_specialized', 'Outdoor specialized', 'Outdoor-spezialisiert', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'poi_database_features', 'categories', 'Categories', 'Kategorien', 'neutral', 10
  UNION ALL SELECT 'maps', 'poi_database_features', 'opening_hours', 'Opening hours', 'Oeffnungszeiten', 'positive', 20
  UNION ALL SELECT 'maps', 'poi_database_features', 'contact_details', 'Contact details', 'Kontaktdaten', 'neutral', 30
  UNION ALL SELECT 'maps', 'poi_database_features', 'accessibility_details', 'Accessibility details', 'Barrierefreiheitsdetails', 'positive', 40
  UNION ALL SELECT 'maps', 'poi_database_features', 'photos', 'Photos', 'Fotos', 'neutral', 50
  UNION ALL SELECT 'maps', 'poi_database_features', 'user_reviews', 'User reviews', 'Nutzerbewertungen', 'tradeoff', 60
  UNION ALL SELECT 'maps', 'poi_database_features', 'business_updates', 'Business updates', 'Unternehmensupdates', 'tradeoff', 70
  UNION ALL SELECT 'maps', 'map_update_model', 'community_live', 'Community live', 'Community live', 'positive', 10
  UNION ALL SELECT 'maps', 'map_update_model', 'provider_live', 'Provider live', 'Anbieter live', 'neutral', 20
  UNION ALL SELECT 'maps', 'map_update_model', 'periodic_releases', 'Periodic releases', 'Periodische Releases', 'neutral', 30
  UNION ALL SELECT 'maps', 'map_update_model', 'offline_package_updates', 'Offline package updates', 'Offline-Paketupdates', 'neutral', 40
  UNION ALL SELECT 'maps', 'map_update_model', 'manual_imports', 'Manual imports', 'Manuelle Importe', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'map_layers_available', 'standard', 'Standard', 'Standard', 'neutral', 10
  UNION ALL SELECT 'maps', 'map_layers_available', 'satellite', 'Satellite', 'Satellit', 'neutral', 20
  UNION ALL SELECT 'maps', 'map_layers_available', 'terrain', 'Terrain', 'Gelaende', 'positive', 30
  UNION ALL SELECT 'maps', 'map_layers_available', 'public_transport', 'Public transport', 'Oeffentlicher Verkehr', 'positive', 40
  UNION ALL SELECT 'maps', 'map_layers_available', 'cycling', 'Cycling', 'Fahrrad', 'positive', 50
  UNION ALL SELECT 'maps', 'map_layers_available', 'traffic', 'Traffic', 'Verkehr', 'positive', 60
  UNION ALL SELECT 'maps', 'map_layers_available', 'indoor', 'Indoor', 'Innenraum', 'neutral', 70
  UNION ALL SELECT 'maps', 'map_layers_available', 'cadastre', 'Cadastre', 'Kataster', 'neutral', 80
  UNION ALL SELECT 'maps', 'map_layers_available', 'weather', 'Weather', 'Wetter', 'neutral', 90
  UNION ALL SELECT 'maps', 'routing_modes', 'driving', 'Driving', 'Auto', 'neutral', 10
  UNION ALL SELECT 'maps', 'routing_modes', 'walking', 'Walking', 'Fussweg', 'positive', 20
  UNION ALL SELECT 'maps', 'routing_modes', 'cycling', 'Cycling', 'Fahrrad', 'positive', 30
  UNION ALL SELECT 'maps', 'routing_modes', 'public_transit', 'Public transit', 'OePNV', 'positive', 40
  UNION ALL SELECT 'maps', 'routing_modes', 'motorcycle', 'Motorcycle', 'Motorrad', 'neutral', 50
  UNION ALL SELECT 'maps', 'routing_modes', 'truck', 'Truck', 'Lkw', 'neutral', 60
  UNION ALL SELECT 'maps', 'routing_modes', 'wheelchair', 'Wheelchair', 'Rollstuhl', 'positive', 70
  UNION ALL SELECT 'maps', 'routing_modes', 'hiking', 'Hiking', 'Wandern', 'positive', 80
  UNION ALL SELECT 'maps', 'public_transit_routing_model', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'maps', 'public_transit_routing_model', 'static_schedules', 'Static schedules', 'Statische Fahrplaene', 'neutral', 20
  UNION ALL SELECT 'maps', 'public_transit_routing_model', 'realtime_departures', 'Real-time departures', 'Echtzeit-Abfahrten', 'positive', 30
  UNION ALL SELECT 'maps', 'public_transit_routing_model', 'multimodal', 'Multimodal', 'Multimodal', 'positive', 40
  UNION ALL SELECT 'maps', 'public_transit_routing_model', 'regional_only', 'Regional only', 'Nur regional', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'route_optimization_features', 'alternative_routes', 'Alternative routes', 'Alternative Routen', 'positive', 10
  UNION ALL SELECT 'maps', 'route_optimization_features', 'multi_stop', 'Multi-stop', 'Mehrere Stopps', 'positive', 20
  UNION ALL SELECT 'maps', 'route_optimization_features', 'avoid_tolls', 'Avoid tolls', 'Maut vermeiden', 'positive', 30
  UNION ALL SELECT 'maps', 'route_optimization_features', 'avoid_highways', 'Avoid highways', 'Autobahnen vermeiden', 'positive', 40
  UNION ALL SELECT 'maps', 'route_optimization_features', 'avoid_ferries', 'Avoid ferries', 'Faehren vermeiden', 'neutral', 50
  UNION ALL SELECT 'maps', 'route_optimization_features', 'waypoint_reordering', 'Waypoint reordering', 'Wegpunkte neu ordnen', 'positive', 60
  UNION ALL SELECT 'maps', 'route_optimization_features', 'round_trip', 'Round trip', 'Rundroute', 'neutral', 70
  UNION ALL SELECT 'maps', 'guidance_features', 'voice_guidance', 'Voice guidance', 'Sprachfuehrung', 'positive', 10
  UNION ALL SELECT 'maps', 'guidance_features', 'lane_assist', 'Lane assist', 'Spurassistent', 'positive', 20
  UNION ALL SELECT 'maps', 'guidance_features', 'speed_limits', 'Speed limits', 'Tempolimits', 'positive', 30
  UNION ALL SELECT 'maps', 'guidance_features', 'speed_cameras', 'Speed cameras', 'Blitzer', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'guidance_features', 'hazard_alerts', 'Hazard alerts', 'Gefahrenwarnungen', 'positive', 50
  UNION ALL SELECT 'maps', 'guidance_features', 'automatic_rerouting', 'Automatic rerouting', 'Automatische Neuberechnung', 'positive', 60
  UNION ALL SELECT 'maps', 'guidance_features', 'compass', 'Compass', 'Kompass', 'neutral', 70
  UNION ALL SELECT 'maps', 'offline_download_model', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'maps', 'offline_download_model', 'country_region_packages', 'Country/region packages', 'Land-/Regionspakete', 'positive', 20
  UNION ALL SELECT 'maps', 'offline_download_model', 'user_selected_areas', 'User-selected areas', 'Nutzergewaehlte Gebiete', 'positive', 30
  UNION ALL SELECT 'maps', 'offline_download_model', 'route_corridor', 'Route corridor', 'Routenkorridor', 'neutral', 40
  UNION ALL SELECT 'maps', 'offline_download_model', 'cache_only', 'Cache only', 'Nur Cache', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'offline_update_controls', 'manual_updates', 'Manual updates', 'Manuelle Updates', 'neutral', 10
  UNION ALL SELECT 'maps', 'offline_update_controls', 'auto_updates_wifi', 'Auto updates on Wi-Fi', 'Auto-Updates ueber WLAN', 'positive', 20
  UNION ALL SELECT 'maps', 'offline_update_controls', 'update_notifications', 'Update notifications', 'Update-Benachrichtigungen', 'positive', 30
  UNION ALL SELECT 'maps', 'offline_update_controls', 'storage_management', 'Storage management', 'Speicherverwaltung', 'positive', 40
  UNION ALL SELECT 'maps', 'offline_update_controls', 'differential_updates', 'Differential updates', 'Differentielle Updates', 'positive', 50
  UNION ALL SELECT 'maps', 'location_history_model', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'maps', 'location_history_model', 'local_only', 'Local only', 'Nur lokal', 'positive', 20
  UNION ALL SELECT 'maps', 'location_history_model', 'opt_in_cloud', 'Opt-in cloud', 'Opt-in-Cloud', 'neutral', 30
  UNION ALL SELECT 'maps', 'location_history_model', 'default_on_cloud', 'Default-on cloud', 'Cloud standardmaessig aktiv', 'warning', 40
  UNION ALL SELECT 'maps', 'location_history_model', 'account_required_history', 'Account-required history', 'Konto fuer Verlauf erforderlich', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'location_data_retention', 'not_logged', 'Not logged', 'Nicht protokolliert', 'positive', 10
  UNION ALL SELECT 'maps', 'location_data_retention', 'short_retention', 'Short retention', 'Kurze Aufbewahrung', 'neutral', 20
  UNION ALL SELECT 'maps', 'location_data_retention', 'account_history_optional', 'Account history optional', 'Kontoverlauf optional', 'tradeoff', 30
  UNION ALL SELECT 'maps', 'location_data_retention', 'retained_for_service', 'Retained for service', 'Fuer Dienst gespeichert', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'location_data_retention', 'retained_for_ads', 'Retained for ads', 'Fuer Werbung gespeichert', 'warning', 50
  UNION ALL SELECT 'maps', 'personalization_ads_model', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'maps', 'personalization_ads_model', 'contextual', 'Contextual', 'Kontextuell', 'neutral', 20
  UNION ALL SELECT 'maps', 'personalization_ads_model', 'account_personalized', 'Account personalized', 'Kontobasiert personalisiert', 'tradeoff', 30
  UNION ALL SELECT 'maps', 'personalization_ads_model', 'location_based_ads', 'Location-based ads', 'Standortbasierte Anzeigen', 'warning', 40
  UNION ALL SELECT 'maps', 'personalization_ads_model', 'subscription_no_ads', 'Subscription no ads', 'Abo ohne Anzeigen', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'place_detail_fields', 'opening_hours', 'Opening hours', 'Oeffnungszeiten', 'positive', 10
  UNION ALL SELECT 'maps', 'place_detail_fields', 'phone_website', 'Phone/website', 'Telefon/Webseite', 'neutral', 20
  UNION ALL SELECT 'maps', 'place_detail_fields', 'photos', 'Photos', 'Fotos', 'neutral', 30
  UNION ALL SELECT 'maps', 'place_detail_fields', 'menus', 'Menus', 'Speisekarten', 'neutral', 40
  UNION ALL SELECT 'maps', 'place_detail_fields', 'accessibility_info', 'Accessibility info', 'Barrierefreiheitsinfos', 'positive', 50
  UNION ALL SELECT 'maps', 'place_detail_fields', 'business_claims', 'Business claims', 'Unternehmensansprueche', 'tradeoff', 60
  UNION ALL SELECT 'maps', 'review_rating_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'maps', 'review_rating_model', 'first_party_reviews', 'First-party reviews', 'Eigene Bewertungen', 'tradeoff', 20
  UNION ALL SELECT 'maps', 'review_rating_model', 'partner_reviews', 'Partner reviews', 'Partnerbewertungen', 'tradeoff', 30
  UNION ALL SELECT 'maps', 'review_rating_model', 'community_notes', 'Community notes', 'Community-Hinweise', 'neutral', 40
  UNION ALL SELECT 'maps', 'review_rating_model', 'external_linkout', 'External linkout', 'Externer Link', 'neutral', 50
  UNION ALL SELECT 'maps', 'business_listing_management', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'maps', 'business_listing_management', 'provider_portal', 'Provider portal', 'Anbieterportal', 'tradeoff', 20
  UNION ALL SELECT 'maps', 'business_listing_management', 'community_edits', 'Community edits', 'Community-Bearbeitungen', 'positive', 30
  UNION ALL SELECT 'maps', 'business_listing_management', 'owner_claiming', 'Owner claiming', 'Inhaberbeanspruchung', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'business_listing_management', 'partner_feed', 'Partner feed', 'Partner-Feed', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'booking_commerce_integrations', 'reservations', 'Reservations', 'Reservierungen', 'tradeoff', 10
  UNION ALL SELECT 'maps', 'booking_commerce_integrations', 'tickets', 'Tickets', 'Tickets', 'tradeoff', 20
  UNION ALL SELECT 'maps', 'booking_commerce_integrations', 'food_ordering', 'Food ordering', 'Essensbestellung', 'tradeoff', 30
  UNION ALL SELECT 'maps', 'booking_commerce_integrations', 'ride_hailing', 'Ride hailing', 'Ride-Hailing', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'booking_commerce_integrations', 'hotel_booking', 'Hotel booking', 'Hotelbuchung', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'booking_commerce_integrations', 'paid_promotions', 'Paid promotions', 'Bezahlte Platzierungen', 'warning', 60
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'public_transport', 'Public transport', 'OePNV', 'positive', 10
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'bike_share', 'Bike share', 'Bike-Sharing', 'neutral', 20
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'scooter_share', 'Scooter share', 'Scooter-Sharing', 'neutral', 30
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'car_share', 'Car share', 'Carsharing', 'neutral', 40
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'ride_hailing', 'Ride hailing', 'Ride-Hailing', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'taxi', 'Taxi', 'Taxi', 'neutral', 60
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'parking', 'Parking', 'Parken', 'neutral', 70
  UNION ALL SELECT 'maps', 'supported_mobility_services', 'ev_charging', 'EV charging', 'EV-Laden', 'positive', 80
  UNION ALL SELECT 'maps', 'ev_routing_charging_features', 'station_search', 'Station search', 'Stationssuche', 'positive', 10
  UNION ALL SELECT 'maps', 'ev_routing_charging_features', 'connector_filters', 'Connector filters', 'Steckerfilter', 'positive', 20
  UNION ALL SELECT 'maps', 'ev_routing_charging_features', 'live_availability', 'Live availability', 'Live-Verfuegbarkeit', 'positive', 30
  UNION ALL SELECT 'maps', 'ev_routing_charging_features', 'battery_planning', 'Battery planning', 'Batterieplanung', 'positive', 40
  UNION ALL SELECT 'maps', 'ev_routing_charging_features', 'payment_info', 'Payment info', 'Zahlungsinfos', 'neutral', 50
  UNION ALL SELECT 'maps', 'ev_routing_charging_features', 'route_charging_stops', 'Route charging stops', 'Ladestopps in Route', 'positive', 60
  UNION ALL SELECT 'maps', 'cycling_features', 'bike_lanes', 'Bike lanes', 'Radwege', 'positive', 10
  UNION ALL SELECT 'maps', 'cycling_features', 'cycling_networks', 'Cycling networks', 'Radroutennetze', 'positive', 20
  UNION ALL SELECT 'maps', 'cycling_features', 'surface_quality', 'Surface quality', 'Oberflaechenqualitaet', 'positive', 30
  UNION ALL SELECT 'maps', 'cycling_features', 'elevation_profile', 'Elevation profile', 'Hoehenprofil', 'positive', 40
  UNION ALL SELECT 'maps', 'cycling_features', 'bike_parking', 'Bike parking', 'Fahrradparken', 'neutral', 50
  UNION ALL SELECT 'maps', 'cycling_features', 'turn_by_turn_cycling', 'Turn-by-turn cycling', 'Schrittweise Fahrradnavigation', 'positive', 60
  UNION ALL SELECT 'maps', 'walking_hiking_features', 'footpaths', 'Footpaths', 'Fusswege', 'positive', 10
  UNION ALL SELECT 'maps', 'walking_hiking_features', 'trails', 'Trails', 'Pfade', 'positive', 20
  UNION ALL SELECT 'maps', 'walking_hiking_features', 'elevation_profile', 'Elevation profile', 'Hoehenprofil', 'positive', 30
  UNION ALL SELECT 'maps', 'walking_hiking_features', 'step_free_routes', 'Step-free routes', 'Stufenfreie Routen', 'positive', 40
  UNION ALL SELECT 'maps', 'walking_hiking_features', 'crosswalks', 'Crosswalks', 'Zebrastreifen', 'neutral', 50
  UNION ALL SELECT 'maps', 'walking_hiking_features', 'hiking_routes', 'Hiking routes', 'Wanderrouten', 'positive', 60
  UNION ALL SELECT 'maps', 'walking_hiking_features', 'offline_topo', 'Offline topo', 'Offline-Topo', 'positive', 70
  UNION ALL SELECT 'maps', 'truck_or_professional_routing', 'height_weight_restrictions', 'Height/weight restrictions', 'Hoehen-/Gewichtsbeschraenkungen', 'positive', 10
  UNION ALL SELECT 'maps', 'truck_or_professional_routing', 'hazmat', 'Hazmat', 'Gefahrgut', 'positive', 20
  UNION ALL SELECT 'maps', 'truck_or_professional_routing', 'delivery_windows', 'Delivery windows', 'Lieferfenster', 'neutral', 30
  UNION ALL SELECT 'maps', 'truck_or_professional_routing', 'fleet_routes', 'Fleet routes', 'Flottenrouten', 'neutral', 40
  UNION ALL SELECT 'maps', 'truck_or_professional_routing', 'toll_costs', 'Toll costs', 'Mautkosten', 'neutral', 50
  UNION ALL SELECT 'maps', 'truck_or_professional_routing', 'professional_profiles', 'Professional profiles', 'Profi-Profile', 'tradeoff', 60
  UNION ALL SELECT 'maps', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'maps', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 20
  UNION ALL SELECT 'maps', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 30
  UNION ALL SELECT 'maps', 'supported_platforms', 'desktop', 'Desktop', 'Desktop', 'neutral', 40
  UNION ALL SELECT 'maps', 'supported_platforms', 'pwa', 'PWA', 'PWA', 'neutral', 50
  UNION ALL SELECT 'maps', 'supported_platforms', 'wearables', 'Wearables', 'Wearables', 'neutral', 60
  UNION ALL SELECT 'maps', 'supported_platforms', 'carplay', 'CarPlay', 'CarPlay', 'neutral', 70
  UNION ALL SELECT 'maps', 'supported_platforms', 'android_auto', 'Android Auto', 'Android Auto', 'neutral', 80
  UNION ALL SELECT 'maps', 'mobile_app_distribution', 'app_store', 'App Store', 'App Store', 'neutral', 10
  UNION ALL SELECT 'maps', 'mobile_app_distribution', 'play_store', 'Play Store', 'Play Store', 'neutral', 20
  UNION ALL SELECT 'maps', 'mobile_app_distribution', 'f_droid', 'F-Droid', 'F-Droid', 'positive', 30
  UNION ALL SELECT 'maps', 'mobile_app_distribution', 'direct_apk', 'Direct APK', 'Direktes APK', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'mobile_app_distribution', 'pwa', 'PWA', 'PWA', 'neutral', 50
  UNION ALL SELECT 'maps', 'mobile_app_distribution', 'repository_packages', 'Repository packages', 'Repository-Pakete', 'tradeoff', 60
  UNION ALL SELECT 'maps', 'vehicle_integration', 'carplay', 'CarPlay', 'CarPlay', 'neutral', 10
  UNION ALL SELECT 'maps', 'vehicle_integration', 'android_auto', 'Android Auto', 'Android Auto', 'neutral', 20
  UNION ALL SELECT 'maps', 'vehicle_integration', 'bluetooth_audio', 'Bluetooth audio', 'Bluetooth-Audio', 'neutral', 30
  UNION ALL SELECT 'maps', 'vehicle_integration', 'built_in_automotive_os', 'Built-in automotive OS', 'Integriertes Automotive-OS', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'vehicle_integration', 'ev_infotainment', 'EV infotainment', 'EV-Infotainment', 'neutral', 50
  UNION ALL SELECT 'maps', 'accessibility_features', 'screen_reader', 'Screen reader', 'Screenreader', 'positive', 10
  UNION ALL SELECT 'maps', 'accessibility_features', 'high_contrast', 'High contrast', 'Hoher Kontrast', 'positive', 20
  UNION ALL SELECT 'maps', 'accessibility_features', 'voice_control', 'Voice control', 'Sprachsteuerung', 'positive', 30
  UNION ALL SELECT 'maps', 'accessibility_features', 'wheelchair_routing', 'Wheelchair routing', 'Rollstuhl-Routing', 'positive', 40
  UNION ALL SELECT 'maps', 'accessibility_features', 'step_free_routes', 'Step-free routes', 'Stufenfreie Routen', 'positive', 50
  UNION ALL SELECT 'maps', 'accessibility_features', 'reduced_motion', 'Reduced motion', 'Reduzierte Bewegung', 'neutral', 60
  UNION ALL SELECT 'maps', 'voice_language_support', 'voice_guidance', 'Voice guidance', 'Sprachfuehrung', 'positive', 10
  UNION ALL SELECT 'maps', 'voice_language_support', 'multiple_voice_languages', 'Multiple voice languages', 'Mehrere Sprachsprachen', 'positive', 20
  UNION ALL SELECT 'maps', 'voice_language_support', 'street_name_announcements', 'Street-name announcements', 'Strassennamen-Ansagen', 'neutral', 30
  UNION ALL SELECT 'maps', 'voice_language_support', 'offline_tts', 'Offline TTS', 'Offline-TTS', 'positive', 40
  UNION ALL SELECT 'maps', 'voice_language_support', 'regional_localization', 'Regional localization', 'Regionale Lokalisierung', 'neutral', 50
  UNION ALL SELECT 'maps', 'custom_maps_layers', 'pins', 'Pins', 'Pins', 'neutral', 10
  UNION ALL SELECT 'maps', 'custom_maps_layers', 'routes', 'Routes', 'Routen', 'positive', 20
  UNION ALL SELECT 'maps', 'custom_maps_layers', 'overlays', 'Overlays', 'Overlays', 'neutral', 30
  UNION ALL SELECT 'maps', 'custom_maps_layers', 'annotations', 'Annotations', 'Anmerkungen', 'neutral', 40
  UNION ALL SELECT 'maps', 'custom_maps_layers', 'collections', 'Collections', 'Sammlungen', 'positive', 50
  UNION ALL SELECT 'maps', 'custom_maps_layers', 'measurement_tools', 'Measurement tools', 'Messwerkzeuge', 'neutral', 60
  UNION ALL SELECT 'maps', 'import_export_formats', 'gpx', 'GPX', 'GPX', 'positive', 10
  UNION ALL SELECT 'maps', 'import_export_formats', 'kml_kmz', 'KML/KMZ', 'KML/KMZ', 'positive', 20
  UNION ALL SELECT 'maps', 'import_export_formats', 'geojson', 'GeoJSON', 'GeoJSON', 'positive', 30
  UNION ALL SELECT 'maps', 'import_export_formats', 'csv', 'CSV', 'CSV', 'neutral', 40
  UNION ALL SELECT 'maps', 'import_export_formats', 'osm', 'OSM', 'OSM', 'positive', 50
  UNION ALL SELECT 'maps', 'import_export_formats', 'favorites_export', 'Favorites export', 'Favoritenexport', 'positive', 60
  UNION ALL SELECT 'maps', 'sharing_collaboration_features', 'route_sharing', 'Route sharing', 'Routenfreigabe', 'positive', 10
  UNION ALL SELECT 'maps', 'sharing_collaboration_features', 'location_sharing', 'Location sharing', 'Standortfreigabe', 'tradeoff', 20
  UNION ALL SELECT 'maps', 'sharing_collaboration_features', 'shared_lists', 'Shared lists', 'Geteilte Listen', 'neutral', 30
  UNION ALL SELECT 'maps', 'sharing_collaboration_features', 'public_maps', 'Public maps', 'Oeffentliche Karten', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'sharing_collaboration_features', 'embed', 'Embed', 'Einbettung', 'neutral', 50
  UNION ALL SELECT 'maps', 'contribution_editing_model', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'maps', 'contribution_editing_model', 'osm_editor_link', 'OSM editor link', 'OSM-Editor-Link', 'positive', 20
  UNION ALL SELECT 'maps', 'contribution_editing_model', 'in_app_edits', 'In-app edits', 'In-App-Bearbeitungen', 'tradeoff', 30
  UNION ALL SELECT 'maps', 'contribution_editing_model', 'provider_feedback', 'Provider feedback', 'Anbieter-Feedback', 'neutral', 40
  UNION ALL SELECT 'maps', 'contribution_editing_model', 'community_moderated', 'Community moderated', 'Community-moderiert', 'positive', 50
  UNION ALL SELECT 'maps', 'map_tile_api_embedding', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'maps', 'map_tile_api_embedding', 'static_embed', 'Static embed', 'Statische Einbettung', 'neutral', 20
  UNION ALL SELECT 'maps', 'map_tile_api_embedding', 'web_sdk', 'Web SDK', 'Web-SDK', 'tradeoff', 30
  UNION ALL SELECT 'maps', 'map_tile_api_embedding', 'tile_api', 'Tile API', 'Kachel-API', 'tradeoff', 40
  UNION ALL SELECT 'maps', 'map_tile_api_embedding', 'geocoding_api', 'Geocoding API', 'Geocoding-API', 'tradeoff', 50
  UNION ALL SELECT 'maps', 'map_tile_api_embedding', 'routing_api', 'Routing API', 'Routing-API', 'tradeoff', 60
  UNION ALL SELECT 'maps', 'map_tile_api_embedding', 'self_hosted_tiles', 'Self-hosted tiles', 'Selbstgehostete Kacheln', 'positive', 70
  UNION ALL SELECT 'maps', 'fit_profiles', 'everyday_driving', 'Everyday driving', 'Alltagsfahrten', 'neutral', 10
  UNION ALL SELECT 'maps', 'fit_profiles', 'offline_travel', 'Offline travel', 'Offline-Reisen', 'positive', 20
  UNION ALL SELECT 'maps', 'fit_profiles', 'privacy_sensitive', 'Privacy-sensitive', 'Datenschutzsensibel', 'positive', 30
  UNION ALL SELECT 'maps', 'fit_profiles', 'transit_commuters', 'Transit commuters', 'OePNV-Pendler', 'neutral', 40
  UNION ALL SELECT 'maps', 'fit_profiles', 'cyclists_walkers', 'Cyclists/walkers', 'Radfahrer/Fussgaenger', 'positive', 50
  UNION ALL SELECT 'maps', 'fit_profiles', 'outdoor_hiking', 'Outdoor/hiking', 'Outdoor/Wandern', 'positive', 60
  UNION ALL SELECT 'maps', 'fit_profiles', 'ev_drivers', 'EV drivers', 'EV-Fahrer', 'neutral', 70
  UNION ALL SELECT 'maps', 'fit_profiles', 'accessibility_needs', 'Accessibility needs', 'Barrierefreiheitsbedarf', 'positive', 80
  UNION ALL SELECT 'maps', 'fit_profiles', 'developers', 'Developers', 'Entwickler', 'tradeoff', 90
  UNION ALL SELECT 'maps', 'fit_profiles', 'businesses', 'Businesses', 'Unternehmen', 'neutral', 100
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'maps'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'maps'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('015-maps-matrix-criteria');
