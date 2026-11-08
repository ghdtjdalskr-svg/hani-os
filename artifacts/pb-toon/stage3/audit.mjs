import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {head,headRef,main,tree,object} from './read-repository.mjs';
import {resolveRuntimeClosure} from '../../../scripts/hani-runtime-closure.mjs';
const out='artifacts/pb-toon/stage3',read=file=>fs.readFileSync(file);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const blob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const before=JSON.parse(read(out+'/before.json')),mainFiles=tree(main);
assert.equal(head,before.head);assert.equal(main,before.main);assert.equal(headRef,before.headRef);
const touchedRuntime=Object.entries(before.runtimeHashes).filter(([file,digest])=>!fs.existsSync(file)||hash(read(file))!==digest).map(([file])=>file);
assert.deepEqual(touchedRuntime,[],'stage 3 changes no runtime bytes');
const changed=[],missing=[];
for(const file of Object.keys(before.runtimeHashes)){
  if(!fs.existsSync(file)){missing.push(file);continue}
  if(blob(read(file))!==mainFiles[file])changed.push(file);
}
assert.deepEqual(missing,[]);
assert.deepEqual(changed.sort(),['hani-procrastination-board.css','hani-procrastination-board.js']);
const sheet='assets/procrastination/pb-chibi-sheet-v1.webp';
assert.equal(blob(read(sheet)),mainFiles[sheet]);
const original='artifacts/pb-toon/stage3/original-hani-procrastination-board.test.mjs';
assert.deepEqual(read(original),object(mainFiles['scripts/hani-procrastination-board.test.mjs']).body);
const closure=await resolveRuntimeClosure({exists:fs.existsSync,read});assert.deepEqual(closure.missing,[]);
const runtimeCandidates=new Set(Object.keys(before.runtimeHashes));
const walkRuntime=dir=>{for(const entry of fs.readdirSync(dir||'.',{withFileTypes:true})){const file=dir?dir+'/'+entry.name:entry.name;
  if(!dir){if(entry.isFile()&&/\.(js|css|html)$/.test(file))runtimeCandidates.add(file);else if(entry.isDirectory()&&['assets','data','js'].includes(file))walkRuntime(file)}
  else if(entry.isDirectory())walkRuntime(file);else runtimeCandidates.add(file);
}};walkRuntime('');
const addedRuntime=[...runtimeCandidates].filter(f=>!Object.hasOwn(before.runtimeHashes,f)&&!Object.hasOwn(mainFiles,f));
assert.deepEqual(addedRuntime,[],'no untracked runtime files');
const html=read('index.html').toString('utf8'),mainSource=read('hani-main.js').toString('utf8');
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);
const uiScripts=scripts.filter(file=>/hani-ui/.test(file));
const result={head,branch:headRef.replace('refs/heads/',''),localOriginMain:main,remoteFreshness:'Not fetched: user prohibits Git',stage3RuntimeChanged:touchedRuntime,comparedRuntimeFiles:Object.keys(before.runtimeHashes).length,runtimeDiffFromMain:changed,sheetDiffFromMain:0,sheetSha256:hash(read(sheet)),legacyFixtureBlob:mainFiles['scripts/hani-procrastination-board.test.mjs'],legacyFixtureBytesMatchMain:true,addedRuntime,missing,displayVersion:mainSource.match(/const HANI_DISPLAY_VERSION="([^"]+)"/)[1],lastUiScript:uiScripts.at(-1),lastScript:scripts.at(-1),closure:{files:closure.files.length,missing:closure.missing},syntax:'separate node --check',gitCommands:0};
fs.writeFileSync(out+'/runtime-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
