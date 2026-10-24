import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
let browser;
const result={attempts:1,head:'5a665a3',kind:'Edge launch availability only'};
try {
  const {chromium}=await import(pathToFileURL(process.argv[2]));
  browser=await chromium.launch({executablePath:process.argv[3],headless:true,timeout:10000});
  result.status='AVAILABLE';
} catch(e) {
  result.status=/EPERM|EACCES/.test(e.message)?'BLOCKED':'ERROR';result.reason=e.message;
} finally {
  await browser?.close();
  fs.writeFileSync(new URL('edge-availability.json',import.meta.url),JSON.stringify(result,null,2));
  console.log(result.status,result.reason?.split('\n')[0]||'');
}
