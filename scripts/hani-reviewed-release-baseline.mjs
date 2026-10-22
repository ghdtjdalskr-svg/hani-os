// Preservation oracle: release 225 plus an explicit, immutable list of later
// intended changes. Never use HEAD/merge-base as the expected source itself.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {withoutDeskMascots} from './hani-desk-mascots-preservation.mjs';
import {withoutNewsroom4cut,newsroomBlock,newsroomScript,newsroomEntry,newsroomCss} from './hani-newsroom-4cut-preservation.mjs';
const root=path.resolve(import.meta.dirname,'..');
export const guardedRelease='776752c971f2ce48edf376a707eb345ae57da98c';
export const approvedReleases=[
 {sha:'94ead73706157bda23b94c6f5673b65377106c6a',reason:'226 asset input / train tags',files:['hani-asset-update-v1.js','hani-main.js','hani-style-07.css','index.html']},
 {sha:'a306df16fd0685868f7e4ecdfd9d9b09a9c97d36',reason:'227 Street Journal third tab / office activity / train tags',files:['hani-investment-committee.js','hani-main.js','hani-office-live.js','index.html']},
 {sha:'902b5ab7235c10d08069d88b52c0e2d4ea51c18e',reason:'228 reviewed hero/remote restoration / train tags',files:['hani-context-remote-v1.js','hani-design-system.css','hani-main.js','hani-ui-v02992.js','index.html']},
 {sha:'83391f0258629924bbbad7f1d793c56ab8284604',reason:'229 office activity / train tags',files:['hani-main.js','hani-office-live.js','index.html']},
 {sha:'04fb2b377f28958aec1480ca09244f4567c3a339',reason:'230 office round 3 / train tags',files:['hani-main.js','hani-office-live.js','index.html']}
];
// Display version of the last approved release above; advance together with the list.
export const trainBaseVersion='2.9.230';
// Pending, approved feature connections: normalize CURRENT source only. Git
// release bytes and the immutable release chain above remain the oracle.
export const pendingApprovedConnections=[{
 file:'index.html',
 lines:[
  '<link rel="stylesheet" href="./hani-desk-mascots.css">',
  '<script src="./hani-desk-mascots.js" defer></script>'
 ],
 strip:withoutDeskMascots
},...[
 {file:'index.html',lines:[newsroomBlock,newsroomScript]},
 {file:'hani-main.js',lines:[newsroomEntry]},
 {file:'hani-design-system.css',lines:[newsroomCss]}
].map(connection=>({...connection,strip:source=>withoutNewsroom4cut(connection.file,source,
 connection.file==='hani-main.js'?readReleaseSource('04fb2b377f28958aec1480ca09244f4567c3a339','hani-main.js'):undefined)}))];
export function normalizeReviewedCurrentSource(file,source){
 for(const connection of pendingApprovedConnections)if(connection.file===file){
  for(const line of connection.lines)assert.equal(source.split(line).length-1,1,'one pending approved connection: '+line);
  source=connection.strip(source);
 }
 return source;
}
export function readReviewedCurrentSource(file){
 return normalizeReviewedCurrentSource(file,fs.readFileSync(path.join(root,file),'utf8'));
}
const cache=new Map();
export function readReleaseSource(ref,file){
 const key=ref+':'+file;
 if(!cache.has(key)){
  cache.set(key,execFileSync(process.env.HANI_GIT_PATH||process.env.HANI_GIT||'git',['show',key],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}));
 }
 return cache.get(key);
}
// Only the cache, canonical constant and exact existing display labels may advance. All
// historical/internal version literals and all other bytes stay strict.
export function projectTrainVersion(source,version){
 assert.match(version,/^2\.9\.\d+$/);
 const base=trainBaseVersion,baseRe=base.replaceAll('.','\\.');
 assert.ok(Number(version.split('.').at(-1))>=Number(base.split('.').at(-1)),'train version cannot roll back');
 return source.replace(new RegExp('(\\?v=)'+baseRe+'\\b','g'),'$1'+version)
  .replace(new RegExp('(const HANI_DISPLAY_VERSION=")'+baseRe+'(")','g'),'$1'+version+'$2')
  .replaceAll('HANI OS Life Edition v'+base,'HANI OS Life Edition v'+version)
  .replaceAll('HANI OS · Life Edition v'+base,'HANI OS · Life Edition v'+version)
  .replaceAll('HANI OS · v'+base,'HANI OS · v'+version);
}
export function readReviewedReleaseBaseline(file){
 let expected=readReleaseSource(guardedRelease,file);
 for(const release of approvedReleases)if(release.files.includes(file)){
  assert.equal(expected,readReleaseSource(release.sha+'^',file),file+' unlisted change before '+release.sha);
  expected=readReleaseSource(release.sha,file);
 }
 const main=fs.readFileSync(path.join(root,'hani-main.js'),'utf8');
 const version=main.match(/const HANI_DISPLAY_VERSION="(2\.9\.\d+)";/)?.[1];
 assert.ok(version,'canonical display version');
 return projectTrainVersion(expected,version);
}
export function assertReviewedReleaseSource(file,source){
 assert.equal(normalizeReviewedCurrentSource(file,source),readReviewedReleaseBaseline(file),file+' release225 plus explicit approved later changes');
}
