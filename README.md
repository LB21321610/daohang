<div align="center">

# 🧭 kx导航站 / Personal Navigation

**收藏夹已经乱成一锅粥了，于是我做了个碗。🥣**<br>
**My bookmarks became soup, so I built a bowl.**

<a href="#-中文"><kbd>🇨🇳 中文</kbd></a>
&nbsp;&nbsp;
<a href="#-english"><kbd>🇺🇸 English</kbd></a>

<br><br>

[🚀 在线打开 / Live Demo](https://lb21321610.github.io/daohang/) ·
[📦 源码 / Source](https://github.com/LB21321610/daohang) ·
[🛠️ 部署状态 / Deploy Status](https://github.com/LB21321610/daohang/actions/workflows/deploy.yml)

[![Deploy personal navigation](https://github.com/LB21321610/daohang/actions/workflows/deploy.yml/badge.svg)](https://github.com/LB21321610/daohang/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2ea44f.svg)](LICENSE)

</div>

---

## 🇨🇳 中文

> “这个网站我昨天还用过，到底放哪了？”<br>
> —— 我，以及每一个开着 37 个标签页、内存条正在冒烟的人 😵‍💫🔥

事情是这样的：我的收藏夹里有“新建文件夹”、“新建文件夹 (2)”、“临时”、“临时2”、“别删”。🗂️💀

于是就有了这个导航站。它是一个静态、轻量、能用 YAML 配置的个人导航页，把常用网站、AI 工具、软件资源，还有游戏、音频、视频、影视目录都塞进同一页。收藏夹终于可以退休了，感谢它这些年的混乱付出。🫡

### ✨ 它能干啥

- 🔎 **全局搜索**：名称、别名、描述、分类、标签都能搜，命中的字还会高亮。记不住全名？搜两个字也行
- ⌨️ **键盘党福利**：按 `/` 或 `Ctrl/⌘ + K` 直接聚焦搜索，`Esc` 一键清空。鼠标：那我走？🐭
- 🗂️ **分类清楚**：常用、AI、软件、游戏、音频、视频、影视，各回各家，各找各妈
- 🧭 **小节跳转栏**：分类太长？点一下直接飞过去。切到别的分类会自动回到顶部，不会把你卡在半山腰 🏔️
- ⭐ **本地收藏**：存在你自己的浏览器里，刷新不失忆（清缓存的话……那就失忆了，节哀 🕯️）
- 🌙 **深色模式**：跟着系统走，半夜打开不闪瞎
- 🫧 **玻璃质感**：侧栏、顶栏带一层毛玻璃。系统开了“减少透明度”或“减少动态效果”，它就老老实实变回实心
- 🧩 **YAML 配置**：加网站改配置就行，不用去组件里考古 ⛏️
- ⚠️ **风险提醒**：高风险资源一直挂着警告，第一次打开前要你点头确认
- 📱 **响应式布局**：电脑上舒展，手机上也不横着跑
- 🚀 **自动部署**：推到 `main`，GitHub Actions 自动发布到 Pages。我负责 push，它负责干活 ☕

### 🏃 三步跑起来（其实两步）

```bash
npm install
npm run dev
```

想来一套全身体检：

```bash
npm run check
```

依赖审计 → 内容生成 → 类型检查 → 代码检查 → 单元测试 → 生产构建 → 托管适配测试 → 端到端测试。属于“来都来了，全查一遍”，喝口水的工夫就跑完了。🩺💧

### 🧰 怎么加网站

收藏夹不会自己整理，但 YAML 会（大概）。配置都在这：

```text
content/
├── categories.yml      👈 分类
└── sites/              👈 网站们住这
    ├── common.yml
    ├── ai.yml
    ├── windows.yml
    ├── mac.yml
    ├── cross-platform.yml
    ├── games.yml
    ├── audio.yml
    ├── video.yml
    └── media.yml
```

改完跑一下：

```bash
npm run content:build
```

生成器会挨个检查：HTTPS、重复 ID、重复网址、分类和小节引用对不对、字段格式对不对，然后才生成前端用的数据。写错了当场报错，坏配置别想偷偷溜上线。🕵️‍♂️🚨

几条家规 📜：

- 已关站、域名在卖、内容货不对板且找不到正确入口的 → 删掉，不留情面 🗑️
- 网站搬家了 → 更新网址，ID 保持不变
- 被反爬、地区限制、人机验证挡住、没法确认的 → 标成 `unchecked`，页面显示“待核验”
- 亲眼看过、页面和条目对得上 → 才能标 `verified`
- 链接能不能打开（`linkStatus`）和内容安不安全（`reviewStatus`）是两回事，分开管。**能打开 ≠ 安全**，就像能吃 ≠ 好吃 🍄

目前已经没有“暂无稳定链接”的占位条目了。

### 🎵 音频资源

`content/sites/audio.yml` 里有 **130 条**产品记录，按用途分成八组：

🎛️ DAW 与 DJ · 📦 插件套装 · 🎹 虚拟乐器与采样器 · 🎚️ 混音与母带 · 🎤 人声处理与修复 · 🌌 混响与创意效果 · 🎸 吉他与贝斯 · 🥁 鼓与节奏

导航里音频排在视频前面，首页还是原来的分组。品牌写在标签里，别名也能搜。

几个容易误会的地方：

- 描述里的“清单版本”是导入清单时的版本快照，**不是**外站当前最新版，也不保证还能下
- 套装算一条，单品各算各的
- Logic Pro 用的是 Mac App Store 官方页；5 个已经下架的详情页换成了对应产品官网
- KOMPLETE FX Bundle 的网址看着像 XLN Audio 的历史链接，别慌，已经核对过页面标题、开发者和版本，确实是 KOMPLETE FX 👌

### 🔗 全量链接检查

```bash
npm run links:check
# 想要机器能读的结果（日志里不含抓下来的正文）
npm run --silent links:check -- --json > links-check.json
```

检查器会限速发 GET 请求，看 HTTPS、重定向、标题和一小段正文，失败了再试一次，最后输出最终地址、状态和出错原因。

⚠️ 注意：HTTP 200 不代表万事大吉，可能是卖域名的、软 404、空白页，或者“请证明你不是机器人”🤖。`reachable` 只说明机器读到了东西，还得人去看一眼。有问题的条目要在浏览器里复查，不能因为报了一次错就删。这个命令不会改 YAML，也不放进 `npm run check` 和发布流程，免得别人家网站抽风把我们的部署也带崩。

📅 最近一次全量核验：**2026-09-06**

| 项目 | 数量 |
| --- | --- |
| 原有记录 + 附件产品 | 140 + 130 |
| 🗑️ 删除旧记录 | 34 |
| 🔧 更新/补回旧链接 | 35（更新 30，恢复 5） |
| ➕ 新增音频 | 130 |
| 📦 最终总数 | **236** |
| ✅ 已核验 | **226** |
| ⏳ 待核验 | **10**（不算进“确认能打开”） |

这是核验当天的结果，外站明天在不在，谁也说不准。🤷

### 🥕 Carrot 数据导入

可以从 [`xx025/carrot`](https://github.com/xx025/carrot) 的公开 README 里提取网站名称、网址和分类：

```bash
npm run content:import-carrot
```

导入的东西只会进人工审核区，不会自动上线。上游的描述、图标、排序和风险状态都不会照搬，审核过、补全了本站信息才能转正。一句话：**可以参考，不能闭眼全收。** 👀

### ⚠️ 外部站点说明（这段是认真的 🙂）

本站仅提供公开网址索引，不存储、上传或分发第三方文件，也不对外部站点的合法性、安全性、准确性或可用性作保证。访问和使用第三方内容前，请自行确认所在地法律、软件许可及版权要求；由此产生的风险由访问者自行承担。

---

## 🇺🇸 English

> “I used that website yesterday. Where did it go?”<br>
> — Me, and everyone else with 37 tabs open and a laptop fan doing its best jet engine impression 😵‍💫✈️

True story: my bookmarks bar had folders called “New Folder”, “New Folder (2)”, “temp”, “temp2”, and “DO NOT DELETE”. 🗂️💀

So I built this. It's a static, lightweight, YAML-configured start page for everyday sites, AI tools, software, and curated game, audio, video, and film/TV catalogs. My bookmarks folder has been honorably retired. Thank you for your service. 🫡

### ✨ What it does

- 🔎 **Global search** across names, aliases, descriptions, categories, and tags, with matches highlighted. Two letters is usually enough
- ⌨️ **Keyboard friendly**: `/` or `Ctrl/⌘ + K` jumps to search, `Esc` clears it. Your mouse can take a nap 🐭💤
- 🗂️ **Tidy categories**: everyday, AI, software, games, audio, video, film/TV. Everything has a home
- 🧭 **Section jump bar** for long categories. Switching category takes you back to the top instead of leaving you stranded halfway down 🏔️
- ⭐ **Local favorites** saved in your browser. They survive reloads (they do not survive you clearing site data, RIP 🕯️)
- 🌙 **Dark mode** that follows your system, so 2 a.m. browsing won't sear your eyeballs
- 🫧 **Frosted glass** on the sidebar and top bar, which turns solid again if you ask for reduced transparency or reduced motion
- 🧩 **YAML-powered content**: adding a site is a config change, not an archaeology dig ⛏️
- ⚠️ **Risk-aware links**: high-risk entries always show a warning and ask before your first visit
- 📱 **Responsive**: roomy on desktop, no sideways scrolling on your phone
- 🚀 **Auto-deploy**: push to `main` and GitHub Actions ships it to Pages. I push, the robots work ☕

### 🏃 Quick start (it's two steps, really)

```bash
npm install
npm run dev
```

Want the full checkup?

```bash
npm run check
```

Dependency audit → content generation → type check → lint → unit tests → production build → hosting checks → end-to-end tests. The whole spa day, done in about one coffee. 🛁☕

### 🧰 Adding sites

Categories live in `content/categories.yml`, sites live in `content/sites/*.yml`. After editing, run:

```bash
npm run content:build
```

The generator checks HTTPS, duplicate IDs and URLs, category and section references, and field formats before it builds the data the frontend uses. Bad config gets stopped at the door. 🚧🙅

House rules 📜:

- Closed, parked-for-sale, or totally-not-what-it-says sites with no correct replacement → deleted, no mercy 🗑️
- A site moved house → update the URL, keep the ID
- Blocked by anti-bot checks, region locks, or captchas → keep as `unchecked`, shown as “待核验” (pending verification)
- Only mark `verified` after a human actually checked the page matches the entry
- Reachability (`linkStatus`) and content safety (`reviewStatus`) are tracked separately. **Opens fine ≠ safe**, the same way edible ≠ delicious 🍄

There are currently no “No stable link” placeholders left.

### 🎵 Audio resources

`content/sites/audio.yml` holds **130 product records** in eight sections:

🎛️ DAW & DJ · 📦 Plugin bundles · 🎹 Virtual instruments & samplers · 🎚️ Mixing & mastering · 🎤 Vocals & restoration · 🌌 Reverb & creative FX · 🎸 Guitar & bass · 🥁 Drums & rhythm

Audio sits before Video in the nav; the home page groups stay the same. Brands are tags, and product aliases are searchable.

A few things that look weird but aren't:

- “清单版本” in a description is the version from the supplied list. It's a snapshot, **not** a promise about the latest release or that it's still downloadable
- A bundle counts as one record; individual products are listed separately
- Logic Pro points to its official Mac App Store page; five removed detail pages now point to the official product pages
- KOMPLETE FX Bundle still uses an old XLN Audio URL. Don't panic: page title, developer, and version were all checked and it really is KOMPLETE FX 👌

### 🔗 Checking every link

```bash
npm run links:check
# Machine-readable output (no scraped page bodies in the log)
npm run --silent links:check -- --json > links-check.json
```

The checker sends rate-limited GET requests, looks at HTTPS, redirects, the title, and a small body sample, and retries failures once. You get the final URL, status, and the reason something looks off.

⚠️ HTTP 200 can still be a parked domain, a soft 404, a blank page, or a “prove you're human” wall 🤖. `reachable` only means a machine got something back; a human still needs to look. Recheck anything odd in a real browser before touching the catalog. The command never rewrites YAML and stays out of `npm run check` and deploys, so someone else's outage can't break our release.

📅 Latest full audit: **2026-09-06**

| What | Count |
| --- | --- |
| Original records + supplied products | 140 + 130 |
| 🗑️ Old records removed | 34 |
| 🔧 Old links updated/restored | 35 (30 updated, 5 restored) |
| ➕ Audio records added | 130 |
| 📦 Total | **236** |
| ✅ Verified | **226** |
| ⏳ Pending verification | **10** (not counted as confirmed working) |

That's how things looked on audit day. Whether those sites are still alive tomorrow is between them and their hosting bill. 🤷

### 🥕 Importing Carrot data

You can pull public names, URLs, and categories from the [`xx025/carrot`](https://github.com/xx025/carrot) README:

```bash
npm run content:import-carrot
```

Imports land in a review area and never go live on their own. Upstream descriptions, icons, ordering, and risk labels aren't copied. Think of it as an inbox, not an “accept all” button. 📥

### ⚠️ External-site disclaimer (serious face on 🙂)

This project only indexes public URLs. It does not store, upload, or distribute third-party files, and it makes no guarantee about the legality, safety, accuracy, or availability of external websites. Before accessing or using third-party content, check the laws, software licenses, and copyright requirements that apply to you. You assume the risks associated with visiting those sites.

---

## 🙌 Contributors / 贡献者

- 👤 [LB21321610](https://github.com/LB21321610) — 项目维护者，负责出主意、点合并、以及半夜说“我睡了” / Project maintainer: ideas, merges, and announcing bedtime 😴
- 🤖 **OpenAI Codex（AI 协作 / AI collaboration）** — 链接复核、音频目录整理、代码与测试、文档维护 / Link review, audio catalog, implementation, tests, and documentation
- 🤖 **[Claude](https://claude.ai/code)（Anthropic，AI 协作 / AI collaboration）** — 玻璃质感界面、切换分类自动回到顶部的修复、测试，以及这份话变多了的 README / Liquid Glass UI, the scroll-to-top-on-category-switch fix, tests, and this chattier README

人类负责有想法，AI 负责不睡觉。合作愉快。🤝<br>
Humans bring the ideas, AIs skip the sleep. Great teamwork. 🤝

## 📄 License

[MIT License](LICENSE)。随便用、随便改、改成你自己的，记得保留许可证声明就行。🪄<br>
Released under the [MIT License](LICENSE). Use it, remix it, make it yours, just keep the license notice. 🪄

<div align="center">

**少开一个标签页，多留一点内存。🧠✨**<br>
**One fewer tab, one happier laptop fan.** 🌬️

[⬆️ 回到顶部 / Back to top](#-kx导航站--personal-navigation)

</div>
