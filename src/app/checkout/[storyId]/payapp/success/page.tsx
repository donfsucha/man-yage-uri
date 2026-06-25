import Link from "next/link";
import { redirect } from "next/navigation";
import { getStory, recordAnalyticsEventSafely } from "@/lib/story/persistence";

export const dynamic = "force-dynamic";

type PayAppSuccessPageProps = {
  params: Promise<{
    storyId: string;
  }>;
};

export default async function PayAppSuccessPage({ params }: PayAppSuccessPageProps) {
  const { storyId } = await params;
  const story = await getStory(storyId);

  if (story?.status === "completed") {
    await recordAnalyticsEventSafely({
      eventName: "payment_success",
      storyId,
      metadata: { provider: "payapp", source: "return_page_completed" }
    });

    redirect(
      story.input.outputLanguage === "en"
        ? `/stories/${storyId}?lang=en`
        : `/stories/${storyId}`
    );
  }

  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-5 pt-10">
        <h1 className="text-3xl font-black leading-tight">
          결제 확인 중입니다
        </h1>
        <p className="leading-7 text-[color:var(--muted)]">
          PayApp 결제는 완료 직후 서버 통보가 도착하면 자동으로 완결편을
          생성하고 열람 상태로 저장합니다. 잠시 후 완결편 보기 버튼을 눌러
          주세요.
        </p>
        <Link className="button-primary w-full" href={`/stories/${storyId}`}>
          완결편 보기
        </Link>
        <Link className="button-secondary w-full" href={`/checkout/${storyId}`}>
          결제 화면으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
