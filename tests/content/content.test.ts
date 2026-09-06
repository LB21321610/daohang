import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { compileCatalog } from "../../scripts/content-lib.mts";
import { discoverSiteDocuments } from "../../scripts/content-files.mts";

type ExpectedEntry = readonly [
  section: string,
  url: string | null,
  linkStatus: "verified" | "unchecked" | "unavailable",
  riskLevel: "standard" | "external" | "high",
  requiredAliases: readonly string[],
];

const expectedCatalogEntries = {
  games: {
    "fling-trainer": ["trainers","https://flingtrainer.com/","verified","high",["风灵月影"]],
    gamecopyworld: ["trainers","https://gamecopyworld.com/games/index.php","verified","high",[]],
    megagames: ["trainers","https://megagames.com/","verified","high",[]],
    "cheat-happens": ["trainers","https://www.cheathappens.com/","verified","high",[]],
    wemod: ["trainers","https://www.wemod.com/","verified","high",["WeMod 客户端"]],
    mrantifun: ["trainers","https://mrantifun.net/","verified","high",[]],
    "game-trainer": ["trainers","https://www.game-trainer.com/","verified","high",[]],
    "fitgirl-repacks": ["game-resources","https://fitgirl-repacks.site/","verified","high",[]],
    steamunlocked: ["game-resources","https://steamunlocked.org/","verified","high",[]],
    steamrip: ["game-resources","https://steamrip.com/","verified","high",[]],
    "ocean-of-games": ["game-resources","https://ocean-of-games.com/","verified","high",[]],
    "igg-games": ["game-resources","https://igg-games.com/","verified","high",[]],
    kaoskrew: ["game-resources","https://kaoskrew.org/","unchecked","high",[]],
    "dodi-repacks": ["game-resources","https://dodi-repacks.site/","verified","high",[]],
    elamigos: ["game-resources","https://elamigos.site/","verified","high",[]],
    gload: ["game-resources","https://gload.to/","verified","high",[]],
    "online-fix": ["game-resources","https://online-fix.me/","verified","high",[]],
    "cs-rin-ru": ["game-resources","https://cs.rin.ru/","verified","high",[]],
    "nexus-mods": ["mods-tools","https://www.nexusmods.com/","verified","standard",[]],
    moddb: ["mods-tools","https://www.moddb.com/","verified","standard",[]],
    gamebanana: ["mods-tools","https://gamebanana.com/","verified","standard",[]],
    "3dmgame": ["mods-tools","https://www.3dmgame.com/","verified","high",["3DM"]],
    ali213: ["mods-tools","https://www.ali213.net/","unchecked","high",["Ali213"]],
    "guided-hacking": ["security-research","https://guidedhacking.com/","unchecked","high",[]],
    "cheat-engine": ["security-research","https://cheatengine.org/","verified","high",[]],
    unknowncheats: ["security-research","https://unknowncheats.me/","unchecked","high",[]],
  },
  video: {
    "yt-dlp": ["cli-open-source","https://github.com/yt-dlp/yt-dlp","verified","standard",[]],
    "you-get": ["cli-open-source","https://github.com/soimort/you-get","verified","standard",[]],
    lux: ["cli-open-source","https://github.com/iawia002/lux","verified","standard",["annie"]],
    bbdown: ["cli-open-source","https://github.com/nilaoda/BBDown","verified","standard",[]],
    bilix: ["cli-open-source","https://github.com/HFrost0/bilix","verified","standard",[]],
    "n-m3u8dl-re": ["cli-open-source","https://github.com/nilaoda/N_m3u8DL-RE","verified","standard",[]],
    "tiktok-downloader": ["cli-open-source","https://github.com/JoeanAmier/TikTokDownloader","verified","standard",[]],
    aria2: ["cli-open-source","https://github.com/aria2/aria2","verified","standard",[]],
    ffmpeg: ["cli-open-source","https://ffmpeg.org/","verified","standard",[]],
    "streamlink-github": ["cli-open-source","https://github.com/streamlink/streamlink","verified","standard",[]],
    streamlink: ["cli-open-source","https://streamlink.github.io/","verified","standard",[]],
    bento4: ["cli-open-source","https://www.bento4.com/","verified","standard",["mp4decrypter"]],
    "shaka-packager": ["cli-open-source","https://github.com/shaka-project/shaka-packager","verified","standard",[]],
    "4k-video-downloader": ["desktop-clients","https://www.4kdownload.com/","verified","standard",[]],
    "jdownloader-2": ["desktop-clients","https://jdownloader.org/","verified","standard",[]],
    motrix: ["desktop-clients","https://motrix.app/","verified","standard",[]],
    "free-download-manager": ["desktop-clients","https://www.freedownloadmanager.org/","verified","standard",["FDM"]],
    "internet-download-manager": ["desktop-clients","https://www.internetdownloadmanager.com/","verified","standard",["IDM"]],
    xdm: ["desktop-clients","https://github.com/subhra74/xdm","verified","standard",[]],
    "neat-download-manager": ["desktop-clients","https://www.neatdownloadmanager.com/","verified","standard",[]],
    cobalt: ["online-downloaders","https://cobalt.tools/","verified","external",[]],
    y2mate: ["online-downloaders","https://y2mate.is/","verified","external",[]],
    savefrom: ["online-downloaders","https://savefrom.net/","verified","external",[]],
    ssyoutube: ["online-downloaders","https://ssyoutube.com/","verified","external",[]],
    "video-downloadhelper": ["browser-extensions","https://downloadhelper.net/","verified","standard",[]],
    "hls-downloader": ["browser-extensions","https://github.com/puemos/hls-downloader","verified","standard",[]],
    "stream-recorder": ["browser-extensions","https://chromewebstore.google.com/detail/stream-recorder-hls-m3u8/iogidnfllpdhagebkblkgbfijkbkjdmm","verified","standard",[]],
    "widevine-l3-decryptor": ["drm-tools","https://github.com/tbodt/widevine-l3-decryptor","verified","high",["WidevineDecryptor"]],
    freegrabapp: ["drm-tools","https://freegrabapp.com/","verified","high",[]],
    flixgrab: ["drm-tools","https://flixgrab.com/","verified","high",[]],
    streamfab: ["drm-tools","https://streamfab.com/","verified","high",[]],
    cleverget: ["drm-tools","https://cleverget.org/","verified","high",[]],
    noteburner: ["drm-tools","https://www.noteburner.com/","verified","high",[]],
  },
  media: {
    ddrk: ["domestic-film-tv","https://ddys.app/","unchecked","high",[]],
    zxzj: ["domestic-film-tv","https://www.zxzj.me/","unchecked","high",[]],
    hao6v: ["domestic-film-tv","https://www.6v520.cc/","verified","high",[]],
    dy2018: ["domestic-film-tv","https://www.dytt8899.com/","verified","high",[]],
    yesmovies: ["international-film-tv","https://ww2.yesmovies.ag/","verified","high",[]],
    lookmovie: ["international-film-tv","https://www.lookmovie2.to/","verified","high",[]],
    wcostream: ["international-film-tv","https://www.wcostream.tv/","verified","high",[]],
    "popcorn-time": ["media-centers","https://popcorntime.app/","verified","high",[]],
    stremio: ["media-centers","https://www.stremio.com/","verified","standard",[]],
    kodi: ["media-centers","https://kodi.tv/","verified","standard",[]],
    mteam: ["private-trackers","https://kp.m-team.cc/","verified","high",["馒头"]],
    hdsky: ["private-trackers","https://hdsky.me/","verified","high",["红豆饭"]],
    audiences: ["private-trackers","https://audiences.me/","unchecked","high",["观众"]],
    pterclub: ["private-trackers","https://pterclub.net/","verified","high",[]],
    hdbits: ["private-trackers","https://hdbits.org/","unchecked","high",[]],
    btn: ["private-trackers","https://broadcasthe.net/","verified","high",[]],
    ptp: ["private-trackers","https://passthepopcorn.me/","verified","high",[]],
    iptorrents: ["private-trackers","https://iptorrents.com/","verified","high",[]],
  },
} as const satisfies Record<string, Record<string, ExpectedEntry>>;

