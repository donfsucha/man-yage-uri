import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CGN_CHANNEL_ID, CGN_CHANNEL_URL, CGN_FEED_URL, findLatestLivingLifeVideo, getKoreaDate, getTitleDate, parseYouTubeChannel, replaceYoutubeVideoId, updateLivingLifeVideo } from "./living-life-video.mjs";

const todayId = "NMURQIy-IwU";
const oldId = "CXvodE36k1w";
const title = "[생명의 삶 큐티] 하나님을 찾는 것이 살길입니다 | 아모스 5:1~6 | 변대섭 목사 | 261110";
const now = new Date("2026-11-09T15:05:00Z");
const metadata = (overrides = {}) => ({ title, author_url: "https://www.youtube.com/@cgn8459", ...overrides });
const okJson = (value) => ({ ok: true, json: async () => value });
const okText = (value) => ({ ok: true, text: async () => value });
const feed = (entryTitle = title, id = todayId) => `<feed><entry><title>${entryTitle}</title><link href="https://www.youtube.com/watch?v=${id}" /></entry></feed>`;
const channel = (items, channelId = CGN_CHANNEL_ID) => `<script>var ytInitialData = ${JSON.stringify({ metadata: { channelMetadataRenderer: { externalId: channelId } }, contents: items })};</script>`;
const modern = (id = todayId, entryTitle = title, overlays = []) => ({ lockupViewModel: { contentId: id, contentType: "LOCKUP_CONTENT_TYPE_VIDEO", metadata: { lockupMetadataViewModel: { title: { content: entryTitle } } }, contentImage: { thumbnailViewModel: { overlays } } } });

describe("Living Life video identification", () => {
  it("keeps the page copy free of replacement question marks", () => {
    expect(readFileSync(join(process.cwd(), "src/app/l/page.tsx"), "utf8")).not.toMatch(/\{"[^"\n]*\?{2,}[^"\n]*"\}/);
  });
  it("selects a Living Life feed item matching the Korean date", () => {
    const xml = feed("[다른 영상] 261110") + feed("[생명의 삶 큐티] 261111", oldId) + feed();
    expect(findLatestLivingLifeVideo(xml, { targetDate: "2026-11-10" })).toEqual({ title, videoId: todayId, url: `https://www.youtube.com/watch?v=${todayId}` });
  });
  it("uses the Korean day at the UTC date boundary", () => {
    expect(getKoreaDate(now)).toBe("2026-11-10");
    expect(getTitleDate("생명의 삶 261018QT")).toBe("2026-10-18");
    expect(getTitleDate("생명의 삶 12611100")).toBeNull();
  });
  it("replaces only the configured ID and rejects malformed IDs", () => {
    const source = `const youtubeVideoId = "${oldId}";\nconst title = "생명의 삶";\n`;
    expect(replaceYoutubeVideoId(source, todayId)).toBe(source.replace(oldId, todayId));
    expect(() => replaceYoutubeVideoId(source, "invalid")).toThrow("Invalid YouTube video ID");
  });
  it("parses both channel layouts and skips upcoming videos", () => {
    const html = channel([
      modern(todayId, `${title} {"quoted"}`),
      { videoRenderer: { videoId: oldId, title: { runs: [{ text: "생명의 삶 261109" }] } } },
      modern("lds90VOD3Ek", title, [{ badge: { style: "UPCOMING" } }]),
      { videoRenderer: { videoId: "m53tT2h0Avs", title: { simpleText: title }, upcomingEventData: {} } },
    ]);
    expect(parseYouTubeChannel(html).map(v => v.videoId)).toEqual([todayId, oldId]);
  });
  it("refuses another channel and incomplete embedded JSON", () => {
    expect(() => parseYouTubeChannel(channel([modern()], "another-channel"))).toThrow("Unexpected YouTube channel");
    expect(() => parseYouTubeChannel('var ytInitialData = {"contents":')).toThrow("incomplete");
  });
});

