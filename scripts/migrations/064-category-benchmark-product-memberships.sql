-- Migration 064: Attach category benchmark products as product-level matrix rows.

INSERT IGNORE INTO `countries` (`code`, `label_en`, `label_de`, `sort_order`)
VALUES
  ('au', 'Australia', 'Australien', 28),
  ('jp', 'Japan', 'Japan', 29);

CREATE TEMPORARY TABLE `tmp_category_benchmark_products` (
  `category_id` VARCHAR(50) NOT NULL,
  `raw_name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `country_code` VARCHAR(5) NOT NULL,
  `website_url` VARCHAR(2048) NOT NULL,
  `old_slug` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`category_id`, `raw_name`)
) ENGINE=Memory;

INSERT INTO `tmp_category_benchmark_products`
  (`category_id`, `raw_name`, `slug`, `name`, `country_code`, `website_url`, `old_slug`)
VALUES
  ('cloud-storage', 'OneDrive', 'microsoft-onedrive', 'Microsoft OneDrive', 'us', 'https://www.microsoft.com/microsoft-365/onedrive/online-cloud-storage', 'microsoft'),
  ('email', 'Outlook.com', 'microsoft-outlook', 'Microsoft Outlook', 'us', 'https://www.microsoft.com/microsoft-365/outlook/email-and-calendar-software-microsoft-outlook', 'microsoft'),
  ('email', 'Outlook', 'microsoft-outlook', 'Microsoft Outlook', 'us', 'https://www.microsoft.com/microsoft-365/outlook/email-and-calendar-software-microsoft-outlook', 'microsoft'),
  ('email', 'Yahoo Mail', 'yahoo-mail', 'Yahoo Mail', 'us', 'https://mail.yahoo.com/', 'yahoo'),
  ('mail-client', 'Microsoft Outlook (Desktop)', 'microsoft-outlook', 'Microsoft Outlook', 'us', 'https://www.microsoft.com/microsoft-365/outlook/email-and-calendar-software-microsoft-outlook', 'microsoft'),
  ('mail-client', 'Outlook', 'microsoft-outlook', 'Microsoft Outlook', 'us', 'https://www.microsoft.com/microsoft-365/outlook/email-and-calendar-software-microsoft-outlook', 'microsoft'),
  ('social-media', 'Facebook', 'facebook', 'Facebook', 'us', 'https://www.facebook.com/', 'meta'),
  ('social-media', 'Instagram', 'instagram', 'Instagram', 'us', 'https://www.instagram.com/', 'meta'),
  ('social-media', 'X/Twitter', 'x-twitter', 'X/Twitter', 'us', 'https://x.com/', 'x-corp'),
  ('social-media', 'LinkedIn', 'linkedin', 'LinkedIn', 'us', 'https://www.linkedin.com/', 'microsoft'),
  ('social-media', 'Facebook Groups', 'facebook', 'Facebook', 'us', 'https://www.facebook.com/groups/', 'meta'),
  ('meeting-software', 'Microsoft Teams', 'microsoft-teams', 'Microsoft Teams', 'us', 'https://www.microsoft.com/microsoft-teams/', 'microsoft'),
  ('office-suite', 'Microsoft Office', 'microsoft-office', 'Microsoft Office', 'us', 'https://www.microsoft.com/microsoft-365/microsoft-office', 'microsoft'),
  ('maps', 'Waze', 'waze', 'Waze', 'us', 'https://www.waze.com/', 'google'),
  ('browser', 'Edge', 'microsoft-edge', 'Microsoft Edge', 'us', 'https://www.microsoft.com/edge', 'microsoft'),
  ('dns', 'Google DNS', 'google-public-dns', 'Google Public DNS', 'us', 'https://dns.google/', NULL),
  ('dns', 'Cloudflare DNS', 'cloudflare-dns', 'Cloudflare DNS', 'us', 'https://one.one.one.one/dns/', NULL),
  ('dns', 'OpenDNS', 'opendns', 'OpenDNS', 'us', 'https://www.opendns.com/', NULL),
  ('project-management', 'Jira', 'jira', 'Jira', 'us', 'https://www.atlassian.com/software/jira', 'atlassian'),
  ('project-management', 'Trello', 'trello', 'Trello', 'us', 'https://trello.com/', NULL),
  ('writing-assistant', 'Grammarly', 'grammarly', 'Grammarly', 'us', 'https://www.grammarly.com/', NULL),
  ('writing-assistant', 'Microsoft Editor', 'microsoft-editor', 'Microsoft Editor', 'us', 'https://www.microsoft.com/microsoft-365/microsoft-editor', NULL),
  ('writing-assistant', 'QuillBot', 'quillbot', 'QuillBot', 'us', 'https://quillbot.com/', NULL),
  ('translation', 'Google Lens', 'google-lens', 'Google Lens', 'us', 'https://lens.google/', NULL),
  ('translation', 'Microsoft Translator', 'microsoft-translator', 'Microsoft Translator', 'us', 'https://www.microsoft.com/translator/', NULL),
  ('image-generation', 'OpenAI DALL-E', 'openai-dall-e', 'OpenAI DALL-E', 'us', 'https://openai.com/dall-e/', 'openai'),
  ('image-generation', 'Google Imagen', 'google-imagen', 'Google Imagen', 'us', 'https://deepmind.google/models/imagen/', NULL),
  ('image-generation', 'Adobe Firefly', 'adobe-firefly', 'Adobe Firefly', 'us', 'https://www.adobe.com/products/firefly.html', NULL),
  ('ai-ml', 'ChatGPT', 'chatgpt', 'ChatGPT', 'us', 'https://chatgpt.com/', NULL),
  ('ai-ml', 'Claude', 'claude', 'Claude', 'us', 'https://claude.ai/', NULL),
  ('ai-ml', 'Gemini', 'google-gemini', 'Google Gemini', 'us', 'https://gemini.google.com/', NULL),
  ('hosting', 'Azure', 'microsoft-azure', 'Microsoft Azure', 'us', 'https://azure.microsoft.com/', 'microsoft'),
  ('databases', 'Oracle Database', 'oracle-database', 'Oracle Database', 'us', 'https://www.oracle.com/database/', NULL),
  ('databases', 'Microsoft SQL Server', 'microsoft-sql-server', 'Microsoft SQL Server', 'us', 'https://www.microsoft.com/sql-server/', NULL),
  ('databases', 'Amazon RDS', 'amazon-rds', 'Amazon RDS', 'us', 'https://aws.amazon.com/rds/', NULL),
  ('databases', 'Google Cloud SQL', 'google-cloud-sql', 'Google Cloud SQL', 'us', 'https://cloud.google.com/sql', NULL),
  ('databases', 'Azure SQL Database', 'azure-sql-database', 'Azure SQL Database', 'us', 'https://azure.microsoft.com/products/azure-sql/database', NULL),
  ('payments', 'Square', 'square', 'Square', 'us', 'https://squareup.com/', 'block'),
  ('version-control', 'GitLab', 'gitlab', 'GitLab', 'us', 'https://about.gitlab.com/', NULL),
  ('iam', 'Okta', 'okta', 'Okta', 'us', 'https://www.okta.com/', NULL),
  ('iam', 'Azure AD', 'microsoft-entra-id', 'Microsoft Entra ID', 'us', 'https://www.microsoft.com/security/business/microsoft-entra', NULL),
  ('iam', 'Entra ID', 'microsoft-entra-id', 'Microsoft Entra ID', 'us', 'https://www.microsoft.com/security/business/microsoft-entra', NULL),
  ('iam', 'Ping Identity', 'ping-identity', 'Ping Identity', 'us', 'https://www.pingidentity.com/', NULL),
  ('iam', 'Auth0', 'auth0', 'Auth0', 'us', 'https://auth0.com/', NULL),
  ('music-streaming', 'Apple Music', 'apple-music', 'Apple Music', 'us', 'https://music.apple.com/', NULL),
  ('music-streaming', 'YouTube Music', 'youtube-music', 'YouTube Music', 'us', 'https://music.youtube.com/', 'youtube'),
  ('app-stores', 'Google Play Store', 'google-play-store', 'Google Play Store', 'us', 'https://play.google.com/store', NULL),
  ('app-stores', 'Apple App Store', 'apple-app-store', 'Apple App Store', 'us', 'https://www.apple.com/app-store/', NULL),
  ('smartphones', 'Apple iPhone', 'apple-iphone', 'Apple iPhone', 'us', 'https://www.apple.com/iphone/', NULL),
  ('smartphones', 'Google Pixel', 'google-pixel', 'Google Pixel', 'us', 'https://store.google.com/category/phones', NULL),
  ('note-taking', 'Evernote', 'evernote', 'Evernote', 'us', 'https://evernote.com/', NULL),
  ('note-taking', 'Microsoft OneNote', 'microsoft-onenote', 'Microsoft OneNote', 'us', 'https://www.onenote.com/', NULL),
  ('note-taking', 'Apple Notes', 'apple-notes', 'Apple Notes', 'us', 'https://www.icloud.com/notes', NULL),
  ('note-taking', 'Google Keep', 'google-keep', 'Google Keep', 'us', 'https://keep.google.com/', NULL),
  ('note-taking', 'Roam Research', 'roam-research', 'Roam Research', 'us', 'https://roamresearch.com/', NULL),
  ('media-server', 'Plex', 'plex', 'Plex', 'us', 'https://www.plex.tv/', NULL),
  ('media-server', 'Emby', 'emby', 'Emby', 'us', 'https://emby.media/', NULL),
  ('feed-reader', 'Feedly', 'feedly', 'Feedly', 'us', 'https://feedly.com/', NULL),
  ('feed-reader', 'Flipboard', 'flipboard', 'Flipboard', 'us', 'https://flipboard.com/', NULL),
  ('scheduling', 'Calendly', 'calendly', 'Calendly', 'us', 'https://calendly.com/', NULL),
  ('personal-finance', 'Mint', 'mint', 'Mint', 'us', 'https://mint.intuit.com/', NULL),
  ('personal-finance', 'Personal Capital', 'personal-capital', 'Personal Capital', 'us', 'https://www.empower.com/personal-investors/financial-tools', NULL),
  ('personal-finance', 'Quicken', 'quicken', 'Quicken', 'us', 'https://www.quicken.com/', NULL),
  ('personal-finance', 'YNAB', 'ynab', 'YNAB', 'us', 'https://www.ynab.com/', NULL),
  ('virtualization', 'VMware', 'vmware-workstation', 'VMware Workstation', 'us', 'https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion', NULL),
  ('virtualization', 'Microsoft Hyper-V', 'microsoft-hyper-v', 'Microsoft Hyper-V', 'us', 'https://learn.microsoft.com/windows-server/virtualization/hyper-v/hyper-v-on-windows-server', NULL),
  ('design', 'Figma', 'figma', 'Figma', 'us', 'https://www.figma.com/', NULL),
  ('design', 'Adobe XD', 'adobe-xd', 'Adobe XD', 'us', 'https://www.adobe.com/products/xd.html', NULL),
  ('design', 'Adobe Photoshop', 'adobe-photoshop', 'Adobe Photoshop', 'us', 'https://www.adobe.com/products/photoshop.html', NULL),
  ('design', 'Sketch', 'sketch', 'Sketch', 'nl', 'https://www.sketch.com/', NULL),
  ('video-editing', 'Adobe Premiere Pro', 'adobe-premiere-pro', 'Adobe Premiere Pro', 'us', 'https://www.adobe.com/products/premiere.html', NULL),
  ('video-editing', 'Final Cut Pro', 'final-cut-pro', 'Final Cut Pro', 'us', 'https://www.apple.com/final-cut-pro/', NULL),
  ('video-editing', 'DaVinci Resolve', 'davinci-resolve', 'DaVinci Resolve', 'au', 'https://www.blackmagicdesign.com/products/davinciresolve', NULL),
  ('video-editing', 'iMovie', 'imovie', 'iMovie', 'us', 'https://www.apple.com/imovie/', NULL),
  ('gis', 'ArcGIS', 'arcgis', 'ArcGIS', 'us', 'https://www.esri.com/en-us/arcgis/about-arcgis/overview', NULL),
  ('privacy-tools', 'GlassWire', 'glasswire', 'GlassWire', 'us', 'https://www.glasswire.com/', NULL),
  ('podcasts', 'Apple Podcasts', 'apple-podcasts', 'Apple Podcasts', 'us', 'https://www.apple.com/apple-podcasts/', NULL),
  ('podcasts', 'Spotify', 'spotify', 'Spotify', 'se', 'https://www.spotify.com/', NULL),
  ('photo-management', 'Apple Photos', 'apple-photos', 'Apple Photos', 'us', 'https://www.apple.com/icloud/photos/', 'apple'),
  ('photo-management', 'Google Photos', 'google-photos', 'Google Photos', 'us', 'https://photos.google.com/', 'google');

INSERT IGNORE INTO `catalog_entries`
  (`slug`, `status`, `source_file`, `is_active`, `name`, `description_en`, `description_de`, `country_code`, `website_url`, `pricing`, `is_open_source`, `open_source_level`, `self_hostable`)
SELECT DISTINCT
  m.`slug`,
  'us',
  'us',
  1,
  m.`name`,
  CONCAT(m.`name`, ' is included as a benchmark comparison product for category matrices.'),
  CONCAT(m.`name`, ' wird als Benchmark-Vergleichsprodukt in Kategorie-Matrizen geführt.'),
  m.`country_code`,
  m.`website_url`,
  NULL,
  0,
  'none',
  0
FROM `tmp_category_benchmark_products` m;

UPDATE `category_us_vendors` cuv
JOIN `tmp_category_benchmark_products` m
  ON m.`category_id` = cuv.`category_id`
 AND m.`raw_name` = cuv.`raw_name`
JOIN `catalog_entries` ce
  ON ce.`slug` = m.`slug`
SET cuv.`entry_id` = ce.`id`;

DELETE ec
FROM `entry_categories` ec
JOIN `catalog_entries` old_ce
  ON old_ce.`id` = ec.`entry_id`
JOIN `tmp_category_benchmark_products` m
  ON m.`category_id` = ec.`category_id`
 AND m.`old_slug` = old_ce.`slug`;

INSERT IGNORE INTO `entry_categories`
  (`entry_id`, `category_id`, `is_primary`, `sort_order`)
SELECT DISTINCT
  ce.`id`,
  m.`category_id`,
  0,
  cuv.`sort_order`
FROM `tmp_category_benchmark_products` m
JOIN `catalog_entries` ce
  ON ce.`slug` = m.`slug`
JOIN `category_us_vendors` cuv
  ON cuv.`category_id` = m.`category_id`
 AND cuv.`raw_name` = m.`raw_name`
WHERE ce.`status` = 'us'
  AND ce.`is_active` = 1;

INSERT IGNORE INTO `us_vendor_aliases` (`alias`, `entry_id`)
SELECT DISTINCT m.`raw_name`, ce.`id`
FROM `tmp_category_benchmark_products` m
JOIN `catalog_entries` ce
  ON ce.`slug` = m.`slug`;

INSERT IGNORE INTO `us_vendor_aliases` (`alias`, `entry_id`)
SELECT DISTINCT m.`name`, ce.`id`
FROM `tmp_category_benchmark_products` m
JOIN `catalog_entries` ce
  ON ce.`slug` = m.`slug`;

INSERT IGNORE INTO `matrix_facts` (`entry_id`, `category_id`, `criterion_id`, `status`)
SELECT
  ce.`id`,
  mc.`category_id`,
  mc.`id`,
  'open'
FROM `catalog_entries` ce
JOIN `entry_categories` ec
  ON ec.`entry_id` = ce.`id`
JOIN `matrix_criteria` mc
  ON mc.`category_id` = ec.`category_id`
WHERE ce.`status` IN ('alternative', 'us')
  AND ce.`is_active` = 1;

DROP TEMPORARY TABLE `tmp_category_benchmark_products`;

INSERT INTO `schema_migrations` (`version`)
VALUES ('064-category-benchmark-product-memberships');
