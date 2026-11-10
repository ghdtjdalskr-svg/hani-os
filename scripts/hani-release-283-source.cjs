// Test-only outer inverse: release 283 changed exactly 60 index and one main
// version tokens. Full input/output digests retain every other byte and EOL.
const layers=require('./hani-release-version-layers.cjs');
const files=layers.getLayer('2.9.283').files;
function restoreRelease283(source,file){
 return layers.restoreVersionLayer(layers.projectReleaseSource(source,file,'2.9.283'),file,'2.9.283');
}
function projectPreRelease283Source(source,file){return layers.projectReleaseSource(source,file,'2.9.282');}
module.exports={files,restoreRelease283,projectPreRelease283Source};
