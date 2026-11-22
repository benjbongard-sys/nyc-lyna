/* NOUX offline-first sync model. Never accesses a backend or an encryption key.
 * Records are flattened to protect unrelated edits from two devices: choices,
 * custom stops by ID, each person's tickboxes, and gifts by ID/field.
 */
(function(){
'use strict';
if(window.NOUX_SYNC_CORE)return;
const RESERVED=new Set(['__proto__','prototype','constructor']);
const PRIVATE=/pass(?:word|phrase)|secret|auth(?:orization)?|api.?token|private.?key/i;
const STORE=/^noux_trip_revision_v1$|^nyc_lyna_trip_v\d+$|^noux_choice_journal_v\d+$|^noux_explore_pace_v\d+$|^(?:noux|nyc_lyna)[_-].*(?:custom|stops|pins|booking|wishes)|(?:^|[_-])custom[_-]?stops(?:[_-]|$)/i;
const CHECKLIST='@noux-departure';
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.prototype.toString.call(x)==='[object Object]';
const ident=v=>typeof v==='string'||typeof v==='number';
const pathKey=path=>JSON.stringify(path);
const parseKey=k=>{try{const p=JSON.parse(k);return Array.isArray(p)&&p.length>=1&&p.length<=15&&p.every(x=>typeof x==='string'&&x.length<=190&&!RESERVED.has(x))?p:null}catch(_){return null}};
const hasName=k=>STORE.test(k)&&!PRIVATE.test(k)&&!/^noux_(?:sync|shared)[_-]/.test(k)&&k.length<=120;
function flatten(value,path,flat,depth=0){
 // Embedded photo blobs can exceed browser/Worker storage quotas. Keep those
 // images local, but still sync the custom stop's text, position and choices.
 if(typeof value==='string'&&value.length>180000)return;
 if(depth>10){flat[pathKey(path)]=value;return}
 if(Array.isArray(value)){
  // Empty collections represent an absence of local additions when a new
  // device joins. Deletions are explicit per-item tombstones, never [] wipes.
  if(value.length===0)return;
  if(value.length>0 && value.length<500&&value.every(v=>plain(v)&&ident(v.id))&&new Set(value.map(v=>String(v.id))).size===value.length){
   for(const v of value){
    const prefix=path.concat('#'+String(v.id));
    flat[pathKey(prefix.concat('@item'))]=true;
    flatten(v,prefix,flat,depth+1);
   }
  } else flat[pathKey(path)]=value;
 }else if(plain(value)){
  const entries=Object.entries(value).filter(([k])=>!RESERVED.has(k)&&!PRIVATE.test(k)).slice(0,700);
  // Empty objects are not whole-subtree replacement instructions.
  if(!entries.length)return;
  for(const [k,v] of entries)flatten(v,path.concat(k),flat,depth+1);
 } else flat[pathKey(path)]=value;
}
function scan(storage,checklist){
 const result={};let keys=[];
 try{keys=Object.keys(storage)}catch(_){}
 for(const key of keys){
  if(!hasName(key))continue;
  let raw;try{raw=storage.getItem(key)}catch(_){continue}
  if(typeof raw!=='string')continue;
  if(raw.length>5_200_000)continue;
  try{
   const decoded=JSON.parse(raw);
   if(plain(decoded)||Array.isArray(decoded))flatten(decoded,[key],result);
   else result[pathKey([key])]=raw;
  }catch(_){result[pathKey([key])]=raw}
 }
 if(plain(checklist)){
  if(plain(checklist.check))flatten(checklist.check,[CHECKLIST,'check'],result);
  if(Array.isArray(checklist.items))flatten(checklist.items,[CHECKLIST,'items'],result);
 }
 return result;
}
function compare(a,b){
 const t1=Number(a?.t)||0,t2=Number(b?.t)||0;
 if(t1!==t2)return t1>t2?1:-1;
 const d1=String(a?.device||''),d2=String(b?.device||'');
 return d1===d2?0:d1>d2?1:-1;
}
function merge(left,right){
 const both=Object.assign({},left||{});
 for(const [k,v] of Object.entries(right||{})){
  if(!parseKey(k)||!v||typeof v!=='object')continue;
  if(!own(both,k)||compare(v,both[k])>0)both[k]=v;
 }
 return both;
}
function diff(baseline,now,records,device,clock){
 const base=baseline||{},current=now||{},out={...records},stamp=typeof clock==='function'?clock:Date.now;
 const ids=new Set([...Object.keys(base),...Object.keys(current)]);
 for(const id of ids){
  if(!parseKey(id))continue;
  if(own(current,id)&&own(base,id)&&JSON.stringify(base[id])===JSON.stringify(current[id]))continue;
  if(!own(base,id)&&!own(current,id))continue;
  out[id]={value:own(current,id)?current[id]:null,deleted:!own(current,id),t:stamp(),device};
 }
 return out;
}
function itemOf(arr,id,create){
 let found=arr.find(v=>plain(v)&&String(v.id)===id);
 if(!found&&create){found={id};arr.push(found)}
 return found;
}
function setPath(root,path,value,deleted){
 if(!path.length)return {root:deleted?undefined:value,removed:deleted};
 let cursor=root;
 for(let i=0;i<path.length;i++){
  const key=path[i],last=i===path.length-1,next=path[i+1];
  if(RESERVED.has(key))return {root};
  if(key.startsWith('#')){
   if(!Array.isArray(cursor))return {root};
   const id=key.slice(1);
   if(last){
    const index=cursor.findIndex(v=>plain(v)&&String(v.id)===id);
    if(deleted){if(index>=0)cursor.splice(index,1)}
    else if(index>=0)cursor[index]=value;
    else cursor.push(value);
   }else{
    let obj=itemOf(cursor,id,!deleted);
    if(!obj)return {root};
    cursor=obj;
   }
  }else if(key==='@item'){
   if(!deleted && plain(cursor))cursor.id=cursor.id||path[i-1].slice(1);
   // Item tombstones are applied after child records, see apply().
  }else if(last){
   if(!plain(cursor))return {root};
   if(deleted)delete cursor[key];
   else cursor[key]=value;
  }else{
   if(!plain(cursor))return {root};
   if(!own(cursor,key)||(!plain(cursor[key])&&!Array.isArray(cursor[key]))){
    if(deleted)return {root};
    cursor[key]=next&&next.startsWith('#')?[]:{};
   }
   cursor=cursor[key];
  }
 }
 return {root};
}
function apply(storage,checklist,records){
 const grouped={};
 for(const [key,entry] of Object.entries(records||{})){
  const path=parseKey(key);
  if(!path||!entry||typeof entry!=='object'||path.some(k=>PRIVATE.test(k)))continue;
  const store=path[0];
  if(store!==CHECKLIST&&!hasName(store))continue;
  (grouped[store]??=[]).push({path:path.slice(1),entry});
 }
 const changedKeys=[];let departure=plain(checklist)?JSON.parse(JSON.stringify(checklist)):{check:{},items:[]},departureChanged=false;
 for(const [store,updates] of Object.entries(grouped)){
  let raw=null,root;
  if(store===CHECKLIST)root=departure;
  else{
   try{raw=storage.getItem(store)}catch(_){continue}
   try{root=raw===null?{}:JSON.parse(raw)}catch(_){root=raw}
  }
  const top=updates.find(x=>x.path.length===0);
  if(top){
   root=top.entry.deleted?undefined:top.entry.value;
  }
  const children=updates.filter(x=>x.path.length);
  const tombstones=children.filter(x=>x.path.at(-1)==='@item'&&x.entry.deleted);
  const regular=children.filter(x=>!(x.path.at(-1)==='@item'&&x.entry.deleted));
  // Ensure array items exist before applying fields. Tombstones processed last.
  for(const {path,entry} of regular){
   if(path.at(-1)==='@item'){if(entry.deleted)continue;setPath(root,path,true,false);continue}
   setPath(root,path,entry.value,entry.deleted);
  }
  for(const {path} of tombstones){
   const itemPath=path.slice(0,-1);
   setPath(root,itemPath,null,true);
  }
  if(store===CHECKLIST){
   const serialized=JSON.stringify(root);
   if(serialized!==JSON.stringify(checklist)){departure=root;departureChanged=true}
  }else{
   const final=root===undefined?null:typeof root==='string'?root:JSON.stringify(root);
   if(final!==raw){
    try{if(final===null)storage.removeItem(store);else storage.setItem(store,final);changedKeys.push(store)}catch(_){}
   }
  }
 }
 return {checklist:departure,checklistChanged:departureChanged,changedKeys};
}
window.NOUX_SYNC_CORE={scan,compare,merge,diff,apply,parseKey,version:'1.0'};
})();
