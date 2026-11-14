// Record complete, reversible edits against the task-start main296 bytes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),start=require('./local/start.json'),hash=s=>createHash('sha256').update(s).digest('hex');
const delta={schema:1,base:start.base,boundary:'main296 + chibi3 -> main296',files:{}};
function patch(file,edits){let text=fs.readFileSync(path.join(root,file),'utf8');assert.equal(hash(text),start.files[file]);const before=text;
 for(const e of edits){assert.equal(text.split(e.before).length-1,1,'unique edit '+file);text=text.replace(e.before,()=>e.after)}
 delta.files[file]={beforeSha256:hash(before),afterSha256:hash(text),edits};fs.writeFileSync(path.join(root,file),text);
}
const block=`// Chibi pack 3: approved birthdays; identity/ranks follow the organization roster.
const CHIBI_STAFF_BIRTHDAYS=Object.freeze([
  ["seoyun","서윤","개발 리드",3,12],["dohyun","도연","개발 선임",6,18],
  ["serin","세린","연구원",7,23],["yuri","유리","QA 책임",9,11],
  ["arin","아린","UI/UX 선임",4,24],["gaeun","뮤즈 · 가은","회장 비서",9,25],
  ["mir","MIR · 미르","AI 스페셜리스트",5,14],["taeo","채원","솔루션 매니저",2,6],
  ["daon","다온","사원",11,21],["yoonseul","윤슬","사원",3,26],
  ["hani","하니","전무",1,17],["yuna","유나","사원",2,20],
  ["jieun","지은","부장",4,9],["haru","하루","대리",5,29],
  ["naeun","나은","차장",7,8],["hina","히나","과장",8,21],
  ["minji","민지","대리",10,8],["sooyeon","수연","주임",11,6],
  ["sua","수아","과장",12,12],["ieum","이음","사원",6,3]
].map(row=>Object.freeze(row)));
function renderHomeBirthday(date=new Date(),birthdays=CHIBI_STAFF_BIRTHDAYS){
  const day=new Date(date.getTime()+9*3600000),month=day.getUTCMonth()+1,dayOfMonth=day.getUTCDate();
  const people=birthdays.filter(row=>row[3]===month&&row[4]===dayOfMonth);
  const identity=row=>window.HaniOrganizationRoster?.people.find(person=>person.id===row[0])||{name:row[1],rank:row[2]};
  renderChibiNote("homeBirthdayChibiNote",$("homeActions"),"birthday-cake","🎂 오늘은 "+people.map(row=>identity(row).name+" 님").join(", ")+" 생일이에요! · 하니 · 다 같이 축하해요.",people.length>0);
  const slot=$("homeBirthdayChibiNote");if(!slot||!people.length)return;
  let portraits=slot.querySelector(".hani-birthday-portraits");
  if(!portraits){
    portraits=document.createElement("span");portraits.className="hani-birthday-portraits";portraits.setAttribute("aria-hidden","true");
    slot.insertBefore(portraits,slot.lastElementChild);
    for(const row of CHIBI_STAFF_BIRTHDAYS){
      const face=document.createElement("span"),person=identity(row);
      face.className="hani-birthday-person";face.dataset.person=row[0];face.title=person.name+" · "+person.rank;
      const image=sidebarAgentImages[row[0]]||({
        gaeun:"./assets/profiles/thumb/hani-profile-gaeun-256.webp",
        mir:"./assets/profiles/thumb/hani-profile-mir-256.webp",
        taeo:"./assets/profiles/thumb/hani-profile-taeo-256.webp"
      })[row[0]];
      if(image)face.style.backgroundImage='url("'+image+'")';else face.textContent=person.name.slice(0,1);
      portraits.append(face);
    }
  }
  for(const face of portraits.children)face.hidden=!people.some(row=>row[0]===face.dataset.person);
}
`;
patch('hani-main.js',[
 {before:'function renderHome(){\r\n',after:block+'function renderHome(){\r\n  renderHomeBirthday();\n'},
 {before:'function renderDiary(){\r\n',after:'function renderDiary(){\r\n  renderChibiNote("diaryChibiNote",$("diaryList"),"yoonseul-notebook","윤슬 · 오늘 한 줄부터 남겨 볼까요?",!Array.isArray(state.diaries)||state.diaries.length===0);\n'},
 {before:'renderChibiNote("movieChibiNote",$("watchedMovies"),"minji-think","민지 · 회장님, 보고 싶은 작품부터 담아봐요.",state.movies.length===0);',after:'renderChibiNote("movieChibiNote",$("watchedMovies"),"haru-popcorn","하루 · 첫 작품 기록을 기다리고 있어요!",state.movies.length===0);'},
 {before:'renderChibiNote("monthlyReportChibiNote",pending,"hani-point","하니 · 회장님, 보고할 달의 기록을 살펴봐요.",!failure&&!monthlyReportGeneration,true);',after:'renderChibiNote("monthlyReportChibiNote",pending,"jieun-binder","지은 · 이번 달 보고가 생기면 여기 모아 둘게요.",!stored&&!failure&&!monthlyReportGeneration&&monthlyReportBoard==="monthly",true);'}
]);
const css=fs.readFileSync(path.join(root,'hani-street-journal.css'),'utf8');
patch('hani-street-journal.css',[{before:css.slice(-180),after:css.slice(-180)+`
/* Chibi pack 3: existing owner slots, four transparent 512px scenes. */
.hani-chibi-note .hsj-p-birthday-cake,.hani-chibi-note .hsj-p-yoonseul-notebook,.hani-chibi-note .hsj-p-haru-popcorn,.hani-chibi-note .hsj-p-jieun-binder{background-image:url("./assets/street-journal/chibi-sheet-v3.webp");background-size:200% 200%}
.hani-chibi-note .hsj-p-birthday-cake{background-position:0% 0%}
.hani-chibi-note .hsj-p-yoonseul-notebook{background-position:100% 0%}
.hani-chibi-note .hsj-p-haru-popcorn{background-position:0% 100%}
.hani-chibi-note .hsj-p-jieun-binder{background-position:100% 100%}
#homeBirthdayChibiNote{padding:8px 12px;border:1px solid var(--border-strong,var(--ds-line));border-radius:12px;background:var(--surface-raised,var(--ds-paper));flex-wrap:wrap}
.hani-birthday-portraits{display:flex;gap:4px;flex-wrap:wrap;max-width:100%}
.hani-birthday-person{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;border-radius:50%;background:var(--surface-raised,var(--ds-paper)) center/cover no-repeat;color:var(--text);border:1px solid var(--border-strong,var(--ds-line))}
.hani-birthday-person[hidden]{display:none!important}
`}]);
const bytes=JSON.stringify(delta,null,2)+'\n';fs.writeFileSync(path.join(root,'scripts/fixtures/chibi-pack-3-delta.json'),bytes);
fs.writeFileSync(path.join(__dirname,'fixture-pin.txt'),hash(bytes)+'\n');console.log({pin:hash(bytes),files:Object.keys(delta.files)});
