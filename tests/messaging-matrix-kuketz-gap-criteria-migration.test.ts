import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationVersion = "062-messaging-matrix-kuketz-gap-criteria";
const migrationUrl = new URL(
  "../scripts/migrations/062-messaging-matrix-kuketz-gap-criteria.sql",
  import.meta.url,
);
const migrationExists = existsSync(migrationUrl);
const rawMigration = migrationExists ? readFileSync(migrationUrl, "utf8") : "";
const migrationSql = stripSqlComments(rawMigration);
const normalizedMigration = normalizeSql(migrationSql);

const expectedCriteria = [
  ["cost_pricing", "platform_access", "enum", "tradeoff", "optional"],
  [
    "post_quantum_encryption",
    "security_privacy",
    "boolean",
    "beneficial",
    "optional",
  ],
  [
    "encryption_protocol_or_library",
    "security_privacy",
    "text",
    "informational",
    "none",
  ],
  ["proprietary_libraries", "security_privacy", "boolean", "risk", "optional"],
  ["tracker_or_ad_presence", "security_privacy", "enum", "risk", "optional"],
  [
    "latest_security_audit_year",
    "security_privacy",
    "number",
    "informational",
    "range",
  ],
  [
    "contact_key_change_warning",
    "security_privacy",
    "boolean",
    "beneficial",
    "optional",
  ],
  [
    "client_source_openness",
    "architecture_control",
    "enum",
    "beneficial",
    "optional",
  ],
  [
    "server_source_openness",
    "architecture_control",
    "enum",
    "beneficial",
    "optional",
  ],
  [
    "infrastructure_hosting_provider",
    "architecture_control",
    "text",
    "informational",
    "none",
  ],
  [
    "legal_jurisdiction",
    "architecture_control",
    "text",
    "informational",
    "none",
  ],
  ["automatic_backup", "backup_export", "boolean", "tradeoff", "optional"],
  ["backup_storage_location", "backup_export", "enum", "tradeoff", "optional"],
] as const;

const requiredOptionsByCriterion = {
  cost_pricing: ["free", "freemium", "paid", "enterprise_only"],
  tracker_or_ad_presence: [
    "no_known_trackers_or_ads",
    "first_party_telemetry",
    "third_party_trackers",
    "advertising_sdk",
    "behavioral_ads",
  ],
  client_source_openness: [
    "full_open_source",
    "partial_open_source",
    "source_available_no_license",
    "proprietary",
  ],
  server_source_openness: [
    "full_open_source",
    "partial_open_source",
    "source_available_no_license",
    "proprietary",
    "no_server_required",
  ],
  backup_storage_location: [
    "local_device",
    "user_controlled_cloud",
    "provider_cloud",
    "platform_cloud",
    "self_hosted_server",
  ],
} as const;

describe(`migration ${migrationVersion}`, () => {
  it("exists as a numbered migration file under scripts/migrations/", () => {
    expect(migrationExists, migrationUrl.pathname).toBe(true);
    expect(rawMigration.trim()).not.toBe("");
  });

  it("adds the Messaging matrix criteria that cover the Kuketz-scope gaps", () => {
    expect(normalizedMigration).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`matrix_criteria`/i,
    );

    for (const [key, groupKey, valueType, semantics, filterMode] of expectedCriteria) {
      const window = windowForLiteral(key);

      expect(window, key).toContain(sqlStringLiteral("messaging"));
      expect(window, key).toContain(sqlStringLiteral(groupKey));
      expect(window, key).toContain(sqlStringLiteral(valueType));
      expect(window, key).toContain(sqlStringLiteral(semantics));
      expect(window, key).toContain(sqlStringLiteral(filterMode));
    }
  });

  it("defines actionable enum tones for the new enum criteria", () => {
    expect(normalizedMigration).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`matrix_criterion_options`/i,
    );

    for (const [criterionKey, optionKeys] of Object.entries(
      requiredOptionsByCriterion,
    )) {
      for (const optionKey of optionKeys) {
        const window = windowForLiteral(optionKey, [criterionKey]);

        expect(window, `${criterionKey}.${optionKey}`).toContain(
          sqlStringLiteral(criterionKey),
        );
        expect(window, `${criterionKey}.${optionKey}`).toMatch(
          /'(positive|warning|negative|neutral|tradeoff)'/,
        );
      }
    }

    expect(windowForLiteral("third_party_trackers")).toContain(
      sqlStringLiteral("negative"),
    );
    expect(windowForLiteral("no_server_required")).toContain(
      sqlStringLiteral("positive"),
    );
  });

  it("initializes open matrix facts for active Messaging alternatives and comparison rows", () => {
    expect(normalizedMigration).toMatch(
      /INSERT\s+IGNORE\s+INTO\s+`matrix_facts`/i,
    );
    expect(normalizedMigration).toMatch(/JOIN\s+`entry_categories`\s+ec/i);
    expect(normalizedMigration).toMatch(/ec\.`category_id`\s*=\s*'messaging'/i);
    expect(normalizedMigration).toMatch(
      /ce\.`status`\s+IN\s*\(\s*'alternative'\s*,\s*'us'\s*\)/i,
    );
    expect(normalizedMigration).toMatch(/ce\.`is_active`\s*=\s*1/i);
  });

  it("records the schema migration version", () => {
    expect(normalizedMigration).toMatch(
      /INSERT\s+INTO\s+`schema_migrations`\s+\(`version`\)\s+VALUES\s+\('062-messaging-matrix-kuketz-gap-criteria'\)/i,
    );
  });
});

function stripSqlComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\r\n]*/g, "");
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function sqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function windowsForLiteral(value: string, radius = 900): string[] {
  const literal = sqlStringLiteral(value);
  const windows: string[] = [];
  let index = migrationSql.indexOf(literal);

  while (index !== -1) {
    windows.push(
      migrationSql.slice(
        Math.max(0, index - radius),
        Math.min(migrationSql.length, index + literal.length + radius),
      ),
    );
    index = migrationSql.indexOf(literal, index + literal.length);
  }

  return windows;
}

function windowForLiteral(
  value: string,
  requiredLiterals: string[] = [],
): string {
  const windows = windowsForLiteral(value);
  const required = requiredLiterals.map(sqlStringLiteral);

  return (
    windows.find((window) =>
      required.every((literal) => window.includes(literal)),
    ) ??
    windows[0] ??
    ""
  );
}
