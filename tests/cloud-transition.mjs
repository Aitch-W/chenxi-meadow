import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let frames=[],animations=[],events=[],reduced=false,decodes=0;
const noop=()=>{},flush=()=>new Promise(resolve=>setImmediate(resolve));
const pages={clientHeight:800,scrollTop:0,scrollTo({top}){this.scrollTop=top;}};
const cc={style:{},animate(keyframes,options){
 let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});
 const animation={keyframes,options,finished,resolve,reject,cancelled:false,cancel(){this.cancelled=true;}};
 animations.push(animation);return animation;
}};
const image={loading:'lazy',decode(){decodes++;return Promise.resolve();}};
const sidebar={};
const document={body:{classList:{toggle:noop}},querySelector:s=>({'#pages':pages,'#cloud-cover':cc,'.sidebar':sidebar})[s],querySelectorAll:()=>[],getElementById:()=>({querySelectorAll:()=>[image]})};
const context=vm.createContext({document,window:{dispatchEvent:e=>events.push(e.detail.hold)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},WeakSet,console:{warn:noop},matchMedia:()=>({matches:reduced}),requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame:noop,clearTimeout:noop,setTimeout:noop});
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
vm.runInContext(source.slice(0,source.indexOf('function scrollExperience')),context);
const go=i=>vm.runInContext(`transitionTo(${i})`,context);
const state=()=>vm.runInContext('({page,animating,pendingTarget})',context);
async function paint(){for(let n=0;n<2;n++){const callbacks=frames;frames=[];callbacks.forEach(fn=>fn());await flush();}}
async function finish(){animations.at(-1).resolve();await flush();}
async function complete(target){await paint();await finish();assert.equal(state().page,target);await paint();await finish();}

const first=go(1);
assert.equal(events.at(-1),true);assert.equal(pages.scrollTop,0);assert.equal(animations.length,0);
await paint();
assert.equal(animations[0].options.duration,450);
assert.equal(state().page,0,'Do not switch before cloud coverage');
await finish();
assert.equal(pages.scrollTop,800);assert.equal(events.at(-1),false,'Resume destination terrain behind opaque cloud');
assert.equal(cc.style.opacity,1);assert.equal(animations.length,1,'Give destination two paint opportunities');
await paint();assert.equal(animations[1].options.duration,1050);await finish();await first;
assert.equal(state().animating,false);assert.equal(cc.style.opacity,0);assert.equal(cc.style.willChange,'auto');
assert.ok(animations.every(a=>a.cancelled));
assert.ok(animations.every(a=>a.keyframes.every(k=>Object.keys(k).every(key=>['opacity','transform'].includes(key)))),'No per-frame full-screen blur');

const reverse=go(0);await complete(0);await reverse;
assert.equal(pages.scrollTop,0);assert.equal(decodes,1,'Decode a page image once, without blocking transition');
const queued=go(1);go(2);assert.equal(state().pendingTarget,2);await complete(1);await queued;
assert.equal(state().animating,true);await complete(2);assert.equal(state().page,2);assert.equal(state().animating,false);

const cancelled=go(0);await paint();animations.at(-1).reject(new Error('Animation cancelled'));await flush();await cancelled;
assert.equal(state().page,0);assert.equal(state().animating,false);assert.equal(events.at(-1),false);assert.equal(cc.style.willChange,'auto');
reduced=true;const count=animations.length;await go(1);
assert.equal(state().page,1);assert.equal(animations.length,count);assert.equal(state().animating,false);
console.log('PASS: cover-before-navigation, compositor-only animation, paint-before-reveal, return home, queued navigation, image decode, cancellation cleanup, reduced motion');
