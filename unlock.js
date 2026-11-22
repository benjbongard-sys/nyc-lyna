/* Encrypted-at-rest planner. The secret is neither in GitHub nor sent to a server. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const screen=$('lock-screen'),form=$('unlock-form'),input=$('unlock-pass'),button=$('unlock-submit'),msg=$('unlock-message'),bar=$('unlock-bar');
 const enc=new TextEncoder(),dec=new TextDecoder();
 const b64=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
 let unlocked=false,attempts=0;
 // A separate compatibility boot keeps the core encrypted planner available if
 // a nonessential enrichment crashes React. It never clears saved choices.
 const basicMode=(()=>{
  try{return new URLSearchParams(location.search).get('basic')==='1'||sessionStorage.getItem('noux_basic_mode')==='1'}catch(_){return false}
 })();
 window.NYC_BASE=new URL('./',location.href).href;
 // The previous 700 ms / 40-character test falsely rejected valid logins,
 // and its basic-mode action repeated the same test. A valid passphrase now
 // yields either the full app or a usable *read-only* decrypted itinerary.
 function healthy(){
  const root=$('root');
  if(!root||root.hidden||root.childElementCount===0)return false;
  if(root.querySelector?.('.app-shell,.topbar,.mainnav,.daytabs,.hero'))return true;
  return (root.textContent||'').trim().length>10;
 }
 function setLoading(on){
  let loading=$('noux-boot-loading');
  if(!on){loading?.remove?.();return}
  if(loading)return;
  loading=document.createElement('section');loading.id='noux-boot-loading';
  loading.setAttribute('role','status');loading.setAttribute('aria-live','polite');
  loading.style.cssText='position:fixed;inset:0;z-index:5000;display:grid;place-items:center;background:#101722;color:#f7e2c7;font:500 17px system-ui,sans-serif;padding:24px;text-align:center';
  loading.textContent='Opening your New York itinerary…';
  document.body.appendChild(loading);
 }
 async function waitForApp(){
  // React can mount asynchronously on slower devices or when browser memory
  // is constrained. Ignore unrelated resource/network errors if the app mounts.
  const until=Date.now()+8000;
  while(Date.now()<until){
   if(healthy())return true;
   await new Promise(resolve=>setTimeout(resolve,250));
  }
  return healthy();
 }
 function emergency(message,details){
  if($('noux-emergency-itinerary'))return;
  setLoading(false);
  const root=document.createElement('section');root.id='noux-emergency-itinerary';
  root.setAttribute('role','main');root.style.cssText='position:fixed;inset:0;z-index:6000;overflow-y:auto;background:#101722;color:#f5e9dc;font:14px/1.65 system-ui,sans-serif;padding:clamp(16px,5vw,50px)';
  const wrap=document.createElement('div');wrap.style.cssText='max-width:850px;margin:auto';
  const heading=document.createElement('h1');heading.textContent='Your New York itinerary';
  heading.style.cssText='font:400 clamp(32px,6vw,52px)/1.15 Georgia,serif;color:#efd1a2;margin:10px 0 16px';
  const desc=document.createElement('p');desc.textContent=message||'The visual interface could not load, but your encrypted itinerary opened successfully.';
  const info=document.createElement('p');info.textContent='This is a safe, read-only version. Your bookings, saved choices, personal stops and encrypted checklist are not being deleted or replaced.';
  info.style.cssText='color:#c4cbcd';
  const controls=document.createElement('div');controls.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin:20px 0 25px';
  function action(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='min-height:44px;border:1px solid #d7b88d;border-radius:9px;padding:11px 15px;background:#e4c597;color:#15202c;font-weight:750';b.addEventListener('click',fn);return b}
  controls.appendChild(action('Check full view again',()=>{
   if(healthy()){root.remove();return}
   const hint=document.createElement('p');hint.textContent='The full view has not loaded yet. The itinerary below remains available.';
   hint.style.cssText='color:#e2bc87';controls.after(hint);
  }));
  controls.appendChild(action('Reload website',()=>location.reload()));
  controls.appendChild(action('Print / save itinerary',()=>{try{window.print?.()}catch(_){}}));
  const note=document.createElement('p');note.textContent='Troubleshooting: '+details;
  note.style.cssText='font-size:11px;color:#b2b9c0;word-break:break-word';
  wrap.append(heading,desc,info,controls);
  const data=window.NYC_DATA,plan=window.NYC_PLAN;
  const choices=Object.assign({},data?.DEFAULT||{});
  try{
   const keys=Object.keys(localStorage).filter(k=>/^nyc_lyna_trip_v\d+$/.test(k))
    .sort((a,b)=>Number(b.split('_v').pop())-Number(a.split('_v').pop()));
   const saved=keys.length?JSON.parse(localStorage.getItem(keys[0])||'{}'):{};
   if(saved?.choices&&typeof saved.choices==='object')Object.assign(choices,saved.choices);
  }catch(_){}
  const days=[['mon','Monday'],['tue','Tuesday'],['wed','Wednesday'],['thu','Thursday'],['fri','Friday']];
  let stopCount=0;
  for(const [day,label] of days){
   const section=document.createElement('section');section.style.cssText='padding:16px 0;border-top:1px solid #45505c';
   const name=document.createElement('h2');name.textContent=label;name.style.cssText='font:400 26px Georgia,serif;color:#ecd0a5';
   section.appendChild(name);
   let events=[];
   try{events=plan?.day?.(day,choices)||[]}catch(_){}
   if(!Array.isArray(events))events=[];
   events.slice(0,60).forEach(evt=>{
    const item=document.createElement('article');item.style.cssText='border-left:2px solid #bc9970;margin:14px 0;padding:3px 0 7px 14px';
    const title=document.createElement('strong');title.textContent=[evt.start||'',evt.title||'Planned stop'].filter(Boolean).join(' · ');
    title.style.cssText='color:#f6e9db';item.appendChild(title);
    const place=data?.P?.[evt.place];
    if(place?.address){
     const p=document.createElement('p');p.textContent=place.address;
     p.style.cssText='color:#d0bec0;font-size:12px;margin:5px 0';item.appendChild(p);
     const link=document.createElement('a');link.textContent='Directions';link.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(place.address);
     link.target='_blank';link.rel='noopener noreferrer';link.style.cssText='color:#e6c18b;font-size:12px';item.appendChild(link);
    }
    if(evt.status){
     const status=document.createElement('p');status.textContent='Status: '+evt.status;
     status.style.cssText='font-size:11px;color:#acb6c0;margin:4px 0';item.appendChild(status);
    }
    section.appendChild(item);stopCount++;
   });
   if(!events.length){const p=document.createElement('p');p.textContent='No schedule available for this day in the emergency view.';section.appendChild(p)}
   wrap.appendChild(section);
  }
  if(stopCount===0){
   const p=document.createElement('p');p.textContent='The schedule engine also could not initialise. Please use your previously exported itinerary or check the GitHub Pages status; your browser data has not been cleared.';
   p.style.cssText='color:#f3c79d';wrap.appendChild(p);
  }
  wrap.appendChild(note);root.appendChild(wrap);document.body.appendChild(root);
  // If React finishes mounting unusually late, dismiss the emergency view
  // without asking for another passphrase.
  const app=$('root');
  if(app&&typeof MutationObserver!=='undefined'){
   const observer=new MutationObserver(()=>{if(healthy()){observer.disconnect();root.remove()}});
   observer.observe(app,{childList:true,subtree:true});
  }
 }
 const stars=$('lock-stars');
 for(let i=0;i<50;i++){const star=document.createElement('i');star.style.setProperty('--x',`${(i*71+13)%98}%`);star.style.setProperty('--y',`${(i*41+19)%84}%`);star.style.setProperty('--delay',`${(i%15)*-.23}s`);star.style.setProperty('--size',`${i%9===0?3:1}px`);stars.appendChild(star)}
 $('toggle-visibility').addEventListener('click',()=>{input.type=input.type==='password'?'text':'password';input.focus()});
 const mark=(text,status='')=>{msg.textContent=text;msg.dataset.status=status};
 async function derive(password,salt,rounds){
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:rounds,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(unlocked||!input.value||!crypto?.subtle)return;
  button.disabled=true;input.disabled=true;document.body.classList.add('unlock-thinking');mark('Opening our New York…');bar.style.width='34%';
  const password=input.value;input.value='';
  try{
   if(location.protocol==='file:')throw Error('Open the online NOUX link to continue.');
   const r=await fetch('./assets/private.vault.json',{cache:'no-store'});if(!r.ok)throw Error('Our New York could not open just now. Please try again.');
   const vault=await r.json();
   const key=await derive(password,b64(vault.salt),vault.iterations);
   bar.style.width='72%';
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(vault.iv),additionalData:enc.encode('NOUX-NYC-PRIVATE-V1')},key,b64(vault.ct));
   const scripts=JSON.parse(dec.decode(plain));
   if(!scripts['data.js']||!scripts['app.js'])throw Error('Something went wrong. Try refreshing the page.');
    // Open approved itinerary only with the in-memory AES vault key.
    try{await window.NOUX_PLAN_REVISION?.prepare({key})}catch(_){/* retain old plan if import is unreadable */}
   unlocked=true;mark('Welcome. The city is opening…','success');bar.style.width='100%';
   screen.classList.add('unlocked');
   await new Promise(resolve=>setTimeout(resolve,1050));
   // The 100th annual parade is public civic-event data; personal travel remains inside the vault.
   function attachCentennialParade(){
    const data=window.NYC_DATA, planner=window.NYC_PLAN;
    if(!data || !data.P || !planner || typeof planner.day!=='function' || planner.__centennialParade)return;
    const areaPoint=data.P.rockefeller || data.P.times;
    if(!areaPoint)return;
    data.P.centennial_parade={
     ...areaPoint,
     name:"100th Macy's Thanksgiving Day Parade",
     area:'Midtown Manhattan',
     address:'Sixth Avenue near Rockefeller Center, New York, NY, USA',
     kind:'event'
    };
    const dayBefore=planner.day;
    planner.day=function(day,choices){
     const events=dayBefore.call(this,day,choices);
     if(day!=='thu' || !Array.isArray(events) || events.some(e=>/macy.{0,20}parade|thanksgiving.{0,20}parade/i.test(String(e.title||''))))return events;
     // Replace only conflicting optional early-Thursday plans, never confirmed bookings.
     const retained=events.filter(e=>{
      const start=String(e.start||''), end=String(e.end||'');
      if(!start || !end || start>='11:30' || end<='09:15')return true;
      return ['booked','arranged','confirmed'].includes(String(e.status||'').toLowerCase());
     });
     const parade=[
      {id:'centennial_parade_walk',start:'09:15',end:'09:40',title:'Walk to Sixth Avenue · join the Thanksgiving crowds',place:'centennial_parade',detail:'Aim for public viewing near West 52nd Street from 09:40. Arriving after the first crowds means no kerbside/front-row view is guaranteed. Follow NYPD barriers; walking routes may be restricted.',kind:'travel',status:'proposed'},
      {id:'centennial_parade_2026',start:'09:40',end:'11:15',title:"100th Macy's Thanksgiving Day Parade",place:'centennial_parade',detail:'The parade starts at 08:30 on the Upper West Side. Near Rockefeller Center the lead floats usually pass after 09:30, with more arriving throughout the morning. Shorter relaxed viewing; sightlines and exact timings are not guaranteed.',kind:'highlight',status:'public-event'}
     ];
     return retained.concat(parade).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
    };
    planner.__centennialParade=true;
   }
   // A successful render is authoritative. Unrelated network/image errors
   // must never turn a successfully decrypted itinerary into a login failure.
   let visualError=false;
   const onVisualError=()=>{visualError=true};
   window.addEventListener('error',onVisualError);
   window.addEventListener('unhandledrejection',onVisualError);
   // Execute vetted, encrypted first-party bundles in the required dependency order.
   for(const name of ['data.js','itinerary.js','mta.js','routeplanner.js','photo-sources.js','custom-stops.js','app.js']){
    if(!scripts[name])throw Error('Unable to open a part of our itinerary: '+name);
    const el=document.createElement('script');el.textContent=scripts[name]+`\n//# sourceURL=noux-private-${name}`;document.head.appendChild(el);
    if(name==='data.js'){try{window.NOUX_FOOD_WISHLIST?.install()}catch(_){/* optional food additions must never break unlock */}}
     if(name==='itinerary.js')attachCentennialParade();
    if(name==='custom-stops.js'&&basicMode&&window.NOUX_PLAN_REVISION?.active()){
     try{window.NOUX_PLAN_REVISION.install()}catch(_){}
    }
    if(name==='custom-stops.js'&&!basicMode){
     // The stable venue/explorer layers can initialise here; choices, route
     // auditing and subway enhancements must not mutate state before React's
     // initial render. In basic mode, boot the decrypted private app alone.
     if(window.NOUX_EXPLORER){try{window.NOUX_EXPLORER.install()}catch(_){}}
     if(window.NOUX_VENUES){try{window.NOUX_VENUES.install()}catch(_){}}
      if(window.NOUX_PLAN_REVISION?.active()){try{window.NOUX_PLAN_REVISION.install()}catch(_){}}
    }
   }
   $('root').hidden=false;screen.style.display='none';
   setLoading(true);
   // A slow phone or browser may need several seconds for React's first paint.
   const rendered=await waitForApp();
   setLoading(false);
   if(!rendered){
    emergency('Your private itinerary decrypted, but the visual interface could not start. The schedule below is still available.', 'Visual app did not mount; React '+(window.React?'loaded':'unavailable')+'; ReactDOM '+(window.ReactDOM?'loaded':'unavailable')+'; root children '+($('root')?.childElementCount||0)+'; script warning '+(visualError?'detected':'not detected'));
   }else{
    if(!basicMode){
     // Progressive enhancement *after* the first React paint. A bad extension
     // must never prevent the core planner from mounting.
     if(window.NOUX_PLAN_REVISION?.active()){
      // Do not reinsert the retired art, rooftop, club or sunrise routes.
      try{window.NOUX_PLAN_REVISION.install()}catch(_){}
     }else{
      try{window.NOUX_CHOICES?.install()}catch(_){}
      try{window.NOUX_DAY_AUDIT?.install()}catch(_){}
     }
     try{window.NOUX_SUBWAY?.install()}catch(_){}
     // Do not force immediate React tab toggles during startup. Decisions refresh
     // naturally when the visitor opens the itinerary or changes a selection.
    }
    // Encrypted checklist is a sibling of React's root, not a child of its nav.
    if(window.NOUX_DEPARTURE){try{await window.NOUX_DEPARTURE.install({key})}catch(_){}}
    // Nonessential sync attaches outside React. Connectivity failure can never
    // prevent the private site from opening or clear saved local state.
    if(window.NOUX_SYNC){try{await window.NOUX_SYNC.install({key})}catch(_){}}
    // Informational Food guide is separate from the React root and never
    // mutates private itinerary, booked stops, or passphrase handling.
    if(window.NOUX_FOOD_GUIDE){try{window.NOUX_FOOD_GUIDE.install()}catch(_){}}
    // Native Trip Settings owns these body-only helpers; React stays untouched.
    if(window.NOUX_BOOKING_DESK){try{window.NOUX_BOOKING_DESK.install()}catch(_){}}
    if(window.NOUX_ROUTE_GUIDE){try{window.NOUX_ROUTE_GUIDE.install()}catch(_){}}

    // Only contextual helpers remain, outside React and after first paint.
    // Shared sync and offline are accessible through the existing Trip Settings;
    // Lyna's optional guided choices are accessible through Explore.
    if(!window.NOUX_PLAN_REVISION?.active()&&window.NOUX_DECISION_GUIDE){try{window.NOUX_DECISION_GUIDE.install()}catch(_){}}
    if(window.NOUX_TRIP_TOOLS){try{window.NOUX_TRIP_TOOLS.install()}catch(_){}}
    try{window.NOUX_PLAN_REVISION?.decorate?.()}catch(_){}
    // If the full view genuinely crashes later, preserve a usable read-only
    // schedule without a repeating basic-mode login screen.
    setTimeout(()=>{if(!healthy())emergency('The visual page stopped rendering, but your private schedule is still available.','Delayed render failure; no browser data was erased.')},1600);
    try{if(basicMode){sessionStorage.removeItem('noux_basic_mode');const url=new URL(location.href);url.searchParams.delete('basic');history.replaceState(null,'',url.href)}}catch(_){} 
   }
   window.removeEventListener('error',onVisualError);
   window.removeEventListener('unhandledrejection',onVisualError);
   // The password is never persisted, logged or placed in the URL.
  }catch(error){
   unlocked=false;attempts++;bar.style.width='0%';button.disabled=false;input.disabled=false;
   document.body.classList.remove('unlock-thinking');screen.classList.remove('unlocked');
   const wrong=error.name==='OperationError';mark(wrong?'That passphrase did not open our journey. Try again.':(error.message||'Unable to open this itinerary.'),'error');
   screen.classList.remove('shake');void screen.offsetWidth;screen.classList.add('shake');
   if(wrong&&attempts>=6)mark('Several incorrect attempts. Check the exact private passphrase.','error');
   input.focus();
  }
 });
})();