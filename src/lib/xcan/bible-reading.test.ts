import {
  englishBibleProgressKey,
  englishBibleVideos,
  findKoreanBibleIndexByBook,
  getKoreanBibleCompletionPercent,
  koreanBiblePlaylistId,
  koreanBibleProgressKey,
  koreanBibleVideos,
} from "./bible-reading";

describe("XCAN Bible reading sequences", () => {
  it("keeps Korean and English progress in separate localStorage keys", () => {
    expect(koreanBibleProgressKey).toBe("xcan:progress:korean_bible_reading");
    expect(englishBibleProgressKey).toBe("xcan:progress:english_bible_reading");
    expect(koreanBibleProgressKey).not.toBe(englishBibleProgressKey);
  });

  it("starts Korean Bible reading at Genesis day 1", () => {
    expect(koreanBiblePlaylistId).toBe("PLjj_uvKdTemCV3tBQ3iHCe5O-HPXsjtjn");
    expect(koreanBibleVideos[0]).toMatchObject({
      day: 1,
      playlistIndex: 0,
      videoId: "3-NAx-ECs70",
      book: "창세기",
      chapters: "1~4장",
      title: "창세기 1~4장",
    });
  });

  it("can start Korean Bible reading from Matthew", () => {
    const matthewIndex = findKoreanBibleIndexByBook("마태복음");

    expect(matthewIndex).toBeGreaterThan(0);
    expect(koreanBibleVideos[matthewIndex]).toMatchObject({
      book: "마태복음",
      playlistIndex: 273,
      title: "마태복음 시작",
    });
  });

  it("calculates reading table completion from known plan entries", () => {
    expect(getKoreanBibleCompletionPercent([])).toBe(0);
    expect(getKoreanBibleCompletionPercent([1, 2, 3])).toBe(33);
  });

  it("starts English Bible reading at Genesis", () => {
    expect(englishBibleVideos[0]).toMatchObject({
      videoId: "QcMquFbcfA0",
      title: "The Book of Genesis - The Beginning of Everything",
    });
  });
});
