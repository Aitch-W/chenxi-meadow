// 受控翻页器：滚轮/键盘/触摸 → 云升起盖屏 → 翻页 → 云向四周散开
const pages = document.querySelector('#pages');
const cc = document.querySelector('#cloud-cover');
const nav = document.querySelectorAll('.sidebar a[href^="#"]');
const order = ['home', 'works', 'experience'];
let page = 0, animating = false, pending = 0, lastWheel = 0, touchY = 0;

// 生成蓬松云朵：多个球状云团拼成不规则大团（参照首页 3D 云）
function buildCloud() {
  if (!cc) return;
  cc.querySelectorAll('.puff').forEach(n => n.remove());
  const W = window.innerWidth, H = window.innerHeight;
  const centers = [
    [0.20, 0.34, 0.24], [0.56, 0.27, 0.24], [0.86, 0.40, 0.20],
    [0.34, 0.70, 0.26], [0.70, 0.66, 0.24], [0.10, 0.64, 0.18],
    [0.46, 0.50, 0.22], [0.88, 0.76, 0.16]
  ];
  centers.forEach(([cx, cy, cr], ci) => {
    const n = 13 + ((Math.random() * 5) | 0);
    for (let i = 0; i < n; i++) {
      const ang = i * 2.39996;
      const rad = Math.sqrt(i / n) * cr;
      const x = (cx + Math.cos(ang) * rad) * W;
      const y = (cy + Math.sin(ang) * rad * 0.72) * H;
      const d = (0.055 + Math.random() * 0.055) * W * (0.8 + cr * 1.6);
      const el = document.createElement('div');
      el.className = 'puff';
      el.style.width = el.style.height = d.toFixed(0) + 'px';
      el.style.left = (x - d / 2).toFixed(0) + 'px';
      el.style.top = (y - d / 2).toFixed(0) + 'px';
      el.style.zIndex = String(ci * 30 + i + 1);
      cc.appendChild(el);
    }
  });
}

function setActive(i) {
  nav.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + order[i]));
}

function setPage(i) {
  page = i;
  pages.scrollTo({ top: i * pages.clientHeight, behavior: 'auto' });
  document.body.classList.toggle('alt', i > 0);
  setActive(i);
}

function cloudRise(done) {
  cc.style.transition = 'transform .45s cubic-bezier(.45,.05,.3,1), opacity .4s ease, filter .4s ease';
  cc.style.transform = 'translateY(0) scale(1)';
  cc.style.opacity = '1';
  cc.style.filter = 'blur(0px)';
  setTimeout(done, 520);
}

function cloudScatter(done) {
  cc.style.transition = 'transform 1.05s cubic-bezier(.3,.65,.3,1), opacity 1.05s ease, filter 1.05s ease';
  cc.style.transform = 'translateY(-4%) scale(1.9)';
  cc.style.opacity = '0';
  cc.style.filter = 'blur(9px)';
  setTimeout(() => {
    cc.style.transition = 'none';
    cc.style.transform = 'translateY(106%) scale(1)';
    cc.style.opacity = '0';
    cc.style.filter = 'blur(0px)';
    done();
  }, 1100);
}

function runFlip(dir) {
  const target = page + dir;
  if (target < 0 || target >= order.length) return;
  animating = true;
  cloudRise(() => {
    setPage(target);
    cloudScatter(() => {
      animating = false;
      if (pending) { const d = pending; pending = 0; runFlip(d); }
    });
  });
}

function flip(dir) {
  if (animating) { pending = dir; return; }
  runFlip(dir);
}

window.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (Math.abs(e.deltaY) < 6) return;
  const now = performance.now();
  if (now - lastWheel < 80) return;
  lastWheel = now;
  flip(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

window.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') { e.preventDefault(); flip(1); }
  else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); flip(-1); }
});

pages.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
pages.addEventListener('touchend', (e) => {
  const dy = touchY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 40) flip(dy > 0 ? 1 : -1);
}, { passive: true });

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    pages.scrollTo({ top: page * pages.clientHeight, behavior: 'auto' });
    if (!animating) buildCloud();
  }, 180);
});

buildCloud();
setActive(0);
