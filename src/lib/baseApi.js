/* eslint-disable no-undef */
function jsonp(param) {
  const params = new URLSearchParams(param);
  const url = `https://api.fanyi.baidu.com/api/trans/vip/translate?${params.toString()}`;
  return new Promise((resolve, rej) => {
    chrome?.runtime?.sendMessage?.({
      action: "translate",
      query: url
    }, (response) => {
      if (response?.success) {
        resolve(response?.data)
      } else {
        rej(response)
      }
    });
  })
}

export {
  jsonp
}
