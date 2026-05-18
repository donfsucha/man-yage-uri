import Link from "next/link";
import { getAnalyticsEvents, getStories } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stories, events] = await Promise.all([getStories(), getAnalyticsEvents()]);
  const completedCount = stories.filter((story) => story.status === "completed").length;
  const paymentPendingCount = stories.filter(
    (story) => story.status === "payment_pending"
  ).length;
  const checkoutClickCount = events.filter(
    (event) => event.eventName === "checkout_click"
  ).length;

  return (
    <main className="page-shell">
      <section className="grid gap-6 pt-4">
        <header className="grid gap-2">
          <Link className="text-sm font-bold text-[color:var(--accent)]" href="/">
            서비스로 돌아가기
          </Link>
          <h1 className="text-3xl font-black leading-tight">관리자 대시보드</h1>
          <p className="leading-7 text-[color:var(--muted)]">
            V1 스토리 상태, 결제 상태, 생성 회차, 결제 버튼 클릭 수를 확인합니다.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-4">
          <div className="panel p-4">
            <p className="text-sm font-bold text-[color:var(--muted)]">전체 시작</p>
            <p className="mt-2 text-3xl font-black">{stories.length}</p>
          </div>
          <div className="panel p-4">
            <p className="text-sm font-bold text-[color:var(--muted)]">완결 생성</p>
            <p className="mt-2 text-3xl font-black">{completedCount}</p>
          </div>
          <div className="panel p-4">
            <p className="text-sm font-bold text-[color:var(--muted)]">결제 대기</p>
            <p className="mt-2 text-3xl font-black">{paymentPendingCount}</p>
          </div>
          <div className="panel p-4">
            <p className="text-sm font-bold text-[color:var(--muted)]">결제 클릭</p>
            <p className="mt-2 text-3xl font-black">{checkoutClickCount}</p>
          </div>
        </section>

        <section className="panel overflow-x-auto p-4">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                <th className="p-3">제목</th>
                <th className="p-3">상태</th>
                <th className="p-3">선택</th>
                <th className="p-3">회차</th>
                <th className="p-3">결제</th>
                <th className="p-3">결제 클릭</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((story) => {
                const storyCheckoutClicks = events.filter(
                  (event) =>
                    event.storyId === story.id && event.eventName === "checkout_click"
                ).length;

                return (
                  <tr className="border-b border-[color:var(--border)]" key={story.id}>
                    <td className="p-3 font-bold">{story.story.title}</td>
                    <td className="p-3">{story.status}</td>
                    <td className="p-3">{story.selectedChoiceId ?? "-"}</td>
                    <td className="p-3">{story.story.chapters.length}</td>
                    <td className="p-3">{story.payment?.status ?? "-"}</td>
                    <td className="p-3">{storyCheckoutClicks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}
