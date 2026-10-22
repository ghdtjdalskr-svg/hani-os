import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolveRuntimeClosure,isTextArtifact} from './hani-runtime-closure.mjs';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
test('working-tree runtime package closure includes Journal JS/CSS and every dynamic pose without missing references',async()=>{
  const result=await resolveRuntimeClosure({exists:file=>fs.existsSync(path.join(root,file)),read:file=>fs.readFileSync(path.join(root,file))});
  assert.deepEqual(result.missing,[]);
  const limits=JSON.parse(fs.readFileSync(path.join(root,'dev-center/one-pass-gate-contract.json'),'utf8')).limits;
  assert.ok(result.files.length<=limits.max_files,'runtime package file count exceeds existing contract');
  const total=[...result.contents.values()].reduce((n,b)=>n+b.length,0);assert.ok(total<=limits.max_total_bytes);
  assert.ok([...result.contents.values()].every(b=>b.length<=limits.max_single_file_bytes));
  const required=['hani-street-journal.js','hani-street-journal.css','assets/street-journal/chibi-sheet-v1.webp'];
  for(const file of required)assert.ok(result.files.includes(file),file);
  assert.ok(result.files.every(file=>!file.includes('.tmp.')&&!file.startsWith('scripts/')&&!file.startsWith('docs/')));
  const html=result.contents.get('index.html').toString();
  assert.ok(html.search(/hani-street-journal\.js\?v=/)>0&&html.search(/hani-street-journal\.js\?v=/)<html.search(/hani-investment-committee\.js\?v=/));
  assert.match(html,/hani-street-journal\.css\?v=2\.9\.\d+/);
  // Reuse package serialization rules to ensure lossless binary/text packaging of the working tree.
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  for(const file of result.files){const bytes=result.contents.get(file),text=isTextArtifact(file),content=bytes.toString(text?'utf8':'base64'),decoded=Buffer.from(content,text?'utf8':'base64');assert.equal(sha(bytes),sha(decoded),file);}
  const summary={scope:'working tree closure + package byte roundtrip; not frozen release candidate',files:result.files.length,totalBytes:total,limits,journal:required,missing:result.missing};
  fs.mkdirSync(path.join(root,'artifacts/street-journal-v1'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/street-journal-v1/package-check.json'),JSON.stringify(summary,null,2));
});
