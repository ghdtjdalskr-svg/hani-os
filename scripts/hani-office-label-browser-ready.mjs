import {setTimeout as delay} from 'node:timers/promises';
import {performance} from 'node:perf_hooks';

// Deadlines and polling live in Node: the page's Date is deliberately frozen.
export async function untilOffice(page,predicate,arg,timeout=30000){
 const deadline=performance.now()+timeout;
 while(performance.now()<deadline){if(await page.evaluate(predicate,arg))return;await delay(75)}
 throw Error('office readiness timeout: '+predicate);
}
export async function waitForOfficeLabels(page,floor){
 await page.evaluate(()=>document.fonts.ready);
 await untilOffice(page,f=>{
  const map=document.getElementById('haniOfficeMap'),bg=map?.querySelector('.hani-office-background'),mascots=map?.querySelector(`.hani-desk-mascots[data-floor="${f}"]`);
  const actors=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden);
  return map?.dataset.floor===f&&map.dataset.art==='floor'&&bg?.complete&&bg.naturalWidth>0&&mascots&&!mascots.hidden&&
   [...mascots.querySelectorAll('.hani-desk-mascot')].every(n=>n.dataset.ready==='true')&&
   actors.every(a=>a.dataset.avatar==='v2'&&a.querySelector('.hani-office-status').dataset.full===a.dataset.line);
 },floor);
 // Use the canonical floor event after fonts/sprites/mascots have finished loading.
 await page.locator(`[data-building-floor="${floor}"]`).click();
 await untilOffice(page,f=>{
  const map=document.getElementById('haniOfficeMap');
  return map.dataset.floor===f&&map.dataset.labelsReady===f&&map.dataset.labelsAt===String(officeClock)&&
   [...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden).every(a=>['name','status'].every(kind=>a.querySelector('.hani-office-'+kind).officeLabelPlacement!==undefined));
 },floor);
}
