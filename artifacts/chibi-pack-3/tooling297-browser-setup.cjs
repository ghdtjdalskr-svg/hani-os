// VM setup only: no HTTP server, child process, browser or screenshot.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),source=fs.readFileSync(path.join(root,'scripts/hani-chibi-pack-3.browser.mjs'),'utf8');
const start=source.indexOf('  const setup=()=>{'),end=source.indexOf('  fs.mkdirSync(out,',start);assert.ok(start>0&&end>start);
const nodes={loginGate:{style:{}},app:{classList:{remove(value){assert.equal(value,'login-locked')}},inert:true}};
const context={document:{getElementById:id=>nodes[id]},state:{ui:{},diaries:['synthetic'],movies:['synthetic'],monthlyReports:['synthetic']}};
vm.createContext(context);
const result=JSON.parse(vm.runInContext(source.slice(start,end)+';setup();JSON.stringify({cases:cases.map(({name,view,id})=>({name,view,id})),state,month:monthlyReportMonth,board:monthlyReportBoard,generation:monthlyReportGeneration,failure:monthlyReportGenerationFailure})',context));
assert.deepEqual(result.cases.map(r=>r.name),['home-birthday-1121','home-nonbirthday-1122','diary-empty','movie-empty','monthly-empty']);
assert.deepEqual(result.state.diaries,[]);assert.deepEqual(result.state.movies,[]);assert.deepEqual(result.state.monthlyReports,[]);
assert.equal(nodes.loginGate.style.display,'none');assert.equal(nodes.app.inert,false);assert.equal(result.month,'2026-10');assert.equal(result.board,'monthly');assert.equal(result.generation,null);assert.equal(result.failure,null);
const release=require('../../scripts/hani-release-297-source.cjs'),repository=require('../../scripts/hani-test-repository-evidence.cjs');
const owners=['index.html','hani-main.js','hani-street-journal.css','assets/data/hani-history-releases-v1.json'];
const hashes=Object.fromEntries(owners.map(file=>{const bytes=release.readRawFileSync(path.join(root,file),'utf8');assert.equal(bytes,repository.read('bc3b22c',file));return [file,release.hash(bytes)]}));
const report={status:'PASS_SETUP_ONLY',base:repository.resolve('bc3b22c'),...result,sourceHashes:hashes,screenshotsPlanned:10,actualEdge:false,pixels:'NOT_RUN',evidenceDirectory:'artifacts/chibi-pack-3/tooling297-local/browser/'};
fs.writeFileSync(path.join(__dirname,'tooling297-browser-setup.json'),JSON.stringify(report,null,2)+'\n');console.log({status:report.status,cases:result.cases.length,actualEdge:false});
