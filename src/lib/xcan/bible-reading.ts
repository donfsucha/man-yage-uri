export const koreanBibleProgressKey = "xcan:progress:korean_bible_reading";
export const legacyKoreanBibleProgressKey = "xcan:korean-bible-reading-progress:v3";
export const englishBibleProgressKey = "xcan:progress:english_bible_reading";
export const koreanBiblePlaylistId = "PLjj_uvKdTemCV3tBQ3iHCe5O-HPXsjtjn";

export type KoreanBibleVideo = {
  day: number;
  playlistIndex: number;
  videoId?: string;
  book: string;
  chapters: string;
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
    playlistIndex: 0,
    videoId: "3-NAx-ECs70",
    book: "창세기",
    chapters: "1~4장",
    title: "창세기 1~4장",
  },
  {
    day: 2,
    playlistIndex: 1,
    videoId: "-a-q4tBYVYs",
    book: "창세기",
    chapters: "5~9장",
    title: "창세기 5~9장",
  },
  {
    day: 3,
    playlistIndex: 2,
    videoId: "ek6UR53q_sU",
    book: "창세기",
    chapters: "10~13장",
    title: "창세기 10~13장",
  },
  {
    day: 31,
    playlistIndex: 30,
    book: "출애굽기",
    chapters: "1장부터",
    title: "출애굽기 시작",
  },
  {
    day: 122,
    playlistIndex: 121,
    book: "시편",
    chapters: "1편부터",
    title: "시편 시작",
  },
  {
    day: 274,
    playlistIndex: 273,
    book: "마태복음",
    chapters: "1장부터",
    title: "마태복음 시작",
  },
  {
    day: 292,
    playlistIndex: 291,
    book: "마가복음",
    chapters: "1장부터",
    title: "마가복음 시작",
  },
  {
    day: 329,
    playlistIndex: 328,
    book: "로마서",
    chapters: "1장부터",
    title: "로마서 시작",
  },
  {
    day: 356,
    playlistIndex: 355,
    book: "요한계시록",
    chapters: "1장부터",
    title: "요한계시록 시작",
  },
];

export function findKoreanBibleIndexByBook(book: string) {
  return koreanBibleVideos.findIndex((video) => video.book === book);
}

export function getKoreanBibleCompletionPercent(completedDays: number[]) {
  if (koreanBibleVideos.length === 0) return 0;

  const completedKnownDays = new Set(completedDays).size;
  return Math.round((completedKnownDays / koreanBibleVideos.length) * 100);
}

export const englishBibleVideos: EnglishBibleVideo[] = [
  {
    book: "Genesis",
    videoId: "QcMquFbcfA0",
    title: "The Book of Genesis - The Beginning of Everything",
  },
  {
    book: "Exodus",
    videoId: "NSmevXhc6IA",
    title: "The Book of Exodus - When the Sea Opened",
  },
  {
    book: "Leviticus",
    videoId: "f1pi6NxQM1M",
    title: "Leviticus - The Fire of God and the Call to Holiness",
  },
  {
    book: "Numbers",
    videoId: "K4Tb4bxW_wg",
    title: "Book of Numbers - Faith, Rebellion, and Miracles in the Desert",
  },
  {
    book: "Deuteronomy",
    videoId: "nCUF23VOfQk",
    title: "The Book of Deuteronomy - The Final Words of Moses",
  },
  {
    book: "Joshua",
    videoId: "F7UImkCk9dg",
    title: "The Book of Joshua - The Walls Fell and Faith Rose",
  },
  {
    book: "Judges",
    videoId: "zBrj5-frffY",
    title: "Judges - Strength, Betrayal, and Redemption",
  },
  {
    book: "Ruth",
    videoId: "XbWetk7T0IY",
    title: "Ruth - From Loss to Love: A Story of Redemption",
  },
  {
    book: "Matthew",
    videoId: "mgUWg3ZY_C8",
    title: "The Gospel of Matthew - The Teachings of Christ",
  },
  {
    book: "Mark",
    videoId: "pP_RkiS8GsA",
    title: "The Gospel of Mark - Power, Miracles & Authority",
  },
  {
    book: "Luke",
    videoId: "PEMFlleaJnc",
    title: "The Gospel of Luke - From the Manger to the Cross",
  },
  {
    book: "John",
    videoId: "l1kQIiy-DZU",
    title: "The Gospel of John - Jesus The Light of the World",
  },
  {
    book: "Acts",
    videoId: "vRNs2Gkp-o8",
    title: "Acts of The Apostles - The Power of the Holy Spirit",
  },
  {
    book: "Romans",
    videoId: "khQ1J6mi334",
    title: "Romans - Nothing Can Separate Us",
  },
  {
    book: "Revelation",
    videoId: "bF3JPv_-luI",
    title: "Book of Revelation - The Last Vision of John",
  },
];
