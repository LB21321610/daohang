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

这是一个静态、轻量、可配置的个人导航站。它把常用网站、AI 工具以及 Windows、Mac、综合软件资源整理到同一个页面里，让浏览器收藏夹暂时停止自由生长。🌱

### ✨ 它会什么

- 🔎 **全局搜索**：按名称、描述、分类或标签快速找站点
- 🗂️ **清晰分类**：常用、AI、Windows、Mac、综合，各回各家
- ⭐ **本地收藏**：收藏保存在浏览器里，刷新也不会失忆
- 🧩 **YAML 配置**：新增网站不用进组件里考古
- ⚠️ **风险提醒**：软件资源始终显示警告，高风险链接首次打开前需要确认
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
    └── cross-platform.yml
```

修改后运行：

```bash
npm run content:build
```

生成器会检查 HTTPS、重复 ID、重复网址、分类引用和字段格式，然后生成前端使用的数据。写错了就立刻报错，不让坏配置悄悄混进页面。🕵️

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

Personal Navigation is a lightweight, static, and configurable directory for everyday websites, AI tools, and Windows, Mac, and cross-platform software resources. It gives your bookmarks a home before they evolve into their own ecosystem. 🌱

### ✨ What it does

- 🔎 **Global search** across names, descriptions, categories, and tags
- 🗂️ **Clear categories** for everyday sites, AI, Windows, Mac, and more
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

The generator validates HTTPS URLs, duplicate IDs and URLs, category references, and field formats before producing the data consumed by the frontend. Bad configuration gets stopped at the door. 🚧

### 🥕 Importing Carrot data

You can extract public factual fields from the [`xx025/carrot`](https://github.com/xx025/carrot) README:

```bash
npm run content:import-carrot
```

Imported entries are review candidates only and are never published automatically. Upstream descriptions, icons, ordering, and risk labels are not copied. Think of it as an inbox, not an “accept all” button. 📥

### ⚠️ External-site disclaimer

This project only indexes public URLs. It does not store, upload, or distribute third-party files, and it makes no guarantee about the legality, safety, accuracy, or availability of external websites. Before accessing or using third-party content, check the laws, software licenses, and copyright requirements that apply to you. You assume the risks associated with visiting those sites.

---

## 📄 License

Released under the [MIT License](LICENSE). Use it, remix it, make it yours — just keep the license notice. 🪄

<div align="center">

**少开一个标签页，多留一点内存。🧠✨**<br>
**One fewer tab, one happier browser.**

[⬆️ 回到顶部 / Back to top](#-个人导航--personal-navigation)

</div>
