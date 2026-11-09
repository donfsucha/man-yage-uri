import { afterEach, describe, expect, it, vi } from "vitest";
import { requestVideoFullscreen } from "./fullscreen";
afterEach(() => { Reflect.deleteProperty(window, "AndroidBot"); vi.unstubAllGlobals(); });
describe("best-effort fullscreen", () => {
  it("continues when the native bridge throws and orientation lock rejects", async () => {
    window.AndroidBot = { requestLandscapeFullscreen: () => { throw new Error("Bridge unavailable"); } };
    const lock = vi.fn().mockRejectedValue(new Error("Unsupported"));
    vi.stubGlobal("screen", { orientation: { lock } });
    expect(() => requestVideoFullscreen()).not.toThrow();
    await Promise.resolve();
    expect(lock).toHaveBeenCalledWith("landscape");
  });
});
