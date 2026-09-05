import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../src/app/App";
import type { SiteCatalog } from "../../src/domain/site";
import { FAVORITES_STORAGE_KEY } from "../../src/features/favorites/favoriteStore";

const catalog: SiteCatalog = {
  categories: [
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
      id: "windows",
      label: "Windows",
      navLabel: "Windows",
      homeLabel: "软件资源",
      order: 30,
      homeMode: "first",
      homeGroup: "software",
      homeOrder: 30,
    },
    {
      id: "mac",
      label: "Mac",
      navLabel: "Mac",
      homeLabel: "软件资源",
      order: 40,
      homeMode: "first",
      homeGroup: "software",
      homeOrder: 30,
    },
    {
      id: "cross-platform",
      label: "综合",
      navLabel: "综合",
      homeLabel: "软件资源",
      order: 50,
      homeMode: "first",
      homeGroup: "software",
      homeOrder: 30,
    },
  ],
  sites: [
    {
      id: "github",
      name: "GitHub",
      url: "https://github.com/",
      domain: "github.com",
      description: "代码托管与协作开发平台",
      category: "common",
      tags: ["代码"],
      icon: "github",
      featured: true,
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
      tags: ["AI"],
      icon: "openai",
      featured: true,
      riskLevel: "standard",
      reviewStatus: "verified",
      source: { kind: "manual" },
    },
    {
      id: "appnee",
      name: "AppNee",
      url: "https://appnee.com/",
      domain: "appnee.com",
      description: "综合软件资源索引",
      category: "windows",
      tags: ["软件"],
      icon: "app-window",
      featured: true,
      riskLevel: "high",
      reviewStatus: "unverified",
      source: { kind: "manual" },
    },
  ],
};

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the home groups and filters by category", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    expect(screen.getByRole("heading", { name: "常用" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI 工具" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "软件资源" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "AI" }));

    expect(screen.getByRole("heading", { name: "AI 工具" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ChatGPT/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /GitHub/ })).not.toBeInTheDocument();
  });

  it("searches across site metadata", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "github.com");

    expect(screen.getByRole("link", { name: /GitHub/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ChatGPT/ })).not.toBeInTheDocument();
  });

  it("stores a favorite without opening the site", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "收藏 GitHub" }));

    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]")).toEqual(["github"]);
    expect(screen.getByRole("button", { name: "取消收藏 GitHub" })).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });

  it("opens the full disclaimer from the sidebar", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "免责声明" }));

    const dialog = screen.getByRole("dialog", { name: "免责声明" });
    expect(within(dialog).getByText(/本站仅提供公开网址索引/)).toBeInTheDocument();
  });

  it("requires one session-level confirmation before opening a high-risk site", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App catalog={catalog} />);

    const appNee = screen.getByRole("link", { name: /AppNee/ });
    expect(appNee).not.toHaveAttribute("href");

    await user.click(appNee);
    const firstDialog = screen.getByRole("dialog", { name: "访问外部站点" });
    expect(firstDialog).toBeInTheDocument();
    expect(within(firstDialog).getByText(/本站仅提供公开网址索引/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(open).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: /AppNee/ }));
    await user.click(screen.getByRole("button", { name: "继续访问" }));

    expect(open).toHaveBeenCalledWith("https://appnee.com/", "_blank", "noopener,noreferrer");
    expect(sessionStorage.getItem("personal-nav:risk-ack:v1")).toBe("true");

    const acknowledgedLink = screen.getByRole("link", { name: /AppNee/ });
    expect(acknowledgedLink).toHaveAttribute("href", "https://appnee.com/");
    await user.click(acknowledgedLink);
    expect(screen.queryByRole("dialog", { name: "访问外部站点" })).not.toBeInTheDocument();
  });

  it("keeps the warning visible when search results include a high-risk site", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "appnee.com");

    expect(screen.getByRole("button", { name: /外部站点，请自行甄别/ })).toBeInTheDocument();
  });

  it("traps dialog focus and restores it to the trigger", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);
    const trigger = screen.getByRole("button", { name: "免责声明" });

    trigger.focus();
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "免责声明" });
    const close = within(dialog).getByRole("button", { name: "关闭" });
    const acknowledge = within(dialog).getByRole("button", { name: "知道了" });
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(acknowledge).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.click(acknowledge);
    expect(trigger).toHaveFocus();
  });
});
