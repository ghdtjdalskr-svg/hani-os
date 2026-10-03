import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TAB_CHARACTER_LINES, createTabQuoteSelector } from '../hani-tab-character-lines.mjs';
import { characterProfile, VOICE_MODES } from '../hani-character-voice.mjs';

const ui=fs.readFileSync(new URL('../hani-ui-v02992.js',import.meta.url),'utf8');
const config=ui.slice(ui.indexOf('const mainCharacterSidebarMenuConfig='),ui.indexOf('const mainCharacterInternalContent='));
const menus=[...config.matchAll(/sidebarMenuKey: "([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(Object.keys(TAB_CHARACTER_LINES).sort(),menus.sort());
for(const [tab,entry] of Object.entries(TAB_CHARACTER_LINES)){
  assert.ok(characterProfile(entry.agent));assert.ok(VOICE_MODES.includes(entry.mode));
  assert.ok(entry.lines.length>=2);assert.equal(new Set(entry.lines).size,entry.lines.length);
  const select=createTabQuoteSelector(()=>0),first=select(tab);
  assert.equal(first.speaker,characterProfile(entry.agent).identity.split(' · ')[0]);
  assert.equal(select(tab).quote,first.quote,'redraw must be stable');
  select(tab==='home'?'movie':'home');
  assert.notEqual(select(tab).quote,first.quote,'re-entry must advance');
}
const select=createTabQuoteSelector(()=>0);
assert.equal(select('__proto__'),null);assert.equal(select('unknown'),null);
for(const view of ['yankees','kia','madrid','dplus']){
  const first=select('game',view);assert.equal(select('game',view).quote,first.quote);
  select('home');assert.notEqual(select('game',view).quote,first.quote);
}
assert.equal(TAB_CHARACTER_LINES.reading.agent,'haru');
assert.equal(TAB_CHARACTER_LINES.university.agent,'hina');
assert.equal(TAB_CHARACTER_LINES.exercise.agent,'sooyeon');
for(const tab of ['agentReview','deployment','policy','dev']){
  assert.ok(TAB_CHARACTER_LINES[tab].lines.every(line=>line.includes('대표님')||!line.includes('오빠')));
}
assert.doesNotMatch(ui,/q\('#aiQuote b'\)\.textContent='말씀해 주세요/);
for(const name of ['hani-tab-character-lines.mjs','hani-character-voice.mjs']){
  assert.doesNotMatch(fs.readFileSync(new URL('../'+name,import.meta.url),'utf8'),/localStorage|sessionStorage|\.from\(|fetch\(/);
}
console.log(`Tab character quotes: ${menus.length} menus, 4 sports views, stable redraw/re-entry, canonical owners PASS`);
