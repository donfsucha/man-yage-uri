import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScreenWakeLock } from "./use-screen-wake-lock";

describe("useScreenWakeLock", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  it("keeps the screen awake while enabled and releases it on cleanup", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const sentinel = {
      released: false,
      release,
      addEventListener: vi.fn(),
    };
    const request = vi.fn().mockResolvedValue(sentinel);

    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request },
    });

    const { unmount } = renderHook(() => useScreenWakeLock(true));

    await waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    unmount();

    expect(release).toHaveBeenCalledTimes(1);
  });
});
