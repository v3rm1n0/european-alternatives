import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  main,
  WRAPPER_INVALID_USAGE,
  WRAPPER_POST_CHECK_FAILED,
} from "../scripts/apply-deep-research-scoring-run.mjs";

type PhpRunnerArgs = { phpBinary: string; args: string[] };
type PhpRunnerResult = { exitCode: number; stdout: string; stderr: string };
type PhpRunner = (input: PhpRunnerArgs) => Promise<PhpRunnerResult>;

type FetchCall = { url: string; init: RequestInit | undefined };

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

type StdCaptures = {
  stdout: string[];
  stderr: string[];
  restore: () => void;
};

function captureStdio(): StdCaptures {
  const stdout: string[] = [];
  const stderr: string[] = [];

  const stdoutSpy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk: unknown) => {
      stdout.push(typeof chunk === "string" ? chunk : String(chunk));
      return true;
    });
  const stderrSpy = vi
    .spyOn(process.stderr, "write")
    .mockImplementation((chunk: unknown) => {
      stderr.push(typeof chunk === "string" ? chunk : String(chunk));
      return true;
    });

  return {
    stdout,
    stderr,
    restore: () => {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    },
  };
}

function makePhpRunner(result: PhpRunnerResult): {
  runner: PhpRunner;
  calls: PhpRunnerArgs[];
} {
  const calls: PhpRunnerArgs[] = [];
  const runner: PhpRunner = async (input) => {
    calls.push(input);
    return result;
  };
  return { runner, calls };
}

function makeFetchImpl(handler: FetchImpl): {
  impl: FetchImpl;
  calls: FetchCall[];
} {
  const calls: FetchCall[] = [];
  const impl: FetchImpl = async (url, init) => {
    calls.push({ url, init });
    return handler(url, init);
  };
  return { impl, calls };
}

const validHandoffJson = JSON.stringify({
  schemaVersion: 1,
  entrySlug: "example-entry",
});

const baseArgs = [
  "--verified-action-json",
  validHandoffJson,
  "--worksheet-path",
  "docs/deep-research/2026-05-27/example-entry.worksheet.md",
  "--api-base-url",
  "http://api.local",
];

function findOutcomeLine(stdout: string[]): Record<string, unknown> | null {
  const joined = stdout.join("");
  const lines = joined.split("\n").filter((line) => line.trim() !== "");
  for (let index = lines.length - 1; index >= 0; index--) {
    const candidate = lines[index];
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed !== null && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore non-JSON lines
    }
  }
  return null;
}

