-- Migration 012: Define Meeting Software category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('meeting-software', 'joining_access', 'Joining & Access', 'Beitritt & Zugriff', 'How hosts start meetings and participants join them.', 'Wie Hosts Meetings starten und Teilnehmer ihnen beitreten.', 100),
  ('meeting-software', 'platforms_devices', 'Platforms & Devices', 'Plattformen & Geräte', 'Supported clients, browsers, phones, room systems, and bandwidth modes.', 'Unterstützte Clients, Browser, Telefone, Raumgeräte und Bandbreitenmodi.', 200),
  ('meeting-software', 'capacity_formats', 'Capacity & Formats', 'Kapazität & Formate', 'Participant limits, meeting duration, webinars, registration, and scheduling.', 'Teilnehmergrenzen, Meetingdauer, Webinare, Registrierung und Terminplanung.', 300),
  ('meeting-software', 'collaboration_tools', 'Collaboration Tools', 'Werkzeuge zur Zusammenarbeit', 'Screen sharing, whiteboards, chat, polls, notes, and file sharing.', 'Bildschirmfreigabe, Whiteboards, Chat, Umfragen, Notizen und Dateifreigabe.', 400),
  ('meeting-software', 'security_controls', 'Security & Host Controls', 'Sicherheit & Host-Kontrollen', 'Meeting access controls, encryption, moderation, and participant permissions.', 'Meeting-Zugriffskontrollen, Verschlüsselung, Moderation und Teilnehmerberechtigungen.', 500),
  ('meeting-software', 'recording_data', 'Recording, Data & AI', 'Aufzeichnung, Daten & KI', 'Recording, consent notices, transcripts, retention, residency, and AI features.', 'Aufzeichnung, Einwilligungshinweise, Transkripte, Aufbewahrung, Datenresidenz und KI-Funktionen.', 600),
  ('meeting-software', 'admin_integrations', 'Admin & Integrations', 'Administration & Integrationen', 'Admin console, SSO, provisioning, audit logs, calendars, APIs, and app integrations.', 'Admin-Konsole, SSO, Bereitstellung, Audit-Protokolle, Kalender, APIs und App-Integrationen.', 700),
  ('meeting-software', 'deployment_interop', 'Deployment & Interop', 'Bereitstellung & Interop', 'SaaS or self-hosting model, protocols, federation, and deployment requirements.', 'SaaS- oder Selbsthosting-Modell, Protokolle, Föderation und Bereitstellungsanforderungen.', 800),
  ('meeting-software', 'accessibility_fit', 'Accessibility & Fit', 'Barrierefreiheit & Eignung', 'Accessibility capabilities, language support, and user-fit profiles.', 'Barrierefreiheitsfunktionen, Sprachunterstützung und Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'meeting-software' AS category_id, 'joining_access' AS group_key, 'account_required_to_host' AS criterion_key, 'Account required to host' AS label_en, 'Konto zum Hosten erforderlich' AS label_de, 'boolean' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'Whether a user account is required to create or host a standard meeting.' AS help_text_en, 'Ob ein Nutzerkonto erforderlich ist, um ein normales Meeting zu erstellen oder zu hosten.' AS help_text_de
  UNION ALL SELECT 'meeting-software', 'joining_access', 'guest_join_without_account', 'Guest join without account', 'Gastbeitritt ohne Konto', 'boolean', 'beneficial', 'must_match', 1020, 'Whether participants can join a meeting as guests without creating an account.', 'Ob Teilnehmer einem Meeting als Gäste beitreten können, ohne ein Konto zu erstellen.'
  UNION ALL SELECT 'meeting-software', 'joining_access', 'browser_join_supported', 'Browser join supported', 'Beitritt im Browser unterstützt', 'boolean', 'beneficial', 'optional', 1030, 'Whether participants can join meetings from a supported web browser.', 'Ob Teilnehmer Meetings über einen unterstützten Webbrowser beitreten können.'
  UNION ALL SELECT 'meeting-software', 'joining_access', 'invitation_join_methods', 'Invitation and join methods', 'Einladungs- und Beitrittsmethoden', 'multi_enum', 'informational', 'multi_select', 1040, 'Documented ways hosts can invite participants or participants can join a meeting.', 'Dokumentierte Wege, wie Hosts Teilnehmer einladen oder Teilnehmer einem Meeting beitreten können.'
  UNION ALL SELECT 'meeting-software', 'joining_access', 'waiting_room_or_lobby', 'Waiting room or lobby', 'Warteraum oder Lobby', 'boolean', 'beneficial', 'optional', 1050, 'Whether hosts can hold participants before admitting them to a meeting.', 'Ob Hosts Teilnehmer vor dem Eintritt in ein Meeting zurückhalten können.'
  UNION ALL SELECT 'meeting-software', 'platforms_devices', 'supported_platforms', 'Supported platforms', 'Unterstützte Plattformen', 'multi_enum', 'informational', 'multi_select', 2010, 'Maintained platforms, operating systems, devices, and access paths for meeting users.', 'Gepflegte Plattformen, Betriebssysteme, Geräte und Zugriffswege für Meeting-Nutzer.'
  UNION ALL SELECT 'meeting-software', 'platforms_devices', 'desktop_apps', 'Desktop apps', 'Desktop-Apps', 'boolean', 'beneficial', 'optional', 2020, 'Whether maintained desktop applications are available for meeting use.', 'Ob gepflegte Desktop-Anwendungen für Meetings verfügbar sind.'
  UNION ALL SELECT 'meeting-software', 'platforms_devices', 'mobile_apps', 'Mobile apps', 'Mobile Apps', 'boolean', 'beneficial', 'optional', 2030, 'Whether maintained mobile applications are available for meeting use.', 'Ob gepflegte Mobile-Apps für Meetings verfügbar sind.'
  UNION ALL SELECT 'meeting-software', 'platforms_devices', 'room_system_support', 'Room system support', 'Raumgeräte-Unterstützung', 'enum', 'tradeoff', 'optional', 2040, 'How the product supports meeting room devices, gateways, or vendor room systems.', 'Wie das Produkt Meeting-Raumgeräte, Gateways oder Anbieter-Raumsysteme unterstützt.'
  UNION ALL SELECT 'meeting-software', 'platforms_devices', 'pstn_dial_in', 'PSTN dial-in', 'PSTN-Einwahl', 'boolean', 'tradeoff', 'optional', 2050, 'Whether participants can join meetings through a telephone dial-in number.', 'Ob Teilnehmer Meetings über eine Telefoneinwahlnummer beitreten können.'
  UNION ALL SELECT 'meeting-software', 'platforms_devices', 'low_bandwidth_mode', 'Low-bandwidth mode', 'Modus für geringe Bandbreite', 'boolean', 'beneficial', 'optional', 2060, 'Whether the product documents a mode or controls for constrained network connections.', 'Ob das Produkt einen Modus oder Kontrollen für eingeschränkte Netzwerkverbindungen dokumentiert.'
  UNION ALL SELECT 'meeting-software', 'capacity_formats', 'max_participants', 'Maximum participants', 'Maximale Teilnehmerzahl', 'number', 'informational', 'range', 3010, 'Documented maximum participant count for a standard interactive meeting.', 'Dokumentierte maximale Teilnehmerzahl für ein normales interaktives Meeting.'
  UNION ALL SELECT 'meeting-software', 'capacity_formats', 'meeting_duration_limit_minutes', 'Meeting duration limit (minutes)', 'Zeitlimit für Meetings (Minuten)', 'number', 'informational', 'range', 3020, 'Documented maximum meeting duration in minutes for standard meetings.', 'Dokumentiertes maximales Zeitlimit in Minuten für normale Meetings.'
  UNION ALL SELECT 'meeting-software', 'capacity_formats', 'recurring_meetings', 'Recurring meetings', 'Wiederkehrende Meetings', 'boolean', 'beneficial', 'optional', 3030, 'Whether hosts can schedule meetings that repeat on a defined cadence.', 'Ob Hosts Meetings planen können, die sich in einem festgelegten Rhythmus wiederholen.'
  UNION ALL SELECT 'meeting-software', 'capacity_formats', 'breakout_rooms', 'Breakout rooms', 'Breakout-Räume', 'boolean', 'beneficial', 'optional', 3040, 'Whether hosts can split participants into smaller meeting rooms or sessions.', 'Ob Hosts Teilnehmer in kleinere Meeting-Räume oder Sitzungen aufteilen können.'
  UNION ALL SELECT 'meeting-software', 'capacity_formats', 'webinar_or_town_hall_mode', 'Webinar or town hall mode', 'Webinar- oder Town-Hall-Modus', 'enum', 'informational', 'optional', 3050, 'Whether the product documents larger presentation-oriented meeting formats.', 'Ob das Produkt größere präsentationsorientierte Meeting-Formate dokumentiert.'
  UNION ALL SELECT 'meeting-software', 'capacity_formats', 'registration_rsvp_support', 'Registration or RSVP support', 'Registrierung oder RSVP', 'boolean', 'beneficial', 'optional', 3060, 'Whether hosts can collect participant registration, RSVP, or attendee details before a meeting.', 'Ob Hosts vor einem Meeting Registrierung, RSVP oder Teilnehmerdaten erfassen können.'
  UNION ALL SELECT 'meeting-software', 'capacity_formats', 'scheduling_calendar_support', 'Scheduling and calendar support', 'Termin- und Kalenderunterstützung', 'multi_enum', 'informational', 'multi_select', 3070, 'Documented scheduling and calendar features for creating or joining meetings.', 'Dokumentierte Termin- und Kalenderfunktionen zum Erstellen oder Beitreten von Meetings.'
  UNION ALL SELECT 'meeting-software', 'collaboration_tools', 'screen_sharing', 'Screen sharing', 'Bildschirmfreigabe', 'boolean', 'beneficial', 'must_match', 4010, 'Whether participants or hosts can share a screen or application window during a meeting.', 'Ob Teilnehmer oder Hosts während eines Meetings einen Bildschirm oder ein Anwendungsfenster freigeben können.'
  UNION ALL SELECT 'meeting-software', 'collaboration_tools', 'remote_control', 'Remote control', 'Fernsteuerung', 'boolean', 'tradeoff', 'optional', 4020, 'Whether a participant can request or grant remote control of a shared screen.', 'Ob ein Teilnehmer die Fernsteuerung eines freigegebenen Bildschirms anfordern oder gewähren kann.'
  UNION ALL SELECT 'meeting-software', 'collaboration_tools', 'whiteboard_or_canvas', 'Whiteboard or canvas', 'Whiteboard oder Canvas', 'boolean', 'beneficial', 'optional', 4030, 'Whether meetings include a shared whiteboard, canvas, or visual workspace.', 'Ob Meetings ein gemeinsames Whiteboard, Canvas oder visuellen Arbeitsbereich enthalten.'
  UNION ALL SELECT 'meeting-software', 'collaboration_tools', 'shared_notes_docs', 'Shared notes or documents', 'Gemeinsame Notizen oder Dokumente', 'multi_enum', 'informational', 'multi_select', 4040, 'Documented shared notes, agenda, document, or action-item features for meetings.', 'Dokumentierte gemeinsame Notiz-, Agenda-, Dokument- oder Aufgabenfunktionen für Meetings.'
  UNION ALL SELECT 'meeting-software', 'collaboration_tools', 'in_meeting_chat', 'In-meeting chat', 'Chat im Meeting', 'boolean', 'beneficial', 'optional', 4050, 'Whether participants can exchange chat messages during a meeting.', 'Ob Teilnehmer während eines Meetings Chatnachrichten austauschen können.'
  UNION ALL SELECT 'meeting-software', 'collaboration_tools', 'reactions_polls_qna', 'Reactions, polls, and Q&A', 'Reaktionen, Umfragen und Q&A', 'multi_enum', 'informational', 'multi_select', 4060, 'Audience interaction tools such as reactions, raised hands, polls, or question-and-answer features.', 'Interaktionswerkzeuge wie Reaktionen, Handheben, Umfragen oder Frage-und-Antwort-Funktionen.'
  UNION ALL SELECT 'meeting-software', 'collaboration_tools', 'file_sharing', 'File sharing', 'Dateifreigabe', 'boolean', 'beneficial', 'optional', 4070, 'Whether users can share files in or alongside meetings.', 'Ob Nutzer Dateien in Meetings oder begleitend dazu teilen können.'
  UNION ALL SELECT 'meeting-software', 'security_controls', 'meeting_passcodes', 'Meeting passcodes', 'Meeting-Passcodes', 'boolean', 'beneficial', 'optional', 5010, 'Whether meetings can be protected with a passcode or equivalent join secret.', 'Ob Meetings mit einem Passcode oder gleichwertigen Beitrittsgeheimnis geschützt werden können.'
  UNION ALL SELECT 'meeting-software', 'security_controls', 'e2ee_available', 'E2EE availability', 'E2EE-Verfügbarkeit', 'enum', 'beneficial', 'optional', 5020, 'How end-to-end encryption is documented for meetings or meeting modes.', 'Wie Ende-zu-Ende-Verschlüsselung für Meetings oder Meeting-Modi dokumentiert ist.'
  UNION ALL SELECT 'meeting-software', 'security_controls', 'host_moderation_controls', 'Host moderation controls', 'Host-Moderationskontrollen', 'multi_enum', 'beneficial', 'multi_select', 5030, 'Meeting controls that let hosts moderate participants and meeting flow.', 'Meeting-Kontrollen, mit denen Hosts Teilnehmer und Meeting-Ablauf moderieren können.'
  UNION ALL SELECT 'meeting-software', 'security_controls', 'participant_permissions', 'Participant permissions', 'Teilnehmerberechtigungen', 'multi_enum', 'beneficial', 'multi_select', 5040, 'Permissions hosts or admins can control for participant actions during meetings.', 'Berechtigungen, die Hosts oder Admins für Teilnehmeraktionen in Meetings steuern können.'
  UNION ALL SELECT 'meeting-software', 'security_controls', 'authenticated_participant_controls', 'Authenticated participant controls', 'Kontrollen für authentifizierte Teilnehmer', 'boolean', 'beneficial', 'optional', 5050, 'Whether hosts or admins can limit access or features to authenticated participants.', 'Ob Hosts oder Admins Zugriff oder Funktionen auf authentifizierte Teilnehmer beschränken können.'
  UNION ALL SELECT 'meeting-software', 'security_controls', 'abuse_reporting_controls', 'Abuse reporting controls', 'Missbrauchsmeldungen', 'boolean', 'beneficial', 'optional', 5060, 'Whether users can report abuse, disruption, or unsafe behavior from meeting contexts.', 'Ob Nutzer Missbrauch, Störungen oder unsicheres Verhalten aus Meeting-Kontexten melden können.'
  UNION ALL SELECT 'meeting-software', 'recording_data', 'recording_available', 'Recording availability', 'Aufzeichnungsverfügbarkeit', 'enum', 'tradeoff', 'optional', 6010, 'Whether and how meeting recording is available for standard meetings.', 'Ob und wie Meeting-Aufzeichnung für normale Meetings verfügbar ist.'
  UNION ALL SELECT 'meeting-software', 'recording_data', 'recording_consent_notice', 'Recording consent notice', 'Hinweis zur Aufzeichnungseinwilligung', 'boolean', 'beneficial', 'optional', 6020, 'Whether participants receive a documented notice when recording is active.', 'Ob Teilnehmer einen dokumentierten Hinweis erhalten, wenn eine Aufzeichnung aktiv ist.'
  UNION ALL SELECT 'meeting-software', 'recording_data', 'transcript_and_artifact_exports', 'Transcript and artifact exports', 'Transkript- und Artefakt-Exporte', 'multi_enum', 'informational', 'multi_select', 6030, 'Documented exports for meeting transcripts, captions, chat, attendance, summaries, or whiteboards.', 'Dokumentierte Exporte für Meeting-Transkripte, Untertitel, Chat, Teilnahme, Zusammenfassungen oder Whiteboards.'
  UNION ALL SELECT 'meeting-software', 'recording_data', 'retention_controls', 'Retention controls', 'Aufbewahrungskontrollen', 'enum', 'informational', 'optional', 6040, 'How meeting recordings, transcripts, or artifacts can be retained or configured.', 'Wie Meeting-Aufzeichnungen, Transkripte oder Artefakte aufbewahrt oder konfiguriert werden können.'
  UNION ALL SELECT 'meeting-software', 'recording_data', 'data_residency_options', 'Data residency options', 'Optionen für Datenresidenz', 'enum', 'tradeoff', 'optional', 6050, 'Documented residency options for meeting data, recordings, transcripts, or admin data.', 'Dokumentierte Residenzoptionen für Meeting-Daten, Aufzeichnungen, Transkripte oder Administrationsdaten.'
  UNION ALL SELECT 'meeting-software', 'recording_data', 'ai_meeting_features', 'AI meeting features', 'KI-Meeting-Funktionen', 'multi_enum', 'tradeoff', 'multi_select', 6060, 'AI-assisted meeting features such as summaries, assistants, action items, translation, or insights.', 'KI-gestützte Meeting-Funktionen wie Zusammenfassungen, Assistenten, Aufgabenpunkte, Übersetzung oder Einblicke.'
  UNION ALL SELECT 'meeting-software', 'admin_integrations', 'admin_console', 'Admin console', 'Admin-Konsole', 'boolean', 'beneficial', 'optional', 7010, 'Whether organizations have an admin console for managing meeting users and settings.', 'Ob Organisationen eine Admin-Konsole zur Verwaltung von Meeting-Nutzern und Einstellungen haben.'
  UNION ALL SELECT 'meeting-software', 'admin_integrations', 'sso_support', 'SSO support', 'SSO-Unterstützung', 'enum', 'beneficial', 'optional', 7020, 'Documented single sign-on methods for organizational meeting accounts.', 'Dokumentierte Single-Sign-on-Methoden für organisatorische Meeting-Konten.'
  UNION ALL SELECT 'meeting-software', 'admin_integrations', 'user_provisioning', 'User provisioning', 'Nutzerbereitstellung', 'multi_enum', 'beneficial', 'multi_select', 7030, 'Documented methods for provisioning or synchronizing organizational users.', 'Dokumentierte Methoden zur Bereitstellung oder Synchronisierung organisatorischer Nutzer.'
  UNION ALL SELECT 'meeting-software', 'admin_integrations', 'audit_logs', 'Audit logs', 'Audit-Protokolle', 'boolean', 'beneficial', 'optional', 7040, 'Whether admins can access audit logs for meeting or account activity.', 'Ob Admins Audit-Protokolle für Meeting- oder Kontoaktivitäten abrufen können.'
  UNION ALL SELECT 'meeting-software', 'admin_integrations', 'calendar_integrations', 'Calendar integrations', 'Kalenderintegrationen', 'multi_enum', 'informational', 'multi_select', 7050, 'Calendar systems documented for scheduling, invitations, or meeting join workflows.', 'Kalendersysteme, die für Terminplanung, Einladungen oder Beitrittsabläufe dokumentiert sind.'
  UNION ALL SELECT 'meeting-software', 'admin_integrations', 'app_marketplace_api', 'Apps, APIs, and automation', 'Apps, APIs und Automatisierung', 'multi_enum', 'tradeoff', 'multi_select', 7060, 'Documented APIs, webhooks, apps, SDKs, marketplaces, or automation connectors.', 'Dokumentierte APIs, Webhooks, Apps, SDKs, Marktplätze oder Automatisierungs-Connectoren.'
  UNION ALL SELECT 'meeting-software', 'admin_integrations', 'lms_crm_integrations', 'LMS/CRM integrations', 'LMS-/CRM-Integrationen', 'multi_enum', 'informational', 'multi_select', 7070, 'Documented integrations with learning management, education, CRM, or customer systems.', 'Dokumentierte Integrationen mit Lernplattformen, Bildungssystemen, CRM- oder Kundensystemen.'
  UNION ALL SELECT 'meeting-software', 'deployment_interop', 'deployment_model', 'Deployment model', 'Bereitstellungsmodell', 'enum', 'tradeoff', 'optional', 8010, 'The primary deployment model documented for the meeting product.', 'Das primäre Bereitstellungsmodell, das für das Meeting-Produkt dokumentiert ist.'
  UNION ALL SELECT 'meeting-software', 'deployment_interop', 'self_hosting_available', 'Self-hosting available', 'Selbsthosting verfügbar', 'boolean', 'tradeoff', 'optional', 8020, 'Whether organizations can operate compatible meeting infrastructure themselves.', 'Ob Organisationen kompatible Meeting-Infrastruktur selbst betreiben können.'
  UNION ALL SELECT 'meeting-software', 'deployment_interop', 'protocol_interoperability', 'Protocol interoperability', 'Protokoll-Interoperabilität', 'multi_enum', 'tradeoff', 'multi_select', 8030, 'Documented protocols, gateways, or standards used for meeting interoperability.', 'Dokumentierte Protokolle, Gateways oder Standards für Meeting-Interoperabilität.'
  UNION ALL SELECT 'meeting-software', 'deployment_interop', 'federation_or_multi_server', 'Federation or multi-server model', 'Föderation oder Mehrserver-Modell', 'enum', 'tradeoff', 'optional', 8040, 'Whether meetings depend on centralized service, federation, peer-to-peer, or multi-server operation.', 'Ob Meetings von zentralisiertem Dienst, Föderation, Peer-to-peer- oder Mehrserverbetrieb abhängen.'
  UNION ALL SELECT 'meeting-software', 'deployment_interop', 'deployment_requirements', 'Deployment requirements', 'Bereitstellungsanforderungen', 'multi_enum', 'informational', 'multi_select', 8050, 'Infrastructure components documented for operating or integrating the meeting system.', 'Infrastrukturkomponenten, die für Betrieb oder Integration des Meeting-Systems dokumentiert sind.'
  UNION ALL SELECT 'meeting-software', 'accessibility_fit', 'accessibility_features', 'Accessibility features', 'Barrierefreiheitsfunktionen', 'multi_enum', 'beneficial', 'multi_select', 9010, 'Documented accessibility features for meeting participants and hosts.', 'Dokumentierte Barrierefreiheitsfunktionen für Meeting-Teilnehmer und Hosts.'
  UNION ALL SELECT 'meeting-software', 'accessibility_fit', 'live_captions', 'Live captions', 'Live-Untertitel', 'boolean', 'beneficial', 'optional', 9020, 'Whether live captions are available during meetings.', 'Ob Live-Untertitel während Meetings verfügbar sind.'
  UNION ALL SELECT 'meeting-software', 'accessibility_fit', 'language_interpretation_translation', 'Interpretation and translation', 'Dolmetschen und Übersetzung', 'multi_enum', 'informational', 'multi_select', 9030, 'Documented interpretation, caption translation, live translation, or language support features.', 'Dokumentierte Funktionen für Dolmetschen, Untertitelübersetzung, Live-Übersetzung oder Sprachunterstützung.'
  UNION ALL SELECT 'meeting-software', 'accessibility_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Common meeting use cases or organization profiles the product is suited to support.', 'Typische Meeting-Anwendungsfälle oder Organisationsprofile, für die das Produkt geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'meeting-software' AS category_id, 'invitation_join_methods' AS criterion_key, 'meeting_link' AS option_key, 'Meeting link' AS label_en, 'Meeting-Link' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'meeting-software', 'invitation_join_methods', 'meeting_id_passcode', 'Meeting ID/passcode', 'Meeting-ID/Passcode', 'neutral', 20
  UNION ALL SELECT 'meeting-software', 'invitation_join_methods', 'calendar_invite', 'Calendar invite', 'Kalendereinladung', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'invitation_join_methods', 'email_invite', 'Email invite', 'E-Mail-Einladung', 'neutral', 40
  UNION ALL SELECT 'meeting-software', 'invitation_join_methods', 'qr_code', 'QR code', 'QR-Code', 'neutral', 50
  UNION ALL SELECT 'meeting-software', 'invitation_join_methods', 'phone_invite', 'Phone invite', 'Telefoneinladung', 'tradeoff', 60
  UNION ALL SELECT 'meeting-software', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 20
  UNION ALL SELECT 'meeting-software', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'supported_platforms', 'linux', 'Linux', 'Linux', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 50
  UNION ALL SELECT 'meeting-software', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 60
  UNION ALL SELECT 'meeting-software', 'supported_platforms', 'room_devices', 'Room devices', 'Raumgeräte', 'tradeoff', 70
  UNION ALL SELECT 'meeting-software', 'room_system_support', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'room_system_support', 'sip_h323_gateway', 'SIP/H.323 gateway', 'SIP-/H.323-Gateway', 'tradeoff', 20
  UNION ALL SELECT 'meeting-software', 'room_system_support', 'dedicated_room_devices', 'Dedicated room devices', 'Dedizierte Raumgeräte', 'tradeoff', 30
  UNION ALL SELECT 'meeting-software', 'room_system_support', 'vendor_room_system', 'Vendor room system', 'Anbieter-Raumsystem', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'webinar_or_town_hall_mode', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'webinar_or_town_hall_mode', 'webinar', 'Webinar', 'Webinar', 'neutral', 20
  UNION ALL SELECT 'meeting-software', 'webinar_or_town_hall_mode', 'town_hall', 'Town hall', 'Town Hall', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'webinar_or_town_hall_mode', 'live_streaming', 'Live streaming', 'Livestreaming', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'scheduling_calendar_support', 'built_in_scheduler', 'Built-in scheduler', 'Eingebauter Planer', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'scheduling_calendar_support', 'ical', 'iCalendar/ICS', 'iCalendar/ICS', 'neutral', 20
  UNION ALL SELECT 'meeting-software', 'scheduling_calendar_support', 'caldav', 'CalDAV', 'CalDAV', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'scheduling_calendar_support', 'google_calendar', 'Google Calendar', 'Google Kalender', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'scheduling_calendar_support', 'microsoft_365', 'Microsoft 365', 'Microsoft 365', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'scheduling_calendar_support', 'nextcloud', 'Nextcloud', 'Nextcloud', 'positive', 60
  UNION ALL SELECT 'meeting-software', 'shared_notes_docs', 'shared_notes', 'Shared notes', 'Gemeinsame Notizen', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'shared_notes_docs', 'collaborative_docs', 'Collaborative documents', 'Gemeinsame Dokumente', 'neutral', 20
  UNION ALL SELECT 'meeting-software', 'shared_notes_docs', 'agendas', 'Agendas', 'Agenden', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'shared_notes_docs', 'action_items', 'Action items', 'Aufgabenpunkte', 'neutral', 40
  UNION ALL SELECT 'meeting-software', 'reactions_polls_qna', 'reactions', 'Reactions', 'Reaktionen', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'reactions_polls_qna', 'hand_raise', 'Hand raise', 'Handheben', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'reactions_polls_qna', 'polls', 'Polls', 'Umfragen', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'reactions_polls_qna', 'qna', 'Q&A', 'Q&A', 'neutral', 40
  UNION ALL SELECT 'meeting-software', 'reactions_polls_qna', 'emoji_feedback', 'Emoji feedback', 'Emoji-Feedback', 'neutral', 50
  UNION ALL SELECT 'meeting-software', 'e2ee_available', 'none', 'None', 'Keine', 'warning', 10
  UNION ALL SELECT 'meeting-software', 'e2ee_available', 'direct_calls_only', 'Direct calls only', 'Nur Direktanrufe', 'tradeoff', 20
  UNION ALL SELECT 'meeting-software', 'e2ee_available', 'optional_meetings', 'Optional for meetings', 'Optional für Meetings', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'e2ee_available', 'default_meetings', 'Default for meetings', 'Standard für Meetings', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'e2ee_available', 'limited_modes', 'Limited modes', 'Begrenzte Modi', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'host_moderation_controls', 'mute_participants', 'Mute participants', 'Teilnehmer stummschalten', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'host_moderation_controls', 'remove_participants', 'Remove participants', 'Teilnehmer entfernen', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'host_moderation_controls', 'lock_meeting', 'Lock meeting', 'Meeting sperren', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'host_moderation_controls', 'assign_cohosts', 'Assign co-hosts', 'Co-Hosts zuweisen', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'host_moderation_controls', 'spotlight_pin', 'Spotlight/pin', 'Spotlight/Anheften', 'neutral', 50
  UNION ALL SELECT 'meeting-software', 'host_moderation_controls', 'disable_video', 'Disable participant video', 'Teilnehmervideo deaktivieren', 'positive', 60
  UNION ALL SELECT 'meeting-software', 'participant_permissions', 'screen_share_control', 'Screen-share control', 'Bildschirmfreigabe-Kontrolle', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'participant_permissions', 'chat_control', 'Chat control', 'Chat-Kontrolle', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'participant_permissions', 'mic_camera_control', 'Mic/camera control', 'Mikrofon-/Kamera-Kontrolle', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'participant_permissions', 'file_share_control', 'File-share control', 'Dateifreigabe-Kontrolle', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'participant_permissions', 'recording_permission', 'Recording permission', 'Aufzeichnungsberechtigung', 'positive', 50
  UNION ALL SELECT 'meeting-software', 'participant_permissions', 'name_change_control', 'Name-change control', 'Namensänderungskontrolle', 'neutral', 60
  UNION ALL SELECT 'meeting-software', 'recording_available', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'recording_available', 'local_recording', 'Local recording', 'Lokale Aufzeichnung', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'recording_available', 'cloud_recording', 'Cloud recording', 'Cloud-Aufzeichnung', 'tradeoff', 30
  UNION ALL SELECT 'meeting-software', 'recording_available', 'local_and_cloud', 'Local and cloud recording', 'Lokale und Cloud-Aufzeichnung', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'transcript_and_artifact_exports', 'transcript_export', 'Transcript export', 'Transkript-Export', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'transcript_and_artifact_exports', 'captions_saved', 'Saved captions', 'Gespeicherte Untertitel', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'transcript_and_artifact_exports', 'chat_export', 'Chat export', 'Chat-Export', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'transcript_and_artifact_exports', 'attendance_report', 'Attendance report', 'Teilnehmerbericht', 'neutral', 40
  UNION ALL SELECT 'meeting-software', 'transcript_and_artifact_exports', 'ai_summary_export', 'AI summary export', 'KI-Zusammenfassungs-Export', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'transcript_and_artifact_exports', 'whiteboard_export', 'Whiteboard export', 'Whiteboard-Export', 'neutral', 60
  UNION ALL SELECT 'meeting-software', 'retention_controls', 'none', 'None documented', 'Nicht dokumentiert', 'warning', 10
  UNION ALL SELECT 'meeting-software', 'retention_controls', 'fixed_provider_retention', 'Fixed provider retention', 'Feste Anbieter-Aufbewahrung', 'tradeoff', 20
  UNION ALL SELECT 'meeting-software', 'retention_controls', 'user_configurable', 'User configurable', 'Durch Nutzer konfigurierbar', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'retention_controls', 'admin_configurable', 'Admin configurable', 'Durch Admin konfigurierbar', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'data_residency_options', 'none_documented', 'None documented', 'Nicht dokumentiert', 'warning', 10
  UNION ALL SELECT 'meeting-software', 'data_residency_options', 'regional_selection', 'Regional selection', 'Regionale Auswahl', 'tradeoff', 20
  UNION ALL SELECT 'meeting-software', 'data_residency_options', 'eu_region', 'EU region available', 'EU-Region verfügbar', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'data_residency_options', 'self_hosted_control', 'Self-hosted control', 'Kontrolle durch Selbsthosting', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'data_residency_options', 'enterprise_only', 'Enterprise-only', 'Nur Enterprise', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'ai_meeting_features', 'ai_summary', 'AI summary', 'KI-Zusammenfassung', 'tradeoff', 10
  UNION ALL SELECT 'meeting-software', 'ai_meeting_features', 'meeting_assistant', 'Meeting assistant', 'Meeting-Assistent', 'tradeoff', 20
  UNION ALL SELECT 'meeting-software', 'ai_meeting_features', 'action_items', 'Action items', 'Aufgabenpunkte', 'tradeoff', 30
  UNION ALL SELECT 'meeting-software', 'ai_meeting_features', 'real_time_translation', 'Real-time translation', 'Echtzeit-Übersetzung', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'ai_meeting_features', 'sentiment_or_insights', 'Sentiment/insights', 'Sentiment/Einblicke', 'warning', 50
  UNION ALL SELECT 'meeting-software', 'sso_support', 'none', 'None', 'Keine', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'sso_support', 'saml', 'SAML', 'SAML', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'sso_support', 'oidc', 'OpenID Connect', 'OpenID Connect', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'sso_support', 'oauth_workspace', 'OAuth workspace login', 'OAuth-Workspace-Login', 'neutral', 40
  UNION ALL SELECT 'meeting-software', 'sso_support', 'enterprise_only', 'Enterprise-only', 'Nur Enterprise', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'user_provisioning', 'scim', 'SCIM', 'SCIM', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'user_provisioning', 'directory_sync', 'Directory sync', 'Verzeichnissync', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'user_provisioning', 'just_in_time', 'Just-in-time provisioning', 'Just-in-time-Bereitstellung', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'user_provisioning', 'group_sync', 'Group sync', 'Gruppensync', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'user_provisioning', 'domain_claim', 'Domain claim', 'Domain-Claim', 'neutral', 50
  UNION ALL SELECT 'meeting-software', 'calendar_integrations', 'ical', 'iCalendar/ICS', 'iCalendar/ICS', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'calendar_integrations', 'caldav', 'CalDAV', 'CalDAV', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'calendar_integrations', 'nextcloud', 'Nextcloud', 'Nextcloud', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'calendar_integrations', 'google_calendar', 'Google Calendar', 'Google Kalender', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'calendar_integrations', 'microsoft_365', 'Microsoft 365', 'Microsoft 365', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'app_marketplace_api', 'public_api', 'Public API', 'Öffentliche API', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'app_marketplace_api', 'webhooks', 'Webhooks', 'Webhooks', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'app_marketplace_api', 'bots_apps', 'Bots/apps', 'Bots/Apps', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'app_marketplace_api', 'sdk', 'SDK', 'SDK', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'app_marketplace_api', 'marketplace', 'App marketplace', 'App-Marktplatz', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'app_marketplace_api', 'automation_connectors', 'Automation connectors', 'Automatisierungs-Connectoren', 'tradeoff', 60
  UNION ALL SELECT 'meeting-software', 'lms_crm_integrations', 'lti', 'LTI', 'LTI', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'lms_crm_integrations', 'moodle', 'Moodle', 'Moodle', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'lms_crm_integrations', 'canvas', 'Canvas', 'Canvas', 'tradeoff', 30
  UNION ALL SELECT 'meeting-software', 'lms_crm_integrations', 'blackboard', 'Blackboard', 'Blackboard', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'lms_crm_integrations', 'salesforce', 'Salesforce', 'Salesforce', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'lms_crm_integrations', 'generic_crm', 'Generic CRM', 'Generisches CRM', 'neutral', 60
  UNION ALL SELECT 'meeting-software', 'deployment_model', 'hosted_saas', 'Hosted SaaS', 'Gehostetes SaaS', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'deployment_model', 'self_hosted', 'Self-hosted', 'Selbstgehostet', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'deployment_model', 'hybrid', 'Hybrid', 'Hybrid', 'tradeoff', 30
  UNION ALL SELECT 'meeting-software', 'deployment_model', 'appliance', 'Appliance', 'Appliance', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'deployment_model', 'peer_to_peer', 'Peer-to-peer', 'Peer-to-peer', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'protocol_interoperability', 'webrtc', 'WebRTC', 'WebRTC', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'protocol_interoperability', 'sip', 'SIP', 'SIP', 'tradeoff', 20
  UNION ALL SELECT 'meeting-software', 'protocol_interoperability', 'h323', 'H.323', 'H.323', 'tradeoff', 30
  UNION ALL SELECT 'meeting-software', 'protocol_interoperability', 'rtmp', 'RTMP streaming', 'RTMP-Streaming', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'protocol_interoperability', 'xmpp', 'XMPP', 'XMPP', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'protocol_interoperability', 'calendar_standards', 'Calendar standards', 'Kalenderstandards', 'neutral', 60
  UNION ALL SELECT 'meeting-software', 'federation_or_multi_server', 'centralized', 'Centralized', 'Zentralisiert', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'federation_or_multi_server', 'single_self_hosted_instance', 'Single self-hosted instance', 'Einzelne selbstgehostete Instanz', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'federation_or_multi_server', 'federated', 'Federated', 'Föderiert', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'federation_or_multi_server', 'peer_to_peer', 'Peer-to-peer', 'Peer-to-peer', 'tradeoff', 40
  UNION ALL SELECT 'meeting-software', 'federation_or_multi_server', 'hybrid', 'Hybrid', 'Hybrid', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'deployment_requirements', 'stun_turn', 'STUN/TURN', 'STUN/TURN', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'deployment_requirements', 'reverse_proxy', 'Reverse proxy', 'Reverse Proxy', 'neutral', 20
  UNION ALL SELECT 'meeting-software', 'deployment_requirements', 'database', 'Database', 'Datenbank', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'deployment_requirements', 'object_storage', 'Object storage', 'Objektspeicher', 'neutral', 40
  UNION ALL SELECT 'meeting-software', 'deployment_requirements', 'recording_bridge', 'Recording bridge', 'Aufzeichnungs-Bridge', 'tradeoff', 50
  UNION ALL SELECT 'meeting-software', 'deployment_requirements', 'kubernetes', 'Kubernetes', 'Kubernetes', 'tradeoff', 60
  UNION ALL SELECT 'meeting-software', 'deployment_requirements', 'ldap_smtp', 'LDAP/SMTP', 'LDAP/SMTP', 'neutral', 70
  UNION ALL SELECT 'meeting-software', 'accessibility_features', 'keyboard_navigation', 'Keyboard navigation', 'Tastaturnavigation', 'positive', 10
  UNION ALL SELECT 'meeting-software', 'accessibility_features', 'screen_reader_support', 'Screen-reader support', 'Screenreader-Unterstützung', 'positive', 20
  UNION ALL SELECT 'meeting-software', 'accessibility_features', 'captions', 'Captions', 'Untertitel', 'positive', 30
  UNION ALL SELECT 'meeting-software', 'accessibility_features', 'high_contrast', 'High contrast', 'Hoher Kontrast', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'accessibility_features', 'reduced_motion', 'Reduced motion', 'Reduzierte Bewegung', 'positive', 50
  UNION ALL SELECT 'meeting-software', 'language_interpretation_translation', 'simultaneous_interpretation', 'Simultaneous interpretation', 'Simultandolmetschen', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'language_interpretation_translation', 'translated_captions', 'Translated captions', 'Übersetzte Untertitel', 'neutral', 20
  UNION ALL SELECT 'meeting-software', 'language_interpretation_translation', 'live_translation', 'Live translation', 'Live-Übersetzung', 'tradeoff', 30
  UNION ALL SELECT 'meeting-software', 'language_interpretation_translation', 'multilingual_ui', 'Multilingual UI', 'Mehrsprachige Oberfläche', 'neutral', 40
  UNION ALL SELECT 'meeting-software', 'language_interpretation_translation', 'rtl_support', 'RTL support', 'RTL-Unterstützung', 'neutral', 50
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'small_team_meetings', 'Small team meetings', 'Kleine Teammeetings', 'neutral', 10
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'public_webinars', 'Public webinars', 'Öffentliche Webinare', 'tradeoff', 20
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'classrooms_training', 'Classrooms/training', 'Unterricht/Schulungen', 'neutral', 30
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'self_hosted_orgs', 'Self-hosted organizations', 'Selbsthostende Organisationen', 'positive', 40
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'privacy_sensitive', 'Privacy-sensitive meetings', 'Datenschutzsensible Meetings', 'positive', 50
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'large_enterprise', 'Large enterprise', 'Große Unternehmen', 'neutral', 60
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'low_bandwidth_regions', 'Low-bandwidth regions', 'Regionen mit geringer Bandbreite', 'tradeoff', 70
  UNION ALL SELECT 'meeting-software', 'fit_profiles', 'healthcare_consulting', 'Healthcare/consulting', 'Gesundheit/Beratung', 'tradeoff', 80
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'meeting-software'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'meeting-software'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('012-meeting-software-matrix-criteria');
