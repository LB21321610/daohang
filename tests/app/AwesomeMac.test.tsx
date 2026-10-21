import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../../src/app/App";
import type { LinkedSite, SiteCatalog } from "../../src/domain/site";

function importedSite(id: string, name: string, section: string, subsection?: string): LinkedSite {
  return {
    id,
    name,
    url: `https://${id}.example/`,
    domain: `${id}.example`,
    description: `${name} 的描述`,
    category: "awesome-mac",
    section,
    ...(subsection ? { subsection } : {}),
    tags: subsection ? [subsection] : ["实用工具"],
    riskLevel: "standard",
    reviewStatus: "unverified",
    linkStatus: "verified",
    source: { kind: "awesome-mac", url: "https://github.com/jaywcjlove/awesome-mac" },
  };
}

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
      id: "awesome-mac",
      label: "Awesome Mac",
      navLabel: "Awesome Mac",
      homeLabel: "Awesome Mac",
      order: 90,
      homeMode: "hidden",
      homeGroup: "awesome-mac",
      homeOrder: 90,
      credit: {
        label: "jaywcjlove/awesome-mac",
        url: "https://github.com/jaywcjlove/awesome-mac",
        license: "CC BY 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/deed.zh-hans",
      },
      sections: [
        { id: "reading-writing", label: "阅读与写作", order: 10 },
        { id: "utilities", label: "实用工具", order: 20 },
      ],
    },
  ],
  sites: [
    importedSite("coteditor", "CotEditor", "reading-writing", "文本编辑器"),
    importedSite("zed", "Zed", "reading-writing", "文本编辑器"),
    importedSite("bear", "Bear", "reading-writing", "笔记"),
    importedSite("dropover", "Dropover", "utilities"),
    importedSite("rectangle", "Rectangle", "utilities", "窗口管理"),
  ],
};

describe("awesome-mac category", () => {
  it("credits the upstream project and license in the page header", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} showLaunchNotice={false} />);

    await user.click(screen.getByRole("button", { name: "Awesome Mac" }));

    expect(screen.getByRole("heading", { level: 1, name: "Awesome Mac" })).toBeInTheDocument();
    const repository = screen.getByRole("link", { name: "jaywcjlove/awesome-mac" });
    expect(repository).toHaveAttribute("href", "https://github.com/jaywcjlove/awesome-mac");
    expect(repository).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "CC BY 4.0" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by/4.0/deed.zh-hans",
    );
  });

  it("groups rows under upstream sub-headings while browsing, but not in search results", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} showLaunchNotice={false} />);

    await user.click(screen.getByRole("button", { name: "Awesome Mac" }));

    const reading = screen.getByRole("heading", { level: 2, name: "阅读与写作" }).closest("section")!;
    expect(within(reading).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "文本编辑器",
      "笔记",
    ]);
    const utilities = screen.getByRole("heading", { level: 2, name: "实用工具" }).closest("section")!;
    expect(within(utilities).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "窗口管理",
    ]);

    await user.type(screen.getByRole("searchbox"), "e");

    expect(screen.getByRole("heading", { level: 2, name: "搜索结果" })).toBeInTheDocument();
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  it("does not show the credit line on categories without one", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} showLaunchNotice={false} />);

    await user.click(screen.getByRole("button", { name: "常用" }));

    expect(screen.queryByRole("link", { name: "jaywcjlove/awesome-mac" })).not.toBeInTheDocument();
  });

  it("lets a vertical mouse wheel scroll the overflowing jump bar sideways", async () => {
    const user = userEvent.setup();
    render(<App catalog={catalog} showLaunchNotice={false} />);
    await user.click(screen.getByRole("button", { name: "Awesome Mac" }));

    const jumpBar = screen.getByRole("navigation", { name: "小节" });
    Object.defineProperty(jumpBar, "scrollWidth", { configurable: true, value: 600 });
    Object.defineProperty(jumpBar, "clientWidth", { configurable: true, value: 200 });

    // fireEvent returns false when the handler called preventDefault.
    expect(fireEvent.wheel(jumpBar, { deltaY: 120 })).toBe(false);
    expect(jumpBar.scrollLeft).toBe(120);

    jumpBar.scrollLeft = 400;
    // At the right edge the wheel falls through to the page.
    expect(fireEvent.wheel(jumpBar, { deltaY: 120 })).toBe(true);
    expect(jumpBar.scrollLeft).toBe(400);
  });
});
