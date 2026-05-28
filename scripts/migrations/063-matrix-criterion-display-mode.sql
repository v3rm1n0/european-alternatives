-- Migration 063: Add matrix criterion display mode metadata.

ALTER TABLE `matrix_criteria`
  ADD COLUMN `display_mode` ENUM('default','coverage') NOT NULL DEFAULT 'default'
  AFTER `filter_mode`;

UPDATE `matrix_criteria`
SET `display_mode` = 'coverage'
WHERE `value_type` = 'multi_enum'
  AND (
    `criterion_key` IN (
      'supported_platforms',
      'supported_apps',
      'supported_client_platforms',
      'distribution_channels',
      'mobile_app_distribution',
      'player_distribution_channels',
      'supported_device_form_factors',
      'reactions_threads',
      'scheduled_or_pinned_messages'
    )
    OR `criterion_key` LIKE '%_features'
    OR `criterion_key` LIKE 'supported_%'
  );

INSERT INTO `schema_migrations` (`version`)
VALUES ('063-matrix-criterion-display-mode');
