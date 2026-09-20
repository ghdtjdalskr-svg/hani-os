const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const sandbox={window:{},document:{getElementById(){return null;}},console,Date,structuredClone};
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

const pending={mode:'draft',target:'book',data:{status:'wish',title:'잘못 읽은 OCR 제목',author:'OCR 저자',topic:'교양',rating:null,completedDate:'',review:'기존 메모'},entities:{readingDate:''},missing:[]};
let result=api.patchBookDraft(pending,`책 제목 AGI, 천사인가 악마인가
지은이 : 김대식
평점 : 4.2
한줄평 : AI에 대한 두려움과 경외심.
바벨론의 탑이 생각나는 내용이었다.
오늘 다 읽었어`);
assert.equal(result.changed,true);assert.equal(pending.data.title,'AGI, 천사인가 악마인가');assert.equal(pending.data.author,'김대식');assert.equal(pending.data.rating,4.2);assert.equal(pending.data.review,'AI에 대한 두려움과 경외심. 바벨론의 탑이 생각나는 내용이었다.');assert.equal(pending.data.status,'read');assert.match(pending.data.completedDate,/^20\d{2}-\d{2}-\d{2}$/);assert.equal(pending.entities.readingDate,'');

const inline=structuredClone(pending);api.patchBookDraft(inline,'책 제목 새 제목 지은이 새 저자');assert.equal(inline.data.title,'새 제목');assert.equal(inline.data.author,'새 저자');
const authorOnly=structuredClone(pending),authorBefore=structuredClone(authorOnly.data);api.patchBookDraft(authorOnly,'저자: 다른 저자');assert.equal(authorOnly.data.author,'다른 저자');assert.deepEqual({...authorOnly.data,author:authorBefore.author},authorBefore);
const completion={mode:'draft',target:'book',data:{status:'wish',title:'읽는 책',author:'저자',topic:'교양',rating:null,completedDate:'',review:'읽기 시작'},entities:{readingDate:''},missing:['readingDate']};api.patchBookDraft(completion,'오늘 다 읽었어');assert.equal(completion.data.status,'read');assert.match(completion.data.completedDate,/^20\d{2}-\d{2}-\d{2}$/);assert.equal(completion.entities.readingDate,'');assert.equal(completion.missing.length,0);
const badOcr=structuredClone(pending);badOcr.data.title='OCR 오인식';badOcr.data.author='OCR 저자';badOcr.data.rating=null;api.patchBookDraft(badOcr,'도서명: 정확한 제목\n작가: 정확한 저자\n내 평점: 3.9');assert.equal(badOcr.data.title,'정확한 제목');assert.equal(badOcr.data.author,'정확한 저자');assert.equal(badOcr.data.rating,3.9);
const unsafeTitle=structuredClone(pending),unsafeBefore=structuredClone(unsafeTitle.data);result=api.patchBookDraft(unsafeTitle,'제목: 새 제목 저자: 섞인 값 평점: 4.1');assert.deepEqual(unsafeTitle.data,unsafeBefore);assert.deepEqual(Array.from(result.invalid),['title']);
const ocrOnly=api.visionDraft({confidence:.94,target_hint:'book',extracted_text:'OCR 책 제목을 오늘 다 읽었어. 외부 평점 4.8점',structured_json:JSON.stringify([{target:'book',data:{title:'OCR 책 제목',rating:4.8}}]),warnings:[]},'', 'book');assert.equal(ocrOnly.data.rating,null);
const userRated=api.visionDraft({confidence:.94,target_hint:'book',extracted_text:'OCR 책 제목을 오늘 다 읽었어. 외부 평점 4.8점',structured_json:JSON.stringify([{target:'book',data:{title:'OCR 책 제목',rating:4.8}}]),warnings:[]},'내 평점: 4.2', 'book');assert.equal(userRated.data.rating,4.2);
assert.equal(api.getDraftKey(),'hani_yuna_helpdesk_draft_v1');
console.log('PASS: YUNA text/Vision, Book structured Preview correction 7/7, Place field patch, media regression, finance routing, isolated draft key');
