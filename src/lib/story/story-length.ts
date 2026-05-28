import type { StoryChapter, StoryScene } from "./schema";

export const LONG_FORM_TARGETS = {
  charsPerMobilePage: 550,
  freePreview: {
    minChars: 4000,
    maxChars: 6500,
    minPages: 8,
    maxPages: 12
  },
  paidChapter: {
    minChars: 10000,
    maxChars: 13000
  },
  fullStory: {
    minChars: 44000,
    maxChars: 56000,
    minPages: 80,
    maxPages: 100
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

export function formatEstimatedPages(stats: Pick<StoryLengthStats, "estimatedPages">) {
  return `모바일 약 ${stats.estimatedPages}페이지`;
}
