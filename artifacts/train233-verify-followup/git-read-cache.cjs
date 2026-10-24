// Exact native Git outputs only. No source replacement or assertion changes.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.env.HANI_VERIFY_CACHE;
// Generated evidence stays in the writable verification tree for BOTH targets.
// Runtime/fixture reads still use their original files; this never rewrites main.
if(root){
 const original={};for(const name of ['writeFileSync','mkdirSync','readFileSync','existsSync'])original[name]=fs[name].bind(fs);
 const cwd=process.cwd(),kind=path.basename(cwd)==='m233'?'main':'candidate';
 const output=path.resolve(root,'../test-output',kind);
 const taskRelative=path.relative(cwd,path.resolve(root,'..'));
 function map(value){if(typeof value!=='string'&&!(value instanceof URL))return null;const file=value instanceof URL?require('node:url').fileURLToPath(value):path.resolve(value);const rel=path.relative(cwd,file);return /^(?:artifacts|qa-evidence|\.ai-budget-private)[\\/]/.test(rel)&&!rel.startsWith(taskRelative+path.sep)&&!rel.startsWith('artifacts'+path.sep+'train233-verify'+path.sep)?path.join(output,rel):null;}
 fs.writeFileSync=function(file,...args){const mapped=map(file);if(mapped){original.mkdirSync(path.dirname(mapped),{recursive:true});return original.writeFileSync(mapped,...args);}return original.writeFileSync(file,...args);};
 fs.mkdirSync=function(file,...args){return original.mkdirSync(map(file)||file,...args);};
 fs.readFileSync=function(file,...args){const mapped=map(file);return original.readFileSync(mapped&&original.existsSync(mapped)?mapped:file,...args);};
 fs.existsSync=function(file){const mapped=map(file);return Boolean(mapped&&original.existsSync(mapped))||original.existsSync(file);};
 require('node:module').syncBuiltinESMExports();
}
if(process.env.HANI_VERIFY_NO_BROWSER!=='0'){
 const spawn=cp.spawn;cp.spawn=function(command,...args){if(/(?:msedge|chrome|chromium)(?:\.exe)?$/i.test(command)){const e=Error('HANI_BROWSER_QUOTA_EXHAUSTED: Browser execution forbidden by this task');e.code='HANI_BROWSER_QUOTA_EXHAUSTED';setTimeout(()=>process.exit(3),1000).unref();throw e;}return spawn.call(this,command,...args);};
 require('node:module').syncBuiltinESMExports();
}
if(root){const original=cp.execFileSync;cp.execFileSync=function(file,args=[],options={}){
 if(!/(?:^|[\\/])git(?:\.exe)?$/i.test(file)||!['show','rev-parse','diff','merge-base','cat-file','ls-tree','log'].includes(args[0]))return original.apply(this,arguments);
 const directory=options.cwd instanceof URL?require('node:url').fileURLToPath(options.cwd):options.cwd;
 const cwd=path.resolve(directory||process.cwd()),request={cwd,args};
 const key=crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex'),meta=path.join(root,key+'.json');
 if(!fs.existsSync(meta)){fs.writeFileSync(path.join(root,key+'.request.json'),JSON.stringify(request));const e=Error('Exact native Git export required: '+args.join(' '));e.code='HANI_GIT_EXPORT_REQUIRED';throw e;}
 const result=JSON.parse(fs.readFileSync(meta)),data=fs.readFileSync(path.join(root,key+'.bin'));
 if(result.status!==0){const e=Error('Native Git exit '+result.status+': '+args.join(' '));e.status=result.status;e.stdout=data;e.stderr=Buffer.from(result.stderr||'');throw e;}
 return options.encoding&&options.encoding!=='buffer'?data.toString(options.encoding):data;
};require('node:module').syncBuiltinESMExports();}
