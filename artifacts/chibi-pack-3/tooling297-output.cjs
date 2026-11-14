// Test evidence routing only; no inverse or assertions. Existing outputs stay intact.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'tooling297-local','generated');
const write=fs.writeFileSync.bind(fs),read=fs.readFileSync.bind(fs),mkdir=fs.mkdirSync.bind(fs),exists=fs.existsSync.bind(fs),mapped=new Map();
function target(file){
 if(typeof file!=='string'&&!(file instanceof URL))return null;
 const absolute=path.resolve(file instanceof URL?fileURLToPath(file):file),name=path.relative(root,absolute).replaceAll('\\','/');
 if(name.startsWith('artifacts/')||(!name.includes('/')&&name.endsWith('.json')))return {absolute,out:path.join(local,name)};
 return null;
}
fs.writeFileSync=function(file,...args){const row=target(file);if(!row)return write(file,...args);mkdir(path.dirname(row.out),{recursive:true});mapped.set(row.absolute,row.out);return write(row.out,...args)};
fs.readFileSync=function(file,...args){const row=target(file);return read(row&&mapped.get(row.absolute)||file,...args)};
fs.existsSync=function(file){const row=target(file);return exists(row&&mapped.get(row.absolute)||file)};
require('node:module').syncBuiltinESMExports();
