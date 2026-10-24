import fs from 'node:fs';
import {approvedReleases,guardedRelease,pendingApprovedConnections} from '../../scripts/hani-reviewed-release-baseline.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const origins={'assets/data/desk-mascots-v1.json':'2784e4e9855211021766f9eb65d764b2aafac468','hani-desk-mascots.js':'2784e4e9855211021766f9eb65d764b2aafac468'};
const specs=new Map();
function add(ref,file){if(!specs.has(ref))specs.set(ref,new Set());specs.get(ref).add(file)}
const files=new Set(['hani-development-history-v1.js',...approvedReleases.flatMap(r=>r.files),...pendingApprovedConnections.map(c=>c.file),...Object.keys(read('scripts/fixtures/settings-225-ui-delta.json').files)]);
for(const file of files){add(origins[file]||guardedRelease,file);for(const r of approvedReleases)if(r.files.includes(file)){add(r.sha+'^',file);add(r.sha,file)}}
const f=read('scripts/fixtures/train233-integrations.json');
for(const {file}of f.changes){add(f.baseSha,file);add(f.candidateSha,file)}
for(const {sha,file}of f.approvedIntegrationFixes){add(sha+'^',file);add(sha,file)}
for(const {file}of f.browserFollowup.changes){add(f.browserFollowup.baseSha,file);add(f.browserFollowup.candidateSha,file)}
const ocr=read('scripts/fixtures/ocr-accuracy-224/write-path-baseline.json');for(const file of Object.keys(ocr.files))add(ocr.baselineHead,file);
fs.writeFileSync(new URL('snapshot-plan.json',import.meta.url),JSON.stringify([...specs].map(([ref,files],i)=>({ref,dir:'snapshot-'+i,files:[...files]})),null,2));
console.log(specs.size+' fixed Git refs prepared for read-only archive export.');
