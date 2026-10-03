'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

function rgb(value){
  const match=String(value).match(/[\d.]+/g);
  return match?match.slice(0,3).map(Number):null;
}
function luminance(color){
  const channels=rgb(color).map(value=>{const v=value/255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});
  return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
}
function contrast(foreground,background){
  const a=luminance(foreground),b=luminance(background);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      Storage.prototype.setItem=()=>{throw Error('contrast fixture attempted storage write');};
      window.fetch=()=>{throw Error('contrast fixture attempted network fetch');};
    });
    await page.goto(process.env.HANI_PORTFOLIO_CONTRAST_URL||'http://127.0.0.1:8785/docs/preview/hani-portfolio-contrast.html');
    for(const finish of ['porcelain-cream','titanium-graphite','midnight-black','sakura-pink','alpine-blue']){
      await page.locator('html').evaluate((element,value)=>element.dataset.finish=value,finish);
      const styles=await page.evaluate(()=>{
        const root=document.querySelector('#portfolioLivePreview'),background=getComputedStyle(root).backgroundColor;
        return ['h3','h4','td','summary','.portfolio-bars b'].map(selector=>({selector,color:getComputedStyle(document.querySelector(selector)).color,background}));
      });
      for(const item of styles)assert.ok(contrast(item.color,item.background)>=4.5,`${finish} ${item.selector} contrast ${contrast(item.color,item.background).toFixed(2)}`);
    }
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile fixture must not overflow');
    assert.deepEqual(errors,[]);
    console.log('PASS: five finishes keep portfolio headings, details, bars and table text at WCAG AA contrast; mobile has no horizontal overflow; no storage/network writes');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
