-- Migration 079: Use visible, self-contained logo assets for entries with blank-rendering logos.

UPDATE `catalog_entries`
SET `logo_path` = CASE `slug`
  WHEN 'vaultwarden' THEN '/logos/vaultwarden-logo.svg'
  WHEN 'codeberg' THEN '/logos/codeberg-logo.svg'
  WHEN 'iodeos' THEN '/logos/iodeos-logo.svg'
  WHEN 'piwik-pro' THEN '/logos/piwik-pro-logo.svg'
  ELSE `logo_path`
END
WHERE `slug` IN (
  'vaultwarden',
  'codeberg',
  'iodeos',
  'piwik-pro'
);

INSERT INTO `schema_migrations` (`version`)
VALUES ('079-visible-logo-assets')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
