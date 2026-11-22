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
  if(!record)return true;
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
/* Geographic, scheduled leg estimates. Google Maps opens current navigation;
   distances shown in NOUX itself are never represented as live traffic. */
function distance(a,b){
 if(!a||!b||![a.lat,a.lng,b.lat,b.lng].every(Number.isFinite))return NaN;
 const rad=Math.PI/180,lat=(b.lat-a.lat)*rad,lon=(b.lng-a.lng)*rad;
 const h=Math.sin(lat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(lon/2)**2;
 return 12742*Math.asin(Math.min(1,Math.sqrt(h)));
}
function legsFor(events){
 const p=window.NYC_DATA?.P||{},out=[],v=Array.isArray(events)?events:[];
 for(let i=1;i<v.length;i++){
  const from=v[i-1],to=v[i],a=p[from.place],b=p[to.place],km=distance(a,b);
  if(!Number.isFinite(km)||km<0.07)continue;
  const mode=a.kind==='airport'||b.kind==='airport'?'driving':km<=1.05?'walking':'transit';
  const across=/brooklyn/i.test(a.area||'')!==/brooklyn/i.test(b.area||'');
  const estimate=mode==='driving'?Math.max(45,Math.min(105,Math.ceil(36+km*1.6))):
   mode==='walking'?Math.max(3,Math.ceil(km*1.32/4.6*60)+2):
   Math.max(16,Math.min(78,Math.ceil(14+km*4.6+(across?9:0))));
  let slack=to.kind==='travel'?minutes(to.end)-minutes(to.start):minutes(to.start)-minutes(from.end);
  if(slack< -720)slack+=1440;
  out.push({from,to,km:Math.round(km*100)/100,mode,estimate,slack,
   warning:slack+4<estimate?'tight':'ok',source:'geographic estimate, not live'});
 }
 return out;
}
function priorPlace(target){
 if(!DOC||!target?.startsWith('noux_'))return null;
 const id=target.slice(5);
 for(const key of Object.keys(DATES)){
  const arr=DOC.days[DATES[key]]?.events||[];
  for(let i=0;i<arr.length;i++){
   if(arr[i].place!==id)continue;
   for(let j=i-1;j>=0;j--)if(arr[j].place!==id)return 'noux_'+arr[j].place;
  }
 }
 return null;
}
function directions(from,to,mode){
 if(to==='noux_pier')return 'https://www.google.com/maps/search/?api=1&query='+
   encodeURIComponent('Cruise boarding pier on ticket voucher New York');
 const p=window.NYC_DATA?.P||{};
 if(!p[to])return '';
 let origin=from;
 // The private core still asks for "sanctuary → current venue" on every card.
 // Correct that call to the previous APPROVED stop, not the hotel.
 if((from==='sanctuary'||from==='hotel')&&to?.startsWith('noux_'))
  origin=priorPlace(to)||'noux_hotel';
 if(!p[origin])origin='noux_hotel';
 if(!p[origin]?.address||!p[to]?.address)return '';
 return 'https://www.google.com/maps/dir/?'+new URLSearchParams({
  api:'1',origin:p[origin].address,destination:p[to].address,
  travelmode:mode==='walking'?'walking':mode==='driving'?'driving':'transit'});
}
function finalEvents(day,choices,previous){
 const date=DATES[day];if(!date||!DOC?.days?.[date])return previous;
 // The approved final-day route is fixed, with no alternative selection.
 const source=DOC.days[date].events;
 const rows=source.map(x=>{
  const e={id:x.id,start:x.start,end:x.end,title:x.title,kind:x.kind,status:x.status,
   detail:String(x.detail||''),place:'noux_'+x.place};
  if(x.url)e.url=x.url;
  if(['ticket-to-check','hours-to-check','proposed'].includes(x.status)&&window.NOUX_BOOKING_DESK?.confirmed?.(e.id)){
   if(x.status==='hours-to-check'){e.status='proposed';e.detail=(e.detail+' Opening hours checked manually.').trim();}
   else {e.status='booked';e.detail=(e.detail+' Manually confirmed in Tickets & bookings.').trim();}
  }else if(x.status==='ticket-to-check'&&!/not booked|not purchased|to book/i.test(e.detail))
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
 const photoAliases={
  hotel:['sanctuary','hotel'],jfk:['jfk','airport'],pier:['pier'],
  times:['times'],amnh:['amnh'],gugg:['guggenheim','gugg'],
  albertine:['albertine'],hudsonvu:['hudsonvu'],blue:['bluenote','blueNote'],
  nypl:['nypl'],bryant:['bryant'],chelsea:['chelsea'],whitney:['whitney'],
  little:['littleIsland','little'],domino:['domino'],awoke:['awoke'],
  stella:['stella'],mables:['mables'],superior:['superiorIngredients'],
  grand:['grandcentral','grand'],mercer:['mercer'],golden:['golden'],
  rough:['roughtrade','rough'],dumbo:['dumbo']
 };
 for(const [id,p] of Object.entries(DOC.places)){
  const key='noux_'+id;
  // Exact lodging details remain exclusively in the decrypted private vault.
  const original=id==='hotel'?(DATA.P.sanctuary||DATA.P.hotel):
   id==='jfk'?(DATA.P.jfk||DATA.P.airport):null;
  const legacy=(photoAliases[id]||[]).map(k=>DATA.P[k]).find(v=>v?.photo)||null;
  DATA.P[key]={...p,...(original||{}),kind:p.kind||'place',
   url:p.url||original?.url||'',area:p.area||'NYC',
   photo:original?.photo||legacy?.photo||p.photo||undefined};
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
 // Keep relevant creative/music alternatives in the native wishlist, not
 // as new decisions or extra compulsory day stops.
 if(Array.isArray(DATA.WISHES)){
  const extras=[
   ['ARTE MUSEUM · immersive digital art','art','','choice'],
   ['Colbo Next Door · listening bar and natural wine','music','','choice'],
   ['Only The Wild Ones · listening lounge','music','','choice'],
   ['DAYDREAM · Balloon Museum','art','thu','core'],
   ['Mercer Labs · art and technology','art','thu','core'],
   ['West Village · neighbourhood walk','culture','','choice']
  ];
  const key=v=>String(v||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  for(const w of extras){
   const short=key(w[0].split(' · ')[0]);
   if(!DATA.WISHES.some(x=>Array.isArray(x)&&key(x[0]).includes(short)))DATA.WISHES.push(w);
  }
 }
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
 PLAN.legs=legsFor;
 PLAN.routeUrl=directions;
 PLAN.findConflicts=()=>[];
 INITIALISED=true;
 return true;
}
let DECORATION_OBSERVER=null;
function decorate(){
 if(!DOC||typeof document==='undefined'||!document.body)return false;
 document.body.classList?.add('noux-final-approved');
 const hideOldDecisions=()=>{
  const root=document.getElementById?.('root');
  if(!root)return;
  for(const button of root.querySelectorAll?.('button')||[]){
   const name=String(button.textContent||'').trim();
   if(/^(?:lyna.s decisions|make the decisions|choose our version of new york)$/i.test(name)){
    button.hidden=true;
    button.setAttribute?.('aria-hidden','true');
   }
  }
 };
 hideOldDecisions();
 if(!DECORATION_OBSERVER&&typeof MutationObserver!=='undefined'){
  const root=document.getElementById?.('root');
  if(root){
   DECORATION_OBSERVER=new MutationObserver(hideOldDecisions);
   DECORATION_OBSERVER.observe(root,{childList:true,subtree:true});
  }
 }
 return true;
}
function status(){
 return {ready:!!KEY,active:!!DOC,installed:INITIALISED,revision:DOC?.revision||'',error:ERROR,
  synced:!!window.NOUX_SYNC?.getStatus?.()?.paired};
}
window.NOUX_PLAN_REVISION={prepare,install,decorate,importText,importFile,status,active:()=>!!DOC,version:'2026.11.22-direct2'};
})();