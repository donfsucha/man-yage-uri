import { describe, expect, it } from "vitest";
import { chooseSuwonWorship, findDatedSuwonFeedWorship, findLatestSuwonStream, findTodaySuwonWorship, parseSuwonWatchWorship, suwonWorshipTitle, verifiedSuwonReplay } from "./suwon-worship";

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
  const november22 = new Date("2026-11-21T22:00:00Z");
  const replayPage = (date: string, channelId = "UCpT3ZKDtCRX67Knkzl7Uc6w", extra = {}) => `<script>var ytInitialPlayerResponse = ${JSON.stringify({playabilityStatus: {status: "OK", playableInEmbed: true}, videoDetails: {videoId: "rx3AhCrltVM", channelId, title: "수원제일교회 새벽기도회", shortDescription: date, ...extra}})};</script>`;

  it("keeps only confirmed past/current dawn entries and respects KST", () => {
    const xml = entry("새벽기도회", "26년 11월 23일", "aaaaaaaaaaa") +
      entry("새벽기도회", "26년 11월 31일", "bbbbbbbbbbb") +
      entry("새벽기도회", "26년 11월 21일", "ccccccccccc") +
      entry("수요예배", "26년 11월 22일", "ddddddddddd") +
      entry("26년 11월 22일 새벽기도회", "", "eeeeeeeeeee");
    expect(findDatedSuwonFeedWorship(xml, november22)).toEqual({videoId: "eeeeeeeeeee", date: "2026-11-22", live: false});
  });

  it("uses verified dated replay when no upstream candidate can be used", () => {
    const result = chooseSuwonWorship([null, null, verifiedSuwonReplay], november22)!;
    expect(result).toEqual(verifiedSuwonReplay);
    expect(suwonWorshipTitle(result, november22)).toContain("2026년 11월 20일 다시보기");
  });

  it("prefers today's verified video or a genuinely live stream over the seed", () => {
    const today = {videoId: "eeeeeeeeeee", date: "2026-11-22", live: false};
    const live = {videoId: "ddddddddddd", date: null, live: true};
    expect(chooseSuwonWorship([verifiedSuwonReplay, today], november22)).toEqual(today);
    expect(suwonWorshipTitle(today, november22)).not.toContain("다시보기");
    expect(suwonWorshipTitle(today, november22, true)).toContain("다시보기");
    expect(chooseSuwonWorship([today, live, verifiedSuwonReplay], november22)).toEqual(live);
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
    expect(parseSuwonWatchWorship(replayPage("26년 11월 20일 금요일 새벽기도회"), "rx3AhCrltVM")).toEqual(verifiedSuwonReplay);
    expect(parseSuwonWatchWorship(replayPage("26년 11월 20일", "wrong"), "rx3AhCrltVM")).toBeNull();
    expect(parseSuwonWatchWorship(replayPage(""), "rx3AhCrltVM")).toBeNull();
    expect(parseSuwonWatchWorship(replayPage("", undefined, {isUpcoming: true}), "rx3AhCrltVM")).toBeNull();
  });
});
