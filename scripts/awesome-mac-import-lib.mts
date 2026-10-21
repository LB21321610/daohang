import { parse, stringify } from "yaml";

export const AWESOME_MAC_REPOSITORY = "https://github.com/jaywcjlove/awesome-mac";
export const AWESOME_MAC_CATEGORY = "awesome-mac";
const ID_PREFIX = "am-";

interface SectionDefinition {
  id: string;
  label: string;
}

// Upstream H2 headings → this site's sections. Unknown headings fail the import so a renamed
// upstream section is noticed instead of silently dropped.
const sectionByHeading: Record<string, SectionDefinition> = {
  "Reading and Writing Tools": { id: "reading-writing", label: "阅读与写作" },
  "Developer Tools": { id: "developer", label: "开发者工具" },
  "Terminal Apps": { id: "terminal", label: "终端应用" },
  "Design and Product": { id: "design", label: "设计与产品" },
  "AI Tools": { id: "ai-tools", label: "AI 工具" },
  Communication: { id: "communication", label: "沟通协作" },
  "Data Recovery Tools": { id: "data-recovery", label: "数据恢复" },
  "Audio and Video Tools": { id: "audio-video", label: "音频与视频" },
  "Download Management Tools": { id: "download", label: "下载管理" },
  "Cloud Storage": { id: "cloud-storage", label: "云存储" },
  "Input Methods": { id: "input-methods", label: "输入法" },
  "Voice-to-Text": { id: "voice-to-text", label: "语音转文字" },
  Browsers: { id: "browsers", label: "浏览器" },
  "Translation Tools": { id: "translation", label: "翻译工具" },
  Education: { id: "education", label: "教育" },
  Finance: { id: "finance", label: "财务" },
  Encryption: { id: "encryption", label: "加密" },
  "Security Tools": { id: "security", label: "安全工具" },
  "Proxy and VPN Tools": { id: "proxy-vpn", label: "代理与 VPN" },
  Utilities: { id: "utilities", label: "实用工具" },
  "Gaming Software": { id: "gaming", label: "游戏软件" },
  "Remote Login Software": { id: "remote-login", label: "远程登录" },
  "QuickLook Plugins": { id: "quicklook", label: "QuickLook 插件" },
  "Third Party App Markets": { id: "app-markets", label: "第三方应用市场" },
  "Mac App Download Sites": { id: "download-sites", label: "软件发现站" },
};

const subsectionByHeading: Record<string, string> = {
  "Text Editors": "文本编辑器",
  Office: "办公",
  "Markdown Tools": "Markdown 工具",
  "Note-taking": "笔记",
  Journaling: "日记",
  Writing: "写作",
  Ebooks: "电子书",
  RSS: "RSS 阅读",
  Others: "其他",
  IDEs: "IDE",
  "Developer Utilities": "开发辅助",
  "Regular Expression Editors": "正则表达式",
  "API Development and Analysis": "API 开发与调试",
  "Network Analysis": "网络分析",
  "Frameworks For Hybrid Applications": "跨平台应用框架",
  "Version Control": "版本控制",
  Virtualization: "虚拟化",
  Databases: "数据库",
  "Design Tools": "设计工具",
  "Prototyping and Mind-Mapping Tools": "原型与思维导图",
  "Screenshot Tools": "截图",
  "Screen Recording": "录屏",
  "Other Tools": "其他工具",
  "Collaboration and Team Tools": "团队协作",
  "Email Clients": "邮件客户端",
  "File Sharing": "文件传输",
  "Audio Record and Process": "录音与音频处理",
  "Clipboard Tools": "剪贴板",
  "Menu Bar Tools": "菜单栏",
  "Cleanup and Uninstall": "清理与卸载",
  "File Organization Tools": "文件整理",
  "General Tools": "通用工具",
  "To-Do Lists": "待办清单",
  Productivity: "效率",
  "Window Management": "窗口管理",
  "Password Management": "密码管理",
  "Finder Tools": "Finder 增强",
  "Quality of Life Improvements": "体验优化",
  "System Related Tools": "系统工具",
  "Package Managers": "包管理器",
  "Genuine Sites": "正版软件导航",
};

// Upstream keeps a blocklist of piracy sites under this heading; none of it is imported.
const skippedSubsections = new Set(["Pirated software download site blocklist"]);

const badgeTags: Array<[pattern: RegExp, tag: string]> = [
  [/\[OSS Icon\]/, "开源"],
  [/\[Freeware Icon\]/, "免费"],
  [/\[app-store Icon\]/, "App Store"],
  [/\[Native Icon\]/, "原生应用"],
];

export interface AwesomeMacEntry {
  name: string;
  url: string;
  description: string;
  section: string;
  subsection?: string;
  tags: string[];
}

