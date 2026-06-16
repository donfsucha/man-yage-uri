const youtubeVideoId = "MapLLfsGIN8";
const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

export default function BibleWebStartPage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col">
        <div className="px-5 pb-4 pt-7">
          <p className="text-sm font-extrabold text-emerald-300">XC-220 성경통독 거치대</p>
          <h1 className="mt-2 text-[30px] font-black leading-tight tracking-normal">
            거치하면
            <br />
            성경통독 영상이 바로 열립니다
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-slate-300">
            앱 설치 전에도 웹브라우저에서 바로 시청할 수 있습니다. 이어보기와 기록
            관리는 앱 설치 후 사용할 수 있습니다.
          </p>
        </div>

        <div className="px-4">
          <div className="overflow-hidden rounded-lg border border-slate-700 bg-black shadow-2xl">
            <div className="relative aspect-video w-full">
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

        <div className="grid gap-3 px-5 py-5">
          <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-4">
            <p className="text-sm font-bold text-emerald-200">앱을 설치하면 더 편합니다</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              다음 거치부터 XCAN PLAYER로 바로 열고, 성경통독 루틴을 이어갈 수 있습니다.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-slate-800 bg-[#07111f]/95 px-5 py-4 backdrop-blur">
          <a
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-emerald-500 px-5 py-4 text-center text-[17px] font-black text-white shadow-lg shadow-emerald-950/40 no-underline"
            href={playStoreUrl}
          >
            <span aria-hidden="true">▶</span>
            XCAN PLAYER 앱 다운로드
          </a>
          <p className="mt-3 text-center text-xs leading-5 text-slate-400">
            앱이 이미 설치되어 있다면 첫 번째 거치대에서 자동 실행을 시연하세요.
          </p>
        </div>
      </section>
    </main>
  );
}
