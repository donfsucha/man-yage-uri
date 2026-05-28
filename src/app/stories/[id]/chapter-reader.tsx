"use client";

import { useMemo, useState } from "react";
import type { ChoiceId, StoryChapter } from "@/lib/story/schema";
import { cleanReaderText } from "@/lib/story/story-copy";
import { chapterText, estimateMobilePages } from "@/lib/story/story-length";

type ChapterReaderProps = {
  chapters: StoryChapter[];
  isCompleted: boolean;
  selectedChoiceId: ChoiceId | null;
};

export function ChapterReader({
  chapters,
  isCompleted,
  selectedChoiceId
}: ChapterReaderProps) {
  const [chapterChoices, setChapterChoices] = useState<Record<number, ChoiceId>>(
    () => {
      const initialChoices: Record<number, ChoiceId> = {};

      if (selectedChoiceId) {
        initialChoices[1] = selectedChoiceId;
      }

      return initialChoices;
    }
  );
  const unlockedCount = useMemo(() => {
    if (!isCompleted) {
      return 1;
    }

    return Math.min(chapters.length, 1 + Object.keys(chapterChoices).length);
  }, [chapterChoices, chapters.length, isCompleted]);
  const visibleChapters = chapters.slice(0, unlockedCount);
  const nextLockedChapter = chapters[unlockedCount];

  return (
    <section className="grid gap-5">
      {visibleChapters.map((chapter) => {
        const selectedChoice = chapterChoices[chapter.chapter_no] ?? null;
        const choices = chapter.next_choices ?? [];
        const canChoose = isCompleted && choices.length > 0 && !selectedChoice;
        const cleanedBody = cleanReaderText(chapter.body);
        const cleanedEndingHook = cleanReaderText(chapter.ending_hook);
        const cleanedPageCount = estimateMobilePages(
          cleanReaderText(chapterText(chapter))
        );

        return (
          <section className="panel grid gap-4 p-5" key={chapter.chapter_no}>
            <div className="grid gap-1">
              <p className="text-sm font-bold text-[color:var(--accent)]">
                {chapter.chapter_no}화 · 모바일 약 {cleanedPageCount}페이지
              </p>
              <h2 className="text-2xl font-black">{chapter.chapter_title}</h2>
            </div>
            <p className="whitespace-pre-wrap text-[17px] leading-8">
              {cleanedBody}
            </p>
            <p className="border-l-4 border-[color:var(--accent)] bg-[color:var(--surface-strong)] p-4 font-bold leading-7">
              {cleanedEndingHook}
            </p>

            {canChoose ? (
              <div className="grid gap-3 border-t border-[color:var(--border)] pt-4">
                <p className="text-sm font-black text-[color:var(--accent)]">
                  다음 화로 이어질 장면을 고르세요
                </p>
                <div className="grid gap-2">
                  {choices.map((choice) => {
                    const isSelected = selectedChoice === choice.choice_id;

                    return (
                      <button
                        className={isSelected ? "choice-button-selected" : "choice-button"}
                        disabled={Boolean(selectedChoice)}
                        key={`${chapter.chapter_no}-${choice.choice_id}`}
                        onClick={() =>
                          setChapterChoices((current) => ({
                            ...current,
                            [chapter.chapter_no]: choice.choice_id
                          }))
                        }
                        type="button"
                      >
                        <span>{choice.choice_id}</span>
                        <span>{choice.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        );
      })}

      {isCompleted && nextLockedChapter ? (
        <section className="notice">
          {visibleChapters.at(-1)?.chapter_no}화의 선택을 고르면{" "}
          {nextLockedChapter.chapter_no}화가 열립니다.
        </section>
      ) : null}
    </section>
  );
}
