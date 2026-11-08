import fs from 'node:fs';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
for(const file of fs.readdirSync('scripts').filter(f=>/^hani-office-.*\.(mjs|cjs)$/.test(f)||f==='hani-seoyun-m9.test.mjs')){
 const name='scripts/'+file,s=fs.readFileSync(name,'utf8'),next=s.replaceAll("from './hani-office-launch-284-closure.mjs'","from './hani-runtime-closure.mjs'");if(next!==s)fs.writeFileSync(name,next);
}
const file='scripts/fixtures/office-release-284.json',delta=JSON.parse(fs.readFileSync(file));delete delta.launch;delete delta.closures;fs.writeFileSync(file,JSON.stringify(delta,null,2)+'\n');
const src='scripts/hani-release-284-source.cjs';let s=fs.readFileSync(src,'utf8');s=s.slice(0,s.indexOf('// Closure-only projection:'))+'module.exports={delta,hash,restoreRelease284,projectPreRelease284Source};\n';s=s.replace(/assert\.equal\(hash\(bytes\),'[a-f0-9]{64}'/,"assert.equal(hash(bytes),'"+hash(fs.readFileSync(file))+"'");fs.writeFileSync(src,s);
fs.unlinkSync('scripts/hani-office-launch-284-closure.mjs');
console.log({fixture:hash(fs.readFileSync(file))});
