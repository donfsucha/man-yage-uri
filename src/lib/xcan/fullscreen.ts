type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type OrientationWithLock = ScreenOrientation & {
  lock?: (orientation: OrientationLockType) => Promise<void>;
};

type AndroidBotBridge = {
  requestLandscapeFullscreen?: () => void;
};

declare global {
  interface Window {
    AndroidBot?: AndroidBotBridge;
  }
}

export function requestVideoFullscreen(containerId = "youtube-shell") {
  if (typeof window === "undefined") return;

  window.AndroidBot?.requestLandscapeFullscreen?.();

  const target =
    (document.getElementById(containerId) as FullscreenCapableElement | null) ??
    (document.documentElement as FullscreenCapableElement);

  const requestFullscreen =
    target.requestFullscreen ?? target.webkitRequestFullscreen ?? target.msRequestFullscreen;

  try {
    const result = requestFullscreen?.call(target);
    if (result && typeof result.catch === "function") {
      result.catch(() => undefined);
    }
  } catch {
    // Browser policies may reject fullscreen outside a direct user gesture.
  }

  try {
    void (screen.orientation as OrientationWithLock | undefined)?.lock?.("landscape");
  } catch {
    // Orientation lock is best-effort and unsupported on several browsers.
  }
}
