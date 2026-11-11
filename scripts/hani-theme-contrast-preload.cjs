// Explicit test-only outermost layer. Does not intercept temporary fixtures,
// baseline exports or raw runtime QA. Version 289 peels to independently pinned
// 288 bytes before unchanged legacy version/feature inverses run.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project,projectLegacy}=require('./hani-theme-contrast-source.cjs');
const root=path.resolve(__dirname,'..'),original=fs.readFileSync;
fs.readFileSync=function(file,options){
  const source=original.apply(this,arguments);
  if(typeof file!=='string'&&!(file instanceof URL))return source;
  const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
  return projectLegacy(project(source,name),name);
};
require('node:module').syncBuiltinESMExports();
