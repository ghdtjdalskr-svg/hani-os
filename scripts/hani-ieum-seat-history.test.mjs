import './hani-ui-polish-1-preload.cjs'; // Exact UI Polish 1 inverse before historical readers.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import seat from './hani-ieum-seat-source.cjs';
import history from './hani-ieum-seat-reviewed-input.cjs';
import repository from './hani-release-301-reviewed-input.cjs';
import reviewed from './hani-release-300-reviewed-input.cjs';
const root=path.resolve(import.meta.dirname,'..'),read=seat.readRawFileSync;
const release=JSON.parse(read(path.join(root,'scripts/fixtures/release-300-layer.json'),'utf8'));

test('committed seat history reaches release300 then main299 without changing Git evidence',()=>{
 assert.equal(repository.commit(seat.delta.feature).parents[0],seat.delta.base);
 assert.equal(repository.readOnly(['merge-base','HEAD','origin/main']),seat.delta.base);
 assert.equal(history.readOnly(['merge-base','HEAD','origin/main']),release.release);
 assert.equal(reviewed.readOnly(['merge-base','HEAD','origin/main']),release.base);
 for(const ref of [seat.delta.base,seat.delta.feature,release.release,release.base]){
  for(const file of ['hani-main.js','hani-office-live.js'])assert.equal(history.readOnly(['show',ref+':'+file]),repository.read(ref,file));
 }
 for(const args of [['log','--first-parent','--format=%H%x09%s','origin/main'],['rev-parse','HEAD'],['diff-tree','--no-commit-id','--name-only','-r',seat.delta.feature]])assert.equal(history.readOnly(args),repository.readOnly(args));
});

test('every seat and metadata owner must be exact; changed bytes, EOL, wrong base and repeated boundaries stay strict',()=>{
 const owners=[...Object.keys(seat.delta.files),...Object.keys(release.files)];
 for(const file of owners){
  const target=path.join(root,file),bytes=read(target);
  for(const bad of [Buffer.concat([bytes,Buffer.from('\n')]),bytes.subarray(1),Buffer.from(bytes.toString('utf8').replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'))]){
   assert.notDeepEqual(bad,bytes);
   const changed=f=>f===target?bad:read(f);
   assert.equal(history.selectBase(seat.delta.base,changed),seat.delta.base,file+' drift cannot select older history');
  }
 }
 for(const base of [release.release,release.base,'0'.repeat(40)])assert.equal(history.selectBase(base),base);
 assert.throws(()=>history.selectBase(seat.delta.base,()=>{throw Error('read failure')}),/read failure/);
});
