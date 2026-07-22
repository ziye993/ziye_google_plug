# AI 交接文档：未完成项与落地指南

> 给后续 AI / 开发者：本文基于 **2026-07-21 代码实查**，不以旧 `DEVELOPMENT.md` 勾选为准。  
> 仓库：`ziye_google_plug`｜可加载目录：`src_plug/`｜源码：`src/` + `extension/js/`  
> 构建：`npm run build:ext`（改 `extension/js` 或 UI 后必须重建并在 Chrome 点「重新加载」）

---

## 0. 先读这些（避免踩坑）

1. **编辑后台脚本请改 `extension/js/`**，不要只改 `src_plug/js/`（会被 `build:ext` 覆盖）。  
2. **Popup IndexedDB 与 Content Script 不在同一 origin**：页面里的 CS 不能直接读主题图；必须走 SW 消息 `GET_THEME_DATA`（此链路设计正确，主题仍坏在 UI 保存逻辑）。  
3. 个人向扩展：**可保留全部权限**；优先把功能做通，再谈权限精简。  
4. 旧文档 `DEVELOPMENT.md` §4「全绿」**不可信**，以本文为准。

### 建议修复顺序

```
P0 主题保存/取消/URL 匹配
 → P0 搜索精简默认 checked + 选择器
 → P1 主题 CSS-only / storage 热更新 / 删除清 IDB
 → P1 AgentScript 改为 scripting API + 默认关闭
 → P1 AgentBar 去掉假能力或做 regex 重定向
 → P2 Monaco 扩展环境 / storage key 统一 / 日志清理
```

---

## 1. 总览矩阵（实查）

| 模块 | 真实状态 | 一句话 |
|------|----------|--------|
| 工程 `build:ext` | ✅ | 可用；改 JS 必须 rebuild |
| 全局开关 `extensionEnabled` | ✅ 基本可用 | CS/DNR 会停；Popup 翻译等仍可用（合理） |
| 翻译 | ✅ 基本可用 | 需用户填 appid/appkey |
| 二维码 | ✅ 基本可用 | — |
| 新标签搜索 | ⚠️ | 可用；AI 依赖本地接口且入口几乎总显示 |
| 搜索精简 | ✅ P0 已修 | 默认 checked + 百度/谷歌/必应等选择器 |
| **主题** | ✅ P0/P1 已修 | 保存入库、取消不误删、URL 分隔、CSS-only、热更新 |
| 中间脚本 | ⚠️ 半成品 | 能存；CSP 仍可能挡；**新建默认关闭**；URL 分隔已修 |
| 代理 DNR | ⚠️ 半成品 | 简单 block/redirect 可同步；mock/proxyHost/modifyHeaders 是假的 |

---

## 2. P0 — 主题（优先）

### 2.1 现象

用户「上传图片 → 保存 → 使用」后，页面经常**没有背景**；编辑时点取消可能把已有图从 IndexedDB 删掉。

### 2.2 根因与改法

#### A. 新建主题丢了 `backgroundImage`（`img_*`）

**文件：** `src/components/ThemeBar/index.jsx`

- `customRequest` 里 `form.setFieldValue('backgroundImage', fileId)`，但 `setFormData` **没有**写入 `backgroundImage`。  
- 新建分支只存 `{ id: Date.now(), ...formData }`，**没用** `form.getFieldsValue()`。  
- `setFieldValue` 不保证触发 `onValuesChange` → 列表里主题常没有 `img_*`。

**做法：**

```js
// customRequest 成功后：
setFormData(prev => ({ ...prev, status: 'done', backgroundImage: fileId, fileName: file.name }));
form.setFieldValue('backgroundImage', fileId);

// modalOk：以 Form 为准，保留 used / 旧 id
const values = await form.validateFields();
const merged = {
  ...values,
  id: editingId ?? values.id ?? Date.now(),
  used: existing?.used ?? false,
  backgroundImage: values.backgroundImage || formData.backgroundImage,
  fileName: formData.fileName,
  bgType: formData.bgType || values.bgType || 'pic',
};
```

推荐：**砍掉「form + formData 双真相」**，编辑态用 `editingId` / `editingRecord`，保存只信 `validateFields()`。

#### B. 取消编辑会 `deleteIndexDb` 已有图

**文件：** 同文件 Modal `onCancel`

