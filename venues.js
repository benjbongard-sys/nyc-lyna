/* NOUX curated place resolver.
   Runs after the private itinerary has been decrypted. Public catalogue only:
   no private booking details, hotel identity, trip dates or passphrase. */
(function(){
 'use strict';
 if(window.NOUX_VENUES)return;
 var installed=false,BASE=null,DATA=null,PLAN=null;
 const loc=(name,address,lat,lng,kind,url,area)=>({name,address,lat,lng,kind,url,area});
 const P={
   losTacosTimes:loc('Los Tacos No. 1 · Times Square','229 W 43rd St, New York, NY 10036, USA',40.7576,-73.9878,'food','https://www.lostacos1.com/location/los-tacos-times-square/','Theatre District'),
   losTacosChelsea:loc('Los Tacos No. 1 · Chelsea Market','75 9th Ave, New York, NY 10011, USA',40.7422,-74.0061,'food','https://www.lostacos1.com/locations/','Chelsea'),
   modernBar:loc('The Bar Room at The Modern','9 W 53rd St, New York, NY 10019, USA',40.7615,-73.9775,'restaurant','https://www.themodernnyc.com/reservations-11/','Midtown'),
   osteriaDoge:loc('Osteria al Doge','142 W 44th St, New York, NY 10036, USA',40.7565,-73.9851,'restaurant','https://www.osteriaaldoge.net/','Theatre District'),
   zaytinya:loc('Zaytinya · NoMad','1185 Broadway, New York, NY 10001, USA',40.7457,-73.9884,'restaurant','https://www.zaytinya.com/location/new-york/','NoMad'),
   hudsonYards:loc('Hudson Yards public square · Vessel exterior','20 Hudson Yards, New York, NY 10001, USA',40.7538,-74.0018,'sight','https://www.hudsonyardsnewyork.com/','Hudson Yards'),
   zabars:loc("Zabar's Café",'2245 Broadway, New York, NY 10024, USA',40.7843,-73.9784,'breakfast','https://www.zabars.com/zabars-cafe-pickup.html','Upper West Side'),
   dailyProvisions:loc('Daily Provisions · Upper West Side','375 Amsterdam Ave, New York, NY 10024, USA',40.7800,-73.9800,'food','https://www.dailyprovisions.co/location/daily-provisions-upper-west-side/','Upper West Side'),
   santAmbroeus:loc('Sant Ambroeus Madison','1000 Madison Ave, New York, NY 10075, USA',40.7752,-73.9617,'restaurant','https://www.santambroeus.com/en-eu/pages/locations','Upper East Side'),
   viaQuadronno:loc('Via Quadronno · Upper East Side','25 E 73rd St, New York, NY 10021, USA',40.7716,-73.9645,'restaurant','https://www.viaquadronno.com/contact','Upper East Side'),
   cultureEspresso:loc('Culture Espresso · Bryant Park','72 W 38th St, New York, NY 10018, USA',40.7519,-73.9854,'coffee','https://www.cultureespresso.com/locations-feed','Bryant Park'),
   nines:loc('The Nines · piano supper club','9 Great Jones St, New York, NY 10012, USA',40.7267,-73.9929,'restaurant','https://www.ninesnyc.com/welcome','NoHo'),
   luhring:loc('Luhring Augustine · Jason Moran: STACKS','531 W 24th St, New York, NY 10011, USA',40.7490,-74.0058,'gallery','https://www.luhringaugustine.com/','Chelsea'),
   pace:loc('Pace Gallery · Li Hei Di / Lucas Samaras','540 W 25th St, New York, NY 10001, USA',40.7497,-74.0055,'gallery','https://www.pacegallery.com/galleries/new-york/','Chelsea'),
   awoke:loc('Awoke Vintage · Williamsburg','132 N 5th St, Brooklyn, NY 11249, USA',40.71678,-73.95919,'vintage','https://www.awokevintage.com/pages/visit-us','Williamsburg'),
   stella:loc('10 ft Single by Stella Dallas','285 N 6th St, Brooklyn, NY 11211, USA',40.71453,-73.95414,'vintage','https://theshopkeepers.com/shops/10-ft-single-by-stella-dallas/brooklyn-store/','Williamsburg'),
   maisonPremiere:loc('Maison Premiere · oysters and cocktails','298 Bedford Ave, Brooklyn, NY 11249, USA',40.7142,-73.9610,'restaurant','https://maisonpremiere.com/','Williamsburg'),
   littleIsland:loc('Little Island · Pier 55','Pier 55 at Hudson River Park, New York, NY 10014, USA',40.7414,-74.0102,'sight','https://littleisland.org/','Meatpacking'),
   standardGrill:loc('The Standard Grill','848 Washington St, New York, NY 10014, USA',40.7403,-74.0082,'restaurant','https://www.standardhotels.com/new-york/happenings/thanksgiving-TSG-2026','Meatpacking'),
   leuca:loc('Leuca · The William Vale','111 N 12th St, Brooklyn, NY 11249, USA',40.7222,-73.9597,'restaurant','https://www.leuca.com/thanksgiving/','Williamsburg'),
   smithNoMad:loc('The Smith · NoMad','1150 Broadway, New York, NY 10001, USA',40.7442,-73.9891,'restaurant','https://thesmithrestaurant.com/location/nomad/','NoMad'),
   cecconi:loc("Cecconi's DUMBO",'55 Water St, Brooklyn, NY 11201, USA',40.7038,-73.9903,'restaurant','https://www.cecconisrestaurants.com/dumbo/','DUMBO'),
   oculus:loc('World Trade Center Oculus','50 Church St, New York, NY 10007, USA',40.7115,-74.0115,'sight','https://wtcprod.panynj.gov/en/local/learn-about-wtc/oculus-transportation-hub.html','World Trade Center'),
   seaport:loc('South Street Seaport · Pier 17','89 South St, New York, NY 10038, USA',40.7065,-74.0010,'waterfront','https://www.pier17ny.com/','Seaport'),
   battery:loc('The Battery · waterfront promenade','Battery Place, New York, NY 10004, USA',40.7041,-74.0161,'park','https://www.thebattery.org/','Lower Manhattan'),
   meatpacking:loc('Meatpacking District · Gansevoort Plaza','Gansevoort St & Washington St, New York, NY 10014, USA',40.7397,-74.0082,'walk','https://www.meatpacking-district.com/','Meatpacking'),
   friedmans:loc("Friedman's · Edison Hotel",'228 W 47th St, New York, NY 10036, USA',40.7597,-73.9858,'breakfast','https://www.friedmansrestaurant.com/location/edison/','Times Square'),
   urbanCove:loc('Urban Cove · Seaport','33 Peck Slip, New York, NY 10038, USA',40.7079,-74.0009,'restaurant','https://www.urbancoveseaport.com/','Seaport'),
   westVillage:loc('West Village · Christopher and Bleecker Streets','Christopher St & 7th Ave S, New York, NY 10014, USA',40.7338,-74.0029,'walk','https://www.nyctourism.com/neighborhoods/west-village/','West Village'),
   stPatrick:loc("St. Patrick's Cathedral · Fifth Avenue",'5th Ave & E 50th St, New York, NY 10022, USA',40.7586,-73.9759,'sight','https://saintpatrickscathedral.org/','Midtown'),
   brooklynHeights:loc('Brooklyn Heights Promenade','Montague St & Columbia Heights, Brooklyn, NY 11201, USA',40.6956,-73.9961,'walk','https://www.nycgovparks.org/parks/brooklyn-heights-promenade','Brooklyn Heights')
 };
 // Public venue metadata only; nothing below confirms a booking.
 P.kru=loc('KRU · Thai Thanksgiving','190 N 14th St, Brooklyn, NY 11249, USA',40.7228,-73.9586,'restaurant','https://www.krubrooklyn.com/','Williamsburg');
 P.pier57roof=loc('Pier 57 Rooftop Park','25 11th Ave, New York, NY 10011, USA',40.7432,-74.0105,'park','https://pier57nyc.com/rooftop/','Chelsea');
 const OPTIONS={
  c1:{title:'Monday · Which first-night dinner and skyline?',desc:'A named dinner venue for every option, followed by your chosen first-night view.',options:{
   rest:["The Bar Room at The Modern · dinner & Rockefeller Center","Contemporary à-la-carte dining near MoMA, then an illuminated Midtown walk. Table to book."],
   stcloud:["Osteria al Doge → St. Cloud rooftop","Venetian dinner on West 44th Street, then cocktails at The Knickerbocker."],
   nubeluz:["Zaytinya → Nubeluz at The Ritz-Carlton","José Andrés mezze on Broadway, then rooftop cocktails in the same hotel."]
  }},
  c2:{title:'Tuesday · Which named evening venue?',desc:'The selected music venue remains separate from any meal and its booking.',options:{
   rest:["The Nines · supper club & live piano","9 Great Jones Street; dinner, cocktails and a refined piano-bar atmosphere. Book independently."]
  }},
  c3:{title:'Wednesday · Which Brooklyn night?',desc:'Clubs and rooftop experiences are distinct. None is automatically reserved.',options:{
   rest:["The Nines · piano, dinner & cocktails","An actual NoHo supper club at 9 Great Jones Street, not a hotel recovery slot."]
  }},
  c4:{title:'Thanksgiving · where are we dancing?',desc:'Named Thanksgiving dinner venues are matched to the selected evening location.',options:{
   lebain:["Le Bain · Thanksgiving DJ night · 22:00","Le Bain officially advertises City Kids Thanksgiving on 26 Nov; Resident Advisor lists Nadine Regne and Kristine Barilli for the same date. Confirm the lineup. Dancefloor and views; rooftop terrace weather-dependent. No guaranteed entry."],
   rest:["The Standard Grill → Meatpacking night walk","A published Thanksgiving dinner, then Gansevoort Plaza and the neighbourhood."]
  }},
  c5:{title:'Thanksgiving · choose a specific daytime route',desc:'Each option now names actual accessible stops; holiday opening hours remain important.',options:{
   rest:["Oculus → South Street Seaport → The Battery","An active downtown walking route, not an unplanned hotel day."],
   highline:["High Line → Los Tacos / Chelsea Market → Edge","Chelsea Market is open on Thanksgiving; vendor hours must be checked."],
   mercer:["Mercer Labs → Cecconi’s DUMBO → Brooklyn Bridge Park","Named restaurant at 55 Water Street; confirm holiday service."]
  }},
  c6:{title:'Tuesday · butterflies, Guggenheim or named galleries?',desc:'Chelsea option highlights Jason Moran: STACKS and Pace Gallery, not generic exhibitions.',options:{
   chelsea:["Luhring Augustine (Jason Moran) → Pace Gallery","Two named Chelsea galleries, both operating on Tuesday of Thanksgiving week."]
  }},
  c7:{title:'Thursday · choose the Thanksgiving table',desc:'Every evening route receives a specific restaurant; River Café is an optional splurge.',options:{
   standard:["The Standard Grill / Leuca / KRU / The Smith","Thanksgiving dinner is linked to the dancefloor choice: Meatpacking, Williamsburg or NoMad. No reservation yet."],
   river:["The River Café · Thanksgiving menu ($255 pp)","Official holiday menu published; table and transport must still be arranged."]
  }},
  c8:{title:'Friday · a real last stop before the transfer',desc:'Nothing pre-paid without a confirmed airport pickup time.',options:{
   rest:["Culture Espresso → Bryant Park","72 West 38th Street and Bryant Park, then return for the airport transfer."],
   rockefeller:["Rockefeller Center → Rough Trade Below","Two named nearby stops before retrieving the bags."]
  }}
 };
 function clone(o){return Object.assign({},o)}
 function assign(e,place,title,detail,kind,status){
  const v=clone(e);v.place=place;v.title=title;v.detail=detail;
  if(kind)v.kind=kind;if(status)v.status=status;
  return v;
 }
 function minutes(s){const a=String(s||'').split(':');return +a[0]*60+(+a[1]||0)}
 function sortEvents(x){return x.sort((a,b)=>minutes(a.start)-minutes(b.start))}
 function breakfast(day,e,c){
  if(day==='mon')return e;
  if(day==='tue'){
   if(c.c6==='chelsea')return assign(e,'cultureEspresso','Culture Espresso · quick coffee & breakfast','72 West 38th Street. Coffee and a pastry near Bryant Park before the Chelsea galleries.','food','proposed');
   if(c.c6==='guggenheim')return assign(e,'santAmbroeus','Sant Ambroeus Madison · café breakfast','1000 Madison Avenue. UES breakfast before Guggenheim; leave time to reach the museum.','food','proposed');
   return assign(e,'zabars',"Zabar's Café · bagel and smoked fish",'2245 Broadway at West 80th Street. Classic NYC deli near the Butterfly Vivarium; café open from 08:00.','food','proposed');
  }
  if(day==='wed')return assign(e,'cultureEspresso','Culture Espresso · Bryant Park breakfast','72 West 38th Street. Coffee and a cookie before the two Fifth Avenue libraries.','food','proposed');
  return e;
 }
 function fix(day,e,c){
  if(['booked','confirmed'].includes(e.status))return [e];
  // Make the optimiser's flexible walks navigable and specific too.
  if(/^explore_walk_/.test(e.id)){
   if(e.place==='edge')return [assign(e,'hudsonYards','Hudson Yards plaza · Vessel exterior','Walk through the Hudson Yards public square for architecture and views.','walk','proposed')];
   if(e.place==='littleisland'&&minutes(e.start)<20*60)
      return [assign(e,'pier57roof','Pier 57 Rooftop Park · Hudson panorama','25 11th Avenue, close to Little Island. Public rooftop usually open daily 06:00–01:00; check weather.','walk','proposed')];
    if(e.place==='lebain'||e.place==='littleisland'||e.place==='meatpacking'){
    if(minutes(e.start)<20*60)return [assign(e,'meatpacking','Gansevoort Plaza · Meatpacking streets','Explore Gansevoort Plaza and historic cobblestones beside the Standard Grill.','walk','proposed')];
    return [assign(e,'westVillage','West Village · Christopher Street and Bleecker','A named evening route along Christopher and Bleecker Streets after dinner.','walk','proposed')];
   }
   if(e.place==='dumbo'){
    const v=assign(e,'brooklynHeights','Brooklyn Heights Promenade · Manhattan panorama','Columbia Heights at Montague Street; uninterrupted skyline and bridge views.','walk','proposed');
    v.start='16:15';v.end='16:55';return [v];
   }
   if(e.place==='roughtrade'||e.place==='rockefeller')return [assign(e,'rockefeller','Rockefeller Center · Channel Gardens','Architecture and window displays around Rockefeller Plaza, not a hotel break.','walk','proposed')];
   if(e.place==='domino'||e.place==='thrift')return [assign(e,'domino','Domino Park · East River promenade','Waterfront skyline and the public Domino Park paths in Williamsburg.','walk','proposed')];
   if(e.place==='pier')return [assign(e,'hudsonYards','Hudson Yards waterfront corridor','Continue along the public waterfront toward Hudson Yards; adapt to the confirmed cruise terminal.','walk','proposed')];
   const base=DATA.P[e.place];
   return [assign(e,e.place,(base&&base.name?base.name+' · short exploration':'Neighbourhood stop'), 'Explore the immediately surrounding streets of this named stop, adjusting to local opening hours.','walk','proposed')];
  }
  if(day==='mon'){
   if(e.id==='lunch')return [assign(e,'losTacosTimes','Los Tacos No. 1 · Times Square lunch','229 West 43rd Street. Fast tacos before the cruise transfer; skip if airport or traffic delays threaten boarding.','food','proposed')];
   if(e.id==='reset'){
    let v=assign(e,'hudsonYards','Hudson Yards · Vessel exterior and public square','Walk from the waterfront toward Hudson Yards (subject to the actual cruise pier); photographs and illuminated architecture, not hotel downtime.','walk','proposed');
    v.start='18:05';v.end=c.c1==='nubeluz'?'18:40':'18:55';return [v];
   }
   if(e.id==='dinner'){
    if(c.c1==='stcloud')return [assign(e,'osteriaDoge','Osteria al Doge · Venetian dinner','142 West 44th Street; warm Italian dinner before St. Cloud. Check seating directly with the venue; no reservation has been made.','food','proposed')];
    if(c.c1==='nubeluz')return [assign(e,'zaytinya','Zaytinya · José Andrés mezze dinner','1185 Broadway, in The Ritz-Carlton NoMad; shared Mediterranean plates downstairs from Nubeluz. Reservation not yet made.','food','proposed')];
    return [assign(e,'modernBar','The Bar Room at The Modern · first-night dinner','9 West 53rd Street. Contemporary seasonal à-la-carte dining; the restaurant accepts reservations and walk-ins. Check seating for Monday; nothing is booked.','food','proposed')];
   }
   if(e.id==='sleep')return [assign(e,'rockefeller','Rockefeller Center · Fifth Avenue night walk','Explore Rockefeller Plaza and the shopfronts on Fifth Avenue. The Christmas tree lighting is not assumed to have happened.','walk','proposed')];
  }
  if(day==='tue'){
   if(e.id==='explore_tue_moma')return [assign(e,'moma','MoMA · Nilima Sheikh, The Surrealist Book & Brancusi','11 West 53rd Street. A focused highlights visit; verify exhibition access and museum entry before going.','museum','ticket-to-check')];
   if(e.id==='breakfast')return [breakfast(day,e,c)];
   if(e.id==='museum'&&c.c6==='chelsea'){
    const one=assign(e,'luhring','Luhring Augustine · Jason Moran: STACKS','531 West 24th Street; exhibition runs into December. Jazz, performance and contemporary art, Tuesday opening 10:00.','art','proposed');
    one.end='11:13';
    const two=assign(e,'pace','Pace Gallery · Li Hei Di and Lucas Samaras','540 West 25th Street; two exhibitions currently on view, Tuesday opening 10:00.','art','proposed');
    two.id='museum_pace';two.start='11:24';return [one,two];
   }
   if(e.id==='lunch'){
    if(c.c6==='chelsea')return [assign(e,'losTacosChelsea','Los Tacos No. 1 · Chelsea Market','75 Ninth Avenue, inside Chelsea Market. Quick tacos between galleries and the High Line.','food','proposed')];
    if(c.c6==='guggenheim')return [assign(e,'viaQuadronno','Via Quadronno · Italian café lunch','25 East 73rd Street near Central Park. Compact Italian café lunch with panini and pasta; Tuesday service confirmed, seating is walk-in for lunch.','food','proposed')];
    return [assign(e,'dailyProvisions','Daily Provisions · Upper West Side lunch','375 Amsterdam Avenue at West 78th; made-to-order sandwiches or salads near the museum.','food','proposed')];
   }
   if(e.id==='reset'){
    const one=assign(e,'moma','MoMA · focused late-afternoon highlights','11 West 53rd Street. Allow a focused museum visit before its normal closing time, not a hotel pause.','museum','ticket-to-check');
    one.start=c.c6==='chelsea'?'16:25':'16:10';one.end='17:23';
    const two=assign(e,'rockefeller','Rockefeller Center · Fifth Avenue architecture','Rockefeller Plaza and Fifth Avenue on foot, between MoMA and the evening programme.','walk','proposed');
    two.id='reset_plaza';two.start='17:34';two.end='18:15';return [one,two];
   }
   if(e.id==='music'&&c.c2==='rest')return [assign(e,'nines','The Nines · dinner, live piano and cocktails','9 Great Jones Street, NoHo. An elegant supper club with food and live piano, not a vague free evening. Reservations and possible cover to check.','food','proposed')];
  }
  if(day==='wed'){
   if(e.id==='explore_wed_bamharvey')return [assign(e,'bamharvey','BAM · La Distance · 19:30 performance','651 Fulton Street in Fort Greene, Brooklyn. The performance is advertised; ticket not purchased.','theatre','ticket-to-check')];
   if(e.id==='late')return [breakfast(day,e,c)];
   if(e.id==='vintage'){
    const a=assign(e,'awoke','Awoke Vintage · 132 North 5th Street','Named Williamsburg thrift stop; the shop lists daily opening 10:00–21:00.','shopping','proposed');
    a.end='15:06';
    const b=assign(e,'stella','10 ft Single by Stella Dallas · North 6th','285 North 6th Street; curated American vintage and adjacent Stella Dallas Living.','shopping','proposed');
    b.id='vintage_stella';b.start='15:17';b.end='16:02';return [a,b];
   }
   if(e.id==='hotel'){
    const a=assign(e,'maisonPremiere','Maison Premiere · oysters and cocktails','298 Bedford Avenue; real oyster bar with dinner service. Reservation recommended, especially for the dining room.','food','proposed');
    a.end='19:25';
    const b=assign(e,c.c3==='rest'?'domino':'westlight',c.c3==='rest'?'Domino Park · skyline from the waterfront':'Westlight · Williamsburg skyline cocktails',
      c.c3==='rest'?'Return to the Domino Park waterfront for skyline views before the piano bar.':'111 North 12th Street; rooftop cocktails and Manhattan views. Thanksgiving-week seating and weather to check.','cocktail','proposed');
    b.id='hotel_view';b.start='19:40';b.end='20:40';return [a,b];
   }
   if(e.id==='night'&&c.c3==='rest'){const v=assign(e,'nines','The Nines · late piano bar in NoHo','9 Great Jones Street; a refined, atmospheric alternative to clubbing. Confirm the Wednesday piano programme.','music','proposed');v.start='21:30';return [v];}
  }
  if(day==='thu'){
   if(e.id==='night'&&c.c4==='lebain'){
    const v=assign(e,'lebain','Le Bain · Thanksgiving house/disco night','26 November, doors 22:00. The venue names City Kids Thanksgiving; Resident Advisor currently lists Nadine Regne and Kristine Barilli for this date. Confirm the final billing. No general cover advertised by venue, but admission is subject to capacity/door policy. Dancefloor is indoors; outdoor skyline terrace access is weather-dependent.','club','proposed');
    v.start='22:00';v.end='00:45';return [v];
   }
   if(e.id==='slow')return [assign(e,'friedmans',"Friedman's Edison · Thanksgiving brunch",'228 West 47th Street. An actual breakfast venue; only use this slot when it does not conflict with the Macy’s parade. Holiday service unconfirmed.','food','hours-to-check')];
   if(e.id==='open'&&c.c5==='rest'){
    let v=assign(e,'oculus','World Trade Center Oculus · architecture walk','50 Church Street. Visit the Calatrava station, Memorial Plaza exteriors and surrounding architecture. Retail holiday hours may vary.','walk','proposed');
    v.end='13:20';return [v];
   }
   if(e.id==='chill'&&c.c5==='rest'){
    let v=assign(e,'seaport','South Street Seaport · Pier 17 waterfront','89 South Street. East River promenade and views of the Brooklyn Bridge, not an unspecified break.','walk','proposed');
    v.start='14:35';return [v];
   }
   if(e.id==='lunch'){
    if(c.c5==='mercer')return [assign(e,'cecconi',"Cecconi's DUMBO · waterfront lunch",'55 Water Street, Brooklyn. Named Italian restaurant at the next walking destination; verify Thanksgiving opening and table.','food','hours-to-check')];
    if(c.c5==='highline')return [assign(e,'losTacosChelsea','Los Tacos No. 1 · Chelsea Market lunch','Chelsea Market is open on Thanksgiving 07:00–22:00, but vendors set their own holiday hours. Los Tacos service is NOT confirmed for this date.','food','hours-to-check')];
   }
   if(e.id==='reset'){
    const v=c.c5==='mercer'
      ?assign(e,'dumbo','Brooklyn Heights Promenade · DUMBO afternoon','Brooklyn waterfront views and cobbled streets before the evening transfer.','walk','proposed')
      :c.c5==='rest'
      ?assign(e,'battery','The Battery · harbour promenade','Lower Manhattan waterfront and harbour views; holiday shops may be closed, outdoor paths remain the focus.','walk','proposed')
      :assign(e,'littleIsland','Little Island · Pier 55 riverside stroll','Free public riverfront park, winter opening and weather conditions to verify.','walk','proposed');
    if(c.c5==='rest'){v.start='16:25';v.end='17:30'}if(c.c4==='boogie')v.end='17:05';return [v];
   }
   if(e.id==='dinner'){
    if(c.c7==='river')return [assign(e,'river','The River Café · Thanksgiving prix fixe ($255 pp)','1 Water Street, Brooklyn. Official Thanksgiving 2026 menu published, 13:00–20:00 service; jacket and collared shirt required. Reservation not made.','dinner','proposed')];
    if(c.c4==='morales')return [assign(e,'kru','KRU · Thai Thanksgiving dinner ($55 pp)','190 North 14th Street, Williamsburg. Published $55 Thanksgiving offering 17:30–21:30. Reserve before visiting Refuge.','dinner','hours-to-check')];
    if(c.c4==='westmorales')return [assign(e,'leuca','Leuca · Thanksgiving dinner at The William Vale','111 North 12th Street, Williamsburg. Published Thanksgiving menu; easy pairing with Westlight and later Refuge. Reserve separately.','dinner','hours-to-check')];
    if(c.c4==='boogie'){
     const v=assign(e,'smithNoMad','The Smith NoMad · Thanksgiving dinner ($88 pp)','1150 Broadway at 27th Street. Published three-course Thanksgiving menu, near 230 Fifth. Reservation not made.','dinner','proposed');
     v.start='17:20';return [v];
    }
    return [assign(e,'standardGrill','The Standard Grill · Thanksgiving dinner ($125 pp)','848 Washington Street, Meatpacking. Official three-course holiday menu; near Le Bain. Book a table before assuming this plan is secured.','dinner','proposed')];
   }
   if(e.id==='night'&&c.c4==='rest')return [assign(e,'westVillage','West Village · Bleecker Street evening walk','Explore Christopher Street and the West Village after Thanksgiving dinner, not the hotel.','walk','proposed')];
  }
  if(day==='fri'){
   if(e.id==='breakfast'){
    const hotel=DATA.P.sanctuary?'sanctuary':DATA.P.hotel?'hotel':e.place;
    const v=assign(e,hotel,'Hotel breakfast · buffet available 07:00–10:00','Breakfast is included and available each day from 07:00 to 10:00. Suggested 09:00–09:35 on departure day, leaving time for checkout and sightseeing.','food','proposed');
    v.start='09:00';v.end='09:35';return [v];
   }
   if(e.id==='walk'&&c.c8==='rest')return [assign(e,'cultureEspresso','Culture Espresso → Bryant Park','72 West 38th Street. Coffee and the park, then collect bags before the transfer.','walk','proposed')];
   if(e.id==='walk'&&c.c8==='rockefeller'){
    const a=assign(e,'rockefeller','Rockefeller Center · the plaza and Channel Gardens','Classic Midtown plaza before leaving; no timed observatory ticket without confirmed airport pickup.','walk','proposed');
    a.end='11:04';
    const alreadyVinyl=!!(window.NOUX_EXPLORER&&window.NOUX_EXPLORER.mode()==='full');
    const b=alreadyVinyl
      ?assign(e,'stPatrick',"St. Patrick's Cathedral · Fifth Avenue",'Fifth Avenue cathedral exterior and quick look at the architecture before collecting luggage.','culture','proposed')
      :assign(e,'roughtrade','Rough Trade Below · final vinyl browse','Concourse level at Rockefeller Center; check shop opening and allow time to retrieve hotel luggage.','shopping','proposed');
    b.id=alreadyVinyl?'walk_cathedral':'walk_roughtrade';b.start='11:10';return [a,b];
   }
   if(e.id==='pickup'){
    const v=clone(e);v.title='Return for airport transfer · pickup time to confirm';
    v.detail='The transfer operator has not confirmed the collection time. Be back at the hotel with luggage ready; adjust this provisional window once confirmed.';
    return [v];
   }
  }
  return [e];
 }
 function install(){
  if(installed)return true;
  DATA=window.NYC_DATA;PLAN=window.NYC_PLAN;
  if(!DATA||!PLAN||!DATA.P||typeof PLAN.day!=='function')return false;
  Object.keys(P).forEach(k=>{if(!DATA.P[k])DATA.P[k]=P[k]});
  (DATA.CHOICES||[]).forEach(c=>{
   const patch=OPTIONS[c.id];if(!patch)return;
   c.title=patch.title;c.desc=patch.desc;
   (c.options||[]).forEach(o=>{const v=patch.options[o[0]];if(v){o[1]=v[0];o[2]=v[1]}});
  });
  BASE=PLAN.day.bind(PLAN);
  PLAN.day=function(day,choices){
   const orig=BASE(day,choices);
   if(!Array.isArray(orig))return orig;
   try{
    const ch=Object.assign({},DATA.DEFAULT||{},choices||{});
    const out=[];
    orig.forEach(e=>{fix(day,e,ch).forEach(x=>out.push(x))});
    // The day-option originally called "free day" must stay fully planned in either pace.
    if(day==='mon'&&ch.c1==='rest'&&!out.some(e=>e.id==='sleep')){
     const event={id:'named_mon_rockefeller',start:'20:50',end:'21:35',place:'rockefeller',
       title:'Rockefeller Center · illuminated Fifth Avenue walk',
       detail:'Rockefeller Plaza, Channel Gardens and Fifth Avenue displays. A named outdoor walk, no ticket needed.',
       kind:'walk',status:'proposed'};
     if(out.every(e=>minutes(event.start)>=minutes(e.end)||minutes(event.end)<=minutes(e.start)))out.push(event);
    }
    if(day==='thu'&&ch.c5==='rest'){
     const kept=out.filter(e=>!(e.id||'').startsWith('explore_thu_littleisland')&&!(e.id||'').startsWith('explore_walk_thu_'));
     out.length=0;kept.forEach(e=>out.push(e));
     const add=(id,start,end,place,title,detail,kind)=>{
      if(!out.some(e=>e.id===id))out.push({id,start,end,place,title,detail,kind,status:'proposed'});
     };
     if(!out.some(e=>e.id==='open'))add('urban_oculus','12:30','13:20','oculus','World Trade Center Oculus · architecture','50 Church Street. Calatrava architecture and exterior Memorial Plaza.','walk');
     add('urban_lunch','13:45','14:25','urbanCove','Urban Cove · Thanksgiving-week lunch','33 Peck Slip. Seasonal Thanksgiving specials published for this week; book or confirm walk-in.','food');
     if(!out.some(e=>e.id==='chill'))add('urban_pier17','14:35','15:35','seaport','South Street Seaport and Pier 17','89 South Street. East River promenade and Brooklyn Bridge views.','walk');
     if(!out.some(e=>e.id==='reset'))add('urban_battery','15:55','16:55','battery','The Battery · harbour views','Battery Place. Waterfront walk before heading to the dinner neighbourhood.','walk');
    }
    if(day==='thu'&&ch.c4==='rest'&&!out.some(e=>e.id==='night')&&!out.some(e=>e.kind==='walk'&&e.start>='20:20')){
     out.push({id:'quiet_thu_village',start:'20:55',end:'21:35',place:'westVillage',title:'West Village · Bleecker Street night walk',detail:'Christopher Street and Bleecker Street after the Thanksgiving dinner; open-air and flexible.',kind:'walk',status:'proposed'});
    }
    // The River Café is a complete skyline dining experience; do not double-book Westlight.
    if(day==='thu'&&ch.c7==='river'&&ch.c4==='westmorales'){
     const i=out.findIndex(e=>e.id==='rooftop'&&!['booked','confirmed'].includes(e.status));
     if(i!==-1)out.splice(i,1);
    }
    // 230 Fifth + River Café cannot both begin in their original slots.
    // Offer a clearly conditional, later rooftop visit instead of showing overlapping events.
    if(day==='thu'&&ch.c7==='river'&&ch.c4==='boogie'){
     const night=out.find(e=>e.id==='night'&&!['booked','confirmed'].includes(e.status));
     if(night){night.start='21:15';night.title='230 Fifth · late rooftop visit (admission to verify)';night.detail='Proposed late arrival after dinner at The River Café. Confirm the holiday event is running and accepts admission at 21:15; its DJ programme is not guaranteed.';night.status='unverified'}
    }
    // Never show breakfast over the parade's public viewing window.
    if(day==='thu'&&out.some(e=>e.id==='centennial_parade_2026'||e.id==='centennial_parade_walk')){
     for(let i=out.length-1;i>=0;i--)if(out[i].id==='slow'&&!['booked','confirmed'].includes(out[i].status))out.splice(i,1);
    }
    // Avoid repeat walks to the same block during one evening, while keeping all dining and booked events.
    const sorted=sortEvents(out);
    // Actual bookings and fixed journey events are never removed.
    return sorted;
   }catch(_){return orig}
  };
  installed=true;return true;
 }
 window.NOUX_VENUES={install,version:'2026.11.15',catalogue:()=>Object.keys(P).length};
})();