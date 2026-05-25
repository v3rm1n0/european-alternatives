-- Migration 022: Define Project Management category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('project-management', 'task_work_structure', 'Task & Work Structure', 'Aufgaben- & Arbeitsstruktur', 'How tasks, subtasks, dependencies, and work hierarchies are organized.', 'Wie Aufgaben, Unteraufgaben, Abhaengigkeiten und Arbeitshierarchien organisiert werden.', 100),
  ('project-management', 'views_visualization', 'Views & Visualization', 'Ansichten & Visualisierung', 'Board, list, timeline, Gantt, calendar, and other project views.', 'Board-, Listen-, Zeitleisten-, Gantt-, Kalender- und andere Projektansichten.', 200),
  ('project-management', 'collaboration_communication', 'Collaboration & Communication', 'Zusammenarbeit & Kommunikation', 'Comments, mentions, notifications, activity feeds, and real-time editing.', 'Kommentare, Erwaehnungen, Benachrichtigungen, Aktivitaetsfeeds und Echtzeit-Bearbeitung.', 300),
  ('project-management', 'automation_workflows', 'Automation & Workflows', 'Automatisierung & Workflows', 'Rule-based automation, custom workflows, status transitions, and approval processes.', 'Regelbasierte Automatisierung, benutzerdefinierte Workflows, Statusuebergaenge und Genehmigungsprozesse.', 400),
  ('project-management', 'platform_access', 'Platform & Access', 'Plattform & Zugriff', 'Supported platforms, mobile apps, offline access, and guest or external user support.', 'Unterstuetzte Plattformen, mobile Apps, Offline-Zugriff und Gast- oder externer Nutzerzugang.', 500),
  ('project-management', 'integration_extensibility', 'Integration & Extensibility', 'Integration & Erweiterbarkeit', 'APIs, webhooks, third-party integrations, import and export, and plugin ecosystems.', 'APIs, Webhooks, Drittanbieter-Integrationen, Import und Export sowie Plugin-Oekosysteme.', 600),
  ('project-management', 'admin_permissions', 'Administration & Permissions', 'Administration & Berechtigungen', 'Roles, permissions, SSO, audit logs, team and organization management, and compliance.', 'Rollen, Berechtigungen, SSO, Audit-Logs, Team- und Organisationsverwaltung sowie Compliance.', 700),
  ('project-management', 'deployment_data', 'Deployment & Data', 'Bereitstellung & Daten', 'Hosting model, self-hosting, data residency, backup, and data portability.', 'Hosting-Modell, Self-Hosting, Datenresidenz, Backup und Datenportabilitaet.', 800),
  ('project-management', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier, team size limits, and target use-case profiles.', 'Preismodell, kostenlose Stufe, Teamgroessenlimits und Zielgruppen-Eignungsprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'project-management' AS category_id, 'task_work_structure' AS group_key, 'task_hierarchy' AS criterion_key, 'Task hierarchy depth' AS label_en, 'Aufgabenhierarchietiefe' AS label_de, 'enum' AS value_type, 'informational' AS semantics, 'optional' AS filter_mode, 1010 AS sort_order, 'How many levels of task nesting the tool supports.' AS help_text_en, 'Wie viele Ebenen der Aufgabenverschachtelung das Tool unterstuetzt.' AS help_text_de
  UNION ALL SELECT 'project-management', 'task_work_structure', 'subtasks_support', 'Subtasks support', 'Unteraufgaben-Unterstuetzung', 'boolean', 'beneficial', 'optional', 1020, 'Whether tasks can be broken into subtasks.', 'Ob Aufgaben in Unteraufgaben aufgeteilt werden koennen.'
  UNION ALL SELECT 'project-management', 'task_work_structure', 'task_dependencies', 'Task dependencies', 'Aufgabenabhaengigkeiten', 'boolean', 'beneficial', 'optional', 1030, 'Whether dependencies between tasks can be defined.', 'Ob Abhaengigkeiten zwischen Aufgaben definiert werden koennen.'
  UNION ALL SELECT 'project-management', 'task_work_structure', 'custom_fields', 'Custom fields', 'Benutzerdefinierte Felder', 'boolean', 'beneficial', 'optional', 1040, 'Whether custom data fields can be added to tasks.', 'Ob benutzerdefinierte Datenfelder zu Aufgaben hinzugefuegt werden koennen.'
  UNION ALL SELECT 'project-management', 'task_work_structure', 'milestones', 'Milestones', 'Meilensteine', 'boolean', 'beneficial', 'optional', 1050, 'Whether project milestones can be defined and tracked.', 'Ob Projektmeilensteine definiert und verfolgt werden koennen.'
  UNION ALL SELECT 'project-management', 'task_work_structure', 'time_tracking', 'Built-in time tracking', 'Integrierte Zeiterfassung', 'boolean', 'informational', 'optional', 1060, 'Whether time spent on tasks can be tracked within the tool.', 'Ob die fuer Aufgaben aufgewendete Zeit innerhalb des Tools erfasst werden kann.'
  UNION ALL SELECT 'project-management', 'task_work_structure', 'recurring_tasks', 'Recurring tasks', 'Wiederkehrende Aufgaben', 'boolean', 'beneficial', 'optional', 1070, 'Whether tasks can be automatically created on a recurring schedule.', 'Ob Aufgaben automatisch nach einem wiederkehrenden Zeitplan erstellt werden koennen.'
  UNION ALL SELECT 'project-management', 'task_work_structure', 'task_templates', 'Task templates', 'Aufgabenvorlagen', 'boolean', 'beneficial', 'optional', 1080, 'Whether reusable task or project templates are available.', 'Ob wiederverwendbare Aufgaben- oder Projektvorlagen verfuegbar sind.'
  UNION ALL SELECT 'project-management', 'views_visualization', 'board_view', 'Board / Kanban view', 'Board- / Kanban-Ansicht', 'boolean', 'beneficial', 'must_match', 2010, 'Whether a Kanban-style board view is available.', 'Ob eine Kanban-artige Board-Ansicht verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'views_visualization', 'list_view', 'List / table view', 'Listen- / Tabellenansicht', 'boolean', 'beneficial', 'must_match', 2020, 'Whether a list or table view is available for tasks.', 'Ob eine Listen- oder Tabellenansicht fuer Aufgaben verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'views_visualization', 'timeline_gantt', 'Timeline or Gantt view', 'Zeitleisten- oder Gantt-Ansicht', 'boolean', 'beneficial', 'optional', 2030, 'Whether a timeline or Gantt chart view is available.', 'Ob eine Zeitleisten- oder Gantt-Diagramm-Ansicht verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'views_visualization', 'calendar_view', 'Calendar view', 'Kalenderansicht', 'boolean', 'beneficial', 'optional', 2040, 'Whether a calendar view for task scheduling is available.', 'Ob eine Kalenderansicht fuer die Aufgabenplanung verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'views_visualization', 'custom_views', 'Custom or saved views', 'Benutzerdefinierte oder gespeicherte Ansichten', 'boolean', 'beneficial', 'optional', 2050, 'Whether custom views with filters and layouts can be saved.', 'Ob benutzerdefinierte Ansichten mit Filtern und Layouts gespeichert werden koennen.'
  UNION ALL SELECT 'project-management', 'views_visualization', 'dashboard_reporting', 'Dashboards and reporting', 'Dashboards und Berichte', 'boolean', 'informational', 'optional', 2060, 'Whether built-in dashboards and reporting features are available.', 'Ob integrierte Dashboards und Berichtsfunktionen verfuegbar sind.'
  UNION ALL SELECT 'project-management', 'collaboration_communication', 'task_comments', 'Task comments', 'Aufgabenkommentare', 'boolean', 'beneficial', 'optional', 3010, 'Whether comments can be added to tasks.', 'Ob Kommentare zu Aufgaben hinzugefuegt werden koennen.'
  UNION ALL SELECT 'project-management', 'collaboration_communication', 'mentions_notifications', 'Mentions and notifications', 'Erwaehnungen und Benachrichtigungen', 'boolean', 'beneficial', 'optional', 3020, 'Whether users can be mentioned and receive notifications.', 'Ob Nutzer erwaehnt werden und Benachrichtigungen erhalten koennen.'
  UNION ALL SELECT 'project-management', 'collaboration_communication', 'activity_feed', 'Activity feed or history', 'Aktivitaetsfeed oder Verlauf', 'boolean', 'informational', 'optional', 3030, 'Whether an activity feed or change history is available.', 'Ob ein Aktivitaetsfeed oder Aenderungsverlauf verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'collaboration_communication', 'real_time_collaboration', 'Real-time collaboration', 'Echtzeit-Zusammenarbeit', 'boolean', 'beneficial', 'optional', 3040, 'Whether multiple users can work simultaneously with live updates.', 'Ob mehrere Nutzer gleichzeitig mit Live-Updates arbeiten koennen.'
  UNION ALL SELECT 'project-management', 'collaboration_communication', 'document_wiki', 'Built-in documents or wiki', 'Integrierte Dokumente oder Wiki', 'boolean', 'beneficial', 'optional', 3050, 'Whether the tool includes built-in documentation or wiki features.', 'Ob das Tool integrierte Dokumentations- oder Wiki-Funktionen bietet.'
  UNION ALL SELECT 'project-management', 'collaboration_communication', 'file_attachments', 'File attachments', 'Dateianhaeenge', 'boolean', 'beneficial', 'optional', 3060, 'Whether files can be attached to tasks.', 'Ob Dateien an Aufgaben angehaengt werden koennen.'
  UNION ALL SELECT 'project-management', 'automation_workflows', 'custom_workflows', 'Custom workflow statuses', 'Benutzerdefinierte Workflow-Status', 'boolean', 'beneficial', 'optional', 4010, 'Whether custom workflow statuses and transitions can be defined.', 'Ob benutzerdefinierte Workflow-Status und Uebergaenge definiert werden koennen.'
  UNION ALL SELECT 'project-management', 'automation_workflows', 'automation_rules', 'Automation rules', 'Automatisierungsregeln', 'boolean', 'beneficial', 'optional', 4020, 'Whether rule-based automation can be configured for tasks.', 'Ob regelbasierte Automatisierung fuer Aufgaben konfiguriert werden kann.'
  UNION ALL SELECT 'project-management', 'automation_workflows', 'approval_processes', 'Approval processes', 'Genehmigungsprozesse', 'boolean', 'beneficial', 'optional', 4030, 'Whether formal approval workflows can be set up.', 'Ob formale Genehmigungsworkflows eingerichtet werden koennen.'
  UNION ALL SELECT 'project-management', 'automation_workflows', 'form_intake', 'Form-based intake', 'Formularbasierte Erfassung', 'boolean', 'beneficial', 'optional', 4040, 'Whether forms can be used to create tasks from external requests.', 'Ob Formulare zur Erstellung von Aufgaben aus externen Anfragen verwendet werden koennen.'
  UNION ALL SELECT 'project-management', 'platform_access', 'supported_platforms', 'Supported platforms', 'Unterstuetzte Plattformen', 'multi_enum', 'informational', 'multi_select', 5010, 'Which platforms the tool is available on.', 'Auf welchen Plattformen das Tool verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'platform_access', 'mobile_apps', 'Mobile apps', 'Mobile Apps', 'boolean', 'beneficial', 'optional', 5020, 'Whether native mobile apps are available.', 'Ob native mobile Apps verfuegbar sind.'
  UNION ALL SELECT 'project-management', 'platform_access', 'offline_access', 'Offline access', 'Offline-Zugriff', 'boolean', 'beneficial', 'optional', 5030, 'Whether the tool can be used without an internet connection.', 'Ob das Tool ohne Internetverbindung genutzt werden kann.'
  UNION ALL SELECT 'project-management', 'platform_access', 'guest_access', 'Guest or external user access', 'Gast- oder externer Nutzerzugang', 'boolean', 'beneficial', 'optional', 5040, 'Whether external users or guests can be invited with limited access.', 'Ob externe Nutzer oder Gaeste mit eingeschraenktem Zugang eingeladen werden koennen.'
  UNION ALL SELECT 'project-management', 'platform_access', 'browser_access', 'Browser access', 'Browserzugriff', 'boolean', 'beneficial', 'optional', 5050, 'Whether the tool can be used directly in a web browser.', 'Ob das Tool direkt im Webbrowser genutzt werden kann.'
  UNION ALL SELECT 'project-management', 'integration_extensibility', 'api_available', 'Public API', 'Oeffentliche API', 'boolean', 'beneficial', 'optional', 6010, 'Whether a public API is available for programmatic access.', 'Ob eine oeffentliche API fuer programmatischen Zugriff verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'integration_extensibility', 'webhook_support', 'Webhook support', 'Webhook-Unterstuetzung', 'boolean', 'beneficial', 'optional', 6020, 'Whether webhooks are supported for event-driven integrations.', 'Ob Webhooks fuer ereignisgesteuerte Integrationen unterstuetzt werden.'
  UNION ALL SELECT 'project-management', 'integration_extensibility', 'third_party_integrations', 'Third-party integrations', 'Drittanbieter-Integrationen', 'multi_enum', 'informational', 'multi_select', 6030, 'Which third-party services can be integrated.', 'Welche Drittanbieter-Dienste integriert werden koennen.'
  UNION ALL SELECT 'project-management', 'integration_extensibility', 'import_export_formats', 'Import/export formats', 'Import-/Exportformate', 'multi_enum', 'informational', 'multi_select', 6040, 'Which data formats are supported for import and export.', 'Welche Datenformate fuer Import und Export unterstuetzt werden.'
  UNION ALL SELECT 'project-management', 'integration_extensibility', 'plugin_marketplace', 'Plugin or app marketplace', 'Plugin- oder App-Marktplatz', 'boolean', 'beneficial', 'optional', 6050, 'Whether a marketplace for plugins or apps is available.', 'Ob ein Marktplatz fuer Plugins oder Apps verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'admin_permissions', 'role_based_permissions', 'Role-based permissions', 'Rollenbasierte Berechtigungen', 'boolean', 'beneficial', 'optional', 7010, 'Whether role-based access control is supported.', 'Ob rollenbasierte Zugriffskontrolle unterstuetzt wird.'
  UNION ALL SELECT 'project-management', 'admin_permissions', 'sso_support', 'SSO support', 'SSO-Unterstuetzung', 'enum', 'beneficial', 'optional', 7020, 'Which single sign-on protocols are supported.', 'Welche Single-Sign-On-Protokolle unterstuetzt werden.'
  UNION ALL SELECT 'project-management', 'admin_permissions', 'audit_log', 'Audit log', 'Audit-Log', 'boolean', 'beneficial', 'optional', 7030, 'Whether an audit log of user actions is available.', 'Ob ein Audit-Log der Nutzeraktionen verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'admin_permissions', 'team_organization_model', 'Team or organization model', 'Team- oder Organisationsmodell', 'enum', 'informational', 'optional', 7040, 'How teams and organizations are structured within the tool.', 'Wie Teams und Organisationen innerhalb des Tools strukturiert sind.'
  UNION ALL SELECT 'project-management', 'admin_permissions', 'compliance_certifications', 'Compliance certifications', 'Compliance-Zertifizierungen', 'multi_enum', 'beneficial', 'multi_select', 7050, 'Which compliance certifications the tool holds.', 'Welche Compliance-Zertifizierungen das Tool besitzt.'
  UNION ALL SELECT 'project-management', 'deployment_data', 'hosting_model', 'Hosting model', 'Hosting-Modell', 'enum', 'tradeoff', 'must_match', 8010, 'The hosting options available for the tool.', 'Die verfuegbaren Hosting-Optionen fuer das Tool.'
  UNION ALL SELECT 'project-management', 'deployment_data', 'self_hosting_available', 'Self-hosting available', 'Self-Hosting verfuegbar', 'boolean', 'beneficial', 'must_match', 8020, 'Whether the tool can be self-hosted on private infrastructure.', 'Ob das Tool auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'project-management', 'deployment_data', 'data_residency_options', 'Data residency options', 'Optionen fuer Datenresidenz', 'multi_enum', 'tradeoff', 'multi_select', 8030, 'Geographic regions where data can be stored.', 'Geografische Regionen, in denen Daten gespeichert werden koennen.'
  UNION ALL SELECT 'project-management', 'deployment_data', 'data_export_capability', 'Data export capability', 'Datenexportfaehigkeit', 'boolean', 'beneficial', 'optional', 8040, 'Whether project data can be exported for backup or migration.', 'Ob Projektdaten fuer Backup oder Migration exportiert werden koennen.'
  UNION ALL SELECT 'project-management', 'deployment_data', 'backup_model', 'Backup model', 'Backup-Modell', 'enum', 'tradeoff', 'optional', 8050, 'How data backups are handled.', 'Wie Daten-Backups gehandhabt werden.'
  UNION ALL SELECT 'project-management', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfuegbar', 'boolean', 'informational', 'optional', 9010, 'Whether a free tier is available without payment requirements.', 'Ob eine kostenlose Stufe ohne Zahlungsanforderungen verfuegbar ist.'
  UNION ALL SELECT 'project-management', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9020, 'The pricing model used by the tool.', 'Das vom Tool verwendete Preismodell.'
  UNION ALL SELECT 'project-management', 'pricing_fit', 'team_size_limit', 'Team size limit (free tier)', 'Teamgroessenlimit (kostenlose Stufe)', 'enum', 'informational', 'optional', 9030, 'The team size limit included in the free tier.', 'Das Teamgroessenlimit in der kostenlosen Stufe.'
  UNION ALL SELECT 'project-management', 'pricing_fit', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 9040, 'The openness model of the tool source code.', 'Das Offenheitsmodell des Tool-Quellcodes.'
  UNION ALL SELECT 'project-management', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Common user profiles or use cases the tool is well suited for.', 'Typische Nutzerprofile oder Anwendungsfaelle, fuer die das Tool gut geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'project-management' AS category_id, 'task_hierarchy' AS criterion_key, 'flat' AS option_key, 'Flat' AS label_en, 'Flach' AS label_de, 'tradeoff' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'project-management', 'task_hierarchy', 'one_level', 'One level', 'Eine Ebene', 'neutral', 20
  UNION ALL SELECT 'project-management', 'task_hierarchy', 'multi_level', 'Multi-level', 'Mehrere Ebenen', 'neutral', 30
  UNION ALL SELECT 'project-management', 'task_hierarchy', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 40
  UNION ALL SELECT 'project-management', 'supported_platforms', 'web', 'Web', 'Web', 'neutral', 10
  UNION ALL SELECT 'project-management', 'supported_platforms', 'windows', 'Windows', 'Windows', 'neutral', 20
  UNION ALL SELECT 'project-management', 'supported_platforms', 'macos', 'macOS', 'macOS', 'neutral', 30
  UNION ALL SELECT 'project-management', 'supported_platforms', 'linux', 'Linux', 'Linux', 'neutral', 40
  UNION ALL SELECT 'project-management', 'supported_platforms', 'ios', 'iOS', 'iOS', 'neutral', 50
  UNION ALL SELECT 'project-management', 'supported_platforms', 'android', 'Android', 'Android', 'neutral', 60
  UNION ALL SELECT 'project-management', 'third_party_integrations', 'slack', 'Slack', 'Slack', 'neutral', 10
  UNION ALL SELECT 'project-management', 'third_party_integrations', 'github', 'GitHub', 'GitHub', 'neutral', 20
  UNION ALL SELECT 'project-management', 'third_party_integrations', 'gitlab', 'GitLab', 'GitLab', 'neutral', 30
  UNION ALL SELECT 'project-management', 'third_party_integrations', 'google_workspace', 'Google Workspace', 'Google Workspace', 'neutral', 40
  UNION ALL SELECT 'project-management', 'third_party_integrations', 'microsoft_365', 'Microsoft 365', 'Microsoft 365', 'neutral', 50
  UNION ALL SELECT 'project-management', 'third_party_integrations', 'zapier', 'Zapier', 'Zapier', 'neutral', 60
  UNION ALL SELECT 'project-management', 'import_export_formats', 'csv', 'CSV', 'CSV', 'neutral', 10
  UNION ALL SELECT 'project-management', 'import_export_formats', 'json', 'JSON', 'JSON', 'neutral', 20
  UNION ALL SELECT 'project-management', 'import_export_formats', 'xml', 'XML', 'XML', 'neutral', 30
  UNION ALL SELECT 'project-management', 'import_export_formats', 'jira_import', 'Jira import', 'Jira-Import', 'neutral', 40
  UNION ALL SELECT 'project-management', 'import_export_formats', 'trello_import', 'Trello import', 'Trello-Import', 'neutral', 50
  UNION ALL SELECT 'project-management', 'sso_support', 'saml', 'SAML', 'SAML', 'positive', 10
  UNION ALL SELECT 'project-management', 'sso_support', 'oauth', 'OAuth', 'OAuth', 'neutral', 20
  UNION ALL SELECT 'project-management', 'sso_support', 'both_saml_oauth', 'SAML and OAuth', 'SAML und OAuth', 'positive', 30
  UNION ALL SELECT 'project-management', 'sso_support', 'none', 'None', 'Keine', 'tradeoff', 40
  UNION ALL SELECT 'project-management', 'team_organization_model', 'flat_team', 'Flat team', 'Flaches Team', 'neutral', 10
  UNION ALL SELECT 'project-management', 'team_organization_model', 'multi_team', 'Multi-team', 'Mehrere Teams', 'neutral', 20
  UNION ALL SELECT 'project-management', 'team_organization_model', 'organization_hierarchy', 'Organization hierarchy', 'Organisationshierarchie', 'neutral', 30
  UNION ALL SELECT 'project-management', 'team_organization_model', 'enterprise_multi_org', 'Enterprise multi-org', 'Enterprise Multi-Organisation', 'neutral', 40
  UNION ALL SELECT 'project-management', 'compliance_certifications', 'soc2', 'SOC 2', 'SOC 2', 'neutral', 10
  UNION ALL SELECT 'project-management', 'compliance_certifications', 'iso_27001', 'ISO 27001', 'ISO 27001', 'neutral', 20
  UNION ALL SELECT 'project-management', 'compliance_certifications', 'gdpr_ready', 'GDPR ready', 'DSGVO-konform', 'neutral', 30
  UNION ALL SELECT 'project-management', 'compliance_certifications', 'hipaa', 'HIPAA', 'HIPAA', 'neutral', 40
  UNION ALL SELECT 'project-management', 'hosting_model', 'cloud_only', 'Cloud only', 'Nur Cloud', 'neutral', 10
  UNION ALL SELECT 'project-management', 'hosting_model', 'self_hosted_only', 'Self-hosted only', 'Nur Self-hosted', 'neutral', 20
  UNION ALL SELECT 'project-management', 'hosting_model', 'cloud_and_self_hosted', 'Cloud and self-hosted', 'Cloud und Self-hosted', 'positive', 30
  UNION ALL SELECT 'project-management', 'data_residency_options', 'eu', 'EU', 'EU', 'neutral', 10
  UNION ALL SELECT 'project-management', 'data_residency_options', 'us', 'US', 'US', 'neutral', 20
  UNION ALL SELECT 'project-management', 'data_residency_options', 'asia_pacific', 'Asia-Pacific', 'Asien-Pazifik', 'neutral', 30
  UNION ALL SELECT 'project-management', 'data_residency_options', 'self_hosted', 'Self-hosted', 'Self-hosted', 'neutral', 40
  UNION ALL SELECT 'project-management', 'backup_model', 'automatic_included', 'Automatic included', 'Automatisch enthalten', 'positive', 10
  UNION ALL SELECT 'project-management', 'backup_model', 'manual_export', 'Manual export', 'Manueller Export', 'neutral', 20
  UNION ALL SELECT 'project-management', 'backup_model', 'self_managed', 'Self-managed', 'Selbstverwaltet', 'neutral', 30
  UNION ALL SELECT 'project-management', 'backup_model', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'project-management', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'neutral', 10
  UNION ALL SELECT 'project-management', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'project-management', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'project-management', 'pricing_model', 'one_time_license', 'One-time license', 'Einmallizenz', 'neutral', 40
  UNION ALL SELECT 'project-management', 'pricing_model', 'donation_based', 'Donation based', 'Spendenbasiert', 'neutral', 50
  UNION ALL SELECT 'project-management', 'team_size_limit', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'project-management', 'team_size_limit', 'over_50', 'Over 50', 'Ueber 50', 'neutral', 20
  UNION ALL SELECT 'project-management', 'team_size_limit', '10_to_50', '10-50', '10-50', 'neutral', 30
  UNION ALL SELECT 'project-management', 'team_size_limit', 'under_10', 'Under 10', 'Unter 10', 'neutral', 40
  UNION ALL SELECT 'project-management', 'team_size_limit', 'no_free_tier', 'No free tier', 'Keine kostenlose Stufe', 'tradeoff', 50
  UNION ALL SELECT 'project-management', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'project-management', 'source_model', 'source_available', 'Source available', 'Quellcode verfuegbar', 'neutral', 20
  UNION ALL SELECT 'project-management', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'tradeoff', 30
  UNION ALL SELECT 'project-management', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'project-management', 'fit_profiles', 'small_team', 'Small team', 'Kleines Team', 'neutral', 10
  UNION ALL SELECT 'project-management', 'fit_profiles', 'startup', 'Startup', 'Startup', 'neutral', 20
  UNION ALL SELECT 'project-management', 'fit_profiles', 'enterprise', 'Enterprise', 'Unternehmen', 'neutral', 30
  UNION ALL SELECT 'project-management', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 40
  UNION ALL SELECT 'project-management', 'fit_profiles', 'agile_scrum', 'Agile / Scrum', 'Agile / Scrum', 'neutral', 50
  UNION ALL SELECT 'project-management', 'fit_profiles', 'kanban', 'Kanban', 'Kanban', 'neutral', 60
  UNION ALL SELECT 'project-management', 'fit_profiles', 'personal', 'Personal', 'Persoenlich', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'project-management'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'project-management'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('022-project-management-matrix-criteria');
