// Preserve sibling image evidence available to the real worktree at the same
// relative location in the isolated baseline. These are copies, never edits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'local');
const files=['barista-night/artifacts/barista-night/counter-night.webp'];
const test=fs.readFileSync(path.join(root,'scripts/hani-office-pet-bori.test.mjs'),'utf8');
const block=test.slice(test.indexOf('const expected='),test.indexOf('for(const [file,[source,width,height]]'));
for(const m of block.matchAll(/\[\s*['"]([^'"]+\.webp)['"]\s*,/g))files.push('pet-bori/artifacts/pet-bori/'+m[1]);
const copied=[];
for(const file of files){
 const source=path.resolve(root,'..',file),target=path.join(local,file);
 if(!target.startsWith(local+path.sep))throw Error('copy outside local evidence');
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
 copied.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')});
}
fs.writeFileSync(path.join(local,'baseline-environment.json'),JSON.stringify(copied,null,2)+'\n');
console.log(JSON.stringify(copied));
