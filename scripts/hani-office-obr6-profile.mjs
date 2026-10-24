import fs from 'node:fs';
const profile=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),nodes=new Map(profile.nodes.map(n=>[n.id,n])),parent=new Map(),self=new Map(),total=new Map();
for(const n of profile.nodes)for(const child of n.children||[])parent.set(child,n.id);
for(let i=0;i<profile.samples.length;i++){
 const id=profile.samples[i],delta=profile.timeDeltas[i];self.set(id,(self.get(id)||0)+delta);
 for(let cursor=id;cursor;cursor=parent.get(cursor))total.set(cursor,(total.get(cursor)||0)+delta);
}
const rows=[...total].map(([id,microseconds])=>{const n=nodes.get(id),frame=n.callFrame;return {name:frame.functionName,line:frame.lineNumber+1,selfMs:(self.get(id)||0)/1000,totalMs:microseconds/1000}}).sort((a,b)=>b.totalMs-a.totalMs);
console.log(JSON.stringify(rows.slice(0,45),null,2));
