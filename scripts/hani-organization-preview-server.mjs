import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.argv[2]||8791);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=path.resolve(root,'.'+pathname);
    if(!target.startsWith(root+path.sep)||pathname.split('/').some(x=>x.startsWith('.'))||!mime[path.extname(target)]){res.writeHead(403).end();return;}
    fs.readFile(target,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(target)],'Cache-Control':'no-store'}).end(data);});
  }catch{res.writeHead(400).end();}
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}/docs/organization-hub-preview.html`));
