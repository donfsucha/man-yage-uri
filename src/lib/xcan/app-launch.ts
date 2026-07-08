export const appPackageName = "com.cnanfc.xcanplayer";
export const webFallbackParam = "web";
export const appLaunchFallbackDelayMs = 2200;

export function buildXcanPlayerIntentUrl(origin = "https://ifwe.cnanfc.com") {
  const normalizedOrigin = origin.replace(/\/$/, "");
  const fallbackUrl = `${normalizedOrigin}/start?${webFallbackParam}=1`;

  return (
    "intent://bible-start#Intent;" +
    "scheme=xcanplayer;" +
    `package=${appPackageName};` +
    `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};` +
    "end"
  );
}