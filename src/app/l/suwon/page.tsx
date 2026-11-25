import {
  chooseSuwonWorship, previousSuwonReplay, resolveSuwonPlayback,
  suwonFeedUrl, suwonKoreaDate, suwonStreamsUrl, suwonWorshipTitle, verifiedSuwonReplay,
} from "@/lib/xcan/suwon-worship";
import { getYouTubeText } from "@/lib/xcan/youtube-json";
import { unstable_cache } from "next/cache";
import { isRecentReplay, needsReplayLabel, playbackRevalidationSeconds } from "@/lib/xcan/dated-replay";
import SuwonPlayer from "../../suwon/suwon-player";

export const dynamic = "force-dynamic";

const lookupSuwonWorship = unstable_cache(async () => {
  const [streams, feed] = await Promise.all([getYouTubeText(suwonStreamsUrl), getYouTubeText(suwonFeedUrl)]);
  const now = new Date();
  const matched = await resolveSuwonPlayback(streams, feed, now);
  if (!matched || (!matched.live && (!matched.date || !isRecentReplay(matched.date, suwonKoreaDate(now))))) {
    throw new Error("No eligible Suwon dawn source found");
  }
  return { matched, checkedAt: now.getTime() };
}, ["xcan-suwon-dawn-lookup-v2"], { revalidate: playbackRevalidationSeconds });

export default async function SuwonWorshipPage() {
  const now = new Date();
  const today = suwonKoreaDate(now);
  const cached = await lookupSuwonWorship().catch(() => null);
  const stale = !cached || needsReplayLabel(cached.checkedAt, now.getTime());
  const liveOrReplay = cached && ((cached.matched.live && !stale) ||
    (!cached.matched.live && cached.matched.date && isRecentReplay(cached.matched.date, today))) ? cached.matched : null;
  const seed = [verifiedSuwonReplay, previousSuwonReplay].find((item) => item.date && isRecentReplay(item.date, today)) ?? null;
  // Manually verified current-day broadcast; automatic live detection still takes priority.
  const verifiedTodayReplay = today === "2026-11-26"
    ? { videoId: "Fp6_Ck4-IcQ", date: "2026-11-26", live: false }
    : null;
  const worship = chooseSuwonWorship([liveOrReplay, verifiedTodayReplay, seed], now);
  const fallback = stale || worship === verifiedTodayReplay || worship === seed;
  if (worship) return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "if (window.AndroidBot) window.xcanFullscreenClickBound = true;" }} />
      <SuwonPlayer videoId={worship.videoId} title={suwonWorshipTitle(worship, now, worship === verifiedTodayReplay ? false : fallback)} />
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