export interface AwesomeMacLinkAudit {
  /** Published URLs confirmed to open the expected page. */
  verified: string[];
  /** Upstream URLs that are dead, parked, hijacked, or no longer about the listed app. */
  removed: Array<{ url: string; reason: string }>;
  /** Upstream URLs whose app now lives elsewhere (same app, new address). */
  moved: Array<{ from: string; to: string; reason: string }>;
  /** Upstream URLs that keep the high-risk warning used elsewhere on this site. */
  highRisk: Array<{ url: string; reason: string }>;
}

export interface AwesomeMacSite {
  id: string;
  name: string;
  url: string;
  description: string;
  category: typeof AWESOME_MAC_CATEGORY;
  section: string;
  subsection?: string;
  tags: string[];
  riskLevel: "standard" | "high";
  reviewStatus: "unverified";
  linkStatus: "verified" | "unchecked";
  source: { kind: "awesome-mac"; url: typeof AWESOME_MAC_REPOSITORY };
}

export interface BuildOptions {
  /** Chinese descriptions keyed by upstream URL. */
  descriptions?: Record<string, string>;
  audit?: AwesomeMacLinkAudit;
  /** Normalized URLs that already live elsewhere in the catalog. */
  reservedUrls?: Iterable<string>;
  /** IDs from the previous import keyed by published URL; favourites are stored by ID, so they must not move. */
  previousIds?: Iterable<readonly [url: string, id: string]>;
  onWarning?: (message: string) => void;
}

export function awesomeMacSections(): SectionDefinition[] {
  return Object.values(sectionByHeading);
}

export function normalizeAwesomeMacUrl(rawUrl: string): string | undefined {
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

/** Looser key used to pair the English and Chinese upstream READMEs. */
function matchKey(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#]+$/, "");
}

function cleanHeading(heading: string): string {
  return heading
    .replace(/\[!\[[^\]]*\]\[[^\]]*\]\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

export function cleanDescription(raw: string): string {
  return raw
    .replace(/\[!\[[^\]]*\](?:\[[^\]]*\]|\([^)]*\))\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\](?:\[[^\]]*\]|\([^)]*\))/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*[-–—:：]\s*/, "")
    .replace(/\s*[-–—]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[。.]+$/, "")
    .trim();
}

interface RawLink {
  name: string;
  url: string;
  rest: string;
}

function parseBulletLinks(line: string): RawLink[] {
  const body = line.replace(/^\*\s+/, "");

  const standard = /^\[([^\]]+)\]\((\S+?)\)\s*(.*)$/.exec(body);
  if (standard) return [{ name: standard[1]!.trim(), url: standard[2]!, rest: standard[3] ?? "" }];

  // "App Shopper：[https://appshopper.com/](https://appshopper.com/)"
  const labelled = /^([^[：:]+)[：:]\s*\[[^\]]+\]\((\S+?)\)\s*(.*)$/.exec(body);
  if (labelled) return [{ name: labelled[1]!.trim(), url: labelled[2]!, rest: labelled[3] ?? "" }];

  // "Also, [Quora](…), [Reddit](…), you know the drill."
  return [...body.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)].map((match) => ({
    name: match[1]!.trim(),
    url: match[2]!,
    rest: "",
  }));
}

function markedContent(markdown: string): string {
  const start = markdown.indexOf("<!--start-->");
  const end = markdown.indexOf("<!--end-->");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("awesome-mac README is missing the <!--start--> / <!--end--> markers");
  }
  return markdown.slice(start, end);
}

export function parseAwesomeMacMarkdown(markdown: string): AwesomeMacEntry[] {
  const entries: AwesomeMacEntry[] = [];
  let section: SectionDefinition | undefined;
  let subsectionHeading: string | undefined;

  for (const line of markedContent(markdown).split(/\r?\n/)) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (h2) {
      const heading = cleanHeading(h2[1]!);
      section = sectionByHeading[heading];
      if (!section) throw new Error(`Unknown awesome-mac section: ${heading}`);
      subsectionHeading = undefined;
      continue;
    }

    const h3 = /^###\s+(.+?)\s*$/.exec(line);
    if (h3) {
      subsectionHeading = cleanHeading(h3[1]!);
      if (!skippedSubsections.has(subsectionHeading) && !subsectionByHeading[subsectionHeading]) {
        throw new Error(`Unknown awesome-mac subsection: ${subsectionHeading}`);
      }
      continue;
    }

    if (!line.startsWith("* ") || !section) continue;
    if (subsectionHeading && skippedSubsections.has(subsectionHeading)) continue;

    const subsection = subsectionHeading ? subsectionByHeading[subsectionHeading] : undefined;
    for (const link of parseBulletLinks(line)) {
      const url = normalizeAwesomeMacUrl(link.url);
      if (!url) continue;

      const tags = [section.label, ...(subsection ? [subsection] : [])];
      for (const [pattern, tag] of badgeTags) if (pattern.test(link.rest)) tags.push(tag);

      entries.push({
        name: link.name,
        url,
        description: cleanDescription(link.rest),
        section: section.id,
        ...(subsection ? { subsection } : {}),
        tags,
      });
    }
  }

  return entries;
}

