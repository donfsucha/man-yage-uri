import { describe, expect, it } from "vitest";
import { chooseSuwonWorship, findDatedSuwonFeedWorship, findLatestSuwonStream, findTodaySuwonWorship, isSuwonDawnWindow, parseSuwonWatchWorship, resolveSuwonPlayback, suwonWorshipTitle } from "./suwon-worship";

const entry = (title: string, date: string, id = "qVqgT2ju4mc") => `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><media:description>${date}</media:description></entry>`;
const now = new Date("2026-11-11T22:00:00Z");

describe("findTodaySuwonWorship", () => {
  it("selects today's worship date in Korea, not another service or yesterday", () => {
    const xml = entry("수원제일교회 수요찬양예배", "26년 11월 12일") +
      entry("수원제일교회 새벽기도회", "26년 11월 11일") +
      entry("수원제일교회 새벽기도회", "26년 11월 12일");
    expect(findTodaySuwonWorship(xml, now)).toBe("https://www.youtube.com/watch?v=qVqgT2ju4mc");
  });

  it("falls back to the most recent dated worship, excluding future videos", () => {
    const xml = entry("새벽기도회", "26년 11월 13일", "aaaaaaaaaaa") +
      entry("새벽기도회", "26년 11월 10일", "bbbbbbbbbbb") +
      entry("새벽기도회", "26년 11월 11일");
    expect(findTodaySuwonWorship(xml, now)).toBe("https://www.youtube.com/watch?v=qVqgT2ju4mc");
  });

  it("does not select an undated or unrelated video", () => {
    expect(findTodaySuwonWorship(entry("새벽기도회", ""), now)).toBeNull();
    expect(findTodaySuwonWorship(entry("수요찬양예배", "26년 11월 12일"), now)).toBeNull();
  });
});

describe("findLatestSuwonStream", () => {
  it("finds a completed worship in the channel page and skips scheduled streams", () => {
    const video = (id: string, title: string, details: string) => ({ lockupViewModel: { contentId: id, metadata: { lockupMetadataViewModel: { title: { content: title }, metadata: { text: details } } } } });
    const data = { items: [video("aaaaaaaaaaa", "새벽기도회", "Scheduled"), video("bbbbbbbbbbb", "수요예배", "Streamed 1 day ago"), video("qVqgT2ju4mc", "수원제일교회 새벽기도회", "Streamed 1 day ago")] };
    expect(findLatestSuwonStream(`<script>var ytInitialData = ${JSON.stringify(data)};</script>`)).toBe("https://www.youtube.com/watch?v=qVqgT2ju4mc");
  });
});

