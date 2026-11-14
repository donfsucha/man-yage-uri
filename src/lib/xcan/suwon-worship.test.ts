import { describe, expect, it } from "vitest";
import { findLatestSuwonStream, findTodaySuwonWorship } from "./suwon-worship";

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