/** Chinese descriptions from upstream README-zh.md, keyed by the loose URL key and by name. */
export function parseAwesomeMacChineseDescriptions(markdown: string): {
  byUrl: Map<string, string>;
  byName: Map<string, string>;
} {
  const byUrl = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const line of markedContent(markdown).split(/\r?\n/)) {
    if (!line.startsWith("* ")) continue;
    for (const link of parseBulletLinks(line)) {
      const description = cleanDescription(link.rest);
      if (!description || !/\p{Script=Han}/u.test(description)) continue;
      const url = normalizeAwesomeMacUrl(link.url);
      if (url && !byUrl.has(matchKey(url))) byUrl.set(matchKey(url), description);
      const nameKey = link.name.toLowerCase();
      if (!byName.has(nameKey)) byName.set(nameKey, description);
    }
  }

  return { byUrl, byName };
}

export function chineseDescriptionFor(
  entry: Pick<AwesomeMacEntry, "name" | "url">,
  chinese: ReturnType<typeof parseAwesomeMacChineseDescriptions>,
): string | undefined {
  return chinese.byUrl.get(matchKey(entry.url)) ?? chinese.byName.get(entry.name.toLowerCase());
}

function slugify(name: string, url: string): string {
  const nameSlug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (nameSlug) return nameSlug;
  return new URL(url).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildAwesomeMacSites(entries: AwesomeMacEntry[], options: BuildOptions = {}): AwesomeMacSite[] {
  const reserved = new Set(options.reservedUrls ?? []);
  const verified = new Set(options.audit?.verified ?? []);
  const removed = new Set(options.audit?.removed.map((item) => item.url) ?? []);
  const moved = new Map(options.audit?.moved.map((item) => [item.from, item.to]) ?? []);
  const highRisk = new Set(options.audit?.highRisk.map((item) => item.url) ?? []);
  const byUrl = new Map<string, AwesomeMacSite>();
  const previousIds = new Map(options.previousIds ?? []);
  // Retired IDs stay reserved too, so a new app never inherits a removed app's favourites.
  const usedIds = new Set(previousIds.values());

  for (const entry of entries) {
    if (removed.has(entry.url)) continue;
    const url = moved.get(entry.url) ?? entry.url;
    if (reserved.has(url)) continue;
    // The catalog only links over HTTPS; guessing an upgrade could publish a dead link.
    if (!url.startsWith("https:")) {
      options.onWarning?.(`Skipped ${entry.name}: ${url} is not HTTPS; add a moved entry to the link audit`);
      continue;
    }

    const existing = byUrl.get(url);
    if (existing) {
      // Same app listed under several upstream headings: keep the first, remember the rest as tags.
      for (const tag of entry.tags) if (!existing.tags.includes(tag)) existing.tags.push(tag);
      continue;
    }

    let id = previousIds.get(url) ?? previousIds.get(entry.url);
    if (!id) {
      const baseId = `${ID_PREFIX}${slugify(entry.name, url)}`;
      id = baseId;
      for (let suffix = 2; usedIds.has(id); suffix += 1) id = `${baseId}-${suffix}`;
      usedIds.add(id);
    }

    const description =
      options.descriptions?.[entry.url] ?? (entry.description || `awesome-mac 收录的 ${entry.name}`);

    byUrl.set(url, {
      id,
      name: entry.name,
      url,
      description,
      category: AWESOME_MAC_CATEGORY,
      section: entry.section,
      ...(entry.subsection ? { subsection: entry.subsection } : {}),
      tags: [...entry.tags],
      riskLevel: highRisk.has(entry.url) ? "high" : "standard",
      reviewStatus: "unverified",
      linkStatus: verified.has(url) ? "verified" : "unchecked",
      source: { kind: "awesome-mac", url: AWESOME_MAC_REPOSITORY },
    });
  }

  return [...byUrl.values()];
}

export function parseLinkAudit(yaml: string): AwesomeMacLinkAudit {
  const value = parse(yaml) as Partial<AwesomeMacLinkAudit> | null;
  return {
    verified: value?.verified ?? [],
    removed: value?.removed ?? [],
    moved: value?.moved ?? [],
    highRisk: value?.highRisk ?? [],
  };
}

export function parseDescriptions(yaml: string): Record<string, string> {
  return (parse(yaml) as Record<string, string> | null) ?? {};
}

export function stringifyAwesomeMacSites(sites: AwesomeMacSite[]): string {
  const header =
    "# Generated by `npm run content:import-awesome-mac` from https://github.com/jaywcjlove/awesome-mac (CC BY 4.0).\n" +
    "# Edit content/awesome-mac/*.yml instead and re-run the importer.\n";
  // One flow mapping per line, matching the hand-written catalog files.
  const lines = sites.map(
    (site) => `- ${stringify(site, { collectionStyle: "flow", flowCollectionPadding: true, lineWidth: 0 }).trim()}`,
  );
  return `${header}${lines.join("\n")}\n`;
}
