"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";
import { useScreenWakeLock } from "@/lib/xcan/use-screen-wake-lock";

const youtubeVideoId = "CXvodE36k1w";
const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

type YouTubePlayer = {
  playVideo?: () => void;
  loadVideoById: (options: {
    videoId: string;
    startSeconds?: number;
  }) => void;
  loadPlaylist?: (options: {
    list: string;
    listType: "playlist";
    index: number;
    startSeconds?: number;
  }) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  setPlaybackRate?: (rate: number) => void;
  setOption?: (module: string, option: string, value: unknown) => void;
  unloadModule?: (module: string) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string;
          width: string;
          height: string;
          playerVars: Record<string, string | number>;
          events: {
            onReady: (event: { target: YouTubePlayer }) => void;
            onStateChange: (event: { data: number; target: YouTubePlayer }) => void;
          };
        },
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
    androidSpeed?: number;
    xcanSetPlaybackRate?: (rate: number) => void;
  }
}

function disableYoutubeCaptions(player: YouTubePlayer | null) {
  player?.setOption?.("captions", "track", {});
  player?.unloadModule?.("captions");
}

function applyYoutubePlaybackRate(player: YouTubePlayer | null, requestedRate?: number) {
  const rate = Number(
    requestedRate ?? (typeof window !== "undefined" ? window.androidSpeed : undefined) ?? 1,
  );

  if (!Number.isFinite(rate) || rate <= 0) return;
  player?.setPlaybackRate?.(rate);
}

export default function LivingLifeWebStartPage() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMessage, setPlaybackMessage] = useState("영상을 준비하고 있습니다.");
  const [showChrome, setShowChrome] = useState(true);
  const [isXcanApp, setIsXcanApp] = useState(false);
  const chromeTimerRef = useRef<number | null>(null);

  useScreenWakeLock(isReady);

  const revealChrome = useCallback(() => {
    setShowChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    if (isPlaying && isXcanApp) {
      chromeTimerRef.current = window.setTimeout(() => setShowChrome(false), 3200);
    }
  }, [isPlaying, isXcanApp]);

  useEffect(() => {
    window.xcanSetPlaybackRate = (rate: number) => {
      applyYoutubePlaybackRate(playerRef.current, rate);
    };

    return () => {
      window.xcanSetPlaybackRate = undefined;
    };
  }, []);

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

  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      const events = {
        onReady: (event: { target: YouTubePlayer }) => {
          playerRef.current = event.target;
          setIsReady(true);
          setPlaybackMessage("재생 버튼을 눌러 주세요.");
          applyYoutubePlaybackRate(event.target);
          disableYoutubeCaptions(event.target);
          try {
            event.target.playVideo?.();
          } catch {
            setPlaybackMessage("재생 버튼을 다시 눌러 주세요. 계속 재생되지 않으면 YouTube에서 열어 주세요.");
          }
        },
        onStateChange: (event: { data: number; target: YouTubePlayer }) => {
          if (event.data === window.YT?.PlayerState.PLAYING) {
            if (window.AndroidBot) requestVideoFullscreen();
            applyYoutubePlaybackRate(event.target);
            disableYoutubeCaptions(event.target);
            setIsPlaying(true);
            setPlaybackMessage("");
          } else if ([-1, 0, 2, 5].includes(event.data)) {
            setIsPlaying(false);
            setPlaybackMessage("재생 버튼을 눌러 주세요.");
          }
        },
        onAutoplayBlocked: () => {
          setIsPlaying(false);
          setPlaybackMessage("재생 버튼을 눌러 주세요. 계속 재생되지 않으면 YouTube에서 열어 주세요.");
        },
        onError: () => {
          setIsPlaying(false);
          setPlaybackMessage("영상을 재생하지 못했습니다. 다시 누르거나 YouTube에서 열어 주세요.");
        },
      };
      playerRef.current = new window.YT!.Player("youtube-player", {
        videoId: youtubeVideoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          rel: 0,
          origin: "https://ifwe.cnanfc.com",
          cc_load_policy: 0,
          iv_load_policy: 3,
        },
        events,
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    if (window.YT?.Player) {
      window.onYouTubeIframeAPIReady();
    } else if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => setPlaybackMessage("영상을 불러오지 못했습니다. YouTube에서 열어 주세요.");
      document.body.appendChild(tag);
    }

    return () => {
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const shouldHideChrome = isXcanApp && isPlaying && !showChrome;

  const startVideo = () => {
    if (!isReady || !playerRef.current) {
      setPlaybackMessage("영상을 준비하고 있습니다. 잠시 후 다시 눌러 주세요.");
      return;
    }
    try {
      applyYoutubePlaybackRate(playerRef.current);
      playerRef.current.playVideo?.();
      setPlaybackMessage("재생을 요청했습니다. 시작되지 않으면 다시 누르거나 YouTube에서 열어 주세요.");
    } catch {
      setPlaybackMessage("영상을 재생하지 못했습니다. 다시 누르거나 YouTube에서 열어 주세요.");
    }
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

        <div className="flex w-full items-start justify-center bg-black">
          <div className="w-full bg-black">
            <div id="youtube-shell" className="relative aspect-video w-full" style={{ minHeight: 200, maxHeight: "calc(100dvh - 10rem)" }}>
              <div id="youtube-player" className="absolute inset-0 h-full w-full" />
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-4">
          {!isPlaying && (
            <button className="min-h-12 w-full rounded-lg bg-emerald-500 px-6 py-3 text-lg font-black disabled:opacity-60" type="button" disabled={!isReady} onClick={startVideo}>
              {isReady ? "▶ 생명의 삶 재생" : "영상 준비 중…"}
            </button>
          )}
          <p role="status" aria-live="polite" className="text-center text-sm font-bold text-white/80">{playbackMessage}</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm font-bold">
            <a className="min-h-11 rounded-lg bg-white/15 px-4 py-3" href="/schedule">시간표 설정</a>
            <a className="min-h-11 rounded-lg bg-white/15 px-4 py-3" href={`https://www.youtube.com/watch?v=${youtubeVideoId}`} target="_blank" rel="noreferrer">YouTube에서 보기</a>
          </div>
        </div>

        <div className={isXcanApp ? "hidden" : "mx-auto w-fit px-4 pb-4"}>
          <a
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-3 text-center text-sm font-black text-white shadow-xl shadow-black/50 no-underline"
            href={playStoreUrl}
          >
            <span aria-hidden="true">{"\u25BC"}</span>
            {"Android 앱 다운로드"}
          </a>
        </div>
      </section>
    </main>
  );
}
