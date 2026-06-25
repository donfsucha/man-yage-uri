import Link from "next/link";
import { getRuntimeConfig } from "@/lib/config/runtime";
import { confirmTossPayment, isExpectedTossPayment } from "@/lib/payment/toss";
import {
  completePreparedPaidStory,
  recordAnalyticsEventSafely
} from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

type TossSuccessPageProps = {
  params: Promise<{
    storyId: string;
  }>;
  searchParams?: Promise<{
    amount?: string | string[];
    orderId?: string | string[];
    paymentKey?: string | string[];
  }>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function ResultShell({
  title,
  body,
  href,
  cta
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-5 pt-10">
        <h1 className="text-3xl font-black leading-tight">{title}</h1>
        <p className="leading-7 text-[color:var(--muted)]">{body}</p>
        <Link className="button-primary w-full" href={href}>
          {cta}
        </Link>
      </section>
    </main>
  );
}

export default async function TossSuccessPage({
  params,
  searchParams
}: TossSuccessPageProps) {
  const { storyId } = await params;
  const query = searchParams ? await searchParams : {};
  const paymentKey = getSingleParam(query.paymentKey);
  const orderId = getSingleParam(query.orderId);
  const rawAmount = getSingleParam(query.amount);
  const amount = Number(rawAmount);
  const config = getRuntimeConfig();

  if (!paymentKey || !orderId || !Number.isInteger(amount)) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId,
      metadata: { provider: "toss", reason: "missing_success_params" }
    });

    return (
      <ResultShell
        body="결제 승인 정보가 부족합니다. 다시 시도해 주세요."
        cta="결제 화면으로 돌아가기"
        href={`/checkout/${storyId}`}
        title="결제를 확인하지 못했습니다"
      />
    );
  }

  if (amount !== config.tossAmount) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId,
      metadata: {
        provider: "toss",
        reason: "amount_mismatch",
        amount,
        expectedAmount: config.tossAmount
      }
    });

    return (
      <ResultShell
        body="결제 금액이 상품 금액과 일치하지 않습니다. 결제가 승인되지 않았습니다."
        cta="결제 화면으로 돌아가기"
        href={`/checkout/${storyId}`}
        title="결제 금액을 확인해 주세요"
      />
    );
  }

  try {
    const payment = await confirmTossPayment({ paymentKey, orderId, amount });

    if (
      !isExpectedTossPayment(payment, {
        orderId,
        amount: config.tossAmount,
        currency: config.tossCurrency
      })
    ) {
      await recordAnalyticsEventSafely({
        eventName: "payment_failed",
        storyId,
        metadata: {
          orderId,
          provider: "toss",
          reason: "confirm_mismatch",
          tossStatus: payment.status
        }
      });

      return (
        <ResultShell
          body="승인된 결제 정보가 현재 상품과 일치하지 않습니다."
          cta="결제 화면으로 돌아가기"
          href={`/checkout/${storyId}`}
          title="결제를 확인하지 못했습니다"
        />
      );
    }

    const completed = await completePreparedPaidStory(storyId, orderId);

    if (!completed) {
      await recordAnalyticsEventSafely({
        eventName: "payment_failed",
        storyId,
        metadata: {
          orderId,
          provider: "toss",
          reason: "paid_story_generation_failed"
        }
      });

      return (
        <ResultShell
          body="결제는 확인했지만 완결편 생성에 실패했습니다. 잠시 후 다시 확인해 주세요."
          cta="결제 화면으로 돌아가기"
          href={`/checkout/${storyId}`}
          title="완결편 생성이 지연되고 있습니다"
        />
      );
    }

    await recordAnalyticsEventSafely({
      eventName: "payment_success",
      storyId,
      metadata: {
        method: payment.method,
        orderId,
        paymentKey,
        provider: "toss"
      }
    });

    const completedHref =
      completed.input.outputLanguage === "en"
        ? `/stories/${storyId}?lang=en`
        : `/stories/${storyId}`;

    return (
      <ResultShell
        body="결제가 승인되어 선택한 전개를 바탕으로 완결편을 열었습니다."
        cta="완결편 읽기"
        href={completedHref}
        title="결제가 완료되었습니다"
      />
    );
  } catch (error) {
    await recordAnalyticsEventSafely({
      eventName: "payment_failed",
      storyId,
      metadata: {
        message:
          error instanceof Error ? error.message : "Toss confirmation failed.",
        orderId,
        provider: "toss"
      }
    });

    return (
      <ResultShell
        body="토스페이먼츠 승인 처리 중 문제가 발생했습니다. 다시 시도해 주세요."
        cta="결제 화면으로 돌아가기"
        href={`/checkout/${storyId}`}
        title="결제 승인에 실패했습니다"
      />
    );
  }
}
