import {
  chooseSuwonWorship, findDatedSuwonFeedWorship, findLatestSuwonStream, parseSuwonWatchWorship,
  suwonFeedUrl, suwonStreamsUrl, suwonWorshipTitle, verifiedSuwonReplay,
} from "@/lib/xcan/suwon-worship";
import SuwonPlayer from "../../suwon/suwon-player";

export const dynamic = "force-dynamic";

async function fetchSource(url: string): Promise<string> {
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
}

export default async function SuwonWorshipPage() {
  const [streams, feed] = await Promise.all([fetchSource(suwonStreamsUrl), fetchSource(suwonFeedUrl)]);
  const now = new Date();
  const stream = findLatestSuwonStream(streams);
  const candidateId = stream ? new URL(stream).searchParams.get("v") : null;
  const feedWorship = findDatedSuwonFeedWorship(feed, now);
  const streamWorship = candidateId
    ? parseSuwonWatchWorship(await fetchSource(`https://www.youtube.com/watch?v=${candidateId}`), candidateId)
    : null;
  const worship = chooseSuwonWorship([streamWorship, feedWorship, verifiedSuwonReplay], now);
  if (worship) return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "if (window.AndroidBot) window.xcanFullscreenClickBound = true;" }} />
      <SuwonPlayer videoId={worship.videoId} title={suwonWorshipTitle(worship, now)} />
    </>
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-950 p-6 text-center text-white">
      <h1 className="text-2xl font-bold">새벽기도회 영상을 확인할 수 없습니다</h1>
      <p>영상이 아직 준비되지 않았거나 연결에 문제가 있을 수 있습니다. 잠시 후 다시 확인해 주세요.</p>
      <a className="rounded-lg bg-emerald-600 px-6 py-3 font-bold" href="/l/suwon">다시 확인</a>
      <a className="underline" href="https://www.youtube.com/@SuwonJeilCh/streams">수원제일교회 유튜브 보기</a>
    </main>
  );
}

