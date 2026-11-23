/* Strict NOUX photograph audit: 53 EVENT identities, local file bytes and
 * DOM thumbnail rendering, not merely a source manifest or 32 location keys.
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
assert(css.includes('.event-thumb.noux-daily-photo-ready:not(img)::after'),
  'CSS must paint a real image over the legacy React placeholder');
assert(css.includes('background-image:var(--noux-daily-photo)'),
  'Thumbnail overlay must use the resolved local photo');
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
 constructor(event){
  this.event=event;this.thumb=new FakeThumb();this.isConnected=true;
 }
 querySelector(sel){
  if(sel==='.event-thumb')return this.thumb;
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
assert.equal(all.length,53,'Final schedule has exactly 53 events');
const audit=photos.audit();
assert.equal(audit.scheduled,53,'Audit covers every event, not just the distinct places');
assert.equal(audit.mapped,53,'Every event has an explicit image assignment');
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
assert.equal(photos.resolve('approved_20261127_06').key,'rockefeller',
 'Transfer to Rockefeller Center must not show a record shop');
assert.equal(photos.resolve('approved_20261127_07').key,'rough',
 'Rough Trade shopping should show Rough Trade');
(async()=>{
 for(let i=0;i<5;i++){
  const events=win.NOUX_APPROVED_WEEK.days[dates[i]].events;
  let rows=events.map(e=>new FakeRow(e));
  if(i===1)rows=rows.reverse(); // title matching survives reordered DOM nodes
  const applied=photos.decorateRows(DAYS[i],rows);
  assert.equal(applied.matched,events.length,'Every '+DAYS[i]+' event is matched');
  await new Promise(resolve=>setImmediate(resolve));
  for(const row of rows){
   const thumb=row.thumb,rec=photos.resolve(row.event.id);
   assert(thumb.classList.contains('noux-daily-photo-ready'),
    'Decorative New York placeholder still active: '+row.event.title);
   assert.equal(thumb.dataset.nouxPhotoId,row.event.id,'Wrong photograph assigned to '+row.event.title);
   assert(thumb.values['--noux-daily-photo'].includes('/'+rec.path),
    'Incorrect thumbnail image URI on '+row.event.title);
   assert(thumb.attrs['aria-label'].includes(rec.label),
    'Missing accessible venue photo label '+row.event.title);
  }
 }
 // A user-added stop must never steal another event's picture.
 const original=win.NOUX_APPROVED_WEEK.days[dates[1]].events;
 const custom=new FakeRow({id:'custom_personal',title:'Personal added stop',start:'12:37'});
 const mixed=[custom,...original.map(e=>new FakeRow(e))];
 const mixedReport=photos.decorateRows('tue',mixed);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(mixedReport.matched,original.length,'Custom stop does not displace approved photos');
 assert(!custom.thumb.classList.contains('noux-daily-photo-ready'),'Custom stop must not show an unrelated photo');
 assert(photos.install(),'Renderer mounts after successful private React paint');
 assert(observer,'Renderer observes late React rerenders and tab navigation');
 activeDay=4;visibleRows=win.NOUX_APPROVED_WEEK.days[dates[4]].events.map(e=>new FakeRow(e));
 function flush(){let n=0;while(frames.length&&n++<10)frames.shift()()}
 flush();await new Promise(resolve=>setImmediate(resolve));
 assert(visibleRows.every(r=>r.thumb.classList.contains('noux-daily-photo-ready')),
  'Friday native tab does not retain an empty New York thumbnail');
 activeDay=0;visibleRows=win.NOUX_APPROVED_WEEK.days[dates[0]].events.map(e=>new FakeRow(e));
 for(const fn of listeners.click||[])fn({target:{closest:sel=>sel==='.daytabs .daytab'?{}:null}});
 flush();await new Promise(resolve=>setImmediate(resolve));
 assert(visibleRows.every(r=>r.thumb.classList.contains('noux-daily-photo-ready')),
  'Day navigation must repaint all Monday event photos');
 console.log('DAILY PHOTO RENDER PASS: 53/53 scheduled events over 5 days have verified local images, correct event identities, rendered thumbnail overlays, and safe navigation.'); 
})().catch(err=>{console.error(err);process.exitCode=1});