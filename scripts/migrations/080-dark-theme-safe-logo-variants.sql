-- Migration 080: Use dark-theme-safe logo variants for low-contrast logos.

UPDATE `catalog_entries`
SET `logo_path` = CASE `slug`
  WHEN 'bluecode' THEN '/logos/bluecode-dark-safe.png'
  WHEN 'collabora-online' THEN '/logos/collabora-online-dark-safe.png'
  WHEN 'deepl' THEN '/logos/deepl-dark-safe.png'
  WHEN 'disroot' THEN '/logos/disroot-dark-safe.png'
  WHEN 'duplicati' THEN '/logos/duplicati-dark-safe.png'
  WHEN 'filen' THEN '/logos/filen-dark-safe.png'
  WHEN 'freebsd' THEN '/logos/freebsd-dark-safe.png'
  WHEN 'gnu-taler' THEN '/logos/gnu-taler-dark-safe.png'
  WHEN 'hedgedoc' THEN '/logos/hedgedoc-dark-safe.png'
  WHEN 'hostinger' THEN '/logos/hostinger-dark-safe.png'
  WHEN 'internxt' THEN '/logos/internxt-dark-safe.png'
  WHEN 'ionos' THEN '/logos/ionos-dark-safe.png'
  WHEN 'matomo' THEN '/logos/matomo-dark-safe.png'
  WHEN 'mattermost' THEN '/logos/mattermost-dark-safe.png'
  WHEN 'mullvad-browser' THEN '/logos/mullvad-browser-dark-safe.png'
  WHEN 'mullvad-vpn' THEN '/logos/mullvad-vpn-dark-safe.png'
  WHEN 'netcup' THEN '/logos/netcup-dark-safe.png'
  WHEN 'opencloud' THEN '/logos/opencloud-dark-safe.png'
  WHEN 'opensearch' THEN '/logos/opensearch-dark-safe.png'
  WHEN 'organic-maps' THEN '/logos/organic-maps-dark-safe.png'
  WHEN 'ovhcloud' THEN '/logos/ovhcloud-dark-safe.png'
  WHEN 'paperless-ngx' THEN '/logos/paperless-ngx-dark-safe.png'
  WHEN 'pexip' THEN '/logos/pexip-dark-safe.png'
  WHEN 'piper' THEN '/logos/piper-dark-safe.png'
  WHEN 'qobuz' THEN '/logos/qobuz-dark-safe.png'
  WHEN 'sailfish-os' THEN '/logos/sailfish-os-dark-safe.png'
  WHEN 'scaleway' THEN '/logos/scaleway-dark-safe.png'
  WHEN 'tor-browser' THEN '/logos/tor-browser-dark-safe.png'
  WHEN 'tuta' THEN '/logos/tuta-dark-safe.png'
  WHEN 'xmpp' THEN '/logos/xmpp-dark-safe.png'
  WHEN 'zen-browser' THEN '/logos/zen-browser-dark-safe.png'
  ELSE `logo_path`
END
WHERE `slug` IN (
  'bluecode',
  'collabora-online',
  'deepl',
  'disroot',
  'duplicati',
  'filen',
  'freebsd',
  'gnu-taler',
  'hedgedoc',
  'hostinger',
  'internxt',
  'ionos',
  'matomo',
  'mattermost',
  'mullvad-browser',
  'mullvad-vpn',
  'netcup',
  'opencloud',
  'opensearch',
  'organic-maps',
  'ovhcloud',
  'paperless-ngx',
  'pexip',
  'piper',
  'qobuz',
  'sailfish-os',
  'scaleway',
  'tor-browser',
  'tuta',
  'xmpp',
  'zen-browser'
);

INSERT INTO `schema_migrations` (`version`)
VALUES ('080-dark-theme-safe-logo-variants')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
