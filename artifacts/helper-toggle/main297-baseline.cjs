// Generate independent, unprojected #513 legacy suites; no child process or Git.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const base='22fedb33cbd67923cc499ba99f55e8902a66ecb2',root=path.resolve(__dirname,'../..');
const local=path.join(__dirname,'local/helperoff3');fs.mkdirSync(local,{recursive:true});
for(const name of ['helper-bot','fun-chat-fortune']){
 const file=path.join(root,'scripts/hani-'+name+'.test.mjs');
 // Preserve every assertion, using original module locations from a local copy.
 const original=repository.read(base,'scripts/hani-'+name+'.test.mjs');
 assert.ok(!original.includes('helper-toggle-preload'));
 const source=original.replace(/(from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g,(_,prefix,target)=>prefix+JSON.stringify(pathToFileURL(path.resolve(path.dirname(file),target)).href))
  .replaceAll('import.meta.url',JSON.stringify(pathToFileURL(file).href));
 fs.writeFileSync(path.join(local,name+'-main297.test.mjs'),source);
}
console.log('Independent main297 original suites prepared; assertions unchanged.');
