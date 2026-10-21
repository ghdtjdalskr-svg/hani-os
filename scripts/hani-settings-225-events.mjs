import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {withoutSettings225} from './hani-settings-225-preservation.mjs';
const main=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const before=withoutSettings225('hani-main.js',main);
const block=(s,name)=>s.match(new RegExp('(?:async )?function '+name+'\\([^]*?\\n\\}'))?.[0];
export function verifyOwnerBinding(){
 const name='bindCloudBridgeControls',binding=block(main,name);
 assert.ok(binding);assert.equal(binding,block(before,name),'original Cloud event owner byte-identical');
 assert.equal(block(main,'cloudVerifySourceOwner'),block(before,'cloudVerifySourceOwner'),'diagnostic/protection owner byte-identical');
 const button={};let calls=0;
 const ctx=vm.createContext({$:id=>id==='cloudVerifySourceOwner'?button:null,cloudVerifySourceOwner:()=>calls++});
 vm.runInContext(binding+'\nbindCloudBridgeControls();',ctx);
 assert.equal(button.onclick,ctx.cloudVerifySourceOwner);button.onclick();assert.equal(calls,1);
}
export function verifyGoalBinding(){
 const name='renderGoalRegistry',render=block(main,name);
 assert.ok(render);assert.equal(render,block(before,name),'original goal form event owner byte-identical');
 const source=fs.readFileSync(new URL('../hani-goal-progress.js',import.meta.url),'utf8');
 const start=source.indexOf('function syncGoalEditor('),end=source.indexOf('function selectQuarterReportTab',start);
 assert.ok(start>=0&&end>start);
 // Real relocation owner against a home slot inside the new records group.
 class Node{
  constructor(){this.children=[]}
  get previousSibling(){return this.parentNode?.children[this.parentNode.children.indexOf(this)-1]||null}
  detach(){if(this.parentNode)this.parentNode.children.splice(this.parentNode.children.indexOf(this),1)}
  appendChild(n){n.detach();this.children.push(n);n.parentNode=this}
  before(n){n.detach();const p=this.parentNode;p.children.splice(p.children.indexOf(this),0,n);n.parentNode=p}
  after(n){n.detach();const p=this.parentNode;p.children.splice(p.children.indexOf(this)+1,0,n);n.parentNode=p}
 }
 const home=new Node(),destination=new Node(),editor=new Node(),handler=()=>{};editor.onsubmit=handler;home.appendChild(editor);
 const ctx=vm.createContext({document:{getElementById:()=>editor,querySelector:()=>destination,createComment:()=>new Node()},monthlyReportBoard:'quarterly',quarterReportTab:'goals',goalEditorHome:null});
 vm.runInContext(source.slice(start,end),ctx);
 ctx.syncGoalEditor('monthlyReport');assert.equal(editor.parentNode,destination);
 ctx.syncGoalEditor('settings');assert.equal(editor.parentNode,home);assert.equal(editor.onsubmit,handler);
 ctx.syncGoalEditor('settings');assert.equal(home.children.length,2);
 // Execute the actual period renderer's change listeners. Re-rendering recreates
 // its fields; the listener must read the current fields by ID inside its host.
 const renderStart=source.indexOf('function render(){'),renderEnd=source.indexOf('// Report consumers',renderStart);
 assert.ok(renderStart>=0&&renderEnd>renderStart);
 let fields={},html='';
 const host={
  set innerHTML(value){
   html=value;fields={};
   for(const id of ['goalProgressYear','goalProgressType','goalProgressQuarter']){
    const segment=value.match(new RegExp(id==='goalProgressYear'?'<input id="'+id+'"[^>]*>':'<select id="'+id+'"[^]*?</select>'))[0];
    const selected=segment.match(/value="([^"]+)" selected/);
    fields[id]={value:id==='goalProgressYear'?segment.match(/value="([^"]+)"/)[1]:selected?.[1],addEventListener(type,fn){assert.equal(type,'change');this.change=fn}};
   }
  },
  querySelectorAll:()=>Object.values(fields),querySelector:s=>fields[s.slice(1)]
 };
 // The blocked read context still renders controls; no auth/data write is needed.
 const controls=vm.createContext({document:{getElementById:id=>id==='goalProgressContent'?host:null},goalPeriodReadContext:()=>null,rendering:false,period:{type:'quarter',year:2025,quarter:4}});
 vm.runInContext(source.slice(renderStart,renderEnd)+'\nrender();',controls);
 assert.match(html,/원본 검증 대기/);fields.goalProgressYear.value='2026';fields.goalProgressYear.change();
 assert.equal(vm.runInContext('period.year',controls),2026);
 assert.equal(vm.runInContext('period.type',controls),'quarter');
 fields.goalProgressQuarter.value='1';fields.goalProgressQuarter.change();assert.equal(vm.runInContext('period.quarter',controls),1);
 fields.goalProgressType.value='annual';fields.goalProgressType.change();assert.equal(vm.runInContext('period.type',controls),'annual');
 assert.match(html,/hidden style="display:none"/);
 fields.goalProgressYear.value='1900';fields.goalProgressYear.change();assert.equal(fields.goalProgressYear.value,2026,'invalid year restores the actual period');
}
