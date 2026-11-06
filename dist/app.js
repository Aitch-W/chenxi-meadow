// 受控翻页器：滚轮/键盘/触摸 → 云升起盖屏 → 翻页 → 云向四周散开
const pages = document.querySelector('#pages');
const cc = document.querySelector('#cloud-cover');
const nav = document.querySelectorAll('.sidebar a[href^="#"]');
const order = ['home', 'works', 'experience'];
let page = 0, animating = false, pending = 0, lastWheel = 0, touchY = 0;

function setActive(i) {
  nav.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + order[i]));
}

function setPage(i) {
  page = i;
  pages.scrollTo({ top: i * pages.clientHeight, behavior: 'auto' });
  document.body.classList.toggle('alt', i > 0);
  setActive(i);
}

// 云升起盖屏
function cloudRise(done) {
  cc.style.transition = 'transform .45s cubic-bezier(.45,.05,.3,1), opacity .4s ease, filter .4s ease';
  cc.style.transform = 'translateY(0) scale(1)';
  cc.style.opacity = '1';
  cc.style.filter = 'blur(0px)';
  setTimeout(done, 520);
}

// 云向四周散开（放大 + 模糊 + 淡出）
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

window.addEventListener('resize', () => {
  pages.scrollTo({ top: page * pages.clientHeight, behavior: 'auto' });
});

setActive(0);
