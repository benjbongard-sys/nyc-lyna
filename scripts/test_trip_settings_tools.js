/* Native Trip Settings bridge regression: public synthetic DOM only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('trip-settings-tools.js','utf8');
new vm.Script(source,{filename:'trip-settings-tools.js'});
assert(!/NOUX_PASSPHRASE|private\.vault\.json|Sanctuary Hotel/.test(source),'No private booking information');
class Node{
 constructor(tag){this.tagName=tag;this.className='';this.id='';this.hidden=false;this._text='';this.style={};this.children=[];this.attrs={};this.listeners={};this.classList={add(){},remove(){}}}
 set textContent(value){this._text=String(value)}
 get textContent(){return this._text+this.children.map(x=>x.textContent||'').join('')}
 append(...items){this.children.push(...items)}
 appendChild(x){this.append(x);return x}
 replaceChildren(...items){this.children=[];this.append(...items)}
 setAttribute(k,v){this.attrs[k]=v}
 getAttribute(k){return this.attrs[k]}
 addEventListener(k,f){this.listeners[k]=f}
 querySelector(sel){return flatten(this).find(x=>sel[0]==='.'?x.className.split(' ').includes(sel.slice(1)):sel[0]==='#'?x.id===sel.slice(1):x.tagName===sel)||null}
 getBoundingClientRect(){return {left:500,right:800,top:90,bottom:140,width:38,height:38}}
 focus(){}
 click(){this.listeners.click?.()}
}
const flatten=n=>[n,...n.children.flatMap(flatten)];
const body=new Node('body'),root=new Node('main');
const existing=new Node('div');existing.textContent='Original encrypted React Trip Settings';
root.append(existing);
const native=new Node('section'),head=new Node('div'),closeBtn=new Node('button'),heading=new Node('h2'),advanced=new Node('details');
native.className='modal';head.className='modal-head';advanced.className='advanced-settings';heading.textContent='Trip Settings';
head.append(heading,closeBtn);native.append(head,advanced);
closeBtn.getBoundingClientRect=()=>({left:700,right:738,top:100,bottom:138,width:38,height:38});
heading.getBoundingClientRect=()=>({left:480,right:580,top:100,bottom:138,width:100,height:38});
native.getBoundingClientRect=()=>({left:455,right:755,top:70,bottom:800,width:300,height:730});
let settingsVisible=false,syncOpened=0,departureOpened=0;
const raf=[];
const docListeners={};
const doc={body,createElement:t=>new Node(t),
 getElementById:id=>id==='root'?root:flatten(body).find(x=>x.id===id)||null,
 querySelectorAll:selector=>selector==='.modal-overlay > .modal'&&settingsVisible?[native]:[],
 addEventListener(k,f){(docListeners[k]??=[]).push(f)}
};
const w={NYC_DATA:{P:{}},innerWidth:1200,addEventListener(){},
 NOUX_SYNC:{getStatus:()=>({paired:true,text:'Shared trip synced'}),open:()=>{syncOpened++}},
 NOUX_DEPARTURE:{open:()=>{departureOpened++}},
 NOUX_REMEMBER_DEVICE:{status:()=>({remembered:true,available:true,canEnable:true}),
  forget:async()=>true}};
const ctx={window:w,document:doc,navigator:{},MutationObserver:undefined,
 requestAnimationFrame:fn=>{raf.push(fn);return raf.length},
 setTimeout:fn=>{fn();return 1},clearTimeout(){},confirm:()=>true,alert:()=>{},CustomEvent:class{},MessageChannel:class{}};
vm.runInNewContext(source,ctx,{filename:'trip-settings-tools.js'});
assert(w.NOUX_TRIP_TOOLS.install());
while(raf.length)raf.shift()();
const trigger=doc.getElementById('noux-trip-tools-trigger');
assert(trigger&&trigger.hidden,'No new button on ordinary itinerary page');
assert.equal(root.children.length,1,'React subtree is untouched');
settingsVisible=true;
assert(w.NOUX_TRIP_TOOLS.nativeSettings(),'Recognises original Trip Settings');
for(const callback of docListeners.click||[])callback({target:{closest:selector=>selector==='.settings-button'?{}:null}});
while(raf.length)raf.shift()();
assert(!trigger.hidden,'Settings-only sync shortcut becomes visible when native gear opens');
w.innerWidth=390;w.innerHeight=690;
for(const callback of docListeners.click||[])callback({target:{closest:selector=>selector==='.settings-button'?{}:null}});
while(raf.length)raf.shift()();
assert(Number.parseInt(trigger.style.top,10)>=64,'iPhone Sync entry must not be placed under the notch');
assert(Number.parseInt(trigger.style.left,10)<390,'iPhone Sync entry stays inside the viewport');
w.innerWidth=1200;w.innerHeight=800;
trigger.click(); // actual user interaction with the body-owned Settings accessory
assert(!doc.getElementById('noux-trip-tools').hidden,'Settings tools open');
assert.equal(root.children.length,1,'Settings portal does not mutate React');
const panel=doc.getElementById('noux-trip-tools');
assert(panel.textContent.includes('Our shared trip'),'Shared sync is in Trip Settings tools');
assert(panel.textContent.includes('Offline essentials'),'Offline moved into Settings');
assert(panel.textContent.includes('Departure & gifts'),'Departure link moved into Settings');
assert(panel.textContent.includes('Stay signed in on this device'),'Remembered session controls are inside existing Settings');
assert(panel.textContent.includes('Remembered access: enabled'),'Stored access status is explicit');
assert(flatten(panel).some(x=>x.tagName==='button'&&x.textContent==='Lock & forget this device'),
 'The user can disable automatic unlock without clearing trip data');
flatten(panel).find(x=>x.tagName==='button'&&x.textContent==='Manage shared sync').click();
assert.equal(syncOpened,1,'Settings opens the existing encrypted sync panel');
w.NOUX_TRIP_TOOLS.open();
flatten(panel).find(x=>x.tagName==='button'&&x.textContent==='Open checklists').click();
assert.equal(departureOpened,1,'Settings opens existing checklists');
assert(!flatten(body).some(x=>['noux-sync-launcher','noux-departure-launcher','noux-food-launcher','noux-companion-launcher'].includes(x.className)),'No duplicate floating buttons');
while(raf.length)raf.shift()();
assert(!trigger.hidden,'Contextual Shared control returns while native Settings stays open');
settingsVisible=false;
for(const callback of docListeners.click||[])callback({target:{closest:()=>null}});
while(raf.length)raf.shift()();
assert(trigger.hidden,'Shared control disappears after native Trip Settings closes');
console.log('Trip Settings bridge PASS: conditional control, shared sync, offline, gifts, no React DOM injection.');
