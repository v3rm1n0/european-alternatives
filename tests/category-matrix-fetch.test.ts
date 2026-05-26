import { beforeAll, describe, expect, it, vi } from "vitest";

type JsonResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function jsonResponse(body: unknown, status = 200): JsonResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn(async () => body),
  };
}

function validMatrixPayload() {
  return {
    data: {
      category: {
        id: "messaging",
        name: "Messaging",
        description: "Secure messaging and chat apps",
        emoji: "chat",
      },
      groups: [
        {
          id: "privacy",
          label: "Privacy",
          description: null,
          criteria: [
            {
              id: "hosting_region",
              label: "Hosting region",
              helpText: null,
              valueType: "enum",
              semantics: "tradeoff",
              filterMode: "must_match",
              options: [
                { id: "eu", label: "EU", displayTone: "positive" },
                { id: "global", label: "Global", displayTone: "warning" },
              ],
            },
            {
              id: "e2ee",
              label: "End-to-end encryption",
              helpText: "Whether private chats are end-to-end encrypted",
              valueType: "boolean",
              semantics: "beneficial",
              filterMode: "optional",
              options: [],
            },
            {
              id: "self_hosting",
              label: "Self-hosting",
              helpText: null,
              valueType: "boolean",
              semantics: "informational",
              filterMode: "none",
              options: [],
            },
          ],
        },
      ],
      alternatives: [
        {
          id: "primary-chat",
          name: "Primary Chat",
          website: "https://primary-chat.example",
          logo: null,
          country: "de",
          category: "messaging",
          secondaryCategories: ["privacy-tools"],
          facts: {
            hosting_region: {
              status: "verified",
              value: "eu",
              source: {
                url: "https://primary-chat.example/security",
                title: "Security overview",
                accessedDate: "2026-05-24",
              },
            },
            e2ee: {
              status: "unverified",
              value: null,
            },
            self_hosting: {
              status: "not_applicable",
              value: null,
            },
          },
        },
      ],
    },
    meta: {
      category: "messaging",
      locale: "de",
      groupCount: 1,
      criterionCount: 3,
      alternativeCount: 1,
    },
  };
}

async function loadCategoryMatrixModule(): Promise<{
  fetchCategoryMatrix: (
    category: string,
    locale?: string,
    options?: { fetcher?: typeof fetch },
  ) => Promise<unknown>;
}> {
  return import("../src/data/categoryMatrix");
}

