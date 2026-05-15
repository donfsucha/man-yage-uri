import Link from "next/link";
import { notFound } from "next/navigation";
import { getStory } from "@/lib/story/persistence";

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

  return (
    <main className="page-shell">
      <article className="mobile-frame grid gap-6 pt-4">
        <header className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <Link className="text-sm font-bold text-[color:var(--accent)]" href="/library">
              보관함
            </Link>
            <span className="text-sm font-bold text-[color:var(--muted)]">
              {isCompleted ? "완결" : "미리보기"}
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
            선택하고 5화 완결팩을 진행해주세요.
          </section>
        ) : null}

        <section className="grid gap-5">
          {stored.story.chapters.map((chapter) => (
            <section className="panel grid gap-4 p-5" key={chapter.chapter_no}>
              <div className="grid gap-1">
                <p className="text-sm font-bold text-[color:var(--accent)]">
                  {chapter.chapter_no}화
                </p>
                <h2 className="text-2xl font-black">{chapter.chapter_title}</h2>
              </div>
              <p className="whitespace-pre-wrap text-[17px] leading-8">{chapter.body}</p>
              <p className="border-l-4 border-[color:var(--accent)] bg-[color:var(--surface-strong)] p-4 font-bold leading-7">
                {chapter.ending_hook}
              </p>
            </section>
          ))}
        </section>

        <section className="notice">
          이 이야기는 실제 인물의 마음이나 미래를 예측하지 않는 픽션 콘텐츠입니다.
        </section>
      </article>
    </main>
  );
}
