-- Migration 033: Define Version Control Services category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('version-control', 'platform_model', 'Platform & Deployment', 'Plattform & Bereitstellung', 'Hosting model, self-hosting, federation, and deployment options.', 'Hosting-Modell, Self-Hosting, Föderation und Bereitstellungsoptionen.', 100),
  ('version-control', 'repository_features', 'Repository & Code Management', 'Repository & Codeverwaltung', 'Core version control features, repository limits, and code review tools.', 'Kernfunktionen der Versionsverwaltung, Repository-Limits und Code-Review-Tools.', 200),
  ('version-control', 'collaboration_workflow', 'Collaboration & Workflow', 'Zusammenarbeit & Workflow', 'Issue tracking, project management, CI/CD, and team collaboration.', 'Issue-Tracking, Projektmanagement, CI/CD und Teamzusammenarbeit.', 300),
  ('version-control', 'ecosystem_integration', 'Ecosystem & Integration', 'Ökosystem & Integration', 'Package registries, APIs, webhooks, and third-party integrations.', 'Paketregister, APIs, Webhooks und Drittanbieter-Integrationen.', 400),
  ('version-control', 'data_protection_privacy', 'Data Protection & Privacy', 'Datenschutz & Privatsphäre', 'Data processing location, GDPR compliance, data portability, and privacy controls.', 'Datenverarbeitungsstandort, DSGVO-Konformität, Datenportabilität und Datenschutzkontrollen.', 500),
  ('version-control', 'security_access', 'Security & Access', 'Sicherheit & Zugang', 'Authentication methods, access controls, signing, and vulnerability scanning.', 'Authentifizierungsmethoden, Zugriffskontrollen, Signierung und Schwachstellenscanning.', 600),
  ('version-control', 'openness_governance', 'Openness & Governance', 'Offenheit & Governance', 'Source code model, license type, governance, and community contributions.', 'Quellcode-Modell, Lizenztyp, Governance und Community-Beiträge.', 700),
  ('version-control', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier, storage quotas, and target user profiles.', 'Preismodell, kostenlose Stufe, Speicherkontingente und Zielgruppen-Nutzerprofile.', 800);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'version-control' AS category_id, 'platform_model' AS group_key, 'hosting_model' AS criterion_key, 'Hosting model' AS label_en, 'Hosting-Modell' AS label_de, 'enum' AS value_type, 'tradeoff' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Whether the service is hosted (SaaS), self-hosted, or both.' AS help_text_en, 'Ob der Dienst gehostet (SaaS), selbst gehostet oder beides ist.' AS help_text_de
  UNION ALL SELECT 'version-control', 'platform_model', 'self_hosting_available', 'Self-hosting available', 'Self-Hosting verfügbar', 'boolean', 'tradeoff', 'optional', 1020, 'Whether the platform can be self-hosted on your own infrastructure.', 'Ob die Plattform auf eigener Infrastruktur selbst gehostet werden kann.'
  UNION ALL SELECT 'version-control', 'platform_model', 'federation_support', 'Federation support', 'Föderationsunterstützung', 'boolean', 'informational', 'optional', 1030, 'Whether the platform supports federation via ForgeFed or ActivityPub.', 'Ob die Plattform Föderation über ForgeFed oder ActivityPub unterstützt.'
  UNION ALL SELECT 'version-control', 'platform_model', 'container_deployment', 'Container deployment support', 'Container-Bereitstellungsunterstützung', 'boolean', 'informational', 'optional', 1040, 'Whether Docker or Podman container deployment is supported.', 'Ob Docker- oder Podman-Container-Bereitstellung unterstützt wird.'
  UNION ALL SELECT 'version-control', 'platform_model', 'migration_import_tools', 'Migration / import tools', 'Migrations- / Import-Tools', 'boolean', 'beneficial', 'optional', 1050, 'Whether tools to import repositories from other platforms are available.', 'Ob Tools zum Importieren von Repositories von anderen Plattformen verfügbar sind.'
  UNION ALL SELECT 'version-control', 'repository_features', 'vcs_backend', 'VCS backend', 'VCS-Backend', 'enum', 'informational', 'optional', 2010, 'Which version control system the platform uses.', 'Welches Versionskontrollsystem die Plattform verwendet.'
  UNION ALL SELECT 'version-control', 'repository_features', 'repository_size_limit', 'Repository size limit', 'Repository-Größenlimit', 'enum', 'tradeoff', 'optional', 2020, 'Maximum allowed repository size.', 'Maximal erlaubte Repository-Größe.'
  UNION ALL SELECT 'version-control', 'repository_features', 'lfs_support', 'Git LFS support', 'Git-LFS-Unterstützung', 'boolean', 'informational', 'optional', 2030, 'Whether Git Large File Storage is supported.', 'Ob Git Large File Storage unterstützt wird.'
  UNION ALL SELECT 'version-control', 'repository_features', 'code_review_tools', 'Built-in code review', 'Integriertes Code-Review', 'boolean', 'informational', 'optional', 2040, 'Whether built-in pull/merge request review workflows are available.', 'Ob integrierte Pull-/Merge-Request-Review-Workflows verfügbar sind.'
  UNION ALL SELECT 'version-control', 'repository_features', 'code_search', 'Code search', 'Code-Suche', 'boolean', 'informational', 'optional', 2050, 'Whether cross-repository code search is available.', 'Ob repositoryübergreifende Code-Suche verfügbar ist.'
  UNION ALL SELECT 'version-control', 'repository_features', 'branch_protection', 'Branch protection rules', 'Branch-Schutzregeln', 'boolean', 'beneficial', 'optional', 2060, 'Whether branch protection rules can be configured.', 'Ob Branch-Schutzregeln konfiguriert werden können.'
  UNION ALL SELECT 'version-control', 'collaboration_workflow', 'issue_tracking', 'Built-in issue tracking', 'Integriertes Issue-Tracking', 'boolean', 'informational', 'optional', 3010, 'Whether a built-in issue tracking system is available.', 'Ob ein integriertes Issue-Tracking-System verfügbar ist.'
  UNION ALL SELECT 'version-control', 'collaboration_workflow', 'project_boards', 'Project boards / kanban', 'Projektboards / Kanban', 'boolean', 'informational', 'optional', 3020, 'Whether project boards or kanban views are available.', 'Ob Projektboards oder Kanban-Ansichten verfügbar sind.'
  UNION ALL SELECT 'version-control', 'collaboration_workflow', 'ci_cd_builtin', 'Built-in CI/CD', 'Integriertes CI/CD', 'boolean', 'informational', 'optional', 3030, 'Whether built-in continuous integration and deployment is available.', 'Ob integrierte kontinuierliche Integration und Bereitstellung verfügbar ist.'
  UNION ALL SELECT 'version-control', 'collaboration_workflow', 'wiki_support', 'Built-in wiki / documentation', 'Integriertes Wiki / Dokumentation', 'boolean', 'informational', 'optional', 3040, 'Whether a built-in wiki or documentation system is available.', 'Ob ein integriertes Wiki- oder Dokumentationssystem verfügbar ist.'
  UNION ALL SELECT 'version-control', 'collaboration_workflow', 'discussion_forum', 'Discussion / forum feature', 'Diskussions- / Forumfunktion', 'boolean', 'informational', 'optional', 3050, 'Whether a discussion or forum feature beyond issue tracking is available.', 'Ob eine Diskussions- oder Forumfunktion über Issue-Tracking hinaus verfügbar ist.'
  UNION ALL SELECT 'version-control', 'collaboration_workflow', 'organization_support', 'Organization / team management', 'Organisations- / Teamverwaltung', 'boolean', 'informational', 'optional', 3060, 'Whether organization and team management features are available.', 'Ob Organisations- und Teamverwaltungsfunktionen verfügbar sind.'
  UNION ALL SELECT 'version-control', 'ecosystem_integration', 'package_registry', 'Package registry', 'Paketregister', 'multi_enum', 'informational', 'multi_select', 4010, 'Which package registry types are supported.', 'Welche Paketregistertypen unterstützt werden.'
  UNION ALL SELECT 'version-control', 'ecosystem_integration', 'api_available', 'API available', 'API verfügbar', 'boolean', 'beneficial', 'optional', 4020, 'Whether a programmatic API is available for automation.', 'Ob eine programmatische API für Automatisierung verfügbar ist.'
  UNION ALL SELECT 'version-control', 'ecosystem_integration', 'webhook_support', 'Webhook support', 'Webhook-Unterstützung', 'boolean', 'informational', 'optional', 4030, 'Whether webhook support for event-driven integrations is available.', 'Ob Webhook-Unterstützung für ereignisgesteuerte Integrationen verfügbar ist.'
  UNION ALL SELECT 'version-control', 'ecosystem_integration', 'third_party_integrations', 'Third-party integrations', 'Drittanbieter-Integrationen', 'enum', 'informational', 'optional', 4040, 'Size of the third-party integration ecosystem.', 'Größe des Drittanbieter-Integrations-Ökosystems.'
  UNION ALL SELECT 'version-control', 'ecosystem_integration', 'pages_static_hosting', 'Static site hosting (Pages)', 'Statisches Webhosting (Pages)', 'boolean', 'informational', 'optional', 4050, 'Whether built-in static site hosting is available.', 'Ob integriertes statisches Webhosting verfügbar ist.'
  UNION ALL SELECT 'version-control', 'data_protection_privacy', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 5010, 'Where code and metadata are stored and processed.', 'Wo Code und Metadaten gespeichert und verarbeitet werden.'
  UNION ALL SELECT 'version-control', 'data_protection_privacy', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfügbar', 'boolean', 'informational', 'optional', 5020, 'Whether a GDPR data processing agreement is available.', 'Ob ein DSGVO-Auftragsverarbeitungsvertrag verfügbar ist.'
  UNION ALL SELECT 'version-control', 'data_protection_privacy', 'data_portability', 'Data portability', 'Datenportabilität', 'boolean', 'beneficial', 'optional', 5030, 'Whether all data including repositories, issues, and wikis can be exported.', 'Ob alle Daten einschließlich Repositories, Issues und Wikis exportiert werden können.'
  UNION ALL SELECT 'version-control', 'data_protection_privacy', 'telemetry_opt_out', 'Telemetry opt-out available', 'Telemetrie-Abmeldung verfügbar', 'boolean', 'informational', 'optional', 5040, 'Whether telemetry and usage tracking can be disabled.', 'Ob Telemetrie und Nutzungsverfolgung deaktiviert werden können.'
  UNION ALL SELECT 'version-control', 'data_protection_privacy', 'private_repos_available', 'Private repositories available', 'Private Repositories verfügbar', 'boolean', 'informational', 'optional', 5050, 'Whether private repositories are available.', 'Ob private Repositories verfügbar sind.'
  UNION ALL SELECT 'version-control', 'security_access', 'two_factor_auth', 'Two-factor authentication', 'Zwei-Faktor-Authentifizierung', 'boolean', 'beneficial', 'optional', 6010, 'Whether two-factor authentication is supported.', 'Ob Zwei-Faktor-Authentifizierung unterstützt wird.'
  UNION ALL SELECT 'version-control', 'security_access', 'ssh_key_auth', 'SSH key authentication', 'SSH-Schlüssel-Authentifizierung', 'boolean', 'beneficial', 'optional', 6020, 'Whether SSH key authentication for repository access is supported.', 'Ob SSH-Schlüssel-Authentifizierung für den Repository-Zugriff unterstützt wird.'
  UNION ALL SELECT 'version-control', 'security_access', 'commit_signing', 'Commit signing support', 'Commit-Signierungsunterstützung', 'boolean', 'informational', 'optional', 6030, 'Whether GPG or SSH commit signing and verification is supported.', 'Ob GPG- oder SSH-Commit-Signierung und -Verifizierung unterstützt wird.'
  UNION ALL SELECT 'version-control', 'security_access', 'access_control_model', 'Access control model', 'Zugriffskontrollmodell', 'enum', 'informational', 'optional', 6040, 'Granularity of the permission and access control system.', 'Granularität des Berechtigungs- und Zugriffskontrollsystems.'
  UNION ALL SELECT 'version-control', 'security_access', 'dependency_scanning', 'Dependency vulnerability scanning', 'Abhängigkeits-Schwachstellenscanning', 'boolean', 'informational', 'optional', 6050, 'Whether automated dependency vulnerability scanning is available.', 'Ob automatisiertes Abhängigkeits-Schwachstellenscanning verfügbar ist.'
  UNION ALL SELECT 'version-control', 'openness_governance', 'source_code_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 7010, 'Whether the platform source code is open source, source available, or proprietary.', 'Ob der Plattform-Quellcode quelloffen, quelleinsehbar oder proprietär ist.'
  UNION ALL SELECT 'version-control', 'openness_governance', 'license_type', 'License type', 'Lizenztyp', 'enum', 'informational', 'optional', 7020, 'The software license under which the platform is distributed.', 'Die Softwarelizenz, unter der die Plattform vertrieben wird.'
  UNION ALL SELECT 'version-control', 'openness_governance', 'governance_model', 'Governance model', 'Governance-Modell', 'enum', 'informational', 'optional', 7030, 'How the project is governed and decisions are made.', 'Wie das Projekt verwaltet wird und Entscheidungen getroffen werden.'
  UNION ALL SELECT 'version-control', 'openness_governance', 'community_contributions', 'Community contributions accepted', 'Community-Beiträge akzeptiert', 'boolean', 'informational', 'optional', 7040, 'Whether external community contributions are accepted.', 'Ob externe Community-Beiträge akzeptiert werden.'
  UNION ALL SELECT 'version-control', 'openness_governance', 'forge_software', 'Forge software used', 'Verwendete Forge-Software', 'enum', 'informational', 'optional', 7050, 'The underlying forge software the platform runs on.', 'Die zugrundeliegende Forge-Software, auf der die Plattform läuft.'
  UNION ALL SELECT 'version-control', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 8010, 'How the service is priced.', 'Wie der Dienst bepreist wird.'
  UNION ALL SELECT 'version-control', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfügbar', 'boolean', 'informational', 'optional', 8020, 'Whether a free tier is available without payment.', 'Ob eine kostenlose Stufe ohne Bezahlung verfügbar ist.'
  UNION ALL SELECT 'version-control', 'pricing_fit', 'storage_quota', 'Storage quota (free tier)', 'Speicherkontingent (kostenlose Stufe)', 'enum', 'tradeoff', 'optional', 8030, 'How much storage is included in the free tier.', 'Wie viel Speicher in der kostenlosen Stufe enthalten ist.'
  UNION ALL SELECT 'version-control', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 8040, 'Target user profiles the platform is designed for.', 'Zielgruppen-Nutzerprofile, für die die Plattform konzipiert ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'version-control' AS category_id, 'hosting_model' AS criterion_key, 'saas' AS option_key, 'SaaS (hosted)' AS label_en, 'SaaS (gehostet)' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'version-control', 'hosting_model', 'self_hosted', 'Self-hosted only', 'Nur selbst-gehostet', 'neutral', 20
  UNION ALL SELECT 'version-control', 'hosting_model', 'hybrid', 'Hybrid (SaaS + self-hosted)', 'Hybrid (SaaS + selbst-gehostet)', 'neutral', 30
  UNION ALL SELECT 'version-control', 'hosting_model', 'open_source_saas', 'Open-source with hosted option', 'Quelloffen mit gehosteter Option', 'positive', 40
  UNION ALL SELECT 'version-control', 'vcs_backend', 'git', 'Git', 'Git', 'neutral', 10
  UNION ALL SELECT 'version-control', 'vcs_backend', 'mercurial', 'Mercurial', 'Mercurial', 'neutral', 20
  UNION ALL SELECT 'version-control', 'vcs_backend', 'svn', 'Subversion (SVN)', 'Subversion (SVN)', 'neutral', 30
  UNION ALL SELECT 'version-control', 'vcs_backend', 'multi_vcs', 'Multiple VCS supported', 'Mehrere VCS unterstützt', 'neutral', 40
  UNION ALL SELECT 'version-control', 'repository_size_limit', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'version-control', 'repository_size_limit', 'generous', 'Generous (>5 GB)', 'Großzügig (>5 GB)', 'neutral', 20
  UNION ALL SELECT 'version-control', 'repository_size_limit', 'moderate', 'Moderate (1-5 GB)', 'Moderat (1-5 GB)', 'neutral', 30
  UNION ALL SELECT 'version-control', 'repository_size_limit', 'restrictive', 'Restrictive (<1 GB)', 'Restriktiv (<1 GB)', 'warning', 40
  UNION ALL SELECT 'version-control', 'package_registry', 'npm', 'npm', 'npm', 'neutral', 10
  UNION ALL SELECT 'version-control', 'package_registry', 'maven', 'Maven', 'Maven', 'neutral', 20
  UNION ALL SELECT 'version-control', 'package_registry', 'pypi', 'PyPI', 'PyPI', 'neutral', 30
  UNION ALL SELECT 'version-control', 'package_registry', 'nuget', 'NuGet', 'NuGet', 'neutral', 40
  UNION ALL SELECT 'version-control', 'package_registry', 'container', 'Container (OCI/Docker)', 'Container (OCI/Docker)', 'neutral', 50
  UNION ALL SELECT 'version-control', 'package_registry', 'generic', 'Generic packages', 'Generische Pakete', 'neutral', 60
  UNION ALL SELECT 'version-control', 'package_registry', 'none_available', 'Not available', 'Nicht verfügbar', 'neutral', 70
  UNION ALL SELECT 'version-control', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'version-control', 'data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primär, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'version-control', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'version-control', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 40
  UNION ALL SELECT 'version-control', 'access_control_model', 'fine_grained', 'Fine-grained (per-branch, per-role)', 'Feinkörnig (pro Branch, pro Rolle)', 'positive', 10
  UNION ALL SELECT 'version-control', 'access_control_model', 'role_based', 'Role-based (owner/maintainer/developer)', 'Rollenbasiert (Eigentümer/Maintainer/Entwickler)', 'neutral', 20
  UNION ALL SELECT 'version-control', 'access_control_model', 'basic', 'Basic (read/write)', 'Einfach (Lesen/Schreiben)', 'neutral', 30
  UNION ALL SELECT 'version-control', 'third_party_integrations', 'large', 'Large ecosystem (50+ integrations)', 'Großes Ökosystem (50+ Integrationen)', 'positive', 10
  UNION ALL SELECT 'version-control', 'third_party_integrations', 'medium', 'Medium ecosystem (10-50)', 'Mittleres Ökosystem (10-50)', 'neutral', 20
  UNION ALL SELECT 'version-control', 'third_party_integrations', 'small', 'Small ecosystem (<10)', 'Kleines Ökosystem (<10)', 'neutral', 30
  UNION ALL SELECT 'version-control', 'third_party_integrations', 'api_only', 'API only (no marketplace)', 'Nur API (kein Marktplatz)', 'neutral', 40
  UNION ALL SELECT 'version-control', 'source_code_model', 'open_source', 'Open source', 'Quelloffen', 'positive', 10
  UNION ALL SELECT 'version-control', 'source_code_model', 'source_available', 'Source available', 'Quelleinsehbar', 'neutral', 20
  UNION ALL SELECT 'version-control', 'source_code_model', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 30
  UNION ALL SELECT 'version-control', 'source_code_model', 'open_core', 'Open core', 'Open Core', 'tradeoff', 40
  UNION ALL SELECT 'version-control', 'license_type', 'mit', 'MIT', 'MIT', 'neutral', 10
  UNION ALL SELECT 'version-control', 'license_type', 'gpl', 'GPL', 'GPL', 'neutral', 20
  UNION ALL SELECT 'version-control', 'license_type', 'agpl', 'AGPL', 'AGPL', 'neutral', 30
  UNION ALL SELECT 'version-control', 'license_type', 'apache', 'Apache 2.0', 'Apache 2.0', 'neutral', 40
  UNION ALL SELECT 'version-control', 'license_type', 'proprietary', 'Proprietary', 'Proprietär', 'warning', 50
  UNION ALL SELECT 'version-control', 'license_type', 'bsl', 'BSL / SSPL', 'BSL / SSPL', 'tradeoff', 60
  UNION ALL SELECT 'version-control', 'license_type', 'other_osi', 'Other OSI-approved', 'Andere OSI-genehmigte', 'neutral', 70
  UNION ALL SELECT 'version-control', 'governance_model', 'community', 'Community-driven', 'Community-gesteuert', 'positive', 10
  UNION ALL SELECT 'version-control', 'governance_model', 'foundation', 'Foundation-backed', 'Stiftungsgestützt', 'positive', 20
  UNION ALL SELECT 'version-control', 'governance_model', 'corporate', 'Corporate-backed', 'Unternehmensgestützt', 'neutral', 30
  UNION ALL SELECT 'version-control', 'governance_model', 'single_vendor', 'Single vendor', 'Einzelanbieter', 'neutral', 40
  UNION ALL SELECT 'version-control', 'forge_software', 'forgejo', 'Forgejo', 'Forgejo', 'neutral', 10
  UNION ALL SELECT 'version-control', 'forge_software', 'gitea', 'Gitea', 'Gitea', 'neutral', 20
  UNION ALL SELECT 'version-control', 'forge_software', 'gitlab_ce', 'GitLab CE', 'GitLab CE', 'neutral', 30
  UNION ALL SELECT 'version-control', 'forge_software', 'custom', 'Custom / proprietary', 'Benutzerdefiniert / proprietär', 'neutral', 40
  UNION ALL SELECT 'version-control', 'pricing_model', 'free_open_source', 'Free / open source', 'Kostenlos / quelloffen', 'positive', 10
  UNION ALL SELECT 'version-control', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 20
  UNION ALL SELECT 'version-control', 'pricing_model', 'subscription', 'Subscription', 'Abonnement', 'neutral', 30
  UNION ALL SELECT 'version-control', 'pricing_model', 'donation_based', 'Donation-based', 'Spendenbasiert', 'neutral', 40
  UNION ALL SELECT 'version-control', 'storage_quota', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'version-control', 'storage_quota', 'generous', 'Generous (>5 GB)', 'Großzügig (>5 GB)', 'neutral', 20
  UNION ALL SELECT 'version-control', 'storage_quota', 'moderate', 'Moderate (1-5 GB)', 'Moderat (1-5 GB)', 'neutral', 30
  UNION ALL SELECT 'version-control', 'storage_quota', 'limited', 'Limited (<1 GB)', 'Begrenzt (<1 GB)', 'warning', 40
  UNION ALL SELECT 'version-control', 'fit_profiles', 'open_source_project', 'Open-source projects', 'Open-Source-Projekte', 'neutral', 10
  UNION ALL SELECT 'version-control', 'fit_profiles', 'solo_developer', 'Solo developer', 'Einzelentwickler', 'neutral', 20
  UNION ALL SELECT 'version-control', 'fit_profiles', 'small_team', 'Small team', 'Kleines Team', 'neutral', 30
  UNION ALL SELECT 'version-control', 'fit_profiles', 'enterprise', 'Enterprise', 'Großunternehmen', 'neutral', 40
  UNION ALL SELECT 'version-control', 'fit_profiles', 'education', 'Education', 'Bildung', 'neutral', 50
  UNION ALL SELECT 'version-control', 'fit_profiles', 'nonprofit', 'Non-profit / NGO', 'Gemeinnützig / NGO', 'neutral', 60
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'version-control'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'version-control'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('033-version-control-matrix-criteria');
