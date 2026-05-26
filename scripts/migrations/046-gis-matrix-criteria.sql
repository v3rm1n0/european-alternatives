-- Migration 046: Define GIS & Geospatial category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('gis', 'spatial_data_formats', 'Spatial Data Formats', 'Raumdatenformate', 'Supported vector, raster, point cloud, and web service data formats for import and interoperability.', 'Unterstuetzte Vektor-, Raster-, Punktwolken- und Webdienst-Datenformate fuer Import und Interoperabilitaet.', 100),
  ('gis', 'analysis_processing', 'Analysis & Processing', 'Analyse & Verarbeitung', 'Spatial analysis capabilities including vector operations, raster processing, statistics, geocoding, and terrain modeling.', 'Raeumliche Analysefaehigkeiten einschliesslich Vektoroperationen, Rasterverarbeitung, Statistik, Geokodierung und Gelaendemodellierung.', 200),
  ('gis', 'visualization_cartography', 'Visualization & Cartography', 'Visualisierung & Kartografie', 'Map rendering, thematic mapping styles, labeling, print composition, 3D visualization, and basemap integration.', 'Kartendarstellung, thematische Kartografiestile, Beschriftung, Druckzusammenstellung, 3D-Visualisierung und Basiskartenintegration.', 300),
  ('gis', 'coordinate_projection', 'Coordinate Systems & Projection', 'Koordinatensysteme & Projektion', 'Coordinate reference system support, on-the-fly reprojection, custom definitions, and datum transformations.', 'Unterstuetzung von Koordinatenreferenzsystemen, Echtzeit-Reprojektion, benutzerdefinierte Definitionen und Datumstransformationen.', 400),
  ('gis', 'data_management', 'Data Management & Storage', 'Datenverwaltung & Speicherung', 'Spatial indexing, versioned editing, attribute management, topology validation, and dataset scalability.', 'Raeumliche Indizierung, versionierte Bearbeitung, Attributverwaltung, Topologievalidierung und Datensatzskalierbarkeit.', 500),
  ('gis', 'field_mobile', 'Field & Mobile Capabilities', 'Feld- & Mobilfaehigkeiten', 'Mobile data collection, offline editing, GPS integration, custom forms, and field-to-server synchronization.', 'Mobile Datenerfassung, Offline-Bearbeitung, GPS-Integration, benutzerdefinierte Formulare und Feld-zu-Server-Synchronisierung.', 600),
  ('gis', 'extensibility_automation', 'Extensibility & Automation', 'Erweiterbarkeit & Automatisierung', 'Plugin support, scripting languages, processing frameworks, REST APIs, and command-line tooling.', 'Plugin-Unterstuetzung, Skriptsprachen, Verarbeitungs-Frameworks, REST-APIs und Kommandozeilen-Werkzeuge.', 700),
  ('gis', 'platform_deployment', 'Platform & Deployment', 'Plattform & Bereitstellung', 'Operating system support, deployment options, self-hosting, data residency, account requirements, and telemetry.', 'Betriebssystem-Unterstuetzung, Bereitstellungsoptionen, Selbst-Hosting, Datenresidenz, Kontoanforderungen und Telemetrie.', 800),
  ('gis', 'openness_pricing', 'Openness & Pricing', 'Offenheit & Preise', 'Source code availability, licensing, OGC standards compliance, pricing structure, and target user profiles.', 'Quellcode-Verfuegbarkeit, Lizenzierung, OGC-Standardkonformitaet, Preisstruktur und Zielgruppen-Benutzerprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'gis' AS category_id, 'spatial_data_formats' AS group_key, 'vector_format_support' AS criterion_key, 'Vector format support' AS label_en, 'Vektorformat-Unterstuetzung' AS label_de, 'multi_enum' AS value_type, 'informational' AS semantics, 'multi_select' AS filter_mode, 1010 AS sort_order, 'The vector geospatial data formats the tool can import and export, such as Shapefile, GeoJSON, GeoPackage, and KML.' AS help_text_en, 'Die Vektor-Geodatenformate, die das Werkzeug importieren und exportieren kann, wie Shapefile, GeoJSON, GeoPackage und KML.' AS help_text_de
  UNION ALL SELECT 'gis', 'spatial_data_formats', 'raster_format_support', 'Raster format support', 'Rasterformat-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 1020, 'The raster imagery and gridded data formats supported for reading and writing, including GeoTIFF, JPEG2000, and NetCDF.', 'Die unterstuetzten Rasterbilder- und Gitterdatenformate zum Lesen und Schreiben, einschliesslich GeoTIFF, JPEG2000 und NetCDF.'
  UNION ALL SELECT 'gis', 'spatial_data_formats', 'point_cloud_support', 'Point cloud support', 'Punktwolken-Unterstuetzung', 'boolean', 'informational', 'optional', 1030, 'Whether the tool can load and visualize point cloud data from LiDAR scanners or photogrammetry workflows.', 'Ob das Werkzeug Punktwolkendaten aus LiDAR-Scannern oder Photogrammetrie-Workflows laden und visualisieren kann.'
  UNION ALL SELECT 'gis', 'spatial_data_formats', 'gps_track_support', 'GPS track/waypoint support', 'GPS-Track/Wegpunkt-Unterstuetzung', 'boolean', 'informational', 'optional', 1040, 'Whether GPS tracks, waypoints, and routes in formats such as GPX or NMEA can be imported and displayed.', 'Ob GPS-Tracks, Wegpunkte und Routen in Formaten wie GPX oder NMEA importiert und angezeigt werden koennen.'
  UNION ALL SELECT 'gis', 'spatial_data_formats', 'wms_wfs_support', 'WMS/WFS/WMTS support', 'WMS/WFS/WMTS-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 1050, 'The OGC web service protocols supported for consuming remote geospatial data layers from external servers.', 'Die unterstuetzten OGC-Webdienstprotokolle zum Abrufen entfernter Geodatenlayer von externen Servern.'
  UNION ALL SELECT 'gis', 'spatial_data_formats', 'database_connectivity', 'Spatial database connectivity', 'Raeumliche Datenbankanbindung', 'multi_enum', 'informational', 'multi_select', 1060, 'The spatial database engines the tool can connect to for reading and writing geospatial features directly.', 'Die raeumlichen Datenbank-Engines, mit denen sich das Werkzeug zum direkten Lesen und Schreiben von Geoobjekten verbinden kann.'
  UNION ALL SELECT 'gis', 'spatial_data_formats', 'cad_format_support', 'CAD format support', 'CAD-Format-Unterstuetzung', 'boolean', 'informational', 'optional', 1070, 'Whether engineering and architecture CAD files such as DXF or DWG can be imported into the GIS environment.', 'Ob Ingenieur- und Architektur-CAD-Dateien wie DXF oder DWG in die GIS-Umgebung importiert werden koennen.'
  UNION ALL SELECT 'gis', 'analysis_processing', 'vector_analysis_tools', 'Vector analysis tools', 'Vektoranalyse-Werkzeuge', 'multi_enum', 'informational', 'multi_select', 2010, 'The geoprocessing operations available for vector data, such as buffering, overlay analysis, and spatial joins.', 'Die verfuegbaren Geoverarbeitungsoperationen fuer Vektordaten, wie Pufferung, Ueberlagerungsanalyse und raeumliche Verknuepfungen.'
  UNION ALL SELECT 'gis', 'analysis_processing', 'raster_analysis_tools', 'Raster analysis tools', 'Rasteranalyse-Werkzeuge', 'multi_enum', 'informational', 'multi_select', 2020, 'The analysis functions available for raster data, including reclassification, map algebra, and terrain derivatives.', 'Die verfuegbaren Analysefunktionen fuer Rasterdaten, einschliesslich Reklassifikation, Kartenalgebra und Gelaendeableitungen.'
  UNION ALL SELECT 'gis', 'analysis_processing', 'spatial_statistics', 'Spatial statistics', 'Raeumliche Statistik', 'boolean', 'informational', 'optional', 2030, 'Whether the tool provides statistical methods designed for spatially referenced data, such as hotspot analysis and autocorrelation.', 'Ob das Werkzeug statistische Methoden fuer raeumlich referenzierte Daten bereitstellt, wie Hotspot-Analyse und Autokorrelation.'
  UNION ALL SELECT 'gis', 'analysis_processing', 'geocoding_support', 'Geocoding/reverse geocoding', 'Geokodierung/Rueckwaertsgeokodierung', 'boolean', 'beneficial', 'optional', 2040, 'Whether addresses or place names can be converted to coordinates and vice versa using built-in or connected services.', 'Ob Adressen oder Ortsnamen mithilfe integrierter oder verbundener Dienste in Koordinaten umgewandelt werden koennen und umgekehrt.'
  UNION ALL SELECT 'gis', 'analysis_processing', 'terrain_analysis', 'Terrain/elevation analysis', 'Gelaende-/Hoehenanalyse', 'boolean', 'informational', 'optional', 2050, 'Whether the tool supports elevation-based analyses such as slope, aspect, hillshade, and contour generation from DEMs.', 'Ob das Werkzeug hoehenbasierte Analysen wie Neigung, Exposition, Schummerung und Konturenerzeugung aus DEMs unterstuetzt.'
  UNION ALL SELECT 'gis', 'analysis_processing', 'network_analysis', 'Network/routing analysis', 'Netzwerk-/Routenanalyse', 'boolean', 'informational', 'optional', 2060, 'Whether routing, shortest path, service area, and other graph-based analyses on transportation networks are available.', 'Ob Routenberechnung, kuerzester Pfad, Einzugsbereiche und andere graphbasierte Analysen auf Verkehrsnetzwerken verfuegbar sind.'
  UNION ALL SELECT 'gis', 'analysis_processing', 'batch_processing', 'Batch/bulk processing', 'Stapel-/Massenverarbeitung', 'boolean', 'beneficial', 'optional', 2070, 'Whether multiple geoprocessing tasks can be queued and executed automatically without manual intervention between steps.', 'Ob mehrere Geoverarbeitungsaufgaben in eine Warteschlange gestellt und automatisch ohne manuelles Eingreifen ausgefuehrt werden koennen.'
  UNION ALL SELECT 'gis', 'visualization_cartography', 'map_rendering_type', 'Map rendering type', 'Karten-Rendering-Typ', 'enum', 'informational', 'optional', 3010, 'The primary method used to draw maps on screen, from static image output to GPU-accelerated interactive rendering.', 'Die primaere Methode zur Kartendarstellung auf dem Bildschirm, von statischer Bildausgabe bis hin zu GPU-beschleunigtem interaktivem Rendering.'
  UNION ALL SELECT 'gis', 'visualization_cartography', 'thematic_mapping', 'Thematic mapping', 'Thematische Kartografie', 'multi_enum', 'informational', 'multi_select', 3020, 'The cartographic visualization techniques available for displaying data distributions across geographic features.', 'Die verfuegbaren kartografischen Visualisierungstechniken zur Darstellung von Datenverteilungen ueber geografische Objekte.'
  UNION ALL SELECT 'gis', 'visualization_cartography', 'labeling_engine', 'Labeling engine', 'Beschriftungs-Engine', 'enum', 'informational', 'optional', 3030, 'The sophistication of the automatic label placement system for annotating map features without visual overlap.', 'Der Entwicklungsgrad des automatischen Beschriftungssystems zur Annotierung von Kartenobjekten ohne visuelle Ueberlappung.'
  UNION ALL SELECT 'gis', 'visualization_cartography', 'print_layout_composer', 'Print layout/map composer', 'Drucklayout-/Kartenersteller', 'boolean', 'beneficial', 'optional', 3040, 'Whether the tool includes a layout editor for composing publication-ready maps with legends, scale bars, and north arrows.', 'Ob das Werkzeug einen Layout-Editor zum Erstellen druckfertiger Karten mit Legenden, Massstabsleisten und Nordpfeilen enthaelt.'
  UNION ALL SELECT 'gis', 'visualization_cartography', '3d_visualization', '3D visualization', '3D-Visualisierung', 'boolean', 'informational', 'optional', 3050, 'Whether geospatial data can be viewed in a three-dimensional perspective, including terrain draping and 3D building models.', 'Ob Geodaten in einer dreidimensionalen Perspektive betrachtet werden koennen, einschliesslich Gelaendeueberlagerung und 3D-Gebaeudemodellen.'
  UNION ALL SELECT 'gis', 'visualization_cartography', 'temporal_visualization', 'Temporal/time-series visualization', 'Zeitreihen-Visualisierung', 'boolean', 'informational', 'optional', 3060, 'Whether the tool can animate or filter spatial data along a time axis to show changes over different periods.', 'Ob das Werkzeug raeumliche Daten entlang einer Zeitachse animieren oder filtern kann, um Veraenderungen ueber verschiedene Zeitraeume darzustellen.'
  UNION ALL SELECT 'gis', 'visualization_cartography', 'basemap_providers', 'Basemap providers', 'Basiskarten-Anbieter', 'multi_enum', 'informational', 'multi_select', 3070, 'The background map tile services that can be used as reference layers beneath the operational user data.', 'Die Hintergrund-Kartenkacheldienste, die als Referenzlayer unter den operativen Benutzerdaten verwendet werden koennen.'
  UNION ALL SELECT 'gis', 'coordinate_projection', 'crs_support_model', 'CRS support model', 'CRS-Unterstuetzungsmodell', 'enum', 'informational', 'optional', 4010, 'The breadth of coordinate reference system support, from a limited built-in set to the full EPSG registry with custom definitions.', 'Der Umfang der Koordinatenreferenzsystem-Unterstuetzung, von einem begrenzten integrierten Satz bis zum vollstaendigen EPSG-Register mit benutzerdefinierten Definitionen.'
  UNION ALL SELECT 'gis', 'coordinate_projection', 'on_the_fly_reprojection', 'On-the-fly reprojection', 'Echtzeit-Reprojektion', 'boolean', 'beneficial', 'optional', 4020, 'Whether layers in different coordinate systems are automatically reprojected to a common display CRS without manual conversion.', 'Ob Layer in verschiedenen Koordinatensystemen automatisch in ein gemeinsames Anzeige-CRS umprojiziert werden ohne manuelle Konvertierung.'
  UNION ALL SELECT 'gis', 'coordinate_projection', 'custom_crs_definition', 'Custom CRS definition', 'Benutzerdefinierte CRS-Definition', 'boolean', 'informational', 'optional', 4030, 'Whether users can define their own coordinate reference systems using Proj4 strings, WKT, or similar notation.', 'Ob Benutzer eigene Koordinatenreferenzsysteme mittels Proj4-Zeichenketten, WKT oder aehnlicher Notation definieren koennen.'
  UNION ALL SELECT 'gis', 'coordinate_projection', 'datum_transformation', 'Datum transformation support', 'Datumstransformations-Unterstuetzung', 'boolean', 'informational', 'optional', 4040, 'Whether the tool supports geodetic datum transformations with appropriate grid shift files for high-accuracy conversions.', 'Ob das Werkzeug geodaetische Datumstransformationen mit geeigneten Gitterverschiebungsdateien fuer hochgenaue Umrechnungen unterstuetzt.'
  UNION ALL SELECT 'gis', 'data_management', 'spatial_indexing', 'Spatial indexing', 'Raeumliche Indizierung', 'boolean', 'beneficial', 'optional', 5010, 'Whether the tool creates and uses spatial indexes to accelerate queries and rendering on large geospatial datasets.', 'Ob das Werkzeug raeumliche Indizes erstellt und nutzt, um Abfragen und Rendering bei grossen Geodatensaetzen zu beschleunigen.'
  UNION ALL SELECT 'gis', 'data_management', 'versioned_editing', 'Versioned editing/history', 'Versionierte Bearbeitung/Verlauf', 'boolean', 'beneficial', 'optional', 5020, 'Whether edits to geospatial features are tracked with version history, allowing rollback and audit of changes.', 'Ob Aenderungen an Geoobjekten mit Versionsverlauf verfolgt werden, sodass Rueckgaengigmachen und Nachverfolgung moeglich sind.'
  UNION ALL SELECT 'gis', 'data_management', 'attribute_table_editing', 'Attribute table editing', 'Attributtabellen-Bearbeitung', 'boolean', 'informational', 'optional', 5030, 'Whether the tabular attribute data associated with spatial features can be viewed and edited directly in a table interface.', 'Ob die tabellarischen Attributdaten, die mit raeumlichen Objekten verknuepft sind, direkt in einer Tabellenoberflaeche angezeigt und bearbeitet werden koennen.'
  UNION ALL SELECT 'gis', 'data_management', 'topology_tools', 'Topology validation tools', 'Topologie-Validierungswerkzeuge', 'boolean', 'informational', 'optional', 5040, 'Whether the tool can check and enforce topological rules such as polygon gaps, overlaps, and dangling line segments.', 'Ob das Werkzeug topologische Regeln wie Polygonluecken, Ueberlappungen und freie Liniensegmente pruefen und durchsetzen kann.'
  UNION ALL SELECT 'gis', 'data_management', 'data_catalog_metadata', 'Data catalog/metadata management', 'Datenkatalog-/Metadatenverwaltung', 'boolean', 'informational', 'optional', 5050, 'Whether the tool provides a catalog interface for browsing, searching, and managing metadata of available geospatial datasets.', 'Ob das Werkzeug eine Katalogoberflaeche zum Durchsuchen, Suchen und Verwalten von Metadaten verfuegbarer Geodatensaetze bietet.'
  UNION ALL SELECT 'gis', 'data_management', 'max_dataset_scale', 'Maximum dataset scale', 'Maximale Datensatzgroesse', 'enum', 'informational', 'optional', 5060, 'The maximum number of geospatial features the tool can handle effectively before performance degrades significantly.', 'Die maximale Anzahl an Geoobjekten, die das Werkzeug effektiv verarbeiten kann, bevor die Leistung erheblich nachlasst.'
  UNION ALL SELECT 'gis', 'field_mobile', 'mobile_data_collection', 'Mobile data collection', 'Mobile Datenerfassung', 'boolean', 'beneficial', 'must_match', 6010, 'Whether the tool supports collecting geospatial data in the field using mobile devices with GPS positioning.', 'Ob das Werkzeug die Erfassung von Geodaten im Feld mittels mobiler Geraete mit GPS-Positionierung unterstuetzt.'
  UNION ALL SELECT 'gis', 'field_mobile', 'offline_field_editing', 'Offline field editing', 'Offline-Feldbearbeitung', 'boolean', 'beneficial', 'optional', 6020, 'Whether geospatial features can be created and edited in the field without an active internet connection.', 'Ob Geoobjekte im Feld ohne aktive Internetverbindung erstellt und bearbeitet werden koennen.'
  UNION ALL SELECT 'gis', 'field_mobile', 'gps_integration', 'GPS/GNSS integration', 'GPS/GNSS-Integration', 'boolean', 'informational', 'optional', 6030, 'Whether the tool can receive real-time position data from connected GPS or GNSS receivers for navigation and data capture.', 'Ob das Werkzeug Echtzeit-Positionsdaten von verbundenen GPS- oder GNSS-Empfaengern fuer Navigation und Datenerfassung empfangen kann.'
  UNION ALL SELECT 'gis', 'field_mobile', 'field_form_designer', 'Field form designer', 'Feld-Formulardesigner', 'boolean', 'informational', 'optional', 6040, 'Whether custom data entry forms can be designed for structured field data collection with validation rules.', 'Ob benutzerdefinierte Dateneingabeformulare fuer strukturierte Felddatenerfassung mit Validierungsregeln gestaltet werden koennen.'
  UNION ALL SELECT 'gis', 'field_mobile', 'field_sync_model', 'Field-to-server sync model', 'Feld-zu-Server-Synchronisierung', 'enum', 'informational', 'optional', 6050, 'How collected field data is synchronized between mobile devices and the central server or database.', 'Wie erfasste Felddaten zwischen mobilen Geraeten und dem zentralen Server oder der Datenbank synchronisiert werden.'
  UNION ALL SELECT 'gis', 'extensibility_automation', 'plugin_ecosystem', 'Plugin/extension ecosystem', 'Plugin-/Erweiterungs-Oekosystem', 'boolean', 'beneficial', 'optional', 7010, 'Whether the tool supports third-party plugins or extensions that add functionality beyond the core feature set.', 'Ob das Werkzeug Drittanbieter-Plugins oder Erweiterungen unterstuetzt, die Funktionen ueber den Kernumfang hinaus hinzufuegen.'
  UNION ALL SELECT 'gis', 'extensibility_automation', 'scripting_language', 'Scripting language support', 'Skriptsprachen-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 7020, 'The programming and scripting languages available for automating workflows and extending tool capabilities.', 'Die verfuegbaren Programmier- und Skriptsprachen zur Automatisierung von Workflows und Erweiterung der Werkzeugfaehigkeiten.'
  UNION ALL SELECT 'gis', 'extensibility_automation', 'processing_framework', 'Processing/model framework', 'Verarbeitungs-/Modell-Framework', 'boolean', 'informational', 'optional', 7030, 'Whether the tool includes a graphical or programmatic framework for chaining geoprocessing steps into reusable models.', 'Ob das Werkzeug ein grafisches oder programmatisches Framework zum Verketten von Geoverarbeitungsschritten zu wiederverwendbaren Modellen enthaelt.'
  UNION ALL SELECT 'gis', 'extensibility_automation', 'rest_api_available', 'REST API available', 'REST-API verfuegbar', 'boolean', 'beneficial', 'optional', 7040, 'Whether the tool exposes a REST API for remote access to geospatial data and processing capabilities.', 'Ob das Werkzeug eine REST-API fuer den Fernzugriff auf Geodaten und Verarbeitungsfaehigkeiten bereitstellt.'
  UNION ALL SELECT 'gis', 'extensibility_automation', 'cli_tools', 'Command-line tools', 'Kommandozeilen-Werkzeuge', 'boolean', 'informational', 'optional', 7050, 'Whether command-line utilities are provided for headless operation, batch scripting, and integration into automated pipelines.', 'Ob Kommandozeilen-Dienstprogramme fuer den kopflosen Betrieb, Stapelskripte und die Integration in automatisierte Pipelines bereitgestellt werden.'
  UNION ALL SELECT 'gis', 'platform_deployment', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 8010, 'The operating systems and device types on which the GIS tool can be installed and used.', 'Die Betriebssysteme und Geraetetypen, auf denen das GIS-Werkzeug installiert und genutzt werden kann.'
  UNION ALL SELECT 'gis', 'platform_deployment', 'deployment_model', 'Deployment model', 'Bereitstellungsmodell', 'enum', 'tradeoff', 'must_match', 8020, 'How the GIS tool is deployed and accessed, ranging from local desktop installation to cloud-hosted services.', 'Wie das GIS-Werkzeug bereitgestellt und genutzt wird, von lokaler Desktop-Installation bis hin zu cloudbasierten Diensten.'
  UNION ALL SELECT 'gis', 'platform_deployment', 'self_hosting_available', 'Self-hosting available', 'Selbst-Hosting verfuegbar', 'boolean', 'beneficial', 'must_match', 8030, 'Whether the server component can be installed and operated on self-managed infrastructure rather than vendor cloud services.', 'Ob die Serverkomponente auf eigener Infrastruktur installiert und betrieben werden kann, anstatt auf vom Anbieter verwaltete Cloud-Dienste angewiesen zu sein.'
  UNION ALL SELECT 'gis', 'platform_deployment', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 8040, 'The geographic region where uploaded geospatial data is stored and processed, relevant for data sovereignty compliance.', 'Die geografische Region, in der hochgeladene Geodaten gespeichert und verarbeitet werden, relevant fuer die Einhaltung der Datensouveraenitaet.'
  UNION ALL SELECT 'gis', 'platform_deployment', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 8050, 'Whether creating a user account is mandatory before the GIS tool can be downloaded or used.', 'Ob das Erstellen eines Benutzerkontos erforderlich ist, bevor das GIS-Werkzeug heruntergeladen oder verwendet werden kann.'
  UNION ALL SELECT 'gis', 'platform_deployment', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 8060, 'How the GIS tool collects and transmits usage analytics and diagnostic telemetry data to the vendor.', 'Wie das GIS-Werkzeug Nutzungsanalysen und diagnostische Telemetriedaten an den Anbieter erfasst und uebertraegt.'
  UNION ALL SELECT 'gis', 'openness_pricing', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The availability and openness of the GIS tool source code for inspection, modification, and community contribution.', 'Die Verfuegbarkeit und Offenheit des GIS-Werkzeug-Quellcodes zur Einsicht, Modifikation und Gemeinschaftsbeteiligung.'
  UNION ALL SELECT 'gis', 'openness_pricing', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 9020, 'The software license governing redistribution and use of the GIS tool, from copyleft to permissive to proprietary.', 'Die Softwarelizenz, die Weiterverbreitung und Nutzung des GIS-Werkzeugs regelt, von Copyleft ueber permissiv bis proprietaer.'
  UNION ALL SELECT 'gis', 'openness_pricing', 'ogc_compliance', 'OGC standards compliance', 'OGC-Standardkonformitaet', 'multi_enum', 'beneficial', 'multi_select', 9030, 'Which Open Geospatial Consortium interoperability standards the tool formally implements or supports.', 'Welche Interoperabilitaetsstandards des Open Geospatial Consortium das Werkzeug formell implementiert oder unterstuetzt.'
  UNION ALL SELECT 'gis', 'openness_pricing', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9040, 'The pricing structure for obtaining and using the GIS tool, such as free, freemium, subscription, or one-time purchase.', 'Die Preisstruktur fuer den Erwerb und die Nutzung des GIS-Werkzeugs, wie kostenlos, Freemium, Abonnement oder Einmalkauf.'
  UNION ALL SELECT 'gis', 'openness_pricing', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfuegbar', 'boolean', 'informational', 'must_match', 9050, 'Whether a functional free version of the GIS tool is available without payment requirements or time-limited trials.', 'Ob eine funktionsfaehige kostenlose Version des GIS-Werkzeugs ohne Zahlungsanforderungen oder zeitlich begrenzte Testversionen verfuegbar ist.'
  UNION ALL SELECT 'gis', 'openness_pricing', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9060, 'Target user roles and professional profiles the GIS tool is best suited for based on its features and workflow design.', 'Zielgruppen-Benutzerrollen und professionelle Profile, fuer die das GIS-Werkzeug basierend auf seinen Funktionen und Workflow-Design am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'gis' AS category_id, 'vector_format_support' AS criterion_key, 'shapefile' AS option_key, 'Shapefile' AS label_en, 'Shapefile' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'gis', 'vector_format_support', 'geojson', 'GeoJSON', 'GeoJSON', 'neutral', 20
  UNION ALL SELECT 'gis', 'vector_format_support', 'geopackage', 'GeoPackage/GPKG', 'GeoPackage/GPKG', 'neutral', 30
  UNION ALL SELECT 'gis', 'vector_format_support', 'kml_kmz', 'KML/KMZ', 'KML/KMZ', 'neutral', 40
  UNION ALL SELECT 'gis', 'vector_format_support', 'gml', 'GML', 'GML', 'neutral', 50
  UNION ALL SELECT 'gis', 'vector_format_support', 'geotiff_vector', 'GeoDatabase', 'GeoDatabase', 'neutral', 60
  UNION ALL SELECT 'gis', 'vector_format_support', 'flatgeobuf', 'FlatGeobuf', 'FlatGeobuf', 'neutral', 70
  UNION ALL SELECT 'gis', 'vector_format_support', 'csv_xy', 'CSV with coordinates', 'CSV mit Koordinaten', 'neutral', 80
  UNION ALL SELECT 'gis', 'raster_format_support', 'geotiff', 'GeoTIFF', 'GeoTIFF', 'neutral', 10
  UNION ALL SELECT 'gis', 'raster_format_support', 'jpeg2000', 'JPEG2000', 'JPEG2000', 'neutral', 20
  UNION ALL SELECT 'gis', 'raster_format_support', 'ecw', 'ECW', 'ECW', 'neutral', 30
  UNION ALL SELECT 'gis', 'raster_format_support', 'mrsid', 'MrSID', 'MrSID', 'neutral', 40
  UNION ALL SELECT 'gis', 'raster_format_support', 'netcdf', 'NetCDF', 'NetCDF', 'neutral', 50
  UNION ALL SELECT 'gis', 'raster_format_support', 'hdf', 'HDF4/HDF5', 'HDF4/HDF5', 'neutral', 60
  UNION ALL SELECT 'gis', 'raster_format_support', 'ascii_grid', 'ASCII Grid', 'ASCII-Raster', 'neutral', 70
  UNION ALL SELECT 'gis', 'raster_format_support', 'cloud_optimized_geotiff', 'Cloud Optimized GeoTIFF', 'Cloud-optimiertes GeoTIFF', 'positive', 80
  UNION ALL SELECT 'gis', 'wms_wfs_support', 'wms', 'WMS', 'WMS', 'neutral', 10
  UNION ALL SELECT 'gis', 'wms_wfs_support', 'wfs', 'WFS', 'WFS', 'neutral', 20
  UNION ALL SELECT 'gis', 'wms_wfs_support', 'wmts', 'WMTS', 'WMTS', 'neutral', 30
  UNION ALL SELECT 'gis', 'wms_wfs_support', 'wcs', 'WCS', 'WCS', 'neutral', 40
  UNION ALL SELECT 'gis', 'wms_wfs_support', 'wps', 'WPS', 'WPS', 'neutral', 50
  UNION ALL SELECT 'gis', 'wms_wfs_support', 'ogc_api_features', 'OGC API Features', 'OGC-API-Features', 'positive', 60
  UNION ALL SELECT 'gis', 'database_connectivity', 'postgis', 'PostGIS', 'PostGIS', 'positive', 10
  UNION ALL SELECT 'gis', 'database_connectivity', 'spatialite', 'SpatiaLite', 'SpatiaLite', 'neutral', 20
  UNION ALL SELECT 'gis', 'database_connectivity', 'oracle_spatial', 'Oracle Spatial', 'Oracle Spatial', 'neutral', 30
  UNION ALL SELECT 'gis', 'database_connectivity', 'mssql_spatial', 'MS SQL Spatial', 'MS SQL Spatial', 'neutral', 40
  UNION ALL SELECT 'gis', 'database_connectivity', 'geopackage_db', 'GeoPackage as DB', 'GeoPackage als Datenbank', 'neutral', 50
  UNION ALL SELECT 'gis', 'vector_analysis_tools', 'buffer', 'Buffer', 'Puffer', 'neutral', 10
  UNION ALL SELECT 'gis', 'vector_analysis_tools', 'overlay', 'Overlay/intersection', 'Ueberlagerung/Verschneidung', 'neutral', 20
  UNION ALL SELECT 'gis', 'vector_analysis_tools', 'dissolve', 'Dissolve/merge', 'Zusammenfuehren/Verschmelzen', 'neutral', 30
  UNION ALL SELECT 'gis', 'vector_analysis_tools', 'spatial_join', 'Spatial join', 'Raeumliche Verknuepfung', 'neutral', 40
  UNION ALL SELECT 'gis', 'vector_analysis_tools', 'voronoi', 'Voronoi/Thiessen', 'Voronoi/Thiessen', 'neutral', 50
  UNION ALL SELECT 'gis', 'vector_analysis_tools', 'convex_hull', 'Convex hull', 'Konvexe Huelle', 'neutral', 60
  UNION ALL SELECT 'gis', 'vector_analysis_tools', 'clip', 'Clip/extract', 'Ausschneiden/Extrahieren', 'neutral', 70
  UNION ALL SELECT 'gis', 'raster_analysis_tools', 'reclassify', 'Reclassify', 'Reklassifizieren', 'neutral', 10
  UNION ALL SELECT 'gis', 'raster_analysis_tools', 'map_algebra', 'Map algebra', 'Kartenalgebra', 'neutral', 20
  UNION ALL SELECT 'gis', 'raster_analysis_tools', 'interpolation', 'Interpolation', 'Interpolation', 'neutral', 30
  UNION ALL SELECT 'gis', 'raster_analysis_tools', 'viewshed', 'Viewshed', 'Sichtfeldanalyse', 'neutral', 40
  UNION ALL SELECT 'gis', 'raster_analysis_tools', 'watershed', 'Watershed', 'Einzugsgebiet', 'neutral', 50
  UNION ALL SELECT 'gis', 'raster_analysis_tools', 'zonal_statistics', 'Zonal statistics', 'Zonenstatistik', 'neutral', 60
  UNION ALL SELECT 'gis', 'raster_analysis_tools', 'ndvi_indices', 'Spectral indices/NDVI', 'Spektralindizes/NDVI', 'neutral', 70
  UNION ALL SELECT 'gis', 'map_rendering_type', 'static_2d', 'Static 2D', 'Statisch 2D', 'neutral', 10
  UNION ALL SELECT 'gis', 'map_rendering_type', 'interactive_2d', 'Interactive 2D', 'Interaktiv 2D', 'neutral', 20
  UNION ALL SELECT 'gis', 'map_rendering_type', 'webgl_accelerated', 'WebGL accelerated', 'WebGL-beschleunigt', 'neutral', 30
  UNION ALL SELECT 'gis', 'map_rendering_type', 'server_side_rendered', 'Server-side rendered', 'Serverseitig gerendert', 'neutral', 40
  UNION ALL SELECT 'gis', 'thematic_mapping', 'choropleth', 'Choropleth', 'Choropleth', 'neutral', 10
  UNION ALL SELECT 'gis', 'thematic_mapping', 'graduated_symbols', 'Graduated symbols', 'Abgestufte Symbole', 'neutral', 20
  UNION ALL SELECT 'gis', 'thematic_mapping', 'dot_density', 'Dot density', 'Punktdichte', 'neutral', 30
  UNION ALL SELECT 'gis', 'thematic_mapping', 'heat_map', 'Heat map', 'Heatmap', 'neutral', 40
  UNION ALL SELECT 'gis', 'thematic_mapping', 'proportional_symbols', 'Proportional symbols', 'Proportionale Symbole', 'neutral', 50
  UNION ALL SELECT 'gis', 'thematic_mapping', 'bivariate', 'Bivariate', 'Bivariat', 'neutral', 60
  UNION ALL SELECT 'gis', 'labeling_engine', 'manual_only', 'Manual placement only', 'Nur manuelle Platzierung', 'warning', 10
  UNION ALL SELECT 'gis', 'labeling_engine', 'rule_based', 'Rule-based auto-placement', 'Regelbasierte automatische Platzierung', 'neutral', 20
  UNION ALL SELECT 'gis', 'labeling_engine', 'pal_engine', 'Advanced conflict-free placement', 'Erweiterte kollisionsfreie Platzierung', 'positive', 30
  UNION ALL SELECT 'gis', 'basemap_providers', 'osm', 'OpenStreetMap', 'OpenStreetMap', 'neutral', 10
  UNION ALL SELECT 'gis', 'basemap_providers', 'stamen_stadia', 'Stamen/Stadia', 'Stamen/Stadia', 'neutral', 20
  UNION ALL SELECT 'gis', 'basemap_providers', 'mapbox', 'Mapbox', 'Mapbox', 'neutral', 30
  UNION ALL SELECT 'gis', 'basemap_providers', 'google', 'Google Maps', 'Google Maps', 'neutral', 40
  UNION ALL SELECT 'gis', 'basemap_providers', 'bing', 'Bing Maps', 'Bing Maps', 'neutral', 50
  UNION ALL SELECT 'gis', 'basemap_providers', 'esri', 'Esri', 'Esri', 'neutral', 60
  UNION ALL SELECT 'gis', 'basemap_providers', 'custom_xyz', 'Custom XYZ tiles', 'Benutzerdefinierte XYZ-Kacheln', 'neutral', 70
  UNION ALL SELECT 'gis', 'basemap_providers', 'offline_basemaps', 'Offline basemaps', 'Offline-Basiskarten', 'neutral', 80
  UNION ALL SELECT 'gis', 'crs_support_model', 'limited_crs', 'Limited CRS set', 'Begrenzter CRS-Satz', 'warning', 10
  UNION ALL SELECT 'gis', 'crs_support_model', 'epsg_registry', 'Full EPSG registry', 'Vollstaendiges EPSG-Register', 'neutral', 20
  UNION ALL SELECT 'gis', 'crs_support_model', 'custom_and_epsg', 'EPSG + custom definitions', 'EPSG + benutzerdefinierte Definitionen', 'positive', 30
  UNION ALL SELECT 'gis', 'max_dataset_scale', 'small', 'Small datasets < 100K features', 'Kleine Datensaetze < 100K Objekte', 'warning', 10
  UNION ALL SELECT 'gis', 'max_dataset_scale', 'medium', 'Medium up to 1M features', 'Mittel bis 1M Objekte', 'neutral', 20
  UNION ALL SELECT 'gis', 'max_dataset_scale', 'large', 'Large 1M-10M features', 'Gross 1M-10M Objekte', 'neutral', 30
  UNION ALL SELECT 'gis', 'max_dataset_scale', 'enterprise', 'Enterprise 10M+ features', 'Enterprise 10M+ Objekte', 'positive', 40
  UNION ALL SELECT 'gis', 'field_sync_model', 'manual_sync', 'Manual file sync', 'Manueller Dateiabgleich', 'neutral', 10
  UNION ALL SELECT 'gis', 'field_sync_model', 'cloud_push_pull', 'Cloud push/pull', 'Cloud-Push/Pull', 'neutral', 20
  UNION ALL SELECT 'gis', 'field_sync_model', 'real_time_sync', 'Real-time bidirectional sync', 'Bidirektionale Echtzeit-Synchronisierung', 'positive', 30
  UNION ALL SELECT 'gis', 'scripting_language', 'python', 'Python', 'Python', 'neutral', 10
  UNION ALL SELECT 'gis', 'scripting_language', 'r_language', 'R', 'R', 'neutral', 20
  UNION ALL SELECT 'gis', 'scripting_language', 'javascript', 'JavaScript', 'JavaScript', 'neutral', 30
  UNION ALL SELECT 'gis', 'scripting_language', 'sql', 'SQL expressions', 'SQL-Ausdruecke', 'neutral', 40
  UNION ALL SELECT 'gis', 'scripting_language', 'graphical_modeler', 'Graphical model builder', 'Grafischer Modellbauer', 'neutral', 50
  UNION ALL SELECT 'gis', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'gis', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'gis', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'gis', 'supported_platforms', 'web', 'Web browser', 'Webbrowser', 'neutral', 40
  UNION ALL SELECT 'gis', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'gis', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 60
  UNION ALL SELECT 'gis', 'deployment_model', 'desktop_only', 'Desktop only', 'Nur Desktop', 'neutral', 10
  UNION ALL SELECT 'gis', 'deployment_model', 'client_server', 'Client-server', 'Client-Server', 'neutral', 20
  UNION ALL SELECT 'gis', 'deployment_model', 'saas_cloud', 'SaaS/cloud', 'SaaS/Cloud', 'tradeoff', 30
  UNION ALL SELECT 'gis', 'deployment_model', 'hybrid', 'Hybrid desktop + cloud', 'Hybrid Desktop + Cloud', 'neutral', 40
  UNION ALL SELECT 'gis', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'gis', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'gis', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'gis', 'data_processing_location', 'local_device', 'Local device', 'Lokales Geraet', 'positive', 40
  UNION ALL SELECT 'gis', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'gis', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'gis', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'gis', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'gis', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'gis', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'gis', 'source_model', 'fully_open_source', 'Fully open source', 'Vollstaendig quelloffen', 'positive', 10
  UNION ALL SELECT 'gis', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'gis', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'gis', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'gis', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'gis', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'gis', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'gis', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'gis', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 50
  UNION ALL SELECT 'gis', 'ogc_compliance', 'ogc_simple_features', 'Simple Features', 'Simple Features', 'neutral', 10
  UNION ALL SELECT 'gis', 'ogc_compliance', 'ogc_wms', 'WMS compliance', 'WMS-Konformitaet', 'neutral', 20
  UNION ALL SELECT 'gis', 'ogc_compliance', 'ogc_wfs', 'WFS compliance', 'WFS-Konformitaet', 'neutral', 30
  UNION ALL SELECT 'gis', 'ogc_compliance', 'ogc_geopackage', 'GeoPackage compliance', 'GeoPackage-Konformitaet', 'neutral', 40
  UNION ALL SELECT 'gis', 'ogc_compliance', 'ogc_api', 'OGC API compliance', 'OGC-API-Konformitaet', 'neutral', 50
  UNION ALL SELECT 'gis', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'gis', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'gis', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'gis', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'gis', 'pricing_model', 'per_seat', 'Per seat', 'Pro Arbeitsplatz', 'neutral', 50
  UNION ALL SELECT 'gis', 'fit_profiles', 'researcher', 'Researcher/academic', 'Forscher/Akademiker', 'neutral', 10
  UNION ALL SELECT 'gis', 'fit_profiles', 'urban_planner', 'Urban planner', 'Stadtplaner', 'neutral', 20
  UNION ALL SELECT 'gis', 'fit_profiles', 'environmental_analyst', 'Environmental analyst', 'Umweltanalytiker', 'neutral', 30
  UNION ALL SELECT 'gis', 'fit_profiles', 'surveyor', 'Surveyor', 'Vermesser', 'neutral', 40
  UNION ALL SELECT 'gis', 'fit_profiles', 'utility_management', 'Utility management', 'Versorgungswirtschaft', 'neutral', 50
  UNION ALL SELECT 'gis', 'fit_profiles', 'developer', 'Developer/integrator', 'Entwickler/Integrator', 'neutral', 60
  UNION ALL SELECT 'gis', 'fit_profiles', 'hobbyist', 'Hobbyist/OSM contributor', 'Hobbyist/OSM-Beitraeger', 'neutral', 70
  UNION ALL SELECT 'gis', 'fit_profiles', 'enterprise_gis', 'Enterprise GIS team', 'Enterprise-GIS-Team', 'neutral', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'gis'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'gis'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('046-gis-matrix-criteria');
