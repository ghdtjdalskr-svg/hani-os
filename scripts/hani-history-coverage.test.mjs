// Node-only release guard. Uses the same index title version reader as One-Pass.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {versionSnapshot} from './hani-one-pass-rules.mjs';

export function assertHistoryCoverage(html,catalog){
  const version=versionSnapshot(html).title;
  if(!version)throw new Error('index.html에서 표시 버전을 읽을 수 없습니다. <title>의 버전을 확인해 주세요.');
  if(!catalog?.entries?.some(entry=>entry.id==='v'+version&&entry.status==='released')){
    throw new Error(`표시 버전 v${version}의 배포 기록이 없습니다. 릴리스 커밋에서 assets/data/hani-history-releases-v1.json에 해당 버전의 released 항목을 작성해 주세요.`);
  }
  return version;
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  try{
    const root=new URL('../',import.meta.url),flag=process.argv.indexOf('--index');
    const html=fs.readFileSync(flag<0?new URL('index.html',root):process.argv[flag+1],'utf8');
    const catalog=JSON.parse(fs.readFileSync(new URL('assets/data/hani-history-releases-v1.json',root),'utf8'));
    console.log(`PASS 연혁 배포 기록: v${assertHistoryCoverage(html,catalog)}`);
  }catch(error){console.error(error.message);process.exitCode=1;}
}
