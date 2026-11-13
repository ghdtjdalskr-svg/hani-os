// Run after the suite. Restore only its known synthetic outputs to exact start bytes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const initial=JSON.parse(fs.readFileSync(path.join(__dirname,'start-hashes.json'),'utf8'));
const starts=JSON.parse(fs.readFileSync(path.join(__dirname,'output-start-bytes.json'),'utf8')),rows=[];
for(const [file,base64]of Object.entries(starts)){
 const source=path.resolve(root,file),target=path.resolve(__dirname,'generated',file);
 assert.ok(source.startsWith(root+path.sep)&&target.startsWith(__dirname+path.sep),'checked workspace paths');
 if(!fs.existsSync(source))continue;
 const bytes=fs.readFileSync(source);if(base64!==null&&hash(bytes)===hash(Buffer.from(base64,'base64')))continue;
 fs.mkdirSync(path.dirname(target),{recursive:true});
 if(base64===null){assert.equal(initial[file],undefined);fs.renameSync(source,target);rows.push({file,action:'moved new synthetic output into task evidence'});}
 else{
  const before=Buffer.from(base64,'base64');assert.equal(hash(before),initial[file],'provable starting output bytes');
  fs.writeFileSync(target,bytes);fs.writeFileSync(source,before);rows.push({file,action:'saved generated evidence and restored exact start bytes'});
 }
}
fs.writeFileSync(path.join(__dirname,'test-output-restoration.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows));
