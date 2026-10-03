import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const button=html.match(/<button[^>]*id="cloudVerifySourceOwner"[^>]*>[\s\S]*?<\/button>/)?.[0];
const result=html.match(/<p[^>]*id="cloudOwnerVerificationResult"[^>]*>[\s\S]*?<\/p>/)?.[0];
assert.ok(button&&result);
const server=http.createServer((req,res)=>{
  if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(fs.readFileSync(path.join(root,'hani-design-system.css')));return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(`<html lang="ko"><head><link rel="stylesheet" href="/style.css"><style>body{margin:20px;background:#f6f3ee;color:#283244;font:16px/1.7 system-ui}main{max-width:720px;margin:auto}.card{padding:24px}button{white-space:normal;max-width:100%}p{overflow-wrap:anywhere}</style></head><body><main><h1>검증 전용 후보 · UI fixture</h1><p>실제 로그인·운영 데이터가 아닌 버튼/결과 표시 검사입니다.</p><div class="card"><h3>Cloud 읽기 전용 확인</h3>${button}${result}</div></main></body></html>`);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.argv[3],headless:true});
const output=path.join(root,'qa-evidence');fs.mkdirSync(output,{recursive:true});
try{
  for(const width of [1440,390]){
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    assert.equal(await page.locator('#cloudVerifySourceOwner').isDisabled(),true);
    assert.equal(await page.locator('#cloudOwnerVerificationResult').getAttribute('aria-live'),'polite');
    assert.ok(await page.locator('#cloudVerifySourceOwner').isVisible());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
    await page.screenshot({path:path.join(output,`owner-verification-ui-${width}.png`),fullPage:true});
    await page.close();
  }
  console.log('PASS: 1440/390 UI fixture; disabled before login, live result, no horizontal overflow, storage empty. NOT full-app/Production QA.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
