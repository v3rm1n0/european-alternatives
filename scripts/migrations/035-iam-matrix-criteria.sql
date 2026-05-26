-- Migration 035: Define Identity & Access Management category matrix criteria metadata.

INSERT IGNORE INTO `matrix_criterion_groups`
  (`category_id`, `group_key`, `label_en`, `label_de`, `description_en`, `description_de`, `sort_order`)
VALUES
  ('iam', 'auth_protocols_standards', 'Authentication Protocols & Standards', 'Authentifizierungsprotokolle & Standards', 'Supported authentication protocols, identity standards, and directory integrations.', 'Unterstuetzte Authentifizierungsprotokolle, Identitaetsstandards und Verzeichnisintegrationen.', 100),
  ('iam', 'mfa_verification', 'Multi-Factor Authentication', 'Multi-Faktor-Authentifizierung', 'Multi-factor authentication capabilities, methods, and enforcement options.', 'Multi-Faktor-Authentifizierungsfaehigkeiten, Methoden und Durchsetzungsoptionen.', 200),
  ('iam', 'user_management', 'User Management', 'Benutzerverwaltung', 'User registration, lifecycle management, federation, and account recovery.', 'Benutzerregistrierung, Lebenszyklusverwaltung, Foederation und Kontowiederherstellung.', 300),
  ('iam', 'sso_federation', 'SSO & Federation', 'SSO & Federation', 'Single sign-on models, identity provider brokering, and session management.', 'Single-Sign-On-Modelle, Identity-Provider-Vermittlung und Sitzungsverwaltung.', 400),
  ('iam', 'access_control', 'Access Control', 'Zugriffskontrolle', 'Access control models, permissions, multi-tenancy, and delegation.', 'Zugriffskontrollmodelle, Berechtigungen, Mandantenfaehigkeit und Delegation.', 500),
  ('iam', 'deployment_operations', 'Deployment & Operations', 'Bereitstellung & Betrieb', 'Deployment models, container support, databases, and scaling capabilities.', 'Bereitstellungsmodelle, Container-Unterstuetzung, Datenbanken und Skalierungsfaehigkeiten.', 600),
  ('iam', 'customization_developer', 'Customization & Developer Experience', 'Anpassung & Entwicklererfahrung', 'Login theming, authentication flow customization, APIs, SDKs, and documentation.', 'Login-Theming, Authentifizierungsfluss-Anpassung, APIs, SDKs und Dokumentation.', 700),
  ('iam', 'security_compliance', 'Security & Compliance', 'Sicherheit & Compliance', 'Security features, audit logging, compliance certifications, and source code model.', 'Sicherheitsfunktionen, Audit-Protokollierung, Compliance-Zertifizierungen und Quellcode-Modell.', 800),
  ('iam', 'pricing_fit', 'Pricing & Fit', 'Preise & Eignung', 'Pricing model, free tier options, and target user profiles.', 'Preismodell, kostenlose Stufen und Zielgruppen-Nutzerprofile.', 900);

INSERT IGNORE INTO `matrix_criteria`
  (`category_id`, `group_id`, `criterion_key`, `label_en`, `label_de`, `value_type`, `semantics`, `filter_mode`, `sort_order`, `help_text_en`, `help_text_de`)
