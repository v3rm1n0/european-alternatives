import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  new URL(
    "../scripts/migrations/064-category-benchmark-product-memberships.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("category benchmark product memberships migration", () => {
  it("creates product-level benchmark rows for categories that had missing US rows", () => {
    for (const expected of [
      "'dns', 'Google DNS', 'google-public-dns'",
      "'writing-assistant', 'Grammarly', 'grammarly'",
      "'databases', 'Oracle Database', 'oracle-database'",
      "'iam', 'Azure AD', 'microsoft-entra-id'",
      "'app-stores', 'Apple App Store', 'apple-app-store'",
      "'smartphones', 'Google Pixel', 'google-pixel'",
      "'media-server', 'Plex', 'plex'",
      "'feed-reader', 'Flipboard', 'flipboard'",
      "'scheduling', 'Calendly', 'calendly'",
      "'personal-finance', 'YNAB', 'ynab'",
      "'virtualization', 'Microsoft Hyper-V', 'microsoft-hyper-v'",
      "'video-editing', 'DaVinci Resolve', 'davinci-resolve'",
      "'gis', 'ArcGIS', 'arcgis'",
      "'privacy-tools', 'GlassWire', 'glasswire'",
      "'podcasts', 'Spotify', 'spotify'",
    ]) {
      expect(sql).toContain(expected);
    }
  });

  it("normalizes broad vendor category mappings to concrete products", () => {
    for (const expected of [
      "'cloud-storage', 'OneDrive', 'microsoft-onedrive'",
      "'email', 'Outlook.com', 'microsoft-outlook'",
      "'email', 'Yahoo Mail', 'yahoo-mail'",
      "'meeting-software', 'Microsoft Teams', 'microsoft-teams'",
      "'maps', 'Waze', 'waze'",
      "'browser', 'Edge', 'microsoft-edge'",
      "'project-management', 'Jira', 'jira'",
      "'payments', 'Square', 'square'",
      "'music-streaming', 'YouTube Music', 'youtube-music'",
      "'photo-management', 'Google Photos', 'google-photos'",
    ]) {
      expect(sql).toContain(expected);
    }

    expect(sql).toMatch(/DELETE\s+ec\s+FROM\s+`entry_categories`\s+ec/i);
    expect(sql).toContain("m.`old_slug` = old_ce.`slug`");
  });

  it("links category_us_vendors, creates memberships, aliases, and open facts", () => {
    expect(sql).toMatch(/UPDATE\s+`category_us_vendors`\s+cuv[\s\S]+SET\s+cuv\.`entry_id`\s*=\s*ce\.`id`/i);
    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`entry_categories`/i);
    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`us_vendor_aliases`/i);
    expect(sql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`matrix_facts`/i);
    expect(sql).toContain("'064-category-benchmark-product-memberships'");
  });
});
