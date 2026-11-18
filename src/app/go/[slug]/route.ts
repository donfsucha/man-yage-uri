import { NextResponse } from "next/server";
import { loadSchedule } from "@/lib/link-schedule/store";
import { resolveDestination,slugSchema } from "@/lib/link-schedule/model";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 if(!slugSchema.safeParse(slug).success)return new NextResponse("등록되지 않은 연결 주소입니다.",{status:404});
 try {
   const saved=await loadSchedule(slug);
   if(!saved)return new NextResponse("등록되지 않은 연결 주소입니다.",{status:404,headers:{"Cache-Control":"no-store"}});
   const {url}=resolveDestination(saved.config);
   const target=new URL(url,request.url);
   if(target.origin===new URL(request.url).origin && target.pathname.startsWith("/go"))throw new Error("LOOP");
   return NextResponse.redirect(target,{status:302,headers:{"Cache-Control":"no-store, max-age=0","Referrer-Policy":"no-referrer"}});
 } catch {return new NextResponse("연결 정보를 일시적으로 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. 성경통독은 /b에서 이용하실 수 있습니다.",{status:503,headers:{"Cache-Control":"no-store"}});}
}
