"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";

const youtubeVideoId = "7YSRTexpM7Y";
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
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT!.Player("youtube-player", {
        videoId: youtubeVideoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 0,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            applyYoutubePlaybackRate(event.target);
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              requestVideoFullscreen();
              applyYoutubePlaybackRate(event.target);
              setIsPlaying(true);
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

    return () => {
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const shouldHideChrome = isXcanApp && isPlaying && !showChrome;

  const startVideo = () => {
    requestVideoFullscreen();
    applyYoutubePlaybackRate(playerRef.current);
    playerRef.current?.playVideo?.();
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
            {"XC-220 ???? ???"}
          </p>
          <h1 className="mt-0.5 text-base font-black leading-tight tracking-normal sm:text-lg">
            {"??? ? ?? ?? ??"}
          </h1>
        </div>

        <div className="flex min-h-screen w-full items-start justify-center bg-black">
          <div className="w-full bg-black">
            <div id="youtube-shell" className="relative aspect-video w-full">
              <div id="youtube-player" className="absolute inset-0 h-full w-full" />
              {(!isReady || !isPlaying) && (
                <button
                  className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-black/55 px-6 text-center"
                  type="button"
                  onClick={startVideo}
                >
                  <span className="rounded-full bg-emerald-500 px-6 py-4 text-xl font-black shadow-xl shadow-black/40">
                    {"? ??? ? ??"}
                  </span>
                  <span className="text-sm font-bold text-white/80">
                    {"??? ?????? ?????."}
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
            <span aria-hidden="true">{"?"}</span>
            {"? ????"}
          </a>
        </div>
      </section>
    </main>
  );
}