```js
onCancel={() => { deleteIndexDb(form.getFieldValue('backgroundImage')); ... }}
```

编辑已有主题时取消 = 删掉正在用的 `img_*`。

**做法：**

- 维护 `pendingImageId`：仅本会话新上传、且尚未写入 list 的 id。  
- `onCancel` 只删 `pendingImageId`。  
- 已保存主题的 `img_*` 永不在取消时删除。

#### C. `urlMatches` 用 `:` 分割，破坏 `https://...`

**文件：** `extension/js/content-script.js` → `urlMatches`

```js
.split(/[;:]/)  // BAD: "https://google.com" → ["https", "//google.com"]
```

`includes('https')` 几乎恒真，匹配逻辑失效。

**做法：**

```js
.split(/[;\n|]/)  // 仅分号 / 换行 / 可选竖线
```

同步改 ThemeBar、AgentScript 的 placeholder 文案（禁止写「用 `:` 分割」）。

#### D. `targetNegation` Switch 未绑定

**文件：** `ThemeBar/index.jsx`

```jsx
<Form.Item name="targetNegation" ...>
  <Switch disabled={!formData.targetUrl} />  // 缺 valuePropName="checked"
</Form.Item>
```

**做法：** `valuePropName="checked"`；禁用条件用 `Form.useWatch('targetUrl', form)`。

#### E. 编辑/新建表单脏数据

- 新建：`setFormData({})` 但未 `form.resetFields()`。  
- 编辑：`isEdit` 用 `formData.id`，更新却比 `data.id`，易错位。  
- merge `{ ...data, ...formData }` 可能用旧 state 盖掉表单。

**做法：** Add 时 `form.resetFields()` + 新 `id`；Edit 时 `editingId = record.id`，保存按 `editingId` 替换；保留 `used`。

### 2.3 P1 主题加固（做完 P0 再做）

| 问题 | 位置 | 做法 |
|------|------|------|
| 纯 CSS 主题不生效 | CS：`if (!used \|\| !used.backgroundImage) return` | 改为：有 `backgroundImage` 或非空 `css` 都应用；无图则只 `setCss` |
| 改主题不刷新已开标签 | CS 只在 boot 跑 | `chrome.storage.onChanged` → 清 `#demo-background` / `#dynamic-css` 再 `applyTheme` |
| 删除不清理 IDB | `del()` | `img_` 前缀则 `deleteIndexDb` |
| 图片拉取失败仍无 CSS | `GET_THEME_DATA` 回调 | `setCss` 放在 finally / 无论 response 是否为空都应用 css |
| `opacity:0` 等到 load | CS boot | `boot().finally` 里恢复 opacity，避免慢页长时间空白 |
| List 缺 key | ThemeBar map | `key={_.id}` |

### 2.4 主题验收清单

- [x] 上传 png → 保存 → 使用 → 刷新匹配站点 → 有模糊背景（代码已修，需手工点验）  
- [x] 编辑已有主题 → 取消 → 背景图仍在（IDB 未删）  
- [x] `targetUrl` 填 `google.com` 或 `https://www.google.com`（不要用冒号多段错误语义）→ 仅命中站生效  
- [x] 多项：`google.com;bing.com`  
- [x] 取反 Switch 打开后行为正确（`valuePropName="checked"`）  
- [x] 仅填 CSS、无背景 → 样式仍注入  
- [x] 删除主题 → 对应 `img_*` 从 IDB 消失  

### 2.5 主题数据形状

```ts
// chrome.storage.local.themeData
{
  listData: Array<{
    id: number
    thName?: string
    bgType: 'pic' | 'link'
    backgroundImage?: string  // 'img_<ts>' | http(s) url
    targetUrl?: string        // 多项用 ; 分隔，禁止用 :
    targetNegation?: boolean
    css?: string
    used?: boolean
    fileName?: string
  }>
}

// IndexedDB: DB theme / store themeStore
// key: img_<ts> → value: base64 data URL string
```

消息：`{ action: 'GET_THEME_DATA', data: 'img_xxx' }` → SW 返回 base64 或 null。

---

## 3. P0 — 搜索精简默认不可用

**文件：** `src/components/SearchSimplifyBar/index.jsx`、`extension/js/content-script.js`

### 问题

1. 默认规则 **没有** `checked: true`；CS：`if (!st.checked) return` → 开箱无效。  
2. 百度/谷歌默认 `boxName: []`；即使勾选也无目标元素。仅必应有 `.b_algo`。

