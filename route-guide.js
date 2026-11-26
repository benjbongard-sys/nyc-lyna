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
 pier:{hours:'Mon 23 · meet 15:40 · departure 16:00',note:'Your cruise confirmation specifies Pier 79, Slip 2, at the NY Waterway West Midtown Ferry Terminal, 459 12th Avenue / West 39th Street. Aim to arrive about 15:25 and go to Slip 2 by 15:40. The departure is at 16:00. Do not confuse this terminal with nearby Pier 78.',source:'Traveller-supplied cruise confirmation; terminal address verified with NY Waterway',sourceUrl:'https://www.nywaterway.com/midtownw39thterminal.aspx'},
 amnh:{hours:'Tue 24 · admission booked; visit planned at 10:30',note:'Davis Family Butterfly Vivarium ticket confirmed by the traveller. Check your issued admission for the exact timed-entry slot and museum access rules.',source:'Traveller booking update / AMNH visitor information'},
 gugg:{hours:'Tue 24 · museum admission booked; planned 13:30',note:'Guggenheim admission booked according to the traveller. Follow the exact entry slot on the ticket if different from 13:30. The 14:00 architecture talk remains optional if offered.',source:'Traveller booking update / Guggenheim official visitor information'},
 albertine:{hours:'Fri 27: regular hours 10:00–18:00; Black Friday hours to confirm',note:'Rescheduled from Tuesday. Visit Albertine inside the Payne Whitney Mansion at 972 Fifth Avenue, including its celestial ceiling. Other mansion rooms are not guaranteed accessible. Call +1 332-228-2238 before travelling.',source:'Albertine official opening hours / Villa Albertine mansion',sourceUrl:'https://www.albertine.com/about-us/'},
 hudsonvu:{hours:'Tue 24 · rooftop reservation booked; planned 16:30',note:'Hudson VU booking confirmed by the traveller. Follow the time and any minimum-spend or cancellation conditions on your confirmation.',source:'Traveller booking update / Hudson VU reservations'},
 blue:{hours:'24 November · 20:00 show; doors 18:00',note:'Arrive early for first-come seating. Blue Note confirms a $20 minimum per person and a full dinner menu.',source:'Blue Note official 2026 programme'},
 nypl:{hours:'Visitor areas subject to NYPL access rules',note:'Rose Main Reading Room access must not be presumed. Photograph public spaces as permitted.',source:'NYPL visitor rules'},
 bryant:{hours:'Seasonal holiday-market opening may vary',note:'Short winter-village stop; skating is not a compulsory activity.',source:'Bryant Park official'},
 chelsea:{hours:'Market and individual vendors may have different hours',note:'Lobster Place is the desired lobster-roll stop. Check the vendor when arriving.',source:'Chelsea Market official'},
 whitney:{hours:'Museum entry to arrange',note:'13:10–14:25 focused visit. Carry tickets on your phone.',source:'Whitney official visiting information'},
 little:{hours:'Outdoor park, weather-dependent',note:'Short Hudson River stop before transferring to Williamsburg.',source:'Little Island official'},
 domino:{hours:'Outdoor park, weather-dependent',note:'Domino Park skyline photographs before the vintage-shop route.',source:'Domino Park official'},
 awoke:{hours:'Fri 27: regular 10:00–21:00; holiday hours to confirm',note:'Moved from Wednesday to 11:20 Friday. Use the 132 North 5th Street Williamsburg branch. Leave 11:45 for Stella Dallas.',source:'Awoke Vintage official shop directory',sourceUrl:'https://www.awokevintage.com/pages/visit-us'},
 stella:{hours:'Fri 27: regular 12:00–19:15; Black Friday hours to confirm',note:'285 North 6th Street; moved from Wednesday to noon Friday. Walk about 10–15 minutes from Awoke. Leave at 12:40 for DUMBO.',source:'Brooklyn Thrift / The Shopkeepers',sourceUrl:'https://brooklynthrift.com/stores/10ft-single-stella-dallas'},
 superior:{hours:'Wed 25 · Louie Vega starts 22:00 · ON WAITLIST',note:'The traveller is on the Louie Vega waitlist. No admission ticket or guaranteed entry has been confirmed. Do not rely on the waitlist for access. The Room is indoors, not The Roof; 00:45 is the planned personal departure, not the actual event end.',source:'Traveller booking update / event organiser'},
 grand:{hours:'Grand Central concourse access may differ from shop hours',note:'Thanksgiving parade moved to Saturday 28 November because of the storm. NYC advised avoiding afternoon and evening travel Thursday. The Holiday Fair should not be assumed open.',source:'Grand Central / NYC Emergency Management',sourceUrl:'https://www.nyc.gov/site/em/about/press-releases/20261125_pr-Mayor-Mamdani-Issues-Travel-Advisory-For-Thanksgiving.page'},
 mercer:{hours:'Thu 26 · admission booked; visit planned at 11:30',note:'Mercer Labs admission booked according to the traveller. Allow approximately 90 minutes and confirm the exact ticket entry slot if it differs from 11:30.',source:'Traveller booking update / Mercer Labs official'},
 sadies:{hours:'Thu 26 Thanksgiving brunch: 10:00–15:00',note:'The Seaport published 10:00–15:00 brunch. The 13:20 visit is not reserved and is conditional on safe access because of coastal flooding. Otherwise stay indoors near Mercer Labs / Oculus.',source:'The Seaport Thanksgiving 2026 / NYC Emergency Management',sourceUrl:'https://theseaport.nyc/events/thanksgiving/'},
 daydream:{hours:'Unscheduled wishlist option; replaced on Thursday',note:'DAYDREAM is no longer in the approved day plan. Existing tickets, if any, are not cancelled or exchanged automatically.',source:'Traveller itinerary update'},
 arte:{hours:'Daily including public holidays 10:00–21:00; last entry 19:30',note:'61 Chelsea Piers. Visit planned 14:50–16:10 on Thursday, only if official safety advice and venue access permit. NYC issued a coastal flood warning and high-wind warning; avoid unnecessary travel during the storm and stay indoors if unsafe. Call +1 929-529-8570 before buying tickets. Normally no timed entry; holiday GA $60, ARTE CAFE +$5. No ticket confirmed.',source:'ARTE Museum official FAQ / NYC Emergency Management',sourceUrl:'https://newyork.artemuseum.com/faq'},
 colbo:{hours:'Thanksgiving opening unconfirmed · optional only',note:'Retained in the wishlist, not a compulsory visit. Do not return across Manhattan after ARTE Museum; prioritise shelter during the storm.',source:'Traveller itinerary update / venue opening to check'},
 nubeluz:{hours:'19:30 preferred reservation: not yet confirmed',note:'Indoor NoMad lounge. Confirm reservation, venue operation and safe travel. Stay sheltered if the Thanksgiving storm is severe.',source:'Nubeluz / NYC Emergency Management'},
 dumbo:{hours:'Fri 27: public district, weather and access dependent',note:'13:25 Friday after Williamsburg. Prioritise Washington Street; avoid flooded waterfronts. Check alerts after the coastal flood advisory through Friday noon.',source:'Brooklyn Bridge Park / National Weather Service',sourceUrl:'https://forecast.weather.gov/showsigwx.php?lat=40.7073&lon=-74.0103'},
 bridge_bk:{hours:'Public pedestrian bridge, weather and access permitting',note:'Tillary Street / Adams Street pedestrian entrance. Do not cross if strong wind, closure or flooding makes travel unsafe. Use subway instead.',source:'NYC DOT / NYC Emergency Management'},
 bridge_mh:{hours:'Public pedestrian bridge, weather and access permitting',note:'Planned Friday 14:10–14:50, Brooklyn to Manhattan. Skip the crossing and use subway if unsafe; protect the airport pickup.',source:'NYC DOT / NYC Emergency Management'},
 golden:{hours:'Fri 27: opening reported by traveller; check holiday hours / availability',note:'Golden Diner at 15:05 is preferred but not reserved. Confirm immediate seating or a suitable reservation. If there is a queue, eat quickly elsewhere; leave Lower Manhattan by 15:35.',source:'Golden Diner FAQ / Resy',sourceUrl:'https://www.goldendinerny.com/faq'},
 rough:{hours:'Regular Friday 10:00–20:00; check special events',note:'Rough Trade remains a wishlist-only option, no longer a compulsory Friday stop. Do not sacrifice vintage shops or the airport buffer.',source:'Rough Trade official',sourceUrl:'https://www.roughtrade.com/en-us/stores/below'},
 hotel:{hours:'Friday breakfast/check-out 08:30–09:15; lobby by 16:45',note:'Exact accommodation details remain encrypted. Return by 16:15 Friday, collect bags by 16:40, group coach expected around 17:00. Stay sheltered on Thursday if severe weather persists.',source:'Private hotel booking / traveller departure plan'},
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
  // Pier 79 is now verified from the booking confirmation, so route
  // instructions and approximate transfer legs can be shown normally.
  const legs=byEvent[e.id]||[];
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