// Keep the existing QA-1st safety test intact; isolate its fixed artifact paths.
const fs=require('node:fs'),path=require('node:path'),{syncBuiltinESMExports}=require('node:module');
const read=fs.readFileSync,write=fs.writeFileSync,root=path.resolve(__dirname,'../..');
const cache=JSON.parse(read(__dirname+'/git-blobs.json','utf8'));
const files=['hani-main.js','hani-asset-update-v1.js','hani-context-remote-v1.js','hani-context-remote.css','hani-design-system.css','hani-study-v02984.js','hani-yuna-helpdesk.js','hani-investment-committee.js','hani-asset-market-view.js','index.html'];
fs.mkdirSync(__dirname+'/base',{recursive:true});
for(const file of files)write(__dirname+'/base/'+file,Buffer.from(cache['cefa62554e520c42acdc8310dd8f00f4dac0148a:'+file],'base64'));
fs.readFileSync=function(file,...args){if(String(file)===path.join(root,'artifacts/qa-1st/eol-map.diff'))file=__dirname+'/patch.diff';return read.call(this,file,...args);};
fs.writeFileSync=function(file,...args){if(String(file)===path.join(root,'artifacts/qa-1st/safety-results.json'))file=__dirname+'/qa-safety-results.json';return write.call(this,file,...args);};
syncBuiltinESMExports();
process.argv[2]=__dirname+'/base';
import('../../scripts/hani-qa-1st-safety.mjs');
