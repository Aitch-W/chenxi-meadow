// 俯视程序化场景：草原河流(=原 3D 场景) / 蓝金田野 / 赤土荒野 / 碧海沙洲
// 4 个场景自动轮播 + 顶部 tab 手动切换
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

float hash21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1.,0.)), c=hash21(i+vec2(0.,1.)), d=hash21(i+vec2(1.,1.));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }

// 蓝金田野：绿/蓝/黄田块拼贴 + 蓝色河流
vec3 fields(vec2 p){
  vec2 g = p*0.9;
  vec2 id = floor(g), f = fract(g);
  float h = hash21(id);
  vec3 c = h<0.30 ? vec3(0.14,0.50,0.86) : (h<0.55 ? vec3(0.96,0.75,0.16) : (h<0.80 ? vec3(0.27,0.62,0.25) : vec3(0.10,0.44,0.64)));
  float e = min(min(f.x,1.-f.x), min(f.y,1.-f.y));
  c = mix(c, vec3(0.78,0.68,0.47), 1.0 - smoothstep(0.014,0.034,e));
  return c;
}
vec3 riverBand(vec3 base, vec2 p, float t){
  float cx = 0.45*sin(p.y*0.55+1.2) + 0.12*sin(p.y*1.8);
  float d = abs(p.x - cx);
  float m = smoothstep(0.30,0.20,d);
  vec3 w = mix(vec3(0.10,0.45,0.72), vec3(0.22,0.64,0.86), 0.5+0.5*sin(p.y*8.0+t*1.5));
  return mix(base, w, m);
}

// 赤土荒野：橙红地 + 白色土路
vec3 desert(vec2 p, float t){
  float n = fbm(p*0.7);
  vec3 c = mix(vec3(0.84,0.36,0.14), vec3(0.96,0.52,0.20), n);
  float cx = 0.5*sin(p.y*0.5+0.6) + 0.15*sin(p.y*1.4);
  float d = abs(p.x - cx);
  c = mix(c, vec3(0.93,0.87,0.74), smoothstep(0.10,0.055,d));
  return c;
}

// 碧海沙洲：青绿海 + 沙洲小岛
vec3 sea(vec2 p, float t){
  float n = fbm(p*0.8 + 10.0);
  vec3 water = mix(vec3(0.10,0.58,0.62), vec3(0.18,0.72,0.74), n);
  float sand = smoothstep(0.56,0.48, fbm(p*0.5 + 2.0));
  vec3 c = mix(water, vec3(0.90,0.83,0.64), sand);
  float isl = smoothstep(0.64,0.55, fbm(p*0.65 + 5.0));
  c = mix(c, vec3(0.24,0.54,0.27), isl);
  return c;
}

vec3 biome(vec2 p, float t, float k){
  if (k < 0.5) return riverBand(fields(p), p, t);
  if (k < 1.5) return desert(p, t);
  return sea(p, t);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2((uv.x-0.5)*aspect, uv.y-0.5) * 5.0;
  float t = uTime;
  float b = clamp(uScene, 0.0, 2.0);

  vec3 c0 = biome(p, t, 0.0);
  vec3 c1 = biome(p, t, 1.0);
  vec3 c2 = biome(p, t, 2.0);
  float w0 = max(0.0, 1.0 - abs(b-0.0));
  float w1 = max(0.0, 1.0 - abs(b-1.0));
  float w2 = max(0.0, 1.0 - abs(b-2.0));
  vec3 col = c0*w0 + c1*w1 + c2*w2;

  // 树（随机点 + 阴影）
  float tn = hash21(floor(p*3.5));
  vec2 tf = fract(p*3.5) - 0.5;
  float tree = tn > 0.84 ? smoothstep(0.16, 0.10, length(tf)) : 0.0;
  float tsh = tn > 0.84 ? smoothstep(0.22, 0.12, length(tf - vec2(0.10,0.10))) : 0.0;
  col = mix(col, vec3(0.12,0.10,0.06), tsh*0.35);
  col = mix(col, vec3(0.10,0.32,0.15), tree);

  // 云 + 云影
  float cn = fbm(p*0.5 + vec2(t*0.02, 0.0));
  float cloud = smoothstep(0.58, 0.86, cn);
  float cn2 = fbm(p*0.5 + vec2(0.28,0.22) + vec2(t*0.02, 0.0));
  float sh = smoothstep(0.58, 0.86, cn2) * 0.22;
  col *= (1.0 - sh);
  col = mix(col, vec3(1.0,0.99,0.96), cloud*0.85);

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

      const tabs = document.querySelectorAll('#scene-tabs button');
      let sceneIdx = 0, alpha = 0, targetAlpha = 0, bi = 0, targetBi = 0;
      let nextAt = performance.now() + 12000;
      const N = 4;

      function setScene(i) {
        sceneIdx = i;
        targetAlpha = i === 0 ? 0 : 1;
        targetBi = Math.max(0, i - 1);
        tabs.forEach((b, k) => b.classList.toggle('active', k === i));
      }
      tabs.forEach((b, i) => b.addEventListener('click', () => {
        setScene(i);
        nextAt = performance.now() + 12000;
      }));
      setScene(0);

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

      const start = performance.now();
      function tick(now) {
        requestAnimationFrame(tick);
        if (now > nextAt) {
          setScene((sceneIdx + 1) % N);
          nextAt = now + 12000;
        }
        alpha += (targetAlpha - alpha) * 0.045;
        bi += (targetBi - bi) * 0.045;
        host.style.opacity = Math.max(0, Math.min(1, alpha)).toFixed(3);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, (now - start) / 1000);
        gl.uniform1f(uScene, bi);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      requestAnimationFrame(tick);
    }
  }
}
