
import md5 from "js-md5";
import { jsonp } from "./baseApi";

async function fanyiBodyFetch(api, param) {
  let res = null;
  try {
    res = await jsonp(param);
  } catch (error) {
    console.error(error)
  }
  return res;
}


function getSign(text) {
  const hash = md5(text);
  return hash;
}


export const getTranlateData = async (data, form, to, userAppid, userKey) => {
  // const encoder = new TextEncoder();
  const appid = userAppid || '20231109001875285';
  const q = data;
  const salt = Number(Math.random().toString().split('.')[1]);
  const key = userKey || 'PQVEEvqcU1pdwNAylh3X';
  const str = `${appid}${q}${salt}${key}`;
  const sign = getSign(str);
  const param = {
    q: q,
    // q: encoder.encode(q),
    from: form,
    to,
    appid,
    salt,
    sign
  }
  const tranlateData = await fanyiBodyFetch(`translate`, param);
  return tranlateData?.trans_result;
}
