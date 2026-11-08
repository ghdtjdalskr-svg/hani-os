// Reproducible scoped patch and exact outer inverse contract, fixed to bbe71c0.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const file='hani-office-live.js',before=fs.readFileSync('artifacts/kids-weekday/baseline/'+file,'utf8'),hash=s=>createHash('sha256').update(s).digest('hex');
assert.equal(hash(before),'3c64d0e91bea897d3ee59a3e406a710934b40c2299abb9d9c0e10cd3d6d1fe1d');
const replacements=[];let after=before;
function replace(name,a,b){assert.equal(after.split(a).length-1,1,name);after=after.replace(a,()=>b);replacements.push({name,before:a,after:b})}
replace('append canonical general lines',
`'이쪽이 조용해. 너도 와.']},`,
`'이쪽이 조용해. 너도 와.','아빠, 물 여기 뒀어. 그냥 보이길래.','…아빠 기다린 건 아니야. 책이 덜 끝나서.','아빠, 난 한 걸음 뒤에 있을게.','수연아, 뛰지 마. 가방은 내가 들게.','하니 이모한테 인사는 하고 가야지.','보리야, 여기 조용히 앉아 있어도 돼.']},`);
replace('append sister general lines',
`'나 먼저 갈게! 아빠 오고 있지?']}`, 
`'나 먼저 갈게! 아빠 오고 있지?','아빠! 오늘 학교에서 별 스티커 받았어!','아빠 보고 싶어서 발이 먼저 왔어!','아빠, 오늘도 내 옆자리 비워 뒀지?','하니 이모! 나 인사하러 왔어!','서윤 언니, 나도 축하 하트 줄게!','보리야! 아빠랑 같이 천천히 가자!']}`);
replace('date-based greetings and three sibling exchanges',
`  const companionReactions=Object.freeze([`,
`  const kidsWeekdayGreetings=Object.freeze({
    'kid-suhyeon':Object.freeze(['…지나가다 들른 거야, 아빠.','아빠, 학교 끝났어. 잠깐만 있다 갈게.','…아빠, 책 읽을 데가 필요해서 온 거야.']),
    'kid-suyeon':Object.freeze(['아빠! 학교 끝나고 왔어!','아빠아! 오늘은 내가 깜짝 선물이야!','아빠! 하교하자마자 보고 싶어서 왔어!'])
  });
  const kidsSiblingLines=Object.freeze([
    Object.freeze(['…아빠 기다리는 동안만 같이 있어 줄게.','오빠, 아빠 보고 싶어서 온 거 다 알아!']),
    Object.freeze(['수연아, 아빠 일할 땐 천천히 걸어.','응! 아빠 손 잡고 살금살금 갈게!']),
    Object.freeze(['…네 가방은 내가 들게. 아빠한텐 비밀이야.','아빠! 오빠가 또 나 챙겨 줬어!'])
  ]);
  const companionReactions=Object.freeze([`);
replace('weekday decision inside canonical companion owner',
`    const follows=person=>person.kid?weekend:!weekend&&person.atlasRow===weekday-1;`,
`    // Calendar-date seed is independent of the resident 07:00 day and refreshes.
    // One weekday visitor replaces the one animal follower; siblings keep weekends.
    const surprise=!weekend&&residentSeed(day+'|kids-weekday')%4===0&&seconds>=15*3600&&seconds<19*3600;
    const visitor=surprise?((residentSeed(day+'|kids-weekday-child')>>>8)%2?'kid-suyeon':'kid-suhyeon'):null;
    const follows=person=>person.kid?weekend||person.id===visitor:!weekend&&!surprise&&person.atlasRow===weekday-1;`);
