import React from 'react';
import { CheckCircleTwoTone } from '@ant-design/icons'
import styles from './index.module.css'
import { Switch, Tabs } from 'antd';
import Translate from '../../components/Translate';
import AgentBar from '../../components/AgentBar';

const items = [
  { label: '翻译', key: 'translate', children: <Translate /> },
  { label: '代理', key: 'proxy', children: <AgentBar /> },
  { label: '搜索精简', key: 'searchSimplify', children: <>搜索精简</> },
  { label: '二维码转换', key: 'tool', children: <>二维码转换</> },
  { label: '主题', key: 'theme', children: <>主题</> },
  { label: '中间脚本', key: 'therJobo', children: <>中间脚本</> },


];
export default function LayoutContent() {

  return (
    <div className={styles.layout_content}>
      <Tabs items={items} defaultActiveKey='translate' className={styles.tabs} />
    </div>
  );
}
