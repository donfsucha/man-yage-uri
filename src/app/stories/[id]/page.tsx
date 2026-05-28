import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterReader } from "./chapter-reader";
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
};

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const stored = await getStory(id);

  if (!stored) {
    notFound();
  }

  const isCompleted = stored.status === "completed";
  const lengthStats = getStoryLengthStats(stored.story);

  return (
    <main className="page-shell">
      <article className="reader-frame grid gap-6 pt-4">
        <header className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <Link className="text-sm font-bold text-[color:var(--accent)]" href="/library">
              보관함
            </Link>
            <span className="text-sm font-bold text-[color:var(--muted)]">
              {isCompleted ? "완결" : "미리보기"} · {formatEstimatedPages(lengthStats)}
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
            아직 완결 회차가 생성되지 않았습니다. 1화 미리보기에서 다음 전개를
            선택하고 5화 완결을 진행해 주세요.
          </section>
        ) : null}

        <ChapterReader
          chapters={stored.story.chapters}
          isCompleted={isCompleted}
          selectedChoiceId={stored.selectedChoiceId}
        />

        <section className="notice">
          이 이야기는 실제 인물의 마음이나 미래를 예측하지 않는 픽션 콘텐츠입니다.
        </section>
      </article>
    </main>
  );
}
