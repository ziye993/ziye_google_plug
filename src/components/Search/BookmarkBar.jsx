import { useEffect, useState } from 'react';
import { FolderOutlined, RightOutlined } from '@ant-design/icons';
import styles from './BookmarkBar.module.less';

function faviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=32`;
  } catch {
    return '';
  }
}

function openUrl(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** 菜单内一行：书签或子文件夹（竖排） */
function MenuRow({ node }) {
  const isFolder = !node.url && Array.isArray(node.children);

  if (isFolder) {
    return (
      <div className={`${styles.row} ${styles.folderRow}`}>
        <button type="button" className={styles.rowBtn} tabIndex={0}>
          <FolderOutlined className={styles.icon} />
          <span className={styles.title}>{node.title || '文件夹'}</span>
          <RightOutlined className={styles.arrow} />
        </button>
        <div className={`${styles.menu} ${styles.menuSide}`} role="menu">
          {(node.children || []).length ? (
            node.children.map((child) => <MenuRow key={child.id} node={child} />)
          ) : (
            <div className={styles.empty}>空文件夹</div>
          )}
        </div>
      </div>
    );
  }

  if (!node.url) return null;

  return (
    <a
      className={`${styles.row} ${styles.linkRow}`}
      href={node.url}
      title={node.title || node.url}
      role="menuitem"
      onClick={(e) => {
        e.preventDefault();
        openUrl(node.url);
      }}
    >
      {faviconUrl(node.url) ? (
        <img className={styles.fav} src={faviconUrl(node.url)} alt="" />
      ) : (
        <span className={styles.favFallback} />
      )}
      <span className={styles.title}>{node.title || node.url}</span>
    </a>
  );
}

/** 顶栏一项：链接或文件夹（文件夹悬停向下竖排展开） */
function TopItem({ node }) {
  const isFolder = !node.url && Array.isArray(node.children);

  if (isFolder) {
    return (
      <div className={`${styles.topItem} ${styles.topFolder}`}>
        <button type="button" className={styles.chip} tabIndex={0}>
          <FolderOutlined className={styles.icon} />
          <span className={styles.title}>{node.title || '文件夹'}</span>
        </button>
        <div className={`${styles.menu} ${styles.menuDown}`} role="menu">
          {(node.children || []).length ? (
            node.children.map((child) => <MenuRow key={child.id} node={child} />)
          ) : (
            <div className={styles.empty}>空文件夹</div>
          )}
        </div>
      </div>
    );
  }

  if (!node.url) return null;

  return (
    <a
      className={`${styles.topItem} ${styles.topLink}`}
      href={node.url}
      title={node.title || node.url}
      onClick={(e) => {
        e.preventDefault();
        openUrl(node.url);
      }}
    >
      {faviconUrl(node.url) ? (
        <img className={styles.fav} src={faviconUrl(node.url)} alt="" />
      ) : (
        <span className={styles.favFallback} />
      )}
      <span className={styles.title}>{node.title || node.url}</span>
    </a>
  );
}

/**
 * 顶部横排书签栏（接近 Chrome 原生）：
 * 顶栏横排；文件夹悬停竖排下拉；子文件夹悬停向右展开
 */
export default function BookmarkBar() {
  const [roots, setRoots] = useState([]);

  useEffect(() => {
    const load = () => {
      try {
        if (!chrome?.bookmarks?.getTree) return;
        chrome.bookmarks.getTree((tree) => {
          const root = tree?.[0];
          if (!root?.children?.length) {
            setRoots([]);
            return;
          }
          const bar =
            root.children.find((c) => c.id === '1') ||
            root.children.find((c) => Array.isArray(c.children)) ||
            root.children[0];
          setRoots(Array.isArray(bar?.children) ? bar.children : []);
        });
      } catch {
        setRoots([]);
      }
    };
    load();
    if (!chrome?.bookmarks?.onCreated) return undefined;
    const refresh = () => load();
    chrome.bookmarks.onCreated.addListener(refresh);
    chrome.bookmarks.onRemoved.addListener(refresh);
    chrome.bookmarks.onChanged.addListener(refresh);
    chrome.bookmarks.onMoved.addListener(refresh);
    return () => {
      chrome.bookmarks.onCreated.removeListener(refresh);
      chrome.bookmarks.onRemoved.removeListener(refresh);
      chrome.bookmarks.onChanged.removeListener(refresh);
      chrome.bookmarks.onMoved.removeListener(refresh);
    };
  }, []);

  if (!roots.length) return null;

  return (
    <div className={styles.bar} role="navigation" aria-label="书签栏">
      <div className={styles.track}>
        {roots.map((node) => (
          <TopItem key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
