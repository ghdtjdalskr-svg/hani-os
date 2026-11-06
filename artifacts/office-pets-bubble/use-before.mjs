import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const original=fs.readFileSync;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
fs.readFileSync=function(p,...args){const name=p instanceof URL?fileURLToPath(p):String(p);const full=path.resolve(name);return original.call(this,full===path.join(root,'hani-office-live.js')?path.join(root,'artifacts/office-pets-bubble/before-source.txt'):full===path.join(root,'hani-office-live.css')?path.join(root,'artifacts/office-pets-bubble/before-style.txt'):p,...args)};
