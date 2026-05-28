import { describe, expect, it } from "vitest";

import {
  applyMatrixColumnFilters,
  upsertMatrixColumnFilter,
  withoutMatrixColumnFilter,
} from "../src/utils/categoryMatrixColumnFilters";
import type { MatrixColumnFilter } from "../src/utils/categoryMatrixColumnFilters";
import type { MatrixFact } from "../src/types";

function row(id: string, facts: Record<string, MatrixFact>) {
  return { id, facts };
}

describe("matrix column filters", () => {
  it("filters boolean facts by the selected value and excludes unknowns by default", () => {
    const rows = [
      row("signal", {
        phone_number_required: { status: "verified", value: false },
      }),
      row("whatsapp", {
        phone_number_required: { status: "verified", value: true },
      }),
      row("unknown-chat", {}),
    ];

    const filter: MatrixColumnFilter = {
      criterionId: "phone_number_required",
      kind: "boolean",
      value: false,
      includeUnverified: false,
    };

    expect(applyMatrixColumnFilters(rows, [filter]).map((entry) => entry.id)).toEqual([
      "signal",
    ]);
    expect(
      applyMatrixColumnFilters(rows, [
        { ...filter, includeUnverified: true },
      ]).map((entry) => entry.id),
    ).toEqual(["signal", "unknown-chat"]);
  });

  it("filters enum facts without relying on category-specific criterion ids", () => {
    const rows = [
      row("briar", {
        network_architecture: { status: "verified", value: "peer_to_peer" },
      }),
      row("matrix", {
        network_architecture: { status: "verified", value: "federated" },
      }),
      row("central-chat", {
        network_architecture: { status: "verified", value: "centralized" },
      }),
    ];

    const result = applyMatrixColumnFilters(rows, [
      {
        criterionId: "network_architecture",
        kind: "enum",
        values: ["peer_to_peer", "federated"],
        includeUnverified: false,
      },
    ]);

    expect(result.map((entry) => entry.id)).toEqual(["briar", "matrix"]);
  });

  it("matches any selected value for multi-value facts", () => {
    const rows = [
      row("desktop-plus-mobile", {
        supported_platforms: {
          status: "verified",
          value: ["android", "linux"],
        },
      }),
      row("desktop-only", {
        supported_platforms: { status: "verified", value: ["linux"] },
      }),
      row("mobile-only", {
        supported_platforms: { status: "verified", value: ["ios"] },
      }),
    ];

    const baseFilter: MatrixColumnFilter = {
      criterionId: "supported_platforms",
      kind: "multi_enum",
      values: ["android", "linux"],
      includeUnverified: false,
    };

    expect(
      applyMatrixColumnFilters(rows, [baseFilter]).map((entry) => entry.id),
    ).toEqual(["desktop-plus-mobile", "desktop-only"]);
  });

  it("supports fact-status filters, treating missing facts as unverified", () => {
    const rows = [
      row("verified", {
        security_audit_year: { status: "verified", value: 2025 },
      }),
      row("verified-empty", {
        security_audit_year: { status: "verified", value: null },
      }),
      row("not-applicable", {
        security_audit_year: { status: "not_applicable", value: null },
      }),
      row("missing", {}),
    ];

    expect(
      applyMatrixColumnFilters(rows, [
        {
          criterionId: "security_audit_year",
          kind: "status",
          status: "verified",
        },
      ]).map((entry) => entry.id),
    ).toEqual(["verified"]);
    expect(
      applyMatrixColumnFilters(rows, [
        {
          criterionId: "security_audit_year",
          kind: "status",
          status: "unverified",
        },
      ]).map((entry) => entry.id),
    ).toEqual(["missing"]);
    expect(
      applyMatrixColumnFilters(rows, [
        {
          criterionId: "security_audit_year",
          kind: "status",
          status: "not_applicable",
        },
      ]).map((entry) => entry.id),
    ).toEqual(["not-applicable"]);
  });

  it("keeps one active filter per criterion when upserting", () => {
    const filters: MatrixColumnFilter[] = [
      {
        criterionId: "phone_number_required",
        kind: "boolean",
        value: true,
        includeUnverified: false,
      },
      {
        criterionId: "network_architecture",
        kind: "enum",
        values: ["federated"],
        includeUnverified: false,
      },
    ];

    const next = upsertMatrixColumnFilter(filters, {
      criterionId: "phone_number_required",
      kind: "boolean",
      value: false,
      includeUnverified: true,
    });

    expect(next).toEqual([
      {
        criterionId: "network_architecture",
        kind: "enum",
        values: ["federated"],
        includeUnverified: false,
      },
      {
        criterionId: "phone_number_required",
        kind: "boolean",
        value: false,
        includeUnverified: true,
      },
    ]);
    expect(withoutMatrixColumnFilter(next, "phone_number_required")).toEqual([
      {
        criterionId: "network_architecture",
        kind: "enum",
        values: ["federated"],
        includeUnverified: false,
      },
    ]);
  });
});
