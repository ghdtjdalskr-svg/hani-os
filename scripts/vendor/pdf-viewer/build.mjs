import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const license=fs.readFileSync(path.join(here,'node_modules/pdfjs-dist/LICENSE'),'utf8');
for(const [input,output,globalName] of [['pdf.mjs','hani-pdf-core.js','pdfjsLib'],['pdf.worker.mjs','hani-pdf-worker.js','pdfjsWorker']]){
  const result=await build({entryPoints:[path.join(here,'node_modules/pdfjs-dist/build',input)],outfile:path.join(root,'js',output),write:false,bundle:true,format:'iife',globalName,minify:true,target:'es2022',banner:{js:`/* PDF.js 6.4.299 | Mozilla Foundation | ${license} */`},define:{'import.meta.url':'""'}});
  let source=result.outputFiles[0].text;
  if(input==='pdf.mjs'){
    // HANI uses a same-origin worker only. Remove the unused CDN worker wrapper,
    // which also looks like a literal dependency to the existing closure gate.
    const wrapper=/await import\("\$\{[A-Za-z_$][\w$]*\}"\);/g;
    if([...source.matchAll(wrapper)].length!==1)throw Error('PDF.js CDN wrapper anchor changed');
    source=source.replace(wrapper,'throw new Error("Cross-origin PDF workers disabled");');
  }
  fs.mkdirSync(path.join(root,'js'),{recursive:true});fs.writeFileSync(path.join(root,'js',output),source);
}
console.log('Built pinned PDF.js core/worker; no CDN or additional runtime assets.');
