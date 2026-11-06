// 受控翻页器：滚轮/键盘/触摸 → 云升起盖屏 → 翻页 → 云向四周散开
const pages = document.querySelector('#pages');
const cc = document.querySelector('#cloud-cover');
const nav = document.querySelectorAll('.sidebar a[href^="#"]');
const order = ['home', 'works', 'experience'];
let page = 0, animating = false, pendingTarget = null, lastWheel = 0, touchY = 0;
let peekTimer = 0, peeking = false, leftZone = 260;

// 生成铺满全屏的球状云团（参照首页 3D 云）
function buildCloud() {
  if (!cc) return;
  cc.querySelectorAll('.puff').forEach(n => n.remove());
  const W = window.innerWidth, H = window.innerHeight;
  const cols = 10, rows = 7;
  const cw = W / cols, ch = H / rows;
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const n = 1 + (Math.random() > 0.45 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const x = (gx + 0.5 + (Math.random() - 0.5) * 0.9) * cw;
        const y = (gy + 0.5 + (Math.random() - 0.5) * 0.9) * ch;
        const d = Math.min(cw, ch) * (1.25 + Math.random() * 0.55);
        const el = document.createElement('div');
        el.className = 'puff';
        el.style.width = el.style.height = d.toFixed(0) + 'px';
        el.style.left = (x - d / 2).toFixed(0) + 'px';
        el.style.top = (y - d / 2).toFixed(0) + 'px';
        el.style.zIndex = String(1 + gy * 60 + gx * 3 + k);
        cc.appendChild(el);
      }
    }
  }
}

function setActive(i) {
  nav.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + order[i]));
}

function updateSidebar() {
  document.body.classList.toggle('alt', page > 0 || peeking);
}

function setPage(i) {
  page = i;
  pages.scrollTo({ top: i * pages.clientHeight, behavior: 'auto' });
  peeking = false;
  if (peekTimer) { clearTimeout(peekTimer); peekTimer = 0; }
  updateSidebar();
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

function transitionTo(target) {
  if (target < 0 || target >= order.length || target === page) return;
  if (animating) { pendingTarget = target; return; }
  animating = true;
  cloudRise(() => {
    setPage(target);
    cloudScatter(() => {
      animating = false;
      const pt = pendingTarget;
      pendingTarget = null;
      if (pt !== null && pt !== page) transitionTo(pt);
    });
  });
}

function flip(dir) {
  transitionTo(page + dir);
}

// 导航链接走受控翻页（而不是浏览器默认的锚点跳转）
nav.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = order.indexOf(a.getAttribute('href').slice(1));
    if (target >= 0) transitionTo(target);
  });
});

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

// 首页：鼠标停留在左侧导航区超过 3 秒则滑出侧边栏
window.addEventListener('mousemove', (e) => {
  if (page > 0) {
    if (peeking) { peeking = false; updateSidebar(); }
    if (peekTimer) { clearTimeout(peekTimer); peekTimer = 0; }
    return;
  }
  if (e.clientX < leftZone) {
    if (!peeking && !peekTimer) {
      peekTimer = setTimeout(() => {
        peekTimer = 0;
        peeking = true;
        updateSidebar();
      }, 3000);
    }
  } else {
    if (peekTimer) { clearTimeout(peekTimer); peekTimer = 0; }
    if (peeking) { peeking = false; updateSidebar(); }
  }
}, { passive: true });

let resizeTimer = 0;
window.addEventListener('resize', () => {
  leftZone = Math.min(280, innerWidth * 0.32);
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    pages.scrollTo({ top: page * pages.clientHeight, behavior: 'auto' });
    if (!animating) buildCloud();
  }, 180);
});
leftZone = Math.min(280, innerWidth * 0.32);

buildCloud();
setActive(0);
