// Diagnostic only: rerun unchanged existing tests against the original HEAD bytes.
// No assertion or candidate source changes; result stays separately identified.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),original=fs.readFileSync,bytes=new Map();
for(const file of ['hani-main.js','hani-design-system.css'])bytes.set(path.join(root,file),execFileSync(process.env.HANI_GIT_PATH,['show','HEAD:'+file],{cwd:root,maxBuffer:20*1024*1024}));
fs.readFileSync=function(file,options){let absolute;try{absolute=file instanceof URL?require('node:url').fileURLToPath(file):path.resolve(String(file))}catch{}const value=bytes.get(absolute);if(!value)return original.apply(this,arguments);const encoding=typeof options==='string'?options:options?.encoding;return encoding?value.toString(encoding):Buffer.from(value)};
const stream=fs.createReadStream;fs.createReadStream=function(file){const value=bytes.get(path.resolve(String(file)));return value?require('node:stream').Readable.from([Buffer.from(value)]):stream.apply(this,arguments)};
require('node:module').syncBuiltinESMExports();
