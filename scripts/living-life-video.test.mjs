import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  findLatestLivingLifeVideo,
  replaceYoutubeVideoId,
  updateLivingLifeVideo,
} from "./living-life-video.mjs";

describe("Living Life video updater", () => {
  it("keeps the Living Life page copy free of replacement question marks", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "src", "app", "l", "page.tsx"),
      "utf8",
    );

    expect(pageSource).not.toMatch(/\{"[^"\n]*\?{2,}[^"\n]*"\}/);
  });

  it("selects the newest CGN Living Life QT video from the feed", () => {
    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>[다른 영상] 오늘의 소식</title>
          <link href="https://www.youtube.com/watch?v=ignore12345" />
        </entry>
        <entry>
          <title>[생명의 삶 큐티] 심판의 메시지에 담긴 구원 메시지 |나훔 1:9~15| 문영재 목사 | 260626QT</title>
          <link href="https://www.youtube.com/watch?v=o7cnQoct6EM" />
        </entry>
        <entry>
          <title>[생명의 삶 큐티] 진노의 날에 피난처 되신 하나님 |나훔 1:1~8| 문영재 목사 | 260625QT</title>
          <link href="https://www.youtube.com/watch?v=MgqDC8iJDG4" />
        </entry>
      </feed>`;

    expect(findLatestLivingLifeVideo(feedXml)).toEqual({
      title:
        "[생명의 삶 큐티] 심판의 메시지에 담긴 구원 메시지 |나훔 1:9~15| 문영재 목사 | 260626QT",
      url: "https://www.youtube.com/watch?v=o7cnQoct6EM",
      videoId: "o7cnQoct6EM",
    });
  });

  it("replaces only the configured YouTube video ID", () => {
    const source = `const youtubeVideoId = "MgqDC8iJDG4";
const title = "생명의 삶 영상";
`;

    expect(replaceYoutubeVideoId(source, "o7cnQoct6EM")).toBe(
      `const youtubeVideoId = "o7cnQoct6EM";
const title = "생명의 삶 영상";
`,
    );
  });
});

describe("CGN feed recovery", () => {
  const temporaryDirectories = [];
  const feedXml = `<feed><entry>
    <title>[\uC0DD\uBA85\uC758 \uC0B6 \uD050\uD2F0] 261018QT</title>
    <link href="https://www.youtube.com/watch?v=m53tT2h0Avs" />
  </entry></feed>`;

  function createPage() {
    const directory = mkdtempSync(join(tmpdir(), "living-life-video-"));
    temporaryDirectories.push(directory);
    const pagePath = join(directory, "page.tsx");
    writeFileSync(pagePath, 'const youtubeVideoId = "lds90VOD3Ek";\n');
    return pagePath;
  }

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("recovers from temporary 404 and 503 responses before updating the page", async () => {
    const pagePath = createPage();
    const waitImpl = vi.fn().mockResolvedValue(undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, text: async () => feedXml });

    const result = await updateLivingLifeVideo({ pagePath, fetchImpl, waitImpl });

    expect(result).toMatchObject({ videoId: "m53tT2h0Avs", changed: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(waitImpl.mock.calls.map(([delay]) => delay)).toEqual([1000, 2000]);
    expect(readFileSync(pagePath, "utf8")).toBe('const youtubeVideoId = "m53tT2h0Avs";\n');
  });

  it("retries a network error and leaves an already-current page unchanged", async () => {
    const pagePath = createPage();
    writeFileSync(pagePath, 'const youtubeVideoId = "m53tT2h0Avs";\n');
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ ok: true, text: async () => feedXml });

    const result = await updateLivingLifeVideo({
      pagePath, fetchImpl, waitImpl: vi.fn().mockResolvedValue(undefined),
    });

    expect(result.changed).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("stops after five failed attempts without changing the page", async () => {
    const pagePath = createPage();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const waitImpl = vi.fn().mockResolvedValue(undefined);

    await expect(updateLivingLifeVideo({ pagePath, fetchImpl, waitImpl }))
      .rejects.toThrow("HTTP 404");

    expect(fetchImpl).toHaveBeenCalledTimes(5);
    expect(waitImpl.mock.calls.map(([delay]) => delay)).toEqual([1000, 2000, 4000, 8000]);
    expect(readFileSync(pagePath, "utf8")).toBe('const youtubeVideoId = "lds90VOD3Ek";\n');
  });

  it("reports permanent HTTP errors without retrying or editing the page", async () => {
    const pagePath = createPage();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 403 });

    await expect(updateLivingLifeVideo({ pagePath, fetchImpl }))
      .rejects.toThrow("HTTP 403");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(readFileSync(pagePath, "utf8")).toBe('const youtubeVideoId = "lds90VOD3Ek";\n');
  });
});
