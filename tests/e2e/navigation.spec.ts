import { expect, test } from "@playwright/test";

test("renders the navigation shell and supports global search", async ({ page }, testInfo) => {
  await page.goto("./");

  if (testInfo.project.name === "desktop") {
    await expect(page.getByText("个人导航", { exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "常用" })).toBeVisible();
  }
  await expect(page.getByPlaceholder("搜索网站、分类或标签")).toBeVisible();
  await expect(page.getByRole("heading", { name: "常用" })).toBeVisible();

  await page.getByPlaceholder("搜索网站、分类或标签").fill("chatgpt.com");
  await expect(page.getByRole("link", { name: /ChatGPT/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveCount(0);
});

test("browses and searches the audio catalog without horizontal overflow", async ({ page }) => {
  await page.goto("./");

  await page.getByRole("button", { name: "音频" }).click();
  await expect(page.getByRole("heading", { name: "DAW 与 DJ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "插件套装" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "虚拟乐器与采样器" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "混音与母带" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "人声处理与修复" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "混响与创意效果" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "吉他与贝斯" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "鼓与节奏" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ableton Live 12 Suite/ })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);

  await page.getByPlaceholder("搜索网站、分类或标签").fill("Mantra");
  await expect(page.getByRole("link", { name: /Neural DSP Mantra/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ableton Live 12 Suite/ })).toHaveCount(0);
});

test("persists favorites after a reload", async ({ page }) => {
  await page.goto("./");

  await page.getByRole("button", { name: "收藏 GitHub" }).click();
  await page.reload();

  await expect(page.getByRole("heading", { name: "我的收藏" })).toBeVisible();
  await expect(page.getByRole("button", { name: "取消收藏 GitHub" })).toBeVisible();
});

test("shows disclaimer and gates a high-risk site once per session", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop covers the complete dialog journey");

  await page.addInitScript(() => {
    Object.defineProperty(window, "open", {
      configurable: true,
      value: (url: string) => {
        document.documentElement.dataset.lastOpened = url;
        return null;
      },
    });
  });
  await page.goto("./");

  await page.getByRole("button", { name: "免责声明" }).click();
  await expect(page.getByRole("dialog", { name: "免责声明" })).toContainText(
    "本站仅提供公开网址索引",
  );
  await page.getByRole("button", { name: "知道了" }).click();

  await page.getByRole("button", { name: "Windows" }).click();
  const appNee = page.getByRole("link", { name: /AppNee/ });
  await expect(appNee).not.toHaveAttribute("href");
  await appNee.click({ button: "middle" });
  const riskDialog = page.getByRole("dialog", { name: "访问外部站点" });
  await expect(riskDialog).toBeVisible();
  await expect(riskDialog).toContainText("本站仅提供公开网址索引");
  await page.getByRole("button", { name: "取消" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-last-opened");

  await appNee.click();
  await page.getByRole("button", { name: "继续访问" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-last-opened", "https://appnee.com/");
  await expect(page.getByRole("link", { name: /AppNee/ })).toHaveAttribute("href", "https://appnee.com/");
});

test("keeps the mobile layout within the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only layout check");
  await page.goto("./");

  await expect(page.getByRole("button", { name: "Windows" })).toBeVisible();
  await page.getByRole("button", { name: "Windows" }).click();
  await expect(page.getByRole("heading", { name: "软件资源" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test("keeps the last navigation item and disclaimer reachable on a short desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Short desktop-only layout check");
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("./");

  await expect(page.locator(".sidebar")).toHaveCSS("overflow-y", "auto");

  const lastNavigationItem = page.locator(".nav-item").last();
  await lastNavigationItem.scrollIntoViewIfNeeded();
  await expect(lastNavigationItem).toBeVisible();
  await lastNavigationItem.click();
  await expect(lastNavigationItem).toHaveAttribute("aria-current", "page");

  const disclaimer = page.getByRole("button", { name: "免责声明" });
  await disclaimer.scrollIntoViewIfNeeded();
  await expect(disclaimer).toBeVisible();
  await disclaimer.click();
  await expect(page.getByRole("dialog", { name: "免责声明" })).toBeVisible();
});

test("requires confirmation again in a fresh browser session", async ({ browser, page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop covers the session lifecycle");

  await page.addInitScript(() => {
    Object.defineProperty(window, "open", { configurable: true, value: () => null });
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Windows" }).click();
  await page.getByRole("link", { name: /AppNee/ }).click();
  await page.getByRole("button", { name: "继续访问" }).click();
  await expect(page.getByRole("link", { name: /AppNee/ })).toHaveAttribute("href", "https://appnee.com/");

  const freshContext = await browser.newContext({ baseURL: String(testInfo.project.use.baseURL) });
  const freshPage = await freshContext.newPage();
  await freshPage.goto("./");
  await freshPage.getByRole("button", { name: "Windows" }).click();
  const freshAppNee = freshPage.getByRole("link", { name: /AppNee/ });
  await expect(freshAppNee).not.toHaveAttribute("href");
  await freshAppNee.click();
  await expect(freshPage.getByRole("dialog", { name: "访问外部站点" })).toBeVisible();
  await freshContext.close();
});
