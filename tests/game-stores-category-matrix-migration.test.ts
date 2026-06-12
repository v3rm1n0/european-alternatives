import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const categoryId = "game-stores";
const migrationVersion = "067-game-stores-category-matrix";
const migrationUrl = new URL(
  "../scripts/migrations/067-game-stores-category-matrix.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const sql = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const normalizedSql = sql.replace(/\s+/g, " ").trim();

const expectedGroups = [
  "store_catalog",
  "launcher_runner",
  "ownership_access",
  "platforms_devices",
  "social_multiplayer",
  "creator_developer",
  "privacy_account",
  "pricing_fit",
];

const expectedCriteria = [
  "catalog_role",
  "game_catalog_model",
  "direct_game_sales",
  "third_party_key_sales",
  "drm_free_catalog",
  "user_generated_games",
  "library_aggregation",
  "external_store_launch",
  "compatibility_layer_support",
  "runner_management",
  "cloud_saves_sync",
  "drm_model",
  "offline_play",
  "account_required_play",
  "game_backup_export",
  "supported_platforms",
  "native_linux_support",
  "web_storefront",
  "mobile_app",
  "friends_chat",
  "achievements",
  "multiplayer_matchmaking",
  "mods_addons_support",
  "parental_controls",
  "developer_publishing",
  "revenue_share_model",
  "payout_regions",
  "developer_analytics",
  "community_pages",
  "account_required_browse",
  "store_telemetry",
  "public_profile_controls",
  "data_export_available",
  "account_deletion",
  "pricing_model",
  "free_tier_available",
  "fit_profiles",
];

const optionBackedCriteria = [
  "catalog_role",
  "game_catalog_model",
  "library_aggregation",
  "compatibility_layer_support",
  "drm_model",
  "account_required_play",
  "supported_platforms",
  "revenue_share_model",
  "payout_regions",
  "store_telemetry",
  "pricing_model",
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

describe("game stores category and matrix migration", () => {
  it("adds the category, Brazil country row, and landing group membership", () => {
    expect(migrationExists).toBe(true);
    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`countries`/i);
    expect(sql).toContain("'br', 'Brazil', 'Brasilien'");
    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`categories`/i);
    expect(sql).toContain("'game-stores'");
    expect(sql).toContain("'Game Stores & Launchers'");
    expect(sql).toContain("'Game-Stores & Launcher'");
    expect(normalizedSql).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`landing_group_categories`/i,
    );
    expect(sql).toContain("lg.`slug` = 'social-entertainment'");
  });

  it("declares benchmark labels without pre-inserting product rows", () => {
    for (const benchmark of [
      "Steam",
      "Epic Games Store",
      "EA app",
      "Ubisoft Connect",
      "Battle.net",
      "Xbox app",
      "PlayStation Store",
      "Amazon Games",
      "Humble Bundle",
    ]) {
      expectLiteral(benchmark);
    }

    expect(normalizedSql).toMatch(/INSERT\s+INTO\s+`category_us_vendors`/i);
    expect(normalizedSql).not.toMatch(/INSERT\s+INTO\s+`catalog_entries`/i);
  });

  it("defines game-store-specific matrix groups and criteria", () => {
    for (const groupKey of expectedGroups) {
      expectLiteral(groupKey);
    }

    for (const criterionKey of expectedCriteria) {
      expectCriterionKey(criterionKey);
    }

    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`matrix_criterion_groups`/i);
    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`matrix_criteria`/i);
    expect(normalizedSql).toMatch(/JOIN\s+`matrix_criterion_groups`\s+g/i);
    expect(normalizedSql).toMatch(
      new RegExp(`g\\.category_id\\s*=\\s*d\\.category_id`, "i"),
    );
  });

  it("provides enum options for every enum and multi-enum criterion", () => {
    expect(normalizedSql).toMatch(/INSERT\s+IGNORE\s+INTO\s+`matrix_criterion_options`/i);

    for (const criterionKey of optionBackedCriteria) {
      expectLiteral(criterionKey);
    }

    for (const optionKey of [
      "direct_storefront",
      "compatibility_runner",
      "drm_free_only",
      "mandatory_drm",
      "always_online",
      "steam_deck",
      "low_commission",
      "not_disclosed",
      "drm_free_buyers",
      "library_unification",
    ]) {
      expectLiteral(optionKey);
    }

    expect(sql).not.toContain("'unknown'");
  });

  it("initializes only open matrix fact placeholders for active alternatives and benchmarks", () => {
    expect(normalizedSql).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`matrix_facts`\s+\(`entry_id`,\s*`category_id`,\s*`criterion_id`,\s*`status`\)/i,
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
