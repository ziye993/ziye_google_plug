import md5 from 'js-md5';
import { jsonp } from './baseApi';

const BAIDU_ERROR = {
  52001: '请求超时，请重试',
  52002: '系统错误，请重试',
  52003: '未授权用户，请检查 appid',
  54000: '必填参数为空',
  54001: '签名错误，请检查 appkey',
  54003: '访问频率受限',
  54004: '账户余额不足',
  54005: '长query请求频繁',
  58000: '客户端IP非法',
  58001: '译文语言方向不支持',
  58002: '服务当前已关闭',
  90107: '认证未通过或未生效',
};

function getSign(text) {
  return md5(text);
}

function buildParams(data, from, to, appid, key) {
  const salt = Number(Math.random().toString().split('.')[1]);
  const sign = getSign(`${appid}${data}${salt}${key}`);
  return { q: data, from, to, appid, salt, sign };
}

async function fanyiViaSw(params) {
  const data = await jsonp(params);
  if (data?.error_code) {
    const code = String(data.error_code);
    const msg = BAIDU_ERROR[code] || data.error_msg || `翻译失败 (${code})`;
    return { list: [], error: msg, error_code: code, ...data };
  }
  const list = (data?.trans_result || []).map((_) => _.dst);
  return { ...data, list, error: null };
}

async function fanyiDirect(params) {
  const url = new URL('https://api.fanyi.baidu.com/api/trans/vip/translate');
  url.search = new URLSearchParams(params).toString();
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data?.error_code) {
      const code = String(data.error_code);
      const msg = BAIDU_ERROR[code] || data.error_msg || `翻译失败 (${code})`;
      return { list: [], error: msg, error_code: code, ...data };
    }
    return { ...data, list: (data.trans_result || []).map((_) => _.dst), error: null };
  } catch (error) {
    return { list: [], error: error?.message || '网络失败' };
  }
}

/**
 * 优先走 Service Worker（扩展环境），否则直连 fetch（dev）
 */
export const getTranlateData = async (data, from, to, userAppid, userKey) => {
  const appid = userAppid;
  const key = userKey;
  if (!appid || !key) {
    return { list: [], error: '请先在设置中配置百度翻译 appid / appkey' };
  }
  const param = buildParams(data, from, to, appid, key);

  // eslint-disable-next-line no-undef
  if (typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
    try {
      return await fanyiViaSw(param);
    } catch (e) {
      // SW 失败时降级直连
      return fanyiDirect(param);
    }
  }
  return fanyiDirect(param);
};
