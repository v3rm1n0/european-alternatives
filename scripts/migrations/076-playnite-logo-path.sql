-- Migration 076: Add logo path for Playnite in Game Stores.

UPDATE `catalog_entries`
SET `logo_path` = '/logos/playnite.svg'
WHERE `slug` = 'playnite';

INSERT INTO `schema_migrations` (`version`)
VALUES ('076-playnite-logo-path')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
