// 翻页导航、侧边栏显隐、云层转场（固定时长慢动画：升起 → 停顿 → 缓慢消散）
const pages = document.querySelector('#pages');
const cc = document.querySelector('#cloud-cover');
const nav = document.querySelectorAll('.sidebar a[href^="#"]');
const order = ['home', 'works', 'experience'];
let current = 0, lastRaw = 0, cloudBusy = false;

function setActive(i) {
  nav.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + order[i]));
}

function playClouds() {
  if (cloudBusy) return;
  cloudBusy = true;
  // 升起盖屏（0.7s）
  cc.style.transition = 'transform .7s cubic-bezier(.45,.05,.3,1), opacity .5s ease';
  cc.style.transform = 'translateY(0)';
  cc.style.opacity = '1';
  // 停顿 0.6s 后缓慢消散（2.2s）
  setTimeout(() => {
    cc.style.transition = 'opacity 2.2s ease, transform 1.8s ease';
    cc.style.opacity = '0';
    cc.style.transform = 'translateY(-14%)';
    setTimeout(() => {
      cc.style.transition = 'none';
      cc.style.transform = 'translateY(106%)';
      cc.style.opacity = '0';
      cloudBusy = false;
    }, 2300);
  }, 1300);
}

pages.addEventListener('scroll', () => {
  const h = pages.clientHeight || 1;
  const raw = pages.scrollTop / h;
  document.body.classList.toggle('alt', raw > 0.45);
  if (raw > lastRaw + 0.02) playClouds();
  lastRaw = raw;
  const idx = Math.max(0, Math.min(order.length - 1, Math.round(raw)));
  if (idx !== current) {
    current = idx;
    setActive(idx);
  }
}, { passive: true });

setActive(0);
