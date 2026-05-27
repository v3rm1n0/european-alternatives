import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * Issue #471: backoff bookkeeping for deeper-research mode lives on the
 * matrix_facts row itself (option A in the research alternatives —
 * O(1) selector, no joins). The schema must therefore define:
 *   - matrix_facts.deeper_research_attempt_count
 *   - matrix_facts.deeper_research_next_eligible_at
 *
 * and there must be a discoverable migration file under scripts/migrations/
 * that adds these columns (migration 051 is the natural slot, chained off
 * the 050 source-quality-rejected migration).
 */

const schema = readFileSync(
  new URL("../scripts/db-schema.sql", import.meta.url),
  "utf8",
);

function normalize(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function getMatrixFactsBlock(): string {
  const start = schema.indexOf("CREATE TABLE `matrix_facts`");
  expect(start).toBeGreaterThan(-1);
  const tail = ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
  const end = schema.indexOf(tail, start);
  expect(end).toBeGreaterThan(start);
  return schema.slice(start, end + tail.length);
}

describe("matrix_facts schema — deeper-research backoff columns", () => {
  it("declares deeper_research_attempt_count with a 0 default", () => {
    const block = normalize(getMatrixFactsBlock());
    expect(block).toMatch(
      /`deeper_research_attempt_count`\s+(?:INT|INTEGER|TINYINT|SMALLINT|BIGINT)[^,]*NOT NULL[^,]*DEFAULT\s+0/i,
    );
  });

  it("declares deeper_research_next_eligible_at as a nullable DATETIME with NULL default", () => {
    const block = normalize(getMatrixFactsBlock());
    expect(block).toMatch(
      /`deeper_research_next_eligible_at`\s+DATETIME[^,]*DEFAULT\s+NULL/i,
    );
  });

  it("indexes the deeper_research_next_eligible_at column to keep selector lookups O(1)", () => {
    const block = normalize(getMatrixFactsBlock());
    // The selector queries WHERE status = 'needs-deeper-research'
    // AND (next_eligible_at IS NULL OR next_eligible_at <= NOW()).
    // Some index that includes deeper_research_next_eligible_at must exist —
    // either a standalone KEY on the column or a composite KEY that
    // begins with status and includes the column.
    expect(block).toMatch(
      /(KEY|INDEX) `[^`]+` \([^)]*`deeper_research_next_eligible_at`[^)]*\)/,
    );
  });
});
