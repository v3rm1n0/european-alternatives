import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "e-readers";
const migrationVersion = "070-e-readers-category-matrix";
const migrationUrl = new URL(
  "../scripts/migrations/070-e-readers-category-matrix.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

const expectedEntries = [
  "amazon-kindle",
  "rakuten-kobo",
  "boox",
  "pocketbook",
  "remarkable",
];

const expectedGroups = [
  "device_reading",
  "format_ecosystem",
  "software_sync",
  "privacy_account",
  "openness_repairability",
  "pricing_fit",
];

const expectedCriteria = [
  "screen_technology",
  "screen_size_range",
  "frontlight",
  "warm_light",
  "water_resistance",
  "stylus_support",
  "page_turn_buttons",
  "supported_formats",
  "drm_support",
  "store_integration",
  "library_borrowing",
  "sideloading",
  "audiobook_support",
  "operating_system",
  "third_party_apps",
  "cloud_sync_model",
  "note_export_formats",
  "handwriting_recognition",
  "account_requirement",
  "telemetry_model",
  "data_processing_location",
  "local_file_transfer",
  "account_deletion",
  "source_model",
  "repairability_model",
  "storage_expandable",
  "battery_serviceable",
  "device_price_tier",
  "subscription_required",
  "fit_profiles",
];

function expectLiteral(value: string): void {
  expect(sql).toContain(`'${value}'`);
}

function expectCriterionKey(key: string): void {
  const firstRow = sql.includes(`'${key}' AS criterion_key`);
  const unionRow = sql.includes(`'${key}',`);

  expect(firstRow || unionRow, `Expected criterion ${key}`).toBe(true);
}

describe("e-readers category and matrix migration", () => {
  it("adds the category, required countries, and landing group membership", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`countries`/i);
    expect(sql).toContain("'ca', 'Canada', 'Kanada'");
    expect(sql).toContain("'cn', 'China', 'China'");
    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`categories`/i);
    expectLiteral(categoryId);
    expect(sql).toContain("'E-Readers'");
    expect(normalizedSql).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`landing_group_categories`/i,
    );
    expect(sql).toContain("lg.`slug` = 'social-entertainment'");
  });

  it("creates Kindle, Kobo, BOOX, PocketBook, and reMarkable catalog entries", () => {
    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`catalog_entries`/i);

    for (const slug of expectedEntries) {
      expectLiteral(slug);
    }

    expect(sql).toContain("'Amazon Kindle'");
    expect(sql).toContain("'Rakuten Kobo'");
    expect(sql).toContain("'BOOX'");
    expect(sql).toContain("'PocketBook'");
    expect(sql).toContain("'reMarkable'");
    expect(normalizedSql).toMatch(
      /'pocketbook',\s*'alternative',\s*'research'/i,
    );
    expect(normalizedSql).toMatch(
      /'remarkable',\s*'alternative',\s*'research'/i,
    );
    expect(normalizedSql).toMatch(/'rakuten-kobo',\s*'us',\s*'us'/i);
    expect(normalizedSql).toMatch(/'boox',\s*'us',\s*'us'/i);
  });

  it("adds benchmark labels, category memberships, aliases, and Kindle replacements", () => {
    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`category_us_vendors`/i);
    expect(normalizedSql).toMatch(/'Amazon Kindle'\s+AS\s+`raw_name`,\s*0\s+AS\s+`sort_order`/i);
    expect(normalizedSql).toMatch(/'Rakuten Kobo',\s*1/i);
    expect(normalizedSql).toMatch(/'BOOX',\s*2/i);

    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`entry_categories`/i);
    expect(normalizedSql).toMatch(
      /CASE\s+WHEN\s+ce\.`slug`\s+IN\s+\('pocketbook',\s*'remarkable'\)\s+THEN\s+1\s+ELSE\s+0\s+END/i,
    );
    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`us_vendor_aliases`/i);
    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`entry_replacements`/i);
    expect(normalizedSql).toMatch(/alternative_entry\.`slug`\s+IN\s+\('pocketbook',\s*'remarkable'\)/i);
  });

  it("defines e-reader matrix groups, criteria, and enum options", () => {
    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`matrix_criterion_groups`/i);
    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`matrix_criteria`/i);
    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`matrix_criterion_options`/i);

    for (const groupKey of expectedGroups) {
      expectLiteral(groupKey);
    }

    for (const criterionKey of expectedCriteria) {
      expectCriterionKey(criterionKey);
    }

    for (const optionKey of [
      "epub",
      "adobe_drm",
      "amazon_store",
      "overdrive",
      "android",
      "mandatory_vendor_cloud",
      "required_device",
      "china",
      "proprietary",
      "premium_subscription",
      "distraction_free",
    ]) {
      expectLiteral(optionKey);
    }
  });

  it("initializes only open matrix fact placeholders for active alternatives and comparison products", () => {
    expect(normalizedSql).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`matrix_facts`\s+\(`entry_id`,\s*`category_id`,\s*`criterion_id`,\s*`status`\)/i,
    );
    expect(normalizedSql).toMatch(
      new RegExp(`ec\\.\`entry_id\`\\s*=\\s*ce\\.\`id\``, "i"),
    );
    expect(normalizedSql).toMatch(
      new RegExp(`ec\\.\`category_id\`\\s*=\\s*'${categoryId}'`, "i"),
    );
    expect(normalizedSql).toMatch(
      /ce\.`status`\s+IN\s+\('alternative',\s*'us'\)/i,
    );
    expect(normalizedSql).toMatch(/'open'/i);

    for (const forbidden of [
      "trust_score",
      "reservations",
      "positive_signals",
      "scoring_metadata",
      "value_bool",
      "value_number",
      "value_text",
      "value_json",
      "public_source_url",
    ]) {
      expect(normalizedSql).not.toMatch(new RegExp(`\\b${forbidden}\\b`, "i"));
    }
  });

  it("records the schema migration version", () => {
    expect(normalizedSql).toMatch(
      new RegExp(
        `INSERT\\s+INTO\\s+\`schema_migrations\`\\s+\\(\`version\`\\)\\s+VALUES\\s+\\('${migrationVersion}'\\)`,
        "i",
      ),
    );
  });
});
