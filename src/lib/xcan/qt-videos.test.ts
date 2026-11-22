import { describe, expect, it } from "vitest";
import { chooseDatedQtVideo, findLatestQtVideo, parseQtWatchDate, qtChannels, resolveQtPlayback, qtVideoTitle, verifiedQtReplay } from "./qt-videos";

const now = new Date("2026-11-14T02:00:00Z");
function page(items: { id: string; title: string; detail?: string }[]) {
  const data = { items: items.map(({ id, title, detail = "1시간 전" }) => ({ lockupViewModel: {
    contentId: id, metadata: { lockupMetadataViewModel: { title: { content: title }, metadata: { text: detail } } },
  } })) };
  return `<script>var ytInitialData = ${JSON.stringify(data)};</script>`;
}
const v = (id: string, title: string, detail?: string) => ({ id, title, detail });

describe("findLatestQtVideo", () => {
  it("selects the most recent eligible date instead of tomorrow's pre-published QT", () => {
    const html = page([v("aaaaaaaaaaa", "「2026년 11월 15일 | 매일성경」"), v("bbbbbbbbbbb", "「2026년 11월 14일 | 매일성경」"), v("ccccccccccc", "「2026년 11월 13일 | 매일성경」")]);
    expect(findLatestQtVideo(html, qtChannels["1"], now)?.id).toBe("bbbbbbbbbbb");
    expect(findLatestQtVideo(page([v("aaaaaaaaaaa", "2026년 11월 13일 오늘의양식"), v("bbbbbbbbbbb", "2026년 11월 14일 오늘의양식")]), qtChannels["2"], now)?.id).toBe("bbbbbbbbbbb");
  });

  it("handles decomposed Korean titles and excludes shorts and unrelated videos", () => {
    const html = page([v("aaaaaaaaaaa", "날마다 기막힌 새벽 shorts #1"), v("bbbbbbbbbbb", "다른 강의"), v("ccccccccccc", "[날마다 기막힌 새벽 #2320] 묵상".normalize("NFD"))]);
    expect(findLatestQtVideo(html, qtChannels["3"], now)?.id).toBe("ccccccccccc");
  });

  it("matches month and day in the church series and excludes future dates", () => {
    const html = page([v("aaaaaaaaaaa", "[11월 15일] 매일의 묵상"), v("bbbbbbbbbbb", "[11월 14일] 매일의 묵상")]);
    expect(findLatestQtVideo(html, qtChannels["4"], now)?.id).toBe("bbbbbbbbbbb");
    expect(findLatestQtVideo(page([v("aaaaaaaaaaa", "[12월 31일] 매일의 묵상")]), qtChannels["4"], new Date("2027-01-01T02:00:00Z"))?.id).toBe("aaaaaaaaaaa");
  });

  it("skips members-only, scheduled, and unrelated items", () => {
    const html = page([v("aaaaaaaaaaa", "새롭게 하소서", "회원 전용"), v("bbbbbbbbbbb", "새롭게하소서", "예정"), v("ccccccccccc", "다른 영상"), v("ddddddddddd", "간증 이야기 | 새롭게하소서")]);
    expect(findLatestQtVideo(html, qtChannels["5"], now)?.id).toBe("ddddddddddd");
    expect(findLatestQtVideo("not a youtube page", qtChannels["5"], now)).toBeNull();
  });
});

