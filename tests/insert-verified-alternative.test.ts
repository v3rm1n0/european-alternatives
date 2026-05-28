import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { type AddressInfo, createServer, type Server } from "node:http";
import { join, resolve } from "node:path";

import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

const projectDir = resolve(".");
const libraryModuleUrl = new URL(
  "../scripts/lib/insert-verified-alternative.mjs",
  import.meta.url,
);
const runnerPath = resolve("scripts/insert-verified-alternative-run.mjs");
const shellScriptPath = resolve("scripts/insert-verified-alternative.sh");

const shellScriptExists = existsSync(shellScriptPath);

const ADMIN_TOKEN = "test-admin-token-please-rotate";

type AdminPayload = Record<string, unknown>;

type LibraryModule = {
  BANNED_INSERT_KEYS: readonly string[];
  INSERT_ALLOWED_STATUSES: readonly string[];
  buildAdminPayload: (
    verifiedAction: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => AdminPayload;
  assertNoBannedKeys: (value: unknown) => void;
};

type RecordedRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
};

type MockServerHandle = {
  server: Server;
  baseUrl: string;
  recorded: RecordedRequest[];
  nextResponse: (req: RecordedRequest) => {
    status: number;
    body: string;
    contentType?: string;
  };
};

let mockServer: MockServerHandle | null = null;
let tempDirs: string[] = [];

async function loadLibrary(): Promise<LibraryModule> {
  return (await import(libraryModuleUrl.href)) as LibraryModule;
}

function makeTempDir(prefix: string): string {
  const tempRoot = resolve("tmp");
  mkdirSync(tempRoot, { recursive: true });
  const dir = mkdtempSync(join(tempRoot, prefix));
  tempDirs.push(dir);
  return dir;
}

function buildVerifiedAction(
  overrides: Record<string, unknown> = {},
  newAlternativeOverrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const sources: Record<string, Record<string, unknown>> = {};
  for (const field of [
    "name",
    "description_en",
    "country_code",
    "website_url",
    "pricing",
    "is_open_source",
    "open_source_level",
    "founded_year",
    "headquarters_city",
    "self_hostable",
    "categories",
    "tags",
    "replaces_us",
  ]) {
    sources[field] = {
      url: `https://crypt.ee/${field.replace(/_/gu, "-")}`,
      title: `Cryptee — ${field}`,
      accessedDate: "2026-05-27",
    };
  }

  return {
    issueNumber: 4711,
    action: "new_alternative",
    dryRun: false,
    accessedDate: "2026-05-27",
    newAlternative: {
      slug: "cryptee",
      name: "Cryptee",
      description_en: "Estonian E2EE document and photo storage.",
      description_de: null,
      country_code: "ee",
      website_url: "https://crypt.ee",
      status: "alternative",
      pricing: "freemium",
      is_open_source: false,
      open_source_level: "none",
      source_code_url: null,
      self_hostable: false,
      founded_year: 2017,
      headquarters_city: "Tallinn",
      license_text: null,
      categories: [{ category_id: "cloud-storage", is_primary: true }],
      tags: ["privacy", "encryption"],
      replaces_us: ["Google Drive"],
      sources,
      ...newAlternativeOverrides,
    },
    verifierEvidence: {
      name: {
        verdict: "supports",
        sourceUrl: "https://e-estonia.com/cryptee",
        sourceTitle: "e-Estonia: Cryptee",
        accessedDate: "2026-05-27",
        auditQuote: "Cryptee is an Estonian E2EE storage service.",
      },
    },
    ...overrides,
  };
}

