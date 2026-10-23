import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {loadScene,root,at} from './hani-office-lively-fixture.mjs';
const bytes=gunzipSync(fs.readFileSync(new URL('scripts/fixtures/office-obr6-plans.json.gz',root)));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'6d9a5ba005b5607e5c856dc1b96e77d2be493a28e1bbbe831f86719e9543c794','immutable pre-obr6 oracle');
const baseline=JSON.parse(bytes);
// obr7 intentionally changes eight idle sentences. The pre-obr6 oracle stays
// immutable; only these reviewed id/before/after triples adjust snapshot words.
const wordBytes=fs.readFileSync(new URL('scripts/fixtures/office-obr7-snapshot-lines.json',root));
assert.equal(crypto.createHash('sha256').update(wordBytes).digest('hex'),'1434e5d42b55f20b494a553320b1fbb262c401c69976ea8de192d665ad6325ca','frozen obr7 text delta');
const wordDelta=JSON.parse(wordBytes);
for(const expected of baseline.records)test('obr6: '+expected.label+' formal + outing ledger stays byte-identical to pre-patch plans',()=>{
 const {scene,context}=loadScene(),s=scene.scheduler;let writes=0;
 const forbidden=()=>{writes++;throw Error('storage write forbidden')};
 context.localStorage={setItem:forbidden,removeItem:forbidden,clear:forbidden};context.sessionStorage=context.localStorage;
 const formal=s.plan(expected.day,expected.options),outings=s.blockPlan(expected.day,0,formal,expected.options);
 const reviewedSnapshot=structuredClone(expected.snapshot),review=wordDelta.records.find(r=>r.day===expected.day&&r.seconds===expected.seconds);
 assert.ok(review);assert.deepEqual(review.options,expected.options);
 for(const change of review.changes){const person=reviewedSnapshot.entries.find(p=>p.id===change.id);assert.ok(person);assert.equal(person.line,change.before);person.line=change.after}
 // Compare both JSON bytes (key/order/floats) and parsed structures across VM realms.
 for(const [label,actual]of Object.entries({formal,outings,snapshot:s.snapshot(at(expected.day,expected.seconds),expected.options)})){
  const oracle=label==='snapshot'?reviewedSnapshot:expected[label];
  const text=JSON.stringify(actual);assert.equal(text,JSON.stringify(oracle),label+' bytes');assert.deepEqual(JSON.parse(text),oracle,label+' deepEqual');
 }
 assert.equal(writes,0);
});
test('obr6: all anchor pairs keep the pre-patch Dijkstra paths and equal-distance tie order',()=>{
 const expected=JSON.parse(fs.readFileSync(new URL('scripts/fixtures/office-obr6-routes.json',root),'utf8'));
 const {scene}=loadScene();assert.deepEqual([...scene.anchors.keys()],expected.ids);
 for(const {from,sha256}of expected.rows){
  const paths=JSON.stringify(expected.ids.map(to=>scene.route(from,to).map(a=>a.id)));
  assert.equal(crypto.createHash('sha256').update(paths).digest('hex'),sha256,from+' all destinations');
 }
});
