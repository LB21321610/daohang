import { createServer, type RequestListener, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import {
  checkLink,
  checkLinks,
  classifyProbe,
  probeUrl,
  type LinkProbe,
} from "../../scripts/link-check-lib.mts";

const servers: Server[] = [];

async function listen(handler: RequestListener): Promise<string> {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});

describe("probeUrl", () => {
  it("follows an HTTP redirect and captures the final page title", async () => {
    const baseUrl = await listen((request, response) => {
      if (request.url === "/start") {
        response.writeHead(302, { location: "/destination" }).end();
        return;
      }
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<!doctype html><title>Destination</title><main>Useful content</main>");
    });

    const probe = await probeUrl(`${baseUrl}/start`, {
      connectionTimeoutMs: 500,
      totalTimeoutMs: 1_000,
    });

    expect(probe).toMatchObject({
      finalUrl: `${baseUrl}/destination`,
      statusCode: 200,
      title: "Destination",
    });
  });

  it("aborts a response that exceeds the total timeout", async () => {
    const baseUrl = await listen((_request, response) => {
      setTimeout(() => response.end("<title>Too late</title>"), 200);
    });

    const probe = await probeUrl(baseUrl, {
      connectionTimeoutMs: 100,
      totalTimeoutMs: 30,
    });

    expect(probe.errorKind).toBe("timeout");
  });

  it("stops reading after the body sample limit and records truncation", async () => {
    let sentTail = false;
    const baseUrl = await listen((_request, response) => {
      const prefix = `<html><head>${"x".repeat(4_096)}`;
      const tail = "<title>Too late</title></head></html>";
      response.writeHead(200, {
        "content-length": Buffer.byteLength(prefix + tail),
        "content-type": "text/html",
      });
      response.write(prefix.slice(0, 256));
      const bodyTimer = setTimeout(() => response.write(prefix.slice(256)), 10);
      const tailTimer = setTimeout(() => {
        sentTail = true;
        response.end(tail);
      }, 100);
      response.on("close", () => {
        clearTimeout(bodyTimer);
        clearTimeout(tailTimer);
      });
    });

    const probe = await probeUrl(baseUrl, {
      connectionTimeoutMs: 500,
      maxBodyBytes: 1_024,
      totalTimeoutMs: 1_000,
    });

    expect(Buffer.byteLength(probe.bodySample ?? "")).toBe(1_024);
    expect(probe.bodyTruncated).toBe(true);
    expect(probe.title).toBeUndefined();
    expect(sentTail).toBe(false);
  });
});

describe("classifyProbe", () => {
  function successfulProbe(overrides: Partial<LinkProbe> = {}): LinkProbe {
    return {
      requestedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      statusCode: 200,
      title: "Example",
      bodySample: "<title>Example</title><main>Working page</main>",
      ...overrides,
    };
  }

  it("marks a normal readable page reachable without claiming it is verified", () => {
    expect(classifyProbe(successfulProbe())).toMatchObject({
      status: "reachable",
      reason: "页面可读取，仍需人工核对内容",
    });
  });

  it("does not mistake ordinary article text about a domain sale or not-found page for a parked site", () => {
    const result = classifyProbe(
      successfulProbe({
        title: "Hosting troubleshooting guide",
        bodySample:
          "<title>Hosting troubleshooting guide</title><article>This guide explains why a domain for sale banner or a not found message may appear.</article>",
      }),
    );

    expect(result.status).toBe("reachable");
  });

  it.each([
    ["Buy this domain", "parked"],
    ["404 - Page Not Found", "soft_404"],
    ["Just a moment...", "challenge"],
  ] as const)("classifies the title %s as %s", (title, status) => {
    expect(classifyProbe(successfulProbe({ title }))).toMatchObject({ status });
  });

  it.each([
    ["<html><body><h1>This domain is for sale</h1><p>Contact the owner.</p></body></html>"],
    [
      '<html><head><script src="https://assets.abovedomains.com/javascript/forsale.min.js"></script></head></html>',
    ],
  ])("classifies a known parking page without relying on its title", (bodySample) => {
    const result = classifyProbe(successfulProbe({ bodySample, title: undefined }));

    expect(result.status).toBe("parked");
  });

  it("classifies a not-found primary heading without matching ordinary article text", () => {
    const missing = classifyProbe(
      successfulProbe({
        bodySample: "<html><body><h1>Page not found</h1><p>Try another URL.</p></body></html>",
        title: undefined,
      }),
    );
    const article = classifyProbe(
      successfulProbe({
        bodySample:
          "<html><body><h1>Hosting guide</h1><p>This article explains a page not found message.</p></body></html>",
        title: undefined,
      }),
    );

    expect(missing.status).toBe("soft_404");
    expect(article.status).toBe("reachable");
  });

  it.each([
    ["an empty response", ""],
    ["a script-only response", "<html><body><script>bootstrapApplication()</script></body></html>"],
  ])("requires review for %s with HTTP 200", (_label, bodySample) => {
    const result = classifyProbe(successfulProbe({ bodySample, title: undefined }));

    expect(result.status).toBe("review");
  });

  it("requires review for script-driven navigation", () => {
    const result = classifyProbe(
      successfulProbe({
        bodySample: '<title>Loading</title><script>window.location.href="https://other.example"</script>',
      }),
    );

    expect(result.status).toBe("review");
  });

  it("rejects an HTTPS request that finishes on HTTP", () => {
    const result = classifyProbe(
      successfulProbe({
        finalUrl: "http://example.com/",
      }),
    );

    expect(result.status).toBe("insecure_redirect");
  });

  it("rejects an HTTPS redirect chain that briefly downgrades to HTTP", () => {
    const result = classifyProbe(
      successfulProbe({
        hadInsecureRedirect: true,
      }),
    );

    expect(result.status).toBe("insecure_redirect");
  });

  it("requires review when the bounded sample ends before a title appears", () => {
    const result = classifyProbe(
      successfulProbe({
        bodySample: `<html><head>${" ".repeat(64 * 1_024 - 12)}`,
        bodyTruncated: true,
        title: undefined,
      }),
    );

    expect(result.status).toBe("review");
  });

  it("requires review when a redirect finishes on an unrelated hostname", () => {
    const result = classifyProbe(
      successfulProbe({
        finalUrl: "https://unrelated.example/",
      }),
    );

    expect(result.status).toBe("review");
  });
});

