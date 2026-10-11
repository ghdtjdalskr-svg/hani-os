// Remove only library comment openings; preserve JSON formatting and line endings.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {replyIndex,repositoryRoot} from './hani-board-library-build.mjs';

export async function loadVocativeStripper(root=repositoryRoot){
  const context=vm.createContext({window:{},document:{getElementById:()=>null}});
  for(const file of ['hani-organization-hub.js','hani-board.js']){
    vm.runInContext(await fs.readFile(path.join(root,file),'utf8'),context,{filename:file});
  }
  return context.window.HaniBoard.stripLeadingVocative;
}

export async function cleanLibrary({root=repositoryRoot,check=false}={}){
  const strip=await loadVocativeStripper(root),folder=path.join(root,'data/board-library');
  const files=(await fs.readdir(folder)).filter(f=>f.endsWith('.json')).sort();
  let changed=0;
  for(const file of files){
    const target=path.join(folder,file),raw=await fs.readFile(target,'utf8'),value=JSON.parse(raw);
    const threads=Array.isArray(value)?value:value.threads,replacements=new WeakMap();
    for(const thread of threads){
      thread.comments.forEach((comment,i)=>{
        const parent=replyIndex(comment.replyTo,thread.comments,i,thread.id);
        if(parent===-2)throw Error('Invalid reply target: '+thread.id+' / '+i);
        const next=strip(comment.body,[parent>=0?thread.comments[parent].authorId:null,thread.authorId],parent>=0);
        replacements.set(comment,next);
        if(next!==comment.body)changed++;
      });
    }
    const bodies=[];
    function collect(object){
      if(!object||typeof object!=='object')return;
      for(const [key,item] of Object.entries(object)){
        if(key==='body')bodies.push({old:item,next:replacements.get(object)??item});
        else collect(item);
      }
    }
    collect(value);
    let index=0;
    const output=raw.replace(/("body"\s*:\s*)("(?:[^"\\]|\\.)*")/g,(match,prefix,token)=>{
      const body=bodies[index++];
      if(!body||JSON.parse(token)!==body.old)throw Error('Body token order: '+file);
      return body.next===body.old?match:prefix+JSON.stringify(body.next);
    });
    if(index!==bodies.length)throw Error('Missing body tokens: '+file);
    if(!check&&output!==raw)await fs.writeFile(target,output,'utf8');
  }
  return {files:files.length,changed};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await cleanLibrary({check:process.argv.includes('--check')});
  console.log('Board vocative cleanup: '+result.changed+' bodies '+(process.argv.includes('--check')?'pending':'changed')+' / '+result.files+' files');
  if(process.argv.includes('--check')&&result.changed)process.exitCode=1;
}
