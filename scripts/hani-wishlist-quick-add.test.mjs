import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {readLifeSource,restoreLifeLayer} from './hani-life-bundle-source.mjs';

const read=file=>readLifeSource(file,'wishlist');
const main=read('hani-main.js'),html=read('index.html');
const helper=main.slice(main.indexOf('// Wishlist quick-add:'),main.indexOf('// End wishlist quick-add.')+'// End wishlist quick-add.'.length);
const line=prefix=>main.split(/\r?\n/).find(row=>row.startsWith(prefix));
const nodes=()=>Object.fromEntries(['wishlistQuickLink','wishlistQuickLinkStatus','wishlistName','wishlistCategory','wishlistNote','wishlistPrice','wishlistReason','wishlistEditId','wishlistKind','wishlistPriority','wishlistStatus','wishlistSourceType','wishlistPurchasedDate','wishlistSave'].map(id=>[id,{value:'',textContent:''}]));
function setup(){
  const fields=nodes(),calls={commit:0,save:0,fetch:0,writes:0,alerts:0},state={wishlistItems:[]};
  const context=vm.createContext({URL,$:id=>fields[id],state,uid:()=> 'synthetic-wish',normalizeWishItem:row=>row,openModal:()=>{},closeModal:()=>{},alert:()=>calls.alerts++,saveEntry:(_button,handler)=>handler,commit:()=>{calls.commit++;calls.save++},fetch:()=>{calls.fetch++;throw Error('fetch forbidden')},localStorage:{setItem(){calls.writes++},removeItem(){calls.writes++},clear(){calls.writes++}}});
  vm.runInContext(helper+'\n'+line('function resetWishlistForm()')+'\n'+line('function openWishlistModal(')+'\n'+line('if($("wishlistQuickLink"))')+'\n'+line('if($("wishlistSave"))'),context);
  return {fields,calls,state,context,infer:raw=>context.inferWishlistLink(raw)};
}
test('domain table matches real host boundaries and conservative categories',()=>{
  const {infer}=setup();
  for(const [host,name] of [['www.coupang.com','쿠팡'],['link.coupang.com','쿠팡'],['coupa.ng','쿠팡'],['smartstore.naver.com','네이버 스마트스토어'],['brand.naver.com','네이버 스마트스토어'],['www.11st.co.kr','11번가'],['item.gmarket.co.kr','G마켓'],['www.musinsa.com','무신사'],['ohou.se','오늘의집'],['www.29cm.co.kr','29CM'],['www.oliveyoung.co.kr','올리브영'],['www.apple.com','애플'],['www.amazon.com','아마존'],['www.amazon.co.jp','아마존']])assert.equal(infer('https://'+host+'/products/12345').shop,name,host);
  assert.equal(infer('https://coupang.com.evil.example/products/123').shop,'');
  assert.equal(infer('https://notapple.com/shop/products/123').category,'');
  assert.equal(infer('https://apple.com/newsroom/').category,'');
  assert.equal(infer('https://apple.com/kr/shop/product/123/phone-case').category,'전자기기');
  assert.equal(infer('https://ohou.se/productions/123').category,'생활');
  assert.equal(infer('https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A12345').category,'뷰티');
  assert.equal(infer('https://www.musinsa.com/products/123').category,'');
});
test('only explicit product names and slugs become editable candidates',()=>{
  const {infer}=setup();
  assert.equal(infer('https://example.com/products/%EC%9B%90%EB%AA%A9-%EC%B1%85%EC%83%81').name,'원목 책상');
  assert.equal(infer('https://example.com/product/soft-cotton-shirt.html').name,'soft cotton shirt');
  assert.equal(infer('https://example.com/detail?productName=Blue+Cotton+Shirt').name,'Blue Cotton Shirt');
  assert.equal(infer('https://amazon.com/Kindle-Paperwhite/dp/B0ABCDEFG1').name,'Kindle Paperwhite');
  assert.equal(infer('https://apple.com/kr/shop/product/123/blue-phone-case').name,'blue phone case');
  for(const link of ['https://coupang.com/vp/products/12345','https://smartstore.naver.com/myshop/products/123','https://example.com/products/AB12CD34','https://example.com/products/a12345','https://example.com/products/detail','https://example.com/search?q=coat','https://example.com/account/settings','https://amazon.com/dp/B0ABCDEFG1','https://example.com/products/%E0%A4%A'])assert.equal(infer(link).name,'',link);
});
test('tracking cleanup preserves product, variant, repeated parameters and fragment',()=>{
  const {infer}=setup();
  const result=infer(' https://www.coupang.com/vp/products/123?itemId=45&vendorItemId=67&utm_source=chat&UTM_medium=test&fbclid=abc&gclid=x&tag=affiliate&size=L&size=M#details ');
  assert.equal(result.url,'https://www.coupang.com/vp/products/123?itemId=45&vendorItemId=67&size=L&size=M#details');
  assert.equal(infer(result.url).url,result.url);
});
test('malformed, credentialed and executable links do nothing safely',()=>{
  const x=setup();
  for(const input of ['',null,undefined,42,'not a URL','javascript:alert(1)','data:text/html,test','file:///tmp/item','https://','https://user:pass@example.com/products/shirt','https://example.com\n/products/shirt'])assert.equal(x.infer(input),null);
  x.fields.wishlistQuickLink.value='javascript:alert(1)';x.fields.wishlistQuickLink.oninput();
  assert.equal(x.fields.wishlistName.value,'');assert.equal(x.fields.wishlistNote.value,'');assert.equal(x.calls.commit,0);
});
test('input fills only blank existing fields, never price or existing drafts, no save/network/key',()=>{
  const x=setup();x.context.openWishlistModal();
  x.fields.wishlistQuickLink.value='https://www.oliveyoung.co.kr/product/soft-hand-cream?utm_source=share';
  x.fields.wishlistQuickLink.oninput();
  assert.equal(x.fields.wishlistName.value,'soft hand cream');assert.equal(x.fields.wishlistCategory.value,'뷰티');
  assert.equal(x.fields.wishlistNote.value,'올리브영\nhttps://www.oliveyoung.co.kr/product/soft-hand-cream');
  assert.equal(x.fields.wishlistPrice.value,'');assert.equal(x.fields.wishlistReason.value,'');
  const original=Object.fromEntries(Object.entries(x.fields).filter(([id])=>!id.startsWith('wishlistQuick')).map(([id,node])=>[id,node.value]));
  x.fields.wishlistQuickLink.value='https://apple.com/shop/product/123/phone-case';x.fields.wishlistQuickLink.oninput();
  for(const [id,value] of Object.entries(original))assert.equal(x.fields[id].value,value,id);
  assert.deepEqual(x.calls,{commit:0,save:0,fetch:0,writes:0,alerts:0});assert.equal(x.state.wishlistItems.length,0);
});
test('actual unchanged save owner validates and saves exactly once only on click; edit remains canonical',()=>{
  const x=setup();x.context.openWishlistModal();x.fields.wishlistSave.onclick();assert.equal(x.calls.alerts,1);assert.equal(x.calls.save,0);
  x.fields.wishlistQuickLink.value='https://example.com/products/blue-shirt?utm_source=share';x.fields.wishlistQuickLink.oninput();
  x.fields.wishlistName.value='내가 고친 이름';x.fields.wishlistPrice.value='12300';
  assert.equal(x.calls.save,0);x.fields.wishlistSave.onclick();
  assert.equal(x.calls.commit,1);assert.equal(x.calls.save,1);assert.equal(x.state.wishlistItems.length,1);
  assert.equal(x.state.wishlistItems[0].name,'내가 고친 이름');assert.equal(x.state.wishlistItems[0].price,'12300');assert.equal(x.state.wishlistItems[0].note,'https://example.com/products/blue-shirt');
  x.context.openWishlistModal(x.state.wishlistItems[0]);assert.equal(x.fields.wishlistQuickLink.value,'');
  x.fields.wishlistQuickLink.value='https://apple.com/shop/product/123/new-phone-case';x.fields.wishlistQuickLink.oninput();
  assert.equal(x.fields.wishlistName.value,'내가 고친 이름');assert.equal(x.fields.wishlistNote.value,'https://example.com/products/blue-shirt');
  x.fields.wishlistSave.onclick();assert.equal(x.calls.save,2);assert.equal(x.state.wishlistItems.length,1);
});
test('exact inverse preserves all original runtime bytes and save contract; no new network/storage APIs',()=>{
  new vm.Script(main);
  assert.doesNotMatch(helper,/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|clipboard|saveEntry|commit|supabase)\s*[.(]/);
  const inverse=main.replace(helper+'\r\n','').replace('resetWishlistForm();resetWishlistQuickAdd();','resetWishlistForm();').replace('if($("wishlistQuickLink"))$("wishlistQuickLink").oninput=previewWishlistLink;\r\n','');
  assert.equal(inverse,restoreLifeLayer(main,'hani-main.js','wishlist'),'own inverse exactly restores the procrastination layer');
  assert.equal(createHash('sha256').update(inverse).digest('hex'),'9415917255e3f7ba637cb08f8c2457c0d5c3017c2466a4e81ce8fac1b8c32e8c');
  const ui=html.match(/<div class="field" style="margin:0 0 16px"><label for="wishlistQuickLink">[\s\S]*?<\/small><\/div>/)?.[0];
  assert.ok(ui);assert.match(ui,/min-height:52px;font-size:16px/);assert.match(ui,/role="status" aria-live="polite"/);
  assert.equal(html.replace(ui,''),restoreLifeLayer(html,'index.html','wishlist'),'own markup inverse retains the prior menu and view');
  assert.equal(createHash('sha256').update(html.replace(ui,'')).digest('hex'),'fe35f0ba5c55722fed0649d3ab3088361c618ccd0ad82be0ba1e6dc1b7484952');
});
