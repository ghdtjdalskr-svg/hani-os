const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
let writes=0;
class FixedDate extends Date {constructor(...args){super(...(args.length?args:[2026,9,6,12]));}}
const synthetic={tasks:[{id:'existing',text:'preserve',due:'2026-10-10'}]},before=JSON.stringify(synthetic);
const sandbox={window:{},document:{getElementById(){return null}},Date:FixedDate,console,structuredClone,state:synthetic,localStorage:{setItem(){writes++},removeItem(){writes++},clear(){writes++}},intakeApplyRow(){writes++}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../hani-yuna-helpdesk.js'),'utf8'),sandbox);
const parse=sandbox.window.HANI_YUNA_HELPDESK.parse;
const original='12월 12일 토요일부터 12월 13일 일요일까지야\n할일은 "찐막채 송년회"로 일정 올려줘';
for(const input of [original,'12월 12일부터 13일까지 찐막채 송년회 일정 등록해줘','12월 12일~12월 13일 찐막채 송년회 일정 등록해줘','12월 12일-12월 13일 찐막채 송년회 일정 등록해줘','2026-12-12 ~ 2026-12-13 찐막채 송년회 일정 등록해줘','2026년 12월 12일부터 2026년 12월 13일까지 찐막채 송년회 일정 등록해줘']){
 const d=parse(input);assert.equal(d.mode,'schedule-preview',input);assert.equal(d.target,'schedule');assert.equal(d.data.title,'찐막채 송년회',input);assert.equal(d.data.startDate,'2026-12-12');assert.equal(d.data.endDate,'2026-12-13');assert.equal(d.data.allDay,true);assert.equal(d.warnings.length,0);
}
assert.equal(parse(original,'task').target,'schedule');
const single=parse('12월 12일 찐막채 송년회 일정 등록해줘');assert.equal(single.data.startDate,single.data.endDate);assert.equal(single.data.title,'찐막채 송년회');
for(const input of ['12월 13일까지 보고서 제출','내일까지 HDMI 젠더 챙기기','12월 12일까지 송년회 준비물 사기'])assert.equal(parse(input).target,'task',input);
for(const input of ['2월 30일 회의 일정 등록해줘','12월 13일부터 12일까지 회의 일정 등록해줘','12월 31일부터 1월 1일까지 회의 일정 등록해줘','12월 12일부터 회의 일정 등록해줘'])assert.ok(parse(input).warnings.length,input);
const timed=parse('12월 12일 오후 3시 회의 일정 등록해줘');assert.equal(timed.data.allDay,null);assert.ok(timed.warnings.length);
const nextYear=parse('2026-12-31 ~ 2027-01-01 새해 모임 일정 등록해줘');assert.equal(nextYear.data.endDate,'2027-01-01');assert.equal(nextYear.warnings.length,0);
for(const [input,target] of [['오늘 정의란 무엇인가 읽기 시작했어','book'],['오늘 셜록 시즌1 2화까지 봤어. 4.5점','movie'],['하남에 "루프트리"란 카페 다녀왔어','travelWish'],['오늘은 기분이 좋아 기록해줘','diary']])assert.equal(parse(input).target,target);
assert.equal(parse('ISA에 20만원 추가했어').mode,'route');
assert.equal(parse('12월 12일 투자 회의 일정 등록해줘').mode,'route','specialist routing remains first');
assert.equal(writes,0);assert.equal(JSON.stringify(synthetic),before);
console.log('PASS schedule title/range/single-day/deadline/domain regressions, invalid/ambiguous/time warnings; parser writes 0, synthetic state preserved.');
