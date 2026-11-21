// Builds data/hani-ilbo/005.json from the reviewed draft and appends issue 5 to issues.json.
const fs = require('fs');
const f = 'docs/drafts/hani-ilbo-005-draft.json';
let s = fs.readFileSync(f, 'utf8');
const a = '개구리 성민 회장의 웃음 속에';
if (s.includes(a)) { s = s.replace(a, '회장님의 웃음 속에'); fs.writeFileSync(f, s); }
const d = JSON.parse(s.replace(/^﻿/, ''));
const o = {
  number: 5, date: '2026-11-23', reporter: d.reporter, editorialDraft: false,
  headline: d.headline, headlineBody: d.headlineBody,
  comic: { title: d.comic.title, subtitle: d.comic.subtitle, image: 'assets/hani-ilbo/005-comic.webp', captions: d.comic.captions },
  interviewTitle: d.interviewTitle, interviewee: d.interviewee, interviewQuote: d.interviewQuote,
  interview: d.interview, news: d.news, praise: d.praise
};
if (!o.interview.some(x => x.a.includes(o.interviewQuote))) throw Error('interviewQuote not in interview');
if (o.comic.captions.length !== 6) throw Error('captions');
fs.writeFileSync('data/hani-ilbo/005.json', JSON.stringify(o, null, 2) + '\n');
const ip = 'data/hani-ilbo/issues.json';
let t = fs.readFileSync(ip, 'utf8');
const old = '{"number": 4, "date": "2026-11-09", "file": "data/hani-ilbo/004.json"}';
if (!t.includes('005.json')) {
  if (!t.includes(old)) throw Error('issues anchor');
  t = t.replace(old, old + ',\n    {"number": 5, "date": "2026-11-23", "file": "data/hani-ilbo/005.json"}');
  fs.writeFileSync(ip, t);
}
JSON.parse(t);
console.log('ok', o.comic.captions[4]);
