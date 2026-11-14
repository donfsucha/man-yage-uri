export const suwonFeedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCpT3ZKDtCRX67Knkzl7Uc6w";
export const suwonStreamsUrl = "https://www.youtube.com/@SuwonJeilCh/streams";

export function findLatestSuwonStream(html: string): string | null {
  const match = html.match(/(?:var\s+ytInitialData\s*=\s*|window\["ytInitialData"\]\s*=\s*)(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return null;
  try {
    const data: unknown = JSON.parse(match[1]);
    const visit = (node: unknown): string | null => {
      if (!node || typeof node !== "object") return null;
      if (Array.isArray(node)) {
        for (const child of node) {
          const found = visit(child);
          if (found) return found;
        }
        return null;
      }
      const record = node as Record<string, unknown>;
      if (record.lockupViewModel && typeof record.lockupViewModel === "object") {
        const video = record.lockupViewModel as { contentId?: unknown; metadata?: { lockupMetadataViewModel?: { title?: { content?: unknown }; metadata?: unknown } } };
        const title = video.metadata?.lockupMetadataViewModel?.title?.content;
        const details = JSON.stringify(video.metadata?.lockupMetadataViewModel?.metadata ?? "");
        if (typeof title === "string" && /새벽\s*(기도회|예배)/.test(title) &&
            typeof video.contentId === "string" && /^[\w-]{11}$/.test(video.contentId) &&
            /(?:ago|streamed|전|실시간)/i.test(details) && !/(?:upcoming|scheduled|예정)/i.test(details)) {
          return `https://www.youtube.com/watch?v=${video.contentId}`;
        }
      }
      for (const child of Object.values(record)) {
        const found = visit(child);
        if (found) return found;
      }
      return null;
    };
    return visit(data);
  } catch {
    return null;
  }
}

export function findTodaySuwonWorship(xml: string, now = new Date()): string | null {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul", year: "2-digit", month: "numeric", day: "numeric",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const today = 20000000 + part("year") * 10000 + part("month") * 100 + part("day");
  let latest: { date: number; url: string } | null = null;

  for (const [entry] of xml.matchAll(/<entry\b[\s\S]*?<\/entry>/g)) {
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "";
    const date = description.match(/(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    const id = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    if (!/새벽\s*(기도회|예배)/.test(title) || !id) continue;
    const url = `https://www.youtube.com/watch?v=${id}`;
    if (!date) continue;
    const year = Number(date[1]);
    const worshipDate = (year < 100 ? 2000 + year : year) * 10000 + Number(date[2]) * 100 + Number(date[3]);
    if (worshipDate <= today && (!latest || worshipDate > latest.date)) latest = { date: worshipDate, url };
  }
  return latest?.url ?? null;
}