function startMockServer(): Promise<MockServerHandle> {
  return new Promise((resolvePromise, rejectPromise) => {
    const recorded: RecordedRequest[] = [];
    let handle: MockServerHandle | null = null;
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (value !== undefined) {
            headers[key.toLowerCase()] = Array.isArray(value)
              ? value.join(",")
              : String(value);
          }
        }
        const recordedReq: RecordedRequest = {
          method: req.method ?? "",
          url: req.url ?? "",
          headers,
          body: Buffer.concat(chunks).toString("utf8"),
        };
        recorded.push(recordedReq);

        const response = handle!.nextResponse(recordedReq);
        res.writeHead(response.status, {
          "Content-Type": response.contentType ?? "application/json",
        });
        res.end(response.body);
      });
    });

    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      handle = {
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
        recorded,
        nextResponse: () => ({
          status: 201,
          body: JSON.stringify({ ok: true, entry_id: 1234, slug: "cryptee" }),
        }),
      };
      mockServer = handle;
      resolvePromise(handle);
    });
  });
}

function stopMockServer(): Promise<void> {
  if (mockServer === null) {
    return Promise.resolve();
  }
  return new Promise((resolvePromise) => {
    mockServer?.server.close(() => {
      mockServer = null;
      resolvePromise();
    });
  });
}

type RunnerResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  envelope: Record<string, unknown> | null;
};

function runRunner(
  args: string[],
  options: {
    env?: Record<string, string | undefined>;
    inputFilePath?: string;
  } = {},
): Promise<RunnerResult> {
  const env: Record<string, string> = { ...process.env } as Record<
    string,
    string
  >;
  // Wipe defaults so each test sets exactly what it wants.
  delete env.EUROALT_API_BASE;
  delete env.EUROALT_ADMIN_TOKEN;
  for (const [key, value] of Object.entries(options.env ?? {})) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }

  return new Promise<RunnerResult>((resolvePromise) => {
    const child = spawn(process.execPath, [runnerPath, ...args], {
      cwd: projectDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        child.kill("SIGKILL");
      }
    }, 15_000);

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("close", (code, signal) => {
      settled = true;
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      let envelope: Record<string, unknown> | null = null;
      const trimmed = stdout.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          envelope = JSON.parse(trimmed) as Record<string, unknown>;
        } catch {
          envelope = null;
        }
      }
      resolvePromise({
        exitCode: code,
        stdout,
        stderr: signal !== null ? `${stderr}\n[signal=${signal}]` : stderr,
        envelope,
      });
    });
  });
}

function writeVerifiedActionFile(
  verifiedAction: Record<string, unknown>,
): string {
  const dir = makeTempDir("insert-verified-alt-");
  const path = join(dir, "verified-action.json");
  writeFileSync(path, JSON.stringify(verifiedAction), "utf8");
  return path;
}

function containsAnyScoringKey(text: string): string | null {
  const banned = [
    "trustScore",
    "trust_score",
    "trustScoreStatus",
    "trust_score_status",
    "reservations",
    "positive_signals",
    "positiveSignals",
    "scoring_metadata",
    "scoringMetadata",
  ];
  for (const key of banned) {
    if (text.includes(`"${key}"`)) {
      return key;
    }
  }
  return null;
}

beforeEach(async () => {
  await startMockServer();
});

afterEach(async () => {
  await stopMockServer();
});

afterAll(() => {
  // Best-effort cleanup of temp dirs created during the suite.
  tempDirs = [];
});

