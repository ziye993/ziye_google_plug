/** 图片压缩为 data URL，便于多模态对话与本地存储 */

const ACCEPT = /^image\/(png|jpe?g|gif|webp)$/i;
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

export function isImageFile(file) {
  return file && ACCEPT.test(file.type || '');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * @param {File} file
 * @returns {Promise<{ id: string, name: string, mime: string, dataUrl: string }>}
 */
export async function fileToChatImage(file) {
  if (!isImageFile(file)) throw new Error('仅支持 PNG / JPG / GIF / WEBP');
  if (file.size > 12 * 1024 * 1024) throw new Error('单张图片请小于 12MB');

  const raw = await readAsDataURL(file);
  // gif 压缩会丢动画，原样保留（体积通常可接受）
  if (/image\/gif/i.test(file.type)) {
    return {
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: file.name || 'image.gif',
      mime: 'image/gif',
      dataUrl: raw,
    };
  }

  const img = await loadImage(raw);
  let { width, height } = img;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: (file.name || 'image').replace(/\.\w+$/, '') + '.jpg',
    mime: 'image/jpeg',
    dataUrl,
  };
}

/** 从 DataTransfer / FileList 提取图片 */
export async function collectImagesFromList(fileList) {
  const files = Array.from(fileList || []).filter(isImageFile);
  const out = [];
  for (const f of files.slice(0, 5)) {
    out.push(await fileToChatImage(f));
  }
  return out;
}

/**
 * 组装 OpenAI 多模态 user content
 * @param {string} text
 * @param {Array<{ dataUrl: string }>} images
 */
export function buildUserContent(text, images = []) {
  const trimmed = String(text || '').trim();
  if (!images.length) return trimmed;
  const parts = [];
  if (trimmed) parts.push({ type: 'text', text: trimmed });
  else parts.push({ type: 'text', text: '请描述这些图片。' });
  for (const img of images) {
    parts.push({
      type: 'image_url',
      image_url: { url: img.dataUrl },
    });
  }
  return parts;
}

/** 展示用：从 message.content 拆出文本与图片 */
export function parseMessageContent(content) {
  if (typeof content === 'string') {
    return { text: content, images: [] };
  }
  if (!Array.isArray(content)) {
    return { text: content == null ? '' : String(content), images: [] };
  }
  const texts = [];
  const images = [];
  for (const part of content) {
    if (!part || typeof part !== 'object') continue;
    if (part.type === 'text' && part.text) texts.push(part.text);
    if (part.type === 'image_url' && part.image_url?.url) {
      images.push(part.image_url.url);
    }
  }
  return { text: texts.join('\n'), images };
}
