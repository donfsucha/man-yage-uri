import { redirect } from "next/navigation";
import { findLatestSuwonStream, findTodaySuwonWorship, suwonFeedUrl, suwonStreamsUrl } from "@/lib/xcan/suwon-worship";

export const dynamic = "force-dynamic";

export default async function SuwonWorshipPage() {
  let videoUrl: string | null = null;
  try {
    const response = await fetch(suwonStreamsUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (response.ok) videoUrl = findLatestSuwonStream(await response.text());
  } catch {
    // Fall back to the channel feed if the streams page is unavailable.
  }
  if (!videoUrl) {
    try {
      const response = await fetch(suwonFeedUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (response.ok) videoUrl = findTodaySuwonWorship(await response.text());
    } catch {
      // Show a retry option when YouTube is unavailable.
    }
  }
  if (videoUrl) redirect(videoUrl);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-950 p-6 text-center text-white">
      <h1 className="text-2xl font-bold">새벽기도회 영상을 확인할 수 없습니다</h1>
      <p>영상이 아직 준비되지 않았거나 연결에 문제가 있을 수 있습니다. 잠시 후 다시 확인해 주세요.</p>
      <a className="rounded-lg bg-emerald-600 px-6 py-3 font-bold" href="/suwon">다시 확인</a>
      <a className="underline" href="https://www.youtube.com/@SuwonJeilCh/streams">수원제일교회 유튜브 보기</a>
    </main>
  );
}
