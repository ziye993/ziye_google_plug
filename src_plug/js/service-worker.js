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

async function openDB() {
  return idbOpenDB('ThemeImages', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images');
      }
    },
  });
}

async function getImageBlobById(id) {
  const db = await openDB();
  const tx = db.transaction('images', 'readonly');
  return tx.objectStore('images').get(id);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_THEME_DATA") {
    // console.log(message, 'message')
    // 回复 content script（可选）
    console.log(message.data)
    sendResponse({ reply: "Hello from service worker" });
  }
});


