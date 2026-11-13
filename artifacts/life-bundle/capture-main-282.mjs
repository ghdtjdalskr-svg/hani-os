import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
const source='../rel282',out='artifacts/life-bundle/283/main-282';
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=f=>fs.readFileSync(source+'/'+f);
const closure=await resolveRuntimeClosure({read,exists:f=>fs.existsSync(source+'/'+f)});
const rows=[];
for(const file of closure.files){
 const bytes=read(file),dest=out+'/'+file;
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
 rows.push({file,sha256:hash(bytes),sameAsWorktree:fs.existsSync(file)&&hash(fs.readFileSync(file))===hash(bytes)});
}
fs.writeFileSync('artifacts/life-bundle/283/main-282-evidence.json',JSON.stringify({source:'release-282 f5672cfa (not fresh Git export of origin/main)',count:rows.length,missing:closure.missing,rows},null,2)+'\n');
console.log(JSON.stringify({count:rows.length,missing:closure.missing,different:rows.filter(r=>!r.sameAsWorktree).map(r=>r.file)}));
