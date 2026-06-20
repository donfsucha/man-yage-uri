const youtubeVideoId = "KuE94WBUON8";
const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

export default function LivingLifeWebStartPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative mx-auto flex min-h-screen w-full max-w-none flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-black/55 px-3 py-2 backdrop-blur">
          <p className="text-[11px] font-extrabold text-emerald-300 sm:text-xs">
            XC-220 성경통독 거치대
          </p>
          <h1 className="mt-0.5 text-base font-black leading-tight tracking-normal sm:text-lg">
            생명의 삶 영상 바로 보기
          </h1>
        </div>

        <div className="flex min-h-screen w-full items-start justify-center bg-black">
          <div className="w-full bg-black">
            <div className="relative aspect-video w-full">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&playsinline=1&rel=0`}
                title="생명의 삶 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        <div className="fixed right-3 top-1/2 z-20 w-[126px] -translate-y-1/2 sm:right-5 sm:w-[150px]">
          <a
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-3 text-center text-sm font-black text-white shadow-xl shadow-black/50 no-underline"
            href={playStoreUrl}
          >
            <span aria-hidden="true">▶</span>
            앱 다운로드
          </a>
        </div>
      </section>
    </main>
  );
}
