import fs from 'node:fs';
export const heroRestoreDelta=JSON.parse(fs.readFileSync(new URL('./fixtures/hero-restore-ui-delta.json',import.meta.url),'utf8'));
// Reverse only the exact reviewed UI hunks; unrelated edits are never erased.
export function withoutHeroRestore(file,source){
 for(const {old_str,new_str} of [...(heroRestoreDelta.files[file]||[])].reverse()){
  if(!new_str){const anchor='/* v2.9.113';if(!source.includes(anchor))throw Error(file+' missing restored CSS anchor');source=source.replace(anchor,old_str+anchor);continue;}
  if(source.split(new_str).length!==2)throw Error(file+' hero restore hunk drift');
  source=source.replace(new_str,old_str);
 }
 return source;
}
