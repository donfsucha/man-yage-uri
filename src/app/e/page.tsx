"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";
import { englishBibleProgressKey, englishBibleVideos } from "@/lib/xcan/bible-reading";

type SavedProgress = {
  index: number;
  seconds: number;
  updatedAt: string;
};

type YouTubePlayer = {
  playVideo?: () => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
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
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
    androidSpeed?: number;
    xcanSetPlaybackRate?: (rate: number) => void;
    xcanOpenEnglishReadingPlan?: () => void;
  }
}

const oldTestamentBooks = new Set([
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "2 Samuel",
  "1 Chronicles",
  "2 Chronicles",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Daniel",
]);

const emptyProgress: SavedProgress = { index: 0, seconds: 0, updatedAt: "" };

function loadSavedProgress(): SavedProgress {
  if (typeof window === "undefined") return emptyProgress;

  try {
    const saved = window.localStorage.getItem(englishBibleProgressKey);
    if (!saved) return emptyProgress;

    const parsed = JSON.parse(saved) as Partial<SavedProgress>;
    const maxIndex = englishBibleVideos.length - 1;
    const parsedIndex = Number(parsed.index);
    const safeIndex = Number.isFinite(parsedIndex) ? Math.floor(parsedIndex) : 0;

    return {
      index: Math.min(maxIndex, Math.max(0, safeIndex)),
      seconds: Math.max(0, Number(parsed.seconds) || 0),
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return emptyProgress;
  }
}

function saveProgressSnapshot(progress: SavedProgress) {
  window.localStorage.setItem(englishBibleProgressKey, JSON.stringify(progress));
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

function requestEnglishFullscreen() {
  requestVideoFullscreen("xcan-english-player-shell");
}

export default function EnglishBibleWebStartPage() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const activeIndexRef = useRef(0);
  const saveTimerRef = useRef<number | null>(null);
  const chromeTimerRef = useRef<number | null>(null);
  const [savedProgress, setSavedProgress] = useState<SavedProgress>(emptyProgress);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [isXcanApp, setIsXcanApp] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [openGroupKey, setOpenGroupKey] = useState<"old" | "new">("old");

  const revealChrome = useCallback(() => {
    setShowChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    if (isPlaying && isXcanApp) {
      chromeTimerRef.current = window.setTimeout(() => setShowChrome(false), 3200);
    }
  }, [isPlaying, isXcanApp]);

  const setProgress = (progress: SavedProgress) => {
    activeIndexRef.current = progress.index;
    setSavedProgress(progress);
    saveProgressSnapshot(progress);
  };

  const startAtIndex = (index: number, seconds = 0) => {
    const safeIndex = Math.min(englishBibleVideos.length - 1, Math.max(0, index));
    const video = englishBibleVideos[safeIndex] ?? englishBibleVideos[0];
    const progress = {
      index: safeIndex,
      seconds,
      updatedAt: new Date().toISOString(),
    };

    setProgress(progress);
    setOpenGroupKey(oldTestamentBooks.has(video.book) ? "old" : "new");
    setIsPlanOpen(false);
    setIsPlaying(true);
    requestEnglishFullscreen();

    if (playerRef.current) {
      playerRef.current.loadVideoById({ videoId: video.videoId, startSeconds: seconds });
      applyYoutubePlaybackRate(playerRef.current);
      disableYoutubeCaptions(playerRef.current);
    }
  };

  useEffect(() => {
    window.xcanSetPlaybackRate = (rate: number) => {
      applyYoutubePlaybackRate(playerRef.current, rate);
    };
    return () => {
      window.xcanSetPlaybackRate = undefined;
    };
  }, []);

  useEffect(() => {
    setIsXcanApp(Boolean(window.AndroidBot));
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
    window.xcanOpenEnglishReadingPlan = () => {
      const current = englishBibleVideos[activeIndexRef.current] ?? englishBibleVideos[0];
      setOpenGroupKey(oldTestamentBooks.has(current.book) ? "old" : "new");
      setIsPlanOpen(true);
      setShowChrome(true);
    };

    if (new URLSearchParams(window.location.search).get("openPlan") === "1") {
      window.xcanOpenEnglishReadingPlan();
    }

    return () => {
      window.xcanOpenEnglishReadingPlan = undefined;
    };
  }, []);

  useEffect(() => {
    const progress = loadSavedProgress();
    activeIndexRef.current = progress.index;
    window.setTimeout(() => {
      setSavedProgress(progress);
      const current = englishBibleVideos[progress.index] ?? englishBibleVideos[0];
      setOpenGroupKey(oldTestamentBooks.has(current.book) ? "old" : "new");
    }, 0);

    window.onYouTubeIframeAPIReady = () => {
      const initialVideo = englishBibleVideos[activeIndexRef.current] ?? englishBibleVideos[0];

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
            event.target.loadVideoById({
              videoId: initialVideo.videoId,
              startSeconds: progress.seconds,
            });
            applyYoutubePlaybackRate(event.target);
            disableYoutubeCaptions(event.target);
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              requestEnglishFullscreen();
              applyYoutubePlaybackRate(event.target);
              disableYoutubeCaptions(event.target);
              setIsPlaying(true);
              saveProgressSnapshot({
                index: activeIndexRef.current,
                seconds: Math.max(0, Math.floor(event.target.getCurrentTime?.() ?? 0)),
                updatedAt: new Date().toISOString(),
              });
            }

            if (event.data === window.YT?.PlayerState.ENDED) {
              const currentIndex = activeIndexRef.current;
              if (currentIndex >= englishBibleVideos.length - 1) {
                setIsPlaying(false);
                setProgress({ index: currentIndex, seconds: 0, updatedAt: new Date().toISOString() });
                return;
              }

              const nextIndex = currentIndex + 1;
              const nextVideo = englishBibleVideos[nextIndex];
              setProgress({ index: nextIndex, seconds: 0, updatedAt: new Date().toISOString() });
              event.target.loadVideoById({ videoId: nextVideo.videoId, startSeconds: 0 });
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
      const player = playerRef.current;
      if (!player || player.getPlayerState?.() !== window.YT?.PlayerState.PLAYING) return;
      saveProgressSnapshot({
        index: activeIndexRef.current,
        seconds: Math.max(0, Math.floor(player.getCurrentTime?.() ?? 0)),
        updatedAt: new Date().toISOString(),
      });
    }, 5000);

    return () => {
      if (saveTimerRef.current) window.clearInterval(saveTimerRef.current);
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const currentVideo = englishBibleVideos[savedProgress.index] ?? englishBibleVideos[0];
  const shouldHideChrome = isXcanApp && isPlaying && !showChrome && !isPlanOpen;
  const startLabel =
    savedProgress.index > 0 || savedProgress.seconds > 0
      ? `${currentVideo.book} ${Math.floor(savedProgress.seconds / 60)}분부터 이어보기`
      : "Genesis부터 영어성경 시작";

  const groups = [
    {
      key: "old" as const,
      label: "구약",
      items: englishBibleVideos
        .map((video, index) => ({ video, index }))
        .filter(({ video }) => oldTestamentBooks.has(video.book)),
    },
    {
      key: "new" as const,
      label: "신약",
      items: englishBibleVideos
        .map((video, index) => ({ video, index }))
        .filter(({ video }) => !oldTestamentBooks.has(video.book)),
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <section
        id="xcan-english-player-shell"
        className="relative mx-auto flex min-h-screen w-full max-w-none flex-col overflow-hidden"
        onClick={revealChrome}
      >
        <div
          className={`pointer-events-none absolute left-3 top-3 z-10 max-w-[72vw] rounded-md bg-black/70 px-3 py-2 backdrop-blur transition-opacity duration-300 ${
            shouldHideChrome ? "opacity-0" : "opacity-100"
          }`}
        >
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
                    requestEnglishFullscreen();
                    applyYoutubePlaybackRate(playerRef.current);
                    disableYoutubeCaptions(playerRef.current);
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

        {!isXcanApp && (
          <button
            aria-label="영어성경 읽기표 열기"
            className="fixed right-2 top-1/2 z-20 -translate-y-1/2 rounded-md bg-sky-500/95 px-3 py-3 text-xs font-black text-white shadow-lg shadow-black/50"
            type="button"
            onClick={() => {
              setOpenGroupKey(oldTestamentBooks.has(currentVideo.book) ? "old" : "new");
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
                <p className="text-xs font-extrabold text-sky-300">English Bible Reading Plan</p>
                <h2 className="text-lg font-black">영어성경 시작 위치 선택</h2>
                <p className="mt-1 text-xs font-bold text-white/65">
                  현재 제공되는 영어 영상 {englishBibleVideos.length}권 중에서 선택하세요.
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
              현재 위치: {currentVideo.book} · {Math.floor(savedProgress.seconds / 60)}분
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-1">
              {groups.map((group) => {
                const isOpen = openGroupKey === group.key;
                return (
                  <section className="mb-2 rounded-lg border border-white/10 bg-white/5" key={group.key}>
                    <button
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                      type="button"
                      onClick={() => setOpenGroupKey(group.key)}
                    >
                      <span>
                        <span className="block text-base font-black">{group.label}</span>
                        <span className="block text-xs font-bold text-white/60">
                          제공 영상 {group.items.length}권
                        </span>
                      </span>
                      <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black">
                        {isOpen ? "펼침" : "열기"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 px-2 py-2">
                        {group.items.map(({ video, index }) => {
                          const isCurrent = index === savedProgress.index;
                          return (
                            <div
                              className={`mb-2 grid grid-cols-[36px_1fr_64px] items-center gap-2 rounded-md border px-2 py-2 last:mb-0 ${
                                isCurrent
                                  ? "border-sky-400 bg-sky-500/15"
                                  : "border-white/10 bg-black/25"
                              }`}
                              key={video.videoId}
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white/75">
                                {index + 1}
                              </span>
                              <button
                                className="min-w-0 text-left"
                                type="button"
                                onClick={() => startAtIndex(index, 0)}
                              >
                                <span className="block truncate text-sm font-black">{video.book}</span>
                                <span className="block truncate text-[11px] font-bold text-white/55">
                                  {video.title}
                                </span>
                              </button>
                              <button
                                className="rounded-md bg-white/15 px-2 py-2 text-xs font-black text-white"
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
