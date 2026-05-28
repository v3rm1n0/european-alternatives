-- Migration 061: Fix remaining German inland adjective umlaut.

START TRANSACTION;

UPDATE `catalog_entries`
SET `description_de` = REPLACE(REPLACE(`description_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `description_de` IS NOT NULL;

UPDATE `categories`
SET `name_de` = REPLACE(REPLACE(`name_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `name_de` IS NOT NULL;

UPDATE `categories`
SET `description_de` = REPLACE(REPLACE(`description_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `description_de` IS NOT NULL;

UPDATE `countries`
SET `label_de` = REPLACE(REPLACE(`label_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `label_de` IS NOT NULL;

UPDATE `denied_decisions`
SET `text_de` = REPLACE(REPLACE(`text_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `text_de` IS NOT NULL;

UPDATE `landing_category_groups`
SET `name_de` = REPLACE(REPLACE(`name_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `name_de` IS NOT NULL;

UPDATE `landing_category_groups`
SET `description_de` = REPLACE(REPLACE(`description_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `description_de` IS NOT NULL;

UPDATE `matrix_criteria`
SET `label_de` = REPLACE(REPLACE(`label_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `label_de` IS NOT NULL;

UPDATE `matrix_criteria`
SET `help_text_de` = REPLACE(REPLACE(`help_text_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `help_text_de` IS NOT NULL;

UPDATE `matrix_criterion_groups`
SET `label_de` = REPLACE(REPLACE(`label_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `label_de` IS NOT NULL;

UPDATE `matrix_criterion_groups`
SET `description_de` = REPLACE(REPLACE(`description_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `description_de` IS NOT NULL;

UPDATE `matrix_criterion_options`
SET `label_de` = REPLACE(REPLACE(`label_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `label_de` IS NOT NULL;

UPDATE `positive_signals`
SET `text_de` = REPLACE(REPLACE(`text_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `text_de` IS NOT NULL;

UPDATE `reservations`
SET `text_de` = REPLACE(REPLACE(`text_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `text_de` IS NOT NULL;

UPDATE `tags`
SET `label_de` = REPLACE(REPLACE(`label_de`, CONCAT('i', 'n', 'l', 'a', 'e', 'n', 'd'), 'inländ'), CONCAT('I', 'n', 'l', 'a', 'e', 'n', 'd'), 'Inländ')
WHERE `label_de` IS NOT NULL;

INSERT INTO `schema_migrations` (`version`) VALUES ('061-fix-german-inland-umlaut');

COMMIT;
