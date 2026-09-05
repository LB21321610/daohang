import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { compileCatalog } from "../../scripts/content-lib.mts";
import { discoverSiteDocuments } from "../../scripts/content-files.mts";

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
  linkStatus: verified
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
  linkStatus: unchecked
  source: { kind: manual }
`,
      },
    ]);

    expect(catalog.categories.map((category) => category.id)).toEqual(["common", "windows"]);
    expect(catalog.sites.map((site) => site.domain)).toEqual(["github.com", "appnee.com"]);
  });

  it("keeps review status and link status independent", () => {
    const catalog = compileCatalog(categories, [
      {
        path: "content/sites/common.yml",
        yaml: `
- id: reviewed-unchecked
  name: Reviewed but unchecked
  url: https://reviewed.example.com/
  description: 内容已审核但链接未独立检查
  category: common
  tags: [工具]
  riskLevel: standard
  reviewStatus: verified
  linkStatus: unchecked
  source: { kind: manual }
- id: unreviewed-checked
  name: Unreviewed but checked
  url: https://checked.example.com/
  description: 内容未审核但链接已独立检查
  category: common
  tags: [工具]
  riskLevel: standard
  reviewStatus: unverified
  linkStatus: verified
  source: { kind: manual }
`,
      },
    ]);

    expect(catalog.sites.map((site) => [site.reviewStatus, site.linkStatus])).toEqual([
      ["verified", "unchecked"],
      ["unverified", "verified"],
    ]);
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
  linkStatus: verified
  source: { kind: manual }
- id: second
  name: Second
  url: https://example.com/
  description: 第二个站点
  category: common
  tags: [工具]
  riskLevel: standard
  reviewStatus: verified
  linkStatus: verified
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
  linkStatus: unchecked
  source: { kind: manual }
`,
        },
      ]),
    ).toThrow(/content\/sites\/windows\.yml.*HTTPS/i);
  });

  it("sorts category sections while preserving site YAML order", () => {
    const catalog = compileCatalog(
      `${categories}
- id: games
  label: 游戏
  navLabel: 游戏
  homeLabel: 游戏
  order: 30
  homeMode: first
  homeGroup: games
  homeOrder: 30
  sections:
    - { id: guides, label: 攻略, order: 20 }
    - { id: stores, label: 商店, order: 10 }
`,
      [
        {
          path: "content/sites/games.yml",
          yaml: `
- id: second-in-section
  name: Second in section
  url: https://second.example.com/
  description: 第二条
  category: games
  section: stores
  tags: [游戏]
  riskLevel: standard
  reviewStatus: unverified
  linkStatus: unchecked
  source: { kind: manual }
- id: first-in-section
  name: First in section
  url: https://first.example.com/
  description: 第一条
  category: games
  section: stores
  tags: [游戏]
  riskLevel: standard
  reviewStatus: unverified
  linkStatus: unchecked
  source: { kind: manual }
`,
        },
      ],
    );

    expect(catalog.categories.at(-1)?.sections?.map((section) => section.id)).toEqual([
      "stores",
      "guides",
    ]);
    expect(catalog.sites.map((site) => site.id)).toEqual(["second-in-section", "first-in-section"]);
  });

  it.each([
    ["section IDs", "- { id: stores, label: 商店, order: 10 }\n    - { id: stores, label: 攻略, order: 20 }"],
    ["section orders", "- { id: stores, label: 商店, order: 10 }\n    - { id: guides, label: 攻略, order: 10 }"],
  ])("rejects duplicate %s within a category", (_name, sectionYaml) => {
    expect(() =>
      compileCatalog(
        `${categories}
- id: games
  label: 游戏
  navLabel: 游戏
  homeLabel: 游戏
  order: 30
  homeMode: first
  homeGroup: games
  homeOrder: 30
  sections:
    ${sectionYaml}
`,
        [],
      ),
    ).toThrow(/sections/i);
  });

  it("requires sites in sectioned categories to reference a configured section", () => {
    expect(() =>
      compileCatalog(
        `${categories}
- id: games
  label: 游戏
  navLabel: 游戏
  homeLabel: 游戏
  order: 30
  homeMode: first
  homeGroup: games
  homeOrder: 30
  sections:
    - { id: stores, label: 商店, order: 10 }
`,
        [
          {
            path: "content/sites/games.yml",
            yaml: `
- id: steam
  name: Steam
  url: https://store.steampowered.com/
  description: 游戏商店
  category: games
  section: missing
  tags: [游戏]
  riskLevel: standard
  reviewStatus: unverified
  linkStatus: unchecked
  source: { kind: manual }
`,
          },
        ],
      ),
    ).toThrow(/content\/sites\/games\.yml.*section.*missing/i);
  });

  it("rejects site sections for categories without configured sections", () => {
    expect(() =>
      compileCatalog(categories, [
        {
          path: "content/sites/common.yml",
          yaml: `
- id: github
  name: GitHub
  url: https://github.com/
  description: 代码托管平台
  category: common
  section: tools
  tags: [开发]
  riskLevel: standard
  reviewStatus: verified
  linkStatus: verified
  source: { kind: manual }
`,
        },
      ]),
    ).toThrow(/content\/sites\/common\.yml.*section/i);
  });

  it("compiles unavailable sites without URL or domain", () => {
    const catalog = compileCatalog(categories, [
      {
        path: "content/sites/common.yml",
        yaml: `
- id: unavailable-site
  name: Unavailable
  description: 暂无可用链接
  category: common
  tags: [工具]
  riskLevel: standard
  reviewStatus: unverified
  linkStatus: unavailable
  source: { kind: manual }
`,
      },
    ]);

    expect(catalog.sites[0]).not.toHaveProperty("url");
    expect(catalog.sites[0]).not.toHaveProperty("domain");
  });

  it("enforces linkStatus URL presence and the restricted review statuses", () => {
    const base = `
  id: invalid
  name: Invalid
  description: 无效站点
  category: common
  tags: [工具]
  riskLevel: standard
  source: { kind: manual }
`;

    expect(() =>
      compileCatalog(categories, [
        {
          path: "content/sites/common.yml",
          yaml: `- ${base}  reviewStatus: unverified\n  linkStatus: unchecked\n`,
        },
      ]),
    ).toThrow(/url/i);
    expect(() =>
      compileCatalog(categories, [
        {
          path: "content/sites/common.yml",
          yaml: `- ${base}  url: https://example.com/\n  reviewStatus: unverified\n  linkStatus: unavailable\n`,
        },
      ]),
    ).toThrow(/url/i);
    expect(() =>
      compileCatalog(categories, [
        {
          path: "content/sites/common.yml",
          yaml: `- ${base}  url: https://example.com/\n  reviewStatus: inactive\n  linkStatus: verified\n`,
        },
      ]),
    ).toThrow(/reviewStatus/i);
  });

  it("keeps the published software catalog counts and risk flags locked", async () => {
    const contentDirectory = path.join(process.cwd(), "content");
    const categoriesYaml = await readFile(path.join(contentDirectory, "categories.yml"), "utf8");
    const documents = await discoverSiteDocuments(path.join(contentDirectory, "sites"), process.cwd());

    const catalog = compileCatalog(categoriesYaml, documents);
    const softwareSites = catalog.sites.filter((site) =>
      ["windows", "mac", "cross-platform"].includes(site.category),
    );

    expect(catalog.sites).toHaveLength(39);
    expect(catalog.sites.every((site) => site.linkStatus === "unchecked")).toBe(true);
    expect(new Set(catalog.sites.map((site) => `${site.reviewStatus}/${site.linkStatus}`))).toEqual(
      new Set(["verified/unchecked", "unverified/unchecked"]),
    );
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