SELECT d.category_id, g.id, d.criterion_key, d.label_en, d.label_de, d.value_type, d.semantics, d.filter_mode, d.sort_order, d.help_text_en, d.help_text_de
FROM (
  SELECT 'iam' AS category_id, 'auth_protocols_standards' AS group_key, 'oidc_support' AS criterion_key, 'OpenID Connect support' AS label_en, 'OpenID-Connect-Unterstuetzung' AS label_de, 'boolean' AS value_type, 'beneficial' AS semantics, 'must_match' AS filter_mode, 1010 AS sort_order, 'Whether the product supports OpenID Connect for authentication and identity federation.' AS help_text_en, 'Ob das Produkt OpenID Connect fuer Authentifizierung und Identitaetsfoederation unterstuetzt.' AS help_text_de
  UNION ALL SELECT 'iam', 'auth_protocols_standards', 'saml_support', 'SAML 2.0 support', 'SAML-2.0-Unterstuetzung', 'boolean', 'beneficial', 'must_match', 1020, 'Whether the product supports SAML 2.0 for enterprise single sign-on.', 'Ob das Produkt SAML 2.0 fuer Enterprise-Single-Sign-On unterstuetzt.'
  UNION ALL SELECT 'iam', 'auth_protocols_standards', 'oauth2_support', 'OAuth 2.0 support', 'OAuth-2.0-Unterstuetzung', 'boolean', 'beneficial', 'optional', 1030, 'Whether the product supports OAuth 2.0 for authorization flows.', 'Ob das Produkt OAuth 2.0 fuer Autorisierungsablaeufe unterstuetzt.'
  UNION ALL SELECT 'iam', 'auth_protocols_standards', 'ldap_support', 'LDAP / AD integration', 'LDAP-/AD-Integration', 'boolean', 'informational', 'optional', 1040, 'Whether the product integrates with LDAP directories or Active Directory.', 'Ob das Produkt mit LDAP-Verzeichnissen oder Active Directory integriert werden kann.'
  UNION ALL SELECT 'iam', 'auth_protocols_standards', 'scim_support', 'SCIM provisioning support', 'SCIM-Bereitstellungsunterstuetzung', 'boolean', 'beneficial', 'optional', 1050, 'Whether the product supports SCIM for automated user provisioning and deprovisioning.', 'Ob das Produkt SCIM fuer automatisierte Benutzerbereitstellung und -deprovisionierung unterstuetzt.'
  UNION ALL SELECT 'iam', 'auth_protocols_standards', 'radius_support', 'RADIUS support', 'RADIUS-Unterstuetzung', 'boolean', 'informational', 'optional', 1060, 'Whether the product supports RADIUS for network access authentication.', 'Ob das Produkt RADIUS fuer Netzwerkzugangsauthentifizierung unterstuetzt.'
  UNION ALL SELECT 'iam', 'auth_protocols_standards', 'passkey_webauthn', 'Passkey / WebAuthn support', 'Passkey-/WebAuthn-Unterstuetzung', 'boolean', 'beneficial', 'optional', 1070, 'Whether the product supports passkeys and WebAuthn for passwordless authentication.', 'Ob das Produkt Passkeys und WebAuthn fuer passwortlose Authentifizierung unterstuetzt.'
  UNION ALL SELECT 'iam', 'mfa_verification', 'builtin_mfa', 'Built-in MFA support', 'Integrierte MFA-Unterstuetzung', 'boolean', 'beneficial', 'must_match', 2010, 'Whether the product includes built-in multi-factor authentication.', 'Ob das Produkt integrierte Multi-Faktor-Authentifizierung enthaelt.'
  UNION ALL SELECT 'iam', 'mfa_verification', 'mfa_methods', 'Supported MFA methods', 'Unterstuetzte MFA-Methoden', 'multi_enum', 'informational', 'multi_select', 2020, 'Which second-factor methods are available for user authentication.', 'Welche Zweitfaktor-Methoden fuer die Benutzerauthentifizierung verfuegbar sind.'
  UNION ALL SELECT 'iam', 'mfa_verification', 'adaptive_mfa', 'Adaptive / risk-based MFA', 'Adaptive / risikobasierte MFA', 'boolean', 'beneficial', 'optional', 2030, 'Whether MFA challenges adapt based on risk signals such as location or device.', 'Ob MFA-Abfragen basierend auf Risikosignalen wie Standort oder Geraet angepasst werden.'
  UNION ALL SELECT 'iam', 'mfa_verification', 'mfa_enforcement_granularity', 'MFA enforcement granularity', 'MFA-Durchsetzungsgranularitaet', 'enum', 'informational', 'optional', 2040, 'At which level MFA requirements can be enforced across the organization.', 'Auf welcher Ebene MFA-Anforderungen in der Organisation durchgesetzt werden koennen.'
  UNION ALL SELECT 'iam', 'user_management', 'self_service_registration', 'Self-service registration', 'Self-Service-Registrierung', 'boolean', 'informational', 'optional', 3010, 'Whether end users can register accounts without administrator intervention.', 'Ob Endbenutzer Konten ohne Administratoreingriff registrieren koennen.'
  UNION ALL SELECT 'iam', 'user_management', 'password_policy_engine', 'Password policy engine', 'Passwortrichtlinien-Engine', 'enum', 'informational', 'optional', 3020, 'Sophistication level of the built-in password policy enforcement engine.', 'Ausgereiftheitsgrad der integrierten Passwortrichtlinien-Durchsetzungs-Engine.'
  UNION ALL SELECT 'iam', 'user_management', 'user_lifecycle_management', 'User lifecycle management', 'Benutzerlebenszyklus-Verwaltung', 'multi_enum', 'informational', 'multi_select', 3030, 'Which user lifecycle stages are supported from onboarding to offboarding.', 'Welche Benutzerlebenszyklusphasen von der Einrichtung bis zur Deaktivierung unterstuetzt werden.'
  UNION ALL SELECT 'iam', 'user_management', 'user_federation_sources', 'User federation sources', 'Benutzerfoederationsquellen', 'multi_enum', 'informational', 'multi_select', 3040, 'External identity sources that can be federated into the user directory.', 'Externe Identitaetsquellen, die in das Benutzerverzeichnis foederiert werden koennen.'
  UNION ALL SELECT 'iam', 'user_management', 'account_recovery_methods', 'Account recovery methods', 'Kontowiederherstellungsmethoden', 'multi_enum', 'informational', 'multi_select', 3050, 'Available methods for users to recover access to their accounts.', 'Verfuegbare Methoden fuer Benutzer zur Wiederherstellung des Kontozugangs.'
  UNION ALL SELECT 'iam', 'user_management', 'user_profile_customization', 'Custom user attributes', 'Benutzerdefinierte Benutzerattribute', 'boolean', 'informational', 'optional', 3060, 'Whether custom attributes can be added to user profiles beyond standard fields.', 'Ob benutzerdefinierte Attribute ueber Standardfelder hinaus zu Benutzerprofilen hinzugefuegt werden koennen.'
  UNION ALL SELECT 'iam', 'sso_federation', 'sso_model', 'SSO implementation model', 'SSO-Implementierungsmodell', 'enum', 'informational', 'optional', 4010, 'Which single sign-on initiation flows the product supports.', 'Welche Single-Sign-On-Initiierungsablaeufe das Produkt unterstuetzt.'
  UNION ALL SELECT 'iam', 'sso_federation', 'idp_brokering', 'Identity provider brokering', 'Identity-Provider-Vermittlung', 'boolean', 'beneficial', 'optional', 4020, 'Whether the product can broker authentication to external identity providers.', 'Ob das Produkt die Authentifizierung an externe Identity Provider vermitteln kann.'
  UNION ALL SELECT 'iam', 'sso_federation', 'social_login_providers', 'Social login providers', 'Social-Login-Anbieter', 'multi_enum', 'informational', 'multi_select', 4030, 'Which social identity providers are available for user login.', 'Welche sozialen Identitaetsanbieter fuer die Benutzeranmeldung verfuegbar sind.'
  UNION ALL SELECT 'iam', 'sso_federation', 'app_catalog_size', 'Pre-built app integrations', 'Vorgefertigte App-Integrationen', 'enum', 'informational', 'optional', 4040, 'Number of pre-built application integrations available in the catalog.', 'Anzahl der im Katalog verfuegbaren vorgefertigten Anwendungsintegrationen.'
  UNION ALL SELECT 'iam', 'sso_federation', 'session_management', 'Session management features', 'Sitzungsverwaltungsfunktionen', 'multi_enum', 'informational', 'multi_select', 4050, 'Available session management capabilities for controlling active user sessions.', 'Verfuegbare Sitzungsverwaltungsfaehigkeiten zur Kontrolle aktiver Benutzersitzungen.'
  UNION ALL SELECT 'iam', 'access_control', 'access_control_model', 'Access control model', 'Zugriffskontrollmodell', 'multi_enum', 'informational', 'multi_select', 5010, 'Which access control paradigms the product implements for authorization decisions.', 'Welche Zugriffskontrollparadigmen das Produkt fuer Autorisierungsentscheidungen implementiert.'
  UNION ALL SELECT 'iam', 'access_control', 'fine_grained_permissions', 'Fine-grained permissions', 'Feingranulare Berechtigungen', 'boolean', 'informational', 'optional', 5020, 'Whether permissions can be assigned at a resource or action level beyond roles.', 'Ob Berechtigungen auf Ressourcen- oder Aktionsebene ueber Rollen hinaus vergeben werden koennen.'
  UNION ALL SELECT 'iam', 'access_control', 'multi_tenancy', 'Multi-tenancy support', 'Mandantenfaehigkeit', 'boolean', 'beneficial', 'optional', 5030, 'Whether the product supports multiple isolated tenants within a single deployment.', 'Ob das Produkt mehrere isolierte Mandanten innerhalb einer einzelnen Installation unterstuetzt.'
  UNION ALL SELECT 'iam', 'access_control', 'consent_management', 'Consent management', 'Einwilligungsverwaltung', 'boolean', 'informational', 'optional', 5040, 'Whether the product includes user consent collection and management features.', 'Ob das Produkt Funktionen zur Erfassung und Verwaltung von Benutzereinwilligungen enthaelt.'
  UNION ALL SELECT 'iam', 'access_control', 'delegated_administration', 'Delegated administration', 'Delegierte Verwaltung', 'boolean', 'informational', 'optional', 5050, 'Whether administrative tasks can be delegated to non-global administrators.', 'Ob Verwaltungsaufgaben an nicht-globale Administratoren delegiert werden koennen.'
  UNION ALL SELECT 'iam', 'deployment_operations', 'deployment_model', 'Deployment model', 'Bereitstellungsmodell', 'multi_enum', 'tradeoff', 'multi_select', 6010, 'Available deployment options ranging from self-hosted to fully managed cloud.', 'Verfuegbare Bereitstellungsoptionen von selbst gehostet bis vollstaendig verwalteter Cloud.'
  UNION ALL SELECT 'iam', 'deployment_operations', 'container_support', 'Container support', 'Container-Unterstuetzung', 'multi_enum', 'informational', 'multi_select', 6020, 'Supported container and orchestration formats for deployment.', 'Unterstuetzte Container- und Orchestrierungsformate fuer die Bereitstellung.'
  UNION ALL SELECT 'iam', 'deployment_operations', 'high_availability', 'High availability support', 'Hochverfuegbarkeitsunterstuetzung', 'boolean', 'beneficial', 'optional', 6030, 'Whether the product supports high availability configurations with failover.', 'Ob das Produkt Hochverfuegbarkeitskonfigurationen mit Failover unterstuetzt.'
  UNION ALL SELECT 'iam', 'deployment_operations', 'database_backends', 'Supported database backends', 'Unterstuetzte Datenbank-Backends', 'multi_enum', 'informational', 'multi_select', 6040, 'Which database systems can be used as the storage backend.', 'Welche Datenbanksysteme als Speicher-Backend verwendet werden koennen.'
  UNION ALL SELECT 'iam', 'deployment_operations', 'data_processing_location', 'Data processing location', 'Datenverarbeitungsstandort', 'enum', 'tradeoff', 'must_match', 6050, 'Where identity and authentication data is stored and processed.', 'Wo Identitaets- und Authentifizierungsdaten gespeichert und verarbeitet werden.'
  UNION ALL SELECT 'iam', 'deployment_operations', 'horizontal_scaling', 'Horizontal scaling', 'Horizontale Skalierung', 'boolean', 'beneficial', 'optional', 6060, 'Whether the product supports horizontal scaling across multiple nodes.', 'Ob das Produkt horizontale Skalierung ueber mehrere Knoten unterstuetzt.'
  UNION ALL SELECT 'iam', 'customization_developer', 'login_page_theming', 'Login page theming', 'Login-Seiten-Theming', 'enum', 'informational', 'optional', 7010, 'Level of visual customization available for login and registration pages.', 'Grad der visuellen Anpassung fuer Login- und Registrierungsseiten.'
  UNION ALL SELECT 'iam', 'customization_developer', 'auth_flow_customization', 'Authentication flow customization', 'Authentifizierungsfluss-Anpassung', 'enum', 'informational', 'optional', 7020, 'How authentication and registration flows can be customized.', 'Wie Authentifizierungs- und Registrierungsablaeufe angepasst werden koennen.'
  UNION ALL SELECT 'iam', 'customization_developer', 'admin_api_available', 'Admin API available', 'Admin-API verfuegbar', 'boolean', 'beneficial', 'optional', 7030, 'Whether a programmatic administration API is available for automation.', 'Ob eine programmierbare Verwaltungs-API fuer Automatisierung verfuegbar ist.'
  UNION ALL SELECT 'iam', 'customization_developer', 'sdk_availability', 'SDK availability', 'SDK-Verfuegbarkeit', 'multi_enum', 'informational', 'multi_select', 7040, 'Programming languages and platforms for which official SDKs are provided.', 'Programmiersprachen und Plattformen, fuer die offizielle SDKs bereitgestellt werden.'
  UNION ALL SELECT 'iam', 'customization_developer', 'webhook_event_support', 'Webhook / event support', 'Webhook-/Ereignisunterstuetzung', 'boolean', 'beneficial', 'optional', 7050, 'Whether the product supports webhooks or event streams for real-time integrations.', 'Ob das Produkt Webhooks oder Ereignisstroms fuer Echtzeit-Integrationen unterstuetzt.'
  UNION ALL SELECT 'iam', 'customization_developer', 'documentation_quality', 'Documentation quality', 'Dokumentationsqualitaet', 'enum', 'informational', 'optional', 7060, 'Overall quality and completeness of the available developer documentation.', 'Gesamtqualitaet und Vollstaendigkeit der verfuegbaren Entwicklerdokumentation.'
  UNION ALL SELECT 'iam', 'security_compliance', 'brute_force_protection', 'Brute-force protection', 'Brute-Force-Schutz', 'boolean', 'beneficial', 'optional', 8010, 'Whether the product includes built-in brute-force and credential-stuffing protection.', 'Ob das Produkt integrierten Brute-Force- und Credential-Stuffing-Schutz enthaelt.'
  UNION ALL SELECT 'iam', 'security_compliance', 'audit_logging', 'Audit logging', 'Audit-Protokollierung', 'enum', 'beneficial', 'optional', 8020, 'Depth and scope of security event logging for compliance and forensics.', 'Tiefe und Umfang der Sicherheitsereignisprotokollierung fuer Compliance und Forensik.'
  UNION ALL SELECT 'iam', 'security_compliance', 'security_audit_completed', 'Independent security audit', 'Unabhaengiges Sicherheitsaudit', 'boolean', 'beneficial', 'optional', 8030, 'Whether the product has undergone an independent third-party security audit.', 'Ob das Produkt ein unabhaengiges Sicherheitsaudit durch Dritte durchlaufen hat.'
  UNION ALL SELECT 'iam', 'security_compliance', 'gdpr_dpa_available', 'GDPR DPA available', 'DSGVO-AVV verfuegbar', 'boolean', 'informational', 'optional', 8040, 'Whether a GDPR-compliant data processing agreement is available for customers.', 'Ob ein DSGVO-konformer Auftragsverarbeitungsvertrag fuer Kunden verfuegbar ist.'
  UNION ALL SELECT 'iam', 'security_compliance', 'data_export_available', 'Data export available', 'Datenexport verfuegbar', 'boolean', 'beneficial', 'optional', 8050, 'Whether user and configuration data can be exported in a portable format.', 'Ob Benutzer- und Konfigurationsdaten in einem portablen Format exportiert werden koennen.'
  UNION ALL SELECT 'iam', 'security_compliance', 'account_deletion', 'Account deletion available', 'Kontoloeschung verfuegbar', 'boolean', 'beneficial', 'optional', 8060, 'Whether end users or administrators can fully delete user accounts and data.', 'Ob Endbenutzer oder Administratoren Benutzerkonten und Daten vollstaendig loeschen koennen.'
  UNION ALL SELECT 'iam', 'security_compliance', 'source_model', 'Source code model', 'Quellcode-Modell', 'enum', 'tradeoff', 'optional', 8070, 'How the source code is licensed and made available for inspection.', 'Wie der Quellcode lizenziert und zur Einsichtnahme bereitgestellt wird.'
  UNION ALL SELECT 'iam', 'pricing_fit', 'pricing_model', 'Pricing model', 'Preismodell', 'enum', 'informational', 'optional', 9010, 'How the product is priced and what billing model is used.', 'Wie das Produkt bepreist wird und welches Abrechnungsmodell verwendet wird.'
  UNION ALL SELECT 'iam', 'pricing_fit', 'free_tier_available', 'Free tier available', 'Kostenlose Stufe verfuegbar', 'boolean', 'informational', 'must_match', 9020, 'Whether a free tier is available without requiring payment.', 'Ob eine kostenlose Stufe ohne Bezahlung verfuegbar ist.'
  UNION ALL SELECT 'iam', 'pricing_fit', 'free_tier_user_limit', 'Free tier user limit', 'Nutzerlimit der kostenlosen Stufe', 'enum', 'informational', 'optional', 9030, 'Maximum number of users allowed on the free tier.', 'Maximale Anzahl der Benutzer in der kostenlosen Stufe.'
  UNION ALL SELECT 'iam', 'pricing_fit', 'enterprise_plan', 'Enterprise plan available', 'Enterprise-Tarif verfuegbar', 'boolean', 'informational', 'optional', 9040, 'Whether a dedicated enterprise plan with premium support is available.', 'Ob ein dedizierter Enterprise-Tarif mit Premium-Support verfuegbar ist.'
  UNION ALL SELECT 'iam', 'pricing_fit', 'fit_profiles', 'Fit profiles', 'Eignungsprofile', 'multi_enum', 'informational', 'multi_select', 9050, 'Target audience profiles the product is best suited for.', 'Zielgruppenprofile, fuer die das Produkt am besten geeignet ist.'
) AS d
JOIN `matrix_criterion_groups` g
  ON g.category_id = d.category_id
 AND g.group_key = d.group_key;

