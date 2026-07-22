import { useMemo, useState } from 'react';
import styles from './index.module.css';
import Translate from '../../components/Translate';
import AgentBar from '../../components/AgentBar';
import QrCodeTranslate from '../../components/QrCodeTranslate';
import SearchSimplifyBar from '../../components/SearchSimplifyBar';
import ThemeBar from '../../components/ThemeBar';
import AgentScript from '../../components/AgentScript';

const TABS = [
  { key: 'translate', label: '翻译', children: <Translate /> },
  { key: 'tool', label: '二维码', children: <QrCodeTranslate /> },
  { key: 'searchSimplify', label: '搜索精简', children: <SearchSimplifyBar /> },
  { key: 'theme', label: '主题', children: <ThemeBar /> },
  { key: 'agentScript', label: '中间脚本', children: <AgentScript /> },
  { key: 'proxy', label: '代理规则', children: <AgentBar /> },
];

export default function LayoutContent() {
  const [tabKey, setTabKey] = useState('translate');

  const activeItem = useMemo(
    () => TABS.find((i) => i.key === tabKey) || TABS[0],
    [tabKey],
  );

  return (
    <div className={styles.layout_content}>
      <nav className={styles.mainNav} role="tablist" aria-label="功能">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={activeItem.key === item.key}
            className={`${styles.tabBtn} ${activeItem.key === item.key ? styles.tabBtnActive : ''}`}
            onClick={() => setTabKey(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div key={activeItem.key} className={styles.panelBody} role="tabpanel">
        {activeItem.children}
      </div>
    </div>
  );
}
