import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {projectLifeSource} from '../../../scripts/hani-life-bundle-source.mjs';
import polish from '../../../scripts/hani-m9-polish-source.cjs';
import link from '../../../scripts/hani-m9-link-source.cjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const originals=JSON.parse(fs.readFileSync('artifacts/seoyun-m9/originals.json'));
for(const file of ['index.html','hani-main.js']){
 let s=fs.readFileSync(file,'utf8').replaceAll('2.9.284','2.9.283');
 for(const [name,fn]of [['life',s=>projectLifeSource(s,file,'study-retry')],['polish',s=>polish.restore(s,file)],['link',s=>link.restore(s,file)]]){
  try{s=fn(s);console.log({file,name,hash:hash(s),chibi:s.includes('launchGreetingAssets'),expectedM9:originals.files[file]});}catch(e){console.log({file,name,error:e.message});break;}
 }
}
