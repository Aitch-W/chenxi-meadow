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
  camera.position.set(0, 0.35, 4.25);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight('#fff7e4', '#5f7048', 1.7));
  const key = new THREE.DirectionalLight('#fff3d6', 1.5);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dfe9ff', 0.35);
  fill.position.set(-4, -2, -3);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  // 地球：球面用首页地貌画风
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 96),
    new THREE.MeshStandardMaterial({ map: makeMapTexture(), roughness: 0.92, metalness: 0 })
  );
  world.add(globe);

  // 云：跟着地球转，浮在球面上
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 });
  const puffGeo = new THREE.SphereGeometry(1, 12, 12);
  for (let i = 0; i < 9; i++) {
    const cl = new THREE.Group();
    const n = 5 + ((Math.random() * 4) | 0);
    for (let j = 0; j < n; j++) {
      const a = j * 2.39996;
      const r = Math.sqrt(j / n) * 0.13;
      const p = new THREE.Mesh(puffGeo, cloudMat);
      p.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 0.05, Math.sin(a) * r);
      const s = 0.045 + Math.random() * 0.04;
      p.scale.set(s, s * 0.6, s);
      cl.add(p);
    }
    placeOnSphere(cl, 1.04);
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
  let last = performance.now();
  let t = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    world.rotation.y += dt * 0.14;
    const a = t * 0.5;
    const R = 1.92;
    const tilt = 0.42;
    pos.set(Math.cos(a) * R, Math.sin(a) * R * Math.sin(tilt), Math.sin(a) * R * Math.cos(tilt));
    ahead.set(Math.cos(a + 0.02) * R, Math.sin(a + 0.02) * R * Math.sin(tilt), Math.sin(a + 0.02) * R * Math.cos(tilt));
    plane.position.copy(pos);
    plane.lookAt(ahead);
    if (plane.userData.prop) plane.userData.prop.rotation.z += dt * 40;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  function placeOnSphere(obj, radius) {
    const lat = Math.asin(2 * Math.random() - 1);
    const lon = Math.random() * Math.PI * 2;
    const x = Math.cos(lat) * Math.cos(lon) * radius;
    const y = Math.sin(lat) * radius;
    const z = Math.cos(lat) * Math.sin(lon) * radius;
    obj.position.set(x, y, z);
    obj.lookAt(0, 0, 0);
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
    g.scale.setScalar(0.62);
    return g;
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
    // 河流
    ctx.strokeStyle = '#3a86b8';
    ctx.lineWidth = 9;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const y = h * 0.5 + Math.sin(x * 0.012) * 55 + Math.sin(x * 0.03) * 18;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }
}
