-- Migration 041: Define Scheduling category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('scheduling', 'booking_types', 'Booking Types & Formats', 'Buchungstypen & Formate', 'Supported appointment types, group booking, round-robin, and scheduling formats.', 'Unterstuetzte Termintypen, Gruppenbuchung, Round-Robin und Planungsformate.', 100),
  ('scheduling', 'availability_management', 'Availability & Time Rules', 'Verfuegbarkeit & Zeitregeln', 'Calendar-connected availability, buffer times, timezone handling, and booking limits.', 'Kalenderverbundene Verfuegbarkeit, Pufferzeiten, Zeitzonen-Handling und Buchungslimits.', 200),
  ('scheduling', 'booking_pages', 'Booking Pages & Customization', 'Buchungsseiten & Anpassung', 'Booking page presentation, branding, embedding, and custom domain support.', 'Buchungsseitenpraesentation, Branding, Einbettung und benutzerdefinierte Domainunterstuetzung.', 300),
  ('scheduling', 'calendar_integrations', 'Calendar & Conferencing', 'Kalender & Konferenzen', 'Calendar provider integrations, video conferencing auto-links, and sync behavior.', 'Kalenderanbieter-Integrationen, Videokonferenz-Auto-Links und Synchronisationsverhalten.', 400),
  ('scheduling', 'notifications_workflows', 'Notifications & Workflows', 'Benachrichtigungen & Workflows', 'Booking confirmations, reminders, cancellation policies, and follow-up automation.', 'Buchungsbestaetigungen, Erinnerungen, Stornierungsrichtlinien und Folgeautomatisierung.', 500),
  ('scheduling', 'team_routing', 'Team Scheduling & Routing', 'Teamplanung & Routing', 'Multi-user scheduling, round-robin assignment, routing forms, and collective booking.', 'Mehrbenutzter-Terminplanung, Round-Robin-Zuweisung, Routing-Formulare und kollektive Buchung.', 600),
  ('scheduling', 'privacy_data', 'Privacy & Data', 'Privatsphaere & Daten', 'Account requirements, data processing location, data export, and telemetry.', 'Kontoanforderungen, Datenverarbeitungsstandort, Datenexport und Telemetrie.', 700),
  ('scheduling', 'openness_deployment', 'Openness & Deployment', 'Offenheit & Bereitstellung', 'Source code availability, self-hosting, licensing, and deployment options.', 'Quellcode-Verfuegbarkeit, Selbst-Hosting, Lizenzierung und Bereitstellungsoptionen.', 800),
  ('scheduling', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier, event type limits, and target audience profiles.', 'Preismodell, kostenlose Version, Eventtypbegrenzungen und Zielgruppenprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'scheduling' AS category_id, 'booking_types' AS group_key, 'one_on_one_booking' AS criterion_key, 'One-on-one booking' AS label_en, 'Einzelbuchung' AS label_de, 'boolean' AS value_type, 'beneficial' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'Whether the tool supports scheduling one-on-one meetings between a host and a single invitee.' AS help_text_en, 'Ob das Tool die Planung von Einzelterminen zwischen einem Gastgeber und einem einzelnen Eingeladenen unterstuetzt.' AS help_text_de
  UNION ALL SELECT 'scheduling', 'booking_types', 'group_booking', 'Group booking', 'Gruppenbuchung', 'boolean', 'beneficial', 'optional', 1020, 'Whether multiple invitees can book the same time slot for a group session.', 'Ob mehrere Eingeladene denselben Zeitraum fuer eine Gruppensitzung buchen koennen.'
  UNION ALL SELECT 'scheduling', 'booking_types', 'round_robin_assignment', 'Round-robin assignment', 'Round-Robin-Zuweisung', 'boolean', 'beneficial', 'optional', 1030, 'Whether bookings are automatically distributed among team members in rotation.', 'Ob Buchungen automatisch im Rotationsverfahren an Teammitglieder verteilt werden.'
  UNION ALL SELECT 'scheduling', 'booking_types', 'collective_scheduling', 'Collective scheduling', 'Kollektive Terminplanung', 'boolean', 'beneficial', 'optional', 1040, 'Whether the tool requires all selected hosts to be available before a slot is offered.', 'Ob das Tool verlangt, dass alle ausgewaehlten Gastgeber verfuegbar sind, bevor ein Zeitfenster angeboten wird.'
  UNION ALL SELECT 'scheduling', 'booking_types', 'recurring_appointments', 'Recurring appointments', 'Wiederkehrende Termine', 'boolean', 'beneficial', 'optional', 1050, 'Whether invitees can book recurring appointments on a regular schedule.', 'Ob Eingeladene wiederkehrende Termine in regelmaessigen Abstaenden buchen koennen.'
  UNION ALL SELECT 'scheduling', 'booking_types', 'event_type_variety', 'Event type variety', 'Eventtypvielfalt', 'enum', 'informational', 'optional', 1060, 'The range of configurable event types and duration options available to hosts.', 'Die Bandbreite konfigurierbarer Eventtypen und Daueroptionen fuer Gastgeber.'
  UNION ALL SELECT 'scheduling', 'availability_management', 'calendar_connected_availability', 'Calendar-connected availability', 'Kalenderverbundene Verfuegbarkeit', 'boolean', 'beneficial', 'must_match', 2010, 'Whether available time slots are derived from connected calendar data in real time.', 'Ob verfuegbare Zeitfenster in Echtzeit aus verbundenen Kalenderdaten abgeleitet werden.'
  UNION ALL SELECT 'scheduling', 'availability_management', 'timezone_handling', 'Timezone handling', 'Zeitzonen-Handling', 'enum', 'informational', 'optional', 2020, 'How the tool handles timezone differences between hosts and invitees.', 'Wie das Tool Zeitzonenunterschiede zwischen Gastgebern und Eingeladenen behandelt.'
  UNION ALL SELECT 'scheduling', 'availability_management', 'buffer_times', 'Buffer times between bookings', 'Pufferzeiten zwischen Buchungen', 'boolean', 'beneficial', 'optional', 2030, 'Whether hosts can enforce minimum gaps between consecutive bookings.', 'Ob Gastgeber Mindestabstaende zwischen aufeinanderfolgenden Buchungen erzwingen koennen.'
  UNION ALL SELECT 'scheduling', 'availability_management', 'booking_limits', 'Daily / weekly booking limits', 'Taegliche / woechentliche Buchungslimits', 'boolean', 'beneficial', 'optional', 2040, 'Whether hosts can set maximum booking counts per day or week.', 'Ob Gastgeber maximale Buchungsanzahlen pro Tag oder Woche festlegen koennen.'
  UNION ALL SELECT 'scheduling', 'availability_management', 'minimum_notice_period', 'Minimum notice period', 'Mindestvorlaufzeit', 'boolean', 'informational', 'optional', 2050, 'Whether hosts can require a minimum lead time before an appointment can be booked.', 'Ob Gastgeber eine Mindestvorlaufzeit vor der Buchung eines Termins verlangen koennen.'
  UNION ALL SELECT 'scheduling', 'availability_management', 'date_range_restrictions', 'Date range restrictions', 'Datumsbereichsbeschraenkungen', 'boolean', 'informational', 'optional', 2060, 'Whether hosts can limit bookable dates to a specific future window.', 'Ob Gastgeber buchbare Termine auf ein bestimmtes zukuenftiges Zeitfenster beschraenken koennen.'
  UNION ALL SELECT 'scheduling', 'booking_pages', 'branded_booking_pages', 'Branded booking pages', 'Gebrandete Buchungsseiten', 'boolean', 'beneficial', 'optional', 3010, 'Whether the booking page can display the host organization logo, colors, and branding.', 'Ob die Buchungsseite das Logo, die Farben und das Branding der Gastgeberorganisation anzeigen kann.'
  UNION ALL SELECT 'scheduling', 'booking_pages', 'custom_domain_support', 'Custom domain support', 'Benutzerdefinierte Domainunterstuetzung', 'boolean', 'beneficial', 'optional', 3020, 'Whether the booking page can be served from a custom domain name.', 'Ob die Buchungsseite ueber einen benutzerdefinierten Domainnamen bereitgestellt werden kann.'
  UNION ALL SELECT 'scheduling', 'booking_pages', 'embed_widget', 'Embeddable widget', 'Einbettbares Widget', 'boolean', 'beneficial', 'optional', 3030, 'Whether the booking interface can be embedded into external websites.', 'Ob die Buchungsoberflaeche in externe Websites eingebettet werden kann.'
  UNION ALL SELECT 'scheduling', 'booking_pages', 'multi_event_page', 'Multi-event-type page', 'Seite mit mehreren Eventtypen', 'boolean', 'informational', 'optional', 3040, 'Whether a single page can list multiple event types for invitees to choose from.', 'Ob eine einzelne Seite mehrere Eventtypen auflisten kann, aus denen Eingeladene waehlen koennen.'
  UNION ALL SELECT 'scheduling', 'booking_pages', 'custom_questions', 'Custom booking questions', 'Benutzerdefinierte Buchungsfragen', 'boolean', 'beneficial', 'optional', 3050, 'Whether hosts can add custom intake questions to the booking form.', 'Ob Gastgeber benutzerdefinierte Aufnahmefragen zum Buchungsformular hinzufuegen koennen.'
  UNION ALL SELECT 'scheduling', 'calendar_integrations', 'calendar_providers', 'Calendar provider support', 'Kalenderanbieter-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 4010, 'Which calendar platforms are supported for availability checking and event creation.', 'Welche Kalenderplattformen fuer Verfuegbarkeitspruefung und Eventerstellung unterstuetzt werden.'
  UNION ALL SELECT 'scheduling', 'calendar_integrations', 'two_way_calendar_sync', 'Two-way calendar sync', 'Bidirektionale Kalendersynchronisation', 'boolean', 'beneficial', 'must_match', 4020, 'Whether booked appointments are written back to the connected calendar automatically.', 'Ob gebuchte Termine automatisch in den verbundenen Kalender zurueckgeschrieben werden.'
  UNION ALL SELECT 'scheduling', 'calendar_integrations', 'conferencing_auto_link', 'Conferencing auto-link', 'Konferenz-Auto-Link', 'multi_enum', 'informational', 'multi_select', 4030, 'Which video conferencing providers can be auto-linked to booked appointments.', 'Welche Videokonferenzanbieter automatisch mit gebuchten Terminen verknuepft werden koennen.'
  UNION ALL SELECT 'scheduling', 'calendar_integrations', 'ical_feed', 'iCal feed support', 'iCal-Feed-Unterstuetzung', 'boolean', 'informational', 'optional', 4040, 'Whether the tool provides an iCal feed URL for subscribing in external calendar apps.', 'Ob das Tool eine iCal-Feed-URL zum Abonnieren in externen Kalender-Apps bereitstellt.'
  UNION ALL SELECT 'scheduling', 'notifications_workflows', 'email_confirmations', 'Email confirmations', 'E-Mail-Bestaetigungen', 'boolean', 'beneficial', 'optional', 5010, 'Whether booking confirmation emails are sent to hosts and invitees automatically.', 'Ob Buchungsbestaetigungs-E-Mails automatisch an Gastgeber und Eingeladene gesendet werden.'
  UNION ALL SELECT 'scheduling', 'notifications_workflows', 'reminder_channels', 'Reminder channels', 'Erinnerungskanaele', 'multi_enum', 'informational', 'multi_select', 5020, 'The communication channels available for sending appointment reminders.', 'Die verfuegbaren Kommunikationskanaele zum Versenden von Terminerinnerungen.'
  UNION ALL SELECT 'scheduling', 'notifications_workflows', 'cancellation_rescheduling', 'Cancellation / rescheduling', 'Stornierung / Umbuchung', 'enum', 'informational', 'optional', 5030, 'How invitees can cancel or reschedule their booked appointments.', 'Wie Eingeladene ihre gebuchten Termine stornieren oder umbuchen koennen.'
  UNION ALL SELECT 'scheduling', 'notifications_workflows', 'workflow_automation', 'Workflow automation', 'Workflow-Automatisierung', 'enum', 'informational', 'optional', 5040, 'The level of automated workflow support for pre- and post-booking actions.', 'Das Niveau der automatisierten Workflow-Unterstuetzung fuer Aktionen vor und nach der Buchung.'
  UNION ALL SELECT 'scheduling', 'team_routing', 'team_member_pages', 'Team member pages', 'Teammitgliederseiten', 'boolean', 'beneficial', 'optional', 6010, 'Whether individual team members get their own bookable scheduling pages.', 'Ob einzelne Teammitglieder eigene buchbare Terminplanungsseiten erhalten.'
  UNION ALL SELECT 'scheduling', 'team_routing', 'routing_forms', 'Routing forms', 'Routing-Formulare', 'boolean', 'beneficial', 'optional', 6020, 'Whether intake forms can route invitees to the appropriate team member or event type.', 'Ob Aufnahmeformulare Eingeladene zum passenden Teammitglied oder Eventtyp weiterleiten koennen.'
  UNION ALL SELECT 'scheduling', 'team_routing', 'managed_team_availability', 'Managed team availability', 'Verwaltete Teamverfuegbarkeit', 'boolean', 'beneficial', 'optional', 6030, 'Whether administrators can manage availability rules across the entire team.', 'Ob Administratoren Verfuegbarkeitsregeln fuer das gesamte Team verwalten koennen.'
  UNION ALL SELECT 'scheduling', 'team_routing', 'payment_collection', 'Payment collection', 'Zahlungseinzug', 'boolean', 'informational', 'optional', 6040, 'Whether payment can be collected at the time of booking through integrated processors.', 'Ob Zahlungen zum Zeitpunkt der Buchung ueber integrierte Zahlungsanbieter eingezogen werden koennen.'
  UNION ALL SELECT 'scheduling', 'privacy_data', 'account_requirement', 'Account requirement', 'Kontoanforderung', 'enum', 'risk', 'optional', 7010, 'What type of account invitees must create to book an appointment.', 'Welche Art von Konto Eingeladene erstellen muessen, um einen Termin zu buchen.'
  UNION ALL SELECT 'scheduling', 'privacy_data', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 7020, 'Where booking and user data are processed and stored geographically.', 'Wo Buchungs- und Benutzerdaten geografisch verarbeitet und gespeichert werden.'
  UNION ALL SELECT 'scheduling', 'privacy_data', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 7030, 'Whether booking data and account information can be exported in a portable format.', 'Ob Buchungsdaten und Kontoinformationen in einem portablen Format exportiert werden koennen.'
  UNION ALL SELECT 'scheduling', 'privacy_data', 'telemetry_model', 'Telemetry model', 'Telemetriemodell', 'enum', 'risk', 'optional', 7040, 'How the tool handles collection and transmission of usage analytics data.', 'Wie das Tool die Erfassung und Uebermittlung von Nutzungsanalysedaten handhabt.'
  UNION ALL SELECT 'scheduling', 'openness_deployment', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8010, 'The openness of the scheduling tool source code and its public availability.', 'Die Offenheit des Quellcodes des Planungstools und seine oeffentliche Verfuegbarkeit.'
  UNION ALL SELECT 'scheduling', 'openness_deployment', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 8020, 'The software license under which the scheduling tool is distributed.', 'Die Softwarelizenz, unter der das Planungstool vertrieben wird.'
  UNION ALL SELECT 'scheduling', 'openness_deployment', 'self_hosting_option', 'Self-hosting option', 'Selbsthosting-Option', 'boolean', 'beneficial', 'must_match', 8030, 'Whether the scheduling tool can be self-hosted on personal infrastructure.', 'Ob das Planungstool auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'scheduling', 'openness_deployment', 'hosting_model', 'Hosting model', 'Hosting-Modell', 'enum', 'tradeoff', 'must_match', 8040, 'Whether the tool is available as a cloud service, self-hosted, or both.', 'Ob das Tool als Cloud-Dienst, selbst gehostet oder beides verfuegbar ist.'
  UNION ALL SELECT 'scheduling', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'The pricing structure of the scheduling tool and any associated services.', 'Die Preisstruktur des Planungstools und der zugehoerigen Dienste.'
  UNION ALL SELECT 'scheduling', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Version verfuegbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a functional free version of the scheduling tool is available.', 'Ob eine funktionsfaehige kostenlose Version des Planungstools verfuegbar ist.'
  UNION ALL SELECT 'scheduling', 'pricing_fit', 'event_type_limit_free', 'Event type limit (free tier)', 'Eventtypbegrenzung (kostenlose Version)', 'enum', 'informational', 'optional', 9030, 'How many event types are available on the free tier of the scheduling tool.', 'Wie viele Eventtypen in der kostenlosen Version des Planungstools verfuegbar sind.'
  UNION ALL SELECT 'scheduling', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9040, 'Target audience profiles the scheduling tool is best suited for.', 'Zielgruppenprofile, fuer die das Planungstool am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'scheduling' AS category_id, 'event_type_variety' AS criterion_key, 'single_duration' AS option_key, 'Single duration' AS label_en, 'Einzelne Dauer' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'scheduling', 'event_type_variety', 'multiple_durations', 'Multiple durations', 'Mehrere Dauern', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'event_type_variety', 'fully_customizable', 'Fully customizable', 'Vollstaendig anpassbar', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'timezone_handling', 'automatic_detection', 'Automatic detection', 'Automatische Erkennung', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'timezone_handling', 'invitee_selects', 'Invitee selects', 'Eingeladener waehlt', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'timezone_handling', 'host_timezone_only', 'Host timezone only', 'Nur Gastgeber-Zeitzone', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'calendar_providers', 'google_calendar', 'Google Calendar', 'Google Kalender', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'calendar_providers', 'microsoft_365', 'Microsoft 365', 'Microsoft 365', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'calendar_providers', 'caldav_nextcloud', 'CalDAV / Nextcloud', 'CalDAV / Nextcloud', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'calendar_providers', 'apple_icloud', 'Apple iCloud', 'Apple iCloud', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'calendar_providers', 'fastmail', 'Fastmail', 'Fastmail', 'neutral', 50
  UNION ALL SELECT 'scheduling', 'conferencing_auto_link', 'zoom', 'Zoom', 'Zoom', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'conferencing_auto_link', 'google_meet', 'Google Meet', 'Google Meet', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'conferencing_auto_link', 'microsoft_teams', 'Microsoft Teams', 'Microsoft Teams', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'conferencing_auto_link', 'jitsi', 'Jitsi', 'Jitsi', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'conferencing_auto_link', 'webex', 'Webex', 'Webex', 'neutral', 50
  UNION ALL SELECT 'scheduling', 'conferencing_auto_link', 'custom_link', 'Custom link', 'Benutzerdefinierter Link', 'neutral', 60
  UNION ALL SELECT 'scheduling', 'reminder_channels', 'email_reminder', 'Email reminder', 'E-Mail-Erinnerung', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'reminder_channels', 'sms_reminder', 'SMS reminder', 'SMS-Erinnerung', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'reminder_channels', 'webhook_reminder', 'Webhook reminder', 'Webhook-Erinnerung', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'reminder_channels', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'cancellation_rescheduling', 'self_service_both', 'Self-service both', 'Self-Service beides', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'cancellation_rescheduling', 'self_service_cancel_only', 'Self-service cancel only', 'Self-Service nur Stornierung', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'cancellation_rescheduling', 'host_only', 'Host only', 'Nur Gastgeber', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'cancellation_rescheduling', 'not_supported', 'Not supported', 'Nicht unterstuetzt', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'workflow_automation', 'built_in_workflows', 'Built-in workflows', 'Integrierte Workflows', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'workflow_automation', 'zapier_ifttt_only', 'Zapier / IFTTT only', 'Nur Zapier / IFTTT', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'workflow_automation', 'api_webhooks_only', 'API / webhooks only', 'Nur API / Webhooks', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'workflow_automation', 'none_documented', 'None documented', 'Keine dokumentiert', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'account_requirement', 'no_account_needed', 'No account needed', 'Kein Konto erforderlich', 'positive', 10
  UNION ALL SELECT 'scheduling', 'account_requirement', 'host_account_only', 'Host account only', 'Nur Gastgeberkonto', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'account_requirement', 'optional_invitee_account', 'Optional invitee account', 'Optionales Eingeladenenkonto', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'account_requirement', 'mandatory_accounts', 'Mandatory accounts', 'Pflichtkonten', 'warning', 40
  UNION ALL SELECT 'scheduling', 'data_processing_location', 'eu_only', 'EU only', 'Nur EU', 'positive', 10
  UNION ALL SELECT 'scheduling', 'data_processing_location', 'eu_primary', 'EU primary', 'EU primaer', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'scheduling', 'data_processing_location', 'user_configured', 'User-configured', 'Vom Benutzer konfiguriert', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 50
  UNION ALL SELECT 'scheduling', 'telemetry_model', 'no_telemetry', 'No telemetry', 'Keine Telemetrie', 'positive', 10
  UNION ALL SELECT 'scheduling', 'telemetry_model', 'opt_in_telemetry', 'Opt-in telemetry', 'Opt-in-Telemetrie', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'telemetry_model', 'opt_out_telemetry', 'Opt-out telemetry', 'Opt-out-Telemetrie', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'telemetry_model', 'mandatory_telemetry', 'Mandatory telemetry', 'Pflichttelemetrie', 'warning', 40
  UNION ALL SELECT 'scheduling', 'source_model', 'fully_open_source', 'Fully open source', 'Vollstaendig quelloffen', 'positive', 10
  UNION ALL SELECT 'scheduling', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'source_model', 'partially_open', 'Partially open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'scheduling', 'license_type', 'gpl_family', 'GPL family', 'GPL-Familie', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'license_type', 'mit_bsd_apache', 'MIT / BSD / Apache', 'MIT / BSD / Apache', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'license_type', 'custom_open', 'Custom open', 'Benutzerdefiniert offen', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'license_type', 'proprietary', 'Proprietary', 'Proprietaer', 'neutral', 50
  UNION ALL SELECT 'scheduling', 'hosting_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'hosting_model', 'self_hosted_only', 'Self-hosted only', 'Nur selbst gehostet', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'hosting_model', 'both', 'Both', 'Beides', 'positive', 30
  UNION ALL SELECT 'scheduling', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'scheduling', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'pricing_model', 'subscription_only', 'Subscription only', 'Nur Abonnement', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'pricing_model', 'one_time_purchase', 'One-time purchase', 'Einmalkauf', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'event_type_limit_free', 'unlimited', 'Unlimited', 'Unbegrenzt', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'event_type_limit_free', 'generous_5_plus', 'Generous (5+)', 'Grosszuegig (5+)', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'event_type_limit_free', 'limited_1_to_4', 'Limited (1-4)', 'Begrenzt (1-4)', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'event_type_limit_free', 'none_free', 'None free', 'Keine kostenlos', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'fit_profiles', 'solo_professional', 'Solo professional', 'Einzelunternehmer', 'neutral', 10
  UNION ALL SELECT 'scheduling', 'fit_profiles', 'small_team', 'Small team', 'Kleines Team', 'neutral', 20
  UNION ALL SELECT 'scheduling', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'scheduling', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 40
  UNION ALL SELECT 'scheduling', 'fit_profiles', 'self_hoster', 'Self-hoster', 'Selbst-Hoster', 'neutral', 50
  UNION ALL SELECT 'scheduling', 'fit_profiles', 'educator_coach', 'Educator / coach', 'Paedagoge / Coach', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'scheduling'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'scheduling'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('041-scheduling-matrix-criteria');
