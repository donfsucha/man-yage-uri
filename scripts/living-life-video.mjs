import { readFileSync, writeFileSync } from "node:fs";
import { setTimeout as wait } from "node:timers/promises";
import { pathToFileURL } from "node:url";

export const CGN_FEED_URL =
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCbaI7e7lhkfLSdMUfd5Fy0Q";

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

export function findLatestLivingLifeVideo(feedXml) {
  const latest = parseYouTubeFeed(feedXml).find(
    (entry) => LIVING_LIFE_TITLE_PATTERN.test(entry.title) && entry.url,
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
  const nextSource = source.replace(
    /(const\s+youtubeVideoId\s*=\s*")[^"]+(";)/,
    `$1${videoId}$2`,
  );

  if (nextSource === source && !source.includes(`"${videoId}"`)) {
    throw new Error("Could not find const youtubeVideoId in the Living Life page.");
  }

  return nextSource;
}

async function fetchCgnFeed(fetchImpl, waitImpl) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;
    try {
      response = await fetchImpl(CGN_FEED_URL, {
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      if (attempt === 4) throw error;
    }

    if (response?.ok) return response.text();

    if (response) {
      // YouTube sometimes returns a temporary 404 for an existing channel feed.
      const retryable = [404, 408, 429].includes(response.status) || response.status >= 500;
      if (!retryable || attempt === 4) {
        throw new Error(`Could not fetch CGN feed: HTTP ${response.status}`);
      }
    }

    await waitImpl(1000 * 2 ** attempt);
  }
}

export async function updateLivingLifeVideo({
  fetchImpl = fetch,
  pagePath = DEFAULT_PAGE_PATH,
  waitImpl = wait,
} = {}) {
  const latestVideo = findLatestLivingLifeVideo(await fetchCgnFeed(fetchImpl, waitImpl));
  const currentSource = readFileSync(pagePath, "utf8");
  const nextSource = replaceYoutubeVideoId(currentSource, latestVideo.videoId);

  if (nextSource !== currentSource) {
    writeFileSync(pagePath, nextSource);
  }

  return {
    ...latestVideo,
    changed: nextSource !== currentSource,
  };
}

async function main() {
  const result = await updateLivingLifeVideo();
  const status = result.changed ? "updated" : "already-current";

  console.log(`${status}: ${result.title}`);
  console.log(result.url);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
