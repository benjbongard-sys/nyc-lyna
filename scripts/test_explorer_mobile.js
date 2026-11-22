/* NOUX iPhone Explore visibility and remount regression: synthetic DOM. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('explorer.js','utf8'),css=fs.readFileSync('styles.css','utf8');
new vm.Script(source,{filename:'explorer.js'});
assert(css.includes('#noux-explorer-launch.noux-explorer-launch'),'Dedicated mobile Explore visibility CSS is included');
assert(css.includes('bottom:calc(83px + env(safe-area-inset-bottom,0px))'),'Button clears Safari toolbar and home indicator');
assert(css.includes('#noux-explorer-drawer.noux-explorer-drawer:not([hidden])'),'Mobile Explore uses a nonempty full-screen sheet');
assert(css.includes('height:100dvh!important'),'Open sheet fills usable iPhone viewport');
assert(css.includes('overflow-y:auto!important'),'Explore content scrolls inside the mobile sheet');
class Node{
 constructor(tag){this.tagName=tag;this.className='';this.id='';this.textContent='';this.children=[];this.listeners={};this.style={};this.attrs={};this.hidden=false;this.classList={contains:k=>this.className.split(' ').includes(k)}}
 append(...items){this.children.push(...items)}
 appendChild(x){this.append(x);return x}
 replaceChildren(...items){this.children=[];this.append(...items)}
 setAttribute(k,v){this.attrs[k]=v}
 removeAttribute(k){delete this.attrs[k]}
 addEventListener(k,f){this.listeners[k]=f}
 click(){this.listeners.click?.()}
}
const body=new Node('body'),root=new Node('div');root.id='root';
const storage={getItem:()=>null,setItem(){}};
const loc={hotel:{name:'Hotel',area:'Midtown',kind:'hotel',lat:40.755,lng:-73.985}};
const base=()=>[{id:'stay',start:'10:00',end:'11:00',title:'Stay at hotel',place:'hotel',kind:'hotel',status:'arranged'}];
const names=['mon','tue','wed','thu','fri'];
const data={P:loc,DEFAULT:{},CHOICES:[],DATES:Object.fromEntries(names.map((d,i)=>[d,'2026-11-'+(23+i)])),
 DAYS:names.map((d,i)=>[d,d.toUpperCase(),String(23+i)+' NOV']),WISHES:[]};
const find=id=>[...body.children].find(n=>n.id===id)||null;
const document={
 body,readyState:'complete',
 getElementById:id=>id==='root'?root:find(id),
 createElement:t=>new Node(t),
 querySelectorAll:()=>[],
 querySelector:()=>null,
 addEventListener(){}
};
const context={window:{NYC_DATA:data,NYC_PLAN:{day:base},NOUX_PLAN_REVISION:{active:()=>true},
 NOUX_CHOICES:{alternatives:()=>{throw Error('Retired Decisions is not initialised')}}},
 document,localStorage:storage,Array,Object,JSON,Date,Math,Intl,Set,Number,String,
 setTimeout:fn=>{fn();return 1},setInterval:()=>1};
vm.runInNewContext(source,context,{filename:'explorer.js'});
const explorer=context.window.NOUX_EXPLORER;
const approvedDay=context.window.NYC_PLAN.day;
assert(explorer.install({displayOnly:true}),'Explorer installed after private data even in basic/approved mode');
assert.equal(context.window.NYC_PLAN.day,approvedDay,'Explorer must not modify fixed approved schedule in recovery/basic mode');
assert(explorer.ensure(),'Explore shortcut is mounted and visible after React first paint');
let launch=find('noux-explorer-launch'),drawer=find('noux-explorer-drawer');
assert(launch&&drawer,'Explore and its drawer are present');
assert(!launch.hidden,'Explore visible on iPhone');
launch.click();
assert.equal(drawer.hidden,false,'Explore opens drawer on iPhone');
assert(drawer.children.length>4,'Drawer contains actual itinerary/wishlist sections');
assert(!drawer.children.some(x=>x.textContent==='The five-day itinerary is still available. Open the schedule or Wishlist below.'),
 'Retired Decisions must not cause fallback or a blank drawer');
launch.click();
assert(drawer.hidden,'Close Explore restores main page');
context.window.NOUX_DAY_AUDIT={pending:()=>{throw Error('Unrelated optional audit failure')}};
launch.click();
assert(!drawer.hidden,'Explore still opens after optional module failure');
assert.equal(drawer.children.length,3,'A safe fallback replaces failed content, never the empty 40px strip');
assert(drawer.children[1].textContent.includes('five-day itinerary'),'Fallback explains and links to the original itinerary');
launch.click();
delete context.window.NOUX_DAY_AUDIT;
assert(explorer.ensure(),'Repeated ensure calls succeed without duplicates');
assert.equal(body.children.filter(n=>n.id==='noux-explorer-launch').length,1,'No duplicate shortcuts');
body.children=body.children.filter(n=>n!==launch);
assert(explorer.ensure(),'Shortcut remounted after mobile navigation removes it');
assert(find('noux-explorer-launch')&&body.children.filter(n=>n.id==='noux-explorer-launch').length===1,'Exactly one replacement Explore shortcut');
console.log('Explore iPhone PASS: visible above Safari bar, interactive drawer, remount and no duplicate floating buttons.');
