import Link from "next/link";
import { getStories } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const stories = await getStories();

  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-6 pt-4">
        <header className="grid gap-2">
          <Link className="text-sm font-bold text-[color:var(--accent)]" href="/">
            만약에 우리
          </Link>
          <h1 className="text-3xl font-black leading-tight">내 보관함</h1>
          <p className="leading-7 text-[color:var(--muted)]">
            만든 이야기를 확인합니다. Supabase가 연결되면 서버 DB 기준으로 보관됩니다.
          </p>
        </header>

        {stories.length === 0 ? (
          <section className="notice">
            아직 만든 이야기가 없습니다. 무료 1화 제작부터 시작해보세요.
          </section>
        ) : (
          <section className="grid gap-3">
            {stories.map((story) => (
              <Link
                className="panel grid gap-2 p-4"
                href={
                  story.status === "completed"
                    ? `/stories/${story.id}`
                    : `/stories/${story.id}/preview`
                }
                key={story.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">{story.story.title}</h2>
                  <span className="text-sm font-bold text-[color:var(--accent)]">
                    {story.status}
                  </span>
                </div>
                <p className="line-clamp-2 leading-7 text-[color:var(--muted)]">
                  {story.story.summary}
                </p>
              </Link>
            ))}
          </section>
        )}

        <Link className="button-primary w-full" href="/create">
          새 이야기 만들기
        </Link>
      </section>
    </main>
  );
}
