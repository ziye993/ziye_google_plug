# ziye_google_plug 开发文档

> 目标：把当前半成品 MV3 工具箱扩展，做到**可本地加载、功能闭环、可维护构建**。  
> 日期：2026-07-21｜当前版本：`package.json 0.0.0` / `src_plug/manifest.json 1.0.0`

---

## 1. 产品定位

个人向 Chrome 扩展「ZIYE 工具箱」，在 Popup 与新标签页中提供：

| 模块 | 能力 |
|------|------|
| 翻译 | 百度翻译 API，命名格式转换，一键复制 |
| 搜索精简 | 按站点 URL + CSS 选择器 + 关键词过滤搜索结果 |
| 二维码 | 文本编码 / 粘贴图片解码 |
| 主题 | 按 URL 匹配注入背景图 + 自定义 CSS |
| 中间脚本 | 按 URL 注入用户脚本（**未完成**） |
| 代理 | 基于 declarativeNetRequest / proxy 的规则（**仅 UI**） |
| 新标签页 | 多引擎搜索入口 + 历史 + AI 对话（**部分 stub**） |

配套：`src_node/main.cjs` 本地 CORS 代理（`:10010`），供跨域调试。

---

## 2. 仓库结构

```
ziye_google_plug/
├── src/                    # React 源码（Popup / 共用组件）
├── src_plug/               # 可加载的扩展包（当前手工产物）
│   ├── manifest.json       # 实际生效的 MV3 清单
│   ├── js/                 # service-worker / content-script
│   ├── page/expand/        # Popup 构建产物
│   └── page/newTabs/       # 新标签页构建产物
├── src_node/               # Express 本地代理
├── manifest.js             # Vite 插件生成源（已过期，与 src_plug 不一致）
├── vite.config.js
└── DEVELOPMENT.md          # 本文档
```

**核心矛盾：** 开发在 `src/`，加载在 `src_plug/`，缺少自动化打包链路，两边容易脱节。

---

## 3. 技术栈

| 层 | 选型 |
|----|------|
| Manifest | Chrome Extension MV3 |
| UI | React 19 + Ant Design 5 |
| 构建 | Vite 7 |
| 编辑器 | monaco-editor（CSS / JS） |
| 存储 | `chrome.storage.local` + IndexedDB（主题图） |
| 翻译 | 百度翻译 VIP API + `js-md5` |
| 二维码 | antd `QRCode` + `jsqr` |

脚本现状：仅有 `dev` / `build` / `lint` / `preview`，**没有**扩展专用构建、代理启动、打包 zip 命令。

---

## 4. 功能现状矩阵

> **注意（2026-07-21 实查）：** 下方曾误标为全完成。真实未完成项与修复步骤见 **[AI_HANDOFF.md](./AI_HANDOFF.md)**（给后续 AI 的交接文档）。

图例：✅ 可用｜⚠️ 半成品 / 有坑｜❌ 未接线 / 不可用

| 功能 | UI | 持久化 | 运行时 | 状态 | 说明 |
|------|----|--------|--------|------|------|
| 翻译 | ✅ | ✅ | ✅ | ✅ | 需自备百度密钥；走 SW |
| 搜索精简 | ✅ | ✅ | ⚠️ | ❌ | 默认未 checked；多数站点无 boxName，开箱无效 |
| 二维码 | ✅ | ✅ | — | ✅ | 基本可用 |
| 主题 | ✅ | ⚠️ | ❌ | ❌ | 上传不入库、取消删 IDB、`:` 拆 URL、纯 CSS 不生效 |
| 中间脚本 | ✅ | ✅ | ⚠️ | ⚠️ | 能存；DOM 注入怕 CSP；默认启用 |
| 代理 | ✅ | ✅ | ⚠️ | ⚠️ | 简单 DNR 可同步；mock/modifyHeaders/proxyHost 是假的 |
| 新标签搜索 | ✅ | ✅ | ✅ | ⚠️ | 搜索可用；AI 入口几乎总亮、依赖本地服务 |
| AI 对话 | ✅ | ✅ | ⚠️ | ⚠️ | 需自备接口 |
| 全局开关 | ✅ | ✅ | ✅ | ✅ | 控 CS + DNR |
| 本地代理 | — | — | ✅ | ✅ | `npm run proxy`，与扩展 DNR 未联动 |

