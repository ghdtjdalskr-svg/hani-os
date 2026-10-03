/* Feature-local deterministic bundle; does not change release gates. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=path.join(root,'hani-asset-market-view.js');
const marker='/* HANI PORTFOLIO READ-ONLY BUNDLE START */';
const original=fs.readFileSync(target,'utf8').split(marker)[0].trimEnd();
const bundled=original+'\n'+marker+'\n'+['hani-portfolio-analytics.js','hani-portfolio-preview.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8').trimEnd()).join('\n')+'\n';
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==bundled.replace(/\r\n/g,'\n'))throw Error('Portfolio source/bundle mismatch');console.log('PASS portfolio bundle source parity');}
else fs.writeFileSync(target,bundled);
