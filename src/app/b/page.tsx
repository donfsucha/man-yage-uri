"use client";

import { useEffect, useMemo, useState } from "react";

const youtubeUrl = "https://www.youtube.com/watch?v=MapLLfsGIN8";

function getIntentUrl() {
  const fallback = encodeURIComponent(youtubeUrl);

  return `intent://bible-start#Intent;scheme=xcanplayer;package=com.cnanfc.xcanplayer.demo;S.browser_fallback_url=${fallback};end`;
}

export default function BibleStartPage() {
  const [status, setStatus] = useState("앱 실행을 준비하고 있습니다.");
  const intentUrl = useMemo(() => getIntentUrl(), []);

  const openApp = () => {
    setStatus("앱을 여는 중입니다. 앱이 없으면 유튜브로 이동합니다.");
    window.location.href = intentUrl;
  };

  useEffect(() => {
    const isAndroid = /Android/i.test(window.navigator.userAgent);

    if (!isAndroid) {
      setStatus("PC에서는 앱 자동실행이 되지 않습니다. 휴대폰에서 NFC로 테스트해 주세요.");
      return;
    }

    const timer = window.setTimeout(openApp, 500);
    return () => window.clearTimeout(timer);
  }, [intentUrl]);

  return (
    <main className="min-h-screen bg-[#0b1220] px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[520px] flex-col justify-center gap-5">
        <div className="text-sm font-extrabold text-[#55e6c1]">XC-220 성경통독 거치대</div>
        <h1 className="text-[34px] font-black leading-tight tracking-normal">
          거치하면
          <br />
          성경통독이 바로 시작됩니다
        </h1>
        <p className="text-base leading-7 text-slate-300">
          앱이 설치되어 있으면 XCAN PLAYER가 열리고, 앱이 없으면 오늘의 성경통독
          영상으로 연결됩니다.
        </p>

        <div className="mt-3 rounded-[10px] border border-slate-500/30 bg-slate-900/90 p-5">
          <div className="mb-4 font-extrabold text-blue-300">{status}</div>
          <button
            className="block w-full rounded-lg bg-emerald-500 px-5 py-4 text-center text-[17px] font-black text-white"
            type="button"
            onClick={openApp}
          >
            앱으로 성경통독 시작
          </button>
          <a
            className="mt-3 block w-full rounded-lg bg-blue-700 px-5 py-4 text-center text-[17px] font-black text-white no-underline"
            href={youtubeUrl}
          >
            앱 없이 유튜브로 보기
          </a>
          <p className="mt-4 text-[13px] leading-6 text-slate-400">
            내일 데모용 페이지입니다. 정식 앱 승인 후에는 내부 패키지명만 정식 앱으로
            바꾸면 됩니다.
          </p>
        </div>
      </section>
    </main>
  );
}
