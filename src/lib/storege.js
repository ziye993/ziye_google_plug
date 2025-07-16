/* eslint-disable no-undef */
import { openDB as idbOpenDB } from 'idb';
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


export async function openDB() {
  return idbOpenDB('ThemeImages', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images');
      }
    },
  });
}

export async function getImageBlobById(id) {
  const db = await openDB();
  const tx = db.transaction('images', 'readonly');
  return tx.objectStore('images').get(id);
}