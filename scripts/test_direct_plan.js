/* Public synthetic regression for direct deployment: no file import required. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto'),{TextEncoder,TextDecoder}=require('node:util');
const week=fs.readFileSync('approved-week.js','utf8');
const engine=fs.readFileSync('trip-revision.js','utf8');
const dayPhotos=fs.readFileSync('day-photos.js','utf8');
new vm.Script(week);new vm.Script(dayPhotos);new vm.Script(engine);
assert(!/NOUX_PASSPHRASE|132 West 47th|AF007|Benjamin Bongard|Lyna Bongard/.test(week),
 'No private credential, hotel address, or named traveller details are published');
const win={NYC_DATA:{P:{sanctuary:{name:'Protected Accommodation',address:'PRIVATE',lat:40.7599,lng:-73.9847}},
 DEFAULT:{c1:'nubeluz',c3:'soul',c11:'wed'},CHOICES:[{id:'c1'},{id:'c3'},{id:'c11'}],
 DAYS:[['mon','MON','23 NOV','Old Monday'],['tue','TUE','24 NOV','Old Tuesday'],['wed','WED','25 NOV','Old Wednesday'],['thu','THU','26 NOV','Old Thursday'],['fri','FRI','27 NOV','Old Friday']]},
 NYC_PLAN:{day:d=>[{id:'old_'+d,start:'12:00',end:'14:00',title:'Retired old plan',place:'legacy',status:'proposed',kind:'food'},
  {id:'custom_phone',start:'21:00',end:'21:15',title:'Personal user stop',place:'custom',kind:'shopping',status:'proposed'}],
 findConflicts:()=>['Retired conflict warning']}};
// Mimic the manifest produced by the photo-builder without publishing any
// decrypted itinerary or importing external images in this Node test.
win.NYC_PHOTO_INDEX={
 pier79:{path:'assets/photos/pier79.jpg',credit:'NY Waterway',source:'https://www.nywaterway.com/',exact:true},
 lobsterplace:{path:'assets/photos/lobsterplace.jpg',credit:'Chelsea Market',source:'https://www.chelseamarket.com/',exact:true}
};
const buttons=[{textContent:"Lyna's decisions",hidden:false,setAttribute(){}},{textContent:'Daily itinerary',hidden:false,setAttribute(){}},{textContent:'Make the decisions',hidden:false,setAttribute(){}}];
const doc={body:{classList:{classes:new Set(),add(x){this.classes.add(x)}}},getElementById:()=>({querySelectorAll:()=>buttons}),
 dispatchEvent(){}};
const store={getItem:()=>null,setItem(){},removeItem(){}};
const ctx={window:win,document:doc,localStorage:store,crypto:webcrypto,TextEncoder,TextDecoder,
 Uint8Array,atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64'),
 Object,Array,Number,String,Math,JSON,Set,Date};
vm.runInNewContext(week,ctx,{filename:'approved-week.js'});
vm.runInNewContext(dayPhotos,ctx,{filename:'day-photos.js'});
vm.runInNewContext(engine,ctx,{filename:'trip-revision.js'});
(async()=>{
 const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 assert.equal(await win.NOUX_PLAN_REVISION.prepare({key}),true,'Unlock loads approved plan without an import');
 assert(win.NOUX_PLAN_REVISION.active(),'Approved plan is activated automatically');
 assert.equal(win.NOUX_PLAN_REVISION.install(),true);
 assert.equal(win.NYC_DATA.CHOICES.length,0,'Retired decisions are removed from the native UI');
 assert.equal(win.NYC_DATA.P.noux_hotel.address,'PRIVATE','Protected hotel address reused from decrypted vault');
 assert.equal(win.NYC_DATA.P.noux_pier.photo,'assets/photos/pier79.jpg','Monday pier renders the actual terminal photograph');
 assert.equal(win.NYC_DATA.P.noux_chelsea.photo,'assets/photos/lobsterplace.jpg','Chelsea Market uses Lobster Place imagery');
 assert.equal(win.NYC_PHOTO_INDEX.noux_pier,win.NYC_PHOTO_INDEX.pier79,'Private photo resolver can look up noux_ prefixed places');
 assert.equal(win.NYC_PLAN.day('mon',{}).find(x=>x.id==='approved_20261123_04').photo,'assets/photos/cruise.jpg','Booked cruise shows actual cruise photo, not Pier 79 terminal');
 assert.equal(win.NYC_PLAN.day('mon',{}).find(x=>x.id==='approved_20261123_03').photo,'assets/photos/pier79.jpg','Boarding instructions use ferry-terminal photo');
 assert.equal(win.NYC_PLAN.day('tue',{}).find(x=>x.id==='approved_20261124_02').photo,'assets/photos/oak.jpg','Central Park transfer uses park scenery');
 assert.equal(win.NYC_PLAN.day('fri',{}).find(x=>x.id==='approved_20261127_12').photo,'assets/photos/albertine.jpg','Friday moved Albertine has correct photo');
 assert.equal(win.NYC_PLAN.day('fri',{}).find(x=>x.id==='approved_20261127_14').photo,'assets/photos/awoke.jpg','Friday thrift shop photo follows moved event');
 assert.equal(win.NYC_PLAN.day('fri',{}).find(x=>x.id==='approved_20261127_16').photo,'assets/photos/stella.jpg','Friday Stella Dallas has correct photo');
 assert.equal(win.NYC_PLAN.day('thu',{}).find(x=>x.id==='approved_20261126_11').photo,'assets/photos/arte.jpg','ARTE has separate photograph');
 assert(win.NYC_DATA.DAYS[2][3].includes('Louie Vega'),'Day headings reflect approved week');
 assert.equal(win.NYC_PLAN.findConflicts().length,0);
 assert.equal(win.NOUX_PLAN_REVISION.decorate(),true);
 assert.equal(buttons[0].hidden,true);assert.equal(buttons[2].hidden,true);assert.equal(buttons[1].hidden,false);
 for(const day of ['mon','tue','wed','thu','fri']){
  const events=win.NYC_PLAN.day(day,{c12:'village',c3:'soul'});
  assert(events.length>7,'Complete native route for '+day);
  assert(!events.some(x=>x.id==='old_'+day),'No legacy route retained '+day);
  assert(events.some(x=>x.id==='custom_phone'),'Independent personal stop preserved '+day);
  assert(events.every(e=>!!win.NYC_DATA.P[e.place]||e.id==='custom_phone'),'All approved pins resolve '+day);
 }
 const fri=win.NYC_PLAN.day('fri',{c12:'village',c11:'wed'});
 assert(fri.some(e=>/DUMBO/.test(e.title)),'Friday DUMBO is fixed');
 assert(fri.some(e=>/Walk Brooklyn Bridge/.test(e.title)),'Friday bridge is fixed');
 assert(fri.some(e=>/Golden Diner/.test(e.title)),'Friday Golden Diner is fixed');
 assert(!fri.some(e=>/West Village/.test(e.title)),'No Friday West Village substitution');
 const mon=win.NYC_PLAN.day('mon',{});
 assert(mon.some(e=>/Dear Irving/.test(e.title)&&e.status==='booked'));
 const wed=win.NYC_PLAN.day('wed',{c3:'soul'});
 assert(wed.some(e=>/Louie Vega/.test(e.title))&&!wed.some(e=>/Soul in the Horn/.test(e.title)));
 const thu=win.NYC_PLAN.day('thu',{});
 assert(thu.some(e=>/Mercer Labs/.test(e.title))&&thu.some(e=>e.place==='noux_arte'&&e.kind==='museum')&&!thu.some(e=>e.place==='noux_daydream'));
 assert(!thu.some(e=>/Rockettes|River Cafe|Le Bain/.test(e.title)));
 console.log('Direct week PASS: all five days automatically active, fixed Friday, no decisions/import, private hotel preserved, maps and personal stops intact.');
})().catch(e=>{console.error(e);process.exitCode=1});