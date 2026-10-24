import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import support from './qa-1st-test-support.cjs';
import {assertNoNewDuplicateIds} from './hani-duplicate-id-guard.mjs';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),baseline=path.resolve(process.argv[2]||path.join(root,'artifacts/qa-1st/baseline'));
const files=['hani-main.js','hani-asset-update-v1.js','hani-context-remote-v1.js','hani-context-remote.css','hani-design-system.css','hani-study-v02984.js','hani-yuna-helpdesk.js','hani-investment-committee.js','hani-asset-market-view.js','index.html'];
const read=file=>fs.readFileSync(path.join(root,file),'utf8'),readBase=file=>fs.existsSync(path.join(baseline,file))?fs.readFileSync(path.join(baseline,file),'utf8'):read(file);
const parse=text=>support.parser().parse(text,{ecmaVersion:'latest'});
function storageCalls(text){const calls=[];function visit(node){if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee.type==='MemberExpression'){
    const callee=text.slice(node.callee.start,node.callee.end),method=node.callee.property.name;
    if(/(?:localStorage|sessionStorage)\b/.test(callee)||['insert','update','upsert','delete'].includes(method)&&callee.includes('.from('))calls.push(text.slice(node.start,node.end));
  }
  for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
}visit(parse(text));return calls.sort();}
for(const file of files){const before=readBase(file),after=read(file);
  if(file.endsWith('.js')){new vm.Script(after,{filename:file});assert.equal(JSON.stringify(storageCalls(after)),JSON.stringify(storageCalls(before)),file+': storage or Cloud write call changed');assert.equal((after.match(/\.clear\s*\(/g)||[]).length,(before.match(/\.clear\s*\(/g)||[]).length,file+': new clearing call');}
}
const mainBefore=readBase('hani-main.js'),mainAfter=read('hani-main.js');
for(const name of ['save','commit','freshState','normalizeState'])assert.equal(support.functionCode(name,mainAfter),support.functionCode(name,mainBefore),'canonical '+name+' changed');
assert.equal(mainAfter.match(/^const n=v=>.*$/m)[0],mainBefore.match(/^const n=v=>.*$/m)[0],'stored-record numeric normalization changed');
const version=file=>[...file.matchAll(/(?:\?v=|HANI_DISPLAY_VERSION\s*=\s*["'])[^"'<>\s]+/g)].map(m=>m[0]);
assert.deepEqual(version(read('index.html')),version(readBase('index.html')),'version/cache tags changed');
assert.equal(mainAfter.match(/^const STORAGE_KEY=.*$/m)?.[0],mainBefore.match(/^const STORAGE_KEY=.*$/m)?.[0],'protected key changed');
const duplicates=assertNoNewDuplicateIds(read,readBase);
// The diff ignores EOL only so unchanged line positions can be mapped precisely.
const diff=fs.readFileSync(path.join(root,'artifacts/qa-1st/eol-map.diff'),'utf8');
let current=null;const hunks=new Map();for(const line of diff.split('\n')){const file=line.match(/^\+\+\+ b\/(.*)$/);if(file){current=file[1];hunks.set(current,[]);}const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(h&&current)hunks.get(current).push({old:Number(h[1]),oldCount:h[2]===undefined?1:Number(h[2]),now:Number(h[3]),newCount:h[4]===undefined?1:Number(h[4])});}
let eolLines=0;for(const file of files){const split=text=>text.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[],before=split(readBase(file)),after=split(read(file));let old=0,now=0;
  for(const h of [...hunks.get(file)||[],{old:before.length,now:after.length,oldCount:0,newCount:0}]){
    const oldStart=h.oldCount?h.old-1:h.old,newStart=h.newCount?h.now-1:h.now;
    while(old<oldStart&&now<newStart){assert.equal(after[now],before[old],`${file}: unchanged line/EOL changed at ${old+1}/${now+1}`);old++;now++;eolLines++;}
    assert.equal(old,oldStart,file+': old diff map');assert.equal(now,newStart,file+': new diff map');old+=h.oldCount;now+=h.newCount;
  }
}
const result={status:'PASS',syntax:files.filter(file=>file.endsWith('.js')).length+' runtime JS',canonicalPersistence:'unchanged',storageCloudCalls:'unchanged',versionCache:'unchanged',duplicates,unchangedLinesWithExactEol:eolLines};
fs.writeFileSync(path.join(root,'artifacts/qa-1st/safety-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
