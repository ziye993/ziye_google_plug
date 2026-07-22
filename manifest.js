/** 扩展 Manifest 唯一真相源 → 构建时写出到 src_plug/manifest.json */
export default {
  manifest_version: 3,
  name: 'ziye_google_plug',
  version: '1.0.0',
  description: 'ZIYE 工具箱：翻译、搜索精简、二维码、主题、中间脚本、代理、新标签页',
  icons: {
    '16': 'assets/icon.png',
    '48': 'assets/icon.png',
    '128': 'assets/icon.png',
  },
  author: 'ziye',
  background: {
    service_worker: 'js/service-worker.js',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['js/content-script.js'],
      run_at: 'document_start',
    },
  ],
  action: {
    default_icon: 'assets/icon.png',
    default_title: 'ZIYE 工具箱',
    default_popup: 'page/expand/index.html',
  },
  host_permissions: [
    'https://api.fanyi.baidu.com/*',
    'https://api.openai.com/*',
    '<all_urls>',
  ],
  chrome_url_overrides: {
    newtab: 'page/newTabs/index.html',
  },
  permissions: [
    'tabs',
    'storage',
    'unlimitedStorage',
    'bookmarks',
    'cookies',
    'proxy',
    'webNavigation',
    'declarativeNetRequest',
    'declarativeNetRequestWithHostAccess',
    'webRequest',
    'scripting',
  ],
  web_accessible_resources: [
    {
      resources: ['assets/background.png', 'assets/background-null.png'],
      matches: ['<all_urls>'],
    },
  ],
  content_security_policy: {
    extension_pages:
      "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:;",
  },
};
