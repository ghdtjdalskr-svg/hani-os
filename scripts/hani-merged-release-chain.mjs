// Trust only release PRs already present on origin/main's first-parent history.
// Neither HEAD nor worktree bytes can authorize a release or fill a gap.
import assert from 'node:assert/strict';
export const releaseChainAnchor='beffc3850ea890ec84ce623579b26b4b5a3cd35c';
export function discoverMergedReleaseChain(git,baseSha){
 const history=git(['log','--first-parent','--format=%H%x09%s','origin/main']).trim().split('\n').map(line=>{
  const [sha,...subject]=line.replace(/\r$/,'').split('\t');
  assert.match(sha,/^[0-9a-f]{40}$/,'full commit identity');
  return {sha,subject:subject.join('\t')};
 });
 const anchor=history.findIndex(row=>row.sha===releaseChainAnchor);
 assert.ok(anchor>=0,'release233 must be on origin/main first-parent history');
 const tip=baseSha?history.findIndex(row=>row.sha===baseSha):0;
 assert.ok(tip>=0&&tip<=anchor,'branch base must be on origin/main after release233');
 const releases=[];let next=234;
 const prs=new Set();
 for(const row of history.slice(tip,anchor).reverse()){
  if(!/^release:/.test(row.subject))continue;
  // Approved 291 shipped without a description. Authorize only this exact
  // commit/subject pair; unknown title-only releases still fail closed.
  const match=row.subject.match(/^release: v(2\.9\.(\d+)) .+ \(#([1-9]\d*)\)$/)||
   (row.sha==='55942f120fc06a87649009c21776a572fb8081e6'&&row.subject==='release: v2.9.291 (#497)'?['','2.9.291','291','497']:null);
  assert.ok(match,'release must identify a merged release PR: '+row.sha);
  assert.equal(Number(match[2]),next++,'merged releases must be contiguous and unique');
  const version=match[1];
  assert.ok(!prs.has(match[3]),'merged release PR must be unique');prs.add(match[3]);
  assert.equal(git(['show',row.sha+':hani-main.js']).match(/const HANI_DISPLAY_VERSION="(2\.9\.\d+)";/)?.[1],version,'release title/display identity');
  const files=git(['diff-tree','--no-commit-id','--name-only','-r',row.sha]).trim().split('\n').map(s=>s.replace(/\r$/,'')).filter(f=>f==='index.html'||/^hani-[^/]+\.(?:js|css)$/.test(f)||/^assets\/data\/(?:desk-mascots-v1|office-actions-(?:216|221))\.json$/.test(f));
  assert.ok(files.includes('hani-main.js')&&files.includes('index.html'),'release must contain canonical version owners');
  releases.push({...row,version,files});
 }
 return releases;
}
export function advanceMergedReleaseFile(file,expected,releases,read,tip='origin/main'){
 for(const release of releases)if(release.files.includes(file)){
  assert.equal(expected,read(release.sha+'^',file),file+' unlisted change before '+release.sha);
  expected=read(release.sha,file);
 }
 assert.equal(expected,read(tip,file),file+' unlisted change after merged releases');
 return expected;
}
