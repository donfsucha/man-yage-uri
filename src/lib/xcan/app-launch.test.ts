import { describe, expect, it } from "vitest";
import { appPackageName, buildXcanPlayerIntentUrl } from "./app-launch";

describe("buildXcanPlayerIntentUrl", () => {
  it("uses the xcanplayer bible-start scheme so web fallback can open the installed app without Play Store", () => {
    const intentUrl = buildXcanPlayerIntentUrl("https://ifwe.cnanfc.com");

    expect(appPackageName).toBe("com.cnanfc.xcanplayer");
    expect(intentUrl).toBe(
      "intent://bible-start#Intent;" +
        "scheme=xcanplayer;" +
        "package=com.cnanfc.xcanplayer;" +
        "S.browser_fallback_url=https%3A%2F%2Fifwe.cnanfc.com%2Fstart%3Fweb%3D1;" +
        "end",
    );
    expect(intentUrl).not.toContain("play.google.com");
    expect(intentUrl).not.toContain("scheme=https");
  });
});