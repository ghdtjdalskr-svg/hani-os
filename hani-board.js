/* HANI GROUP BOARD Phase 1. Existing save/Cloud paths own persistence. */
(() => {
  "use strict";
  const categories=["WORK","LIFE","MEMORY","LOUNGE"];
  const root=document.getElementById("board");
  const get=key=>root?.querySelector('[data-board="'+key+'"]');
  const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const roster=()=>window.HaniOrganizationRoster;
  const actor=()=>roster()?.chairman?.id;
  let selected="",filter="ALL",editing=null,pending=null;
  const status=message=>{if(get("status"))get("status").textContent=message};
  const own=row=>!!actor()&&row?.authorId===actor();
  function author(id){
    const directory=roster();
    if(!directory)return String(id||"알 수 없는 작성자");
    const person=id===directory.chairman.id?directory.chairman:directory.people.find(p=>p.id===id);
    if(!person)return "알 수 없는 작성자 · "+String(id||"");
    const team=directory.teams.find(t=>t.id===person.team);
    return [person.name,person.rank,team?.name||person.team].filter(Boolean).join(" · ");
  }
  function persist(posts,comments){
    if(loadRecovery.active){status("원본 보호 중에는 게시판을 저장할 수 없습니다.");return false}
    const before=state;
    state={...state,boardPosts:posts,boardComments:comments,meta:{...(state.meta||{})}};
    let result;
    try{result=save()}catch(error){result={ok:false,message:error?.message}}
    if(!result?.ok){
      state=before;render();
      status(result?.message||"저장하지 못했습니다. 기존 기록을 유지합니다.");
      return false;
    }
    render();status("게시판 기록을 저장했습니다.");return true;
  }
  // These are the handlers bound below, not alternate test-only mutations.
  function savePost(input,id=""){
    if(!actor())return false;
    const title=String(input.title||"").trim(),body=String(input.body||"").trim();
    if(!title||!body||title.length>200||body.length>20000||!categories.includes(input.category)){
      status("제목(200자 이내), 내용(20,000자 이내), 분류를 확인해 주세요.");return false;
    }
    const old=id?state.boardPosts.find(p=>p.id===id):null;
    if(id&&!own(old))return false;
    const now=new Date().toISOString();
    const row={...(old||{}),id:old?.id||uid(),authorId:old?.authorId||actor(),
      category:input.category,title,body,createdAt:old?.createdAt||now,updatedAt:now,pinned:!!input.pinned};
    const posts=id?state.boardPosts.map(p=>p.id===id?row:p):[...state.boardPosts,row];
    if(!persist(posts,state.boardComments))return false;
    selected=row.id;return true;
  }
  function saveComment(postId,body,id=""){
    if(!actor()||!state.boardPosts.some(p=>p.id===postId))return false;
    body=String(body||"").trim();
    if(!body||body.length>5000){status("댓글을 5,000자 이내로 입력해 주세요.");return false}
    const old=id?state.boardComments.find(c=>c.id===id):null;
    if(id&&(!own(old)||old.postId!==postId))return false;
    const row={...(old||{}),id:old?.id||uid(),postId,authorId:old?.authorId||actor(),body,
      createdAt:old?.createdAt||new Date().toISOString()};
    const comments=id?state.boardComments.map(c=>c.id===id?row:c):[...state.boardComments,row];
    return persist(state.boardPosts,comments);
  }
  function deleteOwn(kind,id){
    if(kind==="post"){
      const row=state.boardPosts.find(p=>p.id===id);
      if(!own(row))return false;
      // Preserve comments, including other people's records. No cascade.
      return persist(state.boardPosts.filter(p=>p.id!==id),state.boardComments);
    }
    if(kind==="comment"){
      const row=state.boardComments.find(c=>c.id===id);
      if(!own(row))return false;
      return persist(state.boardPosts,state.boardComments.filter(c=>c.id!==id));
    }
    return false;
  }
  const stamp=row=>escape(formatDateTime(row.createdAt));
  const actions=(row,kind)=>own(row)?'<div class="acts"><button class="btn sm" type="button" data-board-edit="'+kind+'" data-key="'+escape(row.id)+'">수정</button><button class="btn sm danger" type="button" data-board-delete="'+kind+'" data-key="'+escape(row.id)+'">삭제</button></div>':"";
  function render(){
    if(!root)return;
    const posts=state.boardPosts||[],comments=state.boardComments||[];
    get("counts").textContent="글 "+posts.length+" · 댓글 "+comments.length;
    get("author").textContent=author(actor());
    get("postSubmit").disabled=!actor()||loadRecovery.active;
    get("commentSubmit").disabled=!actor()||loadRecovery.active;
    root.querySelectorAll("[data-board-filter]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.boardFilter===filter)));
    const rows=posts.filter(p=>filter==="ALL"||p.category===filter).slice().sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||String(b.createdAt).localeCompare(String(a.createdAt))||String(b.id).localeCompare(String(a.id)));
    get("list").innerHTML=rows.map(p=>'<article class="item"><div><span class="pill">'+escape(p.category)+'</span> '+(p.pinned?'<span class="pill">고정</span> ':"")+'<button class="btn" type="button" data-board-open="'+escape(p.id)+'" aria-pressed="'+String(selected===p.id)+'">'+escape(p.title)+'</button><p class="sub">'+escape(author(p.authorId))+' · '+stamp(p)+'</p></div></article>').join("")||'<p class="empty">아직 게시글이 없습니다.</p>';
    const post=posts.find(p=>p.id===selected);
    get("detail").hidden=!post;
    if(!post){get("article").innerHTML="";get("comments").innerHTML="";return}
    get("article").innerHTML='<span class="pill">'+escape(post.category)+'</span>'+(post.pinned?' <span class="pill">고정</span>':"")+'<h3 tabindex="-1" data-board-heading>'+escape(post.title)+'</h3><p class="sub">'+escape(author(post.authorId))+' · '+stamp(post)+'</p><p class="board-body">'+escape(post.body)+'</p>'+actions(post,"post");
    get("comments").innerHTML=comments.filter(c=>c.postId===post.id).slice().sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))).map(c=>'<article class="item"><div><b>'+escape(author(c.authorId))+'</b><p class="sub">'+stamp(c)+'</p><p class="board-body">'+escape(c.body)+'</p>'+actions(c,"comment")+'</div></article>').join("")||'<p class="empty">첫 댓글을 남겨 주세요.</p>';
  }
  function confirmAction(message,action){
    const dialog=get("confirm");
    if(dialog.open)return;
    get("confirmText").textContent=message;pending=action;
    dialog.returnValue="";dialog.showModal();
  }
  function resetEditor(){
    editing=null;get("postForm").reset();get("commentForm").reset();
    get("postSubmit").textContent="글 게시";get("commentSubmit").textContent="댓글 게시";
  }
  function edit(kind,id){
    if(kind==="post"){
      const row=state.boardPosts.find(p=>p.id===id);if(!own(row))return;
      resetEditor();editing={kind,id,postId:id};
      for(const key of ["title","body","category"])get("postForm").elements[key].value=row[key];
      get("postForm").elements.pinned.checked=!!row.pinned;
      get("postSubmit").textContent="수정 저장";get("postForm").elements.title.focus();
    }else{
      const row=state.boardComments.find(c=>c.id===id);if(!own(row))return;
      resetEditor();editing={kind,id,postId:row.postId};
      get("commentForm").elements.body.value=row.body;
      get("commentSubmit").textContent="수정 저장";get("commentForm").elements.body.focus();
    }
  }
  function init(){
    if(!root)return;
    get("confirm").addEventListener("close",()=>{
      const action=pending;pending=null;
      if(get("confirm").returnValue==="approve"&&action)action();
    });
    root.addEventListener("click",event=>{
      const button=event.target.closest("button");if(!button||!root.contains(button))return;
      if(button.dataset.boardOpen){selected=button.dataset.boardOpen;resetEditor();render();get("article").querySelector("[data-board-heading]")?.focus()}
      else if(button.dataset.boardFilter){filter=button.dataset.boardFilter;render()}
      else if(button.dataset.boardEdit)edit(button.dataset.boardEdit,button.dataset.key);
      else if(button.dataset.boardDelete){
        const kind=button.dataset.boardDelete,id=button.dataset.key;
        confirmAction(kind==="post"?"이 글만 삭제할까요? 댓글과 다른 기록은 보존됩니다.":"이 댓글만 삭제할까요?",()=>{
          if(deleteOwn(kind,id)){resetEditor();render()}
          else status("삭제하지 못했습니다. 작성자와 저장 상태를 확인해 주세요.");
        });
      }else if(button.hasAttribute("data-board-cancel"))resetEditor();
    });
    get("postForm").addEventListener("submit",event=>{
      event.preventDefault();const form=event.currentTarget;
      const input={title:form.elements.title.value,body:form.elements.body.value,
        category:form.elements.category.value,pinned:form.elements.pinned.checked};
      const id=editing?.kind==="post"?editing.id:"";
      const apply=()=>{if(savePost(input,id)){resetEditor();render()}};
      if(id)confirmAction("이 글의 수정 내용을 저장할까요?",apply);else apply();
    });
    get("commentForm").addEventListener("submit",event=>{
      event.preventDefault();const postId=selected,body=event.currentTarget.elements.body.value;
      const id=editing?.kind==="comment"&&editing.postId===postId?editing.id:"";
      const apply=()=>{if(saveComment(postId,body,id)){resetEditor();render()}};
      if(id)confirmAction("이 댓글의 수정 내용을 저장할까요?",apply);else apply();
    });
    render();
  }
  window.HaniBoard=Object.freeze({render,savePost,saveComment,deleteOwn});
  init();
})();