describe("apply-deep-research-scoring-run wrapper", () => {
  let captures: StdCaptures;

  beforeEach(() => {
    captures = captureStdio();
    return () => {
      captures.restore();
    };
  });

  it("happy path: PHP succeeds and the post-check sees a ready trust score", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: false,
      replacedExisting: false,
      changesApplied: [],
    };
    const { runner, calls: phpCalls } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      return new Response(
        JSON.stringify({
          id: "example-entry",
          trustScore: 42,
          trustScoreStatus: "ready",
          trustScoreBreakdown: {
            base: 50,
            signals: 4,
            reservations: -12,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(0);
    expect(phpCalls).toHaveLength(1);
    expect(phpCalls[0]?.args).toContain("--verified-action-json");
    expect(phpCalls[0]?.args).toContain("--worksheet-path");
    expect(phpCalls[0]?.args).not.toContain("--dry-run");
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.url).toBe(
      "http://api.local/api/catalog/entry.php?slug=example-entry",
    );

    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome).not.toBeNull();
    expect(outcome?.ok).toBe(true);
    expect(outcome?.postCheckPassed).toBe(true);
    expect(outcome?.entrySlug).toBe("example-entry");
    expect(outcome?.trustScoreStatus).toBe("ready");
  });

  it("happy path: accepts the catalog entry API's { data, meta } response envelope", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: false,
      replacedExisting: false,
      changesApplied: [],
    };
    const { runner } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      return new Response(
        JSON.stringify({
          data: {
            id: "example-entry",
            trustScore: 42,
            trustScoreStatus: "ready",
            trustScoreBreakdown: {
              base: 50,
            },
          },
          meta: {
            locale: "en",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(0);
    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome?.ok).toBe(true);
    expect(outcome?.postCheckPassed).toBe(true);
    expect(outcome?.trustScoreStatus).toBe("ready");
  });

  it("AC failure: PHP exits 0 but the API still reports a non-ready status", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: false,
      replacedExisting: false,
      changesApplied: [],
    };
    const { runner } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      return new Response(
        JSON.stringify({
          id: "example-entry",
          trustScore: null,
          trustScoreStatus: "pending",
          trustScoreBreakdown: null,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(WRAPPER_POST_CHECK_FAILED);
    expect(fetchCalls).toHaveLength(1);

    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome).not.toBeNull();
    expect(outcome?.ok).toBe(false);
    expect(outcome?.postCheckFailed).toBe(true);
    expect(typeof outcome?.reason).toBe("string");
    expect(String(outcome?.reason)).toMatch(/pending|trustScoreStatus/);
    expect(outcome?.entrySlug).toBe("example-entry");
    expect(outcome?.observedStatus).toBe("pending");
  });

  it("AC failure: API returns ready but trustScoreBreakdown is missing", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: false,
      replacedExisting: false,
      changesApplied: [],
    };
    const { runner } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      return new Response(
        JSON.stringify({
          id: "example-entry",
          trustScoreStatus: "ready",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(WRAPPER_POST_CHECK_FAILED);

    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome?.postCheckFailed).toBe(true);
    expect(String(outcome?.reason)).toMatch(/breakdown/i);
  });

  it("HTTP-level failure: API returns 500", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: false,
      replacedExisting: false,
      changesApplied: [],
    };
    const { runner } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      return new Response("upstream failure", { status: 500 });
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(WRAPPER_POST_CHECK_FAILED);
    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome?.postCheckFailed).toBe(true);
    expect(outcome?.httpStatus).toBe(500);
    expect(String(outcome?.reason)).toMatch(/non-200|HTTP 500/);
  });

  it("HTTP-level failure: fetch throws a network error", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: false,
      replacedExisting: false,
      changesApplied: [],
    };
    const { runner } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      throw new Error("ECONNREFUSED 127.0.0.1:80");
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(WRAPPER_POST_CHECK_FAILED);
    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome?.postCheckFailed).toBe(true);
    expect(String(outcome?.reason)).toMatch(/network|ECONNREFUSED/);
    expect(outcome?.httpStatus).toBeNull();
  });

  it("--dry-run short-circuits: PHP runs in dry-run mode and the API is never called", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: true,
      replaceExisting: false,
      plan: [],
      changesApplied: [],
    };
    const { runner, calls: phpCalls } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called during dry-run");
    });

    const dryRunArgs = [
      "--verified-action-json",
      validHandoffJson,
      "--worksheet-path",
      "docs/deep-research/2026-05-27/example-entry.worksheet.md",
      "--dry-run",
    ];

    const exitCode = await main(dryRunArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(0);
    expect(phpCalls).toHaveLength(1);
    expect(phpCalls[0]?.args).toContain("--dry-run");
    expect(fetchCalls).toHaveLength(0);
  });

  it("PHP fail-closed (exit 65) pass-through: wrapper preserves outcome and never calls API", async () => {
    const phpOutcome = {
      ok: false,
      entrySlug: "example-entry",
      error: "threshold not met: 3 positive_signals (minimum 4 required)",
    };
    const { runner } = makePhpRunner({
      exitCode: 65,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "fail-closed: threshold not met\n",
    });
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called after PHP fail-closed");
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(65);
    expect(fetchCalls).toHaveLength(0);

    const joinedStdout = captures.stdout.join("");
    expect(joinedStdout).toContain("threshold not met");
    const joinedStderr = captures.stderr.join("");
    expect(joinedStderr).toContain("fail-closed");
  });

  it("PHP already-scored refusal (exit 2) pass-through: wrapper preserves outcome and never calls API", async () => {
    const phpOutcome = {
      ok: false,
      entrySlug: "example-entry",
      rolledBack: true,
      alreadyScored: true,
      requiresReplaceFlag: true,
      error: "entry 'example-entry' is already scored; pass --replace-existing to overwrite",
    };
    const { runner } = makePhpRunner({
      exitCode: 2,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called after PHP refusal");
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(2);
    expect(fetchCalls).toHaveLength(0);
    const joinedStdout = captures.stdout.join("");
    expect(joinedStdout).toContain("already scored");
  });

  it("PHP runtime failure (exit 1) pass-through: wrapper preserves outcome and never calls API", async () => {
    const phpOutcome = {
      ok: false,
      entrySlug: "example-entry",
      rolledBack: true,
      error: "PDO error: simulated failure",
    };
    const { runner } = makePhpRunner({
      exitCode: 1,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "Error: simulated\n",
    });
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called after PHP runtime failure");
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(1);
    expect(fetchCalls).toHaveLength(0);
  });

  it("rejects when both --verified-action-json and --verified-action-file are supplied", async () => {
    const { runner, calls: phpCalls } = makePhpRunner({
      exitCode: 0,
      stdout: "",
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called on invalid usage");
    });

    const exitCode = await main(
      [
        "--verified-action-json",
        validHandoffJson,
        "--verified-action-file",
        "/tmp/example.json",
        "--worksheet-path",
        "docs/example.md",
        "--api-base-url",
        "http://api.local",
      ],
      { phpRunner: runner, fetchImpl },
    );

    expect(exitCode).toBe(WRAPPER_INVALID_USAGE);
    expect(phpCalls).toHaveLength(0);
    const joinedStderr = captures.stderr.join("");
    expect(joinedStderr.toLowerCase()).toContain("invalid usage");
  });

  it("rejects when --api-base-url is missing for a non-dry-run invocation", async () => {
    const { runner, calls: phpCalls } = makePhpRunner({
      exitCode: 0,
      stdout: "",
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called on invalid usage");
    });

    const exitCode = await main(
      [
        "--verified-action-json",
        validHandoffJson,
        "--worksheet-path",
        "docs/example.md",
      ],
      { phpRunner: runner, fetchImpl },
    );

    expect(exitCode).toBe(WRAPPER_INVALID_USAGE);
    expect(phpCalls).toHaveLength(0);
    const joinedStderr = captures.stderr.join("");
    expect(joinedStderr).toMatch(/api-base-url/);
  });

  it("rejects when an unknown wrapper option is supplied", async () => {
    const { runner, calls: phpCalls } = makePhpRunner({
      exitCode: 0,
      stdout: "",
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called on invalid usage");
    });

    const exitCode = await main(
      [...baseArgs, "--no-such-wrapper-flag"],
      { phpRunner: runner, fetchImpl },
    );

    expect(exitCode).toBe(WRAPPER_INVALID_USAGE);
    expect(phpCalls).toHaveLength(0);
    const joinedStderr = captures.stderr.join("");
    expect(joinedStderr.toLowerCase()).toMatch(/unknown|invalid/);
  });

  it("rejects when --worksheet-path is missing", async () => {
    const { runner, calls: phpCalls } = makePhpRunner({
      exitCode: 0,
      stdout: "",
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called on invalid usage");
    });

    const exitCode = await main(
      [
        "--verified-action-json",
        validHandoffJson,
        "--api-base-url",
        "http://api.local",
      ],
      { phpRunner: runner, fetchImpl },
    );

    expect(exitCode).toBe(WRAPPER_INVALID_USAGE);
    expect(phpCalls).toHaveLength(0);
    const joinedStderr = captures.stderr.join("");
    expect(joinedStderr).toMatch(/worksheet-path/);
  });

  it("rejects when neither --verified-action-json nor --verified-action-file is supplied", async () => {
    const { runner, calls: phpCalls } = makePhpRunner({
      exitCode: 0,
      stdout: "",
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called on invalid usage");
    });

    const exitCode = await main(
      [
        "--worksheet-path",
        "docs/example.md",
        "--api-base-url",
        "http://api.local",
      ],
      { phpRunner: runner, fetchImpl },
    );

    expect(exitCode).toBe(WRAPPER_INVALID_USAGE);
    expect(phpCalls).toHaveLength(0);
    const joinedStderr = captures.stderr.join("");
    expect(joinedStderr.toLowerCase()).toMatch(
      /verified-action-json|verified-action-file|exactly one/,
    );
  });

  it("post-check fails when PHP succeeds but the outcome JSON has no usable entrySlug", async () => {
    const { runner } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify({ ok: true, dryRun: false })}\n`,
      stderr: "",
    });
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called when entrySlug is missing");
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(WRAPPER_POST_CHECK_FAILED);
    expect(fetchCalls).toHaveLength(0);

    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome).not.toBeNull();
    expect(outcome?.postCheckFailed).toBe(true);
    expect(outcome?.entrySlug).toBeNull();
    expect(String(outcome?.reason)).toMatch(/entrySlug/i);
  });

  it("post-check fails when the API response body is not valid JSON", async () => {
    const phpOutcome = {
      ok: true,
      entrySlug: "example-entry",
      dryRun: false,
      replacedExisting: false,
      changesApplied: [],
    };
    const { runner } = makePhpRunner({
      exitCode: 0,
      stdout: `${JSON.stringify(phpOutcome)}\n`,
      stderr: "",
    });
    const { impl: fetchImpl } = makeFetchImpl(async () => {
      return new Response("<html>not json</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(WRAPPER_POST_CHECK_FAILED);

    const outcome = findOutcomeLine(captures.stdout);
    expect(outcome).not.toBeNull();
    expect(outcome?.postCheckFailed).toBe(true);
    expect(outcome?.httpStatus).toBe(200);
    expect(String(outcome?.reason)).toMatch(/json/i);
  });

  it("returns exit 1 when the PHP runner itself throws (spawn-level failure)", async () => {
    const runner: PhpRunner = async () => {
      throw new Error("ENOENT: php binary not found");
    };
    const { impl: fetchImpl, calls: fetchCalls } = makeFetchImpl(async () => {
      throw new Error("fetch must not be called when PHP spawn fails");
    });

    const exitCode = await main(baseArgs, { phpRunner: runner, fetchImpl });

    expect(exitCode).toBe(1);
    expect(fetchCalls).toHaveLength(0);
    const joinedStderr = captures.stderr.join("");
    expect(joinedStderr.toLowerCase()).toMatch(/failed to invoke php|enoent/);
  });
});
