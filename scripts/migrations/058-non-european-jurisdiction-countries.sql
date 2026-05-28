-- Migration 058: Add non-European jurisdictions needed by comparison products.

INSERT IGNORE INTO `countries` (`code`, `label_en`, `label_de`, `sort_order`)
VALUES
  ('ae', 'United Arab Emirates', 'Vereinigte Arabische Emirate', 26),
  ('vg', 'British Virgin Islands', 'Britische Jungferninseln', 27);

INSERT INTO `schema_migrations` (`version`)
VALUES ('058-non-european-jurisdiction-countries');
