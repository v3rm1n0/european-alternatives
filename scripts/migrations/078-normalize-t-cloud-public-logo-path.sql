-- Migration 078: Normalize the T Cloud Public logo path.

UPDATE `catalog_entries`
SET `logo_path` = '/logos/t-cloud-public.svg'
WHERE `slug` = 't-cloud-public'
  AND COALESCE(`logo_path`, '') <> '/logos/t-cloud-public.svg';

INSERT INTO `schema_migrations` (`version`)
VALUES ('078-normalize-t-cloud-public-logo-path')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
