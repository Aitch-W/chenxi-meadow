import { initLanyard } from './lanyard3d.js';

// 每多一段实习经历，往这里加一项，就会多挂一块工牌
const EXPERIENCES = [
  { company: '待定', role: '实习岗位 · 待定', year: '2026', logo: '待' }
];

function drawFace(side, exp) {
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
    // 圆形 logo（下移）
    ctx.beginPath();
    ctx.arc(W / 2, 400, 180, 0, Math.PI * 2);
    ctx.fillStyle = '#4f6b3a';
    ctx.fill();
    ctx.fillStyle = '#f8f6ec';
    ctx.font = '600 100px "Microsoft YaHei", sans-serif';
    ctx.fillText(exp.logo || '待定', W / 2, 406);
    // 英文名（下移 + 放大）
    ctx.fillStyle = '#2f5026';
    ctx.font = '600 170px Georgia, "Songti SC", serif';
    ctx.fillText('AITCH', W / 2, 900);
    // 分隔线
    ctx.strokeStyle = 'rgba(60,80,40,.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, 1100);
    ctx.lineTo(W * 0.82, 1100);
    ctx.stroke();
    // 底部
    ctx.fillStyle = '#9aa48a';
    ctx.font = '400 34px "Microsoft YaHei", sans-serif';
    ctx.fillText('INTERN BADGE · ' + exp.year, W / 2, 1180);
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

const area = document.querySelector('#lanyard-area');
if (area) {
  EXPERIENCES.forEach(exp => {
    const slot = document.createElement('div');
    slot.className = 'lanyard-slot';
    const box = document.createElement('div');
    box.className = 'lanyard';
    slot.appendChild(box);
    area.appendChild(slot);
    initLanyard(box, {
      frontImage: drawFace('front', exp),
      backImage: drawFace('back', exp),
      size: 0.6,
      strapLength: 0.5,
      anchor: 'left',
      strapColor: '#2e3b28',
      cardColor: '#f7f4ea',
      finish: 'glossy'
    });
  });
}
