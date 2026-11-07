import * as THREE from './vendor/three.module.js';

const host = document.querySelector('#globe-stage');
if (host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.35, 5);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight('#fff7e4', '#5f7048', 1.75));
  const key = new THREE.DirectionalLight('#fff3d6', 1.5);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dfe9ff', 0.35);
  fill.position.set(-4, -2, -3);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  // 地球：真实贴图 + 首页风格化
  const earthImg = await loadImage('assets/earth.jpg');
  const map = earthImg ? stylizeEarth(earthImg) : makeMapTexture();
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 96),
    new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 })
  );
  world.add(globe);

  // 云：集中赤道附近，跟着地球转
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 });
  const puffGeo = new THREE.SphereGeometry(1, 12, 12);
  for (let i = 0; i < 10; i++) {
    const cl = new THREE.Group();
    const n = 5 + ((Math.random() * 4) | 0);
    for (let j = 0; j < n; j++) {
      const a = j * 2.39996;
      const r = Math.sqrt(j / n) * 0.12;
      const p = new THREE.Mesh(puffGeo, cloudMat);
      p.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 0.05, Math.sin(a) * r);
      const s = 0.04 + Math.random() * 0.035;
      p.scale.set(s, s * 0.6, s);
      cl.add(p);
    }
    placeOnSphere(cl, 1.03, true);
    world.add(cl);
  }

  // 绕球飞的小飞机
  const plane = makePlane();
  scene.add(plane);

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const pos = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const R = 1.35;
  const tilt = 0.38;
  let last = performance.now();
  let t = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    world.rotation.y += dt * 0.12;
    const a = t * 0.5;
    pos.set(Math.cos(a) * R, Math.sin(a) * R * Math.sin(tilt), Math.sin(a) * R * Math.cos(tilt));
    ahead.set(Math.cos(a + 0.02) * R, Math.sin(a + 0.02) * R * Math.sin(tilt), Math.sin(a + 0.02) * R * Math.cos(tilt));
    plane.position.copy(pos);
    plane.up.copy(pos).normalize();
    plane.lookAt(ahead);
    if (plane.userData.prop) plane.userData.prop.rotation.z += dt * 40;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  function placeOnSphere(obj, radius, equator) {
    const lat = equator ? (Math.random() - 0.5) * 0.55 : Math.asin(2 * Math.random() - 1);
    const lon = Math.random() * Math.PI * 2;
    const x = Math.cos(lat) * Math.cos(lon) * radius;
    const y = Math.sin(lat) * radius;
    const z = Math.cos(lat) * Math.sin(lon) * radius;
    obj.position.set(x, y, z);
    obj.lookAt(0, 0, 0);
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

  function stylizeEarth(img) {
    const w = 1024, h = 512;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.filter = 'saturate(.55) sepia(.16) brightness(1.06) contrast(.92)';
    ctx.drawImage(img, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(247,247,239,0.28)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 4200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.045)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function makeMapTexture() {
    const w = 1024, h = 512;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6f9a4e';
    ctx.fillRect(0, 0, w, h);
    const pal = ['#3f8f3a', '#2f6fb0', '#e8c23a', '#c86a2c', '#2a9aa6', '#7fb35a', '#d8c06a', '#4f8a52'];
    ctx.filter = 'blur(14px)';
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 30 + Math.random() * 90;
      ctx.globalAlpha = 0.5 + Math.random() * 0.35;
      ctx.fillStyle = pal[(Math.random() * pal.length) | 0];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makePlane() {
    const g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: '#fafaf2', roughness: 1 });
    const blue = new THREE.MeshStandardMaterial({ color: '#537882', roughness: 1 });
    const dark = new THREE.MeshStandardMaterial({ color: '#4e5850', roughness: 1 });
    const red = new THREE.MeshStandardMaterial({ color: '#b54531', roughness: 1 });
    const sph = new THREE.SphereGeometry(1, 12, 12);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const add = (geo, mat, x, y, z, sx, sy, sz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      g.add(m);
      return m;
    };
    add(sph, white, 0, 0, 0, 0.13, 0.11, 0.62);
    add(sph, white, 0, -0.005, -0.05, 1.02, 0.035, 0.15);
    add(sph, white, 0, 0.03, 0.43, 0.36, 0.025, 0.09);
    add(box, white, 0, 0.12, 0.43, 0.035, 0.26, 0.21);
    add(sph, blue, 0, 0.1, -0.16, 0.09, 0.055, 0.19);
    add(box, red, -0.84, 0.025, -0.05, 0.08, 0.02, 0.2);
    add(box, red, 0.84, 0.025, -0.05, 0.08, 0.02, 0.2);
    g.userData.prop = add(box, dark, 0, 0, -0.65, 0.42, 0.025, 0.035);
    g.rotation.y = Math.PI;
    g.scale.setScalar(0.18);
    return g;
  }
}
