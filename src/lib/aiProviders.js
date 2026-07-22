/** 常见 OpenAI 兼容服务商预设：选厂商 + 贴 Key 即可 */

export const AI_PROVIDERS = [
  {
    id: 'openai',
    label: 'OpenAI',
    apiBase: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o mini（推荐·快）' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
      { value: 'gpt-4.1', label: 'GPT-4.1' },
      { value: 'o4-mini', label: 'o4-mini' },
    ],
    keyHint: 'sk-proj-... 或 sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    apiBase: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat（推荐）' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
    keyHint: 'sk-...',
    keyUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'moonshot',
    label: '月之暗面 Kimi',
    apiBase: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: [
      { value: 'moonshot-v1-8k', label: 'moonshot-v1-8k（推荐）' },
      { value: 'moonshot-v1-32k', label: 'moonshot-v1-32k' },
      { value: 'moonshot-v1-128k', label: 'moonshot-v1-128k' },
      { value: 'kimi-latest', label: 'kimi-latest' },
    ],
    keyHint: 'sk-...',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
  },
  {
    id: 'qwen',
    label: '通义千问',
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: [
      { value: 'qwen-plus', label: 'qwen-plus（推荐）' },
      { value: 'qwen-turbo', label: 'qwen-turbo（更快）' },
      { value: 'qwen-max', label: 'qwen-max' },
      { value: 'qwen-long', label: 'qwen-long' },
    ],
    keyHint: 'sk-...',
    keyUrl: 'https://dashscope.console.aliyun.com/apiKey',
  },
  {
    id: 'zhipu',
    label: '智谱 GLM',
    apiBase: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    models: [
      { value: 'glm-4-flash', label: 'GLM-4-Flash（推荐·快）' },
      { value: 'glm-4-air', label: 'GLM-4-Air' },
      { value: 'glm-4-plus', label: 'GLM-4-Plus' },
      { value: 'glm-4', label: 'GLM-4' },
    ],
    keyHint: '...',
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
  },
  {
    id: 'siliconflow',
    label: '硅基流动',
    apiBase: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: [
      { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek-V3（推荐）' },
      { value: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek-R1' },
      { value: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen2.5-7B' },
      { value: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen2.5-72B' },
    ],
    keyHint: 'sk-...',
    keyUrl: 'https://cloud.siliconflow.cn/account/ak',
  },
  {
    id: 'groq',
    label: 'Groq',
    apiBase: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B（推荐）' },
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
      { value: 'gemma2-9b-it', label: 'Gemma2 9B' },
    ],
    keyHint: 'gsk_...',
    keyUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    apiBase: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: [
      { value: 'openai/gpt-4o-mini', label: 'GPT-4o mini（推荐）' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
      { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    ],
    keyHint: 'sk-or-...',
    keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'custom',
    label: '自定义（OpenAI 兼容）',
    apiBase: '',
    defaultModel: 'gpt-4o-mini',
    models: [
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { value: 'gpt-4o', label: 'gpt-4o' },
      { value: 'deepseek-chat', label: 'deepseek-chat' },
    ],
    keyHint: '服务商提供的 Key',
    needBase: true,
  },
];

export const DEFAULT_PROVIDER_ID = 'openai';

export function getProvider(id) {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0];
}

export function providerOptions() {
  return AI_PROVIDERS.map((p) => ({ label: p.label, value: p.id }));
}

/** 根据已存 apiBase 反推服务商（兼容旧配置） */
export function inferProviderId(apiBase) {
  const base = String(apiBase || '')
    .trim()
    .replace(/\/+$/, '')
    .toLowerCase();
  if (!base) return DEFAULT_PROVIDER_ID;
  const hit = AI_PROVIDERS.find(
    (p) => p.id !== 'custom' && p.apiBase && base.includes(p.apiBase.replace(/\/+$/, '').toLowerCase().replace(/^https?:\/\//, '')),
  );
  if (hit) return hit.id;
  // 宽松匹配主机名
  for (const p of AI_PROVIDERS) {
    if (p.id === 'custom' || !p.apiBase) continue;
    try {
      const host = new URL(p.apiBase).host;
      if (base.includes(host)) return p.id;
    } catch {
      // ignore
    }
  }
  return 'custom';
}

/** 解析最终请求用的 apiBase / model */
export function resolveChatEndpoint(config = {}) {
  const providerId = config.provider || inferProviderId(config.apiBase) || DEFAULT_PROVIDER_ID;
  const provider = getProvider(providerId);
  const apiBase =
    providerId === 'custom'
      ? config.apiBase || provider.apiBase
      : provider.apiBase || config.apiBase;
  const model = config.model || provider.defaultModel;
  return { providerId, provider, apiBase, model };
}
