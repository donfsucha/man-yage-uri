import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LivingLifeWebStartPage from "./page";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";
vi.mock("@/lib/xcan/fullscreen", () => ({ requestVideoFullscreen: vi.fn() }));
vi.mock("@/lib/xcan/use-screen-wake-lock", () => ({ useScreenWakeLock: vi.fn() }));
const player = { playVideo: vi.fn(), loadVideoById: vi.fn(), getCurrentTime: () => 0, getPlayerState: () => -1, setPlaybackRate: vi.fn(), setOption: vi.fn(), unloadModule: vi.fn(), destroy: vi.fn() };
type Events = { onReady: (event: { target: typeof player }) => void; onStateChange: (event: { data: number; target: typeof player }) => void; onAutoplayBlocked: () => void; onError: () => void };
let events: Events;
beforeEach(() => {
  function FakePlayer(_id: string, options: { events: Events }) { events = options.events; return player; }
  Object.defineProperty(window, "YT", { configurable: true, value: { Player: FakePlayer, PlayerState: { ENDED: 0, PLAYING: 1 } } });
});
afterEach(() => { cleanup(); Reflect.deleteProperty(window, "YT"); Reflect.deleteProperty(window, "AndroidBot"); vi.clearAllMocks(); });
const ready = () => act(() => events.onReady({ target: player }));

describe("Living Life mobile playback", () => {
  it("waits for the player and keeps video controls free of a site button overlay", () => {
    const { container } = render(<LivingLifeWebStartPage />);
    const loadingButton = screen.getByRole("button", { name: "영상 준비 중…" });
    expect(loadingButton.hasAttribute("disabled")).toBe(true);
    fireEvent.click(loadingButton);
    expect(requestVideoFullscreen).not.toHaveBeenCalled();
    expect(container.querySelector("#youtube-shell button")).toBeNull();
  });
  it("keeps retry available until actual PLAYING, and restores it on pause", () => {
    render(<LivingLifeWebStartPage />);
    ready();
    fireEvent.click(screen.getByRole("button", { name: "▶ 생명의 삶 재생" }));
    expect(requestVideoFullscreen).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "▶ 생명의 삶 재생" })).toBeTruthy();
    act(() => events.onStateChange({ data: 1, target: player }));
    expect(screen.queryByRole("button", { name: "▶ 생명의 삶 재생" })).toBeNull();
    act(() => events.onStateChange({ data: 2, target: player }));
    expect(screen.getByRole("button", { name: "▶ 생명의 삶 재생" })).toBeTruthy();
  });
  it("offers retry and direct YouTube playback after autoplay is blocked or errors", () => {
    render(<LivingLifeWebStartPage />);
    ready();
    act(() => events.onAutoplayBlocked());
    expect(screen.getByRole("button", { name: "▶ 생명의 삶 재생" }).hasAttribute("disabled")).toBe(false);
    act(() => events.onError());
    expect(screen.getByRole("status").textContent).toContain("재생하지 못했습니다");
    expect(screen.getByRole("link", { name: "YouTube에서 보기" }).getAttribute("href")).toContain("youtube.com/watch?v=");
  });
});
