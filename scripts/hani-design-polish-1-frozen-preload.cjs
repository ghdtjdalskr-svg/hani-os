// Only the frozen design294 test imports this input adapter. No runtime imports.
// Peel exact newer bytes, then reapply the unchanged frozen design edits in memory.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const outer=require('./hani-design-polish-1-main295-source.cjs');
const frozen=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/design-polish-1-delta.json'),'utf8'));
const root=path.resolve(__dirname,'..'),sync=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 if(!/^(?:index\.html|[^/]+\.(?:js|css)|assets\/|data\/)/.test(name))return bytes;
 const row=frozen.files[name];
 if(row&&outer.hash(bytes)===row.afterSha256)return bytes;
 let source=require('./hani-release-version-layers.cjs').projectReleaseSource(outer.project(bytes,name),name,'2.9.294');
 if(row&&outer.hash(source)===row.beforeSha256){
  const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
  for(const edit of row.edits)text=edit.before?text.replace(edit.before,()=>edit.after):text+edit.after;
  require('node:assert/strict').equal(outer.hash(text),row.afterSha256,'exact frozen design294 test input');
  source=buffer?Buffer.from(text):text;
 }
 return source;
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,bytes)=>{if(error)return done(error);try{done(null,apply(file,bytes))}catch(e){done(e)}})};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
