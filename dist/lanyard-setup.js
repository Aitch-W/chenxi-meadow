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
    // 公司 logo（占位）
    ctx.beginPath();
    ctx.arc(W / 2, 320, 170, 0, Math.PI * 2);
    ctx.fillStyle = '#4f6b3a';
    ctx.fill();
    ctx.fillStyle = '#f8f6ec';
    ctx.font = '600 96px "Microsoft YaHei", sans-serif';
    ctx.fillText(exp.logo || '待定', W / 2, 326);
    // 名字
    ctx.fillStyle = '#2f5026';
    ctx.font = '600 130px Georgia, "Songti SC", serif';
    ctx.fillText('AITCH', W / 2, 620);
    // 角色
    ctx.fillStyle = '#6d7a5f';
    ctx.font = '400 48px "Microsoft YaHei", sans-serif';
    ctx.fillText(exp.role, W / 2, 722);
    // 公司
    ctx.fillStyle = '#8a957c';
    ctx.font = '400 42px "Microsoft YaHei", sans-serif';
    ctx.fillText('实习公司 · ' + exp.company, W / 2, 930);
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
    ctx.fillText('实习经历', W / 2, 520);
    ctx.fillStyle = '#b9c2a7';
    ctx.font = '400 46px "Microsoft YaHei", sans-serif';
    ctx.fillText(exp.company, W / 2, 660);
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
