import fs from 'node:fs';
import path from 'node:path';
const root=import.meta.dirname;
const read=name=>fs.readFileSync(path.join(root,'dist',name),'utf8');
let html=read('index.html');
const three=read('vendor/three.module.js');
const match=three.match(/export\s*\{([\s\S]*?)\};?\s*$/);
if(!match)throw Error('Missing Three exports');
const names=match[1].split(',').map(n=>n.trim()).filter(Boolean).map(n=>{const parts=n.split(/\s+as\s+/);return parts.length===2?`${parts[1]}: ${parts[0]}`:n});
const runtime=`const THREE=(()=>{${three.slice(0,match.index)};return {${names.join(',')}};})();`;
const scene=read('scene.js').replace("import * as THREE from './vendor/three.module.js';",'');
const lanyard=read('lanyard3d.js').replace("import * as THREE from './vendor/three.module.js';",'').replace('export function initLanyard','function initLanyard');
const setupSource=read('lanyard-setup.js').replace("import { initLanyard } from './lanyard3d.js';",'');
const portraitPath=setupSource.match(/const BADGE_PORTRAIT_URL = '([^']+)';/)[1].split('?')[0];
const portraitData='data:image/png;base64,'+fs.readFileSync(path.join(root,'dist',portraitPath)).toString('base64');
const setup=setupSource.replace(/const BADGE_PORTRAIT_URL = '[^']+';/,()=>`const BADGE_PORTRAIT_URL = '${portraitData}';`);
const bundle=`${runtime}
try{${scene}}catch(error){console.error(error);document.getElementById('loading').textContent='风景加载失败：'+error.message;document.body.classList.remove('piloting');}
{${read('app.js')}}
try{${lanyard}
${setup}}catch(error){console.error(error);document.getElementById('lanyard-area').textContent='工牌加载失败：'+error.message;}`;
html=html.replace(/<link rel="stylesheet" href="style\.css(?:\?[^"]*)?">/,()=>`<style>${read('style.css')}</style>`);
html=html.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g,'');
html=html.replace('</body>',()=>`<script type="module">${bundle}</script></body>`);
fs.writeFileSync(path.join(root,'preview.html'),html);
console.log('Built preview with scene, navigation and draggable lanyard');
