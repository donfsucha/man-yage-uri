"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";
import { englishBibleProgressKey, englishBibleVideos } from "@/lib/xcan/bible-reading";

const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

type SavedProgress = {
  index: number;
  seconds: number;
  updatedAt: string;
};

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

function loadSavedProgress(): SavedProgress {
  if (typeof window === "undefined") {
    return { index: 0, seconds: 0, updatedAt: "" };
  }

  try {
    const saved = window.localStorage.getItem(englishBibleProgressKey);
    if (!saved) return { index: 0, seconds: 0, updatedAt: "" };

    const parsed = JSON.parse(saved) as Partial<SavedProgress>;
    const parsedIndex = Number(parsed.index);
    const maxIndex = englishBibleVideos.length - 1;
    const safeIndex = Number.isFinite(parsedIndex) ? parsedIndex : 0;

    return {
      index: Math.min(maxIndex, Math.max(0, safeIndex)),
      seconds: Math.max(0, Number(parsed.seconds) || 0),
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return { index: 0, seconds: 0, updatedAt: "" };
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

function saveProgress(player: YouTubePlayer, index: number) {
  const seconds = Math.max(0, Math.floor(player.getCurrentTime?.() ?? 0));

  window.localStorage.setItem(
    englishBibleProgressKey,
    JSON.stringify({
      index,
      seconds,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export default function EnglishBibleWebStartPage() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [savedProgress, setSavedProgress] = useState<SavedProgress>({
    index: 0,
    seconds: 0,
    updatedAt: "",
  });
  const [isReady, setIsReady] = useState(false);
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
    const progress = loadSavedProgress();
    let activeIndex = progress.index;
    window.setTimeout(() => setSavedProgress(progress), 0);

    window.onYouTubeIframeAPIReady = () => {
      const currentVideo = englishBibleVideos[activeIndex] ?? englishBibleVideos[0];

      playerRef.current = new window.YT!.Player("youtube-player", {
        videoId: currentVideo.videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 0,
          rel: 0,
          origin: "https://ifwe.cnanfc.com",
          cc_load_policy: 0,
          iv_load_policy: 3,
          start: Math.floor(progress.seconds),
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            event.target.loadVideoById({
              videoId: currentVideo.videoId,
              startSeconds: progress.seconds,
            });
            applyYoutubePlaybackRate(event.target);
            disableYoutubeCaptions(event.target);
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              requestVideoFullscreen();
              applyYoutubePlaybackRate(event.target);
              disableYoutubeCaptions(event.target);
              setIsPlaying(true);
              saveProgress(event.target, activeIndex);
            }

            if (event.data === window.YT?.PlayerState.ENDED) {
              const nextIndex = Math.min(activeIndex + 1, englishBibleVideos.length - 1);
              activeIndex = nextIndex;
              window.localStorage.setItem(
                englishBibleProgressKey,
                JSON.stringify({
                  index: nextIndex,
                  seconds: 0,
                  updatedAt: new Date().toISOString(),
                }),
              );
              setSavedProgress({ index: nextIndex, seconds: 0, updatedAt: new Date().toISOString() });
              event.target.loadVideoById({
                videoId: englishBibleVideos[nextIndex].videoId,
                startSeconds: 0,
              });
            }
          },
        },
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
      document.body.appendChild(tag);
    }

    saveTimerRef.current = window.setInterval(() => {
      if (!playerRef.current) return;
      if (playerRef.current.getPlayerState?.() === window.YT?.PlayerState.PLAYING) {
        saveProgress(playerRef.current, activeIndex);
      }
    }, 5000);

    return () => {
      if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const currentVideo = englishBibleVideos[savedProgress.index] ?? englishBibleVideos[0];
  const shouldHideChrome = isXcanApp && isPlaying && !showChrome;
  const startLabel =
    savedProgress.index > 0 || savedProgress.seconds > 0
      ? `${currentVideo.book} ${Math.floor(savedProgress.seconds / 60)}분부터 이어보기`
      : "Genesis부터 영어성경 시작";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative mx-auto flex min-h-screen w-full max-w-none flex-col overflow-hidden" onClick={revealChrome}>
        <div className={`pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-black/65 px-3 py-2 backdrop-blur transition-opacity duration-300 ${shouldHideChrome ? "opacity-0" : "opacity-100"}`}>
          <p className="text-[11px] font-extrabold text-sky-300 sm:text-xs">
            XC-220 성경통독 거치대
          </p>
          <h1 className="mt-0.5 text-base font-black leading-tight tracking-normal sm:text-lg">
            영어성경통독 이어보기
          </h1>
          <p className="mt-1 max-w-[280px] text-[11px] font-bold text-white/80 sm:text-xs">
            {startLabel}
          </p>
        </div>

        <div className="flex min-h-screen w-full items-start justify-center bg-black">
          <div className="w-full bg-black">
            <div id="youtube-shell" className="relative aspect-video w-full">
              <div id="youtube-player" className="absolute inset-0 h-full w-full" />
              {(!isReady || !isPlaying) && (
                <button
                  className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-black/45 px-6 text-center"
                  type="button"
                  onClick={() => {
                    requestVideoFullscreen();
                    applyYoutubePlaybackRate(playerRef.current);
                    playerRef.current?.playVideo?.();
                    setIsPlaying(true);
                  }}
                >
                  <span className="rounded-full bg-sky-500 px-6 py-4 text-xl font-black shadow-xl shadow-black/40">
                    ▶ {startLabel}
                  </span>
                  <span className="text-sm font-bold text-white/80">
                    자동재생이 막히면 한 번 눌러 주세요.
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`fixed right-3 top-1/2 z-20 flex w-[132px] -translate-y-1/2 flex-col gap-2 transition-opacity duration-300 sm:right-5 sm:w-[160px] ${shouldHideChrome ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <button
            className="flex w-full items-center justify-center rounded-lg bg-white/90 px-3 py-3 text-center text-xs font-black text-black shadow-xl shadow-black/50"
            type="button"
            onClick={() => {
              window.localStorage.removeItem(englishBibleProgressKey);
              requestVideoFullscreen();
              playerRef.current?.loadVideoById({
                videoId: englishBibleVideos[0].videoId,
                startSeconds: 0,
              });
              applyYoutubePlaybackRate(playerRef.current);
              setSavedProgress({ index: 0, seconds: 0, updatedAt: "" });
              setIsPlaying(true);
            }}
          >
            Genesis 다시보기
          </button>
          <a
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-3 text-center text-sm font-black text-white shadow-xl shadow-black/50 no-underline"
            href={playStoreUrl}
          >
            <span aria-hidden="true">↓</span>
            앱 다운로드
          </a>
        </div>
      </section>
    </main>
  );
}
