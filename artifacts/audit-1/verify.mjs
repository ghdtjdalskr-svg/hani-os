import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),repo=require('../../scripts/hani-test-repository-evidence.cjs'),support=require('../../scripts/qa-1st-test-support.cjs');
const hash=s=>createHash('sha256').update(s).digest('hex'),local=path.join(import.meta.dirname,'local');
const fixture=JSON.parse(fs.readFileSync('scripts/fixtures/audit-1-delta.json','utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(local,'preservation-before.json'),'utf8'));
const allowed=new Set([...Object.keys(fixture.files),'docs/development-history/handoffs/2026-11-19-audit-1.md']);
const changed=[],missing=[];
for(const [file,pin]of Object.entries(baseline)){
 if(!fs.existsSync(file)){missing.push(file);continue;}
 if(hash(fs.readFileSync(file))!==pin)changed.push(file);
}
assert.deepEqual(missing,[]);assert.deepEqual(changed.filter(f=>!allowed.has(f)),[],'no unrelated original changes');
const fixtureFiles=Object.keys(baseline).filter(f=>f.startsWith('scripts/fixtures/'));
assert.ok(fixtureFiles.every(f=>hash(fs.readFileSync(f))===baseline[f]),'all old fixtures preserved');
const testFiles=Object.keys(baseline).filter(f=>f.startsWith('scripts/')&&/test|smoke/.test(f));
assert.ok(testFiles.every(f=>hash(fs.readFileSync(f))===baseline[f]),'all old tests preserved');
function writes(source){
 const ast=support.parser().parse(source,{ecmaVersion:'latest'}),rows=[];
 function visit(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee?.type==='MemberExpression'){
   const prop=node.callee.property?.name||node.callee.property?.value,owner=source.slice(node.callee.object.start,node.callee.object.end);
   if((['setItem','removeItem','clear'].includes(prop)&&/localStorage/.test(owner))||['insert','update','upsert','delete'].includes(prop))rows.push(source.slice(node.start,node.end));
  }
  for(const v of Object.values(node))if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);
 }
 visit(ast);return rows;
}
const safety=[],syntax=[],eol=[];
for(const [file,row]of Object.entries(fixture.files)){
 const source=fs.readFileSync(file,'utf8'),before=repo.read(fixture.base,file);
 assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
 const linebreaks=s=>({crlf:(s.match(/\r\n/g)||[]).length,lf:(s.match(/(?<!\r)\n/g)||[]).length});eol.push({file,before:linebreaks(before),after:linebreaks(source)});
 if(file.endsWith('.js')||file.endsWith('.cjs')){
  support.parser().parse(source,{ecmaVersion:'latest',allowReturnOutsideFunction:true});syntax.push(file);
  assert.deepEqual(writes(source),writes(before),'unchanged localStorage and mutation calls '+file);safety.push(file);
 }
}
for(const f of ['hani-board.js','hani-office-live.js'])assert.equal(hash(fs.readFileSync(f)),baseline[f],'queen-only bytes preserved '+f);
for(const f of ['hani-book-share-parse.js','scripts/hani-book-share-parse.test.mjs','.gitignore','assets/data/ai-team-status.json','godsaeng_icon_webtoon.png','assets/design-system-v1/hani-galaxy-characters-v2.png'])if(baseline[f])assert.equal(hash(fs.readFileSync(f)),baseline[f],f+' preserved');
const html=fs.readFileSync('index.html','utf8'),old=repo.read(fixture.base,'index.html');
assert.deepEqual(html.match(/\?v=[^"']+/g),old.match(/\?v=[^"']+/g),'cache tags unchanged');
const main=fs.readFileSync('hani-main.js','utf8'),oldMain=repo.read(fixture.base,'hani-main.js');
for(const re of [/HANI_DISPLAY_VERSION[^\r\n]*/g,/2\.9\.15-safe-baseline-bootstrap/g])assert.deepEqual(Array.from(main.match(re)||[]),Array.from(oldMain.match(re)||[]),'version baseline unchanged');
const hist=JSON.parse(fs.readFileSync('assets/data/hani-history-releases-v1.json','utf8')),oldHist=JSON.parse(repo.read(fixture.base,'assets/data/hani-history-releases-v1.json'));
const row=oldHist.entries.find(r=>r.id==='v2.9.292');assert.equal(row.title,'사무실 직원을 눌러도 말풍선이 가끔 안 뜨던 문제 수정');row.title='직원 말풍선 가끔 안 뜨던 문제 수정';assert.deepEqual(hist,oldHist,'single history title change only');
assert.deepEqual(fs.readFileSync('assets/data/hani-history-releases-v1.json'),fs.readFileSync('../histfix/assets/data/hani-history-releases-v1.json'),'same Seoyun data correction');
const out={base:fixture.base,contract:hash(fs.readFileSync('scripts/fixtures/audit-1-delta.json')),originalFiles:Object.keys(baseline).length,changed,missing,oldFixturesPreserved:fixtureFiles.length,oldTestsPreserved:testFiles.length,syntax,safety,eol,protectedWrites:'unchanged',cloudSchema:'unchanged',cacheVersion:'unchanged',queenBytes:'preserved',parser:'preserved',dataTitle:'histfix byte-exact'};
fs.writeFileSync(path.join(local,'verification.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,eol:undefined}));
