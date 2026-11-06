import * as THREE from './vendor/three.module.js';

// Terrain is below the biography; the second transparent renderer carries clouds and airplane above it.
const scene=new THREE.Scene(),sky=new THREE.Scene();scene.background=new THREE.Color('#b5bb76');
const renderer=new THREE.WebGLRenderer({antialias:true}),air=new THREE.WebGLRenderer({antialias:true,alpha:true});
for(const r of [renderer,air]){r.setPixelRatio(Math.min(devicePixelRatio,1.75));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.0;}
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#scene').appendChild(renderer.domElement);document.querySelector('#atmosphere').appendChild(air.domElement);
const camera=new THREE.OrthographicCamera(-40,40,24,-24,.1,180);camera.position.set(0,65,20);camera.lookAt(0,0,0);
for(const s of [scene,sky]){s.add(new THREE.HemisphereLight('#fff1d7','#758263',2.0));const light=new THREE.DirectionalLight('#fff0d5',1.5);light.position.set(-23,45,-22);if(s===scene){light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-65,right:65,top:85,bottom:-85,near:1,far:140});light.shadow.normalBias=.045;light.shadow.bias=-.0001;light.shadow.radius=3;}s.add(light)}
let seed=465;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const rand=(a,b)=>a+(b-a)*random();
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:1,metalness:0,...extra});
const sand=material('#dbc18b'),pathMat=material('#dfb77b'),trunkMat=material('#71603c'),rockMat=material('#d5d7c5'),cream=material('#fff9e8');
const sphere=new THREE.IcosahedronGeometry(1,2),smallSphere=new THREE.IcosahedronGeometry(1,1),box=new THREE.BoxGeometry(1,1,1);
function add(g,m,p,x,y,z,sx=1,sy=sx,sz=sx){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=2048;const ctx=texCanvas.getContext('2d');ctx.fillStyle='#a8b677';ctx.fillRect(0,0,2048,2048);
for(let i=0;i<1800;i++){const x=rand(0,2048),y=rand(0,2048),r=rand(10,100);const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,i%2?'#b2d63830':'#5e971b20');g.addColorStop(1,'#91bd2100');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
// Broken, overlapping pigment marks: the grain travels with the land.
const pigments=['#d6cf91','#bfc080','#8eaa71','#789570','#e4d5a0','#a4b782'];
for(let i=0;i<26000;i++){
 const x=rand(0,2048),y=rand(0,2048),w=rand(5,27),h=rand(2,9);
 ctx.save();ctx.translate(x,y);ctx.rotate(rand(-.65,.65));ctx.globalAlpha=rand(.12,.42);
 ctx.fillStyle=pigments[i%pigments.length];ctx.fillRect(-w/2,-h/2,w,h);
 ctx.globalAlpha=.16;ctx.fillStyle='#f5e6bc';ctx.fillRect(-w/2,-h/2,w,1);ctx.restore();
}
for(let i=0;i<95000;i++){ctx.fillStyle=i%2?'#fff4ce26':'#485d3920';ctx.fillRect(rand(0,2048),rand(0,2048),rand(.6,2),rand(.6,2))}
const texture=new THREE.CanvasTexture(texCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,2);texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const grass=material('#efe8c5',{map:texture});
const LENGTH=100;const river=z=>-12+3.4*Math.sin(z/LENGTH*Math.PI*2)+.85*Math.sin(z/LENGTH*Math.PI*4+.5);const road=z=>-24+1.8*Math.sin(z/LENGTH*Math.PI*2+.9);
function strip(fn,width,y,m,p){const vs=[],uv=[],ix=[];for(let i=0;i<=600;i++){const z=-50+i/6;const w=width*(1+.045*Math.sin(z*Math.PI*24/100)+.025*Math.sin(z*Math.PI*76/100));vs.push(fn(z)-w/2,y,z,fn(z)+w/2,y,z);uv.push(0,z,1,z);if(i<600){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const o=new THREE.Mesh(g,m);o.receiveShadow=true;p.add(o);return o}
const water=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float time;void main(){float edge=abs(vUv.x-.5)*2.;float flow=sin(vUv.y*4.-time*2.+sin(vUv.x*42.+vUv.y*1.3))*sin(vUv.x*78.-vUv.y*3.+time);float wave=pow(max(0.,flow),14.);float current=sin(vUv.x*21.+sin(vUv.y*.8-time*.5))*0.5+0.5;vec3 col=mix(vec3(.24,.46,.52),vec3(.43,.64,.65),current*.5+edge*.5);col=mix(col,vec3(.63,.74,.68),smoothstep(.72,1.,edge));col+=vec3(.35,.45,.4)*wave*.65;float foam=pow(edge,20.)*(.5+.5*sin(vUv.y*18.+time));col+=foam*.23;gl_FragColor=vec4(col,1.);}`});
function forest(p){const leaves=new THREE.InstancedMesh(smallSphere,material('#598f2e'),18000);const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.12,1,5),trunkMat,700);let count=0,n=0;const d=new THREE.Object3D(),color=new THREE.Color();
function tree(x,z,s){if(n>=690)return;d.position.set(x,.65*s,z);d.scale.set(s,1.3*s,s);d.rotation.set(0,0,0);d.updateMatrix();stems.setMatrixAt(n++,d.matrix);for(let j=0;j<26;j++){const a=j*2.39996,r=Math.sqrt(j/26)*.85*s;d.position.set(x+Math.cos(a)*r,1.2*s+Math.sqrt(Math.max(0,1-r*r/(s*s)))*.65*s+rand(-.2,.2)*s,z+Math.sin(a)*r);const size=rand(.23,.45)*s;d.scale.set(size,rand(.8,1.3)*size,size);d.rotation.set(rand(0,3),rand(0,3),0);d.updateMatrix();leaves.setMatrixAt(count,d.matrix);color.setHSL(rand(.22,.29),rand(.20,.38),rand(.28,.47));leaves.setColorAt(count++,color)}}
for(let i=0;i<430;i++){let x=rand(-55,55),z=rand(-50,50);if(Math.abs(x-river(z))<3.7||Math.abs(x-road(z))<1.3)continue;if(x>5&&x<28&&Math.abs(z)<17&&random()<.93)continue;if(x>4&&random()<.45)x=rand(27,48);tree(x,z,rand(.35,.95))}
for(let i=0;i<125;i++){const z=rand(-50,50);tree(river(z)+(random()>.5?1:-1)*rand(3.3,4.7),z,rand(.18,.5))}leaves.count=count;stems.count=n;leaves.castShadow=leaves.receiveShadow=true;stems.castShadow=true;p.add(leaves,stems)}
const roofMat=material('#a65337'),wallMat=material('#f0dfbb'),windowMat=material('#6d9090'),doorMat=material('#574b35');
function house(x,z,p){const h=new THREE.Group();h.position.set(x,0,z);h.rotation.y=rand(-.3,.3);p.add(h);add(box,wallMat,h,0,.6,0,1.8,1.2,1.5);const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute([-1,.6,-.95,1,.6,-.95,0,1.3,-.95,-1,.6,.95,0,1.3,.95,1,.6,.95,-1,.6,-.95,0,1.3,-.95,0,1.3,.95,-1,.6,-.95,0,1.3,.95,-1,.6,.95,1,.6,-.95,1,.6,.95,0,1.3,.95,1,.6,-.95,0,1.3,.95,0,1.3,-.95],3));roof.computeVertexNormals();add(roof,roofMat,h,0,.6,0);add(box,doorMat,h,0,.35,.756,.3,.7,.025);for(const xx of [-.55,.55])add(box,windowMat,h,xx,.7,.76,.25,.3,.03);add(box,rockMat,h,.55,1.65,-.3,.22,.7,.22)}
function makeTile(offset){const p=new THREE.Group();p.position.z=offset;scene.add(p);add(new THREE.PlaneGeometry(140,LENGTH),grass,p,0,-.04,0).rotation.x=-Math.PI/2;strip(river,6.7,0,sand,p);strip(river,5.65,.025,water,p);strip(road,1.65,.01,sand,p);strip(road,1.18,.018,pathMat,p);forest(p);
const rocks=new THREE.InstancedMesh(smallSphere,rockMat,440),d=new THREE.Object3D();for(let i=0;i<440;i++){const z=rand(-50,50);let x=i<300?river(z)+(i%2?1:-1)*rand(2.85,3.5):rand(-45,48);if(i>=300&&Math.abs(x-river(z))<3.8)x+=8;d.position.set(x,.12,z);let s=rand(.07,.3);d.scale.set(s,s*.65,s*rand(.7,1.3));d.rotation.set(rand(0,3),rand(0,3),rand(0,3));d.updateMatrix();rocks.setMatrixAt(i,d.matrix)}rocks.castShadow=rocks.receiveShadow=true;p.add(rocks);
for(let i=0;i<22;i++){const x=rand(-21,-17),z=rand(-49,49);add(sphere,cream,p,x,.2,z,.16,.19,.27);add(smallSphere,trunkMat,p,x,.19,z-.25,.09)}for(const [x,z] of [[32,-23],[36,-20],[30,29],[34,31],[42,13]])house(x,z,p);return p}
const tiles=[makeTile(-LENGTH),makeTile(0),makeTile(LENGTH)];
const plane=new THREE.Group();sky.add(plane);const white=material('#fafaf2',{roughness:1,metalness:0}),blue=material('#537882',{roughness:1}),dark=material('#4e5850');
add(sphere,white,plane,0,0,0,.13,.11,.62);add(sphere,white,plane,0,-.005,-.05,1.02,.035,.15);add(sphere,white,plane,0,.03,.43,.36,.025,.09);add(box,white,plane,0,.12,.43,.035,.26,.21);add(sphere,blue,plane,0,.1,-.16,.09,.055,.19);const red=material('#b54531');add(box,red,plane,-.84,.025,-.05,.08,.02,.2);add(box,red,plane,.84,.025,-.05,.08,.02,.2);const prop=new THREE.Group();prop.position.z=-.65;plane.add(prop);add(box,dark,prop,0,0,0,.42,.025,.035);
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(64,64,1,64,64,63);sg.addColorStop(0,'rgba(34,55,17,.24)');sg.addColorStop(.5,'rgba(34,55,17,.17)');sg.addColorStop(1,'rgba(34,55,17,0)');sc.fillStyle=sg;sc.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
const cloudMat=material('#ffffff',{roughness:1});const clouds=[];for(let i=0;i<9;i++){const c=new THREE.Group();const size=rand(1.3,2.4);for(let j=0;j<13;j++){const a=j*2.399,r=Math.sqrt(j/13);add(sphere,cloudMat,c,Math.cos(a)*r*1.5,rand(-.15,.3),Math.sin(a)*r,.85,.5,rand(.7,1.1))}c.scale.setScalar(size);c.position.set([-31,-8,21,40,-43,8,30,-19,48][i],8.5,-48+i*12);sky.add(c);const sh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.set(7*size,5*size,1);sh.position.y=.065;scene.add(sh);clouds.push({cloud:c,shadow:sh,speed:rand(.55,.9)})}
const planeShadow=new THREE.Group();scene.add(planeShadow);const sm=new THREE.MeshBasicMaterial({color:'#34451c',transparent:true,opacity:.23,depthWrite:false});add(new THREE.PlaneGeometry(1.9,.19),sm,planeShadow,0,.08,0).rotation.x=-Math.PI/2;add(new THREE.PlaneGeometry(.16,1.2),sm,planeShadow,0,.08,0).rotation.x=-Math.PI/2;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=0,travel=0,boost=0;
const pointer=new THREE.Vector2(-.38,0),target=new THREE.Vector3(-15,6,0),ray=new THREE.Raycaster(),flightLevel=new THREE.Plane(new THREE.Vector3(0,1,0),-6);
const motion=document.querySelector('#motion');const sync=()=>{motion.textContent=paused?'继续飞行':'暂停飞行';motion.setAttribute('aria-pressed',String(paused))};sync();motion.onclick=()=>{paused=!paused;sync()};
window.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);document.body.classList.add('piloting')});document.documentElement.addEventListener('pointerleave',()=>document.body.classList.remove('piloting'));
window.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();pointer.x=THREE.MathUtils.clamp(pointer.x+(e.key==='ArrowRight'?.05:e.key==='ArrowLeft'?-.05:0),-.94,.94);pointer.y=THREE.MathUtils.clamp(pointer.y+(e.key==='ArrowUp'?.05:e.key==='ArrowDown'?-.05:0),-.9,.9)});document.querySelector('#explore').onclick=()=>{paused=false;boost=4;sync()};
const paintTarget=new THREE.WebGLRenderTarget(1,1);
const paintScene=new THREE.Scene(),paintCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const paintMaterial=new THREE.ShaderMaterial({uniforms:{picture:{value:paintTarget.texture},resolution:{value:new THREE.Vector2(1,1)}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
precision highp float;varying vec2 v;uniform sampler2D picture;uniform vec2 resolution;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec3 best=vec3(0.);float low=1.e5;
 for(int q=0;q<4;q++){
  vec2 direction=vec2(q<2?-1.:1.,(q==0||q==2)?-1.:1.);
  vec3 mean=vec3(0.),square=vec3(0.);
  for(int x=0;x<3;x++)for(int y=0;y<3;y++){
   vec2 offset=vec2(float(x),float(y))*direction*1.65/resolution;
   vec3 c=texture2D(picture,v+offset).rgb;mean+=c;square+=c*c;
  }
  mean/=9.;vec3 variance=abs(square/9.-mean*mean);float score=dot(variance,vec3(1.));
  if(score<low){low=score;best=mean;}
 }
 vec3 original=texture2D(picture,v).rgb;best=mix(original,best,.78);
 float tooth=hash(floor(v*resolution))-.5;
 float weave=sin(v.x*resolution.x*2.1)*sin(v.y*resolution.y*2.3);
 best+=tooth*.032+weave*.006;gl_FragColor=vec4(best,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});
paintScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),paintMaterial));
function resize(){const w=innerWidth,h=innerHeight;for(const r of [renderer,air])r.setSize(w,h);paintTarget.setSize(Math.round(w*renderer.getPixelRatio()),Math.round(h*renderer.getPixelRatio()));paintMaterial.uniforms.resolution.value.set(paintTarget.width,paintTarget.height);const width=w<h?58:80;camera.left=-width/2;camera.right=width/2;camera.top=width*h/w/2;camera.bottom=-width*h/w/2;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();ray.setFromCamera(pointer,camera);ray.ray.intersectPlane(flightLevel,target);plane.position.copy(target);
function tick(ms){requestAnimationFrame(tick);const dt=Math.min((ms-last)/1000,.04);last=ms;if(!document.hidden&&!paused){time+=dt;boost=Math.max(0,boost-dt);travel+=dt*(1.35+boost*.6);for(let i=0;i<tiles.length;i++)tiles[i].position.z=((i*LENGTH+travel+LENGTH*1.5)%(LENGTH*3))-LENGTH*1.5;water.uniforms.time.value=time;
for(const {cloud,shadow,speed} of clouds){cloud.position.z+=dt*speed;if(cloud.position.z>100)cloud.position.z=-100;shadow.position.x=cloud.position.x+3.4;shadow.position.z=cloud.position.z+3.1}planeShadow.position.set(plane.position.x+2.3,0,plane.position.z+2.5);planeShadow.rotation.y=plane.rotation.y;}ray.setFromCamera(pointer,camera);ray.ray.intersectPlane(flightLevel,target);const dx=target.x-plane.position.x;plane.position.lerp(target,1-Math.exp(-dt*9));plane.position.y=6+Math.sin(ms*.001*3.1)*.045+Math.sin(ms*.001*8.3)*.012;plane.rotation.z=THREE.MathUtils.clamp(-dx*.08,-.3,.3)+Math.sin(ms*.001*2.3)*.035;plane.rotation.x=Math.sin(ms*.001*2.7)*.018;plane.rotation.y=Math.sin(ms*.001*1.5)*.025;prop.rotation.z+=dt*65;
planeShadow.position.set(plane.position.x+2.3,0,plane.position.z+2.5);
renderer.setRenderTarget(paintTarget);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(paintScene,paintCamera);air.render(sky,camera)}requestAnimationFrame(tick);document.body.classList.add('loaded');
