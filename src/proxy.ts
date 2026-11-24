import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess, libraryAuthHeaders, privateLibraryHeaders } from "@/lib/library-access";

const IFWE_HOST = "ifwe.cnanfc.com";
const ADMIN_REALM = "IfWe Admin";

function getHostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
}

function unauthorizedResponse() {
  return new NextResponse("Admin sign-in required.", {
    headers: {
      "WWW-Authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`
    },
    status: 401
  });
}

function isValidAdminRequest(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const configuredAdminUsername = process.env.ADMIN_USERNAME?.trim();
  const allowedUsernames = new Set(
    ["admin", configuredAdminUsername].filter(
      (username): username is string => Boolean(username)
    )
  );

  if (!adminPassword) {
    return new NextResponse("ADMIN_PASSWORD is not configured.", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  try {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const username = decoded.slice(0, separatorIndex).trim();
    const password = decoded.slice(separatorIndex + 1).trim();

    if (allowedUsernames.has(username) && password === adminPassword) {
      return null;
    }
  } catch {
    return unauthorizedResponse();
  }

  return unauthorizedResponse();
}

export function proxy(request: NextRequest) {
  let pathname = request.nextUrl.pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Malformed paths cannot resolve to the library page.
  }
  if (pathname === "/library" || pathname.startsWith("/library/")) {
    const access = getAdminAccess(request.headers.get("authorization"));
    if (access !== "allowed") {
      const needsSignIn = access === "unauthorized";
      return new NextResponse(needsSignIn ? "Admin sign-in required." : "Admin access is unavailable.", {
        headers: libraryAuthHeaders(needsSignIn),
        status: needsSignIn ? 401 : 503,
      });
    }
    return NextResponse.next({ headers: privateLibraryHeaders });
  }


  if (request.nextUrl.pathname.startsWith("/admin")) {
    const authResponse = isValidAdminRequest(request);

    if (authResponse) {
      return authResponse;
    }
  }

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