### 做法

1. 默认数据全部 `checked: true`，并补齐常见选择器，例如：
   - 谷歌：`#search .g` 或 `div.g`
   - 百度：`#content_left .result` / `.c-container`
   - 必应：`.b_algo`
2. 或 CS 改为 `if (st.checked === false) return`（未定义视为启用），仍建议补选择器。  
3. 文档化关键词：`*` / `*=null` / `!否定` / 普通包含（UI 已有 Tooltip）。

### 验收

- [x] 全新安装 → 打开必应搜索 → 配置关键词后结果被折叠/隐藏（默认 checked + `.b_algo`）  
- [x] 取消勾选或总开关关闭 → 不再过滤（`checked === false` 才跳过）  

---

## 4. P1 — 中间脚本（AgentScript）

**文件：** `src/components/AgentScript/index.jsx`、`extension/js/content-script.js`

### 已有

- 持久化 `agentScriptData.listData`  
- 列表 CRUD、单项 `enabled`、URL + invert  
- CS 在 `document_start` 用 `<script textContent>` 注入主世界  

### 未完成 / 风险

| 问题 | 说明 |
|------|------|
| 页面 CSP | 严格站点会拦 inline script，注入静默失败 |
| 默认 enabled | ✅ 新建默认 `enabled: false` |
| SPA | URL 变化不重跑脚本（搜索过滤有 MutationObserver，脚本没有） |
| 与 `urlMatches` 共用冒号 bug | ✅ 已改为 `;` / 换行 / `|` |

### 推荐实现（MV3）

1. 新建默认 `enabled: false`。  
2. SW 监听 `webNavigation.onCommitted`（或 `onCompleted`），匹配规则后：

```js
chrome.scripting.executeScript({
  target: { tabId },
  world: 'MAIN',
  func: (code) => { (0, eval)(code); }, // 或注入文件
  args: [item.script],
});
```

3. 需要 `scripting`（manifest 已有）+ 注意 `host_permissions`。  
4. 从 CS 删除脆弱的 DOM script 注入，或保留作 fallback。  
5. 总开关 `extensionEnabled === false` 时不注入（已有）。

### 验收

- [ ] 宽松站点（如无 CSP 的本地页）脚本执行  
- [ ] 有 CSP 的站点用 `scripting` 仍可执行或明确报错提示  
- [ ] 默认关闭；手动打开才注入  

---

## 5. P1 — 代理（AgentBar / DNR）

**文件：** `src/components/AgentBar/*`、`extension/js/service-worker.js` → `syncDnrRules`

### 已有

- 规则写入 `agentPageDate` + `agentPageData`  
- SW `updateDynamicRules`；storage / 安装时同步  
- 支持大致：`block` / `allow` / `upgradeScheme` / 绝对 URL `redirect`  
- 导入导出 JSON  

### 未完成（UI 有、运行时无）

| UI 字段 | 实际 |
|---------|------|
| `modifyHeaders` | 落入 else → 当成 redirect，**错误** |
| `mock` | 完全未用 |
| `proxyHostAddress` | 未参与规则生成；与 `src_node` 代理无关 |
| 绝对 `redirect.url` | 丢掉 path/query，多数「代理到另一域名」场景不够用 |

### 做法（二选一，写进 PR 说明）

**方案 A（务实）：**  
- 枚举里暂时移除 `modifyHeaders`；隐藏 mock / proxyHost。  
- README 写清：只支持 block / allow / 整 URL redirect / upgradeScheme。  
- `urlFilter` 示例：`||example.com^` 或 `*://api.example.com/*`。

**方案 B（做真代理）：**  
- 用 `regexFilter` + `regexSubstitution` 保留 path。  
- 或 `redirect.transform`（若目标浏览器支持）。  
- `modifyHeaders` 按 DNR 文档实现 `requestHeaders`/`responseHeaders`。  
- mock 需另做（DNR 不能直接返回 body；要扩展页或本地服务器）。

另外：保存前校验；`checkAll` 应同步每条 `checked` 或 SW 逻辑与 UI 一致；编辑时不要把 `index` 字段写进持久化规则。

### 验收

- [ ] 一条 redirect：访问 A 域名跳到 B（用 chrome://extensions → DNR 规则计数核对）  
- [ ] 总开关关 → 动态规则清空  
- [ ] 不再出现「选了 modifyHeaders 却变成 redirect」  

