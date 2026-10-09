// Loads the app from a local static server and checks small avatars use the 256px thumbnails.
// Usage: node scripts/hani-profile-thumbs-ui.test.cjs <playwright index path> <browser exe>
const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require(process.argv[2]||"playwright");
const root=path.resolve(__dirname,"..");
const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".json":"application/json"};

const server=http.createServer((req,res)=>{
  const p=path.join(root,decodeURIComponent(new URL(req.url,"http://x").pathname).replace(/^\/+/,"")||"index.html");
  fs.readFile(fs.existsSync(p)&&fs.statSync(p).isDirectory()?path.join(p,"index.html"):p,(err,buf)=>{
    if(err){res.writeHead(404);return res.end()}
    res.writeHead(200,{"content-type":types[path.extname(p)]||"application/octet-stream"});res.end(buf);
  });
});

(async()=>{
  await new Promise(r=>server.listen(0,r));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({executablePath:process.argv[3]});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const missing=[];
  page.on("response",r=>{if(r.url().startsWith(base)&&r.status()===404)missing.push(r.url())});
  await page.goto(base,{waitUntil:"load"});await page.waitForTimeout(1500);

  const result=await page.evaluate(()=>{
    const thumbs=Object.values(sidebarAgentImages);
    const banner=document.getElementById("aiAvatar");
    return {
      thumbs,
      banner:banner?getComputedStyle(banner).backgroundImage:"",
      originalsIntact:Object.values(canonicalProfileImages).every(v=>/^\.\/assets\/profiles\/hani-profile-[a-z]+\.webp$/.test(v)),
      loginPhoto:(document.querySelector(".login-character-photo")?.style.backgroundImage)||""
    };
  });
  assert.ok(result.thumbs.length>=9&&result.thumbs.every(v=>/\/thumb\/hani-profile-[a-z]+-256\.webp$/.test(v)),"every small-avatar entry points at a 256px thumbnail");
  assert.ok(result.originalsIntact,"canonical 720px originals unchanged");
  if(result.banner&&result.banner!=="none")assert.match(result.banner,/thumb\/hani-profile-[a-z]+-256\.webp/,"AI banner avatar uses a thumbnail");
  if(result.loginPhoto)assert.doesNotMatch(result.loginPhoto,/thumb\//,"large login photo keeps the original");

  const statuses=await page.evaluate(async list=>Promise.all(list.map(u=>fetch(u).then(r=>r.status))),[...new Set(result.thumbs)]);
  assert.ok(statuses.every(s=>s===200),`all thumbnails load: ${statuses}`);
  assert.deepEqual(missing.filter(u=>/profiles\//.test(u)),[],"no profile 404s during load");

  await browser.close();server.close();
  console.log(JSON.stringify({banner:result.banner.split("/").pop(),thumbs:result.thumbs.length,loginPhoto:result.loginPhoto.split("/").pop()}));
  console.log("HANI Profile Thumbs UI: PASS");
})().catch(e=>{console.error(e);server.close();process.exit(1)});
