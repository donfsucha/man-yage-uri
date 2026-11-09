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

  try {
    window.AndroidBot?.requestLandscapeFullscreen?.();
  } catch {
    // A native bridge failure must not prevent the browser from starting playback.
  }

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
    const result = (screen.orientation as OrientationWithLock | undefined)?.lock?.("landscape");
    if (result && typeof result.catch === "function") result.catch(() => undefined);
  } catch {
    // Orientation lock is best-effort and unsupported on several browsers.
  }
}
