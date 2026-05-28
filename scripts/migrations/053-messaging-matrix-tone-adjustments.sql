-- Migration 053: Align Messaging matrix tones with user-perspective feature value.

UPDATE `matrix_criteria`
SET `semantics` = CASE `criterion_key`
  WHEN 'multiple_accounts' THEN 'beneficial'
  WHEN 'self_hosting_available' THEN 'beneficial'
  WHEN 'third_party_clients' THEN 'beneficial'
  ELSE `semantics`
END
WHERE `category_id` = 'messaging'
  AND `criterion_key` IN (
    'multiple_accounts',
    'self_hosting_available',
    'third_party_clients'
  );

UPDATE `matrix_criterion_options` mco
JOIN `matrix_criteria` mc
  ON mc.id = mco.criterion_id
SET mco.`display_tone` = CASE
  WHEN mc.`criterion_key` = 'network_architecture'
    AND mco.`option_key` = 'centralized'
    THEN 'negative'
  WHEN mc.`criterion_key` = 'network_architecture'
    AND mco.`option_key` IN ('federated', 'peer_to_peer')
    THEN 'positive'
  WHEN mc.`criterion_key` = 'push_delivery_model'
    AND mco.`option_key` = 'platform_push'
    THEN 'warning'
  WHEN mc.`criterion_key` = 'reactions_threads'
    AND mco.`option_key` IN ('reactions', 'replies', 'threads', 'quotes')
    THEN 'positive'
  WHEN mc.`criterion_key` = 'scheduled_or_pinned_messages'
    AND mco.`option_key` IN ('scheduled_send', 'pinned_messages', 'bookmarks_saved')
    THEN 'positive'
  WHEN mc.`criterion_key` = 'fit_profiles'
    THEN 'neutral'
  ELSE mco.`display_tone`
END
WHERE mc.`category_id` = 'messaging'
  AND (
    (
      mc.`criterion_key` = 'network_architecture'
      AND mco.`option_key` IN ('centralized', 'federated', 'peer_to_peer')
    )
    OR (
      mc.`criterion_key` = 'push_delivery_model'
      AND mco.`option_key` = 'platform_push'
    )
    OR (
      mc.`criterion_key` = 'reactions_threads'
      AND mco.`option_key` IN ('reactions', 'replies', 'threads', 'quotes')
    )
    OR (
      mc.`criterion_key` = 'scheduled_or_pinned_messages'
      AND mco.`option_key` IN ('scheduled_send', 'pinned_messages', 'bookmarks_saved')
    )
    OR mc.`criterion_key` = 'fit_profiles'
  );

INSERT INTO `schema_migrations` (`version`)
VALUES ('053-messaging-matrix-tone-adjustments');
