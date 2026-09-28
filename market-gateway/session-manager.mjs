// Dedicated collector session; never touches browser authentication or asset writes.
export function createSessionManager({session,url,key,ownerId,persist,fetcher=fetch,now=Date.now}){
  let current={...session},pending=null,blocked=false;
  const call=(path,options={})=>fetcher(url+path,{...options,headers:{apikey:key,...options.headers},redirect:'error',signal:AbortSignal.timeout(12000)});
  async function verify(token){const r=await call('/auth/v1/user',{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('HANI login required');const u=await r.json();if(u.id!==ownerId||u.is_anonymous!==false)throw Error('Owner mismatch');}
  async function getToken(){
    if(blocked)throw Error('Session persistence failed; sign in again');
    if(current.userId!==ownerId||!current.access_token||!current.refresh_token)throw Error('Invalid session');
    if(current.expires_at*1000>now()+120000)return current.access_token;
    if(pending)return pending;
    pending=(async()=>{
      const previousRefreshToken=current.refresh_token;
      const r=await call('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:previousRefreshToken})});
      if(!r.ok)throw Error('HANI session refresh failed');const s=await r.json();
      if(!s.access_token||!s.refresh_token||!Number.isFinite(Number(s.expires_in))||Number(s.expires_in)<=120||s.user?.id!==ownerId)throw Error('Invalid refreshed session');
      await verify(s.access_token);
      const next={version:1,userId:ownerId,access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Math.floor(now()/1000)+Number(s.expires_in)};
      try{await persist(next,previousRefreshToken);}catch{blocked=true;throw Error('Session persistence failed; sign in again');}
      current=next;return current.access_token;
    })().finally(()=>{pending=null;});return pending;
  }
  return {getToken,verify:async()=>verify(await getToken())};
}
