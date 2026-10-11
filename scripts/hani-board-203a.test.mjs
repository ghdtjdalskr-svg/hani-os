// Synthetic chairman comments. No network or new storage paths.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {api,handlers as h,context,roster,plain,inspection} from './hani-board.test.mjs';

vm.runInContext(fs.readFileSync(new URL('../hani-relationship-seed.js',import.meta.url),'utf8'),context);
const post={id:'203a',authorId:'seongmin',category:'WORK',title:'팀 이야기',body:'함께 이야기해요',createdAt:'2026-10-11T00:00:00Z'};
api.setState({...plain(api.freshState()),boardPosts:[post]});
const before=plain(api.getState()),writes=inspection().queues;
const examples={thanks:['고마워! 정말 잘했어','수고했어요','좋은 글 감사합니다'],question:['왜 그렇게 생각해?','어떻게 확인하나요','언제 볼 수 있어요？'],joke:['ㅋㅋ 웃기네','농담이야 ㅎㅎ'],agree:['맞아 나도 공감해','저도 좋아요'],other:['오늘 커피 마셨어','새 기록을 남겼어요']};
for(const [intent,texts] of Object.entries(examples)){
  assert.ok(h.CHAIRMAN_REPLIES[intent].length>=8);
  for(const text of texts){
    assert.equal(h.chairmanReplyIntent(text),intent,text);
    for(const member of roster.people){
      const source={id:'source-'+member.id,authorId:'seongmin',body:'@'+member.name+' '+text};
      const replies=h.ownerReactions(post,source,[],2);
      assert.ok(replies.length>=1&&replies.length<=3);
      for(const c of replies){
        assert.equal(c.intent,intent);
        assert.match(c.body,/^(회장님|대표님),/);
        assert.ok(!/성민|매니저님|오빠/.test(c.body));
        assert.ok(h.CHAIRMAN_REPLIES[intent].some(line=>c.body.includes(line)));
        assert.ok(c.body.length<90);
      }
    }
  }
}
for(const member of roster.people){
  const addresses=new Set();
  for(let seed=0;seed<100;seed++)addresses.add(h.staffAddress(member.id,'seongmin',post,seed,[]));
  assert.deepEqual([...addresses].sort(),['대표님','회장님']);
}
assert.deepEqual(plain(api.getState()),before);
assert.equal(inspection().queues,writes,'reaction preview never writes');

const thread=[
  {id:'root',createdAt:'2026-10-11T00:00:00Z',authorId:'seongmin',body:'원댓글',postId:post.id},
  {id:'a',parentId:'root',createdAt:'2026-10-11T00:01:00Z',authorId:'hani',body:'첫 답글',postId:post.id},
  {id:'deep',parentId:'a',createdAt:'2026-10-11T00:03:00Z',authorId:'yuri',body:'깊은 답글',postId:post.id},
  {id:'b',parentId:'root',createdAt:'2026-10-11T00:02:00Z',authorId:'jieun',body:'다음 답글',postId:post.id},
  {id:'orphan',parentId:'missing',createdAt:'2026-10-11T00:04:00Z',authorId:'serin',body:'부모 없는 답글',postId:post.id}
];
const ordered=plain(h.orderedComments(thread));
assert.deepEqual(ordered.map(x=>x.comment.id),['root','a','b','deep','orphan']);
assert.deepEqual(ordered.map(x=>x.nested),[false,true,true,true,false]);
assert.deepEqual(thread.map(c=>c.id),['root','a','deep','b','orphan'],'source order preserved');
assert.equal(h.orderedComments([{id:'x',parentId:'y'},{id:'y',parentId:'x'}]).length,2,'legacy cycle stays visible once');
api.setState({...api.getState(),boardComments:thread});
const markup=h.commentMarkup(thread[1],true,false);
assert.match(markup,/<p class="board-body"><span class="board-mention">@회장님<\/span> 첫 답글/);
assert.ok(!markup.includes('에게 답글'));
assert.match(h.commentMarkup(thread[2],true,false),/@하니<\/span> 깊은 답글/);

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const settings=html.match(/<details class="board-settings"[^>]*>[\s\S]*?<\/details>/)[0];
assert.ok(!settings.match(/^<details[^>]*\bopen\b/));
assert.ok(settings.includes('<summary>게시판 설정</summary>'));
for(const key of ['react','replyMode','arriveNow','attendance'])assert.ok(settings.includes('data-board="'+key+'"'));
assert.ok(html.indexOf('data-board="list"')<html.indexOf('<details class="board-settings"'));
console.log('PASS: 5 intent pools, contextual/persona replies, chairman honorifics, preview no writes, chronological one-level threads, compact mentions, collapsed settings');
