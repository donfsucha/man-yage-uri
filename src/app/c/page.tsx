const ccmSearchUrl =
  "https://www.youtube.com/results?search_query=CCM+%EC%B0%AC%EC%96%91";

const primaryRoutes = [
  { href: "/l", label: "생명의 삶" },
  { href: "/b", label: "한글성경통독" },
  { href: "/e", label: "영어성경통독" },
];

export default function CcmFallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <section className="w-full max-w-md text-center">
        <p className="text-xs font-extrabold text-emerald-300">XC-220 성경통독 거치대</p>
        <h1 className="mt-3 text-3xl font-black">CCM 시간</h1>
        <p className="mt-4 text-sm font-bold leading-6 text-white/75">
          이 시간대는 찬양 또는 기본 콘텐츠 시간입니다. 자동으로 열 영상이 준비되지 않았을 때도
          NFC 흐름이 끊기지 않도록 이 화면에서 바로 이동할 수 있습니다.
        </p>

        <div className="mt-8 grid gap-3">
          <a
            className="rounded-lg bg-emerald-500 px-5 py-4 text-base font-black text-white no-underline shadow-xl shadow-black/40"
            href={ccmSearchUrl}
          >
            YouTube에서 CCM 찬양 열기
          </a>
          {primaryRoutes.map((route) => (
            <a
              className="rounded-lg bg-white/90 px-5 py-3 text-sm font-black text-black no-underline"
              href={route.href}
              key={route.href}
            >
              {route.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
