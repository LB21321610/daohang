# 个人导航网站实施计划

## 1. 目标与已锁定决策

- 从空仓库新建一个以个人使用为中心、可静态托管的中文导航网站。
- 采用已选视觉方案 1：固定左侧分类栏、顶部搜索、主区分组列表、每行收藏按钮，整体保持白底、低阴影、弱边框和单一蓝色强调色。
- 技术栈固定为 Vite + React + TypeScript；内容通过配置文件维护，不建设登录、数据库、投稿或运营后台。
- 首版部署目标固定为 GitHub Pages；收藏状态和免责声明确认状态只保存在当前浏览器。
- 融合 `xx025/carrot` 时将其视为外部内容来源，而不是前端代码依赖。该仓库只有 README 数据清单和 Issue 模板，没有可复用的应用代码，也没有声明许可证；首版只导入站点名称、URL、所属分类等事实字段，不复制其完整文案、图标或页面设计，并在数据中保留来源链接。
- 纳入用户提供的 29 个 Windows、Mac、跨平台/综合站点。它们以 `unverified` 状态进入配置，并统一标记为需要外链风险提示；站点描述使用用户提供内容的中性改写，不表示推荐、安全认证或合法性背书。

## 2. 产品与交互设计

### 页面结构

- `src/app/App.tsx` 负责单页壳层：桌面端为 224px 固定侧栏加可滚动主区；小于 768px 时侧栏折叠为顶部分类按钮。
- `src/features/navigation/Sidebar.tsx` 显示“常用、AI、Windows、Mac、综合”，底部固定“免责声明”入口；当前分类使用浅蓝背景和蓝色文字。
- `src/features/search/SearchBar.tsx` 固定在主区顶部，搜索框文案为“搜索网站、分类或标签”。输入后仅显示匹配结果；清空后恢复当前分类/首页分组。
- `src/features/sites/SiteSection.tsx` 和 `SiteRow.tsx` 渲染方案 1 的分组与横向列表：本地图标或字母占位、名称、说明、标签、收藏按钮。整行可点击，收藏按钮必须阻止冒泡，避免误开链接。
- 首页默认依次显示“常用”“AI 工具”“软件资源”；切换侧栏后只显示相应分类。收藏站点在“常用”顶部单独显示“我的收藏”。
- 所有外链使用新标签页打开，并带 `target="_blank"`、`rel="noopener noreferrer nofollow"`。

### 搜索与收藏

- `src/domain/search.ts` 对名称、域名、别名、说明、标签和分类执行不区分大小写的本地搜索；排序规则固定为名称精确匹配、名称前缀、域名前缀、其他字段包含。
- 首版不做拼音转换、远程搜索建议、最近访问、账户同步或跨设备收藏。
- `src/features/favorites/favoriteStore.ts` 使用 `localStorage` 键 `personal-nav:favorites:v1` 保存站点 ID 数组；遇到损坏数据时回退为空数组，不阻塞页面加载。

### 免责声明与高风险外链

- “软件资源”标题旁常驻短提示：“外部站点，请自行甄别”。
- `src/features/disclaimer/DisclaimerDialog.tsx` 提供可从侧栏底部打开的完整免责声明：

  > 本站仅提供公开网址索引，不存储、上传或分发第三方文件，也不对外部站点的合法性、安全性、准确性或可用性作保证。访问和使用第三方内容前，请自行确认所在地法律、软件许可及版权要求；由此产生的风险由访问者自行承担。

- `riskLevel: "high"` 的条目首次点击时显示同一对话框，并提供“取消”和“继续访问”。同一浏览器会话确认一次后写入 `sessionStorage` 键 `personal-nav:risk-ack:v1`，会话结束后自动失效。
- 免责声明不得写成“免责即合法”或“站点已验证安全”；UI 中明确用“未验证/外部站点”而不是“推荐/精品/安全”。

## 3. 数据模型与内容融合

### 配置与类型

