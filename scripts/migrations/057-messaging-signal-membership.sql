-- Migration 057: Add Signal as an explicit Messaging matrix member.

INSERT IGNORE INTO `entry_categories` (`entry_id`, `category_id`, `is_primary`, `sort_order`)
SELECT
  ce.`id`,
  'messaging',
  0,
  5
FROM `catalog_entries` ce
WHERE ce.`slug` = 'signal'
  AND ce.`status` = 'us'
  AND ce.`is_active` = 1;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT
  ce.`id`,
  mc.`category_id`,
  mc.`id`,
  'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.`entry_id` = ce.`id`
 AND ec.`category_id` = 'messaging'
JOIN `matrix_criteria` mc
  ON mc.`category_id` = 'messaging'
WHERE ce.`slug` = 'signal'
  AND ce.`status` = 'us'
  AND ce.`is_active` = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('057-messaging-signal-membership');
