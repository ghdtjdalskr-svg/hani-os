import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const ui=read('hani-ui-v02992.js'),remote=read('hani-context-remote-v1.js'),html=read('index.html');
new vm.Script(ui);new vm.Script(remote);
const context=vm.createContext({});
const voice=ui.slice(ui.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),ui.indexOf('// END CANONICAL TAB VOICE BUNDLE'));
const config=ui.slice(ui.indexOf('  const mainCharacterBannerVariants='),ui.indexOf('  const mainCharacterInternalViewExists='));
const defaults=remote.slice(remote.indexOf('  const defaults='),remote.indexOf('  const rail='));
vm.runInContext(voice+'\n'+config+'\n'+defaults+'\nthis.api={select:createTabQuoteSelector(()=>0),resolve:mainCharacterBannerConfig,defaults,profile:characterProfile};',context);
const {api}=context;
const expected={home:'hani',intake:'yuna',agentReview:'hani',monthlyReport:'hani',organization:'hani',ilbo:'minji',board:'hani',investment:'hani',investmentCommittee:'hani',investmentIntake:'hani',asset:'jieun',ledger:'jieun',newsroom:'hani',diet:'naeun',exercise:'naeun',reading:'haru',study:'hina',university:'hina',certificate:'hina',wishlist:'haru',travel:'sooyeon',movie:'minji',game:'sooyeon',diary:'haru',tasks:'yuna',calendar:'yuna',drive:'sua',aiWork:'dohyun',dev:'seoyun',geminiReports:'serin',deployment:'seoyun',aiBudget:'seoyun',aura:'hani',settings:'yuna',policy:'sua',work:'sua',aiTeam:'hani',characterArchive:'hani'};
for(const [view,owner] of Object.entries(expected)){
 const selected=api.select(view);assert.ok(selected,view+' resolves an actual speaker');assert.equal(selected.agent,owner,view+' quote owner');
 assert.equal(selected.speaker,api.profile(owner).identity.split(' · ')[0],view+' real profile name');
 assert.equal((api.defaults[view]?.agent||'HANI').toLowerCase(),owner,view+' Remote owner');
 const banner=api.resolve(view);
 if(banner){assert.equal(banner.owner,owner,view+' banner owner');assert.equal(banner.profile,owner,view+' portrait');assert.equal(banner.speaker,selected.speaker,view+' banner name');}
}
assert.equal(api.resolve('university').sceneImage,'./assets/heroes/university-226w.webp');
assert.match(api.resolve('university').sceneAlt,/히나/);assert.doesNotMatch(api.resolve('university').sceneAlt,/하루/);
assert.match(api.resolve('reading').sceneAlt,/윤슬.*하루/);assert.doesNotMatch(api.resolve('reading').sceneAlt,/민지/);
assert.equal(api.resolve('movie').sceneImage,'./assets/design-system-v1/hina-cinema-canonical.webp','대표님 승인: 217 팝콘/3D 안경 그림 예외');assert.equal(api.resolve('movie').owner,'minji','담당은 218 정정 유지');
assert.ok(api.profile('dohyun').image.endsWith('hani-profile-dohyun.webp'));
assert.match(api.profile('naeun').domain_authority,/건강·운동/);
assert.match(api.profile('sooyeon').domain_authority,/건강·운동 루틴은 나은/);
const companions=ui.slice(ui.indexOf('  const companions='),ui.indexOf('  const designSceneSrc='));
const cards=vm.runInNewContext(companions+';companions');
assert.equal(cards.hinaJones.agent,'minji');assert.equal(cards.harukei.agent,'naeun');
assert.match(html,/data-design-scene="hina-cinema" src="\.\/assets\/heroes\/movie-218.webp"/);
assert.match(html,/data-design-scene="steps" src="\.\/assets\/heroes\/exercise-218.webp"/);
for(const [key,view] of [['asset','investment'],['naeun-running','exercise'],['spending','ledger'],['learning','study']])assert.ok(html.includes(`data-design-scene="${key}" src="./assets/heroes/${view}-218.webp"`));
assert.match(html,/HINA JONES/);assert.match(html,/HARUKEI 10K/);
// Role corrections must preserve the HINA release gate action.
assert.equal(api.defaults.deployment.sections[2][1],'#deployHinaQaBtn');
console.log('PASS 38 menu owners across quote/banner/Remote, actual profile resolution, corrected scene casts, companion cards and HINA gate target');
