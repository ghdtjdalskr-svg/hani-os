// Builds small profile thumbnails so avatars stay sharp when shown at 30-150px.
// Large sources (720px) downscaled 10-20x by the browser look jagged; pre-resizing with Lanczos fixes it.
// Usage: node scripts/hani-make-profile-thumbs.mjs [sourceDir] [outDir]
// sharp is resolved from HANI_SHARP_PATH, or from the Codex runtime node_modules.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const sharpPath=process.env.HANI_SHARP_PATH||path.join(os.homedir(),".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const sharp=require(sharpPath);

const sourceDir=process.argv[2]||"assets/profiles";
const outDir=process.argv[3]||path.join(sourceDir,"thumb");
const SIZES=[128,256];

fs.mkdirSync(outDir,{recursive:true});
const files=fs.readdirSync(sourceDir).filter(f=>/\.(webp|png|jpe?g)$/i.test(f)).sort();
for(const file of files){
  const base=file.replace(/\.[^.]+$/,"");
  for(const size of SIZES){
    const out=path.join(outDir,`${base}-${size}.webp`);
    await sharp(path.join(sourceDir,file))
      .resize(size,size,{fit:"cover",kernel:"lanczos3"})
      .sharpen({sigma:0.5})
      .webp({quality:90,effort:6})
      .toFile(out);
    console.log(`${out} ${fs.statSync(out).size}B`);
  }
}
