// Reuse the real helper's existing DOM fixture; no browser, Git or store writes.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const rosterContext={window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]}};
vm.runInNewContext(read('hani-organization-hub.js'),rosterContext);
const harness=read('scripts/hani-helper-bot.test.mjs'),start=harness.indexOf('function fixture('),end=harness.indexOf('// END HANI HELPER TEST FIXTURE',start);
assert.ok(start>=0&&end>start,'existing fixture anchors');
const ui=read('hani-ui-v02992.js'),ownerStart=ui.indexOf('// BEGIN HANI HELPER BOT');assert.ok(ownerStart>=0);
const fixture=vm.runInNewContext(harness.slice(start,end)+';fixture',{
 vm,assert,staff:rosterContext.window.HaniOrganizationRoster.people,source:ui.slice(ownerStart),
 tapBank:JSON.parse(read('assets/data/office-tap-lines-v1.json')),releases:JSON.parse(read('assets/data/hani-history-releases-v1.json'))
});
(async()=>{
 const f=fixture();await f.ready();const helper=f.document.getElementById('haniHelperBot');
 const gate=new f.Element('section');gate.id='loginGate';gate.box={left:0,top:0,width:390,height:844};
 gate.computed={visibility:'visible',opacity:'.5'};f.document.body.append(gate);f.mutate(gate);
 assert.equal(helper.hidden,true);assert.equal(helper.dataset.helperReason,'login');
 // A CSS-only transition completion creates no new DOM mutation for the owner.
 gate.computed={visibility:'hidden',opacity:'0'};assert.equal(helper.hidden,true);
 f.api.update();f.flush();assert.equal(helper.hidden,false);assert.equal(helper.dataset.helperReason,'shown');
 const modal=new f.Element('section');modal.setAttribute('role','dialog');modal.box={left:0,top:0,width:100,height:100};f.document.body.append(modal);
 f.api.update();f.flush();assert.equal(helper.hidden,true);assert.equal(helper.dataset.helperReason,'modal');
 modal.hidden=true;f.api.update();f.flush();assert.equal(helper.hidden,false);
 assert.deepEqual(Array.from(f.storageCalls).filter(c=>c[0]!=='getItem'),[],'setup adds no writes');
 const result={result:'PASS',checks:['visible fading gate hides helper','CSS-only gate completion can leave stale login reason','public update after hidden gate shows helper','external modal still hides helper','closing modal + public update restores helper','zero storage writes'],note:'Actual owner + existing DOM fixture; CSS painting/Edge remains unverified.'};
 fs.writeFileSync(path.join(__dirname,'helper-setup.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(error=>{console.error(error);process.exitCode=1});
