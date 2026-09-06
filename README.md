<div align="center">

# 🧭 个人导航 / Personal Navigation

**把散落在收藏夹、聊天记录和“我明明见过这个网站”的记忆碎片，收进安静的一页。**<br>
**One calm page for all the sites you swear you bookmarked somewhere.**

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
> —— 每个打开了 37 个标签页的人 😵‍💫

这是一个静态、轻量、可配置的个人导航站。它把常用网站、AI 工具、软件资源，以及游戏、音频、视频与影视目录整理到同一个页面里，让浏览器收藏夹暂时停止自由生长。🌱

### ✨ 它会什么

- 🔎 **全局搜索**：按名称、别名、描述、分类或标签快速找站点
- 🗂️ **清晰分类**：常用、AI、软件、游戏、音频、视频、影视，各回各家
- ⭐ **本地收藏**：收藏保存在浏览器里，刷新也不会失忆
- 🧩 **YAML 配置**：新增网站不用进组件里考古
- ⚠️ **风险提醒**：高风险资源始终显示警告，首次打开链接前需要确认
- 📱 **响应式布局**：桌面端安静舒展，移动端也不会横着跑
- 🚀 **自动部署**：推送到 `main` 后由 GitHub Actions 发布到 Pages

### 🏃 快速开始

```bash
npm install
npm run dev
```

完整体检套餐：

```bash
npm run check
```

它会依次执行依赖审计、内容生成、类型检查、代码检查、单元测试、生产构建、托管适配测试和端到端测试。属于是“来都来了，全查一遍”。🩺

### 🧰 维护网站数据

收藏夹不会自己整理，但 YAML 会。站点与分类配置放在：

