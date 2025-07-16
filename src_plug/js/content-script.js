// eslint-disable-next-line no-undef
const CHROME = chrome;

var storage = CHROME && CHROME.storage && CHROME.storage.local;

const isHit = (item, content) => {
  if (item === '*' || item === '*=null') {
    return true
  }

  if (item[0] === '!') {
    return !content.includes(item.substring(1))
  }
  console.log(item)
  return content.includes(item)
}

const clearSeachList = () => storage.get("defaultSeachTool", (res) => {
  if (res?.defaultSeachTool) {
    const defaultSeachToolConfig = JSON.parse(res?.defaultSeachTool);
    console.log(defaultSeachToolConfig)
    if (!defaultSeachToolConfig.open) {
      return
    }
    const defaultSeachTool = defaultSeachToolConfig.defaultSeachTool || [];
    defaultSeachTool.forEach(st => {
      if (!st.checked) {
        return
      }
      const urlIsHit = window.location.href.includes(st.url)  //defaultSeachTool.findIndex(el => window.location.href.includes(el.url));
      if (!urlIsHit) {
        return
      }
      //命中url
      const configItems = st.config || [];
      const boxNames = st.boxName || [];
      if (!configItems.length || !boxNames.length) {
        return
      }
      boxNames.forEach(item => { //命中的所有元素
        const EleList = document.querySelectorAll(item);
        console.log(EleList, 'res')
        if (!EleList) {
          return
        }

        for (const child of EleList) {
          const content = child.textContent.trim();
          const cloneChild = child.cloneNode(true);
          configItems.forEach(configItem => { //需要命中的文本 * 表示所有

            if (!isHit(configItem, content)) {
              return
            }
            console.log(content, 'res')
            if (configItem === '*=null') { // 隐藏所有
              child.style.overflow = 'hidden';
              child.innerHTML = "";
              child.style.display = 'none';
              console.log(`已筛选结果:${configItem}`)
              return
            }
            // configItem.forEach(item => { //需要命中的文本 * 表示所有
            //若content中包含item或者item为*则隐藏，若item的第一个字符为"!"则表示content中不包含item则隐藏
            const styles = { ...child.style };
            child.style.height = '30px';
            child.style.overflow = 'hidden';
            child.innerHTML = "";
            const newFixDiv = document.createElement("div");
            newFixDiv.innerHTML = "已被隐藏，点击恢复"
            newFixDiv.style.cursor = 'pointer';
            newFixDiv.addEventListener("click", () => {
              child.innerHTML = "";
              child.appendChild(cloneChild);
              child.style = styles;
            });
            child.appendChild(newFixDiv)
            // });

            console.log(`已筛选结果:${configItem}`)
          });
        }
      });


    })


  }
});

function setTheme(imageUrl) {
  const ele = document.getElementById("demo-background");
  if (ele) {
    ele.style.backgroundImage = `url(${imageUrl})`;
    return 0;
  }
  let newdiv = document.createElement("div");
  let body = document.getElementsByTagName("html")[0];
  let path = imageUrl;
  let urlStr = `url(${path})`;
  newdiv.setAttribute("id", "demo-background");
  newdiv.setAttribute(
    "style",
    `
      width: 100%;
      height: 100%;
      position: fixed;
      top: 0;
      left: 0;
      background-repeat: no-repeat;
      background-size: cover;
      max-width:100vw;
      max-height:100vh;
      z-index:-99999;
      filter:blur(0px) opacity(0);
      transition: all 0.5s;
      background-color: rgba(196, 196, 215, 0.5);
    `
  );
  newdiv.style.backgroundImage = urlStr;
  newdiv.style.backgroundSize = "cover";
  body.prepend(newdiv);
  setTimeout(() => (newdiv.style.filter = "blur(5px) opacity(0.7)"), 1);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body) {
    let previousUrl = window.location.href;
    clearSeachList();
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== previousUrl) {
        console.log('URL 变化了:', currentUrl);
        previousUrl = currentUrl;
        clearSeachList();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
});

function setCss(css) {
  let styleTag = document.getElementById('dynamic-css');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-css';
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = css;
}



storage.get("themeData", (res) => {
  const themeList = res?.themeData?.listData || [] // console.log(, 'storeag')
  console.log(themeList, 'themeList1')
  const used = themeList.find(_ => _.used);
  if (!used.targetUrl) { used.targetNegation = false }
  if (!used || !used.backgroundImage) {
    return
  }

  const targetUrlList = (used.targetUrl || '').replace(/[\r\n]/g, '').split(';') || [];
  const isHit = targetUrlList.some(_ => window.location.href.includes(_))
  console.log('设置主题', used.targetUrl, isHit, used.targetNegation)
  if (used.targetUrl) {
    if (!isHit && !used.targetNegation) {
      return
    }
    if (isHit && used.targetNegation) {
      return
    }
  }

  if (used) {
    if (used.backgroundImage.startsWith('img_')) {
      CHROME?.runtime?.sendMessage({ action: "GET_THEME_DATA", data: used.backgroundImage }, (response) => {
        setTheme(response)
        setCss(used.css)
      });
    } else {
      setTheme(used.backgroundImage)
    }
  }
})
