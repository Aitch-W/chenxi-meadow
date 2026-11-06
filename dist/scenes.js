// 程序化治愈小场景：海洋 → 荒漠 → 花田，噪声驱动，自动循环过渡
// 参照视频文案「Three.js 程序化 WebGL 动画、噪声生成景观、GPU 云、无外部素材」实现
const host = document.querySelector('#scene-extra');
if (host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'scene-extra-canvas';
  host.appendChild(canvas);
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });

  const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScene;

float hash21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash21(i);
  float b = hash21(i+vec2(1.0,0.0));
  float c = hash21(i+vec2(0.0,1.0));
  float d = hash21(i+vec2(1.0,1.0));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
vec3 pal3(float b, vec3 A, vec3 B, vec3 C){
  b = clamp(b, 0.0, 2.0);
  return b < 1.0 ? mix(A, B, b) : mix(B, C, b - 1.0);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);
  float t = uTime;
  float b = clamp(uScene, 0.0, 2.0);
  float hy = 0.50;

  // 天空
  vec3 skyTop = pal3(b, vec3(0.40,0.64,0.86), vec3(0.85,0.64,0.46), vec3(0.55,0.74,0.90));
  vec3 skyBot = pal3(b, vec3(0.80,0.90,0.94), vec3(0.98,0.87,0.72), vec3(0.88,0.93,0.92));
  vec3 col = mix(skyBot, skyTop, smoothstep(hy - 0.05, 1.02, uv.y));

  // 太阳光晕
  vec2 sunP = vec2(0.5 + 0.12 * sin(t * 0.05), 0.80);
  float sd = length((uv - sunP) * vec2(aspect, 1.0));
  col += exp(-sd * 6.0) * 0.35 * pal3(b, vec3(1.0,0.95,0.8), vec3(1.0,0.82,0.55), vec3(1.0,0.96,0.85));

  // 云（GPU 噪声驱动）
  float cn = fbm(vec2(p.x * 1.8 + t * 0.015, (p.y - hy) * 3.2 + t * 0.008));
  float cloud = smoothstep(0.52, 0.86, cn) * smoothstep(hy + 0.02, hy + 0.22, uv.y);
  col = mix(col, vec3(1.0, 0.99, 0.96), cloud * 0.8);

  // 地面
  float g = smoothstep(hy - 0.006, hy + 0.006, uv.y);
  vec3 gc1 = pal3(b, vec3(0.12,0.42,0.52), vec3(0.82,0.62,0.36), vec3(0.30,0.55,0.28));
  vec3 gc2 = pal3(b, vec3(0.22,0.58,0.64), vec3(0.92,0.75,0.50), vec3(0.48,0.70,0.36));
  float gn = fbm(vec2(p.x * 3.0, uv.y * 9.0));
  vec3 ground = mix(gc1, gc2, gn);
  col = mix(col, ground, g);

  // 生物群系细节权重
  float oceanW = max(0.0, 1.0 - abs(b - 0.0));
  float desertW = max(0.0, 1.0 - abs(b - 1.0));
  float flowerW = max(0.0, 1.0 - abs(b - 2.0));

  // 海洋波纹
  float wave = sin((uv.y - hy) * 80.0 + fbm(vec2(p.x * 4.0, t * 0.4)) * 5.0 + t * 1.3);
  float foam = smoothstep(0.88, 1.0, wave) * g;
  col += foam * vec3(0.85,0.96,1.0) * oceanW * 0.4;

  // 沙漠沙丘
  float dune = sin(uv.y * 45.0 + fbm(vec2(p.x * 2.0, 1.0)) * 7.0 + t * 0.08);
  col += smoothstep(0.93, 1.0, dune) * g * vec3(1.0, 0.9, 0.7) * desertW * 0.25;

  // 花田
  float fl = hash21(floor(p * vec2(80.0, 80.0)));
  float flowers = step(0.972, fl) * g;
  col = mix(col, vec3(0.96, 0.55, 0.66), flowers * flowerW * 0.9);

  // 地平线柔光
  col = mix(col, vec3(0.97,0.96,0.92), (1.0 - smoothstep(hy - 0.02, hy + 0.05, uv.y)) * 0.22);

  gl_FragColor = vec4(col, 1.0);
}`;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('scene shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) {
    host.style.display = 'none';
  } else {
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('scene program:', gl.getProgramInfoLog(prog));
      host.style.display = 'none';
    } else {
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(prog, 'uRes');
      const uTime = gl.getUniformLocation(prog, 'uTime');
      const uScene = gl.getUniformLocation(prog, 'uScene');

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }
      window.addEventListener('resize', resize);
      resize();

      // 时间线：淡入 → 海洋 → 荒漠 → 花田 → 淡出 → 循环
      const CYCLE = 44;
      const start = performance.now();
      function tick(now) {
        requestAnimationFrame(tick);
        const t = (now - start) / 1000;
        const x = t % CYCLE;
        let alpha = 1, scene = 0;
        if (x < 4) { alpha = x / 4; scene = 0; }
        else if (x < 14) { alpha = 1; scene = 0; }
        else if (x < 17) { alpha = 1; scene = (x - 14) / 3; }
        else if (x < 27) { alpha = 1; scene = 1; }
        else if (x < 30) { alpha = 1; scene = 1 + (x - 27) / 3; }
        else if (x < 40) { alpha = 1; scene = 2; }
        else { alpha = 1 - (x - 40) / 4; scene = 2; }
        host.style.opacity = alpha.toFixed(3);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, t);
        gl.uniform1f(uScene, scene);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      requestAnimationFrame(tick);
    }
  }
}
