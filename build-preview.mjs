import fs from 'node:fs';
import path from 'node:path';
const root = import.meta.dirname;
let html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist/style.css'), 'utf8');
let js = fs.readFileSync(path.join(root, 'dist/scene.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');

// 把本地 three.js 内联进 scene.js：去掉末尾 export，构造 THREE 命名空间
let three = fs.readFileSync(path.join(root, 'dist/vendor/three.module.js'), 'utf8');
const em = three.match(/export\s*\{([\s\S]*?)\};?\s*$/);
if (!em) throw new Error('three.module.js: export block not found');
const names = em[1].split(',').map(s => s.trim()).filter(Boolean);
const threeBody = three.slice(0, em.index);
// 用函数式替换，避免 three.js 源码里的 `$'` 被当成特殊替换符
js = js.replace(
  "import * as THREE from './vendor/three.module.js';",
  () => `${threeBody}\nconst THREE = { ${names.join(', ')} };`
);

html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`);

const start = html.indexOf('<script type="module">');
const end = html.indexOf('</script>', start) + 9;
if (start < 0 || end < 9) throw Error('Missing scene module entry');
const code = `<script type="module">try {${js}} catch(error) { console.error(error);document.getElementById('loading').textContent='风景加载失败，请刷新重试';document.getElementById('motion').disabled=true;document.getElementById('explore').disabled=true;document.body.classList.remove('piloting');}</script>`;
html = html.slice(0, start) + code + html.slice(end);
html = html.replace('<script type="module" src="app.js"></script>', () => `<script type="module">${app}</script>`);
// preview 单文件无法解析 lanyard 相关相对导入，去掉挂载脚本
html = html.replace(/<script type="module">\s*import \{ initLanyard \}[\s\S]*?<\/script>/, '');
html = html.replace(/<script type="module" src="lanyard-setup\.js"><\/script>/, '');
fs.writeFileSync(path.join(root, 'preview.html'), html);
console.log('Updated preview.html: ' + Buffer.byteLength(html) + ' bytes');
