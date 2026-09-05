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
    riskLevel: "standard",
    reviewStatus: "verified",
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
});
