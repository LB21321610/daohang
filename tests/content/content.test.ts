import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { compileCatalog } from "../../scripts/content-lib.mts";

const categories = `
- id: common
  label: 常用
  navLabel: 常用
  homeLabel: 常用
  order: 10
  homeMode: featured
  homeGroup: common
  homeOrder: 10
- id: windows
  label: Windows
  navLabel: Windows
  homeLabel: 软件资源
  order: 20
  homeMode: first
  homeGroup: software
  homeOrder: 20
`;

describe("compileCatalog", () => {
  it("normalizes domains and preserves category order", () => {
    const catalog = compileCatalog(categories, [
      {
        path: "content/sites/common.yml",
        yaml: `
- id: github
  name: GitHub
  url: https://github.com/
  description: 代码托管平台
  category: common
  tags: [开发]
  riskLevel: standard
  reviewStatus: verified
  source: { kind: manual }
`,
      },
      {
        path: "content/sites/windows.yml",
        yaml: `
- id: appnee
  name: AppNee
  url: https://appnee.com/downloads/
  description: 软件资源索引
  category: windows
  tags: [软件]
  riskLevel: high
  reviewStatus: unverified
  source: { kind: manual }
`,
      },
    ]);

    expect(catalog.categories.map((category) => category.id)).toEqual(["common", "windows"]);
    expect(catalog.sites.map((site) => site.domain)).toEqual(["github.com", "appnee.com"]);
  });

  it("rejects duplicate normalized URLs", () => {
    expect(() =>
      compileCatalog(categories, [
        {
          path: "content/sites/common.yml",
          yaml: `
- id: first
  name: First
  url: https://example.com
  description: 第一个站点
  category: common
  tags: [工具]
  riskLevel: standard
  reviewStatus: verified
  source: { kind: manual }
- id: second
  name: Second
  url: https://example.com/
  description: 第二个站点
  category: common
  tags: [工具]
  riskLevel: standard
  reviewStatus: verified
  source: { kind: manual }
`,
        },
      ]),
    ).toThrow(/duplicate URL.*example\.com/i);
  });

  it("rejects non-HTTPS entries with the source file in the error", () => {
    expect(() =>
      compileCatalog(categories, [
        {
          path: "content/sites/windows.yml",
          yaml: `
- id: unsafe
  name: Unsafe
  url: http://example.com/
  description: 非 HTTPS 站点
  category: windows
  tags: [软件]
  riskLevel: high
  reviewStatus: unverified
  source: { kind: manual }
`,
        },
      ]),
    ).toThrow(/content\/sites\/windows\.yml.*HTTPS/i);
  });

  it("keeps the published software catalog counts and risk flags locked", async () => {
    const contentDirectory = path.join(process.cwd(), "content");
    const categoriesYaml = await readFile(path.join(contentDirectory, "categories.yml"), "utf8");
    const siteFiles = ["common.yml", "ai.yml", "windows.yml", "mac.yml", "cross-platform.yml"];
    const documents = await Promise.all(
      siteFiles.map(async (fileName) => ({
        path: `content/sites/${fileName}`,
        yaml: await readFile(path.join(contentDirectory, "sites", fileName), "utf8"),
      })),
    );

    const catalog = compileCatalog(categoriesYaml, documents);
    const softwareSites = catalog.sites.filter((site) =>
      ["windows", "mac", "cross-platform"].includes(site.category),
    );

    expect(catalog.sites).toHaveLength(39);
    expect(catalog.sites.filter((site) => site.category === "windows")).toHaveLength(14);
    expect(catalog.sites.filter((site) => site.category === "mac")).toHaveLength(9);
    expect(catalog.sites.filter((site) => site.category === "cross-platform")).toHaveLength(6);
    expect(softwareSites).toHaveLength(29);
    expect(softwareSites.every((site) => site.riskLevel === "high")).toBe(true);
    expect(softwareSites.every((site) => site.reviewStatus === "unverified")).toBe(true);
    expect(softwareSites.every((site) => site.source.kind === "manual")).toBe(true);
    expect(softwareSites.map((site) => site.domain).sort()).toEqual(
      [
        "423down.com",
        "appnee.com",
        "appstorrent.ru",
        "cmacapps.com",
        "crackhub.site",
        "cracksurl.com",
        "filecr.com",
        "getintopc.com",
        "haxpc.net",
        "hsuanchen.com",
        "igetintopc.com",
        "kubadownload.com",
        "mac-torrent-download.net",
        "macdownload.org",
        "macked.app",
        "macserial.com",
        "macwk.com",
        "massgravel.dev",
        "msguides.com",
        "njhax.com",
        "nkino.com",
        "nsaneforums.com",
        "predb.org",
        "ru-board.com",
        "sanet.st",
        "srrdb.com",
        "team-os.eu",
        "tntmac.com",
        "yasir252.com",
      ].sort(),
    );
  });
});
