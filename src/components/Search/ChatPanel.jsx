import { useEffect, useRef } from 'react';
import { parseMessageContent } from '../../lib/chatMedia';
import ChatMarkdown from './ChatMarkdown';
import styles from './ChatPanel.module.less';

function MessageBubble({ msg, streaming }) {
  const { text, images } = parseMessageContent(msg.content);
  const isUser = msg.role === 'user';

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAi}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>
        {!!images.length && (
          <div className={styles.imgRow}>
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className={styles.thumb} />
            ))}
          </div>
        )}
        {isUser ? (
          text ? <div className={styles.plain}>{text}</div> : null
        ) : (
          <ChatMarkdown content={text || (streaming ? '…' : '（无回复）')} />
        )}
        {streaming && <span className={styles.caret} aria-hidden />}
      </div>
    </div>
  );
}

/**
 * 对话列表：Markdown / 代码块 / 图片缩略图
 */
export default function ChatPanel({ messages = [], streamingText, loading }) {
  const endRef = useRef(null);
  const list = [...messages];
  if (loading && (streamingText || streamingText === '')) {
    // 流式中追加临时 assistant（有内容才替换「思考中」占位）
    if (streamingText) {
      list.push({ role: 'assistant', content: streamingText });
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [list.length, streamingText]);

  if (!list.length && !loading) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.scroll}>
        {list.map((msg, i) => (
          <MessageBubble
            key={`${msg.role}-${i}`}
            msg={msg}
            streaming={loading && i === list.length - 1 && msg.role === 'assistant'}
          />
        ))}
        {loading && !streamingText && list[list.length - 1]?.role !== 'assistant' && (
          <div className={`${styles.row} ${styles.rowAi}`}>
            <div className={`${styles.bubble} ${styles.bubbleAi}`}>
              <span className={styles.thinking}>思考中…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
