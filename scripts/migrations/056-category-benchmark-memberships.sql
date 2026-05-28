-- Migration 056: Treat category benchmark products as regular matrix members.

INSERT IGNORE INTO `entry_categories` (`entry_id`, `category_id`, `is_primary`, `sort_order`)
SELECT
  cuv.`entry_id`,
  cuv.`category_id`,
  0,
  cuv.`sort_order`
FROM `category_us_vendors` cuv
JOIN `catalog_entries` ce
  ON ce.`id` = cuv.`entry_id`
WHERE cuv.`entry_id` IS NOT NULL
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
JOIN `matrix_criteria` mc
  ON mc.`category_id` = ec.`category_id`
WHERE ce.`status` IN ('alternative', 'us')
  AND ce.`is_active` = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('056-category-benchmark-memberships');
