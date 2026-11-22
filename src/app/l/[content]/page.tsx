import { notFound } from "next/navigation";
import { findLatestQtVideo, parseQtWatchDate, qtChannels, qtKoreaDate, qtVideoTitle, resolveDatedQtCandidate, verifiedQtReplay } from "@/lib/xcan/qt-videos";
import { unstable_cache } from "next/cache";
import { isRecentReplay, needsReplayLabel, playbackRevalidationSeconds } from "@/lib/xcan/dated-replay";
import SuwonPlayer from "../../suwon/suwon-player";

export const dynamic = "force-dynamic";

const lookupQtVideo = unstable_cache(async (content: string) => {
  const channel = qtChannels[content];
  const now = new Date();
  const response = await fetch(channel.url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  const candidate = response.ok ? findLatestQtVideo(await response.text(), channel, now) : null;
  const seed = verifiedQtReplay(content);
  let watchDate: string | null = null;
  if (candidate && !channel.dated) {
    if (seed && candidate.id === seed.id) watchDate = seed.date;
    else {
      const watch = await fetch(`https://www.youtube.com/watch?v=${candidate.id}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (watch.ok) watchDate = parseQtWatchDate(await watch.text(), content, candidate.id);
    }
  }
  const matched = resolveDatedQtCandidate(content, candidate, watchDate, now);
  if (!matched || !isRecentReplay(matched.date, qtKoreaDate(now))) {
    throw new Error("No eligible QT source found");
  }
  return { matched, checkedAt: now.getTime() };
}, ["xcan-qt-lookup-v1"], { revalidate: playbackRevalidationSeconds });

export default async function QtVideoPage({ params }: { params: Promise<{ content: string }> }) {
  const { content } = await params;
  if (!Object.prototype.hasOwnProperty.call(qtChannels, content)) notFound();
  const channel = qtChannels[content];
  const now = new Date();
  const today = qtKoreaDate(now);
  const cached = await lookupQtVideo(content).catch(() => null);
  const latest = cached?.matched && isRecentReplay(cached.matched.date, today) ? cached.matched : null;
  const known = verifiedQtReplay(content);
  const seed = known && isRecentReplay(known.date, today) ? known : null;
  const video = latest && (!seed || latest.date >= seed.date) ? latest : seed;
  const fallback = !cached || video === seed || needsReplayLabel(cached.checkedAt, now.getTime());
  if (video) return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "if (window.AndroidBot) window.xcanFullscreenClickBound = true;" }} />
      <SuwonPlayer videoId={video.id} title={qtVideoTitle(content, video, now, fallback)} />
    </>
  );
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-950 p-6 text-center text-white">
      <h1 className="text-2xl font-bold">{channel.name} 영상을 확인할 수 없습니다</h1>
      <p>영상이 아직 준비되지 않았거나 연결에 문제가 있을 수 있습니다. 잠시 후 다시 확인해 주세요.</p>
      <a className="rounded-lg bg-emerald-600 px-6 py-3 font-bold" href={`/l/${content}`}>다시 확인</a>
      <a className="underline" href={channel.url}>유튜브 채널 보기</a>
    </main>
  );
}
