"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";

const ccmVideoId = "RsXtOHd4EpY";
const prayerVideoId = "JSturTCAH1A";

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

function applyYoutubePlaybackRate(player: YouTubePlayer | null, requestedRate?: number) {
  const rate = Number(
    requestedRate ?? (typeof window !== "undefined" ? window.androidSpeed : undefined) ?? 1,
  );

  if (!Number.isFinite(rate) || rate <= 0) return;
  player?.setPlaybackRate?.(rate);
}

function disableYoutubeCaptions(player: YouTubePlayer | null) {
  player?.setOption?.("captions", "track", {});
  player?.unloadModule?.("captions");
}

export default function CcmPlayerPage() {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [title, setTitle] = useState("CCM 찬양");
  const chromeTimerRef = useRef<number | null>(null);

  const revealChrome = useCallback(() => {
    setShowChrome(true);
    if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
    if (isPlaying) {
      chromeTimerRef.current = window.setTimeout(() => setShowChrome(false), 3200);
    }
  }, [isPlaying]);

  useEffect(() => {
    window.xcanSetPlaybackRate = (rate: number) => {
      applyYoutubePlaybackRate(playerRef.current, rate);
    };

    const params = new URLSearchParams(window.location.search);
    const isPrayer = params.get("mode") === "prayer";
    const selectedVideoId = isPrayer ? prayerVideoId : ccmVideoId;
    setTitle(isPrayer ? "기도음악" : "CCM 찬양");

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT!.Player("youtube-player", {
        videoId: selectedVideoId,
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
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            applyYoutubePlaybackRate(event.target);
            disableYoutubeCaptions(event.target);
            event.target.playVideo?.();
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.PLAYING) {
              requestVideoFullscreen();
              applyYoutubePlaybackRate(event.target);
              disableYoutubeCaptions(event.target);
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
      if (chromeTimerRef.current) window.clearTimeout(chromeTimerRef.current);
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
      window.xcanSetPlaybackRate = undefined;
    };
  }, []);

  const chromeClass =
    "pointer-events-none absolute left-3 top-3 z-10 max-w-[72vw] rounded-md bg-black/70 px-3 py-2 backdrop-blur transition-opacity duration-300 " +
    (showChrome ? "opacity-100" : "opacity-0");

  return (
    <main className="min-h-screen bg-black text-white" onClick={revealChrome}>
      <section className="relative min-h-screen w-full overflow-hidden bg-black">
        <div className={chromeClass}>
          <p className="text-[11px] font-extrabold text-emerald-300">XC-220 성경통독 거치대</p>
          <h1 className="mt-0.5 text-base font-black">{title}</h1>
          <p className="mt-1 text-[11px] font-bold text-white/75">현재 시간대 음악을 자동 재생합니다.</p>
        </div>

        <div id="youtube-shell" className="relative min-h-screen w-full bg-black">
          <div id="youtube-player" className="absolute inset-0 h-full w-full" />
          {(!isReady || !isPlaying) && (
            <button
              className="absolute inset-0 z-10 flex h-full w-full items-center justify-center bg-black/45 px-6"
              type="button"
              onClick={() => {
                applyYoutubePlaybackRate(playerRef.current);
                disableYoutubeCaptions(playerRef.current);
                playerRef.current?.playVideo?.();
                requestVideoFullscreen();
              }}
            >
              <span className="rounded-full bg-emerald-500 px-6 py-4 text-lg font-black shadow-xl shadow-black/40">
                {title} 재생
              </span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
