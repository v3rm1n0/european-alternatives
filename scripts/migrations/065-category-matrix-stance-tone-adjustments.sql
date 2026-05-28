-- Migration 065: Align category matrix option tones with user-control stance.

UPDATE `matrix_criterion_options` mco
JOIN `matrix_criteria` mc
  ON mc.`id` = mco.`criterion_id`
SET mco.`display_tone` = CASE
  WHEN mco.`option_key` IN (
    'proprietary',
    'proprietary_panel',
    'mandatory_telemetry',
    'mandatory_cloud_account',
    'mandatory_accounts',
    'mandatory',
    'full_logs',
    'full_query_logging',
    'retained_long_term',
    'sold',
    'sold_to_third_parties',
    'no_export',
    'no_access',
    'not_encrypted',
    'not_disableable'
  )
    THEN 'negative'
  WHEN mco.`option_key` IN (
    'partial_open',
    'partially_open',
    'partially_open_source',
    'partial_open_source',
    'open_core',
    'source_available',
    'source_available_panel',
    'cloud_only',
    'hosted_saas',
    'saas',
    'cloud_vendor',
    'provider_cloud',
    'platform_cloud',
    'session_logs',
    'personalized_ads',
    'location_based_ads',
    'personal_profiling',
    'account_personalized',
    'retained_for_ads',
    'long_term',
    'indefinite',
    'unspecified'
  )
    THEN 'warning'
  WHEN mco.`option_key` IN (
    'open_source',
    'fully_open',
    'fully_open_source',
    'full_open_source',
    'open_source_panel',
    'eu_only',
    'eu_primary',
    'local',
    'local_only',
    'local_device',
    'user_configured',
    'self_hosted',
    'self_hosted_only',
    'self_hosted_web',
    'self_hosted_choice',
    'self_hosted_control',
    'customer_controlled_self_hosted',
    'cloud_and_self_hosted',
    'both',
    'federated_instance',
    'no_telemetry',
    'opt_in',
    'opt_in_telemetry',
    'no_account_needed',
    'not_needed',
    'local_account',
    'no_logging',
    'no_retention',
    'no_personal_data',
    'strict_no_logs',
    'no_activity_logs',
    'never_stored',
    'not_logged',
    'no_ads',
    'no_ads_no_tracking',
    'no_known_trackers_or_ads',
    'no_sharing',
    'end_to_end',
    'e2ee',
    'zero_knowledge_default',
    'zero_access_at_rest'
  )
    THEN 'positive'
  ELSE mco.`display_tone`
END
WHERE (
    mc.`criterion_key` REGEXP '(source|telemetry|tracking|logging|retention|location|region|jurisdiction|hosting|deployment|account|required|backup|export|encryption|ads|data)'
    OR mc.`semantics` IN ('risk', 'beneficial')
  )
  AND mco.`option_key` IN (
    'proprietary',
    'proprietary_panel',
    'mandatory_telemetry',
    'mandatory_cloud_account',
    'mandatory_accounts',
    'mandatory',
    'full_logs',
    'full_query_logging',
    'retained_long_term',
    'sold',
    'sold_to_third_parties',
    'no_export',
    'no_access',
    'not_encrypted',
    'not_disableable',
    'partial_open',
    'partially_open',
    'partially_open_source',
    'partial_open_source',
    'open_core',
    'source_available',
    'source_available_panel',
    'cloud_only',
    'hosted_saas',
    'saas',
    'cloud_vendor',
    'provider_cloud',
    'platform_cloud',
    'session_logs',
    'personalized_ads',
    'location_based_ads',
    'personal_profiling',
    'account_personalized',
    'retained_for_ads',
    'long_term',
    'indefinite',
    'unspecified',
    'open_source',
    'fully_open',
    'fully_open_source',
    'full_open_source',
    'open_source_panel',
    'eu_only',
    'eu_primary',
    'local',
    'local_only',
    'local_device',
    'user_configured',
    'self_hosted',
    'self_hosted_only',
    'self_hosted_web',
    'self_hosted_choice',
    'self_hosted_control',
    'customer_controlled_self_hosted',
    'cloud_and_self_hosted',
    'both',
    'federated_instance',
    'no_telemetry',
    'opt_in',
    'opt_in_telemetry',
    'no_account_needed',
    'not_needed',
    'local_account',
    'no_logging',
    'no_retention',
    'no_personal_data',
    'strict_no_logs',
    'no_activity_logs',
    'never_stored',
    'not_logged',
    'no_ads',
    'no_ads_no_tracking',
    'no_known_trackers_or_ads',
    'no_sharing',
    'end_to_end',
    'e2ee',
    'zero_knowledge_default',
    'zero_access_at_rest'
  );

UPDATE `matrix_criterion_options` mco
JOIN `matrix_criteria` mc
  ON mc.`id` = mco.`criterion_id`
SET mco.`display_tone` = 'warning'
WHERE mc.`criterion_key` IN ('telemetry_model', 'store_telemetry', 'telemetry_default', 'telemetry_opt_out')
  AND mco.`option_key` IN ('opt_out', 'opt_out_telemetry', 'partially_disableable');

UPDATE `matrix_criterion_options` mco
JOIN `matrix_criteria` mc
  ON mc.`id` = mco.`criterion_id`
SET mco.`display_tone` = 'positive'
WHERE mc.`criterion_key` IN ('telemetry_model', 'store_telemetry', 'telemetry_default', 'telemetry_opt_out')
  AND mco.`option_key` IN ('none', 'opt_in_only', 'fully_disableable', 'not_applicable');

UPDATE `matrix_criterion_options` mco
JOIN `matrix_criteria` mc
  ON mc.`id` = mco.`criterion_id`
SET mco.`display_tone` = 'negative'
WHERE mc.`criterion_key` IN ('telemetry_model', 'store_telemetry', 'telemetry_default', 'telemetry_opt_out')
  AND mco.`option_key` IN ('mandatory', 'mandatory_telemetry', 'not_disableable', 'extensive_default');

INSERT INTO `schema_migrations` (`version`)
VALUES ('065-category-matrix-stance-tone-adjustments');
