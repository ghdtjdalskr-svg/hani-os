import fs from 'node:fs';
import assert from 'node:assert/strict';
function edit(file,replacements){let s=fs.readFileSync(file,'utf8');for(let [a,b]of replacements){if(!s.includes(a)&&a.includes('\r\n')){a=a.replaceAll('\r\n','\n');b=b.replaceAll('\r\n','\n')}assert.equal(s.split(a).length-1,1,file+': anchor '+a.slice(0,100));s=s.replace(a,()=>b)}fs.writeFileSync(file,s)}
edit('scripts/hani-reviewed-release-baseline.mjs',[
 ["export const pendingApprovedConnections=['train233-integrations.json','office-redesign-233.json','milestones-v1.json','hero-crop-fix.json'].flatMap(name=>fixture(name).changes).map(({file,replacements})=>({", "const browserFollowup=fixture('train233-integrations.json').browserFollowup;\r\n// Undo newest CSS corrections and fixed f27be17 deltas before older overlapping hunks.\r\nexport const pendingApprovedConnections=[...browserFollowup.corrections,...browserFollowup.changes,...['train233-integrations.json','office-redesign-233.json','milestones-v1.json','hero-crop-fix.json'].flatMap(name=>fixture(name).changes)].map(({file,replacements})=>({"],
 ["export function normalizeReviewedCurrentSource(file,source){\r\n for(const connection of pendingApprovedConnections)if(connection.file===file){\r\n  for(const line of connection.lines)assert.equal(source.split(line).length-1,1,'one pending approved connection: '+line);\r\n  source=connection.strip(source);\r\n }\r\n return source;\r\n}", "export function normalizeReviewedConnection(connection,source){\r\n for(const line of connection.lines)assert.equal(source.split(line).length-1,1,'one pending approved connection: '+line);\r\n return connection.strip(source);\r\n}\r\nexport function normalizeReviewedCurrentSource(file,source){\r\n for(const connection of pendingApprovedConnections)if(connection.file===file)source=normalizeReviewedConnection(connection,source);\r\n return source;\r\n}"]
]);
edit('scripts/hani-reviewed-release-baseline.test.mjs',[
 ["import fs from 'node:fs';", "import fs from 'node:fs';\r\nimport crypto from 'node:crypto';"],
 ['normalizeReviewedCurrentSource,trainBaseVersion}', 'normalizeReviewedCurrentSource,normalizeReviewedConnection,trainBaseVersion}'],
 [" for(const {file,lines} of pendingApprovedConnections){\r\n  const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');\r\n  assertReviewedReleaseSource(file,source);\r\n  for(const line of lines)for(const replacement of ['',line+'\\n'+line,line.slice(0,-1)+'!']){\r\n   assert.throws(()=>normalizeReviewedCurrentSource(file,source.replace(line,()=>replacement)),{code:'ERR_ASSERTION'},file+' exact approved addition must occur once');\r\n  }\r\n  assert.throws(()=>normalizeReviewedCurrentSource(file,readReviewedReleaseBaseline(file)),{code:'ERR_ASSERTION'},'never normalize Git oracle bytes');\r\n }", " const stages=new Map();\r\n for(const connection of pendingApprovedConnections){\r\n  const {file,lines}=connection,source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');\r\n  assertReviewedReleaseSource(file,source);\r\n  const stage=stages.get(file)??source;\r\n  for(const line of lines)for(const replacement of ['',line+'\\n'+line,line.slice(0,-1)+'!']){\r\n   assert.equal(stage.split(line).length-1,1,file+' exact layer is present before mutation');\r\n   assert.throws(()=>normalizeReviewedConnection(connection,stage.replace(line,()=>replacement)),{code:'ERR_ASSERTION'},file+' exact approved addition must occur once at its normalization stage');\r\n  }\r\n  stages.set(file,normalizeReviewedConnection(connection,stage));\r\n  assert.throws(()=>normalizeReviewedCurrentSource(file,readReviewedReleaseBaseline(file)),{code:'ERR_ASSERTION'},'never normalize Git oracle bytes');\r\n }"],
 ['assert.deepEqual(pendingApprovedConnections.map(c=>c.file).sort(),[', 'assert.deepEqual(pendingApprovedConnections.map(c=>c.file).sort(),["hani-design-system.css","hani-context-remote.css","hani-context-remote.css","hani-design-system.css","hani-portfolio-preview.css",...('],
 ['"index.html","index.html"]);', '"index.html","index.html"])].sort());'],
 [" for(const {file,lines} of pendingApprovedConnections){\r\n  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');\r\n  assertReviewedReleaseSource(file,current);", " const stages=new Map();\r\n for(const connection of pendingApprovedConnections){\r\n  const {file,lines}=connection,current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');\r\n  const stage=stages.get(file)??current;\r\n  assertReviewedReleaseSource(file,current);"],
 ["   const rest=current.replace(fragment,''),moved=rest?(current.startsWith(fragment)?rest+fragment:fragment+rest):fragment+'\\n';\r\n   assert.throws(()=>assertReviewedReleaseSource(file,moved),{code:'ERR_ASSERTION'},file+' moved approved fragment');\r\n  }\r\n }", "   assert.equal(stage.split(fragment).length-1,1,file+' fragment exists at this exact stage');\r\n   const rest=stage.replace(fragment,''),moved=rest?(stage.startsWith(fragment)?rest+fragment:fragment+rest):fragment+'\\n';\r\n   assert.notEqual(normalizeReviewedConnection(connection,moved),normalizeReviewedConnection(connection,stage),file+' moved fragment changes normalized bytes');\r\n   if(current.includes(fragment)){\r\n    const rest=current.replace(fragment,''),moved=rest?(current.startsWith(fragment)?rest+fragment:fragment+rest):fragment+'\\n';\r\n    assert.throws(()=>assertReviewedReleaseSource(file,moved),{code:'ERR_ASSERTION'},file+' moved current fragment rejected');\r\n   }\r\n  }\r\n  stages.set(file,normalizeReviewedConnection(connection,stage));\r\n }"]
]);
// The fixture may name only these fixed commit owners and these authored CSS corrections.
const test=`\n\ntest('fixed f27be17 CSS follow-up and named owner corrections retain exact bytes and reject drift',()=>{
 const {browserFollowup:f}=JSON.parse(fs.readFileSync(new URL('./fixtures/train233-integrations.json',import.meta.url),'utf8'));
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 assert.equal(f.baseSha,'5a665a3');assert.equal(f.candidateSha,'f27be17c1b3ea989fec3b4886f36b3b32c4caa27');
 assert.deepEqual(f.changes.map(c=>c.file),['hani-context-remote.css','hani-design-system.css','hani-portfolio-preview.css']);
 assert.deepEqual(f.corrections.map(c=>[c.file,c.afterHash]),[
  ['hani-design-system.css','bce2b2ac0991b69fb66831b2825a74050303d66e99b3ac1316812ebdee240948'],
  ['hani-context-remote.css','6ec52443784833f7c09b5c16318342b038534b8f5819694fe8360989d8039e4c']
 ]);
 for(const change of f.changes){
  const before=readReleaseSource(f.baseSha,change.file),after=readReleaseSource(f.candidateSha,change.file);
  assert.equal(hash(before),change.beforeHash);assert.equal(hash(after),change.afterHash);
  let forward=before,reverse=after;
  for(const h of change.replacements){assert.equal(forward.split(h.before).length-1,1);assert.equal(reverse.split(h.after).length-1,1);forward=forward.replace(h.before,()=>h.after);reverse=reverse.replace(h.after,()=>h.before)}
  assert.equal(forward,after);assert.equal(reverse,before);
 }
 for(const change of f.corrections){
  let expected=readReleaseSource(f.candidateSha,change.file);assert.equal(hash(expected),change.beforeHash);
  for(const h of change.replacements){assert.equal(expected.split(h.before).length-1,1);expected=expected.replace(h.before,()=>h.after)}
  assert.equal(hash(expected),change.afterHash);assert.equal(fs.readFileSync(new URL('../'+change.file,import.meta.url),'utf8'),expected);
 }
 for(const file of f.changes.map(c=>c.file)){
  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  for(const changed of [current+'/* unlisted CSS */',current.replace(/\\r\\n/,'\\n')]){assert.notEqual(changed,current);assert.throws(()=>assertReviewedReleaseSource(file,changed),{code:'ERR_ASSERTION'},file+' outside edits and EOL remain strict')}
 }
});
`;
fs.appendFileSync('scripts/hani-reviewed-release-baseline.test.mjs',test.replaceAll('\n','\r\n'));
console.log('Updated ordered exact normalization and stage-aware mutation checks; pinned Git identities unchanged.');
