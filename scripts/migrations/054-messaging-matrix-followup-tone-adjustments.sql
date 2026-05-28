-- Migration 054: Apply follow-up Messaging matrix tone decisions.

UPDATE `matrix_criteria`
SET `semantics` = 'beneficial'
WHERE `category_id` = 'messaging'
  AND `criterion_key` = 'bot_integration_support';

UPDATE `matrix_criterion_options` mco
JOIN `matrix_criteria` mc
  ON mc.id = mco.criterion_id
SET mco.`display_tone` = CASE
  WHEN mc.`criterion_key` = 'network_architecture'
    AND mco.`option_key` = 'local_mesh'
    THEN 'positive'
  WHEN mc.`criterion_key` = 'network_architecture'
    AND mco.`option_key` = 'email_based'
    THEN 'tradeoff'
  WHEN mc.`criterion_key` = 'server_side_components'
    AND mco.`option_key` = 'hosted_service'
    THEN 'negative'
  WHEN mc.`criterion_key` = 'server_side_components'
    AND mco.`option_key` = 'no_central_server'
    THEN 'positive'
  WHEN mc.`criterion_key` = 'metadata_protection_level'
    AND mco.`option_key` = 'p2p_or_local'
    THEN 'positive'
  WHEN mc.`criterion_key` = 'push_delivery_model'
    AND mco.`option_key` = 'local_polling'
    THEN 'positive'
  WHEN mc.`criterion_key` = 'group_admin_tools'
    AND mco.`option_key` = 'invite_links'
    THEN 'positive'
  WHEN mc.`criterion_key` = 'external_interoperability'
    AND mco.`option_key` = 'bridges'
    THEN 'positive'
  ELSE mco.`display_tone`
END
WHERE mc.`category_id` = 'messaging'
  AND (
    (
      mc.`criterion_key` = 'network_architecture'
      AND mco.`option_key` IN ('local_mesh', 'email_based')
    )
    OR (
      mc.`criterion_key` = 'server_side_components'
      AND mco.`option_key` IN ('hosted_service', 'no_central_server')
    )
    OR (
      mc.`criterion_key` = 'metadata_protection_level'
      AND mco.`option_key` = 'p2p_or_local'
    )
    OR (
      mc.`criterion_key` = 'push_delivery_model'
      AND mco.`option_key` = 'local_polling'
    )
    OR (
      mc.`criterion_key` = 'group_admin_tools'
      AND mco.`option_key` = 'invite_links'
    )
    OR (
      mc.`criterion_key` = 'external_interoperability'
      AND mco.`option_key` = 'bridges'
    )
  );

INSERT INTO `schema_migrations` (`version`)
VALUES ('054-messaging-matrix-followup-tone-adjustments');
