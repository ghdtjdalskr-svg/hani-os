import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {loadScene,root,at,readAt} from './hani-office-lively-fixture.mjs';
const bytes=gunzipSync(fs.readFileSync(new URL('scripts/fixtures/office-obr6-plans.json.gz',root)));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'6d9a5ba005b5607e5c856dc1b96e77d2be493a28e1bbbe831f86719e9543c794','immutable pre-obr6 oracle');
const baseline=JSON.parse(bytes);
// obr7 intentionally changes eight idle sentences. The pre-obr6 oracle stays
// immutable; only these reviewed id/before/after triples adjust snapshot words.
const wordBytes=fs.readFileSync(new URL('scripts/fixtures/office-obr7-snapshot-lines.json',root));
assert.equal(crypto.createHash('sha256').update(wordBytes).digest('hex'),'1434e5d42b55f20b494a553320b1fbb262c401c69976ea8de192d665ad6325ca','frozen obr7 text delta');
const wordDelta=JSON.parse(wordBytes);
// obr8 deliberately changes optional physical trips. Keep the pre-obr6 oracle
// and obr7 text delta intact; freeze the complete new outings/snapshots separately.
const obr8Bytes=gunzipSync(fs.readFileSync(new URL('scripts/fixtures/office-obr8-plans.json.gz',root)));
assert.equal(crypto.createHash('sha256').update(obr8Bytes).digest('hex'),'b759894f164a271fa7273557fec41cee78b0db4dcb48de015435ffec313bed7f','reviewed obr8 full physical delta');
const obr8=JSON.parse(obr8Bytes);
assert.equal(obr8.sourceSha256,'54fbf9a6f0301acf8c6e52d7ed3dc0ab8d05d684b763e84d2563f677981c6885','immutable obr8 source identity');
// Keep the obr8/obr9 byte proof historical. obr10 is an intentional reviewed
// behavior delta with its own immutable oracle, authored outside test execution.
const obr10Bytes=gunzipSync(fs.readFileSync(new URL('scripts/fixtures/office-obr10-plans-v5.json.gz',root)));
assert.equal(crypto.createHash('sha256').update(obr10Bytes).digest('hex'),'d7c46b5789d725ee5e8d434d1d604b5f5f78db96beebe3a1cf9d5b6e1ac77eeb','reviewed obr10 behavior delta: unique task IDs, original generic actions, personal words, novel errands, individual dwell cap and 30px optional crossing buffer');
const obr10=JSON.parse(obr10Bytes);
assert.equal(crypto.createHash('sha256').update(readAt('hani-office-live.js','0d47015')).digest('hex'),obr10.sourceSha256,'immutable pre-obr12 runtime identity');
const released233=readAt('hani-office-live.js','beffc38');
assert.equal(crypto.createHash('sha256').update(released233).digest('hex'),'6cd4b68f14aa435d3de6d00e4b535ca74ebf6baed225b0c818506e911e3d2b21','exact shipped obr12 runtime identity; historical frozen behavior oracle unchanged');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('data/hani-building/office-places.json',root))).digest('hex'),obr10.placesSha256,'reviewed obr10 data identity');
for(const expected of baseline.records)test('obr6/obr8: '+expected.label+' original formal bytes and reviewed optional-trip/snapshot bytes',()=>{
 const {scene,context}=loadScene({transform:()=>released233}),s=scene.scheduler;let writes=0;
 const forbidden=()=>{writes++;throw Error('storage write forbidden')};
 context.localStorage={setItem:forbidden,removeItem:forbidden,clear:forbidden};context.sessionStorage=context.localStorage;
 const formal=s.plan(expected.day,expected.options),outings=s.blockPlan(expected.day,0,formal,expected.options);
 const reviewedSnapshot=structuredClone(expected.snapshot),review=wordDelta.records.find(r=>r.day===expected.day&&r.seconds===expected.seconds);
 assert.ok(review);assert.deepEqual(review.options,expected.options);
 for(const change of review.changes){const person=reviewedSnapshot.entries.find(p=>p.id===change.id);assert.ok(person);assert.equal(person.line,change.before);person.line=change.after}
 const physicalReview=obr10.records.find(r=>r.day===expected.day&&r.seconds===expected.seconds);assert.ok(physicalReview);assert.deepEqual(physicalReview.options,expected.options);
 // Compare both JSON bytes (key/order/floats) and parsed structures across VM realms.
 for(const [label,actual]of Object.entries({formal,outings,snapshot:s.snapshot(at(expected.day,expected.seconds),expected.options)})){
  const oracle=label==='formal'?expected.formal:physicalReview[label];
  const text=JSON.stringify(actual);assert.equal(text,JSON.stringify(oracle),label+' bytes');assert.deepEqual(JSON.parse(text),oracle,label+' deepEqual');
 }
 const historical=loadScene({ref:'246f1c0'}).scene.scheduler;
 const original=obr8.records.find(r=>r.day===expected.day&&r.seconds===expected.seconds),oldFormal=historical.plan(expected.day,expected.options);
 assert.equal(JSON.stringify(oldFormal),JSON.stringify(expected.formal),'historical formal bytes');
 assert.equal(JSON.stringify(historical.blockPlan(expected.day,0,oldFormal,expected.options)),JSON.stringify(original.outings),'historical obr8/obr9 outing bytes');
 assert.equal(JSON.stringify(historical.snapshot(at(expected.day,expected.seconds),expected.options)),JSON.stringify(original.snapshot),'historical obr8/obr9 snapshot bytes');
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
