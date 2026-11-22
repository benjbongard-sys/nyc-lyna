/* NOUX Food wishlist: public restaurant suggestions, merged into existing private
   wishlist after decryption. No new tabs, local storage writes or itinerary edits. */
(function(){
  'use strict';
  if(window.NOUX_FOOD_WISHLIST)return;

  // The existing private wishlist schema is [title, category, preferredDay, priority].
  // An empty preferredDay keeps these ideas flexible, never a fixed reservation.
  // Verified public branch details, 21 Nov 2026. All hours are standard
  // published hours, NOT live availability. Thanksgiving rules vary.
  const picks=[
    {id:'goldendiner',name:'Golden Diner · honey butter pancakes',aliases:['golden diner'],must:true,
      venue:'Golden Diner · Two Bridges',area:'Two Bridges / Chinatown',address:'123 Madison St, New York, NY 10002, USA',
      hours:'Typical posted hours 09:00–22:00; Thanksgiving-week exceptions may differ',
      regular:'Usually 09:00–22:00 (verify holiday)',friday:'Friday 27: traveller confirmed open; published holiday directories conflict, check with the diner',
      website:'https://www.goldendinerny.com/dine',source:'Official Golden Diner reservation page; holiday check from traveller',
      days:['fri'],minutes:60,holiday:'Friday 27 open per traveller; holiday hours conflict across listings',
      note:'Approved Friday 13:00 lunch immediately after the Brooklyn Bridge crossing. Honey butter pancakes are the signature; reservations or a queue buffer are strongly recommended before the fixed JFK transfer.'},
    {id:'sadies',name:"Sadie's Seaport · Thanksgiving brunch",aliases:["sadie's","sadies seaport","sadies"],must:true,
      venue:"Sadie's · Seaport",area:'South Street Seaport',address:'19 Fulton St, New York, NY 10038, USA',
      hours:'Standard opening varies; Thanksgiving brunch confirmed 10:00–15:00',
      regular:'Check official daily hours',thursday:'Thanksgiving Thu 26: brunch 10:00–15:00 (Seaport official)',
      website:'https://www.sadies.nyc/',source:'The Seaport official Thanksgiving 2026 programme',
      days:['thu'],minutes:60,holiday:'Thanksgiving: brunch 10:00–15:00',
      note:'Approved Thursday 13:10 lunch between Mercer Labs and DAYDREAM, no cross-town detour. Fried chicken sandwich and skillet banana bread. A table is not yet confirmed.'},

    {id:'shakeshack',name:"Shake Shack · ShackBurger & fries",aliases:["shake shack"],must:true,
      venue:'Shake Shack · Theater District',area:'Theater District',address:'691 8th Ave, New York, NY 10036, USA',
      hours:'Daily 10:00–03:00 (next day)',regular:'10:00–03:00 (+1)',website:'https://shakeshack.com/location/theater-district',
      source:'Official Shake Shack location',days:['mon','fri'],minutes:25,holiday:'Thanksgiving hours not specifically verified',
      note:'Close to Times Square: a convenient burger stop near the hotel, not a cross-town excursion.'},
    {id:'375chicken',name:"375° Chicken 'n Fries · Lemon Pepper tenders",aliases:["375","375 chicken"],must:false,
      venue:"375° Chicken 'n Fries · Hell's Kitchen",area:"Hell's Kitchen",address:'649 9th Ave, New York, NY 10036, USA',
      hours:'Mon–Thu 11:00–02:00 (+1); Fri 11:00–03:00 (+1); Sat 12:00–03:00 (+1); Sun 12:00–00:00',
      regular:'11:00–02:00 (+1)',friday:'11:00–03:00 (+1)',website:'https://www.375chicken.com/locations/hells-kitchen',
      source:'Official 375° Hell’s Kitchen location',days:['mon','fri'],minutes:25,holiday:'Thanksgiving hours not confirmed',
      note:'Late-night chicken near the hotel. The lemon-pepper tenders are a quick snack, not a reason for a dedicated trip.'},
    {id:'liberty',name:'Liberty Bagels · everything bagel',aliases:['liberty bagel','liberty'],must:false,
      venue:'Liberty Bagels · Grand Central',area:'Midtown East',address:'5 E 47th St, New York, NY 10017, USA',
      hours:'Mon–Fri 06:00–18:00; Sat–Sun 07:00–18:00',regular:'06:00–18:00',
      website:'https://libertybagels.com/locations/',source:'Official Liberty Bagels locations',days:['mon','fri'],minutes:25,
      holiday:'Thanksgiving service is not verified',note:'Choose this 47th Street branch for a Midtown breakfast or a quick stop before Grand Central.'},
    {id:'katz',name:"Katz's Delicatessen · pastrami",aliases:['katz'],must:true,
      venue:"Katz's Delicatessen",area:'Lower East Side',address:'205 E Houston St, New York, NY 10002, USA',
      hours:'Mon–Thu 08:00–23:00; Fri 08:00 through Sun 23:00 (weekend continuous)',regular:'08:00–23:00',
      website:'https://katzsdelicatessen.com/location',source:'Official Katz’s hours & location',days:['wed'],minutes:45,
      holiday:'Thanksgiving: closes at 18:00 (official special hours)',
      note:'Classic pastrami-on-rye. Fit into a Lower East Side/SoHo route, not the Midtown–Whitney afternoon. Keep your deli ticket.'},
    {id:'russ',name:'Russ & Daughters · smoked salmon bagel',aliases:['russ'],must:false,
      venue:'Russ & Daughters · Original Shop',area:'Lower East Side',address:'179 E Houston St, New York, NY 10002, USA',
      hours:'Daily 08:00–16:00',regular:'08:00–16:00',
      website:'https://shop.russanddaughters.com/locations',source:'Official Russ & Daughters locations & holiday hours',days:['wed'],minutes:30,
      holiday:'CLOSED Thanksgiving 26 Nov; Black Friday 27 Nov normal hours',
      note:'Original smoked-fish counter near Katz’s. Visit earlier in the day; this is the shop, not the seated Orchard Street café.'},
    {id:'joes',name:"Joe's Pizza · NYC slice",aliases:["joe's pizza",'joes pizza','joe s pizza'],must:true,
      venue:"Joe's Pizza · Greenwich Village",area:'Greenwich Village',address:'7 Carmine St, New York, NY 10014, USA',
      hours:'Reported daily 10:00–03:00 (+1); verify before visiting',regular:'10:00–03:00 (+1)',
      website:'https://www.joespizzanyc.com/locations',source:'Official branch location; hours from current ordering directory',days:['tue'],minutes:20,
      holiday:'Thanksgiving hours not independently confirmed',
      note:'Perfect quick slice before the Tuesday Blue Note evening; no need for a separate neighbourhood transfer.'},
    {id:'lindustrie',name:"L'Industrie Pizzeria · burrata slice",aliases:["l'industrie",'industrie'],must:true,
      venue:"L'Industrie Pizzeria · West Village",area:'West Village',address:'104 Christopher St, New York, NY 10014, USA',
      hours:'Reported daily 12:00–22:00; verify day-of',regular:'12:00–22:00',
      website:'https://www.lindustriebk.com/hours-and-location',source:'Local business listings; official site for day-of verification',days:['tue','wed'],minutes:30,
      holiday:'Thanksgiving hours not verified',
      note:"Burrata slice. Pair with the West Village walk or use as an alternative to Joe's Pizza, not an obligatory second meal."},
    {id:'lostacos',name:'Los Tacos No. 1 · adobada',aliases:['los tacos'],must:false,
      venue:'Los Tacos No. 1 · Times Square',area:'Theater District',address:'229 W 43rd St, New York, NY 10036, USA',
      hours:'Mon–Sat 11:00–00:00; Sun 11:00–22:00',regular:'11:00–00:00',
      website:'https://www.lostacos1.com/locations/',source:'Official Los Tacos No. 1 locations',days:['mon','fri'],minutes:25,
      holiday:'Thanksgiving opening not confirmed',
      note:'Near the hotel: an easy quick meal. Avoid planning a special detour to Chelsea just to eat tacos.'},
    {id:'lobster',name:'Lobster Place · lobster roll',aliases:['lobster place'],must:false,
      venue:'Lobster Place · Chelsea Market',area:'Chelsea / Meatpacking',address:'75 9th Ave, New York, NY 10011, USA',
      hours:'Dining counter daily 11:00–21:00; seafood market to 20:00',regular:'11:00–21:00',
      website:'https://www.lobsterplace.com/location/lobster-place/',source:'Official Lobster Place hours and FAQ',days:['tue','wed'],minutes:35,
      holiday:'CLOSED Thanksgiving Day 26 Nov (official FAQ)',
      note:'Excellent Chelsea gallery / High Line lunch. No reservations; most dining is counter-style and seating is limited.'},
    {id:'aquaboil',name:'Aqua Boil · Lemon Pepper seafood',aliases:['aqua boil'],must:false,
      venue:'Aqua Boil · Hell’s Kitchen',area:"Hell's Kitchen",address:'750 9th Ave, New York, NY 10019, USA',
      hours:'Mon–Thu 12:00–22:00; Fri 12:00–23:00; weekday kitchen break 14:45–16:00',regular:'12:00–22:00',
      friday:'12:00–23:00',website:'https://www.aquaboilnyc.com/contact',source:'Official Aqua Boil hours & location',days:['mon','wed'],minutes:70,
      holiday:'Thanksgiving hours not confirmed',
      note:'A proper seafood boil requires a seated meal; choose it instead of another dinner. Last seating 30 min before closing.'},
    {id:'mables',name:"Mable's Smokehouse · brisket & ribs",aliases:['mable'],must:false,
      venue:"Mable's Smokehouse · Williamsburg",area:'Williamsburg',address:'44 Berry St, Brooklyn, NY 11249, USA',
      hours:'Sun–Thu 12:00–21:00; Fri–Sat 12:00–22:00',regular:'12:00–21:00',
      friday:'12:00–22:00',website:'https://mablessmokehouse.com/',source:'Official Mable’s Smokehouse site',days:['wed'],minutes:60,
      holiday:'Thanksgiving hours not verified',
      note:'Only sensible on a chosen Williamsburg afternoon; replace another evening meal, not an extra Brooklyn crossing.'},
    {id:'levain',name:'Levain Bakery · chocolate chip cookie',aliases:['levain'],must:false,
      venue:'Levain Bakery · Marriott Marquis pop-up',area:'Times Square',address:'1535 Broadway, 8th Floor, New York, NY 10036, USA',
      hours:'Levain lists 10:00–19:00 daily; hotel lists 10:00–17:00. Safest planned visit: 10:00–17:00',
      regular:'10:00–17:00',website:'https://levainbakery.com/pages/the-nook-by-levain',source:'Official Levain pop-up and Marriott venue listings',days:['mon','fri'],minutes:15,
      holiday:'Thanksgiving service and opening time require confirmation',
      note:'Excellent near-hotel cookie and gift-tin stop. Two official sources disagree on closing time; aim before 17:00.'},
    {id:'magnolia',name:'Magnolia Bakery · banana pudding',aliases:['magnolia'],must:false,
      venue:'Magnolia Bakery · Rockefeller Center',area:'Rockefeller Center',address:'1240 Avenue of the Americas, New York, NY 10020, USA',
      hours:'Magnolia lists Sun–Thu 08:00–23:00, Fri–Sat 08:00–00:00; Rockefeller Center lists 09:00–21:00',
      regular:'09:00–21:00',website:'https://www.magnoliabakery.com/blogs/stores/rockefeller-center',source:'Official Magnolia Bakery and Rockefeller Center listings',days:['mon','fri'],minutes:15,
      holiday:'Thanksgiving hours not confirmed; two official sources list different regular closing times',
      note:'Quick banana-pudding stop while walking Fifth Avenue / Rockefeller Center, not a stand-alone outing.'}
  ];
  function normal(s){
    return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function contains(title,alias){
    return (' '+normal(title)+' ').includes(' '+normal(alias)+' ');
  }
  function install(){
    const data=window.NYC_DATA;
    if(!data||!Array.isArray(data.WISHES))return {ready:false,added:0,existing:0};
    let added=0,existing=0;
    for(const pick of picks){
      const found=data.WISHES.some(row=>Array.isArray(row)&&pick.aliases.some(a=>contains(row[0],a)));
      if(found){existing++;continue}
      data.WISHES.push([pick.name,'food','',pick.must?'core':'choice']);
      added++;
    }
    return {ready:true,added,existing,total:picks.length};
  }
  // The React Wishlist keeps its original four-field format. A companion
  // read-only guide uses this verified metadata without touching React nodes.
  function catalogue(){return picks.map(p=>({...p,days:p.days.slice()}))}
  function find(title){
    const row=picks.find(p=>p.aliases.some(a=>contains(title,a)));
    return row?{...row,days:row.days.slice()}:null;
  }
  window.NOUX_FOOD_WISHLIST={install,count:picks.length,catalogue,find,version:'2026-11-21-details'};
})();