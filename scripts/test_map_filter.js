/* All-stops map pin toggle: synthetic MapLibre objects, no private itinerary. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('map-filter.js','utf8');
new vm.Script(source,{filename:'map-filter.js'});
assert(!/NOUX_PASSPHRASE|private\.vault\.json|Sanctuary Hotel|132 W 47th/.test(source));
class Node{
 constructor(tag,cls=''){this.tagName=tag;this.className=cls;this.nodes=[];this.style={display:''};this.dataset={};this.attrs={};this.hidden=false;this.isConnected=true;this.listeners={};this._text='';this.id='';this.classList={contains:name=>this.className.split(' ').includes(name),toggle:(name,val)=>{const s=new Set(this.className.split(' ').filter(Boolean));if(val)s.add(name);else s.delete(name);this.className=[...s].join(' ')}}}
 append(...nodes){this.nodes.push(...nodes)}
 get textContent(){return this._text+this.nodes.map(x=>x.textContent).join('')}
 set textContent(t){this._text=String(t)}
 setAttribute(name,value){this.attrs[name]=value}
 addEventListener(name,fn){this.listeners[name]=fn}
 querySelectorAll(selector){return descendants(this).filter(x=>selector==='button'?x.tagName==='button':selector==='.maplibregl-marker'?x.classList.contains('maplibregl-marker'):selector==='.is-option'?x.classList.contains('is-option'):selector==='.noux-map-filter-count'?x.classList.contains('noux-map-filter-count'):false)}
 querySelector(sel){return this.querySelectorAll(sel)[0]||null}
 getBoundingClientRect(){return {left:15,top:80,bottom:this.hidden?-20:470,width:this.hidden?0:360,height:this.hidden?0:390}}
}
const descendants=x=>x.nodes.flatMap(n=>[n,...descendants(n)]);
const body=new Node('body'),root=new Node('div'),map=new Node('div','map-board');root.append(map);
const doc={body,getElementById:id=>id==='root'?root:descendants(body).find(x=>x.id===id)||null,
 createElement:tag=>new Node(tag),querySelectorAll:sel=>sel==='.map-board'?[map]:[],addEventListener(){}};
const locations={planned:{lat:40.7521,lng:-73.9808},alternative:{lat:40.7421,lng:-73.9911}};
const DATA={P:locations,DEFAULT:{},DATES:{}},PLAN={day:d=>d==='mon'?[{place:'planned',title:'Approved stop',start:'10:00'}]:[]};
const storage={state:{},getItem(k){return this.state[k]??null},setItem(k,v){this.state[k]=v}};
const frames=[];
class Marker{
 constructor(pos,optional=false){this.pos=pos;this.node=new Node('div','maplibregl-marker');this.node.append(new Node('div',optional?'maplibre-stop-pin is-option':'maplibre-stop-pin'))}
 getElement(){return this.node}
 getLngLat(){return this.pos}
 addTo(holder){holder.append(this.node);return this}
}
const win={NYC_DATA:DATA,NYC_PLAN:PLAN,maplibregl:{Marker},innerWidth:390,innerHeight:700,
 getComputedStyle:()=>({display:'block',visibility:'visible'}),addEventListener(){}};
const ctx={window:win,document:doc,localStorage:storage,Array,Object,Number,String,Math,JSON,Set,WeakMap,
 requestAnimationFrame:fn=>{frames.push(fn);return frames.length}};
vm.runInNewContext(source,ctx,{filename:'map-filter.js'});
const filter=win.NOUX_MAP_FILTER;
assert(filter.prepare(),'Marker capture installed before React draws map');
const scheduled=new Marker({lat:40.7521,lng:-73.9808}).addTo(map);
const optional=new Marker({lat:40.7421,lng:-73.9911},true).addTo(map);
assert(filter.install(),'Filter installs once');
function flush(){let count=0;while(frames.length&&count++<20)frames.shift()()}
flush();
const panel=descendants(body).find(x=>x.id==='noux-map-filter');
assert(panel&&!panel.hidden,'Compact filter appears only on All-stops map');
const buttons=panel.querySelectorAll('button');
assert.equal(buttons.length,2,'Only Scheduled / All choices');
assert.equal(filter.getMode(),'scheduled','Scheduled is default');
assert.notEqual(scheduled.getElement().style.display,'none','Planned marker stays visible');
assert.equal(optional.getElement().style.display,'none','Optional marker hidden in Scheduled mode');
assert.equal(buttons[0].attrs['aria-pressed'],'true','Selected tab accessible to assistive technology');
assert(panel.textContent.includes('1 scheduled · 2 total'),'Counts from the real map pins');
buttons[1].listeners.click();
flush();
assert.equal(filter.getMode(),'all','All filter activates');
assert.notEqual(optional.getElement().style.display,'none','All displays optional markers');
assert.equal(storage.getItem('noux_map_filter_v1'),'all','Preference persists on current device');
buttons[0].listeners.click();flush();
assert.equal(optional.getElement().style.display,'none','Switching back hides only unscheduled pin');
assert.equal(scheduled.getElement().style.display,'','Scheduled original marker style unaffected');
const custom=new Marker({lat:40.7521,lng:-73.9808}).addTo(map);flush();
assert.notEqual(custom.getElement().style.display,'none','Additional scheduled custom pins stay shown');
map.hidden=true;filter.update();assert(panel.hidden,'Filter hidden when map tab not displayed');
map.hidden=false;filter.update();assert(!panel.hidden,'Filter returns when map tab is selected');
assert.equal(root.nodes.length,1,'React map DOM not modified except original MapLibre markers');
console.log('All-stops filter PASS: Scheduled/All, stable marker matching, optional suppression, persistence, and React-safe overlay.');
