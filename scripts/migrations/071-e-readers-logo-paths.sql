-- Migration 071: Add logo paths for the E-Readers category products.

UPDATE `catalog_entries`
SET `logo_path` = CASE `slug`
  WHEN 'amazon-kindle' THEN '/logos/amazon-kindle.svg'
  WHEN 'rakuten-kobo' THEN '/logos/rakuten-kobo.svg'
  WHEN 'boox' THEN '/logos/boox.svg'
  WHEN 'pocketbook' THEN '/logos/pocketbook.svg'
  WHEN 'remarkable' THEN '/logos/remarkable.svg'
  ELSE `logo_path`
END
WHERE `slug` IN (
  'amazon-kindle',
  'rakuten-kobo',
  'boox',
  'pocketbook',
  'remarkable'
);

INSERT INTO `schema_migrations` (`version`)
VALUES ('071-e-readers-logo-paths')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
