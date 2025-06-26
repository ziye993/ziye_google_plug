/* eslint-disable no-undef */
let ruleIdCounter = 1000; // 避免与 declarative_net_request 静态规则冲突

/**
 * 将前端传来的配置转换为 DNR 规则
 * @param {Array} items - 表单中的代理配置项
 * @returns {Array} 规则数组
 */
function convertConfigsToRules(items) {
  const rules = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.check) continue; // 未勾选跳过
    const source = item.agentOriginUrl?.trim();
    const target = item.agentTargetUrl?.trim();
    if (!source || !target) continue;

    try {
      const sourceUrl = new URL(source);
      const filter = `${sourceUrl.origin}/*`;

      rules.push({
        id: ruleIdCounter++,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: target }
        },
        condition: {
          urlFilter: filter,
          resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "script", "image"]
        }
      });
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      console.warn("非法 URL，跳过:", source, target);
    }
  }

  return rules;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "UPDATE_PROXY_CONFIGS") {
    const configs = msg.data?.items || [];
    const rules = convertConfigsToRules(configs);

    // 清除旧规则，添加新规则
    chrome.declarativeNetRequest.getDynamicRules(existingRules => {
      const existingIds = existingRules.map(rule => rule.id);

      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: rules
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("更新规则失败:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log("代理规则已更新:", rules);
          sendResponse({ success: true });
        }
      });
    });

    // 必须返回 true 表示异步调用
    return true;
  }
});
