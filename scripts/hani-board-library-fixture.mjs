// Authored fixture is deliberately never included in the production library.
import fs from "node:fs";
import {validateLibrary} from "./hani-board-library-build.mjs";
export const seed=JSON.parse(fs.readFileSync(new URL("../data/hani-relationship-seed-v1.json",import.meta.url),"utf8"));
export const fixture=validateLibrary(JSON.parse(fs.readFileSync(new URL("./fixtures/hani-board-library.json",import.meta.url),"utf8")).threads,seed);
export const fixtureLibrary=(count=3)=>Array.from({length:count},(_,i)=>({...structuredClone(fixture[i%fixture.length]),id:"test-library-"+i}));
