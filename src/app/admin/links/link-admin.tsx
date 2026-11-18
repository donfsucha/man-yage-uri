"use client";
import { useEffect,useState } from "react";
import { blankSchedule,koreaParts,resolveDestination,scheduleSchema,slugSchema,type LinkSchedule,type SavedSchedule } from "@/lib/link-schedule/model";

export default function LinkAdmin(){
 const [slug,setSlug]=useState("bible");
 const [loadedSlug,setLoadedSlug]=useState("");
 const [config,setConfig]=useState<LinkSchedule>(blankSchedule);
 const [revision,setRevision]=useState(0);
 const [versions,setVersions]=useState<SavedSchedule[]>([]);
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [preview,setPreview]=useState("");
 const [origin,setOrigin]=useState("");
 const input="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 disabled:opacity-50";

 useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",handler);return()=>window.removeEventListener("beforeunload",handler);},[dirty]);
 function edit(next:LinkSchedule){setConfig(next);setDirty(true);setMessage("");}
 async function load(){
  setOrigin(window.location.origin); const p=koreaParts(new Date());setPreview(`${p.date}T${p.time}`);
  if(busy)return;
  if(dirty && !window.confirm("저장하지 않은 변경을 버리고 서버 값을 불러올까요?"))return;
  if(!slugSchema.safeParse(slug).success){setError("주소 이름은 영문 소문자·숫자·하이픈 1~48자로 입력해 주세요.");return;}
  setBusy(true);setError("");setMessage("");setReady(false);
  try {const res=await fetch(`/admin/links/data?slug=${encodeURIComponent(slug)}`,{cache:"no-store"});const data=await res.json();if(!res.ok)throw new Error(data.error || "불러오기 실패");setConfig(data.current?.config || {...blankSchedule});setRevision(data.current?.revision || 0);setVersions(data.versions);setLoadedSlug(slug);setReady(true);setDirty(false);setMessage(data.current ? `서버 버전 ${data.current.revision}을 불러왔습니다.` : "새 주소입니다. 예약을 작성하고 저장하면 발급됩니다.");}
  catch(e){setError(e instanceof Error?e.message:"불러오기 실패");}finally{setBusy(false);}
 }
 async function save(){
  if(busy || !ready || slug!==loadedSlug)return;
  const parsed=scheduleSchema.safeParse(config);if(!parsed.success){setError(parsed.error.issues.map(i=>i.message).join(" "));return;}
  if(!window.confirm(`${loadedSlug}의 실제 연결 설정을 저장할까요? 저장 후 해당 주소의 새 접속에 적용됩니다.`))return;
  setBusy(true);setError("");setMessage("");
  try{const res=await fetch("/admin/links/data",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:loadedSlug,config:parsed.data,revision})});const data=await res.json();if(!res.ok)throw new Error(data.error || "저장 실패");setConfig(data.current.config);setRevision(data.current.revision);setVersions(v=>[data.current,...v].slice(0,20));setDirty(false);setMessage(`서버 저장 완료 · 버전 ${data.current.revision} · 새 접속부터 적용됩니다.`);}
  catch(e){setError(e instanceof Error?e.message:"저장 실패");}finally{setBusy(false);}
 }
 const parsed=scheduleSchema.safeParse(config);
 const date=preview ? new Date(`${preview}:00+09:00`) : null;
 const picked=parsed.success && date && Number.isFinite(date.getTime()) ? resolveDestination(parsed.data,date) : null;
 const patch=(index:number,key:string,value:string|boolean)=>edit({...config,slots:config.slots.map((s,i)=>i===index?{...s,[key]:value}:s)});
 return <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900"><div className="mx-auto max-w-6xl space-y-6">
  <header className="rounded-3xl bg-slate-900 p-7 text-white"><p className="text-sm font-bold tracking-widest text-emerald-300">XCAN · LINK CONTROL</p><h1 className="mt-3 text-3xl font-bold">시간대별 연결 관리자</h1><p className="mt-3 max-w-3xl text-slate-300">주소는 그대로, 콘텐츠는 시간에 맞게. 한국 시간 기준의 실제 연결 URL을 서버에 저장합니다.</p><div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/10 px-3 py-2">관리자 인증 보호</span><span className="rounded-full bg-white/10 px-3 py-2">Asia/Seoul · UTC+9</span><span className="rounded-full bg-white/10 px-3 py-2">기존 /start · 앱 시간표 변경 없음</span></div></header>
  <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">1. 관리할 고정 주소</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="flex-1 text-sm font-medium">주소 이름<input aria-label="주소 이름" className={`${input} mt-1`} value={slug} disabled={busy} onChange={e=>setSlug(e.target.value)}/></label><button className="self-end rounded-xl bg-slate-900 px-6 py-3 font-bold text-white disabled:opacity-50" disabled={busy} onClick={load}>서버에서 불러오기</button></div><p className="mt-3 break-all text-sm text-slate-600">발급 주소: {origin || "https://ifwe.cnanfc.com"}/go/{slug}</p><p className="mt-2 text-xs text-slate-500">기존 태그 주소를 자동 변경하지 않습니다. 새 주소를 저장하고 시험한 뒤 NFC·QR에 사용하세요.</p></section>
  {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
  {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">{message}</p>}
  <fieldset disabled={!ready || busy || slug!==loadedSlug} className="space-y-6 disabled:opacity-60">
   <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">2. 기본 연결</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">관리 이름<input className={`${input} mt-1`} value={config.title} onChange={e=>edit({...config,title:e.target.value})}/></label><label className="text-sm font-medium">기본 URL<input className={`${input} mt-1`} value={config.fallback} onChange={e=>edit({...config,fallback:e.target.value})}/></label></div><label className="mt-4 flex items-center gap-3 font-medium"><input type="checkbox" checked={config.enabled} onChange={e=>edit({...config,enabled:e.target.checked})}/>시간대별 전환 사용</label><p className="mt-2 text-xs text-slate-500">전환을 끄거나 해당 예약이 없으면 기본 URL로 연결됩니다. 내부 경로 /b, /l, /e, /c, /ifwe, /suwon 또는 공개 HTTPS 주소를 사용할 수 있습니다.</p></section>
   <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">3. 날짜·시간 예약</h2><button className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white" type="button" onClick={()=>edit({...config,slots:[...config.slots,{id:crypto.randomUUID(),label:"새 예약",start:"08:00",end:"10:00",from:"",until:"",url:"/b",enabled:true}]})}>+ 예약 추가</button></div><p className="mt-2 text-sm text-slate-500">시작 시각 포함, 종료 시각 제외. 종료일은 포함합니다. 날짜를 비우면 매일 반복합니다. 자정을 넘는 예약은 24:00과 00:00을 기준으로 나눠 주세요.</p>
   <div className="mt-5 space-y-4">{config.slots.length===0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">예약을 추가하면 시간에 따라 다른 콘텐츠로 연결할 수 있습니다.</p>}{config.slots.map((s,i)=><article key={s.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-3 flex items-center justify-between"><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={s.enabled} onChange={e=>patch(i,"enabled",e.target.checked)}/>예약 {i+1}</label><button type="button" className="text-sm font-bold text-red-700" onClick={()=>{if(window.confirm("이 예약을 편집 목록에서 제거할까요? 서버 저장 전까지 실제 연결은 유지됩니다."))edit({...config,slots:config.slots.filter((_,n)=>n!==i)});}}>제거</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm">표시 이름<input className={input} value={s.label} onChange={e=>patch(i,"label",e.target.value)}/></label><label className="text-sm lg:col-span-3">실제 연결 URL<input className={input} value={s.url} placeholder="https://www.youtube.com/watch?v=…" onChange={e=>patch(i,"url",e.target.value)}/></label><label className="text-sm">시작 시각<input type="time" className={input} value={s.start} onChange={e=>patch(i,"start",e.target.value)}/></label><label className="text-sm">종료 시각 (24:00 가능)<input className={input} value={s.end} placeholder="24:00" onChange={e=>patch(i,"end",e.target.value)}/></label><label className="text-sm">적용 시작일<input type="date" className={input} value={s.from} onChange={e=>patch(i,"from",e.target.value)}/></label><label className="text-sm">적용 종료일<input type="date" className={input} value={s.until} onChange={e=>patch(i,"until",e.target.value)}/></label></div></article>)}</div></section>
   <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">4. 저장 전 미리보기</h2><label className="mt-4 block max-w-sm text-sm">확인할 한국 날짜·시간<input type="datetime-local" className={input} value={preview} onChange={e=>setPreview(e.target.value)}/></label>{picked ? <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="font-bold">{picked.label}</p><p className="mt-1 break-all">{picked.url}</p></div> : <p className="mt-3 text-amber-800">{parsed.success ? "미리볼 날짜·시간을 선택해 주세요." : parsed.error.issues.map(i=>i.message).join(" ")}</p>}<p className="mt-3 text-xs text-slate-500">미리보기는 현재 편집 내용의 연결 판정입니다. 외부 사이트의 접속·영상 재생 가능 여부를 보증하지 않습니다.</p></section>
   <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 p-5 text-white"><div><p className="font-bold">{dirty?"저장하지 않은 변경이 있습니다.":`서버 버전 ${revision}`}</p><p className="text-sm text-slate-300">저장하면 새 접속부터 적용됩니다. 이미 열린 영상은 강제로 바뀌지 않습니다.</p></div><button disabled={!parsed.success} className="rounded-xl bg-emerald-400 px-6 py-3 font-bold text-slate-900 disabled:opacity-50" onClick={save}>실제 서버에 저장</button></section>
   {revision>0 && <p><a className="font-bold text-emerald-800 underline" href={`/go/${loadedSlug}`} target="_blank" rel="noopener noreferrer">저장된 실제 연결 열기 ↗</a></p>}
   <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">변경 이력 · 최근 20개</h2><p className="mt-1 text-sm text-slate-500">이전 내용을 편집 화면에 불러온 후 새 버전으로 저장하여 복원합니다.</p><ul className="mt-4 space-y-2">{versions.map(v=><li className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2" key={v.revision}><span>버전 {v.revision} · {new Date(v.updated_at).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</span><button type="button" className="text-sm font-bold text-emerald-800" onClick={()=>{if(window.confirm(`버전 ${v.revision} 내용을 편집 화면에 불러올까요? 현재 편집 내용은 바뀌며, 저장 전에는 실제 연결이 바뀌지 않습니다.`))edit(v.config);}}>편집에 불러오기</button></li>)}</ul></section>
  </fieldset><footer className="text-xs text-slate-500">서버가 접속 시각을 기준으로 판단하므로 관리자 컴퓨터를 꺼도 작동합니다. 서버 저장소 장애 시에는 잘못된 주소로 임의 연결하지 않고 안내합니다.</footer>
 </div></main>;
}