describe("insert-verified-alternative library", () => {
    it("exports BANNED_INSERT_KEYS covering scoring/trust/reservation identifiers", async () => {
      const { BANNED_INSERT_KEYS } = await loadLibrary();

      expect(Array.isArray(BANNED_INSERT_KEYS)).toBe(true);
      for (const required of [
        "trustScore",
        "trust_score",
        "trustScoreStatus",
        "trust_score_status",
        "reservations",
        "positive_signals",
        "positiveSignals",
        "scoring_metadata",
        "scoringMetadata",
      ]) {
        expect(
          BANNED_INSERT_KEYS.includes(required),
          `BANNED_INSERT_KEYS must include ${required}`,
        ).toBe(true);
      }
    });

    it("buildAdminPayload strips non-endpoint metadata and copies the newAlternative body", async () => {
      const { buildAdminPayload } = await loadLibrary();

      const payload = buildAdminPayload(buildVerifiedAction());

      // Endpoint body keys present
      expect(payload.slug).toBe("cryptee");
      expect(payload.name).toBe("Cryptee");
      expect(payload.country_code).toBe("ee");
      expect(payload.website_url).toBe("https://crypt.ee");
      expect(payload.status).toBe("alternative");
      expect(Array.isArray(payload.categories)).toBe(true);
      expect(Array.isArray(payload.tags)).toBe(true);
      expect(Array.isArray(payload.replaces_us)).toBe(true);

      // Metadata that does not belong in the admin endpoint body must be stripped.
      expect(payload).not.toHaveProperty("sources");
      expect(payload).not.toHaveProperty("verifierEvidence");
      expect(payload).not.toHaveProperty("issueNumber");
      expect(payload).not.toHaveProperty("action");
      expect(payload).not.toHaveProperty("dryRun");
      expect(payload).not.toHaveProperty("accessedDate");
    });

    it("buildAdminPayload validates and preserves catalog role status", async () => {
      const { buildAdminPayload } = await loadLibrary();

      for (const status of ["alternative", "us", "draft"]) {
        const payload = buildAdminPayload(
          buildVerifiedAction({}, { status }),
        );
        expect(payload.status, `status ${status}`).toBe(status);
      }
    });

    it("buildAdminPayload supports a CLI status override for benchmark inserts", async () => {
      const { buildAdminPayload } = await loadLibrary();

      const payload = buildAdminPayload(buildVerifiedAction(), {
        statusOverride: "us",
      });

      expect(payload.status).toBe("us");
    });

    it("buildAdminPayload rejects unknown catalog role statuses", async () => {
      const { buildAdminPayload } = await loadLibrary();

      expect(() =>
        buildAdminPayload(buildVerifiedAction({}, { status: "denied" })),
      ).toThrow(/status|alternative|us|draft/i);

      expect(() =>
        buildAdminPayload(buildVerifiedAction(), { statusOverride: "denied" }),
      ).toThrow(/statusOverride|alternative|us|draft/i);
    });

    it("buildAdminPayload throws when action is missing or wrong, or when newAlternative is missing", async () => {
      const { buildAdminPayload } = await loadLibrary();

      expect(() =>
        buildAdminPayload(
          buildVerifiedAction({ action: "catalog_fact_correction" }),
        ),
      ).toThrow(/action|new_alternative/i);

      const noBody = buildVerifiedAction();
      delete noBody.newAlternative;
      expect(() => buildAdminPayload(noBody)).toThrow(/newAlternative/i);

      const noEvidence = buildVerifiedAction();
      delete noEvidence.verifierEvidence;
      expect(() => buildAdminPayload(noEvidence)).toThrow(
        /verifierEvidence/i,
      );
    });

    it("buildAdminPayload throws when verifierEvidence is an empty object (no evidence at all)", async () => {
      const { buildAdminPayload } = await loadLibrary();

      const emptyEvidence = buildVerifiedAction({ verifierEvidence: {} });
      expect(() => buildAdminPayload(emptyEvidence)).toThrow(
        /verifierEvidence/i,
      );
    });

    it("buildAdminPayload throws when the input itself is not a plain object", async () => {
      const { buildAdminPayload } = await loadLibrary();

      // Defends against accidental array / null / scalar inputs reaching the
      // library when callers shape verified_action incorrectly.
      expect(() =>
        (buildAdminPayload as unknown as (v: unknown) => unknown)(null),
      ).toThrow();
      expect(() =>
        (buildAdminPayload as unknown as (v: unknown) => unknown)([]),
      ).toThrow();
      expect(() =>
        (buildAdminPayload as unknown as (v: unknown) => unknown)("not-json"),
      ).toThrow();
    });

    it("buildAdminPayload throws when any banned scoring/trust key appears anywhere in the input", async () => {
      const { buildAdminPayload } = await loadLibrary();

      // Top-level smuggle
      expect(() =>
        buildAdminPayload(buildVerifiedAction({ trust_score: 0.7 })),
      ).toThrow(/banned|trust_score|forbidden/i);

      // Nested smuggle deep inside newAlternative
      expect(() =>
        buildAdminPayload(
          buildVerifiedAction({}, { scoring_metadata: { foo: "bar" } }),
        ),
      ).toThrow(/banned|scoring_metadata|forbidden/i);

      // Smuggle inside categories (array of objects)
      expect(() =>
        buildAdminPayload(
          buildVerifiedAction(
            {},
            {
              categories: [
                {
                  category_id: "cloud-storage",
                  is_primary: true,
                  positive_signals: ["foss"],
                },
              ],
            },
          ),
        ),
      ).toThrow(/banned|positive_signals|forbidden/i);
    });

    it("assertNoBannedKeys throws on a recursive banned-key occurrence", async () => {
      const { assertNoBannedKeys } = await loadLibrary();

      expect(() =>
        assertNoBannedKeys({
          x: { y: [{ z: { reservations: 1 } }] },
        }),
      ).toThrow(/banned|reservations|forbidden/i);

      // Sanity: a clean object does not throw.
      expect(() => assertNoBannedKeys({ a: 1, b: ["x", { c: null }] })).not.toThrow();
    });
});

