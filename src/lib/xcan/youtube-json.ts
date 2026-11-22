type YouTubeAssignment = "ytInitialData" | "ytInitialPlayerResponse";

const markers: Record<YouTubeAssignment, RegExp> = {
  ytInitialData: /(?:^|[;\s])(?:var\s+)?ytInitialData\s*=\s*\{|window\s*\[\s*["']ytInitialData["']\s*\]\s*=\s*\{/g,
  ytInitialPlayerResponse: /(?:^|[;\s])(?:var\s+)?ytInitialPlayerResponse\s*=\s*\{|window\s*\[\s*["']ytInitialPlayerResponse["']\s*\]\s*=\s*\{/g,
};

/** Read an embedded JSON object only; the surrounding script is never executed. */
export function readYouTubeJson(html: string, assignment: YouTubeAssignment): Record<string, unknown> | null {
  for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    const body = script[1];
    if (!body.includes(assignment)) continue;
    for (const marker of body.matchAll(markers[assignment])) {
      const start = marker.index + marker[0].length - 1;
      let depth = 0, quoted = false, escaped = false;
      for (let i = start; i < body.length; i++) {
        const char = body[i];
        if (quoted) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === '"') quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === "{") depth++;
        else if (char === "}" && --depth === 0) {
          try {
            return JSON.parse(body.slice(start, i + 1)) as Record<string, unknown>;
          } catch {
            break;
          }
        }
      }
    }
  }
  return null;
}

export async function getYouTubeText(url: string): Promise<string> {
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8500) });
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
}
