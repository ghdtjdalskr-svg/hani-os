// Restore unseeded development-document fixtures only; runtime stays on disk.
import './hani-pb-chibitoon-legacy-preload.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
import {pbHash} from './hani-pb-chibitoon-source.mjs';
import assert from 'node:assert/strict';
const docs=fileURLToPath(new URL('../docs/gemini-reports/',import.meta.url));
const fixture=fileURLToPath(new URL('./fixtures/dev-report-283-docs/',import.meta.url));
const manifestBytes=fs.readFileSync(path.join(fixture,'manifest.json'));
assert.equal(pbHash(manifestBytes),'37505100f57d379bd046b7e535db46aa7b81f8b3c530269e3d9751047965cf37','frozen development-document manifest');
const manifest=JSON.parse(manifestBytes);
for(const [name,hash]of Object.entries(manifest))assert.equal(pbHash(fs.readFileSync(path.join(fixture,name))),hash,'frozen source document '+name);
const originalRead=fs.readFileSync,originalExists=fs.existsSync,originalList=fs.readdirSync;
const mapped=file=>{
 if(typeof file!=='string'&&!(file instanceof URL))return null;
 const absolute=file instanceof URL?fileURLToPath(file):path.resolve(file);
 if(path.dirname(absolute)+path.sep!==docs)return null;
 const name=path.basename(absolute);
 return Object.hasOwn(manifest,name)?path.join(fixture,name):null;
};
fs.readFileSync=function(file,options){return originalRead.call(this,mapped(file)||file,options)};
fs.existsSync=function(file){return originalExists.call(this,mapped(file)||file)};
fs.readdirSync=function(file,options){
 const list=originalList.call(this,file,options);
 if(typeof file==='string'&&path.resolve(file)+path.sep===docs&&!options?.withFileTypes)return [...new Set([...list,...Object.keys(manifest)])].sort();
 return list;
};
syncBuiltinESMExports();
