import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export function requireLinkAdmin(request:Request, write=false):NextResponse|null {
 const password=process.env.ADMIN_PASSWORD?.trim();
 if(!password) return NextResponse.json({error:"관리자 인증이 설정되지 않았습니다."},{status:503});
 const header=request.headers.get("authorization") || "";
 let valid=false;
 if(header.startsWith("Basic ")) {
   const decoded=Buffer.from(header.slice(6),"base64").toString("utf8");
   const split=decoded.indexOf(":");
   const username=decoded.slice(0,split).trim();
   const supplied=Buffer.from(decoded.slice(split+1).trim());
   const expected=Buffer.from(password);
   valid=split>=0 && ["admin",process.env.ADMIN_USERNAME?.trim()].includes(username) && supplied.length===expected.length && timingSafeEqual(supplied,expected);
 }
 if(!valid) return NextResponse.json({error:"관리자 로그인이 필요합니다."},{status:401,headers:{"WWW-Authenticate":'Basic realm="IfWe Admin", charset="UTF-8"',"Cache-Control":"no-store"}});
 if(write && (request.headers.get("origin")!==new URL(request.url).origin || !request.headers.get("content-type")?.startsWith("application/json"))) return NextResponse.json({error:"동일 사이트에서만 저장할 수 있습니다."},{status:403});
 return null;
}
