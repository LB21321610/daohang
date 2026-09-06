import http from "node:http";
import https from "node:https";

export type ProbeErrorKind =
  | "connection_timeout"
  | "timeout"
  | "dns"
  | "tls"
  | "redirect"
  | "network";

export interface LinkProbe {
  requestedUrl: string;
  finalUrl?: string;
  statusCode?: number;
  title?: string;
  bodySample?: string;
  bodyTruncated?: boolean;
  hadInsecureRedirect?: boolean;
  errorKind?: ProbeErrorKind;
  errorMessage?: string;
}

export type LinkCheckStatus =
  | "reachable"
  | "review"
  | "parked"
  | "soft_404"
  | "challenge"
  | "insecure_url"
  | "insecure_redirect"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "dns_error"
  | "tls_error"
  | "http_error"
  | "redirect_error"
  | "network_error";

export interface LinkCheckResult {
  url: string;
  status: LinkCheckStatus;
  finalUrl?: string;
  statusCode?: number;
  title?: string;
  reason: string;
  attempts: number;
}

export interface ProbeOptions {
  connectionTimeoutMs?: number;
  totalTimeoutMs?: number;
  maxRedirects?: number;
  maxBodyBytes?: number;
  beforeRequest?: (url: string) => Promise<void>;
}

export interface CheckLinkOptions extends ProbeOptions {
  retryDelayMs?: number;
  allowHttp?: boolean;
}

export interface CheckLinksOptions extends CheckLinkOptions {
  concurrency?: number;
  domainDelayMs?: number;
  onProgress?: (completed: number, total: number, result: LinkCheckResult) => void;
}

const defaultProbeOptions = {
  connectionTimeoutMs: 5_000,
  totalTimeoutMs: 15_000,
  maxRedirects: 5,
  maxBodyBytes: 64 * 1024,
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(body: string): string | undefined {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(body);
  if (!match?.[1]) return undefined;
  const title = decodeHtml(match[1]);
  return title || undefined;
}

function errorProbe(requestedUrl: string, error: unknown): LinkProbe {
  const nodeError = error as NodeJS.ErrnoException;
  const code = nodeError.code ?? "";
  let errorKind: ProbeErrorKind = "network";
  if (code === "ECONNECTIONTIMEOUT") errorKind = "connection_timeout";
  else if (code === "ETOTALTIMEOUT" || code === "ABORT_ERR") errorKind = "timeout";
  else if (code === "ENOTFOUND" || code === "EAI_AGAIN") errorKind = "dns";
  else if (/(?:TLS|CERT|SELF_SIGNED|UNABLE_TO_VERIFY|ERR_OSSL)/.test(code)) errorKind = "tls";
  else if (code === "EREDIRECT") errorKind = "redirect";

  return {
    requestedUrl,
    errorKind,
    errorMessage: nodeError.message || String(error),
  };
}

export async function probeUrl(rawUrl: string, options: ProbeOptions = {}): Promise<LinkProbe> {
  const resolvedOptions = { ...defaultProbeOptions, ...options };
  const requestedUrl = rawUrl;
  let deadline: number | undefined;

  async function request(
    currentUrl: string,
    redirectsRemaining: number,
    hadInsecureRedirect = false,
  ): Promise<LinkProbe> {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch (error) {
      return errorProbe(requestedUrl, error);
    }
    const transport = parsed.protocol === "https:" ? https : parsed.protocol === "http:" ? http : undefined;
    if (!transport) {
      return errorProbe(
        requestedUrl,
        Object.assign(new Error(`unsupported protocol ${parsed.protocol}`), { code: "ERR_INVALID_PROTOCOL" }),
      );
    }

    try {
      await resolvedOptions.beforeRequest?.(currentUrl);
    } catch (error) {
      return errorProbe(requestedUrl, error);
    }
    deadline ??= Date.now() + resolvedOptions.totalTimeoutMs;
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return errorProbe(requestedUrl, Object.assign(new Error("total request timeout"), { code: "ETOTALTIMEOUT" }));
    }

    const response = await new Promise<LinkProbe>((resolve) => {
      let settled = false;
      let connectionTimer: ReturnType<typeof setTimeout> | undefined;
      const totalTimer = setTimeout(() => {
        clientRequest.destroy(Object.assign(new Error("total request timeout"), { code: "ETOTALTIMEOUT" }));
      }, remainingMs);

      const finish = (result: LinkProbe) => {
        if (settled) return;
        settled = true;
        clearTimeout(totalTimer);
        if (connectionTimer) clearTimeout(connectionTimer);
        resolve(result);
      };

      const clientRequest = transport.get(
        parsed,
        {
          headers: {
            accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
            "accept-encoding": "identity",
            "user-agent": "PersonalNavigationLinkChecker/1.0",
          },
        },
        (incoming) => {
          if (connectionTimer) clearTimeout(connectionTimer);
          const statusCode = incoming.statusCode ?? 0;
          const location = incoming.headers.location;
          if (statusCode >= 300 && statusCode < 400 && location) {
            if (redirectsRemaining === 0) {
              incoming.destroy();
              finish({
                requestedUrl,
                finalUrl: currentUrl,
                statusCode,
                errorKind: "redirect",
                errorMessage: "redirect limit exceeded",
              });
              return;
            }
            let nextUrl: string;
            try {
              nextUrl = new URL(location, parsed).toString();
            } catch (error) {
              incoming.destroy();
              finish(errorProbe(requestedUrl, Object.assign(error as Error, { code: "EREDIRECT" })));
              return;
            }
            const nextProtocol = new URL(nextUrl).protocol;
            const nextHadInsecureRedirect =
              hadInsecureRedirect || (parsed.protocol === "https:" && nextProtocol === "http:");
            // Complete this response before the next hop so redirects share the concurrency limit.
            incoming.on("error", (error) => finish(errorProbe(requestedUrl, error)));
            incoming.on("end", () => {
              if (settled) return;
              void request(nextUrl, redirectsRemaining - 1, nextHadInsecureRedirect).then((result) =>
                finish({
                  ...result,
                  hadInsecureRedirect: nextHadInsecureRedirect || result.hadInsecureRedirect,
                }),
              );
            });
            incoming.resume();
            return;
          }

          const bodyChunks: Buffer[] = [];
          let bodyBytes = 0;
          const declaredBodyBytes = Number(incoming.headers["content-length"]);
          const finishBody = (bodyTruncated: boolean) => {
            const bodySample = Buffer.concat(bodyChunks, bodyBytes).toString("utf8");
            finish({
              requestedUrl,
              finalUrl: currentUrl,
              statusCode,
              title: extractTitle(bodySample),
              bodySample,
              bodyTruncated,
              hadInsecureRedirect,
            });
          };
          incoming.on("data", (chunk: Buffer) => {
            const remainingBytes = resolvedOptions.maxBodyBytes - bodyBytes;
            if (remainingBytes <= 0) {
              finishBody(true);
              incoming.destroy();
              return;
            }
            const retained = chunk.subarray(0, remainingBytes);
            bodyChunks.push(retained);
            bodyBytes += retained.byteLength;
            if (
              chunk.byteLength > remainingBytes ||
              (bodyBytes >= resolvedOptions.maxBodyBytes &&
                Number.isFinite(declaredBodyBytes) &&
                declaredBodyBytes > resolvedOptions.maxBodyBytes)
            ) {
              finishBody(true);
              incoming.destroy();
            }
          });
          incoming.on("end", () => finishBody(false));
          incoming.on("error", (error) => finish(errorProbe(requestedUrl, error)));
        },
      );

      clientRequest.on("socket", (socket) => {
        if (!socket.connecting) return;
        connectionTimer = setTimeout(() => {
          clientRequest.destroy(
            Object.assign(new Error("connection timeout"), { code: "ECONNECTIONTIMEOUT" }),
          );
        }, Math.min(resolvedOptions.connectionTimeoutMs, remainingMs));
        const event = parsed.protocol === "https:" ? "secureConnect" : "connect";
        socket.once(event, () => {
          if (connectionTimer) clearTimeout(connectionTimer);
        });
      });
      clientRequest.on("error", (error) => finish(errorProbe(requestedUrl, error)));
    });

    return response;
  }

  return request(rawUrl, resolvedOptions.maxRedirects);
}

