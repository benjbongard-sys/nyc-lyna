/* NOUX Trip Settings tools: a single contextual entry visible only while
 * the original React Trip Settings modal is open. The entry is portalled to
 * document.body, never inserted inside React-managed nodes.
 */
(function(){
'use strict';
if(window.NOUX_TRIP_TOOLS)return;
let INSTALLED=false,OPEN=false,ROOT=null,TRIGGER=null,OFFLINE=null,BUSY=false,ERROR='',REG=null,OBS=null,REFRESH_ID=0;
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
  top=Math.max(68,modal.top+58);
 }
 // Keep the Settings-only action within the iPhone's tappable viewport,
  // even if the native Settings modal opens close to the browser notch.
  const availableHeight=Number(window.innerHeight)||760;
  left=Math.max(7,Math.min(window.innerWidth-width-7,left));
  top=Math.max(64,Math.min(availableHeight-49,top));
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
  const timer=setTimeout(()=>reject(Error('Offline cache did not respond. Please try again.')),type==='NOUX_OFFLINE_SAVE'?90000:30000);
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
 const device=el('section','noux-trip-tool-row');
 const persistent=window.NOUX_REMEMBER_DEVICE?.status?.()||{};
 device.append(el('h3',null,'Stay signed in on this device'));
 device.append(el('p',null,persistent.remembered?
  'This private browser can reopen NOUX without the passphrase after Safari closes the tab. Anyone with access to this browser profile can also open it.':
  'You can keep this private device signed in between browser restarts. The passphrase is never saved.'));
 if(persistent.remembered){
  device.append(el('small','noux-trip-tool-state','Remembered access: enabled'));
  device.append(button('Lock & forget this device',()=>{
   if(!confirm('Require your passphrase again on this device? This will NOT delete your trip choices, pairing, bookings or offline pack.'))return;
   void (async()=>{
    const ok=await window.NOUX_REMEMBER_DEVICE?.forget?.();
    if(ok)location.reload();
    else if(OPEN)render();
   })();
  },'noux-trip-tools-secondary'));
 }else if(persistent.canEnable&&persistent.available){
  device.append(el('small','noux-trip-tool-state','Remembered access: off'));
  device.append(button('Keep this device signed in',()=>{
   void (async()=>{
    await window.NOUX_REMEMBER_DEVICE.remember();
    if(OPEN)render();
   })();
  },'noux-trip-tools-secondary'));
 }else device.append(el('small','noux-trip-tool-state','Persistent access not available in this browser session'));
 if(persistent.error)device.append(el('p','noux-trip-tools-error',persistent.error));
 const approved=el('section','noux-trip-tool-row');
 const plan=window.NOUX_PLAN_REVISION?.status?.()||{};
 approved.append(el('h3',null,'Final five-day itinerary'),
  el('p',null,'The five approved days are included in the latest NOUX version. There is no file to import, no further route decision and no extra setup. Booking and gift checklists remain independent.'));
 approved.append(el('small','noux-trip-tool-state',
  plan.active&&plan.installed?'Approved itinerary active · all 5 days':(plan.error||'Reopen NOUX after unlocking to apply the latest plan.')));
 if(plan.active&&!plan.installed)approved.append(button('Reload current itinerary',()=>location.reload(),'noux-trip-tools-primary'));
 const operations=el('section','noux-trip-tool-row');
 operations.append(el('h3',null,'Routes, tickets & venue details'),
  el('p',null,'Practical controls for the five approved days. Trip choices are final; these tools show each transfer, verified venue information and the current booking checklist.'));
 const go=el('div','noux-trip-tools-actions');
 go.append(button('Routes & live directions',()=>{
  close();
  if(!window.NOUX_ROUTE_GUIDE?.open?.())alert('Reopen the latest NOUX itinerary to view the routes.');
 },'noux-trip-tools-primary'));
 go.append(button('Tickets & reservations',()=>{
  close();
  if(!window.NOUX_BOOKING_DESK?.open?.())alert('The booking checklist is unavailable; reopen NOUX.');
 },'noux-trip-tools-secondary'));
 operations.append(go);
 const ticketState=window.NOUX_BOOKING_DESK?.status?.();
 if(ticketState)operations.append(el('small','noux-trip-tool-state',
  ticketState.confirmed+' of '+ticketState.total+' pending booking and opening checks marked complete; already booked visits stay confirmed.'));
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
 inner.replaceChildren(header,sync,device,approved,operations,cache,packing,footer);
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