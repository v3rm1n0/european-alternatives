-- Migration 075: Add logo path for Gamesplanet in Game Stores.

UPDATE `catalog_entries`
SET `logo_path` = '/logos/gamesplanet.svg'
WHERE `slug` = 'gamesplanet';

INSERT INTO `schema_migrations` (`version`)
VALUES ('075-gamesplanet-logo-path')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
