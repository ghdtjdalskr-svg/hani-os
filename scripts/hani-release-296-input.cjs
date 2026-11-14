// Frozen296 manifest view; canonical dispatch still traverses all newer releases.
const layers=require('./hani-release-version-layers.cjs');
module.exports={...layers,layers:layers.layers.filter(r=>Number(r.to.split('.')[2])<=296)};
