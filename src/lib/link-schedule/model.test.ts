import { describe,it,expect } from "vitest";
import { blankSchedule,isSafeDestination,resolveDestination,scheduleSchema } from "./model";
const base={...blankSchedule,enabled:true,slots:[{id:"a",label:"아침",start:"08:00",end:"10:00",from:"",until:"",url:"/l",enabled:true}]};
describe("link schedules",()=>{
 it("resolves using Korea time, inclusive start/exclusive end",()=>{
  expect(resolveDestination(base,new Date("2026-11-18T22:59:00Z")).url).toBe("/b");
  expect(resolveDestination(base,new Date("2026-11-18T23:00:00Z")).url).toBe("/l");
  expect(resolveDestination(base,new Date("2026-11-19T01:00:00Z")).url).toBe("/b");
 });
 it("uses fallback when disabled",()=>expect(resolveDestination({...base,enabled:false},new Date("2026-11-18T23:00:00Z")).url).toBe("/b"));
 it("handles midnight and date ranges",()=>{
  const config={...base,slots:[{...base.slots[0],start:"00:00",end:"24:00",from:"2026-11-19",until:"2026-11-19"}]};
  expect(resolveDestination(config,new Date("2026-11-18T15:00:00Z")).url).toBe("/l");
  expect(resolveDestination(config,new Date("2026-11-19T15:00:00Z")).url).toBe("/b");
 });
 it("rejects overlapping enabled slots but permits adjacent or date-disjoint slots",()=>{
  expect(scheduleSchema.safeParse({...base,slots:[...base.slots,{...base.slots[0],id:"b"}]}).success).toBe(false);
  expect(scheduleSchema.safeParse({...base,slots:[...base.slots,{...base.slots[0],id:"b",start:"10:00",end:"11:00"}]}).success).toBe(true);
  expect(scheduleSchema.safeParse({...base,slots:[{...base.slots[0],until:"2026-11-19"},{...base.slots[0],id:"b",from:"2026-11-20"}]}).success).toBe(true);
 });
 it("rejects invalid dates, duplicate IDs, and crossing-midnight slots",()=>{
  for(const change of [{from:"2026-02-30"},{from:"2026-99-99"},{start:"22:00",end:"02:00"},{from:"2027-01-01",until:"2026-12-31"}])expect(scheduleSchema.safeParse({...base,slots:[{...base.slots[0],...change}]}).success).toBe(false);
  expect(scheduleSchema.safeParse({...base,slots:[...base.slots,{...base.slots[0],enabled:false}]}).success).toBe(false);
 });
 it("restricts redirects to safe destination forms",()=>{
  for(const url of ["javascript:alert(1)","//evil.com","http://example.com","https://u:p@example.com","https://localhost","https://127.0.0.1","https://[::1]","/admin","/go/bible","https://ifwe.cnanfc.com/go/bible"])expect(isSafeDestination(url),url).toBe(false);
  expect(isSafeDestination("https://www.youtube.com/watch?v=abc")).toBe(true);
  expect(isSafeDestination("/b")).toBe(true);
 });
});
