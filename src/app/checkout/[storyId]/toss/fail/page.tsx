import Link from "next/link";
import { recordAnalyticsEventSafely } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

type TossFailPageProps = {
  params: Promise<{
    storyId: string;
  }>;
  searchParams?: Promise<{
    code?: string | string[];
    message?: string | string[];
  }>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TossFailPage({
  params,
  searchParams
}: TossFailPageProps) {
  const { storyId } = await params;
  const query = searchParams ? await searchParams : {};
  const code = getSingleParam(query.code) ?? "UNKNOWN";
  const message =
    getSingleParam(query.message) ??
    "결제가 완료되지 않았습니다. 다시 시도해 주세요.";

  await recordAnalyticsEventSafely({
    eventName: "payment_failed",
    storyId,
    metadata: {
      code,
      message,
      provider: "toss"
    }
  });

  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-5 pt-10">
        <h1 className="text-3xl font-black leading-tight">
          결제가 완료되지 않았습니다
        </h1>
        <p className="leading-7 text-[color:var(--muted)]">{message}</p>
        <Link className="button-primary w-full" href={`/checkout/${storyId}`}>
          결제 화면으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
