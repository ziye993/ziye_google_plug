/**
 * 将 src_plug 打成 zip，便于分发（非商店上架）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const plug = path.join(root, 'src_plug');
const out = path.join(root, 'ziye_google_plug.zip');

if (!fs.existsSync(path.join(plug, 'manifest.json'))) {
  console.error('请先 npm run build:ext');
  process.exit(1);
}

if (fs.existsSync(out)) fs.unlinkSync(out);

try {
  // Windows PowerShell Compress-Archive
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${plug}\\*' -DestinationPath '${out}' -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`cd "${plug}" && zip -r "${out}" .`, { stdio: 'inherit' });
  }
  console.log(`✅ 已打包: ${out}`);
} catch (e) {
  console.error('打包失败', e.message);
  process.exit(1);
}
