import {
  englishBibleProgressKey,
  englishBibleVideos,
  findKoreanBibleIndexByBook,
  findKoreanBibleIndexByDay,
  findKoreanBibleIndexByVideoId,
  getKoreanBibleCompletionPercent,
  groupKoreanBibleVideosByBook,
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

  it("contains the complete 365-day Korean Bible reading table", () => {
    expect(koreanBiblePlaylistId).toBe("PLjj_uvKdTemCV3tBQ3iHCe5O-HPXsjtjn");
    expect(koreanBiblePlaylistLength).toBe(365);
    expect(koreanBibleVideos).toHaveLength(365);
    expect(koreanBibleVideos.map((video) => video.day)).toEqual(
      Array.from({ length: 365 }, (_, index) => index + 1),
    );
    expect(new Set(koreanBibleVideos.map((video) => video.videoId)).size).toBe(365);
    expect(koreanBibleVideos.every((video) => Boolean(video.videoId))).toBe(true);
  });

  it("starts Korean Bible reading at Genesis day 1", () => {
    expect(koreanBibleVideos[0]).toMatchObject({
      day: 1,
      playlistIndex: playlistIndexForBibleDay(1),
      videoId: "3-NAx-ECs70",
      book: "\uCC3D\uC138\uAE30",
      chapters: "1~4\uC7A5",
      title: "\uCC3D\uC138\uAE30 1~4\uC7A5",
    });
  });

  it("maps Korean Bible day numbers to the newest-first YouTube playlist order", () => {
    expect(playlistIndexForBibleDay(1)).toBe(364);
    expect(playlistIndexForBibleDay(170)).toBe(195);
    expect(playlistIndexForBibleDay(282)).toBe(83);
    expect(playlistIndexForBibleDay(365)).toBe(0);
  });

  it("can start Korean Bible reading from major book groups with exact video IDs", () => {
    const exodusIndex = findKoreanBibleIndexByBook("\uCD9C\uC560\uAD7D\uAE30");
    const psalmsIndex = findKoreanBibleIndexByBook("\uC2DC\uD3B8");
    const matthewIndex = findKoreanBibleIndexByBook("\uB9C8\uD0DC\uBCF5\uC74C");
    const revelationIndex = findKoreanBibleIndexByDay(365);

    expect(koreanBibleVideos[exodusIndex]).toMatchObject({
      day: 19,
      book: "\uCD9C\uC560\uAD7D\uAE30",
      videoId: "bL48YebYx94",
      title: "\uCD9C\uC560\uAD7D\uAE30 1~3\uC7A5",
    });

    expect(koreanBibleVideos[psalmsIndex]).toMatchObject({
      day: 170,
      book: "\uC2DC\uD3B8",
      videoId: "CPM6W7Mvdnw",
      title: "\uC2DC\uD3B8 1~9\uD3B8",
    });

    expect(koreanBibleVideos[matthewIndex]).toMatchObject({
      day: 282,
      book: "\uB9C8\uD0DC\uBCF5\uC74C",
      videoId: "nIDtkxY4eys",
      title: "\uB9C8\uD0DC\uBCF5\uC74C 1~4\uC7A5",
    });

    expect(koreanBibleVideos[revelationIndex]).toMatchObject({
      day: 365,
      book: "\uC694\uD55C\uACC4\uC2DC\uB85D",
      videoId: "x3GxYZUU72U",
      title: "\uC694\uD55C\uACC4\uC2DC\uB85D 20~22\uC7A5",
    });
    expect(findKoreanBibleIndexByVideoId("CPM6W7Mvdnw")).toBe(psalmsIndex);
  });

  it("groups Korean Bible reading entries by Bible book", () => {
    const groups = groupKoreanBibleVideosByBook(koreanBibleVideos);

    expect(groups[0]).toMatchObject({ book: "\uCC3D\uC138\uAE30", startDay: 1, endDay: 18 });
    expect(groups[0].items).toHaveLength(18);
    expect(groups.map((group) => group.book)).toContain("\uC2DC\uD3B8");
    expect(groups.map((group) => group.book)).toContain("\uC608\uB808\uBBF8\uC57C\uC560\uAC00");
    expect(groups.at(-1)).toMatchObject({ book: "\uC694\uD55C\uACC4\uC2DC\uB85D", startDay: 360, endDay: 365 });
  });

  it("calculates reading table completion from known plan entries", () => {
    expect(getKoreanBibleCompletionPercent([])).toBe(0);
    expect(getKoreanBibleCompletionPercent([1, 2, 3])).toBe(1);
    expect(getKoreanBibleCompletionPercent(Array.from({ length: 365 }, (_, index) => index + 1))).toBe(100);
  });

  it("starts English Bible reading at Genesis", () => {
    expect(englishBibleVideos[0]).toMatchObject({
      videoId: "QcMquFbcfA0",
      title: "The Book of Genesis - The Beginning of Everything",
    });
  });
});
