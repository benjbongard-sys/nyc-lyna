/* NOUX deployment photo coverage. Checks the actual images downloaded by the
 * GitHub Actions photo builder, not just a list of hoped-for remote URLs.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {TextEncoder}=require('node:util');
const weekJs=fs.readFileSync('approved-week.js','utf8');
const revisionJs=fs.readFileSync('trip-revision.js','utf8');
const sources=JSON.parse(fs.readFileSync('scripts/photo_sources.json','utf8'));
const index=JSON.parse(fs.readFileSync('assets/photo-index.json','utf8'));
const window={NYC_PHOTO_INDEX:index};
const ctx={window,TextEncoder,Array,Object,JSON,Set,Number,String,Math};
vm.runInNewContext(weekJs,ctx,{filename:'approved-week.js'});
vm.runInNewContext(revisionJs,ctx,{filename:'trip-revision.js'});
const schedule=window.NOUX_APPROVED_WEEK;
const referenced=new Set(Object.values(schedule.days).flatMap(day=>day.events.map(e=>e.place)));
const covered=window.NOUX_PLAN_REVISION.photoStatus();
const missing=[];
for(const place of referenced){
 const entry=covered.find(r=>r.place===place);
 if(!entry||!sources[entry.key]||!entry.ready||!index[entry.key]?.path){
  missing.push(place+' (unresolved photo mapping)');continue;
 }
 const path=index[entry.key].path;
 if(!path.startsWith('assets/photos/')||!path.endsWith('.jpg')||!fs.existsSync(path)||fs.statSync(path).size<6000){
  missing.push(place+' (missing or invalid local image: '+path+')');continue;
 }
 assert(typeof index[entry.key].credit==='string'&&index[entry.key].credit.length>5,
  'Missing image credit for '+place);
 assert(typeof index[entry.key].source==='string'&&index[entry.key].source.startsWith('https://'),
  'Missing photo source for '+place);
}
assert.equal(missing.length,0,'Scheduled images missing: '+missing.join('; '));
assert.equal(referenced.size,30,'All 30 unique approved scheduled destinations have photographs');
assert(covered.find(x=>x.place==='arte'&&x.key==='arte').ready,'ARTE Museum photograph successfully downloaded');
assert.equal(schedule.places.pier.name,'Pier 79 · Slip 2 · NY Waterway');
assert(covered.find(x=>x.place==='pier'&&x.key==='pier79').ready,'Cruise pier uses actual terminal image');
assert(covered.find(x=>x.place==='chelsea'&&x.key==='lobsterplace').ready,'Chelsea lunch uses Lobster Place, not an art gallery image');
assert(covered.find(x=>x.place==='dumbo'&&x.key==='dumbo').ready,'Friday DUMBO is not a generic skyline');
console.log('PHOTO COVERAGE PASS: '+referenced.size+' approved destinations, real local image files, credits, and correct venue-photo identity.');
