/* Public synthetic regression: original itinerary and passphrase are never used. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {TextEncoder,TextDecoder}=require('node:util');
const source=fs.readFileSync('trip-revision.js','utf8');
const coreSource=fs.readFileSync('sync-core.js','utf8');
assert(!/Sanctuary Hotel|132 W 47th|AF007|Dear Irving|Louie Vega|NOUX_PASSPHRASE/.test(source),
 'No private booking details or passphrase in published module');
const dataDates=['2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27'];
const days={};const places={};
for(let i=0;i<15;i++)places['test'+i]={name:'Test place '+i,address:'Test '+i+', NYC',
 lat:40.7+i*0.0001,lng:-73.97-i*0.0001,kind:'place'};
for(let i=0;i<dataDates.length;i++){
 const date=dataDates[i],d=date.replaceAll('-','');
 days[date]={theme:'Synthetic trip',events:[
  {id:'approved_'+d+'_00',start:'10:00',end:'11:00',title:'Approved first stop '+i,
    place:'test'+i,kind:'culture',status:'proposed',detail:'Synthetic visit'},
  {id:'approved_'+d+'_01',start:'12:00',end:'13:00',title:'Approved second stop '+i,
    place:'test'+(i+1),kind:'food',status:'proposed',detail:'Synthetic lunch'}
 ]};
}
const approved={schema:'noux-approved-plan-v1',revision:'synthetic1',places,days,alternatives:{}};
function db(entries={}){
 const state={...entries};
 return {getItem:k=>Object.hasOwn(state,k)?state[k]:null,
   setItem:(k,v)=>{state[k]=String(v)},removeItem:k=>{delete state[k]},
   key:k=>Object.keys(state)[k]||null,get length(){return Object.keys(state).length},
   // exposes actual storage keys to Object.keys, just like the browser Storage API
   [Symbol.iterator]:function*(){yield*Object.keys(state)},
   state};
}
function realDb(entries={}){
 const s=db(entries);
 return new Proxy(s,{ownKeys:()=>Object.keys(s.state),getOwnPropertyDescriptor(_,k){
  if(Object.hasOwn(s.state,k))return {configurable:true,enumerable:true,writable:true,value:s.state[k]};
  return Reflect.getOwnPropertyDescriptor(s,k);
 }});
}
function makeApp(storage){
 const window={NYC_DATA:{P:{legacy:{name:'Old'}},DEFAULT:{},CHOICES:[{id:'c1',options:[['rest','Old dinner']]}]},
  NYC_PLAN:{day:(d)=>[{id:'old_dinner',title:'Old dinner',start:'18:00',end:'19:00',kind:'food',place:'legacy',status:'proposed'},
   {id:'custom_123',title:'Personal addition',start:'21:00',end:'21:15',kind:'walk',place:'legacy',status:'proposed'}]}};
 const sent=[];const document={dispatchEvent:e=>sent.push(e.type)};
 const ctx={window,document,localStorage:storage,crypto:webcrypto,TextEncoder,TextDecoder,
  atob:x=>Buffer.from(x,'base64').toString('binary'),
  btoa:x=>Buffer.from(x,'binary').toString('base64'),CustomEvent:class{constructor(type){this.type=type}},
  Object,Array,Number,Math,JSON,Set,String};
 vm.runInNewContext(source,ctx,{filename:'trip-revision.js'});
 return {window,ctx,sent};
}
(async()=>{
 const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const storage=realDb({nyc_lyna_trip_v6:JSON.stringify({choices:{c12:'village'},customStops:[{id:'one',title:'Keep me'}]})});
 const app=makeApp(storage),api=app.window.NOUX_PLAN_REVISION;
 assert.equal(await api.prepare({key}),true);
 assert.equal(api.active(),false);
 assert.equal(api.install(),false,'No approved data: do not touch original itinerary');
 const result=await api.importText(JSON.stringify(approved));
 assert.equal(result.days,5);
 assert.equal(api.active(),true);
 const ciphertext=storage.getItem('noux_trip_revision_v1');
 assert(ciphertext.startsWith('NOUXPLAN1.'),'Encrypted atomic value in browser');
 assert(!ciphertext.includes('Approved first stop'),'No plaintext itinerary in storage');
 assert.equal(api.install(),true);
 const choices=app.window.NYC_DATA.CHOICES;
 assert.equal(choices.length,0,'Archived decisions must not suggest replacing approved Friday route');
 assert.equal(app.window.NYC_DATA.P.noux_test2.name,'Test place 2');
 assert.equal(app.window.NYC_PLAN.day('mon',{}).filter(x=>x.id==='old_dinner').length,0,'Old proposed itinerary removed');
 assert(app.window.NYC_PLAN.day('tue',{}).some(x=>x.id==='custom_123'),'User custom stop preserved');
 assert.equal(app.window.NYC_PLAN.day('fri',{}).find(x=>x.id==='approved_20261127_00').title,'Approved first stop 4',
  'Approved Friday route is fixed even with stale saved choices');
 assert.equal(app.window.NYC_PLAN.day('fri',{c12:'village'}).find(x=>x.id==='approved_20261127_00').title,'Approved first stop 4',
  'A stale Friday West Village choice must never replace DUMBO and the bridge');
 assert.equal(api.install(),true,'Idempotent install');
 assert.equal(app.sent.filter(e=>e==='noux:local-change').length,1,'Shared sync event published once');
 const invalid={...approved,schema:'not-approved'};
 await assert.rejects(()=>api.importText(JSON.stringify(invalid)));
 assert.equal(storage.getItem('noux_trip_revision_v1'),ciphertext,'Invalid import never overwrites previous ciphertext');
 const paired=makeApp(storage);assert(await paired.window.NOUX_PLAN_REVISION.prepare({key}));
 assert(paired.window.NOUX_PLAN_REVISION.active(),'Reopened phone decrypts with existing key');
 paired.window.NOUX_PLAN_REVISION.install();
 assert.equal(paired.window.NYC_PLAN.day('tue',{}).find(x=>x.id==='approved_20261124_00').title,'Approved first stop 1');
 const w={};vm.runInNewContext(coreSource,{window:w});
 const fields=w.NOUX_SYNC_CORE.scan(storage,{check:{},items:[]});
 const prop=JSON.stringify(['noux_trip_revision_v1']);
 assert.equal(fields[prop],ciphertext,'Encrypted manifest must sync as one indivisible record');
 assert(!Object.keys(fields).some(k=>k.includes('NOUXPLAN1')),'Ciphertext is a value, not a key');
 console.log('Approved private itinerary PASS: import, encryption, sync atomicity, 5 day override, custom stops, fixed Friday, reload and invalid-file protection.');
})().catch(e=>{console.error(e);process.exitCode=1});