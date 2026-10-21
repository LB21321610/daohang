import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

import {
  awesomeMacSections,
  buildAwesomeMacSites,
  chineseDescriptionFor,
  cleanDescription,
  parseAwesomeMacChineseDescriptions,
  parseAwesomeMacMarkdown,
  parseDescriptions,
  parseLinkAudit,
  stringifyAwesomeMacSites,
} from "../../scripts/awesome-mac-import-lib.mts";
import { discoverSiteDocuments } from "../../scripts/content-files.mts";
import { compileCatalog } from "../../scripts/content-lib.mts";
import { searchSites } from "../../src/domain/search";

const englishReadme = `
# Awesome Mac
* [Not imported](https://example.com/outside-markers) - Sponsor line outside the markers.

<!--start-->

## Reading and Writing Tools

### Text Editors

* [CotEditor](https://coteditor.com) - Lightweight plain-text editor for macOS. [![Open-Source Software][OSS Icon]](https://github.com/coteditor/CotEditor/) ![Freeware][Freeware Icon]
* [Nova](https://nova.app/) - The beautiful, fast, flexible, native Mac code editor from **Panic**.

### Markdown Tools [![Awesome List][awesome-list Icon]](https://github.com/BubuAnabelas/awesome-markdown#tools)

* [Typora](https://typora.io/) - A minimal Markdown reading & writing app. See [docs](https://support.typora.io/).

## Utilities

### Window Management

* [Rectangle](https://rectangleapp.com/) - Move and resize windows using keyboard shortcuts or snap areas. [![App Store][app-store Icon]](https://apps.apple.com/app/id1) ![Native][Native Icon]
* [CotEditor](https://coteditor.com/) - Listed twice upstream.

## Mac App Download Sites

### Genuine Sites

* App Shopper：[https://appshopper.com/](https://appshopper.com/)
* Also, [Quora](https://www.quora.com/), [Reddit](https://www.reddit.com), you know the drill.

### Pirated software download site blocklist

* AppKed：~~\`https://www.macbed.com\`~~

<!--end-->
`;

const chineseReadme = `
<!--start-->
## 开发者工具
* [CotEditor](https://coteditor.com/) - 轻量级的 macOS 纯文本编辑器。
* [Typora](http://typora.io) - 极简的 Markdown 阅读与写作应用。
* [Rectangle](https://example.com/other-url) - Still English upstream.
<!--end-->
`;

async function loadCatalog() {
  const contentDirectory = path.join(process.cwd(), "content");
  return compileCatalog(
    await readFile(path.join(contentDirectory, "categories.yml"), "utf8"),
    await discoverSiteDocuments(path.join(contentDirectory, "sites"), process.cwd()),
  );
}

describe("awesome-mac import", () => {
  it("parses upstream entries between the markers with Chinese section labels and badge tags", () => {
    const entries = parseAwesomeMacMarkdown(englishReadme);

    expect(entries.map((entry) => entry.name)).toEqual([
      "CotEditor",
      "Nova",
      "Typora",
      "Rectangle",
      "CotEditor",
      "App Shopper",
      "Quora",
      "Reddit",
    ]);
    expect(entries[0]).toEqual({
      name: "CotEditor",
      url: "https://coteditor.com/",
      description: "Lightweight plain-text editor for macOS",
      section: "reading-writing",
      subsection: "文本编辑器",
      tags: ["阅读与写作", "文本编辑器", "开源", "免费"],
    });
    expect(entries[1]?.description).toBe("The beautiful, fast, flexible, native Mac code editor from Panic");
    expect(entries[2]).toMatchObject({ subsection: "Markdown 工具", description: "A minimal Markdown reading & writing app. See docs" });
    expect(entries[3]?.tags).toEqual(["实用工具", "窗口管理", "App Store", "原生应用"]);
    expect(entries.some((entry) => entry.url.includes("macbed"))).toBe(false);
  });

  it("rejects unknown upstream headings instead of silently dropping them", () => {
    expect(() => parseAwesomeMacMarkdown("<!--start-->\n## Brand New Things\n<!--end-->")).toThrow(
      /Unknown awesome-mac section/,
    );
    expect(() =>
      parseAwesomeMacMarkdown("<!--start-->\n## Utilities\n### Brand New Things\n<!--end-->"),
    ).toThrow(/Unknown awesome-mac subsection/);
    expect(() => parseAwesomeMacMarkdown("## Utilities")).toThrow(/markers/);
  });

  it("strips badges, links and trailing punctuation from descriptions", () => {
    expect(
      cleanDescription(
        " - Free tool. [![Open-Source Software][OSS Icon]](https://x.dev) ![Freeware][Freeware Icon] [![Awesome](https://img)](https://y)",
      ),
    ).toBe("Free tool");
    expect(cleanDescription("- 支持 [Markdown](https://x.dev) 的编辑器。")).toBe("支持 Markdown 的编辑器");
  });

  it("prefers Chinese upstream descriptions, then local translations, and deduplicates", () => {
    const chinese = parseAwesomeMacChineseDescriptions(chineseReadme);
    const entries = parseAwesomeMacMarkdown(englishReadme).map((entry) => ({
      ...entry,
      description: chineseDescriptionFor(entry, chinese) ?? entry.description,
    }));
    const sites = buildAwesomeMacSites(entries, {
      descriptions: { "https://nova.app/": "Panic 出品的原生 Mac 代码编辑器" },
      audit: {
        verified: ["https://coteditor.com/", "https://github.com/rxhanson/Rectangle"],
        removed: [{ url: "https://www.reddit.com/", reason: "test" }],
        moved: [{ from: "https://rectangleapp.com/", to: "https://github.com/rxhanson/Rectangle", reason: "test" }],
        highRisk: [{ url: "https://typora.io/", reason: "test" }],
      },
      reservedUrls: ["https://www.quora.com/"],
    });

    expect(sites.map((site) => site.id)).toEqual([
      "am-coteditor",
      "am-nova",
      "am-typora",
      "am-rectangle",
      "am-app-shopper",
    ]);
    expect(sites[0]).toMatchObject({
      description: "轻量级的 macOS 纯文本编辑器",
      linkStatus: "verified",
      tags: ["阅读与写作", "文本编辑器", "开源", "免费", "实用工具", "窗口管理"],
      source: { kind: "awesome-mac", url: "https://github.com/jaywcjlove/awesome-mac" },
    });
    expect(sites[1]?.description).toBe("Panic 出品的原生 Mac 代码编辑器");
    expect(sites[2]).toMatchObject({ description: "极简的 Markdown 阅读与写作应用", riskLevel: "high" });
    expect(sites[3]).toMatchObject({
      url: "https://github.com/rxhanson/Rectangle",
      description: "Move and resize windows using keyboard shortcuts or snap areas",
      linkStatus: "verified",
      riskLevel: "standard",
    });
    expect(sites[4]?.description).toBe("awesome-mac 收录的 App Shopper");
  });

  it("writes one flow mapping per site that round-trips through YAML", () => {
    const sites = buildAwesomeMacSites(parseAwesomeMacMarkdown(englishReadme));
    const yaml = stringifyAwesomeMacSites(sites);

    expect(yaml.split("\n").filter((line) => line.startsWith("- {"))).toHaveLength(sites.length);
    expect(parse(yaml)).toEqual(sites);
  });
});

