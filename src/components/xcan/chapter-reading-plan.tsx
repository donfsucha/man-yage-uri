"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { allBibleChapters, bibleBooks, chapterRangesForVideo } from "@/lib/xcan/chapter-progress";
import type { KoreanBibleVideo } from "@/lib/xcan/bible-reading";
import { acceptedPlaybackSegment, coverageRatio, mergeCoverage, type Interval } from "@/lib/xcan/viewing-coverage";

const storageKey = "xcan:chapter-progress:v1";
type ChapterRecord = { videoCompleted: string[]; manualRead: string[]; excludedVideo: string[]; coverage: Record<string, Interval[]> };
const emptyRecord = (): ChapterRecord => ({ videoCompleted: [], manualRead: [], excludedVideo: [], coverage: {} });
const validKeys = new Set(allBibleChapters.map(chapter => chapter.key));
export function normalizeRecord(value: unknown): ChapterRecord {
  if (!value || typeof value !== "object") return emptyRecord();
  const raw = value as Partial<ChapterRecord>;
  const keys = (items: unknown) => Array.isArray(items) ? [...new Set(items.filter((key): key is string => typeof key === "string" && validKeys.has(key)))] : [];
  const coverage: Record<string, Interval[]> = {};
  if (raw.coverage && typeof raw.coverage === "object") {
    for (const [id, intervals] of Object.entries(raw.coverage)) {
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id) || !Array.isArray(intervals)) continue;
      coverage[id] = intervals.reduce<Interval[]>((result, pair) => Array.isArray(pair) && pair.length === 2 && pair.every(Number.isFinite) ? mergeCoverage(result, pair[0], pair[1]) : result, []);
    }
  }
  return { videoCompleted: keys(raw.videoCompleted), manualRead: keys(raw.manualRead), excludedVideo: keys(raw.excludedVideo), coverage };
}
export type ChapterProgressHandle = {
  sample: (video: KoreanBibleVideo, seconds: number, duration: number, rate: number, playing: boolean) => void;
  finish: (video: KoreanBibleVideo, duration: number) => boolean;
  resetSample: () => void;
};
export const ChapterReadingPlan = forwardRef<ChapterProgressHandle, {visible:boolean; currentBook:string; legacyCount:number}>(function ChapterReadingPlan({visible,currentBook,legacyCount}, ref) {
  const data = useRef<ChapterRecord>(emptyRecord());
  const loaded = useRef(false);
  const last = useRef<{seconds:number;at:number;rate:number;id:string}|null>(null);
  const previousEdit = useRef<ChapterRecord|null>(null);
  const [record,setRecord] = useState<ChapterRecord>(emptyRecord);
  const [book,setBook] = useState("");
  const [message,setMessage] = useState("");
  const [canUndo,setCanUndo] = useState(false);
  const flushAt = useRef(0);

  function load() {
    if (loaded.current) return;
    try { data.current = normalizeRecord(JSON.parse(localStorage.getItem(storageKey) || "null")); }
    catch { setMessage("장별 기록을 불러오지 못했습니다. 기존 일차 기록은 그대로 유지됩니다."); }
    loaded.current = true;
  }
  function persist(next: ChapterRecord, render=true) {
    data.current = next;
    try { localStorage.setItem(storageKey,JSON.stringify(next)); }
    catch { setMessage("이 기기에서 기록을 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요."); }
    if (render) setRecord({...next});
  }
  useEffect(() => {
    const timer = setTimeout(() => { load(); setRecord({...data.current}); },0);
    return () => clearTimeout(timer);
  }, []);
  useImperativeHandle(ref, () => ({
    resetSample() { last.current = null; },
    sample(video,seconds,_duration,rate,playing) {
      load();
      if (!playing || !video.videoId) { last.current=null; return; }
      const at=performance.now();
      const segment=acceptedPlaybackSegment(last.current?.id===video.videoId ? last.current : null,seconds,at,rate);
      if (segment) data.current={...data.current,coverage:{...data.current.coverage,[video.videoId]:mergeCoverage(data.current.coverage[video.videoId] || [],...segment)}};
      last.current={seconds,at,rate,id:video.videoId};
      if(at-flushAt.current>5000) { persist(data.current,false); flushAt.current=at; }
    },
    finish(video,duration) {
      load(); last.current=null;
      const qualified=Boolean(video.videoId && coverageRatio(data.current.coverage[video.videoId] || [],duration)>=0.95);
      if (qualified) {
        const keys=chapterRangesForVideo(video).map(chapter=>chapter.key);
        persist({...data.current,videoCompleted:[...new Set([...data.current.videoCompleted,...keys])]});
        setMessage(`${video.title}: 영상 재생 완료로 표시했습니다. 읽기 완료는 직접 체크해 주세요.`);
      } else {
        persist(data.current);
        setMessage(`${video.title}: 확인된 재생 구간이 95% 미만이라 자동 완료하지 않았습니다. 읽으셨다면 장별로 직접 체크할 수 있습니다.`);
      }
      return qualified;
    }
  }));
  function edit(next: ChapterRecord) {
    previousEdit.current=JSON.parse(JSON.stringify(data.current)); setCanUndo(true); persist(next);
  }
  function toggleManual(key:string) {
    edit({...data.current,manualRead:data.current.manualRead.includes(key)?data.current.manualRead.filter(item=>item!==key):[...data.current.manualRead,key]});
  }
  function toggleVideo(key:string) {
    edit({...data.current,excludedVideo:data.current.excludedVideo.includes(key)?data.current.excludedVideo.filter(item=>item!==key):[...data.current.excludedVideo,key]});
  }
  const selected=book || (bibleBooks.some(item=>item.book===currentBook)?currentBook:bibleBooks[0].book);
  const effectiveVideo=record.videoCompleted.filter(key=>!record.excludedVideo.includes(key));
  if(!visible) return null;
  return <section className="mb-4 rounded-lg border border-sky-400/30 bg-sky-950/30 p-3" aria-label="장별 읽기 기록">
    <h3 className="font-black text-sky-200">장별 읽기 기록</h3>
    <p className="my-2 text-xs leading-relaxed text-white/80">영상 재생 {effectiveVideo.length}/1189장 · 직접 읽음 {record.manualRead.length}/1189장<br/>기존 일차 완료 {legacyCount}개는 그대로 보존됩니다. 과거 기록은 재생·읽기 여부를 구분할 수 없어 장별 기록에 자동 합산하지 않습니다.</p>
    <p className="mb-2 text-xs text-white/65">영상 종료 시 확인된 재생 구간이 95% 이상이면 포함된 장에 ‘영상 완료’를 표시합니다. 이해·실제 읽기를 인증하는 표시는 아닙니다. 같은 기기의 이 브라우저에만 저장됩니다.</p>
    <label className="text-xs font-bold">성경 선택 <select className="ml-2 max-w-full rounded bg-zinc-800 p-2 text-white" value={selected} onChange={event=>setBook(event.target.value)}>{bibleBooks.map(item=><option key={item.book}>{item.book}</option>)}</select></label>
    <div className="mt-2 max-h-52 overflow-y-auto">
      {allBibleChapters.filter(chapter=>chapter.book===selected).map(chapter=>{
        const played=record.videoCompleted.includes(chapter.key);
        const excluded=record.excludedVideo.includes(chapter.key);
        const read=record.manualRead.includes(chapter.key);
        return <div key={chapter.key} className="flex flex-wrap items-center gap-2 border-b border-white/10 py-2 text-xs">
          <span className="w-10 font-bold">{chapter.chapter}장</span>
          <span className={played&&!excluded?"text-sky-300":"text-white/50"}>{played&&!excluded?"영상 완료":"영상 미완료"}</span>
          <button type="button" aria-pressed={read} aria-label={`${selected} ${chapter.chapter}장 직접 읽음`} onClick={()=>toggleManual(chapter.key)} className={`min-h-10 rounded px-3 ${read?"bg-emerald-600":"bg-white/10"}`}>{read?"✓ 직접 읽음":"직접 읽음 체크"}</button>
          {played&&<button type="button" onClick={()=>toggleVideo(chapter.key)} className="min-h-10 rounded bg-white/10 px-2">{excluded?"영상 표시 복구":"영상 표시 취소"}</button>}
        </div>;
      })}
    </div>
    <button type="button" disabled={!canUndo} className="mt-2 min-h-10 rounded bg-white/10 px-3 text-xs disabled:opacity-40" onClick={()=>{ if(previousEdit.current){ persist({...data.current,manualRead:previousEdit.current.manualRead,excludedVideo:previousEdit.current.excludedVideo}); previousEdit.current=null;setCanUndo(false);setMessage("마지막 수동 변경을 되돌렸습니다."); } }}>마지막 수동 변경 되돌리기</button>
    {message&&<p role="status" className="mt-2 text-xs text-amber-200">{message}</p>}
  </section>;
});
