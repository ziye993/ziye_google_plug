import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { useState } from 'react';
import styles from './ChatMarkdown.module.less';
import 'highlight.js/styles/github.css';

function CodeBlock({ className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] || '';
  const code = String(children || '').replace(/\n$/, '');
  const isBlock = Boolean(lang) || String(children || '').includes('\n');

  if (!isBlock) {
    return (
      <code className={styles.inlineCode} {...props}>
        {children}
      </code>
    );
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.codeWrap}>
      <div className={styles.codeBar}>
        <span className={styles.codeLang}>{lang || 'code'}</span>
        <button type="button" className={styles.copyBtn} onClick={onCopy}>
          {copied ? <CheckOutlined /> : <CopyOutlined />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className={styles.pre}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function ChatMarkdown({ content }) {
  if (!content) return null;
  return (
    <div className={styles.md}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
