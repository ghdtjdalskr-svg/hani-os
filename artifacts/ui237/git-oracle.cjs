// Environment adapter only: Node child_process is blocked by sandbox EPERM.
// The unchanged release tests receive exact historical Git blobs exported by PowerShell.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),{fileURLToPath}=require('node:url'),{syncBuiltinESMExports}=require('node:module');
const cache=JSON.parse(fs.readFileSync(__dirname+'/git-blobs.json','utf8'));
const requestFile=__dirname+'/git-requests.json';
const used=new Set(fs.existsSync(requestFile)?JSON.parse(fs.readFileSync(requestFile,'utf8')):[]);
const base='cefa62554e520c42acdc8310dd8f00f4dac0148a:';
for(const file of ['index.html','hani-main.js','hani-office-live.js','hani-office-live.css','hani-design-system.css','hani-development-history.css','hani-organization-hub.css','hani-asset-update-v1.js','hani-context-remote-v1.js','hani-context-remote.css','hani-study-v02984.js','hani-yuna-helpdesk.js','hani-investment-committee.js','hani-asset-market-view.js'])used.add(base+file);
process.on('exit',()=>fs.writeFileSync(requestFile,JSON.stringify([...used].sort(),null,2)+'\n'));
const native=cp.execFileSync;
if(process.env.UI237_BEFORE==='1'){
  const read=fs.readFileSync,root=path.resolve(__dirname,'../..');
  const owners=new Set(['hani-design-system.css','hani-main.js','hani-development-history.css','hani-organization-hub.css']);
  fs.readFileSync=function(file,options){
    const absolute=path.resolve(file instanceof URL?fileURLToPath(file):String(file));
    const relative=path.relative(root,absolute);
    if(owners.has(relative)){
      const bytes=Buffer.from(cache['cefa62554e520c42acdc8310dd8f00f4dac0148a:'+relative],'base64');
      const encoding=typeof options==='string'?options:options?.encoding;
      return encoding?bytes.toString(encoding):bytes;
    }
    return read.apply(this,arguments);
  };
}
cp.execFileSync=function(command,args,options){
  if(/(?:^|[/\\])git(?:\.exe)?$/.test(command)&&args.length===2&&args[0]==='show'){
    used.add(args[1]);
    if(!Object.hasOwn(cache,args[1]))throw Error('Missing exact Git oracle blob: '+args[1]);
    const bytes=Buffer.from(cache[args[1]],'base64');
    return options?.encoding?bytes.toString(options.encoding):bytes;
  }
  return native.apply(this,arguments);
};
syncBuiltinESMExports();
