// The Git merge is delegated. A frozen design295 input already includes main295,
// while the uncommitted merge's HEAD/common ancestor still names the old branch.
// Select only the independently identified approved main295 baseline in that case.
import './hani-design-polish-1-preload.cjs';
import outer from './hani-design-polish-1-main295-source.cjs';
import frozen from './hani-design-polish-1-source.cjs';
import release296 from './hani-release-296-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {readBranchBaseline as readAncestorBaseline} from './hani-regression-baseline.mjs';
const current=release296.project(frozen.readRawFileSync(new URL('../hani-main.js',import.meta.url)),'hani-main.js');
const design295=outer.hash(current)===outer.delta.files['hani-main.js'].afterSha256;
export function readBranchBaseline(file){
 return design295?repository.read(outer.delta.base,file):readAncestorBaseline(file);
}
