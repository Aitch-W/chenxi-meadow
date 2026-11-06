// 受控翻页器：滚轮/键盘/触摸 → 云升起盖屏 → 翻页 → 云向四周散开
const pages = document.querySelector('#pages');
const cc = document.querySelector('#cloud-cover');
const nav = document.querySelectorAll('.sidebar a[href^="#"]');
const order = ['home', 'works', 'experience'];
let page = 0, animating = false, pendingTarget = null, lastWheel = 0, touchY = 0;
let peekTimer = 0, peeking = false, leftZone = 260;
let scrollTarget=null,scrollFrame=0,scrollStamp=0;
function stopSmoothScroll(){cancelAnimationFrame(scrollFrame);scrollFrame=0;scrollTarget=null;}

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
  const inFooter=page===2&&pages.scrollTop>2*pages.clientHeight+25;
  document.body.classList.toggle('at-contact',inFooter);
  document.querySelector('.sidebar').inert=inFooter;
}

function setPage(i) {
  stopSmoothScroll();
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

function scrollExperience(delta){
 if(page!==2||animating)return false;
 const base=2*pages.clientHeight;
 if(delta<=0&&pages.scrollTop<=base+2&&(scrollTarget===null||scrollTarget<=base+2))return false;
 scrollTarget=Math.max(base,Math.min(pages.scrollHeight-pages.clientHeight,(scrollTarget??pages.scrollTop)+delta));
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){pages.scrollTop=scrollTarget;scrollTarget=null;updateSidebar();return true;}
 if(!scrollFrame){scrollStamp=performance.now();scrollFrame=requestAnimationFrame(easeScroll);}return true;
}
function easeScroll(now){
 if(scrollTarget===null||page!==2){stopSmoothScroll();return;}
 const dt=Math.min(50,now-scrollStamp);scrollStamp=now;
 const diff=scrollTarget-pages.scrollTop;
 if(Math.abs(diff)<1){pages.scrollTop=scrollTarget;scrollTarget=null;scrollFrame=0;return;}
 pages.scrollTop+=diff*(1-Math.exp(-dt/95));scrollFrame=requestAnimationFrame(easeScroll);
}
pages.addEventListener('scroll',updateSidebar,{passive:true});
function flip(dir) {
 if(scrollExperience(dir*Math.min(220,pages.clientHeight*.3)))return;
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
  if(scrollExperience(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?pages.clientHeight:1)))return;
  if (Math.abs(e.deltaY) < 6) return;
  const now = performance.now();
  if (now - lastWheel < 80) return;
  lastWheel = now;
  flip(e.deltaY > 0 ? 1 : -1);
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if(e.target.closest('button,a,input,textarea,select'))return;
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
      }, 1500);
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
    stopSmoothScroll();pages.scrollTo({ top: page * pages.clientHeight, behavior: 'auto' });
    if (!animating) buildCloud();
  }, 180);
});
leftZone = Math.min(280, innerWidth * 0.32);

buildCloud();
setActive(0);

// ---- 工牌 Lanyard：摆动物理 + 拖拽甩动 + 点击翻面 ----
const lanyard = document.querySelector('#lanyard');
const badge = document.querySelector('#badge');
if (lanyard && badge) {
  let rotZ = 0, rotX = 0, velZ = 0, velX = 0;
  let dragging = false, moved = false;
  let startX = 0, startY = 0, lastPX = 0, lastPY = 0;

  function lanyardTick() {
    requestAnimationFrame(lanyardTick);
    if (!dragging) {
      velZ += -rotZ * 0.045;
      velX += -rotX * 0.045;
      velZ *= 0.95;
      velX *= 0.95;
      rotZ = Math.max(-70, Math.min(70, rotZ + velZ));
      rotX = Math.max(-45, Math.min(45, rotX + velX));
      if (Math.abs(rotZ) < 0.02 && Math.abs(velZ) < 0.02) { rotZ = 0; velZ = 0; }
      if (Math.abs(rotX) < 0.02 && Math.abs(velX) < 0.02) { rotX = 0; velX = 0; }
    }
    lanyard.style.transform = 'rotateX(' + rotX.toFixed(2) + 'deg) rotateZ(' + rotZ.toFixed(2) + 'deg)';
  }

  badge.addEventListener('pointerdown', (e) => {
    dragging = true; moved = false;
    startX = lastPX = e.clientX; startY = lastPY = e.clientY;
    lanyard.classList.add('dragging');
    try { badge.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  badge.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.hypot(dx, dy) > 5) moved = true;
    rotZ = Math.max(-60, Math.min(60, dx * 0.28));
    rotX = Math.max(-40, Math.min(40, -dy * 0.22));
    velZ = Math.max(-6, Math.min(6, (e.clientX - lastPX) * 0.4));
    velX = Math.max(-6, Math.min(6, (e.clientY - lastPY) * -0.3));
    lastPX = e.clientX; lastPY = e.clientY;
  });

  badge.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    lanyard.classList.remove('dragging');
    if (!moved) badge.classList.toggle('flipped');
  });

  badge.addEventListener('pointercancel', () => {
    dragging = false;
    lanyard.classList.remove('dragging');
  });

  lanyardTick();
}



const nextHint=document.createElement('button');nextHint.className='next-page-hint';nextHint.type='button';nextHint.setAttribute('aria-label','向下探索下一页');nextHint.innerHTML='<span>向下探索</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>';document.body.appendChild(nextHint);
nextHint.addEventListener('click',()=>flip(1));