describe("checkLink", () => {
  it("retries one transient response after the configured interval", async () => {
    let attempts = 0;
    const baseUrl = await listen((_request, response) => {
      attempts += 1;
      if (attempts === 1) {
        response.writeHead(503).end("temporarily unavailable");
        return;
      }
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<title>Recovered</title>");
    });

    const result = await checkLink(baseUrl, {
      allowHttp: true,
      connectionTimeoutMs: 500,
      retryDelayMs: 5,
      totalTimeoutMs: 1_000,
    });

    expect(attempts).toBe(2);
    expect(result).toMatchObject({ status: "reachable", title: "Recovered", attempts: 2 });
  });

  it("reports HTTP 403 separately after one retry", async () => {
    let attempts = 0;
    const baseUrl = await listen((_request, response) => {
      attempts += 1;
      response.writeHead(403).end("forbidden");
    });

    const result = await checkLink(baseUrl, {
      allowHttp: true,
      connectionTimeoutMs: 500,
      retryDelayMs: 5,
      totalTimeoutMs: 1_000,
    });

    expect(attempts).toBe(2);
    expect(result.status).toBe("forbidden");
  });
});

describe("checkLinks", () => {
  it("never exceeds the configured request concurrency", async () => {
    let active = 0;
    let maximumActive = 0;
    const baseUrl = await listen((_request, response) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      setTimeout(() => {
        active -= 1;
        response.end("<title>OK</title>");
      }, 25);
    });

    await checkLinks(
      ["/a", "/b", "/c", "/d"].map((path) => `${baseUrl}${path}`),
      {
        allowHttp: true,
        concurrency: 2,
        connectionTimeoutMs: 500,
        domainDelayMs: 0,
        totalTimeoutMs: 1_000,
      },
    );

    expect(maximumActive).toBe(2);
  });

  it("spaces requests to the same hostname", async () => {
    const requestTimes: number[] = [];
    const baseUrl = await listen((_request, response) => {
      requestTimes.push(Date.now());
      response.end("<title>OK</title>");
    });

    await checkLinks([`${baseUrl}/a`, `${baseUrl}/b`], {
      allowHttp: true,
      concurrency: 2,
      connectionTimeoutMs: 500,
      domainDelayMs: 40,
      totalTimeoutMs: 1_000,
    });

    expect(requestTimes).toHaveLength(2);
    expect(requestTimes[1]! - requestTimes[0]!).toBeGreaterThanOrEqual(30);
  });

  it("spaces same-host redirect hops", async () => {
    const requestTimes: number[] = [];
    const baseUrl = await listen((request, response) => {
      requestTimes.push(Date.now());
      if (request.url === "/start") {
        response.writeHead(302, { location: "/destination" }).end();
        return;
      }
      response.end("<title>OK</title>");
    });

    await checkLinks([`${baseUrl}/start`], {
      allowHttp: true,
      concurrency: 1,
      connectionTimeoutMs: 500,
      domainDelayMs: 40,
      totalTimeoutMs: 1_000,
    });

    expect(requestTimes).toHaveLength(2);
    expect(requestTimes[1]! - requestTimes[0]!).toBeGreaterThanOrEqual(30);
  });

  it("closes a slow redirect response before opening the next hop", async () => {
    let active = 0;
    let maximumActive = 0;
    const baseUrl = await listen((request, response) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      response.on("close", () => {
        active -= 1;
      });

      if (request.url === "/start") {
        response.writeHead(302, { location: "/destination" });
        response.write("slow redirect body");
        const endTimer = setTimeout(() => response.end(), 100);
        response.on("close", () => clearTimeout(endTimer));
        return;
      }
      response.end("<title>OK</title>");
    });

    await checkLinks([`${baseUrl}/start`], {
      allowHttp: true,
      concurrency: 1,
      connectionTimeoutMs: 500,
      domainDelayMs: 0,
      totalTimeoutMs: 1_000,
    });

    expect(maximumActive).toBe(1);
  });

  it("reports completed checks through the progress callback", async () => {
    const baseUrl = await listen((_request, response) => response.end("<title>OK</title>"));
    const completed: Array<{ completed: number; total: number; url: string }> = [];

    await checkLinks([`${baseUrl}/a`, `${baseUrl}/b`], {
      allowHttp: true,
      concurrency: 1,
      domainDelayMs: 0,
      onProgress: (count, total, result) => {
        completed.push({ completed: count, total, url: result.url });
      },
      totalTimeoutMs: 1_000,
    });

    expect(completed).toEqual([
      { completed: 1, total: 2, url: `${baseUrl}/a` },
      { completed: 2, total: 2, url: `${baseUrl}/b` },
    ]);
  });
});
