"use client";

import { useEffect, useRef, useState } from "react";

const playlistId = "PLjj_uvKdTemCV3tBQ3iHCe5O-HPXsjtjn";
const genesisStartIndex = 364;
const progressKey = "xcan:korean-bible-reading-progress:v2";
const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

type SavedProgress = {
  index: number;
  seconds: number;
  updatedAt: string;
};

type YouTubePlayer = {
  playVideo: () => void;
  loadPlaylist: (options: {
    listType: "playlist";
    list: string;
    index: number;
    startSeconds?: number;
  }) => void;
  getCurrentTime: () => number;
  getPlaylistIndex: () => number;
  getPlayerState: () => number;
  destroy?: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
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
    return { index: genesisStartIndex, seconds: 0, updatedAt: "" };
  }

  try {
    const saved = window.localStorage.getItem(progressKey);
    if (!saved) return { index: genesisStartIndex, seconds: 0, updatedAt: "" };

    const parsed = JSON.parse(saved) as Partial<SavedProgress>;
    return {
      index: Math.min(
        genesisStartIndex,
        Math.max(0, Number(parsed.index) || genesisStartIndex),
      ),
      seconds: Math.max(0, Number(parsed.seconds) || 0),
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return { index: genesisStartIndex, seconds: 0, updatedAt: "" };
  }
}

function getDayNumber(index: number) {
  return Math.max(1, genesisStartIndex - index + 1);
}

function saveProgress(player: YouTubePlayer) {
  const index = Math.max(0, player.getPlaylistIndex?.() ?? 0);
  const seconds = Math.max(0, Math.floor(player.getCurrentTime?.() ?? 0));

  window.localStorage.setItem(
    progressKey,
    JSON.stringify({
      index,
      seconds,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export default function BibleWebStartPage() {
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
    window.setTimeout(() => setSavedProgress(progress), 0);

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT!.Player("youtube-player", {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          rel: 0,
          listType: "playlist",
          list: playlistId,
          index: progress.index,
          start: Math.floor(progress.seconds),
        },
        events: {
          onReady: (event) => {
            event.target.loadPlaylist({
              listType: "playlist",
              list: playlistId,
              index: progress.index,
              startSeconds: progress.seconds,
            });
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              setIsPlaying(true);
              saveProgress(event.target);
            }

            if (event.data === window.YT?.PlayerState.ENDED) {
              const nextIndex = Math.max(0, event.target.getPlaylistIndex() - 1);
              window.localStorage.setItem(
                progressKey,
                JSON.stringify({
                  index: nextIndex,
                  seconds: 0,
                  updatedAt: new Date().toISOString(),
                }),
              );
              event.target.loadPlaylist({
                listType: "playlist",
                list: playlistId,
                index: nextIndex,
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
        saveProgress(playerRef.current);
      }
    }, 5000);

    return () => {
      if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const startLabel =
    savedProgress.index !== genesisStartIndex || savedProgress.seconds > 0
      ? `${getDayNumber(savedProgress.index)}일차 ${Math.floor(savedProgress.seconds / 60)}분부터 이어보기`
      : "1일차부터 성경통독 시작";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative mx-auto flex min-h-screen w-full max-w-none flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-black/65 px-3 py-2 backdrop-blur">
          <p className="text-[11px] font-extrabold text-emerald-300 sm:text-xs">
            XC-220 성경통독 거치대
          </p>
          <h1 className="mt-0.5 text-base font-black leading-tight tracking-normal sm:text-lg">
            한글성경통독 이어보기
          </h1>
          <p className="mt-1 max-w-[240px] text-[11px] font-bold text-white/80 sm:text-xs">
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
                  <span className="rounded-full bg-emerald-500 px-6 py-4 text-xl font-black shadow-xl shadow-black/40">
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
              window.localStorage.removeItem(progressKey);
              playerRef.current?.loadPlaylist({
                listType: "playlist",
                list: playlistId,
                index: genesisStartIndex,
                startSeconds: 0,
              });
              setSavedProgress({ index: genesisStartIndex, seconds: 0, updatedAt: "" });
              setIsPlaying(true);
            }}
          >
            1일차 다시보기
          </button>
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
