import Link from "next/link";
import { notFound } from "next/navigation";
import { ChoiceActions } from "./choice-actions";
import { getStory } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const stored = await getStory(id);

  if (!stored) {
    notFound();
  }

  const chapter = stored.story.chapters[0];

  return (
    <main className="page-shell">
      <article className="mobile-frame grid gap-6">
        <header className="grid gap-3 pt-3">
          <Link className="text-sm font-bold text-[color:var(--accent)]" href="/create">
            다시 만들기
          </Link>
          <div className="grid gap-2">
            <p className="text-sm font-bold text-[color:var(--muted)]">
              {stored.story.genre} · {stored.story.emotional_tone}
            </p>
            <h1 className="text-3xl font-black leading-tight">{stored.story.title}</h1>
            <p className="leading-7 text-[color:var(--muted)]">{stored.story.summary}</p>
          </div>
        </header>

        <section className="panel grid gap-5 p-5">
          <div className="grid gap-1">
            <p className="text-sm font-bold text-[color:var(--accent)]">1화 무료</p>
            <h2 className="text-2xl font-black">{chapter.chapter_title}</h2>
          </div>
          <p className="whitespace-pre-wrap text-[17px] leading-8">{chapter.body}</p>
          <p className="border-l-4 border-[color:var(--accent)] bg-[color:var(--surface-strong)] p-4 font-bold leading-7">
            {chapter.ending_hook}
          </p>
        </section>

        <section className="panel grid gap-3 p-5">
          <p className="text-sm font-bold text-[color:var(--accent)]">
            이 이야기는 아직 끝나지 않았습니다
          </p>
          <h2 className="text-2xl font-black leading-tight">
            선택한 방향으로 2화부터 5화까지 완결됩니다.
          </h2>
          <p className="leading-7 text-[color:var(--muted)]">
            우리의 다른 결말을 끝까지 읽어보고 싶다면, 아래에서 다음 전개를
            선택해 주세요.
          </p>
        </section>

        <ChoiceActions choices={stored.story.next_choices} storyId={stored.id} />

        <section className="notice">
          다음 화면에서 5화 완결 상품을 확인합니다. 공개 베타에서는 결제 의향을
          검증하기 위해 결제 버튼 클릭 이벤트를 기록합니다.
        </section>
      </article>
    </main>
  );
}
