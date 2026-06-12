-- Migration 077: Backfill logo paths for active catalog entries.

UPDATE `catalog_entries`
SET `logo_path` = CASE `slug`
  WHEN '2fa' THEN '/logos/2fa.svg'
  WHEN 'addy.io' THEN '/logos/addy.io.svg'
  WHEN 'airvpn' THEN '/logos/airvpn.svg'
  WHEN 'aitch-systems' THEN '/logos/aitch-systems.svg'
  WHEN 'alfaview' THEN '/logos/alfaview.svg'
  WHEN 'aliasvault' THEN '/logos/aliasvault.svg'
  WHEN 'all-inkl' THEN '/logos/all-inkl.svg'
  WHEN 'alplink' THEN '/logos/alplink.svg'
  WHEN 'antennapod' THEN '/logos/antennapod.svg'
  WHEN 'anydesk' THEN '/logos/anydesk.svg'
  WHEN 'anytype' THEN '/logos/anytype.svg'
  WHEN 'artikel10-dns-resolver' THEN '/logos/artikel10-dns-resolver.svg'
  WHEN 'aurora-store' THEN '/logos/aurora-store.svg'
  WHEN 'authelia' THEN '/logos/authelia.svg'
  WHEN 'authentik' THEN '/logos/authentik.svg'
  WHEN 'aves-gallery' THEN '/logos/aves-gallery.svg'
  WHEN 'awork' THEN '/logos/awork.svg'
  WHEN 'axp-os' THEN '/logos/axp-os.svg'
  WHEN 'bbbserver' THEN '/logos/bbbserver.svg'
  WHEN 'betterbird' THEN '/logos/betterbird.svg'
  WHEN 'bigbluebutton' THEN '/logos/bigbluebutton.svg'
  WHEN 'birdychat' THEN '/logos/birdychat.svg'
  WHEN 'bitwarden' THEN '/logos/bitwarden.svg'
  WHEN 'black-com' THEN '/logos/black-com.svg'
  WHEN 'black-forest-labs' THEN '/logos/black-forest-labs.svg'
  WHEN 'blender' THEN '/logos/blender.svg'
  WHEN 'borgbackup' THEN '/logos/borgbackup.svg'
  WHEN 'briar' THEN '/logos/briar.svg'
  WHEN 'butterfly' THEN '/logos/butterfly.svg'
  WHEN 'co-maps' THEN '/logos/co-maps.svg'
  WHEN 'codeberg' THEN '/logos/codeberg.svg'
  WHEN 'collabora-online' THEN '/logos/collabora-online.svg'
  WHEN 'contabo' THEN '/logos/contabo.svg'
  WHEN 'conversations' THEN '/logos/conversations.svg'
  WHEN 'cryptomator' THEN '/logos/cryptomator.svg'
  WHEN 'cryptpad' THEN '/logos/cryptpad.svg'
  WHEN 'cyberghost-vpn' THEN '/logos/cyberghost-vpn.svg'
  WHEN 'dashserv' THEN '/logos/dashserv.svg'
  WHEN 'datalix' THEN '/logos/datalix.svg'
  WHEN 'datawrapper' THEN '/logos/datawrapper.svg'
  WHEN 'deepl' THEN '/logos/deepl.svg'
  WHEN 'delta-chat' THEN '/logos/delta-chat.svg'
  WHEN 'deltamaster' THEN '/logos/deltamaster.svg'
  WHEN 'diaspora' THEN '/logos/diaspora.svg'
  WHEN 'digitalcourage-dns-server' THEN '/logos/digitalcourage-dns-server.svg'
  WHEN 'digitale-gesellschaft-dns' THEN '/logos/digitale-gesellschaft-dns.svg'
  WHEN 'discourse' THEN '/logos/discourse.svg'
  WHEN 'dismail-dns' THEN '/logos/dismail-dns.svg'
  WHEN 'disroot' THEN '/logos/disroot.svg'
  WHEN 'dmarced' THEN '/logos/dmarced.svg'
  WHEN 'dns-sb' THEN '/logos/dns-sb.svg'
  WHEN 'dns4eu' THEN '/logos/dns4eu.svg'
  WHEN 'dnsforge' THEN '/logos/dnsforge.svg'
  WHEN 'dokku' THEN '/logos/dokku.svg'
  WHEN 'doodle-ch' THEN '/logos/doodle-ch.svg'
  WHEN 'duckdb' THEN '/logos/duckdb.svg'
  WHEN 'duplicati' THEN '/logos/duplicati.svg'
  WHEN 'e-os' THEN '/logos/e-os.svg'
  WHEN 'ecosia' THEN '/logos/ecosia.svg'
  WHEN 'element' THEN '/logos/element.svg'
  WHEN 'em-client' THEN '/logos/em-client.svg'
  WHEN 'email.eu' THEN '/logos/email.eu.svg'
  WHEN 'ente-auth' THEN '/logos/ente-auth.svg'
  WHEN 'ente-photos' THEN '/logos/ente-photos.svg'
  WHEN 'etar' THEN '/logos/etar.svg'
  WHEN 'ethora' THEN '/logos/ethora.svg'
  WHEN 'euria' THEN '/logos/euria.svg'
  WHEN 'eurollm' THEN '/logos/eurollm.svg'
  WHEN 'excalidraw' THEN '/logos/excalidraw.svg'
  WHEN 'eyou' THEN '/logos/eyou.svg'
  WHEN 'f-droid' THEN '/logos/f-droid.svg'
  WHEN 'fairemail' THEN '/logos/fairemail.svg'
  WHEN 'fairlytics' THEN '/logos/fairlytics.svg'
  WHEN 'fairphone' THEN '/logos/fairphone.svg'
  WHEN 'fckaf-de-mail' THEN '/logos/fckaf-de-mail.svg'
  WHEN 'feeder' THEN '/logos/feeder.svg'
  WHEN 'ffmuc-dns' THEN '/logos/ffmuc-dns.svg'
  WHEN 'fhem' THEN '/logos/fhem.svg'
  WHEN 'filen' THEN '/logos/filen.svg'
  WHEN 'finanzfluss-copilot' THEN '/logos/finanzfluss-copilot.svg'
  WHEN 'firefox' THEN '/logos/firefox.svg'
  WHEN 'fluxer' THEN '/logos/fluxer.svg'
  WHEN 'forgejo' THEN '/logos/forgejo.svg'
  WHEN 'foundation-for-applied-privacy-dns' THEN '/logos/foundation-for-applied-privacy-dns.svg'
  WHEN 'freebsd' THEN '/logos/freebsd.svg'
  WHEN 'freeipa' THEN '/logos/freeipa.svg'
  WHEN 'freeoffice' THEN '/logos/freeoffice.svg'
  WHEN 'freshrss' THEN '/logos/freshrss.svg'
  WHEN 'friendica' THEN '/logos/friendica.svg'
  WHEN 'gajim' THEN '/logos/gajim.svg'
  WHEN 'ghostfolio' THEN '/logos/ghostfolio.svg'
  WHEN 'gimp' THEN '/logos/gimp.svg'
  WHEN 'gitea' THEN '/logos/gitea.svg'
  WHEN 'gnu-taler' THEN '/logos/gnu-taler.svg'
  WHEN 'goneo' THEN '/logos/goneo.svg'
  WHEN 'grapheneos' THEN '/logos/grapheneos.svg'
  WHEN 'graphite' THEN '/logos/graphite.svg'
  WHEN 'hedgedoc' THEN '/logos/hedgedoc.svg'
  WHEN 'helium' THEN '/logos/helium.svg'
  WHEN 'herewego' THEN '/logos/herewego.svg'
  WHEN 'hetzner' THEN '/logos/hetzner.svg'
  WHEN 'hetzner-storage-box' THEN '/logos/hetzner-storage-box.svg'
  WHEN 'hetzner-storage-share' THEN '/logos/hetzner-storage-share.svg'
  WHEN 'heylogin' THEN '/logos/heylogin.svg'
  WHEN 'hidrive' THEN '/logos/hidrive.svg'
  WHEN 'hitkeep' THEN '/logos/hitkeep.svg'
  WHEN 'hostinger' THEN '/logos/hostinger.svg'
  WHEN 'immich' THEN '/logos/immich.svg'
  WHEN 'infomaniak' THEN '/logos/infomaniak.svg'
  WHEN 'inkscape' THEN '/logos/inkscape.svg'
  WHEN 'input-remapper' THEN '/logos/input-remapper.svg'
  WHEN 'internxt' THEN '/logos/internxt.svg'
  WHEN 'iobroker' THEN '/logos/iobroker.svg'
  WHEN 'iodeos' THEN '/logos/iodeos.svg'
  WHEN 'ionos' THEN '/logos/ionos.svg'
  WHEN 'ipv64' THEN '/logos/ipv64.svg'
  WHEN 'ivpn' THEN '/logos/ivpn.svg'
  WHEN 'jellyfin' THEN '/logos/jellyfin.svg'
  WHEN 'jolla-phone' THEN '/logos/jolla-phone.svg'
  WHEN 'joplin' THEN '/logos/joplin.svg'
  WHEN 'jottacloud' THEN '/logos/jottacloud.svg'
  WHEN 'kdenlive' THEN '/logos/kdenlive.svg'
  WHEN 'kdrive' THEN '/logos/kdrive.svg'
  WHEN 'keepass' THEN '/logos/keepass.svg'
  WHEN 'keepassxc' THEN '/logos/keepassxc.svg'
  WHEN 'keycloak' THEN '/logos/keycloak.svg'
  WHEN 'kimai' THEN '/logos/kimai.svg'
  WHEN 'kitchenowl' THEN '/logos/kitchenowl.svg'
  WHEN 'kmeet' THEN '/logos/kmeet.svg'
  WHEN 'koofr' THEN '/logos/koofr.svg'
  WHEN 'krita' THEN '/logos/krita.svg'
  WHEN 'ksuite' THEN '/logos/ksuite.svg'
  WHEN 'languagetool' THEN '/logos/languagetool.svg'
  WHEN 'lemmy' THEN '/logos/lemmy.svg'
  WHEN 'lettermint' THEN '/logos/lettermint.svg'
  WHEN 'liberapay' THEN '/logos/liberapay.svg'
  WHEN 'libreoffice' THEN '/logos/libreoffice.svg'
  WHEN 'librewolf' THEN '/logos/librewolf.svg'
  WHEN 'lineageos' THEN '/logos/lineageos.svg'
  WHEN 'localsend' THEN '/logos/localsend.svg'
  WHEN 'loops' THEN '/logos/loops.svg'
  WHEN 'lulu' THEN '/logos/lulu.svg'
  WHEN 'lumo' THEN '/logos/lumo.svg'
  WHEN 'lurus-ai' THEN '/logos/lurus-ai.svg'
  WHEN 'magic-earth' THEN '/logos/magic-earth.svg'
  WHEN 'mailbox-org' THEN '/logos/mailbox-org.svg'
  WHEN 'mailcow' THEN '/logos/mailcow.svg'
  WHEN 'mailfence' THEN '/logos/mailfence.svg'
  WHEN 'mapy-com' THEN '/logos/mapy-com.svg'
  WHEN 'mariadb' THEN '/logos/mariadb.svg'
  WHEN 'mastodon' THEN '/logos/mastodon.svg'
  WHEN 'matomo' THEN '/logos/matomo.svg'
  WHEN 'mattermost' THEN '/logos/mattermost.svg'
  WHEN 'meetergo' THEN '/logos/meetergo.svg'
  WHEN 'mistral' THEN '/logos/mistral.svg'
  WHEN 'modelhive' THEN '/logos/modelhive.svg'
  WHEN 'mojeek' THEN '/logos/mojeek.svg'
  WHEN 'moneystats' THEN '/logos/moneystats.svg'
  WHEN 'monnett' THEN '/logos/monnett.svg'
  WHEN 'mullvad-browser' THEN '/logos/mullvad-browser.svg'
  WHEN 'mullvad-vpn' THEN '/logos/mullvad-vpn.svg'
  WHEN 'mysql-community' THEN '/logos/mysql-community.svg'
  WHEN 'neo-store' THEN '/logos/neo-store.svg'
  WHEN 'neorg' THEN '/logos/neorg.svg'
  WHEN 'netbird' THEN '/logos/netbird.svg'
  WHEN 'netcup' THEN '/logos/netcup.svg'
  WHEN 'nextcloud' THEN '/logos/nextcloud.svg'
  WHEN 'nordvpn' THEN '/logos/nordvpn.svg'
  WHEN 'nostr' THEN '/logos/nostr.svg'
  WHEN 'office-eu' THEN '/logos/office-eu.svg'
  WHEN 'ollama' THEN '/logos/ollama.svg'
  WHEN 'opencal' THEN '/logos/opencal.svg'
  WHEN 'opencloud' THEN '/logos/opencloud.svg'
  WHEN 'opencut' THEN '/logos/opencut.svg'
  WHEN 'opendesk' THEN '/logos/opendesk.svg'
  WHEN 'openproject' THEN '/logos/openproject.svg'
  WHEN 'opensearch' THEN '/logos/opensearch.svg'
  WHEN 'openstreetmap' THEN '/logos/openstreetmap.svg'
  WHEN 'opentalk' THEN '/logos/opentalk.svg'
  WHEN 'org-roam' THEN '/logos/org-roam.svg'
  WHEN 'organic-maps' THEN '/logos/organic-maps.svg'
  WHEN 'osmand' THEN '/logos/osmand.svg'
  WHEN 'otto' THEN '/logos/otto.svg'
  WHEN 'overleaf' THEN '/logos/overleaf.svg'
  WHEN 'ovhcloud' THEN '/logos/ovhcloud.svg'
  WHEN 'paperless-ngx' THEN '/logos/paperless-ngx.svg'
  WHEN 'passbolt' THEN '/logos/passbolt.svg'
  WHEN 'pastely' THEN '/logos/pastely.svg'
  WHEN 'pcloud' THEN '/logos/pcloud.svg'
  WHEN 'peertube' THEN '/logos/peertube.svg'
  WHEN 'penpot' THEN '/logos/penpot.svg'
  WHEN 'ph24' THEN '/logos/ph24.svg'
  WHEN 'piper' THEN '/logos/piper.svg'
  WHEN 'pirsch' THEN '/logos/pirsch.svg'
  WHEN 'piwik-pro' THEN '/logos/piwik-pro.svg'
  WHEN 'pixelfed' THEN '/logos/pixelfed.svg'
  WHEN 'plankton' THEN '/logos/plankton.svg'
  WHEN 'plausible' THEN '/logos/plausible.svg'
  WHEN 'plees-tracker' THEN '/logos/plees-tracker.svg'
  WHEN 'portfolioperformance' THEN '/logos/portfolioperformance.svg'
  WHEN 'posteo' THEN '/logos/posteo.svg'
  WHEN 'postgresql' THEN '/logos/postgresql.svg'
  WHEN 'prestashop' THEN '/logos/prestashop.svg'
  WHEN 'primal' THEN '/logos/primal.svg'
  WHEN 'proton-authenticator' THEN '/logos/proton-authenticator.svg'
  WHEN 'proton-drive' THEN '/logos/proton-drive.svg'
  WHEN 'proton-mail' THEN '/logos/proton-mail.svg'
  WHEN 'proton-pass' THEN '/logos/proton-pass.svg'
  WHEN 'proton-vpn' THEN '/logos/proton-vpn.svg'
  WHEN 'proxmox' THEN '/logos/proxmox.svg'
  WHEN 'pubky' THEN '/logos/pubky.svg'
  WHEN 'qemu' THEN '/logos/qemu.svg'
  WHEN 'qgis' THEN '/logos/qgis.svg'
  WHEN 'qobuz' THEN '/logos/qobuz.svg'
  WHEN 'quad9' THEN '/logos/quad9.svg'
  WHEN 'qwant' THEN '/logos/qwant.svg'
  WHEN 'rabata' THEN '/logos/rabata.svg'
  WHEN 'radicle' THEN '/logos/radicle.svg'
  WHEN 'rclone' THEN '/logos/rclone.svg'
  WHEN 'readyou' THEN '/logos/readyou.svg'
  WHEN 'redmine' THEN '/logos/redmine.svg'
  WHEN 'replicant' THEN '/logos/replicant.svg'
  WHEN 'restena-public-dns-resolver' THEN '/logos/restena-public-dns-resolver.svg'
  WHEN 'restic' THEN '/logos/restic.svg'
  WHEN 'rocket-chat' THEN '/logos/rocket-chat.svg'
  WHEN 'rokk' THEN '/logos/rokk.svg'
  WHEN 'saber' THEN '/logos/saber.svg'
  WHEN 'sailfish-os' THEN '/logos/sailfish-os.svg'
  WHEN 'scaleway' THEN '/logos/scaleway.svg'
  WHEN CONCAT('schweizerdeutsch-', 'u', 'e', 'bersetzer') THEN CONCAT('/logos/schweizerdeutsch-', 'u', 'e', 'bersetzer.svg')
  WHEN 'scramble-cloud' THEN '/logos/scramble-cloud.svg'
  WHEN 'screenity' THEN '/logos/screenity.svg'
  WHEN 'seafile' THEN '/logos/seafile.svg'
  WHEN 'searxng' THEN '/logos/searxng.svg'
  WHEN 'session' THEN '/logos/session.svg'
  WHEN 'seven-io' THEN '/logos/seven-io.svg'
  WHEN 'shift-os-light' THEN '/logos/shift-os-light.svg'
  WHEN 'shift-phone' THEN '/logos/shift-phone.svg'
  WHEN 'shopware' THEN '/logos/shopware.svg'
  WHEN 'simple-analytics' THEN '/logos/simple-analytics.svg'
  WHEN 'simplevideo.eu' THEN '/logos/simplevideo.eu.svg'
  WHEN 'simplex' THEN '/logos/simplex.svg'
  WHEN 'soundcloud' THEN '/logos/soundcloud.svg'
  WHEN 'spamdrain' THEN '/logos/spamdrain.svg'
  WHEN 'stability-ai' THEN '/logos/stability-ai.svg'
  WHEN 'stackit' THEN '/logos/stackit.svg'
  WHEN 'stalwart-mail-server' THEN '/logos/stalwart-mail-server.svg'
  WHEN 'startmail' THEN '/logos/startmail.svg'
  WHEN 'stoat' THEN '/logos/stoat.svg'
  WHEN 'strato-mail' THEN '/logos/strato-mail.svg'
  WHEN 'stratum' THEN '/logos/stratum.svg'
  WHEN 'super-productivity' THEN '/logos/super-productivity.svg'
  WHEN 'supernote' THEN '/logos/supernote.svg'
  WHEN 'surfshark-vpn' THEN '/logos/surfshark-vpn.svg'
  WHEN 'swisstransfer' THEN '/logos/swisstransfer.svg'
  WHEN 'syncthing' THEN '/logos/syncthing.svg'
  WHEN 'taiga' THEN '/logos/taiga.svg'
  WHEN 'talos-linux' THEN '/logos/talos-linux.svg'
  WHEN 'technitium' THEN '/logos/technitium.svg'
  WHEN 'teleguard' THEN '/logos/teleguard.svg'
  WHEN 'threema' THEN '/logos/threema.svg'
  WHEN 'timescribe' THEN '/logos/timescribe.svg'
  WHEN 'tokeneurope-ai' THEN '/logos/tokeneurope-ai.svg'
  WHEN 'tolino' THEN '/logos/tolino.svg'
  WHEN 'tor-browser' THEN '/logos/tor-browser.svg'
  WHEN 'tresorit' THEN '/logos/tresorit.svg'
  WHEN 'trilium' THEN '/logos/trilium.svg'
  WHEN 'tuta' THEN '/logos/tuta.svg'
  WHEN 'uberspace' THEN '/logos/uberspace.svg'
  WHEN 'uncensoreddns' THEN '/logos/uncensoreddns.svg'
  WHEN 'upcloud' THEN '/logos/upcloud.svg'
  WHEN 'vaultwarden' THEN '/logos/vaultwarden.svg'
  WHEN 'viamichelin' THEN '/logos/viamichelin.svg'
  WHEN 'vikunja' THEN '/logos/vikunja.svg'
  WHEN 'vivaldi' THEN '/logos/vivaldi.svg'
  WHEN 'vivlio' THEN '/logos/vivlio.svg'
  WHEN 'volla-phone' THEN '/logos/volla-phone.svg'
  WHEN 'waveterm' THEN '/logos/waveterm.svg'
  WHEN 'wetransfer' THEN '/logos/wetransfer.svg'
  WHEN 'whydonate' THEN '/logos/whydonate.svg'
  WHEN 'wire' THEN '/logos/wire.svg'
  WHEN 'xmpp' THEN '/logos/xmpp.svg'
  WHEN 'xphone-connect' THEN '/logos/xphone-connect.svg'
  WHEN 'ypipe' THEN '/logos/ypipe.svg'
  WHEN 'zammad' THEN '/logos/zammad.svg'
  WHEN 'zapstore' THEN '/logos/zapstore.svg'
  WHEN 'zeitkapsl' THEN '/logos/zeitkapsl.svg'
  WHEN 'zen-browser' THEN '/logos/zen-browser.svg'
  WHEN 'zulip' THEN '/logos/zulip.svg'
  WHEN '1password' THEN '/logos/1password.svg'
  WHEN 'adobe-acrobat-sign' THEN '/logos/adobe-acrobat-sign.svg'
  WHEN 'adobe-analytics' THEN '/logos/adobe-analytics.svg'
  WHEN 'adobe-firefly' THEN '/logos/adobe-firefly.svg'
  WHEN 'adobe-illustrator' THEN '/logos/adobe-illustrator.svg'
  WHEN 'adobe-photoshop' THEN '/logos/adobe-photoshop.svg'
  WHEN 'adobe-premiere-pro' THEN '/logos/adobe-premiere-pro.svg'
  WHEN 'adobe-xd' THEN '/logos/adobe-xd.svg'
  WHEN 'airslate-signnow' THEN '/logos/airslate-signnow.svg'
  WHEN 'amazon' THEN '/logos/amazon.svg'
  WHEN 'amazon-alexa' THEN '/logos/amazon-alexa.svg'
  WHEN 'amazon-music' THEN '/logos/amazon-music.svg'
  WHEN 'amazon-polly' THEN '/logos/amazon-polly.svg'
  WHEN 'amazon-rds' THEN '/logos/amazon-rds.svg'
  WHEN 'amazon-s3' THEN '/logos/amazon-s3.svg'
  WHEN 'amazon-shop' THEN '/logos/amazon-shop.svg'
  WHEN 'amplitude' THEN '/logos/amplitude.svg'
  WHEN 'android' THEN '/logos/android.svg'
  WHEN 'anthropic' THEN '/logos/anthropic.svg'
  WHEN 'anylist' THEN '/logos/anylist.svg'
  WHEN 'apple' THEN '/logos/apple.svg'
  WHEN 'apple-app-store' THEN '/logos/apple-app-store.svg'
  WHEN 'apple-homekit' THEN '/logos/apple-homekit.svg'
  WHEN 'apple-icloud' THEN '/logos/apple-icloud.svg'
  WHEN 'apple-iphone' THEN '/logos/apple-iphone.svg'
  WHEN 'apple-macos' THEN '/logos/apple-macos.svg'
  WHEN 'apple-maps' THEN '/logos/apple-maps.svg'
  WHEN 'apple-music' THEN '/logos/apple-music.svg'
  WHEN 'apple-notes' THEN '/logos/apple-notes.svg'
  WHEN 'apple-photos' THEN '/logos/apple-photos.svg'
  WHEN 'apple-podcasts' THEN '/logos/apple-podcasts.svg'
  WHEN 'apple-watch' THEN '/logos/apple-watch.svg'
  WHEN 'arcgis' THEN '/logos/arcgis.svg'
  WHEN 'asana' THEN '/logos/asana.svg'
  WHEN 'atlassian' THEN '/logos/atlassian.svg'
  WHEN 'auth0' THEN '/logos/auth0.svg'
  WHEN 'authy' THEN '/logos/authy.svg'
  WHEN 'autodesk-3ds-max' THEN '/logos/autodesk-3ds-max.svg'
  WHEN 'autodesk-maya' THEN '/logos/autodesk-maya.svg'
  WHEN 'aws' THEN '/logos/aws.svg'
  WHEN 'aws-cognito' THEN '/logos/aws-cognito.svg'
  WHEN 'aws-translate' THEN '/logos/aws-translate.svg'
  WHEN 'azure-sql-database' THEN '/logos/azure-sql-database.svg'
  WHEN 'backblaze-b2' THEN '/logos/backblaze-b2.svg'
  WHEN 'bing' THEN '/logos/bing.svg'
  WHEN 'bitly' THEN '/logos/bitly.svg'
  WHEN 'block' THEN '/logos/block.svg'
  WHEN 'calendly' THEN '/logos/calendly.svg'
  WHEN 'capcut' THEN '/logos/capcut.svg'
  WHEN 'chatgpt' THEN '/logos/chatgpt.svg'
  WHEN 'chili-piper' THEN '/logos/chili-piper.svg'
  WHEN 'cisco' THEN '/logos/cisco.svg'
  WHEN 'cisco-webex' THEN '/logos/cisco-webex.svg'
  WHEN 'claude' THEN '/logos/claude.svg'
  WHEN 'claude-code' THEN '/logos/claude-code.svg'
  WHEN 'clockify' THEN '/logos/clockify.svg'
  WHEN 'cloudflare' THEN '/logos/cloudflare.svg'
  WHEN 'cloudflare-dns' THEN '/logos/cloudflare-dns.svg'
  WHEN 'cloudflare-r2' THEN '/logos/cloudflare-r2.svg'
  WHEN 'cloudflare-stream' THEN '/logos/cloudflare-stream.svg'
  WHEN 'cloudflare-web-analytics' THEN '/logos/cloudflare-web-analytics.svg'
  WHEN 'copilot-money' THEN '/logos/copilot-money.svg'
  WHEN 'cursor' THEN '/logos/cursor.svg'
  WHEN 'dashlane' THEN '/logos/dashlane.svg'
  WHEN 'davinci-resolve' THEN '/logos/davinci-resolve.svg'
  WHEN 'discord' THEN '/logos/discord.svg'
  WHEN 'docusign' THEN '/logos/docusign.svg'
  WHEN 'doodle' THEN '/logos/doodle.svg'
  WHEN 'doppler' THEN '/logos/doppler.svg'
  WHEN 'dropbox' THEN '/logos/dropbox.svg'
  WHEN 'dropbox-sign' THEN '/logos/dropbox-sign.svg'
  WHEN 'ebay' THEN '/logos/ebay.svg'
  WHEN 'electron' THEN '/logos/electron.svg'
  WHEN 'emby' THEN '/logos/emby.svg'
  WHEN 'evernote' THEN '/logos/evernote.svg'
  WHEN 'expressvpn' THEN '/logos/expressvpn.svg'
  WHEN 'facebook' THEN '/logos/facebook.svg'
  WHEN 'feedly' THEN '/logos/feedly.svg'
  WHEN 'figma' THEN '/logos/figma.svg'
  WHEN 'final-cut-pro' THEN '/logos/final-cut-pro.svg'
  WHEN 'fitbit' THEN '/logos/fitbit.svg'
  WHEN 'flipboard' THEN '/logos/flipboard.svg'
  WHEN 'flutterflow' THEN '/logos/flutterflow.svg'
  WHEN 'fortinet' THEN '/logos/fortinet.svg'
  WHEN 'garmin' THEN '/logos/garmin.svg'
  WHEN 'github' THEN '/logos/github.svg'
  WHEN 'github-copilot' THEN '/logos/github-copilot.svg'
  WHEN 'glasswire' THEN '/logos/glasswire.svg'
  WHEN 'gmail' THEN '/logos/gmail.svg'
  WHEN 'goauthentik' THEN '/logos/goauthentik.svg'
  WHEN 'gofundme' THEN '/logos/gofundme.svg'
  WHEN 'google' THEN '/logos/google.svg'
  WHEN 'google-ad-manager' THEN '/logos/google-ad-manager.svg'
  WHEN 'google-ads' THEN '/logos/google-ads.svg'
  WHEN 'google-adsense' THEN '/logos/google-adsense.svg'
  WHEN 'google-analytics' THEN '/logos/google-analytics.svg'
  WHEN 'google-authenticator' THEN '/logos/google-authenticator.svg'
  WHEN 'google-calendar' THEN '/logos/google-calendar.svg'
  WHEN 'google-chrome' THEN '/logos/google-chrome.svg'
  WHEN 'google-cloud' THEN '/logos/google-cloud.svg'
  WHEN 'google-cloud-sql' THEN '/logos/google-cloud-sql.svg'
  WHEN 'google-cloud-text-to-speech' THEN '/logos/google-cloud-text-to-speech.svg'
  WHEN 'google-docs' THEN '/logos/google-docs.svg'
  WHEN 'google-drive' THEN '/logos/google-drive.svg'
  WHEN 'google-gemini' THEN '/logos/google-gemini.svg'
  WHEN 'google-home' THEN '/logos/google-home.svg'
  WHEN 'google-imagen' THEN '/logos/google-imagen.svg'
  WHEN 'google-keep' THEN '/logos/google-keep.svg'
  WHEN 'google-lens' THEN '/logos/google-lens.svg'
  WHEN 'google-maps' THEN '/logos/google-maps.svg'
  WHEN 'google-meet' THEN '/logos/google-meet.svg'
  WHEN 'google-messages' THEN '/logos/google-messages.svg'
  WHEN 'google-photos' THEN '/logos/google-photos.svg'
  WHEN 'google-pixel' THEN '/logos/google-pixel.svg'
  WHEN 'google-play-store' THEN '/logos/google-play-store.svg'
  WHEN 'google-podcasts' THEN '/logos/google-podcasts.svg'
  WHEN 'google-public-dns' THEN '/logos/google-public-dns.svg'
  WHEN 'google-search' THEN '/logos/google-search.svg'
  WHEN 'google-translate' THEN '/logos/google-translate.svg'
  WHEN 'google-workspace' THEN '/logos/google-workspace.svg'
  WHEN 'grammarly' THEN '/logos/grammarly.svg'
  WHEN 'harvest' THEN '/logos/harvest.svg'
  WHEN 'hashicorp-vault' THEN '/logos/hashicorp-vault.svg'
  WHEN 'heroku' THEN '/logos/heroku.svg'
  WHEN 'imessage' THEN '/logos/imessage.svg'
  WHEN 'imovie' THEN '/logos/imovie.svg'
  WHEN 'instagram' THEN '/logos/instagram.svg'
  WHEN 'ios' THEN '/logos/ios.svg'
  WHEN 'jira' THEN '/logos/jira.svg'
  WHEN 'lastpass' THEN '/logos/lastpass.svg'
  WHEN 'line' THEN '/logos/line.svg'
  WHEN 'linear' THEN '/logos/linear.svg'
  WHEN 'linkedin' THEN '/logos/linkedin.svg'
  WHEN 'linktree' THEN '/logos/linktree.svg'
  WHEN 'loom' THEN '/logos/loom.svg'
  WHEN 'lose-it' THEN '/logos/lose-it.svg'
  WHEN 'mapbox' THEN '/logos/mapbox.svg'
  WHEN 'mastercard' THEN '/logos/mastercard.svg'
  WHEN 'meta' THEN '/logos/meta.svg'
  WHEN 'microsoft' THEN '/logos/microsoft.svg'
  WHEN 'microsoft-365' THEN '/logos/microsoft-365.svg'
  WHEN 'microsoft-active-directory' THEN '/logos/microsoft-active-directory.svg'
  WHEN 'microsoft-authenticator' THEN '/logos/microsoft-authenticator.svg'
  WHEN 'microsoft-azure' THEN '/logos/microsoft-azure.svg'
  WHEN 'microsoft-copilot' THEN '/logos/microsoft-copilot.svg'
  WHEN 'microsoft-edge' THEN '/logos/microsoft-edge.svg'
  WHEN 'microsoft-editor' THEN '/logos/microsoft-editor.svg'
  WHEN 'microsoft-entra-id' THEN '/logos/microsoft-entra-id.svg'
  WHEN 'microsoft-hyper-v' THEN '/logos/microsoft-hyper-v.svg'
  WHEN 'microsoft-mouse-and-keyboard-center' THEN '/logos/microsoft-mouse-and-keyboard-center.svg'
  WHEN 'microsoft-office' THEN '/logos/microsoft-office.svg'
  WHEN 'microsoft-onedrive' THEN '/logos/microsoft-onedrive.svg'
  WHEN 'microsoft-onenote' THEN '/logos/microsoft-onenote.svg'
  WHEN 'microsoft-outlook' THEN '/logos/microsoft-outlook.svg'
  WHEN 'microsoft-remote-desktop' THEN '/logos/microsoft-remote-desktop.svg'
  WHEN 'microsoft-sql-server' THEN '/logos/microsoft-sql-server.svg'
  WHEN 'microsoft-teams' THEN '/logos/microsoft-teams.svg'
  WHEN 'microsoft-translator' THEN '/logos/microsoft-translator.svg'
  WHEN 'microsoft-windows' THEN '/logos/microsoft-windows.svg'
  WHEN 'midjourney' THEN '/logos/midjourney.svg'
  WHEN 'mint' THEN '/logos/mint.svg'
  WHEN 'mixpanel' THEN '/logos/mixpanel.svg'
  WHEN 'monday-com' THEN '/logos/monday-com.svg'
  WHEN 'motion' THEN '/logos/motion.svg'
  WHEN 'mux' THEN '/logos/mux.svg'
  WHEN 'myfitnesspal' THEN '/logos/myfitnesspal.svg'
  WHEN 'nano-banana-pro' THEN '/logos/nano-banana-pro.svg'
  WHEN 'netgear' THEN '/logos/netgear.svg'
  WHEN 'notion' THEN '/logos/notion.svg'
  WHEN 'okta' THEN '/logos/okta.svg'
  WHEN 'openai' THEN '/logos/openai.svg'
  WHEN 'openai-dall-e' THEN '/logos/openai-dall-e.svg'
  WHEN 'opendns' THEN '/logos/opendns.svg'
  WHEN 'openrouter' THEN '/logos/openrouter.svg'
  WHEN 'oracle-database' THEN '/logos/oracle-database.svg'
  WHEN 'pandadoc' THEN '/logos/pandadoc.svg'
  WHEN 'paypal' THEN '/logos/paypal.svg'
  WHEN 'personal-capital' THEN '/logos/personal-capital.svg'
  WHEN 'pfsense' THEN '/logos/pfsense.svg'
  WHEN 'ping-identity' THEN '/logos/ping-identity.svg'
  WHEN 'plex' THEN '/logos/plex.svg'
  WHEN 'posthog' THEN '/logos/posthog.svg'
  WHEN 'postmark' THEN '/logos/postmark.svg'
  WHEN 'quicken' THEN '/logos/quicken.svg'
  WHEN 'quillbot' THEN '/logos/quillbot.svg'
  WHEN 'red5' THEN '/logos/red5.svg'
  WHEN 'reddit' THEN '/logos/reddit.svg'
  WHEN 'resend' THEN '/logos/resend.svg'
  WHEN 'retool' THEN '/logos/retool.svg'
  WHEN 'roam-research' THEN '/logos/roam-research.svg'
  WHEN 'safari' THEN '/logos/safari.svg'
  WHEN 'salesforce' THEN '/logos/salesforce.svg'
  WHEN 'samsung-smartthings' THEN '/logos/samsung-smartthings.svg'
  WHEN 'sendgrid' THEN '/logos/sendgrid.svg'
  WHEN 'shopify' THEN '/logos/shopify.svg'
  WHEN 'signal' THEN '/logos/signal.svg'
  WHEN 'sketch' THEN '/logos/sketch.svg'
  WHEN 'slack' THEN '/logos/slack.svg'
  WHEN 'spotify' THEN '/logos/spotify.svg'
  WHEN 'square' THEN '/logos/square.svg'
  WHEN 'stripe' THEN '/logos/stripe.svg'
  WHEN 'teamspeak' THEN '/logos/teamspeak.svg'
  WHEN 'telegram' THEN '/logos/telegram.svg'
  WHEN 'toggl-track' THEN '/logos/toggl-track.svg'
  WHEN 'trello' THEN '/logos/trello.svg'
  WHEN 'twilio' THEN '/logos/twilio.svg'
  WHEN 'twitch' THEN '/logos/twitch.svg'
  WHEN 'vimeo' THEN '/logos/vimeo.svg'
  WHEN 'visa' THEN '/logos/visa.svg'
  WHEN 'vmware-workstation' THEN '/logos/vmware-workstation.svg'
  WHEN 'waze' THEN '/logos/waze.svg'
  WHEN 'whatsapp' THEN '/logos/whatsapp.svg'
  WHEN 'windsurf' THEN '/logos/windsurf.svg'
  WHEN 'wowza' THEN '/logos/wowza.svg'
  WHEN 'x-corp' THEN '/logos/x-corp.svg'
  WHEN 'x-twitter' THEN '/logos/x-twitter.svg'
  WHEN 'yahoo' THEN '/logos/yahoo.svg'
  WHEN 'yahoo-mail' THEN '/logos/yahoo-mail.svg'
  WHEN 'ynab' THEN '/logos/ynab.svg'
  WHEN 'youtube' THEN '/logos/youtube.svg'
  WHEN 'youtube-music' THEN '/logos/youtube-music.svg'
  WHEN 'yubikey' THEN '/logos/yubikey.svg'
  WHEN 'zoom' THEN '/logos/zoom.svg'
  ELSE `logo_path`
