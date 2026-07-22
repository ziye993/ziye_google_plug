/* eslint-disable no-undef */
const CHROME = chrome;
const storage = CHROME?.storage?.local;

function getStorageKeys(keys) {
  return new Promise((resolve) => {
    if (!storage) {
      resolve({});
      return;
    }
    storage.get(keys, resolve);
  });
}

const isHit = (item, content) => {
  if (item === '*' || item === '*=null') return true;
  if (item[0] === '!') return !content.includes(item.substring(1));
  return content.includes(item);
};

function parseSearchConfig(raw) {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

const clearSeachList = async () => {
  const res = await getStorageKeys(['defaultSeachTool', 'defaultSearchTool', 'extensionEnabled']);
  if (res.extensionEnabled === false) return;

  const config = parseSearchConfig(res.defaultSearchTool || res.defaultSeachTool);
  if (!config?.open) return;

  const list = config.defaultSeachTool || config.defaultSearchTool || [];
  list.forEach((st) => {
    if (st.checked === false) return;
    if (!window.location.href.includes(st.url)) return;

    const configItems = st.config || [];
    const boxNames = st.boxName || [];
    if (!configItems.length || !boxNames.length) return;

    boxNames.forEach((selector) => {
      const EleList = document.querySelectorAll(selector);
      for (const child of EleList) {
        if (child.dataset.ziyeFiltered === '1') continue;
        const content = (child.textContent || '').trim();
        const cloneChild = child.cloneNode(true);

        for (const configItem of configItems) {
          if (!isHit(configItem, content)) continue;

          child.dataset.ziyeFiltered = '1';
          if (configItem === '*=null') {
            child.style.overflow = 'hidden';
            child.innerHTML = '';
            child.style.display = 'none';
            break;
          }

          const styles = child.getAttribute('style') || '';
          child.style.height = '30px';
          child.style.overflow = 'hidden';
          child.innerHTML = '';
          const newFixDiv = document.createElement('div');
          newFixDiv.textContent = '已被隐藏，点击恢复';
          newFixDiv.style.cursor = 'pointer';
          newFixDiv.addEventListener('click', () => {
            child.innerHTML = '';
            child.appendChild(cloneChild);
            child.setAttribute('style', styles);
            delete child.dataset.ziyeFiltered;
          });
          child.appendChild(newFixDiv);
          break;
        }
      }
    });
  });
};

function escapeCssUrl(url) {
  return String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n|\r/g, '');
}

function setTheme(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return;

  let styleTag = document.getElementById('demo-background-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'demo-background-style';
    (document.head || document.documentElement).appendChild(styleTag);
  }

  const safe = escapeCssUrl(imageUrl);
  styleTag.textContent = `
    html.ziye-theme-bg {
      background-color: transparent !important;
    }
    html.ziye-theme-bg body {
      background-color: transparent !important;
      background-image: none !important;
    }
    #demo-background {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background-repeat: no-repeat !important;
      background-size: cover !important;
      background-position: center center !important;
      background-image: url("${safe}") !important;
      filter: blur(5px) opacity(0.7) !important;
      background-color: rgba(196, 196, 215, 0.35) !important;
    }
  `;
  document.documentElement.classList.add('ziye-theme-bg');

  let ele = document.getElementById('demo-background');
  if (!ele) {
    ele = document.createElement('div');
    ele.id = 'demo-background';
    const mount = () => {
      const parent = document.body || document.documentElement;
      if (!document.getElementById('demo-background')) {
        parent.insertBefore(ele, parent.firstChild);
      }
    };
    if (document.body) {
      mount();
    } else {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
      document.documentElement.appendChild(ele);
    }
  }
  ele.style.backgroundImage = `url("${safe}")`;
}

function setCss(css) {
  let styleTag = document.getElementById('dynamic-css');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-css';
    (document.head || document.documentElement).appendChild(styleTag);
  }
  styleTag.textContent = css || '';
}

function clearThemeDom() {
  document.getElementById('demo-background')?.remove();
  document.getElementById('demo-background-style')?.remove();
  document.documentElement.classList.remove('ziye-theme-bg');
  const styleTag = document.getElementById('dynamic-css');
  if (styleTag) styleTag.textContent = '';
}

