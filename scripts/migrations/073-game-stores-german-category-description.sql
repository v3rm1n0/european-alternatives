-- Migration 073: Fix German Game Stores category description after migration 067.

UPDATE `categories`
SET
  `name_de` = 'Game-Stores & Launcher',
  `description_de` = 'Game-Stores, Launcher, Bibliotheksmanager und Kompatibilitäts-Runner'
WHERE `id` = 'game-stores';

INSERT INTO `schema_migrations` (`version`)
VALUES ('073-game-stores-german-category-description')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
