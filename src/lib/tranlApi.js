
import md5 from "js-md5";
// import { jsonp } from "./baseApi";

async function fanyiBodyFetch(params) {
  const url = new URL('https://api.fanyi.baidu.com/api/trans/vip/translate');
  url.search = new URLSearchParams(params).toString();
  return new Promise((res) => {
    fetch(url)
      .then(response => response.json())
      .then((data) => res({ ...data, list: data.trans_result.map(_ => _.dst) }))
      .catch((error) => {
        console.log(error)
        res({ list: [] })
      });
  })
}


function getSign(text) {
  const hash = md5(text);
  return hash;
}


export const getTranlateData = async (data, from, to, userAppid, userKey) => {
  console.log(data, from, to, 'qft')
  // const encoder = new TextEncoder();
  const appid = userAppid || '20231109001875285';
  const salt = Number(Math.random().toString().split('.')[1]);
  const key = userKey || 'PQVEEvqcU1pdwNAylh3X';
  const str = `${appid}${data}${salt}${key}`;
  const sign = getSign(str);
  const param = {
    q: data,
    // q: encoder.encode(q),
    from,
    to,
    appid,
    salt,
    sign
  }

  const tranlateData = await fanyiBodyFetch(param);

  return tranlateData;
}
