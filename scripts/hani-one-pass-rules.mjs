import { createHash } from "node:crypto";
import vm from "node:vm";
import { collectReferences } from "./hani-runtime-closure.mjs";

export const sha256 = value => createHash("sha256").update(value).digest("hex");
export const canonicalPackageHash = files => {
  const entries = files.map(file => {
    const bytes = file.encoding === "base64" ? Buffer.from(file.content, "base64") : Buffer.from(String(file.content), "utf8");
    return { path: file.path, bytes: bytes.length, sha256: sha256(bytes) };
  }).sort((a, b) => a.path.localeCompare(b.path));
  return { entries, package_sha256: sha256(entries.map(e => `${e.path}\t${e.bytes}\t${e.sha256}`).join("\n")), total_bytes: entries.reduce((n,e)=>n+e.bytes,0) };
};
export const contractHash = contract => sha256(JSON.stringify(contract));
export function versionSnapshot(text) {
  const first = rx => (text.match(rx)||[])[1]||"";
  return { title:first(/<title>[^<]*?v(\d+\.\d+\.\d+)/i), login:first(/login-brand[\s\S]{0,700}?Life Edition v(\d+\.\d+\.\d+)/i), sidebar:first(/brand-copy[\s\S]{0,500}?Life Edition v(\d+\.\d+\.\d+)/i), sideFoot:first(/class="foot"[\s\S]{0,120}?v(\d+\.\d+\.\d+)/i), mainFooter:first(/class="footer"[^<]*?Life Edition v(\d+\.\d+\.\d+)/i), displayConst:first(/HANI_DISPLAY_VERSION\s*=\s*["'](\d+\.\d+\.\d+)/) };
}
export function semverGreater(a,b){const x=String(a).split(".").map(Number),y=String(b).split(".").map(Number);if(x.length!==3||y.length!==3||[...x,...y].some(Number.isNaN))return false;for(let i=0;i<3;i++){if(x[i]>y[i])return true;if(x[i]<y[i])return false;}return false;}
export function duplicateIds(html){const counts=new Map();for(const m of html.matchAll(/\bid=["']([^"']+)["']/g))counts.set(m[1],(counts.get(m[1])||0)+1);return [...counts].filter(([,n])=>n>1).map(([id])=>id).sort();}
export function protectedSurface(text, contract){const count=rx=>[...text.matchAll(rx)].length;return {storage_key:(text.match(/const\s+STORAGE_KEY\s*=\s*["']([^"']+)/)||[])[1]||"",internal_version:(text.match(/const\s+VERSION\s*=\s*["']([^"']+)/)||[])[1]||"",storage_writes:count(/localStorage\.setItem\(STORAGE_KEY/g),storage_removes:count(/localStorage\.removeItem\(STORAGE_KEY/g),storage_clears:count(/localStorage\.clear\s*\(/g),cloud_writes:count(/\.from\(["']hani_state["']\)[\s\S]{0,160}?\.(?:insert|update|delete|upsert)\s*\(/g),required_storage_key:contract.required_storage_key,required_internal_version:contract.required_internal_version};}
export function evaluatePackage({pkg,baseFiles,productionVersion,contract,baselineOnly=false}){
  const checks=[];const add=(id,ok,detail,manual=false)=>checks.push({id,status:manual?"MANUAL":ok?"PASS":"BLOCKED",detail});
  const paths=pkg.files.map(f=>f.path), allowed=contract.allowed_paths.map(x=>new RegExp(x,"i"));
  const hash=canonicalPackageHash(pkg.files), map=new Map(pkg.files.map(f=>[f.path,f.encoding==="base64"?Buffer.from(f.content,"base64").toString("utf8"):String(f.content)]));
  add("candidate_freeze",/^[0-9a-f]{40}$/.test(pkg.candidate_sha)&&/^[0-9a-f]{40}$/.test(pkg.base_main_sha)&&pkg.candidate_sha!==pkg.base_main_sha,"candidate/base SHA are frozen and distinct");
  add("package_integrity",hash.package_sha256===pkg.package_sha256,"canonical Package SHA matches frozen manifest");
  add("release_paths",paths.length>0&&paths.length<=contract.limits.max_files&&new Set(paths).size===paths.length&&paths.every(p=>allowed.some(rx=>rx.test(p))),"path allowlist, uniqueness and file limit");
  add("package_size",hash.total_bytes<=contract.limits.max_total_bytes&&hash.entries.every(e=>e.bytes<=contract.limits.max_single_file_bytes),`${hash.entries.length} files / ${hash.total_bytes} bytes`);
  const html=map.get("index.html")||"", runtime=[...map.entries()].filter(([p])=>/\.(?:html|js|css)$/i.test(p)).map(([,v])=>v).join("\n");
  const missing=[];for(const [p,source] of map)for(const ref of collectReferences(p,Buffer.from(source)))if(!map.has(ref))missing.push(`${ref} <- ${p}`);add("runtime_closure",map.has("index.html")&&missing.length===0,missing.length?missing.join(", "):"self-contained recursive runtime closure");
  let syntax=true;for(const [p,source] of map)if(/\.js$/i.test(p))try{new vm.Script(source,{filename:p});}catch{syntax=false;}add("js_syntax",syntax,"all packaged JavaScript parses");
  add("tag_balance",(html.match(/<script\b/gi)||[]).length===(html.match(/<\/script>/gi)||[]).length&&(html.match(/<style\b/gi)||[]).length===(html.match(/<\/style>/gi)||[]).length,"script/style tags balanced");
  const versions=versionSnapshot(runtime), vals=Object.values(versions);const candidate=versions.displayConst;
  add("display_version",candidate&&vals.every(v=>v===candidate),JSON.stringify(versions));
  add("version_forward",baselineOnly?candidate===productionVersion:semverGreater(candidate,productionVersion),baselineOnly?`production baseline v${productionVersion}`:`candidate v${candidate} > production v${productionVersion}`);
  const audit=[...runtime.matchAll(/\bui_version\s*:\s*["'](\d+\.\d+\.\d+)["']/g)].map(m=>m[1]);add("runtime_audit_version",audit.every(v=>v===candidate),audit.length?`audit literals: ${[...new Set(audit)].join(", ")}`:"runtime uses HANI_DISPLAY_VERSION dynamically");
  add("protected_invariants",runtime.includes(contract.required_storage_key)&&runtime.includes(contract.required_internal_version),"protected key and internal version present");
  const current=protectedSurface(runtime,contract),base=protectedSurface(baseFiles,contract);add("protected_write_surface",JSON.stringify(current)===JSON.stringify(base),"protected local/cloud write surface unchanged");
  const baseDup=new Set(duplicateIds(baseFiles)),newDup=duplicateIds(html).filter(x=>!baseDup.has(x));add("duplicate_dom",newDup.length===0,newDup.length?newDup.join(", "):"no new duplicate DOM IDs");
  add("secret_scan",contract.secret_patterns.every(x=>!new RegExp(x).test(runtime)),"no blocked secret pattern");
  add("ui_anchors",contract.required_ui_anchors.every(id=>new RegExp(`id=["']${id}["']`).test(html)),"core UI anchors present");
  add("pc_mobile_smoke",false,"browser interaction remains representative manual Preview",true);
  return {checks,ok:checks.every(c=>c.status!=="BLOCKED"),hash,candidate_version:candidate};
}
