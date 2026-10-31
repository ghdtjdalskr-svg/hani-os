// Test-only measurements, shared by obr14/15 and phone label regressions.
import assert from 'node:assert/strict';
export function readPhoneLabels(){
 const map=document.getElementById('haniOfficeMap'),floor=map.getBoundingClientRect(),phone=matchMedia('(max-width:600px)').matches;
 const visible=n=>!n.hidden&&getComputedStyle(n).display!=='none'&&getComputedStyle(n).visibility!=='hidden';
 const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
 // Independently measure the unanimated layout box, then apply only the static
 // facing turn. Animated getBoundingClientRect includes breathe/dip/hop and can
 // change nearest-owner ties even while the scheduler and label remain still.
 // Use measured CSS dimensions/pivot/rotate, never the runtime placement result.
 const stableHead=(a,sprite)=>{
  if(!Number.isFinite(sprite.offsetWidth))return rect(sprite); // DOM-only fixtures
  const body=rect(a),style=getComputedStyle(sprite),width=body.width,height=body.height;
  const left=body.left+sprite.offsetLeft,top=body.top+sprite.offsetTop;
  const pivot=[parseFloat(style.getPropertyValue('--idle-pivot-x'))/100*width,parseFloat(style.getPropertyValue('--idle-pivot-y'))/100*height],angle=(parseFloat(style.rotate)||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const x=left+pivot[0],y=top+pivot[1],points=[[left,top],[left+width,top],[left+width,top+height],[left,top+height]].map(([a,b])=>[x+(a-x)*c-(b-y)*s,y+(a-x)*s+(b-y)*c]);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys);
  return {left:l,right:r,top:t,bottom:b,width:r-l,height:b-t};
 };
 const actors=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden);
 const used=new Set(),rows=actors.map(a=>{const name=a.querySelector('.hani-office-name'),status=a.querySelector('.hani-office-status'),dot=a.querySelector('.hani-office-status-dot'),sprite=a.querySelector('.hani-office-sprite'),head=stableHead(a,sprite),box=rect(name),shown=visible(name);return {id:a.dataset.person,mode:a.dataset.labelMode,partner:a.dataset.partner||null,greeting:a.dataset.greeting==='true',speaking:a.dataset.speaking==='true',visitor:a.dataset.visitor==='true',nameShown:shown,statusShown:visible(status),dotShown:visible(dot),text:a.officeName.textContent+a.officeCompact.textContent,short:a.querySelector('.hani-office-compact-line').textContent,expected:' · '+HaniBuildingScene.labels.short(status.dataset.full,used),actorHeight:a.getBoundingClientRect().height,full:status.dataset.full,title:name.title,name:a.officeName.textContent,box,head,font:parseFloat(getComputedStyle(name).fontSize),distance:Math.hypot((box.left+box.right)/2-(head.left+head.right)/2,(box.top+box.bottom)/2-head.top)}});
 for(const [i,a]of actors.entries())Object.assign(rows[i],{nameTextShown:visible(a.officeName),shortShown:visible(a.officeCompact),nameAria:a.querySelector('.hani-office-name').getAttribute?.('aria-label'),actorAria:a.getAttribute?.('aria-label'),statusTitle:a.querySelector('.hani-office-status').title});
 // Independent browser geometry: only a text pill with insufficient top space
 // may leave the head radius, beside/below its uniquely nearest sprite.
 const boxGap=(a,b)=>Math.hypot(Math.max(a.left-b.right,b.left-a.right,0),Math.max(a.top-b.bottom,b.top-a.bottom,0));
 const edgeNear=r=>{const b=r.box,h=r.head,pad=Math.max(1,h.height*.02),own=boxGap(b,h),beside=(b.right<=h.left||b.left>=h.right)&&b.top<h.bottom&&b.bottom>h.top,below=b.top>=h.bottom&&b.left<h.right&&b.right>h.left;
  return ['pill','name'].includes(r.mode)&&h.top-floor.top<b.height+pad+1&&(beside||below)&&own<=19.5+1e-7&&rows.every(q=>q.id===r.id||own+1e-7<boxGap(b,q.head));};
 const overlap=(a,b)=>a.left<b.right-.01&&a.right>b.left+.01&&a.top<b.bottom-.01&&a.bottom>b.top+.01;
 // Infer the exception from measured geometry, never from a mode/owner claim.
 // A body tag stays centred below its own face, wholly above its feet, and
 // cannot even touch another sprite. Other label/mascot checks still apply.
 const touches=(a,b)=>a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top;
 const ownBody=r=>r.mode==='name'&&overlap(r.box,r.head)&&r.box.top>r.head.top+r.head.height*.6&&r.box.bottom<=r.head.bottom&&Math.abs(r.box.left+r.box.right-r.head.left-r.head.right)<=.02&&rows.every(q=>q.id===r.id||!touches(r.box,q.head));
 for(const r of rows)r.ownBody=ownBody(r);
 const boxes=rows.filter(r=>r.nameShown),mascots=[...map.querySelectorAll('.hani-desk-mascots:not([hidden]) .hani-desk-mascot[data-ready="true"]')].filter(visible).map(rect);
 return {phone,floor:map.dataset.floor,rows,ratio:rows.length?rows.filter(r=>r.mode==='pill'&&r.nameShown).length/rows.length:1,readableRatio:rows.length?rows.filter(r=>['pill','name'].includes(r.mode)&&r.nameShown).length/rows.length:1,modes:Object.fromEntries(['pill','name','dot'].map(mode=>[mode,rows.filter(r=>r.mode===mode).length])),missing:rows.filter(r=>!r.nameShown).map(r=>r.id),ambiguous:boxes.filter(r=>r.mode==='name'&&rows.some(q=>{const other=boxGap(r.box,q.head),own=boxGap(r.box,r.head),toHead=h=>Math.hypot((r.box.left+r.box.right-h.left-h.right)/2,(r.box.top+r.box.bottom)/2-h.top);return q.id!==r.id&&(other<own-1e-7||other<=own+1e-7&&toHead(q.head)<=toHead(r.head)+1e-7)})).map(r=>r.id),distant:boxes.filter(r=>r.distance>(r.mode==='dot'||r.partner||r.greeting||r.speaking?27.5:19.5)+1e-7&&!edgeNear(r)&&!r.ownBody).map(r=>[r.id,r.distance]),overlap:boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>overlap(a.box,b.box)).map(b=>[a.id,b.id])),spriteOverlap:boxes.flatMap(a=>rows.filter(b=>overlap(a.box,b.head)&&!(a.id===b.id&&a.ownBody)).map(b=>[a.id,b.id])),mascotOverlap:boxes.filter(a=>mascots.some(b=>overlap(a.box,b))).map(r=>r.id),outside:boxes.filter(r=>r.box.left<floor.left||r.box.right>floor.right||r.box.top<floor.top||r.box.bottom>floor.bottom).map(r=>r.id),spritePairs:rows.flatMap((a,i)=>rows.slice(i+1).filter(b=>overlap(a.head,b.head)).map(b=>[a.id,b.id]))};
}
export function assertPhoneLabels(r){
 if(!r.phone){assert.ok(r.rows.every(p=>p.mode==='separate'&&p.short===''),'desktop keeps separate slots');return}
 assert.ok(r.ratio>=0&&r.ratio<=1,'phone ratio is measured; mandatory geometry stays exact');
 for(const key of ['missing','ambiguous','distant','overlap','spriteOverlap','mascotOverlap','outside'])assert.deepEqual(r[key],[],key);
 // Revalidate the measured exemption too: fabricated/stale flags cannot turn
 // face or neighbour overlap into a pass by clearing the summary arrays.
 for(const p of r.rows.filter(p=>p.ownBody)){
  const b=p.box,h=p.head;assert.equal(p.mode,'name');assert.ok(b.top>h.top+h.height*.6&&b.bottom<=h.bottom&&b.top<h.bottom&&b.bottom>h.top,'body tag below own face and within sprite height');
  assert.ok(b.left<h.right&&b.right>h.left&&Math.abs(b.left+b.right-h.left-h.right)<=.02,'body tag centred on own sprite');
  assert.ok(r.rows.every(q=>q.id===p.id||b.right<q.head.left||b.left>q.head.right||b.bottom<q.head.top||b.top>q.head.bottom),'body tag cannot touch any other sprite');
 }
 for(const p of r.rows.filter(p=>p.nameShown))for(const q of r.rows){
  const b=p.box,h=q.head,overlap=b.left<h.right-.01&&b.right>h.left+.01&&b.top<h.bottom-.01&&b.bottom>h.top+.01;
  if(overlap)assert.ok(p.id===q.id&&p.ownBody,'sprite overlap requires a verified own-body name tag');
 }
 for(const p of r.rows){assert.equal(p.statusShown,false,'one visible label per actor');assert.equal(p.dotShown,true);assert.equal(p.short,p.expected);assert.ok([...p.short.slice(3)].length>=2&&[...p.short.slice(3)].length<=6);assert.doesNotMatch(p.short.slice(3),/^(업무|조용|확인|이동|대기|검증|검토|수정|집필|분석|조율|정리|대화|휴식|인사|커피)$/);assert.ok([...p.text].length<=18);assert.ok(p.actorHeight>=39.99,'original minimum 40px sprite');assert.ok(p.title.includes(p.full));assert.ok(p.title.includes(p.name));assert.equal(p.nameAria,p.title);assert.ok(p.actorAria.includes(p.full));assert.equal(p.statusTitle,p.full);assert.ok(p.font>=10);assert.ok(p.text.includes(p.name));assert.doesNotMatch(p.short,/…|\.\.\./);assert.equal(p.nameTextShown,p.mode!=='dot');assert.equal(p.shortShown,p.mode==='pill');if(p.mode==='dot'){assert.ok(p.box.width<=5.01&&p.box.height<=5.01)}else{assert.ok(['pill','name'].includes(p.mode));assert.ok(p.box.height<=11);assert.ok(p.box.width>5)}if(p.partner||p.greeting||p.speaking)assert.equal(p.mode,'pill','conversation/greeting/speaker must remain a full pill');}
}
