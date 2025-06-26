export default {
  "manifest_version": 3,
  "name": "demo",
  "version": "1.0.0",
  "description": "插件说明",
  "icons": {
    "18": "image/on.png"
  },
  "author": "ziye",
  "background": {
    "service_worker": "js/service-worker.js"
  },
  "devtools_page": "html/devtools.html",
  "action": {
    "default_icon": "image/icon.png",
    "default_title": "主题",
    "default_popup": "./build/index.html"
  },
  "content_scripts": [
    {
      "matches": [
        "<all_urls>"
      ],
      "js": [
        "js/content.js"
      ],
      "run_at": "document_idle"
    }
  ],
  "host_permissions": [
    "https://api.fanyi.baidu.com/*"
  ],
  "permissions": [
    "tabs",
    "storage",
    "unlimitedStorage",
    "bookmarks",
    "cookies",
    "proxy",
    "webNavigation",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess"
  ],
  "chrome_url_overrides": {
    "newtab": "html/newtab.html"
  },
  "web_accessible_resources": [
    {
      "resources": [
        "image/background.png"
      ],
      "matches": [
        "<all_urls>"
      ]
    }
  ]
};