describe("dated Suwon worship fallback", () => {
  const fixtureReplay = { videoId: "rx3AhCrltVM", date: "2026-11-20", live: false };
  const november22 = new Date("2026-11-21T22:00:00Z");
  const replayPage = (date: string, channelId = "UCpT3ZKDtCRX67Knkzl7Uc6w", extra = {}) => `<script>var ytInitialPlayerResponse = ${JSON.stringify({playabilityStatus: {status: "OK", playableInEmbed: true}, videoDetails: {videoId: "rx3AhCrltVM", channelId, title: "수원제일교회 새벽기도회", shortDescription: date, lengthSeconds: "2700", ...extra}})};</script>`;

  it("keeps only confirmed past/current dawn entries and respects KST", () => {
    const xml = entry("새벽기도회", "26년 11월 23일", "aaaaaaaaaaa") +
      entry("새벽기도회", "26년 11월 31일", "bbbbbbbbbbb") +
      entry("새벽기도회", "26년 11월 21일", "ccccccccccc") +
      entry("수요예배", "26년 11월 22일", "ddddddddddd") +
      entry("26년 11월 22일 새벽기도회", "", "eeeeeeeeeee");
    expect(findDatedSuwonFeedWorship(xml, november22)).toEqual({videoId: "eeeeeeeeeee", date: "2026-11-22", live: false});
  });

  it("uses verified dated replay when no upstream candidate can be used", () => {
    const result = chooseSuwonWorship([null, null, fixtureReplay], november22)!;
    expect(result).toEqual(fixtureReplay);
    expect(suwonWorshipTitle(result, november22)).toContain("2026년 11월 20일 다시보기");
  });

  it("prefers today's verified video or a genuinely live stream over the seed", () => {
    const today = {videoId: "eeeeeeeeeee", date: "2026-11-22", live: false};
    const live = {videoId: "ddddddddddd", date: null, live: true};
    expect(chooseSuwonWorship([fixtureReplay, today], november22)).toEqual(today);
    expect(suwonWorshipTitle(today, november22)).not.toContain("다시보기");
    expect(suwonWorshipTitle(today, november22, true)).toContain("다시보기");
    expect(chooseSuwonWorship([today, live, fixtureReplay], november22)).toEqual(live);
    expect(suwonWorshipTitle(live, november22)).toContain("실시간");
  });

  it("discovers an explicitly live stream without a relative upload time", () => {
    const live = {items: [{lockupViewModel: {
      contentId: "rx3AhCrltVM", metadata: {lockupMetadataViewModel: {title: {content: "새벽기도회"}}},
      contentImage: {badge: {style: "LIVE_NOW"}},
    }}]};
    expect(findLatestSuwonStream(`<script>var ytInitialData = ${JSON.stringify(live)};</script>`)).toBe("https://www.youtube.com/watch?v=rx3AhCrltVM");
  });

  it("checks the watch-page identity, date and broadcast state", () => {
    expect(parseSuwonWatchWorship(replayPage("26년 11월 20일 금요일 새벽기도회"), "rx3AhCrltVM")).toEqual(fixtureReplay);
    expect(parseSuwonWatchWorship(replayPage("26년 11월 20일", "wrong"), "rx3AhCrltVM")).toBeNull();
    expect(parseSuwonWatchWorship(replayPage(""), "rx3AhCrltVM")).toBeNull();
    expect(parseSuwonWatchWorship(replayPage("", undefined, {isUpcoming: true}), "rx3AhCrltVM")).toBeNull();
  });
});

describe("Suwon discovery and watch verification", () => {
  const time = new Date("2026-11-22T22:01:00Z");
  const date = "26년 11월 23일";
  const watch = (videoId: string, status: string, duration: string, live = false) => `<script>window["ytInitialPlayerResponse"] = ${JSON.stringify({
    playabilityStatus: { status, playableInEmbed: status === "OK" },
    videoDetails: { videoId, channelId: "UCpT3ZKDtCRX67Knkzl7Uc6w", title: '수원제일교회 새벽기도회', shortDescription: `${date} {말씀} "인용"`, lengthSeconds: duration },
    microformat: { playerMicroformatRenderer: { liveBroadcastDetails: { isLiveNow: live } } },
  })}; var following = true;</script>`;

  it("skips same-date offline zero-length RSS entry and continues to completed 2703-second replay", async () => {
    const feed = entry("새벽기도회", date, "fiQpNKbegYw") + entry("새벽기도회", date, "RPCDnFNlM7Q");
    const found = await resolveSuwonPlayback("", feed, time, async (url) => url.endsWith("fiQpNKbegYw")
      ? watch("fiQpNKbegYw", "LIVE_STREAM_OFFLINE", "0")
      : watch("RPCDnFNlM7Q", "OK", "2703"));
    expect(found).toEqual({ videoId: "RPCDnFNlM7Q", date: "2026-11-23", live: false });
    expect(parseSuwonWatchWorship(watch("fiQpNKbegYw", "OK", "0"), "fiQpNKbegYw")).toBeNull();
    expect(parseSuwonWatchWorship(watch("fiQpNKbegYw", "OK", "0", true), "fiQpNKbegYw")?.live).toBe(true);
  });

  it("accepts listing JSON followed by another statement and leaves fallback on malformed watch", async () => {
    const data = {items: [{lockupViewModel: {contentId: "RPCDnFNlM7Q", metadata: {lockupMetadataViewModel: {
      title: {content: '새벽기도회 {말씀} "인용"'}, metadata: {text: "Streamed 2 hours ago"},
    }}}}]};
    const streams = `<script>var ytInitialData = ${JSON.stringify(data)}; var following = true;</script>`;
    expect(findLatestSuwonStream(streams)).toBe("https://www.youtube.com/watch?v=RPCDnFNlM7Q");
    expect(await resolveSuwonPlayback(streams, "", time, async () => '<script>var ytInitialPlayerResponse = {</script>')).toBeNull();
  });
});