INSERT IGNORE INTO `matrix_criterion_options`
  (`criterion_id`, `option_key`, `label_en`, `label_de`, `display_tone`, `sort_order`)
SELECT mc.id, d.option_key, d.label_en, d.label_de, d.display_tone, d.sort_order
FROM (
  SELECT 'iam' AS category_id, 'mfa_methods' AS criterion_key, 'totp' AS option_key, 'TOTP' AS label_en, 'TOTP' AS label_de, 'neutral' AS display_tone, 10 AS sort_order
  UNION ALL SELECT 'iam', 'mfa_methods', 'webauthn_fido2', 'WebAuthn / FIDO2', 'WebAuthn / FIDO2', 'neutral', 20
  UNION ALL SELECT 'iam', 'mfa_methods', 'push_notification', 'Push notification', 'Push-Benachrichtigung', 'neutral', 30
  UNION ALL SELECT 'iam', 'mfa_methods', 'sms', 'SMS', 'SMS', 'neutral', 40
  UNION ALL SELECT 'iam', 'mfa_methods', 'email_otp', 'Email OTP', 'E-Mail-OTP', 'neutral', 50
  UNION ALL SELECT 'iam', 'mfa_methods', 'hardware_token', 'Hardware token', 'Hardware-Token', 'neutral', 60
  UNION ALL SELECT 'iam', 'mfa_enforcement_granularity', 'global_only', 'Global only', 'Nur global', 'tradeoff', 10
  UNION ALL SELECT 'iam', 'mfa_enforcement_granularity', 'per_application', 'Per application', 'Pro Anwendung', 'neutral', 20
  UNION ALL SELECT 'iam', 'mfa_enforcement_granularity', 'per_role_group', 'Per role / group', 'Pro Rolle / Gruppe', 'neutral', 30
  UNION ALL SELECT 'iam', 'mfa_enforcement_granularity', 'policy_based', 'Policy-based', 'Richtlinienbasiert', 'positive', 40
  UNION ALL SELECT 'iam', 'password_policy_engine', 'basic', 'Basic (length / complexity)', 'Basis (Laenge / Komplexitaet)', 'neutral', 10
  UNION ALL SELECT 'iam', 'password_policy_engine', 'advanced', 'Advanced (breach-check, history, expiry)', 'Erweitert (Breach-Check, Verlauf, Ablauf)', 'positive', 20
  UNION ALL SELECT 'iam', 'password_policy_engine', 'policy_based', 'Policy-based (custom rules engine)', 'Richtlinienbasiert (benutzerdefinierte Regel-Engine)', 'neutral', 30
  UNION ALL SELECT 'iam', 'password_policy_engine', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'iam', 'user_lifecycle_management', 'self_registration', 'Self-registration', 'Selbstregistrierung', 'neutral', 10
  UNION ALL SELECT 'iam', 'user_lifecycle_management', 'admin_provisioning', 'Admin provisioning', 'Admin-Bereitstellung', 'neutral', 20
  UNION ALL SELECT 'iam', 'user_lifecycle_management', 'scim_provisioning', 'SCIM provisioning', 'SCIM-Bereitstellung', 'neutral', 30
  UNION ALL SELECT 'iam', 'user_lifecycle_management', 'invitation_flow', 'Invitation flow', 'Einladungsablauf', 'neutral', 40
  UNION ALL SELECT 'iam', 'user_lifecycle_management', 'account_deactivation', 'Account deactivation', 'Kontodeaktivierung', 'neutral', 50
  UNION ALL SELECT 'iam', 'user_lifecycle_management', 'account_deletion', 'Account deletion', 'Kontoloeschung', 'neutral', 60
  UNION ALL SELECT 'iam', 'user_federation_sources', 'ldap_ad', 'LDAP / AD', 'LDAP / AD', 'neutral', 10
  UNION ALL SELECT 'iam', 'user_federation_sources', 'external_oidc', 'External OIDC', 'Externes OIDC', 'neutral', 20
  UNION ALL SELECT 'iam', 'user_federation_sources', 'external_saml', 'External SAML', 'Externes SAML', 'neutral', 30
  UNION ALL SELECT 'iam', 'user_federation_sources', 'social_login', 'Social login', 'Social Login', 'neutral', 40
  UNION ALL SELECT 'iam', 'user_federation_sources', 'custom_source', 'Custom source', 'Benutzerdefinierte Quelle', 'neutral', 50
  UNION ALL SELECT 'iam', 'account_recovery_methods', 'email_link', 'Email link', 'E-Mail-Link', 'neutral', 10
  UNION ALL SELECT 'iam', 'account_recovery_methods', 'sms_code', 'SMS code', 'SMS-Code', 'neutral', 20
  UNION ALL SELECT 'iam', 'account_recovery_methods', 'security_questions', 'Security questions', 'Sicherheitsfragen', 'neutral', 30
  UNION ALL SELECT 'iam', 'account_recovery_methods', 'admin_reset', 'Admin reset', 'Admin-Zuruecksetzung', 'neutral', 40
  UNION ALL SELECT 'iam', 'account_recovery_methods', 'recovery_codes', 'Recovery codes', 'Wiederherstellungscodes', 'neutral', 50
  UNION ALL SELECT 'iam', 'sso_model', 'idp_initiated', 'IdP-initiated', 'IdP-initiiert', 'neutral', 10
  UNION ALL SELECT 'iam', 'sso_model', 'sp_initiated', 'SP-initiated', 'SP-initiiert', 'neutral', 20
  UNION ALL SELECT 'iam', 'sso_model', 'both', 'Both (IdP + SP)', 'Beide (IdP + SP)', 'positive', 30
  UNION ALL SELECT 'iam', 'social_login_providers', 'google', 'Google', 'Google', 'neutral', 10
  UNION ALL SELECT 'iam', 'social_login_providers', 'microsoft', 'Microsoft', 'Microsoft', 'neutral', 20
  UNION ALL SELECT 'iam', 'social_login_providers', 'apple', 'Apple', 'Apple', 'neutral', 30
  UNION ALL SELECT 'iam', 'social_login_providers', 'github', 'GitHub', 'GitHub', 'neutral', 40
  UNION ALL SELECT 'iam', 'social_login_providers', 'gitlab', 'GitLab', 'GitLab', 'neutral', 50
  UNION ALL SELECT 'iam', 'social_login_providers', 'facebook', 'Facebook', 'Facebook', 'neutral', 60
  UNION ALL SELECT 'iam', 'social_login_providers', 'twitter', 'Twitter / X', 'Twitter / X', 'neutral', 70
  UNION ALL SELECT 'iam', 'app_catalog_size', 'extensive', 'Extensive (100+)', 'Umfangreich (100+)', 'positive', 10
  UNION ALL SELECT 'iam', 'app_catalog_size', 'moderate', 'Moderate (20-100)', 'Mittel (20-100)', 'neutral', 20
  UNION ALL SELECT 'iam', 'app_catalog_size', 'limited', 'Limited (<20)', 'Begrenzt (<20)', 'neutral', 30
  UNION ALL SELECT 'iam', 'app_catalog_size', 'none_manual_only', 'None (manual only)', 'Keine (nur manuell)', 'tradeoff', 40
  UNION ALL SELECT 'iam', 'session_management', 'single_sign_out', 'Single sign-out', 'Single-Sign-Out', 'neutral', 10
  UNION ALL SELECT 'iam', 'session_management', 'session_revocation', 'Session revocation', 'Sitzungswiderruf', 'neutral', 20
  UNION ALL SELECT 'iam', 'session_management', 'session_listing', 'Session listing', 'Sitzungsauflistung', 'neutral', 30
  UNION ALL SELECT 'iam', 'session_management', 'idle_timeout', 'Idle timeout', 'Inaktivitaets-Timeout', 'neutral', 40
  UNION ALL SELECT 'iam', 'session_management', 'absolute_timeout', 'Absolute timeout', 'Absolutes Timeout', 'neutral', 50
  UNION ALL SELECT 'iam', 'access_control_model', 'rbac', 'RBAC', 'RBAC', 'neutral', 10
  UNION ALL SELECT 'iam', 'access_control_model', 'abac', 'ABAC', 'ABAC', 'neutral', 20
  UNION ALL SELECT 'iam', 'access_control_model', 'group_based', 'Group-based', 'Gruppenbasiert', 'neutral', 30
  UNION ALL SELECT 'iam', 'access_control_model', 'policy_engine', 'Policy engine', 'Richtlinien-Engine', 'neutral', 40
  UNION ALL SELECT 'iam', 'access_control_model', 'acl', 'ACL', 'ACL', 'neutral', 50
  UNION ALL SELECT 'iam', 'deployment_model', 'self_hosted', 'Self-hosted', 'Selbst gehostet', 'neutral', 10
  UNION ALL SELECT 'iam', 'deployment_model', 'saas', 'SaaS', 'SaaS', 'neutral', 20
  UNION ALL SELECT 'iam', 'deployment_model', 'hybrid', 'Hybrid', 'Hybrid', 'neutral', 30
  UNION ALL SELECT 'iam', 'deployment_model', 'managed_cloud', 'Managed cloud', 'Verwaltete Cloud', 'neutral', 40
  UNION ALL SELECT 'iam', 'container_support', 'docker', 'Docker', 'Docker', 'neutral', 10
  UNION ALL SELECT 'iam', 'container_support', 'kubernetes_native', 'Kubernetes-native', 'Kubernetes-nativ', 'neutral', 20
  UNION ALL SELECT 'iam', 'container_support', 'helm_chart', 'Helm chart', 'Helm-Chart', 'neutral', 30
  UNION ALL SELECT 'iam', 'container_support', 'docker_compose', 'Docker Compose', 'Docker Compose', 'neutral', 40
  UNION ALL SELECT 'iam', 'container_support', 'none', 'None', 'Keine', 'neutral', 50
  UNION ALL SELECT 'iam', 'database_backends', 'postgresql', 'PostgreSQL', 'PostgreSQL', 'neutral', 10
  UNION ALL SELECT 'iam', 'database_backends', 'mysql_mariadb', 'MySQL / MariaDB', 'MySQL / MariaDB', 'neutral', 20
  UNION ALL SELECT 'iam', 'database_backends', 'cockroachdb', 'CockroachDB', 'CockroachDB', 'neutral', 30
  UNION ALL SELECT 'iam', 'database_backends', 'sqlite', 'SQLite', 'SQLite', 'neutral', 40
  UNION ALL SELECT 'iam', 'database_backends', 'embedded', 'Embedded', 'Eingebettet', 'neutral', 50
  UNION ALL SELECT 'iam', 'database_backends', 'vendor_managed', 'Vendor-managed', 'Vom Anbieter verwaltet', 'neutral', 60
  UNION ALL SELECT 'iam', 'data_processing_location', 'eu_only', 'EU/EEA only', 'Nur EU/EWR', 'positive', 10
  UNION ALL SELECT 'iam', 'data_processing_location', 'eu_primary', 'EU primary, non-EU fallback', 'EU primaer, Nicht-EU-Ausweichstandort', 'neutral', 20
  UNION ALL SELECT 'iam', 'data_processing_location', 'global', 'Global', 'Global', 'warning', 30
  UNION ALL SELECT 'iam', 'data_processing_location', 'self_hosted_choice', 'Self-hosted (your choice)', 'Selbst gehostet (eigene Wahl)', 'neutral', 40
  UNION ALL SELECT 'iam', 'data_processing_location', 'unspecified', 'Unspecified', 'Nicht angegeben', 'warning', 50
  UNION ALL SELECT 'iam', 'login_page_theming', 'full_custom', 'Full custom (CSS/HTML)', 'Voll anpassbar (CSS/HTML)', 'positive', 10
  UNION ALL SELECT 'iam', 'login_page_theming', 'theme_builder', 'Theme builder (visual editor)', 'Theme-Builder (visueller Editor)', 'neutral', 20
  UNION ALL SELECT 'iam', 'login_page_theming', 'basic', 'Basic (logo / colors)', 'Basis (Logo / Farben)', 'neutral', 30
  UNION ALL SELECT 'iam', 'login_page_theming', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'iam', 'auth_flow_customization', 'visual_flow_editor', 'Visual flow editor', 'Visueller Fluss-Editor', 'positive', 10
  UNION ALL SELECT 'iam', 'auth_flow_customization', 'scripted_policies', 'Scripted policies', 'Skriptbasierte Richtlinien', 'neutral', 20
  UNION ALL SELECT 'iam', 'auth_flow_customization', 'basic_toggles', 'Basic toggles', 'Einfache Umschalter', 'neutral', 30
  UNION ALL SELECT 'iam', 'auth_flow_customization', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'iam', 'sdk_availability', 'javascript', 'JavaScript', 'JavaScript', 'neutral', 10
  UNION ALL SELECT 'iam', 'sdk_availability', 'python', 'Python', 'Python', 'neutral', 20
  UNION ALL SELECT 'iam', 'sdk_availability', 'java', 'Java', 'Java', 'neutral', 30
  UNION ALL SELECT 'iam', 'sdk_availability', 'go', 'Go', 'Go', 'neutral', 40
  UNION ALL SELECT 'iam', 'sdk_availability', 'dotnet', '.NET', '.NET', 'neutral', 50
  UNION ALL SELECT 'iam', 'sdk_availability', 'php', 'PHP', 'PHP', 'neutral', 60
  UNION ALL SELECT 'iam', 'sdk_availability', 'ruby', 'Ruby', 'Ruby', 'neutral', 70
  UNION ALL SELECT 'iam', 'sdk_availability', 'rest_api_only', 'REST API only', 'Nur REST-API', 'neutral', 80
  UNION ALL SELECT 'iam', 'documentation_quality', 'comprehensive', 'Comprehensive', 'Umfassend', 'positive', 10
  UNION ALL SELECT 'iam', 'documentation_quality', 'adequate', 'Adequate', 'Ausreichend', 'neutral', 20
  UNION ALL SELECT 'iam', 'documentation_quality', 'minimal', 'Minimal', 'Minimal', 'warning', 30
  UNION ALL SELECT 'iam', 'documentation_quality', 'community_only', 'Community only', 'Nur Community', 'tradeoff', 40
  UNION ALL SELECT 'iam', 'audit_logging', 'comprehensive', 'Comprehensive (all events, exportable)', 'Umfassend (alle Ereignisse, exportierbar)', 'positive', 10
  UNION ALL SELECT 'iam', 'audit_logging', 'standard', 'Standard (login / admin)', 'Standard (Login / Admin)', 'neutral', 20
  UNION ALL SELECT 'iam', 'audit_logging', 'basic', 'Basic (login only)', 'Basis (nur Login)', 'neutral', 30
  UNION ALL SELECT 'iam', 'audit_logging', 'none', 'None', 'Keine', 'warning', 40
  UNION ALL SELECT 'iam', 'source_model', 'open_source', 'Open source', 'Open Source', 'positive', 10
  UNION ALL SELECT 'iam', 'source_model', 'source_available', 'Source-available', 'Quelloffen', 'neutral', 20
  UNION ALL SELECT 'iam', 'source_model', 'partial_open', 'Partial open', 'Teilweise offen', 'neutral', 30
  UNION ALL SELECT 'iam', 'source_model', 'proprietary', 'Proprietary', 'Proprietaer', 'warning', 40
  UNION ALL SELECT 'iam', 'pricing_model', 'free_only', 'Free only', 'Nur kostenlos', 'positive', 10
  UNION ALL SELECT 'iam', 'pricing_model', 'open_core', 'Open core', 'Open Core', 'neutral', 20
  UNION ALL SELECT 'iam', 'pricing_model', 'freemium', 'Freemium', 'Freemium', 'neutral', 30
  UNION ALL SELECT 'iam', 'pricing_model', 'subscription_per_user', 'Subscription (per user)', 'Abonnement (pro Benutzer)', 'neutral', 40
  UNION ALL SELECT 'iam', 'pricing_model', 'subscription_flat', 'Subscription (flat)', 'Abonnement (pauschal)', 'neutral', 50
  UNION ALL SELECT 'iam', 'pricing_model', 'self_hosted_free_cloud_paid', 'Self-hosted free, cloud paid', 'Selbst gehostet kostenlos, Cloud kostenpflichtig', 'tradeoff', 60
  UNION ALL SELECT 'iam', 'free_tier_user_limit', 'unlimited', 'Unlimited', 'Unbegrenzt', 'positive', 10
  UNION ALL SELECT 'iam', 'free_tier_user_limit', 'over_10000', 'Over 10,000', 'Ueber 10.000', 'neutral', 20
  UNION ALL SELECT 'iam', 'free_tier_user_limit', '1000_to_10000', '1,000 to 10,000', '1.000 bis 10.000', 'neutral', 30
  UNION ALL SELECT 'iam', 'free_tier_user_limit', 'under_1000', 'Under 1,000', 'Unter 1.000', 'tradeoff', 40
  UNION ALL SELECT 'iam', 'free_tier_user_limit', 'none', 'None (no free tier)', 'Keine (keine kostenlose Stufe)', 'neutral', 50
  UNION ALL SELECT 'iam', 'fit_profiles', 'startup', 'Startup', 'Startup', 'neutral', 10
  UNION ALL SELECT 'iam', 'fit_profiles', 'smb', 'SMB', 'KMU', 'neutral', 20
  UNION ALL SELECT 'iam', 'fit_profiles', 'enterprise', 'Enterprise', 'Grossunternehmen', 'neutral', 30
  UNION ALL SELECT 'iam', 'fit_profiles', 'developer', 'Developer', 'Entwickler', 'neutral', 40
  UNION ALL SELECT 'iam', 'fit_profiles', 'self_hoster', 'Self-hoster', 'Selbst-Hoster', 'neutral', 50
  UNION ALL SELECT 'iam', 'fit_profiles', 'privacy_focused', 'Privacy-focused', 'Datenschutzbewusst', 'neutral', 60
  UNION ALL SELECT 'iam', 'fit_profiles', 'education', 'Education', 'Bildung', 'neutral', 70
) AS d
JOIN `matrix_criteria` mc
  ON mc.category_id = d.category_id
 AND mc.criterion_key = d.criterion_key;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT ce.id, mc.category_id, mc.id, 'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.entry_id = ce.id
 AND ec.category_id = 'iam'
JOIN `matrix_criteria` mc
  ON mc.category_id = 'iam'
WHERE ce.`status` = 'alternative'
  AND ce.is_active = 1;

INSERT INTO `schema_migrations` (`version`) VALUES ('035-iam-matrix-criteria');
