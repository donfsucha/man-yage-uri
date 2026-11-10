import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as wait } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export const CGN_CHANNEL_ID = "UCbaI7e7lhkfLSdMUfd5Fy0Q";
export const CGN_FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CGN_CHANNEL_ID}`;
export const CGN_CHANNEL_URL = "https://www.youtube.com/@cgn8459/videos";

const DEFAULT_PAGE_PATH = "src/app/l/page.tsx";
const LIVING_LIFE_TITLE_PATTERN = /\uC0DD\uBA85\uC758\s*\uC0B6/u;

function decodeXmlText(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getVideoId(url) {
  const parsed = new URL(url);

  if (parsed.hostname === "youtu.be") {
    return parsed.pathname.slice(1);
  }

  return parsed.searchParams.get("v");
}

export function parseYouTubeFeed(feedXml) {
  return [...feedXml.matchAll(/<entry\b[\s\S]*?<\/entry>/g)].map(
    ([entry]) => {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
      const href = entry.match(/<link\b[^>]*href="([^"]+)"/)?.[1]?.trim();

      return {
        title: title ? decodeXmlText(title) : "",
        url: href ? decodeXmlText(href) : "",
      };
    },
  );
}

export function findLatestLivingLifeVideo(feedXml, { targetDate } = {}) {
  const latest = parseYouTubeFeed(feedXml).find(
    (entry) => LIVING_LIFE_TITLE_PATTERN.test(entry.title) && entry.url &&
      (!targetDate || getTitleDate(entry.title) === targetDate),
  );

  if (!latest) {
    throw new Error("No Living Life video found in the CGN YouTube feed.");
  }

  const videoId = getVideoId(latest.url);

  if (!videoId) {
    throw new Error(`Could not extract a YouTube video ID from ${latest.url}`);
  }

  return {
    title: latest.title,
    url: latest.url,
    videoId,
  };
}

export function replaceYoutubeVideoId(source, videoId) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error("Invalid YouTube video ID");
  const nextSource = source.replace(
    /(const\s+youtubeVideoId\s*=\s*")[^"]+(";)/,
    `$1${videoId}$2`,
  );

  if (nextSource === source && !source.includes(`"${videoId}"`)) {
    throw new Error("Could not find const youtubeVideoId in the Living Life page.");
  }

  return nextSource;
}

export function getKoreaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function getTitleDate(title) {
  const match = /(?:^|\D)(\d{2})(\d{2})(\d{2})(?!\d)/.exec(title);
  return match ? `20${match[1]}-${match[2]}-${match[3]}` : null;
}

function extractInitialData(html) {
  const match = /(?:var\s+)?ytInitialData\s*=\s*|window\["ytInitialData"\]\s*=\s*/.exec(html);
  if (!match) throw new Error("YouTube channel data is missing");
  const start = match.index + match[0].length;
  let depth = 0, quoted = false, escaped = false;
  for (let end = start; end < html.length; end += 1) {
    const char = html[end];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return JSON.parse(html.slice(start, end + 1));
  }
  throw new Error("YouTube channel data is incomplete");
}

export function parseYouTubeChannel(html) {
  const data = extractInitialData(html);
  if (data.metadata?.channelMetadataRenderer?.externalId !== CGN_CHANNEL_ID) throw new Error("Unexpected YouTube channel");
  const entries = new Map();
  const add = (videoId, title, upcoming) => {
    if (/^[A-Za-z0-9_-]{11}$/.test(videoId || "") && title && !upcoming) entries.set(videoId, { videoId, title, url: `https://www.youtube.com/watch?v=${videoId}` });
  };
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    if (value.videoRenderer) {
      const video = value.videoRenderer;
      add(video.videoId, video.title?.simpleText ?? video.title?.runs?.map(run => run.text).join(""), Boolean(video.upcomingEventData));
    }
    if (value.lockupViewModel?.contentType === "LOCKUP_CONTENT_TYPE_VIDEO") {
      const video = value.lockupViewModel;
      const badges = JSON.stringify(video.contentImage?.thumbnailViewModel?.overlays ?? []);
      add(video.contentId, video.metadata?.lockupMetadataViewModel?.title?.content, /UPCOMING|최초 공개 예정|방송 예정/.test(badges));
    }
    for (const child of Object.values(value)) walk(child);
  };
  walk(data);
  return [...entries.values()];
}

