"use client";

import { useEffect, useRef } from "react";

type ScreenWakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (
    type: "release",
    listener: () => void,
    options?: AddEventListenerOptions,
  ) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<ScreenWakeLockSentinel>;
  };
};

export function useScreenWakeLock(enabled: boolean) {
  const sentinelRef = useRef<ScreenWakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let disposed = false;

    const releaseWakeLock = () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel && !sentinel.released) {
        void sentinel.release().catch(() => undefined);
      }
    };

    const requestWakeLock = async () => {
      if (
        disposed ||
        document.visibilityState !== "visible" ||
        sentinelRef.current
      ) {
        return;
      }

      const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
      if (!wakeLock) return;

      try {
        const sentinel = await wakeLock.request("screen");
        if (disposed) {
          await sentinel.release();
          return;
        }

        sentinelRef.current = sentinel;
        sentinel.addEventListener(
          "release",
          () => {
            if (sentinelRef.current === sentinel) sentinelRef.current = null;
          },
          { once: true },
        );
      } catch {
        // The browser can deny a wake lock for battery or permission reasons.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    const retryAfterUserAction = () => {
      void requestWakeLock();
    };

    void requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("pointerdown", retryAfterUserAction, { passive: true });

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("pointerdown", retryAfterUserAction);
      releaseWakeLock();
    };
  }, [enabled]);
}