---

## 5. 已知缺陷（优先修复）

### P0 — 阻断 / 崩溃

1. **Service Worker 翻译 handler 引用未定义变量**  
   文件：`src_plug/js/service-worker.js`  
   `getTranlateData` 内使用 `request.query`，应为 `message.query`（或统一参数名）。  
   影响：走 SW 的翻译路径必挂。

2. **主题 Content Script 空指针**  
   文件：`src_plug/js/content-script.js`  
   - `themeList.find(_ => _.used)` 可能为 `undefined`，仍访问 `used.targetUrl`。  
   - `beforeunload` 中 `querySelector('#demo-background')` 可能为 `null` 仍设 style；且 `loading.gif` 很可能不存在。

3. **构建产物与源码脱节**  
   - `vite build` 输出到 `dist/`，**不更新** `src_plug/`。  
   - 根目录 `manifest.js` / `manifest.json` 名称仍为 `demo`，路径指向不存在的 `js/content.js`、`./build/index.html` 等。  
   - 加载扩展必须以 `src_plug` 为准，但改 `src/` 后无法一键同步。

### P1 — 功能残缺

4. **AgentScript**：`onOK` 只 `console.log`，保存代码被注释；列表不更新。  
5. **AgentBar**：只存规则，从未调用 `chrome.declarativeNetRequest` / `chrome.proxy`。  
6. **Search 新标签页**：`App.jsx` 中 Search 被注释；需独立入口（`newtab.html`）而非塞进 Popup。  
7. **`isURLorIP`**（`src/lib/url.js`）：永远 `return true`。  
8. **翻译设置面板**：`showSetting` 从未打开；设置入口无点击。  
9. **Header 总开关**：无 `checked` / `onChange`，应控制扩展全局启用（主题 / 过滤 / 脚本）。  
10. **百度密钥硬编码**：`Translate/index.jsx`、`tranlApi.js`，需迁到设置页 + storage。

### P2 — 质量与合规

11. **权限过大**：`bookmarks` / `cookies` / `proxy` / `webRequest` / DNR 等多数未使用，商店审核与用户信任风险高。  
12. **图标不完整**：缺规范 16/48/128；`icon.png` 为占位黑图。  
13. **命名与拼写**：`storege`、`tranlApi`、`defaultSeachTool`、`therJobo`、`agentPageDate` 等，建议分批纠正并做 storage key 迁移。  
14. **生产日志过多**：`console.log` 散落业务路径。  
15. **README** 仍是 Vite 模板，无安装说明。  
16. **无测试**；`dist/` 未进 ignore（`.gitignore` 中被注释）。

---

## 6. 目标架构（完善后）

```
                    ┌─────────────────────┐
                    │  chrome.storage     │
                    │  IndexedDB(theme)   │
                    └──────────▲──────────┘
                               │
     ┌─────────────────────────┼─────────────────────────┐
     │                         │                         │
┌────┴────┐            ┌───────┴───────┐          ┌──────┴──────┐
│ Popup   │            │ Service       │          │ New Tab     │
│ expand  │◄─message──►│ Worker        │◄─message─│ newTabs     │
│ (React) │            │ 翻译/主题/规则 │          │ (React)     │
└────┬────┘            └───────┬───────┘          └─────────────┘
     │                         │
     │                   ┌─────┴─────┐
     │                   │ Content   │
     └──── config ──────►│ Script    │
                         │ 主题/过滤 │
                         │ 脚本注入  │
                         └───────────┘
```

**构建目标：**

```
vite multi-page
  ├── popup   → src_plug/page/expand/
  ├── newtab  → src_plug/page/newTabs/
  └── copy    → js/*.js, assets/*, manifest.json
npm run build:ext  → 可直接「加载已解压的扩展程序」指向 src_plug
```

---

## 7. 分阶段开发计划

### 阶段 0：工程基建（约 1–2 天）— 必须先做

**目标：** 改代码 → 一键构建 → Chrome 加载验证。

