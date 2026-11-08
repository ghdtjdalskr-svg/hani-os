// Test preload only. Restore exactly the approved outer additions in memory;
// every original assertion and production file on disk remains intact.
import './hani-life-bundle-preload.mjs';
export function withoutProcrastination(text,file) {
  let result=text.replace(/\r\n/g,'\n');
  const erase=pattern=>{
    if([...result.matchAll(new RegExp(pattern.source,pattern.flags+'g'))].length!==1)throw new Error('Exact inverse anchor drift: '+file);
    result=result.replace(pattern,'');
  };
  if(file==='index.html')for(const name of ['STYLE','NAV','VIEW','SCRIPT'])erase(new RegExp('^[ \\t]*<!-- BEGIN PROCRASTINATION '+name+' -->\\n[\\s\\S]*?^[ \\t]*<!-- END PROCRASTINATION '+name+' -->\\n','m'));
  if(file==='hani-main.js'){
    for(const name of ['META','ENTER'])erase(new RegExp('^[ \\t]*// BEGIN PROCRASTINATION '+name+'\\n[\\s\\S]*?^[ \\t]*// END PROCRASTINATION '+name+'\\n','m'));
    const hook=';/* PROCRASTINATION REFRESH */if(document.body.dataset.view==="procrastination")window.HaniProcrastination?.render(state)';
    if(result.split(hook).length!==2)throw new Error('Exact inverse render hook drift');
    result=result.replace(hook,'');
  }
  return result;
}
