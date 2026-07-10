"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";

const youtubeVideoId = "u8skIWGOyGM";
const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

export default function LivingLifeWebStartPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [isXcanApp, setIsXcanApp] = useState(false);
  const chromeTimerRef = useRef<number | null>(null);

  const revealChrome = useCallback(() => {
    setShowChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    if (isPlaying && isXcanApp) {
      chromeTimerRef.current = window.setTimeout(() => setShowChrome(false), 3200);
    }
  }, [isPlaying, isXcanApp]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsXcanApp(Boolean(window.AndroidBot));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isXcanApp) return undefined;

    const timer = window.setTimeout(revealChrome, 0);
    return () => {
      window.clearTimeout(timer);
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    };
  }, [isPlaying, isXcanApp, revealChrome]);

  const shouldHideChrome = isXcanApp && isPlaying && !showChrome;

  const startVideo = () => {
    requestVideoFullscreen();
    setIsPlaying(true);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <section
        className="relative mx-auto flex min-h-screen w-full max-w-none flex-col overflow-hidden"
        onClick={revealChrome}
      >
        <div
          className={`pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-black/55 px-3 py-2 backdrop-blur transition-opacity duration-300 ${
            shouldHideChrome ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-[11px] font-extrabold text-emerald-300 sm:text-xs">
            {"XC-220 \uC131\uACBD\uD1B5\uB3C5 \uAC70\uCE58\uB300"}
          </p>
          <h1 className="mt-0.5 text-base font-black leading-tight tracking-normal sm:text-lg">
            {"\uC0DD\uBA85\uC758 \uC0B6 \uC601\uC0C1 \uBC14\uB85C \uBCF4\uAE30"}
          </h1>
        </div>

        <div className="flex min-h-screen w-full items-start justify-center bg-black">
          <div className="w-full bg-black">
            <div id="youtube-shell" className="relative aspect-video w-full">
              {isPlaying && (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&playsinline=0&rel=0`}
                  title={"\uC0DD\uBA85\uC758 \uC0B6 \uC601\uC0C1"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                  allowFullScreen
                />
              )}
              {!isPlaying && (
                <button
                  className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-black/55 px-6 text-center"
                  type="button"
                  onClick={startVideo}
                >
                  <span className="rounded-full bg-emerald-500 px-6 py-4 text-xl font-black shadow-xl shadow-black/40">
                    {"\u25B6 \uC0DD\uBA85\uC758 \uC0B6 \uC7AC\uC0DD"}
                  </span>
                  <span className="text-sm font-bold text-white/80">
                    {"\uB204\uB974\uBA74 \uC804\uCCB4\uD654\uBA74\uC73C\uB85C \uC2E4\uD589\uB429\uB2C8\uB2E4."}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className={`fixed right-3 top-1/2 z-20 w-[126px] -translate-y-1/2 transition-opacity duration-300 sm:right-5 sm:w-[150px] ${
            shouldHideChrome || isXcanApp ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <a
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-3 text-center text-sm font-black text-white shadow-xl shadow-black/50 no-underline"
            href={playStoreUrl}
          >
            <span aria-hidden="true">{"\u25B6"}</span>
            {"\uC571 \uB2E4\uC6B4\uB85C\uB4DC"}
          </a>
        </div>
      </section>
    </main>
  );
}