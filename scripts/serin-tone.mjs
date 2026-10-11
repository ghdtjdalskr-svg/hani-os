// Sends board-library threads to 세린 (agy) in small chunks and merges back ONLY text fields after strict structure checks.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const agy=process.env.LOCALAPPDATA+'\\agy\\bin\\agy.exe';
const rules=fs.readFileSync('SERIN-TASK.md','utf8');
const seed=JSON.parse(fs.readFileSync('data/hani-relationship-seed-v1.json','utf8'));
const voices=seed.people.map(p=>({id:p.id,voice:p.voice,commentStyle:p.commentStyle,quirks:p.quirks,callsChairmanOppa:p.callsChairmanOppa}));
const strip=t=>({id:t.id,authorId:t.authorId,category:t.category,title:t.title,body:t.body,comments:t.comments.map((c,i)=>({i,authorId:c.authorId,replyTo:c.replyTo??null,body:c.body}))});
let changed=0,failed=0;
for(const file of (process.env.LIMIT?['data/board-library/part-a.json']:['data/board-library/part-a.json','data/board-library/part-b.json'])){
  const raw=JSON.parse(fs.readFileSync(file,'utf8')),list=Array.isArray(raw)?raw:raw.threads;
  for(let s=0;s<(process.env.LIMIT?6*+process.env.LIMIT:list.length);s+=6){
    const chunk=list.slice(s,s+6);
    const prompt='도구(파일·명령)는 절대 쓰지 말고 텍스트로만 답해.\n댓글을 상대 이름 부르기로 시작하지 말 것\n'+rules+'\n\n직원 성격 요약:\n'+JSON.stringify(voices)+'\n\n아래 JSON 배열의 title/body/comments[].body 문자열만 다듬어서, 같은 구조의 JSON 배열만 출력해 (설명·코드펜스 금지). id/authorId/category/i/replyTo는 그대로 둬.\n'+JSON.stringify(chunk.map(strip));
    const r=spawnSync(agy,['-p',prompt],{encoding:'utf8',maxBuffer:64*1024*1024,timeout:600000,windowsHide:true});
    let out=(r.stdout||'').trim();const a=out.indexOf('['),b=out.lastIndexOf(']');
    try{
      const arr=JSON.parse(out.slice(a,b+1));
      if(arr.length!==chunk.length)throw Error('length');
      arr.forEach((n,k)=>{const o=chunk[k];
        if(n.id!==o.id||n.comments.length!==o.comments.length)throw Error('shape '+o.id);
        n.comments.forEach((c,j)=>{if(c.authorId!==o.comments[j].authorId)throw Error('author '+o.id)});
        const ok=v=>typeof v==='string'&&v.trim()&&!/\[사내 세계관 이야기\]|에 관한 제 생각/.test(v);
        if(ok(n.title))o.title=n.title;if(ok(n.body))o.body=n.body;
        n.comments.forEach((c,j)=>{if(ok(c.body))o.comments[j].body=c.body});
        changed++;
      });
    }catch(e){failed+=chunk.length;console.log('chunk',file,s,'skipped:',e.message,(r.stderr||'').slice(0,200))}
    fs.writeFileSync(file,JSON.stringify(raw,null,2)+'\n');
    console.log(file,s,'done; changed',changed,'failed',failed);
  }
}
console.log('TOTAL changed',changed,'failed',failed);
