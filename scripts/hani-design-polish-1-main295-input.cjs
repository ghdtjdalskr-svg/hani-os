// Input boundary only: frozen design295 assertions see exactly pre-version296 bytes.
const outer=require('./hani-design-polish-1-main295-source.cjs'),release=require('./hani-release-296-source.cjs');
const path=require('node:path'),{fileURLToPath}=require('node:url'),root=path.resolve(__dirname,'..');
module.exports={...outer,readRawFileSync(file,...args){
 const source=outer.readRawFileSync(file,...args);
 if(typeof file!=='string'&&!(file instanceof URL))return source;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return release.project(source,name);
}};