---

## 6. P1 / P2 — 其他模块

### 翻译 — 基本完成

- 密钥：`baiduCredentials` + 表单；走 SW `action: 'translate'`。  
- 可选改进：勿每次 `onValuesChange` 整包 JSON 持久化；错误码已有。  

### 二维码 — 基本完成

- `qrcodePrefs`；粘贴解码失败文案已有。  

### 新标签页 — 部分完成

- 搜索 / 历史 / 设置保存可用。  
- `showAi`：默认 `apiBase` 非空导致 AI 按钮几乎总显示；无服务则失败。  
- **建议：** 仅当用户填了 `apiKey` 或显式「启用 AI」开关时显示入口。  
- `no-cors` 引擎探测不可靠；已有 Bing/百度降级，可再写死用户选择的引擎优先。  

### 全局开关 — 基本完成

- Header → `extensionEnabled`；CS 与 DNR 尊重。  
- 可选：图标 badge 显示关。  

### Monaco（主题 CSS / 脚本编辑）— P2

- Popup 体积巨大；worker 在 `chrome-extension://` 下易坏。  
- **建议：** 扩展内改用 `Input.TextArea`，或 Options 全页 + `web_accessible_resources` 托管 worker。  

### 工程 — 可用

- `manifest.js` → `src_plug/manifest.json`  
- `extension/js` → `src_plug/js`  
- 无 watch：只跑 `vite` 不会更新 SW/CS  

---

## 7. 存储 Key 一览（现状）

| Key | 模块 | 备注 |
|-----|------|------|
| `extensionEnabled` | 全局 | `false` 关闭；缺省=开 |
| `tranlPageData` | 翻译 | 常为 JSON 字符串 |
| `baiduCredentials` | 翻译 | `{ appId, appKey }` |
| `defaultSeachTool` / `defaultSearchTool` | 搜索精简 | 双写；读时兼容 |
| `themeData` | 主题 | `{ listData }` |
| IDB `theme`/`themeStore` | 主题图 | `img_*` |
| `agentPageDate` / `agentPageData` | 代理 | 双写 |
| `agentScriptData` | 脚本 | `{ listData }` |
| `qrcodePrefs` | 二维码 | |
| `newTabConfig` / `newTabsHistory` | 新标签 | |

P2：统一为新 key，读旧写新。

---

## 8. 消息协议（SW）

| action | 方向 | 说明 |
|--------|------|------|
| `translate` | Popup→SW | `{ query: fullUrl }` → `{ success, data\|error }` |
| `GET_THEME_DATA` | CS→SW | `{ data: imgId }` → base64 \| null |
| `SYNC_DNR_RULES` | Popup→SW | 重同步动态规则 |
| `GET_EXTENSION_ENABLED` | 任意→SW | 已实现，目前几乎无人调用 |

异步务必 `return true`。

---

## 9. 给 AI 的实现约束

1. **先修主题 P0**，不要先做大重构或改无关 UI。  
2. 改 CS/SW 后跑 `npm run build:ext`，并说明用户需重新加载扩展。  
3. 修 `urlMatches` 时同时影响主题与脚本。  
4. 不要删个人向已声明的大权限，除非用户要求。  
5. 完成一项就更新本文对应勾选，并在文末 Changelog 记一行。  
6. 不要把密钥写回仓库；翻译继续用户自备。  

---

## 10. 手工回归最小集

```
1. build:ext → 加载 src_plug
2. 主题：上传→保存→使用→打开匹配站看背景；取消编辑不丢图
3. 搜索精简：默认或勾选后必应/百度过滤生效
4. 翻译：填密钥 Ctrl+Enter
5. 代理：一条 redirect，chrome://net-export 或行为可见
6. 总开关关：主题/过滤/脚本/DNR 停
7. 新标签：搜索跳转 + 历史保存
```

---

## Changelog

| 日期 | 说明 |
|------|------|
| 2026-07-21 | 初版：实查后指出主题/搜索精简等未完成，供后续 AI 按 P0→P1 修复 |
| 2026-07-21 | **主题取图修复**：图片双写 `chrome.storage`+IDB（CS 直读）；Upload 不再污染 `backgroundImage`；保存即 `used`；背景层改透明 body + z-index:-1；避免旧 `z-index:-99999` 被盖住 |
