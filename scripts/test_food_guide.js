/* NOUX verified Food-guide regression test. Public/synthetic only. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const catalogCode=fs.readFileSync('food-wishlist.js','utf8');
const guideCode=fs.readFileSync('food-guide.js','utf8');
assert(!/private\.vault|NOUX_PASSPHRASE|Sanctuary Hotel|132 W 47th/.test(catalogCode+guideCode));
assert(!guideCode.includes('fetch(')&&!guideCode.includes('localStorage.setItem'),'Food guide must make no background network or storage changes');
const normalize=(x)=>JSON.stringify(x);
class Node {
 constructor(tag){
  this.tagName=tag;this.id='';this.className='';this.text='';this.value='';this.hidden=false;this.href='';this.listeners={};this.children=[];this.parent=null;this.attrs={};this.style={};this.type='';
  this.classList={add(){},remove(){}};
 }
 set textContent(s){this.text=String(s)}
 get textContent(){return this.text+this.children.map(v=>v.textContent).join('')}
 append(...items){items.forEach(x=>{if(x){x.parent=this;this.children.push(x)}})}
 appendChild(x){this.append(x);return x}
 replaceChildren(...items){this.children=[];this.append(...items)}
 setAttribute(k,v){this.attrs[k]=String(v)}
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 focus(){}
 querySelector(s){return all(this).find(x=>s[0]==='.'?x.className?.split(' ').includes(s.slice(1)):s[0]==='#'?x.id===s.slice(1):x.tagName===s)||null}
 querySelectorAll(s){return all(this).filter(x=>s[0]==='.'?x.className?.split(' ').includes(s.slice(1)):s[0]==='#'?x.id===s.slice(1):x.tagName===s)}
 closest(selector){for(let n=this;n;n=n.parent)if(selector.split(',').some(s=>s[0]==='.'?n.className?.split(' ').includes(s.slice(1)):n.tagName===s))return n;return null}
}
const all=(root)=>[root,...root.children.flatMap(all)];
const body=new Node('body'),root=new Node('div');root.id='root';const grid=new Node('div');grid.className='wish-grid';
const food=new Node('div');food.className='wish-item';food.textContent="Katz's Delicatessen · pastrami";
grid.append(food);root.append(grid);
const doc={
 body,listeners:{},createElement:t=>new Node(t),getElementById:id=>id==='root'?root:all(body).find(x=>x.id===id)||null,
 querySelector:sel=>sel==='.wishes .wish-grid'?grid:all(body).find(x=>x.id===sel.replace('#',''))||null,
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
};
const data={WISHES:[["Katz's Delicatessen",'food','wed','core'],['MoMA','art','tue','core']],DEFAULT:{},P:{}};
const win={NYC_DATA:data};
const ctx={window:win,document:doc,Array,Math,Date,JSON,String,Set,Object,Number,Promise};
vm.runInNewContext(catalogCode,ctx,{filename:'food-wishlist.js'});
vm.runInNewContext(guideCode,ctx,{filename:'food-guide.js'});
const meta=win.NOUX_FOOD_WISHLIST.catalogue();
assert.equal(meta.length,15,'All food recommendations have records');
assert(meta.every(p=>p.address&&p.website&&p.hours&&p.note&&p.days.length),'All records have branch, hours, source and route-fit days');
assert(meta.find(p=>p.id==='sadies').thursday.includes('10:00–15:00'),'Sadies Thanksgiving brunch confirmed');
assert(meta.find(p=>p.id==='goldendiner').friday.includes('conflict'),'Golden Diner holiday ambiguity disclosed');
assert(meta.find(p=>p.id==='russ').holiday.startsWith('CLOSED'),'Explicit Thanksgiving closure recorded');
assert(meta.find(p=>p.id==='lobster').holiday.startsWith('CLOSED'),'Lobster Place Thanksgiving closure recorded');
assert(meta.find(p=>p.id==='katz').holiday.includes('18:00'),'Katz official holiday early closing');
assert(meta.find(p=>p.id==='levain').hours.includes('hotel lists'),'Levain discrepancy disclosed');
assert(meta.find(p=>p.id==='magnolia').hours.includes('Rockefeller Center'),'Magnolia discrepancy disclosed');
assert.equal(win.NOUX_FOOD_WISHLIST.find('Joe’s Pizza · classic NYC slice').id,'joes','Name variant matches existing private wishlist');
const original=normalize(data.WISHES);
assert.equal(win.NOUX_FOOD_WISHLIST.install().added,14,'Existing wish preserved');
assert.equal(normalize(data.WISHES[0]),normalize(["Katz's Delicatessen",'food','wed','core']),'Do not overwrite existing private priority');
assert(win.NOUX_FOOD_GUIDE.install(),'Guide attaches after unlock');
const guide=doc.getElementById('noux-food-guide');
assert(guide&&guide.hidden,'Guide mounted outside private React subtree');
assert.equal(root.children.length,1,'React-owned root unchanged');
assert(!all(body).some(x=>x.className==='noux-food-launcher'),
 'Food details should live on Wishlist cards, not another floating button');
const click=doc.listeners.click?.[0];assert(click,'Delegated click is installed');
click({target:food});
assert.equal(guide.hidden,false,'Native Food card opens the independent information guide');
let cards=guide.querySelectorAll('.noux-food-card');
assert.equal(cards.length,15,'All food details are rendered');
let katz=cards.find(x=>x.id==='noux-food-katz');
assert(katz.textContent.includes('205 E Houston St'),'Food card shows complete street address');
assert(katz.textContent.includes('08:00–23:00'),'Food card shows published hours');
assert(all(katz).some(x=>x.tagName==='a'&&x.href.startsWith('https://www.google.com/maps/dir/?api=1&destination=')),'Food card supplies one-tap route');
assert(all(katz).some(x=>x.tagName==='a'&&x.href==='https://katzsdelicatessen.com/location'),'Food card supplies source website');
const thu=guide.querySelectorAll('.noux-food-day').find(x=>x.textContent==='Thu 26');
assert(thu,'Thanksgiving filter is available');thu.listeners.click[0]();
assert.equal(guide.querySelectorAll('.noux-food-card').length,15,'Thanksgiving filter shows all venues to reveal closures and uncertain holiday hours');
assert(guide.textContent.includes('Closed on Thanksgiving (official)'),'Thursday clearly identifies official closures');
assert(guide.textContent.includes('Thanksgiving hours not confirmed'),'Other Thursday venues retain uncertainty rather than false open-now claims');
const allDays=guide.querySelectorAll('.noux-food-day').find(x=>x.textContent==='All days');allDays.listeners.click[0]();
data.WISHES.push(['Unlisted Noodles Restaurant','food','','choice']);
win.NOUX_FOOD_GUIDE.open();
assert.equal(guide.querySelectorAll('.noux-food-card').length,16,'Additional personal Food wishes remain accessible');
assert(guide.textContent.includes('Opening hours not yet verified'),'No invented hours for unknown personal wishes');
const btn=guide.querySelector('.noux-food-close');btn.listeners.click[0]();
assert(guide.hidden,'Close control works');
console.log('NOUX Food guide PASS: 15 branch records, hours/holidays, native-card details, directions and safe React DOM isolation.');
