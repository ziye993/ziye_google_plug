export function isURLorIP(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  if (!s) return false;
  // 允许裸域名 / 带协议 / 带路径 / IPv4
  const regex =
    /^(https?:\/\/)?(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/[^\s]*)?$/i;
  return regex.test(s) || /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(s);
}
