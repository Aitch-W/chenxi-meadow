// 翻页导航、侧边栏显隐、云层转场（由滚动进度驱动：先盖上来，再消散露出下一页）
const pages = document.querySelector('#pages');
const cc = document.querySelector('#cloud-cover');
const nav = document.querySelectorAll('.sidebar a[href^="#"]');
const order = ['home', 'works', 'experience'];
let current = 0;

function setActive(i) {
  nav.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + order[i]));
}

// p = 当前两页之间的翻页进度 0..1
function driveCloud(p) {
  let op, ty;
  if (p <= 0.05) { op = 0; ty = 106; }
  else if (p <= 0.45) { const q = (p - 0.05) / 0.40; op = q; ty = 106 * (1 - q); }
  else if (p <= 0.58) { op = 1; ty = 0; }
  else { const q = Math.min(1, (p - 0.58) / 0.42); op = 1 - q; ty = 0; }
  cc.style.opacity = op.toFixed(3);
  cc.style.transform = 'translateY(' + ty.toFixed(2) + '%)';
}

pages.addEventListener('scroll', () => {
  const h = pages.clientHeight || 1;
  const raw = pages.scrollTop / h;
  document.body.classList.toggle('alt', pages.scrollTop > h * 0.45);
  driveCloud(raw - Math.floor(raw));
  const idx = Math.max(0, Math.min(order.length - 1, Math.round(raw)));
  if (idx !== current) {
    current = idx;
    setActive(idx);
  }
}, { passive: true });

driveCloud(0);
setActive(0);