const expectedNewCategories = [
  {
    id: "games", label: "游戏", navLabel: "游戏", homeLabel: "游戏", order: 60,
    homeMode: "hidden", homeGroup: "games", homeOrder: 60,
    sections: [
      { id: "trainers", label: "游戏修改器 / Trainer", order: 10 },
      { id: "game-resources", label: "游戏资源", order: 20 },
      { id: "mods-tools", label: "游戏 MOD / 工具", order: 30 },
      { id: "security-research", label: "游戏安全研究", order: 40 },
    ],
  },
  {
    id: "video", label: "视频", navLabel: "视频", homeLabel: "视频", order: 70,
    homeMode: "hidden", homeGroup: "video", homeOrder: 70,
    sections: [
      { id: "cli-open-source", label: "命令行 / 开源工具", order: 10 },
      { id: "desktop-clients", label: "桌面客户端", order: 20 },
      { id: "online-downloaders", label: "在线下载器", order: 30 },
      { id: "browser-extensions", label: "浏览器扩展", order: 40 },
      { id: "drm-tools", label: "DRM / 流媒体工具", order: 50 },
    ],
  },
  {
    id: "media", label: "影视", navLabel: "影视", homeLabel: "影视", order: 80,
    homeMode: "hidden", homeGroup: "media", homeOrder: 80,
    sections: [
      { id: "domestic-film-tv", label: "国内影视", order: 10 },
      { id: "international-film-tv", label: "国际影视", order: 20 },
      { id: "media-centers", label: "媒体中心 / 客户端", order: 30 },
      { id: "private-trackers", label: "PT / BT", order: 40 },
    ],
  },
] as const;

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
  it("publishes repaired resource links without treating reachability as a risk review", async () => {
    const contentDirectory = path.join(process.cwd(), "content");
    const catalog = compileCatalog(
      await readFile(path.join(contentDirectory, "categories.yml"), "utf8"),
      await discoverSiteDocuments(path.join(contentDirectory, "sites"), process.cwd()),
    );
    const sites = new Map(catalog.sites.map((site) => [site.id, site]));

    expect(sites.get("xdm")).toMatchObject({
      url: "https://github.com/subhra74/xdm",
      linkStatus: "verified",
    });
    expect(sites.get("tiktok-downloader")).toMatchObject({
      url: "https://github.com/JoeanAmier/TikTokDownloader",
      linkStatus: "verified",
    });
    expect(sites.get("streamfab")).toMatchObject({
      url: "https://streamfab.com/",
      linkStatus: "verified",
      riskLevel: "high",
      reviewStatus: "unverified",
    });
    expect(sites.get("ru-board")).toMatchObject({
      url: "https://forum.ru-board.com/",
      linkStatus: "verified",
    });
    expect(sites.get("pterclub")).toMatchObject({
      url: "https://pterclub.net/",
      linkStatus: "verified",
    });
  });

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

  it("rejects sites that omit the section in a sectioned category", () => {
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
  tags: [游戏]
  riskLevel: standard
  reviewStatus: unverified
  linkStatus: unchecked
  source: { kind: manual }
`,
          },
        ],
      ),
    ).toThrow(/content\/sites\/games\.yml.*section/i);
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
    const legacySites = catalog.sites.filter((site) =>
      !["games", "video", "media", "audio"].includes(site.category),
    );

    expect(catalog.sites).toHaveLength(236);
    expect(legacySites).toHaveLength(29);
    expect(legacySites.every((site) => site.linkStatus !== "unavailable")).toBe(true);
    expect(new Set(legacySites.map((site) => `${site.reviewStatus}/${site.linkStatus}`))).toEqual(
      new Set(["verified/verified", "unverified/verified", "unverified/unchecked"]),
    );
    expect(catalog.sites.filter((site) => site.category === "windows")).toHaveLength(12);
    expect(catalog.sites.filter((site) => site.category === "mac")).toHaveLength(3);
    expect(catalog.sites.filter((site) => site.category === "cross-platform")).toHaveLength(4);
    expect(softwareSites).toHaveLength(19);
    expect(softwareSites.every((site) => site.riskLevel === "high")).toBe(true);
    expect(softwareSites.every((site) => site.reviewStatus === "unverified")).toBe(true);
    expect(softwareSites.every((site) => site.source.kind === "manual")).toBe(true);
    expect(softwareSites.map((site) => site.domain).sort()).toEqual(
      [
        "423down.com",
        "appnee.com",
        "appstorrent.ru",
        "cracksurl.com",
        "filecr.com",
        "forum.ru-board.com",
        "getintopc.com",
        "haxpc.net",
        "igetintopc.com",
        "kubadownload.com",
        "macked.app",
        "massgrave.dev",
        "msguides.com",
        "nsaneforums.com",
        "predb.org",
        "softarchive.download",
        "www.macwk.com",
        "www.srrdb.com",
        "yasir252.com",
      ].sort(),
    );
  });

  it("publishes the complete games, video, and media catalog", async () => {
    const contentDirectory = path.join(process.cwd(), "content");
    const categoriesYaml = await readFile(path.join(contentDirectory, "categories.yml"), "utf8");
    const documents = await discoverSiteDocuments(path.join(contentDirectory, "sites"), process.cwd());
    const catalog = compileCatalog(categoriesYaml, documents);

    expect(catalog.categories.filter((category) => ["games", "video", "media"].includes(category.id))).toEqual(
      expectedNewCategories,
    );

    for (const [category, expectedEntries] of Object.entries(expectedCatalogEntries)) {
      const sites = catalog.sites.filter((site) => site.category === category);
      expect(sites.map((site) => site.id).sort()).toEqual(Object.keys(expectedEntries).sort());
      expect(sites.every((site) => site.reviewStatus === "unverified")).toBe(true);
      expect(sites.every((site) => site.source.kind === "manual")).toBe(true);
      expect(sites.every((site) => ["verified", "unchecked"].includes(site.linkStatus))).toBe(true);

      for (const [id, [section, url, linkStatus, riskLevel, requiredAliases]] of Object.entries(expectedEntries)) {
        const site = sites.find((candidate) => candidate.id === id);
        if (!site) throw new Error(`missing expected catalog entry ${id}`);

        expect({
          section: site.section,
          url: "url" in site ? site.url : null,
          linkStatus: site.linkStatus,
          riskLevel: site.riskLevel,
        }).toEqual({ section, url, linkStatus, riskLevel });
        expect(site.aliases ?? []).toEqual(expect.arrayContaining([...requiredAliases]));
      }
    }

    expect(catalog.sites.filter((site) => site.category === "games")).toHaveLength(26);
    expect(catalog.sites.filter((site) => site.category === "video")).toHaveLength(33);
    expect(catalog.sites.filter((site) => site.category === "media")).toHaveLength(18);
    expect(catalog.sites.filter((site) => site.linkStatus === "unavailable")).toHaveLength(0);
    expect(catalog.sites.filter((site) => site.category === "games" && site.section === "trainers")).toHaveLength(7);
    expect(catalog.sites.filter((site) => site.category === "games" && site.section === "game-resources")).toHaveLength(11);
    expect(catalog.sites.filter((site) => site.category === "games" && site.section === "mods-tools")).toHaveLength(5);
    expect(catalog.sites.filter((site) => site.category === "games" && site.section === "security-research")).toHaveLength(3);
    expect(catalog.sites.filter((site) => site.category === "video" && site.section === "cli-open-source")).toHaveLength(13);
    expect(catalog.sites.filter((site) => site.category === "video" && site.section === "desktop-clients")).toHaveLength(7);
    expect(catalog.sites.filter((site) => site.category === "video" && site.section === "online-downloaders")).toHaveLength(4);
    expect(catalog.sites.filter((site) => site.category === "video" && site.section === "browser-extensions")).toHaveLength(3);
    expect(catalog.sites.filter((site) => site.category === "video" && site.section === "drm-tools")).toHaveLength(6);
    expect(catalog.sites.filter((site) => site.category === "media" && site.section === "domestic-film-tv")).toHaveLength(4);
    expect(catalog.sites.filter((site) => site.category === "media" && site.section === "international-film-tv")).toHaveLength(3);
    expect(catalog.sites.filter((site) => site.category === "media" && site.section === "media-centers")).toHaveLength(3);
    expect(catalog.sites.filter((site) => site.category === "media" && site.section === "private-trackers")).toHaveLength(8);
  });
});
