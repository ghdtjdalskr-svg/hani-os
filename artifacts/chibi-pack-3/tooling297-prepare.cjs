// Derive a separate 297 runner from the existing chibi3 tooling; preserve its evidence.
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,read=f=>fs.readFileSync(path.join(dir,f),'utf8'),write=(f,s)=>fs.writeFileSync(path.join(dir,f),s);
let plan=read('plan.cjs').replace('release-29[56]','release-29[4567]').replaceAll("'plan.json'","'tooling297-plan.json'").replaceAll("'GIT-TESTS.md'","'TOOLING-297-GIT-TESTS.md'").replaceAll("base:'7a91982'","base:'bc3b22c8fdaab3bd786980a5e0ca61e28ee3acde'");
write('tooling297-plan.cjs',plan);
write('tooling297-output.cjs',read('output.cjs').replace("path.join(__dirname,'local','generated')","path.join(__dirname,'tooling297-local','generated')"));
let runner=read('run.ps1').replaceAll("'plan.cjs'","'tooling297-plan.cjs'").replaceAll("'plan.json'","'tooling297-plan.json'").replaceAll("'local/","'tooling297-local/").replaceAll('./artifacts/chibi-pack-3/output.cjs','./artifacts/chibi-pack-3/tooling297-output.cjs');
runner=runner.replace(" if($PSBoundParameters.ContainsKey('ResultName')){$resultName=$PSBoundParameters['ResultName']}"," if($PSBoundParameters.ContainsKey('ResultName')){$resultName=$PSBoundParameters['ResultName']}\n if(-not $resultName.StartsWith('tooling297-local/') -or $resultName.Contains('..')){throw 'ResultName must stay in tooling297-local/'}");
write('tooling297-run.ps1',runner);
console.log('Prepared separate 297 plan/output/PowerShell runner');
