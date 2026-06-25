import Link from "next/link";
import { notFound } from "next/navigation";
import { ChoiceActions } from "./choice-actions";
import { getStoryForPage } from "@/lib/story/page-loader";
import {
  formatEstimatedPages,
  getStoryLengthStats,
  LONG_FORM_TARGETS
} from "@/lib/story/story-length";
import { cleanReaderText } from "@/lib/story/story-copy";

export const dynamic = "force-dynamic";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

type PreviewLocale = "ko" | "en";

const PREVIEW_COPY = {
  ko: {
    remake: "다시 만들기",
    previewLabel: "무료 미리보기",
    sceneAria: "1화 장면 카드",
    pageLabel: "만약에 우리",
    freeChapter: "1화 무료",
    unfinished: "이야기는 아직 끝나지 않았습니다",
    continueTitle: "선택한 방향으로 2화부터 5화까지 완결됩니다",
    continueBody:
      "우리의 다른 결말을 끝까지 읽어보고 싶다면 아래에서 다음 전개를 선택해 주세요.",
    fullLength: "완결편 목표 분량",
    mobilePages: "약",
    pages: "모바일 페이지",
    notice:
      "다음 화면에서 5화 완결 상품을 확인합니다. 공개 베타에서는 결제 전환을 검증하기 위해 결제 버튼 클릭 이벤트를 기록합니다.",
    otherLanguageLabel: "English preview"
  },
  en: {
    remake: "Create another story",
    previewLabel: "Free preview",
    sceneAria: "Chapter 1 scene cards",
    pageLabel: "What If Us",
    freeChapter: "Chapter 1 free",
    unfinished: "This story is not over yet",
    continueTitle: "Your choice unlocks chapters 2 through 5.",
    continueBody:
      "Choose the next direction below if you want to read the complete alternate ending.",
    fullLength: "Complete-story target length",
    mobilePages: "about",
    pages: "mobile pages",
    notice:
      "The next screen shows the complete five-chapter story product. During public beta, checkout button clicks are recorded to validate purchase intent.",
    otherLanguageLabel: "한국어 미리보기"
  }
} satisfies Record<PreviewLocale, Record<string, string>>;

function getPreviewLocale(
  lang: string | string[] | undefined,
  storyLanguage?: string
): PreviewLocale {
  const value = Array.isArray(lang) ? lang[0] : lang;

  if (value === "en" || storyLanguage === "en") {
    return "en";
  }

  return "ko";
}

export default async function PreviewPage({
  params,
  searchParams
}: PreviewPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const stored = await getStoryForPage(id);

  if (!stored) {
    notFound();
  }

  const locale = getPreviewLocale(query.lang, stored.input.outputLanguage);
  const copy = PREVIEW_COPY[locale];
  const otherLocale = locale === "en" ? "ko" : "en";
  const languageHref =
    otherLocale === "en" ? `/stories/${id}/preview?lang=en` : `/stories/${id}/preview`;
  const chapter = stored.story.chapters[0];
  const scenes = stored.story.scenes ?? [];
  const cleanedChapterBody = cleanReaderText(chapter.body);
  const cleanedEndingHook = cleanReaderText(chapter.ending_hook);
  const lengthStats = getStoryLengthStats({
    chapters: [
      {
        ...chapter,
        body: cleanedChapterBody,
        ending_hook: cleanedEndingHook
      }
    ],
    scenes
  });

  return (
    <main className="page-shell">
      <article className="reader-frame grid gap-6">
        <header className="grid gap-3 pt-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              className="text-sm font-bold text-[color:var(--accent)]"
              href={locale === "en" ? "/create?lang=en" : "/create"}
            >
              {copy.remake}
            </Link>
            <Link
              className="text-sm font-bold text-[color:var(--accent)]"
              href={languageHref}
            >
              {copy.otherLanguageLabel}
            </Link>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-bold text-[color:var(--muted)]">
              {stored.story.genre} · {stored.story.emotional_tone}
            </p>
            <h1 className="text-3xl font-black leading-tight">{stored.story.title}</h1>
            <p className="leading-7 text-[color:var(--muted)]">{stored.story.summary}</p>
            <p className="text-sm font-bold text-[color:var(--accent)]">
              {copy.previewLabel} · {formatEstimatedPages(lengthStats, locale)}
            </p>
          </div>
        </header>

        {scenes.length > 0 ? (
          <section className="grid gap-4" aria-label={copy.sceneAria}>
            {scenes.map((scene) => (
              <section className="story-page-card" key={scene.scene_no}>
                <div className="story-scene-visual">
                  <p className="scene-kicker">Scene {scene.scene_no}</p>
                  <h2>{scene.scene_title}</h2>
                  <p>{scene.setting}</p>
                </div>
                <div className="story-scene-copy">
                  <p className="text-sm font-bold text-[color:var(--accent)]">
                    {scene.emotion}
                  </p>
                  <p className="whitespace-pre-wrap text-[17px] leading-8">
                    {cleanReaderText(scene.body)}
                  </p>
                  <blockquote>{scene.dialogue}</blockquote>
                  <p className="paper-page-number">
                    {copy.pageLabel} · {String(scene.scene_no).padStart(2, "0")}
                  </p>
                </div>
              </section>
            ))}
          </section>
        ) : null}

        <section className="panel grid gap-5 p-5">
          <div className="grid gap-1">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              {copy.freeChapter}
            </p>
            <h2 className="text-2xl font-black">{chapter.chapter_title}</h2>
          </div>
          <p className="whitespace-pre-wrap text-[17px] leading-8">
            {cleanedChapterBody}
          </p>
          <p className="border-l-4 border-[color:var(--accent)] bg-[color:var(--surface-strong)] p-4 font-bold leading-7">
            {cleanedEndingHook}
          </p>
        </section>

        <section className="panel grid gap-3 p-5">
          <p className="text-sm font-bold text-[color:var(--accent)]">
            {copy.unfinished}
          </p>
          <h2 className="text-2xl font-black leading-tight">
            {copy.continueTitle}
          </h2>
          <p className="leading-7 text-[color:var(--muted)]">
            {copy.continueBody}
          </p>
          <p className="text-sm font-bold text-[color:var(--accent)]">
            {copy.fullLength} · {copy.mobilePages}{" "}
            {`${LONG_FORM_TARGETS.fullStory.minPages}~${LONG_FORM_TARGETS.fullStory.maxPages}`}{" "}
            {copy.pages}
          </p>
        </section>

        <ChoiceActions
          choices={stored.story.next_choices}
          locale={locale}
          storyId={stored.id}
        />

        <section className="notice">
          {copy.notice}
        </section>
      </article>
    </main>
  );
}