| 任务 | 验收标准 |
|------|----------|
| 统一 Manifest 单一源 | 仅维护一份（建议 `manifest.js` 或 `src_plug/manifest.json`），Vite 插件写出到 `src_plug/manifest.json`；删除过期根目录 demo 路径 |
| Vite 多入口 | `popup` + `newtab` 两个 HTML 入口，`base: './'`，产物进 `src_plug/page/...` |
| 拷贝静态脚本 | `service-worker.js` / `content-script.js` / icons 纳入构建或 `public` 同步 |
| npm scripts | `build:ext`、`dev:popup`、`proxy`（启动 `src_node`） |
| 更新 README | 安装步骤：`chrome://extensions` → 开发者模式 → 加载 `src_plug` |
| 版本对齐 | `package.json` / manifest / UI 展示版本一致 |

**建议 scripts：**

```json
{
  "dev": "vite",
  "build:ext": "vite build && node scripts/copy-extension.mjs",
  "proxy": "node src_node/main.cjs",
  "lint": "eslint ."
}
```

---

### 阶段 1：稳定性修复（约 1 天）

| # | 任务 | 文件 | 验收 |
|---|------|------|------|
| 1.1 | 修复 SW `request` → `message` | `service-worker.js` | 消息 `action: translate` 返回成功 |
| 1.2 | 主题列表无 `used` 时安全返回 | `content-script.js` | 无主题不报错 |
| 1.3 | `beforeunload` 空节点守卫；去掉无效 loading.gif 或补资源 | 同上 | 刷新/关闭无异常 |
| 1.4 | 恢复 / 统一 `isURLorIP` | `src/lib/url.js` | 非法 URL 表单校验失败 |
| 1.5 | SearchSimplifyBar 状态更新回归 | `SearchSimplifyBar` | 增删改规则后 storage 与 UI 一致 |
| 1.6 | Header 总开关接通 | `layoutHeader` + storage `extensionEnabled` | 关闭后 content 不注入主题/过滤 |

---

### 阶段 2：核心功能闭环（约 3–5 天）

#### 2.1 翻译（完善）

- [ ] 密钥改为「设置」中配置，写入 `chrome.storage.local`（字段如 `baiduAppId` / `baiduAppKey`）
- [ ] 接通设置面板（SettingOutlined 打开抽屉）
- [ ] 统一走 SW fetch（避免 CSP / CORS 差异），Popup 只发消息
- [ ] 错误提示：额度不足 / 密钥错误 / 网络失败
- [ ] 可选：语言列表来自 `languages.ts` 的完整选择器

#### 2.2 搜索精简（加固）

- [ ] 文档化过滤语法：`*`、`*=null`、`!否定`
- [ ] Content script 在 SPA 路由变化时稳定重跑（已有部分逻辑，需测 Google/Bing/Baidu）
- [ ] 仅在匹配到配置 URL 的页面执行过滤，降低 `<all_urls>` 副作用
- [ ] 修复 `setData` 双重 updater 类问题（若仍存在）

#### 2.3 主题（加固）

- [ ] IndexedDB 读写职责清晰：Popup 写、SW 读（或统一一层 API）
- [ ] 启用/禁用、排序、预览
- [ ] `web_accessible_resources` 与真实资源对齐
- [ ] 取反匹配逻辑单测或手工用例表

#### 2.4 二维码（小改）

- [ ] 历史记录可选持久化到 `chrome.storage`
- [ ] 失败态文案（非 QR 图片、跨域 canvas 等）

#### 2.5 新标签页 Search

- [ ] 独立入口构建，**不要**与 Popup 共用同一个 `App` 默认导出互相注释
- [ ] SettingModal：`saveConfig` 真正写入；删除历史可用
- [ ] AI：要么接真实后端并展示回复，要么隐藏入口（避免半残 UI）
- [ ] 引擎探测失败时的降级（默认 Bing/百度）

---

### 阶段 3：代理与中间脚本（约 3–4 天）

> 二选一策略：**做完或砍掉 UI + 权限**。半残 UI + 大权限不可接受。

#### 方案 A（推荐实现）— 代理用 DNR

1. 规则模型对齐 `declarativeNetRequest.Rule`（已有 `AgentBar/enum.js` 可复用）。  
2. 保存时调用 `chrome.declarativeNetRequest.updateDynamicRules`。  
3. 扩展重载 / 开关变更时同步规则。  
4. 提供「导出 / 导入规则 JSON」。  
5. 若只需简单重定向，可不申请 `proxy`；用不到则从 manifest 删除。

