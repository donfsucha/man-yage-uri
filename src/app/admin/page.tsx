import Link from "next/link";
import {
  formatKrw,
  formatPercent,
  getAdminDashboardMetrics
} from "@/lib/admin/metrics";
import { getAnalyticsEvents, getStories } from "@/lib/story/persistence";
import { getStoryLengthStats } from "@/lib/story/story-length";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul"
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="panel p-4">
      <p className="text-sm font-bold text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {detail ? (
        <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{detail}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-bold text-[color:var(--accent)]">
      {value}
    </span>
  );
}

export default async function AdminPage() {
  let stories: Awaited<ReturnType<typeof getStories>> = [];
  let events: Awaited<ReturnType<typeof getAnalyticsEvents>> = [];
  let loadError = "";

  try {
    [stories, events] = await Promise.all([getStories(), getAnalyticsEvents()]);
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "관리자 데이터를 불러오지 못했습니다.";
  }

  const metrics = getAdminDashboardMetrics(stories, events);

  return (
    <main className="page-shell">
      <section className="grid gap-6 pt-4">
        <header className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className="text-sm font-bold text-[color:var(--accent)]" href="/">
              서비스로 돌아가기
            </Link>
            <p className="text-xs font-bold text-[color:var(--muted)]">
              갱신 기준 {formatDate(metrics.generatedAt)}
            </p>
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              운영 관리자
            </p>
            <h1 className="text-3xl font-black leading-tight">
              만약에 우리 실적 대시보드
            </h1>
            <p className="leading-7 text-[color:var(--muted)]">
              생성, 선택, 결제, 완결, 보너스 다운로드까지 운영에 필요한 핵심
              흐름을 확인합니다.
            </p>
          </div>
        </header>

        {loadError ? (
          <section className="notice border-red-200 bg-red-50 text-red-700">
            관리자 데이터를 불러오지 못했습니다. Supabase 마이그레이션과 환경변수를
            확인해 주세요. 오류: {loadError}
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            detail={`오늘 결제 ${metrics.today.paidStories}건`}
            label="오늘 1화 생성"
            value={metrics.today.stories}
          />
          <StatCard
            detail={`결제 성공 ${metrics.totals.paymentSuccesses}건`}
            label="누적 스토리"
            value={metrics.totals.stories}
          />
          <StatCard
            detail={`상품 기준가 ${formatKrw(metrics.revenue.productPriceKrw)}`}
            label="누적 예상 매출"
            value={formatKrw(metrics.revenue.productRevenueEstimateKrw)}
          />
          <StatCard
            detail={`AI 예상 비용 ${formatKrw(metrics.revenue.estimatedAiCostKrw)}`}
            label="예상 마진"
            value={formatKrw(metrics.revenue.estimatedMarginKrw)}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[color:var(--accent)]">
                  전환 퍼널
                </p>
                <h2 className="mt-1 text-2xl font-black">어디서 이탈하는지 보기</h2>
              </div>
              <StatusBadge value={`보너스 다운로드 ${metrics.totals.bonusDownloads}회`} />
            </div>

            <div className="mt-5 grid gap-3">
              {metrics.funnel.map((item, index) => (
                <div
                  className="grid gap-2 rounded-lg bg-[color:var(--surface-strong)] p-4 sm:grid-cols-[1fr_auto_auto]"
                  key={item.label}
                >
                  <div>
                    <p className="font-bold">
                      {index + 1}. {item.label}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      이전 단계 대비 전환율
                    </p>
                  </div>
                  <p className="text-2xl font-black">{item.count}</p>
                  <p className="font-bold text-[color:var(--accent)]">
                    {formatPercent(item.rateFromPrevious)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <section className="panel p-5">
              <p className="text-sm font-bold text-[color:var(--accent)]">
                결제/비용
              </p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">오늘 예상 매출</dt>
                  <dd className="font-black">
                    {formatKrw(metrics.revenue.todayRevenueEstimateKrw)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">저장 결제액 합계</dt>
                  <dd className="font-black">
                    {metrics.revenue.storedPaidAmountTotal.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">PayPal 설정가</dt>
                  <dd className="font-black">
                    {metrics.revenue.configuredCurrency}{" "}
                    {metrics.revenue.configuredAmount}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">결제 실패</dt>
                  <dd className="font-black">{metrics.totals.paymentFailures}</dd>
                </div>
              </dl>
            </section>

            <section className="panel p-5">
              <p className="text-sm font-bold text-[color:var(--accent)]">
                콘텐츠 품질 경고
              </p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">생성 실패</dt>
                  <dd className="font-black">{metrics.quality.generationFailed}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">수동 검토 필요</dt>
                  <dd className="font-black">{metrics.quality.manualReview}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">완결 분량 부족</dt>
                  <dd className="font-black">{metrics.quality.tooShortCompleted}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--muted)]">완결 분량 초과</dt>
                  <dd className="font-black">{metrics.quality.tooLongCompleted}</dd>
                </div>
              </dl>
            </section>
          </div>
        </section>

        <section className="panel overflow-x-auto p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[color:var(--accent)]">
                최근 결제
              </p>
              <h2 className="text-2xl font-black">결제 상태 확인</h2>
            </div>
            <StatusBadge value={`${metrics.recentPayments.length}건 표시`} />
          </div>
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                <th className="p-3">스토리</th>
                <th className="p-3">상태</th>
                <th className="p-3">결제 상태</th>
                <th className="p-3">금액</th>
                <th className="p-3">주문 ID</th>
                <th className="p-3">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentPayments.map((story) => (
                <tr className="border-b border-[color:var(--border)]" key={story.id}>
                  <td className="p-3 font-bold">
                    <Link href={`/stories/${story.id}`}>{story.story.title}</Link>
                  </td>
                  <td className="p-3">{story.status}</td>
                  <td className="p-3">{story.payment?.status ?? "-"}</td>
                  <td className="p-3">{story.payment?.amount ?? "-"}</td>
                  <td className="max-w-[240px] truncate p-3">
                    {story.payment?.orderId ?? "-"}
                  </td>
                  <td className="p-3">
                    {story.payment ? formatDate(story.payment.updatedAt) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel overflow-x-auto p-4">
          <div className="mb-4">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              최근 스토리
            </p>
            <h2 className="text-2xl font-black">생성/선택/완결 상태</h2>
          </div>
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                <th className="p-3">제목</th>
                <th className="p-3">언어</th>
                <th className="p-3">상태</th>
                <th className="p-3">선택</th>
                <th className="p-3">챕터</th>
                <th className="p-3">예상 페이지</th>
                <th className="p-3">생성일</th>
                <th className="p-3">바로가기</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentStories.map((story) => {
                const lengthStats = getStoryLengthStats(story.story);

                return (
                  <tr className="border-b border-[color:var(--border)]" key={story.id}>
                    <td className="max-w-[280px] truncate p-3 font-bold">
                      {story.story.title}
                    </td>
                    <td className="p-3">{story.input.outputLanguage ?? "ko"}</td>
                    <td className="p-3">{story.status}</td>
                    <td className="p-3">{story.selectedChoiceId ?? "-"}</td>
                    <td className="p-3">{story.story.chapters.length}</td>
                    <td className="p-3">{lengthStats.estimatedPages}</td>
                    <td className="p-3">{formatDate(story.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link
                          className="font-bold text-[color:var(--accent)]"
                          href={`/stories/${story.id}/preview`}
                        >
                          미리보기
                        </Link>
                        <Link
                          className="font-bold text-[color:var(--accent)]"
                          href={`/stories/${story.id}`}
                        >
                          완결
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="panel p-4">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              이벤트 분포
            </p>
            <div className="mt-4 grid gap-2">
              {Object.entries(metrics.eventBreakdown).map(([eventName, count]) => (
                <div
                  className="flex justify-between gap-3 rounded-md bg-[color:var(--surface-strong)] px-3 py-2 text-sm"
                  key={eventName}
                >
                  <span>{eventName}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="panel overflow-x-auto p-4">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              최근 이벤트 로그
            </p>
            <table className="mt-4 w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)]">
                  <th className="p-3">이벤트</th>
                  <th className="p-3">스토리 ID</th>
                  <th className="p-3">시간</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentEvents.map((event) => (
                  <tr className="border-b border-[color:var(--border)]" key={event.id}>
                    <td className="p-3 font-bold">{event.eventName}</td>
                    <td className="max-w-[180px] truncate p-3">
                      {event.storyId ?? "-"}
                    </td>
                    <td className="p-3">{formatDate(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
