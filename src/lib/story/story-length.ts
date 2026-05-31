import type { StoryChapter, StoryScene } from "./schema";

export const LONG_FORM_TARGETS = {
  charsPerMobilePage: 550,
  freePreview: {
    minChars: 1800,
    maxChars: 4500,
    minPages: 4,
    maxPages: 8
  },
  paidChapter: {
    minChars: 5000,
    maxChars: 6500
  },
  fullStory: {
    minChars: 24000,
    maxChars: 32000,
    targetPages: 50,
    minPages: 45,
    maxPages: 55
  }
} as const;

type StoryLengthInput = {
  chapters: StoryChapter[];
  scenes?: StoryScene[];
};

export type StoryLengthStats = {
  totalChars: number;
  chapterChars: number[];
  sceneChars: number[];
  estimatedPages: number;
};

export function countReadableChars(value: string) {
  return [...value.replace(/\s/g, "")].length;
}

export function estimateMobilePages(
  value: string | number,
  charsPerPage = LONG_FORM_TARGETS.charsPerMobilePage
) {
  const chars = typeof value === "number" ? value : countReadableChars(value);

  return Math.max(1, Math.ceil(chars / charsPerPage));
}

export function chapterText(chapter: StoryChapter) {
  return `${chapter.body}\n${chapter.ending_hook}`;
}

export function sceneText(scene: StoryScene) {
  return `${scene.body}\n${scene.dialogue}`;
}

export function getStoryLengthStats(story: StoryLengthInput): StoryLengthStats {
  const chapterChars = story.chapters.map((chapter) =>
    countReadableChars(chapterText(chapter))
  );
  const sceneChars = (story.scenes ?? []).map((scene) =>
    countReadableChars(sceneText(scene))
  );
  const totalChars = [...chapterChars, ...sceneChars].reduce(
    (total, chars) => total + chars,
    0
  );

  return {
    totalChars,
    chapterChars,
    sceneChars,
    estimatedPages: estimateMobilePages(totalChars)
  };
}

export function formatEstimatedPages(
  stats: Pick<StoryLengthStats, "estimatedPages">,
  locale: "ko" | "en" = "ko"
) {
  return locale === "en"
    ? `about ${stats.estimatedPages} mobile pages`
    : `모바일 약 ${stats.estimatedPages}페이지`;
}
