"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getKoreanBibleCompletionPercent,
  koreanBiblePlaylistId,
  koreanBibleProgressKey,
  koreanBibleVideos,
  legacyKoreanBibleProgressKey,
  type KoreanBibleVideo,
} from "@/lib/xcan/bible-reading";

const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

const emptyProgress: SavedProgress = {
  index: 0,
  seconds: 0,
  completedDays: [],
  updatedAt: "",
};

type SavedProgress = {
  index: number;
  seconds: number;
  completedDays: number[];
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

function readSavedProgress() {
  const saved =
    window.localStorage.getItem(koreanBibleProgressKey) ??
    window.localStorage.getItem(legacyKoreanBibleProgressKey);

  if (saved && !window.localStorage.getItem(koreanBibleProgressKey)) {
    window.localStorage.setItem(koreanBibleProgressKey, saved);
  }

  return saved;
}

function normalizeCompletedDays(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0),
    ),
  ).sort((a, b) => a - b);
}

function loadSavedProgress(): SavedProgress {
  if (typeof window === "undefined") {
    return emptyProgress;
  }

  try {
    const saved = readSavedProgress();
    if (!saved) return emptyProgress;

    const parsed = JSON.parse(saved) as Partial<
      SavedProgress & {
        currentIndex: number;
        positionSeconds: number;
      }
    >;
    const parsedIndex = Number(parsed.index ?? parsed.currentIndex);
    const maxIndex = koreanBibleVideos.length - 1;
    const safeIndex = Number.isFinite(parsedIndex) ? parsedIndex : 0;

    return {
      index: Math.min(maxIndex, Math.max(0, safeIndex)),
      seconds: Math.max(0, Number(parsed.seconds ?? parsed.positionSeconds) || 0),
      completedDays: normalizeCompletedDays(parsed.completedDays),
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return emptyProgress;
  }
}

function playBibleVideo(player: YouTubePlayer, video: KoreanBibleVideo, seconds: number) {
  if (video.videoId) {
    if (!player.loadVideoById) return;
    player.loadVideoById({
      videoId: video.videoId,
      startSeconds: seconds,
    });
    return;
  }

  player.loadPlaylist?.({
    list: koreanBiblePlaylistId,
    listType: "playlist",
    index: video.playlistIndex,
    startSeconds: seconds,
  });
}

function playCurrentVideo(player: YouTubePlayer | null) {
  if (typeof player?.playVideo === "function") {
    player.playVideo();
  }
}

function saveProgressSnapshot(progress: SavedProgress) {
  const currentVideo = koreanBibleVideos[progress.index] ?? koreanBibleVideos[0];

  window.localStorage.setItem(
    koreanBibleProgressKey,
    JSON.stringify({
      contentKey: "korean_bible_reading",
      sourceType: "youtube_sequence",
      playlistId: koreanBiblePlaylistId,
      index: progress.index,
      currentIndex: progress.index,
      dayNumber: currentVideo.day,
      book: currentVideo.book,
      title: currentVideo.title,
      videoId: currentVideo.videoId ?? null,
      playlistIndex: currentVideo.playlistIndex,
      seconds: progress.seconds,
      positionSeconds: progress.seconds,
      completedDays: progress.completedDays,
      updatedAt: progress.updatedAt,
    }),
  );
  window.localStorage.removeItem(legacyKoreanBibleProgressKey);
}

function saveProgress(player: YouTubePlayer, index: number, completedDays: number[]) {
  const seconds = Math.max(0, Math.floor(player.getCurrentTime?.() ?? 0));
  saveProgressSnapshot({
    index,
    seconds,
    completedDays,
    updatedAt: new Date().toISOString(),
  });
}

function toggleDay(completedDays: number[], day: number) {
  const next = new Set(completedDays);
  if (next.has(day)) {
    next.delete(day);
  } else {
    next.add(day);
  }

  return Array.from(next).sort((a, b) => a - b);
}

export default function BibleWebStartPage() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const completedDaysRef = useRef<number[]>([]);
  const [savedProgress, setSavedProgress] = useState<SavedProgress>(emptyProgress);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const completedPercent = useMemo(
    () => getKoreanBibleCompletionPercent(savedProgress.completedDays),
    [savedProgress.completedDays],
  );

  const setProgress = (progress: SavedProgress) => {
    activeIndexRef.current = progress.index;
    completedDaysRef.current = progress.completedDays;
    setSavedProgress(progress);
    saveProgressSnapshot(progress);
  };

  const startAtIndex = (index: number, seconds = 0) => {
    const safeIndex = Math.min(koreanBibleVideos.length - 1, Math.max(0, index));
    const video = koreanBibleVideos[safeIndex] ?? koreanBibleVideos[0];
    const nextProgress = {
      index: safeIndex,
      seconds,
      completedDays: completedDaysRef.current,
      updatedAt: new Date().toISOString(),
    };

    setProgress(nextProgress);
    setIsPlaying(true);
    setIsPlanOpen(false);

    if (playerRef.current) {
      playBibleVideo(playerRef.current, video, seconds);
    }
  };

  useEffect(() => {
    const progress = loadSavedProgress();
    activeIndexRef.current = progress.index;
    completedDaysRef.current = progress.completedDays;
    window.setTimeout(() => setSavedProgress(progress), 0);

    window.onYouTubeIframeAPIReady = () => {
      const currentVideo = koreanBibleVideos[activeIndexRef.current] ?? koreanBibleVideos[0];

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
            playerRef.current = event.target;
            playBibleVideo(event.target, currentVideo, progress.seconds);
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              setIsPlaying(true);
              saveProgress(event.target, activeIndexRef.current, completedDaysRef.current);
            }

            if (event.data === window.YT?.PlayerState.ENDED) {
              const currentIndex = activeIndexRef.current;
              const completedVideo = koreanBibleVideos[currentIndex] ?? koreanBibleVideos[0];
              const nextCompletedDays = Array.from(
                new Set([...completedDaysRef.current, completedVideo.day]),
              ).sort((a, b) => a - b);
              const nextIndex = Math.min(currentIndex + 1, koreanBibleVideos.length - 1);
              const nextProgress = {
                index: nextIndex,
                seconds: 0,
                completedDays: nextCompletedDays,
                updatedAt: new Date().toISOString(),
              };

              setProgress(nextProgress);
              playBibleVideo(event.target, koreanBibleVideos[nextIndex], 0);
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
        saveProgress(playerRef.current, activeIndexRef.current, completedDaysRef.current);
      }
    }, 5000);

    return () => {
      if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const currentVideo = koreanBibleVideos[savedProgress.index] ?? koreanBibleVideos[0];
  const startLabel =
    savedProgress.index > 0 || savedProgress.seconds > 0
      ? `${currentVideo.title} ${Math.floor(savedProgress.seconds / 60)}분부터 이어보기`
      : "1일차 창세기부터 성경통독 시작";

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
          <p className="mt-1 max-w-[260px] text-[11px] font-bold text-white/80 sm:text-xs">
            {startLabel}
          </p>
          <p className="mt-1 text-[11px] font-bold text-white/70">
            읽기표 {savedProgress.completedDays.length}/{koreanBibleVideos.length} · {completedPercent}%
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
                    playCurrentVideo(playerRef.current);
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
            onClick={() => startAtIndex(0, 0)}
          >
            1일차 다시보기
          </button>
          <button
            className="flex w-full items-center justify-center rounded-lg bg-sky-500 px-3 py-3 text-center text-xs font-black text-white shadow-xl shadow-black/50"
            type="button"
            onClick={() => setIsPlanOpen((value) => !value)}
          >
            읽기표 / 시작 선택
          </button>
          <a
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-3 text-center text-sm font-black text-white shadow-xl shadow-black/50 no-underline"
            href={playStoreUrl}
          >
            <span aria-hidden="true">↓</span>
            앱 다운로드
          </a>
        </div>

        {isPlanOpen && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-zinc-950/96 px-3 pb-4 pt-3 text-white shadow-2xl shadow-black backdrop-blur sm:left-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:rounded-lg sm:border">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-emerald-300">성경 읽기표</p>
                <h2 className="text-lg font-black">시작 위치 선택</h2>
                <p className="mt-1 text-xs font-bold text-white/65">
                  원하는 책을 고르면 다음 NFC 실행 때도 그 위치부터 이어집니다.
                </p>
              </div>
              <button
                className="rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white"
                type="button"
                onClick={() => setIsPlanOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="mb-3 rounded-md bg-white/8 px-3 py-2 text-xs font-bold text-white/80">
              현재 위치: {currentVideo.title} · 완료 {savedProgress.completedDays.length}/
              {koreanBibleVideos.length}
            </div>

            <div className="max-h-[42vh] overflow-y-auto pr-1">
              {koreanBibleVideos.map((video, index) => {
                const isCurrent = index === savedProgress.index;
                const isCompleted = savedProgress.completedDays.includes(video.day);

                return (
                  <div
                    className={`mb-2 grid grid-cols-[38px_1fr_76px] items-center gap-2 rounded-md border px-2 py-2 ${
                      isCurrent
                        ? "border-emerald-400 bg-emerald-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                    key={`${video.day}-${video.title}`}
                  >
                    <button
                      aria-pressed={isCompleted}
                      className={`h-8 w-8 rounded-full text-sm font-black ${
                        isCompleted ? "bg-emerald-500 text-white" : "bg-white/10 text-white/70"
                      }`}
                      type="button"
                      onClick={() => {
                        const nextCompletedDays = toggleDay(savedProgress.completedDays, video.day);
                        const nextProgress = {
                          ...savedProgress,
                          completedDays: nextCompletedDays,
                          updatedAt: new Date().toISOString(),
                        };
                        setProgress(nextProgress);
                      }}
                    >
                      {isCompleted ? "완" : video.day}
                    </button>
                    <button
                      className="min-w-0 text-left"
                      type="button"
                      onClick={() => startAtIndex(index, 0)}
                    >
                      <span className="block truncate text-sm font-black">{video.title}</span>
                      <span className="block truncate text-xs font-bold text-white/60">
                        {video.book} {video.chapters} · {video.day}일차
                      </span>
                    </button>
                    <button
                      className="rounded-md bg-white/12 px-2 py-2 text-xs font-black text-white"
                      type="button"
                      onClick={() => startAtIndex(index, 0)}
                    >
                      시작
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
