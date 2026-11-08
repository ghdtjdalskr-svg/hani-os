import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir=path.resolve('../rel282'),expected={'index.html':'2fe92354e02751f5a4a8ece93ea56a4aa819c4bc7536876aee3415f7a5944d6d','hani-main.js':'ef067e9fa7eecd6c7f27c044aa3fd2a14e4e05833174491be2e4e77de40a8c4b','hani-study-v02984.js':'ebcf36c9c8d9ffd19c1f43a6e10189523b493bd6540628a702200885d556de7c'};
for(const [f,h] of Object.entries(expected))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex'),h,f+' independently located release-282 bytes');
console.log('PASS independent rel282 lower-layer baseline digests');
