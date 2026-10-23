import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
export const root=new URL('../',import.meta.url);
export function readAt(file,ref=null){
 if(!ref)return fs.readFileSync(new URL(file,root),'utf8');
 const exported=new URL('artifacts/office-behavior/lively-baseline/'+ref+'/'+file,root);
 if(fs.existsSync(exported))return fs.readFileSync(exported,'utf8');
 return execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
}
export function loadScene({ref=null,catalog=221,transform=s=>s}={}){
 const json=file=>JSON.parse(readAt(file,ref));
 const table=json('assets/data/office-actions-'+catalog+'.json');
 const assets={canon:json('data/hani-building/spatial-contract.json'),art:json('data/hani-building/art-map-v1.json'),sprites:json('assets/sprites-v2/manifest.json')};
 if(!ref||ref!=='ad3c2f3')try{assets.places=json('data/hani-building/office-places.json')}catch{}
 const context=vm.createContext({HaniOfficeActions221:catalog===221?table:null,HaniOfficeActions216:catalog===216?table:null,HaniOfficeV2Assets:assets,document:{getElementById:()=>null},window:{}});
 vm.runInContext(transform(readAt('hani-office-live.js',ref)),context);
 return {scene:context.HaniBuildingScene,table,context};
}
export const at=(day,seconds)=>new Date(Date.parse(day+'T00:00:00+09:00')+seconds*1000);
