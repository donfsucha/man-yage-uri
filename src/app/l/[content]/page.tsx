import { notFound } from "next/navigation";
import { chooseDatedQtVideo, findLatestQtVideo, parseQtWatchDate, qtChannels, qtVideoTitle, verifiedQtReplay } from "@/lib/xcan/qt-videos";
import SuwonPlayer from "../../suwon/suwon-player";

export const dynamic = "force-dynamic";

export default async function QtVideoPage({ params }: { params: Promise<{ content: string }> }) {
  const { content } = await params;
  if (!Object.prototype.hasOwnProperty.call(qtChannels, content)) notFound();
  const channel = qtChannels[content];
  const now = new Date();
  let candidate: ReturnType<typeof findLatestQtVideo> = null;
  let watchDate: string | null = null;
  try {
    const response = await fetch(channel.url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (response.ok) candidate = findLatestQtVideo(await response.text(), channel, now);
    const seed = verifiedQtReplay(content);
    if (candidate && !channel.dated && candidate.id !== seed?.id) {
      const watch = await fetch(`https://www.youtube.com/watch?v=${candidate.id}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (watch.ok) watchDate = parseQtWatchDate(await watch.text(), content, candidate.id);
    }
  } catch {
    // Keep a known dated replay when the channel or watch metadata is unavailable.
  }
  const video = chooseDatedQtVideo(content, candidate, watchDate, now);
  if (video) return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "if (window.AndroidBot) window.xcanFullscreenClickBound = true;" }} />
      <SuwonPlayer videoId={video.id} title={qtVideoTitle(content, video, now)} />
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
