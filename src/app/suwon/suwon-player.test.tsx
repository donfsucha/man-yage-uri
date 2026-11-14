import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SuwonPlayer from "./suwon-player";
import { requestVideoFullscreen } from "@/lib/xcan/fullscreen";

vi.mock("@/lib/xcan/fullscreen", () => ({ requestVideoFullscreen: vi.fn() }));
vi.mock("@/lib/xcan/use-screen-wake-lock", () => ({ useScreenWakeLock: vi.fn() }));

afterEach(() => {
  cleanup();
  delete window.YT;
  vi.clearAllMocks();
});

describe("SuwonPlayer", () => {
  it("loads the selected video and requests fullscreen when playback starts", () => {
    const playVideo = vi.fn();
    const player = vi.fn(function () { return { playVideo, destroy: vi.fn() }; });
    window.YT = { Player: player, PlayerState: { PLAYING: 1, ENDED: 0 } } as unknown as typeof window.YT;
    render(<SuwonPlayer videoId="KNJ2booGUGU" />);

    expect(player).toHaveBeenCalledWith("youtube-player", expect.objectContaining({ videoId: "KNJ2booGUGU" }));
    fireEvent.click(screen.getByRole("button", { name: /새벽기도회 재생/ }));
    expect(requestVideoFullscreen).toHaveBeenCalled();
    expect(playVideo).toHaveBeenCalled();
  });
});