const november27 = new Date("2026-11-26T20:15:00Z");
const current = "testLIVE000";
const previous = "testPAST000";
const future = "testNEXT000";
const channel = "UCpT3ZKDtCRX67Knkzl7Uc6w";
const listing = (ids: string[]) => `<script>var ytInitialData = ${JSON.stringify({ items: ids.map(videoId => ({
  videoRenderer: { videoId, title: { runs: [{ text: "수원제일교회 새벽기도회" }] } },
})) })};</script>`;
function watch(id: string, mode: "live" | "ended" | "pending" | "upcoming", owner = channel) {
  return `<script>var ytInitialPlayerResponse = ${JSON.stringify({
    playabilityStatus: { status: "OK", playableInEmbed: true },
    videoDetails: { videoId: id, channelId: owner, title: "수원제일교회 새벽기도회",
      lengthSeconds: "2872", isLive: mode === "live", isUpcoming: mode === "upcoming" },
    microformat: { playerMicroformatRenderer: { liveBroadcastDetails: {
      isLiveNow: mode === "live",
      startTimestamp: id === previous ? "2026-11-25T20:11:00Z" : "2026-11-26T20:11:00Z",
      ...(mode === "ended" ? { endTimestamp: "2026-11-26T21:04:00Z" } : {}),
    } } },
  })};</script>`;
}
const reader = (mapping: Record<string, string>) => async (url: string) =>
  mapping[url.endsWith("/live") ? "/live" : new URL(url).searchParams.get("v") ?? ""] ?? "";

describe("Suwon dawn playback", () => {
  it("uses Seoul time and checks before and after the expected start", () => {
    expect(isSuwonDawnWindow(november27)).toBe(true);
    expect(isSuwonDawnWindow(new Date("2026-11-26T19:59:00Z"))).toBe(true);
    expect(isSuwonDawnWindow(new Date("2026-11-27T00:00:00Z"))).toBe(false);
  });
  it("uses the direct verified live even before the listing loads", async () => {
    const result = await resolveSuwonPlayback(new Promise<string>(() => {}), "", november27, reader({ "/live": watch(current, "live") }));
    expect(result).toEqual({ videoId: current, live: true, date: "2026-11-27" });
    expect(suwonWorshipTitle(result!, november27, true)).toContain("실시간");
  });
  it("falls back to the listing if the live endpoint is silent", async () => {
    const result = await resolveSuwonPlayback(listing([future, previous, current]), "", november27, reader({
      [future]: watch(future, "upcoming"), [previous]: watch(previous, "ended"), [current]: watch(current, "live"),
    }));
    expect(result?.videoId).toBe(current);
    expect(result?.live).toBe(true);
  });
  it("returns the same video as replay after YouTube confirms it ended", async () => {
    const later = new Date("2026-11-26T21:05:00Z");
    const result = await resolveSuwonPlayback(listing([previous, current]), "", later, reader({
      [previous]: watch(previous, "ended"), [current]: watch(current, "ended"),
    }));
    expect(result).toEqual({ videoId: current, live: false, date: "2026-11-27" });
    expect(suwonWorshipTitle(result!, later, true)).toContain("다시보기");
  });
  it("does not call a pending recording a replay or use other channels", async () => {
    const result = await resolveSuwonPlayback(listing([current, future, previous]), "", november27, reader({
      [current]: watch(current, "pending"), [future]: watch(future, "live", "different-channel"), [previous]: watch(previous, "ended"),
    }));
    expect(result?.videoId).toBe(previous);
    expect(result?.live).toBe(false);
  });
  it("ignores a live endpoint pointing at a previous date", async () => {
    expect(await resolveSuwonPlayback("", "", november27, reader({ "/live": watch(previous, "live") }))).toBeNull();
  });
});
