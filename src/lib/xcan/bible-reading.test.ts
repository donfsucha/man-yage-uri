import {
  englishBibleProgressKey,
  englishBibleVideos,
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
    expect(koreanBibleVideos[0]).toMatchObject({
      videoId: "3-NAx-ECs70",
      title: "창세기 1~4장",
    });
  });

  it("starts English Bible reading at Genesis", () => {
    expect(englishBibleVideos[0]).toMatchObject({
      videoId: "QcMquFbcfA0",
      title: "The Book of Genesis — The Beginning of Everything",
    });
  });
});