describe("awesome-mac catalog", () => {
  it("keeps the category sections in sync with the importer", async () => {
    const catalog = await loadCatalog();
    const category = catalog.categories.find((candidate) => candidate.id === "awesome-mac");

    expect(category?.sections?.map(({ id, label }) => ({ id, label }))).toEqual(awesomeMacSections());
    expect(category?.credit).toEqual({
      label: "jaywcjlove/awesome-mac",
      url: "https://github.com/jaywcjlove/awesome-mac",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/deed.zh-hans",
    });
    expect(category?.homeMode).toBe("hidden");
  });

  it("publishes the imported list with Chinese descriptions and no dead links", async () => {
    const catalog = await loadCatalog();
    const sites = catalog.sites.filter((site) => site.category === "awesome-mac");
    const audit = parseLinkAudit(
      await readFile(path.join(process.cwd(), "content", "awesome-mac", "link-audit.yml"), "utf8"),
    );
    const removed = new Set(audit.removed.map((item) => item.url));

    expect(sites.length).toBeGreaterThan(1200);
    expect(sites.every((site) => site.id.startsWith("am-"))).toBe(true);
    expect(sites.every((site) => site.source.kind === "awesome-mac")).toBe(true);
    expect(sites.filter((site) => site.riskLevel !== "standard").map((site) => site.id)).toEqual(["am-popcorn-time"]);
    expect(sites.every((site) => /\p{Script=Han}/u.test(site.description))).toBe(true);
    expect(sites.every((site) => site.linkStatus !== "unavailable" && !removed.has(site.url))).toBe(true);
    expect(sites.filter((site) => site.linkStatus === "verified").length).toBeGreaterThan(sites.length * 0.9);
    expect(sites.every((site) => site.subsection === undefined || site.tags.includes(site.subsection))).toBe(true);
  });

  it("keeps every local translation and audit entry tied to a real upstream URL", async () => {
    const directory = path.join(process.cwd(), "content", "awesome-mac");
    const descriptions = parseDescriptions(await readFile(path.join(directory, "descriptions.zh.yml"), "utf8"));
    const audit = parseLinkAudit(await readFile(path.join(directory, "link-audit.yml"), "utf8"));
    const catalog = await loadCatalog();
    const published = new Set(
      catalog.sites.flatMap((site) => (site.category === "awesome-mac" && site.linkStatus !== "unavailable" ? [site.url] : [])),
    );
    const movedFrom = new Set(audit.moved.map((item) => item.from));

    expect(Object.keys(descriptions).filter((url) => !published.has(url) && !movedFrom.has(url))).toEqual([]);
    expect(audit.verified.filter((url) => !published.has(url))).toEqual([]);
    expect(audit.moved.filter((item) => !published.has(item.to))).toEqual([]);
    expect([...audit.removed, ...audit.moved, ...audit.highRisk].every((item) => item.reason.length > 0)).toBe(true);
  });

  it("finds imported apps through global search by name and Chinese tag", async () => {
    const catalog = await loadCatalog();

    expect(searchSites(catalog.sites, catalog.categories, "Rectangle-app")[0]?.id).toBe("am-rectangle-app");
    expect(searchSites(catalog.sites, catalog.categories, "NetNewsWire")[0]?.url).toBe("https://netnewswire.com/");
    expect(
      searchSites(catalog.sites, catalog.categories, "窗口管理").some((site) => site.id === "am-rectangle-app"),
    ).toBe(true);
  });
});
