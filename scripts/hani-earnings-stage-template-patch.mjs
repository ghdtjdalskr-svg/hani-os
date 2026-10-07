import fs from 'node:fs';
const file='C:/Users/홍성민/Documents/HANI_OS_DEV/.worktrees/earnings-annual-viewer-20261005/hani-main.js';
const old=fs.readFileSync(file,'utf8').split(/\r?\n/).find(line=>line.startsWith('const earningsPptStageTemplate='));
if(!old)throw Error('Template anchor missing');
const {encoded}=JSON.parse(fs.readFileSync('artifacts/earnings-stage-template/stage-template.json','utf8'));
process.stdout.write(`*** Begin Patch\n*** Update File: ${file}\n@@\n-${old}\n+const earningsPptStageTemplate=${JSON.stringify(encoded)};\n*** End Patch`);
