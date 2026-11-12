// Explicit test-only outermost layer. Does not intercept temporary fixtures,
// baseline exports or raw runtime QA. Main's 290 version + Ieum inverse precedes
// the unchanged 289 inverse and its independently pinned 288 bytes.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project,projectLegacy}=require('./hani-theme-contrast-source.cjs');
const {project:projectIeum}=require('./hani-join-ieum-source.cjs');
// Capture the shared raw reader before installing this explicit legacy adapter.
require('./hani-release-version-layers.cjs');
const root=path.resolve(__dirname,'..'),original=fs.readFileSync;
fs.readFileSync=function(file,options){
  const source=original.apply(this,arguments);
  if(typeof file!=='string'&&!(file instanceof URL))return source;
  const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
  return projectLegacy(projectIeum(project(source,name),name),name);
};
require('node:module').syncBuiltinESMExports();
