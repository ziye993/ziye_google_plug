/* eslint-disable no-undef */
function jsonp(param) {
  const params = new URLSearchParams(param);
  const url = `https://api.fanyi.baidu.com/api/trans/vip/translate?${params.toString()}`;
  return new Promise((resolve, rej) => {
    chrome?.runtime?.sendMessage?.(
      {
        action: 'translate',
        query: url,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          rej(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.success) {
          resolve(response?.data);
        } else {
          rej(new Error(response?.error || '翻译请求失败'));
        }
      },
    );
  });
}

const fetchWithTimeout = (url, options = {}, timeout = 500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
};

export { jsonp, fetchWithTimeout };
