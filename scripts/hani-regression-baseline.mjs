import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
export const root=path.resolve(import.meta.dirname,'..');
const git=(...args)=>execFileSync(process.env.HANI_GIT_PATH||process.env.HANI_GIT||'git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
let fork;
// Feature branches retain their release version until the release train. Compare
// their unchanged bytes with the shared ancestor, rather than a later main bump.
export function readBranchBaseline(file){
 const dir=process.env.HANI_BRANCH_BASELINE;
 if(dir)return fs.readFileSync(path.join(dir,file),'utf8');
 fork??=git('merge-base','HEAD','origin/main').trim();
 return git('show',fork+':'+file);
}
export function readMainBaseline(file){
 const dir=process.env.HANI_MAIN_BASELINE;
 return dir?fs.readFileSync(path.join(dir,file),'utf8'):git('show','origin/main:'+file);
}
