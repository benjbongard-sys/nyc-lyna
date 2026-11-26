/* Strict NOUX photograph audit: 56 EVENT identities, local file bytes and
 * DOM thumbnail rendering, not merely a source manifest or 30 location keys.
 * The React private vault and the traveller's passphrase are not accessed.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const week=fs.readFileSync('approved-week.js','utf8');
const moduleCode=fs.readFileSync('day-photos.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('assets/photo-index.json','utf8'));
const sources=JSON.parse(fs.readFileSync('scripts/photo_sources.json','utf8'));
assert(css.includes('.event.noux-daily-event-photo::after'),
  'CSS must paint the event ROW when React omitted its optional thumbnail');
assert(css.includes('background-image:var(--noux-daily-event-photo)'),
  'Event image CSS must use the resolved local photograph');
assert(css.includes('grid-column:3')&&css.includes('grid-row:2'),
  'On narrow mobile screens photos are visible without hiding text');
assert(html.indexOf('./approved-week.js')<html.indexOf('./day-photos.js')&&
  html.indexOf('./day-photos.js')<html.indexOf('./trip-revision.js'),
  'Photo resolver loads after approved week and before the React itinerary adapter');
assert(!/passphrase|NOUX_PASSPHRASE|Sanctuary Hotel/.test(moduleCode),
  'Public event renderer must never contain credentials or private accommodation details');
class FakeThumb {
 constructor(){
  this.dataset={};this.attrs={};this.tagName='DIV';this.isConnected=true;
  this.values={};this.style={setProperty:(k,v)=>{this.values[k]=v},
   removeProperty:k=>{delete this.values[k]}};
  const classes=new Set(['photo','event-thumb']);
  this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};
  this.placeholder={setAttribute:(k,v)=>{this.attrs['placeholder-'+k]=v}};
 }
 setAttribute(k,v){this.attrs[k]=String(v)}
 querySelector(sel){return sel==='.no-photo'?this.placeholder:null}
}
class FakeRow {
 constructor(event,hasThumb=true){
  this.event=event;this.thumb=hasThumb?new FakeThumb():null;this.isConnected=true;
  this.dataset={};this.attrs={};this.values={};
  this.style={
   setProperty:(k,v)=>{this.values[k]=v},
   removeProperty:k=>{delete this.values[k]}
  };
  const classes=new Set(['event']);
  this.classList={add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};
 }
 setAttribute(k,v){this.attrs[k]=String(v)}
 querySelector(sel){
  if(sel==='.event-thumb')return this.thumb;
  if(sel==='.event-thumb .no-photo')return this.thumb?.placeholder||null;
  if(sel==='.event-content h3'||sel==='h3')return {textContent:this.event.title};
  if(sel==='.event-time b')return {textContent:this.event.start};
  return null;
 }
}
const DAYS=['mon','tue','wed','thu','fri'];
const dates=['2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27'];
const root={hidden:false,isConnected:true,querySelectorAll:()=>[]};
let activeDay=0,visibleRows=[],frames=[],observer=null;
const listeners={};
const document={getElementById:id=>id==='root'?root:null,
 querySelectorAll:sel=>sel==='.daytabs .daytab'?DAYS.map((d,i)=>({
  classList:{contains:x=>x==='chosen'&&activeDay===i}
 })):[],
 addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)};
root.querySelectorAll=sel=>sel==='.timeline .event'?visibleRows:[];
class FakeImage {
 constructor(){this.complete=false;this.naturalWidth=900}
 set src(url){
  this._src=url;assert(url.startsWith('https://example.test/nyc-lyna/assets/photos/'),
   'Do not fetch third-party photos at runtime');
  this.complete=true;this.onload?.();
 }
 get src(){return this._src}
}
class FakeObserver {
 constructor(callback){this.callback=callback;observer=this}
 observe(){} disconnect(){}
}
const win={NYC_PHOTO_INDEX:manifest,Image:FakeImage,NYC_BASE:'https://example.test/nyc-lyna/',
 location:{href:'https://example.test/nyc-lyna/'},addEventListener(){}};
const ctx={window:win,document,URL,Array,Object,Math,JSON,Map,Set,Promise,MutationObserver:FakeObserver,
 requestAnimationFrame:fn=>{frames.push(fn);return frames.length},setTimeout:fn=>{frames.push(fn)}};
vm.runInNewContext(week,ctx,{filename:'approved-week.js'});
vm.runInNewContext(moduleCode,ctx,{filename:'day-photos.js'});
const photos=win.NOUX_DAILY_PHOTOS;
const all=dates.flatMap(date=>win.NOUX_APPROVED_WEEK.days[date].events);
assert.equal(all.length,56,'Final schedule has exactly 56 events');
const audit=photos.audit();
assert.equal(audit.scheduled,56,'Audit covers every event, not just the distinct places');
assert.equal(audit.mapped,56,'Every event has an explicit image assignment');
assert.deepEqual([...audit.missing],[],'No scheduled event lacks a photo mapping');
assert.deepEqual([...audit.unexpected],[],'No orphaned old itinerary mapping');
const forbidden=new Set(['skyline','diner','food','rooftop','gallery','magic','somewhere','jazz']);
for(const e of all){
 const rec=photos.resolve(e.id);
 assert(rec,'Missing image mapping for '+e.id+' '+e.title);
 assert(!forbidden.has(rec.key),'Generic stock-photo substitute disallowed for '+e.title);
 const meta=sources[rec.key],indexed=manifest[rec.key];
 assert(meta&&meta.label&&meta.source&&meta.credit,'Unverified photo provenance: '+rec.key);
 assert(indexed&&indexed.path===rec.path,'Incorrect generated photo index '+rec.key);
 assert(rec.path.startsWith('assets/photos/')&&fs.existsSync(rec.path),
  'Actual venue photograph missing from built site: '+rec.path);
 assert(fs.statSync(rec.path).size>6000,'Photo too small or empty '+rec.path);
}
assert.equal(photos.resolve('approved_20261123_04').key,'cruise',
 'Golden Hour sailing must show the harbour cruise, not the boarding terminal');
assert.equal(photos.resolve('approved_20261123_03').key,'pier79',
 'Pier boarding shows Pier 79, not the boat');
assert.equal(photos.resolve('approved_20261124_02').key,'oak',
 'Central Park transfer shows actual park imagery, not Guggenheim exterior');
assert.equal(photos.resolve('approved_20261124_03').key,'guggenheim',
 'The museum itself keeps its Guggenheim photograph');
assert.equal(photos.resolve('approved_20261126_11').key,'arte','ARTE museum must have a real distinct photo');
assert.equal(photos.resolve('approved_20261127_12').key,'albertine','Moved Albertine photo');
assert.equal(photos.resolve('approved_20261127_14').key,'awoke','Moved Awoke photo');
assert.equal(photos.resolve('approved_20261127_16').key,'stella','Moved Stella photo');
(async()=>{
 for(let i=0;i<5;i++){
  const events=win.NOUX_APPROVED_WEEK.days[dates[i]].events;
  // Reproduce the production screenshot: most rows contain NO .event-thumb.
  let rows=events.map((e,index)=>new FakeRow(e,index%7===0));
  if(i===1)rows=rows.reverse(); // title matching survives reordered DOM nodes
  const applied=photos.decorateRows(DAYS[i],rows);
  assert.equal(applied.matched,events.length,'Every '+DAYS[i]+' event is matched');
  assert(applied.missingThumbs>0,'Daily renderer must work without legacy thumb elements');
  await new Promise(resolve=>setImmediate(resolve));
  for(const row of rows){
   const rec=photos.resolve(row.event.id);
   assert(row.classList.contains('noux-daily-event-photo'),
    'The row has no image painted: '+row.event.title);
   assert.equal(row.dataset.nouxPhotoId,row.event.id,
    'Wrong photograph assigned to '+row.event.title);
   assert(row.values['--noux-daily-event-photo'].includes('/'+rec.path),
    'Incorrect event photo URI on '+row.event.title);
   assert(row.attrs['data-noux-photo-credit']!==undefined,
    'Missing photograph attribution metadata for '+row.event.title);
  }
 }
 // A user-added stop must never steal another event's picture.
 const original=win.NOUX_APPROVED_WEEK.days[dates[1]].events;
 const custom=new FakeRow({id:'custom_personal',title:'Personal added stop',start:'12:37'});
 const mixed=[custom,...original.map(e=>new FakeRow(e))];
 const mixedReport=photos.decorateRows('tue',mixed);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(mixedReport.matched,original.length,'Custom stop does not displace approved photos');
 assert(!custom.classList.contains('noux-daily-event-photo'),'Custom stop must not show an unrelated photo');
 const replacement=original.map(e=>new FakeRow(e));
 const replacingCustom=new FakeRow({id:'custom_replacement',title:'Unscheduled personal visit',start:'12:37'});
 replacement[3]=replacingCustom;
 photos.decorateRows('tue',replacement);
 await new Promise(resolve=>setImmediate(resolve));
 assert(!replacingCustom.classList.contains('noux-daily-event-photo'),
  'Replacing an approved event with a custom stop must not reuse a neighbour photo');
 const reused=new FakeRow(original[4],false);
 photos.decorateRows('tue',[reused]);
 await new Promise(resolve=>setImmediate(resolve));
 assert(reused.classList.contains('noux-daily-event-photo'),'Fixture starts with mapped event');
 reused.event={id:'custom_user_stop',title:'Extra individual stop',start:'13:12'};
 photos.decorateRows('tue',[reused]);
 assert(!reused.classList.contains('noux-daily-event-photo'),
  'A reused React row must clear its old photo when replaced by a personal stop');

 assert(photos.install(),'Renderer mounts after successful private React paint');
 assert(observer,'Renderer observes late React rerenders and tab navigation');
 activeDay=4;visibleRows=win.NOUX_APPROVED_WEEK.days[dates[4]].events.map(e=>new FakeRow(e,false));
 function flush(){let n=0;while(frames.length&&n++<10)frames.shift()()}
 flush();await new Promise(resolve=>setImmediate(resolve));
 assert(visibleRows.every(r=>r.classList.contains('noux-daily-event-photo')),
  'Friday native tab must show photos despite missing .event-thumb children');
 activeDay=0;visibleRows=win.NOUX_APPROVED_WEEK.days[dates[0]].events.map(e=>new FakeRow(e,false));
 for(const fn of listeners.click||[])fn({target:{closest:sel=>sel==='.daytabs .daytab'?{}:null}});
 flush();await new Promise(resolve=>setImmediate(resolve));
 assert(visibleRows.every(r=>r.classList.contains('noux-daily-event-photo')),
  'Day navigation must repaint all Monday event photos with no thumb elements');
 console.log('DAILY PHOTO RENDER PASS: 56/56 event photos over 5 days painted on rows even without .event-thumb; responsive CSS and custom-stop safety validated.'); 
})().catch(err=>{console.error(err);process.exitCode=1});