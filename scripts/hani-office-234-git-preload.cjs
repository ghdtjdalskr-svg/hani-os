// Read-only substitute solely for `git show ref:path` when Node child spawn is
// denied. PowerShell exports Git bytes + object IDs first; verify every blob.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const dir=path.resolve(__dirname,'../artifacts/office-behavior/obr13-git'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8').replace(/^\uFEFF/,'')),original=cp.execFileSync;
cp.execFileSync=function(command,args,options){
 if(/(?:^|[\\/])git(?:\.exe)?$/i.test(command)&&args?.[0]==='show'&&args.length===2){
  const row=manifest.find(r=>r.key===args[1]);if(!row)throw Error('unexported fixed Git object '+args[1]);
  const bytes=fs.readFileSync(path.join(dir,row.path)),hash=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  if(hash!==row.object)throw Error('Git blob identity mismatch '+row.key);
  return options?.encoding?bytes.toString(options.encoding):bytes;
 }
 return original.call(this,command,args,options);
};
