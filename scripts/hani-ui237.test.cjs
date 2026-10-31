const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {functionCode}=require('./qa-1st-test-support.cjs');
const fixture=require('./fixtures/ui237-readability.json'),root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');

test('ui237 exact authorized deltas reverse to pinned Git source; edits, missing/duplicate/moved hunks and EOL drift fail',async()=>{
  const {normalizeReviewedCurrentSource,readReleaseSource}=await import('./hani-reviewed-release-baseline.mjs');
  assert.equal(fixture.baseSha,'1fd11d9d6f47e01625943a6f06c64d80abfb26b3');
  assert.deepEqual(fixture.changes.map(c=>c.file),['hani-design-system.css','hani-development-history.css','hani-main.js','hani-organization-hub.css']);
  for(const c of fixture.changes){
    const before=readReleaseSource(fixture.baseSha,c.file),after=read(c.file);
    assert.equal(hash(before),c.beforeHash);assert.equal(hash(after),c.afterHash);
    let forward=before;
    for(const r of c.replacements){assert.equal(forward.split(r.before).length-1,1);forward=forward.replace(r.before,()=>r.after);}
    assert.equal(forward,after);
    const verify=s=>assert.equal(normalizeReviewedCurrentSource(c.file,s),before);
    verify(after);assert.throws(()=>verify('/* unapproved */\n'+after));
    for(const r of c.replacements){
      for(const bad of ['',r.after+r.after,r.after+'/* extra */',r.after.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')]){
        assert.notEqual(bad,r.after);assert.throws(()=>verify(after.replace(r.after,()=>bad)));
      }
      assert.throws(()=>verify(r.after+after.replace(r.after,'')));
    }
  }
});

test('protected owners, writes, events, timers, version tags and unchanged EOL bytes remain identical to base',async()=>{
  const {readReleaseSource}=await import('./hani-reviewed-release-baseline.mjs');
  const before=readReleaseSource(fixture.baseSha,'hani-main.js'),after=read('hani-main.js');
  for(const name of ['save','commit','freshState','normalizeState','applySignatureFinish','renderExercise','renderAssets','accountCardHtml'])assert.equal(functionCode(name,after),functionCode(name,before),name);
  const calls=s=>s.match(/(?:localStorage|sessionStorage)\.[a-zA-Z]+\([^\r\n]*|\b(?:setTimeout|setInterval)\s*\(|\.addEventListener\s*\(/g);
  assert.deepEqual(calls(after),calls(before));
  for(const f of ['index.html','hani-office-live.js','hani-office-live.css'])assert.equal(read(f),readReleaseSource(fixture.baseSha,f),f);
  const versions=s=>s.match(/(?:\?v=|HANI_DISPLAY_VERSION\s*=\s*["'])[^"'<>\s]+/g);
  assert.deepEqual(versions(after),versions(before));
  // The immutable replacement fixture includes exact context and EOL bytes. Reversing it
  // to the Git bytes proves every byte outside the named spans was preserved.
});

const rgb=hex=>{const h=hex.slice(1);return (h.length===3?h.split('').map(c=>c+c).join(''):h).match(/../g).map(c=>parseInt(c,16));};
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('authored pale-surface inks, account series and dark chart/status palettes meet 4.5:1 numerically',()=>{
  const css=read('hani-design-system.css'),boundary=css.slice(css.indexOf('/* Fixed pale surfaces'),css.indexOf('/* Readability: pale domain artwork'));
  const ink=rgb(boundary.match(/--text-primary:(#[a-f0-9]+)/)[1]),muted=rgb(boundary.match(/--text-secondary:(#[a-f0-9]+)/)[1]);
  const surfaces=['#fff','#fafbff','#eef9f6','#fff5e9','#fff1f6','#f7f4ff','#eef6ff','#f0fbf8','#f4f1ff','#fff8ef','#f8f9fc'];
  const scores=[];for(const bg of surfaces)for(const color of [ink,muted]){const r=ratio(color,rgb(bg));scores.push(r);assert.ok(r>=4.5,`${bg} ${r}`);}
  const palette=read('hani-main.js').match(/const SERIES_COLORS=.*\r?\nconst EXTRA_SERIES_COLORS=.*$/m)[0].match(/#[a-f0-9]{6}/g);
  for(const color of palette)for(const bg of ['#fff','#fafbff']){const mixed=rgb(color).map((v,i)=>v*.45+ink[i]*.55),r=ratio(mixed,rgb(bg));assert.ok(r>=4.5,`${color} account ${r}`);}
  for(const finish of ['midnight-black','titanium-graphite']){
    const block=css.match(new RegExp(':root\\[data-finish="'+finish+'"\\][^{]*\\{([^}]+)'))[1];
    const token=name=>rgb(block.match(new RegExp('--'+name+':(#[a-f0-9]+)'))[1]);
    for(const bg of ['surface-panel','surface-raised'])for(const fg of ['text-primary','text-secondary'])assert.ok(ratio(token(fg),token(bg))>=4.5);
  }
  assert.ok(ratio(rgb('#e0e5f5'),rgb('#1d2242'))>=4.5);
  console.log('Numeric palette minimum '+Math.min(...scores).toFixed(2)+':1; actual CSS cascade/pixels require Edge.');
});

test('actual applySignatureFinish → showView(exercise) → drawExercise draws empty/populated canvas after activation without new timer or write',()=>{
  const main=read('hani-main.js');
  for(const finish of ['porcelain-cream','midnight-black','titanium-graphite'])for(const records of [[],[{date:'2026-10-31',steps:1234}]]){
    const drawn=[],views=new Map(),frames=[],canvas={offsetParent:null,width:0,height:0,getBoundingClientRect:()=>({width:300,height:260})};
    const ctx={setTransform(){},clearRect(){},fillText(text){drawn.push({text,color:this.fillStyle});},beginPath(){},moveTo(){},lineTo(){},stroke(){},setLineDash(){},arc(){},fill(){},fillRect(){},measureText:s=>({width:s.length*10})};canvas.getContext=()=>ctx;
    const element=id=>({id,dataset:{},classList:{remove(c){if(id==='exercise'&&c==='active')canvas.offsetParent=null;},add(c){if(id==='exercise'&&c==='active')canvas.offsetParent={};},toggle(){}}});
    for(const id of ['home','exercise','app','title'])views.set(id,element(id));views.set('exerciseChart',canvas);
    const document={documentElement:{dataset:{}},body:{dataset:{},setAttribute(){}},querySelector:()=>null,querySelectorAll:s=>s==='.view'?[views.get('home'),views.get('exercise')]:[]};
    const context=vm.createContext({document,window:{devicePixelRatio:1},console,history:{replaceState(){}},location:{href:'http://fixture/',hash:''},$:id=>views.get(id)||null,
      NAVIGATION_VIEWS:new Set(['exercise']),navigationTimer:0,navigationCurrent:'',navigationBooted:false,loginGateUnlocked:false,cloudUser:null,cloudRecoveryMode:false,
      state:{exercise:records,ui:{}},pageMeta:{exercise:['운동','','health']},organizationRoute:()=>null,settingsRoute:()=>null,setBanner(){},syncSeasonCollection(){},clearTimeout(){},setTimeout:()=>frames.push('unexpected timer'),
      exercisePeriodRows:rows=>rows,n:Number,
      getComputedStyle:node=>{assert.equal(node,canvas,'canvas owns the actual Finish palette');const dark=document.documentElement.dataset.finish!=='porcelain-cream';return {getPropertyValue:key=>({'--line':dark?'#292c33':'#dedcd6','--muted':dark?'#b9bac0':'#62646b','--text':dark?'#f5f2ed':'#292a2d'}[key])};}
    });
    context.window.scrollTo=()=>{};
    for(const name of ['updateFinishScope','applySignatureFinish','canvasSetup','drawLines','drawExercise','showView'])vm.runInContext(functionCode(name,main),context);
    context.applySignatureFinish(finish);context.showView('exercise');
    assert.equal(document.documentElement.dataset.finish,finish);assert.ok(drawn.length);assert.equal(frames.length,0);
    assert.ok(drawn.some(d=>d.text===(records.length?'걸음 수':'선택한 기간에 걸음 수 기록이 없습니다.')));
    assert.equal(drawn.at(-1).color,records.length?(finish==='porcelain-cream'?'#292a2d':'#f5f2ed'):(finish==='porcelain-cream'?'#62646b':'#b9bac0'));
  }
});
