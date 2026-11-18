import { z } from "zod";

const localPaths = new Set(["/b", "/e", "/l", "/c", "/ifwe", "/suwon"]);
export function isSafeDestination(value: string): boolean {
  if (localPaths.has(value)) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || /[\s\\]/.test(value)) return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":") || host.endsWith(".local") || host.endsWith(".localhost")) return false;
    if (host === "ifwe.cnanfc.com" && !localPaths.has(url.pathname)) return false;
    return true;
  } catch { return false; }
}
const destination = z.string().trim().min(1).max(2048).refine(isSafeDestination, "내부 콘텐츠 경로 또는 공개 HTTPS 주소를 입력해 주세요. 관리자·순환 링크는 사용할 수 없습니다.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const endTime = z.string().regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/);
const date = z.string().refine(value => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value), "날짜를 확인해 주세요.");
export const slotSchema = z.object({ id: z.string().min(1).max(80), label: z.string().trim().min(1).max(80), start: time, end: endTime, from: date, until: date, url: destination, enabled: z.boolean() });
export const scheduleSchema = z.object({ title: z.string().trim().min(1).max(80), enabled: z.boolean(), fallback: destination, slots: z.array(slotSchema).max(100) }).superRefine((data, ctx) => {
  const ids = new Set<string>();
  data.slots.forEach((slot, i) => {
    if (ids.has(slot.id)) ctx.addIssue({code:"custom", path:["slots",i], message:"중복된 예약 ID입니다."});
    ids.add(slot.id);
    if (slot.start >= slot.end) ctx.addIssue({code:"custom", path:["slots",i], message:"종료는 시작보다 늦어야 합니다. 자정을 넘는 예약은 두 구간으로 나눠 주세요."});
    if (slot.from && slot.until && slot.from > slot.until) ctx.addIssue({code:"custom", path:["slots",i], message:"적용 종료일이 시작일보다 빠릅니다."});
    for(let j=0;j<i;j++) {
      const other=data.slots[j];
      if(slot.enabled && other.enabled && slot.start < other.end && other.start < slot.end && (slot.from || "0000") <= (other.until || "9999") && (other.from || "0000") <= (slot.until || "9999")) ctx.addIssue({code:"custom", path:["slots",i], message:`‘${other.label}’ 예약과 날짜·시간이 겹칩니다.`});
    }
  });
});
export type LinkSchedule = z.infer<typeof scheduleSchema>;
export type LinkSlot = z.infer<typeof slotSchema>;
export type SavedSchedule = { slug:string; config:LinkSchedule; revision:number; updated_at:string };
export const slugSchema=z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/);
export const blankSchedule:LinkSchedule={title:"성경통독 시간표",enabled:false,fallback:"/b",slots:[]};
export function koreaParts(now:Date) {
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
 const val=(key:string)=>parts.find(x=>x.type===key)?.value || "";
 return {date:`${val("year")}-${val("month")}-${val("day")}`,time:`${val("hour")}:${val("minute")}`};
}
export function resolveDestination(config:LinkSchedule, now=new Date()) {
 const {date,time}=koreaParts(now);
 const slot=config.enabled ? config.slots.find(s=>s.enabled && s.start<=time && time<s.end && (!s.from || s.from<=date) && (!s.until || date<=s.until)) : undefined;
 return {url:slot?.url || config.fallback, label:slot?.label || "기본 연결",date,time};
}
