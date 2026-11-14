// Derive the existing per-file runner without modifying its preserved 295 evidence.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8'),write=(name,text)=>fs.writeFileSync(path.join(__dirname,name),text);
let plan=read('rebase295-plan.cjs').replaceAll('rebase295','tooling296').replaceAll('REBASE-295','TOOLING-296').replace("base:'dfe8194'","base:'56c3105'").replace('release-29[45]','release-29[456]').replace("||/quiz|study/.test(f)","||/quiz|study/.test(f)||['hani-app-216-audit.test.cjs','hani-qa-easy-cleanup.test.mjs'].includes(f)");
assert.ok(plan.includes('release-29[456]'));assert.ok(plan.includes('hani-app-216-audit.test.cjs'));
write('tooling296-plan.cjs',plan);
let run=read('rebase295-run.ps1').replaceAll('rebase295','tooling296').replace("'tooling296-test-logs'","'tooling296-local/test-logs'").replace("'tooling296-git-results.json'","'tooling296-local/git-results.json'").replace("'tooling296-results.json'","'tooling296-local/results.json'").replace("'tooling296-initial-failures'","'tooling296-local/initial-failures'");
run=run.replace("$argsForTest+=@('--test'","$argsForTest+=@('--require','./artifacts/design-polish-1/tooling296-output.cjs')\n  $argsForTest+=@('--test'");
write('tooling296-run.ps1',run);
let summary=read('rebase295-summarize.cjs').replaceAll('rebase295','tooling296').replaceAll('REBASE-295','TOOLING-296').replaceAll('design295','tooling296').replaceAll('dfe81946aab6147c829ed0ee0a1c9f239c364d03','56c3105391cec207d9c55a4a3bbf76906749a0a4').replaceAll("'tooling296-results.json'","'tooling296-local/results.json'");
summary=summary.replace('process guard only.','process guard and generated-output routing only.');
summary=summary.replace("const inputs=[", "const inputs=['scripts/hani-release-296-source.cjs','scripts/hani-release-296.test.mjs','scripts/hani-release-295-input.cjs',");
write('tooling296-summarize.cjs',summary);
console.log('Prepared tooling296 plan/run/summary; 295 originals unchanged.');
