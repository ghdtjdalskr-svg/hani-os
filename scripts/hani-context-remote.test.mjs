import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const css=fs.readFileSync(path.join(root,'hani-context-remote.css'),'utf8');
const js=fs.readFileSync(path.join(root,'hani-context-remote-v1.js'),'utf8');
const image=css.match(/#app \.hani-remote-media-image\{([^}]+)\}/)[1];
assert.match(image,/object-fit:cover;object-position:65% top;filter:none/);
assert.match(image,/width:100%;height:100%/);
assert.match(css,/#app \.hani-remote-copy small\{[^}]*font-size:12px/);
assert.match(css,/:focus-visible\{outline:2px solid var\(--remote-focus\)/);
assert.match(css,/grid-template-columns:var\(--sidebar\) minmax\(0,1fr\) 236px/);
assert.match(css,/grid-template-columns:var\(--sidebar\) minmax\(0,1fr\) 64px/);
assert.match(css,/@media \(max-width:850px\)\{\s*#app \.hani-remote-group-label\{display:none\}/);
for(const action of ['current','primary','yuna','agent','recent','alert','theme','top']){
 assert.match(css,new RegExp(`\\[data-remote-action="${action}"\\]\\{--remote-chip:#[0-9a-f]{6}\\}`));
 assert.equal((js.match(new RegExp(`data-remote-action="${action}"`,'g'))||[]).length,['primary','yuna','agent','recent'].includes(action)?2:1);
}
assert.equal(new Set([...css.matchAll(/--remote-chip:(#[0-9a-f]{6})\}/g)].map(x=>x[1])).size,8);
assert.equal((js.match(/rail\.addEventListener\("click"/g)||[]).length,1);
assert.ok(!/\.clear\(|localStorage\.(setItem|removeItem)|\s+id\s*=\s*["']/.test(js),'no storage writes, clear calls or HTML id literals');
assert.equal((js.match(/rail\.id="haniContextRemote"/g)||[]).length,1);
// AA palette regression; browser test checks computed colors and interactive states.
const lum=hex=>{const c=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
for(const rule of css.matchAll(/\{--remote-ink:(#[0-9a-f]+);--remote-muted:(#[0-9a-f]+);([^}]+)\}/g)){
 for(const bg of rule[3].matchAll(/--remote-(?:row|current|primary|yuna|alert):(#[0-9a-f]+);/g))for(const fg of [rule[1],rule[2]]){
  const a=lum(fg.slice(1)),b=lum(bg[1].slice(1));assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${fg}/${bg[1]}`);
 }
}
assert.ok(!js.includes('MutationObserver'),'remote rendering has no observer layer');
assert.match(js,/window\.HANI_MAIN_CHARACTER_BANNER\?\.get\(viewId\(\)\)/);
assert.match(js,/querySelectorAll\('button'\)\.forEach/);
console.log('PASS remote CSS, palette AA, dimensions, actions and presentation safety assertions');
