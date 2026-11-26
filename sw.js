/* NOUX Offline Essentials.
 * Stores ONLY public website assets and the already AES-GCM-encrypted vault.
 * No decryption, passwords, localStorage, live subway feeds or remote API caching.
 */
'use strict';
const VERSION='20261126-finalroute2';
const SHELL='noux-shell-'+VERSION;
const VAULT='noux-encrypted-vault-'+VERSION;
const ASSETS=[
 './','./index.html','./manifest.webmanifest','./styles.css?v='+VERSION,
 './remember-device.js?v='+VERSION,'./unlock.js?v='+VERSION,'./explorer.js?v='+VERSION,'./venues.js?v='+VERSION,
 './choice-orchestrator.js?v='+VERSION,'./day-audit.js?v='+VERSION,
 './departure-kit.js?v='+VERSION,'./sync-core.js?v='+VERSION,'./sync.js?v='+VERSION,
 './subway-map.js?v='+VERSION,'./food-wishlist.js?v='+VERSION,
 './food-guide.js?v='+VERSION,'./decision-guide.js?v='+VERSION,
 './trip-settings-tools.js?v='+VERSION,'./trip-revision.js?v='+VERSION,
 './approved-week.js?v='+VERSION,'./day-photos.js?v='+VERSION,
 './booking-desk.js?v='+VERSION,'./route-guide.js?v='+VERSION,
 './map-filter.js?v='+VERSION,
 './lib/react.min.js','./lib/react-dom.min.js',
 './lib/maplibre-gl.js','./lib/maplibre-gl.css',
 './assets/photo-index.js','./assets/nyx-icon.svg','./worker-config.js'
];
// The illustrated offline pack includes each scheduled destination photograph.
// No personal uploads, decrypted vault contents or credentials are cached.
const REQUIRED_PHOTOS=["hotel","jfk","pier79","times","tacos","dear","butterfly","guggenheim","albertine","hudsonvu","bluenote","nypl","bryant","lobsterplace","whitney","little","domino","awoke","stella","mables","superior","grandcentral","mercer","sadies","daydream","colbo","nubeluz","dumbo","bridge","golden","rough","cruise","oak","rockefeller","arte"];
ASSETS.push(...REQUIRED_PHOTOS.map(key=>'./assets/photos/'+key+'.jpg'));
const prefix=new URL(self.registration.scope);
const vaultUrl=new URL('./assets/private.vault.json',prefix);
const assetUrls=new Set(ASSETS.map(x=>new URL(x,prefix).href));
const shellUrl=new URL('./',prefix).href;
function safeScope(url){
 return url.origin===prefix.origin&&url.pathname.startsWith(prefix.pathname);
}
self.addEventListener('install',event=>{
 event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
 // Keep previous cached packs until a complete new pack is saved. Do not
 // delete the last usable pack merely because a new SW version activated.
 event.waitUntil(self.clients.claim());
});
async function getFallback(request,kind){
 const names=await caches.keys();
 const wanted=names.filter(n=>n.startsWith(kind)).reverse();
 for(const name of wanted){
  const c=await caches.open(name);
  const found=await c.match(request,{ignoreSearch:request.mode==='navigate'});
  if(found)return found;
 }
 return null;
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||!safeScope(url))return; // Never intercept external services.
 const isVault=url.pathname===vaultUrl.pathname;
 const isPublic=assetUrls.has(url.href)||request.mode==='navigate'&&url.pathname===prefix.pathname;
 if(!isVault&&!isPublic)return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(request);
   if(response.ok)return response; // online stays authoritative; no silent old content
   if(response.status>=400&&response.status<500)return response;
  }catch(_){}
  const cached=await getFallback(request,isVault?'noux-encrypted-vault-':'noux-shell-');
  if(cached)return cached;
  if(request.mode==='navigate'){
   const shell=await getFallback(new Request(shellUrl),'noux-shell-');
   if(shell)return shell;
   return new Response('NOUX offline pack not saved on this device.',{
    status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}
   });
  }
  return Response.error();
 })());
});
async function savePack(){
 const shell=await caches.open(SHELL);
 let publicCount=0;
 const failed=[];
 // Fetch photos and scripts in small parallel batches to keep mobile downloads
 // viable on slower networks without overloading the browser.
 for(let i=0;i<ASSETS.length;i+=4){
  await Promise.all(ASSETS.slice(i,i+4).map(async path=>{
   const url=new URL(path,prefix);
   try{
    const response=await fetch(new Request(url.href,{cache:'reload',credentials:'same-origin'}));
    if(!response.ok||response.type==='opaque')throw Error('Unavailable: '+response.status);
    await shell.put(url.href,response.clone());
    publicCount++;
   }catch(_){failed.push(path)}
  }));
 }
 let vaultSaved=false;
 try{
  const response=await fetch(new Request(vaultUrl.href,{cache:'reload',credentials:'same-origin'}));
  if(!response.ok)throw Error('Vault is unavailable');
  const body=await response.clone().json();
  if(body?.algorithm!=='AES-256-GCM'||typeof body.ct!=='string'||body.ct.length<10000||
     !body.salt||!body.iv)throw Error('Not an encrypted vault');
  const c=await caches.open(VAULT);
  await c.put(vaultUrl.href,response);
  vaultSaved=true;
 }catch(_){failed.push('encrypted vault')}
 const ok=failed.length===0&&vaultSaved;
 if(ok){
  // Keep at most one previous ready pack. This never clears private choices.
  const names=(await caches.keys()).filter(n=>n.startsWith('noux-shell-')||n.startsWith('noux-encrypted-vault-'));
  for(const name of names){
   if(name!==SHELL&&name!==VAULT)await caches.delete(name);
  }
 }
 return {ok,publicCount,total:ASSETS.length,vaultSaved,failed,version:VERSION};
}
async function status(){
 const s=await caches.open(SHELL),v=await caches.open(VAULT);
 // A shell + vault alone does not make an offline app. Check every essential
 // asset before reporting ready. Missing scripts must never be hidden by
 // a success badge, especially before travel.
 const required=ASSETS.map(path=>new URL(path,prefix).href);
 const hits=await Promise.all(required.map(url=>s.match(url)));
 const vault=await v.match(vaultUrl.href);
 const count=hits.filter(Boolean).length;
 return {ready:!!vault&&count===ASSETS.length,vaultSaved:!!vault,
  version:VERSION,publicCount:count,total:ASSETS.length,
  failed:required.filter((url,i)=>!hits[i]).map(url=>url.replace(prefix.href,'./'))};
}
async function clearPack(){
 for(const name of await caches.keys()){
  if(name.startsWith('noux-shell-')||name.startsWith('noux-encrypted-vault-')){
   await caches.delete(name);
  }
 }
 return {ready:false};
}
self.addEventListener('message',event=>{
 const data=event.data||{};
 if(!['NOUX_OFFLINE_SAVE','NOUX_OFFLINE_STATUS','NOUX_OFFLINE_CLEAR'].includes(data.type))return;
 const source=event.source;
 // Require a same-origin, in-scope controlled window.
 if(!source||!source.url){return}
 const url=new URL(source.url);
 if(!safeScope(url))return;
 const task=data.type==='NOUX_OFFLINE_SAVE'?savePack():
            data.type==='NOUX_OFFLINE_CLEAR'?clearPack():status();
 event.waitUntil(Promise.resolve(task).then(result=>{
  event.ports?.[0]?.postMessage({type:data.type,ok:true,result});
 }).catch(()=>{
  event.ports?.[0]?.postMessage({type:data.type,ok:false,error:'Offline storage is unavailable. Local trip data was not changed.'});
 }));
});