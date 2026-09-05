# 个人导航

一个静态、可配置的个人网站导航，包含常用网站、AI 工具以及 Windows、Mac、综合软件资源分类。界面以快速查找为主，支持全局搜索、本地收藏和高风险外链确认。

## 本地运行

```bash
npm install
npm run dev
```

完整验证：

```bash
npm run check
```

## 维护网站数据

网站和分类配置位于：

- `content/categories.yml`
- `content/sites/common.yml`
- `content/sites/ai.yml`
- `content/sites/windows.yml`
- `content/sites/mac.yml`
- `content/sites/cross-platform.yml`

修改后运行 `npm run content:build`。生成器会检查 HTTPS、重复 ID、重复网址、分类引用和字段格式，并生成前端使用的 `src/generated/sites.json`。

## Carrot 数据导入

运行以下命令可从 `xx025/carrot` 的公开 README 提取网站名称、网址和分类：

```bash
npm run content:import-carrot
```

结果写入 `content/imports/carrot.generated.yml`，仅作为人工审核候选，不会自动进入线上导航。站点描述、图标和风险状态需核验后再手动加入正式配置。导入器只对上游当前一条可精确识别、且存在精确有效替代链接的 TheBestTools.ai 重复异常发出警告并继续；其他无效链接或相似异常都会使导入失败，并保留上一次输出。

## 外部站点说明

本站仅提供公开网址索引，不存储、上传或分发第三方文件，也不对外部站点的合法性、安全性、准确性或可用性作保证。高风险分类中的条目均标记为未经验证，首次访问会显示确认提示。

## 部署

推送到 `main` 分支后，`.github/workflows/deploy.yml` 会构建静态文件并发布到 GitHub Pages。
