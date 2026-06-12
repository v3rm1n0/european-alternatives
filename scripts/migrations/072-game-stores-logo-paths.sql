-- Migration 072: Add logo paths for the Game Stores category products.

UPDATE `catalog_entries`
SET `logo_path` = CASE `slug`
  WHEN 'steam' THEN '/logos/steam.svg'
  WHEN 'epic-games-store' THEN '/logos/epic-games-store.svg'
  WHEN 'ea-app' THEN '/logos/ea-app.svg'
  WHEN 'ubisoft-connect' THEN '/logos/ubisoft-connect.svg'
  WHEN 'battle.net' THEN '/logos/battle.net.svg'
  WHEN 'xbox-app' THEN '/logos/xbox-app.svg'
  WHEN 'playstation-store' THEN '/logos/playstation-store.svg'
  WHEN 'amazon-game-studios' THEN '/logos/amazon-game-studios.svg'
  WHEN 'humble-bundle' THEN '/logos/humble-bundle.svg'
  WHEN 'gog' THEN '/logos/gog.svg'
  WHEN 'heroic-games-launcher' THEN '/logos/heroic-games-launcher.svg'
  WHEN 'lutris' THEN '/logos/lutris.svg'
  WHEN 'pegasus-frontend' THEN '/logos/pegasus-frontend.svg'
  WHEN 'eneba' THEN '/logos/eneba.svg'
  WHEN 'gamegator' THEN '/logos/gamegator.svg'
  WHEN 'game-jolt' THEN '/logos/game-jolt.svg'
  WHEN 'itch.io' THEN '/logos/itch.io.svg'
  ELSE `logo_path`
END
WHERE `slug` IN (
  'steam',
  'epic-games-store',
  'ea-app',
  'ubisoft-connect',
  'battle.net',
  'xbox-app',
  'playstation-store',
  'amazon-game-studios',
  'humble-bundle',
  'gog',
  'heroic-games-launcher',
  'lutris',
  'pegasus-frontend',
  'eneba',
  'gamegator',
  'game-jolt',
  'itch.io'
);

INSERT INTO `schema_migrations` (`version`)
VALUES ('072-game-stores-logo-paths')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
