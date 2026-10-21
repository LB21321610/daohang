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

于是就有了这个导航站。它是一个静态、轻量、能用 YAML 配置的个人导航页，把常用网站、AI 工具、软件资源，还有游戏、音频、视频、影视目录，外加一整栏 1355 个 Mac 好软件，都塞进同一页。收藏夹终于可以退休了，感谢它这些年的混乱付出。🫡

### ✨ 它能干啥

- 🔎 **全局搜索**：名称、别名、描述、分类、标签都能搜，命中的字还会高亮。记不住全名？搜两个字也行
- ⌨️ **键盘党福利**：按 `/` 或 `Ctrl/⌘ + K` 直接聚焦搜索，`Esc` 一键清空。鼠标：那我走？🐭
- 🗂️ **分类清楚**：常用、AI、软件、游戏、音频、视频、影视、Awesome Mac，各回各家，各找各妈
- 🍏 **Awesome Mac 专栏**：把 GitHub 上的 [jaywcjlove/awesome-mac](https://github.com/jaywcjlove/awesome-mac) 整栏搬进来，1355 个 Mac 应用、25 个大类，大类里还按上游的小标题分好组。Mac 用户的“装机必备”，一页刷完
- 🧭 **小节跳转栏**：分类太长？点一下直接飞过去。切到别的分类会自动回到顶部，不会把你卡在半山腰 🏔️
- ⭐ **本地收藏**：存在你自己的浏览器里，刷新不失忆（清缓存的话……那就失忆了，节哀 🕯️）
- 🌙 **深色模式**：跟着系统走，半夜打开不闪瞎
- 🫧 **玻璃质感**：侧栏、顶栏带一层毛玻璃。系统开了“减少透明度”或“减少动态效果”，它就老老实实变回实心
- 🧩 **YAML 配置**：加网站改配置就行，不用去组件里考古 ⛏️
- ⚠️ **风险提醒**：高风险资源一直挂着警告，第一次打开前要你点头确认
- 📱 **响应式布局**：电脑上舒展，手机上也不横着跑。一千多行的长列表也不卡，屏幕外的行先不画，滚到了再说 🦥
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
    ├── media.yml
    └── awesome-mac.yml 👈 导入脚本生成的，别手改
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
- Logic Pro 指向 Appstorrent 详情页；5 个已经下架的详情页换成了对应产品官网
- KOMPLETE FX Bundle 的网址看着像 XLN Audio 的历史链接，别慌，已经核对过页面标题、开发者和版本，确实是 KOMPLETE FX 👌

### 🍏 Awesome Mac 专栏

数据来自 [`jaywcjlove/awesome-mac`](https://github.com/jaywcjlove/awesome-mac)（⭐ 上万的 Mac 软件清单），按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh-hans) 协议署名引用，栏目顶部也挂着出处。感谢原作者和几百位贡献者，你们把 Mac 软件圈翻了个底朝天，我们只是搬了个家 🚚🙏

想跟上游同步一下：

```bash
npm run content:import-awesome-mac
# 已经下载好 README 的话，也可以离线导入
npm run content:import-awesome-mac -- --from 某个目录
```

导入脚本会读上游的英文 README 和中文 README：

- 📚 **分组**：上游 25 个大类 → 本站 25 个小节（阅读与写作、开发者工具、实用工具……），大类里的小标题（剪贴板、窗口管理、菜单栏……）在浏览时显示成小分组，也能直接搜
- 🀄 **中文描述**：优先用上游中文 README 的描述，没有的话用 `content/awesome-mac/descriptions.zh.yml` 里手写的翻译，一条英文都不剩
- 🏷️ **标签**：开源、免费、App Store、原生应用这些徽章变成标签，搜“开源”就能捞出一大把
- 🚫 **盗版黑名单**：上游自己列的盗版站黑名单，一条都不导入
- 👯 **去重**：同一个应用在上游出现多次只留一条；已经在本站其他栏目的网址（比如 Kodi、Motrix）不重复收录
- 🆕 **新面孔**：上游新增的应用默认标“待核验”，核验过才转正。上游改了大类名，脚本会直接报错，不会偷偷丢数据

📅 链接全量核验：**2026-10-21**

| 项目 | 数量 |
| --- | --- |
| 上游条目 | 1390（去掉同一应用重复后 1381） |
| 👯 和本站其他栏目重复，不收录 | 6 |
| 🗑️ 删除 | **20**（域名被劫持到博彩站、关站跳首页、证书失效、仓库已删等） |
| 🚚 换地址 | **12**（官网搬家，或官网挂了改指向开源仓库） |
| 📦 最终收录 | **1355** |
| ✅ 已核验 | **1268** |
| ⏳ 待核验 | **87**（Cloudflare 人机验证、App Store 在核验地区打不开之类，不代表坏了） |
| ⚠️ 高风险提醒 | 1（Popcorn Time，版权风险，点之前会弹确认） |

删了谁、为什么删、搬到哪，都记在 `content/awesome-mac/link-audit.yml`，每条都有理由，不搞暗箱操作 🕵️。最离谱的一个：某个调色预设网站的域名已经被拿去开赌场了 🎰，果断拉黑。

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

这是核验当天的结果，外站明天在不在，谁也说不准。🤷 Awesome Mac 专栏另算，见上面那张表。

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

So I built this. It's a static, lightweight, YAML-configured start page for everyday sites, AI tools, software, curated game, audio, video, and film/TV catalogs, plus a whole column of 1,355 great Mac apps. My bookmarks folder has been honorably retired. Thank you for your service. 🫡

### ✨ What it does

- 🔎 **Global search** across names, aliases, descriptions, categories, and tags, with matches highlighted. Two letters is usually enough
- ⌨️ **Keyboard friendly**: `/` or `Ctrl/⌘ + K` jumps to search, `Esc` clears it. Your mouse can take a nap 🐭💤
- 🗂️ **Tidy categories**: everyday, AI, software, games, audio, video, film/TV, Awesome Mac. Everything has a home
- 🍏 **Awesome Mac column**: the entire [jaywcjlove/awesome-mac](https://github.com/jaywcjlove/awesome-mac) list moved in: 1,355 Mac apps in 25 sections, grouped by the upstream sub-headings. A fresh Mac setup, one page
- 🧭 **Section jump bar** for long categories. Switching category takes you back to the top instead of leaving you stranded halfway down 🏔️
- ⭐ **Local favorites** saved in your browser. They survive reloads (they do not survive you clearing site data, RIP 🕯️)
- 🌙 **Dark mode** that follows your system, so 2 a.m. browsing won't sear your eyeballs
- 🫧 **Frosted glass** on the sidebar and top bar, which turns solid again if you ask for reduced transparency or reduced motion
- 🧩 **YAML-powered content**: adding a site is a config change, not an archaeology dig ⛏️
- ⚠️ **Risk-aware links**: high-risk entries always show a warning and ask before your first visit
- 📱 **Responsive**: roomy on desktop, no sideways scrolling on your phone. Thousand-row lists stay smooth because off-screen rows are skipped until you scroll to them 🦥
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

Categories live in `content/categories.yml`, sites live in `content/sites/*.yml` (except `awesome-mac.yml`, which the importer writes for you, so hands off). After editing, run:

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
- Logic Pro points to its Appstorrent detail page; five removed detail pages now point to the official product pages
- KOMPLETE FX Bundle still uses an old XLN Audio URL. Don't panic: page title, developer, and version were all checked and it really is KOMPLETE FX 👌

### 🍏 Awesome Mac column

The data comes from [`jaywcjlove/awesome-mac`](https://github.com/jaywcjlove/awesome-mac) and is used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) with credit shown at the top of the column. Huge thanks to the author and hundreds of contributors who did the hard part. We just hired the moving truck 🚚🙏

To sync with upstream:

```bash
npm run content:import-awesome-mac
# Or import offline from READMEs you already downloaded
npm run content:import-awesome-mac -- --from some/folder
```

The importer reads both the English and Chinese upstream READMEs:

- 📚 **Sections**: the 25 upstream categories become 25 sections; sub-headings (Clipboard, Window Management, Menu Bar…) show up as small groups while browsing and are searchable
- 🀄 **Chinese descriptions**: taken from the upstream Chinese README first, then from hand-written translations in `content/awesome-mac/descriptions.zh.yml`. Zero English leftovers
- 🏷️ **Tags**: open-source, freeware, App Store, and native-app badges become tags, so searching “开源” (open source) finds a pile of them
- 🚫 **Piracy blocklist**: upstream's own list of pirate sites is never imported
- 👯 **Dedupe**: apps listed twice upstream appear once; URLs already elsewhere on this site (Kodi, Motrix…) aren't duplicated
- 🆕 **New arrivals** start as “待核验” (pending verification). If upstream renames a category, the importer fails loudly instead of quietly dropping data

📅 Full link audit: **2026-10-21**

| What | Count |
| --- | --- |
| Upstream entries | 1,390 (1,381 after merging repeats) |
| 👯 Already elsewhere on this site, skipped | 6 |
| 🗑️ Removed | **20** (domain hijacked by a casino, shut down and redirecting home, broken certificates, deleted repos…) |
| 🚚 Moved | **12** (site relocated, or dead homepage swapped for the open-source repo) |
| 📦 Published | **1,355** |
| ✅ Verified | **1,268** |
| ⏳ Pending verification | **87** (Cloudflare checks, App Store pages unavailable from the audit region, etc. Not necessarily broken) |
| ⚠️ High-risk warning | 1 (Popcorn Time, copyright risk, asks before opening) |

Every removal, move, and reason lives in `content/awesome-mac/link-audit.yml`. No secret deletions 🕵️. Best find: a color-preset site whose domain now runs an online casino 🎰. Blocked with prejudice.

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

That's how things looked on audit day. Whether those sites are still alive tomorrow is between them and their hosting bill. 🤷 The Awesome Mac column has its own audit table above.

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
- 🤖 **[Claude](https://claude.ai/code)（Anthropic，AI 协作 / AI collaboration）** — 玻璃质感界面、切换分类自动回到顶部的修复、Awesome Mac 专栏（导入脚本、1390 条链接核验、300 条中文翻译、长列表提速）、测试，以及这份话变多了的 README / Liquid Glass UI, the scroll-to-top fix, the Awesome Mac column (importer, 1,390-link audit, 300 Chinese translations, long-list speedups), tests, and this chattier README
- 🍏 **[jaywcjlove/awesome-mac](https://github.com/jaywcjlove/awesome-mac) 及其贡献者** — Awesome Mac 专栏的数据来源（CC BY 4.0）/ Source of the Awesome Mac column (CC BY 4.0)

人类负责有想法，AI 负责不睡觉。合作愉快。🤝<br>
Humans bring the ideas, AIs skip the sleep. Great teamwork. 🤝

## 📄 License

[MIT License](LICENSE)。随便用、随便改、改成你自己的，记得保留许可证声明就行。🪄 Awesome Mac 专栏的数据另按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.zh-hans) 署名引用自 jaywcjlove/awesome-mac。<br>
Released under the [MIT License](LICENSE). Use it, remix it, make it yours, just keep the license notice. 🪄 The Awesome Mac column's data is used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) with credit to jaywcjlove/awesome-mac.

<div align="center">

**少开一个标签页，多留一点内存。🧠✨**<br>
**One fewer tab, one happier laptop fan.** 🌬️

[⬆️ 回到顶部 / Back to top](#-kx导航站--personal-navigation)

</div>
