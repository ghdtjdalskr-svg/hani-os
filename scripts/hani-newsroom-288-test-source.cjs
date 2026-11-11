// Opt-in reader for tests pinned to the earlier release, never browser runtime.
const path=require('node:path'),{fileURLToPath}=require('node:url');
const releases=require('./hani-release-version-layers.cjs'),outer=require('./hani-newsroom-288-source.cjs'),root=path.resolve(__dirname,'..');
module.exports={...releases,readRawFileSync(file,options){
  const value=releases.readRawFileSync(file,options);if(typeof file!=='string'&&!(file instanceof URL))return value;
  const absolute=file instanceof URL?fileURLToPath(file):path.resolve(file);
  return outer.projectPreNewsroom288Source(value,path.relative(root,absolute).replaceAll('\\','/'));
}};