describe("fetchCategoryMatrix", () => {
  let fetchCategoryMatrix: Awaited<
    ReturnType<typeof loadCategoryMatrixModule>
  >["fetchCategoryMatrix"];

  beforeAll(async () => {
    ({ fetchCategoryMatrix } = await loadCategoryMatrixModule());
  }, 15_000);

  it("fetches one localized category matrix without touching the main catalog endpoints", async () => {
    const fetcher = vi.fn(async () => jsonResponse(validMatrixPayload()));

    const result = await fetchCategoryMatrix("messaging", "de", {
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(
      String(fetcher.mock.calls[0]?.[0]),
      "https://example.test",
    );

    expect(requestedUrl.pathname).toBe("/api/catalog/matrix");
    expect(requestedUrl.searchParams.get("category")).toBe("messaging");
    expect(requestedUrl.searchParams.get("locale")).toBe("de");
    expect(String(fetcher.mock.calls[0]?.[0])).not.toContain("/entries");
    expect(String(fetcher.mock.calls[0]?.[0])).not.toContain("/categories");
    expect(result).toMatchObject({
      status: "ready",
      error: null,
      matrix: {
        data: {
          alternatives: [
            {
              id: "primary-chat",
              facts: {
                hosting_region: {
                  status: "verified",
                  value: "eu",
                  source: {
                    url: "https://primary-chat.example/security",
                    title: "Security overview",
                    accessedDate: "2026-05-24",
                  },
                },
                e2ee: {
                  status: "unverified",
                  value: null,
                },
                self_hosting: {
                  status: "not_applicable",
                  value: null,
                },
              },
            },
          ],
        },
        meta: {
          category: "messaging",
          locale: "de",
          criterionCount: 3,
          alternativeCount: 1,
        },
      },
    });
  });

  it("falls back to the default locale when a caller passes an unsupported locale", async () => {

    const payload = validMatrixPayload();
    payload.meta.locale = "en";
    const fetcher = vi.fn(async () => jsonResponse(payload));

    const result = await fetchCategoryMatrix("messaging", "fr", {
      fetcher: fetcher as unknown as typeof fetch,
    });

    const requestedUrl = new URL(
      String(fetcher.mock.calls[0]?.[0]),
      "https://example.test",
    );

    expect(requestedUrl.searchParams.get("category")).toBe("messaging");
    expect(requestedUrl.searchParams.get("locale")).toBe("en");
    expect(result).toMatchObject({
      status: "ready",
      matrix: {
        meta: {
          locale: "en",
        },
      },
    });
  });

  it("defaults omitted locale arguments to the default language", async () => {

    const payload = validMatrixPayload();
    payload.meta.locale = "en";
    const fetcher = vi.fn(async () => jsonResponse(payload));

    const result = await fetchCategoryMatrix("messaging", undefined, {
      fetcher: fetcher as unknown as typeof fetch,
    });

    const requestedUrl = new URL(
      String(fetcher.mock.calls[0]?.[0]),
      "https://example.test",
    );

    expect(requestedUrl.searchParams.get("category")).toBe("messaging");
    expect(requestedUrl.searchParams.get("locale")).toBe("en");
    expect(result).toMatchObject({
      status: "ready",
      matrix: {
        meta: {
          locale: "en",
        },
      },
    });
  });

  it("accepts the full public enum and typed fact value contract at the fetch boundary", async () => {

    const payload = {
      data: {
        category: {
          id: "cloud-storage",
          name: "Cloud Storage",
          description: "Hosted file storage",
          emoji: null,
        },
        groups: [
          {
            id: "service-profile",
            label: "Service profile",
            description: "Capabilities and operational details",
            criteria: [
              {
                id: "open_source",
                label: "Open source",
                helpText: null,
                valueType: "boolean",
                semantics: "beneficial",
                filterMode: "optional",
                options: [{ id: "yes", label: "Yes", displayTone: "positive" }],
              },
              {
                id: "hosting_region",
                label: "Hosting region",
                helpText: null,
                valueType: "enum",
                semantics: "harmful",
                filterMode: "must_match",
                options: [
                  { id: "eu", label: "EU", displayTone: "negative" },
                  { id: "unknown", label: "Unknown" },
                ],
              },
              {
                id: "platforms",
                label: "Platforms",
                helpText: null,
                valueType: "multi_enum",
                semantics: "neutral",
                filterMode: "multi_select",
                options: [
                  { id: "web", label: "Web", displayTone: "neutral" },
                  { id: "mobile", label: "Mobile", displayTone: "tradeoff" },
                ],
              },
              {
                id: "storage_limit",
                label: "Storage limit",
                helpText: null,
                valueType: "number",
                semantics: "tradeoff",
                filterMode: "range",
                options: [],
              },
              {
                id: "notes",
                label: "Notes",
                helpText: null,
                valueType: "text",
                semantics: "informational",
                filterMode: "none",
                options: [],
              },
              {
                id: "privacy_policy",
                label: "Privacy policy",
                helpText: null,
                valueType: "url",
                semantics: "risk",
                filterMode: "optional",
                options: [],
              },
              {
                id: "founded_on",
                label: "Founded on",
                helpText: null,
                valueType: "date",
                semantics: "beneficial",
                filterMode: "none",
                options: [
                  { id: "recent", label: "Recent", displayTone: "warning" },
                ],
              },
            ],
          },
        ],
        alternatives: [
          {
            id: "storage-one",
            name: "Storage One",
            website: null,
            logo: "https://storage-one.example/logo.svg",
            country: null,
            category: "cloud-storage",
            secondaryCategories: [],
            facts: {
              open_source: { status: "verified", value: true },
              hosting_region: { status: "verified", value: "eu" },
              platforms: { status: "verified", value: ["web", "mobile"] },
              storage_limit: { status: "verified", value: 25 },
              notes: { status: "verified", value: "EU-hosted object storage" },
              privacy_policy: {
                status: "verified",
                value: "https://storage-one.example/privacy",
              },
              founded_on: { status: "verified", value: "2020-01-15" },
            },
          },
        ],
      },
      meta: {
        category: "cloud-storage",
        locale: "en",
        groupCount: 1,
        criterionCount: 7,
        alternativeCount: 1,
      },
    };
    const fetcher = vi.fn(async () => jsonResponse(payload));

    const result = await fetchCategoryMatrix("cloud-storage", "en", {
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(result).toMatchObject({
      status: "ready",
      error: null,
      matrix: {
        data: {
          groups: [
            {
              criteria: expect.arrayContaining([
                expect.objectContaining({
                  id: "platforms",
                  valueType: "multi_enum",
                  semantics: "neutral",
                  filterMode: "multi_select",
                }),
                expect.objectContaining({
                  id: "privacy_policy",
                  valueType: "url",
                  semantics: "risk",
                }),
              ]),
            },
          ],
          alternatives: [
            {
              facts: {
                platforms: {
                  status: "verified",
                  value: ["web", "mobile"],
                },
                storage_limit: {
                  status: "verified",
                  value: 25,
                },
              },
            },
          ],
        },
      },
    });
  });

  it("classifies valid zero-content matrix payloads as empty instead of an error", async () => {

    const emptyPayload = {
      data: {
        category: {
          id: "messaging",
          name: "Messaging",
          description: "Secure messaging and chat apps",
          emoji: null,
        },
        groups: [],
        alternatives: [],
      },
      meta: {
        category: "messaging",
        locale: "en",
        groupCount: 0,
        criterionCount: 0,
        alternativeCount: 0,
      },
    };
    const fetcher = vi.fn(async () => jsonResponse(emptyPayload));

    const result = await fetchCategoryMatrix("messaging", "en", {
      fetcher: fetcher as unknown as typeof fetch,
    });

    expect(result).toMatchObject({
      status: "empty",
      error: null,
      matrix: emptyPayload,
    });
  });

  it("returns unavailable state for category errors without throwing", async () => {

    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          ok: false,
          error: "invalid_category",
          detail: "No category exists for the given id.",
        },
        400,
      ),
    );

    await expect(
      fetchCategoryMatrix("does-not-exist", "en", {
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      matrix: null,
      error: {
        code: "invalid_category",
        httpStatus: 400,
        message: "No category exists for the given id.",
      },
    });
  });

  it("returns unavailable state for missing category API errors without throwing", async () => {

    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          error: "missing_category",
          message: "The category query parameter is required.",
        },
        400,
      ),
    );

    await expect(
      fetchCategoryMatrix("", "en", {
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      matrix: null,
      error: {
        code: "missing_category",
        httpStatus: 400,
        message: "The category query parameter is required.",
      },
    });
  });

  it("returns unavailable state for not-found responses without requiring an API error code", async () => {

    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          message: "Matrix category was not found.",
        },
        404,
      ),
    );

    await expect(
      fetchCategoryMatrix("does-not-exist", "en", {
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      matrix: null,
      error: {
        code: "http_404",
        httpStatus: 404,
        message: "Matrix category was not found.",
      },
    });
  });

  it("returns typed error state for backend failures without throwing", async () => {

    const fetcher = vi.fn(async () =>
      jsonResponse(
        {
          ok: false,
          error: "database_unavailable",
        },
        500,
      ),
    );

    await expect(
      fetchCategoryMatrix("messaging", "en", {
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "error",
      matrix: null,
      error: {
        code: "database_unavailable",
        httpStatus: 500,
      },
    });
  });

  it("returns invalid payload errors for unsupported response locales", async () => {

    const invalidLocalePayload = validMatrixPayload();
    invalidLocalePayload.meta.locale = "fr";
    const fetcher = vi.fn(async () => jsonResponse(invalidLocalePayload));

    await expect(
      fetchCategoryMatrix("messaging", "en", {
        fetcher: fetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "error",
      matrix: null,
      error: {
        code: "invalid_payload",
      },
    });
  });

  it("returns invalid payload errors for nested fact cells outside the public matrix shape", async () => {

    const invalidFactPayload = validMatrixPayload();
    (
      invalidFactPayload.data.alternatives[0]?.facts as unknown as Record<
        string,
        unknown
      >
    ).e2ee = {
      status: "unverified",
      value: "pending",
    };
    const invalidSourcePayload = validMatrixPayload();
    (
      invalidSourcePayload.data.alternatives[0]?.facts as unknown as Record<
        string,
        unknown
      >
    ).hosting_region = {
      status: "verified",
      value: "eu",
      source: {
        title: "Missing URL",
      },
    };
    const invalidFactFetcher = vi.fn(async () =>
      jsonResponse(invalidFactPayload),
    );
    const invalidSourceFetcher = vi.fn(async () =>
      jsonResponse(invalidSourcePayload),
    );

    await expect(
      fetchCategoryMatrix("messaging", "en", {
        fetcher: invalidFactFetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "error",
      matrix: null,
      error: {
        code: "invalid_payload",
      },
    });

    await expect(
      fetchCategoryMatrix("messaging", "en", {
        fetcher: invalidSourceFetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "error",
      matrix: null,
      error: {
        code: "invalid_payload",
      },
    });
  });

  it("returns typed error state for network and malformed payload failures", async () => {

    const rejectingFetcher = vi.fn(async () => {
      throw new Error("offline");
    });
    const malformedFetcher = vi.fn(async () =>
      jsonResponse({
        data: {
          category: { id: "messaging" },
          groups: "not an array",
          alternatives: [],
        },
        meta: { category: "messaging", locale: "en" },
      }),
    );

    await expect(
      fetchCategoryMatrix("messaging", "en", {
        fetcher: rejectingFetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "error",
      matrix: null,
      error: {
        code: "network_error",
        message: "offline",
      },
    });

    await expect(
      fetchCategoryMatrix("messaging", "en", {
        fetcher: malformedFetcher as unknown as typeof fetch,
      }),
    ).resolves.toMatchObject({
      status: "error",
      matrix: null,
      error: {
        code: "invalid_payload",
      },
    });
  });
});
