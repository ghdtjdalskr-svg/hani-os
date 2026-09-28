// Loopback-only, short-lived READ-ONLY preview. Never serves auth or writes asset data.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {randomBytes,createHash}=require('node:crypto');
const {chromium}=require('playwright');
const M=require('../hani-market-data.js');
const root=path.resolve(__dirname,'..'),owner='e1c08077-6c94-4652-b017-3760f42aa1ad';
const base='https://qmgikfdwjzmhkwadycxk.supabase.co',key='sb_publishable_Z0YkkRSJIo5hs00YNcMOdQ__PA5BAj5';
let server,browser;
(async()=>{
  let raw='';for await(const part of process.stdin){raw+=part;if(Buffer.byteLength(raw)>32768)throw Error('limit');}let {session}=JSON.parse(raw);raw='';
  if(session.userId!==owner||session.expires_at*1000<Date.now()+60000)throw Error('session');
  async function read(resource,max){const r=await fetch(base+resource,{headers:{apikey:key,Authorization:'Bearer '+session.access_token},redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('read');const body=await r.text();if(Buffer.byteLength(body)>max)throw Error('limit');return body;}
  const user=JSON.parse(await read('/auth/v1/user',65536));if(user.id!==owner||user.is_anonymous!==false)throw Error('owner');
  const projection='accounts:state->accounts,instruments:state->instruments,investmentBrokerSnapshots:state->investmentBrokerSnapshots';
  const records=JSON.parse(await read('/rest/v1/hani_state?user_id=eq.'+owner+'&select='+encodeURIComponent(projection)+'&limit=1',1048576));if(records.length!==1)throw Error('state');
  const source=records[0],positions=M.positions(source),accounts=(source.accounts||[]).map(a=>({id:a.id,name:a.name}));
  const state={accounts,instruments:(source.instruments||[]).map(i=>({id:i.id,name:i.name,ticker:i.ticker})),investmentBrokerSnapshots:[]};
  // Keep actual latest account holding dates and values; do not invent missing quantities.
  for(const a of accounts){const rows=positions.filter(p=>p.accountId===a.id);if(!rows.length)continue;state.investmentBrokerSnapshots.push({mode:'actual',status:'confirmed',period:rows[0].holdingAsOf,asOfDate:rows[0].holdingAsOf,accounts:[{accountId:a.id,enabled:true,holdings:rows.map(p=>({id:p.key,instrumentId:p.instrumentId,name:p.name,ticker:p.ticker,quantity:p.quantity,buyPrice:p.buyPrice,purchaseAmount:p.purchaseAmount,currency:p.recordedCurrency,evaluationAmount:p.recordedEvaluation,pnl:p.recordedPnl}))}]});}
  const prefix='/storage/v1/object/authenticated/hani-market-cache/'+owner+'/',files={};
  const latest=JSON.parse(await read(prefix+'latest.json?preview='+Date.now(),65536));files['preview/latest.json']=latest;
  const catalog=JSON.parse(await read(prefix+'catalog/index.json?preview='+Date.now(),262144));files['preview/catalog/index.json']=catalog;
  const refs=new Set([...Object.values(latest.charts||{}),...Object.values(catalog.markets||{}).flatMap(m=>m.refs)]);
  for(const ref of refs){if(!/^(charts|catalog)\/[a-f0-9]{64}\.json$/.test(ref))throw Error('path');const body=await read(prefix+ref,262144);if(createHash('sha256').update(body).digest('hex')!==ref.split('/')[1].slice(0,-5))throw Error('digest');files['preview/'+ref]=JSON.parse(body);}
  session=null;
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=index.indexOf('<section class="card full" id="assetMarket"');if(start<0)throw Error('markup');
  const market=index.slice(start,index.indexOf('</section>',start)+10),lookupStart=index.indexOf('<div class="field span2 instrument-lookup"');
  const lookup=index.slice(lookupStart,index.indexOf('<div class="field span2"><label>종목명',lookupStart));
  const local=Object.fromEntries(['hani-market-data.js','hani-asset-market-view.js','hani-asset-market.css'].map(f=>[f,fs.readFileSync(path.join(root,f))]));
  local['boot.js']=`const state=${JSON.stringify(state).replace(/</g,'\\u003c')};const files=${JSON.stringify(files).replace(/</g,'\\u003c')};const cloudClient={auth:{getSession:async()=>({data:{session:{access_token:'preview-only',user:{id:'preview'}}}})},storage:{from:()=>({download:async p=>files[p]?{data:new Blob([JSON.stringify(files[p])])}:{error:{message:'unavailable'}}})}};window.previewStateBefore=JSON.stringify(state);`;
  const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="hani-market-cache" content="hani-market-cache"><meta name="hani-market-catalog" content="enabled"><title>HANI 실제 보유정보 · 읽기 전용 미리보기</title><link rel="stylesheet" href="hani-asset-market.css"><style>body{font:15px system-ui;color:#243753;background:#f5f7fb;margin:0;padding:24px;--panel:#fff;--line:#dfe4ed;--muted:#667085}main{max-width:1150px;margin:auto}.card{padding:24px;border-radius:18px;margin:20px 0}button,input,select{font:inherit;padding:9px;border:1px solid #dfe4ed;border-radius:9px;background:white}.notice{padding:16px;background:#fff1cf;border-radius:12px}.preview-form{display:grid;gap:10px}@media(max-width:600px){body{padding:10px}.card{padding:12px}}</style><body data-view="asset"><main><div class="notice">읽기 전용 미리보기 · HANI에 저장된 실제 보유수량 + 마지막 수집 시세<br>현재 보유 잔고를 증권사에서 직접 조회한 화면은 아닙니다. 이 화면은 실행 시점에 고정되며 저장·삭제할 수 없습니다. PC에서 30분간 열립니다.</div>${market}<section class="card preview-form">${lookup}<input id="instrumentEditId" type="hidden"><label>종목명 <input id="instrumentName"></label><label>코드 <input id="instrumentTicker"></label><label>시장 <select id="instrumentMarket"><option value="KR">한국</option><option value="US">미국</option></select></label><label>분류 <select id="instrumentClass"><option>ETF</option><option>주식</option><option>기타</option></select></label><button id="addInstrument" disabled>저장 불가 · 읽기 전용 미리보기</button></section></main><script src="boot.js"></script><script src="hani-market-data.js"></script><script src="hani-asset-market-view.js"></script></body></html>`;
  const secretPath='/'+randomBytes(24).toString('hex')+'/';let origin;
  server=http.createServer((req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");if(req.method!=='GET'||req.headers.host!==new URL(origin).host||(req.headers.origin&&req.headers.origin!==origin)||!req.url.startsWith(secretPath)){res.writeHead(403);return res.end();}const name=req.url.slice(secretPath.length);if(name===''){res.setHeader('Content-Type','text/html;charset=utf-8');return res.end(html);}if(!Object.hasOwn(local,name)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',name.endsWith('.css')?'text/css':'text/javascript');res.end(local[name]);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;const previewUrl=origin+secretPath;
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.name));await page.goto(previewUrl);
  await page.locator('#marketStatus').filter({hasText:'PC 마지막 수집'}).waitFor();await page.locator('#marketChart svg').waitFor();
  const expected=positions.filter(p=>p.quantity!==null&&p.quantity>=0&&latest.quotes.some(q=>q.symbol===M.resolve(p,source.instruments||[],latest.stocks).symbol));
  if(!(await page.locator('#marketCoverage').innerText()).includes(expected.length+'/'+positions.length))throw Error('coverage');
  if(await page.evaluate(()=>JSON.stringify(state)!==window.previewStateBefore||localStorage.length!==0)||errors.length)throw Error('state');
  await browser.close();browser=null;process.stdout.write(JSON.stringify({success:true,stage:'readonly-preview',previewUrl,symbols:positions.length})+'\n');
  setTimeout(()=>{server.close();process.exit(0);},1800000);
})().catch(async()=>{if(browser)await browser.close();if(server)server.close();process.stdout.write('{"success":false,"stage":"readonly-preview"}\n');process.exitCode=1;});
