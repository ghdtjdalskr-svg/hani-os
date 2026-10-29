import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {readAt} from './hani-office-lively-fixture.mjs';
export function expectedOnboardedCanon(original){
 const expected=structuredClone(original);
 for(const person of expected.people.filter(p=>['daon','yoonseul'].includes(p.id))){person.status='active';person.registration='registered';}
 for(const anchor of expected.anchors.filter(a=>['desk_daon','desk_yoonseul'].includes(a.id))){anchor.rendererSeat.owner=anchor.occupant;delete anchor.runtimeAssignable;}
 expected.staffPolicy.planned='미등록 planned 인물은 공간 preview/low-fi 수동 이동만 허용. 다온·윤슬은 2026-10-23 정식 등록되어 active로 참여.';
 return expected;
}
export function assertOnboardedCanon(){
 const original=readAt('data/hani-building/spatial-contract.json','65cd8a071d657741319b54c063d1ba8c5ab6aefb');
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'d02426b44c49db169efebd782e110226fd1d719d016bc5912516753f3df8841d');
 const actual=JSON.parse(fs.readFileSync(new URL('../data/hani-building/spatial-contract.json',import.meta.url)));
 assert.deepEqual(actual,expectedOnboardedCanon(JSON.parse(original)),'only the explicit onboarding delta is allowed; all 326 anchors, coordinates, edges and other contract fields stay frozen');
 assert.equal(actual.anchors.length,326);
}
