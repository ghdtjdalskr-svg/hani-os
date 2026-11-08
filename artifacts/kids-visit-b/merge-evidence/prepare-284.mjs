import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import release from '../../../scripts/hani-release-283-source.cjs';
import {projectLifeSource} from '../../../scripts/hani-life-bundle-source.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),files={};
const launch='<template id="launchGreetingAssets"><img data-launch-day src="./assets/launch/chibi-launch-v1-day.webp" alt=""><img data-launch-night src="./assets/launch/chibi-launch-v1-night.webp" alt=""></template>\r\n<script src="./hani-launch-greeting.js"></script>\r\n';
for(const file of ['index.html','hani-main.js']){
 const after=fs.readFileSync(file,'utf8'),before=after.replaceAll('2.9.284','2.9.283');
 assert.equal(hash(before),release.files[file].after,'existing 283 pin unchanged');
 files[file]={after:hash(after),before:hash(before),count:after.split('2.9.284').length-1};
}
const sources=new Set([fs.readFileSync('index.html','utf8')]);
const release283=fs.readFileSync('index.html','utf8').replaceAll('2.9.284','2.9.283');sources.add(release283);sources.add(release283.replaceAll('2.9.283','2.9.282'));
for(const target of ['dev-report','wishlist','procrastination','study-retry','main'])sources.add(projectLifeSource(release283,'index.html',target));
const closures=[...sources].map(source=>{
 assert.equal(source.split(launch).length-1,1,'complete launch owner');
 return {after:hash(source),before:hash(source.replace(launch,''))};
});
fs.writeFileSync('scripts/fixtures/office-release-284.json',JSON.stringify({base:'5c375d9',files,launch,closures},null,2)+'\n');
console.log(JSON.stringify({files,closurePins:closures.length,fixture:hash(fs.readFileSync('scripts/fixtures/office-release-284.json'))}));
