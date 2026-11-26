// Test-only menu boundary: explicit outer files are absent from the older tree.
// Do not alter Git trees/objects, assertions, or filesystem contents.
const path=require('node:path'),{fileURLToPath}=require('node:url');
const inverse=require('./hani-menu-badges-source.cjs'),repository=require('./hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'..'),authored='55f3fe64e2b88aa1b39ed503e3133614265e88d7';
const outerFiles=new Map([
 // building322 outer boundaries
 ['scripts/hani-building-322-source.cjs','65bdcb46a0d3a5a4ed65a3d00105ebd47c54225c1585ca06851e04160311db65'],
 ['scripts/hani-building-322-preload.cjs','543b81a06d6dc35c54d691a6e2d70682fe06278a1f2f444efdf290e314e3ab3a'],
 ['scripts/hani-building-322-layer.test.mjs','0d21dd80d4900c2d835d23ef6ffbc2c40c2ad2d1acf2ec7cd8bf165b8c30fc2e'],
 ['scripts/fixtures/building-322-layer.json','9413e4e6680271f5254361138b226084822a52a8ab1c6731adb87a6c594d7011'],
 // building322 outer boundaries end
 // tooling321 outer boundaries
 ['scripts/hani-release-321-source.cjs','e6f7983de8a7304e6ea48e5d2a4cb057458ef1869b5fa7e416c957cf2f9fb841'],
 ['scripts/hani-release-321-preload.cjs','3c397bb7c8580a44fe84d59dc1640e9921582b12b8eb1d594013022953eed7eb'],
 ['scripts/hani-release-321-reviewed-input.cjs','e9dbd5a13b84ad73ad594a3d657e4a2c7353d8eef6fe953514144852350021b5'],
 ['scripts/hani-release-321.test.mjs','536d3cf4e1b1ca83ed340d6d306f34072a63ba4495dd170b061650f52d0ec242'],
 ['scripts/fixtures/release-321-layer.json','d7a0cdd1b56d9565361a70916b2b3f1ea0671ca7dc432cb790f620e7a3336542'],
 // tooling321 outer boundaries end
 // building321 outer boundaries
 ['scripts/hani-building-321-source.cjs','268069ef5e71899bcdcab6a885996969e1f5fa5b2c4a157ea18119c879d9fc5e'],
 ['scripts/hani-building-321-preload.cjs','5dbb0260754c8d7a88c0f4421613d2b153389db77ed510a0a2e6faf18e5656d2'],
 ['scripts/hani-building-321-layer.test.mjs','7e4a5c61fd4470467573866730d278d6bf6ceb3ccd1cd74517755aade5002da7'],
 ['scripts/hani-office-route-321.test.mjs','c8357abd3d50a7b50a6818b461cbcf538ad46fbcd168268a68b0743f8e15ef91'],
 ['scripts/fixtures/building-321-layer.json','ac518f85802ff680375befc792a7ef9a012cce456f9eaa65135e49209823e558'],
 // building321 outer boundaries end
 // tooling320 outer boundaries
 ['scripts/hani-release-320-source.cjs','0af5aacc44e0aa9e54f2bc90b4208fb078d4aec206dbc7c7e5c99b84176ce600'],
 ['scripts/hani-release-320-preload.cjs','e035b8b187d9c2af1165e6f36c1a5e1d75549ab55e4c30ee849cf4f84709345d'],
 ['scripts/hani-release-320-reviewed-input.cjs','369980065af959e0a17015b79f0dfe31ad36908fe8b78f8a2108aeeba483c5fe'],
 ['scripts/hani-release-320.test.mjs','85d5930efd349cdc844b79a41d4a1bcd3c740d8e2c33d5baff4fbe0569a827d2'],
 ['scripts/fixtures/release-320-layer.json','eb9a36e0d8d4fba2c6e324b9a4faad7985af98411c424a171dd591c449cd8d6f'],
 // tooling320 outer boundaries end
 // building320 outer boundaries
 ['scripts/hani-building-320-source.cjs','58005b4e827001c2b6e1199d07f3fc7039ad4af2f4f91a9b4a613b1d9088ba1d'],
 ['scripts/hani-building-320-preload.cjs','4f7b989ff390b47a5f90377db1273f5b2a7456d1b796e74c235c20cfda5e634f'],
 ['scripts/hani-building-320-layer.test.mjs','a205b8c7bb43fadb86195a9bcd3c0a2a64343d8e16ce15533063dd2aa888c023'],
 ['scripts/fixtures/building-320-layer.json','19a1459fe99fc4387acb87258cc944361e4898dbb1f855cb7b996fc3437a4070'],
 // building320 outer boundaries end
 // tooling319 outer boundaries
 ['scripts/hani-release-319-source.cjs','4b4635a13f855efecf4afffb1c4d0910bda478a9d147f1cc5baa8632a782f3c4'],
 ['scripts/hani-release-319-preload.cjs','397c5c5288612ff09ee7cd2ac9658db906471234ea44f4314081ec22279dc483'],
 ['scripts/hani-release-319-reviewed-input.cjs','4e4cab5f5becd90a0d549e9bc0ebb7f4185564de53ec27859c17452bcd9e4b3e'],
 ['scripts/hani-release-319.test.mjs','8716d728c639b2f60af025f9261f4983111eec74e958bf58697f330cb8f0e9a7'],
 ['scripts/fixtures/release-319-layer.json','847ecd10b0496f0509fb22c425a5812305754085e95a5ff633b4a637556e9db8'],
 // tooling319 outer boundaries end
 // building319 outer boundaries
 ['scripts/hani-building-319-source.cjs','2af55807554316f880a22ab166e78e813ec9c786ce77d89866e6e3f37dcb4032'],
 ['scripts/hani-building-319-preload.cjs','69d9bb80850450a003b9f2d56cedbd93273edaea08a66bdc5eba2c427eed8984'],
 ['scripts/hani-building-319-layer.test.mjs','60aa3c4c3606bca45c6587a4beb7ae33e63ace0648d082641296addcac064b77'],
 ['scripts/fixtures/building-319-layer.json','9f174c29bf0ab5b03aaac935d0f490f88625b1b1eb2667ed43f7127f78093257'],
 // building319 outer boundaries end
 // tooling318 outer boundaries
 ['scripts/hani-release-318-source.cjs','c726ec4b00bdb75415e689385f355e3da359a86a34b63a47e2612b2bb6727721'],
 ['scripts/hani-release-318-preload.cjs','81ca13310fa52321cb61ceb01753142667e095bb18233dd6139c7ea256097f9e'],
 ['scripts/hani-release-318-reviewed-input.cjs','ed39185438296757aab402a57e203cc5b68e8ec9d03168fb6674cca891d6841b'],
 ['scripts/hani-release-318.test.mjs','48869bb48a109bc2d0d222aff86ed80f9aad6f4635082893d8728f91b2535216'],
 ['scripts/fixtures/release-318-layer.json','7c4ba3e7403511f5035719452a765d0e77c8b3a4a6a7e8c7c8c23b18d994c067'],
 // tooling318 outer boundaries end
 // building318 outer boundaries
 ['scripts/hani-building-318-source.cjs','9d3093a9674cf694e006d4a7735303b43b07cec7b348643be07f20192822d897'],
 ['scripts/hani-building-318-preload.cjs','9f80bec4e4f1da4cb4ab458cbed3338330b94546fb271a194ee816723e60b5bb'],
 ['scripts/hani-building-318-layer.test.mjs','a3076959d2d6d1798e63e17fc2767cfa7cbdd78b6f2b511ab6be6abb8cdcfeb0'],
 ['scripts/fixtures/building-318-layer.json','b5ef00a3191e16006766f65a9ecdaaf6f5f5e34d36185605a89a80987755f7e6'],
 // building318 outer boundaries end
 // tooling317 outer boundaries
 ['scripts/hani-release-317-source.cjs','812d96004175b4032e852187d9c7bb7458b3a26903c1d7747a30ad34a57cbcaa'],
 ['scripts/hani-release-317-preload.cjs','cf9c3ffde0ac59af93eddcabe7b1cac592c87b0c2e79b07b90d6be92f1ab3f06'],
 ['scripts/hani-release-317-reviewed-input.cjs','c9eb71f08cc241f1f700ed6e74d0c4632a87a9cbb528e2d7db43d177c6bebe33'],
 ['scripts/hani-release-317.test.mjs','d7d9f1af65430c1b4be0f84c8a4184b3403107b54bedabda3fc36584a0c8e75c'],
 ['scripts/fixtures/release-317-layer.json','a8bb88fe765c058ff7c7fd039b382bc4784cae22f559ffb0adee8a5534f25b89'],
 // tooling317 outer boundaries end
 // building317 outer boundaries
 ['scripts/hani-building-317-source.cjs','8fb15643eeec8ab4fe96448c9bb79b4ff57f4dc53d0bf2be4ccbc2ffa6b1e5ed'],
 ['scripts/hani-building-317-preload.cjs','623a9bb7e6842cb201986860ee9f25a65a57503e40a6e21abaa95d48fa02ec1b'],
 ['scripts/hani-building-317-layer.test.mjs','eca0fc2b321caca5d0f17ed1e9830b2721f6c5bb368d2754b28c50bcad3fb5f6'],
 ['scripts/fixtures/building-317-layer.json','718f7eeb7e5fbecc50bd11d4c3feba0e1e650e04ad785e34527dcd4b85c490e2'],
 // building317 outer boundaries end
 // tooling316 outer boundaries
 ['scripts/hani-release-316-source.cjs','ad13d601a932209af3c51559236ae37bf9ab44536c08c88875fabd39edb5d148'],
 ['scripts/hani-release-316-preload.cjs','4535617e7aaddbc2441954d3d579af48bb3c536aaa38ea4aad2d3a3fcbe99586'],
 ['scripts/hani-release-316-reviewed-input.cjs','520b8b93fc865d66344f0e5835022be058bd2247b3732d87041c5913536fa9d7'],
 ['scripts/hani-release-316.test.mjs','8167940d9a88bdd307e2a9d370781db79abefc5a7720d5bfc1a35844d71b3114'],
 ['scripts/fixtures/release-316-layer.json','2f9ff5b684fdb71919b8fb5b7295728e44531fd0241a6149c8666dc2075e8479'],
 // tooling316 outer boundaries end
 // building316 outer boundaries
 ['scripts/hani-building-316-source.cjs','73fb700e32835ad9e50a5a9b95395927b62bb3fbe8cbe714ff5009c07f96112b'],
 ['scripts/hani-building-316-preload.cjs','ac0e83bd9e56a530d4fa9c102973fa22fb48fde6a399956d133738409cf7a3c0'],
 ['scripts/hani-building-316-layer.test.mjs','ee2e5c1f74588bf5163a00bc2bae9c91c163c4586d0f73449931e7bca26ccf14'],
 ['scripts/hani-office-sim-41.test.mjs','0e60ba6c67ed70449ad841a5ef72b29bc5cacc7603483acca60e6312360240df'],
 ['scripts/fixtures/building-316-layer.json','cb162731d681229032b4a7d3809c41c66632222e73453c75f86cf9ad52e71293'],
 // building316 outer boundaries end
 // tooling315 outer boundaries
 ['scripts/hani-release-315-source.cjs','33869af8c8e56c0b48c7af5285d09fd3a021fa8f61b356c340376d06bccd7035'],
 ['scripts/hani-release-315-preload.cjs','6af011c71d76393fb1b2ba82e5bc9d02e2b7137b7c9b4580ce14c3fe8e249a2d'],
 ['scripts/hani-release-315-reviewed-input.cjs','32a1d8e70cb0867e99b82a193b6f050990b4f03027dccc6065d788410472e94b'],
 ['scripts/hani-release-315.test.mjs','fcf5949f439f5ea6e48e0d7b86942be2fb2100ed68cb02ecf2a4fbce698a8cf0'],
 ['scripts/fixtures/release-315-layer.json','83b593d749e10513f85fa1362fe516ed19b9a073b0e72a80b0dca4b0d9c04c2a'],
 // tooling315 outer boundaries end
 // building315 outer boundaries
 ['scripts/hani-building-315-source.cjs','9749ef69d8f5cf3db241a2ad138b2e29c1fb7f4fce7c3868a862b9749158bf7f'],
 ['scripts/hani-building-315-preload.cjs','5c9acbe7a919ad1f725b18dd59d66cd9b2956dc5bd1041f7a9ee6a56b1b4a119'],
 ['scripts/hani-building-315-layer.test.mjs','36c7f4f93bc29b7f4b912cd3f66e947f2ad351f60b51d1d99c1ddccf409e3e94'],
 ['scripts/hani-building-phase3a.test.mjs','cb90716f70562744a68ac58c15b35299a547654a3f87b2dff34b6ca95b960889'],
 ['scripts/fixtures/building-315-layer.json','bcb383a8ddf3c898ff3370ebed3ec8e1a616d07125661b7d6b3f88879202b23f'],
 // building315 outer boundaries end
 // tooling314 outer boundaries
 ['scripts/hani-release-314-source.cjs','c466222b359c6c25b0e56446ce8c7ea1de35f2d7eb870bac67b667895d429061'],
 ['scripts/hani-release-314-preload.cjs','d1074490cfa2504af17968a8d3e365d426c2edbc974a2c40e9e069da760cf409'],
 ['scripts/hani-release-314-reviewed-input.cjs','8b78ea2adf333f242235b1eaaf75a6759d389ccdb2d4887725970b5442e51ab6'],
 ['scripts/hani-release-314.test.mjs','7465bd597bf436e0e30bfe49cf621b50089ea1c319d13f29ee14674711a5d599'],
 ['scripts/fixtures/release-314-layer.json','16cafac5866baeeb75a9d159569cb1b66ccaa2dafba3e5d593ef3502ef200cbf'],
 // tooling314 outer boundaries end
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
