import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import {validateLibrary,renderLibrary,buildLibrary} from "./hani-board-library-build.mjs";
import {fixture,seed} from "./hani-board-library-fixture.mjs";

assert.equal(validateLibrary(fixture,seed).length,3);
const probe=change=>validateLibrary([{...structuredClone(fixture[0]),...change}],seed);
for(const authorId of ["not-a-person","seongmin"])assert.throws(()=>probe({authorId}),/authorId/);
assert.throws(()=>validateLibrary([fixture[0],fixture[0]],seed),/duplicate/);
for(const change of [{category:"UNKNOWN"},{season:"rainy"},{weekday:8},{topics:null},{title:"[사내 세계관 이야기]"}])assert.throws(()=>probe(change));
for(const change of [{authorId:"unknown"},{afterMin:-1},{afterMin:NaN},{replyTo:0},{body:"에 관한 제 생각:"}])
  assert.throws(()=>probe({comments:[{...fixture[0].comments[0],...change}]}));
assert.throws(()=>probe({comments:[{...fixture[0].comments[0],afterMin:10},{...fixture[0].comments[1],replyTo:0,afterMin:5}]}));
const normalized=probe({season:"가을",weekday:"월요일",comments:[fixture[0].comments[0],{...fixture[0].comments[1],replyTo:"hina"}]})[0];
assert.deepEqual(normalized.season,["autumn"]);assert.deepEqual(normalized.weekday,[1]);assert.equal(normalized.comments[1].replyTo,0);
const ctx=vm.createContext({});vm.runInContext(renderLibrary(fixture),ctx);
assert.ok(Object.isFrozen(ctx.HaniBoardLibrary)&&Object.isFrozen(ctx.HaniBoardLibrary.threads[0].comments[0]));

const root=await fs.mkdtemp(path.join(os.tmpdir(),"hani-board-library-test-"));
try{
  await fs.mkdir(path.join(root,"data/board-library"),{recursive:true});
  await fs.writeFile(path.join(root,"data/hani-relationship-seed-v1.json"),JSON.stringify(seed));
  assert.equal((await buildLibrary({root})).threads,0);await buildLibrary({root,check:true});
  await fs.writeFile(path.join(root,"data/board-library/part-b.json"),JSON.stringify({threads:fixture.slice(1)}));
  await fs.writeFile(path.join(root,"data/board-library/part-a.json"),JSON.stringify(fixture.slice(0,1)));
  assert.equal((await buildLibrary({root})).threads,3);await buildLibrary({root,check:true});
  const runtime=await fs.readFile(path.join(root,"hani-board-library.js"),"utf8");
  const combined=vm.createContext({});vm.runInContext(runtime,combined);
  assert.equal(combined.HaniBoardLibrary.threads[0].id,fixture[0].id,"sorted merge");
  await fs.writeFile(path.join(root,"hani-board-library.js"),"stale");
  await assert.rejects(buildLibrary({root,check:true}),/stale/);
}finally{
  const resolved=path.resolve(root);
  assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith("hani-board-library-test-"));
  await fs.rm(resolved,{recursive:true,force:true});
}
console.log("PASS: library merge/check, empty build, ids, schema, timing, reply links, restrictions and frozen runtime");
