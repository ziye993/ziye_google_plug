/**
 * 调用本地 / 自定义 AI 聊天接口
 * @param {string} info 用户输入
 * @param {{ apiKey?: string, apiBase?: string }} config
 */
export const chat = async (info, config = {}) => {
  const url = config.apiBase || 'http://localhost:30000/api/ai/chat';
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [{ role: 'user', content: info || '' }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI 接口错误 (${response.status})`);
  }
  return response.json();
};
