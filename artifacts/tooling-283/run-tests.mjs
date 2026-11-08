import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const out='artifacts/tooling-283',group=process.argv[2]||'features';
const node=process.execPath,edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const env={...process.env,NODE_PATH:path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),NODE_OPTIONS:'--require ./artifacts/life-bundle/no-git-283.cjs',HANI_BRANCH_BASELINE:path.resolve('../rel282'),HANI_MAIN_BASELINE:path.resolve('../rel282'),HANI_QA_CHROME:edge};
const groups={
 features:['hani-life-bundle-source.test.mjs','hani-study-retry.test.mjs','hani-procrastination-board.test.mjs','hani-wishlist-quick-add.test.mjs','hani-dev-report-generate.test.mjs'],
 m9:['hani-seoyun-m9.test.mjs','hani-m9-link.test.mjs','hani-m9-polish.test.mjs'],
 nav:['hani-nav-groups.test.mjs','hani-navlogin.test.mjs','hani-dashboard-period.test.mjs'],
 ui:['hani-navlogin-ui.test.mjs','hani-navigation-state-ui.test.mjs','hani-dashboard-period-ui.test.mjs','hani-character-archive-ui.test.cjs'],
 office:fs.readdirSync('scripts').filter(f=>/^hani-office-.*\.test\.mjs$/.test(f)).sort()
};
if(group==='features'){delete env.HANI_BRANCH_BASELINE;delete env.HANI_MAIN_BASELINE;}
const rows=[];
const selected=process.argv.slice(3);
for(const file of selected.length?selected:groups[group]){
 let args=[];
 if(file==='hani-seoyun-m9.test.mjs')args.push('--require','./scripts/hani-m9-polish-preload.cjs','--require','./scripts/hani-m9-link-preload.cjs');
 else if(file==='hani-m9-link.test.mjs')args.push('--require','./scripts/hani-m9-polish-preload.cjs');
 else if(group!=='ui')args.push('--import','./scripts/hani-life-bundle-preload.mjs');
 if(group!=='ui'){args.push('--test');if(group!=='features')args.push('--test-isolation=none');args.push('--test-reporter=tap');}
 args.push('scripts/'+file);
 if(group==='ui'&&file.endsWith('.mjs'))args.push(path.join(env.NODE_PATH,'playwright/index.mjs'),edge);
 const start=Date.now(),log=out+'/'+group+'-'+file+'.log',stream=fs.createWriteStream(log);
 let text='';
 const result=await new Promise(resolve=>{
  const child=spawn(node,args,{env,windowsHide:true});
  child.stdout.on('data',b=>{stream.write(b);text+=b;});child.stderr.on('data',b=>{stream.write(b);text+=b;});
  child.on('error',error=>resolve({exit:null,error:String(error)}));
  child.on('close',(exit,signal)=>{stream.end();resolve({exit,signal});});
 });
 const summary=text.split(/\r?\n/).filter(s=>/^not ok|USER_GIT_DISABLED|AssertionError|^Error:|^# (tests|pass|fail|skipped)|^PASS|^FAIL/.test(s)).map(s=>s.slice(0,260));
 rows.push({file,...result,seconds:Math.round((Date.now()-start)/1000),command:'node '+args.join(' '),log,summary});
 fs.writeFileSync(out+'/'+group+(selected.length?'-retry':'')+'-results.json',JSON.stringify(rows,null,2));
 console.log(file+' exit='+result.exit+' '+summary.filter(s=>/^# (tests|pass|fail|skipped)/.test(s)).join(' '));
 if(result.exit!==0)console.log(summary.filter(s=>!s.startsWith('# ')).slice(0,4).join('\n'));
}
