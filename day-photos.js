/* NOUX fixed five-day itinerary photo binding.
 * The encrypted React bundle uses a decorative "New York" fallback even for
 * destinations with local photographs. This component attaches the *actual*
 * event photograph visually without modifying React-managed child nodes.
 * Only same-origin, build-verified assets may be displayed.
 */
(function(){
'use strict';
if(window.NOUX_DAILY_PHOTOS)return;
const DAY_DATES={mon:'2026-11-23',tue:'2026-11-24',wed:'2026-11-25',thu:'2026-11-26',fri:'2026-11-27'};
const EVENT_PHOTOS=Object.freeze({
 approved_20261123_00:'jfk',
 approved_20261123_01:'hotel',
 approved_20261123_02:'pier79',
 approved_20261123_03:'pier79',
 approved_20261123_04:'cruise',
 approved_20261123_05:'times',
 approved_20261123_06:'tacos',
 approved_20261123_07:'dear',
 approved_20261124_00:'hotel',
 approved_20261124_01:'butterfly',
 approved_20261124_02:'oak',
 approved_20261124_03:'guggenheim',
 approved_20261124_04:'albertine',
 approved_20261124_05:'hudsonvu',
 approved_20261124_06:'hudsonvu',
 approved_20261124_07:'bluenote',
 approved_20261124_08:'bluenote',
 approved_20261124_09:'bluenote',
 approved_20261125_00:'hotel',
 approved_20261125_01:'nypl',
 approved_20261125_02:'bryant',
 approved_20261125_03:'lobsterplace',
 approved_20261125_04:'lobsterplace',
 approved_20261125_05:'whitney',
 approved_20261125_06:'little',
 approved_20261125_07:'domino',
 approved_20261125_08:'domino',
 approved_20261125_09:'awoke',
 approved_20261125_10:'stella',
 approved_20261125_11:'mables',
 approved_20261125_12:'domino',
 approved_20261125_13:'superior',
 approved_20261126_00:'hotel',
 approved_20261126_01:'grandcentral',
 approved_20261126_02:'mercer',
 approved_20261126_03:'mercer',
 approved_20261126_04:'sadies',
 approved_20261126_05:'daydream',
 approved_20261126_06:'colbo',
 approved_20261126_07:'colbo',
 approved_20261126_08:'nubeluz',
 approved_20261126_09:'nubeluz',
 approved_20261127_00:'hotel',
 approved_20261127_01:'dumbo',
 approved_20261127_02:'dumbo',
 approved_20261127_03:'bridge',
 approved_20261127_04:'bridge',
 approved_20261127_05:'golden',
 approved_20261127_06:'rockefeller',
 approved_20261127_07:'rough',
 approved_20261127_08:'hotel',
 approved_20261127_09:'hotel',
 approved_20261127_10:'jfk'
});
const VALID_PATH=/^assets\/photos\/[a-z0-9_-]+\.jpg$/;
const loaded=new Map();
let INSTALLED=false,OBSERVER=null,QUEUED=false,RENDERED=0;
function resolve(eventId){
 const key=EVENT_PHOTOS[eventId];
 if(!key)return null;
 const source=window.NYC_PHOTO_INDEX?.[key];
 if(source&&source.path!==undefined&&(!source.path||!VALID_PATH.test(source.path)))return null;
 const path=source?.path||'assets/photos/'+key+'.jpg';
 if(!VALID_PATH.test(path))return null;
 return {eventId,key,path,label:String(source?.label||key),credit:String(source?.credit||''),exact:source?.exact===true};
}
function planned(day){
 const date=DAY_DATES[day];
 return date&&window.NOUX_APPROVED_WEEK?.days?.[date]?.events||[];
}
function normalise(text){
 return String(text||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function eventForRow(row,events,index,total){
 const element=row.querySelector?.('.event-content h3')||row.querySelector?.('h3');
 const title=normalise(element?.textContent);
 const time=String(row.querySelector?.('.event-time b')?.textContent||'').trim();
 if(title){
  const matched=events.filter(event=>normalise(event.title)===title);
  if(matched.length===1)return matched[0];
  if(matched.length>1&&time){
   const timed=matched.find(event=>event.start===time.slice(0,5));
   if(timed)return timed;
  }
  // React may add short status text to headings. Still require a unique title.
  const fuzzy=events.filter(event=>{
   const name=normalise(event.title);
   return name.length>9&&(title.includes(name)||name.includes(title)&&title.length>9);
  });
  if(fuzzy.length===1)return fuzzy[0];
  // A labelled but unmatched custom stop must NEVER inherit an adjacent photo,
  // even if it happens to replace one approved row at the same position.
  return null;
 }
 // Ordinal fallback is allowed only for the exact fixed 53-event schedule,
 // never when personal/custom stops alter row count or order.
 if(total===events.length)return events[index]||null;
 return null;
}
function imageUrl(path){
 const base=window.NYC_BASE||new URL('./',window.location?.href||location.href).href;
 const url=new URL(path,base);
 const origin=new URL(base).origin;
 return url.origin===origin?url.href:'';
}
function preload(record){
 const url=imageUrl(record.path);
 if(!url)return Promise.resolve('');
 if(loaded.has(url))return loaded.get(url);
 const task=new Promise(resolve=>{
  const Creator=window.Image;
  if(typeof Creator!=='function'){resolve('');return}
  const photo=new Creator();
  let settled=false;
  function finish(ok){if(settled)return;settled=true;resolve(ok?url:'')}
  photo.onload=()=>finish(photo.naturalWidth>0);
  photo.onerror=()=>finish(false);
  photo.src=url;
  if(photo.complete&&photo.naturalWidth>0)finish(true);
 });
 loaded.set(url,task);
 // A first visit while offline must not permanently cache a failed image.
 // Retry after connectivity returns, without clearing browser storage.
 void task.then(result=>{if(!result&&loaded.get(url)===task)loaded.delete(url)});
 return task;
}
function clearRow(row){
 if(!row)return;
 row.classList?.remove('noux-daily-event-photo');
 row.style?.removeProperty('--noux-daily-event-photo');
 if(row.dataset){
  delete row.dataset.nouxPhotoPending;
  delete row.dataset.nouxPhotoKey;
  delete row.dataset.nouxPhotoId;
 }
}
function decorateRows(day,rows){
 const events=planned(day);
 if(!events.length||!Array.isArray(rows))return {matched:0,eligible:0,missingThumbs:0};
 let matched=0,eligible=0,missingThumbs=0;
 rows.forEach((row,index)=>{
  // A large proportion of legacy React event cards have NO .event-thumb
  // element at all. The previous implementation skipped those entire rows,
  // so successful 53/53 asset tests still left blank space on every day.
  // Paint a pseudo-element on the .event ROW, not on an optional child.
  if(!row.querySelector?.('.event-thumb'))missingThumbs++;
  const event=eventForRow(row,events,index,rows.length);
  const record=event&&resolve(event.id);
  if(!record){clearRow(row);return}
  matched++;
  if(row.dataset?.nouxPhotoId===record.eventId&&
    row.classList?.contains('noux-daily-event-photo')){eligible++;return}
  if(row.dataset){
   row.dataset.nouxPhotoPending=record.eventId;
   if(row.dataset.nouxPhotoId!==record.eventId){
    row.classList?.remove('noux-daily-event-photo');
    row.style?.removeProperty('--noux-daily-event-photo');
   }
  }
  void preload(record).then(url=>{
   if(!url||row.isConnected===false||
      row.dataset?.nouxPhotoPending!==record.eventId)return;
   // Only CSS custom properties / classes on existing React nodes are changed.
   // No element is inserted into, moved within or removed from React's tree.
   row.style?.setProperty('--noux-daily-event-photo','url("'+url+'")');
   row.dataset.nouxPhotoId=record.eventId;
   row.dataset.nouxPhotoKey=record.key;
   row.classList?.add('noux-daily-event-photo');
   row.setAttribute?.('data-noux-photo-credit',record.credit);
   const placeholder=row.querySelector?.('.event-thumb .no-photo');
   placeholder?.setAttribute?.('aria-hidden','true');
   RENDERED++;
  });
  eligible++;
 });
 return {matched,eligible,missingThumbs};
}
function selectedDay(){
 const tabs=Array.from(document.querySelectorAll?.('.daytabs .daytab')||[]);
 const selected=tabs.findIndex(node=>node.classList?.contains('chosen'));
 return Object.keys(DAY_DATES)[selected>=0?selected:0];
}
function refresh(){
 QUEUED=false;
 if(!INSTALLED)return;
 const root=document.getElementById?.('root');
 if(!root||root.hidden)return;
 const rows=Array.from(root.querySelectorAll?.('.timeline .event')||[]);
 if(!rows.length)return;
 decorateRows(selectedDay(),rows);
}
function queue(){
 if(!INSTALLED||QUEUED)return;
 QUEUED=true;
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(refresh);
 else setTimeout(refresh,0);
}
function install(){
 if(INSTALLED)return true;
 if(!window.NOUX_APPROVED_WEEK||!document.getElementById?.('root'))return false;
 INSTALLED=true;
 if(typeof MutationObserver==='function'){
  OBSERVER=new MutationObserver(queue);
  OBSERVER.observe(document.getElementById('root'),{childList:true,subtree:true,characterData:true});
 }
 document.addEventListener('click',function(event){
  if(event.target?.closest?.('.daytabs .daytab'))queue();
 },true);
 document.addEventListener('noux:replan',queue);
 window.addEventListener?.('noux:sync-data-arrived',queue);
 window.addEventListener?.('pageshow',queue);
 window.addEventListener?.('online',queue);
 queue();
 return true;
}
function audit(){
 const events=Object.values(DAY_DATES).flatMap(date=>window.NOUX_APPROVED_WEEK?.days?.[date]?.events||[]);
 const keys=new Set(events.map(item=>item.id));
 const missing=events.filter(item=>!resolve(item.id)).map(item=>item.id);
 const unexpected=Object.keys(EVENT_PHOTOS).filter(id=>!keys.has(id));
 return {scheduled:events.length,mapped:events.length-missing.length,missing,unexpected,rendered:RENDERED,installed:INSTALLED};
}
window.NOUX_DAILY_PHOTOS={
 install,refresh,decorateRows,resolve,audit,assigned:EVENT_PHOTOS,
 version:'2026.11.23-daily-photo-renderer2'
};
})();