function urlMatches(targetUrl, invert) {
  if (!targetUrl) return true;
  const parts = String(targetUrl)
    .split(/[;\n|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return true;
  const hit = parts.some((p) => window.location.href.includes(p));
  return invert ? !hit : hit;
}

async function applyTheme() {
  const res = await getStorageKeys(['themeData', 'extensionEnabled']);
  if (res.extensionEnabled === false) {
    clearThemeDom();
    return;
  }

  const themeList = res?.themeData?.listData || [];
  const used = themeList.find((_) => _.used);
  const bgId = used && typeof used.backgroundImage === 'string' ? used.backgroundImage : '';
  const hasImage = !!bgId;
  const hasCss = !!(used && used.css && String(used.css).trim());
  if (!used || (!hasImage && !hasCss)) {
    clearThemeDom();
    return;
  }

  if (!urlMatches(used.targetUrl, used.targetNegation)) {
    clearThemeDom();
    return;
  }

  if (hasCss) setCss(used.css);

  if (!hasImage) return;

  if (bgId.startsWith('img_')) {
    // 优先 chrome.storage（与 Popup 同通道，CS 可直接读）
    const imgBag = await getStorageKeys([bgId]);
    if (imgBag[bgId]) {
      setTheme(imgBag[bgId]);
      return;
    }
    // 回退 IndexedDB（经 SW）
    CHROME?.runtime?.sendMessage(
      { action: 'GET_THEME_DATA', data: bgId },
      (response) => {
        if (CHROME.runtime.lastError) return;
        if (response) setTheme(response);
      },
    );
  } else {
    setTheme(bgId);
  }
}

/** 注入用户脚本到页面主世界 */
async function applyAgentScripts() {
  const res = await getStorageKeys(['agentScriptData', 'extensionEnabled']);
  if (res.extensionEnabled === false) return;

  const list = res?.agentScriptData?.listData || [];
  for (const item of list) {
    if (item.enabled === false) continue;
    if (!item.script) continue;
    if (!urlMatches(item.url, item.invert)) continue;

    try {
      const el = document.createElement('script');
      el.textContent = `;(function(){\n${item.script}\n})();`;
      (document.documentElement || document.head).appendChild(el);
      el.remove();
    } catch {
      // ignore injection errors
    }
  }
}

async function boot() {
  const res = await getStorageKeys(['extensionEnabled']);
  if (res.extensionEnabled === false) {
    document.documentElement.style.opacity = '1';
    return;
  }

  await applyTheme();
  await applyAgentScripts();
}

if (CHROME?.storage?.onChanged) {
  CHROME.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.themeData || changes.extensionEnabled) {
      clearThemeDom();
      applyTheme();
      return;
    }
    // 主题图写入 storage 后也尝试刷新（保存瞬间）
    const imgKeyChanged = Object.keys(changes).some((k) => k.startsWith('img_'));
    if (imgKeyChanged) applyTheme();
  });
}

// document_start：先隐藏再渐显（仅扩展启用时）
document.documentElement.style.opacity = '0';
document.documentElement.style.transition = 'opacity 0.3s ease';

boot().finally(() => {
  document.documentElement.style.opacity = '1';
});

document.addEventListener('DOMContentLoaded', () => {
  clearSeachList();
  if (document.body) {
    let previousUrl = window.location.href;
    let timer = null;
    const scheduleFilter = () => {
      clearTimeout(timer);
      timer = setTimeout(() => clearSeachList(), 300);
    };
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== previousUrl) {
        previousUrl = currentUrl;
      }
      scheduleFilter();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
});

window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    document.documentElement.style.opacity = '1';
  });
  clearSeachList();
});

window.addEventListener('beforeunload', () => {
  document.documentElement.style.transition = 'opacity 0.3s';
  document.documentElement.style.opacity = '0';
  const bg = document.querySelector('#demo-background');
  if (bg) {
    bg.style.opacity = '0';
  }
});
