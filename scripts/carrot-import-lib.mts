import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { stringify } from "yaml";

const allowedCategories = new Set(["热门", "Agent", "对话", "绘画", "模型", "办公", "编程", "应用", "导航站"]);

const knownUpstreamAnomalies = [
  {
    category: "导航站",
    name: "TheBestTools.ai - 专业AI工具发现平台",
    invalidHref: "TheBestTools.ai - 专业AI工具发现平台",
    replacementUrl: "https://thebesttools.ai/",
  },
] as const;

export interface CarrotParseOptions {
  onWarning?: (message: string) => void;
}

export interface CarrotImportSite {
  id: string;
  name: string;
  url: string;
  category: string;
  tags: string[];
  source: {
    kind: "carrot";
    url: "https://github.com/xx025/carrot";
  };
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function normalizeUrl(rawUrl: string): string | undefined {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname !== "/") parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function slugify(name: string, url: string): string {
  const nameSlug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (nameSlug) return nameSlug;

  return new URL(url).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseCarrotMarkdown(markdown: string, options: CarrotParseOptions = {}): CarrotImportSite[] {
  const headings = [...markdown.matchAll(/^##\s+(.+?)\s*$/gm)];
  const byUrl = new Map<string, CarrotImportSite>();
  const malformedUrls: Array<{ category: string; name: string; row: number; href: string }> = [];

  headings.forEach((heading, index) => {
    const category = heading[1]?.trim();
    if (!category || !allowedCategories.has(category) || heading.index === undefined) return;

    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(start, end);
    let candidateRow = 0;

    for (const rowMatch of section.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const row = rowMatch[1] ?? "";
      if (!/<td\b/i.test(row)) continue;
      candidateRow += 1;

      const anchors = [...row.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
      const anchor = anchors.find((candidate) => {
        const label = decodeHtml(candidate[2] ?? "");
        return label.length > 1 && label !== "🔗";
      });
      if (!anchor) {
        throw new Error(`${category} row ${candidateRow}: missing site link`);
      }

      const name = decodeHtml(anchor[2] ?? "");
      const rawHref = (anchor[1] ?? "").trim();
      const url = normalizeUrl(rawHref);
      if (!name) {
        throw new Error(`${category} row ${candidateRow}: missing site name`);
      }
      if (!url) {
        malformedUrls.push({ category, name, row: candidateRow, href: rawHref });
        continue;
      }

      const existing = byUrl.get(url);
      if (existing) {
        if (!existing.tags.includes(category)) existing.tags.push(category);
        continue;
      }

      byUrl.set(url, {
        id: slugify(name, url),
        name,
        url,
        category,
        tags: [category],
        source: { kind: "carrot", url: "https://github.com/xx025/carrot" },
      });
    }
  });

  const sites = [...byUrl.values()];
  for (const malformed of malformedUrls) {
    const anomaly = knownUpstreamAnomalies.find(
      (candidate) =>
        candidate.category === malformed.category &&
        candidate.name === malformed.name &&
        candidate.invalidHref === malformed.href,
    );
    const hasExactReplacement =
      anomaly !== undefined &&
      sites.some(
        (site) =>
          site.tags.includes(anomaly.category) &&
          site.name === anomaly.name &&
          site.url === anomaly.replacementUrl,
      );

    if (!hasExactReplacement || !anomaly) {
      throw new Error(`${malformed.category} row ${malformed.row}: invalid URL`);
    }

    options.onWarning?.(
      `Suppressed known upstream anomaly at ${malformed.category} row ${malformed.row}: ` +
        `invalid URL replaced by ${anomaly.replacementUrl}`,
    );
  }

  return sites;
}

export async function importCarrotMarkdown(
  markdown: string,
  outputPath: string,
  expectedCategoryCount = 9,
  onWarning: (message: string) => void = (message) => console.warn(message),
): Promise<CarrotImportSite[]> {
  const sites = parseCarrotMarkdown(markdown, { onWarning });
  const categories = new Set(sites.flatMap((site) => site.tags));

  if (sites.length === 0 || categories.size !== expectedCategoryCount) {
    throw new Error(`Unexpected carrot structure: ${sites.length} sites across ${categories.size} categories`);
  }

  const temporaryPath = `${outputPath}.next`;
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(temporaryPath, stringify(sites, { lineWidth: 120 }), "utf8");
  await rename(temporaryPath, outputPath);
  return sites;
}
