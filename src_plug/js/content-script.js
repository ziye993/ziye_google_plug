// eslint-disable-next-line no-undef
var storage = chrome && chrome.storage && chrome.storage.local;

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

storage.get("themeData", (res) => {
  const themeList = res?.themeData?.listData || [] // console.log(, 'storeag')
  const used = themeList.find(_ => _.used);
  if (used) {
    if (used.pic.startsWith('img_')) {
      chrome?.runtime?.sendMessage({ type: "GET_THEME_DATA", data: used.pic }, (response) => {
        console.log(response, 'response')
      });
    }

  }

})

// eslint-disable-next-line no-undef


