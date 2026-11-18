import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { scheduleSchema, type SavedSchedule, type LinkSchedule } from "./model";
export async function loadSchedule(slug:string):Promise<SavedSchedule|null> {
 const {data,error}=await createSupabaseServiceClient().from("xcan_link_schedules").select("slug,config,revision,updated_at").eq("slug",slug).maybeSingle();
 if(error) throw new Error("SCHEDULE_STORE_UNAVAILABLE");
 return data ? {...data,config:scheduleSchema.parse(data.config)} as SavedSchedule : null;
}
export async function history(slug:string) {
 const {data,error}=await createSupabaseServiceClient().from("xcan_link_schedule_history").select("slug,config,revision,updated_at").eq("slug",slug).order("revision",{ascending:false}).limit(20);
 if(error) throw new Error("SCHEDULE_STORE_UNAVAILABLE");
 return (data || []).map(row=>({...row,config:scheduleSchema.parse(row.config)})) as SavedSchedule[];
}
export async function saveSchedule(slug:string,config:LinkSchedule,revision:number) {
 const {data,error}=await createSupabaseServiceClient().rpc("save_xcan_link_schedule",{p_slug:slug,p_config:config,p_revision:revision});
 if(error) { if(error.message.includes("REVISION_CONFLICT")) throw new Error("REVISION_CONFLICT"); throw new Error("SCHEDULE_STORE_UNAVAILABLE"); }
 return data as SavedSchedule;
}
