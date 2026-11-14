// Preserve the unchanged 298 suite's manifest boundary beneath the exact 299 row.
const input=require('./hani-design-polish-2-main299-input.cjs');
const layers=require('./hani-release-version-layers.cjs'),assert=require('node:assert/strict');
const manifest=JSON.parse(input.readRawFileSync(require('node:path').join(__dirname,'fixtures/release-version-layers.json'),'utf8'));
const frozen=manifest.layers.map(row=>{const actual=layers.getLayer(row.to);assert.deepEqual(actual,row,'unchanged frozen298 release row');return actual});
module.exports={...layers,layers:frozen};
