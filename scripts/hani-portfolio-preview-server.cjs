'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowed=new Set(['portfolio-live-preview.html','hani-market-data.js','hani-portfolio-analytics.js','hani-portfolio-preview.js','hani-portfolio-preview.css']);
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://127.0.0.1').pathname.slice(1)||'portfolio-live-preview.html';if(!allowed.has(name)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(path.join(root,name)));});
server.listen(0,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+server.address().port+'/portfolio-live-preview.html'));
setTimeout(()=>server.close(),30*60*1000).unref();
