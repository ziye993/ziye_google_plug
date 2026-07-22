import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import { fetchWithTimeout } from '../../lib/baseApi';
import { chat } from './aiTool';
import { timeAgo } from '../../lib/time';
import { DeleteOutlined, SelectOutlined } from '@ant-design/icons';
import { SettingModal } from './SettingModal';
import useRevoke from '../../hooks/useRevoke';
import { message } from 'antd';
import { getStorage, setStorage } from '../../lib/storege';

const engines = [
  { name: 'google', test: 'https://www.google.com/favicon.ico', search: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { name: 'bing', test: 'https://www.bing.com/favicon.ico', search: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { name: 'baidu', test: 'https://www.baidu.com/favicon.ico', search: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`, notDefaut: true },
];

const DEFAULT_CONFIG = {
  apiKey: '',
  apiBase: 'http://localhost:30000/api/ai/chat',
  enbHistory: true,
  usBaidu: false,
  useSearchType: '',
};

export default function Search() {
  const inputRef = useRef();
  const { addMask, revokeAll } = useRevoke();
  const [searchState, setSearchState] = useState('search');
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState({ show: false, list: [] });
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const historyList = useRef([]);

  const persistHistory = (list) => {
    historyList.current = list;
    if (config.enbHistory !== false) {
      localStorage.setItem('newTabsHistory', JSON.stringify(list));
      setStorage('newTabsHistory', list);
    }
  };

  const onKeyDown = async (e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        await onChat();
      } else {
        onSearch(inputValue);
      }
    }
  };

  const onInput = (e) => setInputValue(e.target.value);

  const canAccess = (url) =>
    fetchWithTimeout(url, { method: 'HEAD', mode: 'no-cors' }, 800)
      .then(() => true)
      .catch(() => false);

  const pickEngines = () => {
    if (config.useSearchType) {
      const one = engines.find((e) => e.name === config.useSearchType);
      return one ? [one] : engines;
    }
    if (config.usBaidu) return engines;
    return engines.filter((e) => !e.notDefaut);
  };

  const onSearch = async (keyword) => {
    setSearchState('search');
    setAiReply('');
    if (!keyword) return message.info('请输入');
    setInputValue(keyword);

    const ordered = pickEngines();
    let chosen = null;
    for (const e of ordered) {
      const ok = await canAccess(e.test);
      if (ok) {
        chosen = e;
        break;
      }
    }
    // 探测失败时降级 Bing → 百度
    if (!chosen) {
      chosen = engines.find((e) => e.name === 'bing') || engines.find((e) => e.name === 'baidu') || ordered[0];
    }
    if (!chosen) {
      message.info('网络连接异常,请检查网络!');
      return;
    }

    try {
      if (config.enbHistory !== false) {
        if (historyList.current?.some?.((_) => _.content === keyword)) {
          historyList.current = historyList.current.map((_) =>
            _.content === keyword
              ? {
                  ..._,
                  time: Date.now(),
                  type: chosen.name === 'google' ? 'G' : chosen.name === 'bing' ? 'B' : 'O',
                }
              : _,
          );
        } else {
          historyList.current.push({
            content: keyword.length > 200 ? keyword.slice(0, 200) : keyword,
            time: Date.now(),
            type: chosen.name === 'google' ? 'G' : chosen.name === 'bing' ? 'B' : 'O',
          });
        }
        persistHistory(historyList.current);
        setHistory((prev) => ({
          ...prev,
          list: historyList.current
            .filter((_) => !keyword || _?.content?.includes(keyword))
            .sort((a, b) => b?.time - a?.time),
        }));
      }
    } catch {
      // ignore
    }
    window.open(chosen.search(keyword), '_blank');
  };

  const open = async (record) => onSearch(record?.content);

  const onChat = async () => {
    if (!inputValue.trim()) return message.info('请输入对话内容');
    if (!config.apiKey && !config.apiBase) {
      message.warning('请先在设置中配置 AI 接口');
      return;
    }
    setSearchState('aiChat');
    setAiLoading(true);
    setAiReply('');
    try {
      const data = await chat(inputValue, config);
      const text =
        data?.reply ||
        data?.choices?.[0]?.message?.content ||
        data?.content ||
        (typeof data === 'string' ? data : JSON.stringify(data));
      setAiReply(text || '（无回复）');
    } catch (err) {
      setAiReply('');
      message.error(err?.message || 'AI 请求失败');
    } finally {
      setAiLoading(false);
    }
  };

  const deleteHistory = (record) => {
    revokeAll();
    const next = historyList.current?.filter?.((_) => _.time !== record.time) || [];
    persistHistory(next);
    setHistory((prev) => ({
      ...prev,
      show: true,
      list: next.sort((a, b) => b?.time - a?.time),
    }));
    inputRef.current?.focus();
  };

  const clearAllHistory = () => {
    persistHistory([]);
    setHistory((prev) => ({ ...prev, list: [] }));
    message.success('已清空插件历史');
  };

  const saveConfig = async (values) => {
    const next = { ...config, ...values };
    setConfig(next);
    await setStorage('newTabConfig', next);
    message.success('设置已保存');
  };

  useEffect(() => {
    (async () => {
      try {
        const cfg = await getStorage('newTabConfig');
        if (cfg) setConfig({ ...DEFAULT_CONFIG, ...cfg });
        const storageData =
          (await getStorage('newTabsHistory')) ||
          JSON.parse(localStorage.getItem('newTabsHistory') || 'null');
        const list = Array.isArray(storageData) ? storageData : [];
        historyList.current = list;
        setHistory((prev) => ({ ...prev, list: [...list].sort((a, b) => b?.time - a?.time) }));
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    setHistory((prev) => ({
      ...prev,
      list: !inputValue
        ? [...historyList.current].sort((a, b) => b?.time - a?.time)
        : historyList.current
            ?.filter?.((_) => _?.content?.includes(inputValue))
            .sort((a, b) => b?.time - a?.time),
    }));
  }, [inputValue]);

  const inputOnBlur = () => {
    revokeAll();
    addMask(undefined, 200, () => {
      setHistory((prev) => ({ ...prev, show: false }));
    });
  };

  const showAi = !!(config.apiKey || config.apiBase);

  return (
    <div className={styles.Box}>
      <SettingModal
        engines={engines}
        config={config}
        saveConfig={saveConfig}
        onClearHistory={clearAllHistory}
      />
      <div className={styles.hero}>
        <div className={styles.mark} aria-hidden>
          Z
        </div>
        <h1 className={styles.brand}>ZIYE</h1>
        <p className={styles.sub}>搜索 · 历史 · AI 对话</p>
      </div>
      <div className={`${styles.searchBox} ${searchState === 'search' ? '' : styles.aiChatInputBox}`}>
        <div className={styles.inputBox}>
          <input
            type="text"
            value={inputValue}
            ref={inputRef}
            placeholder={showAi ? '回车搜索，Ctrl+回车 AI 对话' : '回车搜索'}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onBlur={inputOnBlur}
            onFocus={() => setHistory((prev) => ({ ...prev, show: true }))}
          />
          {history?.show && (
            <div className={`${styles.inputHistory} ${searchState === 'aiChat' ? styles.aiInputHistory : ''}`}>
              <div className={styles.historySetting}></div>
              <div className={styles.schistory}>
                {history?.list?.length ? (
                  history.list.map((_) => (
                    <div className={styles.histItem} key={_.time}>
                      <span className={styles.historyContent} onClick={() => open(_)}>
                        {_.content}
                      </span>
                      <span className={styles.historyTime}>{isNaN(_.time) ? _.time : timeAgo(_.time)}</span>
                      <span>{_.type}</span>
                      <DeleteOutlined className={styles.historyDelete} onClick={() => deleteHistory(_)} />
                      <SelectOutlined
                        className={styles.historyDelete}
                        onClick={() => {
                          revokeAll();
                          inputRef.current?.focus();
                          setInputValue(_.content);
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className={styles.noHistory}>没有相关历史记录</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.buttonGrunp}>
          <button onClick={() => onSearch(inputValue)}>
            <span>搜索</span>
            <span className={styles['rainbow-text']}>GOOGLE</span>
            <span className={styles.bingSearchSpan}>BING</span>
          </button>
          {showAi && (
            <button onClick={onChat} disabled={aiLoading}>
              {aiLoading ? '请求中…' : 'AI 对话'}
            </button>
          )}
        </div>
      </div>
      {aiReply && <div className={styles.aiReply}>{aiReply}</div>}
    </div>
  );
}
