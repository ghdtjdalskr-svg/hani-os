// Reproducible, read-only runtime projection of the approved catalog.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function runtimeTable(catalog){
  const fields=['id','layer','title','participants','participantSelector','places','conditions','durationSeconds','performance','actorOverrides','targetResolution','poseByPerson','routeByPerson','personalNonWork','frequencyFamilyId','releaseTarget','manualPreviewOnlyIn216'];
  const project=a=>Object.fromEntries(fields.filter(k=>k in a).map(k=>[k,a[k]]));
  return {
    schemaVersion:'office-actions-216-v1',sourceCommit:'8f08569',timezone:catalog.timezone,
    identity:{seongmin:{entity:'human_user',role:'chairman',officeVisual:'ceo_frog',spriteId:'seongmin',staffAddress:'회장님'}},
    rules:catalog.engineRules.ambientRules,
    people:catalog.people.filter(p=>p.status==='active').map(p=>({id:p.id,name:p.name,home:p.home,registration:p.registration})),
    actions:catalog.actions.filter(a=>a.releaseTarget==='216').map(a=>({...project(a),automaticReady:!a.manualPreviewOnlyIn216&&!a.conditions.triggerIds.length})),
    families:catalog.frequencyFamilies.filter(f=>f.memberActionIds.some(id=>catalog.releasePlan.release216.actionIds.includes(id))).map(f=>({id:f.id,sourceActionId:f.sourceActionId,limits:f.limits,memberActionIds:f.memberActionIds,durationCeilingSeconds:f.durationCeilingSeconds,parent:project(catalog.actions.find(a=>a.id===f.sourceActionId))})),
    disabled:catalog.actions.filter(a=>a.releaseTarget!=='216').map(a=>({id:a.id,automaticReady:false}))
  };
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const catalog=JSON.parse(fs.readFileSync(new URL('../docs/design/office-actions-v1.3.json',import.meta.url)));
  fs.mkdirSync(new URL('../assets/data/',import.meta.url),{recursive:true});
  fs.writeFileSync(new URL('../assets/data/office-actions-216.json',import.meta.url),JSON.stringify(runtimeTable(catalog))+'\n');
}
