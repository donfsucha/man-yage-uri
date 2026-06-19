export const koreanBibleProgressKey = "xcan:progress:korean_bible_reading";
export const legacyKoreanBibleProgressKey = "xcan:korean-bible-reading-progress:v3";
export const englishBibleProgressKey = "xcan:progress:english_bible_reading";

export type KoreanBibleVideo = {
  day: number;
  videoId: string;
  title: string;
};

export type EnglishBibleVideo = {
  book: string;
  videoId: string;
  title: string;
};

export const koreanBibleVideos: KoreanBibleVideo[] = [
  {
    day: 1,
    videoId: "3-NAx-ECs70",
    title: "창세기 1~4장",
  },
  {
    day: 2,
    videoId: "-a-q4tBYVYs",
    title: "창세기 5~9장",
  },
  {
    day: 3,
    videoId: "ek6UR53q_sU",
    title: "창세기 10~13장",
  },
];

export const englishBibleVideos: EnglishBibleVideo[] = [
  {
    book: "Genesis",
    videoId: "QcMquFbcfA0",
    title: "The Book of Genesis — The Beginning of Everything",
  },
  {
    book: "Exodus",
    videoId: "NSmevXhc6IA",
    title: "The Book of Exodus — When the Sea Opened",
  },
  {
    book: "Leviticus",
    videoId: "f1pi6NxQM1M",
    title: "Leviticus — The Fire of God and the Call to Holiness",
  },
  {
    book: "Numbers",
    videoId: "K4Tb4bxW_wg",
    title: "Book of Numbers — Faith, Rebellion, and Miracles in the Desert",
  },
  {
    book: "Deuteronomy",
    videoId: "nCUF23VOfQk",
    title: "The Book of Deuteronomy — The Final Words of Moses",
  },
  {
    book: "Joshua",
    videoId: "F7UImkCk9dg",
    title: "The Book of Joshua — The Walls Fell and Faith Rose",
  },
  {
    book: "Judges",
    videoId: "zBrj5-frffY",
    title: "Judges — Strength, Betrayal, and Redemption",
  },
  {
    book: "Ruth",
    videoId: "XbWetk7T0IY",
    title: "Ruth — From Loss to Love: A Story of Redemption",
  },
  {
    book: "Matthew",
    videoId: "mgUWg3ZY_C8",
    title: "The Gospel of Matthew — The Teachings of Christ",
  },
  {
    book: "Mark",
    videoId: "pP_RkiS8GsA",
    title: "The Gospel of Mark — Power, Miracles & Authority",
  },
  {
    book: "Luke",
    videoId: "PEMFlleaJnc",
    title: "The Gospel of Luke — From the Manger to the Cross",
  },
  {
    book: "John",
    videoId: "l1kQIiy-DZU",
    title: "The Gospel of John — Jesus The Light of the World",
  },
  {
    book: "Acts",
    videoId: "vRNs2Gkp-o8",
    title: "Acts of The Apostles — The Power of the Holy Spirit",
  },
  {
    book: "Romans",
    videoId: "khQ1J6mi334",
    title: "Romans — Nothing Can Separate Us",
  },
  {
    book: "Revelation",
    videoId: "bF3JPv_-luI",
    title: "Book of Revelation — The Last Vision of John",
  },
];
