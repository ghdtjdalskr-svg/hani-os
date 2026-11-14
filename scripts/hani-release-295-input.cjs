// Frozen295 manifest view; the canonical dispatcher still traverses every outer layer.
const layers=require('./hani-release-version-layers.cjs');
module.exports={...layers,layers:layers.layers.filter(r=>Number(r.to.split('.')[2])<=295)};
