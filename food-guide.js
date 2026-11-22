/* NOUX Food Guide. Displays structured public information for native Food
 * wishlist entries without mutating or replacing React-controlled markup.
 * No reservations, passphrase, geolocation, or network calls at startup.
 */
(function(){
'use strict';
if(window.NOUX_FOOD_GUIDE)return;
let INSTALLED=false,OPEN=false,SELECTED='',DAY='all',QUERY='',PANEL=null,LAUNCHER=null;
const DAYS=[['all','All days'],['mon','Mon 23'],['tue','Tue 24'],['wed','Wed 25'],['thu','Thu 26'],['fri','Fri 27']];
const dname={mon:'Monday 23',tue:'Tuesday 24',wed:'Wednesday 25',thu:'Thursday 26',fri:'Friday 27'};
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node};
const button=(text,fn,cls)=>{const v=el('button',cls||'',text);v.type='button';v.addEventListener('click',fn);return v};
function normal(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function catalogue(){
 const source=window.NOUX_FOOD_WISHLIST;
 if(!source||typeof source.catalogue!=='function')return [];
 const fixed=source.catalogue();
 const wishlist=Array.isArray(window.NYC_DATA?.WISHES)?window.NYC_DATA.WISHES.filter(x=>Array.isArray(x)&&x[1]==='food'):[];
 const result=fixed.map(p=>{
  const row=wishlist.find(w=>source.find(w[0])?.id===p.id);
  return {...p,priority:row?row[3]:p.must?'core':'choice',preferred:row?.[2]||'',inWishlist:!!row};
 });
 // New private Food wishes also get a safe no-fabrication fallback.
 wishlist.forEach(row=>{
  if(result.some(x=>source.find(row[0])?.id===x.id))return;
  const title=String(row[0]||'').trim().slice(0,160);
  if(!title)return;
  result.push({
   id:'extra-'+normal(title).slice(0,40),name:title,venue:title,area:'New York · location to verify',
   address:'',website:'',hours:'Opening hours not yet verified',regular:'Hours unverified',
   days:row[2]?[row[2]]:[],minutes:30,priority:row[3],preferred:row[2],
   source:'Not verified',holiday:'Check Thanksgiving and holiday hours with the venue',
   note:'An additional personal Food wish. Use the current map search to choose the correct branch; no address or hours have been invented.'
  });
 });
 return result;
}
function safeLink(label,url,cls){
 const a=el('a',cls||'noux-food-link',label);
 if(typeof url==='string'&&/^https:\/\//.test(url)){a.href=url;a.target='_blank';a.rel='noopener noreferrer'}
 return a;
}
function mapsSearch(p){
 return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.address?p.venue+' '+p.address:p.venue+' New York City');
}
function directions(p){
 return p.address?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.address):mapsSearch(p);
}
function publishedHours(p){
 if(DAY==='fri'&&p.friday)return p.friday;
 if(DAY==='thu'){
  if(p.thursday)return p.thursday;
  if(/^CLOSED/i.test(p.holiday||''))return 'Closed on Thanksgiving (official)';
  if(/^Thanksgiving: closes at/i.test(p.holiday||''))return p.holiday;
  return 'Thanksgiving hours not confirmed · check before travelling';
 }
 return p.regular||p.hours||'Not verified';
}
function freshStatus(){
 const list=catalogue();
 const matched=list.filter(p=>p.address&&p.website).length;
 return matched+' mapped Food profiles · reviewed against published information by 22 Nov 2026 · holiday exceptions and live availability require venue confirmation · New York EST';
}
function renderCard(p){
 const card=el('article','noux-food-card'+(SELECTED===p.id?' noux-food-selected':''));
 card.id='noux-food-'+p.id;
 const top=el('div','noux-food-top'),txt=el('div','noux-food-title');
 txt.append(el('small','noux-food-area',p.area));
 txt.append(el('h3',null,p.name));
 const ptag=el('span','noux-food-priority',p.priority==='core'?'Must try':'Optional');
 top.append(txt,ptag);
 card.append(top);
 const details=el('div','noux-food-grid-detail');
 const venue=el('div');venue.append(el('small',null,'BRANCH & ADDRESS'),el('strong',null,p.venue||p.name));
 venue.append(el('span',null,p.address||'Exact location not yet confirmed'));
 const open=el('div');open.append(el('small',null,DAY==='all'?'PUBLISHED REGULAR HOURS':'HOURS · '+dname[DAY].toUpperCase()));
 open.append(el('strong',null,DAY==='all'?p.hours:publishedHours(p)));
 if(DAY==='all'&&p.holiday)open.append(el('span',null,'26 Nov · '+p.holiday));
 details.append(venue,open);
 card.append(details);
 card.append(el('p','noux-food-tip',p.note));
 const footer=el('div','noux-food-footer');
 const dayText=p.days.length?p.days.map(d=>dname[d]||d).join(' / '):'Flexible · check route';
 footer.append(el('small','noux-food-best','Best route fit: '+dayText+' · '+p.minutes+' min typical visit (not including travel/queue)'));
 const actions=el('div','noux-food-actions');
 actions.append(safeLink('Directions',directions(p),'noux-food-action noux-food-action-primary'));
 actions.append(safeLink('Check live hours',mapsSearch(p),'noux-food-action'));
 if(p.website)actions.append(safeLink('Official website',p.website,'noux-food-action'));
 footer.append(actions);
 const status=el('p','noux-food-source','Hours are published schedules, not verified live opening. '+p.source+'. Holiday hours may differ.');
 footer.append(status);
 card.append(footer);
 return card;
}
function draw(){
 if(!PANEL||!OPEN)return;
 const pane=PANEL.querySelector('.noux-food-content');if(!pane)return;
 const header=el('div','noux-food-head'),heading=el('div');
 heading.append(el('small','noux-food-eyebrow','NOUX · CURATED WISHLIST'),el('h2',null,'Food, properly mapped'),el('p',null,'Where to go, when it usually opens, and when the detour makes sense.'));
 header.append(heading,button('× Close',close,'noux-food-close'));
 const info=el('p','noux-food-disclaimer',freshStatus()+'. For 26 November, never assume normal Thursday opening times. No table or pickup is booked.');
 const controls=el('div','noux-food-controls');
 const search=el('input');search.type='search';search.value=QUERY;search.placeholder='Search burgers, bagels, a neighbourhood…';search.setAttribute('aria-label','Search food wishes');
 search.addEventListener('input',()=>{QUERY=search.value;drawList()});
 const days=el('div','noux-food-days');
 DAYS.forEach(([key,label])=>days.append(button(label,()=>{DAY=key;draw()},'noux-food-day'+(DAY===key?' active':''))));
 controls.append(search,days);
 const count=el('p','noux-food-results');count.id='noux-food-results';
 const list=el('div','noux-food-list');list.id='noux-food-results-list';
 pane.replaceChildren(header,info,controls,count,list);
 drawList();
}
function drawList(){
 const list=PANEL?.querySelector('#noux-food-results-list'),counter=PANEL?.querySelector('#noux-food-results');
 if(!list)return;
 const q=normal(QUERY),all=catalogue();
 const filtered=all.filter(p=>(DAY==='all'||DAY==='thu'||p.days.includes(DAY)||p.preferred===DAY)&&(!q||normal([p.name,p.venue,p.area,p.address,p.note].join(' ')).includes(q)));
 filtered.sort((a,b)=>{
  if(SELECTED===a.id&&SELECTED!==b.id)return -1;
  if(SELECTED===b.id&&SELECTED!==a.id)return 1;
  return Number(b.priority==='core')-Number(a.priority==='core')||a.venue.localeCompare(b.venue);
 });
 list.replaceChildren(...filtered.map(renderCard));
 counter.textContent=filtered.length+' of '+all.length+' food wishes · '+(DAY==='all'?'flexible recommendations':DAY==='thu'?'Thanksgiving status · regular hours are not a guarantee':'suggested for '+dname[DAY]);
 if(!filtered.length)list.append(el('p','noux-food-empty','No food picks for this filter. Choose All days or search another dish.'));
}
function open(id){
 if(!INSTALLED||!PANEL)return;
 SELECTED=id||'';DAY='all';OPEN=true;PANEL.hidden=false;
 document.body.classList.add('noux-food-open');
 draw();
 PANEL.querySelector('.noux-food-close')?.focus();
}
function close(){OPEN=false;if(PANEL)PANEL.hidden=true;document.body.classList.remove('noux-food-open')}
function selectCard(event){
 const t=event.target;
 if(!t||!t.closest||t.closest('a,button,input,select,textarea'))return;
 const card=t.closest('.wish-item');
 if(!card)return;
 const module=window.NOUX_FOOD_WISHLIST;
 const pick=module?.find?.(card.textContent||'');
 if(pick)open(pick.id);
}
function updateLauncher(){
 if(!LAUNCHER)return;
 // React's Wishlist may be mounted or unmounted as tabs change. Only read
 // its DOM; never add children or attributes to React-controlled elements.
 const wishGrid=document.querySelector('.wishes .wish-grid');
 const hasFood=wishGrid&&Array.from(wishGrid.querySelectorAll('.wish-item')).some(x=>window.NOUX_FOOD_WISHLIST?.find?.(x.textContent||''));
 LAUNCHER.hidden=!hasFood;
}
function mount(){
 if(PANEL)return;
 PANEL=el('section','noux-food-modal');PANEL.id='noux-food-guide';PANEL.hidden=true;
 PANEL.setAttribute('role','dialog');PANEL.setAttribute('aria-modal','true');PANEL.setAttribute('aria-label','NYC food locations and hours');
 PANEL.append(el('div','noux-food-content'));
 document.body.append(PANEL);
 // No floating button. Click a food Wish card or use Explore to open details.
 document.addEventListener('click',selectCard,true);
 document.addEventListener('keydown',e=>{if(OPEN&&e.key==='Escape')close()});
 const root=document.getElementById('root');
 if(root&&typeof MutationObserver!=='undefined'){
  let scheduled=false;
  const obs=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;updateLauncher()})});
  obs.observe(root,{childList:true,subtree:true});
 }
 updateLauncher();
}
function install(options){
 if(INSTALLED)return true;
 if(!window.NOUX_FOOD_WISHLIST||!window.NYC_DATA||!Array.isArray(window.NYC_DATA.WISHES))return false;
 INSTALLED=true;
 if(!options?.headless)mount();
 return true;
}
window.NOUX_FOOD_GUIDE={install,open,catalogue,version:'2026-11-21-slim1'};
})();
