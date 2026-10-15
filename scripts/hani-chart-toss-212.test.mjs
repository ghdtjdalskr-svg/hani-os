// Canonical renderer tests. Synthetic fixtures only; no account, network or storage writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),require=createRequire(import.meta.url),M=require('../hani-market-data.js');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const series=(n=30)=>Array.from({length:n},(_,i)=>{const closePrice=Math.round(24000+i*35+Math.sin(i)*300);return {timestamp:new Date(Date.UTC(2026,8,(n>30?31-n:1)+i)).toISOString(),openPrice:closePrice+(i%2?100:-100),highPrice:closePrice+220,lowPrice:closePrice-220,closePrice,volume:15000+i*120,currency:'KRW'};});
export function runUnitTests(){
  const source=read('hani-asset-market-view.js'),begin=source.indexOf('  function chartNumber('),end=source.indexOf('  function plot(',begin);
  const api=vm.runInNewContext('(function(){let period="3M",chartStyle="candle",plotSequence=0;'+source.slice(begin,end)+';return {chartModel,chartLayout,chartGap,chartPointText,detailPlot};})()',{M,Intl,Date,root:{clientWidth:500,querySelector:()=>({clientWidth:400})},escape:s=>String(s)});
  for(const n of [2,4,5,19,20,59,60,119,120,150]){
    const data=series(n),before=JSON.stringify(data),model=api.chartModel(data,null);
    assert.deepEqual(Array.from(model.averages,a=>a.n),[5,20,60,120].filter(p=>n>=p));
    for(const a of model.averages){assert.equal(a.points.length,n-a.n+1);for(const p of a.points){const expected=data.slice(p.i-a.n+1,p.i+1).reduce((s,c)=>s+c.closePrice,0)/a.n;assert.ok(Math.abs(p.v-expected)<1e-8);}}
    assert.equal(JSON.stringify(data),before);
  }
  const data=[{timestamp:'2026-09-01',openPrice:100,highPrice:125,lowPrice:80,closePrice:110,currency:'KRW',volume:12},{timestamp:'2026-09-30',openPrice:110,highPrice:120,lowPrice:90,closePrice:100,currency:'KRW',volume:null}],model=api.chartModel(data,100);
  assert.equal(model.high.value,125);assert.equal(model.high.i,0);assert.ok(Math.abs(model.high.percent+20)<1e-10);assert.equal(model.low.value,80);assert.equal(model.low.percent,25);assert.equal(model.high.date,'2026-09-01');
  for(const price of [null,1,100,10000]){const svg=api.detailPlot(data,100,'360750',price,'2026-10-15'),match=svg.match(/class="market-current-line" d="M[\d.]+,([\d.]+) H/);assert.ok(match);assert.ok(Number(match[1])>=40&&Number(match[1])<=260);assert.equal(api.chartModel(data,price).min,80);assert.equal(api.chartModel(data,price).max,125);}
  // Fit only visible OHLC, including neither missing bodies nor historical MA / quote / cost outliers.
  const history=series(180).map((c,i)=>i<120?{...c,openPrice:100000,highPrice:110000,lowPrice:90000,closePrice:100000}:c),snapshot=JSON.stringify(history);
  for(const width of [260,412,884,1100])for(const n of [2,20,60,120,180]){
    const input=history.slice(-n),l=api.chartLayout(input,1000000,width,1),visible=input.slice(l.start),lo=Math.min(...visible.map(c=>c.lowPrice)),hi=Math.max(...visible.map(c=>c.highPrice));
    assert.equal(l.model.min,lo);assert.equal(l.model.max,hi);assert.equal(l.low,lo-l.model.span*.06);assert.equal(l.high,hi+l.model.span*.06);
    assert.ok(l.bar>=3&&l.bar<=18);assert.equal(l.bar,Math.max(3,Math.min(18,l.step*.68)));assert.ok(l.bar<=l.step*.72);
    if(l.bar>3&&l.bar<18)assert.ok(l.bar/l.step>=.65&&l.bar/l.step<=.72);
    assert.ok(Math.abs((l.vb-l.vt)/((l.bottom-l.top)+(l.vb-l.vt))-.18)<.01);
    assert.ok(l.y(hi)-l.top<(l.bottom-l.top)*.06);assert.ok(l.bottom-l.y(lo)<(l.bottom-l.top)*.06);
  }
  assert.equal(api.chartLayout(series(20),null,1100).bar,18,'few candles are wide');
  const cropped=api.chartLayout(history,1000000,260,1);assert.ok(cropped.start>120);assert.ok(cropped.model.averages.at(-1).points.at(-1).v>cropped.high,'historical MA out of range stays clipped');
  assert.equal(JSON.stringify(history),snapshot);assert.match(source,/selected='',period='3M'/);
  const narrow=data.map(c=>({...c,openPrice:100000,closePrice:100000,lowPrice:99999.99,highPrice:100000.01})),flat=data.map(c=>({...c,openPrice:100,closePrice:100,lowPrice:100,highPrice:100}));assert.equal(api.chartModel(narrow,null).span,100000.01-99999.99);assert.ok(Number.isFinite(api.chartLayout(flat,null,400).y(100)),'flat series remains finite');
  const base=api.detailPlot(data,100,'360750',100),bounds=svg=>svg.match(/data-low="([^"]+)" data-high="([^"]+)"/).slice(1);
  for(const [buy,quote,arrow,y] of [[10000,10000,'↑',40],[1,1,'↓',260]]){
    const svg=api.detailPlot(data,buy,'360750',quote);assert.deepEqual(bounds(svg),bounds(base));assert.match(svg,new RegExp('class="market-current-tag" data-edge="'+arrow+'"'));assert.match(svg,new RegExp('class="market-buy-edge" data-edge="'+arrow+'"'));assert.match(svg,new RegExp('내 평균 '+arrow+' '));assert.doesNotMatch(svg,/class="market-average"/);assert.equal(Number(svg.match(/class="market-current-line" d="M[\d.]+,([\d.]+) H/)[1]),y);
  }
  assert.match(base,/class="market-current-tag" data-edge=""/);assert.doesNotMatch(base,/class="market-buy-edge"/);
  const doji=[{...data[0],openPrice:110},data[1]],body=svg=>[...svg.matchAll(/<g class="market-candle [\s\S]*?<rect [^>]*height="([^"]+)"/g)].map(m=>Number(m[1]));
  assert.equal(body(api.detailPlot(doji,null,'360750'))[0],1);const fitted=api.chartLayout(data,null,400);assert.ok(Math.abs(body(api.detailPlot(data,null,'360750'))[0]-Math.abs(fitted.y(100)-fitted.y(110)))<1e-9,'real open-close body follows fitted Y');
  const withMissing=[...data,{timestamp:'2026-10-01',closePrice:100000,currency:'KRW'}];assert.equal(api.chartModel(withMissing,null).max,125,'excluded missing OHLC cannot stretch valid candles');
  // Execute the canonical inspection handlers against cropped geometry, without a browser mock renderer.
  const l=api.chartLayout(history,1000000,260,1),attrs={},circle={setAttribute:(k,v)=>attrs[k]=v},crosshair={setAttribute:(k,v)=>attrs[k]=v,querySelector:()=>circle},tooltip={style:{}},slider={},readout={};
  const svg={dataset:{left:l.left,right:l.right,start:l.start,top:l.top,bottom:l.bottom,low:l.low,high:l.high},viewBox:{baseVal:{width:260}},querySelector:()=>crosshair,getBoundingClientRect:()=>({left:10,width:520})};
  const inspectionSource=source.slice(source.indexOf('  function inspectPoint('),source.indexOf('  function hideInspection('));
  const inspection=vm.runInNewContext('(function(){'+inspectionSource+';return {inspectPoint,inspectPointer};})()',{lastPlot:{points:history,current:1000000},chartModel:api.chartModel,chartPointText:api.chartPointText,root:{querySelector:s=>s==='svg[data-market-detail]'?svg:s==='.market-chart-tooltip'?tooltip:s==='[data-chart-index]'?slider:readout}});
  for(const index of [0,l.start,history.length-1]){inspection.inspectPoint(index);const actual=Math.max(l.start,index);assert.equal(Number(slider.value),actual);assert.equal(Number(attrs.transform.match(/[\d.]+/)[0]),l.x(actual));assert.equal(Number(attrs.cy),l.y(history[actual].closePrice));assert.ok(readout.textContent.startsWith(history[actual].timestamp.slice(0,10)));assert.equal(tooltip.hidden,false);}
  for(const index of [l.start,history.length-1]){inspection.inspectPointer({target:{closest:()=>svg},clientX:10+l.x(index)*2});assert.equal(Number(slider.value),index);}
  const html=api.detailPlot(data,100,'360750',100,'2026-10-15');assert.match(html,/최고 125원/);assert.match(html,/-20.00%/);assert.match(html,/최저 80원/);assert.match(html,/10[/]1 이후 일봉 데이터가 아직 없습니다/);
  assert.match(html,/class="market-average"/);assert.doesNotMatch(api.detailPlot(data,10000,'360750'),/class="market-average"/);
  assert.equal(api.chartGap(data,'2026-09-30'),'');assert.equal(api.chartGap(data,null),'');
  const sparse=data.map(({openPrice,highPrice,lowPrice,...c})=>c);assert.match(api.detailPlot(sparse,null,'360750'),/최고 종가/);assert.match(api.detailPlot(sparse,null,'360750'),/OHLC 미제공 2개 봉 제외/);
  const all=series(150),m=api.chartModel(all,25700),text=api.chartPointText(all.at(-1),149,m.averages);for(const value of ['시가','고가','저가','종가','거래량','MA5','MA20','MA60','MA120'])assert.ok(text.includes(value));assert.doesNotMatch(api.chartPointText(all[0],0,m.averages),/MA5/);
  new vm.Script(source);assert.doesNotMatch(source.slice(begin,end),/localStorage|sessionStorage|setItem|removeItem|\.clear\(/);
  console.log('PASS chart-toss-212: visible OHLC +/-6%, overlays excluded, body 68%/3-18px at 20 widths/counts, doji/open-close, edge tags up/down, full-history MAs, marks/gap/tooltip, syntax/read-only');
}
export async function runScreenshots({chromium,browserPath,outputDir=path.join(root,'artifacts/chart-toss-212'),existingBrowser}){
  fs.mkdirSync(outputDir,{recursive:true});const browser=existingBrowser||await chromium.launch({headless:true,executablePath:browserPath});const results=[];
  const index=read('index.html'),start=index.indexOf('<section class="card full" id="assetMarket"'),section=index.slice(start,index.indexOf('</section>',start)+10);
  try{for(const width of [412,884,1440])for(const finish of ['porcelain-cream','midnight-black']){
    const context=await browser.newContext({viewport:{width,height:1100},hasTouch:true,isMobile:width<1000,deviceScaleFactor:1,timezoneId:'Asia/Seoul',reducedMotion:'reduce'});await context.route('**/*',r=>r.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setContent('<!doctype html><html lang="ko" data-finish="'+finish+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="hani-market-cache" content="hani-market-cache"><body data-view="asset"><div id="app"><main style="max-width:1200px;margin:auto;padding:12px;min-width:0"><p style="font-size:12px">개발 검증 · 합성 데이터 · 실제 시세 아님</p>'+section+'</main></div></body></html>');
    await page.locator('.market-main').evaluate(el=>{const note=document.createElement('p');note.className='market-note';note.textContent='합성 데이터 · 화면 검증용 · 실제 시세 아님';el.prepend(note);});
    await page.addStyleTag({content:read('hani-design-system.css')+'\n'+read('hani-asset-market.css')+'\nbody{margin:0;background:var(--surface-page);color:var(--text-primary);font:14px system-ui}*{box-sizing:border-box}.card{padding:12px}button,select,input{font:inherit}#marketPosition{overflow-wrap:anywhere}#app{display:block}'});
    const fixture={accounts:[{id:'a',name:'테스트 계좌'}],instruments:[{id:'s',name:'TIGER 미국S&P500',ticker:'360750',market:'KR'}],investmentBrokerSnapshots:[{mode:'actual',status:'confirmed',period:'2026-09',accounts:[{accountId:'a',enabled:true,holdings:[{id:'h',instrumentId:'s',ticker:'360750',name:'TIGER 미국S&P500',quantity:10,purchaseAmount:245000,currency:'KRW'}]}]}]};
    await page.addScriptTag({content:'var state='+JSON.stringify(fixture)+';var cloudUser={id:"fixture"};window.chartFixture='+JSON.stringify(series(30))+';window.longFixture='+JSON.stringify(series(150))+';window.chartWrites=0;for(const method of ["setItem","removeItem","clear"])Storage.prototype[method]=function(){window.chartWrites++;throw Error("Unexpected storage write")};var cloudClient={auth:{getSession:async()=>({data:{session:{access_token:"fixture",user:cloudUser}}})},storage:{from:()=>({download:async p=>({data:new Blob([JSON.stringify(p.endsWith("latest.json")?{version:1,collectedAt:"2026-10-15T01:00:00Z",stocks:[{symbol:"360750",name:"TIGER 미국S&P500",market:"KOSPI",currency:"KRW"}],quotes:[{symbol:"360750",lastPrice:25700,timestamp:"2026-10-15T01:00:00Z",currency:"KRW"}],charts:Object.fromEntries(["1D","1W","1M","3M","6M","1Y"].map((p,i)=>["360750/"+p,"charts/"+String(i+1).repeat(64)+".json"]))}:{symbol:"360750",period:({1:"1D",2:"1W",3:"1M",4:"3M",5:"6M",6:"1Y"})[p.split("/").pop()[0]],complete:true,adjusted:false,result:p.includes("/"+"6".repeat(64))?window.longFixture:window.chartFixture})])})})}};'});
    await page.addScriptTag({content:read('hani-market-data.js')});await page.addScriptTag({content:read('hani-asset-market-view.js')});
    await page.locator('.market-candle').first().waitFor();assert.equal(await page.locator('.market-candle').count(),30);assert.match(await page.locator('.market-chart-gap').innerText(),/10[/]1 이후/);
    assert.equal(await page.locator('[data-market-period="3M"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.market-current-tag').getAttribute('data-edge'),'↑');
    const geometry=await page.locator('svg[data-market-detail]').evaluate(svg=>{const bodies=[...svg.querySelectorAll('.market-candle rect')],step=(+svg.dataset.right-svg.dataset.left)/bodies.length;return {width:+bodies[0].getAttribute('width'),step,wick:getComputedStyle(svg.querySelector('.market-candle path')).strokeWidth};});assert.ok(geometry.width>=3&&geometry.width<=18);assert.ok(Math.abs(geometry.width-Math.min(18,geometry.step*.68))<1e-8);assert.equal(geometry.wick,'1px');
    assert.equal(await page.locator('.market-ma-legend span').count(),2);assert.equal(await page.locator('.market-average').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'page overflow '+width);
    assert.equal(await page.locator('.market-chart').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'chart overflow');
    assert.equal(await page.locator('svg[data-market-detail]').evaluate(svg=>{const vb=svg.viewBox.baseVal;return [...svg.querySelectorAll('text')].every(t=>{const b=t.getBBox();return b.x>=-.5&&b.x+b.width<=vb.width+.5;});}),true,'text inside chart');
    const lowContrast=await page.locator('.market-main').evaluate(main=>{const rgb=c=>c.match(/[\d.]+/g).slice(0,3).map(Number),lum=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),bg=lum(getComputedStyle(main).backgroundColor);return [...main.querySelectorAll('#marketPrice,#marketAsOf,#marketChartMeta,.market-chart-gap,.market-chart-readout,.market-note,.market-ma-legend span,svg text')].filter(el=>{const fg=lum(getComputedStyle(el)[el instanceof SVGElement?'fill':'color']);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)<4.5;}).map(el=>el.textContent);});assert.equal(lowContrast.length,0,'AA chart text '+finish+': '+lowContrast.join(', '));
    const svg=page.locator('svg[data-market-detail]');await svg.scrollIntoViewIfNeeded();await svg.hover({position:{x:100,y:100}});const box=await svg.boundingBox();
    await page.locator('.market-chart-tooltip').waitFor({state:'visible'});assert.match(await page.locator('.market-chart-tooltip').innerText(),/시가.*고가.*저가.*종가.*거래량/);
    await page.mouse.move(0,0);await page.touchscreen.tap(box.x+box.width*.65,box.y+box.height*.5);await page.locator('.market-chart-tooltip').waitFor({state:'visible'});assert.equal(await page.locator('.market-crosshair').getAttribute('visibility'),'visible');
    const touchText=await page.locator('.market-chart-tooltip').innerText(),cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+20,y:box.y+100}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.7,y:box.y+100}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.notEqual(await page.locator('.market-chart-tooltip').innerText(),touchText);await cdp.detach();
    // Screenshot hides inspection to show annotations. Touch evidence is captured separately.
    await page.locator('.market-main').screenshot({path:path.join(outputDir,finish+'-'+width+'-touch.png')});await svg.dispatchEvent('pointercancel',{pointerType:'touch'});
    await page.locator('.market-main').screenshot({path:path.join(outputDir,finish+'-'+width+'.png')});
    await page.locator('[data-chart-style="line"]').click();assert.equal(await page.locator('.market-candle').count(),0);assert.equal(await page.locator('#marketChart .market-price-line').count(),1);await page.locator('[data-chart-style="candle"]').click();
    const slider=page.locator('[data-chart-index]');await slider.fill('29');await slider.dispatchEvent('input');assert.match(await page.locator('.market-chart-tooltip').innerText(),/MA5.*MA20/);await page.keyboard.press('Escape');
    await page.locator('[data-market-period="1Y"]').click();await page.waitForFunction(()=>document.querySelector('[data-chart-index]')?.max==='149');assert.equal(await page.locator('.market-ma-legend span').count(),4);await page.locator('[data-chart-index]').fill('149');await page.locator('[data-chart-index]').dispatchEvent('input');assert.match(await page.locator('.market-chart-tooltip').innerText(),/MA60.*MA120/);
    const long=await svg.evaluate(svg=>({start:+svg.dataset.start,count:svg.querySelectorAll('.market-candle').length,width:+svg.querySelector('.market-candle rect').getAttribute('width')}));assert.equal(long.count,150-long.start);assert.ok(long.width>=3&&long.width<=18);if(width===412)assert.ok(long.start>0,'mobile uses latest window');
    for(const index of [long.start,149]){await slider.fill(String(index));await slider.dispatchEvent('input');assert.match(await page.locator('.market-chart-tooltip').innerText(),new RegExp(series(150)[index].timestamp.slice(0,10)));const position=await svg.evaluate(svg=>{const index=+document.querySelector('[data-chart-index]').value,local=index-svg.dataset.start,rect=svg.querySelectorAll('.market-candle rect')[local],cross=svg.querySelector('.market-crosshair');return {x:+cross.getAttribute('transform').match(/[\d.]+/)[0],expected:+rect.getAttribute('x')+ +rect.getAttribute('width')/2,y:+cross.querySelector('circle').getAttribute('cy'),bodyY:+rect.getAttribute('y'),bodyH:+rect.getAttribute('height')};});assert.ok(Math.abs(position.x-position.expected)<1e-7);assert.ok(position.y>=position.bodyY-1&&position.y<=position.bodyY+position.bodyH+1);}
    assert.equal(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.length===new Set(ids).size;}),true,'unique DOM ids');
    assert.equal(await page.evaluate(()=>window.chartWrites),0);assert.equal(await page.evaluate(()=>JSON.stringify(state)),JSON.stringify(fixture));assert.deepEqual(errors,[]);results.push({width,finish,overflow:false,touch:true,writes:0});await context.close();
  }}finally{if(!existingBrowser)await browser.close();}
  fs.writeFileSync(path.join(outputDir,'screenshots-results.json'),JSON.stringify(results,null,2));console.log('PASS Playwright chart 6 layouts, actual hover/tap, touch drag, line/candle, periods, slider, no overflow/state mutation/storage writes');return results;
}
runUnitTests();
if(typeof process!=='undefined'&&process.argv[2]&&process.argv[3]){const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);await runScreenshots({chromium,browserPath:process.argv[3]});}
