/* NOUX Explorer. Public code only; reads the itinerary after the encrypted vault is unlocked.
   No private itinerary, personal address, passphrase or booking data is bundled here. */
(function(){
 'use strict';
 if(window.NOUX_EXPLORER)return;
 var KEY='noux_explore_pace_v1',READY=false,DATA=null,PLAN=null,baseDay=null,lastChoices=null;
 var days=['mon','tue','wed','thu','fri'];
 var labels={mon:'MON',tue:'TUE',wed:'WED',thu:'THU',fri:'FRI'};
 var catalog=[
  {id:'moma',phrases:['moma','nilima sheikh','brancusi','surrealist book'],kind:'museum',minutes:65,min:42,hours:[630,1050],days:['mon','tue','wed','fri'],weight:88},
  {id:'met',phrases:['the met','metropolitan museum','islamic art','costume art'],kind:'museum',minutes:65,min:42,hours:[600,1020],days:['tue','fri'],weight:85},
  {id:'whitney',phrases:['whitney','minnie evans'],kind:'museum',minutes:65,min:42,hours:[630,1080],days:['wed','fri'],weight:88},
  {id:'housingworks',phrases:['housing works'],kind:'culture',minutes:42,min:26,hours:[660,1140],days:['mon','tue','wed','fri'],weight:82},
  {id:'roughtrade',phrases:['rough trade'],kind:'shopping',minutes:38,min:25,hours:[600,1200],days:['mon','tue','wed','fri'],weight:72},
  {id:'topofrock',phrases:['top of the rock'],kind:'view',minutes:48,min:35,hours:[540,1260],days:['mon','tue','wed','fri'],weight:83},
  {id:'ballooninflation',phrases:['balloon inflation','macy balloons','thanksgiving balloon'],kind:'event',minutes:60,min:55,hours:[780,1080],days:['wed'],weight:75,publicEvent:true},
  {id:'bamharvey',phrases:['la distance','bam'],kind:'theatre',minutes:85,min:85,hours:[1170,1255],days:['wed'],fixed:1170,weight:98,alwaysSuggest:true},
  {id:'maisonpremiere',phrases:['maison premiere','oyster experience'],kind:'food',minutes:65,min:48,hours:[1020,1320],days:['wed'],weight:93,alwaysSuggest:true},
  {id:'joespizza',phrases:['joe s pizza','new york slice'],kind:'food',minutes:30,min:23,hours:[1020,1300],days:['tue'],weight:79,alwaysSuggest:true},
  {id:'westlight',phrases:['westlight'],kind:'cocktail',minutes:50,min:35,hours:[960,1380],days:['wed'],weight:70,alwaysSuggest:true},
  {id:'littleisland',phrases:['little island'],kind:'walk',minutes:43,min:30,hours:[960,1260],days:['thu'],weight:80,alwaysSuggest:true}
 ];
 var extraPlaces={
  moma:{name:'The Museum of Modern Art (MoMA)',area:'Midtown',address:'11 W 53rd St, New York, NY 10019, USA',lat:40.7614,lng:-73.9776,kind:'museum',url:'https://www.moma.org/visit/'},
  whitney:{name:'Whitney Museum of American Art',area:'Meatpacking District',address:'99 Gansevoort St, New York, NY 10014, USA',lat:40.7396,lng:-74.0089,kind:'museum',url:'https://whitney.org/Visit'},
  housingworks:{name:'Housing Works Bookstore',area:'SoHo',address:'126 Crosby St, New York, NY 10012, USA',lat:40.7241,lng:-73.9968,kind:'books',url:'https://www.housingworks.org/locations/bookstore-cafe'},
  roughtrade:{name:'Rough Trade Below',area:'Rockefeller Center',address:'30 Rockefeller Plaza, Concourse Level, New York, NY 10112, USA',lat:40.7588,lng:-73.9788,kind:'vinyl',url:'https://www.roughtrade.com/en-us/stores/below'},
  topofrock:{name:'Top of the Rock Observation Deck',area:'Rockefeller Center',address:'30 Rockefeller Plaza, New York, NY 10112, USA',lat:40.7592,lng:-73.9793,kind:'view',url:'https://www.topoftherocknyc.com/'},
  bamharvey:{name:'BAM Harvey Theater',area:'Fort Greene',address:'651 Fulton St, Brooklyn, NY 11217, USA',lat:40.6882,lng:-73.9781,kind:'theatre',url:'https://www.bam.org/theater/2026/la-distance'},
  ballooninflation:{name:"Macy's Balloon Inflation viewing area",area:'Upper West Side',address:'West 77th Street and Columbus Avenue, New York, NY 10024, USA',lat:40.7818,lng:-73.9764,kind:'event'},
  maisonpremiere:{name:'Maison Premiere · oysters and cocktails',area:'Williamsburg',address:'298 Bedford Ave, Brooklyn, NY, USA',lat:40.7139,lng:-73.9612,kind:'food',url:'https://maisonpremiere.com/'},
  joespizza:{name:"Joe's Pizza · classic NYC slice",area:'Greenwich Village',address:'7 Carmine St, New York, NY 10014, USA',lat:40.7301,lng:-74.0023,kind:'food',url:'https://www.joespizzanyc.com/'},
  littleisland:{name:'Little Island · Hudson River Park',area:'Meatpacking District',address:'Pier 55, Hudson River Park, New York, NY 10014, USA',lat:40.7412,lng:-74.0104,kind:'walk',url:'https://littleisland.org/rules-faq/'}
 };
 function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function includesPhrase(text,phrase){var t=' '+norm(text)+' ',p=' '+norm(phrase)+' ';return p.length>3&&t.indexOf(p)!==-1}
 function clock(n){return String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
 function minute(t){var a=String(t||'').split(':').map(Number);return a.length===2&&a.every(Number.isFinite)?a[0]*60+a[1]:NaN}
 function actualEnd(e){var end=minute(e.end),start=minute(e.start);return Number.isFinite(start)&&Number.isFinite(end)&&end<start?end+1440:end}
 function getMode(){try{return localStorage.getItem(KEY)==='original'?'original':'full'}catch(e){return 'full'}}
 function setMode(v){try{localStorage.setItem(KEY,v)}catch(e){}}
 function wishList(){return Array.isArray(DATA.WISHES)?DATA.WISHES:[]}
 function matched(c){return wishList().filter(function(w){return c.phrases.some(function(p){return includesPhrase(w[0],p)})})}
 function eventHas(e,c){var p=DATA.P[e.place]||{};var text=[e.title,p.name,e.detail].join(' ');return e.place===c.id||c.phrases.some(function(x){return includesPhrase(text,x)})}
 function km(a,b){
  if(!a||!b||!Number.isFinite(a.lat)||!Number.isFinite(b.lat)||!Number.isFinite(a.lng)||!Number.isFinite(b.lng))return 100;
  var r=Math.PI/180,dy=(b.lat-a.lat)*r,dx=(b.lng-a.lng)*r;
  return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dx/2)**2)));
 }
 function travel(a,b){
  if(!a||!b)return 12;
  if(a===b)return 0;
  var d=km(DATA.P[a],DATA.P[b]);if(d>=100)return 30;
  return Math.max(7,Math.ceil(d<0.9?6+d*15:11+d*4.1));
 }
 function isFixed(e){
  var k=String(e.kind||'').toLowerCase(),s=String(e.status||'').toLowerCase(),t=norm(e.title);
  return ['booked','confirmed','arranged'].includes(s)||['airport','flight'].includes(k)||
   (['logistics','travel'].includes(k)&&(/airport|pickup|transfer|board|check out|luggage|bag drop|jfk|cruise|flight/.test(t)))||
   /macy s thanksgiving day parade/.test(t);
 }
 function removable(e){
  if(isFixed(e))return false;
  var k=String(e.kind||'').toLowerCase(),t=norm(e.title);
  return k==='recovery'||/unstructured city time|coffee relax change|night off|free day|an easy night|a quieter evening|no rush/.test(t);
 }
 function candidates(day,used){
  return catalog.filter(function(c){
   if(!c.days.includes(day)||used.has(c.id))return false;
   if(c.publicEvent&&!wishList().some(function(w){return c.phrases.some(function(p){return includesPhrase(w[0],p)})}))return false;
   return matched(c).length>0||c.alwaysSuggest===true;
  }).map(function(c){
   var wishes=matched(c),core=wishes.some(function(w){return String(w[3])==='core'});
   var pref=wishes.some(function(w){return String(w[2])===day});
   return Object.assign({},c,{score:c.weight+(core?35:0)+(pref?20:0)});
  }).sort(function(a,b){return b.score-a.score});
 }
 function pack(day,original,globalUsed){
  if(!Array.isArray(original))return original;
  var events=original.filter(function(e){return !removable(e)}).map(function(e){return Object.assign({},e)});
  events.sort(function(a,b){return minute(a.start)-minute(b.start)});
  var used=new Set(globalUsed||[]);
  events.forEach(function(e){catalog.forEach(function(c){if(eventHas(e,c))used.add(c.id)})});
  var picks=candidates(day,used);
  var startOfDay=day==='thu'?360:day==='fri'?480:day==='mon'?600:480;
  var endOfDay=day==='fri'?780:day==='wed'?1320:day==='thu'?1320:day==='mon'?1350:1320;
  var cap=day==='fri'?2:day==='thu'?3:5;
  function sorted(){return events.slice().sort(function(a,b){return minute(a.start)-minute(b.start)})}
  function tryInsert(c){
   if(used.has(c.id))return false;
   var loc=DATA.P[c.id];if(!loc)return false;
   // Do not invent a second evening meal when the decrypted itinerary already has dinner.
   if(c.kind==='food'&&events.some(function(e){return ['food','dinner'].includes(String(e.kind))&&minute(e.start)>=990&&minute(e.start)<1260}))return false;
   var itinerary=sorted();
   var boundaries=[{start:clock(startOfDay),end:clock(startOfDay),place:null}].concat(itinerary,[{start:clock(endOfDay),end:clock(endOfDay),place:null}]);
   var best=null;
   for(var i=0;i<boundaries.length-1;i++){
    var before=boundaries[i],after=boundaries[i+1],left=Math.max(startOfDay,actualEnd(before)),right=Math.min(endOfDay,minute(after.start));
    if(!Number.isFinite(left)||!Number.isFinite(right)||right-left<c.min+12)continue;
    if(before===boundaries[0]&&after===boundaries[boundaries.length-1])continue;
    var go=before.place?travel(before.place,c.id):0,back=after.place?travel(c.id,after.place):0;
    var earliest=Math.max(left+go,c.hours[0]),latest=Math.min(right-back,c.hours[1]);
    if(c.alwaysSuggest&&c.id==='westlight'&&(go+back)>48)continue;
    if(c.fixed!==undefined){earliest=Math.max(earliest,c.fixed);latest=Math.min(latest,c.fixed+c.minutes)}
    var duration=Math.min(c.minutes,latest-earliest);
    if(duration<c.min)continue;
    var score=duration+Math.min(28,(c.score||0)/4)-go-back-(day==='fri'&&earliest>720?30:0);
    if(!best||score>best.score)best={start:earliest,end:earliest+duration,score:score};
   }
   if(!best)return false;
   var w=matched(c)[0]||[],note='Suggested extra stop from the wish list; timing and admission are not booked.';
   if(c.kind==='museum')note='Focused highlights visit. Check exhibition availability and reserve admission where required.';
   if(c.kind==='theatre')note='Performance option only. Buy tickets before treating this as confirmed.';
   if(c.id==='maisonpremiere')note='Oyster-bar experience and light dinner. Reservation and Thanksgiving-week hours are not confirmed.';
   if(c.id==='joespizza')note='Quick classic New York slice before the evening programme. Standard hours may vary.';
   if(c.id==='littleisland')note='Free riverside park; November closing time is 21:00, weather permitting.';
   if(c.publicEvent)note='Viewing arrangements and exact access hours must be verified with the organiser.';
   var status=c.kind==='museum'||c.kind==='theatre'||c.kind==='view'?'ticket-to-check':'hours-to-check';
   if(c.id==='littleisland')status='proposed';
   events.push({id:'explore_'+day+'_'+c.id,start:clock(best.start),end:clock(best.end),title:(loc.name||String(w[0]||'Extra stop'))+(matched(c).length?' · wish-list pick':' · suggested addition'),place:c.id,kind:c.kind,detail:note,status:status});
   used.add(c.id);
   return true;
  }
  // Start with high-priority wishes, then revisit those that initially had no feasible window.
  var inserted=0,remaining=picks.slice();
  for(var pass=0;pass<2&&inserted<cap;pass++){
   var next=[];
   remaining.forEach(function(c){if(inserted<cap&&tryInsert(c))inserted++;else next.push(c)});
   remaining=next;
  }
  // Add meaningful short walks only for real slack windows; never create another hotel-rest placeholder.
  var timed=sorted(),extended=[],prevEnd=startOfDay;
  for(var j=0;j<timed.length;j++){
   var e=timed[j],a=minute(e.start);
   if(j>0&&a-prevEnd>=72&&extended.filter(function(x){return x.id.indexOf('explore_walk_')===0}).length<2){
    var prior=timed[j-1],basePlace=DATA.P[prior.place]?prior.place:(DATA.P[e.place]?e.place:null);
    var base=DATA.P[basePlace]||{};
    var gapStart=Math.max(prevEnd+10,startOfDay),gapEnd=Math.min(a-15,gapStart+42);
    var title=base.area?'Explore '+base.area+' · neighbourhood discoveries':'An extra city walk';
    if(gapEnd-gapStart>=25&&basePlace&&!['airport','hotel'].includes(String(base.kind||''))){
     extended.push({id:'explore_walk_'+day+'_'+j,start:clock(gapStart),end:clock(gapEnd),title:title,place:basePlace,kind:'walk',detail:'Explore the streets and architecture around this stop. Flexible, outdoors, no booking.',status:'proposed'});
    }
   }
   extended.push(e);prevEnd=Math.max(prevEnd,actualEnd(e));
  }
  return extended.sort(function(a,b){return minute(a.start)-minute(b.start)});
 }
 function allDays(choices){var out={};days.forEach(function(d){out[d]=PLAN.day(d,choices)});return out}
 function covered(w,all){
  var t=norm(w[0]);
  return days.some(function(d){return all[d].some(function(e){
   var label=norm(e.title+' '+(DATA.P[e.place]&&DATA.P[e.place].name||''));
   if(t.length>5&&label.includes(t))return true;
   return catalog.some(function(c){return c.phrases.some(function(s){return includesPhrase(w[0],s)})&&eventHas(e,c)});
  })});
 }
 function currentChoices(){
  if(lastChoices)return Object.assign({},DATA.DEFAULT||{},lastChoices);
  try{
   var keys=Object.keys(localStorage).filter(function(k){return /^nyc_lyna_trip_v\d+$/.test(k)}).sort(function(a,b){return Number(b.split('_v').pop())-Number(a.split('_v').pop())});
   var v=keys.length?JSON.parse(localStorage.getItem(keys[0])||'{}'):{};
   return Object.assign({},DATA.DEFAULT||{},v.choices||{});
  }catch(e){return DATA.DEFAULT||{}}
 }
 function selectedDay(){
  var node=document.querySelector('.daytabs .daytab.chosen');
  if(node){var group=Array.from(node.parentElement.children).filter(function(x){return x.matches('.daytab')});return days[group.indexOf(node)]||'mon'}
  return 'mon';
 }
 function goTo(day){
  var nav=Array.from(document.querySelectorAll('.topbar .mainnav button')).find(function(x){return /daily itinerary/i.test(x.textContent)});
  if(nav)nav.click();
  setTimeout(function(){
   var tabs=Array.from(document.querySelectorAll('.daytabs .daytab'));
   var index=days.indexOf(day);if(tabs[index])tabs[index].click();
   var heading=document.querySelector('.day-view');if(heading)heading.scrollIntoView({behavior:'smooth',block:'start'});
  },45);
 }
 function rerender(){
  var tabs=Array.from(document.querySelectorAll('.daytabs .daytab'));
  var idx=tabs.findIndex(function(el){return el.classList.contains('chosen')});
  if(idx>=0&&tabs.length>1){
   var other=(idx+1)%tabs.length;tabs[other].click();
   setTimeout(function(){var now=Array.from(document.querySelectorAll('.daytabs .daytab'));if(now[idx])now[idx].click()},30);
  }
 }
 function element(tag,cls,text){
  var el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;
 }
 function press(cls,text,cb){
  var b=element('button',cls,text);b.type='button';b.addEventListener('click',cb);return b;
 }
 function mount(){
  if(!document.body||document.getElementById('noux-explorer-launch'))return;
  var open=false,trigger=press('noux-explorer-launch','✦  Explore',function(){open=!open;drawer.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)draw()});
  trigger.id='noux-explorer-launch';trigger.setAttribute('aria-controls','noux-explorer-drawer');trigger.setAttribute('aria-expanded','false');
  var drawer=element('aside','noux-explorer-drawer');drawer.id='noux-explorer-drawer';drawer.hidden=true;drawer.setAttribute('aria-label','NOUX journey explorer');
  document.body.appendChild(trigger);document.body.appendChild(drawer);
  function draw(){
   if(!open)return;
   var choices=currentChoices(),plans=allDays(choices),wish=wishList(),done=wish.filter(function(w){return covered(w,plans)});
   var miss=wish.filter(function(w){return !covered(w,plans)});
   var head=element('div','noux-explorer-head');
   var hbox=element('div');hbox.append(element('small','noux-kicker','NOUX / JOURNEY INTELLIGENCE'),element('h2',null,'Our New York, in motion.'));
   head.append(hbox,press('noux-explorer-close','×',function(){open=false;drawer.hidden=true;trigger.setAttribute('aria-expanded','false')}));
   var intro=element('p','noux-explorer-intro',window.NOUX_PLAN_REVISION?.active()?'Five approved days. Extra wishlist places are suggestions only; confirmed plans are fixed.':'Five days, continuously adapting to our choices. All added stops are suggestions, never reservations.');
   var modes=element('div','noux-explorer-modes');
   modes.append(press(getMode()==='full'?'is-active':'','Full pace',function(){setMode('full');draw();rerender()}),press(getMode()==='original'?'is-active':'','Original',function(){setMode('original');draw();rerender()}));
   if(window.NOUX_PLAN_REVISION?.active())modes.hidden=true;
   var summary=element('div','noux-explorer-metric');
   var ratio=wish.length?Math.round(done.length/wish.length*100):0;
   summary.append(element('strong',null,done.length+' / '+wish.length),element('span',null,'wishes represented in the current itinerary'));
   var track=element('div','noux-explorer-bar');var value=element('span');value.style.width=ratio+'%';track.appendChild(value);
   var help=element('small','noux-help','Matches are approximate. Wishlist options remain visible even if unselected.');
   var daysHead=element('h3',null,'Choose a day');
   var dayGrid=element('div','noux-explorer-days');
   days.forEach(function(d){
    var rows=plans[d],count=rows.filter(function(e){return !['travel','logistics','recovery'].includes(e.kind)}).length;
    var dateText=(DATA.DAYS||[]).find(function(item){return item[0]===d});
    var btn=press(selectedDay()===d?'is-selected':'',dateText?dateText[2]:labels[d],function(){open=false;drawer.hidden=true;trigger.setAttribute('aria-expanded','false');goTo(d)});
    btn.appendChild(element('small',null,count+' experiences'));
    dayGrid.appendChild(btn);
   });
   var ny= new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
   var parts={};ny.forEach(function(x){parts[x.type]=x.value});
   var today=parts.year+'-'+parts.month+'-'+parts.day,now=Number(parts.hour)*60+Number(parts.minute);
   var key=days.find(function(d){return DATA.DATES&&DATA.DATES[d]===today});
   var live=element('div','noux-explorer-now');
   if(key){
    var upcoming=plans[key].find(function(e){var end=minute(e.end);if(end<minute(e.start))end+=1440;return end>=now});
    live.append(element('small',null,'NEXT STOP · NYC '+parts.hour+':'+parts.minute),element('b',null,upcoming?upcoming.start+' · '+upcoming.title:'All scheduled stops completed'));
    if(upcoming)live.append(press('noux-explorer-link','View today’s plan',function(){open=false;drawer.hidden=true;goTo(key)}));
   }else{
    var first=new Date(((DATA.DATES||{}).mon||'')+'T12:00:00Z').getTime(),diff=Number.isFinite(first)?Math.ceil((first-Date.now())/86400000):0;
    live.append(element('small',null,'NEW YORK LOCAL · '+parts.hour+':'+parts.minute),element('b',null,diff>0?diff+' days until our New York adventure':'Our NYC itinerary is ready to explore'));
   }
   var wishHead=element('h3',null,'Still on Lyna’s wish list');
   var radar=element('div','noux-explorer-radar');
   miss.slice(0,5).forEach(function(w){
    var row=element('div','noux-explorer-wish');
    row.append(element('span',null,w[0]),element('small',null,String(w[3]||'option')));
    radar.appendChild(row);
   });
   if(miss.length>5)radar.appendChild(element('small','noux-help','+'+(miss.length-5)+' more choices and alternatives'));
   if(!miss.length)radar.appendChild(element('p','noux-help','Every listed wish is represented in the active itinerary.'));
   // Never silently drop an unselected option; keep a visible second-chance ledger.
   var second=element('section','noux-second-chances');
   var chooser=window.NOUX_CHOICES;
   if(chooser&&typeof chooser.alternatives==='function'){
    var alternatives=chooser.alternatives(choices),allChosen=choices.c6==='all';
    second.append(element('h3',null,'Second chances · still on the list'));
    second.append(element('p','noux-help',allChosen?'All three art choices are spread across Tuesday and Wednesday.':'Preferences remain saved on this device; compatible unselected art can be added elsewhere.'));
    alternatives.sort(function(a,b){return Number(b.actionable)-Number(a.actionable)||Number(b.history)-Number(a.history)});
    alternatives.slice(0,8).forEach(function(item){
     var row=element('div','noux-second-row'),copy=element('div','noux-second-info');
     copy.append(element('b',null,item.title),element('small',null,item.planned?'Already included on the art trail':item.note));
     row.append(copy);
     if(item.actionable){
      row.append(press(item.planned?'noux-second-added':'noux-second-add',item.planned?'Added ✓':'+ Add too',function(){
       chooser.toggle(item.value);draw();rerender();
      }));
     }else{
      row.append(press('noux-second-review','Review',function(){
       var nav=Array.from(document.querySelectorAll('.topbar .mainnav button')).find(function(x){return /decisions/i.test(x.textContent)});
       if(nav)nav.click();
       open=false;drawer.hidden=true;trigger.setAttribute('aria-expanded','false');
       setTimeout(function(){var target=document.getElementById('decision-'+item.group);if(target)target.scrollIntoView({behavior:'smooth',block:'center'})},60);
      }));
     }
     second.append(row);
    });
    if(alternatives.length>8)second.append(element('small','noux-help','+'+(alternatives.length-8)+' additional alternatives remain in Lyna’s decisions.'));
    if(!alternatives.length)second.append(element('p','noux-help','All applicable choices have been included.'));
   }
   // Show deferred stops and routing checks, rather than hiding a displaced choice.
   var audit=window.NOUX_DAY_AUDIT;
   if(audit&&typeof audit.pending==='function'){
    var checks=audit.pending();
    if(checks.length){
     second.append(element('h3',null,'Route checks · nothing silently lost'));
     checks.slice(0,7).forEach(function(issue){
      var row=element('div','noux-second-row'),copy=element('div','noux-second-info');
      copy.append(element('b',null,(issue.day||'').toUpperCase()+' · '+issue.title),element('small',null,issue.reason));
      row.append(copy);second.append(row);
     });
     if(checks.length>7)second.append(element('small','noux-help','+'+(checks.length-7)+' more saved routing checks'));
    }
   }
   var controls=element('div','noux-explorer-actions');
   controls.append(press('noux-explorer-primary','Open wish list',function(){var b=Array.from(document.querySelectorAll('.topbar .mainnav button')).find(function(x){return /wish list/i.test(x.textContent)});if(b)b.click();open=false;drawer.hidden=true}),press('noux-explorer-secondary','Add a stop',function(){var b=document.querySelector('.top-add-stop');if(b)b.click();open=false;drawer.hidden=true}));
   if(window.NOUX_FOOD_GUIDE&&typeof window.NOUX_FOOD_GUIDE.open==='function')controls.append(press('noux-explorer-secondary','Food locations & hours',function(){window.NOUX_FOOD_GUIDE.open()}));
   // One optional guided mode for existing decisions, no duplicate dashboard.
   if(window.NOUX_DECISION_GUIDE&&typeof window.NOUX_DECISION_GUIDE.open==='function')controls.append(press('noux-explorer-primary','Guide our decisions',function(){open=false;drawer.hidden=true;window.NOUX_DECISION_GUIDE.open()}));
   drawer.replaceChildren(head,intro,live,modes,summary,track,help,daysHead,dayGrid,wishHead,radar,second,controls);
  }
  var root=document.getElementById('root');
  var timer=null;
  if(root&&window.MutationObserver){
   var observer=new MutationObserver(function(){if(open){clearTimeout(timer);timer=setTimeout(draw,180)}});
   observer.observe(root,{childList:true,subtree:true,characterData:true});
  }
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open){open=false;drawer.hidden=true;trigger.setAttribute('aria-expanded','false')}});
  document.addEventListener('noux:replan',function(){rerender();if(open)draw()});
  setInterval(function(){if(open)draw()},60000);
 }
 function install(options){
  if(READY)return true;
  DATA=window.NYC_DATA;PLAN=window.NYC_PLAN;
  if(!DATA||!DATA.P||!PLAN||typeof PLAN.day!=='function')return false;
  Object.keys(extraPlaces).forEach(function(k){if(!DATA.P[k])DATA.P[k]=extraPlaces[k]});
  // A recovery/basic session must still show Explore, but must NEVER
  // re-wrap the final approved itinerary or re-add retired optional stops.
  if(options&&options.displayOnly || window.NOUX_PLAN_REVISION?.active()){
   READY=true;
   if(!(options&&options.headless)){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
   }
   return true;
  }
  baseDay=PLAN.day.bind(PLAN);
  PLAN.day=function(day,choices){
   if(choices&&typeof choices==='object')lastChoices=Object.assign({},choices);
   if(getMode()!=='full'||!days.includes(day))return baseDay(day,choices);
   try{
   // Optimise all five days together so the same wish is not added on multiple days.
   // Preserve places already in the private baseline on any other day.
   var original={},globalUsed=new Set(),result={};
   days.forEach(function(d){original[d]=baseDay(d,choices)});
   days.forEach(function(d){original[d].forEach(function(e){catalog.forEach(function(c){if(eventHas(e,c))globalUsed.add(c.id)})})});
   ['tue','wed','fri','mon','thu'].forEach(function(d){
    result[d]=pack(d,original[d],globalUsed);
    result[d].forEach(function(e){catalog.forEach(function(c){if(eventHas(e,c))globalUsed.add(c.id)})});
   });
   return result[day];
   }catch(_){return baseDay(day,choices)}
  };
  READY=true;
  if(!(options&&options.headless)){
   if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  }
  return true;
 }
 // The private React app can mount after DOMContentLoaded on mobile.
 // Always recheck the sole Explore shortcut after the first successful render.
 function ensure(){
  if(!READY||!document.body)return false;
  if(!document.getElementById('noux-explorer-launch'))mount();
  var trigger=document.getElementById('noux-explorer-launch');
  if(!trigger)return false;
  trigger.hidden=false;
  trigger.removeAttribute('aria-hidden');
  return true;
 }
 window.NOUX_EXPLORER={install:install,ensure:ensure,version:'2026.11.22-mobile1',mode:getMode};
})();