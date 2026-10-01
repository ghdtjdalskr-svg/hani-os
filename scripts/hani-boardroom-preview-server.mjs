import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".webp":"image/webp", ".png":"image/png", ".svg":"image/svg+xml" };
http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const target=path.resolve(root,"."+pathname);
  if(!target.startsWith(root+path.sep)||pathname.split("/").some(segment=>segment.startsWith("."))||!mime[path.extname(target)]){res.writeHead(403).end();return}
  fs.readFile(target,(error,data)=>{if(error){res.writeHead(404).end();return}res.writeHead(200,{"Content-Type":mime[path.extname(target)]||"application/octet-stream"}).end(data)});
}).listen(8775,"127.0.0.1",()=>console.log("Boardroom preview on http://127.0.0.1:8775/docs/boardroom-live-meeting-preview.html"));
