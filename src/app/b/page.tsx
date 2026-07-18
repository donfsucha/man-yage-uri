"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";
import {
  findKoreanBibleIndexByBook,
  findKoreanBibleIndexByDay,
  findKoreanBibleIndexByVideoId,
  getKoreanBibleCompletionPercent,
  groupKoreanBibleVideosByBook,
  koreanBiblePlaylistId,
  koreanBibleProgressKey,
  koreanBibleVideos,
  legacyKoreanBibleProgressKey,
  type KoreanBibleBookGroup,
  type KoreanBibleVideo,
} from "@/lib/xcan/bible-reading";

const playStoreUrl =
  "https://play.google.com/store/apps/details?id=com.cnanfc.xcanplayer&pcampaignid=web_share";

type SavedProgress = {
  index: number;
  seconds: number;
  completedDays: number[];
  updatedAt: string;
};

const emptyProgress: SavedProgress = {
  index: 0,
  seconds: 0,
  completedDays: [],
  updatedAt: "",
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
    xcanOpenReadingPlan?: () => void;
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

type StoredKoreanBibleProgress = Partial<
  SavedProgress & {
    currentIndex: number;
    positionSeconds: number;
    dayNumber: number;
    videoId: string | null;
    book: string;
    title: string;
  }
>;

function resolveSavedProgressIndex(parsed: StoredKoreanBibleProgress) {
  const savedVideoId = typeof parsed.videoId === "string" ? parsed.videoId : "";

  if (savedVideoId) {
    const indexByVideo = findKoreanBibleIndexByVideoId(savedVideoId);
    if (indexByVideo >= 0) return indexByVideo;
  }

  const savedBook = typeof parsed.book === "string" ? parsed.book : "";
  const savedTitle = typeof parsed.title === "string" ? parsed.title : "";
  const looksLikeBookStart = !savedVideoId || savedTitle.includes("\uC2DC\uC791");

  if (looksLikeBookStart && savedBook) {
    const indexByBook = findKoreanBibleIndexByBook(savedBook);
    if (indexByBook >= 0) return indexByBook;
  }

  const savedDay = Number(parsed.dayNumber);
  if (Number.isFinite(savedDay)) {
    const indexByDay = findKoreanBibleIndexByDay(savedDay);
    if (indexByDay >= 0) return indexByDay;
  }

  const parsedIndex = Number(parsed.index ?? parsed.currentIndex);
  if (!Number.isFinite(parsedIndex)) return 0;

  return Math.min(koreanBibleVideos.length - 1, Math.max(0, parsedIndex));
}

function loadSavedProgress(): SavedProgress {
  if (typeof window === "undefined") {
    return emptyProgress;
  }

  try {
    const saved = readSavedProgress();
    if (!saved) return emptyProgress;

    const parsed = JSON.parse(saved) as StoredKoreanBibleProgress;

    return {
      index: resolveSavedProgressIndex(parsed),
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

function disableYoutubeCaptions(player: YouTubePlayer | null) {
  player?.setOption?.("captions", "track", {});
  player?.unloadModule?.("captions");
}

function playCurrentVideo(player: YouTubePlayer | null) {
  requestVideoFullscreen("xcan-player-shell");
  if (typeof player?.playVideo === "function") {
    applyYoutubePlaybackRate(player);
    disableYoutubeCaptions(player);
    player.playVideo();
  }
}

function applyYoutubePlaybackRate(player: YouTubePlayer | null, requestedRate?: number) {
  const rate = Number(
    requestedRate ?? (typeof window !== "undefined" ? window.androidSpeed : undefined) ?? 1,
  );

  if (!Number.isFinite(rate) || rate <= 0) return;
  player?.setPlaybackRate?.(rate);
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

function getGroupKey(group: KoreanBibleBookGroup) {
  return `${group.book}-${group.startDay}`;
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
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);
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

  const bookGroups = useMemo(() => groupKoreanBibleVideosByBook(koreanBibleVideos), []);
  const completedPercent = useMemo(
    () => getKoreanBibleCompletionPercent(savedProgress.completedDays),
    [savedProgress.completedDays],
  );

  const currentVideo = koreanBibleVideos[savedProgress.index] ?? koreanBibleVideos[0];
  const shouldHideChrome = isXcanApp && isPlaying && !showChrome;

  const findGroupKeyForIndex = useCallback(
    (index: number) => {
      const video = koreanBibleVideos[index] ?? koreanBibleVideos[0];
      const group = bookGroups.find((item) =>
        item.items.some((entry) => entry.day === video.day),
      );
      return group ? getGroupKey(group) : null;
    },
    [bookGroups],
  );

  useEffect(() => {
    window.xcanOpenReadingPlan = () => {
      setOpenGroupKey((value) => value ?? findGroupKeyForIndex(savedProgress.index));
      setIsPlanOpen(true);
      setShowChrome(true);
    };

    return () => {
      window.xcanOpenReadingPlan = undefined;
    };
  }, [findGroupKeyForIndex, savedProgress.index]);

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
    requestVideoFullscreen("xcan-player-shell");
    setIsPlaying(true);
    setIsPlanOpen(false);
    setOpenGroupKey(findGroupKeyForIndex(safeIndex));

    if (playerRef.current) {
      playBibleVideo(playerRef.current, video, seconds);
      applyYoutubePlaybackRate(playerRef.current);
    }
  };

  useEffect(() => {
    const progress = loadSavedProgress();
    activeIndexRef.current = progress.index;
    completedDaysRef.current = progress.completedDays;
    window.setTimeout(() => {
      setSavedProgress(progress);
      setOpenGroupKey(findGroupKeyForIndex(progress.index));
    }, 0);

    window.onYouTubeIframeAPIReady = () => {
      const initialVideo = koreanBibleVideos[activeIndexRef.current] ?? koreanBibleVideos[0];

      playerRef.current = new window.YT!.Player("youtube-player", {
        videoId: initialVideo.videoId,
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
            playBibleVideo(event.target, initialVideo, progress.seconds);
            applyYoutubePlaybackRate(event.target);
            disableYoutubeCaptions(event.target);
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              requestVideoFullscreen("xcan-player-shell");
              applyYoutubePlaybackRate(event.target);
              disableYoutubeCaptions(event.target);
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
              setOpenGroupKey(findGroupKeyForIndex(nextIndex));
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
  }, [findGroupKeyForIndex]);

  const startLabel =
    savedProgress.seconds > 0
      ? `${currentVideo.title} ${Math.floor(savedProgress.seconds / 60)}분부터 이어보기`
      : `${currentVideo.title} 시작`;

  return (
    <main className="min-h-screen bg-black text-white">
      <section id="xcan-player-shell" className="relative mx-auto flex min-h-screen w-full max-w-none flex-col overflow-hidden" onClick={revealChrome}>
        <div className={`pointer-events-none absolute left-3 top-3 z-10 max-w-[78vw] rounded-md bg-black/70 px-3 py-2 backdrop-blur transition-opacity duration-300 ${shouldHideChrome ? "opacity-0" : "opacity-100"}`}>
          <p className="text-[11px] font-extrabold text-emerald-300 sm:text-xs">
            XC-220 성경통독 거치대
          </p>
          <h1 className="mt-0.5 text-base font-black leading-tight tracking-normal sm:text-lg">
            한글성경통독 이어보기
          </h1>
          <p className="mt-1 max-w-[280px] text-[11px] font-bold text-white/80 sm:text-xs">
            {startLabel}
          </p>
          <p className="mt-1 text-[11px] font-bold text-white/70">
            읽기표 {savedProgress.completedDays.length}/{koreanBibleVideos.length} · {completedPercent}%
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
                    playCurrentVideo(playerRef.current);
                    setIsPlaying(true);
                  }}
                >
                  <span className="max-w-[88vw] rounded-full bg-emerald-500 px-6 py-4 text-lg font-black shadow-xl shadow-black/40 sm:text-xl">
                    {startLabel}
                  </span>
                  <span className="text-sm font-bold text-white/80">
                    자동재생이 막히면 한 번 눌러 주세요.
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {!isXcanApp && (
          <button
            aria-label="성경 읽기표 열기"
            className="fixed right-2 top-1/2 z-20 -translate-y-1/2 rounded-md bg-sky-500/95 px-3 py-3 text-xs font-black text-white shadow-lg shadow-black/50"
            type="button"
            onClick={() => {
              setOpenGroupKey((value) => value ?? findGroupKeyForIndex(savedProgress.index));
              setIsPlanOpen(true);
            }}
          >
            읽기표
          </button>
        )}

        {isPlanOpen && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-zinc-950/96 px-3 pb-4 pt-3 text-white shadow-2xl shadow-black backdrop-blur sm:left-auto sm:right-4 sm:bottom-4 sm:w-[440px] sm:rounded-lg sm:border">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-emerald-300">성경 읽기표</p>
                <h2 className="text-lg font-black">책별 시작 위치 선택</h2>
                <p className="mt-1 text-xs font-bold text-white/65">
                  책을 먼저 열고, 안에서 원하는 일차를 선택하세요.
                </p>
              </div>
              <button
                className="min-w-16 shrink-0 whitespace-nowrap rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white"
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

            <div className="max-h-[48vh] overflow-y-auto pr-1">
              {bookGroups.map((group) => {
                const key = getGroupKey(group);
                const isOpen = openGroupKey === key;
                const completedInGroup = group.items.filter((video) =>
                  savedProgress.completedDays.includes(video.day),
                ).length;
                const dayLabel =
                  group.startDay === group.endDay
                    ? `${group.startDay}일차부터`
                    : `${group.startDay}-${group.endDay}일차`;

                return (
                  <section className="mb-2 rounded-lg border border-white/10 bg-white/5" key={key}>
                    <button
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                      type="button"
                      onClick={() => setOpenGroupKey(isOpen ? null : key)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-base font-black">{group.book}</span>
                        <span className="block truncate text-xs font-bold text-white/60">
                          {dayLabel} · {completedInGroup}/{group.items.length} 완료
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white">
                        {isOpen ? "접기" : "열기"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 px-2 py-2">
                        {group.items.map((video) => {
                          const index = koreanBibleVideos.findIndex((item) => item.day === video.day);
                          const isCurrent = index === savedProgress.index;
                          const isCompleted = savedProgress.completedDays.includes(video.day);

                          return (
                            <div
                              className={`mb-2 grid grid-cols-[34px_1fr_70px] items-center gap-2 rounded-md border px-2 py-2 last:mb-0 ${
                                isCurrent
                                  ? "border-emerald-400 bg-emerald-500/15"
                                  : "border-white/10 bg-black/25"
                              }`}
                              key={`${video.day}-${video.title}`}
                            >
                              <button
                                aria-pressed={isCompleted}
                                className={`h-8 w-8 rounded-full text-xs font-black ${
                                  isCompleted ? "bg-emerald-500 text-white" : "bg-white/10 text-white/70"
                                }`}
                                type="button"
                                onClick={() => {
                                  const nextCompletedDays = toggleDay(
                                    savedProgress.completedDays,
                                    video.day,
                                  );
                                  setProgress({
                                    ...savedProgress,
                                    completedDays: nextCompletedDays,
                                    updatedAt: new Date().toISOString(),
                                  });
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
                                  {video.chapters} · {video.day}일차
                                </span>
                              </button>
                              <button
                                className="whitespace-nowrap rounded-md bg-white/12 px-2 py-2 text-xs font-black text-white"
                                type="button"
                                onClick={() => startAtIndex(index, 0)}
                              >
                                시작
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