#### 方案 B — 中间脚本

1. 持久化 `agentScriptData`：`{ id, name, url, invert, script, enabled }`。  
2. Content script：URL 匹配后 `chrome.scripting.executeScript` **或** 以隔离世界 eval 注入（注意 MV3 限制：优先 `scripting` + 用户确认）。  
3. 危险脚本警告文案；默认关闭。  
4. 与总开关联动。

**权限清理建议（实现后按实际保留）：**

| 权限 | 条件 |
|------|------|
| `storage` / `unlimitedStorage` | 保留 |
| `tabs` / `webNavigation` | 若需监听导航保留 |
| `declarativeNetRequest*` | 仅代理实现后保留 |
| `proxy` | 仅真正用 chrome.proxy 时保留 |
| `bookmarks` / `cookies` / `webRequest` | 无功能则删除 |
| `host_permissions` | 尽量收窄；内容脚本可按用户配置动态 `scripting.registerContentScripts` |

---

### 阶段 4：体验与发布准备（约 2 天）

- [ ] 图标 16 / 48 / 128；Store 用 128  
- [ ] Popup 尺寸与滚动体验；Footer 显示版本号  
- [ ] 去掉调试 `console.log` 或包一层 debug flag  
- [ ] `_locales`（至少 `zh_CN` / `en`）可选  
- [ ] `privacy.md`：说明存储内容、翻译 API、无上传用户网页内容（若属实）  
- [ ] `npm run pack` 打 zip 供上架 / 分发  
- [ ] 手工验收清单（见 §9）

---

## 8. 模块开发细则

### 8.1 存储 Key 约定（建议统一后迁移）

| Key | 用途 | 现状名（若不同） |
|-----|------|------------------|
| `extensionEnabled` | 全局开关 | 无 |
| `tranlPageData` | 翻译页状态 | 已有 |
| `baiduCredentials` | `{ appId, appKey }` | 硬编码 |
| `defaultSearchTool` | 搜索精简规则 | `defaultSeachTool` |
| `themeData` | 主题列表 | 已有 |
| `agentPageData` | 代理规则 | `agentPageDate` |
| `agentScriptData` | 用户脚本 | 未落库 |
| `qrcodePrefs` | 二维码偏好 | `qrcodeUrl` localStorage |

迁移策略：读取时兼容旧 key，写入新 key，下个大版本删除旧 key。

### 8.2 消息协议（SW）

```ts
// Popup / Content → SW
{ action: 'translate', query: string }           // query 为完整 API URL 或结构化参数
{ action: 'GET_THEME_DATA', data: string }     // IndexedDB id，如 img_xxx
{ action: 'SYNC_DNR_RULES' }                   // 阶段 3 新增
{ action: 'GET_EXTENSION_ENABLED' }

// SW → 响应
{ success: boolean, data?: unknown, error?: string }
```

异步消息必须 `return true`（已有）。

### 8.3 Content Script 职责边界

1. 读取 `extensionEnabled`，为 false 则退出。  
2. 应用主题（背景 + CSS）。  
3. 应用搜索过滤。  
4. 匹配并注入用户脚本（阶段 3）。  
5. **不做**网络请求到第三方翻译 API（交给 SW）。

### 8.4 本地代理 `src_node`

- 用途：开发期绕过 CORS 探测 / 调试。  
- 生产扩展**不应**依赖 `localhost:10010`。  
- README 标明：仅开发可选。

### 8.5 Monaco 在扩展中的注意点

- Worker 路径在 `chrome-extension://` 下易坏；已有 Blob worker 方案需在正式构建产物中验证。  
- 若 Popup 体积过大，考虑主题/脚本编辑改为 Options 全页。

---

## 9. 验收清单（Definition of Done）

### 工程

- [x] `npm run build:ext` 后，Chrome 加载 `src_plug` 无报错  
- [x] 修改 Popup 文案 → 重建 → 扩展界面更新  
- [x] Manifest 仅一份真相源（`manifest.js`）

### 功能

