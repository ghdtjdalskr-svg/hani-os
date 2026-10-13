import assert from 'node:assert/strict';
import {api,handlers,roster,plain,inspection} from './hani-board.test.mjs';
import {cleanLibrary,loadVocativeStripper} from './hani-board-vocative-clean.mjs';

const strip=handlers.stripLeadingVocative;
for(const opening of ['아린 ', '아린, ', '아린， ', '아린! ', '아린님 ', '아린씨, ', '아린아 ', '아린야 ', '아린 선임, ', '아린 UI/UX 선임님, ', '아린선임님 ']){
  assert.equal(strip(opening+'내용','arin'),'내용',opening);
}
assert.equal(strip('채원, 직접 눌러보다 보니 좋아요.','taeo'),'직접 눌러보다 보니 좋아요.');
assert.equal(strip('도연 개발 선임님, 확인했어요.','dohyun'),'확인했어요.');
assert.equal(strip('뮤즈 · 가은 회장 비서님, 확인했어요.','gaeun'),'확인했어요.');
assert.equal(strip('가은 비서님, 확인했어요.','gaeun'),'확인했어요.');
assert.equal(strip('미르, 좋아요.','mir'),'좋아요.');
for(const text of ['회장님, 확인했어요.','대표님 확인했어요.','성민님, 확인했어요.','성민 회장님, 확인했어요.']){
  assert.equal(strip(text,roster.chairman.id,true,true),'확인했어요.');
  assert.equal(strip(text,roster.chairman.id,false),text);
}
assert.equal(strip('@회장님 회장님, 확인했어요.',roster.chairman.id,true,true),'확인했어요.');
for(const text of ['오늘 아린 선임, 확인했어요.','아린이 확인했어요.','아린의 의견이에요.','아린,확인했어요.','채원, 확인했어요.']){
  assert.equal(strip(text,'arin'),text);
}
assert.equal(strip('@아린 아린 선임, 숫자만 세고 있어요.','arin',true),'숫자만 세고 있어요.');
assert.equal(strip('@아린 아린 선임, 내용','arin',false),'@아린 아린 선임, 내용');
const toolStrip=await loadVocativeStripper();
assert.equal(toolStrip('아린 선임, 내용','arin'),'내용','source cleanup reuses runtime function');

const state=plain(api.getState());
state.boardPosts=[{id:'vocative-post',authorId:'taeo',body:'본문',title:'호칭',category:'LOUNGE'}];
state.boardComments=[
  {id:'vocative-root',postId:'vocative-post',authorId:'arin',body:'채원, 직접 눌러보다 보니 좋아요.'},
  {id:'vocative-reply',postId:'vocative-post',authorId:'taeo',parentId:'vocative-root',body:'@아린 아린 선임, 숫자만 세고 있어요. <b>확인</b>'},
  {id:'vocative-owner',postId:'vocative-post',authorId:roster.chairman.id,body:'확인'},
  {id:'vocative-chair-reply',postId:'vocative-post',authorId:'arin',parentId:'vocative-owner',body:'회장님, 확인했어요.'},
];
api.setState(state);
const before=plain(api.getState()),queues=inspection().queues;
const top=handlers.commentMarkup(state.boardComments[0]);
assert.match(top,/<p class="board-body">직접 눌러보다 보니 좋아요\.<\/p>/);
assert.ok(!top.includes('board-mention'));
const reply=handlers.commentMarkup(state.boardComments[1],true);
assert.equal((reply.match(/@아린/g)||[]).length,1);
assert.match(reply,/board-mention">@아린<\/span> 숫자만 세고 있어요\. &lt;b&gt;확인&lt;\/b&gt;/);
assert.ok(!reply.includes('아린 선임,'));
assert.match(handlers.commentMarkup(state.boardComments[3],true),/@회장님<\/span> 확인했어요\./);
assert.deepEqual(plain(api.getState()),before,'render never changes stored bodies');
assert.equal(inspection().queues,queues,'render never queues persistence');
assert.equal((await cleanLibrary({check:true})).changed,0,'library already clean');
console.log('PASS: vocatives, ranks/suffixes, chairman chip-only vocative cleanup, middle names, reply chip/escaping and read-only render');