replace('weekday child visibility',
`      if(person.kid&&!weekend||follow&&(!chair||!center?.every(Number.isFinite)))continue;`,
`      if(person.kid&&!weekend&&person.id!==visitor||follow&&(!chair||!center?.every(Number.isFinite)))continue;`);
replace('arrival metadata after ordinary activity',
`      if(child)companionActivity(child,chair,people,states,day,seconds,reduced,now);`,
`      if(child){
        companionActivity(child,chair,people,states,day,seconds,reduced,now);
        if(surprise)child.weekdayArrival={day,line:kidsWeekdayGreetings[child.id][(residentSeed(day+'|kids-weekday-greeting')>>>8)%3]};
      }`);
replace('memory dedupe in existing renderer',
`  const staffChats=building.scheduler?.createStaffChats();
  function updateResidents(now){`,
`  const staffChats=building.scheduler?.createStaffChats();
  const weekdayGreetings=new Set();
  function updateResidents(now){`);
replace('arrival uses existing bubble before other automatic speech',
`      const line=affection?.line||state.scene?.line||person.lines[0];`,
`      // Consume only a visible, actually shown arrival. Floor changes, other
      // speech and user taps leave it pending; memory alone remembers the day.
      const arrival=state.weekdayArrival;
      if(arrival&&!weekdayGreetings.has(arrival.day)&&sceneVisible()&&!document.hidden&&!meeting&&!activeEvent&&!visit&&!staffChats?.current()&&actorBubble.hidden&&Date.now()-lastBubbleTap>=5000){
        weekdayGreetings.add(arrival.day);
        showBubble(actor,{speaker:person.id,line:arrival.line,resident:true,weekdayArrival:true},3000,true);
      }
      const line=affection?.line||state.scene?.line||person.lines[0];`);
replace('protect greeting from tick line updates',
`&&!bubbleSelection?.staffChat&&(!person.companion||autoBubbleEntry)`,
`&&!bubbleSelection?.staffChat&&!bubbleSelection?.weekdayArrival&&(!person.companion||autoBubbleEntry)`);
replace('sibling exchanges on the existing activity and bubble clock',
`      child.scene={key:child.activity.key,line,patrol:true,notBefore:now.getTime()-rhythm.elapsed*1000+1000};`,
`      child.scene={key:child.activity.key,line,patrol:true,notBefore:now.getTime()-rhythm.elapsed*1000+1000};
      const sibling=states.find(p=>p.kid&&p.id!==child.id),turn=Math.floor(seconds/180),elapsed=seconds%180;
      if(sibling&&sibling.floor===floor&&!chair.walking&&distance(home,sibling.position)<300&&elapsed>=150&&elapsed<174){
        const exchange=kidsSiblingLines[residentSeed(day+'|siblings|'+turn)%kidsSiblingLines.length];
        child.scene={key:day+'|siblings|'+turn+'|'+child.id,line:exchange[sister?1:0],patrol:true,sibling:true,notBefore:now.getTime()+(150+(sister?4:1)-elapsed)*1000};
      }`);
fs.mkdirSync('artifacts/kids-weekday/baseline',{recursive:true});fs.writeFileSync('artifacts/kids-weekday/baseline/'+file,before);
fs.writeFileSync(file,after);
const delta={baseCommit:'bbe71c0ea53d6f65740a4ac0f2ee598d4b2c280f',file,beforeSha256:hash(before),afterSha256:hash(after),replacements};
fs.writeFileSync('scripts/fixtures/office-kids-weekday-delta.json',JSON.stringify(delta,null,2)+'\n');
console.log(JSON.stringify({before:hash(before),after:hash(after),contract:hash(fs.readFileSync('scripts/fixtures/office-kids-weekday-delta.json')),pairs:replacements.length}));
const inverse='scripts/hani-office-kids-weekday-source.cjs';
fs.writeFileSync(inverse,fs.readFileSync(inverse,'utf8').replace(/assert\.equal\(hash\(bytes\),'[a-f0-9]{64}'/,"assert.equal(hash(bytes),'"+hash(fs.readFileSync('scripts/fixtures/office-kids-weekday-delta.json'))+"'"));
