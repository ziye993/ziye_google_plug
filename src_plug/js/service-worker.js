/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars

async function translate(query) {
  const apiUrl = query;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('API 请求失败');
  }
  const data = await response.json();
  return data;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "translate") {
    translate(request.query).then(function (response) {
      sendResponse({ success: true, data: response });
    }).catch(function (error) {
      sendResponse({ success: false, error: error.message });
    });
    // 返回 true，表示响应是异步的
    return true;
  }
});


// resourceTypes 是 Chrome 扩展 declarativeNetRequest 规则中用来指定请求类型的字段，常见可用的值包括：
// "main_frame"	顶级页面加载请求
// "sub_frame"	iframe 内页面请求
// "stylesheet"	CSS 样式表请求
// "script"	JavaScript 脚本请求
// "image"	图片请求
// "font"	字体文件请求
// "xmlhttprequest"	XHR 和 fetch 请求
// "ping"	用于发送 ping 请求
// "csp_report"	内容安全策略报告请求
// "media"	媒体文件请求（音频、视频）
// "websocket"	WebSocket 请求
// "other"	其他类型请求

// action.type 在 chrome.declarativeNetRequest 规则中支持的主要类型有：
// 类型	说明
// "block"	阻止请求（拦截，取消加载）
// "allow"	明确允许请求（通常用于覆盖默认阻止）
// "redirect"	重定向请求到指定的 URL
// "upgradeScheme"	将请求从 http 自动升级到 https
// "modifyHeaders"	修改请求或响应头（只支持部分字段）




const clearRule = async () => {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const oldIds = existing.map(r => r.id);
  if (oldIds.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: oldIds
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('agentPageDate', ({ agentPageDate }) => {
    updateRedirectRules(agentPageDate?.ruleData);
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.agentPageDate) {
    updateRedirectRules(changes.agentPageDate.newValue?.ruleData);
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    console.log("🔍 Request made:", details.method, details.url);
  },
  { urls: ["<all_urls>"] }
);

function addQueryParam(originalUrl, key, value) {
  const url = new URL(originalUrl);
  url.searchParams.set(key, value); // 添加或更新参数
  return url.toString();
}

async function updateRedirectRules(ruleData) {
  await clearRule();
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: (ruleData?.items || [])
      .filter(rule => rule.checked || ruleData.checkAll)
      .map((rule, index) => ({
        id: index, // ✅ 每条规则必须有唯一整数 ID（可用于后续移除）
        priority: 1, // ✅ 优先级：数值越大，优先级越高（默认 1）
        action: { // ✅ 要执行的操作
          type: rule.actionType || 'allow', // 也可以是 "block", "allow", "upgradeScheme", 等
          redirect: {
            url: rule.mock
              ? addQueryParam(rule.redirectUrl || ruleData.proxyHostAddress, 'mock', rule.mock)
              : (rule.redirectUrl || ruleData.proxyHostAddress),  // ✅ 重定向目标地址
          }
        },
        condition: { // ✅ 匹配条件
          urlFilter: rule.conditionRrlFilter, // ✅ 匹配的 URL 关键字（模糊匹配）
          regexFilter: rule.conditionRegexFilter,
          resourceTypes: rule.resourceTypes || ["xmlhttprequest"], // ✅ 请求类型（必须指定）
          methods: rule.methods || ["GET"], // 可选：限制请求方法（如 GET、POST）
          domains: rule.conditionDomains || [], // 可选：限制来源网站（发送请求的网站）
          excludedDomains: rule.conditionExcludedDomains || [] // 可选：排除某些网站
        }
      }))
  }, () => {
    console.log("✅ Dynamic redirect rule added.");
  });
}


