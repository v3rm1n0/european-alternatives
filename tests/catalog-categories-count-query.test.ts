import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const endpointPath = resolve("api/catalog/categories.php");

describe("catalog categories endpoint", () => {
  it("counts only active alternatives for alternativeCount", () => {
    const php = readFileSync(endpointPath, "utf8");

    expect(php).toMatch(/COUNT\s*\(\s*ce\.id\s*\)\s+AS\s+alternative_count/i);
    expect(php).not.toMatch(/COUNT\s*\(\s*ec\.entry_id\s*\)\s+AS\s+alternative_count/i);
    expect(php).toMatch(/ce\.status\s*=\s*'alternative'/i);
  });
});
