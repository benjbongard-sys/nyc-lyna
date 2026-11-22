/* NOUX visit-by-visit navigation and venue context.
 * Uses ONLY the active approved itinerary, never archived route choices.
 * Durations in NOUX are planning estimates; opening a Maps link fetches
 * live directions from the provider. MTA arrivals remain in Subway arrivals.
 */
(function(){
'use strict';
if(window.NOUX_ROUTE_GUIDE)return;
const DAYS={mon:'Mon 23',tue:'Tue 24',wed:'Wed 25',thu:'Thu 26',fri:'Fri 27'};
const CONTEXT={
 times:{hours:'Public outdoor district; individual venues have separate hours',note:'Evening walk after the booked harbour cruise. Follow pedestrian crossings and avoid treating Times Square as a ticketed attraction.',source:'NYC public streets / tourism context'},
 tacos:{hours:'Typical weekday service until late evening; confirm Thanksgiving exceptions',note:'A nearby quick-food alternative for Monday around 20:00. This is not a reserved dinner; the actual chosen food stop can be Shake Shack or 375° instead.',source:'Los Tacos No. 1 branch listing'},
 dear:{hours:'Monday 23 November · reservation at 21:15',note:'Dear Irving on Hudson cocktails for two are already booked. Allow transfer time from the quick dinner; a view/window table is not guaranteed.',source:'Traveller-confirmed reservation'},
 mables:{hours:'Regular posted dinner hours; Thanksgiving-week exceptions possible',note:'Williamsburg BBQ is an option, not a fixed reservation. Do not add a separate trip across the river just to eat here.',source:'Mable’s Smokehouse website'},
 pier:{hours:'Not verified',note:'The booked cruise is at 16:00. Consult the voucher for the ACTUAL pier and boarding cutoff; the current waterfront map point is only a placeholder.',source:'Booking voucher required'},
 amnh:{hours:'Check museum and Butterfly Vivarium timed admission',note:'10:30 visit. The Vivarium requires a separate timed ticket.',source:'AMNH official visitor information'},
 gugg:{hours:'Regular museum hours; holiday exceptions possible',note:'Focused 13:30–14:40 visit. The 14:00 architecture talk is optional if offered that day.',source:'Guggenheim official visiting information'},
 albertine:{hours:'Check 24 November opening and ballroom access',note:'The ceiling artwork is not a guarantee of access to the ballroom.',source:'Albertine / Villa Albertine'},
 hudsonvu:{hours:'16:30 table requires confirmation',note:'A selected rooftop, not an actual reservation. Special access or minimum spend may apply.',source:'Hudson VU reservations'},
 blue:{hours:'24 November · 20:00 show; doors 18:00',note:'Arrive early for first-come seating. Blue Note confirms a $20 minimum per person and a full dinner menu.',source:'Blue Note official 2026 programme'},
 nypl:{hours:'Visitor areas subject to NYPL access rules',note:'Rose Main Reading Room access must not be presumed. Photograph public spaces as permitted.',source:'NYPL visitor rules'},
 bryant:{hours:'Seasonal holiday-market opening may vary',note:'Short winter-village stop; skating is not a compulsory activity.',source:'Bryant Park official'},
 chelsea:{hours:'Market and individual vendors may have different hours',note:'Lobster Place is the desired lobster-roll stop. Check the vendor when arriving.',source:'Chelsea Market official'},
 whitney:{hours:'Museum entry to arrange',note:'13:10–14:25 focused visit. Carry tickets on your phone.',source:'Whitney official visiting information'},
 little:{hours:'Outdoor park, weather-dependent',note:'Short Hudson River stop before transferring to Williamsburg.',source:'Little Island official'},
 domino:{hours:'Outdoor park, weather-dependent',note:'Domino Park skyline photographs before the vintage-shop route.',source:'Domino Park official'},
 awoke:{hours:'Verify exact branch and closing time',note:'First Williamsburg vintage stop.',source:'Awoke Vintage'},
 stella:{hours:'Verify exact branch and closing time',note:'Second Williamsburg vintage stop.',source:'Stella Dallas'},
 superior:{hours:'25 November · event starts 22:00',note:'Louie Vega is scheduled at The Room indoors, not The Roof. The 00:45 end in NOUX is YOUR suggested departure, not the event ending time.',source:'Superior Ingredients / event organiser'},
 grand:{hours:'Grand Central concourse access may differ from shop hours',note:'Thanksgiving parade street closures may affect how you reach the terminal. The Holiday Fair should not be assumed open.',source:'Grand Central official'},
 mercer:{hours:'Check Thanksgiving timed admission',note:'Lyna’s essential 11:30 immersive art experience. Allow approximately 90 minutes.',source:'Mercer Labs official'},
 sadies:{hours:'Thu 26 Thanksgiving brunch: 10:00–15:00',note:'The Seaport published a 10:00–15:00 Thanksgiving brunch at Sadie’s. Your 13:20 arrival is planned, not a reservation.',source:'The Seaport Thanksgiving 2026',sourceUrl:'https://theseaport.nyc/events/thanksgiving/'},
 daydream:{hours:'Thanksgiving-week programme advertised; admission slot to check',note:'The Seaport advertises DAYDREAM seasonal activities 21–30 November, but that is not a guarantee of a specific ticket slot.',source:'The Seaport Thanksgiving 2026',sourceUrl:'https://theseaport.nyc/events/thanksgiving/'},
 colbo:{hours:'Thanksgiving 26 November: unconfirmed',note:'Stay conditional until the venue confirms an actual Thursday opening. If closed, continue to NoMad; no new itinerary decision is needed.',source:'Venue confirmation still needed'},
 nubeluz:{hours:'19:30 preferred reservation: not yet confirmed',note:'Indoor NoMad rooftop cocktail lounge. Confirm the reservation and cancellation policy.',source:'Nubeluz official'},
 dumbo:{hours:'Public waterfront, weather-dependent',note:'The DUMBO waterfront and bridge remain fixed for Friday, not an alternate Thursday activity.',source:'Brooklyn Bridge Park official'},
 bridge_bk:{hours:'Public pedestrian bridge',note:'Approach the pedestrian entrance at Tillary Street / Adams Street before crossing to Manhattan.',source:'NYC DOT'},
 bridge_mh:{hours:'Public pedestrian bridge',note:'Walk toward Manhattan, finishing on the City Hall side.',source:'NYC DOT'},
 golden:{hours:'Fri 27: opening reported by traveller; holiday directories conflict',note:'Golden Diner at 13:00 is fixed as the desired lunch. Confirm holiday service directly and allow for queues; a backup should not shift the confirmed airport transfer.',source:'Traveller check; venue confirmation advisable'},
 rough:{hours:'Check Black Friday shop opening',note:'Last record-shopping stop at Rockefeller Center, then hotel by about 16:15.',source:'Rough Trade official'},
 hotel:{hours:'Breakfast planned 09:00; checkout before noon Fri',note:'Exact accommodation details remain in the private encrypted itinerary. Collect bags by 16:40 on Friday.',source:'Private hotel booking'},
 jfk:{hours:'Friday flight departs 21:30',note:'Group transfer expected around 17:00; confirm exact lobby pickup with organiser.',source:'Private travel information'}
};
let PANEL=null,DAY='mon',OPEN=false,INSTALLED=false;
function make(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e}
function button(text,fn,cls){const e=make('button',cls||'',text);e.type='button';e.addEventListener('click',fn);return e}
function link(label,url,cls){if(typeof url!=='string'||!/^https:\/\//.test(url))return null;const a=make('a',cls||'',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a}
function time(t){return String(t||'').replace(/^0/,'')}
function schedule(day){
 const plan=window.NYC_PLAN,events=plan?.day?.(day,{})||[];
 const legs=plan?.legs?.(events)||[];
 const byEvent={};for(const l of legs)(byEvent[l.to.id]??=[]).push(l);
 return {events,byEvent};
}
function dayContent(day){
 const p=window.NYC_DATA?.P||{},plan=window.NYC_PLAN;
 const {events,byEvent}=schedule(day),group=make('div','noux-routes-items');
 events.forEach((e,i)=>{
  const place=p[e.place],raw=String(e.place||'').replace(/^noux_/,''),info=CONTEXT[raw];
  const card=make('article','noux-route-item');
  const top=make('div','noux-route-item-top');
  top.append(make('span','noux-route-index',String(i+1).padStart(2,'0')),
   make('strong',null,e.start+'–'+e.end+' · '+e.title));
  card.append(top);
  if(place)card.append(make('small','noux-route-address',place.address||place.area||'Location not specified'));
  // The published cruise marker is a placeholder, NOT an actual pier.
   // Never offer its inferred route duration as boarding instructions.
   if(e.place==='noux_pier'){
    card.append(make('p','noux-route-pier-warning','BOARDING PIER NOT VERIFIED. Check the exact pier printed on the cruise voucher before leaving the hotel. No travel estimate is shown for this placeholder.'));
   }
   const legs=e.place==='noux_pier'?[]:byEvent[e.id]||[];
  for(const l of legs){
   const leg=make('div','noux-route-leg');
   const mode=l.mode==='walking'?'Walk':l.mode==='driving'?'Car / coach':'Subway / transit';
   leg.append(make('b',null,mode+' · ~'+l.estimate+' min planning estimate'),
    make('small',null,l.slack<l.estimate?'Tight scheduled allowance: '+l.slack+' min':'Scheduled allowance: '+l.slack+' min'));
   const url=plan.routeUrl(l.from.place,l.to.place,l.mode);
   const a=link('Open current directions ↗',url,'noux-route-live');
   if(a)leg.append(a);
   card.append(leg);
  }
  if(info){
   const context=make('div','noux-route-context');
   context.append(make('small','noux-route-hours',info.hours),make('p',null,info.note));
   const src=info.sourceUrl?link('Source ↗',info.sourceUrl,'noux-route-source'):null;
   context.append(src||make('small',null,info.source));
   card.append(context);
  }
  const actions=make('div','noux-route-actions');
  if(place?.url){const a=link('Official venue ↗',place.url,'noux-route-source');if(a)actions.append(a)}
  if(i>0&&place&&!(byEvent[e.id]||[]).length&&e.kind!=='travel'&&e.kind!=='logistics'){
   const previous=events[i-1];
   if(previous.place!==e.place){
    const a=link('Navigation ↗',plan.routeUrl(previous.place,e.place,'walking'),'noux-route-source');
    if(a)actions.append(a);
   }
  }
  if(actions.childElementCount)card.append(actions);
  group.append(card);
 });
 return group;
}
function openSubway(){
 const n=Array.from(document.querySelectorAll('.topbar .mainnav button'))
 .find(e=>/subway|arrivals/i.test(e.textContent||''));
 if(n){close();n.click()}else alert('Open the Subway arrivals tab to inspect current MTA predictions.');
}
function render(){
 if(!OPEN||!PANEL)return;
 const root=PANEL.querySelector('.noux-routes-content');if(!root)return;
 const head=make('div','noux-routes-head'),info=make('div');
 info.append(make('small',null,'NOUX · LIVE-READY JOURNEY'),make('h2',null,'Stops, transfers & venue details'),
  make('p',null,'Each link opens current Google Maps directions from the previous stop. Durations in NOUX are geographical estimates, NOT live traffic or live subway predictions.'));
 head.append(info,button('× Close',close,'noux-routes-close'));
 const days=make('div','noux-routes-days');
 Object.entries(DAYS).forEach(([key,label])=>days.append(button(label,()=>{DAY=key;render()},'noux-routes-day'+(DAY===key?' active':''))));
 const services=make('div','noux-routes-services');
 services.append(button('Live MTA arrivals & route planner',openSubway,'noux-routes-primary'),
  make('small',null,'The MTA panel has verified real-time arrivals when its connection is available; official service alerts and journey plans remain subject to change.'));
 root.replaceChildren(head,days,services,dayContent(DAY));
}
function open(day){if(!INSTALLED)return false;DAY=DAYS[day]?day:DAY;OPEN=true;PANEL.hidden=false;document.body.classList.add('noux-routes-open');render();return true}
function close(){OPEN=false;if(PANEL)PANEL.hidden=true;document.body.classList.remove('noux-routes-open')}
function install(){
 if(INSTALLED)return true;
 if(!window.NOUX_PLAN_REVISION?.active()||!document.body)return false;
 PANEL=make('section','noux-routes-modal');PANEL.id='noux-routes-modal';PANEL.hidden=true;
 PANEL.setAttribute('role','dialog');PANEL.setAttribute('aria-modal','true');PANEL.setAttribute('aria-label','Journey legs and venue details');
 PANEL.append(make('div','noux-routes-content'));document.body.append(PANEL);
 document.addEventListener('keydown',e=>{if(OPEN&&e.key==='Escape')close()});
 INSTALLED=true;return true;
}
window.NOUX_ROUTE_GUIDE={install,open,close,context:id=>CONTEXT[id]||null,summary:day=>schedule(day),version:'2026.11.22'};
})();