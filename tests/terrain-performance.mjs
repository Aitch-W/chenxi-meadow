// Real Three.js geometry/math, with WebGL and DOM mocked. This measures submitted
// geometry and verifies transforms; it deliberately does NOT claim GPU FPS.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as Three from '../dist/vendor/three.module.js';
const noop=()=>{};
const ctx=new Proxy({createRadialGradient:()=>({addColorStop:noop}),createLinearGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
function element(){return {style:{},appendChild:noop,setAttribute:noop,addEventListener:noop,classList:{add:noop,remove:noop},getContext:()=>ctx,scrollTop:0,width:1,height:1};}
const elements=new Map(),document={hidden:false,createElement:element,body:element(),documentElement:element(),querySelector:key=>{if(!elements.has(key))elements.set(key,element());return elements.get(key);}};
class Renderer{
 constructor(){this.renderCount=0;this.shadowMap={};this.domElement=element();this.capabilities={getMaxAnisotropy:()=>8};this.info={render:{calls:0,triangles:0}};}
 setPixelRatio(v){this.ratio=v;}getPixelRatio(){return this.ratio;}setSize(){}setRenderTarget(){}render(){this.renderCount++;}async compileAsync(){}
}
function snapshot(tiles){
 const sums=new Float64Array(9),instances=[],m=new Three.Matrix4(),v=new Three.Vector3(),c=new Three.Color();let vertices=0;
 for(const tile of tiles){tile.updateMatrixWorld(true);tile.traverse(o=>{
  if(!o.isMesh)return;
  if(o.isInstancedMesh){
   for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);c.copy(o.material.color);if(o.instanceColor){o.getColorAt(i,c);c.multiply(o.material.color)}instances.push([...m.elements,c.r,c.g,c.b,o.castShadow,o.receiveShadow].join(','));}
   return;
  }
  const g=o.geometry,p=g.attributes.position,index=g.index,color=g.attributes.color;
  for(let i=0,n=index?index.count:p.count;i<n;i++){
   const k=index?index.getX(i):i;v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld);c.copy(o.material.color||new Three.Color(1,1,1));
   if(o.material.vertexColors&&color){c.r*=color.getX(k);c.g*=color.getY(k);c.b*=color.getZ(k);}
   sums[0]+=v.x;sums[1]+=v.y;sums[2]+=v.z;sums[3]+=v.x*v.x;sums[4]+=v.y*v.y;sums[5]+=v.z*v.z;sums[6]+=c.r;sums[7]+=c.g;sums[8]+=c.b;vertices++;
  }
 });}
 return {vertices,sums:Array.from(sums),instances:createHash('sha256').update(instances.sort().join('\n')).digest('hex')};
}
const listeners=new Map();
const sandbox={THREE:{...Three,WebGLRenderer:Renderer},document,window:{addEventListener:(type,fn)=>listeners.set(type,fn)},matchMedia:()=>({matches:false}),innerWidth:1280,innerHeight:800,devicePixelRatio:1,requestAnimationFrame:noop,performance,console,snapshot};
const source=fs.readFileSync(new URL('../dist/scene.js',import.meta.url),'utf8');
const instrumented=source.replace(/^import .*?;\s*/,'').replace('const receiverStats=tiles.map(configureShadowReceivers);','const receiverStats=tiles.map(configureShadowReceivers);globalThis.before=snapshot(tiles);');
vm.createContext(sandbox);
vm.runInContext(instrumented+'\nglobalThis.model={scene,tiles,camera,windRotors,rotorBatchStats,tick,resize,updateTerrainShadowCasters,shadowCasters,visibleGround};globalThis.after=snapshot(tiles);',sandbox,{timeout:30000});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(sandbox.after.vertices,sandbox.before.vertices,'Batching must retain every triangle');
assert.equal(sandbox.after.instances,sandbox.before.instances,'Tree instance transforms/colors must be identical');
sandbox.before.sums.forEach((value,i)=>assert.ok(Math.abs(value-sandbox.after.sums[i])<Math.max(1,Math.abs(value))*2e-6,`World geometry/color moment ${i}`));
const {scene,tiles,camera,windRotors,rotorBatchStats,tick,resize,updateTerrainShadowCasters,shadowCasters,visibleGround}=sandbox.model;
assert.ok(rotorBatchStats.length>0);
for(const stat of rotorBatchStats){assert.equal(stat.before,57);assert.equal(stat.after,1);}
// Each retained z row has exactly the old colors, positions, normals and UVs;
// intermediate x values on a flat strip are linear interpolation of its edges.
for(const tile of tiles){const land=tile.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.material.vertexColors);assert.equal(land.geometry.parameters.widthSegments,1);assert.equal(land.geometry.parameters.heightSegments,200);const p=land.geometry.attributes.position,c=land.geometry.attributes.color;for(let k=0;k<p.count;k+=2){assert.equal(p.getZ(k),p.getZ(k+1));for(let axis=0;axis<3;axis++)assert.equal(c.array[k*3+axis],c.array[(k+1)*3+axis]);}}
// The fitted light frustum covers the ground and every possible caster on its
// incoming light ray, including landscape and tall portrait viewports.
const light=scene.children.find(o=>o.isDirectionalLight),ray=new Three.Raycaster(),point=new Three.Vector3(),ground=new Three.Plane(new Three.Vector3(0,1,0),0);
for(const [width,height] of [[1280,800],[1920,1080],[390,844]]){
 sandbox.innerWidth=width;sandbox.innerHeight=height;resize();light.shadow.updateMatrices(light);
 for(const x of [-1,0,1])for(const y of [-1,0,1]){
  ray.setFromCamera(new Three.Vector2(x,y),camera);ray.ray.intersectPlane(ground,point);
  assert.ok(light.shadow.getFrustum().containsPoint(point),'Visible ground shadow coverage');
  assert.ok(light.shadow.getFrustum().containsPoint(point.clone().addScaledVector(light.position,5/light.position.y)),'Offscreen caster shadow coverage');
 }
}
sandbox.innerWidth=1280;sandbox.innerHeight=800;resize();
// Simulate five active minutes. Samples and geometry stay bounded; a hidden tab
// must not advance the world, and the rotating windmill must remain animated.
vm.runInContext('last=0;lastSimulation=0;time=0;travel=0;',sandbox);
const countNodes=()=>{let count=0;scene.traverse(()=>count++);return count;};const nodes=countNodes(),angle=windRotors[0].rotation.z;
tick(0);for(let n=1;n<=18000;n++)tick(n*1000/60);
assert.ok(Math.abs(vm.runInContext('travel',sandbox)-540)<1e-7);
assert.equal(countNodes(),nodes);assert.equal(sandbox.window.__aitchPerformance().samples,600);
assert.ok(windRotors[0].rotation.z>angle+95);
const travel=vm.runInContext('travel',sandbox);document.hidden=true;tick(600000);assert.equal(vm.runInContext('travel',sandbox),travel);document.hidden=false;tick(600000+1000/60);assert.ok(vm.runInContext('travel',sandbox)-travel<.031);
const beforeCover=vm.runInContext('travel',sandbox);
const beforeGroundDraw=vm.runInContext('renderer.renderCount',sandbox),beforeCursorDraw=vm.runInContext('top.renderCount',sandbox);
listeners.get('aitch:cloud-transition')({detail:{hold:true}});
tick(600050);tick(600500);assert.equal(vm.runInContext('travel',sandbox),beforeCover,'Cloud rise temporarily holds terrain');
assert.equal(vm.runInContext('renderer.renderCount',sandbox),beforeGroundDraw);
assert.equal(vm.runInContext('top.renderCount',sandbox),beforeCursorDraw+2,'Airplane cursor keeps rendering during cloud cover');
listeners.get('aitch:cloud-transition')({detail:{hold:false}});
tick(600500+1000/60);assert.ok(Math.abs(vm.runInContext('travel',sandbox)-beforeCover-.03)<1e-7,'Resume without accumulated displacement');
const frustum=new Three.Frustum(),vp=new Three.Matrix4(),samples=[];
function submitted(f,shadow=false){let calls=0,triangles=0;scene.traverseVisible(o=>{if(!o.isMesh||shadow&&!o.castShadow||o.frustumCulled&&!f.intersectsObject(o))return;calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});return {calls,triangles};}
for(const travel of [0,20,50,85,110,150,200,250,300,350,399]){
 for(let i=0;i<tiles.length;i++)tiles[i].position.z=((travel-i*100+550)%400)-150;
 scene.updateMatrixWorld(true);updateTerrainShadowCasters();frustum.setFromProjectionMatrix(vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));light.shadow.updateMatrices(light);
 for(const c of shadowCasters)if(!c.mesh.castShadow)assert.ok(c.maxX+c.tile.position.x<visibleGround.min.x||c.minX+c.tile.position.x>visibleGround.max.x||c.maxZ+c.tile.position.z<visibleGround.min.z||c.minZ+c.tile.position.z>visibleGround.max.z,'Only shadows fully outside the visible ground may be culled');
 samples.push({travel,main:submitted(frustum),shadow:submitted(light.shadow.getFrustum(),true)});
}
console.log(JSON.stringify({checks:'PASS: geometry, colors, instances, rotating batches, shadow coverage, five-minute motion, bounded samples',samples},null,2));