describe("dated QT fallback", () => {
  const date = new Date("2026-11-22T00:00:00Z");
  it("keeps isolated verified replay for each series on source failure", () => {
    const ids = ["dN9P84jUjUo", "5woXUBKA3Po", "VpxYCqI8Ji0", "CJLl-kCTXIY", "UXTLRJDwPjs"];
    for (const [index, id] of ids.entries()) {
      const key = String(index + 1);
      expect(chooseDatedQtVideo(key, null, null, date)?.id).toBe(id);
    }
    expect(chooseDatedQtVideo("suwon", null, null, date)).toBeNull();
    expect(chooseDatedQtVideo("1", null, null, now)).toBeNull();
    expect(qtVideoTitle("1", verifiedQtReplay("1", date)!, date, true)).toContain("다시보기");
    expect(qtVideoTitle("3", verifiedQtReplay("3", date)!, date)).toContain("2026년 11월 21일 다시보기");
  });
  it("does not let an old result displace a known more recent episode", () => {
    const old = { id: "aaaaaaaaaaa", title: "2026년 11월 20일 매일성경", details: "2 days ago" };
    expect(chooseDatedQtVideo("1", old, null, date)?.id).toBe("dN9P84jUjUo");
  });
  it("prefers newer valid candidates but never tomorrow's dated publication", () => {
    const date = new Date("2026-11-23T00:00:00Z");
    const video = { id: "aaaaaaaaaaa", title: "2026년 11월 23일 매일성경", details: "1 day ago" };
    const future = { ...video, title: "2026년 11월 24일 매일성경" };
    expect(chooseDatedQtVideo("1", video, null, date)?.id).toBe(video.id);
    expect(chooseDatedQtVideo("1", future, null, date)?.id).toBe("RsYafE7AelU");
    expect(chooseDatedQtVideo("5", video, "2026-11-23", date)?.id).toBe(video.id);
  });
  it("does not accept an unrelated or non-embeddable watch page", () => {
    const page = (channelId: string, playableInEmbed = true) => `<script>var ytInitialPlayerResponse = ${JSON.stringify({
      playabilityStatus: {status: "OK", playableInEmbed}, videoDetails: {videoId: "UXTLRJDwPjs", channelId, title: "새롭게 하소서", lengthSeconds: "704"},
      microformat: {playerMicroformatRenderer: {publishDate: "2026-11-19T23:49:40-07:00"}},
    })};</script>`;
    expect(parseQtWatchDate(page("UCqCqf21juyyL_8peGs2CWGg"), "5", "UXTLRJDwPjs")).toBe("2026-11-20");
    expect(parseQtWatchDate(page("UCqCqf21juyyL_8peGs2CWGg", false), "5", "UXTLRJDwPjs")).toBeNull();
    expect(parseQtWatchDate(page("wrong"), "5", "UXTLRJDwPjs")).toBeNull();
  });
});

describe("QT listing and RSS candidates require verified watch content", () => {
  const time = new Date("2026-11-22T22:01:00Z");
  const ytWatch = (id: string, channelId: string, title: string, published: string, lengthSeconds = "673") => `<script>window['ytInitialPlayerResponse'] = ${JSON.stringify({
    playabilityStatus: { status: "OK", playableInEmbed: true },
    videoDetails: { videoId: id, channelId, title, lengthSeconds, shortDescription: '{말씀} "인용"' },
    microformat: { playerMicroformatRenderer: { publishDate: published } },
  })}; var following = true;</script>`;
  const rss = (id: string, title: string) => `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title></entry>`;

  it("verifies RSS when listing is unavailable and preserves a prepublished editorial date", async () => {
    const id = "RsYafE7AelU";
    const title = "2026년 11월 23일 매일성경";
    const found = await resolveQtPlayback("1", "", rss(id, title), time, async () =>
      ytWatch(id, "UCroCQn7T3UZsE8N5oyaIP1w", title, "2026-11-21T15:00:28Z"));
    expect(found).toEqual({ id, date: "2026-11-23" });
  });
  it("does not stop at an invalid highest-ranked result; rejects future, wrong channel and no duration", async () => {
    const list = page([v("aaaaaaaaaaa", "2026년 11월 24일 매일성경"), v("bbbbbbbbbbb", "2026년 11월 23일 매일성경"),
      v("ccccccccccc", "2026년 11월 23일 매일성경"), v("RsYafE7AelU", "2026년 11월 23일 매일성경")]).replace(";</script>", "; var following = true;</script>");
    const calls: string[] = [];
    const found = await resolveQtPlayback("1", list, rss("RsYafE7AelU", "2026년 11월 23일 매일성경"), time, async (url) => {
      const id = url.slice(-11);
      calls.push(id);
      return ytWatch(id, id === "bbbbbbbbbbb" ? "wrong" : "UCroCQn7T3UZsE8N5oyaIP1w", "2026년 11월 23일 매일성경", "2026-11-21T15:00:28Z", id === "ccccccccccc" ? "0" : "673");
    });
    expect(found?.id).toBe("RsYafE7AelU");
    expect(calls).toEqual(["bbbbbbbbbbb", "ccccccccccc", "RsYafE7AelU"]);
  });
  it("uses latest verified Korean publish date on undated series and does not leak IDs across series", async () => {
    const id = "VEuB3QNUjuM";
    const title = "[날마다 기막힌 새벽 #2327]".normalize("NFD");
    const found = await resolveQtPlayback("3", "", rss(id, title), time, async () => ytWatch(id, "UCARPvkMDoPEECp3hMU1eXwQ", title, "2026-11-22T21:00:19Z", "1118"));
    expect(found).toEqual({ id, date: "2026-11-23" });
    expect(await resolveQtPlayback("4", "", rss(id, title), time, async () => "")).toBeNull();
  });
});
