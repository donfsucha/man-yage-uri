export type QtChannel = { name: string; url: string; pattern: RegExp; dated: boolean; };

export const qtChannels: Record<string, QtChannel> = {
  "1": { name: "매일성경", url: "https://www.youtube.com/@scriptureunionkr/videos?hl=ko&gl=KR", pattern: /매일\s*성경/u, dated: true },
  "2": { name: "오늘의 양식", url: "https://www.youtube.com/@odbkorea/videos?hl=ko&gl=KR", pattern: /오늘의\s*양식/u, dated: true },
  "3": { name: "날마다 기막힌 새벽", url: "https://www.youtube.com/channel/UCARPvkMDoPEECp3hMU1eXwQ/videos?hl=ko&gl=KR", pattern: /날마다\s*기막힌\s*새벽\s*#\s*\d+/u, dated: false },
  "4": { name: "매일의 묵상", url: "https://www.youtube.com/channel/UCjHPrYoxZnPlYohdMQYEL7A/videos?hl=ko&gl=KR", pattern: /매일의\s*묵상/u, dated: true },
  "5": { name: "새롭게하소서", url: "https://www.youtube.com/channel/UCqCqf21juyyL_8peGs2CWGg/videos?hl=ko&gl=KR", pattern: /새롭게\s*하소서/u, dated: false },
};

type Candidate = { id: string; title: string; details: string };

function extractCandidates(data: unknown): Candidate[] {
  const found: Candidate[] = [];
  function visit(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const record = node as Record<string, unknown>;
    if (record.lockupViewModel && typeof record.lockupViewModel === "object") {
      const video = record.lockupViewModel as { contentId?: unknown; metadata?: { lockupMetadataViewModel?: { title?: { content?: unknown }; metadata?: unknown } } };
      const title = video.metadata?.lockupMetadataViewModel?.title?.content;
      if (typeof video.contentId === "string" && typeof title === "string") {
        found.push({ id: video.contentId, title, details: JSON.stringify(video.metadata?.lockupMetadataViewModel?.metadata ?? "") });
      }
      return;
    }
    if (record.videoRenderer && typeof record.videoRenderer === "object") {
      const video = record.videoRenderer as { videoId?: unknown; title?: { simpleText?: string; runs?: { text?: string }[] }; publishedTimeText?: { simpleText?: string }; badges?: unknown };
      const title = video.title?.simpleText ?? video.title?.runs?.map((part) => part.text ?? "").join("");
      if (typeof video.videoId === "string" && title) found.push({ id: video.videoId, title, details: (video.publishedTimeText?.simpleText ?? "") + JSON.stringify(video.badges ?? "") });
      return;
    }
    Object.values(record).forEach(visit);
  }
  visit(data);
  return found;
}

function koreaDate(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const number = (key: string) => Number(parts.find((part) => part.type === key)?.value);
  return { year: number("year"), month: number("month"), day: number("day") };
}

function datedScore(title: string, now: Date): number | null {
  const today = koreaDate(now);
  const match = title.match(/(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일/u);
  if (!match) return null;
  let year = match[1] ? Number(match[1]) : today.year;
  const month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const current = Date.UTC(today.year, today.month - 1, today.day);
  if (!match[1] && date.getTime() > current + 180 * 86400000) year -= 1;
  const score = Date.UTC(year, month - 1, day);
  return score <= current ? score : null;
}

export function findLatestQtVideo(html: string, channel: QtChannel, now = new Date()): Candidate | null {
  const match = html.match(/(?:var\s+ytInitialData\s*=\s*|window\["ytInitialData"\]\s*=\s*)(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) return null;
  try {
    const candidates = extractCandidates(JSON.parse(match[1])).filter((video) => {
      const title = video.title.normalize("NFC");
      return /^[\w-]{11}$/.test(video.id) && channel.pattern.test(title) &&
        !/(shorts|쇼츠)/i.test(title) && !/(members.only|members_only|회원\s*전용|upcoming|scheduled|예정)/i.test(video.details) &&
        /(?:ago|전|streamed|실시간)/i.test(video.details);
    });
    if (!channel.dated) return candidates[0] ?? null;
    const ranked = candidates.map((video) => ({ video, score: datedScore(video.title.normalize("NFC"), now) }))
      .filter((item): item is { video: Candidate; score: number } => item.score !== null)
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.video ?? null;
  } catch { return null; }
}

type QtReplay = { id: string; date: string };

const verifiedQtReplays: Record<string, QtReplay> = {
  "1": { id: "dN9P84jUjUo", date: "2026-11-22" },
  "2": { id: "5woXUBKA3Po", date: "2026-11-22" },
  "3": { id: "VpxYCqI8Ji0", date: "2026-11-21" },
  "4": { id: "CJLl-kCTXIY", date: "2026-11-22" },
  "5": { id: "UXTLRJDwPjs", date: "2026-11-20" },
};

const qtChannelIds: Record<string, string> = {
  "1": "UCroCQn7T3UZsE8N5oyaIP1w",
  "2": "UCrW6Fzvzy-XKuWbc5qgi-VA",
  "3": "UCARPvkMDoPEECp3hMU1eXwQ",
  "4": "UCjHPrYoxZnPlYohdMQYEL7A",
  "5": "UCqCqf21juyyL_8peGs2CWGg",
};

export function qtKoreaDate(now: Date): string {
  const { year, month, day } = koreaDate(now);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function verifiedQtReplay(content: string): QtReplay | null {
  return Object.prototype.hasOwnProperty.call(verifiedQtReplays, content) ? verifiedQtReplays[content] : null;
}

export function parseQtWatchDate(html: string, content: string, id: string): string | null {
  const match = html.match(/(?:var\s+ytInitialPlayerResponse\s*=\s*|window\["ytInitialPlayerResponse"\]\s*=\s*)(\{[\s\S]*?\});\s*<\/script>/);
  if (!match || !verifiedQtReplay(content)) return null;
  try {
    const data = JSON.parse(match[1]) as {
      playabilityStatus?: { status?: string; playableInEmbed?: boolean };
      videoDetails?: { videoId?: string; channelId?: string; title?: string; isUpcoming?: boolean; isLive?: boolean };
      microformat?: { playerMicroformatRenderer?: { publishDate?: string; uploadDate?: string } };
    };
    const metadata = data.microformat?.playerMicroformatRenderer;
    const details = data.videoDetails;
    if (data.playabilityStatus?.status !== "OK" || data.playabilityStatus.playableInEmbed === false ||
        details?.videoId !== id || details.channelId !== qtChannelIds[content] ||
        !qtChannels[content].pattern.test(details.title?.normalize("NFC") ?? "") ||
        details.isUpcoming || details.isLive) return null;
    const published = metadata?.publishDate;
    if (!published) return null;
    const at = Date.parse(published);
    if (!Number.isFinite(at)) return null;
    if (/^\d{4}-\d\d-\d\d$/.test(published)) {
      return new Date(at).toISOString().slice(0, 10) === published ? published : null;
    }
    return /(?:Z|[+-]\d\d:\d\d)$/u.test(published) ? qtKoreaDate(new Date(at)) : null;
  } catch { return null; }
}

export function resolveDatedQtCandidate(content: string, candidate: Candidate | null, watchDate: string | null, now = new Date()): QtReplay | null {
  if (!candidate || !verifiedQtReplay(content)) return null;
  const legacyScore = qtChannels[content].dated ? datedScore(candidate.title.normalize("NFC"), now) : null;
  const date = legacyScore === null ? watchDate : new Date(legacyScore).toISOString().slice(0, 10);
  return date && date <= qtKoreaDate(now) ? { id: candidate.id, date } : null;
}

export function chooseDatedQtVideo(content: string, candidate: Candidate | null, watchDate: string | null, now = new Date()): QtReplay | null {
  const seed = verifiedQtReplay(content);
  if (!seed) return null;
  const today = qtKoreaDate(now);
  const current = resolveDatedQtCandidate(content, candidate, watchDate, now);
  if (current && (seed.date > today || current.date >= seed.date)) return current;
  return seed.date <= today ? seed : null;
}

export function qtVideoTitle(content: string, video: QtReplay, now = new Date(), fallback = false): string {
  const [year, month, day] = video.date.split("-");
  return `${qtChannels[content].name} · ${year}년 ${Number(month)}월 ${Number(day)}일${!fallback && video.date === qtKoreaDate(now) ? "" : " 다시보기"}`;
}
