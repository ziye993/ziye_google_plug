import React from 'react';
import { CheckCircleTwoTone } from '@ant-design/icons'
import styles from './index.module.css'
import { Switch } from 'antd';

console.log(styles)
export default function LayoutHeader() {

  return (
    <div className={styles.layout_header}>
      <span className={styles.head_info} >
        <span className={styles.name}>ziye_google_plug</span>
        <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '14px', transform: 'translateY(-4px)' }} />
      </span>
      <div className={styles.vision_and_switch}>
        <span className={styles.vision_and_switch_content}>
          <Switch className={styles.switch_span} checkedChildren={"开"} unCheckedChildren={'关'} />
          <span className={styles.vision}>| vision: 0.0.1</span>
        </span>
      </div>
    </div>
  );
}
