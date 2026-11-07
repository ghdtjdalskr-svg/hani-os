import assert from 'node:assert/strict';
export function legacyOfficeNodes(nodes){const companions=nodes.filter(a=>a.dataset.companion==='true');if(companions.length)assert.deepEqual(companions.map(a=>a.dataset.person).sort(),['companion-chick','companion-fox','companion-frog','companion-otter','companion-penguin','kid-suhyeon','kid-suyeon']);return nodes.filter(a=>a.dataset.companion!=='true')}
