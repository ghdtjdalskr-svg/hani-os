import assert from 'node:assert/strict';
import path from 'node:path';

// Follow each snapshot's own index graph, including CSS imports and local module
// imports. Counting only a fixed handful of files misses dynamically owned UI.
export function literalIds(read){
 const counts=new Map(),files=new Set(),pending=['index.html'];
 const enqueue=(from,url)=>{
  if(/^(?:[a-z]+:|\/\/|#)/i.test(url))return;
  const clean=url.split(/[?#]/)[0];if(!/\.(?:js|css)$/i.test(clean))return;
  const file=path.posix.normalize(path.posix.join(path.posix.dirname(from),clean));
  assert.ok(!file.startsWith('../')&&!path.posix.isAbsolute(file),'local runtime reference '+url);
  pending.push(file);
 };
 while(pending.length){
  const file=pending.pop();if(files.has(file))continue;files.add(file);
  const text=read(file);
  for(const m of text.matchAll(/(?<![\w-])id\s*=\s*\\?["']([\w:.-]+)\\?["']/g))counts.set(m[1],(counts.get(m[1])||0)+1);
  if(file.endsWith('.html'))for(const m of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/g))enqueue(file,m[1]);
  if(file.endsWith('.css'))for(const m of text.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g))enqueue(file,m[1]);
  if(file.endsWith('.js'))for(const m of text.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?)["']([^"']+)["']/g))enqueue(file,m[1]);
 }
 return {counts,files};
}
export function assertNoNewDuplicateIds(read,readBase){
 const current=literalIds(read),base=literalIds(readBase);
 for(const [id,count]of current.counts)if(count>1)assert.ok(count<=(base.counts.get(id)||0),`new duplicate id="${id}": ${base.counts.get(id)||0} -> ${count}`);
 return {files:current.files.size,baseFiles:base.files.size,existingDuplicates:[...current.counts].filter(([,n])=>n>1).length};
}
