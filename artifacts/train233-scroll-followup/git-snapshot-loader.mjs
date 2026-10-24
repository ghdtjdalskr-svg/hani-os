// Reuse the previously validated fixed Git exports; extend by two a29ff90 blobs.
// This is test input supply only, not browser or permission emulation.
import '../train233-sticky-followup/git-snapshot-loader.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
const ref='a29ff905be5a3458a0f6971c107c183d96c6b965',files=[
 ['hani-design-system.css','6d8e993e94fe5702aa23d6a4ae8c11da35bdb2de'],
 ['scripts/fixtures/train233-integrations.json','3d54fb4b0e70f54647f970ce328d068b56ea2e93']
],inputs=new Map(),manifest=[];
for(const [file,blob]of files){
 const bytes=fs.readFileSync(new URL('base/'+file,import.meta.url));
 assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),blob,file+' raw fixed Git identity');
 inputs.set(ref+':'+file,bytes);manifest.push({ref,file,blob,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
fs.writeFileSync(new URL('snapshot-manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
const prior=childProcess.execFileSync;
childProcess.execFileSync=(command,args,options)=>{
 if(inputs.has(args?.[1])){assert.match(command,/(?:^|[/\\])git(?:\.exe)?$/i);assert.deepEqual(args,['show',args[1]]);assert.equal(options.encoding,'utf8');return inputs.get(args[1]).toString('utf8')}
 return prior(command,args,options);
};
syncBuiltinESMExports();
console.log('TEST INPUT ADAPTER: 2 additional fixed a29ff90 blobs verified; original assertions run. Browser NOT RUN.');
