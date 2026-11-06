import * as THREE from './vendor/three.module.js';

// Terrain is below the biography; the second transparent renderer carries clouds and airplane above it.
const scene=new THREE.Scene(),sky=new THREE.Scene(),planeScene=new THREE.Scene();scene.background=new THREE.Color('#b5bb76');
const renderer=new THREE.WebGLRenderer({antialias:true}),air=new THREE.WebGLRenderer({antialias:true,alpha:true}),top=new THREE.WebGLRenderer({antialias:true,alpha:true});
for(const r of [renderer,air,top]){r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.0;}
renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const atmosphere=document.querySelector('#atmosphere');document.body.appendChild(atmosphere);
document.querySelector('#scene').appendChild(renderer.domElement);document.querySelector('#atmosphere').appendChild(air.domElement);document.querySelector('#plane-layer').appendChild(top.domElement);
const camera=new THREE.OrthographicCamera(-40,40,24,-24,.1,180);camera.position.set(0,65,20);camera.lookAt(0,0,0);
for(const s of [scene,sky,planeScene]){s.add(new THREE.HemisphereLight('#fff1d7','#758263',2.0));const light=new THREE.DirectionalLight('#fff0d5',1.5);light.position.set(-23,45,-22);if(s===scene){light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-65,right:65,top:85,bottom:-85,near:1,far:140});light.shadow.normalBias=.045;light.shadow.bias=-.0001;light.shadow.radius=3;}s.add(light)}
let seed=465;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const rand=(a,b)=>a+(b-a)*random();
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:1,metalness:0,...extra});
const sand=material('#dbc18b'),pathMat=material('#dfb77b'),trunkMat=material('#71603c'),rockMat=material('#d5d7c5'),cream=material('#fff9e8');
const sphere=new THREE.IcosahedronGeometry(1,2),smallSphere=new THREE.IcosahedronGeometry(1,1),box=new THREE.BoxGeometry(1,1,1);
function add(g,m,p,x,y,z,sx=1,sy=sx,sz=sx){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=2048;const ctx=texCanvas.getContext('2d');ctx.fillStyle='#e4e6b5';ctx.fillRect(0,0,2048,2048);
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
const texture=new THREE.CanvasTexture(texCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,2);texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const grass=material('#ffffff',{map:texture});
// 沿飞行方向连续变化地貌配色（草原→蓝金田野→赤土→碧海），像第一页一样一直往前飞
const LENGTH=100;const river=z=>-12+5.2*Math.sin(z/LENGTH*Math.PI*2)+.85*Math.sin(z/LENGTH*Math.PI*4+.5);const road=z=>-24+1.8*Math.sin(z/LENGTH*Math.PI*2+.9);
function strip(fn,width,y,m,p){const vs=[],uv=[],ix=[];for(let i=0;i<=600;i++){const z=-50+i/6;const w=width*(1+.045*Math.sin(z*Math.PI*24/100)+.025*Math.sin(z*Math.PI*76/100));vs.push(fn(z)-w/2,y,z,fn(z)+w/2,y,z);uv.push(0,z,1,z);if(i<600){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const o=new THREE.Mesh(g,m);o.receiveShadow=true;p.add(o);return o}
const water=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float time;void main(){float edge=abs(vUv.x-.5)*2.;float flow=sin(vUv.y*4.-time*2.+sin(vUv.x*42.+vUv.y*1.3))*sin(vUv.x*78.-vUv.y*3.+time);float wave=pow(max(0.,flow),14.);float current=sin(vUv.x*21.+sin(vUv.y*.8-time*.5))*0.5+0.5;vec3 col=mix(vec3(.025,.39,.66),vec3(.045,.66,.79),current*.5+edge*.5);col=mix(col,vec3(.32,.83,.84),smoothstep(.72,1.,edge));col+=vec3(.35,.45,.4)*wave*.65;float foam=pow(edge,20.)*(.5+.5*sin(vUv.y*18.+time));col+=foam*.23;gl_FragColor=vec4(col,1.);}`});
function forest(p,tileIndex=0){const homes=settlementPlan(tileIndex);const leaves=new THREE.InstancedMesh(smallSphere,material('#ffffff'),18000);const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.12,1,5),trunkMat,700);let count=0,n=0;const d=new THREE.Object3D(),color=new THREE.Color();
function tree(x,z,s){const region=biome(tileIndex,z);if(homes.some(h=>Math.abs(x-h.x)<1.5&&Math.abs(z-h.z)<1.5))return;if(n>=690||region>255||seaAt(region)>.01)return;if(region>175)s*=.72;d.position.set(x,.65*s,z);d.scale.set(s,1.3*s,s);d.rotation.set(0,0,0);d.updateMatrix();stems.setMatrixAt(n++,d.matrix);for(let j=0;j<26;j++){const a=j*2.39996,r=Math.sqrt(j/26)*.85*s;d.position.set(x+Math.cos(a)*r,1.2*s+Math.sqrt(Math.max(0,1-r*r/(s*s)))*.65*s+rand(-.2,.2)*s,z+Math.sin(a)*r);const size=rand(.23,.45)*s;d.scale.set(size,rand(.8,1.3)*size,size);d.rotation.set(rand(0,3),rand(0,3),0);d.updateMatrix();leaves.setMatrixAt(count,d.matrix);if(region>175){color.setHSL(rand(.25,.30),rand(.48,.66),rand(.18,.29));color.multiply(new THREE.Color('#496e29'));}else {color.setHSL(rand(.22,.29),rand(.48,.66),rand(.24,.43));color.multiply(new THREE.Color('#598f2e'));}leaves.setColorAt(count++,color)}}
for(let i=0;i<430;i++){let x=rand(-55,55),z=rand(-50,50);if(Math.abs(x-river(z))<3.7||Math.abs(x-road(z))<1.3)continue;if(x>5&&x<28&&Math.abs(z)<17&&random()<.93)continue;if(x>4&&random()<.45)x=rand(27,48);if(biome(tileIndex,z)>80&&biome(tileIndex,z)<175)continue;tree(x,z,rand(.35,.95))}
for(let i=0;i<125;i++){const z=rand(-50,50);tree(river(z)+(random()>.5?1:-1)*rand(3.3,4.7),z,rand(.18,.5))}for(let j=0;j<100;j++){const z=-49+j*.98;if(biome(tileIndex,z)>90&&biome(tileIndex,z)<170)tree(road(z)+(j%2?1:-1)*1.5,z,.4)}leaves.count=count;stems.count=n;leaves.castShadow=leaves.receiveShadow=true;stems.castShadow=true;p.add(leaves,stems)}
const roofMat=material('#a65337'),wallMat=material('#f0dfbb'),windowMat=material('#6d9090'),doorMat=material('#574b35');
function house(x,z,p){const h=new THREE.Group();h.position.set(x,0,z);h.rotation.y=rand(-.3,.3);p.add(h);add(box,wallMat,h,0,.6,0,1.8,1.2,1.5);const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute([-1,.6,-.95,1,.6,-.95,0,1.3,-.95,-1,.6,.95,0,1.3,.95,1,.6,.95,-1,.6,-.95,0,1.3,-.95,0,1.3,.95,-1,.6,-.95,0,1.3,.95,-1,.6,.95,1,.6,-.95,1,.6,.95,0,1.3,.95,1,.6,-.95,0,1.3,.95,0,1.3,-.95],3));roof.computeVertexNormals();add(roof,roofMat,h,0,.6,0);add(box,doorMat,h,0,.35,.756,.3,.7,.025);for(const xx of [-.55,.55])add(box,windowMat,h,xx,.7,.76,.25,.3,.03);add(box,rockMat,h,.55,1.65,-.3,.22,.7,.22)}
function makeTile(offset){const p=new THREE.Group();p.position.z=offset;scene.add(p);add(new THREE.PlaneGeometry(140,LENGTH),grass,p,0,-.04,0).rotation.x=-Math.PI/2;strip(river,6.7,0,sand,p);strip(river,5.65,.025,water,p);strip(road,1.65,.01,sand,p);strip(road,1.18,.018,pathMat,p);forest(p);
const rocks=new THREE.InstancedMesh(smallSphere,rockMat,440),d=new THREE.Object3D();for(let i=0;i<440;i++){const z=rand(-50,50);let x=i<300?river(z)+(i%2?1:-1)*rand(2.85,3.5):rand(-45,48);if(i>=300&&Math.abs(x-river(z))<3.8)x+=8;d.position.set(x,.12,z);let s=rand(.07,.3);d.scale.set(s,s*.65,s*rand(.7,1.3));d.rotation.set(rand(0,3),rand(0,3),rand(0,3));d.updateMatrix();rocks.setMatrixAt(i,d.matrix)}rocks.castShadow=rocks.receiveShadow=true;p.add(rocks);
for(let i=0;i<22;i++){const x=rand(-21,-17),z=rand(-49,49);add(sphere,cream,p,x,.2,z,.16,.19,.27);add(smallSphere,trunkMat,p,x,.19,z-.25,.09)}for(const [x,z] of [[32,-23],[36,-20],[30,29],[34,31],[42,13]])house(x,z,p);return p}
function addBiomeOverlays(p){
  const q=(w,d,z,color)=>{const o=add(new THREE.PlaneGeometry(w,d),material(color),p,0,0.032,z);o.rotation.x=-Math.PI/2;o.castShadow=false;o.receiveShadow=false;return o;};
  const pal=['#2f6fb0','#e8c23a','#3f8f3a','#2a5f8f','#d8c06a'];
  for(let i=0;i<7;i++){for(let j=0;j<3;j++){const x=-66+i*21+(j%2?7:0),z=-24+j*8+4;if(Math.abs(x-river(z))<6||Math.abs(x-road(z))<4)continue;const o=add(new THREE.PlaneGeometry(19,6.5),material(pal[(i*3+j)%pal.length]),p,x,0.034,z);o.rotation.x=-Math.PI/2;o.castShadow=false;o.receiveShadow=false;}}
  q(140,25,12.5,'#c86a2c');
  q(140,25,37.5,'#2a9aa6');
}
// One continuous route: every tile evaluates the same periodic terrain functions.
const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function biome(i,z){return ((i*100-z)%400+400)%400}
function dryAt(d){return smooth(175,205,d)*(1-smooth(245,275,d))}
function seaAt(d){return smooth(267,295,d)*(1-smooth(378,400,d))}
function groundColor(d,x,z){
 const green=new THREE.Color('#a6cf27'),gold=new THREE.Color('#eed02d'),red=new THREE.Color('#e67b35'),beach=new THREE.Color('#f9ebcf'),sea=new THREE.Color('#66d8c6');
 let c=green.clone().lerp(gold,smooth(60,95,d)).lerp(red,smooth(170,200,d)).lerp(beach,smooth(245,275,d));
 c.lerp(sea,smooth(275,295,d));c.lerp(beach,smooth(378,390,d));c.lerp(green,smooth(390,400,d));
return c;
}
// Clipped Voronoi parcels: straight shared embankments, irregular field sizes.
function addFields(parent,tile){
 const seeds=[];for(let r=0;r<7;r++)for(let c=0;c<9;c++)seeds.push({x:-70+c*17+rand(-5,5),d:80+r*16+rand(-4,4)});
 for(let index=0;index<seeds.length;index++){
 const a=seeds[index];let poly=[[-70,80],[70,80],[70,175],[-70,175]];
 for(const b of seeds){if(a===b)continue;const nx=b.x-a.x,ny=b.d-a.d,limit=(b.x*b.x+b.d*b.d-a.x*a.x-a.d*a.d)/2;const result=[];
 for(let j=0;j<poly.length;j++){const u=poly[j],v=poly[(j+1)%poly.length],du=u[0]*nx+u[1]*ny-limit,dv=v[0]*nx+v[1]*ny-limit;if(du<=0)result.push(u);if((du<=0)!=(dv<=0)){const t=du/(du-dv);result.push([u[0]+(v[0]-u[0])*t,u[1]+(v[1]-u[1])*t])}}poly=result;if(!poly.length)break;}
 // Clip the same parcel against each tile boundary, preserving colors and edges.
 for(const [sign,limit] of [[1,tile*100+50],[-1,-tile*100+50]]){const result=[];for(let j=0;j<poly.length;j++){const u=poly[j],v=poly[(j+1)%poly.length],du=sign*u[1]-limit,dv=sign*v[1]-limit;if(du<=0)result.push(u);if((du<=0)!=(dv<=0)){const t=du/(du-dv);result.push([u[0]+(v[0]-u[0])*t,u[1]+(v[1]-u[1])*t])}}poly=result;}
 if(poly.length<3)continue;const shape=new THREE.Shape();poly.forEach(([x,d],j)=>{if(j)shape.lineTo(x,d-tile*100);else shape.moveTo(x,d-tile*100)});shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(['#f6d51b','#459e38','#1688d4','#fbe02c','#337c43'][index%5]));mesh.rotation.x=-Math.PI/2;mesh.position.y=-.012;mesh.receiveShadow=true;parent.add(mesh);
 for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<length;t+=.55){const x=a[0]+(b[0]-a[0])*t/length,z=tile*100-a[1]-(b[1]-a[1])*t/length;if(Math.abs(x-river(z))<3.8||Math.abs(x-road(z))<1.4)continue;const ridge=add(box,material('#82953e'),parent,x,.003,z,.10,.025,.58);ridge.rotation.y=Math.atan2(b[0]-a[0],a[1]-b[1]);if(Math.round(t/.55)%5===0){add(sphere,material('#4f922f'),parent,x,.35,z,.28,.4,.28);add(smallSphere,material('#8cb635'),parent,x-.1,.58,z-.08,.2,.22,.2)}}}
 }
}
// Stilt villas: closed thick roofs, shaded verandas and structural timber.
const villaWood=material('#795039'),deckWood=material('#b08c61'),railWood=material('#765539'),glassBlue=material('#3e7779',{roughness:.32});
function beam(parent,a,b,width,mat=railWood){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start);const m=add(box,mat,parent,...start.clone().add(end).multiplyScalar(.5).toArray(),width,dir.length(),width);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m}
function boardwalk(parent,a,b,width=.55){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),group=new THREE.Group();group.position.set(a[0],0,a[1]);group.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);parent.add(group);
 for(let d=0;d<length;d+=.16)add(box,deckWood,group,0,.72,d,width,.09,.145);
 for(const side of [-1,1]){beam(group,[side*width/2,1.08,0],[side*width/2,1.08,length],.035);for(let d=0;d<=length;d+=.7){beam(group,[side*width/2,-.3,d],[side*width/2,1.12,d],.045);if(d+.7<length){beam(group,[side*width/2,.78,d],[side*width/2,1.06,d+.7],.025);beam(group,[side*width/2,1.06,d],[side*width/2,.78,d+.7],.025)}}}
}
function waterVilla(parent,x,z,variant){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=z<0?Math.PI:0;parent.add(g);
 add(box,deckWood,g,0,.73,.2,2.25,.13,2.8);
 for(const xx of [-.95,.95])for(const zz of [-.95,1.45])beam(g,[xx,-.5,zz],[xx,.8,zz],.095);
 for(const xx of [-.95,.95]){beam(g,[xx,-.35,-.95],[xx,.7,1.45],.045);beam(g,[xx,.7,-.95],[xx,-.35,1.45],.045)}
 add(box,villaWood,g,0,1.24,-.3,1.8,1.0,1.6);
 for(let j=0;j<7;j++)add(box,deckWood,g,0,.83+j*.14,.507,1.8,.018,.012);
 for(const xx of [-.53,.53]){add(box,railWood,g,xx,1.29,.53,.53,.7,.04);add(box,glassBlue,g,xx,1.29,.56,.44,.6,.025)}
 add(box,railWood,g,0,1.18,.56,.24,.82,.06);
 // Each roof half has a sealed underside and visible fascia thickness.
 const roofColors=['#a58b52','#7c7256','#b79a60'];const roofMat=material(roofColors[variant%3]);
 for(const sign of [-1,1]){for(let section=0;section<8;section++){const u=section/8,v=(section+1)/8;const height=t=>2.65-1.05*Math.sin(t*Math.PI/2)+.12*Math.pow(t,8);const x1=sign*u*1.16,x2=sign*v*1.16,y1=height(u),y2=height(v),t=.08;const points=[x1,y1,-1.3,x2,y2,-1.3,x2,y2, .8,x1,y1,.8,x1,y1-t,-1.3,x2,y2-t,-1.3,x2,y2-t,.8,x1,y1-t,.8];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5]);geo.computeVertexNormals();const roof=new THREE.Mesh(geo,roofMat);roof.material.side=THREE.DoubleSide;roof.castShadow=true;roof.receiveShadow=true;g.add(roof);
 beam(g,[x2,y2+.012,-1.32],[x2,y2+.012,.82],.025,deckWood);
 for(let z=-1.28;z<.8;z+=.13)beam(g,[x1,y1+.015,z],[x2,y2+.015,z+.035],.012,railWood);
 }}beam(g,[0,2.67,-1.36],[0,2.67,.86],.09,railWood);
 for(const xx of [-1.04,1.04]){beam(g,[xx,.8,.6],[xx,1.18,.6],.04);beam(g,[xx,.8,1.48],[xx,1.18,1.48],.04);beam(g,[xx,1.15,.6],[xx,1.15,1.48],.035)}
 for(const xx of [-.55,.55]){add(box,deckWood,g,xx,.89,1.05,.34,.09,.52);const back=add(box,deckWood,g,xx,1.03,.83,.34,.35,.06);back.rotation.x=-.25;}
}
function settlementPlan(tile){
 const plan=[];
 for(const center of [24,67]){const z=tile*100-center;if(z< -40||z>40)continue;
  for(const side of [-1,1])for(let k=0;k<4;k++){
   const hz=z+(k-1.5)*3.1,hx=river(hz)+side*(5.6+(k%2)*2.4);
   if(Math.abs(hx-road(hz))<2)continue;plan.push({x:hx,z:hz,type:k%3});
  }
 }
 if(tile===0)plan.push({x:20,z:-12,type:1},{x:30,z:-37,type:0});
 return plan;
}
function cottage(parent,x,z,type){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=(type-1)*.12;parent.add(g);
 const plaster=material(type===1?'#6b5039':'#efe4c8'),roof=material(type===0?'#997345':type===1?'#675848':'#a44f35');
 add(box,rockMat,g,0,.12,0,1.9,.24,1.65);add(box,plaster,g,0,.83,0,1.8,1.3,1.5);
 // Solid gable prism with two thick pitched roof halves.
 const shape=new THREE.Shape();shape.moveTo(-.9,0);shape.lineTo(.9,0);shape.lineTo(0,.75);shape.closePath();const cap=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:1.5,bevelEnabled:false}),plaster);cap.position.set(0,1.48,-.75);cap.castShadow=true;g.add(cap);
 for(const side of [-1,1]){const panel=add(box,roof,g,side*.53,1.83,0,1.42,.12,1.95);panel.rotation.z=-side*.69;
 for(let row=0;row<7;row++){const t=(row+.5)/7;beam(g,[side*t*1.08,2.28-t*.9,-.99],[side*t*1.08,2.28-t*.9,.99],.018,railWood)}}
 add(box,material('#9a7961'),g,.53,2.18,-.35,.24,.82,.27);add(box,rockMat,g,.53,2.61,-.35,.31,.08,.33);
 add(box,railWood,g,0,.57,.77,.35,.9,.055);
 for(const side of [-1,1]){add(box,cream,g,side*.56,.95,.78,.39,.48,.05);add(box,glassBlue,g,side*.56,.95,.815,.29,.37,.025);beam(g,[side*.56,.77,.84],[side*.56,1.13,.84],.026,cream);beam(g,[side*.7,.95,.84],[side*.42,.95,.84],.026,cream)}
 if(type===2){for(const xx of [-.87,0,.87])beam(g,[xx,.25,.83],[xx,1.49,.83],.045);beam(g,[-.9,1.43,.83],[.9,1.43,.83],.045);beam(g,[-.82,1.5,.83],[0,2.18,.83],.045);beam(g,[.82,1.5,.83],[0,2.18,.83],.045)}
}
function stoneBridge(parent,cx,z){
 const bridge=new THREE.Group();bridge.position.set(cx,0,z);parent.add(bridge);
 const masonry=['#777263','#8c8471','#66665c','#a0967f','#737363'].map(c=>material(c));
 const top=x=>.22+1.6*Math.sqrt(Math.max(0,1-(x/4)**2));
 const underside=x=>Math.abs(x)<3.35?.06+1.25*Math.sqrt(Math.max(0,1-(x/3.35)**2)):-.18;
 function archSlice(x1,x2,front,depth,mat,low,high){const steps=Math.max(4,Math.ceil((x2-x1)*12));const shape=new THREE.Shape();shape.moveTo(x1,low(x1));for(let k=1;k<=steps;k++){const x=x1+(x2-x1)*k/steps;shape.lineTo(x,low(x));}for(let k=steps;k>=0;k--){const x=x1+(x2-x1)*k/steps;shape.lineTo(x,high(x));}shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:4});const mesh=new THREE.Mesh(geo,mat);mesh.position.z=front;mesh.castShadow=mesh.receiveShadow=true;bridge.add(mesh);}
 // Solid arch barrel; no slab fills the opening underneath.
 archSlice(-4,4,-.8,1.6,masonry[2],underside,top);
 for(let k=0;k<32;k++){const x1=-4+k*.25+.008,x2=x1+.234;
  for(const side of [-1,1]){
   archSlice(x1,x2,side<0?-.83:.8,.03,masonry[k%5],underside,top);
   archSlice(x1,x2,side<0?-.82:.62,.2,masonry[(k+2)%5],x=>top(x)+.02,x=>top(x)+.42);
   archSlice(x1,x2,side<0?-.86:.6,.26,masonry[(k+3)%5],x=>top(x)+.42,x=>top(x)+.49);
  }
  const x=(x1+x2)/2;for(let row=0;row<4;row++){const slab=add(box,masonry[(k+row)%5],bridge,x,top(x)+.015,-.48+row*.32,.24,.035,.30);slab.rotation.z=Math.atan2(top(x2)-top(x1),x2-x1);}
 }
 for(const side of [-1,1]){
  add(box,masonry[2],bridge,side*3.66,.05,0,.65,.5,1.9);
  const approach=add(box,sand,parent,cx+side*5.4,.01,z,2.8,.025,1.6);approach.castShadow=false;
  for(let k=0;k<10;k++){const x=side*rand(3.4,3.95);add(smallSphere,material('#677047'),bridge,x,rand(.03,.25),rand(-.92,.92),rand(.045,.1),.025,.06);}
 }
}
function addSettlement(parent,tile){for(const h of settlementPlan(tile))cottage(parent,h.x,h.z,h.type);
 for(const d of [24,67,112,159]){const z=tile*100-d;if(z< -45||z>45)continue;stoneBridge(parent,river(z),z);}
}
function windmill(parent,x,z){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=.25;parent.add(g);
 add(new THREE.CylinderGeometry(.6,.95,2.7,12),material('#8c7961'),g,0,1.35,0);
 add(new THREE.ConeGeometry(.77,.85,12),material('#414a3b'),g,0,3.03,0);
 add(box,material('#334d3d'),g,0,.5,.94,.33,.85,.04);
 for(const y of [1.3,2.1]){add(box,cream,g,0,y,.69,.24,.35,.04);add(box,glassBlue,g,0,y,.72,.16,.25,.02)}
 const rotor=new THREE.Group();rotor.position.set(0,2.65,.8);rotor.rotation.x=-.2;g.add(rotor);
 add(sphere,material('#8c4d35'),rotor,0,0,0,.16);
 for(let n=0;n<4;n++){const blade=new THREE.Group();blade.rotation.z=n*Math.PI/2;rotor.add(blade);beam(blade,[0,.12,0],[0,2.3,0],.065,railWood);beam(blade,[.46,.55,0],[.46,2.3,0],.035,cream);for(let j=0;j<11;j++){const y=.55+j*.17;beam(blade,[0,y,0],[.46,y,0],.025,deckWood)}add(box,material('#9a593c'),blade,.14,1.5,-.02,.23,1.5,.025)}
 windRotors.push(rotor);
}
function sandstone(parent,x,z,size,height){const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);const palette=['#a25935','#bb7147','#cb8859','#955032','#d59a69'];
 const outline=Array.from({length:11},(_,k)=>{const a=k/11*Math.PI*2;return [Math.cos(a)*(1+rand(-.15,.15)),Math.sin(a)*(1+rand(-.15,.15))]});
 for(let layer=0;layer<10;layer++){const t=layer/10,r=size*(1-.36*t)*(layer%3===0?1.07:1);const shape=new THREE.Shape();outline.forEach(([a,b],k)=>{if(k)shape.lineTo(a*r,b*r*.68);else shape.moveTo(a*r,b*r*.68)});shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:height/10*.96,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1});geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,material(palette[layer%5]));mesh.position.y=layer*height/10;mesh.rotation.y=Math.sin(layer*.6)*.018;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}
 for(let k=0;k<8;k++){const a=rand(0,7),r=rand(size,size*1.7);add(smallSphere,material(palette[k%5]),g,Math.cos(a)*r,.1,Math.sin(a)*r*.7,rand(.15,.4),rand(.1,.25),rand(.15,.35));}
}
function makeRouteTile(i){
 const p=new THREE.Group();scene.add(p);
 const geo=new THREE.PlaneGeometry(140,100,140,200);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=[];
 for(let k=0;k<pos.count;k++){const x=pos.getX(k),z=pos.getZ(k),c=groundColor(biome(i,z),x,z);colors.push(c.r,c.g,c.b)}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const land=new THREE.Mesh(geo,material('#ffffff',{map:texture,vertexColors:true}));land.position.y=-.04;land.receiveShadow=true;p.add(land);
 function ribbon(fn,width,y,mat){const vs=[],uv=[],ix=[];for(let k=0;k<=600;k++){let z=-50+k/6,d=biome(i,z),w=width(d,z);const mud=dryAt(d)*(.16*Math.sin(z*5.7)+.10*Math.sin(z*13.1));vs.push(fn(z)-w/2-mud,y,z,fn(z)+w/2+mud*.8,y,z);uv.push(0,z,1,z);if(k<600){let n=k*2;ix.push(n,n+2,n+1,n+1,n+2,n+3)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.receiveShadow=true;p.add(m)}
 ribbon(river,d=>6.7-2.8*dryAt(d)+seaAt(d)*155,0,sand);
 const localWater=water.clone();localWater.uniforms.time=water.uniforms.time;
 localWater.uniforms.route={value:i*100};
 localWater.fragmentShader=localWater.fragmentShader.replace('uniform float time;','uniform float time;uniform float route;').replace('gl_FragColor=vec4(col,1.);',`float d=mod(route-vUv.y+400.,400.);float dry=smoothstep(175.,205.,d)*(1.-smoothstep(245.,275.,d));float bed=.5+.5*sin(vUv.y*9.+sin(vUv.x*45.));vec3 sandbed=mix(vec3(.36,.49,.40),vec3(.66,.65,.45),bed*.3+edge*.6);vec3 clearwater=mix(sandbed,vec3(.12,.52,.55),.52*(1.-edge));col=mix(col,clearwater+wave*.07,dry);float ocean=smoothstep(275.,295.,d)*(1.-smoothstep(378.,400.,d));vec3 depth=mix(vec3(.015,.28,.53),vec3(.22,.83,.78),smoothstep(.1,.86,edge));col=mix(col,depth+wave*.1,ocean);gl_FragColor=vec4(col,1.);`);
 ribbon(river,d=>5.65-3.3*dryAt(d)+seaAt(d)*155,.025,localWater);
 ribbon(road,d=>1.65*(1-smooth(255,285,d)+smooth(382,400,d)),.01,sand);
 const roadPaint=pathMat.clone();roadPaint.onBeforeCompile=shader=>{shader.vertexShader='varying float roadZ;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nroadZ=position.z;');shader.fragmentShader='varying float roadZ;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float rd=mod(${(i*100).toFixed(1)}-roadZ+400.,400.);float arid=smoothstep(170.,205.,rd)*(1.-smoothstep(245.,275.,rd));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.51,.29,.10),arid*.65);`)};roadPaint.customProgramCacheKey=()=>`road-${i}`;
 ribbon(road,d=>1.18*(1-smooth(255,285,d)+smooth(382,400,d)),.018,roadPaint);
 // Thin stratified silt marks beside both banks and dusty wheel tracks.
 for(const route of [river,road])for(const side of [-1,1])for(let band=0;band<5;band++){
  const vertices=[],indices=[];let previous=false;
  for(let k=0;k<=600;k++){const z=-50+k/6,d=biome(i,z),dry=dryAt(d);if(dry<.05){previous=false;continue;}const edge=route===river?(5.65-3.3*dry)/2:.72;
   const offset=edge+.12+band*.17+Math.sin(z*1.7+band)*.065+Math.sin(z*5.1+band)*.025;
   const x=route(z)+side*offset,w=(.025+band*.008)*dry*(.65+.35*Math.sin(z*2.5+band));const n=vertices.length/3;
   vertices.push(x-w,.029,z,x+w,.029,z);if(previous)indices.push(n-2,n,n-1,n-1,n,n+1);previous=true;
  }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:['#8f542e','#ddb17b','#a56d42','#efc18a','#b67a49'][band],transparent:true,opacity:.65,depthWrite:false}));p.add(m);
 }
 for(const [x,d,size,height] of [[-36,191,2.5,1.5],[8,208,2.1,3.4],[28,225,4.2,1.8],[-32,240,2.8,2.7],[16,246,1.5,2.9]]){const z=i*100-d;if(z>-44&&z<44&&Math.abs(x-river(z))>size+4&&Math.abs(x-road(z))>size+2)sandstone(p,x,z,size,height);}
 addSettlement(p,i);
 forest(p,i);
 addFields(p,i);
 for(const [x,d] of [[-34,102],[3,126],[28,149],[-30,165]]){const z=i*100-d;if(z>-46&&z<46&&Math.abs(x-river(z))>5&&Math.abs(x-road(z))>3)windmill(p,x,z);}
 for(let j=0;j<300;j++){const z=rand(-49,49),d=biome(i,z);if(seaAt(d)>.05)continue;const x=river(z)+(j%2?1:-1)*rand(2.9,3.6);add(smallSphere,rockMat,p,x,.11,z,rand(.08,.22),.12,rand(.12,.3))}
 for(let j=0;j<110;j++){const z=rand(-48,48),d=biome(i,z);if(d>90)continue;let x=rand(-35,34);if(settlementPlan(i).some(h=>Math.abs(x-h.x)<1.6&&Math.abs(z-h.z)<1.6))continue;if(Math.abs(x-river(z))<4||Math.abs(x-road(z))<2)continue;const sheep=new THREE.Group();sheep.position.set(x,0,z);sheep.rotation.y=rand(0,6.28);p.add(sheep);add(sphere,cream,sheep,0,.21,0,.17,.17,.27);add(smallSphere,trunkMat,sheep,0,.21,-.25,.085,.09,.1);for(const xx of [-.1,.1])for(const zz of [-.13,.13])add(box,trunkMat,sheep,xx,.07,zz,.035,.14,.035)}
 // Asymmetric sand spits, nested shoals, palms and stilt bungalows.
 for(const [x,z,scale,angle,kind] of [[-38,-34,1.0,.2,0],[-22,-18,1.0,0,1],[24,-28,1.1,.8,2],[40,-7,.9,-.4,3],[-35,3,1.05,-.5,2],[0,-25,2.3,.25,0],[-18,35,1.1,.2,3],[25,32,1.2,.7,1],[-30,-43,.55,.35,0],[-14,-42,.60,-.4,1],[14,-44,.55,.6,0],[34,-42,.60,-.2,3],[-32,-12,.55,.8,1],[32,-12,.55,-.5,0]]){
  const islandPhase=biome(i,z);const coastRadius=(kind===2?10:kind===1?8:7)*scale*1.48;
  // Reserve open water beyond the complete beach/reef footprint, not just its center.
  if(islandPhase-coastRadius<300||islandPhase+coastRadius>370)continue;
  const island=new THREE.Group();island.position.set(x,0,z);island.rotation.y=angle;p.add(island);
  // Three individually drawn coastlines from the reference composition, not scaled clones.
  const outlines=[
   [[-4,-3],[-3,-5],[0,-5.5],[3,-4],[4,-1],[3.5,2],[1,4],[-2,4],[-4,2]],
   [[-4,-6],[0,-7],[4,-5],[5,-1],[3,4],[-1,6],[-4,4],[-1,3],[1,1],[1,-2],[-1,-4]],
   [[-1.5,-9],[.4,-8],[1.5,-4],[2,0],[1.2,5],[-.4,9],[-1.6,6],[-2.1,1],[-2,-4]],
   [[-6,-3],[-4,-5],[0,-6],[5,-4],[6,0],[4,4],[0,5],[-4,3],[-6,0]]
  ];
  const outline=outlines[kind];
  const coast=new THREE.CatmullRomCurve3(outline.map(([a,b])=>new THREE.Vector3(a,0,b)),true,'centripetal');
  const points=coast.getPoints(180);
  // Many fine translucent shoal bands replace the conspicuous polygon rings.
  for(let band=30;band>=0;band--){const t=band/30,size=1+t*.48;const shape=new THREE.Shape();points.forEach((v,k)=>{const a=v.x*size*scale,b=-v.z*size*scale;if(k)shape.lineTo(a,b);else shape.moveTo(a,b)});shape.closePath();if(kind===3){const lagoon=new THREE.Path();lagoon.absellipse(0,0,3.4*scale,2.5*scale,0,Math.PI*2,true,0);shape.holes.push(lagoon);}const col=new THREE.Color('#fae9c2').lerp(new THREE.Color('#62d8c7'),Math.min(1,t*1.6));const mat=material(col,{transparent:true,opacity:band===0?1:.19,depthWrite:false});const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,180),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=.045+(30-band)*.0004;mesh.renderOrder=31-band;mesh.receiveShadow=true;island.add(mesh);}
  // Vegetation follows the broad headland; the sand spit remains exposed.
  const head=[[0,-.5,2.6,3],[2,-2,1.3,2.5],[-.2,-1,1.1,4.8],[-4,-.5,1.0,2.0]][kind];
  // Continuous turf beneath every plant, inside the broad island head.
  const turfShape=new THREE.Shape();for(let n=0;n<=80;n++){const a=n/80*Math.PI*2,r=1+.06*Math.sin(a*5)+.04*Math.cos(a*7);const tx=(head[0]+Math.cos(a)*head[2]*1.12*r)*scale,tz=-(head[1]+Math.sin(a)*head[3]*1.12*r)*scale;if(n)turfShape.lineTo(tx,tz);else turfShape.moveTo(tx,tz)}
  const turf=new THREE.Mesh(new THREE.ShapeGeometry(turfShape),material('#86a835',{map:texture}));turf.rotation.x=-Math.PI/2;turf.position.y=.08;turf.receiveShadow=true;island.add(turf);
  for(let k=0;k<55;k++){const a=rand(0,Math.PI*2),r=Math.sqrt(random()),px=(head[0]+Math.cos(a)*r*head[2])*scale,pz=(head[1]+Math.sin(a)*r*head[3])*scale;add(smallSphere,material(['#729b2c','#87aa30','#58892d','#a1be3c'][k%4]),island,px,.13,pz,rand(.18,.38),rand(.12,.27),rand(.2,.42));if(k%7===0)add(smallSphere,rockMat,island,px*1.12,.08,pz*1.08,.13,.08,.16);}
  for(let k=0;k<4;k++){const px=(head[0]+rand(-1,1))*scale,pz=(head[1]+rand(-1.6,1.6))*scale;add(new THREE.CylinderGeometry(.05,.1,1.7,6),trunkMat,island,px,.9,pz);for(let n=0;n<8;n++){const leaf=add(sphere,material(n%2?'#648e29':'#3e732c'),island,px+Math.cos(n*Math.PI/4)*.42,1.75,pz+Math.sin(n*Math.PI/4)*.42,.7,.07,.17);leaf.rotation.y=-n*Math.PI/4}}
  if(x===0){
   for(const side of [-1,1]){let previous=[side*5.5,0];for(let step=1;step<=24;step++){const t=step/24,point=[side*(5.5+7*Math.sin(t*Math.PI*.85)), -1+15*t];boardwalk(island,previous,point,.65);if(step%5===0){const hx=point[0]+side*2.2,hz=point[1];boardwalk(island,point,[hx,hz],.45);waterVilla(island,hx,hz,step/5);}previous=point;}}
  }else if(x===25){boardwalk(island,[1,0],[9,0],.6);for(let k=0;k<2;k++){const hx=4+k*3.2;boardwalk(island,[hx,0],[hx,1.3],.45);waterVilla(island,hx,2.8,k);}}


 }
 // Sparse arid plants: branching cactus silhouettes and ochre scrub.
 for(let k=0;k<110;k++){
  const z=rand(-48,48),d=biome(i,z),x=rand(-48,48);if(d<185||d>250||Math.abs(x-river(z))<4||Math.abs(x-road(z))<2)continue;
  const cactus=material('#7d8550'),h=rand(.55,1.2);add(new THREE.CylinderGeometry(.08,.11,h,7),cactus,p,x,h/2,z);add(sphere,cactus,p,x,h,z,.08,.1,.08);
  for(const sign of [-1,1]){add(box,cactus,p,x+sign*.17,h*.45,z,.34,.12,.12);add(new THREE.CylinderGeometry(.055,.07,h*.38,6),cactus,p,x+sign*.3,h*.64,z);add(sphere,cactus,p,x+sign*.3,h*.83,z,.055,.07,.055)}
  for(let j=0;j<3;j++)add(smallSphere,material('#a48c50'),p,x+rand(-.8,.8),.08,z+rand(-.8,.8),.12,.09,.14);
 }
 if(i===2){const car=new THREE.Group();p.add(car);add(box,material('#f5e7cd'),car,0,.24,0,.5,.24,.9);add(box,material('#537c86'),car,0,.43,0,.42,.22,.43);for(const x of [-.26,.26])for(const z of [-.28,.28])add(sphere,trunkMat,car,x,.12,z,.09,.12,.12);cars.push({car,tile:i});}
 return p;
}
const cars=[],windRotors=[];
// Batch static opaque details per material, retaining movable cars and windmill rotors.
function batchTerrain(tile){
 tile.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(tile.matrixWorld).invert(),matrix=new THREE.Matrix4();
 const moving=new Set();for(const {car} of cars)car.traverse(o=>moving.add(o));for(const rotor of windRotors)rotor.traverse(o=>moving.add(o));
 const groups=new Map();
 tile.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||moving.has(mesh))return;
  const m=mesh.material;
  if(!m.isMeshStandardMaterial||m.transparent||m.vertexColors||Object.hasOwn(m,'onBeforeCompile'))return;
  const key=[m.color.getHex(),m.roughness,m.metalness,m.side,m.map?.uuid||'',mesh.castShadow,mesh.receiveShadow].join('/');
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 });
 let before=0,after=0;
 for(const meshes of groups.values()){
  if(meshes.length<3)continue;
  const parts=[];let count=0;
  for(const mesh of meshes){const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();matrix.multiplyMatrices(inverse,mesh.matrixWorld);g.applyMatrix4(matrix);if(!g.attributes.normal)g.computeVertexNormals();parts.push(g);count+=g.attributes.position.count;}
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uv=new Float32Array(count*2);let offset=0;
  for(const g of parts){positions.set(g.attributes.position.array,offset*3);normals.set(g.attributes.normal.array,offset*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,offset*2);offset+=g.attributes.position.count;g.dispose();}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.computeBoundingSphere();
  const combined=new THREE.Mesh(geometry,meshes[0].material);combined.castShadow=meshes[0].castShadow;combined.receiveShadow=meshes[0].receiveShadow;
  for(const mesh of meshes)mesh.removeFromParent();tile.add(combined);before+=meshes.length;after++;
 }
 return {before,after};
}
const tiles=[0,1,2,3].map(makeRouteTile);
const batchStats=tiles.map(batchTerrain);
const plane=new THREE.Group();planeScene.add(plane);const white=material('#fafaf2',{roughness:1,metalness:0}),blue=material('#537882',{roughness:1}),dark=material('#4e5850');
add(sphere,white,plane,0,0,0,.13,.11,.62);add(sphere,white,plane,0,-.005,-.05,1.02,.035,.15);add(sphere,white,plane,0,.03,.43,.36,.025,.09);add(box,white,plane,0,.12,.43,.035,.26,.21);add(sphere,blue,plane,0,.1,-.16,.09,.055,.19);const red=material('#b54531');add(box,red,plane,-.84,.025,-.05,.08,.02,.2);add(box,red,plane,.84,.025,-.05,.08,.02,.2);const prop=new THREE.Group();prop.position.z=-.65;plane.add(prop);add(box,dark,prop,0,0,0,.42,.025,.035);
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(64,64,1,64,64,63);sg.addColorStop(0,'rgba(34,55,17,.24)');sg.addColorStop(.5,'rgba(34,55,17,.17)');sg.addColorStop(1,'rgba(34,55,17,0)');sc.fillStyle=sg;sc.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
const cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:water.uniforms.time,alpha:{value:.85}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float time;uniform float alpha;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){vec2 p=(v-.5)*2.;float n=noise(v*5.+time*.035)*.55+noise(v*13.-time*.02)*.3+noise(v*29.)*.15;float density=1.-smoothstep(.25,1.,length(p*vec2(.85,1.1))+.28*(n-.5));float a=density*alpha;gl_FragColor=vec4(mix(vec3(.83,.87,.86),vec3(1.),n*.55+.4),a);}`});
const solidCloud=material('#ffffff',{roughness:1,transparent:true,depthWrite:false});
const cloudLobes=[];
const clouds=[];for(let i=0;i<15;i++){const c=new THREE.Group();const size=i%5===0?rand(3.0,3.8):rand(1.3,2.4);for(let j=0;j<13;j++){const a=j*2.399,r=Math.sqrt(j/13);const lobe=add(sphere,solidCloud.clone(),c,Math.cos(a)*r*1.5,rand(-.15,.3),Math.sin(a)*r,.85,.5,rand(.7,1.1));
 const mistMaterial=cloudMat.clone();mistMaterial.uniforms.time=water.uniforms.time;mistMaterial.uniforms.alpha.value=0;
 const mist=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.6),mistMaterial);mist.quaternion.copy(camera.quaternion);c.add(mist);
 cloudLobes.push({lobe,mist,home:lobe.position.clone(),scale:lobe.scale.clone(),amount:0,phase:rand(0,6.28)});}c.scale.setScalar(size);c.position.set([-31,-8,21,40,-43,8,30,-19,48,15,-25,28,-5,38,-38][i],8.5,-78+i*12);sky.add(c);const sh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.set(7*size,5*size,1);sh.position.y=.065;scene.add(sh);clouds.push({cloud:c,shadow:sh,speed:rand(.55,.9)})}
const planeShadow=new THREE.Group();scene.add(planeShadow);const sm=new THREE.MeshBasicMaterial({color:'#34451c',transparent:true,opacity:.23,depthWrite:false});add(new THREE.PlaneGeometry(1.9,.19),sm,planeShadow,0,.08,0).rotation.x=-Math.PI/2;add(new THREE.PlaneGeometry(.16,1.2),sm,planeShadow,0,.08,0).rotation.x=-Math.PI/2;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=0,travel=0,boost=0,flightJump=null;
const pointer=new THREE.Vector2(-.38,0),target=new THREE.Vector3(-15,6,0),ray=new THREE.Raycaster(),flightLevel=new THREE.Plane(new THREE.Vector3(0,1,0),-6);
const motion=document.querySelector('#motion');const sync=()=>{motion.textContent=paused?'继续飞行':'暂停飞行';motion.setAttribute('aria-pressed',String(paused))};sync();motion.onclick=()=>{paused=!paused;sync()};
window.addEventListener('pointermove',e=>{pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);document.body.classList.add('piloting')});document.documentElement.addEventListener('pointerleave',()=>document.body.classList.remove('piloting'));
window.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();pointer.x=THREE.MathUtils.clamp(pointer.x+(e.key==='ArrowRight'?.05:e.key==='ArrowLeft'?-.05:0),-.94,.94);pointer.y=THREE.MathUtils.clamp(pointer.y+(e.key==='ArrowUp'?.05:e.key==='ArrowDown'?-.05:0),-.9,.9)});document.querySelector('#explore').onclick=()=>{paused=false;const current=flightJump?flightJump.end:travel;const phase=((current%400)+400)%400;const stops=[120,220,335,420];const target=stops.find(v=>v>phase+8);flightJump={start:travel,end:current-phase+target,elapsed:0};sync()};
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
const pageContainer=document.querySelector('#pages'),aircraftScreen=new THREE.Vector3(),cloudScreen=new THREE.Vector3();
let lastTerrainDraw=-Infinity,lastShadowDraw=-Infinity;
function resize(){const w=innerWidth,h=innerHeight;for(const r of [renderer,air,top])r.setSize(w,h);paintTarget.setSize(Math.round(w*Math.min(renderer.getPixelRatio(),1.15)),Math.round(h*Math.min(renderer.getPixelRatio(),1.15)));paintMaterial.uniforms.resolution.value.set(paintTarget.width,paintTarget.height);const width=w<h?58:80;camera.left=-width/2;camera.right=width/2;camera.top=width*h/w/2;camera.bottom=-width*h/w/2;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();ray.setFromCamera(pointer,camera);ray.ray.intersectPlane(flightLevel,target);plane.position.copy(target);
function tick(ms){requestAnimationFrame(tick);const dt=Math.min((ms-last)/1000,.04);last=ms;if(document.hidden)return;const homeVisible=pageContainer.scrollTop<innerHeight;
if(!paused){time+=dt;boost=Math.max(0,boost-dt);if(flightJump){flightJump.elapsed+=dt;const t=Math.min(1,flightJump.elapsed/2.8);travel=THREE.MathUtils.lerp(flightJump.start,flightJump.end,t*t*(3-2*t));if(t===1)flightJump=null;}else travel+=dt*1.8;for(let i=0;i<tiles.length;i++)tiles[i].position.z=((travel-i*LENGTH+LENGTH*5.5)%(LENGTH*4))-LENGTH*1.5;water.uniforms.time.value=time;for(const rotor of windRotors)rotor.rotation.z+=dt*.32;for(const {car} of cars){const z=20*Math.sin(time*.06);car.position.set(road(z),0,z);car.rotation.y=Math.atan2(road(z+.05)-road(z-.05),.1)+(Math.cos(time*.06)<0?Math.PI:0);}
for(const {cloud,shadow,speed} of clouds){cloud.position.z+=dt*speed;if(cloud.position.z>100)cloud.position.z=-100;shadow.position.x=cloud.position.x+3.4;shadow.position.z=cloud.position.z+3.1}planeShadow.position.set(plane.position.x+2.3,0,plane.position.z+2.5);planeShadow.rotation.y=plane.rotation.y;}ray.setFromCamera(pointer,camera);ray.ray.intersectPlane(flightLevel,target);const dx=target.x-plane.position.x;plane.position.lerp(target,1-Math.exp(-dt*9));plane.position.y=6+Math.sin(ms*.001*3.1)*.045+Math.sin(ms*.001*8.3)*.012;plane.rotation.z=THREE.MathUtils.clamp(-dx*.08,-.3,.3)+Math.sin(ms*.001*2.3)*.035;plane.rotation.x=Math.sin(ms*.001*2.7)*.018;plane.rotation.y=Math.sin(ms*.001*1.5)*.025;prop.rotation.z+=dt*65;
planeShadow.position.set(plane.position.x+2.3,0,plane.position.z+2.5);
// Disturb individual lobes in screen space so contact matches the visible airplane.
aircraftScreen.copy(plane.position).project(camera);
if(homeVisible){sky.updateMatrixWorld(true);for(const state of cloudLobes){
 const {lobe,mist,home,scale}=state;
 const screen=cloudScreen.copy(home).applyMatrix4(lobe.parent.matrixWorld).project(camera);
 const dx=(screen.x-aircraftScreen.x)*(camera.right-camera.left)/2;
 const dy=(screen.y-aircraftScreen.y)*(camera.top-camera.bottom)/2;
 const contact=1-smooth(.4,2.0,Math.hypot(dx,dy));
 state.amount=THREE.MathUtils.lerp(state.amount,contact,1-Math.exp(-dt*(contact>state.amount?8:1.25)));
 const a=state.amount,angle=Math.atan2(dy,dx),drift=.5*a;
 lobe.position.copy(home);lobe.position.x+=Math.cos(angle)*drift;lobe.position.z-=Math.sin(angle)*drift;
 lobe.scale.copy(scale).multiplyScalar(1+a*.26);lobe.material.opacity=1-a*.96;
 // Broken, drifting wisps occupy the displaced lobe; no airplane-attached overlay.
 mist.position.copy(lobe.position);mist.position.x+=Math.sin(ms*.001*1.4+state.phase)*a*.12;
 mist.scale.set(1+a*.7,1+a*.35,1);mist.material.uniforms.alpha.value=a*.18;
 mist.visible=a>.015;
}}
atmosphere.style.opacity=String(1-THREE.MathUtils.clamp(pageContainer.scrollTop/innerHeight,0,1));
// Keep the narrow background moving on content pages at 30fps; the aircraft remains full rate.
if(ms-lastTerrainDraw>=(homeVisible?0:1000/30)){
 lastTerrainDraw=ms;
 if(ms-lastShadowDraw>=1000/24){renderer.shadowMap.needsUpdate=true;lastShadowDraw=ms;}
 renderer.setRenderTarget(paintTarget);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(paintScene,paintCamera);
}
if(homeVisible)air.render(sky,camera);
top.render(planeScene,camera)}requestAnimationFrame(tick);document.body.classList.add('loaded');
