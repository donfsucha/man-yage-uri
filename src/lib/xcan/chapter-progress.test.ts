import { describe, expect, it } from "vitest";
import { koreanBibleVideos } from "./bible-reading";
import { allBibleChapters, bibleBooks, chapterRangesForVideo } from "./chapter-progress";

describe("Bible chapter catalogue", () => {
  it("covers all 1189 chapters of 66 books exactly once across the 365 videos", () => {
    expect(bibleBooks).toHaveLength(66);
    expect(allBibleChapters).toHaveLength(1189);
    expect(koreanBibleVideos).toHaveLength(365);
    expect(new Set(koreanBibleVideos.map((v) => v.day)).size).toBe(365);
    const keys = koreanBibleVideos.flatMap(chapterRangesForVideo).map((c) => c.key);
    expect(keys).toHaveLength(1189);
    expect(new Set(keys).size).toBe(1189);
    expect([...keys].sort()).toEqual(allBibleChapters.map((c) => c.key).sort());
  });
  it("handles Psalms and videos spanning several books", () => {
    expect(chapterRangesForVideo({ book: "시편", chapters: "1~3편" }).map((c) => c.key))
      .toEqual(["시편:1", "시편:2", "시편:3"]);
    expect(chapterRangesForVideo(koreanBibleVideos.find((v) => v.day === 359)!).map((c) => c.key))
      .toEqual(["요한1서:5", "요한2서:1", "요한3서:1", "유다서:1"]);
    expect(chapterRangesForVideo(koreanBibleVideos.find((v) => v.day === 351)!).map((c) => c.key))
      .toEqual(["디도서:1", "디도서:2", "디도서:3", "빌레몬서:1"]);
  });
  it("rejects unknown, malformed, reversed and out-of-range data", () => {
    for (const chapters of ["0장", "51장", "4~1장", "1~3절", "?", "없는책 1장"]) {
      expect(() => chapterRangesForVideo({ book: "창세기", chapters })).toThrow();
    }
  });
});

