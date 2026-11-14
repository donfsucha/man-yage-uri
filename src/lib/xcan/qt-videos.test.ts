import { describe, expect, it } from "vitest";
import { findLatestQtVideo, qtChannels } from "./qt-videos";

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
