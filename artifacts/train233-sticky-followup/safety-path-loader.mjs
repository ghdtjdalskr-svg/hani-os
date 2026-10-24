// Supply the actual diff for this patch and keep earlier evidence files intact.
// No application source, assertion or expected data is replaced.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=path.join(root,'artifacts/train233-sticky-followup');
const read=fs.readFileSync,write=fs.writeFileSync;
fs.readFileSync=function(file,...args){return read.call(this,path.resolve(String(file))===path.join(root,'artifacts/qa-1st/eol-map.diff')?path.join(out,'eol-map.diff'):file,...args)};
fs.writeFileSync=function(file,...args){return write.call(this,path.resolve(String(file))===path.join(root,'artifacts/qa-1st/safety-results.json')?path.join(out,'safety-results.json'):file,...args)};
