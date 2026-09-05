import { describe, expect, it } from "vitest";

import { searchSites } from "../../src/domain/search";
import type { Category, Site } from "../../src/domain/site";

const categories: Category[] = [
  {
    id: "common",
    label: "常用",
    navLabel: "常用",
    homeLabel: "常用",
    order: 10,
    homeMode: "featured",
    homeGroup: "common",
    homeOrder: 10,
  },
  {
    id: "ai",
    label: "AI",
    navLabel: "AI",
    homeLabel: "AI 工具",
    order: 20,
    homeMode: "featured",
    homeGroup: "ai",
    homeOrder: 20,
  },
  {
    id: "games",
    label: "游戏",
    navLabel: "游戏",
    homeLabel: "游戏",
    order: 60,
    homeMode: "hidden",
    homeGroup: "games",
    homeOrder: 60,
    sections: [
      { id: "stores", label: "游戏商店", order: 10 },
      { id: "tools", label: "游戏工具", order: 20 },
    ],
  },
];

const sites: Site[] = [
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com/",
    domain: "github.com",
    description: "代码托管与协作开发平台",
    category: "common",
    tags: ["代码", "开发"],
    aliases: ["gh"],
    linkStatus: "verified",
    riskLevel: "standard",
    reviewStatus: "verified",
    source: { kind: "manual" },
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chatgpt.com/",
    domain: "chatgpt.com",
    description: "OpenAI 智能对话助手",
    category: "ai",
    tags: ["AI", "对话"],
    linkStatus: "verified",
    riskLevel: "standard",
    reviewStatus: "verified",
    source: { kind: "manual" },
  },
  {
    id: "github-docs",
    name: "GitHub Docs",
    url: "https://docs.github.com/",
    domain: "docs.github.com",
    description: "GitHub 官方文档",
    category: "common",
    tags: ["文档"],
    linkStatus: "verified",
    riskLevel: "standard",
    reviewStatus: "verified",
    source: { kind: "manual" },
  },
  {
    id: "steam",
    name: "Steam",
    url: "https://store.steampowered.com/",
    domain: "store.steampowered.com",
    description: "PC 游戏数字商店",
    category: "games",
    section: "stores",
    tags: ["游戏"],
    linkStatus: "verified",
    riskLevel: "standard",
    reviewStatus: "verified",
    source: { kind: "manual" },
  },
  {
    id: "legacy-game-tool",
    name: "Legacy Game Tool",
    description: "暂无稳定链接的游戏工具",
    category: "games",
    section: "tools",
    tags: ["工具"],
    linkStatus: "unavailable",
    riskLevel: "standard",
    reviewStatus: "unverified",
    source: { kind: "manual" },
  },
];

describe("searchSites", () => {
  it("ranks an exact name match before a prefix match", () => {
    expect(searchSites(sites, categories, "github").map((site) => site.id)).toEqual([
      "github",
      "github-docs",
    ]);
  });

  it("matches domains, aliases, descriptions, tags, and category labels", () => {
    expect(searchSites(sites, categories, "docs.github.com").map((site) => site.id)).toEqual([
      "github-docs",
    ]);
    expect(searchSites(sites, categories, "gh").map((site) => site.id)).toContain("github");
    expect(searchSites(sites, categories, "智能对话").map((site) => site.id)).toEqual([
      "chatgpt",
    ]);
    expect(searchSites(sites, categories, "开发").map((site) => site.id)).toContain("github");
    expect(searchSites(sites, categories, "AI 工具").map((site) => site.id)).toEqual([
      "chatgpt",
    ]);
  });

  it("returns every site for blank input", () => {
    expect(searchSites(sites, categories, "   ")).toEqual(sites);
  });

  it("matches section labels and includes unavailable entries", () => {
    expect(searchSites(sites, categories, "游戏工具").map((site) => site.id)).toEqual([
      "legacy-game-tool",
    ]);
  });
});
