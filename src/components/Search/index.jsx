import { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import { fetchWithTimeout } from '../../lib/baseApi';
import { chat } from './aiTool';
import { timeAgo } from '../../lib/time';
import {
  CloseOutlined,
  DeleteOutlined,
  PictureOutlined,
  SaveOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import { SettingModal } from './SettingModal';
import ChatPanel from './ChatPanel';
import BookmarkBar from './BookmarkBar';
import FlipClock from './FlipClock';
import useRevoke from '../../hooks/useRevoke';
import { message } from 'antd';
import { getStorage, setStorage } from '../../lib/storege';
import { DEFAULT_PROVIDER_ID, getProvider, inferProviderId } from '../../lib/aiProviders';
import { buildUserContent, collectImagesFromList } from '../../lib/chatMedia';
import { sessionTitle, slimMessagesForHistory } from '../../lib/chatSession';

const engines = [
  { name: 'google', test: 'https://www.google.com/favicon.ico', search: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { name: 'bing', test: 'https://www.bing.com/favicon.ico', search: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { name: 'baidu', test: 'https://www.baidu.com/favicon.ico', search: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`, notDefaut: true },
];

const defaultProvider = getProvider(DEFAULT_PROVIDER_ID);

const DEFAULT_CONFIG = {
  provider: DEFAULT_PROVIDER_ID,
  apiKey: '',
  apiBase: defaultProvider.apiBase,
  model: defaultProvider.defaultModel,
  messages: [],
  savedApiKeys: [],
  enbHistory: true,
  usBaidu: false,
  useSearchType: '',
};

/** 持久化设置时不写 messages（新标签页始终新对话） */
async function persistSettings(cfg) {
  const { messages: _m, ...rest } = cfg;
  await setStorage('newTabConfig', { ...rest, messages: [] });
}

export default function Search() {
  const inputRef = useRef();
  const fileRef = useRef();
  const { addMask, revokeAll } = useRevoke();
  const [searchState, setSearchState] = useState('search');
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState({ show: false, list: [] });
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [messages, setMessages] = useState([]);
  const [streamText, setStreamText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef(null);
  const historyList = useRef([]);
  const dragDepth = useRef(0);

  const isAi = searchState === 'aiChat';
  const showAi = !!config.apiKey?.trim();
  const hasChat = messages.length > 0;

  const persistHistory = (list) => {
    historyList.current = list;
    if (config.enbHistory !== false) {
      localStorage.setItem('newTabsHistory', JSON.stringify(list));
      setStorage('newTabsHistory', list);
    }
  };

  const refreshHistoryList = (keyword = inputValue) => {
    const all = [...historyList.current].sort((a, b) => b?.time - a?.time);
    setHistory((prev) => ({
      ...prev,
      list: !keyword
        ? all
        : all.filter((_) => _?.content?.includes(keyword)),
    }));
  };

  const enterAiMode = () => setSearchState('aiChat');
  const enterSearchMode = () => setSearchState('search');

  // Esc：从对话态回到搜索主界面
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (searchState !== 'aiChat') return;
      // 设置弹窗打开时交给 Modal 自己处理 Esc
      if (document.querySelector('.ant-modal-wrap')) return;
      e.preventDefault();
      enterSearchMode();
      setHistory((prev) => ({ ...prev, show: false }));
      setPendingImages([]);
      setStreamText('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchState]);

  const addImages = async (fileList) => {
    try {
      const imgs = await collectImagesFromList(fileList);
      if (!imgs.length) {
        message.info('未识别到图片（支持 PNG/JPG/GIF/WEBP）');
        return;
      }
      setPendingImages((prev) => {
        const next = [...prev, ...imgs].slice(0, 5);
        if (prev.length + imgs.length > 5) message.info('一次最多 5 张图片');
        return next;
      });
      enterAiMode();
      setHistory((prev) => ({ ...prev, show: false }));
    } catch (err) {
      message.error(err?.message || '图片处理失败');
    }
  };

  const removeImage = (id) => {
    setPendingImages((prev) => prev.filter((i) => i.id !== id));
  };

  const onKeyDown = async (e) => {
    if (e.key !== 'Enter') return;

    if (isAi) {
      e.preventDefault();
      await onChat();
      return;
    }

    if (e.ctrlKey || pendingImages.length) {
      e.preventDefault();
      await onChat();
    } else {
      onSearch(inputValue);
    }
  };

  const onPaste = async (e) => {
    if (!showAi) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.type?.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      await addImages(files);
    }
  };

  const onDragEnter = (e) => {
    if (!showAi) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };

  const onDragLeave = (e) => {
    if (!showAi) return;
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDragOver = (e) => {
    if (!showAi) return;
    e.preventDefault();
  };

  const onDrop = async (e) => {
    if (!showAi) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    await addImages(e.dataTransfer?.files);
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
    enterSearchMode();
    setStreamText('');
    setHistory((prev) => ({ ...prev, show: false }));

    if (!keyword?.trim()) {
      // 仅切回搜索界面
      return;
    }
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
    if (!chosen) {
      chosen = engines.find((e) => e.name === 'bing') || engines.find((e) => e.name === 'baidu') || ordered[0];
    }
    if (!chosen) {
      message.info('网络连接异常,请检查网络!');
      return;
    }

    try {
      if (config.enbHistory !== false) {
        if (historyList.current?.some?.((_) => _.type !== 'AI' && _.content === keyword)) {
          historyList.current = historyList.current.map((_) =>
            _.type !== 'AI' && _.content === keyword
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
        refreshHistoryList(keyword);
      }
    } catch {
      // ignore
    }
    window.open(chosen.search(keyword), '_blank');
  };

  const openHistory = async (record) => {
    if (record?.type === 'AI' && Array.isArray(record.messages)) {
      setMessages(record.messages);
      setStreamText('');
      setPendingImages([]);
      enterAiMode();
      setHistory((prev) => ({ ...prev, show: false }));
      return;
    }
    onSearch(record?.content);
  };

  const onChat = async () => {
    if (!inputValue.trim() && !pendingImages.length) {
      return message.info('请输入内容或添加图片');
    }
    if (!config.apiKey?.trim()) {
      message.warning('请先在设置中填写 API Key');
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const images = [...pendingImages];
    const prompt = inputValue;
    const userContent = buildUserContent(prompt, images);
    const prevMessages = messages;
    const withUser = [...prevMessages, { role: 'user', content: userContent }];

    setPendingImages([]);
    setInputValue('');
    enterAiMode();
    setHistory((prev) => ({ ...prev, show: false }));
    setMessages(withUser);
    setAiLoading(true);
    setStreamText('');
    try {
      const data = await chat({
        ...config,
        messages: withUser,
        signal: ac.signal,
        onDelta: (_chunk, full) => setStreamText(full),
      });
      setStreamText('');
      setMessages(data?.messages || withUser);
    } catch (err) {
      if (err?.name === 'AbortError' || /已取消/.test(err?.message || '')) return;
      setMessages(prevMessages);
      message.error(err?.message || 'AI 请求失败');
    } finally {
      setAiLoading(false);
    }
  };

  const onSaveChat = async () => {
    if (!messages.length) return message.info('当前没有可保存的对话');
    const title = sessionTitle(messages);
    const record = {
      content: title,
      time: Date.now(),
      type: 'AI',
      messages: slimMessagesForHistory(messages),
    };
    historyList.current = [record, ...historyList.current.filter((h) => !(h.type === 'AI' && h.content === title))];
    persistHistory(historyList.current);
    refreshHistoryList();
    message.success('对话已保存到历史');
  };

  const onNewChat = async () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamText('');
    setPendingImages([]);
    enterAiMode();
    message.success('已开始新对话');
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
    await persistSettings(next);
  };

  useEffect(() => {
    (async () => {
      try {
        const cfg = await getStorage('newTabConfig');
        if (cfg) {
          const { agentId: _drop, messages: _oldMsg, ...rest } = cfg;
          const provider = rest.provider || inferProviderId(rest.apiBase) || DEFAULT_PROVIDER_ID;
          const p = getProvider(provider);
          setConfig({
            ...DEFAULT_CONFIG,
            ...rest,
            provider,
            apiBase: provider === 'custom' ? rest.apiBase || '' : p.apiBase,
            model: rest.model || p.defaultModel,
            messages: [],
          });
        }
        // 新页面：不展开上次对话
        setMessages([]);
        setSearchState('search');

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
    refreshHistoryList(inputValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const inputOnBlur = () => {
    revokeAll();
    addMask(undefined, 200, () => {
      setHistory((prev) => ({ ...prev, show: false }));
    });
  };

  return (
    <div
      className={`${styles.Box} ${isAi ? styles.BoxAi : styles.BoxSearch}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <BookmarkBar />
      <FlipClock />
      {dragging && showAi && (
        <div className={styles.dropMask}>
          <div className={styles.dropCard}>将图片拖放到此处，加入对话</div>
        </div>
      )}
      <SettingModal
        engines={engines}
        config={config}
        saveConfig={saveConfig}
        onClearHistory={clearAllHistory}
      />

      <div className={styles.stage}>
        <div className={styles.hero}>
          <div className={styles.mark} aria-hidden>
            Z
          </div>
          <h1 className={styles.brand}>ZIYE</h1>
          <p className={styles.sub}>搜索 · 书签 · AI 对话</p>
        </div>

        <div className={styles.chatArea}>
          <ChatPanel messages={messages} streamingText={streamText} loading={aiLoading} />
        </div>

        <div className={`${styles.searchBox} ${isAi ? styles.aiChatInputBox : ''}`}>
          {!!pendingImages.length && (
            <div className={styles.attachRow}>
              {pendingImages.map((img) => (
                <div key={img.id} className={styles.attachItem}>
                  <img src={img.dataUrl} alt={img.name} />
                  <button type="button" className={styles.attachRemove} onClick={() => removeImage(img.id)}>
                    <CloseOutlined />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={styles.inputBox}>
            <input
              type="text"
              value={inputValue}
              ref={inputRef}
              className={showAi ? styles.inputWithAttach : undefined}
              placeholder={
                isAi
                  ? '回车发送 · Esc 返回搜索 · 可拖拽/粘贴图片'
                  : showAi
                    ? '回车搜索 · Ctrl+回车进入对话'
                    : '回车搜索 · 设置中填写 API Key 启用对话'
              }
              onInput={onInput}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onBlur={inputOnBlur}
              onFocus={() => setHistory((prev) => ({ ...prev, show: true }))}
            />
            {showAi && (
              <>
                <button
                  type="button"
                  className={styles.attachBtn}
                  title="上传图片"
                  onClick={() => fileRef.current?.click()}
                >
                  <PictureOutlined />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  multiple
                  hidden
                  onChange={async (e) => {
                    await addImages(e.target.files);
                    e.target.value = '';
                  }}
                />
              </>
            )}
            {history?.show && !pendingImages.length && (
              <div className={`${styles.inputHistory} ${isAi ? styles.aiInputHistory : ''}`}>
                <div className={styles.historySetting}></div>
                <div className={styles.schistory}>
                  {history?.list?.length ? (
                    history.list.map((_) => (
                      <div className={styles.histItem} key={_.time}>
                        <span className={styles.historyContent} onClick={() => openHistory(_)}>
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
                            if (_.type === 'AI') openHistory(_);
                            else setInputValue(_.content);
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
            <button type="button" className={styles.btnSearch} onClick={() => onSearch(inputValue)}>
              <span>搜索</span>
              <span className={styles['rainbow-text']}>GOOGLE</span>
              <span className={styles.bingSearchSpan}>BING</span>
            </button>
            {showAi && (
              <button type="button" onClick={onChat} disabled={aiLoading}>
                {aiLoading ? '生成中…' : isAi ? '发送' : 'AI 对话'}
              </button>
            )}
            {showAi && hasChat && (
              <button type="button" onClick={onSaveChat} disabled={aiLoading} title="保存到历史">
                <SaveOutlined /> 保存对话
              </button>
            )}
            {showAi && (hasChat || isAi) && (
              <button type="button" onClick={onNewChat} disabled={aiLoading}>
                新对话
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
