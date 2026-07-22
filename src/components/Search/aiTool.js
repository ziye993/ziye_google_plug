import { openaiChat } from '../../lib/openaiChat';

/**
 * OpenAI 兼容聊天（支持文本 + 图片）
 * @param {{ apiKey?, apiBase?, model?, provider?, messages?, onDelta?, signal? }} config
 *   messages 须已包含本轮 user 消息
 */
export const chat = async (config = {}) => {
  const messages = Array.isArray(config.messages) ? config.messages : [];
  if (!messages.length) throw new Error('请输入内容或添加图片');
  return openaiChat({
    apiKey: config.apiKey,
    apiBase: config.apiBase,
    model: config.model,
    provider: config.provider,
    messages,
    onDelta: config.onDelta,
    signal: config.signal,
  });
};
