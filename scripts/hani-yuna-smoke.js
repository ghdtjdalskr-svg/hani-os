const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
let bookWrites=0;
const sandbox={window:{},document:{getElementById(){return null;}},console,Date,structuredClone,intakeApplyRow(){bookWrites+=1;}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../hani-yuna-helpdesk.js'),'utf8'),sandbox);
const api=sandbox.window.HANI_YUNA_HELPDESK;
const movie=api.parse('셜록 시즌1 2화까지 봤어. 4.5점');
assert.equal(movie.data.title,'셜록');assert.equal(movie.data.rating,4.5);
assert.deepEqual(Array.from(movie.missing),['watchedDate']);
api.hydrateMissing(movie,'오늘로');assert.equal(movie.missing.length,0);
assert.equal(api.saveData(movie).review,'시즌 1 · 2화까지');
const book=api.parse('정의란 무엇인가 읽기 시작했어');
assert.equal(book.data.title,'정의란 무엇인가');assert.deepEqual(Array.from(book.missing),['readingDate']);
api.hydrateMissing(book,'오늘');const savedBook=api.saveData(book);
assert.equal(savedBook.completedDate,'');assert.match(savedBook.review,/읽기 시작일: 20\d{2}-\d{2}-\d{2}/);
const task=api.parse('내일 오전까지 NHN 견적서 보내기');
assert.equal(task.data.text,'NHN 견적서 보내기');assert.equal(task.missing.length,0);
assert.equal(api.saveData(task).text,'NHN 견적서 보내기 · 오전까지');
for(const hint of ['auto','book','diary','task'])assert.equal(api.parse('ISA에 20만원 추가했어',hint).mode,'route');
assert.equal(api.parse('ISA에 20만원 추가했어').route,'investmentIntake');
assert.equal(api.parse('벤치프레스 3세트 기록').mode,'route');
const explicit=api.parse('오늘 셜록 시즌1 2화까지 봤어. 4.5점');assert.equal(explicit.missing.length,0);
const vision=api.visionDraft({confidence:.94,target_hint:'movie',structured_json:JSON.stringify([{target:'movie',data:{title:'셜록',season:1,episode:2,rating:4.5}}]),warnings:['시청일 미확인']});
assert.equal(vision.data.title,'셜록');assert.equal(vision.data.review,'시즌 1 · 2화까지');assert.equal(vision.data.rating,4.5);assert.deepEqual(Array.from(vision.missing),['watchedDate']);
assert.equal(api.visionDraft({confidence:.42,target_hint:'movie',structured_json:JSON.stringify([{target:'movie',data:{title:'셜록',season:1,episode:2,rating:4.5}}])}),null);
assert.equal(api.visionDraft({confidence:.9,financial_detected:true,extracted_text:'ISA에 20만원 추가'},'', 'auto').route,'investmentIntake');
const place=api.parse('하남에 "루프트리"란 카페 분위기 너무 좋던데?');
assert.equal(place.target,'travelWish');assert.equal(place.data.destination,'루프트리');assert.equal(place.entities.location,'하남');assert.equal(place.entities.type,'카페');assert.match(place.data.note,/분위기/);
for(const answer of ['장소는 루프트리야','장소 이름은 루프트리야','장소이름이 루프트리야','가게 이름은 루프트리야','카페 이름은 루프트리야','이름은 루프트리']){const d=api.parse('와 여기 맛있다 ㅋㅋ 맛집 등록해줘');assert.deepEqual(Array.from(d.missing),['destination']);const before={reason:d.data.reason,note:d.data.note};api.hydrateMissing(d,answer);assert.equal(d.data.destination,'루프트리');assert.deepEqual({reason:d.data.reason,note:d.data.note},before)}
const patched=api.parse('하남에 루프트리란 카페 분위기 너무 좋던데?'),original=structuredClone(patched);
api.patchPlaceDraft(patched,'지역은 성남');assert.equal(patched.entities.location,'성남');assert.equal(patched.data.destination,original.data.destination);assert.equal(patched.entities.type,original.entities.type);
api.patchPlaceDraft(patched,'유형은 맛집');assert.equal(patched.entities.type,'맛집');assert.equal(patched.entities.location,'성남');
api.patchPlaceDraft(patched,'메모는 분위기 좋아');assert.equal(patched.data.reason,'분위기 좋아');assert.equal(patched.data.destination,'루프트리');
api.patchPlaceDraft(patched,'평점은 4.5점');assert.equal(patched.data.rating,4.5);assert.equal(patched.data.reason,'분위기 좋아');
api.patchPlaceDraft(patched,'방문일은 9월 8일');assert.match(patched.data.expectedDate,/^20\d{2}-09-08$/);assert.equal(patched.data.rating,4.5);
api.patchPlaceDraft(patched,'장소는 새루프트리야');assert.equal(patched.data.destination,'새루프트리');assert.equal(patched.entities.location,'성남');

const bookPreview=()=>({mode:'draft',target:'book',data:{status:'wish',title:'OCR 오염 문자열',author:'',topic:'교양',rating:null,completedDate:'',review:'',location:'성민의 서재'},entities:{readingDate:''},missing:[]});
const today=()=>{const d=new Date(),pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};

// A. 여러 줄 명시 수정은 기존 Preview에 대한 구조화 partial patch다.
const bookA=bookPreview();api.patchBookDraft(bookA,`책 제목 AGI, 천사인가 악마인가
지은이 김대식
평점 4.2
한줄평 AI에 대한 두려움과 경외심. 바벨론의 탑이 생각나는 내용이었다.
오늘 다 읽은 걸로 해줘`);
assert.equal(bookA.data.title,'AGI, 천사인가 악마인가');assert.equal(bookA.data.author,'김대식');assert.equal(bookA.data.rating,4.2);assert.equal(bookA.data.review,'AI에 대한 두려움과 경외심. 바벨론의 탑이 생각나는 내용이었다.');assert.equal(bookA.data.status,'read');assert.equal(bookA.data.completedDate,today());

// B-D. 단일 필드 수정은 해당 필드만 바꾼다.
const bookB=structuredClone(bookA),beforeB=structuredClone(bookB);api.patchBookDraft(bookB,'평점만 4.5로 바꿔줘');assert.equal(bookB.data.rating,4.5);assert.deepEqual({...bookB,data:{...bookB.data,rating:beforeB.data.rating},correctionDiff:beforeB.correctionDiff},beforeB);
const bookC=structuredClone(bookA),beforeC=structuredClone(bookC);api.patchBookDraft(bookC,'저자는 김대식이야');assert.equal(bookC.data.author,'김대식');assert.deepEqual({...bookC,data:{...bookC.data,author:beforeC.data.author},correctionDiff:beforeC.correctionDiff},beforeC);
const bookD=structuredClone(bookA),beforeD=structuredClone(bookD);api.patchBookDraft(bookD,'한줄평은 생각보다 쉽게 읽혔다로 바꿔줘');assert.equal(bookD.data.review,'생각보다 쉽게 읽혔다');assert.deepEqual({...bookD,data:{...bookD.data,review:beforeD.data.review},correctionDiff:beforeD.correctionDiff},beforeD);
const bookMulti=bookPreview();bookMulti.data.title='기존 제목';bookMulti.data.review='기존 한줄평';api.patchBookDraft(bookMulti,'저자는 김대식이고 평점은 4.2야');assert.equal(bookMulti.data.author,'김대식');assert.equal(bookMulti.data.rating,4.2);assert.equal(bookMulti.data.title,'기존 제목');assert.equal(bookMulti.data.review,'기존 한줄평');

// E. 완료 표현은 상태/완독일만 갱신하고 나머지를 보존한다.
const bookE=bookPreview();bookE.data={...bookE.data,author:'기존 저자',rating:3.8,review:'기존 한줄평'};const beforeE=structuredClone(bookE.data);api.patchBookDraft(bookE,'오늘 다 읽었어');assert.equal(bookE.data.status,'read');assert.equal(bookE.data.completedDate,today());assert.deepEqual({title:bookE.data.title,author:bookE.data.author,rating:bookE.data.rating,review:bookE.data.review},{title:beforeE.title,author:beforeE.author,rating:beforeE.rating,review:beforeE.review});
for(const phrase of ['다 읽었어','다 읽음','완독','완독했어','오늘 다 읽었어','오늘 다 읽은 걸로','읽기 완료']){const completed=bookPreview();api.patchBookDraft(completed,phrase);assert.equal(completed.data.status,'read',phrase);assert.equal(completed.data.completedDate,today(),phrase);}

// F-G. 제목 label 제거와 언급하지 않은 location/startDate 보존을 확인한다.
const bookF=structuredClone(bookA);api.patchBookDraft(bookF,'제목은 AGI, 천사인가 악마인가');assert.equal(bookF.data.title,'AGI, 천사인가 악마인가');assert.doesNotMatch(bookF.data.title,/제목은|저자|평점|한줄평/);
const bookInline=bookPreview();api.patchBookDraft(bookInline,'책 제목 AGI, 천사인가 악마인가 지은이 김대식 평점 4.2 한줄평 AI에 대한 두려움과 경외심.');assert.equal(bookInline.data.title,'AGI, 천사인가 악마인가');assert.equal(bookInline.data.author,'김대식');assert.equal(bookInline.data.rating,4.2);assert.equal(bookInline.data.review,'AI에 대한 두려움과 경외심.');
const bookG=structuredClone(bookA);bookG.entities.readingDate='2026-09-01';const locationBefore=bookG.data.location;api.patchBookDraft(bookG,'시작일은 상관없고 오늘 다 읽은 걸로 진행');assert.equal(bookG.data.location,locationBefore);assert.equal(bookG.entities.readingDate,'2026-09-01');assert.equal(bookG.data.status,'read');assert.equal(bookG.data.completedDate,today());

// H. Preview patch 자체는 승인 저장 함수를 호출하지 않는다.
const bookH=bookPreview();api.patchBookDraft(bookH,'평점 4.1');assert.equal(bookWrites,0);
assert.equal(api.getDraftKey(),'hani_yuna_helpdesk_draft_v1');
console.log('PASS: YUNA Book Preview correction A-H, existing text/Vision, Place, media, finance routing, isolated draft key');
