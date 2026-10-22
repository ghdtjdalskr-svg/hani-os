import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runInNewContext} from 'node:vm';
import {main,presentationCode} from './hani-dash-217-fixture.mjs';
import {approvedReportFiles} from './hani-newsroom-4cut-preservation.mjs';
import {withoutSimplify225} from './hani-simplify-225-preservation.mjs';
const present=new Function('n',presentationCode+'\nreturn dataHubLifeCardPresentation;')(v=>Number(v)||0);
const metric=(key,previous,current)=>({key,row:{value:current,status:'CONFIRMED',unit:'KRW'},comparison:{},monthComparison:{baseline:previous===null?null:{value:previous,status:'CONFIRMED'},delta_absolute:previous===null?null:current-previous,delta_percent:previous?(current-previous)/previous*100:null}});
test('all six cards render unsigned percent magnitude and retain arrows and direction colors',()=>{
 for(const key of ['hasdaq','ne100','hinaJones','harukei','jispi','hinkei'])for(const [current,arrow,tone]of [[112.3,'▲','up'],[87.7,'▼','down'],[100,'↔','flat']]){
  const p=present(metric(key,100,current));assert.equal(p.change,`전월 대비 ${arrow} ${current===100?'0':'12.3'}%`);
  assert.equal(p.tone,['ne100','jispi'].includes(key)&&tone!=='flat'?(tone==='up'?'down':'up'):tone);
 }
});
test('zero, missing and nonfinite ratios never display a change; market badges stay available',()=>{
 for(const key of ['hasdaq','ne100','hinaJones','harukei','jispi','hinkei']){
  for(const previous of [0,null])for(const current of [0,1,100])assert.equal(present(metric(key,previous,current)).change,'');
  for(const percent of [null,undefined,NaN,Infinity,-Infinity]){const m=metric(key,100,120);m.monthComparison.delta_percent=percent;assert.equal(present(m).change,'');}
  assert.equal(present(metric(key,0,100)).market,['ne100','jispi'].includes(key)?'📉 하락장':'📈 상승장');
 }
});
const catalog=s=>JSON.parse(s.match(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/)[1]);
test('all report Markdown files round-trip unchanged and the actual renderer selects newest first',()=>{
 const c=catalog(main),dir=new URL('../docs/gemini-reports/',import.meta.url),files=fs.readdirSync(dir).filter(f=>f.endsWith('.md')&&!f.startsWith('_')).sort();
 assert.deepEqual(c.reports.map(r=>r.file),files);
 for(const [i,r]of c.reports.entries()){assert.equal(r.body,fs.readFileSync(new URL(r.file,dir),'utf8').replace(/\r\n/g,'\n'));assert.equal(r.previous_report_id,i?c.reports[i-1].id:null);assert.doesNotMatch(r.release_version,/开发|개발노트|—/);}
 const ctx={module:{exports:{}}};runInNewContext(main.split('/* HANI_GEMINI_REPORTS_BUNDLE_START */')[1].split('/* HANI_GEMINI_REPORTS_BUNDLE_END */')[0],ctx);
 const selected=ctx.module.exports.selectReports(ctx.module.exports.validateCatalog(c));
 assert.deepEqual(Array.from(selected,r=>r.file),files.slice().reverse());
 const recent=selected.filter(r=>r.date>='2026-10-11').map(r=>r.file);
 assert.deepEqual(recent.filter(f=>approvedReportFiles.includes(f)).sort(),[...approvedReportFiles].sort(),'only named approved report additions');
 assert.equal(recent.filter(f=>!approvedReportFiles.includes(f)).length,6,'original six reports remain');
 assert.equal(c.reports.find(r=>r.id.includes('october-monthly')).release_version,'v2.9.149~v2.9.217');
});
test('historical identities, renderers, protected owners, versions and unrelated bytes are preserved',t=>{
 const baseline=new URL('../artifacts/fix-218/dash/baseline/',import.meta.url);
 if(!fs.existsSync(new URL('hani-main.js',baseline)))return t.skip('local pre-task raw baseline required');
 const previous=fs.readFileSync(new URL('hani-main.js',baseline),'utf8'),old=catalog(previous),current=catalog(main);
 // Rebuilding intentionally synchronizes stale embedded bodies with repository Markdown.
 // Original Markdown remains untouched; the preceding test checks every body exactly.
 for(const r of old.reports){const next=current.reports.find(x=>x.id===r.id);assert.ok(next);for(const field of ['id','file','date','review_status'])assert.equal(next[field],r[field]);}
 const mask=s=>s.replace(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\([^\r\n]+\);/,'<catalog>').replace(/function dataHubLifeCardPresentation\([\s\S]*?(?=function dataHubRenderDashboard\()/,'<presentation>');
 assert.equal(mask(withoutSimplify225('hani-main.js',main)),mask(previous),'runtime outside catalog/presentation byte exact');
 const oldHtml=fs.readFileSync(new URL('index.html',baseline),'utf8'),html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const cssMask=s=>s.replace(/\.gemini-report-table-wrap\{[^\r\n]*/,'<table CSS>');
 assert.equal(cssMask(withoutSimplify225('index.html',html)),cssMask(oldHtml),'HTML except scoped table CSS byte exact');
});
