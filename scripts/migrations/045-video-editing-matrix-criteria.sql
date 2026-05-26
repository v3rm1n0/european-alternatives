-- Migration 045: Define Video Editing category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('video-editing', 'editing_capabilities', 'Editing Capabilities', 'Bearbeitungsfaehigkeiten', 'Core editing workflow features including timeline type, multi-track support, trimming precision, and clip manipulation.', 'Kernfunktionen des Bearbeitungs-Workflows einschliesslich Zeitleistentyp, Mehrspur-Unterstuetzung, Schnittpraezision und Clip-Manipulation.', 100),
  ('video-editing', 'media_format_support', 'Media Format Support', 'Medienformat-Unterstuetzung', 'Input and output codec support, resolution capabilities, and handling of specialized footage formats.', 'Unterstuetzung fuer Ein- und Ausgabecodecs, Aufloesungsfaehigkeiten und Verarbeitung spezialisierter Aufnahmeformate.', 200),
  ('video-editing', 'effects_compositing', 'Effects & Compositing', 'Effekte & Compositing', 'Built-in visual effects, color grading tools, chroma keying, motion tracking, and title creation features.', 'Integrierte visuelle Effekte, Farbkorrektur-Werkzeuge, Chroma-Keying, Bewegungsverfolgung und Titelerstellungs-Funktionen.', 300),
  ('video-editing', 'audio_tools', 'Audio Tools', 'Audiowerkzeuge', 'Audio editing capabilities including mixing, effects processing, noise reduction, and voice recording features.', 'Audiobearbeitungsfaehigkeiten einschliesslich Mischung, Effektverarbeitung, Rauschunterdrueckung und Sprachaufnahme-Funktionen.', 400),
  ('video-editing', 'performance_workflow', 'Performance & Workflow', 'Leistung & Workflow', 'Hardware acceleration, proxy editing, rendering pipeline, project management, and undo capabilities.', 'Hardwarebeschleunigung, Proxy-Bearbeitung, Rendering-Pipeline, Projektverwaltung und Rueckgaengig-Funktionen.', 500),
  ('video-editing', 'collaboration_sharing', 'Collaboration & Sharing', 'Zusammenarbeit & Teilen', 'Team collaboration features, review tools, direct publishing targets, and project file sharing formats.', 'Teamzusammenarbeit-Funktionen, Ueberpruefungswerkzeuge, Direktveroeffentlichungsziele und Projektdatei-Freigabeformate.', 600),
  ('video-editing', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Supported operating systems, plugin extensibility, scripting automation, and offline editing support.', 'Unterstuetzte Betriebssysteme, Plugin-Erweiterbarkeit, Skript-Automatisierung und Offline-Bearbeitungs-Unterstuetzung.', 700),
  ('video-editing', 'privacy_data', 'Privacy & Data Handling', 'Datenschutz & Datenverarbeitung', 'Telemetry collection practices, data processing location, account requirements, and crash reporting behavior.', 'Telemetrie-Erfassungspraktiken, Datenverarbeitungsstandort, Kontoanforderungen und Absturzbericht-Verhalten.', 800),
  ('video-editing', 'openness_pricing', 'Openness & Pricing', 'Offenheit & Preise', 'Source code availability, software licensing, pricing structure, and target user profiles for the video editor.', 'Quellcode-Verfuegbarkeit, Softwarelizenzierung, Preisstruktur und Zielgruppen-Benutzerprofile fuer den Videoeditor.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'video-editing' AS category_id, 'editing_capabilities' AS group_key, 'timeline_type' AS criterion_key, 'Timeline type' AS label_en, 'Zeitleistentyp' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'The fundamental editing paradigm used by the tool, such as single-track, multi-track timeline, or node-based compositing.' AS help_text_en, 'Das grundlegende Bearbeitungsparadigma des Werkzeugs, wie Einzelspur, Mehrspur-Zeitleiste oder knotenbasiertes Compositing.' AS help_text_de
  UNION ALL SELECT 'video-editing', 'editing_capabilities', 'multi_track_video', 'Multi-track video', 'Mehrspur-Video', 'boolean', 'informational', 'optional', 1020, 'Whether the editor supports layering multiple video tracks simultaneously on the timeline.', 'Ob der Editor das gleichzeitige Uebereinanderlegen mehrerer Videospuren auf der Zeitleiste unterstuetzt.'
  UNION ALL SELECT 'video-editing', 'editing_capabilities', 'multi_track_audio', 'Multi-track audio', 'Mehrspur-Audio', 'boolean', 'informational', 'optional', 1030, 'Whether the editor supports mixing multiple independent audio tracks on the timeline.', 'Ob der Editor das Mischen mehrerer unabhaengiger Audiospuren auf der Zeitleiste unterstuetzt.'
  UNION ALL SELECT 'video-editing', 'editing_capabilities', 'trimming_model', 'Trimming model', 'Schnittmodell', 'multi_enum', 'informational', 'multi_select', 1040, 'The precision editing modes available for trimming clips, such as ripple, roll, slip, and slide edits.', 'Die verfuegbaren Praezisionsbearbeitungsmodi zum Schneiden von Clips, wie Ripple-, Roll-, Slip- und Slide-Schnitte.'
  UNION ALL SELECT 'video-editing', 'editing_capabilities', 'keyframe_animation', 'Keyframe animation', 'Keyframe-Animation', 'boolean', 'beneficial', 'optional', 1050, 'Whether clip properties such as position, scale, opacity, and effects can be animated using keyframes over time.', 'Ob Clip-Eigenschaften wie Position, Skalierung, Deckkraft und Effekte mittels Keyframes ueber die Zeit animiert werden koennen.'
  UNION ALL SELECT 'video-editing', 'editing_capabilities', 'multicam_editing', 'Multicam editing', 'Mehrkamera-Bearbeitung', 'boolean', 'informational', 'optional', 1060, 'Whether the tool can synchronize and switch between footage from multiple camera angles in a single editing session.', 'Ob das Werkzeug Aufnahmen aus mehreren Kamerawinkeln in einer einzigen Bearbeitungssitzung synchronisieren und umschalten kann.'
  UNION ALL SELECT 'video-editing', 'editing_capabilities', 'storyboard_mode', 'Storyboard mode', 'Storyboard-Modus', 'boolean', 'informational', 'optional', 1070, 'Whether a simplified drag-and-drop storyboard view is available for quick clip assembly and rough cuts.', 'Ob eine vereinfachte Drag-and-Drop-Storyboard-Ansicht fuer schnelle Clip-Zusammenstellung und Rohschnitte verfuegbar ist.'
  UNION ALL SELECT 'video-editing', 'editing_capabilities', 'speed_ramping', 'Speed ramping', 'Geschwindigkeitsrampen', 'boolean', 'informational', 'optional', 1080, 'Whether the tool supports smooth variable speed changes within a single clip using speed curves.', 'Ob das Werkzeug fliessende variable Geschwindigkeitsaenderungen innerhalb eines einzelnen Clips mittels Geschwindigkeitskurven unterstuetzt.'
  UNION ALL SELECT 'video-editing', 'media_format_support', 'input_video_codecs', 'Input video codecs', 'Eingabe-Videocodecs', 'multi_enum', 'informational', 'multi_select', 2010, 'The video codecs that can be imported and decoded for editing, such as H.264, H.265, ProRes, or AV1.', 'Die Videocodecs, die zum Bearbeiten importiert und dekodiert werden koennen, wie H.264, H.265, ProRes oder AV1.'
  UNION ALL SELECT 'video-editing', 'media_format_support', 'output_video_codecs', 'Output video codecs', 'Ausgabe-Videocodecs', 'multi_enum', 'informational', 'multi_select', 2020, 'The video codecs available for rendering and exporting the final edited project.', 'Die Videocodecs, die zum Rendern und Exportieren des fertig bearbeiteten Projekts verfuegbar sind.'
  UNION ALL SELECT 'video-editing', 'media_format_support', 'max_export_resolution', 'Maximum export resolution', 'Maximale Exportaufloesung', 'enum', 'informational', 'optional', 2030, 'The highest output resolution the editor can render to when exporting finished video projects.', 'Die hoechste Ausgabeaufloesung, in der der Editor fertige Videoprojekte rendern kann.'
  UNION ALL SELECT 'video-editing', 'media_format_support', 'hdr_support', 'HDR support', 'HDR-Unterstuetzung', 'boolean', 'informational', 'optional', 2040, 'Whether high dynamic range color spaces such as HDR10, HLG, or Dolby Vision are supported for editing and export.', 'Ob High-Dynamic-Range-Farbraeume wie HDR10, HLG oder Dolby Vision fuer Bearbeitung und Export unterstuetzt werden.'
  UNION ALL SELECT 'video-editing', 'media_format_support', 'raw_footage_support', 'RAW footage support', 'RAW-Material-Unterstuetzung', 'boolean', 'informational', 'optional', 2050, 'Whether camera RAW formats such as Blackmagic RAW, RED R3D, or CinemaDNG can be imported and edited natively.', 'Ob Kamera-RAW-Formate wie Blackmagic RAW, RED R3D oder CinemaDNG nativ importiert und bearbeitet werden koennen.'
  UNION ALL SELECT 'video-editing', 'media_format_support', 'image_sequence_import', 'Image sequence import', 'Bildsequenz-Import', 'boolean', 'informational', 'optional', 2060, 'Whether numbered image sequences such as EXR or TIFF stacks can be imported as video clips on the timeline.', 'Ob nummerierte Bildsequenzen wie EXR- oder TIFF-Stapel als Videoclips auf der Zeitleiste importiert werden koennen.'
  UNION ALL SELECT 'video-editing', 'effects_compositing', 'builtin_video_effects', 'Built-in video effects', 'Integrierte Videoeffekte', 'boolean', 'informational', 'optional', 3010, 'Whether the editor includes a library of built-in transitions, filters, and visual effects ready to use.', 'Ob der Editor eine Bibliothek mit integrierten Uebergaengen, Filtern und visuellen Effekten enthaelt.'
  UNION ALL SELECT 'video-editing', 'effects_compositing', 'color_grading', 'Color grading tools', 'Farbkorrektur-Werkzeuge', 'enum', 'informational', 'optional', 3020, 'The depth of color correction tools available, from basic brightness controls to professional-grade grading suites.', 'Die Tiefe der verfuegbaren Farbkorrektur-Werkzeuge, von einfachen Helligkeitsreglern bis hin zu professionellen Grading-Suiten.'
  UNION ALL SELECT 'video-editing', 'effects_compositing', 'chroma_keying', 'Chroma keying (green screen)', 'Chroma-Keying (Greenscreen)', 'boolean', 'informational', 'optional', 3030, 'Whether the tool supports green or blue screen removal for compositing subjects over different backgrounds.', 'Ob das Werkzeug Gruen- oder Bluescreen-Entfernung zum Compositing von Motiven vor verschiedenen Hintergruenden unterstuetzt.'
  UNION ALL SELECT 'video-editing', 'effects_compositing', 'motion_tracking', 'Motion tracking', 'Bewegungsverfolgung', 'boolean', 'beneficial', 'optional', 3040, 'Whether the tool can track object movement in footage for stabilization, masking, or attaching effects to moving subjects.', 'Ob das Werkzeug Objektbewegungen im Material fuer Stabilisierung, Maskierung oder das Anheften von Effekten an bewegte Motive verfolgen kann.'
  UNION ALL SELECT 'video-editing', 'effects_compositing', '3d_compositing', '3D compositing', '3D-Compositing', 'boolean', 'informational', 'optional', 3050, 'Whether the tool provides a 3D workspace for positioning and manipulating 2D and 3D elements in three-dimensional space.', 'Ob das Werkzeug einen 3D-Arbeitsbereich zum Positionieren und Manipulieren von 2D- und 3D-Elementen im dreidimensionalen Raum bietet.'
  UNION ALL SELECT 'video-editing', 'effects_compositing', 'title_graphics', 'Title & graphics editor', 'Titel- & Grafikeditor', 'enum', 'informational', 'optional', 3060, 'The complexity of the built-in titling system, from basic text overlays to a full motion graphics editor.', 'Die Komplexitaet des integrierten Titelsystems, von einfachen Texteinblendungen bis hin zu einem vollstaendigen Motion-Graphics-Editor.'
  UNION ALL SELECT 'video-editing', 'effects_compositing', 'ai_assisted_editing', 'AI-assisted editing', 'KI-gestuetzte Bearbeitung', 'multi_enum', 'informational', 'multi_select', 3070, 'AI-powered editing features such as automatic scene detection, auto-subtitles, smart reframing, or background removal.', 'KI-gestuetzte Bearbeitungsfunktionen wie automatische Szenenerkennung, Auto-Untertitel, intelligentes Reframing oder Hintergrundentfernung.'
  UNION ALL SELECT 'video-editing', 'audio_tools', 'audio_mixing', 'Audio mixing', 'Audiomischung', 'boolean', 'informational', 'optional', 4010, 'Whether the editor provides multi-channel audio mixing with per-track volume, panning, and level controls.', 'Ob der Editor Mehrkanal-Audiomischung mit Lautstaerke-, Panning- und Pegelreglern pro Spur bietet.'
  UNION ALL SELECT 'video-editing', 'audio_tools', 'audio_effects', 'Built-in audio effects', 'Integrierte Audioeffekte', 'boolean', 'informational', 'optional', 4020, 'Whether built-in audio processing effects such as equalization, compression, reverb, or delay are included.', 'Ob integrierte Audiobearbeitungseffekte wie Equalizer, Kompression, Hall oder Verzoegerung enthalten sind.'
  UNION ALL SELECT 'video-editing', 'audio_tools', 'noise_reduction', 'Noise reduction', 'Rauschunterdrueckung', 'boolean', 'beneficial', 'optional', 4030, 'Whether the tool includes audio noise reduction or removal capabilities for cleaning up recorded dialogue and ambient sound.', 'Ob das Werkzeug Audiorausch-Reduktions- oder Entfernungsfunktionen zur Bereinigung aufgenommener Dialoge und Umgebungsgeraeuschen enthaelt.'
  UNION ALL SELECT 'video-editing', 'audio_tools', 'voiceover_recording', 'Voice-over recording', 'Sprachaufnahme', 'boolean', 'informational', 'optional', 4040, 'Whether narration or commentary can be recorded directly into the timeline from within the editor.', 'Ob Erzaehlungen oder Kommentare direkt in die Zeitleiste innerhalb des Editors aufgenommen werden koennen.'
  UNION ALL SELECT 'video-editing', 'audio_tools', 'auto_subtitle_generation', 'Auto subtitle generation', 'Automatische Untertitelerstellung', 'boolean', 'beneficial', 'optional', 4050, 'Whether the editor can automatically generate subtitles from spoken dialogue using speech-to-text technology.', 'Ob der Editor automatisch Untertitel aus gesprochenem Dialog mittels Sprache-zu-Text-Technologie erstellen kann.'
  UNION ALL SELECT 'video-editing', 'audio_tools', 'audio_ducking', 'Audio ducking', 'Audio-Ducking', 'boolean', 'informational', 'optional', 4060, 'Whether the tool can automatically lower background music volume when speech is detected on another track.', 'Ob das Werkzeug automatisch die Hintergrundmusik-Lautstaerke senken kann, wenn Sprache auf einer anderen Spur erkannt wird.'
  UNION ALL SELECT 'video-editing', 'performance_workflow', 'gpu_acceleration', 'GPU-accelerated rendering', 'GPU-beschleunigtes Rendering', 'boolean', 'beneficial', 'optional', 5010, 'Whether the editor leverages GPU hardware acceleration for faster video encoding, decoding, and effects processing.', 'Ob der Editor GPU-Hardwarebeschleunigung fuer schnellere Videokodierung, -dekodierung und Effektverarbeitung nutzt.'
  UNION ALL SELECT 'video-editing', 'performance_workflow', 'proxy_editing', 'Proxy editing workflow', 'Proxy-Bearbeitungs-Workflow', 'boolean', 'beneficial', 'optional', 5020, 'Whether the tool supports creating low-resolution proxy files to enable smoother editing of high-resolution footage.', 'Ob das Werkzeug das Erstellen von niedrig aufgeloesten Proxy-Dateien unterstuetzt, um eine fluessigere Bearbeitung hochaufgeloesten Materials zu ermoeglichen.'
  UNION ALL SELECT 'video-editing', 'performance_workflow', 'background_rendering', 'Background rendering', 'Hintergrund-Rendering', 'boolean', 'beneficial', 'optional', 5030, 'Whether the editor can render timeline sections in the background while the user continues editing other parts.', 'Ob der Editor Zeitleistenabschnitte im Hintergrund rendern kann, waehrend der Benutzer andere Teile weiter bearbeitet.'
  UNION ALL SELECT 'video-editing', 'performance_workflow', 'project_autosave', 'Project auto-save', 'Automatische Projektspeicherung', 'boolean', 'beneficial', 'optional', 5040, 'Whether the editor automatically saves project state at regular intervals to prevent data loss from crashes.', 'Ob der Editor den Projektzustand automatisch in regelmaessigen Abstaenden speichert, um Datenverlust durch Abstuerze zu verhindern.'
  UNION ALL SELECT 'video-editing', 'performance_workflow', 'undo_history_depth', 'Undo history', 'Rueckgaengig-Verlauf', 'enum', 'informational', 'optional', 5050, 'How many editing actions can be undone, ranging from a limited number to unlimited persistent undo across sessions.', 'Wie viele Bearbeitungsaktionen rueckgaengig gemacht werden koennen, von einer begrenzten Anzahl bis zu unbegrenztem sitzungsuebergreifendem Rueckgaengig.'
  UNION ALL SELECT 'video-editing', 'performance_workflow', 'render_queue', 'Render queue', 'Render-Warteschlange', 'boolean', 'informational', 'optional', 5060, 'Whether multiple export jobs can be queued and processed sequentially without manual intervention.', 'Ob mehrere Exportauftraege in eine Warteschlange gestellt und nacheinander ohne manuelles Eingreifen verarbeitet werden koennen.'
  UNION ALL SELECT 'video-editing', 'collaboration_sharing', 'team_collaboration', 'Team collaboration', 'Teamzusammenarbeit', 'boolean', 'beneficial', 'must_match', 6010, 'Whether multiple users can work on the same video project simultaneously or share project access within a team.', 'Ob mehrere Benutzer gleichzeitig am selben Videoprojekt arbeiten oder den Projektzugang innerhalb eines Teams teilen koennen.'
  UNION ALL SELECT 'video-editing', 'collaboration_sharing', 'review_annotation_tools', 'Review & annotation tools', 'Ueberpruefungs- & Anmerkungswerkzeuge', 'boolean', 'beneficial', 'optional', 6020, 'Whether the tool provides client or team review features with timestamped comments and frame-accurate annotations.', 'Ob das Werkzeug Kunden- oder Team-Ueberpruefungsfunktionen mit zeitgestempelten Kommentaren und bildgenauen Anmerkungen bietet.'
  UNION ALL SELECT 'video-editing', 'collaboration_sharing', 'direct_publish_targets', 'Direct publish targets', 'Direktveroeffentlichungsziele', 'multi_enum', 'informational', 'multi_select', 6030, 'The platforms and services to which the editor can export or upload rendered video directly.', 'Die Plattformen und Dienste, an die der Editor gerendertes Video direkt exportieren oder hochladen kann.'
  UNION ALL SELECT 'video-editing', 'collaboration_sharing', 'project_sharing_format', 'Project sharing format', 'Projektfreigabe-Format', 'enum', 'tradeoff', 'optional', 6040, 'The format used for sharing project files between editors, ranging from proprietary to open interchange standards.', 'Das Format fuer die gemeinsame Nutzung von Projektdateien zwischen Editoren, von proprietaer bis zu offenen Austauschstandards.'
  UNION ALL SELECT 'video-editing', 'platform_access', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 7010, 'The operating systems and platforms on which the video editor is available for installation or use.', 'Die Betriebssysteme und Plattformen, auf denen der Videoeditor zur Installation oder Nutzung verfuegbar ist.'
  UNION ALL SELECT 'video-editing', 'platform_access', 'plugin_ecosystem', 'Plugin / extension ecosystem', 'Plugin-/Erweiterungs-Oekosystem', 'boolean', 'beneficial', 'optional', 7020, 'Whether the editor supports third-party plugins or extensions for additional effects, transitions, and tools.', 'Ob der Editor Drittanbieter-Plugins oder Erweiterungen fuer zusaetzliche Effekte, Uebergaenge und Werkzeuge unterstuetzt.'
  UNION ALL SELECT 'video-editing', 'platform_access', 'scripting_api', 'Scripting / automation API', 'Skript-/Automatisierungs-API', 'boolean', 'beneficial', 'optional', 7030, 'Whether a scripting interface or API is available for automating repetitive tasks and building custom workflows.', 'Ob eine Skript-Schnittstelle oder API zur Automatisierung wiederkehrender Aufgaben und zum Erstellen benutzerdefinierter Workflows verfuegbar ist.'
  UNION ALL SELECT 'video-editing', 'platform_access', 'offline_editing', 'Offline editing', 'Offline-Bearbeitung', 'boolean', 'beneficial', 'must_match', 7040, 'Whether the editor provides full functionality without an active internet connection, important for cloud-based tools.', 'Ob der Editor volle Funktionalitaet ohne aktive Internetverbindung bietet, wichtig fuer cloudbasierte Werkzeuge.'
  UNION ALL SELECT 'video-editing', 'privacy_data', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 8010, 'How the video editor collects and transmits usage analytics and telemetry data to the vendor.', 'Wie der Videoeditor Nutzungsanalysen und Telemetriedaten an den Anbieter erfasst und uebertraegt.'
  UNION ALL SELECT 'video-editing', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 8020, 'The geographic region where project data and account information are processed, especially relevant for cloud-based editors.', 'Die geografische Region, in der Projektdaten und Kontoinformationen verarbeitet werden, besonders relevant fuer cloudbasierte Editoren.'
  UNION ALL SELECT 'video-editing', 'privacy_data', 'account_required', 'Account required', 'Konto erforderlich', 'boolean', 'risk', 'must_match', 8030, 'Whether creating a user account is required before the video editor can be used.', 'Ob das Erstellen eines Benutzerkontos erforderlich ist, bevor der Videoeditor genutzt werden kann.'
  UNION ALL SELECT 'video-editing', 'privacy_data', 'crash_reporting', 'Crash reporting', 'Absturzberichte', 'enum', 'informational', 'optional', 8040, 'How crash diagnostics and error reports are handled by the editor, from no reporting to mandatory transmission.', 'Wie Absturzdiagnosen und Fehlerberichte vom Editor gehandhabt werden, von keiner Berichterstattung bis hin zur obligatorischen Uebermittlung.'
  UNION ALL SELECT 'video-editing', 'openness_pricing', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9010, 'The availability and openness of the video editor source code for inspection, modification, or redistribution.', 'Die Verfuegbarkeit und Offenheit des Videoeditor-Quellcodes zur Einsicht, Modifikation oder Weiterverbreitung.'
  UNION ALL SELECT 'video-editing', 'openness_pricing', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 9020, 'The software license under which the video editor is distributed and can be used.', 'Die Softwarelizenz, unter der der Videoeditor vertrieben und genutzt werden darf.'
  UNION ALL SELECT 'video-editing', 'openness_pricing', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9030, 'The pricing structure for obtaining and using the video editor, such as free, freemium, or subscription.', 'Die Preisstruktur fuer den Erwerb und die Nutzung des Videoeditors, wie kostenlos, Freemium oder Abonnement.'
  UNION ALL SELECT 'video-editing', 'openness_pricing', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfuegbar', 'boolean', 'informational', 'must_match', 9040, 'Whether a functional free version of the video editor is available without payment or time restrictions.', 'Ob eine funktionsfaehige kostenlose Version des Videoeditors ohne Bezahlung oder Zeitbeschraenkungen verfuegbar ist.'
  UNION ALL SELECT 'video-editing', 'openness_pricing', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Target user profiles and roles the video editor is best suited for based on its features and workflow design.', 'Zielgruppen-Benutzerprofile und Rollen, fuer die der Videoeditor basierend auf seinen Funktionen und Workflow-Design am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'video-editing' AS category_id, 'timeline_type' AS criterion_key, 'single_track' AS option_key, 'Single track' AS label_en, 'Einzelspur' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'video-editing', 'timeline_type', 'multi_track', 'Multi-track timeline', 'Mehrspur-Zeitleiste', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'timeline_type', 'node_based', 'Node-based compositor', 'Knotenbasierter Compositor', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'timeline_type', 'hybrid', 'Hybrid (timeline + nodes)', 'Hybrid (Zeitleiste + Knoten)', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'trimming_model', 'basic_cut', 'Basic cut/split', 'Einfacher Schnitt/Trennung', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'trimming_model', 'ripple', 'Ripple edit', 'Ripple-Schnitt', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'trimming_model', 'roll', 'Roll edit', 'Roll-Schnitt', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'trimming_model', 'slip', 'Slip edit', 'Slip-Schnitt', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'trimming_model', 'slide', 'Slide edit', 'Slide-Schnitt', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'h264', 'H.264/AVC', 'H.264/AVC', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'h265', 'H.265/HEVC', 'H.265/HEVC', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'prores', 'Apple ProRes', 'Apple ProRes', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'dnxhd', 'Avid DNxHD/HR', 'Avid DNxHD/HR', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'vp9', 'VP9', 'VP9', 'positive', 50
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'av1', 'AV1', 'AV1', 'positive', 60
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'mpeg2', 'MPEG-2', 'MPEG-2', 'neutral', 70
  UNION ALL SELECT 'video-editing', 'input_video_codecs', 'braw', 'Blackmagic RAW', 'Blackmagic RAW', 'neutral', 80
  UNION ALL SELECT 'video-editing', 'output_video_codecs', 'h264', 'H.264/AVC', 'H.264/AVC', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'output_video_codecs', 'h265', 'H.265/HEVC', 'H.265/HEVC', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'output_video_codecs', 'prores', 'Apple ProRes', 'Apple ProRes', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'output_video_codecs', 'dnxhd', 'Avid DNxHD/HR', 'Avid DNxHD/HR', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'output_video_codecs', 'vp9', 'VP9', 'VP9', 'positive', 50
  UNION ALL SELECT 'video-editing', 'output_video_codecs', 'av1', 'AV1', 'AV1', 'positive', 60
  UNION ALL SELECT 'video-editing', 'output_video_codecs', 'gif', 'GIF', 'GIF', 'neutral', 70
  UNION ALL SELECT 'video-editing', 'max_export_resolution', 'hd_1080p', 'Full HD/1080p', 'Full HD/1080p', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'max_export_resolution', 'uhd_4k', '4K/UHD', '4K/UHD', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'max_export_resolution', 'uhd_8k', '8K', '8K', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'max_export_resolution', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 40
  UNION ALL SELECT 'video-editing', 'color_grading', 'basic', 'Basic brightness/contrast', 'Grundlegende Helligkeit/Kontrast', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'color_grading', 'intermediate', 'Curves and color wheels', 'Kurven und Farbkreise', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'color_grading', 'advanced', 'Scopes, LUTs, and secondary correction', 'Scopes, LUTs und Sekundaerkorrektur', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'color_grading', 'professional', 'Full professional grading', 'Vollstaendiges professionelles Grading', 'positive', 40
  UNION ALL SELECT 'video-editing', 'title_graphics', 'basic_text', 'Basic text overlays', 'Einfache Texteinblendungen', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'title_graphics', 'template_based', 'Template-based titles', 'Vorlagenbasierte Titel', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'title_graphics', 'full_motion_graphics', 'Full motion graphics editor', 'Vollstaendiger Motion-Graphics-Editor', 'positive', 30
  UNION ALL SELECT 'video-editing', 'ai_assisted_editing', 'auto_scene_detection', 'Auto scene detection', 'Automatische Szenenerkennung', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'ai_assisted_editing', 'auto_subtitles', 'Auto subtitles/transcription', 'Automatische Untertitel/Transkription', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'ai_assisted_editing', 'auto_reframe', 'Auto reframe (aspect ratio)', 'Automatisches Reframing (Seitenverhaeltnis)', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'ai_assisted_editing', 'background_removal', 'Background removal', 'Hintergrundentfernung', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'ai_assisted_editing', 'smart_cut', 'Smart cut / silence removal', 'Intelligenter Schnitt / Stilleentfernung', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'ai_assisted_editing', 'object_tracking', 'AI object tracking', 'KI-Objektverfolgung', 'neutral', 60
  UNION ALL SELECT 'video-editing', 'undo_history_depth', 'limited', 'Limited undo', 'Begrenztes Rueckgaengig', 'warning', 10
  UNION ALL SELECT 'video-editing', 'undo_history_depth', 'session', 'Session-length undo', 'Sitzungslanges Rueckgaengig', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'undo_history_depth', 'unlimited', 'Unlimited/persistent undo', 'Unbegrenztes/dauerhaftes Rueckgaengig', 'positive', 30
  UNION ALL SELECT 'video-editing', 'direct_publish_targets', 'youtube', 'YouTube', 'YouTube', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'direct_publish_targets', 'vimeo', 'Vimeo', 'Vimeo', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'direct_publish_targets', 'social_media', 'Social media platforms', 'Social-Media-Plattformen', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'direct_publish_targets', 'cloud_storage', 'Cloud storage', 'Cloud-Speicher', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'direct_publish_targets', 'ftp_sftp', 'FTP/SFTP', 'FTP/SFTP', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'direct_publish_targets', 'custom_api', 'Custom API endpoint', 'Benutzerdefinierter API-Endpunkt', 'positive', 60
  UNION ALL SELECT 'video-editing', 'project_sharing_format', 'proprietary_only', 'Proprietary only', 'Nur proprietaer', 'warning', 10
  UNION ALL SELECT 'video-editing', 'project_sharing_format', 'xml_based', 'XML-based', 'XML-basiert', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'project_sharing_format', 'open_standard', 'Open standard (EDL/AAF/XML)', 'Offener Standard (EDL/AAF/XML)', 'positive', 30
  UNION ALL SELECT 'video-editing', 'project_sharing_format', 'cloud_native', 'Cloud-native', 'Cloud-nativ', 'tradeoff', 40
  UNION ALL SELECT 'video-editing', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'supported_platforms', 'chromeos', 'ChromeOS', 'ChromeOS', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'supported_platforms', 'web', 'Web browser', 'Webbrowser', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 60
  UNION ALL SELECT 'video-editing', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 70
  UNION ALL SELECT 'video-editing', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'video-editing', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'video-editing', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'video-editing', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'video-editing', 'data_processing_location', 'local_device', 'Local device', 'Lokales Geraet', 'positive', 40
  UNION ALL SELECT 'video-editing', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 60
  UNION ALL SELECT 'video-editing', 'crash_reporting', 'none', 'None', 'Keine', 'positive', 10
  UNION ALL SELECT 'video-editing', 'crash_reporting', 'opt_in', 'Opt-in', 'Opt-in', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'crash_reporting', 'opt_out', 'Opt-out', 'Opt-out', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'crash_reporting', 'mandatory', 'Mandatory', 'Obligatorisch', 'warning', 40
  UNION ALL SELECT 'video-editing', 'source_model', 'fully_open_source', 'Fully open source', 'Vollstaendig quelloffen', 'positive', 10
  UNION ALL SELECT 'video-editing', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'video-editing', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'video-editing', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'pricing_model', 'per_seat', 'Per seat', 'Pro Arbeitsplatz', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'hobbyist', 'Hobbyist', 'Hobbyist', 'neutral', 10
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'youtuber_creator', 'YouTuber/content creator', 'YouTuber/Content-Creator', 'neutral', 20
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'social_media_creator', 'Social media creator', 'Social-Media-Creator', 'neutral', 30
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'professional_editor', 'Professional editor', 'Professioneller Editor', 'neutral', 40
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'filmmaker', 'Filmmaker', 'Filmemacher', 'neutral', 50
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'motion_designer', 'Motion designer', 'Motion-Designer', 'neutral', 60
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'enterprise', 'Enterprise/broadcast', 'Unternehmen/Rundfunk', 'neutral', 70
  UNION ALL SELECT 'video-editing', 'fit_profiles', 'educator', 'Educator', 'Paedagoge', 'neutral', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'video-editing'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'video-editing'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('045-video-editing-matrix-criteria');
