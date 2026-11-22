/* NOUX Trip Settings tools: a single contextual entry visible only while
 * the original React Trip Settings modal is open. The entry is portalled to
 * document.body, never inserted inside React-managed nodes.
 */
(function(){
'use strict';
if(window.NOUX_TRIP_TOOLS)return;
let INSTALLED=false,OPEN=false,ROOT=null,TRIGGER=null,OFFLINE=null,BUSY=false,ERROR='',IMPORT_STATUS='',REG=null,OBS=null,REFRESH_ID=0;
const el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n};
const button=(title,action,cls)=>{const b=el('button',cls||'',title);b.type='button';b.addEventListener('click',action);return b};
function nativeSettings(){
 const dialogs=Array.from(document.querySelectorAll('.modal-overlay > .modal')||[]);
 return dialogs.find(modal=>{
  if(!modal||modal.hidden||modal.getAttribute('aria-hidden')==='true')return false;
  const bounds=modal.getBoundingClientRect?.();
  if(bounds&&(!bounds.width||!bounds.height))return false;
  const heading=modal.querySelector('.modal-head h2')?.textContent||'';
  return !!modal.querySelector('.advanced-settings')||/\b(trip\s+)?settings\b|pr[eé]f[eé]rences/i.test(heading);
 })||null;
}
function anchor(){
 if(!TRIGGER||OPEN)return;
 const settings=nativeSettings();
 if(!settings){TRIGGER.hidden=true;return}
 const header=settings.querySelector('.modal-head'),close=header?.querySelector('button');
 if(!header||!close){TRIGGER.hidden=true;return}
 const rect=close.getBoundingClientRect(),heading=header.querySelector('h2')?.getBoundingClientRect();
 const narrow=window.innerWidth<450, width=narrow?67:116;
 let left=Math.max(7,rect.left-width-8),top=rect.top+Math.max(0,(rect.height-38)/2);
 if(heading&&heading.right+8>left){
  // On small phones the header has little spare width: put the accessory
  // immediately above the existing modal instead of covering the title.
  const modal=settings.getBoundingClientRect();
  left=Math.max(7,Math.min(window.innerWidth-width-7,modal.right-width-14));
  top=Math.max(5,modal.top-42);
 }
 TRIGGER.textContent=narrow?'Sync':'Shared / offline';
 TRIGGER.style.left=Math.round(left)+'px';
 TRIGGER.style.top=Math.round(top)+'px';
 TRIGGER.hidden=false;
}
function scheduleAnchor(){
 if(REFRESH_ID)return;
 REFRESH_ID=requestAnimationFrame(()=>{REFRESH_ID=0;anchor()});
}
function close(){OPEN=false;if(ROOT)ROOT.hidden=true;document.body.classList.remove('noux-settings-open');scheduleAnchor()}
function show(){
 if(!INSTALLED)return false;
 OPEN=true;TRIGGER.hidden=true;ROOT.hidden=false;document.body.classList.add('noux-settings-open');render();
 ROOT.querySelector('.noux-trip-tools-close')?.focus();
 return true;
}
function component(){
 ROOT=el('section','noux-trip-tools-modal');ROOT.id='noux-trip-tools';ROOT.hidden=true;
 ROOT.setAttribute('role','dialog');ROOT.setAttribute('aria-modal','true');ROOT.setAttribute('aria-label','Trip settings connections and offline tools');
 ROOT.append(el('div','noux-trip-tools-content'));document.body.append(ROOT);
 TRIGGER=button('Shared / offline',show,'noux-trip-tools-trigger');TRIGGER.id='noux-trip-tools-trigger';
 TRIGGER.setAttribute('aria-controls',ROOT.id);TRIGGER.hidden=true;document.body.append(TRIGGER);
}
async function askWorker(type){
 if(!navigator.serviceWorker)throw Error('Offline download is not supported by this browser.');
 REG=REG||await navigator.serviceWorker.ready;
 const sw=navigator.serviceWorker.controller||REG.active||REG.waiting;
 if(!sw)throw Error('Offline support is still installing. Reload once while connected.');
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();
  const timer=setTimeout(()=>reject(Error('Offline cache did not respond. Please try again.')),30000);
  channel.port1.onmessage=event=>{
   clearTimeout(timer);channel.port1.close();
   if(event.data?.ok)resolve(event.data.result);
   else reject(Error(event.data?.error||'Offline cache unavailable'));
  };
  sw.postMessage({type},[channel.port2]);
 });
}
async function offline(type){
 if(BUSY)return;
 if(type==='NOUX_OFFLINE_CLEAR'&&!confirm('Remove the offline pack from this phone? Your saved choices, gifts and shared pairing remain intact.'))return;
 BUSY=true;ERROR='';render();
 try{
  const result=await askWorker(type);
  OFFLINE=type==='NOUX_OFFLINE_CLEAR'?{ready:false}:result;
  if(type==='NOUX_OFFLINE_SAVE'&&!result.ok)ERROR='Download incomplete: '+(result.failed||[]).slice(0,4).join(', ');
 }catch(e){ERROR=e?.message||'Offline service unavailable'}
 finally{BUSY=false;if(OPEN)render()}
}
function render(){
 if(!ROOT||!OPEN)return;
 const inner=ROOT.querySelector('.noux-trip-tools-content');if(!inner)return;
 const header=el('div','noux-trip-tools-head'),heading=el('div');
 heading.append(el('small','noux-trip-tools-eyebrow','NOUX / TRIP SETTINGS'),el('h2',null,'Shared & offline'),el('p',null,'Only the practical controls. Everything else stays in the original itinerary.'));
 header.append(heading,button('× Close',close,'noux-trip-tools-close'));
 const sync=el('section','noux-trip-tool-row');
 sync.append(el('h3',null,'Our shared trip'),el('p',null,'Pair Benjamin and Lyna, inspect connection status, or synchronise now. The pairing code stays encrypted on this device.'));
 const state=window.NOUX_SYNC?.getStatus?.()||{};
 const connected=state.paired===true;
 sync.append(el('small','noux-trip-tool-state',connected?state.text||'Paired shared trip':'Not paired yet'));
 sync.append(button(connected?'Manage shared sync':'Set up shared sync',()=>{
  close();
  if(typeof window.NOUX_SYNC?.open==='function')window.NOUX_SYNC.open();
  else alert('Shared sync is not available in this browser session. Reopen NOUX online.');
 },'noux-trip-tools-primary'));
 const approved=el('section','noux-trip-tool-row');
 const plan=window.NOUX_PLAN_REVISION?.status?.()||{};
 approved.append(el('h3',null,'Approved itinerary'),el('p',null,'Replace the old five-day routes with the validated private plan. Import after unlocking; the file is encrypted on this phone with your existing passphrase and shared as ciphertext when devices are paired. No trip details are published on GitHub.'));
 approved.append(el('small','noux-trip-tool-state',plan.active?
  (plan.installed?'Approved itinerary active · '+(plan.revision||'latest'):'Approved itinerary encrypted · reload to activate'):
  (plan.error||'The original encrypted itinerary is unchanged until you import your approved file.')));
 const input=el('input','noux-trip-plan-file');
 input.type='file';input.accept='.json,application/json';input.hidden=true;
 input.setAttribute('aria-label','Choose approved private itinerary JSON');
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];if(!file)return;
  BUSY=true;IMPORT_STATUS='';render();
  try{
   const result=await window.NOUX_PLAN_REVISION.importFile(file);
   IMPORT_STATUS='Saved securely · '+result.days+' days. Reopen the itinerary to apply the replacement routes.';
  }catch(e){IMPORT_STATUS='Import failed: '+(e?.message||'Unknown file error')+'. No old data was erased.'}
  finally{BUSY=false;if(OPEN)render()}
 });
 const importAction=button(BUSY?'Importing…':'Import approved plan',()=>input.click(),'noux-trip-tools-primary');
 importAction.disabled=BUSY||typeof window.NOUX_PLAN_REVISION?.importFile!=='function';
 approved.append(importAction,input);
 if(IMPORT_STATUS)approved.append(el('small','noux-trip-tool-state',IMPORT_STATUS));
 if(plan.active&&!plan.installed)approved.append(button('View updated itinerary',()=>location.reload(),'noux-trip-tools-primary'));
 if(plan.active&&plan.installed)approved.append(el('p',null,'Friday is fixed: DUMBO → Brooklyn Bridge → Golden Diner → Rockefeller Center → airport transfer. Your booking and packing controls remain available.'));
 const cache=el('section','noux-trip-tool-row');
 cache.append(el('h3',null,'Offline essentials'),el('p',null,'Save public app files and the encrypted trip vault on each phone. Map tiles and real-time MTA arrivals still need internet.'));
 const ready=OFFLINE?.ready||OFFLINE?.ok&&OFFLINE.vaultSaved&&OFFLINE.failed?.length===0;
 cache.append(el('small','noux-trip-tool-state',ready?'Offline pack saved':OFFLINE?'Not saved / incomplete':'Not checked yet'));
 if(OFFLINE?.publicCount!==undefined)cache.append(el('small',null,OFFLINE.publicCount+' public files · '+(OFFLINE.vaultSaved?'encrypted vault saved':'encrypted vault not saved')));
 const actions=el('div','noux-trip-tools-actions');
 actions.append(button(BUSY?'Working…':'Save offline pack',()=>{void offline('NOUX_OFFLINE_SAVE')},'noux-trip-tools-primary'));
 actions.append(button('Check',()=>{void offline('NOUX_OFFLINE_STATUS')},'noux-trip-tools-secondary'));
 actions.append(button('Remove',()=>{void offline('NOUX_OFFLINE_CLEAR')},'noux-trip-tools-secondary'));
 cache.append(actions);
 if(ERROR)cache.append(el('p','noux-trip-tools-error',ERROR));
 const packing=el('section','noux-trip-tool-row');
 packing.append(el('h3',null,'Departure & gifts'),el('p',null,'Open the existing independent packing and souvenir checklists. They remain saved and shared, without an extra floating button.'));
 packing.append(button('Open checklists',()=>{
  close();window.NOUX_DEPARTURE?.open?.();
 },'noux-trip-tools-secondary'));
 const footer=el('p','noux-trip-tools-fine','This panel appears only inside the Trip Settings flow. No passwords, local choices or bookings are changed by opening it.');
 inner.replaceChildren(header,sync,approved,cache,packing,footer);
}
function install(){
 if(INSTALLED)return true;
 if(!window.NYC_DATA||!document.body)return false;
 component();INSTALLED=true;
 if(navigator.serviceWorker){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{
   REG=reg;return askWorker('NOUX_OFFLINE_STATUS');
  }).then(x=>{OFFLINE=x;if(OPEN)render()}).catch(_=>{});
 }
 const root=document.getElementById('root');
 if(root&&typeof MutationObserver!=='undefined'){
  OBS=new MutationObserver(scheduleAnchor);
  OBS.observe(root,{childList:true,subtree:true});
 }
 document.addEventListener('click',event=>{
  // Also observe the native modal's close/outside-click actions. The React
  // Settings dialog can be portalled directly to body, outside our root observer.
  if(event.target?.closest?.('.settings-button')||!TRIGGER.hidden)setTimeout(scheduleAnchor,70);
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   if(OPEN)close();
   else setTimeout(scheduleAnchor,70);
  }
 });
 window.addEventListener('resize',scheduleAnchor);
 window.addEventListener('scroll',scheduleAnchor,true);
 scheduleAnchor();
 return true;
}
window.NOUX_TRIP_TOOLS={install,open:show,nativeSettings,version:'2026.11.21-slim3'};
})();