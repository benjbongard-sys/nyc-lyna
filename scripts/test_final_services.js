/* Synthetic final operations regression: no user itinerary or passphrase in tests. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto'),{TextEncoder,TextDecoder}=require('node:util');
const code=n=>fs.readFileSync(n,'utf8');
const names=['approved-week.js','trip-revision.js','booking-desk.js','route-guide.js','food-wishlist.js','food-guide.js','sync-core.js'];
for(const n of names)new vm.Script(code(n),{filename:n});
for(const name of ['booking-desk.js','route-guide.js']){
 assert(!/NOUX_PASSPHRASE|Sanctuary Hotel|132 West 47th|AF007/.test(code(name)),'No private credentials or hotel address in '+name);
}
function storage(){
 const state={};
 return new Proxy({getItem:k=>state[k]||null,setItem:(k,v)=>state[k]=String(v),removeItem:k=>delete state[k],state},{
  ownKeys:()=>Object.keys(state),
  getOwnPropertyDescriptor:(target,k)=>Object.hasOwn(state,k)?{configurable:true,enumerable:true,value:state[k]}:Reflect.getOwnPropertyDescriptor(target,k)
 });
}
const db=storage(),messages=[];
const win={NYC_DATA:{P:{sanctuary:{name:'Private accommodation',address:'PRIVATE HOTEL, NYC, USA',lat:40.757,lng:-73.986,area:'Midtown'},
 jfk:{name:'JFK',address:'JFK Airport, USA',lat:40.6413,lng:-73.7781,kind:'airport'}},
 DAYS:[['mon','MON','23 NOV','old'],['tue','TUE','24 NOV','old'],['wed','WED','25 NOV','old'],['thu','THU','26 NOV','old'],['fri','FRI','27 NOV','old']],
 CHOICES:[{id:'c1'}],DEFAULT:{},WISHES:[]},
 NYC_PLAN:{day:()=>[{id:'old',title:'Old plan',start:'09:00',end:'10:00',kind:'food',place:'sanctuary'}],
 legs:()=>[],routeUrl:()=>'',findConflicts:()=>['old conflict']}};
const doc={dispatchEvent:e=>messages.push(e.type),body:{classList:{add(){}}}};
const ctx={window:win,document:doc,localStorage:db,crypto:webcrypto,TextEncoder,TextDecoder,
 URLSearchParams,Uint8Array,atob:x=>Buffer.from(x,'base64').toString('binary'),
 btoa:x=>Buffer.from(x,'binary').toString('base64'),
 CustomEvent:class{constructor(type){this.type=type}},Object,Array,String,Number,Math,JSON,Set};
for(const n of names)vm.runInNewContext(code(n),ctx,{filename:n});
(async()=>{
 const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 assert(await win.NOUX_PLAN_REVISION.prepare({key}));
 assert(win.NOUX_PLAN_REVISION.install());
 const day=win.NYC_PLAN.day('wed',{});
 assert(day.some(e=>e.title.includes('Louie Vega')));
 assert(day.every(e=>e.id!=='old'));
 assert(win.NYC_PLAN.legs(day).length>=8,'Travel legs computed for most stop-to-stop moves');
 const friday=win.NYC_PLAN.day('fri',{c12:'village'});
 assert(friday.some(e=>/Walk Brooklyn Bridge/.test(e.title)));
 assert(friday.some(e=>/Golden Diner/.test(e.title)));
 const golden=friday.find(e=>/Golden Diner/.test(e.title));
 const direction=win.NYC_PLAN.routeUrl('sanctuary',golden.place,'walking');
 assert(direction.includes('City+Hall+Park')||direction.includes('City%20Hall%20Park'),'Golden Diner link starts from bridge Manhattan end');
 assert(!direction.includes('PRIVATE+HOTEL'),'Every card no longer gives directions from hotel');
 const gLeg=win.NYC_PLAN.legs(friday).find(x=>x.to.id===golden.id);
 assert(gLeg&&gLeg.estimate>0&&gLeg.mode==='walking','Friday bridge-to-diner walking link exists');
 assert(win.NYC_PLAN.routeUrl('noux_dumbo','noux_bridge_bk','walking').includes('Washington+Street'),'Explicit pair route is preserved');
 assert(win.NYC_PLAN.routeUrl('sanctuary','noux_pier','transit').includes('booking+voucher'),'Unknown cruise pier must not masquerade as a verified point');
 const booking=win.NOUX_BOOKING_DESK;
 assert.equal(booking.confirmed('approved_20261123_07'),true,'Dear Irving previously booked');
 assert.equal(booking.confirmed('approved_20261127_09'),true,'Airport group coach arranged');
 assert.equal(booking.confirmed('approved_20261125_13'),false,'Louie Vega not automatically purchased');
 assert(booking.setConfirmed('approved_20261125_13',true),'Manual booking can be marked');
 assert.equal(booking.confirmed('approved_20261125_13'),true);
 const after=win.NYC_PLAN.day('wed',{});
 assert.equal(after.find(x=>x.id==='approved_20261125_13').status,'booked','Timeline responds to confirmed ticket');
 assert.equal(win.NYC_PLAN.day('fri',{}).find(x=>x.id==='approved_20261127_09').status,'arranged','Coach stays arranged, not falsely booked');
 assert(!booking.setConfirmed('approved_20261123_07',false),'Cannot unbook a previously confirmed booking from app');
 assert.equal(booking.confirmed('approved_20261123_07'),true);
 assert(messages.includes('noux:local-change'),'Booking changes trigger encrypted sync client');
 const syncCore=win.NOUX_SYNC_CORE;
 const fields=syncCore.scan(db,{check:{},items:[]});
 assert(Object.keys(fields).some(x=>x.includes('noux_booking_status_v1')),'Booking status participates in encrypted paired sync');
 assert(win.NOUX_ROUTE_GUIDE.context('sadies').hours.includes('10:00'),'Seaport Thanksgiving hours enriched');
 assert(win.NOUX_ROUTE_GUIDE.context('golden').note.includes('Confirm'),'Golden Diner holiday hours transparently uncertain');
 const guide=win.NOUX_ROUTE_GUIDE.summary('thu');
 assert(guide.events.some(x=>x.title.includes('Mercer Labs')));
 assert(guide.events.some(x=>x.title.includes('DAYDREAM')));
 const food=win.NOUX_FOOD_WISHLIST;
 assert(food.install().ready);
 const namesList=win.NYC_DATA.WISHES.filter(w=>w[1]==='food').map(w=>w[0].toLowerCase());
 assert(namesList.some(x=>x.includes('golden diner'))&&namesList.some(x=>x.includes("sadie's")));
 assert(win.NOUX_FOOD_GUIDE.install({headless:true}));
 const profiles=win.NOUX_FOOD_GUIDE.catalogue();
 assert(profiles.some(x=>x.id==='goldendiner'&&x.days.includes('fri')));
 assert(profiles.some(x=>x.id==='sadies'&&x.thursday.includes('10:00')));
 console.log('Final operations PASS: fixed 5-day itinerary; step-to-step routing; native map input; live navigation links; reservation status; encrypted sync; dining and Thanksgiving enrichment.');
})().catch(e=>{console.error(e);process.exitCode=1});