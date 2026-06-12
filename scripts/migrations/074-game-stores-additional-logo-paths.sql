-- Migration 074: Add logo paths for additional Game Stores alternatives.

UPDATE `catalog_entries`
SET `logo_path` = CASE `slug`
  WHEN 'fanatical' THEN '/logos/fanatical.svg'
  WHEN 'green-man-gaming' THEN '/logos/green-man-gaming.svg'
  ELSE `logo_path`
END
WHERE `slug` IN (
  'fanatical',
  'green-man-gaming'
);

INSERT INTO `schema_migrations` (`version`)
VALUES ('074-game-stores-additional-logo-paths')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
