/* Remember-this-device security and continuity regression.
 * Synthetic encrypted bytes and same-origin IndexedDB mock; no real secrets.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const source=fs.readFileSync('remember-device.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
new vm.Script(source,{filename:'remember-device.js'});
assert(!/localStorage\.|sessionStorage\.|exportKey\(|document\.cookie/.test(source),
 'Remember access must not put keys, passphrases or cookies into JS storage');
assert(/extractable===false/.test(source),'Only non-exportable CryptoKeys may be remembered');
assert(html.includes('id="remember-device"')&&html.includes('type="checkbox" checked'),
 'Visitor must be able to opt out of remembered access');
assert(html.indexOf('remember-device.js')<html.indexOf('unlock.js'),
 'The remember helper loads before the unlock application');
assert(sw.includes('./remember-device.js?v='),
 'Offline pack must include remembered-access support');
function fakeIndexedDB(){
 const records=new Map();
 let created=false;
 const database={
  objectStoreNames:{contains:()=>created},
  createObjectStore:()=>{created=true},
  close(){},
  transaction(){
   const tx={oncomplete:null,onerror:null,onabort:null,error:null};
   tx.objectStore=()=>({
    get:key=>run('get',key),
    put:(value,key)=>run('put',key,value),
    delete:key=>run('delete',key)
   });
   function run(op,key,value){
    const req={result:undefined,error:null,onsuccess:null,onerror:null};
    Promise.resolve().then(()=>{
     if(op==='get')req.result=records.get(key);
     if(op==='put')records.set(key,value);
     if(op==='delete')records.delete(key);
     req.onsuccess?.();
     Promise.resolve().then(()=>tx.oncomplete?.());
    });
    return req;
   }
   return tx;
  }
 };
 return {
  records,
  open:()=>{
   const req={result:database,error:null,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};
   Promise.resolve().then(()=>{
    if(!created)req.onupgradeneeded?.();
    req.onsuccess?.();
   });
   return req;
  }
 };
}
const db=fakeIndexedDB();
const boot=(indexedDB=db)=>{
 const window={indexedDB};
 vm.runInNewContext(source,{window,Promise,Date,Error,Object,Array,String,Map},{filename:'remember-device.js'});
 return window.NOUX_REMEMBER_DEVICE;
};
(async()=>{
 const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 assert.equal(key.type,'secret');
 assert.equal(key.extractable,false,'Generated key cannot be exported');
 const iv=webcrypto.getRandomValues(new Uint8Array(12));
 const message=new TextEncoder().encode('synthetic-no-private-trip');
 const encrypted=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,message);
 const initial=boot();
 assert.equal(initial.status().remembered,false,'Fresh browser initially asks for passphrase');
 assert.equal(await initial.restore(),null,'First visit has no saved key');
 assert.equal(initial.activate(key),true);
 assert.equal(await initial.remember(),true,'Explicit stay-signed-in saves a non-exportable key');
 assert.equal(initial.status().remembered,true);
 const record=db.records.get('trip-vault-key');
 assert.equal(record.version,1);
 assert.equal(record.key,key,'Persisted value is a CryptoKey, not plaintext or a password string');
 assert(!Object.keys(record).includes('password')&&!Object.keys(record).includes('passphrase'));
 const returned=boot();
 const recovered=await returned.restore();
 assert.equal(recovered,key,'Simulated Safari tab restart restores remembered key');
 const plain=await webcrypto.subtle.decrypt({name:'AES-GCM',iv},recovered,encrypted);
 assert.equal(new TextDecoder().decode(plain),'synthetic-no-private-trip','Restored key decrypts existing AES-GCM vault');
 assert.equal(returned.status().remembered,true);
 assert.equal(await returned.forget(),true,'Explicit logout deletes only the remembered key');
 assert.equal(db.records.has('trip-vault-key'),false);
 const after=boot();
 assert.equal(await after.restore(),null,'Next app visit requires passphrase after logout');
 const unavailable=boot(null);
 assert.equal(await unavailable.restore(),null,'Private mode / missing IndexedDB fails safely');
 assert.equal(await unavailable.remember(key),false,'Browser refusing storage does not claim persistence');
 assert.equal(unavailable.status().remembered,false);
 assert.equal(await unavailable.forget(),false,'Refusal to forget is surfaced rather than pretending to lock');
 assert.equal(await after.remember({type:'secret',extractable:true,algorithm:{name:'AES-GCM'},usages:['decrypt']}),false,
  'Reject exportable decryption keys');
 console.log('REMEMBER DEVICE PASS: non-exportable AES key survives browser restarts, no passphrase persistence, safe storage failure and explicit logout.');
})().catch(error=>{console.error(error);process.exitCode=1});
