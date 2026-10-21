import { expect, test } from "@playwright/test";

test("renders the navigation shell and supports global search", async ({ page }, testInfo) => {
  await page.goto("./");
  await expect(page).toHaveTitle("kx导航站");

  if (testInfo.project.name === "desktop") {
    await expect(page.getByText("kx导航站", { exact: true })).toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "常用" })).toBeVisible();
  }
  await expect(page.getByPlaceholder("搜索网站、分类或标签")).toBeVisible();
  await expect(page.getByRole("heading", { name: "常用" })).toBeVisible();

  await page.getByPlaceholder("搜索网站、分类或标签").fill("chatgpt.com");
  await expect(page.getByRole("link", { name: /ChatGPT/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveCount(0);
});

test("shows a clear restrained search focus treatment", async ({ page }) => {
  await page.goto("./");

  const search = page.getByPlaceholder("搜索网站、分类或标签");
  const field = page.locator(".search-field");
  await search.focus();

  await expect(field).toHaveCSS("border-color", "rgb(36, 107, 253)");
  await expect(field).toHaveCSS("color", "rgb(36, 107, 253)");
  await expect(field).toHaveCSS("outline-style", "solid");
  await expect(field).toHaveCSS("transition-duration", "0.2s, 0.2s");
});

test("presents final motion states immediately when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  const indicator = page.getByTestId("nav-indicator");
  const content = page.getByTestId("content-stage");
  await page.getByRole("button", { name: "AI", exact: true }).click();

  await expect(page.getByRole("heading", { name: "AI 工具" })).toBeVisible();
  await expect(indicator).toHaveCSS("transition-duration", "0s");
  expect(await content.evaluate((element) => element.getAnimations().length)).toBe(0);

  await page.getByRole("button", { name: "免责声明" }).click();
  const dialog = page.getByRole("dialog", { name: "免责声明" });
  await expect(dialog).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "知道了" }).click();
  await expect(dialog).toHaveCount(0);
});

