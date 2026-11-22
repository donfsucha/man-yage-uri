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

export type SuwonWorship = { videoId: string; date: string | null; live: boolean };

export const verifiedSuwonReplay: SuwonWorship = { videoId: "rx3AhCrltVM", date: "2026-11-20", live: false };

export function suwonKoreaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function worshipDate(text: string): string | null {
  const date = text.match(/(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (!date) return null;
  const year = Number(date[1]);
  const iso = `${year < 100 ? 2000 + year : year}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}`;
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === iso ? iso : null;
}

export function findDatedSuwonFeedWorship(xml: string, now = new Date()): SuwonWorship | null {
  const today = suwonKoreaDate(now);
  let latest: SuwonWorship | null = null;
  for (const [entry] of xml.matchAll(/<entry\b[\s\S]*?<\/entry>/g)) {
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? "";
    const videoId = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const date = worshipDate(title) ?? worshipDate(description);
    if (!/새벽\s*(기도회|예배)/.test(title) || !videoId || !date || date > today) continue;
    if (!latest?.date || date > latest.date) latest = { videoId, date, live: false };
  }
  return latest;
}

export function parseSuwonWatchWorship(html: string, candidateId: string): SuwonWorship | null {
  const match = html.match(/(?:var\s+ytInitialPlayerResponse\s*=\s*|window\["ytInitialPlayerResponse"\]\s*=\s*)(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]) as {
      playabilityStatus?: { status?: string; playableInEmbed?: boolean };
      videoDetails?: { videoId?: string; channelId?: string; title?: string; shortDescription?: string; isLive?: boolean; isUpcoming?: boolean };
      microformat?: { playerMicroformatRenderer?: { liveBroadcastDetails?: { isLiveNow?: boolean; startTimestamp?: string } } };
    };
    const details = data.videoDetails;
    const broadcast = data.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;
    if (data.playabilityStatus?.status !== "OK" || data.playabilityStatus.playableInEmbed === false ||
        details?.videoId !== candidateId || details.channelId !== "UCpT3ZKDtCRX67Knkzl7Uc6w" ||
        !/새벽\s*(기도회|예배)/.test(details.title ?? "") || details.isUpcoming) return null;
    const live = details.isLive === true || broadcast?.isLiveNow === true;
    const start = broadcast?.startTimestamp ? Date.parse(broadcast.startTimestamp) : NaN;
    const date = worshipDate(details.title ?? "") ?? worshipDate(details.shortDescription ?? "") ??
      (Number.isFinite(start) ? suwonKoreaDate(new Date(start)) : null);
    return live || date ? { videoId: candidateId, date, live } : null;
  } catch {
    return null;
  }
}

export function chooseSuwonWorship(candidates: (SuwonWorship | null)[], now = new Date()): SuwonWorship | null {
  const today = suwonKoreaDate(now);
  const valid = candidates.filter((item): item is SuwonWorship =>
    item !== null && (item.date ? item.date <= today : item.live));
  return valid.find((item) => item.live && (!item.date || item.date === today)) ??
    valid.reduce<SuwonWorship | null>((latest, item) =>
      item.date && (!latest?.date || item.date > latest.date) ? item : latest, null);
}

export function suwonWorshipTitle(worship: SuwonWorship, now = new Date()): string {
  const name = "수원제일교회 새벽기도회";
  if (worship.live && (!worship.date || worship.date === suwonKoreaDate(now))) return `${name} · 실시간`;
  if (!worship.date) return name;
  const [year, month, day] = worship.date.split("-");
  return `${name} · ${year}년 ${Number(month)}월 ${Number(day)}일${worship.date === suwonKoreaDate(now) ? "" : " 다시보기"}`;
}
