/** 会话摘要与瘦身，避免把大图塞满 storage */

import { parseMessageContent } from './chatMedia';

export function sessionTitle(messages = []) {
  for (const m of messages) {
    if (m?.role !== 'user') continue;
    const { text } = parseMessageContent(m.content);
    const t = (text || '').trim();
    if (t) return t.length > 60 ? `${t.slice(0, 60)}…` : t;
  }
  return '未命名对话';
}

/** 历史里图片替换为占位，减小体积；恢复时仍可读上下文 */
export function slimMessagesForHistory(messages = []) {
  return messages.map((m) => {
    if (typeof m.content === 'string') return m;
    if (!Array.isArray(m.content)) return m;
    const next = m.content.map((part) => {
      if (part?.type === 'image_url') {
        return { type: 'text', text: '[图片]' };
      }
      return part;
    });
    // 合并连续 text
    const merged = [];
    for (const p of next) {
      if (p.type === 'text' && merged.length && merged[merged.length - 1].type === 'text') {
        merged[merged.length - 1].text += `\n${p.text}`;
      } else {
        merged.push({ ...p });
      }
    }
    return {
      ...m,
      content: merged.length === 1 && merged[0].type === 'text' ? merged[0].text : merged,
    };
  });
}
