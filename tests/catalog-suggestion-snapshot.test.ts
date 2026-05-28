import { spawn } from "node:child_process";
import { type AddressInfo, createServer, type Server } from "node:http";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const projectDir = resolve(".");
const snapshotScript = resolve("scripts/catalog-suggestion-snapshot.mjs");

let server: Server | null = null;

function startServer(): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      res.setHeader("Content-Type", "application/json");

      if (url.pathname === "/catalog/categories") {
        res.end(JSON.stringify({ data: [{ id: "messaging", name: "Messaging" }] }));
        return;
      }

      if (url.pathname === "/catalog/countries") {
        res.end(
          JSON.stringify({
            data: [{ code: "us", label: "United States" }],
          }),
        );
        return;
      }

      if (
        url.pathname === "/catalog/entries" &&
        url.searchParams.get("status") === "alternative"
      ) {
        res.end(
          JSON.stringify({
            data: [{ id: "element", name: "Element", website: "https://element.io" }],
          }),
        );
        return;
      }

      if (
        url.pathname === "/catalog/entries" &&
        url.searchParams.get("status") === "us"
      ) {
        const generated = Array.from({ length: 900 }, (_, index) => ({
          id: `benchmark-${index}`,
          name: `Benchmark Product ${index}`.padEnd(80, "x"),
          website: `https://benchmark-${index}.example`,
        }));
        res.end(
          JSON.stringify({
            data: [
              {
                id: "telegram",
                name: "Telegram",
                website: "https://telegram.org/",
              },
              ...generated,
            ],
          }),
        );
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: "not_found" }));
    });

    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => {
      const address = server?.address() as AddressInfo;
      resolvePromise(`http://127.0.0.1:${address.port}`);
    });
  });
}

afterEach(() => {
  server?.close();
  server = null;
});

function runSnapshot(apiBase: string): Promise<{
  status: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [snapshotScript, "--api-base", apiBase], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, 10_000);

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({
        status: code,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });
}

describe("catalog-suggestion-snapshot", () => {
  it("includes alternative and US entries and flushes large JSON output", async () => {
    const apiBase = await startServer();

    const result = await runSnapshot(apiBase);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(65_536);

    const snapshot = JSON.parse(result.stdout) as {
      entries: Array<{ slug: string; status: string }>;
    };

    expect(snapshot.entries.find((entry) => entry.slug === "element")?.status).toBe(
      "alternative",
    );
    expect(snapshot.entries.find((entry) => entry.slug === "telegram")?.status).toBe(
      "us",
    );
  });
});
