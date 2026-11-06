// 翻页导航、侧边栏显隐、云层转场
const pages = document.querySelector('#pages');
const cc = document.querySelector('#cloud-cover');
const nav = document.querySelectorAll('.sidebar a[href^="#"]');
const order = ['home', 'works', 'experience'];
let current = 0, t1 = 0, t2 = 0;

function setActive(i) {
  nav.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + order[i]));
}

function playClouds() {
  cc.classList.remove('dissipating');
  cc.classList.add('covering');
  clearTimeout(t1);
  clearTimeout(t2);
  t1 = setTimeout(() => cc.classList.add('dissipating'), 720);
  t2 = setTimeout(() => cc.classList.remove('covering', 'dissipating'), 1900);
}

pages.addEventListener('scroll', () => {
  const h = pages.clientHeight || 1;
  const idx = Math.max(0, Math.min(order.length - 1, Math.round(pages.scrollTop / h)));
  // 离开首页即让灰色侧边栏滑入
  document.body.classList.toggle('alt', pages.scrollTop > h * 0.45);
  if (idx !== current) {
    // 首页 -> 作品集 触发云层盖屏再消散
    if (idx === 1 && current === 0) playClouds();
    current = idx;
    setActive(idx);
  }
}, { passive: true });

setActive(0);
