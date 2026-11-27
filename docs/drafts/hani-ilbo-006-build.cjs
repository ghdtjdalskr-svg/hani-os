// Builds data/hani-ilbo/006.json from the reviewed draft and appends issue 6 to issues.json.
const fs = require('fs');
const f = 'docs/drafts/hani-ilbo-006-draft.json';
let s = fs.readFileSync(f, 'utf8');
const d = JSON.parse(s.replace(/^﻿/, ''));
const o = {
  number: 6, date: '2026-11-30', reporter: d.reporter, editorialDraft: false,
  headline: d.headline, headlineBody: d.headlineBody,
  comic: { title: d.comic.title, subtitle: d.comic.subtitle, image: 'assets/hani-ilbo/006-comic.webp', captions: d.comic.captions },
  interviewTitle: d.interviewTitle, interviewee: d.interviewee, interviewQuote: d.interviewQuote,
  interview: d.interview, news: d.news, praise: d.praise
};
if (!o.interview.some(x => x.a.includes(o.interviewQuote))) throw Error('interviewQuote not in interview');
if (o.comic.captions.length !== 6) throw Error('captions');
fs.writeFileSync('data/hani-ilbo/006.json', JSON.stringify(o, null, 2) + '\n');
const ip = 'data/hani-ilbo/issues.json';
let t = fs.readFileSync(ip, 'utf8');
const old = '{"number": 5, "date": "2026-11-23", "file": "data/hani-ilbo/005.json"}';
if (!t.includes('006.json')) {
  if (!t.includes(old)) throw Error('issues anchor');
  t = t.replace(old, old + ',\n    {"number": 6, "date": "2026-11-30", "file": "data/hani-ilbo/006.json"}');
  fs.writeFileSync(ip, t);
}
JSON.parse(t);
console.log('ok', o.comic.captions[4]);
