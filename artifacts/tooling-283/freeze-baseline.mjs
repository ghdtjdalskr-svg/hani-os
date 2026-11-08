import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const expected={'index.html':'2fe92354e02751f5a4a8ece93ea56a4aa819c4bc7536876aee3415f7a5944d6d','hani-main.js':'ef067e9fa7eecd6c7f27c044aa3fd2a14e4e05833174491be2e4e77de40a8c4b','hani-study-v02984.js':'ebcf36c9c8d9ffd19c1f43a6e10189523b493bd6540628a702200885d556de7c','hani-ui-v02992.js':'5a83b8de88c24e8fe6f5df68d0d67d1e85f26d08bab0f286f4bf8a1a9a01bd62'};
const files={};for(const [file,digest] of Object.entries(expected)){const raw=fs.readFileSync(path.join('../rel282',file));assert.equal(hash(raw),digest,file);files[file]={sha256:digest,source:raw.toString('utf8')};assert.equal(hash(files[file].source),digest,'lossless UTF-8 '+file);}
const bytes=zlib.gzipSync(JSON.stringify({base:'2feb724c94c92f206c5f79dd992632cbb3b58874',files}),{level:9});
fs.writeFileSync('scripts/fixtures/life-bundle-baseline-282.json.gz',bytes);
fs.writeFileSync('artifacts/tooling-283/baseline-evidence.json',JSON.stringify({source:'../rel282',files:expected,gzipSha256:hash(bytes),bytes:bytes.length},null,2));
console.log(JSON.stringify({sha256:hash(bytes),bytes:bytes.length}));
