-- Migration 066: Link Kdenlive to CapCut searches.

INSERT INTO `countries` (`code`, `label_en`, `label_de`, `sort_order`)
VALUES ('cn', 'China', 'China', 30)
ON DUPLICATE KEY UPDATE
  `label_en` = VALUES(`label_en`),
  `label_de` = VALUES(`label_de`),
  `sort_order` = VALUES(`sort_order`);

INSERT INTO `catalog_entries`
  (`slug`, `status`, `source_file`, `is_active`, `name`, `description_en`, `description_de`, `country_code`, `website_url`, `pricing`, `is_open_source`, `open_source_level`, `self_hostable`)
VALUES
  (
    'capcut',
    'us',
    'us',
    1,
    'CapCut',
    'CapCut is included as a benchmark comparison product for video-editing alternatives.',
    'CapCut wird als Benchmark-Vergleichsprodukt für Video-Editing-Alternativen geführt.',
    'cn',
    'https://www.capcut.com/',
    'freemium',
    0,
    'none',
    0
  )
ON DUPLICATE KEY UPDATE
  `status` = VALUES(`status`),
  `source_file` = VALUES(`source_file`),
  `is_active` = VALUES(`is_active`),
  `name` = VALUES(`name`),
  `description_en` = VALUES(`description_en`),
  `description_de` = VALUES(`description_de`),
  `country_code` = VALUES(`country_code`),
  `website_url` = VALUES(`website_url`),
  `pricing` = VALUES(`pricing`),
  `is_open_source` = VALUES(`is_open_source`),
  `open_source_level` = VALUES(`open_source_level`),
  `self_hostable` = VALUES(`self_hostable`);

INSERT INTO `category_us_vendors` (`category_id`, `entry_id`, `raw_name`, `sort_order`)
SELECT
  'video-editing',
  capcut.`id`,
  'CapCut',
  COALESCE(MAX(cuv.`sort_order`), -1) + 1
FROM `catalog_entries` capcut
LEFT JOIN `category_us_vendors` cuv
  ON cuv.`category_id` = 'video-editing'
WHERE capcut.`slug` = 'capcut'
GROUP BY capcut.`id`
ON DUPLICATE KEY UPDATE
  `entry_id` = VALUES(`entry_id`),
  `raw_name` = VALUES(`raw_name`);

INSERT IGNORE INTO `entry_categories` (`entry_id`, `category_id`, `is_primary`, `sort_order`)
SELECT
  capcut.`id`,
  'video-editing',
  0,
  cuv.`sort_order`
FROM `catalog_entries` capcut
JOIN `category_us_vendors` cuv
  ON cuv.`category_id` = 'video-editing'
 AND cuv.`raw_name` = 'CapCut'
WHERE capcut.`slug` = 'capcut';

INSERT IGNORE INTO `us_vendor_aliases` (`alias`, `entry_id`)
SELECT 'CapCut', capcut.`id`
FROM `catalog_entries` capcut
WHERE capcut.`slug` = 'capcut';

UPDATE `entry_replacements` er
JOIN `catalog_entries` capcut
  ON capcut.`slug` = 'capcut'
SET er.`raw_name` = 'CapCut',
    er.`replaced_entry_id` = capcut.`id`
WHERE LOWER(er.`raw_name`) = 'capcut'
   OR er.`replaced_entry_id` = capcut.`id`;

INSERT INTO `entry_replacements` (`entry_id`, `raw_name`, `replaced_entry_id`, `sort_order`)
SELECT
  kdenlive.`id`,
  'CapCut',
  capcut.`id`,
  COALESCE(MAX(existing_er.`sort_order`), -1) + 1
FROM `catalog_entries` kdenlive
JOIN `catalog_entries` capcut
  ON capcut.`slug` = 'capcut'
LEFT JOIN `entry_replacements` existing_er
  ON existing_er.`entry_id` = kdenlive.`id`
WHERE kdenlive.`slug` = 'kdenlive'
  AND NOT EXISTS (
    SELECT 1
    FROM `entry_replacements` duplicate_er
    WHERE duplicate_er.`entry_id` = kdenlive.`id`
      AND (
        duplicate_er.`replaced_entry_id` = capcut.`id`
        OR LOWER(duplicate_er.`raw_name`) = 'capcut'
      )
  )
GROUP BY kdenlive.`id`, capcut.`id`;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT
  capcut.`id`,
  mc.`category_id`,
  mc.`id`,
  'open'
FROM `catalog_entries` capcut
JOIN `entry_categories` ec
  ON ec.`entry_id` = capcut.`id`
 AND ec.`category_id` = 'video-editing'
JOIN `matrix_criteria` mc
  ON mc.`category_id` = 'video-editing'
WHERE capcut.`slug` = 'capcut'
  AND capcut.`status` = 'us'
  AND capcut.`is_active` = 1;

INSERT INTO `schema_migrations` (`version`)
VALUES ('066-capcut-kdenlive-replacement');
