// Approved 216 changes: add current cache tags to these formerly unversioned
// assets and move styles to head. Existing URLs/versions remain asserted.
const newlyTagged=[
  ...[2,3,4,5,6].map(n=>`./hani-style-0${n}.css`),
  'https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.css',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2',
  './hani-ilbo.css','./hani-ilbo.js'
];
export function expected216Html(before){
  return newlyTagged.reduce((html,url)=>html.replaceAll(`"${url}"`,`"${url}?v=2.9.215"`),before);
}
export function cacheRefs(html){
  return [...html.matchAll(/(?:src|href)="([^"?]+)(\?v=[^"]+)?"/g)]
    .filter(m=>m[2]).map(m=>m[1]+m[2]).sort();
}
