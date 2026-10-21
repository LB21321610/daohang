import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
        { id: "tools", label: "游戏工具", order: 20 },
        { id: "stores", label: "游戏商店", order: 10 },
      ],
    },
    {
      id: "audio",
      label: "音频",
      navLabel: "音频",
      homeLabel: "音频",
      order: 65,
      homeMode: "hidden",
      homeGroup: "audio",
      homeOrder: 65,
      sections: [
        { id: "daw-dj", label: "DAW 与 DJ", order: 10 },
        { id: "bundles", label: "插件套装", order: 20 },
        { id: "instruments", label: "虚拟乐器与采样器", order: 30 },
        { id: "mixing-mastering", label: "混音与母带", order: 40 },
        { id: "vocals-repair", label: "人声处理与修复", order: 50 },
        { id: "reverb-effects", label: "混响与创意效果", order: 60 },
        { id: "guitar-bass", label: "吉他与贝斯", order: 70 },
        { id: "drums-rhythm", label: "鼓与节奏", order: 80 },
      ],
    },
    {
      id: "video",
      label: "影视",
      navLabel: "影视",
      homeLabel: "影视",
      order: 70,
      homeMode: "hidden",
      homeGroup: "video",
      homeOrder: 70,
    },
    {
      id: "media",
      label: "媒体",
      navLabel: "媒体",
      homeLabel: "媒体",
      order: 80,
      homeMode: "hidden",
      homeGroup: "media",
      homeOrder: 80,
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
      tags: ["AI"],
      icon: "openai",
      featured: true,
      linkStatus: "verified",
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
      linkStatus: "unchecked",
      riskLevel: "high",
      reviewStatus: "unverified",
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
      id: "gog",
      name: "GOG",
      url: "https://www.gog.com/",
      domain: "gog.com",
      description: "DRM-free 游戏商店",
      category: "games",
      section: "stores",
      tags: ["游戏"],
      linkStatus: "verified",
      riskLevel: "standard",
      reviewStatus: "verified",
      source: { kind: "manual" },
    },
    {
      id: "ableton-live-suite",
      name: "Ableton Live 12 Suite",
      url: "https://www.ableton.com/en/live/",
      domain: "ableton.com",
      description: "专业音乐制作与现场演出 DAW；清单版本 12.4.3",
      category: "audio",
      section: "daw-dj",
      tags: ["Ableton", "DAW"],
      aliases: ["Live Suite"],
      linkStatus: "verified",
      riskLevel: "standard",
      reviewStatus: "verified",
      source: { kind: "manual" },
    },
    {
      id: "neural-dsp-mantra",
      name: "Neural DSP Mantra",
      url: "https://neuraldsp.com/plugins/mantra",
      domain: "neuraldsp.com",
      description: "人声处理插件",
      category: "audio",
      section: "vocals-repair",
      tags: ["Neural DSP", "人声"],
      aliases: ["Mantra"],
      linkStatus: "verified",
      riskLevel: "standard",
      reviewStatus: "verified",
      source: { kind: "manual" },
    },
    {
      id: "legacy-game-tool",
      name: "Legacy Game Tool",
      description: "旧版游戏工具",
      category: "games",
      section: "tools",
      tags: ["工具"],
      linkStatus: "unavailable",
      riskLevel: "standard",
      reviewStatus: "unverified",
      source: { kind: "manual" },
    },
  ],
};

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders kx导航站 as the brand name", () => {
    render(<App catalog={catalog} />);

    expect(screen.getByText("kx导航站", { exact: true })).toBeInTheDocument();
    expect(screen.queryByText("个人导航", { exact: true })).not.toBeInTheDocument();
  });

  it("uses one persistent indicator for the active category", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    const indicator = screen.getByTestId("nav-indicator");
    await user.click(screen.getByRole("button", { name: "AI" }));

    expect(screen.getByTestId("nav-indicator")).toBe(indicator);
    expect(screen.getByRole("button", { name: "AI" })).toHaveAttribute("aria-current", "page");
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

  it("renders the audio category before video with all configured sections", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    const navigation = screen.getByRole("navigation", { name: "网站分类" });
    const labels = within(navigation).getAllByRole("button").map((button) => button.textContent);
    expect(labels.indexOf("音频")).toBeLessThan(labels.indexOf("影视"));

    await user.click(within(navigation).getByRole("button", { name: "音频" }));

    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "DAW 与 DJ",
      "插件套装",
      "虚拟乐器与采样器",
      "混音与母带",
      "人声处理与修复",
      "混响与创意效果",
      "吉他与贝斯",
      "鼓与节奏",
    ]);
    expect(screen.getByRole("link", { name: /Ableton Live 12 Suite/ })).toBeInTheDocument();
  });

  it("finds audio software by alias", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "Mantra");

    expect(screen.getByRole("link", { name: /Neural DSP Mantra/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ableton Live 12 Suite/ })).not.toBeInTheDocument();
  });

  it("renders configured category sections in order while preserving site order", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "游戏" }));

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["游戏商店", "游戏工具"]);
    const stores = screen.getByRole("region", { name: "游戏商店" });
    expect(within(stores).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "SteamPC 游戏数字商店",
      "GOGDRM-free 游戏商店",
    ]);
  });

  it("searches section labels and renders unavailable entries as disabled rows", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "游戏工具");

    const unavailable = screen.getByRole("group", { name: /Legacy Game Tool/ });
    expect(unavailable).toHaveAttribute("aria-disabled", "true");
    expect(within(unavailable).getByText("暂无稳定链接")).toBeInTheDocument();
    expect(within(unavailable).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "收藏 Legacy Game Tool" })).not.toBeInTheDocument();
  });

  it("renders and keeps working when the browser blocks site storage", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const blocked = () => {
      throw new DOMException("denied", "SecurityError");
    };
    vi.spyOn(window, "localStorage", "get").mockImplementation(blocked);
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(blocked);
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "收藏 GitHub" }));
    expect(screen.getByRole("button", { name: "取消收藏 GitHub" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /AppNee/ }));
    await user.click(screen.getByRole("button", { name: "继续访问" }));
    expect(open).toHaveBeenCalledWith("https://appnee.com/", "_blank", "noopener,noreferrer");
  });

  it("keeps in-memory favorites when storage writes fail", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "收藏 GitHub" }));
    await user.click(screen.getByRole("button", { name: "收藏 AppNee" }));

    expect(screen.getByRole("button", { name: "取消收藏 GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消收藏 AppNee" })).toBeInTheDocument();
  });

  it("treats a whitespace-only query as browsing", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "AI" }));
    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "   ");

    expect(screen.getByRole("button", { name: "AI" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("navigation", { name: "网站分类" })).toHaveAttribute("data-indicator-visible", "true");
  });

  it("shows the warning on the favorites section when it holds a high-risk site", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "收藏 AppNee" }));

    const favorites = screen.getByRole("region", { name: "我的收藏" });
    expect(within(favorites).getByRole("button", { name: /外部站点，请自行甄别/ })).toBeInTheDocument();
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

  it("moves focus and favorite feedback to a row after home regrouping", async () => {
    const user = userEvent.setup();
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);
    const originalAnimate = HTMLElement.prototype.animate;
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate,
      writable: true,
    });

    try {
      render(<App catalog={catalog} />);

      await user.click(screen.getByRole("button", { name: "收藏 GitHub" }));

      const relocatedButton = screen.getByRole("button", { name: "取消收藏 GitHub" });
      expect(relocatedButton).toHaveFocus();
      expect(animate).toHaveBeenCalledTimes(1);
      expect(animate.mock.contexts[0]).toBe(relocatedButton.querySelector(".favorite-icon"));
    } finally {
      if (originalAnimate) {
        Object.defineProperty(HTMLElement.prototype, "animate", {
          configurable: true,
          value: originalAnimate,
          writable: true,
        });
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, "animate");
      }
    }
  });

  it("moves focus to the active category when an unfavorited hidden-home site disappears", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "音频" }));
    await user.click(screen.getByRole("button", { name: "收藏 Ableton Live 12 Suite" }));
    await user.click(screen.getByRole("button", { name: "常用" }));
    await user.click(screen.getByRole("button", { name: "取消收藏 Ableton Live 12 Suite" }));

    expect(screen.queryByRole("button", { name: /Ableton Live 12 Suite/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "常用" })).toHaveFocus();
  });

  it("replaces category motion with the latest navigation and does not replay the active category", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);
    const content = screen.getByTestId("content-stage");
    const firstCancel = vi.fn();
    const secondCancel = vi.fn();
    const animate = vi
      .fn()
      .mockReturnValueOnce({ cancel: firstCancel } as unknown as Animation)
      .mockReturnValueOnce({ cancel: secondCancel } as unknown as Animation);
    Object.defineProperty(content, "animate", { configurable: true, value: animate });

    await user.click(screen.getByRole("button", { name: "AI" }));
    await user.click(screen.getByRole("button", { name: "游戏" }));

    expect(firstCancel).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "游戏" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "游戏商店" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "游戏" }));
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it("keeps one search result section mounted and only fades when the search state changes", () => {
    render(<App catalog={catalog} />);
    const content = screen.getByTestId("content-stage");
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);
    Object.defineProperty(content, "animate", { configurable: true, value: animate });
    const input = screen.getByPlaceholderText("搜索网站、分类或标签");
    input.focus();

    fireEvent.change(input, { target: { value: "g" } });
    const resultSection = screen.getByRole("region", { name: "搜索结果" });
    expect(animate).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "gi" } });
    expect(screen.getByRole("region", { name: "搜索结果" })).toBe(resultSection);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "不存在的导航条目" } });
    expect(screen.getByRole("heading", { name: "没有找到匹配的网站" })).toBeInTheDocument();
    expect(animate).toHaveBeenCalledTimes(2);

    fireEvent.change(input, { target: { value: "游戏工具" } });
    expect(screen.getByRole("group", { name: /Legacy Game Tool/ })).toBeInTheDocument();
    expect(animate).toHaveBeenCalledTimes(3);
    expect(input).toHaveFocus();
  });

  it("cancels active native motion when reduced motion is enabled at runtime", async () => {
    let reduceMotion = false;
    let onPreferenceChange: ((event: MediaQueryListEvent) => void) | undefined;
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
            onPreferenceChange = listener as (event: MediaQueryListEvent) => void;
          },
          addListener: () => undefined,
          dispatchEvent: () => false,
          get matches() {
            return reduceMotion;
          },
          media: query,
          onchange: null,
          removeEventListener: () => undefined,
          removeListener: () => undefined,
        }) as MediaQueryList,
    );
    const user = userEvent.setup();
    render(<App catalog={catalog} />);
    const content = screen.getByTestId("content-stage");
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation);
    Object.defineProperty(content, "animate", { configurable: true, value: animate });

    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(animate).toHaveBeenCalledTimes(1);
    expect(onPreferenceChange).toBeTypeOf("function");

    reduceMotion = true;
    act(() => onPreferenceChange?.({ matches: true } as MediaQueryListEvent));
    expect(cancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "游戏" }));
    expect(animate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "游戏商店" })).toBeInTheDocument();
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

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(open).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    vi.useRealTimers();

    await user.click(screen.getByRole("link", { name: /AppNee/ }));
    const continueButton = screen.getByRole("button", { name: "继续访问" });
    vi.useFakeTimers();
    fireEvent.click(continueButton);
    fireEvent.click(continueButton);

    expect(open).toHaveBeenCalledWith("https://appnee.com/", "_blank", "noopener,noreferrer");
    expect(open).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("personal-nav:risk-ack:v1")).toBe("true");
    const closingDialog = screen.getByRole("dialog", { name: "访问外部站点" });
    const closingBackdrop = closingDialog.parentElement;
    expect(closingBackdrop).toHaveClass("is-closing");

    act(() => vi.advanceTimersByTime(199));
    expect(closingDialog).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    vi.useRealTimers();

    const acknowledgedLink = screen.getByRole("link", { name: /AppNee/ });
    expect(acknowledgedLink).toHaveAttribute("href", "https://appnee.com/");
    await user.click(acknowledgedLink);
    expect(screen.queryByRole("dialog", { name: "访问外部站点" })).not.toBeInTheDocument();
  });

  it("labels unchecked links for sighted and screen-reader users without changing verified links", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    const uncheckedLink = screen.getByRole("link", { name: /AppNee.*待核验/ });
    expect(within(uncheckedLink).getByText("待核验")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).not.toHaveAccessibleName(/待核验/);

    await user.click(screen.getByRole("button", { name: "收藏 AppNee" }));
    expect(screen.getByRole("button", { name: "取消收藏 AppNee" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /AppNee.*待核验/ }));
    expect(screen.getByRole("dialog", { name: "访问外部站点" })).toBeInTheDocument();
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

    vi.useFakeTimers();
    fireEvent.click(acknowledge);
    const backdrop = dialog.parentElement as HTMLElement;
    expect(dialog).toBeInTheDocument();
    expect(backdrop).toHaveClass("is-closing");
    expect(document.querySelector<HTMLElement>(".sidebar")?.inert).toBe(true);
    expect(document.querySelector<HTMLElement>(".content-shell")?.inert).toBe(true);

    fireEvent.keyDown(window, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(dialog).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(199));
    expect(dialog).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    vi.useRealTimers();
    expect(screen.queryByRole("dialog", { name: "免责声明" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("shows a category header with totals and a section jump bar", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "游戏" }));

    expect(screen.getByRole("heading", { level: 1, name: "游戏" })).toBeInTheDocument();
    expect(screen.getByText("3 个网站")).toBeInTheDocument();
    const jumpBar = screen.getByRole("navigation", { name: "小节" });
    expect(within(jumpBar).getAllByRole("link").map((link) => link.textContent)).toEqual(["游戏商店2", "游戏工具1"]);

    await user.click(within(jumpBar).getByRole("link", { name: /游戏工具/ }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("heading", { level: 2, name: "游戏工具" })).toHaveFocus();
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  });

  it("scrolls back to the top when switching categories after a section jump", async () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "游戏" }));
    scrollTo.mockClear();
    await user.click(within(screen.getByRole("navigation", { name: "小节" })).getByRole("link", { name: /游戏工具/ }));
    expect(scrollTo).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "音频" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
    scrollTo.mockRestore();
  });

  it("omits empty sections from the jump bar", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "音频" }));

    const jumpBar = screen.getByRole("navigation", { name: "小节" });
    expect(within(jumpBar).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "DAW 与 DJ1",
      "人声处理与修复1",
    ]);
  });

  it("shows no page header or jump bar on home, flat categories, or search", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    expect(screen.queryByRole("navigation", { name: "小节" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "小节" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "游戏" }));
    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "steam");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "小节" })).not.toBeInTheDocument();
  });

  it("focuses search with / and Ctrl+K without hijacking typed slashes", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);
    const input = screen.getByPlaceholderText("搜索网站、分类或标签");

    await user.keyboard("/");
    expect(input).toHaveFocus();
    expect(input).toHaveValue("");

    await user.type(input, "a/b");
    expect(input).toHaveValue("a/b");

    input.blur();
    await user.keyboard("{Control>}k{/Control}");
    expect(input).toHaveFocus();
  });

  it("ignores the search shortcut while a dialog is open", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "免责声明" }));
    await user.keyboard("/");

    expect(screen.getByPlaceholderText("搜索网站、分类或标签")).not.toHaveFocus();
  });

  it("clears the search with Escape or the clear button", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);
    const input = screen.getByPlaceholderText("搜索网站、分类或标签");

    await user.type(input, "git");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("button", { name: "清除搜索" })).not.toBeInTheDocument();

    await user.type(input, "git");
    input.blur();
    await user.click(screen.getByRole("button", { name: "清除搜索" }));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.getByRole("heading", { name: "常用" })).toBeInTheDocument();
  });

  it("reports the result count and highlights matches", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "git");

    const results = screen.getByRole("region", { name: "搜索结果" });
    expect(within(results).getByText("1 个")).toBeInTheDocument();
    expect(screen.getByText("找到 1 个网站")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /GitHub/ });
    expect(link.querySelector("mark")?.textContent).toBe("Git");
    expect(link.textContent).toContain("GitHub");

    await user.type(screen.getByPlaceholderText("搜索网站、分类或标签"), "zzz");
    expect(screen.getByText("没有找到匹配的网站", { selector: "p" })).toBeInTheDocument();
  });

  it("skips the modal exit hold when reduced motion is requested", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          addEventListener: () => undefined,
          addListener: () => undefined,
          dispatchEvent: () => false,
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          removeEventListener: () => undefined,
          removeListener: () => undefined,
        }) as MediaQueryList,
    );
    const user = userEvent.setup();
    render(<App catalog={catalog} />);

    await user.click(screen.getByRole("button", { name: "免责声明" }));
    await user.click(screen.getByRole("button", { name: "知道了" }));

    expect(screen.queryByRole("dialog", { name: "免责声明" })).not.toBeInTheDocument();
  });
});
