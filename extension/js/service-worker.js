/* eslint-disable no-undef */

const DB_NAME = 'theme';
const STORE_NAME = 'themeStore';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getIndexDb(id) {
  return openDB().then((db) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

async function translate(query) {
  const response = await fetch(query);
  if (!response.ok) {
    throw new Error(`API 请求失败 (${response.status})`);
  }
  return response.json();
}

function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

/** 将代理 UI 规则同步为 declarativeNetRequest 动态规则 */
async function syncDnrRules() {
  const res = await getStorage(['agentPageDate', 'agentPageData', 'extensionEnabled']);
  const enabled = res.extensionEnabled !== false;
  const ruleData = res.agentPageData?.ruleData || res.agentPageDate?.ruleData;

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  if (!enabled || !ruleData?.enb || !Array.isArray(ruleData.items)) {
    if (removeRuleIds.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: [] });
    }
    return { success: true, count: 0 };
  }

  const addRules = [];
  let id = 1;
  for (const item of ruleData.items) {
    if (!item.checked && !ruleData.checkAll) continue;
    if (!item.agentOriginUrl || !item.agentTargetUrl) continue;

    const actionType = item.actionType || 'redirect';
    const rule = {
      id: id++,
      priority: 1,
      action: {},
      condition: {
        urlFilter: item.agentOriginUrl,
        resourceTypes: item.resourceTypes?.length
          ? item.resourceTypes
          : ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'image', 'other'],
      },
    };

    if (item.methods?.length) {
      rule.condition.requestMethods = item.methods.map((m) => m.toLowerCase());
    }

    if (actionType === 'block') {
      rule.action = { type: 'block' };
    } else if (actionType === 'allow') {
      rule.action = { type: 'allow' };
    } else if (actionType === 'upgradeScheme') {
      rule.action = { type: 'upgradeScheme' };
    } else {
      // redirect（默认）
      rule.action = {
        type: 'redirect',
        redirect: { url: item.agentTargetUrl },
      };
    }

    addRules.push(rule);
  }

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  return { success: true, count: addRules.length };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'translate') {
    translate(message.query)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'GET_THEME_DATA') {
    if (!message.data) {
      sendResponse(null);
      return false;
    }
    getIndexDb(message.data)
      .then((data) => sendResponse(data))
      .catch((err) => sendResponse(null));
    return true;
  }

  if (message.action === 'SYNC_DNR_RULES') {
    syncDnrRules()
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'GET_EXTENSION_ENABLED') {
    getStorage(['extensionEnabled']).then((res) => {
      sendResponse({ success: true, data: res.extensionEnabled !== false });
    });
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  syncDnrRules().catch(() => {});
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.agentPageDate || changes.agentPageData || changes.extensionEnabled) {
    syncDnrRules().catch(() => {});
  }
});

// 启动时同步一次
syncDnrRules().catch(() => {});
