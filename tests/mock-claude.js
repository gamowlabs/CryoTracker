(function(){
 const store={boxes:window.__SEED, log:{}}; const subs=[]; let n=0; window.__writes=[]; window.__saved=null;
 const CAN=window.__CAN??true;
 function snapColl(c,opts){ let docs=Object.entries(store[c]).map(([id,d])=>({id,exists:true,data:()=>JSON.parse(JSON.stringify(d)),metadata:{}}));
   if(opts.order){const [f,dir]=opts.order; docs.sort((a,b)=>(a.data()[f]-b.data()[f])*(dir==='desc'?-1:1));}
   if(opts.limit) docs=docs.slice(0,opts.limit); return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{}}; }
 function notify(){ setTimeout(()=>subs.forEach(s=>s.fn(snapColl(s.c,s.opts))),5); }
 function merge(t,s){ for(const k in s){ const v=s[k]; if(v&&typeof v==='object'&&!Array.isArray(v)&&t[k]&&typeof t[k]==='object') merge(t[k],v); else t[k]=JSON.parse(JSON.stringify(v)); } }
 function q(c,opts={}){ return { where(){return this}, orderBy(f,dir){return q(c,{...opts,order:[f,dir]})}, limit(l){return q(c,{...opts,limit:l})},
   onSnapshot(fn){ subs.push({c,opts,fn}); setTimeout(()=>fn(snapColl(c,opts)),10); return ()=>{} },
   doc(id){ return docRef(c,id||('m'+(n++))) }, add(d){ const r=docRef(c,'m'+(n++)); return r.set(d).then(()=>r) } }; }
 function docRef(c,id){ return { id, async get(){ const d=store[c][id]; return {id,exists:!!d,data:()=>d}; },
   async set(d){ if(!CAN) throw {code:'invalid_argument'}; window.__writes.push(['set',c,id,d]); store[c][id]=JSON.parse(JSON.stringify(d)); notify(); },
   async update(d){ if(!CAN) throw {code:'invalid_argument'}; if(!store[c][id]) throw {code:'invalid_argument'}; window.__writes.push(['update',c,id,d]); merge(store[c][id],d); notify(); },
   async delete(){ delete store[c][id]; notify(); } }; }
 const db={ collection:(p)=>q(p), doc:(p)=>{const [c,id]=p.split('/'); return docRef(c,id);} };
 const user={ id:async()=>'u_test', can:async()=>CAN, profiles:async(ids)=>Object.fromEntries([].concat(ids).map(i=>[i,{id:i,name:i==='u_test'?'Test User':''}])), isOwner:async()=>true };
 const downloads={ save:async(r)=>{ window.__saved=r; return {status:'saved'} } };
 window.__store=store;
 window.claude={ use: async(nm)=>{ await new Promise(r=>setTimeout(r,20)); return ({db,user,downloads})[nm]||null; } };
})();
