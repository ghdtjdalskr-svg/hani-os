import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {assertNoNewDuplicateIds} from './hani-duplicate-id-guard.mjs';
import {readMainBaseline,root} from './hani-regression-baseline.mjs';
test('guard rejects new collisions across HTML, referenced JS, CSS imports and escaped literals',()=>{
 const base={'index.html':'<div id="login"><script src="./ui.js?v=1"></script><link href="./ui.css" rel="stylesheet">','ui.js':'<p id="old"></p><p id="old"></p>','ui.css':'@import "./nested.css";','nested.css':''};
 const read=map=>file=>{assert.ok(Object.hasOwn(map,file),file);return map[file]};
 assert.doesNotThrow(()=>assertNoNewDuplicateIds(read(base),read(base)));
 for(const [file,addition]of [['ui.js','<p id="login">'],['nested.css','/* id="login" */'],['ui.js','<p id=\\"login\\">'],['ui.js','<p id="old">'],['ui.css','/* id="new" id="new" */']]){
  assert.throws(()=>assertNoNewDuplicateIds(read({...base,[file]:base[file]+addition}),read(base)),/new duplicate id=/);
 }
 assert.doesNotThrow(()=>assertNoNewDuplicateIds(read({...base,'ui.js':base['ui.js']+'<p data-id="login">'}),read(base)));
});
test('index and all referenced JS/CSS introduce no new duplicate literals versus origin/main',()=>{
 console.log(assertNoNewDuplicateIds(file=>fs.readFileSync(path.join(root,file),'utf8'),readMainBaseline));
});
