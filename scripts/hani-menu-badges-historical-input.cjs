// Test-only menu boundary: explicit outer files are absent from the older tree.
// Do not alter Git trees/objects, assertions, or filesystem contents.
const path=require('node:path'),{fileURLToPath}=require('node:url');
const inverse=require('./hani-menu-badges-source.cjs'),repository=require('./hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'..'),authored='55f3fe64e2b88aa1b39ed503e3133614265e88d7';
const outerFiles=new Map([
 // ai-budget-view (2.9.309) outer boundaries
 ['scripts/fixtures/ai-budget-view-layer.json','80900c8cc82f7c443d3286277c3d3c6fb87bd5ebb24c947706532a0018650aee'],
 ['scripts/hani-ai-budget-view-layer.test.mjs','2ae77309dc379721b99c003161c8db98b52ffe604e8ee1a810c9ea5739a46d60'],
 ['scripts/hani-ai-budget-view.test.mjs','16d611d2674e868f6e8b908eacc3da5216caefce92b2b87edd9f6e65f2b67ab1'],
 ['scripts/hani-newsroom-4cut-footnote.test.mjs','87ffa86cced9cc656c585b421b806eea1271be64b1608559cbd4566dab056368'],
 // ai-budget-view outer boundaries end
 // tooling308 outer boundaries
 ['scripts/fixtures/release-308-layer.json','333a59a05abc549560f11fd5a6e4ec982802e12dc447de0ca819c4de4f3e7c0e'],
 ['scripts/hani-release-308.test.mjs','22242c898fc41c381e3502be28ded551133405ed44f1dcb73319a1c3362571fc'],
 ['scripts/fixtures/building-phase1-layer.json','599f7dae9005f4054736108e98abf4a97cf5450ff1a96eabd597b63c8780f3b0'],
 ['scripts/fixtures/building-phase2-layer.json','77941ad99d0703b12e768f48bf2ed4b04183c84badc77e28e94a9f664bdab790'],
 ['scripts/fixtures/building-v2data-layer.json','b1a1ef13d0a8d7f18110ac1ec4cf3baa6af755c6de5b6bacfa472071efbfdfea'],
 ['scripts/hani-building-phase1.test.mjs','2be0175935651dbf0e22f686a4ac8c20c1c9c19fb93d579b5c3574c0ecb25cef'],
 ['scripts/hani-building-phase2.test.mjs','e9915cc218e4eb09d992476d845b3f0a476371ed2d3c8e5f03c8361e3a591df5'],
 ['scripts/hani-office-motion-polish-2.test.mjs','98df2acd1dd31f0ae46a551103bfe0e3d034f4e7888e3d2c2aad4ffdca6c847f'],
 // tooling308 outer boundaries end
 ['scripts/fixtures/release-307-layer.json','b209d2ffdd3dd4d17d996abd3bb81567c05f2450f7c28d2f48fb5ab32caddf7d'],
 ['scripts/hani-release-307.test.mjs','25d9326e63db5693d93f5a1e06e71361377367e1482da1a1fd0120558510bdcc'],
 ['scripts/fixtures/menu-badges-layer.json',null],
 ['scripts/hani-menu-badges-layer.test.mjs',null],
 ['scripts/hani-menu-badges.test.mjs',null],
 ['scripts/hani-menu-seen.test.mjs',null],
 ['scripts/hani-menu-badges-compat.test.mjs','7db2ad030c506e579d4b66fa76d625e9e7068fc4496aaa236f32aa29ca8c3157']
]);
function relative(file){
 if(typeof file!=='string'&&!(file instanceof URL))return null;
 return path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
}
function directory(file,entries,read=inverse.readRawFileSync){
 const dir=relative(file);
 if(!['scripts','scripts/fixtures'].includes(dir))return entries;
 return entries.filter(entry=>{
  const name=typeof entry==='string'?entry:entry.name;
  if(typeof name!=='string')return true;
  const owner=dir+'/'+name;
  if(!outerFiles.has(owner))return true;
  // A changed or unknown outer file remains visible and fails the older check.
  const pin=outerFiles.get(owner)||inverse.hash(repository.read(authored,owner));
  return inverse.hash(read(path.join(root,owner)))!==pin;
 });
}
const diffOwners=['hani-main.js','index.html','hani-study-v02984.js','hani-goal-progress.js','hani-yuna-helpdesk.js'];
function emptyHistoricalDiff(command,args,options,read=inverse.readRawFileSync){
 if(command!=='git'||!Array.isArray(args)||!options||path.resolve(options.cwd||'.')!==root||
    Object.keys(options).some(k=>!['cwd','encoding','maxBuffer'].includes(k))||
    options.encoding!==undefined&&options.encoding!=='utf8'||
    args.length!==4+diffOwners.length||args[0]!=='diff'||args[1]!=='--unified=0'||
    args[2]!==inverse.layer.base||args[3]!=='--'||!diffOwners.every((f,i)=>args[i+4]===f))return null;
 // Prove the entire requested diff empty against independent Git blobs after
 // the exact menu inverse. Never delete selected lines from a nonempty diff.
 for(const owner of diffOwners){
  const source=inverse.project(read(path.join(root,owner)),owner);
  if(!Buffer.from(source).equals(Buffer.from(repository.read(inverse.layer.base,owner))))return null;
 }
 return options.encoding?'':Buffer.alloc(0);
}
function install(fs,entry){
 const name=relative(entry);
 if(['scripts/hani-helper-bubble-layer.test.mjs','scripts/hani-release-306.test.mjs'].includes(name)){
  const readdir=fs.readdirSync;
  fs.readdirSync=function(file,...args){return directory(file,readdir.call(this,file,...args))};
 }
 if(name==='scripts/hani-proactive-204.test.mjs'){
  const cp=require('node:child_process'),exec=cp.execFileSync;
  cp.execFileSync=function(command,args,options){
   const result=emptyHistoricalDiff(command,args,options);
   return result===null?exec.apply(this,arguments):result;
  };
 }
}
module.exports={directory,emptyHistoricalDiff,diffOwners,outerFiles,install,relative};
