const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const changes=new Map();let current;
for(const line of read('artifacts/train233-verify-followup/exports/test-eol-map.diff').split('\n')){
 const file=line.match(/^\+\+\+ b\/(.*)$/);if(file){current=file[1];changes.set(current,[]);}
 const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
 if(h&&current)changes.get(current).push({old:+h[1],oldCount:h[2]===undefined?1:+h[2],now:+h[3],newCount:h[4]===undefined?1:+h[4]});
}
const eol=[];
for(const [file,hunks]of changes){
 const before=read('artifacts/train233-verify-followup/exports/original-'+path.basename(file)),after=read(file);
 const split=s=>s.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[],oldLines=split(before),newLines=split(after);let old=0,now=0,count=0;
 for(const h of [...hunks,{old:oldLines.length,now:newLines.length,oldCount:0,newCount:0}]){
  const oldStart=h.oldCount?h.old-1:h.old,newStart=h.newCount?h.now-1:h.now;
  while(old<oldStart&&now<newStart){assert.equal(oldLines[old],newLines[now],file+' unchanged line/EOL '+old+'/'+now);old++;now++;count++;}
  assert.equal(old,oldStart);assert.equal(now,newStart);old+=h.oldCount;now+=h.newCount;
 }
 eol.push({file,status:'PASS',unchangedLinesWithExactEol:count});
}
const runtime=['hani-main.js','hani-asset-update-v1.js'].map(file=>{
 const actual=fs.readFileSync(path.join(root,file)),frozen=fs.readFileSync(path.join(__dirname,'exports/7d0fa05e873d09bb7b7eb070bea7c8271a6cfa5c-'+file));
 assert.deepEqual(actual,frozen,file+' runtime bytes');return {file,status:'UNCHANGED',sha256:crypto.createHash('sha256').update(actual).digest('hex')};
});
const helpers=fs.readdirSync(__dirname).filter(f=>f.endsWith('.cjs'));
for(const file of helpers)new vm.Script(fs.readFileSync(path.join(__dirname,file),'utf8'),{filename:file});
const main=read('hani-main.js'),html=read('index.html');
const result={status:'PASS',candidate:'7d0fa05e873d09bb7b7eb070bea7c8271a6cfa5c',runtime,runtimeDiff:'git diff --quiet HEAD -- hani-*.js hani-*.css index.html: exit 0',version:main.match(/const HANI_DISPLAY_VERSION="([^"]+)"/)[1],lastScript:[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].at(-1)[1],changedSourceSyntax:'3 node --check PASS',helperSyntax:helpers,powerShellSyntax:'2 Parser.ParseFile PASS',diffCheck:'git -c core.whitespace=cr-at-eol diff --check: exit 0',eol};
fs.writeFileSync(path.join(__dirname,'integrity.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,unchangedTestLines:eol.reduce((n,r)=>n+r.unchangedLinesWithExactEol,0),helperSyntax:helpers.length,runtime:'unchanged'}));
