/* NOUX encrypted unlock regression: synthetic itineraries only. Node 22. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {TextEncoder,TextDecoder}=require('node:util');
const source=fs.readFileSync('unlock.js','utf8');
new vm.Script(source,{filename:'unlock.js'});
assert(!source.includes('Reopen the basic itinerary'),'No repeating basic-mode recovery button');
assert(source.includes('noux-emergency-itinerary'),'Read-only emergency itinerary available');
class Element{
 constructor(tag,id=''){
  this.tagName=tag;this.id=id;this._text='';this.nodes=[];this.parent=null;
  this.listeners={};this.style={setProperty(){},width:'',display:''};this.dataset={};
  this.hidden=id==='root';this.disabled=false;this.value='';this.type='password';this.attrs={};
  this.classList={add(){},remove(){}};this.__isRoot=id==='root';
 }
 set textContent(v){this._text=String(v)}
 get textContent(){return this._text+this.nodes.map(n=>n.textContent||'').join('')}
 get childElementCount(){
  if(this.__isRoot && this.clock?.delay && this.clock.time>=1700 && !this.nodes.length){
   const n=new Element('section');n.textContent='Our delayed React planner is now visible with the complete daily itinerary.';
   this.append(n);
  }
  return this.nodes.length;
 }
 append(...items){items.forEach(n=>{if(n){n.parent=this;this.nodes.push(n)}})}
 appendChild(n){this.append(n);return n}
 remove(){if(this.parent)this.parent.nodes=this.parent.nodes.filter(n=>n!==this)}
 after(n){this.parent?.append(n)}
 addEventListener(k,cb){this.listeners[k]=cb}
 setAttribute(k,v){this.attrs[k]=v}
 querySelector(){return null}
 focus(){}
}
const traverse=n=>[n,...n.nodes.flatMap(traverse)];
async function boot(mode='immediate',basic=false){
 const nodes=Object.fromEntries(['lock-screen','unlock-form','unlock-pass','unlock-submit','unlock-message','unlock-bar','lock-stars','toggle-visibility','root'].map(x=>[x,new Element('div',x)]));
 const browser={time:0,delay:mode==='delayed'};
 nodes.root.clock=browser;
 const body=new Element('body'),head=new Element('head'),events={};
 const scripts={
  'data.js':"window.NYC_DATA={P:{pier:{address:'Test Pier, New York, NY, USA'}},DEFAULT:{},CHOICES:[]};",
  'itinerary.js':"window.NYC_PLAN={day:function(d){return d==='mon'?[{start:'16:00',end:'18:00',title:'Booked harbour cruise',place:'pier',status:'booked'}]:[]}};",
  'mta.js':'/* fixture */',
  'routeplanner.js':'/* fixture */',
  'photo-sources.js':'/* fixture */',
  'custom-stops.js':'/* fixture */',
  'app.js':mode==='empty'?'/* synthetic React mount failed */':
           mode==='delayed'?'/* React schedules a delayed render in the harness */':
           (mode==='warning'?'window.fire("error");':'')+
           'document.getElementById("root").appendChild(Object.assign(document.createElement("section"),{textContent:"Our full visual New York itinerary is rendering and contains the complete trip."}));'
 };
 const decrypted=new TextEncoder().encode(JSON.stringify(scripts));
 const localData={nyc_lyna_trip_v6:JSON.stringify({choices:{}})};
 const localStorage={
  getItem:k=>localData[k]||null,
  setItem:(k,v)=>{localData[k]=v}
 };
 const sessionData=basic?{noux_basic_mode:'1'}:{};
 const sessionStorage={
  getItem:k=>sessionData[k]||null,setItem:(k,v)=>{sessionData[k]=v},removeItem:k=>{delete sessionData[k]}
 };
 const win={
  addEventListener(k,f){(events[k]??=[]).push(f)},
  removeEventListener(k,f){events[k]=(events[k]||[]).filter(v=>v!==f)},
  fire(k){(events[k]||[]).forEach(f=>f({type:k}))},
  NOUX_EXPLORER:{install(){}},NOUX_VENUES:{install(){}},NOUX_CHOICES:{install(){}},
  NOUX_DAY_AUDIT:{install(){}},NOUX_SUBWAY:{install(){}},
  NOUX_DEPARTURE:{install:async()=>true}
 };
 const document={
  body,head,
  getElementById:id=>nodes[id]||traverse(body).find(x=>x.id===id)||null,
  createElement:tag=>new Element(tag),
  dispatchEvent(){}
 };
 let context;
 head.appendChild=n=>{if(n.tagName==='script')vm.runInContext(n.textContent,context);return n};
 const location={href:'https://example.org/nyc-lyna/',protocol:'https:',search:basic?'?basic=1':'',reload(){this.reloaded=true}};
 const crypto={subtle:{importKey:async()=>({}),deriveKey:async()=>({}),decrypt:async()=>decrypted}};
 const fetch=async()=>({ok:true,json:async()=>({salt:'',iv:'',ct:'',iterations:10000})});
 class VirtualDate extends Date{static now(){browser.time+=300;return browser.time}}
 const history={replaceState(){history.replaced=true}};
 const timers=[];
 // Virtual time avoids an 8-second CI wait but exercises multiple render probes.
 const setTimeout=(fn,_delay)=>{timers.push(Promise.resolve().then(fn));return timers.length};
 const ctx={window:win,document,location,crypto,fetch,localStorage,sessionStorage,history,
  URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,Date:VirtualDate,
  atob:x=>Buffer.from(x,'base64').toString('binary'),setTimeout,Promise,Object,Array,Math,JSON,
  CustomEvent:class{},MutationObserver:undefined};
 context=vm.createContext(ctx);
 vm.runInContext(source,context,{filename:'unlock.js'});
 nodes['unlock-pass'].value='synthetic-passphrase-only';
 await nodes['unlock-form'].listeners.submit({preventDefault(){}});
 await Promise.all(timers);
 await Promise.resolve();
 return {nodes,document,window:win,location,sessionStorage,body,browser};
}
async function run(){
 const good=await boot('immediate');
 assert(good.nodes.root.childElementCount>0,'Normal unlock renders');
 assert(!good.document.getElementById('noux-emergency-itinerary'),'Normal render has no emergency page');
 const late=await boot('delayed');
 assert(late.nodes.root.childElementCount>0,'React may take longer than 700 milliseconds');
 assert(!late.document.getElementById('noux-emergency-itinerary'),'Delayed render must not create false recovery');
 const warning=await boot('warning');
 assert(warning.nodes.root.childElementCount>0,'Visual app mounts even with unrelated window errors');
 assert(!warning.document.getElementById('noux-emergency-itinerary'),'Window warning alone cannot reject a valid login');
 const failed=await boot('empty');
 const emergency=failed.document.getElementById('noux-emergency-itinerary');
 assert(emergency,'Real missing app mount shows read-only itinerary rather than endless loop');
 assert(emergency.textContent.includes('Booked harbour cruise'),'Emergency view uses actual decrypted schedule');
 assert(emergency.textContent.includes('Test Pier'),'Emergency view offers real place address from private data');
 assert(emergency.textContent.includes('Print / save itinerary'),'Emergency schedule can be saved for travel');
 assert(!emergency.textContent.includes('Reopen the basic itinerary'),'Old loop action removed');
 const basic=await boot('empty',true);
 assert(basic.document.getElementById('noux-emergency-itinerary'),'Previously flagged basic mode also has safe fallback');
 assert(!basic.location.reloaded,'No forced reload loop');
 const recovered=await boot('immediate',true);
 assert(recovered.nodes.root.childElementCount>0,'Basic mode still opens a working itinerary');
 assert(!recovered.sessionStorage.getItem('noux_basic_mode'),'Working login clears stale temporary basic-mode flag');
 console.log('Unlock resilience PASS: normal, slow React, unrelated errors, usable emergency view, no basic-mode loop.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
