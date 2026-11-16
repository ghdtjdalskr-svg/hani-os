import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parse } = require("../hani-book-share-parse.js");

const SHARE = "아주 작은 습관의 힘 – 최고의 변화는 어떻게 만들어지는가 제임스 클리어 지음 / 이한이 옮김 평점 4.5 · 비즈니스북스 · 자기계발 · 2019.02.26";

test("회장님 실제 입력: 말이 앞뒤에 두 번 + 서점 글 한 줄", () => {
  const r = parse(`이거 책 더 읽었어 ${SHARE} 이거 책 더 읽었어`);
  assert.equal(r.title, "아주 작은 습관의 힘");
  assert.equal(r.subtitle, "최고의 변화는 어떻게 만들어지는가");
  assert.equal(r.author, "제임스 클리어");
  assert.equal(r.translator, "이한이");
  assert.equal(r.publisher, "비즈니스북스");
  assert.equal(r.category, "자기계발");
  assert.equal(r.publishedDate, "2019-02-26");
  assert.equal(r.storeRating, 4.5);
  assert.equal(r.userStatus, "reading");
  assert.equal(r.userPhrases.length, 2);
});

test("서점 글만 붙여넣기: 상태는 모름(null)", () => {
  const r = parse(SHARE);
  assert.equal(r.title, "아주 작은 습관의 힘");
  assert.equal(r.author, "제임스 클리어");
  assert.equal(r.userStatus, null);
});

test("말이 뒤에만: 다 읽었어 = 완독", () => {
  const r = parse(`${SHARE} 다 읽었어!`);
  assert.equal(r.title, "아주 작은 습관의 힘");
  assert.equal(r.userStatus, "read");
});

test("줄바꿈이 살아 있는 공유 글", () => {
  const r = parse("아주 작은 습관의 힘 - 최고의 변화는 어떻게 만들어지는가\n제임스 클리어 지음 / 이한이 옮김\n평점 4.5 · 비즈니스북스 · 자기계발 · 2019.02.26\n읽기 시작했어");
  assert.equal(r.title, "아주 작은 습관의 힘");
  assert.equal(r.author, "제임스 클리어");
  assert.equal(r.translator, "이한이");
  assert.equal(r.userStatus, "reading");
});

test("한국 저자 한 단어, 부제 없음, '은'으로 끝나는 이름", () => {
  const r = parse("작별하지 않는다 한강 지음 · 문학동네 · 소설 · 2021.09.09");
  assert.equal(r.title, "작별하지 않는다");
  assert.equal(r.author, "한강");
  const r2 = parse("마음의 지도 김지은 지음 · 어떤출판사");
  assert.equal(r2.title, "마음의 지도");
  assert.equal(r2.author, "김지은");
});

test("서점 글이 아니면 null (호출부는 제목을 다시 물어봄)", () => {
  assert.equal(parse("정의란 무엇인가 읽기 시작했어"), null);
  assert.equal(parse("오늘은 기분이 좋아"), null);
  assert.equal(parse(""), null);
});

test("서점 평점은 회장님 평점 칸이 아님 (storeRating 으로만)", () => {
  const r = parse(SHARE);
  assert.ok(!("rating" in r));
});
