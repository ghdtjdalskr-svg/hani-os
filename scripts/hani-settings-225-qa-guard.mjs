import assert from 'node:assert/strict';
import vm from 'node:vm';
import support from './qa-1st-test-support.cjs';

// A single named integration exception, checked against release bytes. Never
// normalize arbitrary wrappers or ignore handler differences in the browser.
export function verifySettingsQaGuard(source,baseline,html,plan){
 const section=html.slice(html.indexOf('<section id="settings"'),html.indexOf('<section id="reading"'));
 const ids=new Set([...section.matchAll(/\bid="([^"]+)"/g),...plan.matchAll(/^\| `#([\w-]+)`/gm)].map(m=>m[1]));
 const assignments=text=>{
  const rows=[];const visit=node=>{
   if(!node||typeof node!=='object')return;
   if(node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&/^on\w+$/.test(node.left.property.name)){
    const object=node.left.object,id=object.type==='CallExpression'&&object.callee.name==='$'?object.arguments[0]?.value:null;
    if(ids.has(id))rows.push({id,event:node.left.property.name,node:node.right,code:text.slice(node.right.start,node.right.end)});
   }
   for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  };visit(support.parser().parse(text,{ecmaVersion:'latest'}));return rows;
 };
 const old=assignments(baseline),now=assignments(source),changes=[];
 assert.deepEqual(now.map(r=>[r.id,r.event]),old.map(r=>[r.id,r.event]),'same settings event assignment owners/order');
 for(let i=0;i<now.length;i++){
  const row=now[i];if(row.code===old[i].code)continue;
  assert.equal(row.id,'goalRegistryApprove','no other settings handler may change');assert.equal(row.event,'onclick');
  assert.equal(row.node.type,'CallExpression');assert.equal(row.node.callee.name,'saveEntry');assert.equal(row.node.arguments.length,2);
  const [button,handler]=row.node.arguments;
  assert.equal(source.slice(button.start,button.end),'$("goalRegistryApprove")');
  assert.equal(source.slice(handler.start,handler.end),old[i].code,'approved inner handler retains every original byte');
  changes.push(row.id);
 }
 assert.deepEqual(changes,['goalRegistryApprove'],'one explicit QA guard in settings');
 for(const name of ['save','commit','freshState','normalizeState','exportData','bindCloudBridgeControls'])
  assert.equal(support.functionCode(name,source),support.functionCode(name,baseline),name+' original owner unchanged');

 // Invoke the actual binding and inner approval handler against memory-only
 // fixtures. The save boundary is a spy; no browser/storage/Cloud is available.
 const make=(valid=true)=>{
  const controls=new Map(),get=id=>{if(!controls.has(id))controls.set(id,{id,disabled:false,attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}});return controls.get(id)};
  let saves=0,renders=0;
  const ctx=vm.createContext({$:get,document:{getElementById:get},structuredClone,Promise,
   validateSaveDateScope:()=>valid,state:{goalRegistry:[{id:'old'}]},goalRegistryDraft:{before:'[{"id":"old"}]',next:[{id:'next'}]},
   save:()=>{saves++;return {ok:true}},renderGoalRegistry:()=>renders++,dataHubInvalidate:()=>{},dataHubRefresh:()=>{}});
  vm.runInContext(support.functionCode('pendingSaveEntries',source)+'\n'+support.functionCode('saveEntry',source)+'\n'+support.functionCode('bindGoalRegistryPreview',source)+'\nbindGoalRegistryPreview();',ctx);
  return {ctx,get,counts:()=>({saves,renders})};
 };
 const good=make();good.get('goalRegistryApprove').onclick();
 assert.deepEqual(good.counts(),{saves:1,renders:1});assert.equal(good.ctx.state.goalRegistry[0].id,'next');
 good.get('goalRegistryApprove').onclick();assert.deepEqual(good.counts(),{saves:1,renders:1},'second approval after draft cleared cannot save again');
 assert.equal(good.get('goalRegistryApprove').disabled,false);assert.deepEqual(good.get('goalRegistryApprove').attrs,{});
 const invalid=make(false),before=JSON.stringify(invalid.ctx.state);invalid.get('goalRegistryApprove').onclick();
 assert.equal(JSON.stringify(invalid.ctx.state),before);assert.deepEqual(invalid.counts(),{saves:0,renders:0});
 const stale=make();stale.ctx.goalRegistryDraft.before='stale';stale.get('goalRegistryApprove').onclick();
 assert.equal(stale.ctx.state.goalRegistry[0].id,'old');assert.deepEqual(stale.counts(),{saves:0,renders:0});
 const failed=make();failed.ctx.save=()=>({ok:false});const original=failed.ctx.state.goalRegistry;failed.get('goalRegistryApprove').onclick();
 assert.equal(failed.ctx.state.goalRegistry,original,'failed save restores original in-memory registry');assert.equal(failed.get('goalRegistryApprove').disabled,false);
 const cancel=make();cancel.get('goalRegistryCancel').onclick();assert.deepEqual(cancel.counts(),{saves:0,renders:0});assert.equal(cancel.ctx.goalRegistryDraft,null);
 const guard=make(),button=guard.get('guardProbe');let calls=0;
 const wrapped=guard.ctx.saveEntry(button,()=>{calls++;wrapped();});wrapped();assert.equal(calls,1,'synchronous re-entry invokes original once');
 assert.equal(button.disabled,false);assert.deepEqual(button.attrs,{});
 const throwing=guard.ctx.saveEntry(button,()=>{throw Error('synthetic failure')});assert.throws(throwing,/synthetic failure/);assert.equal(button.disabled,false);assert.deepEqual(button.attrs,{});
 return `${now.length} settings property assignments: only goalRegistryApprove wrapped, original body/persistence owners exact; approval/invalid/stale/failure/cancel/re-entry/release executed with no IO`;
}