async function request(url, fetchImpl, waitImpl) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(url, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; XCANLivingLifeUpdater/1.0)", "Accept-Language": "ko-KR,ko;q=0.9" },
      });
    } catch (error) {
      if (attempt === 2) throw error;
    }
    if (response?.ok) return response;
    if (response) {
      const retryable = [404, 408, 429].includes(response.status) || response.status >= 500;
      if (!retryable || attempt === 2) throw new Error(`Could not fetch ${new URL(url).pathname}: HTTP ${response.status}`);
    }
    await waitImpl(1000 * 2 ** attempt);
  }
}

async function verifiedVideo(videoId, targetDate, fetchImpl, waitImpl) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || "")) throw new Error("Invalid YouTube video ID");
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await request(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, fetchImpl, waitImpl);
  const metadata = await response.json();
  if (metadata.author_url?.replace(/\/$/, "") !== "https://www.youtube.com/@cgn8459") throw new Error("Video is not from the official CGN Living Life channel");
  if (!LIVING_LIFE_TITLE_PATTERN.test(metadata.title) || getTitleDate(metadata.title) !== targetDate || /shorts|쇼츠/i.test(metadata.title)) throw new Error(`Video does not match Korean date ${targetDate}`);
  return { videoId, url, title: metadata.title };
}

export async function updateLivingLifeVideo({
  fetchImpl = fetch,
  pagePath = DEFAULT_PAGE_PATH,
  waitImpl = wait,
  now = new Date(),
  forceDiscovery = false,
  dryRun = false,
} = {}) {
  const currentSource = readFileSync(pagePath, "utf8");
  const currentId = currentSource.match(/const\s+youtubeVideoId\s*=\s*"([^"]+)";/)?.[1];
  const targetDate = getKoreaDate(now);
  if (!forceDiscovery && currentId) {
    try {
      const current = await verifiedVideo(currentId, targetDate, fetchImpl, waitImpl);
      return { ...current, targetDate, source: "current-video", changed: false };
    } catch { /* Discover today's official video when the current one is stale or unverifiable. */ }
  }
  const errors = [];
  let latestVideo, source;
  for (const endpoint of ["youtube-rss", "youtube-channel"]) {
    try {
      const response = await request(endpoint === "youtube-rss" ? CGN_FEED_URL : CGN_CHANNEL_URL, fetchImpl, waitImpl);
      const body = await response.text();
      const entries = endpoint === "youtube-rss" ? parseYouTubeFeed(body).map(entry => ({ ...entry, videoId: getVideoId(entry.url) })) : parseYouTubeChannel(body);
      const candidates = entries.filter(entry => LIVING_LIFE_TITLE_PATTERN.test(entry.title) && getTitleDate(entry.title) === targetDate && !/shorts|쇼츠/i.test(entry.title));
      if (!candidates.length) throw new Error(`No Living Life video for ${targetDate}`);
      for (const candidate of candidates) {
        try { latestVideo = await verifiedVideo(candidate.videoId, targetDate, fetchImpl, waitImpl); break; }
        catch (error) { errors.push(error.message); }
      }
      if (latestVideo) { source = endpoint; break; }
    } catch (error) { errors.push(`${endpoint}: ${error.message}`); }
  }
  if (!latestVideo) throw new Error(`No verified CGN Living Life video for ${targetDate}; current link preserved. ${errors.join(" | ")}`);
  const nextSource = replaceYoutubeVideoId(currentSource, latestVideo.videoId);
  if (nextSource !== currentSource && !dryRun) {
    writeFileSync(pagePath, nextSource);
  }
  return { ...latestVideo, targetDate, source, changed: nextSource !== currentSource, dryRun };
}

async function main() {
  const result = await updateLivingLifeVideo();
  const status = result.changed ? "updated" : "already-current";

  console.log(`${result.targetDate} ${status} [${result.source}]: ${result.title}`);
  console.log(result.url);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
