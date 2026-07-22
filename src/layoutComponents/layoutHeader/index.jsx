import { useEffect, useState } from 'react';
import styles from './index.module.css';
import { Switch } from 'antd';
import { getStorage, setStorage } from '../../lib/storege';

const VERSION = '1.0.0';

export default function LayoutHeader() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    getStorage('extensionEnabled').then((v) => {
      setEnabled(v !== false);
    });
  }, []);

  const onToggle = (checked) => {
    setEnabled(checked);
    setStorage('extensionEnabled', checked);
  };

  return (
    <header className={styles.layout_header}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden>
          Z
        </span>
        <div className={styles.brandText}>
          <h1 className={styles.name}>ZIYE</h1>
          <p className={styles.tagline}>工具箱 · 翻译 / 过滤 / 主题 / 代理</p>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.power}>
          <span className={styles.powerLabel}>{enabled ? '已启用' : '已暂停'}</span>
          <Switch checked={enabled} onChange={onToggle} size="small" />
        </div>
        <span className={styles.vision}>v{VERSION}</span>
      </div>
    </header>
  );
}
