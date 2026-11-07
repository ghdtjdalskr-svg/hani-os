import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {patrol278Delta as delta,restorePatrol278Source as restore,projectPreKidsSource,restoreKids278Source,projectPreVisitsSource,restoreVisits278Source,projectPreStaffChatSource,restoreStaffChats278Source,projectPreBubblePlaceSource,restoreBubblePlace278Source} from './hani-office-chairman-patrol-278-source.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),read=f=>projectPreKidsSource(fs.readFileSync(f,'utf8'),f);
test('278 exact complete ordered replacements reject missing, duplicate, unrelated and baseline bytes',()=>{
 assert.equal(delta.version,'2.9.278');assert.deepEqual(delta.files.map(r=>r.file),['hani-office-live.js','hani-office-live.css']);
 for(const row of delta.files){const current=read(row.file),before=restore(current,row.file);let forward=before,aEnd=0,bEnd=0;
  for(const r of row.replacements){assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);assert.equal(before.split(r.before).length-1,1);assert.equal(current.split(r.after).length-1,1);const a=before.indexOf(r.before),b=current.indexOf(r.after);assert.ok(a>=aEnd&&b>=bEnd);aEnd=a+r.before.length;bEnd=b+r.after.length;forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restore(current.replace(r.after,()=>r.before),row.file));assert.throws(()=>restore(current+r.after,row.file));}
  assert.equal(forward,current);assert.equal(hash(before),row.beforeSha256);assert.equal(hash(current),row.afterSha256);
  const bytes=Buffer.from(before);assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex'),row.beforeBlobSha1);
  for(const bad of [current+'\n',current.slice(1),current+current,before])assert.throws(()=>restore(bad,row.file));
 }
 assert.throws(()=>restore(read('hani-main.js'),'hani-main.js'));
});
test('278 independent fixed Git blobs prove pre-patrol bytes',()=>{for(const row of delta.files){const before=execFileSync('git',['show',delta.baseCommit+':'+row.file],{encoding:'utf8',maxBuffer:32*1024*1024});assert.equal(hash(before),row.beforeSha256);assert.equal(restore(read(row.file),row.file),before)}});

test('278 kids extension strictly restores every authored 1066c57 byte and rejects mutations',()=>{
 const row=delta.kidsExtension,current=projectPreVisitsSource(fs.readFileSync(row.file,'utf8')),before=restoreKids278Source(current);let forward=before,aEnd=0,bEnd=0;
 assert.equal(row.baseCommit,'1066c5749037c335c7af9a48a8fe8bf9633ae1a3');assert.equal(hash(before),'4afe5cd2164e9b0232aa728b685d5e60bc665cf1c2ef02ed85737c29a832b6f6');
 for(const r of row.replacements){assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);assert.equal(before.split(r.before).length-1,1);assert.equal(current.split(r.after).length-1,1);const a=before.indexOf(r.before),b=current.indexOf(r.after);assert.ok(a>=aEnd&&b>=bEnd);aEnd=a+r.before.length;bEnd=b+r.after.length;forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restoreKids278Source(current.replace(r.after,()=>r.before)));assert.throws(()=>restoreKids278Source(current+r.after));}
 assert.equal(forward,current);for(const bad of [current+'\n',current.slice(1),before,current+current])assert.throws(()=>restoreKids278Source(bad));assert.throws(()=>restoreKids278Source(current,'hani-main.js'));
});
test('278 kids extension independently matches its fixed Git base',()=>{assert.equal(restoreKids278Source(fs.readFileSync('hani-office-live.js','utf8')),execFileSync('git',['show',delta.kidsExtension.baseCommit+':hani-office-live.js'],{encoding:'utf8',maxBuffer:32*1024*1024}))});

