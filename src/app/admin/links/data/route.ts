import { NextResponse } from "next/server";
import { z } from "zod";
import { requireLinkAdmin } from "@/lib/link-schedule/auth";
import { history,loadSchedule,saveSchedule } from "@/lib/link-schedule/store";
import { scheduleSchema,slugSchema } from "@/lib/link-schedule/model";
export const dynamic="force-dynamic";
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request) {
 const denied=requireLinkAdmin(request); if(denied) return denied;
 const slug=slugSchema.safeParse(new URL(request.url).searchParams.get("slug"));
 if(!slug.success) return response({error:"주소 이름을 확인해 주세요."},400);
 try { const [current,versions]=await Promise.all([loadSchedule(slug.data),history(slug.data)]);return response({current,versions}); }
 catch {return response({error:"서버 저장소에 연결하지 못했습니다. Supabase 설정과 시간표 테이블 설치를 확인해 주세요. 저장된 것으로 처리하지 않았습니다."},503);}
}
export async function PUT(request:Request) {
 const denied=requireLinkAdmin(request,true); if(denied) return denied;
 const raw=await request.text(); if(raw.length>100000)return response({error:"요청이 너무 큽니다."},413);
 let json:unknown; try{json=JSON.parse(raw);}catch{return response({error:"잘못된 요청입니다."},400);}
 const parsed=z.object({slug:slugSchema,config:scheduleSchema,revision:z.number().int().min(0)}).safeParse(json);
 if(!parsed.success)return response({error:parsed.error.issues.map(x=>x.message).join(" ")},400);
 try {return response({current:await saveSchedule(parsed.data.slug,parsed.data.config,parsed.data.revision)});}
 catch(error) {return error instanceof Error && error.message==="REVISION_CONFLICT" ? response({error:"다른 관리자가 먼저 변경했습니다. 현재 서버 값을 다시 불러온 뒤 저장해 주세요."},409) : response({error:"서버 저장에 실패했습니다. 저장소 설정을 확인하고 다시 시도해 주세요."},503);}
}
