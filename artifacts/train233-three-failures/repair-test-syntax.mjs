import fs from 'node:fs';
const file='scripts/hani-reviewed-release-baseline.test.mjs';
const source=fs.readFileSync(file,'utf8').replace('...("assets/data/office-actions-216.json"','...["assets/data/office-actions-216.json"').replace('"index.html"])].sort());','"index.html"]].sort());');
fs.writeFileSync(file,source);