test('278 visit extension strictly restores 59db365 and rejects every partial, duplicate or unrelated byte',()=>{
 const row=delta.visitExtension,current=projectPreStaffChatSource(fs.readFileSync(row.file,'utf8')),before=restoreVisits278Source(current);let forward=before,aEnd=0,bEnd=0;
 assert.equal(row.baseCommit,'59db3651296c394d17766af7c89933642ada8712');assert.equal(row.beforeSha256,'879d9c27f9be34326f6bfe8230cc4273d7a687ebf30dd202cd9826afeebce065');
 for(const r of row.replacements){assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);assert.equal(before.split(r.before).length-1,1);assert.equal(current.split(r.after).length-1,1);const a=before.indexOf(r.before),b=current.indexOf(r.after);assert.ok(a>=aEnd&&b>=bEnd);aEnd=a+r.before.length;bEnd=b+r.after.length;forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restoreVisits278Source(current.replace(r.after,()=>r.before)));assert.throws(()=>restoreVisits278Source(current+r.after));}
 assert.equal(forward,current);for(const bad of [current+'\n',current.slice(1),before,current+current])assert.throws(()=>restoreVisits278Source(bad));assert.throws(()=>restoreVisits278Source(current,'hani-main.js'));
});
test('278 visit extension independently matches fixed Git base',()=>{assert.equal(restoreVisits278Source(fs.readFileSync('hani-office-live.js','utf8')),execFileSync('git',['show',delta.visitExtension.baseCommit+':hani-office-live.js'],{encoding:'utf8',maxBuffer:32*1024*1024}))});

test('278 staff-chat extension strictly preserves ordered complete replacements and rejects mutations',()=>{
 const row=delta.staffChatExtension,current=projectPreBubblePlaceSource(fs.readFileSync(row.file,'utf8')),before=restoreStaffChats278Source(current);let forward=before,aEnd=0,bEnd=0;
 assert.equal(row.baseCommit,'f836468fa9b6c6f27c91a78f0408e6f8d2acbbf0');assert.equal(row.beforeSha256,'bbaceed5e8ac8ea5f33b67d8568a88b111d484c186f79d14d562bd3df77f8cae');
 for(const r of row.replacements){assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);assert.equal(before.split(r.before).length-1,1);assert.equal(current.split(r.after).length-1,1);const a=before.indexOf(r.before),b=current.indexOf(r.after);assert.ok(a>=aEnd&&b>=bEnd);aEnd=a+r.before.length;bEnd=b+r.after.length;forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restoreStaffChats278Source(current.replace(r.after,()=>r.before)));assert.throws(()=>restoreStaffChats278Source(current+r.after));}
 assert.equal(forward,current);for(const bad of [current+'\n',current.slice(1),before,current+current])assert.throws(()=>restoreStaffChats278Source(bad));assert.throws(()=>restoreStaffChats278Source(current,'hani-main.js'));
});
test('278 staff-chat extension independently matches fixed Git base',()=>{assert.equal(restoreStaffChats278Source(fs.readFileSync('hani-office-live.js','utf8')),execFileSync('git',['show',delta.staffChatExtension.baseCommit+':hani-office-live.js'],{encoding:'utf8',maxBuffer:32*1024*1024}))});

test('278 bubble placement extension strictly restores complete 0159d09 bytes and rejects all mutations',()=>{
 const row=delta.bubblePlaceExtension,current=fs.readFileSync(row.file,'utf8'),before=restoreBubblePlace278Source(current);let forward=before,aEnd=0,bEnd=0;
 assert.equal(row.baseCommit,'0159d09ad769c2841c6aba09af4022cf1bd9da0d');assert.equal(row.beforeSha256,'87e892c33ec1c2ded09c3d1d09914acb97ae737e1dbbcce439e10cf97ed18d5e');assert.equal(row.beforeSha256,delta.staffChatExtension.afterSha256);
 for(const r of row.replacements){assert.ok(r.before.length&&r.after.length);assert.notEqual(r.before,r.after);assert.equal(before.split(r.before).length-1,1);assert.equal(current.split(r.after).length-1,1);const a=before.indexOf(r.before),b=current.indexOf(r.after);assert.ok(a>=aEnd&&b>=bEnd);aEnd=a+r.before.length;bEnd=b+r.after.length;forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restoreBubblePlace278Source(current.replace(r.after,()=>r.before)));assert.throws(()=>restoreBubblePlace278Source(current+r.after));}
 assert.equal(forward,current);for(const bad of [current+'\n',current.slice(1),before,current+current])assert.throws(()=>restoreBubblePlace278Source(bad));assert.throws(()=>restoreBubblePlace278Source(current,'hani-main.js'));
});
test('278 bubble placement extension independently matches fixed Git base',()=>{assert.equal(restoreBubblePlace278Source(fs.readFileSync('hani-office-live.js','utf8')),execFileSync('git',['show',delta.bubblePlaceExtension.baseCommit+':hani-office-live.js'],{encoding:'utf8',maxBuffer:32*1024*1024}))});
