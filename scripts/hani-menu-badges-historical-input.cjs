// Test-only menu boundary: explicit outer files are absent from the older tree.
// Do not alter Git trees/objects, assertions, or filesystem contents.
const path=require('node:path'),{fileURLToPath}=require('node:url');
const inverse=require('./hani-menu-badges-source.cjs'),repository=require('./hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'..'),authored='55f3fe64e2b88aa1b39ed503e3133614265e88d7';
const outerFiles=new Map([
 // procrast314 outer boundaries
 ['scripts/hani-procrast-314-source.cjs','f2487afc39fa2da66b606d609d76c4a358e80cd2b6f374d97febdb31530de710'],
 ['scripts/hani-procrast-314-preload.cjs','3ee3661c9c19d435fbbcf94d2db0e5389685c2a8f9ea15d0689a2352073dafcd'],
 ['scripts/hani-procrast-314-layer.test.mjs','87e3d4c783d256e6db4fc82a29f4668d08a56242cbaa556147924853091aab6d'],
 ['scripts/hani-procrastination-4.test.mjs','b721bf497ca0bbc9bd571c1907b35c955d46bedea346e59b411400f3650578c1'],
 ['scripts/fixtures/procrast-314-layer.json','006c2da01269258080a4099fcf9e9e839799624e7f44e22e90ef4c326a9ad9fb'],
 // procrast314 outer boundaries end
 // tooling313 outer boundaries
 ['scripts/hani-release-313-source.cjs','95d75bcb5d372820128533a4118ae75b9905894ab9affe51dbdfb44b1318bb8f'],
 ['scripts/hani-release-313-preload.cjs','ab593b0fa2bf99d4a707d7bc13ead847bc2b6b55697a18b8fc3d8ecfbfffa56d'],
 ['scripts/hani-release-313-reviewed-input.cjs','6ee147b68be25493ad5eabb58cb0b6fa87f168bbd0cb0ed53ec53121961c1445'],
 ['scripts/hani-release-313.test.mjs','e9df87c0dab14763f83bfab016caf172255b508f3db0963f2ba77b6034d10f7d'],
 ['scripts/fixtures/release-313-layer.json','9c904d4ecad295ed7057a69595f173442a056a4534137424e42d4f5322782823'],
 // tooling313 outer boundaries end
 // toon313 outer boundaries
 ['scripts/hani-toon-313-source.cjs','371720551dd18a648caf1912532f61e82cec34a4a8bb6dbeab7c11700f1abcdc'],
 ['scripts/hani-toon-313-preload.cjs','019e57403a8b459b457ace3f0be44dcbe1169efffd33c60a612f2ba646a0bd9b'],
 ['scripts/hani-toon-313-layer.test.mjs','deb421ab032aa52defb408ae256cc17647e94133026190cddee07afdcf8010df'],
 ['scripts/hani-toons.test.mjs','71bda48068527e90a215b6d73a37bdfe2e56842abd842d58232b06dd33a3035a'],
 ['scripts/fixtures/toon-313-layer.json','94b07be31e61113170cff01dd8e3bc2a2dcfa74f061533dc40d84220032de7a3'],
 // toon313 outer boundaries end
 // tooling312 outer boundaries
 ['scripts/hani-release-312-source.cjs','bc961ed610a6bf28c884e6d871c2c9d886fadfd89dc5bf3b43bf1f5423d07305'],
 ['scripts/hani-release-312-preload.cjs','5b6cb101e4c8dbf13b5795f6668d47fd1218c9d505a1683f0d5329d6274d89d5'],
 ['scripts/hani-release-312-reviewed-input.cjs','3d34be4346fd9b35f2a186f7e9b969c76854894534781076519c0f4762065af2'],
 ['scripts/hani-release-312.test.mjs','19cf74ac1cea74a1f2d4d7c314b4bc14f334837dcce7d14af40854c7844898ff'],
 ['scripts/fixtures/release-312-layer.json','ac7a4cb48b0678bb3a15bf4c93955fe9c568ad9fed521ff1056c3558ce6ae8fe'],
 // tooling312 outer boundaries end
 // procrast312 outer boundaries
 ['scripts/hani-procrast-312-source.cjs','3d9370cc2a505c5ae3f3d286238bf73de047748764e203f98786731d970bfb54'],
 ['scripts/hani-procrast-312-preload.cjs','1d24ec71aca0b2e259ac4aa43b663038f0637e9970c832f310e8cd9541436acc'],
 ['scripts/hani-procrast-312-layer.test.mjs','687ae87e7bbbc2f7e805a0f3a72ea7ed342d41d93c689fd7a1b84d196d334df7'],
 ['scripts/fixtures/procrast-312-layer.json','dea8618fc74d090be3bc7cd932a2027254f0091fa1a4d0fe5bce54143416f8a1'],
 ['scripts/hani-procrastination-2.test.mjs','e6a812643822992fc72cfae12f32217ed5b5995462115958ab169e94968d3f14'],
 ['scripts/hani-attendance-bonus.test.mjs','59c25d1e1378ab7b8d09b754faf240410e21443321c35bc3f9906fb82412fe96'],
 // procrast312 outer boundaries end
 // tooling311 outer boundaries
 ['scripts/hani-release-311-source.cjs','1dedb3ff4db22ba8e878fc327395016ad4009af4041371069b4ff4f80c20df26'],
 ['scripts/hani-release-311-preload.cjs','3cad882ea10acbc7516afc1d76f97a6113b5b9e12fa649079be9e099dc994fbe'],
 ['scripts/hani-release-311-reviewed-input.cjs','fac23d3e6d4583f529188316ba959508b2578da6a58a7111595a11315d14766e'],
 ['scripts/hani-release-311.test.mjs','1d9d9e1596dbb046a89b84c843a02998284e76edc4f4c5bc623340a8b3a3cbef'],
 ['scripts/fixtures/release-311-layer.json','9779dc5e3eac0f3e850ce768f9d8a4e9e03e2bf8441d294d17b6ab3220b58fa6'],
 // tooling311 outer boundaries end
 // light311 outer boundaries
 ['scripts/hani-light-311-source.cjs','b9d3464e4a62704cc71aaee8a07b7004787f23432ce485b0ca7fc156daf8ff9b'],
 ['scripts/hani-light-311-preload.cjs','548377552ef362599974ef24ea30a51ce164f7c8335565046052e03696287623'],
 ['scripts/hani-light-311-layer.test.mjs','b6d5d1294d4752d8ae28776832d2daac9640d627196f8de72ec0ca767a519a64'],
 ['scripts/fixtures/light-311-layer.json','6d321281956ac6006c9f8356aa5999e04d02683fcc022d3ceffee814956509c6'],
 ['scripts/hani-theme-light-fix.test.mjs','e10cebbf6ccc5e68c48ae3c49df422ce89855dd5897e52763b228afb6f85a7ae'],
 // light311 outer boundaries end
 // tooling310 outer boundaries
 ['scripts/hani-release-310-source.cjs','1e43f0a774a128dd20ba6ac557e151de0148fda1b5a4e419a61bcb2c6e4c6d15'],
 ['scripts/hani-release-310-preload.cjs','725991e9d9e7e0fdfc5ac138e4d55049d7f13028546b58ca0fc8d2f43d82cfe0'],
 ['scripts/hani-release-310-reviewed-input.cjs','7a8885af3fb8620673cb0e01044ce9fdeac218eff29ac341da5a38155b316f0c'],
 ['scripts/hani-release-310.test.mjs','e8672687525d07396dbb654692f2e57a84dca3f1ccd4e3d1edabaf262b073706'],
 ['scripts/fixtures/release-310-layer.json','25db327cc33876ef59ceff1ff731adcef5b4f960aa088948ac62c0f567408961'],
 // tooling310 outer boundaries end
 // attendance outer boundaries
 ['scripts/hani-attendance-board.test.mjs','052418eaf3ce57f8113d941d7c8a624cbc9a03f3393acc056629a46e93e18194'],
 ['scripts/hani-attendance-core.test.mjs','5afff45abc29ae0dc6325b895828757e275b029c6c9c985841dd2c4a0dc550a1'],
 ['scripts/hani-attendance-layout.test.mjs','592d20545843b94fdba1475728936d44d47b5cb567dac1bdcf9d7298e815efa8'],
 ['scripts/hani-attendance-layer.test.mjs','cb7d1c2c8b8f629345bda938015e829984b6791c263e8314ac006080b7bc4683'],
 ['scripts/fixtures/attendance-layer.json','e8aa6bed12810ad1c8d5023e1e2a4a10b71bbbf280a3777f26383afa80a6cd31'],
 // attendance outer boundaries end
 // tooling309 outer boundaries
 ['scripts/fixtures/release-309-layer.json','7240094271a71ef7300e322f7bb8ac7292f8612b654ca147ee2fdda82203dd74'],
 ['scripts/hani-release-309-source.cjs','e85fa27bce4ed8082bf30d06c7c1ed4ae8636071d83451b831c15abe0492cbbc'],
 ['scripts/hani-release-309-preload.cjs','bcaa9d6a197f880549b675c49a7576a8fd3b673cac44c9c010cb06654582cd17'],
 ['scripts/hani-release-309-reviewed-input.cjs','6179c27873ec6957548ce0b5c013aef0e11aeaab393c5b3e7b01f18a9c5eb40a'],
 ['scripts/hani-release-309.test.mjs','eeafee6f052be65ba9af96058dc718450ef316e194aadb5bc0346f132721f260'],
 // tooling309 outer boundaries end
 // ai-budget-view (2.9.309) outer boundaries
 ['scripts/fixtures/ai-budget-view-layer.json','80900c8cc82f7c443d3286277c3d3c6fb87bd5ebb24c947706532a0018650aee'],
 ['scripts/hani-ai-budget-view-layer.test.mjs','2ae77309dc379721b99c003161c8db98b52ffe604e8ee1a810c9ea5739a46d60'],
 ['scripts/hani-ai-budget-view.test.mjs','16d611d2674e868f6e8b908eacc3da5216caefce92b2b87edd9f6e65f2b67ab1'],
 ['scripts/hani-newsroom-4cut-footnote.test.mjs','87ffa86cced9cc656c585b421b806eea1271be64b1608559cbd4566dab056368'],
 // ai-budget-view outer boundaries end
 // tooling308 outer boundaries
 ['scripts/fixtures/release-308-layer.json','333a59a05abc549560f11fd5a6e4ec982802e12dc447de0ca819c4de4f3e7c0e'],
 ['scripts/hani-release-308.test.mjs','22242c898fc41c381e3502be28ded551133405ed44f1dcb73319a1c3362571fc'],
 ['scripts/fixtures/building-phase1-layer.json','599f7dae9005f4054736108e98abf4a97cf5450ff1a96eabd597b63c8780f3b0'],
 ['scripts/fixtures/building-phase2-layer.json','77941ad99d0703b12e768f48bf2ed4b04183c84badc77e28e94a9f664bdab790'],
 ['scripts/fixtures/building-v2data-layer.json','b1a1ef13d0a8d7f18110ac1ec4cf3baa6af755c6de5b6bacfa472071efbfdfea'],
 ['scripts/hani-building-phase1.test.mjs','2be0175935651dbf0e22f686a4ac8c20c1c9c19fb93d579b5c3574c0ecb25cef'],
 ['scripts/hani-building-phase2.test.mjs','e9915cc218e4eb09d992476d845b3f0a476371ed2d3c8e5f03c8361e3a591df5'],
 ['scripts/hani-office-motion-polish-2.test.mjs','98df2acd1dd31f0ae46a551103bfe0e3d034f4e7888e3d2c2aad4ffdca6c847f'],
 // tooling308 outer boundaries end
 ['scripts/fixtures/release-307-layer.json','b209d2ffdd3dd4d17d996abd3bb81567c05f2450f7c28d2f48fb5ab32caddf7d'],
 ['scripts/hani-release-307.test.mjs','25d9326e63db5693d93f5a1e06e71361377367e1482da1a1fd0120558510bdcc'],
 ['scripts/fixtures/menu-badges-layer.json',null],
 ['scripts/hani-menu-badges-layer.test.mjs',null],
 ['scripts/hani-menu-badges.test.mjs',null],
 ['scripts/hani-menu-seen.test.mjs',null],
 ['scripts/hani-menu-badges-compat.test.mjs','7db2ad030c506e579d4b66fa76d625e9e7068fc4496aaa236f32aa29ca8c3157']
]);
function relative(file){
 if(typeof file!=='string'&&!(file instanceof URL))return null;
 return path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
}
function directory(file,entries,read=inverse.readRawFileSync){
 const dir=relative(file);
 if(!['scripts','scripts/fixtures'].includes(dir))return entries;
 return entries.filter(entry=>{
  const name=typeof entry==='string'?entry:entry.name;
  if(typeof name!=='string')return true;
  const owner=dir+'/'+name;
  if(!outerFiles.has(owner))return true;
  // A changed or unknown outer file remains visible and fails the older check.
  const pin=outerFiles.get(owner)||inverse.hash(repository.read(authored,owner));
  return inverse.hash(read(path.join(root,owner)))!==pin;
 });
}
const diffOwners=['hani-main.js','index.html','hani-study-v02984.js','hani-goal-progress.js','hani-yuna-helpdesk.js'];
function emptyHistoricalDiff(command,args,options,read=inverse.readRawFileSync){
 if(command!=='git'||!Array.isArray(args)||!options||path.resolve(options.cwd||'.')!==root||
    Object.keys(options).some(k=>!['cwd','encoding','maxBuffer'].includes(k))||
    options.encoding!==undefined&&options.encoding!=='utf8'||
    args.length!==4+diffOwners.length||args[0]!=='diff'||args[1]!=='--unified=0'||
    args[2]!==inverse.layer.base||args[3]!=='--'||!diffOwners.every((f,i)=>args[i+4]===f))return null;
 // Prove the entire requested diff empty against independent Git blobs after
 // the exact menu inverse. Never delete selected lines from a nonempty diff.
 for(const owner of diffOwners){
  const source=inverse.project(read(path.join(root,owner)),owner);
  if(!Buffer.from(source).equals(Buffer.from(repository.read(inverse.layer.base,owner))))return null;
 }
 return options.encoding?'':Buffer.alloc(0);
}
function install(fs,entry){
 const name=relative(entry);
 if(['scripts/hani-helper-bubble-layer.test.mjs','scripts/hani-release-306.test.mjs'].includes(name)){
  const readdir=fs.readdirSync;
  fs.readdirSync=function(file,...args){return directory(file,readdir.call(this,file,...args))};
 }
 if(name==='scripts/hani-proactive-204.test.mjs'){
  const cp=require('node:child_process'),exec=cp.execFileSync;
  cp.execFileSync=function(command,args,options){
   const result=emptyHistoricalDiff(command,args,options);
   return result===null?exec.apply(this,arguments):result;
  };
 }
}
module.exports={directory,emptyHistoricalDiff,diffOwners,outerFiles,install,relative};
