
import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import { fetchWithTimeout } from '../../lib/baseApi';
import { chat } from './aiTool';
import { timeAgo } from '../../lib/time';
import { DeleteOutlined, SelectOutlined } from '@ant-design/icons';
import { SettingModal } from './SettingModal';
import useRevoke from '../../hooks/useRevoke';
import { message } from 'antd';

const engines = [
  { name: 'google', test: 'https://www.google.com/favicon.ico', search: q => `https://www.google.com/search?q=${q}` },
  { name: 'bing', test: 'https://www.bing.com/favicon.ico', search: q => `https://www.bing.com/search?q=${q}` },
  { name: 'baidu', test: 'https://www.baidu.com/favicon.ico', search: q => `https://www.baidu.com/s?wd=${q}`, notDefaut: true },
];

const mockHistory = [
  {
    content: "记录",
    time: "时间",
    type: '类型',
    delete: '删除',
    copy: '键入'
  }, {
    content: "testaskdasld asdkalsda asd asda",
    time: 1770017094948,
    type: 'G',
  }, {
    content: "中文历史记录测试",
    time: 1770016094948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  }, {
    content: "中文历史记录测试",
    time: 1770016094948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  }, {
    content: "中文历史记录测试",
    time: 1770016094948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  }, {
    content: "中文历史记录测试",
    time: 1770016094948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  }, {
    content: "中文历史记录测试",
    time: 1770016094948,
    type: 'B',
  }, {
    content: "超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试,超长中文历史记录测试",
    time: 1770016894948,
    type: 'B',
  },]

export default function Search() {

  const inputRef = useRef();
  const { addMask, revokeAll } = useRevoke();
  const [searchState, setSearchState] = useState('search');
  const [inputValue, setInputValue] = useState('')
  const [history, setHistory] = useState({ show: false, list: mockHistory });
  const historyList = useRef([])
  const onKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        // Ctrl + Enter 
        await chat("");
      } else {
        // Enter
        onSearch(inputValue)
      }
    }
  }
  const onInput = (e) => {
    setInputValue(e.target.value)
  }

  const canAccess = (url) =>
    fetchWithTimeout(url, { method: 'HEAD', mode: 'no-cors' }, 500)
      .then(() => true)
      .catch(() => false);


  const onSearch = async (keyword) => {
    setSearchState('search');
    if (!keyword) return message.info("请输入")
    setInputValue(keyword)
    for (const e of engines) {
      const ok = await canAccess(e.test);
      if (ok) {
        try {
          if (historyList.current?.some?.(_ => _.content === keyword)) {
            historyList.current = historyList.current.map(_ => _.content === keyword ? ({ ..._, time: Date.now(), type: e.name === 'google' ? "G" : e.name === 'bing' ? 'B' : 'O', }) : _)
          } else {
            historyList.current.push({
              content: keyword.length > 200 ? keyword?.slice?.(0, 200) : keyword,
              time: Date.now(),
              type: e.name === 'google' ? "G" : e.name === 'bing' ? 'B' : 'O',
            })
          }
          localStorage.setItem('newTabsHistory', JSON.stringify(historyList.current));
          setHistory(prev => ({ ...prev, list: !keyword ? historyList.current : historyList.current?.filter(_ => _?.content?.includes(keyword)).sort((a, b) => b?.time - a?.time) }))
        } catch (error) {

        }
        window.open(e.search(keyword), '_blank');
        return;
      }
    }
    message.info("网络连接异常,请检查网络!")
  }
  const open = async (record) => {
    onSearch(record?.content)
  }

  const onChat = async () => {
    setSearchState('aiChat');
    await chat("");
  }

  const deleteHistory = (record) => {
    revokeAll()
    setHistory(prev => ({ ...prev, show: true, list: prev.list?.filter(_ => _.time !== record.time).sort((a, b) => b?.time - a?.time) }));
    historyList.current = historyList.current?.filter?.(_ => _.time !== record.time);
    localStorage.setItem('newTabsHistory', JSON.stringify(historyList.current));
    inputRef.current.focus();
  }

  useEffect(() => {
    try {
      const storageData = JSON.parse(localStorage.getItem("newTabsHistory"));
      setHistory(prev => ({ ...prev, list: storageData?.sort((a, b) => b?.time - a?.time) }));
      historyList.current = storageData || [];

    } catch (error) {

    }
    console.log(JSON.parse(localStorage.getItem("newTabsHistory")), 'storageData')
  }, []);

  useEffect(() => {
    setHistory(prev => ({ ...prev, list: !inputValue ? historyList.current : historyList.current?.filter?.(_ => _?.content?.includes(inputValue)).sort((a, b) => b?.time - a?.time) }))
  }, [inputValue]);

  const inputOnBlur = () => {
    revokeAll()
    addMask(undefined, 200, () => {
      setHistory(prev => ({ ...prev, show: false }));
    });
  }

  return <div className={styles.Box}  >
    <SettingModal engines={engines} />
    <div className={`${styles.searchBox} ${searchState === 'search' ? "" : styles.aiChatInputBox}`}>
      <div className={styles.inputBox}>
        <input type="text" value={inputValue} ref={inputRef} placeholder='回车键入搜索, ctrl+回车 键入AI对话' onInput={onInput} onKeyDown={onKeyDown} onBlur={() => { inputOnBlur() }} onFocus={() => { setHistory(prev => ({ ...prev, show: true })) }} />
        {history?.show && <div className={`${styles.inputHistory} ${searchState === 'aiChat' ? styles.aiInputHistory : ''}`}>
          <div className={styles.historySetting}></div>
          <div className={styles.schistory}>
            {history?.list?.length ? history?.list?.map(_ => {
              return <div className={styles.histItem} key={_.time}>
                <span className={styles.historyContent} onClick={() => { open(_) }}>{_.content}</span>
                <span className={styles.historyTime}>{isNaN(_.time) ? _.time : timeAgo(_.time)}</span>
                <span>{_.type}</span>
                {_.delete ? <span>{_.delete}</span> : <DeleteOutlined className={styles.historyDelete} onClick={() => { deleteHistory(_); }} />}
                {_.copy ? <span>{_.copy}</span> : <SelectOutlined className={styles.historyDelete} onClick={() => { revokeAll(); inputRef.current.focus(); setInputValue(_.content) }} />}
              </div>
            })
              : <div className={styles.noHistory}>
                没有相关历史记录
              </div>}
          </div>

        </div>}
      </div>

      <div className={styles.buttonGrunp} >
        <button onClick={() => { onSearch(inputValue) }}>
          <span>搜索</span>
          <span className={styles['rainbow-text']}>GOOGLE</span>
          <span className={styles.bingSearchSpan}>BING</span>
        </button>
        <button onClick={onChat} >AI 对话</button></div>
    </div>
    {/* <div className={styles.bookList} >书签</div> */}
  </div>
}