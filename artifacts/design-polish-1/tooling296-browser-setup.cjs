// Execute browser comparison setup only; never create a server or launch Edge.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),vm=require('node:vm'),{createHash}=require('node:crypto');
const repository=require('../../scripts/hani-test-repository-evidence.cjs'),design295=require('../../scripts/hani-design-polish-1-main295-source.cjs'),release296=require('../../scripts/hani-release-296-source.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../../scripts/hani-design-polish-1.browser.mjs'),'utf8');
const prefix=source.slice(0,source.indexOf('fs.mkdirSync(out,')).replace(/^import .*\r?\n/gm,'').replaceAll('import.meta.dirname','scriptDirectory');
const context=vm.createContext({fs,path,http,assert,createHash,repository,design295,release296,scriptDirectory:path.resolve(__dirname,'../../scripts')});
const evidence=JSON.parse(vm.runInContext(prefix+';JSON.stringify({base:report.base,sourceHashes:report.sourceHashes,out,finishes:finishes.length,seasons:seasons.length,cases:cases.length})',context));
assert.equal(evidence.base,design295.delta.base);
for(const [file,row]of Object.entries(design295.delta.files)){
 assert.deepEqual(evidence.sourceHashes[file],{before:row.beforeSha256,after:release296.layer.files[file]?.after||row.afterSha256});
 assert.equal(evidence.sourceHashes[file].after,createHash('sha256').update(repository.read('56c3105',file)).digest('hex'));
}
assert.equal(evidence.out,path.join(__dirname,'tooling296-local','browser'));
assert.deepEqual([evidence.finishes,evidence.seasons,evidence.cases],[6,4,9]);
fs.writeFileSync(path.join(__dirname,'tooling296-browser-setup.json'),JSON.stringify({result:'PASS_SETUP_ONLY',...evidence,edge:'NOT_RUN',pixels:'NOT_RUN'},null,2)+'\n');
console.log(JSON.stringify({result:'PASS_SETUP_ONLY',base:evidence.base,owners:2,edge:'NOT_RUN',pixels:'NOT_RUN'}));
