import { NextRequest, NextResponse } from "next/server";

const IFWE_HOST = "ifwe.cnanfc.com";
const SUPPORTED_LANGUAGES = new Set(["ko", "en"]);

function getHostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0].toLowerCase() ?? "";
}

function getPreferredLanguage(request: NextRequest) {
  const explicitLanguage = request.nextUrl.searchParams.get("lang");

  if (explicitLanguage && SUPPORTED_LANGUAGES.has(explicitLanguage)) {
    return explicitLanguage;
  }

  const acceptedLanguages = request.headers
    .get("accept-language")
    ?.split(",")
    .map((entry) => {
      const [language, qValue] = entry.trim().split(";q=");

      return {
        language: language.toLowerCase(),
        quality: qValue ? Number(qValue) : 1
      };
    })
    .filter(({ language, quality }) => language && Number.isFinite(quality))
    .sort((a, b) => b.quality - a.quality);

  const topLanguage = acceptedLanguages?.[0]?.language;

  return topLanguage?.startsWith("ko") ? "ko" : "en";
}

function addLanguageIfMissing(request: NextRequest, url: URL) {
  if (!url.searchParams.has("lang")) {
    url.searchParams.set("lang", getPreferredLanguage(request));
  }
}

export function proxy(request: NextRequest) {
  if (getHostname(request) !== IFWE_HOST) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (url.pathname === "/") {
    url.pathname = "/ifwe";
    addLanguageIfMissing(request, url);

    return NextResponse.rewrite(url);
  }

  if (url.pathname === "/ifwe" && !url.searchParams.has("lang")) {
    addLanguageIfMissing(request, url);

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
