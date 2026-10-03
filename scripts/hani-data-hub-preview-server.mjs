import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),port=Number(process.argv[2]||7541);
const fixture=fs.readFileSync(path.join(root,'scripts/hani-data-hub-preview-fixture.js'),'utf8');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
  res.setHeader('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-src 'none'");
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');
  let content=fs.readFileSync(file);
  if(pathname==='/')content=content.toString().replace(/<script src="https:[^"]+"><\/script>/g,'').replace('</body>',`<script>${fixture}</script></body>`);
  res.end(content);
});
server.listen(port,'127.0.0.1',()=>console.log(`Synthetic Data Hub preview: http://127.0.0.1:${port}/ (Cloud blocked, no user profile)`));
