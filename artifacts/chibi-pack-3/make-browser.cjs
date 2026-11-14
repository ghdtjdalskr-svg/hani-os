const fs=require('node:fs'),assert=require('node:assert/strict');
let s=fs.readFileSync('scripts/hani-chibi-pack-2.browser.mjs','utf8');
s=s.replaceAll('chibi-pack-2','chibi-pack-3').replaceAll('hani-chibi2-edge-','hani-chibi3-edge-');
s=s.replace("  await protocol.send('Page.enable');await protocol.send('Runtime.enable');","  await protocol.send('Page.enable');await protocol.send('Runtime.enable');\n  await protocol.send('Emulation.setTimezoneOverride',{timezoneId:'Asia/Seoul'});");
const a=s.indexOf('  // Fixed synthetic clock;'),b=s.indexOf("  // Actual CSS behavior",a);assert.ok(a>0&&b>a);
s=s.slice(0,a)+`  // Clock and write audit are confined to an isolated profile, before app bootstrap.
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"(()=>{window.__chibiClock=Date.parse('2026-11-21T12:00:00+09:00');const R=Date;class D extends R{constructor(...a){a.length?super(...a):super(window.__chibiClock)}static now(){return window.__chibiClock}}window.Date=D})();"});
  await protocol.send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__chibiWrites=[];for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__chibiWrites.push(name);return original.apply(this,args)}}"});
  await protocol.send('Page.navigate',{url:origin});
  let ready=false;for(let i=0;i<150;i++){ready=await protocol.evaluate("typeof renderHomeBirthday==='function'&&!!window.HaniOrganizationRoster&&typeof state==='object'");if(ready)break;await delay(100);}assert.ok(ready,'app and canonical roster ready');
  const setup=()=>{
    document.getElementById('loginGate').style.display='none';
    const app=document.getElementById('app');app.classList.remove('login-locked');app.inert=false;
    state.diaries=[];state.movies=[];state.monthlyReports=[];
    state.ui.diarySearch='';state.ui.diarySort='newest';state.ui.movieSearch='';state.ui.movieTypeFilter='all';state.ui.movieMinRating=0;
    monthlyReportMonth='2026-10';monthlyReportBoard='monthly';monthlyReportGeneration=null;monthlyReportGenerationFailure=null;
  };
  const cases=[
    {name:'home-birthday-1121',view:'home',fn:'renderHome',id:'homeBirthdayChibiNote',text:'🎂 오늘은 다온 님 생일이에요! · 하니 · 다 같이 축하해요.',clock:'2026-11-21T12:00:00+09:00'},
    {name:'home-nonbirthday-1122',view:'home',fn:'renderHome',id:'homeBirthdayChibiNote',visible:false,clock:'2026-11-22T12:00:00+09:00'},
    {name:'diary-empty',view:'diary',fn:'renderDiary',id:'diaryChibiNote',text:'윤슬 · 오늘 한 줄부터 남겨 볼까요?'},
    {name:'movie-empty',view:'movie',fn:'renderMovies',id:'movieChibiNote',text:'하루 · 첫 작품 기록을 기다리고 있어요!'},
    {name:'monthly-empty',view:'monthlyReport',fn:'renderMonthlyReport',id:'monthlyReportChibiNote',text:'지은 · 이번 달 보고가 생기면 여기 모아 둘게요.'},
  ];
  fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,390]){
    await protocol.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    for(const row of cases){
      await protocol.evaluate('('+setup.toString()+')()');
      await protocol.evaluate('window.__chibiClock=Date.parse('+JSON.stringify(row.clock||'2026-11-21T12:00:00+09:00')+')');
      await protocol.evaluate('showView('+JSON.stringify(row.view)+');'+row.fn+'()');
      await delay(200);
      const result=await protocol.evaluate('('+function(id,fnExpression){
        const fn=(0,eval)(fnExpression),slot=document.getElementById(id),before=JSON.stringify(state),writes=window.__chibiWrites.length;
        for(let i=0;i<5;i++)fn();
        const note=document.getElementById(id),visible=!note.hidden&&getComputedStyle(note).display!=='none';
        (visible?note:document.getElementById('homeActions')).scrollIntoView({block:'center',behavior:'instant'});
        const rect=note.getBoundingClientRect(),style=getComputedStyle(note.firstElementChild);
        return {width:innerWidth,count:document.querySelectorAll('#'+id).length,sameNode:slot===note,visible,stateUnchanged:before===JSON.stringify(state),writes:window.__chibiWrites.length-writes,text:note.lastElementChild.textContent,artWidth:style.width,artHeight:style.height,sheet:style.backgroundImage,withinViewport:!visible||(rect.left>=0&&rect.right<=innerWidth+1),faces:[...note.querySelectorAll('.hani-birthday-person')].filter(x=>!x.hidden).map(x=>({id:x.dataset.person,image:getComputedStyle(x).backgroundImage})),titleSpans:id!=='monthlyReportChibiNote'||document.querySelectorAll('#monthlyReportPending .monthly-report-empty-title>span').length===2};
      }.toString()+')('+JSON.stringify(row.id)+','+JSON.stringify(row.fn)+')');
      result.name=row.name;
      assert.equal(result.count,1,JSON.stringify(result));assert.ok(result.sameNode);assert.equal(result.visible,row.visible!==false);assert.ok(result.stateUnchanged);assert.equal(result.writes,0);assert.ok(result.withinViewport);assert.ok(result.titleSpans);
      if(row.visible!==false){assert.equal(result.text,row.text);assert.equal(result.artWidth,width===390?'56px':'72px');assert.equal(result.artHeight,result.artWidth);assert.match(result.sheet,/chibi-sheet-v3\\.webp/);}
      if(row.name==='home-birthday-1121'){assert.equal(result.faces.length,1);assert.equal(result.faces[0].id,'daon');assert.match(result.faces[0].image,/daon-v2-256.webp/);}
      const screenshot=await protocol.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      fs.writeFileSync(path.join(out,row.name+'-'+width+'.png'),Buffer.from(screenshot.data,'base64'));results.push(result);
    }
    // Empty search results with existing records must not produce first-entry decoration.
    for(const [view,fn,id,prepare]of [
      ['diary','renderDiary','diaryChibiNote',"state.diaries=[{id:'synthetic-diary',title:'합성 일기',content:'기존 기록',date:'2026-11-20'}];state.ui.diarySearch='없는 검색'"],
      ['movie','renderMovies','movieChibiNote',"state.movies=[{id:'synthetic-movie',title:'합성 작품',status:'wish',contentType:'영화'}];state.ui.movieSearch='없는 검색'"]
    ]){
      await protocol.evaluate(prepare+';'+fn+'()');assert.equal(await protocol.evaluate('document.getElementById('+JSON.stringify(id)+').hidden'),true);
    }
  }
`+s.slice(b);
s=s.replaceAll('travelScheduleChibiNote','monthlyReportChibiNote');
fs.writeFileSync('scripts/hani-chibi-pack-3.browser.mjs',s);
