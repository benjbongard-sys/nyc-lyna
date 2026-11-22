/* NOUX All-stops map filter. Observes MapLibre markers but never alters
 * React's map components or private itinerary. Scheduled is the default.
 */
(function(){
'use strict';
if(window.NOUX_MAP_FILTER)return;
const KEY='noux_map_filter_v1';
const DAYS=['mon','tue','wed','thu','fri'];
let mode='scheduled',prepared=false,installed=false,toolbar=null,observer=null,frame=0;
const tracked=new WeakMap();
const el=(name,cls,text)=>{const node=document.createElement(name);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
function readMode(){
 try{return localStorage.getItem(KEY)==='all'?'all':'scheduled'}catch(_){return 'scheduled'}
}
function coordinates(){
 const pts=[];
 try{
  const P=window.NYC_DATA?.P||{},plan=window.NYC_PLAN;
  if(typeof plan?.day!=='function')return pts;
  const choices={...window.NYC_DATA?.DEFAULT};
  DAYS.forEach(day=>{
   const events=plan.day(day,choices);
   if(!Array.isArray(events))return;
   events.forEach(event=>{
    const p=P[event?.place];
    if(p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))){
     const lat=Number(p.lat),lng=Number(p.lng);
     if(lat>=40&&lat<=42&&lng>=-75&&lng<=-72)pts.push({lat,lng});
    }
   });
  });
 }catch(_){}
 return pts;
}
function match(a,pts){
 if(!a||!Number.isFinite(a.lat)||!Number.isFinite(a.lng))return false;
 return pts.some(p=>Math.abs(p.lat-a.lat)<0.00042&&Math.abs(p.lng-a.lng)<0.00056);
}
function capture(marker){
 try{
  const node=marker.getElement?.();
  if(node)tracked.set(node,marker);
 }catch(_){}
}
function prepare(){
 if(prepared)return true;
 const marker=window.maplibregl?.Marker?.prototype;
 if(!marker||typeof marker.addTo!=='function')return false;
 const old=marker.addTo;
 marker.addTo=function(){
  const result=old.apply(this,arguments);
  capture(this);
  queue();
  return result;
 };
 prepared=true;return true;
}
function getBoards(){
 return Array.from(document.querySelectorAll('.map-board')).filter(board=>{
  if(!board.isConnected)return false;
  const bounds=board.getBoundingClientRect?.();
  if(!bounds||bounds.width<40||bounds.height<40)return false;
  const visibility=window.getComputedStyle?.(board);
  if(visibility&&(visibility.display==='none'||visibility.visibility==='hidden'))return false;
  return bounds.bottom>0&&bounds.top<window.innerHeight;
 });
}
function pins(board){return Array.from(board.querySelectorAll('.maplibregl-marker'))}
function restore(node){
 if(node.dataset?.nouxMapFiltered==='1'){
  node.style.display=node.dataset.nouxMapDisplay||'';
  delete node.dataset.nouxMapFiltered;
  delete node.dataset.nouxMapDisplay;
 }
}
function hide(node){
 if(node.dataset?.nouxMapFiltered!=='1'){
  node.dataset.nouxMapDisplay=node.style.display||'';
  node.dataset.nouxMapFiltered='1';
 }
 node.style.display='none';
}
function apply(board,pts){
 let total=0,scheduled=0;
 pins(board).forEach(node=>{
  total++;
  const marker=tracked.get(node);
  let position=null;
  try{
   const value=marker?.getLngLat?.();
   if(value)position={lat:Number(value.lat),lng:Number(value.lng)};
  }catch(_){}
  const option=node.classList?.contains('is-option')||!!node.querySelector?.('.is-option');
  // If old markers were created before the public hook, use the existing
  // React-designated optional-marker class. Unknown pins stay visible rather
  // than accidentally hiding a scheduled/custom place.
  const onPlan=position?match(position,pts):!option;
  if(onPlan)scheduled++;
  if(mode==='scheduled'&&!onPlan)hide(node);else restore(node);
 });
 return {total,scheduled};
}
function renderToolbar(count){
 if(!toolbar)return;
 const buttons=toolbar.querySelectorAll('button');
 buttons.forEach(button=>{
  const chosen=button.dataset.filter===mode;
  button.setAttribute('aria-pressed',String(chosen));
  button.classList.toggle('active',chosen);
 });
 const countNode=toolbar.querySelector('.noux-map-filter-count');
 if(countNode)countNode.textContent=count?count.scheduled+' scheduled · '+count.total+' total':'Map pins';
}
function update(){
 frame=0;if(!installed)return;
 const boards=getBoards(),board=boards[0];
 if(!board){if(toolbar)toolbar.hidden=true;return}
 const pts=coordinates(),result=apply(board,pts);
 if(toolbar){
  const bounds=board.getBoundingClientRect(),left=Math.max(8,Math.min(bounds.left+12,window.innerWidth-225));
  toolbar.style.left=Math.round(left)+'px';
  toolbar.style.top=Math.round(Math.max(8,bounds.top+12))+'px';
  toolbar.hidden=false;
 }
 renderToolbar(result);
}
function queue(){
 if(frame||!installed)return;
 frame=requestAnimationFrame(update);
}
function select(value){
 mode=value==='all'?'all':'scheduled';
 try{localStorage.setItem(KEY,mode)}catch(_){}
 queue();
}
function install(){
 if(installed)return true;
 if(!window.NYC_DATA||!window.NYC_PLAN)return false;
 mode=readMode();
 prepare();
 toolbar=el('div','noux-map-filter');
 toolbar.id='noux-map-filter';
 toolbar.setAttribute('role','group');
 toolbar.setAttribute('aria-label','All-stops map pin filter');
 const scheduled=el('button',null,'Scheduled'),all=el('button',null,'All');
 for(const [btn,value] of [[scheduled,'scheduled'],[all,'all']]){
  btn.type='button';btn.dataset.filter=value;
  btn.addEventListener('click',()=>select(value));
  toolbar.append(btn);
 }
 toolbar.append(el('small','noux-map-filter-count','Map pins'));
 toolbar.hidden=true;document.body.append(toolbar);
 installed=true;
 const root=document.getElementById('root');
 if(root&&window.MutationObserver){
  observer=new MutationObserver(queue);
  observer.observe(root,{childList:true,subtree:true});
 }
 window.addEventListener('resize',queue);
 window.addEventListener('scroll',queue,true);
 document.addEventListener('noux:replan',queue);
 window.addEventListener('noux:sync-data-arrived',queue);
 queue();
 return true;
}
window.NOUX_MAP_FILTER={prepare,install,select,getMode:()=>mode,coordinates,match,update,version:'2026.11.22-map1'};
})();