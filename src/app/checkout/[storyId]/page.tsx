import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentActions } from "./payment-actions";
import { getRuntimeConfig } from "@/lib/config/runtime";
import { getStory } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  params: Promise<{
    storyId: string;
  }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { storyId } = await params;
  const stored = await getStory(storyId);

  if (!stored) {
    notFound();
  }

  const config = getRuntimeConfig();
  const selectedChoice = stored.story.next_choices.find(
    (choice) => choice.choice_id === stored.selectedChoiceId
  );

  if (!selectedChoice) {
    return (
      <main className="page-shell">
        <section className="mobile-frame grid gap-5 pt-6">
          <h1 className="text-3xl font-black leading-tight">
            다음 전개를 먼저 선택해주세요.
          </h1>
          <p className="leading-7 text-[color:var(--muted)]">
            결제를 준비하려면 1화 미리보기에서 이어질 방향을 선택해야 합니다.
          </p>
          <Link className="button-primary w-full" href={`/stories/${storyId}/preview`}>
            선택하러 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-6 pt-4">
        <header className="grid gap-2">
          <p className="text-sm font-bold text-[color:var(--accent)]">5화 완결팩</p>
          <h1 className="text-3xl font-black leading-tight">
            이야기를 끝까지 이어갈 준비
          </h1>
          <p className="leading-7 text-[color:var(--muted)]">
            선택한 전개를 바탕으로 2화부터 5화까지 완결 구성을 생성합니다.
          </p>
        </header>

        <section className="panel grid gap-4 p-5">
          <div className="grid gap-1">
            <p className="text-sm font-bold text-[color:var(--muted)]">작품</p>
            <h2 className="text-2xl font-black">{stored.story.title}</h2>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-strong)] p-4">
            <p className="text-sm font-bold text-[color:var(--accent)]">
              선택한 다음 전개
            </p>
            <p className="mt-1 font-bold">
              {selectedChoice.choice_id}. {selectedChoice.label}
            </p>
          </div>
          <div className="grid gap-2 border-t border-[color:var(--border)] pt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold">5화 완결팩</span>
              <span className="text-2xl font-black">7,900원</span>
            </div>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {config.mockToss
                ? "토스 키가 없어 현재는 모의 결제로 완결 회차를 생성합니다."
                : "토스페이먼츠 실제 결제 승인으로 전환할 준비가 되어 있습니다."}
            </p>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              PayPal은 해외 결제 또는 백업 결제로 사용할 수 있습니다. 현재 설정은{" "}
              {config.mockPayPal
                ? "PayPal 모의 결제"
                : `${config.paypalCurrency} 실제 결제`}{" "}
              모드입니다.
            </p>
          </div>
        </section>

        <PaymentActions
          mockPayPal={config.mockPayPal}
          paypalClientId={config.paypalClientId}
          paypalCurrency={config.paypalCurrency}
          storyId={storyId}
        />

        <Link className="button-secondary w-full" href={`/stories/${storyId}/preview`}>
          1화 다시 보기
        </Link>
      </section>
    </main>
  );
}
