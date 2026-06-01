import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterReader } from "./chapter-reader";
import { BONUS_LINKS, BONUS_OFFER_COPY } from "@/lib/bonus/offer";
import { getStory } from "@/lib/story/persistence";
import {
  formatEstimatedPages,
  getStoryLengthStats
} from "@/lib/story/story-length";

export const dynamic = "force-dynamic";

type StoryPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

type StoryLocale = "ko" | "en";

const STORY_COPY = {
  ko: {
    library: "보관함",
    completed: "완결",
    preview: "미리보기",
    notCompleted:
      "아직 완결 회차가 생성되지 않았습니다. 1화 미리보기에서 다음 전개를 선택하고 5화 완결을 진행해 주세요.",
    fictionNotice:
      "이 이야기는 실제 인물의 마음이나 미래를 예측하지 않는 픽션 콘텐츠입니다.",
    otherLanguageLabel: "English"
  },
  en: {
    library: "Library",
    completed: "Completed",
    preview: "Preview",
    notCompleted:
      "The complete chapters have not been generated yet. Go back to the chapter 1 preview, choose a direction, and unlock the five-chapter story.",
    fictionNotice:
      "This story is fictional and does not predict a real person's heart or future.",
    otherLanguageLabel: "한국어"
  }
} satisfies Record<StoryLocale, Record<string, string>>;

function getStoryPageLocale(
  lang: string | string[] | undefined,
  storyLanguage?: string
): StoryLocale {
  const value = Array.isArray(lang) ? lang[0] : lang;

  if (value === "en" || storyLanguage === "en") {
    return "en";
  }

  return "ko";
}

export default async function StoryPage({ params, searchParams }: StoryPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const stored = await getStory(id);

  if (!stored) {
    notFound();
  }

  const locale = getStoryPageLocale(query.lang, stored.input.outputLanguage);
  const copy = STORY_COPY[locale];
  const bonusCopy = BONUS_OFFER_COPY[locale];
  const otherLocale = locale === "en" ? "ko" : "en";
  const languageHref =
    otherLocale === "en" ? `/stories/${id}?lang=en` : `/stories/${id}`;
  const isCompleted = stored.status === "completed";
  const lengthStats = getStoryLengthStats(stored.story);

  return (
    <main className="page-shell">
      <article className="reader-frame grid gap-6 pt-4">
        <header className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <Link className="text-sm font-bold text-[color:var(--accent)]" href="/library">
              {copy.library}
            </Link>
            <Link
              className="text-sm font-bold text-[color:var(--accent)]"
              href={languageHref}
            >
              {copy.otherLanguageLabel}
            </Link>
            <span className="text-sm font-bold text-[color:var(--muted)]">
              {isCompleted ? copy.completed : copy.preview} ·{" "}
              {formatEstimatedPages(lengthStats, locale)}
            </span>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              {stored.story.genre}
            </p>
            <h1 className="text-3xl font-black leading-tight">{stored.story.title}</h1>
            <p className="leading-7 text-[color:var(--muted)]">{stored.story.summary}</p>
          </div>
        </header>

        {!isCompleted ? (
          <section className="notice">
            {copy.notCompleted}
          </section>
        ) : null}

        <ChapterReader
          chapters={stored.story.chapters}
          isCompleted={isCompleted}
          locale={locale}
          selectedChoiceId={stored.selectedChoiceId}
        />

        {isCompleted ? (
          <section className="panel grid gap-4 p-5">
            <div className="grid gap-2">
              <p className="text-sm font-bold text-[color:var(--accent)]">
                {bonusCopy.bonusTitle}
              </p>
              <h2 className="text-2xl font-black">{bonusCopy.guaranteeTitle}</h2>
              <p className="leading-7 text-[color:var(--muted)]">
                {bonusCopy.bonusBody}
              </p>
              <p className="text-sm font-bold text-[color:var(--accent)]">
                {bonusCopy.guaranteeBody}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-3 rounded-lg bg-[color:var(--surface-strong)] p-4">
                <p className="font-black">{bonusCopy.koreanBonus}</p>
                <a
                  className="button-secondary w-full"
                  download
                  href={BONUS_LINKS.breakupGuideKo}
                >
                  {bonusCopy.downloadGuide}
                </a>
                <a
                  className="button-secondary w-full"
                  download
                  href={BONUS_LINKS.journalTemplateKo}
                >
                  {bonusCopy.downloadJournal}
                </a>
              </div>
              <div className="grid gap-3 rounded-lg bg-[color:var(--surface-strong)] p-4">
                <p className="font-black">{bonusCopy.englishBonus}</p>
                <a
                  className="button-secondary w-full"
                  download
                  href={BONUS_LINKS.breakupGuideEn}
                >
                  {bonusCopy.downloadGuide}
                </a>
                <a
                  className="button-secondary w-full"
                  download
                  href={BONUS_LINKS.journalTemplateEn}
                >
                  {bonusCopy.downloadJournal}
                </a>
              </div>
            </div>
          </section>
        ) : null}

        <section className="notice">
          {copy.fictionNotice}
        </section>
      </article>
    </main>
  );
}