- [x] 翻译：配置密钥后英↔中可用；复制命名格式正确  
- [x] 搜索精简：在配置站点结果被隐藏；关闭规则或总开关后恢复  
- [x] 主题：匹配 URL 出现背景/CSS；不匹配无影响；无主题不崩  
- [x] 二维码：编码解码双向可用  
- [x] 新标签：搜索跳转 + 历史；设置可保存  
- [x] 代理：DNR 动态规则 + 导入/导出  
- [x] 脚本：持久化 + 注入 + 总开关联动  

### 质量

- [x] 无硬编码密钥提交（`.env.example` 说明自备）  
- [ ] 未使用权限已删除（个人向：按用户要求保留全部权限）  
- [x] README 可按文档装上扩展  

---

## 10. 推荐实施顺序（最短路径）

```
阶段0 构建统一
  → 阶段1 P0/P1 崩溃与开关
  → 阶段2.1 翻译设置化 + SW
  → 阶段2.2 / 2.3 搜索与主题回归
  → 阶段2.5 新标签独立入口
  → 阶段3 代理 XOR 脚本（先定范围再写）
  → 阶段4 图标/权限/文档/打包
```

**明确不做（除非另开需求）：**

- DevTools 页（根 manifest 曾声明但无页面）  
- 书签 / Cookie 相关能力  
- 完整 i18n 首期可不做  
- 商店上架素材可放最后  

---

## 11. 本地开发速查

```bash
# 依赖
npm install

# 仅 UI 热更新（非扩展环境，chrome.* 需 mock 或降级 localStorage）
npm run dev

# 构建扩展包（阶段 0 落地后）
npm run build:ext

# 可选：本地代理
npm run proxy
```

Chrome：`chrome://extensions` → 开发者模式 → **加载已解压的扩展程序** → 选 `src_plug`。  
改 background / content 后需点「重新加载」。

---

## 12. 风险与决策记录

| 决策点 | 选项 | 建议 |
|--------|------|------|
| 代理实现 | DNR vs chrome.proxy vs 砍掉 | 优先 DNR；做不到就砍 UI |
| 用户脚本 | scripting API vs 内嵌 | MV3 用 `scripting`；默认关 |
| 翻译密钥 | 用户自备 vs 作者共享 | 用户自备，设置页填写 |
| Content 匹配范围 | `<all_urls>` vs 动态注册 | 中期改为按用户规则动态注册 |
| Monaco | 留 Popup vs Options 页 | 体积过大则迁 Options |

---

## 13. 文档维护

- 功能完成一项，更新 §4 状态矩阵与 §9 勾选。  
- Breaking change（storage key / 消息协议）记在本节 changelog。  

### Changelog

| 日期 | 说明 |
|------|------|
| 2026-07-21 | 初版：基于现状盘点，给出分阶段完善计划 |
| 2026-07-21 | 阶段 0–4 曾落地一批能力；同日实查发现主题等仍未完成 → 详见 **AI_HANDOFF.md** |

---

## 附录 A：关键源码索引

| 路径 | 说明 |
|------|------|
| `src/App.jsx` | Popup 壳 |
| `src/newtab.jsx` | 新标签页入口 |
| `extension/js/service-worker.js` | 后台源码（翻译 / DNR / 主题） |
| `extension/js/content-script.js` | 主题 + 过滤 + 脚本注入 |
| `manifest.js` | Manifest 真相源 |
| `src/components/Translate/` | 翻译 |
| `src/components/SearchSimplifyBar/` | 搜索精简 |
| `src/components/QrCodeTranslate/` | 二维码 |
| `src/components/ThemeBar/` | 主题 |
| `src/components/AgentBar/` | 代理 + DNR |
| `src/components/AgentScript/` | 用户脚本 |
| `src/components/Search/` | 新标签页 |
| `src/lib/storege.js` | 存储 + IndexedDB |
| `src/lib/tranlApi.js` | 百度签名与请求 |
| `src_node/main.cjs` | 本地代理 |

## 附录 B：与典型扩展完整度对照

| 项 | 现状 |
|----|------|
| Popup | 有 |
| Options | 无（建议阶段 2 补设置页） |
| Background SW | 有，部分坏 |
| Content Scripts | 有 |
| New Tab Override | 有，构建未自动化 |
| 图标规范 | 不完整 |
| 打包流水线 | 无 |
| 测试 | 无 |
| 产品 README | 无（Vite 模板） |
