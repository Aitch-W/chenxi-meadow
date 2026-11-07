import { initLanyard } from './lanyard3d.js';

const BADGE_PORTRAIT_URL = 'assets/badge-pig.jpg';

// 每多一段实习经历，往这里加一项，就会多挂一块工牌
const EXPERIENCES = [
  { company: '待定', role: '实习岗位 · 待定', year: '2026', logo: '待', photo: 'assets/badge-pig.jpg' }
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFace(side, exp, img) {
  const W = 1024, H = 1440;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (side === 'front') {
    ctx.fillStyle = '#f7f4ea';
    ctx.fillRect(0, 0, W, H);
    // 证件照：圆角矩形
    const px = 200, py = 140, pw = 624, ph = 624, r = 64;
    ctx.save();
    roundRect(ctx, px, py, pw, ph, r);
    ctx.clip();
    if (img) {
      const s = Math.max(pw / img.width, ph / img.height);
      const iw = img.width * s;
      const ih = img.height * s;
      ctx.drawImage(img, px + (pw - iw) / 2, py + (ph - ih) / 2, iw, ih);
    } else {
      ctx.fillStyle = '#4f6b3a';
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = '#f8f6ec';
      ctx.font = '600 120px "Microsoft YaHei", sans-serif';
      ctx.fillText(exp.logo || '待', W / 2, py + ph / 2);
    }
    ctx.restore();
    // 照片描边
    ctx.strokeStyle = 'rgba(60,80,40,.16)';
    ctx.lineWidth = 4;
    roundRect(ctx, px, py, pw, ph, r);
    ctx.stroke();
    // 名字
    ctx.fillStyle = '#2f5026';
    ctx.font = '600 170px Georgia, "Songti SC", serif';
    ctx.fillText('AITCH', W / 2, 960);
    // 副标题
    ctx.fillStyle = '#8a957c';
    ctx.font = '400 46px "Microsoft YaHei", sans-serif';
    ctx.fillText('王宸曦', W / 2, 1052);
    // 分隔线
    ctx.strokeStyle = 'rgba(60,80,40,.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.22, 1140);
    ctx.lineTo(W * 0.78, 1140);
    ctx.stroke();
    // 底部
    ctx.fillStyle = '#9aa48a';
    ctx.font = '400 32px "Microsoft YaHei", sans-serif';
    ctx.fillText('INTERN BADGE · ' + exp.year, W / 2, 1220);
  } else {
    ctx.fillStyle = '#2f3a2a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8e4d4';
    ctx.font = '700 110px "Microsoft YaHei", serif';
    ctx.fillText('实习经历', W / 2, 560);
    ctx.fillStyle = '#8a957c';
    ctx.font = '400 38px "Microsoft YaHei", sans-serif';
    ctx.fillText('保持好奇，继续生长', W / 2, 780);
  }
  return c.toDataURL('image/png');
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const area = document.querySelector('#lanyard-area');
if (area) {
  const img = await loadImage(BADGE_PORTRAIT_URL);
  EXPERIENCES.forEach(exp => {
    const slot = document.createElement('div');
    slot.className = 'lanyard-slot';
    const box = document.createElement('div');
    box.className = 'lanyard';
    slot.appendChild(box);
    area.appendChild(slot);
    initLanyard(box, {
      frontImage: drawFace('front', exp, img),
      backImage: drawFace('back', exp, img),
      size: 0.6,
      strapLength: 0.5,
      anchor: 'left',
      strapColor: '#2e3b28',
      cardColor: '#f7f4ea',
      finish: 'glossy'
    });
  });
}
