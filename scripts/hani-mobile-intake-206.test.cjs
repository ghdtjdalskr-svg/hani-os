const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),baseline=process.argv.includes('--baseline');
const read=file=>baseline?fs.readFileSync(path.join(root,'artifacts/mobile-intake-206/baseline',file),'utf8'):fs.readFileSync(path.join(root,file),'utf8');
const source=read('hani-main.js');
const functions=['intakeText','intakeNormText','intakeDate','intakeNumber','intakeRating','intakeKv','intakePick','intakeFirstContentLine','intakeDayOffset','intakeDateFromWeekday','intakeNaturalRating','intakeNaturalReview','intakeNaturalAuthor','intakeNaturalDate','intakeNaturalMovie','intakeReadingToday','intakeNaturalBook','intakeBuildOne'];
class KstBoundaryDate extends Date{constructor(...args){super(...(args.length?args:['2026-10-11T16:49:00Z']))}}
let writes=0;
const ctx={Date:KstBoundaryDate,Intl,structuredClone,console,window:{},document:{getElementById(){return null}},today:()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new KstBoundaryDate()),normalizeDateFlexDate:x=>x,uid:()=> 'test-id',intakeApplyRow(){writes++},agentApi(){throw Error('Local text must never call Cloud/AI')}};
vm.createContext(ctx);
for(const name of functions){const start=source.indexOf(`function ${name}(`);if(start<0){assert.ok(baseline&&name==='intakeReadingToday',name);continue}const rest=source.slice(start),next=rest.search(/\r?\nfunction /);vm.runInContext(next<0?rest:rest.slice(0,next),ctx)}
vm.runInContext(read('hani-yuna-helpdesk.js'),ctx);
const api=ctx.window.HANI_YUNA_HELPDESK,cases=[
 ['김대식의 인간 vs 기계 책을 봤어','인간 vs 기계','김대식','read',null],
 ['인간 vs 기계 다 읽었어','인간 vs 기계','','read',null],
 ['『사피엔스』 읽는 중','사피엔스','','wish',null],
 ['트렌드 코리아 2027 읽었어 별점 4','트렌드 코리아 2027','','read',4],
 ["책 '불편한 편의점' 봤어",'불편한 편의점','','read',null],
 ['김대식의 인간 vs 기계 책을 읽었어','인간 vs 기계','김대식','read',null],
 ['김대식의 인간 vs 기계 책을 다 읽었어','인간 vs 기계','김대식','read',null],
 ['인간 vs 기계 읽고 있어','인간 vs 기계','','wish',null],
];
let failures=0;
for(const [text,title,author,status,rating] of cases){
 try{
  const natural=ctx.intakeNaturalBook(text);assert.ok(natural);assert.equal(natural.title,title);assert.equal(natural.author,author);assert.equal(natural.status,status);assert.equal(natural.rating,rating);
  const draft=api.parse(text,'book');assert.equal(draft.mode,'draft');assert.equal(draft.target,'book');assert.equal(draft.data.title,title);assert.equal(draft.data.author,author);assert.equal(draft.data.status,status);assert.equal(draft.data.rating,rating);assert.equal(draft.missing.length,0);
  assert.equal(status==='read'?draft.data.completedDate:draft.entities.readingDate,'2026-10-12','KST day crosses UTC midnight');
  const data=api.saveData(draft);assert.equal(data.title,title);assert.equal(status==='read'?data.completedDate:data.review.includes('읽기 시작일: 2026-10-12'),status==='read'?'2026-10-12':true);
  const intake=ctx.intakeBuildOne('book',{},text);assert.equal(intake.title,title);assert.equal(intake.author,author);assert.equal(intake.status,status);assert.equal(intake.rating,rating);if(status==='read')assert.equal(intake.completedDate,'2026-10-12');else assert.match(intake.review,/읽기 시작일: 2026-10-12/);
  api.patchBookDraft(draft,'제목은 새도서\n저자는 김작가\n평점은 4.5');assert.equal(draft.data.title,'새도서');assert.equal(draft.data.author,'김작가');assert.equal(draft.data.rating,4.5);
 }catch(e){if(!baseline)throw e;failures++;console.log('BASELINE FAIL:',text,'—',e.message.split('\n')[0])}
}
const movie=api.parse('케이팝 데몬 헌터스 봤어','movie');assert.equal(movie.target,'movie');assert.equal(movie.data.title,'케이팝 데몬 헌터스');assert.equal(movie.data.status,'watched');assert.deepEqual(Array.from(movie.missing),['watchedDate']);api.hydrateMissing(movie,'오늘');assert.equal(movie.missing.length,0);assert.equal(ctx.intakeNaturalMovie('케이팝 데몬 헌터스 봤어').title,'케이팝 데몬 헌터스');
assert.equal(writes,0,'parse/edit/preview never persists reading records');
console.log(baseline?`BASELINE: ${failures}/${cases.length} requested book paths fail; movie chip unchanged`:`PASS: ${cases.length} books, actual main/YUNA/intake functions, KST boundary, editable drafts, no preapproval writes, movie chip`);
