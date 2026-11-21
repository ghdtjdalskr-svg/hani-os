/* HANI OS · 서점 공유 글 해석기 (유나 입력데스크용, 2026-11-17 서윤)
 * 서점 앱에서 복사한 책 정보 + 회장님 말("이거 책 더 읽었어")을 나눠서 읽는다.
 * 저장은 하지 않는다. 입력 문자열 → 미리보기에 넣을 값만 돌려준다.
 * 모르는 모양이면 null (호출하는 쪽은 지금처럼 제목을 다시 물어본다. 추측해서 채우지 않기).
 */
(function (root) {
  "use strict";

  // 회장님이 덧붙이는 말. 앞·뒤 어디든, 여러 번 나와도 모두 떼어 낸다.
  var USER_PHRASE = /(?:(?:이거|이\s*책|요\s*책|이것)\s*)?(?:책\s*)?(?:(?:오늘|어제)\s*)?(?:(?:조금|좀)?\s*더\s*|다\s*)?(?:읽었어요|읽었어|읽었다|읽음|읽는\s*중(?:이야|이에요)?|읽고\s*있어(?:요)?|읽기\s*시작했어(?:요)?|읽기\s*시작|완독했어(?:요)?|완독)[.!~]*/g;

  // 이름 조각으로 보기 어려운 끝말(문장·조사 끝). 저자 이름을 뒤에서부터 고를 때 멈추는 기준.
  var NOT_NAME_END = /(?:가|다|는|은|을|를|의|에|기|함|까|요|지|법|들|것|게|고|며|면|서|와|과|로|만|도|힘|책|세상|이야기)$/;
  var SUBTITLE_SEP = /\s+[–—-]\s+|\s*:\s+/;

  function clean(s) { return String(s == null ? "" : s).replace(/[ \t]+/g, " ").replace(/[ ]{2,}/g, " ").trim(); }

  function statusFrom(phrases) {
    var joined = phrases.join(" ");
    if (!joined) return null;
    if (/다\s*읽|완독/.test(joined)) return "read";
    if (/더\s*읽|읽는\s*중|읽고\s*있|읽기\s*시작/.test(joined)) return "reading";
    if (/읽었|읽음/.test(joined)) return "read";
    return null;
  }

  function looksLikeWord(t) { return !!t && t.length <= 5 && /^[가-힣A-Za-z.]+$/.test(t); }

  // "… 제임스 클리어" 처럼 지음 바로 앞의 이름 조각(최대 3개)을 뒤에서부터 고른다.
  // 맨 끝 조각은 이름으로 본다(김지은처럼 '은'으로 끝나는 이름도 있으니까). 그 앞 조각은 문장 끝말이 아니어야 이름에 붙인다.
  function splitAuthor(beforeJieum) {
    var tokens = clean(beforeJieum).split(" ");
    var name = [];
    if (looksLikeWord(tokens[tokens.length - 1])) name.unshift(tokens.pop());
    while (name.length && tokens.length && name.length < 3) {
      var t = tokens[tokens.length - 1];
      if (!looksLikeWord(t) || NOT_NAME_END.test(t) || /^[가-힣]$/.test(t)) break;
      name.unshift(tokens.pop());
    }
    return { head: tokens.join(" "), author: name.join(" ") };
  }

  function parse(text) {
    var raw = String(text == null ? "" : text);
    var phrases = [];
    var body = raw.replace(USER_PHRASE, function (m) { phrases.push(clean(m)); return " "; });
    var lines = body.split(/\r?\n/).map(clean).filter(Boolean);
    body = clean(lines.join(" "));

    // 서점 공유 글인지: "지음" 또는 "저자" 표시가 있어야 한다.
    var jm = /([^/·]*?)(?:\s*지음|\s+저)(?=\s|$|\/|·)/.exec(body);
    if (!jm) return null;

    var beforeAuthor = body.slice(0, jm.index + jm[1].length);
    var after = body.slice(jm.index + jm[0].length);

    var title = "", subtitle = "", author = "";
    // 줄바꿈이 남아 있던 경우: 지음이 있는 줄 = 저자 줄, 그 앞 줄 = 제목 줄.
    var authorLineIdx = -1;
    for (var i = 0; i < lines.length; i++) if (/(?:\s*지음|\s+저)(?=\s|$|\/|·)/.test(lines[i])) { authorLineIdx = i; break; }
    if (authorLineIdx > 0 && /^[^\s/·]+(?:\s[^\s/·]+){0,2}\s*(?:지음|\s저)/.test(lines[authorLineIdx])) {
      var aLine = lines[authorLineIdx].replace(/(?:\s*지음|\s+저)(?=\s|$|\/|·)[\s\S]*$/, "");
      author = clean(aLine);
      var tLines = lines.slice(0, authorLineIdx).join(" ");
      var tp = tLines.split(SUBTITLE_SEP);
      title = clean(tp[0]); subtitle = clean(tp.slice(1).join(" "));
    } else {
      var sa = splitAuthor(beforeAuthor);
      author = sa.author;
      var parts = sa.head.split(SUBTITLE_SEP);
      title = clean(parts[0]); subtitle = clean(parts.slice(1).join(" "));
    }
    if (!title || !author) return null;

    var tm = /\/\s*([^·/]+?)\s*옮김/.exec(after);
    var rm = /평점\s*(\d(?:\.\d+)?)/.exec(after);
    var tail = after.replace(/\/\s*[^·/]+?\s*옮김/, "").replace(/평점\s*\d(?:\.\d+)?/, "");
    var bits = tail.split("·").map(clean).filter(Boolean);
    var date = "";
    var rest = [];
    bits.forEach(function (b) {
      var d = /^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?$/.exec(b);
      if (d && !date) date = d[1] + "-" + ("0" + d[2]).slice(-2) + "-" + ("0" + d[3]).slice(-2);
      else rest.push(b);
    });

    return {
      title: title,
      subtitle: subtitle,
      author: author,
      translator: tm ? clean(tm[1]) : "",
      publisher: rest[0] || "",
      category: rest[1] || "",
      publishedDate: date,
      storeRating: rm ? Number(rm[1]) : null, // 서점 평점. 회장님 평점으로 쓰지 말 것.
      userStatus: statusFrom(phrases),          // "reading" | "read" | null
      userPhrases: phrases
    };
  }

  var api = { parse: parse, version: "book-share-parse-v1" };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.HaniBookShare = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