function normalizedHostname(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function classifyProbe(
  probe: LinkProbe,
  options: { allowHttp?: boolean } = {},
): Omit<LinkCheckResult, "attempts"> {
  const base = {
    url: probe.requestedUrl,
    finalUrl: probe.finalUrl,
    statusCode: probe.statusCode,
    title: probe.title,
  };

  if (probe.errorKind === "connection_timeout" || probe.errorKind === "timeout") {
    return { ...base, status: "timeout", reason: "连接或响应超时" };
  }
  if (probe.errorKind === "dns") return { ...base, status: "dns_error", reason: "DNS 解析失败" };
  if (probe.errorKind === "tls") return { ...base, status: "tls_error", reason: "TLS 证书或握手失败" };
  if (probe.errorKind === "redirect") {
    return { ...base, status: "redirect_error", reason: probe.errorMessage ?? "重定向失败" };
  }
  if (probe.errorKind) return { ...base, status: "network_error", reason: probe.errorMessage ?? "网络请求失败" };

  if (!options.allowHttp && new URL(probe.requestedUrl).protocol !== "https:") {
    return { ...base, status: "insecure_url", reason: "原始链接不是 HTTPS" };
  }
  if (!options.allowHttp && probe.finalUrl && new URL(probe.finalUrl).protocol !== "https:") {
    return { ...base, status: "insecure_redirect", reason: "HTTPS 链接降级到 HTTP" };
  }
  if (!options.allowHttp && probe.hadInsecureRedirect) {
    return { ...base, status: "insecure_redirect", reason: "HTTPS 重定向链曾降级到 HTTP" };
  }
  if (probe.statusCode === 403) return { ...base, status: "forbidden", reason: "服务器拒绝访问（HTTP 403）" };
  if (probe.statusCode === 429) return { ...base, status: "rate_limited", reason: "请求受到限流（HTTP 429）" };
  if (!probe.statusCode || probe.statusCode < 200 || probe.statusCode >= 300) {
    return { ...base, status: "http_error", reason: `HTTP ${probe.statusCode ?? "状态未知"}` };
  }

  const title = (probe.title ?? "").trim();
  const body = probe.bodySample ?? "";
  const heading = decodeHtml(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(body)?.[1] ?? "");
  if (/\b(?:buy this domain|domain (?:is )?for sale|domain parked|parked domain)\b/i.test(title)) {
    return { ...base, status: "parked", reason: "页面标题显示域名停放或出售" };
  }
  if (
    /\b(?:404|page not found|site not found|website not found)\b/i.test(title) ||
    /^(?:404\b|(?:sorry[,!]?\s+)?(?:page|site|website) not found\b)/i.test(heading)
  ) {
    return { ...base, status: "soft_404", reason: "HTTP 200 页面标题或主标题显示内容不存在" };
  }
  if (
    /^(?:just a moment|attention required!?|checking your browser)/i.test(title) ||
    /(?:cf-chl-|cloudflare ray id|challenge-platform)/i.test(body)
  ) {
    return { ...base, status: "challenge", reason: "页面为反爬或浏览器验证挑战" };
  }
  if (
    /<h[1-3]\b[^>]*>\s*(?:this\s+)?domain (?:is|may be) for sale\b/i.test(body) ||
    /(?:sedoparking|afternic\.com|hugedomains\.com|parkingcrew\.net|assets\.abovedomains\.com)/i.test(body)
  ) {
    return { ...base, status: "parked", reason: "页面包含明确的域名停放模板" };
  }
  if (
    /<meta[^>]+http-equiv=["']?refresh/i.test(body) ||
    /(?:window\.)?location(?:\.href)?\s*=|document\.location\s*=/i.test(body)
  ) {
    return { ...base, status: "review", reason: "页面使用 HTML 或 JavaScript 跳转，需人工复核" };
  }
  if (
    probe.finalUrl &&
    normalizedHostname(probe.requestedUrl) !== normalizedHostname(probe.finalUrl)
  ) {
    return { ...base, status: "review", reason: "最终地址跳转到不同主机名，需人工复核" };
  }
  if (probe.bodyTruncated && !probe.title) {
    return { ...base, status: "review", reason: "响应采样已截断且未读取到页面标题，需人工复核" };
  }
  const visibleText = decodeHtml(body.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<!--[\s\S]*?-->/g, " "));
  if (!title && !/[\p{L}\p{N}]{3}/u.test(visibleText)) {
    return { ...base, status: "review", reason: "响应缺少可核对的页面内容，需浏览器复核" };
  }

  return { ...base, status: "reachable", reason: "页面可读取，仍需人工核对内容" };
}

function shouldRetry(result: Omit<LinkCheckResult, "attempts">): boolean {
  return [
    "forbidden",
    "rate_limited",
    "timeout",
    "dns_error",
    "tls_error",
    "http_error",
    "network_error",
  ].includes(result.status);
}

export async function checkLink(
  url: string,
  options: CheckLinkOptions = {},
): Promise<LinkCheckResult> {
  const retryDelayMs = options.retryDelayMs ?? 1_000;
  const protocol = new URL(url).protocol;
  if (protocol !== "https:" && !(options.allowHttp && protocol === "http:")) {
    return {
      url,
      status: "insecure_url",
      reason: "原始链接不是 HTTPS",
      attempts: 0,
    };
  }

  let lastResult: Omit<LinkCheckResult, "attempts"> | undefined;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const probe = await probeUrl(url, options);
    lastResult = classifyProbe(probe, { allowHttp: options.allowHttp });
    if (!shouldRetry(lastResult) || attempt === 2) return { ...lastResult, attempts: attempt };
    await delay(retryDelayMs);
  }

  throw new Error("unreachable");
}

export async function checkLinks(
  urls: string[],
  options: CheckLinksOptions = {},
): Promise<LinkCheckResult[]> {
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? 4));
  const domainDelayMs = Math.max(0, options.domainDelayMs ?? 750);
  const nextDomainStart = new Map<string, number>();
  let nextIndex = 0;
  let completed = 0;
  const results = new Array<LinkCheckResult>(urls.length);

  async function waitForDomain(url: string): Promise<void> {
    const hostname = normalizedHostname(url) ?? new URL(url).hostname.toLowerCase();
    const waitMs = Math.max(0, (nextDomainStart.get(hostname) ?? 0) - Date.now());
    nextDomainStart.set(hostname, Date.now() + waitMs + domainDelayMs);
    if (waitMs) await delay(waitMs);
  }

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      const url = urls[index];
      if (url === undefined) return;
      results[index] = await checkLink(url, {
        ...options,
        beforeRequest: async (requestUrl) => {
          await waitForDomain(requestUrl);
          await options.beforeRequest?.(requestUrl);
        },
      });
      completed += 1;
      options.onProgress?.(completed, urls.length, results[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
  return results;
}