describe("date-verified CGN recovery", () => {
  const directories = [];
  function createPage(id = oldId) {
    const directory = mkdtempSync(join(tmpdir(), "living-life-video-"));
    directories.push(directory);
    const pagePath = join(directory, "page.tsx");
    writeFileSync(pagePath, `const youtubeVideoId = "${id}";\n`);
    return pagePath;
  }
  afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
  const noWait = () => vi.fn().mockResolvedValue(undefined);
  function remote({ rss = okText(feed()), channelResponse = okText(channel([modern()])), info = metadata() } = {}) {
    return vi.fn(async (url) => {
      if (url === CGN_FEED_URL) return rss;
      if (url === CGN_CHANNEL_URL) return channelResponse;
      const id = new URL(new URL(url).searchParams.get("url")).searchParams.get("v");
      return okJson(id === todayId ? info : metadata({ title: "[생명의 삶 큐티] 261109" }));
    });
  }
  it("checks an already-current video without relying on the broken RSS feed", async () => {
    const pagePath = createPage(todayId);
    const fetchImpl = remote({ rss: { ok: false, status: 404 } });
    expect(await updateLivingLifeVideo({ pagePath, fetchImpl, now })).toMatchObject({ changed: false, source: "current-video", targetDate: "2026-11-10" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("falls back from persistent RSS 404 to the official channel", async () => {
    const pagePath = createPage();
    const fetchImpl = remote({ rss: { ok: false, status: 404 } });
    const waitImpl = noWait();
    expect(await updateLivingLifeVideo({ pagePath, fetchImpl, waitImpl, now })).toMatchObject({ changed: true, videoId: todayId, source: "youtube-channel" });
    expect(waitImpl.mock.calls.map(([delay]) => delay)).toEqual([1000, 2000]);
    expect(readFileSync(pagePath, "utf8")).toBe(`const youtubeVideoId = "${todayId}";\n`);
  });
  it("recovers from network and transient HTTP failures", async () => {
    const pagePath = createPage();
    const fetchImpl = remote();
    fetchImpl.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce({ ok: false, status: 503 });
    const waitImpl = noWait();
    expect(await updateLivingLifeVideo({ pagePath, fetchImpl, waitImpl, now, forceDiscovery: true })).toMatchObject({ changed: true, source: "youtube-rss" });
    expect(waitImpl.mock.calls.map(([delay]) => delay)).toEqual([1000, 2000]);
  });
  it.each([
    ["another channel", metadata({ author_url: "https://www.youtube.com/@imposter" })],
    ["yesterday", metadata({ title: "[생명의 삶 큐티] 261109" })],
    ["tomorrow", metadata({ title: "[생명의 삶 큐티] 261111" })],
    ["short", metadata({ title: "[생명의 삶 큐티] 쇼츠 261110" })],
  ])("preserves the current page when verification finds %s", async (_, info) => {
    const pagePath = createPage();
    await expect(updateLivingLifeVideo({ pagePath, fetchImpl: remote({ info }), waitImpl: noWait(), now })).rejects.toThrow("current link preserved");
    expect(readFileSync(pagePath, "utf8")).toBe(`const youtubeVideoId = "${oldId}";\n`);
  });
  it("preserves the current link when today's video is unavailable", async () => {
    const pagePath = createPage();
    const fetchImpl = remote({ rss: okText(feed("[생명의 삶 큐티] 261109", oldId)), channelResponse: okText(channel([modern(oldId, "생명의 삶 261109")])) });
    await expect(updateLivingLifeVideo({ pagePath, fetchImpl, now })).rejects.toThrow("No verified CGN Living Life video for 2026-11-10");
    expect(readFileSync(pagePath, "utf8")).toContain(oldId);
  });
  it("reports permanent errors without retrying or editing", async () => {
    const pagePath = createPage();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    const waitImpl = noWait();
    await expect(updateLivingLifeVideo({ pagePath, fetchImpl, waitImpl, now, forceDiscovery: true })).rejects.toThrow("HTTP 403");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(waitImpl).not.toHaveBeenCalled();
    expect(readFileSync(pagePath, "utf8")).toContain(oldId);
  });
  it("can audit discovery without writing the ID", async () => {
    const pagePath = createPage();
    expect(await updateLivingLifeVideo({ pagePath, fetchImpl: remote(), now, forceDiscovery: true, dryRun: true })).toMatchObject({ changed: true, dryRun: true, videoId: todayId });
    expect(readFileSync(pagePath, "utf8")).toContain(oldId);
  });
});
