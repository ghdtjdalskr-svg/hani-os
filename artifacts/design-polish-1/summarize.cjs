const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=f=>{const b=fs.readFileSync(f);return b.toString(b[0]===255&&b[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'')};
const plan=JSON.parse(read(path.join(__dirname,'test-plan.json'))),rows=JSON.parse(read(path.join(__dirname,'test-results.json')));
for(const row of rows){
 const log=read(path.join(root,row.log));
 for(const metric of ['tests','pass','fail','skipped'])row[metric]=Number([...log.matchAll(new RegExp('(?:ℹ |# )'+metric+' ([0-9]+)','g'))].at(-1)?.[1]||0);
 if(row.exitCode!==0)row.failure=log.split(/\r?\n/).find(line=>/AssertionError|Error:|✖ /.test(line))?.slice(0,240)||'See log';
}
const total=rows=>({files:rows.length,successful:rows.filter(r=>r.exitCode===0).length,failed:rows.filter(r=>r.exitCode!==0).length,tests:rows.reduce((s,r)=>s+r.tests,0),pass:rows.reduce((s,r)=>s+r.pass,0),fail:rows.reduce((s,r)=>s+r.fail,0),skip:rows.reduce((s,r)=>s+r.skipped,0)});
const report={base:plan.base,node:process.version,sourceHashes:Object.fromEntries(['hani-main.js','hani-design-system.css','scripts/fixtures/design-polish-1-delta.json'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),all:total(rows),office:total(rows.filter(r=>r.office)),failures:rows.filter(r=>r.exitCode!==0),nonTapPass:rows.filter(r=>r.exitCode===0&&!r.tests).map(r=>r.file),gitRequired:plan.plan.filter(r=>r.status==='GIT_REQUIRED'),browserDelegated:plan.plan.filter(r=>r.status==='BROWSER_DELEGATED'),results:rows};
fs.writeFileSync(path.join(__dirname,'test-summary.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({all:report.all,office:report.office,failures:report.failures.map(r=>({file:r.file,knownFailure:r.knownFailure,failure:r.failure})),nonTapPass:report.nonTapPass,git:report.gitRequired.length,browser:report.browserDelegated.length},null,2));
