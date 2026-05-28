import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  new URL(
    "../scripts/migrations/065-category-matrix-stance-tone-adjustments.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("category matrix stance tone adjustments migration", () => {
  it("makes proprietary, mandatory telemetry, tracking, and no-export states clearly negative", () => {
    for (const option of [
      "proprietary",
      "mandatory_telemetry",
      "mandatory_cloud_account",
      "sold_to_third_parties",
      "no_export",
      "not_encrypted",
    ]) {
      expect(sql).toContain(`'${option}'`);
    }
    expect(sql).toMatch(/THEN\s+'negative'/i);
  });

  it("promotes open, local, self-hosted, EU, and no-telemetry states as positive", () => {
    for (const option of [
      "open_source",
      "full_open_source",
      "eu_only",
      "eu_primary",
      "local_device",
      "self_hosted",
      "no_telemetry",
      "no_account_needed",
      "strict_no_logs",
      "zero_knowledge_default",
    ]) {
      expect(sql).toContain(`'${option}'`);
    }
    expect(sql).toMatch(/THEN\s+'positive'/i);
  });

  it("keeps cloud-only, source-available, and opt-out models in warning territory", () => {
    for (const option of [
      "source_available",
      "cloud_only",
      "hosted_saas",
      "provider_cloud",
      "personalized_ads",
      "opt_out_telemetry",
    ]) {
      expect(sql).toContain(`'${option}'`);
    }
    expect(sql).toMatch(/THEN\s+'warning'/i);
    expect(sql).toContain("'065-category-matrix-stance-tone-adjustments'");
  });
});
