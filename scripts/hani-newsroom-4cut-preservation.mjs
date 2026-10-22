// Immutable approved additions, applied to CURRENT source only. Preserve every other byte.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const newsroomBlock=`    <section id="newsroom" class="view">
      <section class="newsroom-4cut" hidden aria-label="주간 시황 4컷">
        <h2 class="newsroom-4cut-heading"></h2>
        <p class="newsroom-4cut-meta"></p>
        <h3 class="newsroom-4cut-title"></h3>
        <button type="button" class="newsroom-4cut-open" aria-haspopup="dialog">
          <img class="newsroom-4cut-image" loading="lazy" width="1200" height="1600" alt="">
          <span>원본 크기로 보기</span>
        </button>
        <p class="newsroom-4cut-footnote">※ 정보 정리용이며 투자 권유가 아닙니다.</p>
        <details class="newsroom-4cut-sources"><summary>출처 보기</summary><ul class="newsroom-4cut-source-list"></ul></details>
        <button type="button" class="newsroom-4cut-latest" hidden>이번 주 4컷으로 돌아가기</button>
        <details class="newsroom-4cut-archive"><summary>지난 4컷</summary><ol class="newsroom-4cut-past"></ol></details>
        <dialog aria-label="주간 시황 4컷 원본">
          <form method="dialog"><button type="submit" autofocus>닫기</button></form>
          <h3 class="newsroom-4cut-dialog-title"></h3>
          <img class="newsroom-4cut-full" loading="lazy" width="1200" height="1600" alt="">
          <p class="newsroom-4cut-footnote">※ 정보 정리용이며 투자 권유가 아닙니다.</p>
        </dialog>
      </section>
      <div id="newsroomMount"></div></section>`;
export const newsroomScript='<script src="./hani-newsroom-4cut.js"></script>\n';
export const newsroomEntry='  if(id==="newsroom")window.HaniNewsroom4cut?.enter();\n';
export const newsroomCss=`/* Newsroom weekly comic: a persistent, read-only slot. */
#newsroom .newsroom-4cut{
  box-sizing:border-box;min-width:0;margin:0 0 20px;padding:clamp(14px,2vw,24px);
  border:1px solid var(--border-strong,#858d9e);border-radius:18px;
  background:var(--surface-panel,#fff);color:var(--text-primary,#292d39);
}
#newsroom .newsroom-4cut[hidden],#newsroom .newsroom-4cut [hidden]{display:none!important}
#newsroom .newsroom-4cut :is(h2,h3,p){overflow-wrap:anywhere}
#newsroom .newsroom-4cut h2{margin:0 0 8px;font-size:clamp(18px,2vw,24px);line-height:1.5}
#newsroom .newsroom-4cut h3{margin:8px 0 14px;font-size:18px;line-height:1.5}
#newsroom .newsroom-4cut-meta,#newsroom .newsroom-4cut-footnote{color:var(--text-secondary,#555d70);font-size:14px;line-height:1.6;margin:10px 0}
#newsroom .newsroom-4cut button,#newsroom .newsroom-4cut summary{
  box-sizing:border-box;min-height:44px;font:inherit;font-size:14px;line-height:1.6;
  color:inherit;cursor:pointer;overflow-wrap:anywhere;white-space:normal;
}
#newsroom .newsroom-4cut button{border:1px solid var(--border-strong,#858d9e);border-radius:10px;background:var(--surface-raised,#fff);padding:8px 12px;max-width:100%}
#newsroom .newsroom-4cut .newsroom-4cut-open{display:block;width:min(100%,520px);padding:0;overflow:hidden}
#newsroom .newsroom-4cut-open span{display:block;padding:10px;text-decoration:underline;text-underline-offset:3px}
#newsroom .newsroom-4cut img{display:block;max-width:100%;width:100%;height:auto}
#newsroom .newsroom-4cut summary{padding:10px 0}
#newsroom .newsroom-4cut li{padding:4px 0;overflow-wrap:anywhere}
#newsroom .newsroom-4cut :is(ul,ol){padding-left:22px;margin:0 0 12px}
#newsroom .newsroom-4cut a{display:inline-block;min-height:44px;padding:10px 0;box-sizing:border-box;color:var(--text-primary,#292d39);text-decoration:underline;text-underline-offset:3px}
#newsroom .newsroom-4cut :is(button,summary,a):focus-visible{outline:3px solid var(--text-primary,#292d39);outline-offset:3px}
#newsroom .newsroom-4cut button[aria-pressed="true"]{border-width:2px;font-weight:700}
#newsroom .newsroom-4cut dialog{box-sizing:border-box;width:min(calc(100% - 24px),1248px);max-width:calc(100% - 24px);max-height:90svh;padding:16px;border:1px solid var(--border-strong,#858d9e);border-radius:14px;background:var(--surface-panel,#fff);color:var(--text-primary,#292d39);overflow:auto}
#newsroom .newsroom-4cut dialog::backdrop{background:rgba(0,0,0,.7)}
#newsroom .newsroom-4cut dialog form{display:flex;justify-content:flex-end;position:sticky;top:0}
`;
export const approvedNewsroomFiles=Object.freeze(['hani-newsroom-4cut.js','assets/data/newsroom-4cut/issues.json']);
export const approvedReportFiles=Object.freeze([
 '2026-10-19-v2.9.218-219-night-office-heroes-remote-card.md',
 '2026-10-21-v2.9.220-223-cloud-egress-night-actions-offline-entry.md',
 '2026-10-21-v2.9.224-226-office-hd-settings-asset-intake.md',
 '2026-10-22-v2.9.227-229-street-journal-hero-restore-office-lively.md'
]);
const hash=s=>createHash('sha256').update(s).digest('hex');
function replaceOnce(source,from,to=''){
 assert.equal(source.split(from).length-1,1,'one exact approved newsroom addition: '+from.slice(0,90));
 return source.replace(from,to);
}
function reportLine(source){
 const lines=source.match(/^globalThis\.HaniGeminiReportCatalog=Object\.freeze\([^\r\n]*\);/gm)||[];
 assert.equal(lines.length,1,'one exact report catalog');return lines[0];
}
export function withoutNewsroom4cut(file,source,releaseMain){
 if(file==='index.html'){
  assert.match(source,/<script src="\.\/hani-media-core\.js\?v=2\.9\.\d+"><\/script>\n<script src="\.\/hani-newsroom-4cut\.js"><\/script>\n<script src="\.\/hani-main\.js\?v=2\.9\.\d+"><\/script>/,'canonical newsroom script order');
  source=replaceOnce(source,newsroomBlock,'    <section id="newsroom" class="view"><div id="newsroomMount"></div></section>');
  return replaceOnce(source,newsroomScript);
 }
 if(file==='hani-design-system.css'){
  assert.ok(source.endsWith(newsroomCss),'approved newsroom CSS is append-only');
  return replaceOnce(source,newsroomCss);
 }
 if(file==='hani-main.js'){
  assert.ok(source.includes('  if(id==="ilbo")window.HaniIlbo?.enter();\n'+newsroomEntry+'  if(id==="geminiReports")window.HaniGeminiReports?.render();'),'canonical newsroom event path');
  source=replaceOnce(source,newsroomEntry);
  const current=reportLine(source),original=reportLine(releaseMain);
  assert.equal(hash(current),'0448b75712d4582ae1dd23615b0dd031e5dc7df0fc001dd63d034ddb1dd9919a','approved report catalog bytes');
  assert.equal(hash(original),'a06b7ea267dd3f7fd716127ff0c7ce84b1a2ad7a08e0c6935035e6558d05dc14','immutable release230 report catalog');
  return replaceOnce(source,current,original);
 }
 return source;
}
