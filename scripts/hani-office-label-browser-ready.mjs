import {setTimeout as delay} from 'node:timers/promises';
import {performance} from 'node:perf_hooks';

// Deadlines and polling live in Node: the page's Date is deliberately frozen.
export async function untilOffice(page,predicate,arg,timeout=30000){
 const deadline=performance.now()+timeout;
 while(performance.now()<deadline){if(await page.evaluate(predicate,arg))return;await delay(75)}
 // Report the page state too, so a timeout says which readiness condition stayed false.
 const state=await page.evaluate(()=>{const map=document.getElementById('haniOfficeMap'),bg=map?.querySelector('.hani-office-background'),layer=map?.querySelector(`.hani-desk-mascots[data-floor="${map?.dataset.floor}"]`);
  return {floor:map?.dataset.floor,art:map?.dataset.art,bg:!!(bg?.complete&&bg.naturalWidth),labelsReady:map?.dataset.labelsReady,labelsAt:map?.dataset.labelsAt,clock:String(window.officeClock),
   mascots:layer?[...layer.querySelectorAll('.hani-desk-mascot')].map(n=>n.dataset.person+':'+n.dataset.ready):null,
   actors:[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden).map(a=>a.dataset.person+':'+a.dataset.avatar+':'+(a.querySelector('.hani-office-status').dataset.full===a.dataset.line)+':'+['name','status'].every(k=>a.querySelector('.hani-office-'+k).officeLabelPlacement!==undefined))}}).catch(e=>({error:e.message}));
 throw Error('office readiness timeout: '+JSON.stringify(state)+' :: '+String(predicate).slice(0,120));
}
export async function waitForOfficeLabels(page,floor){
 await page.evaluate(()=>document.fonts.ready);
 await untilOffice(page,f=>{
  const map=document.getElementById('haniOfficeMap'),bg=map?.querySelector('.hani-office-background'),mascots=map?.querySelector(`.hani-desk-mascots[data-floor="${f}"]`);
  const actors=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden);
  return map?.dataset.floor===f&&map.dataset.art==='floor'&&bg?.complete&&bg.naturalWidth>0&&mascots&&!mascots.hidden&&
   [...mascots.querySelectorAll('.hani-desk-mascot')].every(n=>n.dataset.ready==='true')&&
   // The label prefixes the action emoji ("📑 line"), so the full text ends with the actor line.
   actors.every(a=>{const full=a.querySelector('.hani-office-status').dataset.full||'',line=a.dataset.line||'';return a.dataset.avatar==='v2'&&(full===line||full===(a.dataset.emoji?a.dataset.emoji+' ':'')+line)});
 },floor);
 // Use the canonical floor event after fonts/sprites/mascots have finished loading.
 await page.locator(`[data-building-floor="${floor}"]`).click();
 await untilOffice(page,f=>{
  const map=document.getElementById('haniOfficeMap');
  return map.dataset.floor===f&&map.dataset.labelsReady===f&&map.dataset.labelsAt===String(officeClock)&&
   [...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden).every(a=>['name','status'].every(kind=>a.querySelector('.hani-office-'+kind).officeLabelPlacement!==undefined));
 },floor);
}
