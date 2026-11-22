/* NOUX tickets and reservations. No payment, purchase or automatic booking.
 * Explicit confirmations are local and participate in existing encrypted sync.
 */
(function(){
'use strict';
if(window.NOUX_BOOKING_DESK)return;
const KEY='noux_booking_status_v1';
const ITEMS=[
 ['mon','04','Cruise · Golden Hour','booked','Pier 79, NY Waterway West Midtown Terminal (459 12th Ave), Slip 2. Arrive around 15:25; meeting/boarding at 15:40; sailing 16:00–18:00.','https://www.nywaterway.com/midtownw39thterminal.aspx'],
 ['mon','07','Dear Irving on Hudson · 21:15','booked','Table for two already reserved.','https://www.dearirving.com/'],
 ['tue','01','Butterfly Vivarium · 10:30','booked','Admission booked according to traveller; 10:30 remains the planned visit time. Check the ticket for the exact entry slot.','https://www.amnh.org/plan-your-visit'],
 ['tue','03','Guggenheim · 13:30','ticket','Museum admission; planned after AMNH.','https://www.guggenheim.org/plan-your-visit'],
 ['tue','06','Hudson VU · 16:30','booked','Rooftop reservation confirmed by traveller; 16:30 remains the planned arrival, subject to reservation details.','https://www.hudsonvunyc.com/reservations'],
 ['tue','09','Reuben James · Blue Note · 20:00','ticket','Official 20:00 show; doors 18:00, first-come seating and $20 minimum per person.','https://www.bluenotejazz.com/nyc/tm-event/reuben-james-featuring-chris-dave-and-david-dj-ginyard/'],
 ['wed','05','Whitney Museum · 13:10','ticket','Museum admission.','https://whitney.org/visit'],
 ['wed','13','Louie Vega · Superior Ingredients · 22:00','waitlist','ON WAITLIST: request registered, but entry is NOT guaranteed. Do not mark as admitted until a valid ticket is issued. The Room is indoors, not the rooftop.','https://ra.co/events/2567360'],
 ['thu','03','Mercer Labs · 11:30','booked','Admission booked according to traveller; 11:30 remains the planned visit time. Check the ticket for the exact entry slot.','https://mercerlabs.com/'],
 ['thu','04',"Sadie's Seaport · 13:20",'reservation','Thanksgiving brunch announced 10:00–15:00; table not yet confirmed.','https://www.sadies.nyc/'],
 ['thu','05','DAYDREAM · Balloon Museum · 14:30','ticket','Thanksgiving-week programme advertised; select admission.','https://tickets.balloonmuseum.world/newyork/'],
 ['thu','07','Colbo Next Door · 17:00','hours','Thanksgiving opening is unverified; keep conditional.','https://shop.colbo.nyc/'],
 ['thu','09','Nubeluz · 19:30','reservation','Preferred rooftop table; not booked yet.','https://www.nubeluzbyjose.com/'],
 ['fri','05','Golden Diner · 13:00','reservation','Prioritised for lunch; verify direct holiday opening and allow for queues.','https://www.goldendinerny.com/dine'],
 ['fri','09','Group coach · around 17:00','arranged','Arranged travel; precise lobby pickup is subject to organiser.',''],
 ['fri','10','Return flight · 21:30','booked','Flight departure already arranged.','']
];
const dates={mon:'Mon 23',tue:'Tue 24',wed:'Wed 25',thu:'Thu 26',fri:'Fri 27'};
const fixed=new Set(ITEMS.filter(x=>x[3]==='booked'||x[3]==='arranged').map(x=>id(x)));
let PANEL=null,OPEN=false,DAY='all',INSTALLED=false,NOTE='';
function id(item){return 'approved_202611'+({mon:'23',tue:'24',wed:'25',thu:'26',fri:'27'}[item[0]])+'_'+item[1]}
function read(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return raw&&typeof raw==='object'&&raw.confirmations&&typeof raw.confirmations==='object'?raw:{confirmations:{}}}catch(_){return {confirmations:{}}}}
function confirmed(eventId){
 if(fixed.has(eventId))return true;
 const item=ITEMS.find(x=>id(x)===eventId),state=read();
 // A historic boolean from when this was listed as an ordinary ticket must
 // never turn a newly disclosed waitlist into a guaranteed admission.
 if(item?.[3]==='waitlist')return state.waitlistAdmissions?.[eventId]===true;
 return state.confirmations[eventId]===true;
}
function setConfirmed(eventId,checked){
 if(typeof eventId!=='string'||!ITEMS.some(item=>id(item)===eventId)||fixed.has(eventId))return false;
 const item=ITEMS.find(x=>id(x)===eventId),doc=read();
 if(item?.[3]==='waitlist'){
  // Explicit post-waitlist admission; do not migrate legacy confirmations.
  if(!doc.waitlistAdmissions||typeof doc.waitlistAdmissions!=='object')doc.waitlistAdmissions={};
  doc.waitlistAdmissions[eventId]=!!checked;
 }else doc.confirmations[eventId]=!!checked;
 try{
  localStorage.setItem(KEY,JSON.stringify(doc));
  document.dispatchEvent(new CustomEvent('noux:local-change',{detail:{source:'booking-desk',id:eventId}}));
  NOTE=item?.[3]==='waitlist'?'Waitlist admission status saved. Only mark Ticket issued after the organiser confirms entry. Shared sync will copy this change if paired.':'Saved to this device. If paired, shared sync will copy the change. Reload the itinerary to update its status badges.';
  if(OPEN)render();
  return true;
 }catch(_){NOTE='Could not save this change; previous booking status was preserved.';if(OPEN)render();return false}
}
function status(){
 const rows=ITEMS.filter(x=>['ticket','reservation','hours','waitlist'].includes(x[3]));
 return {total:rows.length,confirmed:rows.filter(x=>confirmed(id(x))).length,
  waitlisted:rows.filter(x=>x[3]==='waitlist'&&!confirmed(id(x))).length,
  bookedAlready:ITEMS.filter(x=>x[3]==='booked').length,arranged:ITEMS.filter(x=>x[3]==='arranged').length};
}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n}
function button(text,fn,cls){const b=el('button',cls||'',text);b.type='button';b.addEventListener('click',fn);return b}
function row(item){
 const eventId=id(item),kind=item[3],done=confirmed(eventId),n=el('div','noux-ticket-item');
 const info=el('div','noux-ticket-info');
 info.append(el('strong',null,item[2]),el('small',null,item[4]));
 const right=el('div','noux-ticket-actions');
 const locked=kind==='booked'||kind==='arranged';
 const label=el('label','noux-ticket-check');
 const input=el('input');input.type='checkbox';input.checked=done;input.disabled=locked;
 input.setAttribute('aria-label',(kind==='hours'?'Opening verified: ':kind==='waitlist'?'Ticket issued after waitlist: ':'Purchased or reserved: ')+item[2]);
 input.addEventListener('change',()=>setConfirmed(eventId,input.checked));
 label.append(input,el('span',null,locked?(kind==='arranged'?'Arranged':'Booked'):kind==='waitlist'?(done?'Ticket issued':'On waitlist'):done?(kind==='hours'?'Verified':'Confirmed'):(kind==='hours'?'Check hours':'To arrange')));
 right.append(label);
 if(item[5]){const a=el('a','noux-ticket-link','Official page ↗');a.href=item[5];a.target='_blank';a.rel='noopener noreferrer';right.append(a)}
 n.append(info,right);return n;
}
function render(){
 if(!OPEN||!PANEL)return;
 const c=PANEL.querySelector('.noux-ticket-content');if(!c)return;
 const head=el('div','noux-ticket-top'),text=el('div');
 text.append(el('small',null,'NOUX · TRIP SETTINGS'),el('h2',null,'Tickets & reservations'),
  el('p',null,'Bookings listed as confirmed were provided by the traveller. A waitlist is NOT an admission ticket. Mark waitlist entry confirmed only when an actual ticket is issued.'));
 head.append(text,button('× Close',close,'noux-ticket-secondary'));
 const tabs=el('div','noux-ticket-days');
 [['all','All'],...Object.entries(dates)].forEach(([key,label])=>tabs.append(button(label,()=>{DAY=key;render()},'noux-ticket-day'+(DAY===key?' active':''))));
 const list=el('div','noux-ticket-list');
 for(const day of Object.keys(dates)){
  if(DAY!=='all'&&DAY!==day)continue;
  const section=el('section','noux-ticket-section');section.append(el('h3',null,dates[day]));
  for(const item of ITEMS.filter(x=>x[0]===day))section.append(row(item));
  list.append(section);
 }
 const footer=el('div','noux-ticket-footer'),t=status();
 footer.append(el('small',null,t.confirmed+' / '+t.total+' outstanding checks completed · '+t.bookedAlready+' booked · '+t.arranged+' arranged travel'+(t.waitlisted?' · '+t.waitlisted+' on waitlist (no guaranteed entry)':'')));
 if(NOTE)footer.append(el('p',null,NOTE));
 footer.append(button('Refresh itinerary badges',()=>location.reload(),'noux-ticket-primary'));
 c.replaceChildren(head,tabs,list,footer);
}
function open(){if(!INSTALLED)return false;OPEN=true;PANEL.hidden=false;document.body.classList.add('noux-ticket-open');render();return true}
function close(){OPEN=false;if(PANEL)PANEL.hidden=true;document.body.classList.remove('noux-ticket-open')}
function install(){
 if(INSTALLED)return true;
 if(!window.NYC_DATA||!document.body)return false;
 PANEL=el('section','noux-ticket-modal');PANEL.id='noux-ticket-modal';PANEL.hidden=true;
 PANEL.setAttribute('role','dialog');PANEL.setAttribute('aria-modal','true');PANEL.setAttribute('aria-label','Tickets and reservations');
 PANEL.append(el('div','noux-ticket-content'));document.body.append(PANEL);
 document.addEventListener('keydown',e=>{if(OPEN&&e.key==='Escape')close()});
 INSTALLED=true;return true;
}
window.NOUX_BOOKING_DESK={install,open,close,confirmed,setConfirmed,status,records:()=>ITEMS.map(x=>({day:x[0],id:id(x),title:x[2],kind:x[3],confirmed:confirmed(id(x)),url:x[5]})),version:'2026.11.23-reservations2'};
})();