test("moves one category indicator and gives resource rows restrained hover feedback", async ({ page }, testInfo) => {
  await page.goto("./");

  const indicator = page.getByTestId("nav-indicator");
  const aiButton = page.getByRole("button", { name: "AI", exact: true });
  await aiButton.click();
  await indicator.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  const content = page.getByTestId("content-stage");
  await content.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });

  const indicatorBox = await indicator.boundingBox();
  const activeButtonBox = await aiButton.boundingBox();
  expect(indicatorBox).not.toBeNull();
  expect(activeButtonBox).not.toBeNull();
  expect(Math.abs((indicatorBox?.x ?? 0) - (activeButtonBox?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((indicatorBox?.y ?? 0) - (activeButtonBox?.y ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((indicatorBox?.width ?? 0) - (activeButtonBox?.width ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((indicatorBox?.height ?? 0) - (activeButtonBox?.height ?? 0))).toBeLessThanOrEqual(1);
  await expect(indicator).toHaveCSS("transition-duration", "0.24s, 0.24s");

  await aiButton.click();
  expect(await indicator.evaluate((element) => element.getAnimations().length)).toBe(0);
  expect(await content.evaluate((element) => element.getAnimations().length)).toBe(0);

  await page.getByRole("button", { name: "游戏" }).click();
  await page.getByRole("button", { name: "Windows" }).click();
  expect(await indicator.evaluate((element) => element.getAnimations().length)).toBeLessThanOrEqual(1);
  expect(await content.evaluate((element) => element.getAnimations().length)).toBeLessThanOrEqual(1);
  await content.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  await expect(page.getByRole("button", { name: "Windows" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "软件资源" })).toBeVisible();

  if (testInfo.project.name === "mobile") return;

  const appNeeLink = page.getByRole("link", { name: /AppNee/ });
  const appNeeRow = appNeeLink.locator("xpath=ancestor::article");
  await appNeeLink.hover();

  await expect(appNeeRow).toHaveCSS("background-color", "rgb(247, 248, 250)");
  await expect(appNeeRow).toHaveCSS("transition-duration", "0.2s");
  await expect(appNeeLink.locator(".site-name")).toHaveCSS("color", "rgb(36, 107, 253)");
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

test("updates continuous Chinese search without remounting or leaving residual motion", async ({ page }) => {
  await page.goto("./");

  const input = page.getByPlaceholder("搜索网站、分类或标签");
  const content = page.getByTestId("content-stage");
  await input.fill("游");
  const resultSection = page.getByRole("region", { name: "搜索结果" });
  const originalResultSection = await resultSection.elementHandle();
  expect(originalResultSection).not.toBeNull();

  await input.pressSequentially("戏工具");
  await expect(input).toHaveValue("游戏工具");
  await expect(page.getByRole("link", { name: /Nexus Mods/ })).toBeVisible();
  expect(
    await resultSection.evaluate((element, original) => element === original, originalResultSection),
  ).toBe(true);
  await expect(input).toBeFocused();

  await input.fill("不存在的导航条目");
  await expect(page.getByRole("heading", { name: "没有找到匹配的网站" })).toBeVisible();
  await input.fill("游戏工具");
  await expect(page.getByRole("link", { name: /Nexus Mods/ })).toBeVisible();
  expect(await content.evaluate((element) => element.getAnimations().length)).toBeLessThanOrEqual(1);
  await content.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  await expect(content).toHaveCSS("opacity", "1");
  await expect(content).toHaveCSS("transform", "none");
});

test("persists favorites after a reload", async ({ page }) => {
  await page.goto("./");

  await page.getByRole("button", { name: "收藏 GitHub" }).click();
  const relocatedFavorite = page.getByRole("button", { name: "取消收藏 GitHub" });
  const favoriteIcon = relocatedFavorite.locator(".favorite-icon");
  await expect(relocatedFavorite).toBeFocused();
  await expect(favoriteIcon).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("personal-nav:favorites:v1") ?? "[]"))).toEqual([
    "github",
  ]);
  expect(
    await favoriteIcon.evaluate((element) =>
      element.getAnimations().some((animation) => animation.effect?.getTiming().duration === 220),
    ),
  ).toBe(true);
  await favoriteIcon.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  await expect(favoriteIcon).toHaveCSS("transform", "none");
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
        document.documentElement.dataset.openHadUserActivation = String(navigator.userActivation.isActive);
        return null;
      },
    });
  });
  await page.goto("./");

  await page.getByRole("button", { name: "免责声明" }).click();
  const disclaimerDialog = page.getByRole("dialog", { name: "免责声明" });
  await expect(disclaimerDialog).toContainText("本站仅提供公开网址索引");
  await page.getByRole("button", { name: "知道了" }).click();
  await expect(disclaimerDialog).toHaveCount(0);

  await page.getByRole("button", { name: "Windows" }).click();
  const appNee = page.getByRole("link", { name: /AppNee/ });
  await expect(appNee).not.toHaveAttribute("href");
  await appNee.click({ button: "middle" });
  const riskDialog = page.getByRole("dialog", { name: "访问外部站点" });
  const riskBackdrop = riskDialog.locator("..");
  await expect(riskDialog).toBeVisible();
  await expect(riskDialog).toContainText("本站仅提供公开网址索引");
  await expect(riskBackdrop).toHaveCSS("animation-duration", "0.24s");
  await expect(riskBackdrop).toHaveCSS("animation-timing-function", "cubic-bezier(0.22, 1, 0.36, 1)");
  await page.getByRole("button", { name: "取消" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-last-opened");
  await expect(riskBackdrop).toHaveClass(/is-closing/);
  await expect(riskBackdrop).toHaveCSS("animation-duration", "0.2s");
  expect(await page.locator(".sidebar").evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  expect(await page.locator(".content-shell").evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  await page.keyboard.press("Tab");
  expect(await riskDialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(riskDialog).toHaveCount(0);
  expect(await page.locator(".sidebar").evaluate((element) => (element as HTMLElement).inert)).toBe(false);

  await appNee.click();
  const reopenedRiskDialog = page.getByRole("dialog", { name: "访问外部站点" });
  await page.getByRole("button", { name: "继续访问" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-last-opened", "https://appnee.com/");
  await expect(page.locator("html")).toHaveAttribute("data-open-had-user-activation", "true");
  const acknowledgedAppNee = page.getByRole("link", { name: /AppNee/ });
  await expect(acknowledgedAppNee).toHaveAttribute("href", "https://appnee.com/");
  await expect(reopenedRiskDialog).toHaveCount(0);
  await expect(acknowledgedAppNee).toBeFocused();
});

test("keeps the mobile layout within the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only layout check");
  await page.goto("./");

  await expect(page.getByRole("button", { name: "Windows" })).toBeVisible();
  await expect(page.getByRole("button", { name: "常用" })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole("button", { name: "Windows" })).toBeInViewport({ ratio: 1 });
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

test("follows the system dark colour scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");

  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(17, 19, 24)");
  await expect(page.locator(".sidebar")).toHaveCSS("background-color", "rgb(24, 27, 33)");
  await expect(page.locator(".site-name").first()).toHaveCSS("color", "rgb(232, 234, 238)");

  await page.getByPlaceholder("搜索网站、分类或标签").focus();
  await expect(page.locator(".search-field")).toHaveCSS("border-color", "rgb(107, 157, 255)");
});

test("jumps to a section from the sticky section bar", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.getByRole("button", { name: "音频" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "音频" })).toBeVisible();
  const jumpBar = page.getByRole("navigation", { name: "小节" });
  await expect(jumpBar.getByRole("link")).toHaveCount(8);

  await jumpBar.getByRole("link", { name: /鼓与节奏/ }).click();
  const heading = page.getByRole("heading", { level: 2, name: "鼓与节奏" });
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();

  if (testInfo.project.name === "desktop") {
    await expect(jumpBar).toBeInViewport();
    const [barBox, headingBox] = await Promise.all([jumpBar.boundingBox(), heading.boundingBox()]);
    expect(headingBox!.y).toBeGreaterThanOrEqual(barBox!.y + barBox!.height);
  }

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test("focuses search from the keyboard and clears it", async ({ page }) => {
  await page.goto("./");
  const input = page.getByPlaceholder("搜索网站、分类或标签");

  await page.keyboard.press("/");
  await expect(input).toBeFocused();
  await input.fill("github");
  await expect(page.locator("mark.search-match").first()).toHaveText(/github/i);
  await page.keyboard.press("Escape");
  await expect(input).toHaveValue("");
  await expect(page.getByRole("heading", { name: "常用" })).toBeVisible();
});
