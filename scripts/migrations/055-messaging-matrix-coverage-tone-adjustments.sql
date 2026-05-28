-- Migration 055: Apply Messaging matrix coverage and remaining tone decisions.

UPDATE `matrix_criteria`
SET `semantics` = 'beneficial'
WHERE `category_id` = 'messaging'
  AND `criterion_key` = 'public_rooms_or_channels';

UPDATE `matrix_criterion_options` mco
JOIN `matrix_criteria` mc
  ON mc.id = mco.criterion_id
SET mco.`display_tone` = CASE
  WHEN mc.`criterion_key` = 'supported_identifiers'
    AND mco.`option_key` IN ('protocol_address', 'device_local')
    THEN 'positive'
  WHEN mc.`criterion_key` = 'contact_discovery_methods'
    AND mco.`option_key` IN ('invite_link', 'qr_code')
    THEN 'positive'
  WHEN mc.`criterion_key` = 'screenshot_or_forwarding_controls'
    AND mco.`option_key` IN ('screenshot_warning', 'screenshot_blocking', 'forwarding_limits')
    THEN 'positive'
  WHEN mc.`criterion_key` = 'backup_model'
    AND mco.`option_key` = 'none'
    THEN 'negative'
  WHEN mc.`criterion_key` = 'account_transfer_model'
    AND mco.`option_key` = 'unsupported'
    THEN 'negative'
  ELSE mco.`display_tone`
END
WHERE mc.`category_id` = 'messaging'
  AND (
    (
      mc.`criterion_key` = 'supported_identifiers'
      AND mco.`option_key` IN ('protocol_address', 'device_local')
    )
    OR (
      mc.`criterion_key` = 'contact_discovery_methods'
      AND mco.`option_key` IN ('invite_link', 'qr_code')
    )
    OR (
      mc.`criterion_key` = 'screenshot_or_forwarding_controls'
      AND mco.`option_key` IN ('screenshot_warning', 'screenshot_blocking', 'forwarding_limits')
    )
    OR (
      mc.`criterion_key` = 'backup_model'
      AND mco.`option_key` = 'none'
    )
    OR (
      mc.`criterion_key` = 'account_transfer_model'
      AND mco.`option_key` = 'unsupported'
    )
  );

INSERT INTO `schema_migrations` (`version`)
VALUES ('055-messaging-matrix-coverage-tone-adjustments');
