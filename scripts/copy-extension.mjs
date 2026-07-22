/**
 * 将 Vite 产物同步到可加载扩展目录 src_plug/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const plug = path.join(root, 'src_plug');

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function rewriteHtml(html, pageName) {
  // dist 下 HTML 引用 ./assets/...；复制后仍放在 page/<name>/ 下，路径保持 ./assets/
  let out = html
    .replace(/href="\/on\.png"/g, 'href="./on.png"')
    .replace(/href="\.\/on\.png"/g, 'href="./on.png"');
  // Vite 可能产出 popup.html / newTabs.html 对应的脚本路径
  return out;
}

function preparePage(htmlFileName, pageDirName) {
  const srcHtml = path.join(dist, htmlFileName);
  if (!fs.existsSync(srcHtml)) {
    throw new Error(`缺少构建产物: ${srcHtml}`);
  }
  const destDir = path.join(plug, 'page', pageDirName);
  rmrf(destDir);
  mkdirp(destDir);

  const assetsSrc = path.join(dist, 'assets');
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, path.join(destDir, 'assets'));
  }

  // 公共静态资源
  const onPng = path.join(root, 'public', 'on.png');
  if (fs.existsSync(onPng)) {
    fs.copyFileSync(onPng, path.join(destDir, 'on.png'));
  }

  let html = fs.readFileSync(srcHtml, 'utf8');
  html = rewriteHtml(html, pageDirName);
  fs.writeFileSync(path.join(destDir, 'index.html'), html, 'utf8');
}

async function writeManifest() {
  const manifestPath = path.resolve(root, 'manifest.js');
  const manifest = (await import(pathToFileURL(manifestPath).href)).default;
  const out = path.join(plug, 'manifest.json');
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2), 'utf8');
  // 同步根目录副本（可选，方便查看）
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✅ manifest.json → src_plug/');
}

function copyJs() {
  const jsSrc = path.join(root, 'extension', 'js');
  const jsDest = path.join(plug, 'js');
  mkdirp(jsDest);
  for (const file of fs.readdirSync(jsSrc)) {
    if (file.endsWith('.js')) {
      fs.copyFileSync(path.join(jsSrc, file), path.join(jsDest, file));
    }
  }
  console.log('✅ js/ → src_plug/js/');
}

function ensureAssets() {
  const assetsDir = path.join(plug, 'assets');
  mkdirp(assetsDir);
  // 若已有图标则保留
  console.log('✅ assets 保留于 src_plug/assets/');
}

if (!fs.existsSync(dist)) {
  console.error('dist/ 不存在，请先执行 vite build');
  process.exit(1);
}

preparePage('popup.html', 'expand');
preparePage('newtab.html', 'newTabs');
copyJs();
await writeManifest();
ensureAssets();

console.log('✅ build:ext 完成 → 加载 chrome://extensions → src_plug');
