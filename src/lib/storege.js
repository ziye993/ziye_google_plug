/* eslint-disable no-undef */
// 设置数据：传入 key 和 data 对象
export function setStorage(id, data) {
  if (chrome?.storage?.local === undefined && localStorage) {
    try {
      localStorage.setItem(id, JSON.stringify(data));
    } catch (error) {
      console.log(error)
      localStorage.setItem(id, data);
    }
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    chrome.storage.local.set({ [id]: data }, () => resolve(true));
  });
}

// 获取数据：传入 key，返回对应值
export function getStorage(id) {
  if (chrome?.storage?.local === undefined && localStorage) {
    const res = localStorage.getItem(id);
    if (res) {
      try {
        return Promise.resolve(JSON.parse(res));
      } catch (error) {
        console.log(error)
        return Promise.resolve(res);
      }
    }
    else {
      return Promise.resolve(null);
    }
  }
  return new Promise((resolve) => {
    chrome.storage.local.get(id, (result) => {
      console.log(result)
      resolve(result[id]);
    });
  });
}


const DB_NAME = 'theme';
const STORE_NAME = 'themeStore';
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
export function setIndexDb(id, data) {
  return openDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export function getIndexDb(id) {
  return openDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

export function deleteIndexDb(id) {
  return openDB().then(db => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}
