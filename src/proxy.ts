import { NextRequest, NextResponse } from "next/server";

const IFWE_HOST = "ifwe.cnanfc.com";

function getHostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
}

export function proxy(request: NextRequest) {
  if (getHostname(request) !== IFWE_HOST) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (url.pathname === "/") {
    url.pathname = "/ifwe";

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
