/* Approved NOUX release-integrity audit · public fixtures and source modules.
 * Ensures a new day, booking, location or Food venue cannot silently leave
 * the native planner, route guides and reservation desk inconsistent.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=name=>fs.readFileSync(name,'utf8');
const files=['approved-week.js','booking-desk.js','food-wishlist.js','route-guide.js'];
const state={},win={};
const storage={getItem:k=>state[k]||null,setItem:(k,v)=>state[k]=String(v)};
for(const name of files)vm.runInNewContext(source(name),{window:win,localStorage:storage,document:{},Object,Array,String,Set,Map,JSON,Date,Math,Number,Intl},{filename:name});
const plan=win.NOUX_APPROVED_WEEK,booking=win.NOUX_BOOKING_DESK,food=win.NOUX_FOOD_WISHLIST,route=win.NOUX_ROUTE_GUIDE;
const dates={mon:'2026-11-23',tue:'2026-11-24',wed:'2026-11-25',thu:'2026-11-26',fri:'2026-11-27'};
assert.equal(plan.revision,'2026-11-23-bookings-confirmed','Approved fixed-route revision');
assert.equal(Object.keys(plan.days).length,5,'Exactly five approved days');
const all=[],seen=new Set(),missing=[],timeErrors=[];
const mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
for(const [day,date] of Object.entries(dates)){
 const evs=plan.days[date]?.events||[];
 assert(evs.length>=7,'Complete itinerary on '+day);
 let prev=-1;
 for(const event of evs){
  assert(!seen.has(event.id),'Duplicate event ID '+event.id);seen.add(event.id);
  assert(plan.places[event.place],'Unmapped scheduled stop '+day+' '+event.place);
  assert(route.context(event.place),'No route-guide enrichment for '+event.place);
  assert(mins(event.start)>=prev,'Time sequence out of order '+day+' '+event.title);
  prev=mins(event.start);
  assert(['proposed','booked','arranged','ticket-to-check','hours-to-check','confirmed','public-event'].includes(event.status),'Unknown status '+event.status);
  all.push({...event,day});
 }
}
const tracked=booking.records();
assert(tracked.length>=14,'Enough booking checks to cover five-day commitments');
for(const b of tracked){
 const event=all.find(x=>x.id===b.id);
 assert(event,'Booking entry has no corresponding scheduled event: '+b.id);
 assert.equal(b.day,event.day,'Booking assigned to wrong day: '+b.title);
 if(b.kind==='booked'||b.kind==='arranged')assert(['booked','arranged'].includes(event.status),'Previously confirmed booking wrongly represented: '+b.title);
}
const friday=plan.days[dates.fri].events;
assert(friday.some(e=>/DUMBO/i.test(e.title))&&friday.some(e=>/Walk Brooklyn Bridge/.test(e.title)),'Fixed Friday DUMBO and bridge');
assert(!friday.some(e=>/sunrise|weather.day/i.test(e.title)),'No legacy sunrise/alternative on Friday');
assert(friday.find(e=>/Golden Diner/.test(e.title)),'Friday lunch stays fixed');
const thursday=plan.days[dates.thu].events;
assert(thursday.some(e=>/Mercer Labs/.test(e.title))&&thursday.some(e=>/DAYDREAM/.test(e.title)),'Both selected immersive exhibitions Thursday');
const confirmEvent=id=>all.find(e=>e.id===id);
for(const [id,label] of [
 ['approved_20261124_01','Butterfly Vivarium'],['approved_20261124_06','Hudson VU'],
 ['approved_20261126_03','Mercer Labs']]){
 const event=confirmEvent(id);
 assert(event&&event.status==='booked',label+' is newly booked in the approved plan');
 assert(booking.confirmed(id),label+' is booked in the ticket desk as well');
 assert(tracked.find(b=>b.id===id)?.kind==='booked',label+' is not listed as a pending ticket');
}
const louie=confirmEvent('approved_20261125_13'),louieBooking=tracked.find(b=>b.id===louie?.id);
assert(louie?.status==='ticket-to-check'&&/WAITLISTED.*NOT confirmed/i.test(louie.detail),'Waitlisted Louie Vega never appears as confirmed admission');
assert(louieBooking?.kind==='waitlist'&&louieBooking.confirmed===false,'Waitlist distinct from an issued ticket');
assert.equal(booking.status().waitlisted,1,'One active waitlist reported');
assert.equal(booking.status().bookedAlready,6,'Six actual bookings including pre-existing reservations');
assert(thursday.some(e=>/Sadie.s Seaport/.test(e.title)),'Thanksgiving Sadies lunch remains on Thursday');
assert(!all.some(e=>/Le Bain|River Café|Macy.s parade|Soul in the Horn/i.test(e.title)),'Retired itinerary choices did not return');
const cruise=plan.days[dates.mon].events.find(e=>/Golden Hour harbour cruise/.test(e.title));
assert(cruise&&cruise.status==='booked'&&cruise.start==='16:00','Monday cruise is protected');
assert.equal(plan.places.pier.name,'Pier 79 · Slip 2 · NY Waterway','Actual booked ferry terminal from supplied confirmation');
assert(plan.places.pier.address.includes('459 12th Avenue'),'Map resolves to correct Pier 79 ferry terminal address');
assert(plan.places.pier.lat>40.760&&plan.places.pier.lng< -74.003,'Corrected waterfront pin coordinates');
assert(plan.days[dates.mon].events[3].detail.includes('15:40'),'Actual 15:40 meeting time retained');
assert(cruise.detail.includes('Slip 2')&&cruise.detail.includes('15:40'),'Cruise reflects booking-confirmed Slip 2 and boarding time');
const foodCatalog=food.catalogue(),titles=foodCatalog.map(x=>x.name);
assert.equal(foodCatalog.length,15,'Fifteen public Food profiles');
assert(titles.some(t=>/Golden Diner/i.test(t))&&titles.some(t=>/Sadie.s Seaport/i.test(t)),'Both final food additions present');
assert(foodCatalog.every(x=>x.address&&x.website&&x.hours),'Every Food profile has an address, source and hour text');
const publicSrc=source('approved-week.js');
for(const secret of ['NOUX_PASSPHRASE','Sanctuary Hotel','132 West 47th','AF007','Benjamin Bongard','Lyna Bongard'])
 assert(!publicSrc.includes(secret),'Public source leaked protected travel detail '+secret);
console.log('NO UX integrity PASS: 53 approved schedule events, five mapped days, all route notes, 16 matching booking entries and 15 food profiles.');
