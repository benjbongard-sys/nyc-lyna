/* NOUX remembered-device access.
 * A passphrase is NEVER stored. Users can opt into retaining the non-extractable
 * WebCrypto AES-GCM CryptoKey in same-origin IndexedDB on THIS device.
 * Browsers may evict website data. Anyone with access to an unlocked browser
 * profile can then reopen the private itinerary without the passphrase.
 * This does not change the encrypted vault, sync, choices or offline pack.
 */
(function(){
'use strict';
if(window.NOUX_REMEMBER_DEVICE)return;
const DATABASE='noux-remembered-device-v1';
const STORE='credentials',ENTRY='trip-vault-key';
let ACTIVE_KEY=null,REMEMBERED=false,ERROR='';
function valid(key){
 return !!key&&key.type==='secret'&&key.extractable===false&&
  key.algorithm?.name==='AES-GCM'&&Array.isArray(key.usages)&&
  key.usages.includes('decrypt');
}
function openDb(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('Device storage is unavailable'));return}
  let request;
  try{request=window.indexedDB.open(DATABASE,1)}catch(e){reject(e);return}
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Device access storage failed'));
  request.onblocked=()=>reject(Error('Device access storage is blocked'));
 });
}
async function transact(mode,method,payload){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  let transaction,request,result;
  try{
   transaction=db.transaction(STORE,mode);
   request=method==='put'?transaction.objectStore(STORE).put(payload,ENTRY):
    method==='delete'?transaction.objectStore(STORE).delete(ENTRY):
    transaction.objectStore(STORE).get(ENTRY);
  }catch(error){db.close?.();reject(error);return}
  request.onsuccess=()=>{result=request.result};
  transaction.oncomplete=()=>{db.close?.();resolve(result)};
  const failed=()=>{db.close?.();reject(transaction.error||request.error||Error('Device access transaction failed'))};
  transaction.onerror=failed;transaction.onabort=failed;
 });
}
function activate(key){
 if(valid(key)){ACTIVE_KEY=key;return true}
 return false;
}
async function restore(){
 try{
  const record=await transact('readonly','get');
  if(record?.version!==1||!valid(record.key)){REMEMBERED=false;return null}
  REMEMBERED=true;ERROR='';
  return record.key;
 }catch(error){
  ERROR='This browser cannot reopen saved device access.';
  REMEMBERED=false;
  return null;
 }
}
async function remember(key=ACTIVE_KEY){
 if(!valid(key)){ERROR='A verified private itinerary must be unlocked first.';return false}
 try{
  await transact('readwrite','put',{version:1,key,savedAt:Date.now()});
  ACTIVE_KEY=key;REMEMBERED=true;ERROR='';
  return true;
 }catch(error){
  ERROR='This browser could not save persistent access. Your itinerary is unchanged.';
  return false;
 }
}
async function forget(){
 try{
  await transact('readwrite','delete');
  ACTIVE_KEY=null;REMEMBERED=false;ERROR='';
  return true;
 }catch(error){
  ERROR='Could not forget this browser. Retry in Trip Settings.';
  return false;
 }
}
function status(){
 return {remembered:REMEMBERED,available:!!window.indexedDB,
  canEnable:valid(ACTIVE_KEY),error:ERROR};
}
window.NOUX_REMEMBER_DEVICE={
 activate,remember,restore,forget,status,
 version:'2026.11.24-remember1'
};
})();