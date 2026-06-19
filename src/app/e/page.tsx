"use client";

import { useEffect, useRef, useState } from "react";
import { englishBibleProgressKey, englishBibleVideos } from "@/lib/xcan/bible-reading";

const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

type SavedProgress = {
  index: number;
  seconds: number;
  updatedAt: string;
};

type YouTubePlayer = {
  playVideo: () => void;
  loadVideoById: (options: {
    videoId: string;
    startSeconds?: number;
  }) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
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
          playsinline: 1,
          rel: 0,
          start: Math.floor(progress.seconds),
        },
        events: {
          onReady: (event) => {
            event.target.loadVideoById({
              videoId: currentVideo.videoId,
              startSeconds: progress.seconds,
            });
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
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
  const startLabel =
    savedProgress.index > 0 || savedProgress.seconds > 0
      ? `${currentVideo.book} ${Math.floor(savedProgress.seconds / 60)}분부터 이어보기`
      : "Genesis부터 영어성경 시작";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative mx-auto flex min-h-screen w-full max-w-none flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-black/65 px-3 py-2 backdrop-blur">
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
            <div className="relative aspect-video w-full">
              <div id="youtube-player" className="absolute inset-0 h-full w-full" />
              {(!isReady || !isPlaying) && (
                <button
                  className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-black/45 px-6 text-center"
                  type="button"
                  onClick={() => {
                    playerRef.current?.playVideo();
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

        <div className="fixed right-3 top-1/2 z-20 flex w-[132px] -translate-y-1/2 flex-col gap-2 sm:right-5 sm:w-[160px]">
          <button
            className="flex w-full items-center justify-center rounded-lg bg-white/90 px-3 py-3 text-center text-xs font-black text-black shadow-xl shadow-black/50"
            type="button"
            onClick={() => {
              window.localStorage.removeItem(englishBibleProgressKey);
              playerRef.current?.loadVideoById({
                videoId: englishBibleVideos[0].videoId,
                startSeconds: 0,
              });
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
