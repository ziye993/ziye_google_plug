import React from 'react';
import { CheckCircleTwoTone } from '@ant-design/icons'
import styles from './index.module.css'
import { Switch, Tabs } from 'antd';
import Translate from '../../components/Translate';
import AgentBar from '../../components/AgentBar';
import QrCodeTranslate from '../../components/QrCodeTranslate';
import SearchSimplifyBar from '../../components/SearchSimplifyBar';
import ThemeBar from '../../components/ThemeBar';

const items = [
  { label: '翻译', key: 'translate', children: <Translate /> },
  { label: '搜索精简', key: 'searchSimplify', children: <SearchSimplifyBar /> },
  { label: '二维码转换', key: 'tool', children: <QrCodeTranslate /> },
  { label: '主题', key: 'theme', children: <ThemeBar /> },
  { label: '中间脚本', key: 'therJobo', children: <>中间脚本</> },
  { label: '代理', key: 'proxy', children: <AgentBar /> },

];
export default function LayoutContent() {

  return (
    <div className={styles.layout_content}>
      <Tabs items={items} defaultActiveKey='translate' className={styles.tabs} />
    </div>
  );
}
