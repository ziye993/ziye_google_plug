# ziye_google_plug

个人向 Chrome MV3 工具箱扩展：翻译、搜索精简、二维码、主题注入、中间脚本、代理（DNR）、新标签页搜索 / AI。

版本：**1.0.0**（与 `package.json` / `manifest` 对齐）

## 快速开始

```bash
npm install
npm run build:ext    # 构建并同步到 src_plug/
```

在 Chrome 中加载扩展：

1. 打开 `chrome://extensions`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本仓库的 **`src_plug`** 目录

改 Popup / 新标签页 UI 后重新 `npm run build:ext`，再在扩展页点「重新加载」。  
改 `extension/js/`（background / content）后同样需要 `build:ext`（或至少拷贝 js）并重新加载。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite UI 热更新（非完整扩展环境，`chrome.*` 会降级） |
| `npm run build:ext` | 多入口构建 → 同步 `src_plug` |
| `npm run pack` | 构建并打 `ziye_google_plug.zip` |
| `npm run proxy` | 启动本地 CORS 代理 `:10010`（仅开发可选） |

## 功能概览

| 模块 | 说明 |
|------|------|
| 翻译 | 百度翻译 API；密钥在翻译页「配置 appid」填写；走 Service Worker |
| 搜索精简 | 按站点 URL + CSS 选择器 + 关键词过滤；语法：`*` / `*=null` / `!否定` |
| 二维码 | 文本编码 / 粘贴图片解码 |
| 主题 | URL 匹配注入背景图 + 自定义 CSS |
| 中间脚本 | 按 URL 注入用户脚本（危险，默认单项可关；总开关控制） |
| 代理 | 保存规则后同步 `declarativeNetRequest` 动态规则 |
| 新标签页 | 多引擎搜索 + 历史；设置可保存；配置 AI 接口后显示对话 |

Header **总开关**（`extensionEnabled`）关闭后，content script 不注入主题 / 过滤 / 脚本，并清空 DNR 规则。

## 百度翻译密钥

在 Popup → 翻译 → 点击「配置 appid」填写你的 [百度翻译开放平台](https://fanyi-api.baidu.com/) `appid` / `appkey`。  
密钥保存在 `chrome.storage.local`（`baiduCredentials`），不硬编码进仓库。

## 目录

| 路径 | 作用 |
|------|------|
| `src/` | React 源码（Popup + 新标签页） |
| `extension/js/` | Service Worker / Content Script 源码 |
| `src_plug/` | 可加载的扩展包（构建产物） |
| `src_node/` | 本地 CORS 代理 |
| `manifest.js` | Manifest 唯一真相源 |
| `DEVELOPMENT.md` | 开发与验收文档 |

## 文档

- **[AI_HANDOFF.md](./AI_HANDOFF.md)** — 未完成项 + 给其他 AI 的修复指南（优先读）
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — 历史架构与计划（§4 状态以 AI_HANDOFF 为准）