describe("insert-verified-alternative runner CLI", () => {
    it("--help exits 0 and prints usage to stdout", async () => {
      const result = await runRunner(["--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/usage|insert/);
    });

    it("unknown option exits 64", async () => {
      const result = await runRunner(["--definitely-not-a-real-option"]);
      expect(result.exitCode).toBe(64);
    });

    it("rejects --token as a CLI argument with exit 64 (token must come from env only)", async () => {
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner([
        "--verified-action-file",
        verifiedActionFile,
        "--token",
        "should-not-be-accepted",
      ]);
      expect(result.exitCode).toBe(64);
    });

    it("rejects --admin-token (and --admin-token=...) as CLI arguments with exit 64", async () => {
      // The runner must refuse any token-on-CLI variant — not just --token —
      // so an operator cannot accidentally leak the token through argv.
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());

      const spaceForm = await runRunner([
        "--verified-action-file",
        verifiedActionFile,
        "--admin-token",
        "should-not-be-accepted",
      ]);
      expect(spaceForm.exitCode).toBe(64);

      const equalsForm = await runRunner([
        "--verified-action-file",
        verifiedActionFile,
        "--admin-token=should-not-be-accepted",
      ]);
      expect(equalsForm.exitCode).toBe(64);

      // The --token=... equals form is also rejected.
      const tokenEqualsForm = await runRunner([
        "--verified-action-file",
        verifiedActionFile,
        "--token=should-not-be-accepted",
      ]);
      expect(tokenEqualsForm.exitCode).toBe(64);
    });

    it("supplying both --verified-action-file and --verified-action-json exits 64", async () => {
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner([
        "--verified-action-file",
        verifiedActionFile,
        "--verified-action-json",
        JSON.stringify(buildVerifiedAction()),
      ]);
      expect(result.exitCode).toBe(64);
    });

    it("accepts --verified-action-json as an inline source and POSTs the payload", async () => {
      const result = await runRunner(
        [
          "--verified-action-json",
          JSON.stringify(buildVerifiedAction()),
        ],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode, result.stderr).toBe(0);
      expect(mockServer?.recorded.length).toBe(1);
      const req = mockServer?.recorded[0];
      expect(req?.url).toBe("/api/admin/add-alternative.php");
      const wireBody = JSON.parse(req?.body ?? "{}") as Record<string, unknown>;
      expect(wireBody.slug).toBe("cryptee");
      expect(wireBody.status).toBe("alternative");
    });

    it("--status us overrides the verified_action status for CLI benchmark inserts", async () => {
      const result = await runRunner(
        [
          "--verified-action-json",
          JSON.stringify(buildVerifiedAction()),
          "--status",
          "us",
        ],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode, result.stderr).toBe(0);
      expect(mockServer?.recorded.length).toBe(1);
      const wireBody = JSON.parse(
        mockServer?.recorded[0]?.body ?? "{}",
      ) as Record<string, unknown>;
      expect(wireBody.status).toBe("us");
    });

    it("missing EUROALT_API_BASE in a non-dry-run fail-closes with exit 65 and emits no envelope", async () => {
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: undefined,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(result.stdout.trim()).toBe("");
      expect(mockServer?.recorded.length, "must not contact admin endpoint").toBe(
        0,
      );
    });

    it("on 201 with body lacking ok=true fail-closes with exit 65 (defense-in-depth on response shape)", async () => {
      if (mockServer !== null) {
        mockServer.nextResponse = () => ({
          status: 201,
          body: JSON.stringify({ ok: false, entry_id: 1234, slug: "cryptee" }),
        });
      }
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(result.stdout.trim()).toBe("");
    });

    it("on 201 with ok=true but no entry_id fail-closes with exit 65", async () => {
      if (mockServer !== null) {
        mockServer.nextResponse = () => ({
          status: 201,
          body: JSON.stringify({ ok: true, slug: "cryptee" }),
        });
      }
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(result.stdout.trim()).toBe("");
    });

    it("--repo is passed through into the stage-4 envelope for downstream consumers", async () => {
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        [
          "--verified-action-file",
          verifiedActionFile,
          "--repo",
          "TheMorpheus407/european-alternatives",
        ],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.envelope?.repo).toBe("TheMorpheus407/european-alternatives");
    });

    it("missing verified-action source exits 64", async () => {
      const result = await runRunner([]);
      expect(result.exitCode).toBe(64);
    });

    it("missing EUROALT_ADMIN_TOKEN in a non-dry-run fail-closes with exit 65 and emits no envelope", async () => {
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: undefined,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(result.stdout.trim()).toBe("");
      expect(mockServer?.recorded.length, "must not contact admin endpoint").toBe(0);
    });

    it("--dry-run emits the would-be payload envelope and never opens a socket to the admin endpoint", async () => {
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile, "--dry-run"],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: undefined,
          },
        },
      );

      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.envelope).not.toBeNull();
      expect(result.envelope?.dryRun).toBe(true);
      expect(result.envelope?.action).toBe("new_alternative");

      const request = result.envelope?.request as
        | { endpoint?: string; payload?: AdminPayload }
        | undefined;
      expect(request?.endpoint).toContain("/api/admin/add-alternative.php");
      expect(request?.payload?.status).toBe("alternative");
      expect(request?.payload?.slug).toBe("cryptee");
      expect(request?.payload).not.toHaveProperty("sources");

      // The dry-run path must not have made any network request.
      expect(mockServer?.recorded.length).toBe(0);
    });

    it("on 201 emits a stage-4 envelope with result.ok=true and trustScoreStatus=pending", async () => {
      const verifiedAction = buildVerifiedAction();
      const verifiedActionFile = writeVerifiedActionFile(verifiedAction);
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode, result.stderr).toBe(0);
      expect(result.envelope).not.toBeNull();
      expect(result.envelope?.action).toBe("new_alternative");
      expect(result.envelope?.dryRun).toBe(false);

      const r = result.envelope?.result as
        | {
            ok?: boolean;
            entryId?: number;
            slug?: string;
            trustScoreStatus?: string;
          }
        | undefined;
      expect(r?.ok).toBe(true);
      expect(r?.entryId).toBe(1234);
      expect(r?.slug).toBe("cryptee");
      expect(r?.trustScoreStatus).toBe("pending");

      // Verifier evidence + research sources must be passed through for the
      // GitHub success comment (stage 5 consumer).
      expect(result.envelope?.verifierEvidence).toBeDefined();
      expect(result.envelope?.researchSources).toBeDefined();
    });

    it("POSTs to /api/admin/add-alternative.php with Bearer auth, no Origin header, and no scoring keys in the body", async () => {
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode, result.stderr).toBe(0);
      expect(mockServer?.recorded.length).toBe(1);

      const req = mockServer?.recorded[0];
      expect(req?.method).toBe("POST");
      expect(req?.url).toBe("/api/admin/add-alternative.php");
      expect(req?.headers["authorization"]).toBe(`Bearer ${ADMIN_TOKEN}`);
      // Must NOT send an Origin header — the endpoint hard-rejects browser requests.
      expect(req?.headers["origin"]).toBeUndefined();

      // Wire body must contain no scoring/trust/reservation keys.
      expect(containsAnyScoringKey(req?.body ?? "")).toBeNull();

      // Spot-check the body shape.
      const wireBody = JSON.parse(req?.body ?? "{}") as Record<string, unknown>;
      expect(wireBody.slug).toBe("cryptee");
      expect(wireBody.status).toBe("alternative");
      expect(wireBody).not.toHaveProperty("sources");
      expect(wireBody).not.toHaveProperty("verifierEvidence");
    });

    it("on 409 duplicate fail-closes with exit 65 and an empty stdout (no envelope)", async () => {
      if (mockServer !== null) {
        mockServer.nextResponse = () => ({
          status: 409,
          body: JSON.stringify({ ok: false, error: "duplicate_entry" }),
        });
      }
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(result.stdout.trim()).toBe("");
    });

    it("on 500 internal error fail-closes with exit 65", async () => {
      if (mockServer !== null) {
        mockServer.nextResponse = () => ({
          status: 500,
          body: JSON.stringify({ ok: false, error: "internal_error" }),
        });
      }
      const verifiedActionFile = writeVerifiedActionFile(buildVerifiedAction());
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(result.stdout.trim()).toBe("");
    });

    it("fail-closes with exit 65 when the verified_action smuggles a banned scoring key", async () => {
      const smuggled = buildVerifiedAction({ trust_score: 0.5 });
      const verifiedActionFile = writeVerifiedActionFile(smuggled);
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(mockServer?.recorded.length, "must not POST when banned key present").toBe(
        0,
      );
    });

    it("fail-closes with exit 65 when the action is not 'new_alternative'", async () => {
      const wrongAction = buildVerifiedAction({
        action: "catalog_fact_correction",
      });
      const verifiedActionFile = writeVerifiedActionFile(wrongAction);
      const result = await runRunner(
        ["--verified-action-file", verifiedActionFile],
        {
          env: {
            EUROALT_API_BASE: mockServer?.baseUrl,
            EUROALT_ADMIN_TOKEN: ADMIN_TOKEN,
          },
        },
      );

      expect(result.exitCode).toBe(65);
      expect(mockServer?.recorded.length).toBe(0);
    });
});

describe.skipIf(!shellScriptExists)(
  "insert-verified-alternative bash shim",
  () => {
    it("--help exits 0", () => {
      const result = spawnSync("bash", [shellScriptPath, "--help"], {
        encoding: "utf8",
        timeout: 10_000,
      });
      expect(result.status).toBe(0);
    });

    it("unknown option exits 64", () => {
      const result = spawnSync(
        "bash",
        [shellScriptPath, "--definitely-not-a-real-option"],
        { encoding: "utf8", timeout: 10_000 },
      );
      expect(result.status).toBe(64);
    });

    it("no arguments exits 64", () => {
      const result = spawnSync("bash", [shellScriptPath], {
        encoding: "utf8",
        timeout: 10_000,
      });
      expect(result.status).toBe(64);
    });
  },
);
