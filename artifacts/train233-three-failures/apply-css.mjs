import fs from 'node:fs';
import assert from 'node:assert/strict';
const changes=[
 ['hani-design-system.css',[
  ['#app #ledger :is(.ledger-jispi-head,.ledger-jispi-head span,.ledger-breaker-line strong,.ledger-support-kpis span,.ledger-support-kpis b){color:#f5f7ff!important}', '#app #ledger :is(.ledger-jispi-head,.ledger-jispi-head span,.ledger-breaker-line strong,.ledger-support-kpis span,.ledger-support-kpis b){color:var(--appearance-ink,#273349)!important}'],
  ['#app #ledger .ledger-jispi-meta span{color:#e0e5f5!important}', '#app #ledger .ledger-jispi-meta span{color:var(--appearance-ink,#273349)!important}'],
  ['#app #ledger .ledger-market-board .sh h3{color:#f5f7ff!important}', '#app #ledger .ledger-market-board .sh h3{color:var(--appearance-ink,#273349)!important}']
 ]],
 ['hani-context-remote.css',[
  ['#app .hani-remote-media p{margin:0;color:#fff;line-height:1.6}', '/* The mobile rail lives inside .top; its title does not own the header underline. */\n#app .hani-remote-media h2::after{content:none}\n#app .hani-remote-media p{margin:0;color:#fff;line-height:1.6}']
 ]]
];
for(const [file,replacements] of changes){
 let source=fs.readFileSync(file,'utf8');
 for(const [before,after] of replacements){assert.equal(source.split(before).length-1,1,file);source=source.replace(before,()=>after)}
 fs.writeFileSync(file,source);
}
fs.writeFileSync(new URL('css-corrections.json',import.meta.url),JSON.stringify(changes,null,2)+'\n');
console.log('Edited existing CSS owners only; retained all untouched bytes/EOL.');
