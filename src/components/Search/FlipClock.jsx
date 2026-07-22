import { useEffect, useState } from 'react';
import FlipNumbers from 'react-flip-numbers';
import styles from './FlipClock.module.less';

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * 右下角复古翻页时钟（react-flip-numbers）
 * 格式：
 *   YYYY MM DD
 *   HH:MM:SS
 * 高度约 30px，青绿主题
 */
export default function FlipClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = `${now.getFullYear()} ${pad2(now.getMonth() + 1)} ${pad2(now.getDate())}`;
  const timeStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  const digitProps = {
    height: 11,
    width: 7,
    color: '#0a5c56',
    background: 'linear-gradient(180deg, #f7fbfa, #e6efed)',
    play: true,
    perspective: 80,
    duration: 0.35,
    numberStyle: {
      fontFamily: "'IBM Plex Mono', Consolas, monospace",
      fontWeight: 700,
      fontSize: 9,
    },
    nonNumberStyle: {
      fontFamily: "'IBM Plex Mono', Consolas, monospace",
      fontWeight: 600,
      fontSize: 9,
      color: '#0f766e',
      background: 'transparent',
      padding: '0 1px',
    },
  };

  return (
    <div className={styles.wrap} aria-hidden>
      <div className={styles.line}>
        <FlipNumbers {...digitProps} numbers={dateStr} />
      </div>
      <div className={styles.line}>
        <FlipNumbers {...digitProps} numbers={timeStr} />
      </div>
    </div>
  );
}
