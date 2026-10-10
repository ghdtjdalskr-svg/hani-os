// Inspect isolated runtime exports. These fixtures are not production evidence.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const runtime=process.env.HANI_RUNTIME_MODULES;
const skill=process.env.HANI_PRESENTATION_SKILL;
if(!runtime||!skill)throw Error('Presentation runtime and skill paths required');
process.env.RUNTIME_NODE_MODULES=runtime;
const {FileBlob,PresentationFile}=await import(pathToFileURL(path.join(runtime,'@oai/artifact-tool/dist/artifact_tool.mjs')));
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const name=process.argv[2]||'desktop-earnings';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid fixture name');
const candidate=path.join(root,`artifacts/monthly-report/${name}.pptx`);
const slideXml=(await fs.readFile(candidate)).toString('utf8').match(/<p:sld xmlns:[\s\S]*?<\/p:sld>/g)||[];
const tableOwners=slideXml.flatMap((xml,i)=>xml.includes('<a:tbl>')?[i+1]:[]);
if(tableOwners.length!==2)throw Error('Editable table pagination mismatch');
if(!name.includes('annual')){
  const presenters=['하니','하니','지은','나은','히나','하루','민지','하니','하니','하니'];
  presenters.forEach((presenter,i)=>{if(!slideXml[i]?.includes(`${String(i+1).padStart(2,'0')} · ${presenter} ·`))throw Error(`Presenter order mismatch at ${i+1}`)});
}
if(name.includes('mock-ai')&&!slideXml.some(xml=>xml.includes('모의 AI 답변입니다.')))throw Error('Mock AI answer missing from exported deck');
const output=path.join(root,`artifacts/monthly-report/ppt-verified-${name}`);
await fs.mkdir(output,{recursive:true});
const final=path.join(output,`inspection-${Date.now()}.pptx`);
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:final,pythonExecutable:process.env.HANI_RUNTIME_PYTHON,integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','11430000,6429375','--validate-heading-fit',...tableOwners.flatMap(n=>['--require-native-table-slide',String(n)])],requiredNativeTableOwnerSlides:tableOwners,fontPolicy:{basis:'design',families:['Malgun Gothic']},verifyArtifactToolImport:true,receiptPath:path.join(root,`artifacts/monthly-report/ppt-validation-${name}-${Date.now()}.json`)});
const deck=await PresentationFile.importPptx(await FileBlob.load(final));
for(const [i,slide] of deck.slides.items.entries()){
  const preview=await deck.export({slide,format:'png',scale:1});
  await fs.writeFile(path.join(output,`slide-${i+1}.png`),new Uint8Array(await preview.arrayBuffer()));
}
console.log(JSON.stringify({fixture:name,slides:deck.slides.items.length,output}));