- `content/categories.yml` 定义分类顺序、中文名称和首页是否展示。
- `content/sites/common.yml` 与 `content/sites/ai.yml` 保存自建常用站点和从 carrot 整理的 AI 站点。
- `content/sites/windows.yml`、`mac.yml`、`cross-platform.yml` 保存用户给出的 29 个软件资源站点。
- `src/domain/site.ts` 定义公共类型：

```ts
export type SiteRiskLevel = "standard" | "external" | "high";
export type SiteReviewStatus = "verified" | "unverified" | "inactive";

export interface SiteSource {
  kind: "manual" | "carrot";
  url?: string;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  domain: string;
  description: string;
  category: "common" | "ai" | "windows" | "mac" | "cross-platform";
  tags: string[];
  aliases?: string[];
  icon?: string;
  featured?: boolean;
  riskLevel: SiteRiskLevel;
  reviewStatus: SiteReviewStatus;
  source: SiteSource;
}
```

- `scripts/build-content.mts` 使用 YAML 解析器和 Zod 在构建前校验配置，规范化 URL/域名、检查重复 ID 和重复 URL，然后生成 `src/generated/sites.json`。任何校验错误都必须使开发或生产构建失败并指出文件与条目 ID。
- 图标仅允许指向 `public/icons/` 下的本地文件；没有本地图标时由 `SiteIcon.tsx` 渲染首字母占位，避免直接热链 carrot 或第三方图标服务器。

### carrot 导入策略

- `scripts/import-carrot.mts` 从固定来源 `https://raw.githubusercontent.com/xx025/carrot/main/README.md` 读取 Markdown 表格，映射其“热门、Agent、对话、绘画、模型、办公、编程、应用、导航站”分类，输出待人工审阅的 `content/imports/carrot.generated.yml`。
- 导入器只保留站点名、URL、原分类和 `source.kind/source.url`；不导入原描述、推广标识、远程图标或推荐排序。
- 合并时按规范化后的 URL 去重；同一站点跨多个 carrot 分类时保留一个主分类，并把其他分类写入 `tags`。
- 对上游当前已知的 TheBestTools.ai 重复异常，仅当分类、站名、无效 `href` 与有效替代 URL 全部精确匹配时，记录警告并采用有效行；任何近似异常仍按解析失败处理。
- 生成文件不直接进入线上数据。人工挑选后复制到 `content/sites/ai.yml` 或 `common.yml`，补写本站自己的简短说明，再通过内容校验。
- README 源不可访问、结构变化或单行解析失败时，导入命令必须失败且不覆盖上一次输出。

### 用户提供站点清单

- Windows（14）：appnee.com、nkino.com、hsuanchen.com、423down.com、massgravel.dev、msguides.com、sanet.st、filecr.com、haxpc.net、cracksurl.com、getintopc.com、igetintopc.com、kubadownload.com、yasir252.com。
- Mac（9）：macwk.com、macked.app、appstorrent.ru、macserial.com、mac-torrent-download.net、cmacapps.com、njhax.com、macdownload.org、tntmac.com。
- 跨平台/综合（6）：nsaneforums.com、team-os.eu、ru-board.com、crackhub.site、predb.org、srrdb.com。
- 上述条目首版统一设置 `riskLevel: "high"`、`reviewStatus: "unverified"`、`source.kind: "manual"`，不在首页“常用”或推荐排序中自动置顶。

## 4. 实施步骤

1. **项目骨架与质量门禁**
   - 创建 Vite React TypeScript 项目，配置 ESLint、Prettier、Vitest、React Testing Library 和 Playwright。
   - 在 `package.json` 固定 `content:build`、`dev`、`typecheck`、`lint`、`test`、`build`、`test:e2e` 命令；`dev` 和 `build` 均先运行内容生成。
   - 配置 `vite.config.ts` 的 GitHub Pages base path，并在 `.github/workflows/deploy.yml` 中只在全部校验通过后发布 `dist/`。

2. **建立内容管线**
   - 创建分类与站点 YAML、Site/Zod schema、内容生成器和重复检查。
   - 录入 29 个用户站点并确认数量分别为 14、9、6；为每个条目生成稳定 kebab-case ID。
   - 实现 carrot 导入器和人工审阅区，完成一次导入演练但不自动发布全部上游内容。

