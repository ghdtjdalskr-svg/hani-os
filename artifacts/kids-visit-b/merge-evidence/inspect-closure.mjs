import fs from 'node:fs';
import {resolveRuntimeClosure} from '../../../scripts/hani-runtime-closure.mjs';
import {projectLifeSource,readRawLifeFile} from '../../../scripts/hani-life-bundle-source.mjs';
const a=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>readRawLifeFile(f)});
const b=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>['index.html','hani-main.js'].includes(f)?projectLifeSource(readRawLifeFile(f,'utf8'),f,'study-retry'):readRawLifeFile(f)});
console.log({raw:a.files.length,life:b.files.length,launch:b.files.filter(f=>/launch/.test(f)),lifeExtra:a.files.filter(f=>!b.files.includes(f))});
