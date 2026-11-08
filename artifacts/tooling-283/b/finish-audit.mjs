import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='artifacts/tooling-283/b',root=process.cwd();
const hash=b=>createHash('sha256').update(b).digest('hex');
const initial=JSON.parse(fs.readFileSync(out+'/initial-files.json'));
const before=new Map(initial.map(r=>[r.file,r.sha256]));
const targets=JSON.parse(fs.readFileSync(out+'/targets.json'));
const backups=JSON.parse(fs.readFileSync('artifacts/tooling-283/restore-files.json'));
const restored=[];
for(const file of backups){
 const backup=out+'/before/'+file;
 if(!fs.existsSync(backup))continue;
 const bytes=fs.readFileSync(backup);
 assert.equal(hash(bytes),before.get(file),file+' original snapshot identity');
 if(!fs.existsSync(file)||hash(fs.readFileSync(file))!==before.get(file)){
  const generated=out+'/generated/'+file;
  if(fs.existsSync(file)){fs.mkdirSync(path.dirname(generated),{recursive:true});fs.copyFileSync(file,generated);}
  fs.writeFileSync(file,bytes);restored.push(file);
 }
 assert.equal(hash(fs.readFileSync(file)),before.get(file));
}
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!['.git','node_modules'].includes(e.name)?walk(path.join(d,e.name)):e.isFile()?[path.join(d,e.name).replaceAll('\\','/')]:[]);
const removed=[];
for(const file of walk('artifacts').filter(f=>!before.has(f)&&!f.startsWith('artifacts/tooling-283/'))){
 const absolute=path.resolve(file);
 assert.ok(absolute.startsWith(path.resolve(root,'artifacts')+path.sep),'generated file inside tool283 artifacts');
 const dest=out+'/generated/'+file;
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(absolute,dest);
 fs.unlinkSync(absolute);removed.push(file);
}
const runtime=JSON.parse(fs.readFileSync('artifacts/tooling-283/runtime-files.json'));
for(const row of runtime){const actual=hash(fs.readFileSync(row.file));assert.equal(actual,before.get(row.file),'runtime unchanged since follow-up start '+row.file);assert.equal(actual,row.sha256,'runtime original 283 evidence '+row.file);}
for(const file of targets){
 const original=fs.readFileSync(out+'/before/'+file);
 const source=fs.readFileSync(file,'utf8');
 const stripped=source.replace('// Apply the exact 283/life inverses before historical office pins, including standalone runs.\n','').replace("import './hani-life-bundle-preload.mjs';\n",'');
 assert.deepEqual(Buffer.from(stripped),original,'all original assertions, Git calls and EOL retained: '+file);
}
const expected=new Set([...targets,'docs/development-history/CURRENT.md','docs/development-history/handoffs/2026-11-08-tooling-283-b.md']);
const changed=initial.filter(r=>!fs.existsSync(r.file)||hash(fs.readFileSync(r.file))!==r.sha256).map(r=>r.file);
const unexpected=changed.filter(f=>!expected.has(f));
const added=walk('.').filter(f=>!before.has(f)&&!f.startsWith(out+'/'));
const unexpectedAdded=added.filter(f=>f!=='artifacts/tooling-283/REPORT-b.md');
// The task-specific handoff was created immediately before the snapshot.
const evidence={restored,removed,runtimeFiles:runtime.length,runtimeUnchanged:true,originalTestBodiesPreserved:targets.length,changed,unexpected,added,unexpectedAdded};
fs.writeFileSync(out+'/final-audit.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence));assert.deepEqual(unexpected,[]);assert.deepEqual(unexpectedAdded,[]);