END
WHERE `slug` IN (
  '2fa',
  'addy.io',
  'airvpn',
  'aitch-systems',
  'alfaview',
  'aliasvault',
  'all-inkl',
  'alplink',
  'antennapod',
  'anydesk',
  'anytype',
  'artikel10-dns-resolver',
  'aurora-store',
  'authelia',
  'authentik',
  'aves-gallery',
  'awork',
  'axp-os',
  'bbbserver',
  'betterbird',
  'bigbluebutton',
  'birdychat',
  'bitwarden',
  'black-com',
  'black-forest-labs',
  'blender',
  'borgbackup',
  'briar',
  'butterfly',
  'co-maps',
  'codeberg',
  'collabora-online',
  'contabo',
  'conversations',
  'cryptomator',
  'cryptpad',
  'cyberghost-vpn',
  'dashserv',
  'datalix',
  'datawrapper',
  'deepl',
  'delta-chat',
  'deltamaster',
  'diaspora',
  'digitalcourage-dns-server',
  'digitale-gesellschaft-dns',
  'discourse',
  'dismail-dns',
  'disroot',
  'dmarced',
  'dns-sb',
  'dns4eu',
  'dnsforge',
  'dokku',
  'doodle-ch',
  'duckdb',
  'duplicati',
  'e-os',
  'ecosia',
  'element',
  'em-client',
  'email.eu',
  'ente-auth',
  'ente-photos',
  'etar',
  'ethora',
  'euria',
  'eurollm',
  'excalidraw',
  'eyou',
  'f-droid',
  'fairemail',
  'fairlytics',
  'fairphone',
  'fckaf-de-mail',
  'feeder',
  'ffmuc-dns',
  'fhem',
  'filen',
  'finanzfluss-copilot',
  'firefox',
  'fluxer',
  'forgejo',
  'foundation-for-applied-privacy-dns',
  'freebsd',
  'freeipa',
  'freeoffice',
  'freshrss',
  'friendica',
  'gajim',
  'ghostfolio',
  'gimp',
  'gitea',
  'gnu-taler',
  'goneo',
  'grapheneos',
  'graphite',
  'hedgedoc',
  'helium',
  'herewego',
  'hetzner',
  'hetzner-storage-box',
  'hetzner-storage-share',
  'heylogin',
  'hidrive',
  'hitkeep',
  'hostinger',
  'immich',
  'infomaniak',
  'inkscape',
  'input-remapper',
  'internxt',
  'iobroker',
  'iodeos',
  'ionos',
  'ipv64',
  'ivpn',
  'jellyfin',
  'jolla-phone',
  'joplin',
  'jottacloud',
  'kdenlive',
  'kdrive',
  'keepass',
  'keepassxc',
  'keycloak',
  'kimai',
  'kitchenowl',
  'kmeet',
  'koofr',
  'krita',
  'ksuite',
  'languagetool',
  'lemmy',
  'lettermint',
  'liberapay',
  'libreoffice',
  'librewolf',
  'lineageos',
  'localsend',
  'loops',
  'lulu',
  'lumo',
  'lurus-ai',
  'magic-earth',
  'mailbox-org',
  'mailcow',
  'mailfence',
  'mapy-com',
  'mariadb',
  'mastodon',
  'matomo',
  'mattermost',
  'meetergo',
  'mistral',
  'modelhive',
  'mojeek',
  'moneystats',
  'monnett',
  'mullvad-browser',
  'mullvad-vpn',
  'mysql-community',
  'neo-store',
  'neorg',
  'netbird',
  'netcup',
  'nextcloud',
  'nordvpn',
  'nostr',
  'office-eu',
  'ollama',
  'opencal',
  'opencloud',
  'opencut',
  'opendesk',
  'openproject',
  'opensearch',
  'openstreetmap',
  'opentalk',
  'org-roam',
  'organic-maps',
  'osmand',
  'otto',
  'overleaf',
  'ovhcloud',
  'paperless-ngx',
  'passbolt',
  'pastely',
  'pcloud',
  'peertube',
  'penpot',
  'ph24',
  'piper',
  'pirsch',
  'piwik-pro',
  'pixelfed',
  'plankton',
  'plausible',
  'plees-tracker',
  'portfolioperformance',
  'posteo',
  'postgresql',
  'prestashop',
  'primal',
  'proton-authenticator',
  'proton-drive',
  'proton-mail',
  'proton-pass',
  'proton-vpn',
  'proxmox',
  'pubky',
  'qemu',
  'qgis',
  'qobuz',
  'quad9',
  'qwant',
  'rabata',
  'radicle',
  'rclone',
  'readyou',
  'redmine',
  'replicant',
  'restena-public-dns-resolver',
  'restic',
  'rocket-chat',
  'rokk',
  'saber',
  'sailfish-os',
  'scaleway',
  CONCAT('schweizerdeutsch-', 'u', 'e', 'bersetzer'),
  'scramble-cloud',
  'screenity',
  'seafile',
  'searxng',
  'session',
  'seven-io',
  'shift-os-light',
  'shift-phone',
  'shopware',
  'simple-analytics',
  'simplevideo.eu',
  'simplex',
  'soundcloud',
  'spamdrain',
  'stability-ai',
  'stackit',
  'stalwart-mail-server',
  'startmail',
  'stoat',
  'strato-mail',
  'stratum',
  'super-productivity',
  'supernote',
  'surfshark-vpn',
  'swisstransfer',
  'syncthing',
  'taiga',
  'talos-linux',
  'technitium',
  'teleguard',
  'threema',
  'timescribe',
  'tokeneurope-ai',
  'tolino',
  'tor-browser',
  'tresorit',
  'trilium',
  'tuta',
  'uberspace',
  'uncensoreddns',
  'upcloud',
  'vaultwarden',
  'viamichelin',
  'vikunja',
  'vivaldi',
  'vivlio',
  'volla-phone',
  'waveterm',
  'wetransfer',
  'whydonate',
  'wire',
  'xmpp',
  'xphone-connect',
  'ypipe',
  'zammad',
  'zapstore',
  'zeitkapsl',
  'zen-browser',
  'zulip',
  '1password',
  'adobe-acrobat-sign',
  'adobe-analytics',
  'adobe-firefly',
  'adobe-illustrator',
  'adobe-photoshop',
  'adobe-premiere-pro',
  'adobe-xd',
  'airslate-signnow',
  'amazon',
  'amazon-alexa',
  'amazon-music',
  'amazon-polly',
  'amazon-rds',
  'amazon-s3',
  'amazon-shop',
  'amplitude',
  'android',
  'anthropic',
  'anylist',
  'apple',
  'apple-app-store',
  'apple-homekit',
  'apple-icloud',
  'apple-iphone',
  'apple-macos',
  'apple-maps',
  'apple-music',
  'apple-notes',
  'apple-photos',
  'apple-podcasts',
  'apple-watch',
  'arcgis',
  'asana',
  'atlassian',
  'auth0',
  'authy',
  'autodesk-3ds-max',
  'autodesk-maya',
  'aws',
  'aws-cognito',
  'aws-translate',
  'azure-sql-database',
  'backblaze-b2',
  'bing',
  'bitly',
  'block',
  'calendly',
  'capcut',
  'chatgpt',
  'chili-piper',
  'cisco',
  'cisco-webex',
  'claude',
  'claude-code',
  'clockify',
  'cloudflare',
  'cloudflare-dns',
  'cloudflare-r2',
  'cloudflare-stream',
  'cloudflare-web-analytics',
  'copilot-money',
  'cursor',
  'dashlane',
  'davinci-resolve',
  'discord',
  'docusign',
  'doodle',
  'doppler',
  'dropbox',
  'dropbox-sign',
  'ebay',
  'electron',
  'emby',
  'evernote',
  'expressvpn',
  'facebook',
  'feedly',
  'figma',
  'final-cut-pro',
  'fitbit',
  'flipboard',
  'flutterflow',
  'fortinet',
  'garmin',
  'github',
  'github-copilot',
  'glasswire',
  'gmail',
  'goauthentik',
  'gofundme',
  'google',
  'google-ad-manager',
  'google-ads',
  'google-adsense',
  'google-analytics',
  'google-authenticator',
  'google-calendar',
  'google-chrome',
  'google-cloud',
  'google-cloud-sql',
  'google-cloud-text-to-speech',
  'google-docs',
  'google-drive',
  'google-gemini',
  'google-home',
  'google-imagen',
  'google-keep',
  'google-lens',
  'google-maps',
  'google-meet',
  'google-messages',
  'google-photos',
  'google-pixel',
  'google-play-store',
  'google-podcasts',
  'google-public-dns',
  'google-search',
  'google-translate',
  'google-workspace',
  'grammarly',
  'harvest',
  'hashicorp-vault',
  'heroku',
  'imessage',
  'imovie',
  'instagram',
  'ios',
  'jira',
  'lastpass',
  'line',
  'linear',
  'linkedin',
  'linktree',
  'loom',
  'lose-it',
  'mapbox',
  'mastercard',
  'meta',
  'microsoft',
  'microsoft-365',
  'microsoft-active-directory',
  'microsoft-authenticator',
  'microsoft-azure',
  'microsoft-copilot',
  'microsoft-edge',
  'microsoft-editor',
  'microsoft-entra-id',
  'microsoft-hyper-v',
  'microsoft-mouse-and-keyboard-center',
  'microsoft-office',
  'microsoft-onedrive',
  'microsoft-onenote',
  'microsoft-outlook',
  'microsoft-remote-desktop',
  'microsoft-sql-server',
  'microsoft-teams',
  'microsoft-translator',
  'microsoft-windows',
  'midjourney',
  'mint',
  'mixpanel',
  'monday-com',
  'motion',
  'mux',
  'myfitnesspal',
  'nano-banana-pro',
  'netgear',
  'notion',
  'okta',
  'openai',
  'openai-dall-e',
  'opendns',
  'openrouter',
  'oracle-database',
  'pandadoc',
  'paypal',
  'personal-capital',
  'pfsense',
  'ping-identity',
  'plex',
  'posthog',
  'postmark',
  'quicken',
  'quillbot',
  'red5',
  'reddit',
  'resend',
  'retool',
  'roam-research',
  'safari',
  'salesforce',
  'samsung-smartthings',
  'sendgrid',
  'shopify',
  'signal',
  'sketch',
  'slack',
  'spotify',
  'square',
  'stripe',
  'teamspeak',
  'telegram',
  'toggl-track',
  'trello',
  'twilio',
  'twitch',
  'vimeo',
  'visa',
  'vmware-workstation',
  'waze',
  'whatsapp',
  'windsurf',
  'wowza',
  'x-corp',
  'x-twitter',
  'yahoo',
  'yahoo-mail',
  'ynab',
  'youtube',
  'youtube-music',
  'yubikey',
  'zoom'
);

INSERT INTO `schema_migrations` (`version`)
VALUES ('077-active-catalog-logo-backfill')
ON DUPLICATE KEY UPDATE `version` = VALUES(`version`);
