// Read-only source snapshot, with evidence written only under this task folder.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),out=__dirname;
const hash=b=>createHash('sha256').update(b).digest('hex'),pins={};
function save(file,copy=false){const b=fs.readFileSync(path.join(root,file));pins[file]=hash(b);if(copy){const target=path.join(out,'start',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b)}}
for(const file of fs.readdirSync(root).filter(f=>/^(?:hani-.*\.(?:js|css)|index\.html)$/.test(f)))save(file);
for(const file of fs.readdirSync(path.join(root,'scripts')).filter(f=>/\.(?:mjs|cjs|js)$/.test(f)))save('scripts/'+file);
function fixtures(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const file=dir+'/'+e.name;if(e.isDirectory())fixtures(file);else save(file)}}
fixtures('scripts/fixtures');
for(const file of ['hani-design-system.css','scripts/fixtures/design-polish-2-delta.json','scripts/hani-design-polish-2-source.cjs','scripts/hani-design-polish-2.browser.mjs','scripts/hani-design-polish-2.test.mjs'])save(file,true);
for(const folder of ['browser','browser-design2b'])save('artifacts/design-polish-2/'+folder+'/browser-results.json');
fs.writeFileSync(path.join(out,'start-hashes.json'),JSON.stringify(pins,null,2)+'\n');
console.log(JSON.stringify({snapshotFiles:Object.keys(pins).length,base:'7a91982 (supplied; no Git)',browserLaunched:false}));
