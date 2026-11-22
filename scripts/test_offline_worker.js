/* NOUX offline service worker regression, Node 22. No real trip secrets. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('sw.js','utf8');
new vm.Script(code,{filename:'sw.js'});
assert(!/localStorage\.|sessionStorage\.|crypto\.subtle\.decrypt|request\.headers\.get\(['"]Authorization/i.test(code),
 'Offline worker must not read credentials, local storage or decrypt vault data');
const listeners={};const scope='https://example.test/nyc-lyna/';
const self={
 registration:{scope},location:{origin:'https://example.test'},
 clients:{claim:async()=>{}},skipWaiting:async()=>{},
 addEventListener(k,fn){listeners[k]=fn}
};
class Cache{
 constructor(){this.db=new Map()}
 async put(request,response){this.db.set(typeof request==='string'?request:request.url,response.clone())}
 async match(request,options={}){
  const url=typeof request==='string'?request:request.url;
  if(this.db.has(url))return this.db.get(url).clone();
  if(options.ignoreSearch){const key=url.split('?')[0];for(const [k,v] of this.db)if(k.split('?')[0]===key)return v.clone()}
  return undefined;
 }
 async keys(){return Array.from(this.db.keys()).map(url=>new Request(url))}
}
const caches={
 db:new Map(),async open(n){if(!this.db.has(n))this.db.set(n,new Cache());return this.db.get(n)},
 async keys(){return [...this.db.keys()]},async delete(n){return this.db.delete(n)}
};
let online=true,network=[],secret='DUMMY-PRIVATE-TRIP-NEVER-DECRYPTED';
const encrypted={algorithm:'AES-256-GCM',salt:'abc',iv:'abcd',ct:'R'.repeat(45000)};
const mockFetch=async req=>{
 const url=typeof req==='string'?req:req.url;
 network.push(url);
 if(!online)throw Error('offline network');
 if(url.endsWith('/assets/private.vault.json'))return Response.json(encrypted);
 if(url.startsWith(scope))return new Response('PUBLIC ASSET',{status:200});
 throw Error('No external network fixtures');
};
vm.runInNewContext(code,{self,caches,fetch:mockFetch,URL,Request,Response,Promise,Set,Array,Object,JSON,Math,Date},{filename:'sw.js'});
assert(listeners.install&&listeners.fetch&&listeners.message&&listeners.activate,'PWA lifecycle registered');
async function send(type){
 let result,task;
 const source={url:scope};
 listeners.message({data:{type},source,ports:[{postMessage:r=>{result=r}}],waitUntil:p=>{task=p}});
 assert(task,'Expected message task');
 await task;
 return result;
}
(async()=>{
 const before=await send('NOUX_OFFLINE_STATUS');
 assert.equal(before.result.ready,false,'Not cached without explicit user action');
 const saved=await send('NOUX_OFFLINE_SAVE');
 assert(saved.ok&&saved.result.ok,'User-initiated offline pack saves cleanly');
 assert(saved.result.vaultSaved,'Vault cached encrypted');
 assert(saved.result.publicCount>=20,'Public shell files cached');
 const after=await send('NOUX_OFFLINE_STATUS');
 assert(after.result.ready,'Offline pack is ready only with the complete public shell and encrypted vault');
 const shellName=(await caches.keys()).find(name=>name.startsWith('noux-shell-'));
 const shellCache=await caches.open(shellName);
 const scriptKey=[...shellCache.db.keys()].find(url=>url.includes('/unlock.js?v='));
 assert(scriptKey,'Expected a cached unlock script');
 const savedScript=shellCache.db.get(scriptKey);
 shellCache.db.delete(scriptKey);
 const incomplete=await send('NOUX_OFFLINE_STATUS');
 assert.equal(incomplete.result.ready,false,'Missing essential script must invalidate offline readiness');
 assert(incomplete.result.failed.some(path=>path.includes('unlock.js')),'Missing script is diagnosed');
 shellCache.db.set(scriptKey,savedScript);
 assert((await send('NOUX_OFFLINE_STATUS')).result.ready,'Restored complete pack is ready again');
 const vaultNames=(await caches.keys()).filter(k=>k.startsWith('noux-encrypted-vault-'));
 assert.equal(vaultNames.length,1);
 const vaultCache=await caches.open(vaultNames[0]);
 const response=await vaultCache.match(scope+'assets/private.vault.json');
 assert.deepEqual(await response.json(),encrypted,'Cache stores original encrypted vault object only');
 assert(!JSON.stringify([...caches.db.keys()]).includes(secret),'No decrypted trip data or passphrase in cache keys');
 online=false;
 const navEvent={request:new Request(scope),respondWith(p){this.promise=p}};
 listeners.fetch(navEvent);
 const offlinePage=await navEvent.promise;
 assert.equal(await offlinePage.text(),'PUBLIC ASSET','App shell opens with network disconnected');
 const vaultEvent={request:new Request(scope+'assets/private.vault.json'),respondWith(p){this.promise=p}};
 listeners.fetch(vaultEvent);
 assert.equal((await (await vaultEvent.promise).json()).algorithm,'AES-256-GCM','Offline vault remains encrypted');
 const external={request:new Request('https://api-endpoint.mta.info/feed'),respondWith(){throw Error('Must not cache or intercept MTA')}};
 listeners.fetch(external);
 const remove=await send('NOUX_OFFLINE_CLEAR');
 assert(remove.ok);
 assert(!(await send('NOUX_OFFLINE_STATUS')).result.ready,'Offline pack can be cleared without modifying itinerary storage');
 console.log('Offline worker PASS: opt-in encryption-only pack, offline reload, external API exclusion, safe clear.');
})().catch(e=>{console.error(e);process.exitCode=1});
