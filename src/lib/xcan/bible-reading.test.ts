import {
  englishBibleProgressKey,
  englishBibleVideos,
  findKoreanBibleIndexByBook,
  getKoreanBibleCompletionPercent,
  koreanBiblePlaylistId,
  koreanBiblePlaylistLength,
  koreanBibleProgressKey,
  koreanBibleVideos,
  playlistIndexForBibleDay,
} from "./bible-reading";

describe("XCAN Bible reading sequences", () => {
  it("keeps Korean and English progress in separate localStorage keys", () => {
    expect(koreanBibleProgressKey).toBe("xcan:progress:korean_bible_reading");
    expect(englishBibleProgressKey).toBe("xcan:progress:english_bible_reading");
    expect(koreanBibleProgressKey).not.toBe(englishBibleProgressKey);
  });

  it("starts Korean Bible reading at Genesis day 1", () => {
    expect(koreanBiblePlaylistId).toBe("PLjj_uvKdTemCV3tBQ3iHCe5O-HPXsjtjn");
    expect(koreanBiblePlaylistLength).toBe(365);
    expect(koreanBibleVideos[0]).toMatchObject({
      day: 1,
      playlistIndex: playlistIndexForBibleDay(1),
      videoId: "3-NAx-ECs70",
      book: "창세기",
      chapters: "1~4장",
      title: "창세기 1~4장",
    });
  });

  it("maps Korean Bible day numbers to the reversed YouTube playlist order", () => {
    expect(playlistIndexForBibleDay(31)).toBe(334);
    expect(playlistIndexForBibleDay(274)).toBe(91);
    expect(playlistIndexForBibleDay(356)).toBe(9);
  });

  it("can start Korean Bible reading from Exodus and Matthew", () => {
    const exodusIndex = findKoreanBibleIndexByBook("출애굽기");
    const matthewIndex = findKoreanBibleIndexByBook("마태복음");

    expect(exodusIndex).toBeGreaterThan(0);
    expect(koreanBibleVideos[exodusIndex]).toMatchObject({
      day: 31,
      book: "출애굽기",
      playlistIndex: 334,
      title: "출애굽기 시작",
    });

    expect(matthewIndex).toBeGreaterThan(0);
    expect(koreanBibleVideos[matthewIndex]).toMatchObject({
      day: 274,
      book: "마태복음",
      playlistIndex: 91,
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