3. **实现方案 1 UI**
   - 按参考图建立设计 token：白色主背景、`#111827` 主文字、`#6B7280` 次文字、`#2563EB` 强调色、`#E5E7EB` 分隔线、8px 控件圆角。
   - 完成响应式壳层、侧栏、顶部搜索、分组列表、站点行、图标占位和空状态。
   - 桌面端保持列表信息密度；移动端隐藏说明列，只保留名称、域名/标签和收藏动作。

4. **实现交互与风险提示**
   - 接入搜索排序、分类筛选和空结果提示。
   - 接入收藏持久化并验证刷新后保持。
   - 接入免责声明入口、高风险链接首次确认和会话级确认状态；取消时不得创建新窗口。

5. **验证与发布**
   - 运行内容校验、单元测试、组件测试、类型检查、lint、生产构建和 Playwright E2E。
   - 用桌面 1440×1024 和移动 390×844 两个视口做视觉核对，确认无横向滚动、文字截断或按钮重叠。
   - 部署到 GitHub Pages 后，从干净浏览器状态走完整旅程：打开首页、搜索 ChatGPT、收藏站点、刷新确认收藏、切换 Windows、触发高风险确认、取消、再次确认并打开外链。

## 5. 验收标准

- 首页布局与方案 1 一致：左侧分类、顶部搜索、三组内容、行级收藏；1440×1024 下主内容无横向滚动。
- 站点配置构建后恰好包含 29 个用户新增条目，Windows/Mac/跨平台数量分别为 14/9/6，且每项 URL 唯一、ID 唯一、URL 协议为 HTTPS。
- carrot 导入器可从当前 README 提取 9 个上游分类；不会导入原始图标、完整描述或推广排序，重复 URL 被合并。
- 搜索“chatgpt”、`github.com`、`windows` 或任一站点标签都能返回相应条目；清空搜索恢复当前分类。
- 点击收藏不会打开网站；刷新页面后收藏仍存在；损坏的 localStorage 数据不会导致白屏。
- 点击普通站点直接在新标签页打开；点击任一高风险站点首次出现免责声明，取消不打开链接，继续后打开链接；同一会话后续点击不重复弹窗，新会话重新提示。
- “免责声明”始终可从侧栏/移动端菜单访问，“软件资源”标题始终显示“外部站点，请自行甄别”。
- `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build` 和 `npm run test:e2e` 全部以退出码 0 完成；GitHub Pages 部署仅在这些门禁通过后执行。

## 6. 风险与缓解

- **上游授权不明确**：carrot 未声明许可证。仅导入事实字段、保留来源、不复制文案/图标/视觉，未来取得明确授权后再扩大复用范围。
- **外链可能侵权、恶意或失效**：29 个条目默认标记为未验证和高风险，不作推荐；通过免责声明、首次点击确认和本地风险状态降低误触，但免责声明不替代人工合规审核。
- **上游 README 格式不稳定**：解析器以结构校验和原子输出保护现有数据，解析异常时立即失败，不静默生成空清单。
- **远程站点影响隐私或性能**：页面初始渲染不请求站点内容或远程 favicon，只有用户主动打开外链时才访问第三方域名。
- **静态托管路径错误**：在 GitHub Pages workflow 中用实际仓库名注入 Vite base，并用部署后的真实 URL做一次冷启动检查。

## 7. 明确不做

- 首版不做账号、云同步、后台 CMS、公开投稿、广告、排行榜、评论、自动访问/扫描高风险站点、在线可用性检测或内容下载。
- 首版不声称外链“安全、合法、无毒、稳定”，也不自动继承 carrot 的推荐、推广或免费标记。

## 8. 停止条件

当线上静态站点可从干净浏览器完成全部验收旅程、五项质量命令全部通过、29 个新增条目数量和风险标记核对无误，并且 carrot 导入结果可重复生成且不会直接发布未审内容时，首版任务完成。
