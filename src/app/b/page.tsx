const youtubeVideoId = "MapLLfsGIN8";
const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

export default function BibleWebStartPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[900px] flex-col">
        <div className="shrink-0 px-4 pb-2 pt-3">
          <p className="text-xs font-extrabold text-emerald-300 sm:text-sm">
            XC-220 성경통독 거치대
          </p>
          <h1 className="mt-1 text-xl font-black leading-tight tracking-normal sm:text-2xl">
            성경통독 영상 바로 보기
          </h1>
        </div>

        <div className="flex min-h-0 flex-1 items-center px-2 pb-2">
          <div className="w-full overflow-hidden rounded-md bg-black shadow-2xl">
            <div className="relative aspect-video w-full max-h-[calc(100vh-170px)]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&playsinline=1&rel=0`}
                title="CGN 성경통독 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-slate-800 bg-black/95 px-3 py-3 backdrop-blur">
          <a
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-center text-base font-black text-white shadow-lg shadow-emerald-950/40 no-underline"
            href={playStoreUrl}
          >
            <span aria-hidden="true">▶</span>
            XCAN PLAYER 앱 다운로드
          </a>
        </div>
      </section>
    </main>
  );
}
