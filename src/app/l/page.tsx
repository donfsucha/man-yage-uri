"use client";

import { useEffect, useRef, useState } from "react";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";
import { useScreenWakeLock } from "@/lib/xcan/use-screen-wake-lock";

const youtubeVideoId = "YmxPFiy0TG8";
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
  const [isXcanApp, setIsXcanApp] = useState(false);

  useScreenWakeLock(isReady);

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
            setPlaybackMessage("재생 버튼을 다시 누르거나 영상 안의 재생 버튼을 눌러 주세요.");
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
          setPlaybackMessage("재생 버튼을 다시 누르거나 영상 안의 재생 버튼을 눌러 주세요.");
        },
        onError: () => {
          setIsPlaying(false);
          setPlaybackMessage("영상을 재생하지 못했습니다. 새로고침 후 다시 눌러 주세요.");
        },
      };
      playerRef.current = new window.YT!.Player("youtube-player", {
        videoId: youtubeVideoId,
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
      tag.onerror = () => setPlaybackMessage("영상을 불러오지 못했습니다. 새로고침 후 다시 눌러 주세요.");
      document.body.appendChild(tag);
    }

    return () => {
      playerRef.current?.destroy?.();
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  const startVideo = () => {
    if (!isReady || !playerRef.current) {
      setPlaybackMessage("영상을 준비하고 있습니다. 잠시 후 다시 눌러 주세요.");
      return;
    }
    try {
      applyYoutubePlaybackRate(playerRef.current);
      playerRef.current.playVideo?.();
      requestVideoFullscreen();
      setPlaybackMessage("재생을 요청했습니다. 시작되지 않으면 영상 안의 재생 버튼을 눌러 주세요.");
    } catch {
      setPlaybackMessage("영상을 재생하지 못했습니다. 새로고침 후 다시 눌러 주세요.");
    }
  };

  return (
    <main className="h-dvh w-screen overflow-hidden bg-black text-white">
      <section
        id="youtube-shell"
        className="relative h-dvh w-screen overflow-hidden bg-black"
      >
        <div className="absolute inset-0 h-full w-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full">
          <div id="youtube-player" className="absolute inset-0 h-full w-full" />
        </div>
        {!isPlaying && (
          <div className="pointer-events-none absolute left-3 top-20 z-20 flex max-w-[min(85vw,32rem)] flex-col items-start gap-2">
            <button className="pointer-events-auto min-h-11 rounded-lg bg-emerald-500 px-5 py-3 text-base font-black shadow-lg disabled:opacity-60" type="button" disabled={!isReady} onClick={startVideo}>
              {isReady ? "▶ 생명의 삶 재생" : "영상 준비 중…"}
            </button>
            <p role="status" aria-live="polite" className="rounded-md bg-black/60 px-3 py-2 text-sm font-bold text-white">{playbackMessage}</p>
            {!isXcanApp && (
              <a className="pointer-events-auto rounded-lg bg-emerald-600/90 px-3 py-2 text-sm font-black text-white no-underline" href={playStoreUrl}>▼ Android 앱 다운로드</a>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
