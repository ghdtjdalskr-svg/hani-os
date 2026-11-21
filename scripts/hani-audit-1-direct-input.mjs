// These two legacy tests import shared build tools rather than a test fixture.
// Opt in only for those direct test entries; builds and release gates keep disk input.
import path from 'node:path';
import {createRequire} from 'node:module';
if(['hani-lounge-billboard.test.mjs','hani-history-unify.test.mjs'].includes(path.basename(process.argv[1]||''))){
 createRequire(import.meta.url)('./hani-audit-1-preload.cjs');
}
