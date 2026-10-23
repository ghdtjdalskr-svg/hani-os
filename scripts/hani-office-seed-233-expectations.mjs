// The 233 seed registers two desks before runtime rollout; all other canon bytes stay strict.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {readReleaseSource} from './hani-reviewed-release-baseline.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url));
export function expectedSeedCanon(original){
 const expected=structuredClone(original);
 for(const person of expected.people.filter(p=>['daon','yoonseul'].includes(p.id))){person.status='active';person.registration='registered';}
 for(const anchor of expected.anchors.filter(a=>['desk_daon','desk_yoonseul'].includes(a.id))){anchor.rendererSeat.owner=anchor.occupant;delete anchor.runtimeAssignable;}
 expected.staffPolicy.planned='미등록 planned 인물은 공간 preview/low-fi 수동 이동만 허용. 다온·윤슬은 2026-10-23 정식 등록되어 active로 참여.';
 return expected;
}
export function assertSeedCanon(){
 const original=readReleaseSource('65cd8a071d657741319b54c063d1ba8c5ab6aefb','data/hani-building/spatial-contract.json');
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'d02426b44c49db169efebd782e110226fd1d719d016bc5912516753f3df8841d');
 assert.equal(crypto.createHash('sha256').update(read('data/hani-building/spatial-contract.json')).digest('hex'),'ed221b2405b2f41641b96055fc26f88a3a8d1a97b2fd1d4b40bf7d2e94e96e50','exact reviewed seed bytes');
 assert.deepEqual(JSON.parse(read('data/hani-building/spatial-contract.json')),expectedSeedCanon(JSON.parse(original)),'only two registrations/owners and policy text may change; 326 anchors, coordinates, edges stay frozen');
}
export function assertSeedArt(){
 assert.equal(crypto.createHash('sha256').update(read('data/hani-building/art-map-v1.json')).digest('hex'),'910c96d135a92bc42ef1db05d9c9c8ad4461ffe88f3ffc860e538b5b9cfb0438','exact reviewed 233 corridor coordinates and onboarded desk labels');
}
