/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars



const DB_NAME = 'theme';
const STORE_NAME = 'themeStore';

// function setIndexDb(id, data) {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open(DB_NAME);
//     request.onupgradeneeded = () => {
//       const db = request.result;
//       if (!db.objectStoreNames.contains(STORE_NAME)) {
//         db.createObjectStore(STORE_NAME);
//       }
//     };
//     request.onsuccess = () => {
//       const db = request.result;
//       const tx = db.transaction(STORE_NAME, 'readwrite');
//       const store = tx.objectStore(STORE_NAME);
//       store.put(data, id);
//       tx.oncomplete = () => resolve();
//       tx.onerror = () => reject(tx.error);
//     };
//     request.onerror = () => reject(request.error);
//   });
// }

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1); // 指定版本号
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME); // 创建 object store
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


function getIndexDb(id) {
  return openDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}



async function translate(query) {
  const apiUrl = query;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('API 请求失败');
  }
  const data = await response.json();
  return data;
}

const getTranlateData = async (message, sender, sendResponse) => {
  translate(request.query).then(function (response) {
    sendResponse({ success: true, data: response });
  }).catch(function (error) {
    sendResponse({ success: false, error: error.message });
  });

}

const getThemeBgData = async (message, sender, sendResponse) => {
  if (!message.data) {
    return
  }
  const data = await getIndexDb(message.data)
  sendResponse(data)
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message, 'message')
  if (message.action === "translate") {
    getTranlateData(message, sender, sendResponse)
    // 返回 true，表示响应是异步的
    return true;
  } else if (message.action === "GET_THEME_DATA") {
    getThemeBgData(message, sender, sendResponse)
    return true
  }
})







