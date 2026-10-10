// Generate the approved read-only character source. No state or Cloud access.
import fs from "node:fs";
import {fileURLToPath} from "node:url";

export const seedPath=new URL("../data/hani-relationship-seed-v1.json",import.meta.url);
export const runtimePath=new URL("../hani-relationship-seed.js",import.meta.url);
export function renderSeed(seed){
  const ids=new Set(seed.people?.map(p=>p.id));
  if(!ids.size||ids.size!==seed.people.length)throw Error("Seed people must have unique ids");
  for(const r of seed.relations||[]){
    if(!ids.has(r.a)||!ids.has(r.b)||r.a===r.b||!Number.isFinite(r.score))throw Error("Invalid relation ids/score");
  }
  // Escape HTML delimiters and JS line separators so the artifact is safe to embed.
  const json=JSON.stringify(seed,null,2).replace(/[<>&\u2028\u2029]/g,c=>"\\u"+c.charCodeAt(0).toString(16).padStart(4,"0"));
  return "/* Generated from data/hani-relationship-seed-v1.json; run scripts/hani-relationship-seed-build.mjs. */\n"+
    "globalThis.HaniRelationshipSeed = Object.freeze("+json+");\n";
}
export function buildSeed(check=false){
  const expected=renderSeed(JSON.parse(fs.readFileSync(seedPath,"utf8")));
  if(check){
    if(!fs.existsSync(runtimePath)||fs.readFileSync(runtimePath,"utf8")!==expected)throw Error("Relationship runtime is stale; run the seed builder");
  }else fs.writeFileSync(runtimePath,expected,"utf8");
  return expected;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  buildSeed(process.argv.includes("--check"));
  console.log(process.argv.includes("--check")?"PASS: relationship seed runtime is current":"Built hani-relationship-seed.js");
}
