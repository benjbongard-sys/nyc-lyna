/* NOUX automatically approved five-day itinerary.
 * Places and sightseeing times live in public approved-week.js. Booking
 * identifiers, the original private vault and passphrase are never published.
 * Unlocked users see the current itinerary without importing any file.
 */
(function(){
'use strict';
if(window.NOUX_PLAN_REVISION)return;
const STORE='noux_trip_revision_v1',PREFIX='NOUXPLAN1',AAD='NOUX-APPROVED-TRIP-V1',FORMAT='noux-approved-plan-v1';
const DATES={mon:'2026-11-23',tue:'2026-11-24',wed:'2026-11-25',thu:'2026-11-26',fri:'2026-11-27'};
const enc=new TextEncoder(),dec=new TextDecoder();
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
let KEY=null,DOC=null,ERROR='',WRAPPED=null,INITIALISED=false;
const toB64=a=>{let str='';for(let i=0;i<a.length;i+=8192)str+=String.fromCharCode(...a.subarray(i,i+8192));return btoa(str)};
const fromB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function validate(source){
 if(!source||source.schema!==FORMAT||!source.days||!source.places||
    !source.alternatives||typeof source.days!=='object'||typeof source.places!=='object')throw Error('Select the approved NOUX itinerary file, not a generic JSON export.');
 const loc=Object.entries(source.places);
 if(loc.length<12||loc.length>130)throw Error('Unexpected itinerary place count.');
 for(const [id,p] of loc){
  if(!/^[a-z][a-z0-9_]{1,48}$/.test(id)||!p||typeof p.name!=='string'||
     typeof p.address!=='string'||p.name.length>150||p.address.length>260||
     !Number.isFinite(p.lat)||!Number.isFinite(p.lng)||p.lat<40.4||p.lat>41||p.lng < -74.4||p.lng> -73.6)
    throw Error('Invalid NYC location in approved plan.');
 }
 const validateEvents=rows=>{
  if(!Array.isArray(rows)||rows.length<2||rows.length>38)throw Error('Invalid daily itinerary.');
  const ids=new Set();
  for(const e of rows){
   if(!e||typeof e.id!=='string'||!/^approved_[a-z0-9_]+$/.test(e.id)||ids.has(e.id)||
      typeof e.title!=='string'||e.title.length>200||!own(source.places,e.place)||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.end)||
      typeof e.kind!=='string'||typeof e.status!=='string'||String(e.detail||'').length>1600)
    throw Error('Malformed stop in approved plan.');
   if(e.url&&(!/^https:\/\/[a-z0-9.-]+\//i.test(e.url)||e.url.length>350))throw Error('Invalid official URL.');
   ids.add(e.id);
  }
 };
 for(const date of Object.values(DATES)){
  const obj=source.days[date];
  if(!obj||!Array.isArray(obj.events))throw Error('A travel day is missing.');
  validateEvents(obj.events);
 }
 // Alternatives are not allowed to override an explicitly approved day.
 return source;
}
async function prepare({key}={}){
 if(!key||!crypto?.subtle)return false;
 KEY=key;ERROR='';DOC=null;
 try{
  // The latest final itinerary is now deployed automatically for both devices.
  // No JSON import, old choices, or obsolete synced migration can replace it.
  if(window.NOUX_APPROVED_WEEK){
   DOC=validate(window.NOUX_APPROVED_WEEK);
   return true;
  }
  // Compatibility only for a site that has not loaded the direct plan yet.
  const record=localStorage.getItem(STORE);
  if(!record)return false;
  const match=/^NOUXPLAN1\.([A-Za-z0-9+/=]+)\.([A-Za-z0-9+/=]+)$/.exec(record);
  if(!match)throw Error('Encrypted previous revision is invalid');
  const buf=await crypto.subtle.decrypt(
   {name:'AES-GCM',iv:fromB64(match[1]),additionalData:enc.encode(AAD)},KEY,fromB64(match[2]));
  DOC=validate(JSON.parse(dec.decode(buf)));
  return true;
 }catch(e){ERROR='Unable to activate final itinerary; previous plan remains available. '+(e?.message||'');return false}
}
async function importText(text){
 if(!KEY)throw Error('Unlock NOUX with your regular passphrase first.');
 if(typeof text!=='string'||text.length>220000||text.length<800)throw Error('Unexpected file size.');
 const next=validate(JSON.parse(text));
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(AAD)},
  KEY,enc.encode(JSON.stringify(next)));
 const cipher=PREFIX+'.'+toB64(iv)+'.'+toB64(new Uint8Array(bytes));
 localStorage.setItem(STORE,cipher); // atomic single value; no private JSON committed or networked
 DOC=next;ERROR='';
 try{document.dispatchEvent(new CustomEvent('noux:local-change',{detail:{source:'approved-itinerary'}}))}catch(_){}
 return {ready:true,days:Object.keys(next.days).length,revision:String(next.revision||'approved')};
}
async function importFile(file){
 if(!file||file.size>220000)throw Error('Choose the small approved NOUX .json file.');
 return importText(await file.text());
}
function minutes(s){return Number(s?.slice(0,2))*60+Number(s?.slice(3,5))}
function finalEvents(day,choices,previous){
 const date=DATES[day];if(!date||!DOC?.days?.[date])return previous;
 // The approved final-day route is fixed, with no alternative selection.
 const source=DOC.days[date].events;
 const rows=source.map(x=>{
  const e={id:x.id,start:x.start,end:x.end,title:x.title,kind:x.kind,status:x.status,
   detail:String(x.detail||''),place:'noux_'+x.place};
  if(x.url)e.url=x.url;
  if(x.status==='ticket-to-check'&&!/not booked|not purchased|to book/i.test(e.detail))
   e.detail=(e.detail+' Ticket or reservation not yet confirmed.').trim();
  if(x.source_status==='conditional')e.detail=(e.detail+' Weather or holiday dependent.').trim();
  return e;
 });
 // The user expressly replaced the five earlier itineraries. Only
 // independently added personal stops survive, never legacy dining/nightlife.
 for(const item of Array.isArray(previous)?previous:[]){
  if(!item||typeof item.id!=='string'||!/^(custom|user)[_-]/i.test(item.id))continue;
  if(rows.some(x=>x.id===item.id))continue;
  rows.push({...item});
 }
 return rows.sort((a,b)=>minutes(a.start)-minutes(b.start));
}
function install(){
 const DATA=window.NYC_DATA,PLAN=window.NYC_PLAN;
 if(!DOC||!DATA?.P||!PLAN||typeof PLAN.day!=='function')return false;
 for(const [id,p] of Object.entries(DOC.places)){
  const key='noux_'+id;
  // Never publish the hotel address or a private flight booking in the plan
  // template. Reuse the exact protected original places after decrypting.
  const original=id==='hotel'?(DATA.P.sanctuary||DATA.P.hotel):
   id==='jfk'?(DATA.P.jfk||DATA.P.airport):null;
  DATA.P[key]={...p,...(original||{}),kind:p.kind||'place',
   url:p.url||original?.url||'',area:p.area||'NYC'};
 }
 if(Array.isArray(DATA.DAYS)){
  const headings={
   mon:'Harbour cruise, Times Square and cocktails',
   tue:'Butterflies, art, Villa Albertine and live soul',
   wed:'Chelsea, Williamsburg vintage and Louie Vega',
   thu:'Grand Central, immersive art and listening lounge',
   fri:'DUMBO, Brooklyn Bridge, Golden Diner and departure'
  };
  for(const row of DATA.DAYS)if(Array.isArray(row)&&headings[row[0]])row[3]=headings[row[0]];
 }
 try{document.body?.classList.add('noux-final-approved')}catch(_){};
 // All five days were approved. Archive obsolete itinerary decision cards.
 // The final-day route is immutable in the approved private manifest.
 if(Array.isArray(DATA.CHOICES))DATA.CHOICES.splice(0,DATA.CHOICES.length);
 // Re-wrap if a later optional enhancement changed the plan function; the
 // curated itinerary always wins over all archived route-planning defaults.
 if(PLAN.day===WRAPPED)return true;
 const prev=PLAN.day.bind(PLAN);
 const next=function(day,choices){
  let base=[];try{base=prev(day,choices)}catch(_){/* old planner must not block the approved plan */}
  if(!DOC)return base;
  // The approved Friday route cannot be changed by stale local choices.
  return finalEvents(day,choices||{},base);
 };
 next.__nouxApprovedRevision=true;
 WRAPPED=next;PLAN.day=next;
 // Legacy choice-conflict warnings refer to retired Thursday decisions.
 PLAN.findConflicts=()=>[];
 INITIALISED=true;
 return true;
}
function status(){
 return {ready:!!KEY,active:!!DOC,installed:INITIALISED,revision:DOC?.revision||'',error:ERROR,
  synced:!!window.NOUX_SYNC?.getStatus?.()?.paired};
}
window.NOUX_PLAN_REVISION={prepare,install,importText,importFile,status,active:()=>!!DOC,version:'2026.11.22-direct2'};
})();