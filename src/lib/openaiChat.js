/**
 * OpenAI 兼容 Chat Completions（快，适合纯聊天）
 * 支持官方 OpenAI、以及任意兼容代理
 */

import { resolveChatEndpoint } from './aiProviders';

const DEFAULT_BASE = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * 规范化 base：
 * - 已有路径（/v1、/v4、compatible-mode/v1 等）原样保留
 * - 只写了域名时自动补 /v1
 */
export function normalizeBase(apiBase) {
  const raw = String(apiBase || DEFAULT_BASE).trim().replace(/\/+$/, '');
  try {
    const u = new URL(raw);
    if (!u.pathname || u.pathname === '/') return `${raw}/v1`;
    return raw;
  } catch {
    return raw;
  }
}

function authHeaders(apiKey) {
  return {
    Authorization: `Bearer ${String(apiKey || '').trim()}`,
    'Content-Type': 'application/json',
  };
}

async function readError(res) {
  let detail = '';
  try {
    const data = await res.json();
    detail = data?.error?.message || data?.message || JSON.stringify(data);
  } catch {
    try {
      detail = await res.text();
    } catch {
      detail = '';
    }
  }
  if (res.status === 401) return 'API Key 无效或未授权';
  if (res.status === 429) return '请求过于频繁或额度不足';
  return detail ? `AI 接口错误 (${res.status}): ${detail}` : `AI 接口错误 (${res.status})`;
}

/** 校验 Key：优先 /models；不支持列表的服务商退化为「可连通」提示 */
export async function verifyChatKey(config = {}) {
  const { apiKey } = config;
  if (!apiKey?.trim()) throw new Error('请先填写 API Key');
  const { apiBase } = resolveChatEndpoint(config);
  const base = normalizeBase(apiBase);
  const res = await fetch(`${base}/models`, {
    method: 'GET',
    headers: authHeaders(apiKey),
  });
  if (res.ok) return { ok: true, via: 'models', data: await res.json() };
  // 部分兼容站没有 /models，用极短非流式探测
  if (res.status === 404 || res.status === 405) {
    const probe = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify({
        model: resolveChatEndpoint(config).model || DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        stream: false,
      }),
    });
    if (probe.ok || probe.status === 400) {
      // 400 多为参数问题但 Key 往往已通过
      return { ok: true, via: 'chat' };
    }
    throw new Error(await readError(probe));
  }
  throw new Error(await readError(res));
}

/**
 * 流式对话
 * @returns {{ reply: string, messages: Array }}
 */
export async function openaiChat({
  apiKey,
  apiBase,
  model,
  provider,
  messages,
  onDelta,
  signal,
}) {
  if (!apiKey?.trim()) throw new Error('请先填写 API Key');
  if (!messages?.length) throw new Error('请输入对话内容');

  const resolved = resolveChatEndpoint({ apiKey, apiBase, model, provider });
  const url = `${normalizeBase(resolved.apiBase)}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(apiKey),
    signal,
    body: JSON.stringify({
      model: resolved.model?.trim() || DEFAULT_MODEL,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) throw new Error(await readError(res));
  if (!res.body) throw new Error('浏览器不支持流式响应');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onDelta?.(delta, full);
        }
      } catch {
        // ignore partial json
      }
    }
  }

  const nextMessages = [...messages, { role: 'assistant', content: full || '（无回复）' }];
  return { reply: full || '（无回复）', messages: nextMessages };
}
