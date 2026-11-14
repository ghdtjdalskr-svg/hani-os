// Seoyun-only launcher: preserve the original browser assertions, route all evidence locally.
// This helper is prepared but not executed by Codex (Edge is forbidden for this task).
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath,pathToFileURL}=require('node:url');
const out=path.join(__dirname,'tooling297-local','browser');fs.mkdirSync(out,{recursive:true});
const write=fs.writeFileSync.bind(fs),mkdtemp=fs.mkdtempSync.bind(fs);
fs.writeFileSync=function(file,...args){
 if(typeof file==='string'||file instanceof URL){
  const absolute=path.resolve(file instanceof URL?fileURLToPath(file):file);
  if(path.dirname(absolute)===__dirname)file=path.join(out,path.basename(absolute));
 }
 return write(file,...args);
};
fs.mkdtempSync=function(prefix,...args){
 if(typeof prefix==='string'&&path.basename(prefix)==='hani-chibi3-edge-')prefix=path.join(out,'hani-chibi3-edge-');
 return mkdtemp(prefix,...args);
};
require('node:module').syncBuiltinESMExports();
import(pathToFileURL(path.resolve(__dirname,'../../scripts/hani-chibi-pack-3.browser.mjs')).href).catch(error=>{console.error(error);process.exitCode=1});