```text
content/
├── categories.yml
└── sites/
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

修改后运行：

```bash
npm run content:build
```

生成器会检查 HTTPS、重复 ID、重复网址、分类与分组引用、字段格式，然后生成前端使用的数据。写错了就立刻报错，不让坏配置悄悄混进页面。🕵️

确认关闭、域名出售、内容不符且找不到正确入口的条目会被删除；同一站点迁移时更新网址并保留 ID。当前目录已清除“暂无稳定链接”占位记录。反爬、地区限制或访问验证导致无法确认的链接保留为 `unchecked`，页面显示“待核验”；核对实际页面与条目相符后才设为 `verified`。链接可达性 `linkStatus` 与内容风险审核 `reviewStatus` 分开维护：可打开不代表内容已通过安全审核。

### 🎵 音频资源

`content/sites/audio.yml` 收录附件中的 **130 条产品记录**，按主要用途分为八组：DAW 与 DJ、插件套装、虚拟乐器与采样器、混音与母带、人声处理与修复、混响与创意效果、吉他与贝斯、鼓与节奏。音频入口位于视频之前，首页仍沿用原有分组。品牌放在标签中，别名也能搜索。

描述中的“清单版本”来自导入清单，是版本快照；不代表外站当前最新版，也不保证该版本仍可下载。套装按一条记录计算，单品各自保留。Logic Pro 使用官方 Mac App Store 页面；5 个已下架的详情页改用对应产品官网。KOMPLETE FX Bundle 的详情页保留了历史 XLN Audio URL，但已核对页面标题、开发者和版本确实对应 KOMPLETE FX。

### 🔗 全量链接检查

```bash
npm run links:check
# 需要保存机器可读结果时（日志中不含抓取正文）
npm run --silent links:check -- --json > links-check.json
```

检查器限速 GET 请求，检查 HTTPS、重定向、标题和有限正文，失败时重试一次；输出最终地址、状态和异常原因。HTTP 200 也可能是出售域名、软 404、空页或验证页，`reachable` 仅表示机器读到了页面，仍需人工核对内容。异常条目结合浏览器复核后处理，不能凭一次错误直接删除。命令不会改写 YAML，也不接入 `npm run check` 或发布流程，避免外站波动影响部署。

最近全量核验：**2026-09-06**。检查原有 140 条及附件 130 条：删除旧记录 34 条，更新或补回旧链接 35 条（30 条更新、5 条恢复），新增音频 130 条，最终共 **236 条**。其中 **226 条已核验、10 条待核验**；待核验条目不计入“已确认可打开”。此记录是核验当日的结果，不保证外站持续在线。

### 🥕 Carrot 数据导入

项目可以从 [`xx025/carrot`](https://github.com/xx025/carrot) 的公开 README 提取网站名称、网址和分类：

```bash
npm run content:import-carrot
```

导入结果只会进入人工审核区，不会自动发布。上游描述、图标、排序和风险状态都不会被直接照搬；只有审核并补全本站信息后，候选条目才会进入正式配置。简单说：**可以参考，不能闭眼全收。** 👀

### ⚠️ 外部站点说明

本站仅提供公开网址索引，不存储、上传或分发第三方文件，也不对外部站点的合法性、安全性、准确性或可用性作保证。访问和使用第三方内容前，请自行确认所在地法律、软件许可及版权要求；由此产生的风险由访问者自行承担。

---

## 🇺🇸 English

> “I used that website yesterday. Where did it go?”<br>
> — Everyone with 37 tabs open 😵‍💫

Personal Navigation is a lightweight, static, and configurable directory for everyday websites, AI tools, software resources, and curated game, audio, video, and film/TV catalogs. It gives your bookmarks a home before they evolve into their own ecosystem. 🌱

### ✨ What it does

- 🔎 **Global search** across names, aliases, descriptions, categories, and tags
- 🗂️ **Clear categories** for everyday sites, AI, software, games, audio, video tools, and film/TV resources
- ⭐ **Local favorites** that survive page reloads in the same browser
- 🧩 **YAML-powered content** so adding a site does not require component archaeology
- ⚠️ **Risk-aware links** with permanent warnings and first-visit confirmation for high-risk entries
- 📱 **Responsive layout** for roomy desktops and narrow mobile screens
- 🚀 **Automatic deployment** to GitHub Pages after pushes to `main`

### 🏃 Quick start

```bash
npm install
npm run dev
```

Run the full health check:

```bash
npm run check
```

This runs the dependency audit, content generation, type checking, linting, unit tests, production build, hosting checks, and end-to-end tests. The whole spa day. 🛁

### 🧰 Managing site data

Categories and sites live in `content/categories.yml` and `content/sites/*.yml`. After editing them, run:

```bash
npm run content:build
```

The generator validates HTTPS URLs, duplicate IDs and URLs, category and section references, and field formats before producing the data consumed by the frontend. Bad configuration gets stopped at the door. 🚧

Remove entries confirmed closed, parked for sale, or unrelated when no correct destination can be found. Update a migrated site’s URL while keeping its ID. The current catalog contains no “No stable link” placeholders. Keep links blocked by anti-bot checks, regional restrictions, or access verification as `unchecked`, displayed as “待核验” (pending verification). Use `verified` only after checking that the actual page matches the entry. Reachability (`linkStatus`) and content risk review (`reviewStatus`) are independent; a working link is not a safety endorsement.

### 🎵 Audio resources

`content/sites/audio.yml` contains **130 product records** from the supplied list, organized into eight sections: DAW and DJ; plugin bundles; virtual instruments and samplers; mixing and mastering; vocals and restoration; reverb and creative effects; guitar and bass; drums and rhythm. Audio appears before Video in navigation, with the existing home groups preserved. Brands are tags, and product aliases are searchable.

“清单版本” in descriptions means the version from the supplied list, not a claim about the latest release or continued download availability. Bundles count as one record, and individual products remain separate. Logic Pro uses its official Mac App Store page; five removed detail pages use the corresponding official product pages. KOMPLETE FX Bundle retains a historical XLN Audio URL, but its current page title, developer, and version were checked against KOMPLETE FX.

### 🔗 Checking all links

```bash
npm run links:check
# Optional machine-readable output (without scraped page bodies)
npm run --silent links:check -- --json > links-check.json
```

The checker rate-limits GET requests, inspects HTTPS, redirects, titles, and a bounded body sample, and retries failures once. Results include the final URL, status, and reason. HTTP 200 can still mean a parked domain, soft 404, blank page, or browser challenge. `reachable` means machine-readable content was returned and still needs human review. Recheck abnormal results in a browser before changing the catalog. The command never rewrites YAML and stays outside `npm run check` and deployment tests so external outages cannot break a release.

Latest full audit: **2026-09-06**. Reviewed the original 140 records and 130 supplied products: removed 34 old records, updated or restored 35 old links (30 updates and 5 restorations), and added 130 audio records, leaving **236 total**. **226 are verified and 10 await verification**; pending entries are excluded from the confirmed-working count. These are findings from the audit date, not a guarantee of future uptime.

### 🥕 Importing Carrot data

You can extract public factual fields from the [`xx025/carrot`](https://github.com/xx025/carrot) README:

```bash
npm run content:import-carrot
```

Imported entries are review candidates only and are never published automatically. Upstream descriptions, icons, ordering, and risk labels are not copied. Think of it as an inbox, not an “accept all” button. 📥

### ⚠️ External-site disclaimer

This project only indexes public URLs. It does not store, upload, or distribute third-party files, and it makes no guarantee about the legality, safety, accuracy, or availability of external websites. Before accessing or using third-party content, check the laws, software licenses, and copyright requirements that apply to you. You assume the risks associated with visiting those sites.

---

## Contributors / 贡献者

- [LB21321610](https://github.com/LB21321610) — 项目维护者 / Project maintainer
- **OpenAI Codex（AI 协作 / AI collaboration）** — 链接复核、音频目录整理、代码与测试、文档维护 / Link review, audio catalog, implementation, tests, and documentation

## 📄 License

Released under the [MIT License](LICENSE). Use it, remix it, make it yours — just keep the license notice. 🪄

<div align="center">

**少开一个标签页，多留一点内存。🧠✨**<br>
**One fewer tab, one happier browser.**

[⬆️ 回到顶部 / Back to top](#-个人导航--personal-navigation)

</